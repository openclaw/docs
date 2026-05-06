---
read_when:
    - Mengonfigurasi safe bins atau profil safe-bin khusus
    - Meneruskan persetujuan ke Slack/Discord/Telegram atau saluran obrolan lainnya
    - Mengimplementasikan klien persetujuan natif untuk saluran
summary: 'Persetujuan exec tingkat lanjut: bin aman, pengikatan interpreter, penerusan persetujuan, pengiriman asli'
title: Persetujuan eksekusi — lanjutan
x-i18n:
    generated_at: "2026-05-06T09:30:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Topik lanjutan persetujuan exec: jalur cepat `safeBins`, pengikatan interpreter/runtime, dan penerusan persetujuan ke saluran chat (termasuk pengiriman native). Untuk kebijakan inti dan alur persetujuan, lihat [Persetujuan exec](/id/tools/exec-approvals).

## Bin aman (hanya stdin)

`tools.exec.safeBins` mendefinisikan daftar kecil binary **hanya stdin** (misalnya `cut`) yang dapat berjalan dalam mode daftar izin **tanpa** entri daftar izin eksplisit. Bin aman menolak argumen file posisional dan token mirip path, sehingga hanya dapat beroperasi pada stream masuk. Perlakukan ini sebagai jalur cepat sempit untuk filter stream, bukan daftar kepercayaan umum.

