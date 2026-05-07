---
read_when:
    - Memahami bagaimana rangkaian QA saling terintegrasi
    - Memperluas qa-lab, qa-channel, atau adaptor transport
    - Menambahkan skenario QA yang didukung repositori
    - Membangun otomatisasi QA dengan realisme lebih tinggi seputar dasbor Gateway
summary: 'Ikhtisar stack QA: qa-lab, qa-channel, skenario berbasis repo, jalur transport langsung, adaptor transport, dan pelaporan.'
title: Ikhtisar QA
x-i18n:
    generated_at: "2026-05-07T13:15:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis dan
berbentuk kanal daripada yang dapat dilakukan oleh satu pengujian unit.

Bagian saat ini:

- `extensions/qa-channel`: kanal pesan sintetis dengan permukaan DM, kanal, thread,
  reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `extensions/qa-matrix`, Plugin runner masa depan: adaptor transport langsung yang
  menjalankan kanal nyata di dalam Gateway QA anak.
- `qa/`: aset seed yang didukung repo untuk tugas awal dan skenario QA
  baseline.
- [Mantis](/id/concepts/mantis): verifikasi langsung sebelum dan sesudah untuk bug yang
  memerlukan transport nyata, tangkapan layar browser, status VM, dan bukti PR.

## Permukaan perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip `pnpm qa:*`;
kedua bentuk didukung.

