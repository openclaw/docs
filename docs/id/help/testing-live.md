---
read_when:
    - Menjalankan matriks model langsung / backend CLI / ACP / uji dasar media-provider
    - Men-debug resolusi kredensial pengujian langsung
    - Menambahkan pengujian langsung khusus penyedia baru
sidebarTitle: Live tests
summary: 'Pengujian live (yang menyentuh jaringan): matriks model, backend CLI, ACP, penyedia media, kredensial'
title: 'Pengujian: rangkaian pengujian langsung'
x-i18n:
    generated_at: "2026-05-02T09:23:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2268f20ce5c0bbee8bf610938851fe529f5e21fa31fe08a70400df94e9241cc3
    source_path: help/testing-live.md
    workflow: 16
---

Untuk mulai cepat, runner QA, rangkaian unit/integrasi, dan alur Docker, lihat
[Pengujian](/id/help/testing). Halaman ini mencakup rangkaian pengujian **langsung**
(yang menyentuh jaringan): matriks model, backend CLI, ACP, dan pengujian
langsung penyedia media, beserta penanganan kredensial.

## Langsung: perintah smoke profil lokal

Muat `~/.profile` sebelum pemeriksaan langsung ad hoc agar kunci penyedia dan
path alat lokal cocok dengan shell Anda:

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
ketika Anda memang ingin melakukan panggilan notifikasi sungguhan. Untuk Twilio,
Telnyx, dan Plivo, pemeriksaan kesiapan yang berhasil memerlukan URL webhook
publik; fallback loopback lokal saja/privat ditolak secara sengaja.

## Langsung: sweep kemampuan node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: memanggil **setiap perintah yang saat ini diiklankan** oleh node Android yang terhubung dan menegaskan perilaku kontrak perintah.
- Cakupan:
  - Penyiapan manual/bersyarat awal (rangkaian ini tidak menginstal/menjalankan/memasangkan aplikasi).
  - Validasi Gateway `node.invoke` per perintah untuk node Android yang dipilih.
- Penyiapan awal wajib:
  - Aplikasi Android sudah terhubung + dipasangkan ke Gateway.
  - Aplikasi tetap berada di foreground.
  - Izin/persetujuan tangkapan diberikan untuk kemampuan yang Anda harapkan lolos.
- Override target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail penyiapan Android lengkap: [Aplikasi Android](/id/platforms/android)

## Langsung: smoke model (kunci profil)

Pengujian langsung dibagi menjadi dua lapisan agar kita dapat mengisolasi kegagalan:

- “Model langsung” memberi tahu kita apakah penyedia/model bisa menjawab sama sekali dengan kunci yang diberikan.
- “Smoke Gateway” memberi tahu kita apakah pipeline gateway+agen lengkap berfungsi untuk model tersebut (sesi, riwayat, alat, kebijakan sandbox, dll.).

### Lapisan 1: Penyelesaian model langsung (tanpa gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Menginventarisasi model yang ditemukan
  - Menggunakan `getApiKeyForModel` untuk memilih model yang kredensialnya Anda miliki
  - Menjalankan penyelesaian kecil per model (dan regresi tertarget jika diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest langsung)
- Setel `OPENCLAW_LIVE_MODELS=modern` (atau `all`, alias untuk modern) untuk benar-benar menjalankan rangkaian ini; jika tidak, rangkaian ini dilewati agar `pnpm test:live` tetap berfokus pada smoke Gateway
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` untuk menjalankan allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk allowlist modern
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist koma)
  - Sweep modern/all secara default menggunakan batas terkurasi dengan sinyal tinggi; setel `OPENCLAW_LIVE_MAX_MODELS=0` untuk sweep modern menyeluruh atau angka positif untuk batas yang lebih kecil.
  - Sweep menyeluruh menggunakan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` untuk timeout seluruh pengujian model langsung. Default: 60 menit.
  - Probe model langsung berjalan dengan paralelisme 20 arah secara default; setel `OPENCLAW_LIVE_MODEL_CONCURRENCY` untuk mengganti.
