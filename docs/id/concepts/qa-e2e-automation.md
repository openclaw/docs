---
read_when:
    - Memahami bagaimana tumpukan QA saling terhubung
    - Memperluas qa-lab, qa-channel, atau adaptor transport
    - Menambahkan skenario QA berbasis repo
    - Membangun otomatisasi QA dengan realisme lebih tinggi seputar dasbor Gateway
summary: 'Ikhtisar stack QA: qa-lab, qa-channel, skenario berbasis repo, jalur transport langsung, adapter transport, dan pelaporan.'
title: Ikhtisar QA
x-i18n:
    generated_at: "2026-05-10T19:33:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Stack QA privat dimaksudkan untuk melatih OpenClaw dengan cara yang lebih realistis,
berbentuk channel, daripada yang dapat dilakukan oleh satu unit test.

Bagian saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread,
  reaction, edit, dan delete.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `extensions/qa-matrix`, Plugin runner mendatang: adapter live-transport yang
  menjalankan channel nyata di dalam child QA gateway.
- `qa/`: aset seed berbasis repo untuk tugas kickoff dan skenario QA baseline.
- [Mantis](/id/concepts/mantis): verifikasi live sebelum dan sesudah untuk bug yang
  membutuhkan transport nyata, screenshot browser, status VM, dan bukti PR.

## Permukaan perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip `pnpm qa:*`;
kedua bentuk didukung.

| Perintah                                            | Tujuan                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Self-check QA bawaan; menulis laporan Markdown.                                                                                                                                                                                                                        |
| `qa suite`                                          | Menjalankan skenario berbasis repo terhadap lane QA gateway. Alias: `pnpm openclaw qa suite --runner multipass` untuk VM Linux sekali pakai.                                                                                                                           |
| `qa coverage`                                       | Mencetak inventaris cakupan skenario markdown (`--json` untuk output mesin).                                                                                                                                                                                           |
| `qa parity-report`                                  | Membandingkan dua file `qa-suite-summary.json` dan menulis laporan paritas agentic.                                                                                                                                                                                     |
| `qa character-eval`                                 | Menjalankan skenario QA karakter di beberapa model live dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                                                                                                                                    |
| `qa manual`                                         | Menjalankan prompt satu kali terhadap lane provider/model yang dipilih.                                                                                                                                                                                                 |
| `qa ui`                                             | Memulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                      |
| `qa docker-build-image`                             | Membangun image Docker QA yang sudah dipanggang.                                                                                                                                                                                                                       |
| `qa docker-scaffold`                                | Menulis scaffold docker-compose untuk dashboard QA + lane gateway.                                                                                                                                                                                                      |
| `qa up`                                             | Membangun situs QA, memulai stack berbasis Docker, mencetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                           |
| `qa aimock`                                         | Memulai hanya server provider AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Memulai hanya server provider `mock-openai` yang sadar skenario.                                                                                                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Mengelola pool kredensial Convex bersama.                                                                                                                                                                                                                              |
| `qa matrix`                                         | Lane transport live terhadap homeserver Tuwunel sekali pakai. Lihat [QA Matrix](/id/concepts/qa-matrix).                                                                                                                                                                  |
| `qa telegram`                                       | Lane transport live terhadap grup Telegram privat nyata.                                                                                                                                                                                                               |
| `qa discord`                                        | Lane transport live terhadap channel guild Discord privat nyata.                                                                                                                                                                                                       |
| `qa slack`                                          | Lane transport live terhadap channel Slack privat nyata.                                                                                                                                                                                                               |
| `qa mantis`                                         | Runner verifikasi sebelum dan sesudah untuk bug transport live, dengan bukti status-reactions Discord, smoke desktop/browser Crabbox, dan smoke Slack-in-VNC. Lihat [Mantis](/id/concepts/mantis) dan [Panduan Operasional Desktop Slack Mantis](/id/concepts/mantis-slack-desktop-runbook). |

## Alur operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dashboard Gateway (UI Kontrol) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane gateway berbasis Docker, dan mengekspos
halaman QA Lab tempat operator atau loop otomatisasi dapat memberi agen misi QA,
mengamati perilaku channel nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundel QA Lab yang di-bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mempertahankan layanan Docker pada image prebuilt dan melakukan bind-mount
`extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch`
membangun ulang bundel itu saat ada perubahan, dan browser otomatis memuat ulang saat hash aset QA Lab
berubah.

