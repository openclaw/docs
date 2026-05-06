---
read_when:
    - Kanallarda akışın veya parçalamanın nasıl çalıştığını açıklama
    - Blok akışı veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtlarında veya kanal önizleme akışında hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtları, kanal önizleme akışı, mod eşlemesi)
title: Akış ve parçalara ayırma
x-i18n:
    generated_at: "2026-05-06T17:54:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e43dc87211e764f9721c4e6c0aa69088441344e1f7c34084fd711a780a852a17
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw iki ayrı akış katmanına sahiptir:

- **Blok akışı (kanallar):** asistan yazarken tamamlanmış **blokları** yayar. Bunlar normal kanal iletileridir (token deltaları değildir).
- **Önizleme akışı (Telegram/Discord/Slack):** oluşturma sırasında geçici bir **önizleme iletisini** günceller.

Bugün kanal iletilerine yönelik **gerçek token-delta akışı yoktur**. Önizleme akışı ileti tabanlıdır (gönderme + düzenlemeler/eklemeler).

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

Lejant:

- `text_delta/events`: model akış olayları (akışsız modeller için seyrek olabilir).
- `chunker`: min/maks sınırları + kırılma tercihi uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden iletiler (blok yanıtları).

**Kontroller:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına değişkenler).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akışla gelen blokları birleştirir).
- Kanal sabit üst sınırı: `*.textChunkLimit` (örn. `channels.whatsapp.textChunkLimit`).
- Kanal parça modu: `*.chunkMode` (`length` varsayılan, `newline` uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırları) böler).
- Discord esnek üst sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), UI kırpılmasını önlemek için uzun yanıtları böler.

**Sınır semantiği:**

- `text_end`: chunker yayar yaymaz blokları akışla gönder; her `text_end` üzerinde boşalt.
- `message_end`: asistan iletisi bitene kadar bekle, ardından arabelleğe alınmış çıktıyı boşalt.

Arabelleğe alınmış metin `maxChars` değerini aşarsa `message_end` yine de chunker kullanır; bu nedenle sonunda birden çok parça yayabilir.

### Blok akışıyla medya teslimi

`MEDIA:` yönergeleri normal teslim metaverisidir. Blok akışı bir medya bloğunu erken gönderdiğinde, OpenClaw o tur için bu teslimi hatırlar. Son asistan yükü aynı medya URL'sini tekrarlarsa, son teslim eki yeniden göndermek yerine yinelenen medyayı çıkarır.

Tamamen yinelenen son yükler bastırılır. Son yük, zaten akışla gönderilmiş medyanın etrafına farklı metin eklerse, OpenClaw medyayı tek teslimli tutarken yeni metni yine de gönderir. Bu, bir ajan akış sırasında `MEDIA:` yaydığında ve sağlayıcı bunu tamamlanmış yanıta da dahil ettiğinde Telegram gibi kanallarda yinelenen ses notlarını veya dosyaları önler.

## Parçalama algoritması (alt/üst sınırlar)

Blok parçalama `EmbeddedBlockChunker` tarafından uygulanır:

- **Alt sınır:** arabellek >= `minChars` olana kadar yayma (zorlanmadıkça).
- **Üst sınır:** `maxChars` öncesinde bölmeyi tercih et; zorlanırsa `maxChars` konumunda böl.
- **Kırılma tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kırılma.
- **Kod çitleri:** çitlerin içinde asla bölme; `maxChars` konumunda zorla bölündüğünde Markdown geçerli kalsın diye çiti kapat + yeniden aç.

`maxChars`, kanal `textChunkLimit` değerine sıkıştırılır; bu yüzden kanal başına üst sınırları aşamazsınız.

## Birleştirme (akışla gelen blokları birleştir)

Blok akışı etkinleştirildiğinde OpenClaw, dışarı göndermeden önce **ardışık blok parçalarını birleştirebilir**. Bu, ilerlemeli çıktı sağlamaya devam ederken "tek satırlık spam"i azaltır.

