---
read_when:
    - OpenCode tarafından barındırılan model erişimi istiyorsunuz
    - Zen ve Go katalogları arasında seçim yapmak istiyorsunuz
summary: OpenClaw ile OpenCode Zen ve Go kataloglarını kullanın
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:45:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode, OpenClaw içinde iki barındırılan katalog sunar:

| Katalog | Ön ek             | Çalışma zamanı sağlayıcısı |
| ------- | ----------------- | -------------------------- |
| **Zen** | `opencode/...`    | `opencode`                 |
| **Go**  | `opencode-go/...` | `opencode-go`              |

Her iki katalog da aynı OpenCode API anahtarını kullanır. OpenClaw, yukarı akış model başına yönlendirme doğru kalsın diye çalışma zamanı sağlayıcı kimliklerini
ayrı tutar, ancak ilk kurulum ve dokümantasyon bunları
tek bir OpenCode kurulumu olarak ele alır.

## Başlarken

<Tabs>
  <Tab title="Zen catalog">
    **En uygun kullanım:** seçilmiş OpenCode çok modelli proxy (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Veya anahtarı doğrudan iletin:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **En uygun kullanım:** OpenCode tarafından barındırılan Kimi, GLM ve MiniMax serisi.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Veya anahtarı doğrudan iletin:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
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

| Özellik                   | Değer                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode`                                                                                    |
| Örnek modeller            | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Özellik                   | Değer                                                                    |
| ------------------------- | ------------------------------------------------------------------------ |
| Çalışma zamanı sağlayıcısı | `opencode-go`                                                            |
| Örnek modeller            | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY`, `OPENCODE_API_KEY` için bir diğer ad olarak da desteklenir.
  </Accordion>

  <Accordion title="Shared credentials">
    Kurulum sırasında tek bir OpenCode anahtarı girmek, her iki çalışma zamanı
    sağlayıcısı için kimlik bilgilerini depolar. Her kataloğu ayrı ayrı ilk kurulumdan geçirmeniz gerekmez.
  </Accordion>

  <Accordion title="Billing and dashboard">
    OpenCode'da oturum açar, fatura bilgilerini eklersiniz ve API anahtarınızı kopyalarsınız. Faturalama
    ve katalog kullanılabilirliği OpenCode panosundan yönetilir.
  </Accordion>

  <Accordion title="Gemini replay behavior">
    Gemini destekli OpenCode ref'leri proxy-Gemini yolunda kalır; bu nedenle OpenClaw,
    yerel Gemini replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmeden
    Gemini düşünce imzası temizliğini orada sürdürür.
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    Gemini olmayan OpenCode ref'leri, en düşük düzeyde OpenAI uyumlu replay politikasını korur.
  </Accordion>
</AccordionGroup>

<Tip>
Kurulum sırasında tek bir OpenCode anahtarı girmek, hem Zen hem de
Go çalışma zamanı sağlayıcıları için kimlik bilgilerini depolar; bu nedenle yalnızca bir kez ilk kurulum yapmanız gerekir.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