- Cara memilih penyedia:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist koma)
- Dari mana kunci berasal:
  - Secara default: penyimpanan profil dan fallback env
  - Setel `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk mewajibkan **penyimpanan profil** saja
- Mengapa ini ada:
  - Memisahkan “API penyedia rusak / kunci tidak valid” dari “pipeline agen gateway rusak”
  - Berisi regresi kecil yang terisolasi (contoh: alur replay reasoning + panggilan alat OpenAI Responses/Codex Responses)

### Lapisan 2: Smoke Gateway + agen dev (yang sebenarnya dilakukan "@openclaw")

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Menjalankan gateway dalam proses
  - Membuat/mem-patch sesi `agent:dev:*` (override model per run)
  - Mengiterasi model-dengan-kunci dan menegaskan:
    - respons “bermakna” (tanpa alat)
    - pemanggilan alat nyata berfungsi (probe baca)
    - probe alat ekstra opsional (probe exec+baca)
    - jalur regresi OpenAI (hanya-panggilan-alat → tindak lanjut) tetap berfungsi
- Detail probe (agar Anda bisa menjelaskan kegagalan dengan cepat):
  - Probe `read`: pengujian menulis file nonce di workspace dan meminta agen untuk `read` file itu serta menggemakan nonce kembali.
  - Probe `exec+read`: pengujian meminta agen untuk menulis nonce dengan `exec` ke file temp, lalu `read` kembali.
  - Probe gambar: pengujian melampirkan PNG yang dihasilkan (kucing + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `src/gateway/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest langsung)
- Cara memilih model:
  - Default: allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk allowlist modern
  - Atau setel `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar koma) untuk mempersempit
  - Sweep Gateway modern/all secara default menggunakan batas terkurasi dengan sinyal tinggi; setel `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk sweep modern menyeluruh atau angka positif untuk batas yang lebih kecil.
- Cara memilih penyedia (hindari “semua OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist koma)
- Probe alat + gambar selalu aktif dalam pengujian langsung ini:
  - Probe `read` + probe `exec+read` (stres alat)
  - Probe gambar berjalan ketika model mengiklankan dukungan input gambar
  - Alur (tingkat tinggi):
    - Pengujian menghasilkan PNG kecil dengan “CAT” + kode acak (`src/gateway/live-image-probe.ts`)
    - Mengirimnya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mengurai lampiran menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agen tertanam meneruskan pesan pengguna multimodal ke model
    - Asersi: balasan berisi `cat` + kode (toleransi OCR: kesalahan kecil diizinkan)

