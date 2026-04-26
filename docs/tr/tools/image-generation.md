---
read_when:
    - Aracı üzerinden görüntü oluşturma veya düzenleme
    - Görüntü üretimi sağlayıcılarını ve modellerini yapılandırma
    - '`image_generate` aracı parametrelerini anlama'
sidebarTitle: Image generation
summary: OpenAI, Google, fal, MiniMax, ComfyUI, OpenRouter, LiteLLM, xAI, Vydra genelinde `image_generate` aracılığıyla görüntü oluşturun ve düzenleyin
title: Görüntü üretimi
x-i18n:
    generated_at: "2026-04-26T11:42:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c57d32667eed3d6449628f6f663359ece089233ed0fde5258e2b2e4713192758
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` aracı, aracının yapılandırılmış sağlayıcılarınızı kullanarak
görüntüler oluşturmasına ve düzenlemesine olanak tanır. Üretilen görüntüler,
aracının yanıtında otomatik olarak medya ekleri olarak teslim edilir.

<Note>
Araç yalnızca en az bir görüntü üretim sağlayıcısı
kullanılabilir olduğunda görünür. Aracınızın araçlarında `image_generate`
görmüyorsanız, `agents.defaults.imageGenerationModel` yapılandırın, bir sağlayıcı API anahtarı ayarlayın
veya OpenAI Codex OAuth ile oturum açın.
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

    Codex OAuth aynı `openai/gpt-image-2` model başvurusunu kullanır. Bir
    `openai-codex` OAuth profili yapılandırıldığında, OpenClaw görüntü
    isteklerini önce `OPENAI_API_KEY` denemek yerine bu OAuth profili üzerinden yönlendirir.
    Açık `models.providers.openai` yapılandırması (API anahtarı,
    özel/Azure base URL) doğrudan OpenAI Images API
    yoluna yeniden katılmayı sağlar.

  </Step>
  <Step title="Aracıya sorun">
    _"Dost canlısı bir robot maskotunun görüntüsünü oluştur."_

    Aracı `image_generate` aracını otomatik olarak çağırır. Araç izin listesine alma
    gerekmez — bir sağlayıcı kullanılabilir olduğunda varsayılan olarak etkindir.

  </Step>
</Steps>

<Warning>
LocalAI gibi OpenAI uyumlu LAN uç noktaları için özel
`models.providers.openai.baseUrl` değerini koruyun ve
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ile açıkça etkinleştirin. Özel ve
dahili görüntü uç noktaları varsayılan olarak engellenmiş kalır.
</Warning>

## Yaygın yollar

| Hedef                                                | Model başvurusu                                    | Kimlik doğrulama                      |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------- |
| API faturalandırmasıyla OpenAI görüntü üretimi       | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                      |
| Codex abonelik kimlik doğrulamasıyla OpenAI görüntü üretimi | `openai/gpt-image-2`                         | OpenAI Codex OAuth                    |
| OpenAI şeffaf arka planlı PNG/WebP                   | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` veya OpenAI Codex OAuth |
| OpenRouter görüntü üretimi                           | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                  |
| LiteLLM görüntü üretimi                              | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                     |
| Google Gemini görüntü üretimi                        | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` veya `GOOGLE_API_KEY` |

Aynı `image_generate` aracı hem metinden görüntüye hem de referans görüntü
düzenlemeyi işler. Tek bir referans için `image`, birden fazla referans için `images` kullanın.
`quality`, `outputFormat` ve
`background` gibi sağlayıcı tarafından desteklenen çıktı ipuçları, kullanılabildiğinde iletilir ve bir
sağlayıcı bunları desteklemediğinde yok sayıldığı bildirilir. Paketlenmiş şeffaf arka plan desteği
OpenAI'ye özeldir; diğer sağlayıcılar arka uçları üretirse PNG alfa kanalını
yine de koruyabilir.

## Desteklenen sağlayıcılar

| Sağlayıcı | Varsayılan model                        | Düzenleme desteği                  | Kimlik doğrulama                                     |
| --------- | --------------------------------------- | ---------------------------------- | ---------------------------------------------------- |
| ComfyUI   | `workflow`                              | Evet (1 görüntü, workflow yapılandırmalı) | bulut için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| fal       | `fal-ai/flux/dev`                       | Evet                               | `FAL_KEY`                                            |
| Google    | `gemini-3.1-flash-image-preview`        | Evet                               | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`               |
| LiteLLM   | `gpt-image-2`                           | Evet (en fazla 5 giriş görüntüsü)  | `LITELLM_API_KEY`                                    |
| MiniMax   | `image-01`                              | Evet (özne referansı)              | `MINIMAX_API_KEY` veya MiniMax OAuth (`minimax-portal`) |
| OpenAI    | `gpt-image-2`                           | Evet (en fazla 4 görüntü)          | `OPENAI_API_KEY` veya OpenAI Codex OAuth             |
| OpenRouter| `google/gemini-3.1-flash-image-preview` | Evet (en fazla 5 giriş görüntüsü)  | `OPENROUTER_API_KEY`                                 |
| Vydra     | `grok-imagine`                          | Hayır                              | `VYDRA_API_KEY`                                      |
| xAI       | `grok-imagine-image`                    | Evet (en fazla 5 görüntü)          | `XAI_API_KEY`                                        |

Çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

```text
/tool image_generate action=list
```

## Sağlayıcı yetenekleri

| Yetenek              | ComfyUI              | fal               | Google         | MiniMax                 | OpenAI         | Vydra | xAI            |
| -------------------- | -------------------- | ----------------- | -------------- | ----------------------- | -------------- | ----- | -------------- |
| Üretim (en fazla adet) | Workflow tanımlı   | 4                 | 4              | 9                       | 4              | 1     | 4              |
| Düzenleme / referans | 1 görüntü (workflow) | 1 görüntü         | En fazla 5 görüntü | 1 görüntü (özne ref.) | En fazla 5 görüntü | —   | En fazla 5 görüntü |
| Boyut denetimi       | —                    | ✓                 | ✓              | —                       | 4K'ya kadar    | —     | —              |
| En-boy oranı         | —                    | ✓ (yalnızca üretim) | ✓            | ✓                       | —              | —     | ✓              |
| Çözünürlük (1K/2K/4K)| —                    | ✓                 | ✓              | —                       | —              | —     | 1K, 2K         |

## Araç parametreleri

<ParamField path="prompt" type="string" required>
  Görüntü üretim istemi. `action: "generate"` için gereklidir.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `"list"` kullanın.
</ParamField>
<ParamField path="model" type="string">
  Sağlayıcı/model geçersiz kılması (ör. `openai/gpt-image-2`). Şeffaf OpenAI arka planları için
  `openai/gpt-image-1.5` kullanın.
</ParamField>
<ParamField path="image" type="string">
  Düzenleme modu için tek referans görüntü yolu veya URL'si.
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
  Sağlayıcı desteklediğinde arka plan ipucu. Saydamlık destekleyen sağlayıcılarda
  saydamlık için `outputFormat: "png"` veya `"webp"` ile birlikte `transparent` kullanın.
