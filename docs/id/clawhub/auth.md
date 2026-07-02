---
read_when:
    - Masuk ke ClawHub
    - Menggunakan CLI ClawHub
    - Men-debug 401
summary: Masuk ClawHub, token API, login CLI, penyimpanan token, dan pencabutan.
x-i18n:
    generated_at: "2026-07-02T22:48:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Autentikasi

ClawHub menggunakan GitHub untuk masuk web. CLI menggunakan token API ClawHub yang dibuat
melalui akun yang sudah masuk tersebut.

## Masuk web

Gunakan GitHub untuk masuk di [clawhub.ai](https://clawhub.ai).

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menyelesaikan proses masuk ClawHub normal.
Jika proses masuk mengembalikan Anda ke status keluar, akun Anda mungkin tidak dalam
kondisi baik. Jika akun Anda diblokir atau dinonaktifkan, gunakan
[formulir banding ClawHub](https://appeals.openclaw.ai/) jika Anda yakin ini adalah
kesalahan.

## Login CLI

Alur login CLI default membuka browser Anda:

```bash
clawhub login
clawhub whoami
```

Yang terjadi:

1. CLI memulai server callback sementara di `127.0.0.1`.
2. Browser Anda membuka halaman masuk ClawHub.
3. Setelah masuk GitHub, ClawHub membuat token API.
4. Browser mengalihkan kembali ke callback lokal.
5. CLI menyimpan token di file konfigurasi ClawHub Anda.

Jika browser Anda tidak dapat menjangkau callback lokal karena aturan firewall, VPN, atau
proxy, gunakan alur token tanpa antarmuka.

## Login tanpa antarmuka

Buat token di UI web ClawHub, lalu berikan ke CLI:

```bash
clawhub login --token clh_...
```

Gunakan alur ini untuk server, pekerjaan CI, atau lingkungan yang hanya memiliki terminal.

Untuk shell jarak jauh tempat Anda dapat membuka browser di tempat lain, jalankan:

```bash
clawhub login --device
```

CLI mencetak kode sekali pakai dan menunggu saat Anda mengotorisasinya di
`https://clawhub.ai/cli/device`.

## Penyimpanan token

Path konfigurasi default:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` atau `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Timpa path dengan:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Cetak token yang tersimpan untuk penyiapan CI dengan:

```bash
clawhub token
```

## Pencabutan

Anda dapat mencabut token API di UI web ClawHub.

Token yang dicabut, tidak valid, atau hilang mengembalikan `401 Unauthorized`. Masuk lagi
dengan `clawhub login` atau berikan token baru dengan `clawhub login --token`.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat terus menggunakan token API yang ada.
Jika akun Anda diblokir atau dinonaktifkan, gunakan
[formulir banding ClawHub](https://appeals.openclaw.ai/) jika Anda yakin ini adalah
kesalahan.
