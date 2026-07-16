---
read_when:
    - Mengonfigurasi grup WhatsApp secara khusus
    - Mengubah mode aktivasi WhatsApp (`mention` vs `always`)
    - Menyesuaikan kunci sesi grup WhatsApp atau konteks pesan tertunda
sidebarTitle: WhatsApp groups
summary: Penanganan pesan grup WhatsApp — aktivasi, daftar yang diizinkan, sesi, dan injeksi konteks
title: Pesan grup WhatsApp
x-i18n:
    generated_at: "2026-07-16T17:47:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

Untuk model grup lintas saluran (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo), lihat [Grup](/id/channels/groups). Halaman ini membahas perilaku khusus WhatsApp di atas model tersebut: aktivasi, daftar izin grup, kunci sesi per grup, dan injeksi konteks pesan tertunda.

Tujuan: memungkinkan OpenClaw berada di grup WhatsApp, aktif hanya saat dipanggil, dan menjaga utas tersebut tetap terpisah dari sesi DM pribadi.

<Note>
`agents.list[].groupChat.mentionPatterns` digunakan bersama dengan pembatasan penyebutan di saluran lain. Untuk penyiapan multiagen, atur per agen, atau gunakan `messages.groupChat.mentionPatterns` sebagai fallback global. Jika keduanya tidak diatur, pola diturunkan dari nama/emoji identitas agen.
</Note>

## Perilaku

- Mode aktivasi: `mention` (default) atau `always`. `mention` memerlukan panggilan: @-mention WhatsApp yang sebenarnya (`mentionedJids`), pola regex yang dikonfigurasi, digit E.164 bot di mana pun dalam teks, atau balasan yang mengutip salah satu pesan bot (kecuali penyiapan obrolan mandiri dengan nomor bersama). `always` mengaktifkan agen pada setiap pesan, tetapi prompt grup yang diinjeksi memerintahkannya untuk membalas hanya saat memberikan nilai tambah dan mengembalikan token senyap persis `NO_REPLY` (tidak peka huruf besar-kecil) jika tidak. Nilai default berasal dari konfigurasi (`channels.whatsapp.groups` `requireMention`) dan dapat ditimpa per grup melalui `/activation`.
- Daftar izin grup: ketika `channels.whatsapp.groups` diatur, hanya JID grup yang tercantum yang diterima (sertakan `"*"` untuk mengizinkan semuanya); pesan dari grup yang tidak tercantum dibuang dengan petunjuk dalam log.
- Kebijakan grup: `channels.whatsapp.groupPolicy` mengontrol apakah pesan grup diterima (`open|disabled|allowlist`). `allowlist` menggunakan `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` eksplisit). Default-nya adalah `allowlist` (diblokir hingga Anda menambahkan pengirim).
- Sesi per grup: kunci sesi tampak seperti `agent:<agentId>:whatsapp:group:<jid>` (akun non-default menambahkan `:thread:whatsapp-account-<accountId>`), sehingga arahan seperti `/verbose on`, `/trace on`, atau `/think high` (dikirim sebagai pesan mandiri) dibatasi cakupannya ke grup tersebut; status DM pribadi tidak tersentuh.
- Injeksi konteks: pesan grup **khusus tertunda** (default 50) yang _tidak_ memicu proses dijadikan prefiks di bawah `[Chat messages since your last reply - for context]`, dengan baris pemicu di bawah `[Current message - respond to this]`. Jendela tertunda dikosongkan setelah proses; pesan yang sudah berada dalam sesi tidak diinjeksi ulang.
- Atribusi pengirim: setiap baris grup memuat label pengirim di dalam amplop pesan, misalnya `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`, dan identitas pengirim beserta subjek/anggota grup disertakan dalam blok metadata percakapan yang tidak tepercaya.
- Sementara/sekali lihat: pembungkus dibuka sebelum teks/penyebutan diekstrak, sehingga panggilan di dalamnya tetap memicu.
- Prompt sistem grup: giliran pertama sesi grup (dan setiap giliran setelah `/activation` mengubah mode) menginjeksi panduan aktivasi ke dalam prompt sistem (`Activation: trigger-only ...` atau `Activation: always-on ...`, ditambah "tujukan kepada pengirim tertentu"). Panduan pengiriman obrolan grup yang persisten ("Anda berada dalam obrolan grup WhatsApp...") selalu disertakan.

