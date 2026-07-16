---
read_when:
    - Membangun atau menjalankan QA visual langsung untuk bug OpenClaw
    - Menambahkan verifikasi sebelum dan sesudah untuk pull request
    - Menambahkan skenario transportasi langsung Discord, Slack, WhatsApp, atau lainnya
    - Menjalankan pembuktian browser Control UI terfokus untuk ref kandidat
    - Men-debug proses QA yang memerlukan tangkapan layar, otomatisasi browser, atau akses VNC
summary: Mantis merekam bukti visual menyeluruh untuk perbandingan transportasi langsung dan pembuktian browser terfokus khusus kandidat, lalu melampirkan artefaknya ke PR.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T17:58:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis menerbitkan bukti CI visual dan komentar PR untuk perilaku OpenClaw.
Skenario transport langsung membandingkan baseline yang diketahui bermasalah dengan ref kandidat;
lane browser terfokus dapat sebagai gantinya membuktikan satu kandidat terhadap transport tiruan
yang deterministik. Discord dirilis terlebih dahulu dengan autentikasi bot nyata, kanal guild,
reaksi, utas, dan saksi browser. Lane chat Slack, Telegram, dan Control
UI terfokus juga tersedia; WhatsApp dan Matrix belum diimplementasikan.

## Kepemilikan

- OpenClaw (`extensions/qa-lab/src/mantis/*`): runtime skenario, CLI `pnpm openclaw qa mantis <command>`, skema bukti.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): harness transport langsung, bot driver/SUT, penulis laporan/bukti.
- Crabbox (`openclaw/crabbox`): mesin Linux yang telah dipanaskan, sewa, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): titik masuk jarak jauh, retensi artefak.
- ClawSweeper: mengurai perintah PR pengelola, menjalankan alur kerja, memposting komentar PR akhir.

## Perintah CLI

Semua perintah adalah `pnpm openclaw qa mantis <command>`, yang didefinisikan dalam
`extensions/qa-lab/src/mantis/cli.ts`. Memerlukan `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
saat build/runtime (alur kerja yang dibundel mengatur `OPENCLAW_BUILD_PRIVATE_QA=1` dan
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` sebelum membangun).

| Perintah                        | Tujuan                                                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Memverifikasi bahwa bot Mantis Discord dapat melihat guild/kanal, memposting, dan bereaksi.                                                               |
| `run`                           | Menjalankan skenario sebelum/sesudah terhadap ref baseline dan kandidat (khusus Discord).                                                                  |
| `desktop-browser-smoke`         | Menyewa/menggunakan kembali desktop Crabbox, membuka browser yang terlihat, merekam tangkapan layar + video.                                               |
| `slack-desktop-smoke`           | Menyewa/menggunakan kembali desktop Crabbox, menjalankan QA Slack di dalamnya, membuka Slack Web, merekam bukti.                                           |
| `telegram-desktop-builder`      | Menyewa/menggunakan kembali desktop Crabbox, menginstal Telegram Desktop, dan secara opsional mengonfigurasi Gateway OpenClaw.                             |
| `visual-task` / `visual-driver` | Perekaman desktop Crabbox generik dengan pernyataan pemahaman gambar opsional; `visual-driver` adalah bagian driver yang dijalankan di bawah `crabbox record --while`. |

Setiap perintah menerima `--repo-root <path>` dan `--output-dir <path>`; perintah Crabbox
juga menerima `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl`, dan `--keep-lease`. Nilai default CLI lokal
untuk penyedia/kelas adalah `hetzner`/`beast` kecuali dinyatakan lain; alur kerja CI
biasanya mengganti keduanya.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Memanggil API REST Discord (`https://discord.com/api/v10`) untuk mengambil pengguna
bot, guild, kanal milik guild, dan kanal target, memastikan bahwa
kanal tersebut termasuk dalam guild, lalu (kecuali `--skip-post`) memposting pesan dan
menambahkan reaksi `👀`. Menulis `mantis-discord-smoke-summary.json` dan
`mantis-discord-smoke-report.md`.

