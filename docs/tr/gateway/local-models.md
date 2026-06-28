---
read_when:
    - Modelleri kendi GPU makinenizden sunmak istiyorsunuz
    - LM Studio veya OpenAI uyumlu bir proxy bağlıyorsunuz
    - En güvenli yerel model rehberliğine ihtiyacınız var
summary: OpenClaw'ı yerel LLM'lerde çalıştırın (LM Studio, vLLM, LiteLLM, özel OpenAI uç noktaları)
title: Yerel modeller
x-i18n:
    generated_at: "2026-06-28T00:35:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

Yerel modeller yapılabilir. Ancak donanım, bağlam boyutu ve prompt enjeksiyonu savunması için çıtayı da yükseltirler — küçük veya agresif biçimde kuantize edilmiş kartlar bağlamı kırpar ve güvenliği zayıflatır. Bu sayfa, üst düzey yerel yığınlar ve özel OpenAI uyumlu yerel sunucular için görüşlü rehberdir. En düşük sürtünmeli başlangıç için [LM Studio](/tr/providers/lmstudio) veya [Ollama](/tr/providers/ollama) ile başlayın ve `openclaw onboard` kullanın.

Yalnızca seçili bir model onlara ihtiyaç duyduğunda başlaması gereken yerel sunucular için bkz.
[Yerel model hizmetleri](/tr/gateway/local-model-services).

## Donanım alt sınırı

Yüksek hedefleyin: rahat bir ajan döngüsü için **≥2 en üst donanımlı Mac Studio veya eşdeğer bir GPU sistemi (~30 bin $+)**. Tek bir **24 GB** GPU yalnızca daha hafif promptlarda ve daha yüksek gecikmeyle çalışır. Her zaman **barındırabildiğiniz en büyük / tam boyutlu varyantı** çalıştırın; küçük veya yoğun kuantize edilmiş checkpoint'ler prompt enjeksiyonu riskini artırır (bkz. [Güvenlik](/tr/gateway/security)).

## Bir arka uç seçin

| Arka uç                                              | Ne zaman kullanılır                                                         |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/tr/providers/ds4)                                | OpenAI uyumlu araç çağrılarıyla macOS Metal üzerinde yerel DeepSeek V4 Flash |
| [LM Studio](/tr/providers/lmstudio)                     | İlk kez yerel kurulum, GUI yükleyici, yerel Responses API                   |
| LiteLLM / OAI-proxy / özel OpenAI uyumlu proxy       | Başka bir model API'sini öne alıyorsunuz ve OpenClaw'ın onu OpenAI gibi ele alması gerekiyor |
| MLX / vLLM / SGLang                                  | OpenAI uyumlu HTTP uç noktasıyla yüksek verimli, kendi barındırdığınız servis |
| [Ollama](/tr/providers/ollama)                          | CLI iş akışı, model kitaplığı, müdahalesiz systemd hizmeti                  |

