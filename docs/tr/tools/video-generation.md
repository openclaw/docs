---
read_when:
    - Agent aracılığıyla video üretme
    - Video üretimi sağlayıcılarını ve modellerini yapılandırma
    - '`video_generate` araç parametrelerini anlama'
summary: 14 sağlayıcı arka ucu kullanarak metinden, görsellerden veya mevcut videolardan video oluşturun
title: Video üretimi
x-i18n:
    generated_at: "2026-04-24T09:38:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ddefd4fcde2b22be6631c160ed6e128a97b0800d32c65fb5fe36227ce4f368
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw agent'ları metin istemlerinden, referans görsellerden veya mevcut videolardan video oluşturabilir. On dört sağlayıcı arka ucu desteklenir; her birinin farklı model seçenekleri, girdi modları ve özellik kümeleri vardır. Agent, yapılandırmanıza ve kullanılabilir API anahtarlarınıza göre doğru sağlayıcıyı otomatik seçer.

<Note>
`video_generate` aracı yalnızca en az bir video üretimi sağlayıcısı kullanılabilir olduğunda görünür. Bunu agent araçlarınızda görmüyorsanız bir sağlayıcı API anahtarı ayarlayın veya `agents.defaults.videoGenerationModel` yapılandırın.
</Note>

OpenClaw, video üretimini üç çalışma zamanı modu olarak ele alır:

- referans medya içermeyen metinden videoya istekler için `generate`
- istek bir veya daha fazla referans görsel içerdiğinde `imageToVideo`
- istek bir veya daha fazla referans video içerdiğinde `videoToVideo`

Sağlayıcılar bu modların herhangi bir alt kümesini destekleyebilir. Araç, etkin
modu gönderimden önce doğrular ve desteklenen modları `action=list` içinde bildirir.

## Hızlı başlangıç

1. Desteklenen herhangi bir sağlayıcı için bir API anahtarı ayarlayın:

```bash
export GEMINI_API_KEY="your-key"
```

2. İsteğe bağlı olarak varsayılan bir modeli sabitleyin:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Agent'a sorun:

> Gün batımında sörf yapan dost canlısı bir ıstakozun 5 saniyelik sinematik videosunu oluştur.

Agent `video_generate` aracını otomatik çağırır. Araç allowlist'i gerekmez.

## Video oluşturduğunuzda ne olur

Video üretimi eşzamansızdır. Agent bir oturum içinde `video_generate` çağırdığında:

1. OpenClaw isteği sağlayıcıya gönderir ve hemen bir görev kimliği döndürür.
2. Sağlayıcı işi arka planda işler (genellikle sağlayıcıya ve çözünürlüğe bağlı olarak 30 saniye ile 5 dakika arası).
3. Video hazır olduğunda OpenClaw aynı oturumu bir iç tamamlama olayıyla uyandırır.
4. Agent tamamlanmış videoyu özgün konuşmaya geri gönderir.

Bir iş devam ederken, aynı oturumdaki yinelenen `video_generate` çağrıları başka bir üretim başlatmak yerine geçerli görev durumunu döndürür. CLI'den ilerlemeyi denetlemek için `openclaw tasks list` veya `openclaw tasks show <taskId>` kullanın.

Oturum destekli agent çalıştırmalarının dışında (örneğin doğrudan araç çağrıları), araç satır içi üretime geri döner ve son medya yolunu aynı tur içinde döndürür.

### Görev yaşam döngüsü

Her `video_generate` isteği dört durumdan geçer:

1. **queued** -- görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.
2. **running** -- sağlayıcı işliyor (genellikle sağlayıcıya ve çözünürlüğe bağlı olarak 30 saniye ile 5 dakika arası).
3. **succeeded** -- video hazır; agent uyanır ve videoyu konuşmaya gönderir.
4. **failed** -- sağlayıcı hatası veya zaman aşımı; agent hata ayrıntılarıyla uyanır.

