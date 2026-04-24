---
read_when:
    - API anahtarı gerektirmeyen bir web arama sağlayıcısı istiyorsunuz
    - '`web_search` için DuckDuckGo kullanmak istiyorsunuz'
    - Sıfır yapılandırmalı bir arama yedeğine ihtiyacınız var
summary: DuckDuckGo web arama -- anahtarsız yedek sağlayıcı (deneysel, HTML tabanlı)
title: DuckDuckGo arama
x-i18n:
    generated_at: "2026-04-24T09:34:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw, **anahtarsız** bir `web_search` sağlayıcısı olarak DuckDuckGo'yu destekler. API
anahtarı veya hesap gerekmez.

<Warning>
  DuckDuckGo, sonuçları resmi bir API'den değil DuckDuckGo'nun JavaScript kullanmayan arama sayfalarından çeken **deneysel, resmi olmayan** bir entegrasyondur. Bot-challenge sayfaları veya HTML değişiklikleri nedeniyle zaman zaman bozulmalar bekleyin.
</Warning>

## Kurulum

API anahtarı gerekmez — yalnızca DuckDuckGo'yu sağlayıcınız olarak ayarlayın:

<Steps>
  <Step title="Yapılandırın">
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
Döndürülecek sonuç sayısı (1–10).
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo bölge kodu (ör. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch düzeyi.
</ParamField>

Bölge ve SafeSearch, Plugin yapılandırmasında da ayarlanabilir (yukarıya bakın) — araç
parametreleri sorgu başına yapılandırma değerlerini geçersiz kılar.

## Notlar

- **API anahtarı yok** — kutudan çıktığı gibi çalışır, sıfır yapılandırma
- **Deneysel** — sonuçları DuckDuckGo'nun JavaScript kullanmayan HTML
  arama sayfalarından toplar; resmi API veya SDK değildir
- **Bot-challenge riski** — DuckDuckGo yoğun veya otomatik kullanım altında
  CAPTCHA gösterebilir veya istekleri engelleyebilir
- **HTML ayrıştırma** — sonuçlar, haber verilmeden değişebilen sayfa yapısına bağlıdır
- **Otomatik algılama sırası** — DuckDuckGo, ilk anahtarsız geri düşme
  seçeneğidir (sıra 100). Yapılandırılmış anahtarlara sahip API destekli sağlayıcılar
  önce çalışır, sonra Ollama Web Search (sıra 110), ardından SearXNG (sıra 200)
- Yapılandırılmadığında **SafeSearch varsayılan olarak moderate** olur

<Tip>
  Üretim kullanımı için [Brave Search](/tr/tools/brave-search) (ücretsiz katman
  mevcut) veya başka bir API destekli sağlayıcıyı değerlendirin.
</Tip>

## İlgili

- [Web Search overview](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tr/tools/brave-search) -- ücretsiz katmanlı yapılandırılmış sonuçlar
- [Exa Search](/tr/tools/exa-search) -- içerik çıkarımlı nöral arama
