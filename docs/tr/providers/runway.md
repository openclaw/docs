---
read_when:
    - OpenClaw içinde Runway video oluşturmayı kullanmak istiyorsunuz
    - Runway API anahtarı/ortam değişkeni kurulumuna ihtiyacınız var
    - Runway’i varsayılan video sağlayıcısı yapmak istiyorsunuz
summary: OpenClaw içinde Runway video oluşturma kurulumu
title: Runway
x-i18n:
    generated_at: "2026-04-24T09:27:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 15
---

OpenClaw, barındırılan video oluşturma için paketlenmiş bir `runway` sağlayıcısıyla gelir.

| Özellik    | Değer                                                             |
| ----------- | ----------------------------------------------------------------- |
| Sağlayıcı kimliği | `runway`                                                          |
| Kimlik doğrulama | `RUNWAYML_API_SECRET` (kanonik) veya `RUNWAY_API_KEY`             |
| API         | Runway görev tabanlı video oluşturma (`GET /v1/tasks/{id}` yoklaması) |

## Başlarken

<Steps>
  <Step title="API anahtarını ayarlayın">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway’i varsayılan video sağlayıcısı olarak ayarlayın">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Bir video oluşturun">
    Aracıdan bir video oluşturmasını isteyin. Runway otomatik olarak kullanılacaktır.
  </Step>
</Steps>

## Desteklenen kipler

| Kip            | Model              | Başvuru girdisi         |
| -------------- | ------------------ | ----------------------- |
| Metinden videoya  | `gen4.5` (varsayılan) | Yok                     |
| Görüntüden videoya | `gen4.5`           | 1 yerel veya uzak görüntü |
| Videodan videoya | `gen4_aleph`       | 1 yerel veya uzak video |

<Note>
Veri URI’leri üzerinden yerel görüntü ve video başvuruları desteklenir. Yalnızca metin içeren çalıştırmalar şu anda
`16:9` ve `9:16` en-boy oranlarını açığa çıkarır.
</Note>

<Warning>
Videodan videoya şu anda özellikle `runway/gen4_aleph` gerektirir.
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

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Ortam değişkeni takma adları">
    OpenClaw hem `RUNWAYML_API_SECRET` (kanonik) hem de `RUNWAY_API_KEY` değerlerini tanır.
    Her iki değişken de Runway sağlayıcısının kimliğini doğrular.
  </Accordion>

  <Accordion title="Görev yoklaması">
    Runway görev tabanlı bir API kullanır. Bir oluşturma isteği gönderildikten sonra OpenClaw,
    video hazır olana kadar `GET /v1/tasks/{id}` yolunu yoklar. Yoklama davranışı için
    ek yapılandırma gerekmez.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve eşzamansız davranış.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Video oluşturma modeli dahil aracı varsayılan ayarları.
  </Card>
</CardGroup>
