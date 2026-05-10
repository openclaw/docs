---
read_when:
    - Mengerjakan fitur Telegram atau Webhook
summary: Status dukungan, kapabilitas, dan konfigurasi bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:23:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

Siap produksi untuk DM dan grup bot melalui grammY. Long polling adalah mode default; mode webhook bersifat opsional.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk Telegram adalah pemasangan.
  </Card>
  <Card title="Pemecahan masalah saluran" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas saluran dan playbook perbaikan.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi saluran lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Buat token bot di BotFather">
    Buka Telegram dan chat dengan **@BotFather** (pastikan handle persis `@BotFather`).

    Jalankan `/newbot`, ikuti prompt, dan simpan token.

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
    Telegram **tidak** menggunakan `openclaw channels login telegram`; konfigurasikan token di config/env, lalu mulai Gateway.

  </Step>

  <Step title="Mulai Gateway dan setujui DM pertama">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kode pemasangan kedaluwarsa setelah 1 jam.

  </Step>

  <Step title="Tambahkan bot ke grup">
    Tambahkan bot ke grup Anda, lalu atur `channels.telegram.groups` dan `groupPolicy` agar sesuai dengan model akses Anda.
  </Step>
</Steps>

<Note>
Urutan resolusi token memperhatikan akun. Dalam praktiknya, nilai config mengalahkan fallback env, dan `TELEGRAM_BOT_TOKEN` hanya berlaku untuk akun default.
</Note>

## Pengaturan sisi Telegram

