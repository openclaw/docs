---
read_when:
    - Meng-host PeekabooBridge di OpenClaw.app
    - Mengintegrasikan Peekaboo melalui Swift Package Manager
    - Mengubah protokol/path PeekabooBridge
summary: Integrasi PeekabooBridge untuk otomatisasi UI macOS
title: Bridge Peekaboo
x-i18n:
    generated_at: "2026-04-24T09:17:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw dapat meng-host **PeekabooBridge** sebagai broker otomatisasi UI lokal yang sadar izin.
Ini memungkinkan CLI `peekaboo` menjalankan otomatisasi UI sambil menggunakan kembali
izin TCC aplikasi macOS.

## Apa ini (dan apa yang bukan)

- **Host**: OpenClaw.app dapat bertindak sebagai host PeekabooBridge.
- **Klien**: gunakan CLI `peekaboo` (tidak ada permukaan `openclaw ui ...` terpisah).
- **UI**: overlay visual tetap berada di Peekaboo.app; OpenClaw adalah host broker tipis.

## Aktifkan bridge

Di aplikasi macOS:

- Settings → **Enable Peekaboo Bridge**

Saat diaktifkan, OpenClaw memulai server socket UNIX lokal. Jika dinonaktifkan, host
dihentikan dan `peekaboo` akan kembali ke host lain yang tersedia.

## Urutan discovery klien

Klien Peekaboo biasanya mencoba host dalam urutan ini:

1. Peekaboo.app (UX penuh)
2. Claude.app (jika terinstal)
3. OpenClaw.app (broker tipis)

Gunakan `peekaboo bridge status --verbose` untuk melihat host mana yang aktif dan path
socket mana yang digunakan. Anda dapat menimpanya dengan:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Keamanan & izin

- Bridge memvalidasi **code signature pemanggil**; allowlist TeamID
  diberlakukan (TeamID host Peekaboo + TeamID aplikasi OpenClaw).
- Permintaan timeout setelah ~10 detik.
- Jika izin yang diperlukan tidak ada, bridge mengembalikan pesan error yang jelas
  alih-alih meluncurkan System Settings.

## Perilaku snapshot (otomatisasi)

Snapshot disimpan dalam memori dan otomatis kedaluwarsa setelah jendela singkat.
Jika Anda memerlukan retensi lebih lama, tangkap ulang dari klien.

## Pemecahan masalah

- Jika `peekaboo` melaporkan “bridge client is not authorized”, pastikan klien
  ditandatangani dengan benar atau jalankan host dengan `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  hanya dalam mode **debug**.
- Jika tidak ada host yang ditemukan, buka salah satu aplikasi host (Peekaboo.app atau OpenClaw.app)
  dan konfirmasikan bahwa izin telah diberikan.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Izin macOS](/id/platforms/mac/permissions)
