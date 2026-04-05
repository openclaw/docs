---
read_when:
    - Mengerjakan fitur channel Tlon/Urbit
summary: Status dukungan Tlon/Urbit, kemampuan, dan konfigurasi
title: Tlon
x-i18n:
    generated_at: "2026-04-05T13:44:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 289cffb3c1b2d450a5f41e0d67117dfb5c192cec956d82039caac9df9f07496d
    source_path: channels/tlon.md
    workflow: 15
---

# Tlon

Tlon adalah messenger terdesentralisasi yang dibangun di atas Urbit. OpenClaw terhubung ke ship Urbit Anda dan dapat
merespons DM serta pesan chat grup. Balasan grup secara default memerlukan mention @ dan dapat
dibatasi lebih lanjut melalui allowlist.

Status: plugin bawaan. DM, mention grup, balasan thread, pemformatan rich text, dan
unggahan gambar didukung. Reaksi dan polling belum didukung.

## Plugin bawaan

Tlon tersedia sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build paket
normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Tlon, instal secara
manual:

Instal melalui CLI (registri npm):

```bash
openclaw plugins install @openclaw/tlon
```

Checkout lokal (saat berjalan dari repositori git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detail: [Plugins](/tools/plugin)

## Penyiapan

1. Pastikan plugin Tlon tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakan plugin ini.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Siapkan URL ship dan kode login Anda.
3. Konfigurasikan `channels.tlon`.
4. Mulai ulang gateway.
5. Kirim DM ke bot atau mention bot di channel grup.

Konfigurasi minimal (akun tunggal):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // direkomendasikan: ship Anda, selalu diizinkan
    },
  },
}
```

## Ship privat/LAN

Secara default, OpenClaw memblokir hostname dan rentang IP privat/internal untuk perlindungan SSRF.
Jika ship Anda berjalan di jaringan privat (localhost, IP LAN, atau hostname internal),
Anda harus mengaktifkannya secara eksplisit:

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

## Sistem owner dan persetujuan

Atur ship owner untuk menerima permintaan persetujuan saat pengguna yang tidak diotorisasi mencoba berinteraksi:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Ship owner **secara otomatis diotorisasi di mana saja** — undangan DM diterima otomatis dan
pesan channel selalu diizinkan. Anda tidak perlu menambahkan owner ke `dmAllowlist` atau
`defaultAuthorizedShips`.

Saat diatur, owner menerima notifikasi DM untuk:

- permintaan DM dari ship yang tidak ada di allowlist
- mention di channel tanpa otorisasi
- permintaan undangan grup

## Pengaturan terima otomatis

Terima otomatis undangan DM (untuk ship di `dmAllowlist`):

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

- **Kontak**: dapatkan/perbarui profil, daftar kontak
- **Channel**: daftar, buat, kirim pesan, ambil riwayat
- **Grup**: daftar, buat, kelola anggota
- **DM**: kirim pesan, beri reaksi pada pesan
- **Reaksi**: tambahkan/hapus reaksi emoji ke post dan DM
- **Pengaturan**: kelola izin plugin melalui perintah slash

Skill ini otomatis tersedia saat plugin diinstal.

## Kemampuan

| Fitur           | Status                                  |
| --------------- | --------------------------------------- |
| Pesan langsung  | ✅ Didukung                             |
| Grup/channel    | ✅ Didukung (secara default dibatasi mention) |
| Thread          | ✅ Didukung (balasan otomatis di thread) |
| Rich text       | ✅ Markdown dikonversi ke format Tlon   |
| Gambar          | ✅ Diunggah ke penyimpanan Tlon         |
| Reaksi          | ✅ Melalui [skill bawaan](#skill-bawaan) |
| Polling         | ❌ Belum didukung                       |
| Perintah native | ✅ Didukung (secara default hanya owner) |

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
- **Error koneksi**: periksa apakah URL ship dapat dijangkau; aktifkan `allowPrivateNetwork` untuk ship lokal.
- **Error autentikasi**: pastikan kode login masih berlaku (kode berotasi).

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi](/gateway/configuration)

Opsi provider:

- `channels.tlon.enabled`: aktifkan/nonaktifkan startup channel.
- `channels.tlon.ship`: nama ship Urbit bot (mis. `~sampel-palnet`).
- `channels.tlon.url`: URL ship (mis. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: kode login ship.
- `channels.tlon.allowPrivateNetwork`: izinkan URL localhost/LAN (melewati SSRF).
- `channels.tlon.ownerShip`: ship owner untuk sistem persetujuan (selalu diotorisasi).
- `channels.tlon.dmAllowlist`: ship yang diizinkan mengirim DM (kosong = tidak ada).
- `channels.tlon.autoAcceptDmInvites`: terima otomatis DM dari ship yang ada di allowlist.
- `channels.tlon.autoAcceptGroupInvites`: terima otomatis semua undangan grup.
- `channels.tlon.autoDiscoverChannels`: temukan channel grup secara otomatis (default: true).
- `channels.tlon.groupChannels`: nest channel yang disematkan secara manual.
- `channels.tlon.defaultAuthorizedShips`: ship yang diotorisasi untuk semua channel.
- `channels.tlon.authorization.channelRules`: aturan otorisasi per channel.
- `channels.tlon.showModelSignature`: tambahkan nama model ke pesan.

## Catatan

- Balasan grup memerlukan mention (mis. `~your-bot-ship`) agar merespons.
- Balasan thread: jika pesan masuk berada di thread, OpenClaw akan membalas di thread.
- Rich text: pemformatan Markdown (tebal, miring, kode, header, daftar) dikonversi ke format native Tlon.
- Gambar: URL diunggah ke penyimpanan Tlon dan disematkan sebagai blok gambar.

## Terkait

- [Ikhtisar Channel](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/channels/groups) — perilaku chat grup dan penyaringan mention
- [Perutean Channel](/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/gateway/security) — model akses dan hardening
