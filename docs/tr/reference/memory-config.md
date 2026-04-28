---
read_when:
    - Bellek arama sağlayıcılarını veya gömme modellerini yapılandırmak istiyorsunuz
    - QMD backend'ini kurmak istiyorsunuz
    - Hibrit aramayı, MMR'yi veya zamansal azalmayı ayarlamak istiyorsunuz
    - Çok kipli bellek indekslemeyi etkinleştirmek istiyorsunuz
sidebarTitle: Memory config
summary: Bellek araması, gömme sağlayıcıları, QMD, hibrit arama ve çok kipli indeksleme için tüm yapılandırma ayarları
title: Bellek yapılandırma başvurusu
x-i18n:
    generated_at: "2026-04-26T11:40:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

Bu sayfa, OpenClaw bellek araması için tüm yapılandırma ayarlarını listeler. Kavramsal genel bakışlar için bkz.:

<CardGroup cols={2}>
  <Card title="Bellek genel bakışı" href="/tr/concepts/memory">
    Belleğin nasıl çalıştığı.
  </Card>
  <Card title="Yerleşik motor" href="/tr/concepts/memory-builtin">
    Varsayılan SQLite backend'i.
  </Card>
  <Card title="QMD motoru" href="/tr/concepts/memory-qmd">
    Yerel öncelikli sidecar.
  </Card>
  <Card title="Bellek araması" href="/tr/concepts/memory-search">
    Arama işlem hattı ve ayarlama.
  </Card>
  <Card title="Active Memory" href="/tr/concepts/active-memory">
    Etkileşimli oturumlar için bellek alt ajanı.
  </Card>
</CardGroup>

Aksi belirtilmedikçe tüm bellek arama ayarları `openclaw.json` içinde `agents.defaults.memorySearch` altında bulunur.

<Note>
**Active Memory** özellik anahtarını ve alt ajan yapılandırmasını arıyorsanız, bu ayarlar `memorySearch` yerine `plugins.entries.active-memory` altında bulunur.

Active Memory iki kapılı bir model kullanır:

1. Plugin etkin olmalı ve geçerli ajan kimliğini hedeflemelidir
2. İstek, uygun bir etkileşimli kalıcı sohbet oturumu olmalıdır

Etkinleştirme modeli, Plugin'e ait yapılandırma, transkript kalıcılığı ve güvenli devreye alma deseni için bkz. [Active Memory](/tr/concepts/active-memory).
</Note>

---

## Sağlayıcı seçimi

| Anahtar   | Tür       | Varsayılan      | Açıklama                                                                                                     |
| --------- | --------- | --------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider` | `string` | otomatik algılanır | Gömme bağdaştırıcı kimliği: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`   | `string`  | sağlayıcı varsayılanı | Gömme model adı                                                                                           |
| `fallback` | `string` | `"none"`        | Birincil başarısız olduğunda kullanılacak geri dönüş bağdaştırıcı kimliği                                    |
| `enabled` | `boolean` | `true`          | Bellek aramasını etkinleştirir veya devre dışı bırakır                                                       |

### Otomatik algılama sırası

`provider` ayarlanmamışsa, OpenClaw ilk kullanılabilir olanı seçer:

<Steps>
  <Step title="local">
    `memorySearch.local.modelPath` yapılandırılmışsa ve dosya mevcutsa seçilir.
  </Step>
  <Step title="github-copilot">
    Bir GitHub Copilot token'ı çözümlenebiliyorsa seçilir (env var veya auth profili).
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
  <Step title="bedrock">
    AWS SDK kimlik bilgisi zinciri çözümlenirse seçilir (örnek rolü, erişim anahtarları, profil, SSO, web kimliği veya paylaşılan yapılandırma).
  </Step>
</Steps>

`ollama` desteklenir ancak otomatik algılanmaz (açıkça ayarlayın).

### API anahtarı çözümleme

Uzak gömmeler API anahtarı gerektirir. Bedrock bunun yerine AWS SDK varsayılan kimlik bilgisi zincirini kullanır (örnek rolleri, SSO, erişim anahtarları).

| Sağlayıcı      | Env var                                            | Yapılandırma anahtarı             |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | AWS kimlik bilgisi zinciri                         | API anahtarı gerekmez             |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Cihaz girişi ile auth profili     |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (yer tutucu)                      | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

<Note>
Codex OAuth yalnızca sohbet/completions için geçerlidir ve gömme isteklerini karşılamaz.
</Note>

---

## Uzak uç nokta yapılandırması

