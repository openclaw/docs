---
read_when:
    - Mengerjakan fitur saluran Discord
summary: Status dukungan, kapabilitas, dan konfigurasi bot Discord
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

Siap untuk DM dan kanal guild melalui Discord gateway resmi.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM Discord secara default menggunakan mode pairing.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah kanal" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas kanal dan alur perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

Anda perlu membuat aplikasi baru dengan bot, menambahkan bot ke server Anda, dan memasangkannya ke OpenClaw. Kami menyarankan menambahkan bot Anda ke server pribadi Anda sendiri. Jika Anda belum memilikinya, [buat terlebih dahulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (pilih **Create My Own > For me and my friends**).

<Steps>
  <Step title="Buat aplikasi dan bot Discord">
    Buka [Discord Developer Portal](https://discord.com/developers/applications) dan klik **New Application**. Beri nama seperti "OpenClaw".

    Klik **Bot** di bilah sisi. Atur **Username** ke nama apa pun yang Anda gunakan untuk agen OpenClaw Anda.

  </Step>

  <Step title="Aktifkan intent dengan hak istimewa">
    Masih di halaman **Bot**, gulir ke bawah ke **Privileged Gateway Intents** dan aktifkan:

    - **Message Content Intent** (wajib)
    - **Server Members Intent** (disarankan; wajib untuk daftar izin peran dan pencocokan nama-ke-ID)
    - **Presence Intent** (opsional; hanya diperlukan untuk pembaruan presence)

  </Step>

  <Step title="Salin token bot Anda">
    Gulir kembali ke atas pada halaman **Bot** dan klik **Reset Token**.

    <Note>
    Terlepas dari namanya, ini menghasilkan token pertama Anda — tidak ada yang sedang "direset."
    </Note>

    Salin token dan simpan di suatu tempat. Ini adalah **Bot Token** Anda dan Anda akan membutuhkannya sebentar lagi.

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
    Salin URL yang dibuat di bagian bawah, tempelkan ke browser Anda, pilih server Anda, lalu klik **Continue** untuk menghubungkan. Anda sekarang seharusnya melihat bot Anda di server Discord.

  </Step>

  <Step title="Aktifkan Developer Mode dan kumpulkan ID Anda">
    Kembali ke aplikasi Discord, Anda perlu mengaktifkan Developer Mode agar dapat menyalin ID internal.

    1. Klik **User Settings** (ikon roda gigi di samping avatar Anda) → **Advanced** → aktifkan **Developer Mode**
    2. Klik kanan **server icon** Anda di bilah sisi → **Copy Server ID**
    3. Klik kanan **own avatar** Anda → **Copy User ID**

    Simpan **Server ID** dan **User ID** Anda bersama Bot Token Anda — Anda akan mengirim ketiganya ke OpenClaw pada langkah berikutnya.

  </Step>

  <Step title="Izinkan DM dari anggota server">
    Agar pairing berfungsi, Discord perlu mengizinkan bot Anda mengirim DM kepada Anda. Klik kanan **server icon** Anda → **Privacy Settings** → aktifkan **Direct Messages**.

    Ini memungkinkan anggota server (termasuk bot) mengirim DM kepada Anda. Biarkan ini aktif jika Anda ingin menggunakan DM Discord dengan OpenClaw. Jika Anda hanya berencana menggunakan kanal guild, Anda dapat menonaktifkan DM setelah pairing.

  </Step>

  <Step title="Atur token bot Anda secara aman (jangan kirim di chat)">
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
    Untuk instalasi layanan terkelola, jalankan `openclaw gateway install` dari shell tempat `DISCORD_BOT_TOKEN` tersedia, atau simpan variabel tersebut di `~/.openclaw/.env`, agar layanan dapat menyelesaikan SecretRef env setelah mulai ulang.
    Jika host Anda diblokir atau dibatasi laju oleh pencarian aplikasi startup Discord, atur ID aplikasi/klien Discord dari Developer Portal agar startup dapat melewati panggilan REST tersebut. Gunakan `channels.discord.applicationId` untuk akun default, atau `channels.discord.accounts.<accountId>.applicationId` saat Anda menjalankan beberapa bot Discord.

  </Step>

  <Step title="Konfigurasikan OpenClaw dan lakukan pairing">

    <Tabs>
      <Tab title="Tanya agen Anda">
        Chat dengan agen OpenClaw Anda di kanal yang sudah ada (misalnya Telegram) dan beri tahu. Jika Discord adalah kanal pertama Anda, gunakan tab CLI / config sebagai gantinya.

        > "Saya sudah mengatur token bot Discord saya di config. Selesaikan penyiapan Discord dengan User ID `<user_id>` dan Server ID `<server_id>`."
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

        Untuk penyiapan terskrip atau jarak jauh, tulis blok JSON5 yang sama dengan `openclaw config patch --file ./discord.patch.json5 --dry-run`, lalu jalankan ulang tanpa `--dry-run`. Nilai `token` plaintext didukung. Nilai SecretRef juga didukung untuk `channels.discord.token` di seluruh penyedia env/file/exec. Lihat [Manajemen Secrets](/id/gateway/secrets).

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

  <Step title="Setujui pairing DM pertama">
    Tunggu sampai gateway berjalan, lalu kirim DM ke bot Anda di Discord. Bot akan merespons dengan kode pairing.

    <Tabs>
      <Tab title="Tanya agen Anda">
        Kirim kode pairing ke agen Anda di kanal yang sudah ada:

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
Resolusi token sadar akun. Nilai token config mengalahkan fallback env. `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Jika dua akun Discord yang aktif diselesaikan ke token bot yang sama, OpenClaw hanya memulai satu pemantau gateway untuk token tersebut. Token yang bersumber dari config mengalahkan fallback env default; jika tidak, akun aktif pertama menang dan akun duplikat dilaporkan dinonaktifkan.
Untuk panggilan outbound lanjutan (alat pesan/tindakan kanal), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk tindakan send dan read/probe-style (misalnya read/search/fetch/thread/pins/permissions). Kebijakan akun/pengaturan percobaan ulang tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Disarankan: Siapkan workspace guild

Setelah DM berfungsi, Anda dapat menyiapkan server Discord Anda sebagai workspace penuh tempat setiap kanal mendapatkan sesi agennya sendiri dengan konteksnya sendiri. Ini disarankan untuk server pribadi yang hanya berisi Anda dan bot Anda.

<Steps>
  <Step title="Tambahkan server Anda ke daftar izin guild">
    Ini memungkinkan agen Anda merespons di kanal mana pun di server Anda, bukan hanya DM.

    <Tabs>
      <Tab title="Tanya agen Anda">
        > "Tambahkan Discord Server ID `<server_id>` saya ke daftar izin guild"
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

    Di kanal guild, balasan akhir asisten normal tetap privat secara default. Output Discord yang terlihat harus dikirim secara eksplisit dengan alat `message`, sehingga agen dapat mengamati secara default dan hanya memposting ketika memutuskan bahwa balasan kanal berguna.

    Ini berarti model yang dipilih harus dapat memanggil alat dengan andal. Jika Discord menampilkan sedang mengetik dan log menunjukkan penggunaan token tetapi tidak ada pesan yang diposting, periksa log sesi untuk teks asisten dengan `didSendViaMessagingTool: false`. Itu berarti model menghasilkan jawaban akhir privat alih-alih memanggil `message(action=send)`. Beralihlah ke model pemanggilan alat yang lebih kuat, atau gunakan config di bawah untuk memulihkan balasan akhir otomatis lama.

    <Tabs>
      <Tab title="Tanya agen Anda">
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

        Untuk memulihkan balasan akhir otomatis lama untuk ruang grup/kanal, atur `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Rencanakan memori di kanal guild">
    Secara default, memori jangka panjang (MEMORY.md) hanya dimuat dalam sesi DM. Kanal guild tidak memuat MEMORY.md secara otomatis.

    <Tabs>
      <Tab title="Tanya agen Anda">
        > "Saat saya mengajukan pertanyaan di kanal Discord, gunakan memory_search atau memory_get jika Anda memerlukan konteks jangka panjang dari MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Jika Anda membutuhkan konteks bersama di setiap kanal, letakkan instruksi stabil di `AGENTS.md` atau `USER.md` (keduanya diinjeksi untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan dengan alat memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat beberapa kanal di server Discord Anda dan mulai chat. Agen Anda dapat melihat nama kanal, dan setiap kanal mendapatkan sesi terisolasinya sendiri — jadi Anda dapat menyiapkan `#coding`, `#home`, `#research`, atau apa pun yang cocok dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan masuk Discord kembali ke Discord.
- Metadata guild/channel Discord ditambahkan ke prompt model sebagai konteks tidak tepercaya,
  bukan sebagai prefiks balasan yang terlihat oleh pengguna. Jika model menyalin envelope itu
  kembali, OpenClaw menghapus metadata yang disalin dari balasan keluar dan dari
  konteks replay berikutnya.
- Secara default (`session.dmScope=main`), obrolan langsung berbagi sesi utama agen (`agent:main:main`).
- Channel guild adalah kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- DM grup diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Perintah slash native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.
- Pengiriman pengumuman cron/heartbeat teks-saja ke Discord menggunakan jawaban akhir
  yang terlihat oleh asisten satu kali. Payload media dan komponen terstruktur tetap
  berupa banyak pesan ketika agen memancarkan beberapa payload yang dapat dikirim.

## Channel forum

Channel forum dan media Discord hanya menerima posting thread. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke induk forum (`channel:<forumId>`) untuk membuat thread otomatis. Judul thread menggunakan baris pertama yang tidak kosong dari pesan Anda.
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

Induk forum tidak menerima komponen Discord. Jika Anda memerlukan komponen, kirim ke thread itu sendiri (`channel:<threadId>`).

## Komponen interaktif

OpenClaw mendukung kontainer komponen Discord v2 untuk pesan agen. Gunakan alat pesan dengan payload `components`. Hasil interaksi dirutekan kembali ke agen sebagai pesan masuk normal dan mengikuti pengaturan Discord `replyToMode` yang ada.

Blok yang didukung:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Baris aksi mengizinkan hingga 5 tombol atau satu menu pilih
- Jenis pilih: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya sekali pakai. Atur `components.reusable=true` untuk mengizinkan tombol, pilihan, dan formulir digunakan beberapa kali hingga kedaluwarsa.

Untuk membatasi siapa yang dapat mengklik tombol, atur `allowedUsers` pada tombol tersebut (ID pengguna Discord, tag, atau `*`). Saat dikonfigurasi, pengguna yang tidak cocok menerima penolakan ephemeral.

Perintah slash `/model` dan `/models` membuka pemilih model interaktif dengan dropdown provider, model, dan runtime yang kompatibel serta langkah Submit. `/models add` tidak digunakan lagi dan sekarang mengembalikan pesan penghentian penggunaan alih-alih mendaftarkan model dari chat. Balasan pemilih bersifat ephemeral dan hanya pengguna yang memanggilnya yang dapat menggunakannya. Menu pilih Discord dibatasi hingga 25 opsi, jadi tambahkan entri `provider/*` ke `agents.defaults.models` ketika Anda ingin pemilih menampilkan model yang ditemukan secara dinamis hanya untuk provider terpilih seperti `openai-codex` atau `vllm`.

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` mengontrol akses DM. `channels.discord.allowFrom` adalah allowlist DM kanonis.

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.discord.allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    Jika kebijakan DM tidak terbuka, pengguna tidak dikenal diblokir (atau diminta untuk pairing dalam mode `pairing`).

    Presedensi multi-akun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Untuk satu akun, `allowFrom` memiliki prioritas atas `dm.allowFrom` lama.
    - Akun bernama mewarisi `channels.discord.allowFrom` ketika `allowFrom` miliknya sendiri dan `dm.allowFrom` lama tidak diatur.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` dan `channels.discord.dm.allowFrom` lama masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` ketika dapat melakukannya tanpa mengubah akses.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - mention `<@id>`

    ID numerik polos biasanya di-resolve sebagai ID channel ketika default channel aktif, tetapi ID yang tercantum dalam DM `allowFrom` efektif akun diperlakukan sebagai target DM pengguna untuk kompatibilitas.

  </Tab>

  <Tab title="Access groups">
    Otorisasi DM Discord dan perintah teks dapat menggunakan entri `accessGroup:<name>` dinamis di `channels.discord.allowFrom`.

    Nama grup akses dibagikan di seluruh channel pesan. Gunakan `type: "message.senders"` untuk grup statis yang anggotanya diekspresikan dalam sintaks `allowFrom` normal masing-masing channel, atau `type: "discord.channelAudience"` ketika audiens `ViewChannel` saat ini dari channel Discord harus menentukan keanggotaan secara dinamis. Perilaku grup akses bersama didokumentasikan di sini: [Grup akses](/id/channels/access-groups).

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

    Channel teks Discord tidak memiliki daftar anggota terpisah. `type: "discord.channelAudience"` memodelkan keanggotaan sebagai: pengirim DM adalah anggota guild yang dikonfigurasi dan saat ini memiliki izin `ViewChannel` efektif pada channel yang dikonfigurasi setelah role dan penimpaan channel diterapkan.

    Contoh: izinkan siapa pun yang dapat melihat `#maintainers` untuk mengirim DM ke bot, sambil tetap menutup DM untuk semua orang lain.

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

    Pencarian gagal tertutup. Jika Discord mengembalikan `Missing Access`, pencarian anggota gagal, atau channel milik guild berbeda, pengirim DM diperlakukan sebagai tidak berwenang.

    Aktifkan **Server Members Intent** Discord Developer Portal untuk bot saat menggunakan grup akses audiens channel. DM tidak menyertakan status anggota guild, jadi OpenClaw me-resolve anggota melalui REST Discord pada waktu otorisasi.

  </Tab>

  <Tab title="Guild policy">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman ketika `channels.discord` ada adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` lebih disarankan, slug diterima)
    - allowlist pengirim opsional: `users` (ID stabil disarankan) dan `roles` (hanya ID role); jika salah satu dikonfigurasi, pengirim diizinkan ketika cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag langsung dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memperingatkan ketika entri nama/tag digunakan
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
    Pesan guild dibatasi mention secara default.

    Deteksi mention mencakup:

    - mention bot eksplisit
    - pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku balas-ke-bot implisit dalam kasus yang didukung

    Saat menulis pesan Discord keluar, gunakan sintaks mention kanonis: `<@USER_ID>` untuk pengguna, `<#CHANNEL_ID>` untuk channel, dan `<@&ROLE_ID>` untuk role. Jangan gunakan bentuk mention nama panggilan lama `<@!USER_ID>`.

    `requireMention` dikonfigurasi per guild/channel (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional menghapus pesan yang menyebut pengguna/role lain tetapi bukan bot (mengecualikan @everyone/@here).

    DM grup:

    - default: diabaikan (`dm.groupEnabled=false`)
    - allowlist opsional melalui `dm.groupChannels` (ID channel atau slug)

  </Tab>
</Tabs>

### Perutean agen berbasis role

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agen berbeda berdasarkan ID role. Binding berbasis role hanya menerima ID role dan dievaluasi setelah binding peer atau parent-peer serta sebelum binding khusus guild. Jika sebuah binding juga menetapkan bidang match lain (misalnya `peer` + `guildId` + `roles`), semua bidang yang dikonfigurasi harus cocok.

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

- `commands.native` defaultnya `"auto"` dan diaktifkan untuk Discord.
- Penggantian per-channel: `channels.discord.commands.native`.
- `commands.native=false` melewati pendaftaran dan pembersihan slash-command Discord selama startup. Perintah yang sebelumnya terdaftar mungkin tetap terlihat di Discord sampai Anda menghapusnya dari aplikasi Discord.
- Autentikasi perintah native menggunakan allowlist/kebijakan Discord yang sama seperti penanganan pesan normal.
- Perintah mungkin tetap terlihat di UI Discord bagi pengguna yang tidak diotorisasi; eksekusi tetap memberlakukan autentikasi OpenClaw dan mengembalikan "not authorized".

Lihat [Slash commands](/id/tools/slash-commands) untuk katalog dan perilaku perintah.

Pengaturan slash command default:

- `ephemeral: true`

## Detail fitur

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord mendukung tag balasan dalam output agen:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Dikendalikan oleh `channels.discord.replyToMode`:

    - `off` (default)
    - `first`
    - `all`
    - `batched`

    Catatan: `off` menonaktifkan threading balasan implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.
    `first` selalu melampirkan referensi balasan native implisit ke pesan Discord keluar pertama untuk giliran tersebut.
    `batched` hanya melampirkan referensi balasan native implisit Discord ketika
    giliran masuk adalah batch debounced dari beberapa pesan. Ini berguna
    ketika Anda menginginkan balasan native terutama untuk chat bursty yang ambigu, bukan setiap
    giliran pesan tunggal.

    ID pesan ditampilkan dalam konteks/riwayat sehingga agen dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw dapat melakukan streaming draf balasan dengan mengirim pesan sementara dan mengeditnya saat teks masuk. `channels.discord.streaming` menerima `off` | `partial` | `block` | `progress` (default). `progress` mempertahankan satu draf status yang dapat diedit dan memperbaruinya dengan progres alat sampai pengiriman final; label awal bersama adalah baris bergulir, sehingga akan tergulir seperti yang lain setelah cukup banyak pekerjaan muncul. `streamMode` adalah alias runtime lama. Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi tersimpan ke kunci kanonis.

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

    - `partial` mengedit satu pesan pratinjau saat token masuk.
    - `block` memancarkan potongan berukuran draf (gunakan `draftChunk` untuk menyesuaikan ukuran dan titik jeda, dibatasi ke `textChunkLimit`).
    - Final media, kesalahan, dan balasan eksplisit membatalkan edit pratinjau yang tertunda.
    - `streaming.preview.toolProgress` (default `true`) mengontrol apakah pembaruan alat/progres menggunakan ulang pesan pratinjau.
    - Baris alat/progres dirender sebagai emoji ringkas + judul + detail bila tersedia, misalnya `🛠️ Bash: run tests` atau `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` mengontrol detail perintah/exec dalam baris progres ringkas: `raw` (default) atau `status` (hanya label alat).

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

  <Accordion title="History, context, and thread behavior">
    Konteks riwayat guild:

    - Default `channels.discord.historyLimit` adalah `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Kontrol riwayat DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Perilaku thread:

    - Thread Discord dirutekan sebagai sesi channel dan mewarisi konfigurasi channel induk kecuali diganti.
    - Sesi thread mewarisi pilihan `/model` tingkat sesi milik channel induk sebagai fallback khusus model; pilihan `/model` lokal thread tetap diprioritaskan dan riwayat transkrip induk tidak disalin kecuali pewarisan transkrip diaktifkan.
    - `channels.discord.thread.inheritParent` (default `false`) mengikutsertakan auto-thread baru untuk disemai dari transkrip induk. Penggantian per-akun berada di bawah `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaksi alat pesan dapat menyelesaikan target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` dipertahankan selama fallback aktivasi tahap balasan.

    Topik channel disuntikkan sebagai konteks **tidak tepercaya**. Allowlist membatasi siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan penuh.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord dapat mengikat thread ke target sesi sehingga pesan lanjutan di thread tersebut tetap dirutekan ke sesi yang sama (termasuk sesi subagen).

    Perintah:

    - `/focus <target>` ikat thread saat ini/baru ke target subagen/sesi
    - `/unfocus` hapus pengikatan thread saat ini
    - `/agents` tampilkan run aktif dan status pengikatan
    - `/session idle <duration|off>` periksa/perbarui auto-unfocus karena tidak aktif untuk pengikatan terfokus
    - `/session max-age <duration|off>` periksa/perbarui usia maksimum keras untuk pengikatan terfokus

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

    - `session.threadBindings.*` menetapkan default global.
    - `channels.discord.threadBindings.*` mengganti perilaku Discord.
    - `spawnSessions` mengontrol pembuatan/pengikatan thread otomatis untuk `sessions_spawn({ thread: true })` dan spawn thread ACP. Default: `true`.
    - `defaultSpawnContext` mengontrol konteks subagen native untuk spawn yang terikat thread. Default: `"fork"`.
    - Kunci `spawnSubagentSessions`/`spawnAcpSessions` yang tidak digunakan lagi dimigrasikan oleh `openclaw doctor --fix`.
    - Jika pengikatan thread dinonaktifkan untuk akun, `/focus` dan operasi pengikatan thread terkait tidak tersedia.

    Lihat [Sub-agents](/id/tools/subagents), [ACP Agents](/id/tools/acp-agents), dan [Configuration Reference](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Untuk workspace ACP stabil yang "always-on", konfigurasikan pengikatan ACP bertipe tingkat atas yang menargetkan percakapan Discord.

    Path konfigurasi:

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

    - `/acp spawn codex --bind here` mengikat channel atau thread saat ini di tempat dan menjaga pesan berikutnya tetap pada sesi ACP yang sama. Pesan thread mewarisi pengikatan channel induk.
    - Dalam channel atau thread yang terikat, `/new` dan `/reset` mereset sesi ACP yang sama di tempat. Pengikatan thread sementara dapat mengganti resolusi target saat aktif.
    - `spawnSessions` membatasi pembuatan/pengikatan thread anak melalui `--thread auto|here`.

    Lihat [ACP Agents](/id/tools/acp-agents) untuk detail perilaku pengikatan.

  </Accordion>

  <Accordion title="Reaction notifications">
    Mode notifikasi reaksi per-guild:

    - `off`
    - `own` (default)
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
    - Gunakan `""` untuk menonaktifkan reaksi bagi channel atau akun.

  </Accordion>

  <Accordion title="Config writes">
    Penulisan konfigurasi yang diprakarsai channel diaktifkan secara default.

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
    Rutekan trafik WebSocket Gateway Discord dan lookup REST startup (ID aplikasi + resolusi allowlist) melalui proxy HTTP(S) dengan `channels.discord.proxy`.

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
    - lookup menggunakan ID pesan asli dan dibatasi jendela waktu
    - jika lookup gagal, pesan yang diproksi diperlakukan sebagai pesan bot dan dibuang kecuali `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Gunakan `mentionAliases` ketika agen membutuhkan mention keluar deterministik untuk pengguna Discord yang diketahui. Kunci adalah handle tanpa awalan `@`; nilai adalah ID pengguna Discord. Handle tidak dikenal, `@everyone`, `@here`, dan mention di dalam rentang kode Markdown dibiarkan tidak berubah.

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
    Pembaruan presence diterapkan ketika Anda menetapkan kolom status atau aktivitas, atau ketika Anda mengaktifkan presence otomatis.

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

    Contoh aktivitas (status kustom adalah tipe aktivitas default):

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
    Discord mendukung penanganan persetujuan berbasis tombol di DM dan secara opsional dapat memposting prompt persetujuan di saluran asal.

    Jalur konfigurasi:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; kembali ke `commands.ownerAllowFrom` jika memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord mengaktifkan persetujuan eksekusi native secara otomatis ketika `enabled` tidak disetel atau `"auto"` dan setidaknya satu pemberi persetujuan dapat diselesaikan, baik dari `execApprovals.approvers` maupun dari `commands.ownerAllowFrom`. Discord tidak menyimpulkan pemberi persetujuan eksekusi dari `allowFrom` saluran, `dm.allowFrom` lama, atau `defaultTo` pesan langsung. Setel `enabled: false` untuk menonaktifkan Discord secara eksplisit sebagai klien persetujuan native.

    Untuk perintah grup sensitif yang hanya untuk pemilik seperti `/diagnostics` dan `/export-trajectory`, OpenClaw mengirim prompt persetujuan dan hasil akhir secara privat. OpenClaw mencoba DM Discord terlebih dahulu ketika pemilik yang memanggil memiliki rute pemilik Discord; jika tidak tersedia, OpenClaw kembali ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, seperti Telegram.

    Ketika `target` adalah `channel` atau `both`, prompt persetujuan terlihat di saluran. Hanya pemberi persetujuan yang terselesaikan yang dapat menggunakan tombol; pengguna lain menerima penolakan ephemeral. Prompt persetujuan menyertakan teks perintah, jadi aktifkan pengiriman saluran hanya di saluran tepercaya. Jika ID saluran tidak dapat diturunkan dari kunci sesi, OpenClaw kembali ke pengiriman DM.

    Discord juga merender tombol persetujuan bersama yang digunakan oleh saluran obrolan lain. Adapter Discord native terutama menambahkan perutean DM pemberi persetujuan dan fanout saluran.
    Ketika tombol tersebut ada, tombol itu menjadi UX persetujuan utama; OpenClaw
    sebaiknya hanya menyertakan perintah `/approve` manual ketika hasil alat menyatakan
    persetujuan obrolan tidak tersedia atau persetujuan manual adalah satu-satunya jalur.
    Jika runtime persetujuan native Discord tidak aktif, OpenClaw menjaga
    prompt lokal deterministik `/approve <id> <decision>` tetap terlihat. Jika
    runtime aktif tetapi kartu native tidak dapat dikirim ke target mana pun,
    OpenClaw mengirim pemberitahuan fallback di obrolan yang sama dengan perintah `/approve`
    persis dari persetujuan tertunda.

    Autentikasi Gateway dan penyelesaian persetujuan mengikuti kontrak klien Gateway bersama (ID `plugin:` diselesaikan melalui `plugin.approval.resolve`; ID lain melalui `exec.approval.resolve`). Persetujuan kedaluwarsa setelah 30 menit secara default.

    Lihat [Persetujuan eksekusi](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Alat dan gerbang tindakan

Tindakan pesan Discord mencakup tindakan perpesanan, admin saluran, moderasi, kehadiran, dan metadata.

Contoh inti:

- perpesanan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- kehadiran: `setPresence`

Tindakan `event-create` menerima parameter `image` opsional (URL atau jalur file lokal) untuk menyetel gambar sampul acara terjadwal.

Gerbang tindakan berada di bawah `channels.discord.actions.*`.

Perilaku gerbang default:

| Grup tindakan                                                                                                                                                            | Default    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reaksi, pesan, thread, pin, polling, pencarian, infoAnggota, infoPeran, infoSaluran, saluran, statusSuara, acara, stiker, unggahanEmoji, unggahanStiker, izin             | diaktifkan |
| peran                                                                                                                                                                    | dinonaktifkan |
| moderasi                                                                                                                                                                | dinonaktifkan |
| kehadiran                                                                                                                                                               | dinonaktifkan |

## UI Components v2

OpenClaw menggunakan components v2 Discord untuk persetujuan eksekusi dan penanda lintas konteks. Tindakan pesan Discord juga dapat menerima `components` untuk UI kustom (lanjutan; memerlukan pembuatan payload komponen melalui alat discord), sementara `embeds` lama tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` menyetel warna aksen yang digunakan oleh kontainer komponen Discord (hex).
- Setel per akun dengan `channels.discord.accounts.<id>.ui.components.accentColor`.
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

Discord memiliki dua permukaan suara yang berbeda: **saluran suara** realtime (percakapan berkelanjutan) dan **lampiran pesan suara** (format pratinjau waveform). Gateway mendukung keduanya.

### Saluran suara

Daftar periksa penyiapan:

1. Aktifkan Message Content Intent di Discord Developer Portal.
2. Aktifkan Server Members Intent ketika daftar izin peran/pengguna digunakan.
3. Undang bot dengan cakupan `bot` dan `applications.commands`.
4. Berikan Connect, Speak, Send Messages, dan Read Message History di saluran suara target.
5. Aktifkan perintah native (`commands.native` atau `channels.discord.commands.native`).
6. Konfigurasikan `channels.discord.voice`.

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

Contoh gabung otomatis:

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
          voice: "cedar",
        },
      },
    },
  },
}
```

Catatan:

- `voice.tts` menimpa `messages.tts` hanya untuk pemutaran suara `stt-tts`. Mode realtime menggunakan `voice.realtime.voice`.
- `voice.mode` mengontrol jalur percakapan. Default-nya adalah `agent-proxy`: antarmuka depan suara realtime menangani pengaturan waktu giliran, interupsi, dan pemutaran, mendelegasikan pekerjaan substantif ke agen OpenClaw yang dirutekan melalui `openclaw_agent_consult`, dan memperlakukan hasilnya seperti prompt Discord yang diketik dari pembicara tersebut. `stt-tts` mempertahankan alur STT batch lama plus TTS. `bidi` memungkinkan model realtime bercakap langsung sambil mengekspos `openclaw_agent_consult` untuk otak OpenClaw.
- `voice.agentSession` mengontrol percakapan OpenClaw mana yang menerima giliran suara. Biarkan tidak diatur untuk sesi milik kanal suara itu sendiri, atau atur `{ mode: "target", target: "channel:<text-channel-id>" }` agar kanal suara bertindak sebagai ekstensi mikrofon/speaker dari sesi kanal teks Discord yang sudah ada seperti `#maintainers`.
- `voice.model` menimpa otak agen OpenClaw untuk respons suara Discord dan konsultasi realtime. Biarkan tidak diatur untuk mewarisi model agen yang dirutekan. Ini terpisah dari `voice.realtime.model`.
- `agent-proxy` merutekan ucapan melalui `discord-voice`, yang mempertahankan otorisasi pemilik/alat normal untuk pembicara dan sesi target tetapi menyembunyikan alat `tts` agen karena suara Discord memiliki pemutaran. Secara default, `agent-proxy` memberi konsultasi akses alat penuh yang setara pemilik untuk pembicara pemilik (`voice.realtime.toolPolicy: "owner"`) dan sangat mengutamakan konsultasi dengan agen OpenClaw sebelum jawaban substantif (`voice.realtime.consultPolicy: "always"`). Dalam mode default `always` tersebut, lapisan realtime tidak otomatis mengucapkan pengisi sebelum jawaban konsultasi; lapisan itu menangkap dan mentranskripsi ucapan, lalu mengucapkan jawaban OpenClaw yang dirutekan. Jika beberapa jawaban konsultasi paksa selesai saat Discord masih memutar jawaban pertama, jawaban ucapan persis berikutnya akan diantrekan hingga pemutaran menganggur, bukan mengganti ucapan di tengah kalimat.
- Dalam mode `stt-tts`, STT menggunakan `tools.media.audio`; `voice.model` tidak memengaruhi transkripsi.
- Dalam mode realtime, `voice.realtime.provider`, `voice.realtime.model`, dan `voice.realtime.voice` mengonfigurasi sesi audio realtime. Untuk OpenAI Realtime 2 plus otak Codex, gunakan `voice.realtime.model: "gpt-realtime-2"` dan `voice.model: "openai-codex/gpt-5.5"`.
- Penyedia realtime OpenAI menerima nama peristiwa Realtime 2 saat ini dan alias lama yang kompatibel dengan Codex untuk peristiwa audio output dan transkrip, sehingga snapshot penyedia yang kompatibel dapat bergeser tanpa menghentikan audio asisten.
- `voice.realtime.bargeIn` mengontrol apakah peristiwa speaker-start Discord menginterupsi pemutaran realtime aktif. Jika tidak diatur, ini mengikuti pengaturan interupsi input-audio milik penyedia realtime.
- `voice.realtime.minBargeInAudioEndMs` mengontrol durasi minimum pemutaran asisten sebelum barge-in realtime OpenAI memotong audio. Default: `250`. Atur `0` untuk interupsi langsung di ruangan dengan gema rendah, atau naikkan untuk setup speaker dengan gema berat.
- Untuk suara OpenAI pada pemutaran Discord, atur `voice.tts.provider: "openai"` dan pilih suara Text-to-speech di bawah `voice.tts.openai.voice` atau `voice.tts.providers.openai.voice`. `cedar` adalah pilihan bersuara maskulin yang baik pada model TTS OpenAI saat ini.
- Penimpaan `systemPrompt` Discord per kanal berlaku untuk giliran transkrip suara bagi kanal suara tersebut.
- Giliran transkrip suara memperoleh status pemilik dari `allowFrom` Discord (atau `dm.allowFrom`); pembicara non-pemilik tidak dapat mengakses alat khusus pemilik (misalnya `gateway` dan `cron`).
- Suara Discord bersifat opt-in untuk konfigurasi teks saja; atur `channels.discord.voice.enabled=true` (atau pertahankan blok `channels.discord.voice` yang sudah ada) untuk mengaktifkan perintah `/vc`, runtime suara, dan intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` dapat secara eksplisit menimpa langganan intent voice-state. Biarkan tidak diatur agar intent mengikuti pengaktifan suara efektif.
- Jika `voice.autoJoin` memiliki beberapa entri untuk guild yang sama, OpenClaw bergabung ke kanal terakhir yang dikonfigurasi untuk guild tersebut.
- `voice.allowedChannels` adalah daftar izin residensi opsional. Biarkan tidak diatur untuk mengizinkan `/vc join` ke kanal suara Discord resmi mana pun. Saat diatur, `/vc join`, auto-join saat startup, dan perpindahan voice-state bot dibatasi ke entri `{ guildId, channelId }` yang tercantum. Atur ke array kosong untuk menolak semua join suara Discord. Jika Discord memindahkan bot ke luar daftar izin, OpenClaw meninggalkan kanal itu dan bergabung kembali ke target auto-join yang dikonfigurasi ketika tersedia.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi join `@discordjs/voice`.
- Default `@discordjs/voice` adalah `daveEncryption=true` dan `decryptionFailureTolerance=24` jika tidak diatur.
- OpenClaw menggunakan default decoder `opusscript` pure-JS untuk penerimaan suara Discord. Paket native opsional `@discordjs/opus` diabaikan oleh kebijakan instalasi pnpm repo sehingga instalasi normal, lane Docker, dan pengujian yang tidak terkait tidak mengompilasi addon native. Host performa suara khusus dapat ikut serta dengan `OPENCLAW_DISCORD_OPUS_DECODER=native` setelah menginstal addon native.
- `voice.connectTimeoutMs` mengontrol penantian Ready awal `@discordjs/voice` untuk upaya `/vc join` dan auto-join. Default: `30000`.
- `voice.reconnectGraceMs` mengontrol berapa lama OpenClaw menunggu sesi suara yang terputus mulai menyambung kembali sebelum menghancurkannya. Default: `15000`.
- Dalam mode `stt-tts`, pemutaran suara tidak berhenti hanya karena pengguna lain mulai berbicara. Untuk menghindari loop umpan balik, OpenClaw mengabaikan tangkapan suara baru saat TTS sedang diputar; berbicaralah setelah pemutaran selesai untuk giliran berikutnya. Mode realtime meneruskan speaker start sebagai sinyal barge-in ke penyedia realtime.
- Dalam mode realtime, gema dari speaker ke mikrofon terbuka dapat terlihat seperti barge-in dan menginterupsi pemutaran. Untuk ruangan Discord dengan gema berat, atur `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` agar OpenAI tidak otomatis menginterupsi pada audio input. Tambahkan `voice.realtime.bargeIn: true` jika Anda tetap ingin peristiwa speaker-start Discord menginterupsi pemutaran aktif. Bridge realtime OpenAI mengabaikan pemotongan pemutaran yang lebih pendek dari `voice.realtime.minBargeInAudioEndMs` sebagai kemungkinan gema/noise dan mencatatnya sebagai dilewati alih-alih membersihkan pemutaran Discord.
- `voice.captureSilenceGraceMs` mengontrol berapa lama OpenClaw menunggu setelah Discord melaporkan pembicara telah berhenti sebelum menyelesaikan segmen audio tersebut untuk STT. Default: `2500`; naikkan ini jika Discord membagi jeda normal menjadi transkrip parsial yang terputus-putus.
- Saat ElevenLabs adalah penyedia TTS yang dipilih, pemutaran suara Discord menggunakan TTS streaming dan dimulai dari stream respons penyedia. Penyedia tanpa dukungan streaming kembali ke jalur file sementara hasil sintesis.
- OpenClaw juga memantau kegagalan dekripsi penerimaan dan pulih otomatis dengan meninggalkan/bergabung kembali ke kanal suara setelah kegagalan berulang dalam jendela waktu singkat.
- Jika log penerimaan berulang kali menampilkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` setelah pembaruan, kumpulkan laporan dependensi dan log. Baris `@discordjs/voice` yang dibundel menyertakan perbaikan padding upstream dari PR discord.js #11449, yang menutup isu discord.js #11419.
- Peristiwa penerimaan `The operation was aborted` diharapkan saat OpenClaw menyelesaikan segmen pembicara yang ditangkap; itu adalah diagnostik verbose, bukan peringatan.
- Log suara Discord verbose menyertakan pratinjau transkrip STT satu baris terbatas untuk setiap segmen pembicara yang diterima, sehingga debugging menampilkan sisi pengguna dan sisi balasan agen tanpa membuang teks transkrip tak terbatas.
- Dalam mode `agent-proxy`, fallback konsultasi paksa melewati fragmen transkrip yang mungkin belum lengkap seperti teks yang berakhir dengan `...` atau konektor penutup seperti `and`, plus penutup yang jelas tidak dapat ditindaklanjuti seperti “segera kembali” atau “sampai jumpa”. Log menampilkan `forced agent consult skipped reason=...` saat ini mencegah jawaban antrean yang basi.

Setup opus native untuk checkout sumber:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Gunakan Node 22 untuk Gateway saat Anda menginginkan addon native prebuilt macOS arm64 upstream. Jika Anda menggunakan runtime Node lain, installer opt-in mungkin memerlukan toolchain build sumber `node-gyp` lokal.

Setelah menginstal addon native, mulai Gateway dengan:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

Log suara verbose seharusnya menampilkan `discord voice: opus decoder: @discordjs/opus`. Tanpa opt-in env, atau jika addon native hilang atau tidak dapat dimuat di host, OpenClaw mencatat `discord voice: opus decoder: opusscript` dan tetap menerima suara melalui fallback pure-JS.

Pipeline STT plus TTS:

- Tangkapan PCM Discord dikonversi menjadi file sementara WAV.
- `tools.media.audio` menangani STT, misalnya `openai/gpt-4o-mini-transcribe`.
- Transkrip dikirim melalui ingress dan routing Discord sementara LLM respons berjalan dengan kebijakan output suara yang menyembunyikan alat `tts` agen dan meminta teks yang dikembalikan, karena suara Discord memiliki pemutaran TTS akhir.
- `voice.model`, saat diatur, hanya menimpa LLM respons untuk giliran kanal suara ini.
- `voice.tts` digabungkan di atas `messages.tts`; penyedia yang mendukung streaming memberi makan pemutar secara langsung, jika tidak file audio yang dihasilkan diputar di kanal yang sudah digabungkan.

Contoh sesi kanal suara agent-proxy default:

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

Tanpa blok `voice.agentSession`, setiap kanal suara mendapatkan sesi OpenClaw yang dirutekan miliknya sendiri. Misalnya, `/vc join channel:234567890123456789` berbicara ke sesi untuk kanal suara Discord tersebut. Model realtime hanya antarmuka depan suara; permintaan substantif diserahkan ke agen OpenClaw yang dikonfigurasi. Jika model realtime menghasilkan transkrip final tanpa memanggil alat konsultasi, OpenClaw memaksa konsultasi sebagai fallback sehingga default tetap berperilaku seperti berbicara dengan agen.

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

Suara sebagai ekstensi dari sesi kanal Discord yang sudah ada:

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

Dalam mode `agent-proxy`, bot bergabung ke kanal suara yang dikonfigurasi, tetapi giliran agen OpenClaw menggunakan sesi dan agen normal kanal target yang dirutekan. Sesi suara realtime mengucapkan hasil yang dikembalikan kembali ke kanal suara. Agen supervisor masih dapat menggunakan alat pesan normal sesuai kebijakan alatnya, termasuk mengirim pesan Discord terpisah jika itu tindakan yang tepat.

Bentuk target yang berguna:

- `target: "channel:123456789012345678"` merutekan melalui sesi kanal teks Discord.
- `target: "123456789012345678"` diperlakukan sebagai target kanal.
- `target: "dm:123456789012345678"` atau `target: "user:123456789012345678"` merutekan melalui sesi pesan langsung tersebut.

Contoh OpenAI Realtime dengan gema berat:

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

Gunakan ini ketika model mendengar pemutaran Discord-nya sendiri melalui mikrofon terbuka, tetapi Anda tetap ingin menginterupsinya dengan berbicara. OpenClaw mencegah OpenAI melakukan interupsi otomatis pada audio input mentah, sementara `bargeIn: true` memungkinkan peristiwa awal-pembicara Discord dan audio pembicara yang sudah aktif membatalkan respons realtime aktif sebelum giliran tertangkap berikutnya mencapai OpenAI. Sinyal barge-in yang sangat awal dengan `audioEndMs` di bawah `minBargeInAudioEndMs` diperlakukan sebagai kemungkinan gema/noise dan diabaikan agar model tidak terpotong pada frame pemutaran pertama.

Log suara yang diharapkan:

- Saat bergabung: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Saat realtime dimulai: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Saat audio pembicara: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, dan `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Saat ucapan usang dilewati: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` atau `reason=non-actionable-closing ...`
- Saat respons realtime selesai: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Saat pemutaran berhenti/direset: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Saat konsultasi realtime: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Saat jawaban agen: `discord voice: agent turn answer ...`
- Saat ucapan persis diantrekan: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, diikuti oleh `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Saat deteksi barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` atau `discord voice: realtime barge-in detected source=active-speaker-audio ...`, diikuti oleh `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Saat interupsi realtime: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, diikuti oleh `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` atau `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Saat gema/noise diabaikan: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Saat barge-in dinonaktifkan: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Saat pemutaran idle: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Untuk men-debug audio yang terpotong, baca log suara realtime sebagai lini masa:

1. `realtime audio playback started` berarti Discord telah mulai memutar audio asisten. Bridge mulai menghitung chunk output asisten, byte PCM Discord, byte realtime provider, dan durasi audio tersintesis dari titik ini.
2. `realtime speaker turn opened` menandai pembicara Discord menjadi aktif. Jika pemutaran sudah aktif dan `bargeIn` diaktifkan, ini dapat diikuti oleh `barge-in detected source=speaker-start`.
3. `realtime input audio started` menandai frame audio aktual pertama yang diterima untuk giliran pembicara tersebut. `outputActive=true` atau `outputAudioMs` bukan nol di sini berarti mikrofon mengirim input sementara pemutaran asisten masih aktif.
4. `barge-in detected source=active-speaker-audio` berarti OpenClaw melihat audio pembicara langsung saat pemutaran asisten aktif. Ini berguna untuk membedakan interupsi nyata dari peristiwa awal-pembicara Discord tanpa audio yang berguna.
5. `barge-in requested reason=...` berarti OpenClaw meminta provider realtime untuk membatalkan atau memotong respons aktif. Ini menyertakan `outputAudioMs`, `outputActive`, dan `playbackChunks` sehingga Anda dapat melihat berapa banyak audio asisten yang sebenarnya sudah diputar sebelum interupsi.
6. `realtime audio playback stopped reason=...` adalah titik reset pemutaran Discord lokal. Alasannya menunjukkan siapa yang menghentikan pemutaran: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, atau `session-close`.
7. `realtime speaker turn closed` merangkum giliran input yang ditangkap. `chunks=0` atau `hasAudio=false` berarti giliran pembicara terbuka tetapi tidak ada audio yang dapat digunakan mencapai bridge realtime. `interruptedPlayback=true` berarti giliran input tersebut tumpang tindih dengan output asisten dan memicu logika barge-in.

Bidang berguna:

- `outputAudioMs`: durasi audio asisten yang dihasilkan oleh provider realtime sebelum baris log.
- `audioMs`: durasi audio asisten yang dihitung OpenClaw sebelum pemutaran berhenti.
- `elapsedMs`: waktu wall-clock antara pembukaan dan penutupan stream pemutaran atau giliran pembicara.
- `discordBytes`: byte PCM stereo 48 kHz yang dikirim ke atau diterima dari suara Discord.
- `realtimeBytes`: byte PCM format provider yang dikirim ke atau diterima dari provider realtime.
- `playbackChunks`: chunk audio asisten yang diteruskan ke Discord untuk respons aktif.
- `sinceLastAudioMs`: jeda antara frame audio pembicara terakhir yang ditangkap dan penutupan giliran pembicara.

Pola umum:

- Terpotong langsung dengan `source=active-speaker-audio`, `outputAudioMs` kecil, dan pengguna yang sama di dekatnya biasanya mengarah ke gema speaker yang masuk ke mikrofon. Naikkan `voice.realtime.minBargeInAudioEndMs`, turunkan volume speaker, gunakan headphone, atau setel `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` diikuti oleh `speaker turn closed ... hasAudio=false` berarti Discord melaporkan awal pembicara tetapi tidak ada audio yang mencapai OpenClaw. Itu dapat berupa peristiwa suara Discord sementara, perilaku noise gate, atau klien yang sebentar mengaktifkan mikrofon.
- `audio playback stopped reason=stream-close` tanpa barge-in terdekat atau `provider-clear-audio` berarti stream pemutaran Discord lokal berakhir secara tidak terduga. Periksa log provider dan pemutar Discord sebelumnya.
- `capture ignored during playback (barge-in disabled)` berarti OpenClaw sengaja membuang input saat audio asisten aktif. Aktifkan `voice.realtime.bargeIn` jika Anda ingin ucapan menginterupsi pemutaran.
- `barge-in ignored ... outputActive=false` berarti Discord atau VAD provider melaporkan ucapan, tetapi OpenClaw tidak memiliki pemutaran aktif untuk diinterupsi. Ini seharusnya tidak memotong audio.

Kredensial diselesaikan per komponen: auth rute LLM untuk `voice.model`, auth STT untuk `tools.media.audio`, auth TTS untuk `messages.tts`/`voice.tts`, dan auth provider realtime untuk `voice.realtime.providers` atau konfigurasi auth normal provider.

### Pesan suara

Pesan suara Discord menampilkan pratinjau waveform dan memerlukan audio OGG/Opus. OpenClaw membuat waveform secara otomatis, tetapi memerlukan `ffmpeg` dan `ffprobe` di host Gateway untuk memeriksa dan mengonversi.

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
    - aktifkan Server Members Intent ketika Anda bergantung pada resolusi pengguna/anggota
    - mulai ulang Gateway setelah mengubah intent

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - verifikasi `groupPolicy`
    - verifikasi allowlist guild di bawah `channels.discord.guilds`
    - jika peta `channels` guild ada, hanya channel yang tercantum yang diizinkan
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

    Kenop antrean Gateway Discord:

    - satu akun: `channels.discord.eventQueue.listenerTimeout`
    - multi-akun: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ini hanya mengontrol pekerjaan listener Gateway Discord, bukan masa pakai giliran agen

    Discord tidak menerapkan timeout milik channel pada giliran agen yang diantrekan. Listener pesan langsung menyerahkan pekerjaan, dan run Discord yang diantrekan mempertahankan urutan per sesi sampai siklus hidup sesi/tool/runtime menyelesaikan atau membatalkan pekerjaan.

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
    OpenClaw mengambil metadata `/gateway/bot` Discord sebelum terhubung. Kegagalan sementara kembali ke URL Gateway default Discord dan dibatasi lajunya di log.

    Kenop timeout metadata:

    - satu akun: `channels.discord.gatewayInfoTimeoutMs`
    - multi-akun: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env ketika config tidak disetel: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - default: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw menunggu peristiwa Gateway `READY` Discord selama startup dan setelah koneksi ulang runtime. Penyiapan multi-akun dengan penjarakan startup dapat memerlukan jendela READY startup yang lebih panjang daripada default.

    Kenop timeout READY:

    - startup satu akun: `channels.discord.gatewayReadyTimeoutMs`
    - startup multi-akun: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env startup ketika config tidak disetel: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - default startup: `15000` (15 detik), maks: `120000`
    - runtime satu akun: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-akun: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env runtime ketika config tidak disetel: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - default runtime: `30000` (30 detik), maks: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    Pemeriksaan izin `channels status --probe` hanya bekerja untuk ID channel numerik.

    Jika Anda menggunakan kunci slug, pencocokan runtime masih dapat bekerja, tetapi probe tidak dapat memverifikasi izin sepenuhnya.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - menunggu persetujuan pairing dalam mode `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Secara default, pesan yang ditulis bot diabaikan.

    Jika Anda menetapkan `channels.discord.allowBots=true`, gunakan aturan mention dan allowlist yang ketat untuk menghindari perilaku loop.
    Sebaiknya gunakan `channels.discord.allowBots="mentions"` agar hanya menerima pesan bot yang menyebut bot tersebut.

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - jaga agar OpenClaw tetap mutakhir (`openclaw update`) supaya logika pemulihan penerimaan suara Discord tersedia
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
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout` (anggaran listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias lama: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (membatasi unggahan keluar Discord, default `100MB`), `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, `bindings[]` tingkat atas (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Keamanan dan operasi

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` lebih disarankan di lingkungan yang diawasi).
- Berikan izin Discord dengan hak akses paling minimal.
- Jika deploy/status perintah sudah usang, mulai ulang Gateway dan periksa ulang dengan `openclaw channels status --probe`.

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
    Petakan guild dan kanal ke agen.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native.
  </Card>
</CardGroup>
