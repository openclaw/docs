---
read_when:
    - OpenClaw'da Z.AI / GLM modellerini kullanmak istiyorsunuz
    - Basit bir ZAI_API_KEY yapılandırmasına ihtiyacınız var
summary: OpenClaw ile Z.AI (GLM modelleri) kullanma
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T12:42:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI, **GLM** modelleri için API platformudur. GLM için REST API'leri sağlar ve
kimlik doğrulama amacıyla API anahtarlarını kullanır. API anahtarınızı Z.AI konsolunda oluşturun.
OpenClaw, bir Z.AI API anahtarıyla `zai` sağlayıcısını kullanır.

| Özellik       | Değer                                        |
| ------------- | -------------------------------------------- |
| Sağlayıcı     | `zai`                                        |
| Paket         | `@openclaw/zai-provider`                     |
| Kimlik doğrulama | `ZAI_API_KEY` (eski takma ad: `Z_AI_API_KEY`) |
| API           | Z.AI Sohbet Tamamlamaları (Bearer kimlik doğrulaması) |

## GLM modelleri

GLM ayrı bir sağlayıcı değil, bir model ailesidir. OpenClaw'da GLM modelleri
`zai/glm-5.2` gibi başvurular kullanır: sağlayıcı `zai`, model kimliği `glm-5.2`.

## Başlarken

