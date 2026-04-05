---
read_when:
    - Anda ingin mengurangi biaya token prompt dengan retensi cache
    - Anda memerlukan perilaku cache per agen dalam penyiapan multi-agen
    - Anda sedang menyetel heartbeat dan pemangkasan cache-ttl secara bersamaan
summary: Kontrol cache prompt, urutan penggabungan, perilaku provider, dan pola penyetelan
title: Cache Prompt
x-i18n:
    generated_at: "2026-04-05T14:05:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13d5f3153b6593ae22cd04a6c2540e074cf15df9f1990fc5b7184fe803f4a1bd
    source_path: reference/prompt-caching.md
    workflow: 15
---

# Cache prompt

Cache prompt berarti provider model dapat menggunakan kembali prefiks prompt yang tidak berubah (biasanya instruksi system/developer dan konteks stabil lainnya) antar giliran alih-alih memproses ulang semuanya setiap kali. OpenClaw menormalkan penggunaan provider menjadi `cacheRead` dan `cacheWrite` saat API upstream secara langsung mengekspos penghitung tersebut.

Permukaan status juga dapat memulihkan penghitung cache dari log penggunaan
transkrip terbaru ketika snapshot sesi live tidak memilikinya, sehingga `/status` dapat tetap
menampilkan baris cache setelah sebagian metadata sesi hilang. Nilai cache live yang sudah bukan nol tetap diutamakan daripada nilai fallback transkrip.

Mengapa ini penting: biaya token lebih rendah, respons lebih cepat, dan performa yang lebih dapat diprediksi untuk sesi yang berjalan lama. Tanpa caching, prompt yang berulang membayar biaya prompt penuh pada setiap giliran meskipun sebagian besar input tidak berubah.

Halaman ini membahas semua kontrol terkait cache yang memengaruhi penggunaan ulang prompt dan biaya token.

Referensi provider:

- Cache prompt Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache prompt OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API dan ID permintaan OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID permintaan dan error Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Kontrol utama

### `cacheRetention` (default global, model, dan per agen)

Setel retensi cache sebagai default global untuk semua model:

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
3. `agents.list[].params` (id agen yang cocok; override per key)

### `contextPruning.mode: "cache-ttl"`

Memangkas konteks hasil tool lama setelah jendela TTL cache agar permintaan setelah idle tidak melakukan cache ulang pada riwayat yang terlalu besar.

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

Heartbeat per agen didukung di `agents.list[].heartbeat`.

## Perilaku provider

### Anthropic (API langsung)

- `cacheRetention` didukung.
- Dengan profil autentikasi API key Anthropic, OpenClaw mengisi `cacheRetention: "short"` untuk referensi model Anthropic saat tidak disetel.
- Respons Messages Anthropic native mengekspos `cache_read_input_tokens` dan `cache_creation_input_tokens`, sehingga OpenClaw dapat menampilkan `cacheRead` dan `cacheWrite`.
- Untuk permintaan Anthropic native, `cacheRetention: "short"` dipetakan ke cache ephemeral default 5 menit, dan `cacheRetention: "long"` menaikkan ke TTL 1 jam hanya pada host `api.anthropic.com` langsung.

### OpenAI (API langsung)

- Cache prompt bersifat otomatis pada model terbaru yang didukung. OpenClaw tidak perlu menyisipkan penanda cache tingkat blok.
- OpenClaw menggunakan `prompt_cache_key` untuk menjaga routing cache tetap stabil antar giliran dan menggunakan `prompt_cache_retention: "24h"` hanya saat `cacheRetention: "long"` dipilih pada host OpenAI langsung.
- Respons OpenAI mengekspos token prompt yang di-cache melalui `usage.prompt_tokens_details.cached_tokens` (atau `input_tokens_details.cached_tokens` pada event Responses API). OpenClaw memetakannya ke `cacheRead`.
- OpenAI tidak mengekspos penghitung token cache-write terpisah, jadi `cacheWrite` tetap `0` pada jalur OpenAI meskipun provider sedang menghangatkan cache.
- OpenAI mengembalikan header tracing dan rate-limit yang berguna seperti `x-request-id`, `openai-processing-ms`, dan `x-ratelimit-*`, tetapi akuntansi cache-hit sebaiknya berasal dari payload penggunaan, bukan dari header.
- Dalam praktiknya, OpenAI sering berperilaku seperti cache prefiks awal alih-alih penggunaan ulang riwayat penuh yang bergerak seperti Anthropic. Giliran dengan teks prefiks panjang yang stabil dapat mencapai plateau sekitar `4864` cached token dalam probe live saat ini, sementara transkrip berat tool atau bergaya MCP sering plateau di sekitar `4608` cached token bahkan pada pengulangan yang sama persis.

