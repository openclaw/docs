---
read_when:
    - Anda ingin balasan untuk satu sesi aktif berpindah dari Telegram ke Discord, Slack, Mattermost, atau saluran tertaut lainnya
    - Anda sedang mengonfigurasi `session.identityLinks` untuk pesan langsung lintas kanal
    - Perintah /dock menyatakan bahwa pengirim belum ditautkan atau tidak ada sesi aktif
summary: Pindahkan rute balasan satu sesi OpenClaw antar kanal obrolan yang tertaut
title: Penambatan saluran
x-i18n:
    generated_at: "2026-07-12T14:08:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

Docking kanal adalah penerusan panggilan untuk satu sesi OpenClaw. Fitur ini mempertahankan konteks percakapan yang sama, tetapi mengubah lokasi pengiriman balasan berikutnya untuk sesi tersebut. Docking hanya berfungsi dari obrolan langsung; fitur ini tidak dapat dijalankan dari obrolan grup.

## Contoh

Alice dapat mengirim pesan ke OpenClaw melalui Telegram dan Discord:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Jika Alice mengirimkan ini dari obrolan langsung Telegram:

```text
/dock_discord
```

OpenClaw mempertahankan konteks sesi saat ini dan mengubah rute balasan:

| Sebelum docking                 | Setelah `/dock_discord`         |
| ------------------------------- | ------------------------------- |
| Balasan dikirim ke Telegram `123` | Balasan dikirim ke Discord `456` |

Sesi tidak dibuat ulang. Riwayat transkrip tetap terhubung ke sesi yang sama.

## Alasan menggunakannya

Gunakan docking ketika suatu tugas dimulai di satu aplikasi obrolan, tetapi balasan berikutnya harus dikirim ke tempat lain.

Alur umum:

1. Mulai tugas agen dari Telegram.
2. Beralih ke Discord, tempat Anda mengoordinasikan pekerjaan.
3. Kirim `/dock_discord` dari obrolan langsung Telegram.
4. Pertahankan sesi OpenClaw yang sama, tetapi terima balasan berikutnya di Discord.

## Konfigurasi wajib

Docking memerlukan `session.identityLinks`. Pengirim sumber dan rekan target harus berada dalam grup identitas yang sama:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Nilainya adalah ID rekan yang diawali prefiks kanal:

| Nilai          | Arti                            |
| -------------- | ------------------------------- |
| `telegram:123` | ID pengirim Telegram `123`      |
| `discord:456`  | ID rekan langsung Discord `456` |
| `slack:U123`   | ID pengguna Slack `U123`        |

Kunci kanonis (`alice` di atas) hanyalah nama grup identitas bersama. Perintah docking menggunakan nilai yang diawali prefiks kanal untuk membuktikan bahwa pengirim sumber dan rekan target adalah orang yang sama.

## Perintah

OpenClaw menghasilkan satu perintah `/dock-<channel>` untuk setiap Plugin kanal yang dimuat dan mendukung perintah native, sehingga daftarnya bertambah saat Plugin ditambahkan. Plugin bawaan yang saat ini mendukungnya:

| Kanal target | Perintah           | Alias              |
| ------------ | ------------------ | ------------------ |
| Discord      | `/dock-discord`    | `/dock_discord`    |
| Mattermost   | `/dock-mattermost` | `/dock_mattermost` |
| Slack        | `/dock-slack`      | `/dock_slack`      |
| Telegram     | `/dock-telegram`   | `/dock_telegram`   |

Bentuk dengan garis bawah juga merupakan nama perintah native pada antarmuka seperti Telegram yang menyediakan perintah garis miring secara langsung.

## Yang berubah

Docking memperbarui kolom pengiriman sesi aktif:

| Kolom sesi      | Contoh setelah `/dock_discord`          |
| --------------- | --------------------------------------- |
| `lastChannel`   | `discord`                               |
| `lastTo`        | `456`                                   |
| `lastAccountId` | akun kanal target, atau `default`       |

Kolom tersebut disimpan secara persisten di penyimpanan sesi dan digunakan untuk pengiriman balasan berikutnya bagi sesi tersebut.

## Yang tidak berubah

Docking tidak:

- membuat akun kanal
- menghubungkan bot Discord, Telegram, Slack, atau Mattermost baru
- memberikan akses kepada pengguna
- melewati daftar izin kanal atau kebijakan DM
- memindahkan riwayat transkrip ke sesi lain
- membuat pengguna yang tidak terkait berbagi sesi

Fitur ini hanya mengubah rute pengiriman untuk sesi saat ini.

## Pemecahan masalah

**Perintah menyatakan bahwa pengirim tidak ditautkan.**

Tambahkan pengirim saat ini dan rekan target ke grup `session.identityLinks` yang sama. Misalnya, jika pengirim Telegram `123` harus diarahkan melalui docking ke rekan Discord `456`, sertakan `telegram:123` dan `discord:456`.

**Perintah menyatakan bahwa docking hanya tersedia dari obrolan langsung.**

Kirim perintah docking dari obrolan langsung dengan OpenClaw, bukan dari obrolan grup.

**Perintah menyatakan bahwa tidak ada sesi aktif.**

Lakukan docking dari sesi obrolan langsung yang sudah ada. Perintah ini memerlukan entri sesi aktif agar dapat menyimpan rute baru secara persisten.

**Balasan masih dikirim ke kanal lama.**

Pastikan perintah memberikan pesan berhasil, dan konfirmasikan bahwa ID rekan target cocok dengan ID yang digunakan oleh kanal tersebut. Docking hanya mengubah rute sesi aktif; sesi lain mungkin masih memiliki rute ke tempat lain.

**Saya perlu beralih kembali.**

Kirim perintah yang sesuai untuk kanal asal, seperti `/dock_telegram` atau `/dock-telegram`, dari pengirim yang ditautkan.
