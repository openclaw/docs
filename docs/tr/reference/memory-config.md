---
read_when:
    - Bellek arama sağlayıcılarını veya embedding modellerini yapılandırmak istiyorsunuz
    - QMD backend'ini kurmak istiyorsunuz
    - Hibrit aramayı, MMR'yi veya zamansal çürümeyi ayarlamak istiyorsunuz
    - Çok modlu bellek indekslemeyi etkinleştirmek istiyorsunuz
summary: Bellek arama, embedding sağlayıcıları, QMD, hibrit arama ve çok modlu indeksleme için tüm yapılandırma ayarları
title: Bellek yapılandırma referansı
x-i18n:
    generated_at: "2026-04-12T23:33:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 299ca9b69eea292ea557a2841232c637f5c1daf2bc0f73c0a42f7c0d8d566ce2
    source_path: reference/memory-config.md
    workflow: 15
---

# Bellek yapılandırma referansı

Bu sayfa, OpenClaw bellek araması için tüm yapılandırma ayarlarını listeler. Kavramsal genel bakışlar için bkz.:

- [Belleğe genel bakış](/tr/concepts/memory) -- belleğin nasıl çalıştığı
- [Yerleşik motor](/tr/concepts/memory-builtin) -- varsayılan SQLite backend
- [QMD motoru](/tr/concepts/memory-qmd) -- yerel öncelikli sidecar
- [Bellek arama](/tr/concepts/memory-search) -- arama hattı ve ayarlama
- [Active Memory](/tr/concepts/active-memory) -- etkileşimli oturumlar için bellek alt-agent'ını etkinleştirme

Aksi belirtilmedikçe tüm bellek arama ayarları, `openclaw.json` içinde
`agents.defaults.memorySearch` altında bulunur.

**Active Memory** özellik anahtarını ve alt-agent yapılandırmasını arıyorsanız,
bu ayarlar `memorySearch` yerine `plugins.entries.active-memory` altında bulunur.

Active Memory iki kapılı bir model kullanır:

1. Plugin etkin olmalı ve geçerli agent kimliğini hedeflemelidir
2. İstek, uygun bir etkileşimli kalıcı sohbet oturumu olmalıdır

Etkinleştirme modeli,
Plugin sahipliğindeki yapılandırma, transkript kalıcılığı ve güvenli devreye alma deseni için
bkz. [Active Memory](/tr/concepts/active-memory).

---

## Sağlayıcı seçimi

| Anahtar   | Tür        | Varsayılan      | Açıklama                                                                                   |
| --------- | ---------- | --------------- | ------------------------------------------------------------------------------------------ |
| `provider` | `string`  | otomatik algılanır | Embedding adaptör kimliği: `openai`, `gemini`, `voyage`, `mistral`, `bedrock`, `ollama`, `local` |
| `model`    | `string`  | sağlayıcı varsayılanı | Embedding model adı                                                                     |
| `fallback` | `string`  | `"none"`        | Birincil sağlayıcı başarısız olduğunda kullanılacak fallback adaptör kimliği              |
| `enabled`  | `boolean` | `true`          | Bellek aramayı etkinleştirir veya devre dışı bırakır                                      |

### Otomatik algılama sırası

`provider` ayarlanmadığında OpenClaw, kullanılabilir ilk seçeneği seçer:

1. `local` -- `memorySearch.local.modelPath` yapılandırılmışsa ve dosya mevcutsa.
2. `openai` -- bir OpenAI anahtarı çözümlenebiliyorsa.
3. `gemini` -- bir Gemini anahtarı çözümlenebiliyorsa.
4. `voyage` -- bir Voyage anahtarı çözümlenebiliyorsa.
5. `mistral` -- bir Mistral anahtarı çözümlenebiliyorsa.
6. `bedrock` -- AWS SDK kimlik bilgisi zinciri çözümlenebiliyorsa (instance rolü, erişim anahtarları, profil, SSO, web kimliği veya paylaşılan yapılandırma).

`ollama` desteklenir ancak otomatik algılanmaz (açıkça ayarlayın).

### API anahtarı çözümleme

Uzak embedding'ler bir API anahtarı gerektirir. Bedrock bunun yerine AWS SDK varsayılan
kimlik bilgisi zincirini kullanır (instance rolleri, SSO, erişim anahtarları).

