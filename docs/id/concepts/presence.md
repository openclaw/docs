---
read_when:
    - Men-debug status langsung di halaman Perangkat UI Kontrol
    - Menyelidiki baris instans yang duplikat atau kedaluwarsa
    - Mengubah koneksi WS Gateway atau suar peristiwa sistem
summary: Cara entri kehadiran OpenClaw dibuat, digabungkan, dan ditampilkan
title: Kehadiran
x-i18n:
    generated_at: "2026-07-22T01:49:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ac5800eebddb82e69a7d0c06733e6a19addbc57be7776e7361411866af0c60f5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw "presence" adalah tampilan ringan dengan upaya terbaik untuk:

- **Gateway** itu sendiri, dan
- **klien yang terlihat oleh pengguna dan terhubung ke Gateway** (aplikasi Mac, WebChat, node, dll.)

Presence menampilkan metadata koneksi langsung di halaman **Devices** pada Control UI
(di bawah **Settings → Devices**) dan tab **Instances** pada aplikasi macOS.

Halaman ini membahas daftar klien Gateway. Untuk mendeteksi Mac yang terakhir
digunakan dan merutekan peringatan node ke sana, lihat
[Presence komputer aktif](/id/nodes/presence).

## Bidang presence (yang ditampilkan)

Entri presence adalah objek terstruktur dengan bidang seperti:

- `instanceId` (opsional tetapi sangat disarankan): identitas klien stabil (biasanya `connect.client.instanceId`)
- `host`: nama host yang mudah dipahami
- `ip`: alamat IP berdasarkan upaya terbaik
- `version`: string versi klien
- `deviceFamily` / `modelIdentifier`: petunjuk perangkat keras
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: detik sejak input pengguna terakhir, jika diketahui
- `reason`: string bebas yang disediakan klien; Gateway itu sendiri hanya memancarkan `self`, `connect`, dan `disconnect`
- `deviceId`, `roles`, `scopes`: identitas perangkat dan petunjuk peran/cakupan dari handshake koneksi
- `ts`: stempel waktu pembaruan terakhir (md sejak epoch)

## Produsen (asal presence)

Entri presence dihasilkan oleh beberapa sumber dan **digabungkan**.

### 1) Entri mandiri Gateway

Gateway selalu membuat entri "mandiri" saat dimulai agar UI menampilkan host gateway
bahkan sebelum ada klien yang terhubung.

### 2) Koneksi WebSocket

Setiap klien WS dimulai dengan permintaan `connect`. Setelah handshake berhasil,
Gateway melakukan upsert entri presence untuk koneksi tersebut.

#### Alasan koneksi control-plane sementara tidak ditampilkan

Perintah CLI, klien RPC backend, dan probe sering kali hanya terhubung sebentar. Untuk menghindari
penyimpanan aktivitas yang terus berubah tersebut selama seluruh TTL presence, klien dalam mode `cli`, `backend`,
atau `probe` **tidak** diubah menjadi entri presence. Klien mode pengujian
tetap dilacak karena rangkaian pengujian menggunakannya sebagai pengganti klien nyata.

### 3) Beacon `system-event`

Klien dapat mengirim beacon berkala yang lebih lengkap melalui metode `system-event`. Aplikasi
Mac menggunakannya untuk melaporkan nama host, IP, versi, dan metadata keaktifan. Aktivitas
input fisik bukan bagian dari beacon generik ini; event node native khusus
yang dijelaskan dalam [Presence komputer aktif](/id/nodes/presence) menanganinya. Mac
menandai beacon ini dengan `system-presence-clear-last-input`; Gateway saat ini
menggunakan penanda yang kompatibel dengan versi sebelumnya tersebut untuk menghapus kebaruan input yang tersimpan dari
aplikasi lama. Beacon juga membawa nilai tetap 30 hari agar Gateway lama yang
mengabaikan tag tersebut menimpa kebaruan yang tepat alih-alih menyimpannya. Tidak ada aktivitas baru
yang diambil sampelnya untuk nilai kompatibilitas ini.

