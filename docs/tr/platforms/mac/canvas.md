---
read_when:
    - macOS Canvas panelini uygulama
    - Görsel çalışma alanı için ajan denetimleri ekleme
    - WKWebView canvas yüklemelerinde hata ayıklama
summary: Ajan denetimli Canvas paneli, WKWebView + özel URL şeması aracılığıyla gömülü
title: Tuval
x-i18n:
    generated_at: "2026-06-28T00:48:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS uygulaması, `WKWebView` kullanarak ajan denetimli bir **Canvas paneli** gömer. Bu,
HTML/CSS/JS, A2UI ve küçük etkileşimli UI yüzeyleri için hafif bir görsel
çalışma alanıdır.

## Canvas’ın bulunduğu yer

Canvas durumu Application Support altında saklanır:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas paneli bu dosyaları bir **özel URL şeması** üzerinden sunar:

- `openclaw-canvas://<session>/<path>`

Örnekler:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Kökte `index.html` yoksa uygulama **yerleşik iskelet sayfası** gösterir.

## Panel davranışı

- Kenarlıksız, yeniden boyutlandırılabilir panel; menü çubuğunun (veya fare imlecinin) yakınına sabitlenir.
- Oturum başına boyutu/konumu hatırlar.
- Yerel canvas dosyaları değiştiğinde otomatik olarak yeniden yüklenir.
- Aynı anda yalnızca bir Canvas paneli görünür (oturum gerektiğinde değiştirilir).

Canvas, Settings → **Allow Canvas** üzerinden devre dışı bırakılabilir. Devre dışı bırakıldığında canvas
düğüm komutları `CANVAS_DISABLED` döndürür.

## Ajan API yüzeyi

Canvas, **Gateway WebSocket** üzerinden sunulur; böylece ajan şunları yapabilir:

- paneli gösterme/gizleme
- bir yola veya URL’ye gitme
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

- `canvas.navigate`, **yerel canvas yollarını**, `http(s)` URL’lerini ve `file://` URL’lerini kabul eder.
- `"/"` geçirirseniz Canvas, yerel iskeleti veya `index.html` dosyasını gösterir.

## Canvas’ta A2UI

A2UI, Gateway canvas ana makinesi tarafından barındırılır ve Canvas panelinin içinde işlenir.
Gateway bir Canvas ana makinesi duyurduğunda macOS uygulaması, ilk açılışta otomatik olarak
A2UI ana makine sayfasına gider.

Varsayılan A2UI ana makine URL’si:

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

## Canvas’tan ajan çalıştırmalarını tetikleme

Canvas, derin bağlantılar aracılığıyla yeni ajan çalıştırmaları tetikleyebilir:

- `openclaw://agent?...`

Örnek (JS içinde):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Desteklenen sorgu parametreleri:

- `message`: önceden doldurulmuş ajan istemi.
- `sessionKey`: kararlı oturum tanımlayıcısı.
- `thinking`: isteğe bağlı düşünme profili.
- `deliver`, `to` veya `channel`: teslim hedefi.
- `timeoutSeconds`: isteğe bağlı çalıştırma zaman aşımı.
- `key`: güvenilen yerel çağıranlar için uygulama tarafından oluşturulan güvenlik belirteci.

Geçerli bir anahtar sağlanmadıkça uygulama onay ister. Anahtarsız bağlantılar,
onaydan önce iletiyi ve URL’yi gösterir ve teslim yönlendirme alanlarını yok sayar;
anahtarlı bağlantılar normal Gateway çalıştırma yolunu kullanır.

## Güvenlik notları

- Canvas şeması dizin geçişini engeller; dosyalar oturum kökünün altında bulunmalıdır.
- Yerel Canvas içeriği özel bir şema kullanır (loopback sunucusu gerekmez).
- Harici `http(s)` URL’lerine yalnızca açıkça gidildiğinde izin verilir.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [WebChat](/tr/web/webchat)
