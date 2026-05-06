---
read_when:
    - Membangun atau menjalankan QA visual langsung untuk bug OpenClaw
    - Menambahkan verifikasi sebelum dan sesudah untuk permintaan penggabungan
    - Menambahkan skenario transport langsung Discord, Slack, WhatsApp, atau lainnya
    - Mendiagnosis eksekusi QA yang memerlukan tangkapan layar, otomatisasi peramban, atau akses VNC
summary: Mantis adalah sistem verifikasi visual end-to-end untuk mereproduksi bug OpenClaw pada transport langsung, menangkap bukti sebelum dan sesudah, serta melampirkan artefak ke permintaan tarik.
title: Belalang sembah
x-i18n:
    generated_at: "2026-05-06T09:07:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis adalah sistem verifikasi end-to-end OpenClaw untuk bug yang membutuhkan runtime nyata, transport nyata, dan bukti yang terlihat. Sistem ini menjalankan skenario terhadap ref buruk yang diketahui, menangkap bukti, menjalankan skenario yang sama terhadap ref kandidat, lalu menerbitkan perbandingannya sebagai artefak yang dapat diperiksa maintainer dari PR atau dari perintah lokal.

Mantis dimulai dengan Discord karena Discord memberi kita lane pertama bernilai tinggi: autentikasi bot nyata, channel guild nyata, reaksi, thread, perintah native, dan antarmuka browser tempat manusia dapat mengonfirmasi secara visual apa yang ditampilkan transport.

## Tujuan

- Mereproduksi bug dari issue atau PR GitHub dengan bentuk transport yang sama seperti yang dilihat pengguna.
- Menangkap artefak **sebelum** pada ref baseline sebelum menerapkan perbaikan.
- Menangkap artefak **sesudah** pada ref kandidat setelah menerapkan perbaikan.
- Menggunakan oracle deterministik kapan pun memungkinkan, seperti pembacaan reaksi Discord REST atau pemeriksaan transkrip channel.
- Menangkap screenshot ketika bug memiliki permukaan UI yang terlihat.
- Berjalan secara lokal dari CLI yang dikendalikan agent dan secara remote dari GitHub.
- Mempertahankan state mesin yang cukup untuk penyelamatan VNC ketika login, otomasi browser, atau autentikasi provider macet.
- Memposting status ringkas ke channel operator Discord ketika proses terblokir, membutuhkan bantuan VNC manual, atau selesai.

## Bukan tujuan

- Mantis bukan pengganti test unit. Sebuah run Mantis biasanya harus menjadi test regresi yang lebih kecil setelah perbaikannya dipahami.
- Mantis bukan gate CI cepat yang normal. Ini lebih lambat, menggunakan kredensial live, dan dicadangkan untuk bug ketika lingkungan live penting.
- Mantis seharusnya tidak membutuhkan manusia untuk operasi normal. VNC manual adalah jalur penyelamatan, bukan jalur utama.
- Mantis tidak menyimpan secret mentah di artefak, log, screenshot, laporan Markdown, atau komentar PR.

## Kepemilikan

Mantis berada di stack QA OpenClaw.

- OpenClaw memiliki runtime skenario, adapter transport, skema bukti, dan CLI lokal di bawah `pnpm openclaw qa mantis`.
- QA Lab memiliki bagian harness transport live, helper tangkapan browser, dan penulis artefak.
- Crabbox memiliki mesin Linux yang sudah dipanaskan ketika VM remote dibutuhkan.
- GitHub Actions memiliki entrypoint workflow remote dan retensi artefak.
- ClawSweeper memiliki routing komentar GitHub: mengurai perintah maintainer, mendispatch workflow, dan memposting komentar PR final.
- Agent OpenClaw menggerakkan Mantis melalui Codex ketika skenario membutuhkan penyiapan agentic, debugging, atau pelaporan state macet.

Batas ini menjaga pengetahuan transport tetap di OpenClaw, penjadwalan mesin di Crabbox, dan perekat workflow maintainer di ClawSweeper.

## Bentuk perintah

