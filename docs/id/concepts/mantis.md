---
read_when:
    - Membangun atau menjalankan QA visual langsung untuk bug OpenClaw
    - Menambahkan verifikasi sebelum dan sesudah untuk permintaan tarik
    - Menambahkan skenario transport langsung Discord, Slack, WhatsApp, atau lainnya
    - Men-debug eksekusi QA yang memerlukan tangkapan layar, otomatisasi browser, atau akses VNC
summary: Mantis adalah sistem verifikasi visual ujung-ke-ujung untuk mereproduksi bug OpenClaw pada transportasi langsung, menangkap bukti sebelum dan sesudah, serta melampirkan artefak ke permintaan tarik.
title: Belalang sembah
x-i18n:
    generated_at: "2026-05-05T08:25:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis adalah sistem verifikasi end-to-end OpenClaw untuk bug yang memerlukan
runtime nyata, transport nyata, dan bukti yang terlihat. Sistem ini menjalankan
skenario terhadap ref buruk yang diketahui, menangkap bukti, menjalankan skenario
yang sama terhadap ref kandidat, dan menerbitkan perbandingan sebagai artefak
yang dapat diperiksa maintainer dari PR atau dari perintah lokal.

Mantis dimulai dengan Discord karena Discord memberi kita jalur pertama bernilai
tinggi: autentikasi bot nyata, channel guild nyata, reaction, thread, perintah
native, dan UI browser tempat manusia dapat mengonfirmasi secara visual apa yang
ditampilkan transport.

## Tujuan

- Mereproduksi bug dari issue atau PR GitHub dengan bentuk transport yang sama
  seperti yang dilihat pengguna.
- Menangkap artefak **sebelum** pada ref baseline sebelum menerapkan perbaikan.
- Menangkap artefak **sesudah** pada ref kandidat setelah menerapkan perbaikan.
- Menggunakan oracle deterministik kapan pun memungkinkan, seperti pembacaan
  reaction REST Discord atau pemeriksaan transkrip channel.
- Menangkap screenshot saat bug memiliki permukaan UI yang terlihat.
- Berjalan secara lokal dari CLI yang dikontrol agen dan secara remote dari GitHub.
- Menyimpan status mesin yang cukup untuk penyelamatan VNC saat login, otomasi
  browser, atau autentikasi provider macet.
- Mengirim status ringkas ke channel Discord operator saat run terblokir,
  memerlukan bantuan VNC manual, atau selesai.

## Bukan Tujuan

- Mantis bukan pengganti test unit. Run Mantis biasanya harus menjadi test regresi
  yang lebih kecil setelah perbaikannya dipahami.
- Mantis bukan gate CI cepat normal. Ini lebih lambat, menggunakan kredensial live,
  dan disediakan untuk bug ketika lingkungan live penting.
- Mantis tidak boleh memerlukan manusia untuk operasi normal. VNC manual adalah
  jalur penyelamatan, bukan jalur utama.
- Mantis tidak menyimpan secret mentah di artefak, log, screenshot, laporan
  Markdown, atau komentar PR.

## Kepemilikan

Mantis berada dalam stack QA OpenClaw.

- OpenClaw memiliki runtime skenario, adapter transport, skema bukti, dan CLI
  lokal di bawah `pnpm openclaw qa mantis`.
- QA Lab memiliki bagian harness transport live, helper penangkapan browser, dan
  penulis artefak.
- Crabbox memiliki mesin Linux yang sudah dihangatkan saat VM remote diperlukan.
- GitHub Actions memiliki entrypoint workflow remote dan retensi artefak.
- ClawSweeper memiliki routing komentar GitHub: mengurai perintah maintainer,
  mendispatch workflow, dan mengirim komentar PR final.
- Agen OpenClaw menjalankan Mantis melalui Codex saat sebuah skenario memerlukan
  penyiapan agentic, debugging, atau pelaporan status macet.

Batas ini menjaga pengetahuan transport di OpenClaw, penjadwalan mesin di
Crabbox, dan glue workflow maintainer di ClawSweeper.

## Bentuk Perintah

