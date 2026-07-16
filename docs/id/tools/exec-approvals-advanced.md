---
read_when:
    - Mengonfigurasi bin aman atau profil bin aman khusus
    - Meneruskan persetujuan ke Slack/Discord/Telegram atau saluran obrolan lainnya
    - Mengimplementasikan klien persetujuan native untuk sebuah saluran
summary: 'Persetujuan exec lanjutan: bin aman, pengikatan interpreter, penerusan persetujuan, pengiriman native'
title: Persetujuan eksekusi — lanjutan
x-i18n:
    generated_at: "2026-07-16T18:47:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Topik lanjutan persetujuan eksekusi: jalur cepat `safeBins`, pengikatan
interpreter/runtime, dan penerusan persetujuan ke saluran obrolan (termasuk pengiriman native).
Untuk kebijakan inti dan alur persetujuan, lihat [Persetujuan eksekusi](/id/tools/exec-approvals).

## Biner aman (hanya stdin)

`tools.exec.safeBins` menamai biner **hanya stdin** (misalnya `cut`) yang
berjalan dalam mode daftar izin **tanpa** entri daftar izin eksplisit. Biner aman menolak
argumen file posisional dan token yang menyerupai path, sehingga hanya dapat beroperasi pada
aliran masuk. Perlakukan ini sebagai jalur cepat terbatas untuk filter aliran, bukan
daftar kepercayaan umum.

