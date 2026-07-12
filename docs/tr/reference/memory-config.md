---
read_when:
    - Bellek arama sağlayıcılarını veya gömme modellerini yapılandırmak istiyorsunuz
    - QMD arka ucunu kurmak istiyorsunuz
    - Hibrit aramayı, MMR'yi veya zamansal azalmayı ayarlamak istiyorsunuz
    - Çok modlu bellek indekslemeyi etkinleştirmek istiyorsunuz
sidebarTitle: Memory config
summary: Bellek araması, gömme sağlayıcıları, QMD, hibrit arama ve çok modlu indeksleme için tüm yapılandırma seçenekleri
title: Bellek yapılandırması başvurusu
x-i18n:
    generated_at: "2026-07-12T12:45:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
    source_path: reference/memory-config.md
    workflow: 16
---

Bu sayfa, OpenClaw bellek aramasına yönelik tüm yapılandırma seçeneklerini listeler. Kavramsal genel bakışlar için bkz.:

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

Aksi belirtilmedikçe tüm bellek araması ayarları `openclaw.json` dosyasında `agents.defaults.memorySearch` altında (veya aracı başına `agents.list[].memorySearch` geçersiz kılması olarak) bulunur.

<Note>
**Active Memory** özelliğinin etkinleştirme anahtarını ve alt aracı yapılandırmasını arıyorsanız bunlar `memorySearch` yerine `plugins.entries.active-memory` altında bulunur.

Active Memory iki kapılı bir model kullanır:

1. Plugin etkinleştirilmiş olmalı ve geçerli aracı kimliğini hedeflemelidir
2. istek, uygun bir etkileşimli kalıcı sohbet oturumu olmalıdır

Etkinleştirme modeli, Plugin tarafından yönetilen yapılandırma, transkript kalıcılığı ve güvenli kullanıma alma düzeni için [Active Memory](/tr/concepts/active-memory) bölümüne bakın.
</Note>

---

## Sağlayıcı seçimi

