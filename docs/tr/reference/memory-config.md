---
read_when:
    - Bellek arama sağlayıcılarını veya embedding modellerini yapılandırmak istiyorsunuz
    - QMD arka ucunu kurmak istiyorsunuz
    - Hibrit aramayı, MMR'yi veya zamansal azalmayı ayarlamak istiyorsunuz
    - Çok modlu bellek indekslemeyi etkinleştirmek istiyorsunuz
summary: Bellek arama, embedding sağlayıcıları, QMD, hibrit arama ve çok modlu indeksleme için tüm yapılandırma seçenekleri
title: Bellek yapılandırma başvurusu
x-i18n:
    generated_at: "2026-04-24T09:29:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

Bu sayfa, OpenClaw bellek araması için tüm yapılandırma düğmelerini listeler. Kavramsal genel bakışlar için bkz.:

- [Memory Overview](/tr/concepts/memory) -- belleğin nasıl çalıştığı
- [Builtin Engine](/tr/concepts/memory-builtin) -- varsayılan SQLite arka ucu
- [QMD Engine](/tr/concepts/memory-qmd) -- yerel öncelikli yan süreç
- [Memory Search](/tr/concepts/memory-search) -- arama hattı ve ayarlama
- [Active Memory](/tr/concepts/active-memory) -- etkileşimli oturumlar için bellek alt ajanını etkinleştirme

Aksi belirtilmedikçe tüm bellek arama ayarları `openclaw.json`
içindeki `agents.defaults.memorySearch` altında bulunur.

**Active Memory** özellik anahtarını ve alt ajan yapılandırmasını arıyorsanız,
bu `memorySearch` yerine `plugins.entries.active-memory` altında bulunur.

Active Memory iki geçitli bir model kullanır:

1. Plugin etkin olmalı ve geçerli ajan kimliğini hedeflemelidir
2. İstek uygun bir etkileşimli kalıcı sohbet oturumu olmalıdır

Etkinleştirme modeli,
Plugin'e ait yapılandırma, transkript kalıcılığı ve güvenli dağıtım deseni için
[Active Memory](/tr/concepts/active-memory) sayfasına bakın.

---

## Sağlayıcı seçimi

| Anahtar    | Tür       | Varsayılan    | Açıklama                                                                                                  |
| ---------- | --------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | otomatik algılanır | Embedding bağdaştırıcı kimliği: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | sağlayıcı varsayılanı | Embedding model adı                                                                                   |
| `fallback` | `string`  | `"none"`      | Birincil başarısız olduğunda geri düşülecek bağdaştırıcı kimliği                                          |
| `enabled`  | `boolean` | `true`        | Bellek aramayı etkinleştirir veya devre dışı bırakır                                                      |

### Otomatik algılama sırası

`provider` ayarlı değilse OpenClaw kullanılabilir ilk seçeneği seçer:

1. `local` -- `memorySearch.local.modelPath` yapılandırılmışsa ve dosya varsa.
2. `github-copilot` -- bir GitHub Copilot token'ı çözümlenebiliyorsa (ortam değişkeni veya auth profili).
3. `openai` -- bir OpenAI anahtarı çözümlenebiliyorsa.
4. `gemini` -- bir Gemini anahtarı çözümlenebiliyorsa.
5. `voyage` -- bir Voyage anahtarı çözümlenebiliyorsa.
6. `mistral` -- bir Mistral anahtarı çözümlenebiliyorsa.
7. `bedrock` -- AWS SDK kimlik bilgisi zinciri çözümlenebiliyorsa (instance role, erişim anahtarları, profil, SSO, web identity veya paylaşılan yapılandırma).

`ollama` desteklenir ama otomatik algılanmaz (açıkça ayarlayın).

### API anahtarı çözümleme

Uzak embeddings için API anahtarı gerekir. Bunun yerine Bedrock, AWS SDK varsayılan
kimlik bilgisi zincirini kullanır (instance roller, SSO, erişim anahtarları).

