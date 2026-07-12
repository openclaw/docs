---
read_when:
    - Mengonfigurasi daftar izin yang sama di beberapa saluran pesan
    - Berbagi aturan akses pengirim DM dan grup
    - Meninjau kontrol akses saluran pesan
summary: Daftar pengirim yang diizinkan dan dapat digunakan kembali untuk saluran pesan
title: Grup akses
x-i18n:
    generated_at: "2026-07-12T13:58:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

Grup akses adalah daftar pengirim bernama yang Anda definisikan sekali di bawah `accessGroups` dan rujuk dari daftar izin saluran dengan `accessGroup:<name>`.

Gunakan grup ini ketika orang-orang yang sama harus diizinkan di beberapa saluran pesan, atau ketika satu kelompok tepercaya harus berlaku untuk otorisasi pengirim pesan langsung dan grup.

Sebuah grup tidak memberikan izin apa pun dengan sendirinya. Grup hanya berpengaruh ketika suatu bidang daftar izin merujuknya.

## Grup pengirim pesan statis

Grup pengirim statis menggunakan `type: "message.senders"`. `members` menggunakan id saluran pesan sebagai kunci, ditambah `"*"` untuk entri yang digunakan bersama oleh setiap saluran:

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

| Kunci                      | Arti                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `"*"`                      | Entri bersama yang diperiksa untuk setiap saluran pesan yang merujuk grup tersebut.       |
| `discord`, `telegram`, ... | Entri yang diperiksa hanya untuk pencocokan daftar izin saluran tersebut.                  |

Entri dicocokkan menggunakan aturan `allowFrom` normal milik saluran tujuan. OpenClaw tidak menerjemahkan id pengirim antar-saluran: jika Alice memiliki id Telegram dan id Discord, cantumkan kedua id tersebut di bawah kunci saluran yang sesuai.

## Merujuk grup dari daftar izin

Rujuk grup dengan `accessGroup:<name>` di mana pun jalur saluran pesan mendukung daftar izin pengirim.

Contoh daftar izin pesan langsung:

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

Contoh daftar izin pengirim grup:

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
      groups: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Anda dapat mencampurkan grup dan entri langsung:

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

Grup akses berfungsi pada jalur otorisasi saluran pesan bersama:

- daftar izin pengirim pesan langsung seperti `channels.<channel>.allowFrom`
- daftar izin pengirim grup seperti `channels.<channel>.groupAllowFrom`
- daftar izin pengirim per-ruang khusus saluran yang menggunakan aturan pencocokan pengirim yang sama (misalnya `groups.<space>.users` pada Google Chat)
- jalur otorisasi perintah yang menggunakan kembali daftar izin pengirim saluran pesan

Dukungan saluran bergantung pada apakah saluran tersebut terhubung melalui pembantu otorisasi pengirim bersama milik OpenClaw. Dukungan bawaan saat ini mencakup ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo, dan Zalo Personal. Grup `message.senders` statis tidak bergantung pada saluran, sehingga saluran pesan baru dapat menggunakannya dengan memakai pembantu masukan SDK Plugin bersama alih-alih perluasan daftar izin khusus.

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

`discord.channelAudience` berarti "izinkan pengirim pesan langsung Discord yang saat ini dapat melihat saluran guild ini." OpenClaw menentukan pengirim melalui Discord pada saat otorisasi dan menerapkan aturan izin `ViewChannel` Discord. `membership` bersifat opsional dan nilai bakunya adalah `canViewChannel`.

Gunakan ini ketika suatu saluran Discord telah menjadi sumber kebenaran untuk sebuah tim, seperti `#maintainers` atau `#on-call`.

Persyaratan dan perilaku kegagalan:

- Bot memerlukan akses ke guild dan saluran.
- Bot memerlukan **Server Members Intent** di Discord Developer Portal.
- Grup akses menolak akses secara aman ketika Discord mengembalikan `Missing Access`, pengirim tidak dapat ditentukan sebagai anggota guild, atau saluran tersebut merupakan bagian dari guild lain.

Contoh khusus Discord lainnya: [Kontrol akses Discord](/id/channels/discord#access-control-and-routing)

## Diagnostik Plugin

Pembuat Plugin dapat memeriksa status grup akses terstruktur tanpa memperluasnya kembali menjadi daftar izin datar:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Hasilnya melaporkan grup yang dirujuk, cocok, hilang, tidak didukung, dan gagal. Gunakan hasil tersebut untuk diagnostik atau pengujian kesesuaian. Gunakan `expandAllowFromWithAccessGroups(...)` hanya untuk jalur kompatibilitas yang masih mengharapkan larik `allowFrom` datar.

## Catatan keamanan

- Grup akses adalah alias daftar izin, bukan peran. Grup tersebut tidak membuat pemilik, menyetujui permintaan pemasangan, atau memberikan izin alat dengan sendirinya.
- `dmPolicy: "open"` tetap memerlukan `"*"` dalam daftar izin pesan langsung efektif. Merujuk grup akses tidak sama dengan memberikan akses publik.
- Nama grup yang tidak ditemukan akan menolak akses secara aman. Jika `allowFrom` berisi `accessGroup:operators` dan `accessGroups.operators` tidak ada, entri tersebut tidak mengotorisasi siapa pun.
- Pertahankan kestabilan id saluran. Utamakan id numerik/pengguna daripada nama tampilan jika saluran mendukung keduanya.

## Pemecahan masalah

Jika pengirim seharusnya cocok tetapi diblokir:

1. Pastikan bidang daftar izin berisi rujukan `accessGroup:<name>` yang tepat.
2. Pastikan `accessGroups.<name>.type` sudah benar.
3. Pastikan id pengirim tercantum di bawah kunci saluran yang sesuai, atau di bawah `"*"`.
4. Pastikan entri menggunakan sintaks daftar izin normal milik saluran tersebut.
5. Untuk audiens saluran Discord, pastikan bot dapat melihat saluran guild dan Server Members Intent telah diaktifkan.

Jalankan `openclaw doctor` setelah menyunting konfigurasi kontrol akses. Perintah tersebut mendeteksi banyak kombinasi daftar izin dan kebijakan yang tidak valid sebelum waktu proses.
