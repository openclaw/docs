---
read_when:
    - Kanallarda akışın veya parçalamanın nasıl çalıştığını açıklama
    - Blok akışını veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtlarını veya kanal önizleme akışını hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtları, kanal önizleme akışı, mod eşleme)
title: Akış ve Parçalama
x-i18n:
    generated_at: "2026-04-08T06:01:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8e847bb7da890818cd79dec7777f6ae488e6d6c0468e948e56b6b6c598e0000
    source_path: concepts/streaming.md
    workflow: 15
---

# Akış + parçalama

OpenClaw iki ayrı akış katmanına sahiptir:

- **Blok akışı (kanallar):** asistan yazarken tamamlanan **blokları** yayar. Bunlar normal kanal mesajlarıdır (token deltaları değil).
- **Önizleme akışı (Telegram/Discord/Slack):** oluşturma sırasında geçici bir **önizleme mesajını** günceller.

Bugün kanal mesajlarına **gerçek token-delta akışı** yoktur. Önizleme akışı mesaj tabanlıdır (gönderme + düzenlemeler/eklemeler).

## Blok akışı (kanal mesajları)

Blok akışı, asistan çıktısını kullanılabilir oldukça büyük parçalar halinde gönderir.

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
- `chunker`: min/max sınırları + kırma tercihi uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden mesajlar (blok yanıtları).

**Denetimler:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına varyantları).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akış bloklarını birleştirir).
- Kanal kesin üst sınırı: `*.textChunkLimit` (ör. `channels.whatsapp.textChunkLimit`).
- Kanal parça modu: `*.chunkMode` (`length` varsayılan, `newline` uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırları) böler).
- Discord yumuşak üst sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), kullanıcı arayüzü kırpmasını önlemek için uzun yanıtları böler.

**Sınır anlamları:**

- `text_end`: `chunker` blok yayar yaymaz akış bloklarını gönderir; her `text_end` için boşaltır.
- `message_end`: asistan mesajı bitene kadar bekler, sonra arabelleğe alınmış çıktıyı boşaltır.

`message_end`, arabelleğe alınmış metin `maxChars` değerini aşarsa yine `chunker` kullanır; bu nedenle sonda birden çok parça yayabilir.

## Parçalama algoritması (alt/üst sınırlar)

Blok parçalama `EmbeddedBlockChunker` tarafından uygulanır:

- **Alt sınır:** arabellek >= `minChars` olana kadar yayma (zorlanmadıkça).
- **Üst sınır:** `maxChars` öncesinde bölmeyi tercih eder; zorlanırsa `maxChars` konumunda böler.
- **Kırma tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kırma.
- **Kod çitleri:** çitlerin içinde asla bölmez; `maxChars` konumunda zorlandığında Markdown geçerliliğini korumak için çiti kapatıp yeniden açar.

`maxChars`, kanal `textChunkLimit` değerine sabitlenir; bu yüzden kanal başına sınırları aşamazsınız.

## Birleştirme (akış bloklarını birleştirme)

Blok akışı etkin olduğunda, OpenClaw art arda gelen blok parçalarını
göndermeden önce **birleştirebilir**. Bu, ilerlemeli çıktı sağlamaya devam ederken
“tek satırlık spam”i azaltır.

- Birleştirme, boşaltmadan önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Arabellekler `maxChars` ile sınırlandırılır ve aşılırsa boşaltılır.
- `minChars`, yeterli metin birikene kadar çok küçük parçaların gönderilmesini engeller
  (son boşaltma her zaman kalan metni gönderir).
