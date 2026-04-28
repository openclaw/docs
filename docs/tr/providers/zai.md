---
read_when:
    - OpenClaw’da Z.AI / GLM modellerini istiyorsunuz
    - Basit bir `ZAI_API_KEY` kurulumuna ihtiyacınız var
summary: OpenClaw ile Z.AI (GLM modelleri) kullanın
title: Z.AI
x-i18n:
    generated_at: "2026-04-26T11:39:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI, **GLM** modelleri için API platformudur. GLM için REST API’ler sağlar ve
kimlik doğrulama için API anahtarları kullanır. API anahtarınızı Z.AI konsolunda oluşturun. OpenClaw,
bir Z.AI API anahtarıyla `zai` sağlayıcısını kullanır.

- Sağlayıcı: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer auth)

## Başlangıç

<Tabs>
  <Tab title="Uç noktayı otomatik algıla">
    **En iyisi:** çoğu kullanıcı için. OpenClaw, eşleşen Z.AI uç noktasını anahtardan algılar ve doğru temel URL’yi otomatik olarak uygular.

    <Steps>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Varsayılan model ayarlayın">
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

        # Genel API
        openclaw onboard --auth-choice zai-global

        # Genel API CN (Çin bölgesi)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Varsayılan model ayarlayın">
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

OpenClaw şu anda paketlenmiş `zai` sağlayıcısını şu modellerle başlatır:

| Model başvurusu      | Notlar         |
| -------------------- | -------------- |
| `zai/glm-5.1`        | Varsayılan model |
| `zai/glm-5`          |                |
| `zai/glm-5-turbo`    |                |
| `zai/glm-5v-turbo`   |                |
| `zai/glm-4.7`        |                |
| `zai/glm-4.7-flash`  |                |
| `zai/glm-4.7-flashx` |                |
| `zai/glm-4.6`        |                |
| `zai/glm-4.6v`       |                |
| `zai/glm-4.5`        |                |
| `zai/glm-4.5-air`    |                |
| `zai/glm-4.5-flash`  |                |
| `zai/glm-4.5v`       |                |

<Tip>
GLM modelleri `zai/<model>` olarak kullanılabilir (örnek: `zai/glm-5`). Varsayılan paketlenmiş model başvurusu `zai/glm-5.1`’dir.
</Tip>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Bilinmeyen GLM-5 modellerini ileri çözümleme">
    Bilinmeyen `glm-5*` kimlikleri, kimlik
    geçerli GLM-5 ailesi biçimiyle eşleştiğinde `glm-4.7` şablonundan sağlayıcı sahipliğinde meta veri sentezleyerek paketlenmiş sağlayıcı yolu üzerinde yine ileri çözümleme yapar.
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

  <Accordion title="Thinking ve korunmuş thinking">
    Z.AI thinking, OpenClaw’ın `/think` denetimlerini izler. Thinking kapalıyken,
    OpenClaw görünür metinden önce çıktı bütçesini `reasoning_content` üzerinde
    harcayan yanıtları önlemek için `thinking: { type: "disabled" }` gönderir.

    Korunmuş thinking isteğe bağlıdır; çünkü Z.AI tam geçmiş
    `reasoning_content` değerinin yeniden oynatılmasını gerektirir ve bu da istem token’larını artırır. Bunu
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

    Etkin olduğunda ve thinking açıksa OpenClaw,
    `thinking: { type: "enabled", clear_thinking: false }` gönderir ve aynı OpenAI uyumlu transcript için önceki
    `reasoning_content` değerlerini yeniden oynatır.

    İleri düzey kullanıcılar yine de tam sağlayıcı yükünü
    `params.extra_body.thinking` ile geçersiz kılabilir.

  </Accordion>

  <Accordion title="Görsel anlama">
    Paketlenmiş Z.AI Plugin’i görsel anlamayı kaydeder.

    | Özellik      | Değer        |
    | ------------ | ------------ |
    | Model        | `glm-4.6v`   |

    Görsel anlama, yapılandırılmış Z.AI auth’tan otomatik olarak çözülür — ek
    config gerekmez.

  </Accordion>

  <Accordion title="Auth ayrıntıları">
    - Z.AI, API anahtarınızla Bearer auth kullanır.
    - `zai-api-key` onboarding seçeneği, eşleşen Z.AI uç noktasını anahtar önekinden otomatik algılar.
    - Belirli bir API yüzeyini zorlamak istediğinizde açık bölgesel seçenekleri (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) kullanın.

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
