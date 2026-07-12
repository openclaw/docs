---
read_when:
    - OpenClaw ile Hugging Face Inference'ı kullanmak istiyorsunuz
    - HF token ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Hugging Face Inference kurulumu (kimlik doğrulama + model seçimi)
title: Hugging Face (çıkarım)
x-i18n:
    generated_at: "2026-07-12T12:42:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers), tek bir belirteç altında barındırılan birçok modelin (DeepSeek, Llama ve daha fazlası) önünde OpenAI uyumlu bir sohbet tamamlama yönlendiricisi sunar. OpenClaw yalnızca **sohbet tamamlama uç noktasıyla** iletişim kurar; metinden görsele dönüştürme, gömmeler veya konuşma için doğrudan [HF çıkarım istemcilerini](https://huggingface.co/docs/api-inference/quicktour) kullanın.

| Özellik                 | Değer                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Sağlayıcı kimliği       | `huggingface`                                                                                                               |
| Plugin                  | paketle birlikte gelir (varsayılan olarak etkindir, kurulum adımı yoktur)                                                    |
| Kimlik doğrulama ortam değişkeni | `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN` (ayrıntılı izinlere sahip belirteç)                                        |
| API                     | OpenAI uyumlu (`https://router.huggingface.co/v1`)                                                                          |
| Faturalandırma          | Tek HF belirteci; [fiyatlandırma](https://huggingface.co/docs/inference-providers/pricing), ücretsiz katmanla birlikte sağlayıcı ücretlerini izler |

## Başlarken

<Steps>
  <Step title="Ayrıntılı izinlere sahip bir belirteç oluşturun">
    [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) sayfasına gidin ve ayrıntılı izinlere sahip yeni bir belirteç oluşturun.

    <Warning>
    Belirteçte **Make calls to Inference Providers** izni etkin olmalıdır; aksi takdirde API istekleri reddedilir.
    </Warning>

  </Step>
  <Step title="İlk kurulumu çalıştırın">
    Sağlayıcı açılır menüsünde **Hugging Face** seçeneğini belirleyin, ardından istendiğinde API anahtarınızı girin:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Varsayılan bir model seçin">
    **Varsayılan Hugging Face modeli** açılır menüsünden bir model seçin. Belirteciniz geçerliyse liste Inference API üzerinden yüklenir; aksi takdirde OpenClaw aşağıdaki yerleşik kataloğu gösterir. Seçiminiz `agents.defaults.model.primary` olarak kaydedilir:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Etkileşimsiz kurulum

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

`huggingface/deepseek-ai/DeepSeek-R1` modelini varsayılan model olarak ayarlar.

## Model kimlikleri

Model başvuruları `huggingface/<org>/<model>` biçimini kullanır (Hub tarzı kimlikler). OpenClaw'ın yerleşik kataloğu:

| Model                        | Başvuru (`huggingface/` önekiyle)          |
| ---------------------------- | ------------------------------------------ |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                  |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`                |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                      |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo`  |

<Tip>
Belirteciniz geçerliyse OpenClaw, ilk kurulum sırasında ve Gateway başlatılırken **GET** `https://router.huggingface.co/v1/models` üzerinden diğer tüm modelleri de keşfeder; böylece kataloğunuz yukarıdaki dört modelden çok daha fazlasını içerebilir. Herhangi bir model kimliğinin sonuna `:fastest` veya `:cheapest` ekleyebilirsiniz; HF yönlendiricisi isteği eşleşen çıkarım sağlayıcısına yönlendirir. Varsayılan sağlayıcı sıralamanızı [Inference Provider ayarlarında](https://hf.co/settings/inference-providers) belirleyin.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Model keşfi ve ilk kurulum açılır menüsü">
    OpenClaw modelleri şu istekle keşfeder:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # veya $HF_TOKEN
    ```

    Yanıt OpenAI tarzındadır: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Yapılandırılmış bir anahtar bulunduğunda (ilk kurulum, `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN`), etkileşimli kurulum sırasındaki **Varsayılan Hugging Face modeli** açılır menüsü bu uç noktadan doldurulur. Gateway başlatılırken kataloğu yenilemek için aynı çağrı tekrarlanır. Keşfedilen modeller yukarıdaki yerleşik katalogla birleştirilir (bir kimlik eşleştiğinde bağlam penceresi ve maliyet gibi meta veriler için kullanılır). İstek başarısız olursa, veri döndürmezse veya herhangi bir anahtar ayarlanmamışsa OpenClaw yalnızca yerleşik kataloğu kullanır.

    Sağlayıcıyı kaldırmadan keşfi devre dışı bırakın:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Model adları, diğer adlar ve ilke sonekleri">
    - **API'den gelen ad:** keşfedilen modeller, varsa API'nin `name`, `title` veya `display_name` değerini kullanır; aksi takdirde OpenClaw model kimliğinden bir ad türetir (örneğin `deepseek-ai/DeepSeek-R1`, "DeepSeek R1" olur).
    - **Görünen adı geçersiz kılma:** yapılandırmada her model için özel bir etiket ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **İlke sonekleri:** `:fastest` ve `:cheapest`, OpenClaw'ın yeniden yazdığı ifadeler değil, HF yönlendirici kurallarıdır: sonek model kimliğinin bir parçası olarak aynen gönderilir ve HF yönlendiricisi eşleşen çıkarım sağlayıcısını seçer. Her sonek için ayrı bir diğer ad istiyorsanız her çeşidi `models.providers.huggingface.models` altında (veya `model.primary` içinde) kendi girdisi olarak ekleyin.
    - **Yapılandırma birleştirme:** `models.providers.huggingface.models` içindeki mevcut girdiler (örneğin `models.json` içindekiler) yapılandırma birleştirilirken korunur; dolayısıyla burada ayarladığınız özel `name`, `alias` veya model seçenekleri yeniden başlatmalar boyunca kalıcı olur.

  </Accordion>

  <Accordion title="Ortam ve arka plan hizmeti kurulumu">
    Gateway bir arka plan hizmeti (launchd/systemd) olarak çalışıyorsa `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN` değişkeninin bu süreç tarafından kullanılabildiğinden emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).

    <Note>
    OpenClaw hem `HUGGINGFACE_HUB_TOKEN` hem de `HF_TOKEN` değişkenini kabul eder. Her ikisi de ayarlanmışsa `HUGGINGFACE_HUB_TOKEN` önceliklidir.
    </Note>

  </Accordion>

  <Accordion title="Yapılandırma: Yedekli DeepSeek R1">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Yapılandırma: En ucuz ve en hızlı çeşitleriyle DeepSeek">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Yapılandırma: Diğer adlarla DeepSeek + Llama + GPT-OSS">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model başvurularına ve yük devretme davranışına genel bakış.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
  <Card title="Inference Providers belgeleri" href="https://huggingface.co/docs/inference-providers" icon="book">
    Resmî Hugging Face Inference Providers belgeleri.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Eksiksiz yapılandırma başvurusu.
  </Card>
</CardGroup>