| Sağlayıcı | Env değişkeni                | Yapılandırma anahtarı            |
| --------- | ---------------------------- | -------------------------------- |
| OpenAI    | `OPENAI_API_KEY`             | `models.providers.openai.apiKey` |
| Gemini    | `GEMINI_API_KEY`             | `models.providers.google.apiKey` |
| Voyage    | `VOYAGE_API_KEY`             | `models.providers.voyage.apiKey` |
| Mistral   | `MISTRAL_API_KEY`            | `models.providers.mistral.apiKey` |
| Bedrock   | AWS kimlik bilgisi zinciri   | API anahtarı gerekmez            |
| Ollama    | `OLLAMA_API_KEY` (yer tutucu) | --                              |

Codex OAuth yalnızca chat/completions için geçerlidir ve embedding
isteklerini karşılamaz.

---

## Uzak uç nokta yapılandırması

Özel OpenAI uyumlu uç noktalar için veya sağlayıcı varsayılanlarını geçersiz kılmak için:

| Anahtar          | Tür      | Açıklama                                        |
| ---------------- | -------- | ----------------------------------------------- |
| `remote.baseUrl` | `string` | Özel API base URL                               |
| `remote.apiKey`  | `string` | API anahtarını geçersiz kılar                   |
| `remote.headers` | `object` | Ek HTTP header'ları (sağlayıcı varsayılanlarıyla birleştirilir) |

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

## Gemini'ye özgü yapılandırma

