---
read_when:
    - Kanallarda akışın veya parçalamanın nasıl çalıştığını açıklama
    - Blok akışını veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtlarında veya kanal önizleme akışında hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtları, kanal önizleme akışı, mod eşlemesi)
title: Akış ve parçalama
x-i18n:
    generated_at: "2026-05-04T07:04:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw iki ayrı akış katmanına sahiptir:

- **Blok akışı (kanallar):** asistan yazarken tamamlanmış **blokları** yayınlar. Bunlar normal kanal mesajlarıdır (token deltaları değil).
- **Önizleme akışı (Telegram/Discord/Slack):** üretim sırasında geçici bir **önizleme mesajını** günceller.

Bugün kanal mesajlarına yönelik **gerçek token-delta akışı yoktur**. Önizleme akışı mesaj tabanlıdır (gönderme + düzenlemeler/eklemeler).

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

Gösterge:

- `text_delta/events`: model akış olayları (akışsız modeller için seyrek olabilir).
- `chunker`: min/maks sınırlar + kesme tercihi uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden mesajlar (blok yanıtları).

**Denetimler:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına varyantlar).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akıştaki blokları birleştirir).
- Kanal sabit sınırı: `*.textChunkLimit` (örn. `channels.whatsapp.textChunkLimit`).
- Kanal parça modu: `*.chunkMode` (varsayılan `length`, `newline` uzunlukla parçalamadan önce boş satırlarda (paragraf sınırlarında) böler).
- Discord yumuşak sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), kullanıcı arayüzünde kırpılmayı önlemek için uzun yanıtları böler.

**Sınır semantiği:**

- `text_end`: chunker yayınlar yayınlamaz blokları akışa verir; her `text_end` üzerinde boşaltır.
- `message_end`: asistan mesajı bitene kadar bekler, ardından arabelleğe alınmış çıktıyı boşaltır.

`message_end`, arabelleğe alınmış metin `maxChars` değerini aşarsa yine chunker kullanır; bu nedenle sonunda birden fazla parça yayınlayabilir.

### Blok akışıyla medya teslimi

`MEDIA:` yönergeleri normal teslim meta verileridir. Blok akışı bir medya bloğunu erken gönderdiğinde OpenClaw bu teslimi ilgili tur için hatırlar. Son asistan yükü aynı medya URL'sini tekrarlarsa, son teslim eki tekrar göndermek yerine yinelenen medyayı çıkarır.

Tam yinelenen son yükler bastırılır. Son yük, halihazırda akışla gönderilmiş medyanın etrafına farklı metin eklerse OpenClaw medyayı tek teslim olarak tutarken yeni metni yine gönderir. Bu, bir agent akış sırasında `MEDIA:` yayınladığında ve sağlayıcı bunu tamamlanmış yanıta da dahil ettiğinde Telegram gibi kanallarda yinelenen ses notlarını veya dosyaları önler.

## Parçalama algoritması (alt/üst sınırlar)

Blok parçalama `EmbeddedBlockChunker` tarafından uygulanır:

- **Alt sınır:** arabellek >= `minChars` olana kadar yayınlama (zorlanmadıkça).
- **Üst sınır:** `maxChars` öncesinde bölmeyi tercih et; zorlanırsa `maxChars` değerinde böl.
- **Kesme tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kesme.
- **Kod çitleri:** çitlerin içinde asla bölme; `maxChars` değerinde zorlanınca Markdown geçerli kalsın diye çiti kapat + yeniden aç.

`maxChars`, kanalın `textChunkLimit` değerine sıkıştırılır; bu yüzden kanal başına sınırları aşamazsınız.

## Birleştirme (akış bloklarını birleştirme)

Blok akışı etkinleştirildiğinde OpenClaw, göndermeden önce **ardışık blok parçalarını birleştirebilir**. Bu, ilerlemeli çıktı sağlamaya devam ederken “tek satırlık spam” miktarını azaltır.

