---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug perutean perintah atau izin
summary: 'Perintah garis miring: teks vs native, konfigurasi, dan perintah yang didukung'
title: Perintah Garis Miring
x-i18n:
    generated_at: "2026-04-23T13:58:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13290dcdf649ae66603a92a0aca68460bb63ff476179cc2dded796aaa841d66c
    source_path: tools/slash-commands.md
    workflow: 15
---

# Perintah garis miring

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang diawali dengan `/`.
Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ada dua sistem yang terkait:

- **Perintah**: pesan `/...` mandiri.
- **Direktif**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktif dihapus dari pesan sebelum model melihatnya.
  - Dalam pesan chat biasa (bukan hanya direktif), direktif diperlakukan sebagai “petunjuk inline” dan **tidak** mempertahankan pengaturan sesi.
  - Dalam pesan yang hanya berisi direktif (pesan hanya berisi direktif), direktif dipertahankan ke sesi dan membalas dengan pengakuan.
  - Direktif hanya diterapkan untuk **pengirim yang diizinkan**. Jika `commands.allowFrom` diatur, itu adalah satu-satunya
    allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing channel ditambah `commands.useAccessGroups`.
    Pengirim yang tidak diizinkan akan melihat direktif diperlakukan sebagai teks biasa.

Ada juga beberapa **shortcut inline** (hanya pengirim yang di-allowlist/diizinkan): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Shortcut ini berjalan segera, dihapus sebelum model melihat pesan, dan sisa teks melanjutkan alur normal.

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
  - Pada permukaan tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi meskipun Anda mengaturnya ke `false`.
- `commands.native` (default `"auto"`) mendaftarkan perintah native.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan slash command); diabaikan untuk provider tanpa dukungan native.
  - Atur `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk menimpa per provider (bool atau `"auto"`).
  - `false` menghapus perintah yang sebelumnya terdaftar di Discord/Telegram saat startup. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
- `commands.nativeSkills` (default `"auto"`) mendaftarkan perintah **skill** secara native bila didukung.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack mengharuskan pembuatan satu slash command per skill).
  - Atur `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk menimpa per provider (bool atau `"auto"`).
- `commands.bash` (default `false`) mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan allowlist `tools.elevated`).
- `commands.bashForegroundMs` (default `2000`) mengontrol berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung menjalankannya di latar belakang).
- `commands.config` (default `false`) mengaktifkan `/config` (membaca/menulis `openclaw.json`).
- `commands.mcp` (default `false`) mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`).
- `commands.plugins` (default `false`) mengaktifkan `/plugins` (penemuan/status plugin serta kontrol instalasi + aktif/nonaktif).
- `commands.debug` (default `false`) mengaktifkan `/debug` (override hanya runtime).
- `commands.restart` (default `true`) mengaktifkan `/restart` plus aksi tool restart gateway.
- `commands.ownerAllowFrom` (opsional) menetapkan allowlist pemilik eksplisit untuk permukaan perintah/tool khusus pemilik. Ini terpisah dari `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` per channel (opsional, default `false`) membuat perintah khusus pemilik memerlukan **identitas pemilik** untuk dijalankan pada permukaan itu. Jika `true`, pengirim harus cocok dengan kandidat pemilik yang terselesaikan (misalnya entri dalam `commands.ownerAllowFrom` atau metadata pemilik native provider) atau memiliki cakupan internal `operator.admin` pada channel pesan internal. Entri wildcard dalam channel `allowFrom`, atau daftar kandidat pemilik yang kosong/tidak terselesaikan, **tidak** cukup — perintah khusus pemilik gagal tertutup pada channel tersebut. Biarkan ini nonaktif jika Anda ingin perintah khusus pemilik dibatasi hanya oleh `ownerAllowFrom` dan allowlist perintah standar.
- `commands.ownerDisplay` mengontrol bagaimana ID pemilik muncul dalam prompt sistem: `raw` atau `hash`.
- `commands.ownerDisplaySecret` secara opsional menetapkan rahasia HMAC yang digunakan saat `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opsional) menetapkan allowlist per provider untuk otorisasi perintah. Jika dikonfigurasi, ini adalah
  satu-satunya sumber otorisasi untuk perintah dan direktif (`commands.useAccessGroups` serta allowlist/pairing channel
  diabaikan). Gunakan `"*"` untuk default global; kunci khusus provider menimpa nilai tersebut.
- `commands.useAccessGroups` (default `true`) menerapkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak diatur.

## Daftar perintah

Sumber kebenaran saat ini:

