---
read_when:
    - '`web_search` için Ollama kullanmak istiyorsunuz'
    - API anahtarı gerektirmeyen bir `web_search` sağlayıcısı istiyorsunuz
    - Ollama Web Search kurulum rehberliğine ihtiyacınız var
summary: Yapılandırılmış Ollama ana makineniz üzerinden Ollama Web Search
title: Ollama web araması
x-i18n:
    generated_at: "2026-04-24T09:36:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw, paketlenmiş bir `web_search` sağlayıcısı olarak **Ollama Web Search** desteği sunar.
Ollama'nın deneysel web-search API'sini kullanır ve başlıklar,
URL'ler ve snippet'ler içeren yapılandırılmış sonuçlar döndürür.

Ollama model sağlayıcısından farklı olarak bu kurulum varsayılan olarak bir API key gerektirmez.
Ancak şunları gerektirir:

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

Modeller için zaten Ollama kullanıyorsanız Ollama Web Search aynı
yapılandırılmış ana makineyi yeniden kullanır.

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

İsteğe bağlı Ollama ana makinesi geçersiz kılması:

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

Açık bir Ollama base URL ayarlanmamışsa OpenClaw `http://127.0.0.1:11434` kullanır.

Ollama ana makineniz bearer auth bekliyorsa OpenClaw, web-search istekleri için de
`models.providers.ollama.apiKey` (veya eşleşen env destekli sağlayıcı auth) değerini yeniden kullanır.

## Notlar

- Bu sağlayıcı için web-search'e özgü bir API key alanı gerekmez.
- Ollama ana makinesi kimlik doğrulamayla korunuyorsa OpenClaw, mevcut olduğunda normal Ollama
  sağlayıcı API key'ini yeniden kullanır.
- OpenClaw kurulum sırasında Ollama erişilemezse veya oturum açılmamışsa uyarır, ancak
  seçimi engellemez.
- Çalışma zamanı otomatik algılama, daha yüksek öncelikli
  kimlik bilgili bir sağlayıcı yapılandırılmadığında Ollama Web Search'e fallback yapabilir.
- Sağlayıcı, Ollama'nın deneysel `/api/experimental/web_search`
  uç noktasını kullanır.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Ollama](/tr/providers/ollama) -- Ollama model kurulumu ve cloud/yerel modlar
