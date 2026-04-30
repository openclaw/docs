---
read_when:
    - Kendi GPU makinenizden modeller sunmak istiyorsunuz
    - LM Studio’yu veya OpenAI uyumlu bir ara sunucuyu bağlıyorsunuz
    - En güvenli yerel model rehberliğine ihtiyacınız var
summary: OpenClaw'u yerel LLM'lerde çalıştırın (LM Studio, vLLM, LiteLLM, özel OpenAI uç noktaları)
title: Yerel modeller
x-i18n:
    generated_at: "2026-04-30T09:22:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

Yerelde çalıştırmak yapılabilir, ancak OpenClaw büyük bağlam + prompt injection'a karşı güçlü savunmalar bekler. Küçük kartlar bağlamı keser ve güvenliği zayıflatır. Yükseği hedefleyin: **≥2 tam donanımlı Mac Studio veya eşdeğer GPU sistemi (~$30k+)**. Tek bir **24 GB** GPU yalnızca daha hafif prompt'lar ve daha yüksek gecikme için çalışır. Çalıştırabildiğiniz **en büyük / tam boyutlu model varyantını** kullanın; agresif biçimde nicemlenmiş veya “küçük” checkpoint'ler prompt-injection riskini artırır (bkz. [Güvenlik](/tr/gateway/security)).

