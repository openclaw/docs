---
read_when:
    - Modelleri kendi GPU makinenizden sunmak istiyorsunuz
    - LM Studio veya OpenAI uyumlu bir proxy bağlıyorsunuz
    - En güvenli yerel model rehberliğine ihtiyacınız var
summary: OpenClaw'ı yerel LLM'lerde çalıştırın (LM Studio, vLLM, LiteLLM, özel OpenAI uç noktaları)
title: Yerel modeller
x-i18n:
    generated_at: "2026-05-02T22:19:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

Yerel modeller yapılabilir. Ancak donanım, bağlam boyutu ve istem enjeksiyonu savunması çıtasını da yükseltirler; küçük veya agresif biçimde nicemlenmiş kartlar bağlamı keser ve güvenliği zayıflatır. Bu sayfa, üst seviye yerel yığınlar ve özel OpenAI uyumlu yerel sunucular için görüşlü bir kılavuzdur. En az sürtünmeyle başlangıç için [LM Studio](/tr/providers/lmstudio) veya [Ollama](/tr/providers/ollama) ile başlayın ve `openclaw onboard` kullanın.

## Donanım alt sınırı

Yüksek hedefleyin: rahat bir agent döngüsü için **≥2 tam donanımlı Mac Studio veya eşdeğer bir GPU sistemi (~30 bin ABD doları+)**. Tek bir **24 GB** GPU yalnızca daha hafif istemlerde ve daha yüksek gecikmeyle işe yarar. Her zaman **barındırabileceğiniz en büyük / tam boyutlu varyantı** çalıştırın; küçük veya yoğun biçimde nicemlenmiş checkpoint'ler istem enjeksiyonu riskini artırır (bkz. [Güvenlik](/tr/gateway/security)).

## Bir arka uç seçin

| Arka uç                                             | Ne zaman kullanılır                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| [LM Studio](/tr/providers/lmstudio)                    | İlk yerel kurulum, GUI yükleyici, yerel Responses API                         |
| [Ollama](/tr/providers/ollama)                         | CLI iş akışı, model kitaplığı, müdahalesiz systemd servisi                    |
| MLX / vLLM / SGLang                                 | OpenAI uyumlu HTTP endpoint'iyle yüksek verimli kendi barındırdığınız sunum   |
| LiteLLM / OAI-proxy / özel OpenAI uyumlu proxy      | Başka bir model API'sinin önünde durur ve OpenClaw'ın onu OpenAI gibi ele almasını istersiniz |

Arka uç desteklediğinde Responses API (`api: "openai-responses"`) kullanın (LM Studio destekler). Aksi halde Chat Completions (`api: "openai-completions"`) kullanın.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA kullanıcıları:** Resmi Ollama Linux yükleyicisi, `Restart=always` ile bir systemd servisini etkinleştirir. WSL2 GPU kurulumlarında otomatik başlatma, önyükleme sırasında son modeli yeniden yükleyip ana makine belleğini sabitleyebilir. WSL2 VM'niz Ollama'yı etkinleştirdikten sonra tekrar tekrar yeniden başlıyorsa [WSL2 çökme döngüsü](/tr/providers/ollama#wsl2-crash-loop-repeated-reboots) bölümüne bakın.
</Warning>

## Önerilen: LM Studio + büyük yerel model (Responses API)

Güncel en iyi yerel yığın. LM Studio'da büyük bir model yükleyin (örneğin tam boyutlu bir Qwen, DeepSeek veya Llama derlemesi), yerel sunucuyu etkinleştirin (varsayılan `http://127.0.0.1:1234`) ve akıl yürütmeyi nihai metinden ayrı tutmak için Responses API kullanın.

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
- LM Studio'da **mevcut en büyük model derlemesini** indirin (“small”/yoğun biçimde nicemlenmiş varyantlardan kaçının), sunucuyu başlatın, `http://127.0.0.1:1234/v1/models` adresinin modeli listelediğini doğrulayın.
- `my-local-model` değerini LM Studio'da gösterilen gerçek model kimliğiyle değiştirin.
- Modeli yüklü tutun; soğuk yükleme başlangıç gecikmesi ekler.
- LM Studio derlemeniz farklıysa `contextWindow`/`maxTokens` değerlerini ayarlayın.
- WhatsApp için Responses API kullanmaya devam edin; böylece yalnızca nihai metin gönderilir.

Yerel çalıştırırken bile barındırılan modelleri yapılandırılmış tutun; yedeklerin kullanılabilir kalması için `models.mode: "merge"` kullanın.

### Karma yapılandırma: barındırılan birincil, yerel yedek

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

### Önce yerel, barındırılan güvenlik ağıyla

Birincil ve yedek sırasını değiştirin; yerel makine kapalıyken Sonnet veya Opus'a dönebilmek için aynı providers bloğunu ve `models.mode: "merge"` değerini koruyun.

### Bölgesel barındırma / veri yönlendirme

- Barındırılan MiniMax/Kimi/GLM varyantları, bölgeye sabitlenmiş endpoint'lerle (ör. ABD'de barındırılan) OpenRouter'da da bulunur. Anthropic/OpenAI yedekleri için `models.mode: "merge"` kullanmaya devam ederken trafiği seçtiğiniz yargı alanında tutmak için oradaki bölgesel varyantı seçin.
- Yalnızca yerel kullanım en güçlü gizlilik yoludur; barındırılan bölgesel yönlendirme, sağlayıcı özelliklerine ihtiyaç duyduğunuz ama veri akışı üzerinde kontrol istediğiniz orta yoldur.

