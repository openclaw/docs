---
read_when:
    - Anda ingin balasan untuk satu sesi aktif dialihkan dari Telegram ke Discord, Slack, Mattermost, atau saluran tertaut lainnya
    - Anda sedang mengonfigurasi session.identityLinks untuk pesan langsung lintas saluran
    - Perintah /dock menyatakan pengirim tidak tertaut atau tidak ada sesi aktif
summary: Pindahkan rute balasan satu sesi OpenClaw di antara saluran obrolan tertaut
title: Penambatan saluran
x-i18n:
    generated_at: "2026-04-30T09:42:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 16
---

Penambatan kanal adalah pengalihan panggilan untuk satu sesi OpenClaw.

Ini mempertahankan konteks percakapan yang sama, tetapi mengubah tempat balasan berikutnya untuk
sesi tersebut dikirimkan.

## Contoh

Alice dapat mengirim pesan ke OpenClaw di Telegram dan Discord:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Jika Alice mengirim ini dari Telegram:

```text
/dock_discord
```

OpenClaw mempertahankan konteks sesi saat ini dan mengubah rute balasan:

| Sebelum penambatan             | Setelah `/dock_discord`       |
| ------------------------------ | ----------------------------- |
| Balasan masuk ke Telegram `123` | Balasan masuk ke Discord `456` |

Sesi tidak dibuat ulang. Riwayat transkrip tetap melekat pada
sesi yang sama.

## Mengapa menggunakannya

Gunakan penambatan ketika tugas dimulai di satu aplikasi obrolan, tetapi balasan berikutnya harus masuk
ke tempat lain.

Alur umum:

1. Mulai tugas agen dari Telegram.
2. Pindah ke Discord tempat Anda mengoordinasikan pekerjaan.
3. Kirim `/dock_discord` dari sesi Telegram.
4. Pertahankan sesi OpenClaw yang sama, tetapi terima balasan berikutnya di Discord.

## Konfigurasi yang diperlukan

Penambatan memerlukan `session.identityLinks`. Pengirim sumber dan peer target
harus berada dalam grup identitas yang sama:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Nilainya adalah id peer berprefiks kanal:

| Nilai          | Arti                         |
| -------------- | ---------------------------- |
| `telegram:123` | id pengirim Telegram `123`   |
| `discord:456`  | id peer langsung Discord `456` |
| `slack:U123`   | id pengguna Slack `U123`     |

Kunci kanonis (`alice` di atas) hanyalah nama grup identitas bersama. Perintah
penambatan menggunakan nilai berprefiks kanal untuk membuktikan bahwa pengirim sumber dan
peer target adalah orang yang sama.

## Perintah

Perintah penambatan dibuat dari Plugin kanal yang dimuat yang mendukung
perintah asli. Perintah bawaan saat ini:

| Kanal target | Perintah           | Alias              |
| ------------ | ------------------ | ------------------ |
| Discord      | `/dock-discord`    | `/dock_discord`    |
| Mattermost   | `/dock-mattermost` | `/dock_mattermost` |
| Slack        | `/dock-slack`      | `/dock_slack`      |
| Telegram     | `/dock-telegram`   | `/dock_telegram`   |

Alias garis bawah berguna pada permukaan perintah asli seperti Telegram.

## Yang berubah

Penambatan memperbarui kolom pengiriman sesi aktif:

| Kolom sesi     | Contoh setelah `/dock_discord`              |
| -------------- | ------------------------------------------- |
| `lastChannel`  | `discord`                                   |
| `lastTo`       | `456`                                       |
| `lastAccountId` | akun kanal target, atau `default`         |

Kolom tersebut dipertahankan di penyimpanan sesi dan digunakan oleh pengiriman
balasan berikutnya untuk sesi tersebut.

## Yang tidak berubah

Penambatan tidak:

- membuat akun kanal
- menghubungkan bot Discord, Telegram, Slack, atau Mattermost baru
- memberikan akses kepada pengguna
- melewati daftar izin kanal atau kebijakan DM
- memindahkan riwayat transkrip ke sesi lain
- membuat pengguna yang tidak terkait berbagi sesi

Ini hanya mengubah rute pengiriman untuk sesi saat ini.

## Pemecahan masalah

**Perintah mengatakan pengirim tidak tertaut.**

Tambahkan pengirim saat ini dan peer target ke grup
`session.identityLinks` yang sama. Misalnya, jika pengirim Telegram `123` harus ditambatkan
ke peer Discord `456`, sertakan `telegram:123` dan `discord:456`.

**Perintah mengatakan tidak ada sesi aktif.**

Tambatkan dari sesi obrolan langsung yang sudah ada. Perintah memerlukan entri sesi aktif
agar dapat mempertahankan rute baru.

**Balasan masih masuk ke kanal lama.**

Periksa bahwa perintah membalas dengan pesan sukses, dan pastikan id peer target
cocok dengan id yang digunakan oleh kanal tersebut. Penambatan hanya mengubah rute
sesi aktif; sesi lain mungkin masih diarahkan ke tempat lain.

**Saya perlu beralih kembali.**

Kirim perintah yang sesuai untuk kanal asli, seperti `/dock_telegram` atau
`/dock-telegram`, dari pengirim yang tertaut.
