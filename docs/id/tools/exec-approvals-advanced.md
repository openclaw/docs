---
read_when:
    - Mengonfigurasi bin aman atau profil safe-bin kustom
    - Meneruskan persetujuan ke Slack/Discord/Telegram atau channel chat lainnya
    - Mengimplementasikan klien persetujuan native untuk sebuah channel
summary: 'Persetujuan exec lanjutan: bin aman, binding interpreter, penerusan persetujuan, pengiriman native'
title: Persetujuan exec — lanjutan
x-i18n:
    generated_at: "2026-04-24T09:30:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Topik lanjutan persetujuan exec: fast-path `safeBins`, binding interpreter/runtime,
dan penerusan persetujuan ke channel chat (termasuk pengiriman native).
Untuk kebijakan inti dan alur persetujuan, lihat [Exec approvals](/id/tools/exec-approvals).

## Safe bins (hanya-stdin)

`tools.exec.safeBins` mendefinisikan daftar kecil biner **hanya-stdin** (misalnya
`cut`) yang dapat berjalan dalam mode allowlist **tanpa** entri allowlist
eksplisit. Safe bins menolak arg file posisi dan token mirip path, sehingga
hanya dapat beroperasi pada stream yang masuk. Perlakukan ini sebagai fast-path sempit untuk
filter stream, bukan daftar kepercayaan umum.