Arka uç destekliyorsa Responses API (`api: "openai-responses"`) kullanın (LM Studio destekler). Aksi halde Chat Completions (`api: "openai-completions"`) ile devam edin.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA kullanıcıları:** Resmi Ollama Linux yükleyicisi, `Restart=always` ayarlı bir systemd hizmetini etkinleştirir. WSL2 GPU kurulumlarında otomatik başlatma, açılış sırasında son modeli yeniden yükleyip ana makine belleğini sabitleyebilir. Ollama'yı etkinleştirdikten sonra WSL2 VM'iniz tekrar tekrar yeniden başlıyorsa bkz. [WSL2 crash loop](/tr/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Önerilen: LM Studio + büyük yerel model (Responses API)

Mevcut en iyi yerel yığın. LM Studio'da büyük bir model yükleyin (örneğin tam boyutlu bir Qwen, DeepSeek veya Llama derlemesi), yerel sunucuyu etkinleştirin (varsayılan `http://127.0.0.1:1234`) ve akıl yürütmeyi nihai metinden ayrı tutmak için Responses API kullanın.

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

- LM Studio'yu yükleyin: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio'da **mevcut en büyük model derlemesini** indirin ("small"/yoğun kuantize edilmiş varyantlardan kaçının), sunucuyu başlatın, `http://127.0.0.1:1234/v1/models` adresinin onu listelediğini doğrulayın.
- `my-local-model` değerini LM Studio'da gösterilen gerçek model ID'siyle değiştirin.
- Modeli yüklü tutun; soğuk yükleme başlangıç gecikmesi ekler.
- LM Studio derlemeniz farklıysa `contextWindow`/`maxTokens` değerlerini ayarlayın.
- WhatsApp için Responses API'ye bağlı kalın; böylece yalnızca nihai metin gönderilir.

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

Birincil ve geri dönüş sırasını değiştirin; aynı providers bloğunu ve `models.mode: "merge"` değerini koruyun, böylece yerel kutu kapalıyken Sonnet veya Opus'a geri dönebilirsiniz.

### Bölgesel barındırma / veri yönlendirme

- Barındırılan MiniMax/Kimi/GLM varyantları OpenRouter üzerinde bölgeye sabitlenmiş uç noktalarla da bulunur (ör. ABD'de barındırılan). Trafiği seçtiğiniz yargı alanında tutarken Anthropic/OpenAI geri dönüşleri için yine `models.mode: "merge"` kullanmak üzere oradaki bölgesel varyantı seçin.
- Yalnızca yerel kullanım en güçlü gizlilik yoludur; sağlayıcı özelliklerine ihtiyaç duyup veri akışı üzerinde kontrol istediğinizde barındırılan bölgesel yönlendirme orta yoldur.

## Diğer OpenAI uyumlu yerel proxy'ler

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy veya özel
Gateway'ler, OpenAI tarzı bir `/v1/chat/completions`
uç noktası sunuyorsa çalışır. Arka uç açıkça `/v1/responses` desteğini
belgelemiyorsa Chat Completions bağdaştırıcısını kullanın. Yukarıdaki provider
bloğunu kendi uç noktanız ve model ID'nizle değiştirin:

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

`baseUrl` içeren özel bir provider'da `api` atlanırsa OpenClaw varsayılan olarak
`openai-completions` kullanır. Özel/yerel provider girdileri, korumalı model
istekleri için tam olarak yapılandırılmış `baseUrl` origin değerine güvenir;
buna loopback, LAN, tailnet ve özel DNS hostları dahildir. Diğer özel origin'lere
giden istekler yine de `request.allowPrivateNetwork: true` gerektirir; metadata/link-local
origin'ler açık opt-in olmadan engelli kalır. Tam-origin güveninden çıkmak için bunu `false` olarak ayarlayın.

`models.providers.<id>.models[].id` değeri provider'a yereldir. Buraya
provider önekini eklemeyin. Örneğin,
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` ile başlatılmış bir MLX sunucusu şu
katalog ID'sini ve model ref değerini kullanmalıdır:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Görsel eklerin ajan dönüşlerine enjekte edilmesi için yerel veya proxied vision modellerinde
`input: ["text", "image"]` ayarlayın. Etkileşimli özel provider
onboarding, yaygın vision model ID'lerini çıkarır ve yalnızca bilinmeyen adlar için soru sorar.
Etkileşimsiz onboarding aynı çıkarımı kullanır; bilinmeyen vision ID'leri için `--custom-image-input`,
uç noktanızın arkasında metin-only olan bilinen görünümlü bir model için `--custom-text-input` kullanın.

Barındırılan modellerin geri dönüş olarak kullanılabilir kalması için `models.mode: "merge"` değerini koruyun.
Yavaş yerel veya uzak model sunucuları için `agents.defaults.timeoutSeconds` değerini artırmadan önce
`models.providers.<id>.timeoutSeconds` kullanın. Provider zaman aşımı
yalnızca model HTTP isteklerine uygulanır; bağlantı, header'lar, gövde streaming'i
ve toplam guarded-fetch iptali buna dahildir. Ajan veya çalıştırma zaman aşımı daha düşükse
o tavanı da artırın, çünkü provider zaman aşımları tüm ajan çalıştırmasını uzatamaz.

<Note>
Özel OpenAI uyumlu provider'lar için `baseUrl` loopback, özel LAN, `.local` veya çıplak hostname'e çözümlendiğinde `apiKey: "ollama-local"` gibi gizli olmayan yerel bir işaretçinin kalıcılaştırılması kabul edilir. OpenClaw bunu eksik anahtar bildirmek yerine geçerli bir yerel kimlik bilgisi olarak ele alır. Genel bir hostname kabul eden herhangi bir provider için gerçek bir değer kullanın.
</Note>

Yerel/proxied `/v1` arka uçları için davranış notu:

- OpenClaw bunları yerel
  OpenAI uç noktaları değil, proxy tarzı OpenAI uyumlu rotalar olarak ele alır
- yerel OpenAI-only istek şekillendirme burada uygulanmaz: `service_tier` yok,
  Responses `store` yok, OpenAI reasoning uyumluluk payload
  şekillendirmesi yok ve prompt-cache ipuçları yok
- gizli OpenClaw ilişkilendirme header'ları (`originator`, `version`, `User-Agent`)
  bu özel proxy URL'lerine enjekte edilmez

Daha katı OpenAI uyumlu arka uçlar için uyumluluk notları:

- Bazı sunucular Chat Completions üzerinde yapılandırılmış content-part dizilerini değil,
  yalnızca string `messages[].content` kabul eder. Bu uç noktalar için
  `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
- Bazı yerel modeller, metin olarak bağımsız köşeli parantezli araç istekleri yayar; örneğin
  `[tool_name]` ardından JSON ve `[END_TOOL_REQUEST]`. OpenClaw
  bunları yalnızca ad, dönüş için kayıtlı bir araçla tam olarak eşleştiğinde gerçek araç çağrılarına
  yükseltir; aksi halde blok desteklenmeyen metin olarak ele alınır ve kullanıcıya görünen yanıtlardan
  gizlenir.
- Bir model JSON, XML veya ReAct tarzı, araç çağrısı gibi görünen metin üretirse
  ancak provider yapılandırılmış bir invocation yaymadıysa OpenClaw bunu metin olarak
  bırakır ve run id, provider/model, algılanan desen ve varsa
  araç adıyla bir uyarı günlüğe yazar. Bunu tamamlanmış bir araç çalıştırması değil,
  provider/model araç çağrısı uyumsuzluğu olarak ele alın.
- Araçlar çalışmak yerine asistan metni olarak görünüyorsa, örneğin ham JSON,
  XML, ReAct söz dizimi veya provider yanıtında boş bir `tool_calls` dizisi varsa,
  önce sunucunun araç çağrısı destekleyen bir chat template/parser kullandığını doğrulayın. Parser'ı yalnızca araç
  kullanımı zorlandığında çalışan OpenAI uyumlu Chat Completions arka uçları için metin
  ayrıştırmaya güvenmek yerine model başına istek override'ı ayarlayın:

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

  Bunu yalnızca her normal dönüşün araç çağırması gereken modeller/oturumlar için kullanın.
  OpenClaw'ın varsayılan proxy değeri olan `tool_choice: "auto"` değerini override eder.
  `local/my-local-model` değerini `openclaw models list` tarafından gösterilen tam provider/model ref ile
  değiştirin.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Özel bir OpenAI uyumlu model, yerleşik profilin ötesinde OpenAI reasoning effort'larını kabul ediyorsa
  bunları model compat bloğunda bildirin. Buraya `"xhigh"` eklemek,
  `/think xhigh`, oturum seçicileri, Gateway doğrulaması ve `llm-task`
  doğrulamasının, bu yapılandırılmış provider/model ref için düzeyi göstermesini sağlar:

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

Model sorunsuz yükleniyor ancak tam agent turları hatalı davranıyorsa, yukarıdan aşağı ilerleyin; önce aktarımı doğrulayın, sonra yüzeyi daraltın.

1. **Yerel modelin kendisinin yanıt verdiğini doğrulayın.** Araç yok, agent bağlamı yok:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway yönlendirmesini doğrulayın.** Yalnızca verilen istemi gönderir; transcript, AGENTS önyüklemesi, bağlam motoru derlemesi, araçlar ve paketlenmiş MCP sunucularını atlar, ancak yine de Gateway yönlendirmesini, kimlik doğrulamayı ve sağlayıcı seçimini çalıştırır:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Yalın modu deneyin.** Her iki deneme de geçiyor ancak gerçek agent turları hatalı biçimlendirilmiş araç çağrıları veya aşırı büyük istemlerle başarısız oluyorsa `agents.defaults.experimental.localModelLean: true` ayarını etkinleştirin. Doğrudan `message` teslim semantiğini koruması gereken çalıştırmalar dışında, en ağır üç varsayılan aracı (`browser`, `cron`, `message`) kaldırır ve daha büyük araç kataloglarını varsayılan olarak yapılandırılmış Tool Search denetimlerinin arkasına alır. Tam açıklama, ne zaman kullanılacağı ve açık olduğunun nasıl doğrulanacağı için [Deneysel Özellikler → Yerel model yalın modu](/tr/concepts/experimental-features#local-model-lean-mode) bölümüne bakın.

4. **Son çare olarak araçları tamamen devre dışı bırakın.** Yalın mod yeterli değilse, ilgili model girdisi için `models.providers.<provider>.models[].compat.supportsTools: false` ayarını yapın. Agent bu durumda o modelde araç çağrıları olmadan çalışır.

5. **Bundan sonrası için darboğaz upstream tarafındadır.** Arka uç, yalın mod ve `supportsTools: false` sonrasında yalnızca daha büyük OpenClaw çalıştırmalarında hâlâ başarısız oluyorsa kalan sorun genellikle upstream model veya sunucu kapasitesidir: bağlam penceresi, GPU belleği, kv-cache çıkarımı veya arka uç hatası. Bu noktada sorun OpenClaw aktarım katmanı değildir.

## Sorun giderme

- Gateway proxy'ye erişebiliyor mu? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio modeli kaldırılmış mı? Yeniden yükleyin; soğuk başlatma yaygın bir "asılı kalma" nedenidir.
- Yerel sunucu `terminated`, `ECONNRESET` diyor veya tur ortasında akışı kapatıyor mu?
  OpenClaw, tanılarda düşük kardinaliteli bir `model.call.error.failureKind` ile birlikte
  OpenClaw sürecinin RSS/heap anlık görüntüsünü kaydeder. LM Studio/Ollama
  bellek baskısı için, model sunucusunun sonlandırılıp sonlandırılmadığını doğrulamak üzere
  bu zaman damgasını sunucu günlüğü veya macOS crash /
  jetsam günlüğüyle eşleştirin.
- OpenClaw, bağlam penceresi ön kontrol eşiklerini algılanan model penceresinden veya `agents.defaults.contextTokens` etkili pencereyi düşürdüğünde sınırsız model penceresinden türetir. **8k** tabanla %20'nin altında uyarır. Sert engellemeler, **4k** tabanla %10 eşiğini kullanır ve etkili bağlam penceresiyle sınırlandırılır; böylece aşırı büyük model meta verileri, aksi halde geçerli olan bir kullanıcı sınırını reddedemez. Bu ön kontrole takılırsanız, sunucu/model bağlam sınırını yükseltin veya daha büyük bir model seçin.
- Bağlam hataları mı var? `contextWindow` değerini düşürün veya sunucu sınırınızı yükseltin.
- OpenAI uyumlu sunucu `messages[].content ... expected a string` döndürüyor mu?
  O model girdisine `compat.requiresStringContent: true` ekleyin.
- OpenAI uyumlu sunucu `validation.keys` döndürüyor veya ileti girdilerinin yalnızca `role` ve `content` alanlarına izin verdiğini mi söylüyor?
  O model girdisine `compat.strictMessageKeys: true` ekleyin.
- Doğrudan küçük `/v1/chat/completions` çağrıları çalışıyor, ancak `openclaw infer model run --local`
  Gemma veya başka bir yerel modelde başarısız mı oluyor? Önce sağlayıcı URL'sini, model referansını, kimlik doğrulama
  işaretini ve sunucu günlüklerini kontrol edin; yerel `model run` agent araçlarını içermez.
  Yerel `model run` başarılı oluyor ancak daha büyük agent turları başarısız oluyorsa, agent
  araç yüzeyini `localModelLean` veya `compat.supportsTools: false` ile azaltın.
- Araç çağrıları ham JSON/XML/ReAct metni olarak mı görünüyor veya sağlayıcı
  boş bir `tool_calls` dizisi mi döndürüyor? Assistant
  metnini körlemesine araç yürütmeye dönüştüren bir proxy eklemeyin. Önce sunucu sohbet şablonunu/ayrıştırıcısını düzeltin. Model
  yalnızca araç kullanımı zorlandığında çalışıyorsa, yukarıdaki model başına
  `params.extra_body.tool_choice: "required"` geçersiz kılmasını ekleyin ve bu model
  girdisini yalnızca her turda bir araç çağrısının beklendiği oturumlarda kullanın.
- Güvenlik: yerel modeller sağlayıcı tarafı filtreleri atlar; istem enjeksiyonu etki alanını sınırlamak için agent kapsamını dar tutun ve Compaction açık kalsın.

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Model failover](/tr/concepts/model-failover)
