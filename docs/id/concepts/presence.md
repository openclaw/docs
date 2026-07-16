---
read_when:
    - Men-debug status langsung di halaman Perangkat UI Kontrol
    - Menyelidiki baris instans yang duplikat atau kedaluwarsa
    - Mengubah koneksi WS Gateway atau beacon peristiwa sistem
summary: Bagaimana entri kehadiran OpenClaw dibuat, digabungkan, dan ditampilkan
title: Kehadiran
x-i18n:
    generated_at: "2026-07-16T18:00:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

"Presence" OpenClaw adalah tampilan ringan dengan upaya terbaik untuk:

- **Gateway** itu sendiri, dan
- **klien yang terlihat oleh pengguna dan terhubung ke Gateway** (aplikasi Mac, WebChat, node, dll.)

Presence menampilkan metadata koneksi langsung di halaman **Devices** pada Control UI
(di bawah **Settings → Devices**) dan tab **Instances** pada aplikasi macOS.

Halaman ini membahas daftar klien Gateway. Untuk mendeteksi Mac yang terakhir
Anda gunakan dan merutekan peringatan node ke sana, lihat
[Presence komputer aktif](/nodes/presence).

## Bidang presence (yang ditampilkan)

Entri presence adalah objek terstruktur dengan bidang seperti:

- `instanceId` (opsional tetapi sangat disarankan): identitas klien yang stabil (biasanya `connect.client.instanceId`)
- `host`: nama host yang mudah dibaca
- `ip`: alamat IP berdasarkan upaya terbaik
- `version`: string versi klien
- `deviceFamily` / `modelIdentifier`: petunjuk perangkat keras
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: jumlah detik sejak input pengguna terakhir, jika diketahui
- `reason`: string bebas yang disediakan klien; Gateway itu sendiri hanya mengeluarkan `self`, `connect`, dan `disconnect`
- `deviceId`, `roles`, `scopes`: identitas perangkat serta petunjuk peran/cakupan dari handshake koneksi
- `ts`: stempel waktu pembaruan terakhir (md sejak epoch)

## Penghasil (asal presence)

Entri presence dihasilkan oleh beberapa sumber dan **digabungkan**.

### 1) Entri mandiri Gateway

Gateway selalu membuat entri "mandiri" saat dimulai agar UI menampilkan host gateway
bahkan sebelum klien terhubung.

### 2) Koneksi WebSocket

Setiap klien WS dimulai dengan permintaan `connect`. Setelah handshake berhasil,
Gateway melakukan upsert entri presence untuk koneksi tersebut.

#### Mengapa koneksi bidang kendali sementara tidak ditampilkan

Perintah CLI, klien RPC backend, dan probe sering kali terhubung secara singkat. Untuk menghindari
penyimpanan perubahan cepat tersebut selama seluruh TTL presence, klien dalam mode `cli`, `backend`,
atau `probe` **tidak** diubah menjadi entri presence. Klien mode pengujian
tetap dilacak karena rangkaian pengujian menggunakannya sebagai pengganti klien nyata.

### 3) Beacon `system-event`

Klien dapat mengirim beacon berkala yang lebih lengkap melalui metode `system-event`. Aplikasi
Mac menggunakannya untuk melaporkan nama host, IP, dan `lastInputSeconds`.

### 4) Koneksi node (peran: node)

Ketika node terhubung melalui WebSocket Gateway dengan `role: node`, Gateway
melakukan upsert entri presence untuk node tersebut (alur yang sama seperti klien WS lainnya).

## Aturan penggabungan + deduplikasi (mengapa `instanceId` penting)

Entri presence disimpan dalam satu peta dalam memori, dengan kunci yang tidak membedakan huruf besar-kecil
berdasarkan nilai pertama yang tersedia, secara berurutan: ID perangkat yang dipasangkan, `connect.client.instanceId`,
atau ID per koneksi sebagai pilihan terakhir.

Klien bidang kendali sementara sepenuhnya dikecualikan dari pelacakan (lihat
di atas), sehingga ID koneksinya tidak pernah menjadi kunci. Untuk setiap klien lainnya,
penggunaan ID koneksi sebagai pilihan terakhir berarti klien yang terhubung kembali tanpa
`instanceId` yang stabil akan ditampilkan sebagai baris **duplikat**.

## TTL dan batas ukuran

Presence sengaja bersifat sementara:

- **TTL:** entri yang lebih lama dari 5 menit akan dihapus
- **Entri maksimum:** 200 (yang paling lama dihapus terlebih dahulu)

Hal ini menjaga daftar tetap mutakhir dan menghindari pertumbuhan memori tanpa batas.

## Catatan untuk koneksi jarak jauh/tunnel (IP loopback)

Ketika klien terhubung melalui tunnel SSH / penerusan port lokal, Gateway
mungkin melihat alamat jarak jauh sebagai `127.0.0.1`. Agar alamat tunnel tersebut
tidak dicatat sebagai IP klien, penanganan koneksi sepenuhnya menghilangkan `ip` untuk
klien yang terdeteksi lokal (loopback), alih-alih menuliskan alamat loopback
ke dalam entri.

## Konsumen

### Halaman Devices pada Control UI

Halaman **Devices** menggabungkan `system-presence` dengan catatan pemasangan dan node
yang persisten. Halaman tersebut menyematkan beacon mandiri Gateway di urutan pertama dan menggunakan ID perangkat atau
instans yang cocok untuk metadata langsung platform, versi, model, serta keterkinian input.

### Tab Instances macOS

Aplikasi macOS merender keluaran `system-presence` dan menerapkan indikator status kecil
(Active/Idle/Stale) berdasarkan usia pembaruan terakhir.

## Kiat penelusuran kesalahan

- Untuk melihat daftar mentah, panggil `system-presence` terhadap Gateway.
- Jika Anda melihat duplikat:
  - pastikan klien mengirim `client.instanceId` yang stabil dalam handshake
  - pastikan beacon berkala menggunakan `instanceId` yang sama
  - periksa apakah entri yang berasal dari koneksi tidak memiliki `instanceId` (duplikat memang diperkirakan)

## Terkait

<CardGroup cols={2}>
  <Card title="Presence komputer aktif" href="/nodes/presence" icon="computer-mouse">
    Bagaimana input fisik Mac memilih node aktif dan merutekan peringatan koneksi.
  </Card>
  <Card title="Indikator pengetikan" href="/id/concepts/typing-indicators" icon="ellipsis">
    Kapan indikator pengetikan dikirim dan cara menyesuaikannya.
  </Card>
  <Card title="Streaming dan pemotongan" href="/id/concepts/streaming" icon="bars-staggered">
    Streaming keluar, pemotongan, dan pemformatan per kanal.
  </Card>
  <Card title="Arsitektur Gateway" href="/id/concepts/architecture" icon="diagram-project">
    Komponen Gateway dan protokol WebSocket yang menggerakkan pembaruan presence.
  </Card>
  <Card title="Protokol Gateway" href="/id/gateway/protocol" icon="plug">
    Protokol kabel untuk `connect`, `system-event`, dan `system-presence`.
  </Card>
</CardGroup>
