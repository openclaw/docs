---
read_when:
    - Kanallarda akışın veya parçalamanın nasıl çalıştığını açıklama
    - Blok akışı veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtlarında veya kanal önizleme akışında hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtları, kanal önizlemesi akışı, mod eşlemesi)
title: Akış ve parçalara ayırma
x-i18n:
    generated_at: "2026-05-03T08:55:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85f6cb33031a6c818bb709e0ed14d8dd0f8c30a3dd90468a40396b3a515b5e65
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw iki ayrı akış katmanına sahiptir:

- **Blok akışı (kanallar):** asistan yazarken tamamlanan **blokları** yayar. Bunlar normal kanal iletileridir (belirteç deltaları değildir).
- **Önizleme akışı (Telegram/Discord/Slack):** üretim sırasında geçici bir **önizleme iletisini** günceller.

Bugün kanal iletilerine yönelik **gerçek belirteç-deltası akışı** yoktur. Önizleme akışı ileti tabanlıdır (gönderme + düzenlemeler/eklemeler).

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

- `text_delta/events`: model akış olayları (akış kullanmayan modeller için seyrek olabilir).
- `chunker`: min/maks sınırlar + kesme tercihi uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden iletiler (blok yanıtları).

**Denetimler:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına değişkenler).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akış bloklarını birleştirir).
- Kanal katı sınırı: `*.textChunkLimit` (ör. `channels.whatsapp.textChunkLimit`).
- Kanal parça modu: `*.chunkMode` (`length` varsayılan, `newline` uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırlarında) böler).
- Discord yumuşak sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), kullanıcı arayüzü kırpmasını önlemek için uzun yanıtları böler.

**Sınır anlamları:**

- `text_end`: chunker yayar yaymaz blokları akıt; her `text_end` üzerinde temizle.
- `message_end`: asistan iletisi bitene kadar bekle, ardından arabelleğe alınmış çıktıyı temizle.

Arabelleğe alınmış metin `maxChars` değerini aşarsa `message_end` yine chunker kullanır, bu nedenle sonunda birden fazla parça yayabilir.

### Blok akışıyla medya teslimi

`MEDIA:` yönergeleri normal teslimat meta verileridir. Blok akışı bir medya bloğunu erken gönderdiğinde, OpenClaw bu teslimatı tur için hatırlar. Son asistan yükü aynı medya URL'sini yinelerse, son teslimat eki yeniden göndermek yerine yinelenen medyayı çıkarır.

Tam yinelenen son yükler bastırılır. Son yük, zaten akıtılmış medyanın etrafına farklı metin eklerse, OpenClaw medyayı tek teslimat olarak tutarken yeni metni yine gönderir. Bu, bir agent akış sırasında `MEDIA:` yaydığında ve provider bunu tamamlanan yanıta da eklediğinde Telegram gibi kanallarda yinelenen sesli notları veya dosyaları önler.

## Parçalama algoritması (düşük/yüksek sınırlar)

Blok parçalama `EmbeddedBlockChunker` tarafından uygulanır:

- **Düşük sınır:** arabellek >= `minChars` olana kadar yayma (zorlanmadıkça).
- **Yüksek sınır:** `maxChars` öncesinde bölmeyi tercih et; zorlanırsa `maxChars` noktasında böl.
- **Kesme tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kesme.
- **Kod çitleri:** çitlerin içinde asla bölme; `maxChars` noktasında zorla bölünürken Markdown'u geçerli tutmak için çiti kapat + yeniden aç.

`maxChars`, kanal `textChunkLimit` değerine sıkıştırılır, bu nedenle kanal başına sınırları aşamazsınız.

## Birleştirme (akış bloklarını birleştir)

Blok akışı etkinleştirildiğinde OpenClaw, göndermeden önce **ardışık blok parçalarını birleştirebilir**. Bu, ilerlemeli çıktı sağlamaya devam ederken "tek satırlık spam" miktarını azaltır.

