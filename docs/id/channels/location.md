---
read_when:
    - Menambahkan atau memodifikasi penguraian lokasi channel
    - Menggunakan bidang konteks lokasi dalam prompt atau alat agen
summary: Penguraian lokasi channel dan payload lokasi keluar yang portabel
title: Penguraian lokasi channel
x-i18n:
    generated_at: "2026-07-16T17:45:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c7e5647d02643ad6d95024b362228377690d7fdff66441fae367f0f5307217fb
    source_path: channels/location.md
    workflow: 16
---

OpenClaw menormalkan lokasi bersama dari saluran obrolan menjadi:

- teks koordinat ringkas yang ditambahkan ke isi pesan masuk, dan
- bidang terstruktur dalam payload konteks balasan otomatis. Label, alamat, dan keterangan/komentar yang diberikan saluran dirender ke dalam prompt melalui blok JSON metadata tidak tepercaya bersama, bukan secara inline dalam isi pesan pengguna.

Saat ini didukung:

- **LINE** (pesan lokasi dengan judul/alamat)
- **Matrix** (`m.location` dengan `geo_uri`)
- **Telegram** (pin lokasi + tempat + lokasi langsung)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)

## Pemformatan teks

Lokasi dirender sebagai baris yang mudah dibaca tanpa tanda kurung. Koordinat menggunakan enam angka desimal; akurasi dibulatkan ke meter utuh:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Tempat bernama (baris yang sama; nama/alamat hanya masuk ke blok metadata):
  - `📍 48.858844, 2.294351 ±12m`
- Berbagi langsung:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Jika saluran menyertakan label, alamat, atau keterangan/komentar, informasi tersebut dipertahankan dalam payload konteks dan muncul dalam prompt sebagai JSON tidak tepercaya berpagar (bidang dihilangkan jika tidak ada):

````text
Lokasi (metadata tidak tepercaya):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "Menara Eiffel",
  "address": "Champ de Mars, Paris",
  "caption": "Bertemu di sini"
}
```
````

## Bidang konteks

Jika terdapat lokasi, bidang berikut ditambahkan ke `ctx`:

- `LocationLat` (angka)
- `LocationLon` (angka)
- `LocationAccuracy` (angka, meter; opsional)
- `LocationName` (string; opsional)
- `LocationAddress` (string; opsional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)
- `LocationCaption` (string; opsional)

Jika saluran tidak menetapkan sumber secara eksplisit, OpenClaw menyimpulkannya: berbagi langsung menjadi `live`, lokasi dengan nama atau alamat menjadi `place`, dan semua yang lain menjadi `pin`.

Perender prompt memperlakukan `LocationName`, `LocationAddress`, dan `LocationCaption` sebagai metadata tidak tepercaya dan menserialisasikannya melalui jalur JSON terbatas yang sama dengan yang digunakan untuk konteks saluran lainnya.

## Payload keluar

Alat pesan dan SDK Plugin menggunakan bentuk `NormalizedLocation` yang sama untuk lokasi keluar portabel. Payload yang hanya berisi koordinat merepresentasikan pin. Saluran dengan dukungan bawaan untuk tempat dapat memetakan `name` beserta `address` ke kartu tempat.

Telegram saat ini mengeksposnya melalui `message(action="send")`. Implementasi pertamanya sengaja dibuat mandiri: payload lokasi tidak dapat digabungkan dengan teks atau media, dan pasangan tempat yang tidak lengkap akan gagal alih-alih menghapus nama atau alamat secara diam-diam. Saluran yang tidak didukung tidak mengiklankan parameter lokasi.

## Catatan saluran

- **LINE**: pesan lokasi `title`/`address` dipetakan ke `LocationName`/`LocationAddress`; tidak ada lokasi langsung.
- **Matrix**: `geo_uri` diurai sebagai lokasi pin; parameter `u` (ketidakpastian) dipetakan ke `LocationAccuracy`, isi peristiwa mengisi `LocationCaption`, ketinggian diabaikan, dan `LocationIsLive` selalu bernilai false.
- **Telegram**: tempat dipetakan ke `LocationName`/`LocationAddress`; lokasi langsung dideteksi melalui `live_period`.
- **WhatsApp**: `locationMessage.comment` dan `liveLocationMessage.caption` mengisi `LocationCaption`.

## Terkait

- [Perintah lokasi (Node)](/id/nodes/location-command)
- [Pengambilan gambar kamera](/id/nodes/camera)
- [Pemahaman media](/id/nodes/media-understanding)
