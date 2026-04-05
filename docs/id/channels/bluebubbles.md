---
read_when:
    - Menyiapkan channel BlueBubbles
    - Memecahkan masalah pairing webhook
    - Mengonfigurasi iMessage di macOS
summary: iMessage melalui server macOS BlueBubbles (REST kirim/terima, mengetik, reaksi, pairing, tindakan lanjutan).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-05T13:43:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed8e59a165bdfb8fd794ee2ad6e4dacd44aa02d512312c5f2fd7d15f863380bb
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST macOS)

Status: plugin bawaan yang berkomunikasi dengan server macOS BlueBubbles melalui HTTP. **Direkomendasikan untuk integrasi iMessage** karena API-nya lebih kaya dan penyiapannya lebih mudah dibandingkan channel imsg lama.

## Plugin bawaan

Rilis OpenClaw saat ini menyertakan BlueBubbles, jadi build paket normal tidak
memerlukan langkah `openclaw plugins install` terpisah.

## Gambaran umum

- Berjalan di macOS melalui aplikasi helper BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Direkomendasikan/teruji: macOS Sequoia (15). macOS Tahoe (26) berfungsi; edit saat ini rusak di Tahoe, dan pembaruan ikon grup dapat dilaporkan berhasil tetapi tidak tersinkron.
- OpenClaw berkomunikasi dengannya melalui API REST-nya (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Pesan masuk tiba melalui webhook; balasan keluar, indikator mengetik, tanda baca, dan tapback adalah panggilan REST.
- Lampiran dan stiker diingest sebagai media masuk (dan ditampilkan ke agen jika memungkinkan).
- Pairing/allowlist berfungsi sama seperti channel lain (`/channels/pairing` dan seterusnya) dengan `channels.bluebubbles.allowFrom` + kode pairing.
- Reaksi ditampilkan sebagai event sistem seperti Slack/Telegram sehingga agen dapat "menyebutkannya" sebelum membalas.
- Fitur lanjutan: edit, batalkan kirim, utas balasan, efek pesan, manajemen grup.

## Mulai cepat

1. Instal server BlueBubbles di Mac Anda (ikuti petunjuk di [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Di konfigurasi BlueBubbles, aktifkan web API dan tetapkan kata sandi.
3. Jalankan `openclaw onboard` dan pilih BlueBubbles, atau konfigurasi secara manual:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Arahkan webhook BlueBubbles ke gateway Anda (contoh: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Mulai gateway; gateway akan mendaftarkan handler webhook dan memulai pairing.

Catatan keamanan:

- Selalu tetapkan kata sandi webhook.
- Autentikasi webhook selalu wajib. OpenClaw menolak permintaan webhook BlueBubbles kecuali permintaan tersebut menyertakan password/guid yang cocok dengan `channels.bluebubbles.password` (misalnya `?password=<password>` atau `x-password`), terlepas dari topologi loopback/proxy.
- Autentikasi kata sandi diperiksa sebelum membaca/mengurai body webhook secara penuh.

## Menjaga Messages.app tetap aktif (VM / penyiapan headless)

Beberapa penyiapan VM macOS / selalu aktif dapat membuat Messages.app menjadi “idle” (event masuk berhenti sampai aplikasi dibuka/dijadikan foreground). Solusi sederhananya adalah **menyentuh Messages setiap 5 menit** menggunakan AppleScript + LaunchAgent.

### 1) Simpan AppleScript

Simpan sebagai:

- `~/Scripts/poke-messages.scpt`

Contoh skrip (non-interaktif; tidak mencuri fokus):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Instal LaunchAgent

Simpan sebagai:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Catatan:

- Ini berjalan **setiap 300 detik** dan **saat login**.
- Proses pertama kali berjalan dapat memicu prompt macOS **Automation** (`osascript` → Messages). Setujui prompt tersebut di sesi pengguna yang sama yang menjalankan LaunchAgent.

Muat:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles tersedia dalam onboarding interaktif:

```
openclaw onboard
```

Wizard akan meminta:

- **URL Server** (wajib): alamat server BlueBubbles (misalnya, `http://192.168.1.100:1234`)
- **Password** (wajib): kata sandi API dari pengaturan BlueBubbles Server
- **Path webhook** (opsional): default ke `/bluebubbles-webhook`
- **Kebijakan DM**: pairing, allowlist, open, atau disabled
- **Daftar izinkan**: nomor telepon, email, atau target chat

Anda juga dapat menambahkan BlueBubbles melalui CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kontrol akses (DM + grup)

DM:

- Default: `channels.bluebubbles.dmPolicy = "pairing"`.
- Pengirim yang tidak dikenal menerima kode pairing; pesan diabaikan sampai disetujui (kode kedaluwarsa setelah 1 jam).
- Setujui melalui:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Pairing adalah pertukaran token default. Detail: [Pairing](/channels/pairing)

Grup:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (default: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` mengontrol siapa yang dapat memicu di grup ketika `allowlist` ditetapkan.

### Pengayaan nama kontak (macOS, opsional)

Webhook grup BlueBubbles sering kali hanya menyertakan alamat peserta mentah. Jika Anda ingin konteks `GroupMembers` menampilkan nama kontak lokal sebagai gantinya, Anda dapat memilih pengayaan Contacts lokal di macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` mengaktifkan lookup. Default: `false`.
- Lookup hanya dijalankan setelah akses grup, otorisasi perintah, dan penggatingan mention mengizinkan pesan lolos.
- Hanya peserta telepon tanpa nama yang diperkaya.
- Nomor telepon mentah tetap menjadi fallback saat tidak ditemukan kecocokan lokal.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Penggatingan mention (grup)

BlueBubbles mendukung penggatingan mention untuk chat grup, selaras dengan perilaku iMessage/WhatsApp:

- Menggunakan `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`) untuk mendeteksi mention.
- Ketika `requireMention` diaktifkan untuk sebuah grup, agen hanya merespons saat disebut.
- Perintah kontrol dari pengirim yang berwenang melewati penggatingan mention.

Konfigurasi per grup:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default untuk semua grup
        "iMessage;-;chat123": { requireMention: false }, // override untuk grup tertentu
      },
    },
  },
}
```

### Penggatingan perintah

- Perintah kontrol (misalnya, `/config`, `/model`) memerlukan otorisasi.
- Menggunakan `allowFrom` dan `groupAllowFrom` untuk menentukan otorisasi perintah.
- Pengirim yang berwenang dapat menjalankan perintah kontrol bahkan tanpa mention di grup.

## Binding percakapan ACP

Chat BlueBubbles dapat diubah menjadi workspace ACP yang persisten tanpa mengubah lapisan transport.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan BlueBubbles yang sama akan dirutekan ke sesi ACP yang telah di-spawn.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Binding persisten yang dikonfigurasi juga didukung melalui entri `bindings[]` tingkat atas dengan `type: "acp"` dan `match.channel: "bluebubbles"`.

`match.peer.id` dapat menggunakan bentuk target BlueBubbles yang didukung:

- handle DM yang dinormalisasi seperti `+15555550123` atau `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Untuk binding grup yang stabil, utamakan `chat_id:*` atau `chat_identifier:*`.