Perintah lokal pertama memverifikasi bot Discord, guild, channel, pengiriman
pesan, pengiriman reaction, dan path artefak:

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

Runner membuat worktree baseline dan kandidat terpisah di bawah direktori output,
menginstal dependensi, membangun setiap ref, menjalankan skenario dengan
`--allow-failures`, lalu menulis `baseline/`, `candidate/`, `comparison.json`,
dan `mantis-report.md`. Untuk skenario Discord pertama, verifikasi yang berhasil
berarti status baseline adalah `fail` dan status kandidat adalah `pass`.

Primitif VM/browser pertama adalah smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Ini menyewa atau menggunakan ulang mesin desktop Crabbox, memulai browser yang
terlihat di dalam sesi VNC, menangkap desktop, menarik artefak kembali ke
direktori output lokal, dan menulis perintah reconnect ke dalam laporan. Perintah
ini default ke provider Hetzner karena itu adalah provider pertama dengan cakupan
desktop/VNC yang berfungsi di jalur Mantis. Timpa dengan `--provider`,
`--crabbox-bin`, atau `OPENCLAW_MANTIS_CRABBOX_PROVIDER` saat menjalankan terhadap
fleet Crabbox lain.

Flag smoke desktop yang berguna:

- `--lease-id <cbx_...>` atau `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` menggunakan ulang desktop yang sudah dihangatkan.
- `--browser-url <url>` mengubah halaman yang dibuka di browser yang terlihat.
- `--html-file <path>` merender artefak HTML lokal repo di browser yang terlihat. Mantis menggunakannya untuk menangkap timeline status-reaction Discord yang dihasilkan melalui desktop Crabbox nyata.
- `--keep-lease` atau `OPENCLAW_MANTIS_KEEP_VM=1` menjaga lease baru yang berhasil tetap terbuka untuk inspeksi VNC. Run yang gagal menjaga lease secara default saat lease dibuat agar operator dapat reconnect.
- `--class`, `--idle-timeout`, dan `--ttl` menyesuaikan ukuran mesin dan masa pakai lease.

Primitif transport desktop penuh pertama adalah smoke desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ini menyewa atau menggunakan ulang mesin desktop Crabbox, menyinkronkan checkout
saat ini ke dalam VM, menjalankan `pnpm openclaw qa slack` di dalam VM tersebut,
membuka Slack Web di browser VNC, menangkap desktop yang terlihat, dan menyalin
artefak QA Slack serta screenshot VNC kembali ke direktori output lokal. Ini
adalah bentuk Mantis pertama ketika Gateway OpenClaw SUT dan browser sama-sama
berada di dalam VM desktop Linux yang sama.

Dengan `--gateway-setup`, perintah menyiapkan home OpenClaw disposable persisten
di `$HOME/.openclaw-mantis/slack-openclaw`, mem-patch konfigurasi Slack Socket
Mode untuk channel yang dipilih, memulai `openclaw gateway run` pada port
`38973`, dan menjaga Chrome tetap berjalan di sesi VNC. Ini adalah mode
"tinggalkan saya desktop Linux dengan Slack dan claw yang berjalan"; jalur QA
Slack bot-ke-bot tetap menjadi default saat `--gateway-setup` dihilangkan.

Input yang diperlukan untuk `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` untuk jalur model remote. Jika hanya
  `OPENAI_API_KEY` yang disetel secara lokal, Mantis memetakannya ke
  `OPENCLAW_LIVE_OPENAI_KEY` sebelum memanggil Crabbox sehingga forwarding env
  `OPENCLAW_*` milik Crabbox dapat membawanya ke dalam VM.

Flag desktop Slack yang berguna:

- `--lease-id <cbx_...>` menjalankan ulang terhadap mesin tempat operator sudah login ke Slack Web melalui VNC.
- `--gateway-setup` memulai Gateway Slack OpenClaw persisten di VM alih-alih hanya menjalankan jalur QA bot-ke-bot.
- `--slack-url <url>` membuka URL Slack Web tertentu. Tanpanya, Mantis menurunkan `https://app.slack.com/client/<team>/<channel>` dari Slack `auth.test` saat token bot SUT tersedia.
- `--slack-channel-id <id>` mengontrol allowlist channel Slack yang digunakan oleh penyiapan Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` mengontrol profil Chrome persisten di dalam VM. Default-nya adalah `$HOME/.config/openclaw-mantis/slack-chrome-profile`, sehingga login Slack Web manual bertahan pada run ulang di lease yang sama.
- `--credential-source convex --credential-role ci` menggunakan pool kredensial bersama alih-alih token env Slack langsung.
- `--provider-mode`, `--model`, `--alt-model`, dan `--fast` diteruskan ke jalur live Slack.

Workflow smoke GitHub adalah `Mantis Discord Smoke`. Workflow GitHub sebelum dan
sesudah untuk skenario nyata pertama adalah `Mantis Discord Status Reactions`. Ini
menerima:

- `baseline_ref`: ref yang diharapkan mereproduksi perilaku hanya queued.
- `candidate_ref`: ref yang diharapkan menampilkan `queued -> thinking -> done`.

Ini men-checkout ref harness workflow, membangun worktree baseline dan kandidat
terpisah, menjalankan `discord-status-reactions-tool-only` terhadap setiap
worktree, dan mengunggah `baseline/`, `candidate/`, `comparison.json`, dan
`mantis-report.md` sebagai artefak Actions. Ini juga merender HTML timeline setiap
jalur di browser desktop Crabbox dan menerbitkan screenshot VNC tersebut di
samping PNG timeline deterministik dalam komentar PR. Komentar PR yang sama
menyematkan preview GIF ringan yang dipangkas gerakannya dan dibuat oleh
`crabbox media preview`, menautkan klip MP4 yang dipangkas gerakannya yang cocok,
dan menyimpan file MP4 desktop penuh untuk inspeksi mendalam. Screenshot tetap
inline untuk review cepat. Workflow membangun CLI Crabbox dari
`openclaw/crabbox` main sehingga dapat menggunakan flag lease desktop/browser
terkini sebelum rilis biner Crabbox berikutnya dibuat.

`Mantis Scenario` adalah entrypoint manual generik. Ini menerima `scenario_id`,
`candidate_ref`, `baseline_ref` opsional, dan `pr_number` opsional, lalu
mendispatch workflow milik skenario. Wrapper ini sengaja tipis: workflow skenario
tetap memiliki penyiapan transport, kredensial, kelas VM, oracle yang diharapkan,
dan manifes artefaknya.

`Mantis Slack Desktop Smoke` adalah workflow VM Slack pertama. Ini men-checkout
ref kandidat tepercaya di worktree terpisah, menyewa desktop Linux Crabbox,
menjalankan `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`
terhadap kandidat tersebut, membuka Slack Web di browser VNC, merekam desktop,
menghasilkan preview yang dipangkas gerakannya dengan `crabbox media preview`,
mengunggah direktori artefak penuh, dan secara opsional mengirim komentar bukti
inline pada PR target. Gunakan jalur ini saat Anda menginginkan "desktop Linux
dengan Slack dan claw yang berjalan" alih-alih hanya transkrip Slack bot-ke-bot.

Setiap skenario yang menerbitkan PR menulis `mantis-evidence.json` di samping
laporannya. Skema ini adalah handoff antara kode skenario dan komentar GitHub:

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
Publisher menolak path traversal dan melewati entri bertanda `"required": false`
saat preview atau video opsional tidak tersedia.

Jenis artefak yang didukung:

- `timeline`: screenshot skenario deterministik, biasanya sebelum/sesudah.
- `desktopScreenshot`: screenshot desktop VNC/browser.
- `motionPreview`: GIF animasi inline yang dihasilkan dari rekaman desktop.
- `motionClip`: MP4 yang dipangkas gerakannya yang menghapus bagian awal dan akhir statis.
- `fullVideo`: rekaman MP4 penuh untuk inspeksi mendalam.
- `metadata`: sidecar JSON/log.
- `report`: laporan Markdown.

Publisher reusable adalah `scripts/mantis/publish-pr-evidence.mjs`. Workflow
memanggilnya dengan manifes, PR target, root target `qa-artifacts`, marker
komentar, URL artefak Actions, URL run, dan sumber request. Ini menyalin artefak
yang dideklarasikan ke branch `qa-artifacts`, membangun komentar PR yang
mendahulukan ringkasan dengan gambar/preview inline dan video tertaut, lalu
memperbarui komentar marker yang ada atau membuat yang baru.

Anda juga dapat memicu run status-reactions langsung dari komentar PR:

```text
@Mantis discord status reactions
```

Trigger komentar sengaja sempit. Ini hanya berjalan pada komentar pull request
dari pengguna dengan akses write, maintain, atau admin, dan hanya mengenali
request status-reaction Discord. Secara default ini menggunakan ref baseline
buruk yang diketahui dan SHA head PR saat ini sebagai kandidat. Maintainer dapat
menimpa salah satu ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Contoh perintah ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Perintah pertama bersifat eksplisit dan berfokus pada skenario. Perintah kedua nantinya dapat memetakan PR
atau issue ke skenario Mantis yang direkomendasikan dari label, file yang berubah, dan
temuan tinjauan ClawSweeper.

## Siklus Hidup Eksekusi

1. Dapatkan kredensial.
2. Alokasikan atau gunakan ulang VM.
3. Siapkan profil desktop/browser saat skenario membutuhkan bukti UI.
4. Siapkan checkout bersih untuk ref baseline.
5. Pasang dependensi dan build hanya yang dibutuhkan skenario.
6. Mulai OpenClaw Gateway turunan dengan direktori status yang terisolasi.
7. Konfigurasikan transport live, penyedia, model, dan profil browser.
8. Jalankan skenario dan tangkap bukti baseline.
9. Hentikan Gateway dan pertahankan log.
10. Siapkan ref kandidat di VM yang sama.
11. Jalankan skenario yang sama dan tangkap bukti kandidat.
12. Bandingkan hasil oracle dan bukti visual.
13. Tulis artefak Markdown, JSON, log, tangkapan layar, dan trace opsional.
14. Unggah artefak GitHub Actions.
15. Kirim pesan status PR atau Discord yang ringkas.

Skenario harus dapat gagal dalam dua cara berbeda:

- **Bug direproduksi**: baseline gagal dengan cara yang diharapkan.
- **Kegagalan harness**: penyiapan lingkungan, kredensial, API Discord, browser, atau
  penyedia gagal sebelum oracle bug bermakna.

Laporan akhir harus memisahkan kasus-kasus ini agar maintainer tidak keliru menganggap lingkungan yang tidak stabil
sebagai perilaku produk.

## MVP Discord

Skenario pertama harus menargetkan reaksi status Discord di kanal guild tempat
mode pengiriman balasan sumber adalah `message_tool_only`.

Mengapa ini seed Mantis yang baik:

- Terlihat di Discord sebagai reaksi pada pesan pemicu.
- Memiliki oracle REST yang kuat melalui status reaksi pesan Discord.
- Menguji OpenClaw Gateway nyata, autentikasi bot Discord, pengiriman pesan,
  mode pengiriman balasan sumber, status reaksi status, dan siklus hidup giliran model.
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

Bukti baseline harus menunjukkan reaksi pengakuan yang diantrekan tetapi tanpa
transisi siklus hidup dalam mode hanya-tool. Bukti kandidat harus menunjukkan reaksi status
siklus hidup berjalan saat `messages.statusReactions.enabled` secara eksplisit
bernilai true.

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

## Bagian QA Yang Ada

Mantis harus dibangun di atas stack QA privat yang ada, bukan memulai dari
nol:

- `pnpm openclaw qa discord` sudah menjalankan lane Discord live dengan bot driver dan
  SUT.
- Runner transport live sudah menulis laporan dan artefak pesan teramati
  di bawah `.artifacts/qa-e2e/`.
- Lease kredensial Convex sudah menyediakan akses eksklusif ke kredensial transport
  live bersama.
- Layanan kontrol browser sudah mendukung tangkapan layar, snapshot,
  profil terkelola headless, dan profil CDP jarak jauh.
- QA Lab sudah memiliki UI debugger dan bus untuk pengujian berbentuk transport.

Implementasi Mantis pertama dapat berupa runner before/after tipis di atas
bagian-bagian ini, ditambah satu lapisan bukti visual.

## Model Bukti

Setiap eksekusi menulis direktori artefak stabil:

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
Laporan Markdown ditujukan untuk komentar PR dan tinjauan manusia.

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
- masalah penyiapan atau pembersihan yang sudah disanitasi

Tangkapan layar adalah bukti, bukan rahasia. Namun tetap memerlukan disiplin redaksi:
nama kanal privat, nama pengguna, atau konten pesan dapat muncul. Untuk PR publik,
utamakan tautan artefak GitHub Actions daripada gambar inline sampai cerita redaksi
lebih kuat.

## Browser Dan VNC

Lane browser memiliki dua mode:

- **Automasi headless**: default untuk CI. Chrome berjalan dengan CDP aktif, dan
  Playwright atau kontrol browser OpenClaw menangkap tangkapan layar.
- **Penyelamatan VNC**: diaktifkan pada VM yang sama saat login, MFA, anti-automasi Discord,
  atau debugging visual membutuhkan manusia.

Profil browser pengamat Discord harus cukup persisten untuk menghindari
login pada setiap eksekusi, tetapi terisolasi dari status browser pribadi. Profil
milik pool mesin Mantis, bukan laptop developer.

Saat Mantis macet, ia mengirim pesan status Discord dengan:

- id eksekusi
- id skenario
- penyedia mesin
- direktori artefak
- instruksi koneksi VNC atau noVNC jika tersedia
- teks pemblokir singkat

Deployment privat pertama dapat mengirim pesan ini ke kanal operator yang ada
dan pindah ke kanal Mantis khusus nanti.

## Mesin

Mantis sebaiknya mengutamakan AWS melalui Crabbox untuk implementasi jarak jauh pertama.
Crabbox memberi kita mesin hangat, pelacakan lease, hidrasi, log, hasil, dan
pembersihan. Jika kapasitas AWS terlalu lambat atau tidak tersedia, tambahkan penyedia Hetzner
di balik antarmuka mesin yang sama.

Persyaratan VM minimum:

- Linux dengan instalasi Chrome atau Chromium yang mampu desktop
- akses CDP untuk automasi browser
- VNC atau noVNC untuk penyelamatan
- Node 22 dan pnpm
- checkout OpenClaw dan cache dependensi
- cache browser Playwright Chromium saat Playwright digunakan
- CPU dan memori yang cukup untuk satu OpenClaw Gateway, satu browser, dan satu eksekusi model
- akses keluar ke Discord, GitHub, penyedia model, dan broker kredensial

VM tidak boleh menyimpan rahasia mentah jangka panjang di luar store kredensial atau
profil browser yang diharapkan.

## Rahasia

Rahasia berada di rahasia organisasi atau repositori GitHub untuk eksekusi jarak jauh, dan di
file rahasia lokal yang dikendalikan operator untuk eksekusi lokal.

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

Jangka panjang, pool kredensial Convex harus tetap menjadi sumber normal untuk kredensial transport
live. Rahasia GitHub mem-bootstrap broker dan lane fallback.
Workflow reaksi-status Discord memetakan rahasia Mantis Crabbox kembali ke
variabel lingkungan `CRABBOX_COORDINATOR` dan `CRABBOX_COORDINATOR_TOKEN`
yang diharapkan CLI Crabbox. Nama rahasia GitHub `CRABBOX_*` polos tetap
diterima sebagai fallback kompatibilitas.

Runner Mantis tidak boleh pernah mencetak:

- token bot Discord
- kunci API penyedia
- cookie browser
- isi profil autentikasi
- kata sandi VNC
- payload kredensial mentah

Unggahan artefak publik juga harus meredaksi metadata target Discord seperti id bot,
guild, kanal, dan pesan. Workflow smoke GitHub mengaktifkan
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` untuk alasan ini.

