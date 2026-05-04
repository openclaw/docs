---
read_when:
    - Menjalankan matriks model langsung / backend CLI / ACP / uji asap penyedia media
    - Men-debug resolusi kredensial pengujian langsung
    - Menambahkan pengujian langsung khusus penyedia baru
sidebarTitle: Live tests
summary: 'Pengujian live (menyentuh jaringan): matriks model, backend CLI, ACP, penyedia media, kredensial'
title: 'Pengujian: rangkaian uji langsung'
x-i18n:
    generated_at: "2026-05-04T18:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03b8ca6348137a55c8d5f67c9c166a130a75a744f6a433cb00496756b29d7016
    source_path: help/testing-live.md
    workflow: 16
---

Untuk mulai cepat, runner QA, suite unit/integrasi, dan alur Docker, lihat
[Pengujian](/id/help/testing). Halaman ini membahas suite pengujian **live** (menyentuh jaringan):
matriks model, backend CLI, ACP, dan pengujian live penyedia media, ditambah
penanganan kredensial.

## Live: perintah smoke profil lokal

Muat `~/.profile` sebelum pemeriksaan live ad hoc agar kunci penyedia dan path
alat lokal sesuai dengan shell Anda:

```bash
source ~/.profile
```

Smoke media yang aman:

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

`voicecall smoke` adalah dry run kecuali `--yes` juga disertakan. Gunakan `--yes` hanya
saat Anda memang ingin melakukan panggilan notifikasi sungguhan. Untuk Twilio, Telnyx, dan
Plivo, pemeriksaan kesiapan yang berhasil memerlukan URL webhook publik; fallback
loopback lokal saja/pribadi ditolak sesuai desain.

## Live: sweep kapabilitas node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: memanggil **setiap perintah yang saat ini diiklankan** oleh node Android yang terhubung dan memastikan perilaku kontrak perintah.
- Cakupan:
  - Penyiapan prasyarat/manual (suite tidak menginstal/menjalankan/memasangkan aplikasi).
  - Validasi `node.invoke` gateway per perintah untuk node Android yang dipilih.
- Prasyarat penyiapan yang diperlukan:
  - Aplikasi Android sudah terhubung + dipasangkan ke gateway.
  - Aplikasi tetap berada di latar depan.
  - Izin/persetujuan tangkapan diberikan untuk kapabilitas yang Anda harapkan lolos.
- Override target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail lengkap penyiapan Android: [Aplikasi Android](/id/platforms/android)

## Live: smoke model (kunci profil)

Pengujian live dibagi menjadi dua lapisan agar kita dapat mengisolasi kegagalan:

- “Model langsung” memberi tahu kita bahwa penyedia/model dapat menjawab sama sekali dengan kunci yang diberikan.
- “Smoke Gateway” memberi tahu kita bahwa pipeline gateway+agent penuh berfungsi untuk model tersebut (sesi, riwayat, alat, kebijakan sandbox, dll.).