- Birleştirme, boşaltmadan önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Arabellekler `maxChars` ile sınırlandırılır ve bunu aşarlarsa boşaltılır.
- `minChars`, yeterli metin birikene kadar çok küçük parçaların gönderilmesini önler (son boşaltma kalan metni her zaman gönderir).
- Birleştirici `blockStreamingChunk.breakPreference` değerinden türetilir (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` üzerinden kullanılabilir (hesap başına yapılandırmalar dahil).
- Varsayılan birleştirme `minChars` değeri, geçersiz kılınmadıkça Signal/Slack/Discord için 1500'e yükseltilir.

## Bloklar arasında insana benzer tempo

Blok akışı etkinleştirildiğinde blok yanıtları arasına (ilk bloktan sonra) **rastgeleleştirilmiş bir duraklama** ekleyebilirsiniz. Bu, çok baloncuklu yanıtların daha doğal hissettirmesini sağlar.

- Yapılandırma: `agents.defaults.humanDelay` (agent başına `agents.list[].humanDelay` ile geçersiz kılın).
- Modlar: `off` (varsayılan), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtlarına** uygulanır; son yanıtlara veya araç özetlerine uygulanmaz.

## "Parçaları veya her şeyi akışla gönder"

Bu şunlara karşılık gelir:

- **Parçaları akışla gönder:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (gittikçe yayınla). Telegram dışındaki kanallarda ayrıca `*.blockStreaming: true` gerekir.
- **Her şeyi sonda akışla gönder:** `blockStreamingBreak: "message_end"` (bir kez boşaltır, çok uzunsa muhtemelen birden fazla parça).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

**Kanal notu:** `*.blockStreaming` açıkça `true` olarak ayarlanmadıkça blok akışı **kapalıdır**. Kanallar, blok yanıtları olmadan canlı önizleme akışı (`channels.<channel>.streaming`) yapabilir.

Yapılandırma konumu hatırlatması: `blockStreaming*` varsayılanları kök yapılandırmada değil, `agents.defaults` altında bulunur.

## Önizleme akışı modları

Kanonik anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırak.
- `partial`: en son metinle değiştirilen tek önizleme.
- `block`: önizleme parçalı/eklemeli adımlarla güncellenir.
- `progress`: üretim sırasında ilerleme/durum önizlemesi, tamamlandığında son yanıt.

`streaming.mode: "block"`, Discord ve Telegram gibi düzenleme yapabilen kanallar için bir önizleme akışı modudur. Orada kanal blok teslimini etkinleştirmez. Normal blok yanıtları istediğinizde `streaming.block.enabled` veya eski `blockStreaming` kanal anahtarını kullanın. Microsoft Teams istisnadır: taslak önizleme blok aktarımı olmadığı için `streaming.mode: "block"` yerel kısmi/ilerleme akışı yerine Teams blok teslimine karşılık gelir.

### Kanal eşlemesi

| Kanal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | düzenlenebilir ilerleme taslağı |
| Discord    | ✅    | ✅        | ✅      | düzenlenebilir ilerleme taslağı |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | yerel ilerleme akışı    |

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda Slack yerel akış API çağrılarını açar/kapatır (varsayılan: `true`).
- Slack yerel akışı ve Slack asistan thread durumu bir yanıt thread hedefi gerektirir. Üst düzey DM'ler bu thread tarzı önizlemeyi göstermez, ancak yine de Slack taslak önizleme gönderilerini ve düzenlemelerini kullanabilir.

Eski anahtar geçişi:

- Telegram: eski `streamMode` ve skaler/boolean `streaming` değerleri doctor/yapılandırma uyumluluk yolları tarafından algılanır ve `streaming.mode` değerine taşınır.
- Discord: `streamMode` + boolean `streaming`, otomatik olarak `streaming` enum değerine taşınır.
- Slack: `streamMode`, otomatik olarak `streaming.mode` değerine taşınır; boolean `streaming`, otomatik olarak `streaming.mode` artı `streaming.nativeTransport` değerine taşınır; eski `nativeStreaming`, otomatik olarak `streaming.nativeTransport` değerine taşınır.

### Çalışma zamanı davranışı

Telegram:

- DM'ler ve grup/konular genelinde `sendMessage` + `editMessageText` önizleme güncellemelerini kullanır.
- Bir önizleme yaklaşık bir dakika görünür kaldığında yerinde düzenlemek yerine yeni bir son mesaj gönderir, ardından Telegram'ın zaman damgası yanıt tamamlanmasını yansıtsın diye önizlemeyi temizler.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çift akışı önlemek için).
- `/reasoning stream`, akıl yürütmeyi son teslimden sonra silinen geçici bir önizlemeye yazabilir.

Discord:

- Gönderme + düzenleme önizleme mesajlarını kullanır.
- `block` modu taslak parçalamayı (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.
- Son medya, hata ve açık yanıt yükleri bekleyen önizlemeleri yeni bir taslak boşaltmadan iptal eder, ardından normal teslimi kullanır.

Slack:

- `partial`, mevcut olduğunda Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, ekleme tarzı taslak önizlemeleri kullanır.
- `progress`, durum önizleme metnini, ardından son yanıtı kullanır.
- Yanıt thread'i olmayan üst düzey DM'ler, Slack yerel akışı yerine taslak önizleme gönderileri ve düzenlemeleri kullanır.
- Yerel ve taslak önizleme akışı, ilgili tur için blok yanıtlarını bastırır; böylece Slack yanıtı yalnızca bir teslim yolu tarafından akışa verilir.
- Son medya/hata yükleri ve ilerleme sonları atılacak taslak mesajlar oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok sonları bekleyen taslak metni boşaltır.

Mattermost:

- Düşünme, araç etkinliği ve kısmi yanıt metnini, son yanıt göndermeye güvenli olduğunda yerinde sonlandırılan tek bir taslak önizleme gönderisine akışla gönderir.
- Önizleme gönderisi silinmişse veya sonlandırma sırasında başka şekilde kullanılamıyorsa yeni bir son gönderi göndermeye geri döner.
- Son medya/hata yükleri, geçici bir önizleme gönderisini boşaltmak yerine normal teslimden önce bekleyen önizleme güncellemelerini iptal eder.

Matrix:

- Son metin önizleme olayını yeniden kullanabildiğinde taslak önizlemeler yerinde sonlandırılır.
- Yalnızca medya, hata ve yanıt-hedefi-uyuşmazlığı sonları, normal teslimden önce bekleyen önizleme güncellemelerini iptal eder; halihazırda görünür olan eski bir önizleme redakte edilir.

### Araç ilerlemesi önizleme güncellemeleri

Önizleme akışı, araçlar çalışırken aynı önizleme mesajında, son yanıttan önce görünen "web'de arama yapılıyor", "dosya okunuyor" veya "araç çağrılıyor" gibi kısa durum satırları olan **araç ilerlemesi** güncellemelerini de içerebilir. Bu, çok adımlı araç turlarının ilk düşünme önizlemesi ile son yanıt arasında sessiz kalmak yerine görsel olarak canlı kalmasını sağlar.

Desteklenen yüzeyler:

- **Discord**, **Slack**, **Telegram** ve **Matrix**, önizleme akışı etkin olduğunda varsayılan olarak araç ilerlemesini canlı önizleme düzenlemesine akışla gönderir. Microsoft Teams kişisel sohbetlerde yerel ilerleme akışını kullanır.
- Telegram, `v2026.4.22` sürümünden beri araç ilerlemesi önizleme güncellemeleri etkin olarak yayımlandı; bunları etkin tutmak yayımlanmış davranışı korur.
- **Mattermost** zaten araç etkinliğini tek taslak önizleme gönderisine dahil eder (yukarıya bakın).
- Araç ilerlemesi düzenlemeleri etkin önizleme akışı modunu izler; önizleme akışı `off` olduğunda veya blok akışı mesajı devraldığında atlanır. Telegram'da `streaming.mode: "off"` yalnızca sondur: genel ilerleme konuşmaları bağımsız durum mesajları olarak teslim edilmek yerine bastırılır; onay istemleri, medya yükleri ve hatalar ise normal şekilde yönlendirilir.
- Önizleme akışını koruyup araç ilerlemesi satırlarını gizlemek için ilgili kanal için `streaming.preview.toolProgress` değerini `false` olarak ayarlayın. Komut/exec metnini gizlerken araç ilerlemesi satırlarını görünür tutmak için `streaming.preview.commandText` değerini `"status"` veya `streaming.progress.commandText` değerini `"status"` olarak ayarlayın; varsayılan, yayımlanmış davranışı korumak için `"raw"` değeridir. Bu politika, Discord, Matrix, Microsoft Teams, Mattermost, Slack taslak önizlemeleri ve Telegram dahil olmak üzere OpenClaw'ın kompakt ilerleme işleyicisini kullanan taslak/ilerleme kanalları tarafından paylaşılır. Önizleme düzenlemelerini tamamen devre dışı bırakmak için `streaming.mode` değerini `off` olarak ayarlayın.
- Telegram seçili alıntı yanıtları bir istisnadır: `replyToMode` `"off"` olmadığında ve seçili alıntı metni bulunduğunda OpenClaw, araç ilerlemesi önizleme satırları işlenemesin diye ilgili tur için yanıt önizleme akışını atlar. Seçili alıntı metni olmayan güncel mesaj yanıtları önizleme akışını korumaya devam eder. Ayrıntılar için [Telegram kanal belgelerine](/tr/channels/telegram) bakın.

İlerleme satırlarını görünür tutun ancak ham komut/exec metnini gizleyin:

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

Aynı yapıyı başka bir kompakt ilerleme kanalı anahtarı altında kullanın; örneğin `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` veya Slack taslak önizlemeleri. İlerleme taslağı modu için aynı politikayı `streaming.progress` altına koyun:

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

- [İlerleme taslakları](/tr/concepts/progress-drafts) — uzun dönüşler sırasında güncellenen görünür devam eden çalışma mesajları
- [Mesajlar](/tr/concepts/messages) — mesaj yaşam döngüsü ve teslim
- [Yeniden deneme](/tr/concepts/retry) — teslim hatasında yeniden deneme davranışı
- [Kanallar](/tr/channels) — kanal başına streaming desteği
