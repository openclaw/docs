---
read_when:
    - '`web_search` için Gemini kullanmak istiyorsunuz'
    - Bir `GEMINI_API_KEY` anahtarına ihtiyacınız var
    - Google Search grounding istiyorsunuz
summary: Google Search grounding ile Gemini web araması
title: Gemini arama
x-i18n:
    generated_at: "2026-04-24T09:35:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClaw, canlı Google Search sonuçlarıyla desteklenen ve
atıflar içeren AI sentezli yanıtlar döndüren yerleşik
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)
özelliğine sahip Gemini modellerini destekler.

## API anahtarı alın

<Steps>
  <Step title="Bir anahtar oluşturun">
    [Google AI Studio](https://aistudio.google.com/apikey) adresine gidin ve bir
    API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `GEMINI_API_KEY` ayarlayın veya şu komutla yapılandırın:

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
Bir Gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

## Nasıl çalışır

Bağlantı ve özet listesi döndüren geleneksel arama sağlayıcılarının aksine
Gemini, satır içi atıflarla AI sentezli yanıtlar üretmek için Google Search grounding kullanır.
Sonuçlar hem sentezlenmiş yanıtı hem de kaynak URL'leri içerir.

- Gemini grounding'den gelen atıf URL'leri, Google
  yönlendirme URL'lerinden doğrudan URL'lere otomatik olarak çözülür.
- Yönlendirme çözümleme, son atıf URL'sini döndürmeden önce SSRF koruma yolunu (HEAD + yönlendirme denetimleri +
  http/https doğrulaması) kullanır.
- Yönlendirme çözümleme katı SSRF varsayılanlarını kullanır; bu yüzden
  özel/iç hedeflere yönlendirmeler engellenir.

## Desteklenen parametreler

Gemini arama `query` parametresini destekler.

`count`, paylaşılan `web_search` uyumluluğu için kabul edilir, ancak Gemini grounding
yine de N sonuçlu bir liste yerine atıflarla birlikte tek bir sentezlenmiş yanıt döndürür.

`country`, `language`, `freshness` ve
`domain_filter` gibi sağlayıcıya özgü filtreler desteklenmez.

## Model seçimi

Varsayılan model `gemini-2.5-flash` değeridir (hızlı ve maliyet açısından verimli). Grounding destekleyen herhangi bir Gemini
modeli, `plugins.entries.google.config.webSearch.model`
üzerinden kullanılabilir.

## İlgili

- [Web Search overview](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Brave Search](/tr/tools/brave-search) -- özetlerle birlikte yapılandırılmış sonuçlar
- [Perplexity Search](/tr/tools/perplexity-search) -- yapılandırılmış sonuçlar + içerik çıkarımı
