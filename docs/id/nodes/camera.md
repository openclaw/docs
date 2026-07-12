---
read_when:
    - Menambahkan atau memodifikasi pengambilan gambar kamera pada Node iOS/Android atau macOS
    - Memperluas alur kerja berkas sementara MEDIA yang dapat diakses agen
summary: 'Pengambilan gambar kamera (Node iOS/Android + aplikasi macOS) untuk digunakan agen: foto (jpg) dan klip video pendek (mp4)'
title: Pengambilan gambar kamera
x-i18n:
    generated_at: "2026-07-12T14:19:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw mendukung pengambilan gambar kamera untuk alur kerja agen pada node **iOS**, **Android**, dan **macOS** yang telah dipasangkan: ambil foto (`jpg`) atau klip video pendek (`mp4`, dengan audio opsional) melalui Gateway `node.invoke`.

Semua akses kamera dibatasi oleh pengaturan yang dikendalikan pengguna pada setiap platform.

## Node iOS

### Pengaturan pengguna iOS

- Tab Settings iOS → **Camera** → **Allow Camera** (`camera.enabled`).
  - Bawaan: **aktif** (kunci yang tidak ada dianggap aktif).
  - Saat nonaktif: perintah `camera.*` mengembalikan `CAMERA_DISABLED`.

### Perintah iOS (melalui Gateway `node.invoke`)

- `camera.list`
  - Payload respons: `devices` — larik `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parameter:
    - `facing`: `front|back` (bawaan: `front`)
    - `maxWidth`: angka (opsional; bawaan `1600`)
    - `quality`: `0..1` (opsional; bawaan `0.9`, dibatasi ke `[0.05, 1.0]`)
    - `format`: saat ini `jpg`
    - `delayMs`: angka (opsional; bawaan `0`, secara internal dibatasi maksimum `10000`)
    - `deviceId`: string (opsional; dari `camera.list`)
  - Payload respons: `format: "jpg"`, `base64`, `width`, `height`.
  - Pembatas payload: foto dikompresi ulang agar payload yang dikodekan dengan base64 tetap di bawah 5 MB.

- `camera.clip`
  - Parameter:
    - `facing`: `front|back` (bawaan: `front`)
    - `durationMs`: angka (bawaan `3000`, dibatasi ke `[250, 60000]`)
    - `includeAudio`: boolean (bawaan `true`)
    - `format`: saat ini `mp4`
    - `deviceId`: string (opsional; dari `camera.list`)
  - Payload respons: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Persyaratan latar depan iOS

Seperti `canvas.*`, node iOS hanya mengizinkan perintah `camera.*` saat berada di **latar depan**. Pemanggilan di latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE`.

### Pembantu CLI

Cara termudah untuk mendapatkan berkas media adalah melalui pembantu CLI, yang menulis media hasil dekode ke berkas sementara dan mencetak jalur penyimpanannya.

```bash
openclaw nodes camera snap --node <id>                 # bawaan: kamera depan + belakang (2 baris MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` secara bawaan menggunakan `--facing both`, mengambil gambar dari kamera depan dan belakang untuk memberikan kedua tampilan kepada agen; berikan `--device-id` dengan satu arah kamera eksplisit (`both` ditolak ketika `--device-id` ditetapkan). Berkas keluaran bersifat sementara (di direktori sementara OS), kecuali Anda membuat pembungkus sendiri.

## Node Android

### Pengaturan pengguna Android

- Panel Settings Android → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Instalasi baru secara bawaan dinonaktifkan.** Instalasi lama yang mendahului pengaturan ini dimigrasikan menjadi **aktif** agar peningkatan versi tidak secara diam-diam menghilangkan akses kamera yang sebelumnya berfungsi.
  - Saat nonaktif: perintah `camera.*` mengembalikan `CAMERA_DISABLED: enable Camera in Settings`.

### Izin

- `CAMERA` diperlukan untuk `camera.snap` dan `camera.clip`; izin yang tidak ada/ditolak mengembalikan `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` diperlukan untuk `camera.clip` ketika `includeAudio` bernilai `true`; izin yang tidak ada/ditolak mengembalikan `MIC_PERMISSION_REQUIRED`.

Aplikasi meminta izin waktu proses jika memungkinkan.

### Persyaratan latar depan Android

Seperti `canvas.*`, node Android hanya mengizinkan perintah `camera.*` saat berada di **latar depan**. Pemanggilan di latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Perintah Android (melalui Gateway `node.invoke`)

- `camera.list`
  - Payload respons: `devices` — larik `{ id, name, position, deviceType }`.

- `camera.snap`
  - Parameter: `facing` (`front|back`, bawaan `front`), `quality` (bawaan `0.95`, dibatasi ke `[0.1, 1.0]`), `maxWidth` (bawaan `1600`), `deviceId` (opsional; id yang tidak dikenal gagal dengan `INVALID_REQUEST`).
  - Payload respons: `format: "jpg"`, `base64`, `width`, `height`.
  - Pembatas payload: dikompresi ulang agar base64 tetap di bawah 5 MB (batas yang sama dengan iOS).

- `camera.clip`
  - Parameter: `facing` (bawaan `front`), `durationMs` (bawaan `3000`, dibatasi ke `[200, 60000]`), `includeAudio` (bawaan `true`), `deviceId` (opsional).
  - Payload respons: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Pembatas payload: MP4 mentah dibatasi hingga 18 MB sebelum pengodean base64; klip yang terlalu besar gagal dengan `PAYLOAD_TOO_LARGE` (kurangi `durationMs` dan coba lagi).

## Aplikasi macOS

### Pengaturan pengguna macOS

Aplikasi pendamping macOS menyediakan kotak centang:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Bawaan: **nonaktif**.
  - Saat nonaktif: permintaan kamera mengembalikan `CAMERA_DISABLED: enable Camera in Settings`.

### Pembantu CLI (pemanggilan node)

Gunakan CLI utama `openclaw` untuk memanggil perintah kamera pada node macOS.

```bash
openclaw nodes camera list --node <id>                     # mencantumkan id kamera
openclaw nodes camera snap --node <id>                     # mencetak jalur penyimpanan
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # mencetak jalur penyimpanan
openclaw nodes camera clip --node <id> --duration-ms 3000   # mencetak jalur penyimpanan (flag lama)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` secara bawaan menggunakan `maxWidth=1600`, kecuali ditimpa.
- `camera.snap` menunggu selama `delayMs` (bawaan 2000 md, dibatasi ke `[0, 10000]`) setelah pemanasan/penyesuaian pencahayaan selesai sebelum mengambil gambar.
- Payload foto dikompresi ulang agar base64 tetap di bawah 5 MB.

## Keamanan + batas praktis

- Akses kamera dan mikrofon memicu permintaan izin OS seperti biasa (dan memerlukan string penggunaan dalam `Info.plist`).
- Klip video dibatasi hingga 60 detik untuk menghindari payload node yang terlalu besar (overhead base64 ditambah batas pesan).

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
