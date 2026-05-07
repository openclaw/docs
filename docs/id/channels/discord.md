---
read_when:
    - Mengerjakan fitur kanal Discord
summary: Status dukungan, kapabilitas, dan konfigurasi bot Discord
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

Siap untuk DM dan kanal guild melalui Gateway resmi Discord.

<CardGroup cols={3}>
  <Card title="Penyandingan" icon="link" href="/id/channels/pairing">
    DM Discord secara default menggunakan mode penyandingan.
  </Card>
  <Card title="Perintah garis miring" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah kanal" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas kanal dan alur perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

Anda perlu membuat aplikasi baru dengan bot, menambahkan bot ke server Anda, dan menyandingkannya ke OpenClaw. Kami menyarankan untuk menambahkan bot Anda ke server pribadi Anda sendiri. Jika belum memilikinya, [buat terlebih dahulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (pilih **Create My Own > For me and my friends**).

<Steps>
  <Step title="Buat aplikasi dan bot Discord">
    Buka [Discord Developer Portal](https://discord.com/developers/applications) dan klik **New Application**. Beri nama seperti "OpenClaw".

    Klik **Bot** di bilah samping. Atur **Username** ke nama apa pun yang Anda gunakan untuk agen OpenClaw Anda.

  </Step>

  <Step title="Aktifkan intent istimewa">
    Masih di halaman **Bot**, gulir ke bawah ke **Privileged Gateway Intents** dan aktifkan:

    - **Message Content Intent** (wajib)
    - **Server Members Intent** (disarankan; wajib untuk allowlist peran dan pencocokan nama-ke-ID)
    - **Presence Intent** (opsional; hanya diperlukan untuk pembaruan presence)

  </Step>

  <Step title="Salin token bot Anda">
    Gulir kembali ke atas pada halaman **Bot** dan klik **Reset Token**.

    <Note>
    Terlepas dari namanya, ini menghasilkan token pertama Anda — tidak ada apa pun yang benar-benar "direset."
    </Note>

    Salin token dan simpan di suatu tempat. Ini adalah **Bot Token** Anda dan Anda akan membutuhkannya sebentar lagi.

  </Step>

  <Step title="Buat URL undangan dan tambahkan bot ke server Anda">
    Klik **OAuth2** di bilah samping. Anda akan membuat URL undangan dengan izin yang tepat untuk menambahkan bot ke server Anda.

    Gulir ke bawah ke **OAuth2 URL Generator** dan aktifkan:

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

    Ini adalah set dasar untuk kanal teks normal. Jika Anda berencana memposting di thread Discord, termasuk alur kerja kanal forum atau media yang membuat atau melanjutkan thread, aktifkan juga **Send Messages in Threads**.
    Salin URL yang dihasilkan di bagian bawah, tempelkan ke browser Anda, pilih server Anda, lalu klik **Continue** untuk menghubungkan. Sekarang Anda seharusnya melihat bot Anda di server Discord.

  </Step>

  <Step title="Aktifkan Mode Pengembang dan kumpulkan ID Anda">
    Kembali di aplikasi Discord, Anda perlu mengaktifkan Mode Pengembang agar dapat menyalin ID internal.

    1. Klik **User Settings** (ikon roda gigi di sebelah avatar Anda) → **Advanced** → aktifkan **Developer Mode**
    2. Klik kanan **ikon server** Anda di bilah samping → **Copy Server ID**
    3. Klik kanan **avatar Anda sendiri** → **Copy User ID**

    Simpan **Server ID** dan **User ID** Anda bersama Bot Token Anda — Anda akan mengirim ketiganya ke OpenClaw pada langkah berikutnya.

  </Step>

  <Step title="Izinkan DM dari anggota server">
    Agar penyandingan berfungsi, Discord perlu mengizinkan bot Anda mengirim DM kepada Anda. Klik kanan **ikon server** Anda → **Privacy Settings** → aktifkan **Direct Messages**.

    Ini memungkinkan anggota server (termasuk bot) mengirim DM kepada Anda. Biarkan ini aktif jika Anda ingin menggunakan DM Discord dengan OpenClaw. Jika Anda hanya berencana menggunakan kanal guild, Anda dapat menonaktifkan DM setelah penyandingan.

  </Step>

  <Step title="Atur token bot Anda dengan aman (jangan kirim di chat)">
    Token bot Discord Anda adalah rahasia (seperti kata sandi). Atur token tersebut di mesin yang menjalankan OpenClaw sebelum mengirim pesan ke agen Anda.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    Jika OpenClaw sudah berjalan sebagai layanan latar belakang, mulai ulang melalui aplikasi OpenClaw Mac atau dengan menghentikan dan memulai ulang proses `openclaw gateway run`.
    Untuk instalasi layanan terkelola, jalankan `openclaw gateway install` dari shell tempat `DISCORD_BOT_TOKEN` tersedia, atau simpan variabel di `~/.openclaw/.env`, agar layanan dapat menyelesaikan SecretRef env setelah dimulai ulang.
    Jika host Anda diblokir atau dibatasi lajunya oleh pencarian aplikasi startup Discord, atur ID aplikasi/klien Discord dari Developer Portal agar startup dapat melewati panggilan REST tersebut. Gunakan `channels.discord.applicationId` untuk akun default, atau `channels.discord.accounts.<accountId>.applicationId` saat Anda menjalankan beberapa bot Discord.

  </Step>

  <Step title="Konfigurasikan OpenClaw dan sandangkan">

    <Tabs>
      <Tab title="Minta agen Anda">
        Chat dengan agen OpenClaw Anda di kanal yang sudah ada (misalnya Telegram) dan beri tahu agen tersebut. Jika Discord adalah kanal pertama Anda, gunakan tab CLI / config sebagai gantinya.

        > "Saya sudah mengatur token bot Discord saya di config. Harap selesaikan penyiapan Discord dengan User ID `<user_id>` dan Server ID `<server_id>`."
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

        Untuk penyiapan berskrip atau jarak jauh, tulis blok JSON5 yang sama dengan `openclaw config patch --file ./discord.patch.json5 --dry-run` lalu jalankan ulang tanpa `--dry-run`. Nilai `token` plaintext didukung. Nilai SecretRef juga didukung untuk `channels.discord.token` di seluruh provider env/file/exec. Lihat [Manajemen Rahasia](/id/gateway/secrets).

        Untuk beberapa bot Discord, simpan setiap token bot dan ID aplikasi di bawah akunnya. `channels.discord.applicationId` tingkat atas diwariskan oleh akun, jadi hanya atur di sana ketika setiap akun harus menggunakan ID aplikasi yang sama.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Setujui penyandingan DM pertama">
    Tunggu hingga Gateway berjalan, lalu kirim DM ke bot Anda di Discord. Bot akan merespons dengan kode penyandingan.

    <Tabs>
      <Tab title="Minta agen Anda">
        Kirim kode penyandingan ke agen Anda di kanal yang sudah ada:

        > "Setujui kode penyandingan Discord ini: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kode penyandingan kedaluwarsa setelah 1 jam.

    Sekarang Anda seharusnya dapat chat dengan agen Anda di Discord melalui DM.

  </Step>
</Steps>

<Note>
Resolusi token peka akun. Nilai token config mengalahkan fallback env. `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Jika dua akun Discord aktif menyelesaikan ke token bot yang sama, OpenClaw hanya memulai satu monitor Gateway untuk token tersebut. Token yang berasal dari config mengalahkan fallback env default; jika tidak, akun aktif pertama menang dan akun duplikat dilaporkan dinonaktifkan.
Untuk panggilan outbound lanjutan (alat pesan/tindakan kanal), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk tindakan kirim dan baca/probe-style (misalnya read/search/fetch/thread/pins/permissions). Pengaturan kebijakan akun/coba ulang tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Disarankan: Siapkan ruang kerja guild

Setelah DM berfungsi, Anda dapat menyiapkan server Discord Anda sebagai ruang kerja penuh tempat setiap kanal mendapatkan sesi agennya sendiri dengan konteksnya sendiri. Ini disarankan untuk server pribadi yang hanya berisi Anda dan bot Anda.

<Steps>
  <Step title="Tambahkan server Anda ke allowlist guild">
    Ini memungkinkan agen Anda merespons di kanal apa pun di server Anda, bukan hanya DM.

    <Tabs>
      <Tab title="Minta agen Anda">
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
    Secara default, agen Anda hanya merespons di kanal guild saat di-@mention. Untuk server pribadi, Anda mungkin ingin agen merespons setiap pesan.

    Di kanal guild, balasan final asisten normal tetap privat secara default. Output Discord yang terlihat harus dikirim secara eksplisit dengan alat `message`, sehingga agen dapat mengamati secara default dan hanya memposting ketika memutuskan balasan kanal berguna.

    Ini berarti model yang dipilih harus andal memanggil alat. Jika Discord menampilkan pengetikan dan log menunjukkan penggunaan token tetapi tidak ada pesan yang diposting, periksa log sesi untuk teks asisten dengan `didSendViaMessagingTool: false`. Itu berarti model menghasilkan jawaban final privat alih-alih memanggil `message(action=send)`. Beralihlah ke model pemanggil alat yang lebih kuat, atau gunakan config di bawah untuk memulihkan balasan final otomatis legacy.

    <Tabs>
      <Tab title="Minta agen Anda">
        > "Izinkan agen saya merespons di server ini tanpa harus di-@mention"
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

        Untuk memulihkan balasan final otomatis legacy untuk ruang grup/kanal, atur `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Rencanakan memori di kanal guild">
    Secara default, memori jangka panjang (MEMORY.md) hanya dimuat di sesi DM. Kanal guild tidak memuat MEMORY.md secara otomatis.

    <Tabs>
      <Tab title="Minta agen Anda">
        > "Saat saya mengajukan pertanyaan di kanal Discord, gunakan memory_search atau memory_get jika Anda memerlukan konteks jangka panjang dari MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Jika Anda memerlukan konteks bersama di setiap kanal, letakkan instruksi stabil di `AGENTS.md` atau `USER.md` (keduanya disuntikkan untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan dengan alat memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat beberapa kanal di server Discord Anda dan mulai chat. Agen Anda dapat melihat nama kanal, dan setiap kanal mendapatkan sesinya sendiri yang terisolasi — jadi Anda dapat menyiapkan `#coding`, `#home`, `#research`, atau apa pun yang sesuai dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan masuk Discord kembali ke Discord.
- Metadata guild/channel Discord ditambahkan ke prompt model sebagai konteks yang tidak tepercaya, bukan sebagai prefiks balasan yang terlihat pengguna. Jika model menyalin amplop itu kembali, OpenClaw menghapus metadata yang disalin dari balasan keluar dan dari konteks pemutaran ulang berikutnya.
- Secara default (`session.dmScope=main`), chat langsung berbagi sesi utama agen (`agent:main:main`).
- Channel guild adalah kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- DM grup diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Perintah slash native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.
- Pengiriman pengumuman cron/heartbeat khusus teks ke Discord menggunakan jawaban akhir yang terlihat asisten satu kali. Payload media dan komponen terstruktur tetap berupa beberapa pesan saat agen mengeluarkan beberapa payload yang dapat dikirim.

## Channel forum

Channel forum dan media Discord hanya menerima postingan thread. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke induk forum (`channel:<forumId>`) untuk membuat thread secara otomatis. Judul thread menggunakan baris pertama yang tidak kosong dari pesan Anda.
- Gunakan `openclaw message thread create` untuk membuat thread secara langsung. Jangan teruskan `--message-id` untuk channel forum.

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

Induk forum tidak menerima komponen Discord. Jika Anda membutuhkan komponen, kirim ke thread itu sendiri (`channel:<threadId>`).

## Komponen interaktif

OpenClaw mendukung kontainer komponen Discord v2 untuk pesan agen. Gunakan alat pesan dengan payload `components`. Hasil interaksi dirutekan kembali ke agen sebagai pesan masuk normal dan mengikuti pengaturan Discord `replyToMode` yang ada.

Blok yang didukung:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Baris aksi mengizinkan hingga 5 tombol atau satu menu pilih
- Jenis pilihan: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya dapat digunakan satu kali. Atur `components.reusable=true` agar tombol, pilihan, dan formulir dapat digunakan beberapa kali hingga kedaluwarsa.

Untuk membatasi siapa yang dapat mengeklik tombol, atur `allowedUsers` pada tombol tersebut (ID pengguna Discord, tag, atau `*`). Saat dikonfigurasi, pengguna yang tidak cocok menerima penolakan ephemeral.

Perintah slash `/model` dan `/models` membuka pemilih model interaktif dengan dropdown penyedia, model, dan runtime yang kompatibel, plus langkah Kirim. `/models add` sudah tidak digunakan lagi dan kini mengembalikan pesan penghentian dukungan alih-alih mendaftarkan model dari chat. Balasan pemilih bersifat ephemeral dan hanya pengguna yang memanggilnya yang dapat menggunakannya.

Lampiran file:

- Blok `file` harus menunjuk ke referensi lampiran (`attachment://<filename>`)
- Sediakan lampiran melalui `media`/`path`/`filePath` (satu file); gunakan `media-gallery` untuk beberapa file
- Gunakan `filename` untuk menimpa nama unggahan saat nama tersebut harus cocok dengan referensi lampiran

Formulir modal:

- Tambahkan `components.modal` dengan hingga 5 bidang
- Jenis bidang: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` mengontrol akses DM. `channels.discord.allowFrom` adalah allowlist DM kanonis.

    - `pairing` (default)
    - `allowlist`
    - `open` (mengharuskan `channels.discord.allowFrom` menyertakan `"*"`)
    - `disabled`

    Jika kebijakan DM tidak terbuka, pengguna yang tidak dikenal diblokir (atau diminta melakukan pemasangan dalam mode `pairing`).

    Prioritas multi-akun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Untuk satu akun, `allowFrom` memiliki prioritas atas `dm.allowFrom` lama.
    - Akun bernama mewarisi `channels.discord.allowFrom` saat `allowFrom` miliknya sendiri dan `dm.allowFrom` lama tidak diatur.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` dan `channels.discord.dm.allowFrom` lama masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` saat dapat melakukannya tanpa mengubah akses.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - sebutan `<@id>`

    ID numerik polos biasanya diselesaikan sebagai ID channel saat default channel aktif, tetapi ID yang tercantum dalam `allowFrom` DM efektif akun diperlakukan sebagai target DM pengguna untuk kompatibilitas.

  </Tab>

  <Tab title="DM access groups">
    DM Discord dapat menggunakan entri dinamis `accessGroup:<name>` di `channels.discord.allowFrom`.

    Nama grup akses dibagikan di seluruh channel pesan. Gunakan `type: "message.senders"` untuk grup statis yang anggotanya dinyatakan dalam sintaks `allowFrom` normal masing-masing channel, atau `type: "discord.channelAudience"` saat audiens `ViewChannel` saat ini dari channel Discord harus menentukan keanggotaan secara dinamis. Perilaku grup akses bersama didokumentasikan di sini: [Grup akses](/id/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Channel teks Discord tidak memiliki daftar anggota terpisah. `type: "discord.channelAudience"` memodelkan keanggotaan sebagai: pengirim DM adalah anggota guild yang dikonfigurasi dan saat ini memiliki izin `ViewChannel` efektif pada channel yang dikonfigurasi setelah peran dan penimpaan channel diterapkan.

    Contoh: izinkan siapa pun yang dapat melihat `#maintainers` untuk mengirim DM ke bot, sambil tetap menutup DM untuk orang lain.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    Anda dapat mencampur entri dinamis dan statis:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    Pencarian gagal secara tertutup. Jika Discord mengembalikan `Missing Access`, pencarian anggota gagal, atau channel milik guild yang berbeda, pengirim DM dianggap tidak berwenang.

    Aktifkan **Server Members Intent** di Discord Developer Portal untuk bot saat menggunakan grup akses audiens channel. DM tidak menyertakan status anggota guild, sehingga OpenClaw menyelesaikan anggota melalui Discord REST pada waktu otorisasi.

  </Tab>

  <Tab title="Guild policy">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman saat `channels.discord` ada adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` disarankan, slug diterima)
    - allowlist pengirim opsional: `users` (ID stabil disarankan) dan `roles` (hanya ID peran); jika salah satunya dikonfigurasi, pengirim diizinkan saat cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag langsung dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memperingatkan saat entri nama/tag digunakan
    - jika guild memiliki `channels` yang dikonfigurasi, channel yang tidak tercantum ditolak
    - jika guild tidak memiliki blok `channels`, semua channel dalam guild yang di-allowlist tersebut diizinkan

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

    Jika Anda hanya mengatur `DISCORD_BOT_TOKEN` dan tidak membuat blok `channels.discord`, fallback runtime adalah `groupPolicy="allowlist"` (dengan peringatan di log), meskipun `channels.defaults.groupPolicy` adalah `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Pesan guild secara default digerbangi oleh mention.

    Deteksi mention mencakup:

    - mention bot eksplisit
    - pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku balasan-ke-bot implisit dalam kasus yang didukung

    Saat menulis pesan Discord keluar, gunakan sintaks mention kanonis: `<@USER_ID>` untuk pengguna, `<#CHANNEL_ID>` untuk channel, dan `<@&ROLE_ID>` untuk peran. Jangan gunakan bentuk mention nama panggilan lama `<@!USER_ID>`.

    `requireMention` dikonfigurasi per guild/channel (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional membuang pesan yang menyebut pengguna/peran lain tetapi bukan bot (tidak termasuk @everyone/@here).

    DM grup:

    - default: diabaikan (`dm.groupEnabled=false`)
    - allowlist opsional melalui `dm.groupChannels` (ID channel atau slug)

  </Tab>
</Tabs>

### Perutean agen berbasis peran

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agen berbeda berdasarkan ID peran. Binding berbasis peran hanya menerima ID peran dan dievaluasi setelah binding peer atau parent-peer dan sebelum binding khusus guild. Jika binding juga mengatur bidang pencocokan lain (misalnya `peer` + `guildId` + `roles`), semua bidang yang dikonfigurasi harus cocok.

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

- `commands.native` secara default bernilai `"auto"` dan diaktifkan untuk Discord.
- Penimpaan per kanal: `channels.discord.commands.native`.
- `commands.native=false` melewati pendaftaran dan pembersihan perintah slash Discord selama startup. Perintah yang sebelumnya terdaftar mungkin tetap terlihat di Discord hingga Anda menghapusnya dari aplikasi Discord.
- Autentikasi perintah bawaan menggunakan daftar izin/kebijakan Discord yang sama seperti penanganan pesan normal.
- Perintah mungkin tetap terlihat di UI Discord bagi pengguna yang tidak diotorisasi; eksekusi tetap memberlakukan autentikasi OpenClaw dan mengembalikan "tidak diotorisasi".

Lihat [Perintah slash](/id/tools/slash-commands) untuk katalog dan perilaku perintah.

Pengaturan perintah slash bawaan:

- `ephemeral: true`

## Detail fitur

<AccordionGroup>
  <Accordion title="Tag balasan dan balasan bawaan">
    Discord mendukung tag balasan dalam output agen:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Dikendalikan oleh `channels.discord.replyToMode`:

    - `off` (bawaan)
    - `first`
    - `all`
    - `batched`

    Catatan: `off` menonaktifkan utas balasan implisit. Tag eksplisit `[[reply_to_*]]` tetap dipatuhi.
    `first` selalu melampirkan referensi balasan bawaan implisit ke pesan Discord keluar pertama untuk giliran tersebut.
    `batched` hanya melampirkan referensi balasan bawaan implisit Discord ketika
    giliran masuk merupakan batch beberapa pesan yang digabung setelah jeda singkat. Ini berguna
    ketika Anda menginginkan balasan bawaan terutama untuk percakapan beruntun yang ambigu, bukan setiap
    giliran satu pesan.

    ID pesan ditampilkan dalam konteks/riwayat sehingga agen dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Pratinjau streaming langsung">
    OpenClaw dapat melakukan streaming draf balasan dengan mengirim pesan sementara dan mengeditnya saat teks masuk. `channels.discord.streaming` menerima `off` | `partial` | `block` | `progress` (bawaan). `progress` mempertahankan satu draf status yang dapat diedit dan memperbaruinya dengan progres alat hingga pengiriman final; `streamMode` adalah alias runtime lama. Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi tersimpan ke kunci kanonis.

    Atur `channels.discord.streaming.mode` ke `off` untuk menonaktifkan edit pratinjau Discord. Jika streaming blok Discord diaktifkan secara eksplisit, OpenClaw melewati aliran pratinjau untuk menghindari streaming ganda.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` mengedit satu pesan pratinjau saat token tiba.
    - `block` memancarkan potongan sebesar draf (gunakan `draftChunk` untuk menyesuaikan ukuran dan titik jeda, dibatasi ke `textChunkLimit`).
    - Final berupa media, kesalahan, dan balasan eksplisit membatalkan edit pratinjau yang tertunda.
    - `streaming.preview.toolProgress` (bawaan `true`) mengontrol apakah pembaruan alat/progres menggunakan kembali pesan pratinjau.
    - `streaming.preview.commandText` / `streaming.progress.commandText` mengontrol detail perintah/eksekusi dalam baris progres ringkas: `raw` (bawaan) atau `status` (hanya label alat).

    Sembunyikan teks perintah/eksekusi mentah sambil mempertahankan baris progres ringkas:

    ```json
    {
      "channels": {
        "discord": {
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

    Streaming pratinjau hanya teks; balasan media beralih kembali ke pengiriman normal. Ketika streaming `block` diaktifkan secara eksplisit, OpenClaw melewati aliran pratinjau untuk menghindari streaming ganda.

  </Accordion>

  <Accordion title="Riwayat, konteks, dan perilaku utas">
    Konteks riwayat server:

    - `channels.discord.historyLimit` bernilai bawaan `20`
    - cadangan: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Kontrol riwayat DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Perilaku utas:

    - Utas Discord dirutekan sebagai sesi kanal dan mewarisi konfigurasi kanal induk kecuali ditimpa.
    - Sesi utas mewarisi pilihan `/model` tingkat sesi kanal induk sebagai cadangan khusus model; pilihan `/model` lokal utas tetap didahulukan dan riwayat transkrip induk tidak disalin kecuali pewarisan transkrip diaktifkan.
    - `channels.discord.thread.inheritParent` (bawaan `false`) mengikutsertakan utas otomatis baru untuk diinisialisasi dari transkrip induk. Penimpaan per akun berada di bawah `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaksi alat pesan dapat menyelesaikan target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` dipertahankan selama jalur cadangan aktivasi tahap balasan.

    Topik kanal diinjeksi sebagai konteks **tidak tepercaya**. Daftar izin membatasi siapa yang dapat memicu agen, bukan menjadi batas redaksi konteks tambahan penuh.

  </Accordion>

  <Accordion title="Sesi terikat utas untuk subagen">
    Discord dapat mengikat utas ke target sesi sehingga pesan tindak lanjut di utas tersebut tetap dirutekan ke sesi yang sama (termasuk sesi subagen).

    Perintah:

    - `/focus <target>` ikat utas saat ini/baru ke target subagen/sesi
    - `/unfocus` hapus pengikatan utas saat ini
    - `/agents` tampilkan eksekusi aktif dan status pengikatan
    - `/session idle <duration|off>` periksa/perbarui lepas fokus otomatis karena ketidakaktifan untuk pengikatan yang difokuskan
    - `/session max-age <duration|off>` periksa/perbarui usia maksimum mutlak untuk pengikatan yang difokuskan

    Konfigurasi:

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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Catatan:

    - `session.threadBindings.*` mengatur bawaan global.
    - `channels.discord.threadBindings.*` menimpa perilaku Discord.
    - `spawnSessions` mengontrol pembuatan/pengikatan utas otomatis untuk `sessions_spawn({ thread: true })` dan pembuatan utas ACP. Bawaan: `true`.
    - `defaultSpawnContext` mengontrol konteks subagen bawaan untuk pembuatan terikat utas. Bawaan: `"fork"`.
    - Kunci `spawnSubagentSessions`/`spawnAcpSessions` yang sudah tidak digunakan dimigrasikan oleh `openclaw doctor --fix`.
    - Jika pengikatan utas dinonaktifkan untuk suatu akun, `/focus` dan operasi pengikatan utas terkait tidak tersedia.

    Lihat [Subagen](/id/tools/subagents), [Agen ACP](/id/tools/acp-agents), dan [Referensi Konfigurasi](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Pengikatan kanal ACP persisten">
    Untuk ruang kerja ACP "selalu aktif" yang stabil, konfigurasikan pengikatan ACP bertipe tingkat atas yang menargetkan percakapan Discord.

    Jalur konfigurasi:

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

    - `/acp spawn codex --bind here` mengikat kanal atau utas saat ini di tempat dan mempertahankan pesan mendatang pada sesi ACP yang sama. Pesan utas mewarisi pengikatan kanal induk.
    - Dalam kanal atau utas terikat, `/new` dan `/reset` mengatur ulang sesi ACP yang sama di tempat. Pengikatan utas sementara dapat menimpa resolusi target saat aktif.
    - `spawnSessions` mengontrol pembuatan/pengikatan utas turunan melalui `--thread auto|here`.

    Lihat [Agen ACP](/id/tools/acp-agents) untuk detail perilaku pengikatan.

  </Accordion>

  <Accordion title="Notifikasi reaksi">
    Mode notifikasi reaksi per server:

    - `off`
    - `own` (bawaan)
    - `all`
    - `allowlist` (menggunakan `guilds.<id>.users`)

    Peristiwa reaksi diubah menjadi peristiwa sistem dan dilampirkan ke sesi Discord yang dirutekan.

  </Accordion>

  <Accordion title="Reaksi pengakuan">
    `ackReaction` mengirim emoji tanda diterima saat OpenClaw memproses pesan masuk.

    Urutan resolusi:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - cadangan emoji identitas agen (`agents.list[].identity.emoji`, jika tidak "👀")

    Catatan:

    - Discord menerima emoji Unicode atau nama emoji kustom.
    - Gunakan `""` untuk menonaktifkan reaksi bagi kanal atau akun.

  </Accordion>

  <Accordion title="Penulisan konfigurasi">
    Penulisan konfigurasi yang dimulai kanal diaktifkan secara bawaan.

    Ini memengaruhi alur `/config set|unset` (ketika fitur perintah diaktifkan).

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
    Rutekan lalu lintas WebSocket Gateway Discord dan pencarian REST saat mulai berjalan (ID aplikasi + resolusi daftar izin) melalui proxy HTTP(S) dengan `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Penimpaan per akun:

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

    - daftar izin dapat menggunakan `pk:<memberId>`
    - nama tampilan anggota dicocokkan berdasarkan nama/slug hanya ketika `channels.discord.dangerouslyAllowNameMatching: true`
    - pencarian menggunakan ID pesan asli dan dibatasi jendela waktu
    - jika pencarian gagal, pesan yang diproksikan diperlakukan sebagai pesan bot dan dibuang kecuali `allowBots=true`

  </Accordion>

  <Accordion title="Alias penyebutan keluar">
    Gunakan `mentionAliases` ketika agen memerlukan penyebutan keluar deterministik untuk pengguna Discord yang dikenal. Kunci adalah handle tanpa awalan `@`; nilai adalah ID pengguna Discord. Handle yang tidak dikenal, `@everyone`, `@here`, dan penyebutan di dalam rentang kode Markdown dibiarkan tidak berubah.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Konfigurasi kehadiran">
    Pembaruan kehadiran diterapkan ketika Anda mengatur kolom status atau aktivitas, atau ketika Anda mengaktifkan kehadiran otomatis.

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

    Contoh aktivitas (status kustom adalah jenis aktivitas bawaan):

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

    - 0: Bermain
    - 1: Streaming (memerlukan `activityUrl`)
    - 2: Mendengarkan
    - 3: Menonton
    - 4: Kustom (menggunakan teks aktivitas sebagai keadaan status; emoji bersifat opsional)
    - 5: Berkompetisi

    Contoh kehadiran otomatis (sinyal kesehatan runtime):

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

    Kehadiran otomatis memetakan ketersediaan runtime ke status Discord: sehat => online, terdegradasi atau tidak diketahui => idle, habis atau tidak tersedia => dnd. Penggantian teks opsional:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (mendukung placeholder `{reason}`)

  </Accordion>

  <Accordion title="Persetujuan di Discord">
    Discord mendukung penanganan persetujuan berbasis tombol di DM dan secara opsional dapat memposting prompt persetujuan di channel asal.

    Path konfigurasi:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; kembali ke `commands.ownerAllowFrom` jika memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord otomatis mengaktifkan persetujuan exec native ketika `enabled` tidak diatur atau `"auto"` dan setidaknya satu pemberi persetujuan dapat diselesaikan, baik dari `execApprovals.approvers` maupun dari `commands.ownerAllowFrom`. Discord tidak menyimpulkan pemberi persetujuan exec dari channel `allowFrom`, `dm.allowFrom` lama, atau pesan langsung `defaultTo`. Atur `enabled: false` untuk menonaktifkan Discord sebagai klien persetujuan native secara eksplisit.

    Untuk perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory`, OpenClaw mengirim prompt persetujuan dan hasil akhir secara privat. OpenClaw mencoba DM Discord terlebih dahulu ketika pemilik yang memanggil memiliki rute pemilik Discord; jika itu tidak tersedia, OpenClaw kembali ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, seperti Telegram.

    Ketika `target` adalah `channel` atau `both`, prompt persetujuan terlihat di channel. Hanya pemberi persetujuan yang telah diselesaikan yang dapat menggunakan tombol; pengguna lain menerima penolakan ephemeral. Prompt persetujuan menyertakan teks perintah, jadi aktifkan pengiriman channel hanya di channel tepercaya. Jika ID channel tidak dapat diturunkan dari kunci sesi, OpenClaw kembali ke pengiriman DM.

    Discord juga merender tombol persetujuan bersama yang digunakan oleh channel chat lain. Adapter Discord native terutama menambahkan perutean DM pemberi persetujuan dan fanout channel.
    Ketika tombol tersebut ada, tombol itu menjadi UX persetujuan utama; OpenClaw
    sebaiknya hanya menyertakan perintah manual `/approve` ketika hasil tool mengatakan
    persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    Jika runtime persetujuan native Discord tidak aktif, OpenClaw mempertahankan
    prompt lokal deterministik `/approve <id> <decision>` tetap terlihat. Jika
    runtime aktif tetapi kartu native tidak dapat dikirim ke target mana pun,
    OpenClaw mengirim pemberitahuan fallback di chat yang sama dengan perintah `/approve`
    yang persis dari persetujuan tertunda.

    Autentikasi Gateway dan penyelesaian persetujuan mengikuti kontrak klien Gateway bersama (ID `plugin:` diselesaikan melalui `plugin.approval.resolve`; ID lain melalui `exec.approval.resolve`). Persetujuan kedaluwarsa setelah 30 menit secara default.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tool dan gerbang tindakan

Tindakan pesan Discord mencakup tindakan perpesanan, admin channel, moderasi, kehadiran, dan metadata.

Contoh inti:

- perpesanan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- kehadiran: `setPresence`

Tindakan `event-create` menerima parameter `image` opsional (URL atau path file lokal) untuk mengatur gambar sampul acara terjadwal.

Gerbang tindakan berada di bawah `channels.discord.actions.*`.

Perilaku gerbang default:

| Grup tindakan                                                                                                                                                            | Default     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | diaktifkan  |
| roles                                                                                                                                                                    | dinonaktifkan |
| moderation                                                                                                                                                               | dinonaktifkan |
| presence                                                                                                                                                                 | dinonaktifkan |

## UI Components v2

OpenClaw menggunakan Discord components v2 untuk persetujuan exec dan penanda lintas konteks. Tindakan pesan Discord juga dapat menerima `components` untuk UI kustom (lanjutan; memerlukan penyusunan payload komponen melalui tool discord), sementara `embeds` lama tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` mengatur warna aksen yang digunakan oleh kontainer komponen Discord (hex).
- Atur per akun dengan `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` diabaikan ketika components v2 ada.

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

Discord memiliki dua permukaan suara yang berbeda: **channel suara** realtime (percakapan berkelanjutan) dan **lampiran pesan suara** (format pratinjau waveform). Gateway mendukung keduanya.

### Channel suara

Daftar periksa penyiapan:

1. Aktifkan Message Content Intent di Discord Developer Portal.
2. Aktifkan Server Members Intent ketika allowlist peran/pengguna digunakan.
3. Undang bot dengan scope `bot` dan `applications.commands`.
4. Berikan Connect, Speak, Send Messages, dan Read Message History di channel suara target.
5. Aktifkan perintah native (`commands.native` atau `channels.discord.commands.native`).
6. Konfigurasikan `channels.discord.voice`.

Gunakan `/vc join|leave|status` untuk mengontrol sesi. Perintah menggunakan agen default akun dan mengikuti aturan allowlist serta kebijakan grup yang sama seperti perintah Discord lainnya.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Untuk memeriksa izin efektif bot sebelum bergabung, jalankan:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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

- `voice.tts` menggantikan `messages.tts` hanya untuk pemutaran suara.
- `voice.model` menggantikan LLM yang digunakan hanya untuk respons channel suara Discord. Biarkan tidak diatur untuk mewarisi model agen yang dirutekan.
- STT menggunakan `tools.media.audio`; `voice.model` tidak memengaruhi transkripsi.
- Override `systemPrompt` Discord per channel berlaku untuk giliran transkrip suara bagi channel suara tersebut.
- Giliran transkrip suara menurunkan status pemilik dari Discord `allowFrom` (atau `dm.allowFrom`); pembicara non-pemilik tidak dapat mengakses tool khusus pemilik (misalnya `gateway` dan `cron`).
- Suara Discord bersifat opt-in untuk konfigurasi hanya teks; atur `channels.discord.voice.enabled=true` (atau pertahankan blok `channels.discord.voice` yang sudah ada) untuk mengaktifkan perintah `/vc`, runtime suara, dan intent gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` dapat secara eksplisit menggantikan langganan intent status suara. Biarkan tidak diatur agar intent mengikuti pengaktifan suara efektif.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi join `@discordjs/voice`.
- Default `@discordjs/voice` adalah `daveEncryption=true` dan `decryptionFailureTolerance=24` jika tidak diatur.
- `voice.connectTimeoutMs` mengontrol waktu tunggu Ready awal `@discordjs/voice` untuk `/vc join` dan upaya auto-join. Default: `30000`.
- `voice.reconnectGraceMs` mengontrol berapa lama OpenClaw menunggu sesi suara yang terputus mulai menyambung ulang sebelum menghancurkannya. Default: `15000`.
- Pemutaran suara tidak berhenti hanya karena pengguna lain mulai berbicara. Untuk menghindari loop umpan balik, OpenClaw mengabaikan tangkapan suara baru saat TTS sedang diputar; berbicaralah setelah pemutaran selesai untuk giliran berikutnya.
- `voice.captureSilenceGraceMs` mengontrol berapa lama OpenClaw menunggu setelah Discord melaporkan pembicara berhenti sebelum menyelesaikan segmen audio tersebut untuk STT. Default: `2500`; naikkan ini jika Discord memecah jeda normal menjadi transkrip parsial yang tersendat.
- Ketika ElevenLabs adalah penyedia TTS yang dipilih, pemutaran suara Discord menggunakan TTS streaming dan dimulai dari stream respons penyedia. Penyedia tanpa dukungan streaming kembali ke path file sementara hasil sintesis.
- OpenClaw juga memantau kegagalan dekripsi penerimaan dan pulih otomatis dengan keluar/bergabung ulang ke channel suara setelah kegagalan berulang dalam jendela singkat.
- Jika log penerimaan berulang kali menampilkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` setelah pembaruan, kumpulkan laporan dependensi dan log. Baris `@discordjs/voice` yang dibundel menyertakan perbaikan padding upstream dari PR discord.js #11449, yang menutup issue discord.js #11419.
- Event penerimaan `The operation was aborted` diharapkan ketika OpenClaw menyelesaikan segmen pembicara yang ditangkap; event tersebut adalah diagnostik verbose, bukan peringatan.

Pipeline channel suara:

- Tangkapan PCM Discord dikonversi menjadi file sementara WAV.
- `tools.media.audio` menangani STT, misalnya `openai/gpt-4o-mini-transcribe`.
- Transkrip dikirim melalui ingress dan routing Discord sementara LLM respons berjalan dengan kebijakan output suara yang menyembunyikan tool agen `tts` dan meminta teks yang dikembalikan, karena suara Discord memiliki pemutaran TTS akhir.
- `voice.model`, ketika diatur, hanya menggantikan LLM respons untuk giliran channel suara ini.
- `voice.tts` digabungkan di atas `messages.tts`; penyedia yang mampu streaming memberi makan pemutar secara langsung, jika tidak file audio yang dihasilkan diputar di channel yang telah digabungkan.

Kredensial diselesaikan per komponen: autentikasi rute LLM untuk `voice.model`, autentikasi STT untuk `tools.media.audio`, dan autentikasi TTS untuk `messages.tts`/`voice.tts`.

### Pesan suara

Pesan suara Discord menampilkan pratinjau waveform dan memerlukan audio OGG/Opus. OpenClaw menghasilkan waveform secara otomatis, tetapi memerlukan `ffmpeg` dan `ffprobe` di host gateway untuk memeriksa dan mengonversi.

- Berikan **path file lokal** (URL ditolak).
- Hilangkan konten teks (Discord menolak teks + pesan suara dalam payload yang sama).
- Format audio apa pun diterima; OpenClaw mengonversi ke OGG/Opus sesuai kebutuhan.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Intent yang tidak diizinkan digunakan atau bot tidak melihat pesan guild">

    - aktifkan Message Content Intent
    - aktifkan Server Members Intent ketika Anda bergantung pada penyelesaian pengguna/anggota
    - mulai ulang gateway setelah mengubah intent

  </Accordion>

  <Accordion title="Pesan guild terblokir secara tidak terduga">

    - verifikasi `groupPolicy`
    - verifikasi allowlist guild di bawah `channels.discord.guilds`
    - jika map `channels` guild ada, hanya channel yang tercantum yang diizinkan
    - verifikasi perilaku `requireMention` dan pola mention

    Pemeriksaan berguna:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false tetapi masih diblokir">
    Penyebab umum:

    - `groupPolicy="allowlist"` tanpa allowlist guild/channel yang cocok
    - `requireMention` dikonfigurasi di tempat yang salah (harus berada di bawah `channels.discord.guilds` atau entri channel)
    - pengirim diblokir oleh allowlist `users` guild/channel

  </Accordion>

  <Accordion title="Giliran Discord yang berjalan lama atau balasan duplikat">

    Log umum:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Knob antrean Gateway Discord:

    - akun tunggal: `channels.discord.eventQueue.listenerTimeout`
    - multi-akun: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ini hanya mengontrol pekerjaan listener Gateway Discord, bukan masa hidup giliran agen

    Discord tidak menerapkan timeout milik channel pada giliran agen yang diantrekan. Listener pesan langsung menyerahkan pekerjaan, dan proses Discord yang diantrekan mempertahankan urutan per sesi hingga siklus hidup sesi/tool/runtime selesai atau membatalkan pekerjaan.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Peringatan timeout pencarian metadata Gateway">
    OpenClaw mengambil metadata Discord `/gateway/bot` sebelum terhubung. Kegagalan sementara akan kembali ke URL Gateway default Discord dan dibatasi laju di log.

    Knob timeout metadata:

    - akun tunggal: `channels.discord.gatewayInfoTimeoutMs`
    - multi-akun: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env saat config belum diatur: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - default: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Restart karena timeout READY Gateway">
    OpenClaw menunggu event `READY` Gateway Discord saat startup dan setelah runtime terhubung ulang. Penyiapan multi-akun dengan jeda startup dapat memerlukan jendela READY startup yang lebih lama daripada default.

    Knob timeout READY:

    - startup akun tunggal: `channels.discord.gatewayReadyTimeoutMs`
    - startup multi-akun: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env startup saat config belum diatur: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - default startup: `15000` (15 detik), maks: `120000`
    - runtime akun tunggal: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-akun: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env runtime saat config belum diatur: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - default runtime: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Ketidakcocokan audit izin">
    Pemeriksaan izin `channels status --probe` hanya berfungsi untuk ID channel numerik.

    Jika Anda menggunakan kunci slug, pencocokan runtime masih dapat berfungsi, tetapi probe tidak dapat memverifikasi izin sepenuhnya.

  </Accordion>

  <Accordion title="Masalah DM dan pairing">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - Kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (lama: `channels.discord.dm.policy`)
    - menunggu persetujuan pairing dalam mode `pairing`

  </Accordion>

  <Accordion title="Loop bot ke bot">
    Secara default, pesan yang ditulis bot diabaikan.

    Jika Anda mengatur `channels.discord.allowBots=true`, gunakan aturan mention dan allowlist yang ketat untuk menghindari perilaku loop.
    Pilih `channels.discord.allowBots="mentions"` agar hanya menerima pesan bot yang menyebut bot tersebut.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="STT suara terputus dengan DecryptionFailed(...)">

    - pertahankan OpenClaw tetap mutakhir (`openclaw update`) agar logika pemulihan penerimaan suara Discord tersedia
    - pastikan `channels.discord.voice.daveEncryption=true` (default)
    - mulai dari `channels.discord.voice.decryptionFailureTolerance=24` (default upstream) dan sesuaikan hanya jika diperlukan
    - pantau log untuk:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jika kegagalan berlanjut setelah bergabung ulang otomatis, kumpulkan log dan bandingkan dengan riwayat penerimaan DAVE upstream di [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) dan [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Discord](/id/gateway/config-channels#discord).

<Accordion title="Kolom Discord bernilai tinggi">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- kebijakan: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- perintah: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- antrean event: `eventQueue.listenerTimeout` (anggaran listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- balasan/riwayat: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias lama: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/coba ulang: `mediaMaxMb` (membatasi unggahan Discord keluar, default `100MB`), `retry`
- tindakan: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- fitur: `threadBindings`, `bindings[]` tingkat atas (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Keamanan dan operasi

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` lebih disukai di lingkungan yang disupervisi).
- Berikan izin Discord dengan hak paling minimum.
- Jika deployment/status perintah sudah usang, restart Gateway dan periksa ulang dengan `openclaw channels status --probe`.

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pairing pengguna Discord ke Gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku chat grup dan allowlist.
  </Card>
  <Card title="Routing channel" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan pengerasan.
  </Card>
  <Card title="Routing multi-agen" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan guild dan channel ke agen.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native.
  </Card>
</CardGroup>
