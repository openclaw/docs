---
read_when:
    - Membangun atau men-debug klien node (mode node iOS/Android/macOS)
    - Menyelidiki kegagalan autentikasi pairing atau bridge
    - Mengaudit permukaan node yang diekspos oleh gateway
summary: 'Protokol bridge historis (node lama): TCP JSONL, pairing, RPC terbatas'
title: Protokol bridge
x-i18n:
    generated_at: "2026-06-27T17:28:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Jembatan TCP telah **dihapus**. Build OpenClaw saat ini tidak menyertakan listener jembatan dan kunci konfigurasi `bridge.*` tidak lagi ada di skema. Halaman ini dipertahankan hanya sebagai referensi historis. Gunakan [Protokol Gateway](/id/gateway/protocol) untuk semua klien Node/operator.
</Warning>

## Mengapa ini pernah ada

- **Batas keamanan**: jembatan mengekspos allowlist kecil alih-alih
  seluruh permukaan API Gateway.
- **Pairing + identitas Node**: penerimaan Node dimiliki oleh Gateway dan terikat
  ke token per Node.
- **UX penemuan**: Node dapat menemukan Gateway melalui Bonjour di LAN, atau terhubung
  langsung melalui tailnet.
- **Loopback WS**: control plane WS penuh tetap lokal kecuali ditunnel melalui SSH.

## Transport

- TCP, satu objek JSON per baris (JSONL).
- TLS opsional (ketika `bridge.tls.enabled` bernilai true).
- Port listener default historis adalah `18790` (build saat ini tidak memulai
  jembatan TCP).

Ketika TLS diaktifkan, record TXT penemuan menyertakan `bridgeTls=1` plus
`bridgeTlsSha256` sebagai petunjuk non-rahasia. Perhatikan bahwa record TXT Bonjour/mDNS
tidak diautentikasi; klien tidak boleh memperlakukan fingerprint yang diiklankan sebagai
pin otoritatif tanpa niat pengguna yang eksplisit atau verifikasi out-of-band lainnya.

## Handshake + pairing

1. Klien mengirim `hello` dengan metadata Node + token (jika sudah dipairing).
2. Jika belum dipairing, Gateway membalas `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klien mengirim `pair-request`.
4. Gateway menunggu persetujuan, lalu mengirim `pair-ok` dan `hello-ok`.

Secara historis, `hello-ok` mengembalikan `serverName`; permukaan Plugin yang dihosting kini
diiklankan melalui `pluginSurfaceUrls`. Canvas/A2UI menggunakan
`pluginSurfaceUrls.canvas`; alias usang `canvasHostUrl` bukan bagian dari
protokol yang telah direfaktor.

## Frame

Klien → Gateway:

- `req` / `res`: RPC Gateway berskop (chat, sesi, konfigurasi, kesehatan, voicewake, skills.bins)
- `event`: sinyal Node (transkrip suara, permintaan agen, berlangganan chat, siklus hidup exec)

Gateway → Klien:

- `invoke` / `invoke-res`: perintah Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: pembaruan chat untuk sesi yang dilanggan
- `ping` / `pong`: keepalive

Penegakan allowlist lama berada di `src/gateway/server-bridge.ts` (dihapus).

## Peristiwa siklus hidup exec

Node dapat memancarkan peristiwa `exec.finished` untuk menampilkan aktivitas `system.run` yang selesai.
Ini dipetakan ke peristiwa sistem di Gateway. (Node lama mungkin masih memancarkan `exec.started`.)
Node dapat memancarkan `exec.denied` untuk percobaan `system.run` yang ditolak; Gateway menerima
peristiwa tersebut sebagai penolakan terminal dan tidak mengantrekan peristiwa sistem atau membangunkan pekerjaan agen.

Field payload (semua opsional kecuali disebutkan):

- `sessionKey` (wajib): sesi agen untuk korelasi peristiwa dan, untuk
  `exec.finished`, pengiriman peristiwa sistem.
- `runId`: id exec unik untuk pengelompokan.
- `command`: string perintah mentah atau terformat.
- `exitCode`, `timedOut`, `success`, `output`: detail penyelesaian (hanya selesai).
- `reason`: alasan penolakan (hanya ditolak).

## Penggunaan tailnet historis

- Bind jembatan ke IP tailnet: `bridge.bind: "tailnet"` di
  `~/.openclaw/openclaw.json` (hanya historis; `bridge.*` tidak lagi valid).
- Klien terhubung melalui nama MagicDNS atau IP tailnet.
- Bonjour **tidak** melintasi jaringan; gunakan host/port manual atau DNS-SD area luas
  saat diperlukan.

## Versioning

Jembatan adalah **v1 implisit** (tanpa negosiasi min/maks). Bagian ini adalah
referensi historis saja; klien Node/operator saat ini menggunakan WebSocket
[Protokol Gateway](/id/gateway/protocol).

## Terkait

- [Protokol Gateway](/id/gateway/protocol)
- [Node](/id/nodes)