| Anahtar                | Tür      | Varsayılan             | Açıklama                                 |
| ---------------------- | -------- | ---------------------- | ---------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` de desteklenir |
| `outputDimensionality` | `number` | `3072`                 | Embedding 2 için: 768, 1536 veya 3072    |

<Warning>
`model` veya `outputDimensionality` değiştirilmesi otomatik tam yeniden indeksleme tetikler.
</Warning>

---

## Bedrock embedding yapılandırması

Bedrock, AWS SDK varsayılan kimlik bilgisi zincirini kullanır -- API anahtarı gerekmez.
OpenClaw, Bedrock etkin bir instance rolüyle EC2 üzerinde çalışıyorsa yalnızca
sağlayıcıyı ve modeli ayarlayın:

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

| Anahtar                | Tür      | Varsayılan                     | Açıklama                          |
| ---------------------- | -------- | ------------------------------ | --------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Herhangi bir Bedrock embedding model kimliği |
| `outputDimensionality` | `number` | model varsayılanı              | Titan V2 için: 256, 512 veya 1024 |

### Desteklenen modeller

Aşağıdaki modeller desteklenir (aile algılama ve boyut
varsayılanlarıyla birlikte):

| Model kimliği                               | Sağlayıcı  | Varsayılan boyut | Yapılandırılabilir boyutlar |
| ------------------------------------------- | ---------- | ---------------- | --------------------------- |
| `amazon.titan-embed-text-v2:0`              | Amazon     | 1024             | 256, 512, 1024              |
| `amazon.titan-embed-text-v1`                | Amazon     | 1536             | --                          |
| `amazon.titan-embed-g1-text-02`             | Amazon     | 1536             | --                          |
| `amazon.titan-embed-image-v1`               | Amazon     | 1024             | --                          |
| `amazon.nova-2-multimodal-embeddings-v1:0`  | Amazon     | 1024             | 256, 384, 1024, 3072        |
| `cohere.embed-english-v3`                   | Cohere     | 1024             | --                          |
| `cohere.embed-multilingual-v3`              | Cohere     | 1024             | --                          |
| `cohere.embed-v4:0`                         | Cohere     | 1536             | 256-1536                    |
| `twelvelabs.marengo-embed-3-0-v1:0`         | TwelveLabs | 512              | --                          |
| `twelvelabs.marengo-embed-2-7-v1:0`         | TwelveLabs | 1024             | --                          |

İş hacmi son ekli varyantlar (örneğin `amazon.titan-embed-text-v1:2:8k`), temel modelin yapılandırmasını devralır.

### Kimlik doğrulama

Bedrock auth, standart AWS SDK kimlik bilgisi çözümleme sırasını kullanır:

1. Ortam değişkenleri (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. SSO token önbelleği
3. Web kimliği token kimlik bilgileri
4. Paylaşılan kimlik bilgisi ve yapılandırma dosyaları
5. ECS veya EC2 meta veri kimlik bilgileri

Bölge, `AWS_REGION`, `AWS_DEFAULT_REGION`,
`amazon-bedrock` sağlayıcısının `baseUrl` değeri üzerinden çözülür veya varsayılan olarak `us-east-1` kullanılır.

### IAM izinleri

IAM rolü veya kullanıcısının şuna ihtiyacı vardır:

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

---

## Yerel embedding yapılandırması

| Anahtar              | Tür      | Varsayılan              | Açıklama                         |
| -------------------- | -------- | ----------------------- | -------------------------------- |
| `local.modelPath`    | `string` | otomatik indirilir      | GGUF model dosyasının yolu       |
| `local.modelCacheDir` | `string` | node-llama-cpp varsayılanı | İndirilen modeller için önbellek dizini |

Varsayılan model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, otomatik indirilir).
Yerel derleme gerektirir: `pnpm approve-builds` ardından `pnpm rebuild node-llama-cpp`.

---

## Hibrit arama yapılandırması

Tümü `memorySearch.query.hybrid` altındadır:

| Anahtar              | Tür       | Varsayılan | Açıklama                          |
| -------------------- | --------- | ---------- | --------------------------------- |
| `enabled`            | `boolean` | `true`     | Hibrit BM25 + vektör aramayı etkinleştirir |
| `vectorWeight`       | `number`  | `0.7`      | Vektör skorları için ağırlık (0-1) |
| `textWeight`         | `number`  | `0.3`      | BM25 skorları için ağırlık (0-1)   |
| `candidateMultiplier` | `number` | `4`        | Aday havuzu boyutu çarpanı         |

### MMR (çeşitlilik)

| Anahtar       | Tür       | Varsayılan | Açıklama                               |
| ------------- | --------- | ---------- | -------------------------------------- |
| `mmr.enabled` | `boolean` | `false`    | MMR yeniden sıralamasını etkinleştirir |
| `mmr.lambda`  | `number`  | `0.7`      | 0 = maksimum çeşitlilik, 1 = maksimum alaka |

### Zamansal çürüme (güncellik)

| Anahtar                     | Tür       | Varsayılan | Açıklama                    |
| --------------------------- | --------- | ---------- | --------------------------- |
| `temporalDecay.enabled`     | `boolean` | `false`    | Güncellik artırmasını etkinleştirir |
| `temporalDecay.halfLifeDays` | `number` | `30`       | Skor her N günde yarıya iner |

Evergreen dosyalar (`MEMORY.md`, `memory/` içindeki tarih içermeyen dosyalar) asla çürütülmez.

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

| Anahtar     | Tür        | Açıklama                                |
| ----------- | ---------- | --------------------------------------- |
| `extraPaths` | `string[]` | İndekslenecek ek dizinler veya dosyalar |

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

Yollar mutlak veya çalışma alanına göreli olabilir. Dizinler,
`.md` dosyaları için özyinelemeli olarak taranır. Symlink işleme etkin backend'e bağlıdır:
yerleşik motor symlink'leri yok sayar, QMD ise alttaki QMD
tarayıcı davranışını izler.

Agent kapsamlı agent'lar arası transkript araması için
`memory.qmd.paths` yerine `agents.list[].memorySearch.qmd.extraCollections` kullanın.
Bu ek koleksiyonlar da aynı `{ path, name, pattern? }` biçimini izler, ancak
agent başına birleştirilir ve yol geçerli çalışma alanının dışına işaret ettiğinde
açık paylaşılan adları koruyabilir.
Aynı çözümlenmiş yol hem `memory.qmd.paths` hem de
`memorySearch.qmd.extraCollections` içinde görünürse, QMD ilk girdiyi korur ve
yineleneni atlar.

---

## Çok modlu bellek (Gemini)

Gemini Embedding 2 kullanarak Markdown ile birlikte görselleri ve sesi indeksleyin:

| Anahtar                  | Tür        | Varsayılan | Açıklama                               |
| ------------------------ | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`     | `boolean`  | `false`    | Çok modlu indekslemeyi etkinleştirir   |
| `multimodal.modalities`  | `string[]` | --         | `["image"]`, `["audio"]` veya `["all"]` |
| `multimodal.maxFileBytes` | `number`  | `10000000` | İndeksleme için maksimum dosya boyutu  |

