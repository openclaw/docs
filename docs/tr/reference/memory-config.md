---
read_when:
    - Bellek arama sağlayıcılarını veya embedding modellerini yapılandırmak istiyorsunuz
    - QMD arka ucunu kurmak istiyorsunuz
    - Hibrit aramayı, MMR'yi veya zamansal zayıflamayı ayarlamak istiyorsunuz
    - Çok modlu bellek indekslemeyi etkinleştirmek istiyorsunuz
sidebarTitle: Memory config
summary: Bellek araması, gömme sağlayıcıları, QMD, hibrit arama ve çok modlu indeksleme için tüm yapılandırma düğmeleri
title: Bellek yapılandırması referansı
x-i18n:
    generated_at: "2026-05-02T22:22:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99624a13b4e700da47a523206569d84c6750266fbb648ec73c463be9c5c285d0
    source_path: reference/memory-config.md
    workflow: 16
---

Bu sayfa, OpenClaw bellek araması için her yapılandırma düğmesini listeler. Kavramsal genel bakışlar için bkz.:

<CardGroup cols={2}>
  <Card title="Memory overview" href="/tr/concepts/memory">
    Belleğin nasıl çalıştığı.
  </Card>
  <Card title="Builtin engine" href="/tr/concepts/memory-builtin">
    Varsayılan SQLite arka ucu.
  </Card>
  <Card title="QMD engine" href="/tr/concepts/memory-qmd">
    Yerel öncelikli yardımcı süreç.
  </Card>
  <Card title="Memory search" href="/tr/concepts/memory-search">
    Arama işlem hattı ve ayarlama.
  </Card>
  <Card title="Active memory" href="/tr/concepts/active-memory">
    Etkileşimli oturumlar için bellek alt ajanı.
  </Card>
</CardGroup>

Aksi belirtilmedikçe tüm bellek araması ayarları `openclaw.json` içinde `agents.defaults.memorySearch` altında bulunur.

<Note>
**Active Memory** özellik anahtarı ve alt ajan yapılandırmasını arıyorsanız, bu `memorySearch` yerine `plugins.entries.active-memory` altında bulunur.

Active Memory iki geçitli bir model kullanır:

1. Plugin etkinleştirilmiş olmalı ve geçerli ajan kimliğini hedeflemelidir
2. istek uygun bir etkileşimli kalıcı sohbet oturumu olmalıdır

Etkinleştirme modeli, Plugin sahipli yapılandırma, transkript kalıcılığı ve güvenli kullanıma alma deseni için [Active Memory](/tr/concepts/active-memory) bölümüne bakın.
</Note>

---

## Sağlayıcı seçimi

| Anahtar   | Tür       | Varsayılan       | Açıklama                                                                                                                                                                                                                           |
| --------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | auto-detected    | `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` veya `voyage` gibi gömme bağdaştırıcısı kimliği; `api` değeri bu bağdaştırıcılardan birini işaret eden yapılandırılmış bir `models.providers.<id>` de olabilir |
| `model`    | `string`  | sağlayıcı varsayılanı | Gömme modeli adı                                                                                                                                                                                                                   |
| `fallback` | `string`  | `"none"`         | Birincil başarısız olduğunda kullanılacak yedek bağdaştırıcı kimliği                                                                                                                                                               |
| `enabled`  | `boolean` | `true`           | Bellek aramasını etkinleştirir veya devre dışı bırakır                                                                                                                                                                             |

### Otomatik algılama sırası

`provider` ayarlanmadığında OpenClaw kullanılabilir ilk seçeneği seçer:

<Steps>
  <Step title="local">
    `memorySearch.local.modelPath` yapılandırılmışsa ve dosya varsa seçilir.
  </Step>
  <Step title="github-copilot">
    Bir GitHub Copilot belirteci çözümlenebiliyorsa (env var veya kimlik doğrulama profili) seçilir.
  </Step>
  <Step title="openai">
    Bir OpenAI anahtarı çözümlenebiliyorsa seçilir.
  </Step>
  <Step title="gemini">
    Bir Gemini anahtarı çözümlenebiliyorsa seçilir.
  </Step>
  <Step title="voyage">
    Bir Voyage anahtarı çözümlenebiliyorsa seçilir.
  </Step>
  <Step title="mistral">
    Bir Mistral anahtarı çözümlenebiliyorsa seçilir.
  </Step>
  <Step title="deepinfra">
    Bir DeepInfra anahtarı çözümlenebiliyorsa seçilir.
  </Step>
  <Step title="bedrock">
    AWS SDK kimlik bilgisi zinciri çözümleniyorsa (örnek rolü, erişim anahtarları, profil, SSO, web kimliği veya paylaşılan yapılandırma) seçilir.
  </Step>
