---
read_when:
    - Menyiapkan saluran BlueBubbles
    - Pemecahan masalah penyandingan Webhook
    - Mengonfigurasi iMessage di macOS
sidebarTitle: BlueBubbles
summary: iMessage melalui server macOS BlueBubbles (pengiriman/penerimaan REST, status mengetik, reaksi, pemasangan, tindakan lanjutan).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T09:22:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: Plugin bawaan yang berkomunikasi dengan server macOS BlueBubbles melalui HTTP. **Direkomendasikan untuk integrasi iMessage** karena API-nya lebih kaya dan penyiapannya lebih mudah dibandingkan channel imsg lama.

<Note>
Rilis OpenClaw saat ini menyertakan BlueBubbles, jadi build paket normal tidak memerlukan langkah `openclaw plugins install` terpisah.
</Note>

## Gambaran umum

- Berjalan di macOS melalui aplikasi pembantu BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Direkomendasikan/diuji: macOS Sequoia (15). macOS Tahoe (26) berfungsi; pengeditan saat ini rusak di Tahoe, dan pembaruan ikon grup mungkin melaporkan berhasil tetapi tidak tersinkron.
- OpenClaw berkomunikasi dengannya melalui REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Pesan masuk tiba melalui Webhook; balasan keluar, indikator mengetik, tanda terima telah dibaca, dan tapback adalah panggilan REST.
- Lampiran dan stiker dicerna sebagai media masuk (dan ditampilkan ke agen jika memungkinkan).
- Balasan Auto-TTS yang menyintesis audio MP3 atau CAF dikirim sebagai gelembung memo suara iMessage, bukan lampiran file biasa.
- Pairing/daftar izin bekerja dengan cara yang sama seperti channel lain (`/channels/pairing` dll.) dengan `channels.bluebubbles.allowFrom` + kode pairing.
- Reaksi ditampilkan sebagai peristiwa sistem seperti Slack/Telegram sehingga agen dapat "menyebutkan" reaksi tersebut sebelum membalas.
- Fitur lanjutan: edit, batalkan kirim, threading balasan, efek pesan, manajemen grup.

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
  <Step title="Arahkan Webhook ke Gateway">
    Arahkan Webhook BlueBubbles ke Gateway Anda (contoh: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Mulai Gateway">
    Mulai Gateway; Gateway akan mendaftarkan handler Webhook dan memulai pairing.
  </Step>
</Steps>

<Warning>
**Keamanan**

- Selalu tetapkan kata sandi Webhook.
- Autentikasi Webhook selalu wajib. OpenClaw menolak permintaan Webhook BlueBubbles kecuali permintaan tersebut menyertakan kata sandi/guid yang cocok dengan `channels.bluebubbles.password` (misalnya `?password=<password>` atau `x-password`), terlepas dari topologi loopback/proksi.
- Autentikasi kata sandi diperiksa sebelum membaca/mengurai isi Webhook lengkap.

</Warning>

## Menjaga Messages.app tetap hidup (penyiapan VM / headless)

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

    Ini berjalan **setiap 300 detik** dan **saat login**. Eksekusi pertama mungkin memicu prompt **Automation** macOS (`osascript` → Messages). Setujui prompt tersebut dalam sesi pengguna yang sama dengan yang menjalankan LaunchAgent.

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
  Kata sandi API dari pengaturan Server BlueBubbles.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Path endpoint Webhook.
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
    - Pengirim tidak dikenal menerima kode pairing; pesan diabaikan sampai disetujui (kode kedaluwarsa setelah 1 jam).
    - Setujui melalui:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Pairing adalah pertukaran token default. Detail: [Pairing](/id/channels/pairing)

  </Tab>
  <Tab title="Grup">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (default: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` mengontrol siapa yang dapat memicu di grup saat `allowlist` ditetapkan.

  </Tab>
</Tabs>

### Pengayaan nama kontak (macOS, opsional)

Webhook grup BlueBubbles sering kali hanya menyertakan alamat peserta mentah. Jika Anda ingin konteks `GroupMembers` menampilkan nama kontak lokal sebagai gantinya, Anda dapat ikut serta dalam pengayaan Contacts lokal di macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` mengaktifkan lookup. Default: `false`.
- Lookup hanya berjalan setelah akses grup, otorisasi perintah, dan gating penyebutan mengizinkan pesan lewat.
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

### Gating penyebutan (grup)

BlueBubbles mendukung gating penyebutan untuk chat grup, sesuai perilaku iMessage/WhatsApp:

- Menggunakan `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`) untuk mendeteksi penyebutan.
- Saat `requireMention` diaktifkan untuk suatu grup, agen hanya merespons saat disebutkan.
- Perintah kontrol dari pengirim yang diotorisasi melewati gating penyebutan.

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
- Pengirim yang diotorisasi dapat menjalankan perintah kontrol bahkan tanpa menyebut di grup.

### Prompt sistem per grup

Setiap entri di bawah `channels.bluebubbles.groups.*` menerima string `systemPrompt` opsional. Nilainya disuntikkan ke prompt sistem agen pada setiap giliran yang menangani pesan di grup tersebut, sehingga Anda dapat menetapkan persona atau aturan perilaku per grup tanpa mengedit prompt agen:

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

#### Contoh lengkap: balasan berutas dan reaksi tapback (API Privat)

Dengan API Privat BlueBubbles diaktifkan, pesan masuk tiba dengan ID pesan pendek (misalnya `[[reply_to:5]]`) dan agen dapat memanggil `action=reply` untuk membuat utas ke pesan tertentu atau `action=react` untuk menjatuhkan tapback. `systemPrompt` per grup adalah cara yang andal untuk menjaga agen memilih alat yang tepat:

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

Reaksi tapback dan balasan berutas sama-sama memerlukan API Privat BlueBubbles; lihat [Tindakan lanjutan](#advanced-actions) dan [ID pesan](#message-ids-short-vs-full) untuk mekanisme dasarnya.

## Pengikatan percakapan ACP

Chat BlueBubbles dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah lapisan transport.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan BlueBubbles yang sama dirutekan ke sesi ACP yang dibuat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus pengikatan.

Pengikatan persisten yang dikonfigurasi juga didukung melalui entri `bindings[]` tingkat atas dengan `type: "acp"` dan `match.channel: "bluebubbles"`.

`match.peer.id` dapat menggunakan bentuk target BlueBubbles apa pun yang didukung:

- handle DM ternormalisasi seperti `+15555550123` atau `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Untuk pengikatan grup yang stabil, pilih `chat_id:*` atau `chat_identifier:*`.

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

Lihat [Agen ACP](/id/tools/acp-agents) untuk perilaku pengikatan ACP bersama.

## Mengetik + tanda terima telah dibaca

- **Indikator mengetik**: Dikirim otomatis sebelum dan selama pembuatan respons.
- **Tanda sudah dibaca**: Dikontrol oleh `channels.bluebubbles.sendReadReceipts` (bawaan: `true`).
- **Indikator mengetik**: OpenClaw mengirim event mulai mengetik; BlueBubbles menghapus status mengetik secara otomatis saat mengirim atau timeout (penghentian manual melalui DELETE tidak andal).

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
    - **react**: Menambahkan/menghapus reaksi tapback (`messageId`, `emoji`, `remove`). Set tapback bawaan iMessage adalah `love`, `like`, `dislike`, `laugh`, `emphasize`, dan `question`. Saat agent memilih emoji di luar set tersebut (misalnya `👀`), alat reaksi akan fallback ke `love` sehingga tapback tetap dirender, bukan menggagalkan seluruh permintaan. Reaksi ack yang dikonfigurasi tetap divalidasi secara ketat dan menghasilkan error pada nilai yang tidak dikenal.
    - **edit**: Mengedit pesan terkirim (`messageId`, `text`).
    - **unsend**: Membatalkan pengiriman pesan (`messageId`).
    - **reply**: Membalas pesan tertentu (`messageId`, `text`, `to`).
    - **sendWithEffect**: Mengirim dengan efek iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Mengganti nama chat grup (`chatGuid`, `displayName`).
    - **setGroupIcon**: Mengatur ikon/foto chat grup (`chatGuid`, `media`) — tidak stabil di macOS 26 Tahoe (API dapat mengembalikan sukses tetapi ikon tidak tersinkron).
    - **addParticipant**: Menambahkan seseorang ke grup (`chatGuid`, `address`).
    - **removeParticipant**: Menghapus seseorang dari grup (`chatGuid`, `address`).
    - **leaveGroup**: Meninggalkan chat grup (`chatGuid`).
    - **upload-file**: Mengirim media/file (`to`, `buffer`, `filename`, `asVoice`).
      - Memo suara: atur `asVoice: true` dengan audio **MP3** atau **CAF** untuk mengirim sebagai pesan suara iMessage. BlueBubbles mengonversi MP3 → CAF saat mengirim memo suara.
    - Alias lama: `sendAttachment` masih berfungsi, tetapi `upload-file` adalah nama tindakan kanonis.

  </Accordion>
</AccordionGroup>

### ID Pesan (pendek vs lengkap)

OpenClaw dapat menampilkan ID pesan _pendek_ (misalnya, `1`, `2`) untuk menghemat token.

- `MessageSid` / `ReplyToId` dapat berupa ID pendek.
- `MessageSidFull` / `ReplyToIdFull` berisi ID lengkap provider.
- ID pendek berada di memori; ID ini dapat kedaluwarsa saat restart atau cache eviction.
- Tindakan menerima `messageId` pendek atau lengkap, tetapi ID pendek akan menghasilkan error jika tidak lagi tersedia.

Gunakan ID lengkap untuk otomasi dan penyimpanan yang tahan lama:

- Templat: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Konteks: `MessageSidFull` / `ReplyToIdFull` dalam payload masuk

Lihat [Konfigurasi](/id/gateway/configuration) untuk variabel templat.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Menggabungkan DM split-send (perintah + URL dalam satu komposisi)

Saat pengguna mengetik perintah dan URL bersama-sama di iMessage — misalnya `Dump https://example.com/article` — Apple memecah pengiriman menjadi **dua pengiriman Webhook terpisah**:

1. Pesan teks (`"Dump"`).
2. Balon pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Kedua Webhook tiba di OpenClaw dengan selisih ~0,8-2,0 dtk pada sebagian besar setup. Tanpa penggabungan, agent menerima perintah saja pada turn 1, membalas (sering kali "kirimkan URL-nya"), dan baru melihat URL pada turn 2 — saat konteks perintah sudah hilang.

`channels.bluebubbles.coalesceSameSenderDms` memilih sebuah DM untuk menggabungkan Webhook berturut-turut dari pengirim yang sama menjadi satu turn agent. Chat grup tetap menggunakan kunci per pesan sehingga struktur turn multi-pengguna tetap dipertahankan.

<Tabs>
  <Tab title="Kapan mengaktifkan">
    Aktifkan saat:

    - Anda mengirimkan Skills yang mengharapkan `command + payload` dalam satu pesan (dump, paste, save, queue, dll.).
    - Pengguna Anda menempelkan URL, gambar, atau konten panjang bersama perintah.
    - Anda dapat menerima latensi turn DM tambahan (lihat di bawah).

    Biarkan dinonaktifkan saat:

    - Anda membutuhkan latensi perintah minimum untuk pemicu DM satu kata.
    - Semua flow Anda adalah perintah sekali jalan tanpa payload lanjutan.

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

    Dengan flag aktif dan tanpa `messages.inbound.byChannel.bluebubbles` eksplisit, jendela debounce melebar menjadi **2500 md** (bawaan untuk non-penggabungan adalah 500 md). Jendela yang lebih lebar diperlukan — ritme split-send Apple sebesar 0,8-2,0 dtk tidak muat dalam bawaan yang lebih ketat.

    Untuk menyetel jendela sendiri:

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
    - **Latensi tambahan untuk perintah kontrol DM.** Dengan flag aktif, pesan perintah kontrol DM (seperti `Dump`, `Save`, dll.) sekarang menunggu hingga jendela debounce sebelum dikirim, untuk berjaga-jaga jika Webhook payload akan datang. Perintah chat grup tetap dikirim seketika.
    - **Output tergabung dibatasi** — teks tergabung dibatasi 4000 karakter dengan penanda `…[truncated]` eksplisit; lampiran dibatasi 20; entri sumber dibatasi 10 (pertama-plus-terbaru dipertahankan setelah itu). Setiap `messageId` sumber tetap mencapai dedupe masuk sehingga pemutaran ulang MessagePoller berikutnya dari event individual apa pun dikenali sebagai duplikat.
    - **Opt-in, per channel.** Channel lain (Telegram, WhatsApp, Slack, …) tidak terpengaruh.

  </Tab>
</Tabs>

### Skenario dan apa yang dilihat agent

| Pengguna menyusun                                                   | Apple mengirimkan         | Flag nonaktif (bawaan)                 | Flag aktif + jendela 2500 md                                             |
| ------------------------------------------------------------------- | ------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (satu pengiriman)                        | 2 Webhook berjarak ~1 dtk | Dua turn agent: "Dump" saja, lalu URL  | Satu turn: teks tergabung `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (lampiran + teks)                   | 2 Webhook                 | Dua turn                               | Satu turn: teks + gambar                                                 |
| `/status` (perintah mandiri)                                        | 1 Webhook                 | Pengiriman seketika                    | **Menunggu hingga jendela, lalu mengirim**                               |
| URL ditempelkan saja                                                | 1 Webhook                 | Pengiriman seketika                    | Pengiriman seketika (hanya satu entri dalam bucket)                      |
| Teks + URL dikirim sebagai dua pesan terpisah yang disengaja, berjeda menit | 2 Webhook di luar jendela | Dua turn                               | Dua turn (jendela kedaluwarsa di antara keduanya)                        |
| Flood cepat (>10 DM kecil di dalam jendela)                         | N Webhook                 | N turn                                 | Satu turn, output dibatasi (pertama + terbaru, batas teks/lampiran diterapkan) |

### Pemecahan masalah penggabungan split-send

Jika flag aktif dan split-send masih tiba sebagai dua turn, periksa setiap lapisan:

<AccordionGroup>
  <Accordion title="Konfigurasi benar-benar dimuat">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Lalu `openclaw gateway restart` — flag dibaca saat pembuatan debouncer-registry.

  </Accordion>
  <Accordion title="Jendela debounce cukup lebar untuk setup Anda">
    Lihat log server BlueBubbles di bawah `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Ukur jarak antara pengiriman teks gaya `"Dump"` dan pengiriman `"https://..."; Attachments:` yang mengikutinya. Naikkan `messages.inbound.byChannel.bluebubbles` agar cukup mencakup jarak tersebut.

  </Accordion>
  <Accordion title="Timestamp JSONL sesi ≠ kedatangan Webhook">
    Timestamp event sesi (`~/.openclaw/agents/<id>/sessions/*.jsonl`) mencerminkan saat Gateway menyerahkan pesan ke agent, **bukan** saat Webhook tiba. Pesan kedua yang diantrekan dengan tag `[Queued messages while agent was busy]` berarti turn pertama masih berjalan saat Webhook kedua tiba — bucket penggabungan sudah dikosongkan. Setel jendela berdasarkan log server BB, bukan log sesi.
  </Accordion>
  <Accordion title="Tekanan memori memperlambat pengiriman balasan">
    Pada mesin yang lebih kecil (8 GB), turn agent dapat berlangsung cukup lama sehingga bucket penggabungan dikosongkan sebelum balasan selesai, dan URL masuk sebagai turn kedua yang diantrekan. Periksa `memory_pressure` dan `ps -o rss -p $(pgrep openclaw-gateway)`; jika Gateway berada di atas ~500 MB RSS dan kompresor aktif, tutup proses berat lain atau pindahkan ke host yang lebih besar.
  </Accordion>
  <Accordion title="Pengiriman kutipan balasan adalah jalur berbeda">
    Jika pengguna mengetuk `Dump` sebagai **balasan** ke balon URL yang sudah ada (iMessage menampilkan badge "1 Reply" pada balon Dump), URL berada di `replyToBody`, bukan di Webhook kedua. Penggabungan tidak berlaku — itu adalah urusan skill/prompt, bukan urusan debouncer.
  </Accordion>
</AccordionGroup>

## Streaming blok

Kontrol apakah respons dikirim sebagai satu pesan atau di-stream dalam blok:

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
- Batas media melalui `channels.bluebubbles.mediaMaxMb` untuk media masuk dan keluar (bawaan: 8 MB).
- Teks keluar dipotong menjadi chunk sesuai `channels.bluebubbles.textChunkLimit` (bawaan: 4000 karakter).

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

<AccordionGroup>
  <Accordion title="Koneksi dan Webhook">
    - `channels.bluebubbles.enabled`: Mengaktifkan/menonaktifkan channel.
    - `channels.bluebubbles.serverUrl`: URL dasar API REST BlueBubbles.
    - `channels.bluebubbles.password`: Kata sandi API.
    - `channels.bluebubbles.webhookPath`: Path endpoint Webhook (bawaan: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Kebijakan akses">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (bawaan: `pairing`).
    - `channels.bluebubbles.allowFrom`: Allowlist DM (handle, email, nomor E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (bawaan: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Allowlist pengirim grup.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Di macOS, secara opsional memperkaya peserta grup tanpa nama dari Kontak lokal setelah gating lulus. Bawaan: `false`.
    - `channels.bluebubbles.groups`: Konfigurasi per grup (`requireMention`, dll.).

  </Accordion>
  <Accordion title="Pengiriman dan pemotongan">
    - `channels.bluebubbles.sendReadReceipts`: Kirim tanda sudah dibaca (default: `true`).
    - `channels.bluebubbles.blockStreaming`: Aktifkan streaming blok (default: `false`; diperlukan untuk balasan streaming).
    - `channels.bluebubbles.textChunkLimit`: Ukuran potongan keluar dalam karakter (default: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Timeout per permintaan dalam ms untuk pengiriman teks keluar melalui `/api/v1/message/text` (default: 30000). Naikkan pada penyiapan macOS 26 saat pengiriman iMessage Private API dapat tertahan selama 60+ detik di dalam framework iMessage; misalnya `45000` atau `60000`. Probe, pencarian chat, reaksi, edit, dan pemeriksaan kesehatan saat ini tetap memakai default 10 detik yang lebih pendek; perluasan cakupan ke reaksi dan edit direncanakan sebagai tindak lanjut. Override per akun: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (default) membagi hanya saat melebihi `textChunkLimit`; `newline` membagi pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.

  </Accordion>
  <Accordion title="Media dan riwayat">
    - `channels.bluebubbles.mediaMaxMb`: Batas media masuk/keluar dalam MB (default: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Allowlist eksplisit direktori lokal absolut yang diizinkan untuk jalur media lokal keluar. Pengiriman jalur lokal ditolak secara default kecuali ini dikonfigurasi. Override per akun: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Gabungkan Webhook DM berturut-turut dari pengirim yang sama menjadi satu giliran agen sehingga pengiriman terpisah teks+URL Apple tiba sebagai satu pesan (default: `false`). Lihat [Menggabungkan DM pengiriman terpisah](#coalescing-split-send-dms-command--url-in-one-composition) untuk skenario, penyesuaian jendela, dan trade-off. Memperlebar jendela debounce masuk default dari 500 ms menjadi 2500 ms saat diaktifkan tanpa `messages.inbound.byChannel.bluebubbles` eksplisit.
    - `channels.bluebubbles.historyLimit`: Pesan grup maksimum untuk konteks (0 menonaktifkan).
    - `channels.bluebubbles.dmHistoryLimit`: Batas riwayat DM.
    - `channels.bluebubbles.replyContextApiFallback`: Saat balasan masuk tiba tanpa `replyToBody`/`replyToSender` dan cache konteks balasan dalam memori tidak menemukan data, ambil pesan asli dari BlueBubbles HTTP API sebagai fallback upaya terbaik (default: `false`). Berguna untuk deployment multi-instans yang berbagi satu akun BlueBubbles, setelah proses dimulai ulang, atau setelah pengusiran cache TTL/LRU yang berumur panjang. Pengambilan dilindungi SSRF oleh kebijakan yang sama seperti setiap permintaan klien BlueBubbles lainnya, tidak pernah melempar error, dan mengisi cache sehingga balasan berikutnya teramortisasi. Override per akun: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Pengaturan tingkat channel diterapkan ke akun yang tidak menyertakan flag tersebut.

  </Accordion>
  <Accordion title="Tindakan dan akun">
    - `channels.bluebubbles.actions`: Aktifkan/nonaktifkan tindakan tertentu.
    - `channels.bluebubbles.accounts`: Konfigurasi multi-akun.

  </Accordion>
</AccordionGroup>

Opsi global terkait:

- `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Alamat / target pengiriman

Utamakan `chat_guid` untuk routing yang stabil:

- `chat_guid:iMessage;-;+15555550123` (disarankan untuk grup)
- `chat_id:123`
- `chat_identifier:...`
- Handle langsung: `+15555550123`, `user@example.com`
  - Jika handle langsung tidak memiliki chat DM yang sudah ada, OpenClaw akan membuatnya melalui `POST /api/v1/chat/new`. Ini mengharuskan BlueBubbles Private API diaktifkan.

### Routing iMessage vs SMS

Saat handle yang sama memiliki chat iMessage dan SMS di Mac (misalnya nomor telepon yang terdaftar di iMessage tetapi juga pernah menerima fallback gelembung hijau), OpenClaw mengutamakan chat iMessage dan tidak pernah diam-diam menurunkan ke SMS. Untuk memaksa chat SMS, gunakan awalan target `sms:` eksplisit (misalnya `sms:+15555550123`). Handle tanpa chat iMessage yang cocok tetap mengirim melalui chat apa pun yang dilaporkan BlueBubbles.

## Keamanan

- Permintaan Webhook diautentikasi dengan membandingkan param kueri atau header `guid`/`password` dengan `channels.bluebubbles.password`.
- Jaga kerahasiaan kata sandi API dan endpoint Webhook (perlakukan seperti kredensial).
- Tidak ada bypass localhost untuk autentikasi Webhook BlueBubbles. Jika Anda mem-proxy traffic Webhook, pertahankan kata sandi BlueBubbles pada permintaan dari awal sampai akhir. `gateway.trustedProxies` tidak menggantikan `channels.bluebubbles.password` di sini. Lihat [Keamanan Gateway](/id/gateway/security#reverse-proxy-configuration).
- Aktifkan HTTPS + aturan firewall pada server BlueBubbles jika mengeksposnya di luar LAN Anda.

## Pemecahan masalah

- Jika event mengetik/sudah dibaca berhenti berfungsi, periksa log Webhook BlueBubbles dan verifikasi jalur gateway cocok dengan `channels.bluebubbles.webhookPath`.
- Kode pairing kedaluwarsa setelah satu jam; gunakan `openclaw pairing list bluebubbles` dan `openclaw pairing approve bluebubbles <code>`.
- Reaksi memerlukan private API BlueBubbles (`POST /api/v1/message/react`); pastikan versi server mengeksposnya.
- Edit/batal kirim memerlukan macOS 13+ dan versi server BlueBubbles yang kompatibel. Di macOS 26 (Tahoe), edit saat ini rusak karena perubahan private API.
- Pembaruan ikon grup dapat tidak stabil di macOS 26 (Tahoe): API mungkin mengembalikan sukses tetapi ikon baru tidak tersinkron.
- OpenClaw otomatis menyembunyikan tindakan yang diketahui rusak berdasarkan versi macOS server BlueBubbles. Jika edit masih muncul di macOS 26 (Tahoe), nonaktifkan secara manual dengan `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` diaktifkan tetapi pengiriman terpisah (misalnya `Dump` + URL) masih tiba sebagai dua giliran: lihat daftar periksa [pemecahan masalah penggabungan pengiriman terpisah](#split-send-coalescing-troubleshooting) — penyebab umum adalah jendela debounce yang terlalu ketat, timestamp log sesi yang keliru dibaca sebagai kedatangan Webhook, atau pengiriman kutipan balasan (yang memakai `replyToBody`, bukan Webhook kedua).
- Untuk info status/kesehatan: `openclaw status --all` atau `openclaw status --deep`.

Untuk referensi alur kerja channel umum, lihat [Channel](/id/channels) dan panduan [Plugins](/id/tools/plugin).

## Terkait

- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Grup](/id/channels/groups) — perilaku chat grup dan gating mention
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Keamanan](/id/gateway/security) — model akses dan hardening
