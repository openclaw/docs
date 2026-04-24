---
read_when:
    - Kanallarda akışın veya parçalamanın nasıl çalıştığını açıklama
    - Blok akışını veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtları veya kanal önizleme akışını hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtlar, kanal önizleme akışı, mod eşleme)
title: Akış ve parçalama
x-i18n:
    generated_at: "2026-04-24T09:07:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# Akış + parçalama

OpenClaw'ın iki ayrı akış katmanı vardır:

- **Blok akışı (kanallar):** asistan yazarken tamamlanmış **bloklar** yayınlar. Bunlar normal kanal mesajlarıdır (token delta değildir).
- **Önizleme akışı (Telegram/Discord/Slack):** üretim sırasında geçici bir **önizleme mesajını** günceller.

Bugün kanal mesajlarına **gerçek token-delta akışı** yoktur. Önizleme akışı mesaj tabanlıdır (gönder + düzenle/ekle).

## Blok akışı (kanal mesajları)

Blok akışı, asistan çıktısını kullanılabilir oldukça kaba parçalar halinde gönderir.

```
Model çıktısı
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker, tampon büyüdükçe bloklar yayınlar
       └─ (blockStreamingBreak=message_end)
            └─ chunker, message_end anında flush eder
                   └─ kanal gönderimi (blok yanıtları)
```

Gösterim:

- `text_delta/events`: model akış olayları (akışsız modeller için seyrek olabilir).
- `chunker`: min/max sınırları + break preference uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden mesajlar (blok yanıtları).

**Denetimler:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına varyantları).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akış bloklarını birleştirir).
- Kanal katı sınırı: `*.textChunkLimit` (ör. `channels.whatsapp.textChunkLimit`).
- Kanal parça modu: `*.chunkMode` (varsayılan `length`, `newline` ise uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırlarında) böler).
- Discord yumuşak sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), arayüz kırpılmasını önlemek için uzun yanıtları böler.

**Sınır semantiği:**

- `text_end`: chunker yayınlar yayınlamaz blokları akıt; her `text_end` anında flush et.
- `message_end`: asistan mesajı tamamlanana kadar bekle, sonra tamponlanmış çıktıyı flush et.

`message_end`, tamponlanmış metin `maxChars` değerini aşarsa yine chunker kullanır, böylece sonda birden çok parça yayınlayabilir.

## Parçalama algoritması (alt/üst sınırlar)

Blok parçalama `EmbeddedBlockChunker` tarafından uygulanır:

- **Alt sınır:** tampon >= `minChars` olana kadar yayınlama (zorlanmadıkça).
- **Üst sınır:** `maxChars` öncesinde bölmeyi tercih et; zorlandığında `maxChars` değerinde böl.
- **Break preference:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kesme.
- **Kod çitleri:** çitlerin içinde asla bölme; `maxChars` değerinde zorlanırsa Markdown'ın geçerli kalması için çiti kapatıp yeniden aç.

`maxChars`, kanal `textChunkLimit` değeriyle sınırlandırılır; bu yüzden kanal başına sınırları aşamazsınız.

## Birleştirme (akış bloklarını birleştirme)

Blok akışı etkin olduğunda OpenClaw, göndermeden önce **ardışık blok parçalarını**
birleştirebilir. Bu, ilerlemeli çıktı sunarken “tek satırlık spam”i azaltır.

- Birleştirme, flush etmeden önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Tamponlar `maxChars` ile sınırlandırılır ve bunu aşarlarsa flush edilir.
- `minChars`, yeterli metin birikene kadar küçük parçaların gönderilmesini önler
  (nihai flush her zaman kalan metni gönderir).
