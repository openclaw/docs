---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug perutean perintah atau izin
summary: 'Perintah slash: teks vs native, konfigurasi, dan perintah yang didukung'
title: Perintah slash
x-i18n:
    generated_at: "2026-04-24T09:32:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f708cb3c4c22dc7a97b62ce5e2283b4ecfa5c44f72eb501934e80f80181953b7
    source_path: tools/slash-commands.md
    workflow: 15
---

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang diawali dengan `/`.
Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ada dua sistem terkait:

- **Perintah**: pesan mandiri `/...`.
- **Directive**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Directive dihapus dari pesan sebelum model melihatnya.
  - Dalam pesan chat normal (bukan hanya directive), directive diperlakukan sebagai “petunjuk inline” dan **tidak** menyimpan pengaturan sesi.
  - Dalam pesan yang hanya berisi directive (pesan hanya berisi directive), directive akan disimpan ke sesi dan membalas dengan pengakuan.
  - Directive hanya diterapkan untuk **pengirim yang berwenang**. Jika `commands.allowFrom` disetel, itulah satu-satunya
    allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing channel ditambah `commands.useAccessGroups`.
    Pengirim yang tidak berwenang akan melihat directive diperlakukan sebagai teks biasa.

Ada juga beberapa **shortcut inline** (hanya untuk pengirim yang ada di allowlist/berwenang): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Mereka langsung dijalankan, dihapus sebelum model melihat pesan, dan teks yang tersisa melanjutkan alur normal.

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
  - Pada permukaan tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi meskipun Anda menyetelnya ke `false`.
