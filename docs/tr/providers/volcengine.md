---
read_when:
    - OpenClaw ile Volcano Engine veya Doubao modellerini kullanmak istiyorsunuz
    - Volcengine API key kurulumuna ihtiyacınız var
summary: Volcano Engine kurulumu (Doubao modelleri, genel + kodlama uç noktaları)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-12T23:33:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a21f390da719f79c88c6d55a7d952d35c2ce5ff26d910c9f10020132cd7d2f4c
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Volcengine sağlayıcısı, hem genel hem de kodlama
iş yükleri için ayrı uç noktalarla Volcano Engine üzerinde barındırılan Doubao modellerine ve üçüncü taraf modellere erişim sağlar.

| Ayrıntı    | Değer                                              |
| --------- | --------------------------------------------------- |
| Sağlayıcılar | `volcengine` (genel) + `volcengine-plan` (kodlama) |
| Kimlik doğrulama | `VOLCANO_ENGINE_API_KEY`                           |
| API       | OpenAI uyumlu                                      |

## Başlangıç

<Steps>
  <Step title="API anahtarını ayarlayın">
    Etkileşimli başlangıç kurulumunu çalıştırın:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Bu, tek bir API anahtarından hem genel (`volcengine`) hem de kodlama (`volcengine-plan`) sağlayıcılarını kaydeder.

  </Step>
  <Step title="Varsayılan bir model ayarlayın">
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
Etkileşimsiz kurulum için (CI, betikler) anahtarı doğrudan iletin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Sağlayıcılar ve uç noktalar

| Sağlayıcı         | Uç nokta                                 | Kullanım alanı  |
| ----------------- | ---------------------------------------- | --------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Genel modeller  |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Kodlama modelleri |

<Note>
Her iki sağlayıcı da tek bir API anahtarından yapılandırılır. Kurulum her ikisini de otomatik olarak kaydeder.
</Note>

## Kullanılabilir modeller

<Tabs>
  <Tab title="Genel (volcengine)">
    | Model ref                                    | Ad                              | Girdi       | Bağlam  |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |
  </Tab>
  <Tab title="Kodlama (volcengine-plan)">
    | Model ref                                         | Ad                       | Girdi | Bağlam  |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000 |
  </Tab>
</Tabs>

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Başlangıç kurulumundan sonra varsayılan model">
    `openclaw onboard --auth-choice volcengine-api-key` şu anda
    varsayılan model olarak `volcengine-plan/ark-code-latest` ayarlar ve aynı zamanda
    genel `volcengine` kataloğunu da kaydeder.
  </Accordion>

  <Accordion title="Model seçici geri dönüş davranışı">
    Başlangıç kurulumunda / model seçimini yapılandırmada, Volcengine kimlik doğrulama seçeneği
    hem `volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz
    yüklenmemişse OpenClaw, boş bir
    sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.
  </Accordion>

  <Accordion title="Daemon süreçleri için ortam değişkenleri">
    Gateway bir daemon olarak çalışıyorsa (`launchd/systemd`), `VOLCANO_ENGINE_API_KEY`
    değerinin bu süreç tarafından kullanılabildiğinden emin olun (örneğin
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw arka plan hizmeti olarak çalıştırıldığında, etkileşimli kabuğunuzda ayarlanan
ortam değişkenleri otomatik olarak devralınmaz. Yukarıdaki daemon notuna bakın.
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Ajanlar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
  <Card title="SSS" href="/tr/help/faq" icon="circle-question">
    OpenClaw kurulumu hakkında sık sorulan sorular.
  </Card>
</CardGroup>