<Tip>
Untuk melihat apa yang dapat Anda uji di mesin Anda (dan id `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Langsung: smoke backend CLI (Claude, Codex, Gemini, atau CLI lokal lain)

- Pengujian: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: memvalidasi pipeline Gateway + agen menggunakan backend CLI lokal, tanpa menyentuh konfigurasi default Anda.
- Default smoke khusus backend berada bersama definisi `cli-backend.ts` milik Plugin pemilik.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Penyedia/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku perintah/argumen/gambar berasal dari metadata Plugin backend CLI pemilik.
- Override (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran gambar nyata (path disuntikkan ke prompt). Resep Docker menonaktifkan ini secara default kecuali diminta secara eksplisit.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path file gambar sebagai argumen CLI alih-alih injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol bagaimana argumen gambar diteruskan ketika `IMAGE_ARG` disetel.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` untuk ikut serta dalam probe kontinuitas sesi yang sama Claude Sonnet -> Opus ketika model yang dipilih mendukung target switch. Resep Docker menonaktifkan ini secara default demi keandalan agregat.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` untuk ikut serta dalam probe loopback MCP/alat. Resep Docker menonaktifkan ini secara default kecuali diminta secara eksplisit.

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

Ini tidak meminta Gemini menghasilkan respons. Ini menulis pengaturan sistem yang
sama seperti yang OpenClaw berikan kepada Gemini, lalu menjalankan `gemini --debug mcp list` untuk membuktikan bahwa server
`transport: "streamable-http"` yang tersimpan dinormalisasi ke bentuk HTTP MCP
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
- Runner ini menjalankan smoke backend CLI langsung di dalam image Docker repo sebagai pengguna non-root `node`.
- Runner ini menyelesaikan metadata smoke CLI dari Plugin pemilik, lalu menginstal paket CLI Linux yang cocok (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) ke prefix tertulis yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth langganan Claude Code portabel melalui `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Ini pertama-tama membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran backend CLI Gateway tanpa mempertahankan variabel env kunci API Anthropic. Lane langganan ini menonaktifkan probe MCP/alat dan gambar Claude secara default karena Claude saat ini merutekan penggunaan aplikasi pihak ketiga melalui penagihan penggunaan ekstra, bukan batas paket langganan normal.
- Smoke backend CLI langsung sekarang menjalankan alur end-to-end yang sama untuk Claude, Codex, dan Gemini: giliran teks, giliran klasifikasi gambar, lalu panggilan alat MCP `cron` yang diverifikasi melalui CLI Gateway.
- Smoke default Claude juga mem-patch sesi dari Sonnet ke Opus dan memverifikasi bahwa sesi yang dilanjutkan masih mengingat catatan sebelumnya.

## Langsung: smoke bind ACP (`/acp spawn ... --bind here`)

- Pengujian: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur bind percakapan ACP nyata dengan agen ACP live:
  - kirim `/acp spawn <agent> --bind here`
  - bind percakapan kanal pesan sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi tindak lanjut masuk ke transkrip sesi ACP yang terikat
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Default:
  - Agen ACP di Docker: `claude,codex,gemini`
  - Agen ACP untuk `pnpm test:live ...` langsung: `claude`
  - Kanal sintetis: konteks percakapan gaya DM Slack
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
  - Lane ini menggunakan permukaan gateway `chat.send` dengan field rute asal sintetis khusus admin agar pengujian dapat melampirkan konteks kanal pesan tanpa berpura-pura mengirim secara eksternal.
  - Saat `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak disetel, pengujian menggunakan registry agen bawaan Plugin `acpx` tertanam untuk agen harness ACP yang dipilih.
  - Pembuatan MCP cron sesi terikat secara default bersifat upaya terbaik karena harness ACP eksternal dapat membatalkan panggilan MCP setelah bukti bind/gambar lulus; setel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` agar probe cron pasca-bind tersebut ketat.

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
- Secara default, runner menjalankan smoke bind ACP terhadap agen CLI live agregat secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` untuk mempersempit matriks.
- Runner memuat `~/.profile`, menyiapkan materi auth CLI yang sesuai ke dalam kontainer, lalu menginstal CLI live yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid melalui `https://app.factory.ai/cli`, `@google/gemini-cli`, atau `opencode-ai`) jika belum ada. Backend ACP itu sendiri adalah paket `acpx/runtime` tertanam dari Plugin `acpx` resmi.
- Varian Docker Droid menyiapkan `~/.factory` untuk pengaturan, meneruskan `FACTORY_API_KEY`, dan membutuhkan API key tersebut karena auth OAuth/keyring Factory lokal tidak portabel ke dalam kontainer. Varian ini menggunakan entri registry bawaan ACPX `droid exec --output-format acp`.
- Varian Docker OpenCode adalah lane regresi agen tunggal yang ketat. Varian ini menulis model default sementara `OPENCODE_CONFIG_CONTENT` dari `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (default `opencode/kimi-k2.6`) setelah memuat `~/.profile`, dan `pnpm test:docker:live-acp-bind:opencode` mewajibkan transkrip asisten terikat alih-alih menerima skip pasca-bind generik.
- Panggilan CLI `acpx` langsung hanya merupakan jalur manual/solusi sementara untuk membandingkan perilaku di luar Gateway. Smoke bind ACP Docker menjalankan backend runtime `acpx` tertanam OpenClaw.

## Live: smoke harness app-server Codex

- Tujuan: memvalidasi harness Codex milik Plugin melalui metode gateway
  `agent` normal:
  - memuat Plugin `codex` bawaan
  - memilih `OPENCLAW_AGENT_RUNTIME=codex`
  - mengirim giliran agen gateway pertama ke `openai/gpt-5.5` dengan harness Codex dipaksa
  - mengirim giliran kedua ke sesi OpenClaw yang sama dan memverifikasi thread app-server
    dapat dilanjutkan
  - menjalankan `/codex status` dan `/codex models` melalui jalur perintah gateway
    yang sama
  - secara opsional menjalankan dua probe shell tereskalasi yang ditinjau Guardian: satu perintah
    jinak yang seharusnya disetujui dan satu unggahan fake-secret yang seharusnya
    ditolak sehingga agen bertanya kembali
- Pengujian: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model default: `openai/gpt-5.5`
- Probe gambar opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian opsional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke menyetel `OPENCLAW_AGENT_HARNESS_FALLBACK=none` sehingga harness Codex
  yang rusak tidak dapat lulus dengan diam-diam fallback ke PI.
- Auth: auth app-server Codex dari login langganan Codex lokal. Smoke Docker
  juga dapat menyediakan `OPENAI_API_KEY` untuk probe non-Codex jika berlaku,
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
- Runner memuat `~/.profile` yang di-mount, meneruskan `OPENAI_API_KEY`, menyalin file
  auth CLI Codex bila ada, menginstal `@openai/codex` ke prefix npm ter-mount yang dapat ditulis,
  menyiapkan pohon sumber, lalu hanya menjalankan pengujian live harness Codex.
- Docker mengaktifkan probe gambar, MCP/tool, dan Guardian secara default. Setel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` saat Anda membutuhkan run debug
  yang lebih sempit.
- Docker juga mengekspor `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, sesuai dengan konfigurasi
  pengujian live sehingga alias legacy atau fallback PI tidak dapat menyembunyikan regresi
  harness Codex.

### Resep live yang direkomendasikan

Allowlist yang sempit dan eksplisit adalah yang tercepat dan paling minim flaky:

- Model tunggal, langsung (tanpa gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Model tunggal, smoke gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan tool di beberapa penyedia:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptive thinking Google:
  - Jika key lokal berada di profil shell: `source ~/.profile`
  - Default dinamis Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Anggaran dinamis Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Catatan:

- `google/...` menggunakan Gemini API (API key).
- `google-antigravity/...` menggunakan bridge OAuth Antigravity (endpoint agen bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan CLI Gemini lokal di mesin Anda (auth terpisah + kekhasan tooling).
- Gemini API vs Gemini CLI:
  - API: OpenClaw memanggil Gemini API terhosting milik Google melalui HTTP (API key / auth profil); ini yang dimaksud sebagian besar pengguna dengan “Gemini”.
  - CLI: OpenClaw menjalankan binary `gemini` lokal via shell; CLI memiliki auth sendiri dan dapat berperilaku berbeda (streaming/dukungan tool/ketidaksesuaian versi).

## Live: matriks model (yang kami cakup)

Tidak ada “daftar model CI” tetap (live bersifat opt-in), tetapi berikut adalah model **yang direkomendasikan** untuk dicakup secara rutin di mesin dev dengan key.

### Set smoke modern (pemanggilan tool + gambar)

Ini adalah run “model umum” yang kami harapkan tetap berfungsi:

- OpenAI (non-Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` dan `google/gemini-3-flash-preview` (hindari model Gemini 2.x yang lebih lama)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` dan `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` dan `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Jalankan smoke gateway dengan tool + gambar:
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

- xAI: `xai/grok-4.3` (atau yang terbaru tersedia)
- Mistral: `mistral/`… (pilih satu model berkemampuan “tools” yang telah Anda aktifkan)
- Cerebras: `cerebras/`… (jika Anda memiliki akses)
- LM Studio: `lmstudio/`… (lokal; pemanggilan tool bergantung pada mode API)

### Vision: kirim gambar (lampiran → pesan multimodal)

Sertakan setidaknya satu model berkemampuan gambar di `OPENCLAW_LIVE_GATEWAY_MODELS` (varian Claude/Gemini/OpenAI yang mendukung vision, dll.) untuk menjalankan probe gambar.

### Agregator / gateway alternatif

Jika Anda memiliki key yang aktif, kami juga mendukung pengujian melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat berkemampuan tool+gambar)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (auth melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Lebih banyak penyedia yang dapat Anda sertakan dalam matriks live (jika Anda memiliki kredensial/konfigurasi):

- Bawaan: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Melalui `models.providers` (endpoint kustom): `minimax` (cloud/API), ditambah proxy apa pun yang kompatibel dengan OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, dll.)

