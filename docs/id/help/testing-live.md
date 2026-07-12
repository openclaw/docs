---
read_when:
    - Menjalankan uji asap model langsung matriks / backend CLI / ACP / penyedia media
    - Men-debug penyelesaian kredensial pengujian langsung
    - Menambahkan pengujian langsung khusus penyedia baru
sidebarTitle: Live tests
summary: 'Pengujian langsung (yang mengakses jaringan): matriks model, backend CLI, ACP, penyedia media, kredensial'
title: 'Pengujian: rangkaian langsung'
x-i18n:
    generated_at: "2026-07-12T14:16:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Untuk mulai cepat, runner QA, rangkaian pengujian unit/integrasi, dan alur Docker, lihat
[Pengujian](/id/help/testing). Halaman ini membahas pengujian **langsung** (yang mengakses jaringan):
matriks model, backend CLI, ACP, penyedia media, dan penanganan kredensial.

## Langsung: perintah smoke lokal

Ekspor kunci penyedia yang diperlukan ke lingkungan proses sebelum menjalankan
pemeriksaan langsung ad hoc.

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

`voicecall smoke` merupakan simulasi kecuali `--yes` juga disertakan; gunakan `--yes` hanya
ketika Anda bermaksud melakukan panggilan sungguhan. Untuk Twilio, Telnyx, dan Plivo,
pemeriksaan kesiapan yang berhasil memerlukan URL webhook publik—URL loopback
lokal/pribadi ditolak karena penyedia tersebut tidak dapat menjangkaunya.

## Langsung: pemeriksaan menyeluruh kapabilitas Node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: menjalankan **setiap perintah yang saat ini ditawarkan** oleh Node Android yang terhubung dan memverifikasi perilaku kontrak perintah.
- Cakupan:
  - Penyiapan awal/manual (rangkaian pengujian tidak menginstal/menjalankan/memasangkan aplikasi).
  - Validasi `node.invoke` Gateway per perintah untuk Node Android yang dipilih.
- Penyiapan awal yang diperlukan:
  - Aplikasi Android sudah terhubung + dipasangkan ke Gateway.
  - Aplikasi tetap berada di latar depan.
  - Izin/persetujuan pengambilan diberikan untuk kapabilitas yang Anda harapkan berhasil.
- Penggantian target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail lengkap penyiapan Android: [Aplikasi Android](/id/platforms/android)

## Langsung: smoke model (kunci profil)

Pengujian model langsung dibagi menjadi dua lapisan agar kegagalan dapat diisolasi:

- "Model langsung" menunjukkan apakah penyedia/model dapat memberikan jawaban dengan kunci yang diberikan.
- "Smoke Gateway" menunjukkan apakah seluruh alur Gateway+agen berfungsi untuk model tersebut (sesi, riwayat, alat, kebijakan sandbox, dan sebagainya).

Daftar model terkurasi di bawah ini berada di `src/agents/live-model-filter.ts` dan
berubah seiring waktu; perlakukan larik di sana sebagai sumber kebenaran, bukan
halaman ini.

MiniMax M3 menggunakan `minimax/MiniMax-M3` sebagai referensi penyedia/model bawaannya.

