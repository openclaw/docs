---
read_when:
    - Membangun atau menjalankan QA visual langsung untuk bug OpenClaw
    - Menambahkan verifikasi sebelum dan sesudah untuk permintaan tarik
    - Menambahkan skenario transport langsung Discord, Slack, WhatsApp, atau lainnya
    - Melakukan debug pada eksekusi QA yang membutuhkan tangkapan layar, otomatisasi peramban, atau akses VNC
summary: Mantis adalah sistem verifikasi visual ujung-ke-ujung untuk mereproduksi bug OpenClaw pada transport langsung, menangkap bukti sebelum dan sesudah, serta melampirkan artefak ke PR.
title: Belalang sembah
x-i18n:
    generated_at: "2026-05-03T21:30:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis adalah sistem verifikasi end-to-end OpenClaw untuk bug yang membutuhkan runtime nyata, transport nyata, dan bukti yang terlihat. Sistem ini menjalankan skenario terhadap ref bermasalah yang diketahui, menangkap bukti, menjalankan skenario yang sama terhadap ref kandidat, dan menerbitkan perbandingannya sebagai artefak yang dapat diperiksa pengelola dari PR atau dari perintah lokal.

Mantis dimulai dengan Discord karena Discord memberi kita jalur pertama bernilai tinggi: autentikasi bot nyata, kanal guild nyata, reaksi, utas, perintah native, dan UI peramban tempat manusia dapat mengonfirmasi secara visual apa yang ditampilkan transport.

## Sasaran

- Mereproduksi bug dari issue atau PR GitHub dengan bentuk transport yang sama seperti yang dilihat pengguna.
- Menangkap artefak **sebelum** pada ref baseline sebelum menerapkan perbaikan.
- Menangkap artefak **sesudah** pada ref kandidat setelah menerapkan perbaikan.
- Menggunakan oracle deterministik bila memungkinkan, seperti pembacaan reaksi REST Discord atau pemeriksaan transkrip kanal.
- Menangkap tangkapan layar saat bug memiliki permukaan UI yang terlihat.
- Berjalan secara lokal dari CLI yang dikendalikan agen dan secara jarak jauh dari GitHub.
- Mempertahankan cukup status mesin untuk penyelamatan VNC saat login, otomatisasi peramban, atau autentikasi penyedia macet.
- Mengirim status ringkas ke kanal Discord operator saat eksekusi terblokir, memerlukan bantuan VNC manual, atau selesai.

## Bukan Sasaran

- Mantis bukan pengganti pengujian unit. Eksekusi Mantis biasanya harus menjadi pengujian regresi yang lebih kecil setelah perbaikannya dipahami.
- Mantis bukan gate CI cepat normal. Sistem ini lebih lambat, menggunakan kredensial live, dan dicadangkan untuk bug yang membutuhkan lingkungan live.
- Mantis tidak boleh memerlukan manusia untuk operasi normal. VNC manual adalah jalur penyelamatan, bukan jalur utama.
- Mantis tidak menyimpan secret mentah dalam artefak, log, tangkapan layar, laporan Markdown, atau komentar PR.

## Kepemilikan

Mantis berada dalam stack QA OpenClaw.

- OpenClaw memiliki runtime skenario, adaptor transport, skema bukti, dan CLI lokal di bawah `pnpm openclaw qa mantis`.
- QA Lab memiliki bagian harness transport live, helper penangkapan peramban, dan penulis artefak.
- Crabbox memiliki mesin Linux yang sudah dipanaskan saat VM jarak jauh diperlukan.
- GitHub Actions memiliki entrypoint workflow jarak jauh dan retensi artefak.
- ClawSweeper memiliki routing komentar GitHub: mengurai perintah pengelola, mendispatch workflow, dan memposting komentar PR akhir.
- Agen OpenClaw menggerakkan Mantis melalui Codex saat skenario membutuhkan penyiapan agentic, debugging, atau pelaporan status macet.

Batas ini menjaga pengetahuan transport tetap di OpenClaw, penjadwalan mesin di Crabbox, dan perekat workflow pengelola di ClawSweeper.

## Bentuk Perintah

Perintah lokal pertama memverifikasi bot Discord, guild, kanal, pengiriman pesan, pengiriman reaksi, dan jalur artefak:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Runner sebelum dan sesudah lokal menerima bentuk ini:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner membuat worktree baseline dan kandidat yang detached di bawah direktori output, memasang dependensi, membangun setiap ref, menjalankan skenario dengan `--allow-failures`, lalu menulis `baseline/`, `candidate/`, `comparison.json`, dan `mantis-report.md`. Untuk skenario Discord pertama, verifikasi yang berhasil berarti status baseline adalah `fail` dan status kandidat adalah `pass`.

