---
read_when:
    - Menjalankan smoke matriks model live / backend CLI / ACP / provider media
    - Men-debug resolusi kredensial live-test
    - Menambahkan live test khusus provider baru
sidebarTitle: Live tests
summary: 'Test live (menyentuh jaringan): matriks model, backend CLI, ACP, provider media, kredensial'
title: 'Pengujian: suite live'
x-i18n:
    generated_at: "2026-04-26T11:31:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 669d68dc80d0bf86942635c792f64f1edc7a23684c880cb66799401dee3d127f
    source_path: help/testing-live.md
    workflow: 15
---

Untuk mulai cepat, runner QA, suite unit/integration, dan alur Docker, lihat
[Testing](/id/help/testing). Halaman ini membahas suite test **live** (menyentuh jaringan):
matriks model, backend CLI, ACP, dan test live provider media, plus
penanganan kredensial.

## Live: perintah smoke profil lokal

Source `~/.profile` sebelum pemeriksaan live ad hoc agar key provider dan path tool lokal
sesuai dengan shell Anda:

```bash
source ~/.profile
```

Smoke media aman:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke kesiapan voice-call aman:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` adalah dry run kecuali `--yes` juga ada. Gunakan `--yes` hanya
saat Anda memang ingin melakukan panggilan notify sungguhan. Untuk Twilio, Telnyx, dan
Plivo, pemeriksaan kesiapan yang berhasil memerlukan URL Webhook publik; fallback
khusus loopback/pribadi lokal ditolak secara desain.

## Live: sweep kapabilitas node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: invoke **setiap perintah yang saat ini diiklankan** oleh node Android yang terhubung dan menegaskan perilaku kontrak perintah.
- Cakupan:
  - Penyiapan prasyarat/manual (suite ini tidak menginstal/menjalankan/memasangkan aplikasi).
  - Validasi `node.invoke` gateway per perintah untuk node Android yang dipilih.
- Pra-penyiapan yang diperlukan:
  - Aplikasi Android sudah terhubung + dipasangkan ke gateway.
  - Aplikasi tetap berada di foreground.
  - Izin/persetujuan capture diberikan untuk kapabilitas yang Anda harapkan lolos.
- Override target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail penyiapan Android lengkap: [Android App](/id/platforms/android)

## Live: smoke model (key profil)

Test live dibagi menjadi dua lapisan agar kita dapat mengisolasi kegagalan:

- “Direct model” memberi tahu kita apakah provider/model dapat menjawab sama sekali dengan key yang diberikan.
- “Gateway smoke” memberi tahu kita apakah pipeline gateway+agen penuh bekerja untuk model itu (sesi, riwayat, tool, kebijakan sandbox, dll.).

### Lapisan 1: Penyelesaian model langsung (tanpa gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Enumerasi model yang ditemukan
  - Gunakan `getApiKeyForModel` untuk memilih model yang Anda miliki kredensialnya
  - Jalankan completion kecil per model (dan regresi terarah bila diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Atur `OPENCLAW_LIVE_MODELS=modern` (atau `all`, alias untuk modern) untuk benar-benar menjalankan suite ini; jika tidak, suite ini dilewati agar `pnpm test:live` tetap fokus pada gateway smoke
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` untuk menjalankan allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk allowlist modern
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist dipisahkan koma)
  - Sweep modern/all secara default menggunakan batas high-signal yang dikurasi; atur `OPENCLAW_LIVE_MAX_MODELS=0` untuk sweep modern lengkap atau angka positif untuk batas yang lebih kecil.
  - Sweep lengkap menggunakan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` untuk seluruh timeout test direct-model. Default: 60 menit.
  - Probe direct-model berjalan dengan paralelisme 20 arah secara default; atur `OPENCLAW_LIVE_MODEL_CONCURRENCY` untuk override.
- Cara memilih provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist dipisahkan koma)
- Dari mana key berasal:
  - Default: profile store dan fallback env
  - Atur `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa **hanya profile store**
- Mengapa ini ada:
  - Memisahkan “API provider rusak / key tidak valid” dari “pipeline agen gateway rusak”
  - Menampung regresi kecil dan terisolasi (contoh: alur reasoning replay + tool-call OpenAI Responses/Codex Responses)

### Lapisan 2: Gateway + smoke agen dev (apa yang sebenarnya dilakukan "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Memutar gateway dalam proses
  - Membuat/menambal sesi `agent:dev:*` (override model per eksekusi)
  - Mengiterasi model-dengan-key dan menegaskan:
    - respons “bermakna” (tanpa tool)
    - invoke tool nyata berfungsi (probe baca)
    - probe tool tambahan opsional (probe exec+read)
    - jalur regresi OpenAI (tool-call-only → tindak lanjut) tetap berfungsi
