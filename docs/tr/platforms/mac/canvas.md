---
read_when:
    - macOS Canvas panelinin uygulanması
    - Görsel çalışma alanı için ajan kontrolleri ekleme
    - WKWebView canvas yüklemelerinde hata ayıklama
summary: WKWebView + özel URL şeması aracılığıyla gömülü, ajan kontrollü Tuval paneli
title: Tuval
x-i18n:
    generated_at: "2026-05-06T09:21:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8e53f5d1c2e5b3b46e77cb74632e56123f3312dfcc395aa5ac8182c8d58b6cf
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS uygulaması, `WKWebView` kullanarak ajan kontrollü bir **Canvas paneli** gömer. HTML/CSS/JS, A2UI ve küçük etkileşimli UI yüzeyleri için hafif bir görsel çalışma alanıdır.

## Canvas'ın bulunduğu yer

Canvas durumu Application Support altında saklanır:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas paneli bu dosyaları **özel bir URL şeması** üzerinden sunar:

- `openclaw-canvas://<session>/<path>`

Örnekler:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Kökte `index.html` yoksa uygulama **yerleşik bir iskelet sayfası** gösterir.

## Panel davranışı

- Menü çubuğunun (veya fare imlecinin) yakınına sabitlenen, kenarlıksız ve yeniden boyutlandırılabilir panel.
- Oturum başına boyut/konumu hatırlar.
- Yerel canvas dosyaları değiştiğinde otomatik olarak yeniden yüklenir.
- Aynı anda yalnızca bir Canvas paneli görünür (oturum gerektiğinde değiştirilir).

Canvas, Ayarlar → **Canvas'a İzin Ver** üzerinden devre dışı bırakılabilir. Devre dışı bırakıldığında canvas node komutları `CANVAS_DISABLED` döndürür.

## Ajan API yüzeyi

Canvas, **Gateway WebSocket** üzerinden sunulur; böylece ajan şunları yapabilir:

- paneli gösterme/gizleme
- bir yola veya URL'ye gitme
- JavaScript değerlendirme
- anlık görüntü yakalama

CLI örnekleri:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Notlar:

- `canvas.navigate`, **yerel canvas yollarını**, `http(s)` URL'lerini ve `file://` URL'lerini kabul eder.
- `"/"` geçirirseniz Canvas yerel iskeleti veya `index.html` dosyasını gösterir.

## Canvas içinde A2UI

A2UI, Gateway canvas host'u tarafından barındırılır ve Canvas panelinin içinde işlenir. Gateway bir Canvas host'u duyurduğunda macOS uygulaması, ilk açılışta otomatik olarak A2UI host sayfasına gider.

Varsayılan A2UI host URL'si:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI komutları (v0.8)

Canvas şu anda **A2UI v0.8** sunucu→istemci iletilerini kabul eder:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) desteklenmez.

CLI örneği:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Hızlı smoke testi:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Canvas'tan ajan çalıştırmalarını tetikleme

Canvas, deep link'ler aracılığıyla yeni ajan çalıştırmaları tetikleyebilir:

- `openclaw://agent?...`

Örnek (JS içinde):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Geçerli bir anahtar sağlanmadığı sürece uygulama onay ister.

## Güvenlik notları

- Canvas şeması dizin geçişini engeller; dosyalar oturum kökünün altında bulunmalıdır.
- Yerel Canvas içeriği özel bir şema kullanır (local loopback sunucusu gerekmez).
- Harici `http(s)` URL'lerine yalnızca açıkça gidildiğinde izin verilir.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [WebChat](/tr/web/webchat)
