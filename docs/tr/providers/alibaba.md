---
read_when:
    - OpenClaw'ta Alibaba Wan video üretimini kullanmak istiyorsunuz
    - Video üretimi için Model Studio veya DashScope API anahtarı kurulumuna ihtiyacınız var
summary: OpenClaw'ta Alibaba Model Studio Wan video üretimi
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-24T09:24:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 15
---

OpenClaw, Alibaba Model Studio / DashScope üzerindeki Wan modelleri için paketlenmiş bir `alibaba` video üretimi sağlayıcısıyla gelir.

- Sağlayıcı: `alibaba`
- Tercih edilen kimlik doğrulama: `MODELSTUDIO_API_KEY`
- Kabul edilen diğerleri: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: DashScope / Model Studio eşzamansız video üretimi

## Başlangıç

<Steps>
  <Step title="Bir API anahtarı ayarlayın">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Varsayılan bir video modeli ayarlayın">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Sağlayıcının kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Kabul edilen kimlik doğrulama anahtarlarından herhangi biri (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) çalışır. `qwen-standard-api-key` ilk kullanım seçeneği, paylaşılan DashScope kimlik bilgisini yapılandırır.
</Note>

## Yerleşik Wan modelleri

Paketlenmiş `alibaba` sağlayıcısı şu anda şunları kaydeder:

| Model ref                  | Mod                        |
| -------------------------- | -------------------------- |
| `alibaba/wan2.6-t2v`       | Metinden videoya           |
| `alibaba/wan2.6-i2v`       | Görüntüden videoya         |
| `alibaba/wan2.6-r2v`       | Referanstan videoya        |
| `alibaba/wan2.6-r2v-flash` | Referanstan videoya (hızlı) |
| `alibaba/wan2.7-r2v`       | Referanstan videoya        |

## Geçerli sınırlar

| Parametre             | Sınır                                                     |
| --------------------- | --------------------------------------------------------- |
| Çıkış videoları       | İstek başına en fazla **1**                               |
| Girdi görselleri      | En fazla **1**                                            |
| Girdi videoları       | En fazla **4**                                            |
| Süre                  | En fazla **10 saniye**                                    |
| Desteklenen denetimler | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referans görsel/video | Yalnızca uzak `http(s)` URL'leri                          |

<Warning>
Referans görsel/video modu şu anda **uzak `http(s)` URL'leri** gerektirir. Referans girdileri için yerel dosya yolları desteklenmez.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Qwen ile ilişkisi">
    Paketlenmiş `qwen` sağlayıcısı da
    Wan video üretimi için Alibaba tarafından barındırılan DashScope uç noktalarını kullanır. Şunları kullanın:

    - kanonik Qwen sağlayıcı yüzeyini istiyorsanız `qwen/...`
    - doğrudan satıcıya ait Wan video yüzeyini istiyorsanız `alibaba/...`

    Daha fazla ayrıntı için bkz. [Qwen sağlayıcı belgeleri](/tr/providers/qwen).

  </Accordion>

  <Accordion title="Kimlik doğrulama anahtarı önceliği">
    OpenClaw kimlik doğrulama anahtarlarını şu sırayla denetler:

    1. `MODELSTUDIO_API_KEY` (tercih edilir)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Bunlardan herhangi biri `alibaba` sağlayıcısının kimliğini doğrular.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Qwen" href="/tr/providers/qwen" icon="microchip">
    Qwen sağlayıcı kurulumu ve DashScope entegrasyonu.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Agent varsayılanları ve model yapılandırması.
  </Card>
</CardGroup>
