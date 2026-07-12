---
read_when:
    - Modelleri kendi GPU makinenizden sunmak istiyorsunuz
    - LM Studio veya OpenAI uyumlu bir proxy yapılandırıyorsunuz
    - En güvenli yerel model rehberliğine ihtiyacınız var
summary: OpenClaw'u yerel LLM'lerde çalıştırma (LM Studio, vLLM, LiteLLM, özel OpenAI uç noktaları)
title: Yerel modeller
x-i18n:
    generated_at: "2026-07-12T11:45:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

Yerel modeller çalışır, ancak donanım, bağlam boyutu ve istem enjeksiyonuna karşı savunma gereksinimlerini yükseltir: küçük veya agresif biçimde nicemlenmiş modeller bağlamı keser ve sağlayıcı tarafındaki güvenlik filtrelerini atlar. Bu sayfa, üst düzey yerel yığınları ve özel OpenAI uyumlu sunucuları ele alır. En sorunsuz yol için [LM Studio](/tr/providers/lmstudio) veya [Ollama](/tr/providers/ollama) ile `openclaw onboard` kullanarak başlayın.

Yalnızca seçilen bir model bunlara ihtiyaç duyduğunda başlatılması gereken yerel sunucular için [Yerel model hizmetleri](/tr/gateway/local-model-services) bölümüne bakın.

## Asgari donanım

Rahat bir ajan döngüsü için **2 veya daha fazla tam donanımlı Mac Studio ya da eşdeğer bir GPU sistemi (~30 bin ABD doları veya üzeri)** hedefleyin. Tek bir **24 GB** GPU, yalnızca daha hafif istemleri daha yüksek gecikmeyle işleyebilir. Her zaman **barındırabileceğiniz en büyük / tam boyutlu varyantı** çalıştırın; küçük veya yoğun biçimde nicemlenmiş denetim noktaları istem enjeksiyonu riskini artırır ([Güvenlik](/tr/gateway/security) bölümüne bakın).

## Bir arka uç seçin

| Arka uç                                             | Şu durumda kullanın                                                                      |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [ds4](/tr/providers/ds4)                               | OpenAI uyumlu araç çağrılarıyla macOS Metal üzerinde yerel DeepSeek V4 Flash             |
| [LM Studio](/tr/providers/lmstudio)                    | İlk yerel kurulum, GUI yükleyici, yerel Responses API                                    |
| LiteLLM / OAI-proxy / özel OpenAI uyumlu proxy      | Başka bir model API'sinin önünde çalışıyorsanız ve OpenClaw'ın bunu OpenAI olarak ele alması gerekiyorsa |
| MLX / vLLM / SGLang                                 | OpenAI uyumlu bir HTTP uç noktasıyla yüksek verimli, kendi ortamınızda barındırılan sunum |
| [Ollama](/tr/providers/ollama)                         | CLI iş akışı, model kitaplığı, müdahale gerektirmeyen systemd hizmeti                    |

