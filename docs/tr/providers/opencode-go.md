---
read_when:
    - OpenCode Go kataloğunu istiyorsunuz
    - Go üzerinde barındırılan modeller için çalışma zamanı model referanslarına ihtiyacınız var
summary: Paylaşılan OpenCode kurulumuyla OpenCode Go kataloğunu kullanın
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T12:44:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go, [OpenCode](/tr/providers/opencode) içindeki Go kataloğudur. Zen kataloğuyla
aynı `OPENCODE_API_KEY` kimlik bilgisini paylaşır, ancak üst sistemde model başına
yönlendirmenin doğru kalması için kendi çalışma zamanı sağlayıcı kimliğini (`opencode-go`)
kullanır.

| Özellik                    | Değer                                              |
| -------------------------- | -------------------------------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode-go`                                      |
| Kimlik doğrulama           | `OPENCODE_API_KEY` (diğer ad: `OPENCODE_ZEN_API_KEY`) |
| Üst kurulum                | [OpenCode](/tr/providers/opencode)                    |

## Başlarken

<Tabs>
  <Tab title="Etkileşimli">
    <Steps>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice opencode-go
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

## Yerleşik katalog

Güncel model listesi için `openclaw models list --provider opencode-go` komutunu çalıştırın.
Paketle gelen satırlar:

| Model referansı                 | Ad                | Bağlam     | En fazla çıktı | Görüntü girdisi |
| ------------------------------- | ----------------- | ---------- | --------------- | --------------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M         | 384K            | Hayır           |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M         | 384K            | Hayır           |
| `opencode-go/glm-5`             | GLM-5             | 202,752    | 32,768          | Hayır           |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752    | 32,768          | Hayır           |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M         | 131,072         | Hayır           |
| `opencode-go/hy3-preview`       | HY3 Önizleme      | 262,144    | 32,768          | Hayır           |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144    | 65,536          | Evet            |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144    | 65,536          | Evet            |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144    | 262,144         | Evet            |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M         | 128,000         | Evet            |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576  | 128,000         | Hayır           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800    | 65,536          | Hayır           |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800    | 131,072         | Hayır           |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800    | 131,072         | Hayır           |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144    | 65,536          | Evet            |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144    | 65,536          | Evet            |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M         | 65,536          | Hayır           |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M         | 65,536          | Evet            |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yönlendirme davranışı">
    OpenClaw, tüm `opencode-go/...` model referanslarını otomatik olarak yönlendirir.
    Ek sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Çalışma zamanı referansı kuralı">
    Çalışma zamanı referansları açık biçimde kalır: Zen için `opencode/...`, Go için
    `opencode-go/...`. Bu, her iki katalogda da üst sistemde model başına yönlendirmenin
    doğru kalmasını sağlar.
  </Accordion>

  <Accordion title="Paylaşılan kimlik bilgileri">
    Tek bir `OPENCODE_API_KEY`, hem Zen hem de Go kataloglarını kapsar. Kurulum sırasında
    anahtarın girilmesi, her iki çalışma zamanı sağlayıcısının kimlik bilgilerini saklar.
  </Accordion>
</AccordionGroup>

<Tip>
Paylaşılan ilk kurulumun genel görünümü ve Zen + Go katalog referansının tamamı için
[OpenCode](/tr/providers/opencode) sayfasına bakın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="OpenCode (üst sağlayıcı)" href="/tr/providers/opencode" icon="server">
    Paylaşılan ilk kurulum, katalog genel görünümü ve gelişmiş notlar.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıların ve model referanslarının seçilmesi ile yük devretme davranışı.
  </Card>
</CardGroup>