- Birleştirme, temizlemeden önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Arabellekler `maxChars` ile sınırlıdır ve bunu aşarsa temizlenir.
- `minChars`, yeterli metin birikene kadar çok küçük parçaların gönderilmesini önler (son temizleme kalan metni her zaman gönderir).
- Birleştirici `blockStreamingChunk.breakPreference` değerinden türetilir (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` üzerinden kullanılabilir (hesap başına yapılandırmalar dahil).
- Varsayılan birleştirme `minChars` değeri, geçersiz kılınmadıkça Signal/Slack/Discord için 1500'e yükseltilir.

## Bloklar arasında insana benzer tempo

Blok akışı etkinleştirildiğinde, blok yanıtları arasına (ilk bloktan sonra) **rastgeleleştirilmiş duraklama** ekleyebilirsiniz. Bu, çok baloncuklu yanıtların daha doğal hissettirmesini sağlar.

- Yapılandırma: `agents.defaults.humanDelay` (agent başına `agents.list[].humanDelay` ile geçersiz kılın).
- Modlar: `off` (varsayılan), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtları** için geçerlidir; son yanıtlar veya araç özetleri için geçerli değildir.

## "Parçaları veya her şeyi akıt"

Bu şunlara eşlenir:

- **Parçaları akıt:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ilerledikçe yay). Telegram dışı kanallar ayrıca `*.blockStreaming: true` gerektirir.
- **Her şeyi sonda akıt:** `blockStreamingBreak: "message_end"` (bir kez temizle, çok uzunsa muhtemelen birden fazla parça).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

**Kanal notu:** `*.blockStreaming` açıkça `true` olarak ayarlanmadıkça blok akışı **kapalıdır**. Kanallar, blok yanıtları olmadan canlı önizleme (`channels.<channel>.streaming`) akıtabilir.

Yapılandırma konumu hatırlatıcısı: `blockStreaming*` varsayılanları kök yapılandırma altında değil, `agents.defaults` altında bulunur.

## Önizleme akışı modları

Kanonik anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırak.
- `partial`: en son metinle değiştirilen tek önizleme.
- `block`: önizleme, parçalı/eklemeli adımlarla güncellenir.
- `progress`: üretim sırasında ilerleme/durum önizlemesi, tamamlanınca son yanıt.

### Kanal eşlemesi

| Kanal      | `off` | `partial` | `block` | `progress`             |
| ---------- | ----- | --------- | ------- | ---------------------- |
| Telegram   | ✅    | ✅        | ✅      | `partial` ile eşleşir  |
| Discord    | ✅    | ✅        | ✅      | `partial` ile eşleşir  |
| Slack      | ✅    | ✅        | ✅      | ✅                     |
| Mattermost | ✅    | ✅        | ✅      | ✅                     |

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda Slack yerel akış API çağrılarını açıp kapatır (varsayılan: `true`).
- Slack yerel akışı ve Slack asistan ileti dizisi durumu, bir yanıt ileti dizisi hedefi gerektirir. Üst düzey DM'ler bu ileti dizisi tarzı önizlemeyi göstermez, ancak yine de Slack taslak önizleme gönderilerini ve düzenlemelerini kullanabilir.

Eski anahtar geçişi:

- Telegram: eski `streamMode` ve skaler/boolean `streaming` değerleri, doctor/config uyumluluk yolları tarafından algılanır ve `streaming.mode` değerine geçirilir.
- Discord: `streamMode` + boolean `streaming`, `streaming` enum değerine otomatik geçirilir.
- Slack: `streamMode`, `streaming.mode` değerine otomatik geçirilir; boolean `streaming`, `streaming.mode` artı `streaming.nativeTransport` değerine otomatik geçirilir; eski `nativeStreaming`, `streaming.nativeTransport` değerine otomatik geçirilir.

### Çalışma zamanı davranışı

Telegram:

- DM'ler ve grup/konular genelinde `sendMessage` + `editMessageText` önizleme güncellemelerini kullanır.
- Bir önizleme yaklaşık bir dakika görünür kaldığında yerinde düzenlemek yerine yeni bir son ileti gönderir, ardından Telegram zaman damgasının yanıt tamamlanmasını yansıtması için önizlemeyi temizler.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çift akışı önlemek için).
- `/reasoning stream`, akıl yürütmeyi önizlemeye yazabilir.

Discord:

- Önizleme iletilerini gönderme + düzenleme kullanır.
- `block` modu taslak parçalamayı (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.
- Son medya, hata ve açık yanıt yükleri bekleyen önizlemeleri yeni bir taslak temizlemeden iptal eder, ardından normal teslimatı kullanır.

Slack:

- `partial`, kullanılabilir olduğunda Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, ekleme tarzı taslak önizlemelerini kullanır.
- `progress`, durum önizleme metnini, ardından son yanıtı kullanır.
- Yanıt ileti dizisi olmayan üst düzey DM'ler, Slack yerel akışı yerine taslak önizleme gönderilerini ve düzenlemelerini kullanır.
- Yerel ve taslak önizleme akışı, o tur için blok yanıtlarını bastırır; böylece bir Slack yanıtı yalnızca tek bir teslimat yolu üzerinden akıtılır.
- Son medya/hata yükleri ve ilerleme sonları atılacak taslak iletiler oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok sonları bekleyen taslak metni temizler.

Mattermost:

- Düşünmeyi, araç etkinliğini ve kısmi yanıt metnini, son yanıt göndermeye güvenli olduğunda yerinde sonlandırılan tek bir taslak önizleme gönderisine akıtır.
- Önizleme gönderisi silinmişse veya sonlandırma zamanında başka şekilde kullanılamıyorsa yeni bir son gönderi göndermeye geri döner.
- Son medya/hata yükleri, geçici bir önizleme gönderisini temizlemek yerine normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder.

Matrix:

- Taslak önizlemeler, son metin önizleme olayını yeniden kullanabildiğinde yerinde sonlandırılır.
- Yalnızca medya, hata ve yanıt-hedefi-uyuşmazlığı sonları, normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder; zaten görünür olan bayat önizleme redakte edilir.

### Araç ilerlemesi önizleme güncellemeleri

Önizleme akışı ayrıca **araç ilerlemesi** güncellemelerini de içerebilir: araçlar çalışırken, son yanıttan önce aynı önizleme iletisinde görünen "web'de aranıyor", "dosya okunuyor" veya "araç çağrılıyor" gibi kısa durum satırları. Bu, çok adımlı araç turlarını ilk düşünme önizlemesi ile son yanıt arasında sessiz kalmak yerine görsel olarak canlı tutar.

Desteklenen yüzeyler:

- **Discord**, **Slack**, **Telegram** ve **Matrix**, önizleme akışı etkinken araç ilerlemesini varsayılan olarak canlı önizleme düzenlemesine akıtır.
- Telegram, `v2026.4.22` sürümünden beri araç ilerlemesi önizleme güncellemeleri etkin olarak yayımlanmıştır; bunları etkin tutmak yayımlanan bu davranışı korur.
- **Mattermost**, araç etkinliğini zaten tek taslak önizleme gönderisine katlar (yukarıya bakın).
- Araç ilerlemesi düzenlemeleri etkin önizleme akışı modunu izler; önizleme akışı `off` olduğunda veya blok akışı iletiyi devraldığında atlanır. Telegram'da `streaming.mode: "off"` yalnızca son yanıttır: genel ilerleme konuşmaları, bağımsız "Working..." iletileri olarak teslim edilmek yerine bastırılır; onay istemleri, medya yükleri ve hatalar ise normal şekilde yönlendirilir.
- Önizleme akışını koruyup araç ilerlemesi satırlarını gizlemek için ilgili kanalın `streaming.preview.toolProgress` değerini `false` olarak ayarlayın. Önizleme düzenlemelerini tamamen devre dışı bırakmak için `streaming.mode` değerini `off` olarak ayarlayın.

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
