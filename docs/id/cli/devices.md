---
read_when:
    - Anda sedang menyetujui permintaan penyandingan perangkat
    - Anda perlu merotasi atau mencabut token perangkat
summary: Referensi CLI untuk `openclaw devices` (penyandingan perangkat + rotasi/pencabutan token)
title: Perangkat
x-i18n:
    generated_at: "2026-05-11T20:25:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b38caf47697d5fd6c630285c53919f3a5eaf704b1992e57adb1902e20e2a0fc0
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Kelola permintaan pemasangan perangkat dan token bercakupan perangkat.

## Perintah

### `openclaw devices list`

Cantumkan permintaan pemasangan yang tertunda dan perangkat yang sudah dipasangkan.

```
openclaw devices list
openclaw devices list --json
```

Output permintaan tertunda menampilkan akses yang diminta di samping akses
yang saat ini disetujui untuk perangkat saat perangkat sudah dipasangkan. Ini membuat peningkatan cakupan/peran
menjadi eksplisit, bukan terlihat seolah-olah pemasangan hilang.

### `openclaw devices remove <deviceId>`

Hapus satu entri perangkat yang dipasangkan.

Saat Anda diautentikasi dengan token perangkat yang dipasangkan, pemanggil non-admin hanya dapat
menghapus entri perangkat **miliknya sendiri**. Menghapus perangkat lain memerlukan
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Hapus perangkat yang dipasangkan secara massal.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Setujui permintaan pemasangan perangkat yang tertunda berdasarkan `requestId` yang tepat. Jika `requestId`
dihilangkan atau `--latest` diberikan, OpenClaw hanya mencetak permintaan tertunda
yang dipilih lalu keluar; jalankan ulang persetujuan dengan ID permintaan yang tepat setelah memverifikasi
detailnya.

<Note>
Jika perangkat mencoba ulang pemasangan dengan detail autentikasi yang berubah (peran, cakupan, atau kunci publik), OpenClaw menggantikan entri tertunda sebelumnya dan menerbitkan `requestId` baru. Jalankan `openclaw devices list` tepat sebelum persetujuan untuk menggunakan ID saat ini.
</Note>

Jika perangkat sudah dipasangkan dan meminta cakupan yang lebih luas atau peran yang lebih luas,
OpenClaw mempertahankan persetujuan yang ada dan membuat permintaan peningkatan
tertunda baru. Tinjau kolom `Requested` vs `Approved` di `openclaw devices list`
atau gunakan `openclaw devices approve --latest` untuk melihat pratinjau peningkatan yang tepat sebelum
menyetujuinya.

Jika Gateway dikonfigurasi secara eksplisit dengan
`gateway.nodes.pairing.autoApproveCidrs`, permintaan pertama kali `role: node` dari
IP klien yang cocok dapat disetujui sebelum muncul di daftar ini. Kebijakan itu
dinonaktifkan secara default dan tidak pernah berlaku untuk klien operator/browser atau permintaan
peningkatan.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Tolak permintaan pemasangan perangkat yang tertunda.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotasi token perangkat untuk peran tertentu (opsional memperbarui cakupan).
Peran target harus sudah ada dalam kontrak pemasangan yang disetujui untuk perangkat tersebut;
rotasi tidak dapat menerbitkan peran baru yang belum disetujui.
Jika Anda menghilangkan `--scope`, koneksi ulang berikutnya dengan token rotasi tersimpan akan menggunakan kembali
cakupan yang disetujui dan tersimpan dalam cache milik token tersebut. Jika Anda meneruskan nilai `--scope` eksplisit, nilai tersebut
menjadi kumpulan cakupan tersimpan untuk koneksi ulang token dalam cache pada masa mendatang.
Pemanggil perangkat-terpasang non-admin hanya dapat merotasi token perangkat **miliknya sendiri**.
Kumpulan cakupan token target harus tetap berada dalam cakupan operator milik sesi
pemanggil sendiri; rotasi tidak dapat menerbitkan atau mempertahankan token operator yang lebih luas daripada yang
sudah dimiliki pemanggil.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Mengembalikan metadata rotasi sebagai JSON. Jika pemanggil merotasi tokennya sendiri saat
diautentikasi dengan token perangkat tersebut, respons juga menyertakan token
pengganti agar klien dapat menyimpannya sebelum menyambungkan ulang. Rotasi bersama/admin
tidak menampilkan kembali token bearer.

