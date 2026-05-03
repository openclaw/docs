---
read_when:
    - Menjalankan matriks model langsung / backend CLI / ACP / uji smoke penyedia media
    - Men-debug resolusi kredensial pengujian langsung
    - Menambahkan pengujian langsung baru yang khusus untuk penyedia
sidebarTitle: Live tests
summary: 'Pengujian langsung (yang menyentuh jaringan): matriks model, backend CLI, ACP, penyedia media, kredensial'
title: 'Pengujian: rangkaian pengujian langsung'
x-i18n:
    generated_at: "2026-05-03T09:17:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4057d8875fa3404108e89e4381c1dd14e96abbc2af13c4934fc6c0dbf878fc00
    source_path: help/testing-live.md
    workflow: 16
---

Untuk mulai cepat, runner QA, rangkaian unit/integrasi, dan alur Docker, lihat
[Pengujian](/id/help/testing). Halaman ini membahas rangkaian pengujian **langsung** (menyentuh jaringan):
matriks model, backend CLI, ACP, dan pengujian langsung penyedia media, plus
penanganan kredensial.

## Langsung: perintah pemeriksaan awal profil lokal

Source `~/.profile` sebelum pemeriksaan langsung ad hoc agar kunci penyedia dan path alat lokal
sesuai dengan shell Anda:

```bash
source ~/.profile
```

Pemeriksaan awal media yang aman:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Pemeriksaan awal kesiapan panggilan suara yang aman:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` adalah dry run kecuali `--yes` juga ada. Gunakan `--yes` hanya
ketika Anda sengaja ingin melakukan panggilan notifikasi nyata. Untuk Twilio, Telnyx, dan
Plivo, pemeriksaan kesiapan yang berhasil memerlukan URL webhook publik; fallback
loopback/pribadi yang hanya lokal ditolak sesuai desain.

## Langsung: penyapuan kapabilitas node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: memanggil **setiap perintah yang saat ini diiklankan** oleh node Android yang terhubung dan memeriksa perilaku kontrak perintah.
- Cakupan:
  - Penyiapan manual/berprasyarat (rangkaian ini tidak menginstal/menjalankan/menyandingkan aplikasi).
  - Validasi Gateway `node.invoke` per perintah untuk node Android yang dipilih.
- Prapenyiapan yang diperlukan:
  - Aplikasi Android sudah terhubung + disandingkan ke gateway.
  - Aplikasi tetap berada di foreground.
  - Izin/persetujuan capture diberikan untuk kapabilitas yang Anda harapkan lulus.
- Override target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail penyiapan Android lengkap: [Aplikasi Android](/id/platforms/android)

## Langsung: pemeriksaan awal model (kunci profil)

Pengujian langsung dibagi menjadi dua lapisan agar kami dapat mengisolasi kegagalan:

- “Model langsung” memberi tahu kami bahwa penyedia/model dapat menjawab sama sekali dengan kunci yang diberikan.
- “Pemeriksaan awal Gateway” memberi tahu kami bahwa seluruh pipeline gateway+agent berfungsi untuk model tersebut (sesi, riwayat, alat, kebijakan sandbox, dll.).

### Lapisan 1: Penyelesaian model langsung (tanpa gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Menginventarisasi model yang ditemukan
  - Menggunakan `getApiKeyForModel` untuk memilih model yang kredensialnya Anda miliki
  - Menjalankan penyelesaian kecil per model (dan regresi tertarget bila diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Atur `OPENCLAW_LIVE_MODELS=modern` (atau `all`, alias untuk modern) untuk benar-benar menjalankan rangkaian ini; jika tidak, rangkaian akan dilewati agar `pnpm test:live` tetap berfokus pada pemeriksaan awal gateway
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` untuk menjalankan allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk allowlist modern
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist koma)
  - Penyapuan modern/all default menggunakan batas kurasi bersinyal tinggi; atur `OPENCLAW_LIVE_MAX_MODELS=0` untuk penyapuan modern menyeluruh atau angka positif untuk batas yang lebih kecil.
  - Penyapuan menyeluruh menggunakan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` untuk timeout seluruh pengujian model langsung. Default: 60 menit.
  - Probe model langsung berjalan dengan paralelisme 20-arah secara default; atur `OPENCLAW_LIVE_MODEL_CONCURRENCY` untuk override.
- Cara memilih penyedia:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist koma)
- Dari mana kunci berasal:
  - Secara default: penyimpanan profil dan fallback env
  - Atur `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memberlakukan **penyimpanan profil** saja
