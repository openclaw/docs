---
read_when:
    - Menyiapkan kanal BlueBubbles
    - Memecahkan masalah pairing Webhook
    - Mengonfigurasi iMessage di macOS
sidebarTitle: BlueBubbles
summary: iMessage melalui server macOS BlueBubbles (REST kirim/terima, mengetik, reaksi, pairing, tindakan lanjutan).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:23:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

Status: Plugin bawaan yang berkomunikasi dengan server macOS BlueBubbles melalui HTTP. **Direkomendasikan untuk integrasi iMessage** karena API-nya lebih kaya dan penyiapannya lebih mudah dibandingkan kanal imsg lama.

<Note>
Rilis OpenClaw saat ini menyertakan BlueBubbles, jadi build paket normal tidak memerlukan langkah `openclaw plugins install` terpisah.
</Note>

## Ringkasan

- Berjalan di macOS melalui aplikasi pembantu BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Direkomendasikan/diuji: macOS Sequoia (15). macOS Tahoe (26) berfungsi; edit saat ini rusak di Tahoe, dan pembaruan ikon grup mungkin melaporkan berhasil tetapi tidak tersinkron.
- OpenClaw berkomunikasi dengannya melalui REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Pesan masuk tiba melalui webhook; balasan keluar, indikator mengetik, tanda baca, dan tapback adalah panggilan REST.
- Lampiran dan stiker diserap sebagai media masuk (dan ditampilkan ke agen jika memungkinkan).
- Balasan TTS otomatis yang menyintesis audio MP3 atau CAF dikirim sebagai gelembung memo suara iMessage, bukan sebagai lampiran file biasa.
- Pairing/allowlist bekerja dengan cara yang sama seperti kanal lain (`/channels/pairing` dan sebagainya) dengan `channels.bluebubbles.allowFrom` + kode pairing.
- Reaksi ditampilkan sebagai peristiwa sistem seperti di Slack/Telegram sehingga agen dapat "menyebut" reaksi tersebut sebelum membalas.
- Fitur lanjutan: edit, batalkan kirim, utas balasan, efek pesan, manajemen grup.

## Mulai cepat

