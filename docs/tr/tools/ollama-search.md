---
read_when:
    - '`web_search` için Ollama kullanmak istiyorsunuz'
    - Anahtarsız bir `web_search` sağlayıcısı istiyorsunuz
    - Ollama Web Search kurulumu için yönlendirmeye ihtiyacınız var
summary: Yapılandırılmış Ollama ana makineniz üzerinden Ollama Web Search
title: Ollama web arama
x-i18n:
    generated_at: "2026-04-26T11:43:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw, paketle gelen bir `web_search` sağlayıcısı olarak **Ollama Web Search** desteği sunar. Ollama'nın web arama API'sini kullanır ve başlıklar, URL'ler ve özetlerle yapılandırılmış sonuçlar döndürür.

Ollama model sağlayıcısının aksine, bu kurulum varsayılan olarak bir API anahtarı gerektirmez. Ancak şunlar gereklidir:

- OpenClaw'dan erişilebilen bir Ollama ana makinesi
- `ollama signin`

## Kurulum

<Steps>
  <Step title="Ollama'yı başlatın">
    Ollama'nın kurulu ve çalışıyor olduğundan emin olun.
  </Step>
  <Step title="Oturum açın">
    Şunu çalıştırın:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama Web Search'ü seçin">
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

İsteğe bağlı Ollama ana makinesi geçersiz kılma:

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

Açık bir Ollama temel URL'si ayarlanmamışsa OpenClaw `http://127.0.0.1:11434` kullanır.

Ollama ana makineniz bearer kimlik doğrulaması bekliyorsa OpenClaw, web arama istekleri için de `models.providers.ollama.apiKey` değerini (veya eşleşen ortam destekli sağlayıcı kimlik doğrulamasını) yeniden kullanır.

## Notlar

- Bu sağlayıcı için web aramaya özel bir API anahtarı alanı gerekmez.
- Ollama ana makinesi kimlik doğrulamasıyla korunuyorsa OpenClaw, varsa normal Ollama sağlayıcı API anahtarını yeniden kullanır.
- OpenClaw, kurulum sırasında Ollama'ya erişilemiyorsa veya oturum açılmamışsa uyarı verir, ancak seçimi engellemez.
- Çalışma zamanındaki otomatik algılama, daha yüksek öncelikli kimlik bilgili bir sağlayıcı yapılandırılmamışsa Ollama Web Search'e geri dönebilir.
- Sağlayıcı, Ollama'nın `/api/web_search` uç noktasını kullanır.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Ollama](/tr/providers/ollama) -- Ollama model kurulumu ve bulut/yerel modlar