| Anahtar    | Tür       | Varsayılan              | Açıklama                                                                                                                                                                                                                                                                                                                            |
| ---------- | --------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`                  | Bellek aramasını etkinleştirir veya devre dışı bırakır                                                                                                                                                                                                                                                                              |
| `provider` | `string`  | `"openai"`              | `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` veya `voyage` gibi gömme bağdaştırıcısı kimliği; `api` değeri bir bellek gömme bağdaştırıcısını veya OpenAI uyumlu model API'sini gösteren yapılandırılmış bir `models.providers.<id>` de olabilir |
| `model`    | `string`  | sağlayıcı varsayılanı   | Gömme modeli adı                                                                                                                                                                                                                                                                                                                     |
| `fallback` | `string`  | `"none"`                | Birincil sağlayıcı başarısız olduğunda kullanılacak yedek bağdaştırıcı kimliği                                                                                                                                                                                                                                                       |

`provider` ayarlanmadığında OpenClaw, OpenAI gömmelerini kullanır. Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama, Voyage, yerel bir GGUF modeli veya OpenAI uyumlu bir `/v1/embeddings` uç noktası kullanmak için `provider` değerini açıkça ayarlayın. Hâlâ `provider: "auto"` kullanan eski yapılandırmalar `openai` olarak çözümlenir.

<Warning>
Gömme sağlayıcısını, modeli, sağlayıcı ayarlarını, kaynakları, kapsamı, parçalara ayırmayı veya belirteç oluşturucuyu değiştirmek, mevcut SQLite vektör dizinini uyumsuz hâle getirebilir. OpenClaw her şeyi otomatik olarak yeniden gömmek yerine vektör aramasını duraklatır ve bir dizin kimliği uyarısı bildirir. Hazır olduğunuzda `openclaw memory status --index --agent <id>` veya `openclaw memory index --force --agent <id>` komutuyla yeniden oluşturun.
</Warning>

`provider` ayarlanmadığında, eski `provider: "auto"` bulunduğunda veya `provider: "none"` bilerek yalnızca FTS modunu seçtiğinde, gömmeler kullanılamasa bile bellekten geri çağırma sözcüksel FTS sıralamasını kullanabilir.

Açıkça belirtilen yerel olmayan sağlayıcılar hata durumunda kapalı kalır. `memorySearch.provider` değerini Bedrock, DeepInfra, Gemini, GitHub Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage veya OpenAI uyumlu özel bir sağlayıcı gibi somut ve uzak destekli bir sağlayıcıya ayarlarsanız ve bu sağlayıcı çalışma zamanında kullanılamıyorsa `memory_search`, sessizce yalnızca FTS tabanlı geri çağırmayı kullanmak yerine kullanılamıyor sonucu döndürür. Sağlayıcı/kimlik doğrulama yapılandırmasını düzeltin, erişilebilir bir sağlayıcıya geçin veya bilinçli olarak yalnızca FTS tabanlı geri çağırma istiyorsanız `provider: "none"` ayarını kullanın.

### Özel sağlayıcı kimlikleri

`memorySearch.provider`, `ollama` gibi belleğe özgü sağlayıcı bağdaştırıcıları veya `openai-responses` / `openai-completions` gibi OpenAI uyumlu model API'leri için özel bir `models.providers.<id>` girdisini gösterebilir. OpenClaw, uç nokta, kimlik doğrulama ve model öneki işlemleri için özel sağlayıcı kimliğini korurken gömme bağdaştırıcısı için ilgili sağlayıcının `api` sahibini çözümler. Bu, birden fazla GPU veya ana bilgisayar kullanılan kurulumların bellek gömmelerini belirli bir yerel uç noktaya ayırmasına olanak tanır:

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

Uzak gömmeler bir API anahtarı gerektirir. Bedrock bunun yerine AWS SDK varsayılan kimlik bilgisi zincirini kullanır (örnek rolleri, SSO, erişim anahtarları veya Bedrock API anahtarı).

| Sağlayıcı      | Ortam değişkeni                                     | Yapılandırma anahtarı               |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS kimlik bilgisi zinciri veya `AWS_BEARER_TOKEN_BEDROCK` | API anahtarı gerekmez       |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Cihazla oturum açma üzerinden kimlik doğrulama profili |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (yer tutucu)                       | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth yalnızca sohbet/tamamlama işlemlerini kapsar ve gömme isteklerini karşılamaz.
</Note>

---

## Uzak uç nokta yapılandırması

Genel OpenAI sohbet kimlik bilgilerini devralmaması gereken genel amaçlı, OpenAI uyumlu bir `/v1/embeddings` sunucusu için `provider: "openai-compatible"` kullanın.

<ParamField path="remote.baseUrl" type="string">
  Özel API temel URL'si.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API anahtarını geçersiz kılar.
</ParamField>
<ParamField path="remote.headers" type="object">
  Ek HTTP üstbilgileri (sağlayıcı varsayılanlarıyla birleştirilir).
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
    | Anahtar                | Tür      | Varsayılan             | Açıklama                                      |
    | ---------------------- | -------- | ---------------------- | --------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` de desteklenir   |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 için: 768, 1536 veya 3072         |

    <Warning>
    Modelin veya `outputDimensionality` değerinin değiştirilmesi dizin kimliğini değiştirir. OpenClaw, bellek dizinini açıkça yeniden oluşturana kadar vektör aramasını duraklatır.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI uyumlu girdi türleri">
    OpenAI uyumlu gömme uç noktaları, sağlayıcıya özgü `input_type` istek alanlarını kullanmayı seçebilir. Bu, sorgu ve belge gömmeleri için farklı etiketler gerektiren asimetrik gömme modellerinde kullanışlıdır.

    | Anahtar             | Tür      | Varsayılan | Açıklama                                                          |
    | ------------------- | -------- | ---------- | ----------------------------------------------------------------- |
    | `inputType`         | `string` | ayarlanmamış | Sorgu ve belge gömmeleri için ortak `input_type`                |
    | `queryInputType`    | `string` | ayarlanmamış | Sorgu sırasındaki `input_type`; `inputType` değerini geçersiz kılar |
    | `documentInputType` | `string` | ayarlanmamış | Dizin/belge `input_type`; `inputType` değerini geçersiz kılar   |

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

    Üst model etiketleri farklı biçimde ele alıyorsa bu değerlerin değiştirilmesi, sağlayıcının toplu dizin oluşturma işlemindeki gömme önbelleği kimliğini etkiler ve ardından bellek yeniden dizinlenmelidir.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock gömme yapılandırması

    Bedrock, AWS SDK varsayılan kimlik bilgisi zincirine ek olarak OpenClaw tarafından denetlenen bir taşıyıcı belirteç kullanır; dolayısıyla yapılandırmada API anahtarı saklanmaz. OpenClaw, Bedrock etkinleştirilmiş bir örnek rolüyle EC2 üzerinde çalışıyorsa yalnızca sağlayıcıyı ve modeli ayarlayın:

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

    | Anahtar                | Tür      | Varsayılan                     | Açıklama                           |
    | ---------------------- | -------- | ------------------------------ | ---------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Herhangi bir Bedrock gömme modeli kimliği |
    | `outputDimensionality` | `number` | model varsayılanı              | Titan V2 için: 256, 512 veya 1024  |

    **Desteklenen modeller** (aile algılama ve boyut varsayılanlarıyla birlikte):

    | Model Kimliği                                | Sağlayıcı  | Varsayılan Boyutlar | Yapılandırılabilir Boyutlar |
    | ------------------------------------------- | ---------- | ------------------- | ---------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024                | 256, 512, 1024               |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536                | --                            |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536                | --                            |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024                | --                            |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024                | 256, 384, 1024, 3072         |
    | `cohere.embed-english-v3`                  | Cohere     | 1024                | --                            |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024                | --                            |
    | `cohere.embed-v4:0`                        | Cohere     | 1536                | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                 | --                            |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024                | --                            |

    Aktarım hızı son ekli değişkenler (ör. `amazon.titan-embed-text-v1:2:8k`) ve bölge ön ekli çıkarım profili kimlikleri (ör. `us.amazon.titan-embed-text-v2:0`), temel modelin yapılandırmasını devralır.

    **Bölge:** şu sırayla çözümlenir: `memorySearch.remote.baseUrl` geçersiz kılması, `models.providers.amazon-bedrock.baseUrl` yapılandırması, `AWS_REGION`, `AWS_DEFAULT_REGION`, ardından varsayılan olarak `us-east-1`.

    **Kimlik doğrulama:** OpenClaw önce `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` veya `AWS_BEARER_TOKEN_BEDROCK` değerlerini denetler, ardından standart AWS SDK varsayılan kimlik bilgisi sağlayıcı zincirine geçer:

    1. `AWS_PROFILE` da ayarlanmadığı sürece ortam değişkenleri (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
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

    En az ayrıcalık için `InvokeModel` kapsamını belirli modelle sınırlayın:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Yerel (GGUF + llama.cpp)">
    | Anahtar               | Tür                | Varsayılan               | Açıklama                                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | otomatik indirilir       | GGUF model dosyasının yolu                                                                                                                                                                                                                                                                                                               |
    | `local.modelCacheDir` | `string`           | node-llama-cpp varsayılanı | İndirilen modeller için önbellek dizini                                                                                                                                                                                                                                                                                                  |
    | `local.contextSize`   | `number \| "auto"` | `4096`                   | Gömme bağlamının bağlam penceresi boyutu. 4096, ağırlık dışı VRAM kullanımını sınırlarken tipik parçaları (128-512 belirteç) kapsar. Kısıtlı ana makinelerde 1024-2048 değerine düşürün. `"auto"`, modelin eğitildiği azami değeri kullanır; 8B+ modeller için önerilmez (Qwen3-Embedding-8B: 40.960'a kadar belirteç, VRAM kullanımını yaklaşık 32 GB'a çıkarabilir). |

    Önce resmî llama.cpp sağlayıcısını kurun: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Varsayılan model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, otomatik indirilir). Kaynak kod depoları yine de yerel derleme onayı gerektirir: `pnpm approve-builds`, ardından `pnpm rebuild node-llama-cpp`.

    Gateway'in kullandığı sağlayıcı yolunu doğrulamak için bağımsız CLI'yi kullanın:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Sayısal `local.contextSize` değerleri, model ağırlıklarıyla istenen gömme bağlamının birlikte sığdırılması için node-llama-cpp'nin otomatik GPU katmanı yerleşimini de yönlendirir. `openclaw memory status --deep`, çalışma zamanı yüklendikten sonra son bilinen llama.cpp arka ucunu, cihazı, aktarımı, istenen bağlamı ve zaman damgalı bellek bilgilerini bildirir; pasif durum denetimi bir model yüklemez.

    Yerel GGUF gömmeleri için `provider: "local"` değerini açıkça ayarlayın. `hf:` ve HTTP(S) model başvuruları, açık yerel yapılandırmalarda (node-llama-cpp'nin model çözümlemesi aracılığıyla) desteklenir ancak varsayılan sağlayıcıyı değiştirmez.

  </Accordion>
</AccordionGroup>

### Satır içi gömme zaman aşımı

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Bellek indeksleme sırasında satır içi gömme gruplarının zaman aşımını geçersiz kılın.

Ayarlanmadığında sağlayıcı varsayılanı kullanılır: `local`, `ollama` ve `lmstudio` gibi yerel/kendi barındırılan sağlayıcılar için 600 saniye; barındırılan sağlayıcılar için 120 saniye. Yerel CPU'ya bağımlı gömme grupları düzgün çalışıyor ancak yavaşsa bu değeri artırın.
</ParamField>

---

## İndeksleme davranışı

Belirtilmediği sürece tümü `memorySearch.sync` altındadır:

| Anahtar                        | Tür       | Varsayılan | Açıklama                                                                    |
| ------------------------------ | --------- | ---------- | --------------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`     | Bir oturum başladığında bellek indeksini eşzamanlar                         |
| `onSearch`                     | `boolean` | `true`     | İçerik değişikliklerini algıladıktan sonra arama sırasında gecikmeli eşzamanlar |
| `watch`                        | `boolean` | `true`     | Bellek dosyalarını izler (chokidar) ve değişikliklerde yeniden indekslemeyi zamanlar |
| `watchDebounceMs`              | `number`  | `1500`     | Hızlı dosya izleme olaylarını birleştirmek için geri tepme önleme penceresi |
| `intervalMinutes`              | `number`  | `0`        | Dakika cinsinden periyodik yeniden indeksleme aralığı (`0` devre dışı bırakır) |
| `sessions.postCompactionForce` | `boolean` | `true`     | Compaction ile tetiklenen döküm güncellemelerinden sonra oturumu yeniden indekslemeye zorlar |

<ParamField path="chunking.tokens" type="number">
  Bellek kaynakları gömmeden önce bölünürken kullanılan token cinsinden parça boyutu (varsayılan: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Bölme sınırları yakınındaki bağlamı korumak için bitişik parçalar arasındaki token örtüşmesi (varsayılan: 80).
</ParamField>

<Note>
`chunking.tokens` veya `chunking.overlap` değerinin değiştirilmesi, parça sınırlarını değiştirir ve mevcut dizin kimliğini geçersiz kılar (Sağlayıcı seçimi altındaki Uyarıya bakın).
</Note>

---

## Hibrit arama yapılandırması

Tümü `memorySearch.query` altında:

| Anahtar      | Tür      | Varsayılan | Açıklama                                           |
| ------------ | -------- | ---------- | -------------------------------------------------- |
| `maxResults` | `number` | `6`        | Enjeksiyondan önce döndürülen en fazla bellek eşleşmesi |
| `minScore`   | `number` | `0.35`     | Bir eşleşmenin dahil edilmesi için gereken en düşük ilgi puanı |

Ayrıca `memorySearch.query.hybrid` altında:

| Anahtar               | Tür       | Varsayılan | Açıklama                            |
| --------------------- | --------- | ---------- | ----------------------------------- |
| `enabled`             | `boolean` | `true`     | Hibrit BM25 + vektör aramasını etkinleştir |
| `vectorWeight`        | `number`  | `0.7`      | Vektör puanlarının ağırlığı (0-1)   |
| `textWeight`          | `number`  | `0.3`      | BM25 puanlarının ağırlığı (0-1)     |
| `candidateMultiplier` | `number`  | `4`        | Aday havuzu boyutu çarpanı           |

<Tabs>
  <Tab title="MMR (çeşitlilik)">
    | Anahtar       | Tür       | Varsayılan | Açıklama                                  |
    | ------------- | --------- | ---------- | ----------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`    | MMR ile yeniden sıralamayı etkinleştir    |
    | `mmr.lambda`  | `number`  | `0.7`      | 0 = en yüksek çeşitlilik, 1 = en yüksek ilgi |
  </Tab>
  <Tab title="Zamansal azalma (güncellik)">
    | Anahtar                      | Tür       | Varsayılan | Açıklama                     |
    | ---------------------------- | --------- | ---------- | ---------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`    | Güncellik artışını etkinleştir |
    | `temporalDecay.halfLifeDays` | `number`  | `30`       | Puan her N günde yarıya iner |

    Kalıcı dosyalara (`MEMORY.md`, `memory/` içindeki tarih içermeyen dosyalar) hiçbir zaman azalma uygulanmaz.

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
| `extraPaths` | `string[]` | Dizinlenecek ek dizinler veya dosyalar    |

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

Yollar mutlak veya çalışma alanına göreli olabilir. Dizinler, `.md` dosyaları için özyinelemeli olarak taranır. Sembolik bağlantıların işlenmesi etkin arka uca bağlıdır: yerleşik motor sembolik bağlantıları atlarken QMD, temel QMD tarayıcısının davranışını izler.

Ajan kapsamlı ajanlar arası transkript araması için `memory.qmd.paths` yerine `agents.list[].memorySearch.qmd.extraCollections` kullanın. Bu ek koleksiyonlar aynı `{ path, name, pattern? }` yapısını izler, ancak ajan başına birleştirilir ve yol geçerli çalışma alanının dışını gösterdiğinde açıkça belirtilen paylaşılan adları koruyabilir. Aynı çözümlenmiş yol hem `memory.qmd.paths` hem de `memorySearch.qmd.extraCollections` içinde görünürse QMD ilk girdiyi tutar ve yinelenen girdiyi atlar.

---

## Çok modlu bellek (Gemini)

Gemini Embedding 2 kullanarak görüntüleri ve sesleri Markdown ile birlikte dizinleyin:

| Anahtar                   | Tür        | Varsayılan | Açıklama                                      |
| ------------------------- | ---------- | ---------- | --------------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Çok modlu dizinlemeyi etkinleştir             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` veya `["all"]`       |
| `multimodal.maxFileBytes` | `number`   | `10485760` | Dizinleme için en büyük dosya boyutu (10 MiB) |

<Note>
Yalnızca `extraPaths` içindeki dosyalara uygulanır. Varsayılan bellek kökleri yalnızca Markdown olarak kalır. `gemini-embedding-2-preview` gerektirir. `fallback`, `"none"` olmalıdır.
</Note>

Desteklenen biçimler: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (görüntüler); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ses).

