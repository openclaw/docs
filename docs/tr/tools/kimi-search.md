---
read_when:
    - '`web_search` için Kimi kullanmak istiyorsunuz'
    - Bir `KIMI_API_KEY` veya `MOONSHOT_API_KEY` gerekir
summary: Moonshot web araması aracılığıyla Kimi web araması
title: Kimi arama
x-i18n:
    generated_at: "2026-04-24T09:35:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw, Kimi'yi bir `web_search` sağlayıcısı olarak destekler ve alıntılar içeren AI sentezli yanıtlar üretmek için Moonshot web aramasını kullanır.

## API key alın

<Steps>
  <Step title="Bir anahtar oluşturun">
    [Moonshot AI](https://platform.moonshot.cn/) üzerinden bir API key alın.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `KIMI_API_KEY` veya `MOONSHOT_API_KEY` ayarlayın ya da
    şu komutla yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` veya
`openclaw configure --section web` sırasında **Kimi** seçtiğinizde OpenClaw ayrıca şunları da sorabilir:

- Moonshot API bölgesi:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- varsayılan Kimi web-search modeli (`kimi-k2.6` varsayılandır)

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // KIMI_API_KEY veya MOONSHOT_API_KEY ayarlıysa isteğe bağlı
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

Sohbet için Çin API ana makinesini kullanıyorsanız (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), `tools.web.search.kimi.baseUrl` atlandığında OpenClaw aynı ana makineyi Kimi
`web_search` için de yeniden kullanır; böylece
[platform.moonshot.cn](https://platform.moonshot.cn/) üzerinden alınan anahtarlar yanlışlıkla
uluslararası uç noktaya gitmez (bu durum çoğu zaman HTTP 401 döndürür). Farklı bir arama base URL'sine ihtiyacınız olduğunda
`tools.web.search.kimi.baseUrl` ile geçersiz kılın.

**Ortam alternatifi:** Gateway ortamında `KIMI_API_KEY` veya `MOONSHOT_API_KEY` ayarlayın.
Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

`baseUrl` atlanırsa OpenClaw varsayılan olarak `https://api.moonshot.ai/v1` kullanır.
`model` atlanırsa OpenClaw varsayılan olarak `kimi-k2.6` kullanır.

## Nasıl çalışır

Kimi, Gemini ve Grok'un grounded response yaklaşımına benzer şekilde,
satır içi alıntılarla yanıt sentezlemek için Moonshot web aramasını kullanır.

## Desteklenen parametreler

Kimi araması `query` destekler.

`count`, paylaşılan `web_search` uyumluluğu için kabul edilir, ancak Kimi yine de N sonuçlu bir liste yerine alıntılar içeren tek bir sentezlenmiş yanıt döndürür.

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Moonshot AI](/tr/providers/moonshot) -- Moonshot model + Kimi Coding sağlayıcı belgeleri
- [Gemini Search](/tr/tools/gemini-search) -- Google grounding aracılığıyla AI sentezli yanıtlar
- [Grok Search](/tr/tools/grok-search) -- xAI grounding aracılığıyla AI sentezli yanıtlar
