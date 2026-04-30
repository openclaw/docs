---
read_when:
    - Bellek arama sağlayıcılarını veya gömme modellerini yapılandırmak istiyorsunuz
    - QMD arka ucunu kurmak istiyorsunuz
    - Hibrit aramayı, MMR'yi veya zamansal azalmayı ayarlamak istiyorsunuz
    - Çok modlu bellek dizinlemeyi etkinleştirmek istiyorsunuz
sidebarTitle: Memory config
summary: Bellek araması, gömme sağlayıcıları, QMD, hibrit arama ve çok modlu indeksleme için tüm yapılandırma ayarları
title: Bellek yapılandırması referansı
x-i18n:
    generated_at: "2026-04-30T09:43:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
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
    Yerel öncelikli sidecar.
  </Card>
  <Card title="Bellek araması" href="/tr/concepts/memory-search">
    Arama işlem hattı ve ayarlama.
  </Card>
  <Card title="Active Memory" href="/tr/concepts/active-memory">
    Etkileşimli oturumlar için bellek alt aracısı.
  </Card>
</CardGroup>

Aksi belirtilmedikçe tüm bellek araması ayarları `openclaw.json` içinde `agents.defaults.memorySearch` altında bulunur.

<Note>
**Active Memory** özellik anahtarını ve alt aracı yapılandırmasını arıyorsanız, bu `memorySearch` yerine `plugins.entries.active-memory` altında bulunur.

Active Memory iki kapılı bir model kullanır:

1. Plugin etkinleştirilmeli ve geçerli aracı kimliğini hedeflemelidir
2. İstek, uygun bir etkileşimli kalıcı sohbet oturumu olmalıdır

Etkinleştirme modeli, Plugin tarafından sahiplenilen yapılandırma, transkript kalıcılığı ve güvenli dağıtım deseni için bkz. [Active Memory](/tr/concepts/active-memory).
</Note>

---

## Sağlayıcı seçimi

| Anahtar   | Tür       | Varsayılan            | Açıklama                                                                                                                                                                                                                         |
| --------- | --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | otomatik algılanır    | `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` veya `voyage` gibi gömme bağdaştırıcısı kimliği; `api` değeri bu bağdaştırıcılardan birine işaret eden yapılandırılmış bir `models.providers.<id>` de olabilir |
| `model`    | `string`  | sağlayıcı varsayılanı | Gömme modeli adı                                                                                                                                                                                                                 |
| `fallback` | `string`  | `"none"`              | Birincil başarısız olduğunda kullanılacak yedek bağdaştırıcı kimliği                                                                                                                                                             |
| `enabled`  | `boolean` | `true`                | Bellek aramasını etkinleştir veya devre dışı bırak                                                                                                                                                                               |

### Otomatik algılama sırası

`provider` ayarlanmadığında OpenClaw ilk kullanılabilir olanı seçer:

<Steps>
  <Step title="local">
    `memorySearch.local.modelPath` yapılandırılmışsa ve dosya mevcutsa seçilir.
  </Step>
  <Step title="github-copilot">
    GitHub Copilot belirteci çözümlenebiliyorsa seçilir (ortam değişkeni veya kimlik doğrulama profili).
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
    AWS SDK kimlik bilgisi zinciri çözümlenirse seçilir (instance role, erişim anahtarları, profil, SSO, web kimliği veya paylaşılan yapılandırma).
  </Step>
</Steps>

`ollama` desteklenir ancak otomatik algılanmaz (açıkça ayarlayın).

### Özel sağlayıcı kimlikleri

`memorySearch.provider`, özel bir `models.providers.<id>` girdisine işaret edebilir. OpenClaw, endpoint, kimlik doğrulama ve model öneki işleme için özel sağlayıcı kimliğini korurken gömme bağdaştırıcısı için bu sağlayıcının `api` sahibini çözümler. Bu, çoklu GPU veya çoklu host kurulumlarının bellek gömmelerini belirli bir yerel endpoint'e ayırmasına olanak tanır:

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

