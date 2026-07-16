---
read_when:
    - Kanallarda akışın veya parçalara ayırmanın nasıl çalıştığını açıklama
    - Blok akışı veya kanal parçalama davranışını değiştirme
    - Yinelenen/erken blok yanıtlarında veya kanal önizleme akışında hata ayıklama
summary: Akış + parçalama davranışı (blok yanıtları, kanal önizleme akışı, mod eşleme)
title: Akış ve parçalara ayırma
x-i18n:
    generated_at: "2026-07-16T17:07:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw'ın iki bağımsız akış katmanı vardır ve bugün kanal mesajlarına yönelik **gerçek bir
token-farkı akışı yoktur**:

- **Blok akışı (kanallar):** asistan yazarken tamamlanan **blokları**
  gönderir. Bunlar token farkları değil, normal kanal mesajlarıdır.
- **Önizleme akışı (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  oluşturma sırasında geçici bir **önizleme mesajını** günceller (gönderme + düzenlemeler/eklemeler).

## Blok akışı (kanal mesajları)

Blok akışı, asistan çıktısını kullanılabilir hâle geldikçe büyük parçalar hâlinde gönderir.

```text
Model çıktısı
  └─ text_delta/olaylar
       ├─ (blockStreamingBreak=text_end)
       │    └─ parçalayıcı, arabellek büyüdükçe bloklar gönderir
       └─ (blockStreamingBreak=message_end)
            └─ parçalayıcı, message_end noktasında arabelleği boşaltır
                   └─ kanala gönderme (blok yanıtları)
```

- `text_delta/events`: model akışı olayları (akışsız modellerde seyrek olabilir).
- `chunker`: min/maks sınırlarını + kesme tercihini uygulayan `EmbeddedBlockChunker`.
- `channel send`: gerçek giden mesajlar (blok yanıtları).

**Denetimler** (belirtilmedikçe tümü `agents.defaults` altında):

| Anahtar                                                      | Değerler / biçim                                                         | Varsayılan |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (göndermeden önce akışla iletilen blokları birleştirir) | -          |
| `*.streaming.block.enabled` (kanal geçersiz kılması)               | `true` / `false`, blok akışını kanal (ve hesap) başına zorunlu kılar | -          |
| `*.textChunkLimit` (örn. `channels.whatsapp.textChunkLimit`) | sayı, kesin üst sınır                                                    | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | kullanıcı arayüzünde kırpılmayı önlemek için uzun yanıtları bölen sayı türünde esnek satır sınırı | 17         |

`streaming.chunkMode: "newline"`, metin sınırı aştığında uzunluğa göre
parçalamaya başvurmadan önce her yeni satırda değil, boş satırlarda (paragraf
sınırlarında) böler.

Paketle gelen kanallar bu geçersiz kılmaları
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}` biçiminde yazar. Düz
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` yazımları,
paketle gelen tüm kanallarda eskidir: `openclaw doctor --fix` bunları iç içe
biçime taşır ve kanal şemaları bunları reddeder. Düz yazımları hâlâ kullanan
harici SDK Plugin yapılandırmaları, bir sonraki sürüm dizisine kadar kullanımdan
kaldırılmış bir geri dönüş üzerinden (çalışma zamanı uyarısıyla) çalışmayı sürdürür.

`blockStreamingBreak` için **sınır semantiği**:

- `text_end`: parçalayıcı gönderir göndermez blokları akışla iletir; her `text_end` noktasında arabelleği boşaltır.
- `message_end`: asistan mesajı bitene kadar bekler, ardından arabelleğe alınmış
  çıktıyı boşaltır. Arabelleğe alınmış metin `maxChars` değerini aşarsa yine
  parçalayıcıyı kullanır; dolayısıyla sonunda birden fazla parça gönderebilir.

### Blok akışıyla medya teslimi

