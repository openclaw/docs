---
read_when:
    - Modelleri kendi GPU makinenizden sunmak istiyorsunuz
    - LM Studio veya OpenAI uyumlu bir proxy bağlıyorsunuz
    - En güvenli yerel model yönlendirmesine ihtiyacınız var
summary: OpenClaw'ı yerel LLM'lerde çalıştırın (LM Studio, vLLM, LiteLLM, özel OpenAI uç noktaları)
title: Yerel modeller
x-i18n:
    generated_at: "2026-04-24T09:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

Yerel kullanım mümkün, ancak OpenClaw geniş bağlam ve istem enjeksiyonuna karşı güçlü savunmalar bekler. Küçük kartlar bağlamı kırpar ve güvenliği sızdırır. Hedefi yüksek tutun: **en az 2 tam donanımlı Mac Studio veya eşdeğer GPU sistemi (~$30k+)**. Tek bir **24 GB** GPU yalnızca daha hafif istemlerde ve daha yüksek gecikmeyle çalışır. Çalıştırabildiğiniz **en büyük / tam boy model varyantını** kullanın; aşırı nicemlenmiş veya “small” denetim noktaları istem enjeksiyonu riskini artırır (bkz. [Security](/tr/gateway/security)).

En az sürtünmeli yerel kurulumu istiyorsanız [LM Studio](/tr/providers/lmstudio) veya [Ollama](/tr/providers/ollama) ile başlayın ve `openclaw onboard` kullanın. Bu sayfa, daha üst düzey yerel yığınlar ve özel OpenAI uyumlu yerel sunucular için görüş ağırlıklı rehberdir.

## Önerilen: LM Studio + büyük yerel model (Responses API)

Güncel en iyi yerel yığın. LM Studio içinde büyük bir model yükleyin (örneğin tam boy bir Qwen, DeepSeek veya Llama yapısı), yerel sunucuyu etkinleştirin (varsayılan `http://127.0.0.1:1234`) ve akıl yürütmeyi son metinden ayrı tutmak için Responses API kullanın.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Yerel” },
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
            name: “Yerel Model”,
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

**Kurulum denetim listesi**

- LM Studio kurun: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio içinde **mevcut en büyük model yapısını** indirin (“small”/ağır nicemlenmiş varyantlardan kaçının), sunucuyu başlatın, `http://127.0.0.1:1234/v1/models` uç noktasının modeli listelediğini doğrulayın.
- `my-local-model` değerini LM Studio içinde gösterilen gerçek model kimliğiyle değiştirin.
- Modeli yüklü tutun; soğuk yükleme başlatma gecikmesi ekler.
- LM Studio yapınız farklıysa `contextWindow`/`maxTokens` değerlerini ayarlayın.
- WhatsApp için yalnızca son metin gönderilsin diye Responses API kullanın.

Yerelde çalıştırırken bile barındırılan modelleri yapılandırılmış tutun; geri düşmeler kullanılabilir kalsın diye `models.mode: "merge"` kullanın.

### Hibrit yapılandırma: barındırılan birincil, yerel geri düşme

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
        "lmstudio/my-local-model": { alias: "Yerel" },
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
            name: "Yerel Model",
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

Birincil ve geri düşme sırasını değiştirin; yerel kutu devre dışı kaldığında Sonnet veya Opus'a geri düşebilmek için aynı sağlayıcı bloğunu ve `models.mode: "merge"` ayarını koruyun.

### Bölgesel barındırma / veri yönlendirme

- Barındırılan MiniMax/Kimi/GLM varyantları OpenRouter üzerinde bölgeye sabitlenmiş uç noktalarla da bulunur (örneğin ABD barındırmalı). Trafiği seçtiğiniz yargı alanında tutmak için oradaki bölgesel varyantı seçin; yine de Anthropic/OpenAI geri düşmeleri için `models.mode: "merge"` kullanın.
- Yalnızca yerel kullanım en güçlü gizlilik yoludur; sağlayıcı özelliklerine ihtiyacınız olduğunda ancak veri akışı üzerinde denetim istediğinizde barındırılan bölgesel yönlendirme orta yoldur.