</Steps>

`ollama` desteklenir ancak otomatik algılanmaz (açıkça ayarlayın).

### Özel sağlayıcı kimlikleri

`memorySearch.provider`, özel bir `models.providers.<id>` girdisini işaret edebilir. OpenClaw, gömme bağdaştırıcısı için bu sağlayıcının `api` sahibini çözümlerken uç nokta, kimlik doğrulama ve model öneki işleme için özel sağlayıcı kimliğini korur. Bu, çok GPU'lu veya çok ana makineli kurulumların bellek gömmelerini belirli bir yerel uç noktaya ayırmasını sağlar:

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

| Sağlayıcı      | Env var                                            | Yapılandırma anahtarı              |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS kimlik bilgisi zinciri                         | API anahtarı gerekmez               |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Cihaz oturum açma üzerinden kimlik doğrulama profili |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (yer tutucu)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth yalnızca sohbet/tamamlama isteklerini kapsar ve gömme isteklerini karşılamaz.
</Note>

---

## Uzak uç nokta yapılandırması

Özel OpenAI uyumlu uç noktalar veya sağlayıcı varsayılanlarını geçersiz kılmak için:

<ParamField path="remote.baseUrl" type="string">
  Özel API temel URL'si.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API anahtarını geçersiz kıl.
</ParamField>
<ParamField path="remote.headers" type="object">
  Ek HTTP üstbilgileri (sağlayıcı varsayılanlarıyla birleştirilir).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
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

## Sağlayıcıya özel yapılandırma