Contoh:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Lihat [Agen ACP](/tools/acp-agents) untuk perilaku binding ACP bersama.

## Mengetik + tanda baca

- **Indikator mengetik**: Dikirim secara otomatis sebelum dan selama pembuatan respons.
- **Tanda baca**: Dikontrol oleh `channels.bluebubbles.sendReadReceipts` (default: `true`).
- **Indikator mengetik**: OpenClaw mengirim event mulai mengetik; BlueBubbles menghapus status mengetik secara otomatis saat mengirim atau saat timeout (penghentian manual via DELETE tidak andal).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // nonaktifkan tanda baca
    },
  },
}
```

## Tindakan lanjutan

BlueBubbles mendukung tindakan pesan lanjutan saat diaktifkan di konfigurasi:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback (default: true)
        edit: true, // edit pesan terkirim (macOS 13+, rusak di macOS 26 Tahoe)
        unsend: true, // batalkan kirim pesan (macOS 13+)
        reply: true, // utas balasan berdasarkan GUID pesan
        sendWithEffect: true, // efek pesan (slam, loud, dll.)
        renameGroup: true, // ganti nama chat grup
        setGroupIcon: true, // setel ikon/foto chat grup (tidak stabil di macOS 26 Tahoe)
        addParticipant: true, // tambahkan peserta ke grup
        removeParticipant: true, // hapus peserta dari grup
        leaveGroup: true, // keluar dari chat grup
        sendAttachment: true, // kirim lampiran/media
      },
    },
  },
}
```

