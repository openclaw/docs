---
read_when:
    - Membangun atau menjalankan QA visual langsung untuk bug OpenClaw
    - Menambahkan verifikasi sebelum dan sesudah untuk sebuah pull request
    - Menambahkan skenario transport langsung Discord, Slack, WhatsApp, atau lainnya
    - Men-debug eksekusi QA yang memerlukan tangkapan layar, otomatisasi browser, atau akses VNC
summary: Mantis adalah sistem verifikasi visual ujung-ke-ujung untuk mereproduksi bug OpenClaw pada transport langsung, menangkap bukti sebelum dan sesudah, serta melampirkan artefak ke PR.
title: Belalang sembah
x-i18n:
    generated_at: "2026-05-11T20:27:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis adalah sistem verifikasi end-to-end OpenClaw untuk bug yang membutuhkan runtime nyata, transport nyata, dan bukti yang terlihat. Sistem ini menjalankan skenario terhadap ref yang diketahui bermasalah, menangkap bukti, menjalankan skenario yang sama terhadap ref kandidat, lalu menerbitkan perbandingannya sebagai artefak yang dapat diperiksa maintainer dari PR atau dari perintah lokal.

Mantis dimulai dengan Discord karena Discord memberi kita lane pertama bernilai tinggi: autentikasi bot nyata, kanal guild nyata, reaksi, thread, perintah native, dan UI browser tempat manusia dapat mengonfirmasi secara visual apa yang ditampilkan transport.

## Tujuan

- Mereproduksi bug dari issue atau PR GitHub dengan bentuk transport yang sama seperti yang dilihat pengguna.
- Menangkap artefak **sebelum** pada ref baseline sebelum menerapkan perbaikan.
- Menangkap artefak **sesudah** pada ref kandidat setelah menerapkan perbaikan.
- Menggunakan oracle deterministik bila memungkinkan, seperti pembacaan reaksi REST Discord atau pemeriksaan transkrip kanal.
- Menangkap tangkapan layar saat bug memiliki permukaan UI yang terlihat.
- Berjalan secara lokal dari CLI yang dikendalikan agen dan secara jarak jauh dari GitHub.
- Mempertahankan cukup status mesin untuk penyelamatan VNC saat login, otomatisasi browser, atau autentikasi provider tersendat.
- Memposting status ringkas ke kanal Discord operator saat run terblokir, membutuhkan bantuan VNC manual, atau selesai.

## Bukan tujuan

- Mantis bukan pengganti unit test. Run Mantis biasanya harus menjadi regression test yang lebih kecil setelah perbaikannya dipahami.
- Mantis bukan gate CI cepat yang normal. Ini lebih lambat, menggunakan kredensial live, dan dicadangkan untuk bug ketika lingkungan live penting.
- Mantis seharusnya tidak membutuhkan manusia untuk operasi normal. VNC manual adalah jalur penyelamatan, bukan jalur utama.
- Mantis tidak menyimpan secret mentah dalam artefak, log, tangkapan layar, laporan Markdown, atau komentar PR.

## Kepemilikan

Mantis berada di stack QA OpenClaw.

- OpenClaw memiliki runtime skenario, adapter transport, skema bukti, dan CLI lokal di bawah `pnpm openclaw qa mantis`.
- QA Lab memiliki bagian harness transport live, helper penangkapan browser, dan penulis artefak.
- Crabbox memiliki mesin Linux yang sudah dipanaskan saat VM jarak jauh diperlukan.
- GitHub Actions memiliki entrypoint workflow jarak jauh dan retensi artefak.
- ClawSweeper memiliki routing komentar GitHub: mengurai perintah maintainer, mengirim workflow, dan memposting komentar PR final.
- Agen OpenClaw menggerakkan Mantis melalui Codex saat skenario membutuhkan setup agentic, debugging, atau pelaporan status tersendat.

Batas ini menjaga pengetahuan transport di OpenClaw, penjadwalan mesin di Crabbox, dan perekat workflow maintainer di ClawSweeper.

