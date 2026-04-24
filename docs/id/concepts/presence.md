---
read_when:
    - Men-debug tab Instances
    - Menyelidiki baris instance yang duplikat atau stale
    - Mengubah beacon koneksi WS gateway atau peristiwa sistem
summary: Bagaimana entri presence OpenClaw dihasilkan, digabungkan, dan ditampilkan
title: Presence
x-i18n:
    generated_at: "2026-04-24T09:05:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 15
---

Presence OpenClaw adalah tampilan ringan berbasis best-effort dari:

- **Gateway** itu sendiri, dan
- **klien yang terhubung ke Gateway** (aplikasi mac, WebChat, CLI, dll.)

Presence terutama digunakan untuk merender tab **Instances** di aplikasi macOS dan
memberikan visibilitas cepat bagi operator.

## Field presence (apa yang ditampilkan)

Entri presence adalah objek terstruktur dengan field seperti:

- `instanceId` (opsional tetapi sangat disarankan): identitas klien yang stabil (biasanya `connect.client.instanceId`)
- `host`: nama host yang ramah dibaca
- `ip`: alamat IP best-effort
- `version`: string versi klien
- `deviceFamily` / `modelIdentifier`: petunjuk perangkat keras
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: “detik sejak input pengguna terakhir” (jika diketahui)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: stempel waktu pembaruan terakhir (ms sejak epoch)

## Produsen (asal presence)

Entri presence dihasilkan oleh beberapa sumber dan **digabungkan**.

### 1) Entri Gateway sendiri

Gateway selalu menginisialisasi entri “self” saat startup agar UI menampilkan host gateway
bahkan sebelum ada klien yang terhubung.

### 2) Koneksi WebSocket

Setiap klien WS dimulai dengan permintaan `connect`. Saat handshake berhasil, Gateway
melakukan upsert entri presence untuk koneksi tersebut.

#### Mengapa perintah CLI sekali jalan tidak muncul

CLI sering terhubung untuk perintah singkat sekali jalan. Untuk menghindari membanjiri
daftar Instances, `client.mode === "cli"` **tidak** diubah menjadi entri presence.

### 3) Beacon `system-event`

Klien dapat mengirim beacon periodik yang lebih kaya melalui metode `system-event`. Aplikasi mac
menggunakan ini untuk melaporkan nama host, IP, dan `lastInputSeconds`.

### 4) Koneksi node (role: node)

Saat sebuah node terhubung melalui WebSocket Gateway dengan `role: node`, Gateway
melakukan upsert entri presence untuk node tersebut (alur yang sama seperti klien WS lainnya).

## Aturan penggabungan + deduplikasi (mengapa `instanceId` penting)

Entri presence disimpan dalam satu map dalam memori:

- Entri diberi kunci oleh **presence key**.
- Kunci terbaik adalah `instanceId` yang stabil (dari `connect.client.instanceId`) yang bertahan saat restart.
- Kunci tidak peka huruf besar/kecil.

Jika sebuah klien terhubung kembali tanpa `instanceId` yang stabil, klien tersebut dapat muncul sebagai
baris **duplikat**.

## TTL dan ukuran terbatas

Presence sengaja dibuat bersifat sementara:

- **TTL:** entri yang lebih lama dari 5 menit akan dipangkas
- **Maks entri:** 200 (yang tertua dibuang lebih dahulu)

Ini menjaga daftar tetap segar dan menghindari pertumbuhan memori tanpa batas.

## Peringatan remote/tunnel (IP loopback)

Saat sebuah klien terhubung melalui tunnel SSH / local port forward, Gateway dapat
melihat alamat remote sebagai `127.0.0.1`. Untuk menghindari menimpa IP yang baik yang dilaporkan klien,
alamat remote loopback diabaikan.

## Konsumen

### Tab Instances macOS

Aplikasi macOS merender output `system-presence` dan menerapkan indikator status kecil
(Active/Idle/Stale) berdasarkan usia pembaruan terakhir.

## Tips debugging

- Untuk melihat daftar mentah, panggil `system-presence` terhadap Gateway.
- Jika Anda melihat duplikat:
  - pastikan klien mengirim `client.instanceId` yang stabil dalam handshake
  - pastikan beacon periodik menggunakan `instanceId` yang sama
  - periksa apakah entri turunan koneksi tidak memiliki `instanceId` (duplikat memang diharapkan)

## Terkait

- [Indikator mengetik](/id/concepts/typing-indicators)
- [Streaming dan chunking](/id/concepts/streaming)
