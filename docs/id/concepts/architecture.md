---
read_when:
    - Mengerjakan protokol gateway, klien, atau transport
summary: Arsitektur gateway WebSocket, komponen, dan alur klien
title: Arsitektur gateway
x-i18n:
    generated_at: "2026-04-24T09:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91c553489da18b6ad83fc860014f5bfb758334e9789cb7893d4d00f81c650f02
    source_path: concepts/architecture.md
    workflow: 15
---

## Ikhtisar

- Satu **Gateway** berumur panjang memiliki semua permukaan pesan (WhatsApp melalui
  Baileys, Telegram melalui grammY, Slack, Discord, Signal, iMessage, WebChat).
- Klien control-plane (aplikasi macOS, CLI, UI web, otomatisasi) terhubung ke
  Gateway melalui **WebSocket** pada host bind yang dikonfigurasi (default
  `127.0.0.1:18789`).
- **Node** (macOS/iOS/Android/headless) juga terhubung melalui **WebSocket**, tetapi
  mendeklarasikan `role: node` dengan caps/perintah eksplisit.
- Satu Gateway per host; ini adalah satu-satunya tempat yang membuka sesi WhatsApp.
- **Canvas host** disajikan oleh server HTTP Gateway di bawah:
  - `/__openclaw__/canvas/` (HTML/CSS/JS yang dapat diedit agen)
  - `/__openclaw__/a2ui/` (host A2UI)
    Ini menggunakan port yang sama dengan Gateway (default `18789`).

## Komponen dan alur

### Gateway (daemon)

- Memelihara koneksi provider.
- Mengekspos API WS bertipe (permintaan, respons, peristiwa server-push).
- Memvalidasi frame masuk terhadap JSON Schema.
- Memancarkan peristiwa seperti `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

### Klien (aplikasi mac / CLI / admin web)

- Satu koneksi WS per klien.
- Mengirim permintaan (`health`, `status`, `send`, `agent`, `system-presence`).
- Berlangganan ke peristiwa (`tick`, `agent`, `presence`, `shutdown`).

### Node (macOS / iOS / Android / headless)

- Terhubung ke **server WS yang sama** dengan `role: node`.
- Menyediakan identitas perangkat di `connect`; pairing berbasis **perangkat** (role `node`) dan
  persetujuan berada di penyimpanan pairing perangkat.
- Mengekspos perintah seperti `canvas.*`, `camera.*`, `screen.record`, `location.get`.

Detail protokol:

- [Protokol Gateway](/id/gateway/protocol)

### WebChat

- UI statis yang menggunakan API WS Gateway untuk riwayat chat dan pengiriman.
- Dalam penyiapan jarak jauh, terhubung melalui tunnel SSH/Tailscale yang sama seperti
  klien lain.

## Siklus hidup koneksi (satu klien)

```mermaid
sequenceDiagram
    participant Client
    participant Gateway

    Client->>Gateway: req:connect
    Gateway-->>Client: res (ok)
    Note right of Gateway: atau res error + close
    Note left of Client: payload=hello-ok<br>snapshot: presence + health

    Gateway-->>Client: event:presence
    Gateway-->>Client: event:tick

    Client->>Gateway: req:agent
    Gateway-->>Client: res:agent<br>ack {runId, status:"accepted"}
    Gateway-->>Client: event:agent<br>(streaming)
    Gateway-->>Client: res:agent<br>final {runId, status, summary}
```

## Wire protocol (ringkasan)

- Transport: WebSocket, frame teks dengan payload JSON.
- Frame pertama **harus** `connect`.
- Setelah handshake:
  - Permintaan: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Peristiwa: `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` adalah metadata discovery, bukan
  dump yang dihasilkan dari setiap rute helper yang dapat dipanggil.
- Autentikasi shared-secret menggunakan `connect.params.auth.token` atau
  `connect.params.auth.password`, bergantung pada mode autentikasi gateway yang dikonfigurasi.
- Mode yang membawa identitas seperti Tailscale Serve
  (`gateway.auth.allowTailscale: true`) atau non-loopback
  `gateway.auth.mode: "trusted-proxy"` memenuhi autentikasi dari header permintaan
  alih-alih `connect.params.auth.*`.
- Ingress privat `gateway.auth.mode: "none"` menonaktifkan autentikasi shared-secret
  sepenuhnya; jangan gunakan mode ini pada ingress publik/tidak tepercaya.
- Kunci idempotensi diperlukan untuk metode yang memiliki efek samping (`send`, `agent`) agar
  dapat diulang dengan aman; server menyimpan cache deduplikasi berumur pendek.
- Node harus menyertakan `role: "node"` ditambah caps/perintah/izin di `connect`.

## Pairing + kepercayaan lokal

- Semua klien WS (operator + Node) menyertakan **identitas perangkat** pada `connect`.
- ID perangkat baru memerlukan persetujuan pairing; Gateway menerbitkan **token perangkat**
  untuk koneksi berikutnya.
- Koneksi loopback lokal langsung dapat disetujui otomatis agar UX pada host yang sama tetap
  mulus.
- OpenClaw juga memiliki jalur self-connect backend/container-local sempit untuk
  alur helper shared-secret tepercaya.
- Koneksi tailnet dan LAN, termasuk bind tailnet host yang sama, tetap memerlukan
  persetujuan pairing eksplisit.
- Semua koneksi harus menandatangani nonce `connect.challenge`.
- Payload tanda tangan `v3` juga mengikat `platform` + `deviceFamily`; gateway
  menyematkan metadata yang dipasangkan saat reconnect dan memerlukan pairing perbaikan untuk perubahan metadata.
- Koneksi **non-lokal** tetap memerlukan persetujuan eksplisit.
- Autentikasi Gateway (`gateway.auth.*`) tetap berlaku untuk **semua** koneksi, lokal maupun
  jarak jauh.

Detail: [Protokol Gateway](/id/gateway/protocol), [Pairing](/id/channels/pairing),
[Keamanan](/id/gateway/security).

## Pengetikan protokol dan codegen

- Skema TypeBox mendefinisikan protokol.
- JSON Schema dihasilkan dari skema tersebut.
- Model Swift dihasilkan dari JSON Schema.

## Akses jarak jauh

- Disarankan: Tailscale atau VPN.
- Alternatif: tunnel SSH

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```

- Handshake + token autentikasi yang sama berlaku melalui tunnel.
- TLS + pinning opsional dapat diaktifkan untuk WS dalam penyiapan jarak jauh.

## Snapshot operasi

- Mulai: `openclaw gateway` (foreground, log ke stdout).
- Kesehatan: `health` melalui WS (juga disertakan dalam `hello-ok`).
- Supervisi: launchd/systemd untuk restart otomatis.

## Invarian

- Tepat satu Gateway mengendalikan satu sesi Baileys per host.
- Handshake wajib; frame pertama yang bukan JSON atau bukan `connect` akan langsung ditutup.
- Peristiwa tidak diputar ulang; klien harus menyegarkan pada gap.

## Terkait

- [Agent Loop](/id/concepts/agent-loop) — siklus eksekusi agen secara rinci
- [Protokol Gateway](/id/gateway/protocol) — kontrak protokol WebSocket
- [Queue](/id/concepts/queue) — antrean perintah dan konkurensi
- [Keamanan](/id/gateway/security) — model kepercayaan dan hardening