<AccordionGroup>
  <Accordion title="Gemini">
    | Anahtar                | Tür      | Varsayılan             | Açıklama                                   |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` desteği de vardır |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 için: 768, 1536 veya 3072      |

    <Warning>
    Modeli veya `outputDimensionality` değerini değiştirmek otomatik tam yeniden indekslemeyi tetikler.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    OpenAI uyumlu gömme uç noktaları sağlayıcıya özel `input_type` istek alanlarını kullanmayı seçebilir. Bu, sorgu ve belge gömmeleri için farklı etiketler gerektiren asimetrik gömme modelleri için kullanışlıdır.

    | Anahtar            | Tür      | Varsayılan | Açıklama                                                 |
    | ------------------- | -------- | ---------- | -------------------------------------------------------- |
    | `inputType`         | `string` | ayarlanmamış | Sorgu ve belge gömmeleri için paylaşılan `input_type`    |
    | `queryInputType`    | `string` | ayarlanmamış | Sorgu zamanı `input_type`; `inputType` değerini geçersiz kılar |
    | `documentInputType` | `string` | ayarlanmamış | İndeks/belge `input_type`; `inputType` değerini geçersiz kılar |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Bu değerleri değiştirmek, sağlayıcı toplu indeksleme için gömme önbelleği kimliğini etkiler ve yukarı akış modeli etiketleri farklı işliyorsa bellek yeniden indekslemesiyle takip edilmelidir.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock gömme yapılandırması

    Bedrock, AWS SDK varsayılan kimlik bilgisi zincirini kullanır; API anahtarları gerekmez. OpenClaw, Bedrock etkinleştirilmiş bir örnek rolüyle EC2 üzerinde çalışıyorsa yalnızca sağlayıcıyı ve modeli ayarlayın:

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

    | Anahtar                | Tür      | Varsayılan                     | Açıklama                       |
    | ---------------------- | -------- | ------------------------------ | ------------------------------ |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Herhangi bir Bedrock gömme modeli kimliği |
    | `outputDimensionality` | `number` | model varsayılanı              | Titan V2 için: 256, 512 veya 1024 |

    **Desteklenen modeller** (aile algılama ve boyut varsayılanlarıyla):

    | Model kimliği                              | Sağlayıcı  | Varsayılan Boyutlar | Yapılandırılabilir Boyutlar |
    | ------------------------------------------ | ---------- | ------------------- | --------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024                | 256, 512, 1024              |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536                | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536                | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024                | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024                | 256, 384, 1024, 3072        |
    | `cohere.embed-english-v3`                  | Cohere     | 1024                | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024                | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536                | 256-1536                    |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                 | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024                | --                          |

    Verim eki taşıyan varyantlar (ör. `amazon.titan-embed-text-v1:2:8k`) temel modelin yapılandırmasını devralır.

    **Kimlik doğrulama:** Bedrock kimlik doğrulaması standart AWS SDK kimlik bilgisi çözümleme sırasını kullanır:

    1. Ortam değişkenleri (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO belirteç önbelleği
    3. Web kimliği belirteci kimlik bilgileri
    4. Paylaşılan kimlik bilgileri ve yapılandırma dosyaları
    5. ECS veya EC2 meta veri kimlik bilgileri

    Bölge `AWS_REGION`, `AWS_DEFAULT_REGION`, `amazon-bedrock` sağlayıcısı `baseUrl` değerinden çözümlenir veya varsayılan olarak `us-east-1` kullanılır.

    **IAM izinleri:** IAM rolü veya kullanıcısı şunlara ihtiyaç duyar:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    En az ayrıcalık için `InvokeModel` kapsamını belirli modele daraltın:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Yerel (GGUF + node-llama-cpp)">
    | Anahtar              | Tür                | Varsayılan             | Açıklama                                                                                                                                                                                                                                                                                                            |
    | -------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | otomatik indirilir     | GGUF model dosyasının yolu                                                                                                                                                                                                                                                                                         |
    | `local.modelCacheDir` | `string`           | node-llama-cpp varsayılanı | İndirilen modeller için önbellek dizini                                                                                                                                                                                                                                                                         |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Gömme bağlamı için bağlam penceresi boyutu. 4096, ağırlık dışı VRAM'i sınırlarken tipik parçaları (128-512 token) kapsar. Kısıtlı ana makinelerde 1024-2048'e düşürün. `"auto"` modelin eğitilmiş en yüksek değerini kullanır; 8B+ modeller için önerilmez (Qwen3-Embedding-8B: 40 960 token -> 4096'da ~8,8 GB'a karşılık ~32 GB VRAM). |

    Varsayılan model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, otomatik indirilir). Kaynak checkout'ları yine de yerel derleme onayı gerektirir: `pnpm approve-builds` ardından `pnpm rebuild node-llama-cpp`.

    Gateway'in kullandığı aynı sağlayıcı yolunu doğrulamak için bağımsız CLI'yi kullanın:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    `provider` `auto` ise `local` yalnızca `local.modelPath` mevcut bir yerel dosyayı gösterdiğinde seçilir. `hf:` ve HTTP(S) model başvuruları `provider: "local"` ile yine açıkça kullanılabilir, ancak model diskte mevcut olmadan önce `auto` seçiminin local'ı seçmesini sağlamazlar.

  </Accordion>
</AccordionGroup>

### Satır içi gömme zaman aşımı

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Bellek indeksleme sırasında satır içi gömme grupları için zaman aşımını geçersiz kılın.

Ayarlanmazsa sağlayıcı varsayılanı kullanılır: `local`, `ollama` ve `lmstudio` gibi yerel/kendi barındırdığınız sağlayıcılar için 600 saniye, barındırılan sağlayıcılar için 120 saniye. Yerel CPU'ya bağlı gömme grupları sağlıklı ama yavaş olduğunda bunu artırın.
</ParamField>

---

## Hibrit arama yapılandırması

Tümü `memorySearch.query.hybrid` altında:

| Anahtar              | Tür       | Varsayılan | Açıklama                              |
| -------------------- | --------- | ---------- | ------------------------------------- |
| `enabled`            | `boolean` | `true`     | Hibrit BM25 + vektör aramayı etkinleştir |
| `vectorWeight`       | `number`  | `0.7`      | Vektör puanları için ağırlık (0-1)    |
| `textWeight`         | `number`  | `0.3`      | BM25 puanları için ağırlık (0-1)      |
| `candidateMultiplier` | `number` | `4`        | Aday havuzu boyutu çarpanı            |

<Tabs>
  <Tab title="MMR (çeşitlilik)">
    | Anahtar      | Tür       | Varsayılan | Açıklama                                |
    | ------------ | --------- | ---------- | --------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`    | MMR yeniden sıralamayı etkinleştir      |
    | `mmr.lambda` | `number`  | `0.7`      | 0 = en yüksek çeşitlilik, 1 = en yüksek alaka |
  </Tab>
  <Tab title="Zamansal azalma (yenilik)">
    | Anahtar                     | Tür       | Varsayılan | Açıklama                         |
    | --------------------------- | --------- | ---------- | -------------------------------- |
    | `temporalDecay.enabled`     | `boolean` | `false`    | Yenilik artırımını etkinleştir   |
    | `temporalDecay.halfLifeDays` | `number` | `30`       | Puan her N günde yarıya iner     |

    Evergreen dosyalar (`MEMORY.md`, `memory/` içindeki tarih içermeyen dosyalar) hiçbir zaman azaltılmaz.

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

