---
read_when:
    - Groq'u OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı ortam değişkeni veya CLI kimlik doğrulama seçeneği gerekir
    - Groq üzerinde Whisper ses transkripsiyonunu yapılandırıyorsunuz
summary: Groq kurulumu (kimlik doğrulama + model seçimi + Whisper transkripsiyonu)
title: Groq
x-i18n:
    generated_at: "2026-06-28T01:10:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com), özel LPU donanımı kullanarak açık ağırlıklı modellerde (Llama, Gemma, Kimi, Qwen, GPT OSS ve daha fazlası) ultra hızlı çıkarım sağlar. Groq Plugin, hem OpenAI uyumlu bir sohbet sağlayıcısı hem de bir ses ortamı-anlama sağlayıcısı kaydeder.

| Özellik               | Değer                                    |
| ---------------------- | ---------------------------------------- |
| Sağlayıcı kimliği            | `groq`                                   |
| Plugin                 | resmi harici paket                |
| Kimlik doğrulama env var           | `GROQ_API_KEY`                           |
| API                    | OpenAI uyumlu (`openai-completions`) |
| Temel URL               | `https://api.groq.com/openai/v1`         |
| Ses transkripsiyonu    | `whisper-large-v3-turbo` (varsayılan)       |
| Önerilen sohbet varsayılanı | `groq/llama-3.3-70b-versatile`           |

## Plugin yükleme

Resmi Plugin’i yükleyin, ardından Gateway’i yeniden başlatın:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Başlarken

<Steps>
  <Step title="API anahtarı alma">
    [console.groq.com/keys](https://console.groq.com/keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="API anahtarını ayarlama">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Varsayılan model ayarlama">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="Kataloğun erişilebilir olduğunu doğrulama">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Yapılandırma dosyası örneği

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Yerleşik katalog

OpenClaw, hem akıl yürüten hem de akıl yürütmeyen girdilere sahip, manifest destekli bir Groq kataloğuyla gelir. Yüklü sürümünüz için statik satırları görmek üzere `openclaw models list --provider groq` komutunu çalıştırın veya Groq’un yetkili listesi için [console.groq.com/docs/models](https://console.groq.com/docs/models) sayfasına bakın.

| Model ref                                        | Ad                    | Akıl yürütme | Girdi        | Bağlam |
| ------------------------------------------------ | ----------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | hayır        | metin         | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | hayır        | metin         | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | hayır        | metin + görsel | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | evet       | metin         | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | evet       | metin         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | evet       | metin         | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | evet       | metin         | 131,072 |
| `groq/groq/compound`                             | Compound                | evet       | metin         | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | evet       | metin         | 131,072 |

<Tip>
  Katalog her OpenClaw sürümüyle gelişir. `openclaw models list --provider groq`, yüklü sürümünüzün bildiği satırları gösterir; yeni eklenen veya kullanımdan kaldırılan modeller için [console.groq.com/docs/models](https://console.groq.com/docs/models) ile karşılaştırarak kontrol edin.
</Tip>

## Akıl yürütme modelleri

OpenClaw, paylaşılan `/think` düzeylerini Groq’un modele özgü `reasoning_effort` değerlerine eşler:

- `qwen/qwen3-32b` için devre dışı düşünme `none`, etkin düşünme ise `default` gönderir.
- Groq GPT OSS akıl yürütme modelleri (`openai/gpt-oss-*`) için OpenClaw, `/think` düzeyine göre `low`, `medium` veya `high` gönderir. Devre dışı düşünme `reasoning_effort` değerini atlar, çünkü bu modeller devre dışı bir değeri desteklemez.
- DeepSeek R1 Distill, Qwen QwQ ve Compound, Groq’un yerel akıl yürütme yüzeyini kullanır; `/think` görünürlüğü denetler, ancak model her zaman akıl yürütür.

Paylaşılan `/think` düzeyleri ve OpenClaw’ın bunları sağlayıcı başına nasıl çevirdiği için [Düşünme modları](/tr/tools/thinking) bölümüne bakın.

## Ses transkripsiyonu

Groq’un Plugin’i ayrıca sesli mesajların paylaşılan `tools.media.audio` yüzeyi üzerinden transkribe edilebilmesi için bir **ses ortamı-anlama sağlayıcısı** kaydeder.

| Özellik           | Değer                                     |
| ------------------ | ----------------------------------------- |
| Paylaşılan yapılandırma yolu | `tools.media.audio`                       |
| Varsayılan temel URL   | `https://api.groq.com/openai/v1`          |
| Varsayılan model      | `whisper-large-v3-turbo`                  |
| Otomatik öncelik      | 20                                        |
| API uç noktası       | OpenAI uyumlu `/audio/transcriptions` |

Groq’u varsayılan ses arka ucu yapmak için:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Daemon için ortam kullanılabilirliği">
    Gateway yönetilen bir hizmet (launchd, systemd, Docker) olarak çalışıyorsa `GROQ_API_KEY`, yalnızca etkileşimli kabuğunuzda değil, o süreç tarafından da görülebilir olmalıdır.

    <Warning>
      Yalnızca etkileşimli bir kabukta dışa aktarılan bir anahtar, o ortam oraya da içe aktarılmadıkça launchd veya systemd daemon’una yardımcı olmaz. Anahtarı gateway sürecinden okunabilir yapmak için `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

  </Accordion>

  <Accordion title="Özel Groq model kimlikleri">
    OpenClaw, çalışma zamanında herhangi bir Groq model kimliğini kabul eder. Groq tarafından gösterilen tam kimliği kullanın ve başına `groq/` ekleyin. Statik katalog yaygın durumları kapsar; katalogda olmayan kimlikler varsayılan OpenAI uyumlu şablona düşer.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref’lerini ve failover davranışını seçme.
  </Card>
  <Card title="Düşünme modları" href="/tr/tools/thinking" icon="brain">
    Akıl yürütme çabası düzeyleri ve sağlayıcı-politika etkileşimi.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ve ses ayarları dahil tam yapılandırma şeması.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq panosu, API dokümanları ve fiyatlandırma.
  </Card>
</CardGroup>