Tindakan yang tersedia:

- **react**: Tambahkan/hapus reaksi tapback (`messageId`, `emoji`, `remove`)
- **edit**: Edit pesan yang telah dikirim (`messageId`, `text`)
- **unsend**: Batalkan kirim pesan (`messageId`)
- **reply**: Balas pesan tertentu (`messageId`, `text`, `to`)
- **sendWithEffect**: Kirim dengan efek iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Ganti nama chat grup (`chatGuid`, `displayName`)
- **setGroupIcon**: Setel ikon/foto chat grup (`chatGuid`, `media`) — tidak stabil di macOS 26 Tahoe (API mungkin mengembalikan sukses tetapi ikon tidak tersinkron).
- **addParticipant**: Tambahkan seseorang ke grup (`chatGuid`, `address`)
- **removeParticipant**: Hapus seseorang dari grup (`chatGuid`, `address`)
- **leaveGroup**: Keluar dari chat grup (`chatGuid`)
- **upload-file**: Kirim media/file (`to`, `buffer`, `filename`, `asVoice`)
  - Memo suara: setel `asVoice: true` dengan audio **MP3** atau **CAF** untuk mengirim sebagai pesan suara iMessage. BlueBubbles mengonversi MP3 → CAF saat mengirim memo suara.
- Alias lama: `sendAttachment` masih berfungsi, tetapi `upload-file` adalah nama tindakan kanonis.

### ID pesan (singkat vs penuh)

OpenClaw dapat menampilkan ID pesan _singkat_ (misalnya, `1`, `2`) untuk menghemat token.

- `MessageSid` / `ReplyToId` dapat berupa ID singkat.
- `MessageSidFull` / `ReplyToIdFull` berisi ID penuh provider.
- ID singkat berada di memori; ID ini dapat kedaluwarsa saat restart atau pengusiran cache.
- Tindakan menerima `messageId` singkat atau penuh, tetapi ID singkat akan menghasilkan error jika sudah tidak tersedia.

Gunakan ID penuh untuk otomasi dan penyimpanan yang persisten:

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Konteks: `MessageSidFull` / `ReplyToIdFull` di payload masuk

Lihat [Konfigurasi](/gateway/configuration) untuk variabel template.

## Streaming blok

Kontrol apakah respons dikirim sebagai satu pesan atau di-stream dalam blok:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // aktifkan streaming blok (nonaktif secara default)
    },
  },
}
```

## Media + batasan

- Lampiran masuk diunduh dan disimpan di cache media.
- Batas media melalui `channels.bluebubbles.mediaMaxMb` untuk media masuk dan keluar (default: 8 MB).
- Teks keluar dipecah menjadi `channels.bluebubbles.textChunkLimit` (default: 4000 karakter).

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi](/gateway/configuration)

Opsi provider:

- `channels.bluebubbles.enabled`: Aktifkan/nonaktifkan channel.
- `channels.bluebubbles.serverUrl`: URL dasar API REST BlueBubbles.
- `channels.bluebubbles.password`: Kata sandi API.
- `channels.bluebubbles.webhookPath`: Path endpoint webhook (default: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (default: `pairing`).
- `channels.bluebubbles.allowFrom`: allowlist DM (handle, email, nomor E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (default: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: allowlist pengirim grup.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Di macOS, secara opsional memperkaya peserta grup tanpa nama dari Contacts lokal setelah gating lolos. Default: `false`.
- `channels.bluebubbles.groups`: Konfigurasi per grup (`requireMention`, dll.).
- `channels.bluebubbles.sendReadReceipts`: Kirim tanda baca (default: `true`).
- `channels.bluebubbles.blockStreaming`: Aktifkan streaming blok (default: `false`; diperlukan untuk balasan streaming).
- `channels.bluebubbles.textChunkLimit`: Ukuran potongan keluar dalam karakter (default: 4000).
- `channels.bluebubbles.chunkMode`: `length` (default) membagi hanya saat melebihi `textChunkLimit`; `newline` membagi pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.bluebubbles.mediaMaxMb`: Batas media masuk/keluar dalam MB (default: 8).
- `channels.bluebubbles.mediaLocalRoots`: allowlist eksplisit direktori lokal absolut yang diizinkan untuk path media lokal keluar. Pengiriman path lokal ditolak secara default kecuali ini dikonfigurasi. Override per akun: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: Maks pesan grup untuk konteks (0 menonaktifkan).
- `channels.bluebubbles.dmHistoryLimit`: Batas riwayat DM.
- `channels.bluebubbles.actions`: Aktifkan/nonaktifkan tindakan tertentu.
- `channels.bluebubbles.accounts`: Konfigurasi multi-akun.

