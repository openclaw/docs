---
read_when:
    - Mengonfigurasi bin aman atau profil bin aman kustom
    - Meneruskan persetujuan ke Slack/Discord/Telegram atau saluran chat lainnya
    - Mengimplementasikan klien persetujuan natif untuk saluran
summary: 'Persetujuan exec lanjutan: bin aman, pengikatan interpreter, penerusan persetujuan, pengiriman native'
title: Persetujuan eksekusi — lanjutan
x-i18n:
    generated_at: "2026-04-30T10:14:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8a72ca1d23e55dc198ae3c5ad55a57660c2111feebfb89f08d8fa9584e4337
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Topik lanjutan persetujuan exec: jalur cepat `safeBins`, pengikatan interpreter/runtime, dan penerusan persetujuan ke kanal chat (termasuk pengiriman native). Untuk kebijakan inti dan alur persetujuan, lihat [Persetujuan exec](/id/tools/exec-approvals).

## Safe bins (hanya stdin)

`tools.exec.safeBins` mendefinisikan daftar kecil biner **hanya stdin** (misalnya `cut`) yang dapat berjalan dalam mode allowlist **tanpa** entri allowlist eksplisit. Safe bins menolak argumen file posisional dan token yang menyerupai path, sehingga hanya dapat beroperasi pada stream masuk. Perlakukan ini sebagai jalur cepat sempit untuk filter stream, bukan daftar kepercayaan umum.

