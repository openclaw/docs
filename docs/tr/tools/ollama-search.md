---
read_when:
    - web_search için Ollama kullanmak istiyorsunuz
    - Anahtarsız bir web_search sağlayıcısı istiyorsunuz
    - OLLAMA_API_KEY ile barındırılan Ollama Web Arama'yı kullanmak istiyorsunuz
    - Ollama Web Search kurulum rehberliğine ihtiyacınız var
summary: Yerel bir Ollama ana makinesi veya barındırılan Ollama API üzerinden Ollama Web Araması
title: Ollama web araması
x-i18n:
    generated_at: "2026-04-30T09:50:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw, paketle birlikte gelen bir `web_search` sağlayıcısı olarak **Ollama Web Search** desteği sunar. Ollama'nın web arama API'sini kullanır ve başlıklar, URL'ler ve parçacıklar içeren yapılandırılmış sonuçlar döndürür.

Yerel veya kendi barındırdığınız Ollama için bu kurulum varsayılan olarak API anahtarı gerektirmez. Şunları gerektirir:

- OpenClaw tarafından erişilebilen bir Ollama ana makinesi
- `ollama signin`

Doğrudan barındırılan arama için Ollama sağlayıcısının temel URL'sini `https://ollama.com` olarak ayarlayın ve gerçek bir `OLLAMA_API_KEY` sağlayın.

## Kurulum

<Steps>
  <Step title="Start Ollama">
    Ollama'nın yüklü ve çalışır durumda olduğundan emin olun.
  </Step>
  <Step title="Sign in">
    Çalıştırın:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Choose Ollama Web Search">
    Çalıştırın:

    ```bash
    openclaw configure --section web
    ```

    Ardından sağlayıcı olarak **Ollama Web Search** seçeneğini seçin.

  </Step>
</Steps>

Ollama'yı modeller için zaten kullanıyorsanız, Ollama Web Search aynı yapılandırılmış ana makineyi yeniden kullanır.

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

Ollama'yı zaten bir model sağlayıcısı olarak yapılandırıyorsanız, web arama sağlayıcısı bunun yerine o ana makineyi yeniden kullanabilir:

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

Ollama model sağlayıcısı, standart anahtar olarak `baseUrl` kullanır. Web arama sağlayıcısı, OpenAI SDK tarzı yapılandırma örnekleriyle uyumluluk için `models.providers.ollama` üzerindeki `baseURL` değerini de dikkate alır.

Açık bir Ollama temel URL'si ayarlanmamışsa OpenClaw `http://127.0.0.1:11434` kullanır.

Ollama ana makineniz bearer kimlik doğrulaması bekliyorsa OpenClaw, yapılandırılmış ana makineye yapılan istekler için `models.providers.ollama.apiKey` değerini (veya eşleşen ortam destekli sağlayıcı kimlik doğrulamasını) yeniden kullanır.

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

- Bu sağlayıcı için web aramaya özel bir API anahtarı alanı gerekmez.
- Ollama ana makinesi kimlik doğrulamasıyla korunuyorsa OpenClaw, varsa normal Ollama sağlayıcısı API anahtarını yeniden kullanır.
- `baseUrl` `https://ollama.com` ise OpenClaw doğrudan `https://ollama.com/api/web_search` çağırır ve yapılandırılmış Ollama API anahtarını bearer kimlik doğrulaması olarak gönderir.
- Yapılandırılmış ana makine web aramayı sunmuyorsa ve `OLLAMA_API_KEY` ayarlanmışsa OpenClaw, bu ortam anahtarını yerel ana makineye göndermeden `https://ollama.com/api/web_search` adresine geri dönebilir.
- OpenClaw, kurulum sırasında Ollama'ya erişilemiyorsa veya oturum açılmamışsa uyarı verir, ancak seçimi engellemez.
- Çalışma zamanı otomatik algılama, daha yüksek öncelikli kimlik bilgili bir sağlayıcı yapılandırılmamışsa Ollama Web Search'e geri dönebilir.
- Yerel Ollama daemon ana makineleri, Ollama Cloud'a imzalayıp ileten yerel proxy uç noktası `/api/experimental/web_search` kullanır.
- `https://ollama.com` ana makineleri, bearer API anahtarı kimlik doğrulamasıyla doğrudan genel barındırılan uç nokta `/api/web_search` kullanır.

## İlgili

- [Web Search genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Ollama](/tr/providers/ollama) -- Ollama model kurulumu ve bulut/yerel modlar
