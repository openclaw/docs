---
read_when:
    - Anda menyetujui permintaan pemasangan perangkat
    - Anda perlu merotasi atau mencabut token perangkat
summary: Referensi CLI untuk `openclaw devices` (pemasangan perangkat + rotasi/pencabutan token)
title: Perangkat
x-i18n:
    generated_at: "2026-06-27T17:18:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08d6945af4fa2403a97dfec94af7bbd0dc746efe90d3e5b4c9f5c5d6d27d70a4
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Kelola permintaan pemasangan perangkat dan token dengan cakupan perangkat.

## Perintah

### `openclaw devices list`

Cantumkan permintaan pemasangan yang tertunda dan perangkat yang sudah dipasangkan.

```
openclaw devices list
openclaw devices list --json
```

Output permintaan tertunda menampilkan akses yang diminta di samping akses yang
saat ini disetujui untuk perangkat ketika perangkat sudah dipasangkan. Ini membuat
peningkatan cakupan/peran eksplisit, alih-alih terlihat seperti pemasangannya hilang.

### `openclaw devices remove <deviceId>`

Hapus satu entri perangkat yang sudah dipasangkan.

Ketika Anda diautentikasi dengan token perangkat yang sudah dipasangkan, pemanggil non-admin hanya dapat
menghapus entri perangkat **miliknya sendiri**. Menghapus perangkat lain memerlukan
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

Setujui permintaan pemasangan perangkat yang tertunda berdasarkan `requestId` yang tepat. Jika `requestId`
dihilangkan atau `--latest` diteruskan, OpenClaw hanya mencetak permintaan tertunda
yang dipilih lalu keluar; jalankan ulang persetujuan dengan ID permintaan yang tepat setelah memverifikasi
detailnya.

<Note>
Jika perangkat mencoba memasangkan ulang dengan detail auth yang berubah (peran, cakupan, atau kunci publik), OpenClaw menggantikan entri tertunda sebelumnya dan menerbitkan `requestId` baru. Jalankan `openclaw devices list` tepat sebelum persetujuan untuk menggunakan ID saat ini.
</Note>

Jika perangkat sudah dipasangkan dan meminta cakupan atau peran yang lebih luas,
OpenClaw mempertahankan persetujuan yang ada dan membuat permintaan peningkatan
tertunda baru. Tinjau kolom `Requested` vs `Approved` di `openclaw devices list`
atau gunakan `openclaw devices approve --latest` untuk mempratinjau peningkatan yang tepat sebelum
menyetujuinya.

Jika Gateway dikonfigurasi secara eksplisit dengan
`gateway.nodes.pairing.autoApproveCidrs`, permintaan `role: node` pertama kali dari
IP klien yang cocok dapat disetujui sebelum muncul di daftar ini. Kebijakan itu
dinonaktifkan secara default dan tidak pernah berlaku untuk klien operator/browser atau permintaan
peningkatan.

Menyetujui peran perangkat node atau peran perangkat non-operator lainnya memerlukan `operator.admin`.
`operator.pairing` cukup untuk persetujuan perangkat operator hanya ketika
cakupan operator yang diminta tetap berada dalam cakupan milik pemanggil sendiri. Lihat
[Cakupan operator](/id/gateway/operator-scopes) untuk pemeriksaan saat persetujuan.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

## Persetujuan pertama kali Paperclip / `openclaw_gateway`

Ketika agen Paperclip baru terhubung melalui adapter `openclaw_gateway` untuk pertama kalinya, Gateway mungkin memerlukan persetujuan pemasangan perangkat satu kali sebelum run dapat berhasil. Jika Paperclip melaporkan `openclaw_gateway_pairing_required`, setujui perangkat yang tertunda dan coba lagi.

Untuk gateway lokal, pratinjau permintaan tertunda terbaru:

```bash
openclaw devices approve --latest
```

Pratinjau mencetak perintah `openclaw devices approve <requestId>` yang tepat. Verifikasi detail permintaan, lalu jalankan ulang perintah itu dengan ID permintaan untuk menyetujuinya.

Untuk gateway jarak jauh atau kredensial eksplisit, teruskan opsi yang sama saat mempratinjau dan menyetujui:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Untuk menghindari persetujuan ulang setelah restart, simpan kunci perangkat persisten dalam konfigurasi adapter Paperclip alih-alih membuat identitas sementara baru pada setiap run:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Jika persetujuan terus gagal, jalankan `openclaw devices list` terlebih dahulu untuk mengonfirmasi bahwa permintaan tertunda ada.

### `openclaw devices reject <requestId>`