| Sağlayıcı      | Ortam değişkeni                                  | Yapılandırma anahtarı              |
| -------------- | ------------------------------------------------ | ---------------------------------- |
| Bedrock        | AWS kimlik bilgisi zinciri                       | API anahtarı gerekmez              |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`   |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Cihaz girişi üzerinden auth profili |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey`  |
| Ollama         | `OLLAMA_API_KEY` (yer tutucu)                    | --                                 |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`   |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`   |

Codex OAuth yalnızca chat/completions işlemlerini kapsar ve embedding
isteklerini karşılamaz.

---

## Uzak uç nokta yapılandırması

Özel OpenAI uyumlu uç noktalar veya sağlayıcı varsayılanlarını geçersiz kılmak için:

| Anahtar          | Tür      | Açıklama                                 |
| ---------------- | -------- | ---------------------------------------- |
| `remote.baseUrl` | `string` | Özel API temel URL'si                    |
| `remote.apiKey`  | `string` | API anahtarını geçersiz kılar            |
| `remote.headers` | `object` | Ek HTTP üstbilgileri (sağlayıcı varsayılanlarıyla birleştirilir) |

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

| Anahtar                | Tür      | Varsayılan             | Açıklama                                   |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Ayrıca `gemini-embedding-2-preview` desteklenir |
| `outputDimensionality` | `number` | `3072`                 | Embedding 2 için: 768, 1536 veya 3072      |

<Warning>
Modeli veya `outputDimensionality` değerini değiştirmek otomatik tam yeniden indekslemeyi tetikler.
</Warning>

---

## Bedrock embedding yapılandırması

Bedrock, AWS SDK varsayılan kimlik bilgisi zincirini kullanır -- API anahtarı gerekmez.
OpenClaw, Bedrock etkin bir instance role ile EC2 üzerinde çalışıyorsa yalnızca
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

| Anahtar                | Tür      | Varsayılan                     | Açıklama                           |
| ---------------------- | -------- | ------------------------------ | ---------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Herhangi bir Bedrock embedding model kimliği |
| `outputDimensionality` | `number` | model varsayılanı              | Titan V2 için: 256, 512 veya 1024  |

### Desteklenen modeller

Aşağıdaki modeller desteklenir (aile algılama ve boyut
varsayılanları ile):

| Model ID                                   | Sağlayıcı  | Varsayılan Boyutlar | Yapılandırılabilir Boyutlar |
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

Throughput sonekli varyantlar (ör. `amazon.titan-embed-text-v1:2:8k`)
temel modelin yapılandırmasını devralır.

### Kimlik doğrulama

Bedrock auth, standart AWS SDK kimlik bilgisi çözümleme sırasını kullanır:

