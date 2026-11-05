package ru.svdemidenko.sdcalculator.offline;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.view.View;
import android.view.WindowInsets;
import android.window.OnBackInvokedDispatcher;
import android.window.OnBackInvokedCallback;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;

/** Fully offline calculator. All web assets and tariff defaults are bundled in the APK. */
public final class MainActivity extends Activity {
    private static final String HOST = "sd.local";
    private WebView web;
    private OnBackInvokedCallback backCallback;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.WHITE);
        getWindow().setNavigationBarColor(Color.rgb(250, 251, 253));
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                return WindowInsets.CONSUMED;
            });
        } else root.setFitsSystemWindows(true);

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(250, 251, 253));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBlockNetworkLoads(true);
        web.addJavascriptInterface(new ClipboardBridge(), "AndroidClipboard");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOST.equals(request.getUrl().getHost());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (!"https".equals(request.getUrl().getScheme()) || !HOST.equals(request.getUrl().getHost())) return missing();
                String path = request.getUrl().getPath();
                if (path == null || path.contains("..") || path.contains("\\\\")) return missing();
                if (path.endsWith("/")) path += "index.html";
                try { return new WebResourceResponse(mime(path), "UTF-8", getAssets().open("web" + path)); }
                catch (IOException error) { return missing(); }
            }
        });
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        root.requestApplyInsets();
        web.loadUrl("https://" + HOST + "/");
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            backCallback = this::handleBack;
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, backCallback);
        }
    }
    public final class ClipboardBridge {
        @JavascriptInterface public void copy(String text) {
            runOnUiThread(() -> {
                ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                clipboard.setPrimaryClip(ClipData.newPlainText("SD", text));
            });
        }
    }
    private static WebResourceResponse missing() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
    private static String mime(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js")) return "application/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".ico")) return "image/x-icon";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".woff2")) return "font/woff2";
        if (path.endsWith(".json") || path.endsWith(".webmanifest")) return "application/json";
        return "application/octet-stream";
    }
    private void handleBack() { if (web != null && web.canGoBack()) web.goBack(); else finish(); }
    @Override public void onBackPressed() { handleBack(); }
    @Override protected void onDestroy() {
        if (android.os.Build.VERSION.SDK_INT >= 33 && backCallback != null) getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(backCallback);
        if (web != null) { web.removeJavascriptInterface("AndroidClipboard"); web.destroy(); }
        super.onDestroy();
    }
}