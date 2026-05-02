---
read_when:
    - OpenClaw ile Arcee AI kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: Arcee AI kurulumu (kimlik doğrulama + model seçimi)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-02T23:39:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 622ee5288aec3ae0b45d3f06ba65fd6f972e07d7a7596ae3905d6fbdac0bf737
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai), OpenAI uyumlu bir API üzerinden Trinity karışım uzmanları model ailesine erişim sağlar. Tüm Trinity modelleri Apache 2.0 lisanslıdır.

Arcee AI modellerine doğrudan Arcee platformu üzerinden veya [OpenRouter](/tr/providers/openrouter) aracılığıyla erişilebilir.

| Özellik | Değer                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Sağlayıcı | `arcee`                                                                               |
| Kimlik doğrulama | `ARCEEAI_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter aracılığıyla)                   |
| API      | OpenAI uyumlu                                                                     |
| Temel URL | `https://api.arcee.ai/api/v1` (doğrudan) veya `https://openrouter.ai/api/v1` (OpenRouter) |

## Başlarken

<Tabs>
  <Tab title="Doğrudan (Arcee platformu)">
    <Steps>
      <Step title="API anahtarı alın">
        [Arcee AI](https://chat.arcee.ai/) üzerinde bir API anahtarı oluşturun.
      </Step>
      <Step title="Onboarding çalıştırın">
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
      <Step title="Onboarding çalıştırın">
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

| Model başvurusu               | Ad                     | Girdi | Bağlam | Maliyet (1M başına girdi/çıktı) | Notlar                                      |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | metin  | 256K    | $0.25 / $0.90        | Varsayılan model; akıl yürütme etkin; araç yok |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | metin  | 128K    | $0.25 / $1.00        | Genel amaçlı; 400B parametre, 13B etkin   |
| `arcee/trinity-mini`           | Trinity Mini 26B       | metin  | 128K    | $0.045 / $0.15       | Hızlı ve maliyet açısından verimli; işlev çağırma  |

<Tip>
Onboarding ön ayarı, `arcee/trinity-large-thinking` modelini varsayılan model olarak ayarlar. Bu model akıl yürütme/metin odaklıdır ve araç kullanımını ya da işlev çağırmayı desteklemez.
</Tip>

## Desteklenen özellikler

| Özellik                                       | Desteklenir                                   |
| --------------------------------------------- | ------------------------------------------- |
| Akış                                     | Evet                                         |
| Araç kullanımı / işlev çağırma                   | Modele bağlı; Trinity Large Thinking değil |
| Yapılandırılmış çıktı (JSON modu ve JSON şeması) | Evet                                         |
| Genişletilmiş düşünme                             | Evet (Trinity Large Thinking)                |

<AccordionGroup>
  <Accordion title="Ortam notu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa, `ARCEEAI_API_KEY`
    (veya `OPENROUTER_API_KEY`) değerinin bu işlem tarafından kullanılabilir olduğundan emin olun (örneğin,
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>

  <Accordion title="OpenRouter yönlendirmesi">
    Arcee modellerini OpenRouter üzerinden kullanırken aynı `arcee/*` model başvuruları geçerlidir.
    OpenClaw, kimlik doğrulama seçiminize göre yönlendirmeyi şeffaf şekilde yönetir. OpenRouter'a özgü
    yapılandırma ayrıntıları için [OpenRouter sağlayıcı dokümanlarına](/tr/providers/openrouter)
    bakın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/tr/providers/openrouter" icon="shuffle">
    Arcee modellerine ve birçok başka modele tek bir API anahtarıyla erişin.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
</CardGroup>
