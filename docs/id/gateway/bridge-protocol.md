---
read_when:
    - Menyelidiki kode klien Node lama atau log pemasangan yang diarsipkan
    - Mengaudit apa saja yang dahulu diekspos oleh antarmuka Node lama
summary: 'Protokol bridge historis (node lama): JSONL TCP, pemasangan, RPC bercakupan'
title: Protokol jembatan
x-i18n:
    generated_at: "2026-07-12T14:12:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Bridge TCP telah **dihapus**. Build OpenClaw saat ini tidak menyertakan listener bridge, dan kunci konfigurasi `bridge.*` tidak lagi ada dalam skema. Halaman ini hanya merupakan referensi historis. Gunakan [protokol Gateway](/id/gateway/protocol) untuk semua klien node/operator.
</Warning>

## Alasan keberadaannya

- **Batas keamanan**: mengekspos daftar izin terbatas alih-alih seluruh permukaan API Gateway.
- **Pemasangan + identitas node**: penerimaan node dikelola oleh Gateway dan dikaitkan dengan token per node.
- **Pengalaman pengguna penemuan**: node dapat menemukan Gateway melalui Bonjour di LAN, atau terhubung langsung melalui tailnet.
- **WS loopback**: seluruh bidang kendali WS tetap lokal kecuali diteruskan melalui tunnel SSH.

## Transportasi

- TCP, satu objek JSON per baris (JSONL).
- TLS opsional (`bridge.tls.enabled: true`).
- Port listener bawaannya adalah `18790`.

Saat TLS diaktifkan, rekaman TXT penemuan menyertakan `bridgeTls=1` beserta `bridgeTlsSha256` sebagai petunjuk nonrahasia. Rekaman TXT Bonjour/mDNS tidak diautentikasi; klien tidak dapat memperlakukan sidik jari yang diumumkan sebagai pin otoritatif tanpa verifikasi luar jalur lainnya.

## Handshake dan pemasangan

1. Klien mengirim `hello` dengan metadata node beserta token (jika sudah dipasangkan).
2. Jika belum dipasangkan, Gateway membalas `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. Klien mengirim `pair-request`.
4. Gateway menunggu persetujuan, lalu mengirim `pair-ok` dan `hello-ok`.

`hello-ok` sebelumnya mengembalikan `serverName`; permukaan Plugin yang dihosting kini diumumkan melalui `pluginSurfaceUrls` pada protokol Gateway saat ini (Canvas/A2UI menggunakan `pluginSurfaceUrls.canvas`).

## Bingkai

Klien ke Gateway:

- `req` / `res`: RPC Gateway dengan cakupan terbatas (obrolan, sesi, konfigurasi, kesehatan, voicewake, skills.bins).
- `event`: sinyal node (transkrip suara, permintaan agen, langganan obrolan, siklus hidup eksekusi).

Gateway ke klien:

- `invoke` / `invoke-res`: perintah node (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: pembaruan obrolan untuk sesi yang dilanggani.
- `ping` / `pong`: penjaga koneksi.

Pemberlakuan daftar izin berada di `src/gateway/server-bridge.ts` (telah dihapus).

## Peristiwa siklus hidup eksekusi

Node memancarkan `exec.finished` untuk menampilkan aktivitas `system.run` yang telah selesai, yang dipetakan menjadi peristiwa sistem oleh Gateway (node lama juga dapat memancarkan `exec.started`). `exec.denied` menandai upaya `system.run` yang ditolak sebagai penolakan terminal tanpa mengantrekan peristiwa sistem atau membangunkan pekerjaan agen.

Kolom muatan (semuanya opsional kecuali dinyatakan lain):

| Kolom                            | Catatan                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `sessionKey`                     | Wajib. Sesi agen untuk korelasi peristiwa dan, untuk `exec.finished`, pengiriman peristiwa sistem.                        |
| `runId`                          | ID eksekusi unik untuk pengelompokan.                                                                                    |
| `command`                        | String perintah mentah atau yang telah diformat.                                                                         |
| `exitCode`, `timedOut`, `output` | Detail penyelesaian (hanya untuk yang selesai).                                                                          |
| `reason`                         | Alasan penolakan (hanya untuk yang ditolak).                                                                             |

## Penggunaan tailnet historis

- Ikat bridge ke alamat IP tailnet: `bridge.bind: "tailnet"` dalam `~/.openclaw/openclaw.json` (hanya historis; `bridge.*` tidak lagi merupakan konfigurasi yang valid).
- Klien terhubung melalui nama MagicDNS atau alamat IP tailnet.
- Bonjour tidak melintasi jaringan; jika tidak, DNS-SD area luas atau host/port manual diperlukan.

## Pembuatan versi

Bridge menggunakan v1 implisit, tanpa negosiasi minimum/maksimum. Klien node/operator saat ini menggunakan [protokol Gateway](/id/gateway/protocol) WebSocket, yang menegosiasikan rentang versi protokol.

## Terkait

- [Protokol Gateway](/id/gateway/protocol)
- [Node](/id/nodes)
