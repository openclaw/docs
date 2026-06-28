---
read_when:
    - Kanallarda akışın veya parçalamanın nasıl çalıştığını açıklama
    - Blok akışını veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtlarını veya kanal önizleme akışını hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtları, kanal önizleme akışı, mod eşlemesi)
title: Akış ve parçalama
x-i18n:
    generated_at: "2026-06-28T00:31:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw iki ayrı akış katmanına sahiptir:

- **Blok akışı (kanallar):** asistan yazarken tamamlanmış **blokları** yayınlar. Bunlar normal kanal mesajlarıdır (token deltaları değil).
- **Önizleme akışı (Telegram/Discord/Slack):** üretim sırasında geçici bir **önizleme mesajını** günceller.

Bugün kanal mesajlarına yönelik **gerçek token-delta akışı** yoktur. Önizleme akışı mesaj tabanlıdır (gönderme + düzenlemeler/eklemeler).

## Blok akışı (kanal mesajları)

Blok akışı, asistan çıktısını kullanılabilir hale geldikçe kaba parçalar halinde gönderir.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Açıklamalar:

- `text_delta/events`: model akış olayları (akışsız modeller için seyrek olabilir).
- `chunker`: min/maks sınırları + kesme tercihini uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden mesajlar (blok yanıtları).

**Denetimler:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına varyantlar).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akıştaki blokları birleştirir).
- Kanal sabit üst sınırı: `*.textChunkLimit` (örn. `channels.whatsapp.textChunkLimit`).
- Kanal parça modu: `*.chunkMode` (varsayılan `length`; `newline`, uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırlarında) böler).
- Discord yumuşak üst sınırı: `channels.discord.maxLinesPerMessage` (varsayılan 17), UI kırpmasını önlemek için uzun yanıtları böler.

**Sınır semantiği:**

- `text_end`: chunker yayınladığı anda blokları akıt; her `text_end` üzerinde boşalt.
- `message_end`: asistan mesajı bitene kadar bekle, ardından arabelleğe alınmış çıktıyı boşalt.

Arabelleğe alınmış metin `maxChars` değerini aşarsa `message_end` yine de chunker kullanır, bu yüzden sonunda birden fazla parça yayınlayabilir.

### Blok akışıyla medya teslimi

Akıştaki medya `mediaUrl` veya
`mediaUrls` gibi yapılandırılmış yük alanlarını kullanmalıdır; akıştaki metin ek komutu olarak ayrıştırılmaz. Blok
akışı medyayı erken gönderdiğinde, OpenClaw bu tur için o teslimi hatırlar. Son
asistan yükü aynı medya URL'sini yinelerse, son teslim ek dosyayı yeniden göndermek yerine
yinelenen medyayı çıkarır.

Tam olarak yinelenen son yükler bastırılır. Son yük, zaten akıtılmış medyanın etrafına
farklı metin eklerse, OpenClaw medyayı tek teslimde tutarken
yeni metni yine de gönderir. Bu, Telegram gibi kanallarda yinelenen sesli
notları veya dosyaları önler.

## Parçalama algoritması (alt/üst sınırlar)

Blok parçalama `EmbeddedBlockChunker` tarafından uygulanır:

- **Alt sınır:** arabellek >= `minChars` olana kadar yayınlama (zorlanmadıkça).
- **Üst sınır:** `maxChars` öncesinde bölmeyi tercih et; zorlanırsa `maxChars` noktasında böl.
- **Kesme tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kesme.
- **Kod çitleri:** çitlerin içinde asla bölme; `maxChars` noktasında zorunlu bölmede, Markdown'ı geçerli tutmak için çiti kapat + yeniden aç.

`maxChars` kanalın `textChunkLimit` değerine sıkıştırılır, bu yüzden kanal başına üst sınırları aşamazsınız.

## Birleştirme (akıştaki blokları birleştirme)

Blok akışı etkinleştirildiğinde, OpenClaw ardışık blok parçalarını göndermeden önce
**birleştirebilir**. Bu, ilerlemeli çıktı sağlamaya devam ederken
"tek satırlık spam"i azaltır.

