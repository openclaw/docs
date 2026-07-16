---
read_when:
    - Memasangkan atau menghubungkan kembali Node Android
    - Men-debug penemuan atau autentikasi Gateway Android
    - Mencerminkan atau mengendalikan perangkat Android dari Mac jarak jauh
    - Memverifikasi kesetaraan riwayat obrolan di seluruh klien
summary: 'Aplikasi Android (Node): panduan operasional koneksi + antarmuka perintah Hubungkan/Obrolan/Suara/Kanvas'
title: Aplikasi Android
x-i18n:
    generated_at: "2026-07-16T18:20:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Aplikasi Android resmi tersedia di [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) dan sebagai APK mandiri bertanda tangan pada [GitHub Releases](https://github.com/openclaw/openclaw/releases) yang didukung. Aplikasi ini merupakan Node pendamping dan memerlukan Gateway OpenClaw yang sedang berjalan. Sumber: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([petunjuk build](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Ringkasan dukungan

- Peran: aplikasi Node pendamping (Android tidak menghosting Gateway).
- Gateway diperlukan: ya (jalankan di macOS, Linux, atau Windows melalui WSL2).
- Instalasi: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) atau `OpenClaw-Android.apk` dari [GitHub Release](https://github.com/openclaw/openclaw/releases) yang didukung, [Memulai](/id/start/getting-started) untuk Gateway, lalu [Pemasangan](/id/channels/pairing).
- Gateway: [Panduan operasional](/id/gateway) + [Konfigurasi](/id/gateway/configuration).
  - Protokol: [Protokol Gateway](/id/gateway/protocol) (Node + bidang kontrol).

Kontrol sistem (launchd/systemd) berada di host Gateway — lihat [Gateway](/id/gateway).

## Instalasi di luar Google Play

GitHub Releases final dan koreksi reguler menyertakan `OpenClaw-Android.apk` universal dan `OpenClaw-Android-SHA256SUMS.txt`. APK dibuat dari tag rilis, ditandatangani dengan kunci rilis Android OpenClaw, dan memiliki provenans GitHub Actions.

Pilih [rilis](https://github.com/openclaw/openclaw/releases) yang mencantumkan kedua aset tersebut, lalu unduh dan verifikasi tag yang tepat sebelum melakukan sideload:

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Instalasi Google Play dan APK mandiri menggunakan saluran pembaruan yang berbeda dan mungkin memiliki identitas penandatanganan yang berbeda. Android mungkin mengharuskan aplikasi yang ada dihapus instalasinya sebelum berpindah saluran, yang akan menghapus data aplikasi lokalnya. Tetap gunakan satu saluran untuk pembaruan normal.
</Warning>

## Mencerminkan dan mengontrol Android dari Mac jarak jauh

[scrcpy](https://github.com/Genymobile/scrcpy) mencerminkan layar Android di jendela macOS dan
meneruskan masukan papan ketik dan penunjuk melalui Android Debug Bridge (ADB). Ini adalah alur kerja
sisi operator, terpisah dari koneksi Node OpenClaw. Fitur ini berguna ketika perangkat Android dan
Mac berada di lokasi berbeda tetapi menggunakan jaringan pribadi Tailscale yang sama.

### Sebelum memulai

- Instal Tailscale pada perangkat Android dan Mac, lalu hubungkan keduanya ke tailnet yang sama.
- Di Android, aktifkan **Developer options** dan **USB debugging**. Android 16 menempatkan **Wireless
  debugging** di bawah **Settings > System > Developer options**. Lihat [opsi pengembang
  Android](https://developer.android.com/studio/debug/dev-options).
- Instal scrcpy dan ADB di Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Pastikan perangkat Android tersedia untuk koneksi pertama. Android harus menyetujui kunci ADB
  setiap Mac sebelum Mac tersebut dapat mengontrol perangkat.

### Mengaktifkan ADB melalui TCP

Untuk penyiapan awal, hubungkan perangkat Android melalui USB ke komputer tepercaya dan setujui
perintah debugging-nya. Kemudian jalankan:

```bash
adb devices
adb tcpip 5555
```

Sekarang Anda dapat melepaskan USB. Jika port 5555 berhenti mendengarkan setelah perangkat dimulai ulang atau debugging direset,
ulangi langkah penyiapan lokal ini. Android 11 dan versi lebih baru juga dapat menetapkan kepercayaan awal dengan
**Wireless debugging > Pair device with pairing code** dan `adb pair`.

### Mengizinkan hanya Mac pengontrol

Tailnet dengan pemberian akses yang ketat harus secara eksplisit mengizinkan Mac pengontrol menjangkau port TCP 5555
pada perangkat Android. Tambahkan aturan terbatas ke kebijakan tailnet, dengan mengganti alamat contoh
menggunakan IP Tailscale stabil milik kedua perangkat:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

Lihat [pemberian akses Tailscale](https://tailscale.com/docs/reference/syntax/grants) untuk alias host dan pemilih
lainnya. Jangan berikan akses port ini ke internet publik atau mengeksposnya dengan Funnel: klien ADB
yang diotorisasi memiliki kontrol luas atas perangkat.

### Menghubungkan dan memulai pencerminan

Di Mac jarak jauh:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

`adb connect` pertama dari Mac ini menampilkan dialog otorisasi di Android. Buka kunci perangkat,
konfirmasikan sidik jari kunci, dan pilih **Always allow from this computer** hanya jika Mac
tepercaya. Entri `adb devices` yang berhasil diakhiri dengan `device`; `unauthorized` berarti perintah pada perangkat
belum disetujui.

Setelah jendela scrcpy terbuka, gunakan secara langsung atau targetkan dengan alat otomatisasi layar macOS seperti
[Peekaboo](https://peekaboo.sh/). scrcpy membawa tampilan dan masukan; Tailscale hanya menyediakan
jalur jaringan pribadi.

### Pemecahan masalah

- `Connection timed out`: verifikasi pemberian akses tailnet untuk TCP 5555. `tailscale ping` yang berhasil membuktikan
  keterjangkauan peer, bukan bahwa kebijakan mengizinkan port TCP ini. Uji dengan
  `nc -vz <android-tailnet-ip> 5555` dari Mac.
- `unauthorized`: buka kunci Android dan setujui kunci ADB Mac jarak jauh, atau hapus workstation yang kedaluwarsa
  di bawah **Wireless debugging > Paired devices** dan pasangkan kembali.
- `Connection refused`: hubungkan kembali secara lokal dan jalankan lagi `adb tcpip 5555`.
- Lebih dari satu perangkat tercantum: pertahankan argumen `--serial <android-tailnet-ip>:5555` secara eksplisit.

Setelah selesai, tutup scrcpy dan putuskan koneksi ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Panduan operasional koneksi

Aplikasi Node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android terhubung langsung ke WebSocket Gateway dan menggunakan pemasangan perangkat (`role: node`).

Untuk Tailscale atau host publik, Android memerlukan endpoint aman:

- Disarankan: Tailscale Serve / Funnel dengan `https://<magicdns>` / `wss://<magicdns>`
- Juga didukung: URL Gateway `wss://` lainnya dengan endpoint TLS nyata
- `ws://` tanpa enkripsi tetap didukung pada alamat LAN pribadi / host `.local`, serta `localhost`, `127.0.0.1`, dan jembatan emulator Android (`10.0.2.2`); penyiapan non-loopback secara otomatis menggunakan akses operator terbatas

### Prasyarat

- Gateway berjalan di mesin lain (atau dapat dijangkau melalui SSH).
- Perangkat/emulator Android dapat menjangkau WebSocket Gateway:
  - LAN yang sama dengan mDNS/NSD, **atau**
  - Tailnet Tailscale yang sama menggunakan Wide-Area Bonjour / DNS-SD unicast (lihat di bawah), **atau**
  - Host/port Gateway manual (fallback)
- Pemasangan seluler tailnet/publik **tidak** menggunakan endpoint IP tailnet mentah `ws://`. Gunakan Tailscale Serve atau URL `wss://` lainnya sebagai gantinya.
- CLI `openclaw` tersedia di mesin Gateway (atau melalui SSH), untuk menyetujui permintaan pemasangan.

### 1. Memulai Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Pastikan di log Anda melihat sesuatu seperti:

- `listening on ws://0.0.0.0:18789`

Untuk akses Android jarak jauh melalui Tailscale, gunakan Serve/Funnel alih-alih pengikatan tailnet mentah:

```bash
openclaw gateway --tailscale serve
```

Ini memberikan endpoint `wss://` / `https://` yang aman kepada Android. Penyiapan `gateway.bind: "tailnet"` biasa tidak cukup untuk pemasangan Android jarak jauh pertama kali kecuali Anda juga mengakhiri TLS secara terpisah.

### 2. Memverifikasi penemuan (opsional)

Dari mesin Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Catatan debugging lainnya: [Bonjour](/id/gateway/bonjour).

Jika Anda juga mengonfigurasi domain penemuan area luas, bandingkan dengan:

```bash
openclaw gateway discover --json
```

Ini menampilkan `local.` beserta domain area luas yang dikonfigurasi dalam sekali jalan, menggunakan endpoint layanan yang telah diresolusikan alih-alih hanya petunjuk TXT.

#### Penemuan lintas jaringan melalui DNS-SD unicast

Penemuan NSD/mDNS Android tidak melintasi jaringan. Jika Node Android dan Gateway berada di jaringan berbeda tetapi terhubung melalui Tailscale, gunakan Wide-Area Bonjour / DNS-SD unicast. Penemuan saja tidak cukup untuk pemasangan Android tailnet/publik — rute yang ditemukan tetap memerlukan endpoint aman (`wss://` atau Tailscale Serve):

1. Siapkan zona DNS-SD (contoh `openclaw.internal.`) pada host Gateway dan publikasikan catatan `_openclaw-gw._tcp`.
2. Konfigurasikan DNS terbagi Tailscale untuk domain yang Anda pilih agar mengarah ke server DNS tersebut.

Detail dan contoh konfigurasi CoreDNS: [Bonjour](/id/gateway/bonjour).

### 3. Menghubungkan dari Android

Di aplikasi Android:

- Aplikasi menjaga koneksi Gateway tetap aktif melalui **layanan latar depan** (notifikasi persisten).
- Buka tab **Connect**.
- Gunakan mode **Setup Code** atau **Manual**.
- Jika penemuan diblokir, gunakan host/port manual di **Advanced controls**. Untuk host LAN pribadi, `ws://` tetap berfungsi. Untuk host Tailscale/publik, aktifkan TLS dan gunakan endpoint `wss://` / Tailscale Serve.

Setelah pemasangan pertama berhasil, Android secara otomatis menyambung kembali saat diluncurkan ke Gateway aktif yang telah dipasangkan (upaya terbaik untuk Gateway yang ditemukan, yang harus terlihat di jaringan).

Kode penyiapan resmi menghubungkan Android sebagai Node dan memberikan akses operator Gateway penuh
secara default melalui `wss://`. Penyiapan `ws://` non-loopback tanpa enkripsi
secara otomatis menggunakan akses terbatas demi keamanan token bearer. **Settings → Gateway**
menampilkan akses **Full** atau **Limited**. Untuk koneksi terbatas, konfigurasikan
`wss://` atau Tailscale Serve, buat kode akses penuh baru di Control UI atau
dengan `openclaw qr`, lalu pindai atau tempelkan kode tersebut pada halaman itu dan hubungkan kembali. Operator
yang menginginkan profil terbatas dapat memilih **Limited access** di Control UI atau menjalankan
`openclaw qr --limited`.

### Beberapa Gateway

Aplikasi menyimpan registri setiap Gateway yang pernah dipasangkan, sehingga Anda dapat beralih di antaranya tanpa melakukan pemasangan lagi:

- **Settings -> Gateways** mencantumkan Gateway yang telah dipasangkan dengan penanda pada Gateway yang aktif. Ketuk entri untuk beralih; aplikasi mengakhiri sesi saat ini dan menyambung kembali ke Gateway yang dipilih.
- Tab **Connect** menampilkan pengalih cepat jika lebih dari satu Gateway telah dipasangkan.
- Kredensial, token perangkat, kepercayaan TLS, riwayat obrolan, dan pesan luring yang mengantre disimpan per Gateway. Peralihan tidak pernah mencampurkan status antar-Gateway, dan pesan yang diantrekan saat luring hanya dikirimkan ke Gateway yang menjadi tujuan saat pesan ditulis.
- **Forget** menghapus entri registri Gateway beserta kredensial, token perangkat, pin TLS, dan obrolan yang di-cache.

### Beacon kehadiran aktif

Setelah sesi Node terautentikasi terhubung, dan ketika aplikasi berpindah ke latar belakang sementara layanan latar depan masih terhubung, Android memanggil `node.event` dengan `event: "node.presence.alive"`. Gateway mencatatnya sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata Node/perangkat yang dipasangkan hanya setelah identitas perangkat Node terautentikasi diketahui.

Aplikasi menganggap beacon berhasil dicatat hanya ketika respons Gateway menyertakan `handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons tersebut kompatibel tetapi tidak dihitung sebagai pembaruan terakhir terlihat yang persisten.

### 4. Menyetujui pemasangan (CLI)

Di mesin Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detail pemasangan: [Pemasangan](/id/channels/pairing).

Opsional: jika node Android selalu terhubung dari subnet yang dikontrol secara ketat, Anda dapat memilih untuk mengaktifkan persetujuan otomatis node saat pertama kali dengan CIDR eksplisit atau IP persis:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Fitur ini dinonaktifkan secara default. Fitur ini hanya berlaku untuk pemasangan `role: node` baru tanpa cakupan yang diminta. Pemasangan operator/peramban dan setiap perubahan peran, cakupan, metadata, atau kunci publik tetap memerlukan persetujuan manual.

### 5. Verifikasi bahwa node telah terhubung

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Obrolan + riwayat

Tab Obrolan Android mendukung pemilihan sesi (default `main`, serta sesi lain yang sudah ada):

- Riwayat: `chat.history` (dinormalisasi untuk tampilan — tag direktif sebaris, payload XML pemanggilan alat dalam teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, dan varian yang dipotong), serta token kontrol model ASCII/lebar penuh yang bocor akan dihapus; baris asisten dengan token senyap seperti `NO_REPLY` / `no_reply` persis akan dihilangkan; baris yang terlalu besar dapat diganti dengan placeholder)
- Kirim: `chat.send`
- Pengiriman persisten: setiap pengiriman (teks, gambar yang dipilih, dan catatan suara) dicatat ke kotak keluar per-Gateway di perangkat sebelum upaya jaringan apa pun, sehingga penghentian aplikasi tidak dapat menghilangkan masukan yang telah dikirimkan. Pengiriman yang diantrekan saat luring dikirim secara berurutan setelah terhubung kembali dengan kunci idempotensi yang stabil, dan suatu pengiriman hanya dihapus setelah giliran terlihat dalam `chat.history` kanonis — pengakuan saja tidak dianggap sebagai bukti pengiriman. Hasil yang ambigu (pengakuan hilang, aplikasi dihentikan saat pengiriman berlangsung, Gateway dimulai ulang sebelum transkrip ditulis) ditampilkan sebagai baris yang terlihat dengan **Coba Lagi**/**Hapus** secara eksplisit, bukan dikirim ulang secara otomatis. Perintah garis miring tidak pernah diputar ulang secara otomatis setelah terhubung kembali; perintah tersebut ditahan untuk dicoba ulang secara eksplisit. Antrean dibatasi (50 pesan dan 48 MB byte lampiran per Gateway), dan baris yang belum terkirim kedaluwarsa setelah 48 jam. Draf penyusun yang tidak pernah dikirimkan tidak dipertahankan antarpenghentian proses.
- Pembaruan push (upaya terbaik): `chat.subscribe` -> `event:"chat"`
- Dengarkan: tekan lama pesan asisten dan pilih **Dengarkan** untuk mendengarnya; audio dirender melalui `tts.speak` Gateway dengan rantai penyedia TTS yang dikonfigurasi, dan TTS sistem di perangkat digunakan ketika Gateway tidak dapat merender audio. Pemutaran berhenti saat sesi beralih, obrolan baru dibuat, aplikasi masuk ke latar belakang, atau obrolan ditutup.

### 7. Kanvas + kamera

#### Host Kanvas Gateway (disarankan untuk konten web)

Agar node menampilkan HTML/CSS/JS nyata yang dapat diedit agen pada disk, arahkan node ke host kanvas Gateway.

<Note>
Node memuat kanvas dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
</Note>

1. Buat `~/.openclaw/workspace/canvas/index.html` pada host Gateway.
2. Arahkan node ke sana (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opsional): jika kedua perangkat berada di Tailscale, gunakan nama MagicDNS atau IP tailnet sebagai pengganti `.local`, misalnya `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Server ini menyuntikkan klien pemuatan ulang langsung ke HTML dan memuat ulang saat file berubah. Gateway juga menyajikan `/__openclaw__/a2ui/`, tetapi aplikasi Android memperlakukan halaman A2UI jarak jauh hanya untuk perenderan. Perintah A2UI yang mendukung tindakan menggunakan halaman A2UI bawaan yang dimiliki aplikasi.

Perintah kanvas (hanya latar depan):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gunakan `{"url":""}` atau `{"url":"/"}` untuk kembali ke kerangka default). `canvas.snapshot` mengembalikan `{ format, base64 }` (default `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias lama `canvas.a2ui.pushJSONL`). Perintah ini menggunakan halaman A2UI bawaan yang dimiliki aplikasi untuk perenderan yang mendukung tindakan.

Perintah kamera (hanya latar depan; dibatasi izin): `camera.snap` (jpg), `camera.clip` (mp4). Lihat [Node kamera](/id/nodes/camera) untuk parameter dan pembantu CLI.

### 8. Suara + permukaan perintah Android yang diperluas

- Tab Suara: Android memiliki dua mode perekaman eksplisit. **Mikrofon** adalah sesi manual pada tab Suara yang mengirim setiap jeda sebagai giliran obrolan dan berhenti saat aplikasi meninggalkan latar depan atau pengguna meninggalkan tab Suara. **Bicara** adalah Mode Bicara berkelanjutan dan terus mendengarkan hingga dinonaktifkan atau node terputus.
- Mode Bicara menaikkan layanan latar depan yang sudah ada dari `connectedDevice` menjadi `connectedDevice|microphone` sebelum perekaman dimulai, lalu menurunkannya ketika Mode Bicara berhenti. Layanan node mendeklarasikan `FOREGROUND_SERVICE_CONNECTED_DEVICE` dengan `CHANGE_NETWORK_STATE`; Android 14+ juga memerlukan deklarasi `FOREGROUND_SERVICE_MICROPHONE`, pemberian izin runtime `RECORD_AUDIO`, dan jenis layanan mikrofon saat runtime.
- Secara default, Bicara Android menggunakan pengenalan ucapan native, obrolan Gateway, dan `talk.speak` melalui penyedia Bicara Gateway yang dikonfigurasi. TTS sistem lokal hanya digunakan ketika `talk.speak` tidak tersedia.
- Bicara Android hanya menggunakan relai Gateway waktu nyata ketika `talk.realtime.mode` adalah `realtime` dan `talk.realtime.transport` adalah `gateway-relay`.
- Android tidak mengiklankan kapabilitas `voiceWake`. Gunakan **Mikrofon** atau **Bicara** untuk masukan suara.
- Kelompok perintah Android tambahan (ketersediaan bergantung pada perangkat, izin, dan pengaturan pengguna):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` hanya ketika **Settings > Phone Capabilities > Installed Apps** diaktifkan; secara default, perintah ini mencantumkan aplikasi yang terlihat di peluncur (teruskan `includeNonLaunchable` untuk daftar lengkap).
  - `notifications.list`, `notifications.actions` (lihat [Penerusan notifikasi](#notification-forwarding) di bawah)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. File ruang kerja (hanya baca)

Ikhtisar Beranda menyertakan kartu **File** yang menelusuri ruang kerja agen aktif melalui RPC Gateway `agents.workspace.list` / `agents.workspace.get` yang hanya baca: penelusuran hierarki direktori, pratinjau teks dan gambar, serta ekspor melalui lembar berbagi Android. Tidak ada operasi tulis, dan ukuran pratinjau dibatasi oleh Gateway.

## Meninjau persetujuan perintah

Koneksi operator dengan `operator.admin`, atau koneksi
`operator.approvals` yang telah dipasangkan dan secara eksplisit ditargetkan oleh Gateway, dapat meninjau
permintaan eksekusi yang tertunda di **Settings -> Approvals**. Aplikasi memuat catatan
persetujuan Gateway yang telah disanitasi sebelum mengaktifkan tombolnya, menampilkan setiap
peringatan keamanan dan keputusan persis yang ditawarkan oleh permintaan tersebut, serta mengirimkan
ID persetujuan dan jenis pemilik kembali ke Gateway.

Status persetujuan dibagikan dengan UI Kontrol dan permukaan obrolan yang didukung. Jawaban
pertama yang disimpan akan berlaku; Android menampilkan hasil kanonis tersebut meskipun
permukaan lain menjawab lebih dahulu. Jika respons penyelesaian hilang atau Gateway
terputus, aplikasi tetap mengunci tindakan dan membaca kembali persetujuan
sebelum menawarkan keputusan lain.

Gateway yang mendahului metode persetujuan terpadu akan beralih kembali ke metode
khusus eksekusi yang telah dirilis. Peninjauan tertunda tetap berfungsi, tetapi status terminal yang dipertahankan
dan hasil lintas-permukaan yang lebih lengkap memerlukan Gateway yang diperbarui.

## Titik masuk asisten

Android mendukung peluncuran OpenClaw dari pemicu asisten sistem (Google Assistant). Menahan tombol beranda (atau pemicu `ACTION_ASSIST` lainnya) akan membuka aplikasi; mengucapkan "Hey Google, ask OpenClaw `<prompt>`" cocok dengan pola kueri App Actions yang dideklarasikan aplikasi dan memasukkan perintah ke penyusun obrolan tanpa mengirimkannya secara otomatis.

Fitur ini menggunakan **App Actions** Android (kapabilitas `shortcuts.xml`) yang dideklarasikan dalam manifes aplikasi. Tidak diperlukan konfigurasi di sisi Gateway — intent asisten ditangani sepenuhnya oleh aplikasi Android.

<Note>
Ketersediaan App Actions bergantung pada perangkat, versi Google Play Services, dan apakah pengguna telah menetapkan OpenClaw sebagai aplikasi asisten default.
</Note>

## Penerusan notifikasi

Android dapat meneruskan notifikasi perangkat ke Gateway sebagai item `node.event`. Fitur ini dikonfigurasi **di perangkat**, pada lembar Pengaturan aplikasi — bukan dalam konfigurasi Gateway/`openclaw.json`.

| Pengaturan                  | Deskripsi                                                                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | Tombol pengalih utama. Nonaktif secara default; Notification Listener Access harus diberikan terlebih dahulu.                                                                                             |
| Package Filter              | **Allowlist** (hanya ID paket yang dicantumkan yang diteruskan) atau **Blocklist** (default: semua paket kecuali ID yang dicantumkan). Paket OpenClaw sendiri selalu dikecualikan dalam mode Blocklist untuk mencegah perulangan penerusan. |
| Quiet Hours                 | Rentang waktu mulai/selesai HH:mm lokal yang menekan penerusan. Dinonaktifkan secara default; menggunakan default `22:00`-`07:00` setelah diaktifkan.                                |
| Max Events / Minute         | Batas laju per perangkat untuk notifikasi yang diteruskan. Default 20.                                                                                                                                   |
| Route Session Key           | Opsional. Menetapkan peristiwa notifikasi yang diteruskan ke sesi tertentu, bukan ke rute notifikasi default perangkat.                                                                                   |

<Note>
Penerusan notifikasi memerlukan izin Android Notification Listener. Aplikasi meminta izin ini selama penyiapan.
</Note>

Notifikasi WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord, dan Signal selalu dikecualikan. Pesannya sudah dimiliki oleh sesi channel native OpenClaw; meneruskan notifikasi Android sebagai peristiwa node terpisah dapat merutekan balasan melalui percakapan yang salah.

## Terkait

- [Aplikasi iOS](/id/platforms/ios)
- [Node](/id/nodes)
- [Pemecahan masalah node Android](/id/nodes/troubleshooting)