Perintah lokal pertama memverifikasi bot Discord, guild, channel, pengiriman pesan, pengiriman reaksi, dan path artefak:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Runner lokal sebelum dan sesudah menerima bentuk ini:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner membuat worktree baseline dan kandidat yang terlepas di bawah direktori output, menginstal dependensi, membuild setiap ref, menjalankan skenario dengan `--allow-failures`, lalu menulis `baseline/`, `candidate/`, `comparison.json`, dan `mantis-report.md`. Untuk skenario Discord pertama, verifikasi yang berhasil berarti status baseline adalah `fail` dan status kandidat adalah `pass`.

Probe Discord sebelum/sesudah kedua menargetkan attachment thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Skenario itu memposting pesan induk dengan bot driver, membuat thread Discord nyata, memanggil aksi `message.thread-reply` OpenClaw dengan `filePath` repo-lokal, lalu melakukan polling thread untuk balasan SUT dan nama file attachment. Screenshot baseline menampilkan balasan tanpa attachment; screenshot kandidat menampilkan attachment `mantis-thread-report.md` yang diharapkan.

Primitif VM/browser pertama adalah smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Perintah ini menyewa atau menggunakan ulang mesin desktop Crabbox, memulai browser yang terlihat di dalam sesi VNC, menangkap desktop, menarik artefak kembali ke direktori output lokal, dan menulis perintah reconnect ke dalam laporan. Perintah ini default ke provider Hetzner karena itu adalah provider pertama dengan cakupan desktop/VNC yang berfungsi di lane Mantis. Override dengan `--provider`, `--crabbox-bin`, atau `OPENCLAW_MANTIS_CRABBOX_PROVIDER` ketika menjalankan terhadap fleet Crabbox lain.

Flag smoke desktop yang berguna:

- `--lease-id <cbx_...>` atau `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` menggunakan ulang desktop yang sudah dipanaskan.
- `--browser-url <url>` mengubah halaman yang dibuka di browser yang terlihat.
- `--html-file <path>` merender artefak HTML repo-lokal di browser yang terlihat. Mantis menggunakan ini untuk menangkap timeline status-reaksi Discord yang dihasilkan melalui desktop Crabbox nyata.
- `--browser-profile-dir <remote-path>` menggunakan ulang Chrome user-data-dir remote sehingga desktop Mantis persisten dapat tetap login antar-run. Gunakan ini untuk profil viewer Discord Web yang berumur panjang.
- `--browser-profile-archive-env <name>` memulihkan arsip Chrome user-data-dir `.tgz` base64 dari variabel lingkungan bernama sebelum meluncurkan browser. Gunakan ini untuk saksi yang sudah login seperti Discord Web. Env var default adalah `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` mengontrol panjang tangkapan MP4. Gunakan durasi yang lebih panjang untuk aplikasi web yang sudah login dan lambat yang membutuhkan waktu untuk stabil.
- `--keep-lease` atau `OPENCLAW_MANTIS_KEEP_VM=1` menjaga lease baru yang berhasil tetap terbuka untuk inspeksi VNC. Run yang gagal mempertahankan lease secara default ketika satu lease dibuat agar operator dapat reconnect.
- `--class`, `--idle-timeout`, dan `--ttl` menyesuaikan ukuran mesin dan masa hidup lease.

Untuk bukti Discord Web, Mantis menggunakan akun viewer khusus alih-alih token bot. Skenario Discord API live tetap menjadi oracle: skenario itu membuat thread nyata, mengirim `thread-reply` SUT, dan memeriksa attachment melalui Discord REST. Ketika `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` disetel, skenario juga menulis artefak URL Discord Web. Ketika `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` disetel, skenario membiarkan thread itu tersedia cukup lama agar browser yang sudah login dapat membukanya dan merekamnya.

Workflow GitHub membuka URL thread kandidat di Discord Web, menangkap screenshot, merekam MP4, dan membuat preview GIF yang dipangkas ketika tooling media Crabbox tersedia. Utamakan path profil viewer persisten yang dikonfigurasi melalui `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, karena arsip profil Chrome penuh dapat melampaui batas ukuran secret GitHub. Untuk profil kecil/bootstrap, workflow juga dapat memulihkan arsip `.tgz` base64 dari `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Jika tidak ada sumber profil yang dikonfigurasi, workflow tetap menerbitkan screenshot attachment baseline/kandidat yang deterministik dan mencatat pemberitahuan bahwa saksi Discord Web yang sudah login dilewati.

