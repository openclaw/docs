---
read_when:
    - Memahami bagaimana stack QA saling terintegrasi
    - Memperluas qa-lab, qa-channel, atau adaptor transport
    - Menambahkan skenario QA berbasis repo
    - Membangun otomatisasi QA yang lebih realistis untuk dasbor Gateway
summary: 'Ikhtisar stack QA: qa-lab, qa-channel, skenario berbasis repo, jalur transport live, adaptor transport, dan pelaporan.'
title: Ikhtisar QA
x-i18n:
    generated_at: "2026-05-06T09:09:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Tumpukan QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis dan berbentuk kanal daripada yang dapat dilakukan satu pengujian unit.

Bagian saat ini:

- `extensions/qa-channel`: kanal pesan sintetis dengan permukaan DM, kanal, thread, reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip, menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `extensions/qa-matrix`, Plugin runner mendatang: adaptor transport langsung yang menggerakkan kanal nyata di dalam Gateway QA anak.
- `qa/`: aset seed yang didukung repo untuk tugas kickoff dan skenario QA baseline.
- [Mantis](/id/concepts/mantis): verifikasi langsung sebelum dan sesudah untuk bug yang membutuhkan transport nyata, tangkapan layar browser, status VM, dan bukti PR.

## Permukaan perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip `pnpm qa:*`; kedua bentuk didukung.

| Perintah                                            | Tujuan                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Pemeriksaan mandiri QA bawaan; menulis laporan Markdown.                                                                                                                                                                                                                |
| `qa suite`                                          | Menjalankan skenario yang didukung repo terhadap lane Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` untuk VM Linux sekali pakai.                                                                                                                       |
| `qa coverage`                                       | Mencetak inventaris cakupan skenario markdown (`--json` untuk keluaran mesin).                                                                                                                                                                                          |
| `qa parity-report`                                  | Membandingkan dua file `qa-suite-summary.json` dan menulis laporan paritas agentik.                                                                                                                                                                                      |
| `qa character-eval`                                 | Menjalankan skenario QA karakter di beberapa model langsung dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                                                                                                                                 |
| `qa manual`                                         | Menjalankan prompt satu kali terhadap lane penyedia/model yang dipilih.                                                                                                                                                                                                  |
| `qa ui`                                             | Memulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                      |
| `qa docker-build-image`                             | Membangun image Docker QA yang telah dipanggang sebelumnya.                                                                                                                                                                                                              |
| `qa docker-scaffold`                                | Menulis scaffold docker-compose untuk dasbor QA + lane Gateway.                                                                                                                                                                                                         |
| `qa up`                                             | Membangun situs QA, memulai tumpukan yang didukung Docker, mencetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                   |
| `qa aimock`                                         | Memulai hanya server penyedia AIMock.                                                                                                                                                                                                                                   |
| `qa mock-openai`                                    | Memulai hanya server penyedia `mock-openai` yang sadar skenario.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Mengelola pool kredensial Convex bersama.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Lane transport langsung terhadap homeserver Tuwunel sekali pakai. Lihat [Matrix QA](/id/concepts/qa-matrix).                                                                                                                                                               |
| `qa telegram`                                       | Lane transport langsung terhadap grup Telegram privat nyata.                                                                                                                                                                                                            |
| `qa discord`                                        | Lane transport langsung terhadap kanal guild Discord privat nyata.                                                                                                                                                                                                      |
| `qa slack`                                          | Lane transport langsung terhadap kanal Slack privat nyata.                                                                                                                                                                                                              |
| `qa mantis`                                         | Runner verifikasi sebelum dan sesudah untuk bug transport langsung, dengan bukti reaksi status Discord, smoke desktop/browser Crabbox, dan smoke Slack-in-VNC. Lihat [Mantis](/id/concepts/mantis) dan [Runbook Desktop Slack Mantis](/id/concepts/mantis-slack-desktop-runbook). |

## Alur operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (UI Kontrol) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bernuansa Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane Gateway yang didukung Docker, dan mengekspos halaman QA Lab tempat operator atau loop otomatisasi dapat memberi agen sebuah misi QA, mengamati perilaku kanal nyata, dan mencatat apa yang berhasil, gagal, atau tetap terblokir.

Untuk iterasi UI QA Lab lokal yang lebih cepat tanpa membangun ulang image Docker setiap kali, mulai tumpukan dengan bundel QA Lab yang dipasang bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` menjaga layanan Docker pada image yang telah dibangun sebelumnya dan bind-mount `extensions/qa-lab/web/dist` ke dalam kontainer `qa-lab`. `qa:lab:watch` membangun ulang bundel itu saat ada perubahan, dan browser otomatis memuat ulang ketika hash aset QA Lab berubah.

