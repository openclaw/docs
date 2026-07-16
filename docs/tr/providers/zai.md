---
read_when:
    - OpenClaw'da Z.AI / GLM modellerini kullanmak istiyorsunuz
    - Basit bir ZAI_API_KEY yapılandırması gerekiyor
summary: OpenClaw ile Z.AI (GLM modelleri) kullanın
title: Z.AI
x-i18n:
    generated_at: "2026-07-16T17:34:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f7adf0e2f436f9081891013c0092ce4717bf302b2a4a2e997d9561d7d40211a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI, **GLM** modelleri için API platformudur. GLM için REST API'leri sağlar ve
kimlik doğrulama amacıyla API anahtarlarını kullanır. API anahtarınızı Z.AI konsolunda oluşturun.
OpenClaw, Z.AI API anahtarıyla `zai` sağlayıcısını kullanır.

| Özellik  | Değer                                        |
| -------- | -------------------------------------------- |
| Sağlayıcı | `zai`                                        |
| Paket    | `@openclaw/zai-provider`                     |
| Kimlik doğrulama | `ZAI_API_KEY` (eski takma ad: `Z_AI_API_KEY`) |
| API      | Z.AI Sohbet Tamamlamaları (Bearer kimlik doğrulaması)          |

## GLM modelleri

GLM ayrı bir sağlayıcı değil, bir model ailesidir. OpenClaw'da GLM modelleri
`zai/glm-5.2` gibi referanslar kullanır: sağlayıcı `zai`, model kimliği `glm-5.2`.

## Başlarken

Önce sağlayıcı pluginini yükleyin:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Uç noktayı otomatik algıla">
    **En uygun olduğu durum:** çoğu kullanıcı. OpenClaw, API anahtarınızla desteklenen Z.AI uç noktalarını yoklar ve doğru temel URL'yi otomatik olarak uygular.

    <Steps>
      <Step title="İlk katılımı çalıştırın">
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

  <Tab title="Açık bölgesel uç nokta">
    **En uygun olduğu durum:** belirli bir Coding Plan veya genel API yüzeyini zorlamak isteyen kullanıcılar.

    <Steps>
      <Step title="Doğru ilk katılım seçeneğini belirleyin">
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

| İlk katılım seçeneği | Temel URL                                     | Varsayılan model |
| -------------------- | --------------------------------------------- | ---------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key`, anahtarınızı her uç noktanın sohbet tamamlamaları API'sine
karşı yoklayarak bu dört seçenekten birini otomatik olarak algılar; Coding Plan
uç noktalarından (`zai-coding-global`, ardından `zai-coding-cn`) önce genel
uç noktaları (`zai-global`, ardından `zai-cn`) denetler ve bir
isteği kabul eden ilk uç noktada durur. Anahtarınız her ikisinde de çalışıyorsa
bir Coding Plan uç noktasını zorlamak için açık bir `--auth-choice` kullanın.

## Hız sınırları ve aşırı yükler

Z.AI, Coding Plan'i ve genel amaçlı aracı araçlarını kapasitesi yönetilen
hizmetler olarak belgeler. Z.AI'ın kendi belgelerine göre:

- [Genel amaçlı aracı araçları](https://docs.z.ai/devpack/tool/others),
  OpenClaw dahil olmak üzere, en iyi çaba esasına göre sunulur. Genellikle
  Singapur saatiyle 14.00-18.00 civarındaki yüksek çıkarım yükü sırasında bazı
  istekler geçici hız sınırlarıyla karşılaşabilir.
- [Coding Plan hız ve eşzamanlılık sınırları](https://docs.z.ai/devpack/usage-policy)
  plan katmanına bağlıdır ve kaynak kullanılabilirliğine göre dinamik olarak
  ayarlanabilir. Yoğun olmayan saatlerde eşzamanlılık daha yüksek olabilir.
- [API hata kodu `1302`](https://docs.z.ai/api-reference/api-code),
  "İstekler için hız sınırına ulaşıldı" anlamına gelir. API hata kodu
  `1305`, "Hizmet geçici olarak aşırı yüklenmiş olabilir, lütfen daha
  sonra yeniden deneyin" anlamına gelir.

Yoğun bir dönemde geçici bir `429` veya `1305` yanıtı
görürseniz bekleyin ve isteği yeniden deneyin. Hatalar yoğun saatler dışında
tekrarlanabiliyorsa veya yalnızca tek bir uç nokta, model ya da istek biçiminde
oluşuyorsa önce yapılandırılmış uç noktayı ve modeli denetleyin:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

Coding Plan anahtarları `https://api.z.ai/api/coding/paas/v4` gibi bir Coding Plan uç noktası;
genel API anahtarları ise `https://api.z.ai/api/paas/v4` gibi bir genel API uç noktası
kullanmalıdır. Aynı anahtar ve uç noktayla kalıcı olarak oluşan hatalar, olağan
yoğun yük kısıtlaması yerine sağlayıcı tarafında bir ret veya plan sınırlaması
olduğunu gösterebilir.

## Yapılandırma örneği

