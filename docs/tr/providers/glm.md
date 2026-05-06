---
read_when:
    - OpenClaw'da GLM modellerini kullanmak istiyorsunuz
    - Model adlandırma kuralına ve kuruluma ihtiyacınız var
summary: GLM model ailesine genel bakış ve OpenClaw'da nasıl kullanılacağı
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T09:27:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM, [Z.AI](https://z.ai) platformu üzerinden sunulan bir model ailesidir (şirket değil). OpenClaw’da GLM modellerine, `zai/glm-5.1` gibi ref’lerle paketle gelen `zai` sağlayıcısı üzerinden erişilir.

| Özellik            | Değer                                                                       |
| ------------------- | --------------------------------------------------------------------------- |
| Sağlayıcı kimliği         | `zai`                                                                       |
| Plugin              | paketle gelir, `enabledByDefault: true`                                           |
| Kimlik doğrulama env değişkenleri       | `ZAI_API_KEY` veya `Z_AI_API_KEY`                                             |
| Başlangıç seçenekleri  | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                 | OpenAI uyumlu                                                           |
| Varsayılan temel URL    | `https://api.z.ai/api/paas/v4`                                              |
| Önerilen varsayılan   | `zai/glm-5.1`                                                               |
| Varsayılan görüntü modeli | `zai/glm-4.6v`                                                              |

## Başlarken

<Steps>
  <Step title="Bir kimlik doğrulama yolu seçin ve başlangıcı çalıştırın">
    Z.AI planınız ve bölgenizle eşleşen başlangıç seçeneğini seçin. Genel `zai-api-key` seçeneği, anahtar biçiminden eşleşen endpoint’i otomatik algılar; belirli bir Coding Plan veya genel API yüzeyini zorlamak istediğinizde açık bölgesel seçenekleri kullanın.

    | Kimlik doğrulama seçeneği         | En uygun kullanım                                            |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | Endpoint otomatik algılamalı genel API anahtarı        |
    | `zai-coding-global` | Coding Plan kullanıcıları (küresel)                          |
    | `zai-coding-cn`     | Coding Plan kullanıcıları (Çin bölgesi)                    |
    | `zai-global`        | Genel API (küresel)                                |
    | `zai-cn`            | Genel API (Çin bölgesi)                          |

    <CodeGroup>

```bash Auto-detect
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (global)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (China)
openclaw onboard --auth-choice zai-coding-cn
```

```bash General API (global)
openclaw onboard --auth-choice zai-global
```

```bash General API (China)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="GLM’i varsayılan model olarak ayarlayın">
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
  `zai-api-key`, OpenClaw’ın anahtar biçiminden eşleşen Z.AI endpoint’ini algılamasını ve doğru temel URL’yi otomatik olarak uygulamasını sağlar. Belirli bir Coding Plan veya genel API yüzeyini sabitlemek istediğinizde açık bölgesel seçenekleri kullanın.
</Tip>

## Yerleşik katalog

Paketle gelen `zai` sağlayıcısı 13 GLM model ref’i ekler. Aksi belirtilmedikçe tüm girdiler akıl yürütmeyi destekler; `glm-5v-turbo` ve `glm-4.6v` metnin yanı sıra görüntü girdisini de kabul eder.

| Model ref’i            | Notlar                                              |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | Varsayılan model. Akıl yürütme, yalnızca metin, 202k bağlam. |
| `zai/glm-5`          | Akıl yürütme, yalnızca metin, 202k bağlam.                |
| `zai/glm-5-turbo`    | Akıl yürütme, yalnızca metin, 202k bağlam.                |
| `zai/glm-5v-turbo`   | Akıl yürütme, metin + görüntü, 202k bağlam.             |
| `zai/glm-4.7`        | Akıl yürütme, yalnızca metin, 204k bağlam.                |
| `zai/glm-4.7-flash`  | Akıl yürütme, yalnızca metin, 200k bağlam.                |
| `zai/glm-4.7-flashx` | Akıl yürütme, yalnızca metin.                              |
| `zai/glm-4.6`        | Akıl yürütme, yalnızca metin.                              |
| `zai/glm-4.6v`       | Akıl yürütme, metin + görüntü. Varsayılan görüntü modeli.      |
| `zai/glm-4.5`        | Akıl yürütme, yalnızca metin.                              |
| `zai/glm-4.5-air`    | Akıl yürütme, yalnızca metin.                              |
| `zai/glm-4.5-flash`  | Akıl yürütme, yalnızca metin.                              |
| `zai/glm-4.5v`       | Akıl yürütme, metin + görüntü.                           |

<Note>
  GLM sürümleri ve kullanılabilirlik değişebilir. Kurulu sürümünüzün bildiği katalog satırlarını görmek için `openclaw models list --provider zai` çalıştırın ve yeni eklenen ya da kullanımdan kaldırılan modeller için Z.AI belgelerini kontrol edin.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Endpoint otomatik algılama">
    `zai-api-key` kimlik doğrulama seçeneğini kullandığınızda OpenClaw, doğru Z.AI temel URL’sini belirlemek için anahtar biçimini inceler. Açık bölgesel seçenekler (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) otomatik algılamayı geçersiz kılar ve endpoint’i doğrudan sabitler.
  </Accordion>

  <Accordion title="Sağlayıcı ayrıntıları">
    GLM modelleri `zai` çalışma zamanı sağlayıcısı tarafından sunulur. Tam sağlayıcı yapılandırması, bölgesel endpoint’ler ve ek yetenekler için [Z.AI sağlayıcı sayfasına](/tr/providers/zai) bakın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Z.AI sağlayıcısı" href="/tr/providers/zai" icon="server">
    Tam Z.AI sağlayıcı yapılandırması ve bölgesel endpoint’ler.
  </Card>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref’lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Düşünme modları" href="/tr/tools/thinking" icon="brain">
    Akıl yürütme yetenekli GLM ailesi için `/think` seviyeleri.
  </Card>
  <Card title="Modeller SSS" href="/tr/help/faq-models" icon="circle-question">
    Kimlik doğrulama profilleri, model değiştirme ve "no profile" hatalarını çözme.
  </Card>
</CardGroup>
