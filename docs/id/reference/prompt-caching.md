---
read_when:
    - Anda ingin mengurangi biaya token prompt dengan retensi cache
    - Anda memerlukan perilaku cache per agen dalam penyiapan multi-agen
    - Anda sedang menyesuaikan Heartbeat dan pemangkasan cache-ttl secara bersamaan
summary: Pengaturan caching prompt, urutan penggabungan, perilaku penyedia, dan pola penyetelan
title: Caching prompt
x-i18n:
    generated_at: "2026-06-27T18:10:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68b4d0cb086603ebb12e4ce0edc892fb94efd09cb52faa9884b2f5ab0741585c
    source_path: reference/prompt-caching.md
    workflow: 16
---

Prompt caching berarti penyedia model dapat menggunakan ulang prefiks prompt yang tidak berubah (biasanya instruksi sistem/developer dan konteks stabil lainnya) lintas giliran alih-alih memprosesnya ulang setiap kali. OpenClaw menormalkan penggunaan penyedia menjadi `cacheRead` dan `cacheWrite` ketika API upstream mengekspos penghitung tersebut secara langsung.

Permukaan status juga dapat memulihkan penghitung cache dari log penggunaan
transkrip terbaru ketika snapshot sesi live tidak memilikinya, sehingga `/status` dapat tetap
menampilkan baris cache setelah hilangnya sebagian metadata sesi. Nilai cache live
bukan nol yang sudah ada tetap didahulukan dibanding nilai fallback transkrip.

Mengapa ini penting: biaya token lebih rendah, respons lebih cepat, dan performa yang lebih dapat diprediksi untuk sesi yang berjalan lama. Tanpa caching, prompt berulang membayar biaya prompt penuh pada setiap giliran meskipun sebagian besar input tidak berubah.

Bagian di bawah ini mencakup setiap knob terkait cache yang memengaruhi penggunaan ulang prompt dan biaya token.

Referensi penyedia:

- Anthropic prompt caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI prompt caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API OpenAI dan ID permintaan: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID permintaan dan galat Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Knob utama

### `cacheRetention` (default global, model, dan per-agent)

Tetapkan retensi cache sebagai default global untuk semua model:

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

Timpa per agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Urutan penggabungan konfigurasi:

1. `agents.defaults.params` (default global — berlaku untuk semua model)
2. `agents.defaults.models["provider/model"].params` (penggantian per model)
3. `agents.list[].params` (id agent yang cocok; menimpa berdasarkan kunci)

### `contextPruning.mode: "cache-ttl"`

Memangkas konteks hasil tool lama setelah jendela TTL cache sehingga permintaan pasca-idle tidak melakukan cache ulang riwayat yang terlalu besar.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Lihat [Pemangkasan Sesi](/id/concepts/session-pruning) untuk perilaku lengkap.

### Heartbeat keep-warm

Heartbeat dapat menjaga jendela cache tetap hangat dan mengurangi penulisan cache berulang setelah jeda idle.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agent didukung di `agents.list[].heartbeat`.

## Perilaku penyedia

### Anthropic (API langsung)

- `cacheRetention` didukung.
- Dengan profil autentikasi kunci API Anthropic, OpenClaw mengisi `cacheRetention: "short"` untuk referensi model Anthropic ketika belum diatur.
- Respons Messages native Anthropic mengekspos `cache_read_input_tokens` dan `cache_creation_input_tokens`, sehingga OpenClaw dapat menampilkan `cacheRead` dan `cacheWrite`.
- Untuk permintaan Anthropic native, `cacheRetention: "short"` dipetakan ke cache ephemeral default 5 menit, dan `cacheRetention: "long"` ditingkatkan ke TTL 1 jam hanya pada host langsung `api.anthropic.com`.

### OpenAI (API langsung)