- Birleştirici, `blockStreamingChunk.breakPreference` değerinden türetilir
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` üzerinden kullanılabilir (hesap başına yapılandırmalar dahil).
- Varsayılan birleştirme `minChars`, geçersiz kılınmadıkça Signal/Slack/Discord için 1500'e yükseltilir.

## Bloklar arasında insan benzeri tempo

Blok akışı etkin olduğunda, blok yanıtları arasında **rastgele bir duraklama**
ekleyebilirsiniz (ilk bloktan sonra). Bu, çok baloncuklu yanıtların
daha doğal hissettirmesini sağlar.

- Yapılandırma: `agents.defaults.humanDelay` (ajan başına `agents.list[].humanDelay` ile geçersiz kılınır).
- Modlar: `off` (varsayılan), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtlarına** uygulanır; son yanıtlara veya araç özetlerine uygulanmaz.

## "Parçaları akıt veya her şeyi"

Bu, şuna karşılık gelir:

- **Parçaları akıt:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ilerledikçe yay). Telegram dışındaki kanallarda ayrıca `*.blockStreaming: true` gerekir.
- **Her şeyi sonda akıt:** `blockStreamingBreak: "message_end"` (bir kez boşaltır; çok uzunsa muhtemelen birden çok parça halinde).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

**Kanal notu:** `*.blockStreaming` açıkça `true` olarak
ayarlanmadıkça blok akışı **kapalıdır**. Kanallar, blok yanıtları olmadan
canlı bir önizleme akıtabilir (`channels.<channel>.streaming`).

Yapılandırma konumu hatırlatması: `blockStreaming*` varsayılanları kök yapılandırmada değil,
`agents.defaults` altında bulunur.

## Önizleme akışı modları

Kanoni̇k anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırakır.
- `partial`: en son metinle değiştirilen tek bir önizleme.
- `block`: parçalanmış/eklenmiş adımlarla önizleme güncellemeleri.
- `progress`: oluşturma sırasında ilerleme/durum önizlemesi, tamamlandığında son yanıt.

### Kanal eşleme

| Kanal    | `off` | `partial` | `block` | `progress`             |
| -------- | ----- | --------- | ------- | ---------------------- |
| Telegram | ✅    | ✅        | ✅      | `partial` olarak eşlenir |
| Discord  | ✅    | ✅        | ✅      | `partial` olarak eşlenir |
| Slack    | ✅    | ✅        | ✅      | ✅                     |

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda Slack yerel akış API çağrılarını açıp kapatır (varsayılan: `true`).
- Slack yerel akışı ve Slack asistan ileti dizisi durumu, bir yanıt ileti dizisi hedefi gerektirir; üst düzey DM'ler bu ileti dizisi tarzı önizlemeyi göstermez.

Eski anahtar geçişi:

- Telegram: `streamMode` + boolean `streaming`, `streaming` enum'una otomatik geçirilir.
- Discord: `streamMode` + boolean `streaming`, `streaming` enum'una otomatik geçirilir.
- Slack: `streamMode`, `streaming.mode` alanına otomatik geçirilir; boolean `streaming`, `streaming.mode` + `streaming.nativeTransport` alanlarına otomatik geçirilir; eski `nativeStreaming`, `streaming.nativeTransport` alanına otomatik geçirilir.

### Çalışma zamanı davranışı

Telegram:

- DM'lerde ve grup/konularda önizleme güncellemeleri için `sendMessage` + `editMessageText` kullanır.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çift akışı önlemek için).
- `/reasoning stream`, gerekçelendirmeyi önizlemeye yazabilir.

Discord:

- Gönderme + düzenleme önizleme mesajları kullanır.
- `block` modu `draftChunk` taslak parçalamayı kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.

Slack:

- `partial`, mevcut olduğunda Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, ekleme tarzı taslak önizlemeleri kullanır.
- `progress`, durum önizleme metni kullanır, ardından son yanıtı verir.

## İlgili

- [Mesajlar](/tr/concepts/messages) — mesaj yaşam döngüsü ve teslimat
- [Yeniden deneme](/tr/concepts/retry) — teslimat hatasında yeniden deneme davranışı
- [Kanallar](/tr/channels) — kanal başına akış desteği