- Birleştirme, boşaltmadan önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Arabellekler `maxChars` ile sınırlandırılır ve bunu aşarlarsa boşaltılır.
- `minChars`, yeterli metin birikene kadar küçük parçacıkların gönderilmesini önler
  (son boşaltma kalan metni her zaman gönderir).
- Birleştirici `blockStreamingChunk.breakPreference` değerinden türetilir
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` üzerinden kullanılabilir (hesap başına yapılandırmalar dahil).
- Varsayılan birleştirme `minChars` değeri, geçersiz kılınmadıkça Signal/Slack/Discord için 1500'e yükseltilir.

## Bloklar arasında insan benzeri tempo

Blok akışı etkinleştirildiğinde, blok yanıtları arasına (ilk bloktan sonra)
**rastgeleleştirilmiş bir duraklama** ekleyebilirsiniz. Bu, çok baloncuklu yanıtları
daha doğal hissettirir.

- Yapılandırma: `agents.defaults.humanDelay` (ajan başına `agents.list[].humanDelay` ile geçersiz kılın).
- Modlar: `off` (varsayılan), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtlarına** uygulanır; son yanıtlar veya araç özetleri için uygulanmaz.

## "Parçaları veya her şeyi akıt"

Bu şu şekilde eşlenir:

- **Parçaları akıt:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ilerledikçe yayınla). Telegram dışı kanallar ayrıca `*.blockStreaming: true` gerektirir.
- **Her şeyi sonda akıt:** `blockStreamingBreak: "message_end"` (bir kez boşalt; çok uzunsa muhtemelen birden çok parça).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

**Kanal notu:** `*.blockStreaming` açıkça `true` olarak ayarlanmadıkça
blok akışı **kapalıdır**. Kanallar, blok yanıtları olmadan canlı bir önizleme
(`channels.<channel>.streaming`) akıtabilir.

Yapılandırma konumu hatırlatması: `blockStreaming*` varsayılanları kök yapılandırma altında değil,
`agents.defaults` altında bulunur.

## Önizleme akışı modları

Kanonik anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırak.
- `partial`: en son metinle değiştirilen tek önizleme.
- `block`: parçalı/eklemeli adımlarla güncellenen önizleme.
- `progress`: üretim sırasında ilerleme/durum önizlemesi, tamamlanınca son yanıt.

`streaming.mode: "block"`, Discord ve Telegram gibi düzenleme yapabilen kanallar için
bir önizleme akışı modudur. Orada kanal blok teslimini etkinleştirmez.
Normal blok yanıtları istediğinizde `streaming.block.enabled` veya eski `blockStreaming` kanal anahtarını kullanın.
Microsoft Teams istisnadır: taslak önizleme blok taşıması olmadığından,
`streaming.mode: "block"` yerel kısmi/ilerleme akışı yerine Teams blok
teslimine eşlenir.

### Kanal eşlemesi

| Kanal      | `off` | `partial` | `block` | `progress`                    |
| ---------- | ----- | --------- | ------- | ----------------------------- |
| Telegram   | ✅    | ✅        | ✅      | düzenlenebilir ilerleme taslağı |
| Discord    | ✅    | ✅        | ✅      | düzenlenebilir ilerleme taslağı |
| Slack      | ✅    | ✅        | ✅      | ✅                            |
| Mattermost | ✅    | ✅        | ✅      | ✅                            |
| MS Teams   | ✅    | ✅        | ✅      | yerel ilerleme akışı          |

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda Slack yerel akış API çağrılarını açıp kapatır (varsayılan: `true`).
- Slack yerel akışı ve Slack asistan iş parçacığı durumu bir yanıt iş parçacığı hedefi gerektirir. Üst düzey DM'ler bu iş parçacığı tarzı önizlemeyi göstermez, ancak yine de Slack taslak önizleme gönderilerini ve düzenlemelerini kullanabilir.

Eski anahtar geçişi:

- Telegram: eski `streamMode` ve skaler/boolean `streaming` değerleri doctor/config uyumluluk yolları tarafından algılanır ve `streaming.mode` değerine geçirilir.
- Discord: `streamMode` + boolean `streaming`, `streaming` enum'u için çalışma zamanı takma adları olarak kalır; kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- Slack: `streamMode`, `streaming.mode` için çalışma zamanı takma adı olarak kalır; boolean `streaming`, `streaming.mode` artı `streaming.nativeTransport` için çalışma zamanı takma adı olarak kalır; eski `nativeStreaming`, `streaming.nativeTransport` için çalışma zamanı takma adı olarak kalır. Kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.

### Çalışma zamanı davranışı

Telegram:

- DM'ler ve grup/konular genelinde `sendMessage` + `editMessageText` önizleme güncellemelerini kullanır.
- Kısa ilk önizlemeler push bildirimi UX'i için hâlâ debounce edilir, ancak Telegram artık aktif çalıştırmaların görsel olarak sessiz kalmaması için bunları sınırlı bir gecikmeden sonra somutlaştırır.
- Son metin aktif önizlemeyi yerinde düzenler; uzun son yanıtlar bu mesajı ilk parça için yeniden kullanır ve yalnızca kalan parçaları gönderir.
- `block` modu, önizlemeyi `streaming.preview.chunk.maxChars` değerinde yeni bir mesaja döndürür (varsayılan 800, Telegram'ın 4096 düzenleme sınırıyla sınırlı); diğer modlar bir önizlemeyi 4096 karaktere kadar büyütür.
- `progress` modu araç ilerlemesini düzenlenebilir bir durum taslağında tutar, yanıt akışı aktifken ancak henüz araç satırı yokken durum etiketini somutlaştırır, tamamlanınca bu taslağı temizler ve son yanıtı normal teslim üzerinden gönderir.
- Tamamlanmış metin doğrulanmadan önce son düzenleme başarısız olursa, OpenClaw normal son teslimi kullanır ve bayat önizlemeyi temizler.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çift akışı önlemek için).
- `/reasoning stream`, son teslimden sonra silinen geçici bir önizlemeye akıl yürütme yazabilir.

Discord:

- Gönder + düzenle önizleme mesajlarını kullanır.
- `block` modu taslak parçalamayı (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.
- Son medya, hata ve açık yanıt yükleri, bekleyen önizlemeleri yeni bir taslak boşaltmadan iptal eder, ardından normal teslimi kullanır.

Slack:

- `partial`, kullanılabilir olduğunda Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, ekleme tarzı taslak önizlemeleri kullanır.
- `progress`, durum önizleme metnini, ardından son yanıtı kullanır.
- Yanıt iş parçacığı olmayan üst düzey DM'ler, Slack yerel akışı yerine taslak önizleme gönderilerini ve düzenlemelerini kullanır.
- Yerel ve taslak önizleme akışı, o tur için blok yanıtlarını bastırır; böylece bir Slack yanıtı yalnızca tek bir teslim yolu tarafından akıtılır.
- Son medya/hata yükleri ve ilerleme sonları tek kullanımlık taslak mesajlar oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok sonları bekleyen taslak metni boşaltır.

Mattermost:

- Düşünme, araç etkinliği ve kısmi yanıt metnini, son yanıtın gönderilmesi güvenli olduğunda yerinde sonlandırılan tek bir taslak önizleme gönderisine akıtır.
- Önizleme gönderisi silinmişse veya sonlandırma zamanında başka şekilde kullanılamıyorsa, yeni bir son gönderi göndermeye geri döner.
- Son medya/hata yükleri, normal teslimden önce geçici bir önizleme gönderisini boşaltmak yerine bekleyen önizleme güncellemelerini iptal eder.

Matrix:

- Taslak önizlemeler, son metin önizleme olayını yeniden kullanabildiğinde yerinde sonlandırılır.
- Yalnızca medya, hata ve yanıt-hedef-uyumsuzluğu sonları, normal teslimden önce bekleyen önizleme güncellemelerini iptal eder; zaten görünür olan bayat bir önizleme geri alınır.

### Araç ilerlemesi önizleme güncellemeleri

Önizleme akışı, araçlar çalışırken, son yanıttan önce aynı önizleme mesajında görünen "web'de aranıyor", "dosya okunuyor" veya "araç çağrılıyor" gibi kısa durum satırları olan **araç ilerlemesi** güncellemelerini de içerebilir. Codex app-server modunda, Codex giriş/yorum mesajları aynı önizleme yolunu kullanır; bu yüzden kısa "Kontrol ediyorum..." ilerleme notları, son yanıtın parçası olmadan düzenlenebilir taslağa akabilir. Bu, çok adımlı araç turlarını ilk düşünme önizlemesi ile son yanıt arasında sessiz kalmak yerine görsel olarak canlı tutar.

Uzun süren araçlar dönmeden önce tipli ilerleme yayınlayabilir. Örneğin,
`web_fetch` başladığında beş saniyelik bir zamanlayıcı kurar: getirme hâlâ
beklemedeyse önizleme `Fetching page content...` gösterebilir; getirme
o zamandan önce biter veya iptal edilirse ilerleme satırı yayınlanmaz. Daha sonraki son araç
sonucu yine de modele normal şekilde teslim edilir.

Desteklenen yüzeyler:

- **Discord**, **Slack**, **Telegram** ve **Matrix**, önizleme akışı etkin olduğunda araç ilerlemesini ve Codex giriş güncellemelerini varsayılan olarak canlı önizleme düzenlemesine aktarır. Microsoft Teams, kişisel sohbetlerde kendi yerel ilerleme akışını kullanır.
- Telegram, `v2026.4.22` sürümünden beri araç ilerlemesi önizleme güncellemeleri etkin olarak yayımlandı; bunları etkin tutmak yayımlanmış bu davranışı korur.
- **Mattermost**, araç etkinliğini zaten tek taslak önizleme gönderisine dahil eder (yukarıya bakın).
- Araç ilerlemesi düzenlemeleri etkin önizleme akışı modunu izler; önizleme akışı `off` olduğunda veya blok akışı mesajı devraldığında atlanırlar. Telegram'da `streaming.mode: "off"` yalnızca son çıktıdır: genel ilerleme sohbeti de bağımsız durum mesajları olarak teslim edilmek yerine bastırılır; onay istemleri, medya yükleri ve hatalar ise normal şekilde yönlendirilir.
- Önizleme akışını koruyup araç ilerlemesi satırlarını gizlemek için ilgili kanal için `streaming.preview.toolProgress` değerini `false` olarak ayarlayın. Komut/çalıştırma metnini gizlerken araç ilerlemesi satırlarını görünür tutmak için `streaming.preview.commandText` değerini `"status"` veya `streaming.progress.commandText` değerini `"status"` olarak ayarlayın; yayımlanmış davranışı korumak için varsayılan değer `"raw"`dır. Bu ilke, Discord, Matrix, Microsoft Teams, Mattermost, Slack taslak önizlemeleri ve Telegram dahil olmak üzere OpenClaw'ın kompakt ilerleme oluşturucusunu kullanan taslak/ilerleme kanalları tarafından paylaşılır. Önizleme düzenlemelerini tamamen devre dışı bırakmak için `streaming.mode` değerini `off` olarak ayarlayın.
- Telegram seçili alıntı yanıtları bir istisnadır: `replyToMode` `"off"` olmadığında ve seçili alıntı metni mevcut olduğunda, OpenClaw o tur için yanıt önizleme akışını atlar, böylece araç ilerlemesi önizleme satırları oluşturulamaz. Seçili alıntı metni olmayan geçerli mesaj yanıtları önizleme akışını yine de korur. Ayrıntılar için [Telegram kanal belgelerine](/tr/channels/telegram) bakın.

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

Aynı yapıyı başka bir kompakt ilerleme kanalı anahtarı altında kullanın; örneğin `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` veya Slack taslak önizlemeleri. İlerleme taslağı modu için aynı ilkeyi `streaming.progress` altında yerleştirin:

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
- [Mesajlar](/tr/concepts/messages) - mesaj yaşam döngüsü ve teslimat
- [Yeniden deneme](/tr/concepts/retry) - teslimat hatasında yeniden deneme davranışı
- [Kanallar](/tr/channels) - kanal başına akış desteği