Özel OpenAI uyumlu uç noktalar için veya sağlayıcı varsayılanlarını geçersiz kılmak için:

<ParamField path="remote.baseUrl" type="string">
  Özel API temel URL'si.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API anahtarını geçersiz kılar.
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
    | Anahtar                | Tür      | Varsayılan             | Açıklama                                   |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Ayrıca `gemini-embedding-2-preview` destekler |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 için: 768, 1536 veya 3072      |

    <Warning>
    Modelin veya `outputDimensionality` değerinin değiştirilmesi otomatik tam yeniden indeksleme tetikler.
    </Warning>

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock, AWS SDK varsayılan kimlik bilgisi zincirini kullanır — API anahtarı gerekmez. OpenClaw, Bedrock etkin örnek rolüne sahip EC2 üzerinde çalışıyorsa yalnızca sağlayıcıyı ve modeli ayarlayın:

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

    | Anahtar                | Tür      | Varsayılan                     | Açıklama                         |
    | ---------------------- | -------- | ------------------------------ | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Herhangi bir Bedrock gömme model kimliği |
    | `outputDimensionality` | `number` | model varsayılanı              | Titan V2 için: 256, 512 veya 1024 |

    **Desteklenen modeller** (aile algılama ve boyut varsayılanlarıyla):

    | Model Kimliği                                | Sağlayıcı  | Varsayılan Boyutlar | Yapılandırılabilir Boyutlar |
    | -------------------------------------------- | ---------- | ------------------- | --------------------------- |
    | `amazon.titan-embed-text-v2:0`               | Amazon     | 1024                | 256, 512, 1024              |
    | `amazon.titan-embed-text-v1`                 | Amazon     | 1536                | --                          |
    | `amazon.titan-embed-g1-text-02`              | Amazon     | 1536                | --                          |
    | `amazon.titan-embed-image-v1`                | Amazon     | 1024                | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0`   | Amazon     | 1024                | 256, 384, 1024, 3072        |
    | `cohere.embed-english-v3`                    | Cohere     | 1024                | --                          |
    | `cohere.embed-multilingual-v3`               | Cohere     | 1024                | --                          |
    | `cohere.embed-v4:0`                          | Cohere     | 1536                | 256-1536                    |
    | `twelvelabs.marengo-embed-3-0-v1:0`          | TwelveLabs | 512                 | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`          | TwelveLabs | 1024                | --                          |

    Verim son ekli varyantlar (ör. `amazon.titan-embed-text-v1:2:8k`) temel modelin yapılandırmasını devralır.

    **Kimlik doğrulama:** Bedrock auth, standart AWS SDK kimlik bilgisi çözümleme sırasını kullanır:

    1. Ortam değişkenleri (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO token önbelleği
    3. Web kimliği token kimlik bilgileri
    4. Paylaşılan kimlik bilgileri ve yapılandırma dosyaları
    5. ECS veya EC2 meta veri kimlik bilgileri

    Bölge, `AWS_REGION`, `AWS_DEFAULT_REGION`, `amazon-bedrock` sağlayıcı `baseUrl` değerinden çözümlenir veya varsayılan olarak `us-east-1` kullanılır.

    **IAM izinleri:** IAM rolü veya kullanıcısının şuna ihtiyacı vardır:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    En az ayrıcalık için `InvokeModel` iznini belirli modele sınırlayın:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Anahtar               | Tür                  | Varsayılan             | Açıklama                                                                                                                                                                                                                                                                                                           |
    | --------------------- | -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`             | otomatik indirilir     | GGUF model dosyasının yolu                                                                                                                                                                                                                                                                                         |
    | `local.modelCacheDir` | `string`             | node-llama-cpp varsayılanı | İndirilen modeller için önbellek dizini                                                                                                                                                                                                                                                                       |
    | `local.contextSize`   | `number \| "auto"`   | `4096`                 | Gömme bağlamı için bağlam penceresi boyutu. 4096, ağırlık dışı VRAM'i sınırlarken tipik parçaları (128–512 token) kapsar. Kısıtlı ana bilgisayarlarda 1024–2048'e düşürün. `"auto"` modelin eğitilmiş azami değerini kullanır — 8B+ modeller için önerilmez (Qwen3-Embedding-8B: 40 960 token → 4096'da ~8.8 GB yerine ~32 GB VRAM). |

    Varsayılan model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, otomatik indirilir). Yerel derleme gerektirir: `pnpm approve-builds` ardından `pnpm rebuild node-llama-cpp`.

    Gateway'in kullandığı aynı sağlayıcı yolunu doğrulamak için bağımsız CLI'yi kullanın:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    `provider` değeri `auto` ise, `local` yalnızca `local.modelPath` mevcut bir yerel dosyayı işaret ettiğinde seçilir. `hf:` ve HTTP(S) model başvuruları `provider: "local"` ile yine açıkça kullanılabilir, ancak model diskte bulunmadan önce `auto` değerinin local seçmesine neden olmazlar.

  </Accordion>
</AccordionGroup>

### Satır içi gömme zaman aşımı

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Bellek indeksleme sırasında satır içi gömme yığınları için zaman aşımını geçersiz kılar.

Ayarlanmamışsa sağlayıcı varsayılanı kullanılır: `local`, `ollama` ve `lmstudio` gibi yerel/kendi barındırdığınız sağlayıcılar için 600 saniye, barındırılan sağlayıcılar için 120 saniye. Yerel CPU'ya bağlı gömme yığınları sağlıklı ama yavaşsa bunu artırın.
</ParamField>

---

## Hibrit arama yapılandırması

Tamamı `memorySearch.query.hybrid` altında:

| Anahtar               | Tür       | Varsayılan | Açıklama                            |
| --------------------- | --------- | ---------- | ----------------------------------- |
| `enabled`             | `boolean` | `true`     | Hibrit BM25 + vektör aramasını etkinleştirir |
| `vectorWeight`        | `number`  | `0.7`      | Vektör puanları için ağırlık (0-1)  |
| `textWeight`          | `number`  | `0.3`      | BM25 puanları için ağırlık (0-1)    |
| `candidateMultiplier` | `number`  | `4`        | Aday havuzu boyutu çarpanı          |

<Tabs>
  <Tab title="MMR (çeşitlilik)">
    | Anahtar       | Tür       | Varsayılan | Açıklama                             |
    | ------------- | --------- | ---------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false`    | MMR yeniden sıralamasını etkinleştirir |
    | `mmr.lambda`  | `number`  | `0.7`      | 0 = en yüksek çeşitlilik, 1 = en yüksek alaka |
  </Tab>
  <Tab title="Temporal decay (güncellik)">
    | Anahtar                     | Tür       | Varsayılan | Açıklama                      |
    | --------------------------- | --------- | ---------- | ----------------------------- |
    | `temporalDecay.enabled`     | `boolean` | `false`    | Güncellik artırmasını etkinleştirir |
    | `temporalDecay.halfLifeDays` | `number` | `30`       | Puan her N günde yarıya iner  |

    Kalıcı dosyalar (`MEMORY.md`, `memory/` içindeki tarih içermeyen dosyalar) hiçbir zaman azaltılmaz.

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

| Anahtar     | Tür        | Açıklama                                  |
| ----------- | ---------- | ----------------------------------------- |
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

Yollar mutlak veya çalışma alanına göreli olabilir. Dizinler `.md` dosyaları için özyinelemeli olarak taranır. Symlink işleme etkin backend'e bağlıdır: yerleşik motor symlink'leri yok sayarken, QMD alttaki QMD tarayıcı davranışını izler.

Ajana kapsamlı, ajanlar arası transkript araması için `memory.qmd.paths` yerine `agents.list[].memorySearch.qmd.extraCollections` kullanın. Bu ek koleksiyonlar aynı `{ path, name, pattern? }` şeklini izler, ancak ajan başına birleştirilir ve yol mevcut çalışma alanının dışını işaret ettiğinde açık paylaşılan adları koruyabilir. Aynı çözülmüş yol hem `memory.qmd.paths` hem de `memorySearch.qmd.extraCollections` içinde görünüyorsa, QMD ilk girdiyi korur ve yineleneni atlar.

---

## Çok kipli bellek (Gemini)

Gemini Embedding 2 kullanarak Markdown ile birlikte görselleri ve sesi indeksleyin:

| Anahtar                  | Tür        | Varsayılan | Açıklama                             |
| ------------------------ | ---------- | ---------- | ------------------------------------ |
| `multimodal.enabled`     | `boolean`  | `false`    | Çok kipli indekslemeyi etkinleştirir |
| `multimodal.modalities`  | `string[]` | --         | `["image"]`, `["audio"]` veya `["all"]` |
| `multimodal.maxFileBytes` | `number`  | `10000000` | İndeksleme için en büyük dosya boyutu |

<Note>
Yalnızca `extraPaths` içindeki dosyalar için geçerlidir. Varsayılan bellek kökleri yalnızca Markdown olarak kalır. `gemini-embedding-2-preview` gerektirir. `fallback` değeri `"none"` olmalıdır.
</Note>

Desteklenen biçimler: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (görseller); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ses).

