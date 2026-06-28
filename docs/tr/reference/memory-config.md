---
read_when:
    - Bellek arama sağlayıcılarını veya gömme modellerini yapılandırmak istiyorsunuz
    - QMD arka ucunu kurmak istiyorsunuz
    - Hibrit aramayı, MMR'yi veya zamansal zayıflamayı ince ayarlamak istiyorsunuz
    - Çok modlu bellek dizinlemeyi etkinleştirmek istiyorsunuz
sidebarTitle: Memory config
summary: Bellek araması, gömme sağlayıcıları, QMD, hibrit arama ve çok modlu indeksleme için tüm yapılandırma ayarları
title: Bellek yapılandırma başvurusu
x-i18n:
    generated_at: "2026-06-28T01:15:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

Bu sayfa, OpenClaw bellek araması için her yapılandırma ayarını listeler. Kavramsal genel bakışlar için bkz.:

<CardGroup cols={2}>
  <Card title="Belleğe genel bakış" href="/tr/concepts/memory">
    Belleğin nasıl çalıştığı.
  </Card>
  <Card title="Yerleşik motor" href="/tr/concepts/memory-builtin">
    Varsayılan SQLite arka ucu.
  </Card>
  <Card title="QMD motoru" href="/tr/concepts/memory-qmd">
    Yerel öncelikli yan araç.
  </Card>
  <Card title="Bellek araması" href="/tr/concepts/memory-search">
    Arama işlem hattı ve ayarlama.
  </Card>
  <Card title="Active Memory" href="/tr/concepts/active-memory">
    Etkileşimli oturumlar için bellek alt ajanı.
  </Card>
</CardGroup>

Aksi belirtilmedikçe tüm bellek araması ayarları `openclaw.json` içindeki `agents.defaults.memorySearch` altında bulunur.

<Note>
**Active Memory** özellik anahtarını ve alt ajan yapılandırmasını arıyorsanız, bu `memorySearch` yerine `plugins.entries.active-memory` altında bulunur.

Active Memory iki kapılı bir model kullanır:

1. plugin etkinleştirilmeli ve geçerli ajan kimliğini hedeflemelidir
2. istek, uygun bir etkileşimli kalıcı sohbet oturumu olmalıdır

Etkinleştirme modeli, plugin tarafından sahip olunan yapılandırma, transkript kalıcılığı ve güvenli kullanıma alma deseni için [Active Memory](/tr/concepts/active-memory) bölümüne bakın.
</Note>

---

## Sağlayıcı seçimi

