---
read_when:
    - web_search için Grok kullanmak istiyorsunuz
    - Web araması için XAI_API_KEY gerekir
summary: xAI'nin internet temelli yanıtlarıyla Grok internet araması
title: Grok araması
x-i18n:
    generated_at: "2026-05-02T09:08:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw, canlı arama sonuçlarıyla desteklenen ve atıflar içeren, AI tarafından sentezlenmiş yanıtlar üretmek için xAI web temelli
yanıtlarını kullanarak Grok'u bir `web_search` sağlayıcısı olarak destekler.

Aynı `XAI_API_KEY`, X
(önceden Twitter) gönderi araması için yerleşik `x_search` aracını da çalıştırabilir. Anahtarı
`plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız, OpenClaw artık bunu
paketle gelen xAI model sağlayıcısı için de yedek olarak yeniden kullanır.

Yeniden gönderiler, yanıtlar, yer işaretleri veya görüntülemeler gibi gönderi düzeyindeki X metrikleri için geniş bir arama
sorgusu yerine tam gönderi URL'si veya durum kimliğiyle
`x_search` kullanmayı tercih edin.

## Onboarding ve yapılandırma

Şunlar sırasında **Grok** seçerseniz:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw, aynı `XAI_API_KEY` ile `x_search` özelliğini etkinleştirmek için ayrı bir takip adımı
gösterebilir. Bu takip adımı:

- yalnızca `web_search` için Grok'u seçtikten sonra görünür
- ayrı bir üst düzey web araması sağlayıcı seçeneği değildir
- aynı akış sırasında isteğe bağlı olarak `x_search` modelini ayarlayabilir

Bunu atlarsanız, `x_search` özelliğini daha sonra yapılandırmada etkinleştirebilir veya değiştirebilirsiniz.

## Bir API anahtarı alın

<Steps>
  <Step title="Anahtar oluşturun">
    [xAI](https://console.x.ai/) üzerinden bir API anahtarı alın.
  </Step>
  <Step title="Anahtarı saklayın">
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
            apiKey: "xai-...", // XAI_API_KEY ayarlanmışsa isteğe bağlıdır
            baseUrl: "https://api.x.ai/v1", // isteğe bağlı Responses API proxy/temel URL geçersiz kılma
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

Grok, Gemini'nin Google Search temellendirme yaklaşımına benzer şekilde, satır içi
atıflarla yanıtlar sentezlemek için xAI web temelli yanıtlarını kullanır.

## Desteklenen parametreler

Grok araması `query` destekler.

`count`, paylaşılan `web_search` uyumluluğu için kabul edilir, ancak Grok yine de
N sonuçlu bir liste yerine atıflar içeren tek bir sentezlenmiş yanıt döndürür.

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

Grok, sağlayıcıya özgü 60 saniyelik varsayılan zaman aşımı kullanır çünkü xAI Responses
web temelli aramaları paylaşılan `web_search` varsayılanından daha uzun sürebilir. Bunu geçersiz kılmak için
`tools.web.search.timeoutSeconds` ayarlayın.

## Temel URL geçersiz kılmaları

Grok web aramasının bir operatör proxy'si veya xAI uyumlu Responses uç noktası üzerinden
yönlendirilmesi gerektiğinde `plugins.entries.xai.config.webSearch.baseUrl` ayarlayın. OpenClaw,
sondaki eğik çizgileri kırptıktan sonra `<baseUrl>/responses` adresine gönderi yapar. `x_search`,
`plugins.entries.xai.config.xSearch.baseUrl` ayarlanmadığı sürece aynı `webSearch.baseUrl` yedeğini
kullanır.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Search içinde x_search](/tr/tools/web#x_search) -- xAI üzerinden birinci sınıf X araması
- [Gemini Search](/tr/tools/gemini-search) -- Google temellendirmesi aracılığıyla AI tarafından sentezlenmiş yanıtlar
