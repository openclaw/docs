---
read_when:
    - Mengerjakan fitur saluran Tlon/Urbit
summary: Status dukungan, kemampuan, dan konfigurasi Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-12T14:00:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon adalah perpesanan terdesentralisasi yang dibangun di atas Urbit. OpenClaw terhubung ke kapal Urbit Anda dan
merespons pesan langsung serta pesan obrolan grup. Secara default, balasan grup memerlukan penyebutan @, dengan
aturan otorisasi dan alur persetujuan pemilik yang diterapkan di atasnya.

Status: plugin bawaan. Pesan langsung, penyebutan grup, utas, teks kaya, pengunggahan/pengunduhan gambar, dan
sistem persetujuan pemilik didukung. Reaksi dan jajak pendapat tidak didukung.

## Plugin bawaan

Tlon disertakan dalam rilis OpenClaw saat ini; build terpaket tidak memerlukan instalasi terpisah.

Pada build lama atau instalasi khusus yang tidak menyertakannya, instal dari npm:

```bash
openclaw plugins install @openclaw/tlon
```

Gunakan nama paket tanpa versi untuk mengikuti tag rilis saat ini. Sematkan versi (`@openclaw/tlon@x.y.z`)
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
      ownerShip: "~your-main-ship", // disarankan: kapal Anda, selalu diotorisasi
    },
  },
}
```

Mulai ulang Gateway setelah mengedit konfigurasi secara langsung. Kemudian kirim pesan langsung ke bot atau sebut
bot dengan @ di saluran grup.

## Kapal privat/LAN

Secara default, OpenClaw memblokir nama host dan rentang IP privat/internal untuk perlindungan SSRF. Jika
kapal Anda berjalan di jaringan privat (localhost, IP LAN, nama host internal), aktifkan secara eksplisit:

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
`http://my-ship.local:8080`. Aktifkan ini hanya untuk URL kapal yang Anda percayai; tindakan ini menonaktifkan
perlindungan SSRF untuk permintaan HTTP akun tersebut.

<Note>
`channels.tlon.allowPrivateNetwork` (kunci datar) telah dihentikan. `openclaw doctor --fix` memindahkannya ke
`channels.tlon.network.dangerouslyAllowPrivateNetwork` secara otomatis.
</Note>

## Saluran grup

Sematkan saluran secara manual, atau aktifkan penemuan otomatis:

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

`autoDiscoverChannels` secara default bernilai `false` jika tidak ditetapkan dalam konfigurasi; wisaya penyiapan
secara default memilih ya pada perintah dan menulis `true` secara eksplisit. Saat diaktifkan, OpenClaw melakukan scry
pada grup yang telah diikuti saat dimulai, memantau saluran baru ketika undangan grup diterima, dan memeriksa ulang setiap 2 menit.

## Kontrol akses

