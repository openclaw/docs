---
read_when:
    - Mengerjakan fitur saluran Discord
summary: Status dukungan bot Discord, kemampuan, dan konfigurasi
title: Discord
x-i18n:
    generated_at: "2026-05-04T07:02:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e00f9d9b134296ac1ca52bb4058fc62ea7a95c4d46d9478648b2ecdd448652a
    source_path: channels/discord.md
    workflow: 16
---

Siap untuk DM dan kanal guild melalui Gateway Discord resmi.

<CardGroup cols={3}>
  <Card title="Penyandingan" icon="link" href="/id/channels/pairing">
    DM Discord secara default masuk ke mode penyandingan.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah bawaan dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah kanal" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas kanal dan alur perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

Anda perlu membuat aplikasi baru dengan bot, menambahkan bot ke server Anda, dan menyandingkannya dengan OpenClaw. Kami menyarankan Anda menambahkan bot ke server privat Anda sendiri. Jika Anda belum memilikinya, [buat terlebih dahulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (pilih **Buat Punya Saya Sendiri > Untuk saya dan teman-teman saya**).

<Steps>
  <Step title="Buat aplikasi dan bot Discord">
    Buka [Portal Pengembang Discord](https://discord.com/developers/applications) dan klik **Aplikasi Baru**. Beri nama seperti "OpenClaw".

    Klik **Bot** di bilah samping. Atur **Nama Pengguna** ke nama apa pun yang Anda gunakan untuk agen OpenClaw Anda.

  </Step>

  <Step title="Aktifkan intent dengan hak istimewa">
    Masih di halaman **Bot**, gulir ke bawah ke **Intent Gateway dengan Hak Istimewa** dan aktifkan:

    - **Intent Konten Pesan** (wajib)
    - **Intent Anggota Server** (disarankan; wajib untuk daftar izin peran dan pencocokan nama ke ID)
    - **Intent Kehadiran** (opsional; hanya diperlukan untuk pembaruan kehadiran)

  </Step>

  <Step title="Salin token bot Anda">
    Gulir kembali ke atas pada halaman **Bot** dan klik **Reset Token**.

    <Note>
    Terlepas dari namanya, ini menghasilkan token pertama Anda — tidak ada yang benar-benar "direset."
    </Note>

    Salin token dan simpan di suatu tempat. Ini adalah **Token Bot** Anda dan Anda akan membutuhkannya sebentar lagi.

  </Step>

  <Step title="Buat URL undangan dan tambahkan bot ke server Anda">
    Klik **OAuth2** di bilah samping. Anda akan membuat URL undangan dengan izin yang tepat untuk menambahkan bot ke server Anda.

    Gulir ke bawah ke **Pembuat URL OAuth2** dan aktifkan:

    - `bot`
    - `applications.commands`

    Bagian **Izin Bot** akan muncul di bawah. Aktifkan setidaknya:

    **Izin Umum**
      - Lihat Kanal
    **Izin Teks**
      - Kirim Pesan
      - Baca Riwayat Pesan
      - Sematkan Tautan
      - Lampirkan File
      - Tambahkan Reaksi (opsional)

    Ini adalah set dasar untuk kanal teks normal. Jika Anda berencana memposting di thread Discord, termasuk alur kerja kanal forum atau media yang membuat atau melanjutkan thread, aktifkan juga **Kirim Pesan di Thread**.
    Salin URL yang dibuat di bagian bawah, tempelkan ke browser Anda, pilih server Anda, dan klik **Lanjutkan** untuk terhubung. Sekarang Anda seharusnya melihat bot Anda di server Discord.

  </Step>

  <Step title="Aktifkan Mode Pengembang dan kumpulkan ID Anda">
    Kembali di aplikasi Discord, Anda perlu mengaktifkan Mode Pengembang agar dapat menyalin ID internal.

    1. Klik **Pengaturan Pengguna** (ikon roda gigi di samping avatar Anda) → **Lanjutan** → aktifkan **Mode Pengembang**
    2. Klik kanan **ikon server** Anda di bilah samping → **Salin ID Server**
    3. Klik kanan **avatar Anda sendiri** → **Salin ID Pengguna**

    Simpan **ID Server** dan **ID Pengguna** Anda bersama Token Bot Anda — Anda akan mengirim ketiganya ke OpenClaw pada langkah berikutnya.

  </Step>

  <Step title="Izinkan DM dari anggota server">
    Agar penyandingan berfungsi, Discord perlu mengizinkan bot Anda mengirim DM kepada Anda. Klik kanan **ikon server** Anda → **Pengaturan Privasi** → aktifkan **Pesan Langsung**.

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

    Jika OpenClaw sudah berjalan sebagai layanan latar belakang, mulai ulang melalui aplikasi Mac OpenClaw atau dengan menghentikan dan memulai ulang proses `openclaw gateway run`.
    Untuk instalasi layanan terkelola, jalankan `openclaw gateway install` dari shell tempat `DISCORD_BOT_TOKEN` tersedia, atau simpan variabel di `~/.openclaw/.env`, agar layanan dapat me-resolve env SecretRef setelah dimulai ulang.
    Jika host Anda diblokir atau dibatasi lajunya oleh pencarian aplikasi startup Discord, atur ID aplikasi/klien Discord dari Portal Pengembang agar startup dapat melewati panggilan REST tersebut. Gunakan `channels.discord.applicationId` untuk akun default, atau `channels.discord.accounts.<accountId>.applicationId` saat Anda menjalankan beberapa bot Discord.

  </Step>

  <Step title="Konfigurasikan OpenClaw dan sandingkan">

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
        Chat dengan agen OpenClaw Anda di kanal yang sudah ada (mis. Telegram) dan beri tahu agen tersebut. Jika Discord adalah kanal pertama Anda, gunakan tab CLI / konfigurasi sebagai gantinya.

        > "Saya sudah mengatur token bot Discord saya di konfigurasi. Tolong selesaikan penyiapan Discord dengan ID Pengguna `<user_id>` dan ID Server `<server_id>`."
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

        Untuk penyiapan berskrip atau jarak jauh, tulis blok JSON5 yang sama dengan `openclaw config patch --file ./discord.patch.json5 --dry-run` lalu jalankan ulang tanpa `--dry-run`. Nilai `token` teks polos didukung. Nilai SecretRef juga didukung untuk `channels.discord.token` di seluruh provider env/file/exec. Lihat [Manajemen Rahasia](/id/gateway/secrets).

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

  <Step title="Setujui penyandingan DM pertama">
    Tunggu hingga Gateway berjalan, lalu kirim DM ke bot Anda di Discord. Bot akan merespons dengan kode penyandingan.

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

    Sekarang Anda seharusnya dapat chat dengan agen Anda di Discord melalui DM.

  </Step>
</Steps>

<Note>
Resolusi token sadar akun. Nilai token konfigurasi mengalahkan fallback env. `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Jika dua akun Discord yang diaktifkan me-resolve ke token bot yang sama, OpenClaw hanya memulai satu pemantau Gateway untuk token tersebut. Token yang bersumber dari konfigurasi mengalahkan fallback env default; jika tidak, akun pertama yang diaktifkan menang dan akun duplikat dilaporkan dinonaktifkan.
Untuk panggilan keluar tingkat lanjut (alat pesan/tindakan kanal), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk tindakan bergaya kirim dan baca/probe (misalnya baca/cari/ambil/thread/pin/izin). Pengaturan kebijakan akun/coba ulang tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Disarankan: Siapkan ruang kerja guild

Setelah DM berfungsi, Anda dapat menyiapkan server Discord Anda sebagai ruang kerja penuh tempat setiap kanal mendapatkan sesi agennya sendiri dengan konteksnya sendiri. Ini disarankan untuk server privat tempat hanya ada Anda dan bot Anda.

<Steps>
  <Step title="Tambahkan server Anda ke daftar izin guild">
    Ini memungkinkan agen Anda merespons di kanal mana pun di server Anda, bukan hanya DM.

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
        > "Tambahkan ID Server Discord saya `<server_id>` ke daftar izin guild"
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
    Secara default, agen Anda hanya merespons di kanal guild saat di-@mention. Untuk server privat, Anda mungkin ingin agen merespons setiap pesan.

    Di kanal guild, balasan final asisten normal tetap privat secara default. Output Discord yang terlihat harus dikirim secara eksplisit dengan alat `message`, sehingga agen dapat mengamati secara default dan hanya memposting saat memutuskan bahwa balasan kanal berguna.

    Ini berarti model yang dipilih harus memanggil alat secara andal. Jika Discord menampilkan sedang mengetik dan log menunjukkan penggunaan token tetapi tidak ada pesan yang diposting, periksa log sesi untuk teks asisten dengan `didSendViaMessagingTool: false`. Itu berarti model menghasilkan jawaban final privat alih-alih memanggil `message(action=send)`. Beralihlah ke model pemanggil alat yang lebih kuat, atau gunakan konfigurasi di bawah untuk memulihkan balasan final otomatis lama.

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
        > "Izinkan agen saya merespons di server ini tanpa harus di-@mention"
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

        Untuk memulihkan balasan final otomatis lama untuk ruang grup/kanal, atur `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Rencanakan memori di kanal guild">
    Secara default, memori jangka panjang (MEMORY.md) hanya dimuat dalam sesi DM. Kanal guild tidak memuat MEMORY.md secara otomatis.

    <Tabs>
      <Tab title="Tanyakan kepada agen Anda">
        > "Saat saya mengajukan pertanyaan di kanal Discord, gunakan memory_search atau memory_get jika Anda membutuhkan konteks jangka panjang dari MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Jika Anda memerlukan konteks bersama di setiap kanal, letakkan instruksi stabil di `AGENTS.md` atau `USER.md` (keduanya disuntikkan untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan dengan alat memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat beberapa kanal di server Discord Anda dan mulai chat. Agen Anda dapat melihat nama kanal, dan setiap kanal mendapatkan sesi terisolasinya sendiri — sehingga Anda dapat menyiapkan `#coding`, `#home`, `#research`, atau apa pun yang sesuai dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan masuk Discord kembali ke Discord.
- Metadata guild/channel Discord ditambahkan ke prompt model sebagai konteks
  tidak tepercaya, bukan sebagai prefiks balasan yang terlihat oleh pengguna. Jika model menyalin envelope itu
  kembali, OpenClaw menghapus metadata yang disalin dari balasan keluar dan dari
  konteks replay berikutnya.
- Secara default (`session.dmScope=main`), obrolan langsung berbagi sesi utama agen (`agent:main:main`).
- Kanal guild adalah kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- DM grup diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Perintah slash native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.
- Pengiriman pengumuman cron/heartbeat berbasis teks saja ke Discord menggunakan jawaban akhir
  yang terlihat oleh asisten satu kali. Payload media dan komponen terstruktur tetap
  multi-pesan saat agen menghasilkan beberapa payload yang dapat dikirim.

## Kanal forum

Kanal forum dan media Discord hanya menerima postingan thread. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke induk forum (`channel:<forumId>`) untuk membuat thread secara otomatis. Judul thread menggunakan baris pertama yang tidak kosong dari pesan Anda.
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

Induk forum tidak menerima komponen Discord. Jika Anda membutuhkan komponen, kirim ke thread itu sendiri (`channel:<threadId>`).

## Komponen interaktif

OpenClaw mendukung kontainer komponen v2 Discord untuk pesan agen. Gunakan alat pesan dengan payload `components`. Hasil interaksi dirutekan kembali ke agen sebagai pesan masuk normal dan mengikuti pengaturan Discord `replyToMode` yang ada.

Blok yang didukung:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Baris aksi mengizinkan hingga 5 tombol atau satu menu pilih
- Jenis pilih: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya sekali pakai. Atur `components.reusable=true` agar tombol, pilihan, dan formulir dapat digunakan beberapa kali hingga kedaluwarsa.

Untuk membatasi siapa yang dapat mengeklik tombol, atur `allowedUsers` pada tombol tersebut (ID pengguna Discord, tag, atau `*`). Saat dikonfigurasi, pengguna yang tidak cocok menerima penolakan ephemeral.

Perintah slash `/model` dan `/models` membuka pemilih model interaktif dengan dropdown provider, model, dan runtime yang kompatibel, ditambah langkah Submit. `/models add` sudah tidak digunakan dan kini mengembalikan pesan deprekasi alih-alih mendaftarkan model dari chat. Balasan pemilih bersifat ephemeral dan hanya pengguna yang memanggilnya yang dapat menggunakannya.

Lampiran file:

- Blok `file` harus menunjuk ke referensi lampiran (`attachment://<filename>`)
- Sediakan lampiran melalui `media`/`path`/`filePath` (satu file); gunakan `media-gallery` untuk beberapa file
- Gunakan `filename` untuk menimpa nama unggahan saat harus cocok dengan referensi lampiran

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` mengontrol akses DM. `channels.discord.allowFrom` adalah allowlist DM kanonis.

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.discord.allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    Jika kebijakan DM tidak terbuka, pengguna yang tidak dikenal diblokir (atau diminta melakukan pairing dalam mode `pairing`).

    Prioritas multi-akun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Untuk satu akun, `allowFrom` lebih diutamakan daripada `dm.allowFrom` lama.
    - Akun bernama mewarisi `channels.discord.allowFrom` saat `allowFrom` miliknya sendiri dan `dm.allowFrom` lama belum diatur.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` dan `channels.discord.dm.allowFrom` lama masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` jika dapat melakukannya tanpa mengubah akses.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - mention `<@id>`

    ID numerik tanpa prefiks biasanya diselesaikan sebagai ID kanal saat default kanal aktif, tetapi ID yang tercantum dalam DM `allowFrom` efektif akun diperlakukan sebagai target DM pengguna untuk kompatibilitas.

  </Tab>

  <Tab title="DM access groups">
    DM Discord dapat menggunakan entri dinamis `accessGroup:<name>` dalam `channels.discord.allowFrom`.

    Nama grup akses dibagikan di seluruh kanal pesan. Gunakan `type: "message.senders"` untuk grup statis yang anggotanya dinyatakan dalam sintaks `allowFrom` normal masing-masing kanal, atau `type: "discord.channelAudience"` saat audiens `ViewChannel` kanal Discord saat ini harus menentukan keanggotaan secara dinamis. Perilaku grup akses bersama didokumentasikan di sini: [Grup akses](/id/channels/access-groups).

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

    Lookup gagal tertutup. Jika Discord mengembalikan `Missing Access`, lookup anggota gagal, atau kanal termasuk dalam guild yang berbeda, pengirim DM diperlakukan sebagai tidak diotorisasi.

    Aktifkan **Server Members Intent** Discord Developer Portal untuk bot saat menggunakan grup akses berbasis audiens kanal. DM tidak menyertakan status anggota guild, jadi OpenClaw menyelesaikan anggota melalui REST Discord pada waktu otorisasi.

  </Tab>

  <Tab title="Guild policy">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman saat `channels.discord` ada adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` disarankan, slug diterima)
    - allowlist pengirim opsional: `users` (ID stabil disarankan) dan `roles` (hanya ID role); jika salah satu dikonfigurasi, pengirim diizinkan saat cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag langsung dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memperingatkan saat entri nama/tag digunakan
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
    Pesan guild dibatasi mention secara default.

    Deteksi mention mencakup:

    - mention bot eksplisit
    - pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku balas-ke-bot implisit dalam kasus yang didukung

    Saat menulis pesan Discord keluar, gunakan sintaks mention kanonis: `<@USER_ID>` untuk pengguna, `<#CHANNEL_ID>` untuk kanal, dan `<@&ROLE_ID>` untuk role. Jangan gunakan bentuk mention nama panggilan lama `<@!USER_ID>`.

    `requireMention` dikonfigurasi per guild/kanal (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional menghapus pesan yang menyebut pengguna/role lain tetapi bukan bot (tidak termasuk @everyone/@here).

    DM grup:

    - default: diabaikan (`dm.groupEnabled=false`)
    - allowlist opsional melalui `dm.groupChannels` (ID kanal atau slug)

  </Tab>
</Tabs>

### Perutean agen berbasis role

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agen berbeda berdasarkan ID role. Binding berbasis role hanya menerima ID role dan dievaluasi setelah binding peer atau parent-peer dan sebelum binding khusus guild. Jika binding juga mengatur field kecocokan lain (misalnya `peer` + `guildId` + `roles`), semua field yang dikonfigurasi harus cocok.

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

## Perintah native dan otorisasi perintah

- `commands.native` defaultnya adalah `"auto"` dan diaktifkan untuk Discord.
- Override per-channel: `channels.discord.commands.native`.
- `commands.native=false` melewati pendaftaran slash-command Discord dan pembersihan saat startup. Command yang sebelumnya terdaftar mungkin tetap terlihat di Discord sampai Anda menghapusnya dari aplikasi Discord.
- Auth command native menggunakan allowlist/kebijakan Discord yang sama seperti penanganan pesan normal.
- Command mungkin tetap terlihat di UI Discord untuk pengguna yang tidak diotorisasi; eksekusi tetap menerapkan auth OpenClaw dan mengembalikan "tidak diotorisasi".

Lihat [Slash commands](/id/tools/slash-commands) untuk katalog command dan perilaku.

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
    `batched` hanya melampirkan referensi balasan native implisit Discord saat
    giliran masuk adalah batch ter-debounce dari beberapa pesan. Ini berguna
    saat Anda menginginkan balasan native terutama untuk chat bursty yang ambigu, bukan setiap
    giliran satu pesan.

    ID pesan ditampilkan dalam konteks/riwayat sehingga agen dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Pratinjau live stream">
    OpenClaw dapat men-stream balasan draf dengan mengirim pesan sementara dan mengeditnya saat teks masuk. `channels.discord.streaming` menerima `off` (default) | `partial` | `block` | `progress`. `progress` mempertahankan satu draf status yang dapat diedit dan memperbaruinya dengan progres tool sampai pengiriman final; `streamMode` adalah alias legacy dan dimigrasikan otomatis.

    Default tetap `off` karena edit pratinjau Discord cepat mengenai batas laju saat beberapa bot atau Gateway berbagi satu akun.

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
    - `block` memancarkan chunk berukuran draf (gunakan `draftChunk` untuk menyetel ukuran dan titik pemutusan, dibatasi ke `textChunkLimit`).
    - Final media, error, dan balasan eksplisit membatalkan edit pratinjau tertunda.
    - `streaming.preview.toolProgress` (default `true`) mengontrol apakah pembaruan tool/progres memakai ulang pesan pratinjau.
    - `streaming.preview.commandText` / `streaming.progress.commandText` mengontrol detail command/exec dalam baris progres ringkas: `raw` (default) atau `status` (hanya label tool).

    Sembunyikan teks command/exec mentah sambil tetap mempertahankan baris progres ringkas:

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

    Streaming pratinjau hanya teks; balasan media fallback ke pengiriman normal. Saat streaming `block` diaktifkan secara eksplisit, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

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
    - Sesi thread mewarisi pilihan `/model` level sesi dari channel induk sebagai fallback khusus model; pilihan `/model` lokal thread tetap didahulukan dan riwayat transkrip induk tidak disalin kecuali pewarisan transkrip diaktifkan.
    - `channels.discord.thread.inheritParent` (default `false`) mengikutsertakan auto-thread baru untuk disemai dari transkrip induk. Override per-akun berada di bawah `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaksi message-tool dapat menyelesaikan target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` dipertahankan selama fallback aktivasi tahap balasan.

    Topik channel disuntikkan sebagai konteks **tidak tepercaya**. Allowlist membatasi siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan penuh.

  </Accordion>

  <Accordion title="Sesi terikat thread untuk subagen">
    Discord dapat mengikat thread ke target sesi sehingga pesan lanjutan di thread tersebut tetap dirutekan ke sesi yang sama (termasuk sesi subagen).

    Command:

    - `/focus <target>` ikat thread saat ini/baru ke target subagen/sesi
    - `/unfocus` hapus binding thread saat ini
    - `/agents` tampilkan run aktif dan status binding
    - `/session idle <duration|off>` periksa/perbarui auto-unfocus ketidakaktifan untuk binding terfokus
    - `/session max-age <duration|off>` periksa/perbarui usia maksimum keras untuk binding terfokus

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
    - Key usang `spawnSubagentSessions`/`spawnAcpSessions` dimigrasikan oleh `openclaw doctor --fix`.
    - Jika binding thread dinonaktifkan untuk sebuah akun, `/focus` dan operasi binding thread terkait tidak tersedia.

    Lihat [Sub-agen](/id/tools/subagents), [Agen ACP](/id/tools/acp-agents), dan [Referensi Konfigurasi](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Binding channel ACP persisten">
    Untuk workspace ACP "selalu aktif" yang stabil, konfigurasikan binding ACP bertipe level atas yang menargetkan percakapan Discord.

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

    - `/acp spawn codex --bind here` mengikat channel atau thread saat ini di tempat dan menjaga pesan berikutnya tetap berada pada sesi ACP yang sama. Pesan thread mewarisi binding channel induk.
    - Dalam channel atau thread terikat, `/new` dan `/reset` me-reset sesi ACP yang sama di tempat. Binding thread sementara dapat meng-override resolusi target saat aktif.
    - `spawnSessions` membatasi pembuatan/pengikatan thread anak melalui `--thread auto|here`.

    Lihat [Agen ACP](/id/tools/acp-agents) untuk detail perilaku binding.

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

    - Discord menerima emoji unicode atau nama emoji kustom.
    - Gunakan `""` untuk menonaktifkan reaksi untuk channel atau akun.

  </Accordion>

  <Accordion title="Penulisan config">
    Penulisan config yang dimulai dari channel diaktifkan secara default.

    Ini memengaruhi alur `/config set|unset` (saat fitur command diaktifkan).

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

  <Accordion title="Dukungan PluralKit">
    Aktifkan resolusi PluralKit untuk memetakan pesan ter-proxy ke identitas anggota sistem:

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
    - nama tampilan anggota dicocokkan berdasarkan nama/slug hanya saat `channels.discord.dangerouslyAllowNameMatching: true`
    - lookup menggunakan ID pesan asli dan dibatasi jendela waktu
    - jika lookup gagal, pesan ter-proxy diperlakukan sebagai pesan bot dan dibuang kecuali `allowBots=true`

  </Accordion>

  <Accordion title="Alias mention keluar">
    Gunakan `mentionAliases` saat agen memerlukan mention keluar deterministik untuk pengguna Discord yang diketahui. Key adalah handle tanpa awalan `@`; value adalah ID pengguna Discord. Handle yang tidak diketahui, `@everyone`, `@here`, dan mention di dalam code span Markdown dibiarkan tidak berubah.

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
    Pembaruan presence diterapkan saat Anda menetapkan field status atau activity, atau saat Anda mengaktifkan presence otomatis.

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

    Contoh activity (status kustom adalah tipe activity default):

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

    Peta tipe activity:

    - 0: Bermain
    - 1: Streaming (memerlukan `activityUrl`)
    - 2: Mendengarkan
    - 3: Menonton
    - 4: Kustom (menggunakan teks activity sebagai state status; emoji opsional)
    - 5: Berkompetisi

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

    Kehadiran otomatis memetakan ketersediaan waktu jalan ke status Discord: sehat => online, menurun atau tidak diketahui => idle, habis atau tidak tersedia => dnd. Teks penimpaan opsional:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (mendukung placeholder `{reason}`)

  </Accordion>

  <Accordion title="Persetujuan di Discord">
    Discord mendukung penanganan persetujuan berbasis tombol di DM dan secara opsional dapat memposting prompt persetujuan di saluran asal.

    Jalur konfigurasi:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; kembali ke `commands.ownerAllowFrom` bila memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, bawaan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord mengaktifkan otomatis persetujuan eksekusi bawaan ketika `enabled` tidak disetel atau `"auto"` dan setidaknya satu pemberi persetujuan dapat diselesaikan, baik dari `execApprovals.approvers` maupun dari `commands.ownerAllowFrom`. Discord tidak menyimpulkan pemberi persetujuan eksekusi dari `allowFrom` saluran, `dm.allowFrom` lama, atau `defaultTo` pesan langsung. Atur `enabled: false` untuk menonaktifkan Discord sebagai klien persetujuan bawaan secara eksplisit.

    Untuk perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory`, OpenClaw mengirim prompt persetujuan dan hasil akhir secara privat. OpenClaw mencoba DM Discord terlebih dahulu ketika pemilik yang memanggil memiliki rute pemilik Discord; jika tidak tersedia, OpenClaw kembali ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, seperti Telegram.

    Ketika `target` adalah `channel` atau `both`, prompt persetujuan terlihat di saluran. Hanya pemberi persetujuan yang terselesaikan yang dapat menggunakan tombol; pengguna lain menerima penolakan yang hanya terlihat oleh mereka. Prompt persetujuan menyertakan teks perintah, jadi aktifkan pengiriman saluran hanya di saluran tepercaya. Jika ID saluran tidak dapat diturunkan dari kunci sesi, OpenClaw kembali ke pengiriman DM.

    Discord juga merender tombol persetujuan bersama yang digunakan oleh saluran obrolan lain. Adaptor Discord bawaan terutama menambahkan perutean DM pemberi persetujuan dan penyebaran ke saluran.
    Ketika tombol tersebut ada, tombol itu adalah UX persetujuan utama; OpenClaw
    sebaiknya hanya menyertakan perintah `/approve` manual ketika hasil alat menyatakan
    persetujuan obrolan tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    Jika waktu jalan persetujuan bawaan Discord tidak aktif, OpenClaw menjaga
    prompt lokal deterministik `/approve <id> <decision>` tetap terlihat. Jika
    waktu jalan aktif tetapi kartu bawaan tidak dapat dikirimkan ke target mana pun,
    OpenClaw mengirim pemberitahuan cadangan di obrolan yang sama dengan perintah `/approve`
    persis dari persetujuan tertunda.

    Autentikasi Gateway dan penyelesaian persetujuan mengikuti kontrak klien Gateway bersama (ID `plugin:` diselesaikan melalui `plugin.approval.resolve`; ID lain melalui `exec.approval.resolve`). Persetujuan kedaluwarsa setelah 30 menit secara bawaan.

    Lihat [Persetujuan eksekusi](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Alat dan gerbang aksi

Aksi pesan Discord mencakup pengiriman pesan, admin saluran, moderasi, kehadiran, dan aksi metadata.

Contoh inti:

- pengiriman pesan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- kehadiran: `setPresence`

Aksi `event-create` menerima parameter `image` opsional (URL atau jalur file lokal) untuk mengatur gambar sampul acara terjadwal.

Gerbang aksi berada di bawah `channels.discord.actions.*`.

Perilaku gerbang bawaan:

| Grup aksi                                                                                                                                                                | Bawaan        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | diaktifkan    |
| roles                                                                                                                                                                    | dinonaktifkan |
| moderation                                                                                                                                                               | dinonaktifkan |
| presence                                                                                                                                                                 | dinonaktifkan |

## UI komponen v2

OpenClaw menggunakan komponen v2 Discord untuk persetujuan eksekusi dan penanda lintas konteks. Aksi pesan Discord juga dapat menerima `components` untuk UI kustom (lanjutan; memerlukan penyusunan muatan komponen melalui alat Discord), sementara `embeds` lama tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` mengatur warna aksen yang digunakan oleh kontainer komponen Discord (hex).
- Atur per akun dengan `channels.discord.accounts.<id>.ui.components.accentColor`.
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

## Suara

Discord memiliki dua permukaan suara yang berbeda: **saluran suara** waktu nyata (percakapan berkelanjutan) dan **lampiran pesan suara** (format pratinjau gelombang). Gateway mendukung keduanya.

### Saluran suara

Daftar periksa penyiapan:

1. Aktifkan Intent Konten Pesan di Portal Pengembang Discord.
2. Aktifkan Intent Anggota Server ketika daftar izin peran/pengguna digunakan.
3. Undang bot dengan cakupan `bot` dan `applications.commands`.
4. Berikan izin Sambungkan, Bicara, Kirim Pesan, dan Baca Riwayat Pesan di saluran suara target.
5. Aktifkan perintah bawaan (`commands.native` atau `channels.discord.commands.native`).
6. Konfigurasikan `channels.discord.voice`.

Gunakan `/vc join|leave|status` untuk mengontrol sesi. Perintah ini menggunakan agen bawaan akun dan mengikuti aturan daftar izin serta kebijakan grup yang sama seperti perintah Discord lainnya.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Contoh bergabung otomatis:

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
- `voice.model` menimpa LLM yang digunakan hanya untuk respons saluran suara Discord. Biarkan tidak disetel untuk mewarisi model agen yang dirutekan.
- STT menggunakan `tools.media.audio`; `voice.model` tidak memengaruhi transkripsi.
- Penimpaan `systemPrompt` Discord per saluran berlaku pada giliran transkrip suara untuk saluran suara tersebut.
- Giliran transkrip suara memperoleh status pemilik dari `allowFrom` Discord (atau `dm.allowFrom`); pembicara non-pemilik tidak dapat mengakses alat khusus pemilik (misalnya `gateway` dan `cron`).
- Suara Discord harus diaktifkan secara eksplisit untuk konfigurasi hanya teks; atur `channels.discord.voice.enabled=true` (atau pertahankan blok `channels.discord.voice` yang sudah ada) untuk mengaktifkan perintah `/vc`, waktu jalan suara, dan intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` dapat secara eksplisit menimpa langganan intent status suara. Biarkan tidak disetel agar intent mengikuti pengaktifan suara efektif.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi bergabung `@discordjs/voice`.
- Bawaan `@discordjs/voice` adalah `daveEncryption=true` dan `decryptionFailureTolerance=24` jika tidak disetel.
- `voice.connectTimeoutMs` mengontrol penantian awal `Ready` `@discordjs/voice` untuk upaya `/vc join` dan bergabung otomatis. Bawaan: `30000`.
- `voice.reconnectGraceMs` mengontrol berapa lama OpenClaw menunggu sesi suara yang terputus untuk mulai menyambung ulang sebelum menghancurkannya. Bawaan: `15000`.
- OpenClaw juga memantau kegagalan dekripsi penerimaan dan memulihkan otomatis dengan keluar/bergabung kembali ke saluran suara setelah kegagalan berulang dalam jendela waktu singkat.
- Jika log penerimaan berulang kali menampilkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` setelah pembaruan, kumpulkan laporan dependensi dan log. Rangkaian `@discordjs/voice` yang dibundel mencakup perbaikan padding hulu dari PR discord.js #11449, yang menutup isu discord.js #11419.

Alur saluran suara:

- Tangkapan PCM Discord dikonversi menjadi file sementara WAV.
- `tools.media.audio` menangani STT, misalnya `openai/gpt-4o-mini-transcribe`.
- Transkrip dikirim melalui ingres dan perutean Discord sementara LLM respons berjalan dengan kebijakan keluaran suara yang menyembunyikan alat `tts` agen dan meminta teks yang dikembalikan, karena suara Discord menangani pemutaran TTS akhir.
- `voice.model`, ketika disetel, hanya menimpa LLM respons untuk giliran saluran suara ini.
- `voice.tts` digabungkan menimpa `messages.tts`; audio yang dihasilkan diputar di saluran yang sudah dimasuki.

Kredensial diselesaikan per komponen: autentikasi rute LLM untuk `voice.model`, autentikasi STT untuk `tools.media.audio`, dan autentikasi TTS untuk `messages.tts`/`voice.tts`.

### Pesan suara

Pesan suara Discord menampilkan pratinjau gelombang dan memerlukan audio OGG/Opus. OpenClaw menghasilkan gelombang secara otomatis, tetapi memerlukan `ffmpeg` dan `ffprobe` pada host Gateway untuk memeriksa dan mengonversi.

- Berikan **jalur file lokal** (URL ditolak).
- Hilangkan konten teks (Discord menolak teks + pesan suara dalam muatan yang sama).
- Format audio apa pun diterima; OpenClaw mengonversinya ke OGG/Opus sesuai kebutuhan.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Menggunakan intent yang tidak diizinkan atau bot tidak melihat pesan guild">

    - aktifkan Intent Konten Pesan
    - aktifkan Intent Anggota Server ketika Anda bergantung pada penyelesaian pengguna/anggota
    - mulai ulang Gateway setelah mengubah intent

  </Accordion>

  <Accordion title="Pesan guild diblokir secara tidak terduga">

    - verifikasi `groupPolicy`
    - verifikasi daftar izin guild di bawah `channels.discord.guilds`
    - jika peta `channels` guild ada, hanya saluran yang tercantum yang diizinkan
    - verifikasi perilaku `requireMention` dan pola penyebutan

    Pemeriksaan berguna:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Penyebutan wajib false tetapi tetap diblokir">
    Penyebab umum:

    - `groupPolicy="allowlist"` tanpa daftar izin guild/saluran yang cocok
    - `requireMention` dikonfigurasi di tempat yang salah (harus berada di bawah `channels.discord.guilds` atau entri saluran)
    - pengirim diblokir oleh daftar izin `users` guild/saluran

  </Accordion>

  <Accordion title="Giliran Discord yang berjalan lama atau balasan duplikat">

    Log umum:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Pengaturan antrean Gateway Discord:

    - satu akun: `channels.discord.eventQueue.listenerTimeout`
    - multiakun: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ini hanya mengontrol pekerjaan pendengar Gateway Discord, bukan masa hidup giliran agen

    Discord tidak menerapkan batas waktu milik saluran pada giliran agen yang mengantre. Pendengar pesan langsung menyerahkan pekerjaan, dan eksekusi Discord yang mengantre mempertahankan urutan per sesi hingga siklus hidup sesi/alat/waktu jalan selesai atau membatalkan pekerjaan.

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
    OpenClaw mengambil metadata Discord `/gateway/bot` sebelum terhubung. Kegagalan sementara akan kembali menggunakan URL gateway default Discord dan dibatasi lajunya di log.

    Kenop timeout metadata:

    - akun tunggal: `channels.discord.gatewayInfoTimeoutMs`
    - multi-akun: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env saat config tidak diatur: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - default: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Restart timeout READY Gateway">
    OpenClaw menunggu event `READY` gateway Discord selama startup dan setelah koneksi ulang runtime. Pengaturan multi-akun dengan stagger startup dapat memerlukan jendela READY startup yang lebih lama daripada default.

    Kenop timeout READY:

    - startup akun tunggal: `channels.discord.gatewayReadyTimeoutMs`
    - startup multi-akun: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env startup saat config tidak diatur: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - default startup: `15000` (15 detik), maks: `120000`
    - runtime akun tunggal: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-akun: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env runtime saat config tidak diatur: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - default runtime: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Ketidakcocokan audit izin">
    Pemeriksaan izin `channels status --probe` hanya berfungsi untuk ID channel numerik.

    Jika Anda menggunakan kunci slug, pencocokan runtime masih dapat berfungsi, tetapi probe tidak dapat memverifikasi izin sepenuhnya.

  </Accordion>

  <Accordion title="Masalah DM dan pairing">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - Kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - menunggu persetujuan pairing dalam mode `pairing`

  </Accordion>

  <Accordion title="Loop bot ke bot">
    Secara default, pesan yang dibuat bot diabaikan.

    Jika Anda mengatur `channels.discord.allowBots=true`, gunakan aturan mention dan allowlist yang ketat untuk menghindari perilaku loop.
    Lebih baik gunakan `channels.discord.allowBots="mentions"` untuk hanya menerima pesan bot yang me-mention bot tersebut.

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

  <Accordion title="Voice STT terhenti dengan DecryptionFailed(...)">

    - pastikan OpenClaw tetap terkini (`openclaw update`) agar logika pemulihan penerimaan suara Discord tersedia
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

<Accordion title="Field Discord sinyal tinggi">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- kebijakan: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- perintah: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- antrean event: `eventQueue.listenerTimeout` (anggaran listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- balasan/riwayat: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/coba ulang: `mediaMaxMb` (membatasi unggahan Discord keluar, default `100MB`), `retry`
- tindakan: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- fitur: `threadBindings`, `bindings[]` tingkat atas (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Keamanan dan operasi

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` lebih disarankan di lingkungan yang diawasi).
- Berikan izin Discord dengan hak istimewa minimum.
- Jika deploy/status perintah sudah usang, restart gateway dan periksa ulang dengan `openclaw channels status --probe`.

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pair pengguna Discord ke gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku chat grup dan allowlist.
  </Card>
  <Card title="Routing channel" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan hardening.
  </Card>
  <Card title="Routing multi-agen" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan guild dan channel ke agen.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native.
  </Card>
</CardGroup>
