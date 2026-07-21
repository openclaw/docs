---
read_when:
    - Menjalankan smoke test model langsung / backend CLI / ACP / penyedia media
    - Men-debug resolusi kredensial pengujian langsung
    - Menambahkan pengujian langsung baru khusus penyedia
sidebarTitle: Live tests
summary: 'Pengujian langsung (yang mengakses jaringan): matriks model, backend CLI, ACP, penyedia media, kredensial'
title: 'Pengujian: rangkaian pengujian langsung'
x-i18n:
    generated_at: "2026-07-21T12:56:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: da7f65c0d5e9467e600f6ef6bc2fb5bc6c6a2fd3555e942b15eaac6e9c01724b
    source_path: help/testing-live.md
    workflow: 16
---

Untuk memulai dengan cepat, runner QA, rangkaian pengujian unit/integrasi, dan alur Docker, lihat
[Pengujian](/id/help/testing). Halaman ini membahas pengujian **live** (yang mengakses jaringan):
matriks model, backend CLI, ACP, penyedia media, dan penanganan kredensial.

## Pengujian live vs gateway nyata Anda

Rangkaian pengujian live dan smoke ad hoc tidak boleh mengganggu gateway yang sudah
melayani lalu lintas nyata (milik Anda atau operator lain):

- Gunakan gateway Anda sendiri: gunakan gateway dalam proses (Lapisan 2 di bawah) atau mulai
  instans pengembangan dengan direktori status terisolasi (`OPENCLAW_STATE_DIR=<scratch>`) dan
  port yang tersedia. Jangan bind port gateway default (18789) saat gateway nyata
  sedang berjalan di port tersebut.
- Jangan `openclaw gateway stop`/`restart` (atau padanan `launchctl`/`systemctl`/tmux)
  layanan yang tidak Anda mulai dalam sesi ini — itu adalah instans live milik
  operator. Dapatkan persetujuan eksplisit terlebih dahulu.
- Memerlukan data realistis? Salin status/DB live ke direktori status pengembangan Anda dan lakukan pengujian
  terhadap salinan tersebut. Migrasi langsung pada status gateway live juga memerlukan
  persetujuan eksplisit.

## Live: perintah smoke lokal

Ekspor kunci penyedia yang diperlukan ke lingkungan proses sebelum menjalankan pemeriksaan
live ad hoc.

