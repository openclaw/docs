---
read_when:
    - Anda sedang menyetujui permintaan pemasangan perangkat
    - Anda perlu merotasi atau mencabut token perangkat
summary: Referensi CLI untuk `openclaw devices` (pemasangan perangkat + rotasi/pencabutan token)
title: Perangkat
x-i18n:
    generated_at: "2026-07-12T14:01:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fb10f7a484fec06bfa5e53ae50181b12a9724746176bbace330ec468235494
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Kelola permintaan pemasangan perangkat dan token yang cakupannya terbatas pada perangkat.

## Opsi umum

- `--url <url>`: URL WebSocket Gateway (secara default menggunakan `gateway.remote.url` jika dikonfigurasi)
- `--token <token>`: Token Gateway (jika diperlukan)
- `--password <password>`: Kata sandi Gateway (autentikasi kata sandi)
- `--timeout <ms>`: Batas waktu RPC
- `--json`: Keluaran JSON (disarankan untuk pembuatan skrip)

<Warning>
Saat Anda menetapkan `--url`, CLI tidak beralih ke kredensial dari konfigurasi atau lingkungan sebagai cadangan. Berikan `--token` atau `--password` secara eksplisit, atau perintah akan mengalami galat.
</Warning>

## Perintah

### `openclaw devices list`

Cantumkan permintaan pemasangan yang tertunda dan perangkat yang telah dipasangkan.

```bash
openclaw devices list
openclaw devices list --json
```

Untuk permintaan tertunda pada perangkat yang sudah dipasangkan, keluaran menampilkan akses yang diminta di samping akses perangkat yang saat ini disetujui, sehingga peningkatan cakupan/peran terlihat dan tidak tampak seperti pemasangan yang hilang.

Nama tampilan perangkat yang dipasangkan menggunakan urutan prioritas berikut: label operator (`operatorLabel` dari `devices rename`), lalu `displayName` klien, lalu `clientId`, kemudian `deviceId`.

### `openclaw devices approve [requestId] [--latest]`

Setujui permintaan pemasangan yang tertunda berdasarkan `requestId` yang tepat. Menghilangkan `requestId`, atau memberikan `--latest`, hanya menampilkan pratinjau permintaan tertunda terbaru lalu keluar (kode 1); jalankan kembali dengan ID permintaan yang tepat untuk menyetujuinya.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

<Note>
Jika perangkat mencoba kembali pemasangan dengan detail autentikasi yang berubah (peran, cakupan, atau kunci publik), OpenClaw menggantikan entri tertunda sebelumnya dengan `requestId` baru. Jalankan `openclaw devices list` tepat sebelum persetujuan untuk mendapatkan ID saat ini.
</Note>

Perilaku persetujuan:

- Jika perangkat sudah dipasangkan dan meminta cakupan atau peran yang lebih luas, OpenClaw mempertahankan persetujuan yang ada dan membuat permintaan peningkatan baru yang tertunda. Bandingkan `Requested` dengan `Approved` di `openclaw devices list`, atau tampilkan pratinjau dengan `--latest`, sebelum menyetujui.
- Menyetujui peran `node` atau peran nonoperator lainnya memerlukan `operator.admin`. `operator.pairing` cukup untuk persetujuan perangkat operator, tetapi hanya jika cakupan operator yang diminta tetap berada dalam cakupan pemanggil sendiri. Lihat [Cakupan operator](/id/gateway/operator-scopes).
- Jika `gateway.nodes.pairing.autoApproveCidrs` dikonfigurasi, permintaan pertama kali dengan `role: node` dari IP klien yang cocok dapat disetujui secara otomatis sebelum muncul dalam daftar ini. Dinonaktifkan secara default; tidak pernah berlaku untuk klien operator/peramban atau permintaan peningkatan.
- `gateway.nodes.pairing.sshVerify` (aktif secara default) secara otomatis menyetujui permintaan pertama kali dengan `role: node` ketika Gateway memverifikasi kunci perangkat melalui SSH ke hos Node. Karena itu, permintaan dapat berubah menjadi disetujui tidak lama setelah muncul. Tetapkan `sshVerify: false` untuk menonaktifkan verifikasi SSH; pengaturan ini terpisah dari `autoApproveCidrs`, jadi hapus pengaturan tersebut juga agar pemasangan hanya dilakukan secara manual.

