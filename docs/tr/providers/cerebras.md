---
read_when:
    - OpenClaw ile Cerebras kullanmak istiyorsunuz
    - Cerebras API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: Cerebras kurulumu (kimlik doğrulama + model seçimi)
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T09:39:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai), yüksek hızlı OpenAI uyumlu çıkarım sağlar.

| Özellik | Değer                        |
| ------- | ---------------------------- |
| Sağlayıcı | `cerebras`                   |
| Kimlik doğrulama | `CEREBRAS_API_KEY`           |
| API      | OpenAI uyumlu            |
| Temel URL | `https://api.cerebras.ai/v1` |

## Başlarken

<Steps>
  <Step title="Bir API anahtarı alın">
    [Cerebras Cloud Console](https://cloud.cerebras.ai) içinde bir API anahtarı oluşturun.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### Etkileşimsiz Kurulum

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Yerleşik Katalog

OpenClaw, genel OpenAI uyumlu uç nokta için statik bir Cerebras kataloğuyla gelir:

| Model başvurusu                           | Ad                   | Notlar                                 |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | Varsayılan model; önizleme akıl yürütme modeli |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | Üretim akıl yürütme modeli             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | Önizleme, akıl yürütmeyen model        |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | Üretim, hıza odaklı model              |

<Warning>
Cerebras, `zai-glm-4.7` ve `qwen-3-235b-a22b-instruct-2507` modellerini önizleme modelleri olarak işaretler; `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` ise 27 Mayıs 2026 tarihinde kullanımdan kaldırılmak üzere belgelenmiştir. Üretimde bunlara güvenmeden önce Cerebras'ın desteklenen modeller sayfasını kontrol edin.
</Warning>

## Manuel Yapılandırma

Paketle gelen Plugin genellikle yalnızca API anahtarına ihtiyaç duyduğunuz anlamına gelir. Model meta verilerini geçersiz kılmak istediğinizde açık
`models.providers.cerebras` yapılandırmasını kullanın:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `CEREBRAS_API_KEY` değerinin
bu süreç tarafından kullanılabilir olduğundan emin olun; örneğin `~/.openclaw/.env` içinde veya
`env.shellEnv` aracılığıyla.
</Note>