## Bentuk perintah

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

Runner membuat worktree baseline dan kandidat yang detached di bawah direktori output, menginstal dependensi, membangun setiap ref, menjalankan skenario dengan `--allow-failures`, lalu menulis `baseline/`, `candidate/`, `comparison.json`, dan `mantis-report.md`. Untuk skenario Discord pertama, verifikasi yang berhasil berarti status baseline adalah `fail` dan status kandidat adalah `pass`.

Probe sebelum/sesudah Discord kedua menargetkan lampiran thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Skenario itu memposting pesan induk dengan bot driver, membuat thread Discord nyata, memanggil tindakan `message.thread-reply` OpenClaw dengan `filePath` lokal repo, lalu melakukan polling thread untuk balasan SUT dan nama file lampiran. Tangkapan layar baseline menunjukkan balasan tanpa lampiran; tangkapan layar kandidat menunjukkan lampiran `mantis-thread-report.md` yang diharapkan.

Primitif VM/browser pertama adalah smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Ini menyewa atau menggunakan kembali mesin desktop Crabbox, memulai browser yang terlihat di dalam sesi VNC, menangkap desktop, menarik artefak kembali ke direktori output lokal, dan menulis perintah koneksi ulang ke dalam laporan. Perintah ini default ke provider Hetzner karena itu adalah provider pertama dengan cakupan desktop/VNC yang berfungsi di lane Mantis. Timpa dengan `--provider`, `--crabbox-bin`, atau `OPENCLAW_MANTIS_CRABBOX_PROVIDER` saat berjalan terhadap fleet Crabbox lain.

Flag smoke desktop yang berguna:

- `--lease-id <cbx_...>` atau `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` menggunakan kembali desktop yang sudah dipanaskan.
- `--browser-url <url>` mengubah halaman yang dibuka di browser yang terlihat.
- `--html-file <path>` merender artefak HTML lokal repo di browser yang terlihat. Mantis menggunakan ini untuk menangkap timeline reaksi status Discord yang dihasilkan melalui desktop Crabbox nyata.
- `--browser-profile-dir <remote-path>` menggunakan kembali Chrome user-data-dir jarak jauh sehingga desktop Mantis persisten dapat tetap login di antara run. Gunakan ini untuk profil penampil Discord Web jangka panjang.
- `--browser-profile-archive-env <name>` memulihkan arsip Chrome user-data-dir `.tgz` base64 dari variabel lingkungan bernama sebelum meluncurkan browser. Gunakan ini untuk saksi yang sudah login seperti Discord Web. Env var default adalah `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` mengontrol panjang penangkapan MP4. Gunakan durasi yang lebih panjang untuk aplikasi web yang sudah login dan lambat yang membutuhkan waktu untuk stabil.
- `--keep-lease` atau `OPENCLAW_MANTIS_KEEP_VM=1` menjaga lease yang baru dibuat dan lulus tetap terbuka untuk inspeksi VNC. Run yang gagal menjaga lease secara default saat lease dibuat agar operator dapat terhubung ulang.
- `--class`, `--idle-timeout`, dan `--ttl` menyetel ukuran mesin dan masa hidup lease.

Untuk bukti Discord Web, Mantis menggunakan akun penampil khusus, bukan token bot. Skenario API Discord live tetap menjadi oracle: skenario itu membuat thread nyata, mengirim `thread-reply` SUT, dan memeriksa lampiran melalui REST Discord. Saat `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` disetel, skenario juga menulis artefak URL Discord Web. Saat `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` disetel, skenario membiarkan thread itu tersedia cukup lama agar browser yang sudah login dapat membuka dan merekamnya.

