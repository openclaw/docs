---
read_when:
    - Menjalankan smoke matriks model live / backend CLI / ACP / provider media
    - Men-debug resolusi kredensial pengujian live
    - Menambahkan pengujian live khusus provider baru
sidebarTitle: Live tests
summary: 'Pengujian live (menyentuh jaringan): matriks model, backend CLI, ACP, provider media, kredensial'
title: 'Pengujian: suite live'
x-i18n:
    generated_at: "2026-04-24T09:11:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03689542176843de6e0163011250d1c1225ee5af492f88acf945b242addd1cc9
    source_path: help/testing-live.md
    workflow: 15
---

Untuk mulai cepat, runner QA, suite unit/integrasi, dan alur Docker, lihat
[Pengujian](/id/help/testing). Halaman ini membahas suite pengujian **live** (menyentuh jaringan):
matriks model, backend CLI, ACP, dan pengujian live provider media, plus
penanganan kredensial.

## Live: sapuan kapabilitas node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: memanggil **setiap perintah yang saat ini diiklankan** oleh node Android yang terhubung dan memverifikasi perilaku kontrak perintah.
- Cakupan:
  - Penyiapan manual/prasyarat (suite ini tidak menginstal/menjalankan/melakukan pairing aplikasi).
  - Validasi `node.invoke` gateway per perintah untuk node Android yang dipilih.
- Pra-penyiapan yang diperlukan:
  - Aplikasi Android sudah terhubung + dipasangkan ke gateway.
  - Aplikasi tetap di foreground.
  - Izin/persetujuan capture diberikan untuk kapabilitas yang Anda harapkan lolos.
- Override target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail penyiapan Android lengkap: [Aplikasi Android](/id/platforms/android)

## Live: smoke model (kunci profil)

Pengujian live dibagi menjadi dua lapisan agar kita bisa mengisolasi kegagalan:

- “Model langsung” memberi tahu kita apakah provider/model sama sekali dapat menjawab dengan key yang diberikan.
- “Gateway smoke” memberi tahu kita apakah pipeline gateway+agen penuh bekerja untuk model tersebut (sesi, riwayat, alat, kebijakan sandbox, dll.).

### Lapisan 1: penyelesaian model langsung (tanpa gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Mengenumerasi model yang ditemukan
  - Menggunakan `getApiKeyForModel` untuk memilih model yang Anda punya kredensialnya
  - Menjalankan penyelesaian kecil per model (dan regresi terarah bila perlu)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest langsung)
- Setel `OPENCLAW_LIVE_MODELS=modern` (atau `all`, alias untuk modern) agar suite ini benar-benar berjalan; jika tidak, suite ini dilewati agar `pnpm test:live` tetap fokus pada gateway smoke
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` untuk menjalankan allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk allowlist modern
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist dipisahkan koma)
  - Sapuan modern/all secara default memakai batas terkurasi dengan sinyal tinggi; setel `OPENCLAW_LIVE_MAX_MODELS=0` untuk sapuan modern menyeluruh atau angka positif untuk batas yang lebih kecil.
  - Sapuan menyeluruh menggunakan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` untuk timeout seluruh pengujian model langsung. Default: 60 menit.
  - Probe model langsung berjalan dengan paralelisme 20 jalur secara default; setel `OPENCLAW_LIVE_MODEL_CONCURRENCY` untuk override.
- Cara memilih provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist dipisahkan koma)
- Dari mana key berasal:
  - Default: penyimpanan profil dan fallback env
  - Setel `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa **hanya penyimpanan profil**
- Mengapa ini ada:
  - Memisahkan “API provider rusak / key tidak valid” dari “pipeline agen gateway rusak”
  - Menampung regresi kecil yang terisolasi (contoh: alur reasoning replay + tool-call OpenAI Responses/Codex Responses)

### Lapisan 2: Gateway + smoke agen dev (apa yang sebenarnya dilakukan "@openclaw")

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Menjalankan gateway dalam proses
  - Membuat/menambal sesi `agent:dev:*` (override model per eksekusi)
  - Mengiterasi model-dengan-key dan memverifikasi:
    - respons yang “bermakna” (tanpa alat)
    - pemanggilan alat nyata bekerja (probe read)
    - probe alat tambahan opsional (probe exec+read)
    - jalur regresi OpenAI (hanya tool-call → tindak lanjut) tetap berfungsi
- Detail probe (agar Anda bisa menjelaskan kegagalan dengan cepat):
  - probe `read`: pengujian menulis file nonce di workspace dan meminta agen untuk `read` file itu lalu mengembalikan nonce.
  - probe `exec+read`: pengujian meminta agen menulis nonce ke file sementara lewat `exec`, lalu `read` kembali.
  - probe gambar: pengujian melampirkan PNG yang dihasilkan (kucing + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `src/gateway/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest langsung)
