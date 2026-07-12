---
read_when:
    - web_search için Grok'u kullanmak istiyorsunuz
    - Web araması için xAI OAuth veya bir XAI_API_KEY kullanmak istiyorsunuz
summary: xAI'nin web tabanlı yanıtları aracılığıyla Grok web araması
title: Grok araması
x-i18n:
    generated_at: "2026-07-12T12:52:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw, canlı arama sonuçlarıyla desteklenen ve alıntılar içeren, yapay zekâ tarafından sentezlenmiş yanıtlar üretmek için xAI'ın web temellendirmeli yanıtlarını kullanarak Grok'u bir `web_search` sağlayıcısı olarak destekler.

Grok web araması, kullanılabilir olduğunda mevcut bir xAI OAuth oturum açma profilini tercih eder. OAuth profili yoksa aynı xAI API anahtarı, X'te (eski adıyla Twitter) gönderi aramaya yönelik yerleşik `x_search` aracını ve `code_execution` aracını da çalıştırır. Anahtarın `plugins.entries.xai.config.webSearch.apiKey` konumunda saklanması, OpenClaw'ın bu anahtarı paketlenmiş xAI model sağlayıcısı için yedek olarak yeniden kullanmasına da olanak tanır.

Gönderi düzeyindeki X metrikleri (yeniden gönderimler, yanıtlar, yer imleri, görüntülemeler) için geniş kapsamlı bir arama sorgusu yerine tam gönderi URL'si veya durum kimliğiyle [`x_search`](/tr/tools/web#x_search) kullanın.

## İlk katılım ve yapılandırma

`openclaw onboard` veya `openclaw configure --section
web` sırasında **Grok** seçildiğinde OpenClaw, ayrı bir web araması anahtarı istemeden mevcut bir xAI OAuth profilini yeniden kullanabilir. OAuth yoksa xAI API anahtarı kurulumuna geri döner.

Ardından OpenClaw, aynı xAI kimlik bilgisiyle `x_search` özelliğini etkinleştirmek için bir takip adımı sunar. Bu takip adımı:

- yalnızca `web_search` için Grok'u seçtikten sonra görünür
- ayrı bir üst düzey web araması sağlayıcısı seçeneği değildir
- isteğe bağlı olarak aynı akışta `x_search` modelini ayarlayabilir

`x_search` özelliğini daha sonra yapılandırmada etkinleştirmek veya değiştirmek için bu adımı atlayın.

## Oturum açın veya bir API anahtarı edinin

<Steps>
  <Step title="xAI OAuth kullanın">
    İlk katılım veya model kimlik doğrulaması sırasında xAI ile zaten oturum açtıysanız `web_search` sağlayıcısı olarak Grok'u seçin. Ayrı bir API anahtarı gerekmez:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Yedek olarak bir API anahtarı kullanın">
    OAuth kullanılamadığında veya özellikle anahtar destekli web araması yapılandırması kullanmak istediğinizde [xAI](https://console.x.ai/) üzerinden bir API anahtarı edinin.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `XAI_API_KEY` değerini ayarlayın veya şununla yapılandırın:

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
            apiKey: "xai-...", // xAI OAuth veya XAI_API_KEY kullanılabiliyorsa isteğe bağlıdır
            baseUrl: "https://api.x.ai/v1", // isteğe bağlı Responses API proxy/temel URL geçersiz kılması
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

**Kimlik bilgisi alternatifleri:** `openclaw models auth login --provider xai
--method oauth`, Gateway ortamında `XAI_API_KEY` veya
`plugins.entries.xai.config.webSearch.apiKey`. Bir Gateway kurulumu için ortam değişkenlerini `~/.openclaw/.env` dosyasına koyun.

## Nasıl çalışır?

Grok, Gemini'ın Google Arama temellendirme yaklaşımına benzer biçimde, satır içi alıntılar içeren yanıtlar sentezlemek için xAI'ın web temellendirmeli yanıtlarını kullanır.

## Desteklenen parametreler

Grok araması `query` parametresini destekler. Paylaşılan `web_search` uyumluluğu için `count` kabul edilir ancak Grok, N sonuçlu bir liste yerine her zaman alıntılar içeren tek bir sentezlenmiş yanıt döndürür. Sağlayıcıya özgü filtreler desteklenmez.

xAI Responses web temellendirmeli aramaları, paylaşılan `web_search` varsayılanından daha uzun sürebildiği için Grok varsayılan olarak 60 saniyelik zaman aşımı kullanır. Bunu `tools.web.search.timeoutSeconds` ile geçersiz kılın.

## Temel URL geçersiz kılmaları

Grok web aramasını bir operatör proxy'si veya xAI uyumlu Responses uç noktası üzerinden yönlendirmek için `plugins.entries.xai.config.webSearch.baseUrl` değerini ayarlayın. OpenClaw, sondaki eğik çizgileri kaldırdıktan sonra `<baseUrl>/responses` adresine gönderim yapar. `plugins.entries.xai.config.xSearch.baseUrl` ayarlanmadığı sürece `x_search`, aynı `webSearch.baseUrl` değerini yedek olarak kullanır.

## İlgili

- [Web Aramasına genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Web Aramasında x_search](/tr/tools/web#x_search) -- xAI aracılığıyla birinci sınıf X araması
- [Gemini Araması](/tr/tools/gemini-search) -- Google temellendirmesi aracılığıyla yapay zekâ tarafından sentezlenmiş yanıtlar
