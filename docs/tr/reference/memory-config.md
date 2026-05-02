---
read_when:
    - Bellek arama sağlayıcılarını veya gömme modellerini yapılandırmak istiyorsunuz
    - QMD arka ucunu kurmak istiyorsunuz
    - Hibrit aramayı, MMR'yi veya zamansal azalmayı ayarlamak istiyorsunuz
    - Çok modlu bellek indekslemeyi etkinleştirmek istiyorsunuz
sidebarTitle: Memory config
summary: Bellek araması, yerleştirme sağlayıcıları, QMD, hibrit arama ve çok modlu dizinleme için tüm yapılandırma ayarları
title: Bellek yapılandırması başvurusu
x-i18n:
    generated_at: "2026-05-02T09:06:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11c4723b536338a777ec45673ca3c1a8c26834d6875dd4eb96617a570a55c5f5
    source_path: reference/memory-config.md
    workflow: 16
---

Bu sayfa, OpenClaw bellek araması için tüm yapılandırma ayarlarını listeler. Kavramsal genel bakışlar için bkz.:

<CardGroup cols={2}>
  <Card title="Belleğe genel bakış" href="/tr/concepts/memory">
    Belleğin nasıl çalıştığı.
  </Card>
  <Card title="Yerleşik motor" href="/tr/concepts/memory-builtin">
    Varsayılan SQLite arka ucu.
  </Card>
  <Card title="QMD motoru" href="/tr/concepts/memory-qmd">
    Yerel öncelikli sidecar.
  </Card>
  <Card title="Bellek araması" href="/tr/concepts/memory-search">
    Arama hattı ve ayarlama.
  </Card>
  <Card title="Active Memory" href="/tr/concepts/active-memory">
    Etkileşimli oturumlar için bellek alt ajanı.
  </Card>
</CardGroup>

Aksi belirtilmedikçe tüm bellek araması ayarları `openclaw.json` içinde `agents.defaults.memorySearch` altında bulunur.

<Note>
**Active Memory** özellik anahtarını ve alt ajan yapılandırmasını arıyorsanız, bu `memorySearch` yerine `plugins.entries.active-memory` altında bulunur.

Active Memory iki kapılı bir model kullanır:

1. Plugin etkin olmalı ve geçerli ajan kimliğini hedeflemelidir
2. istek, uygun bir etkileşimli kalıcı sohbet oturumu olmalıdır

Etkinleştirme modeli, Plugin'e ait yapılandırma, transcript kalıcılığı ve güvenli kullanıma alma deseni için [Active Memory](/tr/concepts/active-memory) bölümüne bakın.
</Note>

---

## Sağlayıcı seçimi

| Anahtar   | Tür       | Varsayılan       | Açıklama                                                                                                                                                                                                                           |
| --------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | otomatik algılanır | `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` veya `voyage` gibi gömme bağdaştırıcısı kimliği; `api` değeri bu bağdaştırıcılardan birini işaret eden yapılandırılmış bir `models.providers.<id>` de olabilir |
| `model`    | `string`  | sağlayıcı varsayılanı | Gömme modeli adı                                                                                                                                                                                                                   |
| `fallback` | `string`  | `"none"`         | Birincil başarısız olduğunda kullanılacak yedek bağdaştırıcı kimliği                                                                                                                                                               |
| `enabled`  | `boolean` | `true`           | Bellek aramasını etkinleştirir veya devre dışı bırakır                                                                                                                                                                             |

### Otomatik algılama sırası

`provider` ayarlanmamışsa OpenClaw ilk kullanılabilir olanı seçer:

<Steps>
  <Step title="local">
    `memorySearch.local.modelPath` yapılandırılmışsa ve dosya varsa seçilir.
  </Step>
  <Step title="github-copilot">
    GitHub Copilot token'ı çözümlenebiliyorsa seçilir (env var veya auth profili).
  </Step>
  <Step title="openai">
    OpenAI anahtarı çözümlenebiliyorsa seçilir.
  </Step>
  <Step title="gemini">
    Gemini anahtarı çözümlenebiliyorsa seçilir.
  </Step>
  <Step title="voyage">
    Voyage anahtarı çözümlenebiliyorsa seçilir.
  </Step>
  <Step title="mistral">
    Mistral anahtarı çözümlenebiliyorsa seçilir.
  </Step>
  <Step title="deepinfra">
    DeepInfra anahtarı çözümlenebiliyorsa seçilir.
  </Step>
  <Step title="bedrock">
    AWS SDK kimlik bilgisi zinciri çözümlenirse seçilir (instance rolü, erişim anahtarları, profil, SSO, web kimliği veya paylaşılan yapılandırma).
  </Step>
