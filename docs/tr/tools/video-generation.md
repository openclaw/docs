---
read_when:
    - Ajan aracılığıyla video oluşturma
    - Video üretimi sağlayıcılarını ve modellerini yapılandırma
    - video_generate aracının parametrelerini anlama
sidebarTitle: Video generation
summary: 16 sağlayıcı arka ucu genelinde metin, görsel veya video referanslarından video_generate aracılığıyla videolar oluşturun
title: Video oluşturma
x-i18n:
    generated_at: "2026-05-05T01:50:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6edce39c3006b748d512fec935b81566ae1a121c280248e9e9439edd1f052d83
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw ajanları metin istemlerinden, referans görsellerden veya
mevcut videolardan video oluşturabilir. Her biri farklı model seçenekleri,
giriş modları ve özellik kümeleri olan on altı sağlayıcı arka ucu desteklenir.
Ajan, yapılandırmanıza ve kullanılabilir API anahtarlarına göre doğru
sağlayıcıyı otomatik olarak seçer.

<Note>
`video_generate` aracı yalnızca en az bir video oluşturma sağlayıcısı
kullanılabilir olduğunda görünür. Ajan araçlarınızda görmüyorsanız bir
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
  <Step title="Kimlik doğrulamayı yapılandırın">
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
  <Step title="Ajana sorun">
    > Gün batımında sörf yapan dost canlısı bir ıstakozun 5 saniyelik sinematik videosunu oluştur.

    Ajan `video_generate` çağrısını otomatik olarak yapar. Araç için izin listesi
    gerekmez.

  </Step>
</Steps>

## Eşzamansız oluşturma nasıl çalışır?

Video oluşturma eşzamansızdır. Ajan bir oturumda `video_generate` çağırdığında:

1. OpenClaw isteği sağlayıcıya gönderir ve hemen bir görev kimliği döndürür.
2. Sağlayıcı işi arka planda işler (sağlayıcıya ve çözünürlüğe bağlı olarak genellikle 30 saniye ile 5 dakika arası).
3. Video hazır olduğunda OpenClaw aynı oturumu dahili bir tamamlama olayıyla uyandırır.
4. Ajan kullanıcıya bildirir ve tamamlanan videoyu ekler. Yalnızca mesaj aracıyla
   görünür teslimat kullanan grup/kanal sohbetlerinde ajan, sonucu OpenClaw’ın
   doğrudan göndermesi yerine mesaj aracı üzerinden iletir.

Bir iş devam ederken aynı oturumdaki yinelenen `video_generate` çağrıları,
başka bir oluşturma başlatmak yerine geçerli görev durumunu döndürür. CLI’dan
ilerlemeyi kontrol etmek için `openclaw tasks list` veya `openclaw tasks show <taskId>`
kullanın.

Oturum destekli ajan çalıştırmalarının dışında (örneğin doğrudan araç
çağrılarında), araç satır içi oluşturmaya geri döner ve son medya yolunu
aynı turda döndürür.

Oluşturulan video dosyaları, sağlayıcı bayt döndürdüğünde OpenClaw tarafından
yönetilen medya depolama alanına kaydedilir. Varsayılan oluşturulan video
kaydetme üst sınırı video medya sınırını izler ve `agents.defaults.mediaMaxMb`
daha büyük işlemeler için bunu yükseltir. Bir sağlayıcı ayrıca barındırılan bir
çıktı URL’si döndürdüğünde, yerel kalıcılık aşırı büyük bir dosyayı reddederse
OpenClaw görevi başarısız kılmak yerine bu URL’yi teslim edebilir.

### Görev yaşam döngüsü

| Durum       | Anlam                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.                                             |
| `running`   | Sağlayıcı işliyor (sağlayıcıya ve çözünürlüğe bağlı olarak genellikle 30 saniye ile 5 dakika arası). |
| `succeeded` | Video hazır; ajan uyanır ve bunu konuşmaya gönderir.                                   |
| `failed`    | Sağlayıcı hatası veya zaman aşımı; ajan hata ayrıntılarıyla uyanır.                                   |

CLI’dan durumu kontrol edin:

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

