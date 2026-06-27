---
read_when:
    - Mengonfigurasi safe bin atau profil safe-bin khusus
    - Meneruskan persetujuan ke Slack/Discord/Telegram atau saluran chat lainnya
    - Mengimplementasikan klien persetujuan native untuk sebuah channel
summary: 'Persetujuan exec lanjutan: biner aman, pengikatan interpreter, penerusan persetujuan, pengiriman asli'
title: Persetujuan eksekusi — lanjutan
x-i18n:
    generated_at: "2026-06-27T18:17:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Topik exec-approval lanjutan: fast-path `safeBins`, pengikatan interpreter/runtime,
dan penerusan persetujuan ke saluran chat (termasuk pengiriman native).
Untuk kebijakan inti dan alur persetujuan, lihat [Persetujuan exec](/id/tools/exec-approvals).

## Bin aman (hanya stdin)

`tools.exec.safeBins` mendefinisikan daftar kecil biner **hanya stdin** (misalnya
`cut`) yang dapat berjalan dalam mode daftar izin **tanpa** entri daftar izin
eksplisit. Bin aman menolak argumen file posisional dan token yang menyerupai path, sehingga
hanya dapat beroperasi pada stream masuk. Perlakukan ini sebagai fast-path sempit untuk
filter stream, bukan daftar kepercayaan umum.

