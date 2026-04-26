---
read_when:
    - OpenCode Go kataloğunu istiyorsunuz
    - Go ile barındırılan modeller için çalışma zamanı model başvurularına ihtiyacınız var
summary: Paylaşılan OpenCode kurulumu ile OpenCode Go kataloğunu kullanın
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-26T11:39:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go, [OpenCode](/tr/providers/opencode) içindeki Go kataloğudur.
Zen kataloğuyla aynı `OPENCODE_API_KEY` anahtarını kullanır, ancak üst akış model başına yönlendirmenin doğru kalması için çalışma zamanı
sağlayıcı kimliğini `opencode-go` olarak korur.

| Özellik          | Değer                           |
| ---------------- | ------------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode-go`         |
| Kimlik doğrulama | `OPENCODE_API_KEY`              |
| Üst kurulum      | [OpenCode](/tr/providers/opencode) |

## Yerleşik katalog

OpenClaw, Go kataloğu satırlarının çoğunu paketlenmiş Pi model kaydından alır ve
kayıt güncellenene kadar güncel üst akış satırlarıyla bunu tamamlar. Geçerli model listesi için
`openclaw models list --provider opencode-go` çalıştırın.

Sağlayıcı şunları içerir:

| Model başvurusu                | Ad                    |
| ------------------------------ | --------------------- |
| `opencode-go/glm-5`            | GLM-5                 |
| `opencode-go/glm-5.1`          | GLM-5.1               |
| `opencode-go/kimi-k2.5`        | Kimi K2.5             |
| `opencode-go/kimi-k2.6`        | Kimi K2.6 (3x sınırlar) |
| `opencode-go/deepseek-v4-pro`  | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash`| DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`     | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`      | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`     | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`     | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`     | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`     | Qwen3.6 Plus          |

## Başlangıç

<Tabs>
  <Tab title="Etkileşimli">
    <Steps>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice opencode-go
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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yönlendirme davranışı">
    OpenClaw, model başvurusu `opencode-go/...` kullandığında model başına yönlendirmeyi otomatik olarak işler.
    Ek bir sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Çalışma zamanı başvuru kuralı">
    Çalışma zamanı başvuruları açık kalır: Zen için `opencode/...`, Go için `opencode-go/...`.
    Bu, her iki katalogda da üst akış model başına yönlendirmenin doğru kalmasını sağlar.
  </Accordion>

  <Accordion title="Paylaşılan kimlik bilgileri">
    Aynı `OPENCODE_API_KEY`, hem Zen hem de Go katalogları tarafından kullanılır. Kurulum sırasında
    anahtar girildiğinde her iki çalışma zamanı sağlayıcısı için kimlik bilgileri depolanır.
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
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
</CardGroup>