- Prompt caching otomatis pada model terbaru yang didukung. OpenClaw tidak perlu menyuntikkan penanda cache tingkat blok.
- OpenClaw menggunakan `prompt_cache_key` untuk menjaga perutean cache tetap stabil lintas giliran. Host OpenAI langsung menggunakan `prompt_cache_retention: "24h"` ketika `cacheRetention: "long"` dipilih.
- Penyedia Completions yang kompatibel dengan OpenAI menerima `prompt_cache_key` hanya ketika konfigurasi modelnya secara eksplisit menetapkan `compat.supportsPromptCacheKey: true`. Penerusan retensi panjang adalah kapabilitas terpisah: `cacheRetention: "long"` eksplisit mengirim `prompt_cache_retention: "24h"` hanya ketika entri kompatibilitas tersebut juga mendukung retensi cache panjang. Penyedia seperti Mistral dapat ikut memakai kunci cache sambil menetapkan `compat.supportsLongCacheRetention: false` untuk menekan kolom retensi panjang. `cacheRetention: "none"` menekan kedua kolom.
- Respons OpenAI mengekspos token prompt yang di-cache melalui `usage.prompt_tokens_details.cached_tokens` (atau `input_tokens_details.cached_tokens` pada event Responses API). OpenClaw memetakannya ke `cacheRead`.
- OpenAI tidak mengekspos penghitung token penulisan cache terpisah, sehingga `cacheWrite` tetap `0` pada jalur OpenAI meskipun penyedia sedang menghangatkan cache.
- OpenAI mengembalikan header penelusuran dan batas laju yang berguna seperti `x-request-id`, `openai-processing-ms`, dan `x-ratelimit-*`, tetapi akuntansi cache-hit harus berasal dari payload penggunaan, bukan dari header.
- Dalam praktiknya, OpenAI sering berperilaku seperti cache prefiks awal, bukan penggunaan ulang riwayat penuh bergerak ala Anthropic. Giliran teks prefiks panjang yang stabil dapat berada dekat plateau `4864` token yang di-cache dalam probe live saat ini, sementara transkrip sarat tool atau bergaya MCP sering plateau dekat `4608` token yang di-cache bahkan pada pengulangan persis.

### Anthropic Vertex

- Model Anthropic di Vertex AI (`anthropic-vertex/*`) mendukung `cacheRetention` dengan cara yang sama seperti Anthropic langsung.
- `cacheRetention: "long"` dipetakan ke TTL prompt-cache 1 jam nyata pada endpoint Vertex AI.
- Retensi cache default untuk `anthropic-vertex` cocok dengan default Anthropic langsung.
- Permintaan Vertex dirutekan melalui pembentukan cache yang sadar batas sehingga penggunaan ulang cache tetap selaras dengan apa yang benar-benar diterima penyedia.

### Amazon Bedrock

- Referensi model Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) mendukung pass-through `cacheRetention` eksplisit.
- Model Bedrock non-Anthropic dipaksa ke `cacheRetention: "none"` saat runtime.

### Model OpenRouter

Untuk referensi model `openrouter/anthropic/*`, OpenClaw menyuntikkan
`cache_control` pada blok prompt sistem/developer untuk meningkatkan penggunaan ulang
prompt-cache hanya ketika permintaan masih menargetkan rute OpenRouter yang terverifikasi
(`openrouter` pada endpoint defaultnya, atau penyedia/base URL apa pun yang diselesaikan
ke `openrouter.ai`).

Untuk referensi model `openrouter/deepseek/*`, `openrouter/moonshot*/*`, dan `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` diizinkan karena OpenRouter
menangani prompt caching sisi penyedia secara otomatis. OpenClaw tidak menyuntikkan
penanda Anthropic `cache_control` ke dalam permintaan tersebut.

Konstruksi cache DeepSeek bersifat best-effort dan dapat memakan waktu beberapa detik. Tindak lanjut
langsung mungkin masih menampilkan `cached_tokens: 0`; verifikasi dengan permintaan
prefiks-sama yang diulang setelah jeda singkat dan gunakan `usage.prompt_tokens_details.cached_tokens`
sebagai sinyal cache-hit.

Jika Anda mengarahkan ulang model ke URL proxy kompatibel OpenAI arbitrer, OpenClaw
berhenti menyuntikkan penanda cache Anthropic khusus OpenRouter tersebut.

### Penyedia lain

Jika penyedia tidak mendukung mode cache ini, `cacheRetention` tidak berpengaruh.

### API langsung Google Gemini

- Transport Gemini langsung (`api: "google-generative-ai"`) melaporkan cache hit
  melalui `cachedContentTokenCount` upstream; OpenClaw memetakannya ke `cacheRead`.
- Ketika `cacheRetention` ditetapkan pada model Gemini langsung, OpenClaw secara otomatis
  membuat, menggunakan ulang, dan menyegarkan resource `cachedContents` untuk prompt sistem
  pada run Google AI Studio. Ini berarti Anda tidak perlu lagi membuat handle
  cached-content terlebih dahulu secara manual.
- Anda masih dapat meneruskan handle cached-content Gemini yang sudah ada sebagai
  `params.cachedContent` (atau legacy `params.cached_content`) pada model yang dikonfigurasi.
