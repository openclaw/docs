---
read_when:
    - Anda menginginkan bot asisten Zalo pribadi dengan login kode QR
    - Anda sedang memasang atau memecahkan masalah plugin saluran openclaw-zaloclawbot
summary: Penyiapan kanal Zalo ClawBot melalui plugin eksternal openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-27T17:13:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw terhubung ke Zalo ClawBot melalui Plugin eksternal
`@zalo-platforms/openclaw-zaloclawbot` yang tercantum di katalog. Login menggunakan kode QR Zalo Mini App.

## Kompatibilitas

| Versi Plugin | Versi OpenClaw | npm dist-tag | Status        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.x          | >=2026.4.10      | `latest`     | Aktif / Beta |

## Prasyarat

- Node.js **>= 22**
- [OpenClaw](https://docs.openclaw.ai/install) harus sudah terinstal (CLI `openclaw` tersedia).
- Akun Zalo di perangkat seluler untuk memindai kode QR login.

## Instal dengan onboard (direkomendasikan)

Jalankan wizard orientasi OpenClaw dan pilih **Zalo ClawBot** dari menu channel:

```bash
openclaw onboard
```

Wizard memasang Plugin dari katalog resmi (dengan integritas terverifikasi), menampilkan QR login langsung di terminal, dan menyelesaikan channel setelah Anda memindainya dengan aplikasi Zalo. Tidak diperlukan perintah tambahan.

## Instalasi Manual

Untuk menambahkan channel ke Gateway yang sudah menjalani orientasi, ikuti langkah-langkah berikut:

### 1. Instal Plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Gunakan versi tersemat persis seperti yang ditampilkan di atas (sesuai dengan entri katalog resmi), agar OpenClaw memverifikasi paket terhadap hash integritas katalog selama instalasi.

### 2. Aktifkan Plugin di config

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Buat kode QR dan login

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Pindai kode QR yang ditampilkan di terminal menggunakan aplikasi seluler Zalo, terima Ketentuan Penggunaan di dalam Zalo Mini App, dan otorisasi sesi.

### 4. Mulai ulang Gateway

```bash
openclaw gateway restart
```

---

## Cara Kerjanya

Berbeda dengan channel developer Zalo standar yang mengharuskan Anda mendaftarkan Zalo Official Account (OA) sendiri dan menempelkan kredensial developer statis, Zalo ClawBot beroperasi sebagai **asisten pribadi yang terikat pemilik** menggunakan infrastruktur resmi bersama:

1. **Orientasi Aman:** Kode QR mengarah ke Zalo Mini App aman yang mengikat bot privat yang baru disediakan di bawah OA resmi bersama langsung ke Zalo User ID Anda.
2. **Privasi Terikat Pemilik:** Secara desain, bot dibatasi untuk berkomunikasi _hanya_ dengan pemiliknya. Pesan dari pengguna lain dibuang di tingkat platform, sehingga koneksi tetap privat dan aman.
3. **Jalur API Resmi:** Plugin menggunakan API Zalo Bot Platform, bukan
   otomatisasi browser atau sesi web.

## Di Balik Layar

Plugin Zalo ClawBot berkomunikasi dengan API Zalo melalui loop pesan long-polling persisten. Untuk mempertahankan runtime yang bersih dan ringan:

- Koneksi long-poll menggunakan endpoint `getUpdates`.
- Webhook dinonaktifkan secara default untuk eksekusi Gateway desktop/terminal lokal.
- Pesan diproses di sisi klien dan dipetakan langsung ke runtime agen lokal Anda.

Plugin eksternal mengelola kredensial bot di bawah direktori state OpenClaw.
Perlakukan direktori tersebut sebagai sensitif dan sertakan dalam kebijakan kontrol akses dan
cadangan yang sama seperti state OpenClaw lainnya.

---

## Pemecahan Masalah

- **Waktu Login QR Habis:** Token login (`zbsk`) kedaluwarsa setelah 5 menit karena alasan keamanan. Jika kode QR kedaluwarsa sebelum Anda memindainya, cukup jalankan ulang perintah login untuk membuat yang baru.
- **Gateway Gagal Dimuat:** Pastikan versi host OpenClaw Anda adalah `2026.4.10` atau lebih tinggi. Versi yang lebih lama tidak mendukung ledger instalasi Plugin npm eksternal.
