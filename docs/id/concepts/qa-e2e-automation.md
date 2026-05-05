---
read_when:
    - Memahami bagaimana stack QA saling terkait
    - Memperluas qa-lab, qa-channel, atau adapter transport
    - Menambahkan skenario QA berbasis repo
    - Membangun otomatisasi QA dengan tingkat realisme lebih tinggi di seputar dasbor Gateway
summary: 'Ikhtisar tumpukan QA: qa-lab, qa-channel, skenario berbasis repo, jalur transport langsung, adapter transport, dan pelaporan.'
title: Gambaran umum QA
x-i18n:
    generated_at: "2026-05-05T01:45:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis dan
berbentuk kanal dibandingkan yang dapat dilakukan satu pengujian unit.

Bagian saat ini:

- `extensions/qa-channel`: kanal pesan sintetis dengan permukaan DM, kanal, thread,
  reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `extensions/qa-matrix`, plugin runner mendatang: adapter transport langsung yang
  menggerakkan kanal nyata di dalam Gateway QA anak.
- `qa/`: aset seed berbasis repo untuk tugas kickoff dan skenario QA
  baseline.
- [Mantis](/id/concepts/mantis): verifikasi langsung sebelum dan sesudah untuk bug yang
  memerlukan transport nyata, tangkapan layar browser, status VM, dan bukti PR.

## Permukaan perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip `pnpm qa:*`; kedua bentuk didukung.

