---
read_when:
    - Anda ingin mengurangi biaya token prompt dengan retensi cache
    - Anda memerlukan perilaku cache per agen dalam penyiapan multi-agen
    - Anda sedang menyetel Heartbeat dan pemangkasan cache-ttl secara bersamaan
summary: Pengaturan caching prompt, urutan penggabungan, perilaku penyedia, dan pola penyetelan
title: Caching prompt
x-i18n:
    generated_at: "2026-07-01T20:36:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

Caching prompt berarti penyedia model dapat menggunakan kembali prefiks prompt yang tidak berubah (biasanya instruksi sistem/developer dan konteks stabil lainnya) di antara giliran, alih-alih memprosesnya ulang setiap kali. OpenClaw menormalkan penggunaan penyedia menjadi `cacheRead` dan `cacheWrite` ketika API upstream mengekspos penghitung tersebut secara langsung.

Permukaan status juga dapat memulihkan penghitung cache dari log penggunaan transkrip
terbaru ketika snapshot sesi langsung tidak memilikinya, sehingga `/status` tetap dapat
menampilkan baris cache setelah sebagian metadata sesi hilang. Nilai cache langsung
bukan nol yang ada tetap diprioritaskan dibanding nilai fallback transkrip.

Mengapa ini penting: biaya token lebih rendah, respons lebih cepat, dan performa lebih dapat diprediksi untuk sesi yang berjalan lama. Tanpa caching, prompt berulang membayar biaya prompt penuh pada setiap giliran meskipun sebagian besar input tidak berubah.

Bagian di bawah ini mencakup setiap pengaturan terkait cache yang memengaruhi penggunaan ulang prompt dan biaya token.

Referensi penyedia:

- Caching prompt Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Caching prompt OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API OpenAI dan ID permintaan: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID permintaan dan error Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Pengaturan utama

### `cacheRetention` (default global, model, dan per agen)

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

Timpa per agen:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Urutan penggabungan konfigurasi:

1. `agents.defaults.params` (default global — berlaku untuk semua model)
2. `agents.defaults.models["provider/model"].params` (timpa per model)
3. `agents.list[].params` (ID agen yang cocok; menimpa berdasarkan kunci)

### `contextPruning.mode: "cache-ttl"`

Memangkas konteks hasil alat lama setelah jendela TTL cache sehingga permintaan setelah idle tidak melakukan cache ulang pada riwayat yang terlalu besar.

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

Heartbeat per agen didukung di `agents.list[].heartbeat`.

## Perilaku penyedia

### Anthropic (API langsung)

- `cacheRetention` didukung.
- Dengan profil auth kunci API Anthropic, OpenClaw mengisi awal `cacheRetention: "short"` untuk ref model Anthropic ketika belum diatur.
- Respons Messages native Anthropic mengekspos `cache_read_input_tokens` dan `cache_creation_input_tokens`, sehingga OpenClaw dapat menampilkan `cacheRead` dan `cacheWrite`.
- Untuk permintaan native Anthropic, `cacheRetention: "short"` dipetakan ke cache ephemeral default 5 menit, dan `cacheRetention: "long"` ditingkatkan ke TTL 1 jam hanya pada host langsung `api.anthropic.com`.

### OpenAI (API langsung)

- Caching prompt otomatis pada model terbaru yang didukung. OpenClaw tidak perlu menyisipkan marker cache tingkat blok.
- OpenClaw menggunakan `prompt_cache_key` untuk menjaga perutean cache tetap stabil di antara giliran. Host OpenAI langsung menggunakan `prompt_cache_retention: "24h"` ketika `cacheRetention: "long"` dipilih.
- Penyedia Completions yang kompatibel dengan OpenAI menerima `prompt_cache_key` hanya ketika konfigurasi modelnya secara eksplisit menetapkan `compat.supportsPromptCacheKey: true`. Penerusan retensi panjang adalah kapabilitas terpisah: `cacheRetention: "long"` eksplisit mengirim `prompt_cache_retention: "24h"` hanya ketika entri compat tersebut juga mendukung retensi cache panjang. Penyedia seperti Mistral dapat ikut memakai kunci cache sambil menetapkan `compat.supportsLongCacheRetention: false` untuk menekan field retensi panjang. `cacheRetention: "none"` menekan kedua field.
- Respons OpenAI mengekspos token prompt yang di-cache melalui `usage.prompt_tokens_details.cached_tokens` (atau `input_tokens_details.cached_tokens` pada event Responses API). OpenClaw memetakannya ke `cacheRead`.
- Penggunaan Responses GPT-5.6 juga dapat mengekspos `input_tokens_details.cache_write_tokens`. OpenClaw memetakannya ke `cacheWrite` dan menetapkan harganya berdasarkan tarif tulis-cache model; Responses yang menghilangkan field tersebut mempertahankan `cacheWrite` pada `0`.
- OpenAI mengembalikan header pelacakan dan batas laju yang berguna seperti `x-request-id`, `openai-processing-ms`, dan `x-ratelimit-*`, tetapi akuntansi cache-hit harus berasal dari payload penggunaan, bukan dari header.
- Dalam praktiknya, OpenAI sering berperilaku seperti cache prefiks awal, bukan penggunaan ulang riwayat penuh bergerak ala Anthropic. Giliran teks prefiks panjang yang stabil dapat mendekati plateau token yang di-cache `4864` dalam probe langsung saat ini, sementara transkrip yang berat alat atau bergaya MCP sering plateau di sekitar `4608` token yang di-cache bahkan pada pengulangan persis.

