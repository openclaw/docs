---
read_when:
    - Ajan aracılığıyla video oluşturma
    - Video oluşturma sağlayıcılarını ve modellerini yapılandırma
    - video_generate aracı parametrelerini anlama
sidebarTitle: Video generation
summary: Metin, görsel veya video referanslarından 16 sağlayıcı arka ucu genelinde video_generate ile videolar oluşturun
title: Video oluşturma
x-i18n:
    generated_at: "2026-04-30T09:51:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91409057210af560d389513c2049d643c3e1602df51aa9825ceb01571626cdf
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw aracıları metin istemlerinden, referans görsellerden veya
mevcut videolardan video oluşturabilir. On altı sağlayıcı arka ucu
desteklenir; her birinin farklı model seçenekleri, giriş modları ve özellik
kümeleri vardır. Aracı, yapılandırmanıza ve kullanılabilir API anahtarlarınıza
göre doğru sağlayıcıyı otomatik olarak seçer.

<Note>
`video_generate` aracı yalnızca en az bir video oluşturma sağlayıcısı
kullanılabilir olduğunda görünür. Aracı araçlarınızda görmüyorsanız bir
sağlayıcı API anahtarı ayarlayın veya `agents.defaults.videoGenerationModel`
yapılandırın.
</Note>

OpenClaw video oluşturmayı üç çalışma zamanı modu olarak ele alır:

- `generate` — referans medya içermeyen metinden videoya istekleri.
- `imageToVideo` — istek bir veya daha fazla referans görsel içerir.
- `videoToVideo` — istek bir veya daha fazla referans video içerir.

Sağlayıcılar bu modların herhangi bir alt kümesini destekleyebilir. Araç,
göndermeden önce etkin modu doğrular ve desteklenen modları `action=list`
içinde bildirir.

## Hızlı başlangıç

