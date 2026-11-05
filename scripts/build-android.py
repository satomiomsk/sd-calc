#!/usr/bin/env python3
"""Build a locally signed standalone APK with official Android SDK tools (no Gradle)."""
import os
import shutil
import secrets
import xml.etree.ElementTree as ET
import subprocess
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from PIL import Image

project = Path(__file__).resolve().parents[1]
java = Path(os.environ['SD_ANDROID_JAVA_HOME'])
tools = Path(os.environ['SD_ANDROID_BUILD_TOOLS'])
platform = Path(os.environ['SD_ANDROID_PLATFORM'])
build = project / 'android/build'
res = build / 'res'
classes = build / 'classes'
dex = build / 'dex'
for directory in [res, classes, dex]:
    shutil.rmtree(directory, ignore_errors=True)
    directory.mkdir(parents=True, exist_ok=True)
manifest = ET.parse(project / 'android/AndroidManifest.xml').getroot()
namespace = '{http://schemas.android.com/apk/res/android}'
source = project / 'android/src' / Path(*manifest.attrib['package'].split('.')) / 'MainActivity.java'
env = dict(os.environ, JAVA_HOME=str(java), PATH=str(java / 'bin') + os.pathsep + os.environ['PATH'])
def run(*args):
    subprocess.run([str(arg) for arg in args], check=True, cwd=project, env=env)

# Keep private signing material outside the project and generated deliverables.
signing = Path.home() / '.local/share/commission-sd/signing'
signing.mkdir(parents=True, exist_ok=True, mode=0o700)
password = signing / 'password'
keystore = signing / 'release.p12'
if not password.exists():
    password.write_text(secrets.token_urlsafe(32))
    password.chmod(0o600)
if not keystore.exists():
    run(java / 'bin/keytool', '-genkeypair', '-keystore', keystore, '-storetype', 'PKCS12', '-alias', 'commission-sd', '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000', '-dname', 'CN=Commission SD, O=SD', '-storepass:file', password, '-keypass:file', password)
    keystore.chmod(0o600)

icon = Image.open(project / 'public/icons/sd-512.png').convert('RGBA')
for density, size in [('mdpi',48), ('hdpi',72), ('xhdpi',96), ('xxhdpi',144), ('xxxhdpi',192)]:
    folder = res / ('mipmap-' + density)
    folder.mkdir(exist_ok=True)
    icon.resize((size,size),Image.Resampling.LANCZOS).save(folder / 'ic_launcher.png')
run(tools / 'aapt2', 'compile', '--dir', res, '-o', build / 'resources.zip')
run(tools / 'aapt2', 'link', '-o', build / 'unsigned.apk', '-I', platform / 'android.jar', '--manifest', project / 'android/AndroidManifest.xml', '--auto-add-overlay', build / 'resources.zip')
run(java / 'bin/javac', '-encoding', 'UTF-8', '--release', '8', '-classpath', platform / 'android.jar', '-d', classes, source)
run(tools / 'd8', '--release', '--min-api', '26', '--lib', platform / 'android.jar', '--output', dex, *classes.rglob('*.class'))
with ZipFile(build / 'unsigned.apk', 'a', compression=ZIP_DEFLATED) as apk:
    apk.write(dex / 'classes.dex', 'classes.dex')
    for path in (build / 'assets').rglob('*'):
        if path.is_file():
            apk.write(path, 'assets/' + path.relative_to(build / 'assets').as_posix())
run(tools / 'zipalign', '-f', '-p', '4', build / 'unsigned.apk', build / 'aligned.apk')
version = manifest.attrib[namespace + 'versionName']
label = manifest.find('application').attrib[namespace + 'label'].replace(' | ', '-').replace(' ', '-')
output = project / f'android/output/{label}-{version}.apk'
output.parent.mkdir(exist_ok=True)
run(tools / 'apksigner', 'sign', '--ks', keystore, '--ks-key-alias', 'commission-sd', '--ks-pass', 'file:' + str(password), '--out', output, build / 'aligned.apk')
run(tools / 'apksigner', 'verify', '--verbose', output)
run(tools / 'zipalign', '-c', '4', output)
print('Готов APK:', output.name, '—', output.stat().st_size, 'байт')