Yalnızca `extraPaths` içindeki dosyalar için geçerlidir. Varsayılan bellek kökleri yalnızca Markdown'dur.
`gemini-embedding-2-preview` gerektirir. `fallback`, `"none"` olmalıdır.

Desteklenen biçimler: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(görseller); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ses).

---

## Embedding önbelleği

| Anahtar           | Tür       | Varsayılan | Açıklama                              |
| ----------------- | --------- | ---------- | ------------------------------------- |
| `cache.enabled`   | `boolean` | `false`    | SQLite içinde chunk embedding'lerini önbelleğe alır |
| `cache.maxEntries` | `number` | `50000`    | Maksimum önbelleğe alınmış embedding sayısı |

Yeniden indeksleme veya transkript güncellemeleri sırasında değişmemiş metnin yeniden embedding işleminden geçmesini önler.

---

## Toplu indeksleme

| Anahtar                      | Tür       | Varsayılan | Açıklama                  |
| ---------------------------- | --------- | ---------- | ------------------------- |
| `remote.batch.enabled`       | `boolean` | `false`    | Toplu embedding API'sini etkinleştirir |
| `remote.batch.concurrency`   | `number`  | `2`        | Paralel toplu işler       |
| `remote.batch.wait`          | `boolean` | `true`     | Toplu işlemin tamamlanmasını bekler |
| `remote.batch.pollIntervalMs` | `number` | --         | Yoklama aralığı           |
| `remote.batch.timeoutMinutes` | `number` | --         | Toplu işlem zaman aşımı   |

`openai`, `gemini` ve `voyage` için kullanılabilir. OpenAI toplu işlem genellikle
büyük geri doldurmalar için en hızlı ve en ucuz seçenektir.

---

## Oturum bellek araması (deneysel)

Oturum transkriptlerini indeksleyin ve bunları `memory_search` üzerinden sunun:

| Anahtar                      | Tür        | Varsayılan   | Açıklama                              |
| ---------------------------- | ---------- | ------------ | ------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`      | Oturum indekslemeyi etkinleştirir     |
| `sources`                    | `string[]` | `["memory"]` | Transkriptleri dahil etmek için `"sessions"` ekleyin |
| `sync.sessions.deltaBytes`   | `number`   | `100000`     | Yeniden indeksleme için bayt eşiği    |
| `sync.sessions.deltaMessages` | `number`  | `50`         | Yeniden indeksleme için mesaj eşiği   |

Oturum indeksleme opt-in'dir ve async çalışır. Sonuçlar biraz eski
olabilir. Oturum log'ları diskte tutulur, bu nedenle güven sınırı olarak
dosya sistemi erişimini değerlendirin.

---

## SQLite vektör hızlandırma (`sqlite-vec`)

| Anahtar                     | Tür       | Varsayılan | Açıklama                        |
| --------------------------- | --------- | ---------- | ------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`     | Vektör sorguları için `sqlite-vec` kullanır |
| `store.vector.extensionPath` | `string` | paketlenmiş | `sqlite-vec` yolunu geçersiz kılar |

`sqlite-vec` kullanılamadığında OpenClaw otomatik olarak süreç içi cosine
similarity yöntemine geri döner.

---

## İndeks depolama

