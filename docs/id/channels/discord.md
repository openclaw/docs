---
read_when:
    - Mengerjakan fitur saluran Discord
summary: Penyiapan bot Discord, kunci konfigurasi, komponen, suara, dan pemecahan masalah
title: Discord
x-i18n:
    generated_at: "2026-07-19T04:54:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 28bf01ed58a342c6ac549280ced7a212d8dff2ef6fc00c40f5c9b0b62cc1519f
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw terhubung ke Discord sebagai bot melalui gateway resmi Discord. DM dan saluran guild didukung.

<CardGroup cols={3}>
  <Card title="Penyandingan" icon="link" href="/id/channels/pairing">
    DM Discord secara default menggunakan mode penyandingan.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah saluran" icon="wrench" href="/id/channels/troubleshooting">
    Alur diagnosis dan perbaikan lintas saluran.
  </Card>
</CardGroup>

## Penyiapan cepat

Buat aplikasi Discord dengan bot, tambahkan bot tersebut ke server Anda, lalu sandingkan dengan OpenClaw. Gunakan server privat jika memungkinkan; [buat terlebih dahulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**) jika diperlukan.

<Steps>
  <Step title="Buat aplikasi dan bot Discord">
    Di [Discord Developer Portal](https://discord.com/developers/applications), klik **New Application** dan beri nama (misalnya "OpenClaw").

    Buka **Bot** di bilah samping dan atur **Username** ke nama agen Anda.

  </Step>

  <Step title="Aktifkan intent istimewa">
    Masih di halaman **Bot**, pada bagian **Privileged Gateway Intents**, aktifkan:

    - **Message Content Intent** (wajib)
    - **Server Members Intent** (direkomendasikan; wajib untuk daftar izin peran, pencocokan nama ke ID, dan grup akses audiens saluran)
    - **Presence Intent** (opsional; hanya untuk pembaruan kehadiran)

  </Step>

  <Step title="Salin token bot Anda">
    Di halaman **Bot**, klik **Reset Token** lalu salin token tersebut.

    <Note>
    Terlepas dari namanya, tindakan ini menghasilkan token pertama Anda — tidak ada yang sedang "direset".
    </Note>

  </Step>

  <Step title="Buat URL undangan dan tambahkan bot ke server Anda">
    Buka **OAuth2** di bilah samping. Di **OAuth2 URL Generator**, aktifkan cakupan berikut:

    - `bot`
    - `applications.commands`

    Di bagian **Bot Permissions** yang muncul, aktifkan setidaknya:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (opsional)

    Itu adalah konfigurasi dasar untuk saluran teks biasa. Jika bot akan memposting di utas — termasuk alur kerja saluran forum atau media yang membuat atau melanjutkan utas — aktifkan juga **Send Messages in Threads**.

    Salin URL yang dihasilkan, buka di peramban, pilih server Anda, lalu klik **Continue**. Bot kini seharusnya muncul di server Anda.

  </Step>

  <Step title="Aktifkan Developer Mode dan kumpulkan ID Anda">
    Di aplikasi Discord, aktifkan Developer Mode agar Anda dapat menyalin ID:

    1. **User Settings** (ikon roda gigi) → **Developer** → aktifkan **Developer Mode**
       *(di perangkat seluler: **App Settings** → **Advanced**)*
    2. Klik kanan **ikon server** Anda → **Copy Server ID**
    3. Klik kanan **avatar Anda sendiri** → **Copy User ID**

    Simpan Server ID dan User ID bersama token bot Anda; ketiganya diperlukan pada langkah berikutnya.

  </Step>

  <Step title="Izinkan DM dari anggota server">
    Agar penyandingan berfungsi, Discord harus mengizinkan bot mengirim DM kepada Anda. Klik kanan **ikon server** Anda → **Privacy Settings** → aktifkan **Direct Messages**.

    Biarkan opsi ini aktif jika Anda menggunakan DM Discord dengan OpenClaw. Jika Anda hanya menggunakan saluran guild, Anda dapat menonaktifkannya setelah penyandingan.

  </Step>

  <Step title="Atur token bot Anda dengan aman (jangan kirim melalui chat)">
    Token bot adalah rahasia. Atur token tersebut di mesin yang menjalankan OpenClaw sebelum mengirim pesan kepada agen Anda:

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
    Untuk instalasi layanan terkelola, jalankan `openclaw gateway install` dari shell tempat `DISCORD_BOT_TOKEN` telah diatur, atau simpan variabel tersebut di `~/.openclaw/.env` agar layanan dapat menyelesaikan SecretRef lingkungan setelah dimulai ulang.
    Jika host Anda diblokir atau dibatasi lajunya oleh pencarian aplikasi saat startup Discord, atur ID aplikasi/klien dari Developer Portal agar startup dapat melewati panggilan REST tersebut: `channels.discord.applicationId` untuk akun default, atau `channels.discord.accounts.<accountId>.applicationId` untuk setiap bot.

  </Step>

  <Step title="Konfigurasikan OpenClaw dan lakukan penyandingan">

    <Tabs>
      <Tab title="Minta agen Anda">
        Chat dengan agen OpenClaw Anda di saluran yang sudah ada (misalnya Telegram) dan beri tahu agen tersebut. Jika Discord adalah saluran pertama Anda, gunakan tab CLI / konfigurasi sebagai gantinya.

        > "Saya sudah mengatur token bot Discord saya dalam konfigurasi. Selesaikan penyiapan Discord dengan User ID `<user_id>` dan Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / konfigurasi">
        Konfigurasi berbasis berkas:

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

        Fallback lingkungan untuk akun default:

```bash
DISCORD_BOT_TOKEN=...
```

        Untuk penyiapan dengan skrip atau dari jarak jauh, tulis blok JSON5 yang sama dengan `openclaw config patch --file ./discord.patch.json5 --dry-run`, lalu jalankan ulang tanpa `--dry-run`. String teks biasa `token` juga berfungsi, dan nilai SecretRef didukung untuk `channels.discord.token` di seluruh penyedia env/file/exec. Lihat [Pengelolaan Rahasia](/id/gateway/secrets).

        Untuk beberapa bot Discord, simpan setiap token bot dan ID aplikasi di bawah akunnya masing-masing. `channels.discord.applicationId` tingkat teratas diwarisi oleh akun, jadi atur di sana hanya jika setiap akun menggunakan ID aplikasi yang sama.

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
    Setelah gateway berjalan, kirim DM ke bot Anda di Discord. Bot akan membalas dengan kode penyandingan.

    <Tabs>
      <Tab title="Minta agen Anda">
        Kirim kode penyandingan kepada agen Anda di saluran yang sudah ada:

        > "Setujui kode penyandingan Discord ini: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kode penyandingan kedaluwarsa setelah 1 jam. Setelah disetujui, chat dengan agen Anda melalui DM Discord.

  </Step>
</Steps>

<Note>
Resolusi token mempertimbangkan akun. Nilai token konfigurasi didahulukan daripada fallback lingkungan, dan `DISCORD_BOT_TOKEN` hanya digunakan untuk akun default.
Jika dua akun Discord yang diaktifkan diselesaikan ke token bot yang sama, OpenClaw hanya memulai satu pemantau gateway untuk token tersebut: token yang bersumber dari konfigurasi didahulukan daripada fallback lingkungan; jika tidak, akun aktif pertama yang dipilih dan akun duplikat dilaporkan dinonaktifkan dengan alasan `duplicate bot token`.
Untuk panggilan keluar lanjutan (alat pesan/tindakan saluran), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk tindakan pengiriman dan tindakan bergaya baca/probe (baca/cari/ambil/utas/pin/izin). Kebijakan akun/pengaturan percobaan ulang tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Direkomendasikan: Siapkan ruang kerja guild

Setelah DM berfungsi, Anda dapat mengubah server menjadi ruang kerja lengkap tempat setiap saluran mendapatkan sesi agennya sendiri dengan konteksnya sendiri. Direkomendasikan untuk server privat yang hanya berisi Anda dan bot Anda.

<Steps>
  <Step title="Tambahkan server Anda ke daftar izin guild">
    Ini memungkinkan agen Anda merespons di saluran mana pun di server Anda, bukan hanya DM.

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
    Secara default, agen hanya merespons di saluran guild ketika diberi @mention. Di server privat, Anda mungkin menginginkannya merespons setiap pesan.

    Di saluran guild, balasan normal diposting secara otomatis secara default. Untuk ruang bersama yang selalu aktif, aktifkan `messages.groupChat.visibleReplies: "message_tool"` agar agen dapat mengamati secara diam-diam dan hanya memposting ketika memutuskan bahwa balasan saluran akan berguna. Ini berfungsi paling baik dengan model generasi terbaru yang andal dalam penggunaan alat, seperti GPT-5.6 Sol. Peristiwa ruang ambien tetap senyap kecuali alat melakukan pengiriman. Lihat [Peristiwa ruang ambien](/id/channels/ambient-room-events) untuk konfigurasi lengkap mode pengamatan diam-diam.

    Jika Discord menunjukkan indikator sedang mengetik dan log menunjukkan penggunaan token tetapi tidak ada pesan yang diposting, periksa apakah giliran tersebut dikonfigurasi sebagai peristiwa ruang ambien atau diatur untuk menggunakan balasan terlihat melalui alat pesan.

    <Tabs>
      <Tab title="Minta agen Anda">
        > "Izinkan agen saya merespons di server ini tanpa harus diberi @mention"
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

        Untuk mewajibkan pengiriman melalui alat pesan bagi balasan grup/saluran yang terlihat, atur `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Rencanakan penggunaan memori di saluran guild">
    Memori jangka panjang (MEMORY.md) hanya dimuat otomatis dalam sesi DM; saluran guild tidak memuatnya.

    <Tabs>
      <Tab title="Minta agen Anda">
        > "Saat saya mengajukan pertanyaan di saluran Discord, gunakan memory_search atau memory_get jika Anda memerlukan konteks jangka panjang dari MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Untuk konteks bersama di setiap saluran, tempatkan instruksi stabil di `AGENTS.md` atau `USER.md` (disisipkan untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan dengan alat memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat saluran dan mulailah mengobrol. Agen melihat nama saluran, dan setiap saluran merupakan sesi terisolasi — siapkan `#coding`, `#home`, `#research`, atau apa pun yang sesuai dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan untuk pesan masuk Discord dikirim kembali ke Discord.
- Metadata guild/saluran Discord ditambahkan ke prompt model sebagai konteks yang tidak tepercaya, bukan sebagai prefiks balasan yang terlihat oleh pengguna. Jika model menyalin kembali amplop tersebut, OpenClaw menghapus metadata yang disalin dari balasan keluar dan dari konteks pemutaran ulang berikutnya.
- Secara default (`session.dmScope=main`), chat langsung berbagi sesi utama agen (`agent:main:main`).
- Saluran guild menggunakan kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- DM grup diabaikan secara default (`channels.discord.dm.groupEnabled=false`).
- Perintah slash native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sekaligus tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.
- Pengiriman pengumuman cron/heartbeat khusus teks ke Discord diringkas menjadi jawaban akhir yang terlihat oleh asisten dan dikirim satu kali. Payload media dan komponen terstruktur tetap terdiri dari beberapa pesan ketika agen menghasilkan beberapa payload yang dapat dikirimkan.

## Saluran forum

Discord forum dan channel media hanya menerima postingan utas. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke induk forum (`channel:<forumId>`) untuk membuat utas secara otomatis. Judul utas adalah baris pertama pesan yang tidak kosong (dipotong hingga batas nama utas Discord sebanyak 100 karakter).
- Gunakan `openclaw message thread create` untuk membuat utas secara langsung. Jangan berikan `--message-id` untuk channel forum.

Kirim ke induk forum untuk membuat utas:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Judul topik\nIsi postingan"
```

Buat utas forum secara eksplisit:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Judul topik" --message "Isi postingan"
```

Induk forum tidak menerima komponen Discord. Jika memerlukan komponen, kirim ke utas itu sendiri (`channel:<threadId>`).

## Komponen interaktif

OpenClaw mendukung kontainer komponen v2 Discord untuk pesan agen. Gunakan alat pesan dengan payload `components`. Hasil interaksi dirutekan kembali ke agen sebagai pesan masuk biasa dan mengikuti pengaturan `replyToMode` Discord yang ada.

Blok yang didukung:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Baris tindakan mengizinkan hingga 5 tombol atau satu menu pilihan
- Jenis pilihan: `string`, `user`, `role`, `mentionable`, `channel`

Secara default, komponen hanya dapat digunakan sekali. Atur `components.reusable=true` agar tombol, pilihan, dan formulir dapat digunakan beberapa kali hingga kedaluwarsa.

Untuk membatasi siapa yang dapat mengeklik tombol, atur `allowedUsers` pada tombol tersebut (ID pengguna Discord, tag, atau `*`). Pengguna yang tidak cocok menerima penolakan efemeral.

Callback komponen kedaluwarsa setelah 30 menit secara default. Atur `channels.discord.agentComponents.ttlMs` untuk mengubah masa berlaku registri callback bagi akun default, atau `channels.discord.accounts.<accountId>.agentComponents.ttlMs` per akun. Nilainya dalam milidetik, harus berupa bilangan bulat positif, dan dibatasi hingga `86400000` (24 jam). TTL yang lebih panjang sesuai untuk alur kerja review/persetujuan yang memerlukan tombol tetap dapat digunakan, tetapi memperpanjang rentang waktu saat pesan Discord lama masih dapat memicu tindakan. Pilih TTL tersingkat yang sesuai, dan pertahankan nilai default jika callback usang akan menimbulkan hal yang tidak terduga.

Perintah garis miring `/model` dan `/models` membuka pemilih model interaktif dengan daftar tarik-turun penyedia, model, dan runtime yang kompatibel, beserta langkah Submit. `/models add` tidak digunakan lagi dan mengembalikan pesan penghentian penggunaan alih-alih mendaftarkan model dari obrolan. Balasan pemilih bersifat efemeral dan hanya dapat digunakan oleh pengguna yang menjalankannya. Menu pilihan Discord dibatasi hingga 25 opsi, jadi tambahkan entri `provider/*` ke `agents.defaults.modelPolicy.allow` jika Anda ingin pemilih hanya menampilkan model yang ditemukan secara dinamis untuk penyedia terpilih seperti `openai` atau `vllm`.

Lampiran berkas:

- Blok `file` harus mengarah ke referensi lampiran (`attachment://<filename>`)
- Sediakan lampiran melalui `media`/`path`/`filePath` (satu berkas); gunakan `media-gallery` untuk beberapa berkas
- Gunakan `filename` untuk mengganti nama unggahan jika harus cocok dengan referensi lampiran

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
  message: "Teks alternatif opsional",
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
        { type: "text", label: "Pemohon" },
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
  <Tab title="Kebijakan DM">
    `channels.discord.dmPolicy` mengontrol akses DM. `channels.discord.allowFrom` adalah daftar izin DM kanonis.

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu pengirim `allowFrom`)
    - `open` (memerlukan `channels.discord.allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    Jika kebijakan DM tidak terbuka, pengguna yang tidak dikenal diblokir (atau diminta melakukan pemasangan dalam mode `pairing`).

    Prioritas multiakun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Untuk satu akun, `allowFrom` lebih diprioritaskan daripada `dm.allowFrom` lama.
    - Akun bernama mewarisi `channels.discord.allowFrom` saat `allowFrom` miliknya dan `dm.allowFrom` lama tidak ditetapkan.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` dan `channels.discord.dm.allowFrom` lama masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` jika dapat dilakukan tanpa mengubah akses.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - sebutan `<@id>`

    ID numerik tanpa awalan biasanya diuraikan sebagai ID channel saat default channel aktif, tetapi ID yang tercantum dalam `allowFrom` DM efektif milik akun diperlakukan sebagai target DM pengguna demi kompatibilitas.

  </Tab>

  <Tab title="Grup akses">
    DM Discord dan otorisasi perintah teks dapat menggunakan entri `accessGroup:<name>` dinamis dalam `channels.discord.allowFrom`.

    Nama grup akses digunakan bersama di seluruh channel pesan. Gunakan `type: "message.senders"` untuk grup statis yang anggotanya dinyatakan dalam sintaks `allowFrom` normal setiap channel, atau `type: "discord.channelAudience"` jika audiens `ViewChannel` saat ini dari suatu channel Discord harus menentukan keanggotaan secara dinamis. Perilaku grup akses bersama: [Grup akses](/id/channels/access-groups).

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

    Channel teks Discord tidak memiliki daftar anggota terpisah. `type: "discord.channelAudience"` memodelkan keanggotaan sebagai berikut: pengirim DM adalah anggota guild yang dikonfigurasi dan saat ini memiliki izin `ViewChannel` efektif pada channel yang dikonfigurasi setelah penimpaan peran dan channel diterapkan.

    Contoh: izinkan siapa pun yang dapat melihat `#maintainers` untuk mengirim DM ke bot, sambil tetap menutup DM bagi semua pengguna lain.

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

    Pencarian gagal secara tertutup. Jika Discord mengembalikan `Missing Access`, pencarian anggota gagal, atau channel termasuk dalam guild lain, pengirim DM diperlakukan sebagai tidak berwenang.

    Aktifkan **Server Members Intent** di Discord Developer Portal saat menggunakan grup akses berbasis audiens channel. DM tidak menyertakan status anggota guild, sehingga OpenClaw menguraikan anggota melalui REST Discord pada saat otorisasi.

  </Tab>

  <Tab title="Kebijakan guild">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Baseline aman saat `channels.discord` tersedia adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` lebih disarankan, slug diterima)
    - daftar izin pengirim opsional: `users` (ID stabil disarankan) dan `roles` (hanya ID peran); jika salah satunya dikonfigurasi, pengirim diizinkan jika cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag langsung dinonaktifkan secara default; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memberikan peringatan saat entri nama/tag digunakan
    - jika guild telah mengonfigurasi `channels`, channel yang tidak tercantum ditolak
    - jika guild tidak memiliki blok `channels`, semua channel dalam guild yang masuk daftar izin tersebut diizinkan

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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Kunci `allow` per channel yang lama dimigrasikan ke `enabled` oleh `openclaw doctor --fix`.

    Jika Anda hanya menetapkan `DISCORD_BOT_TOKEN` dan tidak membuat blok `channels.discord`, fallback runtime adalah `groupPolicy="allowlist"` (dengan peringatan dalam log), meskipun `channels.defaults.groupPolicy` adalah `open`.

  </Tab>

  <Tab title="Sebutan dan DM grup">
    Pesan guild dibatasi berdasarkan sebutan secara default.

    Deteksi sebutan mencakup:

    - sebutan bot eksplisit
    - pola sebutan yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku balasan implisit kepada bot dalam kasus yang didukung

    Saat menulis pesan Discord keluar, gunakan sintaks sebutan kanonis: `<@USER_ID>` untuk pengguna, `<#CHANNEL_ID>` untuk channel, dan `<@&ROLE_ID>` untuk peran. Jangan gunakan format sebutan nama panggilan `<@!USER_ID>` yang lama.

    `requireMention` dikonfigurasi per guild/channel (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional mengabaikan pesan yang menyebut pengguna/peran lain tetapi tidak menyebut bot (tidak termasuk @everyone/@here).

    DM grup:

    - default: diabaikan (`dm.groupEnabled=false`)
    - daftar izin opsional melalui `dm.groupChannels` (ID channel atau slug)

  </Tab>
</Tabs>

### Perutean agen berbasis peran

Gunakan `bindings[].match.roles` untuk merutekan anggota guild Discord ke agen yang berbeda berdasarkan ID peran. Pengikatan berbasis peran hanya menerima ID peran dan dievaluasi setelah pengikatan peer atau peer induk serta sebelum pengikatan khusus guild. Jika suatu pengikatan juga menetapkan bidang pencocokan lain (misalnya `peer` + `guildId` + `roles`), semua bidang yang dikonfigurasi harus cocok.

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
- `commands.native=false` melewati pendaftaran dan pembersihan perintah garis miring Discord selama startup. Perintah yang sebelumnya didaftarkan mungkin tetap terlihat di Discord hingga Anda menghapusnya dari aplikasi Discord.
- Autentikasi perintah native menggunakan daftar izin/kebijakan Discord yang sama seperti penanganan pesan biasa.
- Perintah mungkin masih terlihat di UI Discord bagi pengguna yang tidak berwenang; eksekusi menerapkan autentikasi OpenClaw dan membalas "tidak diizinkan".
- Pengaturan perintah garis miring default: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Lihat [Perintah garis miring](/id/tools/slash-commands) untuk katalog dan perilaku perintah.

## Detail fitur

<AccordionGroup>
  <Accordion title="Tag balasan dan balasan native">
    Discord mendukung tag balasan dalam keluaran agen:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Dikendalikan oleh `channels.discord.replyToMode`:

    - `off` (default): tidak ada pengelompokan utas balasan implisit; tag `[[reply_to_*]]` eksplisit tetap dipatuhi
    - `first`: melampirkan referensi balasan native implisit ke pesan Discord keluar pertama pada giliran tersebut
    - `all`: melampirkannya ke setiap pesan keluar
    - `batched`: melampirkannya hanya ketika peristiwa masuk merupakan kumpulan beberapa pesan yang telah diredam — berguna jika Anda terutama menginginkan balasan native untuk percakapan beruntun yang ambigu, bukan untuk setiap giliran dengan satu pesan

    ID pesan ditampilkan dalam konteks/riwayat agar agen dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Pratinjau tautan">
    Secara default, Discord menghasilkan sematan tautan kaya untuk URL. Secara default, OpenClaw menyembunyikan sematan yang dihasilkan tersebut pada pesan Discord keluar, sehingga URL yang dikirim agen tetap berupa tautan biasa kecuali Anda mengaktifkannya:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Atur `channels.discord.accounts.<id>.suppressEmbeds` untuk menimpa satu akun. Pengiriman melalui alat pesan agen juga dapat meneruskan `suppressEmbeds: false` untuk satu pesan. Payload `embeds` Discord eksplisit tidak disembunyikan oleh pengaturan pratinjau tautan default.

  </Accordion>

  <Accordion title="Pratinjau streaming langsung">
    OpenClaw dapat melakukan streaming draf balasan dengan mengirim pesan sementara dan mengeditnya saat teks diterima. `channels.discord.streaming.mode` menerima `off` | `partial` | `block` | `progress` (default ketika tidak ada kunci `streaming`/`streamMode` lama yang ditetapkan). `streamMode` adalah alias lama; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi tersimpan ke bentuk bertingkat `streaming` yang kanonis.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: false,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off` menonaktifkan pengeditan pratinjau Discord.
    - `partial` mengedit satu pesan pratinjau saat token diterima.
    - `block` menghasilkan potongan berukuran draf; sesuaikan ukuran dan titik pemisah dengan `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), yang dibatasi hingga `textChunkLimit`. Ketika streaming blok diaktifkan secara eksplisit, OpenClaw melewati streaming pratinjau untuk menghindari streaming ganda.
    - `progress` mempertahankan satu draf status yang dapat diedit hingga pengiriman akhir. Secara default, draf tersebut menampilkan satu baris pembuka atau narasi terbaru agen, tanpa label yang dihasilkan, spasi pemisah, atau baris alat.
    - Hasil akhir berupa media, galat, dan balasan eksplisit membatalkan pengeditan pratinjau yang tertunda.
    - `streaming.preview.toolProgress` secara default bernilai `true` dalam mode `partial`/`block`. Mode progres Discord secara default tidak menampilkan baris alat; atur `streaming.progress.toolProgress: true` untuk mengaktifkannya.
    - Atur `streaming.progress.toolProgress: true` untuk menambahkan baris alat/progres ringkas seperti `🛠️ Bash: run tests` atau `🔎 Web Search: for "query"`. Demi kompatibilitas, konfigurasi `progress.label` atau `progress.labels` yang sudah ada mempertahankan default baris alat sebelumnya; atur `toolProgress: false` untuk label khusus tanpa baris.
    - `streaming.progress.commentary` (default `false`) mengaktifkan komentar mentah asisten dalam draf progres sementara. Baris status pembuka/narasi default tidak bergantung pada opsi ini. Komentar dibersihkan sebelum ditampilkan, tetap bersifat sementara, dan tidak mengubah pengiriman jawaban akhir.
    - `streaming.progress.maxLineChars` mengendalikan batas pratinjau progres per baris. Prosa dipersingkat pada batas kata; detail perintah dan jalur mempertahankan akhiran yang berguna.
    - `streaming.preview.commandText` / `streaming.progress.commandText` mengendalikan detail perintah/eksekusi dalam baris progres ringkas: `raw` (default) atau `status` (hanya label alat).

    Sembunyikan teks mentah perintah/eksekusi sambil mempertahankan baris progres ringkas:

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

    Streaming pratinjau hanya mendukung teks; balasan media kembali menggunakan pengiriman normal.

  </Accordion>

  <Accordion title="Perilaku riwayat, konteks, dan utas">
    Konteks riwayat guild:

    - `channels.discord.historyLimit` default `20`
    - cadangan: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Kontrol riwayat DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Perilaku utas:

    - Utas Discord dirutekan sebagai sesi kanal dan mewarisi konfigurasi kanal induk kecuali ditimpa.
    - Sesi utas mewarisi pilihan `/model` tingkat sesi milik kanal induk sebagai cadangan khusus model; pilihan `/model` lokal utas diprioritaskan, dan riwayat transkrip induk tidak disalin kecuali pewarisan transkrip diaktifkan.
    - `channels.discord.thread.inheritParent` (default `false`) mengaktifkan pengisian awal utas otomatis baru dari transkrip induk. Penimpaan per akun: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaksi alat pesan dapat mengenali target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` dipertahankan selama cadangan aktivasi tahap balasan.

    Topik kanal dimasukkan sebagai konteks **tidak tepercaya**. Daftar izin membatasi siapa yang dapat memicu agen, bukan sebagai batas penyuntingan konteks tambahan secara menyeluruh.

  </Accordion>

  <Accordion title="Sesi terikat utas untuk subagen">
    Discord dapat mengikat utas ke target sesi agar pesan lanjutan dalam utas tersebut tetap dirutekan ke sesi yang sama (termasuk sesi subagen).

    Perintah:

    - `/focus <target>` mengikat utas saat ini/baru ke target subagen/sesi
    - `/unfocus` menghapus pengikatan utas saat ini
    - `/agents` menampilkan proses aktif dan status pengikatan
    - `/session idle <duration|off>` memeriksa/memperbarui penghilangan fokus otomatis akibat tidak aktif untuk pengikatan yang difokuskan
    - `/session max-age <duration|off>` memeriksa/memperbarui batas usia maksimum mutlak untuk pengikatan yang difokuskan

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

    - `session.threadBindings.*` menetapkan default global; `channels.discord.threadBindings.*` menimpa perilaku Discord.
    - `spawnSessions` mengendalikan pembuatan/pengikatan otomatis utas untuk `sessions_spawn({ thread: true })` dan pembuatan utas ACP. Default: `true`.
    - `defaultSpawnContext` mengendalikan konteks subagen native untuk pembuatan yang terikat utas. Default: `"fork"`.
    - Kunci `spawnSubagentSessions`/`spawnAcpSessions` yang tidak digunakan lagi dimigrasikan oleh `openclaw doctor --fix`.
    - Jika pengikatan utas dinonaktifkan untuk suatu akun, `/focus` dan operasi pengikatan utas terkait tidak tersedia.

    Lihat [Subagen](/id/tools/subagents), [Agen ACP](/id/tools/acp-agents), dan [Referensi Konfigurasi](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Progres subagen pada pesan sumber">
    Atur `channels.discord.subagentProgress: true` untuk menampilkan aktivitas anak di latar belakang pada pesan Discord yang memulai proses induk.

```json5
{
  channels: {
    discord: {
      subagentProgress: true,
    },
  },
}
```

    Selama proses anak aktif, OpenClaw mempertahankan indikator mengetik Discord hingga satu jam dan mengganti satu reaksi jumlah (`1️⃣` hingga `🔟`) saat jumlah proses bersamaan berubah; `🔟` juga mewakili 10 atau lebih. Reaksi jumlah dihapus setelah proses anak terakhir berakhir. Proses anak yang gagal, kehabisan waktu, atau dihentikan meninggalkan reaksi `🔴`.

    Fitur ini harus diaktifkan dan menggunakan pengaturan waktu internal serta default emoji yang tetap. Bot memerlukan izin **Add Reactions** untuk umpan balik reaksi. `channels.discord.accounts.<id>.subagentProgress` tingkat akun menimpa nilai tingkat teratas.

  </Accordion>

  <Accordion title="Pengikatan kanal ACP persisten">
    Untuk ruang kerja ACP "selalu aktif" yang stabil, konfigurasikan pengikatan ACP bertipe pada tingkat teratas yang menargetkan percakapan Discord.

    Jalur konfigurasi: `bindings[]` dengan `type: "acp"` dan `match.channel: "discord"`.

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

    - `/acp spawn codex --bind here` mengikat kanal atau utas saat ini di tempat dan mempertahankan pesan berikutnya pada sesi ACP yang sama. Pesan utas mewarisi pengikatan kanal induk.
    - Dalam kanal atau utas terikat, `/new` dan `/reset` mengatur ulang sesi ACP yang sama di tempat. Pengikatan utas sementara dapat menimpa resolusi target selama aktif.
    - `spawnSessions` membatasi pembuatan/pengikatan utas anak melalui `--thread auto|here`.

    Lihat [Agen ACP](/id/tools/acp-agents) untuk detail perilaku pengikatan.

  </Accordion>

  <Accordion title="Notifikasi reaksi">
    Mode notifikasi reaksi per guild (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (default)
    - `all`
    - `allowlist` (menggunakan `guilds.<id>.users`)

    Peristiwa reaksi diubah menjadi peristiwa sistem dan dilampirkan ke sesi Discord yang dirutekan.

  </Accordion>

  <Accordion title="Peristiwa kehadiran daring">
    Aktifkan guild untuk membangunkan agen yang dirutekan ketika anggota manusia beralih dari luring ke daring:

    ```json5
    {
      channels: {
        discord: {
          intents: { presence: true },
          guilds: {
            "111111111111111111": {
              presenceEvents: {
                channelId: "222222222222222222",
                users: ["333333333333333333"], // opsional; persempit lebih lanjut pemirsa kanal
                reconnectSuppressSeconds: 300, // opsional; jendela senyap sesi baru (0 menonaktifkan)
                burstLimit: 8, // opsional; jumlah maksimum peristiwa per jendela lonjakan
                burstWindowSeconds: 60, // opsional; jendela bergulir untuk deteksi lonjakan
              },
            },
          },
        },
      },
    }
    ```

    `presenceEvents` memerlukan Heartbeat yang diaktifkan untuk agen yang dirutekan dan **Presence Intent** dengan hak istimewa pada halaman Bot aplikasi di Discord Developer Portal. OpenClaw menginisialisasi anggota yang sedang daring dari setiap snapshot lengkap `GUILD_CREATE`, merutekan transisi dari luring ke daring yang teramati, dan juga menganggap sinyal daring pertama yang muncul kemudian untuk anggota yang belum terlihat sebagai baru tersedia. Anggota tersebut mungkin baru daring atau bergabung setelah snapshot, sehingga peristiwa ini tidak menyatakan status sebelumnya secara pasti. Hanya manusia yang dapat melihat `channelId` yang memenuhi syarat: kanal dan utas publik memerlukan **View Channel** pada kanal atau induknya, sedangkan utas privat juga memerlukan keanggotaan atau **Manage Threads**. `users` dapat mempersempit audiens tersebut lebih lanjut. OpenClaw mengabaikan bot dan status daring yang tidak berubah serta mempertahankan masa jeda delapan jam per pengguna saat Gateway dimulai ulang. Ketika Discord membuat sesi Gateway baru dan mengirimkan `READY`, OpenClaw menangguhkan peristiwa yang berasal dari kehadiran selama `reconnectSuppressSeconds` (bawaan 300, `0` menonaktifkannya) sementara status kehadiran guild dibangun ulang, sehingga anggota yang teramati kembali tidak dapat membangunkan agen satu per satu. OpenClaw juga membatasi laju peristiwa yang berhasil dimasukkan ke antrean per guild menjadi `burstLimit` peristiwa (bawaan 8) per jendela bergulir `burstWindowSeconds` (bawaan 60), dengan mencatat setiap episode penangguhan guild satu kali. Sesi yang dilanjutkan tidak dianggap sebagai sesi baru. Discord membatasi snapshot untuk guild dengan lebih dari 75.000 anggota; di sana, OpenClaw memerlukan pembaruan luring eksplisit sebelum menyapa. Peristiwa sistem membawa ID pengguna, guild, dan kanal yang tidak dapat diubah tanpa menyematkan nama tampilan yang dapat berubah. Agen menentukan apakah dan bagaimana akan menyapa.

  </Accordion>

  <Accordion title="Reaksi konfirmasi">
    `ackReaction` mengirim emoji konfirmasi saat OpenClaw memproses pesan masuk.

    Urutan resolusi:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - emoji identitas agen sebagai pilihan terakhir (`agents.list[].identity.emoji`, jika tidak "👀")

    Catatan:

    - Discord menerima emoji unicode atau nama emoji khusus.
    - Gunakan `""` untuk menonaktifkan reaksi bagi kanal atau akun.

    **Cakupan (`messages.ackReactionScope`):**

    Nilai: `"all"` (DM + grup, termasuk peristiwa ruang sekitar), `"direct"` (hanya DM), `"group-all"` (setiap pesan grup kecuali peristiwa ruang sekitar, tanpa DM), `"group-mentions"` (grup ketika bot disebut; **tanpa DM**, bawaan), `"off"` / `"none"` (dinonaktifkan).

    <Note>
    Cakupan bawaan (`"group-mentions"`) tidak memicu reaksi konfirmasi dalam pesan langsung atau peristiwa ruang sekitar. Untuk mendapatkan reaksi konfirmasi pada DM Discord yang masuk dan peristiwa ruang senyap, atur `messages.ackReactionScope` ke `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Penulisan konfigurasi">
    Penulisan konfigurasi yang dimulai dari kanal diaktifkan secara bawaan. Hal ini memengaruhi alur `/config set|unset` (ketika fitur perintah diaktifkan).

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

  <Accordion title="Proksi Gateway">
    Rutekan lalu lintas WebSocket gateway Discord dan pencarian REST saat awal mula (ID aplikasi + resolusi daftar izin) melalui proksi HTTP(S) dengan `channels.discord.proxy`.
    Penggunaan proksi untuk WebSocket gateway Discord bersifat eksplisit; koneksi WebSocket tidak mewarisi variabel lingkungan proksi sekitar dari proses Gateway. Pencarian REST saat awal mula menggunakan proksi ini ketika `channels.discord.proxy` dikonfigurasi.

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
        token: "pk_live_...", // opsional; diperlukan untuk sistem privat
      },
    },
  },
}
```

    Catatan:

    - daftar izin dapat menggunakan `pk:<memberId>`
    - nama tampilan anggota dicocokkan berdasarkan nama/slug hanya ketika `channels.discord.dangerouslyAllowNameMatching: true`
    - pencarian mengueri API PluralKit dengan ID pesan asli
    - jika pencarian gagal, pesan yang diproksikan diperlakukan sebagai pesan bot dan dibuang kecuali `allowBots` mengizinkannya lewat

  </Accordion>

  <Accordion title="Alias penyebutan keluar">
    Gunakan `mentionAliases` ketika agen memerlukan penyebutan keluar yang deterministik untuk pengguna Discord yang dikenal. Kunci berupa handle tanpa `@` di awal; nilainya adalah ID pengguna Discord. Handle yang tidak dikenal, `@everyone`, `@here`, dan penyebutan di dalam rentang kode Markdown dibiarkan tidak berubah.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
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
    Pembaruan kehadiran diterapkan ketika Anda menetapkan bidang status atau aktivitas, atau ketika Anda mengaktifkan kehadiran otomatis.

    Hanya status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Aktivitas (status khusus adalah jenis aktivitas bawaan ketika `activity` ditetapkan):

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

    Streaming:

```json5
{
  channels: {
    discord: {
      activity: "Pengodean langsung",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Pemetaan jenis aktivitas:

    - 0: Bermain
    - 1: Streaming (memerlukan `activityUrl`; `activityUrl` pada gilirannya memerlukan `activityType: 1`)
    - 2: Mendengarkan
    - 3: Menonton
    - 4: Khusus (menggunakan teks aktivitas sebagai keadaan status; emoji bersifat opsional)
    - 5: Bertanding

    Kehadiran otomatis (sinyal kesehatan runtime):

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

    Kehadiran otomatis memetakan ketersediaan runtime ke status Discord: sehat => daring, menurun atau tidak diketahui => menganggur, habis atau tidak tersedia => jangan ganggu. Bawaan: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (harus kurang dari atau sama dengan `intervalMs`). Penimpaan teks opsional:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (mendukung placeholder `{reason}`)

  </Accordion>

  <Accordion title="Persetujuan di Discord">
    Discord mendukung penanganan persetujuan berbasis tombol di DM dan secara opsional dapat mengirimkan permintaan persetujuan di kanal asal.

    Jalur konfigurasi:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; kembali ke `commands.ownerAllowFrom` jika memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, bawaan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord secara otomatis mengaktifkan persetujuan exec native ketika `enabled` tidak ditetapkan atau bernilai `"auto"` dan setidaknya satu pemberi persetujuan dapat diresolusi, baik dari `execApprovals.approvers` maupun `commands.ownerAllowFrom`. Discord tidak menyimpulkan pemberi persetujuan exec dari `allowFrom` kanal, `dm.allowFrom` lama, atau `defaultTo` pesan langsung. Atur `enabled: false` untuk menonaktifkan Discord sebagai klien persetujuan native secara eksplisit.

    Untuk perintah grup sensitif yang hanya untuk pemilik seperti `/diagnostics` dan `/export-trajectory`, OpenClaw mengirimkan permintaan persetujuan dan hasil akhir secara privat. OpenClaw mencoba DM Discord terlebih dahulu ketika pemilik yang menjalankan perintah memiliki rute pemilik Discord; jika tidak, OpenClaw kembali ke rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom`, seperti Telegram.

    Ketika `target` bernilai `channel` atau `both`, permintaan persetujuan terlihat di kanal. Hanya pemberi persetujuan yang telah diresolusi yang dapat menggunakan tombol; pengguna lain menerima penolakan sementara. Permintaan persetujuan menyertakan teks perintah, jadi aktifkan pengiriman ke kanal hanya di kanal tepercaya. Jika ID kanal tidak dapat diperoleh dari kunci sesi, OpenClaw kembali ke pengiriman melalui DM.

    Discord merender tombol persetujuan bersama yang digunakan oleh kanal obrolan lain; adaptor native Discord terutama menambahkan perutean DM pemberi persetujuan dan penyebaran ke kanal. Ketika tombol tersebut tersedia, tombol menjadi UX persetujuan utama; OpenClaw hanya boleh menyertakan perintah manual `/approve` ketika hasil alat menyatakan bahwa persetujuan melalui obrolan tidak tersedia atau persetujuan manual adalah satu-satunya jalur. Jika runtime persetujuan native Discord tidak aktif, OpenClaw tetap menampilkan permintaan deterministik lokal `/approve <id> <decision>`. Jika runtime aktif tetapi kartu native tidak dapat dikirimkan ke target mana pun, OpenClaw mengirimkan pemberitahuan pilihan terakhir di obrolan yang sama dengan perintah persis `/approve` dari persetujuan yang tertunda.

    Autentikasi Gateway dan resolusi persetujuan mengikuti kontrak klien Gateway bersama (ID `plugin:` diresolusi melalui `plugin.approval.resolve`; ID lainnya melalui `exec.approval.resolve`). Persetujuan kedaluwarsa setelah 30 menit secara bawaan.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Alat dan gerbang tindakan

Tindakan pesan Discord mencakup perpesanan, administrasi kanal, moderasi, kehadiran, dan metadata.

Contoh inti:

- perpesanan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- kehadiran: `setPresence`

Tindakan `event-create` menerima parameter opsional `image` (URL atau jalur berkas lokal) untuk menetapkan gambar sampul acara terjadwal.

Gerbang tindakan berada di bawah `channels.discord.actions.*`.

Perilaku gerbang bawaan:

| Grup tindakan                                                                                                                                                             | Bawaan      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reaksi, pesan, utas, sematan, polling, pencarian, info anggota, info peran, info saluran, saluran, status suara, acara, stiker, unggahan emoji, unggahan stiker, izin | diaktifkan  |
| peran                                                                                                                                                                    | dinonaktifkan |
| moderasi                                                                                                                                                                 | dinonaktifkan |
| kehadiran                                                                                                                                                                | dinonaktifkan |

## UI komponen v2

OpenClaw menggunakan komponen Discord v2 untuk persetujuan eksekusi dan penanda lintas konteks. Tindakan pesan Discord juga dapat menerima `components` untuk UI khusus (tingkat lanjut; memerlukan penyusunan payload komponen melalui alat discord), sedangkan `embeds` lama tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` menetapkan warna aksen yang digunakan oleh kontainer komponen Discord (heksadesimal). Per akun: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` mengontrol berapa lama callback komponen Discord yang dikirim tetap terdaftar (bawaan `1800000`, maksimum `86400000`). Per akun: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` diabaikan ketika komponen v2 tersedia.
- Pratinjau URL biasa dinonaktifkan secara bawaan. Tetapkan `suppressEmbeds: false` pada tindakan pesan ketika satu tautan keluar perlu ditampilkan sebagai pratinjau.

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

Discord memiliki dua permukaan suara yang berbeda: **saluran suara** waktu nyata (percakapan berkelanjutan) dan **lampiran pesan suara** (format pratinjau bentuk gelombang). Gateway mendukung keduanya.

### Saluran suara

Daftar periksa penyiapan:

1. Aktifkan Message Content Intent di Discord Developer Portal.
2. Aktifkan Server Members Intent ketika daftar izin peran/pengguna digunakan.
3. Undang bot dengan cakupan `bot` dan `applications.commands`.
4. Berikan Connect, Speak, Send Messages, dan Read Message History di saluran suara tujuan.
5. Aktifkan perintah native (`commands.native` atau `channels.discord.commands.native`).
6. Konfigurasikan `channels.discord.voice`.

Gunakan `/vc join|leave|status` untuk mengontrol sesi. Perintah tersebut menggunakan agen bawaan akun dan mengikuti aturan daftar izin serta kebijakan grup yang sama seperti perintah Discord lainnya.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Untuk memeriksa izin efektif bot sebelum bergabung:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Contoh bergabung otomatis:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Catatan:

- Suara Discord bersifat opt-in untuk konfigurasi khusus teks; tetapkan `channels.discord.voice.enabled=true` (atau pertahankan blok `channels.discord.voice` yang sudah ada) untuk mengaktifkan perintah `/vc`, runtime suara, dan intent Gateway `GuildVoiceStates`. `channels.discord.intents.voiceStates` dapat secara eksplisit mengganti langganan intent; biarkan tidak ditetapkan agar mengikuti pengaktifan suara yang berlaku.
- `voice.mode` mengontrol jalur percakapan. Nilai defaultnya adalah `agent-proxy`: front end suara waktu nyata menangani pengaturan waktu giliran, interupsi, dan pemutaran, mendelegasikan pekerjaan substantif kepada agen OpenClaw yang dirutekan melalui `openclaw_agent_consult`, dan memperlakukan hasilnya seperti prompt Discord yang diketik oleh pembicara tersebut. `stt-tts` mempertahankan alur STT batch lama beserta TTS. `bidi` memungkinkan model waktu nyata bercakap-cakap secara langsung sambil menyediakan `openclaw_agent_consult` untuk otak OpenClaw.
- `voice.agentSession` mengontrol percakapan OpenClaw mana yang menerima giliran suara. Biarkan tidak ditetapkan untuk menggunakan sesi milik kanal suara itu sendiri, atau tetapkan `{ mode: "target", target: "channel:<text-channel-id>" }` agar kanal suara berfungsi sebagai ekstensi mikrofon/speaker dari sesi kanal teks Discord yang sudah ada, seperti `#maintainers`.
- `voice.model` mengganti otak agen OpenClaw untuk respons suara Discord dan konsultasi waktu nyata. Biarkan tidak ditetapkan untuk mewarisi model agen yang dirutekan. Pengaturan ini terpisah dari `voice.realtime.model`.
- `voice.followUsers` memungkinkan bot bergabung, berpindah, dan meninggalkan kanal suara Discord bersama pengguna yang dipilih. Lihat [Mengikuti pengguna dalam kanal suara](#follow-users-in-voice).
- `agent-proxy` merutekan ucapan melalui `discord-voice`, yang mempertahankan otorisasi pemilik/alat normal untuk pembicara dan sesi target, tetapi menyembunyikan alat agen `tts` karena pemutaran dikelola oleh suara Discord. Secara default, `agent-proxy` memberikan konsultasi akses alat penuh yang setara dengan pemilik kepada pembicara pemilik (`voice.realtime.toolPolicy: "owner"`) dan sangat mengutamakan konsultasi dengan agen OpenClaw sebelum memberikan jawaban substantif (`voice.realtime.consultPolicy: "always"`). Dalam mode `always` default tersebut, lapisan waktu nyata tidak otomatis mengucapkan kata pengisi sebelum jawaban konsultasi; lapisan ini menangkap dan mentranskripsikan ucapan, lalu mengucapkan jawaban OpenClaw yang dirutekan. Jika beberapa jawaban konsultasi paksa selesai saat Discord masih memutar jawaban pertama, jawaban ucapan persis berikutnya akan diantrekan hingga pemutaran tidak aktif, alih-alih mengganti ucapan di tengah kalimat.
- Dalam mode `stt-tts`, STT menggunakan `tools.media.audio`; `voice.model` tidak memengaruhi transkripsi.
- Dalam mode waktu nyata, `voice.realtime.provider`, `voice.realtime.model`, dan `voice.realtime.speakerVoice` mengonfigurasi sesi audio waktu nyata. Untuk OpenAI Realtime 2.1 beserta otak Codex, gunakan `voice.realtime.model: "gpt-realtime-2.1"` dan `voice.model: "openai/gpt-5.6-sol"`.
- Secara default, mode suara waktu nyata menyertakan file profil kecil `IDENTITY.md`, `USER.md`, dan `SOUL.md` dalam instruksi penyedia waktu nyata agar giliran langsung yang cepat mempertahankan identitas, konteks pengguna, dan persona yang sama seperti agen OpenClaw yang dirutekan. Tetapkan `voice.realtime.bootstrapContextFiles` ke suatu subset untuk menyesuaikannya, atau `[]` untuk menonaktifkannya. Hanya file profil tersebut yang didukung; `AGENTS.md` tetap berada dalam konteks agen normal. Konteks profil yang diinjeksi tidak menggantikan `openclaw_agent_consult` untuk pekerjaan ruang kerja, fakta terkini, pencarian memori, atau tindakan yang didukung alat.
- Dalam mode waktu nyata OpenAI `agent-proxy`, pemicu nama panggilan secara default menyesuaikan diri dengan ruangan: satu orang dapat berbicara secara alami tanpa nama panggilan, sedangkan dua orang atau lebih harus memulai atau mengakhiri giliran dengan nama panggilan. Bot lain tidak dihitung sebagai orang. Tetapkan `voice.realtime.requireWakeName: true` agar nama panggilan selalu diwajibkan atau `false` agar tidak pernah diwajibkan. Nama panggilan yang dikonfigurasi harus terdiri dari satu atau dua kata. Jika `voice.realtime.wakeNames` tidak ditetapkan, OpenClaw menggunakan `name` agen yang dirutekan ditambah `OpenClaw`, dengan fallback ke id agen ditambah `OpenClaw`. Pemicu nama panggilan yang aktif menonaktifkan respons otomatis penyedia waktu nyata, merutekan giliran yang diterima melalui jalur konsultasi agen OpenClaw, dan memberikan pengakuan lisan singkat ketika nama panggilan di awal dikenali dari transkripsi parsial sebelum transkrip akhir tiba. Kebijakan ini mengikuti aktivitas bergabung dan keluar secara langsung tanpa menyambungkan ulang suara.
- Penyedia waktu nyata OpenAI menerima nama peristiwa Realtime 2 saat ini dan alias lama yang kompatibel dengan Codex untuk peristiwa audio keluaran dan transkrip, sehingga snapshot penyedia yang kompatibel dapat berubah tanpa menghilangkan audio asisten.
- `voice.realtime.bargeIn` mengontrol apakah peristiwa mulai berbicara dari pembicara Discord menginterupsi pemutaran waktu nyata yang aktif. Jika tidak ditetapkan, pengaturan ini mengikuti pengaturan interupsi audio masukan penyedia waktu nyata.
- `voice.realtime.minBargeInAudioEndMs` mengontrol durasi minimum pemutaran asisten sebelum interupsi OpenAI waktu nyata memotong audio. Default: `250`. Tetapkan `0` untuk interupsi langsung di ruangan dengan gema rendah, atau naikkan nilainya untuk konfigurasi speaker dengan gema tinggi.
- `voice.tts` mengganti `messages.tts` hanya untuk pemutaran suara `stt-tts`; mode waktu nyata menggunakan `voice.realtime.speakerVoice` sebagai gantinya. Untuk menggunakan suara OpenAI pada pemutaran Discord, tetapkan `voice.tts.provider: "openai"` dan pilih suara Text-to-speech di bawah `voice.tts.providers.openai.speakerVoice`. `cedar` adalah pilihan dengan karakter suara maskulin yang baik pada model TTS OpenAI saat ini.
- Penggantian `systemPrompt` Discord per kanal berlaku untuk giliran transkrip suara pada kanal suara tersebut.
- Saat OpenClaw bergabung ke kanal suara, sesi agen yang dirutekan menerima peristiwa sistem senyap berisi daftar peserta saat ini. Peserta yang kemudian bergabung atau keluar akan memperbarui sesi tersebut tanpa memicu balasan lisan yang tidak diminta; nama tampilan Discord diperlakukan sebagai label yang tidak tepercaya. Giliran suara yang diotorisasi juga menerima snapshot daftar peserta terbaru.
- Giliran transkrip suara dan perintah `/vc` menggunakan entri Discord dalam `commands.ownerAllowFrom` untuk status pemilik. Jika tidak ada pemilik perintah Discord yang dikonfigurasi, `allowFrom` akun Discord yang dipilih (atau `dm.allowFrom` lama) tetap dapat mengotorisasi akses suara tanpa memberikan status pemilik. Visibilitas alat agen mengikuti kebijakan alat yang dikonfigurasi untuk sesi yang dirutekan.
- Jika `voice.autoJoin` memiliki beberapa entri untuk guild yang sama, OpenClaw bergabung ke kanal terakhir yang dikonfigurasi untuk guild tersebut.
- `voice.allowedChannels` adalah daftar izin residensi opsional. Biarkan tidak ditetapkan untuk mengizinkan `/vc join` masuk ke kanal suara Discord mana pun yang diotorisasi. Jika ditetapkan, `/vc join`, aktivitas bergabung otomatis saat startup, dan perpindahan status suara bot dibatasi ke entri `{ guildId, channelId }` yang tercantum. Tetapkan ke array kosong untuk menolak semua aktivitas bergabung ke kanal suara Discord. Jika Discord memindahkan bot ke luar daftar izin, OpenClaw akan meninggalkan kanal tersebut dan bergabung kembali ke target bergabung otomatis yang dikonfigurasi jika tersedia.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi bergabung `@discordjs/voice`; nilai default upstream adalah `daveEncryption=true` dan `decryptionFailureTolerance=24`.
- OpenClaw menggunakan codec `libopus-wasm` yang dibundel untuk penerimaan suara Discord dan pemutaran PCM mentah waktu nyata. Codec ini menyertakan build WebAssembly libopus yang versinya dipatok dan tidak memerlukan addon opus native.
- `voice.connectTimeoutMs` mengontrol waktu tunggu Ready awal `@discordjs/voice` untuk `/vc join` dan upaya bergabung otomatis. Default: `30000`.
- `voice.reconnectGraceMs` mengontrol berapa lama OpenClaw menunggu sesi suara yang terputus mulai tersambung kembali sebelum menghancurkannya. Default: `15000`.
- Dalam mode `stt-tts`, pemutaran suara tidak berhenti hanya karena pengguna lain mulai berbicara. Untuk menghindari loop umpan balik, OpenClaw mengabaikan tangkapan suara baru saat TTS sedang diputar; berbicaralah setelah pemutaran selesai untuk giliran berikutnya. Mode waktu nyata meneruskan aktivitas mulai berbicara sebagai sinyal interupsi kepada penyedia waktu nyata.
- Dalam mode waktu nyata, gema dari speaker yang masuk ke mikrofon terbuka dapat terlihat seperti interupsi dan menghentikan pemutaran. Untuk ruangan Discord dengan gema tinggi, tetapkan `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` agar OpenAI tidak menginterupsi secara otomatis saat ada audio masukan. Tambahkan `voice.realtime.bargeIn: true` jika Anda tetap ingin peristiwa mulai berbicara dari pembicara Discord menginterupsi pemutaran aktif. Jembatan waktu nyata OpenAI mengabaikan pemotongan pemutaran yang lebih pendek dari `voice.realtime.minBargeInAudioEndMs` karena dianggap sebagai kemungkinan gema/gangguan dan mencatatnya sebagai dilewati alih-alih menghapus pemutaran Discord.
- `voice.captureSilenceGraceMs` mengontrol berapa lama OpenClaw menunggu setelah Discord melaporkan bahwa pembicara telah berhenti sebelum menyelesaikan segmen audio tersebut untuk STT. Default: `2000`; naikkan nilainya jika Discord memecah jeda normal menjadi transkrip parsial yang terputus-putus.
- Ketika ElevenLabs menjadi penyedia TTS yang dipilih, pemutaran suara Discord menggunakan TTS streaming dan dimulai dari aliran respons penyedia. Penyedia tanpa dukungan streaming menggunakan fallback ke jalur file sementara hasil sintesis.
- OpenClaw memantau kegagalan dekripsi penerimaan dan memulihkan diri secara otomatis dengan meninggalkan lalu bergabung kembali ke kanal suara setelah kegagalan berulang dalam rentang waktu singkat.
- Jika log penerimaan berulang kali menampilkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` setelah pembaruan, kumpulkan laporan dependensi dan log. Baris `@discordjs/voice` yang dibundel menyertakan perbaikan padding upstream dari PR discord.js #11449, yang menutup masalah discord.js #11419.
- Peristiwa penerimaan `The operation was aborted` memang diharapkan saat OpenClaw menyelesaikan segmen pembicara yang ditangkap; peristiwa tersebut merupakan diagnostik terperinci, bukan peringatan.
- Log suara Discord terperinci menyertakan pratinjau transkrip STT satu baris dengan panjang terbatas untuk setiap segmen pembicara yang diterima, sehingga proses debug menampilkan sisi pengguna dan sisi balasan agen tanpa mencurahkan teks transkrip tanpa batas.
- Dalam mode `agent-proxy`, fallback konsultasi paksa melewati fragmen transkrip yang kemungkinan tidak lengkap, seperti teks yang diakhiri dengan `...` atau kata penghubung di akhir seperti "dan", serta penutup yang jelas tidak dapat ditindaklanjuti seperti "segera kembali" atau "sampai jumpa". Log menampilkan `forced agent consult skipped reason=...` ketika tindakan ini mencegah jawaban lama yang masih mengantre.

### Mengikuti pengguna dalam kanal suara

Gunakan `voice.followUsers` jika Anda ingin bot suara Discord tetap bersama satu atau beberapa pengguna Discord yang dikenal, alih-alih bergabung ke kanal tetap saat startup atau menunggu `/vc join`.

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

- `followUsers` menerima ID pengguna Discord mentah dan nilai `discord:<id>`. OpenClaw menormalkan kedua bentuk sebelum mencocokkan peristiwa status suara.
- `followUsersEnabled` secara default bernilai `true` ketika `followUsers` dikonfigurasi. Atur ke `false` untuk mempertahankan daftar yang disimpan tetapi menghentikan pengikutan suara otomatis.
- `followUsers` hanya mengontrol keberadaan dalam suara. Ini tidak memberikan akses pembicara atau otoritas pemilik; konfigurasikan `commands.ownerAllowFrom` serta pengguna dan peran guild atau saluran secara terpisah.
- Ketika pengguna yang diikuti bergabung ke saluran suara yang diizinkan, OpenClaw bergabung ke saluran tersebut. Ketika pengguna berpindah, OpenClaw ikut berpindah. Ketika pengguna aktif yang diikuti terputus, OpenClaw keluar.
- Jika beberapa pengguna yang diikuti berada di guild yang sama dan pengguna aktif yang diikuti keluar, OpenClaw berpindah ke saluran pengguna lain yang diikuti dan dilacak sebelum keluar dari guild. Jika beberapa pengguna yang diikuti berpindah sekaligus, peristiwa status suara yang terakhir diamati akan berlaku.
- `allowedChannels` tetap berlaku. Pengguna yang diikuti dalam saluran yang tidak diizinkan akan diabaikan, dan sesi yang dimiliki oleh pengikutan akan berpindah ke pengguna lain yang diikuti atau keluar.
- OpenClaw merekonsiliasi peristiwa status suara yang terlewat saat dimulai dan pada interval terbatas. Rekonsiliasi mengambil sampel guild yang dikonfigurasi dan membatasi pencarian REST per proses, sehingga daftar `followUsers` yang sangat besar mungkin memerlukan lebih dari satu interval untuk mencapai keadaan selaras.
- Jika Discord atau admin memindahkan bot saat bot sedang mengikuti pengguna, OpenClaw membangun ulang sesi suara dan mempertahankan kepemilikan pengikutan jika tujuan diizinkan. Jika bot dipindahkan ke luar `allowedChannels`, OpenClaw keluar dan bergabung kembali ke target yang dikonfigurasi jika ada.
- Pemulihan penerimaan DAVE dapat keluar dan bergabung kembali ke saluran yang sama setelah kegagalan dekripsi berulang. Sesi yang dimiliki oleh pengikutan mempertahankan kepemilikan pengikutannya selama jalur pemulihan tersebut, sehingga pemutusan pengguna yang diikuti setelahnya tetap membuat bot keluar dari saluran.

Pilih di antara mode bergabung:

- Gunakan `followUsers` untuk penyiapan pribadi atau operator ketika bot harus otomatis berada dalam suara saat Anda berada di sana.
- Gunakan `autoJoin` untuk bot ruang tetap yang harus tetap hadir meskipun tidak ada pengguna yang dilacak dalam suara.
- Gunakan `/vc join` untuk bergabung satu kali atau ruang tempat kehadiran suara otomatis akan terasa tidak terduga.

Codec suara Discord:

- Log penerimaan suara menampilkan `discord voice: opus decoder: libopus-wasm`.
- Pemutaran realtime mengodekan PCM stereo mentah 48 kHz menjadi Opus dengan paket `libopus-wasm` bawaan yang sama sebelum menyerahkan paket ke `@discordjs/voice`.
- Pemutaran file dan stream penyedia mentranskode menjadi PCM stereo mentah 48 kHz dengan ffmpeg, lalu menggunakan `libopus-wasm` untuk stream paket Opus yang dikirim ke Discord.

Pipeline STT plus TTS:

- Tangkapan PCM Discord dikonversi menjadi file sementara WAV.
- `tools.media.audio` menangani STT, misalnya `openai/gpt-4o-mini-transcribe`.
- Transkrip dikirim melalui jalur masuk dan perutean Discord sementara LLM respons berjalan dengan kebijakan keluaran suara yang menyembunyikan alat `tts` agen dan meminta teks dikembalikan, karena suara Discord memiliki pemutaran TTS akhir.
- `voice.model`, jika diatur, hanya mengganti LLM respons untuk giliran saluran suara ini.
- `voice.tts` digabungkan di atas `messages.tts`; penyedia yang mendukung streaming memasok pemutar secara langsung, sedangkan jika tidak, file audio yang dihasilkan diputar dalam saluran yang diikuti.

Contoh sesi saluran suara proksi agen default:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Tanpa blok `voice.agentSession`, setiap saluran suara mendapatkan sesi OpenClaw terarahnya sendiri. Misalnya, `/vc join channel:234567890123456789` berbicara dengan sesi untuk saluran suara Discord tersebut. Model realtime hanya merupakan antarmuka suara; permintaan substantif diserahkan kepada agen OpenClaw yang dikonfigurasi. Jika model realtime menghasilkan transkrip akhir tanpa memanggil alat konsultasi, OpenClaw memaksakan konsultasi sebagai fallback sehingga perilaku default tetap seperti berbicara dengan agen.

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
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Suara sebagai perluasan sesi saluran Discord yang sudah ada:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Dalam mode `agent-proxy`, bot bergabung ke saluran suara yang dikonfigurasi, tetapi giliran agen OpenClaw menggunakan sesi dan agen terarah normal milik saluran target. Sesi suara realtime mengucapkan kembali hasil yang dikembalikan ke saluran suara. Agen pengawas tetap dapat menggunakan alat pesan normal sesuai dengan kebijakan alatnya, termasuk mengirim pesan Discord terpisah jika itu merupakan tindakan yang tepat.

Saat proses OpenClaw yang didelegasikan aktif, transkrip suara Discord baru diperlakukan sebagai kontrol proses langsung sebelum memulai giliran agen lainnya. Frasa seperti "status", "batalkan itu", "gunakan perbaikan yang lebih kecil", atau "setelah selesai, periksa juga pengujian" diklasifikasikan sebagai masukan status, pembatalan, pengarahan, atau tindak lanjut untuk sesi aktif. Hasil status, pembatalan, pengarahan yang diterima, dan tindak lanjut diucapkan kembali ke saluran suara agar penelepon mengetahui apakah OpenClaw menangani permintaan tersebut.

Bentuk target yang berguna:

- `target: "channel:123456789012345678"` merutekan melalui sesi saluran teks Discord.
- `target: "123456789012345678"` diperlakukan sebagai target saluran.
- `target: "dm:123456789012345678"` atau `target: "user:123456789012345678"` merutekan melalui sesi pesan langsung tersebut.

Contoh OpenAI Realtime dengan banyak gema:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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

Gunakan ini ketika model mendengar pemutaran Discord-nya sendiri melalui mikrofon terbuka, tetapi Anda tetap ingin menyelanya dengan berbicara. OpenClaw mencegah OpenAI menyela secara otomatis berdasarkan audio masukan mentah, sementara `bargeIn: true` memungkinkan peristiwa mulai-berbicara Discord dan audio pembicara yang sudah aktif membatalkan respons realtime aktif sebelum giliran tangkapan berikutnya mencapai OpenAI. Sinyal penyelaan yang sangat awal dengan `audioEndMs` di bawah `minBargeInAudioEndMs` dianggap sebagai gema/derau dan diabaikan agar model tidak terputus pada frame pemutaran pertama.

Log suara yang diharapkan:

- Saat bergabung: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Saat realtime dimulai: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Saat ada audio pembicara: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, dan `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Saat ucapan kedaluwarsa dilewati: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` atau `reason=non-actionable-closing ...`
- Saat respons realtime selesai: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Saat pemutaran dihentikan/diatur ulang: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Saat konsultasi realtime: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Saat agen menjawab: `discord voice: agent turn answer ...`
- Saat ucapan persis diantrekan: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, diikuti oleh `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Saat penyelaan terdeteksi: `discord voice: realtime barge-in detected source=speaker-start ...` atau `discord voice: realtime barge-in detected source=active-speaker-audio ...`, diikuti oleh `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Saat realtime disela: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, diikuti oleh `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` atau `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Saat gema/derau diabaikan: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Saat penyelaan dinonaktifkan: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Saat pemutaran diam: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Untuk men-debug audio yang terpotong, baca log suara realtime sebagai linimasa:

1. `realtime audio playback started` berarti Discord telah mulai memutar audio asisten. Bridge mulai menghitung potongan keluaran asisten, byte PCM Discord, byte realtime penyedia, dan durasi audio yang disintesis dari titik ini.
2. `realtime speaker turn opened` menandai pembicara Discord menjadi aktif. Jika pemutaran sudah aktif dan `bargeIn` diaktifkan, ini dapat diikuti oleh `barge-in detected source=speaker-start`.
3. `realtime input audio started` menandai frame audio aktual pertama yang diterima untuk giliran pembicara tersebut. `outputActive=true` atau nilai `outputAudioMs` bukan nol di sini berarti mikrofon mengirim masukan saat pemutaran asisten masih aktif.
4. `barge-in detected source=active-speaker-audio` berarti OpenClaw mendeteksi audio pembicara langsung saat pemutaran asisten aktif. Ini berguna untuk membedakan penyelaan nyata dari peristiwa mulai-berbicara Discord tanpa audio yang berguna.
5. `barge-in requested reason=...` berarti OpenClaw meminta penyedia realtime untuk membatalkan atau memotong respons aktif. Ini menyertakan `outputAudioMs`, `outputActive`, dan `playbackChunks` agar Anda dapat melihat berapa banyak audio asisten yang benar-benar telah diputar sebelum penyelaan.
6. `realtime audio playback stopped reason=...` adalah titik pengaturan ulang pemutaran Discord lokal. Alasannya menunjukkan pihak yang menghentikan pemutaran: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, atau `session-close`.
7. `realtime speaker turn closed` merangkum giliran masukan yang ditangkap. `chunks=0` atau `hasAudio=false` berarti giliran pembicara dibuka tetapi tidak ada audio yang dapat digunakan mencapai bridge realtime. `interruptedPlayback=true` berarti giliran masukan tersebut bertumpang tindih dengan keluaran asisten dan memicu logika penyelaan.

Bidang yang berguna:

- `outputAudioMs`: durasi audio asisten yang dihasilkan oleh penyedia realtime sebelum baris log.
- `audioMs`: durasi audio asisten yang dihitung OpenClaw sebelum pemutaran berhenti.
- `elapsedMs`: waktu jam dinding antara membuka dan menutup stream pemutaran atau giliran pembicara.
- `discordBytes`: byte PCM stereo 48 kHz yang dikirim ke atau diterima dari suara Discord.
- `realtimeBytes`: byte PCM dalam format penyedia yang dikirim ke atau diterima dari penyedia realtime.
- `playbackChunks`: potongan audio asisten yang diteruskan ke Discord untuk respons aktif.
- `sinceLastAudioMs`: jeda antara frame audio pembicara terakhir yang ditangkap dan penutupan giliran pembicara.

Pola umum:

- Pemutusan langsung dengan `source=active-speaker-audio`, `outputAudioMs` kecil, dan pengguna yang sama di dekatnya biasanya menunjukkan bahwa gema speaker masuk ke mikrofon. Naikkan `voice.realtime.minBargeInAudioEndMs`, turunkan volume speaker, gunakan headphone, atau atur `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` yang diikuti oleh `speaker turn closed ... hasAudio=false` berarti Discord melaporkan bahwa speaker mulai berbicara, tetapi tidak ada audio yang mencapai OpenClaw. Hal ini dapat disebabkan oleh peristiwa suara Discord sementara, perilaku gerbang derau, atau klien yang mengaktifkan mikrofon sesaat.
- `audio playback stopped reason=stream-close` tanpa interupsi di dekatnya atau `provider-clear-audio` berarti aliran pemutaran Discord lokal berakhir secara tidak terduga. Periksa log penyedia dan pemutar Discord sebelumnya.
- `capture ignored during playback (barge-in disabled)` berarti OpenClaw sengaja membuang input saat audio asisten aktif. Aktifkan `voice.realtime.bargeIn` jika Anda ingin ucapan menginterupsi pemutaran.
- `barge-in ignored ... outputActive=false` berarti VAD Discord atau penyedia mendeteksi ucapan, tetapi OpenClaw tidak memiliki pemutaran aktif untuk diinterupsi. Hal ini seharusnya tidak memutus audio.

Kredensial diatasi per komponen: autentikasi rute LLM untuk `voice.model`, autentikasi STT untuk `tools.media.audio`, autentikasi TTS untuk `messages.tts`/`voice.tts`, dan autentikasi penyedia waktu nyata untuk `voice.realtime.providers` atau konfigurasi autentikasi normal penyedia.

### Pesan suara

Pesan suara Discord menampilkan pratinjau bentuk gelombang dan memerlukan audio OGG/Opus. OpenClaw menghasilkan bentuk gelombang secara otomatis, tetapi memerlukan `ffmpeg` dan `ffprobe` pada host Gateway untuk memeriksa dan mengonversinya.

- Berikan **jalur file lokal** (URL ditolak).
- Hilangkan konten teks (Discord menolak teks + pesan suara dalam payload yang sama).
- Format audio apa pun diterima; OpenClaw mengonversinya ke OGG/Opus sesuai kebutuhan.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Menggunakan intent yang tidak diizinkan atau bot tidak melihat pesan guild">

    - aktifkan Message Content Intent
    - aktifkan Server Members Intent saat Anda bergantung pada resolusi pengguna/anggota
    - mulai ulang Gateway setelah mengubah intent

  </Accordion>

  <Accordion title="Pesan guild diblokir secara tidak terduga">

    - verifikasi `groupPolicy`
    - verifikasi daftar izin guild di bawah `channels.discord.guilds`
    - jika ada peta `channels` guild, hanya saluran yang tercantum yang diizinkan
    - verifikasi perilaku `requireMention` dan pola penyebutan

    Pemeriksaan yang berguna:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Penyebutan tidak diwajibkan, tetapi masih diblokir">
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

    - akun tunggal: `channels.discord.eventQueue.listenerTimeout`
    - multiakun: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ini hanya mengontrol pekerjaan listener Gateway Discord, bukan masa aktif giliran agen

    Discord tidak menerapkan batas waktu milik saluran pada giliran agen yang diantrekan. Listener pesan segera menyerahkan pekerjaan, dan proses Discord yang diantrekan mempertahankan urutan per sesi hingga siklus hidup sesi/alat/runtime selesai atau membatalkan pekerjaan.

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

  <Accordion title="Peringatan batas waktu pencarian metadata Gateway">
    OpenClaw mengambil metadata `/gateway/bot` Discord sebelum terhubung. Kegagalan sementara beralih ke URL Gateway default Discord dan dibatasi lajunya dalam log.

    Pengaturan batas waktu metadata:

    - akun tunggal: `channels.discord.gatewayInfoTimeoutMs`
    - multiakun: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env saat konfigurasi belum diatur: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - default: `30000` (30 detik), maksimum: `120000`

  </Accordion>

  <Accordion title="Mulai ulang akibat batas waktu READY Gateway">
    OpenClaw menunggu peristiwa `READY` Gateway Discord selama proses mulai dan setelah penyambungan kembali runtime. Penyiapan multiakun dengan permulaan bertahap mungkin memerlukan rentang waktu READY permulaan yang lebih lama daripada default.

    Pengaturan batas waktu READY:

    - permulaan akun tunggal: `channels.discord.gatewayReadyTimeoutMs`
    - permulaan multiakun: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env permulaan saat konfigurasi belum diatur: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - default permulaan: `15000` (15 detik), maksimum: `120000`
    - runtime akun tunggal: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multiakun: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env runtime saat konfigurasi belum diatur: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - default runtime: `30000` (30 detik), maksimum: `120000`

  </Accordion>

  <Accordion title="Ketidakcocokan audit izin">
    Pemeriksaan izin `channels status --probe` hanya berfungsi untuk ID saluran numerik.

    Jika Anda menggunakan kunci slug, pencocokan runtime masih dapat berfungsi, tetapi probe tidak dapat memverifikasi izin sepenuhnya.

  </Accordion>

  <Accordion title="Masalah DM dan pemasangan">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (lama: `channels.discord.dm.policy`)
    - menunggu persetujuan pemasangan dalam mode `pairing`

  </Accordion>

  <Accordion title="Perulangan antarbot">
    Secara default, pesan yang dibuat oleh bot diabaikan.

    Jika Anda mengatur `channels.discord.allowBots=true`, gunakan aturan penyebutan dan daftar izin yang ketat untuk menghindari perilaku perulangan.
    Utamakan `channels.discord.allowBots="mentions"` agar hanya menerima pesan bot yang menyebut bot tersebut.

    OpenClaw juga menyertakan [perlindungan perulangan bot](/id/channels/bot-loop-protection) bersama. Setiap kali `allowBots` memungkinkan pesan yang dibuat oleh bot mencapai pengiriman, Discord memetakan peristiwa masuk ke fakta `(account, channel, bot pair)` dan pengaman pasangan generik menekan pasangan tersebut setelah melampaui anggaran peristiwa yang dikonfigurasi. Pengaman ini mencegah perulangan dua bot yang tak terkendali, yang sebelumnya harus dihentikan oleh batas laju Discord; pengaman ini tidak memengaruhi penerapan bot tunggal atau balasan bot satu kali yang tetap di bawah anggaran.

    Pengaturan default (aktif saat `allowBots` diatur):

    - `maxEventsPerWindow: 20` -- pasangan bot dapat bertukar 20 pesan dalam jendela bergulir
    - `windowSeconds: 60` -- panjang jendela bergulir
    - `cooldownSeconds: 60` -- setelah anggaran terlampaui, setiap pesan antarbot tambahan dalam kedua arah dibuang selama satu menit

    Konfigurasikan default bersama sekali di bawah `channels.defaults.botLoopProtection`, lalu timpa Discord saat alur kerja yang sah memerlukan kapasitas lebih besar. Urutan prioritasnya adalah:

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
      // Timpa opsional untuk seluruh Discord. Blok akun menimpa setiap
      // bidang dan mewarisi bidang yang dihilangkan dari sini.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha hanya mendengarkan bot lain saat mereka menyebutnya.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo mendengarkan semua pesan Discord yang dibuat oleh bot.
          allowBots: true,
          mentionAliases: {
            // Memungkinkan Bravo menulis penyebutan Discord Alpha dengan ID pengguna yang dikonfigurasi.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Izinkan hingga lima pesan per menit sebelum menekan pasangan.
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

  <Accordion title="STT suara terputus dengan DecryptionFailed(...)">

    - pastikan OpenClaw tetap mutakhir (`openclaw update`) agar logika pemulihan penerimaan suara Discord tersedia
    - konfirmasikan `channels.discord.voice.daveEncryption=true` (default)
    - mulai dari `channels.discord.voice.decryptionFailureTolerance=24` (default upstream) dan sesuaikan hanya jika diperlukan
    - pantau log untuk:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jika kegagalan berlanjut setelah bergabung kembali secara otomatis, kumpulkan log dan bandingkan dengan riwayat penerimaan DAVE upstream di [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) dan [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Discord](/id/gateway/config-channels#discord).

<Accordion title="Bidang Discord bersinyal tinggi">

- permulaan/autentikasi: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- kebijakan: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- perintah: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- antrean peristiwa: `eventQueue.listenerTimeout` (anggaran listener, default `120000`), `eventQueue.maxQueueSize` (default `10000`), `eventQueue.maxConcurrency` (default `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- balasan/riwayat: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit` (default `2000`), `maxLinesPerMessage` (default `17`)
- streaming: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (kunci datar lama `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` dimigrasikan ke `streaming.*` oleh `openclaw doctor --fix`)
- media/coba lagi: `mediaMaxMb` (membatasi unggahan keluar Discord, default `100`), `retry`
- tindakan: `actions.*`
- kehadiran: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- UI: `ui.components.accentColor`
- fitur: `threadBindings`, tingkat atas `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `activities`, `heartbeat`, `responsePrefix`

</Accordion>

### Aktivitas Discord

Atur `channels.discord.activities` agar agen dapat memposting widget HTML mandiri yang terbuka di dalam Discord. Blok ini bersifat ikut serta; jika tidak ada, OpenClaw tidak mendaftarkan rute Activity, alat, atau penangan interaksi apa pun. Lihat [Aktivitas Discord](/channels/discord-activities) untuk penyiapan Developer Portal, tunnel, keamanan, dan pemecahan masalah.

- `activities.clientSecret`: rahasia klien OAuth2 untuk aplikasi Discord; beralih ke `DISCORD_CLIENT_SECRET`
- `activities.applicationId`: ID aplikasi Activity opsional; default-nya adalah ID aplikasi bot yang diperoleh saat Gateway dimulai

## Keamanan dan operasi

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` lebih disarankan di lingkungan yang diawasi).
- Berikan izin Discord dengan hak akses paling minimum.
- Jika penerapan/status perintah sudah usang, mulai ulang Gateway dan periksa kembali dengan `openclaw channels status --probe`.

## Terkait

<CardGroup cols={2}>
  <Card title="Aktivitas Discord" icon="window" href="/channels/discord-activities">
    Luncurkan widget HTML interaktif di dalam Discord.
  </Card>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Discord dengan Gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku obrolan grup dan daftar izin.
  </Card>
  <Card title="Perutean kanal" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan penguatan keamanan.
  </Card>
  <Card title="Perutean multiagen" icon="sitemap" href="/id/concepts/multi-agent">
    Petakan guild dan kanal ke agen.
  </Card>
  <Card title="Perintah garis miring" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native.
  </Card>
</CardGroup>
