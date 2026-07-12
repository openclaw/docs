---
read_when:
    - web_search için Gemini'ı kullanmak istiyorsunuz
    - Bir GEMINI_API_KEY veya models.providers.google.apiKey gereklidir
    - Google Arama ile temellendirme istiyorsunuz
summary: Google Search temellendirmesiyle Gemini web araması
title: Gemini araması
x-i18n:
    generated_at: "2026-07-12T12:48:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw, canlı Google Arama sonuçlarıyla desteklenen ve kaynak gösterimleri içeren, yapay zekâ tarafından sentezlenmiş yanıtlar döndüren yerleşik
[Google Arama temellendirmesine](https://ai.google.dev/gemini-api/docs/grounding)
sahip Gemini modellerini destekler.

## API anahtarı edinme

<Steps>
  <Step title="Anahtar oluşturun">
    [Google AI Studio](https://aistudio.google.com/apikey) adresine gidin ve bir
    API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `GEMINI_API_KEY` değerini ayarlayın,
    `models.providers.google.apiKey` değerini yeniden kullanın veya şununla özel bir web arama anahtarı yapılandırın:

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
            apiKey: "AIza...", // GEMINI_API_KEY veya models.providers.google.apiKey ayarlanmışsa isteğe bağlıdır
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // isteğe bağlıdır; models.providers.google.baseUrl değerine geri döner
            model: "gemini-2.5-flash", // varsayılan
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
`plugins.entries.google.config.webSearch.apiKey`, ardından `GEMINI_API_KEY`,
son olarak `models.providers.google.apiKey` değerini kullanır. Temel URL'ler için
özel `plugins.entries.google.config.webSearch.baseUrl` değeri,
`models.providers.google.baseUrl` değerinden önce gelir.

Gateway kurulumunda ortam anahtarlarını `~/.openclaw/.env` dosyasına yerleştirin.

## Nasıl çalışır?

Bağlantı ve özet parçacıklarından oluşan bir liste döndüren geleneksel arama sağlayıcılarının
aksine Gemini, satır içi kaynak gösterimleriyle yapay zekâ tarafından sentezlenmiş yanıtlar üretmek için
Google Arama temellendirmesini kullanır. Sonuçlar hem sentezlenmiş yanıtı hem de kaynak
URL'lerini içerir.

- Gemini temellendirmesindeki kaynak gösterimi URL'leri, OpenClaw'ın SSRF korumalı
  getirme yolu (yönlendirmeleri izleme, http/https doğrulaması) üzerinden yapılan bir HEAD isteğiyle Google
  yönlendirme URL'lerinden doğrudan URL'lere otomatik olarak çözümlenir.
- Yönlendirme çözümlemesi katı SSRF varsayılanlarını kullanır; bu nedenle
  özel/dahili hedeflere yönlendirmeler engellenir.

## Desteklenen parametreler

Gemini araması `query`, `freshness`, `date_after` ve `date_before` parametrelerini destekler.

`count`, ortak `web_search` uyumluluğu için kabul edilir; ancak Gemini temellendirmesi
N sonuçlu bir liste yerine kaynak gösterimleri içeren tek bir sentezlenmiş yanıt
döndürmeye devam eder.

`freshness`; `day`, `week`, `month`, `year` ve ortak kısayollar olan
`pd`, `pw`, `pm` ile `py` değerlerini kabul eder. `day`/`pd`, katı bir 24 saatlik aralık yerine Gemini
sorgusuna güncellik talimatı ekler. `week`, `month`, `year` ve açık
`date_after`/`date_before` aralıkları, Gemini Google Arama temellendirmesinin
`timeRangeFilter` değerini ayarlar. `country`, `language` ve `domain_filter` desteklenmez.

## Model seçimi

Varsayılan model `gemini-2.5-flash` modelidir (hızlı ve uygun maliyetli). Temellendirmeyi
destekleyen herhangi bir Gemini modeli
`plugins.entries.google.config.webSearch.model` üzerinden kullanılabilir.

## Temel URL geçersiz kılmaları

Gemini web aramasının bir operatör proxy'si veya özel bir Gemini uyumlu uç nokta
üzerinden yönlendirilmesi gerektiğinde `plugins.entries.google.config.webSearch.baseUrl` değerini ayarlayın. Bu
değer ayarlanmamışsa Gemini web araması `models.providers.google.baseUrl` değerini yeniden kullanır. Düz bir
`https://generativelanguage.googleapis.com` değeri
`https://generativelanguage.googleapis.com/v1beta` olarak normalleştirilir; özel proxy yolları ise
sondaki eğik çizgiler kaldırıldıktan sonra sağlandığı biçimde korunur.

## İlgili içerikler

- [Web Aramasına genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tr/tools/brave-search) -- özet parçacıkları içeren yapılandırılmış sonuçlar
- [Perplexity Search](/tr/tools/perplexity-search) -- yapılandırılmış sonuçlar + içerik çıkarma