Yollar mutlak veya çalışma alanına göreli olabilir. Dizinler `.md` dosyaları için özyinelemeli olarak taranır. Sembolik bağlantı işleme etkin arka uca bağlıdır: yerleşik motor sembolik bağlantıları yok sayarken QMD temel QMD tarayıcı davranışını izler.

Ajan kapsamlı ajanlar arası transkript araması için `memory.qmd.paths` yerine `agents.list[].memorySearch.qmd.extraCollections` kullanın. Bu ek koleksiyonlar aynı `{ path, name, pattern? }` biçimini izler, ancak ajan başına birleştirilir ve yol geçerli çalışma alanının dışını gösterdiğinde açık paylaşılan adları koruyabilir. Aynı çözümlenmiş yol hem `memory.qmd.paths` hem de `memorySearch.qmd.extraCollections` içinde görünürse QMD ilk girdiyi tutar ve kopyayı atlar.

---

## Çok modlu bellek (Gemini)

Gemini Embedding 2 kullanarak Markdown ile birlikte görüntüleri ve sesi indeksleyin:

| Anahtar                  | Tür        | Varsayılan | Açıklama                              |
| ------------------------ | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`     | `boolean`  | `false`    | Çok modlu indekslemeyi etkinleştir    |
| `multimodal.modalities`  | `string[]` | --         | `["image"]`, `["audio"]` veya `["all"]` |
| `multimodal.maxFileBytes` | `number`  | `10000000` | İndeksleme için en yüksek dosya boyutu |

<Note>
Yalnızca `extraPaths` içindeki dosyalar için geçerlidir. Varsayılan bellek kökleri yalnızca Markdown olarak kalır. `gemini-embedding-2-preview` gerektirir. `fallback`, `"none"` olmalıdır.
</Note>

Desteklenen biçimler: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (görseller); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ses).

---

## Gömme önbelleği

| Anahtar            | Tür       | Varsayılan | Açıklama                              |
| ------------------ | --------- | ---------- | ------------------------------------- |
| `cache.enabled`    | `boolean` | `false`    | Parça gömmelerini SQLite içinde önbelleğe al |
| `cache.maxEntries` | `number`  | `50000`    | En fazla önbelleğe alınan gömme       |

Yeniden indeksleme veya transkript güncellemeleri sırasında değişmemiş metnin yeniden gömülmesini önler.

---

## Toplu indeksleme

| Anahtar                      | Tür       | Varsayılan | Açıklama                      |
| ---------------------------- | --------- | ---------- | ----------------------------- |
| `remote.nonBatchConcurrency` | `number`  | `4`        | Paralel satır içi gömmeler    |
| `remote.batch.enabled`       | `boolean` | `false`    | Toplu gömme API'sini etkinleştir |
| `remote.batch.concurrency`   | `number`  | `2`        | Paralel toplu işler           |
| `remote.batch.wait`          | `boolean` | `true`     | Toplu işlemin tamamlanmasını bekle |
| `remote.batch.pollIntervalMs` | `number` | --         | Yoklama aralığı               |
| `remote.batch.timeoutMinutes` | `number` | --         | Toplu işlem zaman aşımı       |

`openai`, `gemini` ve `voyage` için kullanılabilir. OpenAI toplu işlemi, büyük geriye dönük doldurmalar için genellikle en hızlı ve en ucuz seçenektir.

`remote.nonBatchConcurrency`, yerel/kendi barındırdığınız sağlayıcılar ve sağlayıcı toplu API'leri etkin olmadığında barındırılan sağlayıcılar tarafından kullanılan satır içi gömme çağrılarını denetler. Ollama, daha küçük yerel makineleri aşırı yüklememek için toplu olmayan indekslemede varsayılan olarak `1` kullanır; daha büyük makinelerde daha yüksek bir değer ayarlayın.

Bu, satır içi gömme çağrılarının zaman aşımını denetleyen `sync.embeddingBatchTimeoutSeconds` ayarından ayrıdır.

---

## Oturum belleği araması (deneysel)

Oturum transkriptlerini indeksleyin ve bunları `memory_search` üzerinden gösterin:

| Anahtar                      | Tür        | Varsayılan | Açıklama                                |
| ---------------------------- | ---------- | ---------- | --------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`    | Oturum indekslemeyi etkinleştir         |
| `sources`                    | `string[]` | `["memory"]` | Transkriptleri dahil etmek için `"sessions"` ekleyin |
| `sync.sessions.deltaBytes`   | `number`   | `100000`   | Yeniden indeksleme için bayt eşiği      |
| `sync.sessions.deltaMessages` | `number`  | `50`       | Yeniden indeksleme için ileti eşiği     |

