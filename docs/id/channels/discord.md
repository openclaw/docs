---
read_when:
    - Mengerjakan fitur saluran Discord
summary: Status dukungan, kapabilitas, dan konfigurasi bot Discord
title: Discord
x-i18n:
    generated_at: "2026-07-03T02:55:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e8724b02baa1a2dba1ac932e20533c9293b6021f30b1a79107349c34f195e5
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

Anda perlu membuat aplikasi baru dengan bot, menambahkan bot ke server Anda, dan memasangkannya ke OpenClaw. Kami menyarankan untuk menambahkan bot Anda ke server privat milik Anda sendiri. Jika Anda belum memilikinya, [buat terlebih dahulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (pilih **Create My Own > For me and my friends**).

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
    Gulir kembali ke atas di halaman **Bot** dan klik **Reset Token**.

    <Note>
    Terlepas dari namanya, ini menghasilkan token pertama Anda — tidak ada yang sedang "direset."
    </Note>

    Salin token tersebut dan simpan di suatu tempat. Ini adalah **Bot Token** Anda dan akan segera Anda perlukan.

  </Step>

  <Step title="Buat URL undangan dan tambahkan bot ke server Anda">
    Klik **OAuth2** di bilah samping. Anda akan membuat URL undangan dengan izin yang tepat untuk menambahkan bot ke server Anda.

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

    Ini adalah set dasar untuk kanal teks normal. Jika Anda berencana memposting di thread Discord, termasuk alur kerja kanal forum atau media yang membuat atau melanjutkan thread, aktifkan juga **Send Messages in Threads**.
    Salin URL yang dihasilkan di bagian bawah, tempelkan ke browser Anda, pilih server Anda, lalu klik **Continue** untuk menghubungkan. Anda sekarang seharusnya melihat bot Anda di server Discord.

  </Step>

  <Step title="Aktifkan Developer Mode dan kumpulkan ID Anda">
    Kembali di aplikasi Discord, Anda perlu mengaktifkan Developer Mode agar dapat menyalin ID internal.

    1. Klik **User Settings** (ikon roda gigi di sebelah avatar Anda) → Gulir ke **Developer** di bilah samping → aktifkan **Developer Mode**

        *(Catatan: Di aplikasi seluler Discord, Developer Mode berada di bawah **App Settings** → **Advanced**)*

    2. Klik kanan **ikon server** Anda di bilah samping → **Copy Server ID**
    3. Klik kanan **avatar Anda sendiri** → **Copy User ID**

    Simpan **Server ID** dan **User ID** Anda bersama Bot Token — Anda akan mengirim ketiganya ke OpenClaw pada langkah berikutnya.

  </Step>

  <Step title="Izinkan DM dari anggota server">
    Agar pemasangan berhasil, Discord perlu mengizinkan bot Anda mengirim DM kepada Anda. Klik kanan **ikon server** Anda → **Privacy Settings** → aktifkan **Direct Messages**.

    Ini memungkinkan anggota server (termasuk bot) mengirim DM kepada Anda. Tetap aktifkan ini jika Anda ingin menggunakan DM Discord dengan OpenClaw. Jika Anda hanya berencana menggunakan kanal guild, Anda dapat menonaktifkan DM setelah pemasangan.

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

    Jika OpenClaw sudah berjalan sebagai layanan latar belakang, mulai ulang melalui aplikasi Mac OpenClaw atau dengan menghentikan dan memulai ulang proses `openclaw gateway run`.
    Untuk instalasi layanan terkelola, jalankan `openclaw gateway install` dari shell tempat `DISCORD_BOT_TOKEN` tersedia, atau simpan variabel tersebut di `~/.openclaw/.env`, agar layanan dapat menyelesaikan SecretRef env setelah dimulai ulang.
    Jika host Anda diblokir atau dibatasi lajunya oleh lookup aplikasi saat startup Discord, atur ID aplikasi/klien Discord dari Developer Portal agar startup dapat melewati panggilan REST tersebut. Gunakan `channels.discord.applicationId` untuk akun default, atau `channels.discord.accounts.<accountId>.applicationId` saat Anda menjalankan beberapa bot Discord.

  </Step>

  <Step title="Konfigurasikan OpenClaw dan pasangkan">

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
        Chat dengan agen OpenClaw Anda di kanal yang sudah ada (misalnya Telegram) dan beri tahu agen tersebut. Jika Discord adalah kanal pertama Anda, gunakan tab CLI / config sebagai gantinya.

        > "Saya sudah mengatur token bot Discord saya di config. Selesaikan penyiapan Discord dengan User ID `<user_id>` dan Server ID `<server_id>`."
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

        Untuk penyiapan berskrip atau jarak jauh, tulis blok JSON5 yang sama dengan `openclaw config patch --file ./discord.patch.json5 --dry-run` lalu jalankan ulang tanpa `--dry-run`. Nilai `token` plaintext didukung. Nilai SecretRef juga didukung untuk `channels.discord.token` di seluruh penyedia env/file/exec. Lihat [Pengelolaan Rahasia](/id/gateway/secrets).

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
    Tunggu hingga Gateway berjalan, lalu DM bot Anda di Discord. Bot akan membalas dengan kode pemasangan.

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
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

    Anda sekarang seharusnya dapat chat dengan agen Anda di Discord melalui DM.

  </Step>
</Steps>

<Note>
Resolusi token sadar akun. Nilai token config mengungguli fallback env. `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Jika dua akun Discord yang aktif diselesaikan ke token bot yang sama, OpenClaw hanya memulai satu monitor Gateway untuk token tersebut. Token yang bersumber dari config mengungguli fallback env default; jika tidak, akun aktif pertama menang dan akun duplikat dilaporkan dinonaktifkan.
Untuk panggilan keluar lanjutan (alat pesan/tindakan kanal), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk tindakan kirim dan baca/probe (misalnya read/search/fetch/thread/pins/permissions). Kebijakan akun/pengaturan coba ulang tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Disarankan: Siapkan ruang kerja guild

Setelah DM berfungsi, Anda dapat menyiapkan server Discord Anda sebagai ruang kerja penuh tempat setiap kanal mendapatkan sesi agennya sendiri dengan konteksnya sendiri. Ini disarankan untuk server privat yang hanya berisi Anda dan bot Anda.

<Steps>
  <Step title="Tambahkan server Anda ke allowlist guild">
    Ini memungkinkan agen Anda merespons di kanal mana pun di server Anda, bukan hanya DM.

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
        > "Tambahkan Discord Server ID `<server_id>` saya ke allowlist guild"
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
    Secara default, agen Anda hanya merespons di kanal guild ketika @mentioned. Untuk server privat, Anda mungkin ingin agen merespons setiap pesan.

    Di kanal guild, balasan normal diposting secara otomatis secara default. Untuk ruang bersama yang selalu aktif, ikut serta ke `messages.groupChat.visibleReplies: "message_tool"` agar agen dapat mengamati diam-diam dan hanya memposting ketika agen memutuskan bahwa balasan kanal berguna. Ini bekerja paling baik dengan model generasi terbaru yang andal menggunakan alat, seperti GPT 5.5. Peristiwa ruang ambien tetap diam kecuali alat mengirim. Lihat [Peristiwa ruang ambien](/id/channels/ambient-room-events) untuk config mode mengamati lengkap.

    Jika Discord menampilkan sedang mengetik dan log menunjukkan penggunaan token tetapi tidak ada pesan yang diposting, periksa apakah turn dikonfigurasi sebagai peristiwa ruang ambien atau ikut serta ke balasan terlihat message-tool.

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
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

        Untuk mewajibkan pengiriman message-tool untuk balasan grup/kanal yang terlihat, atur `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Rencanakan memori di kanal guild">
    Secara default, memori jangka panjang (MEMORY.md) hanya dimuat di sesi DM. Kanal guild tidak otomatis memuat MEMORY.md.

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
        > "Saat saya mengajukan pertanyaan di kanal Discord, gunakan memory_search atau memory_get jika Anda membutuhkan konteks jangka panjang dari MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Jika Anda membutuhkan konteks bersama di setiap kanal, masukkan instruksi stabil ke `AGENTS.md` atau `USER.md` (keduanya diinjeksi untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan dengan alat memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat beberapa kanal di server Discord Anda dan mulai chat. Agen Anda dapat melihat nama kanal, dan setiap kanal mendapatkan sesinya sendiri yang terisolasi — sehingga Anda dapat menyiapkan `#coding`, `#home`, `#research`, atau apa pun yang cocok dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan masuk Discord kembali ke Discord.
- Metadata guild/saluran Discord ditambahkan ke prompt model sebagai konteks yang tidak tepercaya, bukan sebagai prefiks balasan yang terlihat pengguna. Jika model menyalin envelope itu kembali, OpenClaw menghapus metadata yang disalin dari balasan keluar dan dari konteks replay berikutnya.
- Secara default (`session.dmScope=main`), chat langsung berbagi sesi utama agen (`agent:main:main`).
- Saluran guild menggunakan kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- DM grup diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Perintah slash native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.
- Pengiriman pengumuman cron/heartbeat khusus teks ke Discord menggunakan jawaban akhir yang terlihat asisten satu kali. Payload media dan komponen terstruktur tetap berupa beberapa pesan ketika agen mengeluarkan beberapa payload yang dapat dikirim.

## Saluran forum

Saluran forum dan media Discord hanya menerima postingan thread. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke induk forum (`channel:<forumId>`) untuk membuat thread otomatis. Judul thread menggunakan baris pertama yang tidak kosong dari pesan Anda.
- Gunakan `openclaw message thread create` untuk membuat thread secara langsung. Jangan berikan `--message-id` untuk saluran forum.

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
- Baris tindakan mengizinkan hingga 5 tombol atau satu menu pilihan
- Jenis pilihan: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya sekali pakai. Atur `components.reusable=true` untuk mengizinkan tombol, pilihan, dan formulir digunakan beberapa kali hingga kedaluwarsa.

Untuk membatasi siapa yang dapat mengeklik tombol, atur `allowedUsers` pada tombol tersebut (ID pengguna Discord, tag, atau `*`). Saat dikonfigurasi, pengguna yang tidak cocok menerima penolakan ephemeral.

Callback komponen kedaluwarsa setelah 30 menit secara default. Atur `channels.discord.agentComponents.ttlMs` untuk mengubah masa pakai registri callback tersebut untuk akun Discord default, atau `channels.discord.accounts.<accountId>.agentComponents.ttlMs` untuk menimpa satu akun dalam setup multi-akun. Nilainya dalam milidetik, harus berupa bilangan bulat positif, dan dibatasi pada `86400000` (24 jam). TTL yang lebih panjang berguna untuk alur kerja review atau persetujuan yang membutuhkan tombol tetap dapat digunakan, tetapi juga memperpanjang jendela ketika pesan Discord lama masih dapat memicu tindakan. Pilih TTL tersingkat yang sesuai dengan alur kerja, dan pertahankan default ketika callback basi akan mengejutkan.

Perintah slash `/model` dan `/models` membuka pemilih model interaktif dengan dropdown provider, model, dan runtime kompatibel, ditambah langkah Submit. `/models add` sudah deprecated dan sekarang mengembalikan pesan deprecation alih-alih mendaftarkan model dari chat. Balasan pemilih bersifat ephemeral dan hanya pengguna yang memanggilnya yang dapat menggunakannya. Menu pilihan Discord dibatasi hingga 25 opsi, jadi tambahkan entri `provider/*` ke `agents.defaults.models` saat Anda ingin pemilih menampilkan model yang ditemukan secara dinamis hanya untuk provider yang dipilih seperti `openai` atau `vllm`.

Lampiran file:

- Blok `file` harus menunjuk ke referensi lampiran (`attachment://<filename>`)
- Sediakan lampiran melalui `media`/`path`/`filePath` (satu file); gunakan `media-gallery` untuk beberapa file
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
  <Tab title="Kebijakan DM">
    `channels.discord.dmPolicy` mengontrol akses DM. `channels.discord.allowFrom` adalah allowlist DM kanonis.

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.discord.allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    Jika kebijakan DM tidak terbuka, pengguna yang tidak dikenal diblokir (atau diminta pairing dalam mode `pairing`).

    Prioritas multi-akun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Untuk satu akun, `allowFrom` lebih diprioritaskan daripada `dm.allowFrom` legacy.
    - Akun bernama mewarisi `channels.discord.allowFrom` ketika `allowFrom` miliknya sendiri dan `dm.allowFrom` legacy tidak diatur.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` dan `channels.discord.dm.allowFrom` legacy masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` ketika dapat melakukannya tanpa mengubah akses.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - mention `<@id>`

    ID numerik polos biasanya diselesaikan sebagai ID saluran ketika default saluran aktif, tetapi ID yang tercantum dalam DM efektif `allowFrom` akun diperlakukan sebagai target DM pengguna untuk kompatibilitas.

  </Tab>

  <Tab title="Grup akses">
    DM Discord dan otorisasi perintah teks dapat menggunakan entri dinamis `accessGroup:<name>` di `channels.discord.allowFrom`.

    Nama grup akses dibagikan di seluruh saluran pesan. Gunakan `type: "message.senders"` untuk grup statis yang anggotanya dinyatakan dalam sintaks `allowFrom` normal setiap saluran, atau `type: "discord.channelAudience"` ketika audiens `ViewChannel` saat ini dari saluran Discord harus mendefinisikan keanggotaan secara dinamis. Perilaku grup akses bersama didokumentasikan di sini: [Grup akses](/id/channels/access-groups).

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

    Saluran teks Discord tidak memiliki daftar anggota terpisah. `type: "discord.channelAudience"` memodelkan keanggotaan sebagai: pengirim DM adalah anggota guild yang dikonfigurasi dan saat ini memiliki izin efektif `ViewChannel` pada saluran yang dikonfigurasi setelah role dan penimpaan saluran diterapkan.

    Contoh: izinkan siapa pun yang dapat melihat `#maintainers` untuk mengirim DM ke bot, sambil tetap menutup DM bagi semua orang lain.

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

    Lookup gagal tertutup. Jika Discord mengembalikan `Missing Access`, lookup anggota gagal, atau saluran dimiliki guild yang berbeda, pengirim DM diperlakukan sebagai tidak berwenang.

    Aktifkan **Server Members Intent** di Discord Developer Portal untuk bot saat menggunakan grup akses audiens saluran. DM tidak menyertakan status anggota guild, jadi OpenClaw menyelesaikan anggota melalui Discord REST pada waktu otorisasi.

  </Tab>

  <Tab title="Kebijakan guild">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman saat `channels.discord` ada adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` lebih disarankan, slug diterima)
    - allowlist pengirim opsional: `users` (ID stabil direkomendasikan) dan `roles` (hanya ID role); jika salah satu dikonfigurasi, pengirim diizinkan saat cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag langsung dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas break-glass
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memperingatkan saat entri nama/tag digunakan
    - jika guild memiliki `channels` yang dikonfigurasi, saluran yang tidak tercantum ditolak
    - jika guild tidak memiliki blok `channels`, semua saluran dalam guild yang di-allowlist tersebut diizinkan

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

  <Tab title="Mention dan DM grup">
    Pesan guild dibatasi oleh mention secara default.

    Deteksi mention mencakup:

    - mention bot eksplisit
    - pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku balas-ke-bot implisit dalam kasus yang didukung

    Saat menulis pesan Discord keluar, gunakan sintaks mention kanonis: `<@USER_ID>` untuk pengguna, `<#CHANNEL_ID>` untuk saluran, dan `<@&ROLE_ID>` untuk role. Jangan gunakan bentuk mention nama panggilan legacy `<@!USER_ID>`.

    `requireMention` dikonfigurasi per guild/saluran (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional membuang pesan yang menyebut pengguna/role lain tetapi bukan bot (tidak termasuk @everyone/@here).

    DM grup:

    - default: diabaikan (`dm.groupEnabled=false`)
    - allowlist opsional melalui `dm.groupChannels` (ID saluran atau slug)

  </Tab>
</Tabs>

### Perutean agen berbasis role

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agent berbeda berdasarkan ID peran. Binding berbasis peran hanya menerima ID peran dan dievaluasi setelah binding peer atau parent-peer dan sebelum binding khusus guild. Jika sebuah binding juga menetapkan kolom match lain (misalnya `peer` + `guildId` + `roles`), semua kolom yang dikonfigurasi harus cocok.

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

- `commands.native` default-nya `"auto"` dan diaktifkan untuk Discord.
- Override per channel: `channels.discord.commands.native`.
- `commands.native=false` melewati pendaftaran dan pembersihan perintah slash Discord saat startup. Perintah yang sebelumnya terdaftar mungkin tetap terlihat di Discord sampai Anda menghapusnya dari aplikasi Discord.
- Autentikasi perintah native menggunakan allowlist/kebijakan Discord yang sama seperti penanganan pesan normal.
- Perintah mungkin tetap terlihat di UI Discord bagi pengguna yang tidak diotorisasi; eksekusi tetap menerapkan autentikasi OpenClaw dan mengembalikan "tidak diotorisasi".

Lihat [Perintah slash](/id/tools/slash-commands) untuk katalog dan perilaku perintah.

Pengaturan perintah slash default:

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

    Catatan: `off` menonaktifkan threading balasan implisit. Tag eksplisit `[[reply_to_*]]` tetap dihormati.
    `first` selalu melampirkan referensi balasan native implisit ke pesan Discord keluar pertama untuk giliran tersebut.
    `batched` hanya melampirkan referensi balasan native implisit Discord ketika
    event masuk adalah batch yang didebounce dari beberapa pesan. Ini berguna
    saat Anda menginginkan balasan native terutama untuk chat bursty yang ambigu, bukan setiap
    giliran satu pesan.

    ID pesan ditampilkan di konteks/riwayat agar agent dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Pratinjau tautan">
    Discord membuat embed tautan kaya untuk URL secara default. OpenClaw menekan embed yang dihasilkan tersebut pada pesan Discord keluar secara default, sehingga URL yang dikirim agent tetap berupa tautan biasa kecuali Anda memilih untuk mengaktifkannya:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Tetapkan `channels.discord.accounts.<id>.suppressEmbeds` untuk meng-override satu akun. Pengiriman message-tool agent juga dapat meneruskan `suppressEmbeds: false` untuk satu pesan. Payload `embeds` Discord eksplisit tidak ditekan oleh pengaturan pratinjau tautan default.

  </Accordion>

  <Accordion title="Pratinjau stream langsung">
    OpenClaw dapat men-stream draf balasan dengan mengirim pesan sementara dan mengeditnya saat teks masuk. `channels.discord.streaming` menerima `off` | `partial` | `block` | `progress` (default). `progress` mempertahankan satu draf status yang dapat diedit dan memperbaruinya dengan progres tool sampai pengiriman final; label awal bersama adalah baris bergulir, sehingga akan tergulir keluar seperti sisanya setelah cukup banyak pekerjaan muncul. `streamMode` adalah alias runtime lama. Jalankan `openclaw doctor --fix` untuk menulis ulang config tersimpan ke key kanonis.

    Tetapkan `channels.discord.streaming.mode` ke `off` untuk menonaktifkan edit pratinjau Discord. Jika streaming block Discord diaktifkan secara eksplisit, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` mengedit satu pesan pratinjau saat token masuk.
    - `block` memancarkan chunk seukuran draf (gunakan `draftChunk` untuk menyetel ukuran dan breakpoint, dibatasi ke `textChunkLimit`).
    - Final media, error, dan balasan eksplisit membatalkan edit pratinjau yang tertunda.
    - `streaming.preview.toolProgress` (default `true`) mengontrol apakah pembaruan tool/progres menggunakan ulang pesan pratinjau.
    - Baris tool/progres dirender sebagai emoji ringkas + judul + detail jika tersedia, misalnya `🛠️ Bash: run tests` atau `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (default `false`) memilih untuk menyertakan teks komentar/preambul assistant dalam draf progres sementara. Komentar dibersihkan sebelum ditampilkan, tetap sementara, dan tidak mengubah pengiriman jawaban final.
    - `streaming.progress.maxLineChars` mengontrol anggaran pratinjau progres per baris. Prosa dipersingkat pada batas kata; detail perintah dan path mempertahankan sufiks yang berguna.
    - `streaming.preview.commandText` / `streaming.progress.commandText` mengontrol detail command/exec dalam baris progres ringkas: `raw` (default) atau `status` (hanya label tool).

    Sembunyikan teks command/exec mentah sambil mempertahankan baris progres ringkas:

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

    Streaming pratinjau hanya teks; balasan media fallback ke pengiriman normal. Ketika streaming `block` diaktifkan secara eksplisit, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

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

    - Thread Discord dirutekan sebagai sesi channel dan mewarisi config channel induk kecuali di-override.
    - Sesi thread mewarisi pilihan `/model` tingkat sesi milik channel induk sebagai fallback khusus model; pilihan `/model` lokal thread tetap diutamakan dan riwayat transkrip induk tidak disalin kecuali pewarisan transkrip diaktifkan.
    - `channels.discord.thread.inheritParent` (default `false`) memilih agar auto-thread baru disemai dari transkrip induk. Override per akun berada di bawah `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaksi message-tool dapat me-resolve target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` dipertahankan selama fallback aktivasi tahap balasan.

    Topik channel disisipkan sebagai konteks **tidak tepercaya**. Allowlist membatasi siapa yang dapat memicu agent, bukan batas redaksi konteks tambahan penuh.

  </Accordion>

  <Accordion title="Sesi terikat thread untuk subagent">
    Discord dapat mengikat thread ke target sesi sehingga pesan lanjutan di thread tersebut tetap dirutekan ke sesi yang sama (termasuk sesi subagent).

    Perintah:

    - `/focus <target>` ikat thread saat ini/baru ke target subagent/sesi
    - `/unfocus` hapus binding thread saat ini
    - `/agents` tampilkan run aktif dan status binding
    - `/session idle <duration|off>` periksa/perbarui auto-unfocus karena inaktivitas untuk binding yang difokuskan
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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Catatan:

    - `session.threadBindings.*` menetapkan default global.
    - `channels.discord.threadBindings.*` meng-override perilaku Discord.
    - `spawnSessions` mengontrol pembuatan/pengikatan thread otomatis untuk `sessions_spawn({ thread: true })` dan spawn thread ACP. Default: `true`.
    - `defaultSpawnContext` mengontrol konteks subagent native untuk spawn terikat thread. Default: `"fork"`.
    - Key `spawnSubagentSessions`/`spawnAcpSessions` yang sudah deprecated dimigrasikan oleh `openclaw doctor --fix`.
    - Jika binding thread dinonaktifkan untuk sebuah akun, `/focus` dan operasi binding thread terkait tidak tersedia.

    Lihat [Sub-agent](/id/tools/subagents), [Agent ACP](/id/tools/acp-agents), dan [Referensi Konfigurasi](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Binding channel ACP persisten">
    Untuk workspace ACP "always-on" yang stabil, konfigurasi binding ACP bertipe tingkat atas yang menargetkan percakapan Discord.

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

    - `/acp spawn codex --bind here` mengikat channel atau thread saat ini di tempat dan mempertahankan pesan mendatang pada sesi ACP yang sama. Pesan thread mewarisi binding channel induk.
    - Di channel atau thread yang terikat, `/new` dan `/reset` mereset sesi ACP yang sama di tempat. Binding thread sementara dapat meng-override resolusi target saat aktif.
    - `spawnSessions` membatasi pembuatan/pengikatan thread anak melalui `--thread auto|here`.

    Lihat [Agent ACP](/id/tools/acp-agents) untuk detail perilaku binding.

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
    `ackReaction` mengirim emoji pengakuan saat OpenClaw memproses pesan masuk.

    Urutan resolusi:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agent (`agents.list[].identity.emoji`, jika tidak ada "👀")

    Catatan:

    - Discord menerima emoji unicode atau nama emoji kustom.
    - Gunakan `""` untuk menonaktifkan reaksi bagi channel atau akun.

  </Accordion>

  <Accordion title="Penulisan config">
    Penulisan config yang diinisiasi channel diaktifkan secara default.

    Ini memengaruhi flow `/config set|unset` (ketika fitur perintah diaktifkan).

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
    Rutekan traffic WebSocket Gateway Discord dan lookup REST startup (ID aplikasi + resolusi allowlist) melalui proxy HTTP(S) dengan `channels.discord.proxy`.
    Proxying WebSocket Gateway Discord bersifat eksplisit; koneksi WebSocket tidak mewarisi variabel lingkungan proxy ambient dari proses Gateway. Lookup REST startup menggunakan proxy ini ketika `channels.discord.proxy` dikonfigurasi.

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

    - daftar izin dapat menggunakan `pk:<memberId>`
    - nama tampilan anggota dicocokkan berdasarkan nama/slug hanya ketika `channels.discord.dangerouslyAllowNameMatching: true`
    - pencarian menggunakan ID pesan asli dan dibatasi oleh jendela waktu
    - jika pencarian gagal, pesan terproksi diperlakukan sebagai pesan bot dan dibuang kecuali `allowBots=true`

  </Accordion>

  <Accordion title="Alias mention keluar">
    Gunakan `mentionAliases` ketika agen memerlukan mention keluar deterministik untuk pengguna Discord yang dikenal. Kunci adalah handle tanpa awalan `@`; nilai adalah ID pengguna Discord. Handle yang tidak dikenal, `@everyone`, `@here`, dan mention di dalam rentang kode Markdown dibiarkan tidak berubah.

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
    Pembaruan presence diterapkan ketika Anda menetapkan kolom status atau aktivitas, atau ketika Anda mengaktifkan presence otomatis.

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

    - 0: Bermain
    - 1: Streaming (memerlukan `activityUrl`)
    - 2: Mendengarkan
    - 3: Menonton
    - 4: Kustom (menggunakan teks aktivitas sebagai status state; emoji bersifat opsional)
    - 5: Bertanding

    Contoh presence otomatis (sinyal kesehatan runtime):

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

    Presence otomatis memetakan ketersediaan runtime ke status Discord: sehat => online, terdegradasi atau tidak diketahui => idle, habis atau tidak tersedia => dnd. Override teks opsional:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (mendukung placeholder `{reason}`)

  </Accordion>

  <Accordion title="Persetujuan di Discord">
    Discord mendukung penanganan persetujuan berbasis tombol di DM dan secara opsional dapat mengirim prompt persetujuan di saluran asal.

    Jalur konfigurasi:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; fallback ke `commands.ownerAllowFrom` jika memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord mengaktifkan persetujuan exec native secara otomatis ketika `enabled` tidak ditetapkan atau `"auto"` dan setidaknya satu pemberi persetujuan dapat di-resolve, baik dari `execApprovals.approvers` maupun dari `commands.ownerAllowFrom`. Discord tidak menyimpulkan pemberi persetujuan exec dari `allowFrom` saluran, `dm.allowFrom` legacy, atau `defaultTo` pesan langsung. Tetapkan `enabled: false` untuk menonaktifkan Discord sebagai klien persetujuan native secara eksplisit.

    Untuk perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory`, OpenClaw mengirim prompt persetujuan dan hasil akhir secara privat. Ini mencoba DM Discord terlebih dahulu ketika pemilik yang memanggil memiliki rute pemilik Discord; jika tidak tersedia, ini fallback ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, seperti Telegram.

    Ketika `target` adalah `channel` atau `both`, prompt persetujuan terlihat di saluran. Hanya pemberi persetujuan yang berhasil di-resolve yang dapat menggunakan tombol; pengguna lain menerima penolakan ephemeral. Prompt persetujuan menyertakan teks perintah, jadi aktifkan pengiriman saluran hanya di saluran tepercaya. Jika ID saluran tidak dapat diturunkan dari kunci sesi, OpenClaw fallback ke pengiriman DM.

    Discord juga merender tombol persetujuan bersama yang digunakan oleh saluran chat lain. Adapter native Discord terutama menambahkan perutean DM pemberi persetujuan dan fanout saluran.
    Ketika tombol tersebut tersedia, tombol itu adalah UX persetujuan utama; OpenClaw
    hanya boleh menyertakan perintah manual `/approve` ketika hasil alat menyatakan
    persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    Jika runtime persetujuan native Discord tidak aktif, OpenClaw mempertahankan
    prompt lokal deterministik `/approve <id> <decision>` tetap terlihat. Jika
    runtime aktif tetapi kartu native tidak dapat dikirimkan ke target mana pun,
    OpenClaw mengirim pemberitahuan fallback di chat yang sama dengan perintah `/approve`
    persis dari persetujuan yang tertunda.

    Autentikasi Gateway dan resolusi persetujuan mengikuti kontrak klien Gateway bersama (ID `plugin:` di-resolve melalui `plugin.approval.resolve`; ID lain melalui `exec.approval.resolve`). Persetujuan kedaluwarsa setelah 30 menit secara default.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Alat dan gerbang tindakan

Tindakan pesan Discord mencakup tindakan perpesanan, admin saluran, moderasi, presence, dan metadata.

Contoh inti:

- perpesanan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- presence: `setPresence`

Tindakan `event-create` menerima parameter `image` opsional (URL atau jalur file lokal) untuk menetapkan gambar sampul acara terjadwal.

Gerbang tindakan berada di bawah `channels.discord.actions.*`.

Perilaku gerbang default:

| Grup tindakan                                                                                                                                                            | Default    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reaksi, pesan, utas, pin, polling, pencarian, memberInfo, roleInfo, channelInfo, saluran, voiceStatus, acara, stiker, emojiUploads, stickerUploads, izin                  | diaktifkan |
| peran                                                                                                                                                                    | dinonaktifkan |
| moderasi                                                                                                                                                                 | dinonaktifkan |
| presence                                                                                                                                                                 | dinonaktifkan |

## UI komponen v2

OpenClaw menggunakan komponen Discord v2 untuk persetujuan exec dan penanda lintas konteks. Tindakan pesan Discord juga dapat menerima `components` untuk UI kustom (lanjutan; memerlukan pembuatan payload komponen melalui alat discord), sementara `embeds` legacy tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` menetapkan warna aksen yang digunakan oleh kontainer komponen Discord (hex).
- Tetapkan per akun dengan `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` mengontrol berapa lama callback komponen Discord yang dikirim tetap terdaftar (default `1800000`, maksimum `86400000`). Tetapkan per akun dengan `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` diabaikan ketika komponen v2 tersedia.
- Pratinjau URL polos ditekan secara default. Tetapkan `suppressEmbeds: false` pada tindakan pesan ketika satu tautan keluar harus diperluas.

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

Discord memiliki dua permukaan suara yang berbeda: **saluran suara** realtime (percakapan berkelanjutan) dan **lampiran pesan suara** (format pratinjau gelombang). Gateway mendukung keduanya.

### Saluran suara

Checklist penyiapan:

1. Aktifkan Message Content Intent di Discord Developer Portal.
2. Aktifkan Server Members Intent ketika daftar izin peran/pengguna digunakan.
3. Undang bot dengan cakupan `bot` dan `applications.commands`.
4. Berikan Connect, Speak, Send Messages, dan Read Message History di saluran suara target.
5. Aktifkan perintah native (`commands.native` atau `channels.discord.commands.native`).
6. Konfigurasi `channels.discord.voice`.

Gunakan `/vc join|leave|status` untuk mengontrol sesi. Perintah ini menggunakan agen default akun dan mengikuti aturan daftar izin serta kebijakan grup yang sama seperti perintah Discord lainnya.

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
        model: "openai/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
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
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Catatan:

- `voice.tts` menimpa `messages.tts` hanya untuk pemutaran suara `stt-tts`. Mode realtime menggunakan `voice.realtime.speakerVoice`.
- `voice.mode` mengontrol jalur percakapan. Defaultnya adalah `agent-proxy`: antarmuka depan suara realtime menangani waktu giliran, interupsi, dan pemutaran, mendelegasikan pekerjaan substantif ke agen OpenClaw yang dirutekan melalui `openclaw_agent_consult`, dan memperlakukan hasilnya seperti prompt Discord yang diketik dari pembicara tersebut. `stt-tts` mempertahankan alur lama STT batch plus TTS. `bidi` memungkinkan model realtime bercakap langsung sambil mengekspos `openclaw_agent_consult` untuk otak OpenClaw.
- `voice.agentSession` mengontrol percakapan OpenClaw mana yang menerima giliran suara. Biarkan tidak disetel untuk sesi milik kanal suara, atau setel `{ mode: "target", target: "channel:<text-channel-id>" }` agar kanal suara bertindak sebagai ekstensi mikrofon/speaker dari sesi kanal teks Discord yang sudah ada seperti `#maintainers`.
- `voice.model` menimpa otak agen OpenClaw untuk respons suara Discord dan konsultasi realtime. Biarkan tidak disetel untuk mewarisi model agen yang dirutekan. Ini terpisah dari `voice.realtime.model`.
- `voice.followUsers` memungkinkan bot bergabung, berpindah, dan keluar dari suara Discord bersama pengguna yang dipilih. Lihat [Ikuti pengguna dalam suara](#follow-users-in-voice) untuk aturan perilaku dan contoh.
- `agent-proxy` merutekan ucapan melalui `discord-voice`, yang mempertahankan otorisasi owner/tool normal untuk pembicara dan sesi target tetapi menyembunyikan tool `tts` agen karena suara Discord memiliki pemutaran. Secara default, `agent-proxy` memberi konsultasi akses tool penuh yang setara owner untuk pembicara owner (`voice.realtime.toolPolicy: "owner"`) dan sangat memprioritaskan konsultasi dengan agen OpenClaw sebelum jawaban substantif (`voice.realtime.consultPolicy: "always"`). Dalam mode default `always` itu, lapisan realtime tidak otomatis mengucapkan pengisi sebelum jawaban konsultasi; lapisan ini menangkap dan mentranskripsi ucapan, lalu mengucapkan jawaban OpenClaw yang dirutekan. Jika beberapa jawaban konsultasi paksa selesai saat Discord masih memutar jawaban pertama, jawaban ucapan persis berikutnya diantrekan sampai pemutaran idle, alih-alih mengganti ucapan di tengah kalimat.
- Dalam mode `stt-tts`, STT menggunakan `tools.media.audio`; `voice.model` tidak memengaruhi transkripsi.
- Dalam mode realtime, `voice.realtime.provider`, `voice.realtime.model`, dan `voice.realtime.speakerVoice` mengonfigurasi sesi audio realtime. Untuk OpenAI Realtime 2 plus otak Codex, gunakan `voice.realtime.model: "gpt-realtime-2"` dan `voice.model: "openai/gpt-5.5"`.
- Mode suara realtime menyertakan file profil kecil `IDENTITY.md`, `USER.md`, dan `SOUL.md` dalam instruksi penyedia realtime secara default sehingga giliran langsung yang cepat mempertahankan identitas, landasan pengguna, dan persona yang sama seperti agen OpenClaw yang dirutekan. Setel `voice.realtime.bootstrapContextFiles` ke subset untuk menyesuaikannya, atau `[]` untuk menonaktifkannya. File bootstrap realtime yang didukung terbatas pada file profil tersebut; `AGENTS.md` tetap berada dalam konteks agen normal. Konteks profil yang disisipkan tidak menggantikan `openclaw_agent_consult` untuk pekerjaan workspace, fakta terkini, pencarian memori, atau tindakan berbasis tool.
- Dalam mode realtime OpenAI `agent-proxy`, setel `voice.realtime.requireWakeName: true` agar suara realtime Discord tetap diam sampai transkrip dimulai atau diakhiri dengan nama bangun. Nama bangun yang dikonfigurasi harus satu atau dua kata. Jika `voice.realtime.wakeNames` tidak disetel, OpenClaw menggunakan `name` agen yang dirutekan plus `OpenClaw`, dengan fallback ke id agen plus `OpenClaw`. Pembatasan nama bangun menonaktifkan respons otomatis penyedia realtime, merutekan giliran yang diterima melalui jalur konsultasi agen OpenClaw, dan memberikan pengakuan lisan singkat ketika nama bangun di awal dikenali dari transkripsi parsial sebelum transkrip final tiba.
- Penyedia realtime OpenAI menerima nama peristiwa Realtime 2 saat ini dan alias lama yang kompatibel dengan Codex untuk peristiwa audio keluaran dan transkrip, sehingga snapshot penyedia yang kompatibel dapat bergeser tanpa menjatuhkan audio asisten.
- `voice.realtime.bargeIn` mengontrol apakah peristiwa mulai-berbicara Discord menginterupsi pemutaran realtime aktif. Jika tidak disetel, ini mengikuti pengaturan interupsi input-audio penyedia realtime.
- `voice.realtime.minBargeInAudioEndMs` mengontrol durasi minimum pemutaran asisten sebelum barge-in realtime OpenAI memotong audio. Default: `250`. Setel `0` untuk interupsi langsung di ruangan dengan gema rendah, atau naikkan untuk pengaturan speaker dengan gema berat.
- Untuk suara OpenAI pada pemutaran Discord, setel `voice.tts.provider: "openai"` dan pilih suara Text-to-speech di bawah `voice.tts.providers.openai.speakerVoice`. `cedar` adalah pilihan yang terdengar maskulin dan baik pada model TTS OpenAI saat ini.
- Penimpaan `systemPrompt` Discord per kanal berlaku untuk giliran transkrip suara pada kanal suara tersebut.
- Giliran transkrip suara menurunkan status owner dari `allowFrom` Discord (atau `dm.allowFrom`) untuk perintah berpagar owner dan tindakan kanal. Visibilitas tool agen mengikuti kebijakan tool yang dikonfigurasi untuk sesi yang dirutekan.
- Suara Discord bersifat opt-in untuk konfigurasi hanya teks; setel `channels.discord.voice.enabled=true` (atau pertahankan blok `channels.discord.voice` yang sudah ada) untuk mengaktifkan perintah `/vc`, runtime suara, dan intent gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` dapat secara eksplisit menimpa langganan intent voice-state. Biarkan tidak disetel agar intent mengikuti pengaktifan suara efektif.
- Jika `voice.autoJoin` memiliki beberapa entri untuk guild yang sama, OpenClaw bergabung ke kanal terakhir yang dikonfigurasi untuk guild tersebut.
- `voice.allowedChannels` adalah allowlist residensi opsional. Biarkan tidak disetel untuk mengizinkan `/vc join` ke kanal suara Discord resmi mana pun. Jika disetel, `/vc join`, auto-join saat startup, dan perpindahan voice-state bot dibatasi ke entri `{ guildId, channelId }` yang tercantum. Setel ke array kosong untuk menolak semua join suara Discord. Jika Discord memindahkan bot ke luar allowlist, OpenClaw meninggalkan kanal tersebut dan bergabung kembali ke target auto-join yang dikonfigurasi saat tersedia.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi join `@discordjs/voice`.
- Default `@discordjs/voice` adalah `daveEncryption=true` dan `decryptionFailureTolerance=24` jika tidak disetel.
- OpenClaw menggunakan codec `libopus-wasm` bawaan untuk penerimaan suara Discord dan pemutaran PCM mentah realtime. Ini mengirimkan build WebAssembly libopus yang dipin dan tidak memerlukan addon opus native.
- `voice.connectTimeoutMs` mengontrol penantian Ready awal `@discordjs/voice` untuk `/vc join` dan percobaan auto-join. Default: `30000`.
- `voice.reconnectGraceMs` mengontrol berapa lama OpenClaw menunggu sesi suara yang terputus mulai menyambung kembali sebelum menghancurkannya. Default: `15000`.
- Dalam mode `stt-tts`, pemutaran suara tidak berhenti hanya karena pengguna lain mulai berbicara. Untuk menghindari loop umpan balik, OpenClaw mengabaikan tangkapan suara baru saat TTS sedang diputar; berbicaralah setelah pemutaran selesai untuk giliran berikutnya. Mode realtime meneruskan mulai-berbicara sebagai sinyal barge-in ke penyedia realtime.
- Dalam mode realtime, gema dari speaker ke mikrofon terbuka dapat terlihat seperti barge-in dan menginterupsi pemutaran. Untuk ruangan Discord dengan gema berat, setel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` agar OpenAI tidak otomatis menginterupsi pada audio input. Tambahkan `voice.realtime.bargeIn: true` jika Anda tetap ingin peristiwa mulai-berbicara Discord menginterupsi pemutaran aktif. Bridge realtime OpenAI mengabaikan pemotongan pemutaran yang lebih pendek dari `voice.realtime.minBargeInAudioEndMs` sebagai kemungkinan gema/noise dan mencatatnya sebagai dilewati alih-alih menghapus pemutaran Discord.
- `voice.captureSilenceGraceMs` mengontrol berapa lama OpenClaw menunggu setelah Discord melaporkan pembicara telah berhenti sebelum memfinalisasi segmen audio tersebut untuk STT. Default: `2000`; naikkan ini jika Discord memecah jeda normal menjadi transkrip parsial yang tersendat.
- Saat ElevenLabs adalah penyedia TTS yang dipilih, pemutaran suara Discord menggunakan TTS streaming dan dimulai dari stream respons penyedia. Penyedia tanpa dukungan streaming kembali ke jalur temp-file yang disintesis.
- OpenClaw juga mengawasi kegagalan dekripsi penerimaan dan memulihkan otomatis dengan keluar/bergabung kembali ke kanal suara setelah kegagalan berulang dalam jendela singkat.
- Jika log penerimaan berulang kali menampilkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` setelah pembaruan, kumpulkan laporan dependensi dan log. Baris `@discordjs/voice` bawaan mencakup perbaikan padding upstream dari PR discord.js #11449, yang menutup issue discord.js #11419.
- Peristiwa penerimaan `The operation was aborted` diharapkan saat OpenClaw memfinalisasi segmen pembicara yang ditangkap; itu adalah diagnostik verbose, bukan peringatan.
- Log suara Discord verbose menyertakan pratinjau transkrip STT satu baris yang dibatasi untuk setiap segmen pembicara yang diterima, sehingga debugging menunjukkan sisi pengguna dan sisi balasan agen tanpa membuang teks transkrip tanpa batas.
- Dalam mode `agent-proxy`, fallback konsultasi paksa melewati fragmen transkrip yang kemungkinan belum lengkap seperti teks yang berakhir dengan `...` atau konektor akhir seperti `and`, plus penutup yang jelas tidak dapat ditindaklanjuti seperti “be right back” atau “bye”. Log menampilkan `forced agent consult skipped reason=...` saat ini mencegah jawaban antrean yang usang.

### Ikuti pengguna dalam suara

Gunakan `voice.followUsers` saat Anda ingin bot suara Discord tetap bersama satu atau beberapa pengguna Discord yang dikenal alih-alih bergabung ke kanal tetap saat startup atau menunggu `/vc join`.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

Perilaku:

- `followUsers` menerima ID pengguna Discord mentah dan nilai `discord:<id>`. OpenClaw menormalkan kedua bentuk sebelum mencocokkan peristiwa voice-state.
- `followUsersEnabled` default ke `true` saat `followUsers` dikonfigurasi. Setel ke `false` untuk mempertahankan daftar tersimpan tetapi menghentikan mengikuti suara otomatis.
- Saat pengguna yang diikuti bergabung ke kanal suara yang diizinkan, OpenClaw bergabung ke kanal tersebut. Saat pengguna berpindah, OpenClaw berpindah bersama mereka. Saat pengguna yang diikuti aktif terputus, OpenClaw keluar.
- Jika beberapa pengguna yang diikuti berada di guild yang sama dan pengguna yang diikuti aktif keluar, OpenClaw berpindah ke kanal pengguna lain yang diikuti dan dilacak sebelum meninggalkan guild. Jika beberapa pengguna yang diikuti berpindah sekaligus, peristiwa voice-state terbaru yang diamati menang.
- `allowedChannels` tetap berlaku. Pengguna yang diikuti di kanal yang tidak diizinkan diabaikan, dan sesi milik follow berpindah ke pengguna lain yang diikuti atau keluar.
- OpenClaw merekonsiliasi peristiwa voice-state yang terlewat saat startup dan pada interval terbatas. Rekonsiliasi mengambil sampel guild yang dikonfigurasi dan membatasi pencarian REST per proses, sehingga daftar `followUsers` yang sangat besar mungkin membutuhkan lebih dari satu interval untuk konvergen.
- Jika Discord atau admin memindahkan bot saat sedang mengikuti pengguna, OpenClaw membangun ulang sesi suara dan mempertahankan kepemilikan follow saat tujuan diizinkan. Jika bot dipindahkan ke luar `allowedChannels`, OpenClaw keluar dan bergabung kembali ke target yang dikonfigurasi saat ada.
- Pemulihan penerimaan DAVE dapat keluar dan bergabung kembali ke kanal yang sama setelah kegagalan dekripsi berulang. Sesi milik follow mempertahankan kepemilikan follow melalui jalur pemulihan tersebut, sehingga pemutusan pengguna yang diikuti berikutnya tetap meninggalkan kanal.

Pilih antara mode join:

- Gunakan `followUsers` untuk pengaturan personal atau operator ketika bot harus otomatis berada di suara saat Anda ada.
- Gunakan `autoJoin` untuk bot ruang tetap yang harus hadir bahkan saat tidak ada pengguna terlacak dalam suara.
- Gunakan `/vc join` untuk join sekali pakai atau ruangan ketika kehadiran suara otomatis akan mengejutkan.

Codec suara Discord:

- Log penerimaan suara menampilkan `discord voice: opus decoder: libopus-wasm`.
- Pemutaran realtime mengodekan PCM stereo mentah 48 kHz ke Opus dengan paket `libopus-wasm` bawaan yang sama sebelum menyerahkan paket ke `@discordjs/voice`.
- Pemutaran file dan stream penyedia mentranskode ke PCM stereo mentah 48 kHz dengan ffmpeg, lalu menggunakan `libopus-wasm` untuk stream paket Opus yang dikirim ke Discord.

Pipeline STT plus TTS:

- Tangkapan PCM Discord dikonversi menjadi file sementara WAV.
- `tools.media.audio` menangani STT, misalnya `openai/gpt-4o-mini-transcribe`.
- Transkrip dikirim melalui ingress dan perutean Discord sementara LLM respons berjalan dengan kebijakan keluaran suara yang menyembunyikan tool agen `tts` dan meminta teks yang dikembalikan, karena suara Discord memiliki pemutaran TTS akhir.
- `voice.model`, jika disetel, hanya menimpa LLM respons untuk giliran channel suara ini.
- `voice.tts` digabungkan di atas `messages.tts`; penyedia yang mendukung streaming langsung memasok pemutar, jika tidak, file audio yang dihasilkan diputar di channel yang telah dimasuki.

Contoh sesi channel suara agent-proxy bawaan:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Tanpa blok `voice.agentSession`, setiap channel suara mendapatkan sesi OpenClaw terute sendiri. Misalnya, `/vc join channel:234567890123456789` berbicara dengan sesi untuk channel suara Discord tersebut. Model realtime hanya menjadi front end suara; permintaan substantif diserahkan ke agen OpenClaw yang dikonfigurasi. Jika model realtime menghasilkan transkrip akhir tanpa memanggil tool konsultasi, OpenClaw memaksa konsultasi sebagai fallback agar bawaan tetap berperilaku seperti berbicara dengan agen.

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
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
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
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Suara sebagai ekstensi dari sesi channel Discord yang sudah ada:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Dalam mode `agent-proxy`, bot bergabung ke channel suara yang dikonfigurasi, tetapi giliran agen OpenClaw menggunakan sesi terute normal dan agen milik channel target. Sesi suara realtime mengucapkan kembali hasil yang dikembalikan ke channel suara. Agen supervisor masih dapat menggunakan tool pesan normal sesuai kebijakan tool-nya, termasuk mengirim pesan Discord terpisah jika itu tindakan yang tepat.

Saat run OpenClaw yang didelegasikan aktif, transkrip suara Discord baru diperlakukan sebagai kontrol run langsung sebelum memulai giliran agen lain. Frasa seperti "status", "cancel that", "use the smaller fix", atau "when you're done also check tests" diklasifikasikan sebagai status, pembatalan, pengarahan, atau masukan tindak lanjut untuk sesi aktif. Hasil status, pembatalan, pengarahan yang diterima, dan tindak lanjut diucapkan kembali ke channel suara agar pemanggil tahu apakah OpenClaw menangani permintaan tersebut.

Bentuk target yang berguna:

- `target: "channel:123456789012345678"` merutekan melalui sesi channel teks Discord.
- `target: "123456789012345678"` diperlakukan sebagai target channel.
- `target: "dm:123456789012345678"` atau `target: "user:123456789012345678"` merutekan melalui sesi pesan langsung tersebut.

Contoh OpenAI Realtime dengan echo berat:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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

Gunakan ini saat model mendengar pemutaran Discord-nya sendiri melalui mikrofon terbuka, tetapi Anda tetap ingin menyelanya dengan berbicara. OpenClaw mencegah OpenAI melakukan interupsi otomatis pada audio input mentah, sementara `bargeIn: true` memungkinkan peristiwa speaker-start Discord dan audio speaker yang sudah aktif membatalkan respons realtime aktif sebelum giliran tangkapan berikutnya mencapai OpenAI. Sinyal barge-in yang sangat awal dengan `audioEndMs` di bawah `minBargeInAudioEndMs` diperlakukan sebagai kemungkinan echo/noise dan diabaikan agar model tidak terpotong pada frame pemutaran pertama.

Log suara yang diharapkan:

- Saat bergabung: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Saat realtime dimulai: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Pada audio speaker: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, dan `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Pada ucapan usang yang dilewati: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` atau `reason=non-actionable-closing ...`
- Pada penyelesaian respons realtime: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Pada penghentian/reset pemutaran: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Pada konsultasi realtime: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Pada jawaban agen: `discord voice: agent turn answer ...`
- Pada ucapan persis yang diantrekan: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, diikuti oleh `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Pada deteksi barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` atau `discord voice: realtime barge-in detected source=active-speaker-audio ...`, diikuti oleh `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Pada interupsi realtime: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, diikuti oleh `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` atau `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Pada echo/noise yang diabaikan: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Pada barge-in yang dinonaktifkan: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Pada pemutaran idle: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Untuk men-debug audio yang terpotong, baca log suara realtime sebagai timeline:

1. `realtime audio playback started` berarti Discord telah mulai memutar audio asisten. Bridge mulai menghitung chunk keluaran asisten, byte PCM Discord, byte realtime penyedia, dan durasi audio tersintesis dari titik ini.
2. `realtime speaker turn opened` menandai speaker Discord menjadi aktif. Jika pemutaran sudah aktif dan `bargeIn` diaktifkan, ini dapat diikuti oleh `barge-in detected source=speaker-start`.
3. `realtime input audio started` menandai frame audio aktual pertama yang diterima untuk giliran speaker tersebut. `outputActive=true` atau `outputAudioMs` bukan nol di sini berarti mikrofon mengirim input saat pemutaran asisten masih aktif.
4. `barge-in detected source=active-speaker-audio` berarti OpenClaw melihat audio speaker langsung saat pemutaran asisten aktif. Ini berguna untuk membedakan interupsi nyata dari peristiwa speaker-start Discord tanpa audio yang berguna.
5. `barge-in requested reason=...` berarti OpenClaw meminta penyedia realtime untuk membatalkan atau memotong respons aktif. Ini menyertakan `outputAudioMs`, `outputActive`, dan `playbackChunks` sehingga Anda dapat melihat berapa banyak audio asisten yang benar-benar sudah diputar sebelum interupsi.
6. `realtime audio playback stopped reason=...` adalah titik reset pemutaran Discord lokal. Alasannya menyatakan siapa yang menghentikan pemutaran: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, atau `session-close`.
7. `realtime speaker turn closed` merangkum giliran input yang ditangkap. `chunks=0` atau `hasAudio=false` berarti giliran speaker terbuka tetapi tidak ada audio yang dapat digunakan mencapai bridge realtime. `interruptedPlayback=true` berarti giliran input tersebut tumpang tindih dengan keluaran asisten dan memicu logika barge-in.

Bidang yang berguna:

- `outputAudioMs`: durasi audio asisten yang dihasilkan oleh penyedia realtime sebelum baris log.
- `audioMs`: durasi audio asisten yang dihitung OpenClaw sebelum pemutaran berhenti.
- `elapsedMs`: waktu wall-clock antara pembukaan dan penutupan stream pemutaran atau giliran speaker.
- `discordBytes`: byte PCM stereo 48 kHz yang dikirim ke atau diterima dari suara Discord.
- `realtimeBytes`: byte PCM format penyedia yang dikirim ke atau diterima dari penyedia realtime.
- `playbackChunks`: chunk audio asisten yang diteruskan ke Discord untuk respons aktif.
- `sinceLastAudioMs`: jeda antara frame audio speaker terakhir yang ditangkap dan penutupan giliran speaker.

Pola umum:

- Pemotongan langsung dengan `source=active-speaker-audio`, `outputAudioMs` kecil, dan pengguna yang sama di dekatnya biasanya menunjukkan echo speaker masuk ke mikrofon. Naikkan `voice.realtime.minBargeInAudioEndMs`, kecilkan volume speaker, gunakan headphone, atau setel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` diikuti oleh `speaker turn closed ... hasAudio=false` berarti Discord melaporkan speaker mulai tetapi tidak ada audio yang mencapai OpenClaw. Itu bisa berupa peristiwa suara Discord sementara, perilaku noise gate, atau klien yang sebentar mengaktifkan mikrofon.
- `audio playback stopped reason=stream-close` tanpa barge-in terdekat atau `provider-clear-audio` berarti stream pemutaran Discord lokal berakhir secara tidak terduga. Periksa log penyedia dan pemutar Discord sebelumnya.
- `capture ignored during playback (barge-in disabled)` berarti OpenClaw sengaja membuang input saat audio asisten aktif. Aktifkan `voice.realtime.bargeIn` jika Anda ingin ucapan menyela pemutaran.
- `barge-in ignored ... outputActive=false` berarti Discord atau VAD penyedia melaporkan ucapan, tetapi OpenClaw tidak memiliki pemutaran aktif untuk disela. Ini seharusnya tidak memotong audio.

Kredensial diselesaikan per komponen: autentikasi rute LLM untuk `voice.model`, autentikasi STT untuk `tools.media.audio`, autentikasi TTS untuk `messages.tts`/`voice.tts`, dan autentikasi penyedia realtime untuk `voice.realtime.providers` atau konfigurasi autentikasi normal penyedia.

### Pesan suara

Pesan suara Discord menampilkan pratinjau waveform dan memerlukan audio OGG/Opus. OpenClaw menghasilkan waveform secara otomatis, tetapi membutuhkan `ffmpeg` dan `ffprobe` di host gateway untuk memeriksa dan mengonversi.

- Berikan **jalur berkas lokal** (URL ditolak).
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
    - verifikasi daftar izin guild di bawah `channels.discord.guilds`
    - jika peta `channels` guild ada, hanya kanal yang tercantum yang diizinkan
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

    - `groupPolicy="allowlist"` tanpa daftar izin guild/kanal yang cocok
    - `requireMention` dikonfigurasi di tempat yang salah (harus berada di bawah `channels.discord.guilds` atau entri kanal)
    - pengirim diblokir oleh daftar izin `users` guild/kanal

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Log umum:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Pengatur antrean Gateway Discord:

    - akun tunggal: `channels.discord.eventQueue.listenerTimeout`
    - multi-akun: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ini hanya mengontrol kerja listener Gateway Discord, bukan masa aktif giliran agen

    Discord tidak menerapkan timeout milik kanal pada giliran agen yang diantrekan. Listener pesan langsung menyerahkan pekerjaan, dan run Discord yang diantrekan mempertahankan pengurutan per sesi sampai siklus hidup sesi/alat/runtime menyelesaikan atau membatalkan pekerjaan.

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
    OpenClaw mengambil metadata `/gateway/bot` Discord sebelum terhubung. Kegagalan sementara menggunakan URL Gateway default Discord sebagai fallback dan dibatasi lajunya di log.

    Pengatur timeout metadata:

    - akun tunggal: `channels.discord.gatewayInfoTimeoutMs`
    - multi-akun: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env saat config belum diatur: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - default: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw menunggu event `READY` Gateway Discord selama startup dan setelah runtime terhubung ulang. Setup multi-akun dengan penjadwalan startup bertahap dapat memerlukan jendela READY startup yang lebih panjang daripada default.

    Pengatur timeout READY:

    - startup akun tunggal: `channels.discord.gatewayReadyTimeoutMs`
    - startup multi-akun: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env startup saat config belum diatur: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - default startup: `15000` (15 detik), maks: `120000`
    - runtime akun tunggal: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-akun: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env runtime saat config belum diatur: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - default runtime: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Pemeriksaan izin `channels status --probe` hanya berfungsi untuk ID kanal numerik.

    Jika Anda menggunakan kunci slug, pencocokan runtime masih dapat berfungsi, tetapi probe tidak dapat memverifikasi izin sepenuhnya.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - menunggu persetujuan pairing dalam mode `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Secara default, pesan yang ditulis bot diabaikan.

    Jika Anda mengatur `channels.discord.allowBots=true`, gunakan aturan mention dan daftar izin yang ketat untuk menghindari perilaku loop.
    Lebih baik gunakan `channels.discord.allowBots="mentions"` agar hanya menerima pesan bot yang me-mention bot tersebut.

    OpenClaw juga menyertakan [perlindungan loop bot](/id/channels/bot-loop-protection) bersama. Setiap kali `allowBots` membiarkan pesan yang ditulis bot mencapai dispatch, Discord memetakan event masuk ke fakta `(account, channel, bot pair)` dan guard pasangan generik menekan pasangan tersebut setelah melewati anggaran event yang dikonfigurasi. Guard ini mencegah loop dua bot yang tidak terkendali yang sebelumnya harus dihentikan oleh batas laju Discord; guard ini tidak memengaruhi deployment bot tunggal atau balasan bot sekali jalan yang tetap berada di bawah anggaran.

    Pengaturan default (aktif saat `allowBots` diatur):

    - `maxEventsPerWindow: 20` -- pasangan bot dapat bertukar 20 pesan dalam jendela geser
    - `windowSeconds: 60` -- panjang jendela geser
    - `cooldownSeconds: 60` -- setelah anggaran terlampaui, setiap pesan bot-ke-bot tambahan ke arah mana pun dibuang selama satu menit

    Konfigurasikan default bersama sekali di bawah `channels.defaults.botLoopProtection`, lalu timpa Discord saat workflow yang sah membutuhkan ruang lebih besar. Prioritasnya adalah:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - default bawaan

    Discord menggunakan kunci generik `maxEventsPerWindow`, `windowSeconds`, dan `cooldownSeconds`.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - pastikan OpenClaw tetap terbaru (`openclaw update`) agar logika pemulihan penerimaan suara Discord tersedia
    - konfirmasi `channels.discord.voice.daveEncryption=true` (default)
    - mulai dari `channels.discord.voice.decryptionFailureTolerance=24` (default upstream) dan sesuaikan hanya jika diperlukan
    - pantau log untuk:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jika kegagalan berlanjut setelah rejoin otomatis, kumpulkan log dan bandingkan dengan riwayat penerimaan DAVE upstream di [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) dan [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Discord](/id/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- kebijakan: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- perintah: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- antrean event: `eventQueue.listenerTimeout` (anggaran listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- balasan/riwayat: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/coba ulang: `mediaMaxMb` (membatasi unggahan Discord keluar, default `100MB`), `retry`
- tindakan: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- fitur: `threadBindings`, `bindings[]` tingkat atas (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Keamanan dan operasi

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` lebih disarankan di lingkungan yang diawasi).
- Berikan izin Discord dengan hak paling rendah.
- Jika deployment/status perintah sudah usang, mulai ulang Gateway dan periksa ulang dengan `openclaw channels status --probe`.

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Discord ke Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/id/channels/groups">
    Perilaku chat grup dan daftar izin.
  </Card>
  <Card title="Channel routing" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Security" icon="shield" href="/id/gateway/security">
    Model ancaman dan pengerasan.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan guild dan kanal ke agen.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native.
  </Card>
</CardGroup>
