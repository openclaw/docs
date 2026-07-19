---
read_when:
    - Menjalankan smoke test model matrix langsung / backend CLI / ACP / penyedia media
    - Men-debug resolusi kredensial pengujian langsung
    - Menambahkan pengujian live khusus penyedia baru
sidebarTitle: Live tests
summary: 'Pengujian langsung (yang mengakses jaringan): matriks model, backend CLI, ACP, penyedia media, kredensial'
title: 'Pengujian: rangkaian langsung'
x-i18n:
    generated_at: "2026-07-19T05:12:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b6330c4f17081429d48ff2a47b48b0a0133555c835a17cea5edf5d1f880d91e
    source_path: help/testing-live.md
    workflow: 16
---

Untuk memulai dengan cepat, runner QA, rangkaian pengujian unit/integrasi, dan alur Docker, lihat
[Pengujian](/id/help/testing). Halaman ini membahas pengujian **langsung** (yang menyentuh jaringan):
matriks model, backend CLI, ACP, penyedia media, dan penanganan kredensial.

## Pengujian langsung vs gateway nyata Anda

Rangkaian pengujian langsung dan smoke ad hoc tidak boleh mengganggu gateway yang sudah
melayani lalu lintas nyata (milik Anda atau operator lain):

- Gunakan gateway Anda sendiri: gunakan gateway dalam proses (Lapisan 2 di bawah) atau mulai
  instans pengembangan dengan direktori status terisolasi (`OPENCLAW_STATE_DIR=<scratch>`) dan
  port yang kosong. Jangan bind port gateway default (18789) saat gateway nyata
  sedang berjalan pada port tersebut.
- Jangan `openclaw gateway stop`/`restart` (atau padanan `launchctl`/`systemctl`/tmux)
  layanan yang tidak Anda mulai dalam sesi ini — itu adalah instans langsung milik
  operator. Dapatkan persetujuan eksplisit terlebih dahulu.
- Memerlukan data realistis? Salin status/DB langsung ke direktori status pengembangan Anda dan lakukan pengujian
  terhadap salinan tersebut. Migrasi langsung pada status gateway yang aktif juga memerlukan
  persetujuan eksplisit.

## Langsung: perintah smoke lokal

Ekspor kunci penyedia yang diperlukan dalam lingkungan proses sebelum pemeriksaan langsung
ad hoc.