<Steps>
  <Step title="Instal BlueBubbles">
    Instal server BlueBubbles di Mac Anda (ikuti petunjuk di [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Aktifkan web API">
    Di konfigurasi BlueBubbles, aktifkan web API dan tetapkan kata sandi.
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
    Mulai gateway; gateway akan mendaftarkan penangan webhook dan memulai pairing.
  </Step>
</Steps>

<Warning>
**Keamanan**

- Selalu tetapkan kata sandi webhook.
- Autentikasi webhook selalu wajib. OpenClaw menolak permintaan webhook BlueBubbles kecuali menyertakan password/guid yang cocok dengan `channels.bluebubbles.password` (misalnya `?password=<password>` atau `x-password`), terlepas dari topologi loopback/proxy.
- Autentikasi kata sandi diperiksa sebelum membaca/mengurai seluruh isi webhook.
</Warning>

## Menjaga Messages.app tetap aktif (penyiapan VM / headless)

Beberapa penyiapan macOS VM / selalu aktif dapat berakhir dengan Messages.app menjadi "idle" (peristiwa masuk berhenti sampai aplikasi dibuka/dibawa ke foreground). Solusi sederhana adalah **menyentuh Messages setiap 5 menit** menggunakan AppleScript + LaunchAgent.

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

    Ini berjalan **setiap 300 detik** dan **saat login**. Proses pertama mungkin memicu prompt macOS **Automation** (`osascript` → Messages). Setujui prompt tersebut di sesi pengguna yang sama yang menjalankan LaunchAgent.

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

Wizard akan meminta:

<ParamField path="Server URL" type="string" required>
  Alamat server BlueBubbles (misalnya, `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Kata sandi API dari pengaturan BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Jalur endpoint webhook.
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
  <Tab title="DMs">
    - Default: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Pengirim yang tidak dikenal menerima kode pairing; pesan diabaikan sampai disetujui (kode kedaluwarsa setelah 1 jam).
    - Setujui melalui:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Pairing adalah pertukaran token default. Detail: [Pairing](/id/channels/pairing)
  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (default: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` mengontrol siapa yang dapat memicu di grup saat `allowlist` disetel.
  </Tab>
</Tabs>

### Pengayaan nama kontak (macOS, opsional)

Webhook grup BlueBubbles sering kali hanya menyertakan alamat peserta mentah. Jika Anda ingin konteks `GroupMembers` menampilkan nama kontak lokal sebagai gantinya, Anda dapat ikut serta dalam pengayaan Contacts lokal di macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` mengaktifkan lookup. Default: `false`.
- Lookup hanya berjalan setelah akses grup, otorisasi perintah, dan penyaringan mention telah mengizinkan pesan tersebut.
- Hanya peserta telepon yang tidak bernama yang diperkaya.
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

### Penyaringan mention (grup)

BlueBubbles mendukung penyaringan mention untuk chat grup, sesuai dengan perilaku iMessage/WhatsApp:

- Menggunakan `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`) untuk mendeteksi mention.
- Saat `requireMention` diaktifkan untuk grup, agen hanya merespons saat disebut.
- Perintah kontrol dari pengirim yang berwenang melewati penyaringan mention.

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

### Penyaringan perintah

- Perintah kontrol (misalnya, `/config`, `/model`) memerlukan otorisasi.
- Menggunakan `allowFrom` dan `groupAllowFrom` untuk menentukan otorisasi perintah.
- Pengirim yang berwenang dapat menjalankan perintah kontrol bahkan tanpa mention di grup.

### System prompt per grup

Setiap entri di bawah `channels.bluebubbles.groups.*` menerima string `systemPrompt` opsional. Nilai ini disuntikkan ke system prompt agen pada setiap giliran yang menangani pesan di grup tersebut, sehingga Anda dapat menetapkan persona atau aturan perilaku per grup tanpa mengedit prompt agen:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Buat respons di bawah 3 kalimat. Cerminkan nada santai grup.",
        },
      },
    },
  },
}
```

Kunci tersebut cocok dengan apa pun yang dilaporkan BlueBubbles sebagai `chatGuid` / `chatIdentifier` / `chatId` numerik untuk grup, dan entri wildcard `"*"` menyediakan default untuk setiap grup tanpa kecocokan persis (pola yang sama digunakan oleh `requireMention` dan kebijakan alat per grup). Kecocokan persis selalu lebih diutamakan daripada wildcard. DM mengabaikan kolom ini; gunakan penyesuaian prompt tingkat agen atau tingkat akun sebagai gantinya.

#### Contoh kerja: balasan berutas dan reaksi tapback (Private API)

Dengan BlueBubbles Private API diaktifkan, pesan masuk tiba dengan ID pesan pendek (misalnya `[[reply_to:5]]`) dan agen dapat memanggil `action=reply` untuk membuat utas ke pesan tertentu atau `action=react` untuk menambahkan tapback. `systemPrompt` per grup adalah cara yang andal untuk memastikan agen memilih alat yang tepat:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Saat membalas di grup ini, selalu panggil action=reply dengan",
            "messageId [[reply_to:N]] dari konteks agar respons Anda berutas",
            "di bawah pesan pemicu. Jangan pernah mengirim pesan baru yang tidak tertaut.",
            "",
            "Untuk pengakuan singkat ('ok', 'mengerti', 'sedang dikerjakan'), gunakan",
            "action=react dengan emoji tapback yang sesuai (❤️, 👍, 😂, ‼️, ❓)",
            "alih-alih mengirim balasan teks.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reaksi tapback dan balasan berutas sama-sama memerlukan BlueBubbles Private API; lihat [Advanced actions](#advanced-actions) dan [Message IDs](#message-ids-short-vs-full) untuk mekanisme dasarnya.

## Binding percakapan ACP

Chat BlueBubbles dapat diubah menjadi ruang kerja ACP yang tahan lama tanpa mengubah lapisan transport.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan BlueBubbles yang sama akan diarahkan ke sesi ACP yang dibuat.
- `/new` dan `/reset` akan mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Binding persisten yang dikonfigurasi juga didukung melalui entri tingkat atas `bindings[]` dengan `type: "acp"` dan `match.channel: "bluebubbles"`.

`match.peer.id` dapat menggunakan bentuk target BlueBubbles yang didukung:

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

Lihat [ACP Agents](/id/tools/acp-agents) untuk perilaku binding ACP bersama.

## Mengetik + tanda baca

- **Indikator mengetik**: Dikirim secara otomatis sebelum dan selama pembuatan respons.
- **Tanda baca**: Dikendalikan oleh `channels.bluebubbles.sendReadReceipts` (default: `true`).
- **Indikator mengetik**: OpenClaw mengirim peristiwa mulai mengetik; BlueBubbles menghapus status mengetik secara otomatis saat pengiriman atau timeout (penghentian manual via DELETE tidak andal).

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

BlueBubbles mendukung tindakan pesan lanjutan saat diaktifkan dalam konfigurasi:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback (default: true)
        edit: true, // edit pesan terkirim (macOS 13+, rusak di macOS 26 Tahoe)
        unsend: true, // batalkan kirim pesan (macOS 13+)
        reply: true, // balasan berutas berdasarkan GUID pesan
        sendWithEffect: true, // efek pesan (slam, loud, dll.)
        renameGroup: true, // ganti nama chat grup
        setGroupIcon: true, // tetapkan ikon/foto chat grup (tidak stabil di macOS 26 Tahoe)
        addParticipant: true, // tambahkan peserta ke grup
        removeParticipant: true, // hapus peserta dari grup
        leaveGroup: true, // tinggalkan chat grup
        sendAttachment: true, // kirim lampiran/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Tindakan yang tersedia">
    - **react**: Tambahkan/hapus reaksi tapback (`messageId`, `emoji`, `remove`). Kumpulan tapback bawaan iMessage adalah `love`, `like`, `dislike`, `laugh`, `emphasize`, dan `question`. Saat agen memilih emoji di luar kumpulan itu (misalnya `👀`), alat reaksi akan fallback ke `love` agar tapback tetap dirender alih-alih membuat seluruh permintaan gagal. Reaksi ack yang dikonfigurasi tetap divalidasi secara ketat dan akan error pada nilai yang tidak dikenal.
    - **edit**: Edit pesan terkirim (`messageId`, `text`).
    - **unsend**: Batalkan kirim pesan (`messageId`).
    - **reply**: Balas pesan tertentu (`messageId`, `text`, `to`).
    - **sendWithEffect**: Kirim dengan efek iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Ganti nama chat grup (`chatGuid`, `displayName`).
    - **setGroupIcon**: Tetapkan ikon/foto chat grup (`chatGuid`, `media`) — tidak stabil di macOS 26 Tahoe (API dapat mengembalikan sukses tetapi ikon tidak tersinkron).
    - **addParticipant**: Tambahkan seseorang ke grup (`chatGuid`, `address`).
    - **removeParticipant**: Hapus seseorang dari grup (`chatGuid`, `address`).
    - **leaveGroup**: Tinggalkan chat grup (`chatGuid`).
    - **upload-file**: Kirim media/file (`to`, `buffer`, `filename`, `asVoice`).
      - Memo suara: setel `asVoice: true` dengan audio **MP3** atau **CAF** untuk mengirim sebagai pesan suara iMessage. BlueBubbles mengonversi MP3 → CAF saat mengirim memo suara.
    - Alias lama: `sendAttachment` masih berfungsi, tetapi `upload-file` adalah nama tindakan kanonis.
  </Accordion>
</AccordionGroup>

### ID pesan (pendek vs penuh)

OpenClaw dapat menampilkan ID pesan _pendek_ (misalnya, `1`, `2`) untuk menghemat token.

- `MessageSid` / `ReplyToId` dapat berupa ID pendek.
- `MessageSidFull` / `ReplyToIdFull` berisi ID penuh dari provider.
- ID pendek berada di memori; ID ini dapat kedaluwarsa saat restart atau pengosongan cache.
- Tindakan menerima `messageId` pendek atau penuh, tetapi ID pendek akan menghasilkan error jika sudah tidak tersedia.

Gunakan ID penuh untuk automasi dan penyimpanan yang tahan lama:

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Konteks: `MessageSidFull` / `ReplyToIdFull` dalam payload masuk

Lihat [Configuration](/id/gateway/configuration) untuk variabel template.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Menggabungkan DM split-send (perintah + URL dalam satu komposisi)

Saat pengguna mengetik perintah dan URL bersama di iMessage — misalnya `Dump https://example.com/article` — Apple membagi pengiriman menjadi **dua pengiriman webhook terpisah**:

1. Pesan teks (`"Dump"`).
2. Balon pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Kedua webhook tiba di OpenClaw dengan jeda ~0,8-2,0 dtk pada sebagian besar penyiapan. Tanpa penggabungan, agen menerima perintah saja pada giliran 1, membalas (sering kali "kirim URL-nya"), dan baru melihat URL pada giliran 2 — saat konteks perintah sudah hilang.

`channels.bluebubbles.coalesceSameSenderDms` mengikutsertakan DM untuk menggabungkan webhook berurutan dari pengirim yang sama menjadi satu giliran agen. Chat grup tetap dikunci per pesan sehingga struktur giliran multi-pengguna tetap terjaga.

<Tabs>
  <Tab title="Kapan harus diaktifkan">
    Aktifkan jika:

    - Anda mengirim Skills yang mengharapkan `perintah + payload` dalam satu pesan (dump, paste, save, queue, dll.).
    - Pengguna Anda menempelkan URL, gambar, atau konten panjang bersamaan dengan perintah.
    - Anda dapat menerima latensi giliran DM tambahan (lihat di bawah).

    Biarkan nonaktif jika:

    - Anda membutuhkan latensi perintah minimum untuk pemicu DM satu kata.
    - Semua alur Anda adalah perintah sekali jalan tanpa tindak lanjut payload.

  </Tab>
  <Tab title="Mengaktifkan">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // ikut serta (default: false)
        },
      },
    }
    ```

    Dengan flag aktif dan tanpa `messages.inbound.byChannel.bluebubbles` eksplisit, jendela debounce melebar menjadi **2500 md** (default untuk non-coalescing adalah 500 md). Jendela yang lebih lebar diperlukan — irama split-send Apple sebesar 0,8-2,0 dtk tidak muat dalam default yang lebih ketat.

    Untuk menyetel jendela sendiri:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 md bekerja untuk sebagian besar penyiapan; naikkan ke 4000 md jika Mac Anda lambat
            // atau berada di bawah tekanan memori (jeda yang teramati dapat memanjang melewati 2 dtk).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-off">
    - **Latensi tambahan untuk perintah kontrol DM.** Dengan flag aktif, pesan perintah kontrol DM (seperti `Dump`, `Save`, dll.) kini menunggu hingga jendela debounce sebelum dikirim, untuk berjaga-jaga jika webhook payload akan datang. Perintah chat grup tetap dikirim instan.
    - **Output gabungan dibatasi** — teks gabungan dibatasi hingga 4000 karakter dengan penanda `…[truncated]` yang eksplisit; lampiran dibatasi hingga 20; entri sumber dibatasi hingga 10 (entri pertama-plus-terbaru dipertahankan setelah itu). Setiap `messageId` sumber tetap mencapai inbound-dedupe sehingga replay MessagePoller berikutnya dari setiap peristiwa individual dikenali sebagai duplikat.
    - **Opt-in, per kanal.** Kanal lain (Telegram, WhatsApp, Slack, …) tidak terpengaruh.
  </Tab>
</Tabs>

### Skenario dan apa yang dilihat agen

| Yang disusun pengguna                                             | Yang dikirim Apple        | Flag mati (default)                      | Flag aktif + jendela 2500 md                                          |
| ----------------------------------------------------------------- | ------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| `Dump https://example.com` (satu pengiriman)                      | 2 webhook ~1 dtk terpisah | Dua giliran agen: "Dump" saja, lalu URL  | Satu giliran: teks gabungan `Dump https://example.com`                 |
| `Save this 📎image.jpg caption` (lampiran + teks)                 | 2 webhook                 | Dua giliran                              | Satu giliran: teks + gambar                                            |
| `/status` (perintah mandiri)                                      | 1 webhook                 | Pengiriman instan                        | **Tunggu hingga jendela, lalu kirim**                                  |
| URL ditempel sendiri                                              | 1 webhook                 | Pengiriman instan                        | Pengiriman instan (hanya satu entri dalam bucket)                      |
| Teks + URL dikirim sebagai dua pesan terpisah yang disengaja, menit terpisah | 2 webhook di luar jendela | Dua giliran                              | Dua giliran (jendela kedaluwarsa di antara keduanya)                   |
| Banjir cepat (>10 DM kecil dalam jendela)                         | N webhook                 | N giliran                                | Satu giliran, output dibatasi (pertama + terbaru, batas teks/lampiran diterapkan) |