Workflow GitHub membuka URL thread kandidat di Discord Web, menangkap tangkapan layar, merekam MP4, dan membuat pratinjau GIF yang dipangkas berdasarkan gerakan saat tooling media Crabbox tersedia. Lebih disarankan menggunakan jalur profil penampil persisten yang dikonfigurasi melalui `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, karena arsip profil Chrome penuh dapat melampaui batas ukuran secret GitHub. Untuk profil kecil/bootstrap, workflow juga dapat memulihkan arsip `.tgz` base64 dari `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Jika tidak ada sumber profil yang dikonfigurasi, workflow tetap menerbitkan tangkapan layar lampiran baseline/kandidat yang deterministik dan mencatat pemberitahuan bahwa saksi Discord Web yang sudah login dilewati.

Primitif transport desktop penuh pertama adalah smoke desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ini menyewa atau menggunakan kembali mesin desktop Crabbox, menyinkronkan checkout saat ini ke dalam VM, menjalankan `pnpm openclaw qa slack` di dalam VM itu, membuka Slack Web di browser VNC, menangkap desktop yang terlihat, dan menyalin artefak QA Slack serta tangkapan layar VNC kembali ke direktori output lokal. Ini adalah bentuk Mantis pertama ketika Gateway OpenClaw SUT dan browser sama-sama hidup di dalam VM desktop Linux yang sama.

Dengan `--gateway-setup`, perintah menyiapkan home OpenClaw sekali pakai persisten di `$HOME/.openclaw-mantis/slack-openclaw`, mem-patch konfigurasi Slack Socket Mode untuk kanal yang dipilih, memulai `openclaw gateway run` pada port `38973`, dan menjaga Chrome tetap berjalan di sesi VNC. Ini adalah mode "tinggalkan desktop Linux dengan Slack dan claw yang berjalan"; lane QA Slack bot-ke-bot tetap menjadi default saat `--gateway-setup` dihilangkan.

Input yang diperlukan untuk `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` untuk lane model jarak jauh. Jika hanya `OPENAI_API_KEY` yang disetel secara lokal, Mantis memetakannya ke `OPENCLAW_LIVE_OPENAI_KEY` sebelum memanggil Crabbox sehingga forwarding env `OPENCLAW_*` milik Crabbox dapat membawanya ke dalam VM.

Dengan `--gateway-setup --credential-source convex`, Mantis menyewa kredensial SUT Slack dari pool bersama sebelum membuat VM dan meneruskan id kanal yang disewa, token aplikasi Socket Mode, dan token bot sebagai env runtime `OPENCLAW_MANTIS_SLACK_*` di dalam desktop. Ini menjaga workflow GitHub tetap tipis: workflow hanya membutuhkan secret broker Convex, bukan token bot atau aplikasi Slack mentah.

Flag desktop Slack yang berguna:

- `--lease-id <cbx_...>` menjalankan ulang terhadap mesin tempat operator sudah login ke Slack Web melalui VNC.
- `--gateway-setup` memulai Gateway Slack OpenClaw persisten di VM, bukan hanya menjalankan lane QA bot-ke-bot.
- `--keep-lease` menjaga VM Gateway tetap terbuka untuk inspeksi VNC setelah berhasil; `--no-keep-lease` menghentikannya setelah mengumpulkan artefak.
- `--slack-url <url>` membuka URL Slack Web tertentu. Tanpanya, Mantis menurunkan `https://app.slack.com/client/<team>/<channel>` dari Slack `auth.test` saat token bot SUT tersedia.
- `--slack-channel-id <id>` mengontrol allowlist kanal Slack yang digunakan oleh setup Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` mengontrol profil Chrome persisten di dalam VM. Default-nya adalah `$HOME/.config/openclaw-mantis/slack-chrome-profile`, sehingga login Slack Web manual bertahan pada rerun di lease yang sama.
- `--credential-source convex --credential-role ci` menggunakan pool kredensial bersama, bukan token env Slack langsung.
- `--provider-mode`, `--model`, `--alt-model`, dan `--fast` diteruskan ke lane live Slack.

Workflow smoke GitHub adalah `Mantis Discord Smoke`. Workflow GitHub sebelum dan sesudah untuk skenario nyata pertama adalah `Mantis Discord Status Reactions`. Workflow ini menerima:

- `baseline_ref`: ref yang diharapkan mereproduksi perilaku hanya queued.
- `candidate_ref`: ref yang diharapkan menampilkan `queued -> thinking -> done`.

Workflow ini men-checkout ref harness workflow, membangun worktree baseline dan kandidat terpisah, menjalankan `discord-status-reactions-tool-only` terhadap setiap worktree, dan mengunggah `baseline/`, `candidate/`, `comparison.json`, dan `mantis-report.md` sebagai artefak Actions. Workflow juga merender HTML timeline setiap lane di browser desktop Crabbox dan menerbitkan tangkapan layar VNC tersebut di samping PNG timeline deterministik dalam komentar PR. Komentar PR yang sama menyematkan pratinjau GIF ringan yang dipangkas berdasarkan gerakan dan dibuat oleh `crabbox media preview`, menautkan ke klip MP4 terkait yang dipangkas berdasarkan gerakan, serta mempertahankan file MP4 desktop penuh untuk inspeksi mendalam. Tangkapan layar tetap inline untuk tinjauan cepat. Workflow membangun CLI Crabbox dari main `openclaw/crabbox` sehingga dapat menggunakan flag lease desktop/browser saat ini sebelum rilis biner Crabbox berikutnya dibuat.

`Mantis Scenario` adalah entrypoint manual generik. Ini menerima `scenario_id`, `candidate_ref`, `baseline_ref` opsional, dan `pr_number` opsional, lalu mengirim workflow yang dimiliki skenario. Wrapper ini sengaja tipis: workflow skenario tetap memiliki setup transport, kredensial, kelas VM, oracle yang diharapkan, dan manifest artefaknya sendiri.

`Mantis Slack Desktop Smoke` adalah workflow VM Slack pertama. Workflow ini melakukan checkout
ref kandidat tepercaya di worktree terpisah, menyewa desktop Linux Crabbox,
menjalankan `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` terhadap
kandidat tersebut, membuka Slack Web di browser VNC, merekam desktop, membuat
pratinjau yang dipangkas berdasarkan gerakan dengan `crabbox media preview`, mengunggah direktori
artefak lengkap, dan secara opsional memposting komentar bukti inline pada PR target.
Secara default, workflow ini menggunakan AWS untuk sewa desktop dan menyediakan input penyedia manual agar
operator dapat beralih ke Hetzner saat kapasitas AWS lambat atau tidak tersedia. Gunakan
lane ini saat Anda menginginkan "desktop Linux dengan Slack dan claw yang berjalan" alih-alih
hanya transkrip Slack bot-ke-bot.

`Mantis Telegram Live` membungkus lane QA live Telegram yang sudah ada dalam pipeline
bukti PR yang sama. Workflow ini melakukan checkout ref kandidat tepercaya di worktree
terpisah, menjalankan `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, menulis manifes `mantis-evidence.json` dari ringkasan QA
Telegram dan artefak pesan yang diamati, merender HTML transkrip yang telah disamarkan
melalui browser desktop Crabbox, membuat GIF yang dipangkas berdasarkan gerakan
dengan `crabbox media preview`, dan memposting komentar bukti PR inline saat nomor PR
tersedia. Lane ini bersifat visual-transkrip, bukan bukti Telegram Web yang login:
Telegram Bot API memberikan bukti pesan live yang stabil, tetapi status login
Telegram Web tidak diperlukan untuk otomatisasi Mantis normal.

