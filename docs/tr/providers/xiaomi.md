---
read_when:
    - Xiaomi MiMo modellerini OpenClaw içinde kullanmak istiyorsunuz
    - '`XIAOMI_API_KEY` ayarına ihtiyacınız var'
summary: Xiaomi MiMo modellerini OpenClaw ile kullanın
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-12T23:33:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd5a526764c796da7e1fff61301bc2ec618e1cf3857894ba2ef4b6dd9c4dc339
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo, **MiMo** modelleri için API platformudur. OpenClaw, Xiaomi'nin
OpenAI uyumlu uç noktasını API anahtarı kimlik doğrulamasıyla kullanır.

| Özellik  | Değer                          |
| -------- | ------------------------------ |
| Sağlayıcı | `xiaomi`                       |
| Auth     | `XIAOMI_API_KEY`               |
| API      | OpenAI uyumlu                  |
| Base URL | `https://api.xiaomimimo.com/v1` |

## Başlangıç

<Steps>
  <Step title="Bir API anahtarı alın">
    [Xiaomi MiMo konsolu](https://platform.xiaomimimo.com/#/console/api-keys) içinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Veya anahtarı doğrudan geçin:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Kullanılabilir modeller

| Model referansı        | Girdi       | Bağlam    | Maksimum çıktı | Reasoning | Notlar        |
| ---------------------- | ----------- | --------- | -------------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192          | Hayır     | Varsayılan model |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000         | Evet      | Geniş bağlam  |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000         | Evet      | Çok modlu     |

<Tip>
Varsayılan model referansı `xiaomi/mimo-v2-flash` değeridir. `XIAOMI_API_KEY` ayarlandığında veya bir auth profili mevcut olduğunda sağlayıcı otomatik olarak enjekte edilir.
</Tip>

## Yapılandırma örneği

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Otomatik enjeksiyon davranışı">
    `xiaomi` sağlayıcısı, `XIAOMI_API_KEY` ortamınızda ayarlandığında veya bir auth profili mevcut olduğunda otomatik olarak enjekte edilir. Model meta verilerini veya base URL'yi geçersiz kılmak istemiyorsanız sağlayıcıyı elle yapılandırmanız gerekmez.
  </Accordion>

  <Accordion title="Model ayrıntıları">
    - **mimo-v2-flash** — hafif ve hızlıdır, genel amaçlı metin görevleri için idealdir. Reasoning desteği yoktur.
    - **mimo-v2-pro** — uzun belge iş yükleri için 1M token bağlam penceresiyle reasoning desteği sunar.
    - **mimo-v2-omni** — hem text hem de image girdilerini kabul eden, reasoning etkin çok modlu modeldir.

    <Note>
    Tüm modeller `xiaomi/` önekini kullanır (örneğin `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Modeller görünmüyorsa `XIAOMI_API_KEY` değerinin ayarlı ve geçerli olduğunu doğrulayın.
    - Gateway bir daemon olarak çalışıyorsa, anahtarın o süreç için erişilebilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden).

    <Warning>
    Yalnızca etkileşimli shell'inizde ayarlanan anahtarlar, daemon tarafından yönetilen Gateway süreçleri tarafından görünmez. Kalıcı erişilebilirlik için `~/.openclaw/.env` veya `env.shellEnv` yapılandırmasını kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration" icon="gear">
    Tam OpenClaw yapılandırma referansı.
  </Card>
  <Card title="Xiaomi MiMo konsolu" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo kontrol paneli ve API anahtarı yönetimi.
  </Card>
</CardGroup>
