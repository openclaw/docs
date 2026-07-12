---
read_when:
    - Anda ingin memasangkan aplikasi Node seluler dengan Gateway dengan cepat
    - Anda memerlukan keluaran kode penyiapan untuk dibagikan secara jarak jauh/manual
summary: Referensi CLI untuk `openclaw qr` (membuat QR pemasangan perangkat seluler + kode penyiapan)
title: QR
x-i18n:
    generated_at: "2026-07-12T14:02:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Buat QR pemasangan perangkat seluler dan kode penyiapan dari konfigurasi Gateway Anda saat ini.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

Aplikasi resmi OpenClaw untuk iOS dan Android terhubung secara otomatis ketika metadata kode penyiapannya cocok. Jika permintaan tetap tertunda (misalnya, untuk klien tidak resmi atau metadata yang tidak cocok), tinjau dan setujui permintaan tersebut:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opsi

- `--remote`: utamakan `gateway.remote.url`; beralih ke `gateway.tailscale.mode=serve|funnel` jika URL tersebut belum ditetapkan. Mengabaikan `publicUrl` dari Plugin `device-pair`.
- `--url <url>`: timpa URL gateway yang digunakan dalam muatan
- `--public-url <url>`: timpa URL publik yang digunakan dalam muatan
- `--token <token>`: timpa token gateway yang digunakan oleh alur bootstrap untuk autentikasi
- `--password <password>`: timpa kata sandi gateway yang digunakan oleh alur bootstrap untuk autentikasi
- `--setup-code-only`: cetak hanya kode penyiapan
- `--no-ascii`: lewati perenderan QR ASCII
- `--json`: keluarkan JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` opsional, `auth`, `urlSource`)

`--token` dan `--password` tidak dapat digunakan bersamaan.

## Isi kode penyiapan

Kode penyiapan membawa `bootstrapToken` buram dan berumur pendek, bukan token/kata sandi gateway bersama. Alur bootstrap bawaan menerbitkan:

- token `node` utama dengan `scopes: []`
- token serah-terima `operator` terbatas yang hanya mencakup `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`

Cakupan mutasi pemasangan dan `operator.admin` tetap memerlukan alur pemasangan operator atau token terpisah yang telah disetujui.

## Resolusi URL Gateway

Pemasangan perangkat seluler gagal secara aman untuk URL gateway `ws://` Tailscale/publik: gunakan Tailscale Serve/Funnel atau URL gateway `wss://` untuk kasus tersebut. Alamat LAN privat dan host Bonjour `.local` tetap didukung melalui `ws://` biasa.

Ketika URL Gateway yang dipilih berasal dari `gateway.bind=lan`, OpenClaw juga memeriksa rute persisten dari `tailscale serve status --json`. Setiap akar Serve HTTPS yang memproksikan porta loopback Gateway aktif disertakan sebagai cadangan. Perintah QR menambahkan cadangan ini hanya untuk `lan`; `custom` dan `tailnet` mempertahankan rute yang diiklankan secara eksplisit. Klien iOS saat ini mencoba rute yang diiklankan secara berurutan dan menyimpan rute pertama yang dapat dijangkau; kolom lama `url` tetap tidak berubah untuk klien versi lama.

Dengan `--remote`, salah satu dari `gateway.remote.url` atau `gateway.tailscale.mode=serve|funnel` wajib tersedia.

## Resolusi autentikasi (tanpa `--remote`)

Ketika tidak ada penggantian autentikasi CLI yang diteruskan, SecretRef autentikasi gateway lokal diresolusi sebagai berikut:

| Kondisi                                                                                                                      | Diresolusi menjadi                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `gateway.auth.mode="token"`, atau mode yang disimpulkan tanpa sumber kata sandi yang menang                                  | `gateway.auth.token`                       |
| `gateway.auth.mode="password"`, atau mode yang disimpulkan tanpa token yang menang dari autentikasi/variabel lingkungan       | `gateway.auth.password`                    |
| `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRef) dan `gateway.auth.mode` kosong | gagal; tetapkan `gateway.auth.mode` secara eksplisit |

## Resolusi autentikasi (`--remote`)

Jika kredensial jarak jauh yang aktif secara efektif dikonfigurasi sebagai SecretRef dan baik `--token` maupun `--password` tidak diteruskan, perintah akan meresolusinya dari snapshot gateway aktif. Jika gateway tidak tersedia, perintah akan langsung gagal.

<Note>
Jalur perintah ini memerlukan gateway yang mendukung metode RPC `secrets.resolve`. Gateway versi lama mengembalikan galat metode tidak dikenal.
</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Perangkat](/id/cli/devices)
- [Pemasangan](/id/cli/pairing)
