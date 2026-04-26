---
read_when:
    - Mengerjakan fitur Telegram atau Webhook
summary: Status dukungan, kemampuan, dan konfigurasi bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-26T11:24:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7d269b15bc2d377fa45f0516e435517ed366c0216d0bc31fe4f4bc080a6c726
    source_path: channels/telegram.md
    workflow: 15
---

Siap produksi untuk DM bot dan grup melalui grammY. Mode default adalah long polling; mode Webhook bersifat opsional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk Telegram adalah pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas channel dan playbook perbaikan.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi channel lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Buat token bot di BotFather">
    Buka Telegram dan chat dengan **@BotFather** (pastikan handle-nya tepat `@BotFather`).

    Jalankan `/newbot`, ikuti prompt, dan simpan tokennya.

  </Step>

  <Step title="Konfigurasikan token dan kebijakan DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Fallback env: `TELEGRAM_BOT_TOKEN=...` (hanya akun default).
    Telegram **tidak** menggunakan `openclaw channels login telegram`; konfigurasikan token di config/env, lalu jalankan gateway.

  </Step>

  <Step title="Jalankan gateway dan setujui DM pertama">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kode pairing kedaluwarsa setelah 1 jam.

  </Step>

  <Step title="Tambahkan bot ke grup">
    Tambahkan bot ke grup Anda, lalu atur `channels.telegram.groups` dan `groupPolicy` agar sesuai dengan model akses Anda.
  </Step>
</Steps>

<Note>
Urutan resolusi token sadar akun. Dalam praktiknya, nilai config mengalahkan fallback env, dan `TELEGRAM_BOT_TOKEN` hanya berlaku untuk akun default.
</Note>

## Pengaturan di sisi Telegram

<AccordionGroup>
  <Accordion title="Mode privasi dan visibilitas grup">
    Bot Telegram secara default menggunakan **Privacy Mode**, yang membatasi pesan grup yang mereka terima.

    Jika bot harus dapat melihat semua pesan grup, lakukan salah satu:

    - nonaktifkan privacy mode melalui `/setprivacy`, atau
    - jadikan bot sebagai admin grup.

    Saat mengubah privacy mode, keluarkan lalu tambahkan kembali bot di setiap grup agar Telegram menerapkan perubahan tersebut.

  </Accordion>

  <Accordion title="Izin grup">
    Status admin dikendalikan di pengaturan grup Telegram.

    Bot admin menerima semua pesan grup, yang berguna untuk perilaku grup yang selalu aktif.

  </Accordion>

  <Accordion title="Toggle BotFather yang berguna">

    - `/setjoingroups` untuk mengizinkan/menolak penambahan ke grup
    - `/setprivacy` untuk perilaku visibilitas grup

  </Accordion>
