---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug perutean atau izin perintah
summary: 'Perintah slash: teks vs native, konfigurasi, dan perintah yang didukung'
title: Perintah Slash
x-i18n:
    generated_at: "2026-04-11T02:48:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cc346361c3b1a63aae9ec0f28706f4cb0b866b6c858a3999101f6927b923b4a
    source_path: tools/slash-commands.md
    workflow: 15
---

# Perintah Slash

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang diawali dengan `/`.
Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ada dua sistem yang terkait:

- **Perintah**: pesan `/...` mandiri.
- **Direktif**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktif dihapus dari pesan sebelum model melihatnya.
  - Dalam pesan chat normal (bukan hanya direktif), direktif diperlakukan sebagai “petunjuk inline” dan **tidak** menyimpan pengaturan sesi.
  - Dalam pesan yang hanya berisi direktif (pesan hanya berisi direktif), direktif disimpan ke sesi dan membalas dengan pengakuan.
  - Direktif hanya diterapkan untuk **pengirim yang diizinkan**. Jika `commands.allowFrom` disetel, itulah satu-satunya
    allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing channel ditambah `commands.useAccessGroups`.
    Pengirim yang tidak diizinkan akan melihat direktif diperlakukan sebagai teks biasa.

Ada juga beberapa **shortcut inline** (hanya untuk pengirim yang di-allowlist/diotorisasi): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Shortcut ini dijalankan segera, dihapus sebelum model melihat pesan, dan sisa teks melanjutkan melalui alur normal.

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
  - Pada surface tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi bahkan jika Anda menyetelnya ke `false`.
