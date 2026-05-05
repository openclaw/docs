---
read_when:
    - Aracı üzerinden video oluşturma
    - Video oluşturma sağlayıcılarını ve modellerini yapılandırma
    - video_generate aracının parametrelerini anlama
sidebarTitle: Video generation
summary: 16 sağlayıcı arka ucu genelinde metin, görüntü veya video referanslarından video_generate ile videolar oluşturun
title: Video oluşturma
x-i18n:
    generated_at: "2026-05-05T06:19:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a86a820cc9f27baf4b17954d7ded7c2b7ff9eb456e7e75c3b2e7a7653cd675fd
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw aracıları metin istemlerinden, referans görüntülerden veya
mevcut videolardan video oluşturabilir. Her biri farklı model seçeneklerine,
girdi modlarına ve özellik kümelerine sahip on altı sağlayıcı arka ucu
desteklenir. Aracı, yapılandırmanıza ve kullanılabilir API anahtarlarına
göre doğru sağlayıcıyı otomatik olarak seçer.

<Note>
`video_generate` aracı yalnızca en az bir video oluşturma sağlayıcısı
kullanılabilir olduğunda görünür. Aracı araçlarınızda görmüyorsanız, bir
sağlayıcı API anahtarı ayarlayın veya `agents.defaults.videoGenerationModel`
yapılandırın.
</Note>

OpenClaw video oluşturmayı üç çalışma zamanı modu olarak ele alır:

- `generate` — referans medya içermeyen metinden videoya istekleri.
- `imageToVideo` — istek bir veya daha fazla referans görüntü içerir.
- `videoToVideo` — istek bir veya daha fazla referans video içerir.

Sağlayıcılar bu modların herhangi bir alt kümesini destekleyebilir. Araç,
göndermeden önce etkin modu doğrular ve desteklenen modları `action=list`
içinde bildirir.

## Hızlı başlangıç

<Steps>
  <Step title="Kimlik doğrulamayı yapılandır">
    Desteklenen herhangi bir sağlayıcı için bir API anahtarı ayarlayın:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Varsayılan model seçin (isteğe bağlı)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Aracıya sorun">
    > Gün batımında sörf yapan dost canlısı bir ıstakozun 5 saniyelik sinematik videosunu oluştur.

    Aracı `video_generate` çağrısını otomatik olarak yapar. Araç izin listesine
    alma gerekmez.

  </Step>
</Steps>

## Eşzamansız oluşturma nasıl çalışır?

Video oluşturma eşzamansızdır. Aracı bir oturumda `video_generate`
çağırdığında:

1. OpenClaw isteği sağlayıcıya gönderir ve hemen bir görev kimliği döndürür.
2. Sağlayıcı işi arka planda işler (sağlayıcıya ve çözünürlüğe bağlı olarak genellikle 30 saniye ile birkaç dakika arası; yavaş kuyruk destekli sağlayıcılar yapılandırılan zaman aşımına kadar çalışabilir).
3. Video hazır olduğunda OpenClaw aynı oturumu dahili bir tamamlama olayıyla uyandırır.
4. Aracı kullanıcıya bildirir ve tamamlanan videoyu ekler. Yalnızca mesaj aracı
   görünür teslimatı kullanan grup/kanal sohbetlerinde, aracı sonucu OpenClaw'ın
   doğrudan göndermesi yerine mesaj aracı üzerinden iletir.

Bir iş devam ederken, aynı oturumdaki yinelenen `video_generate` çağrıları
başka bir oluşturma başlatmak yerine geçerli görev durumunu döndürür.
CLI'dan ilerlemeyi denetlemek için `openclaw tasks list` veya
`openclaw tasks show <taskId>` kullanın.

Oturum destekli aracı çalıştırmaları dışında (örneğin doğrudan araç
çağrıları), araç satır içi oluşturmaya geri döner ve son medya yolunu aynı
turda döndürür.

Sağlayıcı bayt döndürdüğünde, oluşturulan video dosyaları OpenClaw tarafından
yönetilen medya depolamasına kaydedilir. Varsayılan oluşturulan video kayıt
sınırı video medya sınırını izler ve `agents.defaults.mediaMaxMb` daha büyük
işlemeler için bunu yükseltir. Bir sağlayıcı ayrıca barındırılan bir çıktı URL'si
döndürürse, yerel kalıcılık aşırı büyük bir dosyayı reddettiğinde OpenClaw görevi
başarısız kılmak yerine bu URL'yi teslim edebilir.

