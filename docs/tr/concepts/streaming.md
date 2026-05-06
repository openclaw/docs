---
read_when:
    - Kanallarda akışın veya parçalamanın nasıl çalıştığını açıklama
    - Blok akışı veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtlarında veya kanal önizleme akışında hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtları, kanal önizleme akışı, mod eşlemesi)
title: Akış ve parçalama
x-i18n:
    generated_at: "2026-05-06T09:10:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw iki ayrı akış katmanına sahiptir:

- **Blok akışı (kanallar):** asistan yazarken tamamlanmış **blokları** yayar. Bunlar normal kanal mesajlarıdır (token deltaları değil).
- **Önizleme akışı (Telegram/Discord/Slack):** üretim sırasında geçici bir **önizleme mesajını** günceller.

Bugün kanal mesajlarına yönelik **gerçek token-delta akışı** yoktur. Önizleme akışı mesaj tabanlıdır (gönderme + düzenlemeler/eklemeler).

## Blok akışı (kanal mesajları)

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
- `chunker`: min/maks sınırlar + kesme tercihi uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden mesajlar (blok yanıtları).

**Kontroller:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına varyantlar).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akan blokları birleştirir).
- Kanal sabit üst sınırı: `*.textChunkLimit` (ör. `channels.whatsapp.textChunkLimit`).
- Kanal parça modu: `*.chunkMode` (varsayılan `length`, `newline` uzunluğa göre parçalamadan önce boş satırlardan (paragraf sınırları) böler).
- Discord yumuşak sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), kullanıcı arayüzünde kırpılmayı önlemek için uzun yanıtları böler.

**Sınır semantiği:**

- `text_end`: chunker yayar yaymaz blokları akıt; her `text_end` üzerinde boşalt.
- `message_end`: asistan mesajı bitene kadar bekle, ardından arabellekteki çıktıyı boşalt.

Arabellekteki metin `maxChars` değerini aşarsa `message_end` yine chunker kullanır; bu nedenle sonunda birden çok parça yayabilir.

### Blok akışıyla medya teslimi

`MEDIA:` yönergeleri normal teslim meta verileridir. Blok akışı bir medya bloğunu erken gönderdiğinde OpenClaw bu teslimi tur için hatırlar. Son asistan yükü aynı medya URL'sini tekrar ederse son teslim, eki yeniden göndermek yerine yinelenen medyayı çıkarır.

Tam yinelenen son yükler bastırılır. Son yük, zaten akıtılmış medyanın çevresine farklı metin eklerse OpenClaw yine de yeni metni gönderir ve medyanın tek teslim edilmesini korur. Bu, bir ajanın akış sırasında `MEDIA:` yaydığı ve sağlayıcının da bunu tamamlanmış yanıta eklediği Telegram gibi kanallarda yinelenen sesli notları veya dosyaları önler.

## Parçalama algoritması (alt/üst sınırlar)

Blok parçalama `EmbeddedBlockChunker` tarafından uygulanır:

- **Alt sınır:** arabellek >= `minChars` olana kadar yayma (zorlanmadıkça).
- **Üst sınır:** `maxChars` öncesinde bölmeyi tercih et; zorlanırsa `maxChars` noktasında böl.
- **Kesme tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kesme.
- **Kod çitleri:** çitlerin içinde asla bölme; `maxChars` noktasında zorunlu bölme yaparken Markdown geçerli kalsın diye çiti kapat + yeniden aç.

`maxChars` kanalın `textChunkLimit` değerine sıkıştırılır, bu nedenle kanal başına sınırları aşamazsınız.

## Birleştirme (akan blokları birleştir)

Blok akışı etkinleştirildiğinde OpenClaw, göndermeden önce **ardışık blok parçalarını birleştirebilir**. Bu, ilerlemeli çıktı sağlamayı sürdürürken "tek satırlık spam"i azaltır.

