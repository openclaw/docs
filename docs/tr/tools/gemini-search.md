---
read_when:
    - web_search için Gemini'yi kullanmak istiyorsunuz
    - GEMINI_API_KEY veya models.providers.google.apiKey gerekir
    - Google Arama temellendirmesi istiyorsunuz
summary: Google Search temellendirmesiyle Gemini web araması
title: Gemini araması
x-i18n:
    generated_at: "2026-05-02T09:08:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw, yerleşik
[Google Search ile temellendirme](https://ai.google.dev/gemini-api/docs/grounding)
özelliğine sahip Gemini modellerini destekler; bu özellik, canlı Google Search sonuçlarıyla
desteklenen ve alıntılar içeren, yapay zeka tarafından sentezlenmiş yanıtlar döndürür.

## API anahtarı alma

<Steps>
  <Step title="Anahtar oluşturun">
    [Google AI Studio](https://aistudio.google.com/apikey) adresine gidin ve bir
    API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `GEMINI_API_KEY` değerini ayarlayın, `models.providers.google.apiKey`
    değerini yeniden kullanın veya şu komutla özel bir web araması anahtarı yapılandırın:

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
`plugins.entries.google.config.webSearch.apiKey` değerini, sonra `GEMINI_API_KEY`
değerini, ardından `models.providers.google.apiKey` değerini kullanır. Temel URL'ler için özel
`plugins.entries.google.config.webSearch.baseUrl`, `models.providers.google.baseUrl`
öncesinde öncelik kazanır.

Bir gateway kurulumu için ortam anahtarlarını `~/.openclaw/.env` içine koyun.

## Nasıl çalışır

Bağlantı ve kısa parçacık listesi döndüren geleneksel arama sağlayıcılarının
aksine Gemini, satır içi alıntılarla yapay zeka tarafından sentezlenmiş yanıtlar
üretmek için Google Search ile temellendirmeyi kullanır. Sonuçlar hem sentezlenmiş
yanıtı hem de kaynak URL'leri içerir.

- Gemini temellendirmesinden gelen alıntı URL'leri, Google yönlendirme
  URL'lerinden otomatik olarak doğrudan URL'lere çözümlenir.
- Yönlendirme çözümlemesi, son alıntı URL'sini döndürmeden önce SSRF koruma yolunu
  (HEAD + yönlendirme denetimleri + http/https doğrulaması) kullanır.
- Yönlendirme çözümlemesi katı SSRF varsayılanlarını kullanır, bu nedenle özel/dahili
  hedeflere yönlendirmeler engellenir.

## Desteklenen parametreler

Gemini araması `query`, `freshness`, `date_after` ve `date_before` değerlerini destekler.

`count`, paylaşılan `web_search` uyumluluğu için kabul edilir, ancak Gemini temellendirmesi
N sonuçlu bir liste yerine alıntılar içeren tek bir sentezlenmiş yanıt döndürmeye
devam eder.

`freshness`, `day`, `week`, `month`, `year` ve paylaşılan kısayollar olan
`pd`, `pw`, `pm` ve `py` değerlerini kabul eder. OpenClaw bu değerleri veya açık
bir `date_after`/`date_before` aralığını Gemini Google Search temellendirmesinin
`timeRangeFilter` değerine dönüştürür. `country`, `language` ve `domain_filter`
desteklenmez.

## Model seçimi

Varsayılan model `gemini-2.5-flash` değeridir (hızlı ve maliyet açısından verimli).
Temellendirmeyi destekleyen herhangi bir Gemini modeli
`plugins.entries.google.config.webSearch.model` üzerinden kullanılabilir.

## Temel URL geçersiz kılmaları

Gemini web aramasının bir operatör proxy'si veya özel Gemini uyumlu uç nokta
üzerinden yönlendirilmesi gerektiğinde `plugins.entries.google.config.webSearch.baseUrl`
değerini ayarlayın. Bu ayarlanmamışsa Gemini web araması `models.providers.google.baseUrl`
değerini yeniden kullanır. Düz bir `https://generativelanguage.googleapis.com`
değeri `https://generativelanguage.googleapis.com/v1beta` olarak normalleştirilir;
özel proxy yolları ise sondaki eğik çizgiler kırpıldıktan sonra sağlandığı gibi
korunur.

## İlgili

- [Web Araması genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tr/tools/brave-search) -- kısa parçacıklarla yapılandırılmış sonuçlar
- [Perplexity Search](/tr/tools/perplexity-search) -- yapılandırılmış sonuçlar + içerik çıkarma
