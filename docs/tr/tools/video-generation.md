---
read_when:
    - Ajan aracılığıyla video oluşturma
    - Video oluşturma sağlayıcılarını ve modellerini yapılandırma
    - '`video_generate` araç parametrelerini anlama'
sidebarTitle: Video generation
summary: 14 sağlayıcı backend'i boyunca metin, görsel veya video başvurularından `video_generate` ile video oluşturun
title: Video oluşturma
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:43:55Z"
  model: gpt-5.4
  provider: openai
  source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
  source_path: tools/video-generation.md
  workflow: 15
---

OpenClaw ajanları metin istemlerinden, referans görsellerden veya
mevcut videolardan video oluşturabilir. On dört sağlayıcı backend'i desteklenir; her biri
farklı model seçeneklerine, giriş kiplerine ve özellik kümelerine sahiptir. Ajan,
yapılandırmanıza ve kullanılabilir API anahtarlarına göre doğru sağlayıcıyı
otomatik olarak seçer.

<Note>
`video_generate` aracı yalnızca en az bir video oluşturma
sağlayıcısı kullanılabilir olduğunda görünür. Ajan araçlarınızda bunu görmüyorsanız,
bir sağlayıcı API anahtarı ayarlayın veya `agents.defaults.videoGenerationModel`
yapılandırmasını yapın.
</Note>

OpenClaw, video oluşturmayı üç çalışma zamanı kipi olarak ele alır:

- `generate` — referans medya olmadan metinden videoya istekler.
- `imageToVideo` — istek bir veya daha fazla referans görsel içerir.
- `videoToVideo` — istek bir veya daha fazla referans video içerir.

Sağlayıcılar bu kiplerin herhangi bir alt kümesini destekleyebilir. Araç,
aktif kipi gönderimden önce doğrular ve `action=list` içinde desteklenen
kipleri bildirir.

## Hızlı başlangıç

<Steps>
  <Step title="Auth yapılandırın">
    Desteklenen herhangi bir sağlayıcı için bir API anahtarı ayarlayın:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Varsayılan bir model seçin (isteğe bağlı)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ajana sorun">
    > Gün batımında sörf yapan dost canlısı bir ıstakozun 5 saniyelik sinematik videosunu oluştur.

    Ajan `video_generate` aracını otomatik olarak çağırır. Araç allowlist'e ekleme
    gerekmez.

  </Step>
</Steps>

## Eşzamansız oluşturma nasıl çalışır

Video oluşturma eşzamansızdır. Ajan bir
oturum içinde `video_generate` çağırdığında:

1. OpenClaw isteği sağlayıcıya gönderir ve hemen bir görev kimliği döndürür.
2. Sağlayıcı işi arka planda işler (genellikle sağlayıcıya ve çözünürlüğe bağlı olarak 30 saniye ila 5 dakika).
3. Video hazır olduğunda OpenClaw aynı oturumu dahili bir tamamlanma olayıyla uyandırır.
4. Ajan tamamlanan videoyu özgün konuşmaya geri gönderir.

Bir iş uçuş halindeyken, aynı
oturumdaki yinelenen `video_generate` çağrıları başka bir
oluşturma başlatmak yerine mevcut görev durumunu döndürür. CLI'dan ilerlemeyi
denetlemek için `openclaw tasks list` veya `openclaw tasks show <taskId>` kullanın.

Oturum destekli ajan çalıştırmaları dışında (örneğin doğrudan araç çağrıları),
araç satır içi oluşturmaya geri döner ve son medya yolunu
aynı turda döndürür.

Oluşturulan video dosyaları, sağlayıcı bayt döndürdüğünde OpenClaw tarafından yönetilen medya depolama altında kaydedilir. Varsayılan oluşturulan video kaydetme sınırı
video medya sınırını izler ve daha büyük render'lar için
`agents.defaults.mediaMaxMb` bunu artırır. Bir sağlayıcı ayrıca barındırılan bir çıktı URL'si döndürürse, OpenClaw
yerel kalıcılık aşırı büyük bir dosyayı reddederse görevi başarısız kılmak yerine
bu URL'yi teslim edebilir.

### Görev yaşam döngüsü

| Durum       | Anlamı                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.                                         |
| `running`   | Sağlayıcı işliyor (genellikle sağlayıcıya ve çözünürlüğe bağlı olarak 30 saniye ila 5 dakika).   |
| `succeeded` | Video hazır; ajan uyanır ve bunu konuşmaya gönderir.                                             |
| `failed`    | Sağlayıcı hatası veya zaman aşımı; ajan hata ayrıntılarıyla uyanır.                              |

