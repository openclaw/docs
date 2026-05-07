---
read_when:
    - Membangun atau men-debug klien Node (mode Node iOS/Android/macOS)
    - Menyelidiki kegagalan penyandingan atau autentikasi jembatan
    - Mengaudit permukaan Node yang diekspos oleh Gateway
summary: 'Protokol jembatan historis (node lama): TCP JSONL, pemasangan, RPC bercakupan'
title: Protokol jembatan
x-i18n:
    generated_at: "2026-05-07T13:16:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Bridge TCP telah **dihapus**. Build OpenClaw saat ini tidak menyertakan listener bridge dan kunci konfigurasi `bridge.*` tidak lagi ada dalam skema. Halaman ini dipertahankan hanya sebagai referensi historis. Gunakan [Protokol Gateway](/id/gateway/protocol) untuk semua klien node/operator.
</Warning>

## Mengapa ini pernah ada

- **Batas keamanan**: bridge mengekspos daftar izin kecil, bukan seluruh
  permukaan API Gateway.
- **Pairing + identitas node**: penerimaan node dimiliki oleh Gateway dan dikaitkan
  ke token per node.
- **UX penemuan**: node dapat menemukan Gateway melalui Bonjour di LAN, atau terhubung
  langsung melalui tailnet.
- **WS loopback**: bidang kontrol WS penuh tetap lokal kecuali ditunnel melalui SSH.

## Transport

- TCP, satu objek JSON per baris (JSONL).
- TLS opsional (ketika `bridge.tls.enabled` bernilai true).
- Port listener default historis adalah `18790` (build saat ini tidak memulai
  bridge TCP).

Ketika TLS diaktifkan, catatan TXT penemuan menyertakan `bridgeTls=1` ditambah
`bridgeTlsSha256` sebagai petunjuk non-rahasia. Perhatikan bahwa catatan TXT
Bonjour/mDNS tidak diautentikasi; klien tidak boleh memperlakukan fingerprint yang
diiklankan sebagai pin otoritatif tanpa niat pengguna yang eksplisit atau verifikasi
out-of-band lainnya.

## Handshake + pairing

1. Klien mengirim `hello` dengan metadata node + token (jika sudah dipairing).
2. Jika belum dipairing, Gateway membalas `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klien mengirim `pair-request`.
4. Gateway menunggu persetujuan, lalu mengirim `pair-ok` dan `hello-ok`.

Secara historis, `hello-ok` mengembalikan `serverName`; permukaan Plugin yang dihosting kini
diiklankan melalui `pluginSurfaceUrls`. Canvas/A2UI menggunakan
`pluginSurfaceUrls.canvas`; alias usang `canvasHostUrl` bukan bagian dari
protokol yang telah direfaktor.

## Frame

Klien → Gateway:

- `req` / `res`: RPC Gateway terbatas cakupan (chat, sesi, konfigurasi, health, voicewake, skills.bins)
- `event`: sinyal node (transkrip suara, permintaan agen, berlangganan chat, siklus hidup exec)

Gateway → Klien:

- `invoke` / `invoke-res`: perintah node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: pembaruan chat untuk sesi yang dilanggan
- `ping` / `pong`: keepalive

Penegakan daftar izin lama pernah berada di `src/gateway/server-bridge.ts` (dihapus).

## Event siklus hidup exec

Node dapat memancarkan event `exec.finished` atau `exec.denied` untuk menampilkan aktivitas system.run.
Ini dipetakan ke event sistem di Gateway. (Node lama mungkin masih memancarkan `exec.started`.)

Kolom payload (semua opsional kecuali dinyatakan lain):

- `sessionKey` (wajib): sesi agen yang akan menerima event sistem.
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

Bridge adalah **v1 implisit** (tanpa negosiasi min/maks). Bagian ini hanya
referensi historis; klien node/operator saat ini menggunakan WebSocket
[Protokol Gateway](/id/gateway/protocol).

## Terkait

- [Protokol Gateway](/id/gateway/protocol)
- [Node](/id/nodes)
