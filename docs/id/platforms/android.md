---
read_when:
    - Memasangkan atau menghubungkan kembali node Android
    - Men-debug penemuan atau autentikasi Gateway Android
    - Mencerminkan atau mengontrol perangkat Android dari Mac jarak jauh
    - Memverifikasi kesetaraan riwayat obrolan di seluruh klien
summary: 'Aplikasi Android (node): panduan operasional koneksi + antarmuka perintah Connect/Chat/Voice/Canvas'
title: Aplikasi Android
x-i18n:
    generated_at: "2026-07-21T12:44:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: caa98f2e5834f9974b0df319ea0844acf589fe3735045efe80c97f3f14e2ee45
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Aplikasi Android resmi tersedia di [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) dan sebagai APK mandiri bertanda tangan pada [GitHub Releases](https://github.com/openclaw/openclaw/releases) yang didukung. Aplikasi ini merupakan node pendamping dan memerlukan Gateway OpenClaw yang sedang berjalan. Sumber: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([petunjuk build](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Ringkasan dukungan

- Peran: aplikasi node pendamping (Android tidak meng-host Gateway).
- Gateway diperlukan: ya (jalankan di macOS, Linux, atau Windows melalui WSL2).
- Instalasi: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) atau `OpenClaw-Android.apk` dari [GitHub Release](https://github.com/openclaw/openclaw/releases) yang didukung, [Memulai](/id/start/getting-started) untuk Gateway, lalu [Pemasangan](/id/channels/pairing).
- Gateway: [Panduan operasional](/id/gateway) + [Konfigurasi](/id/gateway/configuration).
  - Protokol: [Protokol Gateway](/id/gateway/protocol) (node + bidang kontrol).

Kontrol sistem (launchd/systemd) berada di host Gateway — lihat [Gateway](/id/gateway).

## Sesi Gateway simultan

Pasangkan setiap Gateway satu kali, lalu buka **Settings → Gateway**. Tanda centang menandai
Gateway yang sedang difokuskan dan setiap sakelar mengontrol apakah sesi operator Gateway yang
tidak difokuskan tetap terhubung. Gateway yang diaktifkan terhubung kembali secara independen
selama aplikasi berada di latar depan, sehingga berpindah fokus tidak memutus koneksi
lainnya. Hanya Gateway yang difokuskan yang memiliki sesi node Android dan kapabilitas
perangkat; ini mencegah beberapa Gateway secara bersamaan mengirim perintah kamera,
lokasi, layar, atau notifikasi ke ponsel yang sama. Android dapat
menangguhkan koneksi sekunder setelah aplikasi meninggalkan latar depan.

## Pendamping Wear OS

Pendamping Wear OS menggunakan koneksi Gateway terautentikasi milik ponsel Android yang dipasangkan; jam tangan tidak pernah menerima atau menyimpan kredensial Gateway. Pendamping ini dapat memilih agen dan sesi, membaca transkrip terbatas, mengirim balasan teks atau hasil dikte, membatalkan proses yang aktif, memulai Talk waktu nyata di dalam sesi yang dipilih, serta menghubungkan atau memutuskan Gateway ponsel yang dipasangkan. Pendamping ini juga menyediakan notifikasi balasan lokal, tampilan gelap atau terang, dan ucapan otomatis opsional untuk balasan. Kontrol agen dan Gateway dinegosiasikan berdasarkan kapabilitas untuk mendukung pembaruan ponsel/jam tangan yang tidak serentak. Talk waktu nyata mengalirkan audio mikrofon dan pemutaran melalui saluran Wear OS Data Layer sementara dan berhenti ketika ponsel yang dipilih, koneksi Gateway, atau saluran audio terputus.

## Instalasi di luar Google Play

GitHub Release final dan koreksi reguler menyertakan `OpenClaw-Android.apk` universal dan `OpenClaw-Android-SHA256SUMS.txt`. APK dibuat dari tag rilis, ditandatangani dengan kunci rilis Android OpenClaw, dan menyertakan provenans GitHub Actions.

Pilih [rilis](https://github.com/openclaw/openclaw/releases) yang mencantumkan kedua aset tersebut, lalu unduh dan verifikasi tag yang tepat itu sebelum melakukan sideload:

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
Instalasi Google Play dan APK mandiri menggunakan saluran pembaruan yang berbeda dan mungkin memiliki identitas penandatanganan yang berbeda. Android mungkin mengharuskan aplikasi yang ada dihapus sebelum berpindah saluran, yang akan menghapus data aplikasi lokalnya. Tetap gunakan satu saluran untuk pembaruan normal.
</Warning>

## Mencerminkan dan mengontrol Android dari Mac jarak jauh

[scrcpy](https://github.com/Genymobile/scrcpy) mencerminkan layar Android dalam jendela macOS dan
meneruskan masukan papan ketik serta penunjuk melalui Android Debug Bridge (ADB). Ini merupakan alur kerja
di sisi operator, yang terpisah dari koneksi node OpenClaw. Alur kerja ini berguna ketika perangkat Android dan
Mac berada di lokasi berbeda tetapi berbagi jaringan privat Tailscale.

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

Sekarang Anda dapat memutuskan USB. Jika port 5555 berhenti mendengarkan setelah perangkat dimulai ulang atau debugging direset,
ulangi langkah penyiapan lokal ini. Android 11 dan yang lebih baru juga dapat membangun kepercayaan awal dengan
**Wireless debugging > Pair device with pairing code** dan `adb pair`.

### Mengizinkan hanya Mac pengontrol

Tailnet dengan grant yang ketat harus secara eksplisit mengizinkan Mac pengontrol mengakses port TCP 5555
pada perangkat Android. Tambahkan aturan sempit ke kebijakan tailnet, dengan mengganti alamat contoh
menggunakan IP Tailscale stabil kedua perangkat:

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

Lihat [grant Tailscale](https://tailscale.com/docs/reference/syntax/grants) untuk alias host dan
pemilih lainnya. Jangan berikan akses port ini ke internet publik atau mengeksposnya dengan Funnel: klien ADB
yang diotorisasi memiliki kontrol luas atas perangkat.

### Menghubungkan dan memulai pencerminan

Di Mac jarak jauh:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

`adb connect` pertama dari Mac ini menampilkan dialog otorisasi di Android. Buka kunci perangkat,
konfirmasikan sidik jari kunci, dan pilih **Always allow from this computer** hanya jika Mac tersebut
tepercaya. Entri `adb devices` yang berhasil berakhir dengan `device`; `unauthorized` berarti perintah pada perangkat
belum disetujui.

Setelah jendela scrcpy terbuka, gunakan secara langsung atau jadikan sebagai target alat otomatisasi layar macOS seperti
[Peekaboo](https://peekaboo.sh/). scrcpy membawa tampilan dan masukan; Tailscale hanya menyediakan
jalur jaringan privat.

### Pemecahan masalah

- `Connection timed out`: verifikasi grant tailnet untuk TCP 5555. `tailscale ping` yang berhasil membuktikan
  keterjangkauan peer, bukan bahwa kebijakan mengizinkan port TCP ini. Uji dengan
  `nc -vz <android-tailnet-ip> 5555` dari Mac.
- `unauthorized`: buka kunci Android dan setujui kunci ADB Mac jarak jauh, atau hapus workstation usang
  di bawah **Wireless debugging > Paired devices** lalu pasangkan kembali.
- `Connection refused`: hubungkan kembali secara lokal dan jalankan lagi `adb tcpip 5555`.
- Lebih dari satu perangkat tercantum: pertahankan argumen eksplisit `--serial <android-tailnet-ip>:5555`.

Setelah selesai, tutup scrcpy dan putuskan ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Panduan operasional koneksi

Aplikasi node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android terhubung langsung ke WebSocket Gateway dan menggunakan pemasangan perangkat (`role: node`).

Untuk Tailscale atau host publik, Android memerlukan endpoint aman:

- Disarankan: Tailscale Serve / Funnel dengan `https://<magicdns>` / `wss://<magicdns>`
- Juga didukung: URL Gateway `wss://` lain dengan endpoint TLS nyata
- `ws://` teks biasa tetap didukung pada alamat LAN privat / host `.local`, serta `localhost`, `127.0.0.1`, dan jembatan emulator Android (`10.0.2.2`); penyiapan non-loopback secara otomatis menggunakan akses operator terbatas

### Prasyarat

- Gateway berjalan di mesin lain (atau dapat dijangkau melalui SSH).
- Perangkat/emulator Android dapat menjangkau WebSocket Gateway:
  - LAN yang sama dengan mDNS/NSD, **atau**
  - Tailnet Tailscale yang sama menggunakan Wide-Area Bonjour / DNS-SD unicast (lihat di bawah), **atau**
  - Host/port Gateway manual (fallback)
- Pemasangan seluler melalui tailnet/publik **tidak** menggunakan endpoint IP tailnet mentah `ws://`. Gunakan Tailscale Serve atau URL `wss://` lain sebagai gantinya.
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

Catatan debugging lainnya: [Bonjour](/id/gateway/bonjour).

Jika Anda juga mengonfigurasi domain penemuan area luas, bandingkan dengan:

```bash
openclaw gateway discover --json
```

Perintah tersebut menampilkan `local.` beserta domain area luas yang dikonfigurasi dalam satu kali proses, menggunakan endpoint layanan yang telah di-resolve alih-alih hanya petunjuk TXT.

#### Penemuan lintas jaringan melalui DNS-SD unicast

Penemuan NSD/mDNS Android tidak melintasi jaringan. Jika node Android dan Gateway berada di jaringan berbeda tetapi terhubung melalui Tailscale, gunakan Wide-Area Bonjour / DNS-SD unicast sebagai gantinya. Penemuan saja tidak cukup untuk pemasangan Android melalui tailnet/publik — rute yang ditemukan tetap memerlukan endpoint aman (`wss://` atau Tailscale Serve):

1. Siapkan zona DNS-SD (contoh `openclaw.internal.`) di host Gateway dan publikasikan catatan `_openclaw-gw._tcp`.
2. Konfigurasikan DNS terbagi Tailscale untuk domain pilihan Anda yang mengarah ke server DNS tersebut.

Detail dan contoh konfigurasi CoreDNS: [Bonjour](/id/gateway/bonjour).

### 3. Menghubungkan dari Android

Di aplikasi Android:

- Aplikasi mempertahankan koneksi Gateway tetap aktif melalui **foreground service** (notifikasi persisten).
- Buka tab **Connect**.
- Gunakan mode **Setup Code** atau **Manual**.
- Jika penemuan diblokir, gunakan host/port manual di **Advanced controls**. Untuk host LAN privat, `ws://` masih berfungsi. Untuk host Tailscale/publik, aktifkan TLS dan gunakan endpoint `wss://` / Tailscale Serve.

Setelah pemasangan pertama berhasil, Android secara otomatis terhubung kembali saat diluncurkan ke Gateway aktif yang telah dipasangkan (upaya terbaik untuk Gateway yang ditemukan, yang harus terlihat di jaringan).

Kode penyiapan resmi menghubungkan Android sebagai node dan memberikan akses operator Gateway penuh
secara default melalui `wss://`. Penyiapan `ws://` non-loopback teks biasa
secara otomatis menggunakan akses terbatas demi keamanan bearer token. **Settings → Gateway**
menampilkan akses **Full** atau **Limited**. Untuk koneksi terbatas, konfigurasikan
`wss://` atau Tailscale Serve, buat kode akses penuh baru di Control UI atau
dengan `openclaw qr`, lalu pindai atau tempelkan kode tersebut pada halaman itu dan hubungkan kembali. Operator
yang menginginkan profil terbatas dapat memilih **Limited access** di Control UI atau menjalankan
`openclaw qr --limited`.

### Mengelola Gateway yang dipasangkan

Aplikasi menyimpan registri setiap Gateway yang pernah dipasangkan, sehingga Anda dapat mempertahankan sesi operator tetap terhubung dan mengubah fokus tanpa memasangkan ulang:

- **Settings → Gateway** mencantumkan Gateway yang telah dipasangkan dengan penanda pada Gateway yang sedang difokuskan. Ketuk salah satu entri untuk memfokuskannya; sesi operator lain yang diaktifkan tetap terhubung.
- Setiap sakelar mengontrol apakah Gateway yang tidak difokuskan tetap terhubung saat aplikasi berada di latar depan. Gateway yang difokuskan tetap diaktifkan dan memiliki koneksi Node ponsel serta kemampuan perangkat.
- Tab **Connect** menampilkan pengalih cepat saat lebih dari satu Gateway telah dipasangkan.
- Kredensial, token perangkat, kepercayaan TLS, riwayat obrolan, dan pesan luring dalam antrean disimpan per Gateway. Mengubah fokus tidak pernah mencampur status antar-Gateway, dan pesan yang dimasukkan ke antrean saat luring hanya dikirimkan ke Gateway yang menjadi tujuannya.
- **Forget** menghapus entri registri Gateway beserta kredensial, token perangkat, pin TLS, dan obrolan yang di-cache.

### Beacon keaktifan kehadiran

Setelah sesi Node terautentikasi terhubung, dan ketika aplikasi berpindah ke latar belakang sementara layanan latar depan masih terhubung, Android memanggil `node.event` dengan `event: "node.presence.alive"`. Gateway mencatatnya sebagai `lastSeenAtMs`/`lastSeenReason` pada metadata Node/perangkat yang dipasangkan hanya setelah identitas perangkat Node terautentikasi diketahui.

Aplikasi menganggap beacon berhasil dicatat hanya ketika respons Gateway menyertakan `handled: true`. Gateway lama mungkin mengakui `node.event` dengan `{ "ok": true }`; respons tersebut kompatibel tetapi tidak dianggap sebagai pembaruan waktu terakhir terlihat yang persisten.

### 4. Setujui pemasangan (CLI)

Pada mesin Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detail pemasangan: [Pemasangan](/id/channels/pairing).

Opsional: jika Node Android selalu terhubung dari subnet yang dikontrol secara ketat, Anda dapat mengaktifkan persetujuan otomatis Node pada pemasangan pertama dengan CIDR eksplisit atau alamat IP persis:

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

Fitur ini dinonaktifkan secara default. Fitur ini hanya berlaku untuk pemasangan `role: node` baru tanpa cakupan yang diminta. Pemasangan operator/browser serta setiap perubahan peran, cakupan, metadata, atau kunci publik tetap memerlukan persetujuan manual.

### 5. Verifikasi bahwa Node terhubung

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Obrolan + riwayat

Tab Chat Android mendukung pemilihan sesi (default `main`, serta sesi lain yang sudah ada):

- Riwayat: `chat.history` (dinormalisasi untuk tampilan — tag direktif sebaris, payload XML pemanggilan alat berupa teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, dan varian yang dipotong), serta token kontrol model ASCII/lebar penuh yang bocor akan dihapus; baris asisten bertoken senyap seperti `NO_REPLY` / `no_reply` persis akan dihilangkan; baris yang terlalu besar dapat diganti dengan placeholder)
- Kirim: `chat.send`
- Pengiriman persisten: setiap pengiriman (teks, gambar yang dipilih, dan catatan suara) dicatat ke kotak keluar di perangkat per Gateway sebelum upaya jaringan apa pun, sehingga penghentian aplikasi tidak dapat menghilangkan masukan yang telah dikirimkan. Kiriman yang masuk antrean saat luring dikirim secara berurutan ketika tersambung kembali dengan kunci idempotensi yang stabil, dan kiriman hanya dihapus dari antrean setelah giliran terlihat dalam `chat.history` kanonis — pengakuan saja tidak dianggap sebagai bukti pengiriman. Hasil yang ambigu (pengakuan hilang, aplikasi dihentikan di tengah pengiriman, Gateway dimulai ulang sebelum penulisan transkrip) ditampilkan sebagai baris yang terlihat dengan **Retry**/**Delete** eksplisit alih-alih dikirim ulang secara otomatis. Perintah garis miring tidak pernah diputar ulang secara otomatis setelah tersambung kembali; perintah tersebut ditahan untuk dicoba ulang secara eksplisit. Antrean dibatasi (50 pesan dan 48 MB byte lampiran per Gateway), dan baris yang belum terkirim kedaluwarsa setelah 48 jam. Draf editor pesan yang belum pernah dikirimkan tidak persisten terhadap penghentian proses.
- Pembaruan push (upaya terbaik): `chat.subscribe` -> `event:"chat"`
- Dengarkan: tekan lama pesan asisten lalu pilih **Listen** untuk mendengarkannya; audio dirender melalui `tts.speak` Gateway dengan rantai penyedia TTS yang dikonfigurasi, dan TTS sistem di perangkat digunakan ketika Gateway tidak dapat merender audio. Pemutaran berhenti saat sesi dialihkan, obrolan baru dimulai, aplikasi berpindah ke latar belakang, atau obrolan ditutup.

### 7. Canvas + kamera

#### Host Canvas Gateway (direkomendasikan untuk konten web)

Agar Node menampilkan HTML/CSS/JS nyata yang dapat diedit agen pada disk, arahkan Node ke host Canvas Gateway.

<Note>
Node memuat Canvas dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
</Note>

1. Buat `~/.openclaw/workspace/canvas/index.html` pada host Gateway.
2. Arahkan Node ke sana (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opsional): jika kedua perangkat menggunakan Tailscale, gunakan nama MagicDNS atau IP tailnet sebagai pengganti `.local`, misalnya `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Server ini menyisipkan klien pemuatan ulang langsung ke dalam HTML dan memuat ulang saat file berubah. Gateway juga menyajikan `/__openclaw__/a2ui/`, tetapi aplikasi Android memperlakukan halaman A2UI jarak jauh sebagai hanya-render. Perintah A2UI yang mendukung tindakan menggunakan halaman A2UI bawaan milik aplikasi.

Perintah Canvas (hanya latar depan):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gunakan `{"url":""}` atau `{"url":"/"}` untuk kembali ke scaffold default). `canvas.snapshot` mengembalikan `{ format, base64 }` (default `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias lama `canvas.a2ui.pushJSONL`). Perintah ini menggunakan halaman A2UI bawaan milik aplikasi untuk perenderan yang mendukung tindakan.

Perintah kamera (hanya latar depan; memerlukan izin): `camera.snap` (jpg), `camera.clip` (mp4). Lihat [Node kamera](/id/nodes/camera) untuk parameter dan pembantu CLI.

### 8. Suara + permukaan perintah Android yang diperluas

- Navigasi shell Android adalah **Home**, **Chat**, dan **Settings**. Masukan suara
  berada di editor pesan Chat; tidak ada tab Voice terpisah.
- Ketuk mikrofon editor pesan untuk menjalankan pengenalan ucapan di perangkat yang menyisipkan
  transkrip ke dalam draf. Tekan lama mikrofon untuk merekam lampiran
  catatan suara. UI melaporkan pengenalan yang tidak tersedia, izin yang tidak ada,
  kegagalan karena sibuk/jaringan, dan hasil tanpa ucapan alih-alih secara diam-diam mengabaikan
  upaya tersebut.
- Mulai **Talk** berkelanjutan dari bentuk gelombang Chat. Dikte, perekaman
  catatan suara, dan Talk merupakan jalur mikrofon yang saling eksklusif.
- Talk Mode mempromosikan layanan latar depan yang sudah ada dari `connectedDevice` menjadi `connectedDevice|microphone` sebelum perekaman dimulai, lalu menurunkannya kembali saat Talk Mode berhenti. Layanan Node mendeklarasikan `FOREGROUND_SERVICE_CONNECTED_DEVICE` dengan `CHANGE_NETWORK_STATE`; Android 14+ juga memerlukan deklarasi `FOREGROUND_SERVICE_MICROPHONE`, pemberian izin runtime `RECORD_AUDIO`, dan tipe layanan mikrofon saat runtime.
- Secara default, Android Talk menggunakan pengenalan ucapan native, obrolan Gateway, dan `talk.speak` melalui penyedia Talk Gateway yang dikonfigurasi. TTS sistem lokal hanya digunakan ketika `talk.speak` tidak tersedia.
- Android Talk menggunakan relai Gateway waktu nyata hanya ketika `talk.realtime.mode` adalah `realtime` dan `talk.realtime.transport` adalah `gateway-relay`.
- Android tidak mengiklankan kemampuan `voiceWake`. Gunakan dikte Chat,
  catatan suara, atau Talk untuk masukan suara.
- Kelompok perintah Android tambahan (ketersediaan bergantung pada perangkat, izin, dan pengaturan pengguna):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` hanya ketika **Settings > Phone Capabilities > Installed Apps** diaktifkan; secara default, perintah ini mencantumkan aplikasi yang terlihat oleh peluncur (berikan `includeNonLaunchable` untuk daftar lengkap).
  - `notifications.list`, `notifications.actions` (lihat [Penerusan notifikasi](#notification-forwarding) di bawah)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. File ruang kerja (hanya baca)

Ringkasan Home menyertakan kartu **Files** yang menelusuri ruang kerja agen aktif melalui RPC Gateway `agents.workspace.list` / `agents.workspace.get` yang hanya baca: penelusuran mendalam direktori, pratinjau teks dan gambar, serta ekspor melalui lembar berbagi Android. Tidak ada operasi tulis, dan ukuran pratinjau dibatasi oleh Gateway.

## Meninjau persetujuan perintah

Koneksi operator dengan `operator.admin`, atau koneksi
`operator.approvals` yang telah dipasangkan dan secara eksplisit ditargetkan oleh Gateway, dapat meninjau
permintaan eksekusi yang tertunda di **Settings -> Approvals**. Aplikasi memuat catatan
persetujuan Gateway yang telah disanitasi sebelum mengaktifkan tombolnya, menampilkan setiap
peringatan keamanan dan keputusan persis yang ditawarkan oleh permintaan tersebut, serta mengirimkan
ID persetujuan dan jenis pemilik kembali ke Gateway.

Status persetujuan dibagikan dengan Control UI dan permukaan obrolan yang didukung. Jawaban
pertama yang dikomit akan berlaku; Android menampilkan hasil kanonis tersebut bahkan ketika
permukaan lain menjawab lebih dahulu. Jika respons penyelesaian hilang atau Gateway
terputus, aplikasi tetap mengunci tindakan dan membaca kembali persetujuan
sebelum menawarkan keputusan lain.

Gateway yang ada sebelum metode persetujuan terpadu akan kembali menggunakan metode
khusus eksekusi yang telah dirilis. Peninjauan tertunda tetap berfungsi, tetapi status terminal yang dipertahankan
dan hasil lintas-permukaan yang lebih lengkap memerlukan Gateway yang diperbarui.

## Menjawab pertanyaan agen

Chat menampilkan pertanyaan Gateway yang tertunda sebagai kartu native untuk koneksi operator
dengan `operator.questions` (atau `operator.admin`). Kartu mendukung opsi pilihan tunggal dan
jamak, deskripsi opsi, jawaban teks bebas **Other**, dan hitung mundur
kedaluwarsa. Penyambungan kembali memuat ulang pertanyaan tertunda dari Gateway. Kartu
terkunci ketika perangkat ini menjawabnya, permukaan lain menjawabnya lebih dahulu, atau
pertanyaan kedaluwarsa maupun dibatalkan.

## Titik masuk asisten

Android mendukung peluncuran OpenClaw dari pemicu asisten sistem (Google Assistant). Menahan tombol home (atau pemicu `ACTION_ASSIST` lainnya) akan membuka aplikasi; mengucapkan "Hey Google, ask OpenClaw `<prompt>`" akan mencocokkan pola kueri App Actions yang dideklarasikan aplikasi dan memasukkan perintah ke editor pesan Chat tanpa mengirimkannya secara otomatis.

Fitur ini menggunakan **App Actions** Android (kemampuan `shortcuts.xml`) yang dideklarasikan dalam manifes aplikasi. Tidak diperlukan konfigurasi di sisi Gateway — intent asisten ditangani sepenuhnya oleh aplikasi Android.

<Note>
Ketersediaan App Actions bergantung pada perangkat, versi Google Play Services, dan apakah pengguna telah menetapkan OpenClaw sebagai aplikasi asisten default.
</Note>

## Penerusan notifikasi

Android dapat meneruskan notifikasi perangkat ke Gateway sebagai item `node.event`. Fitur ini dikonfigurasi **pada perangkat**, di lembar Settings aplikasi — bukan dalam konfigurasi Gateway/`openclaw.json`.

| Pengaturan                     | Deskripsi                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Teruskan Peristiwa Notifikasi | Tombol utama. Nonaktif secara default; mengharuskan Akses Pendengar Notifikasi diberikan terlebih dahulu.                                                                                                              |
| Filter Paket              | **Daftar yang diizinkan** (hanya ID paket yang tercantum yang diteruskan) atau **Daftar blokir** (default: semua paket kecuali ID yang tercantum). Paket milik OpenClaw selalu dikecualikan dalam mode Daftar blokir untuk mencegah perulangan penerusan. |
| Jam Tenang                 | Rentang waktu mulai/selesai lokal HH:mm yang menekan penerusan. Dinonaktifkan secara default; nilai defaultnya adalah `22:00`-`07:00` setelah diaktifkan.                                                                                |
| Peristiwa Maks. / Menit         | Batas laju per perangkat untuk notifikasi yang diteruskan. Default 20.                                                                                                                                          |
| Kunci Sesi Rute           | Opsional. Menyematkan peristiwa notifikasi yang diteruskan ke sesi tertentu alih-alih rute notifikasi default perangkat.                                                                               |

<Note>
Penerusan notifikasi memerlukan izin Pendengar Notifikasi Android. Aplikasi akan meminta izin ini selama penyiapan.
</Note>

Notifikasi WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord, dan Signal selalu dikecualikan. Pesannya sudah ditangani oleh sesi channel OpenClaw native; meneruskan notifikasi Android sebagai peristiwa Node terpisah dapat mengarahkan balasan melalui percakapan yang salah.

## Terkait

- [Aplikasi iOS](/id/platforms/ios)
- [Node](/id/nodes)
- [Pemecahan masalah Node Android](/id/nodes/troubleshooting)
