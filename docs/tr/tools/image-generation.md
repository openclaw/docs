---
read_when:
    - Aracı üzerinden görsel oluşturuyorsunuz
    - Görsel oluşturma sağlayıcılarını ve modellerini yapılandırıyorsunuz
    - '`image_generate` araç parametrelerini anlamak istiyorsunuz'
summary: Yapılandırılmış sağlayıcıları kullanarak görseller oluşturun ve düzenleyin (OpenAI, Google Gemini, fal, MiniMax)
title: Görsel Oluşturma
x-i18n:
    generated_at: "2026-04-05T14:12:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d38a8a583997ceff6523ce4f51808c97a2b59fe4e5a34cf79cdcb70d7e83aec2
    source_path: tools/image-generation.md
    workflow: 15
---

# Görsel Oluşturma

`image_generate` aracı, aracının yapılandırılmış sağlayıcılarınızı kullanarak görseller oluşturmasına ve düzenlemesine olanak tanır. Oluşturulan görseller, aracının yanıtında otomatik olarak medya eki olarak teslim edilir.

<Note>
Bu araç yalnızca en az bir görsel oluşturma sağlayıcısı kullanılabilir olduğunda görünür. Aracınızın araçlarında `image_generate` görünmüyorsa `agents.defaults.imageGenerationModel` yapılandırın veya bir sağlayıcı API anahtarı ayarlayın.
</Note>

## Hızlı başlangıç

1. En az bir sağlayıcı için API anahtarı ayarlayın (örneğin `OPENAI_API_KEY` veya `GEMINI_API_KEY`).
2. İsteğe bağlı olarak tercih ettiğiniz modeli ayarlayın:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: "openai/gpt-image-1",
    },
  },
}
```

3. Aracıya şunu sorun: _"Dost canlısı bir ıstakoz maskotunun görselini oluştur."_

Aracı `image_generate` aracını otomatik olarak çağırır. Araç izin listesine ekleme gerekmez — bir sağlayıcı kullanılabilir olduğunda varsayılan olarak etkindir.

## Desteklenen sağlayıcılar

| Provider | Default model                    | Edit support            | API key                                               |
| -------- | -------------------------------- | ----------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-1`                    | Evet (en fazla 5 görsel)    | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | Evet                     | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | Evet                     | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | Evet (özne referansı) | `MINIMAX_API_KEY` veya MiniMax OAuth (`minimax-portal`) |

Çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

```
/tool image_generate action=list
```

## Araç parametreleri

| Parameter     | Type     | Description                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Görsel oluşturma istemi (`action: "generate"` için zorunlu)                           |
| `action`      | string   | Sağlayıcıları incelemek için `"generate"` (varsayılan) veya `"list"`                               |
| `model`       | string   | Sağlayıcı/model geçersiz kılması, ör. `openai/gpt-image-1`                                    |
| `image`       | string   | Düzenleme modu için tek bir referans görsel yolu veya URL'si                                      |
| `images`      | string[] | Düzenleme modu için birden çok referans görseli (en fazla 5)                                     |
| `size`        | string   | Boyut ipucu: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`            |
| `aspectRatio` | string   | En-boy oranı: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Çözünürlük ipucu: `1K`, `2K` veya `4K`                                                  |
| `count`       | number   | Oluşturulacak görsel sayısı (1–4)                                                    |
| `filename`    | string   | Çıktı dosya adı ipucu                                                                  |

Tüm sağlayıcılar tüm parametreleri desteklemez. Araç, her sağlayıcının desteklediği parametreleri geçirir ve geri kalanını yok sayar.

## Yapılandırma

### Model seçimi

```json5
{
  agents: {
    defaults: {
      // String form: yalnızca birincil model
      imageGenerationModel: "google/gemini-3.1-flash-image-preview",

      // Object form: birincil + sıralı geri dönüşler
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Sağlayıcı seçim sırası

Bir görsel oluşturulurken OpenClaw sağlayıcıları şu sırayla dener:

1. Araç çağrısından gelen **`model` parametresi** (aracı bir tane belirtirse)
2. Yapılandırmadaki **`imageGenerationModel.primary`**
3. Sırasıyla **`imageGenerationModel.fallbacks`**
4. **Otomatik algılama** — yalnızca kimlik doğrulama destekli sağlayıcı varsayılanlarını kullanır:
   - önce mevcut varsayılan sağlayıcı
   - sonra provider-id sırasına göre kalan kayıtlı görsel oluşturma sağlayıcıları

Bir sağlayıcı başarısız olursa (kimlik doğrulama hatası, oran sınırı vb.), bir sonraki aday otomatik olarak denenir. Hepsi başarısız olursa hata, her denemeden ayrıntılar içerir.

Notlar:

- Otomatik algılama kimlik doğrulama farkındadır. Bir sağlayıcı varsayılanı yalnızca
  OpenClaw o sağlayıcıyla gerçekten kimlik doğrulayabildiğinde aday listesine girer.
- Şu anda kayıtlı sağlayıcıları, bunların varsayılan
  modellerini ve kimlik doğrulama ortam değişkeni ipuçlarını incelemek için `action: "list"` kullanın.

### Görsel düzenleme

OpenAI, Google, fal ve MiniMax referans görsellerini düzenlemeyi destekler. Bir referans görsel yolu veya URL'si geçirin:

```
"Bu fotoğrafın sulu boya sürümünü oluştur" + image: "/path/to/photo.jpg"
```

OpenAI ve Google, `images` parametresi üzerinden en fazla 5 referans görseli destekler. fal ve MiniMax 1 tane destekler.

MiniMax görsel oluşturma, paketlenmiş iki MiniMax kimlik doğrulama yolu üzerinden de kullanılabilir:

- API anahtarı kurulumları için `minimax/image-01`
- OAuth kurulumları için `minimax-portal/image-01`

## Sağlayıcı yetenekleri

| Capability            | OpenAI               | Google               | fal                 | MiniMax                    |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- |
| Oluşturma              | Evet (en fazla 4)        | Evet (en fazla 4)        | Evet (en fazla 4)       | Evet (en fazla 9)              |
| Düzenleme/referans        | Evet (en fazla 5 görsel) | Evet (en fazla 5 görsel) | Evet (1 görsel)       | Evet (1 görsel, özne ref.) |
| Boyut kontrolü          | Evet                  | Evet                  | Evet                 | Hayır                         |
| En-boy oranı          | Hayır                   | Evet                  | Evet (yalnızca oluşturma) | Evet                        |
| Çözünürlük (1K/2K/4K) | Hayır                   | Evet                  | Evet                 | Hayır                         |

## İlgili

- [Araçlara Genel Bakış](/tools) — kullanılabilir tüm aracı araçları
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` yapılandırması
- [Modeller](/tr/concepts/models) — model yapılandırması ve devretme
