---
read_when:
    - Mengerjakan fitur saluran Discord
summary: Penyiapan bot Discord, kunci konfigurasi, komponen, suara, dan pemecahan masalah
title: Discord
x-i18n:
    generated_at: "2026-07-12T13:58:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw terhubung ke Discord sebagai bot melalui gateway resmi Discord. DM dan saluran guild didukung.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    DM Discord secara bawaan menggunakan mode pemasangan.
  </Card>
  <Card title="Perintah garis miring" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah saluran" icon="wrench" href="/id/channels/troubleshooting">
    Alur diagnostik dan perbaikan lintas saluran.
  </Card>
</CardGroup>

## Penyiapan cepat

Buat aplikasi Discord dengan bot, tambahkan bot tersebut ke server Anda, lalu pasangkan dengan OpenClaw. Gunakan server privat jika memungkinkan; jika perlu, [buat server terlebih dahulu](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**).

<Steps>
  <Step title="Buat aplikasi dan bot Discord">
    Di [Discord Developer Portal](https://discord.com/developers/applications), klik **New Application** dan beri nama (misalnya "OpenClaw").

    Buka **Bot** di bilah sisi dan atur **Username** ke nama agen Anda.

  </Step>

  <Step title="Aktifkan intent istimewa">
    Masih di halaman **Bot**, pada bagian **Privileged Gateway Intents**, aktifkan:

    - **Message Content Intent** (wajib)
    - **Server Members Intent** (disarankan; wajib untuk daftar izin peran, pencocokan nama ke ID, dan grup akses audiens saluran)
    - **Presence Intent** (opsional; hanya untuk pembaruan kehadiran)

  </Step>

  <Step title="Salin token bot Anda">
    Di halaman **Bot**, klik **Reset Token** dan salin token tersebut.

    <Note>
    Terlepas dari namanya, tindakan ini menghasilkan token pertama Anda—tidak ada yang sedang "diatur ulang".
    </Note>

  </Step>

  <Step title="Buat URL undangan dan tambahkan bot ke server Anda">
    Buka **OAuth2** di bilah sisi. Di **OAuth2 URL Generator**, aktifkan cakupan:

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

    Itu adalah konfigurasi dasar untuk saluran teks biasa. Jika bot akan mengirim pesan di utas—termasuk alur kerja saluran forum atau media yang membuat atau melanjutkan utas—aktifkan juga **Send Messages in Threads**.

    Salin URL yang dihasilkan, buka di peramban, pilih server Anda, lalu klik **Continue**. Bot tersebut kini seharusnya muncul di server Anda.

  </Step>

  <Step title="Aktifkan Mode Pengembang dan kumpulkan ID Anda">
    Di aplikasi Discord, aktifkan Mode Pengembang agar Anda dapat menyalin ID:

    1. **User Settings** (ikon roda gigi) → **Developer** → aktifkan **Developer Mode**
       *(di perangkat seluler: **App Settings** → **Advanced**)*
    2. Klik kanan **ikon server** Anda → **Copy Server ID**
    3. Klik kanan **avatar Anda sendiri** → **Copy User ID**

    Simpan ID Server dan ID Pengguna bersama token bot Anda; Anda memerlukan ketiganya pada langkah berikutnya.

  </Step>

  <Step title="Izinkan DM dari anggota server">
    Agar pemasangan berfungsi, Discord harus mengizinkan bot mengirim DM kepada Anda. Klik kanan **ikon server** Anda → **Privacy Settings** → aktifkan **Direct Messages**.

    Biarkan tetap aktif jika Anda menggunakan DM Discord dengan OpenClaw. Jika Anda hanya menggunakan saluran guild, Anda dapat menonaktifkannya setelah pemasangan.

  </Step>

  <Step title="Atur token bot Anda dengan aman (jangan kirim melalui obrolan)">
    Token bot adalah rahasia. Atur token tersebut pada mesin yang menjalankan OpenClaw sebelum mengirim pesan kepada agen Anda:

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

    Jika OpenClaw sudah berjalan sebagai layanan latar belakang, mulai ulang melalui aplikasi OpenClaw Mac atau dengan menghentikan dan menjalankan kembali proses `openclaw gateway run`.
    Untuk instalasi layanan terkelola, jalankan `openclaw gateway install` dari shell tempat `DISCORD_BOT_TOKEN` telah diatur, atau simpan variabel tersebut di `~/.openclaw/.env` agar layanan dapat menyelesaikan SecretRef lingkungan setelah dimulai ulang.
    Jika host Anda diblokir atau dibatasi lajunya oleh pencarian aplikasi saat awal operasi Discord, atur ID aplikasi/klien dari Developer Portal agar proses awal operasi dapat melewati panggilan REST tersebut: `channels.discord.applicationId` untuk akun bawaan, atau `channels.discord.accounts.<accountId>.applicationId` untuk masing-masing bot.

  </Step>

  <Step title="Konfigurasikan OpenClaw dan lakukan pemasangan">

    <Tabs>
      <Tab title="Minta agen Anda">
        Mengobrollah dengan agen OpenClaw Anda di saluran yang sudah ada (misalnya Telegram) dan sampaikan instruksi berikut. Jika Discord adalah saluran pertama Anda, gunakan tab CLI / konfigurasi.

        > "Saya sudah mengatur token bot Discord saya di konfigurasi. Selesaikan penyiapan Discord dengan ID Pengguna `<user_id>` dan ID Server `<server_id>`."
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

        Fallback lingkungan untuk akun bawaan:

```bash
DISCORD_BOT_TOKEN=...
```

        Untuk penyiapan terotomatisasi atau jarak jauh, tulis blok JSON5 yang sama dengan `openclaw config patch --file ./discord.patch.json5 --dry-run`, lalu jalankan kembali tanpa `--dry-run`. String `token` teks biasa juga berfungsi, dan nilai SecretRef didukung untuk `channels.discord.token` di seluruh penyedia lingkungan/berkas/eksekusi. Lihat [Pengelolaan Rahasia](/id/gateway/secrets).

        Untuk beberapa bot Discord, simpan setiap token bot dan ID aplikasi di bawah akunnya masing-masing. `channels.discord.applicationId` tingkat atas diwarisi oleh akun, jadi atur hanya di sana jika setiap akun menggunakan ID aplikasi yang sama.

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
    Setelah gateway berjalan, kirim DM kepada bot Anda di Discord. Bot akan membalas dengan kode pemasangan.

    <Tabs>
      <Tab title="Minta agen Anda">
        Kirim kode pemasangan kepada agen Anda di saluran yang sudah ada:

        > "Setujui kode pemasangan Discord ini: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Kode pemasangan kedaluwarsa setelah 1 jam. Setelah disetujui, mengobrollah dengan agen Anda melalui DM Discord.

  </Step>
</Steps>

<Note>
Resolusi token mempertimbangkan akun. Nilai token konfigurasi mengungguli fallback lingkungan, dan `DISCORD_BOT_TOKEN` hanya digunakan untuk akun bawaan.
Jika dua akun Discord yang diaktifkan menghasilkan token bot yang sama, OpenClaw hanya memulai satu monitor gateway untuk token tersebut: token dari konfigurasi mengungguli fallback lingkungan; jika tidak, akun aktif pertama yang menang dan akun duplikat dilaporkan dinonaktifkan dengan alasan `duplicate bot token`.
Untuk panggilan keluar tingkat lanjut (alat pesan/tindakan saluran), `token` eksplisit per panggilan digunakan untuk panggilan tersebut. Ini berlaku untuk tindakan pengiriman dan tindakan bergaya baca/probe (baca/cari/ambil/utas/pin/izin). Kebijakan akun/pengaturan percobaan ulang tetap berasal dari akun yang dipilih dalam snapshot runtime aktif.
</Note>

## Disarankan: Siapkan ruang kerja guild

Setelah DM berfungsi, Anda dapat mengubah server menjadi ruang kerja lengkap tempat setiap saluran memperoleh sesi agennya sendiri dengan konteks tersendiri. Disarankan untuk server privat yang hanya berisi Anda dan bot Anda.

<Steps>
  <Step title="Tambahkan server Anda ke daftar izin guild">
    Ini memungkinkan agen Anda merespons di saluran mana pun pada server Anda, bukan hanya melalui DM.

    <Tabs>
      <Tab title="Minta agen Anda">
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

  <Step title="Izinkan respons tanpa @sebutan">
    Secara bawaan, agen hanya merespons di saluran guild ketika @disebut. Di server privat, Anda mungkin ingin agen merespons setiap pesan.

    Di saluran guild, balasan biasa dikirim secara otomatis secara bawaan. Untuk ruang bersama yang selalu aktif, pilih `messages.groupChat.visibleReplies: "message_tool"` agar agen dapat mengamati secara pasif dan hanya mengirim pesan ketika memutuskan bahwa balasan di saluran akan berguna. Ini bekerja paling baik dengan model generasi terbaru yang andal dalam penggunaan alat, seperti GPT-5.6 Sol. Peristiwa ruang sekitar tetap senyap kecuali alat mengirim pesan. Lihat [Peristiwa ruang sekitar](/id/channels/ambient-room-events) untuk konfigurasi lengkap mode pengamatan pasif.

    Jika Discord menampilkan indikator mengetik dan log menunjukkan penggunaan token tetapi tidak ada pesan yang dikirim, periksa apakah giliran tersebut dikonfigurasi sebagai peristiwa ruang sekitar atau memilih balasan terlihat melalui alat pesan.

    <Tabs>
      <Tab title="Minta agen Anda">
        > "Izinkan agen saya merespons di server ini tanpa harus @disebut"
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

  <Step title="Rencanakan memori di saluran guild">
    Memori jangka panjang (MEMORY.md) hanya dimuat otomatis dalam sesi DM; saluran guild tidak memuatnya.

    <Tabs>
      <Tab title="Minta agen Anda">
        > "Ketika saya mengajukan pertanyaan di saluran Discord, gunakan memory_search atau memory_get jika Anda memerlukan konteks jangka panjang dari MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Untuk konteks bersama di setiap saluran, letakkan instruksi stabil di `AGENTS.md` atau `USER.md` (disisipkan untuk setiap sesi). Simpan catatan jangka panjang di `MEMORY.md` dan akses sesuai kebutuhan menggunakan alat memori.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Sekarang buat saluran dan mulailah mengobrol. Agen melihat nama saluran, dan setiap saluran merupakan sesi terisolasi—siapkan `#coding`, `#home`, `#research`, atau apa pun yang sesuai dengan alur kerja Anda.

## Model runtime

- Gateway memiliki koneksi Discord.
- Perutean balasan bersifat deterministik: balasan masuk dari Discord kembali ke Discord.
- Metadata guild/saluran Discord ditambahkan ke prompt model sebagai konteks tidak tepercaya, bukan sebagai prefiks balasan yang terlihat oleh pengguna. Jika model menyalin kembali selubung tersebut, OpenClaw menghapus metadata yang disalin dari balasan keluar dan dari konteks pemutaran ulang berikutnya.
- Secara bawaan (`session.dmScope=main`), obrolan langsung berbagi sesi utama agen (`agent:main:main`).
- Saluran guild memiliki kunci sesi terisolasi (`agent:<agentId>:discord:channel:<channelId>`).
- DM grup diabaikan secara bawaan (`channels.discord.dm.groupEnabled=false`).
- Perintah garis miring native berjalan dalam sesi perintah terisolasi (`agent:<agentId>:discord:slash:<userId>`), sambil tetap membawa `CommandTargetSessionKey` ke sesi percakapan yang dirutekan.
- Pengiriman pengumuman Cron/Heartbeat khusus teks ke Discord diringkas menjadi jawaban akhir yang terlihat dari asisten dan dikirim satu kali. Payload media dan komponen terstruktur tetap terdiri dari beberapa pesan ketika agen menghasilkan beberapa payload yang dapat dikirimkan.

## Saluran forum

Saluran forum dan media Discord hanya menerima kiriman utas. OpenClaw mendukung dua cara untuk membuatnya:

- Kirim pesan ke induk forum (`channel:<forumId>`) untuk membuat utas secara otomatis. Judul utas diambil dari baris pertama pesan yang tidak kosong (dipotong sesuai batas nama utas Discord, yaitu 100 karakter).
- Gunakan `openclaw message thread create` untuk membuat utas secara langsung. Jangan teruskan `--message-id` untuk kanal forum.

Kirim ke induk forum untuk membuat utas:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Buat utas forum secara eksplisit:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Induk forum tidak menerima komponen Discord. Jika Anda memerlukan komponen, kirim ke utas itu sendiri (`channel:<threadId>`).

## Komponen interaktif

OpenClaw mendukung kontainer komponen v2 Discord untuk pesan agen. Gunakan alat pesan dengan muatan `components`. Hasil interaksi dirutekan kembali ke agen sebagai pesan masuk biasa dan mengikuti pengaturan `replyToMode` Discord yang ada.

Blok yang didukung:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Baris tindakan dapat memuat hingga 5 tombol atau satu menu pilihan
- Jenis pilihan: `string`, `user`, `role`, `mentionable`, `channel`

Secara bawaan, komponen hanya dapat digunakan sekali. Atur `components.reusable=true` agar tombol, pilihan, dan formulir dapat digunakan beberapa kali hingga kedaluwarsa.

Untuk membatasi siapa yang dapat mengeklik tombol, atur `allowedUsers` pada tombol tersebut (ID pengguna Discord, tag, atau `*`). Pengguna yang tidak cocok menerima penolakan sementara.

Panggilan balik komponen secara bawaan kedaluwarsa setelah 30 menit. Atur `channels.discord.agentComponents.ttlMs` untuk mengubah masa aktif registri panggilan balik bagi akun bawaan, atau `channels.discord.accounts.<accountId>.agentComponents.ttlMs` untuk setiap akun. Nilainya dalam milidetik, harus berupa bilangan bulat positif, dan dibatasi hingga `86400000` (24 jam). TTL yang lebih panjang cocok untuk alur kerja peninjauan/persetujuan yang mengharuskan tombol tetap dapat digunakan, tetapi memperpanjang periode ketika pesan Discord lama masih dapat memicu tindakan. Pilih TTL sesingkat mungkin yang sesuai dengan kebutuhan, dan pertahankan nilai bawaan jika panggilan balik usang akan menimbulkan kejutan.

Perintah garis miring `/model` dan `/models` membuka pemilih model interaktif dengan daftar tarik-turun penyedia, model, dan runtime yang kompatibel, serta langkah Submit. `/models add` sudah tidak digunakan dan mengembalikan pesan penghentian penggunaan alih-alih mendaftarkan model dari obrolan. Balasan pemilih bersifat sementara dan hanya dapat digunakan oleh pengguna yang memanggilnya. Menu pilihan Discord dibatasi hingga 25 opsi, jadi tambahkan entri `provider/*` ke `agents.defaults.models` jika Anda ingin pemilih hanya menampilkan model yang ditemukan secara dinamis untuk penyedia tertentu seperti `openai` atau `vllm`.

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

    - `pairing` (bawaan)
    - `allowlist` (memerlukan setidaknya satu pengirim `allowFrom`)
    - `open` (mengharuskan `channels.discord.allowFrom` menyertakan `"*"`)
    - `disabled`

    Jika kebijakan DM tidak terbuka, pengguna yang tidak dikenal akan diblokir (atau diminta melakukan pemasangan dalam mode `pairing`).

    Urutan prioritas multiakun:

    - `channels.discord.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Untuk satu akun, `allowFrom` lebih diprioritaskan daripada `dm.allowFrom` lama.
    - Akun bernama mewarisi `channels.discord.allowFrom` jika `allowFrom` miliknya sendiri dan `dm.allowFrom` lama belum diatur.
    - Akun bernama tidak mewarisi `channels.discord.accounts.default.allowFrom`.

    `channels.discord.dm.policy` dan `channels.discord.dm.allowFrom` lama masih dibaca demi kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` jika dapat dilakukan tanpa mengubah akses.

    Format target DM untuk pengiriman:

    - `user:<id>`
    - penyebutan `<@id>`

    ID numerik tanpa awalan biasanya ditetapkan sebagai ID kanal saat bawaan kanal aktif, tetapi ID yang tercantum dalam `allowFrom` DM efektif akun diperlakukan sebagai target DM pengguna demi kompatibilitas.

  </Tab>

  <Tab title="Access groups">
    DM Discord dan otorisasi perintah teks dapat menggunakan entri dinamis `accessGroup:<name>` dalam `channels.discord.allowFrom`.

    Nama grup akses digunakan bersama di seluruh kanal pesan. Gunakan `type: "message.senders"` untuk grup statis yang anggotanya dinyatakan dengan sintaks `allowFrom` normal pada setiap kanal, atau `type: "discord.channelAudience"` ketika audiens `ViewChannel` terkini suatu kanal Discord harus menentukan keanggotaan secara dinamis. Perilaku grup akses bersama: [Grup akses](/id/channels/access-groups).

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

    Kanal teks Discord tidak memiliki daftar anggota terpisah. `type: "discord.channelAudience"` memodelkan keanggotaan sebagai berikut: pengirim DM merupakan anggota guild yang dikonfigurasi dan saat ini memiliki izin `ViewChannel` efektif pada kanal yang dikonfigurasi setelah penimpaan peran dan kanal diterapkan.

    Contoh: izinkan siapa pun yang dapat melihat `#maintainers` untuk mengirim DM kepada bot, sementara DM tetap tertutup bagi semua orang lainnya.

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

    Pencarian akan gagal dalam keadaan tertutup. Jika Discord mengembalikan `Missing Access`, pencarian anggota gagal, atau kanal tersebut milik guild lain, pengirim DM dianggap tidak berwenang.

    Aktifkan **Server Members Intent** di Discord Developer Portal saat menggunakan grup akses berbasis audiens kanal. DM tidak menyertakan status anggota guild, sehingga OpenClaw menetapkan anggota melalui REST Discord pada saat otorisasi.

  </Tab>

  <Tab title="Guild policy">
    Penanganan guild dikontrol oleh `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    Tolok ukur aman saat `channels.discord` tersedia adalah `allowlist`.

    Perilaku `allowlist`:

    - guild harus cocok dengan `channels.discord.guilds` (`id` lebih disarankan, slug diterima)
    - daftar izin pengirim opsional: `users` (ID stabil disarankan) dan `roles` (hanya ID peran); jika salah satunya dikonfigurasi, pengirim diizinkan ketika cocok dengan `users` ATAU `roles`
    - pencocokan nama/tag secara langsung dinonaktifkan secara bawaan; aktifkan `channels.discord.dangerouslyAllowNameMatching: true` hanya sebagai mode kompatibilitas darurat
    - nama/tag didukung untuk `users`, tetapi ID lebih aman; `openclaw security audit` memberikan peringatan ketika entri nama/tag digunakan
    - jika suatu guild memiliki `channels` yang dikonfigurasi, kanal yang tidak tercantum akan ditolak
    - jika suatu guild tidak memiliki blok `channels`, semua kanal dalam guild yang masuk daftar izin tersebut akan diizinkan

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

    Kunci `allow` lama per kanal dimigrasikan ke `enabled` oleh `openclaw doctor --fix`.

    Jika Anda hanya mengatur `DISCORD_BOT_TOKEN` dan tidak membuat blok `channels.discord`, fallback runtime adalah `groupPolicy="allowlist"` (dengan peringatan dalam log), meskipun `channels.defaults.groupPolicy` bernilai `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Pesan guild secara bawaan memerlukan penyebutan.

    Deteksi penyebutan mencakup:

    - penyebutan bot secara eksplisit
    - pola penyebutan yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, dengan fallback `messages.groupChat.mentionPatterns`)
    - perilaku balas-ke-bot implisit dalam kasus yang didukung

    Saat menulis pesan Discord keluar, gunakan sintaks penyebutan kanonis: `<@USER_ID>` untuk pengguna, `<#CHANNEL_ID>` untuk kanal, dan `<@&ROLE_ID>` untuk peran. Jangan gunakan bentuk penyebutan nama panggilan lama `<@!USER_ID>`.

    `requireMention` dikonfigurasi per guild/kanal (`channels.discord.guilds...`).
    `ignoreOtherMentions` secara opsional mengabaikan pesan yang menyebut pengguna/peran lain tetapi tidak menyebut bot (kecuali @everyone/@here).

    DM grup:

    - bawaan: diabaikan (`dm.groupEnabled=false`)
    - daftar izin opsional melalui `dm.groupChannels` (ID kanal atau slug)

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
- Penggantian per kanal: `channels.discord.commands.native`.
- `commands.native=false` melewati pendaftaran dan pembersihan perintah garis miring Discord saat dimulai. Perintah yang sebelumnya didaftarkan mungkin tetap terlihat di Discord hingga Anda menghapusnya dari aplikasi Discord.
- Autentikasi perintah native menggunakan daftar izin/kebijakan Discord yang sama dengan penanganan pesan biasa.
- Perintah mungkin tetap terlihat di UI Discord bagi pengguna yang tidak berwenang; eksekusinya menerapkan autentikasi OpenClaw dan membalas "not authorized".
- Pengaturan default perintah garis miring: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Lihat [Perintah garis miring](/id/tools/slash-commands) untuk katalog dan perilaku perintah.

