---
read_when:
    - Menyunting kontrak IPC atau IPC aplikasi bilah menu
summary: Arsitektur IPC macOS untuk aplikasi OpenClaw, transport simpul Gateway, dan PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-06-28T00:13:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Arsitektur IPC macOS OpenClaw

**Model saat ini:** socket Unix lokal menghubungkan **layanan host node** ke **aplikasi macOS** untuk persetujuan exec + `system.run`. CLI debug `openclaw-mac` tersedia untuk pemeriksaan penemuan/koneksi; tindakan agen tetap mengalir melalui WebSocket Gateway dan `node.invoke`. Otomatisasi UI menggunakan PeekabooBridge.

## Tujuan

- Satu instans aplikasi GUI yang memiliki semua pekerjaan yang berhadapan dengan TCC (notifikasi, perekaman layar, mikrofon, ucapan, AppleScript).
- Permukaan kecil untuk otomatisasi: Gateway + perintah node, plus PeekabooBridge untuk otomatisasi UI.
- Izin yang dapat diprediksi: selalu ID bundle bertanda tangan yang sama, diluncurkan oleh launchd, sehingga pemberian TCC tetap melekat.

## Cara kerjanya

### Gateway + transport node

- Aplikasi menjalankan Gateway (mode lokal) dan terhubung kepadanya sebagai node.
- Tindakan agen dijalankan melalui `node.invoke` (mis. `system.run`, `system.notify`, `canvas.*`).
- Perintah node Mac umum mencakup `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run`, dan `system.notify`.
- Node melaporkan peta `permissions` sehingga agen dapat melihat apakah akses layar,
  kamera, mikrofon, ucapan, otomatisasi, atau aksesibilitas tersedia.

### Layanan node + IPC aplikasi

- Layanan host node tanpa headless terhubung ke WebSocket Gateway.
- Permintaan `system.run` diteruskan ke aplikasi macOS melalui socket Unix lokal.
- Aplikasi menjalankan exec dalam konteks UI, meminta konfirmasi jika diperlukan, dan mengembalikan output.

Diagram (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (otomatisasi UI)

- Otomatisasi UI menggunakan socket UNIX terpisah bernama `bridge.sock` dan protokol JSON PeekabooBridge.
- Urutan preferensi host (sisi klien): Peekaboo.app → Claude.app → OpenClaw.app → eksekusi lokal.
- Keamanan: host bridge memerlukan TeamID yang diizinkan; celah keluar DEBUG-only untuk UID yang sama dijaga oleh `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (konvensi Peekaboo).
- Lihat: [Penggunaan PeekabooBridge](/id/platforms/mac/peekaboo) untuk detail.

## Alur operasional

- Mulai ulang/bangun ulang: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Mematikan instans yang ada
  - Swift build + package
  - Menulis/bootstrap/kickstart LaunchAgent
- Instans tunggal: aplikasi keluar lebih awal jika instans lain dengan ID bundle yang sama sedang berjalan.

## Catatan pengerasan

- Sebaiknya mewajibkan kecocokan TeamID untuk semua permukaan berprivilege.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG-only) dapat mengizinkan pemanggil dengan UID yang sama untuk pengembangan lokal.
- Semua komunikasi tetap hanya lokal; tidak ada socket jaringan yang diekspos.
- Prompt TCC hanya berasal dari bundle aplikasi GUI; jaga ID bundle bertanda tangan tetap stabil di seluruh pembangunan ulang.
- Pengerasan IPC: mode socket `0600`, token, pemeriksaan peer-UID, tantangan/respons HMAC, TTL singkat.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Alur IPC macOS (Persetujuan exec)](/id/tools/exec-approvals-advanced#macos-ipc-flow)
