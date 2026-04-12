---
read_when:
    - OpenClaw'da GLM modellerini istiyorsunuz
    - Model adlandırma kuralına ve kuruluma ihtiyacınız var
summary: GLM model ailesine genel bakış + OpenClaw'da nasıl kullanılır
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-12T23:30:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b38f0896c900fae3cf3458ff99938d73fa46973a057d1dd373ae960cb7d2e9b5
    source_path: providers/glm.md
    workflow: 15
---

# GLM modelleri

GLM, Z.AI platformu üzerinden sunulan bir **model ailesidir** (bir şirket değildir). OpenClaw'da GLM
modellerine `zai` sağlayıcısı ve `zai/glm-5` gibi model kimlikleri üzerinden erişilir.

## Başlangıç

<Steps>
  <Step title="Bir kimlik doğrulama yolu seçin ve onboarding çalıştırın">
    Z.AI planınıza ve bölgenize uygun onboarding seçeneğini seçin:

    | Kimlik doğrulama seçeneği | En iyi kullanım alanı |
    | ----------- | -------- |
    | `zai-api-key` | Uç nokta otomatik algılamalı genel API anahtarı kurulumu |
    | `zai-coding-global` | Coding Plan kullanıcıları (global) |
    | `zai-coding-cn` | Coding Plan kullanıcıları (Çin bölgesi) |
    | `zai-global` | Genel API (global) |
    | `zai-cn` | Genel API (Çin bölgesi) |

    ```bash
    # Örnek: genel otomatik algılama
    openclaw onboard --auth-choice zai-api-key

    # Örnek: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="GLM'yi varsayılan model olarak ayarlayın">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Modellerin kullanılabildiğini doğrulayın">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Yapılandırma örneği

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key`, OpenClaw'ın anahtardan eşleşen Z.AI uç noktasını algılamasına ve
doğru base URL'yi otomatik olarak uygulamasına olanak tanır. Belirli bir Coding Plan veya genel API yüzeyini zorlamak istediğinizde açık bölgesel seçenekleri kullanın.
</Tip>

## Paketlenmiş GLM modelleri

OpenClaw şu anda paketlenmiş `zai` sağlayıcısını şu GLM referanslarıyla başlatır:

| Model           | Model            |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
Varsayılan paketlenmiş model referansı `zai/glm-5.1`'dir. GLM sürümleri ve kullanılabilirliği
değişebilir; en güncel bilgiler için Z.AI belgelerini kontrol edin.
</Note>

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Uç nokta otomatik algılama">
    `zai-api-key` kimlik doğrulama seçeneğini kullandığınızda OpenClaw, doğru Z.AI base URL'sini belirlemek için
    anahtar biçimini inceler. Açık bölgesel seçenekler
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`)
    otomatik algılamayı geçersiz kılar ve uç noktayı doğrudan sabitler.
  </Accordion>

  <Accordion title="Sağlayıcı ayrıntıları">
    GLM modelleri `zai` çalışma zamanı sağlayıcısı tarafından sunulur. Tam sağlayıcı
    yapılandırması, bölgesel uç noktalar ve ek yetenekler için
    [Z.AI sağlayıcı belgeleri](/tr/providers/zai) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Z.AI sağlayıcısı" href="/tr/providers/zai" icon="server">
    Tam Z.AI sağlayıcı yapılandırması ve bölgesel uç noktalar.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
</CardGroup>
