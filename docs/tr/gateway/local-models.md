---
read_when:
    - Modelleri kendi GPU makinenizden sunmak istiyorsunuz
    - LM Studio veya OpenAI uyumlu bir proxy yapılandırıyorsunuz
    - En güvenli yerel model rehberliğine ihtiyacınız var
summary: OpenClaw'ı yerel LLM'lerde çalıştırın (LM Studio, vLLM, LiteLLM, özel OpenAI uç noktaları)
title: Yerel modeller
x-i18n:
    generated_at: "2026-05-06T09:13:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf0a1f960c5d0bd93eebb49e10db1066c305b2bc64401eb5000bf559f7e62349
    source_path: gateway/local-models.md
    workflow: 16
---

Yerel modeller mümkündür. Ancak donanım, bağlam boyutu ve prompt-injection savunması çıtasını da yükseltirler; küçük veya agresif biçimde quantize edilmiş kartlar bağlamı kırpar ve güvenliği zayıflatır. Bu sayfa, üst seviye yerel yığınlar ve özel OpenAI uyumlu yerel sunucular için görüşlü bir kılavuzdur. En düşük sürtünmeli başlangıç için [LM Studio](/tr/providers/lmstudio) veya [Ollama](/tr/providers/ollama) ile başlayın ve `openclaw onboard` çalıştırın.

## Donanım tabanı

Yüksek hedefleyin: rahat bir ajan döngüsü için **≥2 tam donanımlı Mac Studio veya eşdeğer bir GPU sistemi (~$30k+)**. Tek bir **24 GB** GPU yalnızca daha hafif promptlar için, daha yüksek gecikmeyle çalışır. Her zaman **barındırabileceğiniz en büyük / tam boyutlu varyantı** çalıştırın; küçük veya yoğun biçimde quantize edilmiş checkpoint’ler prompt-injection riskini artırır (bkz. [Güvenlik](/tr/gateway/security)).

## Bir arka uç seçin

| Arka uç                                             | Ne zaman kullanılır                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| [LM Studio](/tr/providers/lmstudio)                    | İlk yerel kurulum, GUI yükleyici, yerel Responses API                         |
| [Ollama](/tr/providers/ollama)                         | CLI iş akışı, model kitaplığı, müdahalesiz systemd servisi                    |
| MLX / vLLM / SGLang                                 | OpenAI uyumlu HTTP uç noktasıyla yüksek verimli kendi kendine barındırma      |
| LiteLLM / OAI-proxy / özel OpenAI uyumlu proxy      | Başka bir model API’sini öne alır ve OpenClaw’ın onu OpenAI gibi ele almasını istersiniz |