### Anthropic Vertex

- Model Anthropic di Vertex AI (`anthropic-vertex/*`) mendukung `cacheRetention` dengan cara yang sama seperti Anthropic langsung.
- `cacheRetention: "long"` dipetakan ke TTL cache prompt 1 jam yang sebenarnya pada endpoint Vertex AI.
- Retensi cache default untuk `anthropic-vertex` sama dengan default Anthropic langsung.
- Permintaan Vertex dirutekan melalui pembentukan cache yang sadar batas agar penggunaan ulang cache tetap selaras dengan yang benar-benar diterima provider.

### Amazon Bedrock

- Referensi model Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) mendukung pass-through `cacheRetention` eksplisit.
- Model Bedrock non-Anthropic dipaksa menjadi `cacheRetention: "none"` saat runtime.

### Model Anthropic OpenRouter

Untuk referensi model `openrouter/anthropic/*`, OpenClaw menyisipkan
`cache_control` Anthropic pada blok prompt system/developer untuk meningkatkan penggunaan ulang cache prompt hanya ketika permintaan masih menargetkan rute OpenRouter yang terverifikasi
(`openrouter` pada endpoint default-nya, atau provider/base URL apa pun yang meresolusikan
ke `openrouter.ai`).

Jika Anda mengarahkan ulang model ke URL proxy kompatibel OpenAI yang sembarang, OpenClaw
berhenti menyisipkan penanda cache Anthropic khusus OpenRouter tersebut.

### Provider lain

Jika provider tidak mendukung mode cache ini, `cacheRetention` tidak berpengaruh.

### Google Gemini direct API

- Transport Gemini langsung (`api: "google-generative-ai"`) melaporkan cache hit
  melalui `cachedContentTokenCount` upstream; OpenClaw memetakannya ke `cacheRead`.
- Saat `cacheRetention` disetel pada model Gemini langsung, OpenClaw secara otomatis
  membuat, menggunakan kembali, dan menyegarkan resource `cachedContents` untuk prompt system
  pada eksekusi Google AI Studio. Ini berarti Anda tidak lagi perlu membuat
  handle cached-content secara manual sebelumnya.
- Anda tetap dapat meneruskan handle cached-content Gemini yang sudah ada melalui
  `params.cachedContent` (atau legacy `params.cached_content`) pada model yang dikonfigurasi.
- Ini terpisah dari caching prefiks prompt Anthropic/OpenAI. Untuk Gemini,
  OpenClaw mengelola resource `cachedContents` native milik provider alih-alih
  menyisipkan penanda cache ke dalam permintaan.

### Penggunaan JSON Gemini CLI

- Output JSON Gemini CLI juga dapat menampilkan cache hit melalui `stats.cached`;
  OpenClaw memetakannya ke `cacheRead`.
- Jika CLI menghilangkan nilai `stats.input` langsung, OpenClaw menurunkan token input
  dari `stats.input_tokens - stats.cached`.
- Ini hanya normalisasi penggunaan. Ini tidak berarti OpenClaw membuat
  penanda cache prompt bergaya Anthropic/OpenAI untuk Gemini CLI.

## Batas cache system prompt