- built-in inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah plugin berasal dari pemanggilan `registerCommand()` plugin
- ketersediaan sebenarnya pada gateway Anda tetap bergantung pada flag konfigurasi, permukaan channel, dan plugin yang diinstal/diaktifkan

### Perintah built-in inti

Perintah built-in yang tersedia saat ini:

- `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
- `/reset soft [message]` mempertahankan transkrip saat ini, menghapus ID sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/system prompt di tempat.
- `/compact [instructions]` melakukan Compaction pada konteks sesi. Lihat [/concepts/compaction](/id/concepts/compaction).
- `/stop` membatalkan run saat ini.
- `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa pengikatan thread.
- `/think <level>` menetapkan tingkat pemikiran. Opsinya berasal dari profil provider model aktif; tingkat umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan tingkat kustom seperti `xhigh`, `adaptive`, `max`, atau biner `on` hanya jika didukung. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` mengaktifkan atau menonaktifkan output verbose. Alias: `/v`.
- `/trace on|off` mengaktifkan atau menonaktifkan output trace plugin untuk sesi saat ini.
- `/fast [status|on|off]` menampilkan atau menetapkan mode cepat.
- `/reasoning [on|off|stream]` mengaktifkan atau menonaktifkan visibilitas reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` mengaktifkan atau menonaktifkan mode elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau menetapkan default exec.
- `/model [name|#|status]` menampilkan atau menetapkan model.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan provider atau model untuk suatu provider.
- `/queue <mode>` mengelola perilaku antrean (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) beserta opsi seperti `debounce:2s cap:25 drop:summarize`.
- `/help` menampilkan ringkasan bantuan singkat.
- `/commands` menampilkan katalog perintah yang dihasilkan.
- `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agen saat ini sekarang juga.
- `/status` menampilkan status runtime, termasuk label `Runtime`/`Runner` dan penggunaan/kuota provider jika tersedia.
- `/tasks` mencantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini.
- `/context [list|detail|json]` menjelaskan bagaimana konteks dirakit.
- `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
- `/export-trajectory [path]` mengekspor [bundle trajectory](/id/tools/trajectory) JSONL untuk sesi saat ini. Alias: `/trajectory`.
- `/whoami` menampilkan ID pengirim Anda. Alias: `/id`.
- `/skill <name> [input]` menjalankan skill berdasarkan nama.
- `/allowlist [list|add|remove] ...` mengelola entri allowlist. Hanya teks.
- `/approve <id> <decision>` menyelesaikan prompt persetujuan exec.
- `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi di masa mendatang. Lihat [/tools/btw](/id/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` mengelola run sub-agent untuk sesi saat ini.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
- `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
- `/unfocus` menghapus pengikatan saat ini.
- `/agents` mencantumkan agen yang terikat ke thread untuk sesi saat ini.
- `/kill <id|#|all>` membatalkan satu atau semua sub-agent yang sedang berjalan.
- `/steer <id|#> <message>` mengirim steering ke sub-agent yang sedang berjalan. Alias: `/tell`.
- `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Khusus pemilik. Memerlukan `commands.config: true`.
- `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus pemilik. Memerlukan `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau memutasi status plugin. `/plugin` adalah alias. Penulisan khusus pemilik. Memerlukan `commands.plugins: true`.
- `/debug show|set|unset|reset` mengelola override konfigurasi hanya runtime. Khusus pemilik. Memerlukan `commands.debug: true`.
- `/usage off|tokens|full|cost` mengontrol footer penggunaan per respons atau mencetak ringkasan biaya lokal.
- `/tts on|off|status|provider|limit|summary|audio|help` mengontrol TTS. Lihat [/tools/tts](/id/tools/tts).
- `/restart` me-restart OpenClaw jika diaktifkan. Default: aktif; atur `commands.restart: false` untuk menonaktifkannya.
- `/activation mention|always` menetapkan mode aktivasi grup.
- `/send on|off|inherit` menetapkan kebijakan pengiriman. Khusus pemilik.
- `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` plus allowlist `tools.elevated`.
- `!poll [sessionId]` memeriksa job bash latar belakang.
- `!stop [sessionId]` menghentikan job bash latar belakang.

### Perintah dock yang dihasilkan

Perintah dock dihasilkan dari plugin channel dengan dukungan perintah native. Set bawaan saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Perintah plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak slash command. Perintah bawaan saat ini di repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan atau menonaktifkan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pairing/penyiapan perangkat. Lihat [Pairing](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` mempersenjatai sementara perintah node ponsel berisiko tinggi.
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
- skill juga dapat muncul sebagai perintah langsung seperti `/prose` ketika skill/plugin mendaftarkannya.
- pendaftaran perintah skill native dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.

