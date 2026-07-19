---
read_when:
    - Mengonfigurasi bin aman atau profil bin aman khusus
    - Meneruskan persetujuan ke Slack/Discord/Telegram atau kanal obrolan lainnya
    - Mengimplementasikan klien persetujuan native untuk saluran
summary: 'Persetujuan exec lanjutan: bin aman, pengikatan interpreter, penerusan persetujuan, pengiriman native'
title: Persetujuan eksekusi — lanjutan
x-i18n:
    generated_at: "2026-07-19T16:46:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 628f695f2a005d537b11966bab7f6626aa87d473b1f1d5d72319a57aa7d9b24c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Topik persetujuan exec lanjutan: jalur cepat `safeBins`, pengikatan interpreter/runtime,
dan penerusan persetujuan ke saluran chat (termasuk pengiriman native).
Untuk kebijakan inti dan alur persetujuan, lihat [Persetujuan exec](/id/tools/exec-approvals).

## Bin aman (hanya stdin)

`tools.exec.safeBins` menamai biner **hanya stdin** (misalnya `cut`) yang
berjalan dalam mode daftar yang diizinkan **tanpa** entri daftar yang diizinkan eksplisit. Bin aman menolak
argumen file posisional dan token yang menyerupai path, sehingga hanya dapat beroperasi pada
aliran masuk. Perlakukan ini sebagai jalur cepat terbatas untuk filter aliran, bukan
daftar kepercayaan umum.

<Warning>
**Jangan** tambahkan biner interpreter atau runtime (misalnya `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) ke `safeBins`. Jika suatu perintah dapat mengevaluasi kode,
menjalankan subperintah, atau membaca file sebagai bagian dari desainnya, utamakan entri daftar yang diizinkan eksplisit
dan pertahankan prompt persetujuan tetap aktif. Bin aman kustom harus menetapkan profil eksplisit
di `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bin aman default:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` dan `sort` tidak ada dalam daftar default. Jika Anda mengaktifkannya, pertahankan entri
daftar yang diizinkan eksplisit untuk alur kerja non-stdin-nya. Untuk `grep` dalam mode bin aman,
berikan pola dengan `-e`/`--regexp`; bentuk pola posisional ditolak
agar operand file tidak dapat diselundupkan sebagai argumen posisional yang ambigu.

### Validasi argv dan flag yang ditolak

Validasi bersifat deterministik hanya berdasarkan bentuk argv (tanpa pemeriksaan keberadaan
sistem file host), sehingga mencegah perilaku oracle keberadaan file akibat perbedaan
izin/tolak. Opsi yang berorientasi pada file ditolak untuk bin aman default; validasi opsi
panjang bersifat gagal-tertutup (flag tidak dikenal dan singkatan ambigu
ditolak). Flag boolean hanya-baca yang dikenali dari bin default (misalnya
`wc -l`, `tr -d`, `uniq -c`) diterima, sedangkan flag pendek yang tidak dikenali tetap
gagal-tertutup dan dialihkan ke persetujuan manual.

Flag yang ditolak berdasarkan profil bin aman:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bin aman juga memaksa token argv diperlakukan sebagai **teks literal** saat eksekusi
(tanpa globbing dan tanpa ekspansi `$VARS`) untuk segmen hanya stdin, sehingga
pola seperti `*` atau `$HOME/...` tidak dapat digunakan untuk menyelundupkan pembacaan file. `awk`,
`sed`, dan `jq` selalu ditolak sebagai bin aman karena semantiknya tidak dapat
divalidasi sebagai hanya stdin: `jq` dapat membaca data lingkungan dan memuat kode jq dari
modul atau file startup. Gunakan entri daftar yang diizinkan eksplisit atau prompt persetujuan untuk
alat tersebut, bukan `safeBins`.

### Direktori biner tepercaya

Bin aman harus di-resolve dari direktori biner tepercaya (default sistem ditambah
`tools.exec.safeBinTrustedDirs` opsional). Entri `PATH` tidak pernah dipercaya secara otomatis.
Direktori tepercaya default sengaja dibuat minimal: `/bin`, `/usr/bin`. Jika
executable bin aman Anda berada di path pengelola paket/pengguna (misalnya
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), tambahkan
secara eksplisit ke `tools.exec.safeBinTrustedDirs`.

### Perangkaian shell, wrapper, dan multiplexer

Perangkaian shell (`&&`, `||`, `;`) diizinkan jika setiap segmen tingkat atas
memenuhi daftar yang diizinkan (termasuk bin aman atau izin otomatis skill). Pengalihan
tetap tidak didukung dalam mode daftar yang diizinkan. Substitusi perintah (`$()` / backtick)
ditolak selama penguraian daftar yang diizinkan, termasuk di dalam tanda kutip ganda; gunakan tanda
kutip tunggal jika Anda memerlukan teks `$()` literal.

Pada persetujuan aplikasi pendamping macOS, teks shell mentah yang berisi sintaks kontrol atau
ekspansi shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)
diperlakukan sebagai ketidakcocokan daftar yang diizinkan kecuali biner shell itu sendiri ada dalam daftar yang diizinkan.

Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override env dengan cakupan permintaan
dibatasi menjadi daftar yang diizinkan eksplisit berukuran kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Untuk keputusan `allow-always` dalam mode daftar yang diizinkan, wrapper pengiriman transparan
(misalnya `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) menyimpan
path executable bagian dalam, bukan path wrapper. Multiplexer shell
(`busybox`, `toybox`) diurai untuk applet shell (`sh`, `ash`, dan sebagainya) dengan
cara yang sama. Jika wrapper atau multiplexer tidak dapat diurai dengan aman, tidak ada entri daftar yang diizinkan
yang disimpan secara otomatis.