Untuk smoke trace OpenTelemetry lokal, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip itu memulai penerima trace OTLP/HTTP lokal, menjalankan skenario QA `otel-trace-smoke` dengan Plugin `diagnostics-otel` diaktifkan, lalu mendekode span protobuf yang diekspor dan memeriksa bentuk yang kritis untuk rilis: `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`, `openclaw.context.assembled`, dan `openclaw.message.delivery` harus ada; panggilan model tidak boleh mengekspor `StreamAbandoned` pada giliran yang berhasil; ID diagnostik mentah dan atribut `openclaw.content.*` harus tetap berada di luar trace. Ini menulis `otel-smoke-summary.json` di sebelah artefak suite QA.

QA observabilitas tetap hanya untuk checkout sumber. Tarball npm sengaja menghilangkan QA Lab, sehingga lane rilis Docker paket tidak menjalankan perintah `qa`. Gunakan `pnpm qa:otel:smoke` dari checkout sumber yang telah dibangun saat mengubah instrumentasi diagnostik.

Untuk lane smoke Matrix dengan transport nyata, jalankan:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Referensi CLI lengkap, katalog profil/skenario, variabel env, dan tata letak artefak untuk lane ini ada di [Matrix QA](/id/concepts/qa-matrix). Sekilas: ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver/SUT/observer sementara, menjalankan Plugin Matrix nyata di dalam Gateway QA anak yang dibatasi untuk transport itu (tanpa `qa-channel`), lalu menulis laporan Markdown, ringkasan JSON, artefak observed-events, dan log keluaran gabungan di bawah `.artifacts/qa-e2e/matrix-<timestamp>/`.

Skenario mencakup perilaku transport yang tidak dapat dibuktikan oleh pengujian unit secara end to end: gating mention, kebijakan allow-bot, allowlist, balasan tingkat atas dan ber-thread, routing DM, penanganan reaksi, supresi edit masuk, dedupe replay restart, pemulihan gangguan homeserver, pengiriman metadata persetujuan, penanganan media, dan alur bootstrap/pemulihan/verifikasi E2EE Matrix. Profil CLI E2EE juga menjalankan `openclaw matrix encryption setup` dan perintah verifikasi melalui homeserver sekali pakai yang sama sebelum memeriksa balasan Gateway.

Discord juga memiliki skenario opt-in khusus Mantis untuk reproduksi bug. Gunakan `--scenario discord-status-reactions-tool-only` untuk timeline reaksi status eksplisit, atau `--scenario discord-thread-reply-filepath-attachment` untuk membuat thread Discord nyata dan memverifikasi bahwa `message.thread-reply` mempertahankan lampiran `filePath`. Skenario ini tetap berada di luar lane Discord langsung default karena merupakan probe reproduksi sebelum/sesudah, bukan cakupan smoke yang luas. Alur kerja Mantis lampiran thread juga dapat menambahkan video saksi Discord Web yang sudah login ketika `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` atau `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` dikonfigurasi di lingkungan QA. Profil viewer itu hanya untuk tangkapan visual; keputusan lulus/gagal tetap berasal dari oracle REST Discord.

