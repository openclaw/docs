---
read_when:
    - Anda ingin mengurangi biaya token prompt dengan retensi cache
    - Anda memerlukan perilaku cache per agen dalam penyiapan multi-agen
    - Anda sedang menyetel Heartbeat dan pemangkasan cache-ttl secara bersamaan
summary: Pengaturan caching prompt, urutan penggabungan, perilaku penyedia, dan pola penyesuaian
title: Penyimpanan prompt dalam cache
x-i18n:
    generated_at: "2026-07-01T08:33:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

Caching prompt berarti penyedia model dapat menggunakan ulang prefiks prompt yang tidak berubah (biasanya instruksi sistem/developer dan konteks stabil lain) antar giliran alih-alih memprosesnya ulang setiap kali. OpenClaw menormalkan penggunaan penyedia menjadi `cacheRead` dan `cacheWrite` ketika API upstream mengekspos penghitung tersebut secara langsung.

Permukaan status juga dapat memulihkan penghitung cache dari log penggunaan transkrip
terbaru ketika snapshot sesi live tidak memilikinya, sehingga `/status` dapat tetap
menampilkan baris cache setelah sebagian metadata sesi hilang. Nilai cache live
bukan nol yang sudah ada tetap didahulukan daripada nilai fallback transkrip.

Mengapa ini penting: biaya token lebih rendah, respons lebih cepat, dan performa yang lebih dapat diprediksi untuk sesi jangka panjang. Tanpa caching, prompt berulang membayar biaya prompt penuh pada setiap giliran meskipun sebagian besar input tidak berubah.

Bagian di bawah mencakup setiap knob terkait cache yang memengaruhi penggunaan ulang prompt dan biaya token.

Referensi penyedia:

- Caching prompt Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Caching prompt OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API dan ID permintaan OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID permintaan dan error Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Knob utama

### `cacheRetention` (default global, model, dan per-agent)

Atur retensi cache sebagai default global untuk semua model:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Timpa per model:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Timpa per-agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Urutan penggabungan config:

1. `agents.defaults.params` (default global — berlaku untuk semua model)
2. `agents.defaults.models["provider/model"].params` (override per-model)
3. `agents.list[].params` (id agent yang cocok; menimpa berdasarkan key)

### `contextPruning.mode: "cache-ttl"`

Memangkas konteks hasil tool lama setelah jendela TTL cache sehingga permintaan setelah idle tidak men-cache ulang riwayat yang terlalu besar.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Lihat [Pemangkasan Sesi](/id/concepts/session-pruning) untuk perilaku lengkap.

### Heartbeat penjaga kehangatan

Heartbeat dapat menjaga jendela cache tetap hangat dan mengurangi penulisan cache berulang setelah jeda idle.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per-agent didukung di `agents.list[].heartbeat`.

## Perilaku penyedia

### Anthropic (API langsung)

- `cacheRetention` didukung.
- Dengan profil auth kunci API Anthropic, OpenClaw mengisi awal `cacheRetention: "short"` untuk ref model Anthropic ketika belum disetel.
- Respons Messages native Anthropic mengekspos `cache_read_input_tokens` dan `cache_creation_input_tokens`, sehingga OpenClaw dapat menampilkan `cacheRead` dan `cacheWrite`.
- Untuk permintaan Anthropic native, `cacheRetention: "short"` dipetakan ke cache ephemeral default 5 menit, dan `cacheRetention: "long"` ditingkatkan ke TTL 1 jam hanya pada host langsung `api.anthropic.com`.

### OpenAI (API langsung)

