---
read_when:
    - Menjalankan smoke model langsung matrix / backend CLI / ACP / penyedia media
    - Menelusuri masalah resolusi kredensial pengujian langsung
    - Menambahkan pengujian live khusus penyedia baru
sidebarTitle: Live tests
summary: 'Pengujian live (menyentuh jaringan): matriks model, backend CLI, ACP, penyedia media, kredensial'
title: 'Pengujian: rangkaian live'
x-i18n:
    generated_at: "2026-06-27T17:35:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

Untuk mulai cepat, runner QA, rangkaian unit/integrasi, dan alur Docker, lihat
[Pengujian](/id/help/testing). Halaman ini membahas rangkaian pengujian **live**
(menyentuh jaringan): matriks model, backend CLI, ACP, dan pengujian live
penyedia media, serta penanganan kredensial.

## Live: perintah smoke lokal

Ekspor kunci penyedia yang dibutuhkan di lingkungan proses sebelum pemeriksaan
live ad hoc.

Smoke media aman:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke kesiapan panggilan suara aman:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` adalah dry run kecuali `--yes` juga ada. Gunakan `--yes` hanya
saat Anda memang sengaja ingin melakukan panggilan notifikasi nyata. Untuk Twilio, Telnyx, dan
Plivo, pemeriksaan kesiapan yang berhasil memerlukan URL webhook publik; fallback
loopback/privat khusus lokal ditolak secara desain.

## Live: sapuan kapabilitas node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: memanggil **setiap perintah yang saat ini diiklankan** oleh node Android yang terhubung dan menegaskan perilaku kontrak perintah.
- Cakupan:
  - Penyiapan prasyarat/manual (rangkaian ini tidak menginstal/menjalankan/memasangkan aplikasi).
  - Validasi Gateway `node.invoke` per perintah untuk node Android yang dipilih.
- Pra-penyiapan wajib:
  - Aplikasi Android sudah terhubung + dipasangkan ke Gateway.
  - Aplikasi tetap di latar depan.
  - Izin/persetujuan capture diberikan untuk kapabilitas yang Anda harapkan lulus.
- Override target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail penyiapan Android lengkap: [Aplikasi Android](/id/platforms/android)

## Live: smoke model (kunci profil)

Pengujian live dibagi menjadi dua lapisan agar kita dapat mengisolasi kegagalan:

- "Model langsung" memberi tahu kita bahwa penyedia/model dapat menjawab sama sekali dengan kunci yang diberikan.
- "Smoke Gateway" memberi tahu kita bahwa pipeline Gateway+agen lengkap bekerja untuk model tersebut (sesi, riwayat, alat, kebijakan sandbox, dll.).

### Lapisan 1: Penyelesaian model langsung (tanpa Gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Menginventarisasi model yang ditemukan
  - Menggunakan `getApiKeyForModel` untuk memilih model yang kredensialnya Anda miliki
  - Menjalankan penyelesaian kecil per model (dan regresi tertarget bila diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Setel `OPENCLAW_LIVE_MODELS=modern`, `small`, atau `all` (alias untuk modern) untuk benar-benar menjalankan rangkaian ini; jika tidak, rangkaian ini dilewati agar `pnpm test:live` tetap berfokus pada smoke Gateway
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` untuk menjalankan allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` untuk menjalankan allowlist model kecil yang dibatasi (rute Qwen 8B/9B yang kompatibel lokal, Ollama Gemma, OpenRouter Qwen/GLM, dan Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk allowlist modern
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist dipisahkan koma)
  - Jalankan model kecil Ollama lokal default ke `http://127.0.0.1:11434`; setel `OPENCLAW_LIVE_OLLAMA_BASE_URL` hanya untuk endpoint LAN, kustom, atau Ollama Cloud.
  - Sapuan modern/all dan small default ke batas kurasi masing-masing; setel `OPENCLAW_LIVE_MAX_MODELS=0` untuk sapuan profil terpilih yang menyeluruh atau angka positif untuk batas yang lebih kecil.
  - Sapuan menyeluruh menggunakan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` untuk timeout seluruh pengujian model langsung. Default: 60 menit.
  - Probe model langsung berjalan dengan paralelisme 20 arah secara default; setel `OPENCLAW_LIVE_MODEL_CONCURRENCY` untuk mengganti.
- Cara memilih penyedia:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist dipisahkan koma)
- Dari mana kunci berasal:
  - Secara default: penyimpanan profil dan fallback env
  - Setel `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memberlakukan **penyimpanan profil** saja