### Pemecahan masalah penggabungan split-send

Jika flag aktif dan split-send masih tiba sebagai dua giliran, periksa setiap lapisan:

<AccordionGroup>
  <Accordion title="Konfigurasi benar-benar dimuat">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Lalu `openclaw gateway restart` — flag dibaca saat pembuatan registri debouncer.

  </Accordion>
  <Accordion title="Jendela debounce cukup lebar untuk penyiapan Anda">
    Lihat log server BlueBubbles di `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Ukur jeda antara pengiriman teks bergaya `"Dump"` dan pengiriman `"https://..."; Attachments:` yang mengikuti. Naikkan `messages.inbound.byChannel.bluebubbles` agar dengan nyaman mencakup jeda tersebut.

  </Accordion>
  <Accordion title="Stempel waktu JSONL sesi ≠ kedatangan webhook">
    Stempel waktu peristiwa sesi (`~/.openclaw/agents/<id>/sessions/*.jsonl`) mencerminkan kapan gateway menyerahkan pesan ke agen, **bukan** kapan webhook tiba. Pesan kedua yang antre dengan tag `[Queued messages while agent was busy]` berarti giliran pertama masih berjalan saat webhook kedua tiba — bucket coalesce sudah ter-flush. Setel jendela berdasarkan log server BB, bukan log sesi.
  </Accordion>
  <Accordion title="Tekanan memori memperlambat pengiriman balasan">
    Pada mesin yang lebih kecil (8 GB), giliran agen dapat berlangsung cukup lama sehingga bucket coalesce ter-flush sebelum balasan selesai, dan URL masuk sebagai giliran kedua yang mengantre. Periksa `memory_pressure` dan `ps -o rss -p $(pgrep openclaw-gateway)`; jika gateway berada di atas ~500 MB RSS dan compressor aktif, tutup proses berat lain atau naikkan ke host yang lebih besar.
  </Accordion>
  <Accordion title="Pengiriman kutipan-balasan adalah jalur yang berbeda">
    Jika pengguna mengetuk `Dump` sebagai **balasan** ke balon URL yang sudah ada (iMessage menampilkan lencana "1 Reply" pada balon Dump), URL berada di `replyToBody`, bukan di webhook kedua. Penggabungan tidak berlaku — ini masalah skill/prompt, bukan masalah debouncer.
  </Accordion>
</AccordionGroup>

## Streaming blok

Kontrol apakah respons dikirim sebagai satu pesan atau dialirkan dalam blok:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // aktifkan streaming blok (mati secara default)
    },
  },
}
```

## Media + batas

- Lampiran masuk diunduh dan disimpan dalam cache media.
- Batas media melalui `channels.bluebubbles.mediaMaxMb` untuk media masuk dan keluar (default: 8 MB).
- Teks keluar dipecah menjadi `channels.bluebubbles.textChunkLimit` (default: 4000 karakter).

## Referensi konfigurasi

Konfigurasi lengkap: [Configuration](/id/gateway/configuration)

<AccordionGroup>
  <Accordion title="Koneksi dan webhook">
    - `channels.bluebubbles.enabled`: Aktifkan/nonaktifkan kanal.
    - `channels.bluebubbles.serverUrl`: URL dasar REST API BlueBubbles.
    - `channels.bluebubbles.password`: Kata sandi API.
    - `channels.bluebubbles.webhookPath`: Jalur endpoint webhook (default: `/bluebubbles-webhook`).
  </Accordion>
  <Accordion title="Kebijakan akses">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (default: `pairing`).
    - `channels.bluebubbles.allowFrom`: allowlist DM (handle, email, nomor E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (default: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: allowlist pengirim grup.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Di macOS, secara opsional memperkaya peserta grup yang tidak bernama dari Contacts lokal setelah penyaringan lolos. Default: `false`.
    - `channels.bluebubbles.groups`: Konfigurasi per grup (`requireMention`, dll.).
  </Accordion>
  <Accordion title="Pengiriman dan pemecahan">
    - `channels.bluebubbles.sendReadReceipts`: Kirim tanda baca (default: `true`).
    - `channels.bluebubbles.blockStreaming`: Aktifkan streaming blok (default: `false`; diperlukan untuk balasan streaming).
    - `channels.bluebubbles.textChunkLimit`: Ukuran potongan keluar dalam karakter (default: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Timeout per permintaan dalam md untuk pengiriman teks keluar melalui `/api/v1/message/text` (default: 30000). Naikkan pada penyiapan macOS 26 saat pengiriman iMessage Private API dapat macet selama 60+ detik di dalam framework iMessage; misalnya `45000` atau `60000`. Probe, lookup chat, reaksi, edit, dan pemeriksaan kesehatan saat ini tetap memakai default 10 dtk yang lebih pendek; perluasan cakupan ke reaksi dan edit direncanakan sebagai tindak lanjut. Override per akun: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (default) hanya memecah saat melebihi `textChunkLimit`; `newline` memecah pada baris kosong (batas paragraf) sebelum pemecahan berdasarkan panjang.
  </Accordion>
  <Accordion title="Media dan riwayat">
    - `channels.bluebubbles.mediaMaxMb`: Batas media masuk/keluar dalam MB (default: 8).
    - `channels.bluebubbles.mediaLocalRoots`: allowlist eksplisit direktori lokal absolut yang diizinkan untuk jalur media lokal keluar. Pengiriman jalur lokal ditolak secara default kecuali ini dikonfigurasi. Override per akun: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Gabungkan webhook DM berurutan dari pengirim yang sama menjadi satu giliran agen agar split-send teks+URL Apple tiba sebagai satu pesan (default: `false`). Lihat [Menggabungkan DM split-send](#coalescing-split-send-dms-command--url-in-one-composition) untuk skenario, penyetelan jendela, dan trade-off. Melebarkan jendela debounce masuk default dari 500 md menjadi 2500 md saat diaktifkan tanpa `messages.inbound.byChannel.bluebubbles` eksplisit.
    - `channels.bluebubbles.historyLimit`: Maks pesan grup untuk konteks (0 menonaktifkan).
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

Pilih `chat_guid` untuk perutean yang stabil:

- `chat_guid:iMessage;-;+15555550123` (disarankan untuk grup)
- `chat_id:123`
- `chat_identifier:...`
- Handle langsung: `+15555550123`, `user@example.com`
  - Jika handle langsung tidak memiliki chat DM yang sudah ada, OpenClaw akan membuatnya melalui `POST /api/v1/chat/new`. Ini memerlukan BlueBubbles Private API diaktifkan.

### Perutean iMessage vs SMS

Saat handle yang sama memiliki chat iMessage dan SMS di Mac (misalnya nomor telepon yang terdaftar di iMessage tetapi juga telah menerima fallback gelembung hijau), OpenClaw akan memilih chat iMessage dan tidak pernah diam-diam menurunkan ke SMS. Untuk memaksa chat SMS, gunakan prefiks target `sms:` yang eksplisit (misalnya `sms:+15555550123`). Handle tanpa chat iMessage yang cocok tetap akan dikirim melalui chat apa pun yang dilaporkan BlueBubbles.

## Keamanan

- Permintaan webhook diautentikasi dengan membandingkan parameter query atau header `guid`/`password` terhadap `channels.bluebubbles.password`.
- Jaga kerahasiaan kata sandi API dan endpoint webhook (perlakukan seperti kredensial).
- Tidak ada bypass localhost untuk autentikasi webhook BlueBubbles. Jika Anda mem-proxy lalu lintas webhook, pertahankan kata sandi BlueBubbles pada permintaan secara ujung-ke-ujung. `gateway.trustedProxies` tidak menggantikan `channels.bluebubbles.password` di sini. Lihat [Gateway security](/id/gateway/security#reverse-proxy-configuration).
- Aktifkan HTTPS + aturan firewall pada server BlueBubbles jika mengeksposnya di luar LAN Anda.

## Pemecahan masalah

- Jika peristiwa mengetik/baca berhenti berfungsi, periksa log webhook BlueBubbles dan verifikasi bahwa jalur gateway cocok dengan `channels.bluebubbles.webhookPath`.
- Kode pairing kedaluwarsa setelah satu jam; gunakan `openclaw pairing list bluebubbles` dan `openclaw pairing approve bluebubbles <code>`.
- Reaksi memerlukan BlueBubbles Private API (`POST /api/v1/message/react`); pastikan versi server mengeksposnya.
- Edit/unsend memerlukan macOS 13+ dan versi server BlueBubbles yang kompatibel. Pada macOS 26 (Tahoe), edit saat ini rusak karena perubahan Private API.
- Pembaruan ikon grup dapat tidak stabil di macOS 26 (Tahoe): API mungkin mengembalikan sukses tetapi ikon baru tidak tersinkron.
- OpenClaw otomatis menyembunyikan tindakan yang diketahui rusak berdasarkan versi macOS server BlueBubbles. Jika edit masih muncul di macOS 26 (Tahoe), nonaktifkan secara manual dengan `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` diaktifkan tetapi split-send (misalnya `Dump` + URL) masih tiba sebagai dua giliran: lihat checklist [pemecahan masalah penggabungan split-send](#split-send-coalescing-troubleshooting) — penyebab umum adalah jendela debounce yang terlalu sempit, stempel waktu log sesi salah dibaca sebagai kedatangan webhook, atau pengiriman kutipan-balasan (yang menggunakan `replyToBody`, bukan webhook kedua).
- Untuk info status/kesehatan: `openclaw status --all` atau `openclaw status --deep`.

Untuk referensi alur kerja kanal umum, lihat [Channels](/id/channels) dan panduan [Plugins](/id/tools/plugin).

## Terkait

- [Channel Routing](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Channels Overview](/id/channels) — semua kanal yang didukung
- [Groups](/id/channels/groups) — perilaku chat grup dan penyaringan mention
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Security](/id/gateway/security) — model akses dan hardening