Primitif transport desktop penuh pertama adalah smoke desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Perintah ini menyewa atau menggunakan ulang mesin desktop Crabbox, menyinkronkan checkout saat ini ke VM, menjalankan `pnpm openclaw qa slack` di dalam VM tersebut, membuka Slack Web di browser VNC, menangkap desktop yang terlihat, dan menyalin artefak QA Slack serta screenshot VNC kembali ke direktori output lokal. Ini adalah bentuk Mantis pertama ketika Gateway OpenClaw SUT dan browser sama-sama hidup di dalam VM desktop Linux yang sama.

Dengan `--gateway-setup`, perintah menyiapkan home OpenClaw disposable persisten di `$HOME/.openclaw-mantis/slack-openclaw`, mem-patch konfigurasi Slack Socket Mode untuk channel yang dipilih, memulai `openclaw gateway run` pada port `38973`, dan menjaga Chrome tetap berjalan di sesi VNC. Ini adalah mode "tinggalkan desktop Linux dengan Slack dan claw yang berjalan"; lane QA Slack bot-ke-bot tetap menjadi default ketika `--gateway-setup` dihilangkan.

Input wajib untuk `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` untuk lane model remote. Jika hanya `OPENAI_API_KEY` yang disetel secara lokal, Mantis memetakannya ke `OPENCLAW_LIVE_OPENAI_KEY` sebelum memanggil Crabbox sehingga penerusan env `OPENCLAW_*` Crabbox dapat membawanya ke dalam VM.

Dengan `--gateway-setup --credential-source convex`, Mantis menyewa kredensial SUT Slack dari pool bersama sebelum membuat VM dan meneruskan id channel, token app Socket Mode, dan token bot yang disewa sebagai env runtime `OPENCLAW_MANTIS_SLACK_*` di dalam desktop. Itu menjaga workflow GitHub tetap tipis: workflow hanya membutuhkan secret broker Convex, bukan token bot atau app Slack mentah.

Flag desktop Slack yang berguna:

- `--lease-id <cbx_...>` menjalankan ulang terhadap mesin tempat operator sudah login ke Slack Web melalui VNC.
- `--gateway-setup` memulai Gateway Slack OpenClaw persisten di VM alih-alih hanya menjalankan lane QA bot-ke-bot.
- `--keep-lease` menjaga VM Gateway tetap terbuka untuk inspeksi VNC setelah berhasil; `--no-keep-lease` menghentikannya setelah mengumpulkan artefak.
- `--slack-url <url>` membuka URL Slack Web tertentu. Tanpanya, Mantis menurunkan `https://app.slack.com/client/<team>/<channel>` dari `auth.test` Slack ketika token bot SUT tersedia.
- `--slack-channel-id <id>` mengontrol allowlist channel Slack yang digunakan oleh penyiapan Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` mengontrol profil Chrome persisten di dalam VM. Default-nya adalah `$HOME/.config/openclaw-mantis/slack-chrome-profile`, sehingga login Slack Web manual bertahan pada rerun di lease yang sama.
- `--credential-source convex --credential-role ci` menggunakan pool kredensial bersama alih-alih token env Slack langsung.
- `--provider-mode`, `--model`, `--alt-model`, dan `--fast` diteruskan ke lane live Slack.

Workflow smoke GitHub adalah `Mantis Discord Smoke`. Workflow GitHub sebelum dan sesudah untuk skenario nyata pertama adalah `Mantis Discord Status Reactions`. Workflow ini menerima:

- `baseline_ref`: ref yang diharapkan mereproduksi perilaku hanya queued.
- `candidate_ref`: ref yang diharapkan menampilkan `queued -> thinking -> done`.

Workflow ini melakukan checkout ref harness workflow, membuild worktree baseline dan kandidat terpisah, menjalankan `discord-status-reactions-tool-only` terhadap setiap worktree, dan mengunggah `baseline/`, `candidate/`, `comparison.json`, dan `mantis-report.md` sebagai artefak Actions. Workflow ini juga merender HTML timeline setiap lane di browser desktop Crabbox dan menerbitkan screenshot VNC tersebut di samping PNG timeline deterministik dalam komentar PR. Komentar PR yang sama menyematkan preview GIF ringan yang dipangkas berdasarkan gerakan yang dibuat oleh `crabbox media preview`, menautkan ke klip MP4 yang dipangkas berdasarkan gerakan yang cocok, dan menyimpan file MP4 desktop penuh untuk inspeksi mendalam. Screenshot tetap inline untuk review cepat. Workflow membuild CLI Crabbox dari main `openclaw/crabbox` agar dapat menggunakan flag lease desktop/browser saat ini sebelum rilis binary Crabbox berikutnya dibuat.

`Mantis Scenario` adalah entrypoint manual generik. Ini menerima `scenario_id`, `candidate_ref`, `baseline_ref` opsional, dan `pr_number` opsional, lalu mendispatch workflow milik skenario. Wrapper ini sengaja tipis: workflow skenario tetap memiliki penyiapan transport, kredensial, kelas VM, oracle yang diharapkan, dan manifes artefaknya sendiri.

`Mantis Slack Desktop Smoke` adalah workflow VM Slack pertama. Workflow ini melakukan checkout
ref kandidat tepercaya di worktree terpisah, menyewa desktop Linux Crabbox,
menjalankan `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` terhadap
kandidat tersebut, membuka Slack Web di browser VNC, merekam desktop, menghasilkan
pratinjau yang dipangkas berdasarkan gerakan dengan `crabbox media preview`, mengunggah direktori
artefak lengkap, dan secara opsional memposting komentar bukti inline pada PR target.
Default-nya menggunakan AWS untuk sewa desktop dan menyediakan input provider manual agar
operator dapat beralih ke Hetzner saat kapasitas AWS lambat atau tidak tersedia. Gunakan
lane ini saat Anda menginginkan "desktop Linux dengan Slack dan claw yang berjalan" alih-alih
hanya transkrip Slack bot-ke-bot.

Setiap skenario penerbitan PR menulis `mantis-evidence.json` di samping laporannya.
Skema ini adalah serah terima antara kode skenario dan komentar GitHub:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Nilai `path` artefak relatif terhadap direktori manifes. Nilai `targetPath`
adalah path relatif di bawah direktori publikasi branch `qa-artifacts`.
Publisher menolak path traversal dan melewati entri yang ditandai
`"required": false` saat pratinjau atau video opsional tidak tersedia.

Jenis artefak yang didukung:

- `timeline`: screenshot skenario deterministik, biasanya sebelum/sesudah.
- `desktopScreenshot`: screenshot desktop VNC/browser.
- `motionPreview`: GIF animasi inline yang dihasilkan dari rekaman desktop.
- `motionClip`: MP4 yang dipangkas berdasarkan gerakan yang menghapus awal dan akhir statis.
- `fullVideo`: rekaman MP4 lengkap untuk inspeksi mendalam.
- `metadata`: sidecar JSON/log.
- `report`: laporan Markdown.

Publisher yang dapat digunakan ulang adalah `scripts/mantis/publish-pr-evidence.mjs`. Workflow
memanggilnya dengan manifes, PR target, root target `qa-artifacts`, penanda komentar,
URL artefak Actions, URL run, dan sumber permintaan. Publisher menyalin artefak yang dideklarasikan
ke branch `qa-artifacts`, membangun komentar PR yang mengutamakan ringkasan dengan gambar/pratinjau
inline dan video tertaut, lalu memperbarui komentar penanda yang ada atau
membuat yang baru.

Anda juga dapat memicu run status-reactions langsung dari komentar PR:

```text
@Mantis discord status reactions
```

Pemicu komentar sengaja dibuat sempit. Pemicu ini hanya berjalan pada komentar pull request
dari pengguna dengan akses write, maintain, atau admin, dan hanya mengenali
permintaan status-reaction Discord. Secara default, pemicu ini menggunakan ref baseline buruk yang diketahui
dan SHA head PR saat ini sebagai kandidat. Maintainer dapat menimpa salah satu
ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Contoh perintah ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Perintah pertama eksplisit dan berfokus pada skenario. Perintah kedua nantinya dapat memetakan PR
atau issue ke skenario Mantis yang direkomendasikan dari label, file yang berubah, dan
temuan ulasan ClawSweeper.

## Siklus hidup run

1. Dapatkan kredensial.
2. Alokasikan atau gunakan ulang VM.
3. Siapkan profil desktop/browser saat skenario memerlukan bukti UI.
4. Siapkan checkout bersih untuk ref baseline.
5. Pasang dependensi dan build hanya yang dibutuhkan skenario.
6. Mulai child OpenClaw Gateway dengan direktori state terisolasi.
7. Konfigurasikan transport live, provider, model, dan profil browser.
8. Jalankan skenario dan tangkap bukti baseline.
9. Hentikan gateway dan pertahankan log.
10. Siapkan ref kandidat di VM yang sama.
11. Jalankan skenario yang sama dan tangkap bukti kandidat.
12. Bandingkan hasil oracle dan bukti visual.
13. Tulis Markdown, JSON, log, screenshot, dan artefak trace opsional.
14. Unggah artefak GitHub Actions.
15. Posting pesan status PR atau Discord yang ringkas.

Skenario harus dapat gagal dalam dua cara berbeda:

- **Bug direproduksi**: baseline gagal dengan cara yang diharapkan.
- **Kegagalan harness**: penyiapan lingkungan, kredensial, API Discord, browser, atau
  provider gagal sebelum oracle bug bermakna.

Laporan akhir harus memisahkan kasus-kasus ini agar maintainer tidak mencampuradukkan lingkungan
yang flaky dengan perilaku produk.

## MVP Discord

Skenario pertama harus menargetkan reaksi status Discord di channel guild tempat
mode pengiriman balasan sumber adalah `message_tool_only`.

Mengapa ini seed Mantis yang baik:

- Terlihat di Discord sebagai reaksi pada pesan pemicu.
- Memiliki oracle REST yang kuat melalui state reaksi pesan Discord.
- Melatih OpenClaw Gateway nyata, auth bot Discord, pengiriman pesan,
  mode pengiriman balasan sumber, state reaksi status, dan siklus hidup giliran model.
- Cukup sempit untuk menjaga implementasi pertama tetap jujur.

Bentuk skenario yang diharapkan:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Bukti baseline harus menunjukkan reaksi pengakuan antrean tetapi tanpa
transisi siklus hidup dalam mode tool-only. Bukti kandidat harus menunjukkan reaksi status
siklus hidup berjalan saat `messages.statusReactions.enabled` secara eksplisit
true.

Irisan pertama yang dapat dieksekusi adalah skenario QA live Discord opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Skenario ini mengonfigurasi SUT dengan penanganan guild yang selalu aktif, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, dan reaksi status eksplisit. Oracle
melakukan polling pada pesan pemicu Discord nyata dan mengharapkan urutan yang diamati
`👀 -> 🤔 -> 👍`. Artefak mencakup `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`, dan
`discord-status-reactions-tool-only-timeline.png`.

## Bagian QA yang sudah ada

Mantis harus dibangun di atas stack QA privat yang sudah ada alih-alih memulai dari
nol:

- `pnpm openclaw qa discord` sudah menjalankan lane Discord live dengan bot driver dan
  SUT.
- Runner transport live sudah menulis laporan dan artefak observed-message
  di bawah `.artifacts/qa-e2e/`.
- Lease kredensial Convex sudah menyediakan akses eksklusif ke kredensial transport
  live bersama.
- Layanan kontrol browser sudah mendukung screenshot, snapshot,
  profil terkelola headless, dan profil CDP jarak jauh.
- QA Lab sudah memiliki UI debugger dan bus untuk pengujian berbentuk transport.

Implementasi Mantis pertama dapat berupa runner before/after tipis di atas
bagian-bagian ini, ditambah satu lapisan bukti visual.

## Model bukti

Setiap run menulis direktori artefak stabil:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` harus menjadi sumber kebenaran yang dapat dibaca mesin. Laporan
Markdown digunakan untuk komentar PR dan ulasan manusia.

