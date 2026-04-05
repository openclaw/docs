---
read_when:
    - Mengerjakan fitur channel Discord
summary: Status dukungan bot Discord, kemampuan, dan konfigurasi
title: Discord
x-i18n:
    generated_at: "2026-04-05T13:44:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e757d321d80d05642cd9e24b51fb47897bacaf8db19df83bd61a49a8ce51ed3a
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Status: siap untuk DM dan channel guild melalui gateway Discord resmi.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    DM Discord secara default menggunakan mode pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    Diagnostik lintas-channel dan alur perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

Anda perlu membuat aplikasi baru dengan bot, menambahkan bot ke server Anda, dan memasangkannya ke OpenClaw. Kami merekomendasikan menambahkan bot Anda ke server privat Anda sendiri. Jika Anda belum memilikinya, [buat dulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (pilih **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    Buka [Discord Developer Portal](https://discord.com/developers/applications) dan klik **New Application**. Beri nama seperti "OpenClaw".

    Klik **Bot** di sidebar. Atur **Username** ke nama apa pun yang Anda gunakan untuk agen OpenClaw Anda.

  </Step>

  <Step title="Enable privileged intents">
    Masih di halaman **Bot**, gulir ke bawah ke **Privileged Gateway Intents** lalu aktifkan:

    - **Message Content Intent** (wajib)
    - **Server Members Intent** (disarankan; wajib untuk allowlist role dan pencocokan nama ke ID)
    - **Presence Intent** (opsional; hanya diperlukan untuk pembaruan presence)

  </Step>

  <Step title="Copy your bot token">
    Gulir kembali ke atas pada halaman **Bot** lalu klik **Reset Token**.

    <Note>
    Meski namanya begitu, ini membuat token pertama Anda — tidak ada yang sedang "di-reset."
    </Note>

    Salin token tersebut dan simpan di suatu tempat. Ini adalah **Bot Token** Anda dan Anda akan segera membutuhkannya.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Klik **OAuth2** di sidebar. Anda akan membuat URL undangan dengan izin yang tepat untuk menambahkan bot ke server Anda.

    Gulir ke bawah ke **OAuth2 URL Generator** lalu aktifkan:

    - `bot`
    - `applications.commands`

    Bagian **Bot Permissions** akan muncul di bawahnya. Aktifkan:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opsional)

    Salin URL yang dihasilkan di bagian bawah, tempelkan ke browser Anda, pilih server Anda, lalu klik **Continue** untuk menghubungkan. Anda sekarang seharusnya melihat bot Anda di server Discord.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    Kembali ke aplikasi Discord, Anda perlu mengaktifkan Developer Mode agar dapat menyalin ID internal.

    1. Klik **User Settings** (ikon roda gigi di sebelah avatar Anda) → **Advanced** → aktifkan **Developer Mode**
    2. Klik kanan **ikon server** Anda di sidebar → **Copy Server ID**
    3. Klik kanan **avatar Anda sendiri** → **Copy User ID**

    Simpan **Server ID** dan **User ID** Anda bersama Bot Token — Anda akan mengirim ketiganya ke OpenClaw pada langkah berikutnya.

  </Step>

  <Step title="Allow DMs from server members">
    Agar pairing berfungsi, Discord perlu mengizinkan bot Anda mengirim DM kepada Anda. Klik kanan **ikon server** Anda → **Privacy Settings** → aktifkan **Direct Messages**.

    Ini memungkinkan anggota server (termasuk bot) mengirim DM kepada Anda. Biarkan ini tetap aktif jika Anda ingin menggunakan DM Discord dengan OpenClaw. Jika Anda hanya berencana menggunakan channel guild, Anda dapat menonaktifkan DM setelah pairing.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    Token bot Discord Anda adalah rahasia (seperti kata sandi). Tetapkan token tersebut pada mesin yang menjalankan OpenClaw sebelum mengirim pesan ke agen Anda.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Jika OpenClaw sudah berjalan sebagai layanan latar belakang, mulai ulang melalui aplikasi OpenClaw Mac atau dengan menghentikan dan menjalankan kembali proses `openclaw gateway run`.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        Chat dengan agen OpenClaw Anda di channel yang sudah ada (misalnya Telegram) dan beri tahu. Jika Discord adalah channel pertama Anda, gunakan tab CLI / config.

        > "Saya sudah menetapkan token bot Discord saya di config. Tolong selesaikan penyiapan Discord dengan User ID `<user_id>` dan Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Jika Anda lebih suka konfigurasi berbasis file, tetapkan:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Fallback env untuk akun default:

```bash
DISCORD_BOT_TOKEN=...
```

        Nilai `token` plaintext didukung. Nilai SecretRef juga didukung untuk `channels.discord.token` pada provider env/file/exec. Lihat [Secrets Management](/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approve first DM pairing">
    Tunggu hingga gateway berjalan, lalu kirim DM ke bot Anda di Discord. Bot akan merespons dengan kode pairing.

    <Tabs>
      <Tab title="Ask your agent">
        Kirim kode pairing ke agen Anda di channel yang sudah ada:

        > "Setujui kode pairing Discord ini: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kode pairing kedaluwarsa setelah 1 jam.

    Anda sekarang seharusnya dapat chat dengan agen Anda di Discord melalui DM.

  </Step>
</Steps>

<Note>
Resolusi token memperhatikan akun. Nilai token di config lebih diutamakan daripada fallback env. `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Untuk panggilan keluar tingkat lanjut (aksi message tool/channel), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk aksi gaya kirim dan baca/probe (misalnya read/search/fetch/thread/pins/permissions). Pengaturan kebijakan akun/retry tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Rekomendasi: Siapkan workspace guild

Setelah DM berfungsi, Anda dapat menyiapkan server Discord Anda sebagai workspace penuh, di mana setiap channel mendapatkan sesi agen tersendiri dengan konteksnya sendiri. Ini direkomendasikan untuk server privat yang hanya berisi Anda dan bot Anda.

<Steps>
  <Step title="Add your server to the guild allowlist">
    Ini memungkinkan agen Anda merespons di channel mana pun pada server Anda, bukan hanya DM.

    <Tabs>
      <Tab title="Ask your agent">
        > "Tambahkan Server ID Discord saya `<server_id>` ke guild allowlist"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Allow responses without @mention">
    Secara default, agen Anda hanya merespons di channel guild saat di-@mention. Untuk server privat, Anda kemungkinan ingin agen merespons setiap pesan.

    <Tabs>
      <Tab title="Ask your agent">
        > "Izinkan agen saya merespons di server ini tanpa harus di-@mention"
      </Tab>
      <Tab title="Config">
        Tetapkan `requireMention: false` di config guild Anda:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    Secara default, memori jangka panjang (MEMORY.md) hanya dimuat dalam sesi DM. Channel guild tidak otomatis memuat MEMORY.md.

    <Tabs>
      <Tab title="Ask your agent">
        > "Saat saya mengajukan pertanyaan di channel Discord, gunakan memory_search atau memory_get jika Anda memerlukan konteks jangka panjang dari MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Jika Anda memerlukan konteks bersama di setiap channel, letakkan instruksi yang stabil di `AGENTS.md` atau `USER.md` (keduanya disuntikkan untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan dengan memory tools.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat beberapa channel di server Discord Anda dan mulailah chat. Agen Anda dapat melihat nama channel, dan setiap channel mendapatkan sesi terisolasi sendiri — jadi Anda dapat menyiapkan `#coding`, `#home`, `#research`, atau apa pun yang sesuai dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Routing balasan bersifat deterministik: balasan masuk Discord kembali ke Discord.
- Secara default (`session.dmScope=main`), chat langsung berbagi sesi utama agen (`agent:main:main`).
- Channel guild menggunakan kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Slash command native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.

## Channel forum

Channel forum dan media Discord hanya menerima posting thread. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke induk forum (`channel:<forumId>`) untuk membuat thread secara otomatis. Judul thread menggunakan baris pertama pesan Anda yang tidak kosong.
- Gunakan `openclaw message thread create` untuk membuat thread secara langsung. Jangan berikan `--message-id` untuk channel forum.

Contoh: kirim ke induk forum untuk membuat thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Contoh: buat thread forum secara eksplisit

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Induk forum tidak menerima komponen Discord. Jika Anda memerlukan komponen, kirim ke thread itu sendiri (`channel:<threadId>`).

## Komponen interaktif

OpenClaw mendukung container Discord components v2 untuk pesan agen. Gunakan message tool dengan payload `components`. Hasil interaksi dirutekan kembali ke agen sebagai pesan masuk normal dan mengikuti pengaturan Discord `replyToMode` yang ada.

Blok yang didukung:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Baris aksi mengizinkan hingga 5 tombol atau satu menu pilih
- Jenis select: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya dapat digunakan satu kali. Tetapkan `components.reusable=true` agar tombol, select, dan form dapat digunakan beberapa kali sampai kedaluwarsa.

Untuk membatasi siapa yang dapat mengklik tombol, tetapkan `allowedUsers` pada tombol tersebut (ID pengguna Discord, tag, atau `*`). Saat dikonfigurasi, pengguna yang tidak cocok akan menerima penolakan ephemeral.

Slash command `/model` dan `/models` membuka pemilih model interaktif dengan dropdown penyedia dan model serta langkah Submit. Balasan pemilih bersifat ephemeral dan hanya pengguna yang memanggil yang dapat menggunakannya.

Lampiran file:

- blok `file` harus menunjuk ke referensi lampiran (`attachment://<filename>`)
- Berikan lampiran melalui `media`/`path`/`filePath` (satu file); gunakan `media-gallery` untuk beberapa file
- Gunakan `filename` untuk mengganti nama upload saat harus cocok dengan referensi lampiran

Form modal:

- Tambahkan `components.modal` dengan hingga 5 field
- Jenis field: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw menambahkan tombol pemicu secara otomatis

Contoh:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Kontrol akses dan routing

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` mengontrol akses DM (lama: `channels.discord.dm.policy`):

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.discord.allowFrom` menyertakan `"*"`; lama: `channels.discord.dm.allowFrom`)
    - `disabled`

    Jika kebijakan DM tidak terbuka, pengguna yang tidak dikenal diblokir (atau diminta pairing dalam mode `pairing`).

    Prioritas multi-akun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Akun bernama mewarisi `channels.discord.allowFrom` ketika `allowFrom` milik mereka sendiri tidak ditetapkan.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - mention `<@id>`

    ID numerik polos ambigu dan ditolak kecuali jenis target pengguna/channel yang eksplisit diberikan.

  </Tab>

  <Tab title="Guild policy">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman saat `channels.discord` ada adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` lebih disukai, slug diterima)
    - allowlist pengirim opsional: `users` (ID stabil disarankan) dan `roles` (hanya ID role); jika salah satunya dikonfigurasi, pengirim diizinkan jika cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag langsung dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memperingatkan saat entri nama/tag digunakan
    - jika guild memiliki `channels` yang dikonfigurasi, channel yang tidak terdaftar akan ditolak
    - jika guild tidak memiliki blok `channels`, semua channel di guild yang di-allowlist diizinkan

    Contoh:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Jika Anda hanya menetapkan `DISCORD_BOT_TOKEN` dan tidak membuat blok `channels.discord`, fallback runtime adalah `groupPolicy="allowlist"` (dengan peringatan di log), meskipun `channels.defaults.groupPolicy` adalah `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Pesan guild dibatasi oleh mention secara default.

    Deteksi mention mencakup:

    - mention bot eksplisit
    - pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku reply-to-bot implisit dalam kasus yang didukung

    `requireMention` dikonfigurasi per guild/channel (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional menghapus pesan yang me-mention pengguna/role lain tetapi bukan bot (tidak termasuk @everyone/@here).

    Group DM:

    - default: diabaikan (`dm.groupEnabled=false`)
    - allowlist opsional melalui `dm.groupChannels` (ID channel atau slug)

  </Tab>
</Tabs>

### Routing agen berbasis role

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agen yang berbeda berdasarkan ID role. Binding berbasis role hanya menerima ID role dan dievaluasi setelah binding peer atau parent-peer dan sebelum binding khusus guild. Jika binding juga menetapkan field pencocokan lain (misalnya `peer` + `guildId` + `roles`), semua field yang dikonfigurasi harus cocok.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Penyiapan Developer Portal

<AccordionGroup>
  <Accordion title="Create app and bot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Salin token bot

  </Accordion>

  <Accordion title="Privileged intents">
    Di **Bot -> Privileged Gateway Intents**, aktifkan:

    - Message Content Intent
    - Server Members Intent (disarankan)

    Presence intent bersifat opsional dan hanya diperlukan jika Anda ingin menerima pembaruan presence. Menetapkan presence bot (`setPresence`) tidak memerlukan pengaktifan pembaruan presence untuk anggota.

  </Accordion>

  <Accordion title="OAuth scopes and baseline permissions">
    Generator URL OAuth:

    - cakupan: `bot`, `applications.commands`

    Izin baseline umum:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opsional)

    Hindari `Administrator` kecuali benar-benar diperlukan.

  </Accordion>

  <Accordion title="Copy IDs">
    Aktifkan Discord Developer Mode, lalu salin:

    - ID server
    - ID channel
    - ID pengguna

    Utamakan ID numerik di config OpenClaw untuk audit dan probe yang andal.

  </Accordion>
</AccordionGroup>

## Perintah native dan autentikasi perintah

- `commands.native` default ke `"auto"` dan diaktifkan untuk Discord.
- Override per-channel: `channels.discord.commands.native`.
- `commands.native=false` secara eksplisit menghapus perintah native Discord yang sebelumnya terdaftar.
- Autentikasi perintah native menggunakan allowlist/kebijakan Discord yang sama seperti penanganan pesan normal.
- Perintah mungkin tetap terlihat di UI Discord untuk pengguna yang tidak berwenang; eksekusi tetap menegakkan autentikasi OpenClaw dan mengembalikan "not authorized".

Lihat [Slash commands](/tools/slash-commands) untuk katalog dan perilaku perintah.

Pengaturan default slash command:

- `ephemeral: true`

## Detail fitur

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord mendukung tag balasan dalam output agen:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Dikontrol oleh `channels.discord.replyToMode`:

    - `off` (default)
    - `first`
    - `all`

    Catatan: `off` menonaktifkan threading balasan implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.

    ID pesan dimunculkan dalam konteks/riwayat sehingga agen dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw dapat men-stream balasan draf dengan mengirim pesan sementara dan mengeditnya saat teks masuk.

    - `channels.discord.streaming` mengontrol streaming pratinjau (`off` | `partial` | `block` | `progress`, default: `off`).
    - Default tetap `off` karena edit pratinjau Discord dapat dengan cepat mencapai batas laju, terutama ketika beberapa bot atau gateway berbagi akun atau lalu lintas guild yang sama.
    - `progress` diterima untuk konsistensi lintas-channel dan dipetakan ke `partial` di Discord.
    - `channels.discord.streamMode` adalah alias lama dan dimigrasikan otomatis.
    - `partial` mengedit satu pesan pratinjau saat token masuk.
    - `block` mengeluarkan potongan seukuran draf (gunakan `draftChunk` untuk menyetel ukuran dan titik pemisahan).

    Contoh:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    Default pemotongan mode `block` (dibatasi ke `channels.discord.textChunkLimit`):

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    Streaming pratinjau hanya untuk teks; balasan media kembali ke pengiriman normal.

    Catatan: streaming pratinjau terpisah dari block streaming. Saat block streaming secara eksplisit
    diaktifkan untuk Discord, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Konteks riwayat guild:

    - `channels.discord.historyLimit` default `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Kontrol riwayat DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Perilaku thread:

    - thread Discord dirutekan sebagai sesi channel
    - metadata thread induk dapat digunakan untuk penautan sesi induk
    - config thread mewarisi config channel induk kecuali ada entri khusus thread

    Topik channel disuntikkan sebagai konteks **tidak tepercaya** (bukan sebagai system prompt).
    Konteks balasan dan pesan kutipan saat ini tetap sebagaimana diterima.
    Allowlist Discord terutama membatasi siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan yang sepenuhnya lengkap.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord dapat mengikat thread ke target sesi sehingga pesan lanjutan di thread tersebut terus dirutekan ke sesi yang sama (termasuk sesi subagen).

    Perintah:

    - `/focus <target>` mengikat thread saat ini/baru ke target subagen/sesi
    - `/unfocus` menghapus ikatan thread saat ini
    - `/agents` menampilkan run aktif dan status binding
    - `/session idle <duration|off>` memeriksa/memperbarui auto-unfocus karena tidak aktif untuk binding yang difokuskan
    - `/session max-age <duration|off>` memeriksa/memperbarui usia maksimum keras untuk binding yang difokuskan

    Config:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Catatan:

    - `session.threadBindings.*` menetapkan default global.
    - `channels.discord.threadBindings.*` mengganti perilaku Discord.
    - `spawnSubagentSessions` harus true untuk membuat/mengikat thread secara otomatis bagi `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` harus true untuk membuat/mengikat thread secara otomatis bagi ACP (`/acp spawn ... --thread ...` atau `sessions_spawn({ runtime: "acp", thread: true })`).
    - Jika thread binding dinonaktifkan untuk suatu akun, `/focus` dan operasi thread binding terkait tidak tersedia.

    Lihat [Sub-agents](/tools/subagents), [ACP Agents](/tools/acp-agents), dan [Configuration Reference](/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Untuk workspace ACP stabil yang "selalu aktif", konfigurasikan binding ACP bertipe top-level yang menargetkan percakapan Discord.

    Jalur config:

    - `bindings[]` dengan `type: "acp"` dan `match.channel: "discord"`

    Contoh:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Catatan:

    - `/acp spawn codex --bind here` mengikat channel atau thread Discord saat ini di tempat dan menjaga pesan selanjutnya tetap dirutekan ke sesi ACP yang sama.
    - Itu masih bisa berarti "memulai sesi ACP Codex baru", tetapi tidak membuat thread Discord baru dengan sendirinya. Channel yang ada tetap menjadi permukaan chat.
    - Codex mungkin tetap berjalan di `cwd` atau workspace backend miliknya sendiri di disk. Workspace tersebut adalah status runtime, bukan thread Discord.
    - Pesan thread dapat mewarisi binding ACP channel induk.
    - Di channel atau thread yang terikat, `/new` dan `/reset` mereset sesi ACP yang sama di tempat.
    - Thread binding sementara tetap berfungsi dan dapat mengganti resolusi target saat aktif.
    - `spawnAcpSessions` hanya diperlukan saat OpenClaw perlu membuat/mengikat child thread melalui `--thread auto|here`. Ini tidak diperlukan untuk `/acp spawn ... --bind here` di channel saat ini.

    Lihat [ACP Agents](/tools/acp-agents) untuk detail perilaku binding.

  </Accordion>

  <Accordion title="Reaction notifications">
    Mode notifikasi reaction per-guild:

    - `off`
    - `own` (default)
    - `all`
    - `allowlist` (menggunakan `guilds.<id>.users`)

    Event reaction diubah menjadi event sistem dan dilampirkan ke sesi Discord yang dirutekan.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` mengirim emoji pengakuan saat OpenClaw sedang memproses pesan masuk.

    Urutan resolusi:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak "👀")

    Catatan:

    - Discord menerima emoji unicode atau nama emoji kustom.
    - Gunakan `""` untuk menonaktifkan reaction bagi channel atau akun.

  </Accordion>

  <Accordion title="Config writes">
    Penulisan config yang dimulai dari channel diaktifkan secara default.

    Ini memengaruhi alur `/config set|unset` (saat fitur perintah diaktifkan).

    Nonaktifkan:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway proxy">
    Rutekan lalu lintas WebSocket gateway Discord dan lookup REST saat startup (ID aplikasi + resolusi allowlist) melalui proxy HTTP(S) dengan `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Override per-akun:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit support">
    Aktifkan resolusi PluralKit untuk memetakan pesan yang diproksikan ke identitas anggota sistem:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Catatan:

    - allowlist dapat menggunakan `pk:<memberId>`
    - nama tampilan anggota dicocokkan berdasarkan nama/slug hanya ketika `channels.discord.dangerouslyAllowNameMatching: true`
    - lookup menggunakan ID pesan asli dan dibatasi oleh jendela waktu
    - jika lookup gagal, pesan yang diproksikan diperlakukan sebagai pesan bot dan dihapus kecuali `allowBots=true`

  </Accordion>

  <Accordion title="Presence configuration">
    Pembaruan presence diterapkan saat Anda menetapkan status atau field aktivitas, atau saat Anda mengaktifkan auto presence.

    Contoh hanya status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Contoh aktivitas (status kustom adalah jenis aktivitas default):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Contoh streaming:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Peta jenis aktivitas:

    - 0: Playing
    - 1: Streaming (memerlukan `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (menggunakan teks aktivitas sebagai status state; emoji opsional)
    - 5: Competing

    Contoh auto presence (sinyal kesehatan runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    Auto presence memetakan ketersediaan runtime ke status Discord: healthy => online, degraded atau unknown => idle, exhausted atau unavailable => dnd. Override teks opsional:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (mendukung placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord mendukung penanganan approval berbasis tombol di DM dan secara opsional dapat memposting prompt approval di channel asal.

    Jalur config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; fallback ke `commands.ownerAllowFrom` bila memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord mengaktifkan approval exec native secara otomatis ketika `enabled` tidak ditetapkan atau `"auto"` dan setidaknya satu approver dapat di-resolve, baik dari `execApprovals.approvers` maupun dari `commands.ownerAllowFrom`. Discord tidak menyimpulkan approver exec dari channel `allowFrom`, `dm.allowFrom` lama, atau `defaultTo` direct message. Tetapkan `enabled: false` untuk menonaktifkan Discord sebagai klien approval native secara eksplisit.

    Saat `target` adalah `channel` atau `both`, prompt approval terlihat di channel. Hanya approver yang berhasil di-resolve yang dapat menggunakan tombol; pengguna lain menerima penolakan ephemeral. Prompt approval menyertakan teks perintah, jadi aktifkan pengiriman channel hanya di channel tepercaya. Jika ID channel tidak dapat diturunkan dari kunci sesi, OpenClaw fallback ke pengiriman DM.

    Discord juga merender tombol approval bersama yang digunakan oleh channel chat lain. Adaptor Discord native terutama menambahkan routing DM approver dan fanout channel.
    Saat tombol-tombol tersebut ada, itulah UX approval utama; OpenClaw
    seharusnya hanya menyertakan perintah `/approve` manual saat hasil tool menyatakan
    approval chat tidak tersedia atau approval manual adalah satu-satunya jalur.

    Autentikasi Gateway untuk handler ini menggunakan kontrak resolusi kredensial bersama yang sama seperti klien Gateway lain:

    - autentikasi lokal env-first (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` lalu `gateway.auth.*`)
    - dalam mode lokal, `gateway.remote.*` dapat digunakan sebagai fallback hanya ketika `gateway.auth.*` tidak ditetapkan; SecretRef lokal yang dikonfigurasi tetapi tidak ter-resolve gagal tertutup
    - dukungan mode remote melalui `gateway.remote.*` jika berlaku
    - override URL aman terhadap override: override CLI tidak menggunakan ulang kredensial implisit, dan override env hanya menggunakan kredensial env

    Perilaku resolusi approval:

    - ID dengan prefiks `plugin:` di-resolve melalui `plugin.approval.resolve`.
    - ID lain di-resolve melalui `exec.approval.resolve`.
    - Discord tidak melakukan hop fallback exec-ke-plugin tambahan di sini; prefiks
      id menentukan metode gateway yang dipanggil.

    Approval exec kedaluwarsa setelah 30 menit secara default. Jika approval gagal dengan
    ID approval yang tidak dikenal, verifikasi resolusi approver, pengaktifan fitur, dan
    bahwa jenis id approval yang dikirim cocok dengan permintaan yang tertunda.

    Dokumen terkait: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Tools dan action gates

Aksi pesan Discord mencakup perpesanan, admin channel, moderasi, presence, dan aksi metadata.

Contoh inti:

- perpesanan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaction: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- presence: `setPresence`

Action gate berada di bawah `channels.discord.actions.*`.

Perilaku gate default:

| Action group                                                                                                                                                             | Default  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## UI Components v2

OpenClaw menggunakan Discord components v2 untuk approval exec dan penanda lintas-konteks. Aksi pesan Discord juga dapat menerima `components` untuk UI kustom (lanjutan; memerlukan pembuatan payload komponen melalui discord tool), sementara `embeds` lama tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` menetapkan warna aksen yang digunakan oleh container komponen Discord (hex).
- Tetapkan per akun dengan `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` diabaikan saat components v2 ada.

Contoh:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Channel suara

OpenClaw dapat bergabung ke channel suara Discord untuk percakapan realtime yang berkelanjutan. Ini terpisah dari lampiran pesan suara.

Persyaratan:

- Aktifkan perintah native (`commands.native` atau `channels.discord.commands.native`).
- Konfigurasikan `channels.discord.voice`.
- Bot memerlukan izin Connect + Speak di channel suara target.

Gunakan perintah native khusus Discord `/vc join|leave|status` untuk mengontrol sesi. Perintah ini menggunakan agen default akun dan mengikuti aturan allowlist serta group policy yang sama seperti perintah Discord lainnya.

Contoh auto-join:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Catatan:

- `voice.tts` menggantikan `messages.tts` hanya untuk pemutaran suara.
- Giliran transkrip suara menurunkan status owner dari Discord `allowFrom` (atau `dm.allowFrom`); pembicara non-owner tidak dapat mengakses tool khusus owner (misalnya `gateway` dan `cron`).
- Voice diaktifkan secara default; tetapkan `channels.discord.voice.enabled=false` untuk menonaktifkannya.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi join `@discordjs/voice`.
- Default `@discordjs/voice` adalah `daveEncryption=true` dan `decryptionFailureTolerance=24` jika tidak ditetapkan.
- OpenClaw juga memantau kegagalan dekripsi penerimaan dan memulihkan secara otomatis dengan keluar/bergabung kembali ke channel suara setelah kegagalan berulang dalam jangka waktu singkat.
- Jika log penerimaan terus menunjukkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, ini mungkin bug receive upstream `@discordjs/voice` yang dilacak di [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Pesan suara

Pesan suara Discord menampilkan pratinjau waveform dan memerlukan audio OGG/Opus serta metadata. OpenClaw menghasilkan waveform secara otomatis, tetapi membutuhkan `ffmpeg` dan `ffprobe` yang tersedia pada host gateway untuk memeriksa dan mengonversi file audio.

Persyaratan dan batasan:

- Berikan **jalur file lokal** (URL ditolak).
- Hilangkan konten teks (Discord tidak mengizinkan teks + pesan suara dalam payload yang sama).
- Format audio apa pun diterima; OpenClaw mengonversi ke OGG/Opus bila diperlukan.

Contoh:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Troubleshooting

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - aktifkan Message Content Intent
    - aktifkan Server Members Intent saat Anda bergantung pada resolusi user/member
    - mulai ulang gateway setelah mengubah intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - verifikasi `groupPolicy`
    - verifikasi guild allowlist di bawah `channels.discord.guilds`
    - jika peta `channels` guild ada, hanya channel yang terdaftar yang diizinkan
    - verifikasi perilaku `requireMention` dan pola mention

    Pemeriksaan yang berguna:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Penyebab umum:

    - `groupPolicy="allowlist"` tanpa guild/channel allowlist yang cocok
    - `requireMention` dikonfigurasi di tempat yang salah (harus di bawah `channels.discord.guilds` atau entri channel)
    - pengirim diblokir oleh allowlist `users` guild/channel

  </Accordion>

  <Accordion title="Long-running handlers time out or duplicate replies">

    Log umum:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Knob anggaran listener:

    - akun tunggal: `channels.discord.eventQueue.listenerTimeout`
    - multi-akun: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Knob batas waktu run worker:

    - akun tunggal: `channels.discord.inboundWorker.runTimeoutMs`
    - multi-akun: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - default: `1800000` (30 menit); tetapkan `0` untuk menonaktifkan

    Baseline yang direkomendasikan:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Gunakan `eventQueue.listenerTimeout` untuk penyiapan listener yang lambat dan `inboundWorker.runTimeoutMs`
    hanya jika Anda ingin katup pengaman terpisah untuk giliran agen yang diantrikan.

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Pemeriksaan izin `channels status --probe` hanya berfungsi untuk ID channel numerik.

    Jika Anda menggunakan kunci slug, pencocokan runtime masih dapat berfungsi, tetapi probe tidak dapat memverifikasi izin sepenuhnya.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (lama: `channels.discord.dm.policy`)
    - menunggu persetujuan pairing dalam mode `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Secara default, pesan yang ditulis bot diabaikan.

    Jika Anda menetapkan `channels.discord.allowBots=true`, gunakan aturan mention dan allowlist yang ketat untuk menghindari perilaku loop.
    Lebih baik gunakan `channels.discord.allowBots="mentions"` agar hanya menerima pesan bot yang me-mention bot.

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - pastikan OpenClaw tetap mutakhir (`openclaw update`) agar logika pemulihan receive suara Discord tersedia
    - pastikan `channels.discord.voice.daveEncryption=true` (default)
    - mulai dari `channels.discord.voice.decryptionFailureTolerance=24` (default upstream) dan sesuaikan hanya bila perlu
    - pantau log untuk:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jika kegagalan berlanjut setelah join ulang otomatis, kumpulkan log dan bandingkan dengan [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Pointer referensi konfigurasi

Referensi utama:

- [Configuration reference - Discord](/gateway/configuration-reference#discord)

Field Discord dengan sinyal tinggi:

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- kebijakan: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- perintah: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout` (anggaran listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- balasan/riwayat: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias lama: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` membatasi upload Discord keluar (default: `8MB`)
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- fitur: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Keamanan dan operasi

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` lebih disukai di environment yang diawasi).
- Berikan izin Discord dengan hak minimum.
- Jika deploy/status perintah usang, mulai ulang gateway dan periksa kembali dengan `openclaw channels status --probe`.

## Terkait

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Channel routing](/channels/channel-routing)
- [Security](/gateway/security)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
- [Slash commands](/tools/slash-commands)
