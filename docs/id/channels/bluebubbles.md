---
read_when:
    - Menyiapkan saluran BlueBubbles
    - Pemecahan masalah penyandingan Webhook
    - Mengonfigurasi iMessage di macOS
sidebarTitle: BlueBubbles
summary: iMessage melalui server macOS BlueBubbles (pengiriman/penerimaan REST, mengetik, reaksi, penyandingan, tindakan lanjutan).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-30T09:32:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a77b248ed86eb4114f8b7f1fc6bd4cea004d65095a0439a4a8c814bc180082c
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: plugin bawaan yang berkomunikasi dengan server macOS BlueBubbles melalui HTTP. **Direkomendasikan untuk integrasi iMessage** karena API-nya lebih kaya dan penyiapannya lebih mudah dibandingkan channel imsg lama.

<Note>
Rilis OpenClaw saat ini menyertakan BlueBubbles, jadi build paket normal tidak memerlukan langkah `openclaw plugins install` terpisah.
</Note>

## Ringkasan

- Berjalan di macOS melalui aplikasi pembantu BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Direkomendasikan/diuji: macOS Sequoia (15). macOS Tahoe (26) berfungsi; edit saat ini rusak di Tahoe, dan pembaruan ikon grup dapat melaporkan berhasil tetapi tidak tersinkron.
- OpenClaw berkomunikasi dengannya melalui REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Pesan masuk tiba melalui webhook; balasan keluar, indikator mengetik, tanda terima baca, dan tapback adalah panggilan REST.
- Lampiran dan stiker diserap sebagai media masuk (dan ditampilkan ke agen bila memungkinkan).
- Balasan Auto-TTS yang menyintesis audio MP3 atau CAF dikirim sebagai gelembung memo suara iMessage, bukan lampiran file biasa.
- Pemasangan/allowlist bekerja dengan cara yang sama seperti channel lain (`/channels/pairing` dll.) dengan `channels.bluebubbles.allowFrom` + kode pemasangan.
- Reaksi ditampilkan sebagai peristiwa sistem seperti Slack/Telegram sehingga agen dapat "menyebut" reaksi tersebut sebelum membalas.
- Fitur lanjutan: edit, batal kirim, utas balasan, efek pesan, pengelolaan grup.

## Mulai cepat