- Birleştirici, `blockStreamingChunk.breakPreference` değerinden türetilir
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` üzerinden kullanılabilir (hesap başına config'ler dahil).
- Varsayılan coalesce `minChars`, geçersiz kılınmadıkça Signal/Slack/Discord için 1500'e yükseltilir.

## Bloklar arasında insan benzeri tempo

Blok akışı etkin olduğunda, blok yanıtları arasında
(ilk bloktan sonra) **rastgeleleştirilmiş bir duraklama** ekleyebilirsiniz. Bu, çoklu baloncuk yanıtlarının
daha doğal hissettirmesini sağlar.

- Config: `agents.defaults.humanDelay` (aracı başına `agents.list[].humanDelay` ile geçersiz kılınabilir).
- Modlar: `off` (varsayılan), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtlarına** uygulanır, nihai yanıtlar veya araç özetlerine uygulanmaz.

## "Parçaları akıt veya her şeyi"

Bu şu şekilde eşlenir:

- **Parçaları akıt:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (yazdıkça yayınla). Telegram dışındaki kanallar için ayrıca `*.blockStreaming: true` gerekir.
- **Her şeyi sonda akıt:** `blockStreamingBreak: "message_end"` (bir kez flush et; çok uzunsa yine de birden çok parça olabilir).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca nihai yanıt).

**Kanal notu:** Blok akışı, `*.blockStreaming`
açıkça `true` yapılmadıkça **kapalıdır**. Kanallar, blok yanıtları olmadan
canlı önizleme akışı (`channels.<channel>.streaming`) yapabilir.

Config konumu hatırlatması: `blockStreaming*` varsayılanları kök config'te değil,
`agents.defaults` altında bulunur.

## Önizleme akışı modları

Kanonik anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırak.
- `partial`: en son metinle değiştirilen tek bir önizleme.
- `block`: parçalanmış/eklenmiş adımlarla önizleme güncellemeleri.
- `progress`: üretim sırasında ilerleme/durum önizlemesi, tamamlandığında nihai yanıt.

### Kanal eşlemesi

| Kanal      | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | `partial` olarak eşlenir |
| Discord    | ✅    | ✅        | ✅      | `partial` olarak eşlenir |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda Slack yerel akış API çağrılarını açıp kapatır (varsayılan: `true`).
- Slack yerel akışı ve Slack asistan thread durumu bir yanıt thread hedefi gerektirir; üst düzey DM'ler bu thread tarzı önizlemeyi göstermez.

Eski anahtar taşınması:

- Telegram: `streamMode` + boolean `streaming`, otomatik olarak `streaming` enum'una taşınır.
- Discord: `streamMode` + boolean `streaming`, otomatik olarak `streaming` enum'una taşınır.
- Slack: `streamMode`, otomatik olarak `streaming.mode` değerine taşınır; boolean `streaming`, otomatik olarak `streaming.mode` ile `streaming.nativeTransport` değerlerine taşınır; eski `nativeStreaming`, otomatik olarak `streaming.nativeTransport` değerine taşınır.

### Çalışma zamanı davranışı

Telegram:

- DM'ler ve grup/konular genelinde `sendMessage` + `editMessageText` önizleme güncellemelerini kullanır.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çift akışı önlemek için).
- `/reasoning stream`, reasoning'i önizlemeye yazabilir.

Discord:

- Gönder + düzenle önizleme mesajlarını kullanır.
- `block` modu taslak parçalama (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.
- Nihai medya, hata ve açık yanıt payload'ları bekleyen önizlemeleri yeni bir taslak flush etmeden iptal eder, sonra normal teslimatı kullanır.

Slack:

- `partial`, mevcut olduğunda Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, ekleme tarzı taslak önizlemeler kullanır.
- `progress`, durum önizleme metnini, ardından nihai yanıtı kullanır.
- Nihai medya/hata payload'ları ve ilerleme finalleri geçici taslak mesajları oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok finalleri bekleyen taslak metni flush eder.

Mattermost:

- Thinking, araç etkinliği ve kısmi yanıt metnini, nihai yanıt güvenli şekilde gönderilebildiğinde yerinde tamamlanan tek bir taslak önizleme gönderisinde akıtır.
- Önizleme gönderisi silinmişse veya tamamlanma anında başka şekilde kullanılamıyorsa yeni bir nihai gönderi göndermeye fallback yapar.
- Nihai medya/hata payload'ları, geçici bir önizleme gönderisini flush etmek yerine normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder.

Matrix:

- Nihai metin önizleme olayını yeniden kullanabildiğinde taslak önizlemeler yerinde tamamlanır.
- Yalnızca medya içeren, hata ve yanıt-hedefi uyumsuzluğu olan finaller, normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder; zaten görünür olan bayat bir önizleme redakte edilir.

### Araç ilerlemesi önizleme güncellemeleri

Önizleme akışı ayrıca, araçlar çalışırken aynı önizleme mesajında
nihai yanıttan önce görünen "web'de aranıyor", "dosya okunuyor" veya "araç çağrılıyor" gibi kısa durum satırları olan
**araç ilerlemesi** güncellemelerini de içerebilir. Bu, çok adımlı araç turlarını, ilk thinking önizlemesi ile nihai yanıt arasındaki sessizlik yerine görsel olarak canlı tutar.

Desteklenen yüzeyler:

- **Discord**, **Slack** ve **Telegram**, araç ilerlemesini canlı önizleme düzenlemesine akıtır.
- **Mattermost**, araç etkinliğini zaten tek taslak önizleme gönderisinde birleştirir (yukarıya bakın).
- Araç ilerlemesi düzenlemeleri etkin önizleme akışı modunu izler; önizleme akışı `off` olduğunda veya blok akışı mesajı devraldığında atlanır.

## İlgili

- [Messages](/tr/concepts/messages) — mesaj yaşam döngüsü ve teslimat
- [Retry](/tr/concepts/retry) — teslim başarısızlığında retry davranışı
- [Channels](/tr/channels) — kanal başına akış desteği
