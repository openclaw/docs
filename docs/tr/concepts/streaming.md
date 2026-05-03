---
read_when:
    - Kanallarda akışın veya parçalamanın nasıl çalıştığını açıklama
    - Blok akışını veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtlarında veya kanal önizleme akışında hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtları, kanal önizleme akışı, mod eşlemesi)
title: Akış ve parçalara ayırma
x-i18n:
    generated_at: "2026-05-03T21:31:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw iki ayrı akış katmanına sahiptir:

- **Blok akışı (kanallar):** asistan yazarken tamamlanan **blokları** yayınlar. Bunlar normal kanal mesajlarıdır (token deltaları değil).
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

- `text_delta/events`: model akışı olayları (akış kullanmayan modeller için seyrek olabilir).
- `chunker`: min/maks sınırları + kesme tercihini uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden mesajlar (blok yanıtları).

**Kontroller:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına varyantlar).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akış bloklarını birleştirir).
- Kanal sabit üst sınırı: `*.textChunkLimit` (örn. `channels.whatsapp.textChunkLimit`).
- Kanal parça modu: `*.chunkMode` (varsayılan `length`, `newline` uzunlukla parçalamadan önce boş satırlardan (paragraf sınırları) böler).
- Discord yumuşak üst sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), kullanıcı arayüzü kırpmasını önlemek için uzun yanıtları böler.

**Sınır semantiği:**

- `text_end`: chunker yayınlar yayınlamaz blokları akıt; her `text_end` üzerinde boşalt.
- `message_end`: asistan mesajı bitene kadar bekle, ardından tamponlanmış çıktıyı boşalt.

`message_end`, tamponlanan metin `maxChars` değerini aşarsa yine de chunker kullanır, bu nedenle sonunda birden fazla parça yayınlayabilir.

### Blok akışıyla medya teslimi

`MEDIA:` yönergeleri normal teslimat meta verileridir. Blok akışı bir medya bloğunu erken gönderdiğinde, OpenClaw o tur için bu teslimatı hatırlar. Son asistan yükü aynı medya URL’sini tekrarlarsa, son teslimat eki yeniden göndermek yerine yinelenen medyayı çıkarır.

Tam olarak yinelenen son yükler bastırılır. Son yük, zaten akıtılmış medyanın etrafına farklı metin eklerse, OpenClaw medyayı tek teslimat olarak tutarken yeni metni yine de gönderir. Bu, bir agent akış sırasında `MEDIA:` yayınladığında ve sağlayıcı da bunu tamamlanan yanıta dahil ettiğinde Telegram gibi kanallarda yinelenen sesli notları veya dosyaları önler.

## Parçalama algoritması (düşük/yüksek sınırlar)

Blok parçalama `EmbeddedBlockChunker` tarafından uygulanır:

- **Düşük sınır:** tampon >= `minChars` olana kadar yayınlama (zorunlu olmadıkça).
- **Yüksek sınır:** `maxChars` öncesinde bölmeyi tercih et; zorunluysa `maxChars` konumunda böl.
- **Kesme tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kesme.
- **Kod çitleri:** çitlerin içinde asla bölme; `maxChars` değerinde zorunlu bölmede Markdown’ı geçerli tutmak için çiti kapat + yeniden aç.

`maxChars`, kanal `textChunkLimit` değerine sıkıştırılır; bu nedenle kanal başına üst sınırları aşamazsınız.

## Birleştirme (akış bloklarını birleştirme)

Blok akışı etkinleştirildiğinde, OpenClaw ardışık blok parçalarını göndermeden önce **birleştirebilir**. Bu, aşamalı çıktı sağlamaya devam ederken “tek satırlık spam” miktarını azaltır.

