---
read_when:
    - macOS Canvas panelini uygulama
    - Görsel çalışma alanı için agent denetimleri ekleme
    - WKWebView Canvas yüklemelerinde hata ayıklama
summary: Özel URL şeması + WKWebView üzerinden gömülü agent kontrollü Canvas paneli
title: Canvas
x-i18n:
    generated_at: "2026-04-24T09:19:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

macOS uygulaması, `WKWebView` kullanarak agent kontrollü bir **Canvas paneli** gömer. Bu,
HTML/CSS/JS, A2UI ve küçük etkileşimli UI yüzeyleri için hafif bir görsel çalışma alanıdır.

## Canvas nerede bulunur

Canvas durumu Application Support altında saklanır:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas paneli bu dosyaları **özel bir URL şeması** üzerinden sunar:

- `openclaw-canvas://<session>/<path>`

Örnekler:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Kökte `index.html` yoksa uygulama **yerleşik bir iskelet sayfa** gösterir.

## Panel davranışı

- Menü çubuğuna (veya fare imlecine) yakın konumlanan çerçevesiz, yeniden boyutlandırılabilir panel.
- Oturum başına boyut/konumu hatırlar.
- Yerel canvas dosyaları değiştiğinde otomatik yeniden yüklenir.
- Aynı anda yalnızca bir Canvas paneli görünür durumdadır (gerektiğinde oturum değiştirilir).

Canvas, Settings → **Allow Canvas** içinden devre dışı bırakılabilir. Devre dışı olduğunda canvas
node komutları `CANVAS_DISABLED` döndürür.

## Agent API yüzeyi

Canvas, **Gateway WebSocket** üzerinden sunulur; böylece agent şunları yapabilir:

- paneli gösterme/gizleme
- bir yola veya URL'ye gitme
- JavaScript değerlendirme
- anlık görüntü alma

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

A2UI, Gateway canvas host tarafından barındırılır ve Canvas panelinin içinde işlenir.
Gateway bir Canvas host ilan ettiğinde macOS uygulaması, ilk açılışta otomatik olarak
A2UI host sayfasına gider.

Varsayılan A2UI host URL'si:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI komutları (v0.8)

Canvas şu anda **A2UI v0.8** server→client iletilerini kabul eder:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) desteklenmez.

CLI örneği:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Bunu okuyabiliyorsanız A2UI push çalışıyor demektir."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Hızlı smoke testi:

```bash
openclaw nodes canvas a2ui push --node <id> --text "A2UI'den merhaba"
```

## Canvas'tan agent çalıştırmalarını tetikleme

Canvas, derin bağlantılar aracılığıyla yeni agent çalıştırmalarını tetikleyebilir:

- `openclaw://agent?...`

Örnek (JS içinde):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Geçerli bir anahtar sağlanmadığı sürece uygulama onay ister.

## Güvenlik notları

- Canvas şeması dizin geçişini engeller; dosyalar oturum kökü altında bulunmalıdır.
- Yerel Canvas içeriği özel bir şema kullanır (local loopback sunucu gerekmez).
- Harici `http(s)` URL'lerine yalnızca açıkça gidildiğinde izin verilir.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [WebChat](/tr/web/webchat)