- Mengapa ini ada:
  - Memisahkan “API penyedia rusak / kunci tidak valid” dari “pipeline agent gateway rusak”
  - Berisi regresi kecil yang terisolasi (contoh: replay reasoning OpenAI Responses/Codex Responses + alur tool-call)

### Lapisan 2: Pemeriksaan awal Gateway + agent dev (apa yang sebenarnya dilakukan "@openclaw")

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Menjalankan gateway dalam proses
  - Membuat/menambal sesi `agent:dev:*` (override model per run)
  - Mengiterasi model-dengan-kunci dan memeriksa:
    - respons “bermakna” (tanpa alat)
    - pemanggilan alat nyata berfungsi (probe baca)
    - probe alat tambahan opsional (probe exec+baca)
    - path regresi OpenAI (hanya-tool-call → tindak lanjut) tetap berfungsi
- Detail probe (agar Anda dapat menjelaskan kegagalan dengan cepat):
  - Probe `read`: pengujian menulis file nonce di workspace dan meminta agent untuk `read` file itu lalu menggemakan nonce kembali.
  - Probe `exec+read`: pengujian meminta agent untuk menulis nonce dengan `exec` ke file temp, lalu `read` kembali.
  - Probe gambar: pengujian melampirkan PNG yang dibuat (cat + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `src/gateway/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Cara memilih model:
  - Default: allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk allowlist modern
  - Atau atur `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar koma) untuk mempersempit
  - Penyapuan gateway modern/all default menggunakan batas kurasi bersinyal tinggi; atur `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk penyapuan modern menyeluruh atau angka positif untuk batas yang lebih kecil.
- Cara memilih penyedia (hindari “semua OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist koma)
- Probe alat + gambar selalu aktif dalam pengujian langsung ini:
  - Probe `read` + probe `exec+read` (stres alat)
  - Probe gambar berjalan ketika model mengiklankan dukungan input gambar
  - Alur (tingkat tinggi):
    - Pengujian membuat PNG kecil dengan “CAT” + kode acak (`src/gateway/live-image-probe.ts`)
    - Mengirimkannya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mem-parse lampiran menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agent tertanam meneruskan pesan pengguna multimodal ke model
    - Asersi: balasan berisi `cat` + kode tersebut (toleransi OCR: kesalahan kecil diizinkan)

<Tip>
Untuk melihat apa yang dapat Anda uji di mesin Anda (dan id `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Langsung: pemeriksaan awal backend CLI (Claude, Codex, Gemini, atau CLI lokal lain)

