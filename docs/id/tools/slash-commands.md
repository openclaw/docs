---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug perutean perintah atau izin
summary: 'Perintah garis miring: teks vs native, konfigurasi, dan perintah yang didukung'
title: Perintah Garis Miring
x-i18n:
    generated_at: "2026-04-21T17:45:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26923608329ba2aeece2d4bc8edfa40ae86e03719a9f590f26ff79f57d97521d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Perintah garis miring

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`.
Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ada dua sistem yang terkait:

- **Perintah**: pesan `/...` mandiri.
- **Direktif**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktif dihapus dari pesan sebelum model melihatnya.
  - Dalam pesan chat normal (bukan hanya direktif), direktif diperlakukan sebagai “petunjuk inline” dan **tidak** mempertahankan pengaturan sesi.
  - Dalam pesan yang hanya berisi direktif (pesan hanya berisi direktif), direktif dipertahankan ke sesi dan membalas dengan sebuah konfirmasi.
  - Direktif hanya diterapkan untuk **pengirim yang berwenang**. Jika `commands.allowFrom` diatur, itu adalah satu-satunya
    allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing channel ditambah `commands.useAccessGroups`.
    Pengirim yang tidak berwenang akan melihat direktif diperlakukan sebagai teks biasa.

Ada juga beberapa **shortcut inline** (hanya untuk pengirim yang di-allowlist/berwenang): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Shortcut ini berjalan segera, dihapus sebelum model melihat pesan, dan sisa teks melanjutkan melalui alur normal.

## Konfigurasi

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (default `true`) mengaktifkan parsing `/...` dalam pesan chat.
  - Pada permukaan tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi meskipun Anda mengatur ini ke `false`.
- `commands.native` (default `"auto"`) mendaftarkan perintah native.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan slash command); diabaikan untuk provider tanpa dukungan native.
  - Atur `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk menimpa per provider (bool atau `"auto"`).
  - `false` menghapus perintah yang sebelumnya terdaftar di Discord/Telegram saat startup. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
