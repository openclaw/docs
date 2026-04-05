---
read_when:
    - web_search için Kimi kullanmak istiyorsunuz
    - Bir KIMI_API_KEY veya MOONSHOT_API_KEY gerekiyor
summary: Moonshot web search üzerinden Kimi web araması
title: Kimi Search
x-i18n:
    generated_at: "2026-04-05T14:11:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753757a5497a683c35b4509ed3709b9514dc14a45612675d0f729ae6668c82a5
    source_path: tools/kimi-search.md
    workflow: 15
---

# Kimi Search

OpenClaw, alıntılar içeren YZ tarafından sentezlenmiş yanıtlar üretmek için
Moonshot web search kullanarak Kimi’yi bir `web_search` sağlayıcısı olarak destekler.

## Bir API anahtarı alın

<Steps>
  <Step title="Bir anahtar oluşturun">
    [Moonshot AI](https://platform.moonshot.cn/) üzerinden bir API anahtarı alın.
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
`openclaw configure --section web` sırasında **Kimi** seçerseniz, OpenClaw şunları da sorabilir:

- Moonshot API bölgesi:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- varsayılan Kimi web-search modeli (`kimi-k2.5` varsayılanıdır)

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
            model: "kimi-k2.5",
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

Sohbet için Çin API ana bilgisayarını kullanıyorsanız (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw `tools.web.search.kimi.baseUrl` atlandığında Kimi
`web_search` için de aynı ana bilgisayarı yeniden kullanır; böylece
[platform.moonshot.cn](https://platform.moonshot.cn/) üzerinden alınan anahtarlar yanlışlıkla
uluslararası uç noktaya gitmez (bu da çoğu zaman HTTP 401 döndürür). Farklı bir arama temel URL’sine
ihtiyacınız olduğunda `tools.web.search.kimi.baseUrl` ile geçersiz kılın.

**Ortam alternatifi:** Gateway ortamında `KIMI_API_KEY` veya `MOONSHOT_API_KEY`
ayarlayın. Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

`baseUrl` atlanırsa, OpenClaw varsayılan olarak `https://api.moonshot.ai/v1` kullanır.
`model` atlanırsa, OpenClaw varsayılan olarak `kimi-k2.5` kullanır.

## Nasıl çalışır

Kimi, Gemini ve Grok’un grounded response yaklaşımına benzer şekilde,
satır içi alıntılarla yanıtları sentezlemek için Moonshot web search kullanır.

## Desteklenen parametreler

Kimi arama `query` parametresini destekler.

Paylaşılan `web_search` uyumluluğu için `count` kabul edilir, ancak Kimi yine de
N sonuçlu bir liste yerine alıntılar içeren tek bir sentezlenmiş yanıt döndürür.

Sağlayıcıya özgü filtreler şu anda desteklenmemektedir.

## İlgili

- [Web Search genel bakışı](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Moonshot AI](/tr/providers/moonshot) -- Moonshot model + Kimi Coding sağlayıcı belgeleri
- [Gemini Search](/tools/gemini-search) -- Google grounding üzerinden YZ tarafından sentezlenmiş yanıtlar
- [Grok Search](/tools/grok-search) -- xAI grounding üzerinden YZ tarafından sentezlenmiş yanıtlar