<Warning>
Oturum indeksleme isteğe bağlıdır ve eşzamansız çalışır. Sonuçlar biraz eski olabilir. Oturum günlükleri diskte bulunur; bu nedenle dosya sistemi erişimini güven sınırı olarak değerlendirin.
</Warning>

---

## SQLite vektör hızlandırması (sqlite-vec)

| Anahtar                     | Tür       | Varsayılan | Açıklama                                |
| --------------------------- | --------- | ---------- | --------------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`     | Vektör sorguları için sqlite-vec kullan |
| `store.vector.extensionPath` | `string` | bundled    | sqlite-vec yolunu geçersiz kıl          |

sqlite-vec kullanılamadığında OpenClaw otomatik olarak işlem içi kosinüs benzerliğine geri döner.

---

## İndeks depolama

| Anahtar             | Tür      | Varsayılan                            | Açıklama                                  |
| ------------------- | -------- | ------------------------------------- | ----------------------------------------- |
| `store.path`        | `string` | `~/.openclaw/memory/{agentId}.sqlite` | İndeks konumu (`{agentId}` belirtecini destekler) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | FTS5 belirteçleyicisi (`unicode61` veya `trigram`) |

---

## QMD arka uç yapılandırması

Etkinleştirmek için `memory.backend = "qmd"` ayarlayın. Tüm QMD ayarları `memory.qmd` altında bulunur:

| Anahtar                 | Tür       | Varsayılan | Açıklama                                                                           |
| ----------------------- | --------- | ---------- | ---------------------------------------------------------------------------------- |
| `command`               | `string`  | `qmd`      | QMD çalıştırılabilir dosya yolu; hizmet `PATH` değeri kabuğunuzdan farklıysa mutlak yol ayarlayın |
| `searchMode`            | `string`  | `search`   | Arama komutu: `search`, `vsearch`, `query`                                         |
| `includeDefaultMemory`  | `boolean` | `true`     | `MEMORY.md` + `memory/**/*.md` dosyalarını otomatik indeksle                       |
| `paths[]`               | `array`   | --         | Ek yollar: `{ name, path, pattern? }`                                              |
| `sessions.enabled`      | `boolean` | `false`    | Oturum transkriptlerini indeksle                                                   |
| `sessions.retentionDays` | `number` | --         | Transkript saklama süresi                                                          |
| `sessions.exportDir`    | `string`  | --         | Dışa aktarma dizini                                                                |

`searchMode: "search"` yalnızca leksik/BM25 tabanlıdır. OpenClaw, `memory status --deep` sırasında dahil olmak üzere bu mod için semantik vektör hazırlık yoklamaları veya QMD embedding bakımı çalıştırmaz; `vsearch` ve `query`, QMD vektör hazırlığı ve embedding’leri gerektirmeye devam eder.

OpenClaw güncel QMD collection ve MCP sorgu biçimlerini tercih eder, ancak gerektiğinde uyumlu collection pattern bayraklarını ve eski MCP araç adlarını deneyerek daha eski QMD sürümlerinin çalışmasını sürdürür. QMD birden çok collection filtresi desteği bildirdiğinde, aynı kaynaklı collection’lar tek bir QMD işlemiyle aranır; eski QMD derlemeleri collection başına uyumluluk yolunu korur. Aynı kaynak, kalıcı bellek collection’larının birlikte gruplandığı, session transcript collection’larının ise ayrı bir grup olarak kaldığı anlamına gelir; böylece kaynak çeşitlendirmesi hâlâ her iki girdiye de sahip olur.

<Note>
QMD model override’ları OpenClaw yapılandırmasında değil, QMD tarafında kalır. QMD’nin modellerini genel olarak override etmeniz gerekiyorsa, gateway çalışma zamanı ortamında `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` ve `QMD_GENERATE_MODEL` gibi ortam değişkenlerini ayarlayın.
</Note>

<AccordionGroup>
  <Accordion title="Güncelleme zamanlaması">
    | Anahtar                  | Tür       | Varsayılan | Açıklama                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Yenileme aralığı                      |
    | `update.debounceMs`       | `number`  | `15000` | Dosya değişikliklerini debounce et                 |
    | `update.onBoot`           | `boolean` | `true`  | Uzun ömürlü QMD yöneticisi açıldığında yenile; ayrıca isteğe bağlı başlangıç yenilemesini de denetler |
    | `update.startup`          | `string`  | `off`   | İsteğe bağlı gateway başlangıç yenilemesi: `off`, `idle` veya `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` yenilemesi çalışmadan önceki gecikme |
    | `update.waitForBootSync`  | `boolean` | `false` | İlk yenilemesi tamamlanana kadar yöneticinin açılmasını engelle |
    | `update.embedInterval`    | `string`  | --      | Ayrı embed temposu                |
    | `update.commandTimeoutMs` | `number`  | --      | QMD komutları için zaman aşımı              |
    | `update.updateTimeoutMs`  | `number`  | --      | QMD güncelleme işlemleri için zaman aşımı     |
    | `update.embedTimeoutMs`   | `number`  | --      | QMD embed işlemleri için zaman aşımı      |
  </Accordion>
  <Accordion title="Sınırlar">
    | Anahtar                  | Tür      | Varsayılan | Açıklama                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Maksimum arama sonucu         |
    | `limits.maxSnippetChars`  | `number` | --      | Snippet uzunluğunu sınırla       |
    | `limits.maxInjectedChars` | `number` | --      | Toplam enjekte edilen karakterleri sınırla |
    | `limits.timeoutMs`        | `number` | `4000`  | Arama zaman aşımı             |
  </Accordion>
  <Accordion title="Kapsam">
    Hangi session’ların QMD arama sonuçlarını alabileceğini denetler. [`session.sendPolicy`](/tr/gateway/config-agents#session) ile aynı schema:

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

    Gönderilen varsayılan doğrudan ve kanal session’larına izin verirken grupları yine reddeder.

    Varsayılan yalnızca DM’dir. `match.keyPrefix` normalize edilmiş session anahtarıyla eşleşir; `match.rawKeyPrefix`, `agent:<id>:` dahil ham anahtarla eşleşir.

  </Accordion>
  <Accordion title="Atıflar">
    `memory.citations` tüm backend’lere uygulanır:

    | Değer            | Davranış                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (varsayılan) | Snippet’lara `Source: <path#line>` footer’ını ekle    |
    | `on`             | Footer’ı her zaman ekle                               |
    | `off`            | Footer’ı atla (yol yine de dahili olarak agent’a geçirilir) |

  </Accordion>
