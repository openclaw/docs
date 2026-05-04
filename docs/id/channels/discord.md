---
read_when:
    - Mengerjakan fitur saluran Discord
summary: Status dukungan, kemampuan, dan konfigurasi bot Discord
title: Discord
x-i18n:
    generated_at: "2026-05-04T02:21:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: df4e045e39f8977f779fe409abf41dad0d950c92f1230c51ff356343513df812
    source_path: channels/discord.md
    workflow: 16
---

Siap untuk DM dan saluran guild melalui Discord gateway resmi.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    DM Discord secara default berada dalam mode pemasangan.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah saluran" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas saluran dan alur perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

Anda perlu membuat aplikasi baru dengan bot, menambahkan bot ke server Anda, dan memasangkannya ke OpenClaw. Kami menyarankan untuk menambahkan bot Anda ke server pribadi Anda sendiri. Jika Anda belum memilikinya, [buat terlebih dahulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (pilih **Create My Own > For me and my friends**).

<Steps>
  <Step title="Buat aplikasi dan bot Discord">
    Buka [Discord Developer Portal](https://discord.com/developers/applications) dan klik **New Application**. Beri nama seperti "OpenClaw".

    Klik **Bot** di sidebar. Atur **Username** ke nama apa pun yang Anda gunakan untuk agen OpenClaw Anda.

  </Step>

  <Step title="Aktifkan intent istimewa">
    Masih di halaman **Bot**, gulir ke bawah ke **Privileged Gateway Intents** dan aktifkan:

    - **Message Content Intent** (wajib)
    - **Server Members Intent** (disarankan; wajib untuk allowlist peran dan pencocokan nama-ke-ID)
    - **Presence Intent** (opsional; hanya diperlukan untuk pembaruan presence)

  </Step>

  <Step title="Salin token bot Anda">
    Gulir kembali ke atas di halaman **Bot** dan klik **Reset Token**.

    <Note>
    Meskipun namanya demikian, ini menghasilkan token pertama Anda — tidak ada yang benar-benar "direset."
    </Note>

    Salin token dan simpan di suatu tempat. Ini adalah **Bot Token** Anda dan Anda akan membutuhkannya sebentar lagi.

  </Step>

  <Step title="Buat URL undangan dan tambahkan bot ke server Anda">
    Klik **OAuth2** di sidebar. Anda akan membuat URL undangan dengan izin yang tepat untuk menambahkan bot ke server Anda.

    Gulir ke bawah ke **OAuth2 URL Generator** dan aktifkan:

    - `bot`
    - `applications.commands`

    Bagian **Bot Permissions** akan muncul di bawahnya. Aktifkan setidaknya:

    **General Permissions**
      - Lihat Saluran
    **Text Permissions**
      - Kirim Pesan
      - Baca Riwayat Pesan
      - Sematkan Tautan
      - Lampirkan File
      - Tambahkan Reaksi (opsional)

    Ini adalah set dasar untuk saluran teks normal. Jika Anda berencana memposting di thread Discord, termasuk alur kerja saluran forum atau media yang membuat atau melanjutkan thread, aktifkan juga **Send Messages in Threads**.
    Salin URL yang dibuat di bagian bawah, tempelkan ke browser Anda, pilih server Anda, dan klik **Continue** untuk menghubungkan. Anda sekarang seharusnya melihat bot Anda di server Discord.

  </Step>

  <Step title="Aktifkan Developer Mode dan kumpulkan ID Anda">
    Kembali di aplikasi Discord, Anda perlu mengaktifkan Developer Mode agar dapat menyalin ID internal.

    1. Klik **User Settings** (ikon roda gigi di sebelah avatar Anda) → **Advanced** → aktifkan **Developer Mode**
    2. Klik kanan **ikon server** Anda di sidebar → **Copy Server ID**
    3. Klik kanan **avatar Anda sendiri** → **Copy User ID**

    Simpan **Server ID** dan **User ID** Anda bersama Bot Token — Anda akan mengirim ketiganya ke OpenClaw pada langkah berikutnya.

  </Step>

  <Step title="Izinkan DM dari anggota server">
    Agar pemasangan berfungsi, Discord perlu mengizinkan bot Anda mengirim DM kepada Anda. Klik kanan **ikon server** Anda → **Privacy Settings** → aktifkan **Direct Messages**.

    Ini memungkinkan anggota server (termasuk bot) mengirim DM kepada Anda. Biarkan ini aktif jika Anda ingin menggunakan DM Discord dengan OpenClaw. Jika Anda hanya berencana menggunakan saluran guild, Anda dapat menonaktifkan DM setelah pemasangan.

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

    Jika OpenClaw sudah berjalan sebagai layanan latar belakang, mulai ulang melalui aplikasi OpenClaw Mac atau dengan menghentikan lalu memulai ulang proses `openclaw gateway run`.
    Untuk instalasi layanan terkelola, jalankan `openclaw gateway install` dari shell tempat `DISCORD_BOT_TOKEN` tersedia, atau simpan variabel di `~/.openclaw/.env`, agar layanan dapat menyelesaikan SecretRef env setelah mulai ulang.
    Jika host Anda diblokir atau dibatasi laju oleh lookup aplikasi startup Discord, atur ID aplikasi/klien Discord dari Developer Portal agar startup dapat melewati panggilan REST tersebut. Gunakan `channels.discord.applicationId` untuk akun default, atau `channels.discord.accounts.<accountId>.applicationId` saat Anda menjalankan beberapa bot Discord.

  </Step>

  <Step title="Konfigurasikan OpenClaw dan pasangkan">

    <Tabs>
      <Tab title="Minta agen Anda">
        Chat dengan agen OpenClaw Anda di saluran yang sudah ada (misalnya Telegram) dan beri tahu agen tersebut. Jika Discord adalah saluran pertama Anda, gunakan tab CLI / config sebagai gantinya.

        > "Saya sudah mengatur token bot Discord saya di config. Tolong selesaikan penyiapan Discord dengan User ID `<user_id>` dan Server ID `<server_id>`."
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

        Untuk penyiapan skrip atau jarak jauh, tulis blok JSON5 yang sama dengan `openclaw config patch --file ./discord.patch.json5 --dry-run` lalu jalankan ulang tanpa `--dry-run`. Nilai `token` plaintext didukung. Nilai SecretRef juga didukung untuk `channels.discord.token` di seluruh penyedia env/file/exec. Lihat [Manajemen Rahasia](/id/gateway/secrets).

        Untuk beberapa bot Discord, simpan setiap token bot dan ID aplikasi di bawah akunnya masing-masing. `channels.discord.applicationId` tingkat atas diwariskan oleh akun, jadi hanya atur di sana ketika setiap akun harus menggunakan ID aplikasi yang sama.

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
    Tunggu hingga gateway berjalan, lalu kirim DM ke bot Anda di Discord. Bot akan membalas dengan kode pemasangan.

    <Tabs>
      <Tab title="Minta agen Anda">
        Kirim kode pemasangan ke agen Anda di saluran yang sudah ada:

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

    Anda sekarang seharusnya dapat chat dengan agen Anda di Discord melalui DM.

  </Step>
</Steps>

<Note>
Resolusi token bersifat sadar akun. Nilai token config menang atas fallback env. `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Jika dua akun Discord yang diaktifkan diselesaikan ke token bot yang sama, OpenClaw hanya memulai satu monitor gateway untuk token tersebut. Token bersumber config menang atas fallback env default; jika tidak, akun aktif pertama menang dan akun duplikat dilaporkan dinonaktifkan.
Untuk panggilan keluar tingkat lanjut (alat pesan/tindakan saluran), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk tindakan kirim dan baca/probe-style (misalnya baca/cari/ambil/thread/pin/izin). Pengaturan kebijakan akun/coba ulang tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Disarankan: Siapkan ruang kerja guild

Setelah DM berfungsi, Anda dapat menyiapkan server Discord Anda sebagai ruang kerja penuh tempat setiap saluran mendapatkan sesi agennya sendiri dengan konteksnya sendiri. Ini disarankan untuk server pribadi tempat hanya ada Anda dan bot Anda.

<Steps>
  <Step title="Tambahkan server Anda ke allowlist guild">
    Ini memungkinkan agen Anda merespons di saluran mana pun di server Anda, bukan hanya DM.

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
    Secara default, agen Anda hanya merespons di saluran guild saat di-@mention. Untuk server pribadi, Anda mungkin ingin agen merespons setiap pesan.

    Di saluran guild, balasan final asisten normal tetap privat secara default. Output Discord yang terlihat harus dikirim secara eksplisit dengan alat `message`, sehingga agen dapat mengamati secara default dan hanya memposting saat memutuskan bahwa balasan saluran berguna.

    Ini berarti model yang dipilih harus memanggil alat dengan andal. Jika Discord menampilkan typing dan log menunjukkan penggunaan token tetapi tidak ada pesan yang diposting, periksa log sesi untuk teks asisten dengan `didSendViaMessagingTool: false`. Itu berarti model menghasilkan jawaban final privat alih-alih memanggil `message(action=send)`. Beralih ke model pemanggil alat yang lebih kuat, atau gunakan config di bawah untuk memulihkan balasan final otomatis legacy.

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

        Untuk memulihkan balasan final otomatis legacy untuk ruang grup/saluran, atur `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Rencanakan memori di saluran guild">
    Secara default, memori jangka panjang (MEMORY.md) hanya dimuat di sesi DM. Saluran guild tidak memuat MEMORY.md secara otomatis.

    <Tabs>
      <Tab title="Minta agen Anda">
        > "Saat saya mengajukan pertanyaan di saluran Discord, gunakan memory_search atau memory_get jika Anda memerlukan konteks jangka panjang dari MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Jika Anda memerlukan konteks bersama di setiap saluran, masukkan instruksi stabil di `AGENTS.md` atau `USER.md` (keduanya diinjeksi untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan dengan alat memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat beberapa saluran di server Discord Anda dan mulai chat. Agen Anda dapat melihat nama saluran, dan setiap saluran mendapatkan sesi terisolasinya sendiri — jadi Anda dapat menyiapkan `#coding`, `#home`, `#research`, atau apa pun yang sesuai dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan masuk Discord kembali ke Discord.
- Metadata guild/kanal Discord ditambahkan ke prompt model sebagai konteks tidak tepercaya, bukan sebagai prefiks balasan yang terlihat oleh pengguna. Jika model menyalin envelope itu kembali, OpenClaw menghapus metadata yang disalin dari balasan keluar dan dari konteks pemutaran ulang berikutnya.
- Secara default (`session.dmScope=main`), chat langsung berbagi sesi utama agen (`agent:main:main`).
- Kanal guild adalah kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- DM grup diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Perintah slash native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.
- Pengiriman pengumuman cron/heartbeat khusus teks ke Discord menggunakan jawaban akhir yang terlihat oleh asisten satu kali. Payload media dan komponen terstruktur tetap berupa beberapa pesan ketika agen menghasilkan beberapa payload yang dapat dikirim.

## Kanal forum

Kanal forum dan media Discord hanya menerima postingan thread. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke induk forum (`channel:<forumId>`) untuk membuat thread secara otomatis. Judul thread menggunakan baris tidak kosong pertama dari pesan Anda.
- Gunakan `openclaw message thread create` untuk membuat thread secara langsung. Jangan berikan `--message-id` untuk kanal forum.

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

OpenClaw mendukung kontainer komponen Discord v2 untuk pesan agen. Gunakan alat pesan dengan payload `components`. Hasil interaksi dirutekan kembali ke agen sebagai pesan masuk normal dan mengikuti pengaturan Discord `replyToMode` yang ada.

Blok yang didukung:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Baris aksi memungkinkan hingga 5 tombol atau satu menu pilihan
- Jenis pilihan: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya sekali pakai. Atur `components.reusable=true` untuk mengizinkan tombol, pilihan, dan formulir digunakan beberapa kali hingga kedaluwarsa.

Untuk membatasi siapa yang dapat mengeklik tombol, atur `allowedUsers` pada tombol tersebut (ID pengguna Discord, tag, atau `*`). Jika dikonfigurasi, pengguna yang tidak cocok menerima penolakan ephemeral.

Perintah slash `/model` dan `/models` membuka pemilih model interaktif dengan dropdown penyedia, model, dan runtime yang kompatibel, plus langkah Submit. `/models add` sudah tidak digunakan dan sekarang mengembalikan pesan penghentian penggunaan alih-alih mendaftarkan model dari chat. Balasan pemilih bersifat ephemeral dan hanya pengguna yang memanggilnya yang dapat menggunakannya.

Lampiran file:

- Blok `file` harus menunjuk ke referensi lampiran (`attachment://<filename>`)
- Berikan lampiran melalui `media`/`path`/`filePath` (satu file); gunakan `media-gallery` untuk beberapa file
- Gunakan `filename` untuk menimpa nama unggahan ketika harus cocok dengan referensi lampiran

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

    Jika kebijakan DM tidak terbuka, pengguna tidak dikenal diblokir (atau diminta melakukan pairing dalam mode `pairing`).

    Prioritas multi-akun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Untuk satu akun, `allowFrom` memiliki prioritas atas `dm.allowFrom` lama.
    - Akun bernama mewarisi `channels.discord.allowFrom` ketika `allowFrom` miliknya sendiri dan `dm.allowFrom` lama tidak diatur.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` dan `channels.discord.dm.allowFrom` lama masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` ketika dapat melakukannya tanpa mengubah akses.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - mention `<@id>`

    ID numerik polos biasanya diselesaikan sebagai ID kanal ketika default kanal aktif, tetapi ID yang tercantum dalam DM `allowFrom` efektif akun diperlakukan sebagai target DM pengguna untuk kompatibilitas.

  </Tab>

  <Tab title="DM access groups">
    DM Discord dapat menggunakan entri `accessGroup:<name>` dinamis di `channels.discord.allowFrom`.

    Nama grup akses dibagikan di seluruh kanal pesan. Gunakan `type: "message.senders"` untuk grup statis yang anggotanya dinyatakan dalam sintaks `allowFrom` normal masing-masing kanal, atau `type: "discord.channelAudience"` ketika audiens `ViewChannel` saat ini dari kanal Discord harus menentukan keanggotaan secara dinamis. Perilaku grup akses bersama didokumentasikan di sini: [Grup akses](/id/channels/access-groups).

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

    Kanal teks Discord tidak memiliki daftar anggota terpisah. `type: "discord.channelAudience"` memodelkan keanggotaan sebagai: pengirim DM adalah anggota guild yang dikonfigurasi dan saat ini memiliki izin `ViewChannel` efektif pada kanal yang dikonfigurasi setelah role dan penimpaan kanal diterapkan.

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

    Lookup gagal tertutup. Jika Discord mengembalikan `Missing Access`, lookup anggota gagal, atau kanal milik guild yang berbeda, pengirim DM diperlakukan sebagai tidak berwenang.

    Aktifkan **Server Members Intent** di Discord Developer Portal untuk bot saat menggunakan grup akses audiens kanal. DM tidak menyertakan status anggota guild, sehingga OpenClaw menyelesaikan anggota melalui Discord REST pada waktu otorisasi.

  </Tab>

  <Tab title="Guild policy">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman ketika `channels.discord` ada adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` disarankan, slug diterima)
    - allowlist pengirim opsional: `users` (ID stabil disarankan) dan `roles` (hanya ID role); jika salah satunya dikonfigurasi, pengirim diizinkan ketika cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag langsung dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memperingatkan ketika entri nama/tag digunakan
    - jika guild memiliki `channels` yang dikonfigurasi, kanal yang tidak tercantum ditolak
    - jika guild tidak memiliki blok `channels`, semua kanal dalam guild yang masuk allowlist tersebut diizinkan

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
    Pesan guild secara default dibatasi oleh mention.

    Deteksi mention mencakup:

    - mention bot eksplisit
    - pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku balas-ke-bot implisit dalam kasus yang didukung

    Saat menulis pesan Discord keluar, gunakan sintaks mention kanonis: `<@USER_ID>` untuk pengguna, `<#CHANNEL_ID>` untuk kanal, dan `<@&ROLE_ID>` untuk role. Jangan gunakan bentuk mention nama panggilan lama `<@!USER_ID>`.

    `requireMention` dikonfigurasi per guild/kanal (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional menjatuhkan pesan yang menyebut pengguna/role lain tetapi bukan bot (tidak termasuk @everyone/@here).

    DM grup:

    - default: diabaikan (`dm.groupEnabled=false`)
    - allowlist opsional melalui `dm.groupChannels` (ID kanal atau slug)

  </Tab>
</Tabs>

### Perutean agen berbasis role

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agen berbeda berdasarkan ID role. Binding berbasis role hanya menerima ID role dan dievaluasi setelah binding peer atau parent-peer dan sebelum binding khusus guild. Jika binding juga menetapkan bidang pencocokan lain (misalnya `peer` + `guildId` + `roles`), semua bidang yang dikonfigurasi harus cocok.

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

- `commands.native` bawaan ke `"auto"` dan diaktifkan untuk Discord.
- Override per-channel: `channels.discord.commands.native`.
- `commands.native=false` melewati pendaftaran dan pembersihan slash-command Discord selama startup. Perintah yang sebelumnya terdaftar mungkin tetap terlihat di Discord sampai Anda menghapusnya dari aplikasi Discord.
- Autentikasi perintah native menggunakan allowlist/kebijakan Discord yang sama seperti penanganan pesan normal.
- Perintah mungkin tetap terlihat di UI Discord untuk pengguna yang tidak berwenang; eksekusi tetap menerapkan autentikasi OpenClaw dan mengembalikan "not authorized".

Lihat [Perintah slash](/id/tools/slash-commands) untuk katalog dan perilaku perintah.

Pengaturan perintah slash bawaan:

- `ephemeral: true`

## Detail fitur

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord mendukung tag balasan dalam output agen:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Dikontrol oleh `channels.discord.replyToMode`:

    - `off` (bawaan)
    - `first`
    - `all`
    - `batched`

    Catatan: `off` menonaktifkan threading balasan implisit. Tag eksplisit `[[reply_to_*]]` tetap dihormati.
    `first` selalu melampirkan referensi balasan native implisit ke pesan Discord keluar pertama untuk giliran tersebut.
    `batched` hanya melampirkan referensi balasan native implisit Discord ketika
    giliran masuk adalah batch beberapa pesan yang di-debounce. Ini berguna
    ketika Anda menginginkan balasan native terutama untuk chat beruntun yang ambigu, bukan setiap
    giliran satu pesan.

    ID pesan ditampilkan dalam konteks/riwayat agar agen dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw dapat melakukan streaming draf balasan dengan mengirim pesan sementara dan mengeditnya saat teks tiba. `channels.discord.streaming` menerima `off` (bawaan) | `partial` | `block` | `progress`. `progress` mempertahankan satu draf status yang dapat diedit dan memperbaruinya dengan progres alat sampai pengiriman final; `streamMode` adalah alias lama dan dimigrasikan otomatis.

    Bawaan tetap `off` karena pengeditan pratinjau Discord cepat terkena batas laju ketika beberapa bot atau Gateway berbagi akun.

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

    - `partial` mengedit satu pesan pratinjau saat token tiba.
    - `block` memancarkan potongan berukuran draf (gunakan `draftChunk` untuk menyesuaikan ukuran dan titik putus, dibatasi ke `textChunkLimit`).
    - Media, error, dan final balasan eksplisit membatalkan pengeditan pratinjau yang tertunda.
    - `streaming.preview.toolProgress` (bawaan `true`) mengontrol apakah pembaruan alat/progres menggunakan ulang pesan pratinjau.

    Streaming pratinjau hanya teks; balasan media kembali ke pengiriman normal. Ketika streaming `block` diaktifkan secara eksplisit, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Konteks riwayat guild:

    - `channels.discord.historyLimit` bawaan `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Kontrol riwayat DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Perilaku thread:

    - Thread Discord dirutekan sebagai sesi channel dan mewarisi konfigurasi channel induk kecuali dioverride.
    - Sesi thread mewarisi pilihan `/model` tingkat sesi channel induk sebagai fallback khusus model; pilihan `/model` lokal thread tetap didahulukan dan riwayat transkrip induk tidak disalin kecuali pewarisan transkrip diaktifkan.
    - `channels.discord.thread.inheritParent` (bawaan `false`) mengikutsertakan auto-thread baru untuk disemai dari transkrip induk. Override per-akun berada di bawah `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaksi alat pesan dapat menyelesaikan target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` dipertahankan selama fallback aktivasi tahap balasan.

    Topik channel diinjeksi sebagai konteks **tidak tepercaya**. Allowlist membatasi siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan penuh.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord dapat mengikat thread ke target sesi agar pesan lanjutan di thread tersebut tetap dirutekan ke sesi yang sama (termasuk sesi subagen).

    Perintah:

    - `/focus <target>` ikat thread saat ini/baru ke target subagen/sesi
    - `/unfocus` hapus binding thread saat ini
    - `/agents` tampilkan proses aktif dan status binding
    - `/session idle <duration|off>` periksa/perbarui auto-unfocus ketidakaktifan untuk binding yang difokuskan
    - `/session max-age <duration|off>` periksa/perbarui usia maksimum keras untuk binding yang difokuskan

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

    - `session.threadBindings.*` menetapkan bawaan global.
    - `channels.discord.threadBindings.*` mengoverride perilaku Discord.
    - `spawnSessions` mengontrol pembuatan/pengikatan otomatis thread untuk `sessions_spawn({ thread: true })` dan spawn thread ACP. Bawaan: `true`.
    - `defaultSpawnContext` mengontrol konteks subagen native untuk spawn yang terikat thread. Bawaan: `"fork"`.
    - Kunci `spawnSubagentSessions`/`spawnAcpSessions` yang tidak digunakan lagi dimigrasikan oleh `openclaw doctor --fix`.
    - Jika binding thread dinonaktifkan untuk sebuah akun, `/focus` dan operasi binding thread terkait tidak tersedia.

    Lihat [Sub-agen](/id/tools/subagents), [Agen ACP](/id/tools/acp-agents), dan [Referensi Konfigurasi](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Untuk workspace ACP "selalu aktif" yang stabil, konfigurasikan binding ACP bertipe tingkat atas yang menargetkan percakapan Discord.

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

    - `/acp spawn codex --bind here` mengikat channel atau thread saat ini di tempat dan mempertahankan pesan mendatang pada sesi ACP yang sama. Pesan thread mewarisi binding channel induk.
    - Dalam channel atau thread yang terikat, `/new` dan `/reset` mereset sesi ACP yang sama di tempat. Binding thread sementara dapat mengoverride resolusi target saat aktif.
    - `spawnSessions` membatasi pembuatan/pengikatan thread anak melalui `--thread auto|here`.

    Lihat [Agen ACP](/id/tools/acp-agents) untuk detail perilaku binding.

  </Accordion>

  <Accordion title="Reaction notifications">
    Mode notifikasi reaksi per-guild:

    - `off`
    - `own` (bawaan)
    - `all`
    - `allowlist` (menggunakan `guilds.<id>.users`)

    Peristiwa reaksi diubah menjadi peristiwa sistem dan dilampirkan ke sesi Discord yang dirutekan.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` mengirim emoji pengakuan saat OpenClaw memproses pesan masuk.

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
    Penulisan konfigurasi yang diinisiasi channel diaktifkan secara bawaan.

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

  <Accordion title="Gateway proxy">
    Rutekan lalu lintas WebSocket Gateway Discord dan pencarian REST startup (ID aplikasi + resolusi allowlist) melalui proxy HTTP(S) dengan `channels.discord.proxy`.

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
    Aktifkan resolusi PluralKit untuk memetakan pesan yang diproksi ke identitas anggota sistem:

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
    - pencarian menggunakan ID pesan asli dan dibatasi jendela waktu
    - jika pencarian gagal, pesan yang diproksi diperlakukan sebagai pesan bot dan dijatuhkan kecuali `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Gunakan `mentionAliases` ketika agen membutuhkan mention keluar deterministik untuk pengguna Discord yang dikenal. Kunci adalah handle tanpa awalan `@`; nilai adalah ID pengguna Discord. Handle yang tidak dikenal, `@everyone`, `@here`, dan mention di dalam rentang kode Markdown dibiarkan tidak berubah.

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

  <Accordion title="Presence configuration">
    Pembaruan presence diterapkan ketika Anda menetapkan kolom status atau aktivitas, atau ketika Anda mengaktifkan auto presence.

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

    Contoh aktivitas (status kustom adalah tipe aktivitas bawaan):

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

    Auto presence memetakan ketersediaan runtime ke status Discord: sehat => online, terdegradasi atau tidak diketahui => idle, habis atau tidak tersedia => dnd. Override teks opsional:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (mendukung placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord mendukung penanganan persetujuan berbasis tombol di DM dan secara opsional dapat memposting prompt persetujuan di channel asal.

    Jalur konfigurasi:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; beralih ke `commands.ownerAllowFrom` jika memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord mengaktifkan otomatis persetujuan exec native saat `enabled` tidak ditetapkan atau `"auto"` dan setidaknya satu pemberi persetujuan dapat diresolusikan, baik dari `execApprovals.approvers` maupun dari `commands.ownerAllowFrom`. Discord tidak menyimpulkan pemberi persetujuan exec dari channel `allowFrom`, `dm.allowFrom` lama, atau direct-message `defaultTo`. Tetapkan `enabled: false` untuk menonaktifkan Discord sebagai klien persetujuan native secara eksplisit.

    Untuk perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory`, OpenClaw mengirim prompt persetujuan dan hasil akhir secara privat. OpenClaw mencoba DM Discord terlebih dahulu saat pemilik yang memanggil memiliki rute pemilik Discord; jika tidak tersedia, OpenClaw beralih ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, seperti Telegram.

    Saat `target` adalah `channel` atau `both`, prompt persetujuan terlihat di channel. Hanya pemberi persetujuan yang sudah diresolusikan yang dapat menggunakan tombol; pengguna lain menerima penolakan ephemeral. Prompt persetujuan menyertakan teks perintah, jadi aktifkan pengiriman channel hanya di channel tepercaya. Jika ID channel tidak dapat diturunkan dari kunci sesi, OpenClaw beralih ke pengiriman DM.

    Discord juga merender tombol persetujuan bersama yang digunakan oleh channel chat lain. Adapter Discord native terutama menambahkan routing DM pemberi persetujuan dan fanout channel.
    Saat tombol tersebut tersedia, tombol itu adalah UX persetujuan utama; OpenClaw
    sebaiknya hanya menyertakan perintah `/approve` manual saat hasil tool menyatakan
    persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    Jika runtime persetujuan native Discord tidak aktif, OpenClaw tetap menampilkan
    prompt lokal deterministik `/approve <id> <decision>`. Jika
    runtime aktif tetapi kartu native tidak dapat dikirimkan ke target mana pun,
    OpenClaw mengirim pemberitahuan fallback dalam chat yang sama dengan perintah
    `/approve` persis dari persetujuan yang tertunda.

    Autentikasi Gateway dan resolusi persetujuan mengikuti kontrak klien Gateway bersama (ID `plugin:` diresolusikan melalui `plugin.approval.resolve`; ID lain melalui `exec.approval.resolve`). Persetujuan kedaluwarsa setelah 30 menit secara default.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tool dan gate tindakan

Tindakan pesan Discord mencakup tindakan pengiriman pesan, admin channel, moderasi, presence, dan metadata.

Contoh inti:

- pengiriman pesan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- presence: `setPresence`

Tindakan `event-create` menerima parameter `image` opsional (URL atau jalur file lokal) untuk menetapkan gambar sampul acara terjadwal.

Gate tindakan berada di bawah `channels.discord.actions.*`.

Perilaku gate default:

| Grup tindakan                                                                                                                                                            | Default     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | diaktifkan  |
| roles                                                                                                                                                                    | dinonaktifkan |
| moderation                                                                                                                                                               | dinonaktifkan |
| presence                                                                                                                                                                 | dinonaktifkan |

## UI Components v2

OpenClaw menggunakan Discord components v2 untuk persetujuan exec dan penanda lintas konteks. Tindakan pesan Discord juga dapat menerima `components` untuk UI kustom (lanjutan; memerlukan pembuatan payload komponen melalui tool discord), sementara `embeds` lama tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` menetapkan warna aksen yang digunakan oleh kontainer komponen Discord (hex).
- Tetapkan per akun dengan `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` diabaikan saat components v2 tersedia.

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

Discord memiliki dua permukaan suara yang berbeda: **voice channels** realtime (percakapan berkelanjutan) dan **lampiran pesan suara** (format pratinjau gelombang suara). Gateway mendukung keduanya.

### Voice channels

Daftar periksa penyiapan:

1. Aktifkan Message Content Intent di Discord Developer Portal.
2. Aktifkan Server Members Intent saat allowlist peran/pengguna digunakan.
3. Undang bot dengan cakupan `bot` dan `applications.commands`.
4. Berikan Connect, Speak, Send Messages, dan Read Message History di voice channel target.
5. Aktifkan perintah native (`commands.native` atau `channels.discord.commands.native`).
6. Konfigurasi `channels.discord.voice`.

Gunakan `/vc join|leave|status` untuk mengontrol sesi. Perintah menggunakan agen default akun dan mengikuti aturan allowlist serta kebijakan grup yang sama seperti perintah Discord lainnya.

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

- `voice.tts` menimpa `messages.tts` hanya untuk pemutaran suara.
- `voice.model` menimpa LLM yang digunakan hanya untuk respons voice channel Discord. Biarkan tidak ditetapkan untuk mewarisi model agen yang dirutekan.
- STT menggunakan `tools.media.audio`; `voice.model` tidak memengaruhi transkripsi.
- Override `systemPrompt` Discord per-channel berlaku untuk giliran transkrip suara bagi voice channel tersebut.
- Giliran transkrip suara menurunkan status pemilik dari `allowFrom` Discord (atau `dm.allowFrom`); pembicara non-pemilik tidak dapat mengakses tool khusus pemilik (misalnya `gateway` dan `cron`).
- Suara Discord bersifat opt-in untuk konfigurasi hanya-teks; tetapkan `channels.discord.voice.enabled=true` (atau pertahankan blok `channels.discord.voice` yang sudah ada) untuk mengaktifkan perintah `/vc`, runtime suara, dan intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` dapat secara eksplisit menimpa langganan intent voice-state. Biarkan tidak ditetapkan agar intent mengikuti pengaktifan suara efektif.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi join `@discordjs/voice`.
- Default `@discordjs/voice` adalah `daveEncryption=true` dan `decryptionFailureTolerance=24` jika tidak ditetapkan.
- `voice.connectTimeoutMs` mengontrol waktu tunggu awal Ready `@discordjs/voice` untuk `/vc join` dan percobaan auto-join. Default: `30000`.
- `voice.reconnectGraceMs` mengontrol berapa lama OpenClaw menunggu sesi suara yang terputus mulai menyambung ulang sebelum menghancurkannya. Default: `15000`.
- OpenClaw juga memantau kegagalan dekripsi penerimaan dan memulihkan otomatis dengan keluar/bergabung kembali ke voice channel setelah kegagalan berulang dalam jendela singkat.
- Jika log penerimaan berulang kali menampilkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` setelah pembaruan, kumpulkan laporan dependensi dan log. Baris `@discordjs/voice` yang dibundel menyertakan perbaikan padding upstream dari PR discord.js #11449, yang menutup isu discord.js #11419.

Pipeline voice channel:

- Tangkapan PCM Discord dikonversi menjadi file sementara WAV.
- `tools.media.audio` menangani STT, misalnya `openai/gpt-4o-mini-transcribe`.
- Transkrip dikirim melalui ingress dan routing Discord sementara LLM respons berjalan dengan kebijakan output suara yang menyembunyikan tool `tts` agen dan meminta teks yang dikembalikan, karena suara Discord memiliki pemutaran TTS akhir.
- `voice.model`, jika ditetapkan, hanya menimpa LLM respons untuk giliran voice-channel ini.
- `voice.tts` digabungkan di atas `messages.tts`; audio yang dihasilkan diputar di channel yang sudah digabungkan.

Kredensial diresolusikan per komponen: autentikasi rute LLM untuk `voice.model`, autentikasi STT untuk `tools.media.audio`, dan autentikasi TTS untuk `messages.tts`/`voice.tts`.

### Pesan suara

Pesan suara Discord menampilkan pratinjau gelombang suara dan memerlukan audio OGG/Opus. OpenClaw menghasilkan gelombang suara secara otomatis, tetapi memerlukan `ffmpeg` dan `ffprobe` pada host Gateway untuk memeriksa dan mengonversi.

- Berikan **jalur file lokal** (URL ditolak).
- Hilangkan konten teks (Discord menolak teks + pesan suara dalam payload yang sama).
- Format audio apa pun diterima; OpenClaw mengonversi ke OGG/Opus sesuai kebutuhan.

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

    Pemeriksaan berguna:

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

    Discord tidak menerapkan timeout milik channel pada giliran agen yang diantrekan. Listener pesan langsung menyerahkan pekerjaan, dan run Discord yang diantrekan mempertahankan urutan per-sesi sampai siklus hidup sesi/tool/runtime selesai atau membatalkan pekerjaan.

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
    OpenClaw mengambil metadata `/gateway/bot` Discord sebelum menyambung. Kegagalan sementara beralih ke URL gateway default Discord dan dibatasi lajunya dalam log.

    Knob timeout metadata:

    - akun tunggal: `channels.discord.gatewayInfoTimeoutMs`
    - multi-akun: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env saat konfigurasi tidak ditetapkan: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - default: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout dimulai ulang">
    OpenClaw menunggu peristiwa `READY` Gateway Discord saat startup dan setelah penyambungan ulang runtime. Penyiapan multi-akun dengan penjadwalan startup bertahap mungkin memerlukan jendela READY startup yang lebih panjang daripada bawaan.

    Pengaturan timeout READY:

    - startup akun tunggal: `channels.discord.gatewayReadyTimeoutMs`
    - startup multi-akun: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env startup saat config tidak diatur: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - bawaan startup: `15000` (15 detik), maks: `120000`
    - runtime akun tunggal: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-akun: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env runtime saat config tidak diatur: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - bawaan runtime: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Ketidakcocokan audit izin">
    Pemeriksaan izin `channels status --probe` hanya bekerja untuk ID saluran numerik.

    Jika Anda menggunakan kunci slug, pencocokan runtime masih dapat bekerja, tetapi probe tidak dapat sepenuhnya memverifikasi izin.

  </Accordion>

  <Accordion title="Masalah DM dan pemasangan">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - Kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - menunggu persetujuan pemasangan dalam mode `pairing`

  </Accordion>

  <Accordion title="Loop bot ke bot">
    Secara bawaan, pesan yang dibuat bot diabaikan.

    Jika Anda mengatur `channels.discord.allowBots=true`, gunakan aturan mention dan daftar izin yang ketat untuk menghindari perilaku loop.
    Lebih disarankan `channels.discord.allowBots="mentions"` agar hanya menerima pesan bot yang menyebut bot tersebut.

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

    - jaga OpenClaw tetap mutakhir (`openclaw update`) agar logika pemulihan penerimaan suara Discord tersedia
    - pastikan `channels.discord.voice.daveEncryption=true` (bawaan)
    - mulai dari `channels.discord.voice.decryptionFailureTolerance=24` (bawaan upstream) dan sesuaikan hanya jika diperlukan
    - pantau log untuk:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jika kegagalan berlanjut setelah bergabung ulang otomatis, kumpulkan log dan bandingkan dengan riwayat penerimaan DAVE upstream di [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) dan [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Discord](/id/gateway/config-channels#discord).

<Accordion title="Field Discord bersinyal tinggi">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- kebijakan: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- perintah: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- antrean peristiwa: `eventQueue.listenerTimeout` (anggaran listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- balasan/riwayat: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/coba lagi: `mediaMaxMb` (membatasi unggahan Discord keluar, bawaan `100MB`), `retry`
- tindakan: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- fitur: `threadBindings`, tingkat atas `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Keselamatan dan operasi

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` disarankan di lingkungan yang diawasi).
- Berikan izin Discord dengan hak paling sedikit.
- Jika deploy/state perintah sudah usang, mulai ulang Gateway dan periksa ulang dengan `openclaw channels status --probe`.

## Terkait

<CardGroup cols={2}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Discord ke Gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku obrolan grup dan daftar izin.
  </Card>
  <Card title="Perutean saluran" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan pengerasan.
  </Card>
  <Card title="Perutean multi-agen" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan guild dan saluran ke agen.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native.
  </Card>
</CardGroup>
