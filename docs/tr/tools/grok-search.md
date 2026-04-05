---
read_when:
    - web_search için Grok kullanmak istiyorsunuz
    - Web araması için bir XAI_API_KEY gerekiyor
summary: xAI web-grounded yanıtları üzerinden Grok web araması
title: Grok Search
x-i18n:
    generated_at: "2026-04-05T14:11:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae2343012eebbe75d3ecdde3cb4470415c3275b694d0339bc26c46675a652054
    source_path: tools/grok-search.md
    workflow: 15
---

# Grok Search

OpenClaw, canlı arama sonuçları ve alıntılarla desteklenen,
YZ tarafından sentezlenmiş yanıtlar üretmek için xAI web-grounded
yanıtlarını kullanarak Grok’u bir `web_search` sağlayıcısı olarak destekler.

Aynı `XAI_API_KEY`, X için yerleşik `x_search` aracını da çalıştırabilir
(eski adıyla Twitter) gönderi araması. Anahtarı
`plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız, OpenClaw artık bunu
paketlenmiş xAI model sağlayıcısı için de geri dönüş olarak yeniden kullanır.

Yeniden gönderiler, yanıtlar, yer imleri veya görüntülemeler gibi gönderi düzeyindeki X metrikleri için,
geniş bir arama sorgusu yerine tam gönderi URL’si veya durum kimliği ile
`x_search` tercih edin.

## Onboarding ve yapılandırma

Şu işlemler sırasında **Grok** seçerseniz:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw, aynı `XAI_API_KEY` ile `x_search` etkinleştirmek için ayrı bir takip adımı gösterebilir. Bu takip adımı:

- yalnızca `web_search` için Grok’u seçtikten sonra görünür
- ayrı bir üst düzey web arama sağlayıcısı seçeneği değildir
- aynı akış sırasında isteğe bağlı olarak `x_search` modelini ayarlayabilir

Bunu atlarsanız, `x_search` daha sonra yapılandırmada etkinleştirebilir veya değiştirebilirsiniz.

## Bir API anahtarı alın

<Steps>
  <Step title="Bir anahtar oluşturun">
    [xAI](https://console.x.ai/) üzerinden bir API anahtarı alın.
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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
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

Grok, Gemini’nin Google Search grounding yaklaşımına benzer şekilde,
satır içi alıntılarla yanıtları sentezlemek için xAI web-grounded yanıtlarını kullanır.

## Desteklenen parametreler

Grok arama `query` parametresini destekler.

Paylaşılan `web_search` uyumluluğu için `count` kabul edilir, ancak Grok yine de
N sonuçlu bir liste yerine alıntılar içeren tek bir sentezlenmiş yanıt döndürür.

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

## İlgili

- [Web Search genel bakışı](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Search içinde x_search](/tools/web#x_search) -- xAI üzerinden birinci sınıf X araması
- [Gemini Search](/tools/gemini-search) -- Google grounding üzerinden YZ tarafından sentezlenmiş yanıtlar