<Warning>
**Jangan** tambahkan biner interpreter atau runtime (misalnya `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) ke `safeBins`. Jika suatu perintah dapat mengevaluasi kode,
mengeksekusi subperintah, atau membaca file secara desain, pilih entri allowlist eksplisit
dan pertahankan prompt persetujuan tetap aktif. Safe bin kustom harus mendefinisikan profil eksplisit di `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Safe bin default:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak ada dalam daftar default. Jika Anda memilihnya secara eksplisit, pertahankan entri
allowlist eksplisit untuk alur kerja non-stdin-nya. Untuk `grep` dalam mode safe-bin,
berikan pola dengan `-e`/`--regexp`; bentuk pola posisi ditolak
agar operand file tidak dapat diselundupkan sebagai positional ambigu.

### Validasi argv dan flag yang ditolak

Validasi bersifat deterministik hanya dari bentuk argv (tanpa pemeriksaan keberadaan filesystem host),
yang mencegah perilaku oracle keberadaan file dari perbedaan allow/deny.
Opsi yang berorientasi file ditolak untuk safe bin default; opsi panjang divalidasi secara fail-closed (flag yang tidak dikenal dan singkatan ambigu ditolak).

Flag yang ditolak menurut profil safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bin juga memaksa token argv diperlakukan sebagai **teks literal** saat waktu eksekusi
(tanpa globbing dan tanpa ekspansi `$VARS`) untuk segmen hanya-stdin, sehingga pola
seperti `*` atau `$HOME/...` tidak dapat digunakan untuk menyelundupkan pembacaan file.

### Direktori biner tepercaya

Safe bin harus diresolusikan dari direktori biner tepercaya (default sistem plus
`tools.exec.safeBinTrustedDirs` opsional). Entri `PATH` tidak pernah otomatis dipercaya.
Direktori tepercaya default sengaja minimal: `/bin`, `/usr/bin`. Jika
executable safe-bin Anda berada di path package-manager/pengguna (misalnya
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan secara
eksplisit ke `tools.exec.safeBinTrustedDirs`.

### Shell chaining, wrapper, dan multiplexer

Shell chaining (`&&`, `||`, `;`) diizinkan saat setiap segmen tingkat atas
memenuhi allowlist (termasuk safe bin atau auto-allow skill). Redirection tetap
tidak didukung dalam mode allowlist. Command substitution (`$()` / backtick) ditolak selama parsing allowlist, termasuk di dalam kutip ganda; gunakan kutip tunggal jika Anda membutuhkan teks `$()` literal.

Pada persetujuan companion-app macOS, teks shell mentah yang berisi sintaks kontrol atau
ekspansi shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan
sebagai miss allowlist kecuali biner shell itu sendiri ada di allowlist.

Untuk shell wrapper (`bash|sh|zsh ... -c/-lc`), override env yang dibatasi permintaan
dikurangi menjadi allowlist eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Untuk keputusan `allow-always` dalam mode allowlist, wrapper dispatch yang dikenal (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) mempertahankan path executable bagian dalam
alih-alih path wrapper. Shell multiplexer (`busybox`, `toybox`) di-unwrapped untuk
applet shell (`sh`, `ash`, dll.) dengan cara yang sama. Jika sebuah wrapper atau multiplexer
tidak dapat di-unwrapped dengan aman, tidak ada entri allowlist yang dipersistenkan
secara otomatis.

Jika Anda mengallowlist interpreter seperti `python3` atau `node`, pilih
`tools.exec.strictInlineEval=true` agar inline eval tetap memerlukan persetujuan eksplisit.
Dalam mode strict, `allow-always` masih dapat mempersistenkan pemanggilan interpreter/script
yang jinak, tetapi pembawa inline-eval tidak dipersistenkan secara otomatis.

### Safe bins versus allowlist

| Topic            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Goal             | Auto-allow filter stdin yang sempit                    | Secara eksplisit mempercayai executable tertentu             |
| Match type       | Nama executable + kebijakan argv safe-bin              | Pola glob path executable yang diresolusikan                 |
| Argument scope   | Dibatasi oleh profil safe-bin dan aturan token literal | Hanya kecocokan path; argumen selain itu menjadi tanggung jawab Anda |
| Typical examples | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI kustom                |
| Best use         | Transformasi teks berisiko rendah dalam pipeline       | Alat apa pun dengan perilaku atau efek samping yang lebih luas |

Lokasi konfigurasi:

- `safeBins` berasal dari config (`tools.exec.safeBins` atau per-agen `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` berasal dari config (`tools.exec.safeBinTrustedDirs` atau per-agen `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` berasal dari config (`tools.exec.safeBinProfiles` atau per-agen `agents.list[].tools.exec.safeBinProfiles`). Kunci profil per-agen menimpa kunci global.
- entri allowlist berada di `~/.openclaw/exec-approvals.json` lokal-host di bawah `agents.<id>.allowlist` (atau melalui UI Control / `openclaw approvals allowlist ...`).
- `openclaw security audit` memperingatkan dengan `tools.exec.safe_bins_interpreter_unprofiled` saat bin interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuat scaffold entri `safeBinProfiles.<bin>` kustom yang hilang sebagai `{}` (tinjau dan perketat sesudahnya). Bin interpreter/runtime tidak dibuat scaffold secara otomatis.

Contoh profil kustom:
__OC_I18N_900000__
Jika Anda secara eksplisit memilih `jq` ke dalam `safeBins`, OpenClaw tetap menolak builtin `env` dalam mode safe-bin
sehingga `jq -n env` tidak dapat membuang environment proses host tanpa jalur allowlist eksplisit
atau prompt persetujuan.

## Perintah interpreter/runtime

Run interpreter/runtime yang didukung persetujuan sengaja konservatif:

- Konteks argv/cwd/env yang persis selalu diikat.
- Bentuk file runtime langsung dan skrip shell langsung diikat secara best-effort ke satu snapshot
  file lokal konkret.
- Bentuk wrapper package-manager umum yang masih meresolusikan ke satu file lokal langsung (misalnya
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) di-unwrapped sebelum binding.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime
  (misalnya skrip package, bentuk eval, rantai loader spesifik runtime, atau bentuk multi-file ambigu), eksekusi yang didukung persetujuan ditolak alih-alih mengklaim cakupan semantik yang sebenarnya tidak dimiliki.
- Untuk alur kerja tersebut, pilih sandboxing, batas host terpisah, atau alur allowlist/full
  tepercaya yang eksplisit saat operator menerima semantik runtime yang lebih luas.

Saat persetujuan diperlukan, alat exec segera mengembalikan id persetujuan. Gunakan id itu untuk
mengorelasikan event sistem nanti (`Exec finished` / `Exec denied`). Jika tidak ada keputusan sebelum timeout,
permintaan diperlakukan sebagai timeout persetujuan dan ditampilkan sebagai alasan penolakan.

### Perilaku pengiriman followup

Setelah exec asinkron yang disetujui selesai, OpenClaw mengirim giliran `agent` followup ke sesi yang sama.

- Jika target pengiriman eksternal yang valid ada (channel yang dapat dikirim plus target `to`), pengiriman followup menggunakan channel tersebut.
- Dalam alur webchat-only atau sesi internal tanpa target eksternal, pengiriman followup tetap hanya-sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal strict tanpa channel eksternal yang dapat diresolusikan, permintaan gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada channel eksternal yang dapat diresolusikan, pengiriman diturunkan menjadi hanya-sesi alih-alih gagal.

## Penerusan persetujuan ke channel chat

Anda dapat meneruskan prompt persetujuan exec ke channel chat mana pun (termasuk channel Plugin) dan menyetujuinya
dengan `/approve`. Ini menggunakan pipeline pengiriman keluar normal.

Config:
__OC_I18N_900001__
Balas di chat:
__OC_I18N_900002__
Perintah `/approve` menangani persetujuan exec dan persetujuan Plugin. Jika ID tidak cocok dengan persetujuan exec yang tertunda, perintah ini secara otomatis memeriksa persetujuan Plugin sebagai gantinya.

### Penerusan persetujuan Plugin

Penerusan persetujuan Plugin menggunakan pipeline pengiriman yang sama seperti persetujuan exec tetapi memiliki config independennya sendiri di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
__OC_I18N_900003__
Bentuk config identik dengan `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, dan `targets` bekerja dengan cara yang sama.

Channel yang mendukung balasan interaktif bersama merender tombol persetujuan yang sama untuk persetujuan exec dan
Plugin. Channel tanpa UI interaktif bersama fallback ke teks biasa dengan instruksi `/approve`.

### Persetujuan chat yang sama di channel mana pun

Saat permintaan persetujuan exec atau Plugin berasal dari permukaan chat yang dapat dikirim, chat yang sama
sekarang dapat menyetujuinya dengan `/approve` secara default. Ini berlaku untuk channel seperti Slack, Matrix, dan
Microsoft Teams selain alur UI Web dan UI terminal yang sudah ada.

Jalur perintah teks bersama ini menggunakan model auth channel normal untuk percakapan tersebut. Jika chat
asal sudah dapat mengirim perintah dan menerima balasan, permintaan persetujuan tidak lagi memerlukan
adapter pengiriman native terpisah hanya untuk tetap tertunda.

Discord dan Telegram juga mendukung `/approve` di chat yang sama, tetapi channel tersebut tetap menggunakan
daftar approver hasil resolusi mereka untuk otorisasi bahkan ketika pengiriman persetujuan native dinonaktifkan.

Untuk Telegram dan klien persetujuan native lain yang memanggil Gateway secara langsung,
fallback ini sengaja dibatasi pada kegagalan "approval not found". Penolakan/galat
persetujuan exec yang nyata tidak diam-diam dicoba ulang sebagai persetujuan Plugin.

### Pengiriman persetujuan native

Beberapa channel juga dapat bertindak sebagai klien persetujuan native. Klien native menambahkan DM approver, fanout origin-chat, dan UX persetujuan interaktif khusus channel di atas alur `/approve` chat-yang-sama bersama.

Ketika kartu/tombol persetujuan native tersedia, UI native itu adalah jalur utama
yang menghadap agen. Agen seharusnya tidak juga mengulang perintah chat biasa
`/approve` yang duplikat kecuali hasil alat mengatakan persetujuan chat tidak tersedia atau
persetujuan manual adalah satu-satunya jalur yang tersisa.

Model generik:

- kebijakan exec host tetap memutuskan apakah persetujuan exec diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan chat lain
- `channels.<channel>.execApprovals` mengontrol apakah channel tersebut bertindak sebagai klien persetujuan native

Klien persetujuan native otomatis mengaktifkan pengiriman DM-first ketika semua kondisi berikut benar:

- channel mendukung pengiriman persetujuan native
- approver dapat diresolusikan dari `execApprovals.approvers` eksplisit atau sumber fallback yang terdokumentasi untuk channel tersebut
- `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`

Setel `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Setel `enabled: true` untuk memaksanya
aktif saat approver dapat diresolusikan. Pengiriman origin-chat publik tetap eksplisit melalui
`channels.<channel>.execApprovals.target`.

FAQ: [Why are there two exec approval configs for chat approvals?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Klien persetujuan native ini menambahkan perutean DM dan fanout channel opsional di atas alur `/approve` chat-yang-sama bersama dan tombol persetujuan bersama.

Perilaku bersama:

- Slack, Matrix, Microsoft Teams, dan chat yang dapat dikirim serupa menggunakan model auth channel normal
  untuk `/approve` chat-yang-sama
- ketika klien persetujuan native aktif otomatis, target pengiriman native default adalah DM approver
- untuk Discord dan Telegram, hanya approver hasil resolusi yang dapat menyetujui atau menolak
- approver Discord dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- approver Telegram dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari config owner yang ada (`allowFrom`, ditambah `defaultTo` direct-message jika didukung)
- approver Slack dapat eksplisit (`execApprovals.approvers`) atau disimpulkan dari `commands.ownerAllowFrom`
- tombol native Slack mempertahankan jenis id persetujuan, sehingga id `plugin:` dapat meresolusikan persetujuan Plugin
  tanpa lapisan fallback lokal-Slack kedua
- perutean DM/channel native Matrix dan shortcut reaksi menangani persetujuan exec dan Plugin;
  otorisasi Plugin tetap berasal dari `channels.matrix.dm.allowFrom`
- peminta tidak perlu menjadi approver
- chat asal dapat menyetujui secara langsung dengan `/approve` ketika chat tersebut sudah mendukung perintah dan balasan
- tombol persetujuan Discord native merutekan berdasarkan jenis id persetujuan: id `plugin:` langsung menuju
  persetujuan Plugin, semuanya yang lain menuju persetujuan exec
- tombol persetujuan Telegram native mengikuti fallback exec-ke-plugin terbatas yang sama seperti `/approve`
- ketika `target` native mengaktifkan pengiriman origin-chat, prompt persetujuan menyertakan teks perintah
- persetujuan exec tertunda kedaluwarsa setelah 30 menit secara default
- jika tidak ada UI operator atau klien persetujuan terkonfigurasi yang dapat menerima permintaan, prompt fallback ke `askFallback`

Telegram default ke DM approver (`target: "dm"`). Anda dapat beralih ke `channel` atau `both` saat
ingin prompt persetujuan juga muncul di chat/topik Telegram asal. Untuk topik forum Telegram,
OpenClaw mempertahankan topik untuk prompt persetujuan dan follow-up pasca-persetujuan.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Alur IPC macOS
__OC_I18N_900004__
Catatan keamanan:

- Mode Unix socket `0600`, token disimpan di `exec-approvals.json`.
- Pemeriksaan peer UID yang sama.
- Challenge/response (nonce + token HMAC + hash permintaan) + TTL pendek.

## Terkait

- [Exec approvals](/id/tools/exec-approvals) — kebijakan inti dan alur persetujuan
- [Exec tool](/id/tools/exec)
- [Elevated mode](/id/tools/elevated)
- [Skills](/id/tools/skills) — perilaku auto-allow yang didukung skill
