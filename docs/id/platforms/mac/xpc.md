---
read_when:
    - Mengedit kontrak IPC atau IPC app menu bar
summary: Arsitektur IPC macOS untuk app OpenClaw, transport node gateway, dan PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-04-05T14:00:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Arsitektur IPC macOS OpenClaw

**Model saat ini:** Unix socket lokal menghubungkan **layanan host node** ke **app macOS** untuk persetujuan exec + `system.run`. CLI debug `openclaw-mac` tersedia untuk pemeriksaan discovery/connect; tindakan agen tetap mengalir melalui Gateway WebSocket dan `node.invoke`. Otomasi UI menggunakan PeekabooBridge.

## Tujuan

- Satu instance app GUI yang memiliki semua pekerjaan yang berhubungan dengan TCC (notifikasi, perekaman layar, mic, ucapan, AppleScript).
- Permukaan kecil untuk otomasi: Gateway + command node, ditambah PeekabooBridge untuk otomasi UI.
- Izin yang dapat diprediksi: selalu menggunakan bundle ID bertanda tangan yang sama, diluncurkan oleh launchd, sehingga grant TCC tetap melekat.

## Cara kerjanya

### Gateway + transport node

- App menjalankan Gateway (mode local) dan terhubung ke sana sebagai node.
- Tindakan agen dilakukan melalui `node.invoke` (misalnya `system.run`, `system.notify`, `canvas.*`).

### Layanan node + IPC app

- Layanan host node headless terhubung ke Gateway WebSocket.
- Permintaan `system.run` diteruskan ke app macOS melalui Unix socket lokal.
- App menjalankan exec dalam konteks UI, menampilkan prompt jika perlu, dan mengembalikan output.

Diagram (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (otomasi UI)

- Otomasi UI menggunakan UNIX socket terpisah bernama `bridge.sock` dan protokol JSON PeekabooBridge.
- Urutan preferensi host (sisi klien): Peekaboo.app → Claude.app → OpenClaw.app → eksekusi lokal.
- Keamanan: host bridge memerlukan TeamID yang diizinkan; jalur keluar same-UID khusus DEBUG dijaga oleh `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (konvensi Peekaboo).
- Lihat: [penggunaan PeekabooBridge](/platforms/mac/peekaboo) untuk detail.

## Alur operasional

- Restart/rebuild: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Menghentikan instance yang ada
  - Swift build + package
  - Menulis/bootstrap/kickstart LaunchAgent
- Instance tunggal: app keluar lebih awal jika instance lain dengan bundle ID yang sama sedang berjalan.

## Catatan hardening

- Sebaiknya mewajibkan kecocokan TeamID untuk semua permukaan berhak istimewa.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (khusus DEBUG) dapat mengizinkan pemanggil same-UID untuk pengembangan lokal.
- Semua komunikasi tetap hanya lokal; tidak ada network socket yang diekspos.
- Prompt TCC hanya berasal dari bundle app GUI; pertahankan bundle ID bertanda tangan tetap stabil di seluruh rebuild.
- Hardening IPC: mode socket `0600`, token, pemeriksaan peer-UID, challenge/response HMAC, TTL pendek.