- Cara memilih model:
  - Default: allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk allowlist modern
  - Atau setel `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar dipisahkan koma) untuk mempersempit
  - Sapuan gateway modern/all secara default memakai batas terkurasi dengan sinyal tinggi; setel `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk sapuan modern menyeluruh atau angka positif untuk batas yang lebih kecil.
- Cara memilih provider (hindari “semua OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist dipisahkan koma)
- Probe alat + gambar selalu aktif dalam pengujian live ini:
  - probe `read` + probe `exec+read` (stress alat)
  - probe gambar berjalan ketika model mengiklankan dukungan input gambar
  - Alur (tingkat tinggi):
    - Pengujian menghasilkan PNG kecil dengan “CAT” + kode acak (`src/gateway/live-image-probe.ts`)
    - Mengirimnya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mem-parse lampiran ke `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agen tertanam meneruskan pesan pengguna multimodal ke model
    - Verifikasi: balasan berisi `cat` + kode tersebut (toleransi OCR: kesalahan kecil diperbolehkan)

Tip: untuk melihat apa yang bisa Anda uji di mesin Anda (dan id `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backend CLI (Claude, Codex, Gemini, atau CLI lokal lain)

- Pengujian: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: memvalidasi pipeline Gateway + agen menggunakan backend CLI lokal, tanpa menyentuh config default Anda.
- Default smoke khusus backend berada di definisi `cli-backend.ts` milik ekstensi pemilik.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Provider/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku command/args/image berasal dari metadata plugin backend CLI pemilik.
- Override (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran gambar nyata (path disuntikkan ke prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path file gambar sebagai arg CLI alih-alih injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol cara arg gambar diteruskan saat `IMAGE_ARG` disetel.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` untuk menonaktifkan probe kontinuitas default Claude Sonnet -> Opus dalam sesi yang sama (setel ke `1` untuk memaksanya aktif saat model terpilih mendukung target pergantian).

Contoh:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Resep Docker:

```bash
pnpm test:docker:live-cli-backend
```

Resep Docker penyedia tunggal:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Catatan:

- Runner Docker berada di `scripts/test-live-cli-backend-docker.sh`.
- Runner ini menjalankan smoke backend CLI live di dalam image Docker repo sebagai pengguna non-root `node`.
- Runner ini menyelesaikan metadata smoke CLI dari ekstensi pemilik, lalu menginstal paket CLI Linux yang cocok (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) ke prefiks writable yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth langganan Claude Code portabel melalui `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Runner ini terlebih dahulu membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran backend CLI Gateway tanpa mempertahankan variabel env API key Anthropic. Jalur langganan ini menonaktifkan probe alat/image Claude MCP secara default karena Claude saat ini merutekan penggunaan aplikasi pihak ketiga melalui billing penggunaan tambahan alih-alih batas paket langganan normal.
- Smoke backend CLI live sekarang menjalankan alur ujung ke ujung yang sama untuk Claude, Codex, dan Gemini: giliran teks, giliran klasifikasi gambar, lalu pemanggilan alat MCP `cron` yang diverifikasi melalui CLI gateway.
- Smoke default Claude juga menambal sesi dari Sonnet ke Opus dan memverifikasi sesi yang dilanjutkan masih mengingat catatan sebelumnya.

## Live: smoke bind ACP (`/acp spawn ... --bind here`)

- Pengujian: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur bind percakapan ACP nyata dengan agen ACP live:
  - kirim `/acp spawn <agent> --bind here`
  - bind percakapan saluran pesan sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi tindak lanjut masuk ke transkrip sesi ACP yang dibind
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Default:
  - Agen ACP di Docker: `claude,codex,gemini`
  - Agen ACP untuk `pnpm test:live ...` langsung: `claude`
  - Saluran sintetis: konteks percakapan bergaya DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Catatan:
  - Jalur ini menggunakan permukaan gateway `chat.send` dengan field originating-route sintetis khusus admin sehingga pengujian dapat melampirkan konteks saluran pesan tanpa berpura-pura mengirim secara eksternal.
  - Saat `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak disetel, pengujian menggunakan registri agen bawaan plugin `acpx` tertanam untuk agen harness ACP yang dipilih.

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
pnpm test:docker:live-acp-bind:gemini
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-acp-bind-docker.sh`.
- Secara default, runner ini menjalankan smoke bind ACP terhadap semua agen CLI live yang didukung secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` untuk mempersempit matriks.
- Runner ini memuat `~/.profile`, men-stage materi auth CLI yang cocok ke dalam container, menginstal `acpx` ke prefiks npm writable, lalu menginstal CLI live yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) jika belum ada.
- Di dalam Docker, runner menetapkan `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` agar acpx mempertahankan variabel env provider dari profile yang dimuat tetap tersedia untuk CLI harness anak.

## Live: smoke harness app-server Codex

- Tujuan: memvalidasi harness Codex milik plugin melalui metode `agent`
  gateway normal:
  - memuat plugin `codex` bawaan
  - memilih `OPENCLAW_AGENT_RUNTIME=codex`
  - mengirim giliran agen gateway pertama ke `openai/gpt-5.2` dengan harness Codex dipaksa
  - mengirim giliran kedua ke sesi OpenClaw yang sama dan memverifikasi thread
    app-server dapat dilanjutkan
  - menjalankan `/codex status` dan `/codex models` melalui jalur perintah
    gateway yang sama
  - secara opsional menjalankan dua probe shell eskalasi yang ditinjau Guardian: satu
    perintah aman yang seharusnya disetujui dan satu upload secret palsu yang seharusnya
    ditolak sehingga agen bertanya balik
- Pengujian: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model default: `openai/gpt-5.2`
- Probe gambar opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/alat opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian opsional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke ini menetapkan `OPENCLAW_AGENT_HARNESS_FALLBACK=none` sehingga harness Codex
  yang rusak tidak dapat lolos dengan diam-diam fallback ke PI.
- Auth: auth app-server Codex dari login langganan Codex lokal. Smoke Docker
  juga dapat menyediakan `OPENAI_API_KEY` untuk probe non-Codex bila berlaku,
  plus `~/.codex/auth.json` dan `~/.codex/config.toml` yang disalin secara opsional.

Resep lokal:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Resep Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-codex-harness-docker.sh`.
- Runner ini memuat `~/.profile` yang di-mount, meneruskan `OPENAI_API_KEY`, menyalin file
  auth CLI Codex saat ada, menginstal `@openai/codex` ke prefix npm yang dapat ditulis dan di-mount,
  men-stage source tree, lalu hanya menjalankan pengujian live harness Codex.
- Docker mengaktifkan probe gambar, MCP/alat, dan Guardian secara default. Setel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` saat Anda membutuhkan eksekusi debug
  yang lebih sempit.
- Docker juga mengekspor `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, sesuai dengan config
  pengujian live sehingga alias lama atau fallback PI tidak dapat menyembunyikan
  regresi harness Codex.

### Resep live yang direkomendasikan

Allowlist yang sempit dan eksplisit adalah yang tercepat dan paling sedikit bermasalah:

- Satu model, langsung (tanpa gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Satu model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan alat di beberapa provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus Google (API key Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Catatan:

- `google/...` menggunakan API Gemini (API key).
- `google-antigravity/...` menggunakan bridge OAuth Antigravity (endpoint agen bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan Gemini CLI lokal di mesin Anda (auth terpisah + kekhasan alat).
- Gemini API vs Gemini CLI:
  - API: OpenClaw memanggil API Gemini hosted Google melalui HTTP (auth API key / profil); ini yang dimaksud kebanyakan pengguna dengan “Gemini”.
  - CLI: OpenClaw menjalankan binary `gemini` lokal; memiliki auth sendiri dan dapat berperilaku berbeda (dukungan streaming/alat/perbedaan versi).

## Live: matriks model (apa yang kami cakup)

Tidak ada “daftar model CI” yang tetap (live bersifat opt-in), tetapi berikut adalah model **yang direkomendasikan** untuk dicakup secara rutin di mesin dev dengan key.

### Kumpulan smoke modern (pemanggilan alat + gambar)

Ini adalah eksekusi “model umum” yang kami harapkan tetap berfungsi:

- OpenAI (non-Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` dan `google/gemini-3-flash-preview` (hindari model Gemini 2.x yang lebih lama)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` dan `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Jalankan gateway smoke dengan alat + gambar:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: pemanggilan alat (Read + Exec opsional)

Pilih setidaknya satu per keluarga provider:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (atau `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cakupan tambahan opsional (bagus untuk dimiliki):

- xAI: `xai/grok-4` (atau versi terbaru yang tersedia)
- Mistral: `mistral/`… (pilih satu model yang Anda aktifkan dan mampu menangani alat)
- Cerebras: `cerebras/`… (jika Anda punya akses)
- LM Studio: `lmstudio/`… (lokal; pemanggilan alat tergantung pada mode API)

### Vision: kirim gambar (lampiran → pesan multimodal)

Sertakan setidaknya satu model yang mendukung gambar di `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/varian OpenAI yang mendukung vision, dll.) untuk menjalankan probe gambar.

### Aggregator / gateway alternatif

Jika Anda memiliki key yang diaktifkan, kami juga mendukung pengujian melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat yang mendukung alat+gambar)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (auth melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Provider lain yang dapat Anda sertakan dalam matriks live (jika Anda memiliki kredensial/config):

- Bawaan: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Melalui `models.providers` (endpoint kustom): `minimax` (cloud/API), plus proxy apa pun yang kompatibel dengan OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, dll.)

Tip: jangan mencoba meng-hardcode “semua model” di docs. Daftar otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` di mesin Anda + key apa pun yang tersedia.

## Kredensial (jangan pernah commit)

Pengujian live menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktis:

- Jika CLI berfungsi, pengujian live seharusnya menemukan key yang sama.
- Jika pengujian live mengatakan “tidak ada kredensial”, debug-lah dengan cara yang sama seperti Anda men-debug `openclaw models list` / pemilihan model.

- Profil auth per-agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah yang dimaksud dengan “profile keys” dalam pengujian live)
- Config: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori status lama: `~/.openclaw/credentials/` (disalin ke live home yang di-stage saat ada, tetapi bukan penyimpanan utama profile-key)
- Eksekusi lokal live secara default menyalin config aktif, file `auth-profiles.json` per-agen, `credentials/` lama, dan direktori auth CLI eksternal yang didukung ke home pengujian sementara; live home yang di-stage melewati `workspace/` dan `sandboxes/`, dan override path `agents.*.workspace` / `agentDir` dihapus agar probe tidak menyentuh workspace host Anda yang sebenarnya.

Jika Anda ingin mengandalkan key env (misalnya diekspor di `~/.profile`), jalankan pengujian lokal setelah `source ~/.profile`, atau gunakan runner Docker di bawah (runner ini dapat me-mount `~/.profile` ke dalam container).

## Deepgram live (transkripsi audio)

- Pengujian: `extensions/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Pengujian: `extensions/byteplus/live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Pengujian: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menjalankan jalur gambar, video, dan `music_generate` comfy bawaan
  - Melewati setiap kapabilitas kecuali `models.providers.comfy.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman workflow comfy, polling, download, atau pendaftaran plugin

## Image generation live

- Pengujian: `test/image-generation.runtime.live.test.ts`
- Perintah: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Mengenumerasi setiap plugin provider pembuatan gambar yang terdaftar
  - Memuat variabel env provider yang hilang dari shell login Anda (`~/.profile`) sebelum probing
  - Secara default menggunakan key API live/env sebelum profil auth yang tersimpan, sehingga key pengujian basi di `auth-profiles.json` tidak menutupi kredensial shell yang nyata
  - Melewati provider tanpa auth/profil/model yang dapat digunakan
  - Menjalankan varian stok pembuatan gambar melalui kapabilitas runtime bersama:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider bawaan yang saat ini dicakup:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Penyempitan opsional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth penyimpanan profil dan mengabaikan override hanya-env

## Music generation live

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menjalankan jalur provider pembuatan musik bawaan bersama
  - Saat ini mencakup Google dan MiniMax
  - Memuat variabel env provider dari shell login Anda (`~/.profile`) sebelum probing
  - Secara default menggunakan key API live/env sebelum profil auth yang tersimpan, sehingga key pengujian basi di `auth-profiles.json` tidak menutupi kredensial shell yang nyata
  - Melewati provider tanpa auth/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan saat tersedia:
    - `generate` dengan input hanya prompt
    - `edit` saat provider mendeklarasikan `capabilities.edit.enabled`
  - Cakupan jalur bersama saat ini:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy terpisah, bukan sapuan bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth penyimpanan profil dan mengabaikan override hanya-env

## Video generation live

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menjalankan jalur provider pembuatan video bawaan bersama
  - Secara default menggunakan jalur smoke yang aman untuk rilis: provider non-FAL, satu permintaan text-to-video per provider, prompt lobster satu detik, dan batas operasi per provider dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default)
  - Secara default melewati FAL karena latensi antrean di sisi provider dapat mendominasi waktu rilis; berikan `--video-providers fal` atau `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` untuk menjalankannya secara eksplisit
  - Memuat variabel env provider dari shell login Anda (`~/.profile`) sebelum probing
  - Secara default menggunakan key API live/env sebelum profil auth yang tersimpan, sehingga key pengujian basi di `auth-profiles.json` tidak menutupi kredensial shell yang nyata
  - Melewati provider tanpa auth/profil/model yang dapat digunakan
  - Secara default hanya menjalankan `generate`
  - Setel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transform yang dideklarasikan saat tersedia:
    - `imageToVideo` saat provider mendeklarasikan `capabilities.imageToVideo.enabled` dan provider/model yang dipilih menerima input gambar lokal berbasis buffer dalam sapuan bersama
    - `videoToVideo` saat provider mendeklarasikan `capabilities.videoToVideo.enabled` dan provider/model yang dipilih menerima input video lokal berbasis buffer dalam sapuan bersama
  - Provider `imageToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sapuan bersama:
    - `vydra` karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar remote
  - Cakupan Vydra khusus provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - file tersebut menjalankan `veo3` text-to-video plus jalur `kling` yang menggunakan fixture URL gambar remote secara default
  - Cakupan live `videoToVideo` saat ini:
    - `runway` hanya saat model yang dipilih adalah `runway/gen4_aleph`
  - Provider `videoToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sapuan bersama:
    - `alibaba`, `qwen`, `xai` karena jalur tersebut saat ini memerlukan URL referensi `http(s)` / MP4 remote
    - `google` karena jalur Gemini/Veo bersama saat ini menggunakan input lokal berbasis buffer dan jalur itu tidak diterima dalam sapuan bersama
    - `openai` karena jalur bersama saat ini tidak memiliki jaminan akses inpaint/remix video khusus organisasi
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap provider dalam sapuan default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas operasi tiap provider demi eksekusi smoke yang agresif
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth penyimpanan profil dan mengabaikan override hanya-env

## Harness media live

- Perintah: `pnpm test:live:media`
- Tujuan:
  - Menjalankan suite live gambar, musik, dan video bersama melalui satu entrypoint bawaan repo
  - Memuat otomatis variabel env provider yang hilang dari `~/.profile`
  - Secara otomatis mempersempit tiap suite ke provider yang saat ini memiliki auth yang dapat digunakan secara default
  - Menggunakan ulang `scripts/test-live.mjs`, sehingga perilaku heartbeat dan mode tenang tetap konsisten
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Terkait

- [Pengujian](/id/help/testing) — suite unit, integrasi, QA, dan Docker