1. Ortam değişkenleri (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. SSO token önbelleği
3. Web identity token kimlik bilgileri
4. Paylaşılan kimlik bilgileri ve yapılandırma dosyaları
5. ECS veya EC2 metadata kimlik bilgileri

Bölge; `AWS_REGION`, `AWS_DEFAULT_REGION`, `amazon-bedrock`
sağlayıcısının `baseUrl` değeri üzerinden çözülür veya varsayılan olarak `us-east-1` kullanılır.

### IAM izinleri

IAM rolü veya kullanıcısı şuna ihtiyaç duyar:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

En az ayrıcalık için `InvokeModel` iznini belirli modele kapsamlayın:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Yerel embedding yapılandırması

| Anahtar               | Tür                 | Varsayılan             | Açıklama                                                                                                                                                                                                                                                                                                           |
| --------------------- | ------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`     | `string`            | otomatik indirilir     | GGUF model dosyasına yol                                                                                                                                                                                                                                                                                           |
| `local.modelCacheDir` | `string`            | node-llama-cpp varsayılanı | İndirilen modeller için önbellek dizini                                                                                                                                                                                                                                                                       |
| `local.contextSize`   | `number \| "auto"`  | `4096`                 | Embedding bağlamı için bağlam penceresi boyutu. 4096, tipik parçaları (128–512 token) kapsarken ağırlık dışı VRAM'i sınırlar. Kısıtlı ana bilgisayarlarda 1024–2048'e düşürün. `"auto"`, modelin eğitildiği maksimum değeri kullanır — 8B+ modeller için önerilmez (Qwen3-Embedding-8B: 40 960 token → 4096'da ~8.8 GB VRAM'e karşılık ~32 GB VRAM). |

Varsayılan model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, otomatik indirilir).
Yerel derleme gerektirir: `pnpm approve-builds` ardından `pnpm rebuild node-llama-cpp`.

Gateway'in kullandığı aynı sağlayıcı yolunu doğrulamak için bağımsız CLI'yi kullanın:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

`provider` değeri `auto` ise `local`, yalnızca `local.modelPath`
mevcut bir yerel dosyayı işaret ettiğinde seçilir. `hf:` ve HTTP(S) model başvuruları
`provider: "local"` ile açıkça yine kullanılabilir, ancak model diskte hazır olmadan
`auto` yereli seçmez.

---

## Hibrit arama yapılandırması

Tümü `memorySearch.query.hybrid` altında:

| Anahtar               | Tür       | Varsayılan | Açıklama                           |
| --------------------- | --------- | ---------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`     | Hibrit BM25 + vektör aramayı etkinleştir |
| `vectorWeight`        | `number`  | `0.7`      | Vektör puanları için ağırlık (0-1) |
| `textWeight`          | `number`  | `0.3`      | BM25 puanları için ağırlık (0-1)   |
| `candidateMultiplier` | `number`  | `4`        | Aday havuzu boyutu çarpanı         |

### MMR (çeşitlilik)

| Anahtar       | Tür       | Varsayılan | Açıklama                               |
| ------------- | --------- | ---------- | -------------------------------------- |
| `mmr.enabled` | `boolean` | `false`    | MMR yeniden sıralamayı etkinleştirir   |
| `mmr.lambda`  | `number`  | `0.7`      | 0 = azami çeşitlilik, 1 = azami ilgililik |

### Zamansal azalma (yakınlık)

| Anahtar                      | Tür       | Varsayılan | Açıklama                 |
| ---------------------------- | --------- | ---------- | ------------------------ |
| `temporalDecay.enabled`      | `boolean` | `false`    | Yakınlık artışını etkinleştir |
| `temporalDecay.halfLifeDays` | `number`  | `30`       | Puan her N günde yarıya iner |

Her zaman geçerli dosyalar (`MEMORY.md`, `memory/` içindeki tarihli olmayan dosyalar) için azalma uygulanmaz.

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

| Anahtar      | Tür        | Açıklama                                   |
| ------------ | ---------- | ------------------------------------------ |
| `extraPaths` | `string[]` | İndekslenecek ek dizinler veya dosyalar    |

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
`.md` dosyaları için özyineli olarak taranır. Symlink işleme etkin arka uca bağlıdır:
yerleşik motor symlink'leri yok sayar; QMD ise alttaki QMD
tarayıcı davranışını izler.

Ajan kapsamlı, ajanlar arası transkript araması için
`memory.qmd.paths` yerine
`agents.list[].memorySearch.qmd.extraCollections` kullanın.
Bu ek koleksiyonlar aynı `{ path, name, pattern? }` biçimini izler, ancak
ajan başına birleştirilir ve yol geçerli çalışma alanının dışını işaret ettiğinde
açık paylaşılan adları koruyabilir.
Aynı çözümlenmiş yol hem `memory.qmd.paths` hem de
`memorySearch.qmd.extraCollections` içinde görünürse QMD ilk girdiyi korur ve
yineleneni atlar.

---

## Çok modlu bellek (Gemini)

Gemini Embedding 2 kullanarak görselleri ve sesleri Markdown ile birlikte indeksleyin:

| Anahtar                   | Tür        | Varsayılan | Açıklama                               |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Çok modlu indekslemeyi etkinleştirir   |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` veya `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | İndeksleme için azami dosya boyutu     |

Yalnızca `extraPaths` içindeki dosyalara uygulanır. Varsayılan bellek kökleri yalnızca Markdown olarak kalır.
`gemini-embedding-2-preview` gerektirir. `fallback` değeri `"none"` olmalıdır.

Desteklenen biçimler: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(görseller); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ses).