## Diğer OpenAI uyumlu yerel proxy'ler

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy veya özel
Gateway'ler, OpenAI tarzı bir `/v1/chat/completions`
endpoint'i sunduklarında çalışır. Arka uç açıkça `/v1/responses`
desteğini belgelemedikçe Chat Completions bağdaştırıcısını kullanın. Yukarıdaki provider bloğunu kendi
endpoint ve model kimliğinizle değiştirin:

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
`openai-completions` kullanır. `127.0.0.1` gibi loopback endpoint'leri
otomatik olarak güvenilir kabul edilir; LAN, tailnet ve özel DNS endpoint'leri yine de
`request.allowPrivateNetwork: true` gerektirir.

`models.providers.<id>.models[].id` değeri provider'a yereldir. Buraya
provider önekini eklemeyin. Örneğin
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` ile başlatılan bir MLX sunucusu şu
katalog kimliğini ve model referansını kullanmalıdır:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Görüntü eklerinin agent dönüşlerine enjekte edilmesi için yerel veya proxy üzerinden sunulan görüntü modellerinde
`input: ["text", "image"]` ayarlayın. Etkileşimli özel provider
başlatma, yaygın görüntü modeli kimliklerini çıkarır ve yalnızca bilinmeyen adlar için soru sorar.
Etkileşimsiz başlatma aynı çıkarımı kullanır; bilinmeyen görüntü kimlikleri için `--custom-image-input`,
endpoint'inizin arkasında metin odaklı olan ve bilinen bir modele benzeyen adlar için
`--custom-text-input` kullanın.

Barındırılan modellerin yedek olarak kullanılabilir kalması için `models.mode: "merge"` değerini koruyun.
Yavaş yerel veya uzak model sunucuları için `agents.defaults.timeoutSeconds` değerini artırmadan önce
`models.providers.<id>.timeoutSeconds` kullanın. Provider zaman aşımı,
bağlantı, başlıklar, gövde akışı ve toplam korumalı getirme iptali dahil yalnızca model HTTP isteklerine uygulanır.

<Note>
Özel OpenAI uyumlu provider'lar için `baseUrl` loopback, özel LAN, `.local` veya yalın bir ana makine adına çözümlendiğinde `apiKey: "ollama-local"` gibi gizli olmayan bir yerel işaretin kalıcı olması kabul edilir. OpenClaw bunu eksik anahtar bildirmek yerine geçerli bir yerel kimlik bilgisi olarak ele alır. Genel ana makine adını kabul eden herhangi bir provider için gerçek bir değer kullanın.
</Note>

Yerel/proxy üzerinden sunulan `/v1` arka uçları için davranış notu:

- OpenClaw bunları yerel OpenAI endpoint'leri olarak değil, proxy tarzı OpenAI uyumlu rotalar olarak ele alır
- yerel OpenAI'ye özgü istek şekillendirme burada uygulanmaz: `service_tier` yok,
  Responses `store` yok, OpenAI akıl yürütme uyumluluğu payload
  şekillendirmesi yok ve istem önbelleği ipuçları yok
- gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`)
  bu özel proxy URL'lerine enjekte edilmez

