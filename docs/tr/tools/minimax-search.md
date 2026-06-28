---
read_when:
    - MiniMax'i web_search için kullanmak istiyorsunuz
    - Bir MiniMax Token Plan anahtarına veya OAuth belirtecine ihtiyacınız var
    - MiniMax CN/küresel arama hostu rehberliği istiyorsunuz
summary: Token Plan arama API'si aracılığıyla MiniMax Search
title: MiniMax araması
x-i18n:
    generated_at: "2026-05-11T20:38:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw, MiniMax Token Plan arama API'si üzerinden bir `web_search` sağlayıcısı olarak MiniMax'i destekler. Başlıklar, URL'ler, parçacıklar ve ilgili sorgular içeren yapılandırılmış arama sonuçları döndürür.

## Token Plan kimlik bilgisi alın

<Steps>
  <Step title="Anahtar oluşturun">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) üzerinden bir MiniMax Token Plan anahtarı oluşturun veya kopyalayın.
    OAuth kurulumları bunun yerine `MINIMAX_OAUTH_TOKEN` değerini yeniden kullanabilir.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `MINIMAX_CODE_PLAN_KEY` değerini ayarlayın veya şununla yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw ayrıca env takma adları olarak `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` ve `MINIMAX_API_KEY` değerlerini kabul eder. `MINIMAX_API_KEY`, arama etkinleştirilmiş bir Token Plan kimlik bilgisine işaret etmelidir; sıradan MiniMax model API anahtarları Token Plan arama uç noktası tarafından kabul edilmeyebilir.

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

**Ortam alternatifi:** Gateway ortamında `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY` değerini ayarlayın.
Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

## Bölge seçimi

MiniMax Search şu uç noktaları kullanır:

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region` ayarlanmamışsa OpenClaw bölgeyi şu sırayla çözer:

1. `tools.web.search.minimax.region` / Plugin'e ait `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Bu, CN ilk katılımının veya `MINIMAX_API_HOST=https://api.minimaxi.com/...` değerinin MiniMax Search'ü otomatik olarak CN ana makinesinde de tuttuğu anlamına gelir.

MiniMax kimliğini OAuth `minimax-portal` yolu üzerinden doğrulamış olsanız bile, web araması sağlayıcı kimliği olarak yine `minimax` ile kaydedilir; OAuth sağlayıcı temel URL'si CN/global ana makine seçimi için bölge ipucu olarak kullanılır ve `MINIMAX_OAUTH_TOKEN`, MiniMax Search taşıyıcı kimlik bilgisini karşılayabilir.

## Desteklenen parametreler

| Parametre | Tür     | Kısıtlamalar | Açıklama                                                                    |
| --------- | ------- | ------------ | ---------------------------------------------------------------------------- |
| `query`   | string  | required     | Arama sorgusu dizesi.                                                        |
| `count`   | integer | 1-10         | Döndürülecek sonuç sayısı. OpenClaw döndürülen listeyi bu boyuta kırpar.     |

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [MiniMax](/tr/providers/minimax) -- model, görüntü, konuşma ve kimlik doğrulama kurulumu