- Caching prompt otomatis pada model terbaru yang didukung. OpenClaw tidak perlu menyisipkan marker cache tingkat blok.
- OpenClaw menggunakan `prompt_cache_key` untuk menjaga routing cache tetap stabil antar giliran. Host OpenAI langsung menggunakan `prompt_cache_retention: "24h"` ketika `cacheRetention: "long"` dipilih.
- Penyedia Completions yang kompatibel dengan OpenAI menerima `prompt_cache_key` hanya ketika config modelnya secara eksplisit menetapkan `compat.supportsPromptCacheKey: true`. Penerusan retensi panjang adalah kapabilitas terpisah: `cacheRetention: "long"` eksplisit mengirim `prompt_cache_retention: "24h"` hanya ketika entri compat tersebut juga mendukung retensi cache panjang. Penyedia seperti Mistral dapat memilih ikut menggunakan key cache sambil menetapkan `compat.supportsLongCacheRetention: false` untuk menekan field retensi panjang. `cacheRetention: "none"` menekan kedua field.
- Respons OpenAI mengekspos token prompt yang di-cache melalui `usage.prompt_tokens_details.cached_tokens` (atau `input_tokens_details.cached_tokens` pada event Responses API). OpenClaw memetakannya ke `cacheRead`.
- Penggunaan GPT-5.6 Responses juga dapat mengekspos `input_tokens_details.cache_write_tokens`. OpenClaw memetakannya ke `cacheWrite` dan menghargainya sesuai tarif cache-write model; Responses yang menghilangkan field tersebut mempertahankan `cacheWrite` pada `0`.
- OpenAI mengembalikan header pelacakan dan batas laju yang berguna seperti `x-request-id`, `openai-processing-ms`, dan `x-ratelimit-*`, tetapi akuntansi cache hit harus berasal dari payload penggunaan, bukan dari header.
- Dalam praktiknya, OpenAI sering berperilaku seperti cache prefiks awal, bukan penggunaan ulang riwayat penuh bergerak bergaya Anthropic. Giliran teks berprefiks panjang yang stabil dapat berada dekat plateau token cache `4864` dalam probe live saat ini, sementara transkrip yang sarat tool atau bergaya MCP sering plateau dekat `4608` token cache bahkan pada pengulangan persis.

### Anthropic Vertex

- Model Anthropic di Vertex AI (`anthropic-vertex/*`) mendukung `cacheRetention` dengan cara yang sama seperti Anthropic langsung.
- `cacheRetention: "long"` dipetakan ke TTL cache prompt 1 jam nyata pada endpoint Vertex AI.
- Retensi cache default untuk `anthropic-vertex` sama dengan default Anthropic langsung.
- Permintaan Vertex dirutekan melalui pembentukan cache sadar-boundary sehingga penggunaan ulang cache tetap selaras dengan apa yang benar-benar diterima penyedia.

### Amazon Bedrock

- Ref model Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) mendukung pass-through `cacheRetention` eksplisit.
- Model Bedrock non-Anthropic dipaksa menjadi `cacheRetention: "none"` saat runtime.

### Model OpenRouter

Untuk ref model `openrouter/anthropic/*`, OpenClaw menyisipkan
`cache_control` Anthropic pada blok prompt sistem/developer untuk meningkatkan
penggunaan ulang cache prompt hanya ketika permintaan masih menargetkan rute
OpenRouter terverifikasi (`openrouter` pada endpoint defaultnya, atau penyedia/base URL
apa pun yang beresolusi ke `openrouter.ai`).

Untuk ref model `openrouter/deepseek/*`, `openrouter/moonshot*/*`, dan `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` diizinkan karena OpenRouter
menangani caching prompt sisi penyedia secara otomatis. OpenClaw tidak menyisipkan
marker `cache_control` Anthropic ke dalam permintaan tersebut.

Konstruksi cache DeepSeek bersifat best-effort dan dapat memerlukan beberapa detik. Tindak lanjut
langsung mungkin masih menampilkan `cached_tokens: 0`; verifikasi dengan permintaan
berprefiks sama yang diulang setelah jeda singkat dan gunakan `usage.prompt_tokens_details.cached_tokens`
sebagai sinyal cache hit.

Jika Anda mengarahkan ulang model ke URL proxy kompatibel OpenAI sembarang, OpenClaw
berhenti menyisipkan marker cache Anthropic khusus OpenRouter tersebut.

### Penyedia lain

Jika penyedia tidak mendukung mode cache ini, `cacheRetention` tidak berpengaruh.

### API langsung Google Gemini

- Transport Gemini langsung (`api: "google-generative-ai"`) melaporkan cache hit
  melalui `cachedContentTokenCount` upstream; OpenClaw memetakannya ke `cacheRead`.
- Ketika `cacheRetention` disetel pada model Gemini langsung, OpenClaw secara otomatis
  membuat, menggunakan ulang, dan menyegarkan resource `cachedContents` untuk prompt sistem
  pada run Google AI Studio. Ini berarti Anda tidak lagi perlu membuat handle
  cached-content lebih dulu secara manual.
- Anda tetap dapat meneruskan handle cached-content Gemini yang sudah ada sebagai
  `params.cachedContent` (atau legacy `params.cached_content`) pada model yang dikonfigurasi.
- Ini terpisah dari caching prefiks prompt Anthropic/OpenAI. Untuk Gemini,
  OpenClaw mengelola resource `cachedContents` native penyedia alih-alih
  menyisipkan marker cache ke dalam permintaan.

### Penggunaan Gemini CLI

- Output Gemini CLI `stream-json` dapat menampilkan cache hit melalui `stats.cached`;
  OpenClaw memetakannya ke `cacheRead`. Override legacy `--output-format json` menggunakan
  normalisasi penggunaan yang sama.
