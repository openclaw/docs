---
read_when:
    - Mengerjakan fitur Telegram atau Webhook
summary: Status dukungan, kemampuan, dan konfigurasi bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-30T16:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: d18ca6c7ab39d7d34848c562857661501d8364329f6e5a266213aa23846047dd
    source_path: channels/telegram.md
    workflow: 16
---

Siap produksi untuk DM dan grup bot melalui grammY. Long polling adalah mode default; mode Webhook bersifat opsional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk Telegram adalah pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas saluran dan playbook perbaikan.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi saluran lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Create the bot token in BotFather">
    Buka Telegram dan chat dengan **@BotFather** (pastikan handle tepat `@BotFather`).

    Jalankan `/newbot`, ikuti prompt, dan simpan token.

  </Step>

  <Step title="Configure token and DM policy">

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
    Telegram **tidak** menggunakan `openclaw channels login telegram`; konfigurasikan token di config/env, lalu mulai gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kode pairing kedaluwarsa setelah 1 jam.

  </Step>

  <Step title="Add the bot to a group">
    Tambahkan bot ke grup Anda, lalu atur `channels.telegram.groups` dan `groupPolicy` agar sesuai dengan model akses Anda.
  </Step>
</Steps>

<Note>
Urutan resolusi token sadar akun. Dalam praktiknya, nilai config mengungguli fallback env, dan `TELEGRAM_BOT_TOKEN` hanya berlaku untuk akun default.
</Note>

