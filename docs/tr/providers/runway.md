---
read_when:
    - OpenClaw'da Runway video oluşturmayı kullanmak istiyorsunuz
    - Runway API anahtarı/ortam değişkeni yapılandırmasına ihtiyacınız var
    - Runway'i varsayılan video sağlayıcısı yapmak istiyorsunuz
summary: OpenClaw'da Runway video oluşturma kurulumu
title: Pist
x-i18n:
    generated_at: "2026-07-12T12:10:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw, barındırılan video üretimi için varsayılan olarak etkinleştirilmiş ve `videoGenerationProviders` sözleşmesine kaydedilmiş, paketle birlikte gelen bir `runway` sağlayıcısıyla sunulur.

| Özellik                 | Değer                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| Sağlayıcı kimliği       | `runway`                                                                 |
| Plugin                  | paketle birlikte gelir, `enabledByDefault: true`                          |
| Kimlik doğrulama ortam değişkenleri | `RUNWAYML_API_SECRET` (kanonik) veya `RUNWAY_API_KEY`          |
| İlk kurulum bayrağı     | `--auth-choice runway-api-key`                                           |
| Doğrudan CLI bayrağı    | `--runway-api-key <key>`                                                 |
| API                     | Runway görev tabanlı video üretimi (`GET /v1/tasks/{id}` yoklaması)       |
| Varsayılan model        | `runway/gen4.5`                                                          |

## Başlarken

<Steps>
  <Step title="API anahtarını ayarlayın">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway'i varsayılan video sağlayıcısı olarak ayarlayın">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Video oluşturun">
    Agent'tan bir video oluşturmasını isteyin. Runway otomatik olarak kullanılacaktır.
  </Step>
</Steps>

## Desteklenen modlar ve modeller

Sağlayıcı, üç moda ayrılmış yedi Runway modeli sunar. Aynı model kimliği birden fazla modda kullanılabilir (örneğin `gen4.5`, hem metinden videoya hem de görüntüden videoya dönüştürmede çalışır).

| Mod                 | Modeller                                                                | Referans girdisi                     |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------ |
| Metinden videoya    | `gen4.5` (varsayılan), `veo3.1`, `veo3.1_fast`, `veo3`                  | Yok                                  |
| Görüntüden videoya  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 yerel veya uzak görüntü            |
| Videodan videoya    | `gen4_aleph`                                                            | 1 yerel veya uzak video              |

Yerel görüntü ve video referansları, veri URI'leri aracılığıyla desteklenir.

| En-boy oranları                  | İzin verilen değerler                         |
| -------------------------------- | --------------------------------------------- |
| Metinden videoya                 | `16:9`, `9:16`                                |
| Görüntü ve video düzenlemeleri   | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Videodan videoya dönüştürme şu anda `runway/gen4_aleph` gerektirir. Diğer Runway model kimlikleri video referans girdilerini reddeder.
</Warning>

<Note>
  Yanlış sütundan bir Runway model kimliği seçmek, API isteği OpenClaw'dan çıkmadan önce açık bir hata oluşturur. Sağlayıcı, `extensions/runway/video-generation-provider.ts` dosyasında `model` değerini modun izin verilenler listesine (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) göre doğrular.
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
  <Accordion title="Ortam değişkeni diğer adları">
    OpenClaw hem `RUNWAYML_API_SECRET` (kanonik) hem de `RUNWAY_API_KEY` değişkenini tanır.
    Her iki değişken de Runway sağlayıcısının kimliğini doğrular.
  </Accordion>

  <Accordion title="Görev yoklaması">
    Runway görev tabanlı bir API kullanır. OpenClaw, bir üretim isteği gönderdikten sonra
    video hazır olana kadar `GET /v1/tasks/{id}` uç noktasını yoklar. Yoklama davranışı için
    ek yapılandırma gerekmez.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan araç parametreleri, sağlayıcı seçimi ve eşzamansız davranış.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Video üretim modeli dahil olmak üzere Agent varsayılan ayarları.
  </Card>
</CardGroup>