- `commands.native` (default `"auto"`) mendaftarkan perintah native.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan slash command); diabaikan untuk provider tanpa dukungan native.
  - Setel `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk override per provider (bool atau `"auto"`).
  - `false` menghapus perintah yang sebelumnya terdaftar di Discord/Telegram saat startup. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
- `commands.nativeSkills` (default `"auto"`) mendaftarkan perintah **skill** secara native saat didukung.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack memerlukan pembuatan slash command per skill).
  - Setel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk override per provider (bool atau `"auto"`).
- `commands.bash` (default `false`) mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan allowlist `tools.elevated`).
- `commands.bashForegroundMs` (default `2000`) mengontrol berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung masuk latar belakang).
- `commands.config` (default `false`) mengaktifkan `/config` (membaca/menulis `openclaw.json`).
- `commands.mcp` (default `false`) mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`).
- `commands.plugins` (default `false`) mengaktifkan `/plugins` (penemuan/status Plugin plus kontrol install + enable/disable).
- `commands.debug` (default `false`) mengaktifkan `/debug` (override khusus runtime).
- `commands.restart` (default `true`) mengaktifkan `/restart` plus tindakan alat restart gateway.
- `commands.ownerAllowFrom` (opsional) menetapkan allowlist owner eksplisit untuk permukaan perintah/alat khusus owner. Ini terpisah dari `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` per channel (opsional, default `false`) membuat perintah khusus owner mengharuskan **identitas owner** untuk berjalan pada permukaan tersebut. Saat `true`, pengirim harus cocok dengan kandidat owner yang di-resolve (misalnya entri di `commands.ownerAllowFrom` atau metadata owner native provider) atau memiliki scope internal `operator.admin` pada channel pesan internal. Entri wildcard dalam channel `allowFrom`, atau daftar kandidat owner yang kosong/tidak ter-resolve, **tidak** cukup — perintah khusus owner gagal tertutup pada channel tersebut. Biarkan ini nonaktif jika Anda ingin perintah khusus owner hanya dibatasi oleh `ownerAllowFrom` dan allowlist perintah standar.
- `commands.ownerDisplay` mengontrol bagaimana id owner muncul di system prompt: `raw` atau `hash`.
- `commands.ownerDisplaySecret` secara opsional menetapkan rahasia HMAC yang digunakan saat `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opsional) menetapkan allowlist per provider untuk otorisasi perintah. Saat dikonfigurasi, ini adalah
  satu-satunya sumber otorisasi untuk perintah dan directive (allowlist/pairing channel dan `commands.useAccessGroups`
  diabaikan). Gunakan `"*"` untuk default global; kunci khusus provider meng-override-nya.
- `commands.useAccessGroups` (default `true`) menegakkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak disetel.

## Daftar perintah

Source of truth saat ini:

- built-in inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang digenerasi berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah Plugin berasal dari panggilan `registerCommand()` Plugin
- ketersediaan sebenarnya di gateway Anda tetap bergantung pada flag konfigurasi, permukaan channel, dan Plugin yang terinstal/aktif

### Perintah built-in inti

Perintah built-in yang tersedia saat ini:

- `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
- `/reset soft [message]` mempertahankan transkrip saat ini, membuang id sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/system-prompt di tempat.
- `/compact [instructions]` melakukan Compaction konteks sesi. Lihat [/concepts/compaction](/id/concepts/compaction).
- `/stop` membatalkan eksekusi saat ini.
- `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola masa berlaku thread-binding.
- `/think <level>` menetapkan tingkat thinking. Opsi berasal dari profil provider model yang aktif; tingkat umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan tingkat kustom seperti `xhigh`, `adaptive`, `max`, atau biner `on` hanya jika didukung. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` mengaktifkan/menonaktifkan output verbose. Alias: `/v`.
- `/trace on|off` mengaktifkan/menonaktifkan output jejak Plugin untuk sesi saat ini.
- `/fast [status|on|off]` menampilkan atau menetapkan mode cepat.
- `/reasoning [on|off|stream]` mengaktifkan/menonaktifkan visibilitas reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` mengaktifkan/menonaktifkan mode elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau menetapkan default exec.
- `/model [name|#|status]` menampilkan atau menetapkan model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan provider atau model untuk sebuah provider.
- `/queue <mode>` mengelola perilaku antrean (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus opsi seperti `debounce:2s cap:25 drop:summarize`.
- `/help` menampilkan ringkasan bantuan singkat.
- `/commands` menampilkan katalog perintah yang digenerasi.
- `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agen saat ini.
- `/status` menampilkan status runtime, termasuk label `Runtime`/`Runner` dan penggunaan/kuota provider jika tersedia.
- `/tasks` mencantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini.
- `/context [list|detail|json]` menjelaskan bagaimana konteks dirakit.
- `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
- `/export-trajectory [path]` mengekspor [bundel trajectory](/id/tools/trajectory) JSONL untuk sesi saat ini. Alias: `/trajectory`.
- `/whoami` menampilkan id pengirim Anda. Alias: `/id`.
- `/skill <name> [input]` menjalankan skill berdasarkan nama.
- `/allowlist [list|add|remove] ...` mengelola entri allowlist. Hanya teks.
- `/approve <id> <decision>` menyelesaikan prompt persetujuan exec.
- `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi di masa mendatang. Lihat [/tools/btw](/id/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` mengelola eksekusi sub-agen untuk sesi saat ini.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
- `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
- `/unfocus` menghapus pengikatan saat ini.
- `/agents` mencantumkan agen yang terikat thread untuk sesi saat ini.
- `/kill <id|#|all>` membatalkan satu atau semua sub-agen yang sedang berjalan.
- `/steer <id|#> <message>` mengirim pengarahan ke sub-agen yang sedang berjalan. Alias: `/tell`.
- `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Khusus owner. Memerlukan `commands.config: true`.
- `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus owner. Memerlukan `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau mengubah state Plugin. `/plugin` adalah alias. Penulisan khusus owner. Memerlukan `commands.plugins: true`.
- `/debug show|set|unset|reset` mengelola override konfigurasi khusus runtime. Khusus owner. Memerlukan `commands.debug: true`.
- `/usage off|tokens|full|cost` mengontrol footer penggunaan per respons atau mencetak ringkasan biaya lokal.
- `/tts on|off|status|provider|limit|summary|audio|help` mengontrol TTS. Lihat [/tools/tts](/id/tools/tts).
- `/restart` memulai ulang OpenClaw jika diaktifkan. Default: aktif; setel `commands.restart: false` untuk menonaktifkannya.
- `/activation mention|always` menetapkan mode aktivasi grup.
- `/send on|off|inherit` menetapkan kebijakan pengiriman. Khusus owner.
- `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` plus allowlist `tools.elevated`.
- `!poll [sessionId]` memeriksa job bash latar belakang.
- `!stop [sessionId]` menghentikan job bash latar belakang.

### Perintah dock yang digenerasi

Perintah dock digenerasi dari Plugin channel dengan dukungan native-command. Set bawaan saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Perintah Plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak slash command. Perintah bawaan saat ini di repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan/menonaktifkan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pairing/penyiapan perangkat. Lihat [Pairing](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` mengaktifkan sementara perintah node ponsel berisiko tinggi.
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
- skill juga dapat muncul sebagai perintah langsung seperti `/prose` ketika skill/Plugin mendaftarkannya.
- pendaftaran perintah skill native dikendalikan oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.

Catatan:

- Perintah menerima `:` opsional antara perintah dan argumen (misalnya `/think: high`, `/send: on`, `/help:`).
- `/new <model>` menerima alias model, `provider/model`, atau nama provider (fuzzy match); jika tidak ada yang cocok, teks diperlakukan sebagai isi pesan.
- Untuk rincian penggunaan provider lengkap, gunakan `openclaw status --usage`.
- `/allowlist add|remove` memerlukan `commands.config=true` dan mematuhi `configWrites` channel.
- Dalam channel multi-akun, `/allowlist --account <id>` yang menargetkan konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga mematuhi `configWrites` akun target.
- `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
- `/restart` aktif secara default; setel `commands.restart: false` untuk menonaktifkannya.
- `/plugins install <spec>` menerima spesifikasi Plugin yang sama seperti `openclaw plugins install`: path/arsip lokal, paket npm, atau `clawhub:<pkg>`.
- `/plugins enable|disable` memperbarui konfigurasi Plugin dan mungkin meminta restart.
- Perintah native khusus Discord: `/vc join|leave|status` mengontrol voice channel (memerlukan `channels.discord.voice` dan perintah native; tidak tersedia sebagai teks).
- Perintah thread-binding Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan thread binding efektif diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
- Referensi perintah ACP dan perilaku runtime: [Agen ACP](/id/tools/acp-agents).
- `/verbose` ditujukan untuk debugging dan visibilitas tambahan; biarkan **off** dalam penggunaan normal.
- `/trace` lebih sempit daripada `/verbose`: ini hanya menampilkan baris jejak/debug milik Plugin dan tetap mematikan obrolan alat verbose normal.
- `/fast on|off` menyimpan override sesi. Gunakan opsi `inherit` di UI Sessions untuk menghapusnya dan kembali ke default konfigurasi.
- `/fast` bersifat spesifik provider: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses native, sedangkan permintaan Anthropic publik langsung, termasuk traffic yang diautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
- Ringkasan kegagalan alat tetap ditampilkan saat relevan, tetapi teks kegagalan terperinci hanya disertakan saat `/verbose` bernilai `on` atau `full`.
- `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: ini dapat mengungkap reasoning internal, output alat, atau diagnostik Plugin yang tidak Anda maksudkan untuk ditampilkan. Sebaiknya biarkan nonaktif, terutama di chat grup.
- `/model` langsung menyimpan model sesi yang baru.
- Jika agen sedang idle, eksekusi berikutnya langsung menggunakannya.
- Jika sebuah eksekusi sudah aktif, OpenClaw menandai live switch sebagai tertunda dan hanya memulai ulang ke model baru pada titik retry yang bersih.
- Jika aktivitas alat atau output balasan sudah dimulai, switch tertunda dapat tetap mengantre sampai ada kesempatan retry berikutnya atau giliran pengguna selanjutnya.
- **Jalur cepat:** pesan yang hanya berisi perintah dari pengirim yang ada di allowlist ditangani segera (melewati antrean + model).
- **Gating mention grup:** pesan yang hanya berisi perintah dari pengirim yang ada di allowlist melewati persyaratan mention.
- **Shortcut inline (hanya pengirim di allowlist):** perintah tertentu juga berfungsi saat disisipkan dalam pesan normal dan dihapus sebelum model melihat teks sisanya.
  - Contoh: `hey /status` memicu balasan status, dan teks yang tersisa melanjutkan alur normal.
- Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Pesan yang hanya berisi perintah dari pengirim yang tidak berwenang diabaikan secara diam-diam, dan token inline `/...` diperlakukan sebagai teks biasa.
- **Perintah skill:** Skills `user-invocable` diekspos sebagai slash command. Nama disanitasi menjadi `a-z0-9_` (maks 32 karakter); tabrakan akan diberi sufiks angka (misalnya `_2`).
  - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna saat batas perintah native mencegah perintah per-skill).
  - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
  - Skill dapat secara opsional mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke alat (deterministik, tanpa model).
  - Contoh: `/prose` (Plugin OpenProse) — lihat [OpenProse](/id/prose).
- **Argumen perintah native:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen yang diperlukan). Telegram dan Slack menampilkan menu tombol saat sebuah perintah mendukung pilihan dan Anda menghilangkan argumennya.

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan konfigurasi: **apa yang dapat digunakan agen ini saat ini dalam
percakapan ini**.