Uzak gömmeler bir API anahtarı gerektirir. Bedrock bunun yerine AWS SDK varsayılan kimlik bilgisi zincirini kullanır (instance role'ler, SSO, erişim anahtarları).

| Sağlayıcı      | Ortam değişkeni                                  | Yapılandırma anahtarı              |
| -------------- | ------------------------------------------------ | ---------------------------------- |
| Bedrock        | AWS kimlik bilgisi zinciri                       | API anahtarı gerekmez              |
| DeepInfra      | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`   |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Cihazla oturum açma üzerinden kimlik doğrulama profili |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey`  |
| Ollama         | `OLLAMA_API_KEY` (yer tutucu)                    | --                                 |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`   |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`   |

<Note>
Codex OAuth yalnızca sohbet/tamamlama işlemlerini kapsar ve gömme isteklerini karşılamaz.
</Note>

---

## Uzak endpoint yapılandırması

Özel OpenAI uyumlu endpoint'ler veya sağlayıcı varsayılanlarını geçersiz kılmak için:

<ParamField path="remote.baseUrl" type="string">
  Özel API temel URL'si.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API anahtarını geçersiz kıl.
</ParamField>
<ParamField path="remote.headers" type="object">
  Ek HTTP başlıkları (sağlayıcı varsayılanlarıyla birleştirilir).
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
    | Anahtar               | Tür      | Varsayılan             | Açıklama                                   |
    | --------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`               | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` de desteklenir |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 için: 768, 1536 veya 3072      |

    <Warning>
    Modeli veya `outputDimensionality` değerini değiştirmek otomatik tam yeniden indekslemeyi tetikler.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI uyumlu girdi türleri">
    OpenAI uyumlu gömme endpoint'leri, sağlayıcıya özgü `input_type` istek alanlarına katılabilir. Bu, sorgu ve belge gömmeleri için farklı etiketler gerektiren asimetrik gömme modellerinde kullanışlıdır.

    | Anahtar             | Tür      | Varsayılan | Açıklama                                             |
    | ------------------- | -------- | ---------- | ---------------------------------------------------- |
    | `inputType`         | `string` | ayarlanmamış | Sorgu ve belge gömmeleri için ortak `input_type`     |
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

    Bu değerlerin değiştirilmesi, sağlayıcı toplu indeksleme için gömme önbelleği kimliğini etkiler ve upstream model etiketleri farklı ele aldığında bunun ardından bellek yeniden indekslemesi yapılmalıdır.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock, AWS SDK varsayılan kimlik bilgisi zincirini kullanır; API anahtarları gerekmez. OpenClaw, Bedrock etkin bir instance role ile EC2 üzerinde çalışıyorsa yalnızca sağlayıcıyı ve modeli ayarlayın:

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

    Aktarım hızı sonekli varyantlar (ör. `amazon.titan-embed-text-v1:2:8k`) temel modelin yapılandırmasını devralır.

    **Kimlik doğrulama:** Bedrock kimlik doğrulaması standart AWS SDK kimlik bilgisi çözümleme sırasını kullanır:

    1. Ortam değişkenleri (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO belirteç önbelleği
    3. Web kimliği belirteci kimlik bilgileri
    4. Paylaşılan kimlik bilgileri ve yapılandırma dosyaları
    5. ECS veya EC2 meta veri kimlik bilgileri

    Bölge `AWS_REGION`, `AWS_DEFAULT_REGION`, `amazon-bedrock` sağlayıcısı `baseUrl` üzerinden çözümlenir veya varsayılan olarak `us-east-1` kullanılır.

    **IAM izinleri:** IAM rolü veya kullanıcısı şuna ihtiyaç duyar:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    En az ayrıcalık için `InvokeModel` kapsamını belirli modelle sınırlandırın:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Yerel (GGUF + node-llama-cpp)">
    | Anahtar              | Tür                | Varsayılan             | Açıklama                                                                                                                                                                                                                                                                                                            |
    | -------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | otomatik indirilir     | GGUF model dosyasının yolu                                                                                                                                                                                                                                                                                         |
    | `local.modelCacheDir` | `string`           | node-llama-cpp varsayılanı | İndirilen modeller için önbellek dizini                                                                                                                                                                                                                                                                         |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Gömme bağlamı için bağlam penceresi boyutu. 4096, tipik parçaları (128-512 token) kapsarken ağırlık dışı VRAM'i sınırlar. Kısıtlı ana makinelerde 1024-2048'e düşürün. `"auto"` modelin eğitilmiş maksimumunu kullanır; 8B+ modeller için önerilmez (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM, 4096'da ~8.8 GB). |

    Varsayılan model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, otomatik indirilir). Yerel derleme gerektirir: `pnpm approve-builds`, ardından `pnpm rebuild node-llama-cpp`.

    Gateway'in kullandığı aynı sağlayıcı yolunu doğrulamak için bağımsız CLI'yi kullanın:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    `provider` `auto` ise `local`, yalnızca `local.modelPath` mevcut bir yerel dosyaya işaret ettiğinde seçilir. `hf:` ve HTTP(S) model referansları `provider: "local"` ile hâlâ açıkça kullanılabilir, ancak model diskte kullanılabilir olmadan önce `auto`'nun yereli seçmesini sağlamazlar.

  </Accordion>
</AccordionGroup>

### Satır içi gömme zaman aşımı

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Bellek indeksleme sırasında satır içi gömme grupları için zaman aşımını geçersiz kılın.

Ayarlanmadığında sağlayıcı varsayılanı kullanılır: `local`, `ollama` ve `lmstudio` gibi yerel/kendi barındırılan sağlayıcılar için 600 saniye, barındırılan sağlayıcılar için 120 saniye. Yerel CPU'ya bağlı gömme grupları sağlıklı ancak yavaş olduğunda bunu artırın.
</ParamField>

---

## Hibrit arama yapılandırması

Tümü `memorySearch.query.hybrid` altında:

| Anahtar              | Tür       | Varsayılan | Açıklama                         |
| -------------------- | --------- | ---------- | -------------------------------- |
| `enabled`             | `boolean` | `true`     | Hibrit BM25 + vektör aramayı etkinleştir |
| `vectorWeight`        | `number`  | `0.7`      | Vektör puanları için ağırlık (0-1) |
| `textWeight`          | `number`  | `0.3`      | BM25 puanları için ağırlık (0-1) |
| `candidateMultiplier` | `number`  | `4`        | Aday havuzu boyutu çarpanı       |

<Tabs>
  <Tab title="MMR (çeşitlilik)">
    | Anahtar       | Tür       | Varsayılan | Açıklama                            |
    | ------------- | --------- | ---------- | ----------------------------------- |
    | `mmr.enabled` | `boolean` | `false`    | MMR yeniden sıralamayı etkinleştir  |
    | `mmr.lambda`  | `number`  | `0.7`      | 0 = en yüksek çeşitlilik, 1 = en yüksek alaka |
  </Tab>
  <Tab title="Zamansal azalma (yenilik)">
    | Anahtar                      | Tür       | Varsayılan | Açıklama                     |
    | ---------------------------- | --------- | ---------- | ---------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`    | Yenilik artırmasını etkinleştir |
    | `temporalDecay.halfLifeDays` | `number`  | `30`       | Puan her N günde yarıya iner |

    Her zaman güncel dosyalar (`MEMORY.md`, `memory/` içindeki tarihsiz dosyalar) hiçbir zaman azaltılmaz.

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

Yollar mutlak veya çalışma alanına göre göreli olabilir. Dizinler `.md` dosyaları için özyinelemeli olarak taranır. Sembolik bağlantı işleme etkin arka uca bağlıdır: yerleşik motor sembolik bağlantıları yok sayarken QMD, alttaki QMD tarayıcı davranışını izler.

Aracı kapsamlı aracılar arası transkript araması için `memory.qmd.paths` yerine `agents.list[].memorySearch.qmd.extraCollections` kullanın. Bu ek koleksiyonlar aynı `{ path, name, pattern? }` yapısını izler, ancak aracı başına birleştirilir ve yol geçerli çalışma alanının dışını gösterdiğinde açık paylaşılan adları koruyabilir. Aynı çözümlenmiş yol hem `memory.qmd.paths` hem de `memorySearch.qmd.extraCollections` içinde görünürse QMD ilk girdiyi tutar ve yinelemeyi atlar.

---

## Çok modlu bellek (Gemini)

Gemini Embedding 2 kullanarak görselleri ve sesi Markdown ile birlikte indeksleyin:

| Anahtar                 | Tür        | Varsayılan | Açıklama                              |
| ----------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Çok modlu indekslemeyi etkinleştir    |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` veya `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | İndeksleme için maksimum dosya boyutu |

<Note>
Yalnızca `extraPaths` içindeki dosyalar için geçerlidir. Varsayılan bellek kökleri yalnızca Markdown olarak kalır. `gemini-embedding-2-preview` gerektirir. `fallback`, `"none"` olmalıdır.
</Note>

Desteklenen biçimler: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (görseller); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ses).

---

## Embedding önbelleği

| Anahtar           | Tür       | Varsayılan | Açıklama                                   |
| ----------------- | --------- | ---------- | ------------------------------------------ |
| `cache.enabled`   | `boolean` | `false`    | Parça embedding'lerini SQLite içinde önbelleğe al |
| `cache.maxEntries` | `number` | `50000`    | En fazla önbelleğe alınan embedding sayısı |

Yeniden indeksleme veya döküm güncellemeleri sırasında değişmemiş metin için yeniden embedding oluşturulmasını önler.

---

## Toplu indeksleme

| Anahtar                      | Tür       | Varsayılan | Açıklama                 |
| ---------------------------- | --------- | ---------- | ------------------------ |
| `remote.nonBatchConcurrency` | `number`  | `4`        | Paralel satır içi embedding'ler |
| `remote.batch.enabled`       | `boolean` | `false`    | Toplu embedding API'sini etkinleştir |
| `remote.batch.concurrency`   | `number`  | `2`        | Paralel toplu işler      |
| `remote.batch.wait`          | `boolean` | `true`     | Toplu işlemin tamamlanmasını bekle |
| `remote.batch.pollIntervalMs` | `number` | --         | Yoklama aralığı          |
| `remote.batch.timeoutMinutes` | `number` | --         | Toplu işlem zaman aşımı  |

`openai`, `gemini` ve `voyage` için kullanılabilir. OpenAI toplu işlem, büyük geriye dönük doldurmalar için genellikle en hızlı ve en ucuz seçenektir.

`remote.nonBatchConcurrency`, sağlayıcı toplu işlem API'leri etkin olmadığında yerel/kendi barındırılan sağlayıcılar ve barındırılan sağlayıcılar tarafından kullanılan satır içi embedding çağrılarını denetler. Ollama, daha küçük yerel ana makineleri aşırı yüklememek için toplu olmayan indekslemede varsayılan olarak `1` kullanır; daha büyük makinelerde daha yüksek bir değer ayarlayın.

Bu, satır içi embedding çağrıları için zaman aşımını denetleyen `sync.embeddingBatchTimeoutSeconds` ayarından ayrıdır.

---

## Oturum belleği araması (deneysel)

Oturum dökümlerini indeksleyin ve `memory_search` üzerinden yüzeye çıkarın:

| Anahtar                      | Tür        | Varsayılan  | Açıklama                              |
| ---------------------------- | ---------- | ----------- | ------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`     | Oturum indekslemeyi etkinleştir       |
| `sources`                    | `string[]` | `["memory"]` | Dökümleri dahil etmek için `"sessions"` ekle |
| `sync.sessions.deltaBytes`   | `number`   | `100000`    | Yeniden indeksleme için bayt eşiği    |
| `sync.sessions.deltaMessages` | `number`  | `50`        | Yeniden indeksleme için mesaj eşiği   |

<Warning>
Oturum indeksleme isteğe bağlıdır ve eşzamansız çalışır. Sonuçlar biraz eski olabilir. Oturum günlükleri diskte bulunur, bu nedenle dosya sistemi erişimini güven sınırı olarak değerlendirin.
</Warning>

---

## SQLite vektör hızlandırma (sqlite-vec)

| Anahtar                     | Tür       | Varsayılan | Açıklama                             |
| --------------------------- | --------- | ---------- | ------------------------------------ |
| `store.vector.enabled`      | `boolean` | `true`     | Vektör sorguları için sqlite-vec kullan |
| `store.vector.extensionPath` | `string` | paketle gelen | sqlite-vec yolunu geçersiz kıl       |

sqlite-vec kullanılamadığında OpenClaw otomatik olarak süreç içi kosinüs benzerliğine geri döner.

---

## İndeks depolama

| Anahtar              | Tür      | Varsayılan                            | Açıklama                                      |
| -------------------- | -------- | ------------------------------------- | --------------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite` | İndeks konumu (`{agentId}` belirtecini destekler) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | FTS5 tokenizer (`unicode61` veya `trigram`)   |

---

## QMD backend yapılandırması

Etkinleştirmek için `memory.backend = "qmd"` ayarlayın. Tüm QMD ayarları `memory.qmd` altında bulunur:

| Anahtar                 | Tür       | Varsayılan | Açıklama                                                                                 |
| ----------------------- | --------- | ---------- | ---------------------------------------------------------------------------------------- |
| `command`               | `string`  | `qmd`      | QMD yürütülebilir dosya yolu; hizmet `PATH` değeri kabuğunuzdan farklıysa mutlak yol ayarlayın |
| `searchMode`            | `string`  | `search`   | Arama komutu: `search`, `vsearch`, `query`                                                |
| `includeDefaultMemory`  | `boolean` | `true`     | `MEMORY.md` + `memory/**/*.md` otomatik indeksle                                          |
| `paths[]`               | `array`   | --         | Ek yollar: `{ name, path, pattern? }`                                                     |
| `sessions.enabled`      | `boolean` | `false`    | Oturum dökümlerini indeksle                                                              |
| `sessions.retentionDays` | `number` | --         | Döküm saklama süresi                                                                      |
| `sessions.exportDir`    | `string`  | --         | Dışa aktarma dizini                                                                      |

`searchMode: "search"` yalnızca sözcüksel/BM25 modudur. OpenClaw bu mod için `memory status --deep` sırasında dahil olmak üzere anlamsal vektör hazır olma yoklamaları veya QMD embedding bakımı çalıştırmaz; `vsearch` ve `query`, QMD vektör hazır olma durumunu ve embedding'leri gerektirmeye devam eder.

OpenClaw güncel QMD koleksiyon ve MCP sorgu biçimlerini tercih eder, ancak gerektiğinde uyumlu koleksiyon desen bayraklarını ve eski MCP araç adlarını deneyerek eski QMD sürümlerinin çalışmasını sürdürür. QMD birden fazla koleksiyon filtresi desteği bildirdiğinde, aynı kaynaklı koleksiyonlar tek bir QMD işlemiyle aranır; eski QMD derlemeleri koleksiyon başına uyumluluk yolunu korur. Aynı kaynak, kalıcı bellek koleksiyonlarının birlikte gruplandığı, oturum transkripti koleksiyonlarının ise ayrı bir grup olarak kaldığı anlamına gelir; böylece kaynak çeşitlendirmesinde hâlâ iki girdi bulunur.

<Note>
QMD model geçersiz kılmaları OpenClaw yapılandırmasında değil, QMD tarafında kalır. QMD'nin modellerini genel olarak geçersiz kılmanız gerekiyorsa Gateway çalışma zamanı ortamında `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` ve `QMD_GENERATE_MODEL` gibi ortam değişkenlerini ayarlayın.
</Note>

<AccordionGroup>
  <Accordion title="Güncelleme zamanlaması">
    | Anahtar                   | Tür       | Varsayılan | Açıklama                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Yenileme aralığı                      |
    | `update.debounceMs`       | `number`  | `15000` | Dosya değişikliklerinde debounce uygula                 |
    | `update.onBoot`           | `boolean` | `true`  | Uzun ömürlü QMD yöneticisi açıldığında yenile; ayrıca başlangıçta isteğe bağlı yenilemeyi denetler |
    | `update.startup`          | `string`  | `off`   | İsteğe bağlı Gateway başlangıç yenilemesi: `off`, `idle` veya `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` yenilemesi çalışmadan önceki gecikme |
    | `update.waitForBootSync`  | `boolean` | `false` | İlk yenilemesi tamamlanana kadar yönetici açılışını engelle |
    | `update.embedInterval`    | `string`  | --      | Ayrı embed temposu                |
    | `update.commandTimeoutMs` | `number`  | --      | QMD komutları için zaman aşımı              |
    | `update.updateTimeoutMs`  | `number`  | --      | QMD güncelleme işlemleri için zaman aşımı     |
    | `update.embedTimeoutMs`   | `number`  | --      | QMD embed işlemleri için zaman aşımı      |
  </Accordion>
  <Accordion title="Sınırlar">
    | Anahtar                   | Tür      | Varsayılan | Açıklama                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Maksimum arama sonucu         |
    | `limits.maxSnippetChars`  | `number` | --      | Parça uzunluğunu sınırla       |
    | `limits.maxInjectedChars` | `number` | --      | Toplam enjekte edilen karakterleri sınırla |
    | `limits.timeoutMs`        | `number` | `4000`  | Arama zaman aşımı             |
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

    Gönderilen varsayılan, grupları yine reddederken doğrudan ve kanal oturumlarına izin verir.

    Varsayılan yalnızca DM'dir. `match.keyPrefix` normalleştirilmiş oturum anahtarıyla eşleşir; `match.rawKeyPrefix`, `agent:<id>:` dahil ham anahtarla eşleşir.

  </Accordion>
  <Accordion title="Alıntılar">
    `memory.citations` tüm arka uçlara uygulanır:

    | Değer            | Davranış                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (varsayılan) | Parçalara `Source: <path#line>` alt bilgisini ekle    |
    | `on`             | Alt bilgiyi her zaman ekle                               |
    | `off`            | Alt bilgiyi atla (yol hâlâ dahili olarak ajana iletilir) |

  </Accordion>
</AccordionGroup>

QMD açılış yenilemeleri, Gateway başlangıcı sırasında tek kullanımlık bir alt işlem yolu kullanır. Uzun ömürlü QMD yöneticisi, bellek araması etkileşimli kullanım için açıldığında normal dosya izleyicisine ve aralık zamanlayıcılarına sahip olmaya devam eder.

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

Dreaming tek bir zamanlanmış tarama olarak çalışır ve iç hafif/derin/REM aşamalarını bir uygulama ayrıntısı olarak kullanır.

Kavramsal davranış ve eğik çizgi komutları için bkz. [Dreaming](/tr/concepts/dreaming).

### Kullanıcı ayarları

| Anahtar     | Tür       | Varsayılan    | Açıklama                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Dreaming'i tamamen etkinleştir veya devre dışı bırak               |
| `frequency` | `string`  | `0 3 * * *`   | Tam Dreaming taraması için isteğe bağlı cron temposu |
| `model`     | `string`  | varsayılan model | İsteğe bağlı Dream Diary alt ajan model geçersiz kılması      |

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
- `dreaming.model` mevcut Plugin alt ajan güven kapısını kullanır; etkinleştirmeden önce `plugins.entries.memory-core.subagent.allowModelOverride: true` ayarlayın.
- Dream Diary, yapılandırılan model kullanılamadığında oturumun varsayılan modeliyle bir kez yeniden dener. Güven veya izin listesi hataları günlüğe kaydedilir ve sessizce yeniden denenmez.
- Hafif/derin/REM aşama ilkesi ve eşikleri kullanıcıya yönelik yapılandırma değil, dahili davranıştır.

</Note>

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
