---
read_when:
    - Menghosting PeekabooBridge di OpenClaw.app
    - Mengintegrasikan Peekaboo melalui Swift Package Manager
    - Mengubah protokol/jalur PeekabooBridge
    - Menentukan pilihan antara PeekabooBridge, Codex Computer Use, dan cua-driver MCP
summary: Integrasi PeekabooBridge untuk otomatisasi UI macOS
title: Jembatan Peekaboo
x-i18n:
    generated_at: "2026-07-12T14:21:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw dapat menghosting **PeekabooBridge** sebagai broker otomatisasi UI lokal yang sadar izin (`PeekabooBridgeHostCoordinator`, didukung oleh paket Swift `steipete/Peekaboo`). Hal ini memungkinkan CLI `peekaboo` menjalankan otomatisasi UI sambil menggunakan kembali izin TCC aplikasi macOS.

## Apa ini (dan apa yang bukan)

- **Host**: OpenClaw.app dapat bertindak sebagai host PeekabooBridge.
- **Klien**: CLI `peekaboo` (tidak ada antarmuka `openclaw ui ...` terpisah).
- **UI**: hamparan visual tetap berada di Peekaboo.app; OpenClaw adalah host broker ringan.

## Hubungan dengan jalur kontrol desktop lainnya

OpenClaw memiliki empat jalur kontrol desktop yang sengaja dipisahkan:

- **Host PeekabooBridge**: OpenClaw.app menghosting soket PeekabooBridge lokal. CLI `peekaboo` bertindak sebagai klien dan menggunakan izin macOS milik OpenClaw.app untuk tangkapan layar, klik, menu, dialog, tindakan Dock, dan pengelolaan jendela.
- **Penggunaan komputer yang digerakkan agen (`computer.act`)**: alat `computer` bawaan agen Gateway mengambil tangkapan layar melalui `screen.snapshot` serta mengendalikan penunjuk dan papan ketik melalui perintah Node berbahaya `computer.act`. Node macOS menjalankan `computer.act` dalam proses menggunakan layanan otomatisasi Peekaboo tersemat yang diekspos oleh jembatan ini beserta primitif CoreGraphics terbatas, tanpa melalui soket PeekabooBridge atau CLI `peekaboo`. Lihat [Penggunaan komputer](/nodes/computer-use).
- **Penggunaan Komputer Codex**: Plugin `codex` bawaan memeriksa dan dapat memasang Plugin MCP `computer-use` milik Codex (`extensions/codex/src/app-server/computer-use.ts`), lalu memungkinkan Codex mengendalikan pemanggilan alat kontrol desktop native selama giliran mode Codex. OpenClaw tidak memproksikan tindakan tersebut melalui PeekabooBridge.
- **MCP `cua-driver` langsung**: OpenClaw dapat mendaftarkan server hulu `cua-driver mcp` milik TryCua sebagai server MCP biasa, sehingga memberikan skema milik driver CUA serta alur kerja pid/jendela/indeks-elemen kepada agen tanpa merutekannya melalui marketplace Codex atau soket PeekabooBridge.

Gunakan Peekaboo untuk cakupan otomatisasi macOS yang luas melalui host jembatan sadar izin milik OpenClaw.app. Gunakan penggunaan komputer yang digerakkan agen ketika agen Gateway harus dapat melihat dan mengendalikan desktop melalui perintah Node `computer.act` seragam yang dapat dijalankan oleh model visi apa pun. Gunakan Penggunaan Komputer Codex ketika agen mode Codex harus mengandalkan Plugin native Codex. Gunakan `cua-driver mcp` langsung untuk mengekspos driver CUA kepada runtime apa pun yang dikelola OpenClaw sebagai server MCP biasa.

## Mengaktifkan jembatan

Di aplikasi macOS: **Settings -> Enable Peekaboo Bridge**.

Saat diaktifkan, OpenClaw memulai server soket UNIX lokal di `~/Library/Application Support/OpenClaw/<socket-name>`. Jika dinonaktifkan, host berhenti dan `peekaboo` beralih ke host lain yang tersedia. Koordinator juga mempertahankan symlink soket lama (`clawdbot`, `clawdis`, `moltbot` di bawah Application Support) yang menunjuk ke soket saat ini untuk instalasi `peekaboo` versi lama.

## Urutan penemuan klien

Klien Peekaboo biasanya mencoba host dalam urutan berikut:

1. Peekaboo.app (pengalaman pengguna lengkap)
2. Claude.app (jika terpasang)
3. OpenClaw.app (broker ringan)

Gunakan `peekaboo bridge status --verbose` untuk melihat host yang aktif dan jalur soket yang digunakan. Timpa dengan:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Keamanan dan izin

- Jembatan memvalidasi **tanda tangan kode pemanggil**; daftar yang diizinkan untuk TeamID diberlakukan (TeamID host Peekaboo serta TeamID aplikasi yang sedang berjalan).
- Utamakan identitas jembatan/aplikasi yang ditandatangani daripada runtime `node` generik untuk Aksesibilitas. Memberikan Aksesibilitas kepada `node` memungkinkan paket apa pun yang diluncurkan oleh executable Node tersebut mewarisi akses otomatisasi GUI; lihat [izin macOS](/id/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Waktu permintaan habis setelah 10 detik (`requestTimeoutSec: 10`).
- Jika izin yang diperlukan tidak tersedia, jembatan mengembalikan pesan galat yang jelas alih-alih membuka System Settings.

## Perilaku snapshot (otomatisasi)

Snapshot disimpan dalam memori dengan masa berlaku 10 menit dan batas 50 snapshot (`InMemorySnapshotManager`); artefak tidak dihapus saat pembersihan. Jika memerlukan penyimpanan lebih lama, ambil ulang dari klien.

## Pemecahan masalah

- Jika `peekaboo` melaporkan "klien jembatan tidak diotorisasi", pastikan klien ditandatangani dengan benar atau jalankan host dengan `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` hanya dalam mode **debug**.
- Jika tidak ada host yang ditemukan, buka salah satu aplikasi host (Peekaboo.app atau OpenClaw.app) dan pastikan izin telah diberikan.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [izin macOS](/id/platforms/mac/permissions)
