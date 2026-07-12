---
read_when:
    - Masuk ke ClawHub
    - Menggunakan CLI ClawHub
    - Men-debug kesalahan 401
summary: Proses masuk ClawHub, token API, login CLI, penyimpanan token, dan pencabutan.
x-i18n:
    generated_at: "2026-07-12T14:01:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Autentikasi

ClawHub menggunakan GitHub untuk masuk melalui web. CLI menggunakan token API ClawHub yang dibuat melalui akun yang telah masuk tersebut.

## Masuk melalui web

Gunakan GitHub untuk masuk di [clawhub.ai](https://clawhub.ai).

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menyelesaikan proses masuk normal ke ClawHub. Jika setelah proses masuk Anda kembali ke keadaan belum masuk, akun Anda mungkin tidak berstatus baik. Jika akun Anda diblokir atau dinonaktifkan dan Anda meyakini hal ini merupakan kesalahan, gunakan [formulir banding ClawHub](https://appeals.openclaw.ai/).

## Masuk melalui CLI

Alur masuk CLI secara default membuka peramban Anda:

```bash
clawhub login
clawhub whoami
```

Yang terjadi:

1. CLI memulai server callback sementara di `127.0.0.1`.
2. Peramban Anda membuka halaman masuk ClawHub.
3. Setelah masuk melalui GitHub, ClawHub membuat token API.
4. Peramban dialihkan kembali ke callback lokal.
5. CLI menyimpan token dalam berkas konfigurasi ClawHub Anda.

Jika peramban Anda tidak dapat menjangkau callback lokal karena aturan firewall, VPN, atau proksi, gunakan alur token tanpa antarmuka grafis.

## Masuk tanpa antarmuka grafis

Buat token di antarmuka web ClawHub, lalu teruskan token tersebut ke CLI:

```bash
clawhub login --token clh_...
```

Gunakan alur ini untuk server, tugas CI, atau lingkungan yang hanya menyediakan terminal.

Untuk shell jarak jauh ketika Anda dapat membuka peramban di tempat lain, jalankan:

```bash
clawhub login --device
```

CLI menampilkan kode sekali pakai dan menunggu saat Anda memberikan otorisasi di `https://clawhub.ai/cli/device`.

## Penyimpanan token

Jalur konfigurasi default:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` atau `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Ganti jalur tersebut dengan:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Tampilkan token yang tersimpan untuk penyiapan CI dengan:

```bash
clawhub token
```

## Pencabutan

Anda dapat mencabut token API di antarmuka web ClawHub.

Token yang telah dicabut, tidak valid, atau tidak tersedia akan menghasilkan `401 Unauthorized`. Masuk kembali dengan `clawhub login` atau berikan token baru dengan `clawhub login --token`.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat terus menggunakan token API yang sudah ada. Jika akun Anda diblokir atau dinonaktifkan dan Anda meyakini hal ini merupakan kesalahan, gunakan [formulir banding ClawHub](https://appeals.openclaw.ai/).
