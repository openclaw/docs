---
read_when:
    - Memahami bagaimana stack QA saling terintegrasi
    - Memperluas qa-lab, qa-channel, atau adapter transport
    - Menambahkan skenario QA berbasis repo
    - Membangun otomatisasi QA dengan realisme lebih tinggi seputar dashboard Gateway
summary: 'Ikhtisar tumpukan QA: qa-lab, qa-channel, skenario berbasis repo, jalur transportasi langsung, adapter transportasi, dan pelaporan.'
title: Ikhtisar QA
x-i18n:
    generated_at: "2026-05-05T06:16:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Tumpukan QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis,
berbentuk channel, daripada yang bisa dilakukan oleh satu unit test.

Bagian saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread,
  reaction, edit, dan delete.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `extensions/qa-matrix`, Plugin runner mendatang: adaptor live-transport yang
  mengendalikan channel nyata di dalam Gateway QA turunan.
- `qa/`: aset seed berbasis repo untuk tugas kickoff dan skenario QA
  baseline.
- [Mantis](/id/concepts/mantis): verifikasi live sebelum dan sesudah untuk bug yang
  memerlukan transport nyata, tangkapan layar browser, status VM, dan bukti PR.

## Permukaan perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip `pnpm qa:*`;
kedua bentuk didukung.