- Default `/tools` bersifat ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Permukaan perintah native yang mendukung argumen mengekspos sakelar mode yang sama sebagai `compact|verbose`.
- Hasil bersifat per sesi, jadi mengubah agen, channel, thread, otorisasi pengirim, atau model dapat
  mengubah output.
- `/tools` menyertakan alat yang benar-benar dapat dijangkau saat runtime, termasuk alat inti, alat Plugin
  yang terhubung, dan alat milik channel.

Untuk pengeditan profil dan override, gunakan panel Tools di UI Control atau permukaan config/catalog alih-alih
memperlakukan `/tools` sebagai katalog statis.

## Permukaan penggunaan (apa yang muncul di mana)

- **Penggunaan/kuota provider** (contoh: “Claude 80% left”) muncul di `/status` untuk provider model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela provider menjadi `% left`; untuk MiniMax, field persen sisa-saja dibalik sebelum ditampilkan, dan respons `model_remains` mengutamakan entri model chat plus label paket bertag model.
- **Baris token/cache** di `/status` dapat fallback ke entri penggunaan transkrip terbaru saat snapshot sesi live jarang berisi data. Nilai live bukan nol yang sudah ada tetap menang, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total yang lebih besar berorientasi prompt saat total yang disimpan hilang atau lebih kecil.
- **Runtime vs runner:** `/status` melaporkan `Runtime` untuk jalur eksekusi efektif dan state sandbox, dan `Runner` untuk siapa yang sebenarnya menjalankan sesi: Pi tersemat, provider berbasis CLI, atau harness/backend ACP.
- **Token/biaya per respons** dikendalikan oleh `/usage off|tokens|full` (ditambahkan ke balasan normal).
- `/model status` membahas **model/autentikasi/endpoint**, bukan penggunaan.

