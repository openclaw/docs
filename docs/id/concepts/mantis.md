---
read_when:
    - Membangun atau menjalankan QA visual langsung untuk bug OpenClaw
    - Menambahkan verifikasi sebelum dan sesudah pada permintaan pull
    - Menambahkan Discord, Slack, WhatsApp, atau skenario transport langsung lainnya
    - Men-debug proses QA yang memerlukan tangkapan layar, otomatisasi peramban, atau akses VNC
summary: Mantis adalah sistem verifikasi visual ujung-ke-ujung untuk mereproduksi bug OpenClaw pada transport langsung, menangkap bukti sebelum dan sesudah, dan melampirkan artefak ke PR.
title: Belalang sembah
x-i18n:
    generated_at: "2026-05-04T02:23:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis adalah sistem verifikasi end-to-end OpenClaw untuk bug yang membutuhkan
runtime nyata, transport nyata, dan bukti yang terlihat. Sistem ini menjalankan
skenario terhadap ref yang diketahui bermasalah, menangkap bukti, menjalankan
skenario yang sama terhadap ref kandidat, dan memublikasikan perbandingannya
sebagai artefak yang dapat diperiksa maintainer dari PR atau dari perintah lokal.

Mantis dimulai dengan Discord karena Discord memberi kita jalur pertama bernilai
tinggi: auth bot nyata, channel guild nyata, reaksi, thread, perintah native, dan
UI browser tempat manusia dapat mengonfirmasi secara visual apa yang ditampilkan
transport.

## Tujuan

- Mereproduksi bug dari issue atau PR GitHub dengan bentuk transport yang sama
  seperti yang dilihat pengguna.
- Menangkap artefak **sebelum** pada ref baseline sebelum menerapkan perbaikan.
- Menangkap artefak **sesudah** pada ref kandidat setelah menerapkan perbaikan.
- Menggunakan oracle deterministik jika memungkinkan, seperti pembacaan reaksi
  Discord REST atau pemeriksaan transkrip channel.
- Menangkap screenshot saat bug memiliki permukaan UI yang terlihat.
- Berjalan secara lokal dari CLI yang dikendalikan agen dan secara remote dari
  GitHub.
- Mempertahankan state mesin yang cukup untuk penyelamatan VNC saat login,
  otomasi browser, atau auth provider macet.
- Mengirim status ringkas ke channel Discord operator saat proses terblokir,
  memerlukan bantuan VNC manual, atau selesai.

## Bukan Tujuan

- Mantis bukan pengganti unit test. Proses Mantis biasanya harus menjadi
  regression test yang lebih kecil setelah perbaikannya dipahami.
- Mantis bukan gate CI cepat yang normal. Sistem ini lebih lambat, menggunakan
  kredensial live, dan dicadangkan untuk bug ketika lingkungan live berpengaruh.
- Mantis tidak boleh memerlukan manusia untuk operasi normal. VNC manual adalah
  jalur penyelamatan, bukan jalur utama.
- Mantis tidak menyimpan secret mentah dalam artefak, log, screenshot, laporan
  Markdown, atau komentar PR.

## Kepemilikan

Mantis berada di stack QA OpenClaw.

- OpenClaw memiliki runtime skenario, adapter transport, skema bukti, dan CLI
  lokal di bawah `pnpm openclaw qa mantis`.
- QA Lab memiliki bagian harness transport live, helper capture browser, dan
  penulis artefak.
- Crabbox memiliki mesin Linux yang sudah dipanaskan saat VM remote dibutuhkan.
- GitHub Actions memiliki entrypoint workflow remote dan retensi artefak.
- ClawSweeper memiliki routing komentar GitHub: mem-parsing perintah maintainer,
  mengirim workflow, dan mengirim komentar PR akhir.
- Agen OpenClaw menjalankan Mantis melalui Codex saat skenario membutuhkan setup
  agentic, debugging, atau pelaporan state macet.

Batas ini menjaga pengetahuan transport di OpenClaw, penjadwalan mesin di
Crabbox, dan perekat workflow maintainer di ClawSweeper.