### Lapisan 1: Penyelesaian model langsung (tanpa gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Menginventarisasi model yang ditemukan
  - Menggunakan `getApiKeyForModel` untuk memilih model yang kredensialnya Anda miliki
  - Menjalankan penyelesaian kecil per model (dan regresi tertarget bila diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Setel `OPENCLAW_LIVE_MODELS=modern` (atau `all`, alias untuk modern) untuk benar-benar menjalankan suite ini; jika tidak, suite akan dilewati agar `pnpm test:live` tetap berfokus pada smoke gateway
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` untuk menjalankan allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk allowlist modern
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist koma)
  - Sweep modern/all secara default memakai batas terkurasi dengan sinyal tinggi; setel `OPENCLAW_LIVE_MAX_MODELS=0` untuk sweep modern menyeluruh atau angka positif untuk batas yang lebih kecil.
  - Sweep menyeluruh menggunakan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` untuk timeout seluruh pengujian model langsung. Default: 60 menit.
  - Probe model langsung berjalan dengan paralelisme 20 arah secara default; setel `OPENCLAW_LIVE_MODEL_CONCURRENCY` untuk melakukan override.
- Cara memilih penyedia:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist koma)
- Dari mana kunci berasal:
  - Secara default: penyimpanan profil dan fallback env
  - Setel `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memberlakukan **penyimpanan profil** saja
- Alasan ini ada:
  - Memisahkan “API penyedia rusak / kunci tidak valid” dari “pipeline agent gateway rusak”
  - Berisi regresi kecil yang terisolasi (contoh: alur replay reasoning OpenAI Responses/Codex Responses + tool-call)

### Lapisan 2: Smoke Gateway + agent dev (yang sebenarnya dilakukan oleh "@openclaw")

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Menjalankan gateway dalam proses
  - Membuat/menambal sesi `agent:dev:*` (override model per run)
  - Mengiterasi model-dengan-kunci dan memastikan:
    - respons “bermakna” (tanpa alat)
    - pemanggilan alat nyata berfungsi (probe baca)
    - probe alat ekstra opsional (probe exec+baca)
    - jalur regresi OpenAI (hanya tool-call → tindak lanjut) tetap berfungsi
- Detail probe (agar Anda dapat menjelaskan kegagalan dengan cepat):
  - Probe `read`: pengujian menulis file nonce di workspace dan meminta agent untuk `read` file itu lalu menggemakan nonce kembali.
  - Probe `exec+read`: pengujian meminta agent untuk menulis nonce dengan `exec` ke file temp, lalu `read` kembali.
  - Probe gambar: pengujian melampirkan PNG yang dihasilkan (cat + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `src/gateway/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Cara memilih model:
  - Default: allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk allowlist modern
  - Atau setel `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar koma) untuk mempersempit
  - Sweep gateway modern/all secara default memakai batas terkurasi dengan sinyal tinggi; setel `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk sweep modern menyeluruh atau angka positif untuk batas yang lebih kecil.
- Cara memilih penyedia (hindari “semua OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist koma)
- Probe alat + gambar selalu aktif dalam pengujian live ini:
  - Probe `read` + probe `exec+read` (stres alat)
  - Probe gambar berjalan saat model mengiklankan dukungan input gambar
  - Alur (tingkat tinggi):
    - Pengujian menghasilkan PNG kecil dengan “CAT” + kode acak (`src/gateway/live-image-probe.ts`)
    - Mengirimnya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mengurai lampiran menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agent tertanam meneruskan pesan pengguna multimodal ke model
    - Asersi: balasan berisi `cat` + kode (toleransi OCR: kesalahan kecil diperbolehkan)

<Tip>
Untuk melihat apa yang dapat Anda uji di mesin Anda (dan id `provider/model` persisnya), jalankan:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke backend CLI (Claude, Codex, Gemini, atau CLI lokal lain)

