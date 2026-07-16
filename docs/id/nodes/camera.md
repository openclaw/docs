---
read_when:
    - Menambahkan atau memodifikasi pengambilan gambar kamera pada platform Node
    - Memperluas alur kerja file sementara MEDIA yang dapat diakses agen
summary: Pengambilan gambar kamera pada Node iOS, Android, macOS, dan Linux untuk foto dan klip video pendek
title: Pengambilan gambar kamera
x-i18n:
    generated_at: "2026-07-16T18:15:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw mendukung pengambilan gambar kamera untuk alur kerja agen pada node **iOS**, **Android**, **macOS**, dan **Linux** yang dipasangkan: mengambil foto (`jpg`) atau klip video pendek (`mp4`, dengan audio opsional) melalui Gateway `node.invoke`.

Semua akses kamera dibatasi oleh pengaturan yang dikendalikan pengguna pada setiap platform.

## Node iOS

### Pengaturan pengguna iOS

- Tab Settings iOS → **Camera** → **Allow Camera** (`camera.enabled`).
  - Default: **aktif** (kunci yang tidak ada dianggap aktif).
  - Saat nonaktif: perintah `camera.*` mengembalikan `CAMERA_DISABLED`.

### Perintah iOS (melalui Gateway `node.invoke`)

- `camera.list`
  - Payload respons: `devices` — larik `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parameter:
    - `facing`: `front|back` (default: `front`)
    - `maxWidth`: angka (opsional; default `1600`)
    - `quality`: `0..1` (opsional; default `0.9`, dibatasi ke `[0.05, 1.0]`)
    - `format`: saat ini `jpg`
    - `delayMs`: angka (opsional; default `0`, secara internal dibatasi maksimum `10000`)
    - `deviceId`: string (opsional; dari `camera.list`)
  - Payload respons: `format: "jpg"`, `base64`, `width`, `height`.
  - Pembatas payload: foto dikompresi ulang agar payload yang dikodekan dengan base64 tetap di bawah 5MB.

- `camera.clip`
  - Parameter:
    - `facing`: `front|back` (default: `front`)
    - `durationMs`: angka (default `3000`, dibatasi ke `[250, 60000]`)
    - `includeAudio`: boolean (default `true`)
    - `format`: saat ini `mp4`
    - `deviceId`: string (opsional; dari `camera.list`)
  - Payload respons: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Persyaratan latar depan iOS

Seperti `canvas.*`, node iOS hanya mengizinkan perintah `camera.*` di **latar depan**. Pemanggilan di latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE`.

### Pembantu CLI

Cara termudah untuk memperoleh berkas media adalah melalui pembantu CLI, yang menulis media hasil dekode ke berkas sementara dan mencetak jalur penyimpanannya.

```bash
openclaw nodes camera snap --node <id>                 # default: kamera depan + belakang (2 baris MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` secara default menggunakan `--facing both`, mengambil gambar dari kamera depan dan belakang untuk memberikan kedua tampilan kepada agen; teruskan `--device-id` dengan satu arah kamera eksplisit (`both` ditolak ketika `--device-id` ditetapkan). Berkas keluaran bersifat sementara (di direktori sementara OS), kecuali jika Anda membuat pembungkus sendiri.

## Node Android

### Pengaturan pengguna Android

- Lembar Settings Android → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Instalasi baru secara default nonaktif.** Instalasi yang sudah ada sebelum pengaturan ini tersedia dimigrasikan menjadi **aktif** agar peningkatan versi tidak secara diam-diam menghilangkan akses kamera yang sebelumnya berfungsi.
  - Saat nonaktif: perintah `camera.*` mengembalikan `CAMERA_DISABLED: enable Camera in Settings`.

### Izin

- `CAMERA` diperlukan untuk `camera.snap` maupun `camera.clip`; izin yang tidak ada/ditolak mengembalikan `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` diperlukan untuk `camera.clip` ketika `includeAudio` bernilai `true`; izin yang tidak ada/ditolak mengembalikan `MIC_PERMISSION_REQUIRED`.

Aplikasi meminta izin runtime jika memungkinkan.

### Persyaratan latar depan Android

Seperti `canvas.*`, node Android hanya mengizinkan perintah `camera.*` di **latar depan**. Pemanggilan di latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Perintah Android (melalui Gateway `node.invoke`)