Ringkasan harus mencakup:

- ref dan SHA yang diuji
- transport dan id skenario
- provider mesin dan id mesin atau id lease
- sumber kredensial tanpa nilai rahasia
- hasil baseline
- hasil kandidat
- apakah bug direproduksi pada baseline
- apakah kandidat memperbaikinya
- path artefak
- masalah penyiapan atau pembersihan yang sudah disanitasi

Screenshot adalah bukti, bukan rahasia. Screenshot tetap membutuhkan disiplin redaksi:
nama channel privat, nama pengguna, atau konten pesan dapat muncul. Untuk PR publik,
utamakan tautan artefak GitHub Actions dibanding gambar inline sampai cerita redaksi
lebih kuat.

## Browser dan VNC

Lane browser memiliki dua mode:

- **Otomasi headless**: default untuk CI. Chrome berjalan dengan CDP diaktifkan, dan
  Playwright atau kontrol browser OpenClaw menangkap screenshot.
- **Penyelamatan VNC**: diaktifkan pada VM yang sama saat login, MFA, anti-otomasi Discord,
  atau debugging visual membutuhkan manusia.

Profil browser observer Discord harus cukup persisten untuk menghindari
login pada setiap run, tetapi terisolasi dari state browser pribadi. Sebuah profil
milik pool mesin Mantis, bukan laptop developer.

