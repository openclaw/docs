---
read_when:
    - Membangun atau men-debug klien node (mode node iOS/Android/macOS)
    - Menyelidiki kegagalan pairing atau auth bridge
    - Mengaudit permukaan node yang diekspos oleh gateway
summary: 'Protokol bridge historis (node lama): TCP JSONL, pairing, RPC bercakupan'
title: Protokol Bridge
x-i18n:
    generated_at: "2026-04-05T13:52:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bc25c388f3d65944167d05ca78f987c84ca480f0213e3485b118ebf4858c50f
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Protokol bridge (transport node lama)

<Warning>
Bridge TCP telah **dihapus**. Build OpenClaw saat ini tidak lagi menyertakan listener bridge dan kunci konfigurasi `bridge.*` tidak lagi ada dalam skema. Halaman ini dipertahankan hanya sebagai referensi historis. Gunakan [Protokol Gateway](/gateway/protocol) untuk semua klien node/operator.
</Warning>

## Mengapa ini pernah ada

- **Batas keamanan**: bridge mengekspos allowlist kecil, bukan
  seluruh permukaan API gateway.
- **Pairing + identitas node**: penerimaan node dimiliki oleh gateway dan terikat
  ke token per-node.
- **UX discovery**: node dapat menemukan gateway melalui Bonjour di LAN, atau terhubung
  langsung melalui tailnet.
- **Loopback WS**: control plane WS penuh tetap lokal kecuali ditunnelkan melalui SSH.

## Transport

- TCP, satu objek JSON per baris (JSONL).
- TLS opsional (saat `bridge.tls.enabled` bernilai true).
- Port listener default historis adalah `18790` (build saat ini tidak memulai
  bridge TCP).

Saat TLS diaktifkan, record TXT discovery menyertakan `bridgeTls=1` plus
`bridgeTlsSha256` sebagai petunjuk non-secret. Perhatikan bahwa record TXT Bonjour/mDNS tidak
diautentikasi; klien tidak boleh memperlakukan fingerprint yang diiklankan sebagai
pin otoritatif tanpa niat eksplisit dari pengguna atau verifikasi out-of-band lainnya.

## Handshake + pairing

1. Klien mengirim `hello` dengan metadata node + token (jika sudah paired).
2. Jika belum paired, gateway membalas `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klien mengirim `pair-request`.
4. Gateway menunggu persetujuan, lalu mengirim `pair-ok` dan `hello-ok`.

Secara historis, `hello-ok` mengembalikan `serverName` dan dapat menyertakan
`canvasHostUrl`.

## Frame

Klien → Gateway:

- `req` / `res`: RPC gateway bercakupan (chat, sessions, config, health, voicewake, skills.bins)
- `event`: sinyal node (transkrip suara, permintaan agen, subscribe chat, siklus hidup exec)

Gateway → Klien:

- `invoke` / `invoke-res`: perintah node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: pembaruan chat untuk sesi yang disubscribe
- `ping` / `pong`: keepalive

Penegakan allowlist lama berada di `src/gateway/server-bridge.ts` (sudah dihapus).

## Event siklus hidup exec

Node dapat mengirim event `exec.finished` atau `exec.denied` untuk menampilkan aktivitas system.run.
Event ini dipetakan ke event sistem di gateway. (Node lama mungkin masih mengirim `exec.started`.)

Field payload (semua opsional kecuali yang ditandai):

- `sessionKey` (wajib): sesi agen yang akan menerima event sistem.
- `runId`: id exec unik untuk pengelompokan.
- `command`: string perintah mentah atau yang sudah diformat.
- `exitCode`, `timedOut`, `success`, `output`: detail penyelesaian (hanya finished).
- `reason`: alasan penolakan (hanya denied).

## Penggunaan tailnet historis

- Bind bridge ke IP tailnet: `bridge.bind: "tailnet"` di
  `~/.openclaw/openclaw.json` (hanya historis; `bridge.*` tidak lagi valid).
- Klien terhubung melalui nama MagicDNS atau IP tailnet.
- Bonjour **tidak** melintasi jaringan; gunakan host/port manual atau DNS‑SD area luas
  bila diperlukan.

## Versioning

Bridge adalah **v1 implisit** (tanpa negosiasi min/max). Bagian ini
hanya referensi historis; klien node/operator saat ini menggunakan WebSocket
[Protokol Gateway](/gateway/protocol).
