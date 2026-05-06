---
read_when:
    - Menghosting PeekabooBridge di OpenClaw.app
    - Mengintegrasikan Peekaboo melalui Swift Package Manager
    - Mengubah protokol/jalur PeekabooBridge
    - Memilih antara PeekabooBridge, Codex Computer Use, dan cua-driver MCP
summary: Integrasi PeekabooBridge untuk otomatisasi antarmuka pengguna macOS
title: Jembatan Peekaboo
x-i18n:
    generated_at: "2026-05-06T09:20:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw dapat meng-host **PeekabooBridge** sebagai broker otomasi UI lokal
yang sadar izin. Ini memungkinkan CLI `peekaboo` menjalankan otomasi UI sambil
menggunakan ulang izin TCC aplikasi macOS.

## Apa ini (dan bukan ini)

- **Host**: OpenClaw.app dapat bertindak sebagai host PeekabooBridge.
- **Klien**: gunakan CLI `peekaboo` (tanpa permukaan `openclaw ui ...` terpisah).
- **UI**: overlay visual tetap berada di Peekaboo.app; OpenClaw adalah host broker tipis.

## Hubungan dengan Computer Use

OpenClaw memiliki tiga jalur kontrol desktop, dan ketiganya sengaja tetap terpisah:

- **Host PeekabooBridge**: OpenClaw.app dapat meng-host soket PeekabooBridge lokal.
  CLI `peekaboo` tetap menjadi klien dan menggunakan izin macOS OpenClaw.app
  untuk primitif otomasi Peekaboo seperti tangkapan layar, klik, menu, dialog,
  tindakan Dock, dan manajemen jendela.
- **Codex Computer Use**: plugin `codex` bawaan menyiapkan server aplikasi Codex,
  memverifikasi bahwa server MCP `computer-use` Codex tersedia, lalu membiarkan
  Codex memiliki panggilan alat kontrol desktop native selama giliran mode Codex.
  OpenClaw tidak mem-proxy tindakan tersebut melalui PeekabooBridge.
- **MCP `cua-driver` langsung**: OpenClaw dapat mendaftarkan server upstream
  `cua-driver mcp` TryCua sebagai server MCP biasa. Itu memberi agen skema milik
  driver CUA dan alur kerja pid/jendela/indeks-elemen tanpa merutekan melalui
  marketplace Codex atau soket PeekabooBridge.

Gunakan Peekaboo saat Anda menginginkan permukaan otomasi macOS yang luas dan
host bridge OpenClaw.app yang sadar izin. Gunakan Codex Computer Use saat agen
mode Codex harus mengandalkan plugin computer-use native Codex. Gunakan
`cua-driver mcp` langsung saat Anda ingin driver CUA diekspos ke runtime yang
dikelola OpenClaw sebagai server MCP biasa.

## Aktifkan bridge

Di aplikasi macOS:

- Pengaturan → **Aktifkan Peekaboo Bridge**

Saat diaktifkan, OpenClaw memulai server soket UNIX lokal. Jika dinonaktifkan,
host dihentikan dan `peekaboo` akan kembali ke host lain yang tersedia.

## Urutan penemuan klien

Klien Peekaboo biasanya mencoba host dalam urutan ini:

1. Peekaboo.app (UX lengkap)
2. Claude.app (jika terpasang)
3. OpenClaw.app (broker tipis)

Gunakan `peekaboo bridge status --verbose` untuk melihat host mana yang aktif dan
path soket mana yang sedang digunakan. Anda dapat mengganti dengan:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Keamanan dan izin

- Bridge memvalidasi **tanda tangan kode pemanggil**; allowlist TeamID
  diberlakukan (TeamID host Peekaboo + TeamID aplikasi OpenClaw).
- Permintaan timeout setelah ~10 detik.
- Jika izin yang diperlukan tidak ada, bridge mengembalikan pesan kesalahan yang jelas
  alih-alih meluncurkan Pengaturan Sistem.

## Perilaku snapshot (otomasi)

Snapshot disimpan dalam memori dan kedaluwarsa secara otomatis setelah jendela singkat.
Jika Anda membutuhkan retensi yang lebih lama, ambil ulang dari klien.

## Pemecahan masalah

- Jika `peekaboo` melaporkan "bridge client is not authorized", pastikan klien
  ditandatangani dengan benar atau jalankan host dengan `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  hanya dalam mode **debug**.
- Jika tidak ada host yang ditemukan, buka salah satu aplikasi host (Peekaboo.app atau OpenClaw.app)
  dan konfirmasi bahwa izin telah diberikan.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [izin macOS](/id/platforms/mac/permissions)
