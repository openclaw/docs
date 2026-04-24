---
read_when:
    - Mengedit kontrak IPC atau IPC aplikasi menu bar
summary: Arsitektur IPC macOS untuk aplikasi OpenClaw, transport node gateway, dan PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-04-24T09:17:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Arsitektur IPC macOS OpenClaw

**Model saat ini:** socket Unix lokal menghubungkan **layanan host node** ke **aplikasi macOS** untuk persetujuan exec + `system.run`. CLI debug `openclaw-mac` ada untuk pemeriksaan discovery/connect; aksi agen tetap mengalir melalui Gateway WebSocket dan `node.invoke`. Otomasi UI menggunakan PeekabooBridge.

## Tujuan

- Satu instans aplikasi GUI yang memiliki semua pekerjaan yang berhadapan dengan TCC (notifikasi, perekaman layar, mikrofon, speech, AppleScript).
- Surface kecil untuk otomasi: Gateway + perintah node, ditambah PeekabooBridge untuk otomasi UI.
- Izin yang dapat diprediksi: selalu bundle ID bertandatangan yang sama, diluncurkan oleh launchd, sehingga pemberian TCC tetap melekat.

## Cara kerjanya

### Gateway + transport node

- Aplikasi menjalankan Gateway (mode lokal) dan terhubung ke sana sebagai node.
- Aksi agen dilakukan melalui `node.invoke` (misalnya `system.run`, `system.notify`, `canvas.*`).

### Layanan node + IPC aplikasi

- Layanan host node headless terhubung ke Gateway WebSocket.
- Permintaan `system.run` diteruskan ke aplikasi macOS melalui socket Unix lokal.
- Aplikasi menjalankan exec dalam konteks UI, menampilkan prompt jika diperlukan, dan mengembalikan output.

Diagram (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (otomasi UI)

- Otomasi UI menggunakan socket UNIX terpisah bernama `bridge.sock` dan protokol JSON PeekabooBridge.
- Urutan preferensi host (sisi klien): Peekaboo.app → Claude.app → OpenClaw.app → eksekusi lokal.
- Keamanan: host bridge memerlukan TeamID yang diizinkan; jalur keluar DEBUG-only dengan UID yang sama dijaga oleh `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (konvensi Peekaboo).
- Lihat: [penggunaan PeekabooBridge](/id/platforms/mac/peekaboo) untuk detail.

## Alur operasional

- Restart/rebuild: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Mematikan instans yang ada
  - Build + package Swift
  - Menulis/bootstrap/kickstart LaunchAgent
- Instans tunggal: aplikasi keluar lebih awal jika instans lain dengan bundle ID yang sama sedang berjalan.

## Catatan hardening

- Sebaiknya mewajibkan kecocokan TeamID untuk semua surface dengan hak istimewa.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (hanya DEBUG) dapat mengizinkan pemanggil dengan UID yang sama untuk pengembangan lokal.
- Semua komunikasi tetap hanya lokal; tidak ada socket jaringan yang diekspos.
- Prompt TCC hanya berasal dari bundle aplikasi GUI; pertahankan bundle ID bertandatangan tetap stabil di beberapa build ulang.
- Hardening IPC: mode socket `0600`, token, pemeriksaan peer-UID, challenge/response HMAC, TTL pendek.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Alur IPC macOS (Persetujuan exec)](/id/tools/exec-approvals-advanced#macos-ipc-flow)
