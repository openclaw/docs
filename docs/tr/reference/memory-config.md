---
read_when:
    - Bellek arama sağlayıcılarını veya gömme modellerini yapılandırmak istiyorsunuz
    - QMD arka ucunu kurmak istiyorsunuz
    - Hibrit aramayı, MMR'yi veya zamansal azalmayı ayarlamak istiyorsunuz
    - Çok modlu bellek indekslemeyi etkinleştirmek istiyorsunuz
sidebarTitle: Memory config
summary: Bellek araması, gömme sağlayıcıları, QMD, hibrit arama ve çok modlu indekslemeye yönelik tüm yapılandırma seçenekleri
title: Bellek yapılandırması referansı
x-i18n:
    generated_at: "2026-07-16T17:35:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1947d6d654de85059ef777a3a6387f6db5b76c8d688fbb539a063162d323c1f6
    source_path: reference/memory-config.md
    workflow: 16
---

Bu sayfa, OpenClaw bellek araması için tüm yapılandırma seçeneklerini listeler. Kavramsal genel bakışlar için bkz.:

<CardGroup cols={2}>
  <Card title="Belleğe genel bakış" href="/tr/concepts/memory">
    Belleğin çalışma biçimi.
  </Card>
  <Card title="Yerleşik motor" href="/tr/concepts/memory-builtin">
    Varsayılan SQLite arka ucu.
  </Card>
  <Card title="QMD motoru" href="/tr/concepts/memory-qmd">
    Önce yerel çalışan yardımcı süreç.
  </Card>
  <Card title="Bellek araması" href="/tr/concepts/memory-search">
    Arama işlem hattı ve ayarlama.
  </Card>
  <Card title="Active Memory" href="/tr/concepts/active-memory">
    Etkileşimli oturumlar için bellek alt aracısı.
  </Card>
</CardGroup>

Aksi belirtilmedikçe tüm bellek araması ayarları, `openclaw.json` içindeki `agents.defaults.memorySearch` altında (veya aracı başına bir `agents.list[].memorySearch` geçersiz kılması olarak) bulunur.

<Note>
**Active Memory** özellik anahtarını ve alt aracı yapılandırmasını arıyorsanız bunlar `memorySearch` yerine `plugins.entries.active-memory` altında bulunur.

Active Memory iki aşamalı bir geçit modeli kullanır:

1. Plugin etkinleştirilmeli ve geçerli aracı kimliğini hedeflemelidir
2. istek, uygun bir etkileşimli kalıcı sohbet oturumu olmalıdır

Etkinleştirme modeli, Plugin tarafından yönetilen yapılandırma, transkript kalıcılığı ve güvenli kullanıma alma düzeni için [Active Memory](/tr/concepts/active-memory) bölümüne bakın.
</Note>

---

## Sağlayıcı seçimi

