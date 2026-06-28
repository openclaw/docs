---
read_when:
    - OpenClaw ile Arcee AI kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: Arcee AI kurulumu (kimlik doğrulama + model seçimi)
title: Arcee AI
x-i18n:
    generated_at: "2026-06-28T01:08:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai), OpenAI uyumlu bir API üzerinden uzmanlar karışımı model ailesi Trinity'ye erişim sağlar. Tüm Trinity modelleri Apache 2.0 lisanslıdır.

Arcee AI modellerine doğrudan Arcee platformu üzerinden veya [OpenRouter](/tr/providers/openrouter) aracılığıyla erişilebilir.

| Özellik | Değer                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Sağlayıcı | `arcee`                                                                               |
| Kimlik doğrulama | `ARCEEAI_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter üzerinden)                   |
| API      | OpenAI uyumlu                                                                     |
| Temel URL | `https://api.arcee.ai/api/v1` (doğrudan) veya `https://openrouter.ai/api/v1` (OpenRouter) |

## Plugin'i kur

Resmi Plugin'i kurun, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Başlarken

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        [Arcee AI](https://chat.arcee.ai/) üzerinde bir API anahtarı oluşturun.
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
        [OpenRouter](https://openrouter.ai/keys) üzerinde bir API anahtarı oluşturun.
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

        Aynı model ref'leri hem doğrudan hem de OpenRouter kurulumlarında çalışır (örneğin `arcee/trinity-large-thinking`).
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

OpenClaw şu anda bu Arcee statik kataloğuyla gelir:

| Model ref'i                      | Ad                   | Girdi | Bağlam | Maliyet (1M başına giriş/çıkış) | Notlar                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | metin  | 256K    | $0.25 / $0.90        | Varsayılan model; akıl yürütme etkin          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | metin  | 128K    | $0.25 / $1.00        | Genel amaçlı; 400B parametre, 13B aktif  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | metin  | 128K    | $0.045 / $0.15       | Hızlı ve maliyet açısından verimli; fonksiyon çağırma |

<Tip>
Onboarding ön ayarı `arcee/trinity-large-thinking` modelini varsayılan model olarak ayarlar.
</Tip>

## Desteklenen özellikler

| Özellik                                       | Destekleniyor                                    |
| --------------------------------------------- | -------------------------------------------- |
| Akış                                     | Evet                                          |
| Araç kullanımı / fonksiyon çağırma                   | Evet (Trinity Mini, Trinity Large Preview)    |
| Yapılandırılmış çıktı (JSON modu ve JSON şeması) | Evet                                          |
| Genişletilmiş düşünme                             | Evet (Trinity Large Thinking; araçlar devre dışı) |

<AccordionGroup>
  <Accordion title="Environment note">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `ARCEEAI_API_KEY`
    (veya `OPENROUTER_API_KEY`) değişkeninin bu süreç tarafından erişilebilir olduğundan emin olun (örneğin
    `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden).
  </Accordion>

  <Accordion title="OpenRouter routing">
    Arcee modellerini OpenRouter üzerinden kullanırken aynı `arcee/*` model ref'leri geçerlidir.
    OpenClaw, kimlik doğrulama seçiminize göre yönlendirmeyi saydam biçimde yönetir. OpenRouter'a özgü
    yapılandırma ayrıntıları için
    [OpenRouter sağlayıcı dokümanlarına](/tr/providers/openrouter) bakın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/tr/providers/openrouter" icon="shuffle">
    Arcee modellerine ve birçok başka modele tek bir API anahtarıyla erişin.
  </Card>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
</CardGroup>
