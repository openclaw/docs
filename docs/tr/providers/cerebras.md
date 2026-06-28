---
read_when:
    - OpenClaw ile Cerebras kullanmak istiyorsunuz
    - |-
      OpenClaw Docs i18n girdisi:

      Cerebras API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: Cerebras kurulumu (kimlik doğrulama + model seçimi)
title: Cerebras
x-i18n:
    generated_at: "2026-06-28T01:08:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai), özel çıkarım donanımı üzerinde yüksek hızlı OpenAI uyumlu çıkarım sağlar. Cerebras sağlayıcı Plugin'i statik dört modelli bir katalog içerir.

| Özellik              | Değer                                    |
| -------------------- | ---------------------------------------- |
| Sağlayıcı kimliği    | `cerebras`                               |
| Plugin               | resmi harici paket                       |
| Kimlik env değişkeni | `CEREBRAS_API_KEY`                       |
| Onboarding bayrağı   | `--auth-choice cerebras-api-key`         |
| Doğrudan CLI bayrağı | `--cerebras-api-key <key>`               |
| API                  | OpenAI uyumlu (`openai-completions`)     |
| Temel URL            | `https://api.cerebras.ai/v1`             |
| Varsayılan model     | `cerebras/zai-glm-4.7`                   |

## Plugin'i yükleme

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Başlarken

<Steps>
  <Step title="API anahtarı alma">
    [Cerebras Cloud Console](https://cloud.cerebras.ai) içinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding'i çalıştırma">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Doğrudan bayrak
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Yalnızca env
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Modellerin kullanılabilir olduğunu doğrulama">
    ```bash
    openclaw models list --provider cerebras
    ```

    Liste dört statik modelin tamamını içermelidir. `CEREBRAS_API_KEY` çözümlenmemişse, `openclaw models status --json` eksik kimlik bilgisini `auth.unusableProfiles` altında bildirir.

  </Step>
</Steps>

## Etkileşimsiz kurulum

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Yerleşik katalog

OpenClaw, genel OpenAI uyumlu uç noktayı yansıtan statik bir Cerebras kataloğuyla gelir. Dört modelin tamamı 128k bağlamı ve 8.192 maksimum çıktı token'ını paylaşır.

| Model ref                                 | Ad                   | Akıl yürütme | Notlar                                         |
| ----------------------------------------- | -------------------- | ------------ | ---------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | evet         | Varsayılan model; önizleme akıl yürütme modeli |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | evet         | Üretim akıl yürütme modeli                     |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | hayır        | Önizleme, akıl yürütmeyen model                |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | hayır        | Üretim için hız odaklı model                   |

<Warning>
  Cerebras, `zai-glm-4.7` ve `qwen-3-235b-a22b-instruct-2507` modellerini önizleme modelleri olarak işaretler; `llama3.1-8b` ve `qwen-3-235b-a22b-instruct-2507` için de 27 Mayıs 2026 tarihinde kullanımdan kaldırılma belgelenmiştir. Üretim iş yüklerinde bunlara güvenmeden önce Cerebras'ın desteklenen modeller sayfasını kontrol edin.
</Warning>

## Manuel yapılandırma

Plugin genellikle yalnızca API anahtarına ihtiyacınız olduğu anlamına gelir. Model meta verilerini geçersiz kılmak veya statik kataloğa karşı `mode: "merge"` ile çalışmak istediğinizde açık `models.providers.cerebras` yapılandırmasını kullanın:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
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
  Gateway bir daemon (launchd, systemd, Docker) olarak çalışıyorsa, `CEREBRAS_API_KEY` değerinin o işlem tarafından kullanılabilir olduğundan emin olun; örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla. Yalnızca etkileşimli bir shell'de dışa aktarılan anahtar, env ayrıca içe aktarılmadığı sürece yönetilen bir servise yardımcı olmaz.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Düşünme modları" href="/tr/tools/thinking" icon="brain">
    Akıl yürütebilen iki Cerebras modeli için akıl yürütme çabası düzeyleri.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Ajan varsayılanları ve model yapılandırması.
  </Card>
  <Card title="Modeller SSS" href="/tr/help/faq-models" icon="circle-question">
    Kimlik profilleri, model değiştirme ve "no profile" hatalarını çözme.
  </Card>
</CardGroup>