## Diğer OpenAI uyumlu yerel proxy'ler

vLLM, LiteLLM, OAI-proxy veya özel Gateway'ler OpenAI tarzı bir `/v1` uç noktası sunuyorlarsa çalışır. Yukarıdaki sağlayıcı bloğunu kendi uç noktanız ve model kimliğinizle değiştirin:

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
            name: "Yerel Model",
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

Barındırılan modeller geri düşme olarak kullanılabilir kalsın diye `models.mode: "merge"` kullanın.

Yerel/proxy'lenmiş `/v1` arka uçları için davranış notu:

- OpenClaw bunları yerel
  OpenAI uç noktaları olarak değil, proxy tarzı OpenAI uyumlu yollar olarak değerlendirir
- yalnızca OpenAI'ye özgü istek şekillendirme burada uygulanmaz: `service_tier` yok,
  Responses `store` yok, OpenAI akıl yürütme uyumluluğu yükü
  şekillendirmesi yok ve istem önbelleği ipuçları yok
- gizli OpenClaw ilişkilendirme üstbilgileri (`originator`, `version`, `User-Agent`)
  bu özel proxy URL'lerine enjekte edilmez

Daha katı OpenAI uyumlu arka uçlar için uyumluluk notları:

- Bazı sunucular Chat Completions üzerinde yapılandırılmış içerik-parçası dizileri yerine yalnızca dize `messages[].content` kabul eder.
  Bu uç noktalar için
  `models.providers.<provider>.models[].compat.requiresStringContent: true`
  ayarlayın.
- Bazı küçük veya daha katı yerel arka uçlar, özellikle araç şemaları dahil edildiğinde,
  OpenClaw'ın tam ajan çalışma zamanı istem şekliyle kararsız olabilir. Arka uç küçük doğrudan `/v1/chat/completions` çağrılarında çalışıyor ama normal
  OpenClaw ajan turlarında başarısız oluyorsa önce
  `agents.defaults.experimental.localModelLean: true` deneyin; bu,
  `browser`, `cron` ve `message` gibi ağır varsayılan araçları kaldırır; bu deneysel
  bir bayraktır, kararlı varsayılan kip ayarı değildir. Bkz.
  [Experimental Features](/tr/concepts/experimental-features). Bu da işe yaramazsa
  `models.providers.<provider>.models[].compat.supportsTools: false` deneyin.
- Arka uç yalnızca daha büyük OpenClaw çalıştırmalarında hâlâ başarısız oluyorsa kalan sorun genellikle OpenClaw'ın
  taşıma katmanı değil, yukarı akış model/sunucu kapasitesi veya bir arka uç hatasıdır.

## Sorun giderme

- Gateway proxy'ye erişebiliyor mu? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio modeli boşaltılmış mı? Yeniden yükleyin; soğuk başlatma yaygın bir “takılıyor” nedenidir.
- OpenClaw, algılanan bağlam penceresi **32k** altındaysa uyarır ve **16k** altında engeller. Bu ön denetime takılırsanız sunucu/model bağlam sınırını yükseltin veya daha büyük bir model seçin.
- Bağlam hataları mı alıyorsunuz? `contextWindow` değerini düşürün veya sunucu sınırınızı yükseltin.
- OpenAI uyumlu sunucu `messages[].content ... expected a string` mi döndürüyor?
  O model girdisine `compat.requiresStringContent: true`
  ekleyin.
- Doğrudan küçük `/v1/chat/completions` çağrıları çalışıyor ama `openclaw infer model run`
  Gemma veya başka bir yerel modelde başarısız mı oluyor? Önce araç şemalarını
  `compat.supportsTools: false` ile devre dışı bırakın, sonra yeniden test edin. Sunucu hâlâ yalnızca daha büyük
  OpenClaw istemlerinde çöküyorsa bunu bir yukarı akış sunucu/model sınırlaması olarak değerlendirin.
- Güvenlik: yerel modeller sağlayıcı tarafı filtreleri atlar; istem enjeksiyonu etki alanını sınırlamak için ajanları dar tutun ve Compaction'ı açık bırakın.

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Model devretme](/tr/concepts/model-failover)
