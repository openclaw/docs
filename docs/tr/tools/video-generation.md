---
read_when:
    - Agent aracılığıyla video oluşturma
    - Video oluşturma sağlayıcılarını ve modellerini yapılandırma
    - '`video_generate` araç parametrelerini anlama'
summary: 12 sağlayıcı backend kullanarak metinden, görsellerden veya mevcut videolardan video oluşturma
title: Video Oluşturma
x-i18n:
    generated_at: "2026-04-11T02:48:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6848d03ef578181902517d068e8d9fe2f845e572a90481bbdf7bd9f1c591f245
    source_path: tools/video-generation.md
    workflow: 15
---

# Video Oluşturma

OpenClaw agent'ları metin istemlerinden, referans görsellerden veya mevcut videolardan video oluşturabilir. On iki sağlayıcı backend desteklenir ve her birinin farklı model seçenekleri, girdi modları ve özellik kümeleri vardır. Agent, yapılandırmanıza ve kullanılabilir API anahtarlarına göre doğru sağlayıcıyı otomatik olarak seçer.

<Note>
`video_generate` aracı yalnızca en az bir video oluşturma sağlayıcısı kullanılabilir olduğunda görünür. Agent araçlarınızda bunu görmüyorsanız bir sağlayıcı API anahtarı ayarlayın veya `agents.defaults.videoGenerationModel` yapılandırın.
</Note>

OpenClaw, video oluşturmayı üç çalışma zamanı modu olarak ele alır:

- referans medya içermeyen metinden videoya istekler için `generate`
- istek bir veya daha fazla referans görsel içerdiğinde `imageToVideo`
- istek bir veya daha fazla referans video içerdiğinde `videoToVideo`

Sağlayıcılar bu modların herhangi bir alt kümesini destekleyebilir. Araç, gönderimden önce etkin
modu doğrular ve desteklenen modları `action=list` içinde bildirir.

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

> Gün batımında sörf yapan dost canlısı bir ıstakozun 5 saniyelik sinematik bir videosunu oluştur.

Agent `video_generate` aracını otomatik olarak çağırır. Araç allowlist ayarlaması gerekmez.

## Video oluşturduğunuzda ne olur

Video oluşturma eşzamansızdır. Agent bir oturum içinde `video_generate` çağırdığında:

1. OpenClaw isteği sağlayıcıya gönderir ve hemen bir görev kimliği döndürür.
2. Sağlayıcı işi arka planda işler (genellikle sağlayıcıya ve çözünürlüğe bağlı olarak 30 saniye ile 5 dakika arasında).
3. Video hazır olduğunda OpenClaw aynı oturumu dahili bir tamamlanma olayıyla uyandırır.
4. Agent tamamlanan videoyu özgün konuşmaya geri gönderir.

Bir iş sürerken aynı oturumdaki yinelenen `video_generate` çağrıları yeni bir oluşturma başlatmak yerine geçerli görev durumunu döndürür. CLI üzerinden ilerlemeyi denetlemek için `openclaw tasks list` veya `openclaw tasks show <taskId>` kullanın.

Oturum destekli agent çalıştırmalarının dışında (örneğin doğrudan araç çağrıları), araç satır içi oluşturmaya fallback yapar ve son medya yolunu aynı tur içinde döndürür.

### Görev yaşam döngüsü

Her `video_generate` isteği dört durumdan geçer:

1. **queued** -- görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.
2. **running** -- sağlayıcı işliyor (genellikle sağlayıcıya ve çözünürlüğe bağlı olarak 30 saniye ile 5 dakika arasında).
3. **succeeded** -- video hazır; agent uyanır ve videoyu konuşmaya gönderir.
4. **failed** -- sağlayıcı hatası veya zaman aşımı; agent hata ayrıntılarıyla uyanır.

CLI üzerinden durumu denetleyin:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Yinelenme önleme: geçerli oturum için bir video görevi zaten `queued` veya `running` durumundaysa, `video_generate` yeni bir görev başlatmak yerine mevcut görev durumunu döndürür. Yeni bir oluşturmayı tetiklemeden açıkça denetlemek için `action: "status"` kullanın.

