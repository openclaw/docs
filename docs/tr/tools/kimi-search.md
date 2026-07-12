---
read_when:
    - web_search için Kimi kullanmak istiyorsunuz
    - Bir KIMI_API_KEY veya MOONSHOT_API_KEY gereklidir
summary: Moonshot web araması aracılığıyla Kimi web araması
title: Kimi araması
x-i18n:
    generated_at: "2026-07-12T12:53:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi, Moonshot'ın yerel web aramasıyla desteklenen bir `web_search` sağlayıcısıdır. Moonshot,
sıralanmış bir sonuç listesi döndürmek yerine Gemini ve Grok'un
kaynaklandırılmış yanıt sağlayıcılarına benzer şekilde satır içi atıflar içeren tek bir yanıt sentezler.

## Kurulum

<Steps>
  <Step title="Anahtar oluşturun">
    [Moonshot AI](https://platform.moonshot.cn/) üzerinden bir API anahtarı edinin.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `KIMI_API_KEY` veya `MOONSHOT_API_KEY` değişkenini ayarlayın (bir
    Gateway kurulumu için bunu `~/.openclaw/.env` dosyasına ekleyin) ya da şu komutla yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` veya `openclaw configure --section web` sırasında **Kimi** seçildiğinde
ayrıca şunlar istenir:

- Moonshot API bölgesi: `https://api.moonshot.ai/v1` veya `https://api.moonshot.cn/v1`
- web araması modeli (varsayılan: `kimi-k2.6`)

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // KIMI_API_KEY veya MOONSHOT_API_KEY ayarlanmışsa isteğe bağlıdır
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

`tools.web.search.provider` belirtilmediğinde kullanılabilir API anahtarlarından otomatik olarak algılanır;
birden fazla arama kimlik bilgisi yapılandırılmışsa bunu açıkça `kimi` olarak ayarlayın.

`tools.web.search.kimi` altındaki eşdeğer kapsamlı biçim (`apiKey`, `baseUrl`, `model`)
de çalışır; her iki yapı da aynı çözümlenmiş yapılandırmada birleştirilir.

Varsayılanlar: `baseUrl` belirtilmediğinde `https://api.moonshot.ai/v1`, `model`
ise `kimi-k2.6` olarak varsayılır.

Sohbet trafiği Çin ana makinesini (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`) kullanıyorsa Kimi `web_search`, kendi `baseUrl` değeri
ayarlanmamış olduğunda bu ana makineyi otomatik olarak yeniden kullanır; böylece `.cn` anahtarları
yanlışlıkla uluslararası uç noktaya (bu anahtarlar için HTTP 401 döndürür) gönderilmez. Bu
devralmayı geçersiz kılmak için açık bir Kimi `baseUrl` değeri ayarlayın.

## Kaynaklandırma gereksinimi

OpenClaw, yalnızca Moonshot'ın yanıtı bir `$web_search` araç çağrısı
yeniden oynatımı, `search_results` veya atıf URL'leri gibi yerel web araması
kaynaklandırma kanıtı içerdiğinde Kimi `web_search` sonucunu döndürür. Kimi,
kaynaklandırma olmadan doğrudan yanıt verirse (örneğin, "İnternette gezinemiyorum"),
OpenClaw bu metni arama sonucu olarak değerlendirmek yerine
`kimi_web_search_ungrounded` hatası döndürür. Sorguyu yeniden deneyin, Brave gibi
yapılandırılmış bir sağlayıcıya geçin veya zaten bir hedef URL'niz varsa `web_fetch` /
tarayıcı aracını kullanın.

## Araç parametreleri

| Parametre                                                       | Destek                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `query`                                                         | Evet                                                                                                                            |
| `count`                                                         | Sağlayıcılar arası uyumluluk için kabul edilir ancak yok sayılır: Kimi, N sonuçlu bir liste değil her zaman sentezlenmiş tek bir yanıt döndürür |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Hayır                                                                                                                           |

## İlgili

- [Web Aramasına genel bakış](/tr/tools/web) - tüm sağlayıcılar ve otomatik algılama
- [Moonshot AI](/tr/providers/moonshot) - Moonshot modeli ve Kimi Coding sağlayıcısı belgeleri
- [Gemini Search](/tr/tools/gemini-search) - Google kaynaklandırması aracılığıyla yapay zekâ tarafından sentezlenen yanıtlar
- [Grok Search](/tr/tools/grok-search) - xAI kaynaklandırması aracılığıyla yapay zekâ tarafından sentezlenen yanıtlar