- Mengapa ini ada:
  - Memisahkan "API penyedia rusak / kunci tidak valid" dari "pipeline agen Gateway rusak"
  - Berisi regresi kecil dan terisolasi (contoh: replay penalaran OpenAI Responses/Codex Responses + alur tool-call)

### Lapisan 2: Smoke Gateway + agen dev (apa yang sebenarnya dilakukan "@openclaw")

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Menjalankan Gateway dalam proses
  - Membuat/menambal sesi `agent:dev:*` (override model per run)
  - Mengiterasi model-dengan-kunci dan menegaskan:
    - respons "bermakna" (tanpa alat)
    - pemanggilan alat nyata bekerja (probe baca)
    - probe alat tambahan opsional (probe exec+baca)
    - jalur regresi OpenAI (hanya tool-call → tindak lanjut) tetap bekerja
- Detail probe (agar Anda dapat menjelaskan kegagalan dengan cepat):
  - probe `read`: pengujian menulis file nonce di workspace dan meminta agen untuk `read` file tersebut serta menggemakan nonce kembali.
  - probe `exec+read`: pengujian meminta agen untuk menulis nonce dengan `exec` ke file temp, lalu `read` kembali.
  - probe gambar: pengujian melampirkan PNG yang dihasilkan (cat + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `test/helpers/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Cara memilih model:
  - Default: allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` untuk menjalankan allowlist model kecil terbatas yang sama melalui pipeline Gateway+agen penuh
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk allowlist modern
  - Atau setel `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar koma) untuk mempersempit
  - Sapuan Gateway modern/all dan small default ke batas kurasi masing-masing; setel `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk sapuan terpilih yang menyeluruh atau angka positif untuk batas yang lebih kecil.
- Cara memilih penyedia (hindari "semua OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist dipisahkan koma)
- Probe alat + gambar selalu aktif dalam pengujian live ini:
  - probe `read` + probe `exec+read` (stres alat)
  - probe gambar berjalan saat model mengiklankan dukungan input gambar
  - Alur (tingkat tinggi):
    - Pengujian menghasilkan PNG kecil dengan "CAT" + kode acak (`test/helpers/live-image-probe.ts`)
    - Mengirimkannya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mengurai lampiran menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agen tertanam meneruskan pesan pengguna multimodal ke model
    - Asersi: balasan berisi `cat` + kode tersebut (toleransi OCR: kesalahan kecil diizinkan)

<Tip>
Untuk melihat apa yang dapat Anda uji di mesin Anda (dan id `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke backend CLI (Claude, Gemini, atau CLI lokal lainnya)

- Pengujian: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: memvalidasi pipeline Gateway + agen menggunakan backend CLI lokal, tanpa menyentuh konfigurasi default Anda.
- Default smoke khusus backend berada bersama definisi `cli-backend.ts` milik ekstensi pemilik.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Penyedia/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku perintah/argumen/gambar berasal dari metadata Plugin backend CLI pemilik.
- Override (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran gambar nyata (path disuntikkan ke prompt). Resep Docker menonaktifkan ini secara default kecuali diminta secara eksplisit.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path file gambar sebagai argumen CLI alih-alih injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol bagaimana argumen gambar diteruskan saat `IMAGE_ARG` disetel.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` untuk ikut serta dalam probe kontinuitas sesi yang sama Claude Sonnet -> Opus saat model yang dipilih mendukung target switch. Resep Docker menonaktifkan ini secara default untuk keandalan agregat.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` untuk ikut serta dalam probe loopback MCP/alat. Resep Docker menonaktifkan ini secara default kecuali diminta secara eksplisit.

Contoh:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke konfigurasi Gemini MCP murah:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Ini tidak meminta Gemini untuk menghasilkan respons. Ini menulis pengaturan sistem yang sama
yang diberikan OpenClaw kepada Gemini, lalu menjalankan `gemini --debug mcp list` untuk membuktikan server
tersimpan `transport: "streamable-http"` dinormalisasi ke bentuk HTTP MCP Gemini
dan dapat terhubung ke server MCP streamable-HTTP lokal.

Resep Docker:

```bash
pnpm test:docker:live-cli-backend
```

Resep Docker penyedia tunggal:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Catatan:

- Runner Docker berada di `scripts/test-live-cli-backend-docker.sh`.
- Ini menjalankan smoke backend CLI live di dalam image Docker repo sebagai pengguna non-root `node`.
- Ini menyelesaikan metadata smoke CLI dari ekstensi pemilik, lalu menginstal paket CLI Linux yang sesuai (`@anthropic-ai/claude-code` atau `@google/gemini-cli`) ke prefix writable yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth langganan Claude Code portabel melalui `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Ini terlebih dahulu membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran backend CLI Gateway tanpa mempertahankan variabel env kunci API Anthropic. Lane langganan ini menonaktifkan probe MCP/alat dan gambar Claude secara default karena Claude saat ini merutekan penggunaan aplikasi pihak ketiga melalui penagihan penggunaan ekstra alih-alih batas paket langganan normal.
- Smoke backend CLI live sekarang menjalankan alur end-to-end yang sama untuk Claude dan Gemini: giliran teks, giliran klasifikasi gambar, lalu panggilan alat MCP `cron` yang diverifikasi melalui CLI Gateway.
- Smoke default Claude juga menambal sesi dari Sonnet ke Opus dan memverifikasi sesi yang dilanjutkan masih mengingat catatan sebelumnya.

## Live: keterjangkauan proxy HTTP/2 APNs

- Pengujian: `src/infra/push-apns-http2.live.test.ts`
- Tujuan: membuat tunnel melalui proxy HTTP CONNECT lokal ke endpoint APNs sandbox Apple, mengirim permintaan validasi HTTP/2 APNs, dan menegaskan respons nyata Apple `403 InvalidProviderToken` kembali melalui jalur proxy.
- Aktifkan:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Timeout opsional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: smoke bind ACP (`/acp spawn ... --bind here`)

- Pengujian: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur bind percakapan ACP nyata dengan agen ACP live:
  - kirim `/acp spawn <agent> --bind here`
  - bind percakapan channel pesan sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi tindak lanjut masuk ke transkrip sesi ACP yang sudah di-bind
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Default:
  - Agen ACP di Docker: `claude,codex,gemini`
  - Agen ACP untuk `pnpm test:live ...` langsung: `claude`
  - Channel sintetis: konteks percakapan gaya DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Catatan:
  - Lane ini menggunakan permukaan Gateway `chat.send` dengan field originating-route sintetis khusus admin agar pengujian dapat melampirkan konteks channel pesan tanpa berpura-pura mengirim secara eksternal.
  - Saat `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak diatur, pengujian menggunakan registry agen bawaan Plugin `acpx` tertanam untuk agen harness ACP yang dipilih.
  - Pembuatan MCP Cron sesi ter-bind bersifat upaya-terbaik secara default karena harness ACP eksternal dapat membatalkan panggilan MCP setelah bukti bind/gambar lulus; atur `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` agar probe Cron pasca-bind tersebut menjadi ketat.

Contoh:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Resep Docker:

```bash
pnpm test:docker:live-acp-bind
```

Resep Docker agen tunggal:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-acp-bind-docker.sh`.
- Secara default, runner menjalankan smoke bind ACP terhadap agregat agen CLI live secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` untuk mempersempit matriks.
- Runner menyiapkan material auth CLI yang cocok ke dalam container, lalu menginstal CLI live yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli`, atau `opencode-ai`) jika belum ada. Backend ACP itu sendiri adalah paket `acpx/runtime` tertanam dari Plugin resmi `acpx`.
- Varian Docker Droid menyiapkan `~/.factory` untuk pengaturan, meneruskan `FACTORY_API_KEY`, dan memerlukan API key tersebut karena auth OAuth/keyring Factory lokal tidak portabel ke dalam container. Varian ini menggunakan entri registry bawaan ACPX `droid exec --output-format acp`.
- Varian Docker OpenCode adalah lane regresi agen tunggal yang ketat. Varian ini menulis model default `OPENCODE_CONFIG_CONTENT` sementara dari `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (default `opencode/kimi-k2.6`), dan `pnpm test:docker:live-acp-bind:opencode` memerlukan transkrip asisten ter-bind alih-alih menerima skip pasca-bind generik.
- Panggilan CLI `acpx` langsung hanya merupakan jalur manual/solusi sementara untuk membandingkan perilaku di luar Gateway. Smoke bind ACP Docker menjalankan backend runtime `acpx` tertanam milik OpenClaw.

## Live: smoke harness app-server Codex

- Tujuan: memvalidasi harness Codex milik Plugin melalui metode Gateway normal
  `agent`:
  - memuat Plugin `codex` bundel
  - memilih `openai/gpt-5.5`, yang merutekan giliran agen OpenAI melalui Codex secara default
  - mengirim giliran agen Gateway pertama ke `openai/gpt-5.5` dengan harness Codex dipilih
  - mengirim giliran kedua ke sesi OpenClaw yang sama dan memverifikasi thread app-server
    dapat dilanjutkan
  - menjalankan `/codex status` dan `/codex models` melalui jalur perintah Gateway
    yang sama
  - secara opsional menjalankan dua probe shell terekskalasi yang ditinjau Guardian: satu
    perintah aman yang seharusnya disetujui dan satu unggahan rahasia palsu yang seharusnya
    ditolak sehingga agen bertanya kembali
- Pengujian: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model default: `openai/gpt-5.5`
- Probe gambar opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian opsional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke memaksa provider/model `agentRuntime.id: "codex"` sehingga harness Codex yang rusak
  tidak dapat lolos dengan diam-diam fallback ke OpenClaw.
- Auth: auth app-server Codex dari login langganan Codex lokal. Smoke Docker
  juga dapat menyediakan `OPENAI_API_KEY` untuk probe non-Codex bila berlaku,
  ditambah salinan opsional `~/.codex/auth.json` dan `~/.codex/config.toml`.

Resep lokal:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Resep Docker:

```bash
pnpm test:docker:live-codex-harness
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-codex-harness-docker.sh`.
- Runner meneruskan `OPENAI_API_KEY`, menyalin file auth CLI Codex saat ada, menginstal
  `@openai/codex` ke prefix npm ter-mount yang dapat ditulis,
  menyiapkan pohon sumber, lalu hanya menjalankan pengujian live harness Codex.
- Docker mengaktifkan probe gambar, MCP/tool, dan Guardian secara default. Atur
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` saat Anda memerlukan run debug
  yang lebih sempit.
- Docker menggunakan konfigurasi runtime Codex eksplisit yang sama, sehingga alias lama atau fallback OpenClaw
  tidak dapat menyembunyikan regresi harness Codex.

### Resep live yang direkomendasikan

Allowlist yang sempit dan eksplisit adalah yang tercepat dan paling tidak rentan flake:

- Model tunggal, langsung (tanpa Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil langsung model kecil:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil Gateway model kecil:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Model tunggal, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan tool di beberapa provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke langsung Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Fokus Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptive thinking Google:
  - Default dinamis Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Anggaran dinamis Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Catatan:

- `google/...` menggunakan Gemini API (API key).
- `google-antigravity/...` menggunakan bridge OAuth Antigravity (endpoint agen gaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan CLI Gemini lokal pada mesin Anda (auth terpisah + keunikan tooling).
- Gemini API vs Gemini CLI:
  - API: OpenClaw memanggil Gemini API ter-host milik Google melalui HTTP (API key / auth profil); ini yang dimaksud sebagian besar pengguna dengan "Gemini".
  - CLI: OpenClaw menjalankan biner `gemini` lokal melalui shell; biner ini memiliki auth sendiri dan dapat berperilaku berbeda (streaming/dukungan tool/ketidaksinkronan versi).

## Live: matriks model (yang kami cakup)

Tidak ada "daftar model CI" tetap (live bersifat opt-in), tetapi berikut adalah model yang **direkomendasikan** untuk dicakup secara rutin pada mesin pengembangan dengan key.

### Set smoke modern (pemanggilan tool + gambar)

Ini adalah run "model umum" yang kami harapkan tetap berfungsi:

- OpenAI (non-Codex): `openai/gpt-5.5`
- OAuth OpenAI ChatGPT/Codex: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` dan `google/gemini-3-flash-preview` (hindari model Gemini 2.x yang lebih lama)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` dan `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` dan `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API umum) atau `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Jalankan smoke Gateway dengan tool + gambar:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: pemanggilan tool (Read + Exec opsional)

Pilih setidaknya satu per keluarga provider:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (atau `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (API umum) atau `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Cakupan tambahan opsional (baik jika ada):

- xAI: `xai/grok-4.3` (atau terbaru yang tersedia)
- Mistral: `mistral/`… (pilih satu model berkemampuan "tools" yang sudah Anda aktifkan)
- Cerebras: `cerebras/`… (jika Anda memiliki akses)
- LM Studio: `lmstudio/`… (lokal; pemanggilan tool bergantung pada mode API)

### Vision: pengiriman gambar (lampiran → pesan multimodal)

Sertakan setidaknya satu model berkemampuan gambar dalam `OPENCLAW_LIVE_GATEWAY_MODELS` (varian Claude/Gemini/OpenAI yang mendukung vision, dll.) untuk menjalankan probe gambar.

### Agregator / Gateway alternatif

Jika key Anda aktif, kami juga mendukung pengujian melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat yang mampu tool+gambar)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (auth melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Provider lain yang dapat Anda sertakan dalam matriks live (jika Anda memiliki kredensial/konfigurasi):

- Bawaan: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Melalui `models.providers` (endpoint kustom): `minimax` (cloud/API), plus proxy apa pun yang kompatibel dengan OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, dll.)

<Tip>
Jangan melakukan hardcode "semua model" di docs. Daftar otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` di mesin Anda plus kunci apa pun yang tersedia.
</Tip>

## Kredensial (jangan pernah commit)

Pengujian live menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktisnya:

- Jika CLI berfungsi, pengujian live seharusnya menemukan kunci yang sama.
- Jika pengujian live mengatakan "tidak ada kredensial", debug dengan cara yang sama seperti saat men-debug `openclaw models list` / pemilihan model.

- Profil auth per agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah yang dimaksud "kunci profil" dalam pengujian live)
- Konfigurasi: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori status lama: `~/.openclaw/credentials/` (disalin ke home live bertahap saat ada, tetapi bukan penyimpanan kunci profil utama)
- Proses live lokal secara default menyalin konfigurasi aktif, file `auth-profiles.json` per agen, `credentials/` lama, dan direktori auth CLI eksternal yang didukung ke home pengujian sementara; home live bertahap melewati `workspace/` dan `sandboxes/`, dan override path `agents.*.workspace` / `agentDir` dihapus agar probe tetap tidak menyentuh workspace host asli Anda.

Jika Anda ingin mengandalkan kunci env, ekspor kunci tersebut sebelum pengujian lokal atau gunakan
runner Docker di bawah dengan `OPENCLAW_PROFILE_FILE` eksplisit.

## Live Deepgram (transkripsi audio)

- Pengujian: `extensions/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live rencana coding BytePlus

- Pengujian: `extensions/byteplus/live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media workflow ComfyUI

- Pengujian: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menjalankan path comfy gambar, video, dan `music_generate` bawaan
  - Melewati setiap kapabilitas kecuali `plugins.entries.comfy.config.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman workflow comfy, polling, unduhan, atau pendaftaran Plugin

## Live pembuatan gambar

- Pengujian: `test/image-generation.runtime.live.test.ts`
- Perintah: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Menginventarisasi setiap Plugin penyedia pembuatan gambar yang terdaftar
  - Menggunakan variabel env penyedia yang sudah diekspor sebelum melakukan probe
  - Secara default menggunakan kunci API live/env sebelum profil auth tersimpan, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia tanpa auth/profil/model yang dapat digunakan
  - Menjalankan setiap penyedia yang dikonfigurasi melalui runtime pembuatan gambar bersama:
    - `<provider>:generate`
    - `<provider>:edit` saat penyedia mendeklarasikan dukungan edit
- Penyedia bawaan saat ini yang tercakup:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Penyempitan opsional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth penyimpanan profil dan mengabaikan override yang hanya env

Untuk path CLI yang dikirim, tambahkan smoke `infer` setelah pengujian live
penyedia/runtime lulus:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Ini mencakup parsing argumen CLI, resolusi konfigurasi/agen default, aktivasi
Plugin bawaan, runtime pembuatan gambar bersama, dan permintaan penyedia
live. Dependensi Plugin diharapkan sudah ada sebelum pemuatan runtime.

## Live pembuatan musik

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menjalankan path penyedia pembuatan musik bawaan bersama
  - Saat ini mencakup Google dan MiniMax
  - Menggunakan variabel env penyedia yang sudah diekspor sebelum melakukan probe
  - Secara default menggunakan kunci API live/env sebelum profil auth tersimpan, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia tanpa auth/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan saat tersedia:
    - `generate` dengan input hanya prompt
    - `edit` saat penyedia mendeklarasikan `capabilities.edit.enabled`
  - Cakupan jalur bersama saat ini:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy terpisah, bukan pemeriksaan menyeluruh bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth penyimpanan profil dan mengabaikan override yang hanya env

## Live pembuatan video

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menjalankan path penyedia pembuatan video bawaan bersama
  - Default ke path smoke yang aman untuk rilis: penyedia non-FAL, satu permintaan teks-ke-video per penyedia, prompt lobster berdurasi satu detik, dan batas operasi per penyedia dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default)
  - Melewati FAL secara default karena latensi antrean di sisi penyedia dapat mendominasi waktu rilis; berikan `--video-providers fal` atau `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` untuk menjalankannya secara eksplisit
  - Menggunakan variabel env penyedia yang sudah diekspor sebelum melakukan probe
  - Secara default menggunakan kunci API live/env sebelum profil auth tersimpan, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia tanpa auth/profil/model yang dapat digunakan
  - Secara default hanya menjalankan `generate`
  - Atur `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transform yang dideklarasikan saat tersedia:
    - `imageToVideo` saat penyedia mendeklarasikan `capabilities.imageToVideo.enabled` dan penyedia/model yang dipilih menerima input gambar lokal berbasis buffer dalam pemeriksaan menyeluruh bersama
    - `videoToVideo` saat penyedia mendeklarasikan `capabilities.videoToVideo.enabled` dan penyedia/model yang dipilih menerima input video lokal berbasis buffer dalam pemeriksaan menyeluruh bersama
  - Penyedia `imageToVideo` yang saat ini dideklarasikan tetapi dilewati dalam pemeriksaan menyeluruh bersama:
    - `vydra` karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar jarak jauh
  - Cakupan khusus penyedia Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - file tersebut menjalankan teks-ke-video `veo3` plus jalur `kling` yang secara default menggunakan fixture URL gambar jarak jauh
  - Cakupan live `videoToVideo` saat ini:
    - `runway` hanya saat model yang dipilih adalah `runway/gen4_aleph`
  - Penyedia `videoToVideo` yang saat ini dideklarasikan tetapi dilewati dalam pemeriksaan menyeluruh bersama:
    - `alibaba`, `qwen`, `xai` karena path tersebut saat ini memerlukan URL referensi `http(s)` / MP4 jarak jauh
    - `google` karena jalur Gemini/Veo bersama saat ini menggunakan input lokal berbasis buffer dan path tersebut tidak diterima dalam pemeriksaan menyeluruh bersama
    - `openai` karena jalur bersama saat ini tidak memiliki jaminan akses edit video khusus organisasi
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap penyedia dalam pemeriksaan menyeluruh default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas operasi setiap penyedia untuk smoke run agresif
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth penyimpanan profil dan mengabaikan override yang hanya env

## Harness live media

- Perintah: `pnpm test:live:media`
- Tujuan:
  - Menjalankan suite live gambar, musik, dan video bersama melalui satu entrypoint native repo
  - Menggunakan variabel env penyedia yang sudah diekspor
  - Secara default mempersempit otomatis setiap suite ke penyedia yang saat ini memiliki auth yang dapat digunakan
  - Menggunakan ulang `scripts/test-live.mjs`, sehingga perilaku Heartbeat dan mode senyap tetap konsisten
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Terkait

- [Pengujian](/id/help/testing) - suite unit, integrasi, QA, dan Docker
