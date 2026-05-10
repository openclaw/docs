---
read_when:
    - Modelleri kendi GPU sunucunuzdan sunmak istiyorsunuz
    - LM Studio’yu veya OpenAI uyumlu bir ara sunucuyu yapılandırıyorsunuz
    - En güvenli yerel model rehberliğine ihtiyacınız var
summary: OpenClaw'u yerel LLM'lerde çalıştırın (LM Studio, vLLM, LiteLLM, özel OpenAI uç noktaları)
title: Yerel modeller
x-i18n:
    generated_at: "2026-05-10T19:37:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

Yerel modeller uygulanabilir. Bununla birlikte donanım, bağlam boyutu ve istem-enjeksiyonu savunması için çıtayı yükseltirler — küçük veya agresif biçimde nicemlenmiş kartlar bağlamı kırpar ve güvenliği zayıflatır. Bu sayfa, üst düzey yerel yığınlar ve özel OpenAI uyumlu yerel sunucular için kanaat odaklı kılavuzdur. En az sürtünmeli başlangıç için [LM Studio](/tr/providers/lmstudio) veya [Ollama](/tr/providers/ollama) ile başlayın ve `openclaw onboard` kullanın.

Yalnızca seçilen bir model ihtiyaç duyduğunda başlaması gereken yerel sunucular için bkz.
[Yerel model hizmetleri](/tr/gateway/local-model-services).

## Donanım tabanı

Yüksek hedefleyin: rahat bir ajan döngüsü için **≥2 tam donanımlı Mac Studio veya eşdeğer bir GPU sistemi (~30 bin $+)**. Tek bir **24 GB** GPU yalnızca daha hafif istemlerde, daha yüksek gecikmeyle çalışır. Her zaman **barındırabileceğiniz en büyük / tam boy varyantı** çalıştırın; küçük veya yoğun biçimde nicemlenmiş checkpoint'ler istem-enjeksiyonu riskini artırır (bkz. [Güvenlik](/tr/gateway/security)).

## Bir arka uç seçin

| Arka uç                                             | Şu durumda kullanın                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| [LM Studio](/tr/providers/lmstudio)                    | İlk kez yerel kurulum, GUI yükleyici, yerel Responses API                  |
| [Ollama](/tr/providers/ollama)                         | CLI iş akışı, model kitaplığı, müdahalesiz systemd hizmeti                 |
| MLX / vLLM / SGLang                                 | OpenAI uyumlu HTTP uç noktasıyla yüksek iş hacimli kendi kendine barındırma |
| LiteLLM / OAI-proxy / özel OpenAI uyumlu proxy      | Başka bir model API'sini öne alıyor ve OpenClaw'ın onu OpenAI gibi ele almasını istiyorsanız |

