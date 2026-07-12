---
read_when:
    - Anda menginginkan bot asisten Zalo pribadi dengan login kode QR
    - Anda sedang memasang atau memecahkan masalah plugin saluran openclaw-zaloclawbot
summary: Penyiapan saluran Zalo ClawBot melalui plugin eksternal openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-12T13:58:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw terhubung ke Zalo ClawBot melalui plugin eksternal `@zalo-platforms/openclaw-zaloclawbot` yang tercantum dalam katalog. Proses masuk menggunakan kode QR Zalo Mini App; id plugin dalam konfigurasi adalah `openclaw-zaloclawbot`.

## Kompatibilitas

| Versi Plugin | Versi OpenClaw | dist-tag npm | Status        |
| ------------- | --------------- | ------------ | ------------- |
| 0.1.4         | >=2026.4.10     | `latest`     | Aktif / Beta  |

## Prasyarat

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) telah terpasang (CLI `openclaw` tersedia)
- Akun Zalo pada perangkat seluler untuk memindai kode QR masuk

## Instalasi dengan onboard (disarankan)

```bash
openclaw onboard
```

Pilih **Zalo ClawBot** dari menu kanal. Wizard memasang plugin dari katalog resmi (dengan integritas yang diverifikasi), menampilkan QR masuk di terminal, dan menyelesaikan penyiapan kanal setelah Anda memindainya dengan aplikasi Zalo.

## Instalasi manual

Untuk menambahkan kanal ke Gateway yang telah melalui proses onboard:

### 1. Pasang plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Gunakan versi tersemat yang tepat agar OpenClaw memverifikasi paket terhadap hash integritas katalog selama instalasi.

### 2. Aktifkan plugin dalam konfigurasi

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Buat kode QR dan masuk

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Pindai kode QR yang ditampilkan di terminal dengan aplikasi seluler Zalo, setujui Ketentuan Penggunaan di dalam Zalo Mini App, lalu otorisasi sesi tersebut.

### 4. Mulai ulang Gateway

```bash
openclaw gateway restart
```

## Cara kerjanya

Tidak seperti kanal Zalo standar, yang mengharuskan Anda mendaftarkan Zalo Official Account (OA) sendiri dan mengonfigurasi kredensial pengembang statis, Zalo ClawBot adalah **asisten pribadi yang terikat pada pemilik** di infrastruktur resmi bersama:

1. **Onboarding:** kode QR mengarah ke Zalo Mini App yang mengikat bot privat yang baru disediakan di bawah OA resmi bersama secara langsung ke ID pengguna Zalo Anda.
2. **Privasi terikat pemilik:** bot hanya berkomunikasi dengan pemiliknya. Pesan dari pengguna lain dibuang pada tingkat platform.
3. **Jalur API resmi:** plugin menggunakan API Zalo Bot Platform, bukan otomatisasi browser atau sesi web.

## Mekanisme internal

Plugin berkomunikasi dengan Zalo melalui loop long-polling persisten (`getUpdates`). Webhook dinonaktifkan secara default untuk Gateway lokal yang dijalankan dari desktop/terminal. Pesan diproses di sisi klien dan dipetakan ke runtime agen lokal Anda.

Plugin mengelola kredensial bot di dalam direktori status OpenClaw. Perlakukan direktori tersebut sebagai data sensitif dan lindungi dengan kebijakan kontrol akses serta pencadangan yang sama seperti status OpenClaw lainnya.

Runtime plugin ini sepenuhnya berada dalam paket eksternal `@zalo-platforms/openclaw-zaloclawbot`; detail perilaku di bawah ini selain instalasi/konfigurasi dilaporkan oleh pengelola plugin dan tidak diverifikasi terhadap kode sumber inti OpenClaw.

## Pemecahan masalah

- **Batas waktu masuk melalui QR:** token masuk (`zbsk`) kedaluwarsa setelah 5 menit demi keamanan. Jika kode QR kedaluwarsa sebelum Anda memindainya, jalankan kembali perintah masuk untuk membuat kode baru.
- **Gateway gagal dimuat:** pastikan versi host OpenClaw Anda adalah `2026.4.10` atau yang lebih baru. Versi lama tidak mendukung ledger instalasi plugin npm eksternal yang diperlukan oleh ID ini.

## Terkait

- [Ikhtisar Kanal](/id/channels) - semua kanal yang didukung
- [Zalo](/id/channels/zalo) - kanal Zalo Bot Creator / Marketplace bawaan
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Plugin](/id/tools/plugin) - memasang dan mengelola plugin