| Perintah                                            | Tujuan                                                                                                                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Pemeriksaan mandiri QA bawaan; menulis laporan Markdown.                                                                                                                                     |
| `qa suite`                                          | Menjalankan skenario berbasis repo terhadap jalur Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` untuk VM Linux sekali pakai.                                               |
| `qa coverage`                                       | Mencetak inventaris cakupan skenario markdown (`--json` untuk keluaran mesin).                                                                                                               |
| `qa parity-report`                                  | Membandingkan dua file `qa-suite-summary.json` dan menulis laporan paritas agentik.                                                                                                          |
| `qa character-eval`                                 | Menjalankan skenario QA karakter di beberapa model langsung dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                                                     |
| `qa manual`                                         | Menjalankan prompt sekali jalan terhadap jalur provider/model yang dipilih.                                                                                                                  |
| `qa ui`                                             | Memulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                                           |
| `qa docker-build-image`                             | Membangun image Docker QA yang sudah dipanggang sebelumnya.                                                                                                                                  |
| `qa docker-scaffold`                                | Menulis scaffold docker-compose untuk dasbor QA + jalur Gateway.                                                                                                                             |
| `qa up`                                             | Membangun situs QA, memulai stack berbasis Docker, mencetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                |
| `qa aimock`                                         | Memulai hanya server provider AIMock.                                                                                                                                                        |
| `qa mock-openai`                                    | Memulai hanya server provider `mock-openai` yang sadar skenario.                                                                                                                             |
| `qa credentials doctor` / `add` / `list` / `remove` | Mengelola pool kredensial Convex bersama.                                                                                                                                                    |
| `qa matrix`                                         | Jalur transport langsung terhadap homeserver Tuwunel sekali pakai. Lihat [QA Matrix](/id/concepts/qa-matrix).                                                                                  |
| `qa telegram`                                       | Jalur transport langsung terhadap grup Telegram privat nyata.                                                                                                                                |
| `qa discord`                                        | Jalur transport langsung terhadap kanal guild Discord privat nyata.                                                                                                                          |
| `qa slack`                                          | Jalur transport langsung terhadap kanal Slack privat nyata.                                                                                                                                  |
| `qa mantis`                                         | Runner verifikasi sebelum dan sesudah untuk bug transport langsung, dengan bukti reaksi status Discord, smoke desktop/browser Crabbox, dan smoke Slack-di-VNC. Lihat [Mantis](/id/concepts/mantis). |

## Alur operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (UI Kontrol) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai jalur Gateway berbasis Docker, dan mengekspos
halaman QA Lab tempat operator atau loop otomasi dapat memberi agen sebuah misi
QA, mengamati perilaku kanal nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab lokal yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundel QA Lab yang di-mount melalui bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mempertahankan layanan Docker pada image yang sudah dibangun sebelumnya dan melakukan bind-mount
`extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch`
membangun ulang bundel tersebut saat ada perubahan, dan browser otomatis memuat ulang ketika hash aset QA Lab berubah.

Untuk smoke trace OpenTelemetry lokal, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip itu memulai receiver trace OTLP/HTTP lokal, menjalankan
skenario QA `otel-trace-smoke` dengan plugin `diagnostics-otel` diaktifkan, lalu
mendekode span protobuf yang diekspor dan menegaskan bentuk penting-rilis:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, dan `openclaw.message.delivery` harus ada;
pemanggilan model tidak boleh mengekspor `StreamAbandoned` pada giliran yang berhasil; ID diagnostik mentah dan
atribut `openclaw.content.*` harus tetap berada di luar trace. Skrip ini menulis
`otel-smoke-summary.json` di sebelah artefak suite QA.

QA observabilitas tetap hanya untuk checkout sumber. Tarball npm sengaja menghilangkan
QA Lab, sehingga jalur rilis Docker paket tidak menjalankan perintah `qa`. Gunakan
`pnpm qa:otel:smoke` dari checkout sumber yang sudah dibangun saat mengubah instrumentasi
diagnostik.

Untuk jalur smoke Matrix yang benar-benar memakai transport nyata, jalankan:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Referensi CLI lengkap, katalog profil/skenario, env vars, dan tata letak artefak untuk jalur ini ada di [QA Matrix](/id/concepts/qa-matrix). Sekilas: jalur ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver/SUT/observer sementara, menjalankan plugin Matrix nyata di dalam Gateway QA anak yang dibatasi ke transport tersebut (tanpa `qa-channel`), lalu menulis laporan Markdown, ringkasan JSON, artefak observed-events, dan log keluaran gabungan di bawah `.artifacts/qa-e2e/matrix-<timestamp>/`.

Untuk jalur smoke Telegram, Discord, dan Slack yang benar-benar memakai transport nyata:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Jalur tersebut menargetkan kanal nyata yang sudah ada dengan dua bot (driver + SUT). Env vars yang diperlukan, daftar skenario, artefak keluaran, dan pool kredensial Convex didokumentasikan dalam [Referensi QA Telegram, Discord, dan Slack](#telegram-discord-and-slack-qa-reference) di bawah.

Untuk menjalankan VM desktop Slack penuh dengan penyelamatan VNC, jalankan:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Perintah itu menyewa mesin desktop/browser Crabbox, menjalankan jalur langsung Slack
di dalam VM, membuka Slack Web di browser VNC, menangkap desktop, dan
menyalin `slack-qa/` serta `slack-desktop-smoke.png` kembali ke direktori artefak
Mantis. Gunakan ulang `--lease-id <cbx_...>` setelah masuk ke Slack Web secara manual
melalui VNC. Dengan `--gateway-setup`, Mantis meninggalkan Gateway Slack OpenClaw
persisten yang berjalan di dalam VM pada port `38973`; tanpa itu, perintah menjalankan
jalur QA Slack bot-ke-bot normal dan keluar setelah pengambilan artefak.

Sebelum menggunakan kredensial langsung dari pool, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi keterjangkauan admin/list ketika rahasia maintainer ada. Ini hanya melaporkan status tersetel/hilang untuk rahasia.

## Cakupan transport langsung

Jalur transport langsung berbagi satu kontrak alih-alih masing-masing membuat bentuk daftar skenarionya sendiri. `qa-channel` adalah suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport langsung.

| Jalur    | Canary | Gating mention | Bot-ke-bot | Blokir allowlist | Balasan level atas | Lanjut setelah restart | Tindak lanjut thread | Isolasi thread | Pengamatan reaksi | Perintah bantuan | Registrasi perintah native |
| -------- | ------ | -------------- | ---------- | ---------------- | ------------------ | ---------------------- | -------------------- | -------------- | ----------------- | ---------------- | -------------------------- |
| Matrix   | x      | x              | x          | x                | x                  | x                      | x                    | x              | x                 |                  |                            |
| Telegram | x      | x              | x          |                  |                    |                        |                      |                |                   | x                |                            |
| Discord  | x      | x              | x          |                  |                    |                        |                      |                |                   |                  | x                          |
| Slack    | x      | x              | x          |                  |                    |                        |                      |                |                   |                  |                            |

Ini mempertahankan `qa-channel` sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transport langsung mendatang berbagi satu checklist kontrak transport yang
eksplisit.

Untuk jalur VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, memasang dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA normal dan
ringkasan kembali ke `.artifacts/qa-e2e/...` di host.
Ini menggunakan ulang perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Eksekusi suite host dan Multipass menjalankan beberapa skenario terpilih secara paralel
dengan worker gateway terisolasi secara bawaan. `qa-channel` secara bawaan memakai konkurensi
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar dengan non-zero ketika skenario mana pun gagal. Gunakan `--allow-failures` ketika
Anda menginginkan artefak tanpa kode keluar gagal.
Eksekusi live meneruskan input auth QA yang didukung dan praktis untuk
guest: kunci penyedia berbasis env, jalur config penyedia live QA, dan
`CODEX_HOME` jika ada. Simpan `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang di-mount.