---

## Gömme önbelleği

| Anahtar            | Tür       | Varsayılan | Açıklama                             |
| ------------------ | --------- | ---------- | ------------------------------------ |
| `cache.enabled`    | `boolean` | `false`    | Parça gömmelerini SQLite içinde önbelleğe alır |
| `cache.maxEntries` | `number`  | `50000`    | En fazla önbelleğe alınmış gömme     |

Yeniden indeksleme veya transkript güncellemeleri sırasında değişmemiş metnin yeniden gömülmesini önler.

---

## Toplu indeksleme

| Anahtar                      | Tür       | Varsayılan | Açıklama                      |
| ---------------------------- | --------- | ---------- | ----------------------------- |
| `remote.batch.enabled`       | `boolean` | `false`    | Toplu gömme API'sini etkinleştirir |
| `remote.batch.concurrency`   | `number`  | `2`        | Paralel toplu işler           |
| `remote.batch.wait`          | `boolean` | `true`     | Toplu tamamlanmayı bekler     |
| `remote.batch.pollIntervalMs` | `number` | --         | Yoklama aralığı               |
| `remote.batch.timeoutMinutes` | `number` | --         | Toplu zaman aşımı             |

`openai`, `gemini` ve `voyage` için kullanılabilir. Büyük geri doldurmalarda OpenAI batch genellikle en hızlı ve en ucuz seçenektir.

