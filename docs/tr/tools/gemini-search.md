---
read_when:
    - '`web_search` için Gemini kullanmak istiyorsunuz'
    - Bir `GEMINI_API_KEY` gerekiyor
    - Google Search grounding istiyorsunuz
summary: Google Search grounding ile Gemini web araması
title: Gemini Arama
x-i18n:
    generated_at: "2026-04-05T14:11:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42644176baca6b4b041142541618f6f68361d410d6f425cc4104cd88d9f7c480
    source_path: tools/gemini-search.md
    workflow: 15
---

# Gemini Arama

OpenClaw, yerleşik
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)
desteğine sahip Gemini modellerini destekler; bu, canlı Google Search sonuçlarıyla
desteklenen ve alıntılar içeren AI tarafından sentezlenmiş yanıtlar döndürür.

## API anahtarı alma

<Steps>
  <Step title="Bir anahtar oluşturun">
    [Google AI Studio](https://aistudio.google.com/apikey) adresine gidin ve bir
    API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `GEMINI_API_KEY` ayarlayın veya şu yolla yapılandırın:

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
            apiKey: "AIza...", // GEMINI_API_KEY ayarlıysa isteğe bağlı
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

**Ortam alternatifi:** Gateway ortamında `GEMINI_API_KEY` ayarlayın.
Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

## Nasıl çalışır

Bağlantı ve snippet listesi döndüren geleneksel arama sağlayıcılarının aksine,
Gemini, satır içi alıntılarla AI tarafından sentezlenmiş yanıtlar üretmek için
Google Search grounding kullanır. Sonuçlar hem sentezlenmiş yanıtı hem de kaynak
URL'leri içerir.

- Gemini grounding'den gelen alıntı URL'leri, Google
  yönlendirme URL'lerinden doğrudan URL'lere otomatik olarak çözümlenir.
- Son yönlendirme URL'si döndürülmeden önce yönlendirme çözümleme,
  SSRF koruma yolunu (HEAD + yönlendirme denetimleri +
  http/https doğrulaması) kullanır.
- Yönlendirme çözümleme katı SSRF varsayılanlarını kullanır; bu nedenle
  özel/iç hedeflere yapılan yönlendirmeler engellenir.

## Desteklenen parametreler

Gemini arama `query` parametresini destekler.

`count`, paylaşılan `web_search` uyumluluğu için kabul edilir, ancak Gemini grounding
yine de N sonuçlu bir
liste yerine alıntılar içeren tek bir sentezlenmiş yanıt döndürür.

`country`, `language`, `freshness` ve
`domain_filter` gibi sağlayıcıya özgü filtreler desteklenmez.

## Model seçimi

Varsayılan model `gemini-2.5-flash` modelidir (hızlı ve maliyet açısından verimli). Grounding destekleyen herhangi bir Gemini
modeli,
`plugins.entries.google.config.webSearch.model` üzerinden kullanılabilir.

## İlgili

- [Web Search genel bakış](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tools/brave-search) -- snippet'lerle yapılandırılmış sonuçlar
- [Perplexity Search](/tools/perplexity-search) -- yapılandırılmış sonuçlar + içerik çıkarma
