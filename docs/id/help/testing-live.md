---
read_when:
    - Menjalankan uji smoke matriks model live / backend CLI / ACP / penyedia-media
    - Pemecahan masalah resolusi kredensial pengujian langsung
    - Menambahkan pengujian langsung baru khusus penyedia
sidebarTitle: Live tests
summary: 'Pengujian live (menyentuh jaringan): matriks model, backend CLI, ACP, penyedia media, kredensial'
title: 'Pengujian: rangkaian pengujian langsung'
x-i18n:
    generated_at: "2026-04-30T09:54:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

Untuk mulai cepat, runner QA, suite unit/integrasi, dan alur Docker, lihat
[Pengujian](/id/help/testing). Halaman ini mencakup suite pengujian **live**
(menyentuh jaringan): matriks model, backend CLI, ACP, dan pengujian live
penyedia media, plus penanganan kredensial.

## Live: perintah smoke profil lokal

Source `~/.profile` sebelum pemeriksaan live ad hoc agar kunci penyedia dan path
alat lokal cocok dengan shell Anda:

```bash
source ~/.profile
```

Smoke media aman:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke kesiapan panggilan suara yang aman:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` adalah dry run kecuali `--yes` juga ada. Gunakan `--yes` hanya
ketika Anda memang sengaja ingin melakukan panggilan notifikasi sungguhan. Untuk Twilio, Telnyx, dan
Plivo, pemeriksaan kesiapan yang berhasil memerlukan URL Webhook publik; fallback
local loopback/privat lokal ditolak sesuai desain.

## Live: penyapuan kapabilitas node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: memanggil **setiap perintah yang saat ini diiklankan** oleh node Android yang terhubung dan menegaskan perilaku kontrak perintah.
- Cakupan:
  - Penyiapan bersyarat/manual (suite tidak menginstal/menjalankan/memasangkan aplikasi).
  - Validasi Gateway `node.invoke` per perintah untuk node Android yang dipilih.
- Pra-penyiapan wajib:
  - Aplikasi Android sudah terhubung + dipasangkan ke gateway.
  - Aplikasi tetap berada di foreground.
  - Izin/persetujuan capture diberikan untuk kapabilitas yang Anda harapkan lulus.
- Override target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail lengkap penyiapan Android: [Aplikasi Android](/id/platforms/android)

## Live: smoke model (kunci profil)

Pengujian live dibagi menjadi dua lapisan agar kita dapat mengisolasi kegagalan:

- “Model langsung” memberi tahu kita bahwa penyedia/model bisa menjawab sama sekali dengan kunci yang diberikan.
- “Smoke Gateway” memberi tahu kita bahwa pipeline gateway+agen penuh berfungsi untuk model tersebut (sesi, riwayat, alat, kebijakan sandbox, dll.).

### Lapisan 1: Penyelesaian model langsung (tanpa gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Mengenumerasi model yang ditemukan
  - Menggunakan `getApiKeyForModel` untuk memilih model yang kredensialnya Anda miliki
  - Menjalankan penyelesaian kecil per model (dan regresi tertarget jika diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Tetapkan `OPENCLAW_LIVE_MODELS=modern` (atau `all`, alias untuk modern) untuk benar-benar menjalankan suite ini; jika tidak, suite ini dilewati agar `pnpm test:live` tetap berfokus pada smoke gateway
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` untuk menjalankan allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk allowlist modern
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist koma)
  - Penyapuan modern/all secara default menggunakan batas curated dengan sinyal tinggi; tetapkan `OPENCLAW_LIVE_MAX_MODELS=0` untuk penyapuan modern menyeluruh atau angka positif untuk batas yang lebih kecil.
  - Penyapuan menyeluruh menggunakan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` untuk timeout seluruh pengujian model langsung. Default: 60 menit.
  - Probe model langsung berjalan dengan paralelisme 20 arah secara default; tetapkan `OPENCLAW_LIVE_MODEL_CONCURRENCY` untuk mengubahnya.
- Cara memilih penyedia:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist koma)
- Dari mana kunci berasal:
  - Secara default: penyimpanan profil dan fallback env
  - Tetapkan `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memberlakukan hanya **penyimpanan profil**
