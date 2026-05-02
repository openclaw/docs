---
read_when:
    - Mengonfigurasi daftar izin yang sama di beberapa saluran pesan
    - Aturan akses pengirim untuk berbagi pesan langsung dan grup
    - Meninjau kontrol akses saluran pesan
summary: Daftar pengirim yang diizinkan yang dapat digunakan kembali untuk kanal pesan
title: Grup akses
x-i18n:
    generated_at: "2026-05-02T09:12:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

Grup akses adalah daftar pengirim bernama yang Anda tentukan sekali dan rujuk dari allowlist saluran dengan `accessGroup:<name>`.

Gunakan saat orang yang sama harus diizinkan di beberapa saluran pesan, atau saat satu kumpulan tepercaya harus berlaku untuk otorisasi pengirim DM dan grup.

Grup akses tidak memberikan akses dengan sendirinya. Sebuah grup hanya berpengaruh saat field allowlist merujuknya.

## Grup pengirim pesan statis

Grup pengirim statis menggunakan `type: "message.senders"`.

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

Daftar anggota dikunci berdasarkan id saluran pesan:

| Kunci      | Arti                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | Entri bersama yang diperiksa untuk setiap saluran pesan yang merujuk grup. |
| `discord`  | Entri yang diperiksa hanya untuk pencocokan allowlist Discord.          |
| `telegram` | Entri yang diperiksa hanya untuk pencocokan allowlist Telegram.         |
| `whatsapp` | Entri yang diperiksa hanya untuk pencocokan allowlist WhatsApp.         |

Entri dicocokkan dengan aturan `allowFrom` normal milik saluran tujuan. OpenClaw tidak menerjemahkan id pengirim antar saluran. Jika Alice memiliki id Telegram dan id Discord, cantumkan kedua id di bawah kunci yang sesuai.

## Merujuk grup dari allowlist

Rujuk grup dengan `accessGroup:<name>` di mana pun path saluran pesan mendukung allowlist pengirim.

Contoh allowlist DM:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

Contoh allowlist pengirim grup:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Anda dapat mencampur grup dan entri langsung:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## Path saluran pesan yang didukung

Grup akses tersedia di path otorisasi saluran pesan bersama, termasuk:

- allowlist pengirim DM seperti `channels.<channel>.allowFrom`
- allowlist pengirim grup seperti `channels.<channel>.groupAllowFrom`
- allowlist pengirim per ruang khusus saluran yang menggunakan aturan pencocokan pengirim yang sama
- path otorisasi perintah yang menggunakan kembali allowlist pengirim saluran pesan

Dukungan saluran bergantung pada apakah saluran tersebut dihubungkan melalui helper otorisasi pengirim bersama OpenClaw. Dukungan bawaan saat ini mencakup Discord, Google Chat, Nostr, WhatsApp, Zalo, dan Zalo Personal. Grup `message.senders` statis dirancang agar agnostik terhadap saluran, sehingga saluran pesan baru sebaiknya mendukungnya dengan menggunakan helper Plugin SDK bersama alih-alih ekspansi allowlist khusus.

## Audiens saluran Discord

Discord juga mendukung jenis grup akses dinamis:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` berarti "izinkan pengirim DM Discord yang saat ini dapat melihat saluran guild ini." OpenClaw menyelesaikan pengirim melalui Discord pada waktu otorisasi dan menerapkan aturan izin `ViewChannel` Discord.

Gunakan ini saat sebuah saluran Discord sudah menjadi sumber kebenaran untuk sebuah tim, seperti `#maintainers` atau `#on-call`.

Persyaratan dan perilaku kegagalan:

- Bot memerlukan akses ke guild dan saluran.
- Bot memerlukan **Server Members Intent** di Discord Developer Portal.
- Grup akses gagal tertutup saat Discord mengembalikan `Missing Access`, pengirim tidak dapat diselesaikan sebagai anggota guild, atau saluran termasuk dalam guild lain.

Contoh khusus Discord lainnya: [Kontrol akses Discord](/id/channels/discord#access-control-and-routing)

## Catatan keamanan

- Grup akses adalah alias allowlist, bukan peran. Grup ini tidak membuat pemilik, menyetujui permintaan pairing, atau memberikan izin tool dengan sendirinya.
- `dmPolicy: "open"` tetap memerlukan `"*"` dalam allowlist DM efektif. Merujuk grup akses tidak sama dengan akses publik.
- Nama grup yang hilang gagal tertutup. Jika `allowFrom` berisi `accessGroup:operators` dan `accessGroups.operators` tidak ada, entri tersebut tidak mengotorisasi siapa pun.
- Jaga agar id saluran tetap stabil. Pilih id numerik/pengguna daripada nama tampilan saat saluran mendukung keduanya.

## Pemecahan masalah

Jika pengirim seharusnya cocok tetapi diblokir:

1. Pastikan field allowlist berisi referensi `accessGroup:<name>` yang tepat.
2. Pastikan `accessGroups.<name>.type` benar.
3. Pastikan id pengirim dicantumkan di bawah kunci saluran yang cocok, atau di bawah `"*"`.
4. Pastikan entri menggunakan sintaks allowlist normal saluran tersebut.
5. Untuk audiens saluran Discord, pastikan bot dapat melihat saluran guild dan Server Members Intent telah diaktifkan.

Jalankan `openclaw doctor` setelah mengedit config kontrol akses. Perintah ini menangkap banyak kombinasi allowlist dan kebijakan yang tidak valid sebelum runtime.