</Steps>

`ollama` desteklenir ancak otomatik algılanmaz (açıkça ayarlayın).

### Özel sağlayıcı kimlikleri

`memorySearch.provider`, özel bir `models.providers.<id>` girdisini işaret edebilir. OpenClaw, uç nokta, auth ve model öneki işleme için özel sağlayıcı kimliğini korurken gömme bağdaştırıcısı için bu sağlayıcının `api` sahibini çözümler. Bu, çoklu GPU veya çoklu ana makine kurulumlarının bellek gömmelerini belirli bir yerel uç noktaya ayırmasına olanak tanır:

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

Uzak gömmeler bir API anahtarı gerektirir. Bedrock bunun yerine AWS SDK varsayılan kimlik bilgisi zincirini kullanır (instance rolleri, SSO, erişim anahtarları).

| Sağlayıcı      | Env var                                            | Yapılandırma anahtarı               |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS kimlik bilgisi zinciri                         | API anahtarı gerekmez               |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Cihaz girişi üzerinden auth profili |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (yer tutucu)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth yalnızca sohbet/tamamlamaları kapsar ve gömme isteklerini karşılamaz.
</Note>

---

## Uzak uç nokta yapılandırması

Özel OpenAI uyumlu uç noktalar veya sağlayıcı varsayılanlarını geçersiz kılmak için:

<ParamField path="remote.baseUrl" type="string">
  Özel API taban URL'si.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API anahtarını geçersiz kılın.
</ParamField>
<ParamField path="remote.headers" type="object">
  Ek HTTP üst bilgileri (sağlayıcı varsayılanlarıyla birleştirilir).
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

## Sağlayıcıya özgü yapılandırma

