---
read_when:
    - OpenCode Go kataloğunu istiyorsunuz
    - Go ile barındırılan modeller için çalışma zamanı model ref'lerine ihtiyacınız var
summary: OpenCode Go kataloğunu paylaşılan OpenCode kurulumu ile kullanın
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-24T09:27:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70ca7e7c63f95cbb698d5193c2d9fa48576a8d7311dbd7fa4e2f10a42e275a7
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go, [OpenCode](/tr/providers/opencode) içindeki Go kataloğudur.
Zen kataloğuyla aynı `OPENCODE_API_KEY` değerini kullanır, ancak yukarı akış model başına yönlendirmenin doğru kalması için çalışma zamanı
sağlayıcı kimliğini `opencode-go` olarak tutar.

| Özellik            | Değer                        |
| ------------------ | ---------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode-go`          |
| Auth               | `OPENCODE_API_KEY`           |
| Üst kurulum        | [OpenCode](/tr/providers/opencode) |

## Yerleşik katalog

OpenClaw, Go kataloğunu paketlenmiş pi model kayıt defterinden alır. Güncel model listesi için
`openclaw models list --provider opencode-go` çalıştırın.

Paketlenmiş pi kataloğu itibarıyla sağlayıcı şunları içerir:

| Model ref                   | Ad                    |
| --------------------------- | --------------------- |
| `opencode-go/glm-5`         | GLM-5                 |
| `opencode-go/glm-5.1`       | GLM-5.1               |
| `opencode-go/kimi-k2.5`     | Kimi K2.5             |
| `opencode-go/kimi-k2.6`     | Kimi K2.6 (3x limits) |
| `opencode-go/mimo-v2-omni`  | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`   | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`  | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`  | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`  | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`  | Qwen3.6 Plus          |

## Başlangıç

<Tabs>
  <Tab title="Etkileşimli">
    <Steps>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice opencode-go
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

  <Tab title="Etkileşimsiz">
    <Steps>
      <Step title="Anahtarı doğrudan geçin">
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

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yönlendirme davranışı">
    Model ref'i
    `opencode-go/...` kullandığında OpenClaw model başına yönlendirmeyi otomatik olarak yönetir. Ek sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Çalışma zamanı ref sözleşmesi">
    Çalışma zamanı ref'leri açık kalır: Zen için `opencode/...`, Go için `opencode-go/...`.
    Bu, her iki katalogda da yukarı akış model başına yönlendirmenin doğru kalmasını sağlar.
  </Accordion>

  <Accordion title="Paylaşılan kimlik bilgileri">
    Hem Zen hem de Go katalogları için aynı `OPENCODE_API_KEY` kullanılır. Kurulum sırasında
    anahtarı girmek, kimlik bilgilerini her iki çalışma zamanı sağlayıcısı için de saklar.
  </Accordion>
</AccordionGroup>

<Tip>
Paylaşılan onboarding genel bakışı ve tam
Zen + Go katalog başvurusu için [OpenCode](/tr/providers/opencode) sayfasına bakın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="OpenCode (üst)" href="/tr/providers/opencode" icon="server">
    Paylaşılan onboarding, katalog genel bakışı ve gelişmiş notlar.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
</CardGroup>