</AccordionGroup>

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.telegram.dmPolicy` mengendalikan akses pesan langsung:

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu ID pengirim di `allowFrom`)
    - `open` (memerlukan `allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` menerima ID pengguna Telegram numerik. Prefix `telegram:` / `tg:` diterima dan dinormalisasi.
    `dmPolicy: "allowlist"` dengan `allowFrom` kosong memblokir semua DM dan ditolak oleh validasi config.
    Setup hanya meminta ID pengguna numerik.
    Jika Anda melakukan upgrade dan config Anda berisi entri allowlist `@username`, jalankan `openclaw doctor --fix` untuk me-resolve-nya (best-effort; memerlukan token bot Telegram).
    Jika Anda sebelumnya mengandalkan file allowlist pairing-store, `openclaw doctor --fix` dapat memulihkan entri ke `channels.telegram.allowFrom` dalam alur allowlist (misalnya saat `dmPolicy: "allowlist"` belum memiliki ID eksplisit).

    Untuk bot satu owner, pilih `dmPolicy: "allowlist"` dengan ID `allowFrom` numerik yang eksplisit agar kebijakan akses tetap tahan lama di config (alih-alih bergantung pada persetujuan pairing sebelumnya).

    Kebingungan yang umum: persetujuan pairing DM tidak berarti "pengirim ini diotorisasi di mana-mana".
    Pairing hanya memberikan akses DM. Otorisasi pengirim grup tetap berasal dari allowlist config yang eksplisit.
    Jika Anda ingin "saya diotorisasi sekali dan DM serta perintah grup sama-sama berfungsi", masukkan ID pengguna Telegram numerik Anda ke `channels.telegram.allowFrom`.

    ### Menemukan ID pengguna Telegram Anda

    Lebih aman (tanpa bot pihak ketiga):

    1. Kirim DM ke bot Anda.
    2. Jalankan `openclaw logs --follow`.
    3. Baca `from.id`.

    Metode resmi Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metode pihak ketiga (kurang privat): `@userinfobot` atau `@getidsbot`.

  </Tab>

  <Tab title="Kebijakan grup dan allowlist">
    Dua kontrol berlaku bersama:

    1. **Grup mana yang diizinkan** (`channels.telegram.groups`)
       - tidak ada config `groups`:
         - dengan `groupPolicy: "open"`: grup apa pun dapat lolos pemeriksaan group-ID
         - dengan `groupPolicy: "allowlist"` (default): grup diblokir sampai Anda menambahkan entri `groups` (atau `"*"`)
       - `groups` dikonfigurasi: bertindak sebagai allowlist (ID eksplisit atau `"*"`)

    2. **Pengirim mana yang diizinkan di grup** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` digunakan untuk pemfilteran pengirim grup. Jika tidak diatur, Telegram akan fallback ke `allowFrom`.
    Entri `groupAllowFrom` harus berupa ID pengguna Telegram numerik (prefix `telegram:` / `tg:` dinormalisasi).
    Jangan menaruh ID chat grup atau supergrup Telegram di `groupAllowFrom`. ID chat negatif harus ditempatkan di bawah `channels.telegram.groups`.
    Entri non-numerik diabaikan untuk otorisasi pengirim.
    Batas keamanan (`2026.2.25+`): auth pengirim grup **tidak** mewarisi persetujuan pairing-store DM.
    Pairing tetap hanya untuk DM. Untuk grup, atur `groupAllowFrom` atau `allowFrom` per-grup/per-topik.
    Jika `groupAllowFrom` tidak diatur, Telegram fallback ke config `allowFrom`, bukan pairing store.
    Pola praktis untuk bot satu owner: atur ID pengguna Anda di `channels.telegram.allowFrom`, biarkan `groupAllowFrom` tidak diatur, dan izinkan grup target di bawah `channels.telegram.groups`.
    Catatan runtime: jika `channels.telegram` benar-benar tidak ada, runtime default ke `groupPolicy="allowlist"` fail-closed kecuali `channels.defaults.groupPolicy` diatur secara eksplisit.

    Contoh: izinkan anggota mana pun di satu grup tertentu:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Contoh: izinkan hanya pengguna tertentu di dalam satu grup tertentu:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Kesalahan umum: `groupAllowFrom` bukan allowlist grup Telegram.

      - Tempatkan ID chat grup atau supergrup Telegram negatif seperti `-1001234567890` di bawah `channels.telegram.groups`.
      - Tempatkan ID pengguna Telegram seperti `8734062810` di bawah `groupAllowFrom` saat Anda ingin membatasi siapa di dalam grup yang diizinkan dapat memicu bot.
      - Gunakan `groupAllowFrom: ["*"]` hanya saat Anda ingin anggota mana pun dari grup yang diizinkan dapat berbicara dengan bot.
    </Warning>

  </Tab>

  <Tab title="Perilaku mention">
    Balasan grup memerlukan mention secara default.

    Mention dapat berasal dari:

    - mention native `@botusername`, atau
    - pola mention di:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Toggle perintah tingkat sesi:

    - `/activation always`
    - `/activation mention`

    Ini hanya memperbarui status sesi. Gunakan config untuk persistensi.

    Contoh config persisten:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Mendapatkan ID chat grup:

    - teruskan pesan grup ke `@userinfobot` / `@getidsbot`
    - atau baca `chat.id` dari `openclaw logs --follow`
    - atau periksa Bot API `getUpdates`

  </Tab>
</Tabs>

## Perilaku runtime

