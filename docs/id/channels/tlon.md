---
read_when:
    - Mengerjakan fitur kanal Tlon/Urbit
summary: Status dukungan, kemampuan, dan konfigurasi Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon adalah messenger terdesentralisasi yang dibangun di atas Urbit. OpenClaw terhubung ke ship Urbit Anda dan dapat
merespons DM serta pesan chat grup. Balasan grup secara default memerlukan mention @ dan dapat
dibatasi lebih lanjut melalui allowlist.

Status: plugin bawaan. DM, mention grup, balasan thread, pemformatan rich text, dan
unggahan gambar didukung. Reaksi dan polling belum didukung.

## Plugin bawaan

Tlon dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, sehingga build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Tlon, instal
paket npm saat ini:

Instal melalui CLI (registry npm):

```bash
openclaw plugins install @openclaw/tlon
```

Gunakan paket polos untuk mengikuti tag rilis resmi saat ini. Sematkan versi yang tepat
hanya saat Anda memerlukan instalasi yang dapat direproduksi.

Checkout lokal (saat menjalankan dari repo git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan

1. Pastikan plugin Tlon tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Kumpulkan URL ship dan kode login Anda.
3. Konfigurasikan `channels.tlon`.
4. Mulai ulang gateway.
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
Anda harus ikut serta secara eksplisit:

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

Allowlist DM (kosong = DM tidak diizinkan, gunakan `ownerShip` untuk alur persetujuan):

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

## Sistem pemilik dan persetujuan

Tetapkan ship pemilik untuk menerima permintaan persetujuan saat pengguna tanpa otorisasi mencoba berinteraksi:

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

Saat ditetapkan, pemilik menerima notifikasi DM untuk:

- Permintaan DM dari ship yang tidak ada dalam allowlist
- Mention di channel tanpa otorisasi
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

- **Kontak**: dapatkan/perbarui profil, tampilkan daftar kontak
- **Channel**: tampilkan daftar, buat, posting pesan, ambil riwayat
- **Grup**: tampilkan daftar, buat, kelola anggota
- **DM**: kirim pesan, beri reaksi pada pesan
- **Reaksi**: tambah/hapus reaksi emoji pada posting dan DM
- **Pengaturan**: kelola izin plugin melalui perintah slash

Skill tersedia secara otomatis saat plugin diinstal.

## Kapabilitas

| Fitur           | Status                                  |
| --------------- | --------------------------------------- |
| Pesan langsung  | ✅ Didukung                             |
| Grup/channel    | ✅ Didukung (berbasis mention secara default) |
| Thread          | ✅ Didukung (balasan otomatis dalam thread) |
| Rich text       | ✅ Markdown dikonversi ke format Tlon   |
| Gambar          | ✅ Diunggah ke penyimpanan Tlon         |
| Reaksi          | ✅ Melalui [skill bawaan](#bundled-skill) |
| Polling         | ❌ Belum didukung                       |
| Perintah native | ✅ Didukung (khusus pemilik secara default) |

## Pemecahan masalah

Jalankan urutan ini terlebih dahulu:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Kegagalan umum:

- **DM diabaikan**: pengirim tidak ada di `dmAllowlist` dan tidak ada `ownerShip` yang dikonfigurasi untuk alur persetujuan.
- **Pesan grup diabaikan**: channel tidak ditemukan atau pengirim tidak diotorisasi.
- **Kesalahan koneksi**: periksa apakah URL ship dapat dijangkau; aktifkan `allowPrivateNetwork` untuk ship lokal.
- **Kesalahan autentikasi**: verifikasi kode login masih berlaku (kode berotasi).

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
- `channels.tlon.autoAcceptDmInvites`: terima otomatis DM dari ship dalam allowlist.
- `channels.tlon.autoAcceptGroupInvites`: terima otomatis semua undangan grup.
- `channels.tlon.autoDiscoverChannels`: temukan channel grup secara otomatis (default: true).
- `channels.tlon.groupChannels`: nest channel yang disematkan secara manual.
- `channels.tlon.defaultAuthorizedShips`: ship yang diotorisasi untuk semua channel.
- `channels.tlon.authorization.channelRules`: aturan autentikasi per channel.
- `channels.tlon.showModelSignature`: tambahkan nama model ke pesan.

## Catatan

- Balasan grup memerlukan mention (mis. `~your-bot-ship`) untuk merespons.
- Balasan thread: jika pesan masuk berada dalam thread, OpenClaw membalas di dalam thread.
- Rich text: pemformatan Markdown (tebal, miring, kode, header, daftar) dikonversi ke format native Tlon.
- Gambar: URL diunggah ke penyimpanan Tlon dan disematkan sebagai blok gambar.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gating mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