Catatan:

- Perintah menerima `:` opsional antara perintah dan argumen (misalnya `/think: high`, `/send: on`, `/help:`).
- `/new <model>` menerima alias model, `provider/model`, atau nama provider (fuzzy match); jika tidak ada yang cocok, teks diperlakukan sebagai isi pesan.
- Untuk rincian penggunaan provider lengkap, gunakan `openclaw status --usage`.
- `/allowlist add|remove` memerlukan `commands.config=true` dan mengikuti `configWrites` channel.
- Dalam channel multi-akun, `/allowlist --account <id>` yang menargetkan konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga mengikuti `configWrites` akun target.
- `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
- `/restart` aktif secara default; atur `commands.restart: false` untuk menonaktifkannya.
- `/plugins install <spec>` menerima spesifikasi plugin yang sama seperti `openclaw plugins install`: path/arsip lokal, paket npm, atau `clawhub:<pkg>`.
- `/plugins enable|disable` memperbarui konfigurasi plugin dan mungkin meminta restart.
- Perintah native khusus Discord: `/vc join|leave|status` mengontrol voice channel (memerlukan `channels.discord.voice` dan perintah native; tidak tersedia sebagai teks).
- Perintah pengikatan thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan pengikatan thread efektif diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
- Referensi perintah ACP dan perilaku runtime: [ACP Agents](/id/tools/acp-agents).
- `/verbose` dimaksudkan untuk debugging dan visibilitas tambahan; biarkan **nonaktif** dalam penggunaan normal.
- `/trace` lebih sempit daripada `/verbose`: ini hanya menampilkan baris trace/debug milik plugin dan menjaga chatter tool verbose normal tetap nonaktif.
- `/fast on|off` mempertahankan override sesi. Gunakan opsi `inherit` di UI Sessions untuk menghapusnya dan kembali ke default konfigurasi.
- `/fast` bersifat khusus provider: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint native Responses, sedangkan permintaan Anthropic publik langsung, termasuk trafik terautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
- Ringkasan kegagalan tool tetap ditampilkan bila relevan, tetapi teks kegagalan terperinci hanya disertakan saat `/verbose` `on` atau `full`.
- `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: ini dapat mengungkap reasoning internal, output tool, atau diagnostik plugin yang tidak Anda maksudkan untuk ditampilkan. Sebaiknya biarkan nonaktif, terutama di chat grup.
- `/model` langsung mempertahankan model sesi yang baru.
- Jika agen sedang idle, run berikutnya langsung menggunakannya.
- Jika run sudah aktif, OpenClaw menandai live switch sebagai tertunda dan hanya memulai ulang ke model baru pada titik retry yang bersih.
- Jika aktivitas tool atau output balasan sudah dimulai, perpindahan tertunda dapat tetap mengantre hingga kesempatan retry berikutnya atau giliran pengguna berikutnya.
- **Jalur cepat:** pesan khusus perintah dari pengirim yang masuk allowlist ditangani segera (melewati antrean + model).
- **Pembatasan mention grup:** pesan khusus perintah dari pengirim yang masuk allowlist melewati persyaratan mention.
- **Shortcut inline (khusus pengirim yang masuk allowlist):** perintah tertentu juga berfungsi saat disisipkan dalam pesan normal dan dihapus sebelum model melihat sisa teks.
  - Contoh: `hey /status` memicu balasan status, dan sisa teks melanjutkan melalui alur normal.
- Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Pesan khusus perintah yang tidak sah diabaikan tanpa suara, dan token inline `/...` diperlakukan sebagai teks biasa.
- **Perintah skill:** skill `user-invocable` juga diekspos sebagai slash command. Nama disanitasi menjadi `a-z0-9_` (maksimal 32 karakter); benturan diberi sufiks numerik (misalnya `_2`).
  - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna saat batas perintah native mencegah perintah per-skill).
  - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
  - Skill secara opsional dapat mendeklarasikan `command-dispatch: tool` untuk mengarahkan perintah langsung ke tool (deterministik, tanpa model).
  - Contoh: `/prose` (plugin OpenProse) — lihat [OpenProse](/id/prose).
- **Argumen perintah native:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol ketika Anda menghilangkan argumen yang diwajibkan). Telegram dan Slack menampilkan menu tombol ketika suatu perintah mendukung pilihan dan Anda menghilangkan argumennya.

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan konfigurasi: **apa yang dapat digunakan agen ini sekarang juga dalam
percakapan ini**.

