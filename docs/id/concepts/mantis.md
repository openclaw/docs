---
read_when:
    - Membangun atau menjalankan QA visual langsung untuk bug OpenClaw
    - Menambahkan verifikasi sebelum dan sesudah untuk permintaan tarik
    - Menambahkan skenario transportasi langsung Discord, Slack, WhatsApp, atau lainnya
    - Men-debug proses QA yang memerlukan tangkapan layar, otomatisasi peramban, atau akses VNC
summary: Mantis adalah sistem verifikasi end-to-end visual untuk mereproduksi bug OpenClaw pada transport langsung, mengambil bukti sebelum dan sesudah, serta melampirkan artefak ke PR.
title: Belalang sembah
x-i18n:
    generated_at: "2026-05-05T06:16:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis adalah sistem verifikasi ujung-ke-ujung OpenClaw untuk bug yang membutuhkan
runtime nyata, transport nyata, dan bukti yang terlihat. Sistem ini menjalankan skenario terhadap
ref bermasalah yang diketahui, menangkap bukti, menjalankan skenario yang sama terhadap ref kandidat, dan
menerbitkan perbandingannya sebagai artefak yang dapat diperiksa maintainer dari PR atau
dari perintah lokal.

Mantis dimulai dengan Discord karena Discord memberi kita jalur pertama bernilai tinggi:
autentikasi bot nyata, kanal guild nyata, reaksi, thread, perintah native, dan
UI browser tempat manusia dapat mengonfirmasi secara visual apa yang ditampilkan transport.

## Tujuan

- Mereproduksi bug dari issue atau PR GitHub dengan bentuk transport yang sama seperti yang
  dilihat pengguna.
- Menangkap artefak **sebelum** pada ref baseline sebelum menerapkan perbaikan.
- Menangkap artefak **sesudah** pada ref kandidat setelah menerapkan perbaikan.
- Menggunakan oracle deterministik jika memungkinkan, seperti pembacaan reaksi REST Discord
  atau pemeriksaan transkrip kanal.
- Menangkap tangkapan layar ketika bug memiliki permukaan UI yang terlihat.
- Berjalan secara lokal dari CLI yang dikendalikan agen dan secara jarak jauh dari GitHub.
- Mempertahankan status mesin yang cukup untuk penyelamatan VNC ketika login, otomasi browser, atau
  autentikasi penyedia macet.
- Mengirim status ringkas ke kanal operator Discord ketika proses berjalan terblokir,
  membutuhkan bantuan VNC manual, atau selesai.

## Bukan Tujuan

- Mantis bukan pengganti unit test. Proses berjalan Mantis biasanya harus menjadi
  regression test yang lebih kecil setelah perbaikan dipahami.
- Mantis bukan gerbang CI cepat normal. Ini lebih lambat, menggunakan kredensial live, dan
  disediakan untuk bug ketika lingkungan live penting.
- Mantis seharusnya tidak memerlukan manusia untuk operasi normal. VNC manual adalah jalur
  penyelamatan, bukan jalur utama.
- Mantis tidak menyimpan rahasia mentah dalam artefak, log, tangkapan layar, laporan Markdown,
  atau komentar PR.

## Kepemilikan

Mantis berada di dalam stack QA OpenClaw.

- OpenClaw memiliki runtime skenario, adaptor transport, skema bukti, dan
  CLI lokal di bawah `pnpm openclaw qa mantis`.
- QA Lab memiliki bagian harness transport live, helper tangkapan browser, dan
  penulis artefak.
- Crabbox memiliki mesin Linux yang sudah dihangatkan ketika VM jarak jauh dibutuhkan.
- GitHub Actions memiliki entrypoint workflow jarak jauh dan retensi artefak.
- ClawSweeper memiliki perutean komentar GitHub: mengurai perintah maintainer,
  mengirim workflow, dan memposting komentar PR final.
- Agen OpenClaw menjalankan Mantis melalui Codex ketika skenario membutuhkan penyiapan agentic,
  debugging, atau pelaporan status macet.

Batas ini menjaga pengetahuan transport di OpenClaw, penjadwalan mesin di
Crabbox, dan perekat workflow maintainer di ClawSweeper.

## Bentuk Perintah

Perintah lokal pertama memverifikasi bot Discord, guild, kanal, pengiriman pesan,
pengiriman reaksi, dan jalur artefak:

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

Runner membuat worktree baseline dan kandidat yang terlepas di bawah direktori output,
menginstal dependensi, membangun setiap ref, menjalankan skenario dengan
`--allow-failures`, lalu menulis `baseline/`, `candidate/`, `comparison.json`,
dan `mantis-report.md`. Untuk skenario Discord pertama, verifikasi yang berhasil
berarti status baseline adalah `fail` dan status kandidat adalah `pass`.