- Jika CLI menghilangkan nilai langsung `stats.input`, OpenClaw menurunkan token input
  dari `stats.input_tokens - stats.cached`.
- Ini hanya normalisasi penggunaan. Ini tidak berarti OpenClaw membuat
  marker cache prompt bergaya Anthropic/OpenAI untuk Gemini CLI.

## Boundary cache prompt sistem

OpenClaw membagi prompt sistem menjadi **prefiks stabil** dan **sufiks volatil**
yang dipisahkan oleh boundary prefiks cache internal. Konten di atas
boundary (definisi tool, metadata Skills, file workspace, dan konteks lain yang
relatif statis) diurutkan agar tetap identik byte antar giliran.
Konten di bawah boundary (misalnya `HEARTBEAT.md`, timestamp runtime, dan
metadata per-giliran lain) boleh berubah tanpa membatalkan prefiks yang di-cache.

Pilihan desain utama:

- File konteks proyek workspace yang stabil diurutkan sebelum `HEARTBEAT.md` sehingga
  churn heartbeat tidak merusak prefiks stabil.
- Boundary diterapkan di seluruh pembentukan transport keluarga Anthropic, keluarga OpenAI, Google, dan
  CLI sehingga semua penyedia yang didukung mendapat manfaat dari stabilitas prefiks yang sama.
- Permintaan Codex Responses dan Anthropic Vertex dirutekan melalui
  pembentukan cache sadar-boundary sehingga penggunaan ulang cache tetap selaras dengan apa yang benar-benar
  diterima penyedia.
- Fingerprint prompt sistem dinormalkan (whitespace, akhir baris,
  konteks yang ditambahkan hook, pengurutan kapabilitas runtime) sehingga prompt yang
  tidak berubah secara semantik berbagi KV/cache antar giliran.

Jika Anda melihat lonjakan `cacheWrite` yang tidak terduga setelah perubahan config atau workspace,
periksa apakah perubahan tersebut berada di atas atau di bawah boundary cache. Memindahkan
konten volatil ke bawah boundary (atau menstabilkannya) sering menyelesaikan
masalah.

## Guard stabilitas cache OpenClaw

OpenClaw juga menjaga beberapa bentuk payload yang sensitif terhadap cache tetap deterministik sebelum
permintaan mencapai penyedia:

- Katalog tool MCP bundle diurutkan secara deterministik sebelum registrasi tool,
  sehingga perubahan urutan `listTools()` tidak mengubah blok tool dan
  merusak prefiks cache prompt.
- Sesi legacy dengan blok gambar yang tersimpan mempertahankan **3 giliran selesai
  terbaru** secara utuh; blok gambar lebih lama yang sudah diproses dapat
  diganti dengan marker sehingga tindak lanjut yang sarat gambar tidak terus mengirim ulang
  payload lama yang besar.

## Pola tuning

### Lalu lintas campuran (default yang direkomendasikan)

Pertahankan baseline jangka panjang pada agent utama Anda, nonaktifkan caching pada agent notifier yang bursty:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Baseline yang mengutamakan biaya

- Setel baseline `cacheRetention: "short"`.
- Aktifkan `contextPruning.mode: "cache-ttl"`.
- Pertahankan heartbeat di bawah TTL Anda hanya untuk agent yang mendapat manfaat dari cache hangat.

## Diagnostik cache

OpenClaw mengekspos diagnostik cache-trace khusus untuk run agent tertanam.

Untuk diagnostik normal yang terlihat pengguna, `/status` dan ringkasan penggunaan lain dapat menggunakan
entri penggunaan transkrip terbaru sebagai sumber fallback untuk `cacheRead` /
`cacheWrite` ketika entri sesi live tidak memiliki penghitung tersebut.

## Uji regresi live

OpenClaw mempertahankan satu gate regresi cache live gabungan untuk prefiks berulang, giliran tool, giliran gambar, transkrip tool bergaya MCP, dan kontrol tanpa-cache Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Jalankan gate live sempit dengan:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

File baseline menyimpan angka live teramati terbaru plus batas bawah regresi khusus penyedia yang digunakan oleh pengujian.
Runner juga menggunakan ID sesi per eksekusi yang segar dan namespace prompt agar status cache sebelumnya tidak mencemari sampel regresi saat ini.

Pengujian ini sengaja tidak menggunakan kriteria keberhasilan yang identik di semua penyedia.

### Ekspektasi live Anthropic

