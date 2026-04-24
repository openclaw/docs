---
read_when:
    - OpenCode barındırmalı model erişimi istiyorsunuz
    - Zen ve Go katalogları arasında seçim yapmak istiyorsunuz
summary: OpenClaw ile OpenCode Zen ve Go kataloglarını kullanın
title: OpenCode
x-i18n:
    generated_at: "2026-04-24T09:27:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode, OpenClaw içinde iki barındırılan katalog sunar:

| Katalog | Önek             | Çalışma zamanı sağlayıcısı |
| ------- | ---------------- | -------------------------- |
| **Zen** | `opencode/...`   | `opencode`                 |
| **Go**  | `opencode-go/...` | `opencode-go`             |

Her iki katalog da aynı OpenCode API anahtarını kullanır. OpenClaw, upstream model başına yönlendirmenin doğru kalması için çalışma zamanı sağlayıcı kimliklerini
ayrı tutar, ancak onboarding ve belgeler bunları
tek bir OpenCode kurulumu olarak ele alır.

## Başlarken

<Tabs>
  <Tab title="Zen katalogu">
    **Şunun için en iyisi:** küratörlü OpenCode çoklu model proxy'si (Claude, GPT, Gemini).

    <Steps>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Veya anahtarı doğrudan verin:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Bir Zen modelini varsayılan yapın">
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

  <Tab title="Go katalogu">
    **Şunun için en iyisi:** OpenCode tarafından barındırılan Kimi, GLM ve MiniMax dizisi.

    <Steps>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Veya anahtarı doğrudan verin:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Bir Go modelini varsayılan yapın">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
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

## Config örneği

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Yerleşik kataloglar

### Zen

| Özellik          | Değer                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode`                                                    |
| Örnek modeller   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Özellik          | Değer                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode-go`                                                  |
| Örnek modeller   | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="API anahtarı takma adları">
    `OPENCODE_ZEN_API_KEY`, `OPENCODE_API_KEY` için takma ad olarak da desteklenir.
  </Accordion>

  <Accordion title="Paylaşılan kimlik bilgileri">
    Kurulum sırasında tek bir OpenCode anahtarı girmek, kimlik bilgilerini her iki çalışma zamanı
    sağlayıcısı için saklar. Her kataloğu ayrı ayrı onboard etmeniz gerekmez.
  </Accordion>

  <Accordion title="Faturalandırma ve pano">
    OpenCode'a giriş yapar, faturalandırma bilgilerini eklersiniz ve API anahtarınızı kopyalarsınız. Faturalandırma
    ve katalog kullanılabilirliği OpenCode panosundan yönetilir.
  </Accordion>

  <Accordion title="Gemini replay davranışı">
    Gemini destekli OpenCode ref'leri proxy-Gemini yolunda kalır; bu yüzden OpenClaw,
    yerel Gemini
    replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmeden orada Gemini thought-signature sanitization yapmaya devam eder.
  </Accordion>

  <Accordion title="Gemini olmayan replay davranışı">
    Gemini olmayan OpenCode ref'leri, en az OpenAI uyumlu replay ilkesini korur.
  </Accordion>
</AccordionGroup>

<Tip>
Kurulum sırasında tek bir OpenCode anahtarı girmek, kimlik bilgilerini hem Zen hem de
Go çalışma zamanı sağlayıcıları için saklar; dolayısıyla yalnızca bir kez onboarding yapmanız gerekir.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam config başvurusu.
  </Card>
</CardGroup>
