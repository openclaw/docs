---
read_when:
    - Mengerjakan fitur channel Discord
summary: Status dukungan bot Discord, kemampuan, dan konfigurasi
title: Discord
x-i18n:
    generated_at: "2026-04-26T11:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68f4e1885aab2438c38ef3735b752968b7e1ed70795d1c3903fad20ff183d3ca
    source_path: channels/discord.md
    workflow: 15
---

Siap untuk DM dan channel guild melalui gateway Discord resmi.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Discord DM secara default menggunakan mode pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah channel" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas channel dan alur perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

Anda perlu membuat aplikasi baru dengan bot, menambahkan bot ke server Anda, lalu memasangkannya ke OpenClaw. Kami menyarankan untuk menambahkan bot Anda ke server pribadi Anda sendiri. Jika Anda belum memilikinya, [buat terlebih dahulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (pilih **Create My Own > For me and my friends**).

<Steps>
  <Step title="Buat aplikasi dan bot Discord">
    Buka [Discord Developer Portal](https://discord.com/developers/applications) lalu klik **New Application**. Beri nama seperti "OpenClaw".

    Klik **Bot** di sidebar. Atur **Username** ke nama yang Anda gunakan untuk agent OpenClaw Anda.

  </Step>

  <Step title="Aktifkan privileged intents">
    Masih di halaman **Bot**, gulir ke bawah ke **Privileged Gateway Intents** lalu aktifkan:

    - **Message Content Intent** (wajib)
    - **Server Members Intent** (disarankan; wajib untuk allowlist role dan pencocokan nama-ke-ID)
    - **Presence Intent** (opsional; hanya diperlukan untuk pembaruan presence)

  </Step>

  <Step title="Salin token bot Anda">
    Gulir kembali ke atas pada halaman **Bot** lalu klik **Reset Token**.

    <Note>
    Meski namanya demikian, ini menghasilkan token pertama Anda — tidak ada yang sedang "direset."
    </Note>

    Salin token tersebut dan simpan di suatu tempat. Ini adalah **Bot Token** Anda dan Anda akan segera membutuhkannya.

  </Step>

  <Step title="Buat URL undangan dan tambahkan bot ke server Anda">
    Klik **OAuth2** di sidebar. Anda akan membuat URL undangan dengan izin yang tepat untuk menambahkan bot ke server Anda.

    Gulir ke bawah ke **OAuth2 URL Generator** lalu aktifkan:

    - `bot`
    - `applications.commands`

    Bagian **Bot Permissions** akan muncul di bawahnya. Aktifkan setidaknya:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opsional)

    Ini adalah set dasar untuk channel teks normal. Jika Anda berencana memposting di thread Discord, termasuk alur forum atau media channel yang membuat atau melanjutkan thread, aktifkan juga **Send Messages in Threads**.
    Salin URL yang dihasilkan di bagian bawah, tempelkan ke browser Anda, pilih server Anda, lalu klik **Continue** untuk menghubungkan. Anda sekarang seharusnya dapat melihat bot Anda di server Discord.

  </Step>

  <Step title="Aktifkan Developer Mode dan kumpulkan ID Anda">
    Kembali di aplikasi Discord, Anda perlu mengaktifkan Developer Mode agar dapat menyalin ID internal.

    1. Klik **User Settings** (ikon roda gigi di sebelah avatar Anda) → **Advanced** → aktifkan **Developer Mode**
    2. Klik kanan **ikon server** Anda di sidebar → **Copy Server ID**
    3. Klik kanan **avatar Anda sendiri** → **Copy User ID**

    Simpan **Server ID** dan **User ID** Anda bersama Bot Token — Anda akan mengirimkan ketiganya ke OpenClaw pada langkah berikutnya.

  </Step>

  <Step title="Izinkan DM dari anggota server">
    Agar pairing berfungsi, Discord harus mengizinkan bot Anda mengirim DM kepada Anda. Klik kanan **ikon server** Anda → **Privacy Settings** → aktifkan **Direct Messages**.

    Ini memungkinkan anggota server (termasuk bot) mengirimi Anda DM. Biarkan ini tetap aktif jika Anda ingin menggunakan Discord DM dengan OpenClaw. Jika Anda hanya berencana menggunakan channel guild, Anda dapat menonaktifkan DM setelah pairing.

  </Step>

  <Step title="Atur token bot Anda dengan aman (jangan kirim di chat)">
    Token bot Discord Anda adalah rahasia (seperti kata sandi). Atur token tersebut pada mesin yang menjalankan OpenClaw sebelum mengirim pesan ke agent Anda.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Jika OpenClaw sudah berjalan sebagai layanan latar belakang, mulai ulang melalui aplikasi OpenClaw Mac atau dengan menghentikan dan menjalankan kembali proses `openclaw gateway run`.

  </Step>

  <Step title="Konfigurasikan OpenClaw dan lakukan pairing">

    <Tabs>
      <Tab title="Minta agent Anda">
        Chat dengan agent OpenClaw Anda di channel lain yang sudah ada (misalnya Telegram) lalu beri tahu agent tersebut. Jika Discord adalah channel pertama Anda, gunakan tab CLI / config sebagai gantinya.

        > "Saya sudah mengatur token bot Discord saya di config. Tolong selesaikan penyiapan Discord dengan User ID `<user_id>` dan Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Jika Anda lebih memilih config berbasis file, atur:

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

        Nilai `token` plaintext didukung. Nilai SecretRef juga didukung untuk `channels.discord.token` pada provider env/file/exec. Lihat [Secrets Management](/id/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Setujui pairing DM pertama">
    Tunggu sampai gateway berjalan, lalu kirim DM ke bot Anda di Discord. Bot akan merespons dengan kode pairing.

    <Tabs>
      <Tab title="Minta agent Anda">
        Kirim kode pairing ke agent Anda di channel Anda yang sudah ada:

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

    Anda sekarang seharusnya dapat chat dengan agent Anda di Discord melalui DM.

  </Step>
</Steps>

<Note>
Resolusi token bersifat account-aware. Nilai token config lebih diutamakan daripada fallback env. `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Untuk panggilan outbound lanjutan (tool pesan/aksi channel), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk aksi gaya kirim dan baca/probe (misalnya read/search/fetch/thread/pins/permissions). Pengaturan kebijakan akun/retry tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Disarankan: Siapkan workspace guild

Setelah DM berfungsi, Anda dapat menyiapkan server Discord Anda sebagai workspace penuh, tempat setiap channel mendapatkan sesi agent sendiri dengan context masing-masing. Ini direkomendasikan untuk server pribadi yang hanya berisi Anda dan bot Anda.

<Steps>
  <Step title="Tambahkan server Anda ke guild allowlist">
    Ini memungkinkan agent Anda merespons di channel mana pun pada server Anda, bukan hanya DM.

    <Tabs>
      <Tab title="Minta agent Anda">
        > "Tambahkan Discord Server ID saya `<server_id>` ke guild allowlist"
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

  <Step title="Izinkan respons tanpa @mention">
    Secara default, agent Anda hanya merespons di channel guild saat di-@mention. Untuk server pribadi, Anda mungkin ingin agent tersebut merespons setiap pesan.

    <Tabs>
      <Tab title="Minta agent Anda">
        > "Izinkan agent saya merespons di server ini tanpa harus di-@mention"
      </Tab>
      <Tab title="Config">
        Atur `requireMention: false` di config guild Anda:

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

  <Step title="Rencanakan memori di channel guild">
    Secara default, memori jangka panjang (`MEMORY.md`) hanya dimuat di sesi DM. Channel guild tidak otomatis memuat `MEMORY.md`.

    <Tabs>
      <Tab title="Minta agent Anda">
        > "Saat saya mengajukan pertanyaan di channel Discord, gunakan memory_search atau memory_get jika Anda memerlukan context jangka panjang dari MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Jika Anda memerlukan context bersama di setiap channel, letakkan instruksi stabil di `AGENTS.md` atau `USER.md` (keduanya diinjeksikan untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan dengan tool memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat beberapa channel di server Discord Anda dan mulai chat. Agent Anda dapat melihat nama channel, dan setiap channel mendapatkan sesi terisolasi sendiri — jadi Anda dapat menyiapkan `#coding`, `#home`, `#research`, atau apa pun yang sesuai dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan masuk dari Discord kembali ke Discord.
- Metadata guild/channel Discord ditambahkan ke prompt model sebagai context tidak tepercaya, bukan sebagai prefiks balasan yang terlihat oleh pengguna. Jika model menyalin envelope tersebut kembali, OpenClaw menghapus metadata yang disalin dari balasan outbound dan dari context replay berikutnya.
- Secara default (`session.dmScope=main`), chat langsung berbagi sesi utama agent (`agent:main:main`).
- Channel guild adalah kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Slash command native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.
- Pengiriman pengumuman cron/heartbeat khusus teks ke Discord menggunakan jawaban akhir yang terlihat oleh assistant satu kali. Payload media dan komponen terstruktur tetap berupa multi-pesan saat agent mengeluarkan beberapa payload yang dapat dikirim.

## Channel forum

Forum Discord dan media channel hanya menerima postingan thread. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke parent forum (`channel:<forumId>`) untuk membuat thread secara otomatis. Judul thread menggunakan baris pertama pesan Anda yang tidak kosong.
- Gunakan `openclaw message thread create` untuk membuat thread secara langsung. Jangan gunakan `--message-id` untuk forum channel.

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

OpenClaw mendukung container komponen Discord v2 untuk pesan agent. Gunakan tool pesan dengan payload `components`. Hasil interaksi dirutekan kembali ke agent sebagai pesan masuk normal dan mengikuti pengaturan Discord `replyToMode` yang ada.

Blok yang didukung:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Baris aksi mengizinkan hingga 5 tombol atau satu menu select
- Tipe select: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya sekali pakai. Atur `components.reusable=true` untuk mengizinkan tombol, select, dan formulir digunakan beberapa kali hingga kedaluwarsa.

Untuk membatasi siapa yang dapat mengeklik tombol, atur `allowedUsers` pada tombol tersebut (Discord user ID, tag, atau `*`). Jika dikonfigurasi, pengguna yang tidak cocok akan menerima penolakan ephemeral.

Perintah slash `/model` dan `/models` membuka pemilih model interaktif dengan dropdown provider, model, dan runtime yang kompatibel, plus langkah Submit. `/models add` sudah deprecated dan sekarang mengembalikan pesan deprecation alih-alih mendaftarkan model dari chat. Balasan pemilih bersifat ephemeral dan hanya pengguna yang memanggilnya yang dapat menggunakannya.

Lampiran file:

- blok `file` harus mengarah ke referensi lampiran (`attachment://<filename>`)
- Berikan lampiran melalui `media`/`path`/`filePath` (satu file); gunakan `media-gallery` untuk beberapa file
- Gunakan `filename` untuk menimpa nama unggahan saat harus cocok dengan referensi lampiran

Form modal:

- Tambahkan `components.modal` dengan hingga 5 field
- Tipe field: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
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

## Kontrol akses dan perutean

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.discord.dmPolicy` mengontrol akses DM (legacy: `channels.discord.dm.policy`):

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.discord.allowFrom` untuk menyertakan `"*"`; legacy: `channels.discord.dm.allowFrom`)
    - `disabled`

    Jika kebijakan DM tidak open, pengguna yang tidak dikenal akan diblokir (atau diminta melakukan pairing dalam mode `pairing`).

    Prioritas multi-akun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Akun bernama mewarisi `channels.discord.allowFrom` saat `allowFrom` miliknya sendiri tidak diatur.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - mention `<@id>`

    ID numerik polos ambigu dan ditolak kecuali jenis target user/channel eksplisit diberikan.

  </Tab>

  <Tab title="Kebijakan guild">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman saat `channels.discord` ada adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` lebih disukai, slug diterima)
    - allowlist pengirim opsional: `users` (ID stabil direkomendasikan) dan `roles` (hanya ID role); jika salah satu dikonfigurasi, pengirim diizinkan saat cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag langsung dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memperingatkan saat entri nama/tag digunakan
    - jika guild memiliki `channels` yang dikonfigurasi, channel yang tidak terdaftar akan ditolak
    - jika guild tidak memiliki blok `channels`, semua channel dalam guild yang ada di allowlist diizinkan

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

    Jika Anda hanya mengatur `DISCORD_BOT_TOKEN` dan tidak membuat blok `channels.discord`, fallback runtime adalah `groupPolicy="allowlist"` (dengan peringatan di log), bahkan jika `channels.defaults.groupPolicy` adalah `open`.

  </Tab>

  <Tab title="Mention dan group DM">
    Pesan guild dibatasi mention secara default.

    Deteksi mention mencakup:

    - mention bot eksplisit
    - pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku reply-to-bot implisit dalam kasus yang didukung

    `requireMention` dikonfigurasi per guild/channel (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional mengabaikan pesan yang menyebut user/role lain tetapi bukan bot (tidak termasuk @everyone/@here).

    Group DM:

    - default: diabaikan (`dm.groupEnabled=false`)
    - allowlist opsional melalui `dm.groupChannels` (ID channel atau slug)

  </Tab>
</Tabs>

### Perutean agent berbasis role

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agent yang berbeda berdasarkan ID role. Binding berbasis role hanya menerima ID role dan dievaluasi setelah binding peer atau parent-peer dan sebelum binding khusus guild. Jika sebuah binding juga menetapkan field pencocokan lain (misalnya `peer` + `guildId` + `roles`), semua field yang dikonfigurasi harus cocok.

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

## Perintah native dan auth perintah

- `commands.native` defaultnya `"auto"` dan diaktifkan untuk Discord.
- Override per channel: `channels.discord.commands.native`.
- `commands.native=false` secara eksplisit menghapus perintah native Discord yang sebelumnya terdaftar.
- Auth perintah native menggunakan allowlist/kebijakan Discord yang sama seperti penanganan pesan normal.
- Perintah mungkin tetap terlihat di UI Discord untuk pengguna yang tidak berwenang; eksekusi tetap menerapkan auth OpenClaw dan mengembalikan "not authorized".

Lihat [Slash commands](/id/tools/slash-commands) untuk katalog dan perilaku perintah.

Pengaturan default slash command:

- `ephemeral: true`

## Detail fitur

<AccordionGroup>
  <Accordion title="Tag balasan dan balasan native">
    Discord mendukung tag balasan dalam output agent:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Dikontrol oleh `channels.discord.replyToMode`:

    - `off` (default)
    - `first`
    - `all`
    - `batched`

    Catatan: `off` menonaktifkan threading balasan implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.
    `first` selalu melampirkan referensi balasan native implisit ke pesan Discord outbound pertama untuk giliran tersebut.
    `batched` hanya melampirkan referensi balasan native implisit Discord saat
    giliran masuk adalah batch beberapa pesan yang di-debounce. Ini berguna
    saat Anda menginginkan balasan native terutama untuk chat ambigu yang ramai, bukan setiap
    giliran satu pesan.

    ID pesan ditampilkan dalam context/riwayat sehingga agent dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Pratinjau stream live">
    OpenClaw dapat melakukan stream balasan draf dengan mengirim pesan sementara dan mengeditnya saat teks datang. `channels.discord.streaming` menerima `off` (default) | `partial` | `block` | `progress`. `progress` dipetakan ke `partial` di Discord; `streamMode` adalah alias legacy dan dimigrasikan otomatis.

    Default tetap `off` karena edit pratinjau Discord cepat terkena batas laju saat beberapa bot atau gateway berbagi akun.

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

    - `partial` mengedit satu pesan pratinjau saat token datang.
    - `block` mengeluarkan potongan seukuran draf (gunakan `draftChunk` untuk menyesuaikan ukuran dan breakpoint, dibatasi ke `textChunkLimit`).
    - Final media, error, dan balasan eksplisit membatalkan edit pratinjau yang tertunda.
    - `streaming.preview.toolProgress` (default `true`) mengontrol apakah pembaruan tool/progress menggunakan ulang pesan pratinjau.

    Stream pratinjau hanya untuk teks; balasan media kembali ke pengiriman normal. Saat stream `block` diaktifkan secara eksplisit, OpenClaw melewati stream pratinjau untuk menghindari stream ganda.

  </Accordion>

  <Accordion title="Riwayat, context, dan perilaku thread">
    Context riwayat guild:

    - `channels.discord.historyLimit` default `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Kontrol riwayat DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Perilaku thread:

    - Thread Discord dirutekan sebagai sesi channel dan mewarisi config channel induk kecuali dioverride.
    - `channels.discord.thread.inheritParent` (default `false`) membuat thread otomatis baru ikut menggunakan transkrip induk sebagai seed. Override per akun ada di bawah `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaksi tool pesan dapat menyelesaikan target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` dipertahankan selama fallback aktivasi tahap balasan.

    Topik channel diinjeksikan sebagai context **tidak tepercaya**. Allowlists mengatur siapa yang dapat memicu agent, bukan batas penuh redaksi context tambahan.

  </Accordion>

  <Accordion title="Sesi terikat thread untuk subagent">
    Discord dapat mengikat thread ke target sesi sehingga pesan lanjutan dalam thread itu tetap dirutekan ke sesi yang sama (termasuk sesi subagent).

    Perintah:

    - `/focus <target>` mengikat thread saat ini/baru ke target subagent/sesi
    - `/unfocus` menghapus binding thread saat ini
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
    - `channels.discord.threadBindings.*` menimpa perilaku Discord.
    - `spawnSubagentSessions` harus bernilai true untuk membuat/mengikat thread secara otomatis untuk `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` harus bernilai true untuk membuat/mengikat thread secara otomatis untuk ACP (`/acp spawn ... --thread ...` atau `sessions_spawn({ runtime: "acp", thread: true })`).
    - Jika binding thread dinonaktifkan untuk sebuah akun, `/focus` dan operasi binding thread terkait tidak tersedia.

    Lihat [Sub-agents](/id/tools/subagents), [ACP Agents](/id/tools/acp-agents), dan [Configuration Reference](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Binding channel ACP persisten">
    Untuk workspace ACP stabil yang "selalu aktif", konfigurasikan binding ACP bertipe level atas yang menargetkan percakapan Discord.

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

    - `/acp spawn codex --bind here` mengikat channel atau thread saat ini di tempat dan menjaga pesan berikutnya tetap pada sesi ACP yang sama. Pesan thread mewarisi binding channel induk.
    - Dalam channel atau thread yang terikat, `/new` dan `/reset` mereset sesi ACP yang sama di tempat. Binding thread sementara dapat menimpa resolusi target selama masih aktif.
    - `spawnAcpSessions` hanya diperlukan saat OpenClaw perlu membuat/mengikat child thread melalui `--thread auto|here`.

    Lihat [ACP Agents](/id/tools/acp-agents) untuk detail perilaku binding.

  </Accordion>

  <Accordion title="Notifikasi reaksi">
    Mode notifikasi reaksi per guild:

    - `off`
    - `own` (default)
    - `all`
    - `allowlist` (menggunakan `guilds.<id>.users`)

    Event reaksi diubah menjadi event sistem dan dilampirkan ke sesi Discord yang dirutekan.

  </Accordion>

  <Accordion title="Reaksi ack">
    `ackReaction` mengirim emoji pengakuan saat OpenClaw sedang memproses pesan masuk.

    Urutan resolusi:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agent (`agents.list[].identity.emoji`, atau "👀")

    Catatan:

    - Discord menerima emoji unicode atau nama emoji kustom.
    - Gunakan `""` untuk menonaktifkan reaksi pada channel atau akun.

  </Accordion>

  <Accordion title="Penulisan config">
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

  <Accordion title="Proxy Gateway">
    Rutekan trafik WebSocket gateway Discord dan lookup REST saat startup (ID aplikasi + resolusi allowlist) melalui proxy HTTP(S) dengan `channels.discord.proxy`.

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

  <Accordion title="Dukungan PluralKit">
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
    - nama tampilan anggota dicocokkan berdasarkan nama/slug hanya saat `channels.discord.dangerouslyAllowNameMatching: true`
    - lookup menggunakan ID pesan asli dan dibatasi oleh jendela waktu
    - jika lookup gagal, pesan yang diproksikan diperlakukan sebagai pesan bot dan diabaikan kecuali `allowBots=true`

  </Accordion>

  <Accordion title="Konfigurasi presence">
    Pembaruan presence diterapkan saat Anda menetapkan field status atau aktivitas, atau saat Anda mengaktifkan auto presence.

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

    Contoh aktivitas (custom status adalah tipe aktivitas default):

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

    Peta tipe aktivitas:

    - 0: Playing
    - 1: Streaming (memerlukan `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (menggunakan teks aktivitas sebagai state status; emoji opsional)
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

  <Accordion title="Persetujuan di Discord">
    Discord mendukung penanganan persetujuan berbasis tombol di DM dan secara opsional dapat memposting prompt persetujuan di channel asal.

    Jalur config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; fallback ke `commands.ownerAllowFrom` jika memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord secara otomatis mengaktifkan persetujuan exec native saat `enabled` tidak diatur atau `"auto"` dan setidaknya satu approver dapat diresolusikan, baik dari `execApprovals.approvers` maupun dari `commands.ownerAllowFrom`. Discord tidak menyimpulkan approver exec dari channel `allowFrom`, `dm.allowFrom` legacy, atau `defaultTo` direct message. Atur `enabled: false` untuk menonaktifkan Discord sebagai klien persetujuan native secara eksplisit.

    Saat `target` adalah `channel` atau `both`, prompt persetujuan terlihat di channel. Hanya approver yang berhasil diresolusikan yang dapat menggunakan tombol; pengguna lain menerima penolakan ephemeral. Prompt persetujuan menyertakan teks perintah, jadi aktifkan pengiriman channel hanya di channel tepercaya. Jika ID channel tidak dapat diturunkan dari kunci sesi, OpenClaw fallback ke pengiriman DM.

    Discord juga merender tombol persetujuan bersama yang digunakan oleh channel chat lain. Adapter Discord native terutama menambahkan perutean DM approver dan fanout channel.
    Saat tombol tersebut ada, tombol itu menjadi UX persetujuan utama; OpenClaw
    seharusnya hanya menyertakan perintah `/approve` manual saat hasil tool menyatakan
    persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.

    Auth Gateway dan resolusi persetujuan mengikuti kontrak klien Gateway bersama (`plugin:` IDs diresolusikan melalui `plugin.approval.resolve`; ID lainnya melalui `exec.approval.resolve`). Persetujuan kedaluwarsa setelah 30 menit secara default.

    Lihat [Exec approvals](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tool dan gerbang aksi

Aksi pesan Discord mencakup perpesanan, admin channel, moderasi, presence, dan aksi metadata.

Contoh inti:

- perpesanan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- presence: `setPresence`

Aksi `event-create` menerima parameter `image` opsional (URL atau path file lokal) untuk menetapkan gambar sampul event terjadwal.

Gerbang aksi berada di bawah `channels.discord.actions.*`.

Perilaku gerbang default:

| Grup aksi                                                                                                                                                                | Default   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled   |
| roles                                                                                                                                                                    | disabled  |
| moderation                                                                                                                                                               | disabled  |
| presence                                                                                                                                                                 | disabled  |

## UI Components v2

OpenClaw menggunakan Discord components v2 untuk persetujuan exec dan penanda lintas-context. Aksi pesan Discord juga dapat menerima `components` untuk UI kustom (lanjutan; memerlukan pembuatan payload komponen melalui tool discord), sementara `embeds` legacy tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` menetapkan warna aksen yang digunakan oleh container komponen Discord (hex).
- Atur per akun dengan `channels.discord.accounts.<id>.ui.components.accentColor`.
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

## Suara

Discord memiliki dua permukaan suara yang berbeda: **voice channels** realtime (percakapan berkelanjutan) dan **voice message attachments** (format pratinjau waveform). Gateway mendukung keduanya.

### Voice channels

Checklist penyiapan:

1. Aktifkan Message Content Intent di Discord Developer Portal.
2. Aktifkan Server Members Intent saat allowlist role/user digunakan.
3. Undang bot dengan scope `bot` dan `applications.commands`.
4. Berikan izin Connect, Speak, Send Messages, dan Read Message History di voice channel target.
5. Aktifkan perintah native (`commands.native` atau `channels.discord.commands.native`).
6. Konfigurasikan `channels.discord.voice`.

Gunakan `/vc join|leave|status` untuk mengontrol sesi. Perintah ini menggunakan agent default akun dan mengikuti aturan allowlist serta group policy yang sama seperti perintah Discord lainnya.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Contoh auto-join:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
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
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Catatan:

- `voice.tts` menimpa `messages.tts` hanya untuk pemutaran suara.
- `voice.model` menimpa LLM yang digunakan hanya untuk respons voice channel Discord. Biarkan tidak diatur untuk mewarisi model agent yang dirutekan.
- STT menggunakan `tools.media.audio`; `voice.model` tidak memengaruhi transkripsi.
- Giliran transkrip suara menurunkan status owner dari Discord `allowFrom` (atau `dm.allowFrom`); pembicara non-owner tidak dapat mengakses tool khusus owner (misalnya `gateway` dan `cron`).
- Suara diaktifkan secara default; atur `channels.discord.voice.enabled=false` untuk menonaktifkannya.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi join `@discordjs/voice`.
- Default `@discordjs/voice` adalah `daveEncryption=true` dan `decryptionFailureTolerance=24` jika tidak diatur.
- OpenClaw juga memantau kegagalan decrypt penerimaan dan memulihkan otomatis dengan keluar/masuk kembali ke voice channel setelah kegagalan berulang dalam jendela waktu singkat.
- Jika log penerimaan berulang kali menampilkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` setelah pembaruan, kumpulkan laporan dependensi dan log. Baris `@discordjs/voice` yang dibundel mencakup perbaikan padding upstream dari discord.js PR #11449, yang menutup issue discord.js #11419.

Pipeline voice channel:

- Pengambilan PCM Discord dikonversi menjadi file temp WAV.
- `tools.media.audio` menangani STT, misalnya `openai/gpt-4o-mini-transcribe`.
- Transkrip dikirim melalui ingress dan perutean Discord normal.
- `voice.model`, saat diatur, hanya menimpa LLM respons untuk giliran voice-channel ini.
- `voice.tts` digabungkan di atas `messages.tts`; audio hasilnya diputar di channel yang diikuti.

Kredensial diresolusikan per komponen: auth rute LLM untuk `voice.model`, auth STT untuk `tools.media.audio`, dan auth TTS untuk `messages.tts`/`voice.tts`.

### Pesan suara

Pesan suara Discord menampilkan pratinjau waveform dan memerlukan audio OGG/Opus. OpenClaw menghasilkan waveform secara otomatis, tetapi memerlukan `ffmpeg` dan `ffprobe` pada host gateway untuk memeriksa dan mengonversi.

- Berikan **path file lokal** (URL ditolak).
- Hilangkan konten teks (Discord menolak teks + pesan suara dalam payload yang sama).
- Format audio apa pun diterima; OpenClaw mengonversi ke OGG/Opus sesuai kebutuhan.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Menggunakan intent yang tidak diizinkan atau bot tidak melihat pesan guild">

    - aktifkan Message Content Intent
    - aktifkan Server Members Intent saat Anda bergantung pada resolusi user/member
    - mulai ulang gateway setelah mengubah intent

  </Accordion>

  <Accordion title="Pesan guild diblokir secara tidak terduga">

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

  <Accordion title="Require mention false tetapi tetap diblokir">
    Penyebab umum:

    - `groupPolicy="allowlist"` tanpa guild/channel allowlist yang cocok
    - `requireMention` dikonfigurasi di tempat yang salah (harus di bawah `channels.discord.guilds` atau entri channel)
    - pengirim diblokir oleh allowlist `users` guild/channel

  </Accordion>

  <Accordion title="Handler yang berjalan lama timeout atau balasan duplikat">

    Log yang umum:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Knob anggaran listener:

    - akun tunggal: `channels.discord.eventQueue.listenerTimeout`
    - multi-akun: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Knob timeout eksekusi worker:

    - akun tunggal: `channels.discord.inboundWorker.runTimeoutMs`
    - multi-akun: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - default: `1800000` (30 menit); atur `0` untuk menonaktifkan

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
    hanya jika Anda menginginkan katup pengaman terpisah untuk giliran agent yang diantrikan.

  </Accordion>

  <Accordion title="Ketidakcocokan audit izin">
    Pemeriksaan izin `channels status --probe` hanya berfungsi untuk ID channel numerik.

    Jika Anda menggunakan kunci slug, pencocokan runtime tetap dapat berfungsi, tetapi probe tidak dapat memverifikasi izin sepenuhnya.

  </Accordion>

  <Accordion title="Masalah DM dan pairing">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - menunggu persetujuan pairing dalam mode `pairing`

  </Accordion>

  <Accordion title="Loop bot ke bot">
    Secara default pesan yang ditulis bot diabaikan.

    Jika Anda mengatur `channels.discord.allowBots=true`, gunakan aturan mention dan allowlist yang ketat untuk menghindari perilaku loop.
    Lebih baik gunakan `channels.discord.allowBots="mentions"` agar hanya menerima pesan bot yang me-mention bot.

  </Accordion>

  <Accordion title="Voice STT terputus dengan DecryptionFailed(...)">

    - pastikan OpenClaw tetap terbaru (`openclaw update`) agar logika pemulihan penerimaan voice Discord tersedia
    - konfirmasikan `channels.discord.voice.daveEncryption=true` (default)
    - mulai dari `channels.discord.voice.decryptionFailureTolerance=24` (default upstream) dan sesuaikan hanya jika diperlukan
    - pantau log untuk:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jika kegagalan berlanjut setelah rejoin otomatis, kumpulkan log dan bandingkan dengan riwayat penerimaan DAVE upstream di [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) dan [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referensi konfigurasi

Referensi utama: [Configuration reference - Discord](/id/gateway/config-channels#discord).

<Accordion title="Field Discord dengan sinyal tinggi">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- kebijakan: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- perintah: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- antrean event: `eventQueue.listenerTimeout` (anggaran listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- balasan/riwayat: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (membatasi unggahan Discord outbound, default `100MB`), `retry`
- aksi: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- fitur: `threadBindings`, level atas `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Keamanan dan operasi

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` disarankan di environment yang disupervisi).
- Berikan izin Discord dengan hak minimum.
- Jika deploy/state perintah stale, mulai ulang gateway dan periksa kembali dengan `openclaw channels status --probe`.

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Discord ke gateway.
  </Card>
  <Card title="Groups" icon="users" href="/id/channels/groups">
    Perilaku group chat dan allowlist.
  </Card>
  <Card title="Channel routing" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agent.
  </Card>
  <Card title="Security" icon="shield" href="/id/gateway/security">
    Model ancaman dan hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan guild dan channel ke agent.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native.
  </Card>
</CardGroup>