</AccordionGroup>

QMD boot yenilemeleri gateway başlangıcı sırasında tek seferlik bir subprocess yolu kullanır. Uzun ömürlü QMD yöneticisi, bellek araması etkileşimli kullanım için açıldığında düzenli dosya watcher’ının ve aralık timer’larının sahibi olmaya devam eder.

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

Dreaming tek bir zamanlanmış sweep olarak çalışır ve dahili light/deep/REM aşamalarını bir uygulama ayrıntısı olarak kullanır.

Kavramsal davranış ve slash komutları için bkz. [Dreaming](/tr/concepts/dreaming).

### Kullanıcı ayarları

| Anahtar     | Tür       | Varsayılan    | Açıklama                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Dreaming’i tamamen etkinleştir veya devre dışı bırak               |
| `frequency` | `string`  | `0 3 * * *`   | Tam Dreaming sweep’i için isteğe bağlı cron temposu |
| `model`     | `string`  | varsayılan model | İsteğe bağlı Dream Diary subagent model override’ı      |

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
- Dreaming makine durumunu `memory/.dreams/` içine yazar.
- Dreaming insan tarafından okunabilir anlatı çıktısını `DREAMS.md` (veya mevcut `dreams.md`) içine yazar.
- `dreaming.model` mevcut Plugin subagent güven kapısını kullanır; etkinleştirmeden önce `plugins.entries.memory-core.subagent.allowModelOverride: true` ayarlayın.
- Dream Diary, yapılandırılan model kullanılamadığında session varsayılan modeliyle bir kez yeniden dener. Güven veya allowlist hataları günlüğe kaydedilir ve sessizce yeniden denenmez.
- light/deep/REM aşama politikası ve eşikleri dahili davranıştır, kullanıcıya dönük yapılandırma değildir.

</Note>

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Bellek genel bakışı](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