CLI'den durumu denetleyin:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Yinelenme önleme: geçerli oturum için bir video görevi zaten `queued` veya `running` ise, `video_generate` yeni bir görev başlatmak yerine mevcut görev durumunu döndürür. Yeni bir üretimi tetiklemeden açıkça denetlemek için `action: "status"` kullanın.

## Desteklenen sağlayıcılar

| Sağlayıcı             | Varsayılan model                | Metin | Görsel referansı                                      | Video referansı  | API anahtarı                             |
| --------------------- | ------------------------------- | ----- | ----------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Evet  | Evet (uzak URL)                                       | Evet (uzak URL)  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Evet  | En fazla 2 görsel (yalnızca I2V modelleri; ilk + son kare) | Hayır         | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Evet  | En fazla 2 görsel (rol aracılığıyla ilk + son kare)   | Hayır            | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Evet  | En fazla 9 referans görsel                            | En fazla 3 video | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Evet  | 1 görsel                                              | Hayır            | `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Evet  | 1 görsel                                              | Hayır            | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Evet  | 1 görsel                                              | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Evet  | 1 görsel                                              | Hayır            | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Evet  | 1 görsel                                              | 1 video          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Evet  | Evet (uzak URL)                                       | Evet (uzak URL)  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Evet  | 1 görsel                                              | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Evet  | 1 görsel                                              | Hayır            | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Evet  | 1 görsel (`kling`)                                    | Hayır            | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Evet  | 1 görsel                                              | 1 video          | `XAI_API_KEY`                            |

Bazı sağlayıcılar ek veya alternatif API anahtarı env değişkenlerini kabul eder. Ayrıntılar için ilgili [sağlayıcı sayfalarına](#related) bakın.

Kullanılabilir sağlayıcıları, modelleri ve
çalışma zamanı modlarını çalışma zamanında incelemek için `video_generate action=list` çalıştırın.

### Bildirilmiş yetenek matrisi

Bu, `video_generate`, sözleşme testleri
ve paylaşılan canlı tarama tarafından kullanılan açık mod sözleşmesidir.

| Sağlayıcı | `generate` | `imageToVideo` | `videoToVideo` | Bugünkü paylaşılan canlı hatlar                                                                                                         |
| --------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba   | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; bu sağlayıcı uzak `http(s)` video URL'leri gerektirdiği için `videoToVideo` atlanır                        |
| BytePlus  | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI   | Evet       | Evet           | Hayır          | Paylaşılan taramada yok; iş akışına özgü kapsam Comfy testlerinde bulunur                                                               |
| fal       | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| Google    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; mevcut buffer destekli Gemini/Veo taraması bu girdiyi kabul etmediği için paylaşılan `videoToVideo` atlanır |
| MiniMax   | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| OpenAI    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; bu kuruluş/girdi yolu şu anda sağlayıcı tarafı inpaint/remix erişimi gerektirdiği için paylaşılan `videoToVideo` atlanır |
| Qwen      | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; bu sağlayıcı uzak `http(s)` video URL'leri gerektirdiği için `videoToVideo` atlanır                        |
| Runway    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` yalnızca seçilen model `runway/gen4_aleph` olduğunda çalışır                                 |
| Together  | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| Vydra     | Evet       | Evet           | Hayır          | `generate`; paketlenmiş `veo3` yalnızca metin desteklediği ve paketlenmiş `kling` uzak görsel URL gerektirdiği için paylaşılan `imageToVideo` atlanır |
| xAI       | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; bu sağlayıcı şu anda uzak bir MP4 URL'si gerektirdiği için `videoToVideo` atlanır                           |

## Araç parametreleri

### Zorunlu

| Parametre | Tür    | Açıklama                                                                  |
| --------- | ------ | ------------------------------------------------------------------------- |
| `prompt`  | string | Oluşturulacak videonun metin açıklaması (`action: "generate"` için zorunlu) |