OpenClaw membagi system prompt menjadi **prefiks stabil** dan **sufiks volatil**
yang dipisahkan oleh batas prefiks cache internal. Konten di atas
batas (definisi tool, metadata Skills, file workspace, dan konteks lain yang
relatif statis) diurutkan agar tetap identik byte demi byte antar giliran.
Konten di bawah batas (misalnya `HEARTBEAT.md`, timestamp runtime, dan
metadata per giliran lainnya) boleh berubah tanpa membuat prefiks yang di-cache
menjadi tidak valid.

Pilihan desain utama:

- File konteks proyek workspace yang stabil diurutkan sebelum `HEARTBEAT.md` agar
  perubahan heartbeat tidak merusak prefiks stabil.
- Batas ini diterapkan di seluruh pembentukan cache keluarga Anthropic, keluarga OpenAI, Google, dan transport CLI sehingga semua provider yang didukung mendapatkan manfaat dari stabilitas prefiks yang sama.
- Permintaan Codex Responses dan Anthropic Vertex dirutekan melalui
  pembentukan cache yang sadar batas agar penggunaan ulang cache tetap selaras dengan yang benar-benar diterima provider.
- Sidik jari system prompt dinormalisasi (whitespace, line ending,
  konteks yang ditambahkan hook, urutan kemampuan runtime) sehingga
  prompt yang secara semantik tidak berubah berbagi KV/cache antar giliran.

Jika Anda melihat lonjakan `cacheWrite` yang tidak terduga setelah perubahan config atau workspace,
periksa apakah perubahan tersebut berada di atas atau di bawah batas cache. Memindahkan
konten volatil ke bawah batas (atau menstabilkannya) sering menyelesaikan
masalah.

## Pelindung stabilitas cache OpenClaw

OpenClaw juga menjaga beberapa bentuk payload yang sensitif terhadap cache tetap deterministik sebelum
permintaan mencapai provider:

- Katalog tool MCP bundle diurutkan secara deterministik sebelum registrasi tool,
  sehingga perubahan urutan `listTools()` tidak mengubah blok tool dan
  merusak prefiks cache prompt.
- Sesi legacy dengan blok gambar yang dipersistenkan mempertahankan **3 giliran selesai
  terbaru** tetap utuh; blok gambar lama yang sudah diproses dapat
  diganti dengan penanda sehingga tindak lanjut yang berat gambar tidak terus mengirim ulang
  payload lama yang besar dan usang.

## Pola penyetelan

### Traffic campuran (default yang direkomendasikan)

Pertahankan baseline yang tahan lama pada agen utama Anda, nonaktifkan caching pada agen notifier yang bursty:

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
- Jaga heartbeat tetap di bawah TTL Anda hanya untuk agen yang mendapat manfaat dari cache hangat.

## Diagnostik cache

OpenClaw mengekspos diagnostik cache-trace khusus untuk eksekusi agen tertanam.

Untuk diagnostik normal yang berhadapan dengan pengguna, `/status` dan ringkasan penggunaan lainnya dapat menggunakan
entri penggunaan transkrip terbaru sebagai sumber fallback untuk `cacheRead` /
`cacheWrite` ketika entri sesi live tidak memiliki penghitung tersebut.

## Live regression test

OpenClaw mempertahankan satu gate regresi cache live gabungan untuk prefiks berulang, giliran tool, giliran gambar, transkrip tool bergaya MCP, dan kontrol Anthropic tanpa cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Jalankan gate live sempit dengan:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

File baseline menyimpan angka live terbaru yang teramati beserta ambang regresi khusus provider yang digunakan oleh test.
Runner juga menggunakan ID sesi per eksekusi yang baru dan namespace prompt baru agar status cache sebelumnya tidak mencemari sampel regresi saat ini.

Test ini sengaja tidak menggunakan kriteria keberhasilan yang identik di semua provider.

### Ekspektasi live Anthropic

- Harapkan warmup write eksplisit melalui `cacheWrite`.
- Harapkan penggunaan ulang hampir seluruh riwayat pada giliran berulang karena kontrol cache Anthropic menggeser breakpoint cache sepanjang percakapan.
- Assertion live saat ini masih menggunakan ambang hit-rate tinggi untuk jalur stabil, tool, dan gambar.

### Ekspektasi live OpenAI