- Detail probe (agar Anda dapat menjelaskan kegagalan dengan cepat):
  - Probe `read`: test menulis file nonce di workspace dan meminta agen untuk `read` file itu dan mengulang nonce tersebut.
  - Probe `exec+read`: test meminta agen untuk menulis nonce ke file temp melalui `exec`, lalu `read` kembali.
  - Probe gambar: test melampirkan PNG yang dihasilkan (kucing + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `src/gateway/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Cara memilih model:
  - Default: allowlist modern (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk allowlist modern
  - Atau atur `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar dipisahkan koma) untuk mempersempit
  - Sweep gateway modern/all secara default menggunakan batas high-signal yang dikurasi; atur `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk sweep modern lengkap atau angka positif untuk batas yang lebih kecil.
- Cara memilih provider (hindari “semua OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist dipisahkan koma)
- Probe tool + gambar selalu aktif dalam test live ini:
  - Probe `read` + probe `exec+read` (stress tool)
  - Probe gambar berjalan saat model mengiklankan dukungan input gambar
  - Alur (tingkat tinggi):
    - Test menghasilkan PNG kecil dengan “CAT” + kode acak (`src/gateway/live-image-probe.ts`)
    - Mengirimkannya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mengurai lampiran menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agen tertanam meneruskan pesan pengguna multimodal ke model
    - Asersi: balasan berisi `cat` + kode tersebut (toleransi OCR: kesalahan kecil diperbolehkan)

Tip: untuk melihat apa yang dapat Anda uji di mesin Anda (dan ID `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backend CLI (Claude, Codex, Gemini, atau CLI lokal lainnya)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: memvalidasi pipeline Gateway + agen menggunakan backend CLI lokal, tanpa menyentuh config default Anda.
- Default smoke khusus backend berada bersama definisi `cli-backend.ts` milik extension yang memiliki backend tersebut.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Provider/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku command/args/image berasal dari metadata plugin backend CLI yang memilikinya.
- Override (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran gambar nyata (path disuntikkan ke prompt). Resep Docker default menonaktifkan ini kecuali diminta secara eksplisit.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path file gambar sebagai argumen CLI alih-alih injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol bagaimana argumen gambar diteruskan saat `IMAGE_ARG` diatur.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` untuk ikut serta dalam probe kontinuitas sesi yang sama Claude Sonnet -> Opus saat model yang dipilih mendukung target switch. Resep Docker default menonaktifkan ini untuk keandalan agregat.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` untuk ikut serta dalam probe loopback MCP/tool. Resep Docker default menonaktifkan ini kecuali diminta secara eksplisit.

Contoh:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke konfigurasi MCP Gemini murah:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Ini tidak meminta Gemini menghasilkan respons. Test ini menulis pengaturan sistem yang sama
yang diberikan OpenClaw ke Gemini, lalu menjalankan `gemini --debug mcp list` untuk membuktikan bahwa
server `transport: "streamable-http"` yang tersimpan dinormalisasi ke bentuk MCP HTTP Gemini
dan dapat terhubung ke server MCP streamable-HTTP lokal.

Resep Docker:

```bash
pnpm test:docker:live-cli-backend
```

Resep Docker provider tunggal:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Catatan:

- Runner Docker berada di `scripts/test-live-cli-backend-docker.sh`.
- Runner ini menjalankan smoke backend CLI live di dalam image Docker repo sebagai pengguna non-root `node`.
- Runner ini me-resolve metadata smoke CLI dari extension yang memilikinya, lalu menginstal package CLI Linux yang cocok (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) ke prefix writable yang dicache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth langganan Claude Code portabel melalui `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Resep ini pertama-tama membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran backend CLI Gateway tanpa mempertahankan env API key Anthropic. Lane langganan ini menonaktifkan probe Claude MCP/tool dan gambar secara default karena Claude saat ini merutekan penggunaan aplikasi pihak ketiga melalui penagihan penggunaan tambahan, bukan batas paket langganan normal.
- Smoke backend CLI live sekarang menjalankan alur end-to-end yang sama untuk Claude, Codex, dan Gemini: giliran teks, giliran klasifikasi gambar, lalu panggilan tool MCP `cron` yang diverifikasi melalui CLI gateway.
- Smoke default Claude juga menambal sesi dari Sonnet ke Opus dan memverifikasi sesi yang dilanjutkan masih mengingat catatan sebelumnya.

## Live: smoke bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur bind percakapan ACP yang sebenarnya dengan agen ACP live:
  - kirim `/acp spawn <agent> --bind here`
  - bind percakapan message-channel sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi tindak lanjut masuk ke transkrip sesi ACP yang terikat
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Default:
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Catatan:
  - Lane ini menggunakan permukaan gateway `chat.send` dengan field originating-route sintetis yang hanya-admin sehingga test dapat melampirkan konteks message-channel tanpa berpura-pura mengirim secara eksternal.
  - Saat `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak diatur, test menggunakan registri agen bawaan milik plugin `acpx` tertanam untuk agen harness ACP yang dipilih.

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
- Secara default, runner ini menjalankan smoke bind ACP terhadap agen CLI live agregat secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` untuk mempersempit matriks.
- Runner ini melakukan source `~/.profile`, menyiapkan material auth CLI yang cocok ke dalam container, lalu menginstal CLI live yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid melalui `https://app.factory.ai/cli`, `@google/gemini-cli`, atau `opencode-ai`) jika belum ada. Backend ACP itu sendiri adalah package `acpx/runtime` tertanam bawaan dari plugin `acpx`.
- Varian Docker Droid menyiapkan `~/.factory` untuk pengaturan, meneruskan `FACTORY_API_KEY`, dan memerlukan API key tersebut karena auth/keyring OAuth Factory lokal tidak portabel ke dalam container. Varian ini menggunakan entri registri bawaan ACPX `droid exec --output-format acp`.
- Varian Docker OpenCode adalah lane regresi agen-tunggal yang ketat. Varian ini menulis model default sementara `OPENCODE_CONFIG_CONTENT` dari `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (default `opencode/kimi-k2.6`) setelah melakukan source `~/.profile`, dan `pnpm test:docker:live-acp-bind:opencode` memerlukan transkrip asisten yang terikat alih-alih menerima skip generik setelah bind.
- Panggilan CLI `acpx` langsung hanya merupakan jalur manual/workaround untuk membandingkan perilaku di luar Gateway. Smoke bind ACP Docker menguji backend runtime `acpx` tertanam milik OpenClaw.

## Live: smoke harness app-server Codex

- Tujuan: memvalidasi harness Codex milik plugin melalui metode gateway
  `agent` normal:
  - muat plugin `codex` bawaan
  - pilih `OPENCLAW_AGENT_RUNTIME=codex`
  - kirim giliran agen gateway pertama ke `openai/gpt-5.2` dengan harness Codex dipaksa
  - kirim giliran kedua ke sesi OpenClaw yang sama dan verifikasi thread app-server
    dapat dilanjutkan
  - jalankan `/codex status` dan `/codex models` melalui jalur perintah
    gateway yang sama
  - opsional jalankan dua probe shell eskalasi yang ditinjau Guardian: satu
    perintah aman yang seharusnya disetujui dan satu unggahan secret palsu yang
    seharusnya ditolak sehingga agen bertanya kembali
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model default: `openai/gpt-5.2`
- Probe gambar opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian opsional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke ini mengatur `OPENCLAW_AGENT_HARNESS_FALLBACK=none` agar harness Codex yang rusak
  tidak dapat lolos dengan diam-diam fallback ke Pi.
- Auth: auth app-server Codex dari login langganan Codex lokal. Smoke Docker
  juga dapat menyediakan `OPENAI_API_KEY` untuk probe non-Codex bila berlaku,
  plus opsional salinan `~/.codex/auth.json` dan `~/.codex/config.toml`.

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
- Runner ini melakukan source `~/.profile` yang di-mount, meneruskan `OPENAI_API_KEY`, menyalin file
  auth CLI Codex bila ada, menginstal `@openai/codex` ke prefix npm yang dapat ditulis dan di-mount,
  menyiapkan source tree, lalu hanya menjalankan test live Codex-harness.
- Docker mengaktifkan probe gambar, MCP/tool, dan Guardian secara default. Atur
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` saat Anda memerlukan eksekusi debug
  yang lebih sempit.
- Docker juga mengekspor `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, sesuai dengan config
  test live sehingga alias lama atau fallback Pi tidak dapat menyembunyikan regresi
  harness Codex.

### Resep live yang direkomendasikan

Allowlist yang sempit dan eksplisit adalah yang tercepat dan paling tidak flaky:

- Model tunggal, langsung (tanpa gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Model tunggal, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan tool di beberapa provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus Google (API key Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptive thinking Google:
  - Jika key lokal berada di profile shell: `source ~/.profile`
  - Default dinamis Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Anggaran dinamis Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Catatan:

- `google/...` menggunakan API Gemini (API key).
- `google-antigravity/...` menggunakan bridge OAuth Antigravity (endpoint agen bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan Gemini CLI lokal di mesin Anda (auth + keunikan tooling terpisah).
- Gemini API vs Gemini CLI:
  - API: OpenClaw memanggil API Gemini yang di-host Google melalui HTTP (API key / auth profil); inilah yang dimaksud sebagian besar pengguna dengan “Gemini”.
  - CLI: OpenClaw menjalankan biner `gemini` lokal; biner ini memiliki auth sendiri dan dapat berperilaku berbeda (streaming/tool support/version skew).

## Live: matriks model (cakupan kita)

Tidak ada “daftar model CI” tetap (live bersifat opt-in), tetapi berikut adalah model **yang direkomendasikan** untuk dicakup secara rutin pada mesin dev dengan key.

### Set smoke modern (pemanggilan tool + gambar)

Ini adalah eksekusi “model umum” yang kami harapkan tetap berfungsi:

- OpenAI (non-Codex): `openai/gpt-5.2`
- OAuth OpenAI Codex: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` dan `google/gemini-3-flash-preview` (hindari model Gemini 2.x yang lebih lama)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` dan `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` dan `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Jalankan gateway smoke dengan tool + gambar:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: pemanggilan tool (Read + Exec opsional)

Pilih setidaknya satu per keluarga provider:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (atau `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cakupan tambahan opsional (bagus untuk dimiliki):

- xAI: `xai/grok-4` (atau yang terbaru tersedia)
- Mistral: `mistral/`… (pilih satu model yang mampu “tools” yang Anda aktifkan)
- Cerebras: `cerebras/`… (jika Anda memiliki akses)
- LM Studio: `lmstudio/`… (lokal; pemanggilan tool bergantung pada mode API)

### Vision: pengiriman gambar (lampiran → pesan multimodal)

Sertakan setidaknya satu model yang mampu gambar dalam `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/varian OpenAI yang mendukung vision, dll.) untuk menjalankan probe gambar.

### Agregator / gateway alternatif

Jika Anda mengaktifkan key, kami juga mendukung pengujian melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat yang mampu tool+image)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (auth melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Provider lain yang dapat Anda sertakan dalam matriks live (jika Anda memiliki kredensial/config):

- Bawaan: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Melalui `models.providers` (endpoint kustom): `minimax` (cloud/API), plus proxy apa pun yang kompatibel OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, dll.)

