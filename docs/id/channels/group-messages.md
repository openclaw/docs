---
read_when:
    - Mengubah aturan pesan grup atau penyebutan
summary: Perilaku dan konfigurasi untuk penanganan pesan grup WhatsApp (mentionPatterns dibagikan di seluruh permukaan)
title: Pesan grup
x-i18n:
    generated_at: "2026-04-30T09:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

Tujuan: biarkan Clawd berada di grup WhatsApp, bangun hanya saat dipanggil, dan menjaga utas itu terpisah dari sesi DM pribadi.

<Note>
`agents.list[].groupChat.mentionPatterns` juga digunakan oleh Telegram, Discord, Slack, dan iMessage. Dokumen ini berfokus pada perilaku khusus WhatsApp. Untuk penyiapan multi-agen, atur `agents.list[].groupChat.mentionPatterns` per agen, atau gunakan `messages.groupChat.mentionPatterns` sebagai fallback global.
</Note>

## Implementasi saat ini (2025-12-03)

- Mode aktivasi: `mention` (default) atau `always`. `mention` memerlukan panggilan (mention @ WhatsApp asli melalui `mentionedJids`, pola regex aman, atau E.164 bot di mana saja dalam teks). `always` membangunkan agen pada setiap pesan, tetapi seharusnya hanya membalas ketika dapat menambahkan nilai yang bermakna; jika tidak, agen mengembalikan token diam persis `NO_REPLY` / `no_reply`. Default dapat diatur di config (`channels.whatsapp.groups`) dan ditimpa per grup melalui `/activation`. Ketika `channels.whatsapp.groups` diatur, itu juga bertindak sebagai allowlist grup (sertakan `"*"` untuk mengizinkan semua).
- Kebijakan grup: `channels.whatsapp.groupPolicy` mengontrol apakah pesan grup diterima (`open|disabled|allowlist`). `allowlist` menggunakan `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` eksplisit). Default adalah `allowlist` (diblokir sampai Anda menambahkan pengirim).
- Sesi per grup: kunci sesi terlihat seperti `agent:<agentId>:whatsapp:group:<jid>` sehingga perintah seperti `/verbose on`, `/trace on`, atau `/think high` (dikirim sebagai pesan mandiri) dibatasi ke grup tersebut; status DM pribadi tidak tersentuh. Heartbeat dilewati untuk utas grup.
- Injeksi konteks: pesan grup **pending-only** (default 50) yang _tidak_ memicu run diberi prefiks di bawah `[Chat messages since your last reply - for context]`, dengan baris pemicu di bawah `[Current message - respond to this]`. Pesan yang sudah ada dalam sesi tidak diinjeksi ulang.
- Pemunculan pengirim: setiap batch grup sekarang diakhiri dengan `[from: Sender Name (+E164)]` agar Pi tahu siapa yang berbicara.
- Ephemeral/view-once: kami membuka pembungkusnya sebelum mengekstrak teks/mention, sehingga panggilan di dalamnya tetap memicu.
- Prompt sistem grup: pada giliran pertama sesi grup (dan setiap kali `/activation` mengubah mode) kami menginjeksikan blurb singkat ke prompt sistem seperti `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Jika metadata tidak tersedia, kami tetap memberi tahu agen bahwa ini adalah chat grup.

## Contoh config (WhatsApp)

Tambahkan blok `groupChat` ke `~/.openclaw/openclaw.json` agar panggilan nama tampilan berfungsi bahkan ketika WhatsApp menghapus `@` visual dalam isi teks:

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

- Regex tidak peka huruf besar/kecil dan menggunakan batasan safe-regex yang sama seperti permukaan regex config lainnya; pola tidak valid dan repetisi bersarang yang tidak aman diabaikan.
- WhatsApp tetap mengirim mention kanonis melalui `mentionedJids` ketika seseorang mengetuk kontak, jadi fallback nomor jarang diperlukan tetapi berguna sebagai jaring pengaman.

### Perintah aktivasi (khusus pemilik)

Gunakan perintah chat grup:

- `/activation mention`
- `/activation always`

Hanya nomor pemilik (dari `channels.whatsapp.allowFrom`, atau E.164 milik bot sendiri saat tidak diatur) yang dapat mengubah ini. Kirim `/status` sebagai pesan mandiri di grup untuk melihat mode aktivasi saat ini.

## Cara menggunakan

1. Tambahkan akun WhatsApp Anda (yang menjalankan OpenClaw) ke grup.
2. Katakan `@openclaw …` (atau sertakan nomornya). Hanya pengirim dalam allowlist yang dapat memicunya kecuali Anda mengatur `groupPolicy: "open"`.
3. Prompt agen akan menyertakan konteks grup terbaru plus penanda akhir `[from: …]` agar dapat menyapa orang yang tepat.
4. Direktif level sesi (`/verbose on`, `/trace on`, `/think high`, `/new` atau `/reset`, `/compact`) hanya berlaku untuk sesi grup tersebut; kirim sebagai pesan mandiri agar terdaftar. Sesi DM pribadi Anda tetap independen.

## Pengujian / verifikasi

- Smoke manual:
  - Kirim panggilan `@openclaw` di grup dan konfirmasi balasan yang merujuk nama pengirim.
  - Kirim panggilan kedua dan verifikasi blok riwayat disertakan lalu dibersihkan pada giliran berikutnya.
- Periksa log Gateway (jalankan dengan `--verbose`) untuk melihat entri `inbound web message` yang menampilkan `from: <groupJid>` dan sufiks `[from: …]`.

## Pertimbangan yang diketahui

- Heartbeat sengaja dilewati untuk grup guna menghindari siaran yang berisik.
- Penekanan echo menggunakan string batch gabungan; jika Anda mengirim teks identik dua kali tanpa mention, hanya yang pertama yang akan mendapat respons.
- Entri penyimpanan sesi akan muncul sebagai `agent:<agentId>:whatsapp:group:<jid>` di penyimpanan sesi (`~/.openclaw/agents/<agentId>/sessions/sessions.json` secara default); entri yang hilang hanya berarti grup belum memicu run.
- Indikator mengetik dalam grup mengikuti `agents.defaults.typingMode`. Ketika balasan terlihat menggunakan mode default message-tool-only, mengetik dimulai langsung secara default sehingga anggota grup dapat melihat agen sedang bekerja bahkan jika tidak ada balasan final otomatis yang diposting. Config mode mengetik eksplisit tetap menang.

## Terkait

- [Grup](/id/channels/groups)
- [Perutean channel](/id/channels/channel-routing)
- [Grup siaran](/id/channels/broadcast-groups)