| Perintah                                            | Tujuan                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Self-check QA bawaan; menulis laporan Markdown.                                                                                                                                             |
| `qa suite`                                          | Menjalankan skenario berbasis repo terhadap lane Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` untuk VM Linux sekali pakai.                                                       |
| `qa coverage`                                       | Mencetak inventaris cakupan skenario markdown (`--json` untuk keluaran mesin).                                                                                                                |
| `qa parity-report`                                  | Membandingkan dua file `qa-suite-summary.json` dan menulis laporan paritas agentic.                                                                                                               |
| `qa character-eval`                                 | Menjalankan skenario QA karakter di beberapa model live dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                                                                 |
| `qa manual`                                         | Menjalankan prompt sekali pakai terhadap lane penyedia/model yang dipilih.                                                                                                                               |
| `qa ui`                                             | Memulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | Membangun image Docker QA prabuat.                                                                                                                                                          |
| `qa docker-scaffold`                                | Menulis scaffold docker-compose untuk dashboard QA + lane Gateway.                                                                                                                         |
| `qa up`                                             | Membangun situs QA, memulai tumpukan berbasis Docker, mencetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | Memulai hanya server penyedia AIMock.                                                                                                                                                       |
| `qa mock-openai`                                    | Memulai hanya server penyedia `mock-openai` yang sadar skenario.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Mengelola pool kredensial Convex bersama.                                                                                                                                                    |
| `qa matrix`                                         | Lane transport live terhadap homeserver Tuwunel sekali pakai. Lihat [QA Matrix](/id/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | Lane transport live terhadap grup privat Telegram nyata.                                                                                                                                   |
| `qa discord`                                        | Lane transport live terhadap channel guild privat Discord nyata.                                                                                                                            |
| `qa slack`                                          | Lane transport live terhadap channel privat Slack nyata.                                                                                                                                    |
| `qa mantis`                                         | Runner verifikasi sebelum dan sesudah untuk bug transport live, dengan bukti reaction status Discord, smoke desktop/browser Crabbox, dan smoke Slack-di-VNC. Lihat [Mantis](/id/concepts/mantis). |

## Alur operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dashboard Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane Gateway berbasis Docker, dan mengekspos
halaman QA Lab tempat operator atau loop otomatisasi dapat memberi agen misi QA,
mengamati perilaku channel nyata, dan merekam apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab lokal yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai tumpukan dengan bundle QA Lab yang di-bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mempertahankan layanan Docker pada image prabuat dan melakukan bind-mount
`extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch`
membangun ulang bundle tersebut saat berubah, dan browser otomatis memuat ulang ketika hash aset QA Lab
berubah.

Untuk smoke trace OpenTelemetry lokal, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip itu memulai penerima trace OTLP/HTTP lokal, menjalankan skenario QA
`otel-trace-smoke` dengan Plugin `diagnostics-otel` diaktifkan, lalu
mendekode span protobuf yang diekspor dan menegaskan bentuk yang kritis untuk rilis:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, dan `openclaw.message.delivery` harus ada;
panggilan model tidak boleh mengekspor `StreamAbandoned` pada giliran yang berhasil; ID diagnostik mentah dan
atribut `openclaw.content.*` harus tetap berada di luar trace. Skrip menulis
`otel-smoke-summary.json` di samping artefak suite QA.

QA observabilitas tetap hanya untuk checkout sumber. Tarball npm sengaja menghilangkan
QA Lab, sehingga lane rilis Docker paket tidak menjalankan perintah `qa`. Gunakan
`pnpm qa:otel:smoke` dari checkout sumber yang sudah dibangun saat mengubah instrumentasi
diagnostik.

Untuk lane smoke Matrix yang benar-benar memakai transport nyata, jalankan:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Referensi CLI lengkap, katalog profil/skenario, env var, dan tata letak artefak untuk lane ini ada di [QA Matrix](/id/concepts/qa-matrix). Sekilas: lane ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver/SUT/observer sementara, menjalankan Plugin Matrix nyata di dalam Gateway QA turunan yang dicakup ke transport tersebut (tanpa `qa-channel`), lalu menulis laporan Markdown, ringkasan JSON, artefak peristiwa yang diamati, dan log keluaran gabungan di bawah `.artifacts/qa-e2e/matrix-<timestamp>/`.

Untuk lane smoke Telegram, Discord, dan Slack yang benar-benar memakai transport nyata:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Lane tersebut menargetkan channel nyata yang sudah ada dengan dua bot (driver + SUT). Env var yang diperlukan, daftar skenario, artefak keluaran, dan pool kredensial Convex didokumentasikan dalam [Referensi QA Telegram, Discord, dan Slack](#telegram-discord-and-slack-qa-reference) di bawah.

Untuk run VM desktop Slack penuh dengan penyelamatan VNC, jalankan:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Perintah itu menyewa mesin desktop/browser Crabbox, menjalankan lane live Slack
di dalam VM, membuka Slack Web di browser VNC, menangkap desktop, dan
menyalin `slack-qa/`, `slack-desktop-smoke.png`, dan `slack-desktop-smoke.mp4`
ketika perekaman video tersedia kembali ke direktori artefak Mantis. Gunakan kembali `--lease-id <cbx_...>` setelah masuk ke Slack Web secara manual
melalui VNC. Dengan `--gateway-setup`, Mantis meninggalkan Gateway Slack OpenClaw
persisten yang berjalan di dalam VM pada port `38973`; tanpa itu, perintah menjalankan
lane QA Slack bot-ke-bot normal dan keluar setelah penangkapan artefak.

Untuk tugas desktop bergaya agen/CV, jalankan:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` menyewa atau menggunakan kembali mesin desktop/browser Crabbox, memulai
`crabbox record --while`, mengendalikan browser yang terlihat melalui
`visual-driver` bersarang, menangkap `visual-task.png`, menjalankan `openclaw infer image describe`
terhadap tangkapan layar ketika `--vision-mode image-describe` dipilih, dan
menulis `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json`, dan `mantis-visual-task-report.md`.
Ketika `--expect-text` disetel, prompt vision meminta verdict JSON terstruktur
dan hanya lulus ketika model melaporkan bukti terlihat yang positif; respons
negatif yang hanya mengutip teks target menggagalkan asersi.
Gunakan `--vision-mode metadata` untuk smoke tanpa model yang membuktikan plumbing desktop,
browser, tangkapan layar, dan video tanpa memanggil penyedia pemahaman gambar.
Perekaman adalah artefak wajib untuk `visual-task`; jika Crabbox tidak merekam
`visual-task.mp4` yang tidak kosong, tugas gagal bahkan ketika visual driver
lulus. Saat gagal, Mantis mempertahankan lease untuk VNC kecuali tugas sudah
lulus dan `--keep-lease` tidak disetel.

Sebelum menggunakan kredensial live yang dipool, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi keterjangkauan admin/list ketika secret maintainer ada. Doctor hanya melaporkan status disetel/hilang untuk secret.

## Cakupan transport live

