---
read_when:
    - Menghosting PeekabooBridge di OpenClaw.app
    - Mengintegrasikan Peekaboo melalui Swift Package Manager
    - Mengubah protokol/jalur PeekabooBridge
    - Memilih antara PeekabooBridge, Codex Computer Use, dan cua-driver MCP
summary: Integrasi PeekabooBridge untuk otomatisasi UI macOS
title: Jembatan Peekaboo
x-i18n:
    generated_at: "2026-06-27T17:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw dapat meng-host **PeekabooBridge** sebagai broker otomatisasi UI lokal yang sadar izin. Ini memungkinkan CLI `peekaboo` menjalankan otomatisasi UI sambil menggunakan kembali izin TCC aplikasi macOS.

## Apa ini (dan bukan)

- **Host**: OpenClaw.app dapat bertindak sebagai host PeekabooBridge.
- **Klien**: gunakan CLI `peekaboo` (tanpa permukaan `openclaw ui ...` terpisah).
- **UI**: overlay visual tetap berada di Peekaboo.app; OpenClaw adalah host broker tipis.

## Hubungan dengan Penggunaan Komputer

OpenClaw memiliki tiga jalur kontrol desktop, dan ketiganya sengaja tetap terpisah:

- **Host PeekabooBridge**: OpenClaw.app dapat meng-host soket PeekabooBridge lokal.
  CLI `peekaboo` tetap menjadi klien dan menggunakan izin macOS OpenClaw.app
  untuk primitif otomatisasi Peekaboo seperti tangkapan layar, klik,
  menu, dialog, aksi Dock, dan manajemen jendela.
- **Penggunaan Komputer Codex**: plugin `codex` bawaan menyiapkan server aplikasi Codex,
  memverifikasi bahwa server MCP `computer-use` Codex tersedia, lalu membiarkan
  Codex memiliki panggilan alat kontrol desktop native selama giliran mode Codex. OpenClaw
  tidak mem-proxy aksi tersebut melalui PeekabooBridge.
- **MCP `cua-driver` langsung**: OpenClaw dapat mendaftarkan server upstream
  `cua-driver mcp` milik TryCua sebagai server MCP normal. Ini memberi agen skema milik
  driver CUA dan alur kerja pid/jendela/indeks-elemen tanpa merutekan
  melalui marketplace Codex atau soket PeekabooBridge.

Gunakan Peekaboo saat Anda menginginkan permukaan otomatisasi macOS yang luas dan host bridge
sadar izin milik OpenClaw.app. Gunakan Penggunaan Komputer Codex saat agen mode Codex
harus mengandalkan plugin penggunaan komputer native Codex. Gunakan `cua-driver mcp` langsung
saat Anda ingin driver CUA diekspos ke runtime yang dikelola OpenClaw sebagai server
MCP normal.

## Aktifkan bridge

Di aplikasi macOS:

- Pengaturan → **Aktifkan Peekaboo Bridge**

Saat diaktifkan, OpenClaw memulai server soket UNIX lokal. Jika dinonaktifkan, host
dihentikan dan `peekaboo` akan kembali menggunakan host lain yang tersedia.

## Urutan penemuan klien

Klien Peekaboo biasanya mencoba host dalam urutan ini:

1. Peekaboo.app (UX lengkap)
2. Claude.app (jika terinstal)
3. OpenClaw.app (broker tipis)

Gunakan `peekaboo bridge status --verbose` untuk melihat host mana yang aktif dan
jalur soket mana yang digunakan. Anda dapat menimpanya dengan:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Keamanan dan izin

- Bridge memvalidasi **tanda tangan kode pemanggil**; allowlist TeamID
  diberlakukan (TeamID host Peekaboo + TeamID aplikasi OpenClaw).
- Pilih identitas bridge/aplikasi yang ditandatangani dibanding runtime `node` generik untuk
  Aksesibilitas. Memberikan Aksesibilitas ke `node` memungkinkan paket apa pun yang diluncurkan oleh
  executable Node tersebut mewarisi akses otomatisasi GUI; lihat
  [izin macOS](/id/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Permintaan timeout setelah ~10 detik.
- Jika izin yang diperlukan tidak ada, bridge mengembalikan pesan kesalahan yang jelas
  alih-alih membuka Pengaturan Sistem.

## Perilaku snapshot (otomatisasi)

Snapshot disimpan di memori dan kedaluwarsa secara otomatis setelah jendela waktu yang singkat.
Jika Anda memerlukan retensi lebih lama, tangkap ulang dari klien.

## Pemecahan masalah

- Jika `peekaboo` melaporkan "bridge client is not authorized", pastikan klien
  ditandatangani dengan benar atau jalankan host dengan `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  hanya dalam mode **debug**.
- Jika tidak ada host yang ditemukan, buka salah satu aplikasi host (Peekaboo.app atau OpenClaw.app)
  dan pastikan izin telah diberikan.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [izin macOS](/id/platforms/mac/permissions)
