---
read_when:
    - Mengerjakan fitur saluran Tlon/Urbit
summary: Status dukungan, kemampuan, dan konfigurasi Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-30T09:36:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon adalah messenger terdesentralisasi yang dibangun di atas Urbit. OpenClaw terhubung ke ship Urbit Anda dan dapat
menanggapi DM dan pesan obrolan grup. Balasan grup secara default memerlukan mention @ dan dapat
dibatasi lebih lanjut melalui allowlist.

Status: Plugin bawaan. DM, mention grup, balasan thread, pemformatan rich text, dan
unggahan gambar didukung. Reaksi dan polling belum didukung.

## Plugin bawaan

Tlon dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi build terpaket
normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Tlon, instal
paket npm saat ini ketika sudah diterbitkan:

Instal melalui CLI (registry npm, ketika paket saat ini tersedia):

```bash
openclaw plugins install @openclaw/tlon
```

Jika npm melaporkan paket milik OpenClaw sebagai deprecated, gunakan build OpenClaw
terpaket saat ini atau jalur checkout lokal hingga paket npm yang lebih baru
diterbitkan.

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan

1. Pastikan Plugin Tlon tersedia.
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Kumpulkan URL ship dan kode login Anda.
3. Konfigurasikan `channels.tlon`.
4. Mulai ulang Gateway.
5. Kirim DM ke bot atau mention bot di channel grup.

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
Anda harus secara eksplisit ikut serta:

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

Allowlist DM (kosong = tidak ada DM yang diizinkan, gunakan `ownerShip` untuk alur persetujuan):

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

Tetapkan ship pemilik untuk menerima permintaan persetujuan ketika pengguna tidak terotorisasi mencoba berinteraksi:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Ship pemilik **secara otomatis terotorisasi di mana saja** — undangan DM diterima otomatis dan
pesan channel selalu diizinkan. Anda tidak perlu menambahkan pemilik ke `dmAllowlist` atau
`defaultAuthorizedShips`.

Saat diatur, pemilik menerima notifikasi DM untuk:

- Permintaan DM dari ship yang tidak ada di allowlist
- Mention di channel tanpa otorisasi
- Permintaan undangan grup

## Pengaturan terima otomatis

Terima otomatis undangan DM (untuk ship di dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Terima otomatis undangan grup:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Target pengiriman (CLI/cron)

Gunakan ini dengan `openclaw message send` atau pengiriman cron:

- DM: `~sampel-palnet` atau `dm/~sampel-palnet`
- Grup: `chat/~host-ship/channel` atau `group:~host-ship/channel`

## Skill bawaan

Plugin Tlon menyertakan skill bawaan ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
yang menyediakan akses CLI ke operasi Tlon:

- **Kontak**: mengambil/memperbarui profil, mencantumkan kontak
- **Channel**: mencantumkan, membuat, memposting pesan, mengambil riwayat
- **Grup**: mencantumkan, membuat, mengelola anggota
- **DM**: mengirim pesan, bereaksi terhadap pesan
- **Reaksi**: menambah/menghapus reaksi emoji pada postingan dan DM
- **Pengaturan**: mengelola izin Plugin melalui perintah slash

Skill tersedia secara otomatis saat Plugin diinstal.

## Kapabilitas

| Fitur           | Status                                      |
| --------------- | ------------------------------------------- |
| Pesan langsung  | ✅ Didukung                                 |
| Grup/channel    | ✅ Didukung (mention-gated secara default)  |
| Thread          | ✅ Didukung (balasan otomatis dalam thread) |
| Rich text       | ✅ Markdown dikonversi ke format Tlon       |
| Gambar          | ✅ Diunggah ke penyimpanan Tlon             |
| Reaksi          | ✅ Melalui [skill bawaan](#bundled-skill)   |
| Polling         | ❌ Belum didukung                           |
| Perintah native | ✅ Didukung (hanya pemilik secara default)  |

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
- **Pesan grup diabaikan**: channel tidak ditemukan atau pengirim tidak terotorisasi.
- **Kesalahan koneksi**: periksa URL ship dapat dijangkau; aktifkan `allowPrivateNetwork` untuk ship lokal.
- **Kesalahan autentikasi**: verifikasi kode login masih berlaku (kode berotasi).

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi penyedia:

- `channels.tlon.enabled`: mengaktifkan/menonaktifkan startup channel.
- `channels.tlon.ship`: nama ship Urbit bot (mis. `~sampel-palnet`).
- `channels.tlon.url`: URL ship (mis. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: kode login ship.
- `channels.tlon.allowPrivateNetwork`: mengizinkan URL localhost/LAN (bypass SSRF).
- `channels.tlon.ownerShip`: ship pemilik untuk sistem persetujuan (selalu terotorisasi).
- `channels.tlon.dmAllowlist`: ship yang diizinkan untuk DM (kosong = tidak ada).
- `channels.tlon.autoAcceptDmInvites`: menerima DM secara otomatis dari ship yang ada di allowlist.
- `channels.tlon.autoAcceptGroupInvites`: menerima semua undangan grup secara otomatis.
- `channels.tlon.autoDiscoverChannels`: menemukan channel grup secara otomatis (default: true).
- `channels.tlon.groupChannels`: nest channel yang disematkan secara manual.
- `channels.tlon.defaultAuthorizedShips`: ship yang terotorisasi untuk semua channel.
- `channels.tlon.authorization.channelRules`: aturan auth per channel.
- `channels.tlon.showModelSignature`: menambahkan nama model ke pesan.

## Catatan

- Balasan grup memerlukan mention (mis. `~your-bot-ship`) untuk merespons.
- Balasan thread: jika pesan masuk berada dalam thread, OpenClaw membalas di dalam thread.
- Rich text: pemformatan Markdown (tebal, miring, kode, header, daftar) dikonversi ke format native Tlon.
- Gambar: URL diunggah ke penyimpanan Tlon dan disematkan sebagai blok gambar.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating mention
- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