Lane transport live berbagi satu kontrak alih-alih masing-masing menciptakan bentuk daftar skenario sendiri. `qa-channel` adalah suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

| Jalur    | Canary | Gating penyebutan | Bot-ke-bot | Blokir daftar izin | Balasan tingkat atas | Lanjutkan setelah restart | Tindak lanjut thread | Isolasi thread | Pengamatan reaksi | Perintah bantuan | Pendaftaran perintah bawaan |
| -------- | ------ | ----------------- | ---------- | ------------------ | -------------------- | ------------------------- | -------------------- | --------------- | ----------------- | ---------------- | ---------------------------- |
| Matrix   | x      | x                 | x          | x                  | x                    | x                         | x                    | x               | x                 |                  |                              |
| Telegram | x      | x                 | x          |                    |                      |                           |                      |                 |                   | x                |                              |
| Discord  | x      | x                 | x          |                    |                      |                           |                      |                 |                   |                  | x                            |
| Slack    | x      | x                 | x          |                    |                      |                           |                      |                 |                   |                  |                              |

Ini menjaga `qa-channel` sebagai suite perilaku produk yang luas, sementara Matrix,
Telegram, dan transport live mendatang berbagi satu checklist kontrak transport
yang eksplisit.

Untuk jalur VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, menginstal dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA normal dan
ringkasan kembali ke `.artifacts/qa-e2e/...` di host.
Ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Jalankan suite host dan Multipass mengeksekusi beberapa skenario terpilih secara paralel
dengan worker gateway terisolasi secara default. `qa-channel` default ke concurrency
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa kode keluar gagal.
Jalankan live meneruskan input auth QA yang didukung dan praktis untuk
guest: kunci provider berbasis env, path config provider live QA, dan
`CODEX_HOME` jika ada. Simpan `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang di-mount.

## Referensi QA Telegram, Discord, dan Slack

Matrix memiliki [halaman khusus](/id/concepts/qa-matrix) karena jumlah skenarionya dan provisioning homeserver berbasis Docker. Telegram, Discord, dan Slack lebih kecil — masing-masing beberapa skenario, tanpa sistem profil, terhadap channel nyata yang sudah ada — sehingga referensinya berada di sini.

### Flag CLI bersama

Jalur ini didaftarkan melalui `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan menerima flag yang sama:

| Flag                                  | Default                                                         | Deskripsi                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | —                                                               | Jalankan hanya skenario ini. Dapat diulang.                                                                              |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Tempat laporan/ringkasan/pesan teramati dan log output ditulis. Path relatif diselesaikan terhadap `--repo-root`.        |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Root repositori saat memanggil dari cwd netral.                                                                          |
| `--sut-account <id>`                  | `sut`                                                           | Id akun sementara di dalam config gateway QA.                                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` atau `live-frontier` (`live-openai` legacy masih berfungsi).                                               |
| `--model <ref>` / `--alt-model <ref>` | default provider                                                | Ref model utama/alternatif.                                                                                              |
| `--fast`                              | mati                                                            | Mode cepat provider jika didukung.                                                                                       |
| `--credential-source <env\|convex>`   | `env`                                                           | Lihat [pool kredensial Convex](#convex-credential-pool).                                                                 |
| `--credential-role <maintainer\|ci>`  | `ci` di CI, selain itu `maintainer`                             | Peran yang digunakan saat `--credential-source convex`.                                                                  |

Setiap jalur keluar non-zero pada skenario yang gagal. `--allow-failures` menulis artefak tanpa menetapkan kode keluar gagal.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Menargetkan satu grup Telegram privat nyata dengan dua bot berbeda (driver + SUT). Bot SUT harus memiliki nama pengguna Telegram; pengamatan bot-ke-bot bekerja paling baik saat kedua bot mengaktifkan **Bot-to-Bot Communication Mode** di `@BotFather`.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id chat numerik (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opsional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` menyimpan isi pesan dalam artefak pesan teramati (default disunting).

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
- `telegram-qa-summary.json` — mencakup RTT per balasan (driver mengirim → balasan SUT teramati) dimulai dari canary.
- `telegram-qa-observed-messages.json` — isi disunting kecuali `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Menargetkan satu channel guild Discord privat nyata dengan dua bot: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh child OpenClaw gateway melalui Plugin Discord bawaan. Memverifikasi penanganan penyebutan channel, bahwa bot SUT telah mendaftarkan perintah `/help` native dengan Discord, dan skenario bukti Mantis opt-in.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — harus cocok dengan id pengguna bot SUT yang dikembalikan oleh Discord (jika tidak, jalur gagal cepat).

Opsional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` menyimpan isi pesan dalam artefak pesan teramati.

Skenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — skenario Mantis opt-in. Berjalan sendiri karena mengalihkan SUT ke balasan guild selalu aktif, tool-only dengan `messages.statusReactions.enabled=true`, lalu menangkap timeline reaksi REST plus artefak visual HTML/PNG. Laporan sebelum/sesudah Mantis juga mempertahankan artefak MP4 yang disediakan skenario sebagai `baseline.mp4` dan `candidate.mp4`.

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
- `discord-qa-observed-messages.json` — isi disunting kecuali `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` dan `discord-status-reactions-tool-only-timeline.png` saat skenario reaksi status berjalan.

### QA Slack

```bash
pnpm openclaw qa slack
```

Menargetkan satu channel Slack privat nyata dengan dua bot berbeda: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh child OpenClaw gateway melalui Plugin Slack bawaan.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opsional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` menyimpan isi pesan dalam artefak pesan teramati.

Skenario (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artefak output:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — isi disunting kecuali `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Menyiapkan workspace Slack

Jalur ini membutuhkan dua aplikasi Slack berbeda dalam satu workspace, ditambah sebuah channel tempat kedua bot menjadi anggota:

- `channelId` — id `Cxxxxxxxxxx` dari channel tempat kedua bot telah diundang. Gunakan channel khusus; jalur ini mem-posting pada setiap run.
- `driverBotToken` — token bot (`xoxb-...`) dari aplikasi **Driver**.
- `sutBotToken` — token bot (`xoxb-...`) dari aplikasi **SUT**, yang harus merupakan aplikasi Slack terpisah dari driver agar id pengguna botnya berbeda.
- `sutAppToken` — token tingkat aplikasi (`xapp-...`) dari aplikasi SUT dengan `connections:write`, digunakan oleh Socket Mode agar aplikasi SUT dapat menerima event.

Lebih pilih workspace Slack khusus untuk QA daripada menggunakan kembali workspace produksi.