### Anthropic Vertex

- Model Anthropic di Vertex AI (`anthropic-vertex/*`) mendukung `cacheRetention` dengan cara yang sama seperti Anthropic langsung.
- `cacheRetention: "long"` dipetakan ke TTL cache prompt 1 jam nyata pada endpoint Vertex AI.
- Retensi cache default untuk `anthropic-vertex` cocok dengan default Anthropic langsung.
- Permintaan Vertex dirutekan melalui pembentukan cache yang sadar batas sehingga penggunaan ulang cache tetap selaras dengan apa yang benar-benar diterima penyedia.

### Amazon Bedrock

- Ref model Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) mendukung pass-through `cacheRetention` eksplisit.
- Model Bedrock non-Anthropic dipaksa ke `cacheRetention: "none"` saat runtime.

### Model OpenRouter

Untuk ref model `openrouter/anthropic/*`, OpenClaw menyisipkan
`cache_control` Anthropic pada blok prompt sistem/developer untuk meningkatkan
penggunaan ulang cache prompt hanya ketika permintaan masih menargetkan rute
OpenRouter terverifikasi (`openrouter` pada endpoint defaultnya, atau penyedia/base URL apa pun yang resolve
ke `openrouter.ai`).

Untuk ref model `openrouter/deepseek/*`, `openrouter/moonshot*/*`, dan `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` diizinkan karena OpenRouter
menangani caching prompt sisi penyedia secara otomatis. OpenClaw tidak menyisipkan
marker `cache_control` Anthropic ke dalam permintaan tersebut.

Konstruksi cache DeepSeek bersifat upaya-terbaik dan dapat memakan beberapa detik. Tindak lanjut
langsung mungkin masih menampilkan `cached_tokens: 0`; verifikasi dengan permintaan
prefiks sama yang diulang setelah jeda singkat dan gunakan `usage.prompt_tokens_details.cached_tokens`
sebagai sinyal cache-hit.

Jika Anda mengarahkan ulang model ke URL proxy arbitrer yang kompatibel dengan OpenAI, OpenClaw
berhenti menyisipkan marker cache Anthropic khusus OpenRouter tersebut.

### Penyedia lain

Jika penyedia tidak mendukung mode cache ini, `cacheRetention` tidak berpengaruh.

### API langsung Google Gemini

- Transport Gemini langsung (`api: "google-generative-ai"`) melaporkan cache hit
  melalui `cachedContentTokenCount` upstream; OpenClaw memetakannya ke `cacheRead`.
- Ketika `cacheRetention` diatur pada model Gemini langsung, OpenClaw secara otomatis
  membuat, menggunakan kembali, dan menyegarkan resource `cachedContents` untuk prompt sistem
  pada run Google AI Studio. Ini berarti Anda tidak lagi perlu membuat handle
  cached-content sebelumnya secara manual.
- Anda tetap dapat meneruskan handle cached-content Gemini yang sudah ada sebagai
  `params.cachedContent` (atau legacy `params.cached_content`) pada model yang dikonfigurasi.
- Ini terpisah dari caching prefiks-prompt Anthropic/OpenAI. Untuk Gemini,
  OpenClaw mengelola resource `cachedContents` native penyedia, bukan
  menyisipkan marker cache ke dalam permintaan.

### Penggunaan Gemini CLI

- Output `stream-json` Gemini CLI dapat menampilkan cache hit melalui `stats.cached`;
  OpenClaw memetakannya ke `cacheRead`. Override legacy `--output-format json` menggunakan
  normalisasi penggunaan yang sama.
- Jika CLI menghilangkan nilai `stats.input` langsung, OpenClaw menurunkan token input
  dari `stats.input_tokens - stats.cached`.