Primitif VM/browser pertama adalah smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Perintah ini menyewa atau menggunakan kembali mesin desktop Crabbox, memulai browser yang terlihat di dalam
sesi VNC, menangkap desktop, menarik artefak kembali ke direktori output lokal,
dan menulis perintah koneksi ulang ke dalam laporan. Perintah ini secara default menggunakan
penyedia Hetzner karena ini adalah penyedia pertama dengan cakupan desktop/VNC yang berfungsi
di jalur Mantis. Timpa dengan `--provider`, `--crabbox-bin`, atau
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` saat berjalan terhadap fleet Crabbox lain.

Flag smoke desktop yang berguna:

- `--lease-id <cbx_...>` atau `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` menggunakan kembali desktop yang sudah dihangatkan.
- `--browser-url <url>` mengubah halaman yang dibuka di browser yang terlihat.
- `--html-file <path>` merender artefak HTML lokal repo di browser yang terlihat. Mantis menggunakan ini untuk menangkap timeline reaksi status Discord yang dihasilkan melalui desktop Crabbox nyata.
- `--keep-lease` atau `OPENCLAW_MANTIS_KEEP_VM=1` mempertahankan lease baru yang berhasil tetap terbuka untuk inspeksi VNC. Proses berjalan yang gagal mempertahankan lease secara default ketika lease dibuat agar operator dapat terhubung kembali.
- `--class`, `--idle-timeout`, dan `--ttl` menyesuaikan ukuran mesin dan masa hidup lease.

Primitif transport desktop lengkap pertama adalah smoke desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Perintah ini menyewa atau menggunakan kembali mesin desktop Crabbox, menyinkronkan checkout saat ini ke dalam
VM, menjalankan `pnpm openclaw qa slack` di dalam VM tersebut, membuka Slack Web di browser
VNC, menangkap desktop yang terlihat, dan menyalin artefak QA Slack serta
tangkapan layar VNC kembali ke direktori output lokal. Ini adalah bentuk Mantis pertama
di mana Gateway OpenClaw SUT dan browser sama-sama berada di dalam VM desktop
Linux yang sama.

Dengan `--gateway-setup`, perintah menyiapkan home OpenClaw disposable yang persisten
di `$HOME/.openclaw-mantis/slack-openclaw`, menambal konfigurasi Slack Socket Mode
untuk kanal yang dipilih, memulai `openclaw gateway run` pada port
`38973`, dan menjaga Chrome tetap berjalan dalam sesi VNC. Ini adalah mode "tinggalkan saya
desktop Linux dengan Slack dan claw yang berjalan"; jalur QA Slack bot-ke-bot
tetap menjadi default ketika `--gateway-setup` dihilangkan.

Input wajib untuk `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` untuk jalur model jarak jauh. Jika hanya
  `OPENAI_API_KEY` yang disetel secara lokal, Mantis memetakannya ke `OPENCLAW_LIVE_OPENAI_KEY`
  sebelum memanggil Crabbox agar penerusan env `OPENCLAW_*` Crabbox dapat membawanya
  ke dalam VM.

Flag desktop Slack yang berguna:

- `--lease-id <cbx_...>` menjalankan ulang terhadap mesin tempat operator sudah login ke Slack Web melalui VNC.
- `--gateway-setup` memulai Gateway Slack OpenClaw persisten di VM alih-alih hanya menjalankan jalur QA bot-ke-bot.
- `--slack-url <url>` membuka URL Slack Web tertentu. Tanpanya, Mantis menurunkan `https://app.slack.com/client/<team>/<channel>` dari Slack `auth.test` ketika token bot SUT tersedia.
- `--slack-channel-id <id>` mengontrol allowlist kanal Slack yang digunakan oleh penyiapan Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` mengontrol profil Chrome persisten di dalam VM. Default-nya adalah `$HOME/.config/openclaw-mantis/slack-chrome-profile`, sehingga login Slack Web manual bertahan dari rerun pada lease yang sama.
- `--credential-source convex --credential-role ci` menggunakan pool kredensial bersama alih-alih token env Slack langsung.
- `--provider-mode`, `--model`, `--alt-model`, dan `--fast` diteruskan ke jalur live Slack.

Workflow smoke GitHub adalah `Mantis Discord Smoke`. Workflow GitHub sebelum dan sesudah
untuk skenario nyata pertama adalah `Mantis Discord Status Reactions`. Workflow ini
menerima:

- `baseline_ref`: ref yang diharapkan mereproduksi perilaku hanya-queued.
- `candidate_ref`: ref yang diharapkan menampilkan `queued -> thinking -> done`.

Workflow ini melakukan checkout ref harness workflow, membangun worktree baseline dan kandidat
yang terpisah, menjalankan `discord-status-reactions-tool-only` terhadap setiap worktree, dan
mengunggah `baseline/`, `candidate/`, `comparison.json`, dan `mantis-report.md` sebagai
artefak Actions. Workflow ini juga merender HTML timeline setiap jalur di browser desktop
Crabbox dan menerbitkan tangkapan layar VNC tersebut di samping PNG timeline deterministik
di komentar PR. Komentar PR yang sama menautkan rekaman MP4 desktop yang ditangkap
selama render browser VNC, sementara tangkapan layar tetap inline untuk peninjauan cepat.
Workflow membangun CLI Crabbox dari main `openclaw/crabbox` agar dapat menggunakan flag lease
desktop/browser saat ini sebelum rilis biner Crabbox berikutnya dibuat.

Anda juga dapat memicu proses berjalan reaksi status langsung dari komentar PR:

```text
@Mantis discord status reactions
```

Pemicu komentar sengaja dibuat sempit. Pemicu ini hanya berjalan pada komentar pull request
dari pengguna dengan akses write, maintain, atau admin, dan hanya mengenali
permintaan reaksi status Discord. Secara default, pemicu ini menggunakan ref baseline bermasalah yang diketahui
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
temuan review ClawSweeper.

## Siklus Hidup Proses Berjalan

1. Memperoleh kredensial.
2. Mengalokasikan atau menggunakan kembali VM.
3. Menyiapkan profil desktop/browser ketika skenario membutuhkan bukti UI.
4. Menyiapkan checkout bersih untuk ref baseline.
5. Menginstal dependensi dan membangun hanya yang dibutuhkan skenario.
6. Memulai Gateway OpenClaw anak dengan direktori status terisolasi.
7. Mengonfigurasi transport live, penyedia, model, dan profil browser.
8. Menjalankan skenario dan menangkap bukti baseline.
9. Menghentikan Gateway dan mempertahankan log.
10. Menyiapkan ref kandidat di VM yang sama.
11. Menjalankan skenario yang sama dan menangkap bukti kandidat.
12. Membandingkan hasil oracle dan bukti visual.
13. Menulis Markdown, JSON, log, tangkapan layar, dan artefak trace opsional.
14. Mengunggah artefak GitHub Actions.
15. Memposting pesan status PR atau Discord yang ringkas.

Skenario harus dapat gagal dalam dua cara berbeda:

- **Bug direproduksi**: baseline gagal dengan cara yang diharapkan.
- **Kegagalan harness**: penyiapan lingkungan, kredensial, API Discord, browser, atau
  penyedia gagal sebelum oracle bug bermakna.

Laporan final harus memisahkan kasus-kasus ini agar maintainer tidak mengacaukan lingkungan
yang flaky dengan perilaku produk.

## MVP Discord

Skenario pertama harus menargetkan reaksi status Discord di kanal guild tempat
mode pengiriman balasan sumber adalah `message_tool_only`.

Mengapa ini menjadi benih Mantis yang baik:

- Ini terlihat di Discord sebagai reaksi pada pesan pemicu.
- Ini memiliki oracle REST yang kuat melalui status reaksi pesan Discord.
- Ini melatih Gateway OpenClaw nyata, autentikasi bot Discord, dispatch pesan,
  mode pengiriman balasan sumber, status reaksi status, dan siklus hidup giliran model.
- Ini cukup sempit untuk menjaga implementasi pertama tetap jujur.

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

Bukti baseline harus menunjukkan reaksi acknowledgement queued tetapi tanpa
transisi siklus hidup dalam mode tool-only. Bukti kandidat harus menunjukkan reaksi status
siklus hidup berjalan ketika `messages.statusReactions.enabled` secara eksplisit
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

Ini mengonfigurasi SUT dengan penanganan guild yang selalu aktif, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, dan reaksi status eksplisit. Oracle
melakukan polling pada pesan pemicu Discord nyata dan mengharapkan urutan yang diamati
`👀 -> 🤔 -> 👍`. Artefak mencakup `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`, dan
`discord-status-reactions-tool-only-timeline.png`.

## Bagian QA yang Ada

Mantis harus membangun di atas stack QA privat yang sudah ada, bukan memulai dari
nol:

- `pnpm openclaw qa discord` sudah menjalankan jalur Discord live dengan bot driver dan
  SUT.
- Runner transport live sudah menulis laporan dan artefak pesan yang diamati
  di bawah `.artifacts/qa-e2e/`.
- Lease kredensial Convex sudah menyediakan akses eksklusif ke kredensial transport live
  bersama.
- Layanan kontrol browser sudah mendukung tangkapan layar, snapshot,
  profil terkelola headless, dan profil CDP jarak jauh.
- QA Lab sudah memiliki UI debugger dan bus untuk pengujian berbentuk transport.

Implementasi Mantis pertama dapat berupa runner sebelum/sesudah yang tipis di atas
bagian-bagian ini, ditambah satu lapisan bukti visual.

## Model Bukti

Setiap run menulis direktori artefak yang stabil:

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

`mantis-summary.json` harus menjadi sumber kebenaran yang dapat dibaca mesin.
Laporan Markdown digunakan untuk komentar PR dan peninjauan manusia.

Ringkasan harus mencakup:

- ref dan SHA yang diuji
- transport dan id skenario
- penyedia mesin dan id mesin atau id lease
- sumber kredensial tanpa nilai rahasia
- hasil baseline
- hasil kandidat
- apakah bug direproduksi pada baseline
- apakah kandidat memperbaikinya
- jalur artefak
- masalah setup atau cleanup yang sudah disanitasi

Tangkapan layar adalah bukti, bukan rahasia. Namun, tetap perlu disiplin redaksi:
nama channel privat, nama pengguna, atau konten pesan dapat muncul. Untuk PR publik,
utamakan tautan artefak GitHub Actions dibanding gambar inline sampai cerita redaksi
lebih kuat.

## Browser Dan VNC

Jalur browser memiliki dua mode:

- **Otomasi headless**: default untuk CI. Chrome berjalan dengan CDP diaktifkan, dan
  Playwright atau kontrol browser OpenClaw menangkap tangkapan layar.
- **Penyelamatan VNC**: diaktifkan pada VM yang sama ketika login, MFA, anti-otomasi Discord,
  atau debugging visual membutuhkan manusia.

Profil browser pengamat Discord harus cukup persisten agar tidak perlu
login untuk setiap run, tetapi terisolasi dari status browser pribadi. Sebuah profil
milik pool mesin Mantis, bukan laptop developer.

Saat Mantis macet, ia memposting pesan status Discord dengan:

- id run
- id skenario
- penyedia mesin
- direktori artefak
- instruksi koneksi VNC atau noVNC jika tersedia
- teks blocker singkat

Deployment privat pertama dapat memposting pesan ini ke channel operator yang ada
dan pindah ke channel Mantis khusus nanti.

## Mesin

Mantis harus mengutamakan AWS melalui Crabbox untuk implementasi jarak jauh pertama.
Crabbox memberi kita mesin yang sudah dihangatkan, pelacakan lease, hidrasi, log, hasil, dan
cleanup. Jika kapasitas AWS terlalu lambat atau tidak tersedia, tambahkan penyedia Hetzner
di belakang antarmuka mesin yang sama.

Persyaratan VM minimum:

- Linux dengan instalasi Chrome atau Chromium yang mampu desktop
- akses CDP untuk otomasi browser
- VNC atau noVNC untuk penyelamatan
- Node 22 dan pnpm
- checkout OpenClaw dan cache dependensi
- cache browser Playwright Chromium saat Playwright digunakan
- CPU dan memori yang cukup untuk satu OpenClaw Gateway, satu browser, dan satu run model
- akses keluar ke Discord, GitHub, penyedia model, dan broker kredensial

VM tidak boleh menyimpan rahasia mentah jangka panjang di luar store kredensial atau
profil browser yang diharapkan.

## Rahasia

Rahasia berada di rahasia organisasi atau repositori GitHub untuk run jarak jauh, dan di
file rahasia lokal yang dikendalikan operator untuk run lokal.

Nama rahasia yang direkomendasikan:

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

Dalam jangka panjang, pool kredensial Convex harus tetap menjadi sumber normal untuk kredensial
transport live. Rahasia GitHub melakukan bootstrap pada broker dan jalur fallback.
Workflow reaksi status Discord memetakan rahasia Mantis Crabbox kembali ke
variabel lingkungan `CRABBOX_COORDINATOR` dan `CRABBOX_COORDINATOR_TOKEN`
yang diharapkan CLI Crabbox. Nama rahasia GitHub `CRABBOX_*` biasa tetap
diterima sebagai fallback kompatibilitas.

Runner Mantis tidak boleh pernah mencetak:

- token bot Discord
- kunci API penyedia
- cookie browser
- isi profil auth
- kata sandi VNC
- payload kredensial mentah

Unggahan artefak publik juga harus meredaksi metadata target Discord seperti id bot,
guild, channel, dan pesan. Workflow smoke GitHub mengaktifkan
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` karena alasan ini.