Akışla medya tesliminde `mediaUrl` veya `mediaUrls` gibi
yapılandırılmış yük alanları kullanılmalıdır; akışla iletilen metin, ek komutu olarak
ayrıştırılmaz. Blok akışı medyayı erken gönderdiğinde OpenClaw, bu teslimi ilgili
etkileşim için hatırlar. Son asistan yükü aynı medya URL'sini yinelerse son teslim,
eki yeniden göndermek yerine yinelenen medyayı çıkarır.

Tam olarak yinelenen son yükler engellenir. Son yük, daha önce akışla iletilmiş
medyanın çevresine farklı bir metin eklerse OpenClaw, medyayı yalnızca bir kez
teslim ederken yeni metni yine gönderir. Bu, Telegram gibi kanallarda yinelenen
sesli notları veya dosyaları önler.

## Parçalama algoritması (alt/üst sınırlar)

Blok parçalama, `EmbeddedBlockChunker` tarafından uygulanır:

- **Alt sınır:** arabellek >= `minChars` olana kadar gönderme (zorlanmadıkça).
- **Üst sınır:** `maxChars` öncesinde bölmeyi tercih et; zorlanırsa `maxChars` noktasında böl.
- **Kesme tercihi zinciri:** `paragraph` -> `newline` -> `sentence` ->
  boşluk -> kesin kesme.
- **Kod çitleri:** hiçbir zaman çitlerin içinde bölme; `maxChars` noktasında
  zorlandığında Markdown'ı geçerli tutmak için çiti kapatıp yeniden aç.

`maxChars`, kanalın `textChunkLimit` değerine sıkıştırılır; bu nedenle
kanal başına sınırlar aşılamaz.

## Birleştirme (akışla iletilen blokları birleştirme)

Blok akışı etkinleştirildiğinde OpenClaw, göndermeden önce **ardışık blok
parçalarını birleştirerek** aşamalı çıktı sağlamaya devam ederken tek satırlık
mesaj yağmurunu azaltabilir.

- Birleştirme, arabelleği boşaltmadan önce **boşta kalma aralıklarını** (`idleMs`) bekler.
- Arabellekler `maxChars` ile sınırlandırılır ve bunu aşarlarsa boşaltılır.
- `minChars`, yeterli metin birikene kadar küçük parçaların gönderilmesini
  önler (son boşaltma her zaman kalan metni gönderir).
- Birleştirici `blockStreamingChunk.breakPreference` değerinden türetilir: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> boşluk.
- Kanal geçersiz kılmaları `*.streaming.block.coalesce` üzerinden kullanılabilir
  (hesap başına yapılandırmalar dâhil).
- Aksi belirtilmedikçe Discord, Signal ve Slack için varsayılan birleştirme
  değeri `{ minChars: 1500, idleMs: 1000 }` olur.

## Bloklar arasında insan benzeri tempo

Blok akışı etkinleştirildiğinde, çok baloncuklu yanıtların daha doğal hissettirmesi
için ilk bloktan sonra blok yanıtları arasına **rastgele bir duraklama** eklenir.

| `agents.defaults.humanDelay.mode` | Davranış                |
| --------------------------------- | ----------------------- |
| `off` (varsayılan)                   | Duraklama yok           |
| `natural`                         | 800-2500ms rastgele duraklama |
| `custom`                          | `minMs`/`maxMs`         |

Her ajan için `agents.list[].humanDelay` üzerinden geçersiz kılınabilir. Yalnızca **blok
yanıtlarına** uygulanır; son yanıtlara veya araç özetlerine uygulanmaz.

## "Parçaları veya her şeyi akışla iletme"

- **Parçaları akışla iletme:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (ilerledikçe gönderir). Telegram dışındaki kanallarda ayrıca
  `*.streaming.block.enabled: true` gerekir.
- **Her şeyi sonunda akışla iletme:** `blockStreamingBreak: "message_end"` (bir
  kez boşaltır; çok uzunsa birden fazla parça olabilir).
- **Blok akışı yok:** `blockStreamingDefault: "off"` (yalnızca son yanıt).

