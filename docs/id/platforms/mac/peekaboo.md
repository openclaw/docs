---
read_when:
    - Menghosting PeekabooBridge di OpenClaw.app
    - Mengintegrasikan Peekaboo melalui Swift Package Manager
    - Mengubah protokol/jalur PeekabooBridge
    - Memilih antara PeekabooBridge, Codex Computer Use, dan cua-driver MCP
summary: Integrasi PeekabooBridge untuk otomatisasi UI macOS
title: Jembatan Peekaboo
x-i18n:
    generated_at: "2026-04-30T09:59:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw dapat menghosting **PeekabooBridge** sebagai broker otomatisasi UI lokal yang sadar izin. Ini memungkinkan CLI `peekaboo` menjalankan otomatisasi UI sambil menggunakan ulang izin TCC aplikasi macOS.

## Apa ini (dan apa yang bukan)

- **Host**: OpenClaw.app dapat bertindak sebagai host PeekabooBridge.
- **Klien**: gunakan CLI `peekaboo` (tidak ada permukaan `openclaw ui ...` terpisah).
- **UI**: overlay visual tetap berada di Peekaboo.app; OpenClaw adalah host broker tipis.

## Hubungan dengan Computer Use

OpenClaw memiliki tiga jalur kontrol desktop, dan ketiganya sengaja tetap terpisah:

- **Host PeekabooBridge**: OpenClaw.app dapat menghosting soket PeekabooBridge lokal. CLI `peekaboo` tetap menjadi klien dan menggunakan izin macOS OpenClaw.app untuk primitif otomatisasi Peekaboo seperti tangkapan layar, klik, menu, dialog, aksi Dock, dan manajemen jendela.
- **Codex Computer Use**: Plugin `codex` bawaan menyiapkan server aplikasi Codex, memverifikasi bahwa server MCP `computer-use` Codex tersedia, lalu membiarkan Codex memiliki panggilan alat kontrol desktop native selama giliran mode Codex. OpenClaw tidak mem-proxy aksi tersebut melalui PeekabooBridge.
- **MCP `cua-driver` langsung**: OpenClaw dapat mendaftarkan server `cua-driver mcp` upstream TryCua sebagai server MCP normal. Ini memberi agen skema milik driver CUA dan alur kerja pid/window/element-index tanpa merutekan melalui marketplace Codex atau soket PeekabooBridge.

Gunakan Peekaboo ketika Anda menginginkan permukaan otomatisasi macOS yang luas dan host bridge OpenClaw.app yang sadar izin. Gunakan Codex Computer Use ketika agen mode Codex harus mengandalkan Plugin computer-use native Codex. Gunakan `cua-driver mcp` langsung ketika Anda ingin driver CUA diekspos ke runtime apa pun yang dikelola OpenClaw sebagai server MCP normal.

## Aktifkan bridge

Di aplikasi macOS:

- Settings → **Enable Peekaboo Bridge**

Saat diaktifkan, OpenClaw memulai server soket UNIX lokal. Jika dinonaktifkan, host dihentikan dan `peekaboo` akan kembali ke host lain yang tersedia.

## Urutan penemuan klien

Klien Peekaboo biasanya mencoba host dalam urutan ini:

1. Peekaboo.app (UX lengkap)
2. Claude.app (jika terpasang)
3. OpenClaw.app (broker tipis)

Gunakan `peekaboo bridge status --verbose` untuk melihat host mana yang aktif dan jalur soket mana yang digunakan. Anda dapat menimpanya dengan:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Keamanan & izin

- Bridge memvalidasi **tanda tangan kode pemanggil**; allowlist TeamID diberlakukan (TeamID host Peekaboo + TeamID aplikasi OpenClaw).
- Permintaan habis waktu setelah ~10 detik.
- Jika izin yang diperlukan tidak ada, bridge mengembalikan pesan galat yang jelas alih-alih membuka System Settings.

## Perilaku snapshot (otomatisasi)

Snapshot disimpan di memori dan kedaluwarsa secara otomatis setelah jendela waktu singkat. Jika Anda memerlukan retensi lebih lama, ambil ulang dari klien.

## Pemecahan masalah

- Jika `peekaboo` melaporkan “bridge client is not authorized”, pastikan klien ditandatangani dengan benar atau jalankan host dengan `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` hanya dalam mode **debug**.
- Jika tidak ada host yang ditemukan, buka salah satu aplikasi host (Peekaboo.app atau OpenClaw.app) dan pastikan izin telah diberikan.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [izin macOS](/id/platforms/mac/permissions)