- Pengujian: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: memvalidasi pipeline Gateway + agent menggunakan backend CLI lokal, tanpa menyentuh konfigurasi default Anda.
- Default smoke khusus backend berada bersama definisi `cli-backend.ts` milik extension pemilik.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Penyedia/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku perintah/argumen/gambar berasal dari metadata plugin backend CLI pemilik.
- Override (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran gambar nyata (path disuntikkan ke prompt). Resep Docker menonaktifkan ini secara default kecuali diminta secara eksplisit.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path file gambar sebagai argumen CLI alih-alih injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol cara argumen gambar diteruskan saat `IMAGE_ARG` disetel.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` untuk ikut serta dalam probe kontinuitas sesi yang sama Claude Sonnet -> Opus saat model yang dipilih mendukung target switch. Resep Docker menonaktifkan ini secara default demi keandalan agregat.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` untuk ikut serta dalam probe loopback MCP/alat. Resep Docker menonaktifkan ini secara default kecuali diminta secara eksplisit.

Contoh:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke konfigurasi MCP Gemini yang murah:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Ini tidak meminta Gemini untuk menghasilkan respons. Ini menulis pengaturan sistem yang sama
yang diberikan OpenClaw kepada Gemini, lalu menjalankan `gemini --debug mcp list` untuk membuktikan bahwa server
`transport: "streamable-http"` yang tersimpan dinormalisasi ke bentuk MCP HTTP milik Gemini
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
- Runner menjalankan smoke backend CLI live di dalam image Docker repo sebagai pengguna non-root `node`.
- Runner menyelesaikan metadata smoke CLI dari extension pemilik, lalu menginstal paket CLI Linux yang sesuai (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) ke prefix tulis yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth langganan Claude Code portabel melalui `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Ini pertama-tama membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran backend CLI Gateway tanpa mempertahankan env vars kunci API Anthropic. Lane langganan ini menonaktifkan probe MCP/alat dan gambar Claude secara default karena Claude saat ini merutekan penggunaan aplikasi pihak ketiga melalui penagihan penggunaan ekstra, bukan batas paket langganan normal.
- Smoke backend CLI live kini menjalankan alur end-to-end yang sama untuk Claude, Codex, dan Gemini: giliran teks, giliran klasifikasi gambar, lalu panggilan alat MCP `cron` yang diverifikasi melalui CLI gateway.
- Smoke default Claude juga menambal sesi dari Sonnet ke Opus dan memverifikasi bahwa sesi yang dilanjutkan masih mengingat catatan sebelumnya.

## Live: keterjangkauan proxy HTTP/2 APNs

- Pengujian: `src/infra/push-apns-http2.live.test.ts`
- Tujuan: melakukan tunnel melalui proxy HTTP CONNECT lokal ke endpoint APNs sandbox Apple, mengirim permintaan validasi HTTP/2 APNs, dan memastikan respons nyata `403 InvalidProviderToken` dari Apple kembali melalui jalur proxy.
- Aktifkan:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Timeout opsional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: smoke bind ACP (`/acp spawn ... --bind here`)

- Pengujian: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur conversation-bind ACP nyata dengan agen ACP live:
  - kirim `/acp spawn <agent> --bind here`
  - bind percakapan kanal pesan sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi tindak lanjut masuk ke transkrip sesi ACP yang telah di-bind
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Default:
  - Agen ACP di Docker: `claude,codex,gemini`
  - Agen ACP untuk `pnpm test:live ...` langsung: `claude`
  - Kanal sintetis: konteks percakapan bergaya Slack DM
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
  - Lane ini menggunakan surface Gateway `chat.send` dengan field originating-route sintetis khusus admin agar pengujian dapat melampirkan konteks kanal pesan tanpa berpura-pura mengirim secara eksternal.
  - Saat `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak disetel, pengujian menggunakan registry agen bawaan Plugin `acpx` tersemat untuk agen harness ACP yang dipilih.
  - Pembuatan MCP Cron sesi ter-bind bersifat upaya terbaik secara default karena harness ACP eksternal dapat membatalkan panggilan MCP setelah bukti bind/gambar lulus; setel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` untuk membuat probe Cron pasca-bind itu ketat.

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
- Secara default, runner menjalankan smoke ACP bind terhadap agen CLI live agregat secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` untuk mempersempit matriks.
- Runner memuat `~/.profile`, men-stage material auth CLI yang sesuai ke dalam container, lalu menginstal CLI live yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid melalui `https://app.factory.ai/cli`, `@google/gemini-cli`, atau `opencode-ai`) jika belum ada. Backend ACP sendiri adalah paket `acpx/runtime` tersemat dari Plugin `acpx` resmi.
- Varian Docker Droid men-stage `~/.factory` untuk pengaturan, meneruskan `FACTORY_API_KEY`, dan memerlukan kunci API tersebut karena auth OAuth/keyring Factory lokal tidak portabel ke dalam container. Varian ini menggunakan entri registry bawaan ACPX `droid exec --output-format acp`.
- Varian Docker OpenCode adalah lane regresi agen tunggal yang ketat. Varian ini menulis model default sementara `OPENCODE_CONFIG_CONTENT` dari `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (default `opencode/kimi-k2.6`) setelah memuat `~/.profile`, dan `pnpm test:docker:live-acp-bind:opencode` memerlukan transkrip asisten ter-bind alih-alih menerima skip pasca-bind generik.
- Panggilan CLI `acpx` langsung hanya merupakan jalur manual/solusi sementara untuk membandingkan perilaku di luar Gateway. Smoke ACP bind Docker menguji backend runtime `acpx` tersemat OpenClaw.

## Live: smoke harness app-server Codex

- Tujuan: memvalidasi harness Codex milik Plugin melalui metode Gateway
  `agent` normal:
  - muat Plugin `codex` yang dibundel
  - pilih `OPENCLAW_AGENT_RUNTIME=codex`
  - kirim giliran agen Gateway pertama ke `openai/gpt-5.5` dengan harness Codex dipaksa
  - kirim giliran kedua ke sesi OpenClaw yang sama dan verifikasi thread app-server
    dapat dilanjutkan
  - jalankan `/codex status` dan `/codex models` melalui jalur perintah Gateway
    yang sama
  - secara opsional jalankan dua probe shell terekskalasi yang ditinjau Guardian: satu
    perintah aman yang seharusnya disetujui dan satu unggahan rahasia palsu yang seharusnya
    ditolak sehingga agen bertanya kembali
- Pengujian: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model default: `openai/gpt-5.5`
- Probe gambar opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/alat opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian opsional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke menggunakan `agentRuntime.id: "codex"` sehingga harness Codex yang rusak tidak dapat
  lulus dengan diam-diam fallback ke PI.
- Auth: auth app-server Codex dari login langganan Codex lokal. Smoke Docker
  juga dapat menyediakan `OPENAI_API_KEY` untuk probe non-Codex bila berlaku,
  plus salinan opsional `~/.codex/auth.json` dan `~/.codex/config.toml`.

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
- Runner memuat `~/.profile` yang di-mount, meneruskan `OPENAI_API_KEY`, menyalin file auth CLI Codex
  saat ada, menginstal `@openai/codex` ke prefix npm ter-mount yang dapat ditulis,
  men-stage pohon sumber, lalu hanya menjalankan pengujian live harness Codex.
- Docker mengaktifkan probe gambar, MCP/alat, dan Guardian secara default. Setel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` saat Anda memerlukan run debug
  yang lebih sempit.