- Ini hanya normalisasi penggunaan. Ini tidak berarti OpenClaw membuat
  marker cache prompt bergaya Anthropic/OpenAI untuk Gemini CLI.

## Batas cache prompt sistem

OpenClaw membagi prompt sistem menjadi **prefiks stabil** dan **sufiks volatil**
yang dipisahkan oleh batas prefiks-cache internal. Konten di atas
batas (definisi alat, metadata Skills, file workspace, dan konteks lain yang
relatif statis) diurutkan agar tetap identik byte demi byte di antara giliran.
Konten di bawah batas (misalnya `HEARTBEAT.md`, timestamp runtime, dan
metadata per giliran lainnya) boleh berubah tanpa membatalkan prefiks yang di-cache.

Pilihan desain utama:

- File konteks-proyek workspace yang stabil diurutkan sebelum `HEARTBEAT.md` sehingga
  perubahan Heartbeat tidak merusak prefiks stabil.
- Batas diterapkan di seluruh pembentukan transport keluarga Anthropic, keluarga OpenAI, Google, dan
  CLI sehingga semua penyedia yang didukung mendapatkan manfaat dari stabilitas prefiks yang sama.
- Permintaan Codex Responses dan Anthropic Vertex dirutekan melalui
  pembentukan cache yang sadar batas sehingga penggunaan ulang cache tetap selaras dengan apa yang
  benar-benar diterima penyedia.
- Sidik jari prompt sistem dinormalkan (spasi putih, akhiran baris,
  konteks yang ditambahkan hook, pengurutan kapabilitas runtime) sehingga prompt yang tidak berubah secara semantik
  berbagi KV/cache di antara giliran.

Jika Anda melihat lonjakan `cacheWrite` yang tidak terduga setelah perubahan konfigurasi atau workspace,
periksa apakah perubahan tersebut berada di atas atau di bawah batas cache. Memindahkan
konten volatil ke bawah batas (atau menstabilkannya) sering menyelesaikan
masalah.

## Guard stabilitas cache OpenClaw

OpenClaw juga menjaga beberapa bentuk payload yang sensitif cache tetap deterministik sebelum
permintaan mencapai penyedia:

- Katalog alat Bundle MCP diurutkan secara deterministik sebelum registrasi alat,
  sehingga perubahan urutan `listTools()` tidak mengubah blok alat dan
  merusak prefiks cache prompt.
- Sesi legacy dengan blok gambar yang dipersisten mempertahankan **3 giliran selesai terbaru**
  tetap utuh; blok gambar lama yang sudah diproses dapat
  diganti dengan marker sehingga tindak lanjut yang berat gambar tidak terus mengirim ulang payload usang
  yang besar.

## Pola penyetelan

### Trafik campuran (default yang direkomendasikan)

Pertahankan baseline berumur panjang pada agen utama Anda, nonaktifkan caching pada agen notifier yang bursty:

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

### Baseline mengutamakan biaya

- Tetapkan baseline `cacheRetention: "short"`.
- Aktifkan `contextPruning.mode: "cache-ttl"`.
- Pertahankan Heartbeat di bawah TTL Anda hanya untuk agen yang mendapat manfaat dari cache hangat.

## Diagnostik cache

OpenClaw mengekspos diagnostik trace cache khusus untuk run agen tertanam.

Untuk diagnostik normal yang terlihat oleh pengguna, `/status` dan ringkasan penggunaan lain dapat menggunakan
entri penggunaan transkrip terbaru sebagai sumber fallback untuk `cacheRead` /
`cacheWrite` ketika entri sesi langsung tidak memiliki penghitung tersebut.

## Uji regresi langsung

OpenClaw mempertahankan satu gate regresi cache langsung gabungan untuk prefiks berulang, giliran alat, giliran gambar, transkrip alat bergaya MCP, dan kontrol tanpa-cache Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Jalankan gate langsung yang sempit dengan:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

File baseline menyimpan angka live terbaru yang diamati beserta ambang minimum regresi khusus penyedia yang digunakan oleh pengujian.
Runner juga menggunakan ID sesi per-run yang segar dan namespace prompt agar status cache sebelumnya tidak mencemari sampel regresi saat ini.

Pengujian ini sengaja tidak menggunakan kriteria keberhasilan yang identik di seluruh penyedia.

### Ekspektasi live Anthropic

- Harapkan penulisan pemanasan eksplisit melalui `cacheWrite`.
- Harapkan penggunaan ulang hampir seluruh riwayat pada giliran berulang karena kontrol cache Anthropic memajukan breakpoint cache melalui percakapan.
- Asersi live saat ini masih menggunakan ambang tingkat hit yang tinggi untuk jalur stabil, tool, dan gambar.