Urutan resolusi token: nilai `--token-file`, lalu `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(ganti dengan `--token-env`), lalu berkas yang dinamai oleh `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(ganti dengan `--token-file-env`). ID guild/kanal berasal dari
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (ganti dengan
`--guild-id` / `--channel-id`) dan harus berupa snowflake Discord 17-20 digit. Atur
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` untuk mengganti ID dan nama bot/guild/kanal/pesan
dengan `<redacted>` dalam ringkasan dan laporan yang diterbitkan.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` saat ini hanya menerima `discord`. `--scenario` adalah salah satu dari dua
ID bawaan, masing-masing dengan ref baseline default dan label sebelum/sesudah
yang diharapkan (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Skenario                                   | Baseline default                           | Yang diharapkan dari baseline             | Yang diharapkan dari kandidat |
| ------------------------------------------ | ------------------------------------------ | ----------------------------------------- | ----------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | balasan utas tidak menyertakan lampiran `filePath` | balasan utas menyertakannya   |

`--candidate` secara default bernilai `HEAD`. Flag lainnya: `--credential-source`
(default `convex`), `--credential-role` (default `ci`), `--provider-mode`
(default `live-frontier`), `--fast` (aktif secara default), `--skip-install`, `--skip-build`.

Runner membuat checkout `git worktree` terpisah untuk baseline dan
kandidat di bawah `<output-dir>/worktrees/`, menjalankan `pnpm install`/`pnpm build` di
masing-masing (kecuali dilewati), lalu menjalankan
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
terhadap setiap worktree. Setiap lane menulis `discord-qa-reaction-timelines.json`
beserta pasangan `<scenario-id>-timeline.html`/`.png`; runner menyalin
kembali bukti ini di bawah `baseline/`/`candidate/`, menulis `comparison.json`,
`mantis-report.md`, dan `mantis-evidence.json` dalam direktori output, serta
keluar dengan kode bukan nol jika perbandingan tidak lulus (baseline `fail` dan kandidat
`pass`).

Skenario Discord kedua (`discord-thread-reply-filepath-attachment`) memposting
pesan induk dengan bot driver, membuat utas nyata, memanggil tindakan
`message.thread-reply` milik SUT dengan `filePath` lokal-repo, lalu melakukan polling pada
utas untuk balasan dan nama berkas lampiran. Skenario ini mengharapkan lampiran
bernama `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Menyewa atau menggunakan kembali desktop Crabbox, meluncurkan browser di dalam sesi VNC
yang diarahkan ke `--browser-url` (default `https://openclaw.ai`) atau
`--html-file` yang dirender, menunggu, mengambil tangkapan layar dengan `scrot`, secara opsional merekam MP4 dengan
`ffmpeg`, dan melakukan rsync terhadap `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
kembali ke `--output-dir`.

Flag:

- `--lease-id <cbx_...>` menggunakan kembali desktop yang telah dipanaskan alih-alih membuat yang baru.
- `--browser-profile-dir <remote-path>` menggunakan kembali direktori data pengguna Chrome jarak jauh agar desktop persisten tetap masuk di antara proses eksekusi (digunakan untuk profil penampil Discord Web berumur panjang).
- `--browser-profile-archive-env <name>` memulihkan arsip profil Chrome `.tgz` base64 dari variabel lingkungan tersebut sebelum peluncuran (default `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); digunakan untuk saksi yang telah masuk seperti Discord Web.
- `--video-duration <seconds>` mengontrol durasi perekaman MP4 (default 10 detik).
- `--keep-lease` (atau `OPENCLAW_MANTIS_KEEP_VM=1`) mempertahankan sewa yang dibuat oleh proses eksekusi ini agar tetap terbuka untuk pemeriksaan VNC; proses eksekusi gagal yang membuat sewa juga mempertahankannya secara default.