- Docker menggunakan konfigurasi runtime Codex eksplisit yang sama, sehingga alias lama atau fallback PI
  tidak dapat menyembunyikan regresi harness Codex.

### Resep live yang direkomendasikan

Allowlist yang sempit dan eksplisit adalah yang tercepat dan paling tidak flakey:

- Model tunggal, langsung (tanpa Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Model tunggal, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan alat lintas beberapa penyedia:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus Google (kunci API Gemini + Antigravity):
  - Gemini (kunci API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptive thinking Google:
  - Jika kunci lokal berada di profil shell: `source ~/.profile`
  - Default dinamis Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Anggaran dinamis Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Catatan:

- `google/...` menggunakan API Gemini (kunci API).
- `google-antigravity/...` menggunakan bridge OAuth Antigravity (endpoint agen bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan CLI Gemini lokal di mesin Anda (auth terpisah + kekhasan tooling).
- API Gemini vs CLI Gemini:
  - API: OpenClaw memanggil API Gemini ter-host Google melalui HTTP (kunci API / auth profil); inilah yang dimaksud sebagian besar pengguna dengan “Gemini”.
  - CLI: OpenClaw menjalankan binary `gemini` lokal melalui shell; CLI ini memiliki auth sendiri dan dapat berperilaku berbeda (streaming/dukungan alat/perbedaan versi).

## Live: matriks model (yang kami cakup)

Tidak ada “daftar model CI” tetap (live bersifat opt-in), tetapi berikut adalah model **yang direkomendasikan** untuk dicakup secara berkala di mesin dev dengan kunci.

### Set smoke modern (pemanggilan alat + gambar)

Ini adalah run “model umum” yang kami harapkan tetap berfungsi:

- OpenAI (non-Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` dan `google/gemini-3-flash-preview` (hindari model Gemini 2.x yang lebih lama)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` dan `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` dan `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Jalankan smoke Gateway dengan alat + gambar:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: pemanggilan alat (Read + Exec opsional)

Pilih setidaknya satu per keluarga penyedia:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (atau `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Cakupan tambahan opsional (baik untuk dimiliki):

- xAI: `xai/grok-4.3` (atau yang terbaru tersedia)
- Mistral: `mistral/`… (pilih satu model berkemampuan “tools” yang telah Anda aktifkan)
- Cerebras: `cerebras/`… (jika Anda memiliki akses)
- LM Studio: `lmstudio/`… (lokal; pemanggilan alat bergantung pada mode API)

### Vision: kirim gambar (lampiran → pesan multimodal)

Sertakan setidaknya satu model berkemampuan gambar di `OPENCLAW_LIVE_GATEWAY_MODELS` (varian Claude/Gemini/OpenAI berkemampuan vision, dll.) untuk menguji probe gambar.

### Agregator / Gateway alternatif

Jika Anda memiliki kunci yang diaktifkan, kami juga mendukung pengujian melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat yang mampu alat+gambar)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (auth melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Lebih banyak penyedia yang dapat Anda sertakan dalam matriks live (jika Anda memiliki kredensial/konfigurasi):

- Bawaan: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Melalui `models.providers` (endpoint khusus): `minimax` (cloud/API), plus proxy kompatibel OpenAI/Anthropic apa pun (LM Studio, vLLM, LiteLLM, dll.)

<Tip>
Jangan hardcode "all models" di dokumen. Daftar otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` di mesin Anda plus kunci apa pun yang tersedia.
</Tip>

## Kredensial (jangan pernah commit)

Pengujian live menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktis:

- Jika CLI berfungsi, pengujian live seharusnya menemukan kunci yang sama.
- Jika pengujian live mengatakan “no creds”, debug dengan cara yang sama seperti Anda men-debug `openclaw models list` / pemilihan model.

- Profil autentikasi per agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah yang dimaksud “profile keys” dalam pengujian live)
- Konfigurasi: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori status lama: `~/.openclaw/credentials/` (disalin ke home live bertahap saat ada, tetapi bukan penyimpanan utama profile-key)
- Eksekusi live lokal secara default menyalin konfigurasi aktif, file `auth-profiles.json` per agen, `credentials/` lama, dan direktori autentikasi CLI eksternal yang didukung ke home pengujian sementara; home live bertahap melewati `workspace/` dan `sandboxes/`, dan penggantian jalur `agents.*.workspace` / `agentDir` dihapus agar probe tetap tidak menyentuh workspace host asli Anda.

Jika Anda ingin mengandalkan kunci env (misalnya diekspor di `~/.profile` Anda), jalankan pengujian lokal setelah `source ~/.profile`, atau gunakan runner Docker di bawah ini (runner tersebut dapat memasang `~/.profile` ke dalam container).

## Live Deepgram (transkripsi audio)

- Pengujian: `extensions/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live rencana coding BytePlus

- Pengujian: `extensions/byteplus/live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Penggantian model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media workflow ComfyUI

- Pengujian: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menguji jalur gambar, video, dan `music_generate` comfy bawaan
  - Melewati setiap kapabilitas kecuali `plugins.entries.comfy.config.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman workflow comfy, polling, unduhan, atau pendaftaran plugin

## Live pembuatan gambar

- Pengujian: `test/image-generation.runtime.live.test.ts`
- Perintah: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Menginventarisasi setiap plugin penyedia pembuatan gambar yang terdaftar
  - Memuat env var penyedia yang hilang dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Secara default menggunakan kunci API live/env sebelum profil autentikasi tersimpan, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell asli
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan penggantian khusus env

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

Ini mencakup parsing argumen CLI, resolusi konfigurasi/default-agent, aktivasi
plugin bawaan, runtime pembuatan gambar bersama, dan permintaan penyedia live.
Dependensi plugin diharapkan sudah ada sebelum pemuatan runtime.

## Live pembuatan musik

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menguji jalur penyedia pembuatan musik bawaan bersama
  - Saat ini mencakup Google dan MiniMax
  - Memuat env var penyedia dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Secara default menggunakan kunci API live/env sebelum profil autentikasi tersimpan, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell asli
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan saat tersedia:
    - `generate` dengan input prompt saja
    - `edit` saat penyedia mendeklarasikan `capabilities.edit.enabled`
  - Cakupan lane bersama saat ini:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy terpisah, bukan sweep bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan penggantian khusus env

## Live pembuatan video

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menguji jalur penyedia pembuatan video bawaan bersama
  - Secara default menggunakan jalur smoke yang aman untuk rilis: penyedia non-FAL, satu permintaan text-to-video per penyedia, prompt lobster satu detik, dan batas operasi per penyedia dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default)
  - Secara default melewati FAL karena latensi antrean sisi penyedia dapat mendominasi waktu rilis; berikan `--video-providers fal` atau `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` untuk menjalankannya secara eksplisit
  - Memuat env var penyedia dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Secara default menggunakan kunci API live/env sebelum profil autentikasi tersimpan, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell asli
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Secara default hanya menjalankan `generate`
  - Tetapkan `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transform yang dideklarasikan saat tersedia:
    - `imageToVideo` saat penyedia mendeklarasikan `capabilities.imageToVideo.enabled` dan penyedia/model yang dipilih menerima input gambar lokal berbasis buffer dalam sweep bersama
    - `videoToVideo` saat penyedia mendeklarasikan `capabilities.videoToVideo.enabled` dan penyedia/model yang dipilih menerima input video lokal berbasis buffer dalam sweep bersama
  - Penyedia `imageToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sweep bersama:
    - `vydra` karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar jarak jauh
  - Cakupan Vydra spesifik penyedia:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - file tersebut menjalankan text-to-video `veo3` ditambah lane `kling` yang secara default menggunakan fixture URL gambar jarak jauh
  - Cakupan live `videoToVideo` saat ini:
    - `runway` hanya saat model yang dipilih adalah `runway/gen4_aleph`
  - Penyedia `videoToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sweep bersama:
    - `alibaba`, `qwen`, `xai` karena jalur tersebut saat ini memerlukan URL referensi `http(s)` / MP4 jarak jauh
    - `google` karena lane Gemini/Veo bersama saat ini menggunakan input lokal berbasis buffer dan jalur itu tidak diterima dalam sweep bersama
    - `openai` karena lane bersama saat ini tidak memiliki jaminan akses inpaint/remix video khusus org
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap penyedia dalam sweep default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas setiap operasi penyedia bagi eksekusi smoke yang agresif
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan penggantian khusus env

## Harness live media

- Perintah: `pnpm test:live:media`
- Tujuan:
  - Menjalankan suite live gambar, musik, dan video bersama melalui satu entrypoint native repo
  - Memuat otomatis env var penyedia yang hilang dari `~/.profile`
  - Secara default mempersempit otomatis setiap suite ke penyedia yang saat ini memiliki autentikasi yang dapat digunakan
  - Menggunakan ulang `scripts/test-live.mjs`, sehingga perilaku heartbeat dan mode senyap tetap konsisten
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Terkait

- [Pengujian](/id/help/testing) — suite unit, integrasi, QA, dan Docker