- Telegram dimiliki oleh proses gateway.
- Routing bersifat deterministik: pesan masuk Telegram dibalas kembali ke Telegram (model tidak memilih channel).
- Pesan masuk dinormalisasi ke shared channel envelope dengan metadata balasan dan placeholder media.
- Sesi grup diisolasi berdasarkan ID grup. Topik forum menambahkan `:topic:<threadId>` untuk menjaga isolasi antar topik.
- Pesan DM dapat membawa `message_thread_id`; OpenClaw merutekannya dengan kunci sesi yang sadar thread dan mempertahankan thread ID untuk balasan.
- Long polling menggunakan grammY runner dengan pengurutan per-chat/per-thread. Konkruensi sink runner keseluruhan menggunakan `agents.defaults.maxConcurrent`.
- Long polling dijaga di dalam setiap proses gateway sehingga hanya satu poller aktif yang dapat menggunakan satu token bot pada satu waktu. Jika Anda masih melihat konflik `getUpdates` 409, kemungkinan gateway OpenClaw lain, skrip, atau poller eksternal sedang menggunakan token yang sama.
- Restart watchdog long-polling dipicu setelah 120 detik tanpa liveness `getUpdates` yang selesai secara default. Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya jika deployment Anda masih melihat restart polling-stall palsu selama pekerjaan yang berjalan lama. Nilainya dalam milidetik dan diizinkan dari `30000` hingga `600000`; override per-akun didukung.
- Telegram Bot API tidak mendukung read-receipt (`sendReadReceipts` tidak berlaku).

## Referensi fitur

