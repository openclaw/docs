---
read_when:
    - OpenClaw içinde Alibaba Wan video oluşturmayı kullanmak istiyorsunuz
    - Video oluşturma için Model Studio veya DashScope API anahtarı kurulumuna ihtiyacınız var
summary: OpenClaw içinde Alibaba Model Studio Wan video oluşturma
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-12T23:28:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6e97d929952cdba7740f5ab3f6d85c18286b05596a4137bf80bbc8b54f32662
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

OpenClaw, Alibaba Model Studio / DashScope üzerindeki Wan modelleri için paketlenmiş bir `alibaba` video oluşturma sağlayıcısıyla birlikte gelir.

- Sağlayıcı: `alibaba`
- Tercih edilen kimlik doğrulama: `MODELSTUDIO_API_KEY`
- Ayrıca kabul edilir: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: DashScope / Model Studio eşzamansız video oluşturma

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
Kabul edilen kimlik doğrulama anahtarlarından herhangi biri (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) çalışır. `qwen-standard-api-key` başlangıç seçeneği, paylaşılan DashScope kimlik bilgisini yapılandırır.
</Note>

## Yerleşik Wan modelleri

Paketlenmiş `alibaba` sağlayıcısı şu anda şunları kaydeder:

| Model ref                  | Mod                       |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Metinden videoya          |
| `alibaba/wan2.6-i2v`       | Görüntüden videoya        |
| `alibaba/wan2.6-r2v`       | Referanstan videoya       |
| `alibaba/wan2.6-r2v-flash` | Referanstan videoya (hızlı) |
| `alibaba/wan2.7-r2v`       | Referanstan videoya       |

## Mevcut sınırlar

| Parametre             | Sınır                                                     |
| --------------------- | --------------------------------------------------------- |
| Çıktı videoları       | İstek başına en fazla **1**                               |
| Girdi görüntüleri     | En fazla **1**                                            |
| Girdi videoları       | En fazla **4**                                            |
| Süre                  | En fazla **10 saniye**                                    |
| Desteklenen denetimler| `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referans görüntü/video| Yalnızca uzak `http(s)` URL’leri                          |

<Warning>
Referans görüntü/video modu şu anda **uzak http(s) URL’leri** gerektirir. Referans girdileri için yerel dosya yolları desteklenmez.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Qwen ile ilişkisi">
    Paketlenmiş `qwen` sağlayıcısı da
    Wan video oluşturma için Alibaba barındırmalı DashScope uç noktalarını kullanır. Şunları kullanın:

    - Kanonik Qwen sağlayıcı yüzeyini istediğinizde `qwen/...`
    - Doğrudan üreticiye ait Wan video yüzeyini istediğinizde `alibaba/...`

    Daha fazla ayrıntı için [Qwen sağlayıcı belgelerine](/tr/providers/qwen) bakın.

  </Accordion>

  <Accordion title="Kimlik doğrulama anahtarı önceliği">
    OpenClaw, kimlik doğrulama anahtarlarını şu sırayla kontrol eder:

    1. `MODELSTUDIO_API_KEY` (tercih edilir)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Bunlardan herhangi biri `alibaba` sağlayıcısında kimlik doğrulaması yapar.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Qwen" href="/tr/providers/qwen" icon="microchip">
    Qwen sağlayıcı kurulumu ve DashScope entegrasyonu.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference#agent-defaults" icon="gear">
    Ajan varsayılanları ve model yapılandırması.
  </Card>
</CardGroup>