| Perintah                                             | Tujuan                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Pemeriksaan mandiri QA bawaan; menulis laporan Markdown.                                                                                                                                                                                                                        |
| `qa suite`                                          | Jalankan skenario yang didukung repo terhadap jalur Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` untuk VM Linux sekali pakai.                                                                                                                                  |
| `qa coverage`                                       | Cetak inventaris cakupan skenario markdown (`--json` untuk keluaran mesin).                                                                                                                                                                                           |
| `qa parity-report`                                  | Bandingkan dua file `qa-suite-summary.json` dan tulis laporan paritas agentik.                                                                                                                                                                                          |
| `qa character-eval`                                 | Jalankan skenario QA karakter di beberapa model langsung dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Jalankan prompt sekali pakai terhadap jalur provider/model yang dipilih.                                                                                                                                                                                                          |
| `qa ui`                                             | Mulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Bangun image Docker QA prabangun.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Tulis scaffold docker-compose untuk dasbor QA + jalur Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Bangun situs QA, mulai stack yang didukung Docker, cetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Mulai hanya server provider AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Mulai hanya server provider `mock-openai` yang sadar skenario.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Kelola pool kredensial Convex bersama.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Jalur transport langsung terhadap homeserver Tuwunel sekali pakai. Lihat [Matrix QA](/id/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Jalur transport langsung terhadap grup Telegram privat nyata.                                                                                                                                                                                                              |
| `qa discord`                                        | Jalur transport langsung terhadap kanal guild Discord privat nyata.                                                                                                                                                                                                       |
| `qa slack`                                          | Jalur transport langsung terhadap kanal Slack privat nyata.                                                                                                                                                                                                               |
| `qa mantis`                                         | Runner verifikasi sebelum dan sesudah untuk bug transport langsung, dengan bukti reaksi status Discord, smoke desktop/browser Crabbox, dan smoke Slack-di-VNC. Lihat [Mantis](/id/concepts/mantis) dan [Runbook Desktop Slack Mantis](/id/concepts/mantis-slack-desktop-runbook). |

## Alur operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip mirip Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai jalur Gateway yang didukung Docker, dan mengekspos
halaman QA Lab tempat operator atau loop otomatisasi dapat memberi agen sebuah misi QA,
mengamati perilaku kanal nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab lokal yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundel QA Lab yang dipasang sebagai bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mempertahankan layanan Docker pada image prabangun dan memasang
`extensions/qa-lab/web/dist` ke dalam kontainer `qa-lab` sebagai bind mount. `qa:lab:watch`
membangun ulang bundel itu saat ada perubahan, dan browser memuat ulang otomatis ketika hash aset QA Lab berubah.

Untuk smoke trace OpenTelemetry lokal, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip itu memulai penerima trace OTLP/HTTP lokal, menjalankan skenario QA
`otel-trace-smoke` dengan Plugin `diagnostics-otel` diaktifkan, lalu
mendekode span protobuf yang diekspor dan menegaskan bentuk kritis rilis:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, dan `openclaw.message.delivery` harus ada;
panggilan model tidak boleh mengekspor `StreamAbandoned` pada giliran yang berhasil; ID diagnostik mentah dan
atribut `openclaw.content.*` harus tetap berada di luar trace. Ini menulis
`otel-smoke-summary.json` di sebelah artefak suite QA.

QA observabilitas tetap hanya untuk checkout sumber. Tarball npm sengaja menghilangkan
QA Lab, jadi jalur rilis Docker paket tidak menjalankan perintah `qa`. Gunakan
`pnpm qa:otel:smoke` dari checkout sumber yang telah dibangun saat mengubah instrumentasi
diagnostik.

Untuk jalur smoke Matrix yang benar-benar memakai transport nyata, jalankan:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Referensi CLI lengkap, katalog profil/skenario, variabel lingkungan, dan tata letak artefak untuk jalur ini ada di [Matrix QA](/id/concepts/qa-matrix). Sekilas: ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver/SUT/observer sementara, menjalankan Plugin Matrix nyata di dalam Gateway QA anak yang dibatasi ke transport itu (tanpa `qa-channel`), lalu menulis laporan Markdown, ringkasan JSON, artefak peristiwa yang diamati, dan log keluaran gabungan di bawah `.artifacts/qa-e2e/matrix-<timestamp>/`.

Skenario mencakup perilaku transport yang tidak dapat dibuktikan pengujian unit secara end to end: gating mention, kebijakan allow-bot, allowlist, balasan tingkat atas dan dalam thread, perutean DM, penanganan reaksi, penekanan edit masuk, dedupe replay restart, pemulihan interupsi homeserver, pengiriman metadata persetujuan, penanganan media, dan alur bootstrap/pemulihan/verifikasi Matrix E2EE. Profil CLI E2EE juga menjalankan `openclaw matrix encryption setup` dan perintah verifikasi melalui homeserver sekali pakai yang sama sebelum memeriksa balasan Gateway.

Discord juga memiliki skenario opt-in khusus Mantis untuk reproduksi bug. Gunakan
`--scenario discord-status-reactions-tool-only` untuk timeline reaksi status eksplisit,
atau `--scenario discord-thread-reply-filepath-attachment` untuk membuat thread
Discord nyata dan memverifikasi bahwa `message.thread-reply` mempertahankan lampiran
`filePath`. Skenario ini tetap berada di luar jalur Discord langsung default
karena merupakan probe repro sebelum/sesudah, bukan cakupan smoke luas.
Workflow Mantis lampiran thread juga dapat menambahkan video saksi Discord Web
yang sudah login saat `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` atau
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` dikonfigurasi di lingkungan QA.
Profil penampil itu hanya untuk pengambilan visual; keputusan lulus/gagal
tetap berasal dari oracle REST Discord.