- Pengujian: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: memvalidasi pipeline Gateway + agent menggunakan backend CLI lokal, tanpa menyentuh konfigurasi default Anda.
- Default pemeriksaan awal khusus backend berada bersama definisi `cli-backend.ts` milik Plugin pemilik.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Penyedia/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku perintah/args/gambar berasal dari metadata Plugin backend CLI pemilik.
- Override (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran gambar nyata (path diinjeksi ke prompt). Resep Docker default menonaktifkan ini kecuali diminta secara eksplisit.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path file gambar sebagai arg CLI, bukan injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol bagaimana arg gambar diteruskan ketika `IMAGE_ARG` diatur.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` untuk ikut serta dalam probe kontinuitas sesi yang sama Claude Sonnet -> Opus ketika model yang dipilih mendukung target switch. Resep Docker default menonaktifkan ini demi reliabilitas agregat.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` untuk ikut serta dalam probe loopback MCP/alat. Resep Docker default menonaktifkan ini kecuali diminta secara eksplisit.

Contoh:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Pemeriksaan awal konfigurasi MCP Gemini yang murah:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Ini tidak meminta Gemini menghasilkan respons. Ini menulis pengaturan sistem yang sama
yang diberikan OpenClaw kepada Gemini, lalu menjalankan `gemini --debug mcp list` untuk membuktikan
server `transport: "streamable-http"` yang tersimpan dinormalisasi ke bentuk HTTP MCP
Gemini dan dapat terhubung ke server MCP streamable-HTTP lokal.

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
- Runner ini menjalankan pemeriksaan awal CLI-backend langsung di dalam image Docker repo sebagai pengguna `node` non-root.
- Runner ini menyelesaikan metadata pemeriksaan awal CLI dari Plugin pemilik, lalu menginstal paket CLI Linux yang cocok (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) ke prefix dapat ditulis yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth langganan Claude Code portabel melalui `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Ini pertama-tama membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran backend CLI Gateway tanpa mempertahankan variabel env kunci API Anthropic. Lane langganan ini menonaktifkan probe MCP/alat dan gambar Claude secara default karena Claude saat ini merutekan penggunaan aplikasi pihak ketiga melalui penagihan penggunaan ekstra, bukan batas paket langganan normal.
- Pemeriksaan awal CLI-backend langsung sekarang menjalankan alur end-to-end yang sama untuk Claude, Codex, dan Gemini: giliran teks, giliran klasifikasi gambar, lalu pemanggilan alat MCP `cron` yang diverifikasi melalui CLI gateway.
- Pemeriksaan awal default Claude juga menambal sesi dari Sonnet ke Opus dan memverifikasi sesi yang dilanjutkan masih mengingat catatan sebelumnya.

## Langsung: pemeriksaan awal bind ACP (`/acp spawn ... --bind here`)

- Pengujian: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur conversation-bind ACP nyata dengan agen ACP langsung:
  - kirim `/acp spawn <agent> --bind here`
  - ikat percakapan message-channel sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi tindak lanjut masuk ke transkrip sesi ACP terikat
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Bawaan:
  - Agen ACP di Docker: `claude,codex,gemini`
  - Agen ACP untuk `pnpm test:live ...` langsung: `claude`
  - Channel sintetis: konteks percakapan bergaya Slack DM
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
  - Lane ini menggunakan surface `chat.send` Gateway dengan field originating-route sintetis khusus admin sehingga pengujian dapat melampirkan konteks message-channel tanpa berpura-pura mengirim secara eksternal.
  - Ketika `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak disetel, pengujian menggunakan registri agen bawaan Plugin `acpx` tertanam untuk agen harness ACP yang dipilih.
  - Pembuatan MCP cron sesi terikat bersifat upaya terbaik secara bawaan karena harness ACP eksternal dapat membatalkan panggilan MCP setelah bukti bind/image lulus; setel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` untuk membuat probe cron pasca-bind tersebut ketat.

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
- Secara bawaan, runner menjalankan smoke bind ACP terhadap agen CLI langsung agregat secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` untuk mempersempit matriks.
- Runner memuat `~/.profile`, menyiapkan material auth CLI yang sesuai ke dalam kontainer, lalu menginstal CLI langsung yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid melalui `https://app.factory.ai/cli`, `@google/gemini-cli`, atau `opencode-ai`) jika belum ada. Backend ACP itu sendiri adalah paket `acpx/runtime` tertanam dari Plugin resmi `acpx`.
- Varian Docker Droid menyiapkan `~/.factory` untuk pengaturan, meneruskan `FACTORY_API_KEY`, dan memerlukan API key tersebut karena auth OAuth/keyring Factory lokal tidak portabel ke dalam kontainer. Varian ini menggunakan entri registri bawaan ACPX `droid exec --output-format acp`.
- Varian Docker OpenCode adalah lane regresi agen tunggal yang ketat. Varian ini menulis model bawaan sementara `OPENCODE_CONFIG_CONTENT` dari `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (bawaan `opencode/kimi-k2.6`) setelah memuat `~/.profile`, dan `pnpm test:docker:live-acp-bind:opencode` memerlukan transkrip asisten terikat alih-alih menerima skip pasca-bind generik.
- Panggilan CLI `acpx` langsung hanya merupakan jalur manual/solusi sementara untuk membandingkan perilaku di luar Gateway. Smoke bind ACP Docker menguji backend runtime `acpx` tertanam milik OpenClaw.

## Langsung: smoke harness app-server Codex

- Tujuan: memvalidasi harness Codex milik Plugin melalui metode Gateway
  `agent` normal:
  - muat Plugin `codex` bawaan
  - pilih `OPENCLAW_AGENT_RUNTIME=codex`
  - kirim giliran agen Gateway pertama ke `openai/gpt-5.5` dengan harness Codex dipaksa
  - kirim giliran kedua ke sesi OpenClaw yang sama dan verifikasi thread app-server
    dapat dilanjutkan
  - jalankan `/codex status` dan `/codex models` melalui jalur perintah Gateway
    yang sama
  - secara opsional jalankan dua probe shell terekskalasi yang ditinjau Guardian: satu
    perintah aman yang seharusnya disetujui dan satu unggahan fake-secret yang seharusnya
    ditolak sehingga agen bertanya balik
- Pengujian: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model bawaan: `openai/gpt-5.5`
- Probe image opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian opsional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke menggunakan `agentRuntime.id: "codex"` sehingga harness Codex yang rusak tidak dapat
  lolos dengan diam-diam fallback ke PI.
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
- Runner memuat `~/.profile` yang dipasang, meneruskan `OPENAI_API_KEY`, menyalin file
  auth CLI Codex bila ada, menginstal `@openai/codex` ke prefiks npm terpasang yang
  dapat ditulis, menyiapkan source tree, lalu hanya menjalankan pengujian langsung harness Codex.
- Docker mengaktifkan probe image, MCP/tool, dan Guardian secara bawaan. Setel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ketika Anda membutuhkan run debug
  yang lebih sempit.
- Docker menggunakan konfigurasi runtime Codex eksplisit yang sama, sehingga alias lama atau fallback PI
  tidak dapat menyembunyikan regresi harness Codex.

### Resep langsung yang direkomendasikan

Allowlist yang sempit dan eksplisit adalah yang tercepat dan paling tidak flakey:

- Model tunggal, langsung (tanpa Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Model tunggal, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan tool di beberapa provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus Google (API key Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptive thinking Google:
  - Jika key lokal berada di profil shell: `source ~/.profile`
  - Bawaan dinamis Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Anggaran dinamis Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Catatan:

- `google/...` menggunakan API Gemini (API key).
- `google-antigravity/...` menggunakan bridge OAuth Antigravity (endpoint agen bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan CLI Gemini lokal di mesin Anda (auth terpisah + keunikan tooling).
- API Gemini vs CLI Gemini:
  - API: OpenClaw memanggil API Gemini terhosting milik Google melalui HTTP (API key / auth profil); inilah yang dimaksud sebagian besar pengguna dengan “Gemini”.
  - CLI: OpenClaw menjalankan binary `gemini` lokal melalui shell; ia memiliki auth sendiri dan dapat berperilaku berbeda (dukungan streaming/tool/perbedaan versi).

## Langsung: matriks model (yang kami cakup)

Tidak ada “daftar model CI” tetap (langsung bersifat opt-in), tetapi ini adalah model **yang direkomendasikan** untuk dicakup secara rutin di mesin pengembang dengan key.

### Set smoke modern (pemanggilan tool + image)

Ini adalah run “model umum” yang kami harapkan tetap berfungsi:

- OpenAI (non-Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` dan `google/gemini-3-flash-preview` (hindari model Gemini 2.x yang lebih lama)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` dan `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` dan `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Jalankan smoke Gateway dengan tool + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: pemanggilan tool (Read + Exec opsional)