Untuk bukti Discord Web, Mantis menggunakan akun penampil khusus, bukan token
bot. Oracle REST Discord (melalui `qa discord`) tetap menjadi sumber otoritatif; ketika
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` diatur, skenario juga menulis
artefak URL Discord Web, dan `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` membiarkan
utas terbuka cukup lama agar browser dapat membukanya.

Alur kerja GitHub mengutamakan profil penampil persisten melalui
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (arsip profil lengkap dapat melampaui
batas ukuran rahasia GitHub); untuk profil kecil/bootstrap, alur kerja dapat memulihkan
`.tgz` base64 dari `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` sebagai gantinya. Jika
tidak ada sumber yang dikonfigurasi, alur kerja tetap menerbitkan tangkapan layar baseline/kandidat
yang deterministik dan mencatat bahwa saksi yang telah masuk
dilewati.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Menyewa atau menggunakan kembali desktop Crabbox, menyinkronkan checkout ke VM, menjalankan
`pnpm openclaw qa slack` di dalamnya, membuka Slack Web di browser VNC,
merekam desktop, dan menyalin artefak QA Slack (`slack-qa/`) serta
tangkapan layar/video VNC kembali ke lokal. Ini adalah satu-satunya bentuk Mantis tempat
Gateway SUT dan browser berjalan di dalam VM yang sama.

Dengan `--gateway-setup`, perintah membuat home OpenClaw sekali pakai yang persisten
di `$HOME/.openclaw-mantis/slack-openclaw` dalam VM, menambal konfigurasi
Socket Mode Slack untuk kanal target, memulai
`openclaw gateway run --dev --allow-unconfigured --port 38973`, dan membiarkan
Chrome tetap berjalan dalam sesi VNC; menghilangkan `--gateway-setup` akan menjalankan lane
QA Slack bot-ke-bot normal sebagai gantinya.

Variabel lingkungan yang diperlukan untuk `--credential-source env` (default lokal adalah `env`; default peran
adalah `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` untuk lane model jarak jauh (jika hanya `OPENAI_API_KEY`
  yang diatur secara lokal, Mantis menyalinnya ke `OPENCLAW_LIVE_OPENAI_KEY` sebelum
  memanggil Crabbox)

Dengan `--credential-source convex`, Mantis menyewa kredensial SUT Slack dari
pool bersama sebelum membuat VM dan meneruskan ID kanal, token aplikasi, serta
token bot ke dalam VM sebagai variabel lingkungan `OPENCLAW_MANTIS_SLACK_*`, sehingga alur kerja GitHub
hanya memerlukan rahasia broker Convex, bukan token mentah Slack.

Flag lainnya: `--slack-url <url>` membuka URL tertentu (jika tidak, Mantis memperoleh
`https://app.slack.com/client/<team>/<channel>` dari `auth.test`);
`--slack-channel-id <id>` mengatur kanal daftar izin Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` mengontrol profil Chrome persisten
di dalam VM (default `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` menjalankan skenario persetujuan native Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) dan merender
tangkapan layar checkpoint tertunda/terselesaikan alih-alih penyiapan Gateway (saling
eksklusif dengan `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model`, dan `--fast` diteruskan ke
lane langsung Slack.

Tangkapan layar checkpoint persetujuan dirender dari pesan API Slack yang
diamati skenario, bukan UI Slack langsung; `slack-desktop-smoke.png` hanya merupakan
bukti Slack Web itu sendiri jika profil browser sewa tersebut sudah masuk.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Menyewa atau menggunakan kembali desktop Crabbox, menginstal Telegram Desktop Linux native,
secara opsional memulihkan arsip sesi pengguna, mengonfigurasi OpenClaw dengan
token bot SUT Telegram yang disewa, memulai
`openclaw gateway run --dev --allow-unconfigured --port 38974`, memposting
pesan kesiapan bot driver ke grup privat yang disewa, lalu merekam
tangkapan layar dan MP4. Token bot hanya mengonfigurasi OpenClaw; token tersebut tidak pernah memasukkan
Telegram Desktop. Penampil desktop adalah sesi pengguna Telegram terpisah
yang dipulihkan dari `--telegram-profile-archive-env <name>` atau dimasuki secara manual
melalui VNC dan dipertahankan tetap aktif dengan `--keep-lease`.

Flag: `--lease-id <cbx_...>` menjalankan ulang terhadap VM yang sudah masuk ke
Telegram Desktop; `--telegram-profile-archive-env <name>` memulihkan arsip profil
`.tgz` base64 sebelum peluncuran; `--telegram-profile-dir <remote-path>`
mengatur direktori profil jarak jauh (default `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` hanya menginstal dan membuka Telegram Desktop;
`--credential-source`/`--credential-role` secara default bernilai `convex`/`maintainer`.

## Manifes bukti

Setiap skenario yang dipublikasikan ke PR menulis `mantis-evidence.json` di samping
laporannya:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "QA Reaksi Status Discord Mantis",
  "summary": "Ringkasan teratas yang dapat dibaca manusia untuk komentar PR.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "hanya antre" },
    "candidate": { "sha": "...", "status": "pass", "expected": "antre -> berpikir -> selesai" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline hanya antre",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Linimasa Discord baseline",
      "width": 420
    }
  ]
}
```

