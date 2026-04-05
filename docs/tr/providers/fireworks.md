---
read_when:
    - OpenClaw ile Fireworks kullanmak istiyorsanız
    - Fireworks API anahtarı ortam değişkenine veya varsayılan model kimliğine ihtiyacınız varsa
summary: Fireworks kurulumu (kimlik doğrulama + model seçimi)
x-i18n:
    generated_at: "2026-04-05T14:03:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20083d5c248abd9a7223e6d188f0265ae27381940ee0067dff6d1d46d908c552
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai), açık ağırlıklı ve yönlendirilmiş modelleri OpenAI uyumlu bir API üzerinden sunar. OpenClaw artık paketlenmiş bir Fireworks sağlayıcı eklentisi içerir.

- Sağlayıcı: `fireworks`
- Kimlik doğrulama: `FIREWORKS_API_KEY`
- API: OpenAI uyumlu chat/completions
- Temel URL: `https://api.fireworks.ai/inference/v1`
- Varsayılan model: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`

## Hızlı başlangıç

Onboarding aracılığıyla Fireworks kimlik doğrulamasını ayarlayın:

```bash
openclaw onboard --auth-choice fireworks-api-key
```

Bu, Fireworks anahtarınızı OpenClaw yapılandırmasında saklar ve Fire Pass başlangıç modelini varsayılan olarak ayarlar.

## Etkileşimsiz örnek

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Ortam notu

Gateway etkileşimli kabuğunuzun dışında çalışıyorsa, `FIREWORKS_API_KEY`
değerinin o süreç için de kullanılabilir olduğundan emin olun. Yalnızca `~/.profile` içinde duran bir anahtar,
bu ortam oraya da aktarılmadıkça launchd/systemd arka plan hizmetine
yardımcı olmaz.

## Yerleşik katalog

| Model ref                                              | Ad                          | Girdi      | Bağlam  | Maks çıktı | Notlar                                         |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | ---------------------------------------------- |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | Fireworks üzerinde varsayılan paketlenmiş başlangıç modeli |

## Özel Fireworks model kimlikleri

OpenClaw dinamik Fireworks model kimliklerini de kabul eder. Fireworks tarafından gösterilen tam model veya yönlendirici kimliğini kullanın ve başına `fireworks/` ekleyin.

Örnek:

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

Fireworks, yeni bir Qwen veya Gemma sürümü gibi daha yeni bir model yayımlarsa, paketlenmiş katalog güncellemesini beklemeden Fireworks model kimliğini kullanarak doğrudan ona geçebilirsiniz.