## Bentuk Perintah

Perintah lokal pertama memverifikasi bot Discord, guild, channel, pengiriman
pesan, pengiriman reaksi, dan jalur artefak:

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

Runner membuat worktree baseline dan kandidat yang detached di bawah direktori
output, menginstal dependensi, membangun setiap ref, menjalankan skenario dengan
`--allow-failures`, lalu menulis `baseline/`, `candidate/`, `comparison.json`,
dan `mantis-report.md`. Untuk skenario Discord pertama, verifikasi yang berhasil
berarti status baseline adalah `fail` dan status kandidat adalah `pass`.

Primitif VM/browser pertama adalah smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Perintah ini menyewa atau menggunakan ulang mesin desktop Crabbox, memulai
browser yang terlihat di dalam sesi VNC, menangkap desktop, menarik artefak
kembali ke direktori output lokal, dan menulis perintah reconnect ke dalam
laporan. Perintah ini secara default memakai provider Hetzner karena merupakan
provider pertama dengan cakupan desktop/VNC yang berfungsi di jalur Mantis.
Timpa dengan `--provider`, `--crabbox-bin`, atau
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` saat menjalankan terhadap fleet Crabbox lain.

Flag smoke desktop yang berguna:

- `--lease-id <cbx_...>` atau `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` menggunakan ulang desktop yang sudah dipanaskan.
- `--browser-url <url>` mengubah halaman yang dibuka di browser yang terlihat.
- `--html-file <path>` merender artefak HTML lokal repo di browser yang terlihat. Mantis menggunakannya untuk menangkap timeline reaksi status Discord yang dihasilkan melalui desktop Crabbox nyata.
- `--keep-lease` atau `OPENCLAW_MANTIS_KEEP_VM=1` menjaga lease lulus yang baru dibuat tetap terbuka untuk inspeksi VNC. Proses yang gagal mempertahankan lease secara default saat lease dibuat agar operator dapat reconnect.
- `--class`, `--idle-timeout`, dan `--ttl` menyesuaikan ukuran mesin dan masa pakai lease.

Workflow smoke GitHub adalah `Mantis Discord Smoke`. Workflow GitHub sebelum dan
sesudah untuk skenario nyata pertama adalah `Mantis Discord Status Reactions`.
Workflow ini menerima:

- `baseline_ref`: ref yang diharapkan mereproduksi perilaku hanya queued.
- `candidate_ref`: ref yang diharapkan menampilkan `queued -> thinking -> done`.

Workflow ini men-checkout ref harness workflow, membangun worktree baseline dan
kandidat terpisah, menjalankan `discord-status-reactions-tool-only` terhadap
setiap worktree, dan mengunggah `baseline/`, `candidate/`, `comparison.json`,
dan `mantis-report.md` sebagai artefak Actions. Workflow ini juga merender HTML
timeline tiap jalur di browser desktop Crabbox dan memublikasikan screenshot VNC
tersebut di samping PNG timeline deterministik dalam komentar PR. Workflow ini
membangun CLI Crabbox dari main `openclaw/crabbox` agar dapat menggunakan flag
lease desktop/browser saat ini sebelum rilis biner Crabbox berikutnya dibuat.

Anda juga dapat memicu proses status-reactions langsung dari komentar PR:

```text
@Mantis discord status reactions
```

Pemicu komentar sengaja dibuat sempit. Pemicu ini hanya berjalan pada komentar
pull request dari pengguna dengan akses write, maintain, atau admin, dan hanya
mengenali permintaan reaksi status Discord. Secara default, pemicu ini memakai
ref baseline bermasalah yang diketahui dan SHA head PR saat ini sebagai kandidat.
Maintainer dapat menimpa salah satu ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Contoh perintah ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Perintah pertama eksplisit dan berfokus pada skenario. Perintah kedua nanti
dapat memetakan PR atau issue ke skenario Mantis yang direkomendasikan dari
label, file yang berubah, dan temuan review ClawSweeper.

## Siklus Proses

1. Mendapatkan kredensial.
2. Mengalokasikan atau menggunakan ulang VM.
3. Menyiapkan profil desktop/browser saat skenario membutuhkan bukti UI.
4. Menyiapkan checkout bersih untuk ref baseline.
5. Menginstal dependensi dan membangun hanya yang dibutuhkan skenario.
6. Memulai child OpenClaw Gateway dengan direktori state terisolasi.
7. Mengonfigurasi transport live, provider, model, dan profil browser.
8. Menjalankan skenario dan menangkap bukti baseline.
9. Menghentikan gateway dan mempertahankan log.
10. Menyiapkan ref kandidat di VM yang sama.
11. Menjalankan skenario yang sama dan menangkap bukti kandidat.
12. Membandingkan hasil oracle dan bukti visual.
13. Menulis Markdown, JSON, log, screenshot, dan artefak trace opsional.
14. Mengunggah artefak GitHub Actions.
15. Mengirim pesan status PR atau Discord yang ringkas.

Skenario harus dapat gagal dengan dua cara berbeda:

- **Bug direproduksi**: baseline gagal dengan cara yang diharapkan.
- **Kegagalan harness**: setup lingkungan, kredensial, API Discord, browser, atau
  provider gagal sebelum oracle bug bermakna.

Laporan akhir harus memisahkan kasus-kasus ini agar maintainer tidak mencampur
lingkungan yang flaky dengan perilaku produk.

## MVP Discord

Skenario pertama harus menargetkan reaksi status Discord di channel guild ketika
mode pengiriman balasan sumber adalah `message_tool_only`.

Mengapa ini seed Mantis yang baik:

- Ini terlihat di Discord sebagai reaksi pada pesan pemicu.
- Ini memiliki oracle REST yang kuat melalui state reaksi pesan Discord.
- Ini melatih OpenClaw Gateway nyata, auth bot Discord, dispatch pesan,
  mode pengiriman balasan sumber, state reaksi status, dan siklus hidup giliran model.
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

Bukti baseline harus menampilkan reaksi acknowledgement queued tetapi tanpa
transisi lifecycle dalam mode tool-only. Bukti kandidat harus menampilkan reaksi
status lifecycle yang berjalan saat `messages.statusReactions.enabled` secara
eksplisit `true`.

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

Skenario ini mengonfigurasi SUT dengan penanganan guild selalu aktif,
`visibleReplies: "message_tool"`, `ackReaction: "👀"`, dan reaksi status
eksplisit. Oracle melakukan polling pada pesan pemicu Discord nyata dan
mengharapkan urutan yang diamati `👀 -> 🤔 -> 👍`. Artefak mencakup
`discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`, dan
`discord-status-reactions-tool-only-timeline.png`.

## Komponen QA yang Ada

Mantis harus dibangun di atas stack QA privat yang sudah ada alih-alih memulai
dari nol:

- `pnpm openclaw qa discord` sudah menjalankan jalur Discord live dengan bot
  driver dan SUT.
- Runner transport live sudah menulis laporan dan artefak pesan yang diamati di
  bawah `.artifacts/qa-e2e/`.
- Lease kredensial Convex sudah menyediakan akses eksklusif ke kredensial
  transport live bersama.
- Layanan kontrol browser sudah mendukung screenshot, snapshot, profil managed
  headless, dan profil CDP remote.
- QA Lab sudah memiliki UI debugger dan bus untuk pengujian berbentuk transport.

Implementasi Mantis pertama dapat berupa runner sebelum/sesudah tipis di atas
komponen-komponen ini, ditambah satu lapisan bukti visual.

## Model Bukti

Setiap proses menulis direktori artefak yang stabil:

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
Laporan Markdown ditujukan untuk komentar PR dan review manusia.

Ringkasan harus mencakup:

- ref dan SHA yang diuji
- transport dan id skenario
- provider mesin dan id mesin atau id lease
- sumber kredensial tanpa nilai secret
- hasil baseline
- hasil kandidat
- apakah bug direproduksi pada baseline
- apakah kandidat memperbaikinya
- jalur artefak
- masalah setup atau cleanup yang sudah disanitasi

Screenshot adalah bukti, bukan secret. Screenshot tetap membutuhkan disiplin
redaksi: nama channel privat, nama pengguna, atau isi pesan mungkin muncul.
Untuk PR publik, utamakan link artefak GitHub Actions daripada gambar inline
hingga cerita redaksi lebih kuat.

## Browser dan VNC

Jalur browser memiliki dua mode:

- **Otomasi headless**: default untuk CI. Chrome berjalan dengan CDP aktif, dan
  Playwright atau kontrol browser OpenClaw menangkap screenshot.
- **Penyelamatan VNC**: diaktifkan pada VM yang sama saat login, MFA, anti-otomasi
  Discord, atau debugging visual membutuhkan manusia.

Profil browser pengamat Discord harus cukup persisten untuk menghindari
login pada setiap proses berjalan, tetapi terisolasi dari status browser pribadi. Profil
milik kumpulan mesin Mantis, bukan laptop pengembang.

Saat Mantis macet, ia memposting pesan status Discord dengan:

- id proses berjalan
- id skenario
- penyedia mesin
- direktori artefak
- instruksi koneksi VNC atau noVNC jika tersedia
- teks pemblokir singkat

Deployment privat pertama dapat memposting pesan ini ke kanal operator yang sudah ada
dan berpindah ke kanal Mantis khusus nanti.

## Mesin

Mantis sebaiknya memprioritaskan AWS melalui Crabbox untuk implementasi jarak jauh pertama.
Crabbox memberi kita mesin yang sudah dipanaskan, pelacakan sewa, hidrasi, log, hasil, dan
pembersihan. Jika kapasitas AWS terlalu lambat atau tidak tersedia, tambahkan penyedia Hetzner
di balik antarmuka mesin yang sama.

Persyaratan minimum VM:

- Linux dengan instalasi Chrome atau Chromium yang mendukung desktop
- akses CDP untuk otomasi browser
- VNC atau noVNC untuk penyelamatan
- Node 22 dan pnpm
- checkout OpenClaw dan cache dependensi
- cache browser Playwright Chromium saat Playwright digunakan
- CPU dan memori yang cukup untuk satu OpenClaw Gateway, satu browser, dan satu proses model
- akses keluar ke Discord, GitHub, penyedia model, dan broker kredensial

VM tidak boleh menyimpan rahasia mentah berumur panjang di luar penyimpanan kredensial atau
profil browser yang diharapkan.

## Rahasia

Rahasia berada di rahasia organisasi atau repositori GitHub untuk proses jarak jauh, dan di
file rahasia lokal yang dikendalikan operator untuk proses lokal.

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

Dalam jangka panjang, kumpulan kredensial Convex harus tetap menjadi sumber normal untuk kredensial
transport langsung. Rahasia GitHub melakukan bootstrap broker dan jalur fallback.
Alur kerja reaksi-status Discord memetakan rahasia Mantis Crabbox kembali ke
variabel lingkungan `CRABBOX_COORDINATOR` dan `CRABBOX_COORDINATOR_TOKEN`
yang diharapkan CLI Crabbox. Nama rahasia GitHub `CRABBOX_*` biasa tetap
diterima sebagai fallback kompatibilitas.

Runner Mantis tidak boleh pernah mencetak:

- token bot Discord
- kunci API penyedia
- cookie browser
- isi profil autentikasi
- kata sandi VNC
- payload kredensial mentah

Unggahan artefak publik juga harus menyamarkan metadata target Discord seperti id bot,
guild, kanal, dan pesan. Alur kerja smoke GitHub mengaktifkan
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` karena alasan ini.

