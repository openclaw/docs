---
read_when:
    - Anda sedang menyetujui permintaan penyandingan perangkat
    - Anda perlu merotasi atau mencabut token perangkat
summary: Referensi CLI untuk `openclaw devices` (penyandingan perangkat + rotasi/pencabutan token)
title: Perangkat
x-i18n:
    generated_at: "2026-05-03T09:15:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa92fd3ffc671c827fa98870bf9df89f3be90adec167fd8ea32698cf2e69991a
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Kelola permintaan penyandingan perangkat dan token yang dibatasi cakupan perangkat.

## Perintah

### `openclaw devices list`

Cantumkan permintaan penyandingan tertunda dan perangkat yang telah disandingkan.

```
openclaw devices list
openclaw devices list --json
```

Output permintaan tertunda menampilkan akses yang diminta di samping akses
yang saat ini disetujui untuk perangkat ketika perangkat sudah disandingkan.
Ini membuat peningkatan cakupan/peran eksplisit alih-alih tampak seperti
penyandingan hilang.

### `openclaw devices remove <deviceId>`

Hapus satu entri perangkat yang telah disandingkan.

Ketika Anda diautentikasi dengan token perangkat yang telah disandingkan,
pemanggil non-admin hanya dapat menghapus entri perangkat **miliknya sendiri**.
Menghapus perangkat lain memerlukan `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Hapus perangkat yang telah disandingkan secara massal.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Setujui permintaan penyandingan perangkat yang tertunda berdasarkan `requestId`
yang tepat. Jika `requestId` dihilangkan atau `--latest` diberikan, OpenClaw
hanya mencetak permintaan tertunda yang dipilih lalu keluar; jalankan ulang
persetujuan dengan ID permintaan yang tepat setelah memverifikasi detailnya.

<Note>
Jika sebuah perangkat mencoba ulang penyandingan dengan detail autentikasi yang berubah (peran, cakupan, atau kunci publik), OpenClaw menggantikan entri tertunda sebelumnya dan menerbitkan `requestId` baru. Jalankan `openclaw devices list` tepat sebelum persetujuan untuk menggunakan ID saat ini.
</Note>

Jika perangkat sudah disandingkan dan meminta cakupan yang lebih luas atau
peran yang lebih luas, OpenClaw mempertahankan persetujuan yang ada dan membuat
permintaan peningkatan tertunda baru. Tinjau kolom `Requested` vs `Approved` di
`openclaw devices list` atau gunakan `openclaw devices approve --latest` untuk
mempratinjau peningkatan yang tepat sebelum menyetujuinya.

Jika Gateway dikonfigurasi secara eksplisit dengan
`gateway.nodes.pairing.autoApproveCidrs`, permintaan pertama kali `role: node`
dari IP klien yang cocok dapat disetujui sebelum muncul dalam daftar ini.
Kebijakan tersebut dinonaktifkan secara default dan tidak pernah berlaku untuk
klien operator/browser atau permintaan peningkatan.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Tolak permintaan penyandingan perangkat yang tertunda.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotasi token perangkat untuk peran tertentu (opsional memperbarui cakupan).
Peran target harus sudah ada dalam kontrak penyandingan yang disetujui untuk
perangkat tersebut; rotasi tidak dapat membuat peran baru yang belum disetujui.
Jika Anda menghilangkan `--scope`, koneksi ulang berikutnya dengan token rotasi
yang tersimpan akan menggunakan ulang cakupan yang disetujui yang tersimpan
dalam cache token tersebut. Jika Anda memberikan nilai `--scope` eksplisit,
nilai tersebut menjadi kumpulan cakupan tersimpan untuk koneksi ulang
cached-token di masa depan. Pemanggil perangkat tersanding non-admin hanya
dapat merotasi token perangkat **miliknya sendiri**. Kumpulan cakupan token
target harus tetap berada dalam cakupan operator milik sesi pemanggil sendiri;
rotasi tidak dapat membuat atau mempertahankan token operator yang lebih luas
daripada yang sudah dimiliki pemanggil.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Mengembalikan metadata rotasi sebagai JSON. Jika pemanggil merotasi tokennya
sendiri saat diautentikasi dengan token perangkat tersebut, respons juga
menyertakan token pengganti agar klien dapat menyimpannya sebelum menyambung
ulang. Rotasi bersama/admin tidak menggemakan token bearer.

### `openclaw devices revoke --device <id> --role <role>`

Cabut token perangkat untuk peran tertentu.

Pemanggil perangkat tersanding non-admin hanya dapat mencabut token perangkat
**miliknya sendiri**. Mencabut token perangkat lain memerlukan `operator.admin`.
Kumpulan cakupan token target juga harus sesuai dengan cakupan operator milik
sesi pemanggil sendiri; pemanggil yang hanya memiliki penyandingan tidak dapat
mencabut token operator admin/write.

```
openclaw devices revoke --device <deviceId> --role node
```

Mengembalikan hasil pencabutan sebagai JSON.

## Opsi umum

- `--url <url>`: URL WebSocket Gateway (default ke `gateway.remote.url` saat dikonfigurasi).
- `--token <token>`: Token Gateway (jika diperlukan).
- `--password <password>`: Kata sandi Gateway (autentikasi kata sandi).
- `--timeout <ms>`: Waktu habis RPC.
- `--json`: Output JSON (disarankan untuk skrip).

<Warning>
Saat Anda mengatur `--url`, CLI tidak kembali menggunakan kredensial konfigurasi atau lingkungan. Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah kesalahan.
</Warning>

## Catatan

- Rotasi token mengembalikan token baru (sensitif). Perlakukan seperti rahasia.
- Perintah ini memerlukan cakupan `operator.pairing` (atau `operator.admin`). Beberapa
  persetujuan juga mengharuskan pemanggil memiliki cakupan operator yang akan
  dibuat atau diwarisi oleh perangkat target; lihat [Cakupan operator](/id/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` adalah kebijakan Gateway opsional untuk
  penyandingan perangkat node baru saja; ini tidak mengubah otoritas persetujuan CLI.