- Birleştirme, boşaltmadan önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Arabellekler `maxChars` ile sınırlandırılır ve bunu aşarsa boşaltılır.
- `minChars`, yeterli metin birikene kadar küçük parçaların gönderilmesini önler (son boşaltma her zaman kalan metni gönderir).
- Birleştirici `blockStreamingChunk.breakPreference` değerinden türetilir (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` üzerinden kullanılabilir (hesap başına yapılandırmalar dahil).
- Varsayılan birleştirme `minChars` değeri, geçersiz kılınmadıkça Signal/Slack/Discord için 1500'e yükseltilir.

## Bloklar arasında insan benzeri tempo

Blok akışı etkinleştirildiğinde, blok yanıtları arasına (ilk bloktan sonra) **rastgeleleştirilmiş bir duraklama** ekleyebilirsiniz. Bu, çok baloncuklu yanıtların daha doğal hissettirmesini sağlar.

- Yapılandırma: `agents.defaults.humanDelay` (ajan başına `agents.list[].humanDelay` ile geçersiz kılınır).
- Modlar: `off` (varsayılan), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtlarına** uygulanır; son yanıtlara veya araç özetlerine uygulanmaz.

## "Parçaları veya her şeyi akıt"

Bu şu şekilde eşlenir:

- **Parçaları akıt:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ilerledikçe yay). Telegram dışı kanallar ayrıca `*.blockStreaming: true` gerektirir.
- **Her şeyi sonda akıt:** `blockStreamingBreak: "message_end"` (bir kez boşalt, çok uzunsa muhtemelen birden çok parça).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

**Kanal notu:** `*.blockStreaming` açıkça `true` olarak ayarlanmadıkça blok akışı **kapalıdır**. Kanallar, blok yanıtları olmadan canlı önizleme akışı (`channels.<channel>.streaming`) yapabilir.

Yapılandırma konumu hatırlatması: `blockStreaming*` varsayılanları kök yapılandırmada değil, `agents.defaults` altında bulunur.

## Önizleme akışı modları

Kanonik anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırak.
- `partial`: en son metinle değiştirilen tek önizleme.
- `block`: önizleme parçalanmış/eklenmiş adımlarla güncellenir.
- `progress`: üretim sırasında ilerleme/durum önizlemesi, tamamlandığında son yanıt.

`streaming.mode: "block"`, Discord ve Telegram gibi düzenleme yapabilen kanallar için bir önizleme akışı modudur. Orada kanal blok teslimini etkinleştirmez. Normal blok yanıtları istediğinizde `streaming.block.enabled` veya eski `blockStreaming` kanal anahtarını kullanın. Microsoft Teams istisnadır: taslak-önizleme blok aktarımı yoktur, bu nedenle `streaming.mode: "block"` yerel kısmi/ilerleme akışı yerine Teams blok teslimine eşlenir.

### Kanal eşlemesi

| Kanal      | `off` | `partial` | `block` | `progress`                 |
| ---------- | ----- | --------- | ------- | -------------------------- |
| Telegram   | ✅    | ✅        | ✅      | düzenlenebilir ilerleme taslağı |
| Discord    | ✅    | ✅        | ✅      | düzenlenebilir ilerleme taslağı |
| Slack      | ✅    | ✅        | ✅      | ✅                         |
| Mattermost | ✅    | ✅        | ✅      | ✅                         |
| MS Teams   | ✅    | ✅        | ✅      | yerel ilerleme akışı       |

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda Slack yerel akış API çağrılarını açıp kapatır (varsayılan: `true`).
- Slack yerel akışı ve Slack asistan iş parçacığı durumu bir yanıt iş parçacığı hedefi gerektirir. Üst düzey DM'ler bu iş parçacığı tarzı önizlemeyi göstermez, ancak yine de Slack taslak önizleme gönderilerini ve düzenlemelerini kullanabilirler.

Eski anahtar geçişi:

- Telegram: eski `streamMode` ve skaler/boolean `streaming` değerleri algılanır ve doctor/yapılandırma uyumluluk yolları tarafından `streaming.mode` değerine geçirilir.
- Discord: `streamMode` + boolean `streaming` otomatik olarak `streaming` enum'una geçirilir.
- Slack: `streamMode` otomatik olarak `streaming.mode` değerine geçirilir; boolean `streaming` otomatik olarak `streaming.mode` ile `streaming.nativeTransport` değerlerine geçirilir; eski `nativeStreaming` otomatik olarak `streaming.nativeTransport` değerine geçirilir.

### Çalışma zamanı davranışı

Telegram:

- DM'ler ve grup/konular genelinde önizleme güncellemeleri için `sendMessage` + `editMessageText` kullanır.
- Son metin etkin önizlemeyi yerinde düzenler; uzun son yanıtlar ilk parça için o mesajı yeniden kullanır ve yalnızca kalan parçaları gönderir.
- `progress` modu araç ilerlemesini düzenlenebilir bir durum taslağında tutar, tamamlandığında bu taslağı temizler ve son yanıtı normal teslim üzerinden gönderir.
- Tamamlanmış metin doğrulanmadan önce son düzenleme başarısız olursa OpenClaw normal son teslimi kullanır ve bayat önizlemeyi temizler.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çift akışı önlemek için).
- `/reasoning stream`, son teslimden sonra silinen geçici bir önizlemeye akıl yürütmeyi yazabilir.

Discord:

- Önizleme mesajlarında gönderme + düzenleme kullanır.
- `block` modu taslak parçalamayı (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.
- Son medya, hata ve açık-yanıt yükleri bekleyen önizlemeleri yeni bir taslak boşaltmadan iptal eder, ardından normal teslimi kullanır.

Slack:

- `partial`, kullanılabilir olduğunda Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, ekleme tarzı taslak önizlemeleri kullanır.
- `progress`, durum önizleme metnini, ardından son yanıtı kullanır.
- Yanıt iş parçacığı olmayan üst düzey DM'ler, Slack yerel akışı yerine taslak önizleme gönderileri ve düzenlemeleri kullanır.
- Yerel ve taslak önizleme akışı, o tur için blok yanıtlarını bastırır; böylece bir Slack yanıtı yalnızca tek bir teslim yolu tarafından akıtılır.
- Son medya/hata yükleri ve ilerleme sonları tek kullanımlık taslak mesajlar oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok sonları bekleyen taslak metni boşaltır.

Mattermost:

- Düşünmeyi, araç etkinliğini ve kısmi yanıt metnini, son yanıtın gönderilmesi güvenli olduğunda yerinde sonlandırılan tek bir taslak önizleme gönderisine akıtır.
- Önizleme gönderisi silinmişse veya sonlandırma sırasında başka şekilde kullanılamıyorsa yeni bir son gönderi göndermeye geri döner.
- Son medya/hata yükleri, geçici bir önizleme gönderisini boşaltmak yerine normal teslimden önce bekleyen önizleme güncellemelerini iptal eder.

Matrix:

- Taslak önizlemeler, son metin önizleme olayını yeniden kullanabildiğinde yerinde sonlandırılır.
- Yalnızca medya, hata ve yanıt-hedefi-uyuşmazlığı sonları normal teslimden önce bekleyen önizleme güncellemelerini iptal eder; zaten görünür olan bayat önizleme geri alınır.

### Araç ilerleme önizleme güncellemeleri

Önizleme akışı ayrıca, araçlar çalışırken aynı önizleme mesajında son yanıttan önce görünen "web'de arama yapılıyor", "dosya okunuyor" veya "araç çağrılıyor" gibi kısa durum satırları olan **araç ilerleme** güncellemelerini de içerebilir. Bu, çok adımlı araç turlarını ilk düşünme önizlemesi ile son yanıt arasında sessiz kalmak yerine görsel olarak canlı tutar.

Desteklenen yüzeyler:

- **Discord**, **Slack**, **Telegram** ve **Matrix**, önizleme akışı etkinken varsayılan olarak araç ilerlemesini canlı önizleme düzenlemesine aktarır. Microsoft Teams kişisel sohbetlerde kendi yerel ilerleme akışını kullanır.
- Telegram, `v2026.4.22` sürümünden beri araç ilerlemesi önizleme güncellemeleri etkin olarak yayımlandı; bunları etkin tutmak yayımlanmış davranışı korur.
- **Mattermost** araç etkinliğini zaten tek taslak önizleme gönderisine dahil eder (yukarıya bakın).
- Araç ilerlemesi düzenlemeleri etkin önizleme akışı modunu izler; önizleme akışı `off` olduğunda veya blok akışı iletiyi devraldığında atlanırlar. Telegram'da `streaming.mode: "off"` yalnızca son çıktı modudur: genel ilerleme konuşmaları bağımsız durum iletileri olarak teslim edilmek yerine bastırılır; onay istemleri, medya yükleri ve hatalar ise normal şekilde yönlendirilir.
- Önizleme akışını koruyup araç ilerlemesi satırlarını gizlemek için ilgili kanal için `streaming.preview.toolProgress` değerini `false` olarak ayarlayın. Komut/çalıştırma metnini gizlerken araç ilerlemesi satırlarını görünür tutmak için `streaming.preview.commandText` değerini `"status"` veya `streaming.progress.commandText` değerini `"status"` olarak ayarlayın; varsayılan değer, yayımlanmış davranışı korumak için `"raw"` şeklindedir. Bu ilke, OpenClaw'ın kompakt ilerleme işleyicisini kullanan taslak/ilerleme kanalları tarafından paylaşılır; bunlara Discord, Matrix, Microsoft Teams, Mattermost, Slack taslak önizlemeleri ve Telegram dahildir. Önizleme düzenlemelerini tamamen devre dışı bırakmak için `streaming.mode` değerini `off` olarak ayarlayın.
- Telegram seçili alıntı yanıtları bir istisnadır: `replyToMode` `"off"` değilse ve seçili alıntı metni mevcutsa, OpenClaw o tur için yanıt önizleme akışını atlar; bu nedenle araç ilerlemesi önizleme satırları işlenemez. Seçili alıntı metni olmayan geçerli ileti yanıtlarında önizleme akışı korunur. Ayrıntılar için [Telegram kanal belgelerine](/tr/channels/telegram) bakın.

İlerleme satırlarını görünür tutup ham komut/çalıştırma metnini gizleyin:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

Aynı yapıyı başka bir kompakt ilerleme kanalı anahtarı altında kullanın; örneğin `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` veya Slack taslak önizlemeleri. İlerleme taslağı modu için aynı ilkeyi `streaming.progress` altına koyun:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## İlgili

- [İleti yaşam döngüsü yeniden düzenlemesi](/tr/concepts/message-lifecycle-refactor) - paylaşılan önizleme, düzenleme, akış ve sonlandırma tasarımını hedefler
- [İlerleme taslakları](/tr/concepts/progress-drafts) - uzun turlar sırasında güncellenen görünür devam eden çalışma iletileri
- [İletiler](/tr/concepts/messages) - ileti yaşam döngüsü ve teslimat
- [Yeniden deneme](/tr/concepts/retry) - teslimat hatasında yeniden deneme davranışı
- [Kanallar](/tr/channels) - kanal başına akış desteği