### İçerik girdileri

| Parametre    | Tür      | Açıklama                                                                                                                              |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | Tek referans görsel (yol veya URL)                                                                                                    |
| `images`     | string[] | Birden fazla referans görsel (en fazla 9)                                                                                             |
| `imageRoles` | string[] | Birleştirilmiş görsel listesine paralel isteğe bağlı konum başına rol ipuçları. Kanonik değerler: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | Tek referans video (yol veya URL)                                                                                                     |
| `videos`     | string[] | Birden fazla referans video (en fazla 4)                                                                                              |
| `videoRoles` | string[] | Birleştirilmiş video listesine paralel isteğe bağlı konum başına rol ipuçları. Kanonik değer: `reference_video`                      |
| `audioRef`   | string   | Tek referans ses (yol veya URL). Sağlayıcı ses girdilerini desteklediğinde örneğin arka plan müziği veya ses referansı için kullanılır |
| `audioRefs`  | string[] | Birden fazla referans ses (en fazla 3)                                                                                                |
| `audioRoles` | string[] | Birleştirilmiş ses listesine paralel isteğe bağlı konum başına rol ipuçları. Kanonik değer: `reference_audio`                        |

Rol ipuçları olduğu gibi sağlayıcıya iletilir. Kanonik değerler
`VideoGenerationAssetRole` birleşiminden gelir ancak sağlayıcılar ek
rol dizelerini kabul edebilir. `*Roles` dizileri, karşılık gelen
referans listesinden daha fazla girdi içermemelidir; bir fazla/bir eksik hataları açık bir hatayla başarısız olur.
Bir yuva ayarlanmadan kalsın istiyorsanız boş dize kullanın.

### Stil denetimleri

