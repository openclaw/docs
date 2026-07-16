---
read_when:
    - Menjalankan lebih dari satu Gateway pada mesin yang sama
    - Anda memerlukan konfigurasi/status/port yang terisolasi untuk setiap Gateway
summary: Menjalankan beberapa Gateway OpenClaw pada satu host (isolasi, port, dan profil)
title: Beberapa Gateway
x-i18n:
    generated_at: "2026-07-16T18:05:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Sebagian besar penyiapan memerlukan satu Gateway - satu Gateway menangani beberapa koneksi perpesanan dan agen. Jalankan Gateway terpisah dengan profil/port terisolasi hanya jika Anda memerlukan isolasi yang lebih kuat atau redundansi (misalnya, bot penyelamat).

## Mulai cepat bot penyelamat

Penyiapan bot penyelamat paling sederhana:

- Pertahankan bot utama pada profil default.
- Jalankan bot penyelamat pada `--profile rescue`, dengan token bot Telegram tersendiri.
- Tempatkan bot penyelamat pada port dasar yang berbeda, misalnya `19789`.

Dengan demikian, bot penyelamat tetap dapat men-debug atau menerapkan perubahan konfigurasi jika bot utama tidak aktif. Sisakan setidaknya 20 port di antara port dasar agar port browser/CDP turunan tidak pernah bertabrakan.

```bash
# Bot penyelamat (bot Telegram terpisah, profil terpisah, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Jika bot utama sudah berjalan, biasanya hanya itu yang Anda perlukan. Jika orientasi awal sudah memasang layanan penyelamat, lewati `gateway install` terakhir.

Selama `openclaw --profile rescue onboard`:

- Gunakan token bot Telegram terpisah yang dikhususkan untuk akun penyelamat (mudah dibatasi hanya untuk operator, independen dari pemasangan saluran/aplikasi bot utama, dan menyediakan jalur pemulihan sederhana berbasis pesan langsung).
- Pertahankan nama profil `rescue`.
- Gunakan port dasar yang setidaknya 20 lebih tinggi daripada bot utama.
- Terima ruang kerja penyelamat default, kecuali Anda sudah mengelolanya sendiri.

### Perubahan yang dilakukan `--profile rescue onboard`

`--profile rescue onboard` menjalankan alur orientasi awal normal, tetapi menulis semuanya ke profil terpisah, sehingga bot penyelamat memiliki:

- File profil/konfigurasi
- Direktori status
- Ruang kerja (default: `~/.openclaw/workspace-rescue`)
- Nama layanan terkelola
- Port dasar (beserta port turunan)
- Token bot Telegram

Prompt lainnya identik dengan orientasi awal normal.

## Penyiapan multi-Gateway umum

Pola isolasi yang sama dapat digunakan untuk pasangan atau kelompok Gateway apa pun pada satu host - berikan profil bernama dan port dasar tersendiri kepada setiap Gateway tambahan:

```bash
# utama (profil default)
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

Gunakan mulai cepat bot penyelamat untuk jalur operator cadangan; gunakan pola profil umum untuk beberapa Gateway berumur panjang di berbagai saluran, tenant, ruang kerja, atau peran operasional.

## Daftar periksa isolasi

Pastikan pengaturan berikut unik untuk setiap instans Gateway:

| Pengaturan                      | Tujuan                                      |
| ------------------------------- | ------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | File konfigurasi per instans                |
| `OPENCLAW_STATE_DIR`         | Sesi, kredensial, dan cache per instans     |
| `agents.defaults.workspace`  | Root ruang kerja per instans                 |
| `gateway.port` (atau `--port`) | Unik untuk setiap instans                   |
| Port browser/CDP turunan        | Lihat di bawah                              |

Berbagi salah satu dari pengaturan ini menyebabkan konflik konfigurasi, status, atau port. Saat dimulai, Gateway
memberlakukan kepemilikan direktori status yang unik meskipun
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` melewati instans tunggal per konfigurasi.

## Pemetaan port (turunan)

Port dasar = `gateway.port` (atau `OPENCLAW_GATEWAY_PORT` / `--port`).

- Port layanan kontrol browser = port dasar + 2 (khusus loopback).
- Host Canvas disajikan pada server HTTP Gateway itu sendiri (port yang sama dengan `gateway.port`).
- Port CDP profil browser dialokasikan secara otomatis dari `browser control port + 9` hingga `+ 108`.

Jika Anda mengganti salah satunya dalam konfigurasi atau variabel lingkungan, Anda harus memastikan nilainya unik untuk setiap instans.

## Catatan browser/CDP (kesalahan umum)

- **Jangan** tetapkan `browser.cdpUrl` ke nilai yang sama pada beberapa instans.
- Setiap instans memerlukan port kontrol browser dan rentang CDP tersendiri (diturunkan dari port gateway-nya).
- Untuk port CDP eksplisit, atur `browser.profiles.<name>.cdpPort` untuk setiap instans.
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
- Teks peringatan `gateway probe` seperti `multiple reachable gateway identities detected` hanya diharapkan ketika Anda sengaja menjalankan lebih dari satu gateway terisolasi, atau ketika OpenClaw tidak dapat membuktikan bahwa target pemeriksaan yang dapat dijangkau merupakan gateway yang sama. Terowongan SSH, URL proksi, atau URL jarak jauh yang dikonfigurasi menuju gateway yang sama tetap merupakan satu gateway dengan beberapa transpor, meskipun port transpor berbeda.

## Terkait

- [Panduan operasional Gateway](/id/gateway)
- [Kunci Gateway](/id/gateway/gateway-lock)
- [Konfigurasi](/id/gateway/configuration)