`Mantis Telegram Desktop Proof` adalah wrapper sebelum/sesudah agentic untuk Telegram Desktop
native. Maintainer dapat memicunya dari komentar PR dengan
`@Mantis telegram desktop proof`, dari UI Actions dengan instruksi bebas,
atau melalui dispatcher generik `Mantis Scenario`. Workflow ini
menyerahkan PR, ref baseline, ref kandidat, dan instruksi maintainer kepada Codex.
Agen membaca PR, memutuskan perilaku yang terlihat di Telegram untuk membuktikan
perubahan, menjalankan lane bukti Telegram Desktop Crabbox pengguna nyata untuk baseline dan
kandidat, mengiterasi sampai GIF native berguna, menulis artefak
`motionPreview` berpasangan ke dalam `mantis-evidence.json`, mengunggah bundel, dan
memposting tabel bukti PR 2 kolom saat nomor PR tersedia.

Untuk setup Telegram desktop dengan human-in-the-loop, gunakan pembuat skenario:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Builder menyewa atau menggunakan kembali desktop Crabbox, menginstal biner native Linux
Telegram Desktop, secara opsional memulihkan arsip sesi pengguna, mengonfigurasi
OpenClaw dengan token bot SUT Telegram yang disewa, memulai `openclaw gateway run`
pada port `38974`, memposting pesan kesiapan driver-bot ke grup privat yang disewa,
lalu menangkap tangkapan layar dan MP4 dari desktop VNC yang terlihat. Token bot
tidak pernah login ke Telegram Desktop; token itu hanya mengonfigurasi OpenClaw. Viewer desktop
adalah sesi pengguna Telegram terpisah yang dipulihkan dari
`--telegram-profile-archive-env <name>` atau dibuat secara manual melalui VNC dan dijaga
tetap aktif dengan `--keep-lease`.

Flag builder desktop Telegram yang berguna:

- `--lease-id <cbx_...>` menjalankan ulang terhadap VM tempat operator sudah login ke Telegram Desktop.
- `--telegram-profile-archive-env <name>` membaca arsip profil Telegram Desktop `.tgz` base64 dari env var tersebut dan memulihkannya sebelum peluncuran.
- `--telegram-profile-dir <remote-path>` mengontrol direktori profil Telegram Desktop jarak jauh. Default-nya adalah `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` menginstal dan membuka Telegram Desktop tanpa mengonfigurasi OpenClaw.
- `--credential-source convex --credential-role ci` menggunakan broker kredensial bersama, bukan token env Telegram langsung.

Setiap skenario yang memublikasikan PR menulis `mantis-evidence.json` di sebelah laporannya.
Skema ini adalah handoff antara kode skenario dan komentar GitHub:

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

- `timeline`: tangkapan layar skenario deterministik, biasanya sebelum/sesudah.
- `desktopScreenshot`: tangkapan layar desktop VNC/browser.
- `motionPreview`: GIF animasi inline yang dibuat dari rekaman desktop.
- `motionClip`: MP4 yang dipangkas berdasarkan gerakan yang menghapus lead-in dan tail statis.
- `fullVideo`: rekaman MP4 lengkap untuk inspeksi mendalam.
- `metadata`: sidecar JSON/log.
- `report`: laporan Markdown.

Publisher yang dapat digunakan ulang adalah `scripts/mantis/publish-pr-evidence.mjs`. Workflow
memanggilnya dengan manifes, PR target, root target `qa-artifacts`, marker komentar,
URL artefak Actions, URL run, dan sumber permintaan. Publisher menyalin artefak yang dideklarasikan
ke branch `qa-artifacts`, membuat komentar PR dengan ringkasan terlebih dahulu yang berisi gambar/pratinjau
inline dan video tertaut, lalu memperbarui komentar marker yang ada atau
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