---

## Embedding önbelleği

| Anahtar            | Tür       | Varsayılan | Açıklama                               |
| ------------------ | --------- | ---------- | -------------------------------------- |
| `cache.enabled`    | `boolean` | `false`    | Parça embedding'lerini SQLite içinde önbelleğe al |
| `cache.maxEntries` | `number`  | `50000`    | Azami önbelleğe alınmış embedding sayısı |

Yeniden indeksleme veya transkript güncellemeleri sırasında değişmemiş metnin yeniden embedding yapılmasını önler.

---

## Toplu indeksleme

| Anahtar                       | Tür       | Varsayılan | Açıklama                    |
| ----------------------------- | --------- | ---------- | --------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`    | Toplu embedding API'sini etkinleştirir |
| `remote.batch.concurrency`    | `number`  | `2`        | Paralel toplu işler         |
| `remote.batch.wait`           | `boolean` | `true`     | Toplu iş tamamlanmasını bekle |
| `remote.batch.pollIntervalMs` | `number`  | --         | Yoklama aralığı             |
| `remote.batch.timeoutMinutes` | `number`  | --         | Toplu iş zaman aşımı        |

`openai`, `gemini` ve `voyage` için kullanılabilir. OpenAI toplu işleme genellikle
büyük geri doldurmalar için en hızlı ve en ucuz yoldur.

---

## Oturum bellek araması (deneysel)

Oturum transkriptlerini indeksleyin ve bunları `memory_search` üzerinden açığa çıkarın:

| Anahtar                       | Tür        | Varsayılan   | Açıklama                                |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Oturum indekslemeyi etkinleştirir       |
| `sources`                     | `string[]` | `["memory"]` | Transkriptleri dahil etmek için `"sessions"` ekleyin |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Yeniden indeksleme için bayt eşiği      |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Yeniden indeksleme için mesaj eşiği     |

Oturum indeksleme isteğe bağlıdır ve eşzamansız çalışır. Sonuçlar biraz eski olabilir.
Oturum günlükleri diskte yaşar; bu nedenle dosya sistemi erişimini güven sınırı olarak değerlendirin.

---

## SQLite vektör hızlandırma (sqlite-vec)

| Anahtar                      | Tür       | Varsayılan | Açıklama                         |
| ---------------------------- | --------- | ---------- | -------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`     | Vektör sorguları için sqlite-vec kullan |
| `store.vector.extensionPath` | `string`  | paketli    | sqlite-vec yolunu geçersiz kıl   |

sqlite-vec kullanılamadığında OpenClaw otomatik olarak süreç içi kosinüs
benzerliğine geri düşer.

---

## İndeks depolama

| Anahtar              | Tür      | Varsayılan                            | Açıklama                                  |
| -------------------- | -------- | ------------------------------------- | ----------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite` | İndeks konumu (`{agentId}` belirtecini destekler) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | FTS5 tokenizer (`unicode61` veya `trigram`) |

---

## QMD arka uç yapılandırması

Etkinleştirmek için `memory.backend = "qmd"` ayarlayın. Tüm QMD ayarları
`memory.qmd` altında bulunur:

| Anahtar                  | Tür       | Varsayılan | Açıklama                                  |
| ------------------------ | --------- | ---------- | ----------------------------------------- |
| `command`                | `string`  | `qmd`      | QMD yürütülebilir dosya yolu              |
| `searchMode`             | `string`  | `search`   | Arama komutu: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`     | `MEMORY.md` + `memory/**/*.md` otomatik indeksleme |
| `paths[]`                | `array`   | --         | Ek yollar: `{ name, path, pattern? }`     |
| `sessions.enabled`       | `boolean` | `false`    | Oturum transkriptlerini indeksle          |
| `sessions.retentionDays` | `number`  | --         | Transkript saklama süresi                 |
| `sessions.exportDir`     | `string`  | --         | Dışa aktarma dizini                       |

