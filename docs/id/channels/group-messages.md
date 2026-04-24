---
read_when:
    - Mengubah aturan pesan grup atau mention
summary: Perilaku dan konfigurasi untuk penanganan pesan grup WhatsApp (`mentionPatterns` dibagikan di seluruh surface)
title: Pesan grup
x-i18n:
    generated_at: "2026-04-24T08:57:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f67ed72c0e61aef18a529cb1d9dbc98909e213352ff7cbef93fe4c9bf8357186
    source_path: channels/group-messages.md
    workflow: 15
---

# Pesan grup (channel web WhatsApp)

Tujuan: memungkinkan Clawd berada di grup WhatsApp, aktif hanya saat dipanggil, dan menjaga thread itu tetap terpisah dari sesi DM pribadi.

Catatan: `agents.list[].groupChat.mentionPatterns` kini juga digunakan oleh Telegram/Discord/Slack/iMessage; dokumen ini berfokus pada perilaku khusus WhatsApp. Untuk penyiapan multi-agen, atur `agents.list[].groupChat.mentionPatterns` per agen (atau gunakan `messages.groupChat.mentionPatterns` sebagai fallback global).

## Implementasi saat ini (2025-12-03)

- Mode aktivasi: `mention` (default) atau `always`. `mention` memerlukan panggilan (WhatsApp @-mention asli melalui `mentionedJids`, pola regex aman, atau E.164 bot di mana saja dalam teks). `always` membangunkan agen pada setiap pesan tetapi agen seharusnya membalas hanya saat dapat memberi nilai yang bermakna; jika tidak, agen mengembalikan token senyap yang persis `NO_REPLY` / `no_reply`. Default dapat diatur di config (`channels.whatsapp.groups`) dan dioverride per grup melalui `/activation`. Saat `channels.whatsapp.groups` diatur, itu juga berfungsi sebagai allowlist grup (sertakan `"*"` untuk mengizinkan semua).
- Kebijakan grup: `channels.whatsapp.groupPolicy` mengontrol apakah pesan grup diterima (`open|disabled|allowlist`). `allowlist` menggunakan `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` yang eksplisit). Default-nya adalah `allowlist` (diblokir sampai Anda menambahkan pengirim).
- Sesi per grup: kunci sesi terlihat seperti `agent:<agentId>:whatsapp:group:<jid>` sehingga perintah seperti `/verbose on`, `/trace on`, atau `/think high` (dikirim sebagai pesan mandiri) dibatasi ke grup itu; status DM pribadi tidak tersentuh. Heartbeat dilewati untuk thread grup.
- Injeksi konteks: pesan grup **pending-only** (default 50) yang _tidak_ memicu run diawali di bawah `[Chat messages since your last reply - for context]`, dengan baris pemicu di bawah `[Current message - respond to this]`. Pesan yang sudah ada di sesi tidak diinjeksikan ulang.
- Penampilan pengirim: setiap batch grup sekarang diakhiri dengan `[from: Sender Name (+E164)]` agar Pi tahu siapa yang sedang berbicara.
- Ephemeral/view-once: kami membuka bungkus keduanya sebelum mengekstrak teks/mention, jadi panggilan di dalamnya tetap memicu.
- Prompt sistem grup: pada giliran pertama sesi grup (dan setiap kali `/activation` mengubah mode) kami menyuntikkan blurb singkat ke prompt sistem seperti `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Jika metadata tidak tersedia, kami tetap memberi tahu agen bahwa ini adalah chat grup.

## Contoh config (WhatsApp)

Tambahkan blok `groupChat` ke `~/.openclaw/openclaw.json` agar panggilan nama tampilan berfungsi bahkan saat WhatsApp menghapus `@` visual di isi teks:

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

- Regex ini tidak peka huruf besar/kecil dan menggunakan guardrail safe-regex yang sama seperti surface regex config lainnya; pola tidak valid dan nested repetition yang tidak aman akan diabaikan.
- WhatsApp tetap mengirim mention kanonis melalui `mentionedJids` saat seseorang mengetuk kontak, jadi fallback nomor jarang diperlukan tetapi tetap berguna sebagai pengaman.

### Perintah aktivasi (khusus owner)

Gunakan perintah chat grup:

- `/activation mention`
- `/activation always`

Hanya nomor owner (dari `channels.whatsapp.allowFrom`, atau E.164 bot sendiri jika tidak diatur) yang dapat mengubah ini. Kirim `/status` sebagai pesan mandiri di grup untuk melihat mode aktivasi saat ini.

## Cara menggunakan

1. Tambahkan akun WhatsApp Anda (yang menjalankan OpenClaw) ke grup.
2. Ucapkan `@openclaw …` (atau sertakan nomornya). Hanya pengirim yang ada di allowlist yang dapat memicunya kecuali Anda mengatur `groupPolicy: "open"`.
3. Prompt agen akan menyertakan konteks grup terbaru plus penanda `[from: …]` di akhir agar dapat menyapa orang yang tepat.
4. Direktif tingkat sesi (`/verbose on`, `/trace on`, `/think high`, `/new` atau `/reset`, `/compact`) hanya berlaku untuk sesi grup itu; kirim sebagai pesan mandiri agar terdaftar. Sesi DM pribadi Anda tetap independen.

## Pengujian / verifikasi

- Smoke manual:
  - Kirim panggilan `@openclaw` di grup dan konfirmasi balasan yang merujuk ke nama pengirim.
  - Kirim panggilan kedua dan verifikasi blok riwayat disertakan lalu dibersihkan pada giliran berikutnya.
- Periksa log gateway (jalankan dengan `--verbose`) untuk melihat entri `inbound web message` yang menampilkan `from: <groupJid>` dan sufiks `[from: …]`.

## Hal-hal yang perlu diperhatikan

- Heartbeat sengaja dilewati untuk grup agar tidak menimbulkan siaran yang berisik.
- Penekanan echo menggunakan string batch gabungan; jika Anda mengirim teks identik dua kali tanpa mention, hanya yang pertama akan mendapat respons.
- Entri penyimpanan sesi akan muncul sebagai `agent:<agentId>:whatsapp:group:<jid>` di penyimpanan sesi (`~/.openclaw/agents/<agentId>/sessions/sessions.json` secara default); entri yang tidak ada hanya berarti grup belum memicu run.
- Indikator mengetik di grup mengikuti `agents.defaults.typingMode` (default: `message` saat tidak di-mention).

## Terkait

- [Grup](/id/channels/groups)
- [Perutean channel](/id/channels/channel-routing)
- [Grup siaran](/id/channels/broadcast-groups)