QA live Telegram juga dapat dipicu dari komentar PR:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Secara default, pemicu ini menggunakan SHA head PR saat ini sebagai kandidat dan menjalankan
`telegram-status-command`. Maintainer dapat menimpa `candidate=...`,
`provider=aws|hetzner`, dan `lease=<cbx_...>` saat membutuhkan ref tertentu atau
desktop Crabbox yang sudah dipanaskan sebelumnya.

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
3. Siapkan profil desktop/browser saat skenario membutuhkan bukti UI.
4. Siapkan checkout bersih untuk ref baseline.
5. Instal dependensi dan build hanya yang dibutuhkan skenario.
6. Mulai Gateway OpenClaw turunan dengan direktori state terisolasi.
7. Konfigurasikan transport live, penyedia, model, dan profil browser.
8. Jalankan skenario dan tangkap bukti baseline.
9. Hentikan gateway dan pertahankan log.
10. Siapkan ref kandidat di VM yang sama.
11. Jalankan skenario yang sama dan tangkap bukti kandidat.
12. Bandingkan hasil oracle dan bukti visual.
13. Tulis Markdown, JSON, log, tangkapan layar, dan artefak trace opsional.
14. Unggah artefak GitHub Actions.
15. Posting pesan status PR atau Discord yang ringkas.

Skenario harus dapat gagal dengan dua cara berbeda:

- **Bug direproduksi**: baseline gagal dengan cara yang diharapkan.
- **Kegagalan harness**: setup lingkungan, kredensial, Discord API, browser, atau
  penyedia gagal sebelum oracle bug bermakna.

Laporan akhir harus memisahkan kasus-kasus ini agar maintainer tidak mencampuradukkan lingkungan
yang flaky dengan perilaku produk.

## MVP Discord

Skenario pertama harus menargetkan reaksi status Discord di channel guild tempat
mode pengiriman balasan sumber adalah `message_tool_only`.

Mengapa ini adalah seed Mantis yang baik:

- Ini terlihat di Discord sebagai reaksi pada pesan pemicu.
- Ini memiliki oracle REST yang kuat melalui state reaksi pesan Discord.
- Ini menguji Gateway OpenClaw nyata, auth bot Discord, pengiriman pesan,
  mode pengiriman balasan sumber, state reaksi status, dan siklus hidup giliran model.
- Cakupannya cukup sempit untuk menjaga implementasi pertama tetap jujur.

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

Bukti baseline harus menunjukkan reaksi pengakuan queued tetapi tidak ada
transisi siklus hidup dalam mode tool-only. Bukti kandidat harus menunjukkan reaksi status
siklus hidup berjalan saat `messages.statusReactions.enabled` secara eksplisit
true.

Slice pertama yang dapat dieksekusi adalah skenario QA live Discord opt-in:

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
melakukan polling pesan pemicu Discord nyata dan mengharapkan urutan yang diamati
`👀 -> 🤔 -> 👍`. Artefak mencakup `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`, dan
`discord-status-reactions-tool-only-timeline.png`.

## Komponen QA yang ada

Mantis harus dibangun di atas stack QA privat yang sudah ada, bukan memulai dari
nol:

- `pnpm openclaw qa discord` sudah menjalankan lane Discord live dengan bot driver dan
  SUT.
- Runner transport live sudah menulis laporan dan artefak observed-message
  di bawah `.artifacts/qa-e2e/`.
- Sewa kredensial Convex sudah menyediakan akses eksklusif ke kredensial transport live
  bersama.
- Layanan kontrol browser sudah mendukung tangkapan layar, snapshot,
  profil managed headless, dan profil CDP jarak jauh.
- QA Lab sudah memiliki UI debugger dan bus untuk pengujian berbentuk transport.

Implementasi Mantis pertama dapat berupa runner sebelum/sesudah tipis di atas komponen-komponen
ini, ditambah satu lapisan bukti visual.

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
Markdown adalah untuk komentar PR dan ulasan manusia.

Ringkasan harus mencakup:

- ref dan SHA yang diuji
- transport dan id skenario
- penyedia mesin dan id mesin atau id sewa
- sumber kredensial tanpa nilai rahasia
- hasil baseline
- hasil kandidat
- apakah bug direproduksi pada baseline
- apakah kandidat memperbaikinya
- path artefak
- masalah setup atau cleanup yang telah disanitasi