En az sürtünmeli yerel kurulumu istiyorsanız [LM Studio](/tr/providers/lmstudio) veya [Ollama](/tr/providers/ollama) ve `openclaw onboard` ile başlayın. Bu sayfa, daha üst düzey yerel yığınlar ve özel OpenAI uyumlu yerel sunucular için görüş bildiren rehberdir.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA kullanıcıları:** Resmi Ollama Linux kurucusu `Restart=always` içeren bir systemd servisini etkinleştirir. WSL2 GPU kurulumlarında otomatik başlatma, önyükleme sırasında son modeli yeniden yükleyebilir ve ana makine belleğini sabitleyebilir. Ollama'yı etkinleştirdikten sonra WSL2 VM'iniz tekrar tekrar yeniden başlıyorsa [WSL2 çökme döngüsü](/tr/providers/ollama#wsl2-crash-loop-repeated-reboots) bölümüne bakın.
</Warning>

## Önerilen: LM Studio + büyük yerel model (Responses API)

Güncel en iyi yerel yığın. LM Studio'da büyük bir model yükleyin (örneğin tam boyutlu bir Qwen, DeepSeek veya Llama derlemesi), yerel sunucuyu etkinleştirin (varsayılan `http://127.0.0.1:1234`) ve akıl yürütmeyi son metinden ayrı tutmak için Responses API kullanın.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
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

**Kurulum kontrol listesi**

- LM Studio'yu kurun: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio'da **mevcut en büyük model derlemesini** indirin (“küçük”/yoğun nicemlenmiş varyantlardan kaçının), sunucuyu başlatın, `http://127.0.0.1:1234/v1/models` adresinin onu listelediğini doğrulayın.
- `my-local-model` değerini LM Studio'da gösterilen gerçek model kimliğiyle değiştirin.
- Modeli yüklü tutun; soğuk yükleme başlatma gecikmesi ekler.
- LM Studio derlemeniz farklıysa `contextWindow`/`maxTokens` değerlerini ayarlayın.
- WhatsApp için Responses API'ye bağlı kalın; böylece yalnızca son metin gönderilir.

Yerel çalıştırırken bile barındırılan modelleri yapılandırılmış tutun; yedeklerin kullanılabilir kalması için `models.mode: "merge"` kullanın.

### Hibrit yapılandırma: barındırılan birincil, yerel yedek

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

### Barındırılan güvenlik ağıyla yerel öncelikli

Birincil ve yedek sırasını değiştirin; yerel makine kapalıyken Sonnet veya Opus'a geri dönebilmek için aynı sağlayıcılar bloğunu ve `models.mode: "merge"` değerini koruyun.

### Bölgesel barındırma / veri yönlendirme

- Barındırılan MiniMax/Kimi/GLM varyantları OpenRouter üzerinde bölgeye sabitlenmiş uç noktalarla da bulunur (örn. ABD'de barındırılan). Anthropic/OpenAI yedekleri için `models.mode: "merge"` kullanmaya devam ederken trafiği seçtiğiniz yargı alanında tutmak için oradaki bölgesel varyantı seçin.
- Yalnızca yerel kullanım en güçlü gizlilik yoludur; barındırılan bölgesel yönlendirme, sağlayıcı özelliklerine ihtiyaç duyup veri akışı üzerinde kontrol istediğinizde orta yoldur.

## Diğer OpenAI uyumlu yerel proxy'ler

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy veya özel
Gateway'ler, OpenAI tarzı bir `/v1/chat/completions`
uç noktası sunduklarında çalışır. Arka uç açıkça `/v1/responses` desteğini
belgelemedikçe Chat Completions bağdaştırıcısını kullanın. Yukarıdaki sağlayıcı
bloğunu kendi uç noktanız ve model kimliğinizle değiştirin:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
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

`baseUrl` içeren özel bir sağlayıcıda `api` atlanırsa OpenClaw varsayılan olarak
`openai-completions` kullanır. `127.0.0.1` gibi loopback uç noktaları otomatik
olarak güvenilir kabul edilir; LAN, tailnet ve özel DNS uç noktaları yine de
`request.allowPrivateNetwork: true` gerektirir.

`models.providers.<id>.models[].id` değeri sağlayıcıya yereldir. Buraya
sağlayıcı önekini eklemeyin. Örneğin
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` ile başlatılan bir MLX
sunucusu şu katalog kimliğini ve model ref'ini kullanmalıdır:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Görüntü eklerinin agent turlarına enjekte edilmesi için yerel veya proxy'lenen vision modellerinde `input: ["text", "image"]` ayarlayın. Etkileşimli özel sağlayıcı onboarding'i yaygın vision model kimliklerini çıkarır ve yalnızca bilinmeyen adları sorar. Etkileşimsiz onboarding aynı çıkarımı kullanır; bilinmeyen vision kimlikleri için `--custom-image-input`, bilinen gibi görünen bir model uç noktanızın arkasında yalnızca metinse `--custom-text-input` kullanın.

Barındırılan modellerin yedek olarak kullanılabilir kalması için `models.mode: "merge"` değerini koruyun.
Yavaş yerel veya uzak model sunucuları için `agents.defaults.timeoutSeconds` değerini artırmadan önce `models.providers.<id>.timeoutSeconds` kullanın. Sağlayıcı zaman aşımı yalnızca bağlantı, başlıklar, gövde akışı ve toplam korumalı fetch iptali dahil model HTTP isteklerine uygulanır.

<Note>
Özel OpenAI uyumlu sağlayıcılar için `baseUrl` loopback, özel LAN, `.local` veya yalın bir ana makine adına çözümlendiğinde `apiKey: "ollama-local"` gibi gizli olmayan yerel bir işaretçinin kalıcı tutulması kabul edilir. OpenClaw bunu eksik anahtar bildirmek yerine geçerli bir yerel kimlik bilgisi olarak değerlendirir. Genel bir ana makine adını kabul eden tüm sağlayıcılar için gerçek bir değer kullanın.
</Note>

Yerel/proxy'lenen `/v1` arka uçları için davranış notu:

- OpenClaw bunları yerel OpenAI uç noktaları değil, proxy tarzı OpenAI uyumlu
  rotalar olarak değerlendirir
- yalnızca yerel OpenAI istek şekillendirmesi burada uygulanmaz: `service_tier`
  yok, Responses `store` yok, OpenAI akıl yürütme uyumluluğu payload
  şekillendirmesi yok ve prompt-cache ipuçları yok
- gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`)
  bu özel proxy URL'lerine enjekte edilmez

Daha katı OpenAI uyumlu arka uçlar için uyumluluk notları:

- Bazı sunucular Chat Completions üzerinde yapılandırılmış içerik parçası
  dizilerini değil, yalnızca string `messages[].content` kabul eder. Bu uç
  noktalar için
  `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
- Bazı yerel modeller metin olarak, örneğin `[tool_name]` ardından JSON ve
  `[END_TOOL_REQUEST]` gelen bağımsız köşeli parantezli araç istekleri yayar.
  OpenClaw bunları yalnızca ad tur için kayıtlı bir araçla tam olarak eşleştiğinde
  gerçek araç çağrılarına yükseltir; aksi halde blok desteklenmeyen metin olarak
  değerlendirilir ve kullanıcıya görünen yanıtlardan gizlenir.
- Bir model JSON, XML veya araç çağrısı gibi görünen ReAct tarzı metin yayıyor
  ancak sağlayıcı yapılandırılmış bir çağrı yaymıyorsa OpenClaw bunu metin olarak
  bırakır ve kullanılabildiğinde çalıştırma kimliği, sağlayıcı/model, algılanan
  örüntü ve araç adıyla bir uyarı günlüğe yazar. Bunu tamamlanmış bir araç
  çalıştırması değil, sağlayıcı/model araç çağrısı uyumsuzluğu olarak değerlendirin.
- Araçlar çalışmak yerine assistant metni olarak görünüyorsa, örneğin ham JSON,
  XML, ReAct sözdizimi veya sağlayıcı yanıtında boş bir `tool_calls` dizisi,
  önce sunucunun araç çağrısı destekli bir chat template/parser kullandığını
  doğrulayın. Parser'ı yalnızca araç kullanımı zorlandığında çalışan OpenAI
  uyumlu Chat Completions arka uçları için metin ayrıştırmaya güvenmek yerine
  model başına istek geçersiz kılması ayarlayın:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  Bunu yalnızca her normal turun bir araç çağırması gereken modeller/oturumlar
  için kullanın. OpenClaw'ın varsayılan proxy değeri olan `tool_choice: "auto"` değerini geçersiz kılar.
  `local/my-local-model` değerini `openclaw models list` tarafından gösterilen
  tam sağlayıcı/model ref'iyle değiştirin.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Özel bir OpenAI uyumlu model, yerleşik profilin ötesinde OpenAI akıl yürütme
  çabalarını kabul ediyorsa bunları model compat bloğunda bildirin. Buraya
  `"xhigh"` eklemek, yapılandırılan sağlayıcı/model ref'i için `/think xhigh`,
  oturum seçicileri, Gateway doğrulaması ve `llm-task` doğrulamasının bu düzeyi
  göstermesini sağlar:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

- Bazı daha küçük veya daha katı yerel arka uçlar, özellikle araç şemaları dahil
  edildiğinde OpenClaw'ın tam agent-runtime prompt şekliyle kararsızdır. Önce
  sağlayıcı yolunu yalın yerel prob ile doğrulayın:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Tam agent prompt şekli olmadan Gateway rotasını doğrulamak için bunun yerine
  Gateway model probunu kullanın:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Hem yerel hem de Gateway model probları yalnızca sağlanan prompt'u gönderir. Gateway
  probu yine de Gateway yönlendirmesini, kimlik doğrulamayı ve sağlayıcı seçimini
  doğrular, ancak önceki oturum transkriptini, AGENTS/bootstrap bağlamını,
  context-engine derlemesini, araçları ve paketlenmiş MCP sunucularını bilerek atlar.

  Bu başarılı olur ama normal OpenClaw agent turları başarısız olursa, önce
  `browser`, `cron` ve `message` gibi ağır varsayılan araçları devre dışı bırakmak için
  `agents.defaults.experimental.localModelLean: true` ayarını deneyin; bu deneysel
  bir bayraktır, kararlı bir varsayılan mod ayarı değildir. Bkz.
  [Deneysel Özellikler](/tr/concepts/experimental-features). Bu da başarısız olursa,
  `models.providers.<provider>.models[].compat.supportsTools: false` ayarını deneyin.

- Arka uç yalnızca daha büyük OpenClaw çalıştırmalarında hâlâ başarısız oluyorsa, kalan sorun
  genellikle OpenClaw’ın aktarım katmanı değil, upstream model/sunucu kapasitesi veya bir arka uç hatasıdır.

## Sorun giderme

- Gateway vekil sunucuya erişebiliyor mu? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio modeli yüklenmemiş mi? Yeniden yükleyin; soğuk başlatma yaygın bir “takılma” nedenidir.
- Yerel sunucu `terminated`, `ECONNRESET` diyor veya akışı turun ortasında mı kapatıyor?
  OpenClaw, tanı verilerinde düşük kardinaliteli bir `model.call.error.failureKind` ile birlikte
  OpenClaw sürecinin RSS/yığın anlık görüntüsünü kaydeder. LM Studio/Ollama
  bellek baskısı için, model sunucusunun sonlandırılıp sonlandırılmadığını doğrulamak üzere
  bu zaman damgasını sunucu günlüğü veya macOS çökme /
  jetsam günlüğüyle eşleştirin.
- OpenClaw, bağlam penceresi ön denetim eşiklerini algılanan model penceresinden veya `agents.defaults.contextTokens` etkili pencereyi düşürdüğünde sınırsız model penceresinden türetir. %20’nin altında **8k** tabanla uyarır. Sert engellemeler, etkili bağlam penceresiyle sınırlandırılmış **4k** tabanlı %10 eşiğini kullanır; böylece aşırı büyük model meta verileri, aksi hâlde geçerli olan bir kullanıcı sınırını reddedemez. Bu ön denetime takılırsanız sunucu/model bağlam sınırını yükseltin veya daha büyük bir model seçin.
- Bağlam hataları mı var? `contextWindow` değerini düşürün veya sunucu sınırınızı yükseltin.
- OpenAI uyumlu sunucu `messages[].content ... expected a string` mı döndürüyor?
  Bu model girdisine `compat.requiresStringContent: true` ekleyin.
- Doğrudan küçük `/v1/chat/completions` çağrıları çalışıyor ama `openclaw infer model run --local`
  Gemma veya başka bir yerel modelde başarısız mı oluyor? Önce sağlayıcı URL’sini, model referansını, kimlik doğrulama
  işaretleyicisini ve sunucu günlüklerini kontrol edin; yerel `model run`, agent araçlarını içermez.
  Yerel `model run` başarılı oluyor ama daha büyük agent turları başarısız oluyorsa, agent
  araç yüzeyini `localModelLean` veya `compat.supportsTools: false` ile azaltın.
- Araç çağrıları ham JSON/XML/ReAct metni olarak mı görünüyor veya sağlayıcı boş bir
  `tool_calls` dizisi mi döndürüyor? Asistan metnini körlemesine araç yürütmesine dönüştüren
  bir vekil sunucu eklemeyin. Önce sunucu sohbet şablonunu/ayrıştırıcısını düzeltin. Model
  yalnızca araç kullanımı zorlandığında çalışıyorsa, yukarıdaki model başına
  `params.extra_body.tool_choice: "required"` geçersiz kılmasını ekleyin ve bu model
  girdisini yalnızca her turda bir araç çağrısı beklendiği oturumlar için kullanın.
- Güvenlik: yerel modeller sağlayıcı tarafındaki filtreleri atlar; istem enjeksiyonunun etki alanını sınırlamak için agent’ları dar tutun ve compaction’ı açık bırakın.

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Model yük devretme](/tr/concepts/model-failover)
