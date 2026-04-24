---
read_when:
    - Anda ingin mengurangi biaya token prompt dengan retensi cache
    - Anda memerlukan perilaku cache per agen dalam penyiapan multi-agen
    - Anda sedang menyetel Heartbeat dan pemangkasan cache-ttl secara bersamaan
summary: Kontrol prompt caching, urutan penggabungan, perilaku provider, dan pola penyesuaian
title: Prompt caching
x-i18n:
    generated_at: "2026-04-24T09:26:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

Prompt caching berarti provider model dapat menggunakan kembali prefiks prompt yang tidak berubah (biasanya instruksi system/developer dan konteks stabil lainnya) antar giliran alih-alih memproses ulang semuanya setiap kali. OpenClaw menormalkan penggunaan provider menjadi `cacheRead` dan `cacheWrite` ketika API upstream mengekspos penghitung tersebut secara langsung.

Permukaan status juga dapat memulihkan penghitung cache dari log penggunaan
transkrip terbaru saat snapshot sesi live tidak memilikinya, sehingga `/status` dapat tetap
menampilkan baris cache setelah metadata sesi hilang sebagian. Nilai cache live yang bukan nol
yang sudah ada tetap lebih diutamakan daripada nilai fallback transkrip.

Mengapa ini penting: biaya token lebih rendah, respons lebih cepat, dan performa yang lebih dapat diprediksi untuk sesi yang berjalan lama. Tanpa caching, prompt berulang membayar biaya prompt penuh pada setiap giliran meskipun sebagian besar input tidak berubah.

Halaman ini mencakup semua kontrol terkait cache yang memengaruhi penggunaan ulang prompt dan biaya token.

Referensi provider:

- Prompt caching Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Prompt caching OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API dan ID permintaan OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID permintaan dan error Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Kontrol utama

### `cacheRetention` (default global, model, dan per agen)

Tetapkan retensi cache sebagai default global untuk semua model:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Override per model:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Override per agen:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Urutan penggabungan konfigurasi:

1. `agents.defaults.params` (default global — berlaku untuk semua model)
2. `agents.defaults.models["provider/model"].params` (override per model)
3. `agents.list[].params` (id agen yang cocok; override per kunci)

### `contextPruning.mode: "cache-ttl"`

Memangkas konteks hasil alat lama setelah jendela TTL cache agar permintaan setelah idle tidak menyimpan ulang riwayat yang terlalu besar ke cache.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Lihat [Session Pruning](/id/concepts/session-pruning) untuk perilaku lengkap.

### Heartbeat keep-warm

Heartbeat dapat menjaga jendela cache tetap hangat dan mengurangi penulisan cache berulang setelah jeda idle.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agen didukung di `agents.list[].heartbeat`.

## Perilaku provider

### Anthropic (API langsung)

- `cacheRetention` didukung.
- Dengan profil autentikasi kunci API Anthropic, OpenClaw menetapkan awal `cacheRetention: "short"` untuk referensi model Anthropic saat tidak ditetapkan.
- Respons native Anthropic Messages mengekspos `cache_read_input_tokens` dan `cache_creation_input_tokens`, sehingga OpenClaw dapat menampilkan `cacheRead` dan `cacheWrite`.
- Untuk permintaan Anthropic native, `cacheRetention: "short"` dipetakan ke cache ephemeral 5 menit default, dan `cacheRetention: "long"` ditingkatkan ke TTL 1 jam hanya pada host langsung `api.anthropic.com`.

### OpenAI (API langsung)

