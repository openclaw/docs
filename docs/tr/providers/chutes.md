---
read_when:
    - OpenClaw ile Chutes kullanmak istiyorsunuz
    - OAuth veya API anahtarı kurulum yoluna ihtiyacınız var
    - Varsayılan modeli, takma adları veya keşif davranışını istiyorsunuz
summary: Chutes kurulumu (OAuth veya API anahtarı, model keşfi, takma adlar)
title: Chutes
x-i18n:
    generated_at: "2026-04-30T09:40:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52e2c767604ff50cc7fe1a5fcfac03c35345facf2225e80f62476bbc3852199a
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai), açık kaynak model kataloglarını OpenAI uyumlu bir API üzerinden sunar. OpenClaw, yerleşik `chutes` sağlayıcısı için hem tarayıcı OAuth'u hem de doğrudan API anahtarıyla kimlik doğrulamayı destekler.

| Özellik  | Değer                        |
| -------- | ---------------------------- |
| Sağlayıcı | `chutes`                    |
| API      | OpenAI uyumlu                |
| Temel URL | `https://llm.chutes.ai/v1`  |
| Kimlik doğrulama | OAuth veya API anahtarı (aşağıya bakın) |

## Başlarken

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth ilk kurulum akışını çalıştırın">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw, tarayıcı akışını yerel olarak başlatır veya uzak/başsız ana makinelerde bir URL + yönlendirme-yapıştırma akışı gösterir. OAuth token'ları OpenClaw kimlik doğrulama profilleri üzerinden otomatik yenilenir.
      </Step>
      <Step title="Varsayılan modeli doğrulayın">
        İlk kurulumdan sonra varsayılan model
        `chutes/zai-org/GLM-4.7-TEE` olarak ayarlanır ve yerleşik Chutes kataloğu
        kaydedilir.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API anahtarı">
    <Steps>
      <Step title="Bir API anahtarı alın">
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys) adresinde
        bir anahtar oluşturun.
      </Step>
      <Step title="API anahtarı ilk kurulum akışını çalıştırın">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Varsayılan modeli doğrulayın">
        İlk kurulumdan sonra varsayılan model
        `chutes/zai-org/GLM-4.7-TEE` olarak ayarlanır ve yerleşik Chutes kataloğu
        kaydedilir.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Her iki kimlik doğrulama yolu da yerleşik Chutes kataloğunu kaydeder ve varsayılan modeli
`chutes/zai-org/GLM-4.7-TEE` olarak ayarlar. Çalışma zamanı ortam değişkenleri: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Keşif davranışı

Chutes kimlik doğrulaması kullanılabilir olduğunda OpenClaw, bu kimlik bilgisiyle Chutes kataloğunu sorgular ve bulunan modelleri kullanır. Keşif başarısız olursa OpenClaw, ilk kurulumun ve başlatmanın çalışmaya devam etmesi için yerleşik statik kataloğa geri döner.

## Varsayılan takma adlar

OpenClaw, yerleşik Chutes kataloğu için üç kullanışlı takma ad kaydeder:

| Takma ad        | Hedef model                                          |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Yerleşik başlangıç kataloğu

Yerleşik geri dönüş kataloğu güncel Chutes referanslarını içerir:

| Model referansı                                      |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## Yapılandırma örneği

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth geçersiz kılmaları">
    OAuth akışını isteğe bağlı ortam değişkenleriyle özelleştirebilirsiniz:

    | Değişken | Amaç |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | Özel OAuth istemci kimliği |
    | `CHUTES_CLIENT_SECRET` | Özel OAuth istemci sırrı |
    | `CHUTES_OAUTH_REDIRECT_URI` | Özel yönlendirme URI'si |
    | `CHUTES_OAUTH_SCOPES` | Özel OAuth kapsamları |

    Yönlendirme uygulaması gereksinimleri ve yardım için [Chutes OAuth belgelerine](https://chutes.ai/docs/sign-in-with-chutes/overview)
    bakın.

  </Accordion>

  <Accordion title="Notlar">
    - API anahtarı ve OAuth keşfi aynı `chutes` sağlayıcı kimliğini kullanır.
    - Chutes modelleri `chutes/<model-id>` olarak kaydedilir.
    - Başlangıçta keşif başarısız olursa yerleşik statik katalog otomatik olarak kullanılır.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı kuralları, model referansları ve yük devretme davranışı.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ayarlarını da içeren tam yapılandırma şeması.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes panosu ve API belgeleri.
  </Card>
  <Card title="Chutes API anahtarları" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API anahtarları oluşturun ve yönetin.
  </Card>
</CardGroup>