- `commands.nativeSkills` (default `"auto"`) mendaftarkan perintah **skill** secara native saat didukung.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack mengharuskan pembuatan satu slash command per skill).
  - Atur `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk menimpa per provider (bool atau `"auto"`).
- `commands.bash` (default `false`) mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan allowlist `tools.elevated`).
- `commands.bashForegroundMs` (default `2000`) mengontrol berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung menjalankannya di latar belakang).
- `commands.config` (default `false`) mengaktifkan `/config` (membaca/menulis `openclaw.json`).
- `commands.mcp` (default `false`) mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`).
- `commands.plugins` (default `false`) mengaktifkan `/plugins` (penemuan/status plugin serta kontrol instal + aktif/nonaktif).
- `commands.debug` (default `false`) mengaktifkan `/debug` (override hanya saat runtime).
- `commands.restart` (default `true`) mengaktifkan `/restart` plus tindakan alat restart gateway.
- `commands.ownerAllowFrom` (opsional) menetapkan allowlist pemilik eksplisit untuk permukaan perintah/alat khusus pemilik. Ini terpisah dari `commands.allowFrom`.
- `commands.ownerDisplay` mengontrol bagaimana id pemilik muncul dalam system prompt: `raw` atau `hash`.
- `commands.ownerDisplaySecret` secara opsional menetapkan rahasia HMAC yang digunakan saat `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opsional) menetapkan allowlist per provider untuk otorisasi perintah. Saat dikonfigurasi, ini adalah
  satu-satunya sumber otorisasi untuk perintah dan direktif (allowlist/pairing channel dan `commands.useAccessGroups`
  diabaikan). Gunakan `"*"` untuk default global; kunci khusus provider menimpa itu.
- `commands.useAccessGroups` (default `true`) menerapkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak diatur.

## Daftar perintah

Sumber kebenaran saat ini:

- built-in inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah plugin berasal dari pemanggilan `registerCommand()` plugin
- ketersediaan sebenarnya pada gateway Anda tetap bergantung pada flag konfigurasi, permukaan channel, dan plugin yang terpasang/aktif

### Perintah built-in inti

Perintah built-in yang tersedia saat ini:

- `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
- `/reset soft [message]` mempertahankan transkrip saat ini, menghapus id sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/system-prompt di tempat.
- `/compact [instructions]` memadatkan konteks sesi. Lihat [/concepts/compaction](/id/concepts/compaction).
- `/stop` membatalkan run saat ini.
- `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa pengikatan thread.
- `/think <level>` mengatur level berpikir. Opsi berasal dari profil provider model aktif; level umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan level khusus seperti `xhigh`, `adaptive`, `max`, atau biner `on` hanya jika didukung. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` mengaktifkan/menonaktifkan output verbose. Alias: `/v`.
- `/trace on|off` mengaktifkan/menonaktifkan output trace plugin untuk sesi saat ini.
- `/fast [status|on|off]` menampilkan atau mengatur mode cepat.
- `/reasoning [on|off|stream]` mengaktifkan/menonaktifkan visibilitas reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` mengaktifkan/menonaktifkan mode elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau mengatur default exec.
- `/model [name|#|status]` menampilkan atau mengatur model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan provider atau model untuk sebuah provider.
- `/queue <mode>` mengelola perilaku antrean (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) beserta opsi seperti `debounce:2s cap:25 drop:summarize`.
- `/help` menampilkan ringkasan bantuan singkat.
- `/commands` menampilkan katalog perintah yang dihasilkan.
- `/tools [compact|verbose]` menampilkan apa yang bisa digunakan agen saat ini sekarang juga.
- `/status` menampilkan status runtime, termasuk penggunaan/kuota provider jika tersedia.
- `/tasks` mencantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini.
- `/context [list|detail|json]` menjelaskan bagaimana konteks dirakit.
- `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
- `/whoami` menampilkan id pengirim Anda. Alias: `/id`.
- `/skill <name> [input]` menjalankan sebuah skill berdasarkan nama.
- `/allowlist [list|add|remove] ...` mengelola entri allowlist. Hanya teks.
- `/approve <id> <decision>` menyelesaikan prompt persetujuan exec.
- `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi mendatang. Lihat [/tools/btw](/id/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` mengelola run sub-agent untuk sesi saat ini.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
- `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
- `/unfocus` menghapus pengikatan saat ini.
- `/agents` mencantumkan agen yang terikat ke thread untuk sesi saat ini.
- `/kill <id|#|all>` membatalkan satu atau semua sub-agent yang sedang berjalan.
- `/steer <id|#> <message>` mengirim arahan ke sub-agent yang sedang berjalan. Alias: `/tell`.
- `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Khusus pemilik. Memerlukan `commands.config: true`.
- `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus pemilik. Memerlukan `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau memutasi status plugin. `/plugin` adalah alias. Penulisan hanya untuk pemilik. Memerlukan `commands.plugins: true`.
- `/debug show|set|unset|reset` mengelola override konfigurasi hanya saat runtime. Khusus pemilik. Memerlukan `commands.debug: true`.
- `/usage off|tokens|full|cost` mengontrol footer penggunaan per respons atau mencetak ringkasan biaya lokal.
- `/tts on|off|status|provider|limit|summary|audio|help` mengontrol TTS. Lihat [/tools/tts](/id/tools/tts).
- `/restart` memulai ulang OpenClaw saat diaktifkan. Default: aktif; atur `commands.restart: false` untuk menonaktifkannya.
- `/activation mention|always` mengatur mode aktivasi grup.
- `/send on|off|inherit` mengatur kebijakan pengiriman. Khusus pemilik.
- `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` plus allowlist `tools.elevated`.
- `!poll [sessionId]` memeriksa pekerjaan bash latar belakang.
- `!stop [sessionId]` menghentikan pekerjaan bash latar belakang.

### Perintah dock yang dihasilkan

Perintah dock dihasilkan dari plugin channel dengan dukungan perintah native. Kumpulan bawaan saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Perintah plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak slash command. Perintah bawaan saat ini dalam repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan/menonaktifkan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pairing/penyiapan perangkat. Lihat [Pairing](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` untuk sementara mengaktifkan perintah node ponsel berisiko tinggi.
- `/voice status|list [limit]|set <voiceId|name>` mengelola konfigurasi suara Talk. Di Discord, nama perintah native adalah `/talkvoice`.
- `/card ...` mengirim preset rich card LINE. Lihat [LINE](/id/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` memeriksa dan mengontrol harness app-server Codex bawaan. Lihat [Codex Harness](/id/plugins/codex-harness).
- Perintah khusus QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Perintah skill dinamis

Skill yang dapat dipanggil pengguna juga diekspos sebagai slash command:

- `/skill <name> [input]` selalu berfungsi sebagai entrypoint generik.
- skill juga dapat muncul sebagai perintah langsung seperti `/prose` saat skill/plugin mendaftarkannya.
- pendaftaran perintah skill native dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.

Catatan:

- Perintah menerima `:` opsional antara perintah dan argumen (misalnya `/think: high`, `/send: on`, `/help:`).
- `/new <model>` menerima alias model, `provider/model`, atau nama provider (pencocokan fuzzy); jika tidak ada yang cocok, teks diperlakukan sebagai isi pesan.
- Untuk rincian lengkap penggunaan provider, gunakan `openclaw status --usage`.
- `/allowlist add|remove` memerlukan `commands.config=true` dan mematuhi `configWrites` channel.
- Pada channel multi-akun, `/allowlist --account <id>` yang menargetkan konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga mematuhi `configWrites` akun target.
- `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
- `/restart` diaktifkan secara default; atur `commands.restart: false` untuk menonaktifkannya.
- `/plugins install <spec>` menerima spesifikasi plugin yang sama seperti `openclaw plugins install`: path/arsip lokal, paket npm, atau `clawhub:<pkg>`.
- `/plugins enable|disable` memperbarui konfigurasi plugin dan mungkin meminta restart.
- Perintah native khusus Discord: `/vc join|leave|status` mengontrol channel suara (memerlukan `channels.discord.voice` dan perintah native; tidak tersedia sebagai teks).
- Perintah pengikatan thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan pengikatan thread efektif diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
- Referensi perintah ACP dan perilaku runtime: [ACP Agents](/id/tools/acp-agents).
- `/verbose` ditujukan untuk debugging dan visibilitas tambahan; biarkan **off** dalam penggunaan normal.
- `/trace` lebih sempit daripada `/verbose`: ini hanya menampilkan baris trace/debug milik plugin dan tetap mematikan keluaran alat verbose normal.
- `/fast on|off` mempertahankan override sesi. Gunakan opsi `inherit` di UI Sessions untuk menghapusnya dan kembali ke default konfigurasi.
- `/fast` bersifat khusus provider: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses native, sedangkan permintaan Anthropic publik langsung, termasuk lalu lintas terautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
- Ringkasan kegagalan alat tetap ditampilkan saat relevan, tetapi teks kegagalan terperinci hanya disertakan saat `/verbose` bernilai `on` atau `full`.
- `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: perintah ini dapat mengungkap reasoning internal, keluaran alat, atau diagnostik plugin yang tidak Anda maksudkan untuk ditampilkan. Sebaiknya biarkan nonaktif, terutama di chat grup.
- `/model` segera mempertahankan model sesi yang baru.
- Jika agen sedang idle, run berikutnya langsung menggunakannya.
- Jika sebuah run sudah aktif, OpenClaw menandai perpindahan langsung sebagai tertunda dan hanya memulai ulang ke model baru pada titik retry yang bersih.
- Jika aktivitas alat atau keluaran balasan sudah dimulai, perpindahan tertunda dapat tetap antre sampai ada kesempatan retry berikutnya atau giliran pengguna berikutnya.
- **Jalur cepat:** pesan yang hanya berisi perintah dari pengirim yang di-allowlist ditangani segera (melewati antrean + model).
- **Pembatasan mention grup:** pesan yang hanya berisi perintah dari pengirim yang di-allowlist melewati persyaratan mention.
- **Shortcut inline (hanya pengirim yang di-allowlist):** perintah tertentu juga berfungsi saat disisipkan dalam pesan normal dan dihapus sebelum model melihat sisa teks.
  - Contoh: `hey /status` memicu balasan status, dan sisa teks melanjutkan melalui alur normal.
- Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Pesan yang hanya berisi perintah dari pihak yang tidak berwenang diabaikan secara diam-diam, dan token inline `/...` diperlakukan sebagai teks biasa.
- **Perintah skill:** skill `user-invocable` diekspos sebagai slash command. Nama dibersihkan menjadi `a-z0-9_` (maks 32 karakter); tabrakan nama akan mendapat sufiks numerik (misalnya `_2`).
  - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna saat batas perintah native mencegah per-skill command).
  - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
  - Skill dapat secara opsional mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke alat (deterministik, tanpa model).
  - Contoh: `/prose` (plugin OpenProse) — lihat [OpenProse](/id/prose).
- **Argumen perintah native:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol saat Anda mengabaikan argumen wajib). Telegram dan Slack menampilkan menu tombol saat sebuah perintah mendukung pilihan dan Anda mengabaikan argumennya.

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan konfigurasi: **apa yang dapat digunakan agen ini saat ini dalam
percakapan ini**.

- `/tools` default bersifat ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Permukaan perintah native yang mendukung argumen menampilkan peralihan mode yang sama sebagai `compact|verbose`.
- Hasil bersifat tercakup sesi, jadi mengganti agen, channel, thread, otorisasi pengirim, atau model dapat
  mengubah keluarannya.
- `/tools` mencakup alat yang benar-benar dapat dijangkau saat runtime, termasuk alat inti, alat plugin yang terhubung, dan alat milik channel.

Untuk pengeditan profil dan override, gunakan panel Tools di UI Control atau permukaan konfigurasi/katalog
alih-alih memperlakukan `/tools` sebagai katalog statis.

## Permukaan penggunaan (apa yang muncul di mana)

- **Penggunaan/kuota provider** (contoh: “Claude 80% left”) muncul di `/status` untuk provider model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela provider menjadi `% left`; untuk MiniMax, field persentase hanya-sisa dibalik sebelum ditampilkan, dan respons `model_remains` mengutamakan entri model chat ditambah label paket bertag model.
- **Baris token/cache** di `/status` dapat fallback ke entri penggunaan transkrip terbaru ketika snapshot sesi live jarang. Nilai live nonnol yang ada tetap diutamakan, dan fallback transkrip juga dapat memulihkan label model runtime aktif ditambah total berorientasi prompt yang lebih besar saat total yang disimpan hilang atau lebih kecil.
- **Token/biaya per respons** dikontrol oleh `/usage off|tokens|full` (ditambahkan ke balasan normal).
- `/model status` membahas **model/auth/endpoint**, bukan penggunaan.

## Pemilihan model (`/model`)

`/model` diimplementasikan sebagai sebuah direktif.

Contoh:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Catatan:

- `/model` dan `/model list` menampilkan pemilih ringkas bernomor (keluarga model + provider yang tersedia).
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown provider dan model plus langkah Submit.
- `/model <#>` memilih dari pemilih tersebut (dan mengutamakan provider saat ini bila memungkinkan).
- `/model status` menampilkan tampilan detail, termasuk endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) bila tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override konfigurasi **hanya saat runtime** (memori, bukan disk). Khusus pemilik. Nonaktif secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Catatan:

- Override langsung diterapkan pada pembacaan konfigurasi baru, tetapi **tidak** menulis ke `openclaw.json`.
- Gunakan `/debug reset` untuk menghapus semua override dan kembali ke konfigurasi di disk.

## Keluaran trace plugin

`/trace` memungkinkan Anda mengaktifkan/menonaktifkan **baris trace/debug plugin yang tercakup sesi** tanpa mengaktifkan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Catatan:

- `/trace` tanpa argumen menampilkan status trace sesi saat ini.
- `/trace on` mengaktifkan baris trace plugin untuk sesi saat ini.
- `/trace off` menonaktifkannya kembali.
- Baris trace plugin dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override konfigurasi hanya saat runtime.
- `/trace` tidak menggantikan `/verbose`; keluaran alat/status verbose normal tetap menjadi ranah `/verbose`.

## Pembaruan konfigurasi

`/config` menulis ke konfigurasi di disk Anda (`openclaw.json`). Khusus pemilik. Nonaktif secara default; aktifkan dengan `commands.config: true`.

Contoh:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Catatan:

- Konfigurasi divalidasi sebelum ditulis; perubahan yang tidak valid akan ditolak.
- Pembaruan `/config` tetap bertahan setelah restart.

## Pembaruan MCP

`/mcp` menulis definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus pemilik. Nonaktif secara default; aktifkan dengan `commands.mcp: true`.

Contoh:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Catatan:

- `/mcp` menyimpan konfigurasi di konfigurasi OpenClaw, bukan pengaturan proyek milik Pi.
- Adapter runtime menentukan transport mana yang benar-benar dapat dieksekusi.

## Pembaruan plugin

`/plugins` memungkinkan operator memeriksa plugin yang ditemukan dan mengaktifkan/menonaktifkan plugin di konfigurasi. Alur baca-saja dapat menggunakan `/plugin` sebagai alias. Nonaktif secara default; aktifkan dengan `commands.plugins: true`.

Contoh:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Catatan:

- `/plugins list` dan `/plugins show` menggunakan penemuan plugin nyata terhadap workspace saat ini plus konfigurasi di disk.
- `/plugins enable|disable` hanya memperbarui konfigurasi plugin; ini tidak menginstal atau menghapus instalasi plugin.
- Setelah perubahan enable/disable, restart gateway untuk menerapkannya.

## Catatan permukaan

- **Perintah teks** berjalan di sesi chat normal (DM berbagi `main`, grup memiliki sesi sendiri).
- **Perintah native** menggunakan sesi terisolasi:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (awalan dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
- **`/stop`** menargetkan sesi chat aktif sehingga dapat membatalkan run saat ini.
- **Slack:** `channels.slack.slashCommand` masih didukung untuk satu perintah gaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu slash command Slack per perintah built-in (nama yang sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.
  - Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini.

Tidak seperti chat normal:

- ini menggunakan sesi saat ini sebagai konteks latar belakang,
- ini berjalan sebagai panggilan sekali pakai **tanpa alat** yang terpisah,
- ini tidak mengubah konteks sesi di masa mendatang,
- ini tidak ditulis ke riwayat transkrip,
- ini dikirim sebagai hasil sampingan live alih-alih sebagai pesan asisten normal.

Hal ini membuat `/btw` berguna ketika Anda menginginkan klarifikasi sementara sementara
tugas utama tetap berjalan.

Contoh:

```text
/btw apa yang sedang kita lakukan sekarang?
```

Lihat [BTW Side Questions](/id/tools/btw) untuk perilaku lengkap dan detail
UX klien.
