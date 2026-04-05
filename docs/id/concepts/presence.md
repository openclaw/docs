---
read_when:
    - Men-debug tab Instances
    - Menyelidiki baris instance yang duplikat atau kedaluwarsa
    - Mengubah koneksi WS gateway atau beacon system-event
summary: Bagaimana entri presence OpenClaw dihasilkan, digabungkan, dan ditampilkan
title: Presence
x-i18n:
    generated_at: "2026-04-05T13:51:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a004a1f87be08699c1b2cba97cad8678ce5e27baa425f59eaa18006fdcff26e7
    source_path: concepts/presence.md
    workflow: 15
---

# Presence

“Presence” OpenClaw adalah tampilan ringan dan best-effort dari:

- **Gateway** itu sendiri, dan
- **klien yang terhubung ke Gateway** (mac app, WebChat, CLI, dll.)

Presence terutama digunakan untuk merender tab **Instances** di aplikasi macOS dan untuk
memberikan visibilitas cepat bagi operator.

## Field presence (apa yang ditampilkan)

Entri presence adalah objek terstruktur dengan field seperti:

- `instanceId` (opsional tetapi sangat disarankan): identitas klien yang stabil (biasanya `connect.client.instanceId`)
- `host`: nama host yang ramah manusia
- `ip`: alamat IP best-effort
- `version`: string versi klien
- `deviceFamily` / `modelIdentifier`: petunjuk perangkat keras
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: “detik sejak input pengguna terakhir” (jika diketahui)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: stempel waktu pembaruan terakhir (md sejak epoch)

## Produsen (dari mana presence berasal)

Entri presence dihasilkan oleh beberapa sumber dan **digabungkan**.

### 1) Entri mandiri Gateway

Gateway selalu melakukan seed entri “self” saat startup sehingga UI menampilkan host gateway
bahkan sebelum ada klien yang terhubung.

### 2) Koneksi WebSocket

Setiap klien WS dimulai dengan permintaan `connect`. Setelah handshake berhasil, Gateway
melakukan upsert entri presence untuk koneksi tersebut.

#### Mengapa perintah CLI sekali jalan tidak muncul

CLI sering terhubung untuk perintah singkat sekali jalan. Untuk menghindari spam pada
daftar Instances, `client.mode === "cli"` **tidak** diubah menjadi entri presence.

### 3) Beacon `system-event`

Klien dapat mengirim beacon berkala yang lebih kaya melalui metode `system-event`. Aplikasi mac
menggunakan ini untuk melaporkan nama host, IP, dan `lastInputSeconds`.

### 4) Koneksi node (role: node)

Ketika sebuah node terhubung melalui WebSocket Gateway dengan `role: node`, Gateway
melakukan upsert entri presence untuk node tersebut (alur yang sama seperti klien WS lainnya).

## Aturan gabung + deduplikasi (mengapa `instanceId` penting)

Entri presence disimpan dalam satu map dalam memori:

- Entri diberi kunci oleh **kunci presence**.
- Kunci terbaik adalah `instanceId` yang stabil (dari `connect.client.instanceId`) yang bertahan saat restart.
- Kunci tidak peka huruf besar/kecil.

Jika sebuah klien terhubung ulang tanpa `instanceId` yang stabil, klien tersebut dapat muncul sebagai
baris **duplikat**.

## TTL dan ukuran terbatas

Presence sengaja bersifat fana:

- **TTL:** entri yang lebih lama dari 5 menit akan dipangkas
- **Jumlah maksimum entri:** 200 (yang paling lama dihapus lebih dahulu)

Hal ini menjaga daftar tetap segar dan menghindari pertumbuhan memori tanpa batas.

## Catatan remote/tunnel (IP loopback)

Ketika sebuah klien terhubung melalui tunnel SSH / penerusan port lokal, Gateway dapat
melihat alamat remote sebagai `127.0.0.1`. Untuk menghindari penimpaan IP yang baik yang dilaporkan klien,
alamat remote loopback diabaikan.

## Konsumen

### Tab Instances macOS

Aplikasi macOS merender output `system-presence` dan menerapkan indikator status kecil
(Active/Idle/Stale) berdasarkan usia pembaruan terakhir.

## Tips debugging

- Untuk melihat daftar mentah, panggil `system-presence` ke Gateway.
- Jika Anda melihat duplikat:
  - pastikan klien mengirim `client.instanceId` yang stabil dalam handshake
  - pastikan beacon berkala menggunakan `instanceId` yang sama
  - periksa apakah entri turunan koneksi tidak memiliki `instanceId` (duplikat memang diharapkan)
