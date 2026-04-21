---
read_when:
    - Mengerjakan fitur channel Discord
summary: Status dukungan bot Discord, kapabilitas, dan konfigurasi
title: Discord
x-i18n:
    generated_at: "2026-04-21T17:45:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1681315a6c246c4b68347f5e22319e132f30ea4e29a19e7d1da9e83dce7b68d0
    source_path: channels/discord.md
    workflow: 15
---

# Discord (Bot API)

Status: siap untuk DM dan channel guild melalui gateway Discord resmi.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM Discord secara default menggunakan mode pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas-channel dan alur perbaikan.
  </Card>
</CardGroup>

## Pengaturan cepat

Anda perlu membuat aplikasi baru dengan bot, menambahkan bot ke server Anda, lalu memasangkannya ke OpenClaw. Kami merekomendasikan menambahkan bot Anda ke server pribadi Anda sendiri. Jika Anda belum memilikinya, [buat dulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (pilih **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    Buka [Discord Developer Portal](https://discord.com/developers/applications) dan klik **New Application**. Beri nama seperti "OpenClaw".

    Klik **Bot** pada sidebar. Atur **Username** ke nama yang Anda gunakan untuk agen OpenClaw Anda.

  </Step>

  <Step title="Enable privileged intents">
    Masih di halaman **Bot**, gulir ke bawah ke **Privileged Gateway Intents** dan aktifkan:

    - **Message Content Intent** (wajib)
    - **Server Members Intent** (direkomendasikan; wajib untuk allowlist peran dan pencocokan nama-ke-ID)
    - **Presence Intent** (opsional; hanya diperlukan untuk pembaruan presence)

  </Step>

  <Step title="Copy your bot token">
    Gulir kembali ke atas pada halaman **Bot** dan klik **Reset Token**.

    <Note>
    Meskipun namanya demikian, ini menghasilkan token pertama Anda — tidak ada yang sedang "direset."
    </Note>

    Salin token tersebut dan simpan di suatu tempat. Ini adalah **Bot Token** Anda dan Anda akan segera membutuhkannya.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Klik **OAuth2** pada sidebar. Anda akan membuat URL undangan dengan izin yang tepat untuk menambahkan bot ke server Anda.

    Gulir ke bawah ke **OAuth2 URL Generator** dan aktifkan:

    - `bot`
    - `applications.commands`

    Bagian **Bot Permissions** akan muncul di bawah. Aktifkan:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opsional)

    Salin URL yang dihasilkan di bagian bawah, tempelkan ke browser Anda, pilih server Anda, dan klik **Continue** untuk menghubungkan. Anda sekarang seharusnya dapat melihat bot Anda di server Discord.

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
    Token bot Discord Anda adalah rahasia (seperti kata sandi). Atur token tersebut pada mesin yang menjalankan OpenClaw sebelum mengirim pesan ke agen Anda.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Jika OpenClaw sudah berjalan sebagai layanan latar belakang, mulai ulang melalui aplikasi OpenClaw Mac atau dengan menghentikan dan menjalankan ulang proses `openclaw gateway run`.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        Chat dengan agen OpenClaw Anda di channel lain yang sudah ada (misalnya Telegram) dan beri tahu. Jika Discord adalah channel pertama Anda, gunakan tab CLI / config sebagai gantinya.

        > "Saya sudah menetapkan token bot Discord saya di config. Tolong selesaikan pengaturan Discord dengan User ID `<user_id>` dan Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Jika Anda lebih suka config berbasis file, atur:

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

        Nilai `token` plaintext didukung. Nilai SecretRef juga didukung untuk `channels.discord.token` di seluruh provider env/file/exec. Lihat [Secrets Management](/id/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approve first DM pairing">
    Tunggu hingga gateway berjalan, lalu kirim DM ke bot Anda di Discord. Bot akan merespons dengan kode pairing.

    <Tabs>
      <Tab title="Ask your agent">
        Kirim kode pairing ke agen Anda di channel Anda yang sudah ada:

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
Resolusi token memperhatikan akun. Nilai token pada config lebih diutamakan daripada fallback env. `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Untuk panggilan outbound lanjutan (aksi alat/channel pesan), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk aksi kirim dan baca/probe-style (misalnya read/search/fetch/thread/pins/permissions). Pengaturan kebijakan akun/retry tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Rekomendasi: Siapkan workspace guild

Setelah DM berfungsi, Anda dapat menyiapkan server Discord Anda sebagai workspace penuh di mana setiap channel mendapatkan sesi agen sendiri dengan konteksnya sendiri. Ini direkomendasikan untuk server pribadi yang hanya berisi Anda dan bot Anda.

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
    Secara default, agen Anda hanya merespons di channel guild saat di-@mention. Untuk server pribadi, Anda kemungkinan ingin agen merespons setiap pesan.

    <Tabs>
      <Tab title="Ask your agent">
        > "Izinkan agen saya merespons di server ini tanpa harus di-@mention"
      </Tab>
      <Tab title="Config">
        Atur `requireMention: false` dalam config guild Anda:

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
    Secara default, memori jangka panjang (`MEMORY.md`) hanya dimuat dalam sesi DM. Channel guild tidak memuat `MEMORY.md` secara otomatis.

    <Tabs>
      <Tab title="Ask your agent">
        > "Saat saya mengajukan pertanyaan di channel Discord, gunakan memory_search atau memory_get jika Anda membutuhkan konteks jangka panjang dari `MEMORY.md`."
      </Tab>
      <Tab title="Manual">
        Jika Anda memerlukan konteks bersama di setiap channel, letakkan instruksi stabil di `AGENTS.md` atau `USER.md` (keduanya disuntikkan ke setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses saat diperlukan dengan alat memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat beberapa channel di server Discord Anda dan mulai chat. Agen Anda dapat melihat nama channel, dan setiap channel mendapatkan sesi terisolasi sendiri — sehingga Anda dapat menyiapkan `#coding`, `#home`, `#research`, atau apa pun yang sesuai dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan masuk dari Discord dikembalikan ke Discord.
- Secara default (`session.dmScope=main`), chat langsung berbagi sesi utama agen (`agent:main:main`).
- Channel guild adalah key sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Slash commands native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.

## Channel forum

Channel forum dan media Discord hanya menerima posting thread. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke parent forum (`channel:<forumId>`) untuk membuat thread secara otomatis. Judul thread menggunakan baris pertama non-kosong dari pesan Anda.
- Gunakan `openclaw message thread create` untuk membuat thread secara langsung. Jangan berikan `--message-id` untuk channel forum.

Contoh: kirim ke parent forum untuk membuat thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Contoh: buat thread forum secara eksplisit

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Parent forum tidak menerima komponen Discord. Jika Anda memerlukan komponen, kirim ke thread itu sendiri (`channel:<threadId>`).

## Komponen interaktif

OpenClaw mendukung container komponen Discord v2 untuk pesan agen. Gunakan alat pesan dengan payload `components`. Hasil interaksi dirutekan kembali ke agen sebagai pesan masuk normal dan mengikuti pengaturan Discord `replyToMode` yang ada.

Blok yang didukung:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action row memungkinkan hingga 5 tombol atau satu menu pilihan
- Tipe pilihan: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya dapat digunakan sekali. Atur `components.reusable=true` untuk mengizinkan tombol, pilihan, dan formulir digunakan beberapa kali sampai kedaluwarsa.

Untuk membatasi siapa yang dapat mengeklik tombol, atur `allowedUsers` pada tombol tersebut (Discord user ID, tag, atau `*`). Jika dikonfigurasi, pengguna yang tidak cocok akan menerima penolakan ephemeral.

Slash commands `/model` dan `/models` membuka pemilih model interaktif dengan dropdown provider dan model serta langkah Submit. Balasan pemilih bersifat ephemeral dan hanya pengguna pemanggil yang dapat menggunakannya.

Lampiran file:

- Blok `file` harus mengarah ke referensi lampiran (`attachment://<filename>`)
- Sediakan lampiran melalui `media`/`path`/`filePath` (satu file); gunakan `media-gallery` untuk beberapa file
- Gunakan `filename` untuk mengganti nama upload ketika harus cocok dengan referensi lampiran

Formulir modal:

- Tambahkan `components.modal` dengan hingga 5 field
- Tipe field: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw menambahkan tombol pemicu secara otomatis

Contoh:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Teks fallback opsional",
  components: {
    reusable: true,
    text: "Pilih jalur",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Setujui",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Tolak", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pilih opsi",
          options: [
            { label: "Opsi A", value: "a" },
            { label: "Opsi B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Detail",
      triggerLabel: "Buka formulir",
      fields: [
        { type: "text", label: "Peminta" },
        {
          type: "select",
          label: "Prioritas",
          options: [
            { label: "Rendah", value: "low" },
            { label: "Tinggi", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Kontrol akses dan perutean

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` mengontrol akses DM (legacy: `channels.discord.dm.policy`):

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.discord.allowFrom` menyertakan `"*"`; legacy: `channels.discord.dm.allowFrom`)
    - `disabled`

    Jika kebijakan DM tidak open, pengguna yang tidak dikenal diblokir (atau diminta pairing dalam mode `pairing`).

    Prioritas multi-akun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Akun bernama mewarisi `channels.discord.allowFrom` saat `allowFrom` miliknya sendiri belum disetel.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - mention `<@id>`

    ID numerik polos ambigu dan ditolak kecuali jenis target user/channel eksplisit diberikan.

  </Tab>

  <Tab title="Guild policy">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman saat `channels.discord` ada adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` lebih disukai, slug diterima)
    - allowlist pengirim opsional: `users` (ID stabil direkomendasikan) dan `roles` (hanya role ID); jika salah satunya dikonfigurasi, pengirim diizinkan saat cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag langsung dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memperingatkan saat entri nama/tag digunakan
    - jika sebuah guild memiliki `channels` yang dikonfigurasi, channel yang tidak terdaftar akan ditolak
    - jika sebuah guild tidak memiliki blok `channels`, semua channel dalam guild yang ada di allowlist diizinkan

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

    Jika Anda hanya menyetel `DISCORD_BOT_TOKEN` dan tidak membuat blok `channels.discord`, fallback runtime adalah `groupPolicy="allowlist"` (dengan peringatan di log), meskipun `channels.defaults.groupPolicy` adalah `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Pesan guild dibatasi mention secara default.

    Deteksi mention mencakup:

    - mention bot eksplisit
    - pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku balas-ke-bot implisit dalam kasus yang didukung

    `requireMention` dikonfigurasi per guild/channel (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional membuang pesan yang menyebut user/role lain tetapi bukan bot (tidak termasuk @everyone/@here).

    Group DM:

    - default: diabaikan (`dm.groupEnabled=false`)
    - allowlist opsional melalui `dm.groupChannels` (ID channel atau slug)

  </Tab>
</Tabs>

### Perutean agen berbasis peran

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agen yang berbeda berdasarkan role ID. Binding berbasis peran hanya menerima role ID dan dievaluasi setelah binding peer atau parent-peer dan sebelum binding khusus guild. Jika sebuah binding juga menetapkan field pencocokan lain (misalnya `peer` + `guildId` + `roles`), semua field yang dikonfigurasi harus cocok.

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

## Pengaturan Developer Portal

<AccordionGroup>
  <Accordion title="Create app and bot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Salin token bot

  </Accordion>

  <Accordion title="Privileged intents">
    Di **Bot -> Privileged Gateway Intents**, aktifkan:

    - Message Content Intent
    - Server Members Intent (direkomendasikan)

    Presence intent bersifat opsional dan hanya diperlukan jika Anda ingin menerima pembaruan presence. Menyetel presence bot (`setPresence`) tidak memerlukan pembaruan presence untuk anggota diaktifkan.

  </Accordion>

  <Accordion title="OAuth scopes and baseline permissions">
    Generator URL OAuth:

    - scope: `bot`, `applications.commands`

    Izin baseline yang umum:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (opsional)

    Hindari `Administrator` kecuali memang diperlukan secara eksplisit.

  </Accordion>

  <Accordion title="Copy IDs">
    Aktifkan Discord Developer Mode, lalu salin:

    - server ID
    - channel ID
    - user ID

    Gunakan ID numerik dalam config OpenClaw untuk audit dan probe yang andal.

  </Accordion>
</AccordionGroup>

## Perintah native dan auth perintah

- `commands.native` default ke `"auto"` dan diaktifkan untuk Discord.
- Override per channel: `channels.discord.commands.native`.
- `commands.native=false` secara eksplisit menghapus perintah native Discord yang sebelumnya terdaftar.
- Auth perintah native menggunakan allowlist/kebijakan Discord yang sama dengan penanganan pesan normal.
- Perintah mungkin tetap terlihat di UI Discord bagi pengguna yang tidak berwenang; eksekusi tetap menerapkan auth OpenClaw dan mengembalikan "not authorized".

Lihat [Slash commands](/id/tools/slash-commands) untuk katalog dan perilaku perintah.

Pengaturan slash command default:

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
    - `batched`

    Catatan: `off` menonaktifkan threading balasan implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.
    `first` selalu melampirkan referensi balasan native implisit ke pesan Discord outbound pertama untuk giliran tersebut.
    `batched` hanya melampirkan referensi balasan native implisit Discord ketika
    giliran masuk adalah batch ter-debounce dari beberapa pesan. Ini berguna
    ketika Anda menginginkan balasan native terutama untuk chat ambigu yang ramai, bukan setiap
    giliran pesan tunggal.

    ID pesan ditampilkan dalam konteks/riwayat sehingga agen dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw dapat melakukan streaming draf balasan dengan mengirim pesan sementara dan mengeditnya saat teks masuk.

    - `channels.discord.streaming` mengontrol streaming pratinjau (`off` | `partial` | `block` | `progress`, default: `off`).
    - Default tetap `off` karena edit pratinjau Discord dapat cepat mencapai rate limit, terutama saat beberapa bot atau gateway berbagi akun atau lalu lintas guild yang sama.
    - `progress` diterima untuk konsistensi lintas-channel dan dipetakan ke `partial` di Discord.
    - `channels.discord.streamMode` adalah alias legacy dan dimigrasikan secara otomatis.
    - `partial` mengedit satu pesan pratinjau saat token masuk.
    - `block` mengeluarkan chunk seukuran draf (gunakan `draftChunk` untuk menyesuaikan ukuran dan breakpoint).
    - `streaming.preview.toolProgress` mengontrol apakah pembaruan alat/progres menggunakan kembali pesan pratinjau draf yang sama (default: `true`). Setel `false` untuk mempertahankan pesan alat/progres yang terpisah.

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

    Default chunking mode `block` (dibatasi ke `channels.discord.textChunkLimit`):

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
    diaktifkan untuk Discord, OpenClaw melewati aliran pratinjau untuk menghindari streaming ganda.

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
    - metadata thread parent dapat digunakan untuk tautan parent-session
    - config thread mewarisi config channel parent kecuali ada entri khusus thread

    Topik channel disuntikkan sebagai konteks **tidak tepercaya** (bukan sebagai system prompt).
    Konteks balasan dan pesan kutipan saat ini tetap seperti yang diterima.
    Allowlist Discord terutama membatasi siapa yang dapat memicu agen, bukan batas penyuntingan konteks tambahan yang lengkap.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord dapat mengikat sebuah thread ke target sesi sehingga pesan lanjutan dalam thread tersebut tetap dirutekan ke sesi yang sama (termasuk sesi subagent).

    Perintah:

    - `/focus <target>` ikat thread saat ini/baru ke target subagent/sesi
    - `/unfocus` hapus binding thread saat ini
    - `/agents` tampilkan run aktif dan status binding
    - `/session idle <duration|off>` periksa/perbarui auto-unfocus karena tidak aktif untuk binding yang difokuskan
    - `/session max-age <duration|off>` periksa/perbarui usia maksimum keras untuk binding yang difokuskan

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
    - `channels.discord.threadBindings.*` meng-override perilaku Discord.
    - `spawnSubagentSessions` harus bernilai true untuk membuat/mengikat thread secara otomatis bagi `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` harus bernilai true untuk membuat/mengikat thread secara otomatis bagi ACP (`/acp spawn ... --thread ...` atau `sessions_spawn({ runtime: "acp", thread: true })`).
    - Jika thread binding dinonaktifkan untuk suatu akun, `/focus` dan operasi thread binding terkait tidak tersedia.

    Lihat [Sub-agents](/id/tools/subagents), [ACP Agents](/id/tools/acp-agents), dan [Configuration Reference](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Untuk workspace ACP "selalu aktif" yang stabil, konfigurasikan binding ACP bertipe tingkat atas yang menargetkan percakapan Discord.

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

    - `/acp spawn codex --bind here` mengikat channel atau thread Discord saat ini di tempat dan mempertahankan perutean pesan berikutnya ke sesi ACP yang sama.
    - Itu masih bisa berarti "memulai sesi Codex ACP yang baru", tetapi tidak membuat thread Discord baru dengan sendirinya. Channel yang ada tetap menjadi permukaan chat.
    - Codex tetap dapat berjalan di `cwd`-nya sendiri atau workspace backend di disk. Workspace tersebut adalah status runtime, bukan thread Discord.
    - Pesan thread dapat mewarisi binding ACP channel parent.
    - Dalam channel atau thread yang terikat, `/new` dan `/reset` mereset sesi ACP yang sama di tempat.
    - Thread binding sementara tetap berfungsi dan dapat meng-override resolusi target saat aktif.
    - `spawnAcpSessions` hanya diperlukan ketika OpenClaw perlu membuat/mengikat thread turunan melalui `--thread auto|here`. Ini tidak diperlukan untuk `/acp spawn ... --bind here` di channel saat ini.

    Lihat [ACP Agents](/id/tools/acp-agents) untuk detail perilaku binding.

  </Accordion>

  <Accordion title="Reaction notifications">
    Mode notifikasi reaksi per guild:

    - `off`
    - `own` (default)
    - `all`
    - `allowlist` (menggunakan `guilds.<id>.users`)

    Event reaksi diubah menjadi event sistem dan dilampirkan ke sesi Discord yang dirutekan.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` mengirim emoji tanda terima saat OpenClaw sedang memproses pesan masuk.

    Urutan resolusi:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada "👀")

    Catatan:

    - Discord menerima emoji unicode atau nama emoji kustom.
    - Gunakan `""` untuk menonaktifkan reaksi untuk channel atau akun.

  </Accordion>

  <Accordion title="Config writes">
    Penulisan config yang dipicu channel diaktifkan secara default.

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

    Override per akun:

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
        token: "pk_live_...", // opsional; diperlukan untuk sistem privat
      },
    },
  },
}
```

    Catatan:

    - allowlist dapat menggunakan `pk:<memberId>`
    - nama tampilan anggota dicocokkan berdasarkan nama/slug hanya ketika `channels.discord.dangerouslyAllowNameMatching: true`
    - lookup menggunakan ID pesan asli dan dibatasi oleh jendela waktu
    - jika lookup gagal, pesan yang diproksikan diperlakukan sebagai pesan bot dan dibuang kecuali `allowBots=true`

  </Accordion>

  <Accordion title="Presence configuration">
    Pembaruan presence diterapkan saat Anda menetapkan field status atau activity, atau saat Anda mengaktifkan auto presence.

    Contoh status saja:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Contoh activity (custom status adalah tipe activity default):

```json5
{
  channels: {
    discord: {
      activity: "Waktu fokus",
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
      activity: "Coding langsung",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Peta tipe activity:

    - 0: Playing
    - 1: Streaming (memerlukan `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (menggunakan teks activity sebagai status state; emoji opsional)
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
        exhaustedText: "token habis",
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
    - `channels.discord.execApprovals.approvers` (opsional; fallback ke `commands.ownerAllowFrom` jika memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord secara otomatis mengaktifkan exec approval native saat `enabled` tidak disetel atau `"auto"` dan setidaknya satu approver dapat diresolusikan, baik dari `execApprovals.approvers` maupun dari `commands.ownerAllowFrom`. Discord tidak menyimpulkan exec approver dari `allowFrom` channel, `dm.allowFrom` legacy, atau `defaultTo` direct-message. Setel `enabled: false` untuk menonaktifkan Discord sebagai klien approval native secara eksplisit.

    Saat `target` adalah `channel` atau `both`, prompt approval terlihat di channel. Hanya approver yang berhasil diresolusikan yang dapat menggunakan tombol; pengguna lain menerima penolakan ephemeral. Prompt approval menyertakan teks perintah, jadi aktifkan pengiriman ke channel hanya di channel tepercaya. Jika ID channel tidak dapat diturunkan dari session key, OpenClaw fallback ke pengiriman DM.

    Discord juga merender tombol approval bersama yang digunakan oleh channel chat lain. Adapter Discord native terutama menambahkan perutean DM approver dan fanout channel.
    Saat tombol tersebut ada, tombol itu menjadi UX approval utama; OpenClaw
    seharusnya hanya menyertakan perintah manual `/approve` saat hasil tool mengatakan
    approval chat tidak tersedia atau approval manual adalah satu-satunya jalur.

    Auth Gateway untuk handler ini menggunakan kontrak resolusi kredensial bersama yang sama seperti klien Gateway lain:

    - auth lokal yang mendahulukan env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` lalu `gateway.auth.*`)
    - dalam mode lokal, `gateway.remote.*` dapat digunakan sebagai fallback hanya ketika `gateway.auth.*` tidak disetel; SecretRef lokal yang dikonfigurasi tetapi tidak dapat diresolusikan gagal tertutup
    - dukungan mode remote melalui `gateway.remote.*` saat berlaku
    - override URL aman terhadap override: override CLI tidak menggunakan ulang kredensial implisit, dan override env hanya menggunakan kredensial env

    Perilaku resolusi approval:

    - ID yang diawali `plugin:` diresolusikan melalui `plugin.approval.resolve`.
    - ID lain diresolusikan melalui `exec.approval.resolve`.
    - Discord tidak melakukan hop fallback exec-ke-plugin tambahan di sini; prefiks
      id menentukan metode gateway mana yang dipanggil.

    Exec approval kedaluwarsa setelah 30 menit secara default. Jika approval gagal dengan
    ID approval yang tidak dikenal, verifikasi resolusi approver, pengaktifan fitur, dan
    bahwa jenis approval id yang dikirim cocok dengan permintaan yang tertunda.

    Dokumen terkait: [Exec approvals](/id/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Tools dan gate aksi

Aksi pesan Discord mencakup pengiriman pesan, admin channel, moderasi, presence, dan aksi metadata.

Contoh inti:

- pengiriman pesan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- presence: `setPresence`

Aksi `event-create` menerima parameter `image` opsional (URL atau jalur file lokal) untuk menetapkan gambar sampul event terjadwal.

Gate aksi berada di bawah `channels.discord.actions.*`.

Perilaku gate default:

| Grup aksi                                                                                                                                                                | Default   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled   |
| roles                                                                                                                                                                    | disabled  |
| moderation                                                                                                                                                               | disabled  |
| presence                                                                                                                                                                 | disabled  |

## UI Components v2

OpenClaw menggunakan Discord components v2 untuk exec approval dan penanda lintas-konteks. Aksi pesan Discord juga dapat menerima `components` untuk UI kustom (lanjutan; memerlukan penyusunan payload komponen melalui tool discord), sementara `embeds` legacy tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` menetapkan warna aksen yang digunakan oleh container komponen Discord (hex).
- Setel per akun dengan `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` diabaikan saat components v2 hadir.

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

## Voice channels

OpenClaw dapat bergabung ke voice channel Discord untuk percakapan realtime dan berkelanjutan. Ini terpisah dari lampiran pesan suara.

Persyaratan:

- Aktifkan perintah native (`commands.native` atau `channels.discord.commands.native`).
- Konfigurasikan `channels.discord.voice`.
- Bot memerlukan izin Connect + Speak di voice channel target.

Gunakan perintah native khusus Discord `/vc join|leave|status` untuk mengontrol sesi. Perintah ini menggunakan agen default akun dan mengikuti aturan allowlist dan group policy yang sama seperti perintah Discord lainnya.

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

- `voice.tts` meng-override `messages.tts` hanya untuk pemutaran suara.
- Giliran transkrip suara menurunkan status owner dari Discord `allowFrom` (atau `dm.allowFrom`); pembicara non-owner tidak dapat mengakses tool khusus owner (misalnya `gateway` dan `cron`).
- Voice diaktifkan secara default; setel `channels.discord.voice.enabled=false` untuk menonaktifkannya.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi join `@discordjs/voice`.
- Default `@discordjs/voice` adalah `daveEncryption=true` dan `decryptionFailureTolerance=24` jika tidak disetel.
- OpenClaw juga memantau kegagalan dekripsi saat menerima dan memulihkan secara otomatis dengan keluar/bergabung ulang ke voice channel setelah kegagalan berulang dalam jendela waktu singkat.
- Jika log penerimaan berulang kali menampilkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, ini mungkin bug penerimaan upstream `@discordjs/voice` yang dilacak di [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

## Pesan suara

Pesan suara Discord menampilkan pratinjau waveform dan memerlukan audio OGG/Opus plus metadata. OpenClaw menghasilkan waveform secara otomatis, tetapi memerlukan `ffmpeg` dan `ffprobe` tersedia di host gateway untuk memeriksa dan mengonversi file audio.

Persyaratan dan batasan:

- Berikan **jalur file lokal** (URL ditolak).
- Hilangkan konten teks (Discord tidak mengizinkan teks + pesan suara dalam payload yang sama).
- Format audio apa pun diterima; OpenClaw mengonversi ke OGG/Opus bila diperlukan.

Contoh:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - aktifkan Message Content Intent
    - aktifkan Server Members Intent saat Anda bergantung pada resolusi user/member
    - restart gateway setelah mengubah intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - verifikasi `groupPolicy`
    - verifikasi guild allowlist di bawah `channels.discord.guilds`
    - jika map `channels` guild ada, hanya channel yang terdaftar yang diizinkan
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

    - `groupPolicy="allowlist"` tanpa allowlist guild/channel yang cocok
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

    Knob timeout run worker:

    - akun tunggal: `channels.discord.inboundWorker.runTimeoutMs`
    - multi-akun: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - default: `1800000` (30 menit); setel `0` untuk menonaktifkan

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

    Gunakan `eventQueue.listenerTimeout` untuk setup listener yang lambat dan `inboundWorker.runTimeoutMs`
    hanya jika Anda menginginkan katup pengaman terpisah untuk giliran agen yang masuk ke antrean.

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Pemeriksaan izin `channels status --probe` hanya berfungsi untuk ID channel numerik.

    Jika Anda menggunakan key slug, pencocokan runtime masih dapat berfungsi, tetapi probe tidak dapat memverifikasi izin sepenuhnya.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - menunggu persetujuan pairing dalam mode `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Secara default, pesan yang ditulis bot diabaikan.

    Jika Anda menyetel `channels.discord.allowBots=true`, gunakan aturan mention dan allowlist yang ketat untuk menghindari perilaku loop.
    Lebih baik gunakan `channels.discord.allowBots="mentions"` untuk hanya menerima pesan bot yang menyebut bot.

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - pastikan OpenClaw tetap terbaru (`openclaw update`) agar logika pemulihan penerimaan voice Discord tersedia
    - konfirmasikan `channels.discord.voice.daveEncryption=true` (default)
    - mulai dari `channels.discord.voice.decryptionFailureTolerance=24` (default upstream) dan sesuaikan hanya jika diperlukan
    - pantau log untuk:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jika kegagalan berlanjut setelah join ulang otomatis, kumpulkan log dan bandingkan dengan [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Penunjuk referensi konfigurasi

Referensi utama:

- [Configuration reference - Discord](/id/gateway/configuration-reference#discord)

Field Discord dengan sinyal tinggi:

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- kebijakan: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- perintah: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- antrean event: `eventQueue.listenerTimeout` (anggaran listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- balasan/riwayat: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` membatasi upload Discord outbound (default: `100MB`)
- aksi: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- fitur: `threadBindings`, `bindings[]` tingkat atas (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Keamanan dan operasi

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` lebih disukai di lingkungan yang diawasi).
- Berikan izin Discord dengan hak minimum.
- Jika deploy/status perintah sudah usang, restart gateway dan periksa ulang dengan `openclaw channels status --probe`.

## Terkait

- [Pairing](/id/channels/pairing)
- [Groups](/id/channels/groups)
- [Channel routing](/id/channels/channel-routing)
- [Security](/id/gateway/security)
- [Multi-agent routing](/id/concepts/multi-agent)
- [Troubleshooting](/id/channels/troubleshooting)
- [Slash commands](/id/tools/slash-commands)