## Referensi QA Telegram, Discord, dan Slack

Matrix memiliki [halaman khusus](/id/concepts/qa-matrix) karena jumlah skenarionya dan penyediaan homeserver berbasis Docker. Telegram, Discord, dan Slack lebih kecil — masing-masing hanya beberapa skenario, tanpa sistem profil, terhadap channel nyata yang sudah ada — sehingga referensinya ada di sini.

### Flag CLI bersama

Lane ini didaftarkan melalui `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan menerima flag yang sama:

| Flag                                  | Bawaan                                                         | Deskripsi                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Jalankan hanya skenario ini. Dapat diulang.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Tempat laporan/ringkasan/pesan teramati dan log output ditulis. Jalur relatif diselesaikan terhadap `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Root repositori saat memanggil dari cwd netral.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | Id akun sementara di dalam config gateway QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` atau `live-frontier` (`live-openai` legacy masih berfungsi).                                                  |
| `--model <ref>` / `--alt-model <ref>` | bawaan penyedia                                                | Ref model utama/alternatif.                                                                                         |
| `--fast`                              | nonaktif                                                             | Mode cepat penyedia jika didukung.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | Lihat [pool kredensial Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` di CI, selain itu `maintainer`                              | Role yang digunakan ketika `--credential-source convex`.                                                                          |

Setiap lane keluar dengan non-zero pada skenario yang gagal. `--allow-failures` menulis artefak tanpa menetapkan kode keluar gagal.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Menargetkan satu grup Telegram privat nyata dengan dua bot berbeda (driver + SUT). Bot SUT harus memiliki username Telegram; observasi bot-ke-bot bekerja paling baik ketika kedua bot mengaktifkan **Bot-to-Bot Communication Mode** di `@BotFather`.

Env yang diperlukan ketika `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id chat numerik (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opsional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mempertahankan body pesan dalam artefak pesan teramati (bawaan menyamarkan).

Skenario (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Artefak output:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — mencakup RTT per-balasan (driver mengirim → balasan SUT teramati) dimulai dengan canary.
- `telegram-qa-observed-messages.json` — body disamarkan kecuali `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Menargetkan satu channel guild Discord privat nyata dengan dua bot: bot driver yang dikontrol oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Discord yang dibundel. Memverifikasi penanganan mention channel, bahwa bot SUT telah mendaftarkan perintah native `/help` dengan Discord, dan skenario bukti Mantis opt-in.