OpenClaw güncel QMD koleksiyonu ve MCP sorgu biçimlerini tercih eder, ancak
gerektiğinde eski `--mask` koleksiyon bayraklarına
ve daha eski MCP araç adlarına geri düşerek eski QMD sürümlerini çalışır tutar.

QMD model geçersiz kılmaları OpenClaw yapılandırmasında değil, QMD tarafında kalır. QMD modellerini genel olarak geçersiz kılmanız gerekiyorsa
Gateway çalışma zamanı ortamında
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` ve `QMD_GENERATE_MODEL` gibi ortam değişkenlerini ayarlayın.

### Güncelleme zamanlaması

| Anahtar                   | Tür       | Varsayılan | Açıklama                              |
| ------------------------- | --------- | ---------- | ------------------------------------- |
| `update.interval`         | `string`  | `5m`       | Yenileme aralığı                      |
| `update.debounceMs`       | `number`  | `15000`    | Dosya değişiklikleri için debounce    |
| `update.onBoot`           | `boolean` | `true`     | Başlangıçta yenile                    |
| `update.waitForBootSync`  | `boolean` | `false`    | Yenileme tamamlanana kadar başlangıcı engelle |
| `update.embedInterval`    | `string`  | --         | Ayrı embedding sıklığı                |
| `update.commandTimeoutMs` | `number`  | --         | QMD komutları için zaman aşımı        |
| `update.updateTimeoutMs`  | `number`  | --         | QMD güncelleme işlemleri için zaman aşımı |
| `update.embedTimeoutMs`   | `number`  | --         | QMD embedding işlemleri için zaman aşımı |

### Sınırlar

| Anahtar                   | Tür      | Varsayılan | Açıklama                     |
| ------------------------- | -------- | ---------- | ---------------------------- |
| `limits.maxResults`       | `number` | `6`        | Azami arama sonucu           |
| `limits.maxSnippetChars`  | `number` | --         | Parça uzunluğunu sınırla     |
| `limits.maxInjectedChars` | `number` | --         | Toplam enjekte edilen karakteri sınırla |
| `limits.timeoutMs`        | `number` | `4000`     | Arama zaman aşımı            |

### Kapsam

Hangi oturumların QMD arama sonuçları alabileceğini denetler. Şu şemayla aynıdır:
[`session.sendPolicy`](/tr/gateway/config-agents#session):

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

Paketle gelen varsayılan, grupları reddetmeye devam ederken doğrudan ve kanal oturumlarına izin verir.

Varsayılan yalnızca DM'dir. `match.keyPrefix`, normalize edilmiş oturum anahtarıyla eşleşir;
`match.rawKeyPrefix` ise `agent:<id>:` dahil ham anahtarla eşleşir.

### Atıflar

`memory.citations` tüm arka uçlar için geçerlidir:

| Değer            | Davranış                                              |
| ---------------- | ----------------------------------------------------- |
| `auto` (varsayılan) | Parçalara `Source: <path#line>` alt bilgisini ekler |
| `on`             | Alt bilgiyi her zaman ekler                           |
| `off`            | Alt bilgiyi çıkarır (yol yine de içsel olarak ajana geçirilir) |

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

Dreaming, `agents.defaults.memorySearch` altında değil,
`plugins.entries.memory-core.config.dreaming` altında yapılandırılır.

Dreaming tek bir zamanlanmış tarama olarak çalışır ve içsel uygulama ayrıntısı olarak
light/deep/REM fazlarını kullanır.

Kavramsal davranış ve slash komutları için bkz. [Dreaming](/tr/concepts/dreaming).

### Kullanıcı ayarları

| Anahtar     | Tür       | Varsayılan  | Açıklama                                        |
| ----------- | --------- | ----------- | ----------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Dreaming'i tamamen etkinleştirir veya kapatır   |
| `frequency` | `string`  | `0 3 * * *` | Tam Dreaming taraması için isteğe bağlı Cron sıklığı |

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
- Light/deep/REM faz ilkesi ve eşikleri iç davranıştır; kullanıcıya dönük yapılandırma değildir.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek arama](/tr/concepts/memory-search)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