Daha katı OpenAI uyumlu arka uçlar için uyumluluk notları:

- Bazı sunucular Chat Completions üzerinde yalnızca string `messages[].content` kabul eder,
  yapılandırılmış içerik parçası dizilerini kabul etmez. Bu endpoint'ler için
  `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
- Bazı yerel modeller metin olarak bağımsız köşeli parantezli araç istekleri yayar; örneğin
  `[tool_name]`, ardından JSON ve `[END_TOOL_REQUEST]`. OpenClaw bunları yalnızca ad, o dönüş için kayıtlı bir
  araçla tam olarak eşleştiğinde gerçek araç çağrılarına yükseltir; aksi halde blok desteklenmeyen metin olarak ele alınır ve
  kullanıcıya görünen yanıtlardan gizlenir.
- Bir model araç çağrısı gibi görünen JSON, XML veya ReAct tarzı metin yayarsa
  ancak provider yapılandırılmış bir çağrı yaymadıysa OpenClaw bunu metin olarak bırakır
  ve varsa çalışma kimliği, provider/model, algılanan desen ve
  araç adıyla bir uyarı kaydeder. Bunu tamamlanmış bir araç çalıştırması değil,
  provider/model araç çağrısı uyumsuzluğu olarak ele alın.
- Araçlar çalışmak yerine assistant metni olarak görünüyorsa; örneğin ham JSON,
  XML, ReAct sözdizimi veya provider yanıtında boş bir `tool_calls` dizisi varsa,
  önce sunucunun araç çağrısı yapabilen bir sohbet şablonu/ayrıştırıcısı kullandığını doğrulayın.
  Ayrıştırıcısı yalnızca araç kullanımı zorlandığında çalışan OpenAI uyumlu Chat Completions arka uçları için metin
  ayrıştırmaya güvenmek yerine model başına istek geçersiz kılması ayarlayın:

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
  `local/my-local-model` değerini `openclaw models list` tarafından gösterilen tam provider/model referansıyla değiştirin.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Özel OpenAI uyumlu bir model, yerleşik profilin ötesinde OpenAI akıl yürütme çabalarını kabul ediyorsa
  bunları model compat bloğunda bildirin. Buraya `"xhigh"` eklemek
  `/think xhigh`, oturum seçicileri, Gateway doğrulaması ve `llm-task`
  doğrulamasının bu yapılandırılmış provider/model referansı için düzeyi göstermesini sağlar:

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

Model sorunsuz yükleniyor ancak tam agent dönüşleri hatalı davranıyorsa yukarıdan aşağı çalışın; önce aktarımı doğrulayın, ardından yüzeyi daraltın.

1. **Yerel modelin kendisinin yanıt verdiğini doğrulayın.** Araç yok, ajan bağlamı yok:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway yönlendirmesini doğrulayın.** Yalnızca sağlanan istemi gönderir; transkripti, AGENTS önyüklemesini, context-engine derlemesini, araçları ve paketli MCP sunucularını atlar, ancak yine de Gateway yönlendirmesini, kimlik doğrulamayı ve sağlayıcı seçimini çalıştırır:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Yalın modu deneyin.** Her iki yoklama da geçerse ancak gerçek ajan turları hatalı biçimlendirilmiş araç çağrıları veya aşırı büyük istemlerle başarısız olursa `agents.defaults.experimental.localModelLean: true` ayarını etkinleştirin. Bu, istem biçiminin daha küçük ve daha az kırılgan olması için en ağır üç varsayılan aracı (`browser`, `cron`, `message`) kaldırır. Tam açıklama, ne zaman kullanılacağı ve açık olduğunun nasıl doğrulanacağı için [Deneysel Özellikler → Yerel model yalın modu](/tr/concepts/experimental-features#local-model-lean-mode) bölümüne bakın.

4. **Son çare olarak araçları tamamen devre dışı bırakın.** Yalın mod yeterli değilse, o model girdisi için `models.providers.<provider>.models[].compat.supportsTools: false` ayarını yapın. Ajan, bu modelde araç çağrıları olmadan çalışır.

5. **Bundan sonra darboğaz yukarı akıştadır.** Arka uç, yalın moddan ve `supportsTools: false` ayarından sonra yalnızca daha büyük OpenClaw çalıştırmalarında hâlâ başarısız oluyorsa, kalan sorun genellikle yukarı akış modeli veya sunucu kapasitesidir: bağlam penceresi, GPU belleği, kv-cache tahliyesi veya bir arka uç hatası. Bu noktada sorun OpenClaw'ın taşıma katmanı değildir.

## Sorun giderme

- Gateway proxy'ye erişebiliyor mu? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio modeli kaldırılmış mı? Yeniden yükleyin; soğuk başlatma yaygın bir “takılma” nedenidir.
- Yerel sunucu `terminated`, `ECONNRESET` diyor veya akışı turun ortasında kapatıyor mu?
  OpenClaw, tanılamalarda düşük kardinaliteli bir `model.call.error.failureKind` ile
  OpenClaw işlemi RSS/heap anlık görüntüsünü kaydeder. LM Studio/Ollama
  bellek baskısı için, model sunucusunun sonlandırılıp sonlandırılmadığını doğrulamak üzere
  bu zaman damgasını sunucu günlüğüyle veya macOS çökme /
  jetsam günlüğüyle eşleştirin.
- OpenClaw, bağlam penceresi ön kontrol eşiklerini algılanan model penceresinden veya `agents.defaults.contextTokens` etkin pencereyi düşürdüğünde sınırsız model penceresinden türetir. %20'nin altında **8k** tabanıyla uyarır. Katı engellemeler, **4k** tabanıyla %10 eşiğini kullanır ve etkin bağlam penceresiyle sınırlandırılır; böylece aşırı büyük model meta verileri, aksi halde geçerli olan bir kullanıcı sınırını reddedemez. Bu ön kontrole takılırsanız sunucu/model bağlam sınırını yükseltin veya daha büyük bir model seçin.
- Bağlam hataları mı var? `contextWindow` değerini düşürün veya sunucu sınırınızı yükseltin.
- OpenAI uyumlu sunucu `messages[].content ... expected a string` mı döndürüyor?
  Bu model girdisine `compat.requiresStringContent: true` ekleyin.
- Doğrudan küçük `/v1/chat/completions` çağrıları çalışıyor, ancak `openclaw infer model run --local`
  Gemma veya başka bir yerel modelde başarısız mı oluyor? Önce sağlayıcı URL'sini, model ref'ini, kimlik doğrulama
  işaretleyicisini ve sunucu günlüklerini kontrol edin; yerel `model run` ajan araçlarını içermez.
  Yerel `model run` başarılı olur ancak daha büyük ajan turları başarısız olursa, ajan
  araç yüzeyini `localModelLean` veya `compat.supportsTools: false` ile azaltın.
- Araç çağrıları ham JSON/XML/ReAct metni olarak mı görünüyor veya sağlayıcı
  boş bir `tool_calls` dizisi mi döndürüyor? Asistan metnini körü körüne araç yürütmeye
  dönüştüren bir proxy eklemeyin. Önce sunucu sohbet şablonunu/ayrıştırıcısını düzeltin. Model
  yalnızca araç kullanımı zorunlu kılındığında çalışıyorsa, yukarıdaki model başına
  `params.extra_body.tool_choice: "required"` geçersiz kılmasını ekleyin ve bu model
  girdisini yalnızca her turda bir araç çağrısının beklendiği oturumlar için kullanın.
- Güvenlik: yerel modeller sağlayıcı tarafı filtreleri atlar; istem enjeksiyonu etki alanını sınırlamak için ajanları dar kapsamlı ve Compaction'ı açık tutun.

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Model failover](/tr/concepts/model-failover)