<Warning>
Jangan **pernah** menambahkan biner interpreter atau runtime (misalnya `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) ke `safeBins`. Jika sebuah perintah dapat mengevaluasi kode, menjalankan subperintah, atau membaca file berdasarkan desainnya, lebih baik gunakan entri allowlist eksplisit dan tetap aktifkan prompt persetujuan. Safe bins khusus harus mendefinisikan profil eksplisit di `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Safe bins default:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak ada dalam daftar default. Jika Anda ikut mengaktifkannya, pertahankan entri allowlist eksplisit untuk alur kerja non-stdin mereka. Untuk `grep` dalam mode safe-bin, berikan pola dengan `-e`/`--regexp`; bentuk pola posisional ditolak agar operand file tidak dapat diselundupkan sebagai posisional ambigu.

### Validasi argv dan flag yang ditolak

Validasi deterministik hanya dari bentuk argv (tanpa pemeriksaan keberadaan sistem file host), yang mencegah perilaku oracle keberadaan file dari perbedaan allow/deny. Opsi berorientasi file ditolak untuk safe bins default; opsi panjang divalidasi secara fail-closed (flag tidak dikenal dan singkatan ambigu ditolak).

Flag yang ditolak menurut profil safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins juga memaksa token argv diperlakukan sebagai **teks literal** pada waktu eksekusi (tanpa globbing dan tanpa ekspansi `$VARS`) untuk segmen hanya stdin, sehingga pola seperti `*` atau `$HOME/...` tidak dapat digunakan untuk menyelundupkan pembacaan file.

### Direktori biner tepercaya

Safe bins harus di-resolve dari direktori biner tepercaya (default sistem ditambah `tools.exec.safeBinTrustedDirs` opsional). Entri `PATH` tidak pernah otomatis dipercaya. Direktori tepercaya default sengaja minimal: `/bin`, `/usr/bin`. Jika executable safe-bin Anda berada di path package-manager/pengguna (misalnya `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan secara eksplisit ke `tools.exec.safeBinTrustedDirs`.

### Chaining shell, wrapper, dan multiplexer

Chaining shell (`&&`, `||`, `;`) diizinkan ketika setiap segmen tingkat atas memenuhi allowlist (termasuk safe bins atau skill auto-allow). Redirection tetap tidak didukung dalam mode allowlist. Substitusi perintah (`$()` / backticks) ditolak selama parsing allowlist, termasuk di dalam tanda kutip ganda; gunakan tanda kutip tunggal jika Anda membutuhkan teks literal `$()`.

Pada persetujuan companion-app macOS, teks shell mentah yang berisi sintaks kontrol shell atau ekspansi (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan sebagai allowlist miss kecuali biner shell itu sendiri masuk allowlist.

Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override env yang bersifat request-scoped dikurangi menjadi allowlist eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Untuk keputusan `allow-always` dalam mode allowlist, wrapper dispatch yang dikenal (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) mempertahankan path executable bagian dalam, bukan path wrapper. Multiplexer shell (`busybox`, `toybox`) di-unwrap untuk applet shell (`sh`, `ash`, dan seterusnya) dengan cara yang sama. Jika sebuah wrapper atau multiplexer tidak dapat di-unwrap dengan aman, tidak ada entri allowlist yang dipertahankan secara otomatis.

Jika Anda memasukkan interpreter seperti `python3` atau `node` ke allowlist, sebaiknya gunakan `tools.exec.strictInlineEval=true` agar inline eval tetap memerlukan persetujuan eksplisit. Dalam mode strict, `allow-always` masih dapat mempertahankan pemanggilan interpreter/script yang jinak, tetapi pembawa inline-eval tidak dipertahankan secara otomatis.

### Safe bins versus allowlist

| Topik            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Tujuan           | Mengizinkan otomatis filter stdin yang sempit          | Mempercayai executable tertentu secara eksplisit                                   |
| Jenis pencocokan | Nama executable + kebijakan argv safe-bin              | Glob path executable yang di-resolve, atau glob nama perintah polos untuk perintah yang dipanggil lewat PATH |
| Cakupan argumen  | Dibatasi oleh profil safe-bin dan aturan token literal | Hanya pencocokan path; argumen selain itu menjadi tanggung jawab Anda              |
| Contoh umum      | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI khusus                                      |
| Penggunaan terbaik | Transformasi teks berisiko rendah dalam pipeline     | Alat apa pun dengan perilaku atau efek samping yang lebih luas                     |

Lokasi konfigurasi:

- `safeBins` berasal dari konfigurasi (`tools.exec.safeBins` atau per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` berasal dari konfigurasi (`tools.exec.safeBinTrustedDirs` atau per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` berasal dari konfigurasi (`tools.exec.safeBinProfiles` atau per-agent `agents.list[].tools.exec.safeBinProfiles`). Kunci profil per-agent menimpa kunci global.
- Entri allowlist berada di `~/.openclaw/exec-approvals.json` lokal host di bawah `agents.<id>.allowlist` (atau melalui Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` memperingatkan dengan `tools.exec.safe_bins_interpreter_unprofiled` ketika biner interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuat scaffold entri `safeBinProfiles.<bin>` khusus yang hilang sebagai `{}` (tinjau dan perketat setelahnya). Biner interpreter/runtime tidak di-scaffold otomatis.

Contoh profil khusus:
__OC_I18N_900000__
Jika Anda secara eksplisit mengikutsertakan `jq` ke `safeBins`, OpenClaw tetap menolak builtin `env` dalam mode safe-bin sehingga `jq -n env` tidak dapat membuang environment proses host tanpa path allowlist eksplisit atau prompt persetujuan.

## Perintah interpreter/runtime

Eksekusi interpreter/runtime yang didukung persetujuan sengaja konservatif:

- Konteks argv/cwd/env yang tepat selalu diikat.
- Bentuk file script shell langsung dan file runtime langsung diikat secara best-effort ke satu snapshot file lokal konkret.
- Bentuk wrapper package-manager umum yang masih di-resolve ke satu file lokal langsung (misalnya `pnpm exec`, `pnpm node`, `npm exec`, `npx`) di-unwrap sebelum pengikatan.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime (misalnya package scripts, bentuk eval, rantai loader khusus runtime, atau bentuk multi-file ambigu), eksekusi yang didukung persetujuan ditolak alih-alih mengklaim cakupan semantik yang tidak dimilikinya.
- Untuk alur kerja tersebut, sebaiknya gunakan sandboxing, batas host terpisah, atau allowlist/alur kerja penuh tepercaya yang eksplisit tempat operator menerima semantik runtime yang lebih luas.

Ketika persetujuan diperlukan, alat exec segera mengembalikan id persetujuan. Gunakan id tersebut untuk mengorelasikan peristiwa sistem berikutnya (`Exec finished` / `Exec denied`). Jika tidak ada keputusan yang datang sebelum timeout, request diperlakukan sebagai timeout persetujuan dan ditampilkan sebagai alasan penolakan.

### Perilaku pengiriman tindak lanjut

Setelah exec async yang disetujui selesai, OpenClaw mengirim turn `agent` tindak lanjut ke sesi yang sama.

- Jika target pengiriman eksternal yang valid ada (kanal yang dapat dikirim plus target `to`), pengiriman tindak lanjut menggunakan kanal tersebut.
- Dalam alur webchat-only atau sesi internal tanpa target eksternal, pengiriman tindak lanjut tetap hanya sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal strict tanpa kanal eksternal yang dapat di-resolve, request gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada kanal eksternal yang dapat di-resolve, pengiriman diturunkan menjadi hanya sesi alih-alih gagal.

## Penerusan persetujuan ke kanal chat

Anda dapat meneruskan prompt persetujuan exec ke kanal chat apa pun (termasuk kanal Plugin) dan menyetujuinya dengan `/approve`. Ini menggunakan pipeline pengiriman keluar normal.

Konfigurasi:
__OC_I18N_900001__
Balas di chat:
__OC_I18N_900002__
Perintah `/approve` menangani persetujuan exec dan persetujuan Plugin. Jika ID tidak cocok dengan persetujuan exec yang tertunda, perintah ini otomatis memeriksa persetujuan Plugin sebagai gantinya.

### Penerusan persetujuan Plugin

Penerusan persetujuan Plugin menggunakan pipeline pengiriman yang sama seperti persetujuan exec tetapi memiliki konfigurasi independennya sendiri di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
__OC_I18N_900003__
Bentuk konfigurasi identik dengan `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter`, dan `targets` bekerja dengan cara yang sama.

Kanal yang mendukung balasan interaktif bersama menampilkan tombol persetujuan yang sama untuk persetujuan exec dan Plugin. Kanal tanpa UI interaktif bersama akan fallback ke teks biasa dengan instruksi `/approve`.

### Persetujuan di chat yang sama pada kanal apa pun

Ketika request persetujuan exec atau Plugin berasal dari permukaan chat yang dapat dikirim, chat yang sama kini dapat menyetujuinya dengan `/approve` secara default. Ini berlaku untuk kanal seperti Slack, Matrix, dan Microsoft Teams selain alur Web UI dan terminal UI yang sudah ada.

Jalur perintah teks bersama ini menggunakan model auth kanal normal untuk percakapan tersebut. Jika chat asal sudah dapat mengirim perintah dan menerima balasan, request persetujuan tidak lagi memerlukan adapter pengiriman native terpisah hanya agar tetap tertunda.

Discord dan Telegram juga mendukung `/approve` di chat yang sama, tetapi kanal tersebut tetap menggunakan daftar approver yang di-resolve untuk otorisasi meskipun pengiriman persetujuan native dinonaktifkan.

Untuk Telegram dan klien persetujuan native lain yang memanggil Gateway secara langsung, fallback ini sengaja dibatasi pada kegagalan "persetujuan tidak ditemukan". Penolakan/error persetujuan exec yang nyata tidak diam-diam dicoba ulang sebagai persetujuan Plugin.

### Pengiriman persetujuan native

Beberapa kanal juga dapat bertindak sebagai klien persetujuan native. Klien native menambahkan DM approver, fanout chat asal, dan UX persetujuan interaktif khusus kanal di atas alur `/approve` di chat yang sama yang bersifat bersama.

Saat kartu/tombol persetujuan native tersedia, UI native tersebut adalah jalur utama
yang dihadapi agen. Agen juga tidak boleh menggemakan perintah chat biasa
`/approve` duplikat kecuali hasil tool menyatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur yang tersisa.

Jika klien persetujuan native dikonfigurasi tetapi tidak ada runtime native yang aktif untuk
channel asal, OpenClaw tetap menampilkan prompt `/approve` lokal deterministik. Jika runtime native
aktif dan mencoba pengiriman tetapi tidak ada target yang menerima kartu, OpenClaw mengirim
pemberitahuan fallback di chat yang sama dengan perintah
`/approve <id> <decision>` persis agar permintaan tetap dapat diselesaikan.

Model generik:

- kebijakan exec host tetap menentukan apakah persetujuan exec diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan chat lain
- `channels.<channel>.execApprovals` mengontrol apakah channel tersebut bertindak sebagai klien persetujuan native

Klien persetujuan native otomatis mengaktifkan pengiriman yang mendahulukan DM ketika semua ini benar:

- channel mendukung pengiriman persetujuan native
- pemberi persetujuan dapat diselesaikan dari `execApprovals.approvers` eksplisit atau identitas
  pemilik seperti `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` belum diatur atau `"auto"`

Atur `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Atur `enabled: true` untuk memaksanya
aktif ketika pemberi persetujuan dapat diselesaikan. Pengiriman ke chat asal publik tetap eksplisit melalui
`channels.<channel>.execApprovals.target`.

FAQ: [Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Klien persetujuan native ini menambahkan perutean DM dan fanout channel opsional di atas alur
`/approve` chat yang sama bersama dan tombol persetujuan bersama.

Perilaku bersama:

- Slack, Matrix, Microsoft Teams, dan chat serupa yang dapat dikirimkan menggunakan model autentikasi channel normal
  untuk `/approve` chat yang sama
- ketika klien persetujuan native otomatis aktif, target pengiriman native default adalah DM pemberi persetujuan
- untuk Discord dan Telegram, hanya pemberi persetujuan yang terselesaikan yang dapat menyetujui atau menolak
- pemberi persetujuan Discord dapat bersifat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- pemberi persetujuan Telegram dapat bersifat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- pemberi persetujuan Slack dapat bersifat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- tombol native Slack mempertahankan jenis id persetujuan, sehingga id `plugin:` dapat menyelesaikan persetujuan plugin
  tanpa lapisan fallback lokal Slack kedua
- perutean DM/channel native Matrix dan pintasan reaksi menangani persetujuan exec dan plugin;
  otorisasi plugin tetap berasal dari `channels.matrix.dm.allowFrom`
- prompt native Matrix menyertakan konten event khusus `com.openclaw.approval` pada event prompt pertama
  sehingga klien Matrix yang sadar OpenClaw dapat membaca status persetujuan terstruktur sementara klien bawaan
  tetap mempertahankan fallback `/approve` teks biasa
- peminta tidak perlu menjadi pemberi persetujuan
- chat asal dapat menyetujui langsung dengan `/approve` ketika chat tersebut sudah mendukung perintah dan balasan
- tombol persetujuan Discord native dirutekan berdasarkan jenis id persetujuan: id `plugin:` langsung
  menuju persetujuan plugin, semua yang lain menuju persetujuan exec
- tombol persetujuan Telegram native mengikuti fallback exec-ke-plugin terbatas yang sama seperti `/approve`
- ketika `target` native mengaktifkan pengiriman ke chat asal, prompt persetujuan menyertakan teks perintah
- persetujuan exec tertunda kedaluwarsa setelah 30 menit secara default
- jika tidak ada UI operator atau klien persetujuan yang dikonfigurasi yang dapat menerima permintaan, prompt beralih ke fallback `askFallback`

Perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory` menggunakan perutean
pemilik privat untuk prompt persetujuan dan hasil akhir. OpenClaw pertama-tama mencoba rute privat pada
permukaan yang sama tempat pemilik menjalankan perintah. Jika permukaan tersebut tidak memiliki rute pemilik privat, OpenClaw
beralih ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, sehingga perintah grup Discord
tetap dapat mengirim persetujuan dan hasil ke DM Telegram milik pemilik ketika Telegram adalah
antarmuka privat utama yang dikonfigurasi. Chat grup hanya mendapatkan pengakuan singkat.

Telegram default ke DM pemberi persetujuan (`target: "dm"`). Anda dapat beralih ke `channel` atau `both` ketika Anda
ingin prompt persetujuan juga muncul di chat/topik Telegram asal. Untuk topik forum Telegram,
OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjut setelah persetujuan.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Alur IPC macOS
__OC_I18N_900004__
Catatan keamanan:

- Mode socket Unix `0600`, token disimpan di `exec-approvals.json`.
- Pemeriksaan peer UID yang sama.
- Challenge/response (nonce + token HMAC + hash permintaan) + TTL singkat.

## Terkait

- [Persetujuan exec](/id/tools/exec-approvals) — kebijakan inti dan alur persetujuan
- [Tool exec](/id/tools/exec)
- [Mode elevated](/id/tools/elevated)
- [Skills](/id/tools/skills) — perilaku izin otomatis berbasis skill
