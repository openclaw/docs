---
read_when:
    - Anda ingin memasangkan aplikasi node seluler dengan Gateway secara cepat
    - Anda memerlukan output kode penyiapan untuk dibagikan secara jarak jauh/manual
summary: Referensi CLI untuk `openclaw qr` (menghasilkan QR penyandingan perangkat seluler + kode penyiapan)
title: QR
x-i18n:
    generated_at: "2026-07-16T18:02:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Buat QR penyambungan seluler dan kode penyiapan dari konfigurasi Gateway Anda saat ini.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

Aplikasi resmi OpenClaw untuk iOS dan Android terhubung secara otomatis ketika metadata
kode penyiapannya cocok. Jika permintaan tetap tertunda (misalnya, untuk
klien tidak resmi atau metadata yang tidak cocok), tinjau dan setujui permintaan tersebut:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opsi

- `--remote`: utamakan `gateway.remote.url`; gunakan `gateway.tailscale.mode=serve|funnel` sebagai cadangan jika URL tersebut belum ditetapkan. Mengabaikan Plugin `device-pair` `publicUrl`.
- `--url <url>`: timpa URL gateway yang digunakan dalam payload
- `--public-url <url>`: timpa URL publik yang digunakan dalam payload
- `--token <token>`: timpa token gateway yang digunakan alur bootstrap untuk autentikasi
- `--password <password>`: timpa kata sandi gateway yang digunakan alur bootstrap untuk autentikasi
- `--limited`: hilangkan akses administratif Gateway dari token operator yang diserahkan
- `--setup-code-only`: cetak hanya kode penyiapan
- `--no-ascii`: lewati perenderan QR ASCII
- `--json`: keluarkan JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` opsional, `auth`, `access`, `accessDowngraded` opsional, `urlSource`)

`--token` dan `--password` tidak dapat digunakan bersamaan.

## Isi kode penyiapan

Kode penyiapan membawa `bootstrapToken` buram yang berumur pendek, bukan token/kata sandi gateway bersama. Untuk endpoint `wss://` (atau loopback pada host yang sama), alur bootstrap default menerbitkan:

- token `node` utama dengan `scopes: []`
- token penyerahan `operator` seluler native lengkap dengan `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`

Gunakan `--limited` untuk mempertahankan token node yang sama sekaligus menghilangkan `operator.admin` dari penyerahan operator. Cakupan mutasi penyambungan tidak pernah diserahkan melalui kode penyiapan.

Penyiapan `ws://` LAN teks biasa tetap tersedia, tetapi OpenClaw secara otomatis menggunakan
profil terbatas karena pengamat jaringan dapat menangkap dan mendahului penggunaan token
bootstrap bearer. Konfigurasikan `wss://` atau Tailscale Serve, lalu buat kode baru
untuk mendapatkan akses penuh.

## Resolusi URL Gateway

Penyambungan seluler menolak secara aman URL gateway `ws://` Tailscale/publik: gunakan Tailscale Serve/Funnel atau URL gateway `wss://` untuk URL tersebut. Alamat LAN privat dan host Bonjour `.local` tetap didukung melalui `ws://` teks biasa, dengan akses operator terbatas seperti dijelaskan di atas.

Ketika URL Gateway yang dipilih berasal dari `gateway.bind=lan`, OpenClaw juga memeriksa rute `tailscale serve status --json` persisten. Setiap root HTTPS Serve yang memproksikan port loopback Gateway aktif disertakan sebagai cadangan. Perintah QR menambahkan cadangan ini hanya untuk `lan`; `custom` dan `tailnet` mempertahankan rute yang diiklankan secara eksplisit. Klien iOS saat ini mencoba rute yang diiklankan secara berurutan dan menyimpan rute pertama yang dapat dijangkau; bidang lama `url` tetap tidak berubah untuk klien versi lama.

Dengan `--remote`, salah satu dari `gateway.remote.url` atau `gateway.tailscale.mode=serve|funnel` wajib diberikan.

## Resolusi autentikasi (tanpa `--remote`)

Jika tidak ada penggantian autentikasi CLI yang diteruskan, SecretRef autentikasi gateway lokal diselesaikan sebagai berikut:

| Kondisi                                                                                                                      | Diselesaikan menjadi                       |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `gateway.auth.mode="token"`, atau mode yang disimpulkan tanpa sumber kata sandi yang menang                                           | `gateway.auth.token`                         |
| `gateway.auth.mode="password"`, atau mode yang disimpulkan tanpa token yang menang dari autentikasi/env                                   | `gateway.auth.password`                         |
| `gateway.auth.token` dan `gateway.auth.password` dikonfigurasi (termasuk SecretRef) dan `gateway.auth.mode` belum ditetapkan          | gagal; tetapkan `gateway.auth.mode` secara eksplisit |

## Resolusi autentikasi (`--remote`)

Jika kredensial jarak jauh yang secara efektif aktif dikonfigurasi sebagai SecretRef dan baik `--token` maupun `--password` tidak diteruskan, perintah menyelesaikannya dari snapshot gateway aktif. Jika gateway tidak tersedia, perintah langsung gagal.

<Note>
Jalur perintah ini memerlukan gateway yang mendukung metode RPC `secrets.resolve`. Gateway versi lama mengembalikan galat metode tidak dikenal.
</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Perangkat](/id/cli/devices)
- [Penyambungan](/id/cli/pairing)
