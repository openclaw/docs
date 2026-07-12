---
read_when:
    - OpenCode tarafından barındırılan modellere erişmek istiyorsunuz
    - Zen ve Go katalogları arasında seçim yapmak istiyorsunuz
summary: OpenCode Zen ve Go kataloglarını OpenClaw ile kullanın
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T12:40:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode, OpenClaw'da barındırılan iki katalog sunar:

| Katalog | Önek              | Çalışma zamanı sağlayıcısı |
| ------- | ----------------- | -------------------------- |
| **Zen** | `opencode/...`    | `opencode`                 |
| **Go**  | `opencode-go/...` | `opencode-go`              |

Her iki katalog da tek bir OpenCode API anahtarını (`OPENCODE_API_KEY`, diğer adı
`OPENCODE_ZEN_API_KEY`) paylaşır. OpenClaw, üst sistemde model başına yönlendirmenin
doğru kalması için çalışma zamanı sağlayıcı kimliklerini ayrı tutar; ancak ilk
kurulum ve dokümantasyon bunları tek bir OpenCode kurulumu olarak ele alır.

## Başlarken

<Tabs>
  <Tab title="Zen kataloğu">
    **En uygun olduğu alan:** özenle seçilmiş OpenCode çok modelli proxy'si (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

    <Steps>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Alternatif olarak anahtarı doğrudan iletin:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Bir Zen modelini varsayılan olarak ayarlayın">
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
    **En uygun olduğu alan:** OpenCode tarafından barındırılan Kimi, GLM, MiniMax, Qwen ve DeepSeek model seçenekleri.

    <Steps>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Alternatif olarak anahtarı doğrudan iletin:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Bir Go modelini varsayılan olarak ayarlayın">
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

| Özellik                   | Değer                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode`                                                                                    |
| Örnek modeller            | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

`opencode/big-pickle` ve `opencode/deepseek-v4-flash-free` gibi ücretsiz katman
satırlarını da içeren güncel listenin tamamı için
`openclaw models list --provider opencode` komutunu çalıştırın.

### Go

| Özellik                   | Değer                                                                    |
| ------------------------- | ------------------------------------------------------------------------ |
| Çalışma zamanı sağlayıcısı | `opencode-go`                                                            |
| Örnek modeller            | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Go model tablosunun tamamı için [OpenCode Go](/tr/providers/opencode-go) sayfasına bakın.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="API anahtarı diğer adları">
    `OPENCODE_ZEN_API_KEY`, `OPENCODE_API_KEY` için bir diğer ad olarak da kabul edilir.
  </Accordion>

  <Accordion title="Paylaşılan kimlik bilgileri">
    Kurulum sırasında tek bir OpenCode anahtarı girildiğinde her iki çalışma zamanı
    sağlayıcısının kimlik bilgileri de kaydedilir. Her katalog için ayrı ayrı ilk
    kurulum yapmanız gerekmez.
  </Accordion>

  <Accordion title="API anahtarı edinme">
    Bir OpenCode hesabı oluşturun ve
    [opencode.ai/auth](https://opencode.ai/auth) adresinde bir API anahtarı üretin.
    Faturalandırma ve katalog kullanılabilirliği OpenCode kontrol panelinden yönetilir.
  </Accordion>

  <Accordion title="Gemini yeniden oynatma davranışı">
    Gemini tabanlı OpenCode referansları proxy-Gemini yolunda kalır; böylece OpenClaw,
    yerel Gemini yeniden oynatma doğrulamasını veya önyükleme yeniden yazımlarını
    etkinleştirmeden Gemini düşünce imzası temizliğini bu yolda sürdürür.
  </Accordion>

  <Accordion title="Gemini dışı yeniden oynatma davranışı">
    Gemini dışı OpenCode referansları, asgari OpenAI uyumlu yeniden oynatma politikasını korur.
  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/tr/providers/opencode-go" icon="server">
    Go kataloğunun tam referansı.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam yapılandırma referansı.
  </Card>
</CardGroup>
