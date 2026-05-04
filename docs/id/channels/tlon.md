---
read_when:
    - Mengerjakan fitur saluran Tlon/Urbit
summary: Status dukungan, kemampuan, dan konfigurasi Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-04T02:22:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1718044541b431ff2437508e7e6659c14206f4aa84ab8b207e0d791dea2a48c5
    source_path: channels/tlon.md
    workflow: 16
---

Tlon adalah messenger terdesentralisasi yang dibangun di atas Urbit. OpenClaw terhubung ke ship Urbit Anda dan dapat
menanggapi DM dan pesan obrolan grup. Balasan grup memerlukan sebutan @ secara default dan dapat
dibatasi lebih lanjut melalui daftar izin.

Status: Plugin terbundel. DM, sebutan grup, balasan utas, pemformatan teks kaya, dan
unggahan gambar didukung. Reaksi dan jajak pendapat belum didukung.

## Plugin terbundel

Tlon dikirim sebagai Plugin terbundel dalam rilis OpenClaw saat ini, sehingga build paket
normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Tlon, instal
paket npm saat ini:

Instal melalui CLI (registri npm):

```bash
openclaw plugins install @openclaw/tlon
```

Gunakan paket polos untuk mengikuti tag rilis resmi saat ini. Sematkan versi
persis hanya ketika Anda membutuhkan instalasi yang dapat direproduksi.

