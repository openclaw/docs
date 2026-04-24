---
read_when:
    - Menambahkan atau memodifikasi pengambilan kamera pada Node iOS/Android atau macOS
    - Memperluas alur kerja file sementara MEDIA yang dapat diakses agen
summary: 'Pengambilan kamera (Node iOS/Android + aplikasi macOS) untuk penggunaan agen: foto (jpg) dan klip video pendek (mp4)'
title: Pengambilan kamera
x-i18n:
    generated_at: "2026-04-24T09:15:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 15
---

OpenClaw mendukung **pengambilan kamera** untuk alur kerja agen:

- **Node iOS** (dipasangkan melalui Gateway): ambil **foto** (`jpg`) atau **klip video pendek** (`mp4`, dengan audio opsional) melalui `node.invoke`.
- **Node Android** (dipasangkan melalui Gateway): ambil **foto** (`jpg`) atau **klip video pendek** (`mp4`, dengan audio opsional) melalui `node.invoke`.
- **Aplikasi macOS** (Node melalui Gateway): ambil **foto** (`jpg`) atau **klip video pendek** (`mp4`, dengan audio opsional) melalui `node.invoke`.

Semua akses kamera dijaga di balik **pengaturan yang dikendalikan pengguna**.

## Node iOS

### Pengaturan pengguna (default aktif)

- Tab Pengaturan iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Default: **aktif** (key yang tidak ada diperlakukan sebagai aktif).
  - Saat nonaktif: perintah `camera.*` mengembalikan `CAMERA_DISABLED`.

### Perintah (melalui Gateway `node.invoke`)

- `camera.list`
  - Payload respons:
    - `devices`: array dari `{ id, name, position, deviceType }`

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
  - Guard payload: foto dikompresi ulang agar payload base64 tetap di bawah 5 MB.

- `camera.clip`
  - Parameter:
    - `facing`: `front|back` (default: `front`)
    - `durationMs`: angka (default `3000`, dibatasi maksimum `60000`)
    - `includeAudio`: boolean (default `true`)
    - `format`: saat ini `mp4`
    - `deviceId`: string (opsional; dari `camera.list`)
  - Payload respons:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Persyaratan foreground

Seperti `canvas.*`, Node iOS hanya mengizinkan perintah `camera.*` di **foreground**. Pemanggilan latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE`.

### Helper CLI (file sementara + MEDIA)

Cara termudah untuk mendapatkan lampiran adalah melalui helper CLI, yang menulis media hasil decode ke file sementara dan mencetak `MEDIA:<path>`.

Contoh:

```bash
openclaw nodes camera snap --node <id>               # default: front + back sekaligus (2 baris MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Catatan:

- `nodes camera snap` default ke **kedua** arah kamera agar agen mendapatkan kedua tampilan.
- File output bersifat sementara (di direktori temp OS) kecuali Anda membuat wrapper sendiri.

## Node Android

### Pengaturan pengguna Android (default aktif)

- Lembar Pengaturan Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Default: **aktif** (key yang tidak ada diperlakukan sebagai aktif).
  - Saat nonaktif: perintah `camera.*` mengembalikan `CAMERA_DISABLED`.

### Izin

- Android memerlukan izin runtime:
  - `CAMERA` untuk `camera.snap` dan `camera.clip`.
  - `RECORD_AUDIO` untuk `camera.clip` saat `includeAudio=true`.

Jika izin tidak ada, aplikasi akan meminta izin jika memungkinkan; jika ditolak, permintaan `camera.*` gagal dengan
error `*_PERMISSION_REQUIRED`.

### Persyaratan foreground Android

Seperti `canvas.*`, Node Android hanya mengizinkan perintah `camera.*` di **foreground**. Pemanggilan latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE`.

### Perintah Android (melalui Gateway `node.invoke`)

- `camera.list`
  - Payload respons:
    - `devices`: array dari `{ id, name, position, deviceType }`

### Guard payload

Foto dikompresi ulang agar payload base64 tetap di bawah 5 MB.

## Aplikasi macOS

### Pengaturan pengguna (default nonaktif)

Aplikasi pendamping macOS menyediakan checkbox:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Default: **nonaktif**
  - Saat nonaktif: permintaan kamera mengembalikan “Camera disabled by user”.

### Helper CLI (node invoke)

Gunakan CLI `openclaw` utama untuk memanggil perintah kamera pada Node macOS.

Contoh:

```bash
openclaw nodes camera list --node <id>            # tampilkan daftar id kamera
openclaw nodes camera snap --node <id>            # mencetak MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # mencetak MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # mencetak MEDIA:<path> (flag lama)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Catatan:

- `openclaw nodes camera snap` default ke `maxWidth=1600` kecuali ditimpa.
- Di macOS, `camera.snap` menunggu `delayMs` (default 2000ms) setelah warm-up/penyetelan exposure sebelum mengambil gambar.
- Payload foto dikompresi ulang agar base64 tetap di bawah 5 MB.

## Keamanan + batas praktis

- Akses kamera dan mikrofon memicu prompt izin OS seperti biasa (dan memerlukan usage string di Info.plist).
- Klip video dibatasi (saat ini `<= 60s`) untuk menghindari payload Node yang terlalu besar (overhead base64 + batas pesan).

## Video layar macOS (tingkat OS)

Untuk video _layar_ (bukan kamera), gunakan aplikasi pendamping macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # mencetak MEDIA:<path>
```

Catatan:

- Memerlukan izin macOS **Screen Recording** (TCC).

## Terkait

- [Dukungan gambar dan media](/id/nodes/images)
- [Pemahaman media](/id/nodes/media-understanding)
- [Perintah lokasi](/id/nodes/location-command)