<Tip>
`zai-api-key`, OpenClaw'ın anahtarla eşleşen Z.AI uç noktasını algılamasını
ve doğru temel URL'yi otomatik olarak uygulamasını sağlar. Belirli bir Coding
Plan veya genel API yüzeyini zorlamak istediğinizde açık bölgesel seçenekleri
kullanın.
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

`zai` sağlayıcı plugini, kataloğunu plugin manifestinde sunar;
böylece salt okunur listeleme, sağlayıcı çalışma zamanını yüklemeden bilinen
GLM satırlarını gösterebilir:

```bash
openclaw models list --all --provider zai
```

Manifest destekli katalog şu anda şunları içerir:

| Model referansı      | Notlar                          |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan varsayılanı; 1M bağlam |
| `zai/glm-5.1`        | Genel API varsayılanı           |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
GLM modelleri `zai/<model>` olarak kullanılabilir (örnek: `zai/glm-5`).
</Tip>

<Note>
Coding Plan kurulumu varsayılan olarak `zai/glm-5.2` kullanır; genel API
kurulumu `zai/glm-5.1` değerini korur. Coding Plan uç noktalarında anahtar
veya plan GLM-5.2'yi sunmuyorsa otomatik algılama önce `glm-5.1`,
ardından `glm-4.7` değerine geri döner. GLM sürümleri ve
kullanılabilirliği değişebilir; yüklü sürümünüzün bildiği kataloğu görmek için
`openclaw models list --all --provider zai` komutunu çalıştırın.
</Note>

## Düşünme düzeyleri

<Tabs>
  <Tab title="GLM-5.2">
    Tam aralık: `off`, `low`, `high`, `max` (varsayılan `off`). OpenClaw,
    `low` ve `high` değerlerini istek yükündeki
    `reasoning_effort` aracılığıyla Z.AI'ın `high` akıl yürütme
    çabasına; `max` değerini ise Z.AI'ın `max`
    çabasına eşler.
  </Tab>
  <Tab title="Diğer GLM modelleri">
    Yalnızca ikili geçiş: `off` ve `low` (seçicilerde
    `on` olarak gösterilir), varsayılan `off`.
    Düşünmeyi `off` olarak ayarlamak `thinking: { type: "disabled" }` gönderir;
    diğer tüm düzeyler istek yükünü değiştirmeden bırakır (Z.AI'ın kendi
    varsayılan akıl yürütme davranışı uygulanır).
  </Tab>
</Tabs>

Düşünmeyi `off` olarak ayarlamak, görünür metinden önce çıktı
bütçesini `reasoning_content` için harcayan yanıtlardan kaçınır.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Bilinmeyen GLM-5 modellerini ileriye dönük çözümleme">
    Bilinmeyen `glm-5*` kimlikleri, kimlik mevcut GLM-5 ailesi biçimiyle
    eşleştiğinde `glm-4.7` şablonundan sağlayıcıya ait meta veriler
    sentezlenerek sağlayıcı yolunda yine ileriye dönük çözümlenir.
  </Accordion>

  <Accordion title="Araç çağrısı akışı">
    Z.AI araç çağrısı akışı için `tool_stream` varsayılan olarak etkindir.
    Devre dışı bırakmak için:

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
    Z.AI, `reasoning_content` geçmişinin tamamının yeniden oynatılmasını
    gerektirdiğinden ve bu durum istem belirteçlerini artırdığından korunan
    düşünme isteğe bağlıdır. Model başına etkinleştirin:

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

    Etkinleştirildiğinde ve düşünme açık olduğunda OpenClaw,
    `thinking: { type: "enabled", clear_thinking: false }` gönderir ve aynı OpenAI uyumlu transkript için önceki
    `reasoning_content` değerlerini yeniden oynatır. Snake case
    `preserve_thinking` parametre anahtarı da takma ad olarak çalışır.

    İleri düzey kullanıcılar tam sağlayıcı yükünü yine
    `params.extra_body.thinking` ile geçersiz kılabilir.

  </Accordion>

  <Accordion title="Görüntü anlama">
    Z.AI plugini görüntü anlamayı kaydeder.

    | Özellik       | Değer       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Görüntü anlama, yapılandırılmış Z.AI kimlik doğrulamasından otomatik olarak
    çözümlenir; ek yapılandırma gerekmez.

  </Accordion>

  <Accordion title="Kimlik doğrulama ayrıntıları">
    - Z.AI, API anahtarınızla Bearer kimlik doğrulaması kullanır.
    - `zai-api-key` ilk katılım seçeneği, anahtarınızla desteklenen uç noktaları yoklayarak eşleşen Z.AI uç noktasını otomatik olarak algılar.
    - Belirli bir API yüzeyini zorlamak istediğinizde açık bölgesel seçenekleri (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) kullanın.
    - Eski ortam değişkeni `Z_AI_API_KEY` hâlâ kabul edilir; `ZAI_API_KEY` ayarlanmamışsa OpenClaw başlangıçta bunu `ZAI_API_KEY` değişkenine kopyalar.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı ve model ayarları dahil eksiksiz OpenClaw yapılandırma şeması.
  </Card>
</CardGroup>