## Pemilihan model (`/model`)

`/model` diimplementasikan sebagai directive.

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

- `/model` dan `/model list` menampilkan pemilih ringkas bernomor (keluarga model + provider yang tersedia).
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown provider dan model plus langkah Submit.
- `/model <#>` memilih dari pemilih itu (dan mengutamakan provider saat ini jika memungkinkan).
- `/model status` menampilkan tampilan rinci, termasuk endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) jika tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override konfigurasi **khusus runtime** (memori, bukan disk). Khusus owner. Nonaktif secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Catatan:

- Override berlaku segera untuk pembacaan konfigurasi baru, tetapi **tidak** menulis ke `openclaw.json`.
- Gunakan `/debug reset` untuk menghapus semua override dan kembali ke konfigurasi di disk.

## Output jejak Plugin

`/trace` memungkinkan Anda mengaktifkan/menonaktifkan **baris jejak/debug Plugin yang bersifat per sesi** tanpa menyalakan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Catatan:

- `/trace` tanpa argumen menampilkan state trace sesi saat ini.
- `/trace on` mengaktifkan baris jejak Plugin untuk sesi saat ini.
- `/trace off` menonaktifkannya kembali.
- Baris jejak Plugin dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override konfigurasi khusus runtime.
- `/trace` tidak menggantikan `/verbose`; output alat/status verbose normal tetap menjadi ranah `/verbose`.

