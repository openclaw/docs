---
read_when:
    - Kanallarda akışın veya parçalamanın nasıl çalıştığını açıklıyorsanız
    - Blok akışını veya kanal parçalama davranışını değiştiriyorsanız
    - Yinelenen/erken blok yanıtlarında veya kanal önizleme akışında hata ayıklıyorsanız
summary: Akış + parçalama davranışı (blok yanıtları, kanal önizleme akışı, kip eşleme)
title: Akış ve Parçalama
x-i18n:
    generated_at: "2026-04-05T13:52:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44b0d08c7eafcb32030ef7c8d5719c2ea2d34e4bac5fdad8cc8b3f4e9e9fad97
    source_path: concepts/streaming.md
    workflow: 15
---

# Akış + parçalama

OpenClaw iki ayrı akış katmanına sahiptir:

- **Blok akışı (kanallar):** assistant yazarken tamamlanmış **blokları** yayar. Bunlar normal kanal mesajlarıdır (token deltaları değildir).
- **Önizleme akışı (Telegram/Discord/Slack):** oluşturma sırasında geçici bir **önizleme mesajını** günceller.

Bugün kanal mesajlarına **gerçek token-delta akışı yoktur**. Önizleme akışı mesaj tabanlıdır (gönderme + düzenleme/ekleme).

## Blok akışı (kanal mesajları)

Blok akışı, kullanılabilir oldukça assistant çıktısını kaba parçalar halinde gönderir.

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

- `text_delta/events`: model akış olaylarıdır (akışsız modeller için seyrek olabilir).
- `chunker`: min/maks sınırlar + kırma tercihi uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden mesajlar (blok yanıtları).

**Denetimler:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına varyantlar).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akış bloklarını birleştirir).
- Kanal katı üst sınırı: `*.textChunkLimit` (ör. `channels.whatsapp.textChunkLimit`).
- Kanal parçalama kipi: `*.chunkMode` (`length` varsayılan, `newline` uzunluğa göre parçalamadan önce boş satırlarda bölünür (paragraf sınırları)).
- Discord yumuşak üst sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), arayüz kırpmasını önlemek için uzun yanıtları böler.

**Sınır semantiği:**

- `text_end`: chunker üretir üretmez blokları akıt; her `text_end` üzerinde flush yap.
- `message_end`: assistant mesajı bitene kadar bekle, sonra tamponlanan çıktıyı flush et.

Tamponlanan metin `maxChars` değerini aşarsa `message_end` yine chunker kullanır; bu nedenle sonda birden fazla parça yayabilir.

## Parçalama algoritması (alt/üst sınırlar)

Blok parçalama `EmbeddedBlockChunker` tarafından uygulanır:

- **Alt sınır:** tampon >= `minChars` olana kadar yayma (zorlanmadıkça).
- **Üst sınır:** bölmeleri `maxChars` öncesinde tercih et; zorlanırsa `maxChars` değerinde böl.
- **Kırma tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kırma.
- **Kod çitleri:** çitlerin içinde asla bölme; `maxChars` değerinde zorlandığında Markdown geçerliliğini korumak için çiti kapat + yeniden aç.

`maxChars`, kanal `textChunkLimit` değerine sıkıştırılır; böylece kanal başına sınırları aşamazsınız.

## Birleştirme (akış bloklarını birleştirme)

Blok akışı etkin olduğunda, OpenClaw **ardışık blok parçalarını**
göndermeden önce birleştirebilir. Bu, ilerlemeli çıktı sağlamaya devam ederken
“tek satırlık spam”i azaltır.

- Birleştirme, flush yapmadan önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Tamponlar `maxChars` ile sınırlandırılır ve bu sınırı aşarlarsa flush edilir.
- `minChars`, yeterli metin birikene kadar küçük parçaların gönderilmesini önler
  (son flush her zaman kalan metni gönderir).