Jika token tidak sengaja ditempelkan ke issue, PR, chat, atau log, rotasikan token itu
setelah rahasia baru disimpan.

## Artefak GitHub Dan Komentar PR

Alur kerja Mantis harus mengunggah bundel bukti lengkap sebagai artefak Actions
berumur pendek. Saat alur kerja dijalankan untuk laporan bug atau PR perbaikan, alur itu juga
harus memublikasikan tangkapan layar PNG yang sudah disamarkan ke cabang `qa-artifacts` dan melakukan upsert
komentar pada bug atau PR perbaikan tersebut dengan tangkapan layar sebelum/sesudah inline. Jangan memposting
bukti utama hanya pada PR otomasi QA generik. Log mentah, pesan yang diamati,
dan bukti besar lainnya tetap berada di artefak Actions.

Alur kerja produksi harus memposting komentar tersebut dengan Mantis GitHub App, bukan
dengan `github-actions[bot]`. Simpan id aplikasi dan kunci privat sebagai rahasia
GitHub Actions `MANTIS_GITHUB_APP_ID` dan `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Alur kerja menggunakan penanda tersembunyi sebagai kunci upsert, memperbarui
komentar itu saat token dapat mengeditnya, dan membuat komentar baru milik Mantis saat
penanda lama milik bot tidak dapat diedit.

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

Saat proses gagal karena harness gagal, komentar harus menyatakan hal itu, bukan
menyiratkan bahwa kandidat gagal.

## Catatan Deployment Privat

Deployment privat mungkin sudah memiliki aplikasi Discord Mantis. Gunakan kembali
aplikasi itu alih-alih membuat aplikasi lain saat aplikasi tersebut memiliki izin bot yang tepat
dan dapat dirotasi dengan aman.

Tetapkan kanal notifikasi operator awal melalui rahasia atau konfigurasi deployment.
Kanal itu dapat mengarah ke kanal maintainer atau operasi yang sudah ada terlebih dahulu,
lalu berpindah ke kanal Mantis khusus setelah kanal tersebut ada.

Jangan menaruh id guild, id kanal, token bot, cookie browser, atau kata sandi VNC
di dokumen ini. Simpan di rahasia GitHub, broker kredensial, atau penyimpanan
rahasia lokal operator.

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
- anggaran waktu habis
- langkah pembersihan

Skenario sebaiknya memprioritaskan oracle kecil dan bertipe:

- status reaksi Discord untuk bug reaksi
- referensi pesan Discord untuk bug threading
- ts thread Slack dan status API reaksi untuk bug Slack
- id pesan email dan header untuk bug email
- tangkapan layar browser saat UI adalah satu-satunya hal teramati yang andal

Pemeriksaan visi harus bersifat tambahan. Jika API platform dapat membuktikan bug, gunakan
API sebagai oracle lulus/gagal dan simpan tangkapan layar untuk keyakinan manusia.

## Ekspansi Penyedia

Setelah Discord, runner yang sama dapat menambahkan:

- Slack: reaksi, thread, mention aplikasi, modal, unggahan file.
- Email: autentikasi Gmail dan threading pesan menggunakan `gog` saat konektor tidak
  cukup.
- WhatsApp: login QR, identifikasi ulang, pengiriman pesan, media, reaksi.
- Telegram: gating mention grup, perintah, reaksi jika tersedia.
- Matrix: ruang terenkripsi, relasi thread atau balasan, resume setelah restart.

Setiap transport harus memiliki satu skenario smoke murah dan satu atau lebih skenario
kelas bug. Skenario visual yang mahal harus tetap opt-in.

## Pertanyaan Terbuka

- Bot Discord mana yang harus menjadi driver, dan mana yang harus menjadi SUT, saat bot
  Mantis yang sudah ada digunakan kembali?
- Apakah login browser pengamat harus menggunakan akun Discord manusia, akun pengujian,
  atau hanya bukti REST yang dapat dibaca bot untuk fase pertama?
- Berapa lama GitHub harus menyimpan artefak Mantis untuk PR?
- Kapan ClawSweeper harus otomatis merekomendasikan Mantis alih-alih menunggu
  perintah maintainer?
- Apakah tangkapan layar harus disamarkan atau dipotong sebelum diunggah untuk PR publik?
