---
read_when:
    - API anahtarı gerektirmeyen bir web arama sağlayıcısı istiyorsunuz
    - DuckDuckGo'yu web_search için kullanmak istiyorsunuz
    - Açıkça seçilmiş, anahtarsız bir arama sağlayıcısı istiyorsunuz
summary: DuckDuckGo web araması -- anahtarsız sağlayıcı (deneysel, HTML tabanlı)
title: DuckDuckGo araması
x-i18n:
    generated_at: "2026-06-28T01:21:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw, **anahtarsız** bir `web_search` sağlayıcısı olarak DuckDuckGo'yu destekler. API
anahtarı veya hesap gerekmez.

<Warning>
  DuckDuckGo, sonuçları resmi bir API'den değil, DuckDuckGo'nun JavaScript olmayan
  arama sayfalarından alan **deneysel, resmi olmayan** bir entegrasyondur. Bot doğrulama
  sayfaları veya HTML değişiklikleri nedeniyle zaman zaman bozulmalar bekleyin.
</Warning>

## Kurulum

API anahtarı gerekmez - sağlayıcınız olarak DuckDuckGo'yu ayarlamanız yeterlidir:

<Steps>
  <Step title="Yapılandır">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Yapılandırma

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Bölge ve SafeSearch için isteğe bağlı plugin düzeyi ayarlar:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Araç parametreleri

<ParamField path="query" type="string" required>
Arama sorgusu.
</ParamField>

<ParamField path="count" type="number" default="5">
Döndürülecek sonuçlar (1-10).
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo bölge kodu (ör. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch düzeyi.
</ParamField>

Bölge ve SafeSearch plugin yapılandırmasında da ayarlanabilir (yukarıya bakın) - araç
parametreleri, sorgu bazında yapılandırma değerlerini geçersiz kılar.

## Notlar

- **API anahtarı yok** - `web_search` sağlayıcınız olarak DuckDuckGo'yu seçtikten
  sonra çalışır
- **Deneysel** - sonuçları resmi bir API veya SDK'dan değil, DuckDuckGo'nun
  JavaScript olmayan HTML arama sayfalarından toplar
- **Bot doğrulama riski** - DuckDuckGo, yoğun veya otomatik kullanım altında
  CAPTCHA sunabilir ya da istekleri engelleyebilir
- **HTML ayrıştırma** - sonuçlar, bildirim yapılmadan değişebilecek sayfa
  yapısına bağlıdır
- **Açık seçim** - API destekli bir sağlayıcı yapılandırılmadığında OpenClaw
  DuckDuckGo'yu otomatik olarak seçmez
- **SafeSearch, yapılandırılmadığında varsayılan olarak moderate olur**

<Tip>
  Üretim kullanımı için [Brave Search](/tr/tools/brave-search) (ücretsiz katman
  mevcuttur) veya API destekli başka bir sağlayıcı düşünün.
</Tip>

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tr/tools/brave-search) -- ücretsiz katmanla yapılandırılmış sonuçlar
- [Exa Search](/tr/tools/exa-search) -- içerik çıkarımıyla sinirsel arama
