---
read_when:
    - web_search için Grok'u kullanmak istiyorsunuz
    - Web araması için bir XAI_API_KEY gerekir
summary: xAI'nin internete dayalı yanıtları aracılığıyla Grok internet araması
title: Grok araması
x-i18n:
    generated_at: "2026-05-10T19:57:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw, canlı arama sonuçlarıyla desteklenen ve alıntılar içeren, yapay zeka tarafından sentezlenmiş yanıtlar üretmek için xAI web tabanlı yanıtlarını kullanarak Grok'u bir `web_search` sağlayıcısı olarak destekler.

Aynı xAI API anahtarı, X (eski adıyla Twitter) gönderi araması için yerleşik `x_search` aracını ve `code_execution` aracını da çalıştırabilir. Anahtarı `plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız OpenClaw artık bunu paketle gelen xAI model sağlayıcısı için de yedek olarak yeniden kullanır.

Yeniden gönderiler, yanıtlar, yer imleri veya görüntülemeler gibi gönderi düzeyindeki X metrikleri için geniş bir arama sorgusu yerine tam gönderi URL'si veya durum kimliğiyle `x_search` kullanmayı tercih edin.

## İlk kullanıma alma ve yapılandırma

Şunlar sırasında **Grok** seçerseniz:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw, aynı `XAI_API_KEY` ile `x_search` özelliğini etkinleştirmek için ayrı bir takip adımı gösterebilir. Bu takip adımı:

- yalnızca `web_search` için Grok'u seçtikten sonra görünür
- ayrı bir üst düzey web arama sağlayıcısı seçeneği değildir
- aynı akış sırasında isteğe bağlı olarak `x_search` modelini ayarlayabilir

Bunu atlarsanız `x_search` özelliğini daha sonra yapılandırmada etkinleştirebilir veya değiştirebilirsiniz.

## API anahtarı alma

<Steps>
  <Step title="Anahtar oluşturma">
    [xAI](https://console.x.ai/) üzerinden bir API anahtarı alın.
  </Step>
  <Step title="Anahtarı saklama">
    Gateway ortamında `XAI_API_KEY` ayarlayın veya şununla yapılandırın:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Ortam alternatifi:** Gateway ortamında `XAI_API_KEY` ayarlayın.
Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

## Nasıl çalışır?

Grok, Gemini'nin Google Arama temellendirme yaklaşımına benzer şekilde, satır içi alıntılarla yanıtlar sentezlemek için xAI web tabanlı yanıtlarını kullanır.

## Desteklenen parametreler

Grok araması `query` destekler.

`count`, paylaşılan `web_search` uyumluluğu için kabul edilir, ancak Grok yine de N sonuçluk bir liste yerine alıntılar içeren tek bir sentezlenmiş yanıt döndürür.

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

xAI Responses web tabanlı aramaları, paylaşılan `web_search` varsayılanından daha uzun sürebildiği için Grok sağlayıcıya özgü 60 saniyelik varsayılan zaman aşımı kullanır. Bunu geçersiz kılmak için `tools.web.search.timeoutSeconds` ayarlayın.

## Temel URL geçersiz kılmaları

Grok web aramasının bir operatör proxy'si veya xAI uyumlu Responses uç noktası üzerinden yönlendirilmesi gerektiğinde `plugins.entries.xai.config.webSearch.baseUrl` ayarlayın. OpenClaw, sondaki eğik çizgileri kırptıktan sonra `<baseUrl>/responses` adresine gönderi yapar. `plugins.entries.xai.config.xSearch.baseUrl` ayarlanmamışsa `x_search` aynı `webSearch.baseUrl` yedeğini kullanır.

## İlgili

- [Web Araması genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Araması içinde x_search](/tr/tools/web#x_search) -- xAI üzerinden birinci sınıf X araması
- [Gemini Araması](/tr/tools/gemini-search) -- Google temellendirmesi üzerinden yapay zeka tarafından sentezlenmiş yanıtlar