CI menggunakan permukaan perintah yang sama di `.github/workflows/qa-live-transports-convex.yml`. Run terjadwal dan manual default menjalankan profil Matrix cepat dengan kredensial frontier langsung, `--fast`, dan `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. `matrix_profile=all` manual bercabang ke lima shard profil sehingga katalog menyeluruh dapat berjalan paralel sambil mempertahankan satu direktori artefak per shard.

Untuk jalur smoke Telegram, Discord, dan Slack yang benar-benar memakai transport nyata:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Jalur-jalur itu menargetkan kanal nyata yang sudah ada dengan dua bot (driver + SUT). Variabel lingkungan yang diperlukan, daftar skenario, artefak keluaran, dan pool kredensial Convex didokumentasikan dalam [referensi QA Telegram, Discord, dan Slack](#telegram-discord-and-slack-qa-reference) di bawah.

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
saat perekaman video tersedia kembali ke direktori artefak Mantis. Sewa
desktop/browser Crabbox menyediakan alat tangkap dan paket pembantu browser/native-build
sejak awal, sehingga skenario hanya perlu memasang fallback pada sewa yang lebih lama. Mantis
melaporkan waktu total dan per fase di
`mantis-slack-desktop-smoke-report.md` sehingga run yang lambat menunjukkan apakah waktu digunakan untuk
pemanasan sewa, akuisisi kredensial, penyiapan remote, atau penyalinan artefak. Gunakan kembali
`--lease-id <cbx_...>` setelah masuk ke Slack Web secara manual melalui VNC;
sewa yang digunakan kembali juga menjaga cache store pnpm Crabbox tetap hangat. Default
`--hydrate-mode source` memverifikasi dari checkout sumber dan menjalankan install/build
di dalam VM. Gunakan `--hydrate-mode prehydrated` hanya ketika workspace remote yang digunakan kembali
sudah memiliki `node_modules` dan `dist/` yang sudah dibangun; mode tersebut melewati
langkah install/build yang mahal dan gagal tertutup ketika workspace belum siap.
Dengan `--gateway-setup`, Mantis membiarkan Gateway OpenClaw Slack persisten
berjalan di dalam VM pada port `38973`; tanpa itu, perintah menjalankan
lane QA Slack bot-ke-bot normal dan keluar setelah tangkapan artefak.

Checklist operator, perintah dispatch workflow GitHub, kontrak komentar bukti,
tabel keputusan hydrate-mode, interpretasi waktu, dan langkah penanganan kegagalan
ada di [Runbook Desktop Slack Mantis](/id/concepts/mantis-slack-desktop-runbook).

Untuk tugas desktop bergaya agent/CV, jalankan:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` menyewa atau menggunakan kembali mesin desktop/browser Crabbox, memulai
`crabbox record --while`, mengendalikan browser yang terlihat melalui
`visual-driver` bertingkat, menangkap `visual-task.png`, menjalankan `openclaw infer image describe`
terhadap tangkapan layar saat `--vision-mode image-describe` dipilih, dan
menulis `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, dan `mantis-visual-task-report.md`.
Saat `--expect-text` disetel, prompt vision meminta verdict JSON terstruktur
dan hanya lulus ketika model melaporkan bukti terlihat yang positif; respons
negatif yang hanya mengutip teks target akan menggagalkan asersi.
Gunakan `--vision-mode metadata` untuk smoke tanpa model yang membuktikan plumbing desktop,
browser, tangkapan layar, dan video tanpa memanggil penyedia pemahaman gambar.
Perekaman adalah artefak wajib untuk `visual-task`; jika Crabbox tidak merekam
`visual-task.mp4` yang tidak kosong, tugas gagal meskipun visual driver
lulus. Saat gagal, Mantis mempertahankan sewa untuk VNC kecuali tugas sudah
lulus dan `--keep-lease` tidak disetel.

Sebelum menggunakan kredensial live yang dipool, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi keterjangkauan admin/list saat rahasia maintainer ada. Ini hanya melaporkan status disetel/hilang untuk rahasia.

## Cakupan transport live

Lane transport live berbagi satu kontrak alih-alih masing-masing menciptakan bentuk daftar skenarionya sendiri. `qa-channel` adalah suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

| Lane     | Canary | Gating mention | Bot-ke-bot | Blok allowlist | Balasan tingkat atas | Lanjutkan setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaksi | Perintah bantuan | Registrasi perintah native |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

Ini menjaga `qa-channel` sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transport live mendatang berbagi satu checklist kontrak transport
yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, memasang dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA normal dan
ringkasan kembali ke `.artifacts/qa-e2e/...` pada host.
Ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
Run suite host dan Multipass mengeksekusi beberapa skenario terpilih secara paralel
dengan worker Gateway terisolasi secara default. `qa-channel` default ke konkurensi
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa kode keluar gagal.
Run live meneruskan input auth QA yang didukung dan praktis untuk
guest: kunci penyedia berbasis env, path konfigurasi penyedia live QA, dan
`CODEX_HOME` saat ada. Jaga `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang dipasang.

