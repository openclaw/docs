---
read_when:
    - Kanallarda akışın veya parçalamanın nasıl çalıştığını açıklama
    - Blok akışını veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtlarını veya kanal önizleme akışını hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtlar, kanal önizleme akışı, mod eşleme)
title: Akış ve Parçalama
x-i18n:
    generated_at: "2026-04-22T04:22:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6b246025ea1b1be57705bde60c0cdb485ffda727392cf00ea5a165571e37fce
    source_path: concepts/streaming.md
    workflow: 15
---

# Akış + parçalama

OpenClaw iki ayrı akış katmanına sahiptir:

- **Blok akışı (kanallar):** agent yazarken tamamlanmış **blokları** gönderir. Bunlar normal kanal mesajlarıdır (token delta değildir).
- **Önizleme akışı (Telegram/Discord/Slack):** üretim sırasında geçici bir **önizleme mesajını** günceller.

Bugün kanal mesajlarına **gerçek token-delta akışı** yoktur. Önizleme akışı mesaj tabanlıdır (gönder + düzenle/ekle).

## Blok akışı (kanal mesajları)

Blok akışı, agent çıktısını kullanılabilir oldukça kaba parçalar halinde gönderir.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Gösterim:

- `text_delta/events`: model akış olayları (akışsız modeller için seyrek olabilir).
- `chunker`: min/max sınırlar + ayırma tercihi uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden mesajlar (blok yanıtlar).

**Denetimler:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına varyantları).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akış bloklarını birleştir).
- Kanal sabit sınırı: `*.textChunkLimit` (ör. `channels.whatsapp.textChunkLimit`).
- Kanal parça modu: `*.chunkMode` (`length` varsayılan, `newline` boş satırlarda (paragraf sınırları) ayırır, ardından uzunluk temelli parçalamaya geçer).
- Discord yumuşak sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), UI kırpılmasını önlemek için uzun yanıtları böler.

**Sınır semantiği:**

- `text_end`: chunker blok ürettiği anda blokları akıt; her `text_end` noktasında boşalt.
- `message_end`: agent mesajı tamamlanana kadar bekle, sonra tamponlanan çıktıyı boşalt.

`message_end`, tamponlanan metin `maxChars` değerini aşarsa yine chunker kullanır; bu nedenle sonda birden çok parça üretebilir.

## Parçalama algoritması (alt/üst sınırlar)

Blok parçalama `EmbeddedBlockChunker` ile uygulanır:

- **Alt sınır:** tampon >= `minChars` olana kadar gönderme (zorlanmadıkça).
- **Üst sınır:** `maxChars` öncesinde ayırmayı tercih et; zorlanırsa `maxChars` noktasında ayır.
- **Ayırma tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → zorunlu ayırma.
- **Kod blokları:** hiçbir zaman kod bloklarının içinde ayırma yapma; `maxChars` noktasında zorla ayırırken Markdown'ın geçerli kalması için kod bloğunu kapat + yeniden aç.

`maxChars`, kanalın `textChunkLimit` değerine sabitlenir; bu nedenle kanal başına sınırları aşamazsınız.

## Birleştirme (akış bloklarını birleştirme)

Blok akışı etkin olduğunda OpenClaw, **ardışık blok parçalarını**
göndermeden önce birleştirebilir. Bu, ilerlemeli çıktı sağlamaya devam ederken
“tek satırlık spam”ı azaltır.

- Birleştirme, boşaltmadan önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Tamponlar `maxChars` ile sınırlandırılır ve bu sınır aşılırsa boşaltılır.
- `minChars`, yeterli metin birikene kadar küçük parçaların gönderilmesini önler
  (son boşaltma her zaman kalan metni gönderir).