- Rotasi dan pencabutan token tetap berada dalam kumpulan peran penyandingan
  yang disetujui dan baseline cakupan yang disetujui untuk perangkat tersebut.
  Entri token cache yang menyimpang tidak memberikan target manajemen token.
- Untuk sesi token perangkat tersanding, manajemen lintas perangkat hanya untuk admin:
  `remove`, `rotate`, dan `revoke` hanya untuk diri sendiri kecuali pemanggil memiliki
  `operator.admin`.
- Mutasi token juga dibatasi oleh cakupan pemanggil: sesi yang hanya memiliki
  penyandingan tidak dapat merotasi atau mencabut token yang saat ini membawa
  `operator.admin` atau `operator.write`.
- `devices clear` sengaja dibatasi dengan `--yes`.
- Jika cakupan penyandingan tidak tersedia pada local loopback (dan tidak ada `--url` eksplisit yang diberikan), list/approve dapat menggunakan fallback penyandingan lokal.
- `devices approve` memerlukan ID permintaan eksplisit sebelum membuat token; menghilangkan `requestId` atau memberikan `--latest` hanya mempratinjau permintaan tertunda terbaru.

## Daftar periksa pemulihan drift token

Gunakan ini saat Control UI atau klien lain terus gagal dengan `AUTH_TOKEN_MISMATCH` atau `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Konfirmasi sumber token gateway saat ini:

```bash
openclaw config get gateway.auth.token
```

2. Cantumkan perangkat yang telah disandingkan dan identifikasi id perangkat yang terdampak:

```bash
openclaw devices list
```

3. Rotasi token operator untuk perangkat yang terdampak:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jika rotasi belum cukup, hapus penyandingan usang dan setujui lagi:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Coba ulang koneksi klien dengan token/kata sandi bersama saat ini.

Catatan:

- Prioritas autentikasi koneksi ulang normal adalah token/kata sandi bersama eksplisit terlebih dahulu, lalu `deviceToken` eksplisit, lalu token perangkat tersimpan, lalu token bootstrap.
- Pemulihan `AUTH_TOKEN_MISMATCH` tepercaya dapat sementara mengirim token bersama dan token perangkat tersimpan secara bersamaan untuk satu percobaan ulang terbatas.

Terkait:

- [Pemecahan masalah autentikasi dashboard](/id/web/dashboard#if-you-see-unauthorized-1008)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Terkait

- [Referensi CLI](/id/cli)
- [Node](/id/nodes)