Tangkapan layar adalah bukti, bukan rahasia. Namun, tetap diperlukan disiplin redaksi:
nama channel privat, nama pengguna, atau konten pesan dapat muncul. Untuk PR publik,
utamakan tautan artefak GitHub Actions dibandingkan gambar inline sampai strategi
redaksinya lebih kuat.

## Browser dan VNC

Jalur browser memiliki dua mode:

- **Otomasi headless**: default untuk CI. Chrome berjalan dengan CDP diaktifkan, dan
  Playwright atau kontrol browser OpenClaw menangkap tangkapan layar.
- **Penyelamatan VNC**: diaktifkan pada VM yang sama saat login, MFA, anti-otomasi Discord,
  atau debugging visual memerlukan manusia.

Profil browser pengamat Discord harus cukup persisten agar tidak perlu
login pada setiap run, tetapi terisolasi dari status browser pribadi. Sebuah profil
milik pool mesin Mantis, bukan laptop developer.

Saat Mantis macet, ia memposting pesan status Discord dengan:

- id run
- id skenario
- penyedia mesin
- direktori artefak
- instruksi koneksi VNC atau noVNC jika tersedia
- teks pemblokir singkat

Deployment privat pertama dapat memposting pesan ini ke channel operator yang ada
dan berpindah ke channel Mantis khusus nanti.

## Mesin

Mantis sebaiknya mengutamakan AWS melalui Crabbox untuk implementasi remote pertama.
Crabbox memberi kita mesin yang sudah dipanaskan, pelacakan lease, hidrasi, log, hasil, dan
pembersihan. Jika kapasitas AWS terlalu lambat atau tidak tersedia, tambahkan penyedia Hetzner
di balik antarmuka mesin yang sama.

Persyaratan minimum VM:

- Linux dengan instalasi Chrome atau Chromium yang mendukung desktop
- akses CDP untuk otomasi browser
- VNC atau noVNC untuk penyelamatan
- Node 22 dan pnpm
- checkout OpenClaw dan cache dependensi
- cache browser Playwright Chromium saat Playwright digunakan
- CPU dan memori yang cukup untuk satu OpenClaw Gateway, satu browser, dan satu run model
- akses keluar ke Discord, GitHub, penyedia model, dan broker kredensial

VM tidak boleh menyimpan rahasia mentah berumur panjang di luar penyimpanan kredensial atau
profil browser yang diharapkan.

## Rahasia

Rahasia berada di rahasia organisasi atau repositori GitHub untuk run remote, dan di
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

Jangka panjang, pool kredensial Convex harus tetap menjadi sumber normal untuk kredensial
transport live. Rahasia GitHub melakukan bootstrap broker dan jalur fallback.
Workflow reaksi status Discord memetakan rahasia Mantis Crabbox kembali ke
variabel lingkungan `CRABBOX_COORDINATOR` dan `CRABBOX_COORDINATOR_TOKEN`
yang diharapkan CLI Crabbox. Nama rahasia GitHub `CRABBOX_*` biasa tetap
diterima sebagai fallback kompatibilitas.

Runner Mantis tidak boleh pernah mencetak:

- token bot Discord
- kunci API penyedia
- cookie browser
- konten profil auth
- kata sandi VNC
- payload kredensial mentah

Unggahan artefak publik juga harus meredaksi metadata target Discord seperti id bot,
guild, channel, dan pesan. Workflow smoke GitHub mengaktifkan
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` karena alasan ini.

Jika token tidak sengaja ditempelkan ke issue, PR, chat, atau log, rotasikan token tersebut
setelah rahasia baru disimpan.

## Artefak GitHub dan komentar PR

Workflow Mantis harus mengunggah bundel bukti lengkap sebagai artefak Actions
berumur pendek. Saat workflow dijalankan untuk laporan bug atau PR perbaikan, workflow juga
harus memublikasikan tangkapan layar PNG yang sudah diredaksi ke branch `qa-artifacts` dan melakukan upsert
komentar pada bug atau PR perbaikan tersebut dengan tangkapan layar sebelum/sesudah inline. Jangan memposting
bukti utama hanya pada PR otomasi QA generik. Log mentah, pesan yang diamati,
dan bukti besar lainnya tetap berada di artefak Actions.

Workflow produksi harus memposting komentar tersebut dengan GitHub App Mantis, bukan
dengan `github-actions[bot]`. Simpan app id dan private key sebagai rahasia
GitHub Actions `MANTIS_GITHUB_APP_ID` dan `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow menggunakan marker tersembunyi sebagai kunci upsert, memperbarui
komentar tersebut saat token dapat mengeditnya, dan membuat komentar baru milik Mantis saat
marker lama milik bot tidak dapat diedit.

