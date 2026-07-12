---
read_when:
    - Cerebras'ı OpenClaw ile kullanmak istiyorsunuz
    - Cerebras API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Cerebras kurulumu (kimlik doğrulama + model seçimi)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T12:38:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai), özel çıkarım donanımında yüksek hızlı, OpenAI uyumlu çıkarım sağlar. Plugin, statik bir dört modelli katalogla sunulur (canlı keşif yoktur).

| Özellik                  | Değer                                                     |
| ------------------------ | --------------------------------------------------------- |
| Sağlayıcı kimliği        | `cerebras`                                                |
| Plugin                   | resmî harici paket (`@openclaw/cerebras-provider`)        |
| Kimlik doğrulama ortam değişkeni | `CEREBRAS_API_KEY`                               |
| İlk kurulum bayrağı      | `--auth-choice cerebras-api-key`                          |
| Doğrudan CLI bayrağı     | `--cerebras-api-key <key>`                                |
| API                      | OpenAI uyumlu (`openai-completions`)                      |
| Temel URL                | `https://api.cerebras.ai/v1`                              |
| Varsayılan model         | `cerebras/zai-glm-4.7`                                    |

## Plugin'i yükleme

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Başlarken

<Steps>
  <Step title="Bir API anahtarı edinin">
    [Cerebras Cloud Console](https://cloud.cerebras.ai) içinde bir API anahtarı oluşturun.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    <CodeGroup>

```bash İlk kurulum
openclaw onboard --auth-choice cerebras-api-key
```

```bash Doğrudan bayrak
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Yalnızca ortam değişkeni
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider cerebras
    ```

    Dört statik modelin tümünü listeler. `CEREBRAS_API_KEY` çözümlenemiyorsa `openclaw models status --json`, eksik kimlik bilgisini `auth.unusableProfiles` altında bildirir.

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

Dört modelin tümü 128 bin bağlam penceresini ve en fazla 8.192 çıktı tokenini paylaşır.

| Model referansı                            | Ad                   | Akıl yürütme | Notlar                                            |
| ------------------------------------------ | -------------------- | ------------ | ------------------------------------------------- |
| `cerebras/zai-glm-4.7`                     | Z.ai GLM 4.7         | evet         | Varsayılan model; önizleme akıl yürütme modeli    |
| `cerebras/gpt-oss-120b`                    | GPT OSS 120B         | evet         | Üretim akıl yürütme modeli                        |
| `cerebras/qwen-3-235b-a22b-instruct-2507`  | Qwen 3 235B Instruct | hayır        | Önizleme, akıl yürütme yapmayan model             |
| `cerebras/llama3.1-8b`                     | Llama 3.1 8B         | hayır        | Üretim için hız odaklı model                      |

<Warning>
Cerebras, `zai-glm-4.7` ve `qwen-3-235b-a22b-instruct-2507` modellerini önizleme modelleri olarak işaretler; ayrıca `llama3.1-8b` ile `qwen-3-235b-a22b-instruct-2507` modellerinin 27 Mayıs 2026'da kullanımdan kaldırılması planlanmaktadır. Üretim iş yüklerinde bu modellere güvenmeden önce Cerebras'ın [desteklenen modeller sayfasını](https://inference-docs.cerebras.ai/models/overview) kontrol edin.
</Warning>

## Manuel yapılandırma

Çoğu kurulumda yalnızca API anahtarı gerekir. Model meta verilerini geçersiz kılmak veya statik katalogla birlikte `mode: "merge"` modunda çalışmak için açık bir `models.providers.cerebras` yapılandırması kullanın:

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
Gateway bir artalan hizmeti olarak çalışıyorsa (launchd, systemd, Docker), `CEREBRAS_API_KEY` değişkeninin bu işlem tarafından kullanılabilir olduğundan emin olun; örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla. Yalnızca etkileşimli bir kabukta dışa aktarılan anahtar, ortam değişkenleri ayrıca içe aktarılmadıkça yönetilen bir hizmete yardımcı olmaz.
</Note>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Düşünme modları" href="/tr/tools/thinking" icon="brain">
    Akıl yürütme özelliğine sahip iki Cerebras modeli için akıl yürütme çabası düzeyleri.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Ajan varsayılanları ve model yapılandırması.
  </Card>
  <Card title="Modeller hakkında SSS" href="/tr/help/faq-models" icon="circle-question">
    Kimlik doğrulama profilleri, model değiştirme ve "profil yok" hatalarını çözme.
  </Card>
</CardGroup>