Pilih setidaknya satu per keluarga provider:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (atau `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Cakupan tambahan opsional (bagus jika ada):

- xAI: `xai/grok-4.3` (atau yang terbaru tersedia)
- Mistral: `mistral/`… (pilih satu model berkemampuan “tools” yang telah Anda aktifkan)
- Cerebras: `cerebras/`… (jika Anda memiliki akses)
- LM Studio: `lmstudio/`… (lokal; pemanggilan tool bergantung pada mode API)

### Vision: kirim image (lampiran → pesan multimodal)

Sertakan setidaknya satu model berkemampuan image dalam `OPENCLAW_LIVE_GATEWAY_MODELS` (varian berkemampuan vision Claude/Gemini/OpenAI, dll.) untuk menguji probe image.

### Agregator / Gateway alternatif

Jika Anda memiliki key yang diaktifkan, kami juga mendukung pengujian melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat berkemampuan tool+image)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (auth melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Provider lain yang dapat Anda sertakan dalam matriks langsung (jika Anda memiliki kredensial/konfigurasi):

- Bawaan: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Melalui `models.providers` (endpoint kustom): `minimax` (cloud/API), plus proxy apa pun yang kompatibel dengan OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, dll.)

<Tip>
Jangan hardcode "all models" dalam dokumentasi. Daftar otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` di mesin Anda plus key apa pun yang tersedia.
</Tip>

## Kredensial (jangan pernah commit)

Pengujian langsung menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktis:

- Jika CLI berfungsi, pengujian live seharusnya menemukan kunci yang sama.
- Jika pengujian live mengatakan “tidak ada kredensial”, debug dengan cara yang sama seperti saat Anda men-debug `openclaw models list` / pemilihan model.

- Profil autentikasi per agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah yang dimaksud “kunci profil” dalam pengujian live)
- Konfigurasi: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori status lama: `~/.openclaw/credentials/` (disalin ke home live staged saat ada, tetapi bukan penyimpanan kunci profil utama)
- Jalankan live lokal menyalin konfigurasi aktif, file `auth-profiles.json` per agen, `credentials/` lama, dan direktori autentikasi CLI eksternal yang didukung ke home pengujian sementara secara default; home live staged melewati `workspace/` dan `sandboxes/`, dan override jalur `agents.*.workspace` / `agentDir` dihapus agar probe tetap berada di luar workspace host asli Anda.