Arka uç destekliyorsa Responses API (`api: "openai-responses"`) kullanın (LM Studio destekler). Aksi halde Chat Completions (`api: "openai-completions"`) ile devam edin.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA kullanıcıları:** Resmi Ollama Linux yükleyicisi `Restart=always` içeren bir systemd servisini etkinleştirir. WSL2 GPU kurulumlarında otomatik başlatma, önyükleme sırasında son modeli yeniden yükleyebilir ve ana makine belleğini sabitleyebilir. WSL2 sanal makineniz Ollama etkinleştirildikten sonra tekrar tekrar yeniden başlıyorsa bkz. [WSL2 çökme döngüsü](/tr/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Önerilen: LM Studio + büyük yerel model (Responses API)

Mevcut en iyi yerel yığın. LM Studio’da büyük bir model yükleyin (örneğin tam boyutlu bir Qwen, DeepSeek veya Llama derlemesi), yerel sunucuyu etkinleştirin (varsayılan `http://127.0.0.1:1234`) ve akıl yürütmeyi son metinden ayrı tutmak için Responses API kullanın.

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

- LM Studio’yu yükleyin: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio’da **mevcut en büyük model derlemesini** indirin ("small"/yoğun biçimde quantize edilmiş varyantlardan kaçının), sunucuyu başlatın, `http://127.0.0.1:1234/v1/models` adresinin onu listelediğini doğrulayın.
- `my-local-model` değerini LM Studio’da gösterilen gerçek model kimliğiyle değiştirin.
- Modeli yüklü tutun; soğuk yükleme başlangıç gecikmesi ekler.
- LM Studio derlemeniz farklıysa `contextWindow`/`maxTokens` değerlerini ayarlayın.
- WhatsApp için Responses API ile devam edin; böylece yalnızca son metin gönderilir.

Yerel çalıştırırken bile barındırılan modelleri yapılandırılmış tutun; geri dönüşlerin kullanılabilir kalması için `models.mode: "merge"` kullanın.

### Hibrit yapılandırma: barındırılan birincil, yerel geri dönüş

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

Birincil ve geri dönüş sırasını değiştirin; yerel kutu kapalıyken Sonnet veya Opus’a geri dönebilmek için aynı sağlayıcılar bloğunu ve `models.mode: "merge"` değerini koruyun.

### Bölgesel barındırma / veri yönlendirme

- Barındırılan MiniMax/Kimi/GLM varyantları OpenRouter’da bölgeye sabitlenmiş uç noktalarla da bulunur (ör. ABD’de barındırılan). Anthropic/OpenAI geri dönüşleri için `models.mode: "merge"` kullanmaya devam ederken trafiği seçtiğiniz yargı bölgesinde tutmak için oradaki bölgesel varyantı seçin.
- Yalnızca yerel kullanım en güçlü gizlilik yoludur; sağlayıcı özelliklerine ihtiyaç duyduğunuz ama veri akışı üzerinde kontrol istediğiniz durumlarda barındırılan bölgesel yönlendirme orta yoldur.

## Diğer OpenAI uyumlu yerel proxy’ler

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy veya özel
geçitler, OpenAI tarzı bir `/v1/chat/completions` uç noktası sundukları sürece
çalışır. Arka uç açıkça `/v1/responses` desteğini belgelemiyorsa Chat
Completions adaptörünü kullanın. Yukarıdaki sağlayıcı bloğunu kendi uç noktanız
ve model kimliğinizle değiştirin:

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

`models.providers.<id>.models[].id` değeri sağlayıcıya özeldir. Buraya
sağlayıcı önekini eklemeyin. Örneğin
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` ile başlatılan bir MLX
sunucusu şu katalog kimliğini ve model referansını kullanmalıdır:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Görüntü eklerinin ajan dönüşlerine enjekte edilmesi için yerel veya proxy
üzerinden kullanılan görsel modellerde `input: ["text", "image"]` ayarlayın.
Etkileşimli özel sağlayıcı başlangıç kurulumu yaygın görsel model kimliklerini
çıkarır ve yalnızca bilinmeyen adlar için soru sorar. Etkileşimsiz başlangıç
kurulumu aynı çıkarımı kullanır; bilinmeyen görsel kimlikleri için
`--custom-image-input`, uç noktanızın arkasında metinle sınırlı olan ama bilinen
gibi görünen modeller için `--custom-text-input` kullanın.

Barındırılan modellerin geri dönüş olarak kullanılabilir kalması için
`models.mode: "merge"` değerini koruyun. Yavaş yerel veya uzak model sunucuları
için `agents.defaults.timeoutSeconds` değerini yükseltmeden önce
`models.providers.<id>.timeoutSeconds` kullanın. Sağlayıcı zaman aşımı yalnızca
bağlanma, başlıklar, gövde akışı ve toplam korumalı fetch iptali dahil model
HTTP isteklerine uygulanır.

<Note>
Özel OpenAI uyumlu sağlayıcılar için `baseUrl` loopback, özel LAN, `.local` veya yalın ana makine adına çözümlendiğinde `apiKey: "ollama-local"` gibi gizli olmayan bir yerel işaretçinin kalıcılaştırılması kabul edilir. OpenClaw bunu eksik anahtar bildirmek yerine geçerli bir yerel kimlik bilgisi olarak ele alır. Genel bir ana makine adını kabul eden tüm sağlayıcılar için gerçek bir değer kullanın.
</Note>

Yerel/proxy’li `/v1` arka uçları için davranış notu:

- OpenClaw bunları yerel OpenAI uç noktaları olarak değil, proxy tarzı OpenAI
  uyumlu rotalar olarak ele alır
- buraya yalnızca yerel OpenAI’ye özgü istek şekillendirme uygulanmaz:
  `service_tier` yok, Responses `store` yok, OpenAI akıl yürütme uyumluluk
  yükü şekillendirmesi yok ve prompt cache ipuçları yok
- gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`)
  bu özel proxy URL’lerine enjekte edilmez