<Warning>
Jangan **pernah** menambahkan biner interpreter atau runtime (misalnya `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) ke `safeBins`. Jika suatu perintah dapat mengevaluasi kode,
menjalankan subperintah, atau membaca file secara bawaan, pilih entri daftar izin eksplisit
dan pertahankan perintah persetujuan tetap aktif. Biner aman khusus harus menentukan profil eksplisit
di `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Biner aman default:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak ada dalam daftar default. Jika Anda mengaktifkannya, pertahankan entri
daftar izin eksplisit untuk alur kerja non-stdin mereka. Untuk `grep` dalam mode biner aman,
berikan pola dengan `-e`/`--regexp`; bentuk pola posisional ditolak
agar operan file tidak dapat diselundupkan sebagai argumen posisional yang ambigu.

### Validasi argv dan flag yang ditolak

Validasi bersifat deterministik hanya berdasarkan bentuk argv (tanpa pemeriksaan keberadaan
sistem file host), yang mencegah perilaku oracle keberadaan file akibat perbedaan
izin/tolak. Opsi berorientasi file ditolak untuk biner aman default; opsi panjang
divalidasi secara fail-closed (flag yang tidak dikenal dan singkatan ambigu
ditolak). Flag boolean hanya-baca yang dikenali dari biner default (misalnya
`wc -l`, `tr -d`, `uniq -c`) diterima, sedangkan flag pendek yang tidak dikenali tetap
fail-closed dan diteruskan ke persetujuan manual.

Flag yang ditolak berdasarkan profil biner aman:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Biner aman juga memaksa token argv diperlakukan sebagai **teks literal** pada waktu eksekusi
(tanpa globbing dan tanpa ekspansi `$VARS`) untuk segmen hanya-stdin, sehingga
pola seperti `*` atau `$HOME/...` tidak dapat digunakan untuk menyelundupkan pembacaan file. `awk`,
`sed`, dan `jq` selalu ditolak sebagai biner aman karena semantiknya tidak dapat
divalidasi sebagai hanya-stdin: `jq` dapat membaca data lingkungan dan memuat kode jq dari
modul atau file startup. Sebagai gantinya, gunakan entri daftar izin eksplisit atau perintah persetujuan untuk
alat tersebut, bukan `safeBins`.

### Direktori biner tepercaya

Biner aman harus di-resolve dari direktori biner tepercaya (default sistem ditambah
`tools.exec.safeBinTrustedDirs` opsional). Entri `PATH` tidak pernah dipercaya secara otomatis.
Direktori tepercaya default sengaja dibuat minimal: `/bin`, `/usr/bin`. Jika
biner aman Anda berada di path pengelola paket/pengguna (misalnya
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan secara
eksplisit ke `tools.exec.safeBinTrustedDirs`.

### Perangkaian shell, wrapper, dan multiplexer

Perangkaian shell (`&&`, `||`, `;`) diizinkan ketika setiap segmen tingkat atas
memenuhi daftar izin (termasuk biner aman atau izin otomatis skill). Pengalihan
tetap tidak didukung dalam mode daftar izin. Substitusi perintah (`$()` / backtick)
ditolak selama penguraian daftar izin, termasuk di dalam tanda kutip ganda; gunakan tanda kutip
tunggal jika Anda memerlukan teks `$()` literal.

Pada persetujuan aplikasi pendamping macOS, teks shell mentah yang berisi sintaks kontrol atau
ekspansi shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)
diperlakukan sebagai ketidakcocokan daftar izin kecuali biner shell itu sendiri ada dalam daftar izin.

Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), penggantian env yang terbatas pada permintaan
dikurangi menjadi daftar izin eksplisit yang kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Untuk keputusan `allow-always` dalam mode daftar izin, wrapper dispatch transparan
(misalnya `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) mempertahankan
path biner internal, bukan path wrapper. Multiplexer shell
(`busybox`, `toybox`) dibuka dengan cara yang sama untuk applet shell (`sh`, `ash`, dan seterusnya).
Jika wrapper atau multiplexer tidak dapat dibuka dengan aman, tidak ada entri daftar izin
yang dipertahankan secara otomatis.

Jika Anda memasukkan interpreter seperti `python3` atau `node` ke daftar izin, pilih
`tools.exec.strictInlineEval=true` agar evaluasi inline tetap memerlukan
persetujuan eksplisit. Dalam mode ketat, `allow-always` masih dapat mempertahankan
pemanggilan interpreter/skrip yang aman, tetapi pembawa evaluasi inline tidak dipertahankan
secara otomatis.

### Biner aman dibandingkan daftar izin

| Topik            | `tools.exec.safeBins`                                  | Daftar izin (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Tujuan           | Mengizinkan filter stdin terbatas secara otomatis      | Memercayai biner tertentu secara eksplisit                                         |
| Jenis kecocokan  | Nama biner + kebijakan argv biner aman                  | Glob path biner yang di-resolve, atau glob nama perintah biasa untuk perintah yang dipanggil melalui PATH |
| Cakupan argumen  | Dibatasi oleh profil biner aman dan aturan token literal | Kecocokan path secara default; `argPattern` opsional dapat membatasi argv yang diurai |
| Contoh umum      | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI khusus                                     |
| Penggunaan terbaik | Transformasi teks berisiko rendah dalam pipeline      | Alat apa pun dengan perilaku atau efek samping yang lebih luas                     |

Lokasi konfigurasi:

- `safeBins` berasal dari konfigurasi (`tools.exec.safeBins` atau `agents.list[].tools.exec.safeBins` per agen).
- `safeBinTrustedDirs` berasal dari konfigurasi (`tools.exec.safeBinTrustedDirs` atau `agents.list[].tools.exec.safeBinTrustedDirs` per agen).
- `safeBinProfiles` berasal dari konfigurasi (`tools.exec.safeBinProfiles` atau `agents.list[].tools.exec.safeBinProfiles` per agen). Kunci profil per agen menggantikan kunci global.
- entri daftar izin berada dalam file persetujuan lokal host di bawah `agents.<id>.allowlist` (atau melalui Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` memperingatkan dengan `tools.exec.safe_bins_interpreter_unprofiled` ketika biner interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuat kerangka entri `safeBinProfiles.<bin>` khusus yang belum ada sebagai `{}` (tinjau dan perketat setelahnya). Biner interpreter/runtime tidak dibuatkan kerangka secara otomatis.

Contoh profil khusus:

```json5
{
  tools: {
    exec: {
      safeBins: ["myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Perintah interpreter/runtime

Eksekusi interpreter/runtime yang didukung persetujuan sengaja dibuat konservatif:

- Konteks argv/cwd/env yang tepat selalu diikat.
- Bentuk skrip shell langsung dan file runtime langsung sebisa mungkin diikat ke satu snapshot file
  lokal konkret.
- Bentuk wrapper pengelola paket umum yang tetap di-resolve ke satu file lokal langsung (misalnya
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) dibuka sebelum pengikatan.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime
  (misalnya skrip paket, bentuk evaluasi, rantai loader khusus runtime, atau bentuk multi-file
  yang ambigu), eksekusi yang didukung persetujuan ditolak alih-alih mengklaim cakupan semantik yang tidak
  dimilikinya.
- Untuk alur kerja tersebut, pilih sandboxing, batas host terpisah, atau alur kerja
  daftar izin penuh/eksplisit tepercaya tempat operator menerima semantik runtime yang lebih luas.

Ketika persetujuan diperlukan, alat exec segera mengembalikan id persetujuan. Gunakan id tersebut untuk
mengorelasikan peristiwa sistem eksekusi yang disetujui kemudian (`Exec finished`, dan `Exec running` jika dikonfigurasi).
Jika tidak ada keputusan sebelum waktu tunggu habis, permintaan diperlakukan sebagai waktu tunggu persetujuan habis dan
ditampilkan sebagai penolakan perintah host terminal. Untuk persetujuan asinkron agen utama dengan sesi asal,
OpenClaw juga melanjutkan sesi tersebut dengan tindak lanjut internal agar agen mengetahui bahwa
perintah tidak dijalankan, alih-alih kemudian mencoba memperbaiki hasil yang hilang. Persetujuan eksekusi yang tertunda kedaluwarsa
setelah 30 menit secara default.

### Perilaku pengiriman tindak lanjut

Setelah eksekusi asinkron yang disetujui selesai, OpenClaw mengirim giliran `agent` tindak lanjut ke sesi yang sama.
Persetujuan asinkron yang ditolak menggunakan jalur tindak lanjut sesi utama yang sama untuk status penolakan, tetapi
tidak mendaftarkan handoff runtime dengan hak istimewa lebih tinggi dan tidak menjalankan perintah. Penolakan tanpa sesi utama
yang dapat dilanjutkan akan disembunyikan atau dilaporkan melalui rute langsung yang aman jika tersedia.

- Jika target pengiriman eksternal yang valid tersedia (saluran yang dapat menerima pengiriman ditambah target `to`), pengiriman tindak lanjut menggunakan saluran tersebut.
- Dalam alur khusus webchat atau sesi internal tanpa target eksternal, pengiriman tindak lanjut tetap hanya dalam sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal ketat tanpa saluran eksternal yang dapat di-resolve, permintaan gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada saluran eksternal yang dapat di-resolve, pengiriman diturunkan menjadi hanya dalam sesi alih-alih gagal.

## Penerusan persetujuan ke saluran obrolan

Anda dapat meneruskan perintah persetujuan eksekusi ke saluran obrolan apa pun (termasuk saluran plugin) dan menyetujuinya
dengan `/approve`. Ini menggunakan pipeline pengiriman keluar normal.

Konfigurasi:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring or regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Balas di obrolan:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Perintah `/approve` menangani persetujuan exec maupun persetujuan plugin. Jika ID tidak cocok dengan persetujuan exec yang tertunda, perintah tersebut secara otomatis memeriksa persetujuan plugin. Fallback ini dibatasi pada kegagalan "persetujuan tidak ditemukan"; penolakan/kesalahan persetujuan exec yang sebenarnya tidak akan secara diam-diam dicoba ulang sebagai persetujuan plugin.

### Penerusan persetujuan plugin

Penerusan persetujuan plugin menggunakan pipeline pengiriman yang sama dengan persetujuan exec, tetapi memiliki
konfigurasi independennya sendiri di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
Untuk perilaku pembuatan plugin, kolom permintaan, dan semantik keputusan, lihat
[Permintaan izin plugin](/plugins/plugin-permission-requests).

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Bentuk konfigurasinya identik dengan `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, dan `targets` berfungsi dengan cara yang sama.

Channel yang mendukung balasan interaktif bersama menampilkan tombol persetujuan yang sama untuk persetujuan exec
dan plugin. Channel tanpa UI interaktif bersama beralih ke teks biasa dengan petunjuk
`/approve`. Permintaan persetujuan plugin dapat membatasi keputusan yang tersedia: permukaan persetujuan menggunakan
kumpulan keputusan yang dinyatakan dalam permintaan, dan Gateway menolak upaya untuk mengirimkan keputusan yang
tidak ditawarkan.

### Persetujuan dalam percakapan yang sama di channel apa pun

Ketika permintaan persetujuan exec atau plugin berasal dari permukaan percakapan yang dapat menerima pengiriman, percakapan yang sama
secara default dapat menyetujuinya dengan `/approve`. Ini berlaku untuk Slack, Matrix, Microsoft Teams, dan
percakapan serupa yang dapat menerima pengiriman, selain alur UI Web dan UI terminal yang sudah ada, dengan menggunakan
model autentikasi channel normal untuk percakapan tersebut. Jika percakapan asal sudah dapat mengirim perintah
dan menerima balasan, permintaan persetujuan tidak lagi memerlukan adaptor pengiriman native terpisah hanya agar
tetap tertunda.

Discord, Telegram, dan bot QQ juga mendukung `/approve` dalam percakapan yang sama, tetapi channel tersebut tetap menggunakan
daftar pemberi persetujuan yang telah diresolusi untuk otorisasi meskipun pengiriman persetujuan native dinonaktifkan.

### Pengiriman persetujuan native

Beberapa channel juga dapat bertindak sebagai klien persetujuan native: Discord, Slack, Telegram, Matrix, dan bot QQ.
Klien native menambahkan DM kepada pemberi persetujuan, fanout ke percakapan asal, dan UX persetujuan interaktif khusus channel
di atas alur `/approve` bersama dalam percakapan yang sama.

Saat kartu/tombol persetujuan native tersedia, UI native tersebut menjadi jalur utama yang ditampilkan kepada agen.
Agen tidak boleh turut menggemakan perintah percakapan biasa `/approve` yang duplikat, kecuali hasil alat menyatakan
persetujuan melalui percakapan tidak tersedia atau persetujuan manual adalah satu-satunya jalur yang tersisa.

Jika klien persetujuan native dikonfigurasi tetapi tidak ada runtime native yang aktif untuk channel
asal, OpenClaw tetap menampilkan prompt deterministik lokal `/approve`. Jika runtime native
aktif dan mencoba melakukan pengiriman, tetapi tidak ada target yang menerima kartu, OpenClaw mengirim pemberitahuan fallback
dalam percakapan yang sama dengan perintah `/approve <id> <decision>` yang persis agar permintaan tetap dapat diselesaikan.

Model umum:

- kebijakan exec host tetap menentukan apakah persetujuan exec diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan percakapan lain
- `channels.<channel>.execApprovals` mengontrol apakah klien native khusus channel untuk Discord, Slack, Telegram, bot QQ,
  dan channel serupa diaktifkan
- Persetujuan plugin Slack dapat menggunakan klien persetujuan native Slack saat permintaan berasal dari Slack
  dan pemberi persetujuan plugin Slack dapat diresolusi; `approvals.plugin` juga dapat merutekan persetujuan plugin ke sesi
  atau target Slack meskipun persetujuan exec Slack dinonaktifkan
- Kartu persetujuan native Google Chat menangani persetujuan exec dan plugin yang berasal dari ruang
  atau utas Google Chat saat pemberi persetujuan `users/<id>` yang stabil diresolusi dari `dm.allowFrom` atau
  `defaultTo`; kartu tersebut tidak menggunakan peristiwa reaksi untuk keputusan
- Pengiriman persetujuan melalui reaksi WhatsApp dan Signal dikendalikan oleh `approvals.exec` dan
  `approvals.plugin`; keduanya tidak memiliki blok `channels.<channel>.execApprovals`

Klien persetujuan native secara otomatis mengaktifkan pengiriman yang mengutamakan DM jika semua kondisi berikut terpenuhi:

- channel mendukung pengiriman persetujuan native
- pemberi persetujuan dapat diresolusi dari `execApprovals.approvers` eksplisit atau
  identitas pemilik seperti `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` tidak ditetapkan atau `"auto"`

Tetapkan `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Tetapkan `enabled: true` untuk memaksanya
aktif ketika pemberi persetujuan dapat diresolusi. Pengiriman publik ke percakapan asal tetap harus dinyatakan secara eksplisit melalui
`channels.<channel>.execApprovals.target`. Saat `target` native mengaktifkan pengiriman ke percakapan asal,
prompt persetujuan menyertakan teks perintah.

FAQ: [Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan melalui percakapan?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Bot QQ: `channels.qqbot.execApprovals.*`
- Google Chat: konfigurasikan pemberi persetujuan yang stabil dengan `channels.googlechat.dm.allowFrom` atau
  `channels.googlechat.defaultTo`; blok `execApprovals` tidak diperlukan
- WhatsApp: gunakan `approvals.exec` dan `approvals.plugin` untuk merutekan prompt persetujuan ke WhatsApp
- Signal: gunakan `approvals.exec` dan `approvals.plugin` untuk merutekan prompt persetujuan ke Signal

Perutean khusus klien native:

- Telegram secara default menggunakan DM pemberi persetujuan (`target: "dm"`). Beralihlah ke `channel` atau `both` untuk turut menampilkan
  prompt persetujuan dalam percakapan/topik Telegram asal. Untuk topik forum Telegram, OpenClaw
  mempertahankan topik untuk prompt persetujuan dan tindak lanjut setelah persetujuan.
- Pemberi persetujuan Discord dan Telegram dapat ditetapkan secara eksplisit (`execApprovals.approvers`) atau disimpulkan dari
  `commands.ownerAllowFrom`; hanya pemberi persetujuan yang telah diresolusi yang dapat menyetujui atau menolak.
- Pemberi persetujuan Slack dapat ditetapkan secara eksplisit (`execApprovals.approvers`) atau disimpulkan dari
  `commands.ownerAllowFrom`. DM persetujuan plugin Slack menggunakan pemberi persetujuan plugin Slack dari `allowFrom`
  dan perutean default akun, bukan pemberi persetujuan exec Slack. Tombol native Slack mempertahankan jenis ID persetujuan,
  sehingga ID `plugin:` dapat menyelesaikan persetujuan plugin tanpa lapisan fallback lokal Slack kedua.
- Kartu native Google Chat mempertahankan fallback manual `/approve` dalam teks pesan, tetapi callback
  tombol kartu hanya membawa token tindakan opak; ID persetujuan dan keputusan dipulihkan dari
  status tertunda di sisi server.
- Persetujuan emoji WhatsApp menangani prompt exec dan plugin ketika kelompok penerusan tingkat atas
  yang sesuai merutekannya ke WhatsApp. Prompt yang berasal dari native diikat secara langsung; pengiriman bersama dalam mode target
  mengikat metadata persetujuan bertipe yang sama ke tanda terima pesan WhatsApp yang diterima.
- Persetujuan reaksi Signal menangani prompt exec dan plugin hanya ketika kelompok penerusan tingkat atas
  yang sesuai diaktifkan dan merutekannya ke Signal. Persetujuan exec Signal langsung dalam percakapan yang sama dapat
  menyembunyikan fallback lokal `/approve` tanpa pemberi persetujuan eksplisit; resolusi reaksi Signal
  tetap memerlukan pemberi persetujuan Signal eksplisit dari `channels.signal.allowFrom` atau `defaultTo`.
- Perutean DM/channel native Matrix dan pintasan reaksi menangani persetujuan exec maupun plugin;
  otorisasi plugin tetap berasal dari `channels.matrix.dm.allowFrom`. Prompt native Matrix
  menyertakan konten peristiwa khusus `com.openclaw.approval` pada peristiwa prompt pertama agar klien
  Matrix yang mendukung OpenClaw dapat membaca status persetujuan terstruktur, sementara klien standar tetap menggunakan fallback
  teks biasa `/approve`.
- Tombol persetujuan native Discord dan Telegram membawa jenis pemilik exec atau plugin secara eksplisit dalam
  data callback privat transport dan hanya menyelesaikan pemilik tersebut. Kontrol `/approve` lama yang tidak memiliki
  jenis tetap menjadi jalur kompatibilitas terbatas: kontrol tersebut hanya mencoba jenis pemilik yang dapat disetujui aktor,
  melanjutkan hanya setelah hasil persetujuan-tidak-ditemukan, dan tidak pernah menyimpulkan kepemilikan dari ID persetujuan.
- Pemohon tidak harus menjadi pemberi persetujuan.
- Jika tidak ada UI operator atau klien persetujuan terkonfigurasi yang dapat menerima permintaan, prompt beralih ke
  `askFallback`.

Perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory` menggunakan
perutean pemilik privat untuk prompt persetujuan dan hasil akhir. OpenClaw pertama-tama mencoba rute privat pada
permukaan yang sama tempat pemilik menjalankan perintah. Jika permukaan tersebut tidak memiliki rute pemilik privat, OpenClaw
beralih ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, sehingga perintah grup Discord
tetap dapat mengirim persetujuan dan hasil ke DM Telegram pemilik ketika Telegram dikonfigurasi sebagai
antarmuka privat utama. Percakapan grup hanya menerima konfirmasi singkat.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [Bot QQ](/channels/qqbot)

### Aplikasi operator seluler resmi

Aplikasi iOS dan Android resmi juga dapat meninjau persetujuan exec tertunda milik Gateway
ketika koneksi `operator.admin` digunakan, atau ketika perangkat
`operator.approvals` yang dipasangkan dengannya secara eksplisit ditargetkan oleh permintaan. Aplikasi tersebut membaca
rekaman tahan lama yang telah disanitasi dan sama dengan yang digunakan oleh
UI Kontrol, mengirim keputusan yang mempertimbangkan jenis, serta menampilkan hasil kanonis
jawaban pertama dari Gateway. Apple Watch mencerminkan prompt persetujuan ini melalui
iPhone yang dipasangkan, dengan tindakan izinkan sekali dan tolak. Mode Gateway langsung pada Watch
tidak meninjau persetujuan.

Hilangnya konfirmasi resolusi tidak menjadikan pilihan yang dikirim sebagai keputusan otoritatif:
aplikasi menonaktifkan kontrol dan membaca kembali rekaman. Jika permukaan lain
lebih dahulu menyelesaikannya, aplikasi menampilkan keputusan yang tercatat tersebut. Prompt tertunda tetap terikat pada
Gateway yang menerbitkannya, sehingga mengganti Gateway aktif tidak dapat mengalihkan
ID persetujuan lama.

### Alur IPC macOS

```
Gateway -> Layanan Node (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Aplikasi Mac (UI + persetujuan + system.run)
```

Catatan keamanan:

- Mode soket Unix `0600`, token disimpan di `exec-approvals.json`.
- Pemeriksaan peer dengan UID yang sama.
- Tantangan/respons (nonce + token HMAC + hash permintaan) + TTL singkat.

## FAQ

### Kapan `accountId` dan `threadId` digunakan pada target persetujuan?

Gunakan `accountId` saat channel memiliki beberapa identitas yang dikonfigurasi dan prompt persetujuan harus
dikirim melalui satu akun tertentu. Gunakan `threadId` saat tujuan mendukung topik atau
utas dan prompt harus tetap berada di dalam utas tersebut, bukan di percakapan tingkat atas.

Contoh konkret Telegram adalah supergrup operasi dengan topik forum dan dua akun
bot Telegram. Nilai `to` menamai supergrup, `accountId` memilih akun bot, dan `threadId`
memilih topik forum:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "targets",
      targets: [
        {
          channel: "telegram",
          to: "-1001234567890",
          accountId: "ops-bot",
          threadId: "77",
        },
      ],
    },
  },
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "env:TELEGRAM_PRIMARY_BOT_TOKEN",
        },
        "ops-bot": {
          name: "Operations bot",
          botToken: "env:TELEGRAM_OPS_BOT_TOKEN",
        },
      },
    },
  },
}
```

Dengan penyiapan tersebut, persetujuan exec yang diteruskan diposting oleh akun Telegram `ops-bot` ke topik
`77` dalam percakapan `-1001234567890`. Target tanpa `accountId` menggunakan akun default channel, dan
target tanpa `threadId` memposting ke tujuan tingkat atas.

### Ketika persetujuan dikirim ke suatu sesi, apakah siapa pun dalam sesi tersebut dapat menyetujuinya?

Tidak. Pengiriman ke sesi hanya mengontrol tempat prompt muncul. Hal tersebut tidak dengan sendirinya memberikan wewenang kepada setiap
peserta dalam obrolan tersebut untuk menyetujui.

Untuk `/approve` umum dalam obrolan yang sama, pengirim harus sudah memiliki wewenang untuk menjalankan perintah dalam
sesi saluran tersebut. Jika saluran menyediakan pemberi persetujuan secara eksplisit, pemberi persetujuan tersebut dapat mengizinkan
tindakan `/approve` meskipun mereka tidak memiliki wewenang untuk menjalankan perintah lain dalam sesi tersebut.

Beberapa saluran menerapkan aturan yang lebih ketat. DM persetujuan native Discord, Telegram, Matrix, dan Slack, serta
klien persetujuan native serupa menggunakan daftar pemberi persetujuan yang telah diresolusi untuk otorisasi persetujuan. Misalnya,
prompt persetujuan dalam topik forum Telegram dapat terlihat oleh semua orang dalam topik tersebut, tetapi hanya ID pengguna
Telegram numerik yang diresolusi dari `channels.telegram.execApprovals.approvers` atau
`commands.ownerAllowFrom` yang dapat menyetujui atau menolaknya.

## Terkait

- [Persetujuan eksekusi](/id/tools/exec-approvals) — kebijakan inti dan alur persetujuan
- [Alat eksekusi](/id/tools/exec)
- [Mode dengan hak istimewa lebih tinggi](/id/tools/elevated)
- [Skills](/id/tools/skills) — perilaku izin otomatis yang didukung skill
