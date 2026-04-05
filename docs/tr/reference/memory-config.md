---
read_when:
    - Bellek arama sağlayıcılarını veya embedding modellerini yapılandırmak istiyorsunuz
    - QMD arka ucunu kurmak istiyorsunuz
    - Hibrit aramayı, MMR'yi veya zamansal azalmayı ayarlamak istiyorsunuz
    - Çok modlu bellek dizinlemeyi etkinleştirmek istiyorsunuz
summary: Bellek araması, embedding sağlayıcıları, QMD, hibrit arama ve çok modlu dizinleme için tüm yapılandırma ayarları
title: Bellek yapılandırma başvurusu
x-i18n:
    generated_at: "2026-04-05T14:08:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e4c9740f71f5a47fc5e163742339362d6b95cb4757650c0c8a095cf3078caa
    source_path: reference/memory-config.md
    workflow: 15
---

# Bellek yapılandırma başvurusu

Bu sayfa, OpenClaw bellek araması için tüm yapılandırma ayarlarını listeler. Kavramsal genel bakışlar için şunlara bakın:

- [Belleğe Genel Bakış](/tr/concepts/memory) -- belleğin nasıl çalıştığı
- [Yerleşik Motor](/tr/concepts/memory-builtin) -- varsayılan SQLite arka ucu
- [QMD Motoru](/tr/concepts/memory-qmd) -- önce yerel çalışan yardımcı hizmet
- [Bellek Araması](/tr/concepts/memory-search) -- arama işlem hattı ve ayarlama

Aksi belirtilmedikçe, tüm bellek arama ayarları `openclaw.json` içinde
`agents.defaults.memorySearch` altında bulunur.

---

## Sağlayıcı seçimi

| Key        | Type      | Default          | Description                                                                      |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------- |
| `provider` | `string`  | otomatik algılanır    | Embedding bağdaştırıcı kimliği: `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local` |
| `model`    | `string`  | sağlayıcı varsayılanı | Embedding model adı                                                             |
| `fallback` | `string`  | `"none"`         | Birincil başarısız olduğunda kullanılacak yedek bağdaştırıcı kimliği                                       |
| `enabled`  | `boolean` | `true`           | Bellek aramasını etkinleştirin veya devre dışı bırakın                                                  |

### Otomatik algılama sırası

`provider` ayarlanmadığında, OpenClaw kullanılabilir ilk seçeneği seçer:

1. `local` -- `memorySearch.local.modelPath` yapılandırılmışsa ve dosya mevcutsa.
2. `openai` -- bir OpenAI anahtarı çözümlenebiliyorsa.
3. `gemini` -- bir Gemini anahtarı çözümlenebiliyorsa.
4. `voyage` -- bir Voyage anahtarı çözümlenebiliyorsa.
5. `mistral` -- bir Mistral anahtarı çözümlenebiliyorsa.

`ollama` desteklenir ancak otomatik algılanmaz (açıkça ayarlayın).

### API anahtarı çözümleme

Uzak embedding'ler bir API anahtarı gerektirir. OpenClaw bunu şu kaynaklardan çözümler:
kimlik doğrulama profilleri, `models.providers.*.apiKey` veya ortam değişkenleri.

| Provider | Env var                        | Config key                        |
| -------- | ------------------------------ | --------------------------------- |
| OpenAI   | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`  |
| Gemini   | `GEMINI_API_KEY`               | `models.providers.google.apiKey`  |
| Voyage   | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`  |
| Mistral  | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey` |
| Ollama   | `OLLAMA_API_KEY` (yer tutucu) | --                                |

Codex OAuth yalnızca sohbet/tamamlama işlemlerini kapsar ve embedding
isteklerini karşılamaz.

---

## Uzak uç nokta yapılandırması

Özel OpenAI uyumlu uç noktalar veya sağlayıcı varsayılanlarını geçersiz kılmak için:

| Key              | Type     | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl` | `string` | Özel API temel URL'si                                |
| `remote.apiKey`  | `string` | API anahtarını geçersiz kıl                                   |
| `remote.headers` | `object` | Ek HTTP üst bilgileri (sağlayıcı varsayılanlarıyla birleştirilir) |

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

| Key                    | Type     | Default                | Description                                |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Ayrıca `gemini-embedding-2-preview` de desteklenir |
| `outputDimensionality` | `number` | `3072`                 | Embedding 2 için: 768, 1536 veya 3072        |

<Warning>
Modelin veya `outputDimensionality` değerinin değiştirilmesi otomatik tam yeniden dizinlemeyi tetikler.
</Warning>

---

## Yerel embedding yapılandırması

| Key                   | Type     | Default                | Description                     |
| --------------------- | -------- | ---------------------- | ------------------------------- |
| `local.modelPath`     | `string` | otomatik indirilir        | GGUF model dosyasının yolu         |
| `local.modelCacheDir` | `string` | node-llama-cpp varsayılanı | İndirilen modeller için önbellek dizini |

Varsayılan model: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, otomatik indirilir).
Yerel derleme gerektirir: `pnpm approve-builds` ardından `pnpm rebuild node-llama-cpp`.

