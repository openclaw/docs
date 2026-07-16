---
read_when:
    - Mengerjakan fitur Telegram atau webhook
summary: Status dukungan, kemampuan, dan konfigurasi bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-16T17:54:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

Siap produksi untuk DM dan grup bot melalui grammY. Long polling adalah transport default; mode webhook bersifat opsional.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk Telegram adalah pemasangan.
  </Card>
  <Card title="Pemecahan masalah saluran" icon="wrench" href="/id/channels/troubleshooting">
    Panduan diagnostik dan perbaikan lintas saluran.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi saluran lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Buat token bot di BotFather">
    Kedua alur menghasilkan token yang ditempelkan ke OpenClaw — pilih salah satu:

    - **Alur chat**: buka Telegram, mulai chat dengan **@BotFather** (pastikan handle-nya tepat `@BotFather`), jalankan `/newbot`, ikuti petunjuknya, lalu simpan token.
    - **Alur web**: buka [aplikasi web BotFather](https://t.me/BotFather?startapp) — aplikasi ini berjalan di setiap klien Telegram, termasuk [web.telegram.org](https://web.telegram.org) — buat bot melalui UI, lalu salin tokennya.

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

    Fallback env: `TELEGRAM_BOT_TOKEN` (hanya akun default; akun bernama harus menggunakan `botToken` atau `tokenFile`).
    Telegram **tidak** menggunakan `openclaw channels login telegram`; tetapkan token dalam konfigurasi/env, lalu mulai Gateway.

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
    Tambahkan bot ke grup Anda, lalu dapatkan dua ID yang diperlukan untuk akses grup:

    - ID pengguna Telegram Anda, untuk `allowFrom` / `groupAllowFrom`
    - ID chat grup Telegram, sebagai kunci di bawah `channels.telegram.groups`

    Dapatkan ID chat grup dari `openclaw logs --follow`, bot ID penerusan, atau `getUpdates` Bot API. Setelah grup diizinkan, `/whoami@<bot_username>` mengonfirmasi ID pengguna dan grup.

    ID supergrup negatif yang diawali dengan `-100` adalah ID chat grup. ID tersebut ditempatkan di bawah `channels.telegram.groups`, bukan `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Resolusi token mempertimbangkan akun: `tokenFile` mengungguli `botToken` yang mengungguli env, dan konfigurasi selalu mengungguli `TELEGRAM_BOT_TOKEN` (yang hanya diresolusi untuk akun default). Setelah berhasil dimulai, OpenClaw menyimpan identitas bot dalam cache hingga 24 jam agar mulai ulang tidak memerlukan panggilan `getMe` tambahan; mengubah atau menghapus token akan menghapus cache tersebut.
</Note>

## Pengaturan sisi Telegram

<AccordionGroup>
  <Accordion title="Mode privasi dan visibilitas grup">
    Bot Telegram secara default menggunakan **Privacy Mode**, yang membatasi pesan grup yang diterimanya.

    Untuk melihat semua pesan grup, lakukan salah satu hal berikut:

    - nonaktifkan mode privasi melalui `/setprivacy`, atau
    - jadikan bot sebagai admin grup.

    Setelah mengubah mode privasi, hapus lalu tambahkan kembali bot di setiap grup agar Telegram menerapkan perubahan tersebut.

  </Accordion>

  <Accordion title="Izin grup">
    Status admin dikontrol dalam pengaturan grup Telegram. Bot admin menerima semua pesan grup, yang berguna untuk perilaku grup yang selalu aktif.
  </Accordion>

  <Accordion title="Pengaturan BotFather yang berguna">

    - `/setjoingroups` — izinkan/tolak penambahan ke grup
    - `/setprivacy` — perilaku visibilitas grup

    Pengaturan yang sama tersedia di [aplikasi web BotFather](https://t.me/BotFather?startapp) jika Anda lebih memilih UI daripada perintah chat.

  </Accordion>
</AccordionGroup>

## Mini App dasbor

Jalankan `/dashboard` dalam DM dengan bot untuk membuka dasbor OpenClaw di dalam Telegram.

Persyaratan:

- `gateway.tailscale.mode: "serve"` atau `"funnel"` untuk URL HTTPS Mini App yang dipublikasikan.
- ID pengguna Telegram numerik Anda harus tercantum dalam `allowFrom` efektif milik akun yang dipilih atau dalam `commands.ownerAllowFrom`.
- Gunakan DM. Dalam grup, `/dashboard` membalas dengan `open this in a DM with the bot` dan tidak mengirim tombol.
- Instalasi Docker: mode Serve/Funnel mengharuskan Gateway mengikat loopback di samping `tailscaled`, yang tidak dapat dipenuhi oleh jaringan bridge dengan port yang dipublikasikan. Jalankan kontainer Gateway dengan `network_mode: host` dan pasang soket `tailscaled` host (`/var/run/tailscale`) beserta CLI `tailscale` ke dalam kontainer.

Mini App merupakan jalur v1 khusus Tailscale dan tidak mendukung iframe Telegram Web.

## Kontrol akses dan aktivasi

### Identitas bot grup

Dalam grup dan topik forum, penyebutan eksplisit handle bot yang dikonfigurasi (misalnya `@my_bot`) ditujukan kepada agen OpenClaw yang dipilih, meskipun nama persona agen berbeda dari nama pengguna Telegram. Kebijakan senyap grup tetap berlaku untuk lalu lintas yang tidak terkait, tetapi handle bot itu sendiri tidak pernah dianggap sebagai "orang lain."

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.telegram.dmPolicy` mengontrol akses pesan langsung:

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu ID pengirim dalam `allowFrom`)
    - `open` (mengharuskan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `dmPolicy: "open"` dengan `allowFrom: ["*"]` memungkinkan setiap akun Telegram yang menemukan atau menebak nama pengguna bot untuk memerintah bot. Gunakan hanya untuk bot yang sengaja dibuat publik dengan alat yang dibatasi secara ketat; bot dengan satu pemilik sebaiknya menggunakan `allowlist` dengan ID pengguna numerik.

    `channels.telegram.allowFrom` menerima ID pengguna Telegram numerik. Prefiks `telegram:` / `tg:` diterima dan dinormalisasi.
    Dalam konfigurasi multiakun, `channels.telegram.allowFrom` tingkat atas yang restriktif merupakan batas keamanan: `allowFrom: ["*"]` tingkat akun tidak membuat akun tersebut publik kecuali daftar izin efektif hasil penggabungan masih berisi wildcard eksplisit.
    `dmPolicy: "allowlist"` dengan `allowFrom` kosong memblokir semua DM dan ditolak oleh validasi konfigurasi.
    Penyiapan hanya meminta ID pengguna numerik. Jika konfigurasi Anda memiliki entri daftar izin `@username` dari penyiapan lama, jalankan `openclaw doctor --fix` untuk meresolusinya menjadi ID numerik (upaya terbaik; memerlukan token bot Telegram).
    Jika sebelumnya Anda mengandalkan file daftar izin penyimpanan pemasangan, `openclaw doctor --fix` dapat memulihkan entri ke dalam `channels.telegram.allowFrom` untuk alur daftar izin (misalnya ketika `dmPolicy: "allowlist"` belum memiliki ID eksplisit).

    Untuk bot dengan satu pemilik, utamakan `dmPolicy: "allowlist"` dengan ID numerik `allowFrom` eksplisit daripada mengandalkan persetujuan pemasangan sebelumnya.

    Kebingungan umum: persetujuan pemasangan DM tidak berarti "pengirim ini diberi otorisasi di mana pun." Pemasangan hanya memberikan akses DM. Jika belum ada pemilik perintah, pemasangan pertama yang disetujui juga menetapkan `commands.ownerAllowFrom`, sehingga perintah khusus pemilik dan persetujuan eksekusi memiliki akun operator eksplisit. Otorisasi pengirim grup tetap berasal dari daftar izin konfigurasi eksplisit.
    Agar satu identitas diotorisasi untuk DM dan perintah grup: masukkan ID pengguna Telegram numerik Anda ke dalam `channels.telegram.allowFrom`, dan untuk perintah khusus pemilik, pastikan `commands.ownerAllowFrom` berisi `telegram:<your user id>`.

    ### Menemukan ID pengguna Telegram Anda

    Lebih aman (tanpa bot pihak ketiga): kirim DM ke bot Anda, jalankan `openclaw logs --follow`, lalu baca `from.id`.

    Metode Bot API resmi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Pihak ketiga (privasi lebih rendah): `@userinfobot` atau `@getidsbot`.

  </Tab>

  <Tab title="Kebijakan grup dan daftar izin">
    Dua kontrol berlaku secara bersamaan:

    1. **Grup mana yang diizinkan** (`channels.telegram.groups`)
       - tanpa konfigurasi `groups`, `groupPolicy: "open"`: grup apa pun lolos pemeriksaan ID grup
       - tanpa konfigurasi `groups`, `groupPolicy: "allowlist"` (default): semua grup diblokir hingga Anda menambahkan entri `groups` (atau `"*"`)
       - `groups` dikonfigurasi: bertindak sebagai daftar izin (ID eksplisit atau `"*"`)

    2. **Pengirim mana yang diizinkan dalam grup** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (default) / `disabled`

    `groupAllowFrom` memfilter pengirim grup; jika tidak ditetapkan, Telegram menggunakan `allowFrom` sebagai fallback (bukan penyimpanan pemasangan — autentikasi pengirim grup tidak pernah mewarisi persetujuan penyimpanan pemasangan DM, sebuah batas keamanan sejak `2026.2.25`).
    Entri `groupAllowFrom` harus berupa ID pengguna Telegram numerik (prefiks `telegram:` / `tg:` dinormalisasi); entri nonnumerik diabaikan. Jangan masukkan ID chat grup atau supergrup di sini — ID chat negatif ditempatkan di bawah `channels.telegram.groups`.
    Pola praktis untuk bot dengan satu pemilik: tetapkan ID pengguna Anda dalam `channels.telegram.allowFrom`, biarkan `groupAllowFrom` tidak ditetapkan, dan izinkan grup target di bawah `channels.telegram.groups`.
    Jika `channels.telegram` sama sekali tidak ada dalam konfigurasi, runtime secara default menggunakan `groupPolicy="allowlist"` yang tertutup jika gagal, kecuali `channels.defaults.groupPolicy` ditetapkan secara eksplisit.

    Penyiapan grup khusus pemilik:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Uji dari grup dengan `@<bot_username> ping`. Pesan grup biasa tidak memicu bot selama `requireMention: true`.

    Izinkan semua anggota dalam satu grup tertentu:

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

    Izinkan hanya pengguna tertentu dalam satu grup tertentu:

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
      Kesalahan umum: `groupAllowFrom` bukan daftar izin grup.

      - ID chat grup/supergrup Telegram negatif (`-1001234567890`) ditempatkan di bawah `channels.telegram.groups`.
      - ID pengguna Telegram (`8734062810`) ditempatkan di bawah `groupAllowFrom` untuk membatasi siapa saja di dalam grup yang diizinkan yang dapat memicu bot.
      - Gunakan `groupAllowFrom: ["*"]` hanya untuk mengizinkan semua anggota grup yang diizinkan berbicara dengan bot.

    </Warning>

  </Tab>

  <Tab title="Perilaku penyebutan">
    Balasan grup secara default memerlukan penyebutan. Penyebutan dapat berasal dari:

    - penyebutan `@botusername` native, atau
    - pola penyebutan dalam `agents.list[].groupChat.mentionPatterns` atau `messages.groupChat.mentionPatterns`

    Pengalih tingkat sesi (hanya status, tidak dipersistenkan): `/activation always`, `/activation mention`. Gunakan konfigurasi agar persisten:

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

    Konteks riwayat grup selalu aktif dan dibatasi oleh `historyLimit`. Tetapkan `channels.telegram.historyLimit: 0` untuk menonaktifkan jendela riwayat grup. `openclaw doctor --fix` menghapus kunci `includeGroupHistoryContext` yang telah dihentikan.

    Mendapatkan ID chat grup: teruskan pesan grup ke `@userinfobot` / `@getidsbot`, baca `chat.id` dari `openclaw logs --follow`, periksa `getUpdates` Bot API, atau (setelah grup diizinkan) jalankan `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Perilaku runtime

- Telegram berjalan di dalam proses Gateway.
- Perutean bersifat deterministik: balasan masuk Telegram dikirim kembali ke Telegram (model tidak memilih saluran).
- Pesan masuk dinormalisasi ke dalam amplop saluran bersama dengan metadata balasan, placeholder media, dan konteks rantai balasan tersimpan untuk balasan yang telah diamati Gateway.
- Sesi grup diisolasi berdasarkan ID grup. Topik forum menambahkan `:topic:<threadId>`.
- Pesan DM dapat membawa `message_thread_id`; OpenClaw mempertahankannya untuk balasan. Sesi topik DM dipisahkan hanya ketika `getMe` Telegram melaporkan `has_topics_enabled: true` untuk bot; jika tidak, DM tetap menggunakan sesi datar.
- Long polling menggunakan runner grammY dengan pengurutan per obrolan/per utas. Konkurensi sink runner menggunakan `agents.defaults.maxConcurrent`.
- Startup multiakun membatasi probe `getMe` serentak agar armada bot besar tidak menjalankan probe untuk setiap akun sekaligus.
- Setiap proses Gateway melindungi long polling sehingga hanya satu poller aktif yang dapat menggunakan token bot pada satu waktu. Konflik 409 `getUpdates` yang terus-menerus menunjukkan bahwa Gateway OpenClaw lain, skrip, atau poller eksternal menggunakan token yang sama.
- Secara default, watchdog polling memulai ulang setelah 120 detik tanpa liveness `getUpdates` yang selesai. Naikkan `channels.telegram.pollingStallThresholdMs` (30000-600000, penggantian per akun didukung) hanya jika deployment Anda mengalami mulai ulang palsu akibat polling macet selama pekerjaan yang berjalan lama.
- Telegram Bot API tidak mendukung tanda pesan telah dibaca (`sendReadReceipts` tidak berlaku).

<Note>
  `channels.telegram.dm.threadReplies` dan `channels.telegram.direct.<chatId>.threadReplies` telah dihapus. Jalankan `openclaw doctor --fix` setelah melakukan upgrade jika konfigurasi Anda masih memiliki kunci tersebut. Perutean topik DM kini mengikuti `getMe.has_topics_enabled` Telegram (dikendalikan oleh mode utas BotFather): bot yang mengaktifkan topik menggunakan sesi DM yang tercakup per utas ketika Telegram mengirim `message_thread_id`; DM lainnya tetap menggunakan sesi datar.
</Note>

## Referensi fitur

<AccordionGroup>
  <Accordion title="Pratinjau streaming langsung (pengeditan pesan)">
    OpenClaw melakukan streaming balasan parsial secara waktu nyata dalam obrolan langsung, grup, dan topik: mengirim pesan pratinjau, lalu melakukan `editMessageText` berulang kali, dan menyelesaikannya di tempat.

    - `channels.telegram.streaming` adalah `off | partial | block | progress` (default: `partial`)
    - pratinjau jawaban awal yang singkat ditunda dengan debounce, lalu diwujudkan setelah penundaan terbatas jika proses masih aktif
    - `progress` mempertahankan satu draf status yang dapat diedit untuk progres alat, menampilkan label status stabil ketika aktivitas jawaban tiba sebelum progres alat, menghapusnya saat selesai, dan mengirim jawaban akhir sebagai pesan normal
    - `streaming.preview.toolProgress` mengontrol apakah pembaruan alat/progres menggunakan kembali pesan pratinjau yang diedit yang sama (default: `true` ketika streaming pratinjau aktif)
    - `streaming.preview.commandText` mengontrol detail perintah/eksekusi di dalam baris tersebut: `raw` (default) atau `status` (hanya label alat)
    - `streaming.progress.commentary` (default: `false`) mengaktifkan teks komentar/pembuka asisten dalam draf progres sementara
    - `channels.telegram.streamMode` lama, nilai boolean `streaming`, dan kunci pratinjau draf native yang telah dihentikan akan terdeteksi; jalankan `openclaw doctor --fix` untuk memigrasikannya

    Baris progres alat adalah pembaruan status singkat yang ditampilkan saat alat berjalan (eksekusi perintah, pembacaan file, pembaruan perencanaan, ringkasan patch, pembuka/komentar Codex dalam mode app-server). Telegram mengaktifkannya secara default (sesuai dengan perilaku yang dirilis sejak `v2026.4.22`+).

    Pertahankan pengeditan pratinjau jawaban, tetapi sembunyikan baris progres alat:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    Pertahankan progres alat agar terlihat, tetapi sembunyikan teks perintah/eksekusi:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    Mode `progress` menampilkan progres alat tanpa mengedit jawaban akhir ke dalam pesan tersebut. Tempatkan kebijakan teks perintah di bawah `streaming.progress`:

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

    `streaming.mode: "off"` menonaktifkan pengeditan pratinjau dan menyembunyikan percakapan umum alat/progres alih-alih mengirimkannya sebagai pesan status mandiri; permintaan persetujuan, media, dan kesalahan tetap dirutekan melalui pengiriman akhir normal. `streaming.preview.toolProgress: false` hanya mempertahankan pengeditan pratinjau jawaban.

    <Note>
      Balasan kutipan terpilih merupakan pengecualian. Ketika `replyToMode` adalah `first`, `all`, atau `batched` dan pesan masuk memiliki teks kutipan terpilih, OpenClaw mengirim jawaban akhir melalui jalur balasan kutipan native Telegram alih-alih mengedit pratinjau jawaban, sehingga `streaming.preview.toolProgress` tidak dapat menampilkan baris status pada giliran tersebut. Balasan ke pesan saat ini tanpa teks kutipan terpilih tetap melakukan streaming. Tetapkan `replyToMode: "off"` ketika visibilitas progres alat lebih penting daripada balasan kutipan native, atau `streaming.preview.toolProgress: false` untuk menerima konsekuensi tersebut.
    </Note>

    Untuk balasan yang hanya berisi teks: pratinjau singkat menerima pengeditan akhir di tempat; hasil akhir panjang yang dibagi menjadi beberapa pesan menggunakan kembali pratinjau sebagai bagian pertama, lalu hanya mengirim sisanya; hasil akhir mode progres menghapus draf status dan menggunakan pengiriman akhir normal; jika pengeditan akhir gagal sebelum penyelesaian dikonfirmasi, OpenClaw beralih ke pengiriman akhir normal dan membersihkan pratinjau usang. Untuk balasan kompleks (payload media), OpenClaw selalu beralih ke pengiriman akhir normal dan membersihkan pratinjau.

    Streaming pratinjau dan streaming blok bersifat saling eksklusif — ketika streaming blok diaktifkan secara eksplisit, OpenClaw melewati streaming pratinjau untuk menghindari streaming ganda.

    Penalaran: `/reasoning stream` melakukan streaming penalaran ke pratinjau langsung selama pembuatan, lalu menghapus pratinjau penalaran setelah pengiriman akhir (gunakan `/reasoning on` agar tetap terlihat). Jawaban akhir dikirim tanpa teks penalaran.

  </Accordion>

  <Accordion title="Pemformatan pesan kaya">
    Secara default, teks keluar menggunakan pesan HTML Telegram standar yang dapat dibaca di semua klien saat ini: tebal, miring, tautan, kode, spoiler, kutipan — bukan blok khusus kaya Bot API 10.2 (tabel native, detail, media kaya, rumus).

    Aktifkan pesan kaya Bot API 10.2:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Ketika diaktifkan: agen diberi tahu bahwa pesan kaya tersedia untuk bot/akun ini (dengan kontrak penulisan Markdown + pulau HTML yang didukung); teks Markdown dirender melalui IR Markdown OpenClaw sebagai blok kaya Bot API 10.2 bertipe (judul, tabel, detail, daftar periksa, media kaya, rumus, peta, kolase); keterangan media tetap menggunakan keterangan HTML Telegram (pesan kaya tidak menggantikan keterangan, dan keterangan dibatasi hingga 1024 karakter).

    Hal ini menjauhkan teks model dari sigil Markdown kaya Telegram, sehingga mata uang seperti `$400-600K` tidak diuraikan sebagai matematika. Teks kaya yang panjang otomatis dibagi sesuai batas Telegram. Tabel yang melebihi batas 20 kolom akan beralih ke blok kode.

    Default: nonaktif, demi kompatibilitas klien — beberapa klien Desktop, Web, Android, dan pihak ketiga saat ini merender pesan kaya yang diterima sebagai tidak didukung. Biarkan ini nonaktif kecuali setiap klien yang digunakan bersama bot dapat merendernya. `/status` menunjukkan apakah pesan kaya aktif atau nonaktif untuk sesi saat ini.

    Pratinjau tautan aktif secara default. `channels.telegram.linkPreview: false` menonaktifkan deteksi entitas otomatis untuk teks kaya.

  </Accordion>

  <Accordion title="Perintah native dan perintah khusus">
    Menu perintah Telegram didaftarkan saat startup dengan `setMyCommands`. `commands.native: "auto"` mengaktifkan perintah native untuk Telegram.

    Tambahkan entri menu perintah khusus:

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

    Aturan: nama dinormalisasi (menghapus awalan `/`, menjadi huruf kecil); pola valid `a-z`, `0-9`, `_`, panjang 1-32; perintah khusus tidak dapat menggantikan perintah native; konflik/duplikat dilewati dan dicatat.

    Perintah khusus hanyalah entri menu — perintah tersebut tidak menerapkan perilaku secara otomatis. Perintah Plugin/skill tetap dapat berfungsi ketika diketik meskipun tidak ditampilkan dalam menu Telegram. Jika perintah native dinonaktifkan, perintah bawaan akan dihapus; perintah khusus/Plugin tetap dapat didaftarkan jika dikonfigurasi.

    Kegagalan penyiapan umum:

    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` setelah percobaan ulang pemangkasan berarti menu masih melampaui batas; kurangi perintah Plugin/skill/khusus atau nonaktifkan `channels.telegram.commands.native`.
    - Kegagalan `deleteWebhook`, `deleteMyCommands`, atau `setMyCommands` dengan `404: Not Found`, sementara perintah curl langsung Bot API berfungsi, biasanya berarti `channels.telegram.apiRoot` ditetapkan ke endpoint `/bot<TOKEN>` lengkap. `apiRoot` harus berupa root Bot API saja; `openclaw doctor --fix` menghapus akhiran `/bot<TOKEN>` yang tidak disengaja.
    - `getMe returned 401` berarti Telegram menolak token bot yang dikonfigurasi. Perbarui `botToken`, `tokenFile`, atau `TELEGRAM_BOT_TOKEN` (akun default) dengan token BotFather saat ini; OpenClaw berhenti sebelum polling sehingga hal ini tidak dilaporkan sebagai kegagalan pembersihan Webhook.
    - `setMyCommands failed` dengan kesalahan jaringan/fetch biasanya berarti DNS/HTTPS keluar ke `api.telegram.org` diblokir.

    ### Perintah penyandingan perangkat (Plugin `device-pair`)

    Ketika terpasang:

    1. `/pair` menghasilkan kode penyiapan
    2. tempelkan kode di aplikasi iOS
    3. `/pair pending` mencantumkan permintaan yang tertunda (termasuk peran/cakupan)
    4. setujui: `/pair approve <requestId>`, `/pair approve` (satu-satunya permintaan yang tertunda), atau `/pair approve latest`

    Jika perangkat mencoba kembali dengan detail autentikasi yang berubah (peran, cakupan, kunci publik), permintaan tertunda sebelumnya digantikan dengan `requestId` baru; jalankan kembali `/pair pending` sebelum menyetujui.

    Detail selengkapnya: [Penyandingan](/id/channels/pairing#pair-via-telegram).

  </Accordion>

  <Accordion title="Tombol sebaris">
    Konfigurasikan cakupan papan ketik sebaris:

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

    Penggantian per akun:

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

    Cakupan: `off`, `dm`, `group`, `all`, `allowlist` (default). `capabilities: ["inlineButtons"]` lama dipetakan ke `"all"`.

    Contoh tindakan pesan:

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

    Contoh tombol Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Buka aplikasi:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Luncurkan", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Tombol `web_app` hanya berfungsi dalam obrolan pribadi antara pengguna dan bot.

    Klik callback yang tidak diklaim oleh pengendali interaktif plugin terdaftar diteruskan ke agen sebagai teks: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Tindakan pesan Telegram untuk agen dan otomatisasi">
    Tindakan:

    - `sendMessage` (`to`, `content`, `mediaUrl` opsional, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` atau `caption`, tombol sebaris `presentation` opsional; pengeditan khusus tombol memperbarui markup balasan)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opsional, `iconCustomEmojiId`)

    Alias ergonomis: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Pembatasan: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (default: dinonaktifkan). `edit`, `createForumTopic`, dan `editForumTopic` diaktifkan secara default tanpa sakelar khusus.
    Pengiriman runtime menggunakan snapshot konfigurasi/rahasia aktif dari proses mulai/muat ulang, sehingga jalur tindakan tidak menyelesaikan ulang nilai `SecretRef` pada setiap pengiriman.

    Semantik penghapusan reaksi: [/tools/reactions](/id/tools/reactions).

  </Accordion>

  <Accordion title="Tag rangkaian balasan">
    Tag rangkaian balasan eksplisit dalam keluaran yang dihasilkan:

    - `[[reply_to_current]]` — membalas pesan pemicu
    - `[[reply_to:<id>]]` — membalas ID pesan tertentu

    `channels.telegram.replyToMode`: `off` (default), `first`, `all`.

    Saat rangkaian balasan diaktifkan dan teks/keterangan asli tersedia, OpenClaw otomatis menambahkan kutipan asli. Telegram membatasi teks kutipan asli hingga 1024 unit kode UTF-16; pesan yang lebih panjang dikutip dari awal dan beralih ke balasan biasa jika Telegram menolak kutipan tersebut.

    `off` hanya menonaktifkan rangkaian balasan implisit; tag `[[reply_to_*]]` eksplisit tetap dipatuhi.

  </Accordion>

  <Accordion title="Topik forum dan perilaku utas">
    Supergrup forum: kunci sesi topik menambahkan `:topic:<threadId>`; balasan dan indikator sedang mengetik diarahkan ke utas topik; jalur konfigurasi topik adalah `channels.telegram.groups.<chatId>.topics.<threadId>`.

    Topik umum (`threadId=1`) merupakan kasus khusus: pengiriman pesan menghilangkan `message_thread_id` (Telegram menolak `sendMessage(...thread_id=1)` dengan "utas tidak ditemukan"), tetapi tindakan mengetik tetap menyertakan `message_thread_id` (secara empiris diperlukan agar indikator sedang mengetik muncul).

    Entri topik mewarisi pengaturan grup kecuali ditimpa (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` hanya berlaku untuk topik dan tidak mewarisi default grup. `topics."*"` menetapkan default bagi setiap topik dalam grup tersebut; ID topik yang persis tetap mengungguli `"*"`.

    **Perutean agen per topik**: setiap topik dapat dirutekan ke agen yang berbeda melalui `agentId` dalam konfigurasi topik, sehingga memiliki ruang kerja, memori, dan sesinya sendiri:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Topik umum -> agen utama
                "3": { agentId: "zu" },        // Topik pengembangan -> agen zu
                "5": { agentId: "coder" }      // Tinjauan kode -> agen coder
              }
            }
          }
        }
      }
    }
    ```

    Setiap topik kemudian memiliki kunci sesinya sendiri, misalnya `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Pengikatan topik ACP persisten**: topik forum dapat menyematkan sesi harness ACP melalui pengikatan bertipe tingkat teratas (`bindings[]` dengan `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"`, dan ID berkualifikasi topik seperti `-1001234567890:topic:42`). Saat ini cakupannya terbatas pada topik forum dalam grup/supergrup. Lihat [Agen ACP](/id/tools/acp-agents).

    **Pemunculan ACP yang terikat utas dari obrolan**: `/acp spawn <agent> --thread here|auto` mengikat topik saat ini ke sesi ACP baru; tindak lanjut dirutekan langsung ke sana, dan OpenClaw menyematkan konfirmasi pemunculan dalam topik. Memerlukan `channels.telegram.threadBindings.spawnSessions` (default: `true`).

    Konteks templat mengekspos `MessageThreadId` dan `IsForum`. Obrolan DM dengan `message_thread_id` mempertahankan metadata balasan, tetapi hanya menggunakan kunci sesi yang menyadari utas saat `getMe` Telegram melaporkan `has_topics_enabled: true`.
    Penimpaan `dm.threadReplies` dan `direct.*.threadReplies` yang telah dihentikan sudah dihapus; mode berutas BotFather menjadi satu-satunya sumber kebenaran. Jalankan `openclaw doctor --fix` untuk menghapus kunci konfigurasi usang.

  </Accordion>

  <Accordion title="Audio, video, dan stiker">
    ### Pesan audio

    Telegram membedakan catatan suara dari berkas audio. Default: perilaku berkas audio; gunakan tag `[[audio_as_voice]]` dalam balasan agen untuk memaksa pengiriman catatan suara. Transkrip catatan suara masuk dibingkai sebagai teks buatan mesin yang tidak tepercaya dalam konteks agen, tetapi deteksi penyebutan tetap menggunakan transkrip mentah agar pesan suara yang dibatasi penyebutan tetap berfungsi.

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

    Telegram membedakan berkas video dari catatan video. Catatan video tidak mendukung keterangan; teks pesan yang diberikan dikirim secara terpisah.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Lokasi dan tempat

    Gunakan tindakan `send` yang ada dengan satu objek `location` mandiri. Koordinat mengirim pin asli; menambahkan `name` dan `address` akan mengirim kartu tempat asli. Pengiriman lokasi tidak dapat digabungkan dengan teks pesan atau media.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Eiffel Tower",
    address: "Champ de Mars, Paris",
  },
}
```

    ### Stiker

    Masuk: WEBP statis diunduh dan diproses (placeholder `<media:sticker>`); TGS animasi dan WEBM video dilewati.

    Bidang konteks stiker: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Deskripsi disimpan dalam cache di status plugin SQLite OpenClaw untuk mengurangi panggilan visi berulang.

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

    Kirim:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Cari stiker yang tersimpan dalam cache:

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
    Reaksi Telegram masuk sebagai pembaruan `message_reaction`, terpisah dari muatan pesan. Saat diaktifkan, OpenClaw mengantrekan peristiwa sistem seperti `Telegram reaction added: 👍 by Alice (@alice) on msg 42`.

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    `own` berarti hanya reaksi pengguna terhadap pesan yang dikirim bot (upaya terbaik melalui cache pesan terkirim). Peristiwa reaksi tetap mematuhi kontrol akses Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); pengirim yang tidak berwenang akan diabaikan.

    Telegram tidak menyediakan ID utas dalam pembaruan reaksi: grup nonforum dirutekan ke sesi obrolan grup; grup forum dirutekan ke sesi topik umum (`:topic:1`), bukan ke topik asal yang persis.

    `allowed_updates` untuk polling/webhook menyertakan `message_reaction` secara otomatis.

  </Accordion>

  <Accordion title="Reaksi pengakuan">
    `ackReaction` mengirim emoji pengakuan saat OpenClaw memproses pesan masuk. `messages.ackReactionScope` menentukan *kapan* emoji tersebut dikirim.

    **Urutan resolusi emoji:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak "👀")

    Telegram mengharapkan emoji unicode (misalnya "👀"); gunakan `""` untuk menonaktifkan reaksi bagi suatu saluran atau akun.

    **Cakupan (`messages.ackReactionScope`, default `"group-mentions"`; saat ini tidak ada penimpaan akun Telegram atau saluran Telegram):**

    `all` (DM + grup, termasuk peristiwa ruang ambien), `direct` (hanya DM), `group-all` (setiap pesan grup kecuali peristiwa ruang ambien, tanpa DM), `group-mentions` (grup saat bot disebut; **tanpa DM** — default), `off` / `none` (dinonaktifkan).

    <Note>
    Cakupan default (`group-mentions`) tidak memicu reaksi pengakuan dalam DM atau peristiwa ruang ambien. Gunakan `direct` atau `all` untuk DM; hanya `all` yang mengakui peristiwa ruang ambien. Nilai ini dibaca saat penyedia Telegram dimulai, sehingga Gateway harus dimulai ulang agar perubahan diterapkan.
    </Note>

  </Accordion>

  <Accordion title="Penulisan konfigurasi dari peristiwa dan perintah Telegram">
    Penulisan konfigurasi saluran diaktifkan secara default (`configWrites !== false`). Penulisan yang dipicu Telegram mencakup peristiwa migrasi grup (`migrate_to_chat_id`, memperbarui `channels.telegram.groups`) dan `/config set` / `/config unset` (memerlukan pengaktifan perintah).

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

  <Accordion title="Long polling dibandingkan dengan webhook">
    Defaultnya adalah long polling. Untuk mode webhook, tetapkan `channels.telegram.webhookUrl` dan `channels.telegram.webhookSecret`; `webhookPath` opsional (default `/telegram-webhook`), `webhookHost` (default `127.0.0.1`), `webhookPort` (default `8787`), `webhookCertPath` (PEM sertifikat yang ditandatangani sendiri untuk penyiapan IP langsung atau tanpa domain).

    Dalam mode long polling, OpenClaw menyimpan penanda mulai ulang hanya setelah pembaruan berhasil dikirimkan; pengendali yang gagal membiarkan pembaruan tersebut dapat dicoba ulang dalam proses yang sama alih-alih menandainya selesai.

    Listener lokal terikat ke `127.0.0.1:8787` secara default. Untuk ingress publik, tempatkan proksi terbalik di depan port lokal, atau tetapkan `webhookHost: "0.0.0.0"` secara sengaja.

    Mode webhook memvalidasi pengaman permintaan, token rahasia Telegram, dan isi JSON, lalu melakukan commit pembaruan ke antrean ingress durabel sebelum mengembalikan `200` kosong. Adopsi durabel yang berhasil menyertakan `x-openclaw-delivery-accepted: durable`; respons kesehatan, perutean, autentikasi, validasi, dan kesalahan penyimpanan tidak menyertakan header ini. Proksi terbalik dan pengontrol host dapat mewajibkan header tersebut untuk membedakan adopsi OpenClaw dari `200` kosong generik tanpa menyimpulkan penerimaan berdasarkan waktu respons.

    OpenClaw kemudian memproses pembaruan secara asinkron melalui lane bot per obrolan/per topik yang sama seperti yang digunakan oleh long polling, sehingga giliran agen yang lambat tidak menahan ACK pengiriman Telegram.

  </Accordion>

  <Accordion title="Batas, percobaan ulang, dan target CLI">
    - `channels.telegram.textChunkLimit` bawaan 4000; `streaming.chunkMode="newline"` mengutamakan batas paragraf (baris kosong) sebelum pemisahan berdasarkan panjang.
    - `channels.telegram.mediaMaxMb` (bawaan 100) membatasi ukuran media masuk dan keluar.
    - `channels.telegram.mediaGroupFlushMs` (bawaan 500, rentang 10-60000) mengontrol berapa lama album/grup media ditampung sebelum OpenClaw mengirimkannya sebagai satu pesan masuk. Tingkatkan jika bagian album tiba terlambat; kurangi untuk mengurangi latensi balasan album.
    - `channels.telegram.timeoutSeconds` mengganti batas waktu klien API (bawaan grammY berlaku jika tidak ditetapkan). Klien bot membatasi nilai yang dikonfigurasi di bawah pengaman permintaan teks keluar/pengetikan 60 detik agar grammY tidak membatalkan pengiriman balasan yang terlihat sebelum pengaman transportasi dan mekanisme cadangan OpenClaw dapat berjalan. Long polling tetap menggunakan pengaman permintaan `getUpdates` selama 45 detik agar polling menganggur tidak dibiarkan tanpa batas waktu.
    - `channels.telegram.pollingStallThresholdMs` secara bawaan bernilai 120000; sesuaikan antara 30000 dan 600000 hanya untuk mulai ulang akibat deteksi macet polling positif palsu.
    - riwayat konteks grup menggunakan `channels.telegram.historyLimit` atau `messages.groupChat.historyLimit` (bawaan 50); `0` menonaktifkannya.
    - konteks tambahan balasan/kutipan/penerusan dinormalisasi menjadi satu jendela konteks percakapan yang dipilih ketika Gateway telah mengamati pesan induk; cache pesan yang diamati berada dalam status Plugin SQLite OpenClaw, dan `openclaw doctor --fix` mengimpor file pendamping lama. Telegram hanya menyertakan satu `reply_to_message` dangkal per pembaruan, sehingga rantai yang lebih lama daripada cache dibatasi pada muatan tersebut.
    - daftar izin Telegram terutama membatasi siapa yang dapat memicu agen, bukan merupakan batas penyuntingan konteks tambahan secara menyeluruh.
    - riwayat DM: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` berlaku pada pembantu pengiriman Telegram (CLI/alat/tindakan) untuk kesalahan API keluar yang dapat dipulihkan. Pengiriman balasan akhir masuk menggunakan percobaan ulang pengiriman aman yang terbatas untuk kegagalan sebelum koneksi, tetapi tidak mencoba ulang amplop jaringan ambigu setelah pengiriman yang dapat menduplikasi pesan yang terlihat.

    Target pengiriman CLI dan alat pesan menerima ID obrolan numerik, nama pengguna, atau target topik forum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Jajak pendapat menggunakan `openclaw message poll` dan mendukung topik forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Kirim?" --poll-option "Ya" --poll-option "Tidak"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pilih waktu" --poll-option "10 pagi" --poll-option "2 siang" \
  --poll-duration-seconds 300 --poll-public
