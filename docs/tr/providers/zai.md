---
read_when:
    - OpenClaw'da Z.AI / GLM modellerini istiyorsunuz
    - Basit bir `ZAI_API_KEY` kurulumuna ihtiyacınız var
summary: OpenClaw ile Z.AI (GLM modelleri) kullanın
title: Z.AI
x-i18n:
    generated_at: "2026-04-24T09:28:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2095be914fa9861c8aad2cb1e2ebe78f6e29183bf041a191205626820d3b71df
    source_path: providers/zai.md
    workflow: 15
---

Z.AI, **GLM** modelleri için API platformudur. GLM için REST API'leri sağlar ve kimlik doğrulama için
API anahtarları kullanır. API anahtarınızı Z.AI konsolunda oluşturun. OpenClaw, `zai` sağlayıcısını
Z.AI API anahtarı ile kullanır.

- Sağlayıcı: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer auth)

## Başlarken

<Tabs>
  <Tab title="Uç noktayı otomatik algıla">
    **Şunlar için en iyisi:** çoğu kullanıcı. OpenClaw, eşleşen Z.AI uç noktasını anahtardan algılar ve doğru base URL'yi otomatik olarak uygular.

    <Steps>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Açık bölgesel uç nokta">
    **Şunlar için en iyisi:** belirli bir Coding Plan veya genel API yüzeyini zorlamak isteyen kullanıcılar.

    <Steps>
      <Step title="Doğru onboarding seçeneğini seçin">
        ```bash
        # Coding Plan Global (Coding Plan kullanıcıları için önerilir)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (Çin bölgesi)
        openclaw onboard --auth-choice zai-coding-cn

        # Genel API
        openclaw onboard --auth-choice zai-global

        # Genel API CN (Çin bölgesi)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Yerleşik katalog

OpenClaw şu anda paketli `zai` sağlayıcısını şu modellerle doldurur:

| Model ref            | Notlar           |
| -------------------- | ---------------- |
| `zai/glm-5.1`        | Varsayılan model |
| `zai/glm-5`          |                  |
| `zai/glm-5-turbo`    |                  |
| `zai/glm-5v-turbo`   |                  |
| `zai/glm-4.7`        |                  |
| `zai/glm-4.7-flash`  |                  |
| `zai/glm-4.7-flashx` |                  |
| `zai/glm-4.6`        |                  |
| `zai/glm-4.6v`       |                  |
| `zai/glm-4.5`        |                  |
| `zai/glm-4.5-air`    |                  |
| `zai/glm-4.5-flash`  |                  |
| `zai/glm-4.5v`       |                  |

<Tip>
GLM modelleri `zai/<model>` biçiminde kullanılabilir (örnek: `zai/glm-5`). Varsayılan paketli model ref'i `zai/glm-5.1`'dir.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Bilinmeyen GLM-5 modellerini ileri çözümleme">
    Bilinmeyen `glm-5*` kimlikleri, kimlik
    geçerli GLM-5 ailesi şekliyle eşleştiğinde `glm-4.7` şablonundan sağlayıcıya ait meta veri sentezleyerek
    paketli sağlayıcı yolunda yine ileri çözülür.
  </Accordion>

  <Accordion title="Araç çağrısı akışı">
    `tool_stream`, Z.AI araç çağrısı akışı için varsayılan olarak etkindir. Devre dışı bırakmak için:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Image understanding">
    Paketli Z.AI plugin'i image understanding kaydeder.

    | Özellik      | Değer       |
    | ------------ | ----------- |
    | Model        | `glm-4.6v`  |

    Image understanding, yapılandırılmış Z.AI auth üzerinden otomatik çözülür — ek
    yapılandırma gerekmez.

  </Accordion>

  <Accordion title="Auth ayrıntıları">
    - Z.AI, API anahtarınızla Bearer auth kullanır.
    - `zai-api-key` onboarding seçeneği, eşleşen Z.AI uç noktasını anahtar önekinden otomatik algılar.
    - Belirli bir API yüzeyini zorlamak istediğinizde açık bölgesel seçenekleri (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) kullanın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="GLM model family" href="/tr/providers/glm" icon="microchip">
    GLM için model ailesi genel bakışı.
  </Card>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
</CardGroup>