### `openclaw devices revoke --device <id> --role <role>`

Cabut token perangkat untuk peran tertentu.

Pemanggil perangkat-terpasang non-admin hanya dapat mencabut token perangkat **miliknya sendiri**.
Mencabut token perangkat lain memerlukan `operator.admin`.
Kumpulan cakupan token target juga harus sesuai dengan cakupan
operator milik sesi pemanggil sendiri; pemanggil khusus pemasangan tidak dapat mencabut token operator admin/write.

```
openclaw devices revoke --device <deviceId> --role node
```

Mengembalikan hasil pencabutan sebagai JSON.

## Opsi umum

- `--url <url>`: URL WebSocket Gateway (default ke `gateway.remote.url` saat dikonfigurasi).
- `--token <token>`: Token Gateway (jika diperlukan).
- `--password <password>`: Kata sandi Gateway (autentikasi kata sandi).
- `--timeout <ms>`: Batas waktu RPC.
- `--json`: Output JSON (direkomendasikan untuk scripting).

<Warning>
Saat Anda menetapkan `--url`, CLI tidak fallback ke kredensial konfigurasi atau lingkungan. Teruskan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.
</Warning>

## Catatan

- Rotasi token mengembalikan token baru (sensitif). Perlakukan seperti rahasia.
- Perintah ini memerlukan cakupan `operator.pairing` (atau `operator.admin`). Beberapa
  persetujuan juga mengharuskan pemanggil memiliki cakupan operator yang akan diterbitkan atau diwarisi oleh
  perangkat target; lihat [Cakupan operator](/id/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` adalah kebijakan Gateway opt-in hanya untuk
  pemasangan perangkat node baru; ini tidak mengubah otoritas persetujuan CLI.
- Rotasi dan pencabutan token tetap berada dalam kumpulan peran pemasangan yang disetujui dan
  baseline cakupan yang disetujui untuk perangkat tersebut. Entri token cache yang tersesat tidak
  memberikan target manajemen token.
- Untuk sesi token perangkat yang dipasangkan, manajemen lintas perangkat hanya untuk admin:
  `remove`, `rotate`, dan `revoke` hanya untuk diri sendiri kecuali pemanggil memiliki
  `operator.admin`.
- Mutasi token juga dibatasi cakupan pemanggil: sesi khusus pemasangan tidak dapat
  merotasi atau mencabut token yang saat ini membawa `operator.admin` atau
  `operator.write`.
- `devices clear` sengaja dibatasi oleh `--yes`.
- Jika cakupan pemasangan tidak tersedia pada local loopback (dan tidak ada `--url` eksplisit yang diteruskan), list/approve dapat menggunakan fallback pemasangan lokal.
- `devices approve` memerlukan ID permintaan eksplisit sebelum menerbitkan token; menghilangkan `requestId` atau meneruskan `--latest` hanya menampilkan pratinjau permintaan tertunda terbaru.

## Checklist pemulihan drift token

Gunakan ini saat Control UI atau klien lain terus gagal dengan `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH`, atau `AUTH_SCOPE_MISMATCH`.

1. Konfirmasi sumber token gateway saat ini:

```bash
openclaw config get gateway.auth.token
```

2. Cantumkan perangkat yang dipasangkan dan identifikasi id perangkat yang terdampak:

```bash
openclaw devices list
```

3. Rotasi token operator untuk perangkat yang terdampak:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jika rotasi tidak cukup, hapus pemasangan basi dan setujui lagi:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Coba lagi koneksi klien dengan token/kata sandi bersama saat ini.

Catatan:

- Prioritas autentikasi koneksi ulang normal adalah token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
- Pemulihan `AUTH_TOKEN_MISMATCH` tepercaya dapat sementara mengirim token bersama dan token perangkat tersimpan sekaligus untuk satu percobaan ulang terbatas.
- `AUTH_SCOPE_MISMATCH` berarti token perangkat dikenali tetapi tidak membawa kumpulan cakupan yang diminta; perbaiki kontrak persetujuan pemasangan/cakupan sebelum mengubah autentikasi gateway bersama.

Terkait:

- [Pemecahan masalah autentikasi dashboard](/id/web/dashboard#if-you-see-unauthorized-1008)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