`*.streaming.block.enabled` açıkça `true` olarak ayarlanmadığı sürece
blok akışı **kapalıdır** (istisna: QQ Bot'ta `streaming.block` anahtarları yoktur
ve `channels.qqbot.streaming.mode` değeri `"off"` olmadığı sürece blok yanıtlarını
akışla iletir). Kanallar, blok yanıtları olmadan canlı önizlemeyi
(`channels.<channel>.streaming.mode`) akışla iletebilir. `blockStreaming*` varsayılanları
yapılandırma kökünde değil, `agents.defaults` altında bulunur.

## Önizleme akışı modları

Standart anahtar: `channels.<channel>.streaming` (iç içe `{ mode, ... }`; eski
üst düzey boolean/dize yazımları `openclaw doctor --fix` tarafından yeniden yazılır).

| Mod        | Davranış                                                              |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Önizleme akışını devre dışı bırakır                                   |
| `partial`  | Tek önizlemeyi en güncel metinle değiştirir                            |
| `block`    | Önizlemeyi parçalı/eklemeli adımlarla günceller                        |
| `progress` | Oluşturma sırasında ilerleme/durum önizlemesi, tamamlandığında son yanıt |

`streaming.mode: "block"`, Discord ve Telegram gibi düzenleme özelliğine sahip
kanallar için bir önizleme akışı modudur; tek başına bu kanallarda blok teslimini
etkinleştirmez. Normal blok yanıtları için `streaming.block.enabled` kullanın.
Microsoft Teams istisnadır: taslak önizleme blok aktarımı olmadığından
`streaming.mode:
"block"`, yerel akışı tamamen devre dışı bırakır ve yanıt, yerel
kısmi/ilerleme akışı yerine normal blok teslimi olarak ulaşır. Mattermost da
farklıdır: `block` modunda önizlemeyi tamamlanmış metin ve araç etkinliği
blokları arasında döndürür; böylece önceki bloklar, düzenlenebilir tek bir taslakta
üzerlerine yazılmak yerine ayrı gönderiler olarak görünür kalır.

### Kanal eşlemesi

| Kanal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Evet  | Evet      | Evet    | düzenlenebilir ilerleme taslağı |
| Discord    | Evet  | Evet      | Evet    | düzenlenebilir ilerleme taslağı |
| Slack      | Evet  | Evet      | Evet    | Evet                    |
| Mattermost | Evet  | Evet      | Evet    | Evet                    |
| MS Teams   | Evet  | Evet      | Evet    | yerel ilerleme akışı    |

Önizleme parça yapılandırmasının (`streaming.preview.chunk.*`; örneğin
`channels.discord.streaming` veya `channels.telegram.streaming` altında) varsayılanları
`minChars: 200`, `maxChars: 800` (kanalın `textChunkLimit` değerine sıkıştırılır) ve
`breakPreference: "paragraph"` şeklindedir.

