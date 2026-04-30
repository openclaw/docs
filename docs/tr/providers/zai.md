---
read_when:
    - OpenClaw’da Z.AI / GLM modellerini kullanmak istiyorsunuz
    - Basit bir ZAI_API_KEY kurulumu gerekir
summary: OpenClaw ile Z.AI (GLM modelleri) kullanın
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T09:42:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI, **GLM** modelleri için API platformudur. GLM için REST API'leri sağlar ve kimlik doğrulama için API anahtarları kullanır.
API anahtarınızı Z.AI konsolunda oluşturun. OpenClaw, Z.AI API anahtarıyla `zai` sağlayıcısını kullanır.

- Sağlayıcı: `zai`
- Kimlik doğrulama: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer kimlik doğrulaması)

## Başlarken

<Tabs>
  <Tab title="Auto-detect endpoint">
    **En uygun olduğu durum:** çoğu kullanıcı. OpenClaw, anahtardan eşleşen Z.AI uç noktasını algılar ve doğru temel URL'yi otomatik olarak uygular.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **En uygun olduğu durum:** belirli bir Coding Plan veya genel API yüzeyini zorunlu kılmak isteyen kullanıcılar.

    <Steps>
      <Step title="Pick the right onboarding choice">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Yerleşik katalog

OpenClaw şu anda birlikte gelen `zai` sağlayıcısını şunlarla başlatır:

| Model ref'i         | Notlar          |
| -------------------- | ------------- |
| `zai/glm-5.1`        | Varsayılan model |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
GLM modelleri `zai/<model>` olarak kullanılabilir (örnek: `zai/glm-5`). Varsayılan birlikte gelen model ref'i `zai/glm-5.1` değeridir.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    Bilinmeyen `glm-5*` kimlikleri, kimlik mevcut GLM-5 ailesi biçimiyle
    eşleştiğinde `glm-4.7` şablonundan sağlayıcıya ait meta veriler
    sentezlenerek birlikte gelen sağlayıcı yolunda yine de ileriye dönük çözümlenir.
  </Accordion>

  <Accordion title="Tool-call streaming">
    Z.AI araç çağrısı akışı için `tool_stream` varsayılan olarak etkindir. Devre dışı bırakmak için:

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

  <Accordion title="Thinking and preserved thinking">
    Z.AI düşünme davranışı OpenClaw'ın `/think` kontrollerini izler. Düşünme kapalıyken,
    OpenClaw görünür metinden önce çıktı bütçesini `reasoning_content` üzerinde harcayan
    yanıtları önlemek için `thinking: { type: "disabled" }` gönderir.

    Korunan düşünme isteğe bağlıdır, çünkü Z.AI tam geçmiş
    `reasoning_content` içeriğinin yeniden oynatılmasını gerektirir; bu da istem token'larını artırır. Bunu
    model başına etkinleştirin:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Etkinleştirildiğinde ve düşünme açıkken, OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` gönderir ve aynı OpenAI uyumlu transkript için önceki
    `reasoning_content` içeriğini yeniden oynatır.

    Gelişmiş kullanıcılar, tam sağlayıcı yükünü
    `params.extra_body.thinking` ile yine de geçersiz kılabilir.

  </Accordion>

  <Accordion title="Image understanding">
    Birlikte gelen Z.AI Plugin, görüntü anlamayı kaydeder.

    | Özellik      | Değer       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Görüntü anlama, yapılandırılmış Z.AI kimlik doğrulamasından otomatik olarak çözümlenir; ek
    yapılandırma gerekmez.

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI, API anahtarınızla Bearer kimlik doğrulaması kullanır.
    - `zai-api-key` onboarding seçeneği, anahtar önekinden eşleşen Z.AI uç noktasını otomatik olarak algılar.
    - Belirli bir API yüzeyini zorunlu kılmak istediğinizde açık bölgesel seçenekleri (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) kullanın.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="GLM model family" href="/tr/providers/glm" icon="microchip">
    GLM için model ailesi genel bakışı.
  </Card>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
</CardGroup>