- `commands.native` (default `"auto"`) mendaftarkan perintah native.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan slash commands); diabaikan untuk penyedia tanpa dukungan native.
  - Setel `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk override per penyedia (bool atau `"auto"`).
  - `false` menghapus perintah yang sebelumnya terdaftar di Discord/Telegram saat startup. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
- `commands.nativeSkills` (default `"auto"`) mendaftarkan perintah **skill** secara native saat didukung.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack memerlukan pembuatan satu slash command per skill).
  - Setel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk override per penyedia (bool atau `"auto"`).
- `commands.bash` (default `false`) mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan allowlist `tools.elevated`).
- `commands.bashForegroundMs` (default `2000`) mengontrol berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung ke latar belakang).
- `commands.config` (default `false`) mengaktifkan `/config` (membaca/menulis `openclaw.json`).
- `commands.mcp` (default `false`) mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`).
- `commands.plugins` (default `false`) mengaktifkan `/plugins` (penemuan/status plugin plus kontrol install + enable/disable).
- `commands.debug` (default `false`) mengaktifkan `/debug` (override khusus runtime).
- `commands.restart` (default `true`) mengaktifkan `/restart` plus aksi alat restart gateway.
- `commands.ownerAllowFrom` (opsional) menetapkan allowlist pemilik eksplisit untuk surface perintah/alat khusus pemilik. Ini terpisah dari `commands.allowFrom`.
- `commands.ownerDisplay` mengontrol bagaimana ID pemilik muncul dalam prompt sistem: `raw` atau `hash`.
- `commands.ownerDisplaySecret` secara opsional menetapkan secret HMAC yang digunakan saat `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opsional) menetapkan allowlist per penyedia untuk otorisasi perintah. Saat dikonfigurasi, ini menjadi
  satu-satunya sumber otorisasi untuk perintah dan direktif (allowlist/pairing channel dan `commands.useAccessGroups`
  diabaikan). Gunakan `"*"` untuk default global; key khusus penyedia akan menimpanya.
- `commands.useAccessGroups` (default `true`) menerapkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak disetel.

## Daftar perintah

Sumber kebenaran saat ini:

- built-in inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah plugin berasal dari pemanggilan `registerCommand()` milik plugin
- ketersediaan aktual pada gateway Anda tetap bergantung pada flag konfigurasi, surface channel, dan plugin yang terpasang/diaktifkan

### Perintah built-in inti

Perintah built-in yang tersedia saat ini:

- `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
- `/compact [instructions]` memadatkan konteks sesi. Lihat [/concepts/compaction](/id/concepts/compaction).
- `/stop` membatalkan eksekusi saat ini.
- `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa thread-binding.
- `/think <off|minimal|low|medium|high|xhigh>` menetapkan tingkat thinking. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` mengubah output verbose. Alias: `/v`.
- `/fast [status|on|off]` menampilkan atau menetapkan mode cepat.
- `/reasoning [on|off|stream]` mengubah visibilitas reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` mengubah mode elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau menetapkan default exec.
- `/model [name|#|status]` menampilkan atau menetapkan model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan penyedia atau model untuk suatu penyedia.
- `/queue <mode>` mengelola perilaku antrean (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus opsi seperti `debounce:2s cap:25 drop:summarize`.
- `/help` menampilkan ringkasan bantuan singkat.
- `/commands` menampilkan katalog perintah yang dihasilkan.
- `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agen saat ini.
- `/status` menampilkan status runtime, termasuk penggunaan/kuota penyedia jika tersedia.
- `/tasks` mencantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini.
- `/context [list|detail|json]` menjelaskan bagaimana konteks dirakit.
- `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
- `/whoami` menampilkan ID pengirim Anda. Alias: `/id`.
- `/skill <name> [input]` menjalankan skill berdasarkan nama.
- `/allowlist [list|add|remove] ...` mengelola entri allowlist. Hanya teks.
- `/approve <id> <decision>` menyelesaikan prompt persetujuan exec.
- `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi mendatang. Lihat [/tools/btw](/id/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` mengelola eksekusi sub-agen untuk sesi saat ini.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
- `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
- `/unfocus` menghapus ikatan saat ini.
- `/agents` mencantumkan agen yang terikat ke thread untuk sesi saat ini.
- `/kill <id|#|all>` membatalkan satu atau semua sub-agen yang sedang berjalan.
- `/steer <id|#> <message>` mengirim pengarahan ke sub-agen yang sedang berjalan. Alias: `/tell`.
- `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Hanya pemilik. Memerlukan `commands.config: true`.
- `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Hanya pemilik. Memerlukan `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau mengubah state plugin. `/plugin` adalah alias. Penulisan hanya untuk pemilik. Memerlukan `commands.plugins: true`.
- `/debug show|set|unset|reset` mengelola override config khusus runtime. Hanya pemilik. Memerlukan `commands.debug: true`.
- `/usage off|tokens|full|cost` mengontrol footer penggunaan per respons atau mencetak ringkasan biaya lokal.
- `/tts on|off|status|provider|limit|summary|audio|help` mengontrol TTS. Lihat [/tools/tts](/id/tools/tts).
- `/restart` me-restart OpenClaw saat diaktifkan. Default: aktif; setel `commands.restart: false` untuk menonaktifkannya.
- `/activation mention|always` menetapkan mode aktivasi grup.
- `/send on|off|inherit` menetapkan kebijakan pengiriman. Hanya pemilik.
- `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` plus allowlist `tools.elevated`.
- `!poll [sessionId]` memeriksa pekerjaan bash latar belakang.
- `!stop [sessionId]` menghentikan pekerjaan bash latar belakang.

### Perintah dock yang dihasilkan

Perintah dock dihasilkan dari plugin channel dengan dukungan perintah native. Set bawaan saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Perintah plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak slash command. Perintah bawaan saat ini di repo ini:

- `/dreaming [on|off|status|help]` mengubah memory dreaming. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pairing/setup perangkat. Lihat [Pairing](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` mempersenjatai sementara perintah node ponsel berisiko tinggi.
- `/voice status|list [limit]|set <voiceId|name>` mengelola konfigurasi suara Talk. Di Discord, nama perintah native-nya adalah `/talkvoice`.
- `/card ...` mengirim preset rich card LINE. Lihat [LINE](/id/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` memeriksa dan mengontrol harness server-aplikasi Codex bawaan. Lihat [Codex Harness](/id/plugins/codex-harness).
- Perintah khusus QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Perintah skill dinamis

Skill yang dapat dipanggil pengguna juga diekspos sebagai slash command:

- `/skill <name> [input]` selalu berfungsi sebagai entrypoint generik.
- skill juga dapat muncul sebagai perintah langsung seperti `/prose` ketika skill/plugin mendaftarkannya.
- pendaftaran perintah-skill native dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.

Catatan:

- Perintah menerima `:` opsional antara perintah dan argumen (misalnya `/think: high`, `/send: on`, `/help:`).
- `/new <model>` menerima alias model, `provider/model`, atau nama penyedia (fuzzy match); jika tidak ada yang cocok, teks diperlakukan sebagai isi pesan.
- Untuk rincian penggunaan penyedia lengkap, gunakan `openclaw status --usage`.
- `/allowlist add|remove` memerlukan `commands.config=true` dan mengikuti `configWrites` channel.
- Pada channel multi-akun, `/allowlist --account <id>` yang menargetkan config dan `/config set channels.<provider>.accounts.<id>...` juga mengikuti `configWrites` akun target.
- `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
- `/restart` diaktifkan secara default; setel `commands.restart: false` untuk menonaktifkannya.
- `/plugins install <spec>` menerima spesifikasi plugin yang sama seperti `openclaw plugins install`: path/arsip lokal, paket npm, atau `clawhub:<pkg>`.
- `/plugins enable|disable` memperbarui config plugin dan mungkin meminta restart.
- Perintah native khusus Discord: `/vc join|leave|status` mengontrol voice channel (memerlukan `channels.discord.voice` dan perintah native; tidak tersedia sebagai teks).
- Perintah thread-binding Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan thread binding efektif untuk diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
- Referensi perintah ACP dan perilaku runtime: [Agen ACP](/id/tools/acp-agents).
- `/verbose` ditujukan untuk debugging dan visibilitas tambahan; biarkan **nonaktif** dalam penggunaan normal.
- `/fast on|off` menyimpan override sesi. Gunakan opsi `inherit` di UI Sesi untuk menghapusnya dan kembali ke default config.
- `/fast` bersifat khusus penyedia: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint native Responses, sedangkan permintaan Anthropic publik langsung, termasuk lalu lintas terautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
- Ringkasan kegagalan alat tetap ditampilkan saat relevan, tetapi teks kegagalan terperinci hanya disertakan saat `/verbose` bernilai `on` atau `full`.
- `/reasoning` (dan `/verbose`) berisiko dalam pengaturan grup: keduanya dapat mengungkap reasoning internal atau output alat yang tidak Anda maksudkan untuk diekspos. Sebaiknya biarkan nonaktif, terutama di chat grup.
- `/model` langsung menyimpan model sesi baru.
- Jika agen sedang idle, eksekusi berikutnya langsung menggunakannya.
- Jika sebuah eksekusi sudah aktif, OpenClaw menandai live switch sebagai tertunda dan hanya me-restart ke model baru pada titik retry yang bersih.
- Jika aktivitas alat atau output balasan sudah dimulai, switch tertunda dapat tetap mengantre hingga peluang retry berikutnya atau giliran pengguna berikutnya.
- **Fast path:** pesan yang hanya berisi perintah dari pengirim yang di-allowlist ditangani segera (melewati antrean + model).
- **Gating mention grup:** pesan yang hanya berisi perintah dari pengirim yang di-allowlist melewati persyaratan mention.
- **Shortcut inline (hanya pengirim yang di-allowlist):** perintah tertentu juga berfungsi saat disematkan dalam pesan normal dan dihapus sebelum model melihat sisa pesan.
  - Contoh: `hey /status` memicu balasan status, dan sisa teks melanjutkan melalui alur normal.
- Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Pesan yang hanya berisi perintah dari pengirim yang tidak berwenang diabaikan secara diam-diam, dan token inline `/...` diperlakukan sebagai teks biasa.
- **Perintah skill:** Skills `user-invocable` diekspos sebagai slash command. Nama disanitasi menjadi `a-z0-9_` (maksimal 32 karakter); tabrakan diberi sufiks numerik (misalnya `_2`).
  - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna saat batas perintah native mencegah perintah per-skill).
  - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
  - Skill secara opsional dapat mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke alat (deterministik, tanpa model).
  - Contoh: `/prose` (plugin OpenProse) — lihat [OpenProse](/id/prose).
- **Argumen perintah native:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen yang diperlukan). Telegram dan Slack menampilkan menu tombol saat sebuah perintah mendukung pilihan dan Anda menghilangkan argumennya.

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan config: **apa yang dapat digunakan agen ini saat ini dalam
percakapan ini**.

- Default `/tools` bersifat ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Surface perintah native yang mendukung argumen mengekspos switch mode yang sama seperti `compact|verbose`.
- Hasil bersifat session-scoped, sehingga mengubah agen, channel, thread, otorisasi pengirim, atau model dapat
  mengubah output.
- `/tools` mencakup alat yang benar-benar dapat dijangkau saat runtime, termasuk alat inti, alat plugin yang terhubung, dan alat yang dimiliki channel.

Untuk pengeditan profil dan override, gunakan panel Tools di Control UI atau surface config/katalog alih-alih
memperlakukan `/tools` sebagai katalog statis.

## Surface penggunaan (apa yang muncul di mana)

- **Penggunaan/kuota penyedia** (contoh: “Claude 80% tersisa”) muncul di `/status` untuk penyedia model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalisasi jendela penyedia menjadi `% tersisa`; untuk MiniMax, field persen yang hanya berisi sisa dibalik sebelum ditampilkan, dan respons `model_remains` lebih mengutamakan entri model chat ditambah label plan bertag model.
- **Baris token/cache** di `/status` dapat fallback ke entri penggunaan transkrip terbaru saat snapshot sesi live jarang. Nilai live bukan nol yang ada tetap menang, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total berorientasi prompt yang lebih besar saat total tersimpan tidak ada atau lebih kecil.
- **Token/biaya per respons** dikontrol oleh `/usage off|tokens|full` (ditambahkan ke balasan normal).
- `/model status` membahas **model/auth/endpoint**, bukan penggunaan.

## Pemilihan model (`/model`)

`/model` diimplementasikan sebagai direktif.

Contoh:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Catatan:

- `/model` dan `/model list` menampilkan pemilih ringkas bernomor (keluarga model + penyedia yang tersedia).
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan model plus langkah Submit.
- `/model <#>` memilih dari pemilih tersebut (dan bila memungkinkan mengutamakan penyedia saat ini).
- `/model status` menampilkan tampilan terperinci, termasuk endpoint penyedia yang dikonfigurasi (`baseUrl`) dan mode API (`api`) jika tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override config **khusus runtime** (di memori, bukan di disk). Hanya pemilik. Nonaktif secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Catatan:

- Override langsung diterapkan ke pembacaan config baru, tetapi **tidak** menulis ke `openclaw.json`.
- Gunakan `/debug reset` untuk menghapus semua override dan kembali ke config di disk.

## Pembaruan config

`/config` menulis ke config on-disk Anda (`openclaw.json`). Hanya pemilik. Nonaktif secara default; aktifkan dengan `commands.config: true`.

Contoh:

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Catatan:

- Config divalidasi sebelum ditulis; perubahan yang tidak valid ditolak.
- Pembaruan `/config` tetap tersimpan setelah restart.

## Pembaruan MCP

`/mcp` menulis definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Hanya pemilik. Nonaktif secara default; aktifkan dengan `commands.mcp: true`.

Contoh:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Catatan:

- `/mcp` menyimpan config di config OpenClaw, bukan di pengaturan project milik Pi.
- Adapter runtime menentukan transport mana yang benar-benar dapat dijalankan.

## Pembaruan plugin

`/plugins` memungkinkan operator memeriksa plugin yang ditemukan dan mengubah status aktifnya di config. Alur read-only dapat menggunakan `/plugin` sebagai alias. Nonaktif secara default; aktifkan dengan `commands.plugins: true`.

Contoh:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Catatan:

- `/plugins list` dan `/plugins show` menggunakan penemuan plugin nyata terhadap workspace saat ini plus config on-disk.
- `/plugins enable|disable` hanya memperbarui config plugin; ini tidak menginstal atau menghapus instalasi plugin.
- Setelah perubahan enable/disable, restart gateway untuk menerapkannya.

## Catatan surface

- **Perintah teks** berjalan dalam sesi chat normal (DM berbagi `main`, grup memiliki sesi sendiri).
- **Perintah native** menggunakan sesi terisolasi:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
- **`/stop`** menargetkan sesi chat aktif agar dapat membatalkan eksekusi saat ini.
- **Slack:** `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu slash command Slack per perintah built-in (nama sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.
  - Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini.

Tidak seperti chat normal:

- ini menggunakan sesi saat ini sebagai konteks latar belakang,
- ini berjalan sebagai panggilan one-shot **tanpa alat** yang terpisah,
- ini tidak mengubah konteks sesi mendatang,
- ini tidak ditulis ke riwayat transkrip,
- ini dikirim sebagai hasil sampingan live alih-alih pesan asisten normal.

Itu membuat `/btw` berguna ketika Anda menginginkan klarifikasi sementara sementara tugas utama
tetap berjalan.

Contoh:

```text
/btw apa yang sedang kita lakukan sekarang?
```

Lihat [Pertanyaan Sampingan BTW](/id/tools/btw) untuk perilaku lengkap dan detail
UX klien.
