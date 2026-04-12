---
read_when:
    - OpenCode Go kataloğunu istiyorsunuz
    - Go üzerinde barındırılan modeller için çalışma zamanı model başvurularına ihtiyacınız var
summary: Paylaşılan OpenCode kurulumu ile OpenCode Go kataloğunu kullanma
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-12T23:32:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f0f182de81729616ccc19125d93ba0445de2349daf7067b52e8c15b9d3539c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go, [OpenCode](/tr/providers/opencode) içindeki Go kataloğudur.
Zen kataloğuyla aynı `OPENCODE_API_KEY` değerini kullanır, ancak yukarı akışta model başına yönlendirme doğru kalsın diye çalışma zamanı
sağlayıcı kimliğini `opencode-go` olarak korur.

| Özellik          | Değer                         |
| ---------------- | ----------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode-go`         |
| Kimlik doğrulama | `OPENCODE_API_KEY`            |
| Üst kurulum      | [OpenCode](/tr/providers/opencode) |

## Desteklenen modeller

| Model başvurusu            | Ad           |
| -------------------------- | ------------ |
| `opencode-go/kimi-k2.5`    | Kimi K2.5    |
| `opencode-go/glm-5`        | GLM 5        |
| `opencode-go/minimax-m2.5` | MiniMax M2.5 |

## Başlangıç

<Tabs>
  <Tab title="Etkileşimli">
    <Steps>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Bir Go modelini varsayılan olarak ayarlayın">
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

  <Tab title="Etkileşimsiz">
    <Steps>
      <Step title="Anahtarı doğrudan iletin">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Yönlendirme davranışı">
    Model başvurusu `opencode-go/...` kullandığında OpenClaw model başına yönlendirmeyi otomatik olarak yönetir.
    Ek sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Çalışma zamanı başvurusu kuralı">
    Çalışma zamanı başvuruları açık kalır: Zen için `opencode/...`, Go için `opencode-go/...`.
    Bu, her iki katalogda da yukarı akış model başına yönlendirmeyi doğru tutar.
  </Accordion>

  <Accordion title="Paylaşılan kimlik bilgileri">
    Hem Zen hem de Go katalogları aynı `OPENCODE_API_KEY` değerini kullanır. Kurulum sırasında
    anahtarı girmek, her iki çalışma zamanı sağlayıcısı için de kimlik bilgilerini depolar.
  </Accordion>
</AccordionGroup>

<Tip>
Paylaşılan onboarding genel bakışı ve tam
Zen + Go katalog başvurusu için [OpenCode](/tr/providers/opencode) bölümüne bakın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="OpenCode (üst)" href="/tr/providers/opencode" icon="server">
    Paylaşılan onboarding, katalog genel bakışı ve gelişmiş notlar.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
</CardGroup>