## Pengaturan sisi Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Bot Telegram secara default menggunakan **Privacy Mode**, yang membatasi pesan grup yang diterimanya.

    Jika bot harus melihat semua pesan grup, lakukan salah satu:

    - nonaktifkan mode privasi melalui `/setprivacy`, atau
    - jadikan bot sebagai admin grup.

    Saat mengubah mode privasi, hapus + tambahkan kembali bot di setiap grup agar Telegram menerapkan perubahan.

  </Accordion>

  <Accordion title="Group permissions">
    Status admin dikendalikan di pengaturan grup Telegram.

    Bot admin menerima semua pesan grup, yang berguna untuk perilaku grup yang selalu aktif.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` untuk mengizinkan/menolak penambahan ke grup
    - `/setprivacy` untuk perilaku visibilitas grup

  </Accordion>
</AccordionGroup>

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` mengontrol akses pesan langsung:

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu ID pengirim di `allowFrom`)
    - `open` (memerlukan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `dmPolicy: "open"` dengan `allowFrom: ["*"]` memungkinkan akun Telegram apa pun yang menemukan atau menebak nama pengguna bot untuk memerintah bot. Gunakan hanya untuk bot yang sengaja dibuat publik dengan tool yang sangat dibatasi; bot satu pemilik sebaiknya menggunakan `allowlist` dengan ID pengguna numerik.

    `channels.telegram.allowFrom` menerima ID pengguna Telegram numerik. Prefiks `telegram:` / `tg:` diterima dan dinormalisasi.
    Dalam config multi-akun, `channels.telegram.allowFrom` tingkat atas yang restriktif diperlakukan sebagai batas keamanan: entri tingkat akun `allowFrom: ["*"]` tidak membuat akun tersebut publik kecuali allowlist akun efektif masih berisi wildcard eksplisit setelah penggabungan.
    `dmPolicy: "allowlist"` dengan `allowFrom` kosong memblokir semua DM dan ditolak oleh validasi config.
    Penyiapan hanya meminta ID pengguna numerik.
    Jika Anda melakukan upgrade dan config Anda berisi entri allowlist `@username`, jalankan `openclaw doctor --fix` untuk menyelesaikannya (upaya terbaik; memerlukan token bot Telegram).
    Jika sebelumnya Anda mengandalkan file allowlist pairing-store, `openclaw doctor --fix` dapat memulihkan entri ke `channels.telegram.allowFrom` dalam alur allowlist (misalnya saat `dmPolicy: "allowlist"` belum memiliki ID eksplisit).

    Untuk bot satu pemilik, pilih `dmPolicy: "allowlist"` dengan ID numerik `allowFrom` eksplisit agar kebijakan akses tahan lama dalam config (alih-alih bergantung pada persetujuan pairing sebelumnya).

    Kebingungan umum: persetujuan pairing DM tidak berarti "pengirim ini diotorisasi di mana saja".
    Pairing memberikan akses DM. Jika belum ada pemilik perintah, pairing pertama yang disetujui juga menetapkan `commands.ownerAllowFrom` sehingga perintah khusus pemilik dan persetujuan exec memiliki akun operator eksplisit.
    Otorisasi pengirim grup tetap berasal dari allowlist config eksplisit.
    Jika Anda ingin "Saya diotorisasi sekali dan DM serta perintah grup sama-sama berfungsi", masukkan ID pengguna Telegram numerik Anda di `channels.telegram.allowFrom`; untuk perintah khusus pemilik, pastikan `commands.ownerAllowFrom` berisi `telegram:<your user id>`.

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

  <Tab title="Group policy and allowlists">
    Dua kontrol berlaku bersama:

    1. **Grup mana yang diizinkan** (`channels.telegram.groups`)
       - tanpa config `groups`:
         - dengan `groupPolicy: "open"`: grup apa pun dapat lolos pemeriksaan ID grup
         - dengan `groupPolicy: "allowlist"` (default): grup diblokir sampai Anda menambahkan entri `groups` (atau `"*"`)
       - `groups` dikonfigurasi: bertindak sebagai allowlist (ID eksplisit atau `"*"`)

    2. **Pengirim mana yang diizinkan dalam grup** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` digunakan untuk pemfilteran pengirim grup. Jika tidak disetel, Telegram kembali ke `allowFrom`.
    Entri `groupAllowFrom` sebaiknya berupa ID pengguna Telegram numerik (prefiks `telegram:` / `tg:` dinormalisasi).
    Jangan masukkan ID chat grup atau supergrup Telegram di `groupAllowFrom`. ID chat negatif berada di bawah `channels.telegram.groups`.
    Entri non-numerik diabaikan untuk otorisasi pengirim.
    Batas keamanan (`2026.2.25+`): auth pengirim grup **tidak** mewarisi persetujuan pairing-store DM.
    Pairing tetap khusus DM. Untuk grup, setel `groupAllowFrom` atau `allowFrom` per grup/per topik.
    Jika `groupAllowFrom` tidak disetel, Telegram kembali ke config `allowFrom`, bukan pairing store.
    Pola praktis untuk bot satu pemilik: setel ID pengguna Anda di `channels.telegram.allowFrom`, biarkan `groupAllowFrom` tidak disetel, dan izinkan grup target di bawah `channels.telegram.groups`.
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

      - Letakkan ID chat grup atau supergrup Telegram negatif seperti `-1001234567890` di bawah `channels.telegram.groups`.
      - Letakkan ID pengguna Telegram seperti `8734062810` di bawah `groupAllowFrom` saat Anda ingin membatasi orang di dalam grup yang diizinkan yang dapat memicu bot.
      - Gunakan `groupAllowFrom: ["*"]` hanya saat Anda ingin anggota mana pun dari grup yang diizinkan dapat berbicara dengan bot.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
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
- Routing deterministik: inbound Telegram membalas kembali ke Telegram (model tidak memilih saluran).
- Pesan inbound dinormalisasi ke dalam envelope saluran bersama dengan metadata balasan dan placeholder media.
- Sesi grup diisolasi berdasarkan ID grup. Topik forum menambahkan `:topic:<threadId>` agar topik tetap terisolasi.
- Pesan DM dapat membawa `message_thread_id`; OpenClaw merutekannya dengan kunci sesi yang sadar thread dan mempertahankan ID thread untuk balasan.
- Long polling menggunakan grammY runner dengan pengurutan per chat/per thread. Konkurensi sink runner keseluruhan menggunakan `agents.defaults.maxConcurrent`.
- Long polling dijaga di dalam setiap proses gateway sehingga hanya satu poller aktif yang dapat menggunakan token bot pada satu waktu. Jika Anda masih melihat konflik `getUpdates` 409, kemungkinan gateway OpenClaw lain, skrip, atau poller eksternal sedang menggunakan token yang sama.
- Restart watchdog long-polling terpicu setelah 120 detik tanpa liveness `getUpdates` yang selesai secara default. Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya jika deployment Anda masih melihat restart polling-stall palsu selama pekerjaan yang berjalan lama. Nilainya dalam milidetik dan diizinkan dari `30000` hingga `600000`; override per akun didukung.
- Telegram Bot API tidak memiliki dukungan tanda baca (`sendReadReceipts` tidak berlaku).

## Referensi fitur

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw dapat melakukan streaming balasan parsial secara real time:

    - chat langsung: pesan pratinjau + `editMessageText`
    - grup/topik: pesan pratinjau + `editMessageText`

    Persyaratan:

    - `channels.telegram.streaming` adalah `off | partial | block | progress` (default: `partial`)
    - `progress` dipetakan ke `partial` di Telegram (kompat dengan penamaan lintas saluran)
    - `streaming.preview.toolProgress` mengontrol apakah pembaruan tool/progress menggunakan kembali pesan pratinjau edit yang sama (default: `true` saat streaming pratinjau aktif)
    - `channels.telegram.streamMode` lama dan nilai boolean `streaming` terdeteksi; jalankan `openclaw doctor --fix` untuk memigrasikannya ke `channels.telegram.streaming.mode`

    Pembaruan pratinjau progres tool adalah baris pendek "Working..." yang ditampilkan saat tool berjalan, misalnya eksekusi perintah, pembacaan file, pembaruan perencanaan, atau ringkasan patch. Telegram mengaktifkannya secara default agar sesuai dengan perilaku OpenClaw yang dirilis dari `v2026.4.22` dan setelahnya. Untuk mempertahankan pratinjau edit untuk teks jawaban tetapi menyembunyikan baris progres tool, setel:

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

    Gunakan `streaming.mode: "off"` hanya saat Anda menginginkan pengiriman final saja: edit pratinjau Telegram dinonaktifkan dan percakapan umum tool/progress ditekan alih-alih dikirim sebagai pesan mandiri "Working...". Prompt persetujuan, payload media, dan error tetap dirutekan melalui pengiriman final normal. Gunakan `streaming.preview.toolProgress: false` saat Anda hanya ingin mempertahankan edit pratinjau jawaban sambil menyembunyikan baris status progres tool.

    Untuk balasan teks saja:

    - pratinjau DM/grup/topik singkat: OpenClaw mempertahankan pesan pratinjau yang sama dan melakukan pengeditan final di tempat
    - pratinjau yang lebih lama dari sekitar satu menit: OpenClaw mengirim balasan selesai sebagai pesan final baru lalu membersihkan pratinjau, sehingga stempel waktu yang terlihat di Telegram mencerminkan waktu penyelesaian, bukan waktu pembuatan pratinjau

    Untuk balasan kompleks (misalnya payload media), OpenClaw kembali ke pengiriman final normal lalu membersihkan pesan pratinjau.

    Streaming pratinjau terpisah dari streaming blok. Saat streaming blok diaktifkan secara eksplisit untuk Telegram, OpenClaw melewati streaming pratinjau untuk menghindari streaming ganda.

    Streaming penalaran khusus Telegram:

    - `/reasoning stream` mengirim penalaran ke pratinjau langsung saat menghasilkan
    - jawaban final dikirim tanpa teks penalaran

  </Accordion>

  <Accordion title="Pemformatan dan fallback HTML">
    Teks keluar menggunakan Telegram `parse_mode: "HTML"`.

    - Teks mirip Markdown dirender menjadi HTML yang aman untuk Telegram.
    - HTML mentah dari model di-escape untuk mengurangi kegagalan parsing Telegram.
    - Jika Telegram menolak HTML yang diparsing, OpenClaw mencoba ulang sebagai teks biasa.

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
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Aturan:

    - nama dinormalisasi (menghapus `/` di awal, huruf kecil)
    - pola valid: `a-z`, `0-9`, `_`, panjang `1..32`
    - perintah kustom tidak dapat menimpa perintah native
    - konflik/duplikat dilewati dan dicatat

    Catatan:

    - perintah kustom hanya entri menu; perintah tersebut tidak mengimplementasikan perilaku secara otomatis
    - perintah plugin/skill masih dapat bekerja saat diketik meskipun tidak ditampilkan di menu Telegram

    Jika perintah native dinonaktifkan, bawaan akan dihapus. Perintah kustom/plugin mungkin tetap terdaftar jika dikonfigurasi.

    Kegagalan penyiapan umum:

    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu Telegram masih meluap setelah pemangkasan; kurangi perintah plugin/skill/kustom atau nonaktifkan `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands`, atau `setMyCommands` gagal dengan `404: Not Found` sementara perintah curl Bot API langsung berfungsi dapat berarti `channels.telegram.apiRoot` diatur ke endpoint lengkap `/bot<TOKEN>`. `apiRoot` harus hanya root Bot API, dan `openclaw doctor --fix` menghapus akhiran `/bot<TOKEN>` yang tidak sengaja.
    - `getMe returned 401` berarti Telegram menolak token bot yang dikonfigurasi. Perbarui `botToken`, `tokenFile`, atau `TELEGRAM_BOT_TOKEN` dengan token BotFather saat ini; OpenClaw berhenti sebelum polling sehingga ini tidak dilaporkan sebagai kegagalan pembersihan Webhook.
    - `setMyCommands failed` dengan error jaringan/fetch biasanya berarti DNS/HTTPS keluar ke `api.telegram.org` diblokir.

    ### Perintah pemasangan perangkat (Plugin `device-pair`)

    Saat Plugin `device-pair` dipasang:

    1. `/pair` menghasilkan kode penyiapan
    2. tempel kode di aplikasi iOS
    3. `/pair pending` mencantumkan permintaan tertunda (termasuk peran/scopes)
    4. setujui permintaan:
       - `/pair approve <requestId>` untuk persetujuan eksplisit
       - `/pair approve` saat hanya ada satu permintaan tertunda
       - `/pair approve latest` untuk yang terbaru

    Kode penyiapan membawa token bootstrap berumur pendek. Handoff bootstrap bawaan mempertahankan token node utama pada `scopes: []`; token operator yang diserahkan tetap dibatasi ke `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`. Pemeriksaan scope bootstrap diberi prefiks peran, sehingga allowlist operator tersebut hanya memenuhi permintaan operator; peran non-operator tetap membutuhkan scope di bawah prefiks perannya sendiri.

    Jika perangkat mencoba ulang dengan detail auth yang berubah (misalnya peran/scopes/kunci publik), permintaan tertunda sebelumnya digantikan dan permintaan baru menggunakan `requestId` yang berbeda. Jalankan ulang `/pair pending` sebelum menyetujui.

    Detail selengkapnya: [Pemasangan](/id/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Tombol inline">
    Konfigurasikan scope keyboard inline:

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

    Scope:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (default)

    Legacy `capabilities: ["inlineButtons"]` dipetakan ke `inlineButtons: "all"`.

    Contoh aksi pesan:

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

  <Accordion title="Aksi pesan Telegram untuk agen dan otomatisasi">
    Aksi tool Telegram mencakup:

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
    - `channels.telegram.actions.sticker` (default: dinonaktifkan)

    Catatan: `edit` dan `topic-create` saat ini diaktifkan secara default dan tidak memiliki toggle `channels.telegram.actions.*` terpisah.
    Pengiriman runtime menggunakan snapshot konfigurasi/rahasia aktif (startup/reload), sehingga jalur aksi tidak melakukan resolusi ulang SecretRef ad hoc per pengiriman.

    Semantik penghapusan reaksi: [/tools/reactions](/id/tools/reactions)

  </Accordion>

  <Accordion title="Tag threading balasan">
    Telegram mendukung tag threading balasan eksplisit dalam output yang dihasilkan:

    - `[[reply_to_current]]` membalas pesan pemicu
    - `[[reply_to:<id>]]` membalas ID pesan Telegram tertentu

    `channels.telegram.replyToMode` mengontrol penanganan:

    - `off` (default)
    - `first`
    - `all`

    Saat threading balasan diaktifkan dan teks atau caption Telegram asli tersedia, OpenClaw otomatis menyertakan kutipan native Telegram. Telegram membatasi teks kutipan native pada 1024 unit kode UTF-16, sehingga pesan yang lebih panjang dikutip dari awal dan fallback ke balasan biasa jika Telegram menolak kutipan tersebut.

    Catatan: `off` menonaktifkan threading balasan implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.

  </Accordion>

  <Accordion title="Topik forum dan perilaku thread">
    Supergrup forum:

    - kunci sesi topik menambahkan `:topic:<threadId>`
    - balasan dan pengetikan menargetkan thread topik
    - jalur konfigurasi topik:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Kasus khusus topik General (`threadId=1`):

    - pengiriman pesan menghilangkan `message_thread_id` (Telegram menolak `sendMessage(...thread_id=1)`)
    - aksi pengetikan tetap menyertakan `message_thread_id`

    Pewarisan topik: entri topik mewarisi pengaturan grup kecuali ditimpa (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` hanya untuk topik dan tidak diwarisi dari default grup.

    **Routing agen per topik**: Setiap topik dapat dirutekan ke agen berbeda dengan mengatur `agentId` dalam konfigurasi topik. Ini memberi setiap topik workspace, memori, dan sesi terisolasi miliknya sendiri. Contoh:

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

    **Binding topik ACP persisten**: Topik forum dapat mem-pin sesi harness ACP melalui binding ACP bertipe tingkat atas (`bindings[]` dengan `type: "acp"` dan `match.channel: "telegram"`, `peer.kind: "group"`, serta id berkualifikasi topik seperti `-1001234567890:topic:42`). Saat ini dibatasi untuk topik forum dalam grup/supergrup. Lihat [Agen ACP](/id/tools/acp-agents).

    **Spawn ACP terikat thread dari chat**: `/acp spawn <agent> --thread here|auto` mengikat topik saat ini ke sesi ACP baru; tindak lanjut dirutekan langsung ke sana. OpenClaw mem-pin konfirmasi spawn di dalam topik. Memerlukan `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Konteks template mengekspos `MessageThreadId` dan `IsForum`. Chat DM dengan `message_thread_id` mempertahankan routing DM tetapi menggunakan kunci sesi yang sadar thread.

  </Accordion>

  <Accordion title="Audio, video, dan stiker">
    ### Pesan audio

    Telegram membedakan voice note dan file audio.

    - default: perilaku file audio
    - tag `[[audio_as_voice]]` dalam balasan agen untuk memaksa pengiriman voice note
    - transkrip voice note masuk dibingkai sebagai teks buatan mesin yang tidak tepercaya dalam konteks agen; deteksi mention tetap menggunakan transkrip mentah sehingga pesan suara yang dibatasi mention tetap berfungsi.

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

    Stiker dideskripsikan sekali (jika memungkinkan) dan di-cache untuk mengurangi panggilan vision berulang.

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
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifikasi reaksi">
    Reaksi Telegram hadir sebagai pembaruan `message_reaction` (terpisah dari payload pesan).

    Saat diaktifkan, OpenClaw mengantrekan event sistem seperti:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfigurasi:

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    Catatan:

    - `own` berarti hanya reaksi pengguna terhadap pesan yang dikirim bot (upaya terbaik melalui cache pesan terkirim).
    - Peristiwa reaksi tetap mematuhi kontrol akses Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); pengirim yang tidak berwenang dibuang.
    - Telegram tidak menyediakan ID utas dalam pembaruan reaksi.
      - grup non-forum diarahkan ke sesi obrolan grup
      - grup forum diarahkan ke sesi topik umum grup (`:topic:1`), bukan topik asal yang persis

    `allowed_updates` untuk polling/webhook otomatis mencakup `message_reaction`.

  </Accordion>

  <Accordion title="Reaksi ack">
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

  <Accordion title="Penulisan konfigurasi dari peristiwa dan perintah Telegram">
    Penulisan konfigurasi channel diaktifkan secara default (`configWrites !== false`).

    Penulisan yang dipicu Telegram mencakup:

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
    Default-nya adalah long polling. Untuk mode webhook, atur `channels.telegram.webhookUrl` dan `channels.telegram.webhookSecret`; opsional `webhookPath`, `webhookHost`, `webhookPort` (default `/telegram-webhook`, `127.0.0.1`, `8787`).

    Listener lokal bind ke `127.0.0.1:8787`. Untuk ingress publik, pasang reverse proxy di depan port lokal atau atur `webhookHost: "0.0.0.0"` secara sengaja.

    Mode webhook memvalidasi penjaga permintaan, token rahasia Telegram, dan body JSON sebelum mengembalikan `200` ke Telegram.
    OpenClaw kemudian memproses pembaruan secara asinkron melalui lane bot per-obrolan/per-topik yang sama seperti long polling, sehingga giliran agen yang lambat tidak menahan ACK pengiriman Telegram.

  </Accordion>

  <Accordion title="Batas, percobaan ulang, dan target CLI">
    - Default `channels.telegram.textChunkLimit` adalah 4000.
    - `channels.telegram.chunkMode="newline"` memprioritaskan batas paragraf (baris kosong) sebelum pemisahan panjang.
    - `channels.telegram.mediaMaxMb` (default 100) membatasi ukuran media Telegram masuk dan keluar.
    - `channels.telegram.timeoutSeconds` menimpa timeout klien API Telegram (jika tidak diatur, default grammY berlaku). Klien bot long-polling menjepit nilai terkonfigurasi di bawah penjaga permintaan `getUpdates` 45 detik agar polling idle tidak dibatalkan sebelum jendela polling 30 detik selesai.
    - Default `channels.telegram.pollingStallThresholdMs` adalah `120000`; sesuaikan antara `30000` dan `600000` hanya untuk restart polling-stall positif palsu.
    - riwayat konteks grup menggunakan `channels.telegram.historyLimit` atau `messages.groupChat.historyLimit` (default 50); `0` menonaktifkan.
    - konteks tambahan balasan/kutipan/terusan saat ini diteruskan sebagaimana diterima.
    - Allowlist Telegram terutama mengatur siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan penuh.
    - Kontrol riwayat DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - Konfigurasi `channels.telegram.retry` berlaku untuk helper kirim Telegram (CLI/tools/actions) untuk error API keluar yang dapat dipulihkan. Pengiriman balasan akhir masuk juga menggunakan percobaan ulang safe-send terbatas untuk kegagalan pra-koneksi Telegram, tetapi tidak mencoba ulang amplop jaringan pasca-kirim yang ambigu yang dapat menduplikasi pesan terlihat.

    Target kirim CLI dapat berupa ID obrolan numerik atau username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Poll Telegram menggunakan `openclaw message poll` dan mendukung topik forum:

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

    Kirim Telegram juga mendukung:

    - `--presentation` dengan blok `buttons` untuk keyboard inline saat `channels.telegram.capabilities.inlineButtons` mengizinkannya
    - `--pin` atau `--delivery '{"pin":true}'` untuk meminta pengiriman yang dipin saat bot dapat memin di obrolan tersebut
    - `--force-document` untuk mengirim gambar dan GIF keluar sebagai dokumen, bukan unggahan foto terkompresi atau media animasi

    Pembatasan tindakan:

    - `channels.telegram.actions.sendMessage=false` menonaktifkan pesan Telegram keluar, termasuk poll
    - `channels.telegram.actions.poll=false` menonaktifkan pembuatan poll Telegram sambil tetap mengaktifkan pengiriman reguler

  </Accordion>

  <Accordion title="Persetujuan exec di Telegram">
    Telegram mendukung persetujuan exec di DM pemberi persetujuan dan secara opsional dapat memposting prompt di obrolan atau topik asal. Pemberi persetujuan harus berupa ID pengguna Telegram numerik.

    Jalur konfigurasi:

    - `channels.telegram.execApprovals.enabled` (aktif otomatis ketika setidaknya satu pemberi persetujuan dapat diresolusikan)
    - `channels.telegram.execApprovals.approvers` (fallback ke ID owner numerik dari `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (default) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, dan `defaultTo` mengontrol siapa yang dapat berbicara dengan bot dan ke mana bot mengirim balasan normal. Itu tidak menjadikan seseorang pemberi persetujuan exec. Pemasangan DM yang disetujui pertama melakukan bootstrap `commands.ownerAllowFrom` ketika belum ada owner perintah, sehingga penyiapan satu-owner tetap bekerja tanpa menduplikasi ID di bawah `execApprovals.approvers`.

    Pengiriman channel menampilkan teks perintah di obrolan; aktifkan `channel` atau `both` hanya di grup/topik tepercaya. Ketika prompt masuk ke topik forum, OpenClaw mempertahankan topik untuk prompt persetujuan dan tindak lanjut. Persetujuan exec kedaluwarsa setelah 30 menit secara default.

    Tombol persetujuan inline juga memerlukan `channels.telegram.capabilities.inlineButtons` agar mengizinkan permukaan target (`dm`, `group`, atau `all`). ID persetujuan dengan prefiks `plugin:` diresolusikan melalui persetujuan Plugin; yang lain diresolusikan melalui persetujuan exec terlebih dahulu.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrol balasan error

Ketika agen mengalami error pengiriman atau provider, Telegram dapat membalas dengan teks error atau menyembunyikannya. Dua kunci konfigurasi mengontrol perilaku ini:

| Kunci                               | Nilai             | Default | Deskripsi                                                                                              |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` mengirim pesan error yang ramah ke obrolan. `silent` menyembunyikan balasan error sepenuhnya. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Waktu minimum antar balasan error ke obrolan yang sama. Mencegah spam error selama gangguan.          |

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
    - tinjau log: `openclaw logs --follow` untuk alasan skip

  </Accordion>

  <Accordion title="Perintah berfungsi sebagian atau tidak sama sekali">

    - otorisasi identitas pengirim Anda (pemasangan dan/atau `allowFrom` numerik)
    - otorisasi perintah tetap berlaku bahkan ketika kebijakan grup adalah `open`
    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu native memiliki terlalu banyak entri; kurangi perintah Plugin/skill/kustom atau nonaktifkan menu native
    - Panggilan startup `deleteMyCommands` / `setMyCommands` dibatasi dan dicoba ulang sekali melalui fallback transport Telegram saat request timeout. Error jaringan/fetch yang persisten biasanya menunjukkan masalah keterjangkauan DNS/HTTPS ke `api.telegram.org`

  </Accordion>

  <Accordion title="Startup melaporkan token tidak berwenang">

    - `getMe returned 401` adalah kegagalan autentikasi Telegram untuk token bot yang dikonfigurasi.
    - Salin ulang atau buat ulang token bot di BotFather, lalu perbarui `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, atau `TELEGRAM_BOT_TOKEN` untuk akun default.
    - `deleteWebhook 401 Unauthorized` selama startup juga merupakan kegagalan auth; memperlakukannya sebagai "tidak ada webhook" hanya akan menunda kegagalan token buruk yang sama ke panggilan API berikutnya.
    - Jika `deleteWebhook` gagal dengan error jaringan sementara selama startup polling, OpenClaw memeriksa `getWebhookInfo`; ketika Telegram melaporkan URL webhook kosong, polling berlanjut karena pembersihan sudah terpenuhi.

  </Accordion>

  <Accordion title="Ketidakstabilan polling atau jaringan">

    - Node 22+ + fetch/proxy kustom dapat memicu perilaku abort langsung jika tipe AbortSignal tidak cocok.
    - Beberapa host menyelesaikan `api.telegram.org` ke IPv6 terlebih dahulu; egress IPv6 yang rusak dapat menyebabkan kegagalan API Telegram secara berkala.
    - Jika log menyertakan `TypeError: fetch failed` atau `Network request for 'getUpdates' failed!`, OpenClaw sekarang mencoba ulang ini sebagai kesalahan jaringan yang dapat dipulihkan.
    - Jika socket Telegram didaur ulang dalam irama tetap yang singkat, periksa apakah `channels.telegram.timeoutSeconds` rendah; klien bot long-polling membatasi nilai yang dikonfigurasi di bawah pengaman permintaan `getUpdates`, tetapi rilis lama dapat membatalkan setiap poll ketika ini diatur di bawah timeout long-poll.
    - Jika log menyertakan `Polling stall detected`, OpenClaw memulai ulang polling dan membangun ulang transport Telegram setelah 120 detik tanpa liveness long-poll yang selesai secara default.
    - `openclaw channels status --probe` dan `openclaw doctor` memperingatkan ketika akun polling yang sedang berjalan belum menyelesaikan `getUpdates` setelah masa tenggang startup, ketika akun webhook yang sedang berjalan belum menyelesaikan `setWebhook` setelah masa tenggang startup, atau ketika aktivitas transport polling terakhir yang berhasil sudah basi.
    - Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya ketika panggilan `getUpdates` yang berjalan lama sehat tetapi host Anda masih melaporkan mulai ulang polling-stall palsu. Stall yang persisten biasanya menunjuk ke masalah proxy, DNS, IPv6, atau egress TLS antara host dan `api.telegram.org`.
    - Telegram juga menghormati env proxy proses untuk transport Bot API, termasuk `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan varian huruf kecilnya. `NO_PROXY` / `no_proxy` masih dapat melewati `api.telegram.org`.
    - Jika proxy terkelola OpenClaw dikonfigurasi melalui `OPENCLAW_PROXY_URL` untuk lingkungan layanan dan tidak ada env proxy standar, Telegram juga menggunakan URL tersebut untuk transport Bot API.
    - Pada host VPS dengan egress/TLS langsung yang tidak stabil, rutekan panggilan API Telegram melalui `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ default ke `autoSelectFamily=true` (kecuali WSL2) dan `dnsResultOrder=ipv4first`.
    - Jika host Anda adalah WSL2 atau secara eksplisit bekerja lebih baik dengan perilaku hanya IPv4, paksa pemilihan family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Jawaban rentang benchmark RFC 2544 (`198.18.0.0/15`) sudah diizinkan
      untuk unduhan media Telegram secara default. Jika fake-IP tepercaya atau
      proxy transparan menulis ulang `api.telegram.org` ke alamat
      privat/internal/penggunaan-khusus lain selama unduhan media, Anda dapat opt in
      ke bypass khusus Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Opt-in yang sama tersedia per akun di
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jika proxy Anda menyelesaikan host media Telegram ke `198.18.x.x`, biarkan
      flag berbahaya tetap nonaktif terlebih dahulu. Media Telegram sudah mengizinkan rentang
      benchmark RFC 2544 secara default.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` melemahkan perlindungan SSRF
      media Telegram. Gunakan hanya untuk lingkungan proxy tepercaya yang dikendalikan operator
      seperti routing fake-IP Clash, Mihomo, atau Surge ketika mereka
      mensintesis jawaban privat atau penggunaan-khusus di luar rentang benchmark
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

Bantuan lainnya: [Pemecahan masalah channel](/id/channels/troubleshooting).

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Telegram](/id/gateway/config-channels#telegram).

<Accordion title="Field Telegram bersinyal tinggi">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` harus menunjuk ke file reguler; symlink ditolak)
- kontrol akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` tingkat teratas (`type: "acp"`)
- persetujuan exec: `execApprovals`, `accounts.*.execApprovals`
- perintah/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/balasan: `replyToMode`
- streaming: `streaming` (pratinjau), `streaming.preview.toolProgress`, `blockStreaming`
- pemformatan/pengiriman: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/jaringan: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API kustom: `apiRoot` (hanya root Bot API; jangan sertakan `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- tindakan/kapabilitas: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaksi: `reactionNotifications`, `reactionLevel`
- kesalahan: `errorPolicy`, `errorCooldownMs`
- penulisan/riwayat: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Presedensi multi-akun: ketika dua atau lebih ID akun dikonfigurasi, atur `channels.telegram.defaultAccount` (atau sertakan `channels.telegram.accounts.default`) untuk membuat routing default eksplisit. Jika tidak, OpenClaw kembali ke ID akun ternormalisasi pertama dan `openclaw doctor` memperingatkan. Akun bernama mewarisi nilai `channels.telegram.allowFrom` / `groupAllowFrom`, tetapi bukan nilai `accounts.default.*`.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Telegram ke gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku allowlist grup dan topik.
  </Card>
  <Card title="Routing channel" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan hardening.
  </Card>
  <Card title="Routing multi-agen" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan grup dan topik ke agen.
  </Card>
  <Card title="Pemecahan masalah" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas-channel.
  </Card>
</CardGroup>
