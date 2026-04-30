---
read_when:
    - Ajan aracılığıyla görsel oluşturma veya düzenleme
    - Görüntü oluşturma sağlayıcılarını ve modellerini yapılandırma
    - image_generate aracı parametrelerini anlama
sidebarTitle: Image generation
summary: OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI ve Vydra genelinde image_generate aracılığıyla görsel oluşturun ve düzenleyin
title: Görüntü oluşturma
x-i18n:
    generated_at: "2026-04-30T09:48:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` aracı, ajanınızın yapılandırdığınız sağlayıcıları kullanarak görüntü oluşturmasını ve düzenlemesini sağlar. Oluşturulan görüntüler, ajanın yanıtında otomatik olarak medya ekleri olarak iletilir.

<Note>
Araç yalnızca en az bir görüntü oluşturma sağlayıcısı kullanılabilir olduğunda görünür. Ajanınızın araçlarında `image_generate` görmüyorsanız `agents.defaults.imageGenerationModel` yapılandırın, bir sağlayıcı API anahtarı ayarlayın veya OpenAI Codex OAuth ile oturum açın.
</Note>

## Hızlı başlangıç

<Steps>
  <Step title="Kimlik doğrulamayı yapılandır">
    En az bir sağlayıcı için API anahtarı ayarlayın (örneğin `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) veya OpenAI Codex OAuth ile oturum açın.
  </Step>
  <Step title="Varsayılan bir model seçin (isteğe bağlı)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth aynı `openai/gpt-image-2` model başvurusunu kullanır. Bir `openai-codex` OAuth profili yapılandırıldığında OpenClaw, görüntü isteklerini önce `OPENAI_API_KEY` denemek yerine bu OAuth profili üzerinden yönlendirir. Açık `models.providers.openai` yapılandırması (API anahtarı, özel/Azure temel URL) doğrudan OpenAI Images API rotasına geri geçer.

  </Step>
  <Step title="Ajana sorun">
    _"Dost canlısı bir robot maskotunun görüntüsünü oluştur."_

    Ajan `image_generate` aracını otomatik olarak çağırır. Araç izin listesine gerek yoktur; bir sağlayıcı kullanılabilir olduğunda varsayılan olarak etkindir.

  </Step>
</Steps>

<Warning>
LocalAI gibi OpenAI uyumlu LAN uç noktaları için özel `models.providers.openai.baseUrl` değerini koruyun ve `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ile açıkça katılın. Özel ve dahili görüntü uç noktaları varsayılan olarak engelli kalır.
</Warning>

## Yaygın rotalar

| Hedef                                                | Model başvurusu                                   | Kimlik doğrulama                     |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API faturalamasıyla OpenAI görüntü oluşturma         | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex abonelik kimlik doğrulamasıyla OpenAI görüntü oluşturma | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI saydam arka plan PNG/WebP                     | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` veya OpenAI Codex OAuth |
| DeepInfra görüntü oluşturma                          | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| OpenRouter görüntü oluşturma                         | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM görüntü oluşturma                            | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini görüntü oluşturma                      | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` veya `GOOGLE_API_KEY` |

Aynı `image_generate` aracı, metinden görüntü oluşturmayı ve referans görüntü düzenlemeyi işler. Tek bir referans için `image`, birden fazla referans için `images` kullanın. `quality`, `outputFormat` ve `background` gibi sağlayıcı destekli çıktı ipuçları kullanılabilir olduğunda iletilir ve bir sağlayıcı bunları desteklemediğinde yok sayıldı olarak bildirilir. Yerleşik saydam arka plan desteği OpenAI'ye özeldir; diğer sağlayıcılar, arka uçları üretiyorsa PNG alfasını yine de koruyabilir.

## Desteklenen sağlayıcılar

| Sağlayıcı | Varsayılan model                       | Düzenleme desteği                 | Kimlik doğrulama                                      |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Evet (1 görüntü, iş akışı yapılandırmalı) | Bulut için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | Evet (1 görüntü)                  | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | Evet                              | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Evet                              | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`                |
| LiteLLM    | `gpt-image-2`                           | Evet (en fazla 5 giriş görüntüsü) | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Evet (konu referansı)             | `MINIMAX_API_KEY` veya MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Evet (en fazla 4 görüntü)         | `OPENAI_API_KEY` veya OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Evet (en fazla 5 giriş görüntüsü) | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | Hayır                             | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Evet (en fazla 5 görüntü)         | `XAI_API_KEY`                                         |

Çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

```text
/tool image_generate action=list
```

## Sağlayıcı yetenekleri

| Yetenek              | ComfyUI            | DeepInfra | fal               | Google             | MiniMax                 | OpenAI             | Vydra | xAI                |
| --------------------- | ------------------ | --------- | ----------------- | ------------------ | ----------------------- | ------------------ | ----- | ------------------ |
| Oluştur (azami sayı)  | İş akışı tanımlı   | 4         | 4                 | 4                  | 9                       | 4                  | 1     | 4                  |
| Düzenle / referans    | 1 görüntü (iş akışı) | 1 görüntü | 1 görüntü         | En fazla 5 görüntü | 1 görüntü (konu ref.)   | En fazla 5 görüntü | —     | En fazla 5 görüntü |
| Boyut kontrolü        | —                  | ✓         | ✓                 | ✓                  | —                       | En fazla 4K        | —     | —                  |
| En-boy oranı          | —                  | —         | ✓ (yalnızca oluşturma) | ✓              | ✓                       | —                  | —     | ✓                  |
| Çözünürlük (1K/2K/4K) | —                  | —         | ✓                 | ✓                  | —                       | —                  | —     | 1K, 2K             |

## Araç parametreleri

<ParamField path="prompt" type="string" required>
  Görüntü oluşturma istemi. `action: "generate"` için gereklidir.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `"list"` kullanın.
</ParamField>
<ParamField path="model" type="string">
  Sağlayıcı/model geçersiz kılma (örn. `openai/gpt-image-2`). Saydam OpenAI arka planları için `openai/gpt-image-1.5` kullanın.
</ParamField>
<ParamField path="image" type="string">
  Düzenleme modu için tek referans görüntü yolu veya URL.
</ParamField>
<ParamField path="images" type="string[]">
  Düzenleme modu için birden fazla referans görüntü (destekleyen sağlayıcılarda en fazla 5).
</ParamField>
<ParamField path="size" type="string">
  Boyut ipucu: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  En-boy oranı: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Çözünürlük ipucu.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Sağlayıcı desteklediğinde kalite ipucu.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Sağlayıcı desteklediğinde çıktı biçimi ipucu.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Sağlayıcı desteklediğinde arka plan ipucu. Saydamlık destekli sağlayıcılar için `outputFormat: "png"` veya `"webp"` ile `transparent` kullanın.
</ParamField>
<ParamField path="count" type="number">Oluşturulacak görüntü sayısı (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">İsteğe bağlı sağlayıcı isteği zaman aşımı, milisaniye cinsinden.</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>
<ParamField path="openai" type="object">
  Yalnızca OpenAI ipuçları: `background`, `moderation`, `outputCompression` ve `user`.
</ParamField>

<Note>
Tüm sağlayıcılar tüm parametreleri desteklemez. Bir yedek sağlayıcı, istenen seçeneğin tam aynısı yerine yakın bir geometri seçeneğini desteklediğinde OpenClaw, göndermeden önce en yakın desteklenen boyuta, en-boy oranına veya çözünürlüğe yeniden eşler. Desteklenmeyen çıktı ipuçları, destek beyan etmeyen sağlayıcılar için bırakılır ve araç sonucunda bildirilir. Araç sonuçları uygulanan ayarları bildirir; `details.normalization` istenenden uygulanana yapılan her çeviriyi yakalar.
</Note>

## Yapılandırma

### Model seçimi

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
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

OpenClaw sağlayıcıları şu sırayla dener:

1. Araç çağrısından **`model` parametresi** (ajan bir tane belirttiyse).
2. Yapılandırmadan **`imageGenerationModel.primary`**.
3. Sırayla **`imageGenerationModel.fallbacks`**.
4. **Otomatik algılama** — yalnızca kimlik doğrulama destekli sağlayıcı varsayılanları:
   - önce mevcut varsayılan sağlayıcı;
   - kalan kayıtlı görüntü oluşturma sağlayıcıları sağlayıcı kimliği sırasına göre.

Bir sağlayıcı başarısız olursa (kimlik doğrulama hatası, hız sınırı vb.), sonraki yapılandırılmış aday otomatik olarak denenir. Tümü başarısız olursa hata, her denemeden ayrıntıları içerir.

<AccordionGroup>
  <Accordion title="Çağrı başına model geçersiz kılmaları kesindir">
    Çağrı başına `model` geçersiz kılması yalnızca o sağlayıcı/modeli dener ve yapılandırılmış birincil/yedek veya otomatik algılanan sağlayıcılara devam etmez.
  </Accordion>
  <Accordion title="Otomatik algılama kimlik doğrulama farkındadır">
    Bir sağlayıcı varsayılanı, aday listesine yalnızca OpenClaw o sağlayıcı için gerçekten kimlik doğrulayabildiğinde girer. Yalnızca açık `model`, `primary` ve `fallbacks` girdilerini kullanmak için `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.
  </Accordion>
  <Accordion title="Zaman aşımları">
    Yavaş görüntü arka uçları için `agents.defaults.imageGenerationModel.timeoutMs` ayarlayın. Çağrı başına `timeoutMs` araç parametresi, yapılandırılmış varsayılanı geçersiz kılar.
  </Accordion>
  <Accordion title="Çalışma zamanında inceleyin">
    Geçerli olarak kayıtlı sağlayıcıları, varsayılan modellerini ve kimlik doğrulama ortam değişkeni ipuçlarını incelemek için `action: "list"` kullanın.
  </Accordion>
</AccordionGroup>

### Görüntü düzenleme

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI ve xAI referans görüntü düzenlemeyi destekler. Bir referans görüntü yolu veya URL geçirin:

```text
"Bu fotoğrafın sulu boya sürümünü oluştur" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google ve xAI, `images` parametresi üzerinden en fazla 5 referans görüntüyü destekler. fal, MiniMax ve ComfyUI 1 tane destekler.

## Sağlayıcı ayrıntıları

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (ve gpt-image-1.5)">
    OpenAI görüntü oluşturma varsayılan olarak `openai/gpt-image-2` kullanır. Bir
    `openai-codex` OAuth profili yapılandırılmışsa, OpenClaw Codex abonelik sohbet modelleri tarafından kullanılan aynı
    OAuth profilini yeniden kullanır ve
    görüntü isteğini Codex Responses arka ucu üzerinden gönderir. `https://chatgpt.com/backend-api` gibi eski Codex taban
    URL'leri, görüntü istekleri için standart olarak
    `https://chatgpt.com/backend-api/codex` biçimine dönüştürülür. OpenClaw
    bu istek için sessizce `OPENAI_API_KEY` değerine geri dönmez —
    doğrudan OpenAI Images API yönlendirmesini zorunlu kılmak için
    `models.providers.openai` öğesini bir API anahtarı, özel taban URL'si
    veya Azure uç noktasıyla açıkça yapılandırın.

    `openai/gpt-image-1.5`, `openai/gpt-image-1` ve
    `openai/gpt-image-1-mini` modelleri hâlâ açıkça seçilebilir. Şeffaf arka planlı PNG/WebP çıktısı için
    `gpt-image-1.5` kullanın; mevcut
    `gpt-image-2` API'si `background: "transparent"` değerini reddeder.

    `gpt-image-2`, aynı `image_generate` aracı üzerinden hem metinden görüntü oluşturmayı hem de
    referans görüntü düzenlemeyi destekler.
    OpenClaw `prompt`, `count`, `size`, `quality`, `outputFormat`
    ve referans görüntüleri OpenAI'a iletir. OpenAI
    `aspectRatio` veya `resolution` değerlerini doğrudan almaz; mümkün olduğunda OpenClaw
    bunları desteklenen bir `size` değerine eşler, aksi halde araç bunları
    yoksayılan geçersiz kılmalar olarak bildirir.

    OpenAI'a özgü seçenekler `openai` nesnesinin altında bulunur:

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

    `openai.background` `transparent`, `opaque` veya `auto` kabul eder;
    şeffaf çıktılar için `outputFormat` değerinin `png` veya `webp` olması ve
    şeffaflık destekli bir OpenAI görüntü modeli gerekir. OpenClaw varsayılan
    `gpt-image-2` şeffaf arka plan isteklerini `gpt-image-1.5` modeline yönlendirir.
    `openai.outputCompression` JPEG/WebP çıktılarına uygulanır.

    Üst düzey `background` ipucu sağlayıcıdan bağımsızdır ve OpenAI sağlayıcısı
    seçildiğinde şu anda aynı OpenAI `background` istek alanına eşlenir.
    Arka plan desteği beyan etmeyen sağlayıcılar, desteklenmeyen parametreyi almak yerine
    bunu `ignoredOverrides` içinde döndürür.

    OpenAI görüntü oluşturmayı `api.openai.com` yerine bir Azure OpenAI dağıtımı
    üzerinden yönlendirmek için
    [Azure OpenAI uç noktaları](/tr/providers/openai#azure-openai-endpoints) bölümüne bakın.

  </Accordion>
  <Accordion title="OpenRouter görüntü modelleri">
    OpenRouter görüntü oluşturma aynı `OPENROUTER_API_KEY` değerini kullanır ve
    OpenRouter'ın sohbet tamamlama görüntü API'si üzerinden yönlendirilir. OpenRouter
    görüntü modellerini `openrouter/` önekiyle seçin:

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

    OpenClaw `prompt`, `count`, referans görüntüleri ve
    Gemini uyumlu `aspectRatio` / `resolution` ipuçlarını OpenRouter'a iletir.
    Mevcut yerleşik OpenRouter görüntü modeli kısayolları arasında
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` ve `openai/gpt-5.4-image-2` bulunur. Yapılandırılmış Plugin'inizin neleri sunduğunu görmek için
    `action: "list"` kullanın.

  </Accordion>
  <Accordion title="MiniMax çift kimlik doğrulama">
    MiniMax görüntü oluşturma, her iki paketlenmiş MiniMax
    kimlik doğrulama yolu üzerinden kullanılabilir:

    - API anahtarı kurulumları için `minimax/image-01`
    - OAuth kurulumları için `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Paketlenmiş xAI sağlayıcısı, yalnızca istem içeren
    istekler için `/v1/images/generations`, `image` veya `images` mevcut olduğunda ise `/v1/images/edits` kullanır.

    - Modeller: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Sayı: en fazla 4
    - Referanslar: bir `image` veya en fazla beş `images`
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Çözünürlükler: `1K`, `2K`
    - Çıktılar: OpenClaw tarafından yönetilen görüntü ekleri olarak döndürülür

    OpenClaw, bu kontroller paylaşılan sağlayıcılar arası `image_generate` sözleşmesinde
    mevcut olana kadar xAI'a özgü `quality`, `mask`,
    `user` veya yalnızca yerel ek en-boy oranlarını özellikle sunmaz.

  </Accordion>
</AccordionGroup>

## Örnekler

<Tabs>
  <Tab title="Oluştur (4K yatay)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Oluştur (şeffaf PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Eşdeğer CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Oluştur (iki kare)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Düzenle (bir referans)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Düzenle (birden fazla referans)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Aynı `--output-format` ve `--background` bayrakları
`openclaw infer image edit` üzerinde kullanılabilir; `--openai-background` OpenAI'a özgü
takma ad olarak kalır. OpenAI dışındaki paketlenmiş sağlayıcılar bugün
açık arka plan denetimi beyan etmez, bu nedenle `background: "transparent"` onlar için yoksayıldı olarak bildirilir.

## İlgili

- [Araçlara genel bakış](/tr/tools) — kullanılabilir tüm ajan araçları
- [ComfyUI](/tr/providers/comfy) — yerel ComfyUI ve Comfy Cloud iş akışı kurulumu
- [fal](/tr/providers/fal) — fal görüntü ve video sağlayıcı kurulumu
- [Google (Gemini)](/tr/providers/google) — Gemini görüntü sağlayıcı kurulumu
- [MiniMax](/tr/providers/minimax) — MiniMax görüntü sağlayıcı kurulumu
- [OpenAI](/tr/providers/openai) — OpenAI Images sağlayıcı kurulumu
- [Vydra](/tr/providers/vydra) — Vydra görüntü, video ve konuşma kurulumu
- [xAI](/tr/providers/xai) — Grok görüntü, video, arama, kod yürütme ve TTS kurulumu
- [Yapılandırma referansı](/tr/gateway/config-agents#agent-defaults) — `imageGenerationModel` yapılandırması
- [Modeller](/tr/concepts/models) — model yapılandırması ve yük devretme