---

## Gömme önbelleği

| Anahtar            | Tür       | Varsayılan | Açıklama                                        |
| ------------------ | --------- | ---------- | ----------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`     | Parça gömmelerini SQLite'ta önbelleğe alır      |
| `cache.maxEntries` | `number`  | ayarlanmamış | Önbelleğe alınan gömmeler için yaklaşık üst sınır |

Yeniden indeksleme veya transkript güncellemeleri sırasında değişmemiş metnin yeniden gömülmesini önler. Sınırsız bir önbellek için `maxEntries` değerini ayarlamadan bırakın; disk alanındaki büyüme, en yüksek yeniden indeksleme hızından daha önemliyse bu değeri ayarlayın. Ayarlandığında, önbellek sınırı aştığı anda en eski girdiler (son güncelleme zamanına göre) önce temizlenir.

---

## Toplu indeksleme

| Anahtar                       | Tür       | Varsayılan | Açıklama                    |
| ----------------------------- | --------- | ---------- | --------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`        | Paralel satır içi gömmeler  |
| `remote.batch.enabled`        | `boolean` | `false`    | Toplu gömme API'sini etkinleştirir |
| `remote.batch.concurrency`    | `number`  | `2`        | Paralel toplu işler         |
| `remote.batch.wait`           | `boolean` | `true`     | Toplu işlemin tamamlanmasını bekler |
| `remote.batch.pollIntervalMs` | `number`  | `2000`     | Yoklama aralığı             |
| `remote.batch.timeoutMinutes` | `number`  | `60`       | Toplu işlem zaman aşımı     |

