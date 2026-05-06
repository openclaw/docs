---
read_when:
    - OpenClaw'da Runway video oluşturmayı kullanmak istiyorsunuz
    - Runway API anahtarı/ortam değişkeni kurulumu gerekir
    - Runway’i varsayılan video sağlayıcısı yapmak istiyorsunuz
summary: OpenClaw'da Runway video oluşturma kurulumu
title: Runway
x-i18n:
    generated_at: "2026-05-06T09:28:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw, barındırılan video oluşturma için paketle birlikte gelen bir `runway` sağlayıcısıyla gelir. Plugin varsayılan olarak etkindir ve `videoGenerationProviders` sözleşmesine karşı `runway` sağlayıcısını kaydeder.

| Özellik        | Değer                                                             |
| --------------- | ----------------------------------------------------------------- |
| Sağlayıcı kimliği     | `runway`                                                          |
| Plugin          | paketle birlikte gelir, `enabledByDefault: true`                                 |
| Kimlik doğrulama env değişkenleri   | `RUNWAYML_API_SECRET` (kanonik) veya `RUNWAY_API_KEY`             |
| İlk kurulum bayrağı | `--auth-choice runway-api-key`                                    |
| Doğrudan CLI bayrağı | `--runway-api-key <key>`                                          |
| API             | Runway görev tabanlı video oluşturma (`GET /v1/tasks/{id}` yoklaması) |
| Varsayılan model   | `runway/gen4.5`                                                   |

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
  <Step title="Video oluşturun">
    Ajanınızdan bir video oluşturmasını isteyin. Runway otomatik olarak kullanılacaktır.
  </Step>
</Steps>

## Desteklenen modlar ve modeller

Sağlayıcı, üç moda bölünmüş yedi Runway modelini kullanıma sunar. Aynı model kimliği birden fazla moda hizmet edebilir (örneğin `gen4.5` hem metinden videoya hem de görüntüden videoya için çalışır).

| Mod           | Modeller                                                                 | Referans girdi         |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| Metinden videoya  | `gen4.5` (varsayılan), `veo3.1`, `veo3.1_fast`, `veo3`                    | Yok                    |
| Görüntüden videoya | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 yerel veya uzak görüntü |
| Videodan videoya | `gen4_aleph`                                                           | 1 yerel veya uzak video |

Yerel görüntü ve video referansları data URI’leri aracılığıyla desteklenir.

| En boy oranları         | İzin verilen değerler                              |
| --------------------- | ------------------------------------------- |
| Metinden videoya         | `16:9`, `9:16`                              |
| Görüntü ve video düzenlemeleri | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Videodan videoya şu anda `runway/gen4_aleph` gerektirir. Diğer Runway model kimlikleri video referans girdilerini reddeder.
</Warning>

<Note>
  Yanlış sütundan bir Runway model kimliği seçmek, API isteği OpenClaw’dan ayrılmadan önce açık bir hata üretir. Sağlayıcı, `extensions/runway/video-generation-provider.ts` içinde `model` değerini modun izin listesine (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) göre doğrular.
</Note>

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
    OpenClaw hem `RUNWAYML_API_SECRET` (kanonik) hem de `RUNWAY_API_KEY` değerini tanır.
    Her iki değişken de Runway sağlayıcısının kimliğini doğrular.
  </Accordion>

  <Accordion title="Görev yoklaması">
    Runway görev tabanlı bir API kullanır. Bir oluşturma isteği gönderildikten sonra OpenClaw,
    video hazır olana kadar `GET /v1/tasks/{id}` yoklar. Yoklama davranışı için ek
    yapılandırma gerekmez.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve zaman uyumsuz davranış.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Video oluşturma modeli dahil ajan varsayılan ayarları.
  </Card>
</CardGroup>
