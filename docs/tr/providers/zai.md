---
read_when:
    - OpenClaw’da Z.AI / GLM modellerini kullanmak istiyorsunuz
    - Basit bir ZAI_API_KEY kurulumuna ihtiyacınız var
summary: OpenClaw ile Z.AI (GLM modelleri) kullanma
title: Z.AI
x-i18n:
    generated_at: "2026-06-28T01:14:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI, **GLM** modelleri için API platformudur. GLM için REST API'leri sağlar ve
kimlik doğrulama için API anahtarları kullanır. API anahtarınızı Z.AI konsolunda oluşturun.
OpenClaw, Z.AI API anahtarıyla `zai` sağlayıcısını kullanır.

| Özellik | Değer                                        |
| -------- | -------------------------------------------- |
| Sağlayıcı | `zai`                                        |
| Paket  | `@openclaw/zai-provider`                     |
| Kimlik doğrulama     | `ZAI_API_KEY` (eski takma ad: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (Bearer kimlik doğrulaması)          |

## GLM modelleri

GLM ayrı bir sağlayıcı değil, bir model ailesidir. OpenClaw'da GLM modelleri
`zai/glm-5.2` gibi ref'ler kullanır: sağlayıcı `zai`, model kimliği `glm-5.2`.

## Başlarken

Önce sağlayıcı Plugin'ini yükleyin:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **Şunlar için en iyi:** çoğu kullanıcı. OpenClaw, API anahtarınızla desteklenen Z.AI uç noktalarını yoklar ve doğru temel URL'yi otomatik olarak uygular.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **Şunlar için en iyi:** belirli bir Coding Plan'ı veya genel API yüzeyini zorlamak isteyen kullanıcılar.

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
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Yapılandırma örneği

<Tip>
`zai-api-key`, OpenClaw'un anahtardan eşleşen Z.AI uç noktasını algılamasını ve
doğru temel URL'yi otomatik olarak uygulamasını sağlar. Belirli bir Coding Plan'ı
veya genel API yüzeyini zorlamak istediğinizde açık bölgesel seçimleri kullanın.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Yerleşik katalog

`zai` sağlayıcı Plugin'i kataloğunu Plugin bildiriminde gönderir, böylece salt okunur
listeleme, sağlayıcı çalışma zamanını yüklemeden bilinen GLM satırlarını gösterebilir:

```bash
openclaw models list --all --provider zai
```

Bildirim destekli katalog şu anda şunları içerir:

| Model ref'i            | Notlar                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan varsayılanı; 1M bağlam |
| `zai/glm-5.1`        | Genel API varsayılanı             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
GLM modelleri `zai/<model>` olarak kullanılabilir (örnek: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2, `off`, `low`, `high` ve `max` düşünme seviyelerini destekler. OpenClaw,
`low` ve `high` değerlerini Z.AI yüksek akıl yürütme çabasına, `max` değerini ise en yüksek çabaya eşler.
</Tip>

<Note>
Coding Plan kurulumu varsayılan olarak `zai/glm-5.2` kullanır; genel API kurulumu
`zai/glm-5.1` değerini korur. Uç nokta otomatik algılama, seçili plan GLM-5.2'yi
sunmadığında `glm-5.1` veya `glm-4.7` değerine geri döner. GLM sürümleri ve kullanılabilirliği
değişebilir; yüklü sürümünüzün bildiği kataloğu görmek için
`openclaw models list --all --provider zai` komutunu çalıştırın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    Bilinmeyen `glm-5*` kimlikleri, kimlik geçerli GLM-5 ailesi şekliyle
    eşleştiğinde `glm-4.7` şablonundan sağlayıcıya ait meta veriler
    sentezlenerek sağlayıcı yolunda yine ileriye dönük çözümlenir.
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
    Z.AI düşünmesi, OpenClaw'un `/think` denetimlerini izler. Düşünme kapalıyken
    OpenClaw, görünür metinden önce çıktı bütçesini `reasoning_content` üzerinde
    harcayan yanıtları önlemek için `thinking: { type: "disabled" }` gönderir.

    Korunmuş düşünme isteğe bağlıdır, çünkü Z.AI tam geçmiş
    `reasoning_content` içeriğinin yeniden oynatılmasını gerektirir; bu da istem token'larını artırır. Bunu
    model başına etkinleştirin:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Etkinleştirildiğinde ve düşünme açıkken OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` gönderir ve aynı
    OpenAI uyumlu transkript için önceki `reasoning_content` içeriğini yeniden oynatır.

    Gelişmiş kullanıcılar, tam sağlayıcı yükünü yine
    `params.extra_body.thinking` ile geçersiz kılabilir.

  </Accordion>

  <Accordion title="Image understanding">
    Z.AI Plugin'i görüntü anlama özelliğini kaydeder.

    | Özellik      | Değer       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Görüntü anlama, yapılandırılmış Z.AI kimlik doğrulamasından otomatik olarak çözümlenir;
    ek yapılandırma gerekmez.

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI, API anahtarınızla Bearer kimlik doğrulaması kullanır.
    - `zai-api-key` ilk kurulum seçimi, desteklenen uç noktaları anahtarınızla yoklayarak eşleşen Z.AI uç noktasını otomatik algılar.
    - Belirli bir API yüzeyini zorlamak istediğinizde açık bölgesel seçimleri (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) kullanın.
    - Eski ortam değişkeni `Z_AI_API_KEY` hâlâ kabul edilir; `ZAI_API_KEY` ayarlanmamışsa OpenClaw başlangıçta onu `ZAI_API_KEY` değerine kopyalar.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ve model ayarları dahil tam OpenClaw yapılandırma şeması.
  </Card>
</CardGroup>