- Ini terpisah dari caching prefiks prompt Anthropic/OpenAI. Untuk Gemini,
  OpenClaw mengelola resource `cachedContents` native penyedia alih-alih
  menyuntikkan penanda cache ke dalam permintaan.

### Penggunaan Gemini CLI

- Output `stream-json` Gemini CLI dapat memunculkan cache hit melalui `stats.cached`;
  OpenClaw memetakannya ke `cacheRead`. Penggantian legacy `--output-format json` menggunakan
  normalisasi penggunaan yang sama.
- Jika CLI menghilangkan nilai langsung `stats.input`, OpenClaw menurunkan token input
  dari `stats.input_tokens - stats.cached`.
- Ini hanya normalisasi penggunaan. Ini tidak berarti OpenClaw membuat
  penanda prompt-cache bergaya Anthropic/OpenAI untuk Gemini CLI.

## Batas cache prompt sistem

OpenClaw membagi prompt sistem menjadi **prefiks stabil** dan **sufiks volatil**
yang dipisahkan oleh batas prefiks-cache internal. Konten di atas
batas (definisi tool, metadata Skills, file workspace, dan konteks lain yang
relatif statis) diurutkan agar tetap identik byte lintas giliran.
Konten di bawah batas (misalnya `HEARTBEAT.md`, timestamp runtime, dan
metadata per giliran lainnya) diizinkan berubah tanpa membatalkan prefiks
yang di-cache.

Pilihan desain utama:

- File konteks proyek workspace yang stabil diurutkan sebelum `HEARTBEAT.md` sehingga
  churn heartbeat tidak merusak prefiks stabil.
- Batas diterapkan pada pembentukan transport keluarga Anthropic, keluarga OpenAI, Google, dan
  CLI sehingga semua penyedia yang didukung mendapat manfaat dari stabilitas prefiks yang sama.
- Permintaan Codex Responses dan Anthropic Vertex dirutekan melalui
  pembentukan cache yang sadar batas sehingga penggunaan ulang cache tetap selaras dengan apa yang
  benar-benar diterima penyedia.
- Sidik jari prompt sistem dinormalisasi (spasi, akhir baris,
  konteks yang ditambahkan hook, pengurutan kapabilitas runtime) sehingga prompt yang secara semantik
  tidak berubah berbagi KV/cache lintas giliran.

Jika Anda melihat lonjakan `cacheWrite` yang tidak terduga setelah perubahan konfigurasi atau workspace,
periksa apakah perubahan tersebut berada di atas atau di bawah batas cache. Memindahkan
konten volatil ke bawah batas (atau menstabilkannya) sering menyelesaikan
masalah.

## Guard stabilitas cache OpenClaw

OpenClaw juga menjaga beberapa bentuk payload yang sensitif cache tetap deterministik sebelum
permintaan mencapai penyedia:

- Katalog tool Bundle MCP diurutkan secara deterministik sebelum pendaftaran
  tool, sehingga perubahan urutan `listTools()` tidak mengubah blok tools dan
  merusak prefiks prompt-cache.
- Sesi legacy dengan blok gambar yang dipersistahankan menjaga **3 giliran selesai paling baru**
  tetap utuh; blok gambar lama yang sudah diproses dapat
  diganti dengan penanda sehingga tindak lanjut sarat gambar tidak terus mengirim ulang payload
  lama yang besar.

## Pola tuning

### Lalu lintas campuran (default yang direkomendasikan)

Pertahankan baseline berumur panjang pada agent utama Anda, nonaktifkan caching pada agent notifikasi yang bursty:

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

- Tetapkan baseline `cacheRetention: "short"`.
- Aktifkan `contextPruning.mode: "cache-ttl"`.
- Pertahankan heartbeat di bawah TTL Anda hanya untuk agent yang mendapat manfaat dari cache hangat.

## Diagnostik cache

OpenClaw mengekspos diagnostik cache-trace khusus untuk run agent tertanam.

Untuk diagnostik normal yang terlihat pengguna, `/status` dan ringkasan penggunaan lainnya dapat menggunakan
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

File baseline menyimpan angka live teramati terbaru ditambah floor regresi khusus penyedia yang digunakan oleh pengujian.
Runner juga menggunakan ID sesi dan namespace prompt per-run yang baru sehingga status cache sebelumnya tidak mencemari sampel regresi saat ini.

Pengujian ini sengaja tidak menggunakan kriteria keberhasilan yang identik di semua penyedia.

### Ekspektasi live Anthropic