Bu, yerel/kendi barındırdığınız sağlayıcılar ve sağlayıcı toplu API'leri etkin olmadığında barındırılan sağlayıcılar tarafından kullanılan satır içi gömme çağrılarını denetleyen `sync.embeddingBatchTimeoutSeconds` ayarından ayrıdır.

---

## Oturum bellek araması (deneysel)

Oturum transkriptlerini indeksleyin ve bunları `memory_search` üzerinden görünür hâle getirin:

| Anahtar                      | Tür        | Varsayılan   | Açıklama                                |
| ---------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`      | Oturum indekslemeyi etkinleştirir       |
| `sources`                    | `string[]` | `["memory"]` | Transkriptleri dahil etmek için `"sessions"` ekleyin |
| `sync.sessions.deltaBytes`   | `number`   | `100000`     | Yeniden indeksleme için bayt eşiği      |
| `sync.sessions.deltaMessages` | `number`  | `50`         | Yeniden indeksleme için mesaj eşiği     |

<Warning>
Oturum indeksleme isteğe bağlıdır ve eşzamansız çalışır. Sonuçlar biraz eski olabilir. Oturum günlükleri diskte bulunduğundan dosya sistemi erişimini güven sınırı olarak değerlendirin.
</Warning>

---

## SQLite vektör hızlandırma (sqlite-vec)

| Anahtar                     | Tür       | Varsayılan | Açıklama                               |
| --------------------------- | --------- | ---------- | -------------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`     | Vektör sorguları için sqlite-vec kullanır |
| `store.vector.extensionPath` | `string` | bundled    | sqlite-vec yolunu geçersiz kılar       |

sqlite-vec kullanılamadığında OpenClaw otomatik olarak süreç içi kosinüs benzerliğine geri döner.

---

## İndeks depolama

