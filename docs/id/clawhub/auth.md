---
read_when:
    - Masuk ke ClawHub
    - Menggunakan CLI ClawHub
    - Pemecahan masalah 401
summary: Masuk ClawHub, token API, login CLI, penyimpanan token, dan pencabutan.
x-i18n:
    generated_at: "2026-05-10T19:25:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Autentikasi

ClawHub menggunakan GitHub untuk masuk melalui web. CLI menggunakan token API ClawHub yang dibuat
melalui akun yang sudah masuk tersebut.

## Masuk melalui web

Gunakan GitHub untuk masuk di [clawhub.ai](https://clawhub.ai).

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menyelesaikan proses masuk ClawHub secara normal.
Jika proses masuk mengembalikan Anda ke status keluar, akun Anda mungkin tidak dalam
reputasi baik.

## Masuk CLI

Alur masuk CLI bawaan membuka peramban Anda:

```bash
clawhub login
clawhub whoami
```

Yang terjadi:

1. CLI memulai server panggilan balik sementara di `127.0.0.1`.
2. Peramban Anda membuka halaman masuk ClawHub.
3. Setelah masuk dengan GitHub, ClawHub membuat token API.
4. Peramban mengalihkan kembali ke panggilan balik lokal.
5. CLI menyimpan token di file konfigurasi ClawHub Anda.

Jika peramban Anda tidak dapat menjangkau panggilan balik lokal karena aturan firewall, VPN, atau
proksi, gunakan alur token tanpa antarmuka grafis.

## Masuk tanpa antarmuka grafis

Buat token di antarmuka web ClawHub, lalu berikan ke CLI:

```bash
clawhub login --token clh_...
```

Gunakan alur ini untuk server, pekerjaan CI, atau lingkungan yang hanya menggunakan terminal.

Untuk shell jarak jauh tempat Anda dapat membuka peramban di tempat lain, jalankan:

```bash
clawhub login --device
```

CLI mencetak kode sekali pakai dan menunggu saat Anda mengotorisasinya di
`https://clawhub.ai/cli/device`.

## Penyimpanan token

Jalur konfigurasi bawaan:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` atau `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Timpa jalur dengan:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## Pencabutan

Anda dapat mencabut token API di antarmuka web ClawHub.

Token yang dicabut, tidak valid, atau hilang akan mengembalikan `401 Unauthorized`. Masuk lagi
dengan `clawhub login` atau berikan token baru dengan `clawhub login --token`.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat terus menggunakan token API yang sudah ada.