- Birleştirici, `blockStreamingChunk.breakPreference` değerinden türetilir
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` ile kullanılabilir (hesap başına yapılandırmalar dahil).
- Varsayılan birleştirme `minChars`, Signal/Slack/Discord için geçersiz kılınmadıkça 1500'e yükseltilir.

## Bloklar arasında insana benzer tempo

Blok akışı etkin olduğunda, blok yanıtlar arasında
(ilk bloktan sonra) **rastgeleleştirilmiş bir duraklama** ekleyebilirsiniz. Bu, çok baloncuklu yanıtların
daha doğal hissettirmesini sağlar.

- Yapılandırma: `agents.defaults.humanDelay` (agent başına `agents.list[].humanDelay` ile geçersiz kılınabilir).
- Modlar: `off` (varsayılan), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtlar** için geçerlidir; son yanıtlar veya araç özetleri için değil.

## "Parçaları akıt veya her şeyi"

Bu şu anlama gelir:

- **Parçaları akıt:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ilerledikçe gönder). Telegram dışındaki kanallarda ayrıca `*.blockStreaming: true` gerekir.
- **Her şeyi sonda akıt:** `blockStreamingBreak: "message_end"` (bir kez boşalt, çok uzunsa yine birden fazla parça olabilir).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

**Kanal notu:** `*.blockStreaming` açıkça `true` olarak
ayarlanmadıkça blok akışı **kapalıdır**. Kanallar, blok yanıtlar olmadan da canlı önizleme
akıtabilir (`channels.<channel>.streaming`).

Yapılandırma konumu hatırlatması: `blockStreaming*` varsayılanları
kök yapılandırmada değil, `agents.defaults` altında bulunur.

## Önizleme akışı modları

Kanonik anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırak.
- `partial`: en son metinle değiştirilen tek önizleme.
- `block`: parçalı/eklemeli adımlarla önizleme güncellemeleri.
- `progress`: üretim sırasında ilerleme/durum önizlemesi, tamamlanınca son yanıt.

### Kanal eşleme

| Kanal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | `partial` olarak eşlenir |
| Discord    | ✅    | ✅        | ✅      | `partial` olarak eşlenir |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda Slack yerel akış API çağrılarını açıp kapatır (varsayılan: `true`).
- Slack yerel akışı ve Slack agent thread durumu, hedef olarak bir yanıt thread'i gerektirir; üst düzey DM'lerde bu thread tarzı önizleme görünmez.

Eski anahtar geçişi:

- Telegram: `streamMode` + boolean `streaming`, `streaming` enum'una otomatik geçirilir.
- Discord: `streamMode` + boolean `streaming`, `streaming` enum'una otomatik geçirilir.
- Slack: `streamMode`, `streaming.mode` alanına otomatik geçirilir; boolean `streaming`, `streaming.mode` artı `streaming.nativeTransport` alanlarına otomatik geçirilir; eski `nativeStreaming`, `streaming.nativeTransport` alanına otomatik geçirilir.

### Çalışma zamanı davranışı

Telegram:

- DM'ler ve grup/konular genelinde önizleme güncellemeleri için `sendMessage` + `editMessageText` kullanır.
- Telegram blok akışı açıkça etkinleştirildiğinde (çifte akışı önlemek için) önizleme akışı atlanır.
- `/reasoning stream`, önizlemeye reasoning yazabilir.

Discord:

- Gönder + düzenle önizleme mesajları kullanır.
- `block` modu taslak parçalama (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.
- Son medya, hata ve açık-yanıt payload'ları, yeni bir taslak boşaltmadan bekleyen önizlemeleri iptal eder, ardından normal teslimatı kullanır.

Slack:

- `partial`, mümkün olduğunda Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, eklemeli taslak önizlemeleri kullanır.
- `progress`, durum önizleme metni kullanır, ardından son yanıtı verir.
- Son medya/hata payload'ları ve ilerleme sonları, geçici taslak mesajlar oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok sonları bekleyen taslak metni boşaltır.

Mattermost:

- Düşünme, araç etkinliği ve kısmi yanıt metnini, son yanıt güvenle gönderilebildiğinde yerinde kesinleşen tek bir taslak önizleme gönderisi içinde akıtır.
- Önizleme gönderisi silindiyse veya kesinleştirme anında başka şekilde kullanılamıyorsa yeni bir son gönderi göndermeye geri döner.
- Son medya/hata payload'ları, geçici bir önizleme gönderisini boşaltmak yerine normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder.

Matrix:

- Son metin önizleme olayını yeniden kullanabiliyorsa taslak önizlemeler yerinde kesinleştirilir.
- Yalnızca medya içeren, hata ve yanıt-hedefi uyuşmazlığı olan sonlandırmalar, normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder; zaten görünen eski bir önizleme varsa redakte edilir.

### Araç ilerleme önizleme güncellemeleri

Önizleme akışı ayrıca **araç ilerleme** güncellemelerini de içerebilir — araçlar çalışırken son yanıttan önce aynı önizleme mesajında görünen "web aranıyor", "dosya okunuyor" veya "araç çağrılıyor" gibi kısa durum satırları. Bu, çok adımlı araç turlarını ilk düşünme önizlemesi ile son yanıt arasındaki sessizlik yerine görsel olarak canlı tutar.

Desteklenen yüzeyler:

- **Discord**, **Slack** ve **Telegram**, araç ilerlemesini canlı önizleme düzenlemesine akıtır.
- **Mattermost** zaten araç etkinliğini tek taslak önizleme gönderisine katlar (yukarıya bakın).
- Araç ilerleme düzenlemeleri etkin önizleme akışı modunu izler; önizleme akışı `off` olduğunda veya mesajın kontrolünü blok akışı aldığında atlanırlar.

## İlgili

- [Messages](/tr/concepts/messages) — mesaj yaşam döngüsü ve teslimat
- [Retry](/tr/concepts/retry) — teslimat hatasında yeniden deneme davranışı
- [Channels](/tr/channels) — kanal başına akış desteği