`path` artefak bersifat relatif terhadap direktori manifes; `targetPath`
bersifat relatif terhadap prefiks artefak R2/S3 yang dikonfigurasi. `scripts/mantis/publish-pr-evidence.mjs`
menolak traversal jalur dan melewati entri dengan `"required": false` ketika
berkas tidak ada.

Jenis artefak: `timeline` (tangkapan layar sebelum/sesudah yang deterministik),
`desktopScreenshot` (tangkapan layar VNC/peramban), `motionPreview` (GIF animasi sebaris
dari rekaman), `motionClip` (MP4 yang dipangkas berdasarkan gerakan), `fullVideo` (rekaman
lengkap), `metadata` (sidecar JSON/log), `report` (laporan Markdown).

Tata letak artefak suatu eksekusi pada disk:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Tangkapan layar merupakan bukti, bukan rahasia, tetapi tetap memerlukan disiplin penyuntingan:
nama kanal privat, nama pengguna, atau isi pesan mungkin muncul. Tetapkan
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` untuk pengunggahan artefak publik; ini
diaktifkan secara default dalam alur kerja GitHub Discord/Slack/Telegram.

## Otomatisasi GitHub

`scripts/mantis/publish-pr-evidence.mjs` adalah penerbit yang dapat digunakan kembali. Alur kerja
memanggilnya dengan manifes, PR target, akar target artefak, penanda komentar,
URL artefak, URL eksekusi, dan sumber permintaan. Alur kerja ini mengunggah artefak yang dideklarasikan ke
bucket R2 Mantis, membuat komentar PR yang mendahulukan ringkasan dengan
gambar/pratinjau sebaris dan video tertaut, lalu memperbarui komentar penanda yang ada atau
membuat yang baru. Variabel lingkungan yang diperlukan:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (alur kerja menetapkan `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (alur kerja menetapkan `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (alur kerja menetapkan `https://artifacts.openclaw.ai`)

Komentar dikirim melalui Aplikasi GitHub Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), bukan `github-actions[bot]`, menggunakan komentar
penanda tersembunyi sebagai kunci upsert.