## Desteklenen sağlayıcılar

| Sağlayıcı | Varsayılan model                | Metin | Görsel ref        | Video ref        | API anahtarı                             |
| --------- | ------------------------------- | ----- | ----------------- | ---------------- | ---------------------------------------- |
| Alibaba   | `wan2.6-t2v`                    | Evet  | Evet (uzak URL)   | Evet (uzak URL)  | `MODELSTUDIO_API_KEY`                    |
| BytePlus  | `seedance-1-0-lite-t2v-250428`  | Evet  | 1 görsel          | Hayır            | `BYTEPLUS_API_KEY`                       |
| ComfyUI   | `workflow`                      | Evet  | 1 görsel          | Hayır            | `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| fal       | `fal-ai/minimax/video-01-live`  | Evet  | 1 görsel          | Hayır            | `FAL_KEY`                                |
| Google    | `veo-3.1-fast-generate-preview` | Evet  | 1 görsel          | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax   | `MiniMax-Hailuo-2.3`            | Evet  | 1 görsel          | Hayır            | `MINIMAX_API_KEY`                        |
| OpenAI    | `sora-2`                        | Evet  | 1 görsel          | 1 video          | `OPENAI_API_KEY`                         |
| Qwen      | `wan2.6-t2v`                    | Evet  | Evet (uzak URL)   | Evet (uzak URL)  | `QWEN_API_KEY`                           |
| Runway    | `gen4.5`                        | Evet  | 1 görsel          | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together  | `Wan-AI/Wan2.2-T2V-A14B`        | Evet  | 1 görsel          | Hayır            | `TOGETHER_API_KEY`                       |
| Vydra     | `veo3`                          | Evet  | 1 görsel (`kling`) | Hayır           | `VYDRA_API_KEY`                          |
| xAI       | `grok-imagine-video`            | Evet  | 1 görsel          | 1 video          | `XAI_API_KEY`                            |

Bazı sağlayıcılar ek veya alternatif API anahtarı ortam değişkenlerini kabul eder. Ayrıntılar için ilgili [sağlayıcı sayfalarına](#related) bakın.

Çalışma zamanında kullanılabilir sağlayıcıları, modelleri ve
çalışma zamanı modlarını incelemek için `video_generate action=list` çalıştırın.

### Bildirilmiş yetenek matrisi

Bu, `video_generate`, sözleşme testleri
ve paylaşılan canlı tarama tarafından kullanılan açık mod sözleşmesidir.

| Sağlayıcı | `generate` | `imageToVideo` | `videoToVideo` | Bugünkü paylaşılan canlı hatlar                                                                                                          |
| --------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba   | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL'leri gerektirir                          |
| BytePlus  | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI   | Evet       | Evet           | Hayır          | Paylaşılan taramada yok; iş akışına özgü kapsam Comfy testleriyle birlikte yaşar                                                        |
| fal       | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| Google    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü mevcut buffer destekli Gemini/Veo taraması bu girdiyi kabul etmez  |
| MiniMax   | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| OpenAI    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü bu organizasyon/girdi yolu şu anda sağlayıcı tarafı inpaint/remix erişimi gerektirir |
| Qwen      | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL'leri gerektirir                          |
| Runway    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` yalnızca seçili model `runway/gen4_aleph` olduğunda çalışır                                 |
| Together  | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| Vydra     | Evet       | Evet           | Hayır          | `generate`; paylaşılan `imageToVideo` atlanır çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak görsel URL'si gerektirir |
| xAI       | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı şu anda uzak bir MP4 URL'si gerektirir                           |

## Araç parametreleri

### Gerekli

| Parametre | Tür    | Açıklama                                                                  |
| --------- | ------ | ------------------------------------------------------------------------- |
| `prompt`  | string | Oluşturulacak videonun metin açıklaması (`action: "generate"` için gereklidir) |

### İçerik girdileri