## Pembaruan konfigurasi

`/config` menulis ke konfigurasi di disk Anda (`openclaw.json`). Khusus owner. Nonaktif secara default; aktifkan dengan `commands.config: true`.

Contoh:

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Catatan:

- Konfigurasi divalidasi sebelum penulisan; perubahan yang tidak valid ditolak.
- Pembaruan `/config` bertahan setelah restart.

## Pembaruan MCP

`/mcp` menulis definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus owner. Nonaktif secara default; aktifkan dengan `commands.mcp: true`.

Contoh:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Catatan:

- `/mcp` menyimpan konfigurasi di konfigurasi OpenClaw, bukan pengaturan proyek milik Pi.
- Adaptor runtime memutuskan transport mana yang benar-benar dapat dieksekusi.

## Pembaruan Plugin

`/plugins` memungkinkan operator memeriksa Plugin yang ditemukan dan mengaktifkan/menonaktifkannya di konfigurasi. Alur hanya-baca dapat menggunakan `/plugin` sebagai alias. Nonaktif secara default; aktifkan dengan `commands.plugins: true`.

Contoh:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Catatan:

- `/plugins list` dan `/plugins show` menggunakan penemuan Plugin nyata terhadap workspace saat ini plus konfigurasi di disk.
- `/plugins enable|disable` hanya memperbarui konfigurasi Plugin; ini tidak menginstal atau menghapus instalasi Plugin.
- Setelah perubahan enable/disable, restart gateway untuk menerapkannya.

## Catatan permukaan

- **Perintah teks** berjalan di sesi chat normal (DM berbagi `main`, grup memiliki sesinya sendiri).
- **Perintah native** menggunakan sesi terisolasi:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (awalan dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
- **`/stop`** menargetkan sesi chat aktif agar dapat membatalkan eksekusi saat ini.
- **Slack:** `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu slash command Slack per perintah built-in (nama yang sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.
  - Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini.

Tidak seperti chat normal:

- ini menggunakan sesi saat ini sebagai konteks latar,
- ini berjalan sebagai panggilan satu kali **tanpa alat** yang terpisah,
- ini tidak mengubah konteks sesi di masa mendatang,
- ini tidak ditulis ke riwayat transkrip,
- ini dikirim sebagai hasil sampingan live alih-alih pesan asisten normal.

Itu membuat `/btw` berguna saat Anda menginginkan klarifikasi sementara sementara tugas utama
tetap berjalan.

Contoh:

```text
/btw apa yang sedang kita lakukan sekarang?
```

Lihat [BTW Side Questions](/id/tools/btw) untuk perilaku lengkap dan detail UX
klien.

## Terkait

- [Skills](/id/tools/skills)
- [Konfigurasi Skills](/id/tools/skills-config)
- [Membuat Skills](/id/tools/creating-skills)
