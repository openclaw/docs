---
read_when:
    - OpenClaw ile Arcee AI kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: Arcee AI kurulumu (kimlik doğrulama + model seçimi)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-03T09:01:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai), OpenAI uyumlu bir API aracılığıyla uzmanlar karışımı model ailesi Trinity'ye erişim sağlar. Tüm Trinity modelleri Apache 2.0 lisanslıdır.

Arcee AI modellerine doğrudan Arcee platformu üzerinden veya [OpenRouter](/tr/providers/openrouter) aracılığıyla erişilebilir.

| Özellik | Değer                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Sağlayıcı | `arcee`                                                                               |
| Kimlik doğrulama     | `ARCEEAI_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter aracılığıyla)                   |
| API      | OpenAI uyumlu                                                                     |
| Temel URL | `https://api.arcee.ai/api/v1` (doğrudan) veya `https://openrouter.ai/api/v1` (OpenRouter) |

## Başlarken

<Tabs>
  <Tab title="Doğrudan (Arcee platformu)">
    <Steps>
      <Step title="API anahtarı alın">
        [Arcee AI](https://chat.arcee.ai/) üzerinde bir API anahtarı oluşturun.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Varsayılan model ayarlayın">
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

  <Tab title="OpenRouter aracılığıyla">
    <Steps>
      <Step title="API anahtarı alın">
        [OpenRouter](https://openrouter.ai/keys) üzerinde bir API anahtarı oluşturun.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Varsayılan model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Aynı model referansları hem doğrudan kurulumlarda hem de OpenRouter kurulumlarında çalışır (örneğin `arcee/trinity-large-thinking`).
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

  <Tab title="OpenRouter aracılığıyla">
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
| `arcee/trinity-mini`           | Trinity Mini 26B       | metin  | 128K    | $0.045 / $0.15       | Hızlı ve maliyet verimli; işlev çağırma |

<Tip>
İlk kurulum ön ayarı, `arcee/trinity-large-thinking` modelini varsayılan model olarak ayarlar.
</Tip>

## Desteklenen özellikler

| Özellik                                       | Desteklenir                    |
| --------------------------------------------- | ---------------------------- |
| Akış                                     | Evet                          |
| Araç kullanımı / işlev çağırma                   | Evet                          |
| Yapılandırılmış çıktı (JSON modu ve JSON şeması) | Evet                          |
| Genişletilmiş düşünme                             | Evet (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="Ortam notu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `ARCEEAI_API_KEY`
    (veya `OPENROUTER_API_KEY`) değerinin bu süreç tarafından kullanılabilir olduğundan emin olun (örneğin
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>

  <Accordion title="OpenRouter yönlendirmesi">
    Arcee modellerini OpenRouter aracılığıyla kullanırken aynı `arcee/*` model referansları geçerlidir.
    OpenClaw, kimlik doğrulama tercihinize göre yönlendirmeyi saydam şekilde yönetir. OpenRouter'a özel
    yapılandırma ayrıntıları için
    [OpenRouter sağlayıcı belgelerine](/tr/providers/openrouter) bakın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/tr/providers/openrouter" icon="shuffle">
    Arcee modellerine ve pek çok başka modele tek bir API anahtarıyla erişin.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
</CardGroup>
