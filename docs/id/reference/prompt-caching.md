---
read_when:
    - Anda ingin mengurangi biaya token prompt dengan retensi cache
    - Anda memerlukan perilaku cache per agen dalam konfigurasi multiagen
    - Anda menyetel pemangkasan Heartbeat dan TTL cache secara bersamaan
summary: Opsi caching prompt, urutan penggabungan, perilaku penyedia, dan pola penyetelan
title: Caching prompt
x-i18n:
    generated_at: "2026-07-12T14:36:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f3e6ba31517a598f22cfdbe04da746a756feadc7c4c376efaa4779cbf05b31
    source_path: reference/prompt-caching.md
    workflow: 16
---

Caching prompt memungkinkan penyedia model menggunakan kembali prefiks prompt yang tidak berubah (instruksi sistem/pengembang, definisi alat, konteks stabil lainnya) di antara giliran, alih-alih memprosesnya ulang pada setiap permintaan. Hal ini mengurangi biaya token dan latensi pada sesi yang berjalan lama dengan konteks berulang.

OpenClaw menormalisasi penggunaan penyedia menjadi `cacheRead` dan `cacheWrite` jika API hulu menyediakan penghitung tersebut. Ringkasan penggunaan (`/status` dan yang serupa) menggunakan entri penggunaan transkrip terakhir sebagai fallback ketika snapshot sesi langsung tidak memiliki penghitung cache; nilai langsung yang bukan nol selalu diutamakan daripada fallback.

Referensi penyedia:

- [Caching prompt Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Caching prompt OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Pengaturan utama

### `cacheRetention`

Nilai: `"none" | "short" | "long"`. Dapat dikonfigurasi sebagai nilai default global, per model, dan per agen.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # menggantikan nilai default global untuk model ini
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # menggantikan kedua nilai default untuk agen ini
```

Urutan penggabungan (yang terakhir diutamakan):

1. `agents.defaults.params` - nilai default global untuk semua model
2. `agents.defaults.models["provider/model"].params` - penggantian per model
3. `agents.list[].params` - penggantian per agen, dicocokkan berdasarkan ID agen

Sumber: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Memangkas konteks hasil alat lama setelah jendela TTL cache berakhir, sehingga permintaan setelah periode tidak aktif tidak melakukan caching ulang terhadap riwayat yang terlalu besar.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Lihat [Pemangkasan sesi](/id/concepts/session-pruning) untuk perilaku lengkap.

### Menjaga cache tetap hangat dengan Heartbeat

Heartbeat dapat menjaga jendela cache tetap hangat dan mengurangi penulisan cache berulang setelah jeda tidak aktif. Dapat dikonfigurasi secara global (`agents.defaults.heartbeat`) atau per agen (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Perilaku penyedia

### Anthropic (API langsung dan Vertex AI)

- `cacheRetention` didukung untuk penyedia `anthropic` dan `anthropic-vertex`, serta untuk model Claude pada `amazon-bedrock` dan endpoint khusus yang kompatibel dengan `anthropic-messages` ketika `cacheRetention` ditetapkan secara eksplisit.
- Jika tidak ditetapkan, OpenClaw menetapkan nilai awal `cacheRetention: "short"` untuk Anthropic langsung (hanya penyedia `anthropic` dan `anthropic-vertex`; rute keluarga Anthropic lainnya memerlukan nilai eksplisit).
- Respons Anthropic Messages native menyediakan `cache_read_input_tokens` dan `cache_creation_input_tokens`, yang dipetakan ke `cacheRead` dan `cacheWrite`.
- `cacheRetention: "short"` dipetakan ke cache sementara default selama 5 menit. `cacheRetention: "long"` meminta TTL 1 jam (`cache_control: { type: "ephemeral", ttl: "1h" }`) ketika ditetapkan secara eksplisit. Retensi panjang yang implisit/digerakkan oleh lingkungan (`OPENCLAW_CACHE_RETENTION=long` tanpa `cacheRetention` eksplisit) hanya meningkatkan TTL menjadi 1 jam pada host `api.anthropic.com` atau Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); host lain tetap menggunakan cache 5 menit.

Sumber: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API langsung)

- Caching prompt berlangsung otomatis pada model terbaru yang didukung; OpenClaw tidak menyisipkan penanda cache tingkat blok.
- OpenClaw mengirim `prompt_cache_key` agar perutean cache tetap stabil di antara giliran. Host langsung `api.openai.com` mendapatkannya secara otomatis. Proksi yang kompatibel dengan OpenAI (oMLX, llama.cpp, endpoint khusus) harus menetapkan `compat.supportsPromptCacheKey: true` dalam konfigurasi model untuk mengaktifkannya—hal ini tidak pernah terdeteksi secara otomatis untuk proksi.
- `prompt_cache_retention: "24h"` hanya ditambahkan ketika `cacheRetention: "long"` dipilih dan endpoint yang diresolusi mendukung kunci cache serta retensi panjang (`compat.supportsLongCacheRetention`, secara default bernilai true; profil kompatibilitas Together AI dan Cloudflare menonaktifkannya). `cacheRetention: "none"` meniadakan kedua bidang tersebut.
- Cache hit muncul melalui `usage.prompt_tokens_details.cached_tokens` (Chat Completions) atau `input_tokens_details.cached_tokens` (Responses API), yang dipetakan ke `cacheRead`.
- Payload Responses API juga dapat menyediakan `input_tokens_details.cache_write_tokens`, yang dipetakan ke `cacheWrite` dan dihargai sesuai tarif penulisan cache model; payload Responses yang tidak menyertakan bidang tersebut mempertahankan `cacheWrite` pada `0`. Chat Completions API OpenAI tidak mendokumentasikan atau menghasilkan penghitung `cache_write_tokens`, tetapi OpenClaw tetap membaca `prompt_tokens_details.cache_write_tokens` di sana untuk proksi yang kompatibel dengan OpenRouter dan bergaya DeepSeek yang melaporkan jumlah penulisan terpisah.
- Dalam praktiknya, OpenAI lebih menyerupai cache prefiks awal daripada penggunaan ulang seluruh riwayat bergerak milik Anthropic—lihat [ekspektasi langsung OpenAI](#openai-live-expectations) di bawah.

### Amazon Bedrock

- Referensi model Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, beserta prefiks profil inferensi sistem AWS `us.`/`eu.`/`global.anthropic.claude*`) mendukung penerusan `cacheRetention` eksplisit.
- Model Bedrock non-Anthropic (misalnya `amazon.nova-*`) diresolusi tanpa retensi cache saat runtime, terlepas dari nilai `cacheRetention` yang dikonfigurasi.
- ARN profil inferensi aplikasi Bedrock yang buram (ID profil yang tidak memuat `claude`) juga diresolusi tanpa retensi cache kecuali `cacheRetention` ditetapkan secara eksplisit, karena keluarga model tidak dapat disimpulkan hanya dari ARN.

### OpenRouter

Untuk referensi model `openrouter/anthropic/*`, OpenClaw menyisipkan penanda `cache_control` Anthropic pada blok prompt sistem/pengembang, tetapi hanya ketika permintaan masih menargetkan rute OpenRouter yang terverifikasi (`openrouter` pada endpoint default-nya, atau penyedia/URL dasar apa pun yang diresolusi ke `openrouter.ai`). Mengarahkan ulang model ke URL proksi kompatibel OpenAI yang arbitrer akan menghentikan penyisipan ini.

`contextPruning.mode: "cache-ttl"` diizinkan untuk referensi model `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*`, dan `openrouter/zai/*`, karena rute-rute ini menangani caching prompt di sisi penyedia tanpa memerlukan penanda yang disisipkan OpenClaw.

Sumber: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

Pembuatan cache DeepSeek pada OpenRouter bersifat upaya terbaik dan dapat memerlukan beberapa detik; permintaan lanjutan langsung mungkin masih menampilkan `cached_tokens: 0`. Verifikasi dengan permintaan berulang yang memiliki prefiks sama setelah jeda singkat, menggunakan `usage.prompt_tokens_details.cached_tokens` sebagai sinyal cache hit.

### Google Gemini (API langsung)

- Transport Gemini langsung (`api: "google-generative-ai"`) melaporkan cache hit melalui `cachedContentTokenCount` hulu, yang dipetakan ke `cacheRead`.
- Keluarga model yang memenuhi syarat: `gemini-2.5*` dan `gemini-3*` (tidak mencakup varian Live/pratinjau di luar kecocokan prefiks tersebut, misalnya `gemini-live-2.5-flash-preview`).
- Ketika `cacheRetention` ditetapkan pada model yang memenuhi syarat, OpenClaw secara otomatis membuat, menggunakan kembali, dan menyegarkan sumber daya `cachedContents` untuk prompt sistem—tidak memerlukan handle konten cache manual. TTL adalah `300s` untuk `cacheRetention: "short"` dan `3600s` untuk `"long"`.
- Anda tetap dapat meneruskan handle konten cache Gemini yang sudah ada melalui `params.cachedContent` (atau `params.cached_content` lama); handle eksplisit sepenuhnya melewati jalur pengelolaan cache otomatis.
- Hal ini terpisah dari caching prefiks prompt Anthropic/OpenAI: OpenClaw mengelola sumber daya `cachedContents` native penyedia untuk Gemini, alih-alih menyisipkan penanda cache inline.

Sumber: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Penyedia harness CLI (Claude Code, Gemini CLI)

Backend CLI yang menghasilkan peristiwa penggunaan JSONL (`jsonlDialect: "claude-stream-json"` atau `"gemini-stream-json"`) melewati parser penggunaan bersama yang mengenali beberapa varian nama bidang, termasuk penghitung biasa `cached` yang dipetakan ke `cacheRead`. Ketika payload JSON CLI tidak menyertakan bidang token input langsung, OpenClaw menurunkannya sebagai `input_tokens - cached`. Ini hanya normalisasi penggunaan—hal ini tidak membuat penanda cache prompt bergaya Anthropic/OpenAI untuk model yang digerakkan CLI tersebut.

Sumber: `src/agents/cli-output.ts` (`toCliUsage`).

### Penyedia lainnya

Jika penyedia tidak mendukung mode cache mana pun di atas, `cacheRetention` tidak berpengaruh.

## Batas cache prompt sistem

OpenClaw membagi prompt sistem menjadi **prefiks stabil** dan **sufiks volatil** pada batas prefiks cache internal. Konten di atas batas (definisi alat, metadata Skills, file ruang kerja) diurutkan agar tetap identik secara bita di antara giliran. Konten di bawah batas (misalnya `HEARTBEAT.md`, stempel waktu runtime, metadata per giliran lainnya) dapat berubah tanpa membatalkan prefiks yang di-cache.

Pilihan desain utama:

- File konteks proyek ruang kerja yang stabil diurutkan sebelum `HEARTBEAT.md` agar perubahan Heartbeat tidak merusak prefiks stabil.
- Batas tersebut berlaku di seluruh pembentukan transport keluarga Anthropic, keluarga OpenAI, Google, dan CLI, sehingga semua penyedia yang didukung memperoleh manfaat dari stabilitas prefiks yang sama.
- Permintaan Codex Responses dan Anthropic Vertex dirutekan melalui pembentukan cache yang memahami batas agar penggunaan ulang cache tetap selaras dengan apa yang benar-benar diterima penyedia.
- Sidik jari prompt sistem dinormalisasi (spasi kosong, akhir baris, konteks yang ditambahkan hook, urutan kapabilitas runtime) agar prompt yang secara semantik tidak berubah berbagi cache di antara giliran.

Jika Anda melihat lonjakan `cacheWrite` yang tidak terduga setelah perubahan konfigurasi atau ruang kerja, periksa apakah perubahan tersebut berada di atas atau di bawah batas cache. Memindahkan konten volatil ke bawah batas (atau menstabilkannya) biasanya menyelesaikan masalah.

## Pelindung stabilitas cache OpenClaw

- Katalog alat MCP yang dibundel diurutkan secara deterministik (berdasarkan nama server, lalu nama alat) sebelum pendaftaran alat, sehingga perubahan urutan `listTools()` tidak mengubah blok alat dan merusak prefiks cache prompt.
- Sesi lama dengan blok gambar persisten mempertahankan **3 giliran selesai terbaru** secara utuh (menghitung semua giliran yang selesai, bukan hanya yang memuat gambar). Blok gambar lama yang telah diproses diganti dengan penanda teks agar permintaan lanjutan yang sarat gambar tidak terus mengirim ulang payload lama berukuran besar.

## Pola penyetelan

### Lalu lintas campuran (default yang direkomendasikan)

Pertahankan baseline berumur panjang pada agen utama Anda dan nonaktifkan caching pada agen pemberi notifikasi yang bekerja secara tiba-tiba:

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
- Pertahankan interval Heartbeat di bawah TTL Anda hanya untuk agen yang memperoleh manfaat dari cache hangat.

## Pengujian regresi langsung

OpenClaw menjalankan satu gerbang regresi cache langsung gabungan yang mencakup prefiks berulang, giliran alat, giliran gambar, transkrip alat bergaya MCP, dan kontrol tanpa cache Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Jalankan dengan:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

File baseline menyimpan angka langsung yang terakhir diamati beserta batas bawah regresi khusus penyedia yang diperiksa oleh pengujian. Setiap eksekusi menggunakan ID sesi dan namespace prompt baru per eksekusi agar status cache sebelumnya tidak mencemari sampel saat ini. Anthropic dan OpenAI menggunakan penegakan yang berbeda: kegagalan memenuhi batas bawah Anthropic merupakan regresi keras (pengujian gagal), sedangkan kegagalan memenuhi batas bawah OpenAI hanya untuk pemantauan (dicatat sebagai peringatan, tidak menggagalkan eksekusi). Keduanya tidak berbagi satu ambang lintas penyedia.

### Ekspektasi langsung Anthropic

- Harapkan penulisan pemanasan eksplisit melalui `cacheWrite`.
- Harapkan penggunaan ulang riwayat yang hampir penuh pada giliran berulang, karena kontrol cache Anthropic memajukan titik henti cache sepanjang percakapan.
- Batas minimum dasar untuk jalur stabil, alat, gambar, dan bergaya MCP merupakan gerbang regresi yang ketat.

### Ekspektasi langsung OpenAI

- Harapkan hanya `cacheRead`; `cacheWrite` tetap `0` pada Chat Completions.
- Perlakukan penggunaan ulang cache pada giliran berulang sebagai kondisi stabil yang spesifik untuk penyedia, bukan penggunaan ulang riwayat penuh bergerak seperti Anthropic.
- Batas minimum hanya untuk pemantauan (ketidaktercapaian dicatat sebagai peringatan, bukan kegagalan pengujian), yang diturunkan dari perilaku langsung yang diamati pada `gpt-5.4-mini`:

| Skenario                 | Batas minimum `cacheRead` | Batas minimum tingkat hit |
| ------------------------ | ------------------------: | ------------------------: |
| Prefiks stabil           |                     4.608 |                      0,90 |
| Transkrip alat           |                     4.096 |                      0,85 |
| Transkrip gambar         |                     3.840 |                      0,82 |
| Transkrip bergaya MCP    |                     4.096 |                      0,85 |

Angka dasar yang terakhir diamati (dari `live-cache-regression-baseline.ts`) mencapai: prefiks stabil `cacheRead=4864`, tingkat hit `0.966`; transkrip alat `cacheRead=4608`, tingkat hit `0.896`; transkrip gambar `cacheRead=4864`, tingkat hit `0.954`; transkrip bergaya MCP `cacheRead=4608`, tingkat hit `0.891`.

Alasan asersi berbeda: Anthropic menyediakan titik henti cache eksplisit dan penggunaan ulang riwayat percakapan yang bergerak, sedangkan prefiks efektif yang dapat digunakan ulang oleh OpenAI dalam lalu lintas langsung dapat mencapai kondisi stabil sebelum seluruh prompt. Membandingkan kedua penyedia dengan satu ambang persentase lintas penyedia menghasilkan regresi palsu.

## Konfigurasi `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # opsional
    includeMessages: false # bawaan true
    includePrompt: false # bawaan true
    includeSystem: false # bawaan true
```

Nilai bawaan:

| Kunci             | Nilai bawaan                                 |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Pengalih variabel lingkungan (debugging sekali pakai)

| Variabel                             | Efek                                      |
| ------------------------------------ | ----------------------------------------- |
| `OPENCLAW_CACHE_TRACE=1`             | Mengaktifkan pelacakan cache              |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Mengganti jalur keluaran                  |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Mengalihkan pengambilan muatan pesan penuh |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Mengalihkan pengambilan teks prompt       |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Mengalihkan pengambilan prompt sistem     |

### Hal yang perlu diperiksa

- Peristiwa pelacakan cache berbentuk JSONL dengan snapshot bertahap seperti `session:loaded`, `prompt:before`, `stream:context`, dan `session:after`.
- Dampak token cache per giliran terlihat pada permukaan penggunaan normal: `cacheRead` dan `cacheWrite` muncul di `/usage tokens`, `/status`, ringkasan penggunaan sesi, dan tata letak khusus `messages.usageTemplate`.
- Untuk Anthropic, harapkan `cacheRead` dan `cacheWrite` saat caching aktif.
- Untuk OpenAI, harapkan `cacheRead` saat cache berhasil ditemukan; `cacheWrite` hanya diisi pada muatan Responses API yang menyertakannya (lihat [OpenAI](#openai-direct-api) di atas).
- OpenAI juga mengembalikan header pelacakan dan batas laju seperti `x-request-id`, `openai-processing-ms`, dan `x-ratelimit-*`; gunakan header tersebut untuk melacak permintaan, tetapi penghitungan keberhasilan cache tetap harus berasal dari muatan penggunaan, bukan dari header.

## Pemecahan masalah cepat

- **`cacheWrite` tinggi pada sebagian besar giliran**: periksa masukan prompt sistem yang berubah-ubah; pastikan model/penyedia mendukung pengaturan cache Anda.
- **`cacheWrite` tinggi pada Anthropic**: sering kali berarti titik henti cache berada pada konten yang berubah di setiap permintaan.
- **`cacheRead` OpenAI rendah**: pastikan prefiks stabil berada di bagian depan, prefiks berulang setidaknya berjumlah 1024 token, dan `prompt_cache_key` yang sama digunakan ulang untuk giliran yang seharusnya berbagi cache.
- **`cacheRetention` tidak memberikan efek**: pastikan kunci model cocok dengan `agents.defaults.models["provider/model"]`.
- **Permintaan Bedrock Nova dengan pengaturan cache**: sesuai harapan—permintaan ini ditetapkan tanpa retensi cache saat runtime.

Dokumentasi terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan dan biaya token](/id/reference/token-use)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Referensi konfigurasi Gateway](/id/gateway/configuration-reference)

## Terkait

- [Penggunaan dan biaya token](/id/reference/token-use)
- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