<AccordionGroup>
  <Accordion title="Gemini">
    | Anahtar                | Tür      | Varsayılan             | Açıklama                                   |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` de desteklenir |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 için: 768, 1536 veya 3072      |

    <Warning>
    Modelin veya `outputDimensionality` değerinin değiştirilmesi otomatik tam yeniden indekslemeyi tetikler.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI uyumlu giriş türleri">
    OpenAI uyumlu gömme uç noktaları, sağlayıcıya özgü `input_type` istek alanlarını kullanmayı seçebilir. Bu, sorgu ve belge gömmeleri için farklı etiketler gerektiren asimetrik gömme modellerinde kullanışlıdır.

    | Anahtar             | Tür      | Varsayılan | Açıklama                                                   |
    | ------------------- | -------- | ---------- | ---------------------------------------------------------- |
    | `inputType`         | `string` | ayarlanmamış | Sorgu ve belge gömmeleri için paylaşılan `input_type`      |
    | `queryInputType`    | `string` | ayarlanmamış | Sorgu zamanlı `input_type`; `inputType` değerini geçersiz kılar |
    | `documentInputType` | `string` | ayarlanmamış | Dizin/belge `input_type`; `inputType` değerini geçersiz kılar |

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

    Bu değerlerin değiştirilmesi, sağlayıcı toplu indeksleme için gömme önbelleği kimliğini etkiler ve yukarı akış modeli etiketleri farklı ele alıyorsa ardından bellek yeniden indekslemesi yapılmalıdır.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock, AWS SDK varsayılan kimlik bilgisi zincirini kullanır; API anahtarları gerekmez. OpenClaw, Bedrock etkin instance rolüne sahip EC2 üzerinde çalışıyorsa yalnızca sağlayıcıyı ve modeli ayarlayın:

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

    | Anahtar                | Tür      | Varsayılan                    | Açıklama                         |
    | ---------------------- | -------- | ------------------------------ | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Herhangi bir Bedrock gömme modeli kimliği |
    | `outputDimensionality` | `number` | model varsayılanı              | Titan V2 için: 256, 512 veya 1024 |

    **Desteklenen modeller** (aile algılama ve boyut varsayılanlarıyla):

    | Model Kimliği                              | Sağlayıcı  | Varsayılan Boyutlar | Yapılandırılabilir Boyutlar |
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

    Aktarım hızı sonekli varyantlar (ör. `amazon.titan-embed-text-v1:2:8k`) temel modelin yapılandırmasını devralır.

    **Kimlik doğrulama:** Bedrock auth, standart AWS SDK kimlik bilgisi çözümleme sırasını kullanır:

    1. Ortam değişkenleri (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO token önbelleği
    3. Web kimliği token kimlik bilgileri
    4. Paylaşılan kimlik bilgileri ve yapılandırma dosyaları
    5. ECS veya EC2 metadata kimlik bilgileri

    Bölge `AWS_REGION`, `AWS_DEFAULT_REGION`, `amazon-bedrock` sağlayıcı `baseUrl` değerinden çözümlenir veya varsayılan olarak `us-east-1` kullanılır.

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
    | `local.modelPath`    | `string`           | otomatik indirilen     | GGUF model dosyasının yolu                                                                                                                                                                                                                                                                                         |
    | `local.modelCacheDir` | `string`          | node-llama-cpp varsayılanı | İndirilen modeller için önbellek dizini                                                                                                                                                                                                                                                                        |
    | `local.contextSize`  | `number \| "auto"` | `4096`                 | Gömme bağlamı için bağlam penceresi boyutu. 4096, tipik parçaları (128–512 token) kapsarken ağırlık dışı VRAM kullanımını sınırlar. Kısıtlı ana makinelerde 1024–2048'e düşürün. `"auto"` modelin eğitilmiş maksimum değerini kullanır; 8B+ modeller için önerilmez (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM, 4096'da ise ~8.8 GB). |

    Varsayılan model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, otomatik indirilir). Kaynak checkout'ları hâlâ yerel derleme onayı gerektirir: `pnpm approve-builds` ardından `pnpm rebuild node-llama-cpp`.

    Gateway'in kullandığı aynı sağlayıcı yolunu doğrulamak için bağımsız CLI'yi kullanın:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    `provider` `auto` ise `local` yalnızca `local.modelPath` mevcut bir yerel dosyaya işaret ettiğinde seçilir. `hf:` ve HTTP(S) model başvuruları `provider: "local"` ile açıkça kullanılabilir, ancak model diskte kullanılabilir olmadan önce `auto` seçiminin yereli seçmesini sağlamazlar.

  </Accordion>
</AccordionGroup>

### Satır içi gömme zaman aşımı

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Bellek dizinleme sırasında satır içi gömme toplu işlemleri için zaman aşımını geçersiz kılın.

Ayarlanmadığında sağlayıcı varsayılanı kullanılır: `local`, `ollama` ve `lmstudio` gibi yerel/kendi kendine barındırılan sağlayıcılar için 600 saniye, barındırılan sağlayıcılar için 120 saniye. Yerel CPU'ya bağlı gömme toplu işlemleri sağlıklı ancak yavaş olduğunda bunu artırın.
</ParamField>

---

## Hibrit arama yapılandırması

Tümü `memorySearch.query.hybrid` altında:

| Anahtar              | Tür       | Varsayılan | Açıklama                          |
| -------------------- | --------- | ---------- | --------------------------------- |
| `enabled`            | `boolean` | `true`     | Hibrit BM25 + vektör aramayı etkinleştir |
| `vectorWeight`       | `number`  | `0.7`      | Vektör puanları için ağırlık (0-1) |
| `textWeight`         | `number`  | `0.3`      | BM25 puanları için ağırlık (0-1)  |
| `candidateMultiplier` | `number` | `4`        | Aday havuzu boyutu çarpanı        |

<Tabs>
  <Tab title="MMR (çeşitlilik)">
    | Anahtar      | Tür       | Varsayılan | Açıklama                              |
    | ------------ | --------- | ---------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`    | MMR yeniden sıralamayı etkinleştir     |
    | `mmr.lambda` | `number`  | `0.7`      | 0 = en yüksek çeşitlilik, 1 = en yüksek alaka |
  </Tab>
  <Tab title="Zamansal azalma (güncellik)">
    | Anahtar                     | Tür       | Varsayılan | Açıklama                    |
    | --------------------------- | --------- | ---------- | --------------------------- |
    | `temporalDecay.enabled`     | `boolean` | `false`    | Güncellik artışını etkinleştir |
    | `temporalDecay.halfLifeDays` | `number` | `30`       | Puan her N günde yarıya iner |

    Her zaman güncel dosyalar (`MEMORY.md`, `memory/` içindeki tarih içermeyen dosyalar) hiçbir zaman azaltılmaz.

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

| Anahtar      | Tür        | Açıklama                               |
| ------------ | ---------- | -------------------------------------- |
| `extraPaths` | `string[]` | Dizinlenecek ek dizinler veya dosyalar |

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

