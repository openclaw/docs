---
read_when:
    - OpenClaw'ta Xiaomi MiMo modellerini istiyorsunuz
    - '`XIAOMI_API_KEY` kurulumuna ihtiyacınız var'
summary: OpenClaw ile Xiaomi MiMo modellerini kullanma
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-24T09:28:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae61547fa5864f0cd3e19465a8a7d6ff843f9534ab9c2dd39a86a3593cafaa8d
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo, **MiMo** modelleri için API platformudur. OpenClaw, Xiaomi'nin
OpenAI uyumlu uç noktasını API anahtarı kimlik doğrulamasıyla kullanır.

| Özellik | Değer                          |
| -------- | ------------------------------ |
| Sağlayıcı | `xiaomi`                      |
| Kimlik doğrulama | `XIAOMI_API_KEY`       |
| API      | OpenAI uyumlu                 |
| Base URL | `https://api.xiaomimimo.com/v1` |

## Başlangıç

<Steps>
  <Step title="Bir API anahtarı alın">
    [Xiaomi MiMo konsolunda](https://platform.xiaomimimo.com/#/console/api-keys) bir API anahtarı oluşturun.
  </Step>
  <Step title="İlk kullanım akışını çalıştırın">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Veya anahtarı doğrudan verin:

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

## Yerleşik katalog

| Model ref              | Girdi       | Bağlam    | En fazla çıktı | Reasoning | Notlar        |
| ---------------------- | ----------- | --------- | -------------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | metin       | 262,144   | 8,192          | Hayır     | Varsayılan model |
| `xiaomi/mimo-v2-pro`   | metin       | 1,048,576 | 32,000         | Evet      | Geniş bağlam  |
| `xiaomi/mimo-v2-omni`  | metin, görsel | 262,144 | 32,000         | Evet      | Çok modlu     |

<Tip>
Varsayılan model ref'i `xiaomi/mimo-v2-flash` şeklindedir. `XIAOMI_API_KEY` ayarlandığında veya bir kimlik doğrulama profili mevcut olduğunda sağlayıcı otomatik olarak eklenir.
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
  <Accordion title="Otomatik ekleme davranışı">
    `xiaomi` sağlayıcısı, ortamınızda `XIAOMI_API_KEY` ayarlandığında veya bir kimlik doğrulama profili bulunduğunda otomatik olarak eklenir. Model meta verilerini veya base URL'yi geçersiz kılmak istemiyorsanız sağlayıcıyı el ile yapılandırmanız gerekmez.
  </Accordion>

  <Accordion title="Model ayrıntıları">
    - **mimo-v2-flash** — hafif ve hızlıdır; genel amaçlı metin görevleri için idealdir. Reasoning desteği yoktur.
    - **mimo-v2-pro** — uzun belge iş yükleri için 1M token bağlam penceresiyle reasoning desteği sunar.
    - **mimo-v2-omni** — hem metin hem de görsel girdilerini kabul eden, reasoning etkin çok modlu modeldir.

    <Note>
    Tüm modeller `xiaomi/` önekini kullanır (örneğin `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Modeller görünmüyorsa `XIAOMI_API_KEY` değerinin ayarlı ve geçerli olduğunu doğrulayın.
    - Gateway bir daemon olarak çalışıyorsa anahtarın o işlem için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden).

    <Warning>
    Yalnızca etkileşimli shell'inizde ayarlanan anahtarlar, daemon tarafından yönetilen gateway işlemleri tarafından görülemez. Kalıcı kullanılabilirlik için `~/.openclaw/.env` veya `env.shellEnv` yapılandırmasını kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı seçimi, model ref'leri ve failover davranışı.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Tam OpenClaw yapılandırma başvurusu.
  </Card>
  <Card title="Xiaomi MiMo konsolu" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo panosu ve API anahtarı yönetimi.
  </Card>
</CardGroup>