Jika Anda memasukkan interpreter seperti `python3` atau `node` ke daftar yang diizinkan, utamakan
`tools.exec.strictInlineEval=true` agar evaluasi inline tetap memerlukan persetujuan
eksplisit. Dalam mode ketat, `allow-always` masih dapat menyimpan
pemanggilan interpreter/skrip yang aman, tetapi pembawa evaluasi inline tidak disimpan
secara otomatis.

### Bin aman versus daftar yang diizinkan

| Topik            | `tools.exec.safeBins`                                  | Daftar yang diizinkan (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Tujuan             | Mengizinkan otomatis filter stdin terbatas                        | Mempercayai executable tertentu secara eksplisit                                              |
| Jenis kecocokan       | Nama executable + kebijakan argv bin aman                 | Glob path executable yang di-resolve, atau glob nama perintah polos untuk perintah yang dipanggil melalui PATH |
| Cakupan argumen   | Dibatasi oleh profil bin aman dan aturan token literal | Kecocokan path secara default; `argPattern` opsional dapat membatasi argv yang telah diuraikan              |
| Contoh umum | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI kustom                                     |
| Penggunaan terbaik         | Transformasi teks berisiko rendah dalam pipeline                  | Alat apa pun dengan perilaku atau efek samping yang lebih luas                                     |

Lokasi konfigurasi:

- `safeBins` berasal dari konfigurasi (`tools.exec.safeBins` atau `agents.list[].tools.exec.safeBins` per agen).
- `safeBinTrustedDirs` berasal dari konfigurasi (`tools.exec.safeBinTrustedDirs` atau `agents.list[].tools.exec.safeBinTrustedDirs` per agen).
- `safeBinProfiles` berasal dari konfigurasi (`tools.exec.safeBinProfiles` atau `agents.list[].tools.exec.safeBinProfiles` per agen). Kunci profil per agen menimpa kunci global.
- entri daftar yang diizinkan berada dalam file persetujuan lokal-host di bawah `agents.<id>.allowlist` (atau melalui UI Kontrol / `openclaw approvals allowlist ...`).
- `openclaw security audit` memperingatkan dengan `tools.exec.safe_bins_interpreter_unprofiled` ketika bin interpreter/runtime muncul di `safeBins` tanpa profil eksplisit.
- `openclaw doctor --fix` dapat membuat kerangka entri `safeBinProfiles.<bin>` kustom yang belum ada sebagai `{}` (tinjau dan perketat setelahnya). Bin interpreter/runtime tidak dibuatkan kerangka secara otomatis.

Contoh profil kustom:

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
- Bentuk skrip shell langsung dan file runtime langsung diikat sebisa mungkin ke satu snapshot file lokal
  yang konkret.
- Bentuk wrapper pengelola paket umum yang masih di-resolve ke satu file lokal langsung (misalnya
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) diurai sebelum pengikatan.
- Jika OpenClaw tidak dapat mengidentifikasi tepat satu file lokal konkret untuk perintah interpreter/runtime
  (misalnya skrip paket, bentuk evaluasi, rantai loader khusus runtime, atau bentuk multi-file yang
  ambigu), eksekusi yang didukung persetujuan ditolak alih-alih mengklaim cakupan semantik yang tidak
  dimilikinya.
- Untuk alur kerja tersebut, utamakan sandboxing, batas host terpisah, atau alur kerja penuh/daftar yang diizinkan
  tepercaya yang eksplisit, tempat operator menerima semantik runtime yang lebih luas.

Saat persetujuan diwajibkan, alat exec segera mengembalikan id persetujuan. Gunakan id tersebut untuk
mengorelasikan peristiwa sistem eksekusi yang disetujui selanjutnya (`Exec finished`, dan `Exec running` jika dikonfigurasi).
Jika tidak ada keputusan sebelum batas waktu, permintaan diperlakukan sebagai waktu persetujuan habis dan
ditampilkan sebagai penolakan perintah host terminal. Untuk persetujuan asinkron agen utama dengan sesi
asal, OpenClaw juga melanjutkan sesi tersebut dengan tindak lanjut internal agar agen mengamati bahwa
perintah tidak dijalankan, alih-alih kemudian memperbaiki hasil yang hilang. Persetujuan exec yang tertunda kedaluwarsa
setelah 30 menit secara default.

### Perilaku pengiriman tindak lanjut

Setelah exec asinkron yang disetujui selesai, OpenClaw mengirim giliran tindak lanjut `agent` ke sesi yang sama.
Persetujuan asinkron yang ditolak menggunakan jalur tindak lanjut sesi utama yang sama untuk status penolakan, tetapi
tidak mendaftarkan serah-terima runtime dengan hak lebih tinggi dan tidak menjalankan perintah. Penolakan tanpa sesi utama
yang dapat dilanjutkan akan ditekan atau dilaporkan melalui rute langsung yang aman jika tersedia.

- Jika tersedia target pengiriman eksternal yang valid (saluran yang dapat mengirim ditambah target `to`), pengiriman tindak lanjut menggunakan saluran tersebut.
- Dalam alur hanya webchat atau sesi internal tanpa target eksternal, pengiriman tindak lanjut tetap hanya melalui sesi (`deliver: false`).
- Jika pemanggil secara eksplisit meminta pengiriman eksternal ketat tanpa saluran eksternal yang dapat di-resolve, permintaan gagal dengan `INVALID_REQUEST`.
- Jika `bestEffortDeliver` diaktifkan dan tidak ada saluran eksternal yang dapat di-resolve, pengiriman diturunkan menjadi hanya melalui sesi alih-alih gagal.

## Cakupan minimal untuk klien pihak ketiga

Resolusi persetujuan Gateway dilindungi oleh cakupan khusus `operator.approvals`. Ini berlaku untuk metode khusus pemilik `exec.approval.resolve` maupun metode tanpa bergantung jenis `approval.resolve`; `operator.write` tidak mencakupnya. Dasbor dan integrasi sebaiknya hanya meminta cakupan yang diperlukan oleh metode yang digunakannya. Perlakukan akses resolusi persetujuan sebagai kewenangan setingkat eksekusi jarak jauh dan berikan `operator.approvals` secara sengaja, bahkan ketika klien hanya menampilkan UI persetujuan kecil.

## Penerusan persetujuan ke saluran chat

Anda dapat meneruskan prompt persetujuan exec ke kanal chat mana pun (termasuk kanal plugin) dan menyetujuinya
dengan `/approve`. Ini menggunakan pipeline pengiriman keluar normal.

Konfigurasi:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring atau regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Balas di chat:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Perintah `/approve` menangani persetujuan exec dan persetujuan plugin. Jika ID tidak cocok dengan persetujuan exec yang tertunda, perintah tersebut secara otomatis memeriksa persetujuan plugin sebagai gantinya. Fallback ini terbatas pada kegagalan "persetujuan tidak ditemukan"; penolakan/kesalahan persetujuan exec yang sebenarnya tidak secara diam-diam dicoba ulang sebagai persetujuan plugin.

### Penerusan persetujuan plugin

Penerusan persetujuan plugin menggunakan pipeline pengiriman yang sama dengan persetujuan exec, tetapi memiliki
konfigurasi independennya sendiri di bawah `approvals.plugin`. Mengaktifkan atau menonaktifkan salah satunya tidak memengaruhi yang lain.
Untuk perilaku penulisan plugin, bidang permintaan, dan semantik keputusan, lihat
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
`sessionFilter`, dan `targets` bekerja dengan cara yang sama.

Kanal yang mendukung balasan interaktif bersama merender tombol persetujuan yang sama untuk persetujuan exec dan
plugin. Kanal tanpa UI interaktif bersama menggunakan teks biasa dengan instruksi `/approve`
sebagai fallback. Permintaan persetujuan plugin dapat membatasi keputusan yang tersedia: permukaan persetujuan menggunakan
kumpulan keputusan yang dinyatakan oleh permintaan, dan Gateway menolak upaya untuk mengirimkan keputusan yang
tidak ditawarkan.

### Persetujuan dalam chat yang sama di kanal mana pun

Ketika permintaan persetujuan exec atau plugin berasal dari permukaan chat yang dapat menerima pengiriman, chat yang sama
dapat menyetujuinya dengan `/approve` secara default. Ini berlaku untuk Slack, Matrix, Microsoft Teams, dan
chat serupa yang dapat menerima pengiriman, selain alur UI Web dan UI terminal yang sudah ada, dengan menggunakan
model autentikasi kanal normal untuk percakapan tersebut. Jika chat asal sudah dapat mengirim perintah
dan menerima balasan, permintaan persetujuan tidak lagi memerlukan adaptor pengiriman native terpisah hanya agar
tetap tertunda.

Discord, Telegram, dan bot QQ juga mendukung `/approve` dalam chat yang sama, tetapi kanal tersebut tetap menggunakan
daftar pemberi persetujuan yang telah diresolusi untuk otorisasi meskipun pengiriman persetujuan native dinonaktifkan.

### Pengiriman persetujuan native

Beberapa kanal juga dapat bertindak sebagai klien persetujuan native: Discord, Slack, Telegram, Matrix, dan bot QQ.
Klien native menambahkan DM pemberi persetujuan, fanout chat asal, dan UX persetujuan interaktif khusus kanal di
atas alur `/approve` bersama dalam chat yang sama.

Ketika kartu/tombol persetujuan native tersedia, UI native tersebut merupakan jalur utama yang ditampilkan kepada agen.
Agen tidak boleh turut menggemakan perintah chat biasa `/approve` yang duplikat, kecuali hasil alat menyatakan
persetujuan chat tidak tersedia atau persetujuan manual merupakan satu-satunya jalur yang tersisa.

Jika klien persetujuan native dikonfigurasi tetapi tidak ada runtime native yang aktif untuk kanal
asal, OpenClaw mempertahankan prompt lokal deterministik `/approve` agar tetap terlihat. Jika runtime native
aktif dan mencoba melakukan pengiriman tetapi tidak ada target yang menerima kartu, OpenClaw mengirimkan pemberitahuan fallback
dalam chat yang sama dengan perintah `/approve <id> <decision>` yang persis agar permintaan tetap dapat diselesaikan.

Model umum:

- kebijakan exec host tetap menentukan apakah persetujuan exec diperlukan
- `approvals.exec` mengontrol penerusan prompt persetujuan ke tujuan chat lain
- `channels.<channel>.execApprovals` mengontrol apakah Discord, Slack, Telegram, bot QQ, dan klien native
  khusus kanal serupa diaktifkan
- Persetujuan plugin Slack dapat menggunakan klien persetujuan native Slack ketika permintaan berasal dari Slack
  dan pemberi persetujuan plugin Slack dapat diresolusi; `approvals.plugin` juga dapat merutekan persetujuan plugin ke sesi
  atau target Slack meskipun persetujuan exec Slack dinonaktifkan
- Kartu persetujuan native Google Chat menangani persetujuan exec dan plugin yang berasal dari ruang atau
  utas Google Chat ketika pemberi persetujuan `users/<id>` yang stabil dapat diresolusi dari `dm.allowFrom` atau
  `defaultTo`; kartu tersebut tidak menggunakan peristiwa reaksi untuk keputusan
- Pengiriman persetujuan melalui reaksi WhatsApp dan Signal dikendalikan oleh `approvals.exec` dan
  `approvals.plugin`; keduanya tidak memiliki blok `channels.<channel>.execApprovals`

Klien persetujuan native secara otomatis mengaktifkan pengiriman yang memprioritaskan DM ketika semua kondisi berikut terpenuhi:

- kanal mendukung pengiriman persetujuan native
- pemberi persetujuan dapat diresolusi dari `execApprovals.approvers` eksplisit atau identitas
  pemilik seperti `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` tidak disetel atau `"auto"`

Setel `enabled: false` untuk menonaktifkan klien persetujuan native secara eksplisit. Setel `enabled: true` untuk memaksanya
aktif ketika pemberi persetujuan dapat diresolusi. Pengiriman publik ke chat asal tetap harus dinyatakan secara eksplisit melalui
`channels.<channel>.execApprovals.target`. Ketika `target` native mengaktifkan pengiriman ke chat asal,
prompt persetujuan menyertakan teks perintah.

FAQ: [Mengapa ada dua konfigurasi persetujuan exec untuk persetujuan chat?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Bot QQ: `channels.qqbot.execApprovals.*`
- Google Chat: konfigurasikan pemberi persetujuan yang stabil dengan `channels.googlechat.dm.allowFrom` atau
  `channels.googlechat.defaultTo`; blok `execApprovals` tidak diperlukan
- WhatsApp: gunakan `approvals.exec` dan `approvals.plugin` untuk merutekan prompt persetujuan ke WhatsApp
- Signal: gunakan `approvals.exec` dan `approvals.plugin` untuk merutekan prompt persetujuan ke Signal

Perutean khusus klien native:

- Telegram secara default menggunakan DM pemberi persetujuan (`target: "dm"`). Beralihlah ke `channel` atau `both` agar
  prompt persetujuan juga ditampilkan di chat/topik Telegram asal. Untuk topik forum Telegram, OpenClaw
  mempertahankan topik untuk prompt persetujuan dan tindak lanjut setelah persetujuan.
- Pemberi persetujuan Discord dan Telegram dapat ditentukan secara eksplisit (`execApprovals.approvers`) atau disimpulkan dari
  `commands.ownerAllowFrom`; hanya pemberi persetujuan yang telah diresolusi yang dapat menyetujui atau menolak.
- Pemberi persetujuan Slack dapat ditentukan secara eksplisit (`execApprovals.approvers`) atau disimpulkan dari
  `commands.ownerAllowFrom`. DM persetujuan plugin Slack menggunakan pemberi persetujuan plugin Slack dari `allowFrom`
  dan perutean default akun, bukan pemberi persetujuan exec Slack. Tombol native Slack mempertahankan jenis ID persetujuan,
  sehingga ID `plugin:` dapat menyelesaikan persetujuan plugin tanpa lapisan fallback lokal Slack kedua.
- Kartu native Google Chat mempertahankan fallback manual `/approve` dalam teks pesan, tetapi callback tombol
  kartu hanya membawa token tindakan opak; ID persetujuan dan keputusan dipulihkan dari
  status tertunda di sisi server.
- Persetujuan emoji WhatsApp menangani prompt exec dan plugin ketika keluarga penerusan tingkat atas yang sesuai
  merutekannya ke WhatsApp. Prompt asal native diikat secara langsung; pengiriman mode target bersama
  mengikat metadata persetujuan bertipe yang sama ke tanda terima pesan WhatsApp yang diterima.
- Persetujuan reaksi Signal menangani prompt exec dan plugin hanya ketika keluarga penerusan tingkat atas yang sesuai
  diaktifkan dan merutekannya ke Signal. Persetujuan exec Signal langsung dalam chat yang sama dapat
  meniadakan fallback lokal `/approve` tanpa pemberi persetujuan eksplisit; resolusi reaksi Signal
  tetap memerlukan pemberi persetujuan Signal eksplisit dari `channels.signal.allowFrom` atau `defaultTo`.
- Perutean DM/kanal native Matrix dan pintasan reaksi menangani persetujuan exec dan plugin;
  otorisasi plugin tetap berasal dari `channels.matrix.dm.allowFrom`. Prompt native Matrix
  menyertakan konten peristiwa kustom `com.openclaw.approval` pada peristiwa prompt pertama agar klien
  Matrix yang mendukung OpenClaw dapat membaca status persetujuan terstruktur sementara klien standar tetap menggunakan
  fallback teks biasa `/approve`.
- Tombol persetujuan native Discord dan Telegram membawa jenis pemilik exec atau plugin secara eksplisit dalam
  data callback privat transport dan hanya meresolusi pemilik tersebut. Kontrol `/approve` lama yang tidak memiliki
  jenis tetap menjadi jalur kompatibilitas terbatas: kontrol tersebut hanya mencoba jenis pemilik yang boleh disetujui oleh pelaku,
  melanjutkan hanya setelah hasil persetujuan-tidak-ditemukan, dan tidak pernah menyimpulkan kepemilikan dari ID persetujuan.
- Pemohon tidak harus menjadi pemberi persetujuan.
- Jika tidak ada UI operator atau klien persetujuan yang dikonfigurasi yang dapat menerima permintaan, prompt menggunakan
  `askFallback` sebagai fallback.

Perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory` menggunakan perutean
pemilik privat untuk prompt persetujuan dan hasil akhir. OpenClaw terlebih dahulu mencoba rute privat pada
permukaan yang sama tempat pemilik menjalankan perintah. Jika permukaan tersebut tidak memiliki rute pemilik privat, OpenClaw menggunakan
rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom` sebagai fallback, sehingga perintah grup Discord
tetap dapat mengirimkan persetujuan dan hasil ke DM Telegram pemilik ketika Telegram dikonfigurasi sebagai
antarmuka privat utama. Chat grup hanya menerima pemberitahuan singkat.

Lihat:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [Bot QQ](/channels/qqbot)

### Aplikasi operator seluler resmi

Aplikasi resmi iOS dan Android juga dapat meninjau persetujuan exec tertunda yang dimiliki Gateway
ketika koneksi `operator.admin` digunakan, atau ketika perangkat `operator.approvals` yang dipasangkan
secara eksplisit ditargetkan oleh permintaan. Aplikasi tersebut membaca
rekaman tahan lama yang telah disanitasi yang sama dengan yang digunakan oleh
UI Kontrol, mengirimkan keputusan yang menyadari jenis, dan menampilkan hasil
jawaban pertama kanonis dari Gateway. Apple Watch mencerminkan prompt persetujuan ini melalui
iPhone yang dipasangkan, dengan tindakan izinkan-sekali dan tolak. Mode Gateway Watch langsung
tidak meninjau persetujuan.

Hilangnya tanda terima penyelesaian tidak menjadikan pilihan yang dikirimkan bersifat otoritatif:
aplikasi menonaktifkan kontrol dan membaca kembali rekaman. Jika permukaan lain
menang, aplikasi menampilkan keputusan yang tercatat tersebut. Prompt tertunda tetap terikat pada
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

Gunakan `accountId` ketika kanal memiliki beberapa identitas yang dikonfigurasi dan prompt persetujuan harus
dikirim melalui satu akun tertentu. Gunakan `threadId` ketika tujuan mendukung topik atau
utas dan prompt harus tetap berada di dalam utas tersebut, bukan di chat tingkat atas.

Contoh konkret Telegram adalah supergrup operasi dengan topik forum dan dua akun bot Telegram.
Nilai `to` menamai supergrup, `accountId` memilih akun bot, dan `threadId`
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

Dengan penyiapan tersebut, persetujuan eksekusi yang diteruskan diposting oleh akun Telegram `ops-bot` ke topik
`77` dari obrolan `-1001234567890`. Target tanpa `accountId` menggunakan akun default kanal, dan
target tanpa `threadId` memposting ke tujuan tingkat teratas.

### Ketika persetujuan dikirim ke suatu sesi, apakah siapa pun dalam sesi tersebut dapat menyetujuinya?

Tidak. Pengiriman sesi hanya mengontrol tempat perintah konfirmasi muncul. Hal tersebut tidak dengan sendirinya memberikan wewenang kepada setiap
peserta dalam obrolan itu untuk memberikan persetujuan.

Untuk `/approve` umum dalam obrolan yang sama, pengirim harus sudah memiliki wewenang untuk menjalankan perintah dalam
sesi kanal tersebut. Jika kanal menyediakan pemberi persetujuan eksplisit, mereka dapat mengesahkan
tindakan `/approve` meskipun tidak memiliki wewenang untuk menjalankan perintah lain dalam sesi tersebut.

Beberapa kanal menerapkan aturan yang lebih ketat. DM persetujuan native Discord, Telegram, Matrix, dan Slack, serta
klien persetujuan native serupa menggunakan daftar pemberi persetujuan yang telah diresolusi untuk otorisasi persetujuan. Misalnya,
perintah konfirmasi persetujuan dalam topik forum Telegram dapat terlihat oleh semua orang dalam topik tersebut, tetapi hanya ID pengguna
Telegram numerik yang diresolusi dari `channels.telegram.execApprovals.approvers` atau
`commands.ownerAllowFrom` yang dapat menyetujui atau menolaknya.

## Terkait

- [Persetujuan eksekusi](/id/tools/exec-approvals) — kebijakan inti dan alur persetujuan
- [Alat eksekusi](/id/tools/exec)
- [Mode dengan hak akses lebih tinggi](/id/tools/elevated)
- [Skills](/id/tools/skills) — perilaku izin otomatis yang didukung skill