| Anahtar    | Tür       | Varsayılan        | Açıklama                                                                                                                                                                                                                                                                                         |
| ---------- | --------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider` | `string`  | `"openai"`        | `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` veya `voyage` gibi gömme bağdaştırıcısı kimliği; `api` değeri bir bellek gömme bağdaştırıcısını ya da OpenAI uyumlu model API'sini gösteren yapılandırılmış bir `models.providers.<id>` de olabilir |
| `model`    | `string`  | sağlayıcı varsayılanı | Gömme modeli adı                                                                                                                                                                                                                                                                                 |
| `fallback` | `string`  | `"none"`          | Birincil başarısız olduğunda kullanılacak geri dönüş bağdaştırıcısı kimliği                                                                                                                                                                                                                       |
| `enabled`  | `boolean` | `true`            | Bellek aramasını etkinleştirir veya devre dışı bırakır                                                                                                                                                                                                                                           |

`provider` ayarlanmadığında OpenClaw, OpenAI gömmelerini kullanır. Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, yerel bir GGUF modeli veya OpenAI uyumlu bir `/v1/embeddings` uç noktası kullanmak için `provider` değerini açıkça ayarlayın.
Hâlâ `provider: "auto"` diyen eski yapılandırmalar `openai` olarak çözümlenir.

<Warning>
Gömme sağlayıcısını, modeli, sağlayıcı ayarlarını, kaynakları, kapsamı,
parçalamayı veya tokenizer'ı değiştirmek mevcut SQLite vektör dizinini uyumsuz hâle getirebilir.
OpenClaw, her şeyi otomatik olarak yeniden gömmek yerine vektör aramasını duraklatır ve bir dizin kimliği uyarısı bildirir. Hazır olduğunuzda
`openclaw memory status --index --agent <id>` veya
`openclaw memory index --force --agent <id>` ile yeniden oluşturun.
</Warning>

`provider` ayarlanmamışsa, eski `provider: "auto"` mevcutsa veya
`provider: "none"` bilerek yalnızca FTS modunu seçiyorsa, gömmeler kullanılamadığında bellek hatırlama yine de sözcüksel FTS sıralamasını kullanabilir.

Açıkça belirtilen yerel olmayan sağlayıcılar kapalı şekilde başarısız olur. `memorySearch.provider` değerini OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio veya OpenAI uyumlu özel sağlayıcı gibi somut bir uzak destekli sağlayıcıya ayarlarsanız ve bu sağlayıcı çalışma zamanında kullanılamıyorsa, `memory_search`
sessizce yalnızca FTS hatırlamayı kullanmak yerine kullanılamaz sonucu döndürür. Sağlayıcı/kimlik doğrulama yapılandırmasını düzeltin, erişilebilir bir sağlayıcıya geçin veya bilinçli olarak yalnızca FTS hatırlama istiyorsanız
`provider: "none"` ayarlayın.

### Özel sağlayıcı kimlikleri

`memorySearch.provider`, `ollama` gibi belleğe özgü sağlayıcı bağdaştırıcıları veya `openai-responses` / `openai-completions` gibi OpenAI uyumlu model API'leri için özel bir `models.providers.<id>` girdisini gösterebilir. OpenClaw, uç nokta, kimlik doğrulama ve model öneki işleme için özel sağlayıcı kimliğini korurken, gömme bağdaştırıcısı için bu sağlayıcının `api` sahibini çözümler. Bu, çok GPU'lu veya çok ana makineli kurulumların bellek gömmelerini belirli bir yerel uç noktaya ayırmasına olanak tanır:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
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

Uzak gömmeler bir API anahtarı gerektirir. Bedrock bunun yerine AWS SDK varsayılan kimlik bilgisi zincirini kullanır (örnek rolleri, SSO, erişim anahtarları).

| Sağlayıcı      | Ortam değişkeni                                    | Yapılandırma anahtarı              |
| -------------- | -------------------------------------------------- | ---------------------------------- |
| Bedrock        | AWS kimlik bilgisi zinciri                         | API anahtarı gerekmez              |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`   |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Cihaz oturum açma üzerinden kimlik doğrulama profili |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`  |
| Ollama         | `OLLAMA_API_KEY` (yer tutucu)                      | --                                 |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`   |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`   |

<Note>
Codex OAuth yalnızca sohbet/tamamlama işlemlerini kapsar ve gömme isteklerini karşılamaz.
</Note>

---

## Uzak uç nokta yapılandırması

Genel OpenAI uyumlu, genel OpenAI sohbet kimlik bilgilerini devralmaması gereken bir
`/v1/embeddings` sunucusu için `provider: "openai-compatible"` kullanın.

<ParamField path="remote.baseUrl" type="string">
  Özel API temel URL'si.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API anahtarını geçersiz kılın.
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
    | Anahtar               | Tür      | Varsayılan             | Açıklama                                  |
    | --------------------- | -------- | ---------------------- | ----------------------------------------- |
    | `model`               | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` de desteklenir |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 için: 768, 1536 veya 3072     |

    <Warning>
    Modeli veya `outputDimensionality` değerini değiştirmek dizin kimliğini değiştirir. OpenClaw,
    bellek dizinini açıkça yeniden oluşturana kadar vektör aramasını duraklatır.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI uyumlu giriş türleri">
    OpenAI uyumlu gömme uç noktaları, sağlayıcıya özgü `input_type` istek alanlarını kullanmayı seçebilir. Bu, sorgu ve belge gömmeleri için farklı etiketler gerektiren asimetrik gömme modelleri açısından yararlıdır.

    | Anahtar             | Tür      | Varsayılan | Açıklama                                               |
    | ------------------- | -------- | ---------- | ------------------------------------------------------ |
    | `inputType`         | `string` | ayarlanmamış | Sorgu ve belge gömmeleri için paylaşılan `input_type` |
    | `queryInputType`    | `string` | ayarlanmamış | Sorgu zamanı `input_type`; `inputType` değerini geçersiz kılar |
    | `documentInputType` | `string` | ayarlanmamış | Dizin/belge `input_type`; `inputType` değerini geçersiz kılar |

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

    Bu değerleri değiştirmek, sağlayıcı toplu dizinleme için gömme önbelleği kimliğini etkiler ve yukarı akış model etiketleri farklı işlediğinde ardından bir bellek yeniden dizinlemesi yapılmalıdır.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock gömme yapılandırması

    Bedrock, AWS SDK varsayılan kimlik bilgisi zincirini kullanır; API anahtarları gerekmez. OpenClaw, Bedrock etkin bir örnek rolüyle EC2 üzerinde çalışıyorsa yalnızca sağlayıcıyı ve modeli ayarlayın:

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

    | Anahtar               | Tür      | Varsayılan                    | Açıklama                       |
    | --------------------- | -------- | ----------------------------- | ------------------------------ |
    | `model`               | `string` | `amazon.titan-embed-text-v2:0` | Herhangi bir Bedrock gömme modeli kimliği |
    | `outputDimensionality` | `number` | model varsayılanı             | Titan V2 için: 256, 512 veya 1024 |

    **Desteklenen modeller** (aile algılama ve boyut varsayılanlarıyla):

    | Model Kimliği                            | Sağlayıcı  | Varsayılan Boyutlar | Yapılandırılabilir Boyutlar |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    Aktarım hızı son ekli varyantlar (ör. `amazon.titan-embed-text-v1:2:8k`) temel modelin yapılandırmasını devralır.

    **Kimlik doğrulama:** Bedrock kimlik doğrulaması standart AWS SDK kimlik bilgisi çözümleme sırasını kullanır:

    1. Ortam değişkenleri (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO belirteç önbelleği
    3. Web kimliği belirteci kimlik bilgileri
    4. Paylaşılan kimlik bilgileri ve yapılandırma dosyaları
    5. ECS veya EC2 meta veri kimlik bilgileri

    Bölge `AWS_REGION`, `AWS_DEFAULT_REGION`, `amazon-bedrock` sağlayıcısı `baseUrl` üzerinden çözümlenir veya varsayılan olarak `us-east-1` kullanılır.

    **IAM izinleri:** IAM rolü veya kullanıcısının şunlara ihtiyacı vardır:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    En düşük ayrıcalık için `InvokeModel` kapsamını belirli modelle sınırlayın:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Yerel (GGUF + llama.cpp)">
    | Anahtar              | Tür                | Varsayılan             | Açıklama                                                                                                                                                                                                                                                                                                            |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | otomatik indirilen     | GGUF model dosyasının yolu                                                                                                                                                                                                                                                                                          |
    | `local.modelCacheDir` | `string`           | node-llama-cpp varsayılanı | İndirilen modeller için önbellek dizini                                                                                                                                                                                                                                                                             |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Gömme bağlamı için bağlam penceresi boyutu. 4096, ağırlık dışı VRAM'i sınırlarken tipik parçaları (128–512 token) kapsar. Kısıtlı ana makinelerde 1024–2048'e düşürün. `"auto"` modelin eğitilmiş maksimumunu kullanır; 8B+ modeller için önerilmez (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM, 4096'da ~8,8 GB). |

    Önce resmi llama.cpp sağlayıcısını yükleyin: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Varsayılan model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, otomatik indirilir). Kaynak checkout'ları yine de yerel derleme onayı gerektirir: `pnpm approve-builds`, ardından `pnpm rebuild node-llama-cpp`.

    Gateway'in kullandığı aynı sağlayıcı yolunu doğrulamak için bağımsız CLI'yi kullanın:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Yerel GGUF gömmeleri için `provider: "local"` değerini açıkça ayarlayın. Açık yerel yapılandırmalar için `hf:` ve HTTP(S) model referansları desteklenir, ancak varsayılan sağlayıcıyı değiştirmezler.

  </Accordion>
</AccordionGroup>

### Satır içi gömme zaman aşımı

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Bellek indeksleme sırasında satır içi gömme toplu işleri için zaman aşımını geçersiz kılın.

Ayarlanmamışsa sağlayıcı varsayılanı kullanılır: `local`, `ollama` ve `lmstudio` gibi yerel/kendi barındırılan sağlayıcılar için 600 saniye, barındırılan sağlayıcılar için 120 saniye. Yerel CPU'ya bağlı gömme toplu işleri sağlıklı ancak yavaş olduğunda bunu artırın.
</ParamField>

---

## Hibrit arama yapılandırması

Tümü `memorySearch.query.hybrid` altında:

| Anahtar               | Tür       | Varsayılan | Açıklama                          |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Hibrit BM25 + vektör aramayı etkinleştir |
| `vectorWeight`        | `number`  | `0.7`   | Vektör puanlarının ağırlığı (0-1)  |
| `textWeight`          | `number`  | `0.3`   | BM25 puanlarının ağırlığı (0-1)    |
| `candidateMultiplier` | `number`  | `4`     | Aday havuzu boyutu çarpanı         |

<Tabs>
  <Tab title="MMR (çeşitlilik)">
    | Anahtar       | Tür       | Varsayılan | Açıklama                            |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | MMR yeniden sıralamayı etkinleştir   |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = maksimum çeşitlilik, 1 = maksimum alaka |
  </Tab>
  <Tab title="Zamansal azalma (güncellik)">
    | Anahtar                      | Tür       | Varsayılan | Açıklama                  |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Güncellik artışını etkinleştir |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Puan her N günde yarıya iner |

    Her zaman güncel dosyalar (`MEMORY.md`, `memory/` içindeki tarihli olmayan dosyalar) hiçbir zaman azaltılmaz.

  </Tab>
</Tabs>

### Tam örnek

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
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

| Anahtar      | Tür        | Açıklama                                      |
| ------------ | ---------- | --------------------------------------------- |
| `extraPaths` | `string[]` | İndekslenecek ek dizinler veya dosyalar       |

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

Yollar mutlak veya çalışma alanına göreli olabilir. Dizinler `.md` dosyaları için özyinelemeli olarak taranır. Sembolik bağlantı işleme etkin arka uca bağlıdır: yerleşik motor sembolik bağlantıları yok sayarken QMD, temel QMD tarayıcı davranışını izler.

Aracı kapsamlı aracılar arası döküm araması için `memory.qmd.paths` yerine `agents.list[].memorySearch.qmd.extraCollections` kullanın. Bu ek koleksiyonlar aynı `{ path, name, pattern? }` biçimini izler, ancak aracı başına birleştirilir ve yol geçerli çalışma alanının dışını işaret ettiğinde açık paylaşılan adları koruyabilir. Aynı çözümlenmiş yol hem `memory.qmd.paths` hem de `memorySearch.qmd.extraCollections` içinde görünürse QMD ilk girdiyi tutar ve yineleneni atlar.

---

## Çok modlu bellek (Gemini)

Gemini Embedding 2 kullanarak Markdown ile birlikte görüntüleri ve sesi indeksleyin:

| Anahtar                  | Tür        | Varsayılan | Açıklama                               |
| ------------------------ | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`     | `boolean`  | `false`    | Çok modlu indekslemeyi etkinleştir     |
| `multimodal.modalities`  | `string[]` | --         | `["image"]`, `["audio"]` veya `["all"]` |
| `multimodal.maxFileBytes` | `number`  | `10000000` | İndeksleme için en büyük dosya boyutu  |

<Note>
Yalnızca `extraPaths` içindeki dosyalara uygulanır. Varsayılan bellek kökleri yalnızca Markdown olarak kalır. `gemini-embedding-2-preview` gerektirir. `fallback` `"none"` olmalıdır.
</Note>

Desteklenen biçimler: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (görüntüler); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ses).

---

## Gömme önbelleği

| Anahtar           | Tür       | Varsayılan | Açıklama                               |
| ----------------- | --------- | ---------- | -------------------------------------- |
| `cache.enabled`   | `boolean` | `true`     | Parça gömmelerini SQLite içinde önbelleğe al |
| `cache.maxEntries` | `number` | `50000`    | En fazla önbelleğe alınmış gömme       |

Yeniden indeksleme veya döküm güncellemeleri sırasında değişmemiş metnin yeniden gömülmesini önler.

---

## Toplu indeksleme

| Anahtar                      | Tür       | Varsayılan | Açıklama                         |
| ---------------------------- | --------- | ---------- | -------------------------------- |
| `remote.nonBatchConcurrency` | `number`  | `4`        | Paralel satır içi gömmeler       |
| `remote.batch.enabled`       | `boolean` | `false`    | Toplu gömme API'sini etkinleştir |
| `remote.batch.concurrency`   | `number`  | `2`        | Paralel toplu işler              |
| `remote.batch.wait`          | `boolean` | `true`     | Toplu işlemin tamamlanmasını bekle |
| `remote.batch.pollIntervalMs` | `number` | --         | Yoklama aralığı                  |
| `remote.batch.timeoutMinutes` | `number` | --         | Toplu işlem zaman aşımı          |

`openai`, `gemini` ve `voyage` için kullanılabilir. OpenAI toplu işlem, büyük geriye dönük doldurmalar için genellikle en hızlı ve en ucuz seçenektir.

`remote.nonBatchConcurrency`, sağlayıcı toplu işlem API'leri etkin olmadığında yerel/kendi barındırılan sağlayıcılar ve barındırılan sağlayıcılar tarafından kullanılan satır içi gömme çağrılarını denetler. Ollama, daha küçük yerel ana makineleri aşırı yüklememek için toplu olmayan indekslemede varsayılan olarak `1` değerini kullanır; daha büyük makinelerde daha yüksek bir değer ayarlayın.

Bu, satır içi gömme çağrıları için zaman aşımını denetleyen `sync.embeddingBatchTimeoutSeconds` değerinden ayrıdır.

---

## Oturum belleği araması (deneysel)

Oturum dökümlerini indeksleyin ve `memory_search` aracılığıyla gösterin:

| Anahtar                      | Tür        | Varsayılan  | Açıklama                                |
| ---------------------------- | ---------- | ----------- | --------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`     | Oturum indekslemeyi etkinleştir         |
| `sources`                    | `string[]` | `["memory"]` | Dökümleri dahil etmek için `"sessions"` ekleyin |
| `sync.sessions.deltaBytes`   | `number`   | `100000`    | Yeniden indeksleme için bayt eşiği      |
| `sync.sessions.deltaMessages` | `number`  | `50`        | Yeniden indeksleme için ileti eşiği     |

<Warning>
Oturum indeksleme isteğe bağlıdır ve eşzamansız çalışır. Sonuçlar biraz eski kalabilir. Oturum günlükleri diskte bulunur, bu nedenle dosya sistemi erişimini güven sınırı olarak değerlendirin.
</Warning>

---

## SQLite vektör hızlandırma (sqlite-vec)

| Anahtar                      | Tür       | Varsayılan | Açıklama                         |
| ---------------------------- | --------- | ---------- | -------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`     | Vektör sorguları için sqlite-vec kullan |
| `store.vector.extensionPath` | `string`  | paketli    | sqlite-vec yolunu geçersiz kıl   |

sqlite-vec kullanılamadığında, OpenClaw otomatik olarak işlem içi kosinüs benzerliğine geri döner.

---

## Dizin depolama

Yerleşik bellek dizinleri, her ajanın OpenClaw SQLite veritabanında bulunur:
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Anahtar               | Tür      | Varsayılan | Açıklama                                  |
| --------------------- | -------- | ---------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5 belirteçleyici (`unicode61` veya `trigram`) |

---

## QMD arka uç yapılandırması

Etkinleştirmek için `memory.backend = "qmd"` ayarlayın. Tüm QMD ayarları `memory.qmd` altında bulunur:

| Anahtar                  | Tür       | Varsayılan | Açıklama                                                                                          |
| ------------------------ | --------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`      | QMD çalıştırılabilir dosya yolu; hizmet `PATH` değeri kabuğunuzdan farklıysa mutlak yol ayarlayın |
| `searchMode`             | `string`  | `search`   | Arama komutu: `search`, `vsearch`, `query`                                                        |
| `rerank`                 | `boolean` | --         | QMD yeniden sıralamasını atlamak için `searchMode: "query"` ve QMD 2.1+ ile `false` olarak ayarlayın |
| `includeDefaultMemory`   | `boolean` | `true`     | `MEMORY.md` + `memory/**/*.md` dosyalarını otomatik dizinle                                        |
| `paths[]`                | `array`   | --         | Ek yollar: `{ name, path, pattern? }`                                                             |
| `sessions.enabled`       | `boolean` | `false`    | Oturum dökümlerini dizinle                                                                        |
| `sessions.retentionDays` | `number`  | --         | Döküm saklama süresi                                                                              |
| `sessions.exportDir`     | `string`  | --         | Dışa aktarma dizini                                                                               |

`searchMode: "search"` yalnızca sözcüksel/BM25 modudur. OpenClaw bu mod için `memory status --deep` sırasında da dahil olmak üzere semantik vektör hazır olma yoklamaları veya QMD embedding bakımı çalıştırmaz; `vsearch` ve `query`, QMD vektör hazır olma durumunu ve embedding’leri gerektirmeye devam eder.

`rerank: false` yalnızca QMD `query` modunu değiştirir ve QMD 2.1 veya daha yenisini gerektirir. Doğrudan CLI modunda OpenClaw `--no-rerank` geçirir; mcporter destekli MCP modunda QMD’nin birleşik sorgu aracına `rerank: false` geçirir. QMD’nin varsayılan sorgu yeniden sıralama davranışını kullanmak için ayarlanmamış bırakın.

OpenClaw güncel QMD koleksiyon ve MCP sorgu biçimlerini tercih eder, ancak gerektiğinde uyumlu koleksiyon desen bayraklarını ve eski MCP araç adlarını deneyerek eski QMD sürümlerini çalışır durumda tutar. QMD birden fazla koleksiyon filtresi desteği bildirdiğinde, aynı kaynaklı koleksiyonlar tek bir QMD işlemiyle aranır; eski QMD derlemeleri koleksiyon başına uyumluluk yolunu korur. Aynı kaynak, kalıcı bellek koleksiyonlarının birlikte gruplanması, oturum dökümü koleksiyonlarının ise ayrı bir grup olarak kalması anlamına gelir; böylece kaynak çeşitliliği hâlâ her iki girdiye de sahip olur.

<Note>
QMD model geçersiz kılmaları OpenClaw yapılandırmasında değil, QMD tarafında kalır. QMD’nin modellerini genel olarak geçersiz kılmanız gerekiyorsa gateway çalışma zamanı ortamında `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` ve `QMD_GENERATE_MODEL` gibi ortam değişkenleri ayarlayın.
</Note>

<AccordionGroup>
  <Accordion title="Güncelleme zamanlaması">
    | Anahtar                   | Tür       | Varsayılan | Açıklama                           |
    | ------------------------- | --------- | ---------- | ---------------------------------- |
    | `update.interval`         | `string`  | `5m`       | Yenileme aralığı                   |
    | `update.debounceMs`       | `number`  | `15000`    | Dosya değişikliklerini debounce et |
    | `update.onBoot`           | `boolean` | `true`     | Uzun ömürlü QMD yöneticisi açıldığında yenile; anlık önyükleme güncellemesini atlamak için false ayarlayın |
    | `update.startup`          | `string`  | `off`      | İsteğe bağlı gateway başlangıcında QMD başlatma: `off`, `idle` veya `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`   | `startup: "idle"` yenilemesi çalışmadan önceki gecikme |
    | `update.waitForBootSync`  | `boolean` | `false`    | İlk yenilemesi tamamlanana kadar yöneticinin açılmasını engelle |
    | `update.embedInterval`    | `string`  | --         | Ayrı embed temposu                 |
    | `update.commandTimeoutMs` | `number`  | --         | QMD komutları için zaman aşımı     |
    | `update.updateTimeoutMs`  | `number`  | --         | QMD güncelleme işlemleri için zaman aşımı |
    | `update.embedTimeoutMs`   | `number`  | --         | QMD embed işlemleri için zaman aşımı |
  </Accordion>
  <Accordion title="Sınırlar">
    | Anahtar                   | Tür      | Varsayılan | Açıklama                        |
    | ------------------------- | -------- | ---------- | ------------------------------- |
    | `limits.maxResults`       | `number` | `6`        | Maksimum arama sonucu           |
    | `limits.maxSnippetChars`  | `number` | --         | Parça uzunluğunu sınırla        |
    | `limits.maxInjectedChars` | `number` | --         | Toplam enjekte edilen karakterleri sınırla |
    | `limits.timeoutMs`        | `number` | `4000`     | Arama zaman aşımı               |
  </Accordion>
  <Accordion title="Kapsam">
    Hangi oturumların QMD arama sonuçlarını alabileceğini denetler. [`session.sendPolicy`](/tr/gateway/config-agents#session) ile aynı şema:

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

    Gönderilen varsayılan doğrudan oturumlara ve kanal oturumlarına izin verirken grupları yine de reddeder.

    Varsayılan yalnızca DM’dir. `match.keyPrefix` normalleştirilmiş oturum anahtarıyla eşleşir; `match.rawKeyPrefix`, `agent:<id>:` dahil ham anahtarla eşleşir.

  </Accordion>
  <Accordion title="Alıntılar">
    `memory.citations` tüm arka uçlara uygulanır:

    | Değer            | Davranış                                           |
    | ---------------- | ------------------------------------------------- |
    | `auto` (varsayılan) | Parçalara `Source: <path#line>` alt bilgisini ekle |
    | `on`             | Alt bilgiyi her zaman ekle                        |
    | `off`            | Alt bilgiyi atla (yol hâlâ dahili olarak ajana geçirilir) |

  </Accordion>
</AccordionGroup>

Gateway başlangıcında QMD başlatma etkinleştirildiğinde, OpenClaw QMD’yi yalnızca uygun ajanlar için başlatır. `update.onBoot` true ise ve hiçbir aralık/embed bakımı yapılandırılmamışsa, başlangıç önyükleme yenilemesi için tek seferlik bir yönetici kullanır ve onu kapatır. Bir güncelleme veya embed aralığı yapılandırılmışsa, başlangıç uzun ömürlü QMD yöneticisini açar; böylece izleyici ve aralık zamanlayıcıları ona ait olur. `update.onBoot: false` yalnızca anlık önyükleme yenilemesini atlar.

### Tam QMD örneği

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
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

Dreaming tek bir zamanlanmış tarama olarak çalışır ve dahili light/deep/REM aşamalarını bir uygulama ayrıntısı olarak kullanır.

Kavramsal davranış ve eğik çizgi komutları için bkz. [Dreaming](/tr/concepts/dreaming).

### Kullanıcı ayarları

| Anahtar                                | Tür       | Varsayılan    | Açıklama                                                                                                                      |
| -------------------------------------- | --------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Dreaming’i tamamen etkinleştir veya devre dışı bırak                                                                          |
| `frequency`                            | `string`  | `0 3 * * *`   | Tam Dreaming taraması için isteğe bağlı cron temposu                                                                          |
| `model`                                | `string`  | varsayılan model | İsteğe bağlı Dream Diary alt ajan model geçersiz kılması                                                                    |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | `MEMORY.md` içine yükseltilen her kısa süreli hatırlama parçasından tutulan maksimum tahmini token; kaynak metadatası görünür kalır |

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
- Dreaming makine durumunu `memory/.dreams/` konumuna yazar.
- Dreaming insan tarafından okunabilir anlatı çıktısını `DREAMS.md` dosyasına (veya mevcut `dreams.md` dosyasına) yazar.
- `dreaming.model` mevcut Plugin alt ajan güven kapısını kullanır; etkinleştirmeden önce `plugins.entries.memory-core.subagent.allowModelOverride: true` ayarlayın.
- Dream Diary, yapılandırılan model kullanılamadığında oturum varsayılan modeliyle bir kez yeniden dener. Güven veya izin listesi hataları günlüğe kaydedilir ve sessizce yeniden denenmez.
- light/deep/REM aşama ilkesi ve eşikleri, kullanıcıya dönük yapılandırma değil dahili davranıştır.

</Note>

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Bellek genel bakışı](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