### Görev yaşam döngüsü

| Durum       | Anlamı                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.                                               |
| `running`   | Sağlayıcı işliyor (sağlayıcıya ve çözünürlüğe bağlı olarak genellikle 30 saniye ile birkaç dakika).    |
| `succeeded` | Video hazır; aracı uyanır ve konuşmaya gönderir.                                                       |
| `failed`    | Sağlayıcı hatası veya zaman aşımı; aracı hata ayrıntılarıyla uyanır.                                   |

CLI'dan durumu denetleyin:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Geçerli oturum için bir video görevi zaten `queued` veya `running`
durumundaysa, `video_generate` yeni bir görev başlatmak yerine mevcut görev
durumunu döndürür. Yeni bir oluşturmayı tetiklemeden açıkça denetlemek için
`action: "status"` kullanın.

## Desteklenen sağlayıcılar

| Sağlayıcı             | Varsayılan model                 | Metin | Görüntü ref                                          | Video ref                                       | Kimlik doğrulama                         |
| --------------------- | ------------------------------- | :---: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |   ✓   | Evet (uzak URL)                                      | Evet (uzak URL)                                 | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |   ✓   | En fazla 2 görüntü (yalnızca I2V modelleri; ilk + son kare) | —                                      | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |   ✓   | En fazla 2 görüntü (rol üzerinden ilk + son kare)    | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |   ✓   | En fazla 9 referans görüntü                          | En fazla 3 video                                | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |   ✓   | 1 görüntü                                            | —                                               | `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |   ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |   ✓   | 1 görüntü; Seedance referanstan videoya ile en fazla 9 | Seedance referanstan videoya ile en fazla 3 video | `FAL_KEY`                              |
| Google                | `veo-3.1-fast-generate-preview` |   ✓   | 1 görüntü                                            | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |   ✓   | 1 görüntü                                            | —                                               | `MINIMAX_API_KEY` veya MiniMax OAuth     |
| OpenAI                | `sora-2`                        |   ✓   | 1 görüntü                                            | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |   ✓   | En fazla 4 görüntü (ilk/son kare veya referanslar)   | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |   ✓   | Evet (uzak URL)                                      | Evet (uzak URL)                                 | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |   ✓   | 1 görüntü                                            | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |   ✓   | 1 görüntü                                            | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |   ✓   | 1 görüntü (`kling`)                                  | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |   ✓   | 1 ilk kare görüntüsü veya en fazla 7 `reference_image` | 1 video                                      | `XAI_API_KEY`                            |

Bazı sağlayıcılar ek veya alternatif API anahtarı env değişkenlerini kabul eder.
Ayrıntılar için ayrı [sağlayıcı sayfalarına](#related) bakın.

Çalışma zamanında kullanılabilir sağlayıcıları, modelleri ve çalışma zamanı
modlarını incelemek için `video_generate action=list` çalıştırın.

### Yetenek matrisi

`video_generate`, sözleşme testleri ve paylaşılan canlı tarama tarafından
kullanılan açık mod sözleşmesi:

| Sağlayıcı | `generate` | `imageToVideo` | `videoToVideo` | Bugünkü paylaşılan canlı hatlar                                                                                                          |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL'leri gerektirir                           |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Paylaşılan taramada yoktur; iş akışına özel kapsam Comfy testlerinde bulunur                                                             |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; yerel DeepInfra video şemaları paketlenmiş sözleşmede metinden videoyadır                                                    |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` yalnızca Seedance referanstan videoya kullanıldığında                                         |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü geçerli tampon destekli Gemini/Veo taraması bu girdiyi kabul etmez   |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü bu kuruluş/girdi yolu şu anda sağlayıcı tarafı inpaint/remix erişimi gerektirir |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL'leri gerektirir                           |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` yalnızca seçilen model `runway/gen4_aleph` olduğunda çalışır                                  |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; paylaşılan `imageToVideo` atlanır çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak bir görüntü URL'si gerektirir |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı şu anda uzak bir MP4 URL'si gerektirir                             |