Checkout lokal (saat menjalankan dari repo git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan

1. Pastikan Plugin Tlon tersedia.
   - Rilis paket OpenClaw saat ini sudah membundelnya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Kumpulkan URL ship dan kode login Anda.
3. Konfigurasikan `channels.tlon`.
4. Mulai ulang Gateway.
5. Kirim DM ke bot atau sebut bot di channel grup.

Konfigurasi minimal (satu akun):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Ship privat/LAN

Secara default, OpenClaw memblokir hostname dan rentang IP privat/internal untuk perlindungan SSRF.
Jika ship Anda berjalan di jaringan privat (localhost, IP LAN, atau hostname internal),
Anda harus memilih ikut serta secara eksplisit:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Ini berlaku untuk URL seperti:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Aktifkan ini hanya jika Anda memercayai jaringan lokal Anda. Pengaturan ini menonaktifkan perlindungan SSRF
untuk permintaan ke URL ship Anda.

## Channel grup

Penemuan otomatis diaktifkan secara default. Anda juga dapat menyematkan channel secara manual:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Nonaktifkan penemuan otomatis:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Kontrol akses

Daftar izin DM (kosong = tidak ada DM yang diizinkan, gunakan `ownerShip` untuk alur persetujuan):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Otorisasi grup (dibatasi secara default):

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

## Pemilik dan sistem persetujuan

Atur ship pemilik untuk menerima permintaan persetujuan ketika pengguna yang tidak berwenang mencoba berinteraksi:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Ship pemilik **secara otomatis diotorisasi di mana saja** — undangan DM diterima otomatis dan
pesan channel selalu diizinkan. Anda tidak perlu menambahkan pemilik ke `dmAllowlist` atau
`defaultAuthorizedShips`.

Ketika diatur, pemilik menerima notifikasi DM untuk:

- Permintaan DM dari ship yang tidak ada dalam daftar izin
- Sebutan di channel tanpa otorisasi
- Permintaan undangan grup

## Pengaturan terima otomatis

Terima otomatis undangan DM (untuk ship dalam dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Terima otomatis undangan grup dari ship tepercaya:

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

`autoAcceptGroupInvites` gagal tertutup ketika `groupInviteAllowlist` kosong. Atur
daftar izin ke ship yang undangan grupnya harus diterima secara otomatis.

## Target pengiriman (CLI/Cron)

Gunakan ini dengan `openclaw message send` atau pengiriman Cron:

- DM: `~sampel-palnet` atau `dm/~sampel-palnet`
- Grup: `chat/~host-ship/channel` atau `group:~host-ship/channel`

## Skill terbundel

Plugin Tlon menyertakan skill terbundel ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
yang menyediakan akses CLI ke operasi Tlon:

- **Kontak**: dapatkan/perbarui profil, cantumkan kontak
- **Channel**: cantumkan, buat, kirim pesan, ambil riwayat
- **Grup**: cantumkan, buat, kelola anggota
- **DM**: kirim pesan, beri reaksi ke pesan
- **Reaksi**: tambah/hapus reaksi emoji ke postingan dan DM
- **Pengaturan**: kelola izin Plugin melalui perintah slash

Skill tersedia secara otomatis ketika Plugin diinstal.

## Kapabilitas

| Fitur           | Status                                     |
| --------------- | ------------------------------------------ |
| Pesan langsung  | ✅ Didukung                                |
| Grup/channel    | ✅ Didukung (dibatasi sebutan secara default) |
| Utas            | ✅ Didukung (balasan otomatis dalam utas)  |
| Teks kaya       | ✅ Markdown dikonversi ke format Tlon      |
| Gambar          | ✅ Diunggah ke penyimpanan Tlon            |
| Reaksi          | ✅ Melalui [skill terbundel](#bundled-skill) |
| Jajak pendapat  | ❌ Belum didukung                          |
| Perintah native | ✅ Didukung (hanya pemilik secara default) |

## Pemecahan masalah

Jalankan tangga ini terlebih dahulu:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Kegagalan umum:

- **DM diabaikan**: pengirim tidak ada di `dmAllowlist` dan tidak ada `ownerShip` yang dikonfigurasi untuk alur persetujuan.
- **Pesan grup diabaikan**: channel tidak ditemukan atau pengirim tidak diotorisasi.
- **Kesalahan koneksi**: periksa URL ship dapat dijangkau; aktifkan `allowPrivateNetwork` untuk ship lokal.
- **Kesalahan auth**: verifikasi kode login masih berlaku (kode berotasi).

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi penyedia:

- `channels.tlon.enabled`: aktifkan/nonaktifkan startup channel.
- `channels.tlon.ship`: nama ship Urbit bot (mis. `~sampel-palnet`).
- `channels.tlon.url`: URL ship (mis. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: kode login ship.
- `channels.tlon.allowPrivateNetwork`: izinkan URL localhost/LAN (bypass SSRF).
- `channels.tlon.ownerShip`: ship pemilik untuk sistem persetujuan (selalu diotorisasi).
- `channels.tlon.dmAllowlist`: ship yang diizinkan mengirim DM (kosong = tidak ada).
- `channels.tlon.autoAcceptDmInvites`: terima otomatis DM dari ship yang ada di daftar izin.
- `channels.tlon.autoAcceptGroupInvites`: terima otomatis undangan grup dari ship yang ada di daftar izin.
- `channels.tlon.groupInviteAllowlist`: ship yang undangan grupnya boleh diterima otomatis.
- `channels.tlon.autoDiscoverChannels`: temukan channel grup secara otomatis (default: true).
- `channels.tlon.groupChannels`: nest channel yang disematkan secara manual.
- `channels.tlon.defaultAuthorizedShips`: ship yang diotorisasi untuk semua channel.
- `channels.tlon.authorization.channelRules`: aturan auth per channel.
- `channels.tlon.showModelSignature`: tambahkan nama model ke pesan.

## Catatan

- Balasan grup memerlukan sebutan (mis. `~your-bot-ship`) untuk menanggapi.
- Balasan utas: jika pesan masuk berada dalam utas, OpenClaw membalas di dalam utas.
- Teks kaya: pemformatan Markdown (tebal, miring, kode, header, daftar) dikonversi ke format native Tlon.
- Gambar: URL diunggah ke penyimpanan Tlon dan disematkan sebagai blok gambar.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan sebutan
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan pengerasan
