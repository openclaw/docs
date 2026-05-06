---
read_when:
    - Menambahkan atau memodifikasi pengambilan kamera pada node iOS/Android atau macOS
    - Memperluas alur kerja berkas sementara MEDIA yang dapat diakses agen
summary: 'Pengambilan gambar kamera (node iOS/Android + aplikasi macOS) untuk digunakan oleh agen: foto (jpg) dan klip video pendek (mp4)'
title: Pengambilan gambar kamera
x-i18n:
    generated_at: "2026-05-06T09:18:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw mendukung **pengambilan kamera** untuk alur kerja agen:

- **Node iOS** (dipasangkan melalui Gateway): mengambil **foto** (`jpg`) atau **klip video singkat** (`mp4`, dengan audio opsional) melalui `node.invoke`.
- **Node Android** (dipasangkan melalui Gateway): mengambil **foto** (`jpg`) atau **klip video singkat** (`mp4`, dengan audio opsional) melalui `node.invoke`.
- **Aplikasi macOS** (Node melalui Gateway): mengambil **foto** (`jpg`) atau **klip video singkat** (`mp4`, dengan audio opsional) melalui `node.invoke`.

Semua akses kamera dibatasi oleh **pengaturan yang dikendalikan pengguna**.

## Node iOS

### Pengaturan pengguna (aktif secara default)

- Tab Settings iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Default: **aktif** (kunci yang tidak ada diperlakukan sebagai aktif).
  - Saat nonaktif: perintah `camera.*` mengembalikan `CAMERA_DISABLED`.

### Perintah (melalui Gateway `node.invoke`)

- `camera.list`
  - Payload respons:
    - `devices`: array berisi `{ id, name, position, deviceType }`

- `camera.snap`
  - Parameter:
    - `facing`: `front|back` (default: `front`)
    - `maxWidth`: angka (opsional; default `1600` pada Node iOS)
    - `quality`: `0..1` (opsional; default `0.9`)
    - `format`: saat ini `jpg`
    - `delayMs`: angka (opsional; default `0`)
    - `deviceId`: string (opsional; dari `camera.list`)
  - Payload respons:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Pelindung payload: foto dikompresi ulang agar payload base64 tetap di bawah 5 MB.

- `camera.clip`
  - Parameter:
    - `facing`: `front|back` (default: `front`)
    - `durationMs`: angka (default `3000`, dibatasi hingga maksimum `60000`)
    - `includeAudio`: boolean (default `true`)
    - `format`: saat ini `mp4`
    - `deviceId`: string (opsional; dari `camera.list`)
  - Payload respons:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Persyaratan latar depan

Seperti `canvas.*`, Node iOS hanya mengizinkan perintah `camera.*` di **latar depan**. Pemanggilan latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE`.

### Pembantu CLI (file sementara + MEDIA)

Cara termudah untuk mendapatkan lampiran adalah melalui pembantu CLI, yang menulis media yang telah didekodekan ke file sementara dan mencetak `MEDIA:<path>`.

Contoh:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Catatan:

- `nodes camera snap` secara default menggunakan **kedua** arah kamera untuk memberi agen kedua tampilan.
- File keluaran bersifat sementara (di direktori sementara OS) kecuali Anda membuat wrapper sendiri.

## Node Android

### Pengaturan pengguna Android (aktif secara default)

- Lembar Settings Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Default: **aktif** (kunci yang tidak ada diperlakukan sebagai aktif).
  - Saat nonaktif: perintah `camera.*` mengembalikan `CAMERA_DISABLED`.

### Izin

- Android memerlukan izin runtime:
  - `CAMERA` untuk `camera.snap` dan `camera.clip`.
  - `RECORD_AUDIO` untuk `camera.clip` saat `includeAudio=true`.

Jika izin tidak ada, aplikasi akan meminta saat memungkinkan; jika ditolak, permintaan `camera.*` gagal dengan galat
`*_PERMISSION_REQUIRED`.

### Persyaratan latar depan Android

Seperti `canvas.*`, Node Android hanya mengizinkan perintah `camera.*` di **latar depan**. Pemanggilan latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE`.

### Perintah Android (melalui Gateway `node.invoke`)

- `camera.list`
  - Payload respons:
    - `devices`: array berisi `{ id, name, position, deviceType }`

### Pelindung payload

Foto dikompresi ulang agar payload base64 tetap di bawah 5 MB.

## Aplikasi macOS

### Pengaturan pengguna (nonaktif secara default)

Aplikasi pendamping macOS menyediakan kotak centang:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Default: **nonaktif**
  - Saat nonaktif: permintaan kamera mengembalikan "Kamera dinonaktifkan oleh pengguna".

### Pembantu CLI (pemanggilan Node)

Gunakan CLI utama `openclaw` untuk memanggil perintah kamera pada Node macOS.

Contoh:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Catatan:

- `openclaw nodes camera snap` secara default menggunakan `maxWidth=1600` kecuali ditimpa.
- Di macOS, `camera.snap` menunggu `delayMs` (default 2000ms) setelah pemanasan/eksposur stabil sebelum mengambil gambar.
- Payload foto dikompresi ulang agar base64 tetap di bawah 5 MB.

## Keamanan + batas praktis

- Akses kamera dan mikrofon memicu prompt izin OS yang biasa (dan memerlukan string penggunaan di Info.plist).
- Klip video dibatasi (saat ini `<= 60s`) untuk menghindari payload Node yang terlalu besar (overhead base64 + batas pesan).

## Video layar macOS (level OS)

Untuk video _layar_ (bukan kamera), gunakan pendamping macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Catatan:

- Memerlukan izin **Screen Recording** macOS (TCC).

## Terkait

- [Dukungan gambar dan media](/id/nodes/images)
- [Pemahaman media](/id/nodes/media-understanding)
- [Perintah lokasi](/id/nodes/location-command)