| Anahtar              | Tür      | Varsayılan                            | Açıklama                                 |
| -------------------- | -------- | ------------------------------------- | ---------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite` | İndeks konumu (`{agentId}` token'ını destekler) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 tokenizer (`unicode61` veya `trigram`) |

---

## QMD backend yapılandırması

Etkinleştirmek için `memory.backend = "qmd"` ayarlayın. Tüm QMD ayarları
`memory.qmd` altında bulunur:

| Anahtar                 | Tür       | Varsayılan | Açıklama                                   |
| ----------------------- | --------- | ---------- | ------------------------------------------ |
| `command`               | `string`  | `qmd`      | QMD çalıştırılabilir dosya yolu            |
| `searchMode`            | `string`  | `search`   | Arama komutu: `search`, `vsearch`, `query` |
| `includeDefaultMemory`  | `boolean` | `true`     | `MEMORY.md` + `memory/**/*.md` dosyalarını otomatik indeksler |
| `paths[]`               | `array`   | --         | Ek yollar: `{ name, path, pattern? }`      |
| `sessions.enabled`      | `boolean` | `false`    | Oturum transkriptlerini indeksler          |
| `sessions.retentionDays` | `number` | --         | Transkript saklama süresi                  |
| `sessions.exportDir`    | `string`  | --         | Dışa aktarma dizini                        |

OpenClaw, güncel QMD koleksiyonu ve MCP sorgu biçimlerini tercih eder, ancak
gerektiğinde eski `--mask` koleksiyon bayraklarına
ve eski MCP araç adlarına geri dönerek eski QMD sürümlerini de çalışır durumda tutar.

QMD model geçersiz kılmaları OpenClaw yapılandırmasında değil, QMD tarafında kalır. QMD'nin
modellerini genel olarak geçersiz kılmanız gerekiyorsa,
Gateway çalışma zamanı ortamında `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` ve `QMD_GENERATE_MODEL`
gibi ortam değişkenlerini ayarlayın.

### Güncelleme zamanlaması

| Anahtar                  | Tür       | Varsayılan | Açıklama                           |
| ------------------------ | --------- | ---------- | ---------------------------------- |
| `update.interval`        | `string`  | `5m`       | Yenileme aralığı                   |
| `update.debounceMs`      | `number`  | `15000`    | Dosya değişikliklerini debounce eder |
| `update.onBoot`          | `boolean` | `true`     | Başlangıçta yeniler                |
| `update.waitForBootSync` | `boolean` | `false`    | Yenileme tamamlanana kadar başlangıcı engeller |
| `update.embedInterval`   | `string`  | --         | Ayrı embedding sıklığı             |
| `update.commandTimeoutMs` | `number` | --         | QMD komutları için zaman aşımı     |
| `update.updateTimeoutMs` | `number`  | --         | QMD güncelleme işlemleri için zaman aşımı |
| `update.embedTimeoutMs`  | `number`  | --         | QMD embedding işlemleri için zaman aşımı |

### Sınırlar

| Anahtar                  | Tür      | Varsayılan | Açıklama                     |
| ------------------------ | -------- | ---------- | ---------------------------- |
| `limits.maxResults`      | `number` | `6`        | Maksimum arama sonucu        |
| `limits.maxSnippetChars` | `number` | --         | Snippet uzunluğunu sınırlar  |
| `limits.maxInjectedChars` | `number` | --        | Toplam enjekte edilen karakterleri sınırlar |
| `limits.timeoutMs`       | `number` | `4000`     | Arama zaman aşımı            |

### Kapsam

Hangi oturumların QMD arama sonuçları alabileceğini denetler. Şema,
[`session.sendPolicy`](/tr/gateway/configuration-reference#session) ile aynıdır:

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

Gönderilen varsayılan yapılandırma, grupları yine reddederken doğrudan ve kanal oturumlarına izin verir.

Varsayılan yalnızca DM'dir. `match.keyPrefix`, normalize edilmiş session key ile eşleşir;
`match.rawKeyPrefix`, `agent:<id>:` dahil ham anahtarla eşleşir.

### Atıflar

`memory.citations` tüm backend'lere uygulanır:

| Değer            | Davranış                                         |
| ---------------- | ------------------------------------------------ |
| `auto` (varsayılan) | Snippet'lara `Source: <path#line>` alt bilgisini ekler |
| `on`             | Alt bilgiyi her zaman ekler                      |
| `off`            | Alt bilgiyi çıkarır (yol yine de dahili olarak agent'a aktarılır) |

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

## Dreaming (deneysel)

Dreaming, `agents.defaults.memorySearch` altında değil,
`plugins.entries.memory-core.config.dreaming` altında yapılandırılır.

Dreaming, tek bir zamanlanmış tarama olarak çalışır ve dahili light/deep/REM aşamalarını
uygulama ayrıntısı olarak kullanır.

Kavramsal davranış ve slash komutlar için bkz. [Dreaming](/tr/concepts/dreaming).

### Kullanıcı ayarları

| Anahtar    | Tür       | Varsayılan  | Açıklama                                       |
| ---------- | --------- | ----------- | ---------------------------------------------- |
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

Notlar:

- Dreaming, makine durumunu `memory/.dreams/` içine yazar.
- Dreaming, insan tarafından okunabilir anlatı çıktısını `DREAMS.md` (veya mevcut `dreams.md`) içine yazar.
- Light/deep/REM aşama politikası ve eşikleri dahili davranıştır, kullanıcıya dönük yapılandırma değildir.
