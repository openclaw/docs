---
read_when:
    - web_search için Ollama kullanmak istiyorsunuz
    - Anahtarsız bir web_search sağlayıcısı istiyorsunuz
    - Barındırılan Ollama Web Search'ü OLLAMA_API_KEY ile kullanmak istiyorsunuz
    - Ollama web araması kurulumu için rehberliğe ihtiyacınız var
summary: Yerel bir Ollama ana makinesi veya barındırılan Ollama API'si aracılığıyla Ollama Web Araması
title: Ollama web araması
x-i18n:
    generated_at: "2026-06-28T01:24:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw, paketle gelen bir `web_search` sağlayıcısı olarak **Ollama Web Search** destekler. Ollama'nın web araması API'sini kullanır ve başlıklar, URL'ler ve parçacıklar içeren yapılandırılmış sonuçlar döndürür.

Yerel veya kendi barındırdığınız Ollama için bu kurulum varsayılan olarak API anahtarı gerektirmez. Şunları gerektirir:

- OpenClaw tarafından erişilebilen bir Ollama ana makinesi
- `ollama signin`

Doğrudan barındırılan arama için Ollama sağlayıcı temel URL'sini `https://ollama.com` olarak ayarlayın ve gerçek bir `OLLAMA_API_KEY` sağlayın.

## Kurulum

<Steps>
  <Step title="Ollama'yı başlat">
    Ollama'nın kurulu ve çalışır durumda olduğundan emin olun.
  </Step>
  <Step title="Oturum aç">
    Çalıştırın:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama Web Search seçin">
    Çalıştırın:

    ```bash
    openclaw configure --section web
    ```

    Ardından sağlayıcı olarak **Ollama Web Search** seçin.

  </Step>
</Steps>

Modeller için zaten Ollama kullanıyorsanız, Ollama Web Search aynı yapılandırılmış ana makineyi yeniden kullanır.

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

İsteğe bağlı Ollama ana makinesi geçersiz kılma:

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

Ollama'yı zaten bir model sağlayıcı olarak yapılandırıyorsanız, web araması sağlayıcısı bunun yerine o ana makineyi yeniden kullanabilir:

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

Ollama model sağlayıcısı, kanonik anahtar olarak `baseUrl` kullanır. Web araması sağlayıcısı, OpenAI SDK tarzı yapılandırma örnekleriyle uyumluluk için `models.providers.ollama` üzerindeki `baseURL` değerini de dikkate alır.

Açık bir Ollama temel URL'si ayarlanmamışsa OpenClaw `http://127.0.0.1:11434` kullanır.

Ollama ana makineniz bearer kimlik doğrulaması bekliyorsa OpenClaw, o yapılandırılmış ana makineye yapılan istekler için `models.providers.ollama.apiKey` değerini veya eşleşen ortam destekli sağlayıcı kimlik doğrulamasını yeniden kullanır.

Doğrudan barındırılan Ollama Web Search:

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

## Notlar

- Bu sağlayıcı için web aramasına özel bir API anahtarı alanı gerekmez.
- Ollama ana makinesi kimlik doğrulamayla korunuyorsa OpenClaw, mevcut olduğunda normal Ollama sağlayıcı API anahtarını yeniden kullanır.
- `baseUrl` `https://ollama.com` ise OpenClaw doğrudan `https://ollama.com/api/web_search` çağrısı yapar ve yapılandırılmış Ollama API anahtarını bearer kimlik doğrulaması olarak gönderir.
- Yapılandırılmış ana makine web aramasını sunmuyorsa ve `OLLAMA_API_KEY` ayarlanmışsa OpenClaw, bu ortam anahtarını yerel ana makineye göndermeden `https://ollama.com/api/web_search` adresine geri dönebilir.
- OpenClaw, kurulum sırasında Ollama erişilemezse veya oturum açılmamışsa uyarır, ancak seçimi engellemez.
- OpenClaw, daha yüksek öncelikli kimlik bilgili bir sağlayıcı yapılandırılmadığında Ollama Web Search'ü otomatik seçmez; `tools.web.search.provider: "ollama"` ile açıkça seçin.
- Yerel Ollama arka plan programı ana makineleri, Ollama Cloud'a imzalayıp ileten yerel proxy uç noktası `/api/experimental/web_search` kullanır.
- `https://ollama.com` ana makineleri, bearer API anahtarı kimlik doğrulamasıyla doğrudan genel barındırılan uç nokta `/api/web_search` kullanır.

## İlgili

- [Web Araması genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Ollama](/tr/providers/ollama) -- Ollama model kurulumu ve bulut/yerel modlar