CI menggunakan permukaan perintah yang sama di `.github/workflows/qa-live-transports-convex.yml`. Eksekusi terjadwal dan manual default menjalankan profil Matrix cepat dengan kredensial frontier langsung, `--fast`, dan `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Manual `matrix_profile=all` menyebar ke lima shard profil sehingga katalog lengkap dapat berjalan paralel sambil menjaga satu direktori artefak per shard.

Untuk lane smoke Telegram, Discord, dan Slack dengan transport nyata:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Lane tersebut menargetkan kanal nyata yang sudah ada dengan dua bot (driver + SUT). Variabel env yang wajib, daftar skenario, artefak keluaran, dan pool kredensial Convex didokumentasikan dalam [referensi QA Telegram, Discord, dan Slack](#telegram-discord-and-slack-qa-reference) di bawah.

Untuk menjalankan VM desktop Slack penuh dengan penyelamatan VNC, jalankan:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Perintah tersebut menyewa mesin desktop/browser Crabbox, menjalankan lane live Slack
di dalam VM, membuka Slack Web di browser VNC, menangkap desktop, dan
menyalin `slack-qa/`, `slack-desktop-smoke.png`, dan `slack-desktop-smoke.mp4`
ketika perekaman video tersedia kembali ke direktori artefak Mantis. Lease
desktop/browser Crabbox menyediakan alat capture dan paket pembantu browser/native-build
sejak awal, sehingga skenario hanya perlu memasang fallback pada lease yang lebih lama.
Mantis melaporkan timing total dan per fase di
`mantis-slack-desktop-smoke-report.md` sehingga run yang lambat menunjukkan apakah waktu tersita untuk
pemanasan lease, pengambilan kredensial, penyiapan remote, atau penyalinan artefak. Gunakan ulang
`--lease-id <cbx_...>` setelah login ke Slack Web secara manual melalui VNC;
lease yang digunakan ulang juga menjaga cache store pnpm Crabbox tetap hangat. Default
`--hydrate-mode source` memverifikasi dari checkout sumber dan menjalankan install/build
di dalam VM. Gunakan `--hydrate-mode prehydrated` hanya ketika workspace remote yang digunakan ulang
sudah memiliki `node_modules` dan `dist/` yang sudah dibuild; mode itu melewati
langkah install/build yang mahal dan gagal tertutup ketika workspace belum siap.
Dengan `--gateway-setup`, Mantis membiarkan Gateway Slack OpenClaw persisten
berjalan di dalam VM pada port `38973`; tanpa itu, perintah menjalankan lane QA Slack
bot-ke-bot normal dan keluar setelah capture artefak.

Checklist operator, perintah dispatch workflow GitHub, kontrak komentar bukti,
tabel keputusan hydrate-mode, interpretasi timing, dan langkah penanganan kegagalan
ada di [Runbook Desktop Slack Mantis](/id/concepts/mantis-slack-desktop-runbook).

Untuk tugas desktop bergaya agen/CV, jalankan:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` menyewa atau menggunakan ulang mesin desktop/browser Crabbox, memulai
`crabbox record --while`, mengendalikan browser yang terlihat melalui
`visual-driver` bersarang, menangkap `visual-task.png`, menjalankan `openclaw infer image describe`
terhadap screenshot ketika `--vision-mode image-describe` dipilih, dan
menulis `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, dan `mantis-visual-task-report.md`.
Ketika `--expect-text` diatur, prompt vision meminta verdict JSON terstruktur
dan hanya lolos ketika model melaporkan bukti visual positif; respons
negatif yang sekadar mengutip teks target menggagalkan asersi.
Gunakan `--vision-mode metadata` untuk smoke tanpa model yang membuktikan plumbing
desktop, browser, screenshot, dan video tanpa memanggil provider pemahaman gambar.
Perekaman adalah artefak wajib untuk `visual-task`; jika Crabbox tidak merekam
`visual-task.mp4` yang tidak kosong, tugas gagal meskipun driver visual
lolos. Saat gagal, Mantis mempertahankan lease untuk VNC kecuali tugas sudah
lolos dan `--keep-lease` tidak diatur.

Sebelum menggunakan kredensial live yang dipool, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi keterjangkauan admin/list ketika secret maintainer tersedia. Ia hanya melaporkan status disetel/hilang untuk secret.

## Cakupan transport live

Lane transport live berbagi satu kontrak, bukan masing-masing membuat bentuk daftar skenario sendiri. `qa-channel` adalah suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

| Lane     | Canary | Gating mention | Bot-ke-bot | Blokir allowlist | Balasan level atas | Lanjut setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaksi | Perintah help | Registrasi perintah native |
| -------- | ------ | -------------- | ---------- | ---------------- | ------------------ | ---------------------- | -------------------- | -------------- | ---------------- | ------------- | -------------------------- |
| Matrix   | x      | x              | x          | x                | x                  | x                      | x                    | x              | x                |               |                            |
| Telegram | x      | x              | x          |                  |                    |                        |                      |                |                  | x             |                            |
| Discord  | x      | x              | x          |                  |                    |                        |                      |                |                  |               | x                          |
| Slack    | x      | x              | x          | x                | x                  | x                      | x                    | x              |                  |               |                            |

Ini mempertahankan `qa-channel` sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transport live mendatang berbagi satu checklist kontrak transport
eksplisit.

Untuk lane VM Linux sekali pakai tanpa memasukkan Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, memasang dependensi, membuild OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan dan
ringkasan QA normal kembali ke `.artifacts/qa-e2e/...` pada host.
Ia menggunakan ulang perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Run suite host dan Multipass menjalankan beberapa skenario terpilih secara paralel
dengan worker Gateway terisolasi secara default. `qa-channel` default ke concurrency
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar non-nol ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika
Anda menginginkan artefak tanpa kode keluar gagal.
Run live meneruskan input auth QA yang didukung dan praktis untuk
guest: key provider berbasis env, path config provider live QA, dan
`CODEX_HOME` ketika ada. Simpan `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang dimount.