| Anahtar        | Tür      | Varsayılan          | Açıklama                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | Bellek aramasını etkinleştirin veya devre dışı bırakın                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` veya `voyage` gibi bir gömme bağdaştırıcısı kimliği; ayrıca `api` değeri bir bellek gömme bağdaştırıcısına veya OpenAI uyumlu model API'sine işaret eden, yapılandırılmış bir `models.providers.<id>` olabilir |
| `model`    | `string`  | sağlayıcı varsayılanı | Gömme modeli adı                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | Birincil bağdaştırıcı başarısız olduğunda kullanılacak yedek bağdaştırıcı kimliği                                                                                                                                                                                                                                                  |

`provider` ayarlanmadığında OpenClaw, OpenAI gömmelerini kullanır. Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, yerel bir GGUF modeli veya OpenAI uyumlu bir `/v1/embeddings` uç noktası kullanmak için `provider`
değerini açıkça ayarlayın.
Hâlâ `provider: "auto"` belirten eski yapılandırmalar `openai` olarak çözümlenir.

<Warning>
Gömme sağlayıcısının, modelin, sağlayıcı ayarlarının, kaynakların, kapsamın,
parçalamanın veya belirteçleyicinin değiştirilmesi mevcut SQLite vektör dizinini uyumsuz hâle getirebilir.
OpenClaw, her şeyi otomatik olarak yeniden gömmek yerine vektör aramasını duraklatır
ve bir dizin kimliği uyarısı bildirir. Hazır olduğunuzda
`openclaw memory status --index --agent <id>` veya
`openclaw memory index --force --agent <id>` ile yeniden oluşturun.
</Warning>

`provider` ayarlanmamışsa, eski `provider: "auto"` mevcutsa veya
`provider: "none"` kasıtlı olarak yalnızca FTS modunu seçiyorsa gömmeler kullanılamadığında
bellekten geri çağırma yine de sözcüksel FTS sıralamasını kullanabilir.

Açıkça belirtilen yerel olmayan sağlayıcılar kapalı şekilde başarısız olur. `memorySearch.provider` değerini
Bedrock, DeepInfra, Gemini, GitHub Copilot, LM Studio, Mistral, Ollama, OpenAI,
Voyage veya OpenAI uyumlu özel bir sağlayıcı gibi uzak bir arka uca dayanan somut
bir sağlayıcıya ayarlarsanız ve bu sağlayıcı çalışma zamanında kullanılamazsa
`memory_search`, sessizce yalnızca FTS geri çağırmasını kullanmak yerine kullanılamıyor
sonucu döndürür. Sağlayıcı/kimlik doğrulama yapılandırmasını düzeltin, erişilebilir
bir sağlayıcıya geçin veya yalnızca FTS geri çağırmasını bilinçli olarak kullanmak
istiyorsanız `provider: "none"` değerini ayarlayın.

### Özel sağlayıcı kimlikleri

`memorySearch.provider`, `ollama` gibi belleğe özgü sağlayıcı bağdaştırıcıları veya `openai-responses` / `openai-completions` gibi OpenAI uyumlu model API'leri için özel bir `models.providers.<id>` girdisine işaret edebilir. OpenClaw; uç nokta, kimlik doğrulama ve model öneki işlemleri için özel sağlayıcı kimliğini korurken gömme bağdaştırıcısı için bu sağlayıcının `api` sahibini çözümler. Bu, çoklu GPU veya çoklu ana makine kurulumlarının bellek gömmeleri için belirli bir yerel uç noktayı tahsis etmesini sağlar:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### API anahtarı çözümleme

Uzak gömmeler bir API anahtarı gerektirir. Bedrock bunun yerine AWS SDK varsayılan kimlik bilgisi zincirini kullanır (örnek rolleri, SSO, erişim anahtarları veya bir Bedrock API anahtarı).

| Sağlayıcı       | Ortam değişkeni                                             | Yapılandırma anahtarı                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS kimlik bilgisi zinciri veya `AWS_BEARER_TOKEN_BEDROCK` | API anahtarı gerekmez                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Cihazla oturum açma aracılığıyla kimlik doğrulama profili       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (yer tutucu)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth yalnızca sohbet/tamamlama işlemlerini kapsar ve gömme isteklerini karşılamaz.
</Note>

---

## Uzak uç nokta yapılandırması

Genel OpenAI sohbet kimlik bilgilerini devralmaması gereken, OpenAI uyumlu genel
bir `/v1/embeddings` sunucusu için `provider: "openai-compatible"` kullanın.

<ParamField path="remote.baseUrl" type="string">
  Özel API temel URL'si.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API anahtarını geçersiz kılar.
</ParamField>
<ParamField path="remote.headers" type="object">
  Ek HTTP üst bilgileri (sağlayıcı varsayılanlarıyla birleştirilir).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Sağlayıcıya özgü yapılandırma

<AccordionGroup>
  <Accordion title="Gemini">
    | Anahtar                    | Tür     | Varsayılan                | Açıklama                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` değerini de destekler |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 için: 768, 1536 veya 3072        |

    <Warning>
    Modelin veya `outputDimensionality` değerinin değiştirilmesi dizin kimliğini değiştirir. OpenClaw,
    bellek dizinini açıkça yeniden oluşturana kadar vektör aramasını duraklatır.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI uyumlu girdi türleri">
    OpenAI uyumlu gömme uç noktaları, sağlayıcıya özgü `input_type` istek alanlarını kullanmayı seçebilir. Bu, sorgu ve belge gömmeleri için farklı etiketler gerektiren asimetrik gömme modellerinde kullanışlıdır.

    | Anahtar                 | Tür     | Varsayılan | Açıklama                                             |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | ayarlanmamış   | Sorgu ve belge gömmeleri için paylaşılan `input_type`   |
    | `queryInputType`    | `string` | ayarlanmamış   | Sorgu zamanı `input_type`; `inputType` değerini geçersiz kılar          |
    | `documentInputType` | `string` | ayarlanmamış   | Dizin/belge `input_type`; `inputType` değerini geçersiz kılar      |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Bu değerlerin değiştirilmesi, sağlayıcının toplu dizinlemesi için gömme önbelleği kimliğini etkiler ve üst akış modeli etiketleri farklı şekilde işliyorsa ardından belleğin yeniden dizinlenmesi gerekir.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock gömme yapılandırması

    Bedrock, AWS SDK varsayılan kimlik bilgisi zincirine ek olarak OpenClaw tarafından denetlenen bir bearer belirteci kullanır; bu nedenle yapılandırmada hiçbir API anahtarı saklanmaz. OpenClaw, Bedrock özellikli bir örnek rolüyle EC2 üzerinde çalışıyorsa yalnızca sağlayıcıyı ve modeli ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | Anahtar                    | Tür     | Varsayılan                        | Açıklama                     |
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Herhangi bir Bedrock gömme modeli kimliği  |
    | `outputDimensionality` | `number` | model varsayılanı                  | Titan V2 için: 256, 512 veya 1024 |

    **Desteklenen modeller** (aile algılama ve boyut varsayılanlarıyla):

    | Model Kimliği                                | Sağlayıcı  | Varsayılan Boyutlar | Yapılandırılabilir Boyutlar |
    | ------------------------------------------- | ---------- | ------------------- | --------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                          |

    Aktarım hızı son ekli varyantlar (ör. `amazon.titan-embed-text-v1:2:8k`) ve bölge ön ekli çıkarım profili kimlikleri (ör. `us.amazon.titan-embed-text-v2:0`), temel modelin yapılandırmasını devralır.

    **Bölge:** şu sırayla çözümlenir: `memorySearch.remote.baseUrl` geçersiz kılması, `models.providers.amazon-bedrock.baseUrl` yapılandırması, `AWS_REGION`, `AWS_DEFAULT_REGION`, ardından varsayılan olarak `us-east-1`.

    **Kimlik doğrulama:** OpenClaw önce `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` veya `AWS_BEARER_TOKEN_BEDROCK` değerlerini denetler, ardından standart AWS SDK varsayılan kimlik bilgisi sağlayıcı zincirine geçer:

    1. Ortam değişkenleri (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), ancak `AWS_PROFILE` da ayarlanmışsa kullanılmaz
    2. SSO (yalnızca SSO alanları yapılandırıldığında)
    3. Paylaşılan kimlik bilgileri ve yapılandırma dosyaları (`fromIni`, `AWS_PROFILE` dâhil)
    4. Kimlik bilgisi işlemi (AWS yapılandırma dosyasındaki `credential_process`)
    5. Web kimliği belirteci kimlik bilgileri
    6. ECS veya EC2 bulut sunucusu meta veri kimlik bilgileri

    **IAM izinleri:** IAM rolü veya kullanıcısı şunlara ihtiyaç duyar:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    En az ayrıcalık için `InvokeModel` kapsamını belirli modelle sınırlandırın:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Yerel (GGUF + llama.cpp)">
    | Anahtar               | Tür                | Varsayılan              | Açıklama                                                                                                                                                                                                                                                                                                              |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | otomatik indirilir      | GGUF model dosyasının yolu                                                                                                                                                                                                                                                                                            |
    | `local.modelCacheDir` | `string`           | node-llama-cpp varsayılanı | İndirilen modellerin önbellek dizini                                                                                                                                                                                                                                                                               |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Gömme bağlamının bağlam penceresi boyutu. 4096, ağırlık dışı VRAM kullanımını sınırlarken tipik parçaları (128-512 belirteç) kapsar. Kaynakları kısıtlı ana makinelerde 1024-2048 değerine düşürün. `"auto"`, modelin eğitilmiş maksimumunu kullanır; 8B+ modeller için önerilmez (Qwen3-Embedding-8B: 40 960 belirtece kadar çıkılması VRAM kullanımını ~32 GB düzeyine yükseltebilir). |

    Önce resmî llama.cpp sağlayıcısını yükleyin: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Varsayılan model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, otomatik indirilir). Kaynak kod kullanıma almaları yine de yerel derleme onayı gerektirir: `pnpm approve-builds`, ardından `pnpm rebuild node-llama-cpp`.

    Gateway'in kullandığı sağlayıcı yolunun aynısını doğrulamak için bağımsız CLI'yi kullanın:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Sayısal `local.contextSize` değerleri, model ağırlıkları ile istenen gömme bağlamının birlikte sığdırılması için node-llama-cpp'nin otomatik GPU katmanı yerleşimini de yönlendirir. `openclaw memory status --deep`, çalışma zamanı yüklendikten sonra bilinen son llama.cpp arka ucunu, cihazı, boşaltmayı, istenen bağlamı ve zaman damgalı bellek bilgilerini bildirir; pasif durum denetimi bir model yüklemez.

    Yerel GGUF gömmeleri için `provider: "local"` değerini açıkça ayarlayın. `hf:` ve HTTP(S) model başvuruları, açık yerel yapılandırmalarda (node-llama-cpp'nin model çözümlemesi aracılığıyla) desteklenir ancak varsayılan sağlayıcıyı değiştirmez.

  </Accordion>
</AccordionGroup>

### Satır içi gömme zaman aşımı

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Bellek indeksleme sırasında satır içi gömme gruplarının zaman aşımını geçersiz kılın.

Ayarlanmamışsa sağlayıcı varsayılanı kullanılır: `local`, `ollama` ve `lmstudio` gibi yerel/kendi kendine barındırılan sağlayıcılar için 600 saniye, barındırılan sağlayıcılar için 120 saniye. Yerel CPU'ya bağlı gömme grupları sağlıklı ancak yavaş olduğunda bu değeri artırın.
</ParamField>

---

## İndeksleme davranışı

Aksi belirtilmedikçe tümü `memorySearch.sync` altındadır:

| Anahtar                        | Tür       | Varsayılan | Açıklama                                                              |
| ------------------------------ | --------- | ---------- | --------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | Bir oturum başladığında bellek indeksini eşitle                        |
| `onSearch`                     | `boolean` | `true`  | İçerik değişikliklerini algıladıktan sonra arama sırasında tembelce eşitle |
| `watch`                        | `boolean` | `true`  | Bellek dosyalarını izle (chokidar) ve değişikliklerde yeniden indekslemeyi zamanla |
| `watchDebounceMs`              | `number`  | `1500`  | Hızlı dosya izleme olaylarını birleştirmek için bekletme penceresi     |
| `intervalMinutes`              | `number`  | `0`     | Dakika cinsinden dönemsel yeniden indeksleme aralığı (`0` devre dışı bırakır) |
| `sessions.postCompactionForce` | `boolean` | `true`  | Compaction tarafından tetiklenen transkript güncellemelerinden sonra oturumu zorla yeniden indeksle |

<ParamField path="chunking.tokens" type="number">
  Gömme öncesinde bellek kaynaklarını bölerken kullanılan belirteç cinsinden parça boyutu (varsayılan: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Bölme sınırlarının yakınındaki bağlamı korumak için bitişik parçalar arasındaki belirteç örtüşmesi (varsayılan: 80).
</ParamField>

<Note>
`chunking.tokens` veya `chunking.overlap` değerinin değiştirilmesi parça sınırlarını değiştirir ve mevcut indeks kimliğini geçersiz kılar (Sağlayıcı seçimi altındaki Uyarıya bakın).
</Note>

---

## Hibrit arama yapılandırması

Tümü `memorySearch.query` altındadır:

| Anahtar      | Tür      | Varsayılan | Açıklama                                      |
| ------------ | -------- | ---------- | --------------------------------------------- |
| `maxResults` | `number` | `6`     | Enjeksiyondan önce döndürülen azami bellek eşleşmesi |
| `minScore`   | `number` | `0.35`  | Bir eşleşmeyi dâhil etmek için gereken asgari alaka puanı |

Ayrıca `memorySearch.query.hybrid` altında:

| Anahtar               | Tür       | Varsayılan | Açıklama                            |
| --------------------- | --------- | ---------- | ----------------------------------- |
| `enabled`             | `boolean` | `true`  | Hibrit BM25 + vektör aramasını etkinleştir |
| `vectorWeight`        | `number`  | `0.7`   | Vektör puanlarının ağırlığı (0-1)   |
| `textWeight`          | `number`  | `0.3`   | BM25 puanlarının ağırlığı (0-1)     |
| `candidateMultiplier` | `number`  | `4`     | Aday havuzu boyutu çarpanı           |

<Tabs>
  <Tab title="MMR (çeşitlilik)">
    | Anahtar       | Tür       | Varsayılan | Açıklama                              |
    | ------------- | --------- | ---------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | MMR yeniden sıralamasını etkinleştir  |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = azami çeşitlilik, 1 = azami alaka |
  </Tab>
  <Tab title="Zamansal azalma (güncellik)">
    | Anahtar                      | Tür       | Varsayılan | Açıklama                         |
    | ---------------------------- | --------- | ---------- | -------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Güncellik artışını etkinleştir   |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Puan her N günde yarıya iner     |

    Kalıcı dosyalara (`MEMORY.md`, `memory/` içindeki tarihsiz dosyalar) hiçbir zaman azalma uygulanmaz.

  </Tab>
</Tabs>

### Tam örnek

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Ek bellek yolları

| Anahtar      | Tür        | Açıklama                                  |
| ------------ | ---------- | ----------------------------------------- |
| `extraPaths` | `string[]` | İndekslenecek ek dizinler veya dosyalar   |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Yollar mutlak veya çalışma alanına göreli olabilir. Dizinler `.md` dosyaları için özyinelemeli olarak taranır. Sembolik bağlantıların işlenmesi etkin arka uca bağlıdır: yerleşik altyapı sembolik bağlantıları atlarken QMD, temel QMD tarayıcısının davranışını izler.

Ajan kapsamlı, ajanlar arası transkript araması için `memory.qmd.paths` yerine `agents.list[].memorySearch.qmd.extraCollections` kullanın. Bu ek koleksiyonlar aynı `{ path, name, pattern? }` biçimini izler ancak ajan başına birleştirilir ve yol geçerli çalışma alanının dışını gösterdiğinde açıkça belirtilmiş paylaşılan adları koruyabilir. Çözümlenen aynı yol hem `memory.qmd.paths` hem de `memorySearch.qmd.extraCollections` içinde görünürse QMD ilk girdiyi tutar ve yinelenen girdiyi atlar.

---

## Çok modlu bellek (Gemini)

Gemini Embedding 2 kullanarak Markdown ile birlikte görüntüleri ve sesleri indeksleyin:

| Anahtar                       | Tür       | Varsayılan    | Açıklama                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Çok modlu indekslemeyi etkinleştir             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` veya `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | İndekslenecek en büyük dosya boyutu (10 MiB)    |

<Note>
Yalnızca `extraPaths` içindeki dosyalar için geçerlidir. Varsayılan bellek kökleri yalnızca Markdown olarak kalır. `gemini-embedding-2-preview` gerektirir. `fallback`, `"none"` olmalıdır.
</Note>

Desteklenen biçimler: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (görüntüler); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ses).

---

## Gömme önbelleği

| Anahtar                | Tür      | Varsayılan | Açıklama                                  |
| ------------------ | --------- | ------- | -------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | Parça gömmelerini SQLite'ta önbelleğe al             |
| `cache.maxEntries` | `number`  | ayarlanmamış   | Önbelleğe alınmış gömmeler için yaklaşık üst sınır |

Yeniden indeksleme veya transkript güncellemeleri sırasında değişmemiş metnin yeniden gömülmesini önler. Sınırsız bir önbellek için `maxEntries` değerini ayarlamadan bırakın; disk büyümesi, en yüksek yeniden indeksleme hızından daha önemliyse bu değeri ayarlayın. Ayarlandığında, önbellek sınırı aştığı anda en eski girdiler (son güncellenme zamanına göre) önce budanır.

---

## Toplu indeksleme

| Anahtar                           | Tür      | Varsayılan | Açıklama                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Paralel satır içi gömmeler |
| `remote.batch.enabled`        | `boolean` | `false` | Toplu gömme API'sini etkinleştir |
| `remote.batch.concurrency`    | `number`  | `2`     | Paralel toplu işler        |
| `remote.batch.wait`           | `boolean` | `true`  | Toplu işlemin tamamlanmasını bekle  |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | Yoklama aralığı              |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | Toplu işlem zaman aşımı              |

`gemini`, `openai` ve `voyage` için kullanılabilir. OpenAI toplu işlemi, büyük geriye dönük doldurmalar için genellikle en hızlı ve en ucuz seçenektir.

`remote.nonBatchConcurrency`, yerel/kendi kendine barındırılan sağlayıcıların ve sağlayıcı toplu işlem API'leri etkin olmadığında barındırılan sağlayıcıların kullandığı satır içi gömme çağrılarını denetler. Daha küçük yerel ana makineleri aşırı yüklememek için Ollama, toplu olmayan indekslemede varsayılan olarak `1` kullanır; daha büyük makinelerde daha yüksek bir değer ayarlayın.

Bu, satır içi gömme çağrılarının zaman aşımını denetleyen `sync.embeddingBatchTimeoutSeconds` ayarından ayrıdır.

---

## Oturum belleği araması (deneysel)

Oturum transkriptlerini indeksleyin ve `memory_search` aracılığıyla sunun:

| Anahtar                           | Tür       | Varsayılan      | Açıklama                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Oturum indekslemeyi etkinleştir                 |
| `sources`                     | `string[]` | `["memory"]` | Transkriptleri dahil etmek için `"sessions"` ekleyin |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Yeniden indeksleme için bayt eşiği              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Yeniden indeksleme için ileti eşiği           |

<Warning>
Oturum indeksleme isteğe bağlıdır ve eşzamansız çalışır. Sonuçlar biraz güncelliğini yitirmiş olabilir. Oturum günlükleri diskte bulunduğundan, dosya sistemi erişimini güven sınırı olarak değerlendirin.
</Warning>

Oturum transkripti eşleşmeleri ayrıca
[`tools.sessions.visibility`](/tr/gateway/config-tools#toolssessions) ayarına uyar. Varsayılan
`tree` görünürlüğü yalnızca mevcut oturumu ve onun oluşturduğu oturumları gösterir. Farklı bir
oturumdan, örneğin bir DM'den, aynı aracıya ait ilgisiz ve gateway tarafından gönderilmiş bir oturumu
hatırlamak için görünürlüğü bilinçli olarak `agent` değerine genişletin (veya yalnızca
aracılar arası hatırlama da gerekliyken ve aracılar arası politika buna izin veriyorsa `all` değerine).

Aşağıdaki örnekler bu ayarları `agents.defaults` altına yerleştirir. Yalnızca bir
aracının oturum transkriptlerini indeksleyip araması gerekiyorsa, aracı başına geçersiz kılmada eşdeğer
`memorySearch` ayarlarını da uygulayabilirsiniz.

Aynı aracıda gateway'den DM'e hatırlama için:

<Tabs>
  <Tab title="Yerleşik arka uç">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="QMD arka ucu">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

QMD kullanılırken `agents.defaults.memorySearch.experimental.sessionMemory` ve
`sources: ["sessions"]` tek başlarına transkriptleri QMD'ye dışa aktarmaz. Ayrıca
`memory.qmd.sessions.enabled: true` ayarını da yapın.

---

## SQLite vektör hızlandırması (sqlite-vec)

| Anahtar                          | Tür      | Varsayılan | Açıklama                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Vektör sorguları için sqlite-vec kullan |
| `store.vector.extensionPath` | `string`  | paketle birlikte gelir | sqlite-vec yolunu geçersiz kıl          |

sqlite-vec kullanılamadığında OpenClaw otomatik olarak işlem içi kosinüs benzerliğine geri döner.

---

## İndeks depolama

Yerleşik bellek indeksleri, her aracının OpenClaw SQLite veritabanında
`agents/<agentId>/agent/openclaw-agent.sqlite` konumunda bulunur.

| Anahtar                   | Tür     | Varsayılan     | Açıklama                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5 belirteçleştiricisi (`unicode61` veya `trigram`) |

---

## QMD arka uç yapılandırması

Etkinleştirmek için `memory.backend = "qmd"` ayarını yapın. Tüm QMD ayarları `memory.qmd` altında bulunur:

| Anahtar                      | Tür      | Varsayılan  | Açıklama                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD yürütülebilir dosya yolu; hizmet `PATH` kabuğunuzdan farklıysa mutlak bir yol ayarlayın |
| `searchMode`             | `string`  | `search` | Arama komutu: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --       | QMD yeniden sıralamasını atlamak için `searchMode: "query"` ve QMD 2.1+ ile `false` olarak ayarlayın          |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` öğelerini otomatik indeksle                                             |
| `paths[]`                | `array`   | --       | Ek yollar: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | Oturum transkriptlerini QMD'ye dışa aktar                                                   |
| `sessions.retentionDays` | `number`  | --       | Transkript saklama süresi                                                                  |
| `sessions.exportDir`     | `string`  | --       | Dışa aktarma dizini                                                                      |

`searchMode: "search"` yalnızca sözcüksel/BM25'tir. OpenClaw, `memory status --deep` sırasında da dahil olmak üzere bu mod için anlamsal vektör hazır olma yoklamalarını veya QMD gömme bakımını çalıştırmaz; `vsearch` ve `query`, QMD vektör hazırlığını ve gömmeleri gerektirmeye devam eder.

`rerank: false` yalnızca QMD `query` modunu değiştirir ve QMD 2.1 veya daha yeni bir sürüm gerektirir. Doğrudan CLI modunda OpenClaw, `--no-rerank` iletir; mcporter destekli MCP modunda ise QMD'nin birleşik sorgu aracına `rerank: false` iletir. QMD'nin varsayılan sorgu yeniden sıralama davranışını kullanmak için ayarlamadan bırakın.

OpenClaw, güncel QMD koleksiyonu ve MCP sorgu biçimlerini tercih eder ancak gerektiğinde uyumlu koleksiyon kalıbı bayraklarını ve eski MCP araç adlarını deneyerek eski QMD sürümlerinin çalışmasını sürdürür. QMD birden fazla koleksiyon filtresi desteği sunduğunda, aynı kaynaktaki koleksiyonlar tek bir QMD işlemiyle aranır; eski QMD derlemeleri koleksiyon başına uyumluluk yolunu korur. Aynı kaynak, kalıcı bellek koleksiyonlarının (varsayılan bellek dosyaları ile özel yollar) birlikte gruplandırılması anlamına gelir; oturum transkripti koleksiyonları ise kaynak çeşitlendirmesinin her iki girdiyi de koruması için ayrı bir grup olarak kalır.

<Note>
QMD model geçersiz kılmaları OpenClaw yapılandırmasında değil, QMD tarafında kalır. QMD'nin modellerini genel olarak geçersiz kılmanız gerekiyorsa gateway çalışma zamanı ortamında `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` ve `QMD_GENERATE_MODEL` gibi ortam değişkenlerini ayarlayın.
</Note>

### mcporter entegrasyonu

Tümü `memory.qmd.mcporter` altında bulunur. QMD aramalarını sorgu başına `qmd` oluşturmak yerine uzun ömürlü bir `mcporter` MCP daemon'ı üzerinden yönlendirerek daha büyük modellerde soğuk başlatma yükünü azaltır.

| Anahtar           | Tür      | Varsayılan | Açıklama                                                            |
| ------------- | --------- | ------- | ---------------------------------------------------------------------- |
| `enabled`     | `boolean` | `false` | İstek başına `qmd` oluşturmak yerine QMD çağrılarını mcporter üzerinden yönlendir |
| `serverName`  | `string`  | `qmd`   | `lifecycle: keep-alive` ile `qmd mcp` çalıştıran mcporter sunucu adı  |
| `startDaemon` | `boolean` | `true`  | `enabled` true olduğunda mcporter daemon'ını otomatik olarak başlat         |

`mcporter` öğesinin kurulu ve PATH üzerinde olmasını, ayrıca `qmd mcp` çalıştıran yapılandırılmış bir mcporter sunucusunu gerektirir. Sorgu başına işlem oluşturma maliyetinin kabul edilebilir olduğu daha basit yerel kurulumlarda devre dışı bırakın.

<AccordionGroup>
  <Accordion title="Güncelleme zamanlaması">
    | Anahtar                       | Tür      | Varsayılan | Açıklama                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Yenileme aralığı                      |
    | `update.debounceMs`       | `number`  | `15000` | Dosya değişiklikleri için bekleme uygula                 |
    | `update.onBoot`           | `boolean` | `true`  | Uzun ömürlü QMD yöneticisi açıldığında yenile; anında başlangıç güncellemesini atlamak için false olarak ayarlayın |
    | `update.startup`          | `string`  | `off`   | İsteğe bağlı Gateway başlangıcı QMD ilklendirmesi: `off`, `idle` veya `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` yenilemesi çalışmadan önceki gecikme |
    | `update.waitForBootSync`  | `boolean` | `false` | İlk yenilemesi tamamlanana kadar yöneticinin açılmasını engelle |
    | `update.embedInterval`    | `string`  | `60m`   | Ayrı gömme sıklığı                |
    | `update.commandTimeoutMs` | `number`  | `30000` | QMD bakım komutları (koleksiyon listeleme/ekleme) için zaman aşımı |
    | `update.updateTimeoutMs`  | `number`  | `120000` | Her `qmd update` döngüsü için zaman aşımı   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | Her `qmd embed` döngüsü için zaman aşımı    |
  </Accordion>
  <Accordion title="Sınırlar">
    | Anahtar                       | Tür     | Varsayılan | Açıklama                |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | Azami arama sonucu         |
    | `limits.maxSnippetChars`  | `number` | `450`   | Parçacık uzunluğunu sınırla       |
    | `limits.maxInjectedChars` | `number` | `2200`  | Eklenen toplam karakter sayısını sınırla |
    | `limits.timeoutMs`        | `number` | `4000`  | `memory_search` dahil, QMD destekli arama sırasında QMD komutunun zaman aşımı; kurulum, eşitleme, yerleşik yedek yöntem ve ek çalışmalar varsayılan araç süresini korur |
  </Accordion>
  <Accordion title="Kapsam">
    Hangi oturumların QMD arama sonuçlarını alabileceğini denetler. [`session.sendPolicy`](/tr/gateway/config-agents#session) ile aynı şemayı kullanır:

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    Sunulan varsayılan ayar yalnızca DM/doğrudan mesajlara izin verir; grupları ve diğer kanal türlerini reddeder. `match.keyPrefix` normalleştirilmiş oturum anahtarıyla eşleşir; `match.rawKeyPrefix`, `agent:<id>:` dahil ham anahtarla eşleşir.

  </Accordion>
  <Accordion title="Atıflar">
    `memory.citations` tüm arka uçlar için geçerlidir:

    | Değer            | Davranış                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (varsayılan) | Parçacıklara `Source: <path#line>` alt bilgisini ekle    |
    | `on`             | Alt bilgiyi her zaman ekle                               |
    | `off`            | Alt bilgiyi atla (yol yine de dahili olarak agente iletilir) |

  </Accordion>
</AccordionGroup>

Gateway başlangıcı QMD ilklendirmesi etkinleştirildiğinde OpenClaw, QMD'yi yalnızca uygun agentler için başlatır. `update.onBoot` true ise ve hiçbir aralık/gömme bakımı yapılandırılmamışsa başlangıç, açılış yenilemesi için tek seferlik bir yönetici kullanır ve ardından yöneticiyi kapatır. Bir güncelleme veya gömme aralığı yapılandırılmışsa başlangıç, izleyiciyi ve aralık zamanlayıcılarını yönetebilmesi için uzun ömürlü QMD yöneticisini açar; `update.onBoot: false` yalnızca anında açılış yenilemesini atlar.

### Tam QMD örneği

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming, `agents.defaults.memorySearch` altında değil, `plugins.entries.memory-core.config.dreaming` altında yapılandırılır.

Dreaming, zamanlanmış tek bir tarama olarak çalışır ve dahili hafif/derin/REM aşamalarını uygulama ayrıntısı olarak kullanır.

Kavramsal davranış ve eğik çizgi komutları için [Dreaming](/tr/concepts/dreaming) sayfasına bakın.

### Kullanıcı ayarları

| Anahtar                                    | Tür      | Varsayılan       | Açıklama                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Dreaming'i tamamen etkinleştirir veya devre dışı bırakır                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Tam Dreaming taraması için isteğe bağlı Cron sıklığı                                                                                |
| `model`                                | `string`  | varsayılan model | İsteğe bağlı Dream Diary alt agenti model geçersiz kılma ayarı                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | `MEMORY.md` içine yükseltilen her kısa süreli hatırlama parçacığından tutulan tahmini azami token sayısı; köken meta verileri görünür kalır |

### Örnek

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming, makine durumunu `memory/.dreams/` konumuna yazar.
- Dreaming, insan tarafından okunabilir anlatı çıktısını `DREAMS.md` konumuna (veya mevcut `dreams.md` konumuna) yazar.
- `dreaming.model` mevcut Plugin alt agenti güven kapısını kullanır; etkinleştirmeden önce `plugins.entries.memory-core.subagent.allowModelOverride: true` değerini ayarlayın.
- Yapılandırılan model kullanılamadığında Dream Diary, oturumun varsayılan modeliyle bir kez daha dener. Güven veya izin listesi hataları günlüğe kaydedilir ve sessizce yeniden denenmez.
- Hafif/derin/REM aşaması ilkesi ve eşikleri, kullanıcıya yönelik yapılandırma değil, dahili davranıştır.

</Note>

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