- Prompt caching bersifat otomatis pada model terbaru yang didukung. OpenClaw tidak perlu menyisipkan penanda cache tingkat blok.
- OpenClaw menggunakan `prompt_cache_key` agar perutean cache tetap stabil antar giliran dan menggunakan `prompt_cache_retention: "24h"` hanya saat `cacheRetention: "long"` dipilih pada host OpenAI langsung.
- Respons OpenAI mengekspos token prompt yang di-cache melalui `usage.prompt_tokens_details.cached_tokens` (atau `input_tokens_details.cached_tokens` pada event Responses API). OpenClaw memetakannya ke `cacheRead`.
- OpenAI tidak mengekspos penghitung token tulis-cache terpisah, sehingga `cacheWrite` tetap `0` pada jalur OpenAI meskipun provider sedang menghangatkan cache.
- OpenAI mengembalikan header pelacakan dan rate-limit yang berguna seperti `x-request-id`, `openai-processing-ms`, dan `x-ratelimit-*`, tetapi akuntansi cache-hit harus berasal dari payload penggunaan, bukan dari header.
- Dalam praktiknya, OpenAI sering berperilaku seperti cache prefiks awal alih-alih penggunaan ulang riwayat penuh bergerak ala Anthropic. Giliran teks prefiks panjang yang stabil dapat mencapai plateau token cache sekitar `4864` dalam probe live saat ini, sementara transkrip berat alat atau bergaya MCP sering plateau di sekitar `4608` token cache bahkan pada pengulangan yang persis sama.

### Anthropic Vertex

- Model Anthropic di Vertex AI (`anthropic-vertex/*`) mendukung `cacheRetention` dengan cara yang sama seperti Anthropic langsung.
- `cacheRetention: "long"` dipetakan ke TTL prompt-cache 1 jam yang sebenarnya pada endpoint Vertex AI.
- Default retensi cache untuk `anthropic-vertex` sama dengan default Anthropic langsung.
- Permintaan Vertex dirutekan melalui pembentukan cache yang sadar batas agar penggunaan ulang cache tetap selaras dengan yang benar-benar diterima provider.

### Amazon Bedrock

- Referensi model Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) mendukung pass-through `cacheRetention` eksplisit.
- Model Bedrock non-Anthropic dipaksa ke `cacheRetention: "none"` saat runtime.

### Model Anthropic OpenRouter

Untuk referensi model `openrouter/anthropic/*`, OpenClaw menyisipkan
`cache_control` Anthropic pada blok prompt system/developer untuk meningkatkan penggunaan ulang
prompt-cache hanya saat permintaan masih menargetkan rute OpenRouter yang terverifikasi
(`openrouter` pada endpoint default-nya, atau provider/base URL apa pun yang mengarah
ke `openrouter.ai`).

Jika Anda mengarahkan ulang model ke URL proxy kompatibel OpenAI yang arbitrer, OpenClaw
berhenti menyisipkan penanda cache Anthropic khusus OpenRouter tersebut.

### Provider lain

Jika provider tidak mendukung mode cache ini, `cacheRetention` tidak berpengaruh.

### API langsung Google Gemini

- Transport Gemini langsung (`api: "google-generative-ai"`) melaporkan cache hit
  melalui `cachedContentTokenCount` upstream; OpenClaw memetakannya ke `cacheRead`.
- Saat `cacheRetention` ditetapkan pada model Gemini langsung, OpenClaw secara otomatis
  membuat, menggunakan kembali, dan menyegarkan resource `cachedContents` untuk system prompt
  pada eksekusi Google AI Studio. Ini berarti Anda tidak lagi perlu membuat
  handle cached-content secara manual terlebih dahulu.
- Anda tetap dapat meneruskan handle cached-content Gemini yang sudah ada melalui
  `params.cachedContent` (atau legacy `params.cached_content`) pada model
  yang dikonfigurasi.
- Ini terpisah dari prompt-prefix caching Anthropic/OpenAI. Untuk Gemini,
  OpenClaw mengelola resource `cachedContents` native provider alih-alih
  menyisipkan penanda cache ke dalam permintaan.

### Penggunaan JSON Gemini CLI

- Output JSON Gemini CLI juga dapat menampilkan cache hit melalui `stats.cached`;
  OpenClaw memetakannya ke `cacheRead`.
- Jika CLI menghilangkan nilai `stats.input` langsung, OpenClaw menurunkan token input
  dari `stats.input_tokens - stats.cached`.
- Ini hanya normalisasi penggunaan. Ini tidak berarti OpenClaw sedang membuat
  penanda prompt-cache ala Anthropic/OpenAI untuk Gemini CLI.

## Batas cache system prompt