Workflow smoke GitHub adalah `Mantis Discord Smoke`. Workflow GitHub sebelum dan sesudah untuk skenario nyata pertama adalah `Mantis Discord Status Reactions`. Workflow ini menerima:

- `baseline_ref`: ref yang diharapkan mereproduksi perilaku hanya-antre.
- `candidate_ref`: ref yang diharapkan menunjukkan `queued -> thinking -> done`.

Workflow ini melakukan checkout ref harness workflow, membangun worktree baseline dan kandidat yang terpisah, menjalankan `discord-status-reactions-tool-only` terhadap setiap worktree, dan mengunggah `baseline/`, `candidate/`, `comparison.json`, dan `mantis-report.md` sebagai artefak Actions.

Anda juga dapat memicu eksekusi status-reactions langsung dari komentar PR:

```text
@Mantis discord status reactions
```

Pemicu komentar sengaja dibuat sempit. Pemicu ini hanya berjalan pada komentar pull request dari pengguna dengan akses write, maintain, atau admin, dan hanya mengenali permintaan reaksi status Discord. Secara default pemicu ini menggunakan ref baseline bermasalah yang diketahui dan SHA head PR saat ini sebagai kandidat. Pengelola dapat mengganti salah satu ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Contoh perintah ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Perintah pertama eksplisit dan berfokus pada skenario. Perintah kedua nantinya dapat memetakan PR atau issue ke skenario Mantis yang direkomendasikan dari label, file yang berubah, dan temuan tinjauan ClawSweeper.

## Siklus Hidup Eksekusi

1. Mendapatkan kredensial.
2. Mengalokasikan atau menggunakan ulang VM.
3. Menyiapkan checkout bersih untuk ref baseline.
4. Memasang dependensi dan membangun hanya yang dibutuhkan skenario.
5. Memulai Gateway OpenClaw anak dengan direktori status yang terisolasi.
6. Mengonfigurasi transport live, penyedia, model, dan profil peramban.
7. Menjalankan skenario dan menangkap bukti baseline.
8. Menghentikan gateway dan mempertahankan log.
9. Menyiapkan ref kandidat dalam VM yang sama.
10. Menjalankan skenario yang sama dan menangkap bukti kandidat.
11. Membandingkan hasil oracle dan bukti visual.
12. Menulis Markdown, JSON, log, tangkapan layar, dan artefak trace opsional.
13. Mengunggah artefak GitHub Actions.
14. Memposting pesan status PR atau Discord yang ringkas.

Skenario harus dapat gagal dengan dua cara berbeda:

- **Bug direproduksi**: baseline gagal dengan cara yang diharapkan.
- **Kegagalan harness**: penyiapan lingkungan, kredensial, API Discord, peramban, atau penyedia gagal sebelum oracle bug bermakna.

Laporan akhir harus memisahkan kasus-kasus ini agar pengelola tidak mengira lingkungan yang flaky sebagai perilaku produk.

## MVP Discord

Skenario pertama harus menargetkan reaksi status Discord di kanal guild tempat mode pengiriman balasan sumber adalah `message_tool_only`.

Mengapa ini seed Mantis yang baik:

- Ini terlihat di Discord sebagai reaksi pada pesan pemicu.
- Ini memiliki oracle REST yang kuat melalui status reaksi pesan Discord.
- Ini menguji Gateway OpenClaw nyata, autentikasi bot Discord, dispatch pesan, mode pengiriman balasan sumber, status reaksi status, dan siklus hidup giliran model.
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

Bukti baseline harus menunjukkan reaksi pengakuan queued tetapi tanpa transisi siklus hidup dalam mode tool-only. Bukti kandidat harus menunjukkan reaksi status siklus hidup berjalan saat `messages.statusReactions.enabled` secara eksplisit bernilai true.

Irisan pertama yang dapat dieksekusi adalah skenario QA live Discord yang opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Ini mengonfigurasi SUT dengan penanganan guild yang selalu aktif, `visibleReplies: "message_tool"`, `ackReaction: "👀"`, dan reaksi status eksplisit. Oracle melakukan polling pesan pemicu Discord nyata dan mengharapkan urutan yang diamati `👀 -> 🤔 -> 👍`. Artefak mencakup `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html`, dan `discord-status-reactions-tool-only-timeline.png`.