## Araç parametreleri

### Zorunlu

<ParamField path="prompt" type="string" required>
  Oluşturulacak videonun metin açıklaması. `action: "generate"` için zorunludur.
</ParamField>

### İçerik girdileri

<ParamField path="image" type="string">Tek referans görseli (yol veya URL).</ParamField>
<ParamField path="images" type="string[]">Birden fazla referans görseli (en fazla 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Birleşik görsel listesine paralel isteğe bağlı konum başına rol ipuçları.
Kanonik değerler: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Tek referans videosu (yol veya URL).</ParamField>
<ParamField path="videos" type="string[]">Birden fazla referans videosu (en fazla 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Birleşik video listesine paralel isteğe bağlı konum başına rol ipuçları.
Kanonik değer: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Tek referans sesi (yol veya URL). Sağlayıcı ses girdilerini desteklediğinde
arka plan müziği veya ses referansı için kullanılır.
</ParamField>
<ParamField path="audioRefs" type="string[]">Birden fazla referans sesi (en fazla 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Birleşik ses listesine paralel isteğe bağlı konum başına rol ipuçları.
Kanonik değer: `reference_audio`.
</ParamField>

<Note>
Rol ipuçları sağlayıcıya olduğu gibi iletilir. Kanonik değerler
`VideoGenerationAssetRole` union türünden gelir, ancak sağlayıcılar ek
rol dizelerini kabul edebilir. `*Roles` dizileri ilgili referans listesinden
daha fazla giriş içermemelidir; bir-birlik kayma hataları açık bir hatayla başarısız olur.
Bir yuvayı ayarsız bırakmak için boş dize kullanın. xAI için
`reference_images` üretim modunu kullanmak üzere her görsel rolünü
`reference_image` olarak ayarlayın; tek görselli görüntüden videoya için
rolü atlayın veya `first_frame` kullanın.
</Note>

### Stil kontrolleri

<ParamField path="aspectRatio" type="string">
  `1:1`, `16:9`, `9:16`, `adaptive` veya sağlayıcıya özgü bir değer gibi en-boy oranı ipucu. OpenClaw desteklenmeyen değerleri sağlayıcı başına normalleştirir veya yok sayar.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, `1080P`, `4K` veya sağlayıcıya özgü bir değer gibi çözünürlük ipucu. OpenClaw desteklenmeyen değerleri sağlayıcı başına normalleştirir veya yok sayar.</ParamField>
<ParamField path="durationSeconds" type="number">
  Saniye cinsinden hedef süre (sağlayıcının desteklediği en yakın değere yuvarlanır).
</ParamField>
<ParamField path="size" type="string">Sağlayıcı desteklediğinde boyut ipucu.</ParamField>
<ParamField path="audio" type="boolean">
  Desteklendiğinde çıktıda üretilmiş sesi etkinleştirin. `audioRef*` değerlerinden (girdiler) farklıdır.
</ParamField>
<ParamField path="watermark" type="boolean">Desteklendiğinde sağlayıcı filigranını açıp kapatın.</ParamField>

`adaptive` sağlayıcıya özgü bir sentineldir: yeteneklerinde `adaptive`
bildiren sağlayıcılara olduğu gibi iletilir (ör. BytePlus Seedance bunu
girdi görseli boyutlarından oranı otomatik algılamak için kullanır).
Bunu bildirmeyen sağlayıcılar, atlamanın görünür olması için değeri araç
sonucunda `details.ignoredOverrides` üzerinden gösterir.

### Gelişmiş

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` geçerli oturum görevini döndürür; `"list"` sağlayıcıları inceler.
</ParamField>
<ParamField path="model" type="string">Sağlayıcı/model geçersiz kılma (ör. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>
<ParamField path="timeoutMs" type="number">Milisaniye cinsinden isteğe bağlı sağlayıcı işlem zaman aşımı.</ParamField>
<ParamField path="providerOptions" type="object">
  JSON nesnesi olarak sağlayıcıya özgü seçenekler (ör. `{"seed": 42, "draft": true}`).
  Türlendirilmiş şema bildiren sağlayıcılar anahtarları ve türleri doğrular; bilinmeyen
  anahtarlar veya uyuşmazlıklar geri dönüş sırasında adayı atlar. Bildirilmiş şeması
  olmayan sağlayıcılar seçenekleri olduğu gibi alır. Her sağlayıcının ne kabul ettiğini
  görmek için `video_generate action=list` çalıştırın.
</ParamField>

<Note>
Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw süreyi
sağlayıcının desteklediği en yakın değere normalleştirir ve bir geri dönüş
sağlayıcısı farklı bir kontrol yüzeyi sunduğunda boyuttan en-boy oranına gibi
çevrilmiş geometri ipuçlarını yeniden eşler. Gerçekten desteklenmeyen geçersiz
kılmalar en iyi çaba temelinde yok sayılır ve araç sonucunda uyarı olarak raporlanır.
Çok fazla referans girdisi gibi katı yetenek sınırları gönderimden önce başarısız olur.
Araç sonuçları uygulanan ayarları raporlar; `details.normalization` istenenden
uygulanana yapılan çevirileri yakalar.
</Note>

Referans girdileri çalışma zamanı modunu seçer:

- Referans medyası yok → `generate`
- Herhangi bir görsel referansı → `imageToVideo`
- Herhangi bir video referansı → `videoToVideo`
- Referans ses girdileri çözümlenen modu **değiştirmez**; görsel/video
  referanslarının seçtiği modun üzerine uygulanır ve yalnızca `maxInputAudios`
  bildiren sağlayıcılarla çalışır.

Karışık görsel ve video referansları kararlı bir ortak yetenek yüzeyi değildir.
İstek başına tek bir referans türü tercih edin.

#### Geri dönüş ve türlendirilmiş seçenekler

Bazı yetenek denetimleri araç sınırı yerine geri dönüş katmanında uygulanır;
bu nedenle birincil sağlayıcının sınırlarını aşan bir istek yine de yetenekli
bir geri dönüşte çalışabilir:

- Ses referansları içeren istekte `maxInputAudios` bildirmeyen (veya `0` bildiren)
  etkin aday atlanır; sonraki aday denenir.
- Etkin adayın `maxDurationSeconds` değeri istenen `durationSeconds` değerinin
  altındaysa ve bildirilmiş `supportedDurationSeconds` listesi yoksa → atlanır.
- İstek `providerOptions` içeriyorsa ve etkin aday açıkça türlendirilmiş bir
  `providerOptions` şeması bildiriyorsa → sağlanan anahtarlar şemada değilse
  veya değer türleri eşleşmiyorsa atlanır. Bildirilmiş şeması olmayan sağlayıcılar
  seçenekleri olduğu gibi alır (geriye dönük uyumlu geçiş). Bir sağlayıcı boş
  şema (`capabilities.providerOptions: {}`) bildirerek tüm sağlayıcı seçeneklerinden
  çıkabilir; bu, tür uyuşmazlığıyla aynı atlamaya neden olur.

Bir istekteki ilk atlama nedeni `warn` düzeyinde günlüğe yazılır; böylece
operatörler birincil sağlayıcılarının ne zaman pas geçildiğini görür. Sonraki
atlamalar uzun geri dönüş zincirlerini sessiz tutmak için `debug` düzeyinde
günlüğe yazılır. Her aday atlanırsa, toplu hata her biri için atlama nedenini içerir.

## Eylemler

| Eylem      | Ne yapar                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| `generate` | Varsayılan. Verilen istemden ve isteğe bağlı referans girdilerinden bir video oluşturur.                  |
| `status`   | Başka bir üretim başlatmadan geçerli oturum için devam eden video görevinin durumunu denetler.           |
| `list`     | Kullanılabilir sağlayıcıları, modelleri ve yeteneklerini gösterir.                                        |

## Model seçimi

OpenClaw modeli şu sırayla çözümler:

1. **`model` araç parametresi** — aracı çağırırken aracı bunu belirtirse.
2. Yapılandırmadan **`videoGenerationModel.primary`**.
3. Sırayla **`videoGenerationModel.fallbacks`**.
4. **Otomatik algılama** — geçerli varsayılan sağlayıcıdan başlayıp ardından
   alfabetik sırayla kalan sağlayıcılarla devam ederek geçerli kimlik doğrulaması
   olan sağlayıcılar.

Bir sağlayıcı başarısız olursa, sonraki aday otomatik olarak denenir. Tüm
adaylar başarısız olursa hata her denemeden ayrıntılar içerir.

Yalnızca açık `model`, `primary` ve `fallbacks` girişlerini kullanmak için
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
    DashScope / Model Studio async endpoint kullanır. Referans görselleri ve
    videoları uzak `http(s)` URL'leri olmalıdır.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Sağlayıcı kimliği: `byteplus`.

    Modeller: `seedance-1-0-pro-250528` (varsayılan),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V modelleri (`*-t2v-*`) görsel girdileri kabul etmez; I2V modelleri ve
    genel `*-pro-*` modeller tek bir referans görselini destekler (ilk kare).
    Görseli konumsal olarak geçirin veya `role: "first_frame"` ayarlayın.
    Bir görsel sağlandığında T2V model kimlikleri otomatik olarak ilgili I2V
    varyantına geçirilir.

    Desteklenen `providerOptions` anahtarları: `seed` (sayı), `draft` (boolean —
    480p'yi zorlar), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin gerektirir. Sağlayıcı kimliği: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Birleşik `content[]` API'sini kullanır. En fazla 2 girdi görselini
    (`first_frame` + `last_frame`) destekler. Tüm girdiler uzak `https://`
    URL'leri olmalıdır. Her görselde `role: "first_frame"` / `"last_frame"`
    ayarlayın veya görselleri konumsal olarak geçirin.

    `aspectRatio: "adaptive"` oranı girdi görselinden otomatik algılar.
    `audio: true`, `generate_audio` değerine eşlenir. `providerOptions.seed`
    (sayı) iletilir.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin gerektirir. Sağlayıcı kimliği: `byteplus-seedance2`. Modeller:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Birleşik `content[]` API'sini kullanır. En fazla 9 referans görseli,
    3 referans videosu ve 3 referans sesi destekler. Tüm girdiler uzak
    `https://` URL'leri olmalıdır. Her varlıkta `role` ayarlayın — desteklenen değerler:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` oranı girdi görselinden otomatik algılar.
    `audio: true`, `generate_audio` değerine eşlenir. `providerOptions.seed`
    (sayı) iletilir.

  </Accordion>
  <Accordion title="ComfyUI">
    İş akışı odaklı yerel veya bulut yürütmeyi sağlar. Yapılandırılmış grafik
    aracılığıyla metinden videoya ve görüntüden videoya destekler.
  </Accordion>
  <Accordion title="fal">
    Uzun süren işler için kuyruk destekli bir akış kullanır. OpenClaw, devam
    eden bir fal kuyruk işini zaman aşımına uğramış saymadan önce varsayılan
    olarak 20 dakikaya kadar bekler. Çoğu fal video modeli
    tek bir görüntü referansını kabul eder. Seedance 2.0 referanstan videoya
    modelleri en fazla 9 görüntü, 3 video ve 3 ses referansını kabul eder;
    toplam referans dosyası sayısı en fazla 12 olabilir.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Bir görüntü veya bir video referansını destekler. Üretilmiş ses istekleri,
    Gemini API yolunda bir uyarıyla yok sayılır; çünkü bu API mevcut Veo video
    üretimi için `generateAudio` parametresini reddeder.
  </Accordion>
  <Accordion title="MiniMax">
    Yalnızca tek görüntü referansı. MiniMax `768P` ve `1080P`
    çözünürlüklerini kabul eder; `720P` gibi istekler gönderimden önce
    desteklenen en yakın değere normalleştirilir.
  </Accordion>
  <Accordion title="OpenAI">
    Yalnızca `size` geçersiz kılması iletilir. Diğer stil geçersiz kılmaları
    (`aspectRatio`, `resolution`, `audio`, `watermark`) bir uyarıyla
    yok sayılır.
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter'ın eşzamansız `/videos` API'sini kullanır. OpenClaw işi
    gönderir, `polling_url` adresini yoklar ve `unsigned_urls` ya da
    belgelenmiş iş içeriği uç noktasını indirir. Paketle gelen
    `google/veo-3.1-fast` varsayılanı 4/6/8 saniyelik süreleri,
    `720P`/`1080P` çözünürlüklerini ve `16:9`/`9:16` en boy oranlarını
    bildirir.
  </Accordion>
  <Accordion title="Qwen">
    Alibaba ile aynı DashScope arka ucunu kullanır. Referans girdileri uzak
    `http(s)` URL'leri olmalıdır; yerel dosyalar en baştan reddedilir.
  </Accordion>
  <Accordion title="Runway">
    Veri URI'leri aracılığıyla yerel dosyaları destekler. Videodan videoya için
    `runway/gen4_aleph` gerekir. Yalnızca metin çalıştırmaları `16:9` ve
    `9:16` en boy oranlarını sunar.
  </Accordion>
  <Accordion title="Together">
    Yalnızca tek görüntü referansı.
  </Accordion>
  <Accordion title="Vydra">
    Kimlik doğrulamayı düşüren yönlendirmelerden kaçınmak için
    `https://www.vydra.ai/api/v1` adresini doğrudan kullanır. `veo3` yalnızca
    metinden videoya olarak paketlenir; `kling` uzak bir görüntü URL'si
    gerektirir.
  </Accordion>
  <Accordion title="xAI">
    Metinden videoya, tek ilk kare görüntüsünden videoya, xAI
    `reference_images` üzerinden en fazla 7 `reference_image` girdisini ve uzak
    video düzenleme/uzatma akışlarını destekler.
  </Accordion>
</AccordionGroup>

## Sağlayıcı yetenek modları

Paylaşılan video üretimi sözleşmesi, yalnızca düz toplu sınırlar yerine moda
özgü yetenekleri destekler. Yeni sağlayıcı uygulamaları açık mod bloklarını
tercih etmelidir:

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

`maxInputImages` ve `maxInputVideos` gibi düz toplu alanlar, dönüşüm modu
desteğini bildirmek için **yeterli değildir**. Sağlayıcılar, canlı
testlerin, sözleşme testlerinin ve paylaşılan `video_generate` aracının mod
desteğini deterministik biçimde doğrulayabilmesi için `generate`,
`imageToVideo` ve `videoToVideo` alanlarını açıkça bildirmelidir.

Bir sağlayıcıdaki bir model, geri kalanlardan daha geniş referans girdisi
desteğine sahipse mod genelindeki sınırı yükseltmek yerine
`maxInputImagesByModel`, `maxInputVideosByModel` veya
`maxInputAudiosByModel` kullanın.

## Canlı testler

Paylaşılan paketli sağlayıcılar için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Depo sarmalayıcısı:

```bash
pnpm test:live:media video
```

Bu canlı dosya, eksik sağlayıcı ortam değişkenlerini `~/.profile` dosyasından
yükler, varsayılan olarak canlı/ortam API anahtarlarını saklanmış kimlik
doğrulama profillerine göre tercih eder ve varsayılan olarak sürüm açısından
güvenli bir duman testi çalıştırır:

- Taramadaki her FAL dışı sağlayıcı için `generate`.
- Bir saniyelik ıstakoz prompt'u.
- Şuradan sağlayıcı başına işlem sınırı:
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (varsayılan olarak `180000`).

FAL isteğe bağlıdır, çünkü sağlayıcı tarafı kuyruk gecikmesi sürüm süresine
baskın gelebilir:

```bash
pnpm test:live:media video --video-providers fal
```

Paylaşılan taramanın yerel medyayla güvenli biçimde çalıştırabileceği
bildirilmiş dönüşüm modlarını da çalıştırmak için
`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:

- `capabilities.imageToVideo.enabled` olduğunda `imageToVideo`.
- `capabilities.videoToVideo.enabled` olduğunda ve sağlayıcı/model paylaşılan
  taramada tampon destekli yerel video girdisini kabul ettiğinde
  `videoToVideo`.

Bugün paylaşılan `videoToVideo` canlı hattı, yalnızca
`runway/gen4_aleph` seçtiğinizde `runway` kapsamını içerir.

## Yapılandırma

OpenClaw yapılandırmanızda varsayılan video üretimi modelini ayarlayın:

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
- [Arka plan görevleri](/tr/automation/tasks) — eşzamansız video üretimi için görev takibi
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
