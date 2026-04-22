---
read_when:
    - Aracı aracılığıyla görsel oluşturma
    - Görsel oluşturma sağlayıcılarını ve modellerini yapılandırma
    - '`image_generate` araç parametrelerini anlama'
summary: Yapılandırılmış sağlayıcıları kullanarak görseller oluşturun ve düzenleyin (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Görsel Oluşturma
x-i18n:
    generated_at: "2026-04-22T04:28:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e365cd23f4f8d8c9ce88d57e65f06ac5ae5285b8b7f9ea37f0b08ab5f6ff7235
    source_path: tools/image-generation.md
    workflow: 15
---

# Görsel Oluşturma

`image_generate` aracı, aracının yapılandırılmış sağlayıcılarınızı kullanarak görseller oluşturmasına ve düzenlemesine izin verir. Oluşturulan görseller, aracı yanıtında otomatik olarak medya eki olarak teslim edilir.

<Note>
Bu araç yalnızca en az bir görsel oluşturma sağlayıcısı kullanılabilir olduğunda görünür. Aracınızın araçları arasında `image_generate` görmüyorsanız `agents.defaults.imageGenerationModel` yapılandırın veya bir sağlayıcı API anahtarı ayarlayın.
</Note>

## Hızlı başlangıç

1. En az bir sağlayıcı için bir API anahtarı ayarlayın (örneğin `OPENAI_API_KEY` veya `GEMINI_API_KEY`).
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

3. Aracıya şunu sorun: _"Dost canlısı bir ıstakoz maskotu görseli oluştur."_

Aracı `image_generate` aracını otomatik olarak çağırır. Araç izin listesi gerekmez — bir sağlayıcı kullanılabilir olduğunda varsayılan olarak etkindir.

## Desteklenen sağlayıcılar

| Sağlayıcı | Varsayılan model                | Düzenleme desteği                   | API anahtarı                                           |
| -------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                    | Evet (5 görsele kadar)             | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | Evet                                | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`                |
| fal      | `fal-ai/flux/dev`                | Evet                                | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | Evet (özne başvurusu)              | `MINIMAX_API_KEY` veya MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Evet (1 görsel, workflow yapılandırmalı) | Bulut için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| Vydra    | `grok-imagine`                   | Hayır                               | `VYDRA_API_KEY`                                       |

Çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

```
/tool image_generate action=list
```

## Araç parametreleri

| Parametre    | Tür      | Açıklama                                                                            |
| ------------- | -------- | ----------------------------------------------------------------------------------- |
| `prompt`      | string   | Görsel oluşturma istemi (`action: "generate"` için gereklidir)                      |
| `action`      | string   | Sağlayıcıları incelemek için `"generate"` (varsayılan) veya `"list"`                |
| `model`       | string   | Sağlayıcı/model geçersiz kılması, örn. `openai/gpt-image-2`                         |
| `image`       | string   | Düzenleme modu için tek başvuru görsel yolu veya URL'si                             |
| `images`      | string[] | Düzenleme modu için birden fazla başvuru görseli (5'e kadar)                        |
| `size`        | string   | Boyut ipucu: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`        |
| `aspectRatio` | string   | En-boy oranı: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Çözünürlük ipucu: `1K`, `2K` veya `4K`                                              |
| `count`       | number   | Oluşturulacak görsel sayısı (1–4)                                                   |
| `filename`    | string   | Çıktı dosya adı ipucu                                                               |

Tüm sağlayıcılar tüm parametreleri desteklemez. Bir geri dönüş sağlayıcısı tam istenen geometri yerine yakın bir geometri seçeneğini destekliyorsa OpenClaw, gönderimden önce en yakın desteklenen boyuta, en-boy oranına veya çözünürlüğe yeniden eşler. Gerçekten desteklenmeyen geçersiz kılmalar yine araç sonucunda bildirilir.

Araç sonuçları uygulanan ayarları bildirir. OpenClaw sağlayıcı geri dönüşü sırasında geometriyi yeniden eşlediğinde, döndürülen `size`, `aspectRatio` ve `resolution` değerleri gerçekten gönderilmiş olanı yansıtır ve `details.normalization` istekten uygulanana yapılan çeviriyi yakalar.

## Yapılandırma

### Model seçimi

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Sağlayıcı seçme sırası

Bir görsel oluşturulurken OpenClaw sağlayıcıları şu sırada dener:

1. Araç çağrısından gelen **`model` parametresi** (aracı belirtirse)
2. Yapılandırmadan **`imageGenerationModel.primary`**
3. Sırayla **`imageGenerationModel.fallbacks`**
4. **Otomatik algılama** — yalnızca kimlik doğrulama destekli sağlayıcı varsayılanlarını kullanır:
   - önce geçerli varsayılan sağlayıcı
   - ardından sağlayıcı kimliği sırasına göre kalan kayıtlı görsel oluşturma sağlayıcıları

Bir sağlayıcı başarısız olursa (kimlik doğrulama hatası, hız sınırı vb.) sonraki aday otomatik olarak denenir. Hepsi başarısız olursa hata, her denemeden ayrıntılar içerir.

Notlar:

- Otomatik algılama kimlik doğrulama farkındalıklıdır. Bir sağlayıcı varsayılanı yalnızca
  OpenClaw o sağlayıcı için gerçekten kimlik doğrulaması yapabildiğinde aday listesine girer.
- Otomatik algılama varsayılan olarak etkindir. Görsel
  oluşturmanın yalnızca açık `model`, `primary` ve `fallbacks`
  girdilerini kullanmasını istiyorsanız
  `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.
- Geçerli kayıtlı sağlayıcıları, bunların
  varsayılan modellerini ve kimlik doğrulama ortam değişkeni ipuçlarını incelemek için `action: "list"` kullanın.

### Görsel düzenleme

OpenAI, Google, fal, MiniMax ve ComfyUI başvuru görsellerini düzenlemeyi destekler. Bir başvuru görsel yolu veya URL'si iletin:

```
"Bu fotoğrafın suluboya sürümünü oluştur" + image: "/path/to/photo.jpg"
```

OpenAI ve Google, `images` parametresi üzerinden 5'e kadar başvuru görselini destekler. fal, MiniMax ve ComfyUI 1 destekler.

### OpenAI `gpt-image-2`

OpenAI görsel oluşturma varsayılan olarak `openai/gpt-image-2` kullanır. Daha eski
`openai/gpt-image-1` modeli hâlâ açıkça seçilebilir, ancak yeni OpenAI
görsel oluşturma ve görsel düzenleme istekleri `gpt-image-2` kullanmalıdır.

`gpt-image-2`, aynı `image_generate` aracı üzerinden hem metinden görsele oluşturmayı hem de
başvuru görseli düzenlemeyi destekler. OpenClaw, `prompt`,
`count`, `size` ve başvuru görsellerini OpenAI'ye iletir. OpenAI doğrudan
`aspectRatio` veya `resolution` almaz; mümkün olduğunda OpenClaw bunları desteklenen bir
`size` alanına eşler, aksi takdirde araç bunları yok sayılan geçersiz kılmalar olarak bildirir.

Bir adet 4K yatay görsel oluşturun:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw görsel oluşturma için temiz bir editoryal poster" size=3840x2160 count=1
```

İki kare görsel oluşturun:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Sakin bir üretkenlik uygulaması simgesi için iki görsel yön" size=1024x1024 count=2
```

Bir yerel başvuru görselini düzenleyin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Özneyi koru, arka planı parlak bir stüdyo kurulumuyla değiştir" image=/path/to/reference.png size=1024x1536
```

Birden fazla başvuru ile düzenleyin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="İlk görseldeki karakter kimliğini ikinci görseldeki renk paletiyle birleştir" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

MiniMax görsel oluşturma her iki paketlenmiş MiniMax kimlik doğrulama yolu üzerinden de kullanılabilir:

- API anahtarı kurulumları için `minimax/image-01`
- OAuth kurulumları için `minimax-portal/image-01`

## Sağlayıcı yetenekleri

| Yetenek              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| Oluşturma             | Evet (4'e kadar)     | Evet (4'e kadar)     | Evet (4'e kadar)    | Evet (9'a kadar)           | Evet (workflow tanımlı çıktılar)   | Evet (1) |
| Düzenleme/başvuru     | Evet (5 görsele kadar) | Evet (5 görsele kadar) | Evet (1 görsel)   | Evet (1 görsel, özne başvurusu) | Evet (1 görsel, workflow yapılandırmalı) | Hayır |
| Boyut denetimi        | Evet (4K'ya kadar)   | Evet                 | Evet                | Hayır                      | Hayır                              | Hayır   |
| En-boy oranı          | Hayır                | Evet                 | Evet (yalnızca oluşturma) | Evet                  | Hayır                              | Hayır   |
| Çözünürlük (1K/2K/4K) | Hayır                | Evet                 | Evet                | Hayır                      | Hayır                              | Hayır   |

## İlgili

- [Tools Overview](/tr/tools) — tüm kullanılabilir aracı araçları
- [fal](/tr/providers/fal) — fal görsel ve video sağlayıcı kurulumu
- [ComfyUI](/tr/providers/comfy) — yerel ComfyUI ve Comfy Cloud workflow kurulumu
- [Google (Gemini)](/tr/providers/google) — Gemini görsel sağlayıcı kurulumu
- [MiniMax](/tr/providers/minimax) — MiniMax görsel sağlayıcı kurulumu
- [OpenAI](/tr/providers/openai) — OpenAI Images sağlayıcı kurulumu
- [Vydra](/tr/providers/vydra) — Vydra görsel, video ve konuşma kurulumu
- [Configuration Reference](/tr/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` yapılandırması
- [Models](/tr/concepts/models) — model yapılandırması ve geri dönüş