## Detail fitur

<AccordionGroup>
  <Accordion title="Tag balasan dan balasan native">
    Discord mendukung tag balasan dalam keluaran agen:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Dikendalikan oleh `channels.discord.replyToMode`:

    - `off` (default): tidak ada pengelompokan utas balasan implisit; tag eksplisit `[[reply_to_*]]` tetap dipatuhi
    - `first`: melampirkan referensi balasan native implisit ke pesan Discord keluar pertama dalam giliran tersebut
    - `all`: melampirkannya ke setiap pesan keluar
    - `batched`: melampirkannya hanya ketika peristiwa masuk merupakan batch beberapa pesan yang ditunda — berguna ketika Anda menginginkan balasan native terutama untuk percakapan beruntun yang ambigu, bukan setiap giliran dengan satu pesan

    ID pesan ditampilkan dalam konteks/riwayat agar agen dapat menargetkan pesan tertentu.

  </Accordion>

  <Accordion title="Pratinjau tautan">
    Discord secara default menghasilkan sematan tautan kaya untuk URL. Secara default, OpenClaw menyembunyikan sematan yang dihasilkan tersebut pada pesan Discord keluar, sehingga URL yang dikirim agen tetap berupa tautan biasa kecuali Anda mengaktifkannya:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Atur `channels.discord.accounts.<id>.suppressEmbeds` untuk mengganti pengaturan satu akun. Pengiriman melalui alat pesan agen juga dapat meneruskan `suppressEmbeds: false` untuk satu pesan. Muatan `embeds` Discord eksplisit tidak disembunyikan oleh pengaturan default pratinjau tautan.

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

    - `off` menonaktifkan pengeditan pratinjau Discord.
    - `partial` mengedit satu pesan pratinjau saat token diterima.
    - `block` memancarkan potongan berukuran draf; sesuaikan ukuran dan titik pemisah dengan `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), yang dibatasi hingga `textChunkLimit`. Ketika streaming blok diaktifkan secara eksplisit, OpenClaw melewati streaming pratinjau untuk menghindari streaming ganda.
    - `progress` mempertahankan satu draf status yang dapat diedit dan memperbaruinya dengan progres alat hingga pengiriman akhir; label awal bersama merupakan baris yang terus bergulir, sehingga akan tergulir keluar seperti baris lainnya setelah cukup banyak pekerjaan muncul.
    - Hasil akhir berupa media, kesalahan, dan balasan eksplisit membatalkan pengeditan pratinjau yang tertunda.
    - `streaming.preview.toolProgress` (default `true`) mengatur apakah pembaruan alat/progres menggunakan kembali pesan pratinjau.
    - Baris alat/progres dirender sebagai emoji ringkas + judul + detail jika tersedia, misalnya `🛠️ Bash: run tests` atau `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (default `false`) mengaktifkan teks komentar/pembuka asisten dalam draf progres sementara. Komentar dibersihkan sebelum ditampilkan, tetap bersifat sementara, dan tidak mengubah pengiriman jawaban akhir.
    - `streaming.progress.maxLineChars` mengatur batas pratinjau progres per baris. Prosa dipersingkat pada batas kata; detail perintah dan jalur mempertahankan akhiran yang berguna.
    - `streaming.preview.commandText` / `streaming.progress.commandText` mengatur detail perintah/eksekusi dalam baris progres ringkas: `raw` (default) atau `status` (hanya label alat).

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

  <Accordion title="Riwayat, konteks, dan perilaku utas">
    Konteks riwayat server:

    - `channels.discord.historyLimit` default `20`
    - cadangan: `messages.groupChat.historyLimit`
    - `0` menonaktifkannya

    Pengaturan riwayat DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Perilaku utas:

    - Utas Discord dirutekan sebagai sesi kanal dan mewarisi konfigurasi kanal induk kecuali diganti.
    - Sesi utas mewarisi pilihan `/model` tingkat sesi milik kanal induk sebagai cadangan khusus model; pilihan `/model` lokal utas lebih diprioritaskan, dan riwayat transkrip induk tidak disalin kecuali pewarisan transkrip diaktifkan.
    - `channels.discord.thread.inheritParent` (default `false`) mengaktifkan pengisian awal utas otomatis baru dari transkrip induk. Penggantian per akun: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Reaksi alat pesan dapat mengenali target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` dipertahankan selama pengaktifan cadangan pada tahap balasan.

    Topik kanal disisipkan sebagai konteks **tidak tepercaya**. Daftar izin membatasi siapa yang dapat memicu agen, bukan menjadi batas penyuntingan penuh untuk konteks tambahan.

  </Accordion>

  <Accordion title="Sesi terikat utas untuk subagen">
    Discord dapat mengikat utas ke target sesi agar pesan lanjutan dalam utas tersebut tetap dirutekan ke sesi yang sama (termasuk sesi subagen).

    Perintah:

    - `/focus <target>` mengikat utas saat ini/baru ke target subagen/sesi
    - `/unfocus` menghapus ikatan utas saat ini
    - `/agents` menampilkan proses aktif dan status ikatan
    - `/session idle <duration|off>` memeriksa/memperbarui pelepasan fokus otomatis akibat ketidakaktifan untuk ikatan yang difokuskan
    - `/session max-age <duration|off>` memeriksa/memperbarui usia maksimum mutlak untuk ikatan yang difokuskan

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

    - `session.threadBindings.*` menetapkan default global; `channels.discord.threadBindings.*` mengganti perilaku Discord.
    - `spawnSessions` mengatur pembuatan/pengikatan utas otomatis untuk `sessions_spawn({ thread: true })` dan pembuatan utas ACP. Default: `true`.
    - `defaultSpawnContext` mengatur konteks subagen native untuk pembuatan yang terikat utas. Default: `"fork"`.
    - Kunci `spawnSubagentSessions`/`spawnAcpSessions` yang tidak digunakan lagi dimigrasikan oleh `openclaw doctor --fix`.
    - Jika ikatan utas dinonaktifkan untuk suatu akun, `/focus` dan operasi ikatan utas terkait tidak tersedia.

    Lihat [Subagen](/id/tools/subagents), [Agen ACP](/id/tools/acp-agents), dan [Referensi Konfigurasi](/id/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Ikatan kanal ACP persisten">
    Untuk ruang kerja ACP stabil yang "selalu aktif", konfigurasikan ikatan ACP bertipe tingkat atas yang menargetkan percakapan Discord.

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

    - `/acp spawn codex --bind here` mengikat kanal atau utas saat ini di tempat dan mempertahankan pesan berikutnya pada sesi ACP yang sama. Pesan utas mewarisi ikatan kanal induk.
    - Dalam kanal atau utas yang terikat, `/new` dan `/reset` mereset sesi ACP yang sama di tempat. Ikatan utas sementara dapat mengganti resolusi target selama aktif.
    - `spawnSessions` membatasi pembuatan/pengikatan utas anak melalui `--thread auto|here`.

    Lihat [Agen ACP](/id/tools/acp-agents) untuk detail perilaku ikatan.

  </Accordion>

  <Accordion title="Notifikasi reaksi">
    Mode notifikasi reaksi per server (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (default)
    - `all`
    - `allowlist` (menggunakan `guilds.<id>.users`)

    Peristiwa reaksi diubah menjadi peristiwa sistem dan dilampirkan ke sesi Discord yang dirutekan.

  </Accordion>

  <Accordion title="Reaksi pengakuan">
    `ackReaction` mengirim emoji pengakuan saat OpenClaw memproses pesan masuk.

    Urutan resolusi:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - cadangan emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada "👀")

    Catatan:

    - Discord menerima emoji unicode atau nama emoji khusus.
    - Gunakan `""` untuk menonaktifkan reaksi bagi suatu kanal atau akun.

    **Cakupan (`messages.ackReactionScope`):**

    Nilai: `"all"` (DM + grup, termasuk peristiwa ruang ambien), `"direct"` (hanya DM), `"group-all"` (setiap pesan grup kecuali peristiwa ruang ambien, tanpa DM), `"group-mentions"` (grup ketika bot disebut; **tanpa DM**, default), `"off"` / `"none"` (dinonaktifkan).

    <Note>
    Cakupan default (`"group-mentions"`) tidak memicu reaksi pengakuan dalam pesan langsung atau peristiwa ruang ambien. Untuk mendapatkan reaksi pengakuan pada DM Discord masuk dan peristiwa ruang yang sepi, atur `messages.ackReactionScope` ke `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Penulisan konfigurasi">
    Penulisan konfigurasi yang diprakarsai kanal diaktifkan secara default. Ini memengaruhi alur `/config set|unset` (ketika fitur perintah diaktifkan).

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
    Rutekan lalu lintas WebSocket gateway Discord dan pencarian REST saat dimulai (ID aplikasi + resolusi daftar izin) melalui proksi HTTP(S) dengan `channels.discord.proxy`.
    Proksi WebSocket gateway Discord bersifat eksplisit; koneksi WebSocket tidak mewarisi variabel lingkungan proksi ambien dari proses Gateway. Pencarian REST saat dimulai menggunakan proksi ini ketika `channels.discord.proxy` dikonfigurasi.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Penggantian per akun:

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
    - pencarian mengueri API PluralKit menggunakan ID pesan asli
    - jika pencarian gagal, pesan yang diproksikan diperlakukan sebagai pesan bot dan dihapus kecuali `allowBots` mengizinkannya

  </Accordion>

  <Accordion title="Alias sebutan keluar">
    Gunakan `mentionAliases` ketika agen memerlukan sebutan keluar yang deterministik untuk pengguna Discord yang diketahui. Kunci adalah nama akun tanpa awalan `@`; nilai adalah ID pengguna Discord. Nama akun yang tidak diketahui, `@everyone`, `@here`, dan sebutan di dalam rentang kode Markdown dibiarkan tidak berubah.

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
      activity: "Pemrograman langsung",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Pemetaan jenis aktivitas:

    - 0: Bermain
    - 1: Streaming (memerlukan `activityUrl`; `activityUrl` juga memerlukan `activityType: 1`)
    - 2: Mendengarkan
    - 3: Menonton
    - 4: Khusus (menggunakan teks aktivitas sebagai keadaan status; emoji bersifat opsional)
    - 5: Berkompetisi

    Kehadiran otomatis (sinyal kesehatan waktu proses):

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

    Kehadiran otomatis memetakan ketersediaan waktu proses ke status Discord: sehat => daring, menurun atau tidak diketahui => menganggur, habis atau tidak tersedia => jangan ganggu. Nilai bawaan: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (harus kurang dari atau sama dengan `intervalMs`). Penggantian teks opsional:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (mendukung placeholder `{reason}`)

  </Accordion>

  <Accordion title="Persetujuan di Discord">
    Discord mendukung penanganan persetujuan berbasis tombol di pesan langsung dan secara opsional dapat mengirim permintaan persetujuan di saluran asal.

    Jalur konfigurasi:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opsional; menggunakan `commands.ownerAllowFrom` sebagai cadangan jika memungkinkan)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, bawaan: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord secara otomatis mengaktifkan persetujuan eksekusi native ketika `enabled` tidak ditetapkan atau bernilai `"auto"` dan setidaknya satu pemberi persetujuan dapat ditentukan, baik dari `execApprovals.approvers` maupun `commands.ownerAllowFrom`. Discord tidak menyimpulkan pemberi persetujuan eksekusi dari `allowFrom` saluran, `dm.allowFrom` lama, atau `defaultTo` pesan langsung. Tetapkan `enabled: false` untuk menonaktifkan Discord secara eksplisit sebagai klien persetujuan native.

    Untuk perintah grup sensitif khusus pemilik seperti `/diagnostics` dan `/export-trajectory`, OpenClaw mengirim permintaan persetujuan dan hasil akhir secara privat. OpenClaw terlebih dahulu mencoba pesan langsung Discord ketika pemilik yang menjalankan perintah memiliki rute pemilik Discord; jika tidak, OpenClaw menggunakan rute pemilik pertama yang tersedia dari `commands.ownerAllowFrom` sebagai cadangan, seperti Telegram.

    Ketika `target` adalah `channel` atau `both`, permintaan persetujuan terlihat di saluran. Hanya pemberi persetujuan yang telah ditentukan yang dapat menggunakan tombol; pengguna lain menerima penolakan sementara. Permintaan persetujuan menyertakan teks perintah, jadi aktifkan pengiriman ke saluran hanya di saluran tepercaya. Jika ID saluran tidak dapat diperoleh dari kunci sesi, OpenClaw menggunakan pengiriman pesan langsung sebagai cadangan.

    Discord merender tombol persetujuan bersama yang digunakan oleh saluran obrolan lain; adaptor native Discord terutama menambahkan perutean pesan langsung kepada pemberi persetujuan dan penyebaran ke saluran. Ketika tombol tersebut tersedia, tombol itu menjadi pengalaman pengguna persetujuan utama; OpenClaw hanya boleh menyertakan perintah manual `/approve` ketika hasil alat menyatakan bahwa persetujuan obrolan tidak tersedia atau persetujuan manual adalah satu-satunya jalur. Jika waktu proses persetujuan native Discord tidak aktif, OpenClaw mempertahankan permintaan lokal deterministik `/approve <id> <decision>` agar tetap terlihat. Jika waktu proses aktif tetapi kartu native tidak dapat dikirim ke target mana pun, OpenClaw mengirim pemberitahuan cadangan di obrolan yang sama dengan perintah `/approve` persis dari persetujuan yang tertunda.

    Autentikasi Gateway dan penyelesaian persetujuan mengikuti kontrak klien Gateway bersama (ID `plugin:` diselesaikan melalui `plugin.approval.resolve`; ID lainnya melalui `exec.approval.resolve`). Secara bawaan, persetujuan kedaluwarsa setelah 30 menit.

    Lihat [Persetujuan eksekusi](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Alat dan gerbang tindakan

Tindakan pesan Discord mencakup pengiriman pesan, administrasi saluran, moderasi, kehadiran, dan metadata.

Contoh inti:

- pengiriman pesan: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reaksi: `react`, `reactions`, `emojiList`
- moderasi: `timeout`, `kick`, `ban`
- kehadiran: `setPresence`

Tindakan `event-create` menerima parameter opsional `image` (URL atau jalur berkas lokal) untuk menetapkan gambar sampul acara terjadwal.

Gerbang tindakan berada di bawah `channels.discord.actions.*`.

Perilaku gerbang bawaan:

| Grup tindakan                                                                                                                                                             | Bawaan       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | diaktifkan   |
| roles                                                                                                                                                                    | dinonaktifkan |
| moderation                                                                                                                                                               | dinonaktifkan |
| presence                                                                                                                                                                 | dinonaktifkan |

## UI komponen v2

OpenClaw menggunakan komponen Discord v2 untuk persetujuan eksekusi dan penanda lintas konteks. Tindakan pesan Discord juga dapat menerima `components` untuk UI khusus (tingkat lanjut; memerlukan pembuatan muatan komponen melalui alat Discord), sedangkan `embeds` lama tetap tersedia tetapi tidak direkomendasikan.

- `channels.discord.ui.components.accentColor` menetapkan warna aksen yang digunakan oleh kontainer komponen Discord (heksadesimal). Per akun: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` mengontrol berapa lama panggilan balik komponen Discord yang dikirim tetap terdaftar (bawaan `1800000`, maksimum `86400000`). Per akun: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- `embeds` diabaikan ketika komponen v2 tersedia.
- Pratinjau URL biasa disembunyikan secara bawaan. Tetapkan `suppressEmbeds: false` pada tindakan pesan ketika satu tautan keluar harus diperluas.

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
4. Berikan izin Connect, Speak, Send Messages, dan Read Message History di saluran suara target.
5. Aktifkan perintah native (`commands.native` atau `channels.discord.commands.native`).
6. Konfigurasikan `channels.discord.voice`.

Gunakan `/vc join|leave|status` untuk mengontrol sesi. Perintah ini menggunakan agen bawaan akun dan mengikuti aturan daftar izin serta kebijakan grup yang sama seperti perintah Discord lainnya.

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

- Suara Discord bersifat ikut-serta untuk konfigurasi khusus teks; atur `channels.discord.voice.enabled=true` (atau pertahankan blok `channels.discord.voice` yang sudah ada) untuk mengaktifkan perintah `/vc`, runtime suara, dan intent Gateway `GuildVoiceStates`. `channels.discord.intents.voiceStates` dapat secara eksplisit menimpa langganan intent; biarkan tidak diatur agar mengikuti pengaktifan suara yang berlaku.
- `voice.mode` mengontrol jalur percakapan. Nilai defaultnya adalah `agent-proxy`: antarmuka suara waktu nyata menangani pengaturan waktu giliran, interupsi, dan pemutaran, mendelegasikan pekerjaan substantif kepada agen OpenClaw yang dirutekan melalui `openclaw_agent_consult`, serta memperlakukan hasilnya seperti prompt Discord yang diketik oleh pembicara tersebut. `stt-tts` mempertahankan alur STT batch ditambah TTS yang lebih lama. `bidi` memungkinkan model waktu nyata bercakap-cakap secara langsung sambil menyediakan `openclaw_agent_consult` untuk otak OpenClaw.
- `voice.agentSession` mengontrol percakapan OpenClaw yang menerima giliran suara. Biarkan tidak diatur untuk menggunakan sesi milik kanal suara itu sendiri, atau atur `{ mode: "target", target: "channel:<text-channel-id>" }` agar kanal suara bertindak sebagai ekstensi mikrofon/pengeras suara dari sesi kanal teks Discord yang sudah ada, seperti `#maintainers`.
- `voice.model` menimpa otak agen OpenClaw untuk respons suara Discord dan konsultasi waktu nyata. Biarkan tidak diatur untuk mewarisi model agen yang dirutekan. Pengaturan ini terpisah dari `voice.realtime.model`.
- `voice.followUsers` memungkinkan bot bergabung, berpindah, dan keluar dari suara Discord bersama pengguna terpilih. Lihat [Mengikuti pengguna dalam suara](#follow-users-in-voice).
- `agent-proxy` merutekan ucapan melalui `discord-voice`, yang mempertahankan otorisasi pemilik/alat normal bagi pembicara dan sesi target, tetapi menyembunyikan alat `tts` agen karena suara Discord menangani pemutaran. Secara default, `agent-proxy` memberikan akses alat penuh yang setara dengan pemilik kepada konsultasi untuk pembicara pemilik (`voice.realtime.toolPolicy: "owner"`) dan sangat mengutamakan konsultasi dengan agen OpenClaw sebelum memberikan jawaban substantif (`voice.realtime.consultPolicy: "always"`). Dalam mode default `always` tersebut, lapisan waktu nyata tidak secara otomatis mengucapkan kata-kata pengisi sebelum jawaban konsultasi; lapisan ini menangkap dan mentranskripsikan ucapan, lalu mengucapkan jawaban OpenClaw yang dirutekan. Jika beberapa jawaban konsultasi paksa selesai saat Discord masih memutar jawaban pertama, jawaban ucapan persis berikutnya dimasukkan ke antrean hingga pemutaran tidak aktif, alih-alih mengganti ucapan di tengah kalimat.
- Dalam mode `stt-tts`, STT menggunakan `tools.media.audio`; `voice.model` tidak memengaruhi transkripsi.
- Dalam mode waktu nyata, `voice.realtime.provider`, `voice.realtime.model`, dan `voice.realtime.speakerVoice` mengonfigurasi sesi audio waktu nyata. Untuk OpenAI Realtime 2.1 dengan otak Codex, gunakan `voice.realtime.model: "gpt-realtime-2.1"` dan `voice.model: "openai/gpt-5.6-sol"`.
- Secara default, mode suara waktu nyata menyertakan file profil kecil `IDENTITY.md`, `USER.md`, dan `SOUL.md` dalam instruksi penyedia waktu nyata agar giliran langsung yang cepat mempertahankan identitas, landasan pengguna, dan persona yang sama dengan agen OpenClaw yang dirutekan. Atur `voice.realtime.bootstrapContextFiles` ke suatu subset untuk menyesuaikannya, atau ke `[]` untuk menonaktifkannya. Hanya file profil tersebut yang didukung; `AGENTS.md` tetap berada dalam konteks agen normal. Konteks profil yang disuntikkan tidak menggantikan `openclaw_agent_consult` untuk pekerjaan ruang kerja, fakta terkini, pencarian memori, atau tindakan yang didukung alat.
- Dalam mode waktu nyata OpenAI `agent-proxy`, atur `voice.realtime.requireWakeName: true` agar suara waktu nyata Discord tetap diam sampai transkrip dimulai atau diakhiri dengan nama pemicu. Nama pemicu yang dikonfigurasi harus terdiri dari satu atau dua kata. Jika `voice.realtime.wakeNames` tidak diatur, OpenClaw menggunakan `name` agen yang dirutekan ditambah `OpenClaw`, dengan fallback ke ID agen ditambah `OpenClaw`. Pembatasan nama pemicu menonaktifkan respons otomatis penyedia waktu nyata, merutekan giliran yang diterima melalui jalur konsultasi agen OpenClaw, dan memberikan pengakuan lisan singkat ketika nama pemicu di awal dikenali dari transkripsi parsial sebelum transkrip akhir tiba.
- Penyedia waktu nyata OpenAI menerima nama peristiwa Realtime 2 terkini dan alias lama yang kompatibel dengan Codex untuk peristiwa audio keluaran dan transkrip, sehingga snapshot penyedia yang kompatibel dapat berubah tanpa menghilangkan audio asisten.
- `voice.realtime.bargeIn` mengontrol apakah peristiwa mulai-berbicara dari Discord menginterupsi pemutaran waktu nyata yang aktif. Jika tidak diatur, pengaturan ini mengikuti pengaturan interupsi audio masukan milik penyedia waktu nyata.
- `voice.realtime.minBargeInAudioEndMs` mengontrol durasi minimum pemutaran asisten sebelum interupsi waktu nyata OpenAI memotong audio. Default: `250`. Atur `0` untuk interupsi langsung di ruangan dengan gema rendah, atau naikkan nilainya untuk penyiapan pengeras suara dengan gema tinggi.
- `voice.tts` menimpa `messages.tts` hanya untuk pemutaran suara `stt-tts`; mode waktu nyata menggunakan `voice.realtime.speakerVoice` sebagai gantinya. Untuk suara OpenAI pada pemutaran Discord, atur `voice.tts.provider: "openai"` dan pilih suara Text-to-speech di bawah `voice.tts.providers.openai.speakerVoice`. `cedar` merupakan pilihan yang baik dengan karakter suara maskulin pada model TTS OpenAI saat ini.
- Penimpaan `systemPrompt` Discord per kanal berlaku pada giliran transkrip suara untuk kanal suara tersebut.
- Giliran transkrip suara memperoleh status pemilik dari `allowFrom` Discord (atau `dm.allowFrom`) untuk perintah dan tindakan kanal yang dibatasi bagi pemilik. Visibilitas alat agen mengikuti kebijakan alat yang dikonfigurasi untuk sesi yang dirutekan.
- Jika `voice.autoJoin` memiliki beberapa entri untuk guild yang sama, OpenClaw bergabung dengan kanal terakhir yang dikonfigurasi untuk guild tersebut.
- `voice.allowedChannels` adalah daftar izin keberadaan yang opsional. Biarkan tidak diatur untuk mengizinkan `/vc join` masuk ke kanal suara Discord mana pun yang diotorisasi. Jika diatur, `/vc join`, penggabungan otomatis saat mulai, dan perpindahan status suara bot dibatasi pada entri `{ guildId, channelId }` yang tercantum. Atur ke array kosong untuk menolak semua penggabungan suara Discord. Jika Discord memindahkan bot ke luar daftar izin, OpenClaw meninggalkan kanal tersebut dan bergabung kembali dengan target penggabungan otomatis yang dikonfigurasi jika tersedia.
- `voice.daveEncryption` dan `voice.decryptionFailureTolerance` diteruskan ke opsi penggabungan `@discordjs/voice`; nilai default upstream adalah `daveEncryption=true` dan `decryptionFailureTolerance=24`.
- OpenClaw menggunakan codec `libopus-wasm` bawaan untuk penerimaan suara Discord dan pemutaran PCM mentah waktu nyata. Codec ini menyertakan build WebAssembly libopus yang disematkan versinya dan tidak memerlukan pengaya opus native.
- `voice.connectTimeoutMs` mengontrol waktu tunggu awal status Ready dari `@discordjs/voice` untuk `/vc join` dan upaya penggabungan otomatis. Default: `30000`.
- `voice.reconnectGraceMs` mengontrol berapa lama OpenClaw menunggu sesi suara yang terputus untuk mulai tersambung kembali sebelum menghancurkannya. Default: `15000`.
- Dalam mode `stt-tts`, pemutaran suara tidak berhenti hanya karena pengguna lain mulai berbicara. Untuk menghindari putaran umpan balik, OpenClaw mengabaikan tangkapan suara baru saat TTS sedang diputar; berbicaralah setelah pemutaran selesai untuk giliran berikutnya. Mode waktu nyata meneruskan awal ucapan pembicara sebagai sinyal interupsi kepada penyedia waktu nyata.
- Dalam mode waktu nyata, gema dari pengeras suara ke mikrofon terbuka dapat terlihat seperti interupsi dan menghentikan pemutaran. Untuk ruangan Discord dengan gema tinggi, atur `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` agar OpenAI tidak melakukan interupsi otomatis saat ada audio masukan. Tambahkan `voice.realtime.bargeIn: true` jika Anda tetap ingin peristiwa mulai-berbicara dari Discord menginterupsi pemutaran aktif. Jembatan waktu nyata OpenAI mengabaikan pemotongan pemutaran yang lebih singkat daripada `voice.realtime.minBargeInAudioEndMs` karena kemungkinan merupakan gema/gangguan, dan mencatatnya sebagai dilewati alih-alih menghapus pemutaran Discord.
- `voice.captureSilenceGraceMs` mengontrol berapa lama OpenClaw menunggu setelah Discord melaporkan bahwa seorang pembicara telah berhenti sebelum menyelesaikan segmen audio tersebut untuk STT. Default: `2000`; naikkan nilainya jika Discord memecah jeda normal menjadi transkrip parsial yang terputus-putus.
- Ketika ElevenLabs menjadi penyedia TTS yang dipilih, pemutaran suara Discord menggunakan TTS streaming dan dimulai dari aliran respons penyedia. Penyedia tanpa dukungan streaming menggunakan fallback ke jalur file sementara hasil sintesis.
- OpenClaw memantau kegagalan dekripsi penerimaan dan melakukan pemulihan otomatis dengan meninggalkan lalu bergabung kembali ke kanal suara setelah kegagalan berulang dalam jangka waktu singkat.
- Jika log penerimaan berulang kali menampilkan `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` setelah pembaruan, kumpulkan laporan dependensi dan log. Baris `@discordjs/voice` bawaan menyertakan perbaikan padding upstream dari PR discord.js #11449, yang menutup isu discord.js #11419.
- Peristiwa penerimaan `The operation was aborted` merupakan hal yang diharapkan ketika OpenClaw menyelesaikan segmen pembicara yang ditangkap; peristiwa tersebut adalah diagnostik terperinci, bukan peringatan.
- Log suara Discord terperinci menyertakan pratinjau transkrip STT satu baris dengan panjang terbatas untuk setiap segmen pembicara yang diterima, sehingga proses debug menampilkan sisi pengguna dan sisi balasan agen tanpa mencurahkan teks transkrip tanpa batas.
- Dalam mode `agent-proxy`, fallback konsultasi paksa melewati fragmen transkrip yang kemungkinan belum lengkap, seperti teks yang diakhiri dengan `...` atau kata penghubung di akhir seperti "dan", serta penutup yang jelas tidak memerlukan tindakan seperti "segera kembali" atau "sampai jumpa". Log menampilkan `forced agent consult skipped reason=...` ketika hal ini mencegah jawaban lama yang mengantre.

### Mengikuti pengguna dalam suara

Gunakan `voice.followUsers` jika Anda ingin bot suara Discord tetap bersama satu atau beberapa pengguna Discord yang dikenal, alih-alih bergabung dengan kanal tetap saat mulai atau menunggu `/vc join`.

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

- `followUsers` menerima ID pengguna Discord mentah dan nilai `discord:<id>`. OpenClaw menormalkan kedua bentuk tersebut sebelum mencocokkan peristiwa status suara.
- `followUsersEnabled` secara default bernilai `true` ketika `followUsers` dikonfigurasi. Atur ke `false` untuk mempertahankan daftar yang tersimpan tetapi menghentikan pengikutan suara otomatis.
- Ketika pengguna yang diikuti bergabung dengan kanal suara yang diizinkan, OpenClaw bergabung dengan kanal tersebut. Ketika pengguna berpindah, OpenClaw ikut berpindah. Ketika pengguna aktif yang diikuti terputus, OpenClaw keluar.
- Jika beberapa pengguna yang diikuti berada di guild yang sama dan pengguna aktif yang diikuti keluar, OpenClaw berpindah ke kanal pengguna lain yang dilacak dan diikuti sebelum meninggalkan guild. Jika beberapa pengguna yang diikuti berpindah secara bersamaan, peristiwa status suara terbaru yang diamati akan digunakan.
- `allowedChannels` tetap berlaku. Pengguna yang diikuti dalam kanal yang tidak diizinkan akan diabaikan, dan sesi yang dimiliki fitur pengikutan akan berpindah ke pengguna lain yang diikuti atau keluar.
- OpenClaw merekonsiliasi peristiwa status suara yang terlewat saat mulai dan pada interval terbatas. Rekonsiliasi mengambil sampel guild yang dikonfigurasi dan membatasi pencarian REST per proses, sehingga daftar `followUsers` yang sangat besar mungkin memerlukan lebih dari satu interval untuk mencapai keadaan yang selaras.
- Jika Discord atau admin memindahkan bot saat bot sedang mengikuti pengguna, OpenClaw membangun ulang sesi suara dan mempertahankan kepemilikan pengikutan jika tujuan diizinkan. Jika bot dipindahkan ke luar `allowedChannels`, OpenClaw keluar dan bergabung kembali dengan target yang dikonfigurasi jika tersedia.
- Pemulihan penerimaan DAVE dapat meninggalkan lalu bergabung kembali ke kanal yang sama setelah kegagalan dekripsi berulang. Sesi yang dimiliki fitur pengikutan mempertahankan kepemilikan pengikutannya sepanjang jalur pemulihan tersebut, sehingga pemutusan pengguna yang diikuti di kemudian waktu tetap membuat bot meninggalkan kanal.

Pilih salah satu mode penggabungan:

- Gunakan `followUsers` untuk penyiapan pribadi atau operator saat bot harus otomatis berada dalam suara ketika Anda berada di sana.
- Gunakan `autoJoin` untuk bot ruangan tetap yang harus tetap hadir meskipun tidak ada pengguna yang dilacak dalam suara.
- Gunakan `/vc join` untuk penggabungan satu kali atau ruangan tempat kehadiran suara otomatis akan terasa tidak terduga.

Codec suara Discord:

- Log penerimaan suara menampilkan `discord voice: opus decoder: libopus-wasm`.
- Pemutaran waktu nyata mengodekan PCM stereo mentah 48 kHz menjadi Opus dengan paket `libopus-wasm` bawaan yang sama sebelum menyerahkan paket ke `@discordjs/voice`.
- Pemutaran file dan aliran penyedia mentranskode audio menjadi PCM stereo mentah 48 kHz dengan ffmpeg, lalu menggunakan `libopus-wasm` untuk aliran paket Opus yang dikirim ke Discord.

Pipeline STT ditambah TTS:

- Tangkapan PCM Discord dikonversi menjadi berkas sementara WAV.
- `tools.media.audio` menangani STT, misalnya `openai/gpt-4o-mini-transcribe`.
- Transkrip dikirim melalui jalur masuk dan perutean Discord sementara LLM respons berjalan dengan kebijakan keluaran suara yang menyembunyikan alat `tts` agen dan meminta teks dikembalikan, karena suara Discord menangani pemutaran TTS akhir.
- `voice.model`, jika ditetapkan, hanya mengganti LLM respons untuk giliran saluran suara ini.
- `voice.tts` digabungkan di atas `messages.tts`; penyedia yang mendukung streaming mengirimkan data langsung ke pemutar, sedangkan jika tidak, berkas audio yang dihasilkan diputar di saluran yang telah dimasuki.

Contoh sesi saluran suara proksi agen bawaan:

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

Tanpa blok `voice.agentSession`, setiap saluran suara memperoleh sesi OpenClaw terarahnya sendiri. Misalnya, `/vc join channel:234567890123456789` berkomunikasi dengan sesi untuk saluran suara Discord tersebut. Model waktu nyata hanya merupakan antarmuka suara; permintaan substantif diserahkan kepada agen OpenClaw yang dikonfigurasi. Jika model waktu nyata menghasilkan transkrip akhir tanpa memanggil alat konsultasi, OpenClaw memaksakan konsultasi sebagai mekanisme cadangan agar perilaku bawaan tetap seperti berbicara dengan agen.

Contoh STT lama beserta TTS:

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

Contoh dua arah waktu nyata:

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

Dalam mode `agent-proxy`, bot memasuki saluran suara yang dikonfigurasi, tetapi giliran agen OpenClaw menggunakan sesi terarah dan agen normal milik saluran target. Sesi suara waktu nyata mengucapkan kembali hasil yang dikembalikan ke saluran suara. Agen pengawas tetap dapat menggunakan alat pesan normal sesuai dengan kebijakan alatnya, termasuk mengirim pesan Discord terpisah jika itu merupakan tindakan yang tepat.

Saat proses OpenClaw yang didelegasikan sedang aktif, transkrip suara Discord baru diperlakukan sebagai kontrol proses langsung sebelum memulai giliran agen lainnya. Frasa seperti "status", "batalkan itu", "gunakan perbaikan yang lebih kecil", atau "setelah selesai, periksa juga pengujian" diklasifikasikan sebagai masukan status, pembatalan, pengarahan, atau tindak lanjut untuk sesi aktif. Hasil status, pembatalan, pengarahan yang diterima, dan tindak lanjut diucapkan kembali ke saluran suara agar pemanggil mengetahui apakah OpenClaw menangani permintaan tersebut.

Bentuk target yang berguna:

- `target: "channel:123456789012345678"` merutekan melalui sesi saluran teks Discord.
- `target: "123456789012345678"` diperlakukan sebagai target saluran.
- `target: "dm:123456789012345678"` atau `target: "user:123456789012345678"` merutekan melalui sesi pesan langsung tersebut.

Contoh OpenAI Realtime dengan gema tinggi:

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

Gunakan ini saat model mendengar pemutaran Discord-nya sendiri melalui mikrofon terbuka, tetapi Anda tetap ingin menyelanya dengan berbicara. OpenClaw mencegah OpenAI melakukan interupsi otomatis akibat audio masukan mentah, sementara `bargeIn: true` memungkinkan peristiwa mulai-berbicara Discord dan audio pembicara yang sudah aktif membatalkan respons waktu nyata aktif sebelum giliran tangkapan berikutnya mencapai OpenAI. Sinyal penyelaan yang terlalu awal dengan `audioEndMs` di bawah `minBargeInAudioEndMs` dianggap kemungkinan gema/derau dan diabaikan agar model tidak terputus pada bingkai pemutaran pertama.

Log suara yang diharapkan:

- Saat bergabung: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Saat waktu nyata dimulai: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Saat ada audio pembicara: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, dan `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Saat ucapan basi dilewati: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` atau `reason=non-actionable-closing ...`
- Saat respons waktu nyata selesai: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Saat pemutaran dihentikan/diatur ulang: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Saat konsultasi waktu nyata: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Saat agen menjawab: `discord voice: agent turn answer ...`
- Saat ucapan persis dimasukkan ke antrean: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, diikuti oleh `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Saat penyelaan terdeteksi: `discord voice: realtime barge-in detected source=speaker-start ...` atau `discord voice: realtime barge-in detected source=active-speaker-audio ...`, diikuti oleh `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Saat interupsi waktu nyata: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, diikuti oleh `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` atau `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Saat gema/derau diabaikan: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Saat penyelaan dinonaktifkan: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Saat pemutaran menganggur: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Untuk men-debug audio yang terpotong, baca log suara waktu nyata sebagai lini masa:

1. `realtime audio playback started` berarti Discord telah mulai memutar audio asisten. Sejak titik ini, jembatan mulai menghitung potongan keluaran asisten, byte PCM Discord, byte waktu nyata penyedia, dan durasi audio yang disintesis.
2. `realtime speaker turn opened` menandai pembicara Discord mulai aktif. Jika pemutaran sudah aktif dan `bargeIn` diaktifkan, ini dapat diikuti oleh `barge-in detected source=speaker-start`.
3. `realtime input audio started` menandai bingkai audio aktual pertama yang diterima untuk giliran pembicara tersebut. `outputActive=true` atau `outputAudioMs` yang bukan nol di sini berarti mikrofon sedang mengirim masukan saat pemutaran asisten masih aktif.
4. `barge-in detected source=active-speaker-audio` berarti OpenClaw mendeteksi audio pembicara langsung saat pemutaran asisten aktif. Ini berguna untuk membedakan interupsi nyata dari peristiwa mulai-berbicara Discord tanpa audio yang berguna.
5. `barge-in requested reason=...` berarti OpenClaw meminta penyedia waktu nyata untuk membatalkan atau memotong respons aktif. Baris ini menyertakan `outputAudioMs`, `outputActive`, dan `playbackChunks` agar Anda dapat melihat seberapa banyak audio asisten yang benar-benar telah diputar sebelum interupsi.
6. `realtime audio playback stopped reason=...` adalah titik pengaturan ulang pemutaran Discord lokal. Alasannya menunjukkan pihak yang menghentikan pemutaran: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, atau `session-close`.
7. `realtime speaker turn closed` merangkum giliran masukan yang ditangkap. `chunks=0` atau `hasAudio=false` berarti giliran pembicara dibuka, tetapi tidak ada audio yang dapat digunakan mencapai jembatan waktu nyata. `interruptedPlayback=true` berarti giliran masukan tersebut bertumpang-tindih dengan keluaran asisten dan memicu logika penyelaan.

Bidang yang berguna:

- `outputAudioMs`: durasi audio asisten yang dihasilkan oleh penyedia waktu nyata sebelum baris log tersebut.
- `audioMs`: durasi audio asisten yang dihitung OpenClaw sebelum pemutaran dihentikan.
- `elapsedMs`: waktu nyata yang berlalu antara pembukaan dan penutupan aliran pemutaran atau giliran pembicara.
- `discordBytes`: byte PCM stereo 48 kHz yang dikirim ke atau diterima dari suara Discord.
- `realtimeBytes`: byte PCM berformat penyedia yang dikirim ke atau diterima dari penyedia waktu nyata.
- `playbackChunks`: potongan audio asisten yang diteruskan ke Discord untuk respons aktif.
- `sinceLastAudioMs`: jeda antara bingkai audio pembicara terakhir yang ditangkap dan penutupan giliran pembicara.

Pola umum:

- Audio yang langsung terpotong dengan `source=active-speaker-audio`, `outputAudioMs` kecil, dan pengguna yang sama berada di dekat perangkat biasanya menunjukkan gema pengeras suara masuk ke mikrofon. Naikkan `voice.realtime.minBargeInAudioEndMs`, turunkan volume pengeras suara, gunakan headphone, atau tetapkan `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` yang diikuti oleh `speaker turn closed ... hasAudio=false` berarti Discord melaporkan pembicara mulai aktif, tetapi tidak ada audio yang mencapai OpenClaw. Hal ini dapat berupa peristiwa suara Discord sementara, perilaku gerbang derau, atau klien yang mengaktifkan mikrofon sesaat.
- `audio playback stopped reason=stream-close` tanpa penyelaan terdekat atau `provider-clear-audio` berarti aliran pemutaran Discord lokal berakhir secara tidak terduga. Periksa log penyedia dan pemutar Discord sebelumnya.
- `capture ignored during playback (barge-in disabled)` berarti OpenClaw sengaja membuang masukan saat audio asisten aktif. Aktifkan `voice.realtime.bargeIn` jika Anda ingin ucapan menyela pemutaran.
- `barge-in ignored ... outputActive=false` berarti VAD Discord atau penyedia mendeteksi ucapan, tetapi OpenClaw tidak memiliki pemutaran aktif untuk disela. Ini seharusnya tidak memotong audio.

Kredensial diselesaikan per komponen: autentikasi rute LLM untuk `voice.model`, autentikasi STT untuk `tools.media.audio`, autentikasi TTS untuk `messages.tts`/`voice.tts`, serta autentikasi penyedia waktu nyata untuk `voice.realtime.providers` atau konfigurasi autentikasi normal penyedia.

### Pesan suara

Pesan suara Discord menampilkan pratinjau bentuk gelombang dan memerlukan audio OGG/Opus. OpenClaw menghasilkan bentuk gelombang secara otomatis, tetapi memerlukan `ffmpeg` dan `ffprobe` di hos Gateway untuk memeriksa dan mengonversi audio.

- Berikan **jalur berkas lokal** (URL ditolak).
- Hilangkan konten teks (Discord menolak teks + pesan suara dalam muatan yang sama).
- Semua format audio diterima; OpenClaw mengonversinya menjadi OGG/Opus sesuai kebutuhan.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Menggunakan intensi yang tidak diizinkan atau bot tidak melihat pesan server">

    - aktifkan Message Content Intent
    - aktifkan Server Members Intent jika Anda bergantung pada resolusi pengguna/anggota
    - mulai ulang Gateway setelah mengubah intent

  </Accordion>

  <Accordion title="Pesan guild tiba-tiba diblokir">

    - verifikasi `groupPolicy`
    - verifikasi daftar izin guild di bawah `channels.discord.guilds`
    - jika terdapat peta `channels` guild, hanya kanal yang tercantum yang diizinkan
    - verifikasi perilaku `requireMention` dan pola penyebutan

    Pemeriksaan yang berguna:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Penyebutan tidak diwajibkan tetapi masih diblokir">
    Penyebab umum:

    - `groupPolicy="allowlist"` tanpa daftar izin guild/kanal yang cocok
    - `requireMention` dikonfigurasi di tempat yang salah (harus berada di bawah `channels.discord.guilds` atau entri kanal)
    - pengirim diblokir oleh daftar izin `users` guild/kanal

  </Accordion>

  <Accordion title="Giliran Discord berjalan lama atau balasan duplikat">

    Log umum:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Opsi antrean Gateway Discord:

    - akun tunggal: `channels.discord.eventQueue.listenerTimeout`
    - multiakun: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - ini hanya mengontrol pekerjaan listener Gateway Discord, bukan durasi giliran agen

    Discord tidak menerapkan batas waktu milik kanal pada giliran agen yang diantrekan. Listener pesan segera meneruskan pekerjaan, dan proses Discord yang diantrekan mempertahankan urutan per sesi hingga siklus hidup sesi/alat/runtime selesai atau membatalkan pekerjaan.

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
    OpenClaw mengambil metadata `/gateway/bot` Discord sebelum tersambung. Kegagalan sementara beralih ke URL Gateway bawaan Discord dan dibatasi lajunya dalam log.

    Opsi batas waktu metadata:

    - akun tunggal: `channels.discord.gatewayInfoTimeoutMs`
    - multiakun: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - nilai alternatif env saat konfigurasi tidak ditetapkan: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - bawaan: `30000` (30 detik), maksimum: `120000`

  </Accordion>

  <Accordion title="Mulai ulang akibat batas waktu READY Gateway">
    OpenClaw menunggu peristiwa `READY` Gateway Discord saat memulai dan setelah penyambungan ulang runtime. Penyiapan multiakun dengan jeda bertahap saat memulai mungkin memerlukan jangka waktu READY awal yang lebih panjang daripada nilai bawaan.

    Opsi batas waktu READY:

    - akun tunggal saat memulai: `channels.discord.gatewayReadyTimeoutMs`
    - multiakun saat memulai: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - nilai alternatif env saat memulai ketika konfigurasi tidak ditetapkan: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - bawaan saat memulai: `15000` (15 detik), maksimum: `120000`
    - akun tunggal saat runtime: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - multiakun saat runtime: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - nilai alternatif env saat runtime ketika konfigurasi tidak ditetapkan: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - bawaan saat runtime: `30000` (30 detik), maksimum: `120000`

  </Accordion>

  <Accordion title="Ketidakcocokan audit izin">
    Pemeriksaan izin `channels status --probe` hanya berfungsi untuk ID kanal numerik.

    Jika Anda menggunakan kunci slug, pencocokan runtime tetap dapat berfungsi, tetapi probe tidak dapat memverifikasi izin sepenuhnya.

  </Accordion>

  <Accordion title="Masalah DM dan pemasangan">

    - DM dinonaktifkan: `channels.discord.dm.enabled=false`
    - kebijakan DM dinonaktifkan: `channels.discord.dmPolicy="disabled"` (lama: `channels.discord.dm.policy`)
    - menunggu persetujuan pemasangan dalam mode `pairing`

  </Accordion>

  <Accordion title="Perulangan bot-ke-bot">
    Secara bawaan, pesan yang dibuat oleh bot diabaikan.

    Jika Anda menetapkan `channels.discord.allowBots=true`, gunakan aturan penyebutan dan daftar izin yang ketat untuk menghindari perilaku berulang.
    Utamakan `channels.discord.allowBots="mentions"` agar hanya menerima pesan bot yang menyebut bot tersebut.

    OpenClaw juga menyertakan [perlindungan perulangan bot](/id/channels/bot-loop-protection) bersama. Setiap kali `allowBots` mengizinkan pesan yang dibuat oleh bot mencapai pengiriman, Discord memetakan peristiwa masuk ke fakta `(account, channel, bot pair)` dan penjaga pasangan generik menekan pasangan tersebut setelah melewati anggaran peristiwa yang dikonfigurasi. Penjaga ini mencegah perulangan dua bot tak terkendali yang sebelumnya harus dihentikan oleh batas laju Discord; penjaga ini tidak memengaruhi penerapan bot tunggal atau balasan bot satu kali yang tetap di bawah anggaran.

    Pengaturan bawaan (aktif saat `allowBots` ditetapkan):

    - `maxEventsPerWindow: 20` -- pasangan bot dapat bertukar 20 pesan dalam jendela bergulir
    - `windowSeconds: 60` -- durasi jendela bergulir
    - `cooldownSeconds: 60` -- setelah anggaran terlampaui, setiap pesan bot-ke-bot tambahan dalam arah mana pun dibuang selama satu menit

    Konfigurasikan nilai bawaan bersama sekali di bawah `channels.defaults.botLoopProtection`, lalu timpa untuk Discord ketika alur kerja yang sah memerlukan kapasitas lebih besar. Urutan prioritasnya adalah:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - nilai bawaan bawaan sistem

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
      // Penimpaan opsional untuk seluruh Discord. Blok akun menimpa bidang individual
      // dan mewarisi bidang yang dihilangkan dari sini.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha mendengarkan bot lain hanya ketika mereka menyebutnya.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo mendengarkan semua pesan Discord yang dibuat oleh bot.
          allowBots: true,
          mentionAliases: {
            // Memungkinkan Bravo menulis penyebutan Discord untuk Alpha dengan ID pengguna yang dikonfigurasi.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Izinkan hingga lima pesan per menit sebelum menekan pasangan tersebut.
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
    - pastikan `channels.discord.voice.daveEncryption=true` (bawaan)
    - mulai dengan `channels.discord.voice.decryptionFailureTolerance=24` (bawaan upstream) dan sesuaikan hanya jika diperlukan
    - pantau log untuk:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - jika kegagalan berlanjut setelah bergabung ulang secara otomatis, kumpulkan log dan bandingkan dengan riwayat penerimaan DAVE upstream di [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) dan [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Discord](/id/gateway/config-channels#discord).

<Accordion title="Bidang Discord dengan informasi penting">

- saat memulai/autentikasi: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- kebijakan: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- perintah: `commands.native`, `commands.useAccessGroups` (global), `configWrites`, `slashCommand.ephemeral`
- antrean peristiwa: `eventQueue.listenerTimeout` (anggaran listener, bawaan `120000`), `eventQueue.maxQueueSize` (bawaan `10000`), `eventQueue.maxConcurrency` (bawaan `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- balasan/riwayat: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit` (bawaan `2000`), `maxLinesPerMessage` (bawaan `17`)
- streaming: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (kunci datar lama `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` dimigrasikan ke `streaming.*` oleh `openclaw doctor --fix`)
- media/percobaan ulang: `mediaMaxMb` (membatasi unggahan Discord keluar, bawaan `100`), `retry`
- tindakan: `actions.*`
- kehadiran: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- antarmuka pengguna: `ui.components.accentColor`
- fitur: `threadBindings`, `bindings[]` tingkat atas (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Keamanan dan operasi

- Perlakukan token bot sebagai rahasia (`DISCORD_BOT_TOKEN` lebih disarankan dalam lingkungan terkelola).
- Berikan izin Discord dengan hak akses minimum.
- Jika penerapan/status perintah sudah usang, mulai ulang Gateway dan periksa kembali dengan `openclaw channels status --probe`.

## Terkait

<CardGroup cols={2}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Discord ke Gateway.
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
