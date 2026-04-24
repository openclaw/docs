---
read_when:
    - Arcee AI'yi OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı env değişkenine veya CLI auth seçeneğine ihtiyacınız var
summary: Arcee AI kurulumu (auth + model seçimi)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-24T09:24:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 15
---

[Arcee AI](https://arcee.ai), Trinity karışım-uzman modelleri ailesine OpenAI uyumlu bir API üzerinden erişim sağlar. Tüm Trinity modelleri Apache 2.0 lisanslıdır.

Arcee AI modellerine doğrudan Arcee platformu üzerinden veya [OpenRouter](/tr/providers/openrouter) aracılığıyla erişilebilir.

| Özellik   | Değer                                                                                 |
| --------- | ------------------------------------------------------------------------------------- |
| Sağlayıcı | `arcee`                                                                               |
| Auth      | `ARCEEAI_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter üzerinden)        |
| API       | OpenAI uyumlu                                                                         |
| Base URL  | `https://api.arcee.ai/api/v1` (doğrudan) veya `https://openrouter.ai/api/v1` (OpenRouter) |

## Başlangıç

<Tabs>
  <Tab title="Doğrudan (Arcee platformu)">
    <Steps>
      <Step title="Bir API anahtarı alın">
        [Arcee AI](https://chat.arcee.ai/) üzerinden bir API anahtarı oluşturun.
      </Step>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="OpenRouter üzerinden">
    <Steps>
      <Step title="Bir API anahtarı alın">
        [OpenRouter](https://openrouter.ai/keys) üzerinden bir API anahtarı oluşturun.
      </Step>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Aynı model ref'leri hem doğrudan hem de OpenRouter kurulumlarında çalışır (örneğin `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Etkileşimsiz kurulum

<Tabs>
  <Tab title="Doğrudan (Arcee platformu)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="OpenRouter üzerinden">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Yerleşik katalog

OpenClaw şu anda bu paketlenmiş Arcee kataloğunu sunar:

| Model ref                       | Ad                     | Girdi | Bağlam | Maliyet (1M başına giriş/çıkış) | Notlar                                     |
| ------------------------------- | ---------------------- | ----- | ------ | ------------------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking`  | Trinity Large Thinking | text  | 256K   | $0.25 / $0.90                   | Varsayılan model; akıl yürütme etkin       |
| `arcee/trinity-large-preview`   | Trinity Large Preview  | text  | 128K   | $0.25 / $1.00                   | Genel amaçlı; 400B parametre, 13B aktif    |
| `arcee/trinity-mini`            | Trinity Mini 26B       | text  | 128K   | $0.045 / $0.15                  | Hızlı ve maliyet açısından verimli; function calling |

<Tip>
Onboarding hazır ayarı varsayılan model olarak `arcee/trinity-large-thinking` ayarlar.
</Tip>

## Desteklenen özellikler

| Özellik                                       | Destek durumu                  |
| --------------------------------------------- | ------------------------------ |
| Akış                                          | Evet                           |
| Araç kullanımı / function calling             | Evet                           |
| Yapılandırılmış çıktı (JSON modu ve JSON şeması) | Evet                        |
| Genişletilmiş thinking                        | Evet (Trinity Large Thinking)  |

<AccordionGroup>
  <Accordion title="Ortam notu">
    Gateway daemon olarak çalışıyorsa (launchd/systemd), `ARCEEAI_API_KEY`
    (veya `OPENROUTER_API_KEY`) değerinin bu süreç tarafından erişilebilir olduğundan emin olun (örneğin
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>

  <Accordion title="OpenRouter yönlendirmesi">
    Arcee modellerini OpenRouter üzerinden kullanırken aynı `arcee/*` model ref'leri geçerlidir.
    OpenClaw, auth seçiminize göre yönlendirmeyi şeffaf biçimde yönetir. OpenRouter'a özgü
    yapılandırma ayrıntıları için [OpenRouter sağlayıcı belgelerine](/tr/providers/openrouter) bakın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/tr/providers/openrouter" icon="shuffle">
    Arcee modellerine ve daha birçok modele tek bir API anahtarı üzerinden erişin.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
</CardGroup>
