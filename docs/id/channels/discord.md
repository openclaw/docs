---
read_when:
    - Mengerjakan fitur saluran Discord
summary: Status dukungan, kapabilitas, dan konfigurasi bot Discord
title: Discord
x-i18n:
    generated_at: "2026-05-10T19:21:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121b0b46bfb0d438f6ebfba4c93410c2ecfe8f99aa257e362b8767bf0aac27ce
    source_path: channels/discord.md
    workflow: 16
---

Siap untuk DM dan kanal guild melalui Gateway Discord resmi.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    DM Discord secara default menggunakan mode pemasangan.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah kanal" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas kanal dan alur perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

Anda perlu membuat aplikasi baru dengan bot, menambahkan bot ke server Anda, dan memasangkannya ke OpenClaw. Kami menyarankan untuk menambahkan bot Anda ke server privat milik Anda sendiri. Jika belum memilikinya, [buat terlebih dahulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (pilih **Create My Own > For me and my friends**).

<Steps>
  <Step title="Buat aplikasi dan bot Discord">
    Buka [Discord Developer Portal](https://discord.com/developers/applications) dan klik **New Application**. Beri nama seperti "OpenClaw".

    Klik **Bot** di bilah sisi. Atur **Username** ke nama apa pun yang Anda gunakan untuk agen OpenClaw Anda.

  </Step>

  <Step title="Aktifkan intent istimewa">
    Masih di halaman **Bot**, gulir ke bawah ke **Privileged Gateway Intents** dan aktifkan:

    - **Message Content Intent** (wajib)
    - **Server Members Intent** (disarankan; wajib untuk daftar izin peran dan pencocokan nama-ke-ID)
    - **Presence Intent** (opsional; hanya diperlukan untuk pembaruan kehadiran)

  </Step>

  <Step title="Salin token bot Anda">
    Gulir kembali ke atas di halaman **Bot** dan klik **Reset Token**.

    <Note>
    Terlepas dari namanya, ini menghasilkan token pertama Anda — tidak ada yang sedang "direset."
    </Note>

    Salin token tersebut dan simpan di suatu tempat. Ini adalah **Bot Token** Anda dan Anda akan membutuhkannya sebentar lagi.

  </Step>

  <Step title="Buat URL undangan dan tambahkan bot ke server Anda">
    Klik **OAuth2** di bilah sisi. Anda akan membuat URL undangan dengan izin yang tepat untuk menambahkan bot ke server Anda.

    Gulir ke bawah ke **OAuth2 URL Generator** dan aktifkan:

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

    Ini adalah set dasar untuk kanal teks normal. Jika Anda berencana memposting di utas Discord, termasuk alur kerja kanal forum atau media yang membuat atau melanjutkan utas, aktifkan juga **Send Messages in Threads**.
    Salin URL yang dihasilkan di bagian bawah, tempelkan ke browser Anda, pilih server Anda, lalu klik **Continue** untuk menghubungkan. Anda sekarang seharusnya melihat bot Anda di server Discord.

  </Step>

  <Step title="Aktifkan Developer Mode dan kumpulkan ID Anda">
    Kembali di aplikasi Discord, Anda perlu mengaktifkan Developer Mode agar dapat menyalin ID internal.

    1. Klik **User Settings** (ikon roda gigi di samping avatar Anda) → **Advanced** → aktifkan **Developer Mode**
    2. Klik kanan **ikon server** Anda di bilah sisi → **Copy Server ID**
    3. Klik kanan **avatar Anda sendiri** → **Copy User ID**

    Simpan **Server ID** dan **User ID** Anda bersama Bot Token — Anda akan mengirim ketiganya ke OpenClaw pada langkah berikutnya.

  </Step>

  <Step title="Izinkan DM dari anggota server">
    Agar pemasangan berfungsi, Discord perlu mengizinkan bot Anda mengirim DM kepada Anda. Klik kanan **ikon server** Anda → **Privacy Settings** → aktifkan **Direct Messages**.

    Ini memungkinkan anggota server (termasuk bot) mengirim DM kepada Anda. Biarkan ini aktif jika Anda ingin menggunakan DM Discord dengan OpenClaw. Jika Anda hanya berencana menggunakan kanal guild, Anda dapat menonaktifkan DM setelah pemasangan.

  </Step>

  <Step title="Atur token bot Anda dengan aman (jangan kirim di chat)">
    Token bot Discord Anda adalah rahasia (seperti kata sandi). Atur di mesin yang menjalankan OpenClaw sebelum mengirim pesan ke agen Anda.

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
    Untuk instalasi layanan terkelola, jalankan `openclaw gateway install` dari shell tempat `DISCORD_BOT_TOKEN` tersedia, atau simpan variabel di `~/.openclaw/.env`, sehingga layanan dapat menyelesaikan SecretRef env setelah dimulai ulang.
    Jika host Anda diblokir atau dibatasi lajunya oleh pencarian aplikasi awal Discord, atur ID aplikasi/klien Discord dari Developer Portal agar startup dapat melewati panggilan REST tersebut. Gunakan `channels.discord.applicationId` untuk akun default, atau `channels.discord.accounts.<accountId>.applicationId` saat Anda menjalankan beberapa bot Discord.

  </Step>

  <Step title="Konfigurasikan OpenClaw dan pasangkan">

    <Tabs>
      <Tab title="Minta agen Anda">
        Chat dengan agen OpenClaw Anda di kanal apa pun yang sudah ada (mis. Telegram) dan beri tahu. Jika Discord adalah kanal pertama Anda, gunakan tab CLI / konfigurasi sebagai gantinya.

        > "Saya sudah mengatur token bot Discord saya di konfigurasi. Tolong selesaikan penyiapan Discord dengan User ID `<user_id>` dan Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / konfigurasi">
        Jika Anda lebih suka konfigurasi berbasis file, atur:

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

        Untuk penyiapan terskrip atau jarak jauh, tulis blok JSON5 yang sama dengan `openclaw config patch --file ./discord.patch.json5 --dry-run` lalu jalankan kembali tanpa `--dry-run`. Nilai `token` teks polos didukung. Nilai SecretRef juga didukung untuk `channels.discord.token` di seluruh penyedia env/file/exec. Lihat [Manajemen Rahasia](/id/gateway/secrets).

        Untuk beberapa bot Discord, simpan setiap token bot dan ID aplikasi di bawah akunnya. `channels.discord.applicationId` tingkat atas diwarisi oleh akun, jadi hanya atur di sana ketika setiap akun harus menggunakan ID aplikasi yang sama.

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

  <Step title="Setujui pemasangan DM pertama">
    Tunggu hingga Gateway berjalan, lalu kirim DM ke bot Anda di Discord. Bot akan merespons dengan kode pemasangan.

    <Tabs>
      <Tab title="Minta agen Anda">
        Kirim kode pemasangan ke agen Anda di kanal yang sudah ada:

        > "Setujui kode pemasangan Discord ini: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kode pemasangan kedaluwarsa setelah 1 jam.

    Sekarang Anda seharusnya dapat chat dengan agen Anda di Discord melalui DM.

  </Step>
</Steps>

<Note>
Resolusi token sadar akun. Nilai token konfigurasi mengalahkan fallback env. `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Jika dua akun Discord yang diaktifkan menyelesaikan ke token bot yang sama, OpenClaw hanya memulai satu pemantau Gateway untuk token tersebut. Token yang bersumber dari konfigurasi mengalahkan fallback env default; jika tidak, akun aktif pertama menang dan akun duplikat dilaporkan dinonaktifkan.
Untuk panggilan keluar tingkat lanjut (tindakan alat pesan/kanal), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk tindakan kirim dan baca/probe-style (misalnya read/search/fetch/thread/pins/permissions). Pengaturan kebijakan akun/coba ulang tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Direkomendasikan: Siapkan ruang kerja guild

Setelah DM berfungsi, Anda dapat menyiapkan server Discord Anda sebagai ruang kerja penuh tempat setiap kanal mendapatkan sesi agennya sendiri dengan konteksnya sendiri. Ini direkomendasikan untuk server privat yang hanya berisi Anda dan bot Anda.

<Steps>
  <Step title="Tambahkan server Anda ke daftar izin guild">
    Ini memungkinkan agen Anda merespons di kanal mana pun di server Anda, bukan hanya DM.

    <Tabs>
      <Tab title="Minta agen Anda">
        > "Tambahkan Server ID Discord saya `<server_id>` ke daftar izin guild"
      </Tab>
      <Tab title="Konfigurasi">

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
    Secara default, agen Anda hanya merespons di kanal guild ketika @mentioned. Untuk server privat, Anda mungkin ingin agen merespons setiap pesan.

    Di kanal guild, balasan akhir asisten normal tetap privat secara default. Output Discord yang terlihat harus dikirim secara eksplisit dengan alat `message`, sehingga agen dapat mengamati secara default dan hanya memposting ketika memutuskan bahwa balasan kanal berguna.

    Ini berarti model yang dipilih harus dapat memanggil alat dengan andal. Jika Discord menampilkan pengetikan dan log menunjukkan penggunaan token tetapi tidak ada pesan yang diposting, periksa log sesi untuk teks asisten dengan `didSendViaMessagingTool: false`. Itu berarti model menghasilkan jawaban akhir privat alih-alih memanggil `message(action=send)`. Beralihlah ke model pemanggil alat yang lebih kuat, atau gunakan konfigurasi di bawah untuk memulihkan balasan akhir otomatis legacy.

    <Tabs>
      <Tab title="Minta agen Anda">
        > "Izinkan agen saya merespons di server ini tanpa harus @mentioned"
      </Tab>
      <Tab title="Konfigurasi">
        Atur `requireMention: false` dalam konfigurasi guild Anda:

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

        Untuk memulihkan balasan akhir otomatis legacy untuk ruang grup/kanal, atur `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Rencanakan memori di kanal guild">
    Secara default, memori jangka panjang (MEMORY.md) hanya dimuat dalam sesi DM. Kanal guild tidak memuat MEMORY.md secara otomatis.

    <Tabs>
      <Tab title="Minta agen Anda">
        > "Saat saya mengajukan pertanyaan di kanal Discord, gunakan memory_search atau memory_get jika Anda membutuhkan konteks jangka panjang dari MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Jika Anda membutuhkan konteks bersama di setiap kanal, letakkan instruksi stabil di `AGENTS.md` atau `USER.md` (keduanya disuntikkan untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan dengan alat memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat beberapa kanal di server Discord Anda dan mulai chat. Agen Anda dapat melihat nama kanal, dan setiap kanal mendapatkan sesinya sendiri yang terisolasi — sehingga Anda dapat menyiapkan `#coding`, `#home`, `#research`, atau apa pun yang sesuai dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan masuk Discord kembali ke Discord.
- Metadata guild/channel Discord ditambahkan ke prompt model sebagai konteks
  tidak tepercaya, bukan sebagai prefiks balasan yang terlihat pengguna. Jika model menyalin kembali amplop itu,
  OpenClaw menghapus metadata yang disalin dari balasan keluar dan dari
  konteks pemutaran ulang berikutnya.
- Secara default (`session.dmScope=main`), obrolan langsung berbagi sesi utama agen (`agent:main:main`).
- Channel guild menggunakan kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- DM grup diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Perintah slash native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.
- Pengiriman pengumuman cron/heartbeat khusus teks ke Discord menggunakan jawaban akhir
  yang terlihat oleh asisten satu kali. Payload media dan komponen terstruktur tetap
  berupa beberapa pesan ketika agen menghasilkan beberapa payload yang dapat dikirim.

## Channel forum

Channel forum dan media Discord hanya menerima postingan thread. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke induk forum (`channel:<forumId>`) untuk membuat thread secara otomatis. Judul thread menggunakan baris pertama yang tidak kosong dari pesan Anda.
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

Induk forum tidak menerima komponen Discord. Jika Anda membutuhkan komponen, kirim ke thread itu sendiri (`channel:<threadId>`).

## Komponen interaktif

OpenClaw mendukung kontainer komponen v2 Discord untuk pesan agen. Gunakan alat pesan dengan payload `components`. Hasil interaksi dirutekan kembali ke agen sebagai pesan masuk normal dan mengikuti pengaturan Discord `replyToMode` yang ada.

Blok yang didukung:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Baris tindakan mengizinkan hingga 5 tombol atau satu menu pilih
- Jenis pilih: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya sekali pakai. Tetapkan `components.reusable=true` untuk mengizinkan tombol, pilihan, dan formulir digunakan beberapa kali hingga kedaluwarsa.

Untuk membatasi siapa yang dapat mengeklik tombol, tetapkan `allowedUsers` pada tombol itu (ID pengguna Discord, tag, atau `*`). Saat dikonfigurasi, pengguna yang tidak cocok menerima penolakan sementara.

Perintah slash `/model` dan `/models` membuka pemilih model interaktif dengan dropdown penyedia, model, dan runtime yang kompatibel serta langkah Submit. `/models add` sudah usang dan sekarang mengembalikan pesan penghentian dukungan, bukan mendaftarkan model dari obrolan. Balasan pemilih bersifat sementara dan hanya pengguna yang memanggilnya yang dapat menggunakannya. Menu pilih Discord dibatasi hingga 25 opsi, jadi tambahkan entri `provider/*` ke `agents.defaults.models` ketika Anda ingin pemilih menampilkan model yang ditemukan secara dinamis hanya untuk penyedia yang dipilih seperti `openai-codex` atau `vllm`.

Lampiran file:

- Blok `file` harus menunjuk ke referensi lampiran (`attachment://<filename>`)
- Sediakan lampiran melalui `media`/`path`/`filePath` (satu file); gunakan `media-gallery` untuk beberapa file
- Gunakan `filename` untuk mengganti nama unggahan ketika harus cocok dengan referensi lampiran

Formulir modal:

- Tambahkan `components.modal` dengan hingga 5 kolom
- Jenis kolom: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
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
    `channels.discord.dmPolicy` mengontrol akses DM. `channels.discord.allowFrom` adalah daftar izin DM kanonis.

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.discord.allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    Jika kebijakan DM tidak terbuka, pengguna yang tidak dikenal diblokir (atau diminta melakukan pairing dalam mode `pairing`).

    Prioritas multi-akun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Untuk satu akun, `allowFrom` diprioritaskan daripada `dm.allowFrom` lama.
    - Akun bernama mewarisi `channels.discord.allowFrom` ketika `allowFrom` miliknya sendiri dan `dm.allowFrom` lama tidak ditetapkan.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` dan `channels.discord.dm.allowFrom` lama masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` ketika dapat melakukannya tanpa mengubah akses.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - mention `<@id>`

    ID numerik polos biasanya diselesaikan sebagai ID channel ketika default channel aktif, tetapi ID yang tercantum dalam `allowFrom` DM efektif akun diperlakukan sebagai target DM pengguna untuk kompatibilitas.

  </Tab>

  <Tab title="Access groups">
    DM Discord dan otorisasi perintah teks dapat menggunakan entri dinamis `accessGroup:<name>` di `channels.discord.allowFrom`.

    Nama grup akses dibagikan di seluruh channel pesan. Gunakan `type: "message.senders"` untuk grup statis yang anggotanya dinyatakan dalam sintaks `allowFrom` normal masing-masing channel, atau `type: "discord.channelAudience"` ketika audiens `ViewChannel` saat ini dari channel Discord harus menentukan keanggotaan secara dinamis. Perilaku grup akses bersama didokumentasikan di sini: [Grup akses](/id/channels/access-groups).

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

    Channel teks Discord tidak memiliki daftar anggota terpisah. `type: "discord.channelAudience"` memodelkan keanggotaan sebagai: pengirim DM adalah anggota guild yang dikonfigurasi dan saat ini memiliki izin `ViewChannel` efektif pada channel yang dikonfigurasi setelah overwrite peran dan channel diterapkan.

    Contoh: izinkan siapa pun yang dapat melihat `#maintainers` untuk mengirim DM ke bot, sambil menjaga DM tetap tertutup bagi semua orang lain.

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

    Pencarian gagal tertutup. Jika Discord mengembalikan `Missing Access`, pencarian anggota gagal, atau channel termasuk dalam guild berbeda, pengirim DM diperlakukan sebagai tidak berwenang.

    Aktifkan **Server Members Intent** Discord Developer Portal untuk bot saat menggunakan grup akses audiens channel. DM tidak menyertakan status anggota guild, jadi OpenClaw menyelesaikan anggota melalui Discord REST pada waktu otorisasi.

  </Tab>

  <Tab title="Guild policy">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman ketika `channels.discord` ada adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` lebih disukai, slug diterima)
    - daftar izin pengirim opsional: `users` (ID stabil direkomendasikan) dan `roles` (hanya ID peran); jika salah satunya dikonfigurasi, pengirim diizinkan ketika cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag langsung dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memperingatkan ketika entri nama/tag digunakan
    - jika guild memiliki `channels` yang dikonfigurasi, channel yang tidak tercantum ditolak
    - jika guild tidak memiliki blok `channels`, semua channel dalam guild yang masuk daftar izin itu diizinkan

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

    Jika Anda hanya menetapkan `DISCORD_BOT_TOKEN` dan tidak membuat blok `channels.discord`, fallback runtime adalah `groupPolicy="allowlist"` (dengan peringatan di log), bahkan jika `channels.defaults.groupPolicy` adalah `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Pesan guild dibatasi mention secara default.

    Deteksi mention mencakup:

    - mention bot eksplisit
    - pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku balasan implisit ke bot dalam kasus yang didukung

    Saat menulis pesan Discord keluar, gunakan sintaks mention kanonis: `<@USER_ID>` untuk pengguna, `<#CHANNEL_ID>` untuk channel, dan `<@&ROLE_ID>` untuk peran. Jangan gunakan bentuk mention nama panggilan lama `<@!USER_ID>`.

    `requireMention` dikonfigurasi per guild/channel (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional membuang pesan yang menyebut pengguna/peran lain tetapi bukan bot (tidak termasuk @everyone/@here).

    DM grup:

    - default: diabaikan (`dm.groupEnabled=false`)
    - daftar izin opsional melalui `dm.groupChannels` (ID channel atau slug)

  </Tab>
</Tabs>

### Perutean agen berbasis peran

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agen berbeda berdasarkan ID peran. Binding berbasis peran hanya menerima ID peran dan dievaluasi setelah binding peer atau parent-peer dan sebelum binding khusus guild. Jika binding juga menetapkan kolom match lain (misalnya `peer` + `guildId` + `roles`), semua kolom yang dikonfigurasi harus cocok.

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
- Penggantian per-channel: `channels.discord.commands.native`.
- `commands.native=false` melewati pendaftaran dan pembersihan perintah slash Discord saat startup. Perintah yang sebelumnya terdaftar mungkin tetap terlihat di Discord hingga Anda menghapusnya dari aplikasi Discord.
- Auth perintah native menggunakan allowlist/kebijakan Discord yang sama seperti penanganan pesan normal.
- Perintah mungkin masih terlihat di UI Discord bagi pengguna yang tidak diotorisasi; eksekusi tetap memberlakukan auth OpenClaw dan mengembalikan "tidak diotorisasi".

Lihat [Perintah slash](/id/tools/slash-commands) untuk katalog dan perilaku perintah.

Pengaturan perintah slash default:

- `ephemeral: true`

## Detail fitur

<AccordionGroup>
  <Accordion title="Balasan tag dan balasan native">
    Discord mendukung tag balasan dalam output agen:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Dikontrol oleh `channels.discord.replyToMode`:

    - `off` (default)
    - `first`
    - `all`
    - `batched`

    Catatan: `off` menonaktifkan threading balasan implisit. Tag eksplisit `[[reply_to_*]]` tetap dipatuhi.
    `first` selalu melampirkan referensi balasan native implisit ke pesan Discord keluar pertama untuk giliran tersebut.
    `batched` hanya melampirkan referensi balasan native implisit Discord ketika
    giliran masuk adalah batch ter-debounce dari beberapa pesan. Ini berguna
    saat Anda menginginkan balasan native terutama untuk chat bursty yang ambigu, bukan setiap
    giliran satu pesan.

    ID pesan dimunculkan dalam konteks/riwayat sehingga agen dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Pratinjau live stream">
    OpenClaw dapat melakukan stream draf balasan dengan mengirim pesan sementara dan mengeditnya saat teks tiba. `channels.discord.streaming` menerima `off` | `partial` | `block` | `progress` (default). `progress` mempertahankan satu draf status yang dapat diedit dan memperbaruinya dengan progres tool hingga pengiriman final; label awal bersama berupa baris bergulir, sehingga akan tergulir seperti yang lain setelah cukup banyak pekerjaan muncul. `streamMode` adalah alias runtime legacy. Jalankan `openclaw doctor --fix` untuk menulis ulang config tersimpan ke key kanonis.

    Atur `channels.discord.streaming.mode` ke `off` untuk menonaktifkan edit pratinjau Discord. Jika streaming blok Discord diaktifkan secara eksplisit, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

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
    - `block` memancarkan potongan seukuran draf (gunakan `draftChunk` untuk menyesuaikan ukuran dan breakpoint, dibatasi ke `textChunkLimit`).
    - Final media, error, dan balasan eksplisit membatalkan edit pratinjau tertunda.
    - `streaming.preview.toolProgress` (default `true`) mengontrol apakah pembaruan tool/progres menggunakan ulang pesan pratinjau.
    - Baris tool/progres dirender sebagai emoji + judul + detail yang ringkas bila tersedia, misalnya `🛠️ Bash: run tests` atau `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` mengontrol detail perintah/exec dalam baris progres ringkas: `raw` (default) atau `status` (hanya label tool).

    Sembunyikan teks perintah/exec mentah sambil mempertahankan baris progres ringkas:

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

    Streaming pratinjau hanya teks; balasan media kembali ke pengiriman normal. Ketika streaming `block` diaktifkan secara eksplisit, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

  </Accordion>

  <Accordion title="Riwayat, konteks, dan perilaku thread">
    Konteks riwayat guild:

    - default `channels.discord.historyLimit` `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Kontrol riwayat DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Perilaku thread:

    - Thread Discord dirutekan sebagai sesi channel dan mewarisi config channel induk kecuali diganti.
    - Sesi thread mewarisi pemilihan `/model` tingkat sesi milik channel induk sebagai fallback khusus model; pemilihan `/model` lokal thread tetap diprioritaskan dan riwayat transkrip induk tidak disalin kecuali pewarisan transkrip diaktifkan.
    - `channels.discord.thread.inheritParent` (default `false`) mengikutsertakan auto-thread baru untuk disemai dari transkrip induk. Penggantian per-akun berada di bawah `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaksi message-tool dapat me-resolve target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` dipertahankan selama fallback aktivasi tahap balasan.

    Topik channel disuntikkan sebagai konteks **tidak tepercaya**. Allowlist membatasi siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan penuh.

  </Accordion>

  <Accordion title="Sesi terikat thread untuk subagen">
    Discord dapat mengikat thread ke target sesi sehingga pesan lanjutan di thread tersebut tetap dirutekan ke sesi yang sama (termasuk sesi subagen).

    Perintah:

    - `/focus <target>` ikat thread saat ini/baru ke target subagen/sesi
    - `/unfocus` hapus pengikatan thread saat ini
    - `/agents` tampilkan run aktif dan status pengikatan
    - `/session idle <duration|off>` periksa/perbarui auto-unfocus karena tidak aktif untuk pengikatan terfokus
    - `/session max-age <duration|off>` periksa/perbarui usia maksimum keras untuk pengikatan terfokus

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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Catatan:

    - `session.threadBindings.*` menetapkan default global.
    - `channels.discord.threadBindings.*` mengganti perilaku Discord.
    - `spawnSessions` mengontrol pembuatan/pengikatan otomatis thread untuk `sessions_spawn({ thread: true })` dan spawn thread ACP. Default: `true`.
    - `defaultSpawnContext` mengontrol konteks subagen native untuk spawn terikat thread. Default: `"fork"`.
    - Key usang `spawnSubagentSessions`/`spawnAcpSessions` dimigrasikan oleh `openclaw doctor --fix`.
    - Jika pengikatan thread dinonaktifkan untuk sebuah akun, `/focus` dan operasi pengikatan thread terkait tidak tersedia.

    Lihat [Sub-agen](/id/tools/subagents), [Agen ACP](/id/tools/acp-agents), dan [Referensi Konfigurasi](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Pengikatan channel ACP persisten">
    Untuk workspace ACP "selalu aktif" yang stabil, konfigurasikan pengikatan ACP bertipe tingkat atas yang menargetkan percakapan Discord.

    Path config:

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

    - `/acp spawn codex --bind here` mengikat channel atau thread saat ini di tempat dan mempertahankan pesan mendatang pada sesi ACP yang sama. Pesan thread mewarisi pengikatan channel induk.
    - Dalam channel atau thread terikat, `/new` dan `/reset` mereset sesi ACP yang sama di tempat. Pengikatan thread sementara dapat mengganti resolusi target selama aktif.
    - `spawnSessions` membatasi pembuatan/pengikatan thread anak melalui `--thread auto|here`.

    Lihat [Agen ACP](/id/tools/acp-agents) untuk detail perilaku pengikatan.

  </Accordion>

  <Accordion title="Notifikasi reaksi">
    Mode notifikasi reaksi per-guild:

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
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada "👀")

    Catatan:

    - Discord menerima emoji unicode atau nama emoji khusus.
    - Gunakan `""` untuk menonaktifkan reaksi bagi channel atau akun.

  </Accordion>

  <Accordion title="Penulisan config">
    Penulisan config yang dimulai channel diaktifkan secara default.

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
    Rutekan traffic WebSocket Gateway Discord dan lookup REST saat startup (ID aplikasi + resolusi allowlist) melalui proxy HTTP(S) dengan `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Penggantian per-akun:

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
    Aktifkan resolusi PluralKit untuk memetakan pesan terproksi ke identitas anggota sistem:

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
    - lookup menggunakan ID pesan asli dan dibatasi jendela waktu
    - jika lookup gagal, pesan terproksi diperlakukan sebagai pesan bot dan dibuang kecuali `allowBots=true`

  </Accordion>

  <Accordion title="Alias mention keluar">
    Gunakan `mentionAliases` ketika agen membutuhkan mention keluar deterministik untuk pengguna Discord yang dikenal. Key adalah handle tanpa awalan `@`; value adalah ID pengguna Discord. Handle yang tidak dikenal, `@everyone`, `@here`, dan mention di dalam code span Markdown dibiarkan tidak berubah.

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

  <Accordion title="Konfigurasi presence">
    Pembaruan presence diterapkan ketika Anda menetapkan field status atau aktivitas, atau ketika Anda mengaktifkan presence otomatis.

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

    Contoh aktivitas (status khusus adalah tipe aktivitas default):

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

    - 0: Bermain
    - 1: Streaming (memerlukan `activityUrl`)
    - 2: Mendengarkan
    - 3: Menonton
    - 4: Kustom (menggunakan teks aktivitas sebagai status state; emoji bersifat opsional)
    - 5: Berkompetisi

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

    Auto presence memetakan ketersediaan runtime ke status Discord: sehat => online, menurun atau tidak diketahui => idle, habis atau tidak tersedia => dnd. Penggantian teks opsional:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (mendukung placeholder `{reason}`)

  </Accordion>

  <Accordion title="Persetujuan di Discord">
    Discord mendukung penanganan persetujuan berbasis tombol di DM dan secara opsional dapat mengirim prompt persetujuan di channel asal.

    Jalur konfigurasi:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; fallback ke `commands.ownerAllowFrom` jika memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord otomatis mengaktifkan persetujuan exec native saat `enabled` tidak diatur atau `"auto"` dan setidaknya satu pemberi persetujuan dapat diselesaikan, baik dari `execApprovals.approvers` maupun dari `commands.ownerAllowFrom`. Discord tidak menyimpulkan pemberi persetujuan exec dari channel `allowFrom`, `dm.allowFrom` lama, atau pesan langsung `defaultTo`. Atur `enabled: false` untuk menonaktifkan Discord sebagai klien persetujuan native secara eksplisit.

    Untuk perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory`, OpenClaw mengirim prompt persetujuan dan hasil akhir secara privat. OpenClaw mencoba DM Discord terlebih dahulu saat pemilik yang memanggil memiliki rute pemilik Discord; jika tidak tersedia, OpenClaw fallback ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, seperti Telegram.

    Saat `target` adalah `channel` atau `both`, prompt persetujuan terlihat di channel. Hanya pemberi persetujuan yang berhasil diselesaikan yang dapat menggunakan tombol; pengguna lain menerima penolakan ephemeral. Prompt persetujuan menyertakan teks perintah, jadi aktifkan pengiriman channel hanya di channel tepercaya. Jika ID channel tidak dapat diturunkan dari kunci sesi, OpenClaw fallback ke pengiriman DM.

    Discord juga merender tombol persetujuan bersama yang digunakan oleh channel chat lain. Adapter Discord native terutama menambahkan perutean DM pemberi persetujuan dan fanout channel.
    Saat tombol tersebut ada, tombol itu adalah UX persetujuan utama; OpenClaw
    sebaiknya hanya menyertakan perintah manual `/approve` saat hasil alat menyatakan
    persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    Jika runtime persetujuan native Discord tidak aktif, OpenClaw mempertahankan
    prompt deterministik lokal `/approve <id> <decision>` tetap terlihat. Jika
    runtime aktif tetapi kartu native tidak dapat dikirim ke target mana pun,
    OpenClaw mengirim pemberitahuan fallback di chat yang sama dengan perintah
    `/approve` persis dari persetujuan yang tertunda.

    Autentikasi Gateway dan penyelesaian persetujuan mengikuti kontrak klien Gateway bersama (ID `plugin:` diselesaikan melalui `plugin.approval.resolve`; ID lain melalui `exec.approval.resolve`). Persetujuan kedaluwarsa setelah 30 menit secara default.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Alat dan gerbang tindakan

Tindakan pesan Discord mencakup tindakan perpesanan, admin channel, moderasi, presence, dan metadata.

Contoh inti:

- perpesanan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- presence: `setPresence`

Tindakan `event-create` menerima parameter `image` opsional (URL atau jalur file lokal) untuk mengatur gambar sampul acara terjadwal.

Gerbang tindakan berada di bawah `channels.discord.actions.*`.

Perilaku gerbang default:

| Grup tindakan                                                                                                                                                            | Bawaan  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | aktif   |
| roles                                                                                                                                                                    | nonaktif |
| moderation                                                                                                                                                               | nonaktif |
| presence                                                                                                                                                                 | nonaktif |

## UI Komponen v2

OpenClaw menggunakan komponen Discord v2 untuk persetujuan exec dan penanda lintas konteks. Tindakan pesan Discord juga dapat menerima `components` untuk UI kustom (lanjutan; memerlukan pembuatan payload komponen melalui alat discord), sementara `embeds` lama tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` mengatur warna aksen yang digunakan oleh kontainer komponen Discord (hex).
- Atur per akun dengan `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` diabaikan saat komponen v2 ada.

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

Discord memiliki dua permukaan suara yang berbeda: **channel suara** realtime (percakapan berkelanjutan) dan **lampiran pesan suara** (format pratinjau gelombang). Gateway mendukung keduanya.

### Channel suara

Checklist penyiapan:

1. Aktifkan Message Content Intent di Discord Developer Portal.
2. Aktifkan Server Members Intent saat allowlist peran/pengguna digunakan.
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
        model: "openai-codex/gpt-5.5",
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
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Catatan:

- `voice.tts` menimpa `messages.tts` hanya untuk pemutaran suara `stt-tts`. Mode realtime menggunakan `voice.realtime.voice`.
- `voice.mode` mengontrol jalur percakapan. Defaultnya adalah `agent-proxy`: front end suara realtime menangani pengaturan waktu giliran, interupsi, dan pemutaran, mendelegasikan pekerjaan substantif ke agen OpenClaw yang dirutekan melalui `openclaw_agent_consult`, dan memperlakukan hasilnya seperti prompt Discord yang diketik dari pembicara tersebut. `stt-tts` mempertahankan alur batch STT plus TTS yang lebih lama. `bidi` memungkinkan model realtime bercakap langsung sambil mengekspos `openclaw_agent_consult` untuk otak OpenClaw.
- `voice.agentSession` mengontrol percakapan OpenClaw mana yang menerima giliran suara. Biarkan tidak disetel untuk sesi milik saluran suara itu sendiri, atau setel `{ mode: "target", target: "channel:<text-channel-id>" }` agar saluran suara bertindak sebagai ekstensi mikrofon/speaker dari sesi saluran teks Discord yang sudah ada seperti `#maintainers`.
- `voice.model` menimpa otak agen OpenClaw untuk respons suara Discord dan konsultasi realtime. Biarkan tidak disetel untuk mewarisi model agen yang dirutekan. Ini terpisah dari `voice.realtime.model`.
- `agent-proxy` merutekan ucapan melalui `discord-voice`, yang mempertahankan otorisasi pemilik/alat normal untuk pembicara dan sesi target tetapi menyembunyikan alat `tts` agen karena suara Discord memiliki pemutaran. Secara default, `agent-proxy` memberi konsultasi akses alat penuh yang setara pemilik untuk pembicara pemilik (`voice.realtime.toolPolicy: "owner"`) dan sangat mengutamakan konsultasi dengan agen OpenClaw sebelum jawaban substantif (`voice.realtime.consultPolicy: "always"`). Dalam mode default `always` itu, lapisan realtime tidak otomatis mengucapkan pengisi sebelum jawaban konsultasi; lapisan ini menangkap dan mentranskripsikan ucapan, lalu mengucapkan jawaban OpenClaw yang dirutekan. Jika beberapa jawaban konsultasi paksa selesai saat Discord masih memutar jawaban pertama, jawaban ucapan persis berikutnya diantrekan sampai pemutaran idle alih-alih mengganti ucapan di tengah kalimat.
- Dalam mode `stt-tts`, STT menggunakan `tools.media.audio`; `voice.model` tidak memengaruhi transkripsi.
- Dalam mode realtime, `voice.realtime.provider`, `voice.realtime.model`, dan `voice.realtime.voice` mengonfigurasi sesi audio realtime. Untuk OpenAI Realtime 2 plus otak Codex, gunakan `voice.realtime.model: "gpt-realtime-2"` dan `voice.model: "openai-codex/gpt-5.5"`.
- Penyedia realtime OpenAI menerima nama event Realtime 2 saat ini dan alias lama yang kompatibel dengan Codex untuk event audio keluaran dan transkrip, sehingga snapshot penyedia yang kompatibel dapat bergeser tanpa menjatuhkan audio asisten.
- `voice.realtime.bargeIn` mengontrol apakah event speaker-start Discord menginterupsi pemutaran realtime aktif. Jika tidak disetel, ini mengikuti pengaturan interupsi input-audio penyedia realtime.
- `voice.realtime.minBargeInAudioEndMs` mengontrol durasi pemutaran asisten minimum sebelum barge-in realtime OpenAI memotong audio. Default: `250`. Setel `0` untuk interupsi langsung di ruangan dengan echo rendah, atau naikkan untuk setup speaker dengan echo berat.
- Untuk suara OpenAI pada pemutaran Discord, setel `voice.tts.provider: "openai"` dan pilih suara Text-to-speech di bawah `voice.tts.openai.voice` atau `voice.tts.providers.openai.voice`. `cedar` adalah pilihan terdengar maskulin yang baik pada model OpenAI TTS saat ini.
- Penimpaan `systemPrompt` Discord per saluran berlaku untuk giliran transkrip suara bagi saluran suara tersebut.
- Giliran transkrip suara menurunkan status pemilik dari `allowFrom` Discord (atau `dm.allowFrom`); pembicara non-pemilik tidak dapat mengakses alat khusus pemilik (misalnya `gateway` dan `cron`).
- Suara Discord bersifat opt-in untuk konfigurasi khusus teks; setel `channels.discord.voice.enabled=true` (atau pertahankan blok `channels.discord.voice` yang sudah ada) untuk mengaktifkan perintah `/vc`, runtime suara, dan intent gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` dapat secara eksplisit menimpa langganan intent status suara. Biarkan tidak disetel agar intent mengikuti pengaktifan suara efektif.
- Jika `voice.autoJoin` memiliki beberapa entri untuk guild yang sama, OpenClaw bergabung ke saluran terakhir yang dikonfigurasi untuk guild tersebut.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi join `@discordjs/voice`.
- Default `@discordjs/voice` adalah `daveEncryption=true` dan `decryptionFailureTolerance=24` jika tidak disetel.
- OpenClaw menggunakan decoder `opusscript` pure-JS secara default untuk penerimaan suara Discord. Paket native opsional `@discordjs/opus` diabaikan oleh kebijakan instal pnpm repo sehingga instalasi normal, jalur Docker, dan pengujian tidak terkait tidak mengompilasi addon native. Host performa suara khusus dapat ikut serta dengan `OPENCLAW_DISCORD_OPUS_DECODER=native` setelah menginstal addon native.
- `voice.connectTimeoutMs` mengontrol penantian Ready `@discordjs/voice` awal untuk upaya `/vc join` dan auto-join. Default: `30000`.
- `voice.reconnectGraceMs` mengontrol berapa lama OpenClaw menunggu sesi suara yang terputus mulai menyambung ulang sebelum menghancurkannya. Default: `15000`.
- Dalam mode `stt-tts`, pemutaran suara tidak berhenti hanya karena pengguna lain mulai berbicara. Untuk menghindari loop umpan balik, OpenClaw mengabaikan tangkapan suara baru saat TTS sedang diputar; bicaralah setelah pemutaran selesai untuk giliran berikutnya. Mode realtime meneruskan speaker start sebagai sinyal barge-in ke penyedia realtime.
- Dalam mode realtime, echo dari speaker ke mikrofon terbuka dapat terlihat seperti barge-in dan menginterupsi pemutaran. Untuk ruangan Discord dengan echo berat, setel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` agar OpenAI tidak otomatis menginterupsi pada audio input. Tambahkan `voice.realtime.bargeIn: true` jika Anda tetap ingin event speaker-start Discord menginterupsi pemutaran aktif. Bridge realtime OpenAI mengabaikan pemotongan pemutaran yang lebih pendek dari `voice.realtime.minBargeInAudioEndMs` sebagai kemungkinan echo/noise dan mencatatnya sebagai dilewati alih-alih membersihkan pemutaran Discord.
- `voice.captureSilenceGraceMs` mengontrol berapa lama OpenClaw menunggu setelah Discord melaporkan pembicara telah berhenti sebelum menyelesaikan segmen audio itu untuk STT. Default: `2500`; naikkan ini jika Discord membagi jeda normal menjadi transkrip parsial yang terputus-putus.
- Ketika ElevenLabs adalah penyedia TTS yang dipilih, pemutaran suara Discord menggunakan streaming TTS dan dimulai dari stream respons penyedia. Penyedia tanpa dukungan streaming kembali ke jalur temp-file yang disintesis.
- OpenClaw juga memantau kegagalan dekripsi penerimaan dan melakukan pemulihan otomatis dengan keluar/bergabung kembali ke saluran suara setelah kegagalan berulang dalam jendela singkat.
- Jika log penerimaan berulang kali menampilkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` setelah pembaruan, kumpulkan laporan dependensi dan log. Baris `@discordjs/voice` yang dibundel menyertakan perbaikan padding upstream dari PR discord.js #11449, yang menutup issue discord.js #11419.
- Event penerimaan `The operation was aborted` diharapkan ketika OpenClaw menyelesaikan segmen pembicara yang ditangkap; itu adalah diagnostik verbose, bukan peringatan.
- Log suara Discord verbose menyertakan pratinjau transkrip STT satu baris yang dibatasi untuk setiap segmen pembicara yang diterima, sehingga debugging menampilkan sisi pengguna dan sisi balasan agen tanpa membuang teks transkrip tanpa batas.
- Dalam mode `agent-proxy`, fallback konsultasi paksa melewati fragmen transkrip yang kemungkinan tidak lengkap seperti teks yang berakhir dengan `...` atau konektor trailing seperti `and`, plus penutup yang jelas tidak dapat ditindaklanjuti seperti “segera kembali” atau “bye”. Log menampilkan `forced agent consult skipped reason=...` ketika ini mencegah jawaban antrean yang basi.

Setup opus native untuk checkout sumber:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Gunakan Node 22 untuk Gateway ketika Anda menginginkan addon native prebuilt macOS arm64 upstream. Jika Anda menggunakan runtime Node lain, installer opt-in mungkin memerlukan toolchain build sumber `node-gyp` lokal.

Setelah menginstal addon native, mulai Gateway dengan:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Log suara verbose seharusnya menampilkan `discord voice: opus decoder: @discordjs/opus`. Tanpa opt-in env, atau jika addon native hilang atau tidak dapat dimuat pada host, OpenClaw mencatat `discord voice: opus decoder: opusscript` dan tetap menerima suara melalui fallback pure-JS.

Pipeline STT plus TTS:

- Tangkapan PCM Discord dikonversi menjadi file temp WAV.
- `tools.media.audio` menangani STT, misalnya `openai/gpt-4o-mini-transcribe`.
- Transkrip dikirim melalui ingress dan perutean Discord sementara LLM respons berjalan dengan kebijakan keluaran suara yang menyembunyikan alat `tts` agen dan meminta teks yang dikembalikan, karena suara Discord memiliki pemutaran TTS akhir.
- `voice.model`, jika disetel, hanya menimpa LLM respons untuk giliran saluran suara ini.
- `voice.tts` digabungkan di atas `messages.tts`; penyedia berkemampuan streaming memberi umpan langsung ke pemutar, jika tidak file audio yang dihasilkan diputar di saluran yang diikuti.

Contoh sesi saluran suara agent-proxy default:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Tanpa blok `voice.agentSession`, setiap saluran suara mendapatkan sesi OpenClaw yang dirutekan sendiri. Misalnya, `/vc join channel:234567890123456789` berbicara ke sesi untuk saluran suara Discord tersebut. Model realtime hanyalah front end suara; permintaan substantif diserahkan ke agen OpenClaw yang dikonfigurasi. Jika model realtime menghasilkan transkrip akhir tanpa memanggil alat konsultasi, OpenClaw memaksa konsultasi sebagai fallback sehingga default tetap berperilaku seperti berbicara dengan agen.

Contoh STT plus TTS lama:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

Contoh bidi realtime:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Suara sebagai ekstensi sesi saluran Discord yang sudah ada:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Dalam mode `agent-proxy`, bot bergabung ke saluran suara yang dikonfigurasi, tetapi giliran agen OpenClaw menggunakan sesi dan agen normal yang dirutekan milik saluran target. Sesi suara realtime mengucapkan hasil yang dikembalikan kembali ke saluran suara. Agen supervisor tetap dapat menggunakan alat pesan normal sesuai kebijakan alatnya, termasuk mengirim pesan Discord terpisah jika itu tindakan yang tepat.

Bentuk target yang berguna:

- `target: "channel:123456789012345678"` merutekan melalui sesi saluran teks Discord.
- `target: "123456789012345678"` diperlakukan sebagai target saluran.
- `target: "dm:123456789012345678"` atau `target: "user:123456789012345678"` merutekan melalui sesi pesan langsung tersebut.

Contoh OpenAI Realtime dengan echo berat:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

Gunakan ini saat model mendengar pemutaran Discord miliknya sendiri melalui mikrofon terbuka, tetapi Anda tetap ingin menginterupsinya dengan berbicara. OpenClaw mencegah OpenAI melakukan interupsi otomatis pada audio input mentah, sementara `bargeIn: true` memungkinkan peristiwa mulai-berbicara dari speaker Discord dan audio speaker yang sudah aktif membatalkan respons realtime yang aktif sebelum giliran tangkapan berikutnya mencapai OpenAI. Sinyal barge-in yang sangat awal dengan `audioEndMs` di bawah `minBargeInAudioEndMs` diperlakukan sebagai kemungkinan gema/noise dan diabaikan agar model tidak terpotong pada frame pemutaran pertama.

Log suara yang diharapkan:

- Saat bergabung: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Saat realtime dimulai: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Saat audio speaker: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, dan `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Saat ucapan kedaluwarsa dilewati: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` atau `reason=non-actionable-closing ...`
- Saat respons realtime selesai: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Saat pemutaran berhenti/direset: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Saat konsultasi realtime: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Saat jawaban agen: `discord voice: agent turn answer ...`
- Saat ucapan persis masuk antrean: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, diikuti oleh `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Saat deteksi barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` atau `discord voice: realtime barge-in detected source=active-speaker-audio ...`, diikuti oleh `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Saat interupsi realtime: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, diikuti oleh `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` atau `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Saat gema/noise diabaikan: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Saat barge-in dinonaktifkan: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Saat pemutaran menganggur: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Untuk men-debug audio yang terpotong, baca log suara realtime sebagai linimasa:

1. `realtime audio playback started` berarti Discord telah mulai memutar audio asisten. Bridge mulai menghitung chunk output asisten, byte PCM Discord, byte realtime penyedia, dan durasi audio tersintesis dari titik ini.
2. `realtime speaker turn opened` menandai speaker Discord menjadi aktif. Jika pemutaran sudah aktif dan `bargeIn` diaktifkan, ini dapat diikuti oleh `barge-in detected source=speaker-start`.
3. `realtime input audio started` menandai frame audio aktual pertama yang diterima untuk giliran speaker tersebut. `outputActive=true` atau `outputAudioMs` yang bukan nol di sini berarti mikrofon mengirim input sementara pemutaran asisten masih aktif.
4. `barge-in detected source=active-speaker-audio` berarti OpenClaw melihat audio speaker langsung saat pemutaran asisten aktif. Ini berguna untuk membedakan interupsi nyata dari peristiwa mulai-berbicara speaker Discord tanpa audio yang berguna.
5. `barge-in requested reason=...` berarti OpenClaw meminta penyedia realtime membatalkan atau memotong respons aktif. Ini mencakup `outputAudioMs`, `outputActive`, dan `playbackChunks` sehingga Anda dapat melihat berapa banyak audio asisten yang benar-benar telah diputar sebelum interupsi.
6. `realtime audio playback stopped reason=...` adalah titik reset pemutaran Discord lokal. Alasannya menunjukkan siapa yang menghentikan pemutaran: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, atau `session-close`.
7. `realtime speaker turn closed` merangkum giliran input yang ditangkap. `chunks=0` atau `hasAudio=false` berarti giliran speaker terbuka tetapi tidak ada audio yang dapat digunakan mencapai bridge realtime. `interruptedPlayback=true` berarti giliran input tersebut tumpang tindih dengan output asisten dan memicu logika barge-in.

Field yang berguna:

- `outputAudioMs`: durasi audio asisten yang dibuat oleh penyedia realtime sebelum baris log.
- `audioMs`: durasi audio asisten yang dihitung OpenClaw sebelum pemutaran berhenti.
- `elapsedMs`: waktu wall-clock antara pembukaan dan penutupan stream pemutaran atau giliran speaker.
- `discordBytes`: byte PCM stereo 48 kHz yang dikirim ke atau diterima dari suara Discord.
- `realtimeBytes`: byte PCM format penyedia yang dikirim ke atau diterima dari penyedia realtime.
- `playbackChunks`: chunk audio asisten yang diteruskan ke Discord untuk respons aktif.
- `sinceLastAudioMs`: jeda antara frame audio speaker terakhir yang ditangkap dan penutupan giliran speaker.

Pola umum:

- Terpotong langsung dengan `source=active-speaker-audio`, `outputAudioMs` kecil, dan pengguna yang sama berada dekat biasanya menunjukkan gema speaker masuk ke mikrofon. Naikkan `voice.realtime.minBargeInAudioEndMs`, turunkan volume speaker, gunakan headphone, atau setel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` diikuti oleh `speaker turn closed ... hasAudio=false` berarti Discord melaporkan speaker mulai berbicara tetapi tidak ada audio yang mencapai OpenClaw. Ini bisa berupa peristiwa suara Discord sementara, perilaku noise gate, atau klien yang membuka mikrofon sebentar.
- `audio playback stopped reason=stream-close` tanpa barge-in terdekat atau `provider-clear-audio` berarti stream pemutaran Discord lokal berakhir secara tidak terduga. Periksa log penyedia dan pemutar Discord sebelumnya.
- `capture ignored during playback (barge-in disabled)` berarti OpenClaw sengaja membuang input saat audio asisten aktif. Aktifkan `voice.realtime.bargeIn` jika Anda ingin ucapan menginterupsi pemutaran.
- `barge-in ignored ... outputActive=false` berarti Discord atau VAD penyedia melaporkan ucapan, tetapi OpenClaw tidak memiliki pemutaran aktif untuk diinterupsi. Ini tidak seharusnya memotong audio.

Kredensial diselesaikan per komponen: autentikasi rute LLM untuk `voice.model`, autentikasi STT untuk `tools.media.audio`, autentikasi TTS untuk `messages.tts`/`voice.tts`, dan autentikasi penyedia realtime untuk `voice.realtime.providers` atau konfigurasi autentikasi normal penyedia.

### Pesan suara

Pesan suara Discord menampilkan pratinjau waveform dan memerlukan audio OGG/Opus. OpenClaw membuat waveform secara otomatis, tetapi memerlukan `ffmpeg` dan `ffprobe` di host gateway untuk memeriksa dan mengonversi.

- Berikan **jalur file lokal** (URL ditolak).
- Hilangkan konten teks (Discord menolak teks + pesan suara dalam payload yang sama).
- Format audio apa pun diterima; OpenClaw mengonversinya ke OGG/Opus sesuai kebutuhan.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - aktifkan Message Content Intent
    - aktifkan Server Members Intent saat Anda bergantung pada resolusi pengguna/anggota
    - mulai ulang gateway setelah mengubah intent

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - verifikasi `groupPolicy`
    - verifikasi allowlist guild di bawah `channels.discord.guilds`
    - jika map `channels` guild ada, hanya channel yang tercantum yang diizinkan
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
    - `requireMention` dikonfigurasi di tempat yang salah (harus berada di bawah `channels.discord.guilds` atau entri channel)
    - pengirim diblokir oleh allowlist `users` guild/channel

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Log umum:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Knob antrean Gateway Discord:

    - akun tunggal: `channels.discord.eventQueue.listenerTimeout`
    - multi-akun: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ini hanya mengontrol pekerjaan listener Gateway Discord, bukan masa hidup giliran agen

    Discord tidak menerapkan timeout milik channel pada giliran agen yang diantrekan. Listener pesan langsung menyerahkan pekerjaan, dan run Discord yang diantrekan mempertahankan pengurutan per sesi sampai siklus hidup sesi/tool/runtime selesai atau membatalkan pekerjaan.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw mengambil metadata `/gateway/bot` Discord sebelum terhubung. Kegagalan sementara fallback ke URL Gateway default Discord dan dibatasi lajunya di log.

    Knob timeout metadata:

    - akun tunggal: `channels.discord.gatewayInfoTimeoutMs`
    - multi-akun: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env saat konfigurasi tidak disetel: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - default: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw menunggu peristiwa `READY` Gateway Discord saat startup dan setelah koneksi ulang runtime. Setup multi-akun dengan penjadwalan startup bertahap dapat memerlukan jendela READY startup yang lebih panjang daripada default.

    Knob timeout READY:

    - startup akun tunggal: `channels.discord.gatewayReadyTimeoutMs`
    - startup multi-akun: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env startup saat konfigurasi tidak disetel: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - default startup: `15000` (15 detik), maks: `120000`
    - runtime akun tunggal: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-akun: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env runtime saat konfigurasi tidak disetel: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - default runtime: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Pemeriksaan izin `channels status --probe` hanya berfungsi untuk ID channel numerik.

    Jika Anda menggunakan kunci slug, pencocokan runtime masih dapat berfungsi, tetapi probe tidak dapat memverifikasi izin sepenuhnya.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - menunggu persetujuan pairing dalam mode `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Secara default, pesan yang dibuat bot diabaikan.

    Jika Anda menetapkan `channels.discord.allowBots=true`, gunakan aturan mention dan daftar izin yang ketat untuk menghindari perilaku loop.
    Lebih baik gunakan `channels.discord.allowBots="mentions"` agar hanya menerima pesan bot yang menyebut bot tersebut.

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

  <Accordion title="Voice STT terputus dengan DecryptionFailed(...)">

    - jaga OpenClaw tetap terbaru (`openclaw update`) agar logika pemulihan penerimaan suara Discord tersedia
    - konfirmasi `channels.discord.voice.daveEncryption=true` (default)
    - mulai dari `channels.discord.voice.decryptionFailureTolerance=24` (default upstream) dan sesuaikan hanya jika diperlukan
    - pantau log untuk:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jika kegagalan berlanjut setelah bergabung ulang otomatis, kumpulkan log dan bandingkan dengan riwayat penerimaan DAVE upstream di [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) dan [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Discord](/id/gateway/config-channels#discord).

<Accordion title="Bidang Discord bernilai sinyal tinggi">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- kebijakan: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- perintah: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- antrean peristiwa: `eventQueue.listenerTimeout` (anggaran listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
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

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` lebih disukai di lingkungan yang diawasi).
- Berikan izin Discord dengan hak akses minimum.
- Jika deploy/status perintah sudah usang, mulai ulang Gateway dan periksa lagi dengan `openclaw channels status --probe`.

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Discord ke Gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku chat grup dan daftar izin.
  </Card>
  <Card title="Perutean channel" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan penguatan.
  </Card>
  <Card title="Perutean multi-agen" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan guild dan channel ke agen.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native.
  </Card>
</CardGroup>