| Parametre | Tür      | Açıklama                           |
| --------- | -------- | ---------------------------------- |
| `image`   | string   | Tek referans görsel (yol veya URL) |
| `images`  | string[] | Birden çok referans görsel (en fazla 5) |
| `video`   | string   | Tek referans video (yol veya URL)  |
| `videos`  | string[] | Birden çok referans video (en fazla 4) |

### Stil denetimleri

| Parametre        | Tür     | Açıklama                                                                 |
| ---------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`    | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`     | string  | `480P`, `720P`, `768P` veya `1080P`                                     |
| `durationSeconds`| number  | Hedef süre saniye cinsinden (sağlayıcının desteklediği en yakın değere yuvarlanır) |
| `size`           | string  | Sağlayıcı desteklediğinde boyut ipucu                                   |
| `audio`          | boolean | Desteklendiğinde oluşturulan sesi etkinleştirir                         |
| `watermark`      | boolean | Desteklendiğinde sağlayıcı filigranını açar/kapatır                     |

### Gelişmiş

| Parametre | Tür    | Açıklama                                             |
| --------- | ------ | ---------------------------------------------------- |
| `action`  | string | `"generate"` (varsayılan), `"status"` veya `"list"` |
| `model`   | string | Sağlayıcı/model geçersiz kılması (ör. `runway/gen4.5`) |
| `filename`| string | Çıktı dosya adı ipucu                                |

Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw zaten süreyi en yakın sağlayıcı destekli değere normalleştirir; ayrıca yedek sağlayıcı farklı bir kontrol yüzeyi sunduğunda boyuttan en-boy oranına gibi çevrilmiş geometri ipuçlarını da yeniden eşler. Gerçekten desteklenmeyen geçersiz kılmalar en iyi çabayla yok sayılır ve araç sonucunda uyarı olarak bildirilir. Katı yetenek sınırları (örneğin çok fazla referans girdisi) gönderimden önce başarısız olur.

Araç sonuçları uygulanan ayarları bildirir. OpenClaw, sağlayıcı fallback'i sırasında süreyi veya geometriyi yeniden eşlediğinde döndürülen `durationSeconds`, `size`, `aspectRatio` ve `resolution` değerleri gönderilenleri yansıtır ve `details.normalization` istekten uygulanana yapılan çeviriyi kaydeder.

Referans girdileri çalışma zamanı modunu da seçer:

- Referans medya yok: `generate`
- Herhangi bir görsel referansı: `imageToVideo`
- Herhangi bir video referansı: `videoToVideo`

Karışık görsel ve video referansları kararlı bir paylaşılan yetenek yüzeyi değildir.
İstek başına tek bir referans türünü tercih edin.

## Eylemler

- **generate** (varsayılan) -- verilen istem ve isteğe bağlı referans girdilerinden bir video oluşturur.
- **status** -- başka bir oluşturma başlatmadan geçerli oturum için devam eden video görevinin durumunu denetler.
- **list** -- kullanılabilir sağlayıcıları, modelleri ve yeteneklerini gösterir.

## Model seçimi

Video oluşturulurken OpenClaw modeli şu sırayla çözümler:

1. **`model` araç parametresi** -- agent bunu çağrıda belirtirse.
2. **`videoGenerationModel.primary`** -- yapılandırmadan.
3. **`videoGenerationModel.fallbacks`** -- sırayla denenir.
4. **Otomatik algılama** -- geçerli kimlik doğrulamaya sahip sağlayıcıları kullanır; önce mevcut varsayılan sağlayıcı, ardından kalan sağlayıcılar alfabetik sırayla.

Bir sağlayıcı başarısız olursa sıradaki aday otomatik olarak denenir. Tüm adaylar başarısız olursa hata, her denemedeki ayrıntıları içerir.

Video oluşturmanın yalnızca açık `model`, `primary` ve `fallbacks`
girdilerini kullanmasını istiyorsanız `agents.defaults.mediaGenerationAutoProviderFallback: false`
ayarını yapın.

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

fal üzerindeki HeyGen video-agent şu şekilde sabitlenebilir:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/heygen/v2/video-agent",
      },
    },
  },
}
```

fal üzerindeki Seedance 2.0 şu şekilde sabitlenebilir:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
      },
    },
  },
}
```

