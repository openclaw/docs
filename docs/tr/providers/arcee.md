---
read_when:
    - Arcee AI'ı OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: Arcee AI kurulumu (kimlik doğrulama + model seçimi)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T12:41:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai), OpenAI uyumlu bir API üzerinden uzmanlar karışımı Trinity model ailesini sunar. Tüm Trinity modelleri Apache 2.0 lisanslıdır. Arcee, çekirdekle birlikte paketlenmeyen resmî bir OpenClaw Plugin'idir; bu nedenle ilk kurulumdan önce yüklenmesi gerekir.

Arcee modellerine doğrudan Arcee platformu veya [OpenRouter](/tr/providers/openrouter) üzerinden erişin.

| Özellik   | Değer                                                                                       |
| --------- | ------------------------------------------------------------------------------------------- |
| Sağlayıcı | `arcee`                                                                                     |
| Kimlik doğrulama | `ARCEEAI_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter üzerinden)         |
| API       | OpenAI uyumlu                                                                               |
| Temel URL | `https://api.arcee.ai/api/v1` (doğrudan) veya `https://openrouter.ai/api/v1` (OpenRouter)   |

## Plugin'i yükleme

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Başlarken

<Tabs>
  <Tab title="Doğrudan (Arcee platformu)">
    <Steps>
      <Step title="API anahtarı edinme">
        [Arcee AI](https://chat.arcee.ai/) üzerinde bir API anahtarı oluşturun.
      </Step>
      <Step title="İlk kurulumu çalıştırma">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Varsayılan model ayarlama">
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
      <Step title="API anahtarı edinme">
        [OpenRouter](https://openrouter.ai/keys) üzerinde bir API anahtarı oluşturun.
      </Step>
      <Step title="İlk kurulumu çalıştırma">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Varsayılan model ayarlama">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Aynı model referansları hem doğrudan hem de OpenRouter kurulumlarında çalışır.
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

| Model referansı                | Ad                     | Girdi | Bağlam | En fazla çıktı | Maliyet (1 milyon başına giriş/çıkış) | Araçlar | Notlar                                           |
| ------------------------------ | ---------------------- | ----- | ------ | -------------- | ------------------------------------- | ------- | ------------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | metin | 256K   | 80K            | $0.25 / $0.90                         | Hayır   | Varsayılan model; genişletilmiş düşünme           |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | metin | 128K   | 16K            | $0.25 / $1.00                         | Evet    | Genel amaçlı; 400 milyar parametre, 13 milyar etkin |
| `arcee/trinity-mini`           | Trinity Mini 26B       | metin | 128K   | 80K            | $0.045 / $0.15                        | Evet    | Hızlı ve uygun maliyetli; işlev çağırma           |

<Tip>
İlk kurulum ön ayarı, varsayılan model olarak `arcee/trinity-large-thinking` modelini ayarlar.
</Tip>

## Desteklenen özellikler

| Özellik                                           | Destek durumu                                      |
| ------------------------------------------------- | -------------------------------------------------- |
| Akış                                              | Evet                                               |
| Araç kullanımı / işlev çağırma                    | Evet (Trinity Mini, Trinity Large Preview)         |
| Yapılandırılmış çıktı (JSON modu ve JSON şeması)  | Evet                                               |
| Genişletilmiş düşünme                             | Evet (Trinity Large Thinking; araçlar devre dışı)  |

<AccordionGroup>
  <Accordion title="Ortam notu">
    Gateway bir arka plan hizmeti (launchd/systemd) olarak çalışıyorsa `ARCEEAI_API_KEY`
    (veya `OPENROUTER_API_KEY`) değişkeninin bu işlem tarafından erişilebilir olduğundan
    emin olun; örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla.
  </Accordion>

  <Accordion title="OpenRouter yönlendirmesi">
    Arcee modellerini OpenRouter üzerinden kullanırken aynı `arcee/*` model referansları
    geçerlidir. OpenClaw, kimlik doğrulama seçiminize göre yönlendirmeyi şeffaf biçimde
    gerçekleştirir. OpenRouter'a özgü yapılandırma ayrıntıları için
    [OpenRouter sağlayıcı belgelerine](/tr/providers/openrouter) bakın.
  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/tr/providers/openrouter" icon="shuffle">
    Arcee modellerine ve diğer birçok modele tek bir API anahtarıyla erişin.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıların, model referanslarının ve yük devretme davranışının seçimi.
  </Card>
</CardGroup>
