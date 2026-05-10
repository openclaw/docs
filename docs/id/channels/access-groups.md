---
read_when:
    - Mengonfigurasi daftar izin yang sama di beberapa saluran pesan
    - Berbagi aturan akses pengirim DM dan grup
    - Meninjau kontrol akses saluran pesan
summary: Daftar izin pengirim yang dapat digunakan kembali untuk saluran pesan
title: Grup akses
x-i18n:
    generated_at: "2026-05-10T19:21:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
---

Grup akses adalah daftar pengirim bernama yang Anda definisikan sekali dan rujuk dari allowlist saluran dengan `accessGroup:<name>`.

Gunakan grup ini ketika orang yang sama harus diizinkan di beberapa saluran pesan, atau ketika satu set tepercaya harus diterapkan untuk otorisasi pengirim DM dan grup.

Grup akses tidak memberikan akses dengan sendirinya. Grup hanya berarti ketika sebuah bidang allowlist merujuknya.

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

Daftar anggota menggunakan id saluran pesan sebagai kunci:

| Kunci      | Makna                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | Entri bersama yang diperiksa untuk setiap saluran pesan yang merujuk grup. |
| `discord`  | Entri yang diperiksa hanya untuk pencocokan allowlist Discord.          |
| `telegram` | Entri yang diperiksa hanya untuk pencocokan allowlist Telegram.         |
| `whatsapp` | Entri yang diperiksa hanya untuk pencocokan allowlist WhatsApp.         |

Entri dicocokkan dengan aturan normal `allowFrom` milik saluran tujuan. OpenClaw tidak menerjemahkan id pengirim antar saluran. Jika Alice memiliki id Telegram dan id Discord, cantumkan kedua id di bawah kunci yang sesuai.

## Merujuk grup dari allowlist

Rujuk grup dengan `accessGroup:<name>` di mana pun jalur saluran pesan mendukung allowlist pengirim.

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

## Jalur saluran pesan yang didukung

Grup akses tersedia di jalur otorisasi saluran pesan bersama, termasuk:

- allowlist pengirim DM seperti `channels.<channel>.allowFrom`
- allowlist pengirim grup seperti `channels.<channel>.groupAllowFrom`
- allowlist pengirim per ruang yang spesifik saluran dan menggunakan aturan pencocokan pengirim yang sama
- jalur otorisasi perintah yang menggunakan kembali allowlist pengirim saluran pesan

Dukungan saluran bergantung pada apakah saluran tersebut dirangkai melalui helper otorisasi pengirim bersama OpenClaw. Dukungan bawaan saat ini mencakup Discord, Feishu, Google Chat, iMessage, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQBot, Signal, WhatsApp, Zalo, dan Zalo Personal. Grup statis `message.senders` dirancang agar agnostik terhadap saluran, sehingga saluran pesan baru sebaiknya mendukungnya dengan menggunakan helper SDK Plugin bersama, bukan ekspansi allowlist kustom.

## Diagnostik Plugin

Penulis Plugin dapat memeriksa status grup akses terstruktur tanpa mengekspansinya kembali menjadi allowlist datar:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Hasilnya melaporkan grup yang dirujuk, cocok, hilang, tidak didukung, dan gagal. Gunakan ini ketika Anda memerlukan diagnostik atau uji kesesuaian. Gunakan `expandAllowFromWithAccessGroups(...)` hanya untuk jalur kompatibilitas yang masih mengharapkan array `allowFrom` datar.

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

Gunakan ini ketika saluran Discord sudah menjadi sumber kebenaran untuk sebuah tim, seperti `#maintainers` atau `#on-call`.

Persyaratan dan perilaku kegagalan:

- Bot memerlukan akses ke guild dan saluran.
- Bot memerlukan **Server Members Intent** dari Discord Developer Portal.
- Grup akses gagal tertutup ketika Discord mengembalikan `Missing Access`, pengirim tidak dapat diselesaikan sebagai anggota guild, atau saluran milik guild lain.

Contoh yang lebih spesifik untuk Discord: [Kontrol akses Discord](/id/channels/discord#access-control-and-routing)

## Catatan keamanan

- Grup akses adalah alias allowlist, bukan peran. Grup ini tidak membuat pemilik, menyetujui permintaan pemasangan, atau memberikan izin alat dengan sendirinya.
- `dmPolicy: "open"` tetap memerlukan `"*"` dalam allowlist DM efektif. Merujuk grup akses tidak sama dengan akses publik.
- Nama grup yang hilang gagal tertutup. Jika `allowFrom` berisi `accessGroup:operators` dan `accessGroups.operators` tidak ada, entri tersebut tidak mengotorisasi siapa pun.
- Jaga agar id saluran tetap stabil. Pilih id numerik/pengguna daripada nama tampilan ketika saluran mendukung keduanya.

## Pemecahan masalah

Jika pengirim seharusnya cocok tetapi diblokir:

1. Pastikan bidang allowlist berisi referensi `accessGroup:<name>` yang tepat.
2. Pastikan `accessGroups.<name>.type` benar.
3. Pastikan id pengirim tercantum di bawah kunci saluran yang cocok, atau di bawah `"*"`.
4. Pastikan entri menggunakan sintaks allowlist normal untuk saluran tersebut.
5. Untuk audiens saluran Discord, pastikan bot dapat melihat saluran guild dan Server Members Intent telah diaktifkan.

Jalankan `openclaw doctor` setelah mengedit konfigurasi kontrol akses. Ini menangkap banyak kombinasi allowlist dan kebijakan yang tidak valid sebelum runtime.