- Birleştirici, `blockStreamingChunk.breakPreference`
  değerinden türetilir (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` aracılığıyla kullanılabilir (hesap başına config'ler dahil).
- Varsayılan birleştirme `minChars`, geçersiz kılınmadıkça Signal/Slack/Discord için 1500'e yükseltilir.

## Bloklar arasında insan benzeri tempo

Blok akışı etkin olduğunda, blok yanıtları arasında
(ilk bloktan sonra) **rastgeleleştirilmiş bir duraklama** ekleyebilirsiniz. Bu, çoklu baloncuk yanıtlarının
daha doğal hissettirmesini sağlar.

- Config: `agents.defaults.humanDelay` (ajan başına `agents.list[].humanDelay` ile geçersiz kılınabilir).
- Kipler: `off` (varsayılan), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtlarına** uygulanır, son yanıtlara veya araç özetlerine uygulanmaz.

## "Parçaları akıt veya her şeyi"

Bu, şu anlama gelir:

- **Parçaları akıt:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ilerledikçe yay). Telegram dışındaki kanallarda ayrıca `*.blockStreaming: true` gerekir.
- **Her şeyi sonda akıt:** `blockStreamingBreak: "message_end"` (bir kez flush yapar, çok uzunsa yine birden fazla parça olabilir).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

**Kanal notu:** `*.blockStreaming` açıkça `true`
olarak ayarlanmadıkça blok akışı **kapalıdır**. Kanallar blok yanıtları olmadan da canlı önizleme
(`channels.<channel>.streaming`) akıtabilir.

Config konumu hatırlatması: `blockStreaming*` varsayılanları kök config altında değil,
`agents.defaults` altında bulunur.

## Önizleme akışı kipleri

Kurallı anahtar: `channels.<channel>.streaming`

Kipler:

- `off`: önizleme akışını devre dışı bırak.
- `partial`: en son metinle değiştirilen tek bir önizleme.
- `block`: parçalanmış/eklenmiş adımlarla önizleme güncellemeleri.
- `progress`: oluşturma sırasında ilerleme/durum önizlemesi, tamamlandığında son yanıt.

### Kanal eşleme

| Kanal    | `off` | `partial` | `block` | `progress`          |
| -------- | ----- | --------- | ------- | ------------------- |
| Telegram | ✅    | ✅        | ✅      | `partial` olarak eşlenir |
| Discord  | ✅    | ✅        | ✅      | `partial` olarak eşlenir |
| Slack    | ✅    | ✅        | ✅      | ✅                  |

Yalnızca Slack:

- `streaming=partial` olduğunda `channels.slack.nativeStreaming`, Slack yerel akış API çağrılarını açıp kapatır (varsayılan: `true`).

Eski anahtar geçişi:

- Telegram: `streamMode` + boolean `streaming`, otomatik olarak `streaming` enum'una geçirilir.
- Discord: `streamMode` + boolean `streaming`, otomatik olarak `streaming` enum'una geçirilir.
- Slack: `streamMode`, otomatik olarak `streaming` enum'una geçirilir; boolean `streaming`, otomatik olarak `nativeStreaming` değerine geçirilir.

### Çalışma zamanı davranışı

Telegram:

- DM'ler ve grup/konular genelinde `sendMessage` + `editMessageText` önizleme güncellemelerini kullanır.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çift akışı önlemek için).
- `/reasoning stream`, önizlemeye akıl yürütme yazabilir.

Discord:

- gönder + düzenle önizleme mesajları kullanır.
- `block` kipi taslak parçalama (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.

Slack:

- `partial`, mevcut olduğunda Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, ekleme tarzı taslak önizlemeleri kullanır.
- `progress`, durum önizleme metni kullanır, ardından son yanıtı gönderir.

## İlgili

- [Mesajlar](/concepts/messages) — mesaj yaşam döngüsü ve teslimat
- [Yeniden deneme](/concepts/retry) — teslimat başarısızlığında yeniden deneme davranışı
- [Kanallar](/tr/channels) — kanal başına akış desteği
