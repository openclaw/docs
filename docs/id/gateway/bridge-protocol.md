---
read_when:
    - Membangun atau men-debug klien Node (mode Node iOS/Android/macOS)
    - Menyelidiki kegagalan autentikasi penyandingan atau penghubung
    - Mengaudit permukaan Node yang diekspos oleh Gateway
summary: 'Protokol jembatan historis (node lama): TCP JSONL, pemasangan, RPC bercakupan'
title: Protokol jembatan
x-i18n:
    generated_at: "2026-05-06T17:55:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Bridge TCP telah **dihapus**. Build OpenClaw saat ini tidak menyertakan listener bridge dan kunci konfigurasi `bridge.*` tidak lagi ada dalam skema. Halaman ini dipertahankan hanya sebagai referensi historis. Gunakan [Gateway Protocol](/id/gateway/protocol) untuk semua klien Node/operator.
</Warning>

## Mengapa ini ada

- **Batas keamanan**: bridge mengekspos allowlist kecil alih-alih
  seluruh permukaan API gateway.
- **Pairing + identitas Node**: penerimaan Node dimiliki oleh gateway dan diikat
  ke token per Node.
- **UX penemuan**: Node dapat menemukan gateway melalui Bonjour di LAN, atau terhubung
  langsung melalui tailnet.
- **Loopback WS**: control plane WS penuh tetap lokal kecuali ditunnel melalui SSH.

## Transport

- TCP, satu objek JSON per baris (JSONL).
- TLS opsional (ketika `bridge.tls.enabled` bernilai true).
- Port listener default historis adalah `18790` (build saat ini tidak memulai
  bridge TCP).

Ketika TLS diaktifkan, catatan TXT penemuan menyertakan `bridgeTls=1` plus
`bridgeTlsSha256` sebagai petunjuk non-rahasia. Perhatikan bahwa catatan TXT Bonjour/mDNS
tidak diautentikasi; klien tidak boleh memperlakukan fingerprint yang diiklankan sebagai
pin otoritatif tanpa maksud pengguna yang eksplisit atau verifikasi out-of-band lainnya.

## Handshake + pairing

1. Klien mengirim `hello` dengan metadata Node + token (jika sudah dipairing).
2. Jika belum dipairing, gateway membalas `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klien mengirim `pair-request`.
4. Gateway menunggu persetujuan, lalu mengirim `pair-ok` dan `hello-ok`.

Secara historis, `hello-ok` mengembalikan `serverName` dan dapat menyertakan
`canvasHostUrl`.

## Frame

Klien → Gateway:

- `req` / `res`: RPC gateway berscope (chat, sessions, config, health, voicewake, skills.bins)
- `event`: sinyal Node (transkrip suara, permintaan agent, berlangganan chat, siklus hidup exec)

Gateway → Klien:

- `invoke` / `invoke-res`: perintah Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: pembaruan chat untuk sesi yang dilanggan
- `ping` / `pong`: keepalive

Penegakan allowlist legacy berada di `src/gateway/server-bridge.ts` (dihapus).

## Event siklus hidup exec

Node dapat memancarkan event `exec.finished` atau `exec.denied` untuk menampilkan aktivitas system.run.
Ini dipetakan ke event sistem di gateway. (Node legacy mungkin masih memancarkan `exec.started`.)

Field payload (semua opsional kecuali disebutkan):

- `sessionKey` (wajib): sesi agent yang menerima event sistem.
- `runId`: id exec unik untuk pengelompokan.
- `command`: string perintah mentah atau terformat.
- `exitCode`, `timedOut`, `success`, `output`: detail penyelesaian (hanya finished).
- `reason`: alasan penolakan (hanya denied).

## Penggunaan tailnet historis

- Bind bridge ke IP tailnet: `bridge.bind: "tailnet"` di
  `~/.openclaw/openclaw.json` (hanya historis; `bridge.*` tidak lagi valid).
- Klien terhubung melalui nama MagicDNS atau IP tailnet.
- Bonjour **tidak** melintasi jaringan; gunakan host/port manual atau DNS-SD area luas
  bila diperlukan.

## Versioning

Bridge adalah **v1 implisit** (tanpa negosiasi min/maks). Bagian ini adalah
referensi historis saja; klien Node/operator saat ini menggunakan WebSocket
[Gateway Protocol](/id/gateway/protocol).

## Terkait

- [Gateway protocol](/id/gateway/protocol)
- [Nodes](/id/nodes)