- Harapkan penulisan warmup eksplisit melalui `cacheWrite`.
- Harapkan penggunaan ulang riwayat yang hampir penuh pada giliran berulang karena kontrol cache Anthropic memajukan breakpoint cache sepanjang percakapan.
- Assertion live saat ini masih menggunakan ambang hit rate tinggi untuk jalur stabil, tool, dan gambar.

### Ekspektasi live OpenAI

- Harapkan hanya `cacheRead`. `cacheWrite` tetap `0`.
- Perlakukan penggunaan ulang cache pada giliran berulang sebagai plateau khusus penyedia, bukan sebagai penggunaan ulang riwayat penuh bergerak ala Anthropic.
- Assertion live saat ini menggunakan pemeriksaan batas bawah konservatif yang diturunkan dari perilaku live yang diamati pada `gpt-5.4-mini`:
  - prefiks stabil: `cacheRead >= 4608`, hit rate `>= 0.90`
  - transkrip tool: `cacheRead >= 4096`, hit rate `>= 0.85`
  - transkrip gambar: `cacheRead >= 3840`, hit rate `>= 0.82`
  - transkrip gaya MCP: `cacheRead >= 4096`, hit rate `>= 0.85`

Verifikasi live gabungan terbaru pada 2026-04-04 mencapai:

- prefiks stabil: `cacheRead=4864`, hit rate `0.966`
- transkrip tool: `cacheRead=4608`, hit rate `0.896`
- transkrip gambar: `cacheRead=4864`, hit rate `0.954`
- transkrip gaya MCP: `cacheRead=4608`, hit rate `0.891`

Waktu wall-clock lokal terbaru untuk gate gabungan sekitar `88s`.

Mengapa assertion berbeda:

- Anthropic mengekspos breakpoint cache eksplisit dan penggunaan ulang riwayat percakapan yang bergerak.
- Caching prompt OpenAI masih sensitif terhadap prefiks persis, tetapi prefiks efektif yang dapat digunakan ulang dalam trafik Responses live dapat plateau lebih awal daripada prompt penuh.
- Karena itu, membandingkan Anthropic dan OpenAI dengan satu ambang persentase lintas penyedia akan menciptakan regresi palsu.

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

- `OPENCLAW_CACHE_TRACE=1` mengaktifkan penelusuran cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` menimpa jalur output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` mengaktifkan/menonaktifkan penangkapan payload pesan penuh.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` mengaktifkan/menonaktifkan penangkapan teks prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` mengaktifkan/menonaktifkan penangkapan prompt sistem.

### Yang perlu diperiksa

- Event trace cache berupa JSONL dan mencakup snapshot bertahap seperti `session:loaded`, `prompt:before`, `stream:context`, dan `session:after`.
- Dampak token cache per giliran terlihat di permukaan penggunaan normal melalui `cacheRead` dan `cacheWrite` (misalnya `/usage full` dan ringkasan penggunaan sesi).
- Untuk Anthropic, harapkan `cacheRead` dan `cacheWrite` saat caching aktif.
- Untuk OpenAI, harapkan `cacheRead` pada cache hit dan `cacheWrite` tetap `0`; OpenAI tidak menerbitkan field token penulisan cache terpisah.
- Jika Anda membutuhkan penelusuran request, catat ID request dan header rate-limit secara terpisah dari metrik cache. Output cache-trace OpenClaw saat ini berfokus pada bentuk prompt/sesi dan penggunaan token yang dinormalisasi, bukan header respons penyedia mentah.

## Troubleshooting cepat

- `cacheWrite` tinggi pada sebagian besar giliran: periksa input prompt sistem yang volatil dan verifikasi model/penyedia mendukung pengaturan cache Anda.
- `cacheWrite` tinggi pada Anthropic: sering berarti breakpoint cache mendarat pada konten yang berubah setiap request.
- `cacheRead` OpenAI rendah: verifikasi prefiks stabil berada di depan, prefiks berulang setidaknya 1024 token, dan `prompt_cache_key` yang sama digunakan ulang untuk giliran yang seharusnya berbagi cache.
- Tidak ada efek dari `cacheRetention`: pastikan kunci model cocok dengan `agents.defaults.models["provider/model"]`.
- Request Bedrock Nova/Mistral dengan pengaturan cache: runtime diharapkan memaksa ke `none`.

Dokumen terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan dan biaya token](/id/reference/token-use)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Referensi konfigurasi Gateway](/id/gateway/configuration-reference)

## Terkait

- [Penggunaan dan biaya token](/id/reference/token-use)
- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