Saat Mantis macet, Mantis memposting pesan status Discord dengan:

- id run
- id skenario
- provider mesin
- direktori artefak
- instruksi koneksi VNC atau noVNC jika tersedia
- teks blocker singkat

Deployment privat pertama dapat memposting pesan ini ke channel operator yang ada
dan berpindah ke channel Mantis khusus nanti.

## Mesin

Mantis sebaiknya mengutamakan AWS melalui Crabbox untuk implementasi jarak jauh pertama.
Crabbox memberi kita mesin yang sudah dipanaskan, pelacakan lease, hidrasi, log, hasil, dan
pembersihan. Jika kapasitas AWS terlalu lambat atau tidak tersedia, tambahkan provider Hetzner
di balik antarmuka mesin yang sama.

Persyaratan VM minimum:

- Linux dengan instalasi Chrome atau Chromium yang mampu desktop
- Akses CDP untuk otomasi browser
- VNC atau noVNC untuk penyelamatan
- Node 22 dan pnpm
- checkout OpenClaw dan cache dependensi
- cache browser Playwright Chromium saat Playwright digunakan
- CPU dan memori yang cukup untuk satu OpenClaw Gateway, satu browser, dan satu run model
- akses keluar ke Discord, GitHub, provider model, dan broker kredensial

VM tidak boleh menyimpan secret mentah berumur panjang di luar penyimpanan kredensial atau
profil browser yang diharapkan.

## Secret

Secret berada di secret organisasi atau repository GitHub untuk run jarak jauh, dan di
file secret lokal yang dikendalikan operator untuk run lokal.

Nama secret yang direkomendasikan:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` untuk unggahan artefak GitHub publik
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Jangka panjang, pool kredensial Convex harus tetap menjadi sumber normal untuk kredensial transport
live. Secret GitHub mem-bootstrap broker dan lane fallback.
Workflow status-reactions Discord memetakan secret Mantis Crabbox kembali ke
variabel lingkungan `CRABBOX_COORDINATOR` dan `CRABBOX_COORDINATOR_TOKEN`
yang diharapkan oleh CLI Crabbox. Nama secret GitHub `CRABBOX_*` polos tetap
diterima sebagai fallback kompatibilitas.

Runner Mantis tidak boleh pernah mencetak:

- token bot Discord
- kunci API provider
- cookie browser
- konten profil auth
- kata sandi VNC
- payload kredensial mentah

Unggahan artefak publik juga harus meredaksi metadata target Discord seperti id bot,
guild, channel, dan pesan. Workflow smoke GitHub mengaktifkan
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` karena alasan ini.

Jika token tidak sengaja ditempelkan ke issue, PR, chat, atau log, rotasikan token tersebut
setelah secret baru disimpan.

## Artefak GitHub dan komentar PR