| Parametre         | Tür     | Açıklama                                                                                  |
| ----------------- | ------- | ----------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` veya `adaptive` |
| `resolution`      | string  | `480P`, `720P`, `768P` veya `1080P`                                                       |
| `durationSeconds` | number  | Saniye cinsinden hedef süre (sağlayıcının desteklediği en yakın değere yuvarlanır)       |
| `size`            | string  | Sağlayıcı desteklediğinde boyut ipucu                                                     |
| `audio`           | boolean | Desteklendiğinde çıktıda üretilmiş sesi etkinleştirir. `audioRef*` ile karıştırılmamalıdır (girdiler) |
| `watermark`       | boolean | Desteklendiğinde sağlayıcı filigranını açar/kapatır                                       |

`adaptive`, sağlayıcıya özgü bir sentinel değerdir: bunu
yeteneklerinde `adaptive` bildiren sağlayıcılara olduğu gibi iletir
(örneğin BytePlus Seedance bunu girdi görsel
boyutlarından oranı otomatik algılamak için kullanır). Bunu bildirmeyen sağlayıcılar
değeri araç sonucundaki `details.ignoredOverrides` üzerinden gösterir; böylece düşüş görünür olur.

### Gelişmiş

| Parametre         | Tür    | Açıklama                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (varsayılan), `"status"` veya `"list"`                                                                                                                                                                                                                                                                                                 |
| `model`           | string | Sağlayıcı/model geçersiz kılması (ör. `runway/gen4.5`)                                                                                                                                                                                                                                                                                              |
| `filename`        | string | Çıkış dosya adı ipucu                                                                                                                                                                                                                                                                                                                               |
| `timeoutMs`       | number | İsteğe bağlı sağlayıcı istek zaman aşımı (milisaniye cinsinden)                                                                                                                                                                                                                                                                                     |
| `providerOptions` | object | JSON nesnesi olarak sağlayıcıya özgü seçenekler (ör. `{"seed": 42, "draft": true}`). Türlendirilmiş bir şema bildiren sağlayıcılar anahtarları ve türleri doğrular; bilinmeyen anahtarlar veya eşleşmeyen türler fallback sırasında adayı atlar. Bildirilmiş şeması olmayan sağlayıcılar seçenekleri olduğu gibi alır. Her sağlayıcının ne kabul ettiğini görmek için `video_generate action=list` çalıştırın |

Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw zaten süreyi sağlayıcının desteklediği en yakın değere normalize eder ve fallback sağlayıcısı farklı bir denetim yüzeyi sunduğunda boyuttan en-boy oranına gibi çevrilmiş geometri ipuçlarını da yeniden eşler. Gerçekten desteklenmeyen geçersiz kılmalar en iyi çabayla yok sayılır ve araç sonucunda uyarı olarak bildirilir. Katı yetenek sınırları (örneğin çok fazla referans girdisi) gönderimden önce başarısız olur.

Araç sonuçları uygulanan ayarları bildirir. OpenClaw sağlayıcı fallback sırasında süreyi veya geometriyi yeniden eşlediğinde dönen `durationSeconds`, `size`, `aspectRatio` ve `resolution` değerleri gönderilen gerçek durumu yansıtır ve `details.normalization` istenenden uygulanana yapılan çevrimi kaydeder.

Referans girdileri çalışma zamanı modunu da seçer:

- Referans medya yok: `generate`
- Herhangi bir görsel referansı: `imageToVideo`
- Herhangi bir video referansı: `videoToVideo`
- Referans ses girdileri çözümlenen modu değiştirmez; görsel/video referanslarının seçtiği modun üstüne uygulanır ve yalnızca `maxInputAudios` bildiren sağlayıcılarda çalışır

Karışık görsel ve video referansları kararlı bir paylaşılan yetenek yüzeyi değildir.
İstek başına tek bir referans türü tercih edin.

#### Fallback ve türlendirilmiş seçenekler

Bazı yetenek denetimleri, fallback katmanında uygulanır; böylece birincil sağlayıcının sınırlarını aşan bir istek
yine de yetenekli bir fallback üzerinde çalışabilir:

- Etkin aday `maxInputAudios` bildirmiyorsa (veya bunu
  `0` olarak bildiriyorsa), istek ses referansları içerdiğinde atlanır ve
  sonraki aday denenir.
- Etkin adayın `maxDurationSeconds` değeri istenen
  `durationSeconds` değerinden düşükse ve aday bir
  `supportedDurationSeconds` listesi bildirmiyorsa atlanır.
- İstek `providerOptions` içeriyorsa ve etkin aday
  açıkça türlendirilmiş bir `providerOptions` şeması bildiriyorsa, sağlanan anahtarlar şemada yoksa veya değer türleri eşleşmiyorsa
  aday atlanır. Henüz şema bildirmemiş sağlayıcılar
  seçenekleri olduğu gibi alır (geriye dönük uyumlu geçiş). Bir sağlayıcı,
  boş bir şema bildirerek tüm provider seçeneklerinden açıkça vazgeçebilir
  (`capabilities.providerOptions: {}`); bu da
  tür uyuşmazlığıyla aynı atlamaya yol açar.

Bir istekteki ilk atlama nedeni `warn` düzeyinde günlüğe yazılır; böylece operatörler
birincil sağlayıcının ne zaman pas geçildiğini görür; sonraki atlamalar ise
uzun fallback zincirlerini sessiz tutmak için `debug` düzeyinde günlüğe yazılır. Her aday atlanırsa,
toplu hata her biri için atlama nedenini içerir.

## Eylemler

- **generate** (varsayılan) -- verilen istem ve isteğe bağlı referans girdilerinden video oluşturur.
- **status** -- başka bir üretim başlatmadan geçerli oturum için devam eden video görevinin durumunu denetler.
- **list** -- kullanılabilir sağlayıcıları, modelleri ve yeteneklerini gösterir.

## Model seçimi

Video oluştururken OpenClaw modeli şu sırayla çözümler:

1. **`model` araç parametresi** -- agent çağrıda bir model belirtirse.
2. **`videoGenerationModel.primary`** -- yapılandırmadan.
3. **`videoGenerationModel.fallbacks`** -- sırayla denenir.
4. **Otomatik algılama** -- geçerli varsayılan sağlayıcıyla başlayarak sonra kalan sağlayıcıları alfabetik sırayla deneyip geçerli kimlik doğrulamaya sahip sağlayıcıları kullanır.

Bir sağlayıcı başarısız olursa sonraki aday otomatik olarak denenir. Tüm adaylar başarısız olursa hata her denemeden ayrıntılar içerir.

Video üretiminin yalnızca açık `model`, `primary` ve `fallbacks`
girdilerini kullanmasını istiyorsanız `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

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
    DashScope / Model Studio eşzamansız uç noktasını kullanır. Referans görseller ve videolar uzak `http(s)` URL'leri olmalıdır.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    Sağlayıcı kimliği: `byteplus`.

    Modeller: `seedance-1-0-pro-250528` (varsayılan), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V modelleri (`*-t2v-*`) görsel girdilerini kabul etmez; I2V modelleri ve genel `*-pro-*` modelleri tek bir referans görseli destekler (ilk kare). Görseli konumsal olarak geçin veya `role: "first_frame"` ayarlayın. Bir görsel sağlandığında T2V model kimlikleri otomatik olarak karşılık gelen I2V varyantına geçirilir.

    Desteklenen `providerOptions` anahtarları: `seed` (number), `draft` (boolean — 480p zorlar), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin'ini gerektirir. Sağlayıcı kimliği: `byteplus-seedance15`. Model: `seedance-1-5-pro-251215`.

    Birleşik `content[]` API'sini kullanır. En fazla 2 girdi görselini destekler (`first_frame` + `last_frame`). Tüm girdiler uzak `https://` URL'leri olmalıdır. Her görselde `role: "first_frame"` / `"last_frame"` ayarlayın veya görselleri konumsal olarak geçin.

    `aspectRatio: "adaptive"` oranı girdi görselinden otomatik algılar. `audio: true`, `generate_audio` değerine eşlenir. `providerOptions.seed` (number) iletilir.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin'ini gerektirir. Sağlayıcı kimliği: `byteplus-seedance2`. Modeller: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Birleşik `content[]` API'sini kullanır. En fazla 9 referans görseli, 3 referans videosu ve 3 referans sesi destekler. Tüm girdiler uzak `https://` URL'leri olmalıdır. Her varlıkta `role` ayarlayın — desteklenen değerler: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` oranı girdi görselinden otomatik algılar. `audio: true`, `generate_audio` değerine eşlenir. `providerOptions.seed` (number) iletilir.

  </Accordion>

  <Accordion title="ComfyUI">
    İş akışı güdümlü yerel veya bulut yürütmesi. Yapılandırılmış graf üzerinden metinden videoya ve görselden videoya destekler.
  </Accordion>

  <Accordion title="fal">
    Uzun süren işler için kuyruk destekli bir akış kullanır. Yalnızca tek görsel referansı destekler.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Bir görseli veya bir videoyu referans olarak destekler.
  </Accordion>

  <Accordion title="MiniMax">
    Yalnızca tek görsel referansı.
  </Accordion>

  <Accordion title="OpenAI">
    Yalnızca `size` geçersiz kılması iletilir. Diğer stil geçersiz kılmaları (`aspectRatio`, `resolution`, `audio`, `watermark`) bir uyarıyla yok sayılır.
  </Accordion>

  <Accordion title="Qwen">
    Alibaba ile aynı DashScope arka ucunu kullanır. Referans girdileri uzak `http(s)` URL'leri olmalıdır; yerel dosyalar baştan reddedilir.
  </Accordion>

  <Accordion title="Runway">
    Veri URI'leri üzerinden yerel dosyaları destekler. Videodan videoya için `runway/gen4_aleph` gerekir. Yalnızca metin çalıştırmaları `16:9` ve `9:16` en-boy oranlarını açığa çıkarır.
  </Accordion>

  <Accordion title="Together">
    Yalnızca tek görsel referansı.
  </Accordion>

  <Accordion title="Vydra">
    Kimlik doğrulamayı düşüren yönlendirmelerden kaçınmak için doğrudan `https://www.vydra.ai/api/v1` kullanır. `veo3` paketlenmiş olarak yalnızca metinden videoya gelir; `kling` uzak bir görsel URL'si gerektirir.
  </Accordion>

  <Accordion title="xAI">
    Metinden videoya, görselden videoya ve uzak video düzenleme/uzatma akışlarını destekler.
  </Accordion>
