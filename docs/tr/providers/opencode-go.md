---
read_when:
    - OpenCode Go kataloğunu istiyorsunuz
    - Go barındırmalı modeller için çalışma zamanı model referanslarına ihtiyacınız var
summary: Paylaşılan OpenCode kurulumu ile OpenCode Go kataloğunu kullanın
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-28T01:11:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go, [OpenCode](/tr/providers/opencode) içindeki Go kataloğudur.
Zen kataloğuyla aynı `OPENCODE_API_KEY` değerini kullanır, ancak yukarı akış model başına yönlendirmenin doğru kalması için çalışma zamanı
sağlayıcı kimliğini `opencode-go` olarak tutar.

| Özellik              | Değer                           |
| -------------------- | ------------------------------- |
| Çalışma zamanı sağlayıcısı | `opencode-go`              |
| Kimlik doğrulama     | `OPENCODE_API_KEY`              |
| Üst kurulum          | [OpenCode](/tr/providers/opencode) |

## Yerleşik katalog

OpenClaw, Go katalog satırlarının çoğunu paketlenmiş OpenClaw model kayıt defterinden alır ve
kayıt defteri yetişene kadar güncel yukarı akış satırlarıyla tamamlar. Güncel model listesi için
`openclaw models list --provider opencode-go` komutunu çalıştırın.

Sağlayıcı şunları içerir:

| Model ref                       | Ad                    |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (3x sınırlar) |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2, 1M tokenlık bağlam penceresi kullanır ve 131K'ye kadar çıktı tokenını destekler.

## Başlarken

<Tabs>
  <Tab title="Etkileşimli">
    <Steps>
      <Step title="İlk katılımı çalıştır">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Bir Go modelini varsayılan olarak ayarla">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Modellerin kullanılabilir olduğunu doğrula">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Etkileşimsiz">
    <Steps>
      <Step title="Anahtarı doğrudan geçir">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Modellerin kullanılabilir olduğunu doğrula">
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
    Model ref değeri `opencode-go/...` kullandığında OpenClaw model başına yönlendirmeyi otomatik olarak yönetir.
    Ek sağlayıcı yapılandırması gerekmez.
  </Accordion>

  <Accordion title="Çalışma zamanı ref kuralı">
    Çalışma zamanı ref değerleri açık kalır: Zen için `opencode/...`, Go için `opencode-go/...`.
    Bu, her iki katalogda da yukarı akış model başına yönlendirmenin doğru kalmasını sağlar.
  </Accordion>

  <Accordion title="Paylaşılan kimlik bilgileri">
    Aynı `OPENCODE_API_KEY`, hem Zen hem de Go katalogları tarafından kullanılır. Kurulum sırasında
    anahtarın girilmesi, her iki çalışma zamanı sağlayıcısı için kimlik bilgilerini saklar.
  </Accordion>
</AccordionGroup>

<Tip>
Paylaşılan ilk katılım genel bakışı ve tam Zen + Go katalog referansı için [OpenCode](/tr/providers/opencode) bölümüne bakın.
</Tip>

## İlgili

<CardGroup cols={2}>
  <Card title="OpenCode (üst)" href="/tr/providers/opencode" icon="server">
    Paylaşılan ilk katılım, katalog genel bakışı ve gelişmiş notlar.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref değerlerini ve yük devretme davranışını seçme.
  </Card>
</CardGroup>