Smoke media yang aman:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "Smoke langsung OpenClaw." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke kesiapan panggilan suara yang aman:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` adalah dry run kecuali `--yes` juga tersedia; gunakan `--yes` hanya
saat Anda bermaksud melakukan panggilan nyata. Untuk Twilio, Telnyx, dan Plivo,
pemeriksaan kesiapan yang berhasil memerlukan URL webhook publik - URL loopback
lokal/pribadi ditolak karena penyedia tersebut tidak dapat menjangkaunya.

## Langsung: pemeriksaan menyeluruh kapabilitas Node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: panggil **setiap perintah yang saat ini diiklankan** oleh Node Android yang terhubung dan tegaskan perilaku kontrak perintah.
- Cakupan:
  - Penyiapan manual/prasyarat (rangkaian pengujian tidak menginstal/menjalankan/memasangkan aplikasi).
  - Validasi `node.invoke` gateway per perintah untuk Node Android yang dipilih.
- Penyiapan awal yang diperlukan:
  - Aplikasi Android sudah terhubung + dipasangkan ke gateway.
  - Aplikasi tetap berada di latar depan.
  - Izin/persetujuan pengambilan diberikan untuk kapabilitas yang Anda harapkan berhasil.
- Penggantian target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail lengkap penyiapan Android: [Aplikasi Android](/id/platforms/android)

## Langsung: smoke model (kunci profil)

Pengujian model langsung dibagi menjadi dua lapisan agar kegagalan dapat diisolasi:

- "Model langsung" memberi tahu apakah penyedia/model dapat memberikan jawaban sama sekali dengan kunci yang diberikan.
- "Smoke gateway" memberi tahu apakah pipeline gateway+agen lengkap berfungsi untuk model tersebut (sesi, riwayat, alat, kebijakan sandbox, dan sebagainya).

Daftar model terkurasi di bawah berada di `src/agents/live-model-filter.ts` dan
berubah seiring waktu; perlakukan array di sana sebagai sumber kebenaran, bukan
halaman ini.

MiniMax M3 menggunakan `minimax/MiniMax-M3` sebagai referensi penyedia/model default.

### Lapisan 1: Penyelesaian model langsung (tanpa gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Enumerasi model yang ditemukan
  - Gunakan `getApiKeyForModel` untuk memilih model yang kredensialnya Anda miliki
  - Jalankan penyelesaian kecil per model (dan regresi tertarget jika diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - Tetapkan `OPENCLAW_LIVE_MODELS=modern`, `small`, atau `all` (alias untuk `modern`) agar rangkaian pengujian ini benar-benar berjalan; jika tidak, rangkaian ini dilewati, sehingga `pnpm test:live` sendiri tetap berfokus pada smoke gateway.
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` menjalankan daftar prioritas sinyal tinggi terkurasi (lihat [Langsung: matriks model](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` menjalankan daftar prioritas model kecil terkurasi
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk `modern`
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (daftar yang diizinkan, dipisahkan koma)
  - Proses model kecil Ollama lokal menggunakan `http://127.0.0.1:11434` secara default; tetapkan `OPENCLAW_LIVE_OLLAMA_BASE_URL` hanya untuk endpoint LAN, kustom, atau Ollama Cloud.
  - Pemeriksaan menyeluruh modern/semua dan model kecil secara default menggunakan panjang daftar terkurasi masing-masing sebagai batas; tetapkan `OPENCLAW_LIVE_MAX_MODELS=0` untuk pemeriksaan menyeluruh profil terpilih secara lengkap atau angka positif untuk batas yang lebih kecil.
  - Pemeriksaan menyeluruh lengkap menggunakan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` untuk batas waktu seluruh pengujian model langsung. Default: 60 menit.
  - Probe model langsung berjalan dengan paralelisme 20 arah secara default; tetapkan `OPENCLAW_LIVE_MODEL_CONCURRENCY` untuk menggantinya.
- Cara memilih penyedia:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (daftar yang diizinkan, dipisahkan koma)
- Asal kunci:
  - Secara default: penyimpanan profil dan fallback lingkungan
  - Tetapkan `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memberlakukan **penyimpanan profil** saja
- Alasan keberadaannya:
  - Memisahkan "API penyedia rusak / kunci tidak valid" dari "pipeline agen gateway rusak"
  - Berisi regresi kecil dan terisolasi (contoh: pemutaran ulang penalaran OpenAI Responses/Codex Responses + alur pemanggilan alat)

### Lapisan 2: Gateway + smoke agen pengembangan (apa yang sebenarnya dilakukan "@openclaw")

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Jalankan gateway dalam proses
  - Buat/patch sesi `agent:dev:*` (penggantian model per proses)
  - Iterasikan model yang memiliki kunci dan tegaskan:
    - respons "bermakna" (tanpa alat)
    - pemanggilan alat nyata berfungsi (probe baca)
    - probe alat tambahan opsional (probe eksekusi+baca)
    - jalur regresi OpenAI (hanya pemanggilan alat -> tindak lanjut) tetap berfungsi
- Detail probe (agar Anda dapat menjelaskan kegagalan dengan cepat):
  - Probe `read`: pengujian menulis berkas nonce di ruang kerja dan meminta agen untuk `read` berkas tersebut serta menggemakan kembali nonce.
  - Probe `exec+read`: pengujian meminta agen untuk `exec`-menulis nonce ke dalam berkas sementara, lalu `read` kembali.
  - probe gambar: pengujian melampirkan PNG yang dihasilkan (kucing + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `test/helpers/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Cara memilih model:
  - Default: daftar prioritas sinyal tinggi terkurasi (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` menjalankan daftar model kecil terkurasi melalui pipeline gateway+agen lengkap
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk `modern`
  - Atau tetapkan `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar yang dipisahkan koma) untuk mempersempit
  - Pemeriksaan menyeluruh gateway modern/semua dan model kecil secara default menggunakan panjang daftar terkurasi masing-masing sebagai batas; tetapkan `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk pemeriksaan menyeluruh terpilih secara lengkap atau angka positif untuk batas yang lebih kecil.
- Cara memilih penyedia (hindari "semuanya melalui OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (daftar yang diizinkan, dipisahkan koma)
- Probe alat + gambar selalu aktif dalam pengujian langsung ini:
  - probe `read` + probe `exec+read` (pengujian tekanan alat)
  - probe gambar berjalan saat model menyatakan dukungan input gambar
  - Alur (tingkat tinggi):
    - Pengujian menghasilkan PNG kecil dengan "CAT" + kode acak (`test/helpers/live-image-probe.ts`)
    - Mengirimkannya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mengurai lampiran menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agen tertanam meneruskan pesan pengguna multimodal ke model
    - Penegasan: balasan berisi `cat` + kode tersebut (toleransi OCR: kesalahan kecil diperbolehkan)

<Tip>
Untuk melihat apa yang dapat Anda uji di mesin Anda (dan id `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Langsung: smoke backend CLI (Claude, Gemini, atau CLI lokal lainnya)

- Pengujian: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: validasi pipeline Gateway + agen menggunakan backend CLI lokal, tanpa menyentuh konfigurasi default Anda.
- Default smoke khusus backend berada bersama definisi `cli-backend.ts` milik Plugin pemiliknya.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Penyedia/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku perintah/argumen/gambar berasal dari metadata Plugin backend CLI pemiliknya.
- Penggantian (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran gambar nyata (path disisipkan ke dalam prompt). Nonaktif secara default dalam resep Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path berkas gambar sebagai argumen CLI alih-alih injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol cara argumen gambar diteruskan saat `IMAGE_ARG` ditetapkan.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur kelanjutan.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` untuk memilih ikut serta dalam probe kontinuitas sesi yang sama Claude Sonnet -> Opus saat model terpilih mendukung target peralihan. Nonaktif secara default, termasuk dalam resep Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` untuk memilih ikut serta dalam probe loopback MCP/alat. Nonaktif secara default dalam resep Docker.

Contoh:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke konfigurasi MCP Gemini yang ringan:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Ini tidak meminta Gemini menghasilkan respons. Pengujian ini menulis pengaturan sistem yang sama
yang diberikan OpenClaw kepada Gemini, lalu menjalankan `gemini --debug mcp list` untuk membuktikan bahwa
server `transport: "streamable-http"` yang tersimpan dinormalisasi ke bentuk MCP HTTP milik Gemini
dan dapat terhubung ke server MCP HTTP-streamable lokal.

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
- Runner ini menjalankan smoke backend CLI live di dalam image Docker repo sebagai pengguna non-root `node`.
- Runner ini me-resolve metadata smoke CLI dari plugin pemiliknya, lalu menginstal paket CLI Linux yang sesuai (`@anthropic-ai/claude-code` atau `@google/gemini-cli`) ke prefiks dapat-tulis yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` bukan lagi backend CLI yang dibundel; sebagai gantinya, gunakan `openai/*` dengan runtime app-server Codex (lihat [Live: smoke harness app-server Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth langganan Claude Code portabel melalui `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Lane ini terlebih dahulu membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran backend CLI Gateway tanpa mempertahankan variabel lingkungan kunci API Anthropic. Lane langganan ini menonaktifkan pemeriksaan Claude MCP/alat dan image secara default karena menggunakan batas pemakaian langganan yang telah masuk, dan Anthropic dapat mengubah perilaku penagihan serta batas laju Claude Agent SDK / `claude -p` tanpa rilis OpenClaw.
- Claude dan Gemini mendukung rangkaian pemeriksaan yang sama (giliran teks, klasifikasi image, pemanggilan alat MCP `cron`, kontinuitas pergantian model) melalui flag di atas, tetapi tidak satu pun pemeriksaan tersebut berjalan secara default—aktifkan sesuai kebutuhan melalui masing-masing flag.

## Live: keterjangkauan proksi HTTP/2 APNs

- Pengujian: `src/infra/push-apns-http2.live.test.ts`
- Tujuan: membuat tunnel melalui proksi HTTP CONNECT lokal menuju endpoint APNs sandbox Apple, mengirim permintaan validasi HTTP/2 APNs, dan memastikan respons `403 InvalidProviderToken` asli dari Apple kembali melalui jalur proksi.
- Aktifkan:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Batas waktu opsional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: smoke pengikatan ACP (`/acp spawn ... --bind here`)

- Pengujian: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur pengikatan percakapan ACP nyata dengan agen ACP live:
  - kirim `/acp spawn <agent> --bind here`
  - ikat percakapan saluran pesan sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi bahwa tindak lanjut masuk ke transkrip sesi ACP yang terikat
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
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (atau `on`/`true`/`yes`) untuk memaksa pemeriksaan image aktif; nilai lain memaksanya nonaktif. Berjalan secara default untuk setiap agen kecuali `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Catatan:
  - Lane ini menggunakan permukaan `chat.send` Gateway dengan field rute asal sintetis khusus admin agar pengujian dapat menyertakan konteks saluran pesan tanpa berpura-pura mengirimkannya secara eksternal.
  - Saat `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak disetel, pengujian menggunakan registri agen bawaan milik plugin `acpx` tertanam untuk agen harness ACP yang dipilih.
  - Pembuatan cron MCP pada sesi terikat bersifat upaya terbaik secara default karena harness ACP eksternal dapat membatalkan pemanggilan MCP setelah bukti pengikatan/image berhasil; setel `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` agar pemeriksaan cron pascapengikatan tersebut bersifat ketat.

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

Resep Docker satu agen:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-acp-bind-docker.sh`.
- Secara default, runner ini menjalankan smoke pengikatan ACP terhadap agen CLI live agregat secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` untuk mempersempit matriks.
- Runner ini menempatkan materi autentikasi CLI yang sesuai ke dalam container, lalu menginstal CLI live yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid melalui `https://app.factory.ai/cli`, `@google/gemini-cli`, atau `opencode-ai`) jika belum tersedia. Backend ACP itu sendiri adalah paket `acpx/runtime` tertanam dari plugin resmi `acpx`.
- Varian Docker Droid menempatkan `~/.factory` untuk pengaturan, meneruskan `FACTORY_API_KEY`, dan mewajibkan kunci API tersebut karena autentikasi OAuth/keyring Factory lokal tidak portabel ke dalam container. Varian ini menggunakan entri registri `droid exec --output-format acp` bawaan ACPX.
- Varian Docker OpenCode adalah lane regresi satu agen yang ketat. Varian ini menulis model default sementara `OPENCODE_CONFIG_CONTENT` dari `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (default `opencode/kimi-k2.6`).
- Pemanggilan CLI `acpx` langsung hanyalah jalur manual/solusi sementara untuk membandingkan perilaku di luar Gateway. Smoke pengikatan ACP Docker menjalankan backend runtime `acpx` tertanam milik OpenClaw.

## Live: smoke harness app-server Codex

- Tujuan: memvalidasi harness Codex milik plugin melalui metode Gateway normal
  `agent`:
  - muat plugin `codex` yang dibundel
  - pilih model OpenAI melalui `/model <ref> --runtime codex`
  - kirim giliran pertama agen Gateway dengan tingkat pemikiran yang diminta
  - kirim giliran kedua ke sesi OpenClaw yang sama dan verifikasi bahwa thread
    app-server dapat dilanjutkan
  - jalankan `/codex status` dan `/codex models` melalui jalur perintah Gateway
    yang sama
  - secara opsional jalankan dua pemeriksaan shell terelevasi yang direview Guardian: satu
    perintah aman yang seharusnya disetujui dan satu pengunggahan secret palsu yang seharusnya
    ditolak agar agen meminta konfirmasi
- Pengujian: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model baseline harness: `openai/gpt-5.6-luna`
- Default pemilihan kunci API OpenAI baru: `openai/gpt-5.6`
- Pemikiran default: `low`
- Override model: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Override pemikiran: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Pernyataan tingkat upaya model non-default:
  `OPENCLAW_LIVE_CODEX_HARNESS_EXPECTED_EFFORT=<level>`
- Override matriks: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Mode autentikasi: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (default) menggunakan
  login Codex yang disalin; `api-key` menggunakan `OPENAI_API_KEY` melalui app-server Codex.
- Pemeriksaan image opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Pemeriksaan MCP/alat opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Pemeriksaan Guardian opsional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Stres kelanjutan opsional: `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1` menambahkan
  empat giliran riwayat, lalu menutup dan memulai ulang Gateway serta app-server Codex
  sebanyak tiga kali sambil mewajibkan ID thread native dan riwayat percakapan
  yang sama. Override jumlah terbatas tersebut dengan
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_HISTORY_TURNS` (1-20) dan
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_RESTARTS` (1-10).
- Stres fan-out opsional: setel `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1`
  dan `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT` (1-12). Harness memulai
  setiap turunan secara serentak, menunggu setiap proses terminal, dan memverifikasi
  setiap balasan turunan unik serta identitas thread native.
- Stres Compaction opsional: `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1`
  menghasilkan output alat native terbatas, mewajibkan peristiwa Compaction otomatis,
  memverifikasi jumlah Compaction tersimpan dan ingatan penanda tersembunyi, memulai ulang
  Gateway serta app-server Codex fisik, lalu mengulangi gelombang output dan
  Compaction. Sesuaikan pekerjaan terbatas dengan
  `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS_TURNS` (1-8) dan
  `OPENCLAW_LIVE_CODEX_HARNESS_LARGE_OUTPUT_BYTES` (100000-1000000).
- Pemeriksaan penolakan relay loop opsional:
  `OPENCLAW_LIVE_CODEX_HARNESS_DISABLE_LOOP_RELAY=1`
- Preferensi pemikiran yang diminta dapat dipetakan ke tingkat upaya terdekat yang ditawarkan
  Codex untuk model tersebut. Misalnya, Luna memetakan `minimal` ke `low`.
- Model katalog Codex yang dikenal memperoleh tingkat upaya native yang tepat tersebut secara otomatis.
  Override model yang tidak dikenal harus menyatakan tingkat upaya hasil pemetaan yang diharapkan.
- Smoke memaksakan penyedia/model `agentRuntime.id: "codex"` agar harness Codex
  yang rusak tidak dapat lolos dengan diam-diam beralih kembali ke OpenClaw.
- Autentikasi: autentikasi app-server Codex dari login langganan Codex lokal, atau
  `OPENAI_API_KEY` saat `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker dapat
  menyalin `~/.codex/auth.json` dan `~/.codex/config.toml` untuk proses langganan.

Resep lokal:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Resep Docker:

```bash
pnpm test:docker:live-codex-harness
```

Stres mulai ulang dan riwayat:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
pnpm test:docker:live-codex-harness
```

Stres fan-out, output besar, Compaction, dan mulai ulang:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT=8 \
  OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1 \
  pnpm test:docker:live-codex-harness
```

Matriks Codex native GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Default kunci API OpenAI baru:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Bukti ini membiarkan `OPENCLAW_LIVE_GATEWAY_MODELS` tidak disetel, me-resolve model melalui
seam pemilihan inferensi onboarding baru, memastikan `openai/gpt-5.6`, lalu
menjalankan giliran Gateway nyata dengan model yang telah di-resolve tersebut.

Matriks OpenClaw tertanam GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-codex-harness-docker.sh`.
- Runner ini meneruskan `OPENAI_API_KEY`, menyalin file autentikasi Codex CLI jika ada, menginstal
  `@openai/codex` ke dalam prefiks npm terpasang
  yang dapat ditulis, menyiapkan pohon sumber, lalu hanya menjalankan pengujian langsung harness Codex.
- Docker mengaktifkan probe image, MCP/alat, dan Guardian secara default. Tetapkan
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` saat Anda memerlukan proses debug
  yang lebih sempit.
- Docker menggunakan konfigurasi runtime Codex eksplisit yang sama, sehingga alias lama atau fallback OpenClaw
  tidak dapat menyembunyikan regresi harness Codex.
- Target Matrix berjalan secara berurutan dalam satu kontainer. Skrip Docker menyesuaikan
  batas waktu default 35 menit berdasarkan jumlah target; setiap batas waktu shell luar atau CI harus
  mengizinkan total waktu yang sama. CI kanonis menempatkan setiap target GPT-5.6 dalam shard terpisah.

### Resep langsung yang direkomendasikan

Daftar izin yang sempit dan eksplisit paling cepat dan paling minim kegagalan sesekali:

- Model tunggal, langsung (tanpa Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil langsung model kecil:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil Gateway model kecil:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Model tunggal, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan alat di beberapa penyedia:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke langsung Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Fokus Google (kunci API Gemini + Antigravity):
  - Gemini (kunci API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke pemikiran adaptif Google (`qa manual` dari CLI QA privat - memerlukan `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` dan checkout sumber; lihat [ringkasan QA](/id/concepts/qa-e2e-automation)):
  - Default dinamis Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Anggaran dinamis Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Catatan:

- `google/...` menggunakan API Gemini (kunci API).
- `google-antigravity/...` menggunakan jembatan OAuth Antigravity (endpoint agen bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan Gemini CLI lokal di mesin Anda (autentikasi terpisah + kekhasan alat).
- API Gemini dibandingkan dengan Gemini CLI:
  - API: OpenClaw memanggil API Gemini yang dihosting Google melalui HTTP (kunci API / autentikasi profil); inilah yang dimaksud sebagian besar pengguna dengan "Gemini".
  - CLI: OpenClaw menjalankan biner `gemini` lokal melalui shell; biner ini memiliki autentikasinya sendiri dan dapat berperilaku berbeda (streaming/dukungan alat/ketidakselarasan versi).

## Langsung: matriks model (yang kami cakup)

Pengujian langsung bersifat opsional, sehingga tidak ada "daftar model CI" yang tetap. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (dan alias `all`-nya) menjalankan daftar prioritas terkurasi dari `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` di `src/agents/live-model-filter.ts`, dalam urutan prioritas berikut:

| Penyedia/model                                | Catatan    |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | API Gemini |
| `google/gemini-3.5-flash`                     | API Gemini |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k3`                            |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

Daftar **model kecil** terkurasi (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`), dari `SMALL_LIVE_MODEL_PRIORITY`:

| Penyedia/model               |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Catatan tentang daftar modern:

- Penyedia `codex` dan `codex-cli` dikecualikan dari penyisiran modern default (keduanya mencakup perilaku backend CLI/ACP yang diuji secara terpisah di atas). `openai/gpt-5.5` sendiri dirutekan melalui harness app-server Codex secara default; lihat [Langsung: smoke harness app-server Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter`, dan `xai` hanya menjalankan ID model yang dikurasi secara eksplisit dalam penyisiran modern (tanpa perluasan otomatis "setiap model dari penyedia ini").
- Sertakan setidaknya satu model berkemampuan image (varian vision keluarga Claude/Gemini/OpenAI, dll.) dalam `OPENCLAW_LIVE_GATEWAY_MODELS` untuk menjalankan probe image.

Jalankan smoke Gateway dengan alat + image pada kumpulan lintas penyedia yang dipilih secara khusus:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Cakupan tambahan opsional di luar daftar terkurasi (baik untuk dimiliki, pilih model berkemampuan "alat" yang telah Anda aktifkan):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (jika Anda memiliki akses)
- LM Studio: `lmstudio/...` (lokal; pemanggilan alat bergantung pada mode API)

### Agregator / Gateway alternatif

Jika Anda telah mengaktifkan kunci, Anda juga dapat menguji melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat berkemampuan alat+image)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (autentikasi melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Penyedia lain yang dapat Anda sertakan dalam matriks langsung (jika Anda memiliki kredensial/konfigurasi):

- Bawaan: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Melalui `models.providers` (endpoint khusus): `minimax` (cloud/API), ditambah proxy apa pun yang kompatibel dengan OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, dll.)

<Tip>
Jangan melakukan hardcode "semua model" dalam dokumentasi. Daftar otoritatif adalah apa pun yang dikembalikan oleh `discoverModels(...)` di mesin Anda ditambah kunci apa pun yang tersedia.
</Tip>

## Kredensial (jangan pernah di-commit)

Pengujian langsung menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktisnya:

- Jika CLI berfungsi, pengujian langsung semestinya menemukan kunci yang sama.
- Jika pengujian langsung menyatakan "tidak ada kredensial", lakukan debug dengan cara yang sama seperti Anda melakukan debug `openclaw models list` / pemilihan model.

- Profil autentikasi per agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah arti "kunci profil" dalam pengujian langsung)
- Konfigurasi: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori OAuth lama: `~/.openclaw/credentials/` (disalin ke home langsung yang telah disiapkan jika ada, tetapi bukan penyimpanan kunci profil utama)
- Proses langsung lokal menyalin konfigurasi aktif (dengan penimpaan `agents.*.workspace` / `agentDir` dihapus) dan `auth-profiles.json` setiap agen - bukan bagian lain dari direktori agen tersebut, sehingga data `workspace/` dan `sandboxes/` tidak pernah mencapai home yang telah disiapkan - beserta direktori `credentials/` lama dan file/direktori autentikasi CLI eksternal yang didukung (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) ke home pengujian sementara.

Jika Anda ingin mengandalkan kunci env, ekspor kunci tersebut sebelum pengujian lokal atau gunakan
runner Docker di bawah dengan `OPENCLAW_PROFILE_FILE` yang eksplisit.

## Deepgram langsung (transkripsi audio)

- Pengujian: `extensions/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Coding plan BytePlus langsung

- Pengujian: `extensions/byteplus/live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Penimpaan model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Media alur kerja ComfyUI langsung

- Pengujian: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menjalankan jalur image, video, dan `music_generate` comfy bawaan
  - Melewati setiap kemampuan kecuali `plugins.entries.comfy.config.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman alur kerja comfy, polling, unduhan, atau pendaftaran Plugin

## Pembuatan image langsung

- Pengujian: `test/image-generation.runtime.live.test.ts`
- Perintah: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Menguraikan setiap Plugin penyedia pembuatan image yang terdaftar
  - Menggunakan variabel env penyedia yang telah diekspor sebelum melakukan probe
  - Secara default menggunakan kunci API langsung/env sebelum profil autentikasi tersimpan, sehingga kunci pengujian kedaluwarsa di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Menjalankan setiap penyedia yang dikonfigurasi melalui runtime pembuatan image bersama:
    - `<provider>:generate`
    - `<provider>:edit` ketika penyedia menyatakan dukungan pengeditan
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
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan penimpaan khusus env

Untuk jalur CLI yang dirilis, tambahkan smoke `infer` setelah pengujian langsung
penyedia/runtime berhasil:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image \
  --prompt "Gambar uji datar minimal: satu persegi biru pada latar belakang putih, tanpa teks." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Ini mencakup penguraian argumen CLI, resolusi konfigurasi/agen default, aktivasi
Plugin bawaan, runtime pembuatan image bersama, dan permintaan penyedia
langsung. Dependensi Plugin diharapkan sudah tersedia sebelum pemuatan runtime.

## Pembuatan musik langsung

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menguji jalur penyedia pembuatan musik bawaan bersama
  - Saat ini mencakup `fal`, `google`, `minimax`, dan `openrouter`
  - Menggunakan variabel lingkungan penyedia yang telah diekspor sebelum melakukan pemeriksaan
  - Secara default menggunakan kunci API langsung/dari lingkungan sebelum profil autentikasi tersimpan, sehingga kunci pengujian kedaluwarsa di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia yang tidak memiliki autentikasi/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan jika tersedia:
    - `generate` dengan masukan berupa prompt saja
    - `edit` ketika penyedia mendeklarasikan `capabilities.edit.enabled`
  - `comfy` memiliki berkas langsung terpisah sendiri, bukan sweep bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi dari penyimpanan profil dan mengabaikan penggantian khusus lingkungan

## Pembuatan video langsung

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menguji jalur penyedia pembuatan video bawaan bersama di seluruh `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Secara default menggunakan jalur smoke yang aman untuk rilis: satu permintaan teks-ke-video per penyedia, prompt lobster berdurasi satu detik, dan batas operasi per penyedia dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default)
  - Melewati FAL secara default karena latensi antrean di sisi penyedia dapat mendominasi waktu rilis; berikan `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (atau kosongkan daftar lewati) untuk menjalankannya secara eksplisit
  - Menggunakan variabel lingkungan penyedia yang telah diekspor sebelum melakukan pemeriksaan
  - Secara default menggunakan kunci API langsung/dari lingkungan sebelum profil autentikasi tersimpan, sehingga kunci pengujian kedaluwarsa di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia yang tidak memiliki autentikasi/profil/model yang dapat digunakan
  - Secara default hanya menjalankan `generate`
  - Atur `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transformasi yang dideklarasikan jika tersedia:
    - `imageToVideo` ketika penyedia mendeklarasikan `capabilities.imageToVideo.enabled` dan penyedia/model yang dipilih menerima masukan gambar lokal berbasis buffer dalam sweep bersama
    - `videoToVideo` ketika penyedia mendeklarasikan `capabilities.videoToVideo.enabled` dan penyedia/model yang dipilih menerima masukan video lokal berbasis buffer dalam sweep bersama
  - Penyedia `imageToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sweep bersama:
    - `vydra` (masukan gambar lokal berbasis buffer tidak didukung di lane ini)
  - Cakupan khusus penyedia Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Berkas tersebut menjalankan teks-ke-video `veo3` serta lane gambar-ke-video `kling` yang secara default menggunakan fixture URL gambar jarak jauh (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` untuk menggantinya).
  - Cakupan khusus penyedia xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Kasus klasik terlebih dahulu menghasilkan bingkai pertama PNG lokal berbentuk persegi, menghilangkan geometri, meminta klip gambar-ke-video berdurasi satu detik, melakukan polling hingga selesai, dan memverifikasi buffer yang diunduh.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Kasus 1.5 menghasilkan bingkai pertama PNG lokal, meminta klip gambar-ke-video 1080P berdurasi satu detik, melakukan polling hingga selesai, dan memverifikasi buffer yang diunduh.
  - Cakupan langsung `videoToVideo` saat ini:
    - `runway` hanya ketika model yang dipilih di-resolve menjadi `gen4_aleph`
  - Penyedia `videoToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sweep bersama:
    - `alibaba`, `google`, `openai`, `qwen`, `xai` karena jalur tersebut saat ini memerlukan URL referensi `http(s)` jarak jauh, bukan masukan lokal berbasis buffer
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap penyedia dalam sweep default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas setiap operasi penyedia dalam smoke run agresif
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi dari penyimpanan profil dan mengabaikan penggantian khusus lingkungan

## Harness media langsung

- Perintah: `pnpm test:live:media`
- Titik masuk: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, yang menjalankan `pnpm test:live -- <suite-test-file>` untuk setiap suite yang dipilih, sehingga perilaku Heartbeat dan mode senyap tetap konsisten dengan proses `pnpm test:live` lainnya.
- Tujuan:
  - Menjalankan suite langsung gambar, musik, dan video bersama melalui satu titik masuk asli repo
  - Memuat otomatis variabel lingkungan penyedia yang tidak tersedia dari `~/.profile`
  - Secara default mempersempit otomatis setiap suite ke penyedia yang saat ini memiliki autentikasi yang dapat digunakan
- Flag:
  - `--providers <csv>` filter penyedia global; `--image-providers` / `--music-providers` / `--video-providers` membatasi filter ke satu suite
  - `--all-providers` melewati filter otomatis berbasis autentikasi
  - `--allow-empty` keluar dengan `0` ketika pemfilteran tidak menyisakan penyedia yang dapat dijalankan
  - `--quiet` / `--no-quiet` diteruskan ke `test:live`
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Terkait

- [Pengujian](/id/help/testing) - suite unit, integrasi, QA, dan Docker
