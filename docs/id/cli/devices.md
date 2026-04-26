---
read_when:
    - Anda sedang menyetujui permintaan pairing device
    - Anda perlu merotasi atau mencabut token device
summary: Referensi CLI untuk `openclaw devices` (device pairing + rotasi/pencabutan token)
title: Device
x-i18n:
    generated_at: "2026-04-26T11:25:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5746de715f9c1a46b5d0845918c1512723cfed22b711711b8c6dc6e98880f480
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Kelola permintaan pairing device dan token dengan cakupan device.

## Perintah

### `openclaw devices list`

Tampilkan daftar permintaan pairing yang tertunda dan device yang sudah di-pairing.

```
openclaw devices list
openclaw devices list --json
```

Output permintaan tertunda menampilkan akses yang diminta di samping akses
yang saat ini disetujui untuk device tersebut ketika device sudah di-pairing. Ini membuat upgrade
scope/role menjadi eksplisit, alih-alih terlihat seperti pairing hilang.

### `openclaw devices remove <deviceId>`

Hapus satu entri device yang sudah di-pairing.

Saat Anda terautentikasi dengan token device yang sudah di-pairing, pemanggil non-admin
hanya dapat menghapus entri device **milik mereka sendiri**. Menghapus device lain memerlukan
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Hapus device yang sudah di-pairing secara massal.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Setujui permintaan pairing device yang tertunda berdasarkan `requestId` yang tepat. Jika `requestId`
dihilangkan atau `--latest` diberikan, OpenClaw hanya mencetak permintaan tertunda yang dipilih
dan keluar; jalankan ulang persetujuan dengan ID permintaan yang tepat setelah memverifikasi
detailnya.

Catatan: jika sebuah device mencoba pairing lagi dengan detail auth yang berubah (role/scope/public
key), OpenClaw menggantikan entri tertunda sebelumnya dan menerbitkan
`requestId` baru. Jalankan `openclaw devices list` tepat sebelum persetujuan untuk menggunakan
ID saat ini.

Jika device sudah di-pairing dan meminta scope yang lebih luas atau role yang lebih luas,
OpenClaw mempertahankan persetujuan yang ada dan membuat permintaan upgrade tertunda yang baru.
Tinjau kolom `Requested` vs `Approved` dalam `openclaw devices list`
atau gunakan `openclaw devices approve --latest` untuk melihat pratinjau upgrade yang tepat sebelum
menyetujuinya.

Jika Gateway dikonfigurasi secara eksplisit dengan
`gateway.nodes.pairing.autoApproveCidrs`, permintaan `role: node` pertama kali dari
IP klien yang cocok dapat disetujui sebelum muncul di daftar ini. Kebijakan itu
dinonaktifkan secara default dan tidak pernah berlaku untuk klien operator/browser atau permintaan upgrade.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Tolak permintaan pairing device yang tertunda.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotasi token device untuk role tertentu (secara opsional memperbarui scope).
Role target harus sudah ada dalam kontrak pairing yang disetujui untuk device tersebut;
rotasi tidak dapat menerbitkan role baru yang belum disetujui.
Jika Anda menghilangkan `--scope`, koneksi ulang berikutnya dengan token hasil rotasi yang tersimpan akan menggunakan kembali
scope tersetujui yang di-cache oleh token tersebut. Jika Anda memberikan nilai `--scope` secara eksplisit,
nilai tersebut menjadi kumpulan scope tersimpan untuk koneksi ulang token cache di masa mendatang.
Pemanggil non-admin dari device yang sudah di-pairing hanya dapat merotasi token device **milik mereka sendiri**.
Kumpulan scope token target harus tetap berada dalam scope operator sesi pemanggil itu sendiri;
rotasi tidak dapat menerbitkan atau mempertahankan token operator yang lebih luas daripada yang
sudah dimiliki pemanggil.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Mengembalikan payload token baru sebagai JSON.

### `openclaw devices revoke --device <id> --role <role>`

Cabut token device untuk role tertentu.

Pemanggil non-admin dari device yang sudah di-pairing hanya dapat mencabut token device **milik mereka sendiri**.
Mencabut token device lain memerlukan `operator.admin`.
Kumpulan scope token target juga harus sesuai dengan scope operator sesi pemanggil itu sendiri;
pemanggil pairing-only tidak dapat mencabut token operator admin/write.

```
openclaw devices revoke --device <deviceId> --role node
```

Mengembalikan hasil pencabutan sebagai JSON.

## Opsi umum

- `--url <url>`: URL WebSocket Gateway (default ke `gateway.remote.url` jika dikonfigurasi).
- `--token <token>`: token Gateway (jika diperlukan).
- `--password <password>`: password Gateway (auth password).
- `--timeout <ms>`: timeout RPC.
- `--json`: output JSON (disarankan untuk scripting).

Catatan: saat Anda mengatur `--url`, CLI tidak melakukan fallback ke kredensial config atau environment.
Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada adalah error.

## Catatan

- Rotasi token mengembalikan token baru (sensitif). Perlakukan seperti rahasia.
- Perintah ini memerlukan scope `operator.pairing` (atau `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` adalah kebijakan Gateway opsional untuk
  pairing device node baru saja; ini tidak mengubah otoritas persetujuan CLI.
- Rotasi dan pencabutan token tetap berada di dalam kumpulan role pairing yang disetujui dan
  baseline scope yang disetujui untuk device tersebut. Entri token cache menyimpang tidak
  memberikan target pengelolaan token.
- Untuk sesi token device yang sudah di-pairing, pengelolaan lintas-device hanya untuk admin:
  `remove`, `rotate`, dan `revoke` hanya untuk diri sendiri kecuali pemanggil memiliki
  `operator.admin`.
- Mutasi token juga dibatasi oleh scope pemanggil: sesi pairing-only tidak dapat
  merotasi atau mencabut token yang saat ini membawa `operator.admin` atau
  `operator.write`.
- `devices clear` sengaja diproteksi oleh `--yes`.
- Jika scope pairing tidak tersedia pada local loopback (dan tidak ada `--url` eksplisit yang diberikan), list/approve dapat menggunakan fallback pairing lokal.
- `devices approve` memerlukan ID permintaan eksplisit sebelum menerbitkan token; menghilangkan `requestId` atau memberikan `--latest` hanya menampilkan pratinjau permintaan tertunda terbaru.

## Checklist pemulihan token drift

Gunakan ini saat Control UI atau klien lain terus gagal dengan `AUTH_TOKEN_MISMATCH` atau `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Konfirmasi sumber token gateway saat ini:

```bash
openclaw config get gateway.auth.token
```

2. Tampilkan device yang sudah di-pairing dan identifikasi id device yang terdampak:

```bash
openclaw devices list
```

3. Rotasi token operator untuk device yang terdampak:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jika rotasi tidak cukup, hapus pairing basi dan setujui lagi:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Coba lagi koneksi klien dengan token/password bersama yang saat ini berlaku.

Catatan:

- Prioritas auth koneksi ulang normal adalah shared token/password eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token device tersimpan, lalu token bootstrap.
- Pemulihan `AUTH_TOKEN_MISMATCH` tepercaya dapat sementara mengirim shared token dan token device tersimpan secara bersamaan untuk satu percobaan ulang terbatas itu.

Terkait:

- [Pemecahan masalah auth Dashboard](/id/web/dashboard#if-you-see-unauthorized-1008)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
