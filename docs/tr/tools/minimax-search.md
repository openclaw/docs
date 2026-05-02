---
read_when:
    - web_search için MiniMax kullanmak istiyorsunuz
    - MiniMax Token Plan anahtarı veya OAuth belirteci gerekir
    - MiniMax CN/küresel arama sunucusu rehberliği istiyorsunuz
summary: Token Plan arama API'si aracılığıyla MiniMax Search
title: MiniMax arama
x-i18n:
    generated_at: "2026-05-02T09:08:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw, MiniMax Token Plan arama API'si üzerinden MiniMax'i bir `web_search` sağlayıcısı olarak destekler. Başlıklar, URL'ler, snippet'ler ve ilgili sorgular içeren yapılandırılmış arama sonuçları döndürür.

## Token Plan kimlik bilgisi alın

<Steps>
  <Step title="Anahtar oluşturun">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) üzerinden bir MiniMax Token Plan anahtarı oluşturun veya kopyalayın.
    OAuth kurulumları bunun yerine `MINIMAX_OAUTH_TOKEN` öğesini yeniden kullanabilir.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `MINIMAX_CODE_PLAN_KEY` ayarlayın veya şu komutla yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw ayrıca `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` ve
`MINIMAX_API_KEY` öğelerini ortam takma adları olarak kabul eder. `MINIMAX_API_KEY`,
arama etkinleştirilmiş bir Token Plan kimlik bilgisine işaret etmelidir; sıradan MiniMax model API anahtarları Token Plan arama uç noktası tarafından kabul edilmeyebilir.

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
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

**Ortam alternatifi:** Gateway ortamında `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY` ayarlayın.
Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

## Bölge seçimi

MiniMax Search şu uç noktaları kullanır:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region` ayarlanmamışsa OpenClaw,
bölgeyi şu sırayla çözümler:

1. `tools.web.search.minimax.region` / Plugin'e ait `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Bu, CN katılımı veya `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search'ü de otomatik olarak CN ana makinesinde tutar anlamına gelir.

MiniMax kimlik doğrulamasını OAuth `minimax-portal` yolu üzerinden yapmış olsanız bile,
web araması hâlâ sağlayıcı kimliği `minimax` olarak kaydedilir; OAuth sağlayıcı temel URL'si
CN/global ana makine seçimi için bir bölge ipucu olarak kullanılır ve `MINIMAX_OAUTH_TOKEN`
MiniMax Search bearer kimlik bilgisini karşılayabilir.

## Desteklenen parametreler

MiniMax Search şunları destekler:

- `query`
- `count` (OpenClaw döndürülen sonuç listesini istenen sayıya kırpar)

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

## İlgili

- [Web Araması genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [MiniMax](/tr/providers/minimax) -- model, görüntü, konuşma ve kimlik doğrulama kurulumu