### Ekspektasi live OpenAI

- Harapkan hanya `cacheRead`. `cacheWrite` tetap `0`.
- Perlakukan penggunaan ulang cache pada giliran berulang sebagai plateau khusus penyedia, bukan sebagai penggunaan ulang seluruh riwayat bergerak bergaya Anthropic.
- Asersi live saat ini menggunakan pemeriksaan ambang minimum konservatif yang diturunkan dari perilaku live yang diamati pada `gpt-5.4-mini`:
  - prefiks stabil: `cacheRead >= 4608`, tingkat hit `>= 0.90`
  - transkrip tool: `cacheRead >= 4096`, tingkat hit `>= 0.85`
  - transkrip gambar: `cacheRead >= 3840`, tingkat hit `>= 0.82`
  - transkrip bergaya MCP: `cacheRead >= 4096`, tingkat hit `>= 0.85`

Verifikasi live gabungan yang segar pada 2026-04-04 mencapai:

- prefiks stabil: `cacheRead=4864`, tingkat hit `0.966`
- transkrip tool: `cacheRead=4608`, tingkat hit `0.896`
- transkrip gambar: `cacheRead=4864`, tingkat hit `0.954`
- transkrip bergaya MCP: `cacheRead=4608`, tingkat hit `0.891`

Waktu wall-clock lokal terbaru untuk gate gabungan sekitar `88s`.

Mengapa asersi berbeda:

- Anthropic mengekspos breakpoint cache eksplisit dan penggunaan ulang riwayat percakapan yang bergerak.
- Caching prompt OpenAI masih sensitif terhadap prefiks persis, tetapi prefiks efektif yang dapat digunakan ulang dalam lalu lintas live Responses dapat mencapai plateau lebih awal daripada prompt penuh.
- Karena itu, membandingkan Anthropic dan OpenAI dengan satu ambang persentase lintas penyedia akan menghasilkan regresi palsu.

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

### Toggle env (debugging satu kali)

- `OPENCLAW_CACHE_TRACE=1` mengaktifkan penelusuran cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` menimpa jalur output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` mengalihkan pengambilan payload pesan penuh.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` mengalihkan pengambilan teks prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` mengalihkan pengambilan prompt sistem.

### Yang perlu diperiksa

- Peristiwa penelusuran cache adalah JSONL dan menyertakan snapshot bertahap seperti `session:loaded`, `prompt:before`, `stream:context`, dan `session:after`.
- Dampak token cache per giliran terlihat di permukaan penggunaan normal melalui `cacheRead` dan `cacheWrite` (misalnya `/usage tokens`, `/status`, ringkasan penggunaan sesi, dan tata letak `messages.usageTemplate` kustom).
- Untuk Anthropic, harapkan `cacheRead` dan `cacheWrite` saat caching aktif.
- Untuk OpenAI, harapkan `cacheRead` pada hit cache. GPT-5.6 Responses juga dapat melaporkan `cacheWrite` saat segmen prompt ditulis; payload Responses lain yang menghilangkan penghitung penulisan mempertahankannya pada `0`.
- Jika Anda memerlukan penelusuran permintaan, catat ID permintaan dan header batas laju secara terpisah dari metrik cache. Output cache-trace OpenClaw saat ini berfokus pada bentuk prompt/sesi dan penggunaan token yang dinormalisasi, bukan header respons penyedia mentah.

## Pemecahan masalah cepat

- `cacheWrite` tinggi pada sebagian besar giliran: periksa input prompt sistem yang volatil dan verifikasi model/penyedia mendukung pengaturan cache Anda.
- `cacheWrite` tinggi pada Anthropic: sering berarti breakpoint cache mendarat pada konten yang berubah di setiap permintaan.
- `cacheRead` OpenAI rendah: verifikasi prefiks stabil berada di depan, prefiks berulang setidaknya 1024 token, dan `prompt_cache_key` yang sama digunakan ulang untuk giliran yang seharusnya berbagi cache.
- Tidak ada efek dari `cacheRetention`: konfirmasi kunci model cocok dengan `agents.defaults.models["provider/model"]`.
- Permintaan Bedrock Nova/Mistral dengan pengaturan cache: pemaksaan runtime yang diharapkan ke `none`.

Dokumentasi terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan token dan biaya](/id/reference/token-use)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Referensi konfigurasi Gateway](/id/gateway/configuration-reference)

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Penggunaan API dan biaya](/id/reference/api-usage-costs)
