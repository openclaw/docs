---
read_when:
    - Menambahkan atau memodifikasi pengambilan kamera pada node iOS/Android atau macOS
    - Memperluas alur kerja file sementara MEDIA yang dapat diakses agen
summary: 'Pengambilan kamera (node iOS/Android + app macOS) untuk penggunaan agen: foto (jpg) dan klip video pendek (mp4)'
title: Pengambilan Kamera
x-i18n:
    generated_at: "2026-04-05T13:59:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d
    source_path: nodes/camera.md
    workflow: 15
---

# Pengambilan kamera (agen)

OpenClaw mendukung **pengambilan kamera** untuk alur kerja agen:

- **Node iOS** (dipasangkan melalui Gateway): ambil **foto** (`jpg`) atau **klip video pendek** (`mp4`, dengan audio opsional) melalui `node.invoke`.
- **Node Android** (dipasangkan melalui Gateway): ambil **foto** (`jpg`) atau **klip video pendek** (`mp4`, dengan audio opsional) melalui `node.invoke`.
- **App macOS** (node melalui Gateway): ambil **foto** (`jpg`) atau **klip video pendek** (`mp4`, dengan audio opsional) melalui `node.invoke`.

Semua akses kamera dibatasi di balik **pengaturan yang dikendalikan pengguna**.

## Node iOS

### Pengaturan pengguna (default aktif)

- Tab Settings iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Default: **aktif** (key yang tidak ada diperlakukan sebagai aktif).
  - Saat nonaktif: command `camera.*` mengembalikan `CAMERA_DISABLED`.

### Command (melalui Gateway `node.invoke`)

- `camera.list`
  - Payload respons:
    - `devices`: array dari `{ id, name, position, deviceType }`

- `camera.snap`
  - Params:
    - `facing`: `front|back` (default: `front`)
    - `maxWidth`: number (opsional; default `1600` pada node iOS)
    - `quality`: `0..1` (opsional; default `0.9`)
    - `format`: saat ini `jpg`
    - `delayMs`: number (opsional; default `0`)
    - `deviceId`: string (opsional; dari `camera.list`)
  - Payload respons:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Guard payload: foto dikompresi ulang untuk menjaga payload base64 tetap di bawah 5 MB.

- `camera.clip`
  - Params:
    - `facing`: `front|back` (default: `front`)
    - `durationMs`: number (default `3000`, dibatasi ke maksimum `60000`)
    - `includeAudio`: boolean (default `true`)
    - `format`: saat ini `mp4`
    - `deviceId`: string (opsional; dari `camera.list`)
  - Payload respons:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Persyaratan foreground

Seperti `canvas.*`, node iOS hanya mengizinkan command `camera.*` di **foreground**. Invocation latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE`.

### Helper CLI (file sementara + MEDIA)

Cara termudah untuk mendapatkan lampiran adalah melalui helper CLI, yang menulis media hasil decode ke file sementara dan mencetak `MEDIA:<path>`.

Contoh:

```bash
openclaw nodes camera snap --node <id>               # default: kedua sisi front + back (2 baris MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Catatan:

- `nodes camera snap` secara default menggunakan **kedua** arah untuk memberi agen kedua tampilan.
- File output bersifat sementara (di direktori temp OS) kecuali Anda membuat wrapper sendiri.

## Node Android

### Pengaturan pengguna Android (default aktif)

- Lembar Android Settings → **Camera** → **Allow Camera** (`camera.enabled`)
  - Default: **aktif** (key yang tidak ada diperlakukan sebagai aktif).
  - Saat nonaktif: command `camera.*` mengembalikan `CAMERA_DISABLED`.

### Izin

- Android memerlukan izin runtime:
  - `CAMERA` untuk `camera.snap` dan `camera.clip`.
  - `RECORD_AUDIO` untuk `camera.clip` ketika `includeAudio=true`.

Jika izin tidak ada, app akan meminta izin jika memungkinkan; jika ditolak, permintaan `camera.*` gagal dengan error
`*_PERMISSION_REQUIRED`.

### Persyaratan foreground Android

Seperti `canvas.*`, node Android hanya mengizinkan command `camera.*` di **foreground**. Invocation latar belakang mengembalikan `NODE_BACKGROUND_UNAVAILABLE`.

### Command Android (melalui Gateway `node.invoke`)

- `camera.list`
  - Payload respons:
    - `devices`: array dari `{ id, name, position, deviceType }`

### Guard payload

Foto dikompresi ulang untuk menjaga payload base64 tetap di bawah 5 MB.

## App macOS

### Pengaturan pengguna (default nonaktif)

App pendamping macOS menampilkan kotak centang:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Default: **nonaktif**
  - Saat nonaktif: permintaan kamera mengembalikan “Kamera dinonaktifkan oleh pengguna”.

### Helper CLI (node invoke)

Gunakan CLI `openclaw` utama untuk memanggil command kamera pada node macOS.

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

- `openclaw nodes camera snap` default ke `maxWidth=1600` kecuali dioverride.
- Di macOS, `camera.snap` menunggu `delayMs` (default 2000ms) setelah warm-up/exposure settle sebelum mengambil gambar.
- Payload foto dikompresi ulang agar base64 tetap di bawah 5 MB.

## Keamanan + batas praktis

- Akses kamera dan mikrofon memicu prompt izin OS seperti biasa (dan memerlukan usage string di Info.plist).
- Klip video dibatasi (saat ini `<= 60s`) untuk menghindari payload node yang terlalu besar (overhead base64 + batas pesan).

## Video layar macOS (level OS)

Untuk video _layar_ (bukan kamera), gunakan app pendamping macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # mencetak MEDIA:<path>
```

Catatan:

- Memerlukan izin macOS **Screen Recording** (TCC).