OpenClaw membagi system prompt menjadi **prefiks stabil** dan **sufiks volatil**
yang dipisahkan oleh batas cache-prefix internal. Konten di atas
batas (definisi alat, metadata Skills, file workspace, dan konteks lain yang
relatif statis) diurutkan agar tetap identik byte demi byte antar giliran.
Konten di bawah batas (misalnya `HEARTBEAT.md`, cap waktu runtime, dan
metadata lain per giliran) boleh berubah tanpa membatalkan prefiks
yang di-cache.

Pilihan desain utama:

- File konteks proyek workspace yang stabil diurutkan sebelum `HEARTBEAT.md` agar
  perubahan Heartbeat tidak merusak prefiks stabil.
- Batas diterapkan di seluruh pembentukan cache keluarga Anthropic, keluarga OpenAI, Google, dan transport CLI sehingga semua provider yang didukung mendapatkan manfaat dari stabilitas prefiks yang sama.
- Permintaan Codex Responses dan Anthropic Vertex dirutekan melalui
  pembentukan cache yang sadar batas agar penggunaan ulang cache tetap selaras dengan apa yang benar-benar diterima provider.
- Sidik jari system prompt dinormalkan (whitespace, akhir baris,
  konteks yang ditambahkan hook, pengurutan kemampuan runtime) sehingga
  prompt yang secara semantik tidak berubah berbagi KV/cache antar giliran.

Jika Anda melihat lonjakan `cacheWrite` yang tidak terduga setelah perubahan konfigurasi atau workspace,
periksa apakah perubahan tersebut berada di atas atau di bawah batas cache. Memindahkan
konten volatil ke bawah batas (atau menstabilkannya) sering kali menyelesaikan
masalah.

## Guard stabilitas cache OpenClaw

OpenClaw juga menjaga beberapa bentuk payload yang sensitif terhadap cache tetap deterministik sebelum
permintaan mencapai provider:

- Katalog alat MCP bundel diurutkan secara deterministik sebelum registrasi
  alat, sehingga perubahan urutan `listTools()` tidak mengubah blok alat dan
  merusak prefiks prompt-cache.
- Sesi legacy dengan blok gambar yang dipersistenkan mempertahankan **3 giliran selesai terbaru**
  tetap utuh; blok gambar lama yang sudah diproses dapat
  diganti dengan penanda agar tindak lanjut yang berat gambar tidak terus mengirim ulang
  payload basi yang besar.

## Pola penyesuaian

### Lalu lintas campuran (default yang disarankan)

Pertahankan baseline berumur panjang pada agen utama Anda, nonaktifkan caching pada agen notifikasi yang bursty:

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
- Pertahankan heartbeat di bawah TTL Anda hanya untuk agen yang mendapat manfaat dari cache hangat.

## Diagnostik cache

OpenClaw mengekspos diagnostik jejak cache khusus untuk eksekusi agen tersemat.

Untuk diagnostik normal yang menghadap pengguna, `/status` dan ringkasan penggunaan lain dapat menggunakan
entri penggunaan transkrip terbaru sebagai sumber fallback untuk `cacheRead` /
`cacheWrite` saat entri sesi live tidak memiliki penghitung tersebut.

## Pengujian regresi live

OpenClaw mempertahankan satu gerbang regresi cache live gabungan untuk prefiks berulang, giliran alat, giliran gambar, transkrip alat bergaya MCP, dan kontrol tanpa cache Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Jalankan gerbang live sempit dengan:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

File baseline menyimpan angka live yang paling baru diamati beserta ambang regresi khusus provider yang digunakan oleh pengujian.
Runner juga menggunakan ID sesi per eksekusi yang baru dan namespace prompt agar status cache sebelumnya tidak mencemari sampel regresi saat ini.

Pengujian ini sengaja tidak menggunakan kriteria keberhasilan yang identik di semua provider.

### Ekspektasi live Anthropic

- Harapkan penulisan pemanasan eksplisit melalui `cacheWrite`.
- Harapkan penggunaan ulang riwayat yang hampir penuh pada giliran berulang karena kontrol cache Anthropic memajukan titik batas cache sepanjang percakapan.
- Assertion live saat ini masih menggunakan ambang hit-rate tinggi untuk jalur stabil, alat, dan gambar.

### Ekspektasi live OpenAI