## Referensi QA Telegram, Discord, dan Slack

Matrix memiliki [halaman khusus](/id/concepts/qa-matrix) karena jumlah skenarionya dan penyediaan homeserver berbasis Docker. Telegram, Discord, dan Slack lebih kecil - masing-masing beberapa skenario, tanpa sistem profil, terhadap kanal nyata yang sudah ada - sehingga referensinya berada di sini.

### Flag CLI bersama

Lane ini mendaftar melalui `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan menerima flag yang sama:

| Flag                                  | Default                                                         | Deskripsi                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Jalankan hanya skenario ini. Dapat diulang.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Tempat laporan/ringkasan/pesan teramati dan log output ditulis. Path relatif diresolve terhadap `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Root repositori saat dipanggil dari cwd netral.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | Id akun sementara di dalam konfigurasi Gateway QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` atau `live-frontier` (`live-openai` lama masih berfungsi).                                                  |
| `--model <ref>` / `--alt-model <ref>` | default penyedia                                                | Ref model primer/alternatif.                                                                                         |
| `--fast`                              | nonaktif                                                        | Mode cepat penyedia jika didukung.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | Lihat [pool kredensial Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` di CI, selain itu `maintainer`                              | Peran yang digunakan saat `--credential-source convex`.                                                                          |

