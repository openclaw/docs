---
read_when:
    - OpenClaw ile Hugging Face Inference kullanmak istiyorsunuz
    - HF token ortam değişkenine veya CLI auth seçimine ihtiyacınız var
summary: Hugging Face Inference kurulumu (kimlik doğrulama + model seçimi)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-05T14:04:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692d2caffbaf991670260da393c67ae7e6349b9e1e3ed5cb9a514f8a77192e86
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers), tek bir yönlendirici API üzerinden OpenAI uyumlu sohbet tamamlama hizmeti sunar. Tek bir token ile birçok modele (DeepSeek, Llama ve daha fazlası) erişirsiniz. OpenClaw **OpenAI uyumlu uç noktayı** kullanır (yalnızca sohbet tamamlamaları); metinden görsele, embeddings veya konuşma için [HF inference clients](https://huggingface.co/docs/api-inference/quicktour) doğrudan kullanın.

- Sağlayıcı: `huggingface`
- Kimlik doğrulama: `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN` (**Make calls to Inference Providers** iznine sahip ayrıntılı token)
- API: OpenAI uyumlu (`https://router.huggingface.co/v1`)
- Faturalandırma: Tek bir HF token; [fiyatlandırma](https://huggingface.co/docs/inference-providers/pricing) sağlayıcı ücretlerini izler ve ücretsiz bir katman içerir.

## Hızlı başlangıç

1. [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) adresinde **Make calls to Inference Providers** iznine sahip ayrıntılı bir token oluşturun.
2. Onboarding'i çalıştırın, sağlayıcı açılır menüsünde **Hugging Face** seçin, ardından istendiğinde API anahtarınızı girin:

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. **Default Hugging Face model** açılır menüsünde istediğiniz modeli seçin (geçerli bir token olduğunda liste Inference API'den yüklenir; aksi halde yerleşik bir liste gösterilir). Seçiminiz varsayılan model olarak kaydedilir.
4. Varsayılan modeli daha sonra yapılandırmada da ayarlayabilir veya değiştirebilirsiniz:

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## Etkileşimsiz örnek

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Bu, `huggingface/deepseek-ai/DeepSeek-R1` modelini varsayılan model olarak ayarlar.

## Ortam notu

Gateway bir daemon olarak çalışıyorsa (`launchd/systemd`), `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN` değerinin
bu işlem için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
`env.shellEnv` aracılığıyla).

## Model keşfi ve onboarding açılır menüsü

OpenClaw, **Inference uç noktasını doğrudan** çağırarak modelleri keşfeder:

```bash
GET https://router.huggingface.co/v1/models
```

(İsteğe bağlı: tam liste için `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` veya `$HF_TOKEN` gönderin; bazı uç noktalar kimlik doğrulama olmadan alt küme döndürür.) Yanıt, OpenAI tarzı `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }` biçimindedir.

Bir Hugging Face API anahtarı yapılandırdığınızda (`onboarding`, `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN` aracılığıyla), OpenClaw kullanılabilir sohbet tamamlama modellerini keşfetmek için bu GET isteğini kullanır. **Etkileşimli kurulum** sırasında, token'ınızı girdikten sonra bu listeden (veya istek başarısız olursa yerleşik katalogdan) doldurulan bir **Default Hugging Face model** açılır menüsü görürsünüz. Çalışma zamanında (örneğin Gateway başlangıcında), bir anahtar mevcutsa OpenClaw kataloğu yenilemek için yine **GET** `https://router.huggingface.co/v1/models` çağrısını yapar. Liste, bağlam penceresi ve maliyet gibi meta veriler için yerleşik bir katalogla birleştirilir. İstek başarısız olursa veya anahtar ayarlı değilse yalnızca yerleşik katalog kullanılır.

## Model adları ve düzenlenebilir seçenekler

- **API'den ad:** Model görünen adı, API `name`, `title` veya `display_name` döndürdüğünde **GET /v1/models** üzerinden doldurulur; aksi halde model kimliğinden türetilir (örneğin `deepseek-ai/DeepSeek-R1` → “DeepSeek R1”).
- **Görünen adı geçersiz kılma:** CLI ve UI'da istediğiniz şekilde görünmesi için yapılandırmada model başına özel etiket ayarlayabilirsiniz:

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

- **İlke sonekleri:** OpenClaw'un paketlenmiş Hugging Face belgeleri ve yardımcıları şu anda bu iki soneki yerleşik ilke varyantları olarak ele alır:
  - **`:fastest`** — en yüksek aktarım hızı.
  - **`:cheapest`** — çıktı token başına en düşük maliyet.

  Bunları `models.providers.huggingface.models` içinde ayrı girdiler olarak ekleyebilir veya `model.primary` değerini sonek ile ayarlayabilirsiniz. Varsayılan sağlayıcı sıranızı [Inference Provider settings](https://hf.co/settings/inference-providers) içinde de ayarlayabilirsiniz (sonek yok = bu sırayı kullan).

- **Yapılandırma birleştirme:** `models.providers.huggingface.models` içindeki mevcut girdiler (örneğin `models.json` içinde), yapılandırma birleştirildiğinde korunur. Bu nedenle orada ayarladığınız özel `name`, `alias` veya model seçenekleri korunur.

## Model kimlikleri ve yapılandırma örnekleri

Model başvuruları `huggingface/<org>/<model>` biçimini kullanır (Hub tarzı kimlikler). Aşağıdaki liste **GET** `https://router.huggingface.co/v1/models` kaynağındandır; kataloğunuz daha fazlasını içerebilir.

**Örnek kimlikler (inference uç noktasından):**

| Model                  | Ref (`huggingface/` ile başlayın)   |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

Model kimliğine `:fastest` veya `:cheapest` ekleyebilirsiniz. Varsayılan sıranızı [Inference Provider settings](https://hf.co/settings/inference-providers) içinde ayarlayın; tam liste için [Inference Providers](https://huggingface.co/docs/inference-providers) ve **GET** `https://router.huggingface.co/v1/models` kaynaklarına bakın.

### Tam yapılandırma örnekleri

**Birincil DeepSeek R1, yedek olarak Qwen ile:**

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

**Varsayılan olarak Qwen, `:cheapest` ve `:fastest` varyantlarıyla:**

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

**Takma adlarla DeepSeek + Llama + GPT-OSS:**

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

**İlke sonekleriyle birden çok Qwen ve DeepSeek modeli:**

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