```

    Flag jajak pendapat khusus Telegram: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (atau target `:topic:`). `--poll-option` mengulangi 2-12 kali (batas opsi Telegram).

    Pengiriman Telegram juga mendukung `--presentation` dengan blok `buttons` untuk papan ketik sebaris (ketika `channels.telegram.capabilities.inlineButtons` mengizinkannya), `--pin` atau `--delivery '{"pin":true}'` untuk meminta pengiriman yang disematkan ketika bot dapat menyematkan pesan dalam obrolan tersebut, dan `--force-document` untuk mengirim gambar, GIF, serta video keluar sebagai dokumen alih-alih unggahan terkompresi/animasi/video.

    Pembatasan tindakan: `channels.telegram.actions.sendMessage=false` menonaktifkan semua pesan keluar termasuk jajak pendapat; `channels.telegram.actions.poll=false` menonaktifkan pembuatan jajak pendapat dengan tetap mengaktifkan pengiriman biasa.

  </Accordion>

  <Accordion title="Persetujuan eksekusi di Telegram">
    Telegram mendukung persetujuan eksekusi dalam DM pemberi persetujuan dan secara opsional dapat memposting permintaan dalam obrolan atau topik asal. Pemberi persetujuan harus berupa ID pengguna Telegram numerik.

    - `channels.telegram.execApprovals.enabled` (`"auto"` mengaktifkannya ketika setidaknya satu pemberi persetujuan dapat diidentifikasi)
    - `channels.telegram.execApprovals.approvers` (beralih ke ID pemilik numerik dari `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (bawaan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, dan `defaultTo` mengontrol siapa yang dapat berkomunikasi dengan bot dan ke mana bot mengirim balasan biasa — pengaturan tersebut tidak menjadikan seseorang sebagai pemberi persetujuan eksekusi. Pemasangan DM pertama yang disetujui melakukan bootstrap pada `commands.ownerAllowFrom` ketika belum ada pemilik perintah, sehingga penyiapan dengan satu pemilik berfungsi tanpa menduplikasi ID di bawah `execApprovals.approvers`.

    Pengiriman saluran menampilkan teks perintah dalam obrolan; aktifkan `channel` atau `both` hanya dalam grup/topik tepercaya. Ketika permintaan masuk ke topik forum, OpenClaw mempertahankan topik untuk permintaan persetujuan dan tindak lanjut. Persetujuan eksekusi secara bawaan kedaluwarsa setelah 30 menit.

    Tombol persetujuan sebaris juga mengharuskan `channels.telegram.capabilities.inlineButtons` mengizinkan permukaan target (`dm`, `group`, atau `all`). ID persetujuan dengan awalan `plugin:` diselesaikan melalui persetujuan Plugin; ID lainnya diselesaikan melalui persetujuan eksekusi terlebih dahulu.

    Lihat [Persetujuan eksekusi](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrol balasan kesalahan

Ketika agen mengalami kesalahan pengiriman atau penyedia, kebijakan kesalahan mengontrol apakah pesan kesalahan sampai ke obrolan Telegram:

| Kunci                               | Nilai                      | Bawaan          | Deskripsi                                                                                                                                                                                               |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` mengirim setiap pesan kesalahan ke obrolan. `once` mengirim setiap pesan kesalahan unik satu kali per jendela jeda (menekan kesalahan identik yang berulang). `silent` tidak pernah mengirim pesan kesalahan ke obrolan. |
| `channels.telegram.errorCooldownMs` | angka (md)                 | `14400000` (4j) | Jendela jeda untuk kebijakan `once`. Setelah kesalahan dikirim, pesan yang sama ditekan hingga interval ini berlalu. Mencegah spam kesalahan selama gangguan.                                           |

Penggantian per akun, per grup, dan per topik didukung (pewarisan yang sama seperti kunci konfigurasi Telegram lainnya).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // tekan kesalahan dalam grup ini
        },
      },
    },
  },
}
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bot tidak merespons pesan grup tanpa penyebutan">

    - Jika `requireMention=false`, mode privasi Telegram harus mengizinkan visibilitas penuh: BotFather `/setprivacy` -> Disable, lalu hapus dan tambahkan kembali bot ke grup.
    - `openclaw channels status` memberikan peringatan ketika konfigurasi mengharapkan pesan grup tanpa penyebutan.
    - `openclaw channels status --probe` memeriksa ID grup numerik eksplisit; wildcard `"*"` tidak dapat diperiksa keanggotaannya.
    - Pengujian sesi cepat: `/activation always`.

  </Accordion>

  <Accordion title="Bot sama sekali tidak melihat pesan grup">

    - Ketika `channels.telegram.groups` ada, grup harus dicantumkan (atau menyertakan `"*"`).
    - Verifikasi keanggotaan bot dalam grup.
    - Tinjau `openclaw logs --follow` untuk mengetahui alasan dilewati.

  </Accordion>

  <Accordion title="Perintah hanya berfungsi sebagian atau tidak sama sekali">

    - Otorisasi identitas pengirim Anda (pemasangan dan/atau `allowFrom` numerik); otorisasi perintah tetap berlaku bahkan ketika kebijakan grup adalah `open`.
    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu asli memiliki terlalu banyak entri; kurangi perintah Plugin/Skills/kustom atau nonaktifkan menu asli.
    - Panggilan awal `deleteMyCommands` / `setMyCommands` dan panggilan pengetikan `sendChatAction` dibatasi dan dicoba ulang satu kali melalui mekanisme cadangan transportasi Telegram saat batas waktu permintaan tercapai. Kesalahan jaringan/fetch yang terus terjadi biasanya berarti DNS/HTTPS ke `api.telegram.org` tidak dapat dijangkau.

  </Accordion>

  <Accordion title="Proses awal melaporkan token tidak sah">

    - `getMe returned 401` adalah kegagalan autentikasi Telegram untuk token bot yang dikonfigurasi. Salin ulang atau buat ulang token di BotFather, lalu perbarui `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken`, atau `TELEGRAM_BOT_TOKEN` (akun bawaan).
    - `deleteWebhook 401 Unauthorized` selama proses awal juga merupakan kegagalan autentikasi; memperlakukannya sebagai "tidak ada webhook" hanya akan menunda kegagalan token buruk yang sama hingga panggilan API berikutnya.

  </Accordion>

  <Accordion title="Ketidakstabilan polling atau jaringan">

    - Node 22+ dengan fetch/proksi khusus dapat memicu perilaku pembatalan langsung jika tipe `AbortSignal` tidak cocok.
    - Beberapa host menguraikan `api.telegram.org` ke IPv6 terlebih dahulu; jalur keluar IPv6 yang rusak menyebabkan kegagalan API berselang.
    - Log dengan `TypeError: fetch failed` atau `Network request for 'getUpdates' failed!` dicoba ulang sebagai kesalahan jaringan yang dapat dipulihkan.
    - Selama proses awal polling, OpenClaw menggunakan kembali pemeriksaan `getMe` awal yang berhasil untuk grammY sehingga runner tidak memerlukan `getMe` kedua sebelum `getUpdates` pertama.
    - Jika `deleteWebhook` gagal akibat kesalahan jaringan sementara selama proses awal polling, OpenClaw melanjutkan ke long polling alih-alih melakukan panggilan bidang kontrol lain sebelum polling. Webhook yang masih aktif kemudian muncul sebagai konflik `getUpdates`; OpenClaw membangun ulang transportasi dan mencoba kembali pembersihan webhook.
    - Jika soket Telegram didaur ulang dalam interval tetap yang singkat, periksa apakah `channels.telegram.timeoutSeconds` rendah — klien bot membatasi nilai yang dikonfigurasi di bawah pengaman permintaan keluar dan `getUpdates`, tetapi rilis yang lebih lama dapat membatalkan setiap polling atau balasan ketika nilai ini ditetapkan di bawah pengaman tersebut.
    - `Polling stall detected` dalam log berarti OpenClaw memulai ulang polling dan membangun ulang transportasi setelah secara bawaan 120 detik tanpa kelangsungan long polling yang selesai.
    - `openclaw channels status --probe` dan `openclaw doctor` memberikan peringatan ketika akun polling yang berjalan belum menyelesaikan `getUpdates` setelah masa tenggang proses awal, akun webhook yang berjalan belum menyelesaikan `setWebhook` setelah masa tenggang proses awal, atau aktivitas transportasi polling terakhir yang berhasil sudah kedaluwarsa.
    - Naikkan `channels.telegram.pollingStallThresholdMs` hanya ketika panggilan `getUpdates` yang berjalan lama dalam keadaan sehat tetapi host Anda masih melaporkan mulai ulang akibat polling macet positif palsu. Kemacetan yang terus terjadi biasanya menunjukkan masalah proksi, DNS, IPv6, atau jalur keluar TLS ke `api.telegram.org`.
    - Telegram mematuhi env proksi proses untuk transportasi Bot API: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan varian huruf kecil. `NO_PROXY` / `no_proxy` masih dapat melewati `api.telegram.org`.
    - Jika `OPENCLAW_PROXY_URL` ditetapkan untuk lingkungan layanan dan tidak ada env proksi standar, Telegram juga menggunakan URL tersebut untuk transportasi Bot API.
    - Pada host VPS dengan jalur keluar langsung/TLS yang tidak stabil, arahkan panggilan API Telegram melalui proksi:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ secara default menggunakan `autoSelectFamily=true` (kecuali WSL2). Urutan hasil DNS Telegram mengikuti `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, lalu `channels.telegram.network.dnsResultOrder`, kemudian default proses (misalnya `NODE_OPTIONS=--dns-result-order=ipv4first`), dengan fallback ke `ipv4first` pada Node 22+ jika tidak ada yang berlaku.
    - Di WSL2, atau ketika perilaku khusus IPv4 bekerja lebih baik, paksa pemilihan keluarga:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Jawaban rentang tolok ukur RFC 2544 (`198.18.0.0/15`) sudah diizinkan secara default untuk pengunduhan media Telegram. Jika fake-IP tepercaya atau proksi transparan menulis ulang `api.telegram.org` menjadi alamat privat/internal/penggunaan khusus lainnya selama pengunduhan media, aktifkan bypass khusus Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Opsi yang sama tersedia per akun di `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jika proksi Anda me-resolve host media Telegram ke `198.18.x.x`, biarkan flag berbahaya tetap nonaktif terlebih dahulu — rentang tersebut sudah diizinkan secara default.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` memperlemah perlindungan SSRF media Telegram. Gunakan hanya untuk lingkungan proksi tepercaya yang dikendalikan operator (perutean fake-IP Clash, Mihomo, Surge) yang menyintesis jawaban privat atau penggunaan khusus di luar rentang tolok ukur RFC 2544. Biarkan tetap nonaktif untuk akses Telegram normal melalui internet publik.
    </Warning>

    - Override lingkungan sementara: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - Validasi jawaban DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Bantuan lainnya: [Pemecahan masalah saluran](/id/channels/troubleshooting).

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Telegram](/id/gateway/config-channels#telegram).

<Accordion title="Kolom Telegram dengan sinyal tinggi">

- startup/autentikasi: `enabled`, `botToken`, `tokenFile` (harus berupa berkas biasa; symlink ditolak), `accounts.*`
- kontrol akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, tingkat teratas `bindings[]` (`type: "acp"`)
- default topik: `groups.<chatId>.topics."*"` berlaku untuk topik forum yang tidak cocok; ID topik yang tepat akan menimpanya
- persetujuan exec: `execApprovals`, `accounts.*.execApprovals`
- perintah/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- utas/balasan: `replyToMode`, `threadBindings`
- streaming: `streaming` (mode `off | partial | block | progress`), `streaming.preview.toolProgress`
- pemformatan/pengiriman: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- media/jaringan: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API khusus: `apiRoot` (hanya root Bot API; jangan sertakan `/bot<TOKEN>`), `trustedLocalFileRoots` (root absolut `file_path` untuk Bot API yang di-host sendiri)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- tindakan/kapabilitas: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- reaksi: `reactionNotifications`, `reactionLevel`
- kesalahan: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- penulisan/riwayat: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Prioritas multi-akun: dengan dua ID akun atau lebih yang dikonfigurasi, tetapkan `channels.telegram.defaultAccount` (atau sertakan `channels.telegram.accounts.default`) agar perutean default dinyatakan secara eksplisit. Jika tidak, OpenClaw menggunakan ID akun ternormalisasi pertama sebagai fallback dan `openclaw doctor` akan memberikan peringatan. Akun bernama mewarisi `channels.telegram.allowFrom` / `groupAllowFrom`, tetapi tidak mewarisi nilai `accounts.default.*`.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Telegram ke Gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku daftar izin grup dan topik.
  </Card>
  <Card title="Perutean saluran" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan penguatan keamanan.
  </Card>
  <Card title="Perutean multi-agen" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan grup dan topik ke agen.
  </Card>
  <Card title="Pemecahan masalah" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas saluran.
  </Card>
</CardGroup>