Jika token tidak sengaja ditempelkan ke issue, PR, chat, atau log, rotasi token tersebut
setelah rahasia baru disimpan.

## Artefak GitHub Dan Komentar PR

Workflow Mantis harus mengunggah bundel bukti lengkap sebagai artefak Actions
berumur pendek. Saat workflow dijalankan untuk laporan bug atau PR perbaikan, workflow juga harus
mempublikasikan tangkapan layar PNG yang sudah direduksi ke cabang `qa-artifacts` dan melakukan upsert
komentar pada bug atau PR perbaikan tersebut dengan tangkapan layar before/after inline. Jangan memposting
bukti utama hanya pada PR automasi QA generik. Log mentah, pesan teramati,
dan bukti besar lainnya tetap berada di artefak Actions.

Workflow produksi harus memposting komentar tersebut dengan Mantis GitHub App, bukan
dengan `github-actions[bot]`. Simpan id app dan kunci privat sebagai rahasia GitHub Actions
`MANTIS_GITHUB_APP_ID` dan `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow menggunakan marker tersembunyi sebagai kunci upsert, memperbarui
komentar tersebut saat token dapat mengeditnya, dan membuat komentar baru milik Mantis saat
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

Saat eksekusi gagal karena harness gagal, komentar harus mengatakan hal tersebut
alih-alih menyiratkan kandidat gagal.

## Catatan Deployment Privat

Deployment privat mungkin sudah memiliki aplikasi Discord Mantis. Gunakan ulang
aplikasi tersebut alih-alih membuat app lain saat memiliki izin bot yang tepat
dan dapat dirotasi dengan aman.

Tetapkan kanal notifikasi operator awal melalui rahasia atau konfigurasi
deployment. Ini dapat menunjuk ke kanal maintainer atau operasi yang ada
terlebih dahulu, lalu pindah ke kanal Mantis khusus setelah tersedia.

Jangan letakkan id guild, id kanal, token bot, cookie browser, atau kata sandi VNC
di dokumen ini. Simpan di rahasia GitHub, broker kredensial, atau store rahasia lokal
operator.

## Menambahkan Skenario

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

- status reaksi Discord untuk bug reaksi
- referensi pesan Discord untuk bug threading
- ts thread Slack dan status API reaksi untuk bug Slack
- id pesan email dan header untuk bug email
- tangkapan layar browser saat UI adalah satu-satunya observable yang andal

Pemeriksaan visi harus bersifat aditif. Jika API platform dapat membuktikan bug, gunakan
API sebagai oracle lulus/gagal dan simpan tangkapan layar untuk keyakinan manusia.

## Ekspansi Penyedia

Setelah Discord, runner yang sama dapat menambahkan:

- Slack: reaksi, utas, sebutan aplikasi, modal, unggahan file.
- Email: autentikasi Gmail dan pengelompokan pesan dalam utas menggunakan `gog` ketika konektor tidak
  cukup.
- WhatsApp: login QR, identifikasi ulang, pengiriman pesan, media, reaksi.
- Telegram: pembatasan sebutan grup, perintah, reaksi jika tersedia.
- Matrix: ruang terenkripsi, relasi utas atau balasan, melanjutkan kembali setelah mulai ulang.

Setiap transport harus memiliki satu skenario uji asap murah dan satu atau beberapa skenario berdasarkan kelas
cacat. Skenario visual yang mahal harus tetap bersifat ikut serta opsional.

## Pertanyaan Terbuka

- Bot Discord mana yang harus menjadi penggerak, dan mana yang harus menjadi SUT, ketika bot
  Mantis yang ada digunakan kembali?
- Haruskah login peramban pengamat menggunakan akun Discord manusia, akun uji,
  atau hanya bukti REST yang dapat dibaca bot untuk fase pertama?
- Berapa lama GitHub harus menyimpan artefak Mantis untuk PR?
- Kapan ClawSweeper harus secara otomatis merekomendasikan Mantis alih-alih menunggu perintah
  maintainer?
- Haruskah tangkapan layar disunting atau dipotong sebelum diunggah untuk PR publik?