Yalnızca Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` olduğunda
  (varsayılan: `true`) Slack yerel akış API'si çağrılarını
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) açıp kapatır.
- Slack yerel akışı ve Slack asistan ileti dizisi durumu, bir yanıt
  ileti dizisi hedefi gerektirir. Üst düzey doğrudan mesajlar bu ileti dizisi
  tarzı önizlemeyi göstermez ancak Slack taslak önizleme gönderilerini ve
  düzenlemelerini yine de kullanabilir.

### Eski anahtarların taşınması

| Kanal    | Eski anahtarlar                                             | Durum                                                                                                                                                |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, skaler/boolean `streaming`                    | `openclaw doctor --fix` tarafından `streaming.mode` biçimine yeniden yazılır; çalışma zamanında okunmaz                                              |
| Discord  | `streamMode`, boolean `streaming`                           | `openclaw doctor --fix` tarafından `streaming.mode` biçimine yeniden yazılır; çalışma zamanında okunmaz                                              |
| Slack    | `streamMode`; boolean `streaming`; eski `nativeStreaming` | `openclaw doctor --fix` tarafından `streaming.mode` biçimine (boolean/eski biçimler için ayrıca `streaming.nativeTransport`) yeniden yazılır; çalışma zamanında okunmaz |
| Matrix   | skaler/boolean `streaming`                                  | `openclaw doctor --fix` tarafından `streaming.mode` biçimine (Matrix'in `"quiet"` modu dâhil) yeniden yazılır; çalışma zamanında okunmaz       |
| Feishu   | boolean `streaming`                                         | `openclaw doctor --fix` tarafından `streaming.mode` biçimine yeniden yazılır; çalışma zamanında okunmaz                                              |
| QQ Bot   | boolean `streaming`; `streaming.c2cStreamApi`               | `openclaw doctor --fix` tarafından `streaming.mode` biçimine (boolean/`c2cStreamApi` biçimleri için ayrıca `streaming.nativeTransport`) yeniden yazılır; çalışma zamanında okunmaz |

## Çalışma zamanı davranışı

### Telegram

- DM'ler ve grup/konular genelinde `sendMessage` + `editMessageText` önizleme güncellemelerini kullanır;
  son metin, etkin önizlemeyi yerinde düzenler. Telegram'ın
  30 saniyelik geçici "yazıyor" taslakları (`sendMessageDraft`) yanıt
  akışı için kullanılmaz.
- Kısa ilk önizlemeler, anlık bildirim kullanıcı deneyimi için hâlâ geciktirilir ancak
  etkin çalıştırmaların görsel olarak sessiz kalmaması için sınırlı bir gecikmeden sonra
  görünür hâle gelir.
- Uzun nihai yanıtlar, ilk parça için önizleme mesajını yeniden kullanır ve yalnızca
  kalan parçaları gönderir.
- `block` modu, önizlemeyi `streaming.preview.chunk.maxChars` konumunda
  yeni bir mesaja dönüştürür (varsayılan 800, Telegram'ın 4096
  düzenleme sınırıyla kısıtlıdır); diğer modlar tek bir önizlemeyi 4096 karaktere kadar büyütür.
- `progress` modu, araç ilerlemesini düzenlenebilir bir durum taslağında tutar,
  yanıt akışı etkinken ancak henüz bir araç satırı yokken durum etiketini
  görünür hâle getirir, tamamlandığında taslağı temizler ve nihai yanıtı
  normal teslimat yoluyla gönderir.
- Tamamlanmış metin doğrulanmadan önce son düzenleme başarısız olursa OpenClaw,
  normal nihai teslimatı kullanır ve eski önizlemeyi temizler.
- Çift akışı önlemek için Telegram blok akışı açıkça
  etkinleştirildiğinde önizleme akışı atlanır.
- `/reasoning stream`, muhakemeyi nihai teslimattan sonra
  silinen geçici bir önizlemeye yazabilir.
- Telegram'da seçili alıntı yanıtları bir istisnadır: `replyToMode`,
  `"off"` değilse ve seçili alıntı metni varsa OpenClaw, o tur için yanıt önizleme
  akışını atlar (nihai yanıt yerel alıntı-yanıt
  yolundan geçmelidir); bu nedenle araç ilerleme önizleme satırları görüntülenemez. Seçili alıntı metni
  içermeyen geçerli mesaj yanıtlarında önizleme akışı sürdürülür. Ayrıntılar için
  [Telegram kanal belgelerine](/tr/channels/telegram) bakın.

### Discord

- Önizleme mesajlarını gönderme + düzenleme yöntemini kullanır.
- `block` modu, taslak parçalamayı (`draftChunk`) kullanır.
- Discord blok akışı açıkça etkinleştirildiğinde önizleme akışı
  atlanır.
- `progress` modu, nihai yanıta küçük bir `-#` etkinlik makbuzu (düşünce/araç çağrısı
  sayıları ve geçen süre) ekler ve bu yanıt teslim edildikten
  sonra durum taslağını siler; böylece yoğun kanallarda yanıtın üzerinde sahipsiz bir araç günlüğü
  kalmaz. Hata içeren nihai yanıtlarda taslak, başarısız
  turun kaydı olarak tutulur.
- Nihai medya, hata ve açık yanıt yükleri, yeni bir taslak göndermeden
  bekleyen önizlemeleri iptal eder ve ardından normal teslimatı kullanır.

### Slack