Önce sağlayıcı pluginini yükleyin:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Uç noktayı otomatik algıla">
    **En uygun olduğu kullanıcılar:** çoğu kullanıcı. OpenClaw, API anahtarınızla desteklenen Z.AI uç noktalarını sınar ve doğru temel URL'yi otomatik olarak uygular.

    <Steps>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Modelin listelendiğini doğrulayın">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Bölgesel uç noktayı açıkça belirt">
    **En uygun olduğu kullanıcılar:** belirli bir Coding Plan veya genel API yüzeyini zorunlu kılmak isteyen kullanıcılar.

    <Steps>
      <Step title="Doğru ilk kurulum seçeneğini belirleyin">
        ```bash
        # Coding Plan Global (Coding Plan kullanıcıları için önerilir)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (Çin bölgesi)
        openclaw onboard --auth-choice zai-coding-cn

        # Genel API
        openclaw onboard --auth-choice zai-global

        # Genel API CN (Çin bölgesi)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Modelin listelendiğini doğrulayın">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### Uç noktalar

| İlk kurulum seçeneği | Temel URL                                     | Varsayılan model |
| -------------------- | --------------------------------------------- | ---------------- |
| `zai-global`         | `https://api.z.ai/api/paas/v4`                | `glm-5.1`        |
| `zai-cn`             | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`        |
| `zai-coding-global`  | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`        |
| `zai-coding-cn`      | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`        |

`zai-api-key`, anahtarınızı her uç noktanın sohbet tamamlama API'sinde sınayarak,
önce genel uç noktaları (`zai-global`, ardından `zai-cn`), sonra Coding Plan
uç noktalarını (`zai-coding-global`, ardından `zai-coding-cn`) kontrol eder ve
isteği kabul eden ilk uç noktada durarak bu dört seçenekten birini otomatik algılar.
Anahtarınız her ikisinde de çalışıyorsa bir Coding Plan uç noktasını zorunlu kılmak için
açık bir `--auth-choice` kullanın.

## Yapılandırma örneği

<Tip>
`zai-api-key`, OpenClaw'un anahtardan eşleşen Z.AI uç noktasını algılamasını ve
doğru temel URL'yi otomatik olarak uygulamasını sağlar. Belirli bir Coding Plan
veya genel API yüzeyini zorunlu kılmak istediğinizde açık bölgesel seçenekleri kullanın.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2, Coding Plan uç noktasını kullanır.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Yerleşik katalog

`zai` sağlayıcı plugini, kataloğunu plugin bildiriminde sunar; böylece salt okunur
listeleme, sağlayıcı çalışma zamanını yüklemeden bilinen GLM satırlarını gösterebilir:

```bash
openclaw models list --all --provider zai
```

Bildirime dayalı katalog şu anda şunları içerir:

| Model başvurusu       | Notlar                                  |
| --------------------- | --------------------------------------- |
| `zai/glm-5.2`         | Coding Plan varsayılanı; 1M bağlam      |
| `zai/glm-5.1`         | Genel API varsayılanı                   |
| `zai/glm-5`           |                                         |
| `zai/glm-5-turbo`     |                                         |
| `zai/glm-5v-turbo`    |                                         |
| `zai/glm-4.7`         |                                         |
| `zai/glm-4.7-flash`   |                                         |
| `zai/glm-4.7-flashx`  |                                         |
| `zai/glm-4.6`         |                                         |
| `zai/glm-4.6v`        |                                         |
| `zai/glm-4.5`         |                                         |
| `zai/glm-4.5-air`     |                                         |
| `zai/glm-4.5-flash`   |                                         |
| `zai/glm-4.5v`        |                                         |

<Tip>
GLM modelleri `zai/<model>` biçiminde kullanılabilir (örnek: `zai/glm-5`).
</Tip>

<Note>
Coding Plan kurulumu varsayılan olarak `zai/glm-5.2` kullanır; genel API kurulumu
`zai/glm-5.1` modelini korur. Coding Plan uç noktalarında otomatik algılama,
anahtar/plan GLM-5.2'yi sunmadığında önce `glm-5.1`, ardından `glm-4.7` modeline
geri döner. GLM sürümleri ve kullanılabilirlik değişebilir; yüklü sürümünüzün
bildiği kataloğu görmek için `openclaw models list --all --provider zai` komutunu çalıştırın.
</Note>

## Düşünme düzeyleri

<Tabs>
  <Tab title="GLM-5.2">
    Tam aralık: `off`, `low`, `high`, `max` (varsayılan `off`). OpenClaw,
    istek yükündeki `reasoning_effort` aracılığıyla `low` ve `high` düzeylerini
    Z.AI'ın `high` akıl yürütme çabasına, `max` düzeyini ise Z.AI'ın `max`
    çabasına eşler.
  </Tab>
  <Tab title="Diğer GLM modelleri">
    Yalnızca ikili geçiş: `off` ve `low` (seçicilerde `on` olarak gösterilir);
    varsayılan `off`. Düşünmeyi `off` olarak ayarlamak
    `thinking: { type: "disabled" }` gönderir; diğer düzeyler istek yükünü
    değiştirmeden bırakır (Z.AI'ın kendi varsayılan akıl yürütme davranışı uygulanır).
  </Tab>
</Tabs>

Düşünmeyi `off` olarak ayarlamak, görünür metinden önce çıktı bütçesini
`reasoning_content` için harcayan yanıtları önler.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Bilinmeyen GLM-5 modellerini ileriye dönük çözümleme">
    Bilinmeyen `glm-5*` kimlikleri, kimlik geçerli GLM-5 ailesi biçimiyle
    eşleştiğinde `glm-4.7` şablonundan sağlayıcıya ait meta veriler sentezlenerek
    sağlayıcı yolunda ileriye dönük olarak çözümlenmeye devam eder.
  </Accordion>

  <Accordion title="Araç çağrısı akışı">
    Z.AI araç çağrısı akışı için `tool_stream` varsayılan olarak etkindir. Devre dışı bırakmak için:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Korunan düşünme">
    Z.AI, geçmişteki `reasoning_content` içeriğinin tamamının yeniden oynatılmasını
    gerektirdiğinden ve bu işlem istem belirteçlerini artırdığından, korunan düşünme
    açıkça etkinleştirilmelidir. Model başına etkinleştirin:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Etkinleştirildiğinde ve düşünme açıkken OpenClaw,
    `thinking: { type: "enabled", clear_thinking: false }` gönderir ve aynı
    OpenAI uyumlu transkript için önceki `reasoning_content` içeriğini yeniden oynatır.
    Alt çizgili `preserve_thinking` parametre anahtarı da takma ad olarak çalışır.

    İleri düzey kullanıcılar, sağlayıcı yükünü tam olarak
    `params.extra_body.thinking` ile geçersiz kılmaya devam edebilir.

  </Accordion>

  <Accordion title="Görüntü anlama">
    Z.AI plugini görüntü anlamayı kaydeder.

    | Özellik | Değer      |
    | ------- | ---------- |
    | Model   | `glm-4.6v` |

    Görüntü anlama, yapılandırılmış Z.AI kimlik doğrulamasından otomatik olarak
    çözümlenir; ek yapılandırma gerekmez.

  </Accordion>

  <Accordion title="Kimlik doğrulama ayrıntıları">
    - Z.AI, API anahtarınızla Bearer kimlik doğrulaması kullanır.
    - `zai-api-key` ilk kurulum seçeneği, anahtarınızla desteklenen uç noktaları sınayarak eşleşen Z.AI uç noktasını otomatik olarak algılar.
    - Belirli bir API yüzeyini zorunlu kılmak istediğinizde açık bölgesel seçenekleri (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) kullanın.
    - Eski `Z_AI_API_KEY` ortam değişkeni hâlâ kabul edilir; `ZAI_API_KEY` ayarlanmamışsa OpenClaw başlangıçta bunu `ZAI_API_KEY` değişkenine kopyalar.

  </Accordion>
</AccordionGroup>

## İlgili konular

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ve model ayarları dâhil eksiksiz OpenClaw yapılandırma şeması.
  </Card>
</CardGroup>
