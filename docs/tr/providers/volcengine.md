---
read_when:
    - OpenClaw ile Volcano Engine veya Doubao modellerini kullanmak istiyorsunuz
    - Volcengine API anahtarı kurulumuna ihtiyacınız var
summary: Volcano Engine kurulumu (Doubao modelleri, genel + kodlama uç noktaları)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-24T09:28:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6091da50fbab3a01cdc4337a496f361987f1991a2e2b7764e7a9c8c464e9757a
    source_path: providers/volcengine.md
    workflow: 15
---

Volcengine sağlayıcısı, Volcano Engine üzerinde barındırılan Doubao modellerine ve üçüncü taraf modellere erişim sağlar; genel ve kodlama
iş yükleri için ayrı uç noktalar kullanır.

| Ayrıntı    | Değer                                              |
| ---------- | -------------------------------------------------- |
| Sağlayıcılar | `volcengine` (genel) + `volcengine-plan` (kodlama) |
| Kimlik doğrulama | `VOLCANO_ENGINE_API_KEY`                      |
| API        | OpenAI uyumlu                                      |

## Başlarken

<Steps>
  <Step title="API anahtarını ayarlayın">
    Etkileşimli onboarding çalıştırın:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Bu, tek bir API anahtarından hem genel (`volcengine`) hem de kodlama (`volcengine-plan`) sağlayıcılarını kaydeder.

  </Step>
  <Step title="Varsayılan model ayarlayın">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Etkileşimsiz kurulum için (CI, betikleme), anahtarı doğrudan verin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Sağlayıcılar ve uç noktalar

| Sağlayıcı         | Uç nokta                                  | Kullanım durumu |
| ----------------- | ----------------------------------------- | --------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Genel modeller  |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Kodlama modelleri |

<Note>
Her iki sağlayıcı da tek bir API anahtarından yapılandırılır. Kurulum her ikisini de otomatik kaydeder.
</Note>

## Yerleşik katalog

<Tabs>
  <Tab title="Genel (volcengine)">
    | Model ref                                    | Ad                             | Girdi       | Bağlam  |
    | -------------------------------------------- | ------------------------------ | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                | metin, görsel | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | metin, görsel | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                      | metin, görsel | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                        | metin, görsel | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                  | metin, görsel | 128,000 |
  </Tab>
  <Tab title="Kodlama (volcengine-plan)">
    | Model ref                                         | Ad                       | Girdi | Bağlam  |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | metin | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | metin | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | metin | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | metin | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | metin | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | metin | 256,000 |
  </Tab>
</Tabs>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Onboarding sonrası varsayılan model">
    `openclaw onboard --auth-choice volcengine-api-key` şu anda
    `volcengine-plan/ark-code-latest` modelini varsayılan yaparken aynı zamanda
    genel `volcengine` kataloğunu da kaydeder.
  </Accordion>

  <Accordion title="Model seçici fallback davranışı">
    Onboarding/configure model seçimi sırasında Volcengine auth choice,
    hem `volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller
    henüz yüklenmemişse, OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine
    filtresiz kataloğa fallback yapar.
  </Accordion>

  <Accordion title="Daemon süreçleri için ortam değişkenleri">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa,
    `VOLCANO_ENGINE_API_KEY` değişkeninin bu süreç için kullanılabilir olduğundan emin olun (örneğin
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw'ı arka plan hizmeti olarak çalıştırırken, etkileşimli kabuğunuzda ayarlanan ortam değişkenleri
otomatik olarak devralınmaz. Yukarıdaki daemon notuna bakın.
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Configuration" href="/tr/gateway/configuration" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam config başvurusu.
  </Card>
  <Card title="Troubleshooting" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
  <Card title="FAQ" href="/tr/help/faq" icon="circle-question">
    OpenClaw kurulumu hakkında sık sorulan sorular.
  </Card>
</CardGroup>