CLI'dan durumu denetleyin:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Geçerli oturum için bir video görevi zaten `queued` veya `running`
durumundaysa, `video_generate` yeni bir görev başlatmak yerine mevcut görev durumunu döndürür.
Yeni bir oluşturmayı tetiklemeden açıkça denetlemek için `action: "status"` kullanın.

## Desteklenen sağlayıcılar

| Sağlayıcı             | Varsayılan model                | Metin | Görsel ref                                          | Video ref                                        | Auth                                     |
| --------------------- | ------------------------------- | :---: | --------------------------------------------------- | ------------------------------------------------ | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓    | Evet (uzak URL)                                     | Evet (uzak URL)                                  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓    | 2 görsele kadar (yalnızca I2V modelleri; ilk + son kare) | —                                           | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓    | 2 görsele kadar (rol üzerinden ilk + son kare)      | —                                                | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓    | 9 referans görsele kadar                            | 3 videoya kadar                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓    | 1 görsel                                            | —                                                | `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓    | 1 görsel; Seedance referanstan videoya ile 9'a kadar | Seedance referanstan videoya ile 3 videoya kadar | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓    | 1 görsel                                            | 1 video                                          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓    | 1 görsel                                            | —                                                | `MINIMAX_API_KEY` veya MiniMax OAuth     |
| OpenAI                | `sora-2`                        |  ✓    | 1 görsel                                            | 1 video                                          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    |  ✓    | Evet (uzak URL)                                     | Evet (uzak URL)                                  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓    | 1 görsel                                            | 1 video                                          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓    | 1 görsel                                            | —                                                | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓    | 1 görsel (`kling`)                                  | —                                                | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓    | 1 ilk kare görseli veya en fazla 7 `reference_image` | 1 video                                        | `XAI_API_KEY`                            |

Bazı sağlayıcılar ek veya alternatif API anahtarı env var'larını kabul eder. Ayrıntılar için
ilgili [sağlayıcı sayfalarına](#related) bakın.

Çalışma zamanında kullanılabilir sağlayıcıları, modelleri ve
çalışma zamanı kiplerini incelemek için `video_generate action=list` çalıştırın.

### Yetenek matrisi

`video_generate`, sözleşme testleri ve
paylaşılan canlı tarama tarafından kullanılan açık kip sözleşmesi:

| Sağlayıcı | `generate` | `imageToVideo` | `videoToVideo` | Bugünkü paylaşılan canlı hatlar                                                                                                           |
| --------- | :--------: | :------------: | :------------: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL'leri gerektirir                          |
| BytePlus  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| ComfyUI   |     ✓      |       ✓        |       —        | Paylaşılan taramada yok; iş akışına özgü kapsam Comfy testleriyle yaşar                                                                  |
| fal       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` yalnızca Seedance referanstan videoya kullanılırken                                           |
| Google    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü mevcut arabellek destekli Gemini/Veo taraması bu girişi kabul etmez |
| MiniMax   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| OpenAI    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü bu org/girdi yolu şu anda sağlayıcı tarafı inpaint/remix erişimi gerektirir |
| Qwen      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL'leri gerektirir                          |
| Runway    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` yalnızca seçili model `runway/gen4_aleph` olduğunda çalışır                                  |
| Together  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| Vydra     |     ✓      |       ✓        |       —        | `generate`; paylaşılan `imageToVideo` atlanır çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak görsel URL'si gerektirir |
| xAI       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı şu anda uzak MP4 URL'si gerektirir                                |

## Araç parametreleri

### Gerekli

<ParamField path="prompt" type="string" required>
  Oluşturulacak videonun metin açıklaması. `action: "generate"` için gereklidir.
</ParamField>

### İçerik girdileri

<ParamField path="image" type="string">Tek referans görseli (yol veya URL).</ParamField>
<ParamField path="images" type="string[]">Birden çok referans görseli (9'a kadar).</ParamField>
<ParamField path="imageRoles" type="string[]">
Birleşik görsel listesine paralel, isteğe bağlı konum başına rol ipuçları.
Kanonik değerler: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Tek referans video (yol veya URL).</ParamField>
<ParamField path="videos" type="string[]">Birden çok referans video (4'e kadar).</ParamField>
<ParamField path="videoRoles" type="string[]">
Birleşik video listesine paralel, isteğe bağlı konum başına rol ipuçları.
Kanonik değer: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Tek referans ses (yol veya URL). Sağlayıcı ses girdilerini desteklediğinde arka plan müziği veya ses
referansı için kullanılır.
</ParamField>
<ParamField path="audioRefs" type="string[]">Birden çok referans ses (3'e kadar).</ParamField>
<ParamField path="audioRoles" type="string[]">
Birleşik ses listesine paralel, isteğe bağlı konum başına rol ipuçları.
Kanonik değer: `reference_audio`.
</ParamField>

<Note>
Rol ipuçları sağlayıcıya olduğu gibi iletilir. Kanonik değerler
`VideoGenerationAssetRole` birleşiminden gelir ancak sağlayıcılar ek
rol dizelerini kabul edebilir. `*Roles` dizileri, karşılık gelen
referans listesinden daha fazla giriş içermemelidir; bir fazla veya eksik hatalar
açık bir hata ile başarısız olur. Bir yuvayı ayarsız bırakmak için boş dize kullanın.
xAI için, `reference_images` oluşturma kipini kullanmak amacıyla her görsel rolünü
`reference_image` olarak ayarlayın; tek görselle görselden videoya için
rolü atlayın veya `first_frame` kullanın.
</Note>

### Stil denetimleri

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` veya `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` veya `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Saniye cinsinden hedef süre (sağlayıcının desteklediği en yakın değere yuvarlanır).
</ParamField>
<ParamField path="size" type="string">Sağlayıcı destekliyorsa boyut ipucu.</ParamField>
<ParamField path="audio" type="boolean">
  Destekleniyorsa çıktıda oluşturulmuş sesi etkinleştirir. `audioRef*` girdilerinden ayrıdır.
</ParamField>
<ParamField path="watermark" type="boolean">Destekleniyorsa sağlayıcı filigranını açar/kapatır.</ParamField>

`adaptive`, sağlayıcıya özgü bir sentineldir: yeteneklerinde
`adaptive` bildiren sağlayıcılara olduğu gibi iletilir (ör. BytePlus
Seedance bunu giriş görseli boyutlarından oranı otomatik algılamak için
kullanır). Bunu bildirmeyen sağlayıcılar değeri araç sonucundaki
`details.ignoredOverrides` üzerinden gösterir; böylece bırakıldığı görünür olur.

### Gelişmiş

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` geçerli oturum görevini döndürür; `"list"` sağlayıcıları inceler.
</ParamField>
<ParamField path="model" type="string">Sağlayıcı/model geçersiz kılması (ör. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>
<ParamField path="timeoutMs" type="number">Milisaniye cinsinden isteğe bağlı sağlayıcı istek zaman aşımı.</ParamField>
<ParamField path="providerOptions" type="object">
  JSON nesnesi olarak sağlayıcıya özgü seçenekler (ör. `{"seed": 42, "draft": true}`).
  Türlü bir şema bildiren sağlayıcılar anahtarları ve türleri doğrular; bilinmeyen
  anahtarlar veya uyumsuzluklar geri dönüş sırasında adayı atlar. Bildirilmiş
  şeması olmayan sağlayıcılar seçenekleri olduğu gibi alır. Her sağlayıcının
  ne kabul ettiğini görmek için `video_generate action=list` çalıştırın.
</ParamField>

<Note>
Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw süreyi
sağlayıcının desteklediği en yakın değere normalize eder ve bir geri dönüş sağlayıcısı farklı
bir denetim yüzeyi sunduğunda boyuttan en-boy oranına gibi çevrilmiş geometri ipuçlarını yeniden eşler.
Gerçekten desteklenmeyen geçersiz kılmalar en iyi çaba temelinde yok sayılır
ve araç sonucunda uyarı olarak bildirilir. Katı yetenek sınırları
(örneğin çok fazla referans girdisi) gönderimden önce başarısız olur. Araç sonuçları
uygulanan ayarları bildirir; `details.normalization`, istekten uygulanan değere yapılan tüm
çevirileri yakalar.
</Note>

Referans girdileri çalışma zamanı kipini seçer:

- Referans medya yok → `generate`
- Herhangi bir görsel referansı → `imageToVideo`
- Herhangi bir video referansı → `videoToVideo`
- Referans ses girdileri çözümlenen kipi **değiştirmez**; görsel/video referanslarının seçtiği kipin
  üzerine uygulanır ve yalnızca `maxInputAudios` bildiren
  sağlayıcılarla çalışır.

Karışık görsel ve video referansları kararlı, paylaşılan bir yetenek yüzeyi değildir.
İstek başına tek bir referans türünü tercih edin.

#### Geri dönüş ve türlü seçenekler

Bazı yetenek denetimleri araç sınırında değil, geri dönüş katmanında uygulanır; bu nedenle birincil sağlayıcının sınırlarını aşan bir istek
yine de yetenekli bir geri dönüş üzerinde çalışabilir:

- Etkin aday `maxInputAudios` bildirmiyorsa (veya `0` ise),
  istek ses referansları içerdiğinde atlanır; sonraki aday denenir.
- Etkin adayın `maxDurationSeconds` değeri, istenen `durationSeconds`
  değerinin altındaysa ve bildirilmiş bir `supportedDurationSeconds` listesi yoksa → atlanır.
- İstek `providerOptions` içeriyorsa ve etkin aday açıkça türlü bir
  `providerOptions` şeması bildiriyorsa → sağlanan anahtarlar şemada
  yoksa veya değer türleri eşleşmiyorsa atlanır. Bildirilmiş
  şeması olmayan sağlayıcılar seçenekleri olduğu gibi alır (geriye dönük uyumlu
  geçiş). Bir sağlayıcı, tüm sağlayıcı seçeneklerinden
  boş bir şema (`capabilities.providerOptions: {}`) bildirerek vazgeçebilir;
  bu da tür uyumsuzluğundakiyle aynı atlamaya neden olur.

Bir istekteki ilk atlama nedeni `warn` seviyesinde günlüğe yazılır; böylece operatörler
birincil sağlayıcılarının ne zaman atlandığını görür; sonraki atlamalar ise uzun geri dönüş zincirlerini sessiz tutmak için `debug` seviyesinde günlüğe yazılır. Her aday atlanırsa,
birleştirilmiş hata her biri için atlama nedenini içerir.

## Eylemler

| Eylem      | Ne yaptığı                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Varsayılan. Verilen istem ve isteğe bağlı referans girdilerinden video oluşturur.                        |
| `status`   | Başka bir oluşturma başlatmadan geçerli oturum için uçuş halindeki video görevinin durumunu denetler.   |
| `list`     | Kullanılabilir sağlayıcıları, modelleri ve bunların yeteneklerini gösterir.                              |

## Model seçimi

OpenClaw modeli şu sırayla çözümler:

1. **`model` araç parametresi** — ajan çağrıda bir tane belirtirse.
2. Yapılandırmadaki **`videoGenerationModel.primary`**.
3. Sırasıyla **`videoGenerationModel.fallbacks`**.
4. **Otomatik algılama** — geçerli auth'a sahip sağlayıcılar, önce
   geçerli varsayılan sağlayıcıyla, sonra kalan sağlayıcılar alfabetik
   sırayla.

Bir sağlayıcı başarısız olursa, sonraki aday otomatik olarak denenir. Tüm
adaylar başarısız olursa, hata her denemeden ayrıntıları içerir.

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
    DashScope / Model Studio eşzamansız uç noktasını kullanır. Referans görseller ve
    videolar uzak `http(s)` URL'leri olmalıdır.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Sağlayıcı kimliği: `byteplus`.

    Modeller: `seedance-1-0-pro-250528` (varsayılan),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V modelleri (`*-t2v-*`) görsel girdilerini kabul etmez; I2V modelleri ve
    genel `*-pro-*` modelleri tek referans görselini (ilk
    kare) destekler. Görseli konumsal olarak geçin veya `role: "first_frame"` ayarlayın.
    Bir görsel sağlandığında T2V model kimlikleri otomatik olarak karşılık gelen I2V
    varyantına geçirilir.

    Desteklenen `providerOptions` anahtarları: `seed` (number), `draft` (boolean —
    480p'yi zorlar), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin'ini gerektirir. Sağlayıcı kimliği: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Birleşik `content[]` API'sini kullanır. En fazla 2 giriş görselini
    (`first_frame` + `last_frame`) destekler. Tüm girdiler uzak `https://`
    URL'leri olmalıdır. Her görselde `role: "first_frame"` / `"last_frame"` ayarlayın veya
    görselleri konumsal olarak geçin.

    `aspectRatio: "adaptive"` giriş görselinden oranı otomatik algılar.
    `audio: true`, `generate_audio` olarak eşlenir. `providerOptions.seed`
    (number) iletilir.

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

    `aspectRatio: "adaptive"` giriş görselinden oranı otomatik algılar.
    `audio: true`, `generate_audio` olarak eşlenir. `providerOptions.seed`
    (number) iletilir.

  </Accordion>
  <Accordion title="ComfyUI">
    İş akışı güdümlü yerel veya bulut yürütmesi. Yapılandırılmış grafik üzerinden
    metinden videoya ve görselden videoya destekler.
  </Accordion>
  <Accordion title="fal">
    Uzun süren işler için kuyruk destekli bir akış kullanır. Çoğu fal video modeli
    tek görsel referansı kabul eder. Seedance 2.0 referanstan videoya
    modelleri en fazla 9 görsel, 3 video ve 3 ses referansını destekler; toplamda
    en fazla 12 referans dosyası olabilir.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Bir görseli veya bir video referansını destekler.
  </Accordion>
  <Accordion title="MiniMax">
    Yalnızca tek görsel referansı.
  </Accordion>
  <Accordion title="OpenAI">
    Yalnızca `size` geçersiz kılması iletilir. Diğer stil geçersiz kılmaları
    (`aspectRatio`, `resolution`, `audio`, `watermark`) bir
    uyarıyla yok sayılır.
  </Accordion>
  <Accordion title="Qwen">
    Alibaba ile aynı DashScope backend'ini kullanır. Referans girdileri uzak
    `http(s)` URL'leri olmalıdır; yerel dosyalar peşinen reddedilir.
  </Accordion>
  <Accordion title="Runway">
    Data URI'leri üzerinden yerel dosyaları destekler. Videodan videoya için
    `runway/gen4_aleph` gerekir. Yalnızca metin çalıştırmaları `16:9` ve `9:16` en-boy
    oranlarını açığa çıkarır.
  </Accordion>
  <Accordion title="Together">
    Yalnızca tek görsel referansı.
  </Accordion>
  <Accordion title="Vydra">
    Auth düşüren yönlendirmelerden kaçınmak için doğrudan `https://www.vydra.ai/api/v1` kullanır.
    `veo3` paketlenmiş olarak yalnızca metinden videoya gelir; `kling` ise
    uzak görsel URL'si gerektirir.
  </Accordion>
  <Accordion title="xAI">
    Metinden videoya, tek ilk kare görselden videoya, xAI `reference_images` üzerinden
    en fazla 7 `reference_image` girdisi ve uzak
    video düzenleme/uzatma akışlarını destekler.
  </Accordion>
</AccordionGroup>

## Sağlayıcı yetenek kipleri

Paylaşılan video oluşturma sözleşmesi yalnızca düz toplam sınırlar yerine
kipe özgü yetenekleri destekler. Yeni sağlayıcı uygulamaları
açık kip bloklarını tercih etmelidir:

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

`maxInputImages` ve `maxInputVideos` gibi düz toplam alanlar,
dönüştürme kipi desteğini ilan etmek için **yeterli değildir**. Sağlayıcılar
canlı testlerin, sözleşme testlerinin ve paylaşılan `video_generate` aracının
kip desteğini deterministik biçimde doğrulayabilmesi için `generate`, `imageToVideo` ve `videoToVideo` değerlerini açıkça bildirmelidir.

Bir sağlayıcıdaki bir model diğerlerine göre daha geniş referans girdi desteğine sahipse,
kip genelindeki sınırı artırmak yerine `maxInputImagesByModel`, `maxInputVideosByModel` veya
`maxInputAudiosByModel` kullanın.

## Canlı testler

Paylaşılan paketlenmiş sağlayıcılar için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo sarmalayıcısı:

```bash
pnpm test:live:media video
```

Bu canlı dosya, eksik sağlayıcı env var'larını `~/.profile` içinden yükler, varsayılan olarak saklanan auth profillerinden önce
canlı/env API anahtarlarını tercih eder ve varsayılan olarak sürüm için güvenli bir smoke testi çalıştırır:

- Taramadaki FAL dışı her sağlayıcı için `generate`.
- Bir saniyelik ıstakoz istemi.
- Sağlayıcı başına işlem sınırı,
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` içinden gelir (`varsayılan 180000`).

FAL isteğe bağlıdır çünkü sağlayıcı tarafı kuyruk gecikmesi sürüm
süresine baskın gelebilir:

```bash
pnpm test:live:media video --video-providers fal
```

Paylaşılan taramanın yerel medya ile güvenli şekilde çalıştırabildiği bildirilmiş
dönüştürme kiplerini de çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:

- `capabilities.imageToVideo.enabled` olduğunda `imageToVideo`.
- `capabilities.videoToVideo.enabled` olduğunda ve
  sağlayıcı/model paylaşılan taramada arabellek destekli yerel video girdisini kabul ettiğinde `videoToVideo`.

Bugün paylaşılan `videoToVideo` canlı hattı, yalnızca
`runway/gen4_aleph` seçtiğinizde `runway` kapsar.

## Yapılandırma

Varsayılan video oluşturma modelini OpenClaw yapılandırmanızda ayarlayın:

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
