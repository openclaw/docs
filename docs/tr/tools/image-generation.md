---
read_when:
    - Aracı aracılığıyla görüntü oluşturma veya düzenleme
    - Görsel oluşturma sağlayıcılarını ve modellerini yapılandırma
    - image_generate aracı parametrelerini anlama
sidebarTitle: Image generation
summary: OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI ve Vydra genelinde image_generate aracılığıyla görseller oluşturun ve düzenleyin
title: Görsel oluşturma
x-i18n:
    generated_at: "2026-07-12T12:49:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` aracı, yapılandırılmış sağlayıcılarınız üzerinden görüntüler oluşturur ve düzenler. Sohbet oturumlarında eşzamansız çalışır: OpenClaw bir arka plan görevi kaydeder, görev kimliğini hemen döndürür ve sağlayıcı işlemi tamamladığında ajanı uyandırır. Tamamlama ajanı, oturumun normal görünür yanıt modunu izler: yapılandırılmışsa nihai yanıt otomatik olarak iletilir; oturum mesaj aracını gerektiriyorsa `message(action="send")` kullanılır. İstekte bulunan oturum etkin değilse veya etkin uyandırma işlemi başarısız olursa OpenClaw, sonucun kaybolmaması için oluşturulan görüntüleri içeren eşgüçlü bir doğrudan yedek gönderim yapar.

<Note>
Araç yalnızca en az bir görüntü oluşturma sağlayıcısı kullanılabilir olduğunda görünür. Ajanınızın araçları arasında `image_generate` seçeneğini görmüyorsanız `agents.defaults.imageGenerationModel` ayarını yapılandırın, bir sağlayıcı API anahtarı ayarlayın veya OpenAI ChatGPT/Codex OAuth ile oturum açın.
</Note>

## Hızlı başlangıç