`gemini`, `openai` ve `voyage` için kullanılabilir. OpenAI toplu işlemi, büyük geriye dönük doldurma işlemlerinde genellikle en hızlı ve en ucuz seçenektir.

`remote.nonBatchConcurrency`, sağlayıcının toplu işlem API'leri etkin olmadığında yerel/kendi barındırdığınız sağlayıcılar ve barındırılan sağlayıcılar tarafından kullanılan satır içi gömme çağrılarını denetler. Ollama, daha küçük yerel ana makineleri aşırı yüklememek için toplu olmayan indekslemede varsayılan olarak `1` değerini kullanır; daha büyük makinelerde daha yüksek bir değer ayarlayın.

Bu ayar, satır içi gömme çağrılarının zaman aşımını denetleyen `sync.embeddingBatchTimeoutSeconds` ayarından ayrıdır.

---

## Oturum belleğinde arama (deneysel)

Oturum transkriptlerini indeksleyin ve `memory_search` aracılığıyla erişilebilir hâle getirin:

| Anahtar                       | Tür        | Varsayılan  | Açıklama                                            |
| ----------------------------- | ---------- | ----------- | --------------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`     | Oturum indekslemeyi etkinleştirir                   |
| `sources`                     | `string[]` | `["memory"]` | Transkriptleri dahil etmek için `"sessions"` ekleyin |
| `sync.sessions.deltaBytes`    | `number`   | `100000`    | Yeniden indeksleme için bayt eşiği                  |
| `sync.sessions.deltaMessages` | `number`   | `50`        | Yeniden indeksleme için ileti eşiği                 |

<Warning>
Oturum indeksleme isteğe bağlıdır ve eşzamansız çalışır. Sonuçlar bir miktar güncelliğini yitirmiş olabilir. Oturum günlükleri diskte bulunur; bu nedenle dosya sistemi erişimini güven sınırı olarak değerlendirin.
</Warning>

Oturum transkripti eşleşmeleri de
[`tools.sessions.visibility`](/tr/gateway/config-tools#toolssessions) ayarına uyar. Varsayılan
`tree` görünürlüğü yalnızca mevcut oturumu ve onun başlattığı oturumları erişilebilir kılar. DM gibi farklı bir oturumdan, aynı aracıya ait ve Gateway tarafından yönlendirilmiş ilgisiz bir oturumu hatırlamak için görünürlüğü bilinçli olarak `agent` düzeyine genişletin (veya yalnızca aracılar arası hatırlama da gerekliyse ve aracılar arası politika buna izin veriyorsa `all` kullanın).

Aşağıdaki örnekler bu ayarları `agents.defaults` altına yerleştirir. Yalnızca tek bir
aracının oturum transkriptlerini indeksleyip araması gerekiyorsa eşdeğer
`memorySearch` ayarlarını aracı başına geçersiz kılma yapılandırmasında da
uygulayabilirsiniz.

Aynı aracıda Gateway'den DM'e hatırlama için:

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

QMD kullanırken `agents.defaults.memorySearch.experimental.sessionMemory` ve
`sources: ["sessions"]` tek başlarına transkriptleri QMD'ye aktarmaz. Ayrıca
`memory.qmd.sessions.enabled: true` ayarını da yapın.

---

  ## SQLite vektör hızlandırma (sqlite-vec)

  | Anahtar                      | Tür       | Varsayılan | Açıklama                                  |
  | ---------------------------- | --------- | ---------- | ----------------------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`     | Vektör sorguları için sqlite-vec kullanır |
  | `store.vector.extensionPath` | `string`  | paketle birlikte | sqlite-vec yolunu geçersiz kılar     |

  sqlite-vec kullanılamadığında OpenClaw otomatik olarak süreç içi kosinüs benzerliğine geri döner.

  ---

  ## Dizin depolama

  Yerleşik bellek dizinleri, her ajanın OpenClaw SQLite veritabanında
  `agents/<agentId>/agent/openclaw-agent.sqlite` konumunda bulunur.

  | Anahtar               | Tür      | Varsayılan | Açıklama                                      |
  | --------------------- | -------- | ---------- | --------------------------------------------- |
  | `store.fts.tokenizer` | `string` | `unicode61` | FTS5 belirteçleştiricisi (`unicode61` veya `trigram`) |

  ---

  ## QMD arka uç yapılandırması

  Etkinleştirmek için `memory.backend = "qmd"` değerini ayarlayın. Tüm QMD ayarları `memory.qmd` altında bulunur:

  | Anahtar                  | Tür       | Varsayılan | Açıklama                                                                                          |
  | ------------------------ | --------- | ---------- | ------------------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`      | QMD yürütülebilir dosya yolu; hizmet `PATH` değeri kabuğunuzdan farklıysa mutlak bir yol ayarlayın |
  | `searchMode`             | `string`  | `search`   | Arama komutu: `search`, `vsearch`, `query`                                                        |
  | `rerank`                 | `boolean` | --         | QMD yeniden sıralamasını atlamak için QMD 2.1+ ve `searchMode: "query"` ile `false` olarak ayarlayın |
  | `includeDefaultMemory`   | `boolean` | `true`     | `MEMORY.md` + `memory/**/*.md` dosyalarını otomatik dizinler                                      |
  | `paths[]`                | `array`   | --         | Ek yollar: `{ name, path, pattern? }`                                                             |
  | `sessions.enabled`       | `boolean` | `false`    | Oturum dökümlerini QMD'ye aktarır                                                                 |
  | `sessions.retentionDays` | `number`  | --         | Döküm saklama süresi                                                                               |
  | `sessions.exportDir`     | `string`  | --         | Dışa aktarma dizini                                                                                |

  `searchMode: "search"` yalnızca sözcüksel/BM25 araması yapar. OpenClaw, `memory status --deep` sırasında da dâhil olmak üzere bu mod için anlamsal vektör hazır olma yoklamalarını veya QMD gömme bakımını çalıştırmaz; `vsearch` ve `query`, QMD vektör hazırlığını ve gömmeleri gerektirmeye devam eder.

  `rerank: false` yalnızca QMD `query` modunu değiştirir ve QMD 2.1 veya daha yeni bir sürüm gerektirir. Doğrudan CLI modunda OpenClaw `--no-rerank` seçeneğini iletir; mcporter destekli MCP modunda ise QMD'nin birleşik sorgu aracına `rerank: false` değerini iletir. QMD'nin varsayılan sorgu yeniden sıralama davranışını kullanmak için bu ayarı belirtmeyin.

  OpenClaw güncel QMD koleksiyonu ve MCP sorgu biçimlerini tercih eder, ancak gerektiğinde uyumlu koleksiyon kalıbı bayraklarını ve eski MCP araç adlarını deneyerek eski QMD sürümlerinin çalışmasını sürdürür. QMD birden fazla koleksiyon filtresini desteklediğini bildirdiğinde aynı kaynaktaki koleksiyonlar tek bir QMD süreciyle aranır; eski QMD derlemeleri koleksiyon başına uyumluluk yolunu kullanmaya devam eder. Aynı kaynak, kalıcı bellek koleksiyonlarının (varsayılan bellek dosyaları ve özel yollar) birlikte gruplandırılması anlamına gelir; oturum dökümü koleksiyonları ise kaynak çeşitlendirmesinde her iki girdinin de korunması için ayrı bir grup olarak kalır.

  <Note>
  QMD model geçersiz kılmaları OpenClaw yapılandırmasında değil, QMD tarafında kalır. QMD modellerini genel olarak geçersiz kılmanız gerekiyorsa Gateway çalışma zamanı ortamında `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` ve `QMD_GENERATE_MODEL` gibi ortam değişkenlerini ayarlayın.
  </Note>

  ### mcporter entegrasyonu

  Tümü `memory.qmd.mcporter` altında bulunur. QMD aramalarını her sorguda `qmd` başlatmak yerine uzun ömürlü bir `mcporter` MCP daemon'u üzerinden yönlendirerek daha büyük modellerin soğuk başlatma ek yükünü azaltır.

  | Anahtar       | Tür       | Varsayılan | Açıklama                                                                          |
  | ------------- | --------- | ---------- | --------------------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false`    | Her istekte `qmd` başlatmak yerine QMD çağrılarını mcporter üzerinden yönlendirir |
  | `serverName`  | `string`  | `qmd`      | `lifecycle: keep-alive` ile `qmd mcp` çalıştıran mcporter sunucu adı               |
  | `startDaemon` | `boolean` | `true`     | `enabled` true olduğunda mcporter daemon'unu otomatik olarak başlatır              |

  `mcporter` uygulamasının kurulmuş ve PATH üzerinde olmasının yanı sıra `qmd mcp` çalıştıran yapılandırılmış bir mcporter sunucusu gerektirir. Sorgu başına süreç başlatma maliyetinin kabul edilebilir olduğu daha basit yerel kurulumlarda devre dışı bırakın.

  <AccordionGroup>
  <Accordion title="Güncelleme zamanlaması">
    | Anahtar                     | Tür       | Varsayılan | Açıklama                                                                              |
    | --------------------------- | --------- | ---------- | ------------------------------------------------------------------------------------- |
    | `update.interval`           | `string`  | `5m`       | Yenileme aralığı                                                                      |
    | `update.debounceMs`         | `number`  | `15000`    | Dosya değişikliklerine bekleme uygular                                                 |
    | `update.onBoot`             | `boolean` | `true`     | Uzun ömürlü QMD yöneticisi açıldığında yeniler; anında başlangıç güncellemesini atlamak için false olarak ayarlayın |
    | `update.startup`            | `string`  | `off`      | İsteğe bağlı Gateway başlangıcında QMD ilklendirmesi: `off`, `idle` veya `immediate`   |
    | `update.startupDelayMs`     | `number`  | `120000`   | `startup: "idle"` yenilemesi çalışmadan önceki gecikme                                |
    | `update.waitForBootSync`    | `boolean` | `false`    | İlk yenileme tamamlanana kadar yöneticinin açılmasını engeller                         |
    | `update.embedInterval`      | `string`  | `60m`      | Ayrı gömme sıklığı                                                                    |
    | `update.commandTimeoutMs`   | `number`  | `30000`    | QMD bakım komutları (koleksiyon listeleme/ekleme) için zaman aşımı                     |
    | `update.updateTimeoutMs`    | `number`  | `120000`   | Her `qmd update` döngüsü için zaman aşımı                                              |
    | `update.embedTimeoutMs`     | `number`  | `120000`   | Her `qmd embed` döngüsü için zaman aşımı                                               |
  </Accordion>
  <Accordion title="Sınırlar">
    | Anahtar                     | Tür      | Varsayılan | Açıklama                              |
    | --------------------------- | -------- | ---------- | ------------------------------------- |
    | `limits.maxResults`         | `number` | `4`        | En fazla arama sonucu                 |
    | `limits.maxSnippetChars`    | `number` | `450`      | Parçacık uzunluğunu sınırlar          |
    | `limits.maxInjectedChars`   | `number` | `2200`     | Eklenen toplam karakterleri sınırlar  |
    | `limits.timeoutMs`          | `number` | `4000`     | Arama zaman aşımı                     |
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

    Sunulan varsayılan değer yalnızca DM/doğrudan oturumlara izin verir; grupları ve diğer kanal türlerini reddeder. `match.keyPrefix` normalleştirilmiş oturum anahtarıyla eşleşir; `match.rawKeyPrefix` ise `agent:<id>:` dâhil olmak üzere ham anahtarla eşleşir.

  </Accordion>
  <Accordion title="Alıntılar">
    `memory.citations` tüm arka uçlar için geçerlidir:

    | Değer              | Davranış                                                       |
    | ------------------ | -------------------------------------------------------------- |
    | `auto` (varsayılan) | Parçacıklara `Source: <path#line>` alt bilgisini ekle          |
    | `on`               | Alt bilgiyi her zaman ekle                                     |
    | `off`              | Alt bilgiyi çıkar (yol yine de dahili olarak aracıya aktarılır) |

  </Accordion>
