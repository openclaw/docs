---
read_when:
    - Mengerjakan fitur saluran Tlon/Urbit
summary: Status dukungan, kemampuan, dan konfigurasi Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-19T04:57:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d742628d6cf9aaf82d79a8d96b1685229905e9452c9fc4d3a494d2dee8d69943
    source_path: channels/tlon.md
    workflow: 16
---

Tlon adalah perpesanan terdesentralisasi yang dibangun di atas Urbit. OpenClaw terhubung ke ship Urbit Anda dan
menanggapi DM serta pesan obrolan grup. Secara default, balasan grup memerlukan penyebutan @, dengan
aturan otorisasi dan alur persetujuan pemilik yang diterapkan di atasnya.

Status: plugin bawaan. DM, penyebutan grup, utas, teks kaya, unggah/unduh gambar, dan
sistem persetujuan pemilik didukung. Reaksi dan jajak pendapat tidak didukung.

## Plugin bawaan

Tlon disertakan dalam rilis OpenClaw saat ini; build terpaket tidak memerlukan instalasi terpisah.

Pada build lama atau instalasi khusus yang tidak menyertakannya, instal dari npm:

```bash
openclaw plugins install @openclaw/tlon
```

Gunakan nama paket tanpa tambahan untuk mengikuti tag rilis saat ini. Sematkan versi (`@openclaw/tlon@x.y.z`)
hanya untuk instalasi yang dapat direproduksi.

Dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

Atau edit konfigurasi secara langsung:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // disarankan: ship Anda, selalu diotorisasi
    },
  },
}
```

Mulai ulang Gateway setelah mengedit konfigurasi secara langsung. Kemudian kirim DM kepada bot atau sebutkan bot dengan @ di
kanal grup.

## Durabilitas pesan masuk

OpenClaw mempertahankan peristiwa DM dan obrolan grup Tlon yang diterima sebelum mengirimkannya ke agen. Giliran yang tertunda atau dapat dicoba ulang tetap bertahan setelah Gateway dimulai ulang, dan pekerjaan tetap diserialkan per kanal grup atau rekan langsung. ID pesan Urbit yang stabil juga menekan peristiwa yang dikirim ulang selama catatan antrean atau catatan penyelesaian yang dipertahankan masih ada.

Pengiriman dilakukan setidaknya sekali pada batas antrean-ke-agen: kegagalan saat serah terima dapat memutar ulang suatu giliran. Karena itu, tindakan agen yang menghasilkan efek samping eksternal harus tetap idempoten jika memungkinkan.

## Ship privat/LAN

Secara default, OpenClaw memblokir nama host dan rentang IP privat/internal untuk perlindungan SSRF. Jika
ship Anda berjalan di jaringan privat (localhost, IP LAN, nama host internal), ikut serta secara eksplisit:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

Berlaku untuk target seperti `http://localhost:8080`, `http://192.168.x.x:8080`, dan
`http://my-ship.local:8080`. Aktifkan ini hanya untuk URL ship yang Anda percayai; tindakan ini menonaktifkan perlindungan
SSRF untuk permintaan HTTP akun tersebut.

<Note>
`channels.tlon.allowPrivateNetwork` (kunci datar) telah dihentikan. `openclaw doctor --fix` memindahkannya ke
`channels.tlon.network.dangerouslyAllowPrivateNetwork` secara otomatis.
</Note>

## Kanal grup

Sematkan kanal secara manual, atau aktifkan penemuan otomatis:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

`autoDiscoverChannels` secara default menjadi `false` saat tidak ditetapkan dalam konfigurasi; wizard penyiapan secara default
menetapkan prompt ke ya dan menulis `true` secara eksplisit. Saat diaktifkan, OpenClaw melakukan scry pada grup yang telah diikuti ketika dimulai,
memantau kanal baru saat undangan grup diterima, dan memeriksa ulang setiap 2 menit.

## Kontrol akses

