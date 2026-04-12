---
read_when:
    - OpenClaw’da Z.AI / GLM modellerini istiyorsunuz
    - Basit bir ZAI_API_KEY kurulumu gerekiyor
summary: OpenClaw ile Z.AI’yi (GLM modelleri) kullanın
title: Z.AI
x-i18n:
    generated_at: "2026-04-12T23:33:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 972b467dab141c8c5126ac776b7cb6b21815c27da511b3f34e12bd9e9ac953b7
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI, **GLM** modelleri için API platformudur. GLM için REST API’leri sağlar ve
kimlik doğrulama için API anahtarları kullanır. API anahtarınızı Z.AI konsolunda oluşturun. OpenClaw,
`zai` sağlayıcısını bir Z.AI API anahtarı ile kullanır.

- Sağlayıcı: `zai`
- Kimlik doğrulama: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer kimlik doğrulaması)

## Başlangıç

<Tabs>
  <Tab title="Uç noktayı otomatik algıla">
    **En iyisi:** çoğu kullanıcı için. OpenClaw, anahtardan eşleşen Z.AI uç noktasını algılar ve doğru temel URL’yi otomatik olarak uygular.

    <Steps>
      <Step title="Onboarding’i çalıştırın">
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
    **En iyisi:** belirli bir Coding Plan veya genel API yüzeyini zorlamak isteyen kullanıcılar için.

    <Steps>
      <Step title="Doğru onboarding seçimini yapın">
        ```bash
        # Coding Plan Global (Coding Plan kullanıcıları için önerilir)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (Çin bölgesi)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (Çin bölgesi)
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

## Paketlenmiş GLM kataloğu

OpenClaw şu anda paketlenmiş `zai` sağlayıcısını şu modellerle başlatır:

| Model başvurusu      | Notlar            |
| -------------------- | ----------------- |
| `zai/glm-5.1`        | Varsayılan model  |
| `zai/glm-5`          |                   |
| `zai/glm-5-turbo`    |                   |
| `zai/glm-5v-turbo`   |                   |
| `zai/glm-4.7`        |                   |
| `zai/glm-4.7-flash`  |                   |
| `zai/glm-4.7-flashx` |                   |
| `zai/glm-4.6`        |                   |
| `zai/glm-4.6v`       |                   |
| `zai/glm-4.5`        |                   |
| `zai/glm-4.5-air`    |                   |
| `zai/glm-4.5-flash`  |                   |
| `zai/glm-4.5v`       |                   |

<Tip>
GLM modelleri `zai/<model>` olarak kullanılabilir (örnek: `zai/glm-5`). Varsayılan paketlenmiş model başvurusu `zai/glm-5.1`’dir.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Bilinmeyen GLM-5 modellerini ileri çözümleme">
    Bilinmeyen `glm-5*` kimlikleri, kimlik geçerli GLM-5 aile şekliyle
    eşleştiğinde `glm-4.7` şablonundan sağlayıcıya ait meta veriler sentezlenerek
    paketlenmiş sağlayıcı yolunda yine de ileri çözülür.
  </Accordion>

  <Accordion title="Araç çağrısı akışı">
    Z.AI araç çağrısı akışı için `tool_stream` varsayılan olarak etkindir. Bunu devre dışı bırakmak için:

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

  <Accordion title="Görüntü anlama">
    Paketlenmiş Z.AI Plugin’i görüntü anlamayı kaydeder.

    | Özellik      | Değer       |
    | ------------ | ----------- |
    | Model        | `glm-4.6v`  |

    Görüntü anlama, yapılandırılmış Z.AI kimlik doğrulamasından otomatik olarak çözülür —
    ek yapılandırma gerekmez.

  </Accordion>

  <Accordion title="Kimlik doğrulama ayrıntıları">
    - Z.AI, API anahtarınızla Bearer kimlik doğrulaması kullanır.
    - `zai-api-key` onboarding seçimi, anahtar önekinden eşleşen Z.AI uç noktasını otomatik algılar.
    - Belirli bir API yüzeyini zorlamak istediğinizde açık bölgesel seçimleri (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) kullanın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="GLM model ailesi" href="/tr/providers/glm" icon="microchip">
    GLM için model ailesine genel bakış.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
</CardGroup>