## Referensi QA Telegram, Discord, dan Slack

Matrix memiliki [halaman khusus](/id/concepts/qa-matrix) karena jumlah skenarionya dan penyediaan homeserver berbasis Docker. Telegram, Discord, dan Slack lebih kecil - beberapa skenario masing-masing, tanpa sistem profil, terhadap channel nyata yang sudah ada - sehingga referensinya ada di sini.

### Flag CLI bersama

Lane ini terdaftar melalui `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan menerima flag yang sama:

| Flag                                  | Default                                                         | Deskripsi                                                                                                             |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Jalankan hanya skenario ini. Dapat diulang.                                                                           |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Tempat laporan/ringkasan/pesan yang diamati dan log output ditulis. Path relatif di-resolve terhadap `--repo-root`.   |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Root repositori saat dipanggil dari cwd netral.                                                                       |
| `--sut-account <id>`                  | `sut`                                                           | Id akun sementara di dalam config Gateway QA.                                                                         |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` atau `live-frontier` (`live-openai` legacy masih berfungsi).                                            |
| `--model <ref>` / `--alt-model <ref>` | default provider                                                | Ref model primer/alternatif.                                                                                          |
| `--fast`                              | off                                                             | Mode cepat provider jika didukung.                                                                                    |
| `--credential-source <env\|convex>`   | `env`                                                           | Lihat [Pool kredensial Convex](#convex-credential-pool).                                                              |
| `--credential-role <maintainer\|ci>`  | `ci` di CI, selain itu `maintainer`                             | Peran yang digunakan ketika `--credential-source convex`.                                                             |

Setiap lane keluar non-nol pada skenario yang gagal. `--allow-failures` menulis artefak tanpa mengatur kode keluar gagal.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Menargetkan satu grup Telegram privat nyata dengan dua bot berbeda (driver + SUT). Bot SUT harus memiliki username Telegram; observasi bot-ke-bot bekerja paling baik ketika kedua bot mengaktifkan **Mode Komunikasi Bot-ke-Bot** di `@BotFather`.

Env wajib ketika `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id chat numerik (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opsional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mempertahankan body pesan dalam artefak pesan yang diamati (default menyunting).

Skenario (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Artefak output:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - mencakup RTT per balasan (driver mengirim → balasan SUT diamati) mulai dari canary.
- `telegram-qa-observed-messages.json` - body disunting kecuali `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Menargetkan satu channel guild Discord privat nyata dengan dua bot: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Discord bundel. Memverifikasi penanganan mention channel, bahwa bot SUT telah mendaftarkan perintah native `/help` dengan Discord, dan skenario bukti Mantis opt-in.

Env wajib ketika `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - harus cocok dengan id user bot SUT yang dikembalikan oleh Discord (jika tidak, lane gagal cepat).

Opsional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mempertahankan body pesan dalam artefak pesan yang diamati.

Skenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - skenario Mantis opt-in. Berjalan sendiri karena mengalihkan SUT ke balasan guild selalu aktif, hanya alat dengan `messages.statusReactions.enabled=true`, lalu menangkap timeline reaksi REST plus artefak visual HTML/PNG. Laporan sebelum/sesudah Mantis juga mempertahankan artefak MP4 yang disediakan skenario sebagai `baseline.mp4` dan `candidate.mp4`.

Jalankan skenario reaksi status Mantis secara eksplisit:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artefak keluaran:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - isi disamarkan kecuali `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` dan `discord-status-reactions-tool-only-timeline.png` saat skenario reaksi status berjalan.

### QA Slack

```bash
pnpm openclaw qa slack
```

Menargetkan satu kanal privat Slack sungguhan dengan dua bot berbeda: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Slack bawaan.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opsional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan-teramati.

Skenario (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Artefak keluaran:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - isi disamarkan kecuali `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Menyiapkan workspace Slack

Lane ini membutuhkan dua aplikasi Slack berbeda dalam satu workspace, plus satu kanal tempat kedua bot menjadi anggota:

- `channelId` - id `Cxxxxxxxxxx` dari kanal tempat kedua bot telah diundang. Gunakan kanal khusus; lane ini memposting pada setiap run.
- `driverBotToken` - token bot (`xoxb-...`) dari aplikasi **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) dari aplikasi **SUT**, yang harus merupakan aplikasi Slack terpisah dari driver sehingga id pengguna botnya berbeda.
- `sutAppToken` - token tingkat aplikasi (`xapp-...`) dari aplikasi SUT dengan `connections:write`, digunakan oleh Socket Mode agar aplikasi SUT dapat menerima event.