Daftar yang diizinkan untuk DM (kosong = tidak ada DM yang diizinkan kecuali pengirimnya adalah `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Otorisasi grup secara default menggunakan `restricted` per kanal. Tetapkan `defaultAuthorizedShips` sebagai
dasar, lalu timpa per sarang kanal:

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

Setelah bot membalas di dalam suatu utas, bot akan terus menanggapi pesan berikutnya di utas tersebut
tanpa memerlukan penyebutan lagi.

Tetapkan `channels.tlon.implicitMentions.threadParticipation: false` agar penyebutan eksplisit baru diwajibkan
untuk pesan lanjutan tersebut. Penimpaan akun menggunakan `channels.tlon.accounts.<id>.implicitMentions`. Tlon
saat ini tidak menghasilkan fakta `replyToBot` atau `quotedBot`, sehingga flag tersebut tidak berpengaruh di sini.

## Sistem pemilik dan persetujuan

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Ship pemilik diotorisasi di mana saja: undangan DM selalu diterima otomatis, undangan grup
selalu diterima otomatis, dan pesan kanal selalu lolos otorisasi. Pemilik tidak perlu
berada di `dmAllowlist`, `defaultAuthorizedShips`, atau `groupInviteAllowlist`.

Saat `ownerShip` ditetapkan, permintaan yang tidak diotorisasi tidak hanya dibuang — permintaan tersebut mengantrekan
persetujuan tertunda dan mengirim DM kepada pemilik:

- Permintaan DM dari ship yang tidak ada di `dmAllowlist`
- Penyebutan di kanal tempat pengirim gagal memperoleh otorisasi
- Undangan grup dari ship yang tidak ada di `groupInviteAllowlist` (saat penerimaan otomatis dinonaktifkan, atau diaktifkan tetapi
  pengundang tidak ada dalam daftar yang diizinkan)

Pemilik membalas melalui DM untuk menindaklanjuti permintaan:

| Balasan pemilik              | Efek                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| `approve` / `deny` / `block` | Menindaklanjuti persetujuan tertunda terbaru                 |
| `approve <id>` / `deny <id>` | Menindaklanjuti persetujuan tertentu berdasarkan id          |
| `block`                      | Juga memblokir ship secara native agar tidak dapat terhubung kembali |
| `unblock ~ship`              | Membatalkan pemblokiran native                               |
| `blocked`                    | Mencantumkan ship yang saat ini diblokir                     |
| `pending`                    | Mencantumkan permintaan persetujuan yang tertunda            |

Tanpa konfigurasi `ownerShip`, DM dan penyebutan kanal yang tidak diotorisasi hanya dibuang dan dicatat;
tidak ada prompt persetujuan.

## Pengaturan penerimaan otomatis

Terima otomatis undangan DM dari ship yang sudah ada di `dmAllowlist` (pemilik selalu diterima otomatis
terlepas dari flag ini):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Terima otomatis undangan grup dari daftar yang diizinkan (gagal tertutup: dengan `autoAcceptGroupInvites: true` dan
`groupInviteAllowlist` kosong, tidak ada undangan dari selain pemilik yang diterima):

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

## Muat ulang langsung melalui penyimpanan pengaturan Urbit

Sebagian besar pengaturan di atas (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) dicerminkan ke agen
`%settings` milik ship (desk `moltbot`, bucket `tlon`) saat pertama kali dijalankan, lalu dibaca langsung dari sana,
sehingga perubahan yang dilakukan melalui klien Landscape atau perintah pengaturan skill bawaan diterapkan tanpa
memulai ulang Gateway. `channelRules` dan persetujuan tertunda juga disimpan di sana sebagai JSON. Konfigurasi
file tetap menjadi sumber kebenaran untuk nilai yang tidak pernah ditulis ke penyimpanan pengaturan.

## Target pengiriman (CLI/Cron)

Gunakan dengan `openclaw message send` atau pengiriman Cron:

- DM: `~sampel-palnet` atau `dm/~sampel-palnet`
- Grup: `chat/~host-ship/channel` atau `group:~host-ship/channel`

## Skill bawaan

Plugin ini menyertakan [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), sebuah CLI untuk
operasi Urbit langsung, yang tersedia secara otomatis setelah plugin diinstal:

- **Aktivitas**: penyebutan, balasan, belum dibaca
- **Kanal**: mencantumkan, membuat, mengganti nama
- **Kontak**: mencantumkan/mendapatkan/memperbarui profil
- **Grup**: membuat, bergabung, alur undangan/permintaan, peran
- **Hook**: mengelola hook kanal
- **Pesan**: riwayat, pencarian
- **DM**: mengirim, bereaksi, menerima/menolak
- **Postingan**: bereaksi, menghapus
- **Buku catatan**: memposting ke kanal diari
- **Pengaturan**: memuat ulang langsung konfigurasi plugin melalui penyimpanan pengaturan di atas

## Kemampuan

| Fitur           | Status                                                 |
| --------------- | ------------------------------------------------------ |
| Pesan langsung  | Didukung                                               |
| Grup/kanal      | Didukung (secara default dibatasi oleh penyebutan)     |
| Utas            | Didukung (terus membalas setelah bergabung)            |
| Teks kaya       | Markdown dikonversi ke format native Tlon              |
| Gambar          | Pesan masuk diunduh, pesan keluar diunggah             |
| Reaksi          | Hanya melalui [skill bawaan](#bundled-skill)           |
| Jajak pendapat  | Tidak didukung                                         |
| Perintah native | Secara default hanya untuk pemilik                     |

## Pemecahan masalah

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Kegagalan umum:

- **DM diabaikan**: pengirim tidak ada di `dmAllowlist` dan tidak ada `ownerShip` yang dikonfigurasi untuk alur persetujuan.
- **Pesan grup diabaikan**: kanal tidak ditemukan/disematkan, atau pengirim gagal memperoleh otorisasi tanpa
  `ownerShip` untuk mengantrekan persetujuan.
- **Kesalahan koneksi**: periksa apakah URL ship dapat dijangkau; tetapkan
  `network.dangerouslyAllowPrivateNetwork` untuk ship lokal.
- **Kesalahan autentikasi**: kode masuk berubah secara berkala — salin kode saat ini dari ship Anda.

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

| Kunci                                                  | Arti                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Mengaktifkan/menonaktifkan dimulainya kanal.                    |
| `channels.tlon.ship`                                   | Nama ship Urbit bot (misalnya `~sampel-palnet`).              |
| `channels.tlon.url`                                    | URL ship (misalnya `https://sampel-palnet.tlon.network`).                         |
| `channels.tlon.code`                                   | Kode masuk ship.                                               |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Mengizinkan URL ship localhost/LAN (ikut serta SSRF).           |
| `channels.tlon.ownerShip`                              | Ship pemilik: selalu diotorisasi, menerima permintaan persetujuan. |
| `channels.tlon.dmAllowlist`                            | Ship yang diizinkan mengirim DM (kosong = tidak ada selain pemilik). |
| `channels.tlon.autoAcceptDmInvites`                    | Menerima otomatis DM dari ship di `dmAllowlist`.           |
| `channels.tlon.autoAcceptGroupInvites`                 | Menerima otomatis undangan grup dari `groupInviteAllowlist`.        |
| `channels.tlon.groupInviteAllowlist`                   | Ship yang undangan grupnya diterima otomatis.                  |
| `channels.tlon.autoDiscoverChannels`                   | Menemukan otomatis kanal grup yang diikuti (default: `false`). |
| `channels.tlon.implicitMentions.threadParticipation`   | Mengizinkan tindak lanjut pada utas yang diikuti melewati pembatasan penyebutan. |
| `channels.tlon.groupChannels`                          | Sarang kanal yang disematkan secara manual.                    |
| `channels.tlon.defaultAuthorizedShips`                 | Ship yang diotorisasi untuk semua kanal (digunakan saat tidak ada aturan yang cocok). |
| `channels.tlon.authorization.channelRules`             | Mode autentikasi per sarang kanal + daftar yang diizinkan.     |
| `channels.tlon.showModelSignature`                     | Menambahkan `_[Generated by <model>]_` ke balasan.                     |
| `channels.tlon.responsePrefix`                         | Prefiks statis yang ditambahkan di awal balasan keluar.        |
| `channels.tlon.accounts.<id>`                          | Akun bernama tambahan (penyiapan multi-ship).                  |

## Catatan

- Balasan grup memerlukan penyebutan @ (misalnya `~your-bot-ship`) kecuali bot sudah bergabung dalam utas tersebut.
- Balasan utas masuk ke dalam utas; bot juga menerima 10 pesan terakhir dari konteks utas yang ditambahkan di awal
  untuk agen.
- Teks kaya (tebal, miring, kode, tajuk, daftar) dikonversi ke format asli Tlon.
- Mengirim pesan masuk yang meminta ringkasan kanal (misalnya "rangkum
  kanal ini") akan memicu perangkuman riwayat bawaan, bukan alur balasan normal.

## Terkait

- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
