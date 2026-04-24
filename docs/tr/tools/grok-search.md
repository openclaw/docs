---
read_when:
    - '`web_search` için Grok kullanmak istiyorsunuz'
    - Web araması için bir `XAI_API_KEY` gereklidir
summary: xAI web-grounded Responses aracılığıyla Grok web araması
title: Grok arama
x-i18n:
    generated_at: "2026-04-24T09:35:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 15
---

OpenClaw, Grok'u bir `web_search` sağlayıcısı olarak destekler ve canlı arama sonuçlarıyla desteklenen, alıntılar içeren AI sentezli yanıtlar üretmek için xAI web-grounded Responses kullanır.

Aynı `XAI_API_KEY`, X (eski adıyla Twitter) gönderi araması için yerleşik `x_search` aracını da çalıştırabilir. Anahtarı `plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız OpenClaw artık bunu paketlenmiş xAI model sağlayıcısı için de fallback olarak yeniden kullanır.

Repost, yanıt, yer imi veya görüntülenme gibi gönderi düzeyindeki X metrikleri için geniş bir arama sorgusu yerine tam gönderi URL'si veya durum kimliği ile `x_search` kullanmayı tercih edin.

## Onboarding ve yapılandırma

Şu işlemler sırasında **Grok** seçerseniz:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw, aynı `XAI_API_KEY` ile `x_search` özelliğini etkinleştirmek için ayrı bir takip adımı gösterebilir. Bu takip adımı:

- yalnızca `web_search` için Grok'u seçtikten sonra görünür
- ayrı bir üst düzey web-search sağlayıcısı seçeneği değildir
- aynı akışta isteğe bağlı olarak `x_search` modelini ayarlayabilir

Bunu atlarsanız daha sonra yapılandırmada `x_search` özelliğini etkinleştirebilir veya değiştirebilirsiniz.

## API key alın

<Steps>
  <Step title="Bir anahtar oluşturun">
    [xAI](https://console.x.ai/) üzerinden bir API key alın.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `XAI_API_KEY` ayarlayın veya şu komutla yapılandırın:

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
            apiKey: "xai-...", // XAI_API_KEY ayarlıysa isteğe bağlı
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

## Nasıl çalışır

Grok, Google Search grounding yaklaşımına benzer şekilde, satır içi alıntılarla yanıt sentezlemek için xAI web-grounded Responses kullanır.

## Desteklenen parametreler

Grok araması `query` destekler.

`count`, paylaşılan `web_search` uyumluluğu için kabul edilir, ancak Grok yine de N sonuçlu bir liste yerine alıntılar içeren tek bir sentezlenmiş yanıt döndürür.

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Search içinde x_search](/tr/tools/web#x_search) -- xAI aracılığıyla birinci sınıf X araması
- [Gemini Search](/tr/tools/gemini-search) -- Google grounding aracılığıyla AI sentezli yanıtlar