- Default `/tools` bersifat ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Permukaan perintah native yang mendukung argumen mengekspos pengalih mode yang sama sebagai `compact|verbose`.
- Hasilnya bersifat terlingkup sesi, sehingga mengganti agen, channel, thread, otorisasi pengirim, atau model dapat
  mengubah output.
- `/tools` mencakup tool yang benar-benar dapat dijangkau saat runtime, termasuk tool inti, tool plugin yang terhubung, dan tool milik channel.

Untuk mengedit profil dan override, gunakan panel Tools di UI Control atau permukaan config/katalog alih-alih
memperlakukan `/tools` sebagai katalog statis.

## Permukaan penggunaan (apa yang tampil di mana)

- **Penggunaan/kuota provider** (contoh: “Claude tersisa 80%”) muncul di `/status` untuk provider model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela provider menjadi `% tersisa`; untuk MiniMax, field persentase hanya-sisa dibalik sebelum ditampilkan, dan respons `model_remains` mengutamakan entri model chat plus label paket bertag model.
- **Baris token/cache** di `/status` dapat fallback ke entri penggunaan transkrip terbaru ketika snapshot sesi live jarang. Nilai live bukan nol yang ada tetap diutamakan, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total berorientasi prompt yang lebih besar saat total yang disimpan hilang atau lebih kecil.
- **Runtime vs runner:** `/status` melaporkan `Runtime` untuk jalur eksekusi efektif dan status sandbox, serta `Runner` untuk siapa yang benar-benar menjalankan sesi: Pi tertanam, provider berbasis CLI, atau harness/backend ACP.
- **Token/biaya per respons** dikontrol oleh `/usage off|tokens|full` (ditambahkan ke balasan normal).
- `/model status` berkaitan dengan **model/auth/endpoint**, bukan penggunaan.

## Pemilihan model (`/model`)

`/model` diimplementasikan sebagai direktif.

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
- `/model status` menampilkan tampilan terperinci, termasuk endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) bila tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override konfigurasi **hanya runtime** (memori, bukan disk). Khusus pemilik. Nonaktif secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Catatan:

- Override langsung berlaku untuk pembacaan konfigurasi baru, tetapi **tidak** menulis ke `openclaw.json`.
- Gunakan `/debug reset` untuk menghapus semua override dan kembali ke konfigurasi di disk.

## Output trace plugin

`/trace` memungkinkan Anda mengaktifkan atau menonaktifkan **baris trace/debug plugin yang terlingkup sesi** tanpa menyalakan mode verbose penuh.

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
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override konfigurasi hanya runtime.
- `/trace` tidak menggantikan `/verbose`; output tool/status verbose normal tetap milik `/verbose`.

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

- Konfigurasi divalidasi sebelum ditulis; perubahan yang tidak valid ditolak.
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

- `/mcp` menyimpan konfigurasi di konfigurasi OpenClaw, bukan pengaturan project milik Pi.
- Adapter runtime menentukan transport mana yang benar-benar dapat dieksekusi.

## Pembaruan plugin

`/plugins` memungkinkan operator memeriksa plugin yang ditemukan dan mengaktifkan/menonaktifkan dalam konfigurasi. Alur hanya-baca dapat menggunakan `/plugin` sebagai alias. Nonaktif secara default; aktifkan dengan `commands.plugins: true`.

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
- Setelah perubahan aktif/nonaktif, restart gateway untuk menerapkannya.

## Catatan permukaan

- **Perintah teks** berjalan dalam sesi chat normal (DM berbagi `main`, grup memiliki sesinya sendiri).
- **Perintah native** menggunakan sesi terisolasi:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
- **`/stop`** menargetkan sesi chat aktif sehingga dapat membatalkan run saat ini.
- **Slack:** `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu slash command Slack per perintah built-in (nama yang sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.
  - Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini.

Tidak seperti chat normal:

- ini menggunakan sesi saat ini sebagai konteks latar belakang,
- ini berjalan sebagai panggilan sekali jalan **tanpa tool** yang terpisah,
- ini tidak mengubah konteks sesi di masa mendatang,
- ini tidak ditulis ke riwayat transkrip,
- ini dikirim sebagai hasil sampingan live alih-alih pesan asisten normal.

Ini membuat `/btw` berguna saat Anda menginginkan klarifikasi sementara sementara
tugas utama tetap berjalan.

Contoh:

```text
/btw apa yang sedang kita lakukan sekarang?
```

Lihat [BTW Side Questions](/id/tools/btw) untuk perilaku lengkap dan detail UX
klien.
