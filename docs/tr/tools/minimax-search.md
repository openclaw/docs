---
read_when:
    - '`web_search` için MiniMax kullanmak istiyorsunuz'
    - Bir MiniMax Coding Plan anahtarına ihtiyacınız var
    - MiniMax CN/global arama ana makinesi rehberliği istiyorsunuz
summary: Coding Plan arama API'si aracılığıyla MiniMax Search
title: MiniMax arama
x-i18n:
    generated_at: "2026-04-24T09:36:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

OpenClaw, MiniMax'ı `web_search` sağlayıcısı olarak MiniMax
Coding Plan arama API'si üzerinden destekler. Başlıklar, URL'ler,
snippet'ler ve ilgili sorgular içeren yapılandırılmış arama sonuçları döndürür.

## Coding Plan anahtarı alın

<Steps>
  <Step title="Bir anahtar oluşturun">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
    üzerinden bir MiniMax Coding Plan anahtarı oluşturun veya kopyalayın.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `MINIMAX_CODE_PLAN_KEY` ayarlayın veya şu komutla yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw ayrıca bir env takma adı olarak `MINIMAX_CODING_API_KEY` kabul eder. `MINIMAX_API_KEY`,
zaten bir coding-plan token'ına işaret ettiğinde uyumluluk fallback'i olarak hâlâ okunur.

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // MINIMAX_CODE_PLAN_KEY ayarlıysa isteğe bağlı
            region: "global", // veya "cn"
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

`plugins.entries.minimax.config.webSearch.region` ayarlanmamışsa OpenClaw
bölgeyi şu sırayla çözümler:

1. `tools.web.search.minimax.region` / Plugin'e ait `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Bu, CN onboarding veya `MINIMAX_API_HOST=https://api.minimaxi.com/...`
kullanımının MiniMax Search'ü de otomatik olarak CN ana makinesinde tuttuğu anlamına gelir.

MiniMax kimlik doğrulamasını OAuth `minimax-portal` yolu üzerinden yapmış olsanız bile
web araması yine `minimax` sağlayıcı kimliği olarak kaydolur; OAuth sağlayıcı base URL'si
yalnızca CN/global ana makine seçimi için bölge ipucu olarak kullanılır.

## Desteklenen parametreler

MiniMax Search şunları destekler:

- `query`
- `count` (OpenClaw döndürülen sonuç listesini istenen sayıya göre kırpar)

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [MiniMax](/tr/providers/minimax) -- model, görsel, konuşma ve kimlik doğrulama kurulumu
