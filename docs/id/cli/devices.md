---
read_when:
    - Anda sedang menyetujui permintaan pairing perangkat
    - Anda perlu merotasi atau mencabut token perangkat
summary: Referensi CLI untuk `openclaw devices` (pairing perangkat + rotasi/pencabutan token)
title: devices
x-i18n:
    generated_at: "2026-04-05T13:45:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2f9fcb8e3508a703590f87caaafd953a5d3557e11c958cbb2be1d67bb8720f4
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Kelola permintaan pairing perangkat dan token yang dibatasi untuk perangkat.

## Perintah

### `openclaw devices list`

Tampilkan daftar permintaan pairing yang tertunda dan perangkat yang sudah dipasangkan.

```
openclaw devices list
openclaw devices list --json
```

Output permintaan tertunda mencakup role dan scope yang diminta sehingga persetujuan
dapat ditinjau sebelum Anda menyetujuinya.

### `openclaw devices remove <deviceId>`

Hapus satu entri perangkat yang sudah dipasangkan.

Saat Anda diautentikasi dengan token perangkat yang sudah dipasangkan, pemanggil non-admin hanya dapat
menghapus entri perangkat **milik mereka sendiri**. Menghapus perangkat lain memerlukan
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Hapus perangkat yang sudah dipasangkan secara massal.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Setujui permintaan pairing perangkat yang tertunda. Jika `requestId` dihilangkan, OpenClaw
secara otomatis menyetujui permintaan tertunda yang paling baru.

Catatan: jika sebuah perangkat mencoba pairing ulang dengan detail autentikasi yang berubah (role/scope/public
key), OpenClaw menggantikan entri tertunda sebelumnya dan menerbitkan
`requestId` baru. Jalankan `openclaw devices list` tepat sebelum persetujuan untuk menggunakan
ID saat ini.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Tolak permintaan pairing perangkat yang tertunda.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotasikan token perangkat untuk role tertentu (opsional sambil memperbarui scope).
Role target harus sudah ada dalam kontrak pairing yang disetujui untuk perangkat tersebut;
rotasi tidak dapat menerbitkan role baru yang belum disetujui.
Jika Anda menghilangkan `--scope`, koneksi ulang berikutnya dengan token hasil rotasi yang tersimpan akan menggunakan kembali
scope yang disetujui dan di-cache dari token tersebut. Jika Anda memberikan nilai `--scope` secara eksplisit, nilai tersebut
menjadi kumpulan scope tersimpan untuk koneksi ulang token-cache di masa mendatang.
Pemanggil perangkat berpasangan non-admin hanya dapat merotasi token perangkat **milik mereka sendiri**.
Selain itu, setiap nilai `--scope` eksplisit harus tetap berada dalam scope operator milik sesi pemanggil sendiri;
rotasi tidak dapat menerbitkan token operator yang lebih luas daripada yang
sudah dimiliki pemanggil.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Mengembalikan payload token baru sebagai JSON.

### `openclaw devices revoke --device <id> --role <role>`

Cabut token perangkat untuk role tertentu.

Pemanggil perangkat berpasangan non-admin hanya dapat mencabut token perangkat **milik mereka sendiri**.
Mencabut token perangkat lain memerlukan `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Mengembalikan hasil pencabutan sebagai JSON.

## Opsi umum

- `--url <url>`: URL WebSocket Gateway (default ke `gateway.remote.url` jika dikonfigurasi).
- `--token <token>`: token Gateway (jika diperlukan).
- `--password <password>`: kata sandi Gateway (autentikasi kata sandi).
- `--timeout <ms>`: timeout RPC.
- `--json`: output JSON (disarankan untuk scripting).

Catatan: saat Anda menetapkan `--url`, CLI tidak melakukan fallback ke kredensial config atau environment.
Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada adalah error.

## Catatan

- Rotasi token mengembalikan token baru (sensitif). Perlakukan seperti rahasia.
- Perintah ini memerlukan scope `operator.pairing` (atau `operator.admin`).
- Rotasi token tetap berada dalam kumpulan role pairing yang disetujui dan baseline scope yang disetujui
  untuk perangkat tersebut. Entri token cache yang menyimpang tidak memberikan target
  rotasi baru.
- Untuk sesi token perangkat berpasangan, pengelolaan lintas perangkat hanya untuk admin:
  `remove`, `rotate`, dan `revoke` hanya berlaku untuk diri sendiri kecuali pemanggil memiliki
  `operator.admin`.
- `devices clear` sengaja dibatasi oleh `--yes`.
- Jika scope pairing tidak tersedia di local loopback (dan tidak ada `--url` eksplisit yang diberikan), list/approve dapat menggunakan fallback pairing lokal.
- `devices approve` secara otomatis memilih permintaan tertunda terbaru saat Anda menghilangkan `requestId` atau memberikan `--latest`.

## Checklist pemulihan drift token

Gunakan ini saat Control UI atau klien lain terus gagal dengan `AUTH_TOKEN_MISMATCH` atau `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Konfirmasikan sumber token gateway saat ini:

```bash
openclaw config get gateway.auth.token
```

2. Tampilkan perangkat yang sudah dipasangkan dan identifikasi id perangkat yang terdampak:

```bash
openclaw devices list
```

3. Rotasikan token operator untuk perangkat yang terdampak:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jika rotasi tidak cukup, hapus pairing yang usang dan setujui lagi:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Coba lagi koneksi klien dengan token/kata sandi bersama saat ini.

Catatan:

- Prioritas autentikasi koneksi ulang normal adalah token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
- Pemulihan tepercaya `AUTH_TOKEN_MISMATCH` dapat sementara mengirim baik token bersama maupun token perangkat tersimpan secara bersamaan untuk satu percobaan ulang yang dibatasi.

Terkait:

- [Pemecahan masalah autentikasi Dashboard](/web/dashboard#if-you-see-unauthorized-1008)
- [Pemecahan masalah Gateway](/gateway/troubleshooting#dashboard-control-ui-connectivity)
