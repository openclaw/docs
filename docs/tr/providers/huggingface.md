---
read_when:
    - OpenClaw ile Hugging Face Inference kullanmak istiyorsunuz
    - HF token ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: Hugging Face Inference kurulumu (kimlik doğrulama + model seçimi)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-12T23:30:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7787fce1acfe81adb5380ab1c7441d661d03c574da07149c037d3b6ba3c8e52a
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers), tek bir yönlendirici API üzerinden OpenAI uyumlu sohbet tamamlama sunar. Tek bir token ile birçok modele (DeepSeek, Llama ve daha fazlası) erişirsiniz. OpenClaw **OpenAI uyumlu uç noktayı** kullanır (yalnızca sohbet tamamlama); metinden görüntüye, gömmeler veya konuşma için [HF inference clients](https://huggingface.co/docs/api-inference/quicktour) doğrudan kullanın.

- Sağlayıcı: `huggingface`
- Kimlik doğrulama: `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN` (**Make calls to Inference Providers** iznine sahip ayrıntılı yetkili token)
- API: OpenAI uyumlu (`https://router.huggingface.co/v1`)
- Faturalandırma: Tek bir HF token; [fiyatlandırma](https://huggingface.co/docs/inference-providers/pricing) sağlayıcı ücretlerini izler ve ücretsiz katman içerir.

## Başlangıç

<Steps>
  <Step title="Ayrıntılı yetkili bir token oluşturun">
    [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) sayfasına gidin ve yeni bir ayrıntılı yetkili token oluşturun.

    <Warning>
    Token'da **Make calls to Inference Providers** izni etkin olmalıdır, aksi halde API istekleri reddedilir.
    </Warning>

  </Step>
  <Step title="Onboarding çalıştırın">
    Sağlayıcı açılır menüsünde **Hugging Face** seçin, ardından istendiğinde API anahtarınızı girin:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Varsayılan bir model seçin">
    **Default Hugging Face model** açılır menüsünde istediğiniz modeli seçin. Geçerli bir token'ınız varsa liste Inference API'den yüklenir; aksi halde yerleşik bir liste gösterilir. Seçiminiz varsayılan model olarak kaydedilir.

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

Bu, varsayılan model olarak `huggingface/deepseek-ai/DeepSeek-R1` ayarlar.

## Model kimlikleri

Model başvuruları `huggingface/<org>/<model>` biçimini kullanır (Hub tarzı kimlikler). Aşağıdaki liste **GET** `https://router.huggingface.co/v1/models` çıktısındandır; kataloğunuz daha fazlasını içerebilir.

| Model                  | Ref (başına `huggingface/` ekleyin)  |
| ---------------------- | ------------------------------------ |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`            |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`          |
| Qwen3 8B               | `Qwen/Qwen3-8B`                      |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`           |
| Qwen3 32B              | `Qwen/Qwen3-32B`                     |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct`  |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`   |
| GPT-OSS 120B           | `openai/gpt-oss-120b`                |
| GLM 4.7                | `zai-org/GLM-4.7`                    |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`               |

<Tip>
Herhangi bir model kimliğine `:fastest` veya `:cheapest` ekleyebilirsiniz. Varsayılan sıranızı [Inference Provider settings](https://hf.co/settings/inference-providers) içinde ayarlayın; tam liste için [Inference Providers](https://huggingface.co/docs/inference-providers) ve **GET** `https://router.huggingface.co/v1/models` belgelerine bakın.
</Tip>

## Gelişmiş ayrıntılar

<AccordionGroup>
  <Accordion title="Model bulma ve onboarding açılır menüsü">
    OpenClaw modelleri **Inference uç noktasını doğrudan** çağırarak bulur:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (İsteğe bağlı: tam liste için `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` veya `$HF_TOKEN` gönderin; bazı uç noktalar kimlik doğrulama olmadan alt küme döndürür.) Yanıt OpenAI tarzı `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }` biçimindedir.

    Bir Hugging Face API anahtarı yapılandırdığınızda (`onboarding`, `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN` aracılığıyla), OpenClaw kullanılabilir chat-completion modellerini bulmak için bu GET çağrısını kullanır. **Etkileşimli kurulum** sırasında token'ınızı girdikten sonra, bu listeden (veya istek başarısız olursa yerleşik katalogdan) doldurulan bir **Default Hugging Face model** açılır menüsü görürsünüz. Çalışma zamanında (ör. Gateway başlangıcında), bir anahtar mevcutsa OpenClaw kataloğu yenilemek için tekrar **GET** `https://router.huggingface.co/v1/models` çağrısını yapar. Liste, yerleşik bir katalogla birleştirilir (bağlam penceresi ve maliyet gibi meta veriler için). İstek başarısız olursa veya anahtar ayarlı değilse yalnızca yerleşik katalog kullanılır.

  </Accordion>

  <Accordion title="Model adları, takma adlar ve ilke son ekleri">
    - **API'den ad:** API `name`, `title` veya `display_name` döndürdüğünde model görünen adı **GET /v1/models** yanıtından doldurulur; aksi halde model kimliğinden türetilir (ör. `deepseek-ai/DeepSeek-R1`, "DeepSeek R1" olur).
    - **Görünen adı geçersiz kıl:** CLI ve kullanıcı arayüzünde istediğiniz şekilde görünmesi için yapılandırmada model başına özel bir etiket ayarlayabilirsiniz:

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

    - **İlke son ekleri:** OpenClaw'ın paketlenmiş Hugging Face belgeleri ve yardımcıları şu anda bu iki son eki yerleşik ilke varyantları olarak ele alır:
      - **`:fastest`** — en yüksek çıktı hacmi.
      - **`:cheapest`** — çıktı token'ı başına en düşük maliyet.

      Bunları `models.providers.huggingface.models` içinde ayrı girdiler olarak ekleyebilir veya `model.primary` değerini son ekle ayarlayabilirsiniz. Varsayılan sağlayıcı sıranızı [Inference Provider settings](https://hf.co/settings/inference-providers) içinde de ayarlayabilirsiniz (son ek yoksa = bu sırayı kullan).

    - **Yapılandırma birleştirme:** `models.providers.huggingface.models` içindeki mevcut girdiler (`models.json` içindekiler gibi), yapılandırma birleştirildiğinde korunur. Bu yüzden orada ayarladığınız özel `name`, `alias` veya model seçenekleri korunur.

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa, `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN` değerinin o süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).

    <Note>
    OpenClaw, `HUGGINGFACE_HUB_TOKEN` ve `HF_TOKEN` değerlerinin her ikisini de ortam değişkeni takma adları olarak kabul eder. İkisinden biri yeterlidir; ikisi de ayarlıysa `HUGGINGFACE_HUB_TOKEN` önceliklidir.
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

  <Accordion title="Yapılandırma: En ucuz ve en hızlı varyantlarla Qwen">
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

  <Accordion title="Yapılandırma: Takma adlarla DeepSeek + Llama + GPT-OSS">
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

  <Accordion title="Yapılandırma: İlke son ekleriyle birden çok Qwen ve DeepSeek">
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
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılar, model başvuruları ve devralma davranışı hakkında genel bakış.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    Resmî Hugging Face Inference Providers belgeleri.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma başvurusu.
  </Card>
</CardGroup>