<AccordionGroup>
  <Accordion title="Mode privasi dan visibilitas grup">
    Bot Telegram secara default menggunakan **Mode Privasi**, yang membatasi pesan grup yang diterimanya.

    Jika bot harus melihat semua pesan grup, salah satu:

    - nonaktifkan mode privasi melalui `/setprivacy`, atau
    - jadikan bot sebagai admin grup.

    Saat mengubah mode privasi, hapus + tambahkan ulang bot di setiap grup agar Telegram menerapkan perubahan.

  </Accordion>

  <Accordion title="Izin grup">
    Status admin dikontrol di pengaturan grup Telegram.

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
    `channels.telegram.dmPolicy` mengontrol akses pesan langsung:

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu ID pengirim di `allowFrom`)
    - `open` (memerlukan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `dmPolicy: "open"` dengan `allowFrom: ["*"]` memungkinkan akun Telegram mana pun yang menemukan atau menebak nama pengguna bot untuk memerintah bot. Gunakan hanya untuk bot publik yang memang disengaja dengan alat yang sangat dibatasi; bot satu pemilik sebaiknya menggunakan `allowlist` dengan ID pengguna numerik.

    `channels.telegram.allowFrom` menerima ID pengguna Telegram numerik. Prefiks `telegram:` / `tg:` diterima dan dinormalisasi.
    Dalam config multi-akun, `channels.telegram.allowFrom` tingkat atas yang restriktif diperlakukan sebagai batas keselamatan: entri tingkat akun `allowFrom: ["*"]` tidak membuat akun tersebut publik kecuali allowlist akun efektif masih berisi wildcard eksplisit setelah penggabungan.
    `dmPolicy: "allowlist"` dengan `allowFrom` kosong memblokir semua DM dan ditolak oleh validasi config.
    Penyiapan hanya meminta ID pengguna numerik.
    Jika Anda melakukan upgrade dan config Anda berisi entri allowlist `@username`, jalankan `openclaw doctor --fix` untuk menyelesaikannya (upaya terbaik; memerlukan token bot Telegram).
    Jika sebelumnya Anda mengandalkan file allowlist penyimpanan pemasangan, `openclaw doctor --fix` dapat memulihkan entri ke `channels.telegram.allowFrom` dalam alur allowlist (misalnya saat `dmPolicy: "allowlist"` belum memiliki ID eksplisit).

    Untuk bot satu pemilik, pilih `dmPolicy: "allowlist"` dengan ID `allowFrom` numerik eksplisit agar kebijakan akses tahan lama di config (bukan bergantung pada persetujuan pemasangan sebelumnya).

    Kebingungan umum: persetujuan pemasangan DM tidak berarti "pengirim ini diotorisasi di mana saja".
    Pemasangan memberikan akses DM. Jika belum ada pemilik perintah, pemasangan pertama yang disetujui juga menetapkan `commands.ownerAllowFrom` sehingga perintah khusus pemilik dan persetujuan exec memiliki akun operator eksplisit.
    Otorisasi pengirim grup tetap berasal dari allowlist config eksplisit.
    Jika Anda ingin "saya diotorisasi sekali dan DM maupun perintah grup berfungsi", masukkan ID pengguna Telegram numerik Anda di `channels.telegram.allowFrom`; untuk perintah khusus pemilik, pastikan `commands.ownerAllowFrom` berisi `telegram:<your user id>`.

    ### Menemukan ID pengguna Telegram Anda

    Lebih aman (tanpa bot pihak ketiga):

    1. DM bot Anda.
    2. Jalankan `openclaw logs --follow`.
    3. Baca `from.id`.

    Metode Bot API resmi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metode pihak ketiga (kurang privat): `@userinfobot` atau `@getidsbot`.

  </Tab>

  <Tab title="Kebijakan grup dan allowlist">
    Dua kontrol berlaku bersama:

    1. **Grup mana yang diizinkan** (`channels.telegram.groups`)
       - tidak ada config `groups`:
         - dengan `groupPolicy: "open"`: grup mana pun dapat lolos pemeriksaan ID grup
         - dengan `groupPolicy: "allowlist"` (default): grup diblokir sampai Anda menambahkan entri `groups` (atau `"*"`)
       - `groups` dikonfigurasi: bertindak sebagai allowlist (ID eksplisit atau `"*"`)

    2. **Pengirim mana yang diizinkan di grup** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` digunakan untuk pemfilteran pengirim grup. Jika tidak disetel, Telegram fallback ke `allowFrom`.
    Entri `groupAllowFrom` harus berupa ID pengguna Telegram numerik (prefiks `telegram:` / `tg:` dinormalisasi).
    Jangan masukkan ID chat grup atau supergrup Telegram di `groupAllowFrom`. ID chat negatif berada di bawah `channels.telegram.groups`.
    Entri non-numerik diabaikan untuk otorisasi pengirim.
    Batas keamanan (`2026.2.25+`): auth pengirim grup **tidak** mewarisi persetujuan penyimpanan pemasangan DM.
    Pemasangan tetap hanya untuk DM. Untuk grup, atur `groupAllowFrom` atau `allowFrom` per grup/per topik.
    Jika `groupAllowFrom` tidak disetel, Telegram fallback ke config `allowFrom`, bukan penyimpanan pemasangan.
    Pola praktis untuk bot satu pemilik: atur ID pengguna Anda di `channels.telegram.allowFrom`, biarkan `groupAllowFrom` tidak disetel, dan izinkan grup target di bawah `channels.telegram.groups`.
    Catatan runtime: jika `channels.telegram` sepenuhnya tidak ada, runtime default ke fail-closed `groupPolicy="allowlist"` kecuali `channels.defaults.groupPolicy` disetel secara eksplisit.

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

      - Masukkan ID chat grup atau supergrup Telegram negatif seperti `-1001234567890` di bawah `channels.telegram.groups`.
      - Masukkan ID pengguna Telegram seperti `8734062810` di bawah `groupAllowFrom` saat Anda ingin membatasi orang mana di dalam grup yang diizinkan dapat memicu bot.
      - Gunakan `groupAllowFrom: ["*"]` hanya saat Anda ingin anggota mana pun dari grup yang diizinkan dapat berbicara dengan bot.

    </Warning>

  </Tab>

  <Tab title="Perilaku mention">
    Balasan grup secara default memerlukan mention.

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
    - atau periksa `getUpdates` Bot API

  </Tab>
</Tabs>

## Perilaku runtime

- Telegram dimiliki oleh proses Gateway.
- Perutean bersifat deterministik: inbound Telegram dibalas kembali ke Telegram (model tidak memilih saluran).
- Pesan inbound dinormalisasi ke envelope saluran bersama dengan metadata balasan, placeholder media, dan konteks rantai balasan tersimpan untuk balasan Telegram yang telah diamati Gateway.
- Sesi grup diisolasi berdasarkan ID grup. Topik forum menambahkan `:topic:<threadId>` agar topik tetap terisolasi.
- Pesan DM dapat membawa `message_thread_id`; OpenClaw mempertahankan ID thread untuk balasan tetapi secara default menjaga DM pada sesi datar. Konfigurasikan `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true`, atau config topik yang cocok saat Anda memang menginginkan isolasi sesi topik DM.
- Long polling menggunakan runner grammY dengan pengurutan per chat/per thread. Konkurensi sink runner keseluruhan menggunakan `agents.defaults.maxConcurrent`.
- Long polling dijaga di dalam setiap proses Gateway sehingga hanya satu poller aktif yang dapat menggunakan token bot pada satu waktu. Jika Anda masih melihat konflik `getUpdates` 409, kemungkinan Gateway OpenClaw lain, skrip, atau poller eksternal menggunakan token yang sama.
- Restart watchdog long-polling dipicu setelah 120 detik tanpa liveness `getUpdates` selesai secara default. Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya jika deployment Anda masih melihat restart polling-stall palsu selama pekerjaan yang berjalan lama. Nilainya dalam milidetik dan diizinkan dari `30000` hingga `600000`; override per akun didukung.
- Telegram Bot API tidak memiliki dukungan tanda terima baca (`sendReadReceipts` tidak berlaku).

## Referensi fitur

<AccordionGroup>
  <Accordion title="Pratinjau live stream (edit pesan)">
    OpenClaw dapat melakukan streaming balasan parsial secara real time:

    - chat langsung: pesan pratinjau + `editMessageText`
    - grup/topik: pesan pratinjau + `editMessageText`

    Persyaratan:

    - `channels.telegram.streaming` adalah `off | partial | block | progress` (default: `partial`)
    - `progress` mempertahankan satu draf status yang dapat diedit untuk progres alat, menghapusnya saat selesai, dan mengirim jawaban akhir sebagai pesan normal
    - `streaming.preview.toolProgress` mengontrol apakah pembaruan alat/progres menggunakan ulang pesan pratinjau yang diedit yang sama (default: `true` saat streaming pratinjau aktif)
    - `streaming.preview.commandText` mengontrol detail perintah/exec di dalam baris progres alat tersebut: `raw` (default, mempertahankan perilaku yang dirilis) atau `status` (hanya label alat)
    - `channels.telegram.streamMode` lama dan nilai boolean `streaming` terdeteksi; jalankan `openclaw doctor --fix` untuk memigrasikannya ke `channels.telegram.streaming.mode`

    Pembaruan pratinjau progres alat adalah baris status pendek yang ditampilkan saat alat berjalan, misalnya eksekusi perintah, pembacaan file, pembaruan perencanaan, atau ringkasan patch. Telegram mengaktifkan ini secara default agar sesuai dengan perilaku OpenClaw yang dirilis dari `v2026.4.22` dan setelahnya. Untuk mempertahankan pratinjau yang diedit untuk teks jawaban tetapi menyembunyikan baris progres alat, atur:

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

    Untuk menjaga progres alat tetap terlihat tetapi menyembunyikan teks perintah/eksekusi, atur:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Gunakan mode `progress` saat Anda menginginkan progres alat yang terlihat tanpa mengedit jawaban akhir ke dalam pesan yang sama. Letakkan kebijakan teks perintah di bawah `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Gunakan `streaming.mode: "off"` hanya saat Anda menginginkan pengiriman hanya-final: edit pratinjau Telegram dinonaktifkan dan obrolan alat/progres generik ditekan, bukan dikirim sebagai pesan status mandiri. Prompt persetujuan, muatan media, dan kesalahan tetap dirutekan melalui pengiriman final normal. Gunakan `streaming.preview.toolProgress: false` saat Anda hanya ingin mempertahankan edit pratinjau jawaban sambil menyembunyikan baris status progres alat.

    <Note>
      Balasan kutipan terpilih Telegram adalah pengecualian. Saat `replyToMode` adalah `"first"`, `"all"`, atau `"batched"` dan pesan masuk menyertakan teks kutipan terpilih, OpenClaw mengirim jawaban akhir melalui jalur balasan kutipan native Telegram, bukan mengedit pratinjau jawaban, sehingga `streaming.preview.toolProgress` tidak dapat menampilkan baris status singkat untuk giliran itu. Balasan pesan saat ini tanpa teks kutipan terpilih tetap mempertahankan streaming pratinjau. Atur `replyToMode: "off"` saat visibilitas progres alat lebih penting daripada balasan kutipan native, atau atur `streaming.preview.toolProgress: false` untuk mengakui komprominya.
    </Note>

    Untuk balasan hanya teks:

    - pratinjau singkat DM/grup/topik: OpenClaw mempertahankan pesan pratinjau yang sama dan melakukan edit final di tempat
    - final teks panjang yang dibagi menjadi beberapa pesan Telegram menggunakan kembali pratinjau yang ada sebagai potongan final pertama jika memungkinkan, lalu hanya mengirim potongan sisanya
    - final mode progres menghapus draf status dan menggunakan pengiriman final normal, bukan mengedit draf menjadi jawaban
    - jika edit final gagal sebelum teks lengkap dikonfirmasi, OpenClaw menggunakan pengiriman final normal dan membersihkan pratinjau usang

    Untuk balasan kompleks (misalnya muatan media), OpenClaw kembali ke pengiriman final normal lalu membersihkan pesan pratinjau.

    Streaming pratinjau terpisah dari streaming blok. Saat streaming blok diaktifkan secara eksplisit untuk Telegram, OpenClaw melewati aliran pratinjau untuk menghindari streaming ganda.

    Aliran penalaran khusus Telegram:

    - `/reasoning stream` mengirim penalaran ke pratinjau langsung saat menghasilkan
    - pratinjau penalaran dihapus setelah pengiriman final; gunakan `/reasoning on` saat penalaran harus tetap terlihat
    - jawaban akhir dikirim tanpa teks penalaran

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    Teks keluar menggunakan Telegram `parse_mode: "HTML"`.

    - Teks mirip Markdown dirender menjadi HTML yang aman untuk Telegram.
    - HTML mentah model di-escape untuk mengurangi kegagalan parse Telegram.
    - Jika Telegram menolak HTML yang diparse, OpenClaw mencoba ulang sebagai teks biasa.

    Pratinjau tautan diaktifkan secara default dan dapat dinonaktifkan dengan `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Pendaftaran menu perintah Telegram ditangani saat startup dengan `setMyCommands`.

    Default perintah native:

    - `commands.native: "auto"` mengaktifkan perintah native untuk Telegram

    Tambahkan entri menu perintah kustom:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Aturan:

    - nama dinormalisasi (hapus `/` di awal, huruf kecil)
    - pola valid: `a-z`, `0-9`, `_`, panjang `1..32`
    - perintah kustom tidak dapat menimpa perintah native
    - konflik/duplikat dilewati dan dicatat di log

    Catatan:

    - perintah kustom hanya entri menu; perintah tersebut tidak mengimplementasikan perilaku secara otomatis
    - perintah plugin/skill tetap dapat berfungsi saat diketik meskipun tidak ditampilkan di menu Telegram

    Jika perintah native dinonaktifkan, bawaan dihapus. Perintah kustom/plugin masih dapat terdaftar jika dikonfigurasi.

    Kegagalan penyiapan umum:

    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu Telegram masih meluap setelah pemangkasan; kurangi perintah plugin/skill/kustom atau nonaktifkan `channels.telegram.commands.native`.
    - Kegagalan `deleteWebhook`, `deleteMyCommands`, atau `setMyCommands` dengan `404: Not Found` saat perintah curl Bot API langsung berfungsi dapat berarti `channels.telegram.apiRoot` diatur ke endpoint `/bot<TOKEN>` lengkap. `apiRoot` harus hanya root Bot API, dan `openclaw doctor --fix` menghapus akhiran `/bot<TOKEN>` yang tidak disengaja.
    - `getMe returned 401` berarti Telegram menolak token bot yang dikonfigurasi. Perbarui `botToken`, `tokenFile`, atau `TELEGRAM_BOT_TOKEN` dengan token BotFather saat ini; OpenClaw berhenti sebelum polling sehingga ini tidak dilaporkan sebagai kegagalan pembersihan webhook.
    - `setMyCommands failed` dengan kesalahan jaringan/fetch biasanya berarti DNS/HTTPS keluar ke `api.telegram.org` diblokir.

    ### Perintah pemasangan perangkat (plugin `device-pair`)

    Saat plugin `device-pair` terpasang:

    1. `/pair` menghasilkan kode penyiapan
    2. tempel kode di aplikasi iOS
    3. `/pair pending` mencantumkan permintaan tertunda (termasuk peran/cakupan)
    4. setujui permintaan:
       - `/pair approve <requestId>` untuk persetujuan eksplisit
       - `/pair approve` saat hanya ada satu permintaan tertunda
       - `/pair approve latest` untuk yang terbaru

    Kode penyiapan membawa token bootstrap berumur pendek. Serah-terima bootstrap bawaan mempertahankan token node utama pada `scopes: []`; token operator yang diserahterimakan tetap dibatasi ke `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`. Pemeriksaan cakupan bootstrap diawali prefiks peran, sehingga allowlist operator tersebut hanya memenuhi permintaan operator; peran non-operator tetap memerlukan cakupan di bawah prefiks perannya sendiri.

    Jika perangkat mencoba ulang dengan detail auth yang berubah (misalnya peran/cakupan/kunci publik), permintaan tertunda sebelumnya digantikan dan permintaan baru menggunakan `requestId` yang berbeda. Jalankan ulang `/pair pending` sebelum menyetujui.

    Detail lebih lanjut: [Pemasangan](/id/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
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

    Contoh tindakan pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Klik callback diteruskan ke agen sebagai teks:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Tindakan alat Telegram meliputi:

    - `sendMessage` (`to`, `content`, opsional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opsional `iconColor`, `iconCustomEmojiId`)

    Tindakan pesan kanal mengekspos alias ergonomis (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrol gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (default: dinonaktifkan)

    Catatan: `edit` dan `topic-create` saat ini diaktifkan secara default dan tidak memiliki toggle `channels.telegram.actions.*` terpisah.
    Pengiriman runtime menggunakan snapshot konfigurasi/rahasia aktif (startup/muat ulang), sehingga jalur tindakan tidak melakukan resolusi ulang SecretRef ad hoc per pengiriman.

    Semantik penghapusan reaksi: [/tools/reactions](/id/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram mendukung tag threading balasan eksplisit dalam output yang dihasilkan:

    - `[[reply_to_current]]` membalas pesan pemicu
    - `[[reply_to:<id>]]` membalas ID pesan Telegram tertentu

    `channels.telegram.replyToMode` mengontrol penanganan:

    - `off` (default)
    - `first`
    - `all`

    Saat threading balasan diaktifkan dan teks atau caption Telegram asli tersedia, OpenClaw secara otomatis menyertakan kutipan native Telegram. Telegram membatasi teks kutipan native pada 1024 unit kode UTF-16, sehingga pesan yang lebih panjang dikutip dari awal dan kembali ke balasan biasa jika Telegram menolak kutipan.

    Catatan: `off` menonaktifkan threading balasan implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Supergrup forum:

    - kunci sesi topik menambahkan `:topic:<threadId>`
    - balasan dan pengetikan menargetkan thread topik
    - jalur konfigurasi topik:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Kasus khusus topik Umum (`threadId=1`):

    - pengiriman pesan menghilangkan `message_thread_id` (Telegram menolak `sendMessage(...thread_id=1)`)
    - tindakan pengetikan tetap menyertakan `message_thread_id`

    Pewarisan topik: entri topik mewarisi pengaturan grup kecuali ditimpa (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` hanya untuk topik dan tidak mewarisi dari default grup.

    **Perutean agen per topik**: Setiap topik dapat dirutekan ke agen berbeda dengan mengatur `agentId` dalam konfigurasi topik. Ini memberi setiap topik workspace, memori, dan sesi terisolasi miliknya sendiri. Contoh:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Setiap topik kemudian memiliki kunci sesinya sendiri: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Pengikatan topik ACP persisten**: Topik forum dapat menyematkan sesi harness ACP melalui pengikatan ACP bertipe tingkat atas (`bindings[]` dengan `type: "acp"` dan `match.channel: "telegram"`, `peer.kind: "group"`, serta id berkualifikasi topik seperti `-1001234567890:topic:42`). Saat ini dicakupkan ke topik forum di grup/supergrup. Lihat [Agen ACP](/id/tools/acp-agents).

    **Spawn ACP terikat thread dari chat**: `/acp spawn <agent> --thread here|auto` mengikat topik saat ini ke sesi ACP baru; tindak lanjut dirutekan langsung ke sana. OpenClaw menyematkan konfirmasi spawn di dalam topik. Memerlukan `channels.telegram.threadBindings.spawnSessions` tetap diaktifkan (default: `true`).

    Konteks templat mengekspos `MessageThreadId` dan `IsForum`. Obrolan DM dengan `message_thread_id` mempertahankan routing DM dan metadata balasan pada sesi datar secara default; obrolan tersebut hanya menggunakan kunci sesi sadar thread saat dikonfigurasi dengan `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true`, atau konfigurasi topik yang cocok. Gunakan `channels.telegram.dm.threadReplies` tingkat teratas untuk default akun, atau `direct.<chatId>.threadReplies` untuk satu DM.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Pesan audio

    Telegram membedakan catatan suara dari file audio.

    - default: perilaku file audio
    - tag `[[audio_as_voice]]` dalam balasan agen untuk memaksa pengiriman catatan suara
    - transkrip catatan suara masuk dibingkai sebagai teks yang dibuat mesin,
      tidak tepercaya dalam konteks agen; deteksi sebutan tetap menggunakan transkrip
      mentah sehingga pesan suara yang dibatasi sebutan tetap berfungsi.

    Contoh tindakan pesan:

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

    Telegram membedakan file video dari catatan video.

    Contoh tindakan pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Catatan video tidak mendukung keterangan; teks pesan yang diberikan dikirim secara terpisah.

    ### Stiker

    Penanganan stiker masuk:

    - WEBP statis: diunduh dan diproses (placeholder `<media:sticker>`)
    - TGS animasi: dilewati
    - WEBM video: dilewati

    Bidang konteks stiker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    File cache stiker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stiker dideskripsikan sekali (jika memungkinkan) dan disimpan dalam cache untuk mengurangi panggilan visi berulang.

    Aktifkan tindakan stiker:

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

    Tindakan kirim stiker:

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
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaction notifications">
    Reaksi Telegram tiba sebagai pembaruan `message_reaction` (terpisah dari payload pesan).

    Saat diaktifkan, OpenClaw mengantrekan peristiwa sistem seperti:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfigurasi:

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    Catatan:

    - `own` berarti reaksi pengguna hanya terhadap pesan yang dikirim bot (upaya terbaik melalui cache pesan terkirim).
    - Peristiwa reaksi tetap mematuhi kontrol akses Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); pengirim yang tidak berwenang dibuang.
    - Telegram tidak menyediakan ID thread dalam pembaruan reaksi.
      - grup non-forum dirutekan ke sesi obrolan grup
      - grup forum dirutekan ke sesi topik umum grup (`:topic:1`), bukan topik asal yang tepat

    `allowed_updates` untuk polling/webhook menyertakan `message_reaction` secara otomatis.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` mengirim emoji pengakuan saat OpenClaw sedang memproses pesan masuk.

    Urutan resolusi:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada "👀")

    Catatan:

    - Telegram mengharapkan emoji unicode (misalnya "👀").
    - Gunakan `""` untuk menonaktifkan reaksi bagi channel atau akun.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Penulisan konfigurasi channel diaktifkan secara default (`configWrites !== false`).

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

  <Accordion title="Long polling vs webhook">
    Defaultnya adalah long polling. Untuk mode webhook, atur `channels.telegram.webhookUrl` dan `channels.telegram.webhookSecret`; opsional `webhookPath`, `webhookHost`, `webhookPort` (default `/telegram-webhook`, `127.0.0.1`, `8787`).

    Dalam mode long polling, OpenClaw mempertahankan watermark restart hanya setelah pembaruan berhasil didispatch. Jika handler gagal, pembaruan tersebut tetap dapat dicoba ulang dalam proses yang sama dan tidak ditulis sebagai selesai untuk dedupe restart.

    Listener lokal mengikat ke `127.0.0.1:8787`. Untuk ingress publik, letakkan reverse proxy di depan port lokal atau atur `webhookHost: "0.0.0.0"` secara sengaja.

    Mode webhook memvalidasi penjaga permintaan, token rahasia Telegram, dan body JSON sebelum mengembalikan `200` ke Telegram.
    OpenClaw kemudian memproses pembaruan secara asinkron melalui lane bot per-obrolan/per-topik yang sama seperti yang digunakan long polling, sehingga giliran agen yang lambat tidak menahan ACK pengiriman Telegram.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - Default `channels.telegram.textChunkLimit` adalah 4000.
    - `channels.telegram.chunkMode="newline"` mengutamakan batas paragraf (baris kosong) sebelum pemisahan berdasarkan panjang.
    - `channels.telegram.mediaMaxMb` (default 100) membatasi ukuran media Telegram masuk dan keluar.
    - `channels.telegram.mediaGroupFlushMs` (default 500) mengontrol berapa lama album/grup media Telegram dibuffer sebelum OpenClaw mendispatchnya sebagai satu pesan masuk. Tingkatkan jika bagian album datang terlambat; kurangi untuk mengurangi latensi balasan album.
    - Konfigurasi `channels.telegram.timeoutSeconds` menggantikan timeout klien API Telegram (jika tidak diatur, default grammY berlaku). Klien bot membatasi nilai yang dikonfigurasi di bawah penjaga permintaan teks/typing keluar 60 detik agar grammY tidak membatalkan pengiriman balasan terlihat sebelum penjaga transport dan fallback OpenClaw dapat berjalan. Long polling tetap menggunakan penjaga permintaan `getUpdates` 45 detik agar polling idle tidak ditinggalkan tanpa batas.
    - Default `channels.telegram.pollingStallThresholdMs` adalah `120000`; sesuaikan antara `30000` dan `600000` hanya untuk restart polling-stall positif palsu.
    - riwayat konteks grup menggunakan `channels.telegram.historyLimit` atau `messages.groupChat.historyLimit` (default 50); `0` menonaktifkan.
    - konteks tambahan balasan/kutipan/terusan dinormalisasi ke dalam satu jendela konteks percakapan yang dipilih saat gateway telah mengamati pesan induk; cache pesan yang diamati dipertahankan di samping penyimpanan sesi. Telegram hanya menyertakan satu `reply_to_message` dangkal dalam pembaruan, sehingga rantai yang lebih lama dari cache dibatasi pada payload pembaruan Telegram saat ini.
    - Allowlist Telegram terutama membatasi siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan penuh.
    - Kontrol riwayat DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfigurasi `channels.telegram.retry` berlaku untuk helper pengiriman Telegram (CLI/tools/actions) untuk error API keluar yang dapat dipulihkan. Pengiriman balasan akhir masuk juga menggunakan retry safe-send terbatas untuk kegagalan pra-koneksi Telegram, tetapi tidak mencoba ulang envelope jaringan pasca-kirim yang ambigu yang dapat menduplikasi pesan terlihat.

    Target pengiriman CLI dan message-tool dapat berupa ID obrolan numerik, nama pengguna, atau target topik forum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Polling Telegram menggunakan `openclaw message poll` dan mendukung topik forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag polling khusus Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` untuk topik forum (atau gunakan target `:topic:`)

    Pengiriman Telegram juga mendukung:

    - `--presentation` dengan blok `buttons` untuk keyboard inline saat `channels.telegram.capabilities.inlineButtons` mengizinkannya
    - `--pin` atau `--delivery '{"pin":true}'` untuk meminta pengiriman yang disematkan saat bot dapat menyematkan di obrolan tersebut
    - `--force-document` untuk mengirim gambar dan GIF keluar sebagai dokumen, bukan unggahan foto terkompresi atau media animasi

    Pembatasan tindakan:

    - `channels.telegram.actions.sendMessage=false` menonaktifkan pesan Telegram keluar, termasuk polling
    - `channels.telegram.actions.poll=false` menonaktifkan pembuatan polling Telegram sambil tetap mengaktifkan pengiriman reguler

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram mendukung persetujuan exec di DM pemberi persetujuan dan secara opsional dapat memposting prompt di obrolan atau topik asal. Pemberi persetujuan harus berupa ID pengguna Telegram numerik.

    Jalur konfigurasi:

    - `channels.telegram.execApprovals.enabled` (aktif otomatis saat setidaknya satu pemberi persetujuan dapat diresolusi)
    - `channels.telegram.execApprovals.approvers` (fallback ke ID pemilik numerik dari `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (default) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, dan `defaultTo` mengontrol siapa yang dapat berbicara dengan bot dan ke mana bot mengirim balasan normal. Ketiganya tidak menjadikan seseorang pemberi persetujuan exec. Pemasangan DM pertama yang disetujui mem-bootstrap `commands.ownerAllowFrom` saat belum ada pemilik perintah, sehingga penyiapan satu pemilik tetap berfungsi tanpa menduplikasi ID di bawah `execApprovals.approvers`.

    Pengiriman channel menampilkan teks perintah di obrolan; hanya aktifkan `channel` atau `both` di grup/topik tepercaya. Saat prompt masuk ke topik forum, OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjut. Persetujuan exec kedaluwarsa setelah 30 menit secara default.

    Tombol persetujuan inline juga memerlukan `channels.telegram.capabilities.inlineButtons` untuk mengizinkan permukaan target (`dm`, `group`, atau `all`). ID persetujuan dengan prefiks `plugin:` diresolusi melalui persetujuan Plugin; yang lain diresolusi melalui persetujuan exec terlebih dahulu.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrol balasan error

Saat agen mengalami error pengiriman atau penyedia, Telegram dapat membalas dengan teks error atau menekannya. Dua kunci konfigurasi mengontrol perilaku ini:

| Kunci                               | Nilai             | Default | Deskripsi                                                                                                  |
| ----------------------------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` mengirim pesan error yang ramah ke obrolan. `silent` menekan balasan error sepenuhnya.             |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Waktu minimum antarbalasan error ke obrolan yang sama. Mencegah spam error selama pemadaman.               |

Override per-akun, per-grup, dan per-topik didukung (pewarisan yang sama seperti kunci konfigurasi Telegram lainnya).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bot tidak merespons pesan grup tanpa mention">

    - Jika `requireMention=false`, mode privasi Telegram harus mengizinkan visibilitas penuh.
      - BotFather: `/setprivacy` -> Disable
      - lalu hapus + tambahkan ulang bot ke grup
    - `openclaw channels status` memperingatkan ketika konfigurasi mengharapkan pesan grup tanpa mention.
    - `openclaw channels status --probe` dapat memeriksa ID grup numerik eksplisit; wildcard `"*"` tidak dapat diperiksa keanggotaannya.
    - uji sesi cepat: `/activation always`.

  </Accordion>

  <Accordion title="Bot sama sekali tidak melihat pesan grup">

    - ketika `channels.telegram.groups` ada, grup harus dicantumkan (atau menyertakan `"*"`)
    - verifikasi keanggotaan bot di grup
    - tinjau log: `openclaw logs --follow` untuk alasan dilewati

  </Accordion>

  <Accordion title="Perintah berfungsi sebagian atau tidak sama sekali">

    - otorisasi identitas pengirim Anda (pairing dan/atau `allowFrom` numerik)
    - otorisasi perintah tetap berlaku bahkan ketika kebijakan grup adalah `open`
    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu native memiliki terlalu banyak entri; kurangi perintah plugin/skill/kustom atau nonaktifkan menu native
    - panggilan startup `deleteMyCommands` / `setMyCommands` dan panggilan pengetikan `sendChatAction` dibatasi dan dicoba ulang sekali melalui fallback transport Telegram saat waktu permintaan habis. Kesalahan jaringan/fetch yang persisten biasanya menunjukkan masalah keterjangkauan DNS/HTTPS ke `api.telegram.org`

  </Accordion>

  <Accordion title="Startup melaporkan token tidak terotorisasi">

    - `getMe returned 401` adalah kegagalan autentikasi Telegram untuk token bot yang dikonfigurasi.
    - Salin ulang atau buat ulang token bot di BotFather, lalu perbarui `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, atau `TELEGRAM_BOT_TOKEN` untuk akun default.
    - `deleteWebhook 401 Unauthorized` saat startup juga merupakan kegagalan auth; memperlakukannya sebagai "tidak ada webhook" hanya akan menunda kegagalan token buruk yang sama ke panggilan API berikutnya.

  </Accordion>

  <Accordion title="Polling atau jaringan tidak stabil">

    - Node 22+ + fetch/proxy kustom dapat memicu perilaku abort langsung jika jenis AbortSignal tidak cocok.
    - Beberapa host me-resolve `api.telegram.org` ke IPv6 terlebih dahulu; egress IPv6 yang rusak dapat menyebabkan kegagalan API Telegram yang berselang.
    - Jika log menyertakan `TypeError: fetch failed` atau `Network request for 'getUpdates' failed!`, OpenClaw sekarang mencoba ulang ini sebagai kesalahan jaringan yang dapat dipulihkan.
    - Selama startup polling, OpenClaw menggunakan kembali probe startup `getMe` yang berhasil untuk grammY sehingga runner tidak memerlukan `getMe` kedua sebelum `getUpdates` pertama.
    - Jika `deleteWebhook` gagal dengan kesalahan jaringan sementara selama startup polling, OpenClaw melanjutkan ke long polling alih-alih membuat panggilan control-plane pra-poll lainnya. Webhook yang masih aktif muncul sebagai konflik `getUpdates`; OpenClaw kemudian membangun ulang transport Telegram dan mencoba ulang pembersihan webhook.
    - Jika soket Telegram didaur ulang pada cadence tetap yang pendek, periksa `channels.telegram.timeoutSeconds` yang rendah; klien bot membatasi nilai yang dikonfigurasi di bawah guard permintaan outbound dan `getUpdates`, tetapi rilis lama dapat membatalkan setiap poll atau balasan ketika nilai ini ditetapkan di bawah guard tersebut.
    - Jika log menyertakan `Polling stall detected`, OpenClaw memulai ulang polling dan membangun ulang transport Telegram setelah 120 detik tanpa liveness long-poll yang selesai secara default.
    - `openclaw channels status --probe` dan `openclaw doctor` memperingatkan ketika akun polling yang berjalan belum menyelesaikan `getUpdates` setelah masa tenggang startup, ketika akun webhook yang berjalan belum menyelesaikan `setWebhook` setelah masa tenggang startup, atau ketika aktivitas transport polling terakhir yang berhasil sudah basi.
    - Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya ketika panggilan `getUpdates` yang berjalan lama sehat tetapi host Anda masih melaporkan restart polling-stall palsu. Stall yang persisten biasanya mengarah ke masalah proxy, DNS, IPv6, atau egress TLS antara host dan `api.telegram.org`.
    - Telegram juga menghormati env proxy proses untuk transport Bot API, termasuk `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan varian huruf kecilnya. `NO_PROXY` / `no_proxy` masih dapat melewati `api.telegram.org`.
    - Jika proxy terkelola OpenClaw dikonfigurasi melalui `OPENCLAW_PROXY_URL` untuk lingkungan layanan dan tidak ada env proxy standar, Telegram juga menggunakan URL tersebut untuk transport Bot API.
    - Pada host VPS dengan egress/TLS langsung yang tidak stabil, rutekan panggilan API Telegram melalui `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ default ke `autoSelectFamily=true` (kecuali WSL2). Urutan hasil DNS Telegram menghormati `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, lalu `channels.telegram.network.dnsResultOrder`, lalu default proses seperti `NODE_OPTIONS=--dns-result-order=ipv4first`; jika tidak ada yang berlaku, Node 22+ fallback ke `ipv4first`.
    - Jika host Anda adalah WSL2 atau secara eksplisit bekerja lebih baik dengan perilaku khusus IPv4, paksa pemilihan family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Jawaban rentang benchmark RFC 2544 (`198.18.0.0/15`) sudah diizinkan
      untuk unduhan media Telegram secara default. Jika fake-IP tepercaya atau
      proxy transparan menulis ulang `api.telegram.org` ke alamat
      private/internal/special-use lain selama unduhan media, Anda dapat ikut
      serta dalam bypass khusus Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Opt-in yang sama tersedia per akun di
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jika proxy Anda me-resolve host media Telegram ke `198.18.x.x`, biarkan
      flag berbahaya nonaktif terlebih dahulu. Media Telegram sudah mengizinkan
      rentang benchmark RFC 2544 secara default.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` melemahkan perlindungan SSRF
      media Telegram. Gunakan hanya untuk lingkungan proxy tepercaya yang dikendalikan operator
      seperti perutean fake-IP Clash, Mihomo, atau Surge ketika mereka
      menyintesis jawaban private atau special-use di luar rentang benchmark
      RFC 2544. Biarkan nonaktif untuk akses Telegram internet publik normal.
    </Warning>

    - Override lingkungan (sementara):
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

Bantuan selengkapnya: [Pemecahan masalah channel](/id/channels/troubleshooting).

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Telegram](/id/gateway/config-channels#telegram).

<Accordion title="Field Telegram bersinyal tinggi">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` harus menunjuk ke file reguler; symlink ditolak)
- kontrol akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` tingkat teratas (`type: "acp"`)
- persetujuan eksekusi: `execApprovals`, `accounts.*.execApprovals`
- perintah/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/balasan: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (pratinjau), `streaming.preview.toolProgress`, `blockStreaming`
- pemformatan/pengiriman: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/jaringan: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API kustom: `apiRoot` (hanya root Bot API; jangan sertakan `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- aksi/kapabilitas: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaksi: `reactionNotifications`, `reactionLevel`
- kesalahan: `errorPolicy`, `errorCooldownMs`
- penulisan/riwayat: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Presedensi multi-akun: ketika dua atau lebih ID akun dikonfigurasi, tetapkan `channels.telegram.defaultAccount` (atau sertakan `channels.telegram.accounts.default`) agar perutean default eksplisit. Jika tidak, OpenClaw fallback ke ID akun ternormalisasi pertama dan `openclaw doctor` memperingatkan. Akun bernama mewarisi nilai `channels.telegram.allowFrom` / `groupAllowFrom`, tetapi bukan nilai `accounts.default.*`.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pairing pengguna Telegram ke gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku allowlist grup dan topik.
  </Card>
  <Card title="Perutean channel" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agent.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan hardening.
  </Card>
  <Card title="Perutean multi-agent" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan grup dan topik ke agent.
  </Card>
  <Card title="Pemecahan masalah" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas-channel.
  </Card>
</CardGroup>
