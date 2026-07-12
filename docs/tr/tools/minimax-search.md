---
read_when:
    - web_search için MiniMax kullanmak istiyorsunuz
    - MiniMax Token Plan anahtarına veya OAuth token'ına ihtiyacınız var
    - MiniMax CN/global arama sunucusu yönergelerini istiyorsunuz
summary: Token Plan arama API'si üzerinden MiniMax Search
title: MiniMax araması
x-i18n:
    generated_at: "2026-07-12T12:18:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw, MiniMax Token Plan arama API'si aracılığıyla MiniMax'ı bir `web_search` sağlayıcısı olarak destekler. Başlıklar, URL'ler, özet parçacıkları ve ilgili sorgular içeren yapılandırılmış arama sonuçları döndürür.

## Token Plan kimlik bilgisi edinme

<Steps>
  <Step title="Anahtar oluşturun">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) üzerinden bir MiniMax Token Plan anahtarı oluşturun veya kopyalayın.
    OAuth kurulumları bunun yerine `MINIMAX_OAUTH_TOKEN` değerini yeniden kullanabilir.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `MINIMAX_CODE_PLAN_KEY` değişkenini ayarlayın veya şununla yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw ayrıca ortam değişkeni takma adları olarak `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` ve `MINIMAX_API_KEY` değerlerini kabul eder; bunlar `MINIMAX_CODE_PLAN_KEY` sonrasında bu sırayla kontrol edilir. `MINIMAX_API_KEY`, arama etkinleştirilmiş bir Token Plan kimlik bilgisine işaret etmelidir; sıradan MiniMax model API anahtarları Token Plan arama uç noktası tarafından kabul edilmeyebilir.

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // bir MiniMax Token Plan ortam değişkeni ayarlanmışsa isteğe bağlıdır
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

**Ortam alternatifi:** Gateway ortamında `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY` değerini ayarlayın.
Bir Gateway kurulumu için bunu `~/.openclaw/.env` dosyasına ekleyin.

## Bölge seçimi

MiniMax Search şu uç noktaları kullanır:

- Küresel: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region` ayarlanmamışsa OpenClaw bölgeyi şu sırayla belirler:

1. `tools.web.search.minimax.region` / Plugin'e ait `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Bu, CN ilk kurulumunun veya `MINIMAX_API_HOST=https://api.minimaxi.com/...` ayarının MiniMax Search'ü de otomatik olarak CN ana makinesinde tuttuğu anlamına gelir.

MiniMax kimliğini OAuth `minimax-portal` yolu üzerinden doğrulamış olsanız bile web araması sağlayıcı kimliği olarak `minimax` ile kaydedilmeye devam eder; OAuth sağlayıcısının temel URL'si, CN/küresel ana makine seçimi için bölge ipucu olarak kullanılır ve `MINIMAX_OAUTH_TOKEN`, MiniMax Search taşıyıcı kimlik bilgisi gereksinimini karşılayabilir.

## Desteklenen parametreler

| Parametre | Tür     | Kısıtlamalar       | Açıklama                                                                         |
| --------- | ------- | ------------------ | -------------------------------------------------------------------------------- |
| `query`   | dize    | gerekli            | Arama sorgusu dizesi.                                                            |
| `count`   | tam sayı | 1-10, varsayılan 5 | Döndürülecek sonuç sayısı. OpenClaw, döndürülen listeyi bu boyuta göre kırpar.    |

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

## İlgili

- [Web Aramasına genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [MiniMax](/tr/providers/minimax) -- model, görüntü, konuşma ve kimlik doğrulama kurulumu