Daha katı OpenAI uyumlu arka uçlar için uyumluluk notları:

- Bazı sunucular Chat Completions üzerinde yapılandırılmış içerik parçası
  dizileri yerine yalnızca string `messages[].content` kabul eder. Bu uç
  noktalar için
  `models.providers.<provider>.models[].compat.requiresStringContent: true`
  ayarlayın.
- Bazı yerel modeller metin olarak, örneğin `[tool_name]` ardından JSON ve
  `[END_TOOL_REQUEST]` biçiminde bağımsız köşeli parantezli araç istekleri
  yayar. OpenClaw bunları yalnızca ad, dönüş için kayıtlı bir araçla tam olarak
  eşleştiğinde gerçek araç çağrılarına yükseltir; aksi halde blok
  desteklenmeyen metin olarak ele alınır ve kullanıcıya görünen yanıtlardan
  gizlenir.
- Bir model araç çağrısına benzeyen JSON, XML veya ReAct tarzı metin yayıyor
  ama sağlayıcı yapılandırılmış bir çağrı yaymıyorsa, OpenClaw bunu metin olarak
  bırakır ve varsa çalıştırma kimliği, sağlayıcı/model, algılanan örüntü ve araç
  adıyla birlikte bir uyarı günlüğe yazar. Bunu tamamlanmış bir araç çalıştırması
  değil, sağlayıcı/model araç çağrısı uyumsuzluğu olarak değerlendirin.
- Araçlar çalışmak yerine asistan metni olarak görünüyorsa, örneğin ham JSON,
  XML, ReAct söz dizimi veya sağlayıcı yanıtında boş bir `tool_calls` dizisi
  varsa, önce sunucunun araç çağrısı destekleyen bir sohbet şablonu/ayrıştırıcısı
  kullandığını doğrulayın. Ayrıştırıcısı yalnızca araç kullanımı zorlandığında
  çalışan OpenAI uyumlu Chat Completions arka uçları için metin ayrıştırmaya
  güvenmek yerine model başına istek geçersiz kılması ayarlayın:

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

  Bunu yalnızca her normal dönüşün bir araç çağırması gereken modeller/oturumlar
  için kullanın. OpenClaw’ın varsayılan proxy değeri olan
  `tool_choice: "auto"` değerini geçersiz kılar. `local/my-local-model` değerini
  `openclaw models list` tarafından gösterilen tam sağlayıcı/model referansıyla
  değiştirin.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Özel OpenAI uyumlu bir model, yerleşik profilin ötesindeki OpenAI akıl yürütme
  çabalarını kabul ediyorsa bunları model uyumluluk bloğunda bildirin. Buraya
  `"xhigh"` eklemek, yapılandırılan sağlayıcı/model referansı için `/think xhigh`,
  oturum seçicileri, Gateway doğrulaması ve `llm-task` doğrulamasının bu seviyeyi
  sunmasını sağlar:

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

## Daha küçük veya daha katı arka uçlar

Model temiz biçimde yükleniyor ama tam ajan dönüşleri hatalı davranıyorsa yukarıdan aşağı çalışın; önce aktarımı doğrulayın, sonra yüzeyi daraltın.

