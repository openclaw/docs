---
read_when:
    - API anahtarı gerektirmeyen bir web arama sağlayıcısı istiyorsunuz
    - web_search için DuckDuckGo kullanmak istiyorsunuz
    - Yapılandırma gerektirmeyen bir arama geri dönüş mekanizmasına ihtiyacınız var
summary: DuckDuckGo web araması -- anahtarsız yedek sağlayıcı (deneysel, HTML tabanlı)
title: DuckDuckGo araması
x-i18n:
    generated_at: "2026-05-06T09:33:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw, DuckDuckGo'yu **anahtarsız** bir `web_search` sağlayıcısı olarak destekler. API
anahtarı veya hesap gerekmez.

<Warning>
  DuckDuckGo, sonuçları resmi bir API'den değil, DuckDuckGo'nun JavaScript dışı
  arama sayfalarından çeken **deneysel, resmi olmayan** bir entegrasyondur. Bot
  doğrulama sayfaları veya HTML değişiklikleri nedeniyle ara sıra bozulmalar
  bekleyin.
</Warning>

## Kurulum

API anahtarı gerekmez; sağlayıcınız olarak DuckDuckGo'yu ayarlamanız yeterlidir:

<Steps>
  <Step title="Yapılandır">
    ```bash
    openclaw configure --section web
    # Sağlayıcı olarak "duckduckgo" seçin
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

Bölge ve SafeSearch için isteğe bağlı Plugin düzeyi ayarlar:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo bölge kodu
            safeSearch: "moderate", // "strict", "moderate" veya "off"
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
DuckDuckGo bölge kodu (örn. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch düzeyi.
</ParamField>

Bölge ve SafeSearch, Plugin yapılandırmasında da ayarlanabilir (yukarıya bakın);
araç parametreleri, sorgu bazında yapılandırma değerlerini geçersiz kılar.

## Notlar

- **API anahtarı yok**; kutudan çıktığı gibi çalışır, sıfır yapılandırma
- **Deneysel**; sonuçları resmi bir API veya SDK'den değil, DuckDuckGo'nun
  JavaScript dışı HTML arama sayfalarından toplar
- **Bot doğrulama riski**; DuckDuckGo yoğun veya otomatik kullanımda CAPTCHA
  sunabilir ya da istekleri engelleyebilir
- **HTML ayrıştırma**; sonuçlar sayfa yapısına bağlıdır ve bu yapı bildirimde
  bulunulmadan değişebilir
- **Otomatik algılama sırası**; DuckDuckGo, otomatik algılamadaki ilk
  anahtarsız geri dönüş seçeneğidir (sıra 100). Yapılandırılmış anahtarları
  olan API destekli sağlayıcılar önce çalışır, ardından Ollama Web Search
  (sıra 110), sonra SearXNG (sıra 200) gelir
- **SafeSearch, yapılandırılmadığında varsayılan olarak moderate değerini kullanır**

<Tip>
  Üretim kullanımı için [Brave Search](/tr/tools/brave-search) (ücretsiz katman
  mevcut) veya API destekli başka bir sağlayıcı kullanmayı değerlendirin.
</Tip>

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tr/tools/brave-search) -- ücretsiz katmanla yapılandırılmış sonuçlar
- [Exa Search](/tr/tools/exa-search) -- içerik çıkarma özellikli nöral arama