Untuk smoke trace OpenTelemetry lokal, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip itu memulai receiver trace OTLP/HTTP lokal, menjalankan
skenario QA `otel-trace-smoke` dengan Plugin `diagnostics-otel` diaktifkan, lalu
mendekode span protobuf yang diekspor dan memastikan bentuk release-critical:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, dan `openclaw.message.delivery` harus ada;
panggilan model tidak boleh mengekspor `StreamAbandoned` pada giliran yang berhasil; ID diagnostik mentah dan
atribut `openclaw.content.*` harus tetap tidak masuk trace. Ini menulis
`otel-smoke-summary.json` di samping artefak QA suite.

QA observabilitas tetap hanya source-checkout. Tarball npm sengaja menghilangkan
QA Lab, sehingga lane rilis Docker paket tidak menjalankan perintah `qa`. Gunakan
`pnpm qa:otel:smoke` dari source checkout yang sudah dibangun saat mengubah instrumentasi
diagnostik.

Untuk lane smoke Matrix dengan transport nyata, jalankan:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Referensi CLI lengkap, katalog profil/skenario, env var, dan tata letak artefak untuk lane ini ada di [QA Matrix](/id/concepts/qa-matrix). Ringkasnya: ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver/SUT/observer sementara, menjalankan Plugin Matrix nyata di dalam child QA gateway yang dibatasi ke transport itu (tanpa `qa-channel`), lalu menulis laporan Markdown, ringkasan JSON, artefak observed-events, dan log output gabungan di bawah `.artifacts/qa-e2e/matrix-<timestamp>/`.

Skenario mencakup perilaku transport yang tidak dapat dibuktikan end to end oleh unit test: mention gating, kebijakan allow-bot, allowlist, balasan top-level dan threaded, routing DM, penanganan reaction, supresi edit masuk, dedupe replay restart, pemulihan interupsi homeserver, pengiriman metadata approval, penanganan media, dan alur bootstrap/recovery/verification E2EE Matrix. Profil CLI E2EE juga menjalankan `openclaw matrix encryption setup` dan perintah verifikasi melalui homeserver sekali pakai yang sama sebelum memeriksa balasan gateway.

Discord juga memiliki skenario opt-in khusus Mantis untuk reproduksi bug. Gunakan
`--scenario discord-status-reactions-tool-only` untuk timeline status reaction eksplisit,
atau `--scenario discord-thread-reply-filepath-attachment` untuk membuat thread
Discord nyata dan memverifikasi bahwa `message.thread-reply` mempertahankan lampiran
`filePath`. Skenario ini tetap berada di luar lane Discord live default
karena merupakan probe repro sebelum/sesudah, bukan cakupan smoke luas.
Workflow Mantis thread-attachment juga dapat menambahkan video saksi Web
Discord yang sudah login saat `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` atau
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` dikonfigurasi di lingkungan QA.
Profil viewer itu hanya untuk tangkapan visual; keputusan pass/fail
tetap berasal dari oracle REST Discord.

CI menggunakan permukaan perintah yang sama di `.github/workflows/qa-live-transports-convex.yml`. Run terjadwal dan manual default menjalankan profil Matrix cepat dengan kredensial frontier live, `--fast`, dan `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Manual `matrix_profile=all` menyebar ke lima shard profil sehingga katalog lengkap dapat berjalan paralel sambil mempertahankan satu direktori artefak per shard.