Komentar PR harus singkat dan visual:

```md
QA Reaksi Status Discord Mantis

Ringkasan: Mantis menjalankan ulang bug reaksi status Discord yang dilaporkan terhadap baseline buruk
yang diketahui dan perbaikan kandidat. Baseline mereproduksi bug, sementara
kandidat menampilkan urutan queued -> thinking -> done yang diharapkan.

- Skenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artefak: <artifact link>
- Baseline: `<status>` pada `<sha>`
- Kandidat: `<status>` pada `<sha>`

| Baseline            | Kandidat            |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Saat run gagal karena harness gagal, komentar harus menyatakan hal itu
alih-alih menyiratkan bahwa kandidat gagal.

## Catatan deployment privat

Deployment privat mungkin sudah memiliki aplikasi Discord Mantis. Gunakan kembali
aplikasi tersebut daripada membuat app lain saat app itu memiliki izin bot
yang tepat dan dapat dirotasi dengan aman.

Atur channel notifikasi operator awal melalui rahasia atau konfigurasi deployment.
Channel tersebut dapat menunjuk ke channel maintainer atau operasi yang sudah ada
terlebih dahulu, lalu berpindah ke channel Mantis khusus setelah channel itu ada.

Jangan memasukkan id guild, id channel, token bot, cookie browser, atau kata sandi VNC
ke dokumen ini. Simpan semuanya di rahasia GitHub, broker kredensial, atau
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

- status reaksi Discord untuk bug reaksi
- referensi pesan Discord untuk bug threading
- ts thread Slack dan status API reaksi untuk bug Slack
- id dan header pesan email untuk bug email
- tangkapan layar browser saat UI adalah satu-satunya hal teramati yang andal

Pemeriksaan vision harus bersifat aditif. Jika API platform dapat membuktikan bug, gunakan
API sebagai oracle lulus/gagal dan simpan tangkapan layar untuk keyakinan manusia.

## Ekspansi penyedia

Setelah Discord, runner yang sama dapat menambahkan:

- Slack: reaksi, thread, app mention, modal, unggahan file.
- Email: auth Gmail dan threading pesan menggunakan `gog` saat connector tidak
  cukup.
- WhatsApp: login QR, identifikasi ulang, pengiriman pesan, media, reaksi.
- Telegram: gating mention grup, perintah, reaksi jika tersedia.
- Matrix: room terenkripsi, relasi thread atau balasan, resume setelah restart.

Setiap transport harus memiliki satu skenario smoke murah dan satu atau beberapa skenario kelas bug.
Skenario visual yang mahal harus tetap opt-in.

## Pertanyaan terbuka

- Bot Discord mana yang harus menjadi driver, dan mana yang harus menjadi SUT, saat
  bot Mantis yang ada digunakan kembali?
- Apakah login browser pengamat harus menggunakan akun Discord manusia, akun uji,
  atau hanya bukti REST yang dapat dibaca bot untuk fase pertama?
- Berapa lama GitHub harus menyimpan artefak Mantis untuk PR?
- Kapan ClawSweeper harus secara otomatis merekomendasikan Mantis alih-alih menunggu
  perintah maintainer?
- Apakah tangkapan layar harus diredaksi atau dipotong sebelum diunggah untuk PR publik?
