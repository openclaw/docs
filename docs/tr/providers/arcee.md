---
read_when:
    - Arcee AI'yi OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Arcee AI kurulumu (kimlik doğrulama + model seçimi)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai), OpenAI uyumlu bir API aracılığıyla Trinity uzmanlar karışımı model ailesine erişim sağlar. Tüm Trinity modelleri Apache 2.0 lisanslıdır.

Arcee AI modellerine doğrudan Arcee platformu üzerinden veya [OpenRouter](/tr/providers/openrouter) aracılığıyla erişilebilir.

| Özellik | Değer                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Sağlayıcı | `arcee`                                                                               |
| Kimlik doğrulama     | `ARCEEAI_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter üzerinden)                   |
| API      | OpenAI uyumlu                                                                     |
| Temel URL | `https://api.arcee.ai/api/v1` (doğrudan) veya `https://openrouter.ai/api/v1` (OpenRouter) |

## Başlarken

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        [Arcee AI](https://chat.arcee.ai/) adresinde bir API anahtarı oluşturun.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
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

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Get an API key">
        [OpenRouter](https://openrouter.ai/keys) adresinde bir API anahtarı oluşturun.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Aynı model referansları hem doğrudan hem de OpenRouter kurulumları için çalışır (örneğin `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Etkileşimsiz kurulum

<Tabs>
  <Tab title="Direct (Arcee platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Yerleşik katalog

OpenClaw şu anda bu paketlenmiş Arcee kataloğuyla gelir:

| Model referansı                      | Ad                   | Girdi | Bağlam | Maliyet (1M başına giriş/çıkış) | Notlar                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | metin  | 256K    | $0.25 / $0.90        | Varsayılan model; akıl yürütme etkin          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | metin  | 128K    | $0.25 / $1.00        | Genel amaçlı; 400B parametre, 13B aktif  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | metin  | 128K    | $0.045 / $0.15       | Hızlı ve maliyet açısından verimli; fonksiyon çağırma |

<Tip>
Onboarding ön ayarı, varsayılan model olarak `arcee/trinity-large-thinking` ayarlar.
</Tip>

## Desteklenen özellikler

| Özellik                                       | Destekleniyor                                    |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Evet                                          |
| Araç kullanımı / fonksiyon çağırma                   | Evet (Trinity Mini, Trinity Large Preview)    |
| Yapılandırılmış çıktı (JSON modu ve JSON şeması) | Evet                                          |
| Genişletilmiş düşünme                             | Evet (Trinity Large Thinking; araçlar devre dışı) |

<AccordionGroup>
  <Accordion title="Environment note">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `ARCEEAI_API_KEY`
    (veya `OPENROUTER_API_KEY`) değişkeninin bu süreç için kullanılabilir olduğundan emin olun (örneğin
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>

  <Accordion title="OpenRouter routing">
    Arcee modellerini OpenRouter üzerinden kullanırken aynı `arcee/*` model referansları geçerlidir.
    OpenClaw, kimlik doğrulama seçiminize göre yönlendirmeyi şeffaf biçimde yönetir. OpenRouter'a özgü
    yapılandırma ayrıntıları için [OpenRouter sağlayıcı belgelerine](/tr/providers/openrouter) bakın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/tr/providers/openrouter" icon="shuffle">
    Arcee modellerine ve çok daha fazlasına tek bir API anahtarı üzerinden erişin.
  </Card>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
</CardGroup>
