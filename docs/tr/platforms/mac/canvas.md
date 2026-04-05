---
read_when:
    - macOS Canvas paneli uygulanırken
    - görsel çalışma alanı için aracı kontrolleri eklenirken
    - WKWebView canvas yüklemelerinde hata ayıklarken
summary: WKWebView + özel URL şeması ile gömülü, aracı tarafından kontrol edilen Canvas paneli
title: Canvas
x-i18n:
    generated_at: "2026-04-05T14:00:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1
    source_path: platforms/mac/canvas.md
    workflow: 15
---

# Canvas (macOS uygulaması)

macOS uygulaması, `WKWebView` kullanarak aracı tarafından kontrol edilen bir **Canvas paneli** gömer. Bu, HTML/CSS/JS, A2UI ve küçük etkileşimli UI yüzeyleri için hafif bir görsel çalışma alanıdır.

## Canvas'ın bulunduğu yer

Canvas durumu Application Support altında depolanır:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas paneli bu dosyaları bir **özel URL şeması** üzerinden sunar:

- `openclaw-canvas://<session>/<path>`

Örnekler:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Kökte `index.html` yoksa uygulama **yerleşik bir iskele sayfası** gösterir.

## Panel davranışı

- Menü çubuğunun (veya fare imlecinin) yakınında konumlanan çerçevesiz, yeniden boyutlandırılabilir panel.
- Oturum başına boyutu/konumu hatırlar.
- Yerel canvas dosyaları değiştiğinde otomatik olarak yeniden yüklenir.
- Aynı anda yalnızca bir Canvas paneli görünür durumdadır (gerektikçe oturum değiştirilir).

Canvas, Ayarlar → **Allow Canvas** bölümünden devre dışı bırakılabilir. Devre dışı bırakıldığında canvas düğüm komutları `CANVAS_DISABLED` döndürür.

## Aracı API yüzeyi

Canvas, **Gateway WebSocket** üzerinden sunulur; böylece aracı şunları yapabilir:

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
- `"/"` geçirirseniz Canvas yerel iskeleyi veya `index.html` dosyasını gösterir.

## Canvas içinde A2UI

A2UI, Gateway canvas host tarafından barındırılır ve Canvas panelinin içinde işlenir. Gateway bir Canvas host duyurduğunda, macOS uygulaması ilk açılışta otomatik olarak A2UI host sayfasına gider.

Varsayılan A2UI host URL'si:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI komutları (v0.8)

Canvas şu anda **A2UI v0.8** sunucu→istemci mesajlarını kabul eder:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) desteklenmez.

CLI örneği:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Bunu okuyabiliyorsanız, A2UI itmesi çalışıyor."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Hızlı kontrol:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Canvas'tan aracı çalıştırmalarını tetikleme

Canvas, derin bağlantılar aracılığıyla yeni aracı çalıştırmalarını tetikleyebilir:

- `openclaw://agent?...`

Örnek (JS içinde):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Geçerli bir anahtar sağlanmadıkça uygulama onay ister.

## Güvenlik notları

- Canvas şeması dizin geçişini engeller; dosyaların oturum kökü altında bulunması gerekir.
- Yerel Canvas içeriği özel bir şema kullanır (loopback sunucusu gerekmez).
- Harici `http(s)` URL'lerine yalnızca açıkça gidildiğinde izin verilir.