## Sağlayıcı notları

| Sağlayıcı | Notlar                                                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba   | DashScope/Model Studio eşzamansız uç noktasını kullanır. Referans görseller ve videolar uzak `http(s)` URL'leri olmalıdır.                                        |
| BytePlus  | Yalnızca tek görsel referansı.                                                                                                                                       |
| ComfyUI   | İş akışı güdümlü yerel veya bulut yürütme. Yapılandırılan grafik üzerinden metinden videoya ve görselden videoya desteği sunar.                                   |
| fal       | Uzun süren işler için kuyruk destekli akış kullanır. Yalnızca tek görsel referansı. HeyGen video-agent ile Seedance 2.0 metinden videoya ve görselden videoya model başvurularını içerir. |
| Google    | Gemini/Veo kullanır. Bir görsel veya bir video referansını destekler.                                                                                               |
| MiniMax   | Yalnızca tek görsel referansı.                                                                                                                                       |
| OpenAI    | Yalnızca `size` geçersiz kılması iletilir. Diğer stil geçersiz kılmaları (`aspectRatio`, `resolution`, `audio`, `watermark`) uyarıyla birlikte yok sayılır.      |
| Qwen      | Alibaba ile aynı DashScope backend'ini kullanır. Referans girdileri uzak `http(s)` URL'leri olmalıdır; yerel dosyalar önceden reddedilir.                        |
| Runway    | Data URI'leri üzerinden yerel dosyaları destekler. Videodan videoya için `runway/gen4_aleph` gerekir. Yalnızca metin çalıştırmaları `16:9` ve `9:16` en-boy oranlarını sunar. |
| Together  | Yalnızca tek görsel referansı.                                                                                                                                       |
| Vydra     | Kimlik doğrulamayı düşüren yönlendirmeleri önlemek için doğrudan `https://www.vydra.ai/api/v1` kullanır. `veo3` paketlenmiş olarak yalnızca metinden videoya sunulur; `kling` uzak bir görsel URL'si gerektirir. |
| xAI       | Metinden videoya, görselden videoya ve uzak video düzenleme/uzatma akışlarını destekler.                                                                           |

## Sağlayıcı yetenek modları

Paylaşılan video oluşturma sözleşmesi artık sağlayıcıların yalnızca düz toplu sınırlar yerine
moda özgü yetenekleri bildirmesine izin verir. Yeni sağlayıcı
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
dönüştürme modu desteğini bildirmek için yeterli değildir. Sağlayıcılar
`generate`, `imageToVideo` ve `videoToVideo` modlarını açıkça bildirmelidir; böylece canlı testler,
sözleşme testleri ve paylaşılan `video_generate` aracı mod desteğini
deterministik biçimde doğrulayabilir.

## Canlı testler

Paylaşılan paketlenmiş sağlayıcılar için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo sarmalayıcısı:

```bash
pnpm test:live:media video
```

Bu canlı dosya eksik sağlayıcı ortam değişkenlerini `~/.profile` içinden yükler,
varsayılan olarak kayıtlı kimlik doğrulama profillerinden önce canlı/env API anahtarlarını tercih eder
ve yerel medya ile güvenli biçimde çalıştırabildiği bildirilmiş modları yürütür:

- Taramadaki her sağlayıcı için `generate`
- `capabilities.imageToVideo.enabled` olduğunda `imageToVideo`
- `capabilities.videoToVideo.enabled` olduğunda ve sağlayıcı/model
  paylaşılan taramada buffer destekli yerel video girdisini kabul ettiğinde `videoToVideo`

Bugün paylaşılan `videoToVideo` canlı hattı şunları kapsar:

- yalnızca `runway`, ancak siz `runway/gen4_aleph` seçtiğinizde

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

- [Tools Overview](/tr/tools)
- [Background Tasks](/tr/automation/tasks) -- eşzamansız video oluşturma için görev takibi
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
- [Configuration Reference](/tr/gateway/configuration-reference#agent-defaults)
- [Models](/tr/concepts/models)
