---
read_when:
    - Membangun atau men-debug klien node (mode node iOS/Android/macOS)
    - Menyelidiki kegagalan pairing atau auth bridge
    - Mengaudit permukaan node yang diekspos oleh Gateway
summary: 'Protokol bridge historis (node lama): TCP JSONL, pairing, RPC bercakupan'
title: Protokol bridge
x-i18n:
    generated_at: "2026-04-24T09:06:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Protokol bridge (transport node lama)

<Warning>
Bridge TCP telah **dihapus**. Build OpenClaw saat ini tidak lagi menyertakan listener bridge dan kunci konfigurasi `bridge.*` sudah tidak ada lagi di skema. Halaman ini dipertahankan hanya untuk referensi historis. Gunakan [Protokol Gateway](/id/gateway/protocol) untuk semua klien node/operator.
</Warning>

## Mengapa ini ada

- **Batas keamanan**: bridge mengekspos allowlist kecil alih-alih
  seluruh permukaan API Gateway.
- **Pairing + identitas node**: penerimaan node dimiliki oleh Gateway dan terikat
  ke token per node.
- **UX discovery**: node dapat menemukan Gateway melalui Bonjour di LAN, atau terhubung
  langsung melalui tailnet.
- **Loopback WS**: control plane WS penuh tetap lokal kecuali ditunnel melalui SSH.

## Transport

- TCP, satu objek JSON per baris (JSONL).
- TLS opsional (saat `bridge.tls.enabled` bernilai true).
- Port listener default historis adalah `18790` (build saat ini tidak memulai
  bridge TCP).

Saat TLS diaktifkan, record TXT discovery menyertakan `bridgeTls=1` plus
`bridgeTlsSha256` sebagai petunjuk non-rahasia. Perhatikan bahwa record TXT Bonjour/mDNS tidak
terautentikasi; klien tidak boleh memperlakukan fingerprint yang diiklankan sebagai pin
otoritatif tanpa niat pengguna yang eksplisit atau verifikasi lain di luar jalur.

## Handshake + pairing

1. Klien mengirim `hello` dengan metadata node + token (jika sudah dipairing).
2. Jika belum dipairing, Gateway membalas `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klien mengirim `pair-request`.
4. Gateway menunggu persetujuan, lalu mengirim `pair-ok` dan `hello-ok`.

Secara historis, `hello-ok` mengembalikan `serverName` dan dapat menyertakan
`canvasHostUrl`.

## Frame

Klien → Gateway:

- `req` / `res`: RPC Gateway bercakupan (chat, sessions, config, health, voicewake, skills.bins)
- `event`: sinyal node (transkrip suara, permintaan agen, langganan chat, siklus hidup exec)

Gateway → Klien:

- `invoke` / `invoke-res`: perintah node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: pembaruan chat untuk sesi yang dilanggani
- `ping` / `pong`: keepalive

Penegakan allowlist lama berada di `src/gateway/server-bridge.ts` (sudah dihapus).

## Event siklus hidup exec

Node dapat mengeluarkan event `exec.finished` atau `exec.denied` untuk menampilkan aktivitas system.run.
Event ini dipetakan ke event sistem di Gateway. (Node lama mungkin masih mengeluarkan `exec.started`.)

Field payload (semuanya opsional kecuali dinyatakan lain):

- `sessionKey` (wajib): sesi agen yang akan menerima event sistem.
- `runId`: id exec unik untuk pengelompokan.
- `command`: string perintah mentah atau yang sudah diformat.
- `exitCode`, `timedOut`, `success`, `output`: detail penyelesaian (hanya untuk finished).
- `reason`: alasan penolakan (hanya untuk denied).

## Penggunaan tailnet historis

- Bind bridge ke IP tailnet: `bridge.bind: "tailnet"` di
  `~/.openclaw/openclaw.json` (hanya historis; `bridge.*` sudah tidak valid lagi).
- Klien terhubung melalui nama MagicDNS atau IP tailnet.
- Bonjour **tidak** melintasi jaringan; gunakan host/port manual atau DNS‑SD area luas
  bila diperlukan.

## Pembuatan versi

Bridge adalah **v1 implisit** (tanpa negosiasi min/max). Bagian ini
hanya referensi historis; klien node/operator saat ini menggunakan WebSocket
[Protokol Gateway](/id/gateway/protocol).

## Terkait

- [Protokol Gateway](/id/gateway/protocol)
- [Node](/id/nodes)
