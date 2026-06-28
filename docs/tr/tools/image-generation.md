---
read_when:
    - Ajan aracılığıyla görsel oluşturma veya düzenleme
    - Görüntü oluşturma sağlayıcılarını ve modellerini yapılandırma
    - image_generate aracı parametrelerini anlama
sidebarTitle: Image generation
summary: image_generate aracılığıyla OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra genelinde görüntüler oluşturun ve düzenleyin
title: Görsel oluşturma
x-i18n:
    generated_at: "2026-06-28T01:23:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` aracı, ajanın yapılandırdığınız sağlayıcıları kullanarak görüntü oluşturmasını ve düzenlemesini sağlar. Sohbet oturumlarında görüntü oluşturma eşzamansız çalışır: OpenClaw bir arka plan görevi kaydeder, görev kimliğini hemen döndürür ve sağlayıcı tamamladığında ajanı uyandırır. Tamamlama ajanı, oturumun normal görünür yanıt modunu izler: yapılandırılmışsa otomatik son yanıt teslimi ya da oturum ileti aracını gerektiriyorsa `message(action="send")`. İstek sahibi oturum etkin değilse veya etkin uyandırma başarısız olursa ve bazı oluşturulan görüntüler tamamlama yanıtında hâlâ eksikse, OpenClaw yalnızca eksik görüntülerle idempotent bir doğrudan yedek gönderir.

<Note>
Araç yalnızca en az bir görüntü oluşturma sağlayıcısı kullanılabilir olduğunda görünür. Ajanınızın araçlarında `image_generate` görmüyorsanız `agents.defaults.imageGenerationModel` yapılandırın, bir sağlayıcı API anahtarı ayarlayın veya OpenAI ChatGPT/Codex OAuth ile oturum açın.
</Note>

## Hızlı başlangıç