| Alur kerja                        | Pemicu                                                                                     | Yang dilakukan                                                                                                                                                                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | pengiriman manual                                                                           | Menjalankan `discord-smoke` terhadap ref yang dipilih.                                                                                                                                                                                                                                                            |
| `Mantis Discord Status Reactions` | komentar PR atau pengiriman manual                                                         | Membuat worktree baseline/kandidat terpisah, menjalankan `discord-status-reactions-tool-only` pada masing-masing, merender linimasa setiap jalur di peramban desktop Crabbox, menghasilkan pratinjau GIF/MP4 yang dipangkas berdasarkan gerakan dengan `crabbox media preview`, mengunggah artefak, dan mengirim bukti PR sebaris.                  |
| `Mantis Scenario`                 | pengiriman manual                                                                           | Dispatcher generik: menerima `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number`, dan meneruskannya ke alur kerja skenario yang sesuai. |
| `Mantis Slack Desktop Smoke`      | pengiriman manual                                                                           | Menyewa desktop Linux Crabbox (default ke `aws`, dengan pilihan `hetzner`), menjalankan `slack-desktop-smoke --gateway-setup` terhadap kandidat, merekam desktop, menghasilkan pratinjau gerakan, mengunggah artefak, dan mengirim bukti PR jika nomor PR diberikan.                                                    |
| `Mantis Telegram Live`            | komentar PR atau pengiriman manual                                                         | Menjalankan jalur QA langsung Telegram API bot (`openclaw qa telegram`), menulis `mantis-evidence.json` dari ringkasan QA, merender HTML bukti yang telah disunting melalui peramban desktop Crabbox, menghasilkan GIF gerakan, dan mengirim bukti PR. Login Telegram Web tidak diperlukan untuk jalur ini.                       |
| `Mantis Telegram Desktop Proof`   | label PR pengelola (`mantis: telegram-visible-proof`) ditambah komentar PR, atau pengiriman manual | Bukti sebelum/sesudah Telegram Desktop native yang bersifat agentik. Menyerahkan PR, ref baseline/kandidat, dan instruksi pengelola kepada Codex, yang menjalankan jalur bukti Telegram Desktop Crabbox pengguna nyata untuk kedua ref dan mengirim tabel bukti PR 2 kolom.                                            |
| `Mantis Web UI Chat Proof`        | komentar PR atau pengiriman manual                                                         | Menjalankan bukti Playwright obrolan OpenClaw Control UI terfokus terhadap kandidat, memverifikasi bahwa peramban mengirim melalui Gateway tiruan, mengambil artefak tangkapan layar/video, dan mengirim bukti PR. Jalur ini hanya membuktikan obrolan web, bukan WinUI/aplikasi native atau bukti visual sembarang.       |

`Mantis Discord Status Reactions` dan `Mantis Telegram Live` keduanya menerima
`baseline_ref`/`candidate_ref` (atau `baseline=`/`candidate=` dalam komentar PR)
dan memvalidasi bahwa SHA yang dihasilkan merupakan leluhur dari `origin/main`, sebuah
tag rilis (`v*`), atau head dari PR terbuka sebelum dijalankan dengan
kredensial yang mengandung rahasia.

Pemicu komentar, dari PR dengan akses tulis/pengelolaan/admin:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Pemicu komentar Telegram menggunakan SHA head PR sebagai kandidat dan
`telegram-status-command` sebagai skenario secara default; pemicu ini menerima `provider=aws|hetzner` dan
`lease=<cbx_...>` untuk menargetkan penyedia Crabbox tertentu atau desktop yang telah
dipanaskan sebelumnya. `Mantis Telegram Desktop Proof` hanya merespons komentar PR ketika
PR tersebut sudah memiliki label `mantis: telegram-visible-proof`.

Pemicu komentar obrolan Web UI menggunakan SHA head PR sebagai kandidat secara default. Pemicu tersebut menjalankan
bukti obrolan Control UI dengan Gateway tiruan dan memublikasikan artefak peramban; gunakan
bukti Playwright/peramban normal, tangkapan layar pengelola, Crabbox, atau artefak
lokal untuk halaman web lain dan permukaan aplikasi native.

ClawSweeper juga dapat mengirim skenario secara langsung:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Mesin dan rahasia

Default CLI Crabbox lokal adalah `--provider hetzner --class beast`; timpa
dengan `--provider`, `--class`/`--machine-class`, atau
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Alur kerja
GitHub umumnya menimpa keduanya (misalnya `--class standard`, dan input pilihan
penyedia `aws`/`hetzner` milik alur kerja Slack). Jika penyedia terlalu
lambat atau tidak tersedia, tambahkan penyedia tersebut di balik antarmuka Crabbox yang sama alih-alih
mengodekan fallback secara langsung.