<Tip>
Jangan hardcode "all models" di dokumentasi. Daftar otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` di mesin Anda ditambah key apa pun yang tersedia.
</Tip>

## Kredensial (jangan pernah commit)

Pengujian live menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktis:

- Jika CLI berfungsi, pengujian langsung seharusnya menemukan kunci yang sama.
- Jika pengujian langsung mengatakan “tidak ada kredensial”, debug dengan cara yang sama seperti Anda men-debug `openclaw models list` / pemilihan model.

- Profil autentikasi per agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah yang dimaksud “kunci profil” dalam pengujian langsung)
- Konfigurasi: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori state lama: `~/.openclaw/credentials/` (disalin ke home langsung bertahap saat ada, tetapi bukan penyimpanan kunci profil utama)
- Eksekusi lokal langsung menyalin konfigurasi aktif, file `auth-profiles.json` per agen, `credentials/` lama, dan direktori autentikasi CLI eksternal yang didukung ke home pengujian sementara secara default; home langsung bertahap melewati `workspace/` dan `sandboxes/`, serta override jalur `agents.*.workspace` / `agentDir` dihapus agar probe tetap tidak menyentuh workspace host asli Anda.

Jika Anda ingin mengandalkan kunci env (mis. diekspor di `~/.profile`), jalankan pengujian lokal setelah `source ~/.profile`, atau gunakan runner Docker di bawah ini (runner tersebut dapat memasang `~/.profile` ke dalam kontainer).

## Langsung Deepgram (transkripsi audio)

- Pengujian: `extensions/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Langsung rencana coding BytePlus