### Lapisan 1: Penyelesaian model langsung (tanpa Gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Menginventarisasi model yang ditemukan
  - Menggunakan `getApiKeyForModel` untuk memilih model yang kredensialnya Anda miliki
  - Menjalankan penyelesaian kecil untuk setiap model (dan regresi tertarget jika diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - Atur `OPENCLAW_LIVE_MODELS=modern`, `small`, atau `all` (alias untuk `modern`) agar rangkaian pengujian ini benar-benar dijalankan; jika tidak, rangkaian ini dilewati, sehingga `pnpm test:live` saja tetap berfokus pada smoke Gateway.
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` menjalankan daftar prioritas terkurasi dengan sinyal tinggi (lihat [Langsung: matriks model](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` menjalankan daftar prioritas model kecil terkurasi
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk `modern`
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (daftar izin yang dipisahkan koma)
  - Eksekusi model kecil Ollama lokal menggunakan `http://127.0.0.1:11434` secara bawaan; atur `OPENCLAW_LIVE_OLLAMA_BASE_URL` hanya untuk endpoint LAN, khusus, atau Ollama Cloud.
  - Pemeriksaan menyeluruh modern/all dan small secara bawaan menggunakan panjang daftar terkurasi masing-masing sebagai batas; atur `OPENCLAW_LIVE_MAX_MODELS=0` untuk pemeriksaan menyeluruh profil terpilih yang lengkap atau angka positif untuk batas yang lebih kecil.
  - Pemeriksaan menyeluruh lengkap menggunakan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` sebagai batas waktu seluruh pengujian model langsung. Bawaan: 60 menit.
  - Probe model langsung secara bawaan berjalan dengan paralelisme 20 jalur; atur `OPENCLAW_LIVE_MODEL_CONCURRENCY` untuk menggantinya.
- Cara memilih penyedia:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (daftar izin yang dipisahkan koma)
- Sumber kunci:
  - Secara bawaan: penyimpanan profil dan fallback lingkungan
  - Atur `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk mewajibkan **penyimpanan profil** saja
- Alasan fitur ini tersedia:
  - Memisahkan "API penyedia rusak/kunci tidak valid" dari "alur agen Gateway rusak"
  - Memuat regresi kecil yang terisolasi (contoh: pemutaran ulang penalaran OpenAI Responses/Codex Responses + alur pemanggilan alat)

### Lapisan 2: Smoke Gateway + agen pengembangan (yang sebenarnya dilakukan oleh "@openclaw")

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Menjalankan Gateway dalam proses
  - Membuat/memodifikasi sesi `agent:dev:*` (penggantian model per eksekusi)
  - Mengiterasi model yang memiliki kunci dan memverifikasi:
    - respons yang "bermakna" (tanpa alat)
    - pemanggilan alat sungguhan berfungsi (probe baca)
    - probe alat tambahan opsional (probe eksekusi+baca)
    - jalur regresi OpenAI (hanya pemanggilan alat -> tindak lanjut) tetap berfungsi
- Detail probe (agar Anda dapat menjelaskan kegagalan dengan cepat):
  - Probe `read`: pengujian menulis berkas nonce di ruang kerja dan meminta agen untuk `read` berkas tersebut serta menggemakan kembali nonce.
  - Probe `exec+read`: pengujian meminta agen melakukan `exec` untuk menulis nonce ke berkas sementara, lalu melakukan `read` untuk membacanya kembali.
  - Probe gambar: pengujian melampirkan PNG yang dihasilkan (kucing + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `test/helpers/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Cara memilih model:
  - Bawaan: daftar prioritas terkurasi dengan sinyal tinggi (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` menjalankan daftar model kecil terkurasi melalui seluruh alur Gateway+agen
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk `modern`
  - Atau atur `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar yang dipisahkan koma) untuk mempersempit cakupan
  - Pemeriksaan menyeluruh Gateway modern/all dan small secara bawaan menggunakan panjang daftar terkurasi masing-masing sebagai batas; atur `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk pemeriksaan menyeluruh terpilih yang lengkap atau angka positif untuk batas yang lebih kecil.
- Cara memilih penyedia (hindari "semuanya melalui OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (daftar izin yang dipisahkan koma)
- Probe alat + gambar selalu aktif dalam pengujian langsung ini:
  - Probe `read` + probe `exec+read` (pengujian tekanan alat)
  - Probe gambar berjalan ketika model menyatakan dukungan input gambar
  - Alur (tingkat tinggi):
    - Pengujian menghasilkan PNG kecil dengan "CAT" + kode acak (`test/helpers/live-image-probe.ts`)
    - Mengirimkannya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mengurai lampiran menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agen tertanam meneruskan pesan pengguna multimodal ke model
    - Verifikasi: balasan memuat `cat` + kode tersebut (toleransi OCR: kesalahan kecil diperbolehkan)

<Tip>
Untuk melihat apa yang dapat Anda uji di mesin Anda (dan ID `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Langsung: smoke backend CLI (Claude, Gemini, atau CLI lokal lainnya)

- Pengujian: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: memvalidasi alur Gateway + agen menggunakan backend CLI lokal, tanpa menyentuh konfigurasi bawaan Anda.
- Bawaan smoke khusus backend berada bersama definisi `cli-backend.ts` milik Plugin pemiliknya.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Bawaan:
  - Penyedia/model bawaan: `claude-cli/claude-sonnet-4-6`
  - Perilaku perintah/argumen/gambar berasal dari metadata Plugin backend CLI pemiliknya.
- Penggantian (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran gambar sungguhan (jalur disuntikkan ke prompt). Dinonaktifkan secara bawaan dalam resep Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan jalur berkas gambar sebagai argumen CLI alih-alih injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol cara argumen gambar diteruskan ketika `IMAGE_ARG` ditetapkan.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur pelanjutan.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` untuk mengaktifkan probe kontinuitas sesi yang sama Claude Sonnet -> Opus ketika model yang dipilih mendukung target peralihan. Dinonaktifkan secara bawaan, termasuk dalam resep Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` untuk mengaktifkan probe loopback MCP/alat. Dinonaktifkan secara bawaan dalam resep Docker.

Contoh:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke konfigurasi MCP Gemini berbiaya rendah:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Ini tidak meminta Gemini menghasilkan respons. Pengujian ini menulis pengaturan sistem yang sama
seperti yang diberikan OpenClaw kepada Gemini, lalu menjalankan `gemini --debug mcp list` untuk membuktikan bahwa
server tersimpan dengan `transport: "streamable-http"` dinormalisasi ke bentuk MCP HTTP milik Gemini
dan dapat terhubung ke server MCP HTTP yang dapat dialirkan secara lokal.

Resep Docker:

```bash
pnpm test:docker:live-cli-backend
```

Resep Docker untuk satu penyedia:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Catatan:

- Runner Docker berada di `scripts/test-live-cli-backend-docker.sh`.
- Runner ini menjalankan smoke backend CLI langsung di dalam citra Docker repo sebagai pengguna non-root `node`.
- Runner ini menyelesaikan metadata smoke CLI dari Plugin pemiliknya, lalu menginstal paket CLI Linux yang sesuai (`@anthropic-ai/claude-code` atau `@google/gemini-cli`) ke prefiks dapat-tulis yang disimpan dalam cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (bawaan: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` bukan lagi backend CLI bawaan; sebagai gantinya, gunakan `openai/*` dengan runtime server aplikasi Codex (lihat [Langsung: smoke harness server aplikasi Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth langganan Claude Code portabel melalui `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Pertama, resep ini membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran backend CLI Gateway tanpa mempertahankan variabel lingkungan kunci API Anthropic. Jalur langganan ini menonaktifkan probe MCP/alat dan gambar Claude secara bawaan karena menggunakan batas pemakaian langganan yang sedang masuk dan Anthropic dapat mengubah perilaku penagihan serta pembatasan laju Claude Agent SDK / `claude -p` tanpa rilis OpenClaw.
- Claude dan Gemini mendukung kumpulan probe yang sama (giliran teks, klasifikasi gambar, pemanggilan alat MCP `cron`, kontinuitas peralihan model) melalui flag di atas, tetapi tidak ada probe tersebut yang berjalan secara bawaan—aktifkan sesuai kebutuhan melalui flag masing-masing.

## Langsung: keterjangkauan proksi HTTP/2 APNs

- Pengujian: `src/infra/push-apns-http2.live.test.ts`
- Tujuan: membuat tunnel melalui proksi HTTP CONNECT lokal menuju endpoint APNs sandbox Apple, mengirim permintaan validasi HTTP/2 APNs, dan memverifikasi bahwa respons nyata `403 InvalidProviderToken` dari Apple kembali melalui jalur proksi.
- Aktifkan:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Batas waktu opsional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Langsung: smoke pengikatan ACP (`/acp spawn ... --bind here`)

- Pengujian: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur pengikatan percakapan ACP yang sebenarnya dengan agen ACP langsung:
  - kirim `/acp spawn <agent> --bind here`
  - ikat percakapan kanal pesan sintetis di tempat
  - kirim tindak lanjut biasa pada percakapan yang sama
  - verifikasi bahwa tindak lanjut masuk ke transkrip sesi ACP yang terikat
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Nilai bawaan:
  - Agen ACP di Docker: `claude,codex,gemini`
  - Agen ACP untuk `pnpm test:live ...` langsung: `claude`
  - Kanal sintetis: konteks percakapan bergaya DM Slack
  - Backend ACP: `acpx`
- Penggantian:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (atau `on`/`true`/`yes`) untuk memaksa pemeriksaan gambar aktif; nilai lainnya memaksanya nonaktif. Secara bawaan dijalankan untuk setiap agen kecuali `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Catatan:
  - Jalur ini menggunakan permukaan `chat.send` Gateway dengan bidang rute asal sintetis khusus admin agar pengujian dapat melampirkan konteks kanal pesan tanpa berpura-pura melakukan pengiriman eksternal.
  - Ketika `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak ditetapkan, pengujian menggunakan registri agen bawaan Plugin `acpx` tertanam untuk agen perangkat uji ACP yang dipilih.
  - Pembuatan MCP Cron sesi terikat bersifat upaya terbaik secara bawaan karena perangkat uji ACP eksternal dapat membatalkan panggilan MCP setelah bukti pengikatan/gambar berhasil; tetapkan `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` agar pemeriksaan Cron pascapengikatan tersebut bersifat ketat.

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

- Pelaksana Docker berada di `scripts/test-live-acp-bind-docker.sh`.
- Secara bawaan, pelaksana menjalankan uji singkat pengikatan ACP terhadap kumpulan agen CLI langsung secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` untuk mempersempit matriks.
- Pelaksana menempatkan materi autentikasi CLI yang sesuai ke dalam kontainer, lalu memasang CLI langsung yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid melalui `https://app.factory.ai/cli`, `@google/gemini-cli`, atau `opencode-ai`) jika belum tersedia. Backend ACP itu sendiri adalah paket `acpx/runtime` tertanam dari Plugin resmi `acpx`.
- Varian Docker Droid menempatkan `~/.factory` untuk pengaturan, meneruskan `FACTORY_API_KEY`, dan mewajibkan kunci API tersebut karena autentikasi OAuth/gantungan kunci Factory lokal tidak dapat dipindahkan ke dalam kontainer. Varian ini menggunakan entri registri bawaan ACPX `droid exec --output-format acp`.
- Varian Docker OpenCode adalah jalur regresi agen tunggal yang ketat. Varian ini menulis model bawaan sementara `OPENCODE_CONFIG_CONTENT` dari `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (bawaan `opencode/kimi-k2.6`).
- Panggilan CLI `acpx` langsung hanya merupakan jalur manual/solusi sementara untuk membandingkan perilaku di luar Gateway. Uji singkat pengikatan ACP Docker menjalankan backend runtime `acpx` tertanam milik OpenClaw.

## Langsung: uji singkat perangkat uji server aplikasi Codex

- Tujuan: memvalidasi perangkat uji Codex milik Plugin melalui metode Gateway
  `agent` normal:
  - muat Plugin `codex` terpaket
  - pilih model OpenAI melalui `/model <ref> --runtime codex`
  - kirim giliran pertama agen Gateway dengan tingkat penalaran yang diminta
  - kirim giliran kedua ke sesi OpenClaw yang sama dan verifikasi bahwa utas
    server aplikasi dapat dilanjutkan
  - jalankan `/codex status` dan `/codex models` melalui jalur perintah Gateway
    yang sama
  - secara opsional jalankan dua pemeriksaan shell tereskalasi yang ditinjau Guardian: satu
    perintah aman yang semestinya disetujui dan satu pengunggahan rahasia palsu yang semestinya
    ditolak sehingga agen meminta konfirmasi
- Pengujian: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model dasar perangkat uji: `openai/gpt-5.6-luna`
- Nilai bawaan pemilihan kunci API OpenAI baru: `openai/gpt-5.6`
- Penalaran bawaan: `low`
- Penggantian model: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Penggantian penalaran: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Penggantian matriks: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Mode autentikasi: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (bawaan) menggunakan
  proses masuk Codex yang disalin; `api-key` menggunakan `OPENAI_API_KEY` melalui server aplikasi Codex.
- Pemeriksaan gambar opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Pemeriksaan MCP/alat opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Pemeriksaan Guardian opsional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Uji singkat ini memaksa penyedia/model `agentRuntime.id: "codex"` agar perangkat uji Codex
  yang rusak tidak dapat lolos dengan diam-diam beralih kembali ke OpenClaw.
- Autentikasi: autentikasi server aplikasi Codex dari proses masuk langganan Codex lokal, atau
  `OPENAI_API_KEY` ketika `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker dapat
  menyalin `~/.codex/auth.json` dan `~/.codex/config.toml` untuk proses dengan langganan.

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

Matriks Codex bawaan GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Nilai bawaan kunci API OpenAI baru:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Bukti ini membiarkan `OPENCLAW_LIVE_GATEWAY_MODELS` tidak ditetapkan, menyelesaikan model melalui
lapisan pemilihan inferensi orientasi awal yang baru, memastikan `openai/gpt-5.6`, lalu
menjalankan giliran Gateway nyata dengan model yang telah diselesaikan tersebut.

Matriks OpenClaw tertanam GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Catatan Docker:

- Pelaksana Docker berada di `scripts/test-live-codex-harness-docker.sh`.
- Pelaksana meneruskan `OPENAI_API_KEY`, menyalin berkas autentikasi CLI Codex jika tersedia, memasang
  `@openai/codex` ke prefiks npm terpasang yang dapat ditulis,
  menempatkan pohon sumber, lalu hanya menjalankan pengujian langsung perangkat uji Codex.
- Docker mengaktifkan pemeriksaan gambar, MCP/alat, dan Guardian secara bawaan. Tetapkan
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ketika Anda memerlukan proses awakutu
  yang lebih sempit.
- Docker menggunakan konfigurasi runtime Codex eksplisit yang sama, sehingga alias lama atau pengalihan kembali OpenClaw
  tidak dapat menyembunyikan regresi perangkat uji Codex.
- Target matriks dijalankan secara berurutan dalam satu kontainer. Skrip Docker menyesuaikan
  batas waktu bawaan 35 menit berdasarkan jumlah target; batas waktu shell luar atau CI harus
  mengizinkan total yang sama. CI kanonis menempatkan setiap target GPT-5.6 dalam serpihan terpisah.

### Resep langsung yang disarankan

Daftar izin yang sempit dan eksplisit paling cepat serta paling minim kegagalan acak:

- Model tunggal, langsung (tanpa Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil model kecil langsung:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil Gateway model kecil:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Uji singkat API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Model tunggal, uji singkat Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan alat di beberapa penyedia:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Uji singkat langsung Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Fokus Google (kunci API Gemini + Antigravity):
  - Gemini (kunci API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Uji singkat penalaran adaptif Google (`qa manual` dari CLI QA privat—memerlukan `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` dan pemeriksaan sumber; lihat [ikhtisar QA](/id/concepts/qa-e2e-automation)):
  - Nilai bawaan dinamis Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Anggaran dinamis Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Catatan:

- `google/...` menggunakan API Gemini (kunci API).
- `google-antigravity/...` menggunakan jembatan OAuth Antigravity (titik akhir agen bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan CLI Gemini lokal di mesin Anda (autentikasi terpisah + keunikan peralatan).
- API Gemini dibandingkan CLI Gemini:
  - API: OpenClaw memanggil API Gemini yang dihosting Google melalui HTTP (kunci API/autentikasi profil); inilah yang dimaksud sebagian besar pengguna dengan "Gemini".
  - CLI: OpenClaw menjalankan biner `gemini` lokal melalui shell; biner ini memiliki autentikasi sendiri dan dapat berperilaku berbeda (dukungan aliran/alat/perbedaan versi).

## Langsung: matriks model (yang kami cakup)

Pengujian langsung bersifat pilihan, sehingga tidak ada "daftar model CI" tetap. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (dan alias `all` masing-masing) menjalankan daftar prioritas terkurasi dari `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` di `src/agents/live-model-filter.ts`, dalam urutan prioritas berikut:

| Penyedia/model                               | Catatan    |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
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

Daftar **model kecil** yang dikurasi (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`), dari `SMALL_LIVE_MODEL_PRIORITY`:

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

- Penyedia `codex` dan `codex-cli` dikecualikan dari penyisiran modern bawaan (keduanya mencakup perilaku backend CLI/ACP, yang diuji secara terpisah di atas). `openai/gpt-5.5` sendiri secara bawaan dirutekan melalui harness server aplikasi Codex; lihat [Live: uji asap harness server aplikasi Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter`, dan `xai` hanya menjalankan ID model yang dikurasi secara eksplisit dalam penyisiran modern (tanpa perluasan otomatis "setiap model dari penyedia ini").
- Sertakan setidaknya satu model berkemampuan gambar (varian vision keluarga Claude/Gemini/OpenAI, dan sebagainya) dalam `OPENCLAW_LIVE_GATEWAY_MODELS` untuk menjalankan probe gambar.

Jalankan uji asap Gateway dengan alat + gambar pada sekumpulan lintas penyedia yang dipilih secara manual:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Cakupan tambahan opsional di luar daftar yang dikurasi (baik untuk dimiliki, pilih model berkemampuan "alat" yang telah Anda aktifkan):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (jika Anda memiliki akses)
- LM Studio: `lmstudio/...` (lokal; pemanggilan alat bergantung pada mode API)

### Agregator / Gateway alternatif

Jika Anda telah mengaktifkan kunci, Anda juga dapat menguji melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat berkemampuan alat+gambar)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (autentikasi melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Penyedia lain yang dapat Anda sertakan dalam matriks live (jika Anda memiliki kredensial/konfigurasi):

- Bawaan: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Melalui `models.providers` (endpoint khusus): `minimax` (cloud/API), serta proksi apa pun yang kompatibel dengan OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, dan sebagainya)

<Tip>
Jangan melakukan hardcode "semua model" dalam dokumentasi. Daftar otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` pada mesin Anda beserta kunci apa pun yang tersedia.
</Tip>

## Kredensial (jangan pernah di-commit)

Pengujian live menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktis:

- Jika CLI berfungsi, pengujian live seharusnya menemukan kunci yang sama.
- Jika pengujian live menyatakan "tidak ada kredensial", lakukan debug dengan cara yang sama seperti saat men-debug `openclaw models list` / pemilihan model.

- Profil autentikasi per agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah yang dimaksud dengan "kunci profil" dalam pengujian live)
- Konfigurasi: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori OAuth lama: `~/.openclaw/credentials/` (disalin ke direktori home live yang disiapkan jika tersedia, tetapi bukan penyimpanan utama kunci profil)
- Proses live lokal menyalin konfigurasi aktif (dengan penggantian `agents.*.workspace` / `agentDir` dihapus) dan `auth-profiles.json` milik setiap agen—bukan bagian lain dari direktori agen tersebut, sehingga data `workspace/` dan `sandboxes/` tidak pernah mencapai direktori home yang disiapkan—serta direktori lama `credentials/` dan berkas/direktori autentikasi CLI eksternal yang didukung (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) ke direktori home pengujian sementara.

Jika Anda ingin mengandalkan kunci lingkungan, ekspor kunci tersebut sebelum pengujian lokal atau gunakan
runner Docker di bawah dengan `OPENCLAW_PROFILE_FILE` yang eksplisit.

## Deepgram live (transkripsi audio)

- Pengujian: `extensions/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Paket pengodean BytePlus live

- Pengujian: `extensions/byteplus/live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Penggantian model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Media alur kerja ComfyUI live

- Pengujian: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menjalankan jalur gambar, video, dan `music_generate` comfy yang dibundel
  - Melewati setiap kemampuan kecuali `plugins.entries.comfy.config.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman alur kerja comfy, polling, pengunduhan, atau pendaftaran plugin

## Pembuatan gambar live

- Pengujian: `test/image-generation.runtime.live.test.ts`
- Perintah: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Menginventarisasi setiap Plugin penyedia pembuatan gambar yang terdaftar
  - Menggunakan variabel lingkungan penyedia yang telah diekspor sebelum melakukan probe
  - Secara bawaan menggunakan kunci API live/lingkungan mendahului profil autentikasi tersimpan, sehingga kunci pengujian kedaluwarsa dalam `auth-profiles.json` tidak menyamarkan kredensial shell yang sebenarnya
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Menjalankan setiap penyedia yang dikonfigurasi melalui runtime pembuatan gambar bersama:
    - `<provider>:generate`
    - `<provider>:edit` ketika penyedia menyatakan dukungan pengeditan
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
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan penggantian yang hanya berasal dari lingkungan

Untuk jalur CLI yang didistribusikan, tambahkan uji asap `infer` setelah pengujian live
penyedia/runtime berhasil:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Gambar uji datar minimal: satu persegi biru pada latar belakang putih, tanpa teks." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Ini mencakup penguraian argumen CLI, resolusi konfigurasi/agen bawaan, aktivasi
Plugin yang dibundel, runtime pembuatan gambar bersama, dan permintaan penyedia
live. Dependensi Plugin diharapkan telah tersedia sebelum pemuatan runtime.

## Pembuatan musik live

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menjalankan jalur penyedia pembuatan musik bersama yang dibundel
  - Saat ini mencakup `fal`, `google`, `minimax`, dan `openrouter`
  - Menggunakan variabel lingkungan penyedia yang telah diekspor sebelum melakukan probe
  - Secara bawaan menggunakan kunci API live/lingkungan mendahului profil autentikasi tersimpan, sehingga kunci pengujian kedaluwarsa dalam `auth-profiles.json` tidak menyamarkan kredensial shell yang sebenarnya
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dinyatakan jika tersedia:
    - `generate` dengan masukan hanya prompt
    - `edit` ketika penyedia menyatakan `capabilities.edit.enabled`
  - `comfy` memiliki berkas live terpisah sendiri, bukan penyisiran bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan penggantian yang hanya berasal dari lingkungan

## Pembuatan video live

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menguji jalur penyedia pembuatan video bawaan bersama pada `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Secara default menggunakan jalur smoke yang aman untuk rilis: satu permintaan teks-ke-video per penyedia, prompt lobster berdurasi satu detik, dan batas operasi per penyedia dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (secara default `180000`)
  - Secara default melewati FAL karena latensi antrean di sisi penyedia dapat mendominasi waktu rilis; teruskan `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (atau kosongkan daftar lewati) untuk menjalankannya secara eksplisit
  - Menggunakan variabel lingkungan penyedia yang sudah diekspor sebelum melakukan pemeriksaan
  - Secara default mendahulukan kunci API langsung/dari lingkungan daripada profil autentikasi tersimpan, sehingga kunci pengujian kedaluwarsa di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Secara default hanya menjalankan `generate`
  - Atur `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk turut menjalankan mode transformasi yang dideklarasikan jika tersedia:
    - `imageToVideo` ketika penyedia mendeklarasikan `capabilities.imageToVideo.enabled` dan penyedia/model yang dipilih menerima masukan gambar lokal berbasis buffer dalam pengujian menyeluruh bersama
    - `videoToVideo` ketika penyedia mendeklarasikan `capabilities.videoToVideo.enabled` dan penyedia/model yang dipilih menerima masukan video lokal berbasis buffer dalam pengujian menyeluruh bersama
  - Penyedia `imageToVideo` yang saat ini dideklarasikan tetapi dilewati dalam pengujian menyeluruh bersama:
    - `vydra` (masukan gambar lokal berbasis buffer tidak didukung dalam jalur ini)
  - Cakupan khusus penyedia Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Berkas tersebut menjalankan teks-ke-video `veo3` beserta jalur gambar-ke-video `kling` yang secara default menggunakan fixture URL gambar jarak jauh (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` untuk menggantinya).
  - Cakupan khusus penyedia xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Kasus klasik terlebih dahulu menghasilkan bingkai pertama PNG lokal berbentuk persegi, menghilangkan geometri, meminta klip gambar-ke-video berdurasi satu detik, melakukan polling hingga selesai, dan memverifikasi buffer yang diunduh.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Kasus 1.5 menghasilkan bingkai pertama PNG lokal, meminta klip gambar-ke-video 1080P berdurasi satu detik, melakukan polling hingga selesai, dan memverifikasi buffer yang diunduh.
  - Cakupan langsung `videoToVideo` saat ini:
    - `runway` hanya ketika model yang dipilih ditetapkan sebagai `gen4_aleph`
  - Penyedia `videoToVideo` yang saat ini dideklarasikan tetapi dilewati dalam pengujian menyeluruh bersama:
    - `alibaba`, `google`, `openai`, `qwen`, `xai` karena jalur tersebut saat ini memerlukan URL referensi `http(s)` jarak jauh, bukan masukan lokal berbasis buffer
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap penyedia dalam pengujian menyeluruh default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas setiap operasi penyedia bagi pengujian smoke agresif
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksakan autentikasi penyimpanan profil dan mengabaikan penggantian yang hanya berasal dari lingkungan

## Harness langsung media

- Perintah: `pnpm test:live:media`
- Titik masuk: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, yang menjalankan `pnpm test:live -- <suite-test-file>` untuk setiap rangkaian yang dipilih, sehingga perilaku heartbeat dan mode senyap tetap konsisten dengan eksekusi `pnpm test:live` lainnya.
- Tujuan:
  - Menjalankan rangkaian langsung bersama untuk gambar, musik, dan video melalui satu titik masuk bawaan repositori
  - Memuat otomatis variabel lingkungan penyedia yang belum tersedia dari `~/.profile`
  - Secara default mempersempit setiap rangkaian secara otomatis ke penyedia yang saat ini memiliki autentikasi yang dapat digunakan
- Flag:
  - `--providers <csv>` filter penyedia global; `--image-providers` / `--music-providers` / `--video-providers` membatasi filter ke satu rangkaian
  - `--all-providers` melewati filter otomatis berbasis autentikasi
  - `--allow-empty` keluar dengan kode `0` ketika pemfilteran tidak menyisakan penyedia yang dapat dijalankan
  - `--quiet` / `--no-quiet` diteruskan ke `test:live`
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Terkait

- [Pengujian](/id/help/testing) - rangkaian unit, integrasi, QA, dan Docker