Lebih baik gunakan workspace Slack yang khusus untuk QA daripada memakai ulang workspace produksi.

Manifest SUT di bawah ini sengaja mempersempit instalasi produksi Plugin Slack bawaan (`extensions/slack/src/setup-shared.ts:10`) ke izin dan event yang dicakup oleh suite QA Slack live. Untuk penyiapan kanal produksi sebagaimana dilihat pengguna, lihat [Penyiapan cepat kanal Slack](/id/channels/slack#quick-setup); pasangan QA Driver/SUT sengaja dipisahkan karena lane ini membutuhkan dua id pengguna bot yang berbeda dalam satu workspace.

**1. Buat aplikasi Driver**

Buka [api.slack.com/apps](https://api.slack.com/apps) → _Buat Aplikasi Baru_ → _Dari manifest_ → pilih workspace QA, tempel manifest berikut, lalu _Instal ke Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Salin _Token OAuth Pengguna Bot_ (`xoxb-...`) - itu menjadi `driverBotToken`. Driver hanya perlu memposting pesan dan mengidentifikasi dirinya; tanpa event, tanpa Socket Mode.

**2. Buat aplikasi SUT**

Ulangi _Buat Aplikasi Baru → Dari manifest_ di workspace yang sama. Aplikasi QA ini sengaja menggunakan versi yang lebih sempit dari manifest produksi Plugin Slack bawaan (`extensions/slack/src/setup-shared.ts:10`): cakupan dan event reaksi dihilangkan karena suite QA Slack live belum mencakup penanganan reaksi.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Setelah Slack membuat aplikasi, lakukan dua hal di halaman pengaturannya:

- _Instal ke Workspace_ → salin _Token OAuth Pengguna Bot_ → itu menjadi `sutBotToken`.
- _Informasi Dasar → Token Tingkat Aplikasi → Hasilkan Token dan Cakupan_ → tambahkan cakupan `connections:write` → simpan → salin nilai `xapp-...` → itu menjadi `sutAppToken`.

Verifikasi bahwa kedua bot memiliki id pengguna yang berbeda dengan memanggil `auth.test` pada setiap token. Runtime membedakan driver dan SUT berdasarkan id pengguna; memakai ulang satu aplikasi untuk keduanya akan langsung menggagalkan mention-gating.

**3. Buat kanal**

Di workspace QA, buat kanal (mis. `#openclaw-qa`) dan undang kedua bot dari dalam kanal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Salin id `Cxxxxxxxxxx` dari _info kanal → Tentang → ID Kanal_ - itu menjadi `channelId`. Kanal publik dapat digunakan; jika Anda menggunakan kanal privat, kedua aplikasi sudah memiliki `groups:history` sehingga pembacaan riwayat oleh harness tetap akan berhasil.

**4. Daftarkan kredensial**

Ada dua opsi. Gunakan env vars untuk debugging pada satu mesin (atur empat variabel `OPENCLAW_QA_SLACK_*` dan berikan `--credential-source env`), atau seed pool Convex bersama agar CI dan maintainer lain dapat menyewanya.

Untuk pool Convex, tulis empat field ke file JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Dengan `OPENCLAW_QA_CONVEX_SITE_URL` dan `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` diekspor di shell Anda, daftarkan dan verifikasi:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Harapkan `count: 1`, `status: "active"`, tanpa field `lease`.

**5. Verifikasi dari awal hingga akhir**

Jalankan lane secara lokal untuk mengonfirmasi bahwa kedua bot dapat berbicara satu sama lain melalui broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Run yang hijau selesai jauh di bawah 30 detik dan `slack-qa-report.md` menampilkan `slack-canary` maupun `slack-mention-gating` dengan status `pass`. Jika lane menggantung selama ~90 detik dan keluar dengan `Convex credential pool exhausted for kind "slack"`, berarti pool kosong atau setiap baris sedang disewa - `qa credentials list --kind slack --status all --json` akan memberi tahu Anda yang mana.

### Pool kredensial Convex

Lane Telegram, Discord, dan Slack dapat menyewa kredensial dari pool Convex bersama alih-alih membaca env vars di atas. Berikan `--credential-source convex` (atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab memperoleh lease eksklusif, mengirim Heartbeat selama durasi run, dan merilisnya saat shutdown. Jenis pool adalah `"telegram"`, `"discord"`, dan `"slack"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` harus berupa string chat-id numerik.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` harus cocok dengan `^[A-Z][A-Z0-9]+$` (id Slack seperti `Cxxxxxxxxxx`). Lihat [Menyiapkan workspace Slack](#setting-up-the-slack-workspace) untuk penyediaan aplikasi dan cakupan.

Env vars operasional dan kontrak endpoint broker Convex berada di [Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1) (nama bagian ini lebih lama daripada dukungan Discord; semantik broker identik untuk kedua jenis).

## Seed berbasis repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Ini sengaja disimpan di git agar rencana QA terlihat oleh manusia maupun
agent.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah
sumber kebenaran untuk satu run pengujian dan harus mendefinisikan:

- metadata skenario
- metadata kategori, kapabilitas, lane, dan risiko opsional
- referensi docs dan kode
- persyaratan Plugin opsional
- patch konfigurasi Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang yang mendukung `qa-flow` boleh tetap generik
dan lintas-aspek. Misalnya, skenario markdown dapat menggabungkan helper sisi transport
dengan helper sisi browser yang mengendalikan Control UI tertanam melalui
seam Gateway `browser.request` tanpa menambahkan runner kasus-khusus.

File skenario harus dikelompokkan berdasarkan kapabilitas produk, bukan folder
pohon sumber. Pertahankan ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan kanal
- perilaku thread
- siklus hidup tindakan pesan
- callback cron
- pengingatan memori
- pergantian model
- handoff subagent
- pembacaan repo dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock provider

`qa suite` memiliki dua lane mock provider lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi lane mock
  deterministik default untuk QA berbasis repo dan gate paritas.
- `aimock` memulai server provider berbasis AIMock untuk cakupan protokol,
  fixture, rekam/putar ulang, dan chaos eksperimental. Ini bersifat aditif dan tidak
  menggantikan dispatcher skenario `mock-openai`.

Implementasi lane provider berada di bawah `extensions/qa-lab/src/providers/`.
Setiap provider memiliki default, startup server lokal, konfigurasi model Gateway,
kebutuhan staging auth-profile, dan flag kapabilitas live/mock sendiri. Kode suite bersama dan
Gateway harus merutekan melalui registry provider, bukan bercabang berdasarkan
nama provider.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown. `qa-channel` adalah adapter pertama pada seam itu, tetapi target desainnya lebih luas: kanal nyata atau sintetis di masa depan harus terhubung ke runner suite yang sama alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pemisahannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- Adapter transport memiliki konfigurasi Gateway, kesiapan, observasi masuk dan keluar, tindakan transport, dan status transport yang dinormalisasi.
- File skenario markdown di bawah `qa/scenarios/` mendefinisikan run pengujian; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang yang mengeksekusinya.

### Menambahkan kanal

Menambahkan kanal ke sistem QA markdown memerlukan tepat dua hal:

1. Adapter transport untuk kanal tersebut.
2. Paket skenario yang menguji kontrak kanal.

Jangan tambahkan root perintah QA tingkat atas baru saat host bersama `qa-lab` dapat memiliki flow tersebut.

`qa-lab` memiliki mekanika host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- konkurensi worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` lama

Plugin runner memiliki kontrak transport:

- bagaimana `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- bagaimana gateway dikonfigurasi untuk transport tersebut
- bagaimana kesiapan diperiksa
- bagaimana event masuk diinjeksi
- bagaimana pesan keluar diamati
- bagaimana transkrip dan status transport ternormalisasi diekspos
- bagaimana tindakan yang didukung transport dijalankan
- bagaimana reset atau pembersihan khusus transport ditangani

Batas minimum adopsi untuk saluran baru:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Simpan mekanika khusus transport di dalam plugin runner atau harness saluran.
4. Pasang runner sebagai `openclaw qa <runner>` alih-alih mendaftarkan perintah root pesaing. Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`. Jaga `runtime-api.ts` tetap ringan; eksekusi CLI dan runner secara lazy harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasikan skenario markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada agar tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport saluran, simpan di plugin runner atau harness plugin tersebut.
- Jika skenario memerlukan kapabilitas baru yang dapat digunakan lebih dari satu saluran, tambahkan helper generik alih-alih cabang khusus saluran di `suite.ts`.
- Jika perilaku hanya bermakna untuk satu transport, pertahankan skenario tetap khusus transport dan nyatakan hal itu secara eksplisit dalam kontrak skenario.

### Nama helper skenario

Helper generik yang disarankan untuk skenario baru:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Alias kompatibilitas tetap tersedia untuk skenario yang ada - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - tetapi penulisan skenario baru harus menggunakan nama generik. Alias ada untuk menghindari migrasi serentak, bukan sebagai model ke depannya.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia - berguna saat memperkirakan pekerjaan tindak lanjut atau menyambungkan transport baru - jalankan `pnpm openclaw qa coverage` (tambahkan `--json` untuk output yang dapat dibaca mesin).

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama di beberapa ref model live
dan tulis laporan Markdown yang dinilai:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Perintah tersebut menjalankan proses child Gateway QA lokal, bukan Docker. Skenario eval karakter
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat tidak boleh
diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap
transkrip lengkap, merekam statistik run dasar, lalu meminta model juri dalam mode cepat dengan
reasoning `xhigh` jika didukung untuk memeringkat run berdasarkan kewajaran, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt juri tetap mendapatkan
setiap transkrip dan status run, tetapi ref kandidat diganti dengan label netral
seperti `candidate-01`; laporan memetakan peringkat kembali ke ref sebenarnya setelah
parsing.
Run kandidat default ke thinking `high`, dengan `medium` untuk GPT-5.5 dan `xhigh`
untuk ref eval OpenAI lama yang mendukungnya. Timpa kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` dipertahankan
untuk kompatibilitas.
Ref kandidat OpenAI default ke mode cepat sehingga pemrosesan prioritas digunakan jika
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline ketika
satu kandidat atau juri memerlukan override. Berikan `--fast` hanya ketika Anda ingin
memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan juri
direkam dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit mengatakan
untuk tidak memeringkat berdasarkan kecepatan.
Run model kandidat dan juri keduanya default ke konkurensi 16. Turunkan
`--concurrency` atau `--judge-concurrency` ketika batas provider atau tekanan Gateway
lokal membuat run terlalu bising.
Ketika tidak ada kandidat `--model` yang diberikan, eval karakter default ke
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` ketika tidak ada `--model` yang diberikan.
Ketika tidak ada `--judge-model` yang diberikan, juri default ke
`openai/gpt-5.5,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [QA Matriks](/id/concepts/qa-matrix)
- [Channel QA](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dashboard](/id/web/dashboard)