Arka uç destekliyorsa `api: "openai-responses"` kullanın (LM Studio destekler). Aksi takdirde `api: "openai-completions"` kullanın. `baseUrl` içeren özel bir sağlayıcıda `api` belirtilmezse OpenClaw varsayılan olarak `openai-completions` kullanır.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** Resmî Ollama Linux yükleyicisi, `Restart=always` ayarlı bir systemd hizmetini etkinleştirir. WSL2 GPU kurulumlarında otomatik başlatma, önyükleme sırasında son modeli yeniden yükleyip ana makine belleğini sabitleyerek sanal makinenin tekrar tekrar yeniden başlamasına neden olabilir. [WSL2 çökme döngüsü](/tr/providers/ollama#troubleshooting) bölümüne bakın.
</Warning>

## LM Studio + büyük yerel model (Responses API)

Bu, şu anda en iyi yerel yığındır. LM Studio'ya büyük bir model (tam boyutlu bir Qwen, DeepSeek veya Llama derlemesi) yükleyin, yerel sunucuyu etkinleştirin (varsayılan `http://127.0.0.1:1234`) ve akıl yürütmeyi nihai metinden ayrı tutmak için Responses API'yi kullanın.

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

Kurulum kontrol listesi:

- LM Studio'yu yükleyin: [https://lmstudio.ai](https://lmstudio.ai)
- **Mevcut en büyük model derlemesini** indirin ("küçük"/yoğun biçimde nicemlenmiş varyantlardan kaçının), sunucuyu başlatın ve `http://127.0.0.1:1234/v1/models` adresinin modeli listelediğini doğrulayın.
- `my-local-model` değerini LM Studio'da gösterilen gerçek model kimliğiyle değiştirin.
- Modeli yüklü tutun; soğuk yükleme başlangıç gecikmesini artırır.
- LM Studio derlemeniz farklıysa `contextWindow`/`maxTokens` değerlerini ayarlayın.
- WhatsApp için yalnızca nihai metnin gönderilmesi amacıyla Responses API'yi kullanmaya devam edin.
- Barındırılan modellerin yedek olarak kullanılabilir kalması için `models.mode: "merge"` ayarını koruyun.

### Hibrit yapılandırma: barındırılan birincil model, yerel yedek model

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

Barındırılan bir güvenlik ağıyla yerel öncelikli kullanım için `primary`/`fallbacks` sırasını değiştirin ve aynı `providers` bloğu ile `models.mode: "merge"` ayarını koruyun.

### Bölgesel barındırma / veri yönlendirme

Barındırılan MiniMax/Kimi/GLM varyantları, bölgeye sabitlenmiş uç noktalarla (örneğin ABD'de barındırılan) OpenRouter üzerinde de bulunur. Anthropic/OpenAI yedekleri için `models.mode: "merge"` ayarını korurken trafiği seçtiğiniz yargı alanında tutmak için bölgesel varyantı seçin. Yalnızca yerel kullanım hâlâ en güçlü gizlilik yoludur; sağlayıcı özelliklerine ihtiyaç duyduğunuz ancak veri akışı üzerinde denetim istediğiniz durumlarda barındırılan bölgesel yönlendirme orta yolu sunar.

## Diğer OpenAI uyumlu yerel proxy'ler

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy veya herhangi bir özel Gateway, OpenAI tarzı bir `/v1/chat/completions` uç noktası sunuyorsa çalışır. Arka uç `/v1/responses` desteğini açıkça belgelemediği sürece `openai-completions` kullanın.

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

Özel/yerel sağlayıcı girdileri; local loopback, LAN, tailnet ve özel DNS ana makineleri dâhil olmak üzere, korumalı model istekleri için tam olarak yapılandırılmış `baseUrl` kaynağına güvenir. Meta veri/bağlantı-yerel kaynakları ne olursa olsun her zaman engellenir. Diğer özel kaynaklara yönelik istekler için yine `models.providers.<id>.request.allowPrivateNetwork: true` gerekir; tam kaynak güvenini devre dışı bırakmak için güven bayrağını `false` olarak ayarlayın.

`models.providers.<id>.models[].id` sağlayıcıya özeldir; sağlayıcı önekini eklemeyin. `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` ile başlatılan bir MLX sunucusu için:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Görüntü eklerinin ajan turlarına dâhil edilmesi için yerel veya proxy üzerinden kullanılan görüntü modellerinde `input: ["text", "image"]` ayarını yapın. Etkileşimli özel sağlayıcı başlangıç yapılandırması, yaygın görüntü modeli kimliklerini çıkarır ve yalnızca bilinmeyen adlar hakkında soru sorar; etkileşimsiz başlangıç yapılandırması da aynı çıkarımı kullanır ve bunu geçersiz kılmak için `--custom-image-input` / `--custom-text-input` seçeneklerini sunar.

`agents.defaults.timeoutSeconds` değerini yükseltmeden önce yavaş yerel/uzak model sunucuları için `models.providers.<id>.timeoutSeconds` kullanın. Sağlayıcı zaman aşımı yalnızca model HTTP istekleri için bağlantıyı, üstbilgileri, gövde akışını ve korumalı getirme işleminin toplam iptal süresini kapsar; ajan/çalıştırma zaman aşımı daha düşükse onu da yükseltin, çünkü sağlayıcı zaman aşımı tüm çalıştırmanın süresini uzatamaz.

<Note>
Özel OpenAI uyumlu sağlayıcılarda, `baseUrl` local loopback, özel bir LAN, `.local` veya yalın bir ana makine adına çözümleniyorsa `apiKey: "ollama-local"` gibi gizli olmayan bir yerel işaretleyici kabul edilir; OpenClaw bunu eksik anahtar olarak bildirmek yerine geçerli bir yerel kimlik bilgisi olarak ele alır. Genel bir ana makine adını kabul eden her sağlayıcı için gerçek bir değer kullanın.
</Note>

Yerel/proxy üzerinden kullanılan `/v1` arka uçları için davranış notları:

- OpenClaw bunları yerel OpenAI uç noktaları olarak değil, proxy tarzı OpenAI uyumlu yollar olarak ele alır.
- Yalnızca yerel OpenAI için kullanılan istek biçimlendirmesi uygulanmaz: `service_tier` yoktur, Responses `store` yoktur, OpenAI akıl yürütme uyumluluğu yük biçimlendirmesi yoktur, istem önbelleği ipuçları yoktur.
- Gizli OpenClaw atıf üstbilgileri (`originator`, `version`, `User-Agent`) özel proxy URL'lerine eklenmez.

Daha katı OpenAI uyumlu arka uçlar için uyumluluk geçersiz kılmaları:

- **Yalnızca dize içerik**: Bazı sunucular yapılandırılmış içerik parçası dizilerini değil, yalnızca dize türündeki `messages[].content` değerlerini kabul eder. `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarını yapın.
- **Katı ileti anahtarları**: Sunucu `role`/`content` dışında anahtarlar içeren ileti girdilerini reddediyorsa `compat.strictMessageKeys: true` ayarını yapın.
- **Köşeli ayraçlı araç metni**: Bazı yerel modeller, JSON ve `[END_TOOL_REQUEST]` tarafından takip edilen `[tool_name]` gibi bağımsız köşeli ayraçlı araç isteklerini metin olarak üretir. OpenClaw bunları yalnızca ad, ilgili tur için kaydedilmiş bir araçla tam olarak eşleştiğinde gerçek araç çağrılarına dönüştürür; aksi takdirde gizli ve desteklenmeyen metin olarak kalır.
- **Yapılandırılmamış, araç çağrısına benzeyen metin**: Bir model yapılandırılmış bir çağrı olmadığı hâlde araç çağrısına benzeyen JSON/XML/ReAct tarzı metin üretirse OpenClaw bunu metin olarak bırakır ve kullanılabildiğinde çalıştırma kimliği, sağlayıcı/model, algılanan desen ve araç adıyla birlikte bir uyarı günlüğe kaydeder. Bu, tamamlanmış bir araç çalıştırması değil, sağlayıcı/model uyumsuzluğudur.
- **Araç kullanımını zorlama**: Araçlar asistan metni olarak görünüyorsa (ham JSON/XML/ReAct veya boş bir `tool_calls` dizisi), önce sunucunun sohbet şablonunun/ayrıştırıcısının araç çağrılarını desteklediğini doğrulayın. Ayrıştırıcı yalnızca araç kullanımı zorlandığında çalışıyorsa varsayılan proxy değeri olan `tool_choice: "auto"` ayarını model bazında geçersiz kılın:

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

  Bunu yalnızca her normal turun bir araç çağırması gereken durumlarda kullanın. `local/my-local-model` değerini `openclaw models list` çıktısındaki tam referansla değiştirin veya CLI aracılığıyla ayarlayın:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Ek akıl yürütme düzeyleri**: Özel bir OpenAI uyumlu model, yerleşik profilin ötesindeki OpenAI akıl yürütme düzeylerini kabul ediyorsa bunları modelin uyumluluk bloğunda bildirin. `"xhigh"` eklemek, bu model referansı için `/think xhigh`, oturum seçicileri, Gateway doğrulaması ve `llm-task` doğrulamasında bu düzeyi kullanılabilir hâle getirir:

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

Model sorunsuz biçimde yükleniyor ancak tam ajan turları hatalı davranıyorsa yukarıdan aşağıya ilerleyin: önce aktarımı doğrulayın, ardından kapsamı daraltın.

1. **Yerel modelin yanıt verdiğini doğrulayın** - araç yok, ajan bağlamı yok:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway yönlendirmesini doğrulayın** - yalnızca istemi gönderir; transkripti, AGENTS önyüklemesini, bağlam motoru derlemesini, araçları ve paketlenmiş MCP sunucularını atlar, ancak yine de Gateway yönlendirmesini, kimlik doğrulamayı ve sağlayıcı seçimini sınar:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Her iki yoklama da başarılı olduğu hâlde gerçek ajan dönüşleri hatalı biçimlendirilmiş araç çağrıları veya aşırı büyük istemler nedeniyle başarısız oluyorsa yalın modu deneyin**: `agents.defaults.experimental.localModelLean: true` olarak ayarlayın. Açıkça gerekmedikçe ağır tarayıcı, cron, mesajlaşma, medya oluşturma, ses ve PDF araçlarını kaldırır; `exec` aracını doğrudan görünür tutarken daha büyük araç kataloglarını varsayılan olarak yapılandırılmış Araç Arama denetimlerinin arkasına alır. Ayrıntılar ve etkin olduğunu nasıl doğrulayacağınız için [Deneysel Özellikler -> Yerel model yalın modu](/tr/concepts/experimental-features#local-model-lean-mode) bölümüne bakın.

4. **Son çare olarak araçları tamamen devre dışı bırakın**; ilgili model için `models.providers.<provider>.models[].compat.supportsTools: false` ayarını yapın; ardından ajan, araç çağrıları olmadan çalışır.

5. **Bu noktadan sonra darboğaz üst sistemdedir.** Yalın mod ve `supportsTools: false` sonrasında arka uç hâlâ yalnızca daha büyük OpenClaw çalıştırmalarında başarısız oluyorsa kalan sorun genellikle OpenClaw'ın aktarım katmanı değil, modelin veya sunucunun kendisidir: bağlam penceresi, GPU belleği, kv-cache tahliyesi ya da bir arka uç hatası.

## Sorun giderme

- **Gateway proxy'ye ulaşamıyor mu?** `curl http://127.0.0.1:1234/v1/models`.
- **LM Studio modeli bellekten kaldırılmış mı?** Yeniden yükleyin; soğuk başlatma, "takılmanın" yaygın bir nedenidir.
- **Yerel sunucu `terminated` veya `ECONNRESET` mı bildiriyor ya da dönüşün ortasında akışı kapatıyor mu?** OpenClaw, tanılamalarda düşük kardinaliteli bir `model.call.error.failureKind` değerini ve OpenClaw işleminin RSS/heap anlık görüntüsünü kaydeder. LM Studio/Ollama bellek baskısı için model sunucusunun sonlandırılıp sonlandırılmadığını doğrulamak üzere bu zaman damgasını sunucu günlüğüyle veya bir macOS çökme/jetsam günlüğüyle eşleştirin.
- **Bağlam hataları mı var?** OpenClaw, bağlam penceresi ön kontrol eşiklerini algılanan model penceresinden (veya `agents.defaults.contextTokens` bunu düşürdüğünde sınırlandırılmış pencereden) türetir; %20'nin altında en az **8k** eşiğiyle uyarır ve %10'un altında en az **4k** eşiğiyle kesin olarak engeller (aşırı büyük model meta verilerinin geçerli bir kullanıcı sınırını reddedememesi için etkin bağlam penceresiyle sınırlandırılır). `contextWindow` değerini düşürün veya sunucu/model bağlam sınırını yükseltin.
- **`messages[].content ... expected a string` mı görüyorsunuz?** İlgili model girdisine `compat.requiresStringContent: true` ekleyin.
- **`validation.keys` veya "message entries only allow `role` and `content`" mı görüyorsunuz?** İlgili model girdisine `compat.strictMessageKeys: true` ekleyin.
- **Doğrudan `/v1/chat/completions` çağrıları çalışıyor ancak `openclaw infer model run --local`, Gemma veya başka bir yerel modelde başarısız mı oluyor?** Önce sağlayıcı URL'sini, model referansını, kimlik doğrulama işaretçisini ve sunucu günlüklerini kontrol edin; `model run`, ajan araçlarını tamamen atlar. `model run` başarılı oluyor ancak daha büyük ajan dönüşleri başarısız oluyorsa araç yüzeyini `localModelLean` veya `compat.supportsTools: false` ile azaltın.
- **Araç çağrıları ham JSON/XML/ReAct metni olarak mı görünüyor veya sağlayıcı boş bir `tool_calls` dizisi mi döndürüyor?** Asistan metnini körü körüne araç çalıştırmaya dönüştüren bir proxy eklemeyin; önce sunucunun sohbet şablonunu/ayrıştırıcısını düzeltin. Model yalnızca araç kullanımı zorunlu kılındığında çalışıyorsa yukarıdaki `params.extra_body.tool_choice: "required"` geçersiz kılma ayarını ekleyin ve bu model girdisini yalnızca her dönüşte bir araç çağrısının beklendiği oturumlarda kullanın.
- **Güvenlik**: Yerel modeller, sağlayıcı tarafındaki filtreleri atlar. İstem enjeksiyonunun etki alanını sınırlamak için ajanların kapsamını dar tutun ve Compaction özelliğini açık bırakın.

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Model yük devretmesi](/tr/concepts/model-failover)
