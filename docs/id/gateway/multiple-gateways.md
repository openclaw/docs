---
read_when:
    - Menjalankan lebih dari satu Gateway pada mesin yang sama
    - Anda memerlukan konfigurasi/status/port terisolasi per Gateway
summary: Menjalankan beberapa Gateway OpenClaw pada satu host (isolasi, port, dan profil)
title: Beberapa Gateway
x-i18n:
    generated_at: "2026-07-12T14:11:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Sebagian besar penyiapan hanya memerlukan satu Gateway—satu Gateway menangani beberapa koneksi perpesanan dan agen. Jalankan Gateway terpisah dengan profil/port yang terisolasi hanya jika Anda memerlukan isolasi atau redundansi yang lebih kuat (misalnya, bot pemulihan).

## Mulai cepat bot pemulihan

Penyiapan bot pemulihan yang paling sederhana:

- Pertahankan bot utama pada profil bawaan.
- Jalankan bot pemulihan dengan `--profile rescue`, menggunakan token bot Telegram tersendiri.
- Gunakan port dasar yang berbeda untuk bot pemulihan, misalnya `19789`.

Dengan demikian, bot pemulihan tetap dapat melakukan debug atau menerapkan perubahan konfigurasi jika bot utama tidak aktif. Sisakan setidaknya 20 port di antara port dasar agar port browser/CDP turunannya tidak pernah bertabrakan.

```bash
# Bot pemulihan (bot Telegram terpisah, profil terpisah, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jika bot utama Anda sudah berjalan, biasanya hanya itu yang diperlukan. Jika proses orientasi sudah memasang layanan pemulihan, lewati `gateway install` terakhir.

Selama menjalankan `openclaw --profile rescue onboard`:

- Gunakan token bot Telegram terpisah yang dikhususkan untuk akun pemulihan (mudah dibatasi hanya untuk operator, independen dari pemasangan kanal/aplikasi bot utama, dan menyediakan jalur pemulihan sederhana berbasis pesan langsung).
- Pertahankan nama profil `rescue`.
- Gunakan port dasar yang setidaknya 20 lebih tinggi daripada bot utama.
- Terima ruang kerja pemulihan bawaan kecuali Anda sudah mengelolanya sendiri.

### Perubahan yang dilakukan oleh `--profile rescue onboard`

`--profile rescue onboard` menjalankan alur orientasi normal, tetapi menulis semuanya ke profil terpisah sehingga bot pemulihan memiliki sumber dayanya sendiri:

- Berkas profil/konfigurasi
- Direktori status
- Ruang kerja (bawaan: `~/.openclaw/workspace-rescue`)
- Nama layanan terkelola
- Port dasar (beserta port turunannya)
- Token bot Telegram

Selain itu, semua perintah interaktifnya sama dengan orientasi normal.

## Penyiapan umum beberapa Gateway

Pola isolasi yang sama berlaku untuk pasangan atau kelompok Gateway apa pun pada satu host—berikan setiap Gateway tambahan profil bernama dan port dasar tersendiri:

```bash
# utama (profil bawaan)
openclaw setup
openclaw gateway --port 18789

# gateway tambahan
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Profil bernama pada kedua sisi juga dapat digunakan:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Layanan mengikuti pola yang sama:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Gunakan panduan mulai cepat bot pemulihan sebagai jalur operator cadangan; gunakan pola profil umum untuk beberapa Gateway berumur panjang di berbagai kanal, tenant, ruang kerja, atau peran operasional.

## Daftar periksa isolasi

Pastikan hal-hal berikut unik untuk setiap instans Gateway:

| Pengaturan                   | Tujuan                                      |
| ---------------------------- | ------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | Berkas konfigurasi per instans              |
| `OPENCLAW_STATE_DIR`         | Sesi, kredensial, dan cache per instans     |
| `agents.defaults.workspace`  | Akar ruang kerja per instans                |
| `gateway.port` (atau `--port`) | Unik untuk setiap instans                 |
| Port browser/CDP turunan     | Lihat di bawah                              |

Penggunaan bersama salah satu dari hal tersebut menyebabkan kondisi balapan konfigurasi dan konflik port.

## Pemetaan port (turunan)

Port dasar = `gateway.port` (atau `OPENCLAW_GATEWAY_PORT` / `--port`).

- Port layanan kontrol browser = port dasar + 2 (hanya local loopback).
- Host Canvas disajikan pada server HTTP Gateway itu sendiri (port yang sama dengan `gateway.port`).
- Port CDP profil browser dialokasikan otomatis mulai dari `browser control port + 9` hingga `+ 108`.

Jika Anda mengganti salah satu nilai tersebut melalui konfigurasi atau variabel lingkungan, Anda harus memastikan nilainya unik untuk setiap instans.

## Catatan browser/CDP (sumber kesalahan umum)

- **Jangan** menetapkan `browser.cdpUrl` ke nilai yang sama pada beberapa instans.
- Setiap instans memerlukan port kontrol browser dan rentang CDP tersendiri (diturunkan dari port gateway-nya).
- Untuk port CDP eksplisit, tetapkan `browser.profiles.<name>.cdpPort` untuk setiap instans.
- Untuk Chrome jarak jauh, gunakan `browser.profiles.<name>.cdpUrl` (per profil, per instans).

## Contoh variabel lingkungan manual

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Pemeriksaan cepat

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

- `gateway status --deep` mendeteksi layanan launchd/systemd/schtasks usang dari pemasangan lama.
- Teks peringatan `gateway probe` seperti `multiple reachable gateway identities detected` hanya wajar jika Anda sengaja menjalankan lebih dari satu gateway yang terisolasi, atau ketika OpenClaw tidak dapat membuktikan bahwa target pemeriksaan yang dapat dijangkau merupakan gateway yang sama. Terowongan SSH, URL proksi, atau URL jarak jauh yang dikonfigurasi menuju gateway yang sama tetap merupakan satu gateway dengan beberapa transportasi, meskipun port transportasinya berbeda.

## Terkait

- [Panduan operasional Gateway](/id/gateway)
- [Kunci Gateway](/id/gateway/gateway-lock)
- [Konfigurasi](/id/gateway/configuration)