<AccordionGroup>
  <Accordion title="Pratinjau stream langsung (edit pesan)">
    OpenClaw dapat men-stream balasan parsial secara real time:

    - chat langsung: pesan pratinjau + `editMessageText`
    - grup/topik: pesan pratinjau + `editMessageText`

    Persyaratan:

    - `channels.telegram.streaming` adalah `off | partial | block | progress` (default: `partial`)
    - `progress` dipetakan ke `partial` di Telegram (kompatibel dengan penamaan lintas channel)
    - `streaming.preview.toolProgress` mengendalikan apakah pembaruan tool/progress menggunakan kembali pesan pratinjau yang sama yang diedit (default: `true` saat preview streaming aktif)
    - nilai boolean `channels.telegram.streamMode` dan `streaming` lama terdeteksi; jalankan `openclaw doctor --fix` untuk memigrasikannya ke `channels.telegram.streaming.mode`

    Pembaruan pratinjau tool-progress adalah baris pendek "Working..." yang ditampilkan saat tool berjalan, misalnya eksekusi perintah, pembacaan file, pembaruan perencanaan, atau ringkasan patch. Telegram tetap mengaktifkannya secara default agar sesuai dengan perilaku OpenClaw yang telah dirilis sejak `v2026.4.22` dan seterusnya. Untuk mempertahankan pratinjau yang diedit untuk teks jawaban tetapi menyembunyikan baris tool-progress, atur:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Gunakan `streaming.mode: "off"` hanya jika Anda ingin menonaktifkan edit pratinjau Telegram sepenuhnya. Gunakan `streaming.preview.toolProgress: false` jika Anda hanya ingin menonaktifkan baris status tool-progress.

    Untuk balasan hanya teks:

    - DM: OpenClaw mempertahankan pesan pratinjau yang sama dan melakukan edit final di tempat (tanpa pesan kedua)
    - grup/topik: OpenClaw mempertahankan pesan pratinjau yang sama dan melakukan edit final di tempat (tanpa pesan kedua)

    Untuk balasan kompleks (misalnya payload media), OpenClaw fallback ke pengiriman final normal lalu membersihkan pesan pratinjau.

    Preview streaming terpisah dari block streaming. Saat block streaming diaktifkan secara eksplisit untuk Telegram, OpenClaw melewati preview stream untuk menghindari streaming ganda.

    Jika transport draft native tidak tersedia/ditolak, OpenClaw secara otomatis fallback ke `sendMessage` + `editMessageText`.

    Stream reasoning khusus Telegram:

    - `/reasoning stream` mengirim reasoning ke pratinjau langsung saat menghasilkan
    - jawaban final dikirim tanpa teks reasoning

  </Accordion>

  <Accordion title="Pemformatan dan fallback HTML">
    Teks keluar menggunakan Telegram `parse_mode: "HTML"`.

    - Teks bergaya Markdown dirender menjadi HTML aman untuk Telegram.
    - HTML mentah dari model di-escape untuk mengurangi kegagalan parse Telegram.
    - Jika Telegram menolak HTML yang sudah diparse, OpenClaw mencoba ulang sebagai teks biasa.

    Pratinjau tautan diaktifkan secara default dan dapat dinonaktifkan dengan `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Perintah native dan perintah kustom">
    Pendaftaran menu perintah Telegram ditangani saat startup dengan `setMyCommands`.

    Default perintah native:

    - `commands.native: "auto"` mengaktifkan perintah native untuk Telegram

    Tambahkan entri menu perintah kustom:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Cadangan Git" },
        { command: "generate", description: "Buat gambar" },
      ],
    },
  },
}
```

    Aturan:

    - nama dinormalisasi (hapus awalan `/`, huruf kecil)
    - pola valid: `a-z`, `0-9`, `_`, panjang `1..32`
    - perintah kustom tidak dapat menimpa perintah native
    - konflik/duplikat dilewati dan dicatat di log

    Catatan:

    - perintah kustom hanyalah entri menu; mereka tidak otomatis mengimplementasikan perilaku
    - perintah Plugin/Skills tetap dapat berfungsi saat diketik meskipun tidak ditampilkan di menu Telegram

    Jika perintah native dinonaktifkan, perintah bawaan dihapus. Perintah kustom/Plugin mungkin tetap terdaftar jika dikonfigurasi.

    Kegagalan penyiapan yang umum:

    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu Telegram masih melampaui batas setelah dipangkas; kurangi perintah Plugin/Skills/kustom atau nonaktifkan `channels.telegram.commands.native`.
    - `setMyCommands failed` dengan kesalahan network/fetch biasanya berarti DNS/HTTPS keluar ke `api.telegram.org` diblokir.

    ### Perintah pairing perangkat (Plugin `device-pair`)

    Saat Plugin `device-pair` terpasang:

    1. `/pair` menghasilkan kode penyiapan
    2. tempel kode di aplikasi iOS
    3. `/pair pending` mencantumkan permintaan yang tertunda (termasuk role/scope)
    4. setujui permintaan:
       - `/pair approve <requestId>` untuk persetujuan eksplisit
       - `/pair approve` saat hanya ada satu permintaan tertunda
       - `/pair approve latest` untuk yang paling baru

    Kode penyiapan membawa token bootstrap berumur pendek. Handoff bootstrap bawaan menjaga token node utama pada `scopes: []`; token operator yang di-handoff tetap dibatasi ke `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`. Pemeriksaan scope bootstrap diawali dengan prefix role, sehingga allowlist operator itu hanya memenuhi permintaan operator; role non-operator tetap memerlukan scope di bawah prefix role mereka sendiri.

    Jika perangkat mencoba lagi dengan detail auth yang berubah (misalnya role/scope/public key), permintaan tertunda sebelumnya digantikan dan permintaan baru menggunakan `requestId` yang berbeda. Jalankan kembali `/pair pending` sebelum menyetujui.

    Detail lebih lanjut: [Pairing](/id/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Tombol inline">
    Konfigurasikan cakupan keyboard inline:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Override per akun:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Cakupan:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (default)

    `capabilities: ["inlineButtons"]` lama dipetakan ke `inlineButtons: "all"`.

    Contoh aksi pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Pilih opsi:",
  buttons: [
    [
      { text: "Ya", callback_data: "yes" },
      { text: "Tidak", callback_data: "no" },
    ],
    [{ text: "Batal", callback_data: "cancel" }],
  ],
}
```

    Klik callback diteruskan ke agen sebagai teks:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Aksi pesan Telegram untuk agen dan otomatisasi">
    Aksi tool Telegram meliputi:

    - `sendMessage` (`to`, `content`, opsional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opsional `iconColor`, `iconCustomEmojiId`)

    Aksi pesan channel mengekspos alias ergonomis (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrol gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (default: disabled)

    Catatan: `edit` dan `topic-create` saat ini diaktifkan secara default dan tidak memiliki toggle `channels.telegram.actions.*` terpisah.
    Pengiriman runtime menggunakan snapshot config/secret aktif (startup/reload), sehingga jalur aksi tidak melakukan SecretRef re-resolution ad hoc per pengiriman.

    Semantik penghapusan reaction: [/tools/reactions](/id/tools/reactions)

  </Accordion>

  <Accordion title="Tag threading balasan">
    Telegram mendukung tag threading balasan eksplisit dalam output yang dihasilkan:

    - `[[reply_to_current]]` membalas pesan yang memicu
    - `[[reply_to:<id>]]` membalas ID pesan Telegram tertentu

    `channels.telegram.replyToMode` mengendalikan penanganan:

    - `off` (default)
    - `first`
    - `all`

    Saat threading balasan diaktifkan dan teks atau caption Telegram asli tersedia, OpenClaw secara otomatis menyertakan kutipan native Telegram. Telegram membatasi teks kutipan native hingga 1024 unit kode UTF-16, sehingga pesan yang lebih panjang dikutip dari awal dan fallback ke balasan biasa jika Telegram menolak kutipan tersebut.

    Catatan: `off` menonaktifkan threading balasan implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.

  </Accordion>

  <Accordion title="Topik forum dan perilaku thread">
    Supergrup forum:

    - key sesi topik menambahkan `:topic:<threadId>`
    - balasan dan typing menargetkan thread topik
    - path config topik:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Kasus khusus topik umum (`threadId=1`):

    - pengiriman pesan menghilangkan `message_thread_id` (Telegram menolak `sendMessage(...thread_id=1)`)
    - aksi typing tetap menyertakan `message_thread_id`

    Inheritance topik: entri topik mewarisi pengaturan grup kecuali dioverride (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
`agentId` hanya untuk topik dan tidak mewarisi dari default grup.

**Routing agen per topik**: Setiap topik dapat dirutekan ke agen yang berbeda dengan menetapkan `agentId` dalam config topik. Ini memberi setiap topik workspace, memori, dan sesi terisolasinya sendiri. Contoh:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          topics: {
            "1": { agentId: "main" },      // Topik umum → agen utama
            "3": { agentId: "zu" },        // Topik dev → agen zu
            "5": { agentId: "coder" }      // Tinjauan kode → agen coder
          }
        }
      }
    }
  }
}
```

