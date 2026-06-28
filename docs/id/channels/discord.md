---
read_when:
    - Mengerjakan fitur kanal Discord
summary: Status, kemampuan, dan konfigurasi dukungan bot Discord
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:40:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

Siap untuk DM dan kanal guild melalui Gateway Discord resmi.

<CardGroup cols={3}>
  <Card title="Penyandingan" icon="link" href="/id/channels/pairing">
    DM Discord secara default menggunakan mode penyandingan.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah kanal" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas kanal dan alur perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

Anda perlu membuat aplikasi baru dengan bot, menambahkan bot ke server Anda, dan menyandingkannya ke OpenClaw. Kami menyarankan menambahkan bot Anda ke server privat Anda sendiri. Jika belum punya, [buat terlebih dahulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (pilih **Create My Own > For me and my friends**).

<Steps>
  <Step title="Buat aplikasi dan bot Discord">
    Buka [Discord Developer Portal](https://discord.com/developers/applications) dan klik **New Application**. Beri nama seperti "OpenClaw".

    Klik **Bot** di bilah sisi. Atur **Username** ke apa pun nama yang Anda gunakan untuk agen OpenClaw Anda.

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
    Terlepas dari namanya, ini membuat token pertama Anda — tidak ada yang sedang "direset."
    </Note>

    Salin token dan simpan di suatu tempat. Ini adalah **Bot Token** Anda dan akan segera Anda perlukan.

  </Step>

  <Step title="Buat URL undangan dan tambahkan bot ke server Anda">
    Klik **OAuth2** di bilah sisi. Anda akan membuat URL undangan dengan izin yang tepat untuk menambahkan bot ke server Anda.

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

  <Step title="Aktifkan Developer Mode dan kumpulkan ID Anda">
    Kembali di aplikasi Discord, Anda perlu mengaktifkan Developer Mode agar dapat menyalin ID internal.

    1. Klik **User Settings** (ikon roda gigi di sebelah avatar Anda) → gulir ke **Developer** di bilah sisi → aktifkan **Developer Mode**

        *(Catatan: Di aplikasi seluler Discord, Developer Mode berada di **App Settings** → **Advanced**)*

    2. Klik kanan **ikon server** Anda di bilah sisi → **Copy Server ID**
    3. Klik kanan **avatar Anda sendiri** → **Copy User ID**

    Simpan **Server ID** dan **User ID** Anda bersama Bot Token — Anda akan mengirim ketiganya ke OpenClaw pada langkah berikutnya.

  </Step>

  <Step title="Izinkan DM dari anggota server">
    Agar penyandingan berfungsi, Discord perlu mengizinkan bot Anda mengirim DM kepada Anda. Klik kanan **ikon server** Anda → **Privacy Settings** → aktifkan **Direct Messages**.

    Ini memungkinkan anggota server (termasuk bot) mengirim DM kepada Anda. Biarkan ini aktif jika Anda ingin menggunakan DM Discord dengan OpenClaw. Jika Anda hanya berencana menggunakan kanal guild, Anda dapat menonaktifkan DM setelah penyandingan.

  </Step>

  <Step title="Atur token bot Anda secara aman (jangan kirim di chat)">
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
    Untuk instalasi layanan terkelola, jalankan `openclaw gateway install` dari shell tempat `DISCORD_BOT_TOKEN` tersedia, atau simpan variabel di `~/.openclaw/.env`, agar layanan dapat menyelesaikan SecretRef env setelah mulai ulang.
    Jika host Anda diblokir atau dibatasi laju oleh pencarian aplikasi startup Discord, atur ID aplikasi/klien Discord dari Developer Portal agar startup dapat melewati panggilan REST tersebut. Gunakan `channels.discord.applicationId` untuk akun default, atau `channels.discord.accounts.<accountId>.applicationId` saat Anda menjalankan beberapa bot Discord.

  </Step>

  <Step title="Konfigurasikan OpenClaw dan sandingkan">

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
        Mengobrollah dengan agen OpenClaw Anda di kanal yang sudah ada (mis. Telegram) dan beri tahu. Jika Discord adalah kanal pertama Anda, gunakan tab CLI / config sebagai gantinya.

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

        Untuk penyiapan terskrip atau jarak jauh, tulis blok JSON5 yang sama dengan `openclaw config patch --file ./discord.patch.json5 --dry-run` lalu jalankan ulang tanpa `--dry-run`. Nilai plaintext `token` didukung. Nilai SecretRef juga didukung untuk `channels.discord.token` di seluruh penyedia env/file/exec. Lihat [Manajemen Rahasia](/id/gateway/secrets).

        Untuk beberapa bot Discord, simpan setiap token bot dan ID aplikasi di bawah akunnya. `channels.discord.applicationId` tingkat atas diwarisi oleh akun, jadi hanya atur di sana saat setiap akun harus menggunakan ID aplikasi yang sama.

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
    Tunggu hingga Gateway berjalan, lalu DM bot Anda di Discord. Bot akan merespons dengan kode penyandingan.

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
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

    Sekarang Anda seharusnya dapat mengobrol dengan agen Anda di Discord melalui DM.

  </Step>
</Steps>

<Note>
Resolusi token sadar akun. Nilai token config mengalahkan fallback env. `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Jika dua akun Discord yang diaktifkan menghasilkan token bot yang sama, OpenClaw hanya memulai satu pemantau Gateway untuk token tersebut. Token yang bersumber dari config mengalahkan fallback env default; jika tidak, akun aktif pertama menang dan akun duplikat dilaporkan dinonaktifkan.
Untuk panggilan keluar lanjutan (alat pesan/tindakan kanal), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk tindakan kirim dan baca/probe-style (misalnya read/search/fetch/thread/pins/permissions). Pengaturan kebijakan akun/coba ulang tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Disarankan: Siapkan ruang kerja guild

Setelah DM berfungsi, Anda dapat menyiapkan server Discord Anda sebagai ruang kerja penuh tempat setiap kanal mendapatkan sesi agennya sendiri dengan konteksnya sendiri. Ini disarankan untuk server privat yang hanya berisi Anda dan bot Anda.

<Steps>
  <Step title="Tambahkan server Anda ke allowlist guild">
    Ini memungkinkan agen Anda merespons di kanal mana pun di server Anda, bukan hanya DM.

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
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
    Secara default, agen Anda hanya merespons di kanal guild saat di-@mention. Untuk server privat, Anda mungkin ingin agen merespons setiap pesan.

    Di kanal guild, balasan normal diposting otomatis secara default. Untuk ruang bersama yang selalu aktif, ikut serta ke `messages.groupChat.visibleReplies: "message_tool"` agar agen dapat mengamati diam-diam dan hanya memposting saat memutuskan balasan kanal berguna. Ini bekerja paling baik dengan model generasi terbaru yang andal menggunakan alat, seperti GPT 5.5. Peristiwa ruangan ambient tetap senyap kecuali alat mengirim. Lihat [Peristiwa ruangan ambient](/id/channels/ambient-room-events) untuk config lengkap mode mengamati.

    Jika Discord menampilkan typing dan log menunjukkan penggunaan token tetapi tidak ada pesan yang diposting, periksa apakah turn dikonfigurasi sebagai peristiwa ruangan ambient atau ikut serta ke balasan terlihat message-tool.

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
    Secara default, memori jangka panjang (MEMORY.md) hanya dimuat dalam sesi DM. Kanal guild tidak memuat MEMORY.md secara otomatis.

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
        > "Saat saya mengajukan pertanyaan di kanal Discord, gunakan memory_search atau memory_get jika Anda memerlukan konteks jangka panjang dari MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Jika Anda memerlukan konteks bersama di setiap kanal, letakkan instruksi stabil di `AGENTS.md` atau `USER.md` (keduanya diinjeksikan untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan dengan alat memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat beberapa kanal di server Discord Anda dan mulai mengobrol. Agen Anda dapat melihat nama kanal, dan setiap kanal mendapatkan sesi terisolasinya sendiri — jadi Anda dapat menyiapkan `#coding`, `#home`, `#research`, atau apa pun yang sesuai dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan masuk Discord kembali ke Discord.
- Metadata guild/channel Discord ditambahkan ke prompt model sebagai konteks
  tidak tepercaya, bukan sebagai prefiks balasan yang terlihat oleh pengguna. Jika model menyalin amplop itu
  kembali, OpenClaw menghapus metadata yang disalin dari balasan keluar dan dari
  konteks pemutaran ulang berikutnya.
- Secara default (`session.dmScope=main`), obrolan langsung berbagi sesi utama agen (`agent:main:main`).
- Kanal guild adalah kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- DM grup diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Perintah slash native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.
- Pengiriman pengumuman cron/heartbeat hanya teks ke Discord menggunakan jawaban akhir
  yang terlihat oleh asisten satu kali. Payload media dan komponen terstruktur tetap
  berupa banyak pesan saat agen memancarkan beberapa payload yang dapat dikirim.

## Kanal forum

Kanal forum dan media Discord hanya menerima posting thread. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke induk forum (`channel:<forumId>`) untuk membuat thread otomatis. Judul thread menggunakan baris pertama yang tidak kosong dari pesan Anda.
- Gunakan `openclaw message thread create` untuk membuat thread secara langsung. Jangan teruskan `--message-id` untuk kanal forum.

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
- Baris tindakan mengizinkan hingga 5 tombol atau satu menu pilih
- Jenis pilih: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya sekali pakai. Atur `components.reusable=true` agar tombol, pilihan, dan formulir dapat digunakan beberapa kali sampai kedaluwarsa.

Untuk membatasi siapa yang dapat mengeklik tombol, atur `allowedUsers` pada tombol tersebut (ID pengguna Discord, tag, atau `*`). Saat dikonfigurasi, pengguna yang tidak cocok menerima penolakan ephemeral.

Callback komponen kedaluwarsa setelah 30 menit secara default. Atur `channels.discord.agentComponents.ttlMs` untuk mengubah masa hidup registri callback itu bagi akun Discord default, atau `channels.discord.accounts.<accountId>.agentComponents.ttlMs` untuk menimpa satu akun dalam penyiapan multi-akun. Nilainya dalam milidetik, harus berupa bilangan bulat positif, dan dibatasi pada `86400000` (24 jam). TTL yang lebih panjang berguna untuk alur kerja peninjauan atau persetujuan yang membutuhkan tombol tetap dapat digunakan, tetapi juga memperpanjang jendela tempat pesan Discord lama masih dapat memicu tindakan. Pilih TTL tersingkat yang sesuai dengan alur kerja, dan pertahankan default saat callback usang akan terasa mengejutkan.

Perintah slash `/model` dan `/models` membuka pemilih model interaktif dengan dropdown penyedia, model, dan runtime yang kompatibel, plus langkah Kirim. `/models add` sudah tidak digunakan dan sekarang mengembalikan pesan deprekasi alih-alih mendaftarkan model dari obrolan. Balasan pemilih bersifat ephemeral dan hanya pengguna yang memanggilnya yang dapat menggunakannya. Menu pilih Discord dibatasi hingga 25 opsi, jadi tambahkan entri `provider/*` ke `agents.defaults.models` saat Anda ingin pemilih hanya menampilkan model yang ditemukan secara dinamis untuk penyedia terpilih seperti `openai` atau `vllm`.

Lampiran file:

- Blok `file` harus menunjuk ke referensi lampiran (`attachment://<filename>`)
- Sediakan lampiran melalui `media`/`path`/`filePath` (satu file); gunakan `media-gallery` untuk beberapa file
- Gunakan `filename` untuk menimpa nama unggahan saat harus cocok dengan referensi lampiran

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
    - `open` (mewajibkan `channels.discord.allowFrom` menyertakan `"*"`)
    - `disabled`

    Jika kebijakan DM tidak terbuka, pengguna tidak dikenal diblokir (atau diminta melakukan pairing dalam mode `pairing`).

    Prioritas multi-akun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Untuk satu akun, `allowFrom` lebih diutamakan daripada `dm.allowFrom` lama.
    - Akun bernama mewarisi `channels.discord.allowFrom` saat `allowFrom` miliknya sendiri dan `dm.allowFrom` lama tidak disetel.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` dan `channels.discord.dm.allowFrom` lama masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` saat dapat melakukannya tanpa mengubah akses.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - mention `<@id>`

    ID numerik polos biasanya diselesaikan sebagai ID kanal saat default kanal aktif, tetapi ID yang tercantum dalam `allowFrom` DM efektif akun diperlakukan sebagai target DM pengguna untuk kompatibilitas.

  </Tab>

  <Tab title="Access groups">
    Otorisasi DM Discord dan perintah teks dapat menggunakan entri dinamis `accessGroup:<name>` di `channels.discord.allowFrom`.

    Nama grup akses dibagikan di seluruh kanal pesan. Gunakan `type: "message.senders"` untuk grup statis yang anggotanya dinyatakan dalam sintaks `allowFrom` normal tiap kanal, atau `type: "discord.channelAudience"` saat audiens `ViewChannel` saat ini milik kanal Discord harus menentukan keanggotaan secara dinamis. Perilaku grup akses bersama didokumentasikan di sini: [Grup akses](/id/channels/access-groups).

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

    Contoh: izinkan siapa pun yang dapat melihat `#maintainers` mengirim DM ke bot, sambil tetap menutup DM untuk semua orang lain.

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

    Pencarian gagal tertutup. Jika Discord mengembalikan `Missing Access`, pencarian anggota gagal, atau kanal milik guild berbeda, pengirim DM diperlakukan sebagai tidak berwenang.

    Aktifkan **Server Members Intent** di Discord Developer Portal untuk bot saat menggunakan grup akses audiens kanal. DM tidak menyertakan status anggota guild, jadi OpenClaw menyelesaikan anggota melalui REST Discord pada waktu otorisasi.

  </Tab>

  <Tab title="Guild policy">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman saat `channels.discord` ada adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` disarankan, slug diterima)
    - allowlist pengirim opsional: `users` (ID stabil direkomendasikan) dan `roles` (hanya ID role); jika salah satu dikonfigurasi, pengirim diizinkan saat cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag langsung dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memperingatkan saat entri nama/tag digunakan
    - jika guild memiliki `channels` yang dikonfigurasi, kanal yang tidak tercantum ditolak
    - jika guild tidak memiliki blok `channels`, semua kanal di guild yang masuk allowlist tersebut diizinkan

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

    Jika Anda hanya menyetel `DISCORD_BOT_TOKEN` dan tidak membuat blok `channels.discord`, fallback runtime adalah `groupPolicy="allowlist"` (dengan peringatan di log), bahkan jika `channels.defaults.groupPolicy` adalah `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Pesan guild dibatasi oleh mention secara default.

    Deteksi mention mencakup:

    - mention bot eksplisit
    - pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku balas-ke-bot implisit dalam kasus yang didukung

    Saat menulis pesan Discord keluar, gunakan sintaks mention kanonis: `<@USER_ID>` untuk pengguna, `<#CHANNEL_ID>` untuk kanal, dan `<@&ROLE_ID>` untuk role. Jangan gunakan bentuk mention nama panggilan lama `<@!USER_ID>`.

    `requireMention` dikonfigurasi per guild/kanal (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional membuang pesan yang menyebut pengguna/role lain tetapi bukan bot (tidak termasuk @everyone/@here).

    DM grup:

    - default: diabaikan (`dm.groupEnabled=false`)
    - allowlist opsional melalui `dm.groupChannels` (ID kanal atau slug)

  </Tab>
</Tabs>

### Perutean agen berbasis role

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agen yang berbeda berdasarkan ID peran. Binding berbasis peran hanya menerima ID peran dan dievaluasi setelah binding peer atau parent-peer dan sebelum binding khusus guild. Jika binding juga menetapkan kolom pencocokan lain (misalnya `peer` + `guildId` + `roles`), semua kolom yang dikonfigurasi harus cocok.

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

- `commands.native` bernilai default `"auto"` dan diaktifkan untuk Discord.
- Override per channel: `channels.discord.commands.native`.
- `commands.native=false` melewati pendaftaran dan pembersihan perintah slash Discord saat startup. Perintah yang sebelumnya didaftarkan mungkin tetap terlihat di Discord sampai Anda menghapusnya dari aplikasi Discord.
- Autentikasi perintah native menggunakan allowlist/kebijakan Discord yang sama seperti penanganan pesan normal.
- Perintah mungkin tetap terlihat di UI Discord untuk pengguna yang tidak diotorisasi; eksekusi tetap menerapkan autentikasi OpenClaw dan mengembalikan "tidak diotorisasi".

Lihat [Perintah slash](/id/tools/slash-commands) untuk katalog dan perilaku perintah.

Pengaturan perintah slash default:

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
    event masuk adalah batch yang di-debounce dari beberapa pesan. Ini berguna
    ketika Anda menginginkan balasan native terutama untuk obrolan bursty yang ambigu, bukan setiap
    giliran satu pesan.

    ID pesan dimunculkan dalam konteks/riwayat sehingga agen dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Pratinjau tautan">
    Discord membuat embed tautan kaya untuk URL secara default. OpenClaw menekan embed yang dibuat itu pada pesan Discord keluar secara default, sehingga URL yang dikirim agen tetap berupa tautan biasa kecuali Anda ikut mengaktifkannya:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Tetapkan `channels.discord.accounts.<id>.suppressEmbeds` untuk meng-override satu akun. Pengiriman message-tool agen juga dapat meneruskan `suppressEmbeds: false` untuk satu pesan. Payload `embeds` Discord eksplisit tidak ditekan oleh pengaturan pratinjau tautan default.

  </Accordion>

  <Accordion title="Pratinjau live stream">
    OpenClaw dapat melakukan stream draf balasan dengan mengirim pesan sementara dan mengeditnya saat teks tiba. `channels.discord.streaming` menerima `off` | `partial` | `block` | `progress` (default). `progress` mempertahankan satu draf status yang dapat diedit dan memperbaruinya dengan progres alat hingga pengiriman final; label awal bersama adalah baris yang bergulir, sehingga akan tergeser seperti yang lain setelah cukup banyak pekerjaan muncul. `streamMode` adalah alias runtime legacy. Jalankan `openclaw doctor --fix` untuk menulis ulang config tersimpan ke kunci kanonis.

    Tetapkan `channels.discord.streaming.mode` ke `off` untuk menonaktifkan edit pratinjau Discord. Jika streaming blok Discord diaktifkan secara eksplisit, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

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

    - `partial` mengedit satu pesan pratinjau saat token tiba.
    - `block` memancarkan chunk seukuran draf (gunakan `draftChunk` untuk menyetel ukuran dan breakpoint, dibatasi ke `textChunkLimit`).
    - Final media, error, dan balasan eksplisit membatalkan edit pratinjau yang tertunda.
    - `streaming.preview.toolProgress` (default `true`) mengontrol apakah pembaruan alat/progres menggunakan ulang pesan pratinjau.
    - Baris alat/progres dirender sebagai emoji ringkas + judul + detail saat tersedia, misalnya `🛠️ Bash: run tests` atau `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (default `false`) ikut mengaktifkan teks commentary/preamble asisten dalam draf progres sementara. Commentary dibersihkan sebelum ditampilkan, tetap sementara, dan tidak mengubah pengiriman jawaban final.
    - `streaming.progress.maxLineChars` mengontrol anggaran pratinjau progres per baris. Prosa dipersingkat pada batas kata; detail perintah dan path mempertahankan suffix yang berguna.
    - `streaming.preview.commandText` / `streaming.progress.commandText` mengontrol detail perintah/exec dalam baris progres ringkas: `raw` (default) atau `status` (hanya label alat).

    Sembunyikan teks perintah/exec mentah sambil tetap mempertahankan baris progres ringkas:

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
    - Sesi thread mewarisi pilihan `/model` tingkat sesi milik channel induk sebagai fallback khusus model; pilihan `/model` lokal thread tetap didahulukan dan riwayat transkrip induk tidak disalin kecuali pewarisan transkrip diaktifkan.
    - `channels.discord.thread.inheritParent` (default `false`) mengikutsertakan auto-thread baru untuk disemai dari transkrip induk. Override per akun berada di bawah `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaksi message-tool dapat menyelesaikan target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` dipertahankan selama fallback aktivasi tahap balasan.

    Topik channel disuntikkan sebagai konteks **tidak tepercaya**. Allowlists mengatur siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan penuh.

  </Accordion>

  <Accordion title="Sesi terikat thread untuk subagen">
    Discord dapat mengikat thread ke target sesi sehingga pesan lanjutan di thread tersebut tetap dirutekan ke sesi yang sama (termasuk sesi subagen).

    Perintah:

    - `/focus <target>` ikat thread saat ini/baru ke target subagen/sesi
    - `/unfocus` hapus binding thread saat ini
    - `/agents` tampilkan run aktif dan status binding
    - `/session idle <duration|off>` inspeksi/perbarui auto-unfocus inaktivitas untuk binding yang difokuskan
    - `/session max-age <duration|off>` inspeksi/perbarui usia maksimum keras untuk binding yang difokuskan

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
    - `defaultSpawnContext` mengontrol konteks subagen native untuk spawn terikat thread. Default: `"fork"`.
    - Kunci `spawnSubagentSessions`/`spawnAcpSessions` yang deprecated dimigrasikan oleh `openclaw doctor --fix`.
    - Jika binding thread dinonaktifkan untuk sebuah akun, `/focus` dan operasi binding thread terkait tidak tersedia.

    Lihat [Sub-agen](/id/tools/subagents), [Agen ACP](/id/tools/acp-agents), dan [Referensi Konfigurasi](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Binding channel ACP persisten">
    Untuk workspace ACP "always-on" yang stabil, konfigurasikan binding ACP bertipe tingkat atas yang menargetkan percakapan Discord.

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

    - `/acp spawn codex --bind here` mengikat channel atau thread saat ini di tempat dan mempertahankan pesan berikutnya pada sesi ACP yang sama. Pesan thread mewarisi binding channel induk.
    - Di channel atau thread yang terikat, `/new` dan `/reset` mereset sesi ACP yang sama di tempat. Binding thread sementara dapat meng-override resolusi target saat aktif.
    - `spawnSessions` mengatur pembuatan/pengikatan thread anak melalui `--thread auto|here`.

    Lihat [Agen ACP](/id/tools/acp-agents) untuk detail perilaku binding.

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
    `ackReaction` mengirim emoji acknowledgement saat OpenClaw memproses pesan masuk.

    Urutan resolusi:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada "👀")

    Catatan:

    - Discord menerima emoji unicode atau nama emoji kustom.
    - Gunakan `""` untuk menonaktifkan reaksi bagi channel atau akun.

  </Accordion>

  <Accordion title="Penulisan config">
    Penulisan config yang diinisiasi channel diaktifkan secara default.

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
    - pencarian menggunakan ID pesan asli dan dibatasi oleh jendela waktu
    - jika pencarian gagal, pesan yang diproksi diperlakukan sebagai pesan bot dan dibuang kecuali `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Gunakan `mentionAliases` ketika agen memerlukan mention keluar yang deterministik untuk pengguna Discord yang sudah dikenal. Kunci adalah handle tanpa awalan `@`; nilai adalah ID pengguna Discord. Handle yang tidak dikenal, `@everyone`, `@here`, dan mention di dalam code span Markdown dibiarkan tidak berubah.

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
    - 4: Kustom (menggunakan teks aktivitas sebagai status state; emoji bersifat opsional)
    - 5: Bertanding

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
    Discord mendukung penanganan persetujuan berbasis tombol di DM dan secara opsional dapat mengirim prompt persetujuan di kanal asal.

    Jalur konfigurasi:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; kembali ke `commands.ownerAllowFrom` jika memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, bawaan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord mengaktifkan persetujuan exec native secara otomatis ketika `enabled` tidak diatur atau `"auto"` dan setidaknya satu pemberi persetujuan dapat diresolusikan, baik dari `execApprovals.approvers` maupun dari `commands.ownerAllowFrom`. Discord tidak menyimpulkan pemberi persetujuan exec dari kanal `allowFrom`, `dm.allowFrom` lama, atau direct-message `defaultTo`. Tetapkan `enabled: false` untuk menonaktifkan Discord sebagai klien persetujuan native secara eksplisit.

    Untuk perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory`, OpenClaw mengirim prompt persetujuan dan hasil akhir secara privat. OpenClaw mencoba DM Discord terlebih dahulu ketika pemilik yang memanggil memiliki rute pemilik Discord; jika tidak tersedia, OpenClaw kembali ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, seperti Telegram.

    Ketika `target` adalah `channel` atau `both`, prompt persetujuan terlihat di kanal. Hanya pemberi persetujuan yang teresolusikan yang dapat menggunakan tombol; pengguna lain menerima penolakan ephemeral. Prompt persetujuan menyertakan teks perintah, jadi aktifkan pengiriman kanal hanya di kanal tepercaya. Jika ID kanal tidak dapat diturunkan dari kunci sesi, OpenClaw kembali ke pengiriman DM.

    Discord juga merender tombol persetujuan bersama yang digunakan oleh kanal obrolan lain. Adapter Discord native terutama menambahkan perutean DM pemberi persetujuan dan fanout kanal.
    Ketika tombol tersebut ada, tombol itu menjadi UX persetujuan utama; OpenClaw
    sebaiknya hanya menyertakan perintah manual `/approve` ketika hasil alat menyatakan
    persetujuan obrolan tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    Jika runtime persetujuan native Discord tidak aktif, OpenClaw mempertahankan
    prompt deterministik lokal `/approve <id> <decision>` tetap terlihat. Jika
    runtime aktif tetapi kartu native tidak dapat dikirim ke target mana pun,
    OpenClaw mengirim pemberitahuan fallback di obrolan yang sama dengan perintah
    `/approve` persis dari persetujuan tertunda.

    Autentikasi Gateway dan resolusi persetujuan mengikuti kontrak klien Gateway bersama (ID `plugin:` diresolusikan melalui `plugin.approval.resolve`; ID lain melalui `exec.approval.resolve`). Persetujuan kedaluwarsa setelah 30 menit secara bawaan.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Alat dan gate tindakan

Tindakan pesan Discord mencakup perpesanan, admin kanal, moderasi, presence, dan tindakan metadata.

Contoh inti:

- perpesanan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- presence: `setPresence`

Tindakan `event-create` menerima parameter opsional `image` (URL atau jalur file lokal) untuk menetapkan gambar sampul acara terjadwal.

Gate tindakan berada di bawah `channels.discord.actions.*`.

Perilaku gate bawaan:

| Grup tindakan                                                                                                                                                            | Bawaan       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | diaktifkan   |
| roles                                                                                                                                                                    | dinonaktifkan |
| moderation                                                                                                                                                               | dinonaktifkan |
| presence                                                                                                                                                                 | dinonaktifkan |

## UI Components v2

OpenClaw menggunakan components v2 Discord untuk persetujuan exec dan penanda lintas-konteks. Tindakan pesan Discord juga dapat menerima `components` untuk UI kustom (lanjutan; memerlukan penyusunan payload komponen melalui alat discord), sementara `embeds` lama tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` menetapkan warna aksen yang digunakan oleh kontainer komponen Discord (hex).
- Tetapkan per akun dengan `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` mengontrol berapa lama callback komponen Discord yang dikirim tetap terdaftar (bawaan `1800000`, maksimum `86400000`). Tetapkan per akun dengan `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` diabaikan ketika components v2 ada.
- Pratinjau URL biasa ditekan secara bawaan. Tetapkan `suppressEmbeds: false` pada tindakan pesan ketika satu tautan keluar harus diperluas.

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

Discord memiliki dua surface suara yang berbeda: **kanal suara** realtime (percakapan berkelanjutan) dan **lampiran pesan suara** (format pratinjau waveform). Gateway mendukung keduanya.

### Kanal suara

Checklist penyiapan:

1. Aktifkan Message Content Intent di Discord Developer Portal.
2. Aktifkan Server Members Intent ketika allowlist peran/pengguna digunakan.
3. Undang bot dengan scope `bot` dan `applications.commands`.
4. Berikan izin Connect, Speak, Send Messages, dan Read Message History di kanal suara target.
5. Aktifkan perintah native (`commands.native` atau `channels.discord.commands.native`).
6. Konfigurasikan `channels.discord.voice`.

Gunakan `/vc join|leave|status` untuk mengontrol sesi. Perintah ini menggunakan agen bawaan akun dan mengikuti aturan allowlist serta kebijakan grup yang sama seperti perintah Discord lainnya.

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

- `voice.tts` mengesampingkan `messages.tts` hanya untuk pemutaran suara `stt-tts`. Mode realtime menggunakan `voice.realtime.speakerVoice`.
- `voice.mode` mengontrol jalur percakapan. Default-nya adalah `agent-proxy`: front end suara realtime menangani pengaturan waktu giliran, interupsi, dan pemutaran, mendelegasikan pekerjaan substantif ke agent OpenClaw yang dirutekan melalui `openclaw_agent_consult`, dan memperlakukan hasilnya seperti prompt Discord yang diketik dari pembicara tersebut. `stt-tts` mempertahankan alur batch STT plus TTS yang lebih lama. `bidi` memungkinkan model realtime bercakap langsung sekaligus mengekspos `openclaw_agent_consult` untuk otak OpenClaw.
- `voice.agentSession` mengontrol percakapan OpenClaw mana yang menerima giliran suara. Biarkan tidak disetel untuk sesi milik channel suara itu sendiri, atau setel `{ mode: "target", target: "channel:<text-channel-id>" }` agar channel suara bertindak sebagai ekstensi mikrofon/speaker dari sesi channel teks Discord yang sudah ada seperti `#maintainers`.
- `voice.model` mengesampingkan otak agent OpenClaw untuk respons suara Discord dan konsultasi realtime. Biarkan tidak disetel untuk mewarisi model agent yang dirutekan. Ini terpisah dari `voice.realtime.model`.
- `voice.followUsers` memungkinkan bot bergabung, berpindah, dan keluar dari suara Discord bersama pengguna yang dipilih. Lihat [Ikuti pengguna dalam suara](#follow-users-in-voice) untuk aturan perilaku dan contoh.
- `agent-proxy` merutekan ucapan melalui `discord-voice`, yang mempertahankan otorisasi pemilik/alat normal untuk pembicara dan sesi target tetapi menyembunyikan alat `tts` agent karena suara Discord memiliki pemutaran. Secara default, `agent-proxy` memberi konsultasi akses alat penuh yang setara dengan pemilik untuk pembicara pemilik (`voice.realtime.toolPolicy: "owner"`) dan sangat mengutamakan konsultasi ke agent OpenClaw sebelum jawaban substantif (`voice.realtime.consultPolicy: "always"`). Dalam mode default `always` tersebut, lapisan realtime tidak otomatis mengucapkan pengisi sebelum jawaban konsultasi; lapisan ini menangkap dan mentranskripsi ucapan, lalu mengucapkan jawaban OpenClaw yang dirutekan. Jika beberapa jawaban konsultasi paksa selesai saat Discord masih memutar jawaban pertama, jawaban ucapan persis yang datang kemudian diantrekan sampai pemutaran diam, bukan mengganti ucapan di tengah kalimat.
- Dalam mode `stt-tts`, STT menggunakan `tools.media.audio`; `voice.model` tidak memengaruhi transkripsi.
- Dalam mode realtime, `voice.realtime.provider`, `voice.realtime.model`, dan `voice.realtime.speakerVoice` mengonfigurasi sesi audio realtime. Untuk OpenAI Realtime 2 plus otak Codex, gunakan `voice.realtime.model: "gpt-realtime-2"` dan `voice.model: "openai/gpt-5.5"`.
- Mode suara realtime menyertakan file profil kecil `IDENTITY.md`, `USER.md`, dan `SOUL.md` dalam instruksi penyedia realtime secara default agar giliran langsung yang cepat mempertahankan identitas, landasan pengguna, dan persona yang sama dengan agent OpenClaw yang dirutekan. Setel `voice.realtime.bootstrapContextFiles` ke subset untuk menyesuaikannya, atau `[]` untuk menonaktifkannya. File bootstrap realtime yang didukung terbatas pada file profil tersebut; `AGENTS.md` tetap berada dalam konteks agent normal. Konteks profil yang disuntikkan tidak menggantikan `openclaw_agent_consult` untuk pekerjaan workspace, fakta terkini, pencarian memori, atau tindakan yang didukung alat.
- Dalam mode realtime `agent-proxy` OpenAI, setel `voice.realtime.requireWakeName: true` agar suara realtime Discord tetap diam sampai transkrip dimulai atau diakhiri dengan nama pemicu. Nama pemicu yang dikonfigurasi harus satu atau dua kata. Jika `voice.realtime.wakeNames` tidak disetel, OpenClaw menggunakan `name` agent yang dirutekan plus `OpenClaw`, dengan fallback ke id agent plus `OpenClaw`. Pembatasan nama pemicu menonaktifkan respons otomatis penyedia realtime, merutekan giliran yang diterima melalui jalur konsultasi agent OpenClaw, dan memberikan pengakuan lisan singkat saat nama pemicu di awal dikenali dari transkripsi parsial sebelum transkrip akhir tiba.
- Penyedia realtime OpenAI menerima nama event Realtime 2 saat ini dan alias lama yang kompatibel dengan Codex untuk audio output dan event transkrip, sehingga snapshot penyedia yang kompatibel dapat berubah tanpa menghilangkan audio asisten.
- `voice.realtime.bargeIn` mengontrol apakah event mulai-berbicara Discord menginterupsi pemutaran realtime aktif. Jika tidak disetel, ini mengikuti pengaturan interupsi input-audio penyedia realtime.
- `voice.realtime.minBargeInAudioEndMs` mengontrol durasi minimum pemutaran asisten sebelum barge-in realtime OpenAI memotong audio. Default: `250`. Setel `0` untuk interupsi langsung di ruangan dengan gema rendah, atau naikkan untuk setup speaker dengan gema berat.
- Untuk suara OpenAI pada pemutaran Discord, setel `voice.tts.provider: "openai"` dan pilih suara teks-ke-ucapan di bawah `voice.tts.providers.openai.speakerVoice`. `cedar` adalah pilihan yang terdengar maskulin dan baik pada model TTS OpenAI saat ini.
- Pengesampingan `systemPrompt` Discord per channel berlaku untuk giliran transkrip suara bagi channel suara tersebut.
- Giliran transkrip suara menurunkan status pemilik dari `allowFrom` Discord (atau `dm.allowFrom`) untuk perintah berpagar pemilik dan tindakan channel. Visibilitas alat agent mengikuti kebijakan alat yang dikonfigurasi untuk sesi yang dirutekan.
- Suara Discord bersifat opt-in untuk konfigurasi hanya-teks; setel `channels.discord.voice.enabled=true` (atau pertahankan blok `channels.discord.voice` yang sudah ada) untuk mengaktifkan perintah `/vc`, runtime suara, dan intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` dapat secara eksplisit mengesampingkan langganan intent status suara. Biarkan tidak disetel agar intent mengikuti pengaktifan suara efektif.
- Jika `voice.autoJoin` memiliki beberapa entri untuk guild yang sama, OpenClaw bergabung ke channel terakhir yang dikonfigurasi untuk guild tersebut.
- `voice.allowedChannels` adalah allowlist residensi opsional. Biarkan tidak disetel untuk mengizinkan `/vc join` ke channel suara Discord mana pun yang terotorisasi. Saat disetel, `/vc join`, auto-join startup, dan perpindahan status suara bot dibatasi ke entri `{ guildId, channelId }` yang tercantum. Setel ke array kosong untuk menolak semua join suara Discord. Jika Discord memindahkan bot ke luar allowlist, OpenClaw keluar dari channel tersebut dan bergabung ulang ke target auto-join yang dikonfigurasi saat tersedia.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi join `@discordjs/voice`.
- Default `@discordjs/voice` adalah `daveEncryption=true` dan `decryptionFailureTolerance=24` jika tidak disetel.
- OpenClaw menggunakan codec `libopus-wasm` bawaan untuk penerimaan suara Discord dan pemutaran PCM mentah realtime. Ini mengirim build WebAssembly libopus yang dipin dan tidak memerlukan addon opus native.
- `voice.connectTimeoutMs` mengontrol waktu tunggu Ready awal `@discordjs/voice` untuk percobaan `/vc join` dan auto-join. Default: `30000`.
- `voice.reconnectGraceMs` mengontrol berapa lama OpenClaw menunggu sesi suara yang terputus mulai tersambung ulang sebelum menghancurkannya. Default: `15000`.
- Dalam mode `stt-tts`, pemutaran suara tidak berhenti hanya karena pengguna lain mulai berbicara. Untuk menghindari loop umpan balik, OpenClaw mengabaikan tangkapan suara baru saat TTS sedang diputar; berbicaralah setelah pemutaran selesai untuk giliran berikutnya. Mode realtime meneruskan mulai-berbicara sebagai sinyal barge-in ke penyedia realtime.
- Dalam mode realtime, gema dari speaker ke mikrofon terbuka dapat terlihat seperti barge-in dan menginterupsi pemutaran. Untuk ruangan Discord dengan gema berat, setel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` agar OpenAI tidak otomatis menginterupsi pada audio input. Tambahkan `voice.realtime.bargeIn: true` jika Anda tetap ingin event mulai-berbicara Discord menginterupsi pemutaran aktif. Bridge realtime OpenAI mengabaikan pemotongan pemutaran yang lebih pendek dari `voice.realtime.minBargeInAudioEndMs` sebagai kemungkinan gema/noise dan mencatatnya sebagai dilewati, bukan menghapus pemutaran Discord.
- `voice.captureSilenceGraceMs` mengontrol berapa lama OpenClaw menunggu setelah Discord melaporkan seorang pembicara telah berhenti sebelum menyelesaikan segmen audio tersebut untuk STT. Default: `2000`; naikkan ini jika Discord memecah jeda normal menjadi transkrip parsial yang terputus-putus.
- Saat ElevenLabs adalah penyedia TTS yang dipilih, pemutaran suara Discord menggunakan TTS streaming dan dimulai dari stream respons penyedia. Penyedia tanpa dukungan streaming memakai fallback ke jalur file sementara hasil sintesis.
- OpenClaw juga memantau kegagalan dekripsi penerimaan dan pulih otomatis dengan keluar/bergabung ulang ke channel suara setelah kegagalan berulang dalam jendela singkat.
- Jika log penerimaan berulang kali menampilkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` setelah pembaruan, kumpulkan laporan dependensi dan log. Baris `@discordjs/voice` bawaan menyertakan perbaikan padding upstream dari PR discord.js #11449, yang menutup issue discord.js #11419.
- Event penerimaan `The operation was aborted` diharapkan saat OpenClaw menyelesaikan segmen pembicara yang ditangkap; ini adalah diagnostik verbose, bukan peringatan.
- Log suara Discord verbose menyertakan pratinjau transkrip STT satu baris berbatas untuk setiap segmen pembicara yang diterima, sehingga debugging menampilkan sisi pengguna dan sisi balasan agent tanpa membuang teks transkrip tak terbatas.
- Dalam mode `agent-proxy`, fallback konsultasi paksa melewati fragmen transkrip yang kemungkinan belum lengkap seperti teks yang berakhir dengan `...` atau konektor di akhir seperti `and`, plus penutup yang jelas tidak dapat ditindaklanjuti seperti “be right back” atau “bye”. Log menampilkan `forced agent consult skipped reason=...` saat ini mencegah jawaban antrean yang sudah basi.

### Ikuti pengguna dalam suara

Gunakan `voice.followUsers` saat Anda ingin bot suara Discord tetap bersama satu atau beberapa pengguna Discord yang diketahui, alih-alih bergabung ke channel tetap saat startup atau menunggu `/vc join`.

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

- `followUsers` menerima ID pengguna Discord mentah dan nilai `discord:<id>`. OpenClaw menormalkan kedua bentuk sebelum mencocokkan event status suara.
- `followUsersEnabled` default ke `true` saat `followUsers` dikonfigurasi. Setel ke `false` untuk mempertahankan daftar tersimpan tetapi menghentikan pengikutan suara otomatis.
- Saat pengguna yang diikuti bergabung ke channel suara yang diizinkan, OpenClaw bergabung ke channel tersebut. Saat pengguna berpindah, OpenClaw ikut berpindah. Saat pengguna yang diikuti dan aktif terputus, OpenClaw keluar.
- Jika beberapa pengguna yang diikuti berada dalam guild yang sama dan pengguna yang diikuti dan aktif keluar, OpenClaw berpindah ke channel pengguna lain yang diikuti dan terlacak sebelum keluar dari guild. Jika beberapa pengguna yang diikuti berpindah sekaligus, event status suara terbaru yang diamati menang.
- `allowedChannels` tetap berlaku. Pengguna yang diikuti di channel yang tidak diizinkan diabaikan, dan sesi milik pengikutan berpindah ke pengguna lain yang diikuti atau keluar.
- OpenClaw merekonsiliasi event status suara yang terlewat saat startup dan pada interval berbatas. Rekonsiliasi mengambil sampel guild yang dikonfigurasi dan membatasi lookup REST per run, sehingga daftar `followUsers` yang sangat besar mungkin memerlukan lebih dari satu interval untuk konvergen.
- Jika Discord atau admin memindahkan bot saat bot sedang mengikuti pengguna, OpenClaw membangun ulang sesi suara dan mempertahankan kepemilikan pengikutan saat tujuan diizinkan. Jika bot dipindahkan ke luar `allowedChannels`, OpenClaw keluar dan bergabung ulang ke target yang dikonfigurasi saat ada.
- Pemulihan penerimaan DAVE dapat keluar dan bergabung ulang ke channel yang sama setelah kegagalan dekripsi berulang. Sesi milik pengikutan mempertahankan kepemilikan pengikutannya melalui jalur pemulihan tersebut, sehingga pemutusan pengguna yang diikuti di kemudian waktu tetap membuatnya keluar dari channel.

Pilih di antara mode join:

- Gunakan `followUsers` untuk setup personal atau operator ketika bot harus otomatis berada di suara saat Anda ada.
- Gunakan `autoJoin` untuk bot ruang tetap yang harus hadir bahkan saat tidak ada pengguna terlacak yang berada di suara.
- Gunakan `/vc join` untuk join sekali pakai atau ruangan tempat kehadiran suara otomatis akan mengejutkan.

Codec suara Discord:

- Log penerimaan suara menampilkan `discord voice: opus decoder: libopus-wasm`.
- Pemutaran realtime mengodekan PCM stereo mentah 48 kHz ke Opus dengan paket `libopus-wasm` bawaan yang sama sebelum menyerahkan paket ke `@discordjs/voice`.
- Pemutaran file dan aliran provider mentranskode ke PCM stereo mentah 48 kHz dengan ffmpeg, lalu menggunakan `libopus-wasm` untuk aliran paket Opus yang dikirim ke Discord.

Pipeline STT plus TTS:

- Tangkapan PCM Discord dikonversi menjadi file sementara WAV.
- `tools.media.audio` menangani STT, misalnya `openai/gpt-4o-mini-transcribe`.
- Transkrip dikirim melalui ingress dan perutean Discord sementara LLM respons berjalan dengan kebijakan keluaran suara yang menyembunyikan alat `tts` agen dan meminta teks yang dikembalikan, karena suara Discord memiliki pemutaran TTS akhir.
- `voice.model`, ketika disetel, hanya menimpa LLM respons untuk giliran kanal suara ini.
- `voice.tts` digabung di atas `messages.tts`; provider yang mendukung streaming memberi masukan langsung ke pemutar, jika tidak file audio yang dihasilkan diputar di kanal yang sudah digabung.

Contoh sesi kanal suara agent-proxy default:

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

Tanpa blok `voice.agentSession`, setiap kanal suara mendapatkan sesi OpenClaw terute sendiri. Misalnya, `/vc join channel:234567890123456789` berbicara dengan sesi untuk kanal suara Discord tersebut. Model realtime hanya front end suara; permintaan substantif diserahkan ke agen OpenClaw yang dikonfigurasi. Jika model realtime menghasilkan transkrip akhir tanpa memanggil alat konsultasi, OpenClaw memaksa konsultasi sebagai fallback sehingga default tetap berperilaku seperti berbicara dengan agen.

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

Suara sebagai ekstensi dari sesi kanal Discord yang sudah ada:

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

Dalam mode `agent-proxy`, bot bergabung ke kanal suara yang dikonfigurasi, tetapi giliran agen OpenClaw menggunakan sesi dan agen terute normal milik kanal target. Sesi suara realtime mengucapkan hasil yang dikembalikan kembali ke kanal suara. Agen supervisor masih dapat menggunakan alat pesan normal sesuai kebijakan alatnya, termasuk mengirim pesan Discord terpisah jika itu tindakan yang tepat.

Saat run OpenClaw yang didelegasikan aktif, transkrip suara Discord baru diperlakukan sebagai kontrol run langsung sebelum memulai giliran agen lain. Frasa seperti "status", "cancel that", "use the smaller fix", atau "when you're done also check tests" diklasifikasikan sebagai input status, batal, arahan, atau tindak lanjut untuk sesi aktif. Hasil status, batal, arahan yang diterima, dan tindak lanjut diucapkan kembali ke kanal suara sehingga penelepon mengetahui apakah OpenClaw menangani permintaan tersebut.

Bentuk target yang berguna:

- `target: "channel:123456789012345678"` merutekan melalui sesi kanal teks Discord.
- `target: "123456789012345678"` diperlakukan sebagai target kanal.
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

Gunakan ini ketika model mendengar pemutaran Discord miliknya sendiri melalui mikrofon terbuka, tetapi Anda tetap ingin menginterupsinya dengan berbicara. OpenClaw mencegah OpenAI melakukan interupsi otomatis pada audio input mentah, sementara `bargeIn: true` memungkinkan event speaker-start Discord dan audio speaker yang sudah aktif membatalkan respons realtime aktif sebelum giliran tangkapan berikutnya mencapai OpenAI. Sinyal barge-in yang sangat awal dengan `audioEndMs` di bawah `minBargeInAudioEndMs` diperlakukan sebagai kemungkinan echo/noise dan diabaikan agar model tidak terpotong pada frame pemutaran pertama.

Log suara yang diharapkan:

- Saat bergabung: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Saat realtime dimulai: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Saat audio speaker: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, dan `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Saat ucapan usang dilewati: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` atau `reason=non-actionable-closing ...`
- Saat penyelesaian respons realtime: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Saat pemutaran berhenti/reset: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Saat konsultasi realtime: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Saat jawaban agen: `discord voice: agent turn answer ...`
- Saat ucapan persis diantrekan: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, diikuti oleh `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Saat deteksi barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` atau `discord voice: realtime barge-in detected source=active-speaker-audio ...`, diikuti oleh `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Saat interupsi realtime: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, diikuti oleh `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` atau `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Saat echo/noise diabaikan: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Saat barge-in dinonaktifkan: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Saat pemutaran idle: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Untuk men-debug audio yang terpotong, baca log suara realtime sebagai linimasa:

1. `realtime audio playback started` berarti Discord telah mulai memutar audio asisten. Bridge mulai menghitung chunk keluaran asisten, byte PCM Discord, byte realtime provider, dan durasi audio tersintesis dari titik ini.
2. `realtime speaker turn opened` menandai speaker Discord menjadi aktif. Jika pemutaran sudah aktif dan `bargeIn` diaktifkan, ini dapat diikuti oleh `barge-in detected source=speaker-start`.
3. `realtime input audio started` menandai frame audio aktual pertama yang diterima untuk giliran speaker tersebut. `outputActive=true` atau `outputAudioMs` bukan nol di sini berarti mikrofon mengirim input saat pemutaran asisten masih aktif.
4. `barge-in detected source=active-speaker-audio` berarti OpenClaw melihat audio speaker langsung saat pemutaran asisten aktif. Ini berguna untuk membedakan interupsi nyata dari event speaker-start Discord tanpa audio yang berguna.
5. `barge-in requested reason=...` berarti OpenClaw meminta provider realtime membatalkan atau memotong respons aktif. Ini menyertakan `outputAudioMs`, `outputActive`, dan `playbackChunks` sehingga Anda dapat melihat berapa banyak audio asisten yang benar-benar sudah diputar sebelum interupsi.
6. `realtime audio playback stopped reason=...` adalah titik reset pemutaran Discord lokal. Alasannya menyatakan siapa yang menghentikan pemutaran: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, atau `session-close`.
7. `realtime speaker turn closed` merangkum giliran input yang ditangkap. `chunks=0` atau `hasAudio=false` berarti giliran speaker terbuka tetapi tidak ada audio yang dapat digunakan mencapai bridge realtime. `interruptedPlayback=true` berarti giliran input tersebut tumpang tindih dengan keluaran asisten dan memicu logika barge-in.

Field yang berguna:

- `outputAudioMs`: durasi audio asisten yang dihasilkan oleh provider realtime sebelum baris log.
- `audioMs`: durasi audio asisten yang dihitung OpenClaw sebelum pemutaran berhenti.
- `elapsedMs`: waktu wall-clock antara pembukaan dan penutupan aliran pemutaran atau giliran speaker.
- `discordBytes`: byte PCM stereo 48 kHz yang dikirim ke atau diterima dari suara Discord.
- `realtimeBytes`: byte PCM format provider yang dikirim ke atau diterima dari provider realtime.
- `playbackChunks`: chunk audio asisten yang diteruskan ke Discord untuk respons aktif.
- `sinceLastAudioMs`: jeda antara frame audio speaker terakhir yang ditangkap dan penutupan giliran speaker.

Pola umum:

- Terpotong langsung dengan `source=active-speaker-audio`, `outputAudioMs` kecil, dan pengguna yang sama di dekatnya biasanya menunjukkan echo speaker masuk ke mikrofon. Naikkan `voice.realtime.minBargeInAudioEndMs`, turunkan volume speaker, gunakan headphone, atau setel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` diikuti oleh `speaker turn closed ... hasAudio=false` berarti Discord melaporkan speaker mulai tetapi tidak ada audio yang mencapai OpenClaw. Itu bisa berupa event suara Discord sementara, perilaku noise gate, atau klien yang sebentar mengaktifkan mikrofon.
- `audio playback stopped reason=stream-close` tanpa barge-in terdekat atau `provider-clear-audio` berarti aliran pemutaran Discord lokal berakhir secara tidak terduga. Periksa log provider dan pemutar Discord sebelumnya.
- `capture ignored during playback (barge-in disabled)` berarti OpenClaw sengaja membuang input saat audio asisten aktif. Aktifkan `voice.realtime.bargeIn` jika Anda ingin ucapan menginterupsi pemutaran.
- `barge-in ignored ... outputActive=false` berarti Discord atau VAD provider melaporkan ucapan, tetapi OpenClaw tidak memiliki pemutaran aktif untuk diinterupsi. Ini seharusnya tidak memotong audio.

Kredensial diselesaikan per komponen: auth rute LLM untuk `voice.model`, auth STT untuk `tools.media.audio`, auth TTS untuk `messages.tts`/`voice.tts`, dan auth provider realtime untuk `voice.realtime.providers` atau konfigurasi auth normal provider.

### Pesan suara

Pesan suara Discord menampilkan pratinjau waveform dan memerlukan audio OGG/Opus. OpenClaw menghasilkan waveform secara otomatis, tetapi memerlukan `ffmpeg` dan `ffprobe` pada host Gateway untuk memeriksa dan mengonversi.

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
    - jika peta `channels` guild ada, hanya kanal yang tercantum yang diizinkan
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

    - `groupPolicy="allowlist"` tanpa allowlist guild/kanal yang cocok
    - `requireMention` dikonfigurasi di tempat yang salah (harus berada di bawah `channels.discord.guilds` atau entri kanal)
    - pengirim diblokir oleh allowlist `users` guild/kanal

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Log umum:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Kenop antrean Gateway Discord:

    - akun tunggal: `channels.discord.eventQueue.listenerTimeout`
    - multi-akun: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ini hanya mengontrol pekerjaan listener Gateway Discord, bukan masa hidup giliran agen

    Discord tidak menerapkan batas waktu milik kanal pada giliran agen yang masuk antrean. Listener pesan segera menyerahkan pekerjaan, dan proses Discord yang masuk antrean mempertahankan urutan per sesi hingga siklus hidup sesi/tool/runtime selesai atau membatalkan pekerjaan.

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
    OpenClaw mengambil metadata Discord `/gateway/bot` sebelum terhubung. Kegagalan sementara kembali ke URL Gateway bawaan Discord dan dibatasi lajunya di log.

    Kenop batas waktu metadata:

    - akun tunggal: `channels.discord.gatewayInfoTimeoutMs`
    - multi-akun: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env saat konfigurasi tidak disetel: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - bawaan: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw menunggu event Gateway Discord `READY` selama startup dan setelah runtime terhubung ulang. Penyiapan multi-akun dengan penjadwalan startup bertahap dapat memerlukan jendela READY startup yang lebih lama daripada bawaan.

    Kenop batas waktu READY:

    - startup akun tunggal: `channels.discord.gatewayReadyTimeoutMs`
    - startup multi-akun: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env startup saat konfigurasi tidak disetel: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - bawaan startup: `15000` (15 detik), maks: `120000`
    - runtime akun tunggal: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-akun: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env runtime saat konfigurasi tidak disetel: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - bawaan runtime: `30000` (30 detik), maks: `120000`

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
    Secara default, pesan yang dibuat oleh bot diabaikan.

    Jika Anda menyetel `channels.discord.allowBots=true`, gunakan aturan mention dan allowlist yang ketat untuk menghindari perilaku loop.
    Lebih baik gunakan `channels.discord.allowBots="mentions"` agar hanya menerima pesan bot yang menyebut bot tersebut.

    OpenClaw juga menyertakan [perlindungan loop bot](/id/channels/bot-loop-protection) bersama. Setiap kali `allowBots` memungkinkan pesan buatan bot mencapai dispatch, Discord memetakan event masuk ke fakta `(account, channel, bot pair)` dan guard pasangan generik menekan pasangan tersebut setelah melewati anggaran event yang dikonfigurasi. Guard mencegah loop dua bot yang tak terkendali yang sebelumnya harus dihentikan oleh batas laju Discord; ini tidak memengaruhi deployment bot tunggal atau balasan bot satu kali yang tetap berada di bawah anggaran.

    Pengaturan bawaan (aktif saat `allowBots` disetel):

    - `maxEventsPerWindow: 20` -- pasangan bot dapat bertukar 20 pesan dalam jendela geser
    - `windowSeconds: 60` -- panjang jendela geser
    - `cooldownSeconds: 60` -- setelah anggaran terlampaui, setiap pesan bot-ke-bot tambahan ke arah mana pun dibuang selama satu menit

    Konfigurasikan bawaan bersama sekali di bawah `channels.defaults.botLoopProtection`, lalu override Discord saat alur kerja yang sah memerlukan ruang lebih besar. Prioritasnya adalah:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - bawaan bawaan sistem

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

    - pertahankan OpenClaw tetap mutakhir (`openclaw update`) agar logika pemulihan penerimaan suara Discord tersedia
    - konfirmasi `channels.discord.voice.daveEncryption=true` (bawaan)
    - mulai dari `channels.discord.voice.decryptionFailureTolerance=24` (bawaan upstream) dan sesuaikan hanya jika diperlukan
    - pantau log untuk:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jika kegagalan berlanjut setelah rejoin otomatis, kumpulkan log dan bandingkan dengan riwayat penerimaan DAVE upstream di [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) dan [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Discord](/id/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- startup/autentikasi: `enabled`, `token`, `accounts.*`, `allowBots`
- kebijakan: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- perintah: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- antrean event: `eventQueue.listenerTimeout` (anggaran listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- balasan/riwayat: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/coba ulang: `mediaMaxMb` (membatasi unggahan keluar Discord, bawaan `100MB`), `retry`
- aksi: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- fitur: `threadBindings`, `bindings[]` tingkat atas (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Keamanan dan operasi

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` lebih disarankan di lingkungan yang diawasi).
- Berikan izin Discord dengan hak istimewa paling sedikit.
- Jika deployment/status perintah sudah usang, mulai ulang Gateway dan periksa ulang dengan `openclaw channels status --probe`.

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pairing pengguna Discord ke Gateway.
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
    Petakan guild dan kanal ke agen.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native.
  </Card>
</CardGroup>