## Bagian QA yang Ada

Mantis harus dibangun di atas stack QA privat yang sudah ada alih-alih memulai dari nol:

- `pnpm openclaw qa discord` sudah menjalankan jalur Discord live dengan bot driver dan SUT.
- Runner transport live sudah menulis laporan dan artefak pesan yang diamati di bawah `.artifacts/qa-e2e/`.
- Lease kredensial Convex sudah menyediakan akses eksklusif ke kredensial transport live bersama.
- Layanan kontrol peramban sudah mendukung tangkapan layar, snapshot, profil terkelola headless, dan profil CDP jarak jauh.
- QA Lab sudah memiliki UI debugger dan bus untuk pengujian berbentuk transport.

Implementasi Mantis pertama dapat berupa runner sebelum/sesudah yang tipis di atas bagian-bagian ini, ditambah satu lapisan bukti visual.

## Model Bukti

Setiap eksekusi menulis direktori artefak yang stabil:

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

`mantis-summary.json` harus menjadi sumber kebenaran yang dapat dibaca mesin. Laporan Markdown ditujukan untuk komentar PR dan tinjauan manusia.

Ringkasan harus mencakup:

- ref dan SHA yang diuji
- transport dan id skenario
- penyedia mesin dan id mesin atau id lease
- sumber kredensial tanpa nilai secret
- hasil baseline
- hasil kandidat
- apakah bug direproduksi pada baseline
- apakah kandidat memperbaikinya
- jalur artefak
- masalah penyiapan atau pembersihan yang disanitasi

Tangkapan layar adalah bukti, bukan secret. Namun tetap membutuhkan disiplin redaksi: nama kanal privat, nama pengguna, atau isi pesan dapat muncul. Untuk PR publik, utamakan tautan artefak GitHub Actions daripada gambar inline sampai cerita redaksinya lebih kuat.

## Peramban dan VNC

Jalur peramban memiliki dua mode:

- **Otomatisasi headless**: default untuk CI. Chrome berjalan dengan CDP diaktifkan, dan Playwright atau kontrol peramban OpenClaw menangkap tangkapan layar.
- **Penyelamatan VNC**: diaktifkan pada VM yang sama saat login, MFA, anti-otomatisasi Discord, atau debugging visual membutuhkan manusia.

Profil peramban pengamat Discord harus cukup persisten untuk menghindari login pada setiap eksekusi, tetapi terisolasi dari status peramban pribadi. Profil dimiliki oleh pool mesin Mantis, bukan laptop developer.

Saat Mantis macet, sistem ini memposting pesan status Discord dengan:

- id eksekusi
- id skenario
- penyedia mesin
- direktori artefak
- instruksi koneksi VNC atau noVNC jika tersedia
- teks pemblokir singkat

Deployment privat pertama dapat memposting pesan-pesan ini ke kanal operator yang sudah ada dan berpindah ke kanal Mantis khusus nanti.

## Mesin

Mantis harus mengutamakan AWS melalui Crabbox untuk implementasi jarak jauh pertama. Crabbox memberi kita mesin yang sudah dipanaskan, pelacakan lease, hidrasi, log, hasil, dan pembersihan. Jika kapasitas AWS terlalu lambat atau tidak tersedia, tambahkan penyedia Hetzner di balik antarmuka mesin yang sama.

Persyaratan VM minimum:

- Linux dengan instalasi Chrome atau Chromium yang mampu desktop
- akses CDP untuk otomatisasi peramban
- VNC atau noVNC untuk penyelamatan
- Node 22 dan pnpm
- checkout OpenClaw dan cache dependensi
- cache peramban Playwright Chromium saat Playwright digunakan
- CPU dan memori yang cukup untuk satu Gateway OpenClaw, satu peramban, dan satu eksekusi model
- akses keluar ke Discord, GitHub, penyedia model, dan broker kredensial

VM tidak boleh menyimpan secret mentah berumur panjang di luar penyimpanan kredensial atau profil peramban yang diharapkan.

## Secret

Secret berada di secret organisasi atau repositori GitHub untuk eksekusi jarak jauh, dan di file secret lokal yang dikendalikan operator untuk eksekusi lokal.

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

Dalam jangka panjang, kumpulan kredensial Convex harus tetap menjadi sumber normal untuk kredensial transport langsung. Rahasia GitHub melakukan bootstrap broker dan lane fallback.

Runner Mantis tidak boleh pernah mencetak:

- token bot Discord
- kunci API penyedia
- cookie browser
- isi profil auth
- kata sandi VNC
- payload kredensial mentah

Unggahan artefak publik juga harus menyunting metadata target Discord seperti id bot, guild, channel, dan pesan. Alur kerja smoke GitHub mengaktifkan `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` karena alasan ini.

Jika token tidak sengaja ditempelkan ke issue, PR, chat, atau log, rotasikan token tersebut setelah rahasia baru disimpan.

## Artefak GitHub Dan Komentar PR

Alur kerja Mantis harus mengunggah bundle bukti lengkap sebagai artefak Actions berumur pendek. Ketika alur kerja dijalankan untuk laporan bug atau PR perbaikan, alur kerja juga harus menerbitkan tangkapan layar PNG yang sudah disunting ke branch `qa-artifacts` dan melakukan upsert komentar pada bug atau PR perbaikan tersebut dengan tangkapan layar sebelum/sesudah inline. Jangan memposting bukti utama hanya pada PR otomatisasi QA generik. Log mentah, pesan yang teramati, dan bukti besar lainnya tetap berada di artefak Actions.

Alur kerja produksi harus memposting komentar tersebut dengan GitHub App Mantis, bukan dengan `github-actions[bot]`. Simpan id aplikasi dan kunci privat sebagai rahasia GitHub Actions `MANTIS_GITHUB_APP_ID` dan `MANTIS_GITHUB_APP_PRIVATE_KEY`. Alur kerja menggunakan marker tersembunyi sebagai kunci upsert, memperbarui komentar tersebut ketika token dapat mengeditnya, dan membuat komentar baru milik Mantis ketika marker lama milik bot tidak dapat diedit.

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

Ketika run gagal karena harness gagal, komentar harus menyatakan hal itu, bukan menyiratkan kandidat gagal.

## Catatan Deployment Privat

Deployment privat mungkin sudah memiliki aplikasi Discord Mantis. Gunakan ulang aplikasi tersebut alih-alih membuat aplikasi lain ketika aplikasi itu memiliki izin bot yang tepat dan dapat dirotasi dengan aman.

Tetapkan channel notifikasi operator awal melalui rahasia atau konfigurasi deployment. Channel tersebut dapat mengarah ke channel maintainer atau operasi yang sudah ada terlebih dahulu, lalu dipindahkan ke channel Mantis khusus setelah tersedia.

Jangan menaruh id guild, id channel, token bot, cookie browser, atau kata sandi VNC dalam dokumen ini. Simpan semuanya di rahasia GitHub, broker kredensial, atau penyimpanan rahasia lokal milik operator.

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

Skenario harus mengutamakan oracle kecil dan bertipe:

- status reaksi Discord untuk bug reaksi
- referensi pesan Discord untuk bug threading
- ts thread Slack dan status API reaksi untuk bug Slack
- id pesan email dan header untuk bug email
- tangkapan layar browser ketika UI adalah satu-satunya observasi yang andal

Pemeriksaan vision harus bersifat aditif. Jika API platform dapat membuktikan bug, gunakan API sebagai oracle lulus/gagal dan simpan tangkapan layar untuk keyakinan manusia.

## Ekspansi Penyedia

Setelah Discord, runner yang sama dapat menambahkan:

- Slack: reaksi, thread, mention aplikasi, modal, unggahan file.
- Email: auth Gmail dan threading pesan menggunakan `gog` ketika connector tidak cukup.
- WhatsApp: login QR, identifikasi ulang, pengiriman pesan, media, reaksi.
- Telegram: gating mention grup, perintah, reaksi jika tersedia.
- Matrix: ruang terenkripsi, relasi thread atau balasan, resume restart.

Setiap transport harus memiliki satu skenario smoke murah dan satu atau lebih skenario kelas bug. Skenario visual yang mahal harus tetap opt-in.

## Pertanyaan Terbuka

- Bot Discord mana yang harus menjadi driver, dan mana yang harus menjadi SUT, ketika bot Mantis yang sudah ada digunakan ulang?
- Apakah login browser observer harus menggunakan akun Discord manusia, akun uji, atau hanya bukti REST yang dapat dibaca bot untuk fase pertama?
- Berapa lama GitHub harus menyimpan artefak Mantis untuk PR?
- Kapan ClawSweeper harus otomatis merekomendasikan Mantis alih-alih menunggu perintah maintainer?
- Apakah tangkapan layar harus disunting atau dipotong sebelum diunggah untuk PR publik?
