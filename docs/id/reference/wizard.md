---
read_when:
    - Mencari langkah atau flag onboarding tertentu
    - Mengotomatiskan onboarding dengan mode noninteraktif
    - Men-debug perilaku orientasi awal
sidebarTitle: Onboarding Reference
summary: 'Referensi lengkap untuk onboarding CLI: setiap langkah, flag, dan bidang konfigurasi'
title: Referensi orientasi awal
x-i18n:
    generated_at: "2026-07-16T18:44:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

Ini adalah referensi lengkap untuk `openclaw onboard`.
Untuk gambaran umum tingkat tinggi, lihat [Orientasi (CLI)](/id/start/wizard). Untuk perilaku dan keluaran
langkah demi langkah, lihat [Referensi penyiapan CLI](/id/start/wizard-cli-reference).

## Detail alur (mode lokal)

<Steps>
  <Step title="Atur ulang (opsional)">
    - `--reset` mengatur ulang status sebelum penyiapan berjalan; tanpa opsi ini, menjalankan ulang orientasi
      akan mempertahankan konfigurasi yang ada dan menggunakannya kembali sebagai nilai default.
    - `--reset-scope` mengontrol apa yang dihapus oleh `--reset`: `config` (hanya file
      konfigurasi), `config+creds+sessions` (default), atau `full` (juga menghapus
      ruang kerja).
    - Jika file konfigurasi tidak valid, orientasi berhenti dan meminta Anda menjalankan
      `openclaw doctor` terlebih dahulu, lalu menjalankan ulang penyiapan.
    - Pengaturan ulang memindahkan status ke Trash (tidak pernah menghapusnya secara langsung).

  </Step>
  <Step title="Pengakuan risiko">
    - Proses pertama (atau proses apa pun sebelum `wizard.securityAcknowledgedAt` ditetapkan)
      meminta Anda mengonfirmasi bahwa Anda memahami agen memiliki kemampuan besar dan akses
      penuh ke sistem berisiko.
    - `--non-interactive` secara eksplisit memerlukan `--accept-risk`; tanpanya,
      orientasi keluar dengan galat alih-alih menampilkan perintah konfirmasi.
    - Proses interaktif menampilkan perintah konfirmasi sebagai pengganti flag; penolakan
      membatalkan penyiapan.

  </Step>
  <Step title="Model/Autentikasi">
    - **Kunci API Anthropic**: menggunakan `ANTHROPIC_API_KEY` jika tersedia atau meminta kunci, lalu menyimpannya untuk digunakan daemon.
    - **CLI Anthropic Claude**: jalur lokal yang diutamakan ketika proses masuk CLI Claude sudah tersedia; OpenClaw tetap mendukung autentikasi token penyiapan Anthropic sebagai alternatif.
    - **Langganan OpenAI Code (Codex) (OAuth)**: alur browser; tempelkan `code#state`.
      - Pada penyiapan baru tanpa model utama, menetapkan `agents.defaults.model` ke `openai/gpt-5.6-sol` melalui runtime Codex.
    - **Langganan OpenAI Code (Codex) (pemasangan perangkat)**: alur pemasangan melalui browser dengan kode perangkat berumur pendek.
      - Pada penyiapan baru tanpa model utama, menetapkan `agents.defaults.model` ke `openai/gpt-5.6-sol` melalui runtime Codex.
    - **Kunci API OpenAI**: menggunakan `OPENAI_API_KEY` jika tersedia atau meminta kunci, lalu menyimpannya dalam profil autentikasi.
      - Pada penyiapan baru tanpa model utama, menetapkan `agents.defaults.model` ke `openai/gpt-5.6`; ID model API langsung tanpa prefiks ditetapkan ke tingkat Sol.
    - Menambahkan atau mengautentikasi ulang OpenAI mempertahankan model utama eksplisit yang sudah ada, termasuk `openai/gpt-5.5`. Jika akun tidak menyediakan GPT-5.6, pilih `openai/gpt-5.5` secara eksplisit; OpenClaw tidak menurunkan model secara diam-diam.
    - **OAuth xAI**: proses masuk melalui browser dengan kode perangkat tanpa memerlukan callback localhost, sehingga juga berfungsi melalui SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Kunci API xAI**: meminta `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` masih berfungsi sebagai alias kompatibilitas khusus manual untuk alur kode perangkat OAuth xAI yang sama; gunakan `xai-oauth` untuk skrip baru.
    - **OpenCode**: meminta `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`, dapatkan di https://opencode.ai/auth) dan memungkinkan Anda memilih katalog Zen atau Go.
    - **Ollama**: terlebih dahulu menawarkan **Cloud + Lokal**, **Hanya cloud**, atau **Hanya lokal**. `Cloud only` meminta `OLLAMA_API_KEY` dan menggunakan `https://ollama.com`; mode yang didukung host meminta URL dasar Ollama (default `http://127.0.0.1:11434`), menemukan model yang tersedia, dan otomatis menarik model lokal yang dipilih bila diperlukan; `Cloud + Local` juga memeriksa apakah host Ollama tersebut telah masuk untuk akses cloud.
    - Detail selengkapnya: [Ollama](/id/providers/ollama)
    - **Kunci API**: menyimpan kunci untuk Anda.
    - **Vercel AI Gateway (proksi multimodel)**: meminta `AI_GATEWAY_API_KEY`.
    - Detail selengkapnya: [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: meminta ID Akun, ID Gateway, dan `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Detail selengkapnya: [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
    - **MiniMax**: konfigurasi ditulis otomatis; default yang dihosting adalah `MiniMax-M3`.
      Penyiapan kunci API menggunakan `minimax/...`, dan penyiapan OAuth menggunakan
      `minimax-portal/...`.
    - Detail selengkapnya: [MiniMax](/id/providers/minimax)
    - **StepFun**: konfigurasi ditulis otomatis untuk StepFun standar atau Step Plan pada endpoint Tiongkok atau global.
    - Standar saat ini menggunakan default `step-3.5-flash`; Step Plan juga menyertakan `step-3.5-flash-2603`.
    - Detail selengkapnya: [StepFun](/id/providers/stepfun)
    - **Synthetic (kompatibel dengan Anthropic)**: meminta `SYNTHETIC_API_KEY`.
    - Detail selengkapnya: [Synthetic](/id/providers/synthetic)
    - **Moonshot (Kimi K2)**: konfigurasi ditulis otomatis.
    - **Kimi Coding**: konfigurasi ditulis otomatis.
    - Detail selengkapnya: [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
    - **Penyedia Kustom**: berfungsi dengan endpoint yang kompatibel dengan OpenAI, kompatibel dengan OpenAI Responses, atau kompatibel dengan Anthropic. Flag noninteraktif: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (opsional; kembali menggunakan `CUSTOM_API_KEY`), `--custom-provider-id` (opsional; diturunkan otomatis dari URL dasar), `--custom-compatibility openai|openai-responses|anthropic` (default `openai`), `--custom-image-input` / `--custom-text-input` (menggantikan deteksi model visi yang disimpulkan).
    - **Lewati**: autentikasi belum dikonfigurasi.
    - Pilih model default dari opsi yang terdeteksi (atau masukkan penyedia/model secara manual). Untuk kualitas terbaik dan risiko injeksi prompt yang lebih rendah, pilih model generasi terbaru terkuat yang tersedia dalam tumpukan penyedia Anda.
    - Orientasi menjalankan pemeriksaan model dan memperingatkan jika model yang dikonfigurasi tidak dikenal atau autentikasinya tidak tersedia.
    - Mode penyimpanan kunci API secara default menggunakan nilai profil autentikasi teks biasa. Gunakan `--secret-input-mode ref` untuk menyimpan referensi berbasis variabel lingkungan sebagai gantinya (misalnya `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); variabel lingkungan yang dirujuk harus sudah ditetapkan, atau orientasi akan langsung gagal.
    - Profil autentikasi berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (kunci API + OAuth). `~/.openclaw/credentials/oauth.json` hanya untuk impor lama.
    - Detail selengkapnya: [OAuth](/id/concepts/oauth)
    <Note>
    Kiat untuk server/tanpa antarmuka grafis: selesaikan OAuth pada mesin yang memiliki browser, lalu salin
    `auth-profiles.json` milik agen tersebut (misalnya
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, atau jalur
    `$OPENCLAW_STATE_DIR/...` yang sesuai) ke host gateway. `credentials/oauth.json`
    hanya merupakan sumber impor lama.
    </Note>
  </Step>
  <Step title="Ruang kerja">
    - Default `~/.openclaw/workspace` (dapat dikonfigurasi).
    - Menginisialisasi file ruang kerja yang diperlukan untuk ritual bootstrap agen.
    - Tata letak ruang kerja lengkap + panduan pencadangan: [Ruang kerja agen](/id/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port (default **18789**), pengikatan, mode autentikasi, eksposur tailscale.
    - Rekomendasi autentikasi: pertahankan **Token** bahkan untuk loopback agar klien WS lokal harus melakukan autentikasi.
    - Dalam mode token, penyiapan interaktif menawarkan:
      - **Buat/simpan token teks biasa** (default)
      - **Gunakan SecretRef** (opsional)
      - Mulai cepat menggunakan kembali SecretRef `gateway.auth.token` yang ada di seluruh penyedia `env`, `file`, dan `exec` untuk pemeriksaan orientasi/bootstrap dasbor.
      - Jika SecretRef tersebut dikonfigurasi tetapi tidak dapat diselesaikan, orientasi langsung gagal dengan pesan perbaikan yang jelas alih-alih menurunkan autentikasi runtime secara diam-diam.
    - Dalam mode kata sandi, penyiapan interaktif juga mendukung penyimpanan teks biasa atau SecretRef.
    - Jalur SecretRef token noninteraktif: `--gateway-token-ref-env <ENV_VAR>`.
      - Memerlukan variabel lingkungan yang tidak kosong dalam lingkungan proses orientasi.
      - Tidak dapat digabungkan dengan `--gateway-token`.
    - Nonaktifkan autentikasi hanya jika Anda sepenuhnya memercayai setiap proses lokal.
    - Pengikatan non-loopback tetap memerlukan autentikasi.

  </Step>
  <Step title="Saluran">
    - [WhatsApp](/id/channels/whatsapp): proses masuk QR opsional.
    - [Telegram](/id/channels/telegram): token bot.
    - [Discord](/id/channels/discord): token bot.
    - [Google Chat](/id/channels/googlechat): JSON akun layanan + audiens webhook.
    - [Mattermost](/id/channels/mattermost) (plugin): token bot + URL dasar.
    - [Signal](/id/channels/signal) (plugin): instalasi `signal-cli` opsional + konfigurasi akun.
    - [iMessage](/id/channels/imessage): jalur CLI `imsg` + akses DB Messages; gunakan pembungkus SSH ketika Gateway berjalan di luar Mac.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack, dan saluran lainnya disediakan sebagai
      plugin yang dapat dipasang oleh orientasi untuk Anda. Katalog lengkap: [Saluran](/id/channels).
    - Keamanan DM: default-nya adalah pemasangan. DM pertama mengirimkan kode; setujui melalui `openclaw pairing approve <channel> <code>` atau gunakan daftar izin.

  </Step>
  <Step title="Pencarian web">
    - Pilih penyedia yang didukung seperti Brave, Codex (Hosted Search), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG, atau Tavily (atau lewati).
    - Penyedia berbasis API dapat menggunakan variabel lingkungan atau konfigurasi yang ada untuk penyiapan cepat; penyedia tanpa kunci menggunakan prasyarat khusus penyedia masing-masing.
    - Lewati dengan `--skip-search`.
    - Konfigurasikan nanti: `openclaw configure --section web`.

  </Step>
  <Step title="Instalasi daemon">
    - macOS: LaunchAgent
      - Memerlukan sesi pengguna yang telah masuk; untuk penggunaan tanpa antarmuka grafis, gunakan LaunchDaemon kustom (tidak disertakan).
    - Linux (dan Windows melalui WSL2): unit pengguna systemd
      - Orientasi mencoba mengaktifkan lingering melalui `loginctl enable-linger <user>` agar Gateway tetap berjalan setelah keluar.
      - Mungkin meminta sudo (menulis `/var/lib/systemd/linger`); sistem mencoba tanpa sudo terlebih dahulu.
    - Windows native: Scheduled Task terlebih dahulu; jika pembuatan tugas ditolak, OpenClaw kembali menggunakan item masuk folder Startup per pengguna dan segera memulai Gateway.
    - **Pemilihan runtime:** Node diperlukan karena penyimpanan status runtime kanonis menggunakan `node:sqlite`. Layanan Bun lama dimigrasikan ke Node selama perbaikan.
    - Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola oleh SecretRef, instalasi daemon memvalidasinya tetapi tidak menyimpan nilai token teks biasa yang telah diselesaikan dalam metadata lingkungan layanan supervisor.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat diselesaikan, instalasi daemon diblokir dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum ditetapkan, instalasi daemon diblokir hingga mode ditetapkan secara eksplisit.

  </Step>
  <Step title="Pemeriksaan kondisi">
    - Memulai Gateway (jika diperlukan) dan menjalankan `openclaw health`.
    - Kiat: `openclaw status --deep` menambahkan pemeriksaan kondisi gateway langsung ke keluaran status, termasuk pemeriksaan saluran jika didukung (memerlukan gateway yang dapat dijangkau).

  </Step>
  <Step title="Skills (disarankan)">
    - Membaca skills yang tersedia dan memeriksa persyaratan.
    - Memungkinkan Anda memilih pengelola node: **npm / pnpm / bun**.
    - Memasang otomatis dependensi opsional untuk skills bawaan tepercaya (sebagian menggunakan Homebrew di macOS).
    - Melewati skills yang prasyarat penginstal Homebrew, uv, atau Go-nya tidak tersedia, mengelompokkannya beserta panduan penyiapan manual, dan mengarahkan Anda ke `openclaw doctor` setelah prasyarat terpasang.

  </Step>
  <Step title="Selesai">
    - Ringkasan + langkah berikutnya, termasuk pertanyaan **Bagaimana Anda ingin menetaskan agen Anda?** untuk Terminal, Browser, atau nanti.

  </Step>
</Steps>

<Note>
Jika tidak ada GUI yang terdeteksi, onboarding menampilkan petunjuk penerusan port SSH untuk UI Kontrol alih-alih membuka peramban.
Jika aset UI Kontrol tidak tersedia, onboarding mencoba membangunnya; alternatifnya adalah `pnpm ui:build` (menginstal otomatis dependensi UI).
</Note>

## Mode noninteraktif

Gunakan `--non-interactive --accept-risk` untuk mengotomatiskan atau membuat skrip onboarding (
flag tersebut merupakan pernyataan wajib bahwa risiko telah dipahami; onboarding berhenti dengan kesalahan
tanpanya):

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Tambahkan `--json` untuk ringkasan yang dapat dibaca mesin.

SecretRef token Gateway dalam mode noninteraktif:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` dan `--gateway-token-ref-env` tidak dapat digunakan bersamaan.

<Note>
`--json` **tidak** menyiratkan mode noninteraktif. Gunakan `--non-interactive --accept-risk` (dan `--workspace`) untuk skrip.
</Note>

Contoh perintah khusus penyedia tersedia di [Otomatisasi CLI](/id/start/wizard-cli-automation#provider-specific-examples).
Gunakan halaman referensi ini untuk semantik flag dan urutan langkah.

### Menambahkan agen (noninteraktif)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` adalah ID agen yang dicadangkan dan tidak dapat digunakan untuk `openclaw agents add`.

## RPC wizard Gateway

Gateway menyediakan alur onboarding melalui RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Klien (aplikasi macOS, UI Kontrol) dapat merender langkah-langkah tanpa mengimplementasikan ulang logika onboarding.

## Penyiapan Signal (signal-cli)

Onboarding mendeteksi apakah `signal-cli` tersedia di `PATH` dan, jika tidak tersedia, menawarkan untuk menginstalnya:

- Linux x86-64: mengunduh build GraalVM native resmi dari rilis GitHub `signal-cli` dan menyimpannya di bawah `~/.openclaw/tools/signal-cli/<version>/`.
- macOS dan arsitektur lainnya: sebagai gantinya, menginstal melalui Homebrew.
- Windows native: belum didukung; jalankan onboarding di dalam WSL2 untuk menggunakan jalur instalasi Linux.
- Dalam kedua kasus, menulis `channels.signal.cliPath` ke konfigurasi Anda.

## Yang ditulis oleh wizard

Kolom umum dalam `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` saat `--skip-bootstrap` diberikan
- `agents.defaults.model` / `models.providers` (jika Minimax dipilih)
- `tools.profile` (onboarding lokal secara default menggunakan `"coding"` jika belum ditetapkan; nilai eksplisit yang sudah ada dipertahankan)
- `gateway.*` (mode, bind, autentikasi, tailscale)
- `session.dmScope` (onboarding lokal secara default menetapkan ini ke `"per-channel-peer"` jika belum ditetapkan; nilai eksplisit yang sudah ada dipertahankan. Detail: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Daftar izin DM kanal saat Anda memilih untuk mengaktifkannya dalam prompt kanal. Discord, Matrix, Microsoft Teams, dan Slack mengubah nama menjadi ID jika memungkinkan; kanal lain menerima ID secara langsung (misalnya ID numerik pengirim Telegram atau nomor telepon WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` menerima `npm`, `pnpm`, atau `bun`.
  - Konfigurasi manual tetap dapat menggunakan `yarn` dengan menetapkan `skills.install.nodeManager` secara langsung.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` menulis `agents.list[]` dan `bindings` opsional.

Kredensial WhatsApp disimpan di bawah `~/.openclaw/credentials/whatsapp/<accountId>/`.
Sesi aktif dan transkrip disimpan di
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Direktori
`~/.openclaw/agents/<agentId>/sessions/` digunakan untuk masukan migrasi lama
dan artefak arsip/dukungan.

Beberapa kanal disediakan sebagai plugin. Saat Anda memilih salah satunya selama penyiapan, onboarding
akan meminta Anda menginstalnya (npm atau jalur lokal) sebelum dapat dikonfigurasi.

## Dokumentasi terkait

- Ikhtisar onboarding: [Onboarding (CLI)](/id/start/wizard)
- Referensi penyiapan CLI: [Referensi penyiapan CLI](/id/start/wizard-cli-reference)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Referensi konfigurasi: [Konfigurasi Gateway](/id/gateway/configuration)
- Penyedia: [WhatsApp](/id/channels/whatsapp), [Telegram](/id/channels/telegram), [Discord](/id/channels/discord), [Google Chat](/id/channels/googlechat), [Signal](/id/channels/signal), [iMessage](/id/channels/imessage)
- Skills: [Skills](/id/tools/skills), [Konfigurasi Skills](/id/tools/skills-config)
