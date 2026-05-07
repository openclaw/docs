---
read_when:
    - Mengonfigurasi bin aman atau profil bin aman kustom
    - Meneruskan persetujuan ke Slack/Discord/Telegram atau saluran obrolan lainnya
    - Mengimplementasikan klien persetujuan natif untuk saluran
summary: 'Persetujuan eksekusi tingkat lanjut: bin aman, pengikatan interpreter, penerusan persetujuan, pengiriman bawaan'
title: Persetujuan eksekusi — lanjutan
x-i18n:
    generated_at: "2026-05-07T01:54:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Topik lanjutan persetujuan exec: fast-path `safeBins`, pengikatan interpreter/runtime
dan penerusan persetujuan ke saluran chat (termasuk pengiriman native).
Untuk kebijakan inti dan alur persetujuan, lihat [Persetujuan exec](/id/tools/exec-approvals).

## Biner aman (hanya stdin)

`tools.exec.safeBins` mendefinisikan daftar kecil biner **hanya stdin** (misalnya
`cut`) yang dapat berjalan dalam mode allowlist **tanpa** entri allowlist eksplisit.
Biner aman menolak argumen file posisional dan token yang menyerupai path, sehingga
hanya dapat beroperasi pada stream masuk. Anggap ini sebagai fast-path sempit untuk
filter stream, bukan daftar kepercayaan umum.

