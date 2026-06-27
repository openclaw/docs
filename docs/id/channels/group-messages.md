---
read_when:
    - Mengonfigurasi grup WhatsApp secara khusus
    - Mengubah mode aktivasi WhatsApp (`mention` vs `always`)
    - Menyetel kunci sesi grup WhatsApp atau konteks pesan tertunda
sidebarTitle: WhatsApp groups
summary: Penanganan pesan grup WhatsApp — aktivasi, daftar izin, sesi, dan injeksi konteks
title: Pesan grup WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:10:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

Untuk model grup lintas kanal (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo), lihat [Grup](/id/channels/groups). Halaman ini mencakup perilaku khusus WhatsApp di atas model tersebut: aktivasi, daftar izin grup, kunci sesi per grup, dan injeksi konteks pesan tertunda.

Tujuan: memungkinkan OpenClaw berada di grup WhatsApp, aktif hanya saat dipanggil, dan menjaga utas tersebut terpisah dari sesi DM pribadi.

<Note>
`agents.list[].groupChat.mentionPatterns` juga digunakan oleh Telegram, Discord, Slack, dan iMessage. Untuk penyiapan multi-agen, tetapkan per agen, atau gunakan `messages.groupChat.mentionPatterns` sebagai fallback global.
</Note>

## Perilaku

- Mode aktivasi: `mention` (default) atau `always`. `mention` memerlukan panggilan (mention @ WhatsApp asli melalui `mentionedJids`, pola regex aman, atau E.164 bot di mana saja dalam teks). `always` mengaktifkan agen pada setiap pesan, tetapi agen sebaiknya membalas hanya ketika dapat memberi nilai yang bermakna; jika tidak, agen mengembalikan token diam persis `NO_REPLY` / `no_reply`. Default dapat ditetapkan di konfigurasi (`channels.whatsapp.groups`) dan ditimpa per grup melalui `/activation`. Ketika `channels.whatsapp.groups` ditetapkan, itu juga bertindak sebagai daftar izin grup (sertakan `"*"` untuk mengizinkan semua).
- Kebijakan grup: `channels.whatsapp.groupPolicy` mengontrol apakah pesan grup diterima (`open|disabled|allowlist`). `allowlist` menggunakan `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` eksplisit). Default adalah `allowlist` (diblokir sampai Anda menambahkan pengirim).
- Sesi per grup: kunci sesi terlihat seperti `agent:<agentId>:whatsapp:group:<jid>` sehingga perintah seperti `/verbose on`, `/trace on`, atau `/think high` (dikirim sebagai pesan mandiri) dibatasi ke grup tersebut; status DM pribadi tidak tersentuh. Heartbeat dilewati untuk utas grup.
- Injeksi konteks: pesan grup **yang hanya tertunda** (default 50) yang _tidak_ memicu run diawali di bawah `[Chat messages since your last reply - for context]`, dengan baris pemicu di bawah `[Current message - respond to this]`. Pesan yang sudah ada dalam sesi tidak diinjeksi ulang.
- Pemunculan pengirim: setiap batch grup sekarang diakhiri dengan `[from: Sender Name (+E164)]` sehingga OpenClaw mengetahui siapa yang berbicara.
- Ephemeral/sekali-lihat: kami membuka bungkusnya sebelum mengekstrak teks/mention, sehingga panggilan di dalamnya tetap memicu.
- Prompt sistem grup: pada giliran pertama sesi grup (dan setiap kali `/activation` mengubah mode) kami menyuntikkan ringkasan singkat ke prompt sistem seperti `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Jika metadata tidak tersedia, kami tetap memberi tahu agen bahwa ini adalah obrolan grup.

## Contoh konfigurasi (WhatsApp)

Tambahkan blok `groupChat` ke `~/.openclaw/openclaw.json` agar panggilan nama tampilan berfungsi meskipun WhatsApp menghapus `@` visual di isi teks:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Catatan:

- Regex tidak peka huruf besar/kecil dan menggunakan pengaman regex aman yang sama seperti permukaan regex konfigurasi lainnya; pola tidak valid dan repetisi bertingkat yang tidak aman diabaikan.
- WhatsApp tetap mengirim mention kanonis melalui `mentionedJids` ketika seseorang mengetuk kontak, sehingga fallback nomor jarang diperlukan tetapi berguna sebagai jaring pengaman.

### Perintah aktivasi (khusus pemilik)

Gunakan perintah obrolan grup:

- `/activation mention`
- `/activation always`

Hanya nomor pemilik (dari `channels.whatsapp.allowFrom`, atau E.164 bot sendiri saat tidak ditetapkan) yang dapat mengubah ini. Kirim `/status` sebagai pesan mandiri di grup untuk melihat mode aktivasi saat ini.

## Cara menggunakan

1. Tambahkan akun WhatsApp Anda (yang menjalankan OpenClaw) ke grup.
2. Ucapkan `@openclaw …` (atau sertakan nomornya). Hanya pengirim dalam daftar izin yang dapat memicunya kecuali Anda menetapkan `groupPolicy: "open"`.
3. Prompt agen akan menyertakan konteks grup terbaru ditambah penanda akhir `[from: …]` sehingga agen dapat menyapa orang yang tepat.
4. Direktif tingkat sesi (`/verbose on`, `/trace on`, `/think high`, `/new` atau `/reset`, `/compact`) hanya berlaku untuk sesi grup tersebut; kirim sebagai pesan mandiri agar terdaftar. Sesi DM pribadi Anda tetap independen.

## Pengujian / verifikasi

- Pemeriksaan awal manual:
  - Kirim panggilan `@openclaw` di grup dan pastikan ada balasan yang merujuk nama pengirim.
  - Kirim panggilan kedua dan verifikasi blok riwayat disertakan lalu dibersihkan pada giliran berikutnya.
- Periksa log gateway (jalankan dengan `--verbose`) untuk melihat entri `inbound web message` yang menampilkan `from: <groupJid>` dan sufiks `[from: …]`.

## Pertimbangan yang diketahui

- Heartbeat sengaja dilewati untuk grup agar tidak membuat siaran berisik.
- Penekanan echo menggunakan string batch gabungan; jika Anda mengirim teks identik dua kali tanpa mention, hanya yang pertama yang akan mendapat respons.
- Entri penyimpanan sesi akan muncul sebagai `agent:<agentId>:whatsapp:group:<jid>` di penyimpanan sesi (`~/.openclaw/agents/<agentId>/sessions/sessions.json` secara default); entri yang hilang hanya berarti grup belum memicu run.
- Indikator mengetik dalam grup mengikuti `agents.defaults.typingMode`. Ketika balasan terlihat dipilih ke mode hanya alat pesan, pengetikan dimulai segera secara default sehingga anggota grup dapat melihat agen sedang bekerja meskipun tidak ada balasan final otomatis yang diposting. Konfigurasi mode mengetik eksplisit tetap menang.

## Terkait

- [Grup](/id/channels/groups)
- [Perutean kanal](/id/channels/channel-routing)
- [Grup siaran](/id/channels/broadcast-groups)
