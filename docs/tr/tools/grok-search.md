---
read_when:
    - web_search için Grok kullanmak istiyorsunuz
    - Web araması için xAI OAuth veya XAI_API_KEY kullanmak istiyorsunuz
summary: Grok web araması, xAI web temelli yanıtları aracılığıyla
title: Grok araması
x-i18n:
    generated_at: "2026-06-28T01:23:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

  OpenClaw, Grok'u `web_search` sağlayıcısı olarak destekler; canlı arama sonuçlarıyla desteklenen ve atıflar içeren AI tarafından sentezlenmiş yanıtlar üretmek için xAI web temelli yanıtlarını kullanır.

  Grok web araması, mevcut olduğunda var olan xAI OAuth oturum açmanızı tercih eder.
  OAuth profili yoksa aynı xAI API anahtarı, X (eski adıyla Twitter) gönderi araması için yerleşik `x_search` aracını ve `code_execution` aracını da çalıştırabilir. Anahtarı `plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız, OpenClaw bunu paketle gelen xAI model sağlayıcısı için de yedek olarak yeniden kullanır.

  Yeniden gönderiler, yanıtlar, yer işaretleri veya görüntülemeler gibi gönderi düzeyindeki X metrikleri için geniş bir arama sorgusu yerine tam gönderi URL'si veya durum kimliğiyle `x_search` kullanmayı tercih edin.

  ## İlk kurulum ve yapılandırma

  Şunlar sırasında **Grok** seçerseniz:

  - `openclaw onboard`
  - `openclaw configure --section web`

  OpenClaw, ayrı bir web arama anahtarı istemeden mevcut bir xAI OAuth profilini kullanabilir. OAuth mevcut değilse, xAI API anahtarı kurulumuna geri döner.
  OpenClaw aynı xAI kimlik bilgisiyle `x_search` özelliğini etkinleştirmek için ayrı bir takip adımı da gösterebilir. Bu takip adımı:

  - yalnızca `web_search` için Grok'u seçtikten sonra görünür
  - ayrı bir üst düzey web arama sağlayıcısı seçeneği değildir
  - aynı akış sırasında isteğe bağlı olarak `x_search` modelini ayarlayabilir

  Bunu atlarsanız, `x_search` özelliğini daha sonra yapılandırmada etkinleştirebilir veya değiştirebilirsiniz.

  ## Oturum açın veya bir API anahtarı alın

  <Steps>
  <Step title="xAI OAuth kullanın">
    İlk kurulum veya model kimlik doğrulaması sırasında xAI ile zaten oturum açtıysanız,
    `web_search` sağlayıcısı olarak Grok'u seçin. Ayrı bir API anahtarı gerekmez:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="API anahtarı yedeği kullanın">
    OAuth kullanılamadığında veya özellikle anahtar destekli web arama yapılandırması istediğinizde
    [xAI](https://console.x.ai/) üzerinden bir API anahtarı alın.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `XAI_API_KEY` ayarlayın veya şununla yapılandırın:

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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
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

**Kimlik bilgisi alternatifleri:** `openclaw models auth login
--provider xai --method oauth` ile oturum açın, Gateway ortamında `XAI_API_KEY`
ayarlayın veya `plugins.entries.xai.config.webSearch.apiKey` değerini saklayın.
Bir gateway kurulumu için ortam değişkenlerini `~/.openclaw/.env` içine koyun.

## Nasıl çalışır

Grok, Gemini'nin Google Search grounding yaklaşımına benzer şekilde, satır içi
alıntılarla yanıtlar sentezlemek için xAI web temelli yanıtlarını kullanır.

## Desteklenen parametreler

Grok araması `query` destekler.

`count`, paylaşılan `web_search` uyumluluğu için kabul edilir, ancak Grok yine
de N sonuçlu bir liste yerine alıntılar içeren tek bir sentezlenmiş yanıt
döndürür.

Sağlayıcıya özgü filtreler şu anda desteklenmez.

Grok, xAI Responses web temelli aramaları paylaşılan `web_search` varsayılanından
daha uzun sürebildiği için sağlayıcıya özgü 60 saniyelik varsayılan zaman aşımı
kullanır. Bunu geçersiz kılmak için `tools.web.search.timeoutSeconds` ayarlayın.

## Temel URL geçersiz kılmaları

Grok web aramasının bir operatör proxy'si veya xAI uyumlu Responses uç noktası
üzerinden yönlendirilmesi gerektiğinde `plugins.entries.xai.config.webSearch.baseUrl`
ayarlayın. OpenClaw, sondaki eğik çizgileri kırptıktan sonra `<baseUrl>/responses`
adresine gönderir. `plugins.entries.xai.config.xSearch.baseUrl` ayarlanmadığı
sürece `x_search` aynı `webSearch.baseUrl` yedeğini kullanır.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Search içinde x_search](/tr/tools/web#x_search) -- xAI üzerinden birinci sınıf X araması
- [Gemini Search](/tr/tools/gemini-search) -- Google grounding ile AI tarafından sentezlenmiş yanıtlar