Alur kerja Mantis harus mengunggah bundel bukti lengkap sebagai artefak Actions
berumur pendek. Saat alur kerja dijalankan untuk laporan bug atau PR perbaikan,
alur kerja juga harus menerbitkan tangkapan layar PNG yang telah disamarkan ke
branch `qa-artifacts` dan membuat atau memperbarui komentar pada bug atau PR
perbaikan tersebut dengan tangkapan layar sebelum/sesudah sebaris. Jangan
memposting bukti utama hanya pada PR automasi QA generik. Log mentah, pesan yang
diamati, dan bukti besar lainnya tetap berada di artefak Actions.

Alur kerja produksi harus memposting komentar tersebut dengan Mantis GitHub App,
bukan dengan `github-actions[bot]`. Simpan id aplikasi dan kunci privat sebagai
rahasia GitHub Actions `MANTIS_GITHUB_APP_ID` dan
`MANTIS_GITHUB_APP_PRIVATE_KEY`. Alur kerja menggunakan marker tersembunyi
sebagai kunci upsert, memperbarui komentar tersebut saat token dapat
mengeditnya, dan membuat komentar baru milik Mantis saat marker lama milik bot
tidak dapat diedit.

Komentar PR harus singkat dan visual:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Saat run gagal karena harness gagal, komentar harus menyatakan hal itu, bukan
menyiratkan kandidat gagal.

## Catatan deployment privat

Deployment privat mungkin sudah memiliki aplikasi Mantis Discord. Gunakan kembali
aplikasi tersebut alih-alih membuat aplikasi lain saat aplikasi itu memiliki izin
bot yang tepat dan dapat dirotasi dengan aman.

Atur channel notifikasi operator awal melalui rahasia atau konfigurasi
deployment. Channel tersebut dapat mengarah ke channel maintainer atau operasi
yang sudah ada terlebih dahulu, lalu berpindah ke channel khusus Mantis setelah
tersedia.

Jangan menaruh id guild, id channel, token bot, cookie browser, atau kata sandi
VNC dalam dokumen ini. Simpan semuanya di rahasia GitHub, broker kredensial, atau
penyimpanan rahasia lokal operator.

## Menambahkan skenario

Skenario Mantis harus mendeklarasikan:

- id dan judul
- transport
- kredensial yang diperlukan
- kebijakan ref baseline
- kebijakan ref kandidat
- patch konfigurasi OpenClaw
- langkah penyiapan
- stimulus
- oracle baseline yang diharapkan
- oracle kandidat yang diharapkan
- target tangkapan visual
- anggaran timeout
- langkah pembersihan

Skenario sebaiknya mengutamakan oracle kecil dan bertipe:

- Status reaksi Discord untuk bug reaksi
- Referensi pesan Discord untuk bug threading
- ts thread Slack dan status API reaksi untuk bug Slack
- id pesan email dan header untuk bug email
- tangkapan layar browser saat UI adalah satu-satunya hal yang dapat diamati secara andal

Pemeriksaan vision harus bersifat aditif. Jika API platform dapat membuktikan
bug, gunakan API sebagai oracle lulus/gagal dan simpan tangkapan layar untuk
keyakinan manusia.

## Ekspansi penyedia

Setelah Discord, runner yang sama dapat menambahkan:

- Slack: reaksi, thread, mention aplikasi, modal, unggahan file.
- Email: auth Gmail dan threading pesan menggunakan `gog` saat konektor tidak
  cukup.
- WhatsApp: login QR, identifikasi ulang, pengiriman pesan, media, reaksi.
- Telegram: pembatasan mention grup, command, reaksi jika tersedia.
- Matrix: room terenkripsi, relasi thread atau balasan, resume setelah restart.

Setiap transport harus memiliki satu skenario smoke murah dan satu atau beberapa
skenario kelas bug. Skenario visual yang mahal harus tetap opt-in.

## Pertanyaan terbuka

- Bot Discord mana yang harus menjadi driver, dan mana yang harus menjadi SUT,
  saat bot Mantis yang ada digunakan kembali?
- Haruskah login browser observer menggunakan akun Discord manusia, akun uji,
  atau hanya bukti REST yang dapat dibaca bot untuk fase pertama?
- Berapa lama GitHub harus menyimpan artefak Mantis untuk PR?
- Kapan ClawSweeper harus otomatis merekomendasikan Mantis alih-alih menunggu
  command maintainer?
- Haruskah tangkapan layar disamarkan atau dipangkas sebelum diunggah untuk PR publik?
