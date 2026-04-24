---
read_when:
    - Mengerjakan fitur channel Discord
summary: Status dukungan, kemampuan, dan konfigurasi bot Discord
title: Discord
x-i18n:
    generated_at: "2026-04-24T08:57:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce73e0e6995702f3b2453b2e5ab4e55b02190e64fdf5805f53b4002be63140a2
    source_path: channels/discord.md
    workflow: 15
---

Siap untuk DM dan channel guild melalui gateway Discord resmi.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM Discord secara default menggunakan mode pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas channel dan alur perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

Anda perlu membuat aplikasi baru dengan bot, menambahkan bot ke server Anda, lalu memasangkannya ke OpenClaw. Kami merekomendasikan untuk menambahkan bot Anda ke server privat milik Anda sendiri. Jika Anda belum memilikinya, [buat terlebih dahulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (pilih **Create My Own > For me and my friends**).

<Steps>
  <Step title="Buat aplikasi dan bot Discord">
    Buka [Discord Developer Portal](https://discord.com/developers/applications) dan klik **New Application**. Beri nama seperti "OpenClaw".

    Klik **Bot** di bilah samping. Atur **Username** ke nama yang Anda gunakan untuk agen OpenClaw Anda.

  </Step>

  <Step title="Aktifkan intent istimewa">
    Masih di halaman **Bot**, gulir ke bawah ke **Privileged Gateway Intents** lalu aktifkan:

    - **Message Content Intent** (wajib)
    - **Server Members Intent** (disarankan; wajib untuk allowlist peran dan pencocokan nama-ke-ID)
    - **Presence Intent** (opsional; hanya diperlukan untuk pembaruan presence)

  </Step>

  <Step title="Salin token bot Anda">
    Gulir kembali ke atas di halaman **Bot** lalu klik **Reset Token**.

    <Note>
    Terlepas dari namanya, ini menghasilkan token pertama Anda — tidak ada yang sedang "direset."
    </Note>

    Salin token tersebut dan simpan di suatu tempat. Ini adalah **Bot Token** Anda dan Anda akan segera membutuhkannya.

  </Step>

  <Step title="Hasilkan URL undangan dan tambahkan bot ke server Anda">
    Klik **OAuth2** di bilah samping. Anda akan membuat URL undangan dengan izin yang tepat untuk menambahkan bot ke server Anda.

    Gulir ke bawah ke **OAuth2 URL Generator** lalu aktifkan:

    - `bot`
    - `applications.commands`

    Bagian **Bot Permissions** akan muncul di bawah. Aktifkan setidaknya:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opsional)

    Ini adalah set dasar untuk channel teks normal. Jika Anda berencana memposting di thread Discord, termasuk alur forum atau channel media yang membuat atau melanjutkan thread, aktifkan juga **Send Messages in Threads**.
    Salin URL yang dihasilkan di bagian bawah, tempel ke browser Anda, pilih server Anda, lalu klik **Continue** untuk menghubungkan. Anda sekarang seharusnya melihat bot Anda di server Discord.

  </Step>

  <Step title="Aktifkan Developer Mode dan kumpulkan ID Anda">
    Kembali ke aplikasi Discord, Anda perlu mengaktifkan Developer Mode agar dapat menyalin ID internal.

    1. Klik **User Settings** (ikon roda gigi di samping avatar Anda) → **Advanced** → aktifkan **Developer Mode**
    2. Klik kanan **ikon server** Anda di bilah samping → **Copy Server ID**
    3. Klik kanan **avatar Anda sendiri** → **Copy User ID**

    Simpan **Server ID** dan **User ID** Anda bersama Bot Token — Anda akan mengirim ketiganya ke OpenClaw pada langkah berikutnya.

  </Step>

  <Step title="Izinkan DM dari anggota server">
    Agar pairing berfungsi, Discord perlu mengizinkan bot Anda mengirim DM kepada Anda. Klik kanan **ikon server** Anda → **Privacy Settings** → aktifkan **Direct Messages**.

    Ini memungkinkan anggota server (termasuk bot) mengirim DM kepada Anda. Biarkan ini tetap aktif jika Anda ingin menggunakan DM Discord dengan OpenClaw. Jika Anda hanya berencana menggunakan channel guild, Anda dapat menonaktifkan DM setelah pairing.

  </Step>

  <Step title="Setel token bot Anda dengan aman (jangan kirim di chat)">
    Token bot Discord Anda adalah secret (seperti kata sandi). Setel token tersebut pada mesin yang menjalankan OpenClaw sebelum mengirim pesan ke agen Anda.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Jika OpenClaw sudah berjalan sebagai layanan latar belakang, mulai ulang melalui aplikasi OpenClaw Mac atau dengan menghentikan lalu memulai kembali proses `openclaw gateway run`.

  </Step>

  <Step title="Konfigurasikan OpenClaw dan lakukan pairing">

    <Tabs>
      <Tab title="Tanya agen Anda">
        Chat dengan agen OpenClaw Anda di channel yang sudah ada (misalnya Telegram) dan beri tahu agen tersebut. Jika Discord adalah channel pertama Anda, gunakan tab CLI / config sebagai gantinya.

        > "Saya sudah menyetel token bot Discord saya di config. Tolong selesaikan penyiapan Discord dengan User ID `<user_id>` dan Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Jika Anda lebih suka config berbasis file, setel:

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

        Nilai `token` plaintext didukung. Nilai SecretRef juga didukung untuk `channels.discord.token` pada penyedia env/file/exec. Lihat [Manajemen Secret](/id/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Setujui pairing DM pertama">
    Tunggu sampai gateway berjalan, lalu kirim DM ke bot Anda di Discord. Bot akan merespons dengan kode pairing.

    <Tabs>
      <Tab title="Tanya agen Anda">
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
Resolusi token memperhatikan akun. Nilai token config didahulukan dibanding fallback env. `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Untuk panggilan keluar tingkat lanjut (alat pesan/tindakan channel), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk tindakan kirim dan baca/probe (misalnya read/search/fetch/thread/pins/permissions). Pengaturan kebijakan akun/retry tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Disarankan: Siapkan workspace guild

Setelah DM berfungsi, Anda dapat menyiapkan server Discord sebagai workspace penuh tempat setiap channel mendapatkan sesi agen sendiri dengan konteksnya masing-masing. Ini direkomendasikan untuk server privat yang hanya berisi Anda dan bot Anda.

<Steps>
  <Step title="Tambahkan server Anda ke allowlist guild">
    Ini memungkinkan agen Anda merespons di channel mana pun di server Anda, bukan hanya DM.

    <Tabs>
      <Tab title="Tanya agen Anda">
        > "Tambahkan Server ID Discord saya `<server_id>` ke allowlist guild"
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
    Secara default, agen Anda hanya merespons di channel guild saat di-@mention. Untuk server privat, Anda mungkin ingin agen merespons setiap pesan.

    <Tabs>
      <Tab title="Tanya agen Anda">
        > "Izinkan agen saya merespons di server ini tanpa harus di-@mention"
      </Tab>
      <Tab title="Config">
        Setel `requireMention: false` di config guild Anda:

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
    Secara default, memori jangka panjang (`MEMORY.md`) hanya dimuat dalam sesi DM. Channel guild tidak memuat `MEMORY.md` secara otomatis.

    <Tabs>
      <Tab title="Tanya agen Anda">
        > "Saat saya mengajukan pertanyaan di channel Discord, gunakan memory_search atau memory_get jika Anda memerlukan konteks jangka panjang dari `MEMORY.md`."
      </Tab>
      <Tab title="Manual">
        Jika Anda memerlukan konteks bersama di setiap channel, taruh instruksi stabil di `AGENTS.md` atau `USER.md` (keduanya disuntikkan untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan dengan alat memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat beberapa channel di server Discord Anda dan mulai chat. Agen Anda dapat melihat nama channel, dan setiap channel mendapatkan sesi terisolasi sendiri — sehingga Anda dapat menyiapkan `#coding`, `#home`, `#research`, atau apa pun yang sesuai dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan masuk dari Discord kembali ke Discord.
- Secara default (`session.dmScope=main`), chat langsung berbagi sesi utama agen (`agent:main:main`).
- Channel guild adalah kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- Group DM diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Slash command native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.

## Channel forum

Channel forum dan media Discord hanya menerima posting thread. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke parent forum (`channel:<forumId>`) untuk membuat thread secara otomatis. Judul thread menggunakan baris pertama pesan Anda yang tidak kosong.
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

OpenClaw mendukung container komponen Discord v2 untuk pesan agen. Gunakan alat pesan dengan payload `components`. Hasil interaksi dirutekan kembali ke agen sebagai pesan masuk normal dan mengikuti pengaturan Discord `replyToMode` yang sudah ada.

Blok yang didukung:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Baris tindakan memungkinkan hingga 5 tombol atau satu menu pilih
- Jenis pilihan: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya dapat digunakan sekali. Setel `components.reusable=true` untuk mengizinkan tombol, pilihan, dan formulir digunakan beberapa kali sampai kedaluwarsa.

Untuk membatasi siapa yang dapat mengeklik tombol, setel `allowedUsers` pada tombol tersebut (ID pengguna Discord, tag, atau `*`). Jika dikonfigurasi, pengguna yang tidak cocok akan menerima penolakan ephemeral.

Slash command `/model` dan `/models` membuka pemilih model interaktif dengan dropdown penyedia dan model ditambah langkah Submit. Kecuali `commands.modelsWrite=false`, `/models add` juga mendukung penambahan entri penyedia/model baru dari chat, dan model yang baru ditambahkan muncul tanpa perlu memulai ulang gateway. Balasan pemilih bersifat ephemeral dan hanya pengguna yang memanggil yang dapat menggunakannya.

Lampiran file:

- Blok `file` harus menunjuk ke referensi lampiran (`attachment://<filename>`)
- Sediakan lampiran melalui `media`/`path`/`filePath` (satu file); gunakan `media-gallery` untuk beberapa file
- Gunakan `filename` untuk mengganti nama unggahan ketika harus cocok dengan referensi lampiran

Formulir modal:

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
    - Akun bernama mewarisi `channels.discord.allowFrom` ketika `allowFrom` miliknya sendiri tidak disetel.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - mention `<@id>`

    ID numerik polos bersifat ambigu dan ditolak kecuali jenis target user/channel yang eksplisit diberikan.

  </Tab>

  <Tab title="Kebijakan guild">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman saat `channels.discord` ada adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` lebih disarankan, slug diterima)
    - allowlist pengirim opsional: `users` (ID stabil disarankan) dan `roles` (hanya ID role); jika salah satu dikonfigurasi, pengirim diizinkan saat cocok dengan `users` ATAU `roles`
    - pencocokan langsung nama/tag dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memperingatkan saat entri nama/tag digunakan
    - jika sebuah guild memiliki `channels` yang dikonfigurasi, channel yang tidak tercantum akan ditolak
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

  <Tab title="Mention dan group DM">
    Pesan guild dibatasi oleh mention secara default.

    Deteksi mention mencakup:

    - mention bot eksplisit
    - pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku reply-ke-bot implisit dalam kasus yang didukung

    `requireMention` dikonfigurasi per guild/channel (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional membuang pesan yang me-mention pengguna/role lain tetapi bukan bot (tidak termasuk @everyone/@here).

    Group DM:

    - default: diabaikan (`dm.groupEnabled=false`)
    - allowlist opsional melalui `dm.groupChannels` (ID channel atau slug)

  </Tab>
</Tabs>

### Perutean agen berbasis role

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agen yang berbeda berdasarkan ID role. Binding berbasis role hanya menerima ID role dan dievaluasi setelah binding peer atau parent-peer dan sebelum binding khusus guild. Jika sebuah binding juga menyetel field kecocokan lain (misalnya `peer` + `guildId` + `roles`), semua field yang dikonfigurasi harus cocok.

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

## Perintah native dan autentikasi perintah

- `commands.native` default ke `"auto"` dan diaktifkan untuk Discord.
- Override per channel: `channels.discord.commands.native`.
- `commands.native=false` secara eksplisit menghapus perintah native Discord yang sebelumnya terdaftar.
- Autentikasi perintah native menggunakan allowlist/kebijakan Discord yang sama seperti penanganan pesan normal.
- Perintah mungkin tetap terlihat di UI Discord bagi pengguna yang tidak berwenang; eksekusi tetap menegakkan auth OpenClaw dan mengembalikan "not authorized".

Lihat [Slash commands](/id/tools/slash-commands) untuk katalog dan perilaku perintah.

Pengaturan slash command default:

- `ephemeral: true`

## Detail fitur

<AccordionGroup>
  <Accordion title="Tag balasan dan balasan native">
    Discord mendukung tag balasan dalam output agen:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Dikontrol oleh `channels.discord.replyToMode`:

    - `off` (default)
    - `first`
    - `all`
    - `batched`

    Catatan: `off` menonaktifkan threading balasan implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.
    `first` selalu melampirkan referensi balasan native implisit ke pesan Discord keluar pertama untuk giliran tersebut.
    `batched` hanya melampirkan referensi balasan native implisit Discord ketika
    giliran masuk adalah batch yang di-debounce dari beberapa pesan. Ini berguna
    ketika Anda menginginkan balasan native terutama untuk chat cepat yang ambigu, bukan untuk setiap
    giliran pesan tunggal.

    ID pesan ditampilkan dalam konteks/riwayat sehingga agen dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Pratinjau stream langsung">
    OpenClaw dapat me-stream draf balasan dengan mengirim pesan sementara dan mengeditnya saat teks masuk. `channels.discord.streaming` menerima `off` (default) | `partial` | `block` | `progress`. `progress` dipetakan ke `partial` di Discord; `streamMode` adalah alias legacy dan dimigrasikan secara otomatis.

    Default tetap `off` karena edit pratinjau Discord cepat mencapai batas laju saat beberapa bot atau gateway berbagi satu akun.

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

    - `partial` mengedit satu pesan pratinjau saat token masuk.
    - `block` mengeluarkan potongan berukuran draf (gunakan `draftChunk` untuk menyetel ukuran dan titik pemisah, dibatasi ke `textChunkLimit`).
    - Final media, error, dan balasan eksplisit membatalkan edit pratinjau yang tertunda.
    - `streaming.preview.toolProgress` (default `true`) mengontrol apakah pembaruan alat/progres menggunakan kembali pesan pratinjau.

    Stream pratinjau hanya untuk teks; balasan media kembali ke pengiriman normal. Ketika stream `block` diaktifkan secara eksplisit, OpenClaw melewati stream pratinjau untuk menghindari stream ganda.

  </Accordion>

  <Accordion title="Riwayat, konteks, dan perilaku thread">
    Konteks riwayat guild:

    - `channels.discord.historyLimit` default `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Kontrol riwayat DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Perilaku thread:

    - Thread Discord dirutekan sebagai sesi channel dan mewarisi config channel induk kecuali dioverride.
    - `channels.discord.thread.inheritParent` (default `false`) membuat auto-thread baru ikut disemai dari transkrip induk. Override per akun berada di bawah `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaksi alat pesan dapat meresolusikan target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` dipertahankan selama fallback aktivasi tahap balasan.

    Topik channel disuntikkan sebagai konteks **tidak tepercaya**. Allowlists mengendalikan siapa yang dapat memicu agen, bukan batas penyuntingan konteks tambahan penuh.

  </Accordion>

  <Accordion title="Sesi terikat thread untuk subagen">
    Discord dapat mengikat thread ke target sesi sehingga pesan lanjutan di thread tersebut tetap dirutekan ke sesi yang sama (termasuk sesi subagen).

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
    - `channels.discord.threadBindings.*` mengoverride perilaku Discord.
    - `spawnSubagentSessions` harus true untuk membuat/mengikat thread secara otomatis bagi `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` harus true untuk membuat/mengikat thread secara otomatis bagi ACP (`/acp spawn ... --thread ...` atau `sessions_spawn({ runtime: "acp", thread: true })`).
    - Jika binding thread dinonaktifkan untuk suatu akun, `/focus` dan operasi binding thread terkait tidak tersedia.

    Lihat [Sub-agents](/id/tools/subagents), [ACP Agents](/id/tools/acp-agents), dan [Configuration Reference](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Binding channel ACP persisten">
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

    - `/acp spawn codex --bind here` mengikat channel atau thread saat ini langsung di tempat dan menjaga pesan berikutnya tetap pada sesi ACP yang sama. Pesan thread mewarisi binding channel induk.
    - Di channel atau thread yang terikat, `/new` dan `/reset` mereset sesi ACP yang sama langsung di tempat. Binding thread sementara dapat mengoverride resolusi target saat aktif.
    - `spawnAcpSessions` hanya diperlukan ketika OpenClaw perlu membuat/mengikat child thread melalui `--thread auto|here`.

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
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada maka "👀")

    Catatan:

    - Discord menerima emoji unicode atau nama emoji kustom.
    - Gunakan `""` untuk menonaktifkan reaksi bagi suatu channel atau akun.

  </Accordion>

  <Accordion title="Penulisan config">
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

  <Accordion title="Proxy Gateway">
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

  <Accordion title="Dukungan PluralKit">
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
    - jika lookup gagal, pesan yang diproksikan diperlakukan sebagai pesan bot dan dibuang kecuali `allowBots=true`

  </Accordion>

  <Accordion title="Konfigurasi presence">
    Pembaruan presence diterapkan ketika Anda menyetel field status atau aktivitas, atau ketika Anda mengaktifkan auto presence.

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

    Contoh aktivitas (custom status adalah jenis aktivitas default):

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

  <Accordion title="Persetujuan di Discord">
    Discord mendukung penanganan persetujuan berbasis tombol di DM dan secara opsional dapat memposting prompt persetujuan di channel asal.

    Jalur config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; fallback ke `commands.ownerAllowFrom` jika memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord mengaktifkan persetujuan exec native secara otomatis ketika `enabled` tidak disetel atau `"auto"` dan setidaknya satu approver dapat diresolusikan, baik dari `execApprovals.approvers` maupun dari `commands.ownerAllowFrom`. Discord tidak menyimpulkan approver exec dari `allowFrom` channel, `dm.allowFrom` legacy, atau `defaultTo` direct-message. Setel `enabled: false` untuk menonaktifkan Discord sebagai klien persetujuan native secara eksplisit.

    Ketika `target` adalah `channel` atau `both`, prompt persetujuan terlihat di channel. Hanya approver yang teresolusikan yang dapat menggunakan tombol; pengguna lain menerima penolakan ephemeral. Prompt persetujuan menyertakan teks perintah, jadi aktifkan pengiriman channel hanya di channel tepercaya. Jika ID channel tidak dapat diturunkan dari kunci sesi, OpenClaw fallback ke pengiriman DM.

    Discord juga merender tombol persetujuan bersama yang digunakan oleh channel chat lain. Adapter Discord native terutama menambahkan perutean DM approver dan fanout channel.
    Ketika tombol tersebut ada, tombol itu menjadi UX persetujuan utama; OpenClaw
    seharusnya hanya menyertakan perintah `/approve` manual ketika hasil alat mengatakan
    persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.

    Auth Gateway dan resolusi persetujuan mengikuti kontrak klien Gateway bersama (`plugin:` ID diresolusikan melalui `plugin.approval.resolve`; ID lain melalui `exec.approval.resolve`). Persetujuan kedaluwarsa setelah 30 menit secara default.

    Lihat [Exec approvals](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Alat dan gerbang tindakan

Tindakan pesan Discord mencakup perpesanan, admin channel, moderasi, presence, dan tindakan metadata.

Contoh inti:

- perpesanan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- presence: `setPresence`

Tindakan `event-create` menerima parameter `image` opsional (URL atau jalur file lokal) untuk menyetel gambar sampul event terjadwal.

Gerbang tindakan berada di bawah `channels.discord.actions.*`.

Perilaku gerbang default:

| Action group                                                                                                                                                             | Default  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## UI komponen v2

OpenClaw menggunakan komponen Discord v2 untuk persetujuan exec dan penanda lintas konteks. Tindakan pesan Discord juga dapat menerima `components` untuk UI kustom (lanjutan; memerlukan pembuatan payload komponen melalui alat discord), sementara `embeds` legacy tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` menyetel warna aksen yang digunakan oleh container komponen Discord (hex).
- Setel per akun dengan `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` diabaikan ketika komponen v2 ada.

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

## Voice

Discord memiliki dua permukaan voice yang berbeda: **voice channel** realtime (percakapan berkelanjutan) dan **lampiran voice message** (format pratinjau waveform). Gateway mendukung keduanya.

### Voice channels

Persyaratan:

- Aktifkan perintah native (`commands.native` atau `channels.discord.commands.native`).
- Konfigurasikan `channels.discord.voice`.
- Bot memerlukan izin Connect + Speak di voice channel target.

Gunakan `/vc join|leave|status` untuk mengontrol sesi. Perintah ini menggunakan agen default akun dan mengikuti aturan allowlist serta kebijakan grup yang sama seperti perintah Discord lainnya.

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

- `voice.tts` mengoverride `messages.tts` hanya untuk pemutaran voice.
- Giliran transkrip voice menurunkan status owner dari `allowFrom` Discord (atau `dm.allowFrom`); pembicara non-owner tidak dapat mengakses alat khusus owner (misalnya `gateway` dan `cron`).
- Voice diaktifkan secara default; setel `channels.discord.voice.enabled=false` untuk menonaktifkannya.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi join `@discordjs/voice`.
- Default `@discordjs/voice` adalah `daveEncryption=true` dan `decryptionFailureTolerance=24` jika tidak disetel.
- OpenClaw juga memantau kegagalan dekripsi penerimaan dan melakukan pemulihan otomatis dengan keluar/bergabung ulang ke voice channel setelah kegagalan berulang dalam jangka waktu singkat.
- Jika log penerimaan berulang kali menunjukkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, ini mungkin adalah bug receive upstream `@discordjs/voice` yang dilacak di [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Voice messages

Voice message Discord menampilkan pratinjau waveform dan memerlukan audio OGG/Opus. OpenClaw membuat waveform secara otomatis, tetapi memerlukan `ffmpeg` dan `ffprobe` pada host gateway untuk memeriksa dan mengonversi.

- Berikan **jalur file lokal** (URL ditolak).
- Hilangkan konten teks (Discord menolak teks + voice message dalam payload yang sama).
- Format audio apa pun diterima; OpenClaw mengonversi ke OGG/Opus bila diperlukan.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Menggunakan intents yang tidak diizinkan atau bot tidak melihat pesan guild">

    - aktifkan Message Content Intent
    - aktifkan Server Members Intent ketika Anda bergantung pada resolusi user/member
    - mulai ulang gateway setelah mengubah intents

  </Accordion>

  <Accordion title="Pesan guild terblokir secara tidak terduga">

    - verifikasi `groupPolicy`
    - verifikasi allowlist guild di bawah `channels.discord.guilds`
    - jika peta `channels` guild ada, hanya channel yang tercantum yang diizinkan
    - verifikasi perilaku `requireMention` dan pola mention

    Pemeriksaan yang berguna:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false tetapi masih terblokir">
    Penyebab umum:

    - `groupPolicy="allowlist"` tanpa allowlist guild/channel yang cocok
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

    Knob timeout run worker:

    - akun tunggal: `channels.discord.inboundWorker.runTimeoutMs`
    - multi-akun: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - default: `1800000` (30 menit); setel `0` untuk menonaktifkan

    Baseline yang disarankan:

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
    hanya jika Anda menginginkan katup pengaman terpisah untuk giliran agen yang masuk antrean.

  </Accordion>

  <Accordion title="Ketidakcocokan audit izin">
    Pemeriksaan izin `channels status --probe` hanya berfungsi untuk ID channel numerik.

    Jika Anda menggunakan kunci slug, pencocokan runtime masih dapat berfungsi, tetapi probe tidak dapat memverifikasi izin secara penuh.

  </Accordion>

  <Accordion title="Masalah DM dan pairing">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - menunggu persetujuan pairing dalam mode `pairing`

  </Accordion>

  <Accordion title="Loop bot ke bot">
    Secara default, pesan yang dibuat bot diabaikan.

    Jika Anda menyetel `channels.discord.allowBots=true`, gunakan aturan mention dan allowlist yang ketat untuk menghindari perilaku loop.
    Pilih `channels.discord.allowBots="mentions"` agar hanya menerima pesan bot yang me-mention bot.

  </Accordion>

  <Accordion title="Voice STT terputus dengan DecryptionFailed(...)">

    - pastikan OpenClaw tetap terbaru (`openclaw update`) agar logika pemulihan receive voice Discord tersedia
    - konfirmasi `channels.discord.voice.daveEncryption=true` (default)
    - mulai dari `channels.discord.voice.decryptionFailureTolerance=24` (default upstream) dan sesuaikan hanya jika diperlukan
    - pantau log untuk:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jika kegagalan berlanjut setelah join ulang otomatis, kumpulkan log dan bandingkan dengan [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

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
- media/retry: `mediaMaxMb` (membatasi unggahan Discord keluar, default `100MB`), `retry`
- tindakan: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- fitur: `threadBindings`, `bindings[]` tingkat atas (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Keamanan dan operasional

- Perlakukan token bot sebagai secret (`DISCORD_BOT_TOKEN` lebih disarankan di environment yang diawasi).
- Berikan izin Discord seminimal mungkin.
- Jika deploy/status perintah sudah usang, mulai ulang gateway lalu periksa kembali dengan `openclaw channels status --probe`.

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Discord ke Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/id/channels/groups">
    Perilaku chat grup dan allowlist.
  </Card>
  <Card title="Channel routing" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Security" icon="shield" href="/id/gateway/security">
    Model ancaman dan hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan guild dan channel ke agen.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native.
  </Card>
</CardGroup>