Setiap topik kemudian memiliki key sesinya sendiri: `agent:zu:telegram:group:-1001234567890:topic:3`

**Binding topik ACP persisten**: Topik forum dapat menyematkan sesi harness ACP melalui binding ACP bertipe tingkat atas (`bindings[]` dengan `type: "acp"` dan `match.channel: "telegram"`, `peer.kind: "group"`, serta id berkualifikasi topik seperti `-1001234567890:topic:42`). Saat ini dibatasi untuk topik forum di grup/supergrup. Lihat [ACP Agents](/id/tools/acp-agents).

**Spawn ACP terikat thread dari chat**: `/acp spawn <agent> --thread here|auto` mengikat topik saat ini ke sesi ACP baru; tindak lanjut dirutekan langsung ke sana. OpenClaw menyematkan konfirmasi spawn di dalam topik. Memerlukan `channels.telegram.threadBindings.spawnAcpSessions=true`.

Konteks template mengekspos `MessageThreadId` dan `IsForum`. Chat DM dengan `message_thread_id` tetap mempertahankan routing DM tetapi menggunakan key sesi yang sadar thread.

  </Accordion>

  <Accordion title="Audio, video, dan stiker">
    ### Pesan audio

    Telegram membedakan voice note dan file audio.

    - default: perilaku file audio
    - tag `[[audio_as_voice]]` dalam balasan agen untuk memaksa pengiriman sebagai voice note
    - transkrip voice note masuk dibingkai sebagai teks tidak tepercaya yang dihasilkan mesin dalam konteks agen; deteksi mention tetap menggunakan transkrip mentah sehingga pesan suara dengan gating mention tetap berfungsi.

    Contoh aksi pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Pesan video

    Telegram membedakan file video dan video note.

    Contoh aksi pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Video note tidak mendukung caption; teks pesan yang diberikan dikirim secara terpisah.

    ### Stiker

    Penanganan stiker masuk:

    - WEBP statis: diunduh dan diproses (placeholder `<media:sticker>`)
    - TGS animasi: dilewati
    - WEBM video: dilewati

    Field konteks stiker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    File cache stiker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stiker dideskripsikan satu kali (jika memungkinkan) dan di-cache untuk mengurangi panggilan vision berulang.

    Aktifkan aksi stiker:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Aksi kirim stiker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Cari stiker yang di-cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "kucing melambai",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifikasi reaction">
    Reaction Telegram datang sebagai update `message_reaction` (terpisah dari payload pesan).

    Saat diaktifkan, OpenClaw memasukkan peristiwa sistem seperti:

    - `Telegram reaction ditambahkan: 👍 oleh Alice (@alice) pada msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    Catatan:

    - `own` berarti reaction pengguna hanya pada pesan yang dikirim bot (best-effort melalui cache pesan terkirim).
    - Peristiwa reaction tetap menghormati kontrol akses Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); pengirim yang tidak diotorisasi akan dibuang.
    - Telegram tidak menyediakan ID thread dalam update reaction.
      - grup non-forum dirutekan ke sesi chat grup
      - grup forum dirutekan ke sesi grup topik umum (`:topic:1`), bukan topik asal yang tepat

    `allowed_updates` untuk polling/Webhook otomatis menyertakan `message_reaction`.

  </Accordion>

  <Accordion title="Reaction ack">
    `ackReaction` mengirim emoji pengakuan saat OpenClaw sedang memproses pesan masuk.

    Urutan resolusi:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada `"👀"`)

    Catatan:

    - Telegram mengharapkan emoji unicode (misalnya `"👀"`).
    - Gunakan `""` untuk menonaktifkan reaction pada channel atau akun.

  </Accordion>

  <Accordion title="Penulisan config dari peristiwa dan perintah Telegram">
    Penulisan config channel diaktifkan secara default (`configWrites !== false`).

    Penulisan yang dipicu Telegram meliputi:

    - peristiwa migrasi grup (`migrate_to_chat_id`) untuk memperbarui `channels.telegram.groups`
    - `/config set` dan `/config unset` (memerlukan pengaktifan perintah)

    Nonaktifkan:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling vs Webhook">
    Default-nya adalah long polling. Untuk mode Webhook, atur `channels.telegram.webhookUrl` dan `channels.telegram.webhookSecret`; opsional `webhookPath`, `webhookHost`, `webhookPort` (default `/telegram-webhook`, `127.0.0.1`, `8787`).

    Listener lokal bind ke `127.0.0.1:8787`. Untuk ingress publik, gunakan reverse proxy di depan port lokal atau atur `webhookHost: "0.0.0.0"` secara sengaja.

    Mode Webhook memvalidasi guard permintaan, secret token Telegram, dan body JSON sebelum mengembalikan `200` ke Telegram.
    OpenClaw kemudian memproses update tersebut secara asinkron melalui lane bot per-chat/per-topik yang sama seperti pada long polling, sehingga giliran agen yang lambat tidak menahan ACK pengiriman Telegram.

  </Accordion>

  <Accordion title="Batas, retry, dan target CLI">
    - default `channels.telegram.textChunkLimit` adalah 4000.
    - `channels.telegram.chunkMode="newline"` mengutamakan batas paragraf (baris kosong) sebelum pemisahan berdasarkan panjang.
    - `channels.telegram.mediaMaxMb` (default 100) membatasi ukuran media Telegram masuk dan keluar.
    - `channels.telegram.timeoutSeconds` mengoverride timeout klien API Telegram (jika tidak diatur, default grammY berlaku).
    - `channels.telegram.pollingStallThresholdMs` default ke `120000`; sesuaikan antara `30000` dan `600000` hanya untuk restart polling-stall false-positive.
    - riwayat konteks grup menggunakan `channels.telegram.historyLimit` atau `messages.groupChat.historyLimit` (default 50); `0` menonaktifkan.
    - konteks tambahan balasan/kutipan/forward saat ini diteruskan sebagaimana diterima.
    - allowlist Telegram terutama mengatur siapa yang dapat memicu agen, bukan batas redaksi penuh untuk konteks tambahan.
    - kontrol riwayat DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` berlaku untuk helper pengiriman Telegram (CLI/tool/aksi) untuk kesalahan API keluar yang dapat dipulihkan.

    Target pengiriman CLI dapat berupa chat ID numerik atau username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram poll menggunakan `openclaw message poll` dan mendukung topik forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag poll khusus Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` untuk topik forum (atau gunakan target `:topic:`)

    Pengiriman Telegram juga mendukung:

    - `--presentation` dengan blok `buttons` untuk keyboard inline saat `channels.telegram.capabilities.inlineButtons` mengizinkannya
    - `--pin` atau `--delivery '{"pin":true}'` untuk meminta pengiriman yang disematkan saat bot dapat menyematkan di chat tersebut
    - `--force-document` untuk mengirim gambar dan GIF keluar sebagai dokumen alih-alih unggahan foto terkompresi atau media animasi

    Gating aksi:

    - `channels.telegram.actions.sendMessage=false` menonaktifkan pesan Telegram keluar, termasuk poll
    - `channels.telegram.actions.poll=false` menonaktifkan pembuatan poll Telegram sambil tetap membiarkan pengiriman biasa aktif

  </Accordion>

  <Accordion title="Persetujuan exec di Telegram">
    Telegram mendukung persetujuan exec di DM approver dan secara opsional dapat memposting prompt di chat atau topik asal. Approver harus berupa ID pengguna Telegram numerik.

    Path config:

    - `channels.telegram.execApprovals.enabled` (aktif otomatis saat setidaknya satu approver dapat di-resolve)
    - `channels.telegram.execApprovals.approvers` (fallback ke ID owner numerik dari `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (default) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Pengiriman channel menampilkan teks perintah di chat; aktifkan `channel` atau `both` hanya di grup/topik tepercaya. Saat prompt masuk ke topik forum, OpenClaw mempertahankan topik tersebut untuk prompt persetujuan dan tindak lanjutnya. Persetujuan exec kedaluwarsa setelah 30 menit secara default.

    Tombol persetujuan inline juga memerlukan `channels.telegram.capabilities.inlineButtons` agar mengizinkan surface target (`dm`, `group`, atau `all`). ID persetujuan dengan prefix `plugin:` di-resolve melalui persetujuan Plugin; yang lainnya di-resolve melalui persetujuan exec terlebih dahulu.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrol balasan error

