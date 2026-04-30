---
read_when:
    - Kanallarda akış veya parçalamanın nasıl çalıştığını açıklama
    - Blok akışını veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtlarında veya kanal önizleme akışında hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtları, kanal önizleme akışı, mod eşlemesi)
title: Akış ve parçalama
x-i18n:
    generated_at: "2026-04-30T09:18:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw iki ayrı akış katmanına sahiptir:

- **Blok akışı (kanallar):** asistan yazarken tamamlanmış **blokları** yayınlar. Bunlar normal kanal iletileridir (token deltaları değil).
- **Önizleme akışı (Telegram/Discord/Slack):** üretim sırasında geçici bir **önizleme iletisini** günceller.

Bugün kanal iletilerine yönelik **gerçek token-delta akışı** yoktur. Önizleme akışı ileti tabanlıdır (gönderme + düzenlemeler/eklemeler).

## Blok akışı (kanal iletileri)

Blok akışı, asistan çıktısını kullanılabilir oldukça kaba parçalar halinde gönderir.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Açıklama:

- `text_delta/events`: model akış olayları (akışsız modeller için seyrek olabilir).
- `chunker`: min/maks sınırları + kırılma tercihini uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden iletiler (blok yanıtları).

**Denetimler:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına varyantlar).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akıştaki blokları birleştirir).
- Kanal sabit üst sınırı: `*.textChunkLimit` (örn. `channels.whatsapp.textChunkLimit`).
- Kanal parça modu: `*.chunkMode` (`length` varsayılan, `newline` uzunluk parçalamadan önce boş satırlarda (paragraf sınırlarında) böler).
- Discord yumuşak sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), UI kırpmasını önlemek için yüksek yanıtları böler.

**Sınır semantiği:**

- `text_end`: chunker yayınladığı anda blokları akıt; her `text_end` üzerinde boşalt.
- `message_end`: asistan iletisi bitene kadar bekle, sonra arabelleğe alınmış çıktıyı boşalt.

`message_end`, arabelleğe alınmış metin `maxChars` değerini aşarsa yine chunker'ı kullanır; bu yüzden sonunda birden fazla parça yayınlayabilir.

### Blok akışıyla medya teslimi

`MEDIA:` yönergeleri normal teslimat meta verileridir. Blok akışı bir medya
bloğunu erken gönderdiğinde, OpenClaw bu teslimatı tur için hatırlar. Son
asistan payload'ı aynı medya URL'sini yinelerse, son teslimat eki tekrar
göndermek yerine yinelenen medyayı çıkarır.

Tamamen aynı olan son payload'lar bastırılır. Son payload, daha önce akıtılmış
medyanın etrafına farklı metin eklerse, OpenClaw medyayı tek teslimat olarak
tutarken yeni metni yine gönderir. Bu, bir agent akış sırasında `MEDIA:` yayınladığında
ve sağlayıcı bunu tamamlanmış yanıta da eklediğinde Telegram gibi kanallarda
yinelenen sesli notları veya dosyaları önler.

## Parçalama algoritması (alt/üst sınırlar)

Blok parçalama `EmbeddedBlockChunker` tarafından uygulanır:

- **Alt sınır:** arabellek >= `minChars` olana kadar yayınlama (zorlanmadıkça).
- **Üst sınır:** `maxChars` öncesinde bölmeyi tercih et; zorlanırsa `maxChars` noktasında böl.
- **Kırılma tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kırılma.
- **Kod çitleri:** çitlerin içinde asla bölme; `maxChars` noktasında zorlanırsa Markdown'ı geçerli tutmak için çiti kapat + yeniden aç.

`maxChars`, kanal `textChunkLimit` değerine sabitlenir; bu nedenle kanal başına sınırları aşamazsınız.

## Birleştirme (akıştaki blokları birleştirme)

Blok akışı etkinleştirildiğinde, OpenClaw art arda gelen **blok parçalarını**
göndermeden önce birleştirebilir. Bu, ilerlemeli çıktı sağlamaya devam ederken
"tek satırlık spam" miktarını azaltır.

