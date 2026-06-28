---
read_when:
    - web_search için Kimi kullanmak istiyorsunuz
    - KIMI_API_KEY veya MOONSHOT_API_KEY gereklidir
summary: Moonshot web araması aracılığıyla Kimi web araması
title: Kimi araması
x-i18n:
    generated_at: "2026-05-02T09:08:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw, atıflarla yapay zeka sentezli yanıtlar üretmek için Moonshot web aramasını kullanarak Kimi'yi bir `web_search` sağlayıcısı olarak destekler.

## Bir API anahtarı alın

<Steps>
  <Step title="Bir anahtar oluşturun">
    [Moonshot AI](https://platform.moonshot.cn/) üzerinden bir API anahtarı alın.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `KIMI_API_KEY` veya `MOONSHOT_API_KEY` ayarlayın ya da
    şununla yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` veya `openclaw configure --section web` sırasında **Kimi** seçtiğinizde, OpenClaw ayrıca şunları isteyebilir:

- Moonshot API bölgesi:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- varsayılan Kimi web arama modeli (varsayılan `kimi-k2.6`)

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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

Sohbet için Çin API ana makinesini kullanırsanız (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), `tools.web.search.kimi.baseUrl` atlandığında OpenClaw, Kimi `web_search` için aynı ana makineyi yeniden kullanır; böylece [platform.moonshot.cn](https://platform.moonshot.cn/) üzerinden alınan anahtarlar yanlışlıkla uluslararası uç noktaya gitmez (bu genellikle HTTP 401 döndürür). Farklı bir arama temel URL'si gerektiğinde `tools.web.search.kimi.baseUrl` ile geçersiz kılın.

**Ortam alternatifi:** Gateway ortamında `KIMI_API_KEY` veya `MOONSHOT_API_KEY` ayarlayın. Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

`baseUrl` atlarsanız OpenClaw varsayılan olarak `https://api.moonshot.ai/v1` kullanır.
`model` atlarsanız OpenClaw varsayılan olarak `kimi-k2.6` kullanır.

## Nasıl çalışır

Kimi, Gemini ve Grok'un temellendirilmiş yanıt yaklaşımına benzer şekilde, satır içi atıflarla yanıt sentezlemek için Moonshot web aramasını kullanır.

OpenClaw, Kimi `web_search` işlemini yalnızca Moonshot yeniden oynatılabilir bir `$web_search` araç yükü, `search_results` veya atıf URL'leri gibi yerel web araması temellendirme kanıtı döndürdükten sonra başarılı sayar. Kimi, temellendirme kanıtı olmadan "I cannot browse the internet" gibi düz bir sohbet yanıtıyla hemen durursa OpenClaw bu metni bir arama sonucu olarak sarmak yerine yapılandırılmış bir `kimi_web_search_ungrounded` hatası döndürür. Sorguyu yeniden deneyin, Brave gibi yapılandırılmış bir sağlayıcıya geçin veya zaten hedef URL'niz varsa `web_fetch` / tarayıcı aracını kullanın.

## Desteklenen parametreler

Kimi araması `query` destekler.

`count`, paylaşılan `web_search` uyumluluğu için kabul edilir, ancak Kimi yine de N sonuçlu bir liste yerine atıflar içeren tek bir sentezlenmiş yanıt döndürür.

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Moonshot AI](/tr/providers/moonshot) -- Moonshot modeli + Kimi Coding sağlayıcı belgeleri
- [Gemini Search](/tr/tools/gemini-search) -- Google temellendirmesiyle yapay zeka sentezli yanıtlar
- [Grok Search](/tr/tools/grok-search) -- xAI temellendirmesiyle yapay zeka sentezli yanıtlar