- Harapkan hanya `cacheRead`. `cacheWrite` tetap `0`.
- Perlakukan penggunaan ulang cache pada giliran berulang sebagai plateau khusus provider, bukan sebagai penggunaan ulang riwayat penuh bergerak ala Anthropic.
- Assertion live saat ini menggunakan pemeriksaan ambang konservatif yang diturunkan dari perilaku live yang diamati pada `gpt-5.4-mini`:
  - prefiks stabil: `cacheRead >= 4608`, hit rate `>= 0.90`
  - transkrip alat: `cacheRead >= 4096`, hit rate `>= 0.85`
  - transkrip gambar: `cacheRead >= 3840`, hit rate `>= 0.82`
  - transkrip bergaya MCP: `cacheRead >= 4096`, hit rate `>= 0.85`

Verifikasi live gabungan terbaru pada 2026-04-04 mencapai:

- prefiks stabil: `cacheRead=4864`, hit rate `0.966`
- transkrip alat: `cacheRead=4608`, hit rate `0.896`
- transkrip gambar: `cacheRead=4864`, hit rate `0.954`
- transkrip bergaya MCP: `cacheRead=4608`, hit rate `0.891`

Waktu wall-clock lokal terbaru untuk gerbang gabungan sekitar `88s`.

Mengapa assertion berbeda:

- Anthropic mengekspos titik batas cache eksplisit dan penggunaan ulang riwayat percakapan yang bergerak.
- Prompt caching OpenAI masih sensitif terhadap prefiks yang persis sama, tetapi prefiks efektif yang dapat digunakan ulang dalam lalu lintas Responses live dapat mencapai plateau lebih awal daripada prompt penuh.
- Karena itu, membandingkan Anthropic dan OpenAI dengan satu ambang persentase lintas-provider akan menciptakan regresi palsu.

### Konfigurasi `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # opsional
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

- `OPENCLAW_CACHE_TRACE=1` mengaktifkan pelacakan cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` mengganti path output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` mengaktifkan/menonaktifkan pengambilan payload pesan lengkap.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` mengaktifkan/menonaktifkan pengambilan teks prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` mengaktifkan/menonaktifkan pengambilan system prompt.

### Yang perlu diperiksa

- Event cache trace berbentuk JSONL dan mencakup snapshot bertahap seperti `session:loaded`, `prompt:before`, `stream:context`, dan `session:after`.
- Dampak token cache per giliran terlihat di permukaan penggunaan normal melalui `cacheRead` dan `cacheWrite` (misalnya `/usage full` dan ringkasan penggunaan sesi).
- Untuk Anthropic, harapkan `cacheRead` dan `cacheWrite` saat caching aktif.
- Untuk OpenAI, harapkan `cacheRead` pada cache hit dan `cacheWrite` tetap `0`; OpenAI tidak memublikasikan field token tulis-cache terpisah.
- Jika Anda memerlukan pelacakan permintaan, catat ID permintaan dan header rate-limit secara terpisah dari metrik cache. Output cache-trace OpenClaw saat ini berfokus pada bentuk prompt/sesi dan penggunaan token yang dinormalkan, bukan header respons provider mentah.

## Pemecahan masalah cepat

- `cacheWrite` tinggi pada sebagian besar giliran: periksa input system prompt yang volatil dan verifikasi model/provider mendukung pengaturan cache Anda.
- `cacheWrite` tinggi pada Anthropic: sering berarti titik batas cache jatuh pada konten yang berubah di setiap permintaan.
- `cacheRead` OpenAI rendah: verifikasi prefiks stabil ada di bagian depan, prefiks berulang setidaknya 1024 token, dan `prompt_cache_key` yang sama digunakan ulang untuk giliran yang seharusnya berbagi cache.
- Tidak ada efek dari `cacheRetention`: pastikan kunci model cocok dengan `agents.defaults.models["provider/model"]`.
- Permintaan Bedrock Nova/Mistral dengan pengaturan cache: perilaku runtime yang dipaksa ke `none` memang diharapkan.

Dokumentasi terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan Token dan Biaya](/id/reference/token-use)
- [Session Pruning](/id/concepts/session-pruning)
- [Referensi Konfigurasi Gateway](/id/gateway/configuration-reference)

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Penggunaan API dan biaya](/id/reference/api-usage-costs)