1. **Yerel modelin kendisinin yanıt verdiğini doğrulayın.** Araç yok, ajan bağlamı yok:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway yönlendirmesini doğrulayın.** Yalnızca sağlanan istemi gönderir; transkripti, AGENTS önyüklemesini, bağlam motoru derlemesini, araçları ve paketle gelen MCP sunucularını atlar, ancak yine de Gateway yönlendirmesini, kimlik doğrulamayı ve sağlayıcı seçimini çalıştırır:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Yalın modu deneyin.** Her iki prob da başarılı olmasına rağmen gerçek ajan turları hatalı biçimlendirilmiş araç çağrıları veya çok büyük istemlerle başarısız oluyorsa `agents.defaults.experimental.localModelLean: true` değerini etkinleştirin. Bu, istem biçiminin daha küçük ve daha az kırılgan olması için en ağır üç varsayılan aracı (`browser`, `cron`, `message`) kaldırır. Tam açıklama, ne zaman kullanılacağı ve açık olduğunu doğrulama yöntemi için [Deneysel Özellikler → Yerel model yalın modu](/tr/concepts/experimental-features#local-model-lean-mode) bölümüne bakın.

4. **Son çare olarak araçları tamamen devre dışı bırakın.** Yalın mod yeterli değilse, ilgili model girdisi için `models.providers.<provider>.models[].compat.supportsTools: false` ayarlayın. Ajan daha sonra o modelde araç çağrıları olmadan çalışır.

5. **Bundan sonrası için darboğaz yukarı akıştadır.** Arka uç, yalın mod ve `supportsTools: false` sonrasında yalnızca daha büyük OpenClaw çalıştırmalarında hâlâ başarısız oluyorsa, kalan sorun genellikle yukarı akış model veya sunucu kapasitesidir: bağlam penceresi, GPU belleği, kv-cache çıkarma ya da bir arka uç hatası. Bu noktada sorun OpenClaw'ın taşıma katmanı değildir.

## Sorun giderme

- Gateway proxy'ye ulaşabiliyor mu? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio modeli kaldırılmış mı? Yeniden yükleyin; soğuk başlatma, sık görülen bir "takılma" nedenidir.
- Yerel sunucu `terminated`, `ECONNRESET` mi diyor ya da turun ortasında akışı kapatıyor mu?
  OpenClaw, tanılama verilerinde düşük kardinaliteli bir `model.call.error.failureKind` değerinin yanı sıra OpenClaw sürecinin RSS/heap anlık görüntüsünü kaydeder. LM Studio/Ollama bellek baskısı için, model sunucusunun öldürülüp öldürülmediğini doğrulamak üzere bu zaman damgasını sunucu günlüğü veya macOS çökme / jetsam günlüğüyle eşleştirin.
- OpenClaw, bağlam penceresi ön kontrol eşiklerini algılanan model penceresinden ya da `agents.defaults.contextTokens` etkili pencereyi düşürdüğünde sınırlanmamış model penceresinden türetir. %20'nin altında **8k** alt sınırıyla uyarır. Sert bloklamalar, etkili bağlam penceresiyle sınırlandırılmış **4k** alt sınırıyla %10 eşiğini kullanır; böylece aşırı büyük model meta verileri, aksi hâlde geçerli olan kullanıcı sınırını reddedemez. Bu ön kontrole takılırsanız sunucu/model bağlam sınırını artırın veya daha büyük bir model seçin.
- Bağlam hataları mı var? `contextWindow` değerini düşürün veya sunucu sınırınızı yükseltin.
- OpenAI uyumlu sunucu `messages[].content ... expected a string` mı döndürüyor?
  İlgili model girdisine `compat.requiresStringContent: true` ekleyin.
- Doğrudan küçük `/v1/chat/completions` çağrıları çalışıyor, ancak `openclaw infer model run --local` Gemma veya başka bir yerel modelde başarısız mı oluyor? Önce sağlayıcı URL'sini, model başvurusunu, kimlik doğrulama işaretleyicisini ve sunucu günlüklerini kontrol edin; yerel `model run` ajan araçlarını içermez. Yerel `model run` başarılı olmasına rağmen daha büyük ajan turları başarısız oluyorsa, ajan araç yüzeyini `localModelLean` veya `compat.supportsTools: false` ile azaltın.
- Araç çağrıları ham JSON/XML/ReAct metni olarak mı görünüyor veya sağlayıcı boş bir `tool_calls` dizisi mi döndürüyor? Asistan metnini körü körüne araç yürütmeye dönüştüren bir proxy eklemeyin. Önce sunucu sohbet şablonunu/ayrıştırıcısını düzeltin. Model yalnızca araç kullanımı zorunlu tutulduğunda çalışıyorsa, yukarıdaki model başına `params.extra_body.tool_choice: "required"` geçersiz kılmasını ekleyin ve bu model girdisini yalnızca her turda bir araç çağrısı beklendiği oturumlar için kullanın.
- Güvenlik: yerel modeller sağlayıcı tarafı filtreleri atlar; istem enjeksiyonu etki alanını sınırlamak için ajanları dar kapsamlı tutun ve Compaction açık olsun.

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Model yük devri](/tr/concepts/model-failover)