<Warning>
Jangan tambahkan biner interpreter atau runtime (misalnya `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) ke `safeBins`. Jika sebuah perintah dapat mengevaluasi kode,
menjalankan subperintah, atau membaca file secara desain, gunakan entri daftar izin eksplisit
dan tetap aktifkan prompt persetujuan. Bin aman kustom harus mendefinisikan profil eksplisit
di `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bin aman bawaan:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak ada dalam daftar bawaan. Jika Anda mengikutsertakannya, tetap gunakan entri
daftar izin eksplisit untuk workflow non-stdin mereka. Untuk `grep` dalam mode bin aman,
berikan pola dengan `-e`/`--regexp`; bentuk pola posisional ditolak
agar operand file tidak dapat diselundupkan sebagai posisional ambigu.

### Validasi argv dan flag yang ditolak

Validasi deterministik hanya dari bentuk argv (tanpa pemeriksaan keberadaan sistem file host),
yang mencegah perilaku oracle keberadaan file dari perbedaan izinkan/tolak.
Opsi berorientasi file ditolak untuk bin aman bawaan; opsi panjang
divalidasi secara fail-closed (flag tidak dikenal dan singkatan ambigu
ditolak).

Flag yang ditolak berdasarkan profil bin aman:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bin aman juga memaksa token argv diperlakukan sebagai **teks literal** saat eksekusi
(tanpa globbing dan tanpa ekspansi `$VARS`) untuk segmen hanya stdin, sehingga pola
seperti `*` atau `$HOME/...` tidak dapat digunakan untuk menyelundupkan pembacaan file.

### Direktori biner tepercaya

Bin aman harus di-resolve dari direktori biner tepercaya (bawaan sistem ditambah
`tools.exec.safeBinTrustedDirs` opsional). Entri `PATH` tidak pernah otomatis dipercaya.
Direktori tepercaya bawaan sengaja dibuat minimal: `/bin`, `/usr/bin`. Jika
executable bin aman Anda berada di path pengelola paket/pengguna (misalnya
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan
secara eksplisit ke `tools.exec.safeBinTrustedDirs`.

### Chaining shell, wrapper, dan multiplexer

Chaining shell (`&&`, `||`, `;`) diizinkan ketika setiap segmen tingkat atas
memenuhi daftar izin (termasuk bin aman atau auto-allow skill). Redirection
tetap tidak didukung dalam mode daftar izin. Substitusi perintah (`$()` / backtick) ditolak
selama parsing daftar izin, termasuk di dalam tanda kutip ganda; gunakan tanda kutip tunggal
jika Anda membutuhkan teks literal `$()`.

Pada persetujuan companion-app macOS, teks shell mentah yang berisi sintaks kontrol atau
ekspansi shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan
sebagai luput dari daftar izin kecuali biner shell itu sendiri ada dalam daftar izin.

Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override env yang tercakup permintaan
dikurangi menjadi daftar izin eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Untuk keputusan `allow-always` dalam mode daftar izin, wrapper dispatch yang dikenal (`env`,
`flock`, `nice`, `nohup`, `stdbuf`, `timeout`) menyimpan path executable di dalamnya
alih-alih path wrapper. Multiplexer shell (`busybox`, `toybox`) dibuka untuk applet shell
(`sh`, `ash`, dll.) dengan cara yang sama. Jika wrapper atau multiplexer tidak dapat dibuka
dengan aman, tidak ada entri daftar izin yang disimpan secara otomatis.

Jika Anda memasukkan interpreter seperti `python3` atau `node` ke daftar izin, sebaiknya gunakan
`tools.exec.strictInlineEval=true` agar eval inline tetap memerlukan persetujuan eksplisit.
Dalam mode ketat, `allow-always` masih dapat menyimpan invocation interpreter/script yang aman,
tetapi pembawa inline-eval tidak disimpan secara otomatis.

### Bin aman versus daftar izin

| Topik | `tools.exec.safeBins` | Daftar izin (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Tujuan | Otomatis mengizinkan filter stdin sempit | Mempercayai executable tertentu secara eksplisit |
| Jenis pencocokan | Nama executable + kebijakan argv bin aman | Glob path executable yang di-resolve, atau glob nama perintah polos untuk perintah yang dipanggil lewat PATH |
| Cakupan argumen | Dibatasi oleh profil bin aman dan aturan token literal | Pencocokan path secara bawaan; `argPattern` opsional dapat membatasi argv yang diparsing |
| Contoh umum | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, CLI kustom |
| Penggunaan terbaik | Transformasi teks berisiko rendah dalam pipeline | Alat apa pun dengan perilaku atau efek samping yang lebih luas |

Lokasi konfigurasi:

- `safeBins` berasal dari config (`tools.exec.safeBins` atau per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` berasal dari config (`tools.exec.safeBinTrustedDirs` atau per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` berasal dari config (`tools.exec.safeBinProfiles` atau per-agent `agents.list[].tools.exec.safeBinProfiles`). Kunci profil per-agent menimpa kunci global.
- Entri daftar izin berada di file persetujuan lokal host di bawah `agents.<id>.allowlist` (atau melalui Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` memperingatkan dengan `tools.exec.safe_bins_interpreter_unprofiled` ketika bin interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuat scaffold entri kustom `safeBinProfiles.<bin>` yang hilang sebagai `{}` (tinjau dan perketat setelahnya). Bin interpreter/runtime tidak di-scaffold otomatis.

Contoh profil kustom:
__OC_I18N_900000__
Jika Anda secara eksplisit mengikutsertakan `jq` ke `safeBins`, OpenClaw tetap menolak builtin `env` dalam mode bin aman
sehingga `jq -n env` tidak dapat membuang environment proses host tanpa path daftar izin eksplisit
atau prompt persetujuan.

## Perintah interpreter/runtime

Run interpreter/runtime yang didukung persetujuan sengaja dibuat konservatif:

- Konteks argv/cwd/env persis selalu diikat.
- Bentuk file script shell langsung dan file runtime langsung diikat sebaik mungkin ke satu snapshot file lokal konkret.
- Bentuk wrapper pengelola paket umum yang tetap resolve ke satu file lokal langsung (misalnya
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) dibuka sebelum pengikatan.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime
  (misalnya script paket, bentuk eval, rantai loader khusus runtime, atau bentuk multi-file ambigu),
  eksekusi yang didukung persetujuan ditolak alih-alih mengklaim cakupan semantik yang tidak dimilikinya.
- Untuk workflow tersebut, gunakan sandboxing, batas host terpisah, atau daftar izin/workflow penuh tepercaya
  eksplisit ketika operator menerima semantik runtime yang lebih luas.

Saat persetujuan diperlukan, alat exec segera mengembalikan id persetujuan. Gunakan id tersebut untuk
mengorelasikan event sistem run yang disetujui kemudian (`Exec finished`, dan `Exec running` saat dikonfigurasi).
Jika tidak ada keputusan sebelum timeout, permintaan diperlakukan sebagai timeout persetujuan dan
ditampilkan sebagai penolakan perintah host terminal. Untuk persetujuan async main-agent dengan
sesi asal, OpenClaw juga melanjutkan sesi tersebut dengan followup internal agar agent mengamati bahwa
perintah tidak berjalan alih-alih kemudian memperbaiki hasil yang hilang.

### Perilaku pengiriman followup

Setelah exec async yang disetujui selesai, OpenClaw mengirim giliran `agent` followup ke sesi yang sama.
Persetujuan async yang ditolak menggunakan path followup sesi utama yang sama untuk status penolakan, tetapi tidak
mendaftarkan handoff runtime yang ditingkatkan dan tidak menjalankan perintah. Penolakan tanpa sesi utama
yang dapat dilanjutkan disembunyikan atau dilaporkan melalui rute langsung yang aman ketika tersedia.

- Jika target pengiriman eksternal yang valid ada (saluran deliverable plus target `to`), pengiriman followup menggunakan saluran tersebut.
- Dalam alur webchat-only atau sesi internal tanpa target eksternal, pengiriman followup tetap hanya sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal ketat tanpa saluran eksternal yang dapat di-resolve, permintaan gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada saluran eksternal yang dapat di-resolve, pengiriman diturunkan menjadi hanya sesi alih-alih gagal.

## Penerusan persetujuan ke saluran chat

Anda dapat meneruskan prompt persetujuan exec ke saluran chat apa pun (termasuk saluran plugin) dan menyetujuinya
dengan `/approve`. Ini menggunakan pipeline pengiriman outbound normal.

Config:
__OC_I18N_900001__
Balas di chat:
__OC_I18N_900002__
Perintah `/approve` menangani persetujuan exec dan persetujuan plugin. Jika ID tidak cocok dengan persetujuan exec yang tertunda, perintah ini otomatis memeriksa persetujuan plugin sebagai gantinya.

### Penerusan persetujuan plugin

Penerusan persetujuan plugin menggunakan pipeline pengiriman yang sama dengan persetujuan exec tetapi memiliki
config independennya sendiri di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
Untuk perilaku pembuatan plugin, field permintaan, dan semantik keputusan, lihat
[Permintaan izin plugin](/plugins/plugin-permission-requests).
__OC_I18N_900003__
Bentuk config identik dengan `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, dan `targets` bekerja dengan cara yang sama.

Saluran yang mendukung balasan interaktif bersama merender tombol persetujuan yang sama untuk persetujuan exec dan
plugin. Saluran tanpa UI interaktif bersama fallback ke teks biasa dengan instruksi `/approve`.
Permintaan persetujuan plugin dapat membatasi keputusan yang tersedia. Permukaan persetujuan menggunakan set keputusan
yang dideklarasikan permintaan, dan Gateway menolak upaya untuk mengirim keputusan yang tidak ditawarkan.

### Persetujuan di chat yang sama pada saluran apa pun

Saat permintaan persetujuan exec atau plugin berasal dari permukaan chat yang deliverable, chat yang sama
sekarang dapat menyetujuinya dengan `/approve` secara bawaan. Ini berlaku untuk saluran seperti Slack, Matrix, dan
Microsoft Teams selain alur Web UI dan UI terminal yang sudah ada.

Jalur perintah teks bersama ini menggunakan model autentikasi channel normal untuk percakapan tersebut. Jika chat
asal sudah dapat mengirim perintah dan menerima balasan, permintaan persetujuan tidak lagi memerlukan
adapter pengiriman native terpisah hanya agar tetap tertunda.

Discord dan Telegram juga mendukung `/approve` dalam chat yang sama, tetapi channel tersebut tetap menggunakan
daftar pemberi persetujuan yang telah diselesaikan untuk otorisasi meskipun pengiriman persetujuan native dinonaktifkan.

Untuk Telegram dan klien persetujuan native lain yang memanggil Gateway secara langsung,
fallback ini sengaja dibatasi pada kegagalan "approval not found". Penolakan/kesalahan
persetujuan exec yang nyata tidak diam-diam dicoba ulang sebagai persetujuan Plugin.

### Pengiriman persetujuan native

Beberapa channel juga dapat bertindak sebagai klien persetujuan native. Klien native menambahkan DM pemberi persetujuan, fanout chat asal,
dan UX persetujuan interaktif khusus channel di atas alur `/approve` bersama dalam chat yang sama.

Saat kartu/tombol persetujuan native tersedia, UI native tersebut adalah jalur utama
yang menghadap agent. Agent juga tidak boleh menggemakan perintah chat biasa
`/approve` duplikat kecuali hasil tool menyatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur yang tersisa.

Jika klien persetujuan native dikonfigurasi tetapi tidak ada runtime native yang aktif untuk
channel asal, OpenClaw tetap menampilkan prompt `/approve`
lokal deterministik. Jika runtime native aktif dan mencoba pengiriman tetapi tidak ada
target yang menerima kartu, OpenClaw mengirim pemberitahuan fallback dalam chat yang sama dengan
perintah persis `/approve <id> <decision>` agar permintaan tetap dapat diselesaikan.

Model generik:

- kebijakan exec host tetap menentukan apakah persetujuan exec diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan chat lain
- `channels.<channel>.execApprovals` mengontrol apakah klien native khusus channel seperti Discord, Slack, Telegram, dan sejenisnya
  diaktifkan
- persetujuan Plugin Slack dapat menggunakan klien persetujuan native Slack saat permintaan berasal dari Slack
  dan pemberi persetujuan Plugin Slack berhasil diselesaikan; `approvals.plugin` juga dapat merutekan persetujuan Plugin ke sesi
  atau target Slack meskipun persetujuan exec Slack dinonaktifkan
- kartu persetujuan native Google Chat menangani persetujuan exec dan Plugin yang berasal dari ruang atau thread Google
  Chat saat pemberi persetujuan `users/<id>` yang stabil diselesaikan dari `dm.allowFrom` atau
  `defaultTo`; kartu tersebut tidak menggunakan event reaksi untuk keputusan
- pengiriman persetujuan reaksi WhatsApp dan Signal dikendalikan oleh `approvals.exec` dan
  `approvals.plugin`; keduanya tidak memiliki blok `channels.<channel>.execApprovals`

Klien persetujuan native otomatis mengaktifkan pengiriman DM terlebih dahulu saat semua ini benar:

- channel mendukung pengiriman persetujuan native
- pemberi persetujuan dapat diselesaikan dari `execApprovals.approvers` eksplisit atau identitas
  pemilik seperti `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`

Setel `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Setel `enabled: true` untuk memaksanya
aktif saat pemberi persetujuan berhasil diselesaikan. Pengiriman chat asal publik tetap eksplisit melalui
`channels.<channel>.execApprovals.target`.

FAQ: [Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Google Chat: konfigurasikan pemberi persetujuan stabil dengan `channels.googlechat.dm.allowFrom` atau
  `channels.googlechat.defaultTo`; blok `execApprovals` tidak diperlukan
- WhatsApp: gunakan `approvals.exec` dan `approvals.plugin` untuk merutekan prompt persetujuan ke WhatsApp
- Signal: gunakan `approvals.exec` dan `approvals.plugin` untuk merutekan prompt persetujuan ke Signal

Klien persetujuan native ini menambahkan perutean DM dan fanout channel opsional di atas alur
`/approve` bersama dalam chat yang sama dan tombol persetujuan bersama.

Perilaku bersama:

- Slack, Matrix, Microsoft Teams, dan chat terkirim serupa menggunakan model autentikasi channel normal
  untuk `/approve` dalam chat yang sama
- saat klien persetujuan native otomatis aktif, target pengiriman native default adalah DM pemberi persetujuan
- untuk Discord dan Telegram, hanya pemberi persetujuan yang telah diselesaikan yang dapat menyetujui atau menolak
- pemberi persetujuan Discord dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- pemberi persetujuan Telegram dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- pemberi persetujuan Slack dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- DM persetujuan Plugin Slack menggunakan pemberi persetujuan Plugin Slack dari `allowFrom` dan perutean default
  akun, bukan pemberi persetujuan exec Slack
- tombol native Slack mempertahankan jenis id persetujuan, sehingga id `plugin:` dapat menyelesaikan persetujuan Plugin
  tanpa lapisan fallback lokal Slack kedua
- kartu native Google Chat mempertahankan fallback manual `/approve` dalam teks pesan, tetapi callback tombol kartu
  hanya membawa token tindakan buram; id persetujuan dan keputusan dipulihkan dari status tertunda sisi server
- persetujuan emoji WhatsApp menangani prompt exec dan Plugin hanya saat keluarga penerusan tingkat atas yang cocok
  diaktifkan dan dirutekan ke WhatsApp; penerusan WhatsApp khusus target tetap berada di
  jalur penerusan bersama kecuali cocok dengan target asal native yang sama
- persetujuan reaksi Signal menangani prompt exec dan Plugin hanya saat keluarga penerusan tingkat atas yang cocok
  diaktifkan dan dirutekan ke Signal. Persetujuan exec Signal langsung dalam chat yang sama dapat
  menekan fallback `/approve` lokal tanpa pemberi persetujuan eksplisit; resolusi reaksi Signal
  tetap memerlukan pemberi persetujuan Signal eksplisit dari `channels.signal.allowFrom` atau `defaultTo`.
- perutean DM/channel native Matrix dan pintasan reaksi menangani persetujuan exec dan Plugin;
  otorisasi Plugin tetap berasal dari `channels.matrix.dm.allowFrom`
- prompt native Matrix menyertakan konten event kustom `com.openclaw.approval` pada event prompt pertama
  agar klien Matrix yang sadar OpenClaw dapat membaca status persetujuan terstruktur sementara klien standar
  tetap mempertahankan fallback `/approve` teks biasa
- peminta tidak perlu menjadi pemberi persetujuan
- chat asal dapat menyetujui langsung dengan `/approve` saat chat tersebut sudah mendukung perintah dan balasan
- tombol persetujuan Discord native merutekan berdasarkan jenis id persetujuan: id `plugin:` langsung menuju
  persetujuan Plugin, yang lain menuju persetujuan exec
- tombol persetujuan Telegram native mengikuti fallback exec-ke-Plugin terbatas yang sama seperti `/approve`
- saat `target` native mengaktifkan pengiriman chat asal, prompt persetujuan menyertakan teks perintah
- persetujuan exec tertunda kedaluwarsa setelah 30 menit secara default
- jika tidak ada UI operator atau klien persetujuan yang dikonfigurasi yang dapat menerima permintaan, prompt jatuh kembali ke `askFallback`

Perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory` menggunakan perutean
pemilik privat untuk prompt persetujuan dan hasil akhir. OpenClaw pertama-tama mencoba rute privat pada
surface yang sama tempat pemilik menjalankan perintah. Jika surface tersebut tidak memiliki rute pemilik privat, OpenClaw
jatuh kembali ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, sehingga perintah grup Discord
tetap dapat mengirim persetujuan dan hasil ke DM Telegram pemilik saat Telegram adalah antarmuka privat
utama yang dikonfigurasi. Chat grup hanya mendapatkan pengakuan singkat.

Telegram default ke DM pemberi persetujuan (`target: "dm"`). Anda dapat beralih ke `channel` atau `both` saat
ingin prompt persetujuan juga muncul di chat/topik Telegram asal. Untuk topik forum Telegram,
OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjut pascapersetujuan.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Alur IPC macOS
__OC_I18N_900004__
Catatan keamanan:

- Mode soket Unix `0600`, token disimpan di `exec-approvals.json`.
- Pemeriksaan peer dengan UID yang sama.
- Challenge/response (nonce + token HMAC + hash permintaan) + TTL singkat.

## FAQ

### Kapan `accountId` dan `threadId` digunakan pada target persetujuan?

Gunakan `accountId` saat channel memiliki beberapa identitas yang dikonfigurasi dan prompt persetujuan harus
keluar melalui satu akun tertentu. Gunakan `threadId` saat tujuan mendukung topik atau
thread dan prompt harus tetap berada di dalam thread tersebut, bukan chat tingkat atas.

Kasus Telegram yang konkret adalah supergroup operasi dengan topik forum dan dua akun bot
Telegram. Nilai `to` menamai supergroup, `accountId` memilih akun bot, dan `threadId`
memilih topik forum:
__OC_I18N_900005__
Dengan penyiapan tersebut, persetujuan exec yang diteruskan diposting oleh akun Telegram `ops-bot` ke topik
`77` dari chat `-1001234567890`. Target tanpa `accountId` menggunakan akun default channel, dan
target tanpa `threadId` memposting ke tujuan tingkat atas.

### Saat persetujuan dikirim ke sesi, apakah siapa pun di sesi tersebut dapat menyetujuinya?

Tidak. Pengiriman sesi hanya mengontrol tempat prompt muncul. Itu sendiri tidak mengotorisasi setiap
peserta dalam chat tersebut untuk menyetujui.

Untuk `/approve` generik dalam chat yang sama, pengirim harus sudah diotorisasi untuk perintah dalam
sesi channel tersebut. Jika channel mengekspos pemberi persetujuan eksplisit, pemberi persetujuan tersebut dapat mengotorisasi
tindakan `/approve` meskipun mereka tidak diotorisasi untuk perintah lain dalam sesi tersebut.

Beberapa channel lebih ketat. Discord, Telegram, Matrix, DM persetujuan native Slack, dan klien
persetujuan native serupa menggunakan daftar pemberi persetujuan yang telah diselesaikan untuk otorisasi persetujuan. Misalnya,
prompt persetujuan topik forum Telegram dapat terlihat oleh semua orang dalam topik, tetapi hanya ID pengguna
Telegram numerik yang diselesaikan dari `channels.telegram.execApprovals.approvers` atau
`commands.ownerAllowFrom` yang dapat menyetujui atau menolaknya.

## Terkait

- [Persetujuan exec](/id/tools/exec-approvals) — kebijakan inti dan alur persetujuan
- [Tool exec](/id/tools/exec)
- [Mode elevated](/id/tools/elevated)
- [Skills](/id/tools/skills) — perilaku izin otomatis berbasis skill