Smoke media yang aman:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "Smoke live OpenClaw." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke kesiapan panggilan suara yang aman:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` adalah simulasi kecuali `--yes` juga disertakan; gunakan `--yes` hanya
saat Anda bermaksud melakukan panggilan nyata. Untuk Twilio, Telnyx, dan Plivo,
pemeriksaan kesiapan yang berhasil memerlukan URL webhook publik - URL loopback
lokal/pribadi ditolak karena penyedia tersebut tidak dapat mengaksesnya.

## Live: penyisiran kemampuan node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: panggil **setiap perintah yang saat ini diiklankan** oleh node Android yang terhubung dan pastikan perilaku kontrak perintah.
- Cakupan:
  - Penyiapan manual dengan prasyarat (rangkaian pengujian tidak menginstal/menjalankan/memasangkan aplikasi).
  - Validasi `node.invoke` Gateway per perintah untuk node Android yang dipilih.
- Penyiapan awal yang diperlukan:
  - Aplikasi Android sudah terhubung + dipasangkan ke Gateway.
  - Aplikasi tetap berada di latar depan.
  - Izin/persetujuan pengambilan diberikan untuk kemampuan yang Anda harapkan lulus.
- Penimpaan target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail lengkap penyiapan Android: [Aplikasi Android](/id/platforms/android)

## Live: smoke model (kunci profil)

Pengujian model live dibagi menjadi dua lapisan agar kegagalan dapat diisolasi:

- "Model langsung" menunjukkan apakah penyedia/model dapat memberikan jawaban dengan kunci yang diberikan.
- "Smoke Gateway" menunjukkan apakah seluruh pipeline Gateway+agen berfungsi untuk model tersebut (sesi, riwayat, alat, kebijakan sandbox, dan sebagainya).

Daftar model pilihan di bawah berada di `src/agents/live-model-filter.ts` dan
berubah seiring waktu; perlakukan larik di sana sebagai sumber kebenaran, bukan halaman
ini.

MiniMax M3 menggunakan `minimax/MiniMax-M3` sebagai referensi penyedia/model default-nya.

### Lapisan 1: Penyelesaian model langsung (tanpa Gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Enumerasi model yang ditemukan
  - Gunakan `getApiKeyForModel` untuk memilih model yang kredensialnya Anda miliki
  - Jalankan penyelesaian kecil per model (dan regresi tertarget jika diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - Tetapkan `OPENCLAW_LIVE_MODELS=modern`, `small`, atau `all` (alias untuk `modern`) agar rangkaian pengujian ini benar-benar berjalan; jika tidak, rangkaian akan dilewati, sehingga `pnpm test:live` sendiri tetap berfokus pada smoke Gateway.
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` menjalankan daftar prioritas pilihan dengan sinyal tinggi (lihat [Live: matriks model](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` menjalankan daftar prioritas model kecil pilihan
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk `modern`
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (daftar izin yang dipisahkan koma)
  - Proses model kecil Ollama lokal secara default menggunakan `http://127.0.0.1:11434`; tetapkan `OPENCLAW_LIVE_OLLAMA_BASE_URL` hanya untuk endpoint LAN, kustom, atau Ollama Cloud.
  - Penyisiran modern/semua dan kecil secara default menggunakan panjang daftar pilihannya sebagai batas; tetapkan `OPENCLAW_LIVE_MAX_MODELS=0` untuk penyisiran profil terpilih yang menyeluruh atau angka positif untuk batas yang lebih kecil.
  - Penyisiran menyeluruh menggunakan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` untuk batas waktu seluruh pengujian model langsung. Default: 60 menit.
  - Probe model langsung secara default berjalan dengan paralelisme 20 arah; tetapkan `OPENCLAW_LIVE_MODEL_CONCURRENCY` untuk menimpanya.
- Cara memilih penyedia:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (daftar izin yang dipisahkan koma)
- Sumber kunci:
  - Secara default: penyimpanan profil dan fallback lingkungan
  - Tetapkan `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memberlakukan **penyimpanan profil** saja
- Alasan keberadaannya:
  - Memisahkan "API penyedia rusak / kunci tidak valid" dari "pipeline agen Gateway rusak"
  - Berisi regresi kecil dan terisolasi (contoh: pemutaran ulang penalaran OpenAI Responses/Codex Responses + alur pemanggilan alat)

### Lapisan 2: Smoke Gateway + agen pengembangan (yang sebenarnya dilakukan "@openclaw")

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Jalankan Gateway dalam proses
  - Buat/tambal sesi `agent:dev:*` (penimpaan model per proses)
  - Iterasikan model yang memiliki kunci dan pastikan:
    - respons yang "bermakna" (tanpa alat)
    - pemanggilan alat nyata berfungsi (probe baca)
    - probe alat tambahan opsional (probe eksekusi+baca)
    - jalur regresi OpenAI (hanya pemanggilan alat -> tindak lanjut) tetap berfungsi
- Detail probe (agar Anda dapat menjelaskan kegagalan dengan cepat):
  - Probe `read`: pengujian menulis berkas nonce di ruang kerja dan meminta agen untuk `read` berkas tersebut serta menggemakan nonce.
  - Probe `exec+read`: pengujian meminta agen untuk menulis nonce dengan `exec` ke berkas sementara, lalu membacanya kembali dengan `read`.
  - Probe gambar: pengujian melampirkan PNG yang dihasilkan (kucing + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `test/helpers/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Cara memilih model:
  - Default: daftar prioritas pilihan dengan sinyal tinggi (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` menjalankan daftar model kecil pilihan melalui seluruh pipeline Gateway+agen
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk `modern`
  - Atau tetapkan `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar yang dipisahkan koma) untuk mempersempit
  - Penyisiran Gateway modern/semua dan kecil secara default menggunakan panjang daftar pilihannya sebagai batas; tetapkan `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk penyisiran terpilih yang menyeluruh atau angka positif untuk batas yang lebih kecil.
- Cara memilih penyedia (hindari "semuanya melalui OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (daftar izin yang dipisahkan koma)
- Probe alat + gambar selalu aktif dalam pengujian live ini:
  - Probe `read` + probe `exec+read` (uji tekanan alat)
  - probe gambar berjalan saat model mengiklankan dukungan input gambar
  - Alur (tingkat tinggi):
    - Pengujian menghasilkan PNG kecil dengan "CAT" + kode acak (`test/helpers/live-image-probe.ts`)
    - Mengirimkannya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mengurai lampiran menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agen tertanam meneruskan pesan pengguna multimodal ke model
    - Pernyataan: balasan berisi `cat` + kode tersebut (toleransi OCR: kesalahan kecil diperbolehkan)

<Tip>
Untuk melihat apa yang dapat Anda uji di mesin Anda (dan id `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke backend CLI (Claude, Gemini, atau CLI lokal lainnya)

- Pengujian: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: validasi pipeline Gateway + agen menggunakan backend CLI lokal, tanpa menyentuh konfigurasi default Anda.
- Default smoke khusus backend berada bersama definisi `cli-backend.ts` Plugin pemiliknya.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Penyedia/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku perintah/argumen/gambar berasal dari metadata Plugin backend CLI pemiliknya.
- Penimpaan (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran gambar nyata (path disisipkan ke dalam prompt). Nonaktif secara default dalam resep Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path berkas gambar sebagai argumen CLI alih-alih penyisipan prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol cara argumen gambar diteruskan saat `IMAGE_ARG` ditetapkan.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur pelanjutan.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` untuk memilih ikut serta dalam probe kontinuitas sesi yang sama Claude Sonnet -> Opus saat model yang dipilih mendukung target peralihan. Nonaktif secara default, termasuk dalam resep Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` untuk memilih ikut serta dalam probe loopback MCP/alat. Nonaktif secara default dalam resep Docker.

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
server `transport: "streamable-http"` yang disimpan dinormalisasi ke bentuk MCP HTTP milik Gemini
dan dapat terhubung ke server MCP HTTP yang dapat dialirkan secara lokal.

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
- Runner ini menjalankan smoke backend CLI langsung di dalam image Docker repo sebagai pengguna non-root `node`.
- Runner ini menyelesaikan metadata smoke CLI dari plugin pemiliknya, lalu menginstal paket CLI Linux yang sesuai (`@anthropic-ai/claude-code` atau `@google/gemini-cli`) ke prefiks dapat-tulis yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (bawaan: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` tidak lagi menjadi backend CLI bawaan; gunakan `openai/*` dengan runtime app-server Codex sebagai gantinya (lihat [Langsung: smoke harness app-server Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth langganan Claude Code portabel melalui `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Runner ini terlebih dahulu membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran backend CLI Gateway tanpa mempertahankan variabel lingkungan kunci API Anthropic. Jalur langganan ini menonaktifkan probe MCP/alat dan gambar Claude secara bawaan karena menggunakan batas pemakaian langganan yang sedang masuk dan Anthropic dapat mengubah perilaku penagihan serta pembatasan laju Claude Agent SDK / `claude -p` tanpa rilis OpenClaw.
- Claude dan Gemini mendukung rangkaian probe yang sama (giliran teks, klasifikasi gambar, pemanggilan alat MCP `cron`, kontinuitas pergantian model) melalui flag di atas, tetapi tidak satu pun probe tersebut berjalan secara bawaan - aktifkan secara eksplisit per flag sesuai kebutuhan.

## Langsung: keterjangkauan proxy HTTP/2 APNs

- Pengujian: `src/infra/push-apns-http2.live.test.ts`
- Tujuan: membuat terowongan melalui proxy HTTP CONNECT lokal ke endpoint APNs sandbox Apple, mengirim permintaan validasi HTTP/2 APNs, dan memastikan respons `403 InvalidProviderToken` nyata dari Apple kembali melalui jalur proxy.
- Aktifkan:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Batas waktu opsional:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Langsung: smoke pengikatan ACP (`/acp spawn ... --bind here`)

- Pengujian: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur pengikatan percakapan ACP nyata dengan agen ACP langsung:
  - kirim `/acp spawn <agent> --bind here`
  - ikat percakapan kanal pesan sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi bahwa tindak lanjut masuk ke transkrip sesi ACP yang terikat
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Bawaan:
  - Agen ACP di Docker: `claude,codex,gemini`
  - Agen ACP untuk `pnpm test:live ...` langsung: `claude`
  - Kanal sintetis: konteks percakapan bergaya DM Slack
  - Backend ACP: `acpx`
- Penimpaan:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (atau `on`/`true`/`yes`) untuk memaksa probe gambar aktif; nilai lainnya memaksanya nonaktif. Berjalan secara bawaan untuk setiap agen kecuali `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Catatan:
  - Jalur ini menggunakan permukaan `chat.send` Gateway dengan bidang rute asal sintetis khusus admin agar pengujian dapat melampirkan konteks kanal pesan tanpa berpura-pura mengirimkannya secara eksternal.
  - Ketika `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak ditetapkan, pengujian menggunakan registri agen bawaan milik plugin `acpx` tersemat untuk agen harness ACP yang dipilih.
  - Pembuatan Cron MCP sesi terikat bersifat upaya terbaik secara bawaan karena harness ACP eksternal dapat membatalkan pemanggilan MCP setelah bukti pengikatan/gambar lulus; tetapkan `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` agar probe Cron pascapengikatan tersebut bersifat ketat.

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
- Secara bawaan, runner ini menjalankan smoke pengikatan ACP terhadap kumpulan agen CLI langsung secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` untuk mempersempit matriks.
- Runner ini menyiapkan materi autentikasi CLI yang sesuai ke dalam kontainer, lalu menginstal CLI langsung yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid melalui `https://app.factory.ai/cli`, `@google/gemini-cli`, atau `opencode-ai`) jika belum tersedia. Backend ACP itu sendiri adalah paket `acpx/runtime` tersemat dari plugin resmi `acpx`.
- Varian Docker Droid menyiapkan `~/.factory` untuk pengaturan, meneruskan `FACTORY_API_KEY`, dan mewajibkan kunci API tersebut karena autentikasi OAuth/keyring Factory lokal tidak portabel ke dalam kontainer. Varian ini menggunakan entri registri `droid exec --output-format acp` bawaan ACPX.
- Varian Docker OpenCode adalah jalur regresi agen tunggal yang ketat. Varian ini menulis model bawaan `OPENCODE_CONFIG_CONTENT` sementara dari `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (bawaan `opencode/kimi-k2.6`).
- Pemanggilan CLI `acpx` langsung hanyalah jalur manual/solusi sementara untuk membandingkan perilaku di luar Gateway. Smoke pengikatan ACP Docker menjalankan backend runtime `acpx` tersemat milik OpenClaw.

## Langsung: smoke harness app-server Codex

- Tujuan: memvalidasi harness Codex milik plugin melalui metode gateway
  `agent` normal:
  - muat plugin `codex` bawaan
  - pilih model OpenAI melalui `/model <ref> --runtime codex`
  - kirim giliran agen gateway pertama dengan tingkat pemikiran yang diminta
  - kirim giliran kedua ke sesi OpenClaw yang sama dan verifikasi bahwa utas app-server
    dapat dilanjutkan
  - jalankan `/codex status` dan `/codex models` melalui jalur perintah gateway
    yang sama
  - secara opsional jalankan dua probe shell dengan eskalasi yang ditinjau Guardian: satu
    perintah aman yang seharusnya disetujui dan satu pengunggahan rahasia palsu yang seharusnya
    ditolak sehingga agen meminta konfirmasi kembali
- Pengujian: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model dasar harness: `openai/gpt-5.6-luna`
- Bawaan pemilihan kunci API OpenAI baru: `openai/gpt-5.6`
- Pemikiran bawaan: `low`
- Penimpaan model: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Penimpaan pemikiran: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Asersi upaya model nonbawaan:
  `OPENCLAW_LIVE_CODEX_HARNESS_EXPECTED_EFFORT=<level>`
- Penimpaan matriks: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Mode autentikasi: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (bawaan) menggunakan
  login Codex yang disalin; `api-key` menggunakan `OPENAI_API_KEY` melalui app-server Codex.
- Probe gambar opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/alat opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Probe Guardian opsional: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Uji tekanan pelanjutan opsional: `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1` menambahkan
  empat giliran riwayat, lalu menutup dan memulai ulang Gateway serta app-server Codex
  tiga kali sambil mewajibkan id utas native dan riwayat percakapan
  yang sama. Timpa jumlah terbatas dengan
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_HISTORY_TURNS` (1-20) dan
  `OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS_RESTARTS` (1-10).
- Uji tekanan fan-out opsional: tetapkan `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1`
  dan `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_COUNT` (1-12). Harness memulai
  setiap anak secara bersamaan, menunggu setiap eksekusi terminal, dan memverifikasi setiap
  balasan anak unik serta identitas utas native.
- Uji tekanan Compaction opsional: `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS=1`
  menghasilkan keluaran alat native terbatas, mewajibkan peristiwa Compaction otomatis,
  memverifikasi jumlah Compaction tersimpan dan pengingatan penanda tersembunyi, memulai ulang
  Gateway dan app-server Codex fisik, lalu mengulangi gelombang keluaran dan
  Compaction. Sesuaikan pekerjaan terbatas dengan
  `OPENCLAW_LIVE_CODEX_HARNESS_COMPACTION_STRESS_TURNS` (1-8) dan
  `OPENCLAW_LIVE_CODEX_HARNESS_LARGE_OUTPUT_BYTES` (100000-800000).
- Probe penolakan loop-relay opsional:
  `OPENCLAW_LIVE_CODEX_HARNESS_DISABLE_LOOP_RELAY=1`
- Preferensi pemikiran yang diminta dapat dipetakan ke upaya terdekat yang diumumkan
  Codex untuk model tersebut. Misalnya, Luna memetakan `minimal` ke `low`.
- Model katalog Codex yang dikenal memperoleh upaya native yang persis tersebut secara otomatis.
  Penimpaan model yang tidak dikenal harus menyatakan upaya terpetakan yang diharapkan.
- Smoke ini memaksakan penyedia/model `agentRuntime.id: "codex"` agar harness Codex
  yang rusak tidak dapat lulus dengan diam-diam beralih kembali ke OpenClaw.
- Autentikasi: autentikasi app-server Codex dari login langganan Codex lokal, atau
  `OPENAI_API_KEY` ketika `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker dapat
  menyalin `~/.codex/auth.json` dan `~/.codex/config.toml` untuk eksekusi langganan.

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

Uji tekanan mulai ulang dan riwayat:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_RESUME_STRESS=1 \
pnpm test:docker:live-codex-harness
```

Uji tekanan fan-out, keluaran besar, Compaction, dan mulai ulang:

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

Bawaan kunci API OpenAI baru:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Bukti ini membiarkan `OPENCLAW_LIVE_GATEWAY_MODELS` tidak ditetapkan, menyelesaikan model melalui
seam pemilihan inferensi onboarding baru, mengasersi `openai/gpt-5.6`, lalu
menjalankan giliran gateway nyata dengan model yang telah diselesaikan tersebut.

Matriks OpenClaw tersemat GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-codex-harness-docker.sh`.
- Runner ini meneruskan `OPENAI_API_KEY`, menyalin file autentikasi Codex CLI jika tersedia, menginstal
  `@openai/codex` ke prefiks npm terpasang yang
  dapat ditulis, menyiapkan pohon sumber, lalu hanya menjalankan pengujian live harness Codex.
- Docker mengaktifkan probe citra, MCP/alat, dan Guardian secara default. Atur
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ketika Anda memerlukan proses debug
  yang lebih terbatas.
- Docker menggunakan konfigurasi runtime Codex eksplisit yang sama, sehingga alias lama atau fallback OpenClaw
  tidak dapat menyembunyikan regresi harness Codex.
- Target matriks berjalan secara berurutan dalam satu kontainer. Skrip Docker menyesuaikan
  batas waktu default 35 menit berdasarkan jumlah target; batas waktu shell luar atau CI harus
  mengizinkan total waktu yang sama. CI kanonis menempatkan setiap target GPT-5.6 dalam shard terpisah.

### Resep live yang direkomendasikan

Daftar izin yang terbatas dan eksplisit adalah yang tercepat dan paling minim kegagalan tidak konsisten:

- Model tunggal, langsung (tanpa Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil langsung model kecil:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil Gateway model kecil:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pengujian asap API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Model tunggal, pengujian asap Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan alat di beberapa penyedia:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pengujian asap langsung Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Fokus Google (kunci API Gemini + Antigravity):
  - Gemini (kunci API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pengujian asap pemikiran adaptif Google (`qa manual` dari CLI QA privat - memerlukan `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` dan checkout sumber; lihat [ikhtisar QA](/id/concepts/qa-e2e-automation)):
  - Default dinamis Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Anggaran dinamis Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Catatan:

- `google/...` menggunakan API Gemini (kunci API).
- `google-antigravity/...` menggunakan bridge OAuth Antigravity (endpoint agen bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan Gemini CLI lokal di mesin Anda (autentikasi terpisah + kekhasan alat).
- API Gemini dibandingkan dengan Gemini CLI:
  - API: OpenClaw memanggil API Gemini yang dihosting Google melalui HTTP (kunci API / autentikasi profil); inilah yang dimaksud sebagian besar pengguna dengan "Gemini".
  - CLI: OpenClaw menjalankan biner `gemini` lokal melalui shell; biner ini memiliki autentikasi sendiri dan dapat berperilaku berbeda (dukungan streaming/alat/perbedaan versi).

## Live: matriks model (cakupan kami)

Live bersifat opsional, sehingga tidak ada "daftar model CI" yang tetap. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (dan alias `all` miliknya) menjalankan daftar prioritas terkurasi dari `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` di `src/agents/live-model-filter.ts`, dalam urutan prioritas berikut:

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

- Penyedia `codex` dan `codex-cli` dikecualikan dari penyisiran modern default (keduanya mencakup perilaku backend CLI/ACP, yang diuji secara terpisah di atas). `openai/gpt-5.5` sendiri dirutekan melalui harness app-server Codex secara default; lihat [Live: pengujian asap harness app-server Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter`, dan `xai` hanya menjalankan ID model yang dikurasi secara eksplisit dalam penyisiran modern (tanpa perluasan otomatis "setiap model dari penyedia ini").
- Sertakan setidaknya satu model berkemampuan citra (varian visi keluarga Claude/Gemini/OpenAI, dll.) dalam `OPENCLAW_LIVE_GATEWAY_MODELS` untuk menjalankan probe citra.

Jalankan pengujian asap Gateway dengan alat + citra pada kumpulan lintas penyedia yang dipilih secara khusus:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Cakupan tambahan opsional di luar daftar terkurasi (baik untuk dimiliki, pilih model berkemampuan "alat" yang telah Anda aktifkan):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (jika Anda memiliki akses)
- LM Studio: `lmstudio/...` (lokal; pemanggilan alat bergantung pada mode API)

### Agregator / Gateway alternatif

Jika Anda memiliki kunci yang diaktifkan, Anda juga dapat menguji melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat yang mendukung alat+citra)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (autentikasi melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Penyedia lain yang dapat Anda sertakan dalam matriks live (jika Anda memiliki kredensial/konfigurasi):

- Bawaan: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Melalui `models.providers` (endpoint kustom): `minimax` (cloud/API), serta proksi apa pun yang kompatibel dengan OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, dll.)

<Tip>
Jangan hardcode "semua model" dalam dokumentasi. Daftar otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` pada mesin Anda ditambah kunci apa pun yang tersedia.
</Tip>

## Kredensial (jangan pernah commit)

Pengujian live menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktis:

- Jika CLI berfungsi, pengujian live seharusnya menemukan kunci yang sama.
- Jika pengujian live menyatakan "tidak ada kredensial", lakukan debug dengan cara yang sama seperti Anda men-debug `openclaw models list` / pemilihan model.

- Profil autentikasi per agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah arti "kunci profil" dalam pengujian live)
- Konfigurasi: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori OAuth lama: `~/.openclaw/credentials/` (disalin ke home live yang disiapkan jika tersedia, tetapi bukan penyimpanan kunci profil utama)
- Proses live lokal menyalin konfigurasi aktif (dengan override `agents.*.workspace` / `agentDir` dihapus) dan `auth-profiles.json` milik setiap agen - bukan bagian lain dari direktori agen tersebut, sehingga data `workspace/` dan `sandboxes/` tidak pernah mencapai home yang disiapkan - beserta direktori lama `credentials/` dan file/direktori autentikasi CLI eksternal yang didukung (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) ke home pengujian sementara.

Jika Anda ingin mengandalkan kunci lingkungan, ekspor kunci tersebut sebelum pengujian lokal atau gunakan
runner Docker di bawah dengan `OPENCLAW_PROFILE_FILE` yang eksplisit.

## Live Deepgram (transkripsi audio)

- Pengujian: `extensions/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live paket coding BytePlus

- Pengujian: `extensions/byteplus/live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media alur kerja ComfyUI

- Pengujian: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menjalankan jalur citra dan video comfy bawaan, serta jalur `music_generate`
  - Melewati setiap kemampuan kecuali jika `plugins.entries.comfy.config.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman alur kerja comfy, polling, unduhan, atau pendaftaran Plugin

## Live pembuatan citra

- Pengujian: `test/image-generation.runtime.live.test.ts`
- Perintah: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Menginventarisasi setiap Plugin penyedia pembuatan citra yang terdaftar
  - Menggunakan variabel lingkungan penyedia yang sudah diekspor sebelum melakukan probe
  - Secara default menggunakan kunci API live/lingkungan sebelum profil autentikasi tersimpan, sehingga kunci pengujian usang dalam `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia yang tidak memiliki autentikasi/profil/model yang dapat digunakan
  - Menjalankan setiap penyedia yang dikonfigurasi melalui runtime pembuatan citra bersama:
    - `<provider>:generate`
    - `<provider>:edit` ketika penyedia menyatakan dukungan pengeditan
- Penyedia bawaan yang saat ini tercakup:
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
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi penyimpanan profil dan mengabaikan override khusus lingkungan

Untuk jalur CLI yang didistribusikan, tambahkan pengujian asap `infer` setelah pengujian live
penyedia/runtime berhasil:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image \
  --prompt "Gambar uji datar minimalis: satu persegi biru pada latar belakang putih, tanpa teks." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Ini mencakup penguraian argumen CLI, resolusi konfigurasi/agen default, aktivasi
Plugin bawaan, runtime pembuatan citra bersama, dan permintaan penyedia live.
Dependensi Plugin diharapkan tersedia sebelum pemuatan runtime.

## Live pembuatan musik

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menguji jalur penyedia pembuatan musik terpaket bersama
  - Saat ini mencakup `fal`, `google`, `minimax`, dan `openrouter`
  - Menggunakan variabel lingkungan penyedia yang telah diekspor sebelum melakukan pemeriksaan
  - Secara default menggunakan kunci API langsung/dari lingkungan sebelum profil autentikasi tersimpan, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan jika tersedia:
    - `generate` dengan masukan khusus prompt
    - `edit` saat penyedia mendeklarasikan `capabilities.edit.enabled`
  - `comfy` memiliki berkas langsung terpisah sendiri, bukan pemeriksaan bersama ini
- Pembatasan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksakan autentikasi penyimpanan profil dan mengabaikan penggantian yang hanya berasal dari lingkungan

## Pembuatan video langsung

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menguji jalur penyedia pembuatan video terpaket bersama di seluruh `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Secara default menggunakan jalur smoke yang aman untuk rilis: satu permintaan teks-ke-video per penyedia, prompt lobster berdurasi satu detik, dan batas operasi per penyedia dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (secara default `180000`)
  - Secara default melewati FAL karena latensi antrean di sisi penyedia dapat mendominasi waktu rilis; berikan `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (atau kosongkan daftar yang dilewati) untuk menjalankannya secara eksplisit
  - Menggunakan variabel lingkungan penyedia yang telah diekspor sebelum melakukan pemeriksaan
  - Secara default menggunakan kunci API langsung/dari lingkungan sebelum profil autentikasi tersimpan, sehingga kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell yang sebenarnya
  - Melewati penyedia tanpa autentikasi/profil/model yang dapat digunakan
  - Secara default hanya menjalankan `generate`
  - Atur `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transformasi yang dideklarasikan jika tersedia:
    - `imageToVideo` saat penyedia mendeklarasikan `capabilities.imageToVideo.enabled` dan penyedia/model yang dipilih menerima masukan gambar lokal berbasis buffer dalam pemeriksaan bersama
    - `videoToVideo` saat penyedia mendeklarasikan `capabilities.videoToVideo.enabled` dan penyedia/model yang dipilih menerima masukan video lokal berbasis buffer dalam pemeriksaan bersama
  - Penyedia `imageToVideo` yang saat ini dideklarasikan tetapi dilewati dalam pemeriksaan bersama:
    - `vydra` (masukan gambar lokal berbasis buffer tidak didukung dalam jalur ini)
  - Cakupan khusus penyedia Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Berkas tersebut menjalankan teks-ke-video `veo3` serta jalur gambar-ke-video `kling` yang secara default menggunakan fixture URL gambar jarak jauh (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` untuk menggantinya).
  - Cakupan khusus penyedia xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Kasus klasik terlebih dahulu menghasilkan bingkai pertama PNG lokal berbentuk persegi, menghilangkan geometri, meminta klip gambar-ke-video berdurasi satu detik, melakukan polling hingga selesai, dan memverifikasi buffer yang diunduh.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Kasus 1.5 menghasilkan bingkai pertama PNG lokal, meminta klip gambar-ke-video 1080P berdurasi satu detik, melakukan polling hingga selesai, dan memverifikasi buffer yang diunduh.
  - Cakupan langsung `videoToVideo` saat ini:
    - `runway` hanya saat model yang dipilih ditetapkan menjadi `gen4_aleph`
  - Penyedia `videoToVideo` yang saat ini dideklarasikan tetapi dilewati dalam pemeriksaan bersama:
    - `alibaba`, `google`, `openai`, `qwen`, `xai` karena jalur tersebut saat ini memerlukan URL referensi `http(s)` jarak jauh, bukan masukan lokal berbasis buffer
- Pembatasan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap penyedia dalam pemeriksaan default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas operasi setiap penyedia bagi proses smoke yang agresif
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksakan autentikasi penyimpanan profil dan mengabaikan penggantian yang hanya berasal dari lingkungan

## Harness media langsung

- Perintah: `pnpm test:live:media`
- Titik masuk: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, yang menjalankan `pnpm test:live -- <suite-test-file>` untuk setiap rangkaian yang dipilih, sehingga perilaku Heartbeat dan mode senyap tetap konsisten dengan proses `pnpm test:live` lainnya.
- Tujuan:
  - Menjalankan rangkaian langsung bersama untuk gambar, musik, dan video melalui satu titik masuk asli repositori
  - Memuat otomatis variabel lingkungan penyedia yang tidak tersedia dari `~/.profile`
  - Secara default membatasi setiap rangkaian secara otomatis ke penyedia yang saat ini memiliki autentikasi yang dapat digunakan
- Flag:
  - `--providers <csv>` filter penyedia global; `--image-providers` / `--music-providers` / `--video-providers` membatasi filter ke satu rangkaian
  - `--all-providers` melewati filter otomatis berbasis autentikasi
  - `--allow-empty` keluar dengan `0` saat pemfilteran tidak menyisakan penyedia yang dapat dijalankan
  - `--quiet` / `--no-quiet` diteruskan ke `test:live`
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Terkait

- [Pengujian](/id/help/testing) - rangkaian unit, integrasi, QA, dan Docker
