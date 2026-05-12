---
read_when:
    - Masuk ke ClawHub
    - Menggunakan CLI ClawHub
    - Memecahkan masalah 401
summary: Masuk ClawHub, token API, login CLI, penyimpanan token, dan pencabutan.
x-i18n:
    generated_at: "2026-05-12T15:42:37Z"
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

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat menyelesaikan proses masuk ClawHub normal.
Jika proses masuk mengembalikan Anda ke keadaan keluar, akun Anda mungkin tidak bereputasi
baik.

## Login CLI

Alur login CLI default membuka browser Anda:

```bash
clawhub login
clawhub whoami
```

Yang terjadi:

1. CLI memulai server callback sementara di `127.0.0.1`.
2. Browser Anda membuka halaman masuk ClawHub.
3. Setelah masuk dengan GitHub, ClawHub membuat token API.
4. Browser mengalihkan kembali ke callback lokal.
5. CLI menyimpan token di file konfigurasi ClawHub Anda.

Jika browser Anda tidak dapat menjangkau callback lokal karena firewall, VPN, atau
aturan proksi, gunakan alur token tanpa antarmuka.

## Login tanpa antarmuka

Buat token di UI web ClawHub, lalu teruskan ke CLI:

```bash
clawhub login --token clh_...
```

Gunakan alur ini untuk server, tugas CI, atau lingkungan yang hanya memiliki terminal.

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

## Pencabutan

Anda dapat mencabut token API di UI web ClawHub.

Token yang dicabut, tidak valid, atau tidak ada akan mengembalikan `401 Unauthorized`. Masuk lagi
dengan `clawhub login` atau berikan token baru dengan `clawhub login --token`.

Akun yang dihapus, diblokir, atau dinonaktifkan tidak dapat terus menggunakan token API yang ada.
