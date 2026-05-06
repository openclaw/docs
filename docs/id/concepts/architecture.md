---
read_when:
    - Mengerjakan protokol Gateway, klien, atau transport
summary: Arsitektur Gateway WebSocket, komponen, dan alur klien
title: Arsitektur Gateway
x-i18n:
    generated_at: "2026-05-06T09:06:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 433489081bfe07691b211f5076ec45ce0ed3fd043eb86128f73121f2cab71cd3
    source_path: concepts/architecture.md
    workflow: 16
---

## Gambaran umum

- Satu **Gateway** berumur panjang memiliki semua permukaan perpesanan (WhatsApp melalui
  Baileys, Telegram melalui grammY, Slack, Discord, Signal, iMessage, WebChat).
- Klien control-plane (aplikasi macOS, CLI, UI web, automasi) terhubung ke
  Gateway melalui **WebSocket** pada host bind yang dikonfigurasi (default
  `127.0.0.1:18789`).
- **Node** (macOS/iOS/Android/headless) juga terhubung melalui **WebSocket**, tetapi
  mendeklarasikan `role: node` dengan kapabilitas/perintah eksplisit.
- Satu Gateway per host; ini adalah satu-satunya tempat yang membuka sesi WhatsApp.
- **Host kanvas** disajikan oleh server HTTP Gateway di bawah:
  - `/__openclaw__/canvas/` (HTML/CSS/JS yang dapat diedit agen)
  - `/__openclaw__/a2ui/` (host A2UI)
    Ini menggunakan port yang sama dengan Gateway (default `18789`).

## Komponen dan alur

### Gateway (daemon)

- Memelihara koneksi penyedia.
- Mengekspos API WS bertipe (permintaan, respons, peristiwa server-push).
- Memvalidasi frame masuk terhadap JSON Schema.
- Memancarkan peristiwa seperti `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

### Klien (aplikasi Mac / CLI / admin web)

- Satu koneksi WS per klien.
- Mengirim permintaan (`health`, `status`, `send`, `agent`, `system-presence`).
- Berlangganan peristiwa (`tick`, `agent`, `presence`, `shutdown`).

### Node (macOS / iOS / Android / headless)

- Terhubung ke **server WS yang sama** dengan `role: node`.
- Menyediakan identitas perangkat dalam `connect`; pairing bersifat **berbasis perangkat** (role `node`) dan
  persetujuan berada di penyimpanan pairing perangkat.
- Mengekspos perintah seperti `canvas.*`, `camera.*`, `screen.record`, `location.get`.

Detail protokol:

- [Protokol Gateway](/id/gateway/protocol)

### WebChat

- UI statis yang menggunakan API WS Gateway untuk riwayat chat dan pengiriman.
- Dalam setup jarak jauh, terhubung melalui tunnel SSH/Tailscale yang sama seperti
  klien lain.

## Siklus hidup koneksi (satu klien)

```mermaid
sequenceDiagram
    participant Client
    participant Gateway

    Client->>Gateway: req:connect
    Gateway-->>Client: res (ok)
    Note right of Gateway: or res error + close
    Note left of Client: payload=hello-ok<br>snapshot: presence + health

    Gateway-->>Client: event:presence
    Gateway-->>Client: event:tick

    Client->>Gateway: req:agent
    Gateway-->>Client: res:agent<br>ack {runId, status:"accepted"}
    Gateway-->>Client: event:agent<br>(streaming)
    Gateway-->>Client: res:agent<br>final {runId, status, summary}
```

## Protokol wire (ringkasan)

- Transport: WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** `connect`.
- Setelah handshake:
  - Permintaan: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Peristiwa: `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` adalah metadata discovery, bukan
  dump tergenerasi dari setiap route helper yang dapat dipanggil.
- Auth rahasia bersama menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode auth gateway yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi auth dari header permintaan
  alih-alih `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` menonaktifkan auth rahasia bersama
  sepenuhnya; jangan gunakan mode itu pada ingress publik/tidak tepercaya.
- Kunci idempotensi diperlukan untuk metode yang memiliki efek samping (`send`, `agent`) agar
  percobaan ulang aman; server menyimpan cache deduplikasi berumur pendek.
- Node harus menyertakan `role: "node"` beserta kapabilitas/perintah/izin dalam `connect`.

## Pairing + kepercayaan lokal

- Semua klien WS (operator + node) menyertakan **identitas perangkat** pada `connect`.
- ID perangkat baru memerlukan persetujuan pairing; Gateway menerbitkan **token perangkat**
  untuk koneksi berikutnya.
- Koneksi direct local loopback dapat disetujui otomatis agar UX pada host yang sama
  tetap lancar.
- OpenClaw juga memiliki jalur self-connect backend/container-lokal yang sempit untuk
  alur helper rahasia bersama tepercaya.
- Koneksi tailnet dan LAN, termasuk bind tailnet pada host yang sama, tetap memerlukan
  persetujuan pairing eksplisit.
- Semua koneksi harus menandatangani nonce `connect.challenge`.
- Payload tanda tangan `v3` juga mengikat `platform` + `deviceFamily`; gateway
  mem-pin metadata yang dipairing saat reconnect dan memerlukan pairing perbaikan untuk perubahan
  metadata.
- Koneksi **non-lokal** tetap memerlukan persetujuan eksplisit.
- Auth Gateway (`gateway.auth.*`) tetap berlaku untuk **semua** koneksi, lokal maupun
  jarak jauh.

Detail: [Protokol Gateway](/id/gateway/protocol), [Pairing](/id/channels/pairing),
[Keamanan](/id/gateway/security).

## Pengetikan protokol dan codegen

- Skema TypeBox mendefinisikan protokol.
- JSON Schema dibuat dari skema tersebut.
- Model Swift dibuat dari JSON Schema.

## Akses jarak jauh

- Disarankan: Tailscale atau VPN.
- Alternatif: tunnel SSH

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```

- Handshake + token auth yang sama berlaku melalui tunnel.
- TLS + pinning opsional dapat diaktifkan untuk WS dalam setup jarak jauh.

## Snapshot operasi

- Mulai: `openclaw gateway` (foreground, log ke stdout).
- Health: `health` melalui WS (juga disertakan dalam `hello-ok`).
- Supervisi: launchd/systemd untuk restart otomatis.

## Invarian

- Tepat satu Gateway mengontrol satu sesi Baileys per host.
- Handshake wajib; frame pertama non-JSON atau non-connect akan ditutup paksa.
- Peristiwa tidak diputar ulang; klien harus menyegarkan saat ada gap.

## Terkait

- [Loop Agen](/id/concepts/agent-loop) — siklus eksekusi agen terperinci
- [Protokol Gateway](/id/gateway/protocol) — kontrak protokol WebSocket
- [Antrean](/id/concepts/queue) — antrean perintah dan konkurensi
- [Keamanan](/id/gateway/security) — model kepercayaan dan hardening