- Pengujian: `extensions/byteplus/live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Langsung media workflow ComfyUI

- Pengujian: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menguji jalur gambar, video, dan `music_generate` comfy bawaan
  - Melewati setiap kapabilitas kecuali `plugins.entries.comfy.config.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman workflow comfy, polling, unduhan, atau pendaftaran Plugin

## Langsung pembuatan gambar

- Pengujian: `test/image-generation.runtime.live.test.ts`
- Perintah: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Menginventarisasi setiap Plugin penyedia pembuatan gambar yang terdaftar
  - Memuat env var penyedia yang hilang dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Menggunakan kunci API langsung/env sebelum profil autentikasi tersimpan secara default, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell asli
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Menjalankan setiap penyedia yang dikonfigurasi melalui runtime pembuatan gambar bersama:
    - `<provider>:generate`
    - `<provider>:edit` saat penyedia menyatakan dukungan edit
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan override yang hanya env

Untuk jalur CLI yang dikirimkan, tambahkan smoke `infer` setelah pengujian langsung penyedia/runtime lulus:

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
langsung. Dependensi Plugin diharapkan sudah ada sebelum pemuatan runtime.

## Langsung pembuatan musik

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menguji jalur penyedia pembuatan musik bawaan bersama
  - Saat ini mencakup Google dan MiniMax
  - Memuat env var penyedia dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Menggunakan kunci API langsung/env sebelum profil autentikasi tersimpan secara default, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell asli
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dinyatakan saat tersedia:
    - `generate` dengan input hanya prompt
    - `edit` saat penyedia menyatakan `capabilities.edit.enabled`
  - Cakupan lane bersama saat ini:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file langsung Comfy terpisah, bukan sweep bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan override yang hanya env

## Langsung pembuatan video

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menguji jalur penyedia pembuatan video bawaan bersama
  - Secara default memakai jalur smoke yang aman untuk rilis: penyedia non-FAL, satu permintaan teks-ke-video per penyedia, prompt lobster satu detik, dan batas operasi per penyedia dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default)
  - Melewati FAL secara default karena latensi antrean sisi penyedia dapat mendominasi waktu rilis; berikan `--video-providers fal` atau `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` untuk menjalankannya secara eksplisit
  - Memuat env var penyedia dari shell login Anda (`~/.profile`) sebelum melakukan probe
  - Menggunakan kunci API langsung/env sebelum profil autentikasi tersimpan secara default, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell asli
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Hanya menjalankan `generate` secara default
  - Setel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transform yang dinyatakan saat tersedia:
    - `imageToVideo` saat penyedia menyatakan `capabilities.imageToVideo.enabled` dan penyedia/model yang dipilih menerima input gambar lokal berbasis buffer dalam sweep bersama
    - `videoToVideo` saat penyedia menyatakan `capabilities.videoToVideo.enabled` dan penyedia/model yang dipilih menerima input video lokal berbasis buffer dalam sweep bersama
  - Penyedia `imageToVideo` yang dinyatakan tetapi dilewati saat ini dalam sweep bersama:
    - `vydra` karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar jarak jauh
  - Cakupan Vydra khusus penyedia:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - file tersebut menjalankan teks-ke-video `veo3` ditambah lane `kling` yang menggunakan fixture URL gambar jarak jauh secara default
  - Cakupan langsung `videoToVideo` saat ini:
    - `runway` hanya saat model yang dipilih adalah `runway/gen4_aleph`
  - Penyedia `videoToVideo` yang dinyatakan tetapi dilewati saat ini dalam sweep bersama:
    - `alibaba`, `qwen`, `xai` karena jalur tersebut saat ini memerlukan URL referensi `http(s)` / MP4 jarak jauh
    - `google` karena lane Gemini/Veo bersama saat ini menggunakan input lokal berbasis buffer dan jalur tersebut tidak diterima dalam sweep bersama
    - `openai` karena lane bersama saat ini tidak memiliki jaminan akses video inpaint/remix khusus org
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap penyedia dalam sweep default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas setiap operasi penyedia untuk eksekusi smoke agresif
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan override yang hanya env

## Harness langsung media

- Perintah: `pnpm test:live:media`
- Tujuan:
  - Menjalankan suite langsung gambar, musik, dan video bersama melalui satu entrypoint native repo
  - Memuat otomatis env var penyedia yang hilang dari `~/.profile`
  - Mempersempit otomatis setiap suite ke penyedia yang saat ini memiliki autentikasi yang dapat digunakan secara default
  - Menggunakan ulang `scripts/test-live.mjs`, sehingga perilaku Heartbeat dan mode senyap tetap konsisten
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Terkait

- [Pengujian](/id/help/testing) — suite unit, integrasi, QA, dan Docker
