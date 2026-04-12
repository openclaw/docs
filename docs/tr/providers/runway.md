---
read_when:
    - OpenClaw’da Runway video üretimini kullanmak istiyorsunuz
    - Runway API anahtarı/env kurulumuna ihtiyacınız var
    - Runway’i varsayılan video provider’ı yapmak istiyorsunuz
summary: OpenClaw’da Runway video üretimi kurulumu
title: Runway
x-i18n:
    generated_at: "2026-04-12T23:32:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9a2d26687920544222b0769f314743af245629fd45b7f456c0161a47476176
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw, barındırılan video üretimi için paketli bir `runway` provider sunar.

| Özellik      | Değer                                                            |
| ------------ | ---------------------------------------------------------------- |
| Provider kimliği | `runway`                                                     |
| Kimlik doğrulama | `RUNWAYML_API_SECRET` (kanonik) veya `RUNWAY_API_KEY`        |
| API          | Runway görev tabanlı video üretimi (`GET /v1/tasks/{id}` yoklaması) |

## Başlarken

<Steps>
  <Step title="API anahtarını ayarlayın">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway'i varsayılan video provider'ı olarak ayarlayın">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Bir video üretin">
    Ajandan bir video üretmesini isteyin. Runway otomatik olarak kullanılacaktır.
  </Step>
</Steps>

## Desteklenen modlar

| Mod             | Model              | Referans girdi            |
| --------------- | ------------------ | ------------------------- |
| Text-to-video   | `gen4.5` (varsayılan) | Yok                    |
| Image-to-video  | `gen4.5`           | 1 yerel veya uzak görsel  |
| Video-to-video  | `gen4_aleph`       | 1 yerel veya uzak video   |

<Note>
Yerel görsel ve video referansları data URI’leri üzerinden desteklenir. Yalnızca metin içeren çalıştırmalar şu anda `16:9` ve `9:16` en-boy oranlarını sunar.
</Note>

<Warning>
Video-to-video şu anda özellikle `runway/gen4_aleph` gerektirir.
</Warning>

## Yapılandırma

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Ortam değişkeni takma adları">
    OpenClaw hem `RUNWAYML_API_SECRET` (kanonik) hem de `RUNWAY_API_KEY` değişkenlerini tanır.
    Bu değişkenlerden biri Runway provider’ında kimlik doğrulama sağlar.
  </Accordion>

  <Accordion title="Görev yoklaması">
    Runway görev tabanlı bir API kullanır. Bir üretim isteği gönderildikten sonra OpenClaw,
    video hazır olana kadar `GET /v1/tasks/{id}` yoklaması yapar. Yoklama davranışı için
    ek bir yapılandırma gerekmez.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan araç parametreleri, provider seçimi ve async davranış.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference#agent-defaults" icon="gear">
    Video üretimi modeli dahil ajan varsayılan ayarları.
  </Card>
</CardGroup>