Jika Anda ingin mengandalkan kunci env (misalnya diekspor di `~/.profile` Anda), jalankan pengujian lokal setelah `source ~/.profile`, atau gunakan runner Docker di bawah (runner dapat memasang `~/.profile` ke dalam kontainer).

## Deepgram live (transkripsi audio)

- Pengujian: `extensions/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Rencana coding BytePlus live

- Pengujian: `extensions/byteplus/live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Media workflow ComfyUI live

- Pengujian: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menjalankan jalur gambar, video, dan `music_generate` comfy bawaan
  - Melewati setiap kapabilitas kecuali `plugins.entries.comfy.config.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman workflow comfy, polling, unduhan, atau pendaftaran Plugin

## Pembuatan gambar live

- Pengujian: `test/image-generation.runtime.live.test.ts`
- Perintah: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Mengenumerasi setiap Plugin penyedia pembuatan gambar yang terdaftar
  - Memuat env var penyedia yang belum ada dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Menggunakan kunci API live/env sebelum profil autentikasi tersimpan secara default, sehingga kunci pengujian lama di `auth-profiles.json` tidak menutupi kredensial shell asli
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Menjalankan setiap penyedia yang dikonfigurasi melalui runtime pembuatan gambar bersama:
    - `<provider>:generate`
    - `<provider>:edit` saat penyedia menyatakan dukungan edit
- Penyedia bawaan saat ini yang tercakup:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Pembatasan opsional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan override khusus env

Untuk jalur CLI yang dikirimkan, tambahkan smoke `infer` setelah pengujian live penyedia/runtime berhasil:

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
Plugin bawaan, runtime pembuatan gambar bersama, dan permintaan penyedia live.
Dependensi Plugin diharapkan sudah ada sebelum pemuatan runtime.

## Pembuatan musik live

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menjalankan jalur penyedia pembuatan musik bawaan bersama
  - Saat ini mencakup Google dan MiniMax
  - Memuat env var penyedia dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Menggunakan kunci API live/env sebelum profil autentikasi tersimpan secara default, sehingga kunci pengujian lama di `auth-profiles.json` tidak menutupi kredensial shell asli
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dinyatakan saat tersedia:
    - `generate` dengan input hanya prompt
    - `edit` saat penyedia menyatakan `capabilities.edit.enabled`
  - Cakupan lane bersama saat ini:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy terpisah, bukan sweep bersama ini
- Pembatasan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan override khusus env

## Pembuatan video live

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menjalankan jalur penyedia pembuatan video bawaan bersama
  - Secara default menggunakan jalur smoke yang aman untuk rilis: penyedia non-FAL, satu permintaan teks-ke-video per penyedia, prompt lobster satu detik, dan batas operasi per penyedia dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default)
  - Melewati FAL secara default karena latensi antrean sisi penyedia dapat mendominasi waktu rilis; teruskan `--video-providers fal` atau `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` untuk menjalankannya secara eksplisit
  - Memuat env var penyedia dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Menggunakan kunci API live/env sebelum profil autentikasi tersimpan secara default, sehingga kunci pengujian lama di `auth-profiles.json` tidak menutupi kredensial shell asli
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Hanya menjalankan `generate` secara default
  - Tetapkan `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transformasi yang dinyatakan saat tersedia:
    - `imageToVideo` saat penyedia menyatakan `capabilities.imageToVideo.enabled` dan penyedia/model yang dipilih menerima input gambar lokal berbasis buffer dalam sweep bersama
    - `videoToVideo` saat penyedia menyatakan `capabilities.videoToVideo.enabled` dan penyedia/model yang dipilih menerima input video lokal berbasis buffer dalam sweep bersama
  - Penyedia `imageToVideo` yang dinyatakan tetapi dilewati saat ini dalam sweep bersama:
    - `vydra` karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar jarak jauh
  - Cakupan Vydra spesifik penyedia:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - file tersebut menjalankan teks-ke-video `veo3` ditambah lane `kling` yang menggunakan fixture URL gambar jarak jauh secara default
  - Cakupan live `videoToVideo` saat ini:
    - `runway` hanya saat model yang dipilih adalah `runway/gen4_aleph`
  - Penyedia `videoToVideo` yang dinyatakan tetapi dilewati saat ini dalam sweep bersama:
    - `alibaba`, `qwen`, `xai` karena jalur tersebut saat ini memerlukan URL referensi `http(s)` / MP4 jarak jauh
    - `google` karena lane Gemini/Veo bersama saat ini menggunakan input lokal berbasis buffer dan jalur tersebut tidak diterima dalam sweep bersama
    - `openai` karena lane bersama saat ini tidak memiliki jaminan akses inpaint/remix video spesifik org
- Pembatasan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap penyedia dalam sweep default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas operasi setiap penyedia bagi run smoke agresif
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan override khusus env

## Harness media live

- Perintah: `pnpm test:live:media`
- Tujuan:
  - Menjalankan suite live gambar, musik, dan video bersama melalui satu entrypoint asli repo
  - Memuat otomatis env var penyedia yang belum ada dari `~/.profile`
  - Secara default mempersempit otomatis setiap suite ke penyedia yang saat ini memiliki autentikasi yang dapat digunakan
  - Menggunakan ulang `scripts/test-live.mjs`, sehingga perilaku Heartbeat dan mode senyap tetap konsisten
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Terkait

- [Pengujian](/id/help/testing) — suite unit, integrasi, QA, dan Docker