Opsi global terkait:

- `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Pengalamatan / target pengiriman

Utamakan `chat_guid` untuk perutean yang stabil:

- `chat_guid:iMessage;-;+15555550123` (disarankan untuk grup)
- `chat_id:123`
- `chat_identifier:...`
- Handle langsung: `+15555550123`, `user@example.com`
  - Jika handle langsung tidak memiliki chat DM yang sudah ada, OpenClaw akan membuatnya melalui `POST /api/v1/chat/new`. Ini mengharuskan BlueBubbles Private API diaktifkan.

## Keamanan

- Permintaan webhook diautentikasi dengan membandingkan parameter query atau header `guid`/`password` dengan `channels.bluebubbles.password`.
- Jaga kerahasiaan kata sandi API dan endpoint webhook (perlakukan keduanya seperti kredensial).
- Tidak ada bypass localhost untuk autentikasi webhook BlueBubbles. Jika Anda mem-proxy lalu lintas webhook, pertahankan kata sandi BlueBubbles pada permintaan secara end-to-end. `gateway.trustedProxies` tidak menggantikan `channels.bluebubbles.password` di sini. Lihat [Keamanan gateway](/gateway/security#reverse-proxy-configuration).
- Aktifkan HTTPS + aturan firewall pada server BlueBubbles jika diekspos di luar LAN Anda.

## Pemecahan masalah

- Jika event mengetik/baca berhenti berfungsi, periksa log webhook BlueBubbles dan verifikasi path gateway cocok dengan `channels.bluebubbles.webhookPath`.
- Kode pairing kedaluwarsa setelah satu jam; gunakan `openclaw pairing list bluebubbles` dan `openclaw pairing approve bluebubbles <code>`.
- Reaksi memerlukan BlueBubbles private API (`POST /api/v1/message/react`); pastikan versi server mengeksposnya.
- Edit/batalkan kirim memerlukan macOS 13+ dan versi server BlueBubbles yang kompatibel. Di macOS 26 (Tahoe), edit saat ini rusak karena perubahan private API.
- Pembaruan ikon grup bisa tidak stabil di macOS 26 (Tahoe): API mungkin mengembalikan sukses tetapi ikon baru tidak tersinkron.
- OpenClaw secara otomatis menyembunyikan tindakan yang diketahui rusak berdasarkan versi macOS server BlueBubbles. Jika edit masih muncul di macOS 26 (Tahoe), nonaktifkan secara manual dengan `channels.bluebubbles.actions.edit=false`.
- Untuk info status/kesehatan: `openclaw status --all` atau `openclaw status --deep`.

Untuk referensi alur kerja channel umum, lihat [Channels](/channels) dan panduan [Plugins](/tools/plugin).

## Terkait

- [Ikhtisar Channels](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/channels/groups) — perilaku chat grup dan penggatingan mention
- [Perutean Channel](/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/gateway/security) — model akses dan hardening
