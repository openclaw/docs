---
read_when:
    - Anda ingin membuka UI Kontrol dengan token Anda saat ini
    - Anda ingin mencetak URL tanpa membuka browser
summary: Referensi CLI untuk `openclaw dashboard` (membuka UI Kontrol)
title: Dasbor
x-i18n:
    generated_at: "2026-07-16T17:54:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Buka UI Kontrol menggunakan autentikasi Anda saat ini.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`: cetak URL tetapi jangan membuka peramban.
- `--json`: cetak satu objek koneksi yang dapat dibaca mesin tanpa membuka peramban, menggunakan papan klip, menampilkan perintah interaktif, atau memulai Gateway.
- `--yes`: mulai/instal Gateway tanpa menampilkan perintah interaktif saat diperlukan.

## Keluaran yang dapat dibaca mesin

Gunakan `--json` untuk integrasi desktop dan skrip yang memerlukan URL UI Kontrol yang telah ditentukan:

```bash
openclaw dashboard --json
```

Respons mencakup `url`, `httpUrl`, `wsUrl`, `port`, dan `tokenIncluded`. Jika Gateway belum siap, perintah akan mengembalikan `{"ok":false,"reason":"..."}` dan keluar dengan kode bukan nol. Token yang dikelola SecretRef tidak pernah disertakan dalam `url`.

Catatan:

- Menentukan SecretRef `gateway.auth.token` yang dikonfigurasi jika memungkinkan.
- Mengikuti `gateway.tls.enabled`: Gateway yang mengaktifkan TLS mencetak/membuka URL UI Kontrol `https://` dan terhubung melalui `wss://`.
- Untuk ikatan `lan` atau `custom` wildcard, peluncuran pada host yang sama selalu menggunakan loopback karena wildcard bukan tujuan peramban. Ikatan teks biasa `tailnet` dan `custom` juga menggunakan `127.0.0.1` agar peramban memiliki konteks aman; host tertentu yang mengaktifkan TLS mempertahankan alamat yang dikonfigurasi agar nama sertifikat cocok.
- Sebelum memberikan URL loopback terautentikasi untuk ikatan antarmuka tertentu, perintah memeriksa antarmuka yang dikonfigurasi dan memverifikasi bahwa antarmuka tersebut serta `127.0.0.1` dimiliki oleh proses Gateway yang sama. Kepemilikan listener yang ambigu akan gagal secara tertutup dengan panduan status.
- Untuk token yang dikelola SecretRef (baik berhasil maupun gagal ditentukan), URL yang dicetak/disalin/dibuka tidak pernah menyertakan token, sehingga rahasia eksternal tidak bocor ke keluaran terminal, riwayat papan klip, atau argumen peluncuran peramban.
- Jika `gateway.auth.token` dikelola SecretRef tetapi gagal ditentukan, perintah mencetak URL tanpa token dan panduan pemulihan alih-alih placeholder token yang tidak valid.
- Jika pengiriman melalui papan klip/peramban gagal untuk URL yang diautentikasi dengan token, perintah mencatat petunjuk autentikasi manual yang aman dengan menyebutkan `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token`, dan kunci fragmen URL `token`, tanpa mencetak nilai token.

## Terkait

- [Referensi CLI](/id/cli)
- [Dasbor](/id/web/dashboard)
