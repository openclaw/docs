---
read_when:
    - Mengedit kontrak IPC atau IPC aplikasi bilah menu
summary: Arsitektur IPC macOS untuk aplikasi OpenClaw, transportasi node Gateway, dan PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-07-12T14:24:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Arsitektur IPC OpenClaw macOS

Soket Unix lokal menghubungkan layanan host Node ke aplikasi macOS untuk persetujuan eksekusi dan `system.run`. CLI debug `openclaw-mac` (`apps/macos/Sources/OpenClawMacCLI`) tersedia untuk pemeriksaan penemuan/koneksi; tindakan agen tetap mengalir melalui WebSocket Gateway dan `node.invoke`. Jalur `computer.act` yang didukung Node menjalankan otomatisasi Peekaboo tertanam dalam proses; klien Peekaboo mandiri menggunakan PeekabooBridge.

## Tujuan

- Satu instans aplikasi GUI yang menangani semua pekerjaan yang berinteraksi dengan TCC (notifikasi, perekaman layar, mikrofon, ucapan, AppleScript).
- Permukaan kecil untuk otomatisasi: Gateway + perintah Node, `computer.act` dalam proses, serta PeekabooBridge untuk klien otomatisasi UI mandiri.
- Izin yang dapat diprediksi: selalu menggunakan ID bundel bertanda tangan yang sama, diluncurkan oleh launchd, sehingga pemberian izin TCC tetap berlaku.

## Cara kerjanya

### Transportasi Gateway + Node

- Aplikasi menjalankan Gateway (mode lokal) dan terhubung dengannya sebagai Node.
- Tindakan agen dilakukan melalui `node.invoke` (misalnya `system.run`, `system.notify`, `canvas.*`).
- Perintah Node mencakup `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run`, dan `system.notify`.
- Node melaporkan peta `permissions` agar agen dapat melihat apakah akses layar, kamera, mikrofon, ucapan, otomatisasi, atau aksesibilitas tersedia.

### Layanan Node + IPC aplikasi

- Layanan host Node tanpa antarmuka grafis terhubung ke WebSocket Gateway.
- Permintaan `system.run` diteruskan ke aplikasi macOS melalui soket Unix lokal (`ExecApprovalsSocket.swift`).
- Aplikasi melakukan eksekusi dalam konteks UI, meminta konfirmasi jika diperlukan, dan mengembalikan keluaran.

Diagram (SCI):

```text
Agen -> Gateway -> Layanan Node (WS)
                       |  IPC (UDS + token + HMAC + TTL)
                       v
                   Aplikasi Mac (UI + TCC + system.run)
```

### PeekabooBridge (otomatisasi UI)

- Alat `computer` bawaan agen **tidak** menggunakan soket ini. Node macOS yang dipasangkan menjalankan `computer.act` dalam proses aplikasi dengan layanan Peekaboo tertanam.
- Otomatisasi UI menggunakan soket UNIX terpisah (`~/Library/Application Support/OpenClaw/<socket>`) dan protokol JSON PeekabooBridge.
- Urutan preferensi host (sisi klien): Peekaboo.app -> Claude.app -> OpenClaw.app -> eksekusi lokal.
- Keamanan: host jembatan memerlukan TeamID yang masuk daftar izin (`PeekabooBridgeHostCoordinator` bawaan mengizinkan tim tetap serta tim penandatanganan aplikasi itu sendiri); jalur darurat UID yang sama khusus DEBUG dilindungi oleh `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (konvensi Peekaboo).
- Lihat: [Penggunaan PeekabooBridge](/id/platforms/mac/peekaboo) untuk detailnya.

## Alur operasional

- Mulai ulang/bangun ulang: `scripts/restart-mac.sh` menghentikan instans yang ada, membangun ulang melalui Swift, mengemas ulang, dan meluncurkannya kembali. Skrip ini secara otomatis mendeteksi identitas penandatanganan yang tersedia dan beralih ke `--no-sign` jika tidak ada yang ditemukan; berikan `--sign` untuk mewajibkan penandatanganan (gagal jika tidak ada kunci yang tersedia) atau `--no-sign` untuk memaksakan jalur tanpa tanda tangan. `SIGN_IDENTITY` yang ditetapkan di lingkungan akan dihapus pada jalur bertanda tangan, sehingga deteksi otomatis identitas milik `scripts/codesign-mac-app.sh` memilih sertifikat tersebut.
- Instans tunggal: aplikasi memeriksa `NSWorkspace.runningApplications` untuk ID bundel duplikat dan keluar jika ditemukan lebih dari satu instans (`isDuplicateInstance()` dalam `MenuBar.swift`).

## Catatan penguatan keamanan

- Sebaiknya wajibkan kecocokan TeamID untuk semua permukaan dengan hak istimewa.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (khusus DEBUG) dapat mengizinkan pemanggil dengan UID yang sama untuk pengembangan lokal.
- Semua komunikasi tetap hanya lokal; tidak ada soket jaringan yang diekspos.
- Permintaan TCC hanya berasal dari bundel aplikasi GUI; pertahankan kestabilan ID bundel bertanda tangan di seluruh proses pembangunan ulang.
- Penguatan soket persetujuan eksekusi: mode berkas `0600`, token bersama, pemeriksaan UID rekan (`getpeereid`), tantangan/respons HMAC-SHA256, dan TTL singkat pada permintaan.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Alur IPC macOS (persetujuan eksekusi)](/id/tools/exec-approvals-advanced#macos-ipc-flow)