<Steps>
  <Step title="Kimlik doğrulamayı yapılandırın">
    En az bir sağlayıcı için bir API anahtarı ayarlayın (örneğin `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) veya OpenAI Codex OAuth ile oturum açın.
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

    ChatGPT/Codex OAuth aynı `openai/gpt-image-2` model başvurusunu kullanır. Bir `openai` OAuth profili yapılandırıldığında, OpenClaw görüntü isteklerini önce `OPENAI_API_KEY` denemek yerine bu OAuth profili üzerinden yönlendirir. Açık `models.providers.openai` yapılandırması (API anahtarı, özel/Azure temel URL) doğrudan OpenAI Images API yoluna geri geçiş yapar.

  </Step>
  <Step title="Ajana istekte bulunun">
    _"Dost canlısı bir robot maskotunun görüntüsünü oluştur."_

    Ajan `image_generate` aracını otomatik olarak çağırır. Araç izin listesine alma gerekmez - bir sağlayıcı kullanılabilir olduğunda varsayılan olarak etkindir. Araç bir arka plan görev kimliği döndürür, ardından tamamlama ajanı hazır olduğunda oluşturulan eki `message` aracı üzerinden gönderir.

  </Step>
</Steps>

<Warning>
LocalAI gibi OpenAI uyumlu LAN uç noktaları için özel `models.providers.openai.baseUrl` değerini koruyun ve `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ile açıkça dahil olun. Özel ve dahili görüntü uç noktaları varsayılan olarak engelli kalır.
</Warning>

## Yaygın yollar

| Amaç                                                 | Model ref                                          | Kimlik doğrulama                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API faturalandırmasıyla OpenAI görüntü oluşturma             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex abonelik kimlik doğrulamasıyla OpenAI görüntü oluşturma | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI şeffaf arka planlı PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` veya OpenAI Codex OAuth |
| DeepInfra görüntü oluşturma                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 ifade/stil yönlendirmeli oluşturma      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter görüntü oluşturma                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM görüntü oluşturma                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI görüntü oluşturma               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` veya Entra ID     |
| Google Gemini görüntü oluşturma                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`   |

Aynı `image_generate` aracı metinden görüntüye ve referans görüntü düzenlemeyi işler. Tek referans için `image`, birden fazla referans için `images` kullanın. fal üzerindeki Krea 2 modellerinde bu referanslar düzenleme girdileri yerine stil referansları olarak gönderilir.
`quality`, `outputFormat` ve `background` gibi sağlayıcının desteklediği çıktı ipuçları kullanılabilir olduğunda iletilir ve sağlayıcı desteklemiyorsa yok sayıldı olarak raporlanır. Yerleşik şeffaf arka plan desteği OpenAI'ye özeldir; diğer sağlayıcılar arka uçları bunu yayıyorsa PNG alfa bilgisini yine de koruyabilir.

## Desteklenen sağlayıcılar

| Sağlayıcı          | Varsayılan model                           | Düzenleme desteği                       | Kimlik doğrulama                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Evet (1 görüntü, iş akışı yapılandırmalı) | bulut için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY`    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Evet (1 görüntü)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Evet (modele özgü sınırlar)        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Evet                                | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | Evet (en fazla 5 giriş görüntüsü)         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Evet (yalnızca MAI-Image-2.5 modelleri)    | `AZURE_OPENAI_API_KEY` veya Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | Evet (konu referansı)            | `MINIMAX_API_KEY` veya MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Evet (en fazla 4 görüntü)               | `OPENAI_API_KEY` veya OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Evet (en fazla 5 giriş görüntüsü)         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Hayır                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Evet (en fazla 5 görüntü)               | `XAI_API_KEY`                                         |

Çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

```text
/tool image_generate action=list
```

Geçerli oturum için etkin görüntü oluşturma görevini incelemek üzere `action: "status"` kullanın:

```text
/tool image_generate action=status
```

## Sağlayıcı yetenekleri

| Yetenek            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Oluştur (azami sayı)  | İş akışı tanımlı   | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Düzenle / referans      | 1 görüntü (iş akışı) | 1 görüntü   | Flux: 1; GPT: 10; Krea stil referansları: 10; NB2: 14 | En fazla 5 görüntü | 1 görüntü           | 1 görüntü (konu ref) | En fazla 5 görüntü | -     | En fazla 5 görüntü |
| Boyut kontrolü          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | En fazla 4K       | -     | -              |
| En-boy oranı          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Çözünürlük (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Araç parametreleri

<ParamField path="prompt" type="string" required>
  Görüntü oluşturma istemi. `action: "generate"` için gereklidir.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Etkin oturum görevini incelemek için `"status"` veya çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `"list"` kullanın.
</ParamField>
<ParamField path="model" type="string">
  Sağlayıcı/model geçersiz kılması (örn. `openai/gpt-image-2`). Şeffaf OpenAI arka planları için `openai/gpt-image-1.5` kullanın.
</ParamField>
<ParamField path="image" type="string">
  Düzenleme modu için tek referans görüntü yolu veya URL'si.
</ParamField>
<ParamField path="images" type="string[]">
  Düzenleme modu veya stil referansı modelleri için birden fazla referans görüntü (paylaşılan araç üzerinden en fazla 10; sağlayıcıya özgü sınırlar yine de geçerlidir).
</ParamField>
<ParamField path="size" type="string">
  Boyut ipucu: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  En-boy oranı: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`. Sağlayıcılar modele özgü alt kümelerini doğrular.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Çözünürlük ipucu.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Sağlayıcı desteklediğinde kalite ipucu.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Sağlayıcı desteklediğinde çıktı biçimi ipucu.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Sağlayıcı desteklediğinde arka plan ipucu. Şeffaflık destekleyen sağlayıcılar için `transparent` değerini `outputFormat: "png"` veya `"webp"` ile kullanın.
</ParamField>
<ParamField path="count" type="number">Oluşturulacak görüntü sayısı (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  İsteğe bağlı sağlayıcı istek zaman aşımı, milisaniye cinsinden. Codex `image_generate` aracını dinamik araçlar üzerinden çağırdığında, bu çağrı başına değer yine de yapılandırılmış varsayılanı geçersiz kılar ve 600000 ms ile sınırlanır.
</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>
<ParamField path="openai" type="object">
  Yalnızca OpenAI ipuçları: `background`, `moderation`, `outputCompression` ve `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 yaratıcılık kontrolü. Varsayılan değer `medium`.
</ParamField>

<Note>
Tüm sağlayıcılar tüm parametreleri desteklemez. Bir yedek sağlayıcı, tam olarak istenen seçenek yerine yakın bir geometri seçeneğini desteklediğinde, OpenClaw göndermeden önce en yakın desteklenen boyuta, en-boy oranına veya çözünürlüğe yeniden eşler. Desteklenmeyen çıktı ipuçları, destek beyan etmeyen sağlayıcılar için kaldırılır ve araç sonucunda raporlanır. Araç sonuçları uygulanan ayarları raporlar; `details.normalization` istenenden uygulanana yapılan her türlü çeviriyi yakalar.
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

1. Araç çağrısından **`model` parametresi** (agent bir tane belirtirse).
2. Yapılandırmadan **`imageGenerationModel.primary`**.
3. Sırasıyla **`imageGenerationModel.fallbacks`**.
4. **Otomatik algılama** - yalnızca kimlik doğrulama destekli sağlayıcı varsayılanları:
   - önce geçerli varsayılan sağlayıcı;
   - kalan kayıtlı görüntü oluşturma sağlayıcıları, sağlayıcı kimliği sırasıyla.

Bir sağlayıcı başarısız olursa (kimlik doğrulama hatası, hız sınırı vb.),
sonraki yapılandırılmış aday otomatik olarak denenir. Tümü başarısız olursa,
hata her denemenin ayrıntılarını içerir.

<AccordionGroup>
  <Accordion title="Çağrı başına model geçersiz kılmaları kesindir">
    Çağrı başına `model` geçersiz kılması yalnızca o sağlayıcı/modeli dener ve
    yapılandırılmış primary/fallback ya da otomatik algılanan sağlayıcılarla
    devam etmez.
  </Accordion>
  <Accordion title="Otomatik algılama kimlik doğrulama farkındadır">
    Bir sağlayıcı varsayılanı, aday listesine yalnızca OpenClaw o sağlayıcıda
    gerçekten kimlik doğrulaması yapabildiğinde girer. Yalnızca açık
    `model`, `primary` ve `fallbacks` girdilerini kullanmak için
    `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.
  </Accordion>
  <Accordion title="Zaman aşımları">
    Yavaş görüntü backend'leri için `agents.defaults.imageGenerationModel.timeoutMs`
    ayarlayın. Çağrı başına `timeoutMs` araç parametresi yapılandırılmış
    varsayılanı geçersiz kılar; yapılandırılmış varsayılanlar da Plugin tarafından
    yazılmış sağlayıcı varsayılanlarını geçersiz kılar. Google ve OpenRouter
    tarafından barındırılan görüntü sağlayıcıları 180 saniyelik varsayılanlar
    kullanır; Microsoft Foundry MAI, xAI ve Azure OpenAI görüntü oluşturma
    600 saniye kullanır. Codex dinamik araç çağrıları 120 saniyelik
    `image_generate` köprü varsayılanını kullanır ve yapılandırıldığında aynı
    zaman aşımı bütçesine uyar; OpenClaw'ın 600000 ms dinamik araç köprüsü
    üst sınırıyla sınırlıdır.
  </Accordion>
  <Accordion title="Çalışma zamanında inceleme">
    Şu anda kayıtlı sağlayıcıları, varsayılan modellerini ve kimlik doğrulama
    ortam değişkeni ipuçlarını incelemek için `action: "list"` kullanın.
  </Accordion>
</AccordionGroup>

### Görüntü düzenleme

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI ve xAI referans görüntülerini düzenlemeyi destekler. fal üzerindeki
Krea 2 modelleri, düzenleme girdileri yerine stil referansları olarak aynı
`image` / `images` alanlarını kullanır. Bir referans görüntü yolu veya URL'si
geçirin:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google ve xAI, `images` parametresiyle 5 adede kadar
referans görüntüsünü destekler. fal, Flux image-to-image için 1 referans
görüntüsünü, GPT Image 2 düzenlemeleri için 10 adede kadarını, Krea 2 için
10 adede kadar stil referansını ve Nano Banana 2 düzenlemeleri için 14 adede
kadarını destekler. Microsoft Foundry, MiniMax ve ComfyUI 1 destekler.

## Sağlayıcı ayrıntılı incelemeleri

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (ve gpt-image-1.5)">
    OpenAI görüntü oluşturma varsayılanı `openai/gpt-image-2` şeklindedir.
    Bir `openai` OAuth profili yapılandırılmışsa, OpenClaw Codex abonelik
    sohbet modelleri tarafından kullanılan aynı OAuth profilini yeniden
    kullanır ve görüntü isteğini Codex Responses backend'i üzerinden gönderir.
    `https://chatgpt.com/backend-api` gibi eski Codex temel URL'leri,
    görüntü istekleri için `https://chatgpt.com/backend-api/codex` biçimine
    kanonikleştirilir. OpenClaw bu istek için sessizce `OPENAI_API_KEY`
    seçeneğine geri dönmez - doğrudan OpenAI Images API yönlendirmesini
    zorlamak için `models.providers.openai` değerini bir API anahtarı,
    özel temel URL veya Azure uç noktasıyla açıkça yapılandırın.

    `openai/gpt-image-1.5`, `openai/gpt-image-1` ve
    `openai/gpt-image-1-mini` modelleri hâlâ açıkça seçilebilir. Saydam
    arka planlı PNG/WebP çıktısı için `gpt-image-1.5` kullanın; mevcut
    `gpt-image-2` API'si `background: "transparent"` değerini reddeder.

    `gpt-image-2`, aynı `image_generate` aracı üzerinden hem metinden görüntü
    oluşturmayı hem de referans görüntü düzenlemeyi destekler. OpenClaw
    `prompt`, `count`, `size`, `quality`, `outputFormat` ve referans
    görüntülerini OpenAI'ye iletir. OpenAI `aspectRatio` veya `resolution`
    değerlerini doğrudan almaz; mümkün olduğunda OpenClaw bunları desteklenen
    bir `size` değerine eşler, aksi halde araç bunları yok sayılan geçersiz
    kılmalar olarak bildirir.

    OpenAI'ye özgü seçenekler `openai` nesnesinin altında bulunur:

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
    saydam çıktılar için `outputFormat` değerinin `png` veya `webp` olması
    ve saydamlık özellikli bir OpenAI görüntü modeli gerekir. OpenClaw,
    varsayılan `gpt-image-2` saydam arka plan isteklerini `gpt-image-1.5`
    modeline yönlendirir. `openai.outputCompression` JPEG/WebP çıktılarına
    uygulanır ve PNG çıktıları için yok sayılır.

    Üst düzey `background` ipucu sağlayıcıdan bağımsızdır ve OpenAI
    sağlayıcısı seçildiğinde şu anda aynı OpenAI `background` istek alanına
    eşlenir. Arka plan desteği bildirmeyen sağlayıcılar, desteklenmeyen
    parametreyi almak yerine bunu `ignoredOverrides` içinde döndürür.

    OpenAI görüntü oluşturmayı `api.openai.com` yerine bir Azure OpenAI
    dağıtımı üzerinden yönlendirmek için
    [Azure OpenAI uç noktaları](/tr/providers/openai#azure-openai-endpoints)
    bölümüne bakın.

  </Accordion>
  <Accordion title="Microsoft Foundry MAI görüntü modelleri">
    Microsoft Foundry görüntü oluşturma, `microsoft-foundry/` sağlayıcı
    öneki altında dağıtılmış MAI görüntü dağıtım adlarını kullanır. Sağlayıcı
    düzeyinde varsayılan model yoktur, çünkü MAI API'si dağıtım adınızı
    `model` alanında bekler:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    Sağlayıcı OpenAI Images API'yi değil, Microsoft Foundry'nin MAI API'sini kullanır:

    - Oluşturma uç noktası: `/mai/v1/images/generations`
    - Düzenleme uç noktası: `/mai/v1/images/edits`
    - Kimlik doğrulama: `AZURE_OPENAI_API_KEY` / sağlayıcı API anahtarı veya `az login` üzerinden Entra ID
    - Çıktı: bir PNG görüntüsü
    - Boyut: varsayılan `1024x1024`; genişlik ve yükseklik ayrı ayrı en az 768 px olmalı,
      toplam piksel sayısı en fazla 1.048.576 olmalıdır
    - Düzenlemeler: yalnızca `MAI-Image-2.5-Flash` ve `MAI-Image-2.5`
      dağıtımları tarafından desteklenen bir PNG veya JPEG referans görüntüsü

    Yalnızca istemli oluşturma, sadece Foundry uç noktası yapılandırılmış
    olarak özel bir dağıtım adı kullanabilir. Özel dağıtım adlarıyla yapılan
    düzenlemeler, OpenClaw'ın dağıtımın `MAI-Image-2.5-Flash` veya
    `MAI-Image-2.5` tarafından desteklendiğini doğrulayabilmesi için
    onboarding/model meta verisine ihtiyaç duyar.

    Geçerli MAI görüntü modelleri `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` ve `MAI-Image-2` şeklindedir. Kurulum ve sohbet modeli
    davranışı için [Microsoft Foundry Plugin](/tr/plugins/reference/microsoft-foundry)
    bölümüne bakın.

  </Accordion>
  <Accordion title="OpenRouter görüntü modelleri">
    OpenRouter görüntü oluşturma aynı `OPENROUTER_API_KEY` değerini kullanır ve
    OpenRouter'ın sohbet tamamlama görüntü API'si üzerinden yönlendirilir.
    OpenRouter görüntü modellerini `openrouter/` önekiyle seçin:

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

    OpenClaw `prompt`, `count`, referans görüntülerini ve Gemini uyumlu
    `aspectRatio` / `resolution` ipuçlarını OpenRouter'a iletir. Mevcut
    yerleşik OpenRouter görüntü modeli kısayolları arasında
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` ve `openai/gpt-5.4-image-2` bulunur.
    Yapılandırılmış Plugin'inizin ne sunduğunu görmek için `action: "list"`
    kullanın.

  </Accordion>
  <Accordion title="fal Krea 2">
    fal üzerindeki Krea 2 modelleri, Flux tarafından kullanılan genel
    `image_size` şeması yerine fal'ın yerel Krea şemasını kullanır.
    OpenClaw şunları gönderir:

    - en-boy oranı ipuçları için `aspect_ratio`
    - varsayılanı `medium` olan `creativity`
    - `image` veya `images` sağlandığında `image_style_references`

    Daha hızlı, ifadeli illüstrasyon için Krea 2 Medium'u; daha yavaş, daha
    ayrıntılı fotogerçekçi ve dokulu görünümler için Krea 2 Large'ı seçin:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 şu anda istek başına bir görüntü döndürür. Krea için `aspectRatio`
    tercih edin; OpenClaw `size` değerini en yakın desteklenen Krea en-boy
    oranına eşler ve Krea için `resolution` değerini sessizce atmak yerine
    reddeder. Yerel Krea yaratıcılık düzeyi istediğinizde `fal.creativity`
    kullanın:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax çift kimlik doğrulama">
    MiniMax görüntü oluşturma, iki yerleşik MiniMax kimlik doğrulama yolu
    üzerinden kullanılabilir:

    - API anahtarı kurulumları için `minimax/image-01`
    - OAuth kurulumları için `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Yerleşik xAI sağlayıcısı, yalnızca istemli istekler için
    `/v1/images/generations`, `image` veya `images` bulunduğunda
    `/v1/images/edits` kullanır.

    - Modeller: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Sayı: en fazla 4
    - Referanslar: bir `image` veya en fazla beş `images`
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Çözünürlükler: `1K`, `2K`
    - Çıktılar: OpenClaw tarafından yönetilen görüntü ekleri olarak döndürülür

    OpenClaw, bu denetimler paylaşılan sağlayıcılar arası `image_generate`
    sözleşmesinde var olana kadar xAI'ye özgü `quality`, `mask`, `user` veya
    ek yerel-only en-boy oranlarını özellikle açığa çıkarmaz.

  </Accordion>
</AccordionGroup>

## Örnekler

<Tabs>
  <Tab title="Oluştur (4K yatay)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Oluştur (saydam PNG)">
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
  <Tab title="Oluştur (OpenAI düşük kalite)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

Eşdeğer CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
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
  <Tab title="Düzenle (birden çok referans)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea stil referansları">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Aynı `--output-format`, `--background`, `--quality` ve
`--openai-moderation` bayrakları `openclaw infer image edit` üzerinde kullanılabilir;
`--openai-background`, OpenAI'a özgü bir takma ad olarak kalır. OpenAI dışındaki
paketle gelen sağlayıcılar bugün açık arka plan denetimi bildirmez, bu nedenle
`background: "transparent"` onlar için yok sayılmış olarak raporlanır.

## İlgili

- [Araçlara genel bakış](/tr/tools) - kullanılabilen tüm ajan araçları
- [ComfyUI](/tr/providers/comfy) - yerel ComfyUI ve Comfy Cloud iş akışı kurulumu
- [fal](/tr/providers/fal) - fal görüntü ve video sağlayıcısı kurulumu
- [Google (Gemini)](/tr/providers/google) - Gemini görüntü sağlayıcısı kurulumu
- [Microsoft Foundry Plugin](/tr/plugins/reference/microsoft-foundry) - Microsoft Foundry sohbet ve MAI görüntü kurulumu
- [MiniMax](/tr/providers/minimax) - MiniMax görüntü sağlayıcısı kurulumu
- [OpenAI](/tr/providers/openai) - OpenAI Images sağlayıcısı kurulumu
- [Vydra](/tr/providers/vydra) - Vydra görüntü, video ve konuşma kurulumu
- [xAI](/tr/providers/xai) - Grok görüntü, video, arama, kod yürütme ve TTS kurulumu
- [Yapılandırma referansı](/tr/gateway/config-agents#agent-defaults) - `imageGenerationModel` yapılandırması
- [Modeller](/tr/concepts/models) - model yapılandırması ve hata durumunda devretme