Jika token tidak sengaja ditempelkan ke issue, PR, chat, atau log, rotasi token itu
setelah rahasia baru disimpan.

## Artefak GitHub Dan Komentar PR

Workflow Mantis harus mengunggah bundel bukti lengkap sebagai artefak Actions
berumur pendek. Saat workflow dijalankan untuk laporan bug atau PR perbaikan, workflow juga harus
menerbitkan tangkapan layar PNG yang sudah direduksi ke branch `qa-artifacts` dan melakukan upsert
komentar pada bug atau PR perbaikan tersebut dengan tangkapan layar sebelum/sesudah inline. Jangan memposting
bukti utama hanya pada PR otomasi QA generik. Log mentah, pesan yang diamati,
dan bukti besar lainnya tetap berada di artefak Actions.

Workflow produksi harus memposting komentar tersebut dengan Mantis GitHub App, bukan
dengan `github-actions[bot]`. Simpan app id dan private key sebagai rahasia GitHub Actions
`MANTIS_GITHUB_APP_ID` dan `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow menggunakan marker tersembunyi sebagai kunci upsert, memperbarui komentar itu
saat token dapat mengeditnya, dan membuat komentar baru milik Mantis saat
marker lama milik bot tidak dapat diedit.

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

Saat run gagal karena harness gagal, komentar harus mengatakan hal itu, bukan
mengisyaratkan bahwa kandidat gagal.

## Catatan Deployment Privat

Deployment privat mungkin sudah memiliki aplikasi Discord Mantis. Gunakan kembali
aplikasi itu alih-alih membuat app lain saat aplikasi tersebut memiliki izin bot yang tepat
dan dapat dirotasi dengan aman.

Tetapkan channel notifikasi operator awal melalui rahasia atau konfigurasi deployment.
Channel itu dapat mengarah ke channel maintainer atau operasi yang sudah ada terlebih dahulu,
lalu pindah ke channel Mantis khusus setelah tersedia.

Jangan menaruh id guild, id channel, token bot, cookie browser, atau kata sandi VNC
di dokumen ini. Simpan semuanya di rahasia GitHub, broker kredensial, atau store rahasia
lokal operator.

## Menambahkan Skenario

Skenario Mantis harus mendeklarasikan:

- id dan judul
- transport
- kredensial yang diperlukan
- kebijakan ref baseline
- kebijakan ref kandidat
- patch konfigurasi OpenClaw
- langkah setup
- stimulus
- oracle baseline yang diharapkan
- oracle kandidat yang diharapkan
- target tangkapan visual
- anggaran timeout
- langkah cleanup

Skenario harus mengutamakan oracle kecil dan bertipe:

- status reaksi Discord untuk bug reaksi
- referensi pesan Discord untuk bug threading
- ts thread Slack dan status API reaksi untuk bug Slack
- id pesan email dan header untuk bug email
- tangkapan layar browser saat UI adalah satu-satunya observable yang andal

Pemeriksaan vision harus bersifat aditif. Jika API platform dapat membuktikan bug, gunakan
API sebagai oracle lulus/gagal dan simpan tangkapan layar untuk keyakinan manusia.

## Ekspansi Penyedia

Setelah Discord, runner yang sama dapat menambahkan:

- Slack: reaksi, thread, mention app, modal, unggahan file.
- Email: auth Gmail dan threading pesan menggunakan `gog` saat connector tidak
  cukup.
- WhatsApp: login QR, identifikasi ulang, pengiriman pesan, media, reaksi.
- Telegram: gating mention grup, command, reaksi jika tersedia.
- Matrix: room terenkripsi, relasi thread atau balasan, resume restart.

Setiap transport harus memiliki satu skenario smoke murah dan satu atau lebih skenario kelas bug.
Skenario visual yang mahal harus tetap opt-in.

## Pertanyaan Terbuka

- Bot Discord mana yang harus menjadi driver, dan mana yang harus menjadi SUT, saat
  bot Mantis yang ada digunakan kembali?
- Apakah login browser pengamat harus menggunakan akun Discord manusia, akun pengujian,
  atau hanya bukti REST yang dapat dibaca bot untuk fase pertama?
- Berapa lama GitHub harus menyimpan artefak Mantis untuk PR?
- Kapan ClawSweeper harus otomatis merekomendasikan Mantis alih-alih menunggu
  command maintainer?
- Apakah tangkapan layar harus direduksi atau dipangkas sebelum diunggah untuk PR publik?
