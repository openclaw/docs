---
read_when:
    - web_search için Ollama kullanmak istiyorsunuz
    - Anahtar gerektirmeyen bir web_search sağlayıcısı istiyorsunuz
    - OLLAMA_API_KEY ile barındırılan Ollama Web Search'ü kullanmak istiyorsunuz
    - Ollama Web Search kurulum rehberine ihtiyacınız var
summary: Yerel bir Ollama sunucusu veya barındırılan Ollama API'si üzerinden Ollama Web Araması
title: Ollama web araması
x-i18n:
    generated_at: "2026-07-12T12:19:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw, paketle birlikte gelen bir `web_search` sağlayıcısı olarak **Ollama Web Search** desteği sunar ve Ollama'nın web arama API'sinden başlıkları, URL'leri ve metin parçacıklarını döndürür.

Yerel/kendi barındırdığınız Ollama için varsayılan olarak API anahtarı gerekmez; erişilebilir bir Ollama ana makinesinin yanı sıra `ollama signin` komutu gerekir. Doğrudan barındırılan arama (yerel Ollama olmadan) için `baseUrl: "https://ollama.com"` ve gerçek bir `OLLAMA_API_KEY` gerekir.

## Kurulum

<Steps>
  <Step title="Ollama'yı başlatın">
    Ollama'nın yüklü ve çalışır durumda olduğundan emin olun.
  </Step>
  <Step title="Oturum açın">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Ollama Web Search'ü seçin">
    ```bash
    openclaw configure --section web
    ```

    Sağlayıcı olarak **Ollama Web Search**'ü seçin.

  </Step>
</Steps>

Ollama'yı modeller için zaten kullanıyorsanız Ollama Web Search, yapılandırılmış aynı ana makineyi yeniden kullanır.

<Note>
  OpenClaw, Ollama Web Search'ü kimlik bilgileriyle yapılandırılmış daha yüksek öncelikli bir sağlayıcıya karşı hiçbir zaman otomatik olarak seçmez; `tools.web.search.provider: "ollama"` ile açıkça seçmeniz gerekir.
</Note>

## Yapılandırma

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Yalnızca web araması kapsamında geçerli isteğe bağlı ana makine geçersiz kılması:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

Alternatif olarak Ollama model sağlayıcısı için zaten yapılandırılmış ana makineyi yeniden kullanın:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

`models.providers.ollama.baseUrl` standart anahtardır; web arama sağlayıcısı, OpenAI SDK tarzı yapılandırma örnekleriyle uyumluluk için burada `baseURL` değerini de kabul eder. Hiçbir değer ayarlanmazsa OpenClaw varsayılan olarak `http://127.0.0.1:11434` kullanır.

Doğrudan barındırılan Ollama Web Search (yerel Ollama olmadan):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Kimlik doğrulama ve istek yönlendirme

- Web aramasına özel bir API anahtarı alanı yoktur; yapılandırılan ana makine kimlik doğrulama ile korunuyorsa sağlayıcı `models.providers.ollama.apiKey` değerini (veya ortam değişkeni destekli eşleşen sağlayıcı kimlik doğrulamasını) yeniden kullanır.
- Ana makine çözümleme sırası: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (veya `baseURL`) → `http://127.0.0.1:11434`.
- Çözümlenen ana makine `https://ollama.com` ise OpenClaw, taşıyıcı kimlik doğrulaması olarak API anahtarını kullanarak doğrudan `https://ollama.com/api/web_search` adresini çağırır.
- Aksi takdirde OpenClaw önce yerel proxy uç noktası olan `/api/experimental/web_search` adresini çağırır (bu uç nokta isteği imzalayıp Ollama Cloud'a iletir), ardından aynı ana makinedeki `/api/web_search` adresine geri döner. Her ikisi de başarısız olur ve `OLLAMA_API_KEY` ayarlanmışsa bu anahtarı yerel ana makineye göndermeden, anahtarla birlikte `https://ollama.com/api/web_search` adresine yönelik isteği bir kez yeniden dener.
- Ollama'ya erişilemiyorsa veya oturum açılmamışsa OpenClaw kurulum sırasında uyarı verir ancak sağlayıcının seçilmesini engellemez.

## İlgili konular

- [Web aramasına genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Ollama](/tr/providers/ollama) -- Ollama model kurulumu ile bulut/yerel modlar