Arka uç destekliyorsa Responses API (`api: "openai-responses"`) kullanın (LM Studio destekler). Aksi halde Chat Completions (`api: "openai-completions"`) ile devam edin.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA kullanıcıları:** Resmi Ollama Linux yükleyicisi `Restart=always` ile bir systemd hizmetini etkinleştirir. WSL2 GPU kurulumlarında otomatik başlatma, önyükleme sırasında son modeli yeniden yükleyip ana makine belleğini sabitleyebilir. WSL2 VM'niz Ollama'yı etkinleştirdikten sonra tekrar tekrar yeniden başlıyorsa bkz. [WSL2 çökme döngüsü](/tr/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Önerilen: LM Studio + büyük yerel model (Responses API)

Güncel en iyi yerel yığın. LM Studio'da büyük bir model yükleyin (örneğin tam boy bir Qwen, DeepSeek veya Llama derlemesi), yerel sunucuyu etkinleştirin (varsayılan `http://127.0.0.1:1234`) ve akıl yürütmeyi son metinden ayrı tutmak için Responses API kullanın.

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
- LM Studio'da **mevcut en büyük model derlemesini** indirin ("small"/yoğun biçimde nicemlenmiş varyantlardan kaçının), sunucuyu başlatın, `http://127.0.0.1:1234/v1/models` adresinin onu listelediğini doğrulayın.
- `my-local-model` değerini LM Studio'da gösterilen gerçek model kimliğiyle değiştirin.
- Modeli yüklü tutun; soğuk yükleme başlangıç gecikmesi ekler.
- LM Studio derlemeniz farklıysa `contextWindow`/`maxTokens` değerlerini ayarlayın.
- WhatsApp için yalnızca son metnin gönderilmesi amacıyla Responses API'ye bağlı kalın.

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

Birincil ve yedek sırasını değiştirin; yerel makine kapalıyken Sonnet veya Opus'a geri dönebilmek için aynı providers bloğunu ve `models.mode: "merge"` değerini koruyun.

### Bölgesel barındırma / veri yönlendirme

- Barındırılan MiniMax/Kimi/GLM varyantları OpenRouter üzerinde bölgeye sabitlenmiş uç noktalarla da bulunur (ör. ABD'de barındırılan). Trafiği seçtiğiniz yargı alanında tutmak ve yine de Anthropic/OpenAI yedekleri için `models.mode: "merge"` kullanmak üzere oradaki bölgesel varyantı seçin.
- Yalnızca yerel kullanım en güçlü gizlilik yoludur; sağlayıcı özelliklerine ihtiyaç duyduğunuz ancak veri akışı üzerinde kontrol istediğiniz durumlarda barındırılan bölgesel yönlendirme orta yoldur.

## Diğer OpenAI uyumlu yerel proxy'ler

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy veya özel
Gateway'ler, OpenAI tarzı bir `/v1/chat/completions`
uç noktası sunuyorsa çalışır. Arka uç açıkça
`/v1/responses` desteğini belgelemiyorsa Chat Completions adaptörünü kullanın.
Yukarıdaki sağlayıcı bloğunu kendi uç noktanız ve model kimliğinizle değiştirin:

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
`openai-completions` kullanır. `127.0.0.1` gibi loopback uç noktalarına otomatik
olarak güvenilir; LAN, tailnet ve özel DNS uç noktaları yine de
`request.allowPrivateNetwork: true` gerektirir.

`models.providers.<id>.models[].id` değeri sağlayıcıya yereldir. Buraya
sağlayıcı önekini eklemeyin. Örneğin
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` ile başlatılan bir MLX sunucusu şu
katalog kimliğini ve model referansını kullanmalıdır:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Görüntü eklerinin ajan dönüşlerine eklenmesi için yerel veya proxy üzerinden
çalışan görme modellerinde `input: ["text", "image"]` ayarlayın. Etkileşimli
özel sağlayıcı başlangıç kurulumu yaygın görme modeli kimliklerini çıkarır ve
yalnızca bilinmeyen adlar için sorar. Etkileşimsiz başlangıç kurulumu aynı
çıkarımı kullanır; bilinmeyen görme kimlikleri için `--custom-image-input`,
uç noktanızın arkasındaki bilinen görünümlü model yalnızca metin ise
`--custom-text-input` kullanın.

Barındırılan modellerin yedek olarak kullanılabilir kalması için `models.mode: "merge"` tutun.
Yavaş yerel veya uzak model sunucuları için `agents.defaults.timeoutSeconds`
değerini yükseltmeden önce `models.providers.<id>.timeoutSeconds` kullanın.
Sağlayıcı zaman aşımı yalnızca bağlantı, başlıklar, gövde akışı ve toplam
korumalı fetch iptali dahil olmak üzere model HTTP isteklerine uygulanır.

<Note>
Özel OpenAI uyumlu sağlayıcılar için `apiKey: "ollama-local"` gibi gizli olmayan bir yerel işaretçinin kalıcılaştırılması, `baseUrl` loopback, özel LAN, `.local` veya çıplak bir ana makine adına çözümlendiğinde kabul edilir. OpenClaw bunu eksik anahtar bildirmek yerine geçerli bir yerel kimlik bilgisi olarak ele alır. Genel bir ana makine adını kabul eden her sağlayıcı için gerçek bir değer kullanın.
</Note>

Yerel/proxy'li `/v1` arka uçları için davranış notu:

- OpenClaw bunları yerel OpenAI uç noktaları değil, proxy tarzı OpenAI uyumlu rotalar olarak ele alır
- yerel OpenAI'ye özgü istek şekillendirme burada uygulanmaz: `service_tier` yok,
  Responses `store` yok, OpenAI akıl yürütme uyumluluğu payload
  şekillendirmesi yok ve istem önbelleği ipuçları yok
- gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`)
  bu özel proxy URL'lerine eklenmez

Daha katı OpenAI uyumlu arka uçlar için uyumluluk notları:

- Bazı sunucular Chat Completions üzerinde yapılandırılmış içerik parçası dizilerini değil,
  yalnızca string `messages[].content` kabul eder. Bu uç noktalar için
  `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
- Bazı yerel modeller, metin olarak tek başına köşeli parantezli araç istekleri üretir;
  örneğin `[tool_name]` ardından JSON ve `[END_TOOL_REQUEST]`. OpenClaw
  bunları yalnızca ad, o dönüş için kayıtlı bir araçla tam olarak eşleştiğinde
  gerçek araç çağrılarına yükseltir; aksi halde blok desteklenmeyen metin olarak
  ele alınır ve kullanıcıya görünen yanıtlardan gizlenir.
- Bir model araç çağrısı gibi görünen JSON, XML veya ReAct tarzı metin üretirse
  ancak sağlayıcı yapılandırılmış bir çağrı üretmediyse, OpenClaw bunu metin olarak
  bırakır ve mümkün olduğunda çalıştırma kimliği, sağlayıcı/model, algılanan örüntü ve
  araç adıyla bir uyarı günlüğe yazar. Bunu tamamlanmış bir araç çalıştırması değil,
  sağlayıcı/model araç çağrısı uyumsuzluğu olarak değerlendirin.
- Araçlar çalışmak yerine asistan metni olarak görünüyorsa, örneğin ham JSON,
  XML, ReAct söz dizimi veya sağlayıcı yanıtında boş bir `tool_calls` dizisi,
  önce sunucunun araç çağrısı destekli bir chat şablonu/ayrıştırıcısı kullandığını doğrulayın.
  Ayrıştırıcısı yalnızca araç kullanımı zorlandığında çalışan OpenAI uyumlu
  Chat Completions arka uçları için, metin ayrıştırmaya güvenmek yerine model başına
  istek geçersiz kılması ayarlayın:

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

  Bunu yalnızca her normal dönüşün bir araç çağırması gereken modeller/oturumlar için kullanın.
  OpenClaw'ın varsayılan proxy değeri olan `tool_choice: "auto"` değerini geçersiz kılar.
  `local/my-local-model` değerini `openclaw models list` tarafından gösterilen tam sağlayıcı/model referansıyla değiştirin.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Özel OpenAI uyumlu bir model, yerleşik profilin ötesinde OpenAI akıl yürütme çabalarını kabul ediyorsa,
  bunları model compat bloğunda bildirin. Buraya `"xhigh"` eklemek,
  yapılandırılmış sağlayıcı/model referansı için `/think xhigh`, oturum seçicileri, Gateway doğrulaması ve `llm-task`
  doğrulamasının bu düzeyi sunmasını sağlar:

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

Model temiz şekilde yükleniyor ancak tam ajan dönüşleri yanlış davranıyorsa, yukarıdan aşağı çalışın — önce aktarımı doğrulayın, ardından yüzeyi daraltın.

1. **Yerel modelin kendisinin yanıt verdiğini doğrulayın.** Araç yok, ajan bağlamı yok:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway yönlendirmesini doğrulayın.** Yalnızca sağlanan istemi gönderir — transkripti, AGENTS önyüklemesini, context-engine derlemesini, araçları ve paketli MCP sunucularını atlar, ancak yine de Gateway yönlendirmesini, kimlik doğrulamayı ve sağlayıcı seçimini çalıştırır:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Yalın modu deneyin.** Her iki deneme de geçiyor ancak gerçek ajan dönüşleri hatalı biçimlendirilmiş araç çağrıları veya aşırı büyük istemlerle başarısız oluyorsa, `agents.defaults.experimental.localModelLean: true` değerini etkinleştirin. İstem şeklinin daha küçük ve daha az kırılgan olması için en ağır üç varsayılan aracı (`browser`, `cron`, `message`) çıkarır. Tam açıklama, ne zaman kullanılacağı ve açık olduğunu nasıl doğrulayacağınız için [Deneysel Özellikler → Yerel model yalın modu](/tr/concepts/experimental-features#local-model-lean-mode) bölümüne bakın.

4. **Son çare olarak araçları tamamen devre dışı bırakın.** Yalın mod yeterli değilse, o model girdisi için `models.providers.<provider>.models[].compat.supportsTools: false` ayarlayın. Ajan daha sonra o modelde araç çağrıları olmadan çalışır.

5. **Bundan sonrası için dar boğaz yukarı akıştadır.** Yalın mod ve `supportsTools: false` sonrasında arka uç yalnızca daha büyük OpenClaw çalıştırmalarında hâlâ başarısız oluyorsa, kalan sorun genellikle yukarı akış model veya sunucu kapasitesidir — bağlam penceresi, GPU belleği, kv-cache çıkarımı veya arka uç hatası. Bu noktada sorun OpenClaw'ın aktarım katmanı değildir.

## Sorun giderme

- Gateway proxy'ye ulaşabiliyor mu? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio modeli kaldırılmış mı? Yeniden yükleyin; soğuk başlatma yaygın bir "takılma" nedenidir.
- Yerel sunucu `terminated`, `ECONNRESET` diyor veya akışı dönüşün ortasında kapatıyor mu?
  OpenClaw, tanılarda düşük kardinaliteli bir `model.call.error.failureKind` ile birlikte
  OpenClaw işleminin RSS/heap anlık görüntüsünü kaydeder. LM Studio/Ollama
  bellek baskısı için, model sunucusunun sonlandırılıp sonlandırılmadığını doğrulamak üzere
  bu zaman damgasını sunucu günlüğüyle veya macOS çökme / jetsam günlüğüyle eşleştirin.
- OpenClaw, bağlam penceresi ön denetim eşiklerini algılanan model penceresinden veya `agents.defaults.contextTokens` etkin pencereyi düşürdüğünde sınırlandırılmamış model penceresinden türetir. %20'nin altında **8k** tabanla uyarır. Katı engellemeler, **4k** tabanla %10 eşiğini kullanır ve etkin bağlam penceresiyle sınırlandırılır; böylece aşırı büyük model meta verileri, aksi halde geçerli olan bir kullanıcı sınırını reddedemez. Bu ön denetime takılırsanız, sunucu/model bağlam sınırını yükseltin veya daha büyük bir model seçin.
- Bağlam hataları mı var? `contextWindow` değerini düşürün veya sunucu sınırınızı yükseltin.
- OpenAI uyumlu sunucu `messages[].content ... expected a string` döndürüyor mu?
  O model girdisine `compat.requiresStringContent: true` ekleyin.
- OpenAI uyumlu sunucu `validation.keys` döndürüyor veya ileti girdilerinin yalnızca `role` ve `content` alanlarına izin verdiğini mi söylüyor?
  O model girdisine `compat.strictMessageKeys: true` ekleyin.
- Doğrudan küçük `/v1/chat/completions` çağrıları çalışıyor, ancak `openclaw infer model run --local`
  Gemma veya başka bir yerel modelde başarısız mı oluyor? Önce sağlayıcı URL'sini, model referansını, kimlik doğrulama
  işaretçisini ve sunucu günlüklerini kontrol edin; yerel `model run` ajan araçlarını içermez.
  Yerel `model run` başarılı oluyor ancak daha büyük ajan dönüşleri başarısız oluyorsa, ajan
  araç yüzeyini `localModelLean` veya `compat.supportsTools: false` ile azaltın.
- Araç çağrıları ham JSON/XML/ReAct metni olarak mı görünüyor ya da sağlayıcı
  boş bir `tool_calls` dizisi mi döndürüyor? Asistan metnini körlemesine
  araç yürütmeye dönüştüren bir proxy eklemeyin. Önce sunucu sohbet şablonunu/ayrıştırıcısını düzeltin. Model
  yalnızca araç kullanımı zorlandığında çalışıyorsa, yukarıdaki model başına
  `params.extra_body.tool_choice: "required"` geçersiz kılmasını ekleyin ve o model
  girdisini yalnızca her dönüşte bir araç çağrısının beklendiği oturumlarda kullanın.
- Güvenlik: yerel modeller sağlayıcı tarafı filtreleri atlar; istem enjeksiyonu etki alanını sınırlamak için ajanları dar tutun ve Compaction açık olsun.

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Model yük devri](/tr/concepts/model-failover)