---

## Hibrit arama yapılandırması

Tümü `memorySearch.query.hybrid` altında yer alır:

| Key                   | Type      | Default | Description                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Hibrit BM25 + vektör aramasını etkinleştir |
| `vectorWeight`        | `number`  | `0.7`   | Vektör puanları için ağırlık (0-1)     |
| `textWeight`          | `number`  | `0.3`   | BM25 puanları için ağırlık (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Aday havuzu boyutu çarpanı     |

### MMR (çeşitlilik)

| Key           | Type      | Default | Description                          |
| ------------- | --------- | ------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false` | MMR yeniden sıralamayı etkinleştir                |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = en yüksek çeşitlilik, 1 = en yüksek alaka |

### Zamansal azalma (güncellik)

| Key                          | Type      | Default | Description               |
| ---------------------------- | --------- | ------- | ------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | Güncellik artırmasını etkinleştir      |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | Puan her N günde yarıya iner |

Sürekli geçerli dosyalar (`MEMORY.md`, `memory/` içindeki tarihsiz dosyalar) hiçbir zaman azaltılmaz.

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

| Key          | Type       | Description                              |
| ------------ | ---------- | ---------------------------------------- |
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

Yollar mutlak veya çalışma alanına göreli olabilir. Dizinler,
`.md` dosyaları için özyinelemeli olarak taranır. Sembolik bağlantı işleme etkin arka uca bağlıdır:
yerleşik motor sembolik bağlantıları yok sayarken, QMD alttaki QMD
tarayıcı davranışını izler.

Aracı kapsamlı, aracılar arası oturum dökümü araması için
`memory.qmd.paths` yerine `agents.list[].memorySearch.qmd.extraCollections`
kullanın.
Bu ek koleksiyonlar aynı `{ path, name, pattern? }` biçimini izler, ancak
aracı başına birleştirilir ve yol mevcut çalışma alanının dışını işaret ettiğinde
açık paylaşılan adları koruyabilir.
Aynı çözümlenmiş yol hem `memory.qmd.paths` hem de
`memorySearch.qmd.extraCollections` içinde görünürse, QMD ilk girdiyi tutar ve
yineleneni atlar.

---

## Çok modlu bellek (Gemini)

Gemini Embedding 2 kullanarak Markdown ile birlikte görselleri ve sesi dizinleyin:

| Key                       | Type       | Default    | Description                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Çok modlu dizinlemeyi etkinleştir             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` veya `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Dizinleme için en büyük dosya boyutu             |

Yalnızca `extraPaths` içindeki dosyalar için geçerlidir. Varsayılan bellek kökleri yalnızca Markdown olarak kalır.
`gemini-embedding-2-preview` gerektirir. `fallback` değeri `"none"` olmalıdır.

Desteklenen biçimler: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(görseller); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (ses).

---

## Embedding önbelleği

| Key                | Type      | Default | Description                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Parça embedding'lerini SQLite içinde önbelleğe al |
| `cache.maxEntries` | `number`  | `50000` | En fazla önbelleğe alınan embedding sayısı            |

Yeniden dizinleme veya döküm güncellemeleri sırasında değişmemiş metnin yeniden embedding işleminden geçmesini önler.

---

## Toplu dizinleme

| Key                           | Type      | Default | Description                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Toplu embedding API'sini etkinleştir |
| `remote.batch.concurrency`    | `number`  | `2`     | Paralel toplu işler        |
| `remote.batch.wait`           | `boolean` | `true`  | Toplu iş tamamlanmasını bekle  |
| `remote.batch.pollIntervalMs` | `number`  | --      | Yoklama aralığı              |
| `remote.batch.timeoutMinutes` | `number`  | --      | Toplu iş zaman aşımı              |

`openai`, `gemini` ve `voyage` için kullanılabilir. OpenAI toplu işlem genellikle
büyük geri doldurma işlemleri için en hızlı ve en ucuz seçenektir.

---

## Oturum belleği araması (deneysel)

Oturum dökümlerini dizinleyin ve bunları `memory_search` aracılığıyla sunun:

| Key                           | Type       | Default      | Description                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Oturum dizinlemeyi etkinleştir                 |
| `sources`                     | `string[]` | `["memory"]` | Dökümleri dahil etmek için `"sessions"` ekleyin |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Yeniden dizinleme için bayt eşiği              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Yeniden dizinleme için mesaj eşiği           |

Oturum dizinleme isteğe bağlıdır ve eşzamansız olarak çalışır. Sonuçlar biraz
eski olabilir. Oturum günlükleri diskte bulunduğundan, dosya sistemi erişimini
güven sınırı olarak değerlendirin.

---

## SQLite vektör hızlandırma (sqlite-vec)

| Key                          | Type      | Default | Description                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Vektör sorguları için sqlite-vec kullan |
| `store.vector.extensionPath` | `string`  | bundled | sqlite-vec yolunu geçersiz kıl          |

sqlite-vec kullanılamadığında, OpenClaw otomatik olarak işlem içi kosinüs
benzerliğine geri döner.

---

## Dizin depolama

| Key                   | Type     | Default                               | Description                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Dizin konumu (`{agentId}` belirtecini destekler) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 belirteç ayırıcısı (`unicode61` veya `trigram`)   |

---

## QMD arka uç yapılandırması

Etkinleştirmek için `memory.backend = "qmd"` ayarlayın. Tüm QMD ayarları
`memory.qmd` altında bulunur:

| Key                      | Type      | Default  | Description                                  |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD yürütülebilir dosya yolu                          |
| `searchMode`             | `string`  | `search` | Arama komutu: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` otomatik dizinle    |
| `paths[]`                | `array`   | --       | Ek yollar: `{ name, path, pattern? }`      |
| `sessions.enabled`       | `boolean` | `false`  | Oturum dökümlerini dizinle                    |
| `sessions.retentionDays` | `number`  | --       | Döküm saklama süresi                         |
| `sessions.exportDir`     | `string`  | --       | Dışa aktarma dizini                             |

### Güncelleme zamanlaması

| Key                       | Type      | Default | Description                           |
| ------------------------- | --------- | ------- | ------------------------------------- |
| `update.interval`         | `string`  | `5m`    | Yenileme aralığı                      |
| `update.debounceMs`       | `number`  | `15000` | Dosya değişikliklerini debounce et                 |
| `update.onBoot`           | `boolean` | `true`  | Başlangıçta yenile                    |
| `update.waitForBootSync`  | `boolean` | `false` | Yenileme tamamlanana kadar başlangıcı engelle |
| `update.embedInterval`    | `string`  | --      | Ayrı embedding sıklığı                |
| `update.commandTimeoutMs` | `number`  | --      | QMD komutları için zaman aşımı              |
| `update.updateTimeoutMs`  | `number`  | --      | QMD güncelleme işlemleri için zaman aşımı     |
| `update.embedTimeoutMs`   | `number`  | --      | QMD embedding işlemleri için zaman aşımı      |

### Sınırlar

| Key                       | Type     | Default | Description                |
| ------------------------- | -------- | ------- | -------------------------- |
| `limits.maxResults`       | `number` | `6`     | En fazla arama sonucu         |
| `limits.maxSnippetChars`  | `number` | --      | Parçacık uzunluğunu sınırla       |
| `limits.maxInjectedChars` | `number` | --      | Toplam eklenen karakteri sınırla |
| `limits.timeoutMs`        | `number` | `4000`  | Arama zaman aşımı             |

### Kapsam

Hangi oturumların QMD arama sonuçları alabileceğini denetler. Şununla aynı şema:
[`session.sendPolicy`](/tr/gateway/configuration-reference#session):

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

Varsayılan yalnızca DM'dir. `match.keyPrefix` normalleştirilmiş oturum anahtarıyla eşleşir;
`match.rawKeyPrefix`, `agent:<id>:` dahil ham anahtarla eşleşir.

### Alıntılar

`memory.citations` tüm arka uçlar için geçerlidir:

| Value            | Behavior                                            |
| ---------------- | --------------------------------------------------- |
| `auto` (varsayılan) | Parçacıklara `Source: <path#line>` alt bilgisini ekle    |
| `on`             | Alt bilgiyi her zaman ekle                               |
| `off`            | Alt bilgiyi çıkar (yol yine de aracıya dahili olarak aktarılır) |

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
`plugins.entries.memory-core.config.dreaming` altında yapılandırılır. Kavramsal ayrıntılar ve sohbet
komutları için [Dreaming](/tr/concepts/memory-dreaming) bölümüne bakın.

| Key                | Type     | Default        | Description                               |
| ------------------ | -------- | -------------- | ----------------------------------------- |
| `mode`             | `string` | `"off"`        | Ön ayar: `off`, `core`, `rem` veya `deep`   |
| `cron`             | `string` | ön ayar varsayılanı | Zamanlama için Cron ifadesi geçersiz kılma |
| `timezone`         | `string` | kullanıcı saat dilimi  | Zamanlama değerlendirmesi için saat dilimi          |
| `limit`            | `number` | ön ayar varsayılanı | Döngü başına yükseltilecek en fazla aday       |
| `minScore`         | `number` | ön ayar varsayılanı | Yükseltme için en düşük ağırlıklı puan      |
| `minRecallCount`   | `number` | ön ayar varsayılanı | En düşük hatırlama sayısı eşiği            |
| `minUniqueQueries` | `number` | ön ayar varsayılanı | En düşük farklı sorgu sayısı eşiği    |

### Ön ayar varsayılanları

| Mode   | Cadence        | minScore | minRecallCount | minUniqueQueries |
| ------ | -------------- | -------- | -------------- | ---------------- |
| `off`  | Devre dışı       | --       | --             | --               |
| `core` | Her gün 03:00     | 0.75     | 3              | 2                |
| `rem`  | Her 6 saatte bir  | 0.85     | 4              | 3                |
| `deep` | Her 12 saatte bir | 0.80     | 3              | 3                |

### Örnek

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            mode: "core",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```