- Harapkan penulisan warmup eksplisit melalui `cacheWrite`.
- Harapkan penggunaan ulang hampir seluruh riwayat pada giliran berulang karena kontrol cache Anthropic memajukan breakpoint cache sepanjang percakapan.
- Assertion live saat ini masih menggunakan ambang hit rate tinggi untuk jalur stabil, tool, dan gambar.

### Ekspektasi live OpenAI

- Harapkan hanya `cacheRead`. `cacheWrite` tetap `0`.
- Perlakukan penggunaan ulang cache pada giliran berulang sebagai plateau khusus penyedia, bukan sebagai penggunaan ulang seluruh riwayat bergerak ala Anthropic.
- Assertion live saat ini menggunakan pemeriksaan batas bawah konservatif yang diturunkan dari perilaku live teramati pada `gpt-5.4-mini`:
  - prefiks stabil: `cacheRead >= 4608`, hit rate `>= 0.90`
  - transkrip tool: `cacheRead >= 4096`, hit rate `>= 0.85`
  - transkrip gambar: `cacheRead >= 3840`, hit rate `>= 0.82`
  - transkrip bergaya MCP: `cacheRead >= 4096`, hit rate `>= 0.85`

Verifikasi live gabungan segar pada 2026-04-04 menghasilkan:

- prefiks stabil: `cacheRead=4864`, hit rate `0.966`
- transkrip tool: `cacheRead=4608`, hit rate `0.896`
- transkrip gambar: `cacheRead=4864`, hit rate `0.954`
- transkrip bergaya MCP: `cacheRead=4608`, hit rate `0.891`

Waktu wall-clock lokal terbaru untuk gate gabungan sekitar `88s`.

Mengapa assertion berbeda:

- Anthropic mengekspos breakpoint cache eksplisit dan penggunaan ulang riwayat percakapan yang bergerak.
- Prompt caching OpenAI masih sensitif terhadap prefiks persis, tetapi prefiks efektif yang dapat digunakan ulang dalam traffic Responses live dapat mencapai plateau lebih awal daripada prompt penuh.
- Karena itu, membandingkan Anthropic dan OpenAI dengan satu ambang persentase lintas penyedia akan membuat regresi palsu.

### Konfigurasi `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Default:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Toggle env (debugging sekali pakai)

- `OPENCLAW_CACHE_TRACE=1` mengaktifkan cache tracing.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` menimpa jalur output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` mengaktifkan atau menonaktifkan pengambilan payload pesan penuh.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` mengaktifkan atau menonaktifkan pengambilan teks prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` mengaktifkan atau menonaktifkan pengambilan system prompt.

### Yang perlu diperiksa

- Event cache trace berbentuk JSONL dan mencakup snapshot bertahap seperti `session:loaded`, `prompt:before`, `stream:context`, dan `session:after`.
- Dampak token cache per giliran terlihat di surface penggunaan normal melalui `cacheRead` dan `cacheWrite` (misalnya `/usage full` dan ringkasan penggunaan sesi).
- Untuk Anthropic, harapkan `cacheRead` dan `cacheWrite` ketika caching aktif.
- Untuk OpenAI, harapkan `cacheRead` pada cache hit. GPT-5.6 Responses juga dapat melaporkan `cacheWrite` saat segmen prompt ditulis; payload Responses lain yang menghilangkan penghitung penulisan mempertahankannya pada `0`.
- Jika Anda membutuhkan request tracing, catat ID permintaan dan header rate-limit secara terpisah dari metrik cache. Output cache-trace OpenClaw saat ini berfokus pada bentuk prompt/sesi dan penggunaan token yang dinormalisasi, bukan header respons penyedia mentah.

## Troubleshooting cepat

- `cacheWrite` tinggi pada sebagian besar giliran: periksa input system-prompt yang volatil dan verifikasi model/penyedia mendukung pengaturan cache Anda.
- `cacheWrite` tinggi pada Anthropic: sering berarti breakpoint cache mendarat pada konten yang berubah di setiap permintaan.
- `cacheRead` OpenAI rendah: verifikasi prefiks stabil berada di depan, prefiks berulang setidaknya 1024 token, dan `prompt_cache_key` yang sama digunakan ulang untuk giliran yang seharusnya berbagi cache.
- Tidak ada efek dari `cacheRetention`: pastikan kunci model cocok dengan `agents.defaults.models["provider/model"]`.
- Permintaan Bedrock Nova/Mistral dengan pengaturan cache: runtime diharapkan memaksa ke `none`.

Dokumen terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan dan biaya token](/id/reference/token-use)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Referensi konfigurasi Gateway](/id/gateway/configuration-reference)

## Terkait

- [Penggunaan dan biaya token](/id/reference/token-use)
- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
