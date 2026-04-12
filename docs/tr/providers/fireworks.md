---
read_when:
    - OpenClaw ile Fireworks kullanmak istiyorsunuz
    - Fireworks API key ortam değişkenine veya varsayılan model kimliğine ihtiyacınız var
summary: Fireworks kurulumu (kimlik doğrulama + model seçimi)
title: Fireworks
x-i18n:
    generated_at: "2026-04-12T23:30:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a85d9507c19e275fdd846a303d844eda8045d008774d4dde1eae408e8716b6f
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai), açık ağırlıklı ve yönlendirilmiş modelleri OpenAI uyumlu bir API üzerinden sunar. OpenClaw, paketlenmiş bir Fireworks sağlayıcı Plugin'i içerir.

| Özellik      | Değer                                                  |
| ------------- | ------------------------------------------------------ |
| Sağlayıcı      | `fireworks`                                            |
| Kimlik doğrulama | `FIREWORKS_API_KEY`                                    |
| API           | OpenAI uyumlu chat/completions                         |
| Temel URL      | `https://api.fireworks.ai/inference/v1`                |
| Varsayılan model | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Başlangıç

<Steps>
  <Step title="Başlangıç kurulumu üzerinden Fireworks kimlik doğrulamasını ayarlayın">
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

Betik veya CI kurulumları için tüm değerleri komut satırında iletin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Yerleşik katalog

| Model ref                                              | Ad                          | Girdi      | Bağlam  | Maks çıktı | Notlar                                      |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | ------------------------------------------- |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | Fireworks üzerindeki varsayılan paketlenmiş başlangıç modeli |

<Tip>
Fireworks, yeni bir Qwen veya Gemma sürümü gibi daha yeni bir model yayımlarsa, paketlenmiş katalog güncellemesini beklemeden doğrudan Fireworks model kimliğini kullanarak buna geçebilirsiniz.
</Tip>

## Özel Fireworks model kimlikleri

OpenClaw, dinamik Fireworks model kimliklerini de kabul eder. Fireworks tarafından gösterilen tam model veya yönlendirici kimliğini kullanın ve başına `fireworks/` ekleyin.

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
    OpenClaw içindeki her Fireworks model referansı, Fireworks platformundaki tam kimlik veya yönlendirici yolunun önüne eklenen `fireworks/` ile başlar. Örneğin:

    - Yönlendirici modeli: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Doğrudan model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw, API isteğini oluştururken `fireworks/` önekini kaldırır ve kalan yolu Fireworks uç noktasına gönderir.

  </Accordion>

  <Accordion title="Ortam notu">
    Gateway etkileşimli kabuğunuz dışında çalışıyorsa `FIREWORKS_API_KEY` değerinin de bu süreç tarafından kullanılabildiğinden emin olun.

    <Warning>
    Yalnızca `~/.profile` içinde bulunan bir anahtar, bu ortam oraya da aktarılmadığı sürece bir launchd/systemd daemon’una yardımcı olmaz. Gateway sürecinin bunu okuyabilmesini sağlamak için anahtarı `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