- `camera.list`
  - Payload respons: `devices` — larik `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parameter: `facing` (`front|back`, default `front`), `quality` (default `0.95`, dibatasi ke `[0.1, 1.0]`), `maxWidth` (default `1600`), `deviceId` (opsional; id yang tidak dikenal gagal dengan `INVALID_REQUEST`).
  - Payload respons: `format: "jpg"`, `base64`, `width`, `height`.
  - Pembatas payload: dikompresi ulang agar base64 tetap di bawah 5MB (batas yang sama seperti iOS).

- `camera.clip`
  - Parameter: `facing` (default `front`), `durationMs` (default `3000`, dibatasi ke `[200, 60000]`), `includeAudio` (default `true`), `deviceId` (opsional).
  - Payload respons: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Pembatas payload: MP4 mentah dibatasi maksimum 18MB sebelum pengodean base64; klip yang terlalu besar gagal dengan `PAYLOAD_TOO_LARGE` (kurangi `durationMs` dan coba lagi).

## Aplikasi macOS

### Pengaturan pengguna macOS

Aplikasi pendamping macOS menyediakan kotak centang:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Default: **nonaktif**.
  - Saat nonaktif: permintaan kamera mengembalikan `CAMERA_DISABLED: enable Camera in Settings`.

### Pembantu CLI (pemanggilan node)

Gunakan CLI utama `openclaw` untuk memanggil perintah kamera pada node macOS.

```bash
openclaw nodes camera list --node <id>                     # cantumkan id kamera
openclaw nodes camera snap --node <id>                     # mencetak jalur penyimpanan
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # mencetak jalur penyimpanan
openclaw nodes camera clip --node <id> --duration-ms 3000   # mencetak jalur penyimpanan (flag lama)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` secara default menggunakan `maxWidth=1600` kecuali ditimpa.
- `camera.snap` menunggu `delayMs` (default 2000ms, dibatasi ke `[0, 10000]`) setelah pemanasan/penstabilan eksposur sebelum mengambil gambar.
- Payload foto dikompresi ulang agar base64 tetap di bawah 5MB.

## Host node Linux

Plugin Node Linux bawaan menambahkan pengambilan gambar kamera ke layanan CLI `openclaw node`. Plugin ini berfungsi pada host tanpa antarmuka grafis dan tidak memerlukan aplikasi desktop Linux.

Akses kamera secara default nonaktif. Aktifkan di bawah entri plugin, lalu mulai ulang layanan node agar pengumuman Gateway-nya dibuat ulang:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

Persyaratan:

- FFmpeg dengan input V4L2, `libx264`, dan dukungan AAC
- perangkat `/dev/video*` yang dapat dibaca oleh pengguna layanan node; pada distribusi umum, tambahkan pengguna tersebut ke grup `video`
- untuk klip dengan `includeAudio: true` default, server PulseAudio yang berfungsi atau lapisan kompatibilitas PulseAudio PipeWire dengan sumber default

Linux mengembalikan jalur perangkat V4L2 yang dapat mengambil gambar dan dapat dibaca dari `camera.list`; FFmpeg memeriksa setiap kandidat `/dev/video*` dan mengabaikan node metadata atau node khusus keluaran. `position` perangkat adalah `unknown`, sehingga permintaan arah kamera tanpa `deviceId` menghasilkan satu foto atau klip dengan posisi `unknown`, alih-alih mengklaim kamera depan atau belakang. Gunakan `deviceId` ketika host memiliki beberapa kamera. `camera.snap` menggunakan pemanasan input FFmpeg selama `delayMs` dan mempertahankan rasio aspek sambil membatasi lebar. `camera.clip` merekam audio mikrofon sebagai trek audio MP4; OpenClaw secara sengaja tidak menyediakan perintah mikrofon mandiri.

Plugin menggunakan `libx264` untuk video MP4 dan tidak mengubah codec secara diam-diam. Build FFmpeg tanpa input atau encoder yang diperlukan mengembalikan `CAMERA_UNAVAILABLE`. Foto dan klip yang akan melampaui batas payload base64 sebesar 25MB gagal dengan `PAYLOAD_TOO_LARGE`.

`camera.snap` dan `camera.clip` tetap merupakan perintah berbahaya. Tambahkan perintah tersebut ke `gateway.nodes.allowCommands` hanya jika Anda bermaksud mengaktifkan pengambilan; mengaktifkan plugin saja tidak melewati kebijakan Gateway.

## Keamanan + batas praktis

- Akses kamera dan mikrofon memicu permintaan izin OS seperti biasa (dan memerlukan string penggunaan dalam `Info.plist`).
- Klip video dibatasi maksimum 60s untuk menghindari payload node yang terlalu besar (overhead base64 ditambah batas pesan).

## Video layar macOS (tingkat OS)

Untuk video _layar_ (bukan kamera), gunakan aplikasi pendamping macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # mencetak jalur penyimpanan
```

Memerlukan izin **Screen Recording** macOS (TCC).

## Terkait

- [Dukungan gambar dan media](/id/nodes/images)
- [Pemahaman media](/id/nodes/media-understanding)
- [Perintah lokasi](/id/nodes/location-command)
