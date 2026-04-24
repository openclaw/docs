---
read_when:
    - OpenClaw ile Fireworks kullanmak istiyorsunuz
    - Fireworks API anahtarı ortam değişkenine veya varsayılan model kimliğine ihtiyacınız var
summary: Fireworks kurulumu (kimlik doğrulama + model seçimi)
title: Fireworks
x-i18n:
    generated_at: "2026-04-24T09:25:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai), açık ağırlıklı ve yönlendirilmiş modelleri OpenAI uyumlu bir API üzerinden sunar. OpenClaw, paketle gelen bir Fireworks sağlayıcı Plugin'i içerir.

| Özellik        | Değer                                                  |
| -------------- | ------------------------------------------------------ |
| Sağlayıcı      | `fireworks`                                            |
| Kimlik doğrulama | `FIREWORKS_API_KEY`                                  |
| API            | OpenAI uyumlu chat/completions                         |
| Base URL       | `https://api.fireworks.ai/inference/v1`                |
| Varsayılan model | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Başlarken

<Steps>
  <Step title="Onboarding üzerinden Fireworks kimlik doğrulamasını ayarlayın">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Bu, Fireworks anahtarınızı OpenClaw yapılandırmasında saklar ve Fire Pass başlangıç modelini varsayılan olarak ayarlar.

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Etkileşimsiz örnek

Betik veya CI kurulumları için tüm değerleri komut satırında geçin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Yerleşik katalog

| Model ref                                              | Adı                         | Girdi      | Bağlam  | Azami çıktı | Notlar                                                                                                                                             |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144     | Fireworks üzerindeki en yeni Kimi modeli. Fireworks K2.6 isteklerinde thinking devre dışıdır; Kimi thinking çıktısına ihtiyacınız varsa doğrudan Moonshot üzerinden yönlendirin. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000     | Fireworks üzerindeki varsayılan paketli başlangıç modeli                                                                                           |

<Tip>
Fireworks yeni bir model yayımlarsa, örneğin yeni bir Qwen veya Gemma sürümü, paketli katalog güncellemesini beklemeden doğrudan Fireworks model kimliğini kullanarak ona geçebilirsiniz.
</Tip>

## Özel Fireworks model kimlikleri

OpenClaw dinamik Fireworks model kimliklerini de kabul eder. Fireworks tarafından gösterilen tam model veya yönlendirici kimliğini kullanın ve başına `fireworks/` ekleyin.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Model kimliği öneklemesi nasıl çalışır">
    OpenClaw içindeki her Fireworks model başvurusu `fireworks/` ile başlar; ardından Fireworks platformundaki tam kimlik veya yönlendirici yolu gelir. Örneğin:

    - Yönlendirici modeli: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Doğrudan model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw, API isteğini oluştururken `fireworks/` önekini çıkarır ve kalan yolu Fireworks uç noktasına gönderir.

  </Accordion>

  <Accordion title="Ortam notu">
    Gateway etkileşimli shell'iniz dışında çalışıyorsa `FIREWORKS_API_KEY` değerinin o süreç için de mevcut olduğundan emin olun.

    <Warning>
    Anahtar yalnızca `~/.profile` içinde duruyorsa, bu ortam launchd/systemd daemon'una da içe aktarılmadıkça fayda sağlamaz. Gateway sürecinin anahtarı okuyabilmesi için bunu `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden ayarlayın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve devretme davranışını seçme.
  </Card>
  <Card title="Troubleshooting" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