Tolak permintaan pemasangan perangkat yang tertunda.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotasikan token perangkat untuk peran tertentu (secara opsional memperbarui cakupan).
Peran target harus sudah ada dalam kontrak pemasangan yang disetujui milik perangkat itu;
rotasi tidak dapat menerbitkan peran baru yang belum disetujui.
Jika Anda menghilangkan `--scope`, koneksi ulang berikutnya dengan token terotasi yang tersimpan akan menggunakan kembali
cakupan yang disetujui dan tersimpan dalam cache untuk token itu. Jika Anda meneruskan nilai `--scope` eksplisit, nilai tersebut
menjadi set cakupan tersimpan untuk koneksi ulang token-cache pada masa mendatang.
Pemanggil perangkat-terpasang non-admin hanya dapat merotasi token perangkat **miliknya sendiri**.
Set cakupan token target harus tetap berada dalam cakupan operator milik sesi pemanggil
sendiri; rotasi tidak dapat menerbitkan atau mempertahankan token operator yang lebih luas daripada yang
sudah dimiliki pemanggil.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Mengembalikan metadata rotasi sebagai JSON. Jika pemanggil merotasi tokennya sendiri saat
diautentikasi dengan token perangkat itu, respons juga menyertakan token pengganti
agar klien dapat menyimpannya sebelum terhubung ulang. Rotasi bersama/admin
tidak menggemakan bearer token.

### `openclaw devices revoke --device <id> --role <role>`

Cabut token perangkat untuk peran tertentu.

Pemanggil perangkat-terpasang non-admin hanya dapat mencabut token perangkat **miliknya sendiri**.
Mencabut token perangkat lain memerlukan `operator.admin`.
Set cakupan token target juga harus sesuai dalam cakupan operator milik sesi pemanggil
sendiri; pemanggil khusus pemasangan tidak dapat mencabut token operator admin/write.

```
openclaw devices revoke --device <deviceId> --role node
```

Mengembalikan hasil pencabutan sebagai JSON.

## Opsi umum

- `--url <url>`: URL WebSocket Gateway (default ke `gateway.remote.url` saat dikonfigurasi).
- `--token <token>`: Token Gateway (jika diperlukan).
- `--password <password>`: Kata sandi Gateway (auth kata sandi).
- `--timeout <ms>`: Timeout RPC.
- `--json`: Output JSON (direkomendasikan untuk scripting).

<Warning>
Ketika Anda menetapkan `--url`, CLI tidak fallback ke kredensial konfigurasi atau lingkungan. Teruskan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah kesalahan.
</Warning>

## Catatan

- Rotasi token mengembalikan token baru (sensitif). Perlakukan seperti rahasia.
- Perintah ini memerlukan cakupan `operator.pairing` (atau `operator.admin`). Beberapa
  persetujuan juga mengharuskan pemanggil memiliki cakupan operator yang akan diterbitkan
  atau diwarisi oleh perangkat target. Peran perangkat non-operator memerlukan
  `operator.admin`; lihat [Cakupan operator](/id/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` adalah kebijakan Gateway opt-in untuk
  pemasangan perangkat node baru saja; ini tidak mengubah otoritas persetujuan CLI.
- Rotasi dan pencabutan token tetap berada dalam set peran pemasangan yang disetujui dan
  baseline cakupan yang disetujui untuk perangkat itu. Entri token cache yang menyimpang tidak
  memberikan target manajemen token.
- Untuk sesi token perangkat-terpasang, manajemen lintas perangkat hanya untuk admin:
  `remove`, `rotate`, dan `revoke` hanya untuk diri sendiri kecuali pemanggil memiliki
  `operator.admin`.
- Mutasi token juga dibatasi cakupan pemanggil: sesi khusus pemasangan tidak dapat
  merotasi atau mencabut token yang saat ini membawa `operator.admin` atau
  `operator.write`.
- `devices clear` sengaja dijaga oleh `--yes`.
- Jika cakupan pemasangan tidak tersedia di local loopback (dan tidak ada `--url` eksplisit yang diteruskan), list/approve dapat menggunakan fallback pemasangan lokal.
- `devices approve` memerlukan ID permintaan eksplisit sebelum menerbitkan token; menghilangkan `requestId` atau meneruskan `--latest` hanya mempratinjau permintaan tertunda terbaru.

## Checklist pemulihan drift token

Gunakan ini ketika Control UI atau klien lain terus gagal dengan `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH`, atau `AUTH_SCOPE_MISMATCH`.

1. Konfirmasi sumber token gateway saat ini:

```bash
openclaw config get gateway.auth.token
```

2. Cantumkan perangkat yang dipasangkan dan identifikasi id perangkat yang terdampak:

```bash
openclaw devices list
```

3. Rotasikan token operator untuk perangkat yang terdampak:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jika rotasi tidak cukup, hapus pemasangan usang dan setujui lagi:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Coba lagi koneksi klien dengan token/kata sandi bersama saat ini.

Catatan:

- Prioritas auth koneksi ulang normal adalah token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
- Pemulihan `AUTH_TOKEN_MISMATCH` tepercaya dapat sementara mengirim token bersama dan token perangkat tersimpan bersamaan untuk satu percobaan ulang terbatas.
- `AUTH_SCOPE_MISMATCH` berarti token perangkat dikenali tetapi tidak membawa set cakupan yang diminta; perbaiki kontrak persetujuan pemasangan/cakupan sebelum mengubah auth gateway bersama.

Terkait:

- [Pemecahan masalah auth Dashboard](/id/web/dashboard#if-you-see-unauthorized-1008)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
