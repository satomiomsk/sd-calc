# SD | Расчёты — автономная Android-версия

Отдельное приложение: `ru.svdemidenko.sdcalculator.offline`.
Оно не использует Netlify, Supabase, интернет-доступ или удалённые API.

## Поведение
- Все четыре калькулятора и тарифы собираются внутрь APK.
- Тарифы берутся из `lib/tariffs.ts` на момент сборки.
- Для изменения тарифов требуется выпустить и установить новый APK.
- Старое приложение с прежним идентификатором можно оставить рядом.

## Сборка
1. Установить Node.js, зависимости проекта и Android SDK Build Tools + Android Platform.
2. Выполнить `npm install`.
3. Установить Pillow для Python: `python -m pip install Pillow`.
4. Указать переменные окружения:
   - `SD_ANDROID_JAVA_HOME` — каталог JDK;
   - `SD_ANDROID_BUILD_TOOLS` — каталог Android SDK Build Tools;
   - `SD_ANDROID_PLATFORM` — каталог Android SDK Platforms, например `android-35`.
5. Выполнить:
   ```bash
   node scripts/build-android-web.mjs
   python scripts/build-android.py
   ```
6. APK появится в `android/output/`.

Ключ подписи создаётся локально в `~/.local/share/commission-sd/signing/`. Сохраните его: без прежнего ключа последующие APK не смогут обновлять эту отдельную установку поверх существующей.

## Проверка офлайн
Установить APK, включить авиарежим и проверить каждый калькулятор, переключение экранов, шрифты, логотип и копирование результата.