- Mengapa ini ada:
  - Memisahkan “API penyedia rusak / kunci tidak valid” dari “pipeline agen gateway rusak”
  - Berisi regresi kecil dan terisolasi (contoh: OpenAI Responses/Codex Responses reasoning replay + alur tool-call)

### Lapisan 2: Smoke Gateway + agen dev (yang sebenarnya dilakukan "@openclaw")

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Menjalankan gateway in-process
  - Membuat/menambal sesi `agent:dev:*` (override model per run)
  - Mengiterasi model-dengan-kunci dan menegaskan:
    - respons “bermakna” (tanpa alat)
    - pemanggilan alat nyata berfungsi (probe baca)
    - probe alat ekstra opsional (probe exec+baca)
    - jalur regresi OpenAI (tool-call-only → tindak lanjut) tetap berfungsi
- Detail probe (agar Anda dapat menjelaskan kegagalan dengan cepat):
  - Probe `read`: pengujian menulis file nonce di workspace dan meminta agen untuk `read` file tersebut dan menggemakan nonce kembali.
  - Probe `exec+read`: pengujian meminta agen untuk `exec`-menulis nonce ke file temp, lalu `read` kembali.
  - Probe gambar: pengujian melampirkan PNG yang dihasilkan (cat + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `src/gateway/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Cara memilih model:
  - Default: allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk allowlist modern
  - Atau tetapkan `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar koma) untuk mempersempit
  - Penyapuan gateway modern/all secara default menggunakan batas curated dengan sinyal tinggi; tetapkan `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk penyapuan modern menyeluruh atau angka positif untuk batas yang lebih kecil.
- Cara memilih penyedia (menghindari “semua OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist koma)
- Probe alat + gambar selalu aktif dalam pengujian live ini:
  - Probe `read` + probe `exec+read` (stress alat)
  - Probe gambar berjalan saat model mengiklankan dukungan input gambar
  - Alur (tingkat tinggi):
    - Pengujian menghasilkan PNG kecil dengan “CAT” + kode acak (`src/gateway/live-image-probe.ts`)
    - Mengirimnya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mengurai attachment menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agen tertanam meneruskan pesan pengguna multimodal ke model
    - Assertion: balasan berisi `cat` + kode (toleransi OCR: kesalahan kecil diizinkan)

<Tip>
Untuk melihat apa yang dapat Anda uji di mesin Anda (dan id `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke backend CLI (Claude, Codex, Gemini, atau CLI lokal lain)

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
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim attachment gambar nyata (path disuntikkan ke prompt). Resep Docker menonaktifkan ini secara default kecuali diminta secara eksplisit.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path file gambar sebagai argumen CLI alih-alih injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol bagaimana argumen gambar diteruskan saat `IMAGE_ARG` ditetapkan.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` untuk ikut serta dalam probe kontinuitas sesi yang sama Claude Sonnet -> Opus saat model yang dipilih mendukung target switch. Resep Docker menonaktifkan ini secara default demi keandalan agregat.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` untuk ikut serta dalam probe MCP/tool loopback. Resep Docker menonaktifkan ini secara default kecuali diminta secara eksplisit.

Contoh:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke konfigurasi MCP Gemini murah:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Ini tidak meminta Gemini menghasilkan respons. Ini menulis pengaturan sistem yang sama
yang diberikan OpenClaw kepada Gemini, lalu menjalankan `gemini --debug mcp list` untuk membuktikan bahwa server
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
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Catatan:

- Runner Docker berada di `scripts/test-live-cli-backend-docker.sh`.
- Runner ini menjalankan smoke backend CLI live di dalam image Docker repo sebagai pengguna non-root `node`.
- Runner ini menyelesaikan metadata smoke CLI dari ekstensi pemilik, lalu menginstal paket CLI Linux yang cocok (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) ke prefix tertulis yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth langganan Claude Code portabel melalui `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Ini terlebih dahulu membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran backend CLI Gateway tanpa mempertahankan env var kunci API Anthropic. Lane langganan ini menonaktifkan probe MCP/tool dan gambar Claude secara default karena Claude saat ini merutekan penggunaan aplikasi pihak ketiga melalui penagihan penggunaan ekstra alih-alih batas paket langganan normal.
- Smoke backend CLI live sekarang menjalankan alur end-to-end yang sama untuk Claude, Codex, dan Gemini: giliran teks, giliran klasifikasi gambar, lalu panggilan alat MCP `cron` yang diverifikasi melalui CLI gateway.
- Smoke default Claude juga menambal sesi dari Sonnet ke Opus dan memverifikasi bahwa sesi yang dilanjutkan masih mengingat catatan sebelumnya.

## Live: smoke bind ACP (`/acp spawn ... --bind here`)

- Uji: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur bind percakapan ACP nyata dengan agen ACP langsung:
  - kirim `/acp spawn <agent> --bind here`
  - bind percakapan kanal pesan sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi tindak lanjut masuk ke transkrip sesi ACP yang sudah di-bind
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Bawaan:
  - Agen ACP di Docker: `claude,codex,gemini`
  - Agen ACP untuk `pnpm test:live ...` langsung: `claude`
  - Kanal sintetis: konteks percakapan bergaya DM Slack
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
  - Lane ini menggunakan permukaan `chat.send` Gateway dengan field rute asal sintetis khusus admin agar pengujian dapat melampirkan konteks kanal pesan tanpa berpura-pura mengirim secara eksternal.
  - Saat `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak disetel, pengujian menggunakan registri agen bawaan Plugin `acpx` tertanam untuk agen harness ACP yang dipilih.
  - Pembuatan MCP Cron sesi yang sudah di-bind bersifat upaya terbaik secara bawaan karena harness ACP eksternal dapat membatalkan panggilan MCP setelah bukti bind/gambar lulus; setel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` untuk membuat probe Cron pasca-bind itu ketat.

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
- Secara bawaan, runner menjalankan smoke bind ACP terhadap agregat agen CLI langsung secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` untuk mempersempit matriks.
- Runner memuat `~/.profile`, menempatkan material autentikasi CLI yang sesuai ke dalam kontainer, lalu memasang CLI langsung yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid melalui `https://app.factory.ai/cli`, `@google/gemini-cli`, atau `opencode-ai`) jika belum ada. Backend ACP itu sendiri adalah paket `acpx/runtime` tertanam yang dibundel dari Plugin `acpx`.
- Varian Docker Droid menempatkan `~/.factory` untuk pengaturan, meneruskan `FACTORY_API_KEY`, dan mewajibkan kunci API tersebut karena autentikasi OAuth/keyring Factory lokal tidak portabel ke dalam kontainer. Varian ini menggunakan entri registri bawaan ACPX `droid exec --output-format acp`.
- Varian Docker OpenCode adalah lane regresi agen tunggal yang ketat. Varian ini menulis model bawaan sementara `OPENCODE_CONFIG_CONTENT` dari `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (bawaan `opencode/kimi-k2.6`) setelah memuat `~/.profile`, dan `pnpm test:docker:live-acp-bind:opencode` mewajibkan transkrip asisten yang sudah di-bind alih-alih menerima skip pasca-bind generik.
- Panggilan CLI `acpx` langsung hanya merupakan jalur manual/solusi sementara untuk membandingkan perilaku di luar Gateway. Smoke bind ACP Docker menguji backend runtime `acpx` tertanam milik OpenClaw.

## Langsung: smoke harness server aplikasi Codex

- Tujuan: memvalidasi harness Codex milik Plugin melalui metode Gateway
  `agent` normal:
  - muat Plugin `codex` yang dibundel
  - pilih `OPENCLAW_AGENT_RUNTIME=codex`
  - kirim giliran agen Gateway pertama ke `openai/gpt-5.5` dengan harness Codex dipaksa
  - kirim giliran kedua ke sesi OpenClaw yang sama dan verifikasi thread
    server aplikasi dapat dilanjutkan
  - jalankan `/codex status` dan `/codex models` melalui jalur perintah Gateway
    yang sama
  - secara opsional jalankan dua probe shell tereskalasi yang ditinjau Guardian:
    satu perintah aman yang seharusnya disetujui dan satu unggahan rahasia palsu
    yang seharusnya ditolak sehingga agen bertanya balik
- Uji: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model bawaan: `openai/gpt-5.5`
- Probe gambar opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian opsional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke ini menyetel `OPENCLAW_AGENT_HARNESS_FALLBACK=none` sehingga harness Codex
  yang rusak tidak dapat lulus dengan diam-diam fallback ke PI.
- Autentikasi: autentikasi server aplikasi Codex dari login langganan Codex lokal. Smoke
  Docker juga dapat menyediakan `OPENAI_API_KEY` untuk probe non-Codex jika berlaku,
  ditambah salinan opsional `~/.codex/auth.json` dan `~/.codex/config.toml`.

Resep lokal:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Resep Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-codex-harness-docker.sh`.
- Runner memuat `~/.profile` yang dipasang, meneruskan `OPENAI_API_KEY`, menyalin file
  autentikasi CLI Codex saat ada, memasang `@openai/codex` ke prefiks npm terpasang
  yang dapat ditulis, menempatkan pohon sumber, lalu hanya menjalankan pengujian langsung harness Codex.