<Warning>
Jangan tambahkan biner interpreter atau runtime (misalnya `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) ke `safeBins`. Jika sebuah command dapat mengevaluasi kode,
menjalankan subcommand, atau membaca file secara desain, pilih entri allowlist eksplisit
dan biarkan prompt persetujuan aktif. Biner aman kustom harus mendefinisikan profil eksplisit
di `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Biner aman default:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak ada dalam daftar default. Jika Anda ikut mengaktifkannya, pertahankan entri
allowlist eksplisit untuk workflow non-stdin mereka. Untuk `grep` dalam mode safe-bin,
berikan pola dengan `-e`/`--regexp`; bentuk pola posisional ditolak
agar operand file tidak dapat diselundupkan sebagai posisional ambigu.

### Validasi argv dan flag yang ditolak

Validasi bersifat deterministik hanya dari bentuk argv (tanpa pemeriksaan keberadaan filesystem host),
yang mencegah perilaku oracle keberadaan file dari perbedaan allow/deny.
Opsi berorientasi file ditolak untuk biner aman default; opsi panjang
divalidasi secara fail-closed (flag tidak dikenal dan singkatan ambigu ditolak).

Flag yang ditolak menurut profil safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Biner aman juga memaksa token argv diperlakukan sebagai **teks literal** saat eksekusi
(tanpa globbing dan tanpa ekspansi `$VARS`) untuk segmen hanya stdin, sehingga pola
seperti `*` atau `$HOME/...` tidak dapat digunakan untuk menyelundupkan pembacaan file.

### Direktori biner tepercaya

Biner aman harus di-resolve dari direktori biner tepercaya (default sistem ditambah
opsional `tools.exec.safeBinTrustedDirs`). Entri `PATH` tidak pernah otomatis dipercaya.
Direktori tepercaya default sengaja minimal: `/bin`, `/usr/bin`. Jika executable
safe-bin Anda berada di path package-manager/pengguna (misalnya
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan
secara eksplisit ke `tools.exec.safeBinTrustedDirs`.

### Chaining shell, wrapper, dan multiplexer

Chaining shell (`&&`, `||`, `;`) diizinkan ketika setiap segmen top-level
memenuhi allowlist (termasuk biner aman atau auto-allow skill). Redirection
tetap tidak didukung dalam mode allowlist. Substitusi command (`$()` / backtick) ditolak
selama parsing allowlist, termasuk di dalam tanda kutip ganda; gunakan tanda kutip tunggal
jika Anda membutuhkan teks literal `$()`.

Pada persetujuan companion-app macOS, teks shell mentah yang berisi sintaks kontrol atau
ekspansi shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan
sebagai allowlist miss kecuali biner shell itu sendiri masuk allowlist.

Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override env berskala request
dikurangi menjadi allowlist eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Untuk keputusan `allow-always` dalam mode allowlist, wrapper dispatch yang dikenal (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) menyimpan path executable internal, bukan
path wrapper. Multiplexer shell (`busybox`, `toybox`) di-unwrap untuk applet shell
(`sh`, `ash`, dst.) dengan cara yang sama. Jika wrapper atau multiplexer
tidak dapat di-unwrap dengan aman, tidak ada entri allowlist yang disimpan otomatis.

Jika Anda memasukkan interpreter seperti `python3` atau `node` ke allowlist, sebaiknya gunakan
`tools.exec.strictInlineEval=true` agar inline eval tetap memerlukan
persetujuan eksplisit. Dalam mode strict, `allow-always` masih dapat menyimpan invocation
interpreter/script yang aman, tetapi carrier inline-eval tidak disimpan otomatis.

### Biner aman versus allowlist

| Topik            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Tujuan           | Mengizinkan otomatis filter stdin sempit               | Mempercayai executable tertentu secara eksplisit                                   |
| Jenis pencocokan | Nama executable + kebijakan argv safe-bin              | Glob path executable yang di-resolve, atau glob nama command mentah untuk command yang dipanggil lewat PATH |
| Cakupan argumen  | Dibatasi oleh profil safe-bin dan aturan token literal | Pencocokan path secara default; `argPattern` opsional dapat membatasi argv yang di-parse |
| Contoh umum      | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI kustom                                      |
| Penggunaan terbaik | Transformasi teks berisiko rendah dalam pipeline     | Alat apa pun dengan perilaku atau efek samping lebih luas                          |

Lokasi konfigurasi:

- `safeBins` berasal dari config (`tools.exec.safeBins` atau per-agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` berasal dari config (`tools.exec.safeBinTrustedDirs` atau per-agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` berasal dari config (`tools.exec.safeBinProfiles` atau per-agent `agents.list[].tools.exec.safeBinProfiles`). Kunci profil per-agent menimpa kunci global.
- entri allowlist berada di host-local `~/.openclaw/exec-approvals.json` di bawah `agents.<id>.allowlist` (atau melalui Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` memperingatkan dengan `tools.exec.safe_bins_interpreter_unprofiled` ketika bin interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuat scaffold entri `safeBinProfiles.<bin>` kustom yang hilang sebagai `{}` (tinjau dan perketat setelahnya). Bin interpreter/runtime tidak di-scaffold otomatis.

Contoh profil kustom:
__OC_I18N_900000__
Jika Anda secara eksplisit mengaktifkan `jq` ke dalam `safeBins`, OpenClaw tetap menolak builtin `env` dalam mode safe-bin
sehingga `jq -n env` tidak dapat membuang lingkungan proses host tanpa path allowlist eksplisit
atau prompt persetujuan.

## Command interpreter/runtime

Run interpreter/runtime yang didukung persetujuan sengaja konservatif:

- Konteks argv/cwd/env persis selalu diikat.
- Bentuk file script shell langsung dan file runtime langsung diikat secara best-effort ke satu snapshot file lokal konkret.
- Bentuk wrapper package-manager umum yang masih resolve ke satu file lokal langsung (misalnya
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) di-unwrap sebelum pengikatan.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk command interpreter/runtime
  (misalnya package script, bentuk eval, chain loader khusus runtime, atau bentuk multi-file ambigu),
  eksekusi yang didukung persetujuan ditolak alih-alih mengklaim cakupan semantik yang tidak dimilikinya.
- Untuk workflow tersebut, sebaiknya gunakan sandboxing, batas host terpisah, atau allowlist/workflow penuh tepercaya eksplisit
  ketika operator menerima semantik runtime yang lebih luas.

Ketika persetujuan diperlukan, alat exec langsung mengembalikan id persetujuan. Gunakan id tersebut untuk
mengorelasikan event sistem nanti (`Exec finished` / `Exec denied`). Jika tidak ada keputusan sebelum
timeout, request diperlakukan sebagai timeout persetujuan dan ditampilkan sebagai alasan penolakan.

### Perilaku pengiriman followup

Setelah async exec yang disetujui selesai, OpenClaw mengirim giliran `agent` followup ke sesi yang sama.

- Jika target pengiriman eksternal yang valid ada (saluran yang dapat dikirim plus target `to`), pengiriman followup menggunakan saluran tersebut.
- Dalam alur webchat-only atau sesi internal tanpa target eksternal, pengiriman followup tetap hanya sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal strict tanpa saluran eksternal yang dapat di-resolve, request gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada saluran eksternal yang dapat di-resolve, pengiriman diturunkan menjadi hanya sesi alih-alih gagal.

## Penerusan persetujuan ke saluran chat

Anda dapat meneruskan prompt persetujuan exec ke saluran chat apa pun (termasuk saluran plugin) dan menyetujuinya
dengan `/approve`. Ini menggunakan pipeline pengiriman keluar normal.

Config:
__OC_I18N_900001__
Balas di chat:
__OC_I18N_900002__
Command `/approve` menangani persetujuan exec dan persetujuan plugin. Jika ID tidak cocok dengan persetujuan exec yang pending, command otomatis memeriksa persetujuan plugin sebagai gantinya.

### Penerusan persetujuan Plugin

Penerusan persetujuan Plugin menggunakan pipeline pengiriman yang sama seperti persetujuan exec tetapi memiliki
config independennya sendiri di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
__OC_I18N_900003__
Bentuk config identik dengan `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, dan `targets` bekerja dengan cara yang sama.

Saluran yang mendukung balasan interaktif bersama merender tombol persetujuan yang sama untuk persetujuan exec dan
plugin. Saluran tanpa UI interaktif bersama fallback ke teks biasa dengan instruksi `/approve`.
Request persetujuan plugin dapat membatasi keputusan yang tersedia. Surface persetujuan menggunakan set keputusan
yang dideklarasikan request, dan Gateway menolak percobaan mengirim keputusan yang tidak ditawarkan.

### Persetujuan chat yang sama di saluran apa pun

Ketika request persetujuan exec atau plugin berasal dari surface chat yang dapat dikirim, chat yang sama
sekarang dapat menyetujuinya dengan `/approve` secara default. Ini berlaku untuk saluran seperti Slack, Matrix, dan
Microsoft Teams selain alur Web UI dan terminal UI yang sudah ada.

Path command teks bersama ini menggunakan model auth saluran normal untuk percakapan tersebut. Jika chat
asal sudah dapat mengirim command dan menerima balasan, request persetujuan tidak lagi membutuhkan
adapter pengiriman native terpisah hanya agar tetap pending.

Discord dan Telegram juga mendukung `/approve` dari chat yang sama, tetapi saluran tersebut tetap menggunakan
daftar approver yang di-resolve untuk otorisasi bahkan ketika pengiriman persetujuan native dinonaktifkan.

Untuk Telegram dan klien persetujuan native lain yang memanggil Gateway secara langsung,
fallback ini sengaja dibatasi pada kegagalan "approval not found". Penolakan/error
persetujuan exec yang nyata tidak diam-diam dicoba ulang sebagai persetujuan plugin.

### Pengiriman persetujuan native

Beberapa channel juga dapat bertindak sebagai klien persetujuan native. Klien native menambahkan DM pemberi persetujuan, fanout chat asal, dan UX persetujuan interaktif khusus channel di atas alur `/approve` chat yang sama bersama.

Ketika kartu/tombol persetujuan native tersedia, UI native tersebut adalah jalur utama yang dihadapi agen. Agen sebaiknya tidak juga menggemakan perintah chat biasa `/approve` duplikat kecuali hasil tool menyatakan persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur yang tersisa.

Jika klien persetujuan native dikonfigurasi tetapi tidak ada runtime native yang aktif untuk channel asal, OpenClaw tetap menampilkan prompt `/approve` deterministik lokal. Jika runtime native aktif dan mencoba pengiriman tetapi tidak ada target yang menerima kartu, OpenClaw mengirim pemberitahuan fallback di chat yang sama dengan perintah persis `/approve <id> <decision>` agar permintaan tetap dapat diselesaikan.

Model generik:

- kebijakan eksekusi host tetap menentukan apakah persetujuan eksekusi diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan chat lain
- `channels.<channel>.execApprovals` mengontrol apakah channel tersebut bertindak sebagai klien persetujuan native

Klien persetujuan native mengaktifkan otomatis pengiriman DM lebih dulu saat semua hal ini benar:

- channel mendukung pengiriman persetujuan native
- pemberi persetujuan dapat diselesaikan dari `execApprovals.approvers` eksplisit atau identitas pemilik seperti `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`

Setel `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Setel `enabled: true` untuk memaksanya aktif saat pemberi persetujuan terselesaikan. Pengiriman chat asal publik tetap eksplisit melalui `channels.<channel>.execApprovals.target`.

FAQ: [Mengapa ada dua konfigurasi persetujuan eksekusi untuk persetujuan chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Klien persetujuan native ini menambahkan routing DM dan fanout channel opsional di atas alur `/approve` chat yang sama bersama dan tombol persetujuan bersama.

Perilaku bersama:

- Slack, Matrix, Microsoft Teams, dan chat sejenis yang dapat dikirim menggunakan model autentikasi channel normal untuk `/approve` chat yang sama
- saat klien persetujuan native diaktifkan otomatis, target pengiriman native default adalah DM pemberi persetujuan
- untuk Discord dan Telegram, hanya pemberi persetujuan yang terselesaikan yang dapat menyetujui atau menolak
- pemberi persetujuan Discord dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- pemberi persetujuan Telegram dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- pemberi persetujuan Slack dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- tombol native Slack mempertahankan jenis id persetujuan, sehingga id `plugin:` dapat menyelesaikan persetujuan plugin tanpa lapisan fallback lokal Slack kedua
- routing DM/channel native Matrix dan pintasan reaksi menangani persetujuan eksekusi maupun plugin; otorisasi plugin tetap berasal dari `channels.matrix.dm.allowFrom`
- prompt native Matrix menyertakan konten peristiwa kustom `com.openclaw.approval` pada peristiwa prompt pertama sehingga klien Matrix yang memahami OpenClaw dapat membaca status persetujuan terstruktur sementara klien standar tetap mempertahankan fallback `/approve` teks biasa
- peminta tidak perlu menjadi pemberi persetujuan
- chat asal dapat menyetujui langsung dengan `/approve` saat chat tersebut sudah mendukung perintah dan balasan
- tombol persetujuan Discord native merutekan berdasarkan jenis id persetujuan: id `plugin:` langsung menuju persetujuan plugin, yang lain menuju persetujuan eksekusi
- tombol persetujuan Telegram native mengikuti fallback eksekusi-ke-plugin terbatas yang sama seperti `/approve`
- saat `target` native mengaktifkan pengiriman chat asal, prompt persetujuan menyertakan teks perintah
- persetujuan eksekusi yang tertunda kedaluwarsa setelah 30 menit secara default
- jika tidak ada UI operator atau klien persetujuan terkonfigurasi yang dapat menerima permintaan, prompt melakukan fallback ke `askFallback`

Perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory` menggunakan routing pribadi pemilik untuk prompt persetujuan dan hasil akhir. OpenClaw pertama-tama mencoba rute pribadi pada permukaan yang sama tempat pemilik menjalankan perintah. Jika permukaan tersebut tidak memiliki rute pribadi pemilik, OpenClaw melakukan fallback ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, sehingga perintah grup Discord tetap dapat mengirim persetujuan dan hasil ke DM Telegram pemilik saat Telegram adalah antarmuka pribadi utama yang dikonfigurasi. Chat grup hanya menerima pemberitahuan singkat.

Telegram default ke DM pemberi persetujuan (`target: "dm"`). Anda dapat beralih ke `channel` atau `both` saat ingin prompt persetujuan juga muncul di chat/topik Telegram asal. Untuk topik forum Telegram, OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjut setelah persetujuan.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Alur IPC macOS
__OC_I18N_900004__
Catatan keamanan:

- Mode socket Unix `0600`, token disimpan di `exec-approvals.json`.
- Pemeriksaan peer dengan UID yang sama.
- Challenge/response (nonce + token HMAC + hash permintaan) + TTL singkat.

## Terkait

- [Persetujuan eksekusi](/id/tools/exec-approvals) — kebijakan inti dan alur persetujuan
- [Tool eksekusi](/id/tools/exec)
- [Mode elevated](/id/tools/elevated)
- [Skills](/id/tools/skills) — perilaku izin otomatis berbasis skill