| Anahtar              | Tür      | Varsayılan                            | Açıklama                                  |
| -------------------- | -------- | ------------------------------------- | ----------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite` | İndeks konumu (`{agentId}` token'ını destekler) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | FTS5 tokenlaştırıcı (`unicode61` veya `trigram`) |

---

## QMD backend yapılandırması

Etkinleştirmek için `memory.backend = "qmd"` ayarlayın. Tüm QMD ayarları `memory.qmd` altında bulunur:

| Anahtar                 | Tür       | Varsayılan | Açıklama                                      |
| ----------------------- | --------- | ---------- | --------------------------------------------- |
| `command`               | `string`  | `qmd`      | QMD yürütülebilir dosya yolu                  |
| `searchMode`            | `string`  | `search`   | Arama komutu: `search`, `vsearch`, `query`    |
| `includeDefaultMemory`  | `boolean` | `true`     | `MEMORY.md` + `memory/**/*.md` otomatik indeksler |
| `paths[]`               | `array`   | --         | Ek yollar: `{ name, path, pattern? }`         |
| `sessions.enabled`      | `boolean` | `false`    | Oturum transkriptlerini indeksler             |
| `sessions.retentionDays` | `number` | --         | Transkript saklama süresi                     |
| `sessions.exportDir`    | `string`  | --         | Dışa aktarma dizini                           |

OpenClaw mevcut QMD koleksiyonu ve MCP sorgu şekillerini tercih eder, ancak gerektiğinde eski `--mask` koleksiyon bayraklarına ve eski MCP araç adlarına geri dönerek daha eski QMD sürümlerinin çalışmasını sürdürür.

<Note>
QMD model geçersiz kılmaları OpenClaw yapılandırmasında değil, QMD tarafında kalır. QMD'nin modellerini genel olarak geçersiz kılmanız gerekiyorsa, Gateway çalışma zamanı ortamında `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` ve `QMD_GENERATE_MODEL` gibi ortam değişkenlerini ayarlayın.
</Note>

<AccordionGroup>
  <Accordion title="Güncelleme zamanlaması">
    | Anahtar                  | Tür       | Varsayılan | Açıklama                                |
    | ------------------------ | --------- | ---------- | --------------------------------------- |
    | `update.interval`        | `string`  | `5m`       | Yenileme aralığı                        |
    | `update.debounceMs`      | `number`  | `15000`    | Dosya değişikliklerini debounce eder    |
    | `update.onBoot`          | `boolean` | `true`     | Başlangıçta yeniler                     |
    | `update.waitForBootSync` | `boolean` | `false`    | Yenileme tamamlanana kadar başlangıcı engeller |
    | `update.embedInterval`   | `string`  | --         | Ayrı gömme ritmi                        |
    | `update.commandTimeoutMs` | `number` | --         | QMD komutları için zaman aşımı          |
    | `update.updateTimeoutMs` | `number`  | --         | QMD güncelleme işlemleri için zaman aşımı |
    | `update.embedTimeoutMs`  | `number`  | --         | QMD gömme işlemleri için zaman aşımı    |
  </Accordion>
  <Accordion title="Sınırlar">
    | Anahtar                  | Tür      | Varsayılan | Açıklama                      |
    | ------------------------ | -------- | ---------- | ----------------------------- |
    | `limits.maxResults`      | `number` | `6`        | En fazla arama sonucu         |
    | `limits.maxSnippetChars` | `number` | --         | Parça uzunluğunu sınırlar     |
    | `limits.maxInjectedChars` | `number` | --        | Enjekte edilen toplam karakter sayısını sınırlar |
    | `limits.timeoutMs`       | `number` | `4000`     | Arama zaman aşımı             |
  </Accordion>
  <Accordion title="Kapsam">
    Hangi oturumların QMD arama sonuçları alabileceğini denetler. Şema [`session.sendPolicy`](/tr/gateway/config-agents#session) ile aynıdır:

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

    Yayınlanan varsayılan, grupları yine reddederken doğrudan ve kanal oturumlarına izin verir.

    Varsayılan yalnızca DM'dir. `match.keyPrefix` normalize edilmiş oturum anahtarıyla eşleşir; `match.rawKeyPrefix` ise `agent:<id>:` dahil ham anahtarla eşleşir.

  </Accordion>
  <Accordion title="Atıflar">
    `memory.citations` tüm backend'lere uygulanır:

    | Değer            | Davranış                                           |
    | ---------------- | -------------------------------------------------- |
    | `auto` (varsayılan) | Parçalara `Source: <path#line>` alt bilgisini ekler |
    | `on`             | Alt bilgiyi her zaman ekler                        |
    | `off`            | Alt bilgiyi çıkarır (yol yine de ajana dahili olarak iletilir) |

  </Accordion>
</AccordionGroup>

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

Kavramsal davranış ve slash komutları için bkz. [Dreaming](/tr/concepts/dreaming).

### Kullanıcı ayarları

| Anahtar    | Tür       | Varsayılan  | Açıklama                                        |
| ---------- | --------- | ----------- | ----------------------------------------------- |
| `enabled`  | `boolean` | `false`     | Dreaming'i tamamen etkinleştirir veya devre dışı bırakır |
| `frequency` | `string` | `0 3 * * *` | Tam Dreaming taraması için isteğe bağlı Cron sıklığı |

### Örnek

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming, makine durumunu `memory/.dreams/` içine yazar.
- Dreaming, insan tarafından okunabilir anlatı çıktısını `DREAMS.md` içine (veya mevcutsa `dreams.md` içine) yazar.
- Light/deep/REM aşama ilkesi ve eşikleri dahili davranıştır, kullanıcıya dönük yapılandırma değildir.

</Note>

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Bellek genel bakışı](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
