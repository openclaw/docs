---
read_when:
    - Kanallarda akışın veya parçalara ayırmanın nasıl çalıştığını açıklama
    - Blok akışı veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtlarında veya kanal önizleme akışında hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtları, kanal önizleme akışı, mod eşlemesi)
title: Akış ve parçalara ayırma
x-i18n:
    generated_at: "2026-07-01T08:23:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2724c21414dd470780f0c7f634380bef3feeb54a08bd0da3e944173340df1c80
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw iki ayrı akış katmanına sahiptir:

- **Blok akışı (kanallar):** asistan yazarken tamamlanmış **blokları** yayar. Bunlar normal kanal mesajlarıdır (token delta'ları değildir).
- **Önizleme akışı (Telegram/Discord/Slack):** üretim sırasında geçici bir **önizleme mesajını** günceller.

Bugün kanal mesajlarına yönelik **gerçek token-delta akışı yoktur**. Önizleme akışı mesaj tabanlıdır (gönderme + düzenlemeler/eklemeler).

## Blok akışı (kanal mesajları)

Blok akışı, asistan çıktısını hazır oldukça kaba parçalar halinde gönderir.

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
- `chunker`: min/maks sınırları + kesme tercihini uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden mesajlar (blok yanıtları).

**Kontroller:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (varsayılan kapalı).
- Kanal geçersiz kılmaları: kanal başına `"on"`/`"off"` zorlamak için `*.blockStreaming` (ve hesap başına varyantlar).
- `agents.defaults.blockStreamingBreak`: `"text_end"` veya `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akışlı blokları birleştirir).
- Kanal katı sınırı: `*.textChunkLimit` (ör. `channels.whatsapp.textChunkLimit`).
- Kanal parça modu: `*.chunkMode` (`length` varsayılan, `newline` uzunluk parçalamadan önce boş satırlardan (paragraf sınırları) böler).
- Discord yumuşak sınırı: UI kırpılmasını önlemek için uzun yanıtları bölen `channels.discord.maxLinesPerMessage` (varsayılan 17).

**Sınır semantiği:**

- `text_end`: chunker yayar yaymaz blokları akıt; her `text_end` üzerinde boşalt.
- `message_end`: asistan mesajı bitene kadar bekle, sonra tamponlanan çıktıyı boşalt.

Tamponlanan metin `maxChars` değerini aşarsa `message_end` yine chunker kullanır, bu yüzden sonda birden fazla parça yayabilir.

### Blok akışıyla medya teslimi

Akışlı medya `mediaUrl` veya `mediaUrls` gibi yapılandırılmış yük alanları kullanmalıdır; akışlı metin bir ek komutu olarak ayrıştırılmaz. Blok akışı medyayı erken gönderdiğinde, OpenClaw bu teslimi tur için hatırlar. Son asistan yükü aynı medya URL'sini tekrarlarsa, son teslim ek dosyayı yeniden göndermek yerine yinelenen medyayı çıkarır.

Tam olarak yinelenen son yükler bastırılır. Son yük, zaten akışla gönderilmiş medya etrafına farklı metin eklerse, OpenClaw medyayı tek teslimde tutarken yeni metni yine gönderir. Bu, Telegram gibi kanallarda yinelenen sesli notları veya dosyaları önler.

## Parçalama algoritması (düşük/yüksek sınırlar)

Blok parçalama `EmbeddedBlockChunker` tarafından uygulanır:

- **Düşük sınır:** tampon >= `minChars` olana kadar yayma (zorlanmadıkça).
- **Yüksek sınır:** `maxChars` öncesinde bölmeyi tercih et; zorlanırsa `maxChars` noktasında böl.
- **Kesme tercihi:** `paragraph` → `newline` → `sentence` → `whitespace` → sert kesme.
- **Kod çitleri:** çitlerin içinde asla bölme; `maxChars` noktasında zorlanınca Markdown geçerli kalsın diye çiti kapat + yeniden aç.

`maxChars` kanal `textChunkLimit` değerine sıkıştırılır, bu yüzden kanal başına sınırları aşamazsınız.

## Birleştirme (akışlı blokları birleştirme)

Blok akışı etkinleştirildiğinde, OpenClaw dışarı göndermeden önce **ardışık blok parçalarını birleştirebilir**. Bu, ilerlemeli çıktı sağlamaya devam ederken "tek satırlı spam"i azaltır.

- Birleştirme, boşaltmadan önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Tamponlar `maxChars` ile sınırlanır ve bunu aşarlarsa boşaltılır.
- `minChars`, yeterli metin birikene kadar küçük parçaların gönderilmesini engeller
  (son boşaltma kalan metni her zaman gönderir).
- Birleştirici `blockStreamingChunk.breakPreference` değerinden türetilir
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → boşluk).
- Kanal geçersiz kılmaları `*.blockStreamingCoalesce` üzerinden kullanılabilir (hesap başına yapılandırmalar dahil).
- Varsayılan birleştirme `minChars` değeri, geçersiz kılınmadıkça Signal/Slack/Discord için 1500'e yükseltilir.

## Bloklar arasında insan benzeri tempo

Blok akışı etkinleştirildiğinde, blok yanıtları arasına (ilk bloktan sonra) **rastgeleleştirilmiş bir duraklama** ekleyebilirsiniz. Bu, çok baloncuklu yanıtların daha doğal hissettirmesini sağlar.

- Yapılandırma: `agents.defaults.humanDelay` (ajan başına `agents.list[].humanDelay` ile geçersiz kılın).
- Modlar: `off` (varsayılan), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Yalnızca **blok yanıtlarına** uygulanır, son yanıtlara veya araç özetlerine uygulanmaz.

## "Parçaları veya her şeyi akıt"

Bu şuna eşlenir:

- **Parçaları akıt:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (ilerledikçe yay). Telegram dışı kanalların ayrıca `*.blockStreaming: true` değerine ihtiyacı vardır.
- **Her şeyi sonda akıt:** `blockStreamingBreak: "message_end"` (bir kez boşalt, çok uzunsa muhtemelen birden fazla parça).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

**Kanal notu:** `*.blockStreaming` açıkça `true` olarak ayarlanmadıkça blok akışı **kapalıdır**. Kanallar, blok yanıtları olmadan canlı bir önizleme (`channels.<channel>.streaming`) akıtabilir.

Yapılandırma konumu hatırlatması: `blockStreaming*` varsayılanları kök yapılandırmada değil, `agents.defaults` altında bulunur.

## Önizleme akışı modları

Kanonik anahtar: `channels.<channel>.streaming`

Modlar:

- `off`: önizleme akışını devre dışı bırakır.
- `partial`: en son metinle değiştirilen tek önizleme.
- `block`: önizleme parçalı/eklemeli adımlarla güncellenir.
- `progress`: üretim sırasında ilerleme/durum önizlemesi, tamamlandığında son yanıt.

`streaming.mode: "block"`, Discord ve Telegram gibi düzenleme yapabilen kanallar için bir önizleme akışı modudur. Orada kanal blok teslimini etkinleştirmez. Normal blok yanıtları istediğinizde `streaming.block.enabled` veya eski `blockStreaming` kanal anahtarını kullanın. Microsoft Teams istisnadır: taslak önizleme blok taşıması olmadığı için `streaming.mode: "block"`, yerel partial/progress akışı yerine Teams blok teslimine eşlenir.

### Kanal eşlemesi

| Kanal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | düzenlenebilir ilerleme taslağı |
| Discord    | ✅    | ✅        | ✅      | düzenlenebilir ilerleme taslağı |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | yerel ilerleme akışı    |

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda Slack yerel akış API çağrılarını açıp kapatır (varsayılan: `true`).
- Slack yerel akışı ve Slack asistan ileti dizisi durumu bir yanıt ileti dizisi hedefi gerektirir. Üst düzey DM'ler bu ileti dizisi tarzı önizlemeyi göstermez, ancak Slack taslak önizleme gönderilerini ve düzenlemelerini yine kullanabilirler.

Eski anahtar geçişi:

- Telegram: eski `streamMode` ve skaler/boole `streaming` değerleri doctor/config uyumluluk yolları tarafından algılanır ve `streaming.mode` değerine geçirilir.
- Discord: `streamMode` + boole `streaming`, `streaming` enum'u için çalışma zamanı takma adları olarak kalır; kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- Slack: `streamMode`, `streaming.mode` için çalışma zamanı takma adı olarak kalır; boole `streaming`, `streaming.mode` artı `streaming.nativeTransport` için çalışma zamanı takma adı olarak kalır; eski `nativeStreaming`, `streaming.nativeTransport` için çalışma zamanı takma adı olarak kalır. Kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.

### Çalışma zamanı davranışı

Telegram:

- DM'ler ve grup/konular genelinde `sendMessage` + `editMessageText` önizleme güncellemelerini kullanır.
- Kısa ilk önizlemeler anlık bildirim UX'i için hâlâ debounce edilir, ancak Telegram artık bunları sınırlı bir gecikmeden sonra somutlaştırır, böylece etkin çalıştırmalar görsel olarak sessiz kalmaz.
- Son metin, etkin önizlemeyi yerinde düzenler; uzun son yanıtlar ilk parça için bu mesajı yeniden kullanır ve yalnızca kalan parçaları gönderir.
- `block` modu, önizlemeyi `streaming.preview.chunk.maxChars` değerinde yeni bir mesaja döndürür (varsayılan 800, Telegram'ın 4096 düzenleme sınırıyla sınırlı); diğer modlar tek bir önizlemeyi 4096 karaktere kadar büyütür.
- `progress` modu araç ilerlemesini düzenlenebilir bir durum taslağında tutar, yanıt akışı etkin olduğunda ancak henüz araç satırı bulunmadığında durum etiketini somutlaştırır, tamamlandığında bu taslağı temizler ve son yanıtı normal teslim üzerinden gönderir.
- Tamamlanan metin onaylanmadan önce son düzenleme başarısız olursa, OpenClaw normal son teslimi kullanır ve eski önizlemeyi temizler.
- Telegram blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır (çift akışı önlemek için).
- `/reasoning stream`, son teslimden sonra silinen geçici bir önizlemeye akıl yürütme yazabilir.

Discord:

- Gönderme + düzenleme önizleme mesajlarını kullanır.
- `block` modu taslak parçalamayı (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı atlanır.
- Son medya, hata ve açık yanıt yükleri, yeni bir taslak boşaltmadan bekleyen önizlemeleri iptal eder, ardından normal teslimi kullanır.

Slack:

- `partial`, mevcut olduğunda Slack yerel akışını (`chat.startStream`/`append`/`stop`) kullanabilir.
- `block`, ekleme tarzı taslak önizlemeleri kullanır.
- `progress`, durum önizleme metnini, ardından son yanıtı kullanır.
- Yanıt ileti dizisi olmayan üst düzey DM'ler, Slack yerel akışı yerine taslak önizleme gönderilerini ve düzenlemelerini kullanır.
- Yerel ve taslak önizleme akışı, o tur için blok yanıtlarını bastırır, böylece bir Slack yanıtı yalnızca tek bir teslim yolu tarafından akıtılır.
- Son medya/hata yükleri ve ilerleme sonları kullan-at taslak mesajları oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok sonları bekleyen taslak metni boşaltır.

Mattermost:

- Düşünmeyi, araç etkinliğini ve kısmi yanıt metnini, son yanıtın gönderilmesi güvenli olduğunda yerinde sonlandırılan tek bir taslak önizleme gönderisine akıtır.
- Önizleme gönderisi silinmişse veya sonlandırma sırasında başka şekilde kullanılamıyorsa yeni bir son gönderi göndermeye geri döner.
- Son medya/hata yükleri, geçici bir önizleme gönderisini boşaltmak yerine normal teslimden önce bekleyen önizleme güncellemelerini iptal eder.

Matrix:

- Taslak önizlemeler, son metin önizleme olayını yeniden kullanabildiğinde yerinde sonlandırılır.
- Yalnızca medya, hata ve yanıt-hedefi-uyuşmazlığı sonları, normal teslimden önce bekleyen önizleme güncellemelerini iptal eder; zaten görünür olan eski önizleme redact edilir.

### Araç ilerleme önizleme güncellemeleri

Önizleme akışı ayrıca araçlar çalışırken, son yanıttan önce aynı önizleme mesajında görünen "web'de arıyor", "dosya okuyor" veya "araç çağırıyor" gibi kısa durum satırları olan **araç ilerleme** güncellemelerini içerebilir. Codex app-server modunda, Codex giriş/yorum mesajları bu aynı önizleme yolunu kullanır, bu nedenle kısa "Kontrol ediyorum..." ilerleme notları son yanıtın parçası olmadan düzenlenebilir taslağa akabilir. Bu, çok adımlı araç turlarını ilk düşünme önizlemesi ile son yanıt arasında sessiz kalmak yerine görsel olarak canlı tutar.

Uzun süren araçlar dönmeden önce türlendirilmiş ilerleme yayabilir. Örneğin, `web_fetch` başladığında beş saniyelik bir zamanlayıcı kurar: getirme hâlâ beklemedeyse önizleme `Fetching page content...` gösterebilir; getirme bundan önce biter veya iptal edilirse ilerleme satırı yayılmaz. Daha sonraki son araç sonucu yine modele normal şekilde teslim edilir.

Desteklenen yüzeyler:

- Önizleme akışı etkinken **Discord**, **Slack**, **Telegram** ve **Matrix** varsayılan olarak araç ilerlemesini ve Codex giriş güncellemelerini canlı önizleme düzenlemesine aktarır. Microsoft Teams, kişisel sohbetlerde yerel ilerleme akışını kullanır.
- Telegram, `v2026.4.22` sürümünden beri araç ilerleme önizleme güncellemeleri etkin olarak yayımlandı; bunları etkin tutmak yayımlanmış davranışı korur.
- **Mattermost** araç etkinliğini zaten tek taslak önizleme gönderisine dahil eder (yukarıya bakın).
- Araç ilerleme düzenlemeleri etkin önizleme akışı modunu izler; önizleme akışı `off` olduğunda veya blok akışı mesajı devraldığında atlanır. Telegram'da `streaming.mode: "off"` yalnızca son çıktı verir: genel ilerleme sohbeti de bağımsız durum mesajları olarak teslim edilmek yerine bastırılır; onay istemleri, medya yükleri ve hatalar ise normal şekilde yönlendirilir.
- Önizleme akışını koruyup araç ilerleme satırlarını gizlemek için ilgili kanal için `streaming.preview.toolProgress` değerini `false` olarak ayarlayın. Komut/çalıştırma metnini gizlerken araç ilerleme satırlarını görünür tutmak için `streaming.preview.commandText` değerini `"status"` veya `streaming.progress.commandText` değerini `"status"` olarak ayarlayın; varsayılan değer, yayımlanmış davranışı korumak için `"raw"` değeridir. Bu ilke, Discord, Matrix, Microsoft Teams, Mattermost, Slack taslak önizlemeleri ve Telegram dahil OpenClaw'ın kompakt ilerleme işleyicisini kullanan taslak/ilerleme kanalları tarafından paylaşılır. Önizleme düzenlemelerini tamamen devre dışı bırakmak için `streaming.mode` değerini `off` olarak ayarlayın.
- Telegram seçili alıntı yanıtları bir istisnadır: `replyToMode` `"off"` olmadığında ve seçili alıntı metni mevcut olduğunda, OpenClaw bu tur için yanıt önizleme akışını atlar; böylece araç ilerleme önizleme satırları görüntülenemez. Seçili alıntı metni olmayan geçerli mesaj yanıtları önizleme akışını korur. Ayrıntılar için [Telegram kanal dokümanlarına](/tr/channels/telegram) bakın.

### Commentary ilerleme hattı

Araç ilerlemenin ötesinde, kompakt ilerleme işleyicisi taslakta bir hat daha gösterebilir:

- **`streaming.progress.commentary`** — modelin araç öncesi **commentary** çıktısını (💬) — kısa "Kontrol edeceğim… sonra…" anlatımını — ilerleme taslağındaki araç satırlarıyla iç içe işle.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

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

Aynı yapıyı başka bir kompakt ilerleme kanal anahtarı altında kullanın; örneğin `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` veya Slack taslak önizlemeleri. İlerleme taslağı modu için aynı ilkeyi `streaming.progress` altına koyun:

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

- [Mesaj yaşam döngüsü refaktörü](/tr/concepts/message-lifecycle-refactor) - paylaşılan önizleme, düzenleme, akış ve sonlandırma tasarımını hedefler
- [İlerleme taslakları](/tr/concepts/progress-drafts) - uzun turlar sırasında güncellenen görünür devam eden iş mesajları
- [Mesajlar](/tr/concepts/messages) - mesaj yaşam döngüsü ve teslimat
- [Yeniden deneme](/tr/concepts/retry) - teslimat hatasında yeniden deneme davranışı
- [Kanallar](/tr/channels) - kanal başına akış desteği