</AccordionGroup>

## Sağlayıcı yetenek modları

Paylaşılan video üretimi sözleşmesi artık sağlayıcıların yalnızca düz toplu sınırlar yerine
moda özgü yetenekler bildirmesine izin veriyor. Yeni sağlayıcı
uygulamaları açık mod bloklarını tercih etmelidir:

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
dönüştürme modu desteğini ilan etmek için yeterli değildir. Sağlayıcılar
`generate`, `imageToVideo` ve `videoToVideo` bloklarını açıkça bildirmelidir; böylece canlı testler,
sözleşme testleri ve paylaşılan `video_generate` aracı mod desteğini
deterministik biçimde doğrulayabilir.

## Canlı testler

Paylaşılan paketlenmiş sağlayıcılar için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Depo sarmalayıcısı:

```bash
pnpm test:live:media video
```

Bu canlı dosya eksik sağlayıcı env değişkenlerini `~/.profile` içinden yükler,
varsayılan olarak saklanan auth profillerinden önce canlı/env API anahtarlarını tercih eder
ve varsayılan olarak sürüm güvenli bir smoke testi çalıştırır:

- taramadaki FAL dışı her sağlayıcı için `generate`
- bir saniyelik lobster istemi
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem sınırı
  (varsayılan `180000`)