Tip: jangan mencoba meng-hard-code “semua model” di dokumentasi. Daftar yang otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` pada mesin Anda + key apa pun yang tersedia.

## Kredensial (jangan pernah commit)

Test live menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktis:

- Jika CLI berfungsi, test live seharusnya menemukan key yang sama.
- Jika test live mengatakan “no creds”, debug dengan cara yang sama seperti Anda men-debug `openclaw models list` / pemilihan model.

- Auth profile per agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah yang dimaksud dengan “profile keys” dalam live test)
- Config: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori status lama: `~/.openclaw/credentials/` (disalin ke live home yang di-stage saat ada, tetapi bukan penyimpanan profile-key utama)
- Eksekusi lokal live menyalin config aktif, file `auth-profiles.json` per agen, `credentials/` lama, dan direktori auth CLI eksternal yang didukung ke home test temp secara default; live home yang di-stage melewati `workspace/` dan `sandboxes/`, dan override path `agents.*.workspace` / `agentDir` dihapus agar probe tetap menjauh dari workspace host asli Anda.

Jika Anda ingin mengandalkan key env (misalnya diekspor di `~/.profile` Anda), jalankan test lokal setelah `source ~/.profile`, atau gunakan runner Docker di bawah (runner ini dapat me-mount `~/.profile` ke dalam container).

## Deepgram live (transkripsi audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `extensions/byteplus/live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Media workflow ComfyUI live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menjalankan jalur gambar, video, dan `music_generate` comfy bawaan
  - Melewati setiap kapabilitas kecuali `plugins.entries.comfy.config.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman workflow comfy, polling, unduhan, atau registrasi plugin

## Pembuatan gambar live

- Test: `test/image-generation.runtime.live.test.ts`
- Perintah: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Mengenumerasi setiap plugin provider pembuatan gambar yang terdaftar
  - Memuat env var provider yang hilang dari shell login Anda (`~/.profile`) sebelum probing
  - Secara default menggunakan API key live/env sebelum auth profile yang tersimpan, sehingga key test basi di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider tanpa auth/profile/model yang dapat digunakan
  - Menjalankan setiap provider yang dikonfigurasi melalui runtime pembuatan gambar bersama:
    - `<provider>:generate`
    - `<provider>:edit` saat provider mendeklarasikan dukungan edit
- Provider bawaan saat ini yang dicakup:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth profile-store dan mengabaikan override env-only

Untuk jalur CLI yang dikirim, tambahkan smoke `infer` setelah test live provider/runtime
lulus:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Ini mencakup parsing argumen CLI, resolusi config/agen-default, aktivasi plugin
bawaan, perbaikan runtime-dependency bawaan sesuai permintaan, runtime
pembuatan gambar bersama, dan permintaan provider live.

## Pembuatan musik live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menjalankan jalur provider pembuatan musik bawaan bersama
  - Saat ini mencakup Google dan MiniMax
  - Memuat env var provider dari shell login Anda (`~/.profile`) sebelum probing
  - Secara default menggunakan API key live/env sebelum auth profile yang tersimpan, sehingga key test basi di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider tanpa auth/profile/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan bila tersedia:
    - `generate` dengan input prompt-only
    - `edit` saat provider mendeklarasikan `capabilities.edit.enabled`
  - Cakupan shared-lane saat ini:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy terpisah, bukan sweep bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth profile-store dan mengabaikan override env-only

## Pembuatan video live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menjalankan jalur provider pembuatan video bawaan bersama
  - Secara default menggunakan jalur smoke yang aman untuk rilis: provider non-FAL, satu permintaan text-to-video per provider, prompt lobster satu detik, dan batas operasi per provider dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default)
  - Secara default melewati FAL karena latensi antrean sisi provider dapat mendominasi waktu rilis; berikan `--video-providers fal` atau `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` untuk menjalankannya secara eksplisit
  - Memuat env var provider dari shell login Anda (`~/.profile`) sebelum probing
  - Secara default menggunakan API key live/env sebelum auth profile yang tersimpan, sehingga key test basi di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider tanpa auth/profile/model yang dapat digunakan
  - Secara default hanya menjalankan `generate`
  - Atur `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transform yang dideklarasikan bila tersedia:
    - `imageToVideo` saat provider mendeklarasikan `capabilities.imageToVideo.enabled` dan provider/model yang dipilih menerima input gambar lokal berbasis buffer dalam sweep bersama
    - `videoToVideo` saat provider mendeklarasikan `capabilities.videoToVideo.enabled` dan provider/model yang dipilih menerima input video lokal berbasis buffer dalam sweep bersama
  - Provider `imageToVideo` saat ini yang dideklarasikan tetapi dilewati dalam sweep bersama:
    - `vydra` karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar remote
  - Cakupan Vydra khusus provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - file itu menjalankan `veo3` text-to-video plus lane `kling` yang secara default menggunakan fixture URL gambar remote
  - Cakupan live `videoToVideo` saat ini:
    - `runway` hanya saat model yang dipilih adalah `runway/gen4_aleph`
  - Provider `videoToVideo` saat ini yang dideklarasikan tetapi dilewati dalam sweep bersama:
    - `alibaba`, `qwen`, `xai` karena jalur tersebut saat ini memerlukan URL referensi remote `http(s)` / MP4
    - `google` karena lane Gemini/Veo bersama saat ini menggunakan input lokal berbasis buffer dan jalur itu tidak diterima dalam sweep bersama
    - `openai` karena lane bersama saat ini tidak memiliki jaminan akses video inpaint/remix khusus org
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap provider dalam sweep default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas operasi tiap provider demi smoke run yang agresif
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth profile-store dan mengabaikan override env-only

## Harness media live

- Perintah: `pnpm test:live:media`
- Tujuan:
  - Menjalankan suite live gambar, musik, dan video bersama melalui satu entrypoint native repo
  - Memuat otomatis env var provider yang hilang dari `~/.profile`
  - Secara default mempersempit otomatis setiap suite ke provider yang saat ini memiliki auth yang dapat digunakan
  - Menggunakan kembali `scripts/test-live.mjs`, sehingga perilaku heartbeat dan quiet-mode tetap konsisten
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Terkait

- [Testing](/id/help/testing) — suite unit, integration, QA, dan Docker
