---
read_when:
    - Aracı üzerinden görsel oluşturma
    - Görsel oluşturma sağlayıcılarını ve modellerini yapılandırma
    - '`image_generate` araç parametrelerini anlama'
summary: Yapılandırılmış sağlayıcıları kullanarak görseller oluşturun ve düzenleyin (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Görsel oluşturma
x-i18n:
    generated_at: "2026-04-24T09:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ffc32165c5e25925460f95f3a6e674a004e6640b7a4b9e88d025eb40943b4b
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` aracı, aracının yapılandırılmış sağlayıcılarınızı kullanarak görseller oluşturmasına ve düzenlemesine olanak tanır. Oluşturulan görseller, aracının yanıtında medya eki olarak otomatik teslim edilir.

<Note>
Araç yalnızca en az bir görsel oluşturma sağlayıcısı mevcut olduğunda görünür. Aracınızın araçlarında `image_generate` görünmüyorsa `agents.defaults.imageGenerationModel` yapılandırın, bir sağlayıcı API anahtarı ayarlayın veya OpenAI Codex OAuth ile oturum açın.
</Note>

## Hızlı başlangıç

1. En az bir sağlayıcı için API anahtarı ayarlayın (örneğin `OPENAI_API_KEY`, `GEMINI_API_KEY` veya `OPENROUTER_API_KEY`) ya da OpenAI Codex OAuth ile oturum açın.
2. İsteğe bağlı olarak tercih ettiğiniz modeli ayarlayın:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth aynı `openai/gpt-image-2` model ref'ini kullanır. Bir
`openai-codex` OAuth profili yapılandırıldığında OpenClaw, görsel isteklerini
önce `OPENAI_API_KEY` denemek yerine aynı OAuth profili üzerinden yönlendirir.
API anahtarı veya özel/Azure base URL gibi açık özel
`models.providers.openai` görsel config'i, doğrudan OpenAI Images API yoluna
yeniden geçiş yapar. LocalAI gibi OpenAI uyumlu LAN uç noktaları için özel
`models.providers.openai.baseUrl` değerini koruyun ve açıkça
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ile katılın; özel/dahili
görsel uç noktaları varsayılan olarak engellenmeye devam eder.

3. Aracıya şunu söyleyin: _"Dost canlısı bir robot maskotu görseli oluştur."_

Aracı `image_generate` aracını otomatik olarak çağırır. Araç allow-list'e alma gerekmez — bir sağlayıcı mevcut olduğunda varsayılan olarak etkindir.

## Desteklenen sağlayıcılar

| Sağlayıcı | Varsayılan model                        | Düzenleme desteği                   | Auth                                                  |
| --------- | --------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| OpenAI    | `gpt-image-2`                           | Evet (4 görsele kadar)              | `OPENAI_API_KEY` veya OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Evet (5 giriş görseline kadar)      | `OPENROUTER_API_KEY`                                  |
| Google    | `gemini-3.1-flash-image-preview`        | Evet                                | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`                |
| fal       | `fal-ai/flux/dev`                       | Evet                                | `FAL_KEY`                                             |
| MiniMax   | `image-01`                              | Evet (özne referansı)               | `MINIMAX_API_KEY` veya MiniMax OAuth (`minimax-portal`) |
| ComfyUI   | `workflow`                              | Evet (1 görsel, workflow yapılandırmalı) | bulut için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| Vydra     | `grok-imagine`                          | Hayır                               | `VYDRA_API_KEY`                                       |
| xAI       | `grok-imagine-image`                    | Evet (5 görsele kadar)              | `XAI_API_KEY`                                         |

Çalışma zamanında mevcut sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

```
/tool image_generate action=list
```

## Araç parametreleri

<ParamField path="prompt" type="string" required>
Görsel oluşturma prompt'u. `action: "generate"` için zorunludur.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Çalışma zamanında mevcut sağlayıcıları ve modelleri incelemek için `"list"` kullanın.
</ParamField>

<ParamField path="model" type="string">
Sağlayıcı/model geçersiz kılması, ör. `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Düzenleme modu için tek referans görsel yolu veya URL'si.
</ParamField>

<ParamField path="images" type="string[]">
Düzenleme modu için birden fazla referans görsel (en fazla 5).
</ParamField>

<ParamField path="size" type="string">
Boyut ipucu: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
En-boy oranı: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Çözünürlük ipucu.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Sağlayıcı desteklediğinde kalite ipucu.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Sağlayıcı desteklediğinde çıktı biçimi ipucu.
</ParamField>

<ParamField path="count" type="number">
Oluşturulacak görsel sayısı (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Milisaniye cinsinden isteğe bağlı sağlayıcı istek zaman aşımı.
</ParamField>

<ParamField path="filename" type="string">
Çıktı dosya adı ipucu.
</ParamField>

<ParamField path="openai" type="object">
Yalnızca OpenAI ipuçları: `background`, `moderation`, `outputCompression` ve `user`.
</ParamField>

Tüm sağlayıcılar tüm parametreleri desteklemez. Bir fallback sağlayıcı tam istenen seçenek yerine yakın bir geometri seçeneğini desteklediğinde OpenClaw, göndermeden önce en yakın desteklenen boyut, en-boy oranı veya çözünürlüğe yeniden eşler. `quality` veya `outputFormat` gibi desteklenmeyen çıktı ipuçları, bu desteği bildirmeyen sağlayıcılar için kaldırılır ve araç sonucunda raporlanır.

Araç sonuçları uygulanan ayarları bildirir. OpenClaw sağlayıcı fallback'i sırasında geometriyi yeniden eşlediğinde dönen `size`, `aspectRatio` ve `resolution` değerleri gerçekte ne gönderildiyse onu yansıtır ve `details.normalization` istenenden uygulanana çeviriyi yakalar.

## Config

### Model seçimi

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Sağlayıcı seçim sırası

Bir görsel oluşturulurken OpenClaw sağlayıcıları şu sırayla dener:

1. Araç çağrısındaki **`model` parametresi** (aracı bir tane belirtirse)
2. Config'teki **`imageGenerationModel.primary`**
3. Sırayla **`imageGenerationModel.fallbacks`**
4. **Otomatik algılama** — yalnızca auth destekli sağlayıcı varsayılanlarını kullanır:
   - önce geçerli varsayılan sağlayıcı
   - sonra sağlayıcı kimliği sırasına göre kalan kayıtlı görsel oluşturma sağlayıcıları

Bir sağlayıcı başarısız olursa (auth hatası, oran sınırlaması vb.) bir sonraki aday otomatik denenir. Hepsi başarısız olursa hata her denemeden ayrıntılar içerir.

Notlar:

- Otomatik algılama auth farkındalığına sahiptir. Bir sağlayıcı varsayılanı aday listesine ancak
  OpenClaw o sağlayıcıda gerçekten kimlik doğrulaması yapabiliyorsa girer.
- Otomatik algılama varsayılan olarak etkindir. Görsel oluşturmanın yalnızca açık
  `model`, `primary` ve `fallbacks` girdilerini kullanmasını istiyorsanız
  `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.
- Geçerli kayıtlı sağlayıcıları, varsayılan modellerini ve auth env var ipuçlarını
  incelemek için `action: "list"` kullanın.

### Görsel düzenleme

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI ve xAI referans görselleri düzenlemeyi destekler. Referans görsel yolu veya URL'si verin:

```
"Bu fotoğrafın suluboya versiyonunu oluştur" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google ve xAI, `images` parametresi üzerinden en fazla 5 referans görseli destekler. fal, MiniMax ve ComfyUI 1 tane destekler.

### OpenRouter görsel modelleri

OpenRouter görsel oluşturma, aynı `OPENROUTER_API_KEY` değerini kullanır ve OpenRouter'ın chat completions image API'si üzerinden yönlendirilir. OpenRouter görsel modellerini `openrouter/` önekiyle seçin:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw, `prompt`, `count`, referans görseller ve Gemini uyumlu `aspectRatio` / `resolution` ipuçlarını OpenRouter'a iletir. Mevcut yerleşik OpenRouter görsel model kısayolları arasında `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` ve `openai/gpt-5.4-image-2` bulunur; yapılandırılmış Plugin'inizin ne sunduğunu görmek için `action: "list"` kullanın.

### OpenAI `gpt-image-2`

OpenAI görsel oluşturma varsayılan olarak `openai/gpt-image-2` kullanır. Bir
`openai-codex` OAuth profili yapılandırılmışsa OpenClaw, Codex abonelik sohbet
modellerinde kullanılan aynı OAuth profilini yeniden kullanır ve görsel isteğini
Codex Responses backend'i üzerinden gönderir; bu istek için sessizce
`OPENAI_API_KEY` değerine fallback yapmaz. Doğrudan OpenAI Images API
yönlendirmesini zorlamak için `models.providers.openai` değerini API anahtarı,
özel base URL veya Azure uç noktasıyla açıkça yapılandırın. Daha eski
`openai/gpt-image-1` modeli hâlâ açıkça seçilebilir, ancak yeni OpenAI
görsel oluşturma ve görsel düzenleme istekleri `gpt-image-2` kullanmalıdır.

`gpt-image-2`, aynı `image_generate` aracı üzerinden hem metinden görsel
oluşturmayı hem de referans görsel düzenlemeyi destekler. OpenClaw `prompt`,
`count`, `size`, `quality`, `outputFormat` ve referans görselleri OpenAI'a
iletir. OpenAI `aspectRatio` veya `resolution` değerlerini doğrudan almaz;
mümkün olduğunda OpenClaw bunları desteklenen bir `size` değerine eşler, aksi
halde araç bunları yoksayılan geçersiz kılmalar olarak raporlar.

OpenAI'ye özgü seçenekler `openai` nesnesi altında bulunur:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background`, `transparent`, `opaque` veya `auto` kabul eder; şeffaf
çıktılar `outputFormat` olarak `png` veya `webp` gerektirir. `openai.outputCompression`
JPEG/WebP çıktılara uygulanır.

Bir adet 4K yatay görsel oluşturun:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw image generation için temiz bir editoryal poster" size=3840x2160 count=1
```

İki kare görsel oluşturun:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Sakin bir üretkenlik uygulaması simgesi için iki görsel yön" size=1024x1024 count=2
```

Bir yerel referans görseli düzenleyin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Özneyi koru, arka planı parlak bir stüdyo kurulumuyla değiştir" image=/path/to/reference.png size=1024x1536
```

Birden fazla referansla düzenleyin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="İlk görseldeki karakter kimliğini ikinci görseldeki renk paletiyle birleştir" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

OpenAI görsel oluşturmayı `api.openai.com` yerine bir Azure OpenAI deployment'ı
üzerinden yönlendirmek için OpenAI sağlayıcı belgelerindeki
[Azure OpenAI endpoints](/tr/providers/openai#azure-openai-endpoints) bölümüne bakın.

MiniMax görsel oluşturma, paketlenmiş iki MiniMax auth yolu üzerinden de kullanılabilir:

- API anahtarı kurulumları için `minimax/image-01`
- OAuth kurulumları için `minimax-portal/image-01`

## Sağlayıcı yetenekleri

| Yetenek               | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Oluşturma             | Evet (4'e kadar)     | Evet (4'e kadar)     | Evet (4'e kadar)    | Evet (9'a kadar)           | Evet (workflow tanımlı çıktılar)   | Evet (1) | Evet (4'e kadar)     |
| Düzenleme/referans    | Evet (5 görsele kadar) | Evet (5 görsele kadar) | Evet (1 görsel)   | Evet (1 görsel, özne ref)  | Evet (1 görsel, workflow yapılandırmalı) | Hayır | Evet (5 görsele kadar) |
| Boyut denetimi        | Evet (4K'ya kadar)   | Evet                 | Evet                | Hayır                      | Hayır                              | Hayır   | Hayır                |
| En-boy oranı          | Hayır                | Evet                 | Evet (yalnızca oluşturma) | Evet                  | Hayır                              | Hayır   | Evet                 |
| Çözünürlük (1K/2K/4K) | Hayır                | Evet                 | Evet                | Hayır                      | Hayır                              | Hayır   | Evet (1K/2K)         |

### xAI `grok-imagine-image`

Paketlenmiş xAI sağlayıcısı, yalnızca prompt içeren istekler için `/v1/images/generations`
ve `image` veya `images` mevcut olduğunda `/v1/images/edits` kullanır.

- Modeller: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Sayı: en fazla 4
- Referanslar: bir `image` veya en fazla beş `images`
- En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Çözünürlükler: `1K`, `2K`
- Çıktılar: OpenClaw tarafından yönetilen görsel ekleri olarak döndürülür

OpenClaw, bu denetimler paylaşılan
sağlayıcılar arası `image_generate` sözleşmesinde var olana kadar xAI-yerel `quality`, `mask`, `user`
veya ek yalnızca-yerel en-boy oranlarını bilerek açığa çıkarmaz.

## İlgili

- [Tools Overview](/tr/tools) — mevcut tüm aracı araçları
- [fal](/tr/providers/fal) — fal görsel ve video sağlayıcı kurulumu
- [ComfyUI](/tr/providers/comfy) — yerel ComfyUI ve Comfy Cloud workflow kurulumu
- [Google (Gemini)](/tr/providers/google) — Gemini görsel sağlayıcı kurulumu
- [MiniMax](/tr/providers/minimax) — MiniMax görsel sağlayıcı kurulumu
- [OpenAI](/tr/providers/openai) — OpenAI Images sağlayıcı kurulumu
- [Vydra](/tr/providers/vydra) — Vydra görsel, video ve konuşma kurulumu
- [xAI](/tr/providers/xai) — Grok görsel, video, arama, kod yürütme ve TTS kurulumu
- [Configuration Reference](/tr/gateway/config-agents#agent-defaults) — `imageGenerationModel` config
- [Models](/tr/concepts/models) — model yapılandırması ve failover