</ParamField>
<ParamField path="count" type="number">Üretilecek görüntü sayısı (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Milisaniye cinsinden isteğe bağlı sağlayıcı istek zaman aşımı.</ParamField>
<ParamField path="filename" type="string">Çıktı dosya adı ipucu.</ParamField>
<ParamField path="openai" type="object">
  Yalnızca OpenAI ipuçları: `background`, `moderation`, `outputCompression` ve `user`.
</ParamField>

<Note>
Tüm sağlayıcılar tüm parametreleri desteklemez. Bir yedek sağlayıcı tam istenen seçenek yerine
yakın bir geometri seçeneğini desteklediğinde, OpenClaw gönderimden önce
en yakın desteklenen boyuta, en-boy oranına veya çözünürlüğe yeniden eşler.
Desteklenmeyen çıktı ipuçları, destek bildirmeyen sağlayıcılar için kaldırılır
ve araç sonucunda raporlanır. Araç sonuçları uygulanan
ayarları bildirir; `details.normalization`, istenenden uygulanana
çeviriyi yakalar.
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

1. Araç çağrısından gelen **`model` parametresi** (aracı bir tane belirtirse).
2. Yapılandırmadaki **`imageGenerationModel.primary`**.
3. Sırayla **`imageGenerationModel.fallbacks`**.
4. **Otomatik algılama** — yalnızca kimlik doğrulama destekli sağlayıcı varsayılanları:
   - önce geçerli varsayılan sağlayıcı;
   - ardından sağlayıcı kimliği sırasına göre kayıtlı kalan görüntü üretim sağlayıcıları.

Bir sağlayıcı başarısız olursa (kimlik doğrulama hatası, hız sınırı vb.), yapılandırılmış sonraki
aday otomatik olarak denenir. Hepsi başarısız olursa hata, her denemeden
ayrıntıları içerir.

<AccordionGroup>
  <Accordion title="Çağrı başına model geçersiz kılmaları kesindir">
    Çağrı başına `model` geçersiz kılması yalnızca o sağlayıcı/modeli dener ve
    yapılandırılmış birincil/yedek veya otomatik algılanan sağlayıcılara devam etmez.
  </Accordion>
  <Accordion title="Otomatik algılama kimlik doğrulama farkındalıklıdır">
    Bir sağlayıcı varsayılanı, yalnızca OpenClaw o sağlayıcıya gerçekten
    kimlik doğrulama yapabildiğinde aday listesine girer. Yalnızca
    açık `model`, `primary` ve `fallbacks` girdilerini kullanmak için
    `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.
  </Accordion>
  <Accordion title="Zaman aşımları">
    Yavaş görüntü arka uçları için `agents.defaults.imageGenerationModel.timeoutMs` ayarlayın.
    Çağrı başına `timeoutMs` araç parametresi, yapılandırılmış
    varsayılanı geçersiz kılar.
  </Accordion>
  <Accordion title="Çalışma zamanında inceleyin">
    Geçerli olarak kayıtlı sağlayıcıları,
    bunların varsayılan modellerini ve kimlik doğrulama ortam değişkeni ipuçlarını incelemek için `action: "list"` kullanın.
  </Accordion>
</AccordionGroup>

### Görüntü düzenleme

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI ve xAI, referans
görüntü düzenlemeyi destekler. Bir referans görüntü yolu veya URL'si geçirin:

```text
"Bu fotoğrafın suluboya sürümünü oluştur" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google ve xAI,
`images` parametresi aracılığıyla en fazla 5 referans görüntüyü destekler. fal, MiniMax ve ComfyUI 1 tane destekler.

## Sağlayıcı ayrıntılı incelemeleri

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (ve gpt-image-1.5)">
    OpenAI görüntü üretimi varsayılan olarak `openai/gpt-image-2` kullanır. Bir
    `openai-codex` OAuth profili yapılandırılmışsa, OpenClaw aynı
    Codex abonelik sohbet modelleri tarafından kullanılan OAuth profilini yeniden kullanır ve
    görüntü isteğini Codex Responses arka ucu üzerinden gönderir. Eski Codex base
    URL'leri, örneğin `https://chatgpt.com/backend-api`, görüntü istekleri için
    `https://chatgpt.com/backend-api/codex` biçimine kanonikleştirilir. OpenClaw
    bu istek için **sessizce** `OPENAI_API_KEY` değerine geri düşmez —
    doğrudan OpenAI Images API yönlendirmesini zorlamak için
    `models.providers.openai` öğesini bir API anahtarı, özel base URL
    veya Azure uç noktasıyla açıkça yapılandırın.

    `openai/gpt-image-1.5`, `openai/gpt-image-1` ve
    `openai/gpt-image-1-mini` modelleri hâlâ açıkça seçilebilir. Şeffaf arka planlı PNG/WebP çıktısı için
    `gpt-image-1.5` kullanın; mevcut
    `gpt-image-2` API'si `background: "transparent"` değerini reddeder.

    `gpt-image-2`, aynı `image_generate` aracı üzerinden hem metinden görüntü üretimini hem de
    referans görüntü düzenlemeyi destekler.
    OpenClaw, `prompt`, `count`, `size`, `quality`, `outputFormat`
    ve referans görüntüleri OpenAI'ye iletir. OpenAI doğrudan
    `aspectRatio` veya `resolution` almaz; mümkün olduğunda OpenClaw bunları
    desteklenen bir `size` değerine eşler, aksi halde araç bunları
    yok sayılan geçersiz kılmalar olarak bildirir.

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

    `openai.background`, `transparent`, `opaque` veya `auto` kabul eder;
    şeffaf çıktılar için `outputFormat` değerinin `png` veya `webp` olması ve
    şeffaflığı destekleyen bir OpenAI görüntü modeli gerekir. OpenClaw, varsayılan
    `gpt-image-2` şeffaf arka plan isteklerini `gpt-image-1.5` modeline yönlendirir.
    `openai.outputCompression`, JPEG/WebP çıktıları için geçerlidir.

    Üst düzey `background` ipucu sağlayıcıdan bağımsızdır ve şu anda OpenAI sağlayıcısı
    seçildiğinde aynı OpenAI `background` istek alanına eşlenir.
    Arka plan desteği bildirmeyen sağlayıcılar, desteklenmeyen parametreyi almak yerine
    bunu `ignoredOverrides` içinde döndürür.

    OpenAI görüntü üretimini `api.openai.com` yerine bir Azure OpenAI dağıtımı üzerinden yönlendirmek için
    bkz.
    [Azure OpenAI uç noktaları](/tr/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="OpenRouter görüntü modelleri">
    OpenRouter görüntü üretimi aynı `OPENROUTER_API_KEY` anahtarını kullanır ve
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

    OpenClaw, `prompt`, `count`, referans görüntüleri ve
    Gemini uyumlu `aspectRatio` / `resolution` ipuçlarını OpenRouter'a iletir.
    Geçerli yerleşik OpenRouter görüntü modeli kısayolları arasında
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` ve `openai/gpt-5.4-image-2` bulunur.
    Yapılandırılmış Plugin'in neleri açığa çıkardığını görmek için
    `action: "list"` kullanın.

  </Accordion>
  <Accordion title="MiniMax çift kimlik doğrulama">
    MiniMax görüntü üretimi, her iki paketlenmiş MiniMax
    kimlik doğrulama yolu üzerinden de kullanılabilir:

    - API anahtarı kurulumları için `minimax/image-01`
    - OAuth kurulumları için `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Paketlenmiş xAI sağlayıcısı, yalnızca istem içeren
    istekler için `/v1/images/generations`, `image` veya `images` mevcut olduğunda ise `/v1/images/edits` kullanır.

    - Modeller: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Adet: en fazla 4
    - Referanslar: bir `image` veya en fazla beş `images`
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Çözünürlükler: `1K`, `2K`
    - Çıktılar: OpenClaw tarafından yönetilen görüntü ekleri olarak döndürülür

    OpenClaw, xAI'ye özgü `quality`, `mask`,
    `user` veya ek yalnızca-yerel en-boy oranlarını, bu denetimler
    paylaşılan sağlayıcılar arası `image_generate` sözleşmesinde var olana kadar kasıtlı olarak açığa çıkarmaz.

  </Accordion>
</AccordionGroup>

## Örnekler

<Tabs>
  <Tab title="Üretim (4K yatay)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw görüntü üretimi için temiz bir editoryal poster" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Üretim (şeffaf PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="Şeffaf arka planda basit kırmızı bir daire çıkartması" outputFormat=png background=transparent
```

Eşdeğer CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Şeffaf arka planda basit kırmızı bir daire çıkartması" \
  --json
```

  </Tab>
  <Tab title="Üretim (iki kare)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Sakin bir üretkenlik uygulaması simgesi için iki görsel yön" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Düzenleme (tek referans)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Özneyi koru, arka planı aydınlık bir stüdyo düzeniyle değiştir" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Düzenleme (birden çok referans)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="İlk görüntüdeki karakter kimliğini ikinci görüntüdeki renk paletiyle birleştir" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Aynı `--output-format` ve `--background` bayrakları
`openclaw infer image edit` üzerinde de kullanılabilir; `--openai-background`
OpenAI'ye özgü bir takma ad olarak kalır. OpenAI dışındaki paketlenmiş sağlayıcılar bugün
açık arka plan denetimi bildirmez, bu yüzden `background: "transparent"` onlar için
yok sayıldı olarak bildirilir.

## İlgili

- [Araçlara genel bakış](/tr/tools) — kullanılabilir tüm aracı araçları
- [ComfyUI](/tr/providers/comfy) — yerel ComfyUI ve Comfy Cloud workflow kurulumu
- [fal](/tr/providers/fal) — fal görüntü ve video sağlayıcı kurulumu
- [Google (Gemini)](/tr/providers/google) — Gemini görüntü sağlayıcı kurulumu
- [MiniMax](/tr/providers/minimax) — MiniMax görüntü sağlayıcı kurulumu
- [OpenAI](/tr/providers/openai) — OpenAI Images sağlayıcı kurulumu
- [Vydra](/tr/providers/vydra) — Vydra görüntü, video ve konuşma kurulumu
- [xAI](/tr/providers/xai) — Grok görüntü, video, arama, kod yürütme ve TTS kurulumu
- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) — `imageGenerationModel` yapılandırması
- [Modeller](/tr/concepts/models) — model yapılandırması ve failover
