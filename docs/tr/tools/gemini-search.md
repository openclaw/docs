---
read_when:
    - Gemini'yi web_search için kullanmak istiyorsunuz
    - Bir GEMINI_API_KEY veya models.providers.google.apiKey gerekir
    - Google Search grounding istiyorsunuz
summary: Google Arama temellendirmesiyle Gemini web araması
title: Gemini araması
x-i18n:
    generated_at: "2026-06-28T01:22:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw, canlı Google Search sonuçlarıyla desteklenen ve atıflar içeren, yapay zeka tarafından sentezlenmiş yanıtlar döndüren yerleşik
[Google Search temellendirmesi](https://ai.google.dev/gemini-api/docs/grounding)
ile Gemini modellerini destekler.

## API anahtarı alma

<Steps>
  <Step title="Create a key">
    [Google AI Studio](https://aistudio.google.com/apikey) adresine gidin ve bir
    API anahtarı oluşturun.
  </Step>
  <Step title="Store the key">
    Gateway ortamında `GEMINI_API_KEY` değerini ayarlayın,
    `models.providers.google.apiKey` değerini yeniden kullanın veya şu komutla özel bir web araması anahtarı yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Kimlik bilgisi önceliği:** Gemini web araması önce
`plugins.entries.google.config.webSearch.apiKey` değerini, ardından `GEMINI_API_KEY`
değerini, sonra da `models.providers.google.apiKey` değerini kullanır. Temel URL'ler için, özel
`plugins.entries.google.config.webSearch.baseUrl` değeri
`models.providers.google.baseUrl` değerinden önce gelir.

Bir Gateway kurulumu için ortam anahtarlarını `~/.openclaw/.env` içine koyun.

## Nasıl çalışır?

Bağlantı ve parçacık listesi döndüren geleneksel arama sağlayıcılarının aksine,
Gemini, satır içi atıflar içeren yapay zeka tarafından sentezlenmiş yanıtlar üretmek için Google Search temellendirmesini kullanır. Sonuçlar hem sentezlenmiş yanıtı hem de kaynak
URL'leri içerir.

- Gemini temellendirmesinden gelen atıf URL'leri, Google yönlendirme URL'lerinden doğrudan URL'lere otomatik olarak çözümlenir.
- Yönlendirme çözümlemesi, son atıf URL'sini döndürmeden önce SSRF koruma yolunu (HEAD + yönlendirme kontrolleri +
  http/https doğrulaması) kullanır.
- Yönlendirme çözümlemesi katı SSRF varsayılanlarını kullanır, bu nedenle
  özel/dahili hedeflere yönlendirmeler engellenir.

## Desteklenen parametreler

Gemini araması `query`, `freshness`, `date_after` ve `date_before` parametrelerini destekler.

`count`, paylaşılan `web_search` uyumluluğu için kabul edilir, ancak Gemini temellendirmesi
yine de N sonuçlu bir liste yerine atıflar içeren tek bir sentezlenmiş yanıt döndürür.

`freshness`, `day`, `week`, `month`, `year` değerlerini ve paylaşılan kısayollar olan
`pd`, `pw`, `pm` ve `py` değerlerini kabul eder. `day`/`pd`, katı bir 24 saatlik aralık yerine Gemini
sorgusuna güncellik yönergesi ekler. `week`, `month`, `year` ve açık
`date_after`/`date_before` aralıkları Gemini Google Search temellendirmesinin
`timeRangeFilter` değerini ayarlar. `country`, `language` ve `domain_filter` desteklenmez.

## Model seçimi

Varsayılan model `gemini-2.5-flash` modelidir (hızlı ve maliyet açısından verimli). Temellendirmeyi destekleyen herhangi bir Gemini
modeli
`plugins.entries.google.config.webSearch.model` üzerinden kullanılabilir.

## Temel URL geçersiz kılmaları

Gemini web aramasının bir operatör proxy'si veya özel Gemini uyumlu uç nokta üzerinden yönlendirilmesi gerektiğinde `plugins.entries.google.config.webSearch.baseUrl` değerini ayarlayın. Bu
ayarlanmamışsa Gemini web araması `models.providers.google.baseUrl` değerini yeniden kullanır. Düz bir
`https://generativelanguage.googleapis.com` değeri
`https://generativelanguage.googleapis.com/v1beta` olarak normalleştirilir; özel proxy yolları ise sondaki eğik çizgiler kırpıldıktan sonra sağlandığı gibi korunur.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tr/tools/brave-search) -- parçacıklarla yapılandırılmış sonuçlar
- [Perplexity Search](/tr/tools/perplexity-search) -- yapılandırılmış sonuçlar + içerik çıkarma