Manifest SUT di bawah mencerminkan instalasi produksi Plugin Slack bawaan (`extensions/slack/src/setup-shared.ts:10`). Untuk penyiapan channel produksi seperti yang dilihat pengguna, lihat [penyiapan cepat channel Slack](/id/channels/slack#quick-setup); pasangan QA Driver/SUT sengaja dipisahkan karena jalur ini membutuhkan dua id pengguna bot berbeda dalam satu workspace.

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

Salin _Bot User OAuth Token_ (`xoxb-...`) — itu menjadi `driverBotToken`. Driver hanya perlu mem-posting pesan dan mengidentifikasi dirinya; tanpa event, tanpa Socket Mode.

**2. Buat aplikasi SUT**

Ulangi _Create New App → From a manifest_ di workspace yang sama. Kumpulan scope mencerminkan instalasi produksi Plugin Slack bawaan (`extensions/slack/src/setup-shared.ts:10`):

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
        "reactions:read",
        "reactions:write",
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
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Setelah Slack membuat aplikasi, lakukan dua hal di halaman pengaturannya:

- _Instal ke Ruang Kerja_ → salin _Token OAuth Pengguna Bot_ → itu menjadi `sutBotToken`.
- _Informasi Dasar → Token Tingkat Aplikasi → Buat Token dan Cakupan_ → tambahkan cakupan `connections:write` → simpan → salin nilai `xapp-...` → itu menjadi `sutAppToken`.

Verifikasi bahwa kedua bot memiliki id pengguna yang berbeda dengan memanggil `auth.test` pada setiap token. Runtime membedakan driver dan SUT berdasarkan id pengguna; menggunakan ulang satu aplikasi untuk keduanya akan langsung menggagalkan gating mention.

**3. Buat channel**

Di ruang kerja QA, buat channel (misalnya `#openclaw-qa`) dan undang kedua bot dari dalam channel:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Salin id `Cxxxxxxxxxx` dari _info channel → Tentang → ID Channel_ — itu menjadi `channelId`. Channel publik dapat digunakan; jika Anda memakai channel privat, kedua aplikasi sudah memiliki `groups:history` sehingga pembacaan riwayat oleh harness tetap akan berhasil.

**4. Daftarkan kredensial**

Ada dua opsi. Gunakan variabel env untuk debugging satu mesin (atur empat variabel `OPENCLAW_QA_SLACK_*` dan teruskan `--credential-source env`), atau isi kumpulan Convex bersama agar CI dan maintainer lain dapat menyewanya.

Untuk kumpulan Convex, tulis keempat bidang ke file JSON:

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

**5. Verifikasi end-to-end**

Jalankan lane secara lokal untuk memastikan kedua bot dapat saling berbicara melalui broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Run yang hijau selesai jauh di bawah 30 detik dan `slack-qa-report.md` menampilkan `slack-canary` dan `slack-mention-gating` dengan status `pass`. Jika lane macet selama ~90 detik dan keluar dengan `Convex credential pool exhausted for kind "slack"`, berarti kumpulan kosong atau setiap baris sedang disewa — `qa credentials list --kind slack --status all --json` akan memberi tahu Anda yang mana.

### Kumpulan kredensial Convex

Lane Telegram, Discord, dan Slack dapat menyewa kredensial dari kumpulan Convex bersama alih-alih membaca variabel env di atas. Teruskan `--credential-source convex` (atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab memperoleh lease eksklusif, mengirim Heartbeat selama durasi run, dan melepasnya saat shutdown. Jenis kumpulan adalah `"telegram"`, `"discord"`, dan `"slack"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` harus berupa string chat-id numerik.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` harus cocok dengan `^[A-Z][A-Z0-9]+$` (id Slack seperti `Cxxxxxxxxxx`). Lihat [Menyiapkan ruang kerja Slack](#setting-up-the-slack-workspace) untuk penyediaan aplikasi dan cakupan.

Variabel env operasional dan kontrak endpoint broker Convex berada di [Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1) (nama bagian tersebut mendahului dukungan Discord; semantik broker identik untuk kedua jenis).

## Seed berbasis repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Ini sengaja ada di git agar rencana QA terlihat oleh manusia dan
agent.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah
sumber kebenaran untuk satu run pengujian dan harus mendefinisikan:

- metadata skenario
- metadata kategori, kapabilitas, lane, dan risiko opsional
- referensi dokumen dan kode
- persyaratan Plugin opsional
- patch konfigurasi Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang yang mendukung `qa-flow` boleh tetap generik
dan lintas aspek. Misalnya, skenario markdown dapat menggabungkan helper sisi transport
dengan helper sisi browser yang mengendalikan Control UI tertanam melalui
seam `browser.request` Gateway tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan kapabilitas produk, bukan folder pohon sumber.
Jaga agar ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup tindakan pesan
- callback Cron
- pemanggilan ulang memori
- pergantian model
- handoff subagent
- pembacaan repo dan pembacaan dokumen
- satu tugas build kecil seperti Lobster Invaders

## Lane mock penyedia

`qa suite` memiliki dua lane mock penyedia lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi lane mock
  deterministik default untuk QA berbasis repo dan gate paritas.
- `aimock` memulai server penyedia berbasis AIMock untuk cakupan protokol eksperimental,
  fixture, record/replay, dan chaos. Ini bersifat aditif dan tidak
  menggantikan dispatcher skenario `mock-openai`.

Implementasi lane penyedia berada di bawah `extensions/qa-lab/src/providers/`.
Setiap penyedia memiliki defaultnya, startup server lokal, konfigurasi model Gateway,
kebutuhan staging profil auth, dan flag kapabilitas live/mock. Kode suite dan
Gateway bersama harus merutekan melalui registry penyedia alih-alih bercabang berdasarkan
nama penyedia.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown. `qa-channel` adalah adapter pertama pada seam tersebut, tetapi target desainnya lebih luas: channel nyata atau sintetis di masa depan harus dihubungkan ke runner suite yang sama, bukan menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- Adapter transport memiliki konfigurasi Gateway, kesiapan, observasi inbound dan outbound, tindakan transport, dan status transport ternormalisasi.
- File skenario markdown di bawah `qa/scenarios/` mendefinisikan run pengujian; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang untuk mengeksekusinya.

### Menambahkan channel

Menambahkan channel ke sistem QA markdown memerlukan tepat dua hal:

1. Adapter transport untuk channel tersebut.
2. Paket skenario yang menguji kontrak channel.

Jangan menambahkan root perintah QA tingkat atas baru ketika host bersama `qa-lab` dapat memiliki alur tersebut.

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
- bagaimana Gateway dikonfigurasi untuk transport tersebut
- bagaimana kesiapan diperiksa
- bagaimana event inbound diinjeksi
- bagaimana pesan outbound diamati
- bagaimana transkrip dan status transport ternormalisasi diekspos
- bagaimana tindakan berbasis transport dieksekusi
- bagaimana reset atau pembersihan khusus transport ditangani

Batas adopsi minimum untuk channel baru:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Simpan mekanika khusus transport di dalam Plugin runner atau harness channel.
4. Pasang runner sebagai `openclaw qa <runner>` alih-alih mendaftarkan perintah root pesaing. Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`. Jaga `runtime-api.ts` tetap ringan; CLI lazy dan eksekusi runner harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasi skenario markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Jaga alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport channel, simpan di Plugin runner atau harness Plugin tersebut.
- Jika skenario memerlukan kapabilitas baru yang dapat digunakan lebih dari satu channel, tambahkan helper generik alih-alih cabang khusus channel di `suite.ts`.
- Jika perilaku hanya bermakna untuk satu transport, pertahankan skenario khusus transport dan buat hal itu eksplisit dalam kontrak skenario.

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

Alias kompatibilitas tetap tersedia untuk skenario yang ada — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — tetapi penulisan skenario baru harus menggunakan nama generik. Alias ada untuk menghindari migrasi serentak, bukan sebagai model ke depannya.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia — berguna saat mengukur pekerjaan tindak lanjut atau memasang transport baru — jalankan `pnpm openclaw qa coverage` (tambahkan `--json` untuk output yang dapat dibaca mesin).

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

Perintah ini menjalankan proses anak Gateway QA lokal, bukan Docker. Skenario evaluasi karakter harus mengatur persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap transkrip lengkap, mencatat statistik dasar eksekusi, lalu meminta model juri dalam mode cepat dengan penalaran `xhigh` jika didukung untuk memeringkat eksekusi berdasarkan kewajaran, nuansa, dan humor. Gunakan `--blind-judge-models` saat membandingkan penyedia: prompt juri tetap mendapatkan setiap transkrip dan status eksekusi, tetapi ref kandidat diganti dengan label netral seperti `candidate-01`; laporan memetakan kembali peringkat ke ref sebenarnya setelah parsing.
Eksekusi kandidat secara default menggunakan thinking `high`, dengan `medium` untuk GPT-5.5 dan `xhigh` untuk ref evaluasi OpenAI lama yang mendukungnya. Timpa kandidat tertentu secara inline dengan `--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan fallback global, dan bentuk lama `--model-thinking <provider/model=level>` dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI secara default menggunakan mode cepat sehingga pemrosesan prioritas digunakan jika penyedia mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat satu kandidat atau juri memerlukan penimpaan. Berikan `--fast` hanya saat Anda ingin memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan juri dicatat dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit menyatakan agar tidak memeringkat berdasarkan kecepatan.
Eksekusi model kandidat dan juri keduanya secara default menggunakan konkurensi 16. Turunkan `--concurrency` atau `--judge-concurrency` saat batas penyedia atau tekanan Gateway lokal membuat eksekusi terlalu bising.
Saat tidak ada kandidat `--model` yang diberikan, evaluasi karakter secara default menggunakan `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5`, dan `google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, juri secara default menggunakan `openai/gpt-5.5,thinking=xhigh,fast` dan `anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [Matriks QA](/id/concepts/qa-matrix)
- [Channel QA](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dasbor](/id/web/dashboard)
