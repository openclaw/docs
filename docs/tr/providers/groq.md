---
read_when:
    - OpenClaw ile Groq kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
    - Whisper ses transkripsiyonunu Groq üzerinde yapılandırıyorsunuz
summary: Groq kurulumu (kimlik doğrulama + model seçimi + Whisper transkripsiyonu)
title: Groq
x-i18n:
    generated_at: "2026-05-06T09:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com), özel LPU donanımı kullanarak açık ağırlıklı modellerde (Llama, Gemma, Kimi, Qwen, GPT OSS ve daha fazlası) ultra hızlı çıkarım sağlar. OpenClaw, hem OpenAI uyumlu bir sohbet sağlayıcısı hem de sesli medya anlama sağlayıcısı kaydeden yerleşik bir Groq Plugin içerir.

| Özellik               | Değer                                    |
| ---------------------- | ---------------------------------------- |
| Sağlayıcı kimliği            | `groq`                                   |
| Plugin                 | yerleşik, `enabledByDefault: true`        |
| Kimlik doğrulama ortam değişkeni           | `GROQ_API_KEY`                           |
| İlk kurulum bayrağı        | `--auth-choice groq-api-key`             |
| API                    | OpenAI uyumlu (`openai-completions`) |
| Temel URL               | `https://api.groq.com/openai/v1`         |
| Ses transkripsiyonu    | `whisper-large-v3-turbo` (varsayılan)       |
| Önerilen sohbet varsayılanı | `groq/llama-3.3-70b-versatile`           |

## Başlarken

<Steps>
  <Step title="Bir API anahtarı alın">
    [console.groq.com/keys](https://console.groq.com/keys) adresinden bir API anahtarı oluşturun.
  </Step>
  <Step title="API anahtarını ayarlayın">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash Yalnızca ortam
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

  </Step>
  <Step title="Varsayılan bir model ayarlayın">
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
  <Step title="Kataloğa erişilebildiğini doğrulayın">
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

OpenClaw, hem akıl yürütme hem de akıl yürütme dışı girdiler içeren manifest destekli bir Groq kataloğuyla gelir. Kurulu sürümünüz için yerleşik satırları görmek üzere `openclaw models list --provider groq` komutunu çalıştırın veya Groq'un yetkili listesi için [console.groq.com/docs/models](https://console.groq.com/docs/models) adresini kontrol edin.

| Model ref                                            | Ad                          | Akıl yürütme | Girdi        | Bağlam |
| ---------------------------------------------------- | ----------------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | hayır        | metin         | 131,072 |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | hayır        | metin         | 131,072 |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | hayır        | metin + görsel | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | hayır        | metin + görsel | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | hayır        | metin         | 8,192   |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | hayır        | metin         | 8,192   |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | hayır        | metin         | 8,192   |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | hayır        | metin         | 32,768  |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | hayır        | metin         | 131,072 |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | hayır        | metin         | 262,144 |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | evet       | metin         | 131,072 |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | evet       | metin         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | evet       | metin         | 131,072 |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | evet       | metin         | 131,072 |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | evet       | metin         | 131,072 |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | evet       | metin         | 131,072 |
| `groq/groq/compound`                                 | Compound                      | evet       | metin         | 131,072 |
| `groq/groq/compound-mini`                            | Compound Mini                 | evet       | metin         | 131,072 |

<Tip>
  Katalog, her OpenClaw sürümüyle gelişir. `openclaw models list --provider groq`, kurulu sürümünüzün bildiği satırları gösterir; yeni eklenen veya kullanımdan kaldırılan modeller için [console.groq.com/docs/models](https://console.groq.com/docs/models) adresiyle karşılaştırın.
</Tip>

## Akıl yürütme modelleri

OpenClaw, paylaşılan `/think` düzeylerini Groq'un modele özgü `reasoning_effort` değerlerine eşler:

- `qwen/qwen3-32b` için devre dışı düşünme `none`, etkin düşünme ise `default` gönderir.
- Groq GPT OSS akıl yürütme modelleri (`openai/gpt-oss-*`) için OpenClaw, `/think` düzeyine göre `low`, `medium` veya `high` gönderir. Devre dışı düşünme `reasoning_effort` değerini çıkarır, çünkü bu modeller devre dışı bir değeri desteklemez.
- DeepSeek R1 Distill, Qwen QwQ ve Compound, Groq'un yerel akıl yürütme yüzeyini kullanır; `/think` görünürlüğü kontrol eder ancak model her zaman akıl yürütür.

Paylaşılan `/think` düzeyleri ve OpenClaw'ın bunları sağlayıcı başına nasıl çevirdiği için [Düşünme modları](/tr/tools/thinking) bölümüne bakın.

## Ses transkripsiyonu

Groq'un yerleşik Plugin'i ayrıca sesli mesajların paylaşılan `tools.media.audio` yüzeyi üzerinden transkribe edilebilmesi için bir **sesli medya anlama sağlayıcısı** kaydeder.

| Özellik           | Değer                                     |
| ------------------ | ----------------------------------------- |
| Paylaşılan yapılandırma yolu | `tools.media.audio`                       |
| Varsayılan temel URL   | `https://api.groq.com/openai/v1`          |
| Varsayılan model      | `whisper-large-v3-turbo`                  |
| Otomatik öncelik      | 20                                        |
| API uç noktası       | OpenAI uyumlu `/audio/transcriptions` |

Groq'u varsayılan ses arka ucu yapmak için:

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
  <Accordion title="Daemon için ortam erişilebilirliği">
    Gateway yönetilen bir servis olarak çalışıyorsa (launchd, systemd, Docker), `GROQ_API_KEY` yalnızca etkileşimli kabuğunuzda değil, o süreç tarafından da görünür olmalıdır.

    <Warning>
      Yalnızca `~/.profile` içinde duran bir anahtar, bu ortam oraya da içe aktarılmadıkça launchd veya systemd daemon'una yardımcı olmaz. Anahtarı `~/.openclaw/.env` içinde ya da `env.shellEnv` üzerinden ayarlayarak gateway sürecinden okunabilir hale getirin.
    </Warning>

  </Accordion>

  <Accordion title="Özel Groq model kimlikleri">
    OpenClaw çalışma zamanında herhangi bir Groq model kimliğini kabul eder. Groq tarafından gösterilen tam kimliği kullanın ve başına `groq/` ekleyin. Yerleşik katalog yaygın durumları kapsar; katalogda olmayan kimlikler varsayılan OpenAI uyumlu şablona düşer.

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
    Sağlayıcı, model ref değerleri ve yük devretme davranışını seçme.
  </Card>
  <Card title="Düşünme modları" href="/tr/tools/thinking" icon="brain">
    Akıl yürütme çabası düzeyleri ve sağlayıcı ilkesi etkileşimi.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ve ses ayarlarını içeren tam yapılandırma şeması.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq panosu, API belgeleri ve fiyatlandırma.
  </Card>
</CardGroup>