Daftar izin pesan langsung (kosong = pesan langsung tidak diizinkan kecuali pengirim adalah `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Otorisasi grup secara default adalah `restricted` untuk setiap saluran. Tetapkan `defaultAuthorizedShips` sebagai
dasar, lalu timpa untuk setiap sarang saluran:

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

Setelah bot membalas di dalam sebuah utas, bot akan terus merespons pesan berikutnya dalam utas tersebut
tanpa memerlukan penyebutan lagi.

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

Kapal pemilik diotorisasi di mana saja: undangan pesan langsung selalu diterima otomatis, undangan grup
selalu diterima otomatis, dan pesan saluran selalu lolos otorisasi. Pemilik tidak perlu
tercantum dalam `dmAllowlist`, `defaultAuthorizedShips`, atau `groupInviteAllowlist`.

Saat `ownerShip` ditetapkan, permintaan yang tidak diotorisasi tidak sekadar dibuang — permintaan tersebut
dimasukkan ke antrean persetujuan tertunda dan pesan langsung dikirimkan kepada pemilik:

- Permintaan pesan langsung dari kapal yang tidak ada di `dmAllowlist`
- Penyebutan di saluran ketika pengirim gagal melewati otorisasi
- Undangan grup dari kapal yang tidak ada di `groupInviteAllowlist` (saat penerimaan otomatis dinonaktifkan,
  atau diaktifkan tetapi pengundang tidak ada dalam daftar izin)

Pemilik membalas melalui pesan langsung untuk menindaklanjuti permintaan:

| Balasan pemilik              | Efek                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| `approve` / `deny` / `block` | Menindaklanjuti persetujuan tertunda terbaru                  |
| `approve <id>` / `deny <id>` | Menindaklanjuti persetujuan tertentu berdasarkan id           |
| `block`                      | Juga memblokir kapal secara bawaan agar tidak dapat terhubung kembali |
| `unblock ~ship`              | Membatalkan pemblokiran bawaan                               |
| `blocked`                    | Menampilkan kapal yang saat ini diblokir                     |
| `pending`                    | Menampilkan permintaan persetujuan yang tertunda             |

Tanpa `ownerShip` yang dikonfigurasi, pesan langsung dan penyebutan saluran yang tidak diotorisasi hanya dibuang dan dicatat;
tidak ada permintaan persetujuan.

## Pengaturan penerimaan otomatis

Terima otomatis undangan pesan langsung dari kapal yang sudah ada di `dmAllowlist` (pemilik selalu diterima otomatis
terlepas dari tanda ini):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Terima otomatis undangan grup dari daftar izin (gagal secara tertutup: dengan `autoAcceptGroupInvites: true` dan
`groupInviteAllowlist` kosong, tidak ada undangan selain dari pemilik yang diterima):

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
`%settings` milik kapal (desk `moltbot`, bucket `tlon`) pada proses pertama dan kemudian dibaca secara langsung dari sana,
sehingga perubahan yang dibuat melalui klien Landscape atau perintah pengaturan keterampilan bawaan diterapkan tanpa
memulai ulang Gateway. `channelRules` dan persetujuan tertunda juga disimpan di sana sebagai JSON. Konfigurasi
berkas tetap menjadi sumber kebenaran untuk nilai yang tidak pernah ditulis ke penyimpanan pengaturan.

## Target pengiriman (CLI/Cron)

Gunakan dengan `openclaw message send` atau pengiriman Cron:

- Pesan langsung: `~sampel-palnet` atau `dm/~sampel-palnet`
- Grup: `chat/~host-ship/channel` atau `group:~host-ship/channel`

## Keterampilan bawaan

Plugin menyertakan [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), sebuah CLI untuk
operasi Urbit langsung, yang tersedia secara otomatis setelah plugin diinstal:

- **Aktivitas**: penyebutan, balasan, pesan belum dibaca
- **Saluran**: tampilkan, buat, ganti nama
- **Kontak**: tampilkan/ambil/perbarui profil
- **Grup**: buat, gabung, alur undangan/permintaan, peran
- **Kait**: kelola kait saluran
- **Pesan**: riwayat, pencarian
- **Pesan langsung**: kirim, beri reaksi, terima/tolak
- **Kiriman**: beri reaksi, hapus
- **Buku catatan**: kirim ke saluran buku harian
- **Pengaturan**: muat ulang langsung konfigurasi plugin melalui penyimpanan pengaturan di atas

## Kemampuan

| Fitur           | Status                                                   |
| --------------- | -------------------------------------------------------- |
| Pesan langsung  | Didukung                                                 |
| Grup/saluran    | Didukung (secara default memerlukan penyebutan)          |
| Utas            | Didukung (terus membalas setelah bergabung)              |
| Teks kaya       | Markdown dikonversi ke format bawaan Tlon                |
| Gambar          | Masuk diunduh, keluar diunggah                            |
| Reaksi          | Hanya melalui [keterampilan bawaan](#bundled-skill)      |
| Jajak pendapat  | Tidak didukung                                           |
| Perintah bawaan | Secara default hanya untuk pemilik                       |

## Pemecahan masalah

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Kegagalan umum:

- **Pesan langsung diabaikan**: pengirim tidak ada di `dmAllowlist` dan tidak ada `ownerShip` yang dikonfigurasi untuk alur persetujuan.
- **Pesan grup diabaikan**: saluran tidak ditemukan/disematkan, atau pengirim gagal melewati otorisasi tanpa
  `ownerShip` untuk mengantrekan persetujuan.
- **Kesalahan koneksi**: periksa apakah URL kapal dapat dijangkau; tetapkan
  `network.dangerouslyAllowPrivateNetwork` untuk kapal lokal.
- **Kesalahan autentikasi**: kode masuk berganti secara berkala — salin kode saat ini dari kapal Anda.

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

| Kunci                                                  | Arti                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Aktifkan/nonaktifkan permulaan saluran.                        |
| `channels.tlon.ship`                                   | Nama kapal Urbit milik bot (mis. `~sampel-palnet`).            |
| `channels.tlon.url`                                    | URL kapal (mis. `https://sampel-palnet.tlon.network`).         |
| `channels.tlon.code`                                   | Kode masuk kapal.                                              |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Izinkan URL kapal localhost/LAN (persetujuan eksplisit SSRF).  |
| `channels.tlon.ownerShip`                              | Kapal pemilik: selalu diotorisasi, menerima permintaan persetujuan. |
| `channels.tlon.dmAllowlist`                            | Kapal yang diizinkan mengirim pesan langsung (kosong = hanya pemilik). |
| `channels.tlon.autoAcceptDmInvites`                    | Terima otomatis pesan langsung dari kapal dalam `dmAllowlist`. |
| `channels.tlon.autoAcceptGroupInvites`                 | Terima otomatis undangan grup dari `groupInviteAllowlist`.     |
| `channels.tlon.groupInviteAllowlist`                   | Kapal yang undangan grupnya diterima otomatis.                 |
| `channels.tlon.autoDiscoverChannels`                   | Temukan otomatis saluran grup yang diikuti (default: `false`). |
| `channels.tlon.groupChannels`                          | Sarang saluran yang disematkan secara manual.                  |
| `channels.tlon.defaultAuthorizedShips`                 | Kapal yang diotorisasi untuk semua saluran (digunakan saat tidak ada aturan yang cocok). |
| `channels.tlon.authorization.channelRules`             | Mode autentikasi + daftar izin untuk setiap sarang saluran.    |
| `channels.tlon.showModelSignature`                     | Tambahkan `_[Generated by <model>]_` ke balasan.               |
| `channels.tlon.responsePrefix`                         | Awalan statis yang ditambahkan di depan balasan keluar.        |
| `channels.tlon.accounts.<id>`                          | Akun bernama tambahan (penyiapan beberapa kapal).              |

## Catatan

- Balasan grup memerlukan penyebutan @ (mis. `~your-bot-ship`) kecuali bot sudah bergabung dengan utas tersebut.
- Balasan utas masuk ke dalam utas; bot juga menerima 10 pesan terakhir dari konteks utas yang ditambahkan
  di depan untuk agen.
- Teks kaya (tebal, miring, kode, judul, daftar) dikonversi ke format bawaan Tlon.
- Mengirim pesan masuk yang meminta ringkasan saluran (misalnya "rangkum saluran ini")
  memicu perangkuman riwayat bawaan sebagai pengganti alur balasan normal.

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi pesan langsung dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan persyaratan penyebutan
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