<Steps>
  <Step title="Kimlik doğrulamayı yapılandırın">
    En az bir sağlayıcı için bir API anahtarı ayarlayın (örneğin `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) veya OpenAI Codex OAuth ile oturum açın.
  </Step>
  <Step title="Varsayılan model seçin (isteğe bağlı)">
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

    ChatGPT/Codex OAuth, aynı `openai/gpt-image-2` model başvurusunu kullanır. Bir
    `openai` OAuth profili yapılandırıldığında OpenClaw, görüntü isteklerini önce
    `OPENAI_API_KEY` kullanmayı denemek yerine bu OAuth profili üzerinden yönlendirir.
    Açık `models.providers.openai` yapılandırması (API anahtarı, özel/Azure temel URL'si),
    doğrudan OpenAI Images API rotasını yeniden etkinleştirir.

  </Step>
  <Step title="Ajandan isteyin">
    _"Dost canlısı bir robot maskotunun görüntüsünü oluştur."_

    Ajan otomatik olarak `image_generate` çağrısı yapar. Araç izin listesine
    eklemek gerekmez; bir sağlayıcı kullanılabilir olduğunda varsayılan olarak
    etkinleştirilir. Araç bir arka plan görevi kimliği döndürür, ardından tamamlama
    ajanı hazır olduğunda oluşturulan eki `message` aracı üzerinden gönderir.

  </Step>
</Steps>

<Warning>
LocalAI gibi OpenAI uyumlu LAN uç noktaları için özel
`models.providers.openai.baseUrl` değerini koruyun ve
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ile açıkça etkinleştirin.
Özel ve dahili görüntü uç noktaları varsayılan olarak engellenmeye devam eder.
</Warning>

## Yaygın rotalar

| Amaç                                                 | Model başvurusu                                     | Kimlik doğrulama                       |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API faturalandırmasıyla OpenAI görüntü oluşturma     | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex abonelik kimlik doğrulamasıyla OpenAI görüntü oluşturma | `openai/gpt-image-2`                        | OpenAI ChatGPT/Codex OAuth             |
| OpenAI şeffaf arka planlı PNG/WebP                   | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` veya OpenAI Codex OAuth |
| DeepInfra görüntü oluşturma                          | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 ifadeli/stil yönlendirmeli oluşturma      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter görüntü oluşturma                         | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM görüntü oluşturma                            | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI görüntü oluşturma              | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` veya Entra ID   |
| Google Gemini görüntü oluşturma                      | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` veya `GOOGLE_API_KEY` |

Aynı araç, metinden görüntü oluşturmayı ve referans görüntü düzenlemeyi işler. Tek bir referans için `image`, birden fazla referans için `images` kullanın. fal üzerindeki Krea 2 modellerinde bu referanslar, düzenleme girdileri yerine stil referansları olarak gönderilir. `quality`, `outputFormat` ve `background` gibi sağlayıcı tarafından desteklenen çıktı ipuçları kullanılabilir olduğunda iletilir; sağlayıcı destek bildirmiyorsa yok sayıldığı raporlanır. Paketle birlikte gelen şeffaf arka plan desteği OpenAI'a özeldir; diğer sağlayıcılar da arka uçları bu biçimde çıktı veriyorsa PNG alfa kanalını koruyabilir.

## Desteklenen sağlayıcılar

| Sağlayıcı         | Varsayılan model                        | Düzenleme desteği                          | Kimlik doğrulama                                        |
| ----------------- | --------------------------------------- | ------------------------------------------ | ------------------------------------------------------- |
| ComfyUI           | `workflow`                              | Evet (1 görüntü, iş akışında yapılandırılır) | Bulut için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Evet (1 görüntü)                           | `DEEPINFRA_API_KEY`                                     |
| fal               | `fal-ai/flux/dev`                       | Evet (modele özgü sınırlar)                | `FAL_KEY`                                               |
| Google            | `gemini-3.1-flash-image-preview`        | Evet (en fazla 5 görüntü)                  | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | Evet (en fazla 5 girdi görüntüsü)          | `LITELLM_API_KEY`                                       |
| Microsoft Foundry | `<deployment-name>`                     | Evet (yalnızca MAI-Image-2.5 modelleri)    | `AZURE_OPENAI_API_KEY` veya Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | Evet (konu referansı)                      | `MINIMAX_API_KEY` veya MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Evet (en fazla 5 görüntü)                  | `OPENAI_API_KEY` veya OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Evet (en fazla 5 girdi görüntüsü)          | `OPENROUTER_API_KEY`                                    |
| Vydra             | `grok-imagine`                          | Hayır                                      | `VYDRA_API_KEY`                                         |
| xAI               | `grok-imagine-image`                    | Evet (en fazla 3 görüntü)                  | `XAI_API_KEY`                                           |

Çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

```text
/tool image_generate action=list
```

Geçerli oturumdaki etkin görüntü oluşturma görevini incelemek için `action: "status"` kullanın:

```text
/tool image_generate action=status
```

## Sağlayıcı yetenekleri

| Yetenek                | ComfyUI                  | DeepInfra | fal                                            | Google               | Microsoft Foundry | MiniMax                    | OpenAI               | Vydra | xAI                  |
| ---------------------- | ------------------------ | --------- | ---------------------------------------------- | -------------------- | ----------------- | -------------------------- | -------------------- | ----- | -------------------- |
| Oluşturma (azami sayı) | 1                        | 4         | 4                                              | 4                    | 1                 | 9                          | 4                    | 1     | 4                    |
| Düzenleme / referans   | 1 görüntü (iş akışı)     | 1 görüntü | Flux: 1; GPT: 10; Krea stil ref.: 10; NB2: 14 | En fazla 5 görüntü   | 1 görüntü         | 1 görüntü (konu ref.)      | En fazla 5 görüntü   | -     | En fazla 3 görüntü   |
| Boyut denetimi         | -                        | ✓         | ✓                                              | ✓                    | ✓                 | -                          | En fazla 4K          | -     | -                    |
| En-boy oranı           | -                        | -         | ✓                                              | ✓                    | -                 | ✓                          | -                    | -     | ✓                    |
| Çözünürlük (1K/2K/4K) | -                        | -         | ✓                                              | ✓                    | -                 | -                          | -                    | -     | 1K, 2K               |

## Araç parametreleri

<ParamField path="prompt" type="string" required>
  Görüntü oluşturma istemi. `action: "generate"` için zorunludur.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Etkin oturum görevini incelemek için `"status"`, çalışma zamanında kullanılabilir
  sağlayıcıları ve modelleri incelemek için `"list"` kullanın.
</ParamField>
<ParamField path="model" type="string">
  Sağlayıcı/model geçersiz kılma değeri (ör. `openai/gpt-image-2`). Şeffaf OpenAI
  arka planları için `openai/gpt-image-1.5` kullanın.
</ParamField>
<ParamField path="image" type="string">
  Düzenleme modu için tek referans görüntü yolu veya URL'si.
</ParamField>
<ParamField path="images" type="string[]">
  Düzenleme modu veya stil referansı modelleri için birden fazla referans görüntü
  (paylaşılan araç üzerinden en fazla 14; sağlayıcıya özgü sınırlar geçerliliğini korur).
</ParamField>
<ParamField path="size" type="string">
  Boyut ipucu: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  En-boy oranı: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. Sağlayıcılar, modele özgü alt kümelerini doğrular.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Çözünürlük ipucu.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Sağlayıcı desteklediğinde kalite ipucu.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Sağlayıcı desteklediğinde çıktı biçimi ipucu.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Sağlayıcı desteklediğinde arka plan ipucu. Şeffaflık özellikli sağlayıcılarda
  `outputFormat: "png"` veya `"webp"` ile `transparent` kullanın.
</ParamField>
<ParamField path="count" type="number">Oluşturulacak görüntü sayısı (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Milisaniye cinsinden isteğe bağlı sağlayıcı isteği zaman aşımı. Codex,
  `image_generate` aracını dinamik araçlar üzerinden çağırdığında bu çağrı başına
  değer, yapılandırılmış varsayılanı yine geçersiz kılar ve en fazla 600000 ms olabilir.
</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>
<ParamField path="openai" type="object">
  Yalnızca OpenAI'a özgü ipuçları: `background`, `moderation`, `outputCompression` ve `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 yaratıcılık denetimi. Varsayılan değer `medium` olur.
</ParamField>

<Note>
Tüm sağlayıcılar bütün parametreleri desteklemez. Bir yedek sağlayıcı, tam olarak
istenen seçenek yerine yakın bir geometri seçeneğini desteklediğinde OpenClaw,
göndermeden önce isteği desteklenen en yakın boyuta, en-boy oranına veya çözünürlüğe
eşler. Destek bildirmeyen sağlayıcılar için desteklenmeyen çıktı ipuçları kaldırılır
ve araç sonucunda raporlanır. Araç sonuçları uygulanan ayarları bildirir;
`details.normalization`, istenen değerlerden uygulanan değerlere yapılan tüm
dönüşümleri içerir.
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

1. Araç çağrısındaki **`model` parametresi** (aracı çağıran agent bir model belirtirse).
2. Yapılandırmadaki **`imageGenerationModel.primary`**.
3. Sırasıyla **`imageGenerationModel.fallbacks`**.
4. **Otomatik algılama** - yalnızca kimlik doğrulama destekli sağlayıcı varsayılanları:
   - önce mevcut varsayılan sağlayıcı;
   - ardından sağlayıcı kimliğine göre sıralanmış diğer kayıtlı görüntü oluşturma sağlayıcıları.

Bir sağlayıcı başarısız olursa (kimlik doğrulama hatası, hız sınırı vb.), yapılandırılmış
bir sonraki aday otomatik olarak denenir. Tümü başarısız olursa hata, her
denemenin ayrıntılarını içerir.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Çağrı başına `model` geçersiz kılması yalnızca belirtilen sağlayıcıyı/modeli dener;
    yapılandırılmış birincil/yedek veya otomatik algılanan sağlayıcılarla devam etmez.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Bir sağlayıcı varsayılanı, yalnızca OpenClaw gerçekten o sağlayıcıda
    kimlik doğrulaması yapabiliyorsa aday listesine girer. Yalnızca açıkça
    belirtilmiş `model`, `primary` ve `fallbacks` girdilerini kullanmak için
    `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarını yapın.
  </Accordion>
  <Accordion title="Timeouts">
    Yavaş görüntü arka uçları için `agents.defaults.imageGenerationModel.timeoutMs`
    ayarını yapın. Çağrı başına `timeoutMs` araç parametresi yapılandırılmış
    varsayılanı, yapılandırılmış varsayılanlar ise Plugin tarafından tanımlanan
    sağlayıcı varsayılanlarını geçersiz kılar. Google ve OpenRouter tarafından
    barındırılan görüntü sağlayıcıları varsayılan olarak 180 saniye kullanır;
    Microsoft Foundry MAI, xAI ve Azure OpenAI görüntü oluşturma ise 600 saniye
    kullanır. Codex dinamik araç çağrıları, 120 saniyelik varsayılan bir
    `image_generate` köprüsü kullanır ve yapılandırıldığında aynı zaman aşımı
    bütçesine uyar; bu süre OpenClaw'ın 600000 ms'lik dinamik araç köprüsü
    üst sınırıyla sınırlıdır.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Şu anda kayıtlı sağlayıcıları, varsayılan modellerini ve kimlik doğrulama
    ortam değişkeni ipuçlarını incelemek için `action: "list"` kullanın.
  </Accordion>
</AccordionGroup>

### Görüntü düzenleme

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI ve xAI, referans görüntülerin düzenlenmesini destekler. fal üzerindeki
Krea 2 modelleri, düzenleme girdileri yerine stil referansları olarak aynı
`image` / `images` alanlarını kullanır. Bir referans görüntü yolu veya URL'si
iletin:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter ve Google, `images` parametresiyle en fazla 5 referans
görüntüyü; xAI ise en fazla 3 referans görüntüyü destekler. fal; Flux
görüntüden görüntüye dönüştürme için 1, GPT Image 2 düzenlemeleri için en fazla
10, Krea 2 için en fazla 10 stil referansı ve Nano Banana 2 düzenlemeleri için
en fazla 14 referans görüntüyü destekler. Microsoft Foundry, MiniMax ve ComfyUI
1 referans görüntüyü destekler.

## Sağlayıcıların ayrıntılı incelemesi

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    OpenAI görüntü oluşturma varsayılan olarak `openai/gpt-image-2` kullanır.
    Bir `openai` OAuth profili yapılandırılmışsa OpenClaw, Codex abonelik
    sohbet modellerinin kullandığı OAuth profilini yeniden kullanır ve görüntü
    isteğini Codex Responses arka ucu üzerinden gönderir.
    `https://chatgpt.com/backend-api` gibi eski Codex temel URL'leri, görüntü
    istekleri için `https://chatgpt.com/backend-api/codex` biçiminde
    standartlaştırılır. OpenClaw bu istek için sessizce `OPENAI_API_KEY`
    kullanımına geri dönmez; doğrudan OpenAI Images API yönlendirmesini
    zorlamak için `models.providers.openai` seçeneğini bir API anahtarı, özel
    temel URL veya Azure uç noktasıyla açıkça yapılandırın.

    `openai/gpt-image-1.5`, `openai/gpt-image-1` ve
    `openai/gpt-image-1-mini` modelleri yine açıkça seçilebilir. Şeffaf arka
    planlı PNG/WebP çıktısı için `gpt-image-1.5` kullanın; mevcut
    `gpt-image-2` API'si `background: "transparent"` değerini reddeder.

    `gpt-image-2`, aynı `image_generate` aracı üzerinden hem metinden görüntü
    oluşturmayı hem de referans görüntü düzenlemeyi destekler. OpenClaw;
    `prompt`, `count`, `size`, `quality`, `outputFormat` ve referans
    görüntüleri OpenAI'a iletir. OpenAI, `aspectRatio` veya `resolution`
    değerlerini doğrudan almaz; mümkün olduğunda OpenClaw bunları desteklenen
    bir `size` değerine eşler, aksi takdirde araç bunları yok sayılan geçersiz
    kılmalar olarak bildirir.

    OpenAI'a özgü seçenekler `openai` nesnesi altında bulunur:

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

    `openai.background`; `transparent`, `opaque` veya `auto` değerlerini kabul
    eder. Şeffaf çıktılar için `outputFormat` değerinin `png` ya da `webp`
    olması ve şeffaflığı destekleyen bir OpenAI görüntü modeli kullanılması
    gerekir. OpenClaw, varsayılan `gpt-image-2` şeffaf arka plan isteklerini
    `gpt-image-1.5` modeline yönlendirir. `openai.outputCompression` JPEG/WebP
    çıktılarına uygulanır ve PNG çıktılarında yok sayılır.

    Üst düzey `background` ipucu sağlayıcıdan bağımsızdır ve OpenAI sağlayıcısı
    seçildiğinde şu anda aynı OpenAI `background` istek alanına eşlenir. Arka
    plan desteği bildirmeyen sağlayıcılar, desteklenmeyen parametreyi almak
    yerine bunu `ignoredOverrides` içinde döndürür.

    OpenAI görüntü oluşturmayı `api.openai.com` yerine bir Azure OpenAI
    dağıtımı üzerinden yönlendirmek için
    [Azure OpenAI uç noktaları](/tr/providers/openai#azure-openai-endpoints)
    bölümüne bakın.

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    Microsoft Foundry görüntü oluşturma, `microsoft-foundry/` sağlayıcı öneki
    altında dağıtılmış MAI görüntü dağıtımı adlarını kullanır. MAI API,
    dağıtım adınızı `model` alanında beklediğinden sağlayıcı düzeyinde
    varsayılan bir model yoktur:

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

    Sağlayıcı, OpenAI Images API'yi değil Microsoft Foundry'nin MAI API'sini
    kullanır:

    - Oluşturma uç noktası: `/mai/v1/images/generations`
    - Düzenleme uç noktası: `/mai/v1/images/edits`
    - Kimlik doğrulama: `AZURE_OPENAI_API_KEY` / sağlayıcı API anahtarı veya `az login` üzerinden Entra ID
    - Çıktı: bir PNG görüntüsü
    - Boyut: varsayılan `1024x1024`; genişlik ve yüksekliğin her biri en az 768 px,
      toplam piksel sayısı ise en fazla 1.048.576 olmalıdır
    - Düzenlemeler: bir PNG veya JPEG referans görüntüsü; yalnızca
      `MAI-Image-2.5-Flash` ve `MAI-Image-2.5` dağıtımları tarafından desteklenir

    Yalnızca istem kullanan oluşturma işlemi, sadece Foundry uç noktası
    yapılandırılarak özel bir dağıtım adı kullanabilir. Özel dağıtım adlarıyla
    yapılan düzenlemelerde OpenClaw'ın dağıtımın `MAI-Image-2.5-Flash` veya
    `MAI-Image-2.5` tarafından desteklendiğini doğrulayabilmesi için ilk
    kullanım/model meta verileri gerekir.

    Mevcut MAI görüntü modelleri `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` ve `MAI-Image-2` modelleridir. Kurulum ve sohbet modeli
    davranışı için [Microsoft Foundry Plugin](/tr/plugins/reference/microsoft-foundry)
    bölümüne bakın.

  </Accordion>
  <Accordion title="OpenRouter image models">
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

    OpenClaw; `prompt`, `count`, referans görüntüleri ve Gemini uyumlu
    `aspectRatio` / `resolution` ipuçlarını OpenRouter'a iletir. Mevcut yerleşik
    OpenRouter görüntü modeli kısayolları arasında
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` ve `openai/gpt-5.4-image-2` bulunur.
    Yapılandırılmış Plugin'inizin neleri sunduğunu görmek için
    `action: "list"` kullanın.

  </Accordion>
  <Accordion title="fal Krea 2">
    fal üzerindeki Krea 2 modelleri, Flux'ın kullandığı genel `image_size`
    şeması yerine fal'ın yerel Krea şemasını kullanır. OpenClaw şunları
    gönderir:

    - En-boy oranı ipuçları için `aspect_ratio`
    - Varsayılan değeri `medium` olan `creativity`
    - `image` veya `images` sağlandığında `image_style_references`

    Daha hızlı ve etkileyici illüstrasyonlar için Krea 2 Medium'u; daha yavaş,
    daha ayrıntılı, fotogerçekçi ve dokulu görünümler için Krea 2 Large'ı seçin:

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
    kullanmayı tercih edin; OpenClaw, `size` değerini desteklenen en yakın Krea
    en-boy oranına eşler ve `resolution` değerini yok saymak yerine Krea için
    reddeder. Yerel bir Krea yaratıcılık düzeyi istediğinizde
    `fal.creativity` kullanın:

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
  <Accordion title="MiniMax dual-auth">
    MiniMax görüntü oluşturma, paketle birlikte gelen her iki MiniMax kimlik
    doğrulama yolu üzerinden kullanılabilir:

    - API anahtarı kurulumları için `minimax/image-01`
    - OAuth kurulumları için `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Paketle birlikte gelen xAI sağlayıcısı, yalnızca istem içeren istekler için
    `/v1/images/generations`; `image` veya `images` mevcut olduğunda ise
    `/v1/images/edits` kullanır.

    - Modeller: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Adet: en fazla 4
    - Referanslar: bir `image` veya en fazla üç `images`
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Çözünürlükler: `1K`, `2K`
    - Çıktılar: OpenClaw tarafından yönetilen görüntü ekleri olarak döndürülür

    OpenClaw; bu denetimler sağlayıcılar arası ortak `image_generate`
    sözleşmesinde bulunana kadar xAI'a özgü `quality`, `mask`, `user` veya
    `auto` en-boy oranını bilinçli olarak kullanıma sunmaz.

  </Accordion>
</AccordionGroup>

## Örnekler

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
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
  <Tab title="Generate (OpenAI low quality)">
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
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Sakin bir üretkenlik uygulaması simgesi için iki görsel yön" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Düzenle (tek referans)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Konuyu koru, arka planı aydınlık bir stüdyo düzeniyle değiştir" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Düzenle (birden çok referans)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="İlk görüntüdeki karakter kimliğini ikincideki renk paletiyle birleştir" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea stil referansları">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Bu renk paletini ve baskı dokusunu kullanan etkileyici bir editoryal portre" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Aynı `--output-format`, `--background`, `--quality` ve
`--openai-moderation` bayrakları `openclaw infer image edit` komutunda da kullanılabilir;
`--openai-background`, OpenAI'a özgü bir diğer ad olarak kalır. OpenAI dışındaki
paketle gelen sağlayıcılar şu anda açık bir arka plan denetimi tanımlamadığından,
`background: "transparent"` onlar için yok sayıldı olarak bildirilir.

## İlgili

- [Araçlara genel bakış](/tr/tools) - kullanılabilir tüm aracı araçları
- [ComfyUI](/tr/providers/comfy) - yerel ComfyUI ve Comfy Cloud iş akışı kurulumu
- [fal](/tr/providers/fal) - fal görüntü ve video sağlayıcısı kurulumu
- [Google (Gemini)](/tr/providers/google) - Gemini görüntü sağlayıcısı kurulumu
- [Microsoft Foundry plugini](/tr/plugins/reference/microsoft-foundry) - Microsoft Foundry sohbet ve MAI görüntü kurulumu
- [MiniMax](/tr/providers/minimax) - MiniMax görüntü sağlayıcısı kurulumu
- [OpenAI](/tr/providers/openai) - OpenAI Images sağlayıcısı kurulumu
- [Vydra](/tr/providers/vydra) - Vydra görüntü, video ve konuşma kurulumu
- [xAI](/tr/providers/xai) - Grok görüntü, video, arama, kod yürütme ve TTS kurulumu
- [Yapılandırma referansı](/tr/gateway/config-agents#agent-defaults) - `imageGenerationModel` yapılandırması
- [Modeller](/tr/concepts/models) - model yapılandırması ve yük devretme