<Steps>
  <Step title="Instal BlueBubbles">
    Instal server BlueBubbles di Mac Anda (ikuti instruksi di [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Aktifkan API web">
    Di konfigurasi BlueBubbles, aktifkan API web dan tetapkan kata sandi.
  </Step>
  <Step title="Konfigurasikan OpenClaw">
    Jalankan `openclaw onboard` dan pilih BlueBubbles, atau konfigurasikan secara manual:

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

  </Step>
  <Step title="Arahkan webhook ke gateway">
    Arahkan webhook BlueBubbles ke gateway Anda (contoh: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Mulai gateway">
    Mulai gateway; gateway akan mendaftarkan handler webhook dan memulai pemasangan.
  </Step>
</Steps>

<Warning>
**Keamanan**

- Selalu tetapkan kata sandi webhook.
- Autentikasi webhook selalu wajib. OpenClaw menolak permintaan webhook BlueBubbles kecuali permintaan tersebut menyertakan password/guid yang cocok dengan `channels.bluebubbles.password` (misalnya `?password=<password>` atau `x-password`), terlepas dari topologi loopback/proxy.
- Autentikasi kata sandi diperiksa sebelum membaca/mengurai isi webhook lengkap.

</Warning>

## Menjaga Messages.app tetap aktif (VM / penyiapan headless)

Beberapa penyiapan VM macOS / selalu aktif dapat membuat Messages.app menjadi "idle" (peristiwa masuk berhenti sampai aplikasi dibuka/dibawa ke depan). Solusi sederhana adalah **menyentuh Messages setiap 5 menit** menggunakan AppleScript + LaunchAgent.

<Steps>
  <Step title="Simpan AppleScript">
    Simpan ini sebagai `~/Scripts/poke-messages.scpt`:

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

  </Step>
  <Step title="Instal LaunchAgent">
    Simpan ini sebagai `~/Library/LaunchAgents/com.user.poke-messages.plist`:

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

    Ini berjalan **setiap 300 detik** dan **saat login**. Eksekusi pertama dapat memicu prompt **Automation** macOS (`osascript` → Messages). Setujui prompt tersebut di sesi pengguna yang sama yang menjalankan LaunchAgent.

  </Step>
  <Step title="Muat">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles tersedia dalam onboarding interaktif:

```
openclaw onboard
```

Wizard meminta:

<ParamField path="Server URL" type="string" required>
  Alamat server BlueBubbles (misalnya, `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Kata sandi API dari pengaturan BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Path endpoint webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open`, atau `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Nomor telepon, email, atau target chat.
</ParamField>

Anda juga dapat menambahkan BlueBubbles melalui CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kontrol akses (DM + grup)

<Tabs>
  <Tab title="DM">
    - Default: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Pengirim yang tidak dikenal menerima kode pemasangan; pesan diabaikan sampai disetujui (kode kedaluwarsa setelah 1 jam).
    - Setujui melalui:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Pemasangan adalah pertukaran token default. Detail: [Pemasangan](/id/channels/pairing)

  </Tab>
  <Tab title="Grup">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (default: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` mengontrol siapa yang dapat memicu di grup saat `allowlist` ditetapkan.

  </Tab>
</Tabs>

### Pengayaan nama kontak (macOS, opsional)

Webhook grup BlueBubbles sering kali hanya menyertakan alamat peserta mentah. Jika Anda ingin konteks `GroupMembers` menampilkan nama kontak lokal sebagai gantinya, Anda dapat ikut serta dalam pengayaan Kontak lokal di macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` mengaktifkan pencarian. Default: `false`.
- Pencarian hanya berjalan setelah akses grup, otorisasi perintah, dan gating penyebutan mengizinkan pesan lewat.
- Hanya peserta telepon tanpa nama yang diperkaya.
- Nomor telepon mentah tetap menjadi fallback saat tidak ada kecocokan lokal yang ditemukan.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Gating penyebutan (grup)

BlueBubbles mendukung gating penyebutan untuk chat grup, sesuai perilaku iMessage/WhatsApp:

- Menggunakan `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`) untuk mendeteksi penyebutan.
- Saat `requireMention` diaktifkan untuk grup, agen hanya merespons saat disebut.
- Perintah kontrol dari pengirim yang berwenang melewati gating penyebutan.

Konfigurasi per grup:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Gating perintah

- Perintah kontrol (misalnya, `/config`, `/model`) memerlukan otorisasi.
- Menggunakan `allowFrom` dan `groupAllowFrom` untuk menentukan otorisasi perintah.
- Pengirim yang berwenang dapat menjalankan perintah kontrol bahkan tanpa menyebut di grup.

### Prompt sistem per grup

Setiap entri di bawah `channels.bluebubbles.groups.*` menerima string `systemPrompt` opsional. Nilai ini disuntikkan ke prompt sistem agen pada setiap giliran yang menangani pesan di grup tersebut, sehingga Anda dapat menetapkan persona atau aturan perilaku per grup tanpa mengedit prompt agen:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

Kunci cocok dengan apa pun yang dilaporkan BlueBubbles sebagai `chatGuid` / `chatIdentifier` / `chatId` numerik untuk grup, dan entri wildcard `"*"` menyediakan default untuk setiap grup tanpa kecocokan persis (pola yang sama digunakan oleh `requireMention` dan kebijakan alat per grup). Kecocokan persis selalu mengalahkan wildcard. DM mengabaikan bidang ini; gunakan kustomisasi prompt tingkat agen atau tingkat akun sebagai gantinya.

#### Contoh kerja: balasan berutas dan reaksi tapback (Private API)

Dengan BlueBubbles Private API diaktifkan, pesan masuk tiba dengan ID pesan pendek (misalnya `[[reply_to:5]]`) dan agen dapat memanggil `action=reply` untuk masuk ke utas pesan tertentu atau `action=react` untuk memberikan tapback. `systemPrompt` per grup adalah cara andal untuk menjaga agen memilih alat yang tepat:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reaksi tapback dan balasan berutas sama-sama memerlukan BlueBubbles Private API; lihat [Tindakan lanjutan](#advanced-actions) dan [ID pesan](#message-ids-short-vs-full) untuk mekanisme dasarnya.

## Binding percakapan ACP

Chat BlueBubbles dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah lapisan transport.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan BlueBubbles yang sama dirutekan ke sesi ACP yang dibuat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Binding persisten yang dikonfigurasi juga didukung melalui entri `bindings[]` tingkat atas dengan `type: "acp"` dan `match.channel: "bluebubbles"`.

`match.peer.id` dapat menggunakan bentuk target BlueBubbles apa pun yang didukung:

- handle DM ternormalisasi seperti `+15555550123` atau `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Untuk binding grup yang stabil, pilih `chat_id:*` atau `chat_identifier:*`.

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

Lihat [Agen ACP](/id/tools/acp-agents) untuk perilaku binding ACP bersama.

## Mengetik + tanda terima baca

- **Indikator mengetik**: Dikirim otomatis sebelum dan selama pembuatan respons.
- **Tanda terima baca**: Dikendalikan oleh `channels.bluebubbles.sendReadReceipts` (default: `true`).
- **Indikator mengetik**: OpenClaw mengirim peristiwa mulai mengetik; BlueBubbles menghapus status mengetik secara otomatis saat dikirim atau timeout (penghentian manual melalui DELETE tidak andal).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## Tindakan lanjutan

BlueBubbles mendukung tindakan pesan lanjutan saat diaktifkan dalam konfigurasi:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Tindakan yang tersedia">
    - **react**: Tambahkan/hapus reaksi tapback (`messageId`, `emoji`, `remove`). Set tapback bawaan iMessage adalah `love`, `like`, `dislike`, `laugh`, `emphasize`, dan `question`. Saat agen memilih emoji di luar set tersebut (misalnya `👀`), alat reaksi beralih ke `love` sehingga tapback tetap dirender alih-alih menggagalkan seluruh permintaan. Reaksi ack yang dikonfigurasi tetap divalidasi secara ketat dan menghasilkan error pada nilai yang tidak dikenal.
    - **edit**: Edit pesan terkirim (`messageId`, `text`).
    - **unsend**: Batalkan pengiriman pesan (`messageId`).
    - **reply**: Balas pesan tertentu (`messageId`, `text`, `to`).
    - **sendWithEffect**: Kirim dengan efek iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Ubah nama chat grup (`chatGuid`, `displayName`).
    - **setGroupIcon**: Tetapkan ikon/foto chat grup (`chatGuid`, `media`) — tidak stabil di macOS 26 Tahoe (API dapat mengembalikan sukses tetapi ikon tidak tersinkron).
    - **addParticipant**: Tambahkan seseorang ke grup (`chatGuid`, `address`).
    - **removeParticipant**: Hapus seseorang dari grup (`chatGuid`, `address`).
    - **leaveGroup**: Tinggalkan chat grup (`chatGuid`).
    - **upload-file**: Kirim media/file (`to`, `buffer`, `filename`, `asVoice`).
      - Memo suara: tetapkan `asVoice: true` dengan audio **MP3** atau **CAF** untuk mengirim sebagai pesan suara iMessage. BlueBubbles mengonversi MP3 → CAF saat mengirim memo suara.
    - Alias lama: `sendAttachment` masih berfungsi, tetapi `upload-file` adalah nama tindakan kanonis.

  </Accordion>
</AccordionGroup>

### ID pesan (pendek vs lengkap)

OpenClaw dapat menampilkan ID pesan _pendek_ (misalnya, `1`, `2`) untuk menghemat token.

- `MessageSid` / `ReplyToId` dapat berupa ID pendek.
- `MessageSidFull` / `ReplyToIdFull` berisi ID lengkap penyedia.
- ID pendek berada di memori; ID tersebut dapat kedaluwarsa saat restart atau penggusuran cache.
- Tindakan menerima `messageId` pendek atau lengkap, tetapi ID pendek akan error jika tidak lagi tersedia.

Gunakan ID lengkap untuk otomatisasi dan penyimpanan yang tahan lama:

- Templat: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Konteks: `MessageSidFull` / `ReplyToIdFull` dalam payload masuk

Lihat [Konfigurasi](/id/gateway/configuration) untuk variabel templat.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Menggabungkan DM split-send (perintah + URL dalam satu komposisi)

Saat pengguna mengetik perintah dan URL bersama di iMessage — misalnya `Dump https://example.com/article` — Apple memecah pengiriman menjadi **dua pengiriman Webhook terpisah**:

1. Pesan teks (`"Dump"`).
2. Balon pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Kedua Webhook tiba di OpenClaw dengan jarak ~0,8-2,0 dtk pada sebagian besar setup. Tanpa penggabungan, agen menerima perintah saja pada giliran 1, membalas (sering kali "kirimkan URL-nya"), dan baru melihat URL pada giliran 2 — saat konteks perintah sudah hilang.

`channels.bluebubbles.coalesceSameSenderDms` mengikutsertakan DM untuk menggabungkan Webhook berurutan dari pengirim yang sama menjadi satu giliran agen. Chat grup tetap dikunci per pesan sehingga struktur giliran multi-pengguna dipertahankan.

<Tabs>
  <Tab title="Kapan mengaktifkan">
    Aktifkan saat:

    - Anda mengirimkan Skills yang mengharapkan `command + payload` dalam satu pesan (dump, paste, save, queue, dll.).
    - Pengguna Anda menempelkan URL, gambar, atau konten panjang bersama perintah.
    - Anda dapat menerima latensi giliran DM tambahan (lihat di bawah).

    Biarkan nonaktif saat:

    - Anda memerlukan latensi perintah minimum untuk pemicu DM satu kata.
    - Semua alur Anda adalah perintah sekali jalan tanpa payload lanjutan.

  </Tab>
  <Tab title="Mengaktifkan">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Dengan flag aktif dan tanpa `messages.inbound.byChannel.bluebubbles` eksplisit, jendela debounce melebar menjadi **2500 md** (default untuk non-penggabungan adalah 500 md). Jendela yang lebih lebar diperlukan — irama split-send Apple sebesar 0,8-2,0 dtk tidak muat dalam default yang lebih ketat.

    Untuk menyesuaikan jendelanya sendiri:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-off">
    - **Latensi tambahan untuk perintah kontrol DM.** Dengan flag aktif, pesan perintah kontrol DM (seperti `Dump`, `Save`, dll.) kini menunggu hingga jendela debounce sebelum dikirim, untuk berjaga-jaga jika Webhook payload akan datang. Perintah chat grup tetap dikirim seketika.
    - **Output gabungan dibatasi** — teks gabungan dibatasi pada 4000 karakter dengan penanda `…[truncated]` eksplisit; lampiran dibatasi 20; entri sumber dibatasi 10 (pertama-plus-terbaru dipertahankan setelah itu). Setiap `messageId` sumber tetap mencapai dedupe masuk sehingga replay MessagePoller berikutnya dari peristiwa individual apa pun dikenali sebagai duplikat.
    - **Opt-in, per channel.** Channel lain (Telegram, WhatsApp, Slack, …) tidak terpengaruh.

  </Tab>
</Tabs>

### Skenario dan apa yang dilihat agen

| Pengguna menyusun                                                  | Apple mengirim            | Flag nonaktif (default)                 | Flag aktif + jendela 2500 md                                            |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (satu kiriman)                          | 2 Webhook berjarak ~1 dtk | Dua giliran agen: "Dump" saja, lalu URL | Satu giliran: teks gabungan `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (lampiran + teks)                  | 2 Webhook                 | Dua giliran                             | Satu giliran: teks + gambar                                             |
| `/status` (perintah mandiri)                                       | 1 Webhook                 | Pengiriman seketika                     | **Tunggu hingga jendela, lalu kirim**                                   |
| URL ditempel sendiri                                               | 1 Webhook                 | Pengiriman seketika                     | Pengiriman seketika (hanya satu entri dalam bucket)                     |
| Teks + URL dikirim sebagai dua pesan terpisah yang disengaja, berjarak menit | 2 Webhook di luar jendela | Dua giliran                             | Dua giliran (jendela kedaluwarsa di antaranya)                          |
| Banjir cepat (>10 DM kecil di dalam jendela)                       | N Webhook                 | N giliran                               | Satu giliran, output dibatasi (pertama + terbaru, batas teks/lampiran diterapkan) |

### Pemecahan masalah penggabungan split-send

Jika flag aktif dan split-send masih tiba sebagai dua giliran, periksa setiap lapisan:

<AccordionGroup>
  <Accordion title="Konfigurasi benar-benar dimuat">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Lalu `openclaw gateway restart` — flag dibaca saat pembuatan registry debouncer.

  </Accordion>
  <Accordion title="Jendela debounce cukup lebar untuk setup Anda">
    Lihat log server BlueBubbles di bawah `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Ukur celah antara pengiriman teks bergaya `"Dump"` dan pengiriman `"https://..."; Attachments:` yang mengikutinya. Naikkan `messages.inbound.byChannel.bluebubbles` agar menutup celah tersebut dengan nyaman.

  </Accordion>
  <Accordion title="Timestamp JSONL sesi ≠ kedatangan Webhook">
    Timestamp peristiwa sesi (`~/.openclaw/agents/<id>/sessions/*.jsonl`) mencerminkan kapan Gateway menyerahkan pesan ke agen, **bukan** kapan Webhook tiba. Pesan kedua yang mengantre dan diberi tag `[Queued messages while agent was busy]` berarti giliran pertama masih berjalan saat Webhook kedua tiba — bucket penggabungan sudah ter-flush. Sesuaikan jendela berdasarkan log server BB, bukan log sesi.
  </Accordion>
  <Accordion title="Tekanan memori memperlambat pengiriman balasan">
    Pada mesin yang lebih kecil (8 GB), giliran agen dapat memakan waktu cukup lama sehingga bucket penggabungan ter-flush sebelum balasan selesai, dan URL masuk sebagai giliran kedua yang mengantre. Periksa `memory_pressure` dan `ps -o rss -p $(pgrep openclaw-gateway)`; jika Gateway di atas ~500 MB RSS dan kompresor aktif, tutup proses berat lain atau pindah ke host yang lebih besar.
  </Accordion>
  <Accordion title="Pengiriman kutipan balasan adalah jalur berbeda">
    Jika pengguna mengetuk `Dump` sebagai **balasan** ke balon URL yang sudah ada (iMessage menampilkan badge "1 Reply" pada gelembung Dump), URL berada di `replyToBody`, bukan di Webhook kedua. Penggabungan tidak berlaku — itu urusan skill/prompt, bukan urusan debouncer.
  </Accordion>
</AccordionGroup>

## Streaming blok

Kendalikan apakah respons dikirim sebagai satu pesan atau di-stream dalam blok:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Media + batas

- Lampiran masuk diunduh dan disimpan dalam cache media.
- Batas media melalui `channels.bluebubbles.mediaMaxMb` untuk media masuk dan keluar (default: 8 MB).
- Teks keluar dipecah menjadi chunk sesuai `channels.bluebubbles.textChunkLimit` (default: 4000 karakter).

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

<AccordionGroup>
  <Accordion title="Koneksi dan Webhook">
    - `channels.bluebubbles.enabled`: Aktifkan/nonaktifkan channel.
    - `channels.bluebubbles.serverUrl`: URL dasar API REST BlueBubbles.
    - `channels.bluebubbles.password`: Kata sandi API.
    - `channels.bluebubbles.webhookPath`: Path endpoint Webhook (default: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Kebijakan akses">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (default: `pairing`).
    - `channels.bluebubbles.allowFrom`: Allowlist DM (handle, email, nomor E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (default: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Allowlist pengirim grup.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Di macOS, secara opsional perkaya peserta grup tanpa nama dari Contacts lokal setelah gating lolos. Default: `false`.
    - `channels.bluebubbles.groups`: Konfigurasi per grup (`requireMention`, dll.).

  </Accordion>
  <Accordion title="Pengiriman dan pemotongan">
    - `channels.bluebubbles.sendReadReceipts`: Kirim tanda sudah dibaca (bawaan: `true`).
    - `channels.bluebubbles.blockStreaming`: Aktifkan block streaming (bawaan: `false`; diperlukan untuk balasan streaming).
    - `channels.bluebubbles.textChunkLimit`: Ukuran potongan keluar dalam karakter (bawaan: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Timeout per permintaan dalam ms untuk pengiriman teks keluar melalui `/api/v1/message/text` (bawaan: 30000). Naikkan pada setup macOS 26 ketika pengiriman iMessage Private API dapat macet selama 60+ detik di dalam framework iMessage; misalnya `45000` atau `60000`. Probe, pencarian chat, reaction, edit, dan health check saat ini tetap memakai bawaan 10 detik yang lebih singkat; perluasan cakupan ke reaction dan edit direncanakan sebagai tindak lanjut. Override per akun: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (bawaan) memecah hanya saat melebihi `textChunkLimit`; `newline` memecah pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.

  </Accordion>
  <Accordion title="Media dan riwayat">
    - `channels.bluebubbles.mediaMaxMb`: Batas media masuk/keluar dalam MB (bawaan: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Allowlist eksplisit direktori lokal absolut yang diizinkan untuk jalur media lokal keluar. Pengiriman jalur lokal ditolak secara bawaan kecuali ini dikonfigurasi. Override per akun: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Gabungkan webhook DM berurutan dari pengirim yang sama menjadi satu giliran agen agar kiriman terpisah teks+URL Apple tiba sebagai satu pesan (bawaan: `false`). Lihat [Menggabungkan DM kiriman terpisah](#coalescing-split-send-dms-command--url-in-one-composition) untuk skenario, penyetelan jendela, dan trade-off. Memperlebar jendela debounce masuk bawaan dari 500 ms menjadi 2500 ms saat diaktifkan tanpa `messages.inbound.byChannel.bluebubbles` eksplisit.
    - `channels.bluebubbles.historyLimit`: Pesan grup maksimum untuk konteks (0 menonaktifkan).
    - `channels.bluebubbles.dmHistoryLimit`: Batas riwayat DM.

  </Accordion>
  <Accordion title="Tindakan dan akun">
    - `channels.bluebubbles.actions`: Aktifkan/nonaktifkan tindakan tertentu.
    - `channels.bluebubbles.accounts`: Konfigurasi multi-akun.

  </Accordion>
</AccordionGroup>

Opsi global terkait:

- `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Pengalamatan / target pengiriman

Utamakan `chat_guid` untuk perutean stabil:

- `chat_guid:iMessage;-;+15555550123` (diutamakan untuk grup)
- `chat_id:123`
- `chat_identifier:...`
- Handle langsung: `+15555550123`, `user@example.com`
  - Jika handle langsung tidak memiliki chat DM yang sudah ada, OpenClaw akan membuatnya melalui `POST /api/v1/chat/new`. Ini memerlukan BlueBubbles Private API diaktifkan.

### Perutean iMessage vs SMS

Ketika handle yang sama memiliki chat iMessage dan SMS di Mac (misalnya nomor telepon yang terdaftar di iMessage tetapi juga pernah menerima fallback gelembung hijau), OpenClaw mengutamakan chat iMessage dan tidak pernah diam-diam menurunkan ke SMS. Untuk memaksa chat SMS, gunakan awalan target `sms:` eksplisit (misalnya `sms:+15555550123`). Handle tanpa chat iMessage yang cocok tetap mengirim melalui chat apa pun yang dilaporkan BlueBubbles.

## Keamanan

- Permintaan Webhook diautentikasi dengan membandingkan parameter query atau header `guid`/`password` terhadap `channels.bluebubbles.password`.
- Jaga kerahasiaan kata sandi API dan endpoint webhook (perlakukan seperti kredensial).
- Tidak ada bypass localhost untuk autentikasi webhook BlueBubbles. Jika Anda mem-proxy traffic webhook, pertahankan kata sandi BlueBubbles pada permintaan dari ujung ke ujung. `gateway.trustedProxies` tidak menggantikan `channels.bluebubbles.password` di sini. Lihat [Keamanan Gateway](/id/gateway/security#reverse-proxy-configuration).
- Aktifkan HTTPS + aturan firewall pada server BlueBubbles jika mengeksposnya di luar LAN Anda.

## Pemecahan masalah

- Jika event mengetik/sudah dibaca berhenti berfungsi, periksa log webhook BlueBubbles dan verifikasi jalur gateway cocok dengan `channels.bluebubbles.webhookPath`.
- Kode pairing kedaluwarsa setelah satu jam; gunakan `openclaw pairing list bluebubbles` dan `openclaw pairing approve bluebubbles <code>`.
- Reaction memerlukan private API BlueBubbles (`POST /api/v1/message/react`); pastikan versi server mengeksposnya.
- Edit/unsend memerlukan macOS 13+ dan versi server BlueBubbles yang kompatibel. Pada macOS 26 (Tahoe), edit saat ini rusak karena perubahan private API.
- Pembaruan ikon grup bisa tidak stabil pada macOS 26 (Tahoe): API dapat mengembalikan sukses tetapi ikon baru tidak tersinkron.
- OpenClaw otomatis menyembunyikan tindakan yang diketahui rusak berdasarkan versi macOS server BlueBubbles. Jika edit masih muncul pada macOS 26 (Tahoe), nonaktifkan secara manual dengan `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` aktif tetapi kiriman terpisah (mis. `Dump` + URL) masih tiba sebagai dua giliran: lihat checklist [pemecahan masalah penggabungan kiriman terpisah](#split-send-coalescing-troubleshooting) — penyebab umum adalah jendela debounce terlalu ketat, timestamp log sesi salah dibaca sebagai kedatangan webhook, atau pengiriman kutipan balasan (yang memakai `replyToBody`, bukan webhook kedua).
- Untuk info status/health: `openclaw status --all` atau `openclaw status --deep`.

Untuk referensi umum alur kerja channel, lihat [Channel](/id/channels) dan panduan [Plugins](/id/tools/plugin).

## Terkait

- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Ringkasan Channel](/id/channels) — semua channel yang didukung
- [Grup](/id/channels/groups) — perilaku chat grup dan gerbang mention
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Keamanan](/id/gateway/security) — model akses dan hardening
