---
read_when:
    - web_search için MiniMax kullanmak istiyorsunuz
    - Bir MiniMax Coding Plan anahtarına ihtiyacınız var
    - MiniMax CN/global arama ana makinesi rehberliği istiyorsunuz
summary: Coding Plan arama API'si üzerinden MiniMax Search
title: MiniMax Search
x-i18n:
    generated_at: "2026-04-05T14:12:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8c3767790f428fc7e239590a97e9dbee0d3bd6550ca3299ae22da0f5a57231a
    source_path: tools/minimax-search.md
    workflow: 15
---

# MiniMax Search

OpenClaw, MiniMax'ı MiniMax
Coding Plan arama API'si üzerinden bir `web_search` sağlayıcısı olarak destekler. Başlıklar, URL'ler,
snippet'ler ve ilgili sorgular içeren yapılandırılmış arama sonuçları döndürür.

## Coding Plan anahtarı alın

<Steps>
  <Step title="Anahtar oluştur">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
    üzerinden bir MiniMax Coding Plan anahtarı oluşturun veya kopyalayın.
  </Step>
  <Step title="Anahtarı kaydet">
    Gateway ortamında `MINIMAX_CODE_PLAN_KEY` ayarlayın veya şu komutla yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw ayrıca ortam değişkeni takma adı olarak `MINIMAX_CODING_API_KEY` değerini kabul eder. `MINIMAX_API_KEY`,
zaten bir coding-plan token'ına işaret ettiğinde uyumluluk için yedek seçenek olarak okunmaya devam eder.

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if MINIMAX_CODE_PLAN_KEY is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Ortam alternatifi:** Gateway ortamında `MINIMAX_CODE_PLAN_KEY` ayarlayın.
Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

## Bölge seçimi

MiniMax Search şu uç noktaları kullanır:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region` ayarlanmamışsa, OpenClaw
bölgeyi şu sırayla çözümler:

1. `tools.web.search.minimax.region` / plugin'e ait `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Bu, CN onboarding veya `MINIMAX_API_HOST=https://api.minimaxi.com/...`
kullanımının MiniMax Search'ü de otomatik olarak CN ana makinesinde tutacağı anlamına gelir.

MiniMax'ı OAuth `minimax-portal` yolu üzerinden kimlik doğruladıysanız bile,
web search yine `minimax` sağlayıcı kimliği olarak kaydolur; OAuth sağlayıcısı base URL'si
yalnızca CN/global ana makine seçimi için bir bölge ipucu olarak kullanılır.

## Desteklenen parametreler

MiniMax Search şunları destekler:

- `query`
- `count` (OpenClaw dönen sonuç listesini istenen sayıya göre kırpar)

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

## İlgili

- [Web Search genel bakış](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [MiniMax](/tr/providers/minimax) -- model, görsel, konuşma ve kimlik doğrulama kurulumu