FAL isteğe bağlıdır; çünkü sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın gelebilir:

```bash
pnpm test:live:media video --video-providers fal
```

Paylaşılan taramanın yerel medya ile güvenli biçimde çalıştırabildiği bildirilen dönüştürme
modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:

- `capabilities.imageToVideo.enabled` olduğunda `imageToVideo`
- `capabilities.videoToVideo.enabled` olduğunda ve sağlayıcı/model
  paylaşılan taramada buffer destekli yerel video girdisini kabul ettiğinde `videoToVideo`

Bugün paylaşılan `videoToVideo` canlı hattı şunları kapsar:

- yalnızca `runway/gen4_aleph` seçildiğinde `runway`

## Yapılandırma

Varsayılan video üretimi modelini OpenClaw yapılandırmanızda ayarlayın:

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

- [Araçlara Genel Bakış](/tr/tools)
- [Arka Plan Görevleri](/tr/automation/tasks) -- eşzamansız video üretimi için görev izleme
- [Alibaba Model Studio](/tr/providers/alibaba)
- [BytePlus](/tr/concepts/model-providers#byteplus-international)
- [ComfyUI](/tr/providers/comfy)
- [fal](/tr/providers/fal)
- [Google (Gemini)](/tr/providers/google)
- [MiniMax](/tr/providers/minimax)
- [OpenAI](/tr/providers/openai)
- [Qwen](/tr/providers/qwen)
- [Runway](/tr/providers/runway)
- [Together AI](/tr/providers/together)
- [Vydra](/tr/providers/vydra)
- [xAI](/tr/providers/xai)
- [Yapılandırma Başvurusu](/tr/gateway/config-agents#agent-defaults)
- [Modeller](/tr/concepts/models)
