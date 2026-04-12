---
read_when:
    - OpenClaw ile Chutes kullanmak istiyorsunuz
    - OAuth veya API key kurulum yoluna ihtiyacınız var
    - Varsayılan modeli, takma adları veya keşif davranışını istiyorsunuz
summary: Chutes kurulumu (OAuth veya API key, model keşfi, takma adlar)
title: Chutes
x-i18n:
    generated_at: "2026-04-12T23:29:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07c52b1d1d2792412e6daabc92df5310434b3520116d9e0fd2ad26bfa5297e1c
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai), açık kaynak model kataloglarını
OpenAI uyumlu bir API üzerinden sunar. OpenClaw, paketlenmiş `chutes` sağlayıcısı için hem tarayıcı OAuth’unu hem de doğrudan API key
kimlik doğrulamasını destekler.

| Özellik | Değer                       |
| -------- | --------------------------- |
| Sağlayıcı | `chutes`                    |
| API      | OpenAI uyumlu               |
| Temel URL | `https://llm.chutes.ai/v1`  |
| Kimlik doğrulama | OAuth veya API key (aşağıya bakın) |

## Başlangıç

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth başlangıç akışını çalıştırın">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw tarayıcı akışını yerelde başlatır veya uzak/headless ana makinelerde bir URL + yönlendirme yapıştırma
        akışı gösterir. OAuth token’ları, OpenClaw auth
        profilleri üzerinden otomatik yenilenir.
      </Step>
      <Step title="Varsayılan modeli doğrulayın">
        Başlangıç kurulumundan sonra varsayılan model
        `chutes/zai-org/GLM-4.7-TEE` olarak ayarlanır ve paketlenmiş Chutes kataloğu
        kaydedilir.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Bir API key alın">
        Şu adreste bir anahtar oluşturun:
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="API key başlangıç akışını çalıştırın">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Varsayılan modeli doğrulayın">
        Başlangıç kurulumundan sonra varsayılan model
        `chutes/zai-org/GLM-4.7-TEE` olarak ayarlanır ve paketlenmiş Chutes kataloğu
        kaydedilir.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Her iki kimlik doğrulama yolu da paketlenmiş Chutes kataloğunu kaydeder ve varsayılan modeli
`chutes/zai-org/GLM-4.7-TEE` olarak ayarlar. Çalışma zamanı ortam değişkenleri: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Keşif davranışı

Chutes kimlik doğrulaması mevcut olduğunda OpenClaw, Chutes kataloğunu bu
kimlik bilgisiyle sorgular ve keşfedilen modelleri kullanır. Keşif başarısız olursa OpenClaw,
başlangıç kurulumu ve açılışın yine de çalışması için paketlenmiş statik kataloğa geri döner.

## Varsayılan takma adlar

OpenClaw, paketlenmiş Chutes kataloğu için üç kullanışlı takma ad kaydeder:

| Takma ad       | Hedef model                                           |
| -------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Yerleşik başlangıç kataloğu

Paketlenmiş geri dönüş kataloğu mevcut Chutes referanslarını içerir:

| Model ref                                             |
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

    | Variable | Amaç |
    | -------- | ---- |
    | `CHUTES_CLIENT_ID` | Özel OAuth istemci kimliği |
    | `CHUTES_CLIENT_SECRET` | Özel OAuth istemci parolası |
    | `CHUTES_OAUTH_REDIRECT_URI` | Özel yönlendirme URI’si |
    | `CHUTES_OAUTH_SCOPES` | Özel OAuth kapsamları |

    Yönlendirme uygulaması gereksinimleri ve yardım için
    [Chutes OAuth belgelerine](https://chutes.ai/docs/sign-in-with-chutes/overview) bakın.

  </Accordion>

  <Accordion title="Notlar">
    - API key ve OAuth keşfinin ikisi de aynı `chutes` sağlayıcı kimliğini kullanır.
    - Chutes modelleri `chutes/<model-id>` olarak kaydedilir.
    - Açılışta keşif başarısız olursa paketlenmiş statik katalog otomatik olarak kullanılır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı kuralları, model referansları ve yük devretme davranışı.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ayarları dahil tam yapılandırma şeması.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes panosu ve API belgeleri.
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API anahtarları oluşturun ve yönetin.
  </Card>
</CardGroup>