Env yang diperlukan ketika `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — harus cocok dengan id pengguna bot SUT yang dikembalikan oleh Discord (jika tidak, lane gagal cepat).

Opsional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mempertahankan body pesan dalam artefak pesan teramati.

Skenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — skenario Mantis opt-in. Berjalan sendiri karena mengalihkan SUT ke balasan guild selalu aktif, hanya tool dengan `messages.statusReactions.enabled=true`, lalu menangkap timeline reaksi REST plus artefak visual HTML/PNG.

Jalankan skenario reaksi-status Mantis secara eksplisit:

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
- `discord-qa-observed-messages.json` — body disamarkan kecuali `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` dan `discord-status-reactions-tool-only-timeline.png` ketika skenario reaksi-status berjalan.

### QA Slack

```bash
pnpm openclaw qa slack
```

Menargetkan satu channel Slack privat nyata dengan dua bot berbeda: bot driver yang dikontrol oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Slack yang dibundel.

Env yang diperlukan ketika `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opsional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mempertahankan body pesan dalam artefak pesan teramati.

Skenario (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artefak output:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — body disamarkan kecuali `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Menyiapkan workspace Slack

Lane memerlukan dua aplikasi Slack berbeda dalam satu workspace, plus channel yang diikuti kedua bot:

- `channelId` — id `Cxxxxxxxxxx` dari channel tempat kedua bot telah diundang. Gunakan channel khusus; lane memposting pada setiap eksekusi.
- `driverBotToken` — token bot (`xoxb-...`) dari aplikasi **Driver**.
- `sutBotToken` — token bot (`xoxb-...`) dari aplikasi **SUT**, yang harus berupa aplikasi Slack terpisah dari driver agar id pengguna botnya berbeda.
- `sutAppToken` — token tingkat aplikasi (`xapp-...`) dari aplikasi SUT dengan `connections:write`, digunakan oleh Socket Mode agar aplikasi SUT dapat menerima event.

Lebih baik gunakan workspace Slack khusus untuk QA daripada menggunakan ulang workspace produksi.

Manifest SUT di bawah mencerminkan instalasi produksi Plugin Slack yang dibundel (`extensions/slack/src/setup-shared.ts:10`). Untuk penyiapan channel produksi seperti yang dilihat pengguna, lihat [penyiapan cepat channel Slack](/id/channels/slack#quick-setup); pasangan Driver/SUT QA sengaja dipisahkan karena lane memerlukan dua id pengguna bot berbeda dalam satu workspace.

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

Salin _Bot User OAuth Token_ (`xoxb-...`) — itu menjadi `driverBotToken`. Driver hanya perlu memposting pesan dan mengidentifikasi dirinya; tidak ada event, tidak ada Socket Mode.

**2. Buat aplikasi SUT**

Ulangi _Create New App → From a manifest_ di workspace yang sama. Set scope mencerminkan instalasi produksi Plugin Slack yang dibundel (`extensions/slack/src/setup-shared.ts:10`):

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

- _Install to Workspace_ → salin _Bot User OAuth Token_ → itu menjadi `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → tambahkan scope `connections:write` → simpan → salin nilai `xapp-...` → itu menjadi `sutAppToken`.

Verifikasi bahwa kedua bot memiliki id pengguna yang berbeda dengan memanggil `auth.test` pada setiap token. Runtime membedakan driver dan SUT berdasarkan id pengguna; menggunakan ulang satu aplikasi untuk keduanya akan langsung membuat gating sebutan gagal.

**3. Buat channel**

Di workspace QA, buat channel (mis. `#openclaw-qa`) dan undang kedua bot dari dalam channel:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Salin id `Cxxxxxxxxxx` dari _channel info → About → Channel ID_ — itu menjadi `channelId`. Channel publik bisa digunakan; jika Anda memakai channel privat, kedua aplikasi sudah memiliki `groups:history` sehingga pembacaan riwayat harness tetap akan berhasil.

**4. Daftarkan kredensial**

Ada dua opsi. Gunakan variabel env untuk debugging satu mesin (atur empat variabel `OPENCLAW_QA_SLACK_*` dan teruskan `--credential-source env`), atau isi pool Convex bersama agar CI dan maintainer lain dapat menyewanya.

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

**5. Verifikasi ujung ke ujung**

Jalankan lane secara lokal untuk mengonfirmasi kedua bot dapat saling berbicara melalui broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Run hijau selesai jauh di bawah 30 detik dan `slack-qa-report.md` menampilkan `slack-canary` dan `slack-mention-gating` dengan status `pass`. Jika lane menggantung selama sekitar 90 detik dan keluar dengan `Convex credential pool exhausted for kind "slack"`, berarti pool kosong atau setiap baris sedang disewa — `qa credentials list --kind slack --status all --json` akan memberi tahu Anda yang mana.

### Pool kredensial Convex

Lane Telegram, Discord, dan Slack dapat menyewa kredensial dari pool Convex bersama, bukan membaca variabel env di atas. Teruskan `--credential-source convex` (atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab memperoleh lease eksklusif, mengirim heartbeat selama durasi run, dan merilisnya saat shutdown. Jenis pool adalah `"telegram"`, `"discord"`, dan `"slack"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` harus berupa string chat-id numerik.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` harus cocok dengan `^[A-Z][A-Z0-9]+$` (id Slack seperti `Cxxxxxxxxxx`). Lihat [Menyiapkan workspace Slack](#setting-up-the-slack-workspace) untuk penyediaan aplikasi dan scope.

Variabel env operasional dan kontrak endpoint broker Convex berada di [Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1) (nama bagian mendahului dukungan Discord; semantik broker identik untuk kedua jenis).

## Seed berbasis repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Ini sengaja berada di git agar rencana QA terlihat oleh manusia maupun
agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah
sumber kebenaran untuk satu run pengujian dan harus mendefinisikan:

- metadata skenario
- metadata kategori, kemampuan, lane, dan risiko opsional
- referensi docs dan kode
- persyaratan Plugin opsional
- patch konfigurasi Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang yang mendukung `qa-flow` boleh tetap generik
dan lintas area. Misalnya, skenario markdown dapat menggabungkan helper sisi transport
dengan helper sisi browser yang menggerakkan Control UI tertanam melalui seam
Gateway `browser.request` tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan kemampuan produk, bukan folder
source tree. Pertahankan ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup aksi pesan
- callback cron
- pemanggilan kembali memori
- pergantian model
- handoff subagen
- pembacaan repo dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock penyedia

`qa suite` memiliki dua lane mock penyedia lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi lane mock
  deterministik default untuk QA berbasis repo dan gate paritas.
- `aimock` memulai server penyedia berbasis AIMock untuk cakupan protokol,
  fixture, record/replay, dan chaos eksperimental. Ini bersifat aditif dan tidak
  menggantikan dispatcher skenario `mock-openai`.

Implementasi lane penyedia berada di bawah `extensions/qa-lab/src/providers/`.
Setiap penyedia memiliki defaultnya sendiri, startup server lokal, konfigurasi model gateway,
kebutuhan staging auth-profile, dan flag kemampuan live/mock. Kode suite dan
Gateway bersama harus merutekan melalui registry penyedia, bukan membuat branch berdasarkan
nama penyedia.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown. `qa-channel` adalah adapter pertama pada seam itu, tetapi target desainnya lebih luas: channel nyata atau sintetis di masa depan harus terhubung ke runner suite yang sama, bukan menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pemisahannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- Adapter transport memiliki konfigurasi Gateway, kesiapan, observasi inbound dan outbound, aksi transport, dan state transport ternormalisasi.
- File skenario markdown di bawah `qa/scenarios/` mendefinisikan run pengujian; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang untuk mengeksekusinya.

### Menambahkan channel

Menambahkan channel ke sistem QA markdown membutuhkan tepat dua hal:

1. Adapter transport untuk channel tersebut.
2. Paket skenario yang menguji kontrak channel.

Jangan tambahkan root perintah QA tingkat atas baru ketika host bersama `qa-lab` dapat memiliki alur tersebut.

`qa-lab` memiliki mekanik host bersama:

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
- bagaimana transkrip dan state transport ternormalisasi diekspos
- bagaimana aksi berbasis transport dieksekusi
- bagaimana reset atau pembersihan khusus transport ditangani

Bar adopsi minimum untuk channel baru:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Simpan mekanik khusus transport di dalam Plugin runner atau harness channel.
4. Pasang runner sebagai `openclaw qa <runner>`, bukan mendaftarkan root perintah yang bersaing. Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`. Jaga `runtime-api.ts` tetap ringan; eksekusi CLI dan runner yang lazy harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasi skenario markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport channel, simpan di Plugin runner atau harness Plugin tersebut.
- Jika skenario membutuhkan kemampuan baru yang dapat digunakan oleh lebih dari satu channel, tambahkan helper generik, bukan branch khusus channel di `suite.ts`.
- Jika suatu perilaku hanya bermakna untuk satu transport, pertahankan skenario khusus transport dan nyatakan itu secara eksplisit dalam kontrak skenario.

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

Alias kompatibilitas tetap tersedia untuk skenario yang ada — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — tetapi penulisan skenario baru harus menggunakan nama generik. Alias ada untuk menghindari migrasi serentak, bukan sebagai model ke depan.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia — berguna saat mengukur pekerjaan tindak lanjut atau menghubungkan transport baru — jalankan `pnpm openclaw qa coverage` (tambahkan `--json` untuk output yang dapat dibaca mesin).

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

Perintah ini menjalankan proses anak Gateway QA lokal, bukan Docker. Skenario evaluasi karakter harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa seperti chat, bantuan ruang kerja, dan tugas file kecil. Model kandidat tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini menyimpan setiap transkrip lengkap, mencatat statistik dasar proses, lalu meminta model penilai dalam mode cepat dengan penalaran `xhigh` jika didukung untuk memeringkat proses berdasarkan kewajaran, nuansa, dan humor.
Gunakan `--blind-judge-models` saat membandingkan penyedia: prompt penilai tetap mendapatkan setiap transkrip dan status proses, tetapi referensi kandidat diganti dengan label netral seperti `candidate-01`; laporan memetakan peringkat kembali ke referensi asli setelah parsing.
Proses kandidat secara default menggunakan tingkat berpikir `high`, dengan `medium` untuk GPT-5.5 dan `xhigh` untuk referensi evaluasi OpenAI lama yang mendukungnya. Timpa kandidat tertentu secara inline dengan `--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan fallback global, dan bentuk lama `--model-thinking <provider/model=level>` dipertahankan untuk kompatibilitas.
Referensi kandidat OpenAI secara default menggunakan mode cepat sehingga pemrosesan prioritas digunakan jika penyedia mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat satu kandidat atau penilai memerlukan penimpaan. Berikan `--fast` hanya saat Anda ingin memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan penilai dicatat dalam laporan untuk analisis benchmark, tetapi prompt penilai secara eksplisit mengatakan untuk tidak memeringkat berdasarkan kecepatan.
Proses model kandidat dan penilai sama-sama default ke konkurensi 16. Turunkan `--concurrency` atau `--judge-concurrency` saat batas penyedia atau tekanan Gateway lokal membuat proses terlalu bising.
Saat tidak ada kandidat `--model` yang diberikan, evaluasi karakter secara default menggunakan `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, penilai secara default menggunakan
`openai/gpt-5.5,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [Matriks QA](/id/concepts/qa-matrix)
- [Kanal QA](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dasbor](/id/web/dashboard)