Baseline VM: Linux dengan Chrome/Chromium yang mendukung desktop, akses CDP, VNC/
noVNC, Node 22.22.3+, 24.15+, atau 25.9+ dan pnpm, checkout OpenClaw, serta
akses keluar ke transport target, GitHub, penyedia model, dan
broker kredensial.

Nama kredensial dan lingkungan yang digunakan pada perintah serta alur kerja Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `qa mantis run --credential-source env` lokal juga memerlukan
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`,
  dan `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`. Alur kerja GitHub biasanya menggunakan
  `--credential-source convex` dan kredensial broker di bawah ini sebagai pengganti token
  bot Discord mentah.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` untuk pengunggahan artefak publik
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (atau `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`
  khusus bukti Telegram Desktop)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (alur kerja juga menerima
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` sebagai fallback dan memetakannya
  ke nama biasa sebelum memanggil Crabbox)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Runner Mantis tidak boleh mencetak token bot Discord/Slack/Telegram,
kunci API penyedia, cookie peramban, isi profil autentikasi, kata sandi VNC, atau
payload kredensial mentah. Jika token bocor ke dalam isu, PR, obrolan, atau log,
rotasi token tersebut setelah rahasia pengganti disimpan.

## Hasil eksekusi

Skenario transport sebelum/sesudah membedakan hasil berikut agar lingkungan
yang tidak stabil tidak dianggap sebagai regresi produk:

- **Bug berhasil direproduksi**: baseline gagal dengan cara yang diharapkan skenario.
- **Kegagalan harness**: penyiapan lingkungan, kredensial, API transport, peramban,
  atau penyedia gagal sebelum oracle dapat memberikan hasil yang bermakna.

Bukti peramban khusus kandidat melaporkan apakah kandidat lolos Gateway tiruan
dan asersi UI yang terlihat; bukti ini tidak mengklaim reproduksi baseline.

## Menambahkan skenario

Skenario transport langsung didefinisikan dengan TypeScript per transport (lihat
`MANTIS_SCENARIO_CONFIGS` dalam `extensions/qa-lab/src/mantis/run.runtime.ts` untuk
bentuk sebelum/sesudah Discord), bukan format berkas deklaratif mandiri.
Setiap skenario memerlukan: id dan judul, transport, kredensial yang diperlukan, kebijakan
ref baseline, kebijakan ref kandidat, patch konfigurasi OpenClaw, langkah penyiapan/stimulus,
oracle baseline dan kandidat yang diharapkan, target pengambilan visual, anggaran
batas waktu, dan langkah pembersihan.

Bukti peramban terfokus khusus kandidat dapat menggunakan pengujian E2E deterministik
dan alur kerja khusus. Pertahankan cakupannya secara eksplisit, validasi ref kandidat sebelum
eksekusi, isolasikan penerbitan yang didukung rahasia, dan keluarkan kontrak manifes
bukti yang sama.

Utamakan oracle kecil dan bertipe daripada pemeriksaan visual: status reaksi Discord atau
referensi pesan, status API `ts`/reaksi utas Slack, id pesan
dan header email. Gunakan tangkapan layar peramban ketika UI merupakan satu-satunya hal yang dapat diamati secara andal,
dan jadikan pemeriksaan visual sebagai tambahan terhadap oracle API platform jika tersedia.

Setelah Discord, Slack, dan Telegram, bentuk runner yang sama dapat diperluas ke WhatsApp
(login QR, identifikasi ulang, pengiriman, media, reaksi) dan Matrix
(ruang terenkripsi, relasi utas/balasan, melanjutkan setelah mulai ulang); keduanya belum
diimplementasikan.

## Pertanyaan terbuka

- Bot Discord mana yang harus menjadi driver dan mana yang menjadi SUT ketika bot Mantis yang sudah ada digunakan kembali?
- Berapa lama GitHub harus menyimpan artefak Mantis untuk PR?
- Kapan ClawSweeper harus secara otomatis merekomendasikan skenario Mantis alih-alih menunggu perintah pengelola?
- Haruskah tangkapan layar disamarkan atau dipotong sebelum diunggah untuk PR publik?