| Sağlayıcı              | Varsayılan model                   | Metin | Görsel ref.                                            | Video ref.                                       | Kimlik doğrulama                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Evet (uzak URL)                                     | Evet (uzak URL)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | En fazla 2 görsel (yalnızca I2V modelleri; ilk + son kare) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | En fazla 2 görsel (rol aracılığıyla ilk + son kare)         | —                                               | `BYTEPLUS_API_KEY`                       |
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

Bazı sağlayıcılar ek veya alternatif API anahtarı ortam değişkenlerini kabul eder.
Ayrıntılar için ilgili [sağlayıcı sayfalarına](#related) bakın.

Çalışma zamanında kullanılabilir sağlayıcıları, modelleri ve çalışma zamanı
modlarını incelemek için `video_generate action=list` çalıştırın.

### Yetenek matrisi

`video_generate`, sözleşme testleri ve paylaşılan canlı tarama tarafından
kullanılan açık mod sözleşmesi:

| Sağlayıcı   | `generate` | `imageToVideo` | `videoToVideo` | Bugünkü paylaşılan canlı kulvarlar                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL’lerine ihtiyaç duyar                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Paylaşılan taramada değil; iş akışına özgü kapsam Comfy testlerinde yer alır                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; yerel DeepInfra video şemaları, paketlenen sözleşmede metinden videoyadır                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` yalnızca Seedance referanstan videoya kullanılırken                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü mevcut arabellek destekli Gemini/Veo taraması bu girişi kabul etmez  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü bu kuruluş/giriş yolu şu anda sağlayıcı tarafı inpaint/remix erişimi gerektirir |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL’lerine ihtiyaç duyar                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` yalnızca seçilen model `runway/gen4_aleph` olduğunda çalışır                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; paylaşılan `imageToVideo` atlanır çünkü paketlenen `veo3` yalnızca metin destekler ve paketlenen `kling` uzak görsel URL’si gerektirir            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı şu anda uzak bir MP4 URL’sine ihtiyaç duyar                                |

## Araç parametreleri

### Gerekli

<ParamField path="prompt" type="string" required>
  Oluşturulacak videonun metin açıklaması. `action: "generate"` için gereklidir.
</ParamField>

### İçerik girişleri

<ParamField path="image" type="string">Tek referans görüntü (yol veya URL).</ParamField>
<ParamField path="images" type="string[]">Birden çok referans görüntü (en fazla 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Birleşik görüntü listesine paralel, konum başına isteğe bağlı rol ipuçları.
Kanonik değerler: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Tek referans video (yol veya URL).</ParamField>
<ParamField path="videos" type="string[]">Birden çok referans video (en fazla 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Birleşik video listesine paralel, konum başına isteğe bağlı rol ipuçları.
Kanonik değer: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Tek referans ses (yol veya URL). Sağlayıcı ses girişlerini desteklediğinde
arka plan müziği veya ses referansı için kullanılır.
</ParamField>
<ParamField path="audioRefs" type="string[]">Birden çok referans ses (en fazla 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Birleşik ses listesine paralel, konum başına isteğe bağlı rol ipuçları.
Kanonik değer: `reference_audio`.
</ParamField>

<Note>
Rol ipuçları sağlayıcıya olduğu gibi iletilir. Kanonik değerler
`VideoGenerationAssetRole` birleşiminden gelir ancak sağlayıcılar ek
rol dizelerini kabul edebilir. `*Roles` dizilerinde, karşılık gelen
referans listesinden daha fazla giriş olmamalıdır; bir eksik veya bir fazla
hataları net bir hatayla başarısız olur. Bir yuvayı ayarlanmamış bırakmak
için boş dize kullanın. xAI için, `reference_images` üretim modunu kullanmak
üzere her görüntü rolünü `reference_image` olarak ayarlayın; tek görüntülü
görüntüden videoya için rolü atlayın veya `first_frame` kullanın.
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
  Desteklendiğinde çıktıda üretilmiş sesi etkinleştirin. `audioRef*` değerlerinden (girişler) ayrıdır.
</ParamField>
<ParamField path="watermark" type="boolean">Desteklendiğinde sağlayıcı filigranını açıp kapatın.</ParamField>

`adaptive`, sağlayıcıya özgü bir belirteçtir: yeteneklerinde `adaptive`
bildiren sağlayıcılara olduğu gibi iletilir (ör. BytePlus Seedance,
oranı giriş görüntüsünün boyutlarından otomatik algılamak için bunu
kullanır). Bunu bildirmeyen sağlayıcılar, atlamanın görünür olması için
değeri araç sonucundaki `details.ignoredOverrides` üzerinden gösterir.

### Gelişmiş

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` geçerli oturum görevini döndürür; `"list"` sağlayıcıları inceler.
</ParamField>
<ParamField path="model" type="string">Sağlayıcı/model geçersiz kılma (ör. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>
<ParamField path="timeoutMs" type="number">Milisaniye cinsinden isteğe bağlı sağlayıcı istek zaman aşımı.</ParamField>
<ParamField path="providerOptions" type="object">
  JSON nesnesi olarak sağlayıcıya özgü seçenekler (ör. `{"seed": 42, "draft": true}`).
  Tipli bir şema bildiren sağlayıcılar anahtarları ve türleri doğrular; bilinmeyen
  anahtarlar veya uyuşmazlıklar fallback sırasında adayı atlar. Bildirilmiş şeması
  olmayan sağlayıcılar seçenekleri olduğu gibi alır. Her sağlayıcının ne kabul
  ettiğini görmek için `video_generate action=list` çalıştırın.
</ParamField>

<Note>
Her sağlayıcı her parametreyi desteklemez. OpenClaw süreyi, sağlayıcının
desteklediği en yakın değere normalleştirir ve fallback sağlayıcı farklı
bir denetim yüzeyi sunduğunda boyuttan en-boy oranına gibi çevrilmiş
geometri ipuçlarını yeniden eşler. Gerçekten desteklenmeyen geçersiz kılmalar
en iyi çaba temelinde yok sayılır ve araç sonucunda uyarı olarak raporlanır.
Çok fazla referans girişi gibi katı yetenek sınırları, gönderimden önce
başarısız olur. Araç sonuçları uygulanan ayarları raporlar;
`details.normalization`, istenenden uygulanana yapılan tüm çevirileri yakalar.
</Note>

Referans girişleri çalışma zamanı modunu seçer:

- Referans medya yok → `generate`
- Herhangi bir görüntü referansı → `imageToVideo`
- Herhangi bir video referansı → `videoToVideo`
- Referans ses girişleri çözümlenen modu **değiştirmez**; görüntü/video
  referanslarının seçtiği modun üzerine uygulanır ve yalnızca `maxInputAudios`
  bildiren sağlayıcılarla çalışır.

Karışık görüntü ve video referansları kararlı bir ortak yetenek yüzeyi değildir.
Her istek için tek bir referans türünü tercih edin.

#### Fallback ve tipli seçenekler

Bazı yetenek denetimleri araç sınırı yerine fallback katmanında uygulanır;
bu nedenle birincil sağlayıcının sınırlarını aşan bir istek, yetenekli bir
fallback üzerinde yine de çalışabilir:

- `maxInputAudios` bildirmeyen (veya `0` bildiren) etkin aday, istek ses
  referansları içerdiğinde atlanır; sonraki aday denenir.
- Etkin adayın `maxDurationSeconds` değeri istenen `durationSeconds` değerinin
  altındaysa ve bildirilmiş bir `supportedDurationSeconds` listesi yoksa → atlanır.
- İstek `providerOptions` içeriyorsa ve etkin aday açıkça tipli bir
  `providerOptions` şeması bildiriyorsa → sağlanan anahtarlar şemada
  değilse veya değer türleri eşleşmiyorsa atlanır. Bildirilmiş şeması
  olmayan sağlayıcılar seçenekleri olduğu gibi alır (geriye dönük uyumlu
  doğrudan geçiş). Bir sağlayıcı, boş bir şema (`capabilities.providerOptions: {}`)
  bildirerek tüm sağlayıcı seçeneklerinden vazgeçebilir; bu da tür uyuşmazlığıyla
  aynı atlamaya neden olur.

Bir istekteki ilk atlama nedeni `warn` düzeyinde kaydedilir; böylece operatörler
birincil sağlayıcılarının ne zaman geçildiğini görür. Uzun fallback zincirlerini
sessiz tutmak için sonraki atlamalar `debug` düzeyinde kaydedilir. Her aday
atlanırsa, birleştirilmiş hata her biri için atlama nedenini içerir.

## Eylemler

| Eylem      | Ne yapar                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| `generate` | Varsayılan. Verilen istemden ve isteğe bağlı referans girişlerinden video oluşturur.                       |
| `status`   | Başka bir üretim başlatmadan geçerli oturum için devam eden video görevinin durumunu denetler.            |
| `list`     | Kullanılabilir sağlayıcıları, modelleri ve yeteneklerini gösterir.                                        |

## Model seçimi

OpenClaw modeli şu sırayla çözer:

1. **`model` araç parametresi** — aracı çağırırken aracı bunu belirtirse.
2. Yapılandırmadan **`videoGenerationModel.primary`**.
3. Sırayla **`videoGenerationModel.fallbacks`**.
4. **Otomatik algılama** — geçerli varsayılan sağlayıcıdan başlayıp kalan
   sağlayıcıları alfabetik sırayla izleyerek geçerli kimlik doğrulaması olan
   sağlayıcılar.

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
    görüntüler ve videolar uzak `http(s)` URL'leri olmalıdır.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Sağlayıcı kimliği: `byteplus`.

    Modeller: `seedance-1-0-pro-250528` (varsayılan),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V modelleri (`*-t2v-*`) görüntü girişlerini kabul etmez; I2V modelleri ve
    genel `*-pro-*` modelleri tek bir referans görüntüyü (ilk kare)
    destekler. Görüntüyü konumsal olarak iletin veya `role: "first_frame"`
    ayarlayın. Bir görüntü sağlandığında T2V model kimlikleri otomatik olarak
    karşılık gelen I2V varyantına geçirilir.

    Desteklenen `providerOptions` anahtarları: `seed` (sayı), `draft` (boolean —
    480p'ye zorlar), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin gerektirir. Sağlayıcı kimliği: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Birleşik `content[]` API'sini kullanır. En fazla 2 giriş görüntüsünü
    destekler (`first_frame` + `last_frame`). Tüm girişler uzak `https://`
    URL'leri olmalıdır. Her görüntüde `role: "first_frame"` / `"last_frame"`
    ayarlayın veya görüntüleri konumsal olarak iletin.

    `aspectRatio: "adaptive"` oranı giriş görüntüsünden otomatik algılar.
    `audio: true`, `generate_audio` değerine eşlenir. `providerOptions.seed`
    (sayı) iletilir.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin gerektirir. Sağlayıcı kimliği: `byteplus-seedance2`. Modeller:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Birleşik `content[]` API'sini kullanır. En fazla 9 referans görüntü,
    3 referans video ve 3 referans sesi destekler. Tüm girişler uzak
    `https://` URL'leri olmalıdır. Her varlıkta `role` ayarlayın — desteklenen
    değerler: `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` oranı giriş görüntüsünden otomatik algılar.
    `audio: true`, `generate_audio` değerine eşlenir. `providerOptions.seed`
    (sayı) iletilir.

  </Accordion>
  <Accordion title="ComfyUI">
    İş akışı odaklı yerel veya bulut yürütmesi. Yapılandırılmış grafik üzerinden
    metinden videoya ve görüntüden videoya destekler.
  </Accordion>
  <Accordion title="fal">
    Uzun süren işler için kuyruk destekli bir akış kullanır. Çoğu fal video modeli
    tek bir görüntü referansını kabul eder. Seedance 2.0 referanstan videoya
    modelleri en fazla 9 görüntü, 3 video ve 3 ses referansını, toplamda en fazla
    12 referans dosyasıyla kabul eder.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Bir görüntü veya bir video referansını destekler.
  </Accordion>
  <Accordion title="MiniMax">
    Yalnızca tek görüntü referansı.
  </Accordion>
  <Accordion title="OpenAI">
    Yalnızca `size` geçersiz kılması iletilir. Diğer stil geçersiz kılmaları
    (`aspectRatio`, `resolution`, `audio`, `watermark`) bir uyarıyla yok sayılır.
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter'ın zaman uyumsuz `/videos` API'sini kullanır. OpenClaw işi
    gönderir, `polling_url` değerini yoklar ve `unsigned_urls` değerlerini veya
    belgelenmiş iş içeriği uç noktasını indirir. Birlikte gelen `google/veo-3.1-fast`
    varsayılanı 4/6/8 saniyelik süreleri, `720P`/`1080P` çözünürlükleri ve
    `16:9`/`9:16` en-boy oranlarını duyurur.
  </Accordion>
  <Accordion title="Qwen">
    Alibaba ile aynı DashScope arka ucunu kullanır. Referans girişleri uzak
    `http(s)` URL'leri olmalıdır; yerel dosyalar baştan reddedilir.
  </Accordion>
  <Accordion title="Runway">
    Veri URI'leri üzerinden yerel dosyaları destekler. Videodan videoya
    `runway/gen4_aleph` gerektirir. Yalnızca metin çalıştırmaları `16:9` ve
    `9:16` en-boy oranlarını sunar.
  </Accordion>
  <Accordion title="Together">
    Yalnızca tek görüntü referansı.
  </Accordion>
  <Accordion title="Vydra">
    Kimlik doğrulamayı düşüren yönlendirmelerden kaçınmak için
    `https://www.vydra.ai/api/v1` adresini doğrudan kullanır. `veo3`, yalnızca
    metinden videoya olarak birlikte gelir; `kling` uzak bir görüntü URL'si
    gerektirir.
  </Accordion>
  <Accordion title="xAI">
    Metinden videoya, tek ilk kare görüntüden videoya, xAI `reference_images`
    üzerinden en fazla 7 `reference_image` girişi ve uzak video düzenleme/uzatma
    akışlarını destekler.
  </Accordion>
</AccordionGroup>

## Sağlayıcı yetenek modları

Paylaşılan video oluşturma sözleşmesi, yalnızca düz toplu sınırlar yerine
moda özgü yetenekleri destekler. Yeni sağlayıcı uygulamaları açık mod
bloklarını tercih etmelidir:

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

`maxInputImages` ve `maxInputVideos` gibi düz toplu alanlar, dönüştürme
modu desteğini duyurmak için **yeterli değildir**. Sağlayıcılar `generate`,
`imageToVideo` ve `videoToVideo` değerlerini açıkça bildirmelidir; böylece
canlı testler, sözleşme testleri ve paylaşılan `video_generate` aracı mod
desteğini deterministik biçimde doğrulayabilir.

Bir sağlayıcıdaki tek bir model, diğerlerinden daha geniş referans girdisi
desteğine sahip olduğunda, mod genelindeki sınırı yükseltmek yerine
`maxInputImagesByModel`, `maxInputVideosByModel` veya
`maxInputAudiosByModel` kullanın.

## Canlı testler

Paylaşılan paket sağlayıcılar için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo sarmalayıcısı:

```bash
pnpm test:live:media video
```

Bu canlı dosya, eksik sağlayıcı ortam değişkenlerini `~/.profile` içinden
yükler, varsayılan olarak saklanan kimlik doğrulama profillerinden önce
canlı/ortam API anahtarlarını tercih eder ve varsayılan olarak sürüm için
güvenli bir duman testi çalıştırır:

- Taramadaki FAL dışındaki her sağlayıcı için `generate`.
- Bir saniyelik ıstakoz istemi.
- Sağlayıcı başına işlem sınırı
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` değerinden alınır (varsayılan
  olarak `180000`).

FAL isteğe bağlıdır çünkü sağlayıcı tarafındaki kuyruk gecikmesi sürüm
süresinde baskın olabilir:

```bash
pnpm test:live:media video --video-providers fal
```

Paylaşılan taramanın yerel medyayla güvenle çalıştırabileceği bildirilmiş
dönüştürme modlarını da çalıştırmak için
`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` değerini ayarlayın:

- `capabilities.imageToVideo.enabled` olduğunda `imageToVideo`.
- `capabilities.videoToVideo.enabled` olduğunda ve sağlayıcı/model,
  paylaşılan taramada arabellek destekli yerel video girdisini kabul
  ettiğinde `videoToVideo`.

Bugün paylaşılan `videoToVideo` canlı şeridi, yalnızca `runway/gen4_aleph`
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

Veya CLI üzerinden:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## İlgili

- [Alibaba Model Studio](/tr/providers/alibaba)
- [Arka plan görevleri](/tr/automation/tasks) — eşzamansız video oluşturma için görev izleme
- [BytePlus](/tr/concepts/model-providers#byteplus-international)
- [ComfyUI](/tr/providers/comfy)
- [Yapılandırma referansı](/tr/gateway/config-agents#agent-defaults)
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
