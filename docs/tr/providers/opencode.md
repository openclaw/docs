---
read_when:
    - OpenCode tarafından barındırılan model erişimini istiyorsunuz
    - Zen ve Go katalogları arasında seçim yapmak istiyorsunuz
summary: OpenClaw ile OpenCode Zen ve Go kataloglarını kullanın
title: OpenCode
x-i18n:
    generated_at: "2026-04-12T23:32:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a68444d8c403c3caba4a18ea47f078c7a4c163f874560e1fad0e818afb6e0e60
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode, OpenClaw içinde iki barındırılan katalog sunar:

| Catalog | Prefix            | Runtime provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Her iki katalog da aynı OpenCode API anahtarını kullanır. OpenClaw, yukarı akış model başına yönlendirmenin doğru kalması için çalışma zamanı sağlayıcı kimliklerini ayrı tutar, ancak onboarding ve belgeler bunları tek bir OpenCode kurulumu olarak ele alır.

## Başlangıç

<Tabs>
  <Tab title="Zen catalog">
    **Şunun için en iyisi:** özenle hazırlanmış OpenCode çok modelli proxy (Claude, GPT, Gemini).

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

  <Tab title="Go catalog">
    **Şunun için en iyisi:** OpenCode tarafından barındırılan Kimi, GLM ve MiniMax serisi.

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
      <Step title="Varsayılan olarak bir Go modeli ayarlayın">
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

## Yapılandırma örneği

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Kataloglar

### Zen

| Property         | Value                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode`                                                     |
| Örnek modeller   | `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro` |

### Go

| Property         | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Çalışma zamanı sağlayıcısı | `opencode-go`                                                  |
| Örnek modeller   | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="API anahtarı takma adları">
    `OPENCODE_ZEN_API_KEY`, `OPENCODE_API_KEY` için bir takma ad olarak da desteklenir.
  </Accordion>

  <Accordion title="Paylaşılan kimlik bilgileri">
    Kurulum sırasında tek bir OpenCode anahtarı girmek, her iki çalışma zamanı
    sağlayıcısı için de kimlik bilgilerini depolar. Her kataloğu ayrı ayrı onboarding yapmanız gerekmez.
  </Accordion>

  <Accordion title="Faturalandırma ve pano">
    OpenCode'da oturum açar, faturalandırma bilgilerini eklersiniz ve API anahtarınızı kopyalarsınız. Faturalandırma
    ve katalog kullanılabilirliği OpenCode panosundan yönetilir.
  </Accordion>

  <Accordion title="Gemini replay davranışı">
    Gemini destekli OpenCode başvuruları proxy-Gemini yolunda kalır, bu nedenle OpenClaw
    orada yerel Gemini replay doğrulamasını veya önyükleme yeniden yazımlarını etkinleştirmeden
    Gemini thought-signature temizliğini korur.
  </Accordion>

  <Accordion title="Gemini dışı replay davranışı">
    Gemini dışı OpenCode başvuruları en düşük düzeyde OpenAI uyumlu replay ilkesini korur.
  </Accordion>
</AccordionGroup>

<Tip>
Kurulum sırasında tek bir OpenCode anahtarı girmek, hem Zen hem de
Go çalışma zamanı sağlayıcıları için kimlik bilgilerini depolar, bu yüzden yalnızca bir kez onboarding yapmanız yeterlidir.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve devralma davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
