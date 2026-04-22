---
read_when:
    - OpenClaw ile Fireworks kullanmak istiyorsunuz
    - Fireworks API anahtarı ortam değişkenine veya varsayılan model kimliğine ihtiyacınız var
summary: Fireworks kurulumu (kimlik doğrulama + model seçimi)
title: Fireworks
x-i18n:
    generated_at: "2026-04-22T04:27:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b2aae346f1fb7e6d649deefe9117d8d8399c0441829cb49132ff5b86a7051ce
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai), açık ağırlıklı ve yönlendirilmiş modelleri OpenAI uyumlu bir API üzerinden sunar. OpenClaw, paketle birlikte gelen bir Fireworks sağlayıcı plugin'i içerir.

| Özellik       | Değer                                                  |
| ------------- | ------------------------------------------------------ |
| Sağlayıcı     | `fireworks`                                            |
| Kimlik doğrulama | `FIREWORKS_API_KEY`                                 |
| API           | OpenAI uyumlu chat/completions                         |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| Varsayılan model | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Başlarken

<Steps>
  <Step title="Onboarding aracılığıyla Fireworks kimlik doğrulamasını ayarlayın">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Bu, Fireworks anahtarınızı OpenClaw config'inde saklar ve Fire Pass başlangıç modelini varsayılan olarak ayarlar.

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Etkileşimsiz örnek

Betik tabanlı veya CI kurulumları için tüm değerleri komut satırında iletin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Yerleşik katalog

| Model ref                                              | Ad                         | Girdi      | Bağlam  | Maksimum çıktı | Notlar                                                                                                                                                 |
| ------------------------------------------------------ | -------------------------- | ---------- | ------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                  | text,image | 262,144 | 262,144        | Fireworks üzerindeki en yeni Kimi modeli. Fireworks K2.6 isteklerinde thinking devre dışıdır; Kimi thinking çıktısına ihtiyacınız varsa doğrudan Moonshot üzerinden yönlendirin. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000        | Fireworks üzerindeki varsayılan paketle gelen başlangıç modeli                                                                                          |

<Tip>
Fireworks yeni bir Qwen veya Gemma sürümü gibi daha yeni bir model yayımlarsa, paketle gelen katalog güncellemesini beklemeden Fireworks model kimliğini doğrudan kullanarak o modele geçebilirsiniz.
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
    OpenClaw içindeki her Fireworks model ref'i, Fireworks platformundaki tam kimlik veya yönlendirici yolunun önüne eklenen `fireworks/` ile başlar. Örneğin:

    - Yönlendirici modeli: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Doğrudan model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw API isteğini oluştururken `fireworks/` önekini kaldırır ve kalan yolu Fireworks uç noktasına gönderir.

  </Accordion>

  <Accordion title="Ortam notu">
    Gateway etkileşimli shell'iniz dışında çalışıyorsa `FIREWORKS_API_KEY` değişkeninin o süreç için de kullanılabilir olduğundan emin olun.

    <Warning>
    Anahtar yalnızca `~/.profile` içinde bulunuyorsa, bu ortam oraya da aktarılmadıkça bir launchd/systemd daemon için işe yaramaz. Gateway sürecinin okuyabilmesini sağlamak için anahtarı `~/.openclaw/.env` içine veya `env.shellEnv` üzerinden ayarlayın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