- `partial`, kullanılabildiğinde Slack'in yerel akışını (`chat.startStream`/`append`/`stop`)
  kullanabilir.
- `block`, ekleme tarzı taslak önizlemeleri kullanır.
- `progress`, durum önizleme metnini ve ardından nihai yanıtı kullanır.
- Yanıt dizisi bulunmayan üst düzey DM'ler, Slack'in yerel akışı yerine
  taslak önizleme gönderileri ve düzenlemeleri kullanır.
- Yerel ve taslak önizleme akışı, o turdaki blok yanıtlarını engeller; böylece bir
  Slack yanıtı yalnızca tek bir teslimat yoluyla aktarılır.
- Nihai medya/hata yükleri ve ilerleme nihai yanıtları, tek kullanımlık taslak
  mesajlar oluşturmaz; yalnızca önizlemeyi düzenleyebilen metin/blok nihai yanıtları bekleyen
  taslak metnini gönderir.

### Mattermost

- `partial` modunda, düşünme ve kısmi yanıt metnini tek bir taslak
  önizleme gönderisine aktarır ve nihai yanıtın gönderilmesi güvenli olduğunda bu gönderiyi yerinde sonlandırır.
- `progress` modunda, düşünme ve araç etkinliğini tek bir durum
  önizlemesine aktarır ve nihai yanıtın gönderilmesi güvenli olduğunda bunu yerinde sonlandırır.
- `block` modunda, tamamlanmış metin ve araç etkinliği gönderileri arasında geçiş yapar;
  paralel ve art arda gelen araç güncellemeleri, geçerli araç etkinliği gönderisini paylaşır.
- Önizleme gönderisi silinmişse veya sonlandırma sırasında
  başka bir nedenle kullanılamıyorsa yeni bir nihai gönderi göndermeye geri döner.
- Nihai medya/hata yükleri, geçici bir önizleme gönderisini göndermek yerine normal
  teslimattan önce bekleyen önizleme güncellemelerini iptal eder.

### Matrix

- Nihai metin önizleme olayını yeniden kullanabildiğinde taslak önizlemeler
  yerinde sonlandırılır.
- Yalnızca medya içeren, hatalı ve yanıt hedefi uyuşmayan nihai yanıtlar, normal teslimattan önce bekleyen önizleme
  güncellemelerini iptal eder; zaten görünür olan eski bir önizleme sansürlenir.

## Araç ilerleme önizleme güncellemeleri

Önizleme akışı ayrıca **araç ilerleme** güncellemelerini de içerebilir: araçlar
çalışırken aynı önizleme mesajında, nihai yanıttan önce görünen
"web'de aranıyor", "dosya okunuyor" veya "araç çağrılıyor" gibi kısa durum
satırları. Codex uygulama sunucusu modunda, Codex giriş/yorum mesajları aynı
önizleme yolunu kullanır; böylece kısa "Kontrol ediyorum..." ilerleme notları, nihai
yanıtın parçası olmadan düzenlenebilir taslağa aktarılabilir. Bu, çok adımlı
araç turlarının ilk düşünme önizlemesi ile nihai yanıt arasında sessiz kalmak yerine
görsel olarak etkin görünmesini sağlar.

Uzun süre çalışan araçlar, dönmeden önce türü belirlenmiş ilerleme bilgisi yayınlayabilir. Örneğin,
`web_fetch` başladığında beş saniyelik bir zamanlayıcı kurar: getirme işlemi hâlâ
beklemedeyse önizleme `Fetching page content...` gösterir; getirme işlemi bundan önce
tamamlanır veya iptal edilirse ilerleme satırı yayınlanmaz. Sonraki nihai araç
sonucu yine modele normal şekilde teslim edilir.

Desteklenen yüzeyler:

- **Discord**, **Slack**, **Telegram** ve **Matrix**, önizleme
  akışı etkinken araç ilerlemesini ve Codex giriş güncellemelerini varsayılan olarak canlı önizleme düzenlemesine
  aktarır. Microsoft Teams, kişisel sohbetlerde kendi yerel ilerleme akışını kullanır.