## Contoh konfigurasi (WhatsApp)

Aktifkan panggilan berdasarkan nama tampilan meskipun WhatsApp menghapus `@` visual dari isi teks:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // pending group context window (default 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Catatan:

- Regex tidak peka huruf besar-kecil dan menggunakan batasan keamanan regex yang sama seperti permukaan regex konfigurasi lainnya; pola yang tidak valid dan pengulangan bertingkat yang tidak aman diabaikan.
- WhatsApp tetap mengirim penyebutan kanonis melalui `mentionedJids` ketika seseorang mengetuk kontak, sehingga fallback nomor jarang diperlukan, tetapi berguna sebagai jaring pengaman.
- Jendela konteks tertunda ditentukan sebagai `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Perintah aktivasi (khusus pemilik)

Gunakan perintah obrolan grup:

- `/activation mention`
- `/activation always`

Hanya nomor pemilik (dari `channels.whatsapp.allowFrom`, atau E.164 milik bot sendiri jika tidak diatur) yang dapat mengubahnya; `/activation` dari siapa pun selain pemilik diabaikan dan hanya disimpan sebagai konteks. Kirim `/status` sebagai pesan mandiri dalam grup untuk melihat mode aktivasi saat ini.

## Cara menggunakan

1. Tambahkan akun WhatsApp Anda (yang menjalankan OpenClaw) ke grup.
2. Ucapkan `@openclaw ...` (atau sertakan nomornya). Hanya pengirim dalam daftar izin yang dapat memicunya, kecuali Anda mengatur `groupPolicy: "open"`.
3. Prompt agen menyertakan konteks grup tertunda beserta baris berlabel pengirim agar dapat menyapa orang yang tepat.
4. Arahan sesi (`/verbose on`, `/trace on`, `/think high`, `/new` atau `/reset`, `/compact`) hanya berlaku untuk sesi grup tersebut; kirim sebagai pesan mandiri agar terdaftar. Sesi DM pribadi Anda tetap independen.

## Pengujian / verifikasi

- Uji cepat manual:
  - Kirim panggilan `@openclaw` dalam grup dan pastikan balasannya merujuk nama pengirim.
  - Kirim panggilan kedua dan pastikan blok riwayat disertakan, lalu dikosongkan pada giliran berikutnya.
- Periksa log Gateway (jalankan dengan `--verbose`) untuk entri `inbound web message` yang menampilkan `from: <groupJid>` dan isi berlabel pengirim.

## Pertimbangan yang diketahui

- Heartbeat berjalan dalam sesi utama agen; sesi grup tidak pernah menjalankan Heartbeat.
- Pencegahan gema mengingat prompt gabungan (riwayat + pesan saat ini) per sesi agar pesan bot sendiri yang telah dikirim tidak memicunya kembali; kumpulan identik yang diulang dapat dilewati sebagai gema.
- Entri penyimpanan sesi muncul sebagai `agent:<agentId>:whatsapp:group:<jid>` dalam penyimpanan sesi SQLite per agen; entri yang tidak ada hanya berarti grup tersebut belum pernah memicu proses.
- Indikator pengetikan mengikuti `session.typingMode` / `agents.defaults.typingMode`. Ketika balasan yang terlihat diikutsertakan dalam mode khusus alat pesan, pengetikan langsung dimulai secara default agar anggota grup dapat melihat agen sedang bekerja meskipun tidak ada balasan akhir otomatis yang dikirim. Konfigurasi mode pengetikan eksplisit tetap diutamakan.

## Terkait

- [Grup](/id/channels/groups)
- [Perutean saluran](/id/channels/channel-routing)
- [Grup siaran](/id/channels/broadcast-groups)