Yollar mutlak veya çalışma alanına göre göreli olabilir. Dizinler `.md` dosyaları için özyinelemeli olarak taranır. Sembolik bağlantı işleme etkin arka uca bağlıdır: yerleşik motor sembolik bağlantıları yok sayarken QMD, alttaki QMD tarayıcısı davranışını izler.

Aracı kapsamlı aracılar arası transkript araması için `memory.qmd.paths` yerine `agents.list[].memorySearch.qmd.extraCollections` kullanın. Bu ek koleksiyonlar aynı `{ path, name, pattern? }` biçimini izler, ancak aracı başına birleştirilir ve yol geçerli çalışma alanının dışını işaret ettiğinde açık paylaşılan adları koruyabilir. Aynı çözümlenmiş yol hem `memory.qmd.paths` hem de `memorySearch.qmd.extraCollections` içinde görünürse QMD ilk girdiyi tutar ve yineleneni atlar.

---

## Çok modlu bellek (Gemini)

Gemini Embedding 2 kullanarak görüntüleri ve sesi Markdown ile birlikte dizinleyin:

| Anahtar                  | Tür        | Varsayılan | Açıklama                              |
| ------------------------ | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`     | `boolean`  | `false`    | Çok modlu dizinlemeyi etkinleştir     |
| `multimodal.modalities`  | `string[]` | --         | `["image"]`, `["audio"]` veya `["all"]` |
| `multimodal.maxFileBytes` | `number`  | `10000000` | Dizinleme için maksimum dosya boyutu  |

<Note>
Yalnızca `extraPaths` içindeki dosyalar için geçerlidir. Varsayılan bellek kökleri yalnızca Markdown olarak kalır. `gemini-embedding-2-preview` gerektirir. `fallback` `"none"` olmalıdır.
</Note>

Desteklenen biçimler: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (görseller); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ses).

---

## Gömme önbelleği

| Anahtar            | Tür       | Varsayılan | Açıklama                              |
| ------------------ | --------- | ---------- | ------------------------------------- |
| `cache.enabled`    | `boolean` | `false`    | Parça gömmelerini SQLite'ta önbelleğe al |
| `cache.maxEntries` | `number`  | `50000`    | En fazla önbelleğe alınan gömme       |

Yeniden dizinleme veya konuşma dökümü güncellemeleri sırasında değişmemiş metnin yeniden gömülmesini önler.

---

## Toplu dizinleme

| Anahtar                      | Tür       | Varsayılan | Açıklama                    |
| ---------------------------- | --------- | ---------- | --------------------------- |
| `remote.nonBatchConcurrency` | `number`  | `4`        | Paralel satır içi gömmeler  |
| `remote.batch.enabled`       | `boolean` | `false`    | Toplu gömme API'sini etkinleştir |
| `remote.batch.concurrency`   | `number`  | `2`        | Paralel toplu işler         |
| `remote.batch.wait`          | `boolean` | `true`     | Toplu işlemin tamamlanmasını bekle |
| `remote.batch.pollIntervalMs` | `number` | --         | Yoklama aralığı             |
| `remote.batch.timeoutMinutes` | `number` | --         | Toplu işlem zaman aşımı     |

`openai`, `gemini` ve `voyage` için kullanılabilir. OpenAI toplu işleme, büyük geriye dönük doldurmalar için genellikle en hızlı ve en ucuz seçenektir.

`remote.nonBatchConcurrency`, yerel/kendi barındırılan sağlayıcılar tarafından ve sağlayıcı toplu işlem API'leri etkin olmadığında barındırılan sağlayıcılar tarafından kullanılan satır içi gömme çağrılarını kontrol eder. Ollama, daha küçük yerel ana makineleri zorlamamak için toplu olmayan dizinlemede varsayılan olarak `1` kullanır; daha büyük makinelerde daha yüksek bir değer ayarlayın.

Bu, satır içi gömme çağrıları için zaman aşımını kontrol eden `sync.embeddingBatchTimeoutSeconds` ayarından ayrıdır.

---

## Oturum belleği araması (deneysel)

Oturum konuşma dökümlerini dizinleyin ve `memory_search` üzerinden gösterin:

| Anahtar                      | Tür        | Varsayılan  | Açıklama                                  |
| ---------------------------- | ---------- | ----------- | ----------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`     | Oturum dizinlemeyi etkinleştir            |
| `sources`                    | `string[]` | `["memory"]` | Konuşma dökümlerini dahil etmek için `"sessions"` ekle |
| `sync.sessions.deltaBytes`   | `number`   | `100000`    | Yeniden dizinleme için bayt eşiği         |
| `sync.sessions.deltaMessages` | `number`  | `50`        | Yeniden dizinleme için ileti eşiği        |