- Birleştirme, boşaltmadan önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Arabellekler `maxChars` ile sınırlandırılır ve bu değeri aşarlarsa boşaltılır.
- `minChars`, yeterli metin birikene kadar küçük parçaların gönderilmesini önler
  (son boşaltma kalan metni her zaman gönderir).
- Birleştirici `blockStreamingChunk.breakPreference` değerinden türetilir
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` üzerinden kullanılabilir (hesap başına yapılandırmalar dahil).
- Varsayılan birleştirme `minChars` değeri, geçersiz kılınmadıkça Signal/Slack/Discord için 1500'e yükseltilir.

## Bloklar arasında insana benzer zamanlama

Blok akışı etkinleştirildiğinde, blok yanıtları arasına (ilk bloktan sonra)
**rastgeleleştirilmiş duraklama** ekleyebilirsiniz. Bu, çok baloncuklu yanıtların
daha doğal hissettirmesini sağlar.

- Yapılandırma: `agents.defaults.humanDelay` (agent başına `agents.list[].humanDelay` ile geçersiz kılın).
- Modlar: `off` (varsayılan), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtlarına** uygulanır; son yanıtlara veya araç özetlerine uygulanmaz.

## "Parçaları akıt veya her şeyi akıt"

Bu şu anlama gelir:

- **Parçaları akıt:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ilerledikçe yayınla). Telegram dışındaki kanallar ayrıca `*.blockStreaming: true` gerektirir.
- **Her şeyi sonunda akıt:** `blockStreamingBreak: "message_end"` (bir kez boşalt, çok uzunsa muhtemelen birden fazla parça).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

**Kanal notu:** `*.blockStreaming` açıkça `true` olarak ayarlanmadıkça
blok akışı **kapalıdır**. Kanallar, blok yanıtları olmadan canlı önizleme
(`channels.<channel>.streaming`) akıtabilir.

Yapılandırma konumu hatırlatması: `blockStreaming*` varsayılanları kök yapılandırmada
değil, `agents.defaults` altında bulunur.

## Önizleme akışı modları

Kanonik anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırakır.
- `partial`: en son metinle değiştirilen tek önizleme.
- `block`: önizleme, parçalı/eklenen adımlarla güncellenir.
- `progress`: üretim sırasında ilerleme/durum önizlemesi, tamamlanınca son yanıt.

### Kanal eşlemesi

| Kanal      | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | ✅    | ✅        | ✅      | `partial` ile eşleşir |
| Discord    | ✅    | ✅        | ✅      | `partial` ile eşleşir |
| Slack      | ✅    | ✅        | ✅      | ✅                  |
| Mattermost | ✅    | ✅        | ✅      | ✅                  |

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda Slack yerel akış API çağrılarını açıp kapatır (varsayılan: `true`).
- Slack yerel akışı ve Slack asistan iş parçacığı durumu bir yanıt iş parçacığı hedefi gerektirir; üst düzey DM'ler bu iş parçacığı tarzı önizlemeyi göstermez.

Eski anahtar geçişi:

- Telegram: eski `streamMode` ve skaler/boolean `streaming` değerleri algılanır ve doctor/config uyumluluk yolları tarafından `streaming.mode` değerine geçirilir.
- Discord: `streamMode` + boolean `streaming`, `streaming` enum değerine otomatik geçirilir.
- Slack: `streamMode`, `streaming.mode` değerine otomatik geçirilir; boolean `streaming`, `streaming.mode` artı `streaming.nativeTransport` değerine otomatik geçirilir; eski `nativeStreaming`, `streaming.nativeTransport` değerine otomatik geçirilir.

### Çalışma zamanı davranışı

Telegram:

- DM'ler ve grup/konular genelinde `sendMessage` + `editMessageText` önizleme güncellemelerini kullanır.
- Telegram'ın zaman damgası yanıtın tamamlanmasını yansıtsın diye, bir önizleme yaklaşık bir dakika görünür kaldığında yerinde düzenlemek yerine yeni bir son ileti gönderir, ardından önizlemeyi temizler.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çift akışı önlemek için).
- `/reasoning stream`, gerekçelendirmeyi önizlemeye yazabilir.

Discord:

- Gönderme + düzenleme önizleme iletilerini kullanır.
- `block` modu taslak parçalamayı (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.
- Son medya, hata ve açık yanıt payload'ları bekleyen önizlemeleri yeni bir taslak boşaltmadan iptal eder, ardından normal teslimatı kullanır.

Slack:

- `partial`, kullanılabiliyorsa Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, ekleme tarzı taslak önizlemeleri kullanır.
- `progress`, durum önizleme metnini, ardından son yanıtı kullanır.
- Yerel ve taslak önizleme akışı, o tur için blok yanıtlarını bastırır; böylece bir Slack yanıtı yalnızca tek bir teslimat yolundan akıtılır.
- Son medya/hata payload'ları ve ilerleme sonları, atılacak taslak iletiler oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok sonları bekleyen taslak metni boşaltır.

Mattermost:

- Düşünmeyi, araç etkinliğini ve kısmi yanıt metnini, son yanıt güvenle gönderilebildiğinde yerinde sonlandırılan tek bir taslak önizleme gönderisine akıtır.
- Sonlandırma sırasında önizleme gönderisi silinmişse veya başka şekilde kullanılamıyorsa yeni bir son gönderi göndermeye geri döner.
- Son medya/hata payload'ları, geçici bir önizleme gönderisini boşaltmak yerine normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder.

Matrix:

- Taslak önizlemeler, son metin önizleme olayını yeniden kullanabildiğinde yerinde sonlandırılır.
- Yalnızca medya, hata ve yanıt-hedefi-uyuşmazlığı sonları, normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder; zaten görünür olan bayat bir önizleme redakte edilir.

### Araç ilerlemesi önizleme güncellemeleri

Önizleme akışı, araçlar çalışırken son yanıttan önce aynı önizleme iletisinde görünen,
"web'de arama yapılıyor", "dosya okunuyor" veya "araç çağrılıyor" gibi kısa durum
satırları olan **araç ilerlemesi** güncellemelerini de içerebilir. Bu, çok adımlı
araç turlarını ilk düşünme önizlemesi ile son yanıt arasında sessiz bırakmak yerine
görsel olarak canlı tutar.

Desteklenen yüzeyler:

- **Discord**, **Slack**, **Telegram** ve **Matrix**, önizleme akışı etkin olduğunda araç ilerlemesini varsayılan olarak canlı önizleme düzenlemesine akıtır.
- Telegram, `v2026.4.22` sürümünden beri araç ilerlemesi önizleme güncellemeleri etkin olarak yayımlanmıştır; bunları etkin tutmak yayımlanan davranışı korur.
- **Mattermost**, araç etkinliğini zaten tek taslak önizleme gönderisine dahil eder (yukarıya bakın).
- Araç ilerlemesi düzenlemeleri etkin önizleme akışı modunu izler; önizleme akışı `off` olduğunda veya blok akışı iletiyi devraldığında atlanır. Telegram'da `streaming.mode: "off"` yalnızca sondur: genel ilerleme sohbeti, bağımsız "Çalışıyor..." iletileri olarak teslim edilmek yerine bastırılır; onay istemleri, medya payload'ları ve hatalar ise normal şekilde yönlendirilir.
- Önizleme akışını koruyup araç ilerlemesi satırlarını gizlemek için, o kanal için `streaming.preview.toolProgress` değerini `false` olarak ayarlayın. Önizleme düzenlemelerini tamamen devre dışı bırakmak için `streaming.mode` değerini `off` olarak ayarlayın.

Örnek:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## İlgili

- [İletiler](/tr/concepts/messages) — ileti yaşam döngüsü ve teslimat
- [Yeniden deneme](/tr/concepts/retry) — teslimat hatasında yeniden deneme davranışı
- [Kanallar](/tr/channels) — kanal başına akış desteği