- Telegram, `v2026.4.22` sürümünden beri araç ilerleme önizleme güncellemeleri etkin olarak
  sunulmaktadır; bunları etkin tutmak, yayımlanmış bu davranışı korur.
- **Mattermost**, araç etkinliğini `partial` ve
  `progress` modlarında tek bir önizleme gönderisinde veya `block`
  modunda metin blokları arasındaki tek bir araç etkinliği gönderisinde birleştirir (yukarıya bakın).
- Araç ilerleme düzenlemeleri, etkin önizleme akışı modunu izler; önizleme akışı
  `off` olduğunda veya blok akışı mesajı devraldığında bunlar
  atlanır. Telegram'da `streaming.mode: "off"` yalnızca nihai yanıt içindir: genel
  ilerleme mesajları da bağımsız durum mesajları olarak teslim edilmek yerine
  engellenir; onay istemleri, medya yükleri ve hatalar ise normal şekilde
  yönlendirilmeye devam eder.
- Önizleme akışını koruyup araç ilerleme satırlarını gizlemek için ilgili kanalda
  `streaming.preview.toolProgress` değerini `false` olarak ayarlayın (varsayılan:
  `true`). Araç ilerleme satırlarını görünür tutarken komut/yürütme metnini gizlemek için
  `streaming.preview.commandText` değerini `"status"` veya
  `streaming.progress.commandText` değerini `"status"` olarak ayarlayın; yayımlanmış
  davranışı korumak için varsayılan değer `"raw"` şeklindedir. Bu politika, Discord, Matrix,
  Microsoft Teams, Mattermost, Slack taslak önizlemeleri ve Telegram dâhil olmak üzere
  OpenClaw'ın kompakt ilerleme oluşturucusunu kullanan taslak/ilerleme kanalları
  tarafından paylaşılır. Önizleme düzenlemelerini tamamen devre dışı bırakmak için
  `streaming.mode` değerini `off` olarak ayarlayın.

## İlerleme taslağı oluşturma

İlerleme modu taslakları (`streaming.progress.*`) sınırlıdır ve kanal
bazında yapılandırılabilir:

| Anahtar                           | Varsayılan    | Davranış                                                       |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Taslak etiketinin altında tutulan en fazla kompakt ilerleme satırı |
| `streaming.progress.maxLineChars` | `120`         | Kesilmeden önce kompakt satır başına en fazla karakter (sözcükleri dikkate alır) |
| `streaming.progress.label`        | `"auto"`      | Taslak başlığı; özel bir dize veya gizlemek için `false` |
| `streaming.progress.labels`       | yerleşik havuz | `label: "auto"` olduğunda kullanılan aday etiketler          |

### Yorum ilerleme hattı

Araç ilerlemesinin ötesinde, kompakt ilerleme oluşturucu taslakta bir hat daha
gösterebilir:

- **`streaming.progress.commentary`** - modelin araç öncesi
  **yorumunu** (kısa bir "Kontrol edeceğim... ardından..." anlatımı), ilerleme taslağında
  araç satırlarıyla iç içe görüntüler. İlerleme modundaki Discord ve Telegram'da,
  bu isteğe bağlı hat kapalı olsa bile aynı giriş durum başlığını sağlar;
  diğer kanallar mevcut ilerleme davranışlarını korur. Bkz.
  [İlerleme taslakları](/tr/concepts/progress-drafts#status-headline).

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

İlerleme satırlarını görünür tutarken ham komut/yürütme metnini gizleyin:

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

Aynı yapıyı başka bir kompakt ilerleme kanalı anahtarı altında kullanın; örneğin
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` veya Slack taslak önizlemeleri. İlerleme taslağı modu için
aynı politikayı `streaming.progress` altına yerleştirin:

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
- [Mesajlar](/tr/concepts/messages) - mesaj yaşam döngüsü ve teslimatı
- [Yeniden deneme](/tr/concepts/retry) - teslimat hatasında yeniden deneme davranışı
- [Kanallar](/tr/channels) - kanal bazında akış desteği
