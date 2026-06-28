---
read_when:
    - OpenCode tarafından barındırılan model erişimini istiyorsunuz
    - Zen ve Go katalogları arasında seçim yapmak istiyorsunuz
summary: OpenClaw ile OpenCode Zen ve Go kataloglarını kullanın
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T13:56:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenCode, OpenClaw içinde iki barındırılan katalog açığa çıkarır:

| Catalog | Prefix            | Runtime provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Her iki katalog da aynı OpenCode API anahtarını kullanır. OpenClaw, yukarı akış model başına yönlendirmenin doğru kalması için çalışma zamanı sağlayıcı kimliklerini
ayrı tutar, ancak onboarding ve belgeler bunları
tek bir OpenCode kurulumu olarak ele alır.

## Başlarken

<Tabs>
  <Tab title="Zen kataloğu">
    **Şunun için en iyisi:** küratörlü OpenCode çok modelli proxy (Claude, GPT, Gemini).

    <Steps>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Veya anahtarı doğrudan verin:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Varsayılan olarak bir Zen modeli ayarlayın">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go kataloğu">
    **Şunun için en iyisi:** OpenCode tarafından barındırılan Kimi, GLM ve MiniMax dizilimi.

    <Steps>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Veya anahtarı doğrudan verin:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Varsayılan olarak bir Go modeli ayarlayın">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Yapılandırma örneği

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Yerleşik kataloglar

### Zen

| Property         | Value                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Runtime provider | `opencode`                                                              |
| Example models   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Property         | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime provider | `opencode-go`                                                            |
| Example models   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="API anahtarı takma adları">
    `OPENCODE_ZEN_API_KEY`, `OPENCODE_API_KEY` için takma ad olarak da desteklenir.
  </Accordion>

  <Accordion title="Paylaşılan kimlik bilgileri">
    Kurulum sırasında tek bir OpenCode anahtarı girildiğinde, kimlik bilgileri her iki çalışma zamanı
    sağlayıcısı için de saklanır. Her kataloğu ayrı ayrı onboard etmeniz gerekmez.
  </Accordion>

  <Accordion title="Faturalandırma ve kontrol paneli">
    OpenCode'da oturum açar, faturalandırma bilgilerinizi eklersiniz ve API anahtarınızı kopyalarsınız. Faturalandırma
    ve katalog kullanılabilirliği OpenCode kontrol panelinden yönetilir.
  </Accordion>

  <Accordion title="Gemini yeniden oynatma davranışı">
    Gemini destekli OpenCode başvuruları proxy-Gemini yolunda kalır, bu yüzden OpenClaw
    yerel Gemini
    yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmeden orada Gemini düşünce-imzası sanitize işlemini korur.
  </Accordion>

  <Accordion title="Gemini olmayan yeniden oynatma davranışı">
    Gemini olmayan OpenCode başvuruları en düşük düzeyde OpenAI uyumlu yeniden oynatma ilkesini korur.
  </Accordion>
</AccordionGroup>

<Tip>
Kurulum sırasında tek bir OpenCode anahtarı girmek, hem Zen hem de
Go çalışma zamanı sağlayıcıları için kimlik bilgilerini saklar; bu yüzden yalnızca bir kez onboard etmeniz yeterlidir.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam config başvurusu.
  </Card>
</CardGroup>
