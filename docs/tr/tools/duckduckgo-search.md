---
read_when:
    - API anahtarı gerektirmeyen bir web arama sağlayıcısı istiyorsanız
    - web_search için DuckDuckGo kullanmak istiyorsanız
    - Sıfır yapılandırmalı bir arama yedeğine ihtiyacınız varsa
summary: DuckDuckGo web araması -- anahtar gerektirmeyen yedek sağlayıcı (deneysel, HTML tabanlı)
title: DuckDuckGo Arama
x-i18n:
    generated_at: "2026-04-05T14:10:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31f8e3883584534396c247c3d8069ea4c5b6399e0ff13a9dd0c8ee0c3da02096
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

# DuckDuckGo Arama

OpenClaw, DuckDuckGo’yu **anahtar gerektirmeyen** bir `web_search` sağlayıcısı olarak destekler. API
anahtarı veya hesap gerekmez.

<Warning>
  DuckDuckGo, sonuçları DuckDuckGo'nun JavaScript kullanmayan arama sayfalarından çeken **deneysel, resmi olmayan** bir entegrasyondur — resmi bir API değildir. Bot doğrulama sayfaları veya HTML değişiklikleri nedeniyle ara sıra bozulmalar bekleyin.
</Warning>

## Kurulum

API anahtarı gerekmez — yalnızca sağlayıcınız olarak DuckDuckGo’yu ayarlayın:

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

Bölge ve SafeSearch için isteğe bağlı plugin düzeyi ayarlar:

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

| Parametre    | Açıklama                                                       |
| ------------ | -------------------------------------------------------------- |
| `query`      | Arama sorgusu (gerekli)                                        |
| `count`      | Döndürülecek sonuç sayısı (1-10, varsayılan: 5)                |
| `region`     | DuckDuckGo bölge kodu (ör. `us-en`, `uk-en`, `de-de`)          |
| `safeSearch` | SafeSearch düzeyi: `strict`, `moderate` (varsayılan) veya `off` |

Bölge ve SafeSearch, plugin yapılandırmasında da ayarlanabilir (yukarıya bakın) — araç
parametreleri sorgu başına yapılandırma değerlerini geçersiz kılar.

## Notlar

- **API anahtarı yok** — kutudan çıktığı gibi çalışır, sıfır yapılandırma
- **Deneysel** — sonuçları resmi bir API veya SDK’dan değil, DuckDuckGo’nun JavaScript kullanmayan HTML
  arama sayfalarından toplar
- **Bot doğrulama riski** — yoğun veya otomatik kullanım
  altında DuckDuckGo CAPTCHA gösterebilir veya istekleri engelleyebilir
- **HTML ayrıştırma** — sonuçlar sayfa yapısına bağlıdır ve bu yapı
  haber vermeden değişebilir
- **Otomatik algılama sırası** — DuckDuckGo, otomatik algılamada ilk anahtar gerektirmeyen
  yedektir (sıra 100). Anahtarı yapılandırılmış API destekli sağlayıcılar önce çalışır,
  ardından Ollama Web Search (sıra 110), sonra SearXNG (sıra 200) gelir
- **Yapılandırılmadığında SafeSearch varsayılan olarak moderate olur**

<Tip>
  Üretim kullanımı için [Brave Search](/tools/brave-search) (ücretsiz katman
  mevcut) veya API destekli başka bir sağlayıcıyı değerlendirin.
</Tip>

## İlgili

- [Web Search genel bakışı](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tools/brave-search) -- ücretsiz katmanlı yapılandırılmış sonuçlar
- [Exa Search](/tools/exa-search) -- içerik çıkarımlı nöral arama
