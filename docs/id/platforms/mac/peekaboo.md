---
read_when:
    - Menghosting PeekabooBridge di OpenClaw.app
    - Mengintegrasikan Peekaboo melalui Swift Package Manager
    - Mengubah protokol/jalur PeekabooBridge
    - Memilih antara PeekabooBridge, Codex Computer Use, dan cua-driver MCP
summary: Integrasi PeekabooBridge untuk otomatisasi UI macOS
title: Bridge Peekaboo
x-i18n:
    generated_at: "2026-07-16T18:24:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw dapat menghosting **PeekabooBridge** sebagai broker otomatisasi UI lokal yang sadar izin (`PeekabooBridgeHostCoordinator`, didukung oleh paket Swift `steipete/Peekaboo`). Ini memungkinkan CLI `peekaboo` menjalankan otomatisasi UI sambil menggunakan kembali izin TCC aplikasi macOS.

## Apa ini (dan apa yang bukan)

- **Host**: OpenClaw.app dapat bertindak sebagai host PeekabooBridge.
- **Klien**: CLI `peekaboo` (tidak ada antarmuka `openclaw ui ...` terpisah).
- **UI**: overlay visual tetap berada di Peekaboo.app; OpenClaw adalah host broker ringan.

## Hubungan dengan jalur kontrol desktop lainnya

OpenClaw memiliki empat jalur kontrol desktop yang sengaja dipisahkan:

- **Host PeekabooBridge**: OpenClaw.app menghosting soket PeekabooBridge lokal. CLI `peekaboo` bertindak sebagai klien dan menggunakan izin macOS OpenClaw.app untuk tangkapan layar, klik, menu, dialog, tindakan Dock, dan pengelolaan jendela.
- **Penggunaan komputer yang digerakkan agen (`computer.act`)**: alat `computer` bawaan agen Gateway mengambil tangkapan layar melalui `screen.snapshot` serta mengendalikan penunjuk dan papan ketik melalui perintah node `computer.act` yang berbahaya. Node macOS memenuhi `computer.act` dalam proses menggunakan layanan otomatisasi Peekaboo tertanam yang diekspos oleh bridge ini beserta primitif CoreGraphics terbatas, tanpa melalui soket PeekabooBridge atau CLI `peekaboo`. Lihat [Penggunaan komputer](/id/nodes/computer-use).
- **Penggunaan Komputer Codex**: Plugin `codex` yang disertakan memeriksa dan dapat menginstal Plugin MCP `computer-use` milik Codex (`extensions/codex/src/app-server/computer-use.ts`), lalu memungkinkan Codex menangani panggilan alat kontrol desktop native selama giliran mode Codex. OpenClaw tidak memproksikan tindakan tersebut melalui PeekabooBridge.
- **MCP `cua-driver` langsung**: OpenClaw dapat mendaftarkan server `cua-driver mcp` upstream milik TryCua sebagai server MCP biasa, sehingga agen memperoleh skema milik driver CUA dan alur kerja pid/jendela/indeks-elemen tanpa perutean melalui marketplace Codex atau soket PeekabooBridge.

Gunakan Peekaboo untuk antarmuka otomatisasi macOS yang luas melalui host bridge sadar izin milik OpenClaw.app. Gunakan penggunaan komputer yang digerakkan agen ketika agen Gateway perlu melihat dan mengendalikan desktop melalui perintah node `computer.act` seragam yang dapat dijalankan oleh model visi apa pun. Gunakan Penggunaan Komputer Codex ketika agen mode Codex perlu mengandalkan Plugin native Codex. Gunakan `cua-driver mcp` langsung untuk mengekspos driver CUA kepada runtime apa pun yang dikelola OpenClaw sebagai server MCP biasa.

## Mengaktifkan bridge

Di aplikasi macOS: **Settings -> Enable Peekaboo Bridge**. Tombol alih tersebut mengharuskan **Allow Computer Control** diaktifkan karena keduanya memberikan otomatisasi UI lokal; saat Computer Control dinonaktifkan, tombol alih tidak aktif dan host tidak berjalan. Untuk menjalankan Peekaboo tanpa Computer Control, jalankan aplikasi Mac milik Peekaboo sebagai host.

Saat diaktifkan (dan Computer Control aktif), OpenClaw memulai server soket UNIX lokal di `~/Library/Application Support/OpenClaw/<socket-name>`. Jika dinonaktifkan, host berhenti dan `peekaboo` beralih ke host lain yang tersedia. Koordinator juga memelihara symlink soket lama (`clawdbot`, `clawdis`, `moltbot` di bawah Application Support) yang mengarah ke soket saat ini untuk instalasi `peekaboo` versi lama.

## Urutan penemuan klien

Klien Peekaboo biasanya mencoba host dalam urutan berikut:

1. Peekaboo.app (UX lengkap)
2. Claude.app (jika terinstal)
3. OpenClaw.app (broker ringan)

Gunakan `peekaboo bridge status --verbose` untuk melihat host yang aktif dan jalur soket yang digunakan. Ganti dengan:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Keamanan dan izin

- Bridge memvalidasi **tanda tangan kode pemanggil**; daftar yang diizinkan untuk TeamID diberlakukan (TeamID host Peekaboo beserta TeamID milik aplikasi yang sedang berjalan).
- Utamakan identitas bridge/aplikasi yang ditandatangani daripada runtime `node` generik untuk Aksesibilitas. Memberikan Aksesibilitas kepada `node` memungkinkan paket apa pun yang dijalankan oleh executable Node tersebut mewarisi akses otomatisasi GUI; lihat [izin macOS](/id/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Permintaan mengalami waktu habis setelah 10 detik (`requestTimeoutSec: 10`).
- Jika izin yang diperlukan tidak tersedia, bridge mengembalikan pesan kesalahan yang jelas alih-alih membuka System Settings.

## Perilaku snapshot (otomatisasi)

Snapshot disimpan dalam memori dengan masa berlaku 10 menit dan batas 50 snapshot (`InMemorySnapshotManager`); artefak tidak dihapus saat pembersihan. Jika memerlukan retensi lebih lama, ambil ulang dari klien.

## Pemecahan masalah

- Jika `peekaboo` melaporkan "bridge client is not authorized", pastikan klien ditandatangani dengan benar atau jalankan host dengan `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` hanya dalam mode **debug**.
- Jika tidak ada host yang ditemukan, buka salah satu aplikasi host (Peekaboo.app atau OpenClaw.app) dan pastikan izin telah diberikan.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [izin macOS](/id/platforms/mac/permissions)