</AccordionGroup>

Gateway başlangıcında QMD başlatma etkinleştirildiğinde OpenClaw, QMD'yi yalnızca uygun aracılar için başlatır. `update.onBoot` doğruysa ve herhangi bir aralık/gömme bakımı yapılandırılmamışsa başlangıç, açılış yenilemesi için tek seferlik bir yönetici kullanır ve ardından yöneticiyi kapatır. Bir güncelleme veya gömme aralığı yapılandırılmışsa başlangıç, izleyicinin ve aralık zamanlayıcılarının yönetimini üstlenebilmesi için uzun ömürlü QMD yöneticisini açar; `update.onBoot: false` yalnızca anlık açılış yenilemesini atlar.

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

Dreaming, zamanlanmış tek bir tarama olarak çalışır ve dahili hafif/derin/REM aşamalarını bir uygulama ayrıntısı olarak kullanır.

Kavramsal davranış ve eğik çizgi komutları için [Dreaming](/tr/concepts/dreaming) sayfasına bakın.

### Kullanıcı ayarları

| Anahtar                                | Tür       | Varsayılan model | Açıklama                                                                                                                               |
| -------------------------------------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`          | Dreaming'i tamamen etkinleştirir veya devre dışı bırakır                                                                                |
| `frequency`                            | `string`  | `0 3 * * *`      | Tam Dreaming taraması için isteğe bağlı Cron sıklığı                                                                                    |
| `model`                                | `string`  | varsayılan model | İsteğe bağlı Dream Diary alt aracı model geçersiz kılma ayarı                                                                           |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`            | `MEMORY.md` içine yükseltilen her kısa süreli hatırlama parçacığından tutulan tahmini maksimum belirteç sayısı; kaynak kökeni meta verileri görünür kalır |

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
- Dreaming, insanların okuyabileceği anlatı çıktısını `DREAMS.md` (veya mevcut `dreams.md`) dosyasına yazar.
- `dreaming.model`, mevcut Plugin alt aracı güven geçidini kullanır; etkinleştirmeden önce `plugins.entries.memory-core.subagent.allowModelOverride: true` değerini ayarlayın.
- Dream Diary, yapılandırılmış model kullanılamadığında oturumun varsayılan modeliyle bir kez yeniden dener. Güven veya izin listesi hataları günlüğe kaydedilir ve sessizce yeniden denenmez.
- Hafif/derin/REM aşaması ilkeleri ve eşikleri, kullanıcıya yönelik yapılandırma değil, dahili davranışlardır.

</Note>

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