Setiap lane keluar non-zero pada skenario gagal apa pun. `--allow-failures` menulis artefak tanpa menetapkan kode keluar gagal.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Menargetkan satu grup Telegram privat nyata dengan dua bot berbeda (driver + SUT). Bot SUT harus memiliki username Telegram; observasi bot-ke-bot bekerja paling baik saat kedua bot mengaktifkan **Mode Komunikasi Bot-ke-Bot** di `@BotFather`.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id chat numerik (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opsional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mempertahankan body pesan dalam artefak pesan teramati (default meredaksi).

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
- `telegram-qa-summary.json` - mencakup RTT per balasan (driver mengirim → balasan SUT teramati) dimulai dari canary.
- `telegram-qa-observed-messages.json` - body diredaksi kecuali `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Menargetkan satu kanal guild Discord privat nyata dengan dua bot: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Discord bawaan. Memverifikasi penanganan mention kanal, bahwa bot SUT telah mendaftarkan perintah native `/help` dengan Discord, dan skenario bukti Mantis opt-in.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - harus cocok dengan id pengguna bot SUT yang dikembalikan oleh Discord (jika tidak, lane gagal cepat).

Opsional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mempertahankan body pesan dalam artefak pesan teramati.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` memilih kanal voice/stage untuk `discord-voice-autojoin`; tanpanya, skenario memilih kanal voice/stage pertama yang terlihat untuk bot SUT.

Skenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - skenario suara opt-in. Berjalan sendiri, mengaktifkan `channels.discord.voice.autoJoin`, dan memverifikasi bahwa status suara Discord bot SUT saat ini adalah channel suara/stage target. Kredensial Convex Discord dapat menyertakan `voiceChannelId` opsional; jika tidak, runner menemukan channel suara/stage pertama yang terlihat di guild.
- `discord-status-reactions-tool-only` - skenario Mantis opt-in. Berjalan sendiri karena skenario ini mengalihkan SUT ke balasan guild selalu aktif dan hanya alat dengan `messages.statusReactions.enabled=true`, lalu menangkap timeline reaksi REST beserta artefak visual HTML/PNG. Laporan Mantis sebelum/sesudah juga mempertahankan artefak MP4 yang disediakan skenario sebagai `baseline.mp4` dan `candidate.mp4`.

Jalankan skenario gabung otomatis suara Discord secara eksplisit:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Jalankan skenario reaksi status Mantis secara eksplisit:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artefak output:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - isi disamarkan kecuali `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` dan `discord-status-reactions-tool-only-timeline.png` saat skenario reaksi status berjalan.

### QA Slack

```bash
pnpm openclaw qa slack
```

Menargetkan satu channel privat Slack nyata dengan dua bot berbeda: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Slack bawaan.

Env yang wajib saat `--credential-source env`:

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

Artefak output:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - isi disamarkan kecuali `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Menyiapkan workspace Slack

Lane ini memerlukan dua aplikasi Slack berbeda dalam satu workspace, ditambah sebuah channel tempat kedua bot menjadi anggota:

- `channelId` - id `Cxxxxxxxxxx` dari channel tempat kedua bot telah diundang. Gunakan channel khusus; lane ini memposting pada setiap run.
- `driverBotToken` - token bot (`xoxb-...`) dari aplikasi **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) dari aplikasi **SUT**, yang harus berupa aplikasi Slack terpisah dari driver agar id pengguna botnya berbeda.
- `sutAppToken` - token tingkat aplikasi (`xapp-...`) dari aplikasi SUT dengan `connections:write`, digunakan oleh Socket Mode agar aplikasi SUT dapat menerima event.

Lebih disarankan menggunakan workspace Slack khusus untuk QA daripada memakai ulang workspace produksi.

Manifest SUT di bawah ini sengaja mempersempit instalasi produksi Plugin Slack bawaan (`extensions/slack/src/setup-shared.ts:10`) ke izin dan event yang dicakup oleh rangkaian QA Slack live. Untuk penyiapan channel produksi sebagaimana dilihat pengguna, lihat [Penyiapan cepat channel Slack](/id/channels/slack#quick-setup); pasangan Driver/SUT QA sengaja terpisah karena lane ini memerlukan dua id pengguna bot berbeda dalam satu workspace.

**1. Buat aplikasi Driver**

Buka [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → pilih workspace QA, tempel manifest berikut, lalu _Install to Workspace_:

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

Salin _Bot User OAuth Token_ (`xoxb-...`) - itu menjadi `driverBotToken`. Driver hanya perlu memposting pesan dan mengidentifikasi dirinya; tanpa event, tanpa Socket Mode.

**2. Buat aplikasi SUT**

Ulangi _Create New App → From a manifest_ di workspace yang sama. Aplikasi QA ini sengaja menggunakan versi yang lebih sempit dari manifest produksi Plugin Slack bawaan (`extensions/slack/src/setup-shared.ts:10`): scope dan event reaksi dihilangkan karena rangkaian QA Slack live belum mencakup penanganan reaksi.

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

Setelah Slack membuat aplikasi, lakukan dua hal pada halaman pengaturannya:

- _Install to Workspace_ → salin _Bot User OAuth Token_ → itu menjadi `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → tambahkan scope `connections:write` → simpan → salin nilai `xapp-...` → itu menjadi `sutAppToken`.

Verifikasi kedua bot memiliki id pengguna yang berbeda dengan memanggil `auth.test` pada masing-masing token. Runtime membedakan driver dan SUT berdasarkan id pengguna; memakai ulang satu aplikasi untuk keduanya akan langsung menggagalkan mention-gating.

**3. Buat channel**

Di workspace QA, buat channel (mis. `#openclaw-qa`) dan undang kedua bot dari dalam channel:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Salin id `Cxxxxxxxxxx` dari _channel info → About → Channel ID_ - itu menjadi `channelId`. Channel publik bisa digunakan; jika Anda menggunakan channel privat, kedua aplikasi sudah memiliki `groups:history` sehingga pembacaan riwayat oleh harness tetap berhasil.

**4. Daftarkan kredensial**

Ada dua opsi. Gunakan variabel env untuk debugging satu mesin (atur empat variabel `OPENCLAW_QA_SLACK_*` dan berikan `--credential-source env`), atau seed pool Convex bersama agar CI dan maintainer lain dapat menyewanya.

Untuk pool Convex, tulis empat bidang ke file JSON:

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

Harapkan `count: 1`, `status: "active"`, tanpa bidang `lease`.

**5. Verifikasi end to end**

Jalankan lane secara lokal untuk mengonfirmasi kedua bot dapat saling berkomunikasi melalui broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Run yang berhasil selesai jauh di bawah 30 detik dan `slack-qa-report.md` menampilkan `slack-canary` dan `slack-mention-gating` dengan status `pass`. Jika lane menggantung selama ~90 detik dan keluar dengan `Convex credential pool exhausted for kind "slack"`, pool kosong atau setiap baris sedang disewa - `qa credentials list --kind slack --status all --json` akan memberi tahu yang mana.

### Pool kredensial Convex

Lane Telegram, Discord, dan Slack dapat menyewa kredensial dari pool Convex bersama alih-alih membaca variabel env di atas. Berikan `--credential-source convex` (atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab memperoleh lease eksklusif, mengirim Heartbeat selama durasi run, dan melepaskannya saat shutdown. Jenis pool adalah `"telegram"`, `"discord"`, dan `"slack"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` harus berupa string chat-id numerik.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` harus cocok dengan `^[A-Z][A-Z0-9]+$` (id Slack seperti `Cxxxxxxxxxx`). Lihat [Menyiapkan workspace Slack](#setting-up-the-slack-workspace) untuk penyediaan aplikasi dan scope.

Variabel env operasional dan kontrak endpoint broker Convex ada di [Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1) (nama bagian ini sudah ada sebelum dukungan Discord; semantik broker identik untuk kedua jenis).

## Seed berbasis repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Aset ini sengaja ada di git agar rencana QA terlihat oleh manusia dan agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah sumber kebenaran untuk satu run pengujian dan harus mendefinisikan:

- metadata skenario
- metadata kategori, kapabilitas, lane, dan risiko opsional
- referensi docs dan kode
- persyaratan Plugin opsional
- patch konfigurasi Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime pakai ulang yang mendukung `qa-flow` boleh tetap generik dan lintas-cutting. Misalnya, skenario markdown dapat menggabungkan helper sisi transport dengan helper sisi browser yang menggerakkan Control UI tertanam melalui seam `browser.request` Gateway tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan kapabilitas produk, bukan folder source tree. Pertahankan ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs` untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup tindakan pesan
- callback Cron
- recall memori
- perpindahan model
- handoff subagent
- pembacaan repo dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock provider

`qa suite` memiliki dua lane mock provider lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi lane mock deterministik default untuk QA berbasis repo dan parity gate.
- `aimock` memulai server provider berbasis AIMock untuk cakupan protokol, fixture, record/replay, dan chaos eksperimental. Ini bersifat aditif dan tidak menggantikan dispatcher skenario `mock-openai`.

Implementasi provider-lane berada di bawah `extensions/qa-lab/src/providers/`. Setiap provider memiliki default, startup server lokal, konfigurasi model Gateway, kebutuhan staging auth-profile, dan flag kapabilitas live/mock miliknya sendiri. Kode shared suite dan Gateway harus merutekan melalui registry provider alih-alih bercabang berdasarkan nama provider.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown. `qa-channel` adalah adapter pertama pada seam tersebut, tetapi target desainnya lebih luas: channel nyata atau sintetis di masa depan harus dapat terhubung ke runner suite yang sama, bukan menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- Adapter transport memiliki konfigurasi Gateway, kesiapan, observasi inbound dan outbound, tindakan transport, dan status transport yang dinormalisasi.
- File skenario Markdown di bawah `qa/scenarios/` mendefinisikan test run; `qa-lab` menyediakan permukaan runtime pakai ulang yang mengeksekusinya.

### Menambahkan channel

Menambahkan channel ke sistem QA markdown memerlukan tepat dua hal:

1. Adapter transport untuk channel tersebut.
2. Paket skenario yang menguji kontrak channel.

Jangan tambahkan root perintah QA tingkat atas baru ketika host bersama `qa-lab` dapat memiliki alurnya.

`qa-lab` memiliki mekanisme host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- konkurensi worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` lama

Plugin runner memiliki kontrak transport:

- bagaimana `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- bagaimana Gateway dikonfigurasi untuk transport tersebut
- bagaimana kesiapan diperiksa
- bagaimana event inbound disuntikkan
- bagaimana pesan outbound diamati
- bagaimana transkrip dan status transport yang dinormalisasi diekspos
- bagaimana tindakan berbasis transport dieksekusi
- bagaimana reset atau pembersihan khusus transport ditangani

Batas minimum adopsi untuk channel baru:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Pertahankan mekanisme khusus transport di dalam Plugin runner atau harness channel.
4. Pasang runner sebagai `openclaw qa <runner>`, bukan mendaftarkan root perintah pesaing. Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang sesuai dari `runtime-api.ts`. Jaga `runtime-api.ts` tetap ringan; CLI lazy dan eksekusi runner harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasi skenario markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport channel, pertahankan di Plugin runner atau harness Plugin tersebut.
- Jika sebuah skenario membutuhkan kapabilitas baru yang dapat digunakan oleh lebih dari satu channel, tambahkan helper generik alih-alih cabang khusus channel di `suite.ts`.
- Jika suatu perilaku hanya bermakna untuk satu transport, pertahankan skenario tersebut khusus transport dan buat itu eksplisit dalam kontrak skenario.

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

Alias kompatibilitas tetap tersedia untuk skenario yang ada - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - tetapi penulisan skenario baru harus menggunakan nama generik. Alias tersebut ada untuk menghindari migrasi flag-day, bukan sebagai model ke depan.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia - berguna saat mengukur pekerjaan tindak lanjut atau memasang transport baru - jalankan `pnpm openclaw qa coverage` (tambahkan `--json` untuk output yang dapat dibaca mesin).

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

Perintah tersebut menjalankan proses anak Gateway QA lokal, bukan Docker. Skenario evaluasi karakter
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat tidak boleh
diberi tahu bahwa ia sedang dievaluasi. Perintah tersebut mempertahankan setiap transkrip
lengkap, mencatat statistik run dasar, lalu meminta model juri dalam mode fast dengan
reasoning `xhigh` jika didukung untuk memberi peringkat run berdasarkan kewajaran, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt juri tetap mendapatkan
setiap transkrip dan status run, tetapi ref kandidat diganti dengan label netral
seperti `candidate-01`; laporan memetakan peringkat kembali ke ref nyata setelah
parsing.
Run kandidat default ke thinking `high`, dengan `medium` untuk GPT-5.5 dan `xhigh`
untuk ref eval OpenAI lama yang mendukungnya. Timpa kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap
dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI default ke mode fast agar pemrosesan prioritas digunakan jika
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat
satu kandidat atau juri membutuhkan override. Berikan `--fast` hanya saat Anda ingin
memaksa mode fast aktif untuk setiap model kandidat. Durasi kandidat dan juri
dicatat dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit mengatakan
untuk tidak memberi peringkat berdasarkan kecepatan.
Run model kandidat dan juri sama-sama default ke konkurensi 16. Turunkan
`--concurrency` atau `--judge-concurrency` ketika batas provider atau tekanan Gateway
lokal membuat run terlalu berisik.
Ketika tidak ada kandidat `--model` yang diberikan, evaluasi karakter default ke
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` ketika tidak ada `--model` yang diberikan.
Ketika tidak ada `--judge-model` yang diberikan, juri default ke
`openai/gpt-5.5,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [QA Matriks](/id/concepts/qa-matrix)
- [QA Channel](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dashboard](/id/web/dashboard)