Saat agen mengalami kesalahan pengiriman atau provider, Telegram dapat membalas dengan teks error atau menekannya. Dua key config mengendalikan perilaku ini:

| Key                                 | Nilai             | Default | Deskripsi                                                                                       |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` mengirim pesan error yang ramah ke chat. `silent` menekan balasan error sepenuhnya.     |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Waktu minimum antar balasan error ke chat yang sama. Mencegah spam error selama outage.         |

Override per-akun, per-grup, dan per-topik didukung (inheritance yang sama seperti key config Telegram lainnya).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // tekan error di grup ini
        },
      },
    },
  },
}
```

## Troubleshooting

<AccordionGroup>
  <Accordion title="Bot tidak merespons pesan grup tanpa mention">

    - Jika `requireMention=false`, mode privasi Telegram harus mengizinkan visibilitas penuh.
      - BotFather: `/setprivacy` -> Disable
      - lalu keluarkan + tambahkan kembali bot ke grup
    - `openclaw channels status` memberi peringatan saat config mengharapkan pesan grup tanpa mention.
    - `openclaw channels status --probe` dapat memeriksa group ID numerik eksplisit; wildcard `"*"` tidak dapat diperiksa keanggotaannya.
    - uji sesi cepat: `/activation always`.

  </Accordion>

  <Accordion title="Bot sama sekali tidak melihat pesan grup">

    - saat `channels.telegram.groups` ada, grup harus tercantum (atau menyertakan `"*"`)
    - verifikasi keanggotaan bot di grup
    - tinjau log: `openclaw logs --follow` untuk alasan dilewati

  </Accordion>

  <Accordion title="Perintah hanya berfungsi sebagian atau tidak sama sekali">

    - otorisasi identitas pengirim Anda (pairing dan/atau `allowFrom` numerik)
    - otorisasi perintah tetap berlaku meskipun kebijakan grup adalah `open`
    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu native memiliki terlalu banyak entri; kurangi perintah Plugin/Skills/kustom atau nonaktifkan menu native
    - `setMyCommands failed` dengan kesalahan network/fetch biasanya menunjukkan masalah jangkauan DNS/HTTPS ke `api.telegram.org`

  </Accordion>

  <Accordion title="Polling atau ketidakstabilan jaringan">

    - Node 22+ + fetch/proxy kustom dapat memicu perilaku abort langsung jika tipe AbortSignal tidak cocok.
    - Beberapa host me-resolve `api.telegram.org` ke IPv6 terlebih dahulu; egress IPv6 yang rusak dapat menyebabkan kegagalan API Telegram yang intermiten.
    - Jika log menyertakan `TypeError: fetch failed` atau `Network request for 'getUpdates' failed!`, OpenClaw sekarang mencoba ulang ini sebagai kesalahan jaringan yang dapat dipulihkan.
    - Jika log menyertakan `Polling stall detected`, OpenClaw me-restart polling dan membangun ulang transport Telegram setelah 120 detik tanpa liveness long-poll yang selesai secara default.
    - Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya ketika panggilan `getUpdates` yang berjalan lama tetap sehat tetapi host Anda masih melaporkan restart polling-stall false-positive. Stall yang persisten biasanya menunjukkan masalah proxy, DNS, IPv6, atau TLS egress antara host dan `api.telegram.org`.
    - Pada host VPS dengan egress/TLS langsung yang tidak stabil, rute panggilan API Telegram melalui `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ default ke `autoSelectFamily=true` (kecuali WSL2) dan `dnsResultOrder=ipv4first`.
    - Jika host Anda adalah WSL2 atau secara eksplisit bekerja lebih baik dengan perilaku hanya-IPv4, paksa pemilihan family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Jawaban rentang benchmark RFC 2544 (`198.18.0.0/15`) sudah diizinkan
      untuk unduhan media Telegram secara default. Jika fake-IP atau
      proxy transparan tepercaya menulis ulang `api.telegram.org` ke
      alamat privat/internal/special-use lain selama unduhan media, Anda dapat memilih
      bypass khusus Telegram ini:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Opt-in yang sama tersedia per akun di
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jika proxy Anda me-resolve host media Telegram menjadi `198.18.x.x`, biarkan
      flag berbahaya tetap nonaktif terlebih dahulu. Media Telegram sudah mengizinkan rentang benchmark RFC 2544 secara default.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` melemahkan perlindungan SSRF media Telegram. Gunakan hanya untuk lingkungan proxy tepercaya yang dikendalikan operator
      seperti routing fake-IP Clash, Mihomo, atau Surge ketika mereka
      mensintesis jawaban privat atau special-use di luar rentang benchmark RFC 2544. Biarkan nonaktif untuk akses Telegram internet publik normal.
    </Warning>

    - Override env (sementara):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Validasi jawaban DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Bantuan lebih lanjut: [Channel troubleshooting](/id/channels/troubleshooting).

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Telegram](/id/gateway/config-channels#telegram).

<Accordion title="Field Telegram dengan sinyal tinggi">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` harus menunjuk ke file biasa; symlink ditolak)
- kontrol akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` tingkat atas (`type: "acp"`)
- persetujuan exec: `execApprovals`, `accounts.*.execApprovals`
- perintah/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/balasan: `replyToMode`
- streaming: `streaming` (pratinjau), `streaming.preview.toolProgress`, `blockStreaming`
- pemformatan/pengiriman: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/jaringan: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- aksi/kapabilitas: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction: `reactionNotifications`, `reactionLevel`
- error: `errorPolicy`, `errorCooldownMs`
- penulisan/riwayat: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Prioritas multi-akun: ketika dua atau lebih ID akun dikonfigurasi, atur `channels.telegram.defaultAccount` (atau sertakan `channels.telegram.accounts.default`) agar routing default eksplisit. Jika tidak, OpenClaw fallback ke ID akun ternormalisasi pertama dan `openclaw doctor` akan memberi peringatan. Akun bernama mewarisi `channels.telegram.allowFrom` / `groupAllowFrom`, tetapi tidak mewarisi nilai `accounts.default.*`.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pair pengguna Telegram ke gateway.
  </Card>
  <Card title="Groups" icon="users" href="/id/channels/groups">
    Perilaku allowlist grup dan topik.
  </Card>
  <Card title="Channel routing" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Security" icon="shield" href="/id/gateway/security">
    Model ancaman dan hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan grup dan topik ke agen.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas channel.
  </Card>
</CardGroup>