### 4) Koneksi node (peran: node)

Saat node terhubung melalui WebSocket Gateway dengan `role: node`, Gateway
melakukan upsert entri presence untuk node tersebut (alur yang sama seperti klien WS lainnya).

## Aturan penggabungan + deduplikasi (alasan `instanceId` penting)

Entri presence disimpan dalam satu peta dalam memori, dengan kunci yang tidak peka huruf besar-kecil
berdasarkan nilai pertama yang tersedia dengan urutan: id perangkat yang dipasangkan, `connect.client.instanceId`,
atau id per koneksi sebagai pilihan terakhir.

Klien control-plane sementara sepenuhnya dikecualikan dari pelacakan (lihat
di atas), sehingga id koneksinya tidak pernah menjadi kunci. Untuk setiap klien lainnya,
penggunaan id koneksi sebagai pilihan terakhir berarti klien yang terhubung kembali tanpa
`instanceId` stabil akan ditampilkan sebagai baris **duplikat**.

## TTL dan ukuran terbatas

Presence sengaja bersifat sementara:

- **TTL:** entri yang berusia lebih dari 5 menit dihapus
- **Entri maksimum:** 200 (yang paling lama dihapus terlebih dahulu)

Hal ini menjaga daftar tetap mutakhir dan menghindari pertumbuhan memori tanpa batas.

## Catatan koneksi jarak jauh/tunnel (IP loopback)

Saat klien terhubung melalui tunnel SSH / penerusan port lokal, Gateway
mungkin melihat alamat jarak jauhnya sebagai `127.0.0.1`. Untuk menghindari pencatatan alamat tunnel
tersebut sebagai IP klien, penanganan koneksi sepenuhnya menghilangkan `ip` untuk
klien yang terdeteksi lokal (loopback), alih-alih menulis alamat loopback
ke dalam entri.

## Konsumen

### Halaman Devices pada Control UI

Halaman **Devices** menggabungkan `system-presence` dengan catatan pemasangan dan node
yang persisten. Halaman ini menyematkan beacon mandiri Gateway di urutan pertama dan menggunakan id perangkat atau
instans yang cocok untuk metadata platform, versi, model, dan kebaruan input langsung.

### Tab Instances pada macOS

Aplikasi macOS menampilkan output `system-presence` dan menerapkan indikator status
kecil (Active/Idle/Stale) berdasarkan usia pembaruan terakhir.

## Kiat debugging

- Untuk melihat daftar mentah, panggil `system-presence` terhadap Gateway.
- Jika terlihat duplikat:
  - pastikan klien mengirim `client.instanceId` yang stabil dalam handshake
  - pastikan beacon berkala menggunakan `instanceId` yang sama
  - periksa apakah entri yang berasal dari koneksi tidak memiliki `instanceId` (duplikat memang diperkirakan)

## Terkait

<CardGroup cols={2}>
  <Card title="Presence komputer aktif" href="/id/nodes/presence" icon="computer-mouse">
    Cara input fisik Mac memilih node aktif dan merutekan peringatan koneksi.
  </Card>
  <Card title="Indikator pengetikan" href="/id/concepts/typing-indicators" icon="ellipsis">
    Waktu indikator pengetikan dikirim dan cara menyesuaikannya.
  </Card>
  <Card title="Streaming dan pemotongan" href="/id/concepts/streaming" icon="bars-staggered">
    Streaming keluar, pemotongan, dan pemformatan per kanal.
  </Card>
  <Card title="Arsitektur Gateway" href="/id/concepts/architecture" icon="diagram-project">
    Komponen Gateway dan protokol WebSocket yang menggerakkan pembaruan presence.
  </Card>
  <Card title="Protokol Gateway" href="/id/gateway/protocol" icon="plug">
    Protokol wire untuk `connect`, `system-event`, dan `system-presence`.
  </Card>
</CardGroup>
