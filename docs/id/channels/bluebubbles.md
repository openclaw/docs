---
read_when:
    - Menyiapkan saluran BlueBubbles
    - Pemecahan masalah pemasangan Webhook
    - Mengonfigurasi iMessage di macOS
sidebarTitle: BlueBubbles
summary: Dukungan iMessage lama melalui server macOS BlueBubbles (kirim/terima REST, mengetik, reaksi, pemasangan, tindakan lanjutan).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-07T01:50:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e32b35242c7e751b49dcd8d839bc291c80cb4d88c0b4ce6f65635b7ef2ed97c3
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: Plugin warisan bawaan yang berkomunikasi dengan server macOS BlueBubbles melalui HTTP. Setup BlueBubbles yang sudah ada tetap berfungsi, tetapi deployment OpenClaw iMessage baru sebaiknya memilih Plugin [iMessage](/id/channels/imessage) native ketika persyaratannya sesuai dengan host Anda.

<Warning>
BlueBubbles tidak digunakan lagi untuk setup OpenClaw baru.

Ekosistem upstream BlueBubbles masih aktif, tetapi OpenClaw bergantung pada API server macOS BlueBubbles. Per 6 Mei 2026, cabang pengembangan resmi [`bluebubbles-server`](https://github.com/BlueBubblesApp/bluebubbles-server) terakhir berubah pada [22 Januari 2026](https://github.com/BlueBubblesApp/bluebubbles-server/commit/88a4921bbd5a8111f1e9582b83715cf877171037), dan rilis server terbaru ([`v1.9.9`](https://github.com/BlueBubblesApp/bluebubbles-server/releases/tag/v1.9.9)) diterbitkan pada 16 Mei 2025. Aplikasi klien dan repositori helper memiliki aktivitas yang lebih baru, jadi ini bukan klaim bahwa proyek ditinggalkan; penghentian ini bertujuan mengurangi ketergantungan OpenClaw pada server HTTP eksternal, webhook, dan permukaan kompatibilitas private-API ketika jalur native `imsg` menjaga integrasi tetap pada kontrak stdio lokal.
</Warning>

<Note>
Rilis OpenClaw saat ini menyertakan BlueBubbles, sehingga build paket normal tidak memerlukan langkah `openclaw plugins install` terpisah.
</Note>

## Gambaran umum

- Berjalan di macOS melalui aplikasi helper BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Fallback warisan untuk instalasi yang sudah bergantung pada ID channel BlueBubbles, status webhook, target grup, pengiriman cron, atau perutean workspace.
- Direkomendasikan/diuji: macOS Sequoia (15). macOS Tahoe (26) berfungsi; edit saat ini rusak di Tahoe, dan pembaruan ikon grup mungkin melaporkan sukses tetapi tidak tersinkron.
- OpenClaw berkomunikasi dengannya melalui REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Pesan masuk tiba melalui webhook; balasan keluar, indikator mengetik, tanda dibaca, dan tapback adalah panggilan REST.
- Lampiran dan stiker diserap sebagai media masuk (dan ditampilkan ke agent bila memungkinkan).
- Balasan Auto-TTS yang mensintesis audio MP3 atau CAF dikirim sebagai gelembung voice memo iMessage, bukan lampiran file biasa.
- Pairing/allowlist bekerja dengan cara yang sama seperti channel lain (`/channels/pairing` dll.) dengan `channels.bluebubbles.allowFrom` + kode pairing.
- Reaksi ditampilkan sebagai event sistem seperti Slack/Telegram sehingga agent dapat "menyebutnya" sebelum membalas.
- Fitur lanjutan: edit, unsend, reply threading, efek pesan, manajemen grup.

## Mulai cepat

<Steps>
  <Step title="Instal BlueBubbles">
    Instal server BlueBubbles di Mac Anda (ikuti instruksi di [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Aktifkan web API">
    Di konfigurasi BlueBubbles, aktifkan web API dan tetapkan kata sandi.
  </Step>
  <Step title="Konfigurasi OpenClaw">
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
    Mulai gateway; gateway akan mendaftarkan handler webhook dan memulai pairing.
  </Step>
</Steps>

<Warning>
**Keamanan**

- Selalu tetapkan kata sandi webhook.
- Autentikasi webhook selalu diperlukan. OpenClaw menolak permintaan webhook BlueBubbles kecuali menyertakan password/guid yang cocok dengan `channels.bluebubbles.password` (misalnya `?password=<password>` atau `x-password`), terlepas dari topologi loopback/proxy.
- Autentikasi kata sandi diperiksa sebelum membaca/mengurai body webhook penuh.

</Warning>

## Menjaga Messages.app tetap aktif (setup VM / headless)

Beberapa setup VM macOS / selalu aktif dapat membuat Messages.app menjadi "idle" (event masuk berhenti hingga aplikasi dibuka/dibawa ke depan). Solusi sederhana adalah **menyentuh Messages setiap 5 menit** menggunakan AppleScript + LaunchAgent.

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

    Ini berjalan **setiap 300 detik** dan **saat login**. Jalankan pertama mungkin memicu prompt **Automation** macOS (`osascript` → Messages). Setujui prompt tersebut dalam sesi pengguna yang sama yang menjalankan LaunchAgent.

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
    - Pengirim tidak dikenal menerima kode pairing; pesan diabaikan hingga disetujui (kode kedaluwarsa setelah 1 jam).
    - Setujui melalui:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Pairing adalah pertukaran token default. Detail: [Pairing](/id/channels/pairing)

  </Tab>
  <Tab title="Grup">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (default: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` mengontrol siapa yang dapat memicu di grup saat `allowlist` diatur.

  </Tab>
</Tabs>

### Pengayaan nama kontak (macOS, opsional)

Webhook grup BlueBubbles sering kali hanya menyertakan alamat peserta mentah. Jika Anda ingin konteks `GroupMembers` menampilkan nama kontak lokal, Anda dapat mengaktifkan pengayaan Contacts lokal di macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` mengaktifkan pencarian. Default: `false`.
- Pencarian hanya berjalan setelah akses grup, otorisasi perintah, dan mention gating mengizinkan pesan lewat.
- Hanya peserta telepon tanpa nama yang diperkaya.
- Nomor telepon mentah tetap menjadi fallback ketika tidak ada kecocokan lokal yang ditemukan.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention gating (grup)

BlueBubbles mendukung mention gating untuk chat grup, sesuai perilaku iMessage/WhatsApp:

- Menggunakan `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`) untuk mendeteksi mention.
- Ketika `requireMention` diaktifkan untuk sebuah grup, agent hanya merespons saat disebut.
- Perintah kontrol dari pengirim berwenang melewati mention gating.

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

### Command gating

- Perintah kontrol (misalnya, `/config`, `/model`) memerlukan otorisasi.
- Menggunakan `allowFrom` dan `groupAllowFrom` untuk menentukan otorisasi perintah.
- Pengirim berwenang dapat menjalankan perintah kontrol bahkan tanpa mention di grup.

### System prompt per grup

Setiap entri di bawah `channels.bluebubbles.groups.*` menerima string `systemPrompt` opsional. Nilai tersebut disuntikkan ke system prompt agent pada setiap turn yang menangani pesan di grup tersebut, sehingga Anda dapat menetapkan persona atau aturan perilaku per grup tanpa mengedit prompt agent:

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

Kunci cocok dengan apa pun yang dilaporkan BlueBubbles sebagai `chatGuid` / `chatIdentifier` / `chatId` numerik untuk grup tersebut, dan entri wildcard `"*"` menyediakan default untuk setiap grup tanpa kecocokan persis (pola yang sama digunakan oleh `requireMention` dan kebijakan tool per grup). Kecocokan persis selalu menang atas wildcard. DM mengabaikan field ini; gunakan kustomisasi prompt tingkat agent atau tingkat akun sebagai gantinya.

#### Contoh lengkap: balasan berutas dan reaksi tapback (Private API)

Dengan BlueBubbles Private API diaktifkan, pesan masuk tiba dengan ID pesan pendek (misalnya `[[reply_to:5]]`) dan agent dapat memanggil `action=reply` untuk membuat thread ke pesan tertentu atau `action=react` untuk mengirim tapback. `systemPrompt` per grup adalah cara yang andal agar agent memilih tool yang tepat:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
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

Binding persisten terkonfigurasi juga didukung melalui entri `bindings[]` tingkat atas dengan `type: "acp"` dan `match.channel: "bluebubbles"`.

`match.peer.id` dapat menggunakan bentuk target BlueBubbles apa pun yang didukung:

- handle DM ternormalisasi seperti `+15555550123` atau `user@example.com`
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

Lihat [Agen ACP](/id/tools/acp-agents) untuk perilaku binding ACP bersama.

## Pengetikan + tanda terima dibaca

- **Indikator pengetikan**: Dikirim otomatis sebelum dan selama pembuatan respons.
- **Tanda terima dibaca**: Dikontrol oleh `channels.bluebubbles.sendReadReceipts` (default: `true`).
- **Indikator pengetikan**: OpenClaw mengirim peristiwa mulai mengetik; BlueBubbles menghapus status mengetik secara otomatis saat pesan dikirim atau waktu habis (penghentian manual lewat DELETE tidak andal).

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

BlueBubbles mendukung tindakan pesan lanjutan saat diaktifkan dalam config:

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
    - **react**: Tambahkan/hapus reaksi tapback (`messageId`, `emoji`, `remove`). Set tapback native iMessage adalah `love`, `like`, `dislike`, `laugh`, `emphasize`, dan `question`. Saat agen memilih emoji di luar set itu (misalnya `👀`), alat reaksi akan fallback ke `love` agar tapback tetap dirender alih-alih menggagalkan seluruh permintaan. Reaksi ack yang dikonfigurasi tetap divalidasi secara ketat dan menghasilkan error pada nilai yang tidak dikenal.
    - **edit**: Edit pesan yang sudah dikirim (`messageId`, `text`).
    - **unsend**: Batalkan pengiriman pesan (`messageId`).
    - **reply**: Balas pesan tertentu (`messageId`, `text`, `to`).
    - **sendWithEffect**: Kirim dengan efek iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Ganti nama chat grup (`chatGuid`, `displayName`).
    - **setGroupIcon**: Tetapkan ikon/foto chat grup (`chatGuid`, `media`) - tidak stabil di macOS 26 Tahoe (API dapat mengembalikan sukses tetapi ikon tidak disinkronkan).
    - **addParticipant**: Tambahkan seseorang ke grup (`chatGuid`, `address`).
    - **removeParticipant**: Hapus seseorang dari grup (`chatGuid`, `address`).
    - **leaveGroup**: Keluar dari chat grup (`chatGuid`).
    - **upload-file**: Kirim media/file (`to`, `buffer`, `filename`, `asVoice`).
      - Memo suara: tetapkan `asVoice: true` dengan audio **MP3** atau **CAF** untuk mengirim sebagai pesan suara iMessage. BlueBubbles mengonversi MP3 → CAF saat mengirim memo suara.
    - Alias lama: `sendAttachment` masih berfungsi, tetapi `upload-file` adalah nama tindakan kanonis.

  </Accordion>
</AccordionGroup>

### ID pesan (pendek vs lengkap)

OpenClaw dapat menampilkan ID pesan _pendek_ (misalnya, `1`, `2`) untuk menghemat token.

- `MessageSid` / `ReplyToId` dapat berupa ID pendek.
- `MessageSidFull` / `ReplyToIdFull` berisi ID lengkap provider.
- ID pendek berada dalam memori; ID tersebut dapat kedaluwarsa saat restart atau eviksi cache.
- Tindakan menerima `messageId` pendek atau lengkap, tetapi ID pendek akan error jika sudah tidak tersedia.

Gunakan ID lengkap untuk otomatisasi dan penyimpanan yang tahan lama:

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Konteks: `MessageSidFull` / `ReplyToIdFull` dalam payload masuk

Lihat [Konfigurasi](/id/gateway/configuration) untuk variabel template.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Menggabungkan DM split-send (perintah + URL dalam satu komposisi)

Saat pengguna mengetik perintah dan URL bersama di iMessage - misalnya `Dump https://example.com/article` - Apple membagi pengiriman menjadi **dua pengiriman webhook terpisah**:

1. Pesan teks (`"Dump"`).
2. Balon pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Kedua webhook tiba di OpenClaw dengan jeda ~0,8-2,0 dtk pada sebagian besar setup. Tanpa penggabungan, agen menerima perintah saja pada giliran 1, membalas (sering kali "kirimkan URL-nya"), dan baru melihat URL pada giliran 2 - ketika konteks perintah sudah hilang.

`channels.bluebubbles.coalesceSameSenderDms` memilih DM untuk menggabungkan webhook berurutan dari pengirim yang sama ke dalam satu giliran agen. Chat grup tetap dikunci per pesan sehingga struktur giliran multi-pengguna dipertahankan.

<Tabs>
  <Tab title="Kapan mengaktifkan">
    Aktifkan saat:

    - Anda mengirim Skills yang mengharapkan `command + payload` dalam satu pesan (dump, paste, save, queue, dll.).
    - Pengguna Anda menempelkan URL, gambar, atau konten panjang bersama perintah.
    - Anda dapat menerima latensi giliran DM tambahan (lihat di bawah).

    Biarkan nonaktif saat:

    - Anda memerlukan latensi perintah minimum untuk pemicu DM satu kata.
    - Semua alur Anda adalah perintah sekali jalan tanpa tindak lanjut payload.

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

    Dengan flag aktif dan tanpa `messages.inbound.byChannel.bluebubbles` eksplisit, jendela debounce melebar menjadi **2500 md** (default untuk non-penggabungan adalah 500 md). Jendela yang lebih lebar diperlukan - irama split-send Apple sebesar 0,8-2,0 dtk tidak muat dalam default yang lebih sempit.

    Untuk menyesuaikan jendela sendiri:

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
    - **Latensi tambahan untuk perintah kontrol DM.** Dengan flag aktif, pesan perintah kontrol DM (seperti `Dump`, `Save`, dll.) kini menunggu hingga jendela debounce sebelum didispatch, untuk berjaga-jaga jika webhook payload akan datang. Perintah chat grup tetap didispatch instan.
    - **Output gabungan dibatasi** - teks gabungan dibatasi 4000 karakter dengan penanda `…[truncated]` eksplisit; lampiran dibatasi 20; entri sumber dibatasi 10 (pertama-plus-terbaru dipertahankan setelah itu). Setiap `messageId` sumber tetap mencapai dedupe masuk sehingga replay MessagePoller berikutnya dari peristiwa individual apa pun dikenali sebagai duplikat.
    - **Opt-in, per-channel.** Channel lain (Telegram, WhatsApp, Slack, …) tidak terpengaruh.

  </Tab>
</Tabs>

### Skenario dan apa yang dilihat agen

| Pengguna menyusun                                                 | Apple mengirim            | Flag nonaktif (default)                          | Flag aktif + jendela 2500 md                                           |
| ----------------------------------------------------------------- | ------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `Dump https://example.com` (satu pengiriman)                      | 2 webhook berjarak ~1 dtk | Dua giliran agen: "Dump" saja, lalu URL          | Satu giliran: teks gabungan `Dump https://example.com`                 |
| `Save this 📎image.jpg caption` (lampiran + teks)                 | 2 webhook                 | Dua giliran                                      | Satu giliran: teks + gambar                                            |
| `/status` (perintah mandiri)                                      | 1 webhook                 | Dispatch instan                                  | **Tunggu hingga jendela, lalu dispatch**                               |
| URL ditempel sendiri                                              | 1 webhook                 | Dispatch instan                                  | Dispatch instan (hanya satu entri dalam bucket)                        |
| Teks + URL dikirim sebagai dua pesan terpisah yang disengaja, berselang menit | 2 webhook di luar jendela | Dua giliran                                      | Dua giliran (jendela kedaluwarsa di antara keduanya)                   |
| Flood cepat (>10 DM kecil di dalam jendela)                       | N webhook                 | N giliran                                        | Satu giliran, output dibatasi (pertama + terbaru, batas teks/lampiran diterapkan) |

### Pemecahan masalah penggabungan split-send

Jika flag aktif dan split-send masih tiba sebagai dua giliran, periksa tiap lapisan:

<AccordionGroup>
  <Accordion title="Config benar-benar dimuat">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Lalu `openclaw gateway restart` - flag dibaca saat pembuatan debouncer-registry.

  </Accordion>
  <Accordion title="Jendela debounce cukup lebar untuk setup Anda">
    Lihat log server BlueBubbles di `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Ukur jarak antara dispatch teks bergaya `"Dump"` dan dispatch `"https://..."; Attachments:` yang mengikutinya. Naikkan `messages.inbound.byChannel.bluebubbles` agar cukup nyaman menutup celah tersebut.

  </Accordion>
  <Accordion title="Timestamp JSONL sesi ≠ kedatangan webhook">
    Timestamp peristiwa sesi (`~/.openclaw/agents/<id>/sessions/*.jsonl`) mencerminkan kapan gateway menyerahkan pesan ke agen, **bukan** kapan webhook tiba. Pesan kedua yang diantrekan dengan tag `[Queued messages while agent was busy]` berarti giliran pertama masih berjalan saat webhook kedua tiba - bucket penggabungan sudah di-flush. Sesuaikan jendela berdasarkan log server BB, bukan log sesi.
  </Accordion>
  <Accordion title="Tekanan memori memperlambat dispatch balasan">
    Pada mesin yang lebih kecil (8 GB), giliran agen dapat memakan waktu cukup lama sehingga bucket penggabungan di-flush sebelum balasan selesai, dan URL masuk sebagai giliran kedua yang diantrekan. Periksa `memory_pressure` dan `ps -o rss -p $(pgrep openclaw-gateway)`; jika gateway melebihi ~500 MB RSS dan kompresor aktif, tutup proses berat lainnya atau pindah ke host yang lebih besar.
  </Accordion>
  <Accordion title="Pengiriman kutipan balasan adalah jalur berbeda">
    Jika pengguna mengetuk `Dump` sebagai **balasan** ke balon URL yang sudah ada (iMessage menampilkan badge "1 Reply" pada balon Dump), URL berada di `replyToBody`, bukan di webhook kedua. Penggabungan tidak berlaku - itu urusan skill/prompt, bukan urusan debouncer.
  </Accordion>
</AccordionGroup>

## Streaming blok

Kontrol apakah respons dikirim sebagai satu pesan atau distream dalam blok:

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

- Lampiran masuk diunduh dan disimpan di cache media.
- Batas media melalui `channels.bluebubbles.mediaMaxMb` untuk media masuk dan keluar (default: 8 MB).
- Teks keluar dipecah menjadi chunk ke `channels.bluebubbles.textChunkLimit` (default: 4000 karakter).

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: Aktifkan/nonaktifkan channel.
    - `channels.bluebubbles.serverUrl`: URL dasar REST API BlueBubbles.
    - `channels.bluebubbles.password`: Kata sandi API.
    - `channels.bluebubbles.webhookPath`: Path endpoint Webhook (default: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (default: `pairing`).
    - `channels.bluebubbles.allowFrom`: Allowlist DM (handle, email, nomor E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (default: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Allowlist pengirim grup.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Di macOS, secara opsional perkaya peserta grup tanpa nama dari Kontak lokal setelah gating lolos. Default: `false`.
    - `channels.bluebubbles.groups`: Konfigurasi per grup (`requireMention`, dll.).

  </Accordion>
  <Accordion title="Delivery and chunking">
    - `channels.bluebubbles.sendReadReceipts`: Kirim tanda terima dibaca (default: `true`).
    - `channels.bluebubbles.blockStreaming`: Aktifkan streaming blok (default: `false`; diperlukan untuk balasan streaming).
    - `channels.bluebubbles.textChunkLimit`: Ukuran chunk keluar dalam karakter (default: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Timeout per permintaan dalam ms untuk pengiriman teks keluar melalui `/api/v1/message/text` (default: 30000). Naikkan pada setup macOS 26 tempat pengiriman Private API iMessage dapat macet selama 60+ detik di dalam framework iMessage; misalnya `45000` atau `60000`. Probe, pencarian chat, reaksi, edit, dan pemeriksaan kesehatan saat ini tetap memakai default 10 detik yang lebih pendek; perluasan cakupan ke reaksi dan edit direncanakan sebagai tindak lanjut. Override per akun: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (default) hanya memecah saat melebihi `textChunkLimit`; `newline` memecah pada baris kosong (batas paragraf) sebelum chunking berdasarkan panjang.

  </Accordion>
  <Accordion title="Media and history">
    - `channels.bluebubbles.mediaMaxMb`: Batas media masuk/keluar dalam MB (default: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Allowlist eksplisit direktori lokal absolut yang diizinkan untuk path media lokal keluar. Pengiriman path lokal ditolak secara default kecuali ini dikonfigurasi. Override per akun: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Gabungkan Webhook DM berurutan dari pengirim yang sama menjadi satu giliran agen sehingga split-send teks+URL Apple tiba sebagai satu pesan (default: `false`). Lihat [Menggabungkan DM split-send](#coalescing-split-send-dms-command--url-in-one-composition) untuk skenario, penyetelan window, dan trade-off. Memperlebar window debounce masuk default dari 500 ms menjadi 2500 ms saat diaktifkan tanpa `messages.inbound.byChannel.bluebubbles` eksplisit.
    - `channels.bluebubbles.historyLimit`: Jumlah maksimum pesan grup untuk konteks (0 menonaktifkan).
    - `channels.bluebubbles.dmHistoryLimit`: Batas riwayat DM.
    - `channels.bluebubbles.replyContextApiFallback`: Saat balasan masuk tiba tanpa `replyToBody`/`replyToSender` dan cache konteks balasan dalam memori meleset, ambil pesan asli dari HTTP API BlueBubbles sebagai fallback best-effort (default: `false`). Berguna untuk deployment multi-instance yang berbagi satu akun BlueBubbles, setelah proses dimulai ulang, atau setelah penggusuran cache TTL/LRU berumur panjang. Pengambilan dilindungi SSRF oleh kebijakan yang sama seperti setiap permintaan klien BlueBubbles lainnya, tidak pernah melempar error, dan mengisi cache sehingga balasan berikutnya teramortisasi. Override per akun: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Pengaturan tingkat channel dipropagasikan ke akun yang menghilangkan flag tersebut.

  </Accordion>
  <Accordion title="Actions and accounts">
    - `channels.bluebubbles.actions`: Aktifkan/nonaktifkan tindakan tertentu.
    - `channels.bluebubbles.accounts`: Konfigurasi multi-akun.

  </Accordion>
</AccordionGroup>

Opsi global terkait:

- `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Pengalamatan / target pengiriman

Utamakan `chat_guid` untuk perutean yang stabil:

- `chat_guid:iMessage;-;+15555550123` (diutamakan untuk grup)
- `chat_id:123`
- `chat_identifier:...`
- Handle langsung: `+15555550123`, `user@example.com`
  - Jika handle langsung tidak memiliki chat DM yang sudah ada, OpenClaw akan membuatnya melalui `POST /api/v1/chat/new`. Ini memerlukan BlueBubbles Private API diaktifkan.

### Perutean iMessage vs SMS

Saat handle yang sama memiliki chat iMessage dan SMS di Mac (misalnya nomor telepon yang terdaftar di iMessage tetapi juga pernah menerima fallback gelembung hijau), OpenClaw mengutamakan chat iMessage dan tidak pernah diam-diam menurunkan ke SMS. Untuk memaksa chat SMS, gunakan prefiks target `sms:` eksplisit (misalnya `sms:+15555550123`). Handle tanpa chat iMessage yang cocok tetap dikirim melalui chat apa pun yang dilaporkan BlueBubbles.

## Keamanan

- Permintaan Webhook diautentikasi dengan membandingkan parameter query atau header `guid`/`password` terhadap `channels.bluebubbles.password`.
- Jaga kata sandi API dan endpoint Webhook tetap rahasia (perlakukan seperti kredensial).
- Tidak ada bypass localhost untuk autentikasi Webhook BlueBubbles. Jika Anda mem-proxy traffic Webhook, pertahankan kata sandi BlueBubbles pada permintaan dari ujung ke ujung. `gateway.trustedProxies` tidak menggantikan `channels.bluebubbles.password` di sini. Lihat [Keamanan Gateway](/id/gateway/security#reverse-proxy-configuration).
- Aktifkan aturan HTTPS + firewall pada server BlueBubbles jika mengeksposnya di luar LAN Anda.

## Pemecahan masalah

- Jika event mengetik/dibaca berhenti berfungsi, periksa log Webhook BlueBubbles dan verifikasi path Gateway cocok dengan `channels.bluebubbles.webhookPath`.
- Kode pairing kedaluwarsa setelah satu jam; gunakan `openclaw pairing list bluebubbles` dan `openclaw pairing approve bluebubbles <code>`.
- Reaksi memerlukan private API BlueBubbles (`POST /api/v1/message/react`); pastikan versi server mengeksposnya.
- Edit/unsend memerlukan macOS 13+ dan versi server BlueBubbles yang kompatibel. Di macOS 26 (Tahoe), edit saat ini rusak karena perubahan private API.
- Pembaruan ikon grup bisa tidak stabil di macOS 26 (Tahoe): API dapat mengembalikan sukses tetapi ikon baru tidak disinkronkan.
- OpenClaw otomatis menyembunyikan tindakan yang diketahui rusak berdasarkan versi macOS server BlueBubbles. Jika edit masih muncul di macOS 26 (Tahoe), nonaktifkan secara manual dengan `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` diaktifkan tetapi split-send (mis. `Dump` + URL) masih tiba sebagai dua giliran: lihat checklist [pemecahan masalah penggabungan split-send](#split-send-coalescing-troubleshooting) - penyebab umum adalah window debounce terlalu ketat, timestamp log sesi disalahartikan sebagai kedatangan Webhook, atau pengiriman kutipan balasan (yang menggunakan `replyToBody`, bukan Webhook kedua).
- Untuk info status/kesehatan: `openclaw status --all` atau `openclaw status --deep`.

Untuk referensi alur kerja channel umum, lihat [Channel](/id/channels) dan panduan [Plugins](/id/tools/plugin).

## Terkait

- [Perutean Channel](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Ikhtisar Channel](/id/channels) - semua channel yang didukung
- [Grup](/id/channels/groups) - perilaku chat grup dan gating mention
- [Pairing](/id/channels/pairing) - autentikasi DM dan alur pairing
- [Keamanan](/id/gateway/security) - model akses dan hardening
