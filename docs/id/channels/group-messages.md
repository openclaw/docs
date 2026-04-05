---
read_when:
    - Mengubah aturan pesan grup atau mention
summary: Perilaku dan konfigurasi untuk penanganan pesan grup WhatsApp (mentionPatterns dibagikan di seluruh surface)
title: Pesan Grup
x-i18n:
    generated_at: "2026-04-05T13:42:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2543be5bc4c6f188f955df580a6fef585ecbfc1be36ade5d34b1a9157e021bc5
    source_path: channels/group-messages.md
    workflow: 15
---

# Pesan grup (channel web WhatsApp)

Tujuan: membiarkan Clawd berada di grup WhatsApp, aktif hanya saat dipanggil, dan menjaga thread itu tetap terpisah dari sesi DM pribadi.

Catatan: `agents.list[].groupChat.mentionPatterns` sekarang juga digunakan oleh Telegram/Discord/Slack/iMessage; dokumen ini berfokus pada perilaku khusus WhatsApp. Untuk pengaturan multi-agen, tetapkan `agents.list[].groupChat.mentionPatterns` per agen (atau gunakan `messages.groupChat.mentionPatterns` sebagai fallback global).

## Implementasi saat ini (2025-12-03)

- Mode aktivasi: `mention` (default) atau `always`. `mention` memerlukan panggilan (mention WhatsApp @ yang nyata melalui `mentionedJids`, pola regex aman, atau E.164 bot di mana pun dalam teks). `always` membangunkan agen pada setiap pesan tetapi agen seharusnya hanya membalas saat dapat memberi nilai yang bermakna; jika tidak, agen mengembalikan token senyap yang persis `NO_REPLY` / `no_reply`. Default dapat ditetapkan di config (`channels.whatsapp.groups`) dan dioverride per grup melalui `/activation`. Saat `channels.whatsapp.groups` ditetapkan, itu juga bertindak sebagai allowlist grup (sertakan `"*"` untuk mengizinkan semua).
- Kebijakan grup: `channels.whatsapp.groupPolicy` mengontrol apakah pesan grup diterima (`open|disabled|allowlist`). `allowlist` menggunakan `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` yang eksplisit). Default adalah `allowlist` (diblokir sampai Anda menambahkan pengirim).
- Sesi per grup: kunci sesi berbentuk `agent:<agentId>:whatsapp:group:<jid>` sehingga perintah seperti `/verbose on` atau `/think high` (dikirim sebagai pesan mandiri) dibatasi ke grup tersebut; status DM pribadi tidak tersentuh. Heartbeat dilewati untuk thread grup.
- Injeksi konteks: pesan grup **pending-only** (default 50) yang _tidak_ memicu eksekusi diawali di bawah `[Chat messages since your last reply - for context]`, dengan baris pemicu di bawah `[Current message - respond to this]`. Pesan yang sudah ada di sesi tidak diinjeksi ulang.
- Penampilan pengirim: setiap batch grup sekarang diakhiri dengan `[from: Sender Name (+E164)]` sehingga Pi tahu siapa yang sedang berbicara.
- Ephemeral/view-once: kami membuka bungkusnya sebelum mengekstrak teks/mention, sehingga panggilan di dalamnya tetap memicu.
- Prompt sistem grup: pada giliran pertama sesi grup (dan setiap kali `/activation` mengubah mode) kami menyuntikkan uraian singkat ke prompt sistem seperti `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Jika metadata tidak tersedia, kami tetap memberi tahu agen bahwa ini adalah obrolan grup.

## Contoh config (WhatsApp)

Tambahkan blok `groupChat` ke `~/.openclaw/openclaw.json` agar panggilan nama tampilan berfungsi bahkan saat WhatsApp menghapus `@` visual dari isi teks:

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

- Regex ini tidak peka huruf besar/kecil dan menggunakan guardrail safe-regex yang sama seperti surface regex config lainnya; pola yang tidak valid dan nested repetition yang tidak aman diabaikan.
- WhatsApp tetap mengirim mention kanonis melalui `mentionedJids` saat seseorang mengetuk kontak, jadi fallback nomor jarang diperlukan tetapi berguna sebagai jaring pengaman.

### Perintah aktivasi (khusus pemilik)

Gunakan perintah obrolan grup:

- `/activation mention`
- `/activation always`

Hanya nomor pemilik (dari `channels.whatsapp.allowFrom`, atau E.164 bot itu sendiri jika tidak disetel) yang dapat mengubah ini. Kirim `/status` sebagai pesan mandiri di grup untuk melihat mode aktivasi saat ini.

## Cara menggunakan

1. Tambahkan akun WhatsApp Anda (yang menjalankan OpenClaw) ke grup.
2. Ucapkan `@openclaw …` (atau sertakan nomornya). Hanya pengirim di allowlist yang dapat memicunya kecuali Anda menetapkan `groupPolicy: "open"`.
3. Prompt agen akan menyertakan konteks grup terbaru plus penanda `[from: …]` di bagian akhir sehingga agen dapat menyapa orang yang tepat.
4. Direktif tingkat sesi (`/verbose on`, `/think high`, `/new` atau `/reset`, `/compact`) hanya berlaku untuk sesi grup itu; kirim sebagai pesan mandiri agar terdaftar. Sesi DM pribadi Anda tetap independen.

## Pengujian / verifikasi

- Smoke manual:
  - Kirim panggilan `@openclaw` di grup dan konfirmasikan ada balasan yang merujuk nama pengirim.
  - Kirim panggilan kedua dan verifikasi blok riwayat disertakan lalu dibersihkan pada giliran berikutnya.
- Periksa log gateway (jalankan dengan `--verbose`) untuk melihat entri `inbound web message` yang menampilkan `from: <groupJid>` dan sufiks `[from: …]`.

## Hal-hal yang perlu diperhatikan

- Heartbeat sengaja dilewati untuk grup agar tidak menimbulkan broadcast yang berisik.
- Penekanan echo menggunakan string batch gabungan; jika Anda mengirim teks identik dua kali tanpa mention, hanya yang pertama akan mendapat respons.
- Entri penyimpanan sesi akan muncul sebagai `agent:<agentId>:whatsapp:group:<jid>` di penyimpanan sesi (default `~/.openclaw/agents/<agentId>/sessions/sessions.json`); entri yang hilang hanya berarti grup tersebut belum memicu eksekusi.
- Indikator mengetik di grup mengikuti `agents.defaults.typingMode` (default: `message` saat tidak di-mention).