Untuk lane smoke Telegram, Discord, dan Slack dengan transport nyata:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Lane tersebut menargetkan channel nyata yang sudah ada dengan dua bot (driver + SUT). Env var yang diperlukan, daftar skenario, artefak output, dan pool kredensial Convex didokumentasikan di [Referensi QA Telegram, Discord, dan Slack](#telegram-discord-and-slack-qa-reference) di bawah.

Untuk menjalankan VM desktop Slack penuh dengan penyelamatan VNC, jalankan:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Perintah itu menyewa mesin desktop/browser Crabbox, menjalankan lane live Slack
di dalam VM, membuka Slack Web di browser VNC, menangkap desktop, dan
menyalin `slack-qa/`, `slack-desktop-smoke.png`, serta `slack-desktop-smoke.mp4`
jika perekaman video tersedia kembali ke direktori artefak Mantis. Lease
desktop/browser Crabbox menyediakan alat penangkapan dan paket helper
browser/native-build sejak awal, sehingga skenario seharusnya hanya memasang
fallback pada lease yang lebih lama. Mantis melaporkan waktu total dan per fase di
`mantis-slack-desktop-smoke-report.md` sehingga run yang lambat menunjukkan apakah waktu masuk ke
pemanasan lease, akuisisi kredensial, penyiapan remote, atau penyalinan artefak. Gunakan ulang
`--lease-id <cbx_...>` setelah masuk ke Slack Web secara manual melalui VNC;
lease yang digunakan ulang juga menjaga cache store pnpm Crabbox tetap hangat. Default
`--hydrate-mode source` memverifikasi dari checkout source dan menjalankan install/build
di dalam VM. Gunakan `--hydrate-mode prehydrated` hanya ketika workspace remote yang digunakan ulang
sudah memiliki `node_modules` dan `dist/` yang sudah dibangun; mode itu melewati
langkah install/build yang mahal dan gagal tertutup ketika workspace belum siap.
Dengan `--gateway-setup`, Mantis membiarkan Gateway Slack OpenClaw persisten
berjalan di dalam VM pada port `38973`; tanpanya, perintah menjalankan
lane QA Slack bot-ke-bot normal dan keluar setelah penangkapan artefak.

Checklist operator, perintah dispatch workflow GitHub, kontrak komentar bukti,
tabel keputusan hydrate-mode, interpretasi waktu, dan langkah penanganan kegagalan
berada di [Runbook Desktop Slack Mantis](/id/concepts/mantis-slack-desktop-runbook).

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
`mantis-visual-task-driver-result.json`, serta `mantis-visual-task-report.md`.
Ketika `--expect-text` ditetapkan, prompt vision meminta verdict JSON terstruktur
dan hanya lolos ketika model melaporkan bukti terlihat yang positif; respons
negatif yang sekadar mengutip teks target menggagalkan assertion.
Gunakan `--vision-mode metadata` untuk smoke tanpa model yang membuktikan plumbing desktop,
browser, screenshot, dan video tanpa memanggil provider pemahaman gambar.
Perekaman adalah artefak wajib untuk `visual-task`; jika Crabbox tidak merekam
`visual-task.mp4` yang tidak kosong, tugas gagal meskipun visual driver
lolos. Saat gagal, Mantis mempertahankan lease untuk VNC kecuali tugas sudah
lolos dan `--keep-lease` tidak ditetapkan.

Sebelum menggunakan kredensial live pooled, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi keterjangkauan admin/list ketika secret maintainer tersedia. Ia hanya melaporkan status ditetapkan/hilang untuk secret.

## Cakupan transport live

Lane transport live berbagi satu kontrak alih-alih masing-masing menciptakan bentuk daftar skenario sendiri. `qa-channel` adalah suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

| Lane     | Kanari | Gating mention | Bot-ke-bot | Blok allowlist | Balasan tingkat atas | Lanjutkan setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaksi | Perintah bantuan | Pendaftaran perintah native |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

Ini menjaga `qa-channel` sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transport live masa depan berbagi satu checklist kontrak transport
eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, memasang dependency, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA normal dan
ringkasan kembali ke `.artifacts/qa-e2e/...` di host.
Ini menggunakan ulang perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Run suite host dan Multipass menjalankan beberapa skenario terpilih secara paralel
dengan worker Gateway terisolasi secara default. `qa-channel` default ke concurrency
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar non-zero ketika skenario apa pun gagal. Gunakan `--allow-failures` ketika
Anda menginginkan artefak tanpa kode keluar yang gagal.
Run live meneruskan input auth QA yang didukung dan praktis untuk
guest: key provider berbasis env, path config provider live QA, dan
`CODEX_HOME` ketika ada. Pertahankan `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang di-mount.

## Referensi QA Telegram, Discord, dan Slack

Matrix memiliki [halaman khusus](/id/concepts/qa-matrix) karena jumlah skenarionya dan penyediaan homeserver yang didukung Docker. Telegram, Discord, dan Slack lebih kecil - masing-masing hanya beberapa skenario, tanpa sistem profil, terhadap channel nyata yang sudah ada - sehingga referensinya berada di sini.

### Flag CLI bersama

Lane ini didaftarkan melalui `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan menerima flag yang sama:

| Flag                                  | Default                                                         | Deskripsi                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Jalankan hanya skenario ini. Dapat diulang.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Tempat laporan/ringkasan/pesan yang diamati dan log output ditulis. Path relatif di-resolve terhadap `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Root repository saat menjalankan dari cwd netral.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | Id akun sementara di dalam config Gateway QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` atau `live-frontier` (`live-openai` lama masih berfungsi).                                                  |
| `--model <ref>` / `--alt-model <ref>` | default provider                                                | Ref model primer/alternatif.                                                                                         |
| `--fast`                              | nonaktif                                                             | Mode cepat provider jika didukung.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | Lihat [pool kredensial Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` di CI, selain itu `maintainer`                              | Role yang digunakan ketika `--credential-source convex`.                                                                          |

Setiap lane keluar non-zero pada skenario gagal apa pun. `--allow-failures` menulis artefak tanpa menetapkan kode keluar yang gagal.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Menargetkan satu grup privat Telegram nyata dengan dua bot berbeda (driver + SUT). Bot SUT harus memiliki username Telegram; observasi bot-ke-bot paling baik ketika kedua bot mengaktifkan **Mode Komunikasi Bot-ke-Bot** di `@BotFather`.

Env wajib ketika `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id chat numerik (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opsional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan-teramati (default menyunting).

Skenario (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Set default implisit selalu mencakup kanari, gating mention, balasan perintah native, pengalamatan perintah, dan balasan grup bot-ke-bot. Default `mock-openai` juga menyertakan pemeriksaan reply-chain deterministik dan streaming final-message. `telegram-current-session-status-tool` tetap opt-in karena hanya stabil ketika di-thread langsung setelah kanari, bukan setelah balasan perintah native arbitrer. Gunakan `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` untuk mencetak pemisahan default/opsional saat ini dengan ref regresi.

Artefak output:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - menyertakan RTT per balasan (driver send → observed SUT reply) mulai dari kanari.
- `telegram-qa-observed-messages.json` - isi disunting kecuali `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Menargetkan satu channel guild privat Discord nyata dengan dua bot: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh child Gateway OpenClaw melalui Plugin Discord bundled. Memverifikasi penanganan mention channel, bahwa bot SUT telah mendaftarkan perintah native `/help` dengan Discord, dan skenario bukti Mantis opt-in.

Env wajib ketika `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - harus cocok dengan id pengguna bot SUT yang dikembalikan oleh Discord (jika tidak, jalur akan gagal cepat).

Opsional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan yang diamati.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` memilih kanal suara/stage untuk `discord-voice-autojoin`; tanpanya, skenario memilih kanal suara/stage pertama yang terlihat untuk bot SUT.

Skenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - skenario suara opt-in. Berjalan sendiri, mengaktifkan `channels.discord.voice.autoJoin`, dan memverifikasi status suara Discord bot SUT saat ini adalah kanal suara/stage target. Kredensial Convex Discord dapat menyertakan `voiceChannelId` opsional; jika tidak, runner menemukan kanal suara/stage pertama yang terlihat di guild.
- `discord-status-reactions-tool-only` - skenario Mantis opt-in. Berjalan sendiri karena mengalihkan SUT ke balasan guild yang selalu aktif dan hanya memakai alat dengan `messages.statusReactions.enabled=true`, lalu menangkap linimasa reaksi REST serta artefak visual HTML/PNG. Laporan sebelum/sesudah Mantis juga mempertahankan artefak MP4 yang disediakan skenario sebagai `baseline.mp4` dan `candidate.mp4`.

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
- `discord-qa-observed-messages.json` - isi disensor kecuali `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` dan `discord-status-reactions-tool-only-timeline.png` saat skenario reaksi status berjalan.

### QA Slack

```bash
pnpm openclaw qa slack
```

Menargetkan satu kanal privat Slack nyata dengan dua bot berbeda: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Slack bawaan.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opsional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan yang diamati.

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
- `slack-qa-observed-messages.json` - isi disensor kecuali `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Menyiapkan workspace Slack

Jalur ini membutuhkan dua aplikasi Slack berbeda dalam satu workspace, ditambah satu kanal tempat kedua bot menjadi anggota:

- `channelId` - id `Cxxxxxxxxxx` dari kanal tempat kedua bot telah diundang. Gunakan kanal khusus; jalur ini memposting pada setiap run.
- `driverBotToken` - token bot (`xoxb-...`) dari aplikasi **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) dari aplikasi **SUT**, yang harus berupa aplikasi Slack terpisah dari driver agar id pengguna botnya berbeda.
- `sutAppToken` - token level aplikasi (`xapp-...`) dari aplikasi SUT dengan `connections:write`, digunakan oleh Socket Mode agar aplikasi SUT dapat menerima event.

Lebih disarankan menggunakan workspace Slack khusus untuk QA daripada memakai ulang workspace produksi.

Manifest SUT di bawah ini sengaja mempersempit instalasi produksi Plugin Slack bawaan (`extensions/slack/src/setup-shared.ts:10`) ke izin dan event yang dicakup oleh suite QA Slack live. Untuk penyiapan kanal produksi seperti yang dilihat pengguna, lihat [penyiapan cepat kanal Slack](/id/channels/slack#quick-setup); pasangan Driver/SUT QA sengaja dipisahkan karena jalur ini membutuhkan dua id pengguna bot yang berbeda dalam satu workspace.

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

Ulangi _Create New App → From a manifest_ di workspace yang sama. Aplikasi QA ini sengaja menggunakan versi yang lebih sempit dari manifest produksi Plugin Slack bawaan (`extensions/slack/src/setup-shared.ts:10`): scope dan event reaksi dihilangkan karena suite QA Slack live belum mencakup penanganan reaksi.

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

Verifikasi bahwa kedua bot memiliki id pengguna berbeda dengan memanggil `auth.test` pada setiap token. Runtime membedakan driver dan SUT berdasarkan id pengguna; memakai ulang satu aplikasi untuk keduanya akan langsung menggagalkan gating mention.

**3. Buat kanal**

Di workspace QA, buat kanal (misalnya `#openclaw-qa`) dan undang kedua bot dari dalam kanal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Salin id `Cxxxxxxxxxx` dari _channel info → About → Channel ID_ - itu menjadi `channelId`. Kanal publik dapat digunakan; jika Anda memakai kanal privat, kedua aplikasi sudah memiliki `groups:history` sehingga pembacaan riwayat oleh harness tetap akan berhasil.

**4. Daftarkan kredensial**

Ada dua opsi. Gunakan env var untuk debug pada satu mesin (atur empat variabel `OPENCLAW_QA_SLACK_*` dan sertakan `--credential-source env`), atau seed pool Convex bersama agar CI dan maintainer lain dapat menyewanya.

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

Jalankan jalur ini secara lokal untuk mengonfirmasi kedua bot dapat saling berbicara melalui broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Run hijau selesai jauh di bawah 30 detik dan `slack-qa-report.md` menampilkan `slack-canary` maupun `slack-mention-gating` dengan status `pass`. Jika jalur ini menggantung selama ~90 detik dan keluar dengan `Convex credential pool exhausted for kind "slack"`, berarti pool kosong atau setiap baris sedang disewa - `qa credentials list --kind slack --status all --json` akan memberi tahu yang mana.

### Pool kredensial Convex

Jalur Telegram, Discord, Slack, dan WhatsApp dapat menyewa kredensial dari pool Convex bersama alih-alih membaca env var di atas. Sertakan `--credential-source convex` (atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab memperoleh lease eksklusif, mengirim Heartbeat selama durasi run, dan merilisnya saat shutdown. Jenis pool adalah `"telegram"`, `"discord"`, `"slack"`, dan `"whatsapp"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` harus berupa string id chat numerik.
- Pengguna nyata Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - satu lease akun burner eksklusif yang digunakan oleh driver CLI TDLib dan saksi visual Telegram Desktop.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - nomor telepon harus berupa string E.164 yang berbeda.

Untuk bukti Telegram pengguna nyata visual, utamakan sesi Crabbox yang ditahan:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` menahan satu lease Convex `telegram-user` eksklusif untuk driver CLI TDLib
dan saksi Telegram Desktop, memulai perekaman desktop, dan membiarkan
Crabbox tetap hidup untuk langkah repro arbitrer yang digerakkan agen. Agen dapat memakai `send`,
`run`, `screenshot`, dan `status` sampai puas, lalu `finish`
mengumpulkan tangkapan layar, video, video/GIF yang dipangkas berdasarkan gerak, output probe TDLib,
dan log sebelum merilis kredensial. `publish --session <file> --pr
<number>` hanya mengomentari GIF gerak secara default; `--full-artifacts` adalah
opt-in eksplisit untuk log dan output JSON. Perintah default `probe` tetap menjadi
singkatan satu perintah untuk pemeriksaan smoke `/status` cepat.

Gunakan `--mock-response-file <path>` saat sebuah PR membutuhkan diff visual deterministik:
balasan model mock yang sama dapat dijalankan pada `main` dan pada head PR saat
pemformat Telegram atau lapisan pengiriman berubah. Default penangkapan disetel untuk komentar PR:
kelas Crabbox standar, rekaman desktop 24fps, GIF gerakan 24fps, dan
lebar pratinjau 1920px. Komentar sebelum/sesudah harus menerbitkan bundel bersih yang
hanya berisi GIF yang dimaksudkan.

Lane Slack juga dapat menggunakan pool. Pemeriksaan bentuk payload Slack saat ini berada di runner QA Slack, bukan broker; gunakan `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, dengan id kanal Slack seperti `Cxxxxxxxxxx`. Lihat [Menyiapkan workspace Slack](#setting-up-the-slack-workspace) untuk penyediaan aplikasi dan scope.

Env var operasional dan kontrak endpoint broker Convex berada di [Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1) (nama bagian ini mendahului pool multi-kanal; semantik lease dibagikan di semua jenis).

## Seed Berbasis Repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Ini sengaja berada di git agar rencana QA terlihat oleh manusia maupun
agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah
sumber kebenaran untuk satu run pengujian dan harus mendefinisikan:

- metadata skenario
- metadata kategori, capability, lane, dan risiko opsional
- referensi docs dan kode
- persyaratan plugin opsional
- patch konfigurasi gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang yang mendukung `qa-flow` diizinkan tetap generik
dan lintas-bidang. Misalnya, skenario markdown dapat menggabungkan helper sisi transport
dengan helper sisi browser yang menggerakkan Control UI tertanam melalui seam
Gateway `browser.request` tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan capability produk, bukan folder source tree.
Jaga ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan kanal
- perilaku thread
- siklus hidup aksi pesan
- callback cron
- pemanggilan kembali memori
- pergantian model
- handoff subagen
- pembacaan repo dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane Mock Provider

`qa suite` memiliki dua lane mock provider lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi lane mock
  deterministik default untuk QA berbasis repo dan gate paritas.
- `aimock` memulai server provider berbasis AIMock untuk cakupan protokol,
  fixture, record/replay, dan chaos eksperimental. Ini bersifat aditif dan tidak
  menggantikan dispatcher skenario `mock-openai`.

Implementasi provider-lane berada di bawah `extensions/qa-lab/src/providers/`.
Setiap provider memiliki defaultnya sendiri, startup server lokal, konfigurasi model gateway,
kebutuhan staging auth-profile, dan flag capability live/mock. Kode suite dan
gateway bersama harus merutekan melalui registry provider, bukan bercabang berdasarkan
nama provider.

## Adapter Transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown. `qa-channel` adalah adapter pertama pada seam itu, tetapi target desainnya lebih luas: kanal nyata atau sintetis di masa depan harus terhubung ke runner suite yang sama, bukan menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pemisahannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, concurrency worker, penulisan artefak, dan pelaporan.
- Adapter transport memiliki konfigurasi gateway, kesiapan, observasi inbound dan outbound, aksi transport, dan state transport yang dinormalisasi.
- File skenario markdown di bawah `qa/scenarios/` mendefinisikan run pengujian; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang untuk mengeksekusinya.

### Menambahkan Kanal

Menambahkan kanal ke sistem QA markdown membutuhkan tepat dua hal:

1. Adapter transport untuk kanal tersebut.
2. Paket skenario yang menguji kontrak kanal.

Jangan tambahkan root perintah QA tingkat atas baru saat host `qa-lab` bersama dapat memiliki alur tersebut.

`qa-lab` memiliki mekanik host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- concurrency worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` lama

Plugin runner memiliki kontrak transport:

- bagaimana `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- bagaimana gateway dikonfigurasi untuk transport tersebut
- bagaimana kesiapan diperiksa
- bagaimana event inbound diinjeksi
- bagaimana pesan outbound diamati
- bagaimana transkrip dan state transport yang dinormalisasi diekspos
- bagaimana aksi berbasis transport dieksekusi
- bagaimana reset atau pembersihan khusus transport ditangani

Batas minimum adopsi untuk kanal baru:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Pertahankan mekanik khusus transport di dalam plugin runner atau harness kanal.
4. Pasang runner sebagai `openclaw qa <runner>`, bukan mendaftarkan perintah root pesaing. Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`. Jaga `runtime-api.ts` tetap ringan; CLI lazy dan eksekusi runner harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasi skenario markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Jaga alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport kanal, pertahankan di plugin runner atau harness plugin tersebut.
- Jika sebuah skenario membutuhkan capability baru yang dapat digunakan lebih dari satu kanal, tambahkan helper generik, bukan cabang khusus kanal di `suite.ts`.
- Jika suatu perilaku hanya bermakna untuk satu transport, pertahankan skenario tersebut khusus transport dan buat itu eksplisit dalam kontrak skenario.

### Nama Helper Skenario

Helper generik yang disukai untuk skenario baru:

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

Alias kompatibilitas tetap tersedia untuk skenario yang ada - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - tetapi penulisan skenario baru harus menggunakan nama generik. Alias ada untuk menghindari migrasi flag-day, bukan sebagai model ke depan.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia - berguna saat memperkirakan pekerjaan tindak lanjut atau memasang transport baru - jalankan `pnpm openclaw qa coverage` (tambahkan `--json` untuk output yang dapat dibaca mesin).

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

Perintah ini menjalankan proses anak gateway QA lokal, bukan Docker. Skenario character eval
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat tidak boleh
diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap
transkrip penuh, mencatat statistik run dasar, lalu meminta model judge dalam mode cepat dengan
reasoning `xhigh` jika didukung untuk memberi peringkat run berdasarkan naturalness, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt judge tetap mendapatkan
setiap transkrip dan status run, tetapi ref kandidat diganti dengan label netral
seperti `candidate-01`; laporan memetakan peringkat kembali ke ref nyata setelah
parsing.
Run kandidat default ke thinking `high`, dengan `medium` untuk GPT-5.5 dan `xhigh`
untuk ref eval OpenAI lama yang mendukungnya. Override kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap
dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI default ke mode cepat sehingga pemrosesan prioritas digunakan jika
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat
satu kandidat atau judge membutuhkan override. Teruskan `--fast` hanya saat Anda ingin
memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan judge
dicatat dalam laporan untuk analisis benchmark, tetapi prompt judge secara eksplisit mengatakan
untuk tidak memberi peringkat berdasarkan kecepatan.
Run model kandidat dan judge keduanya default ke concurrency 16. Turunkan
`--concurrency` atau `--judge-concurrency` saat batas provider atau tekanan gateway
lokal membuat run terlalu bising.
Saat tidak ada kandidat `--model` yang diteruskan, character eval default ke
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diteruskan.
Saat tidak ada `--judge-model` yang diteruskan, judge default ke
`openai/gpt-5.5,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Docs Terkait

- [QA Matriks](/id/concepts/qa-matrix)
- [Kanal QA](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dashboard](/id/web/dashboard)
