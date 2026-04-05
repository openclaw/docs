---
read_when:
    - Meng-host PeekabooBridge di OpenClaw.app
    - Mengintegrasikan Peekaboo melalui Swift Package Manager
    - Mengubah protokol/path PeekabooBridge
summary: Integrasi PeekabooBridge untuk otomasi UI macOS
title: Peekaboo Bridge
x-i18n:
    generated_at: "2026-04-05T14:00:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30961eb502eecd23c017b58b834bd8cb00cab8b17302617d541afdace3ad8dba
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge (otomasi UI macOS)

OpenClaw dapat meng-host **PeekabooBridge** sebagai broker otomasi UI lokal
yang sadar izin. Ini memungkinkan CLI `peekaboo` menjalankan otomasi UI sambil menggunakan kembali
izin TCC app macOS.

## Apa ini (dan apa yang bukan)

- **Host**: OpenClaw.app dapat bertindak sebagai host PeekabooBridge.
- **Klien**: gunakan CLI `peekaboo` (tidak ada permukaan `openclaw ui ...` terpisah).
- **UI**: overlay visual tetap berada di Peekaboo.app; OpenClaw adalah host broker tipis.

## Aktifkan bridge

Di app macOS:

- Settings → **Enable Peekaboo Bridge**

Saat diaktifkan, OpenClaw memulai server socket UNIX lokal. Jika dinonaktifkan, host
dihentikan dan `peekaboo` akan fallback ke host lain yang tersedia.

## Urutan discovery klien

Klien Peekaboo biasanya mencoba host dalam urutan ini:

1. Peekaboo.app (UX penuh)
2. Claude.app (jika terinstal)
3. OpenClaw.app (broker tipis)

Gunakan `peekaboo bridge status --verbose` untuk melihat host mana yang aktif dan
path socket mana yang digunakan. Anda dapat mengoverride dengan:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Keamanan & izin

- Bridge memvalidasi **tanda tangan kode pemanggil**; allowlist TeamID
  diberlakukan (TeamID host Peekaboo + TeamID app OpenClaw).
- Permintaan mengalami timeout setelah ~10 detik.
- Jika izin yang diperlukan tidak ada, bridge mengembalikan pesan error yang jelas
  alih-alih meluncurkan System Settings.

## Perilaku snapshot (otomasi)

Snapshot disimpan di memori dan kedaluwarsa secara otomatis setelah jangka waktu singkat.
Jika Anda memerlukan retensi lebih lama, ambil ulang dari klien.

## Pemecahan masalah

- Jika `peekaboo` melaporkan “bridge client is not authorized”, pastikan klien
  ditandatangani dengan benar atau jalankan host dengan `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  dalam mode **debug** saja.
- Jika tidak ada host yang ditemukan, buka salah satu app host (Peekaboo.app atau OpenClaw.app)
  dan konfirmasikan izin telah diberikan.
