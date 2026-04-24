---
read_when:
    - OpenClaw içinde GLM modellerini istiyorsunuz
    - Model adlandırma kuralına ve kuruluma ihtiyacınız var
summary: GLM model ailesine genel bakış + OpenClaw içinde nasıl kullanılır
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-24T09:25:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# GLM modelleri

GLM, Z.AI platformu üzerinden sunulan bir **model ailesidir** (bir şirket değildir). OpenClaw içinde GLM
modellerine `zai` sağlayıcısı ve `zai/glm-5` gibi model kimlikleri aracılığıyla erişilir.

## Başlarken

<Steps>
  <Step title="Bir kimlik doğrulama yolu seçin ve ilk kurulumu çalıştırın">
    Z.AI planınıza ve bölgenize uygun ilk kurulum seçimini yapın:

    | Kimlik doğrulama seçimi | En iyi kullanım alanı |
    | ----------- | -------- |
    | `zai-api-key` | Uç nokta otomatik algılamalı genel API anahtarı kurulumu |
    | `zai-coding-global` | Coding Plan kullanıcıları (küresel) |
    | `zai-coding-cn` | Coding Plan kullanıcıları (Çin bölgesi) |
    | `zai-global` | Genel API (küresel) |
    | `zai-cn` | Genel API (Çin bölgesi) |

    ```bash
    # Örnek: genel otomatik algılama
    openclaw onboard --auth-choice zai-api-key

    # Örnek: Coding Plan küresel
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="GLM'yi varsayılan model olarak ayarlayın">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
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
`zai-api-key`, OpenClaw’un anahtardan eşleşen Z.AI uç noktasını algılamasını ve
doğru temel URL’yi otomatik olarak uygulamasını sağlar. Belirli bir Coding Plan
veya genel API yüzeyini zorlamak istediğinizde açık bölgesel seçimleri kullanın.
</Tip>

## Yerleşik katalog

OpenClaw şu anda paketlenmiş `zai` sağlayıcısını şu GLM başvurularıyla başlatır:

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
Varsayılan paketlenmiş model başvurusu `zai/glm-5.1`’dir. GLM sürümleri ve kullanılabilirliği
değişebilir; en güncel bilgiler için Z.AI belgelerini kontrol edin.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Uç nokta otomatik algılama">
    `zai-api-key` kimlik doğrulama seçimini kullandığınızda OpenClaw, doğru Z.AI temel URL’sini belirlemek için
    anahtar biçimini inceler. Açık bölgesel seçimler
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) otomatik algılamayı geçersiz kılar
    ve uç noktayı doğrudan sabitler.
  </Accordion>

  <Accordion title="Sağlayıcı ayrıntıları">
    GLM modelleri `zai` çalışma zamanı sağlayıcısı tarafından sunulur. Tam sağlayıcı
    yapılandırması, bölgesel uç noktalar ve ek yetenekler için
    [Z.AI sağlayıcı belgeleri](/tr/providers/zai) sayfasına bakın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Z.AI sağlayıcısı" href="/tr/providers/zai" icon="server">
    Tam Z.AI sağlayıcı yapılandırması ve bölgesel uç noktalar.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
</CardGroup>
