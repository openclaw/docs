---
read_when:
    - Mengerjakan fitur channel Tlon/Urbit
summary: Status dukungan, kemampuan, dan konfigurasi Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-24T08:59:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff92473a958a4cba355351a686431748ea801b1c640cc5873e8bdac8f37a53f
    source_path: channels/tlon.md
    workflow: 15
---

Tlon adalah messenger terdesentralisasi yang dibangun di atas Urbit. OpenClaw terhubung ke ship Urbit Anda dan dapat
merespons DM serta pesan chat grup. Balasan grup memerlukan mention @ secara default dan dapat
dibatasi lebih lanjut melalui allowlist.

Status: Plugin bawaan. DM, mention grup, balasan thread, pemformatan rich text, dan
unggahan gambar didukung. Reaksi dan polling belum didukung.

## Plugin bawaan

Tlon dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, sehingga build
terpaket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Tlon, instal
secara manual:

Instal melalui CLI (registry npm):

```bash
openclaw plugins install @openclaw/tlon
```

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detail: [Plugins](/id/tools/plugin)

## Penyiapan

1. Pastikan Plugin Tlon tersedia.
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Kumpulkan URL ship dan kode login Anda.
3. Konfigurasikan `channels.tlon`.
4. Mulai ulang Gateway.
5. Kirim DM ke bot atau mention bot di channel grup.

Config minimal (akun tunggal):

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
Anda harus memilih untuk mengaktifkannya secara eksplisit:

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

Setel ship owner untuk menerima permintaan persetujuan saat pengguna yang tidak berwenang mencoba berinteraksi:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Ship owner **secara otomatis diotorisasi di mana pun** — undangan DM diterima otomatis dan
pesan channel selalu diizinkan. Anda tidak perlu menambahkan owner ke `dmAllowlist` atau
`defaultAuthorizedShips`.

Jika disetel, ship owner menerima notifikasi DM untuk:

- Permintaan DM dari ship yang tidak ada di allowlist
- Mention di channel tanpa otorisasi
- Permintaan undangan grup

## Pengaturan penerimaan otomatis

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

## Target pengiriman (CLI/Cron)

Gunakan ini dengan `openclaw message send` atau pengiriman Cron:

- DM: `~sampel-palnet` atau `dm/~sampel-palnet`
- Grup: `chat/~host-ship/channel` atau `group:~host-ship/channel`

## Skill bawaan

Plugin Tlon menyertakan Skills bawaan ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
yang menyediakan akses CLI ke operasi Tlon:

- **Kontak**: dapatkan/perbarui profil, daftar kontak
- **Channels**: daftar, buat, posting pesan, ambil riwayat
- **Grup**: daftar, buat, kelola anggota
- **DM**: kirim pesan, beri reaksi ke pesan
- **Reaksi**: tambah/hapus reaksi emoji ke postingan dan DM
- **Pengaturan**: kelola izin Plugin melalui slash command

Skill ini otomatis tersedia saat Plugin terinstal.

## Kemampuan

| Fitur           | Status                                   |
| --------------- | ---------------------------------------- |
| Pesan langsung  | ✅ Didukung                              |
| Grup/channel    | ✅ Didukung (dibatasi mention secara default) |
| Threads         | ✅ Didukung (balasan otomatis di thread) |
| Rich text       | ✅ Markdown dikonversi ke format Tlon    |
| Gambar          | ✅ Diunggah ke penyimpanan Tlon          |
| Reaksi          | ✅ Melalui [skill bawaan](#bundled-skill) |
| Polling         | ❌ Belum didukung                        |
| Perintah native | ✅ Didukung (hanya owner secara default) |

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
- **Galat koneksi**: periksa URL ship dapat dijangkau; aktifkan `allowPrivateNetwork` untuk ship lokal.
- **Galat auth**: verifikasi kode login masih berlaku (kode berotasi).

## Referensi konfigurasi

Konfigurasi lengkap: [Configuration](/id/gateway/configuration)

Opsi penyedia:

- `channels.tlon.enabled`: aktifkan/nonaktifkan startup channel.
- `channels.tlon.ship`: nama ship Urbit bot (misalnya `~sampel-palnet`).
- `channels.tlon.url`: URL ship (misalnya `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: kode login ship.
- `channels.tlon.allowPrivateNetwork`: izinkan URL localhost/LAN (bypass SSRF).
- `channels.tlon.ownerShip`: ship owner untuk sistem persetujuan (selalu diotorisasi).
- `channels.tlon.dmAllowlist`: ship yang diizinkan mengirim DM (kosong = tidak ada).
- `channels.tlon.autoAcceptDmInvites`: terima otomatis DM dari ship yang ada di allowlist.
- `channels.tlon.autoAcceptGroupInvites`: terima otomatis semua undangan grup.
- `channels.tlon.autoDiscoverChannels`: temukan channel grup secara otomatis (default: true).
- `channels.tlon.groupChannels`: nest channel yang disematkan secara manual.
- `channels.tlon.defaultAuthorizedShips`: ship yang diotorisasi untuk semua channel.
- `channels.tlon.authorization.channelRules`: aturan auth per channel.
- `channels.tlon.showModelSignature`: tambahkan nama model ke pesan.

## Catatan

- Balasan grup memerlukan mention (misalnya `~your-bot-ship`) untuk merespons.
- Balasan thread: jika pesan masuk berada di thread, OpenClaw membalas di thread.
- Rich text: pemformatan Markdown (tebal, miring, kode, header, daftar) dikonversi ke format native Tlon.
- Gambar: URL diunggah ke penyimpanan Tlon dan disematkan sebagai blok gambar.

## Terkait

- [Ikhtisar Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Channel Routing](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