- Birleştirme, boşaltmadan önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Tamponlar `maxChars` ile sınırlandırılır ve bunu aşarsa boşaltılır.
- `minChars`, yeterli metin birikene kadar küçük parçaların gönderilmesini önler (son boşaltma kalan metni her zaman gönderir).
- Birleştirici `blockStreamingChunk.breakPreference` değerinden türetilir (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` üzerinden kullanılabilir (hesap başına yapılandırmalar dahil).
- Varsayılan birleştirme `minChars` değeri, geçersiz kılınmadıkça Signal/Slack/Discord için 1500’e yükseltilir.

## Bloklar arasında insan benzeri zamanlama

Blok akışı etkinleştirildiğinde, blok yanıtları arasına (ilk bloktan sonra) **rastgeleleştirilmiş bir duraklama** ekleyebilirsiniz. Bu, çok balonlu yanıtların daha doğal hissettirmesini sağlar.

- Yapılandırma: `agents.defaults.humanDelay` (agent başına `agents.list[].humanDelay` ile geçersiz kılın).
- Modlar: `off` (varsayılan), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtları** için geçerlidir; son yanıtlar veya araç özetleri için geçerli değildir.

## "Parçaları veya her şeyi akıt"

Bu şu şekilde eşlenir:

- **Parçaları akıt:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ilerledikçe yayınla). Telegram dışındaki kanalların ayrıca `*.blockStreaming: true` ayarına ihtiyacı vardır.
- **Her şeyi sonda akıt:** `blockStreamingBreak: "message_end"` (bir kez boşaltır, çok uzunsa muhtemelen birden fazla parça).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

**Kanal notu:** `*.blockStreaming` açıkça `true` olarak ayarlanmadıkça blok akışı **kapalıdır**. Kanallar blok yanıtları olmadan canlı bir önizleme akışı (`channels.<channel>.streaming`) yapabilir.

Yapılandırma konumu hatırlatıcısı: `blockStreaming*` varsayılanları kök yapılandırmada değil, `agents.defaults` altında bulunur.

## Önizleme akışı modları

Kanonik anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırakır.
- `partial`: en son metinle değiştirilen tek önizleme.
- `block`: önizleme, parçalı/eklemeli adımlarla güncellenir.
- `progress`: üretim sırasında ilerleme/durum önizlemesi, tamamlandığında son yanıt.

`streaming.mode: "block"`, Discord ve Telegram gibi düzenleme yapabilen kanallar için bir önizleme akışı modudur. Orada kanal blok teslimini etkinleştirmez. Normal blok yanıtları istediğinizde `streaming.block.enabled` veya eski `blockStreaming` kanal anahtarını kullanın. Microsoft Teams istisnadır: taslak önizleme blok aktarımı olmadığından, `streaming.mode: "block"` yerel kısmi/ilerleme akışı yerine Teams blok teslimine eşlenir.

### Kanal eşlemesi

| Kanal      | `off` | `partial` | `block` | `progress`                         |
| ---------- | ----- | --------- | ------- | ---------------------------------- |
| Telegram   | ✅    | ✅        | ✅      | düzenlenebilir ilerleme taslağı    |
| Discord    | ✅    | ✅        | ✅      | düzenlenebilir ilerleme taslağı    |
| Slack      | ✅    | ✅        | ✅      | ✅                                 |
| Mattermost | ✅    | ✅        | ✅      | ✅                                 |
| MS Teams   | ✅    | ✅        | ✅      | yerel ilerleme akışı               |

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda Slack yerel akış API çağrılarını açar/kapatır (varsayılan: `true`).
- Slack yerel akışı ve Slack asistan ileti dizisi durumu, bir yanıt ileti dizisi hedefi gerektirir. Üst düzey DM’ler bu ileti dizisi tarzı önizlemeyi göstermez, ancak yine de Slack taslak önizleme gönderilerini ve düzenlemelerini kullanabilir.

Eski anahtar geçişi:

- Telegram: eski `streamMode` ve skaler/boolean `streaming` değerleri algılanır ve doctor/yapılandırma uyumluluğu yolları tarafından `streaming.mode` değerine taşınır.
- Discord: `streamMode` + boolean `streaming`, otomatik olarak `streaming` enum değerine taşınır.
- Slack: `streamMode`, otomatik olarak `streaming.mode` değerine taşınır; boolean `streaming`, otomatik olarak `streaming.mode` ve `streaming.nativeTransport` değerlerine taşınır; eski `nativeStreaming`, otomatik olarak `streaming.nativeTransport` değerine taşınır.

### Çalışma zamanı davranışı

Telegram:

- DM’ler ve grup/konular genelinde `sendMessage` + `editMessageText` önizleme güncellemelerini kullanır.
- Bir önizleme yaklaşık bir dakika görünür kaldığında yerinde düzenlemek yerine yeni bir son mesaj gönderir, ardından Telegram zaman damgasının yanıt tamamlanmasını yansıtması için önizlemeyi temizler.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çift akışı önlemek için).
- `/reasoning stream`, akıl yürütmeyi önizlemeye yazabilir.

Discord:

- Gönderme + düzenleme önizleme mesajlarını kullanır.
- `block` modu taslak parçalamayı (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.
- Son medya, hata ve açık yanıt yükleri bekleyen önizlemeleri yeni bir taslak boşaltmadan iptal eder, ardından normal teslimatı kullanır.

Slack:

- `partial`, kullanılabilir olduğunda Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, ekleme tarzı taslak önizlemeleri kullanır.
- `progress`, durum önizleme metnini, ardından son yanıtı kullanır.
- Yanıt ileti dizisi olmayan üst düzey DM’ler, Slack yerel akışı yerine taslak önizleme gönderilerini ve düzenlemelerini kullanır.
- Yerel ve taslak önizleme akışı, o tur için blok yanıtlarını bastırır; böylece bir Slack yanıtı yalnızca tek bir teslimat yoluyla akıtılır.
- Son medya/hata yükleri ve ilerleme sonları geçici taslak mesajlar oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok sonları bekleyen taslak metni boşaltır.

Mattermost:

- Düşünme, araç etkinliği ve kısmi yanıt metnini, son yanıt güvenle gönderilebilir olduğunda yerinde sonlandırılan tek bir taslak önizleme gönderisine akıtır.
- Önizleme gönderisi silinmişse veya sonlandırma sırasında başka şekilde kullanılamıyorsa yeni bir son gönderi göndermeye geri döner.
- Son medya/hata yükleri, geçici bir önizleme gönderisini boşaltmak yerine normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder.

Matrix:

- Taslak önizlemeler, son metin önizleme olayını yeniden kullanabildiğinde yerinde sonlandırılır.
- Yalnızca medya, hata ve yanıt hedefi uyuşmazlığı sonları, normal teslimattan önce bekleyen önizleme güncellemelerini iptal eder; zaten görünür olan eski bir önizleme düzeltilir.

### Araç ilerleme önizleme güncellemeleri

Önizleme akışı ayrıca araçlar çalışırken aynı önizleme mesajında, son yanıttan önce görünen "web’de arama yapılıyor", "dosya okunuyor" veya "araç çağrılıyor" gibi kısa durum satırları olan **araç ilerlemesi** güncellemelerini içerebilir. Bu, çok adımlı araç turlarını ilk düşünme önizlemesi ile son yanıt arasında sessiz bırakmak yerine görsel olarak canlı tutar.

Desteklenen yüzeyler:

- **Discord**, **Slack**, **Telegram** ve **Matrix**, önizleme akışı etkinken varsayılan olarak araç ilerlemesini canlı önizleme düzenlemesine akıtır. Microsoft Teams, kişisel sohbetlerde yerel ilerleme akışını kullanır.
- Telegram, `v2026.4.22` sürümünden beri araç ilerlemesi önizleme güncellemeleri etkin olarak yayınlanmıştır; bunları etkin tutmak, yayımlanan davranışı korur.
- **Mattermost** araç etkinliğini zaten tek taslak önizleme gönderisine dahil eder (yukarıya bakın).
- Araç ilerlemesi düzenlemeleri etkin önizleme akışı modunu izler; önizleme akışı `off` olduğunda veya blok akışı mesajı devraldığında atlanır. Telegram’da `streaming.mode: "off"` yalnızca son yanıt anlamına gelir: genel ilerleme konuşmaları bağımsız durum mesajları olarak teslim edilmek yerine bastırılır; onay istemleri, medya yükleri ve hatalar ise normal şekilde yönlendirilir.
- Önizleme akışını koruyup araç ilerlemesi satırlarını gizlemek için ilgili kanalın `streaming.preview.toolProgress` değerini `false` olarak ayarlayın. Önizleme düzenlemelerini tamamen devre dışı bırakmak için `streaming.mode` değerini `off` olarak ayarlayın.
- Telegram seçili alıntı yanıtları bir istisnadır: `replyToMode` `"off"` değilse ve seçili alıntı metni varsa, OpenClaw araç ilerlemesi önizleme satırlarının işlenememesi için o turda yanıt önizleme akışını atlar. Seçili alıntı metni olmayan geçerli mesaj yanıtları ise önizleme akışını korur. Ayrıntılar için [Telegram kanal belgelerine](/tr/channels/telegram) bakın.

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

- [İlerleme taslakları](/tr/concepts/progress-drafts) — uzun turlar sırasında güncellenen görünür çalışma süreci mesajları
- [Mesajlar](/tr/concepts/messages) — mesaj yaşam döngüsü ve teslimat
- [Yeniden deneme](/tr/concepts/retry) — teslimat hatasında yeniden deneme davranışı
- [Kanallar](/tr/channels) — kanal başına akış desteği
