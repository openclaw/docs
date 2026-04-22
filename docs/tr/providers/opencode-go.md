---
read_when:
    - OpenCode Go kataloğunu istiyorsunuz
    - Go üzerinde barındırılan modeller için çalışma zamanı model başvurularına ihtiyacınız var
summary: Paylaşılan OpenCode kurulumu ile OpenCode Go kataloğunu kullanın
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-22T04:27:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb03bc609f0dfff2981eac13b67cbcae066184f4606ce54ba24ca6a5737fdae8
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go, [OpenCode](/tr/providers/opencode) içindeki Go kataloğudur.
Zen kataloğuyla aynı `OPENCODE_API_KEY` değerini kullanır, ancak çalışma zamanı
sağlayıcı kimliği olarak `opencode-go` değerini korur; böylece upstream model başına yönlendirme doğru kalır.

| Özellik          | Değer                           |
| ---------------- | ------------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode-go`         |
| Kimlik doğrulama | `OPENCODE_API_KEY`              |
| Üst kurulum      | [OpenCode](/tr/providers/opencode) |

## Desteklenen modeller

OpenClaw, Go kataloğunu paketlenmiş pi model kayıt defterinden alır. Geçerli model listesi için
`openclaw models list --provider opencode-go` çalıştırın.

Paketlenmiş pi kataloğuna göre sağlayıcı şunları içerir:

| Model başvurusu            | Ad                    |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (3x limits) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## Başlarken

<Tabs>
  <Tab title="Etkileşimli">
    <Steps>
      <Step title="Onboarding çalıştırın">
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
    Model başvurusu
    `opencode-go/...` kullandığında OpenClaw model başına yönlendirmeyi otomatik olarak işler. Ek sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Çalışma zamanı başvuru kuralı">
    Çalışma zamanı başvuruları açık kalır: Zen için `opencode/...`, Go için `opencode-go/...`.
    Bu, her iki katalogda da upstream model başına yönlendirmeyi doğru tutar.
  </Accordion>

  <Accordion title="Paylaşılan kimlik bilgileri">
    Aynı `OPENCODE_API_KEY`, hem Zen hem de Go katalogları tarafından kullanılır. Kurulum sırasında
    anahtarın girilmesi, kimlik bilgilerinin her iki çalışma zamanı sağlayıcısı için de saklanmasını sağlar.
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
    Sağlayıcıları, model başvurularını ve geri dönüş davranışını seçme.
  </Card>
</CardGroup>
