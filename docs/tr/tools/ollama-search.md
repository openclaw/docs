---
read_when:
    - web_search için Ollama kullanmak istiyorsunuz
    - Anahtar gerektirmeyen bir web_search sağlayıcısı istiyorsunuz
    - Ollama Web Search kurulum rehberine ihtiyacınız var
summary: Yapılandırılmış Ollama ana makineniz üzerinden Ollama Web Search
title: Ollama Web Search
x-i18n:
    generated_at: "2026-04-05T14:12:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d0765594e0eb368c25cca21a712c054e71cf43e7bfb385d10feddd990f4fd
    source_path: tools/ollama-search.md
    workflow: 15
---

# Ollama Web Search

OpenClaw, paketlenmiş bir `web_search` sağlayıcısı olarak **Ollama Web Search** desteği sunar.
Ollama'nın deneysel web-search API'sini kullanır ve başlıklar, URL'ler ve özet parçacıkları içeren yapılandırılmış sonuçlar döndürür.

Ollama model sağlayıcısının aksine, bu kurulum varsayılan olarak bir API anahtarı gerektirmez. Ancak şunları gerektirir:

- OpenClaw tarafından erişilebilen bir Ollama ana makinesi
- `ollama signin`

## Kurulum

<Steps>
  <Step title="Ollama'yı başlatın">
    Ollama'nın kurulu ve çalışır durumda olduğundan emin olun.
  </Step>
  <Step title="Oturum açın">
    Şunu çalıştırın:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama Web Search seçin">
    Şunu çalıştırın:

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

İsteğe bağlı Ollama ana makinesi geçersiz kılma ayarı:

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

Açıkça bir Ollama temel URL'si ayarlanmamışsa, OpenClaw `http://127.0.0.1:11434` kullanır.

Ollama ana makineniz bearer auth bekliyorsa, OpenClaw web-search istekleri için de
`models.providers.ollama.apiKey` değerini (veya eşleşen env destekli sağlayıcı kimlik doğrulamasını) yeniden kullanır.

## Notlar

- Bu sağlayıcı için web-search'e özel bir API anahtarı alanı gerekmez.
- Ollama ana makinesi kimlik doğrulamasıyla korunuyorsa, OpenClaw mevcut olduğunda normal Ollama sağlayıcı API anahtarını yeniden kullanır.
- OpenClaw, Ollama'ya erişilemediğinde veya oturum açılmadığında kurulum sırasında uyarı verir, ancak seçimi engellemez.
- Çalışma zamanı otomatik algılama, daha yüksek öncelikli kimlik bilgili bir sağlayıcı yapılandırılmadığında Ollama Web Search'e geri dönebilir.
- Sağlayıcı, Ollama'nın deneysel `/api/experimental/web_search` uç noktasını kullanır.

## İlgili

- [Web Search genel bakış](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Ollama](/tr/providers/ollama) -- Ollama model kurulumu ve bulut/yerel modlar