<Warning>
Jangan **tambahkan** binary interpreter atau runtime (misalnya `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) ke `safeBins`. Jika sebuah perintah dapat mengevaluasi kode, menjalankan subperintah, atau membaca file secara bawaan, utamakan entri daftar izin eksplisit dan tetap aktifkan prompt persetujuan. Bin aman kustom harus mendefinisikan profil eksplisit di `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bin aman default:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak ada dalam daftar default. Jika Anda ikut mengaktifkannya, pertahankan entri daftar izin eksplisit untuk workflow non-stdin mereka. Untuk `grep` dalam mode bin aman, berikan pola dengan `-e`/`--regexp`; bentuk pola posisional ditolak sehingga operand file tidak dapat diselundupkan sebagai posisional ambigu.

### Validasi argv dan flag yang ditolak

Validasi bersifat deterministik hanya dari bentuk argv (tanpa pemeriksaan keberadaan filesystem host), yang mencegah perilaku oracle keberadaan file dari perbedaan izin/tolak. Opsi berorientasi file ditolak untuk bin aman default; opsi panjang divalidasi secara fail-closed (flag tidak dikenal dan singkatan ambigu ditolak).

Flag yang ditolak menurut profil bin aman:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bin aman juga memaksa token argv diperlakukan sebagai **teks literal** saat eksekusi (tanpa globbing dan tanpa ekspansi `$VARS`) untuk segmen hanya stdin, sehingga pola seperti `*` atau `$HOME/...` tidak dapat digunakan untuk menyelundupkan pembacaan file.

### Direktori binary tepercaya

Bin aman harus di-resolve dari direktori binary tepercaya (default sistem plus `tools.exec.safeBinTrustedDirs` opsional). Entri `PATH` tidak pernah otomatis dipercaya. Direktori tepercaya default sengaja minimal: `/bin`, `/usr/bin`. Jika executable bin aman Anda berada di path package-manager/pengguna (misalnya `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan secara eksplisit ke `tools.exec.safeBinTrustedDirs`.

### Rantai shell, wrapper, dan multiplexer

Rantai shell (`&&`, `||`, `;`) diizinkan ketika setiap segmen tingkat atas memenuhi daftar izin (termasuk bin aman atau izin otomatis skill). Redirection tetap tidak didukung dalam mode daftar izin. Substitusi perintah (`$()` / backtick) ditolak selama parsing daftar izin, termasuk di dalam tanda kutip ganda; gunakan tanda kutip tunggal jika Anda memerlukan teks literal `$()`.

Pada persetujuan aplikasi pendamping macOS, teks shell mentah yang berisi kontrol shell atau sintaks ekspansi (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan sebagai ketidakcocokan daftar izin kecuali binary shell itu sendiri ada dalam daftar izin.

Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override env berskala permintaan dikurangi menjadi daftar izin eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Untuk keputusan `allow-always` dalam mode daftar izin, wrapper dispatch yang dikenal (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) mempertahankan path executable dalam alih-alih path wrapper. Multiplexer shell (`busybox`, `toybox`) dibuka bungkusannya untuk applet shell (`sh`, `ash`, dll.) dengan cara yang sama. Jika wrapper atau multiplexer tidak dapat dibuka bungkusannya dengan aman, tidak ada entri daftar izin yang dipertahankan secara otomatis.

Jika Anda memasukkan interpreter seperti `python3` atau `node` ke daftar izin, utamakan `tools.exec.strictInlineEval=true` sehingga eval inline tetap memerlukan persetujuan eksplisit. Dalam mode ketat, `allow-always` tetap dapat mempertahankan invokasi interpreter/skrip yang jinak, tetapi pembawa inline-eval tidak dipertahankan secara otomatis.

### Bin aman versus daftar izin

| Topik | `tools.exec.safeBins` | Daftar izin (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Tujuan | Mengizinkan otomatis filter stdin sempit | Mempercayai executable tertentu secara eksplisit |
| Jenis pencocokan | Nama executable + kebijakan argv bin aman | Glob path executable yang di-resolve, atau glob nama perintah polos untuk perintah yang dipanggil via PATH |
| Cakupan argumen | Dibatasi oleh profil bin aman dan aturan token literal | Pencocokan path secara default; `argPattern` opsional dapat membatasi argv yang di-parse |
| Contoh umum | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, CLI kustom |
| Penggunaan terbaik | Transformasi teks berisiko rendah dalam pipeline | Alat apa pun dengan perilaku atau efek samping yang lebih luas |

Lokasi konfigurasi:

- `safeBins` berasal dari config (`tools.exec.safeBins` atau per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` berasal dari config (`tools.exec.safeBinTrustedDirs` atau per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` berasal dari config (`tools.exec.safeBinProfiles` atau per-agent `agents.list[].tools.exec.safeBinProfiles`). Kunci profil per-agent menimpa kunci global.
- Entri daftar izin berada di host-lokal `~/.openclaw/exec-approvals.json` di bawah `agents.<id>.allowlist` (atau melalui Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` memberi peringatan dengan `tools.exec.safe_bins_interpreter_unprofiled` ketika bin interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuat kerangka entri `safeBinProfiles.<bin>` kustom yang hilang sebagai `{}` (tinjau dan perketat setelahnya). Bin interpreter/runtime tidak dibuatkan kerangka secara otomatis.

Contoh profil kustom:
__OC_I18N_900000__
Jika Anda secara eksplisit mengikutsertakan `jq` ke `safeBins`, OpenClaw tetap menolak builtin `env` dalam mode bin aman sehingga `jq -n env` tidak dapat membuang environment proses host tanpa path daftar izin eksplisit atau prompt persetujuan.

## Perintah interpreter/runtime

Eksekusi interpreter/runtime yang didukung persetujuan sengaja konservatif:

- Konteks argv/cwd/env persis selalu diikat.
- Bentuk file skrip shell langsung dan file runtime langsung diikat secara best-effort ke satu snapshot file lokal konkret.
- Bentuk wrapper package-manager umum yang tetap di-resolve ke satu file lokal langsung (misalnya `pnpm exec`, `pnpm node`, `npm exec`, `npx`) dibuka bungkusannya sebelum pengikatan.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime (misalnya skrip paket, bentuk eval, rantai loader spesifik runtime, atau bentuk multi-file ambigu), eksekusi yang didukung persetujuan ditolak alih-alih mengklaim cakupan semantik yang tidak dimilikinya.
- Untuk workflow tersebut, utamakan sandboxing, batas host terpisah, atau daftar izin/workflow penuh tepercaya yang eksplisit tempat operator menerima semantik runtime yang lebih luas.

Ketika persetujuan diperlukan, alat exec langsung mengembalikan id persetujuan. Gunakan id tersebut untuk mengorelasikan event sistem kemudian (`Exec finished` / `Exec denied`). Jika tidak ada keputusan yang tiba sebelum timeout, permintaan diperlakukan sebagai timeout persetujuan dan dimunculkan sebagai alasan penolakan.

### Perilaku pengiriman tindak lanjut

Setelah exec async yang disetujui selesai, OpenClaw mengirim giliran `agent` tindak lanjut ke sesi yang sama.

- Jika target pengiriman eksternal yang valid ada (saluran yang dapat dikirim plus target `to`), pengiriman tindak lanjut menggunakan saluran tersebut.
- Dalam alur hanya webchat atau sesi internal tanpa target eksternal, pengiriman tindak lanjut tetap hanya sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal ketat tanpa saluran eksternal yang dapat di-resolve, permintaan gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada saluran eksternal yang dapat di-resolve, pengiriman diturunkan menjadi hanya sesi alih-alih gagal.

## Penerusan persetujuan ke saluran chat

Anda dapat meneruskan prompt persetujuan exec ke saluran chat apa pun (termasuk saluran plugin) dan menyetujuinya dengan `/approve`. Ini menggunakan pipeline pengiriman outbound normal.

Config:
__OC_I18N_900001__
Balas di chat:
__OC_I18N_900002__
Perintah `/approve` menangani persetujuan exec dan persetujuan plugin. Jika ID tidak cocok dengan persetujuan exec yang tertunda, ia secara otomatis memeriksa persetujuan plugin sebagai gantinya.

### Penerusan persetujuan Plugin

Penerusan persetujuan Plugin menggunakan pipeline pengiriman yang sama seperti persetujuan exec tetapi memiliki config independennya sendiri di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
__OC_I18N_900003__
Bentuk config identik dengan `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter`, dan `targets` bekerja dengan cara yang sama.

Saluran yang mendukung balasan interaktif bersama merender tombol persetujuan yang sama untuk persetujuan exec dan plugin. Saluran tanpa UI interaktif bersama kembali ke teks biasa dengan instruksi `/approve`.

### Persetujuan chat yang sama di saluran apa pun

Ketika permintaan persetujuan exec atau plugin berasal dari permukaan chat yang dapat dikirim, chat yang sama kini dapat menyetujuinya dengan `/approve` secara default. Ini berlaku untuk saluran seperti Slack, Matrix, dan Microsoft Teams selain alur Web UI dan terminal UI yang sudah ada.

Jalur perintah teks bersama ini menggunakan model autentikasi saluran normal untuk percakapan tersebut. Jika chat asal sudah dapat mengirim perintah dan menerima balasan, permintaan persetujuan tidak lagi memerlukan adapter pengiriman native terpisah hanya agar tetap tertunda.

Discord dan Telegram juga mendukung `/approve` di chat yang sama, tetapi saluran tersebut tetap menggunakan daftar penyetuju yang di-resolve untuk otorisasi bahkan ketika pengiriman persetujuan native dinonaktifkan.

Untuk Telegram dan klien persetujuan native lain yang memanggil Gateway secara langsung, fallback ini sengaja dibatasi pada kegagalan "persetujuan tidak ditemukan". Penolakan/kesalahan persetujuan exec yang nyata tidak diam-diam dicoba ulang sebagai persetujuan plugin.

### Pengiriman persetujuan native

Beberapa saluran juga dapat bertindak sebagai klien persetujuan native. Klien native menambahkan DM penyetuju, fanout chat asal, dan UX persetujuan interaktif spesifik saluran di atas alur `/approve` chat yang sama bersama.

Saat kartu/tombol persetujuan native tersedia, UI native tersebut adalah jalur utama
yang dihadapi agen. Agen juga tidak boleh menggemakan perintah chat biasa
`/approve` duplikat kecuali hasil alat mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur yang tersisa.

Jika klien persetujuan native dikonfigurasi tetapi tidak ada runtime native yang aktif untuk
kanal asal, OpenClaw tetap menampilkan prompt `/approve` lokal yang deterministik. Jika runtime native aktif dan mencoba pengiriman tetapi tidak ada
target yang menerima kartu, OpenClaw mengirim pemberitahuan fallback di chat yang sama dengan
perintah `/approve <id> <decision>` persis agar permintaan tetap dapat diselesaikan.

Model generik:

- kebijakan exec host tetap menentukan apakah persetujuan exec diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan chat lain
- `channels.<channel>.execApprovals` mengontrol apakah kanal tersebut bertindak sebagai klien persetujuan native

Klien persetujuan native mengaktifkan pengiriman DM-terlebih-dahulu secara otomatis ketika semua ini benar:

- kanal mendukung pengiriman persetujuan native
- pemberi persetujuan dapat di-resolve dari `execApprovals.approvers` eksplisit atau identitas
  pemilik seperti `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`

Setel `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Setel `enabled: true` untuk memaksanya
aktif ketika pemberi persetujuan dapat di-resolve. Pengiriman chat-asal publik tetap eksplisit melalui
`channels.<channel>.execApprovals.target`.

FAQ: [Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Klien persetujuan native ini menambahkan perutean DM dan fanout kanal opsional di atas alur
`/approve` chat-sama bersama dan tombol persetujuan bersama.

Perilaku bersama:

- Slack, Matrix, Microsoft Teams, dan chat serupa yang dapat dikirim menggunakan model auth kanal normal
  untuk `/approve` chat-sama
- ketika klien persetujuan native aktif otomatis, target pengiriman native default adalah DM pemberi persetujuan
- untuk Discord dan Telegram, hanya pemberi persetujuan yang di-resolve yang dapat menyetujui atau menolak
- pemberi persetujuan Discord dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- pemberi persetujuan Telegram dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- pemberi persetujuan Slack dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- tombol native Slack mempertahankan jenis id persetujuan, sehingga id `plugin:` dapat me-resolve persetujuan Plugin
  tanpa lapisan fallback lokal Slack kedua
- perutean DM/kanal native Matrix dan pintasan reaksi menangani persetujuan exec dan Plugin;
  otorisasi Plugin tetap berasal dari `channels.matrix.dm.allowFrom`
- prompt native Matrix menyertakan konten event kustom `com.openclaw.approval` pada event prompt pertama
  sehingga klien Matrix yang sadar OpenClaw dapat membaca status persetujuan terstruktur sementara klien standar
  mempertahankan fallback `/approve` teks biasa
- peminta tidak perlu menjadi pemberi persetujuan
- chat asal dapat menyetujui langsung dengan `/approve` ketika chat tersebut sudah mendukung perintah dan balasan
- tombol persetujuan Discord native merutekan berdasarkan jenis id persetujuan: id `plugin:` masuk
  langsung ke persetujuan Plugin, yang lain masuk ke persetujuan exec
- tombol persetujuan Telegram native mengikuti fallback exec-ke-Plugin terbatas yang sama seperti `/approve`
- ketika `target` native mengaktifkan pengiriman chat-asal, prompt persetujuan menyertakan teks perintah
- persetujuan exec tertunda kedaluwarsa setelah 30 menit secara default
- jika tidak ada UI operator atau klien persetujuan terkonfigurasi yang dapat menerima permintaan, prompt fallback ke `askFallback`

Perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory` menggunakan perutean
pemilik pribadi untuk prompt persetujuan dan hasil akhir. OpenClaw pertama-tama mencoba rute pribadi pada
permukaan yang sama tempat pemilik menjalankan perintah. Jika permukaan tersebut tidak memiliki rute pemilik pribadi, OpenClaw
fallback ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, sehingga perintah grup Discord
tetap dapat mengirim persetujuan dan hasil ke DM Telegram pemilik ketika Telegram adalah
antarmuka pribadi utama yang dikonfigurasi. Chat grup hanya menerima pengakuan singkat.

Telegram default ke DM pemberi persetujuan (`target: "dm"`). Anda dapat beralih ke `channel` atau `both` ketika Anda
ingin prompt persetujuan juga muncul di chat/topik Telegram asal. Untuk topik forum Telegram,
OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjut pasca-persetujuan.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Alur IPC macOS
__OC_I18N_900004__
Catatan keamanan:

- Mode soket Unix `0600`, token disimpan di `exec-approvals.json`.
- Pemeriksaan peer UID-sama.
- Challenge/response (nonce + token HMAC + hash permintaan) + TTL singkat.

## Terkait

- [Persetujuan exec](/id/tools/exec-approvals) — kebijakan inti dan alur persetujuan
- [Alat exec](/id/tools/exec)
- [Mode elevated](/id/tools/elevated)
- [Skills](/id/tools/skills) — perilaku auto-allow yang didukung skill