<Warning>
Oturum dizinleme isteğe bağlıdır ve eşzamansız çalışır. Sonuçlar biraz eski olabilir. Oturum günlükleri diskte bulunur, bu nedenle dosya sistemi erişimini güven sınırı olarak ele alın.
</Warning>

---

## SQLite vektör hızlandırma (sqlite-vec)

| Anahtar                     | Tür       | Varsayılan | Açıklama                              |
| --------------------------- | --------- | ---------- | ------------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`     | Vektör sorguları için sqlite-vec kullan |
| `store.vector.extensionPath` | `string` | paketle gelen | sqlite-vec yolunu geçersiz kıl       |

sqlite-vec kullanılamadığında OpenClaw otomatik olarak işlem içi kosinüs benzerliğine geri döner.

---

## Dizin depolama

| Anahtar               | Tür      | Varsayılan                            | Açıklama                                      |
| --------------------- | -------- | ------------------------------------- | --------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Dizin konumu (`{agentId}` belirtecini destekler) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 belirteçleyici (`unicode61` veya `trigram`) |

---

## QMD arka uç yapılandırması

Etkinleştirmek için `memory.backend = "qmd"` ayarlayın. Tüm QMD ayarları `memory.qmd` altında bulunur:

| Anahtar                 | Tür       | Varsayılan | Açıklama                                                                           |
| ----------------------- | --------- | ---------- | ---------------------------------------------------------------------------------- |
| `command`               | `string`  | `qmd`      | QMD çalıştırılabilir yolu; hizmet `PATH` değeri kabuğunuzdan farklıysa mutlak yol ayarlayın |
| `searchMode`            | `string`  | `search`   | Arama komutu: `search`, `vsearch`, `query`                                         |
| `includeDefaultMemory`  | `boolean` | `true`     | `MEMORY.md` + `memory/**/*.md` otomatik dizinlensin                                |
| `paths[]`               | `array`   | --         | Ek yollar: `{ name, path, pattern? }`                                              |
| `sessions.enabled`      | `boolean` | `false`    | Oturum konuşma dökümlerini dizinle                                                |
| `sessions.retentionDays` | `number` | --         | Konuşma dökümü saklama süresi                                                      |
| `sessions.exportDir`    | `string`  | --         | Dışa aktarma dizini                                                                |

`searchMode: "search"` sözcüksel/BM25'e özeldir. OpenClaw bu mod için, `memory status --deep` sırasında da dahil olmak üzere, anlamsal vektör hazırlık yoklamaları veya QMD gömme bakımı çalıştırmaz; `vsearch` ve `query` QMD vektör hazırlığı ve gömmeleri gerektirmeye devam eder.

OpenClaw güncel QMD koleksiyonunu ve MCP sorgu biçimlerini tercih eder, ancak gerektiğinde uyumlu koleksiyon desen bayraklarını ve eski MCP araç adlarını deneyerek eski QMD sürümlerinin çalışmasını sürdürür. QMD birden fazla koleksiyon filtresi desteği bildirdiğinde, aynı kaynaklı koleksiyonlar tek bir QMD işlemiyle aranır; eski QMD derlemeleri koleksiyon başına uyumluluk yolunu korur. Aynı kaynak, kalıcı bellek koleksiyonlarının birlikte gruplanması anlamına gelir; oturum dökümü koleksiyonları ise ayrı bir grup olarak kalır, böylece kaynak çeşitlendirmesi hâlâ iki girdiye de sahip olur.

<Note>
QMD model geçersiz kılmaları OpenClaw yapılandırmasında değil, QMD tarafında kalır. QMD'nin modellerini genel olarak geçersiz kılmanız gerekiyorsa, gateway çalışma zamanı ortamında `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` ve `QMD_GENERATE_MODEL` gibi ortam değişkenlerini ayarlayın.
</Note>

<AccordionGroup>
  <Accordion title="Update schedule">
    | Anahtar                   | Tür       | Varsayılan | Açıklama                              |
    | ------------------------- | --------- | ---------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`       | Yenileme aralığı                      |
    | `update.debounceMs`       | `number`  | `15000`    | Dosya değişikliklerini debounce uygula |
    | `update.onBoot`           | `boolean` | `true`     | Uzun ömürlü QMD yöneticisi açıldığında yenile; ayrıca başlangıçta isteğe bağlı yenilemeyi de denetler |
    | `update.startup`          | `string`  | `off`      | İsteğe bağlı gateway başlangıç yenilemesi: `off`, `idle` veya `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`   | `startup: "idle"` yenilemesi çalışmadan önceki gecikme |
    | `update.waitForBootSync`  | `boolean` | `false`    | İlk yenilemesi tamamlanana kadar yönetici açılışını engelle |
    | `update.embedInterval`    | `string`  | --         | Ayrı gömme ritmi                      |
    | `update.commandTimeoutMs` | `number`  | --         | QMD komutları için zaman aşımı        |
    | `update.updateTimeoutMs`  | `number`  | --         | QMD güncelleme işlemleri için zaman aşımı |
    | `update.embedTimeoutMs`   | `number`  | --         | QMD gömme işlemleri için zaman aşımı  |
  </Accordion>
  <Accordion title="Limits">
    | Anahtar                   | Tür      | Varsayılan | Açıklama                              |
    | ------------------------- | -------- | ---------- | ------------------------------------- |
    | `limits.maxResults`       | `number` | `6`        | Maksimum arama sonucu                 |
    | `limits.maxSnippetChars`  | `number` | --         | Parça uzunluğunu sınırla              |
    | `limits.maxInjectedChars` | `number` | --         | Eklenen toplam karakter sayısını sınırla |
    | `limits.timeoutMs`        | `number` | `4000`     | Arama zaman aşımı                     |
  </Accordion>
  <Accordion title="Scope">
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

    Gönderilen varsayılan, grupları reddetmeye devam ederken doğrudan ve kanal oturumlarına izin verir.

    Varsayılan yalnızca DM'dir. `match.keyPrefix` normalleştirilmiş oturum anahtarıyla eşleşir; `match.rawKeyPrefix` `agent:<id>:` dahil ham anahtarla eşleşir.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` tüm arka uçlara uygulanır:

    | Değer            | Davranış                                           |
    | ---------------- | -------------------------------------------------- |
    | `auto` (varsayılan) | Parçalara `Source: <path#line>` alt bilgisini ekle |
    | `on`             | Alt bilgiyi her zaman ekle                         |
    | `off`            | Alt bilgiyi atla (yol yine dahili olarak aracıya iletilir) |

  </Accordion>