- Harapkan hanya `cacheRead`. `cacheWrite` tetap `0`.
- Perlakukan penggunaan ulang cache pada giliran berulang sebagai plateau khusus provider, bukan sebagai penggunaan ulang riwayat bergerak bergaya Anthropic.
- Assertion live saat ini menggunakan pemeriksaan ambang konservatif yang diturunkan dari perilaku live yang diamati pada `gpt-5.4-mini`:
  - prefiks stabil: `cacheRead >= 4608`, hit rate `>= 0.90`
  - transkrip tool: `cacheRead >= 4096`, hit rate `>= 0.85`
  - transkrip gambar: `cacheRead >= 3840`, hit rate `>= 0.82`
  - transkrip bergaya MCP: `cacheRead >= 4096`, hit rate `>= 0.85`

Verifikasi live gabungan baru pada 2026-04-04 menghasilkan:

- prefiks stabil: `cacheRead=4864`, hit rate `0.966`
- transkrip tool: `cacheRead=4608`, hit rate `0.896`
- transkrip gambar: `cacheRead=4864`, hit rate `0.954`
- transkrip bergaya MCP: `cacheRead=4608`, hit rate `0.891`

Waktu wall-clock lokal terbaru untuk gate gabungan adalah sekitar `88s`.

Mengapa assertion berbeda:

- Anthropic mengekspos breakpoint cache eksplisit dan penggunaan ulang riwayat percakapan yang bergerak.
- Cache prompt OpenAI masih sensitif terhadap prefiks yang persis sama, tetapi prefiks yang dapat digunakan ulang secara efektif dalam traffic Responses live dapat plateau lebih awal daripada prompt penuh.
- Karena itu, membandingkan Anthropic dan OpenAI dengan satu ambang persentase lintas provider akan menciptakan regresi palsu.

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
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` mengganti path output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` mengaktifkan/nonaktifkan perekaman payload pesan penuh.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` mengaktifkan/nonaktifkan perekaman teks prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` mengaktifkan/nonaktifkan perekaman system prompt.

### Yang perlu diperiksa

- Event cache trace berbentuk JSONL dan mencakup snapshot bertahap seperti `session:loaded`, `prompt:before`, `stream:context`, dan `session:after`.
- Dampak token cache per giliran terlihat pada permukaan penggunaan normal melalui `cacheRead` dan `cacheWrite` (misalnya `/usage full` dan ringkasan penggunaan sesi).
- Untuk Anthropic, harapkan `cacheRead` dan `cacheWrite` saat caching aktif.
- Untuk OpenAI, harapkan `cacheRead` pada cache hit dan `cacheWrite` tetap `0`; OpenAI tidak memublikasikan field token cache-write terpisah.
- Jika Anda memerlukan request tracing, catat ID permintaan dan header rate-limit secara terpisah dari metrik cache. Output cache-trace OpenClaw saat ini berfokus pada bentuk prompt/sesi dan penggunaan token yang dinormalisasi, bukan pada header respons provider mentah.

## Pemecahan masalah cepat

- `cacheWrite` tinggi pada sebagian besar giliran: periksa input system prompt yang volatil dan verifikasi bahwa model/provider mendukung setelan cache Anda.
- `cacheWrite` tinggi pada Anthropic: sering berarti breakpoint cache berada pada konten yang berubah di setiap permintaan.
- `cacheRead` OpenAI rendah: verifikasi bahwa prefiks stabil berada di bagian depan, prefiks yang diulang setidaknya 1024 token, dan `prompt_cache_key` yang sama digunakan kembali untuk giliran yang seharusnya berbagi cache.
- Tidak ada efek dari `cacheRetention`: konfirmasi key model cocok dengan `agents.defaults.models["provider/model"]`.
- Permintaan Bedrock Nova/Mistral dengan setelan cache: pemaksaan runtime ke `none` memang diharapkan.

Dokumen terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan Token dan Biaya](/reference/token-use)
- [Pemangkasan Sesi](/id/concepts/session-pruning)
- [Referensi Konfigurasi Gateway](/id/gateway/configuration-reference)
