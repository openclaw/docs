---
read_when:
    - Tencent Hy3 önizlemesini OpenClaw ile kullanmak istiyorsunuz
    - TokenHub API anahtarı kurulumuna ihtiyacınız var
summary: Hy3 önizlemesi için Tencent Cloud TokenHub kurulumu
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-24T09:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud, OpenClaw içinde **paketlenmiş sağlayıcı Plugin'i** olarak gelir. TokenHub uç noktası (`tencent-tokenhub`) üzerinden Tencent Hy3 önizlemesine erişim sağlar.

Sağlayıcı, OpenAI uyumlu bir API kullanır.

| Özellik       | Değer                                      |
| ------------- | ------------------------------------------ |
| Sağlayıcı     | `tencent-tokenhub`                         |
| Varsayılan model | `tencent-tokenhub/hy3-preview`          |
| Auth          | `TOKENHUB_API_KEY`                         |
| API           | OpenAI uyumlu sohbet tamamlamaları         |
| Base URL      | `https://tokenhub.tencentmaas.com/v1`      |
| Genel URL     | `https://tokenhub-intl.tencentmaas.com/v1` |

## Hızlı başlangıç

<Steps>
  <Step title="Bir TokenHub API anahtarı oluşturun">
    Tencent Cloud TokenHub içinde bir API anahtarı oluşturun. Anahtar için sınırlı erişim kapsamı seçerseniz, izin verilen modellere **Hy3 preview** ekleyin.
  </Step>
  <Step title="İlk katılımı çalıştırın">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Modeli doğrulayın">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Etkileşimsiz kurulum

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Yerleşik katalog

| Model başvurusu                 | Ad                      | Girdi | Bağlam   | Maksimum çıktı | Notlar                         |
| ------------------------------- | ----------------------- | ----- | -------- | -------------- | ------------------------------ |
| `tencent-tokenhub/hy3-preview`  | Hy3 preview (TokenHub) | text  | 256,000  | 64,000         | Varsayılan; muhakeme etkin     |

Hy3 preview, Tencent Hunyuan'ın muhakeme, uzun bağlamlı yönerge takibi, kod ve aracı iş akışları için büyük MoE dil modelidir. Tencent'in OpenAI uyumlu örnekleri model kimliği olarak `hy3-preview` kullanır ve standart chat-completions araç çağrısını artı `reasoning_effort` desteğini sunar.

<Tip>
Model kimliği `hy3-preview`'dür. Bunu Tencent'in `HY-3D-*` modelleriyle karıştırmayın; bunlar 3D üretim API'leridir ve bu sağlayıcı tarafından yapılandırılan OpenClaw sohbet modeli değildir.
</Tip>

## Uç nokta geçersiz kılması

OpenClaw varsayılan olarak Tencent Cloud'un `https://tokenhub.tencentmaas.com/v1` uç noktasını kullanır. Tencent ayrıca uluslararası bir TokenHub uç noktası da belgeler:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Uç noktayı yalnızca TokenHub hesabınız veya bölgeniz bunu gerektiriyorsa geçersiz kılın.

## Notlar

- TokenHub model başvuruları `tencent-tokenhub/<modelId>` kullanır.
- Paketlenmiş katalog şu anda `hy3-preview` içerir.
- Plugin, Hy3 preview'ü muhakeme yetenekli ve akış kullanımı yetenekli olarak işaretler.
- Plugin, katmanlı Hy3 fiyatlandırma üst verisiyle gelir; böylece maliyet tahminleri elle fiyatlandırma geçersiz kılmaları olmadan doldurulur.
- Fiyatlandırma, bağlam veya uç nokta üst verilerini yalnızca gerektiğinde `models.providers` içinde geçersiz kılın.

## Ortam notu

Gateway bir daemon (launchd/systemd) olarak çalışıyorsa, `TOKENHUB_API_KEY`
değerinin o süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
`env.shellEnv` üzerinden).

## İlgili belgeler

- [OpenClaw Yapılandırması](/tr/gateway/configuration)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
- [Tencent TokenHub ürün sayfası](https://cloud.tencent.com/product/tokenhub)
- [Tencent TokenHub metin üretimi](https://cloud.tencent.com/document/product/1823/130079)
- [Hy3 preview için Tencent TokenHub Cline kurulumu](https://cloud.tencent.com/document/product/1823/130932)
- [Tencent Hy3 preview model kartı](https://huggingface.co/tencent/Hy3-preview)
