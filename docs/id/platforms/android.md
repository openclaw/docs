---
read_when:
    - Memasangkan atau menghubungkan kembali node Android
    - Men-debug penemuan atau autentikasi Gateway Android
    - Mencerminkan atau mengendalikan perangkat Android dari Mac jarak jauh
    - Memverifikasi kesetaraan riwayat obrolan di seluruh klien
summary: 'Aplikasi Android (node): panduan koneksi + antarmuka perintah Connect/Chat/Voice/Canvas'
title: Aplikasi Android
x-i18n:
    generated_at: "2026-07-19T05:15:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a505b449c140eee63d3e587df82c8730f1e076570f00f2e0c699b0f967b1f7f8
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Aplikasi Android resmi tersedia di [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) dan sebagai APK mandiri bertanda tangan pada [Rilis GitHub](https://github.com/openclaw/openclaw/releases) yang didukung. Aplikasi ini merupakan node pendamping dan memerlukan Gateway OpenClaw yang sedang berjalan. Sumber: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([petunjuk build](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Ringkasan dukungan

- Peran: aplikasi node pendamping (Android tidak meng-host Gateway).
- Gateway diperlukan: ya (jalankan di macOS, Linux, atau Windows melalui WSL2).
- Instalasi: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) atau `OpenClaw-Android.apk` dari [Rilis GitHub](https://github.com/openclaw/openclaw/releases) yang didukung, [Memulai](/id/start/getting-started) untuk Gateway, lalu [Pemasangan](/id/channels/pairing).
- Gateway: [Runbook](/id/gateway) + [Konfigurasi](/id/gateway/configuration).
  - Protokol: [Protokol Gateway](/id/gateway/protocol) (node + bidang kontrol).

Kontrol sistem (launchd/systemd) berada di host Gateway — lihat [Gateway](/id/gateway).

## Pendamping Wear OS

Pendamping Wear OS menggunakan koneksi Gateway terautentikasi milik ponsel Android yang dipasangkan; jam tangan tidak pernah menerima atau menyimpan kredensial Gateway. Aplikasi ini dapat memilih agen dan sesi, membaca transkrip terbatas, mengirim teks atau balasan yang didiktekan, membatalkan proses aktif, memulai Talk waktu nyata di dalam sesi yang dipilih, serta menghubungkan atau memutuskan Gateway ponsel yang dipasangkan. Aplikasi ini juga menyediakan notifikasi balasan lokal, tampilan gelap atau terang, dan pengucapan otomatis opsional untuk balasan. Kontrol agen dan Gateway dinegosiasikan berdasarkan kapabilitas untuk mendukung pembaruan ponsel/jam tangan yang dilakukan bertahap. Talk waktu nyata mengalirkan audio mikrofon dan pemutaran melalui saluran Wear OS Data Layer sementara, lalu berhenti ketika ponsel yang dipilih, koneksi Gateway, atau saluran audio terputus.

## Instalasi di luar Google Play

Rilis GitHub final dan koreksi reguler menyertakan `OpenClaw-Android.apk` universal dan `OpenClaw-Android-SHA256SUMS.txt`. APK dibuat dari tag rilis, ditandatangani dengan kunci rilis Android OpenClaw, dan dilengkapi asal-usul GitHub Actions.

Pilih [rilis](https://github.com/openclaw/openclaw/releases) yang mencantumkan kedua aset, lalu unduh dan verifikasi tag yang tepat tersebut sebelum melakukan sideload:

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
Instalasi Google Play dan APK mandiri menggunakan saluran pembaruan yang berbeda dan mungkin memiliki identitas penandatanganan yang berbeda. Android mungkin mengharuskan aplikasi yang ada dihapus instalasinya sebelum beralih saluran, yang akan menghapus data aplikasi lokalnya. Tetap gunakan satu saluran untuk pembaruan normal.
</Warning>

## Mencerminkan dan mengontrol Android dari Mac jarak jauh

[scrcpy](https://github.com/Genymobile/scrcpy) mencerminkan layar Android di jendela macOS dan
meneruskan input papan ketik serta penunjuk melalui Android Debug Bridge (ADB). Ini merupakan alur kerja
di sisi operator, terpisah dari koneksi node OpenClaw. Alur ini berguna ketika perangkat Android dan
Mac berada di lokasi berbeda tetapi berbagi jaringan privat Tailscale.

### Sebelum memulai

- Instal Tailscale pada perangkat Android dan Mac, lalu hubungkan keduanya ke tailnet yang sama.
- Di Android, aktifkan **Developer options** dan **USB debugging**. Android 16 menempatkan **Wireless
  debugging** di **Settings > System > Developer options**. Lihat [opsi developer
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
permintaan debugging-nya. Kemudian jalankan:

```bash
adb devices
adb tcpip 5555
```

Kini Anda dapat memutuskan sambungan USB. Jika port 5555 berhenti mendengarkan setelah perangkat dimulai ulang atau debugging direset,
ulangi langkah penyiapan lokal ini. Android 11 dan versi yang lebih baru juga dapat membangun kepercayaan awal dengan
**Wireless debugging > Pair device with pairing code** dan `adb pair`.

### Hanya mengizinkan Mac pengontrol

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

Lihat [pemberian akses Tailscale](https://tailscale.com/docs/reference/syntax/grants) untuk alias host dan
pemilih lainnya. Jangan berikan akses port ini ke internet publik atau mengeksposnya dengan Funnel: klien ADB
yang diotorisasi memiliki kendali luas atas perangkat.

### Menghubungkan dan memulai pencerminan

Di Mac jarak jauh:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

`adb connect` pertama dari Mac ini menampilkan dialog otorisasi di Android. Buka kunci perangkat,
konfirmasikan sidik jari kunci, dan pilih **Always allow from this computer** hanya jika Mac
tepercaya. Entri `adb devices` yang berhasil diakhiri dengan `device`; `unauthorized` berarti permintaan di perangkat
belum disetujui.

Setelah jendela scrcpy terbuka, gunakan secara langsung atau jadikan target alat otomatisasi layar macOS seperti
[Peekaboo](https://peekaboo.sh/). scrcpy membawa tampilan dan input; Tailscale hanya menyediakan
jalur jaringan privat.

### Pemecahan masalah

- `Connection timed out`: verifikasi pemberian akses tailnet untuk TCP 5555. `tailscale ping` yang berhasil membuktikan
  keterjangkauan peer, bukan bahwa kebijakan mengizinkan port TCP ini. Uji dengan
  `nc -vz <android-tailnet-ip> 5555` dari Mac.
- `unauthorized`: buka kunci Android dan setujui kunci ADB Mac jarak jauh, atau hapus workstation lama
  di **Wireless debugging > Paired devices** dan pasangkan kembali.
- `Connection refused`: hubungkan kembali secara lokal dan jalankan `adb tcpip 5555` lagi.
- Lebih dari satu perangkat tercantum: pertahankan argumen `--serial <android-tailnet-ip>:5555` yang eksplisit.

Setelah selesai, tutup scrcpy dan putuskan koneksi ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Runbook koneksi

Aplikasi node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android terhubung langsung ke WebSocket Gateway dan menggunakan pemasangan perangkat (`role: node`).

Untuk Tailscale atau host publik, Android memerlukan endpoint aman:

- Disarankan: Tailscale Serve / Funnel dengan `https://<magicdns>` / `wss://<magicdns>`
- Juga didukung: URL Gateway `wss://` lainnya dengan endpoint TLS nyata
- `ws://` tanpa enkripsi tetap didukung pada alamat LAN privat / host `.local`, serta `localhost`, `127.0.0.1`, dan bridge emulator Android (`10.0.2.2`); penyiapan non-loopback secara otomatis menggunakan akses operator terbatas

### Prasyarat

- Gateway berjalan di mesin lain (atau dapat dijangkau melalui SSH).
- Perangkat/emulator Android dapat menjangkau WebSocket Gateway:
  - LAN yang sama dengan mDNS/NSD, **atau**
  - Tailnet Tailscale yang sama menggunakan Wide-Area Bonjour / DNS-SD unicast (lihat di bawah), **atau**
  - Host/port Gateway manual (opsi cadangan)
- Pemasangan seluler tailnet/publik **tidak** menggunakan endpoint IP tailnet mentah `ws://`. Gunakan Tailscale Serve atau URL `wss://` lainnya sebagai gantinya.
- CLI `openclaw` tersedia di mesin Gateway (atau melalui SSH), untuk menyetujui permintaan pemasangan.

### 1. Memulai Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Konfirmasikan bahwa di log terlihat sesuatu seperti:

- `listening on ws://0.0.0.0:18789`

Untuk akses Android jarak jauh melalui Tailscale, utamakan Serve/Funnel daripada bind tailnet mentah:

```bash
openclaw gateway --tailscale serve
```

Ini memberikan endpoint `wss://` / `https://` yang aman kepada Android. Penyiapan `gateway.bind: "tailnet"` biasa tidak cukup untuk pemasangan Android jarak jauh pertama kali kecuali Anda juga menghentikan TLS secara terpisah.

### 2. Memverifikasi penemuan (opsional)

Dari mesin Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Catatan debugging selengkapnya: [Bonjour](/id/gateway/bonjour).

Jika Anda juga mengonfigurasi domain penemuan area luas, bandingkan dengan:

```bash
openclaw gateway discover --json
```

Perintah tersebut menampilkan `local.` beserta domain area luas yang dikonfigurasi dalam sekali proses, menggunakan endpoint layanan yang telah di-resolve alih-alih petunjuk khusus TXT.

#### Penemuan lintas jaringan melalui DNS-SD unicast

Penemuan NSD/mDNS Android tidak melintasi jaringan. Jika node Android dan Gateway berada di jaringan berbeda tetapi terhubung melalui Tailscale, gunakan Wide-Area Bonjour / DNS-SD unicast sebagai gantinya. Penemuan saja tidak cukup untuk pemasangan Android melalui tailnet/publik — rute yang ditemukan tetap memerlukan endpoint aman (`wss://` atau Tailscale Serve):

1. Siapkan zona DNS-SD (contoh `openclaw.internal.`) pada host Gateway dan publikasikan catatan `_openclaw-gw._tcp`.
2. Konfigurasikan DNS terpisah Tailscale untuk domain yang dipilih agar mengarah ke server DNS tersebut.

Detail dan contoh konfigurasi CoreDNS: [Bonjour](/id/gateway/bonjour).

### 3. Menghubungkan dari Android

Di aplikasi Android:

- Aplikasi mempertahankan koneksi Gateway melalui **foreground service** (notifikasi persisten).
- Buka tab **Connect**.
- Gunakan mode **Setup Code** atau **Manual**.
- Jika penemuan diblokir, gunakan host/port manual di **Advanced controls**. Untuk host LAN privat, `ws://` tetap berfungsi. Untuk host Tailscale/publik, aktifkan TLS dan gunakan endpoint `wss://` / Tailscale Serve.

Setelah pemasangan pertama berhasil, Android terhubung kembali secara otomatis saat diluncurkan ke Gateway aktif yang telah dipasangkan (upaya terbaik untuk Gateway yang ditemukan, yang harus terlihat di jaringan).

Kode penyiapan resmi menghubungkan Android sebagai node dan secara default memberikan akses operator Gateway
penuh melalui `wss://`. Penyiapan `ws://` non-loopback tanpa enkripsi
secara otomatis menggunakan akses terbatas demi keamanan token pembawa. **Settings → Gateway**
menampilkan akses **Full** atau **Limited**. Untuk koneksi terbatas, konfigurasikan
`wss://` atau Tailscale Serve, buat kode akses penuh baru di Control UI atau
dengan `openclaw qr`, lalu pindai atau tempelkan kode tersebut di halaman itu dan hubungkan kembali. Operator
yang menginginkan profil terbatas dapat memilih **Limited access** di Control UI atau menjalankan
`openclaw qr --limited`.

### Beberapa Gateway

Aplikasi menyimpan registri setiap Gateway yang pernah dipasangkan, sehingga Anda dapat beralih di antaranya tanpa melakukan pemasangan ulang:

- **Settings -> Gateways** mencantumkan gateway yang telah dipasangkan dengan gateway aktif yang diberi tanda. Ketuk entri untuk beralih; aplikasi mengakhiri sesi saat ini dan menyambungkan kembali ke gateway yang dipilih.
- Tab **Connect** menampilkan pengalih cepat ketika lebih dari satu gateway telah dipasangkan.
- Kredensial, token perangkat, kepercayaan TLS, riwayat obrolan, dan pesan offline dalam antrean disimpan per gateway. Beralih gateway tidak pernah mencampurkan status antar-gateway, dan pesan yang dimasukkan ke antrean saat offline hanya dikirimkan ke gateway tujuan saat pesan tersebut dibuat.
- **Forget** menghapus entri registri gateway beserta kredensial, token perangkat, pin TLS, dan obrolan temboloknya.

### Beacon keaktifan presence

Setelah sesi node yang diautentikasi tersambung, dan ketika aplikasi berpindah ke latar belakang sementara layanan latar depan masih tersambung, Android memanggil `node.event` dengan `event: "node.presence.alive"`. Gateway mencatatnya sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata node/perangkat yang dipasangkan hanya setelah identitas perangkat node yang diautentikasi diketahui.

Aplikasi menganggap beacon berhasil dicatat hanya ketika respons gateway menyertakan `handled: true`. Gateway versi lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons tersebut kompatibel, tetapi tidak dianggap sebagai pembaruan terakhir dilihat yang persisten.

### 4. Setujui pemasangan (CLI)

Pada mesin gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detail pemasangan: [Pemasangan](/id/channels/pairing).

Opsional: jika node Android selalu tersambung dari subnet yang dikontrol secara ketat, Anda dapat memilih untuk mengaktifkan persetujuan otomatis node saat pertama kali dengan CIDR eksplisit atau alamat IP persis:

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

### 5. Verifikasi bahwa node tersambung

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Obrolan + riwayat

Tab Chat Android mendukung pemilihan sesi (`main` secara default, ditambah sesi lain yang sudah ada):

- Riwayat: `chat.history` (dinormalisasi untuk tampilan — tag direktif sebaris, payload XML pemanggilan alat dalam teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, dan varian yang terpotong), serta token kontrol model ASCII/lebar penuh yang bocor dihapus; baris asisten berupa token senyap seperti `NO_REPLY` / `no_reply` persis dihilangkan; baris yang terlalu besar dapat diganti dengan placeholder)
- Kirim: `chat.send`
- Pengiriman persisten: setiap pengiriman (teks, gambar yang dipilih, dan catatan suara) dicatat ke kotak keluar pada perangkat per gateway sebelum upaya jaringan apa pun, sehingga penghentian aplikasi tidak dapat menghilangkan masukan yang telah dikirimkan. Kiriman yang dimasukkan ke antrean saat offline dikirimkan secara berurutan saat tersambung kembali dengan kunci idempotensi yang stabil, dan sebuah kiriman hanya dihapus dari antrean setelah giliran terlihat dalam `chat.history` kanonis — pengakuan saja tidak dianggap sebagai bukti pengiriman. Hasil yang ambigu (pengakuan hilang, aplikasi dihentikan di tengah pengiriman, gateway dimulai ulang sebelum penulisan transkrip) ditampilkan sebagai baris yang terlihat dengan **Coba lagi**/**Hapus** secara eksplisit, bukan dikirim ulang secara otomatis. Perintah garis miring tidak pernah diputar ulang secara otomatis setelah penyambungan kembali; perintah tersebut ditahan untuk dicoba ulang secara eksplisit. Antrean dibatasi (50 pesan dan 48 MB byte lampiran per gateway), dan baris yang belum terkirim kedaluwarsa setelah 48 jam. Draf penyusun yang tidak pernah dikirimkan tidak persisten lintas proses.
- Pembaruan push (upaya terbaik): `chat.subscribe` -> `event:"chat"`
- Dengarkan: tekan lama pesan asisten dan pilih **Dengarkan** untuk mendengarnya; audio dirender melalui `tts.speak` gateway menggunakan rantai penyedia TTS yang dikonfigurasi, dan TTS sistem pada perangkat digunakan ketika gateway tidak dapat merender audio. Pemutaran berhenti saat beralih sesi, memulai obrolan baru, aplikasi berpindah ke latar belakang, atau obrolan ditutup.

### 7. Canvas + kamera

#### Host Canvas Gateway (direkomendasikan untuk konten web)

Agar node menampilkan HTML/CSS/JS nyata yang dapat diedit agen pada disk, arahkan node ke host canvas Gateway.

<Note>
Node memuat canvas dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
</Note>

1. Buat `~/.openclaw/workspace/canvas/index.html` pada host gateway.
2. Arahkan node ke sana (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opsional): jika kedua perangkat menggunakan Tailscale, gunakan nama MagicDNS atau IP tailnet sebagai pengganti `.local`, misalnya `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Server ini menyuntikkan klien pemuatan ulang langsung ke HTML dan memuat ulang saat berkas berubah. Gateway juga menyajikan `/__openclaw__/a2ui/`, tetapi aplikasi Android memperlakukan halaman A2UI jarak jauh hanya untuk perenderan. Perintah A2UI yang mendukung tindakan menggunakan halaman A2UI bawaan milik aplikasi.

Perintah Canvas (hanya di latar depan):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gunakan `{"url":""}` atau `{"url":"/"}` untuk kembali ke scaffold default). `canvas.snapshot` mengembalikan `{ format, base64 }` (default `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias lama `canvas.a2ui.pushJSONL`). Perintah ini menggunakan halaman A2UI bawaan milik aplikasi untuk perenderan yang mendukung tindakan.

Perintah kamera (hanya di latar depan; memerlukan izin): `camera.snap` (jpg), `camera.clip` (mp4). Lihat [Node kamera](/id/nodes/camera) untuk parameter dan pembantu CLI.

### 8. Suara + permukaan perintah Android yang diperluas

- Navigasi shell Android adalah **Home**, **Chat**, dan **Settings**. Masukan suara
  merupakan bagian dari penyusun Chat; tidak ada tab Voice terpisah.
- Ketuk mikrofon penyusun untuk menggunakan pengenalan ucapan pada perangkat yang menyisipkan
  transkrip ke dalam draf. Tekan lama mikrofon untuk merekam lampiran
  catatan suara. UI melaporkan pengenalan yang tidak tersedia, izin yang tidak ada,
  kegagalan karena sibuk/jaringan, dan hasil tanpa ucapan alih-alih diam-diam membuang
  upaya tersebut.
- Mulai **Talk** berkelanjutan dari bentuk gelombang Chat. Dikte, perekaman
  catatan suara, dan Talk merupakan jalur mikrofon yang saling eksklusif.
- Mode Talk menaikkan layanan latar depan yang ada dari `connectedDevice` menjadi `connectedDevice|microphone` sebelum pengambilan dimulai, lalu menurunkannya ketika Mode Talk berhenti. Layanan node mendeklarasikan `FOREGROUND_SERVICE_CONNECTED_DEVICE` dengan `CHANGE_NETWORK_STATE`; Android 14+ juga memerlukan deklarasi `FOREGROUND_SERVICE_MICROPHONE`, pemberian izin runtime `RECORD_AUDIO`, dan jenis layanan mikrofon saat runtime.
- Secara default, Talk Android menggunakan pengenalan ucapan native, obrolan Gateway, dan `talk.speak` melalui penyedia Talk gateway yang dikonfigurasi. TTS sistem lokal hanya digunakan ketika `talk.speak` tidak tersedia.
- Talk Android menggunakan relai Gateway waktu nyata hanya ketika `talk.realtime.mode` adalah `realtime` dan `talk.realtime.transport` adalah `gateway-relay`.
- Android tidak mengiklankan kapabilitas `voiceWake`. Gunakan dikte Chat,
  catatan suara, atau Talk untuk masukan suara.
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

### 9. Berkas ruang kerja (hanya baca)

Ringkasan Home menyertakan kartu **Berkas** yang menelusuri ruang kerja agen aktif melalui RPC gateway `agents.workspace.list` / `agents.workspace.get` yang hanya baca: penelusuran hierarki direktori, pratinjau teks dan gambar, serta ekspor melalui lembar berbagi Android. Tidak ada operasi tulis, dan ukuran pratinjau dibatasi oleh gateway.

## Meninjau persetujuan perintah

Koneksi operator dengan `operator.admin`, atau koneksi
`operator.approvals` yang dipasangkan dan ditargetkan secara eksplisit oleh Gateway, dapat meninjau
permintaan eksekusi yang tertunda di **Settings -> Approvals**. Aplikasi memuat
catatan persetujuan Gateway yang telah disanitasi sebelum mengaktifkan tombolnya, menampilkan setiap
peringatan keamanan dan keputusan persis yang ditawarkan oleh permintaan tersebut, serta mengirimkan
ID persetujuan dan jenis pemilik kembali ke Gateway.

Status persetujuan dibagikan dengan UI Kontrol dan permukaan obrolan yang didukung. Jawaban
pertama yang dikomit akan berlaku; Android menampilkan hasil kanonis tersebut bahkan ketika
permukaan lain menjawab lebih dahulu. Jika respons penyelesaian hilang atau Gateway
terputus, aplikasi tetap mengunci tindakan dan membaca kembali persetujuan
sebelum menawarkan keputusan lain.

Gateway yang mendahului metode persetujuan terpadu beralih ke metode
khusus eksekusi yang telah dirilis. Peninjauan tertunda tetap berfungsi, tetapi status terminal yang dipertahankan
dan hasil lintas-permukaan yang lebih lengkap memerlukan Gateway yang diperbarui.

## Menjawab pertanyaan agen

Chat menampilkan pertanyaan Gateway yang tertunda sebagai kartu native untuk koneksi operator
dengan `operator.questions` (atau `operator.admin`). Kartu mendukung opsi pilihan tunggal dan
multipilihan, deskripsi opsi, jawaban teks bebas **Lainnya**, dan
hitung mundur kedaluwarsa. Penyambungan kembali memuat ulang pertanyaan yang tertunda dari Gateway. Kartu
terkunci ketika perangkat ini menjawabnya, permukaan lain menjawabnya lebih dahulu, atau
pertanyaan kedaluwarsa atau dibatalkan.

## Titik masuk asisten

Android mendukung peluncuran OpenClaw dari pemicu asisten sistem (Google Assistant). Menahan tombol beranda (atau pemicu `ACTION_ASSIST` lainnya) membuka aplikasi; mengucapkan "Hey Google, ask OpenClaw `<prompt>`" mencocokkan pola kueri App Actions yang dideklarasikan aplikasi dan meneruskan perintah ke penyusun obrolan tanpa mengirimkannya secara otomatis.

Fitur ini menggunakan **App Actions** Android (kapabilitas `shortcuts.xml`) yang dideklarasikan dalam manifes aplikasi. Tidak diperlukan konfigurasi di sisi gateway — intent asisten ditangani sepenuhnya oleh aplikasi Android.

<Note>
Ketersediaan App Actions bergantung pada perangkat, versi Google Play Services, dan apakah pengguna telah menetapkan OpenClaw sebagai aplikasi asisten default.
</Note>

## Penerusan notifikasi

Android dapat meneruskan notifikasi perangkat ke gateway sebagai item `node.event`. Fitur ini dikonfigurasi **pada perangkat**, di lembar Settings aplikasi — bukan dalam konfigurasi gateway/`openclaw.json`.

| Pengaturan                     | Deskripsi                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Teruskan Peristiwa Notifikasi | Tombol utama. Nonaktif secara default; Akses Pendengar Notifikasi harus diberikan terlebih dahulu.                                                                                                              |
| Filter Paket              | **Daftar izin** (hanya ID paket yang tercantum yang diteruskan) atau **Daftar blokir** (default: semua paket kecuali ID yang tercantum). Paket milik OpenClaw selalu dikecualikan dalam mode Daftar blokir untuk mencegah perulangan penerusan. |
| Jam Tenang                 | Rentang waktu mulai/selesai HH:mm lokal yang menonaktifkan penerusan. Dinonaktifkan secara default; menggunakan `22:00`-`07:00` secara default setelah diaktifkan.                                                                                |
| Maks. Peristiwa / Menit         | Batas laju per perangkat untuk notifikasi yang diteruskan. Default 20.                                                                                                                                          |
| Kunci Sesi Rute           | Opsional. Menetapkan peristiwa notifikasi yang diteruskan ke sesi tertentu, bukan ke rute notifikasi default perangkat.                                                                               |

<Note>
Penerusan notifikasi memerlukan izin Pendengar Notifikasi Android. Aplikasi akan meminta izin ini selama penyiapan.
</Note>

Notifikasi WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord, dan Signal selalu dikecualikan. Pesannya sudah ditangani oleh sesi kanal native OpenClaw; meneruskan notifikasi Android sebagai peristiwa node terpisah dapat merutekan balasan melalui percakapan yang salah.

## Terkait

- [Aplikasi iOS](/id/platforms/ios)
- [Node](/id/nodes)
- [Pemecahan masalah node Android](/id/nodes/troubleshooting)