- Docker mengaktifkan probe gambar, MCP/tool, dan Guardian secara bawaan. Setel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` saat Anda membutuhkan proses debug
  yang lebih sempit.
- Docker juga mengekspor `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, sesuai dengan konfigurasi
  pengujian langsung sehingga alias lama atau fallback PI tidak dapat menyembunyikan regresi
  harness Codex.

### Resep langsung yang direkomendasikan

Allowlist sempit dan eksplisit adalah yang tercepat dan paling tidak flaky:

- Model tunggal, langsung (tanpa Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Model tunggal, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan tool di beberapa penyedia:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus Google (kunci API Gemini + Antigravity):
  - Gemini (kunci API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptive thinking Google:
  - Jika kunci lokal berada di profil shell: `source ~/.profile`
  - Bawaan dinamis Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Anggaran dinamis Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Catatan:

- `google/...` menggunakan API Gemini (kunci API).
- `google-antigravity/...` menggunakan jembatan OAuth Antigravity (endpoint agen bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan CLI Gemini lokal di mesin Anda (autentikasi terpisah + keunikan tooling).
- API Gemini vs CLI Gemini:
  - API: OpenClaw memanggil API Gemini terhosting milik Google melalui HTTP (kunci API / autentikasi profil); inilah yang dimaksud sebagian besar pengguna dengan “Gemini”.
  - CLI: OpenClaw menjalankan biner `gemini` lokal melalui shell; biner ini memiliki autentikasi sendiri dan dapat berperilaku berbeda (dukungan streaming/tool/perbedaan versi).

## Langsung: matriks model (cakupan kita)

Tidak ada “daftar model CI” tetap (langsung bersifat opt-in), tetapi ini adalah model **yang direkomendasikan** untuk dicakup secara rutin di mesin pengembang dengan kunci.

### Set smoke modern (pemanggilan tool + gambar)

Ini adalah proses “model umum” yang kami harapkan tetap berfungsi:

- OpenAI (non-Codex): `openai/gpt-5.5`
- OAuth OpenAI Codex: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` dan `google/gemini-3-flash-preview` (hindari model Gemini 2.x yang lebih lama)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` dan `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` dan `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Jalankan smoke Gateway dengan tool + gambar:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: pemanggilan tool (Read + Exec opsional)

Pilih setidaknya satu per keluarga penyedia:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (atau `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Cakupan tambahan opsional (bagus jika ada):

- xAI: `xai/grok-4` (atau terbaru yang tersedia)
- Mistral: `mistral/`… (pilih satu model berkemampuan “tools” yang sudah Anda aktifkan)
- Cerebras: `cerebras/`… (jika Anda memiliki akses)
- LM Studio: `lmstudio/`… (lokal; pemanggilan tool bergantung pada mode API)

### Vision: pengiriman gambar (lampiran → pesan multimodal)

Sertakan setidaknya satu model berkemampuan gambar di `OPENCLAW_LIVE_GATEWAY_MODELS` (varian berkemampuan vision Claude/Gemini/OpenAI, dll.) untuk menguji probe gambar.

### Agregator / Gateway alternatif

Jika Anda mengaktifkan kunci, kami juga mendukung pengujian melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat berkemampuan tool+gambar)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (autentikasi melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Lebih banyak penyedia yang dapat Anda sertakan dalam matriks langsung (jika Anda memiliki kredensial/konfigurasi):

- Bawaan: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Melalui `models.providers` (endpoint kustom): `minimax` (cloud/API), ditambah proxy kompatibel OpenAI/Anthropic apa pun (LM Studio, vLLM, LiteLLM, dll.)

<Tip>
Jangan hardcode "all models" di dokumentasi. Daftar otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` di mesin Anda ditambah kunci apa pun yang tersedia.
</Tip>

## Kredensial (jangan pernah commit)

Pengujian langsung menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktis:

- Jika CLI berfungsi, pengujian live seharusnya menemukan kunci yang sama.
- Jika pengujian live mengatakan “no creds”, debug dengan cara yang sama seperti Anda men-debug pemilihan model `openclaw models list` / model.

- Profil autentikasi per agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah yang dimaksud dengan “profile keys” dalam pengujian live)
- Konfigurasi: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori status lama: `~/.openclaw/credentials/` (disalin ke home live bertahap jika ada, tetapi bukan penyimpanan utama kunci profil)
- Proses live lokal menyalin konfigurasi aktif, file `auth-profiles.json` per agen, `credentials/` lama, dan direktori autentikasi CLI eksternal yang didukung ke home pengujian sementara secara default; home live bertahap melewati `workspace/` dan `sandboxes/`, dan override jalur `agents.*.workspace` / `agentDir` dihapus agar probe tetap tidak menyentuh workspace host asli Anda.

Jika Anda ingin mengandalkan kunci env (misalnya diekspor di `~/.profile` Anda), jalankan pengujian lokal setelah `source ~/.profile`, atau gunakan runner Docker di bawah ini (runner tersebut dapat me-mount `~/.profile` ke dalam kontainer).

## Live Deepgram (transkripsi audio)

- Pengujian: `extensions/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live rencana coding BytePlus

- Pengujian: `extensions/byteplus/live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media alur kerja ComfyUI

- Pengujian: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Melatih jalur gambar, video, dan `music_generate` comfy bawaan
  - Melewati setiap kapabilitas kecuali `plugins.entries.comfy.config.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman alur kerja comfy, polling, unduhan, atau pendaftaran plugin

## Live pembuatan gambar

- Pengujian: `test/image-generation.runtime.live.test.ts`
- Perintah: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Mengenumerasi setiap plugin penyedia pembuatan gambar yang terdaftar
  - Memuat variabel env penyedia yang hilang dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Menggunakan kunci API live/env sebelum profil autentikasi tersimpan secara default, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Menjalankan setiap penyedia yang dikonfigurasi melalui runtime pembuatan gambar bersama:
    - `<provider>:generate`
    - `<provider>:edit` saat penyedia mendeklarasikan dukungan edit
- Penyedia bawaan saat ini yang dicakup:
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
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan override khusus env

Untuk jalur CLI yang dikirimkan, tambahkan smoke `infer` setelah pengujian live penyedia/runtime lulus:

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
plugin bawaan, perbaikan dependensi runtime bawaan sesuai permintaan, runtime
pembuatan gambar bersama, dan permintaan penyedia live.

## Live pembuatan musik

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Melatih jalur penyedia pembuatan musik bawaan bersama
  - Saat ini mencakup Google dan MiniMax
  - Memuat variabel env penyedia dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Menggunakan kunci API live/env sebelum profil autentikasi tersimpan secara default, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan saat tersedia:
    - `generate` dengan input hanya prompt
    - `edit` saat penyedia mendeklarasikan `capabilities.edit.enabled`
  - Cakupan lane bersama saat ini:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy terpisah, bukan sweep bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan override khusus env

## Live pembuatan video

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Melatih jalur penyedia pembuatan video bawaan bersama
  - Secara default memakai jalur smoke yang aman untuk rilis: penyedia non-FAL, satu permintaan teks-ke-video per penyedia, prompt lobster satu detik, dan batas operasi per penyedia dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default)
  - Melewati FAL secara default karena latensi antrean di sisi penyedia dapat mendominasi waktu rilis; teruskan `--video-providers fal` atau `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` untuk menjalankannya secara eksplisit
  - Memuat variabel env penyedia dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Menggunakan kunci API live/env sebelum profil autentikasi tersimpan secara default, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Hanya menjalankan `generate` secara default
  - Atur `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transform yang dideklarasikan saat tersedia:
    - `imageToVideo` saat penyedia mendeklarasikan `capabilities.imageToVideo.enabled` dan penyedia/model yang dipilih menerima input gambar lokal berbasis buffer dalam sweep bersama
    - `videoToVideo` saat penyedia mendeklarasikan `capabilities.videoToVideo.enabled` dan penyedia/model yang dipilih menerima input video lokal berbasis buffer dalam sweep bersama
  - Penyedia `imageToVideo` yang dideklarasikan tetapi dilewati saat ini dalam sweep bersama:
    - `vydra` karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar jarak jauh
  - Cakupan Vydra khusus penyedia:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - file tersebut menjalankan teks-ke-video `veo3` serta lane `kling` yang menggunakan fixture URL gambar jarak jauh secara default
  - Cakupan live `videoToVideo` saat ini:
    - `runway` hanya saat model yang dipilih adalah `runway/gen4_aleph`
  - Penyedia `videoToVideo` yang dideklarasikan tetapi dilewati saat ini dalam sweep bersama:
    - `alibaba`, `qwen`, `xai` karena jalur tersebut saat ini memerlukan URL referensi `http(s)` / MP4 jarak jauh
    - `google` karena lane Gemini/Veo bersama saat ini menggunakan input lokal berbasis buffer dan jalur tersebut tidak diterima dalam sweep bersama
    - `openai` karena lane bersama saat ini tidak memiliki jaminan akses inpaint/remix video khusus org
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap penyedia dalam sweep default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas operasi setiap penyedia untuk smoke run yang agresif
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan override khusus env

## Harness live media

- Perintah: `pnpm test:live:media`
- Tujuan:
  - Menjalankan suite live gambar, musik, dan video bersama melalui satu entrypoint native repo
  - Memuat otomatis variabel env penyedia yang hilang dari `~/.profile`
  - Menyempitkan otomatis setiap suite ke penyedia yang saat ini memiliki autentikasi yang dapat digunakan secara default
  - Menggunakan ulang `scripts/test-live.mjs`, sehingga perilaku Heartbeat dan mode senyap tetap konsisten
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Terkait

- [Pengujian](/id/help/testing) — suite unit, integrasi, QA, dan Docker
