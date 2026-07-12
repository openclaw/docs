---
read_when:
    - Groq'yu OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı ortam değişkeni veya CLI kimlik doğrulama seçeneği gerekir
    - Groq üzerinde Whisper ses transkripsiyonunu yapılandırıyorsunuz
summary: Groq kurulumu (kimlik doğrulama + model seçimi + Whisper transkripsiyonu)
title: Groq
x-i18n:
    generated_at: "2026-07-12T12:08:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com), özel LPU donanımı kullanarak açık ağırlıklı modellerde (Llama, Gemma, Kimi, Qwen, GPT OSS ve daha fazlası) son derece hızlı çıkarım sağlar. Groq Plugin'i hem OpenAI uyumlu bir sohbet sağlayıcısını hem de sesli medya anlama sağlayıcısını kaydeder.

| Özellik                    | Değer                                    |
| -------------------------- | ---------------------------------------- |
| Sağlayıcı kimliği          | `groq`                                   |
| Plugin                     | resmi harici paket                        |
| Kimlik doğrulama ortam değişkeni | `GROQ_API_KEY`                     |
| API                        | OpenAI uyumlu (`openai-completions`)      |
| Temel URL                  | `https://api.groq.com/openai/v1`          |
| Ses transkripsiyonu        | `whisper-large-v3-turbo` (varsayılan)     |
| Önerilen varsayılan sohbet modeli | `groq/llama-3.3-70b-versatile`    |

## Plugin'i yükleme

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Başlarken

<Steps>
  <Step title="API anahtarı alın">
    [console.groq.com/keys](https://console.groq.com/keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="API anahtarını ayarlayın">
    ```bash
export GROQ_API_KEY=gsk_...
```
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

OpenClaw, hem akıl yürütme hem de akıl yürütmesiz girdiler içeren, manifest destekli bir Groq kataloğuyla birlikte gelir. Yüklü sürümünüzün statik satırlarını görmek için `openclaw models list --provider groq` komutunu çalıştırın veya Groq'nun yetkili listesi için [console.groq.com/docs/models](https://console.groq.com/docs/models) sayfasına bakın.

| Model referansı                                   | Ad                      | Akıl yürütme | Girdi        | Bağlam  |
| ------------------------------------------------ | ----------------------- | ------------ | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | hayır        | metin        | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | hayır        | metin        | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | hayır        | metin + görsel | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | evet         | metin        | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | evet         | metin        | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Güvenlik GPT OSS 20B    | evet         | metin        | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | evet         | metin        | 131,072 |
| `groq/groq/compound`                             | Compound                | evet         | metin        | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | evet         | metin        | 131,072 |

<Tip>
  Katalog her OpenClaw sürümüyle gelişir. `openclaw models list --provider groq`, yüklü sürümünüzün bildiği satırları gösterir; yeni eklenen veya kullanımdan kaldırılan modeller için [console.groq.com/docs/models](https://console.groq.com/docs/models) ile karşılaştırın.
</Tip>

## Akıl yürütme modelleri

Groq akıl yürütme modelleri (yukarıdaki tabloda `reasoning: true`), OpenClaw'ın paylaşılan `/think` düzeylerini `low`, `medium` veya `high` `reasoning_effort` değerleriyle eşler. `/think off` veya `/think none`, devre dışı bırakılmış bir değer göndermek yerine istekte `reasoning_effort` alanını kullanmaz.

Paylaşılan `/think` düzeyleri ve OpenClaw'ın bunları her sağlayıcı için nasıl dönüştürdüğü hakkında bilgi için [Düşünme modları](/tr/tools/thinking) sayfasına bakın.

## Ses transkripsiyonu

Groq Plugin'i ayrıca sesli mesajların paylaşılan `tools.media.audio` yüzeyi üzerinden yazıya dökülebilmesi için bir **sesli medya anlama sağlayıcısı** kaydeder.

| Özellik                    | Değer                                     |
| -------------------------- | ----------------------------------------- |
| Paylaşılan yapılandırma yolu | `tools.media.audio`                     |
| Varsayılan temel URL       | `https://api.groq.com/openai/v1`          |
| Varsayılan model           | `whisper-large-v3-turbo`                  |
| Otomatik öncelik           | 20                                        |
| API uç noktası             | OpenAI uyumlu `/audio/transcriptions`     |

Groq'yu varsayılan ses arka ucu yapmak için:

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
  <Accordion title="Arka plan hizmeti için ortam kullanılabilirliği">
    Gateway yönetilen bir hizmet olarak çalışıyorsa (launchd, systemd, Docker), `GROQ_API_KEY` yalnızca etkileşimli kabuğunuz tarafından değil, bu işlem tarafından da görülebilmelidir.

    <Warning>
      Yalnızca etkileşimli bir kabukta dışa aktarılan anahtar, ortam oraya da aktarılmadıkça launchd veya systemd arka plan hizmetine yardımcı olmaz. Anahtarı gateway işlemi tarafından okunabilir hâle getirmek için `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

  </Accordion>

  <Accordion title="Özel Groq model kimlikleri">
    OpenClaw, çalışma zamanında herhangi bir Groq model kimliğini kabul eder. Groq tarafından gösterilen kimliği aynen kullanın ve başına `groq/` ekleyin. Statik katalog yaygın durumları kapsar; katalogda bulunmayan kimlikler varsayılan OpenAI uyumlu şablona aktarılır.

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

## İlgili konular

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıların, model referanslarının ve yük devretme davranışının seçilmesi.
  </Card>
  <Card title="Düşünme modları" href="/tr/tools/thinking" icon="brain">
    Akıl yürütme çabası düzeyleri ve sağlayıcı politikası etkileşimi.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ve ses ayarlarını içeren eksiksiz yapılandırma şeması.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq kontrol paneli, API belgeleri ve fiyatlandırması.
  </Card>
</CardGroup>