- Birleştirme, boşaltmadan önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Arabellekler `maxChars` ile sınırlandırılır ve bunu aşarsa boşaltılır.
- `minChars`, yeterli metin birikene kadar küçük parçaların gönderilmesini engeller (son boşaltma kalan metni her zaman gönderir).
- Birleştirici `blockStreamingChunk.breakPreference` değerinden türetilir (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` üzerinden kullanılabilir (hesap başına yapılandırmalar dahil).
- Varsayılan birleştirme `minChars` değeri, geçersiz kılınmadıkça Signal/Slack/Discord için 1500'e yükseltilir.

## Bloklar arasında insan benzeri tempo

Blok akışı etkinleştirildiğinde, blok yanıtları arasına (ilk bloktan sonra) **rastgeleleştirilmiş bir duraklama** ekleyebilirsiniz. Bu, çok baloncuklu yanıtların daha doğal hissettirmesini sağlar.

- Yapılandırma: `agents.defaults.humanDelay` (ajan başına `agents.list[].humanDelay` ile geçersiz kılın).
- Modlar: `off` (varsayılan), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtlarına** uygulanır; son yanıtlara veya araç özetlerine uygulanmaz.

## "Parçaları veya her şeyi akışla gönder"

Bu şuna karşılık gelir:

- **Parçaları akışla gönder:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ilerledikçe yay). Telegram dışı kanalların ayrıca `*.blockStreaming: true` ayarına ihtiyacı vardır.
- **Her şeyi sonda akışla gönder:** `blockStreamingBreak: "message_end"` (bir kez boşalt, çok uzunsa muhtemelen birden çok parça).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

**Kanal notu:** `*.blockStreaming` açıkça `true` olarak ayarlanmadıkça blok akışı **kapalıdır**. Kanallar, blok yanıtları olmadan canlı önizleme akışı (`channels.<channel>.streaming`) yapabilir.

Yapılandırma konumu hatırlatması: `blockStreaming*` varsayılanları kök yapılandırmada değil, `agents.defaults` altında bulunur.

## Önizleme akışı modları

Standart anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırakır.
- `partial`: en son metinle değiştirilen tek önizleme.
- `block`: parçalı/eklemeli adımlarla önizleme güncellemeleri.
- `progress`: oluşturma sırasında ilerleme/durum önizlemesi, tamamlandığında son yanıt.

`streaming.mode: "block"`, Discord ve Telegram gibi düzenleme destekli kanallar için bir önizleme akışı modudur. Orada kanal blok teslimini etkinleştirmez. Normal blok yanıtları istediğinizde `streaming.block.enabled` veya eski `blockStreaming` kanal anahtarını kullanın. Microsoft Teams istisnadır: taslak önizleme blok taşıması yoktur, bu yüzden `streaming.mode: "block"` yerel kısmi/ilerleme akışı yerine Teams blok teslimine eşlenir.

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
- Slack yerel akışı ve Slack asistan konu durumu bir yanıt konusu hedefi gerektirir. Üst düzey DM'ler bu konu tarzı önizlemeyi göstermez, ancak Slack taslak önizleme gönderilerini ve düzenlemelerini yine de kullanabilir.

Eski anahtar geçişi:

- Telegram: eski `streamMode` ve skaler/boolean `streaming` değerleri doctor/yapılandırma uyumluluk yolları tarafından algılanır ve `streaming.mode` değerine taşınır.
- Discord: `streamMode` + boolean `streaming`, `streaming` enum'u için çalışma zamanı takma adları olarak kalır; kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- Slack: `streamMode`, `streaming.mode` için çalışma zamanı takma adı olarak kalır; boolean `streaming`, `streaming.mode` artı `streaming.nativeTransport` için çalışma zamanı takma adı olarak kalır; eski `nativeStreaming`, `streaming.nativeTransport` için çalışma zamanı takma adı olarak kalır. Kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.

### Çalışma zamanı davranışı

Telegram:

- DM'ler ve grup/konular genelinde `sendMessage` + `editMessageText` önizleme güncellemelerini kullanır.
- Son metin etkin önizlemeyi yerinde düzenler; uzun son yanıtlar ilk parça için bu iletiyi yeniden kullanır ve yalnızca kalan parçaları gönderir.
- `progress` modu araç ilerlemesini düzenlenebilir bir durum taslağında tutar, tamamlandığında bu taslağı temizler ve son yanıtı normal teslim üzerinden gönderir.
- Tamamlanmış metin doğrulanmadan önce son düzenleme başarısız olursa, OpenClaw normal son teslimi kullanır ve bayat önizlemeyi temizler.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çifte akışı önlemek için).
- `/reasoning stream`, son teslimden sonra silinen geçici bir önizlemeye akıl yürütme yazabilir.

Discord:

- Gönderme + düzenleme önizleme iletileri kullanır.
- `block` modu taslak parçalamayı (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.
- Son medya, hata ve açık yanıt yükleri bekleyen önizlemeleri yeni bir taslak boşaltmadan iptal eder, ardından normal teslimi kullanır.

Slack:

- `partial`, kullanılabilir olduğunda Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, ekleme tarzı taslak önizlemeleri kullanır.
- `progress`, durum önizleme metnini, ardından son yanıtı kullanır.
- Yanıt konusu olmayan üst düzey DM'ler, Slack yerel akışı yerine taslak önizleme gönderilerini ve düzenlemelerini kullanır.
- Yerel ve taslak önizleme akışı o tur için blok yanıtlarını bastırır; böylece bir Slack yanıtı yalnızca tek bir teslim yolu tarafından akışla gönderilir.
- Son medya/hata yükleri ve ilerleme sonları geçici taslak iletileri oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok sonları bekleyen taslak metni boşaltır.

Mattermost:

- Düşünmeyi, araç etkinliğini ve kısmi yanıt metnini, son yanıt güvenle gönderilebilir olduğunda yerinde sonlanan tek bir taslak önizleme gönderisine akışla gönderir.
- Önizleme gönderisi silinmişse veya sonlandırma zamanında başka şekilde kullanılamıyorsa yeni bir son gönderi göndermeye geri döner.
- Son medya/hata yükleri, geçici bir önizleme gönderisi boşaltmak yerine normal teslimden önce bekleyen önizleme güncellemelerini iptal eder.

Matrix:

- Son metin önizleme olayını yeniden kullanabildiğinde taslak önizlemeler yerinde sonlandırılır.
- Yalnızca medya, hata ve yanıt-hedefi-uyumsuzluğu sonları normal teslimden önce bekleyen önizleme güncellemelerini iptal eder; zaten görünür olan bayat önizleme sansürlenir.

### Araç ilerlemesi önizleme güncellemeleri

Önizleme akışı, araçlar çalışırken aynı önizleme iletisinde görünen ve son yanıttan önce gelen "web'de aranıyor", "dosya okunuyor" veya "araç çağrılıyor" gibi kısa durum satırları olan **araç ilerlemesi** güncellemelerini de içerebilir. Bu, çok adımlı araç turlarını ilk düşünme önizlemesi ile son yanıt arasında sessiz bırakmak yerine görsel olarak canlı tutar.

Desteklenen yüzeyler:

- **Discord**, **Slack**, **Telegram** ve **Matrix**, önizleme akışı etkin olduğunda varsayılan olarak araç ilerlemesini canlı önizleme düzenlemesine aktarır. Microsoft Teams kişisel sohbetlerde kendi yerel ilerleme akışını kullanır.
- Telegram, araç ilerlemesi önizleme güncellemeleri etkin olarak `v2026.4.22` sürümünden beri gönderildi; bunları etkin tutmak yayımlanan bu davranışı korur.
- **Mattermost** araç etkinliğini zaten tek taslak önizleme gönderisine katlar (yukarıya bakın).
- Araç ilerlemesi düzenlemeleri etkin önizleme akışı modunu izler; önizleme akışı `off` olduğunda veya blok akışı mesajı devraldığında atlanırlar. Telegram’da `streaming.mode: "off"` yalnızca finaldir: genel ilerleme konuşmaları bağımsız durum mesajları olarak iletilmek yerine bastırılır; onay istemleri, medya yükleri ve hatalar ise normal şekilde yönlendirilir.
- Önizleme akışını koruyup araç ilerlemesi satırlarını gizlemek için o kanal için `streaming.preview.toolProgress` değerini `false` olarak ayarlayın. Komut/yürütme metnini gizlerken araç ilerlemesi satırlarını görünür tutmak için `streaming.preview.commandText` değerini `"status"` veya `streaming.progress.commandText` değerini `"status"` olarak ayarlayın; varsayılan değer, yayımlanan davranışı korumak için `"raw"` değeridir. Bu politika, Discord, Matrix, Microsoft Teams, Mattermost, Slack taslak önizlemeleri ve Telegram dahil olmak üzere OpenClaw’ın kompakt ilerleme oluşturucusunu kullanan taslak/ilerleme kanalları tarafından paylaşılır. Önizleme düzenlemelerini tamamen devre dışı bırakmak için `streaming.mode` değerini `off` olarak ayarlayın.
- Telegram seçili alıntı yanıtları bir istisnadır: `replyToMode` `"off"` değilse ve seçili alıntı metni varsa, OpenClaw bu tur için yanıt önizleme akışını atlar; bu nedenle araç ilerlemesi önizleme satırları işlenemez. Seçili alıntı metni olmayan geçerli mesaj yanıtları ise önizleme akışını korur. Ayrıntılar için [Telegram kanal belgelerine](/tr/channels/telegram) bakın.

İlerleme satırlarını görünür tutup ham komut/yürütme metnini gizleyin:

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

- [Mesaj yaşam döngüsü yeniden düzenlemesi](/tr/concepts/message-lifecycle-refactor) - paylaşılan önizleme, düzenleme, akış ve sonlandırma tasarımını hedefler
- [İlerleme taslakları](/tr/concepts/progress-drafts) - uzun turlar sırasında güncellenen görünür devam eden çalışma mesajları
- [Mesajlar](/tr/concepts/messages) - mesaj yaşam döngüsü ve teslim
- [Yeniden deneme](/tr/concepts/retry) - teslim hatasında yeniden deneme davranışı
- [Kanallar](/tr/channels) - kanal başına akış desteği
