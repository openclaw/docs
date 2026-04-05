---
read_when:
    - Modelleri kendi GPU kutunuzdan sunmak istiyorsunuz
    - LM Studio veya OpenAI uyumlu bir proxy bağlıyorsunuz
    - En güvenli yerel model rehberliğine ihtiyacınız var
summary: OpenClaw’ı yerel LLM’lerde çalıştırın (LM Studio, vLLM, LiteLLM, özel OpenAI uç noktaları)
title: Yerel Modeller
x-i18n:
    generated_at: "2026-04-05T13:53:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b99c8fb57f65c0b765fc75bd36933221b5aeb94c4a3f3428f92640ae064f8b6
    source_path: gateway/local-models.md
    workflow: 15
---

# Yerel modeller

Yerel kullanım mümkündür, ancak OpenClaw geniş bağlam ve prompt injection’a karşı güçlü savunmalar bekler. Küçük kartlar bağlamı kırpar ve güvenliği zayıflatır. Hedefinizi yüksek tutun: **≥2 tam donanımlı Mac Studio veya eşdeğer GPU sistemi (~30 bin $+)**. Tek bir **24 GB** GPU yalnızca daha hafif istemlerde ve daha yüksek gecikmeyle işe yarar. Çalıştırabildiğiniz **en büyük / tam boyutlu model varyantını** kullanın; aşırı kuantize edilmiş veya “küçük” checkpoint’ler prompt injection riskini artırır (bkz. [Security](/gateway/security)).

En düşük sürtünmeli yerel kurulum için [Ollama](/providers/ollama) ve `openclaw onboard` ile başlayın. Bu sayfa, daha üst düzey yerel yığınlar ve özel OpenAI uyumlu yerel sunucular için görüşlü rehberdir.

## Önerilen: LM Studio + büyük yerel model (Responses API)

Şu anda en iyi yerel yığın. LM Studio’da büyük bir model yükleyin (örneğin tam boyutlu bir Qwen, DeepSeek veya Llama derlemesi), yerel sunucuyu etkinleştirin (varsayılan `http://127.0.0.1:1234`) ve muhakemeyi nihai metinden ayrı tutmak için Responses API kullanın.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Kurulum kontrol listesi**

- LM Studio’yu kurun: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio içinde, **mevcut en büyük model derlemesini** indirin (“small”/ağır kuantize edilmiş varyantlardan kaçının), sunucuyu başlatın ve `http://127.0.0.1:1234/v1/models` çıktısında göründüğünü doğrulayın.
- `my-local-model` değerini LM Studio’da gösterilen gerçek model kimliğiyle değiştirin.
- Modeli yüklü tutun; soğuk yükleme başlangıç gecikmesi ekler.
- LM Studio derlemeniz farklıysa `contextWindow`/`maxTokens` değerlerini ayarlayın.
- WhatsApp için yalnızca nihai metnin gönderilmesi adına Responses API’ye bağlı kalın.

Yerel çalıştırırken bile barındırılan modelleri yapılandırılmış tutun; geri dönüşlerin kullanılabilir kalması için `models.mode: "merge"` kullanın.

### Karma yapılandırma: birincil barındırılan, geri dönüş yerel

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Yerel öncelikli, barındırılan güvenlik ağıyla

Birincil ve geri dönüş sırasını değiştirin; aynı provider bloğunu ve `models.mode: "merge"` ayarını koruyun; böylece yerel kutu kapalı olduğunda Sonnet veya Opus’a geri dönebilirsiniz.

### Bölgesel barındırma / veri yönlendirme

- Barındırılan MiniMax/Kimi/GLM varyantları, bölgeye sabitlenmiş uç noktalarla OpenRouter üzerinde de bulunur (ör. ABD’de barındırılan). Trafiği seçtiğiniz yargı alanında tutarken Anthropic/OpenAI geri dönüşleri için yine `models.mode: "merge"` kullanabilmek adına oradaki bölgesel varyantı seçin.
- Tam yerel kullanım en güçlü gizlilik yoludur; barındırılan bölgesel yönlendirme ise sağlayıcı özelliklerine ihtiyaç duyduğunuz ama veri akışı üzerinde denetim istediğiniz durumlarda orta yoldur.

## Diğer OpenAI uyumlu yerel proxy’ler

vLLM, LiteLLM, OAI-proxy veya özel gateway’ler, OpenAI tarzı bir `/v1` uç noktası sunuyorsa çalışır. Yukarıdaki provider bloğunu kendi uç noktanız ve model kimliğinizle değiştirin:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Barındırılan modellerin geri dönüş olarak kullanılabilir kalması için `models.mode: "merge"` ayarını koruyun.

Yerel/proxy’lenmiş `/v1` backend’leri için davranış notu:

- OpenClaw bunları yerel OpenAI uç noktaları değil, proxy tarzı OpenAI uyumlu rotalar olarak ele alır
- Burada yerel OpenAI’ye özgü istek şekillendirmesi uygulanmaz: `service_tier` yoktur, Responses `store` yoktur, OpenAI reasoning-compat payload şekillendirmesi yoktur ve prompt-cache ipuçları yoktur
- Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`) bu özel proxy URL’lerine eklenmez

## Sorun giderme

- Gateway proxy’ye ulaşabiliyor mu? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio modeli yüklenmemiş mi? Yeniden yükleyin; soğuk başlangıç, yaygın bir “takılı kalma” nedenidir.
- Bağlam hataları mı var? `contextWindow` değerini düşürün veya sunucu sınırınızı artırın.
- Güvenlik: yerel modeller sağlayıcı tarafı filtreleri atlar; prompt injection etki alanını sınırlamak için agent’ları dar tutun ve kompaktlamayı açık bırakın.
