---
read_when:
    - OpenClaw ile Arcee AI kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: Arcee AI kurulumu (kimlik doğrulama + model seçimi)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-12T23:29:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68c5fddbe272c69611257ceff319c4de7ad21134aaf64582d60720a6f3b853cc
    source_path: providers/arcee.md
    workflow: 15
---

# Arcee AI

[Arcee AI](https://arcee.ai), OpenAI uyumlu bir API üzerinden Trinity karışım-uzman modeli ailesine erişim sağlar. Tüm Trinity modelleri Apache 2.0 lisanslıdır.

Arcee AI modellerine doğrudan Arcee platformu üzerinden veya [OpenRouter](/tr/providers/openrouter) aracılığıyla erişilebilir.

| Property | Value                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Sağlayıcı | `arcee`                                                                               |
| Kimlik doğrulama | `ARCEEAI_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter üzerinden)         |
| API      | OpenAI uyumlu                                                                          |
| Base URL | `https://api.arcee.ai/api/v1` (doğrudan) veya `https://openrouter.ai/api/v1` (OpenRouter) |

## Başlangıç

<Tabs>
  <Tab title="Doğrudan (Arcee platformu)">
    <Steps>
      <Step title="Bir API anahtarı alın">
        [Arcee AI](https://chat.arcee.ai/) üzerinde bir API anahtarı oluşturun.
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
        [OpenRouter](https://openrouter.ai/keys) üzerinde bir API anahtarı oluşturun.
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

        Aynı model başvuruları hem doğrudan hem de OpenRouter kurulumlarında çalışır (örneğin `arcee/trinity-large-thinking`).
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

OpenClaw şu anda paketlenmiş şu Arcee kataloğunu sunar:

| Model ref                      | Ad                     | Girdi | Bağlam | Maliyet (1M başına giriş/çıkış) | Notlar                                    |
| ------------------------------ | ---------------------- | ----- | ------ | ------------------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K   | $0.25 / $0.90                   | Varsayılan model; akıl yürütme etkin      |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K   | $0.25 / $1.00                   | Genel amaçlı; 400B parametre, 13B aktif   |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K   | $0.045 / $0.15                  | Hızlı ve maliyet açısından verimli; function calling |

<Tip>
Onboarding hazır ayarı, varsayılan model olarak `arcee/trinity-large-thinking` ayarlar.
</Tip>

## Desteklenen özellikler

| Özellik                                       | Destekleniyor              |
| --------------------------------------------- | -------------------------- |
| Akış                                           | Evet                       |
| Tool use / function calling                   | Evet                       |
| Yapılandırılmış çıktı (JSON modu ve JSON şeması) | Evet                    |
| Genişletilmiş düşünme                         | Evet (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="Ortam notu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa, `ARCEEAI_API_KEY`
    (veya `OPENROUTER_API_KEY`) değişkeninin o süreç için kullanılabilir olduğundan emin olun (örneğin,
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>

  <Accordion title="OpenRouter yönlendirmesi">
    Arcee modellerini OpenRouter üzerinden kullanırken aynı `arcee/*` model başvuruları geçerlidir.
    OpenClaw, kimlik doğrulama seçiminize göre yönlendirmeyi şeffaf şekilde yönetir. OpenRouter'a özgü
    yapılandırma ayrıntıları için [OpenRouter provider docs](/tr/providers/openrouter) sayfasına bakın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/tr/providers/openrouter" icon="shuffle">
    Tek bir API anahtarı üzerinden Arcee modellerine ve daha birçok modele erişin.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve devralma davranışını seçme.
  </Card>
</CardGroup>
