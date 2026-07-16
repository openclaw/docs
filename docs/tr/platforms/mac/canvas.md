---
read_when:
    - macOS Canvas panelini uygulama
    - Görsel çalışma alanı için aracı denetimleri ekleme
    - WKWebView tuval yüklemelerinde hata ayıklama
summary: WKWebView + özel URL şeması aracılığıyla yerleştirilmiş, agent tarafından kontrol edilen Canvas paneli
title: Tuval
x-i18n:
    generated_at: "2026-07-16T17:18:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS uygulaması; HTML/CSS/JS, A2UI ve küçük etkileşimli kullanıcı arayüzü
yüzeyleri için hafif bir görsel çalışma alanı olan `WKWebView` kullanarak, temsilci tarafından kontrol edilen bir **Canvas paneli** yerleştirir.

## Canvas'ın bulunduğu yer

Canvas durumu Application Support altında saklanır:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas paneli bu dosyaları özel bir URL şeması olan
`openclaw-canvas://<session>/<path>` üzerinden sunar:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Kökte `index.html` yoksa uygulama yerleşik bir başlangıç sayfası gösterir.

## Panel davranışı

- Menü çubuğunun (veya fare imlecinin) yakınına sabitlenen, kenarlıksız ve yeniden boyutlandırılabilir panel.
- Her oturum için boyutu/konumu hatırlar.
- Yerel canvas dosyaları değiştiğinde otomatik olarak yeniden yüklenir.
- Aynı anda yalnızca bir Canvas paneli görünür (gerektiğinde oturum değiştirilir).

Canvas, Settings -> **Allow Canvas** üzerinden devre dışı bırakılabilir. Devre dışı
bırakıldığında canvas Node komutları `CANVAS_DISABLED` döndürür.

## Temsilci API yüzeyi

Canvas, Gateway WebSocket üzerinden kullanıma sunulur; böylece temsilci paneli
gösterebilir/gizleyebilir, bir yola veya URL'ye gidebilir, JavaScript
değerlendirebilir ve anlık görüntü yakalayabilir:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate`; yerel canvas yollarını, `http(s)` URL'lerini ve `file://`
URL'lerini kabul eder. `"/"` iletildiğinde yerel başlangıç sayfası veya `index.html` gösterilir.

`/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` altındaki Gateway tarafından barındırılan
hedefler, Node oturumunun geçerli kapsamlı Canvas URL'si üzerinden çözümlenir.
Uygulama, gezinmeden önce bu kısa ömürlü yeteneği yeniler; bir yetenek URL'sini
kendiniz oluşturmanız veya kopyalamanız gerekmez.

## Canvas'ta A2UI

A2UI, Gateway canvas ana bilgisayarı tarafından barındırılır ve Canvas
panelinin içinde işlenir. Gateway bir Canvas ana bilgisayarı bildirdiğinde macOS
uygulaması, ilk açılışta otomatik olarak A2UI ana bilgisayar sayfasına gider.

Bildirilen URL yetenek kapsamlıdır; örneğin
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Bunu kararlı bir bağlantı olarak değil, geçici kimlik bilgileri olarak değerlendirin.

### A2UI komutları (v0.8)

Canvas, A2UI v0.8 sunucudan istemciye iletilerini kabul eder: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9)
henüz desteklenmemektedir.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Bunu okuyabiliyorsanız A2UI gönderimi çalışıyor."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Hızlı duman testi:

```bash
openclaw nodes canvas a2ui push --node <id> --text "A2UI'dan merhaba"
```

## Canvas'tan temsilci çalıştırmalarını tetikleme

Canvas, `openclaw://agent?...` derin bağlantıları aracılığıyla yeni temsilci çalıştırmaları
tetikleyebilir:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Desteklenen sorgu parametreleri:

| Parametre                  | Anlamı                                                |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | Önceden doldurulmuş temsilci istemi.                  |
| `sessionKey`               | Kararlı oturum tanımlayıcısı.                         |
| `thinking`                 | İsteğe bağlı düşünme profili.                         |
| `deliver`, `to`, `channel` | Teslimat hedefi.                                      |
| `timeoutSeconds`           | İsteğe bağlı çalıştırma zaman aşımı.                  |
| `key`                      | Güvenilir yerel çağıranlar için uygulama tarafından oluşturulan güvenlik belirteci. |

Geçerli bir anahtar sağlanmadığı sürece uygulama onay ister. Anahtarsız
bağlantılar, onaydan önce iletiyi ve URL'yi gösterir ve teslimat yönlendirme
alanlarını yok sayar; anahtarlı bağlantılar normal Gateway çalıştırma yolunu kullanır.

## Güvenlik notları

- Canvas şeması dizin geçişini engeller; dosyalar oturum kökü altında bulunmalıdır.
- Yerel Canvas içeriği özel bir şema kullanır (geri döngü sunucusu gerekmez).
- Harici `http(s)` URL'lerine yalnızca açıkça gidildiğinde izin verilir.
- Sıradan web sayfaları yalnızca görüntülenir. Temsilci eylemleri yalnızca
  uygulamaya ait Canvas şemasından veya uygulamanın seçtiği, tam olarak yetenek
  kapsamlı Gateway A2UI belgesinden kabul edilir; alt çerçeveler, yönlendirmeler,
  eski yetenekler ve değiştirilmiş sorgular eylem gönderemez.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [WebChat](/tr/web/webchat)
