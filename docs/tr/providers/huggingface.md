---
read_when:
    - OpenClaw ile Hugging Face Inference kullanmak istiyorsunuz
    - HF token ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: Hugging Face Inference kurulumu (kimlik doğrulama + model seçimi)
title: Hugging Face (inference)
x-i18n:
    generated_at: "2026-04-24T09:26:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b3049e8d42787acba12ec3ddf70603159251dae1d870047f8ffc9242f202a5
    source_path: providers/huggingface.md
    workflow: 15
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers), tek bir yönlendirici API üzerinden OpenAI uyumlu chat completions sunar. Tek bir token ile birçok modele (DeepSeek, Llama ve daha fazlası) erişirsiniz. OpenClaw, **OpenAI uyumlu uç noktayı** kullanır (yalnızca chat completions); text-to-image, embeddings veya konuşma için [HF inference clients](https://huggingface.co/docs/api-inference/quicktour) doğrudan kullanılmalıdır.

- Sağlayıcı: `huggingface`
- Kimlik doğrulama: `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN` (**Make calls to Inference Providers** iznine sahip ince ayarlı token)
- API: OpenAI uyumlu (`https://router.huggingface.co/v1`)
- Faturalama: Tek HF token; [fiyatlandırma](https://huggingface.co/docs/inference-providers/pricing) sağlayıcı ücretlerini izler ve ücretsiz katman içerir.

## Başlarken

<Steps>
  <Step title="İnce ayarlı bir token oluşturun">
    [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) sayfasına gidin ve yeni bir ince ayarlı token oluşturun.

    <Warning>
    Token üzerinde **Make calls to Inference Providers** izni etkin olmalıdır; aksi hâlde API istekleri reddedilir.
    </Warning>

  </Step>
  <Step title="Onboarding çalıştırın">
    Sağlayıcı açılır menüsünde **Hugging Face** seçin, ardından istendiğinde API anahtarınızı girin:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Varsayılan bir model seçin">
    **Default Hugging Face model** açılır menüsünden istediğiniz modeli seçin. Geçerli bir token varsa liste Inference API'den yüklenir; aksi hâlde yerleşik liste gösterilir. Seçiminiz varsayılan model olarak kaydedilir.

    Varsayılan modeli daha sonra yapılandırmada da ayarlayabilir veya değiştirebilirsiniz:

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

Bu, `huggingface/deepseek-ai/DeepSeek-R1` modelini varsayılan model olarak ayarlar.

## Model kimlikleri

Model başvuruları `huggingface/<org>/<model>` biçimini kullanır (Hub tarzı kimlikler). Aşağıdaki liste **GET** `https://router.huggingface.co/v1/models` çıktısındandır; kataloğunuz daha fazlasını içerebilir.

| Model                  | Başvuru (`huggingface/` ile önekleyin) |
| ---------------------- | -------------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`              |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`            |
| Qwen3 8B               | `Qwen/Qwen3-8B`                        |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`             |
| Qwen3 32B              | `Qwen/Qwen3-32B`                       |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct`    |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`     |
| GPT-OSS 120B           | `openai/gpt-oss-120b`                  |
| GLM 4.7                | `zai-org/GLM-4.7`                      |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`                 |

<Tip>
Her model kimliğinin sonuna `:fastest` veya `:cheapest` ekleyebilirsiniz. Varsayılan sıranızı [Inference Provider settings](https://hf.co/settings/inference-providers) içinde ayarlayın; tam liste için [Inference Providers](https://huggingface.co/docs/inference-providers) ve **GET** `https://router.huggingface.co/v1/models` bölümüne bakın.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Model keşfi ve onboarding açılır menüsü">
    OpenClaw, modelleri **Inference endpoint'e doğrudan** çağrı yaparak keşfeder:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (İsteğe bağlı: tam liste için `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` veya `$HF_TOKEN` gönderin; bazı uç noktalar kimlik doğrulama olmadan yalnızca alt küme döndürür.) Yanıt OpenAI tarzı `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }` biçimindedir.

    Bir Hugging Face API anahtarı yapılandırdığınızda (onboarding, `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN` üzerinden), OpenClaw kullanılabilir chat-completion modellerini keşfetmek için bu GET çağrısını kullanır. **Etkileşimli kurulum** sırasında, token'ınızı girdikten sonra bu listeden doldurulan (veya istek başarısız olursa yerleşik katalogdan gelen) bir **Default Hugging Face model** açılır menüsü görürsünüz. Çalışma zamanında (örneğin Gateway başlangıcında), anahtar mevcut olduğunda OpenClaw katalogu yenilemek için yine **GET** `https://router.huggingface.co/v1/models` çağrısını yapar. Liste, yerleşik bir katalogla (bağlam penceresi ve maliyet gibi meta veriler için) birleştirilir. İstek başarısız olursa veya anahtar ayarlı değilse yalnızca yerleşik katalog kullanılır.

  </Accordion>

  <Accordion title="Model adları, takma adlar ve ilke sonekleri">
    - **API'den gelen ad:** Model görünen adı, API `name`, `title` veya `display_name` döndürdüğünde **GET /v1/models** üzerinden doldurulur; aksi hâlde model kimliğinden türetilir (örneğin `deepseek-ai/DeepSeek-R1`, "DeepSeek R1" olur).
    - **Görünen adı geçersiz kıl:** CLI ve UI içinde istediğiniz şekilde görünmesi için yapılandırmada model başına özel bir etiket ayarlayabilirsiniz:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (hızlı)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (ucuz)" },
          },
        },
      },
    }
    ```

    - **İlke sonekleri:** OpenClaw'ın paketle gelen Hugging Face belgeleri ve yardımcıları şu iki soneki yerleşik ilke varyantları olarak değerlendirir:
      - **`:fastest`** — en yüksek işlem hacmi.
      - **`:cheapest`** — çıktı belirteci başına en düşük maliyet.

      Bunları `models.providers.huggingface.models` içinde ayrı girdiler olarak ekleyebilir veya `model.primary` değerini sonekli ayarlayabilirsiniz. Varsayılan sağlayıcı sıranızı [Inference Provider settings](https://hf.co/settings/inference-providers) içinde de ayarlayabilirsiniz (sonek yoksa = o sırayı kullan).

    - **Yapılandırma birleştirme:** `models.providers.huggingface.models` içindeki mevcut girdiler (örneğin `models.json` içinde olanlar) yapılandırma birleştirilirken korunur. Böylece orada ayarladığınız özel `name`, `alias` veya model seçenekleri korunur.

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN` değerinin o sürece de mevcut olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden).

    <Note>
    OpenClaw, ortam değişkeni takma adları olarak hem `HUGGINGFACE_HUB_TOKEN` hem de `HF_TOKEN` kabul eder. İkisinden biri çalışır; ikisi de ayarlıysa `HUGGINGFACE_HUB_TOKEN` önceliklidir.
    </Note>

  </Accordion>

  <Accordion title="Yapılandırma: Qwen yedeğiyle DeepSeek R1">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Yapılandırma: cheapest ve fastest varyantlarıyla Qwen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (en ucuz)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (en hızlı)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Yapılandırma: takma adlarla DeepSeek + Llama + GPT-OSS">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Yapılandırma: ilke sonekleriyle birden çok Qwen ve DeepSeek">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (ucuz)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (hızlı)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılar, model başvuruları ve devretme davranışı için genel bakış.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
  <Card title="Inference Providers belgeleri" href="https://huggingface.co/docs/inference-providers" icon="book">
    Resmî Hugging Face Inference Providers belgeleri.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma başvurusu.
  </Card>
</CardGroup>