### `openclaw devices reject <requestId>`

Tolak permintaan pemasangan perangkat yang tertunda.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices remove <deviceId>`

Hapus satu entri perangkat yang dipasangkan.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

Pemanggil yang diautentikasi dengan token perangkat yang dipasangkan hanya dapat menghapus entri perangkatnya **sendiri**. Menghapus perangkat lain memerlukan `operator.admin`.

### `openclaw devices rename --device <id> --name <label>`

Tetapkan label operator ke perangkat yang dipasangkan. Label merupakan status di sisi pemilik: label tetap bertahan setelah perbaikan pemasangan dan persetujuan ulang peran, serta tidak mengubah `deviceId` yang stabil.

```bash
openclaw devices rename --device <deviceId> --name "Kitchen Mac"
openclaw devices rename --device <deviceId> --name "Kitchen Mac" --json
```

- `--name` wajib diberikan, dipangkas spasi di awal dan akhirnya, tidak boleh kosong, dan dibatasi hingga 64 karakter.
- Permukaan tampilan (daftar CLI, inventaris UI Kontrol) mengutamakan label operator daripada nama tampilan yang dilaporkan klien.
- Pemanggil perangkat terpasang yang bukan admin hanya dapat mengganti nama perangkatnya **sendiri**. Mengganti nama perangkat lain memerlukan `operator.admin`.

### `openclaw devices clear --yes [--pending]`

Hapus perangkat yang dipasangkan secara massal. Memerlukan `--yes`.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

`--pending` juga menolak semua permintaan pemasangan yang tertunda.

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotasi token perangkat untuk suatu peran, dengan opsi memperbarui cakupannya.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

- Peran target harus sudah ada dalam kontrak pemasangan perangkat yang disetujui; rotasi tidak dapat menerbitkan peran baru yang belum disetujui.
- Menghilangkan `--scope` akan menggunakan kembali cakupan yang disetujui dan tersimpan dalam tembolok token pada penyambungan ulang berikutnya. Memberikan nilai `--scope` secara eksplisit akan mengganti kumpulan cakupan tersimpan untuk penyambungan ulang token tembolok pada masa mendatang.
- Pemanggil perangkat terpasang yang bukan admin hanya dapat merotasi token perangkatnya **sendiri**, dan kumpulan cakupan target harus tetap berada dalam cakupan operator milik pemanggil sendiri; rotasi tidak dapat menerbitkan atau mempertahankan token yang cakupannya lebih luas daripada yang sudah dimiliki pemanggil.

Mengembalikan metadata rotasi sebagai JSON. Jika pemanggil merotasi tokennya sendiri saat diautentikasi dengan token perangkat tersebut, respons menyertakan token pengganti agar klien dapat menyimpannya sebelum menyambung kembali. Rotasi bersama/admin tidak pernah menampilkan kembali token pembawa.

### `openclaw devices revoke --device <id> --role <role>`

Cabut token perangkat untuk suatu peran.

```bash
openclaw devices revoke --device <deviceId> --role node
```

Pemanggil perangkat terpasang yang bukan admin hanya dapat mencabut token perangkatnya **sendiri**. Mencabut token perangkat lain memerlukan `operator.admin`. Kumpulan cakupan target juga harus berada dalam cakupan operator milik pemanggil sendiri; pemanggil yang hanya memiliki izin pemasangan tidak dapat mencabut token operator admin/tulis.

## Catatan

- Perintah ini memerlukan cakupan `operator.pairing` (atau `operator.admin`). Peran perangkat nonoperator selalu memerlukan `operator.admin`; lihat [Cakupan operator](/id/gateway/operator-scopes).
- Rotasi dan pencabutan token tetap berada dalam kumpulan peran pemasangan serta batas dasar cakupan yang disetujui untuk perangkat tersebut. Entri token tembolok yang tersesat tidak memberikan target pengelolaan token.
- Untuk sesi token perangkat terpasang, pengelolaan lintas perangkat (`remove`, `rename`, `rotate`, `revoke`) hanya dapat dilakukan terhadap perangkat sendiri kecuali pemanggil memiliki `operator.admin`.
- Rotasi token mengembalikan token baru (sensitif) — perlakukan sebagai rahasia.
- Jika cakupan pemasangan tidak tersedia pada local loopback dan tidak ada `--url` eksplisit yang diberikan, `list`/`approve` dapat beralih ke status pemasangan lokal sebagai cadangan.

## Daftar periksa pemulihan penyimpangan token

Gunakan ini saat UI Kontrol atau klien lain terus gagal dengan `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH`, atau `AUTH_SCOPE_MISMATCH`.

1. Konfirmasikan sumber token Gateway saat ini:

   ```bash
   openclaw config get gateway.auth.token
   ```

2. Cantumkan perangkat yang dipasangkan dan identifikasi ID perangkat yang terdampak:

   ```bash
   openclaw devices list
   ```

3. Rotasi token operator untuk perangkat yang terdampak:

   ```bash
   openclaw devices rotate --device <deviceId> --role operator
   ```

4. Jika rotasi tidak cukup, hapus pemasangan yang kedaluwarsa dan setujui kembali:

   ```bash
   openclaw devices remove <deviceId>
   openclaw devices list
   openclaw devices approve <requestId>
   ```

5. Coba kembali koneksi klien dengan token/kata sandi bersama saat ini.

Catatan:

- Urutan prioritas autentikasi penyambungan ulang normal: token/kata sandi bersama yang eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, kemudian token perangkat tersimpan, lalu token bootstrap.
- Pemulihan `AUTH_TOKEN_MISMATCH` tepercaya dapat mengirim token bersama dan token perangkat tersimpan secara bersamaan untuk satu percobaan ulang terbatas.
- `AUTH_SCOPE_MISMATCH` berarti token perangkat dikenali tetapi tidak membawa kumpulan cakupan yang diminta; perbaiki kontrak persetujuan pemasangan/cakupan sebelum mengubah autentikasi Gateway bersama.

Terkait:

- [Pemecahan masalah autentikasi dasbor](/id/web/dashboard#if-you-see-unauthorized-1008)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Persetujuan penggunaan pertama Paperclip / `openclaw_gateway`

Agen Paperclip yang terhubung melalui adaptor `openclaw_gateway` menjalani persetujuan pemasangan perangkat pada penggunaan pertama yang sama seperti klien baru lainnya. Jika Paperclip melaporkan `openclaw_gateway_pairing_required`, setujui perangkat yang tertunda dan coba kembali.

```bash
openclaw devices approve --latest
```

Pratinjau mencetak perintah `openclaw devices approve <requestId>` yang tepat; verifikasi detailnya, lalu jalankan kembali perintah tersebut dengan ID permintaan untuk menyetujuinya. Untuk Gateway jarak jauh atau kredensial eksplisit, berikan opsi yang sama saat menampilkan pratinjau dan menyetujui:

```bash
openclaw devices approve --latest --url <gateway-ws-url> --token <gateway-token>
```

Agar tidak perlu menyetujui ulang setelah setiap mulai ulang, konfigurasikan `adapterConfig.devicePrivateKeyPem` persisten di Paperclip alih-alih membiarkannya menghasilkan identitas perangkat sementara baru pada setiap eksekusi:

```json
{
  "adapterConfig": {
    "devicePrivateKeyPem": "<ed25519-private-key-pkcs8-pem>"
  }
}
```

Jika persetujuan terus gagal, jalankan `openclaw devices list` terlebih dahulu untuk memastikan adanya permintaan yang tertunda.

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