</AccordionGroup>

QMD önyükleme yenilemeleri, gateway başlangıcı sırasında tek seferlik bir alt süreç yolu kullanır. Bellek araması etkileşimli kullanım için açıldığında, düzenli dosya izleyicisinin ve aralık zamanlayıcılarının sahibi hâlâ uzun ömürlü QMD yöneticisidir.

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

Dreaming tek bir zamanlanmış tarama olarak çalışır ve bir uygulama ayrıntısı olarak dahili hafif/derin/REM aşamalarını kullanır.

Kavramsal davranış ve slash komutları için bkz. [Dreaming](/tr/concepts/dreaming).

### Kullanıcı ayarları

| Anahtar    | Tür       | Varsayılan       | Açıklama                                      |
| ---------- | --------- | ---------------- | --------------------------------------------- |
| `enabled`  | `boolean` | `false`          | Dreaming'i tamamen etkinleştir veya devre dışı bırak |
| `frequency` | `string` | `0 3 * * *`      | Tam Dreaming taraması için isteğe bağlı Cron ritmi |
| `model`    | `string`  | varsayılan model | İsteğe bağlı Dream Diary alt aracı model geçersiz kılması |

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
- Dreaming insan tarafından okunabilir anlatı çıktısını `DREAMS.md` dosyasına (veya mevcut `dreams.md` dosyasına) yazar.
- `dreaming.model` mevcut Plugin alt aracı güven kapısını kullanır; etkinleştirmeden önce `plugins.entries.memory-core.subagent.allowModelOverride: true` ayarını yapın.
- Dream Diary, yapılandırılmış model kullanılamadığında oturum varsayılan modeliyle bir kez yeniden dener. Güven veya izin listesi hataları günlüğe kaydedilir ve sessizce yeniden denenmez.
- Hafif/derin/REM aşama ilkesi ve eşikleri, kullanıcıya yönelik yapılandırma değil, dahili davranıştır.

</Note>

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