<Steps>
  <Step title="Configure auth">
    Desteklenen herhangi bir sağlayıcı için bir API anahtarı ayarlayın:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pick a default model (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ask the agent">
    > Gün batımında sörf yapan dost canlısı bir ıstakozun 5 saniyelik sinematik videosunu oluştur.

    Aracı `video_generate` çağrısını otomatik olarak yapar. Araç izin listesi
    gerekmez.

  </Step>
</Steps>

## Eşzamansız oluşturma nasıl çalışır?

Video oluşturma eşzamansızdır. Aracı bir oturumda `video_generate` çağırdığında:

1. OpenClaw isteği sağlayıcıya gönderir ve hemen bir görev kimliği döndürür.
2. Sağlayıcı işi arka planda işler (sağlayıcıya ve çözünürlüğe bağlı olarak genellikle 30 saniye ile 5 dakika arası).
3. Video hazır olduğunda OpenClaw aynı oturumu dahili bir tamamlama olayıyla uyandırır.
4. Aracı tamamlanan videoyu özgün konuşmaya geri gönderir.

Bir iş devam ederken aynı oturumdaki yinelenen `video_generate` çağrıları,
başka bir oluşturma başlatmak yerine geçerli görev durumunu döndürür. CLI'dan
ilerlemeyi kontrol etmek için `openclaw tasks list` veya
`openclaw tasks show <taskId>` kullanın.

Oturum destekli aracı çalıştırmaları dışında (örneğin doğrudan araç çağrıları),
araç satır içi oluşturmaya geri döner ve son medya yolunu aynı turda döndürür.

Sağlayıcı bayt döndürdüğünde oluşturulan video dosyaları OpenClaw tarafından
yönetilen medya depolamasına kaydedilir. Varsayılan oluşturulan-video kaydetme
sınırı, video medya sınırını izler ve `agents.defaults.mediaMaxMb` daha büyük
çıktılar için bunu yükseltir. Bir sağlayıcı aynı zamanda barındırılan bir çıktı
URL'si döndürürse, OpenClaw yerel kalıcılık aşırı büyük bir dosyayı reddettiğinde
görevi başarısız yapmak yerine bu URL'yi iletebilir.

### Görev yaşam döngüsü

| Durum       | Anlamı                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.                                             |
| `running`   | Sağlayıcı işliyor (sağlayıcıya ve çözünürlüğe bağlı olarak genellikle 30 saniye ile 5 dakika arası). |
| `succeeded` | Video hazır; aracı uyanır ve videoyu konuşmaya gönderir.                                   |
| `failed`    | Sağlayıcı hatası veya zaman aşımı; aracı hata ayrıntılarıyla uyanır.                                   |

Durumu CLI'dan kontrol edin:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Geçerli oturum için bir video görevi zaten `queued` veya `running` durumundaysa,
`video_generate` yeni bir görev başlatmak yerine mevcut görev durumunu döndürür.
Yeni bir oluşturmayı tetiklemeden açıkça kontrol etmek için `action: "status"`
kullanın.

## Desteklenen sağlayıcılar

| Sağlayıcı              | Varsayılan model                   | Metin | Görsel referansı                                            | Video referansı                                       | Kimlik doğrulama                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Evet (uzak URL)                                     | Evet (uzak URL)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | En fazla 2 görsel (yalnızca I2V modelleri; ilk + son kare) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | En fazla 2 görsel (rol üzerinden ilk + son kare)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | En fazla 9 referans görsel                             | En fazla 3 video                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 görsel                                              | —                                               | `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 görsel; Seedance referanstan videoya ile en fazla 9    | Seedance referanstan videoya ile en fazla 3 video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 görsel                                              | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 görsel                                              | —                                               | `MINIMAX_API_KEY` veya MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 görsel                                              | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | En fazla 4 görsel (ilk/son kare veya referanslar)      | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Evet (uzak URL)                                     | Evet (uzak URL)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 görsel                                              | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 görsel                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 görsel (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 ilk kare görseli veya en fazla 7 `reference_image`    | 1 video                                         | `XAI_API_KEY`                            |

Bazı sağlayıcılar ek veya alternatif API anahtarı ortam değişkenlerini kabul
eder. Ayrıntılar için ayrı [sağlayıcı sayfalarına](#related) bakın.

Çalışma zamanında kullanılabilir sağlayıcıları, modelleri ve çalışma zamanı
modlarını incelemek için `video_generate action=list` çalıştırın.

### Yetenek matrisi

`video_generate`, sözleşme testleri ve paylaşılan canlı tarama tarafından
kullanılan açık mod sözleşmesi:

| Sağlayıcı   | `generate` | `imageToVideo` | `videoToVideo` | Bugünkü paylaşılan canlı hatlar                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bu sağlayıcı uzak `http(s)` video URL'leri gerektirdiği için `videoToVideo` atlandı                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Paylaşılan taramada değil; iş akışına özgü kapsam Comfy testlerinde bulunur                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; yerel DeepInfra video şemaları paketli sözleşmede metinden videoyadır                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` yalnızca Seedance referanstan videoya kullanılırken                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; geçerli arabellek destekli Gemini/Veo taraması bu girdiyi kabul etmediği için paylaşılan `videoToVideo` atlandı  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bu kuruluş/girdi yolu şu anda sağlayıcı tarafı inpaint/remix erişimi gerektirdiği için paylaşılan `videoToVideo` atlandı |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bu sağlayıcı uzak `http(s)` video URL'leri gerektirdiği için `videoToVideo` atlandı                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` yalnızca seçilen model `runway/gen4_aleph` olduğunda çalışır                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; paketli `veo3` yalnızca metin olduğu ve paketli `kling` uzak bir görsel URL'si gerektirdiği için paylaşılan `imageToVideo` atlandı            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; bu sağlayıcı şu anda uzak bir MP4 URL'si gerektirdiği için `videoToVideo` atlandı                                |

## Araç parametreleri

### Gerekli

<ParamField path="prompt" type="string" required>
  Oluşturulacak videonun metin açıklaması. `action: "generate"` için gereklidir.
</ParamField>

### İçerik girdileri

<ParamField path="image" type="string">Tek referans görseli (yol veya URL).</ParamField>
<ParamField path="images" type="string[]">Birden fazla referans görseli (en fazla 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Birleşik görsel listesine paralel, isteğe bağlı konum başına rol ipuçları.
Kanonik değerler: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Tek referans videosu (yol veya URL).</ParamField>
<ParamField path="videos" type="string[]">Birden fazla referans videosu (en fazla 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Birleşik video listesine paralel, isteğe bağlı konum başına rol ipuçları.
Kanonik değer: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Tek referans sesi (yol veya URL). Sağlayıcı ses girişlerini desteklediğinde
arka plan müziği veya ses referansı için kullanılır.
</ParamField>
<ParamField path="audioRefs" type="string[]">Birden fazla referans sesi (en fazla 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Birleşik ses listesine paralel, isteğe bağlı konum başına rol ipuçları.
Kanonik değer: `reference_audio`.
</ParamField>

<Note>
Rol ipuçları sağlayıcıya olduğu gibi iletilir. Kanonik değerler
`VideoGenerationAssetRole` union'ından gelir, ancak sağlayıcılar ek
rol dizelerini kabul edebilir. `*Roles` dizileri, karşılık gelen
referans listesinden daha fazla girdi içermemelidir; bir elemanlık kayma
hataları açık bir hatayla başarısız olur. Bir yuvayı ayarlanmamış bırakmak
için boş dize kullanın. xAI için, `reference_images` oluşturma modunu
kullanmak üzere her görsel rolünü `reference_image` olarak ayarlayın;
tek görselli görselden videoya için rolü atlayın veya `first_frame` kullanın.
</Note>

### Stil denetimleri

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` veya `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` veya `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Saniye cinsinden hedef süre (sağlayıcının desteklediği en yakın değere yuvarlanır).
</ParamField>
<ParamField path="size" type="string">Sağlayıcı desteklediğinde boyut ipucu.</ParamField>
<ParamField path="audio" type="boolean">
  Desteklendiğinde çıktıda oluşturulmuş sesi etkinleştirir. `audioRef*` değerlerinden (girdilerden) ayrıdır.
</ParamField>
<ParamField path="watermark" type="boolean">Desteklendiğinde sağlayıcı filigranını açar veya kapatır.</ParamField>

`adaptive`, sağlayıcıya özgü bir sentinel'dir: yeteneklerinde `adaptive`
bildiren sağlayıcılara olduğu gibi iletilir (ör. BytePlus Seedance, giriş
görseli boyutlarından oranı otomatik algılamak için bunu kullanır).
Bunu bildirmeyen sağlayıcılar, bırakmanın görünür olması için araç
sonucunda değeri `details.ignoredOverrides` üzerinden gösterir.

### Gelişmiş

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` geçerli oturum görevini döndürür; `"list"` sağlayıcıları inceler.
</ParamField>
<ParamField path="model" type="string">Sağlayıcı/model geçersiz kılması (ör. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>
<ParamField path="timeoutMs" type="number">Milisaniye cinsinden isteğe bağlı sağlayıcı istek zaman aşımı.</ParamField>
<ParamField path="providerOptions" type="object">
  JSON nesnesi olarak sağlayıcıya özgü seçenekler (ör. `{"seed": 42, "draft": true}`).
  Tipli şema bildiren sağlayıcılar anahtarları ve türleri doğrular; bilinmeyen
  anahtarlar veya uyumsuzluklar geri dönüş sırasında adayı atlar. Bildirilmiş
  şeması olmayan sağlayıcılar seçenekleri olduğu gibi alır. Her sağlayıcının
  ne kabul ettiğini görmek için `video_generate action=list` çalıştırın.
</ParamField>

<Note>
Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw süreyi
sağlayıcının desteklediği en yakın değere normalleştirir ve bir yedek
sağlayıcı farklı bir denetim yüzeyi sunduğunda boyuttan en boy oranına
gibi çevrilmiş geometri ipuçlarını yeniden eşler. Gerçekten desteklenmeyen
geçersiz kılmalar en iyi çaba esasına göre yok sayılır ve araç sonucunda
uyarı olarak raporlanır. Kesin yetenek sınırları (çok fazla referans girdisi
gibi) gönderimden önce başarısız olur. Araç sonuçları uygulanan ayarları
raporlar; `details.normalization` istenenden uygulanana yapılan tüm
çevirileri yakalar.
</Note>

Referans girdileri çalışma zamanı modunu seçer:

- Referans medyası yok → `generate`
- Herhangi bir görsel referansı → `imageToVideo`
- Herhangi bir video referansı → `videoToVideo`
- Referans ses girdileri çözümlenen modu **değiştirmez**; görsel/video
  referanslarının seçtiği modun üzerine uygulanır ve yalnızca
  `maxInputAudios` bildiren sağlayıcılarla çalışır.

Karışık görsel ve video referansları kararlı bir ortak yetenek yüzeyi değildir.
İstek başına tek bir referans türü tercih edin.

#### Geri dönüş ve tipli seçenekler

Bazı yetenek denetimleri araç sınırı yerine geri dönüş katmanında uygulanır;
bu nedenle birincil sağlayıcının sınırlarını aşan bir istek yine de yetenekli
bir yedekte çalışabilir:

- `maxInputAudios` bildirmeyen (veya `0` bildiren) etkin aday, istek ses
  referansları içerdiğinde atlanır; sonraki aday denenir.
- Etkin adayın `maxDurationSeconds` değeri istenen `durationSeconds`
  değerinin altındaysa ve bildirilmiş `supportedDurationSeconds` listesi yoksa → atlanır.
- İstek `providerOptions` içeriyorsa ve etkin aday açıkça tipli bir
  `providerOptions` şeması bildiriyorsa → sağlanan anahtarlar şemada yoksa
  veya değer türleri eşleşmiyorsa atlanır. Bildirilmiş şeması olmayan
  sağlayıcılar seçenekleri olduğu gibi alır (geriye dönük uyumlu
  geçiş). Bir sağlayıcı boş bir şema (`capabilities.providerOptions: {}`)
  bildirerek tüm sağlayıcı seçeneklerinden çıkabilir; bu, tür uyumsuzluğuyla
  aynı atlamaya neden olur.

Bir istekteki ilk atlama nedeni `warn` düzeyinde günlüğe yazılır, böylece
operatörler birincil sağlayıcılarının ne zaman geçildiğini görür; sonraki
atlamalar uzun geri dönüş zincirlerini sessiz tutmak için `debug` düzeyinde
yazılır. Her aday atlanırsa, birleştirilmiş hata her biri için atlama nedenini içerir.

## Eylemler

| Eylem      | Ne yapar                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| `generate` | Varsayılan. Verilen istemden ve isteğe bağlı referans girdilerinden video oluşturur.                    |
| `status`   | Başka bir oluşturma başlatmadan geçerli oturum için devam eden video görevinin durumunu denetler.      |
| `list`     | Kullanılabilir sağlayıcıları, modelleri ve yeteneklerini gösterir.                                      |

## Model seçimi

OpenClaw modeli şu sırayla çözer:

1. **`model` araç parametresi** — agent çağrıda bir tane belirtirse.
2. Yapılandırmadan **`videoGenerationModel.primary`**.
3. Sırayla **`videoGenerationModel.fallbacks`**.
4. **Otomatik algılama** — geçerli varsayılan sağlayıcıdan başlayarak, ardından
   alfabetik sırayla kalan sağlayıcılar olmak üzere geçerli kimlik doğrulaması
   olan sağlayıcılar.

Bir sağlayıcı başarısız olursa, sonraki aday otomatik olarak denenir. Tüm
adaylar başarısız olursa, hata her denemeden ayrıntılar içerir.

Yalnızca açık `model`, `primary` ve `fallbacks` girdilerini kullanmak için
`agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Sağlayıcı notları

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio zaman uyumsuz uç noktasını kullanır. Referans
    görselleri ve videoları uzak `http(s)` URL'leri olmalıdır.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Sağlayıcı kimliği: `byteplus`.

    Modeller: `seedance-1-0-pro-250528` (varsayılan),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V modelleri (`*-t2v-*`) görsel girdilerini kabul etmez; I2V modelleri ve
    genel `*-pro-*` modelleri tek bir referans görselini (ilk kare)
    destekler. Görseli konumsal olarak iletin veya `role: "first_frame"` ayarlayın.
    Bir görsel sağlandığında T2V model kimlikleri otomatik olarak karşılık gelen
    I2V varyantına geçirilir.

    Desteklenen `providerOptions` anahtarları: `seed` (sayı), `draft` (boolean —
    480p'yi zorlar), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin'ini gerektirir. Sağlayıcı kimliği: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Birleşik `content[]` API'sini kullanır. En fazla 2 giriş görselini
    destekler (`first_frame` + `last_frame`). Tüm girdiler uzak `https://`
    URL'leri olmalıdır. Her görselde `role: "first_frame"` / `"last_frame"` ayarlayın
    veya görselleri konumsal olarak iletin.

    `aspectRatio: "adaptive"` oranı giriş görselinden otomatik algılar.
    `audio: true`, `generate_audio` ile eşleşir. `providerOptions.seed`
    (sayı) iletilir.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin'ini gerektirir. Sağlayıcı kimliği: `byteplus-seedance2`. Modeller:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Birleşik `content[]` API'sini kullanır. En fazla 9 referans görseli,
    3 referans videosu ve 3 referans sesi destekler. Tüm girdiler uzak
    `https://` URL'leri olmalıdır. Her varlıkta `role` ayarlayın — desteklenen değerler:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` oranı giriş görselinden otomatik algılar.
    `audio: true`, `generate_audio` ile eşleşir. `providerOptions.seed`
    (sayı) iletilir.

  </Accordion>
  <Accordion title="ComfyUI">
    İş akışı odaklı yerel veya bulut yürütmesi. Yapılandırılmış grafik üzerinden
    metinden videoya ve görselden videoya destekler.
  </Accordion>
  <Accordion title="fal">
    Uzun süren işler için kuyruk destekli bir akış kullanır. Çoğu fal video modeli
    tek bir görsel referansını kabul eder. Seedance 2.0 referanstan videoya
    modelleri, toplamda en fazla 12 referans dosyası olacak şekilde en fazla
    9 görsel, 3 video ve 3 ses referansı kabul eder.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Bir görsel veya bir video referansını destekler.
  </Accordion>
  <Accordion title="MiniMax">
    Yalnızca tek görsel referansı.
  </Accordion>
  <Accordion title="OpenAI">
    Yalnızca `size` geçersiz kılması iletilir. Diğer stil geçersiz kılmaları
    (`aspectRatio`, `resolution`, `audio`, `watermark`) bir uyarıyla yok sayılır.
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter'ın zaman uyumsuz `/videos` API'sini kullanır. OpenClaw işi
    gönderir, `polling_url` değerini yoklar ve `unsigned_urls` ya da
    belgelenmiş iş içeriği uç noktasını indirir. Paketle gelen `google/veo-3.1-fast` varsayılanı
    4/6/8 saniye süreleri, `720P`/`1080P` çözünürlükleri ve
    `16:9`/`9:16` en boy oranlarını bildirir.
  </Accordion>
  <Accordion title="Qwen">
    Alibaba ile aynı DashScope arka ucunu kullanır. Referans girdileri uzak
    `http(s)` URL'leri olmalıdır; yerel dosyalar baştan reddedilir.
  </Accordion>
  <Accordion title="Runway">
    Veri URI'leri aracılığıyla yerel dosyaları destekler. Videodan videoya
    `runway/gen4_aleph` gerektirir. Yalnızca metin çalıştırmaları `16:9` ve `9:16`
    en boy oranlarını sunar.
  </Accordion>
  <Accordion title="Together">
    Yalnızca tek görsel referansı.
  </Accordion>
  <Accordion title="Vydra">
    Kimlik doğrulamasını düşüren yönlendirmelerden kaçınmak için doğrudan
    `https://www.vydra.ai/api/v1` kullanır. `veo3` yalnızca metinden videoya olarak paketlenir;
    `kling` uzak bir görsel URL'si gerektirir.
  </Accordion>
  <Accordion title="xAI">
    Metinden videoya, tek ilk kare görselden videoya, xAI `reference_images`
    üzerinden en fazla 7 `reference_image` girdisini ve uzak video düzenleme/uzatma
    akışlarını destekler.
  </Accordion>
</AccordionGroup>

## Sağlayıcı yetenek modları

Paylaşılan video oluşturma sözleşmesi, yalnızca düz toplu sınırlar yerine
moda özgü yetenekleri destekler. Yeni sağlayıcı uygulamaları
açık mod bloklarını tercih etmelidir:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

`maxInputImages` ve `maxInputVideos` gibi düz toplu alanlar,
dönüştürme modu desteğini duyurmak için **yeterli değildir**. Sağlayıcılar,
canlı testlerin, sözleşme testlerinin ve paylaşılan `video_generate` aracının
mod desteğini belirleyici biçimde doğrulayabilmesi için `generate`,
`imageToVideo` ve `videoToVideo` alanlarını açıkça bildirmelidir.

Bir sağlayıcıdaki bir model, diğerlerinden daha geniş referans girdi desteğine
sahipse mod geneli sınırı yükseltmek yerine `maxInputImagesByModel`,
`maxInputVideosByModel` veya `maxInputAudiosByModel` kullanın.

## Canlı testler

Paylaşılan pakete dahil sağlayıcılar için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo sarmalayıcısı:

```bash
pnpm test:live:media video
```

Bu canlı dosya, eksik sağlayıcı ortam değişkenlerini `~/.profile` üzerinden yükler,
varsayılan olarak depolanmış kimlik doğrulama profillerinden önce canlı/ortam API
anahtarlarını tercih eder ve varsayılan olarak yayın açısından güvenli bir smoke
testi çalıştırır:

- Taramadaki FAL olmayan her sağlayıcı için `generate`.
- Bir saniyelik ıstakoz istemi.
- Sağlayıcı başına işlem sınırı
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden gelir (varsayılan `180000`).

FAL isteğe bağlıdır çünkü sağlayıcı tarafındaki kuyruk gecikmesi yayın süresine
baskın gelebilir:

```bash
pnpm test:live:media video --video-providers fal
```

Paylaşılan taramanın yerel medya ile güvenli biçimde çalıştırabileceği bildirilmiş
dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`
ayarlayın:

- `capabilities.imageToVideo.enabled` olduğunda `imageToVideo`.
- `capabilities.videoToVideo.enabled` olduğunda ve sağlayıcı/model paylaşılan
  taramada arabellek destekli yerel video girdisini kabul ettiğinde `videoToVideo`.

Bugün paylaşılan `videoToVideo` canlı hattı, yalnızca `runway/gen4_aleph`
seçtiğinizde `runway` kapsamına alır.

## Yapılandırma

OpenClaw yapılandırmanızda varsayılan video oluşturma modelini ayarlayın:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Veya CLI aracılığıyla:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## İlgili

- [Alibaba Model Studio](/tr/providers/alibaba)
- [Arka plan görevleri](/tr/automation/tasks) — zaman uyumsuz video oluşturma için görev takibi
- [BytePlus](/tr/concepts/model-providers#byteplus-international)
- [ComfyUI](/tr/providers/comfy)
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults)
- [fal](/tr/providers/fal)
- [Google (Gemini)](/tr/providers/google)
- [MiniMax](/tr/providers/minimax)
- [Modeller](/tr/concepts/models)
- [OpenAI](/tr/providers/openai)
- [Qwen](/tr/providers/qwen)
- [Runway](/tr/providers/runway)
- [Together AI](/tr/providers/together)
- [Araçlara genel bakış](/tr/tools)
- [Vydra](/tr/providers/vydra)
- [xAI](/tr/providers/xai)
