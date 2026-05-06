---
read_when:
    - Melakukan debug pada tab Instans
    - Menyelidiki baris instans duplikat atau usang
    - Mengubah koneksi WS Gateway atau suar system-event
summary: Bagaimana entri kehadiran OpenClaw dihasilkan, digabungkan, dan ditampilkan
title: Kehadiran
x-i18n:
    generated_at: "2026-05-06T09:08:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw "kehadiran" adalah tampilan ringan dengan upaya terbaik untuk:

- **Gateway** itu sendiri, dan
- **klien yang terhubung ke Gateway** (aplikasi mac, WebChat, CLI, dll.)

Kehadiran digunakan terutama untuk merender tab **Instans** aplikasi macOS dan untuk
memberikan visibilitas operator secara cepat.

## Bidang kehadiran (yang ditampilkan)

Entri kehadiran adalah objek terstruktur dengan bidang seperti:

- `instanceId` (opsional tetapi sangat disarankan): identitas klien yang stabil (biasanya `connect.client.instanceId`)
- `host`: nama host yang mudah dipahami manusia
- `ip`: alamat IP dengan upaya terbaik
- `version`: string versi klien
- `deviceFamily` / `modelIdentifier`: petunjuk perangkat keras
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: "detik sejak input pengguna terakhir" (jika diketahui)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: stempel waktu pembaruan terakhir (md sejak epoch)

## Produsen (asal kehadiran)

Entri kehadiran dihasilkan oleh beberapa sumber dan **digabungkan**.

### 1) Entri mandiri Gateway

Gateway selalu menyiapkan entri "mandiri" saat startup agar UI menampilkan host gateway
bahkan sebelum ada klien yang terhubung.

### 2) Koneksi WebSocket

Setiap klien WS dimulai dengan permintaan `connect`. Setelah handshake berhasil,
Gateway melakukan upsert entri kehadiran untuk koneksi tersebut.

#### Mengapa perintah CLI sekali jalan tidak muncul

CLI sering terhubung untuk perintah singkat sekali jalan. Untuk menghindari spam pada
daftar Instans, `client.mode === "cli"` **tidak** diubah menjadi entri kehadiran.

### 3) Beacon `system-event`

Klien dapat mengirim beacon berkala yang lebih kaya melalui metode `system-event`. Aplikasi mac
menggunakan ini untuk melaporkan nama host, IP, dan `lastInputSeconds`.

### 4) Koneksi Node (role: node)

Ketika sebuah node terhubung melalui WebSocket Gateway dengan `role: node`, Gateway
melakukan upsert entri kehadiran untuk node tersebut (alur yang sama seperti klien WS lainnya).

## Aturan penggabungan + deduplikasi (mengapa `instanceId` penting)

Entri kehadiran disimpan dalam satu map dalam memori:

- Entri diberi kunci berdasarkan **kunci kehadiran**.
- Kunci terbaik adalah `instanceId` yang stabil (dari `connect.client.instanceId`) yang bertahan setelah restart.
- Kunci tidak peka huruf besar/kecil.

Jika klien terhubung ulang tanpa `instanceId` yang stabil, klien tersebut dapat muncul sebagai
baris **duplikat**.

## TTL dan ukuran terbatas

Kehadiran sengaja dibuat sementara:

- **TTL:** entri yang lebih lama dari 5 menit dipangkas
- **Entri maksimum:** 200 (yang paling lama dihapus terlebih dahulu)

Ini menjaga daftar tetap segar dan menghindari pertumbuhan memori tanpa batas.

## Catatan remote/tunnel (IP loopback)

Ketika klien terhubung melalui tunnel SSH / penerusan port lokal, Gateway dapat
melihat alamat remote sebagai `127.0.0.1`. Untuk menghindari penimpaan IP baik yang dilaporkan klien,
alamat remote loopback diabaikan.

## Konsumen

### Tab Instans macOS

Aplikasi macOS merender keluaran `system-presence` dan menerapkan indikator status kecil
(Aktif/Menganggur/Kedaluwarsa) berdasarkan usia pembaruan terakhir.

## Tips debugging

- Untuk melihat daftar mentah, panggil `system-presence` terhadap Gateway.
- Jika Anda melihat duplikat:
  - pastikan klien mengirim `client.instanceId` yang stabil dalam handshake
  - pastikan beacon berkala menggunakan `instanceId` yang sama
  - periksa apakah entri yang diturunkan dari koneksi tidak memiliki `instanceId` (duplikat memang diharapkan)

## Terkait

<CardGroup cols={2}>
  <Card title="Indikator mengetik" href="/id/concepts/typing-indicators" icon="ellipsis">
    Kapan indikator mengetik dikirim dan cara menyesuaikannya.
  </Card>
  <Card title="Streaming dan chunking" href="/id/concepts/streaming" icon="bars-staggered">
    Streaming keluar, chunking, dan pemformatan per saluran.
  </Card>
  <Card title="Arsitektur Gateway" href="/id/concepts/architecture" icon="diagram-project">
    Komponen Gateway dan protokol WebSocket yang mendorong pembaruan kehadiran.
  </Card>
  <Card title="Protokol Gateway" href="/id/gateway/protocol" icon="plug">
    Protokol wire untuk `connect`, `system-event`, dan `system-presence`.
  </Card>
</CardGroup>
