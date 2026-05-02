---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Mendiagnosis perutean perintah atau izin
sidebarTitle: Slash commands
summary: 'Perintah slash: teks vs asli, konfigurasi, dan perintah yang didukung'
title: Perintah garis miring
x-i18n:
    generated_at: "2026-05-02T21:01:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`. Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ketika percakapan atau thread terikat ke sesi ACP, teks tindak lanjut normal dirutekan ke harness ACP tersebut. Perintah pengelolaan Gateway tetap lokal: `/acp ...` selalu mencapai handler perintah ACP OpenClaw, dan `/status` plus `/unfocus` tetap lokal setiap kali penanganan perintah diaktifkan untuk surface tersebut.

Ada dua sistem terkait:

<AccordionGroup>
  <Accordion title="Perintah">
    Pesan `/...` mandiri.
  </Accordion>
  <Accordion title="Directive">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directive dihapus dari pesan sebelum model melihatnya.
    - Dalam pesan chat normal (bukan hanya directive), directive diperlakukan sebagai "petunjuk inline" dan **tidak** mempertahankan pengaturan sesi.
    - Dalam pesan yang hanya berisi directive (pesan hanya berisi directive), directive dipertahankan ke sesi dan dibalas dengan pengakuan.
    - Directive hanya diterapkan untuk **pengirim yang berwenang**. Jika `commands.allowFrom` disetel, itu adalah satu-satunya allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing channel plus `commands.useAccessGroups`. Pengirim tidak berwenang melihat directive diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Pintasan inline">
    Hanya pengirim yang masuk allowlist/berwenang: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Perintah tersebut berjalan segera, dihapus sebelum model melihat pesan, dan teks yang tersisa berlanjut melalui alur normal.

  </Accordion>
</AccordionGroup>

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

<ParamField path="commands.text" type="boolean" default="true">
  Mengaktifkan parsing `/...` dalam pesan chat. Pada surface tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi meskipun Anda menyetelnya ke `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah native. Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan slash command); diabaikan untuk provider tanpa dukungan native. Setel `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk menimpa per provider (bool atau `"auto"`). `false` menghapus perintah yang sebelumnya terdaftar di Discord/Telegram saat startup. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
</ParamField>
Di Discord, spesifikasi perintah native dapat menyertakan `descriptionLocalizations`, yang diterbitkan OpenClaw sebagai Discord `description_localizations` dan disertakan dalam perbandingan rekonsiliasi.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah **skill** secara native saat didukung. Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack memerlukan pembuatan slash command per skill). Setel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk menimpa per provider (bool atau `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan allowlist `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Mengontrol berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung berjalan di latar belakang).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Mengaktifkan `/config` (membaca/menulis `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Mengaktifkan `/plugins` (penemuan/status plugin plus kontrol instal + aktifkan/nonaktifkan).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Mengaktifkan `/debug` (override khusus runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Mengaktifkan `/restart` plus tindakan tool mulai ulang gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Menetapkan allowlist owner eksplisit untuk surface perintah/tool khusus owner. Ini adalah akun operator manusia yang dapat menyetujui tindakan berbahaya dan menjalankan perintah seperti `/diagnostics`, `/export-trajectory`, dan `/config`. Ini terpisah dari `commands.allowFrom` dan dari akses pairing DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per channel: membuat perintah khusus owner memerlukan **identitas owner** untuk berjalan pada surface tersebut. Ketika `true`, pengirim harus cocok dengan kandidat owner yang telah di-resolve (misalnya entri di `commands.ownerAllowFrom` atau metadata owner native provider) atau memiliki scope internal `operator.admin` pada channel pesan internal. Entri wildcard di channel `allowFrom`, atau daftar kandidat owner yang kosong/tidak ter-resolve, **tidak** cukup — perintah khusus owner gagal tertutup pada channel tersebut. Biarkan ini nonaktif jika Anda ingin perintah khusus owner dibatasi hanya oleh `ownerAllowFrom` dan allowlist perintah standar.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Mengontrol bagaimana id owner muncul di prompt sistem.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Secara opsional menetapkan secret HMAC yang digunakan ketika `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider untuk otorisasi perintah. Ketika dikonfigurasi, ini adalah satu-satunya sumber otorisasi untuk perintah dan directive (allowlist/pairing channel dan `commands.useAccessGroups` diabaikan). Gunakan `"*"` untuk default global; kunci khusus provider menimpanya.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Menerapkan allowlist/kebijakan untuk perintah ketika `commands.allowFrom` tidak disetel.
</ParamField>

## Daftar perintah

Sumber kebenaran saat ini:

- bawaan inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah plugin berasal dari panggilan `registerCommand()` plugin
- ketersediaan aktual di gateway Anda tetap bergantung pada flag konfigurasi, surface channel, dan plugin yang terinstal/diaktifkan

### Perintah bawaan inti

<AccordionGroup>
  <Accordion title="Sesi dan run">
    - `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
    - Control UI mencegat `/new` yang diketik untuk membuat dan beralih ke sesi dashboard baru; `/reset` yang diketik tetap menjalankan reset di tempat milik Gateway.
    - `/reset soft [message]` mempertahankan transcript saat ini, membuang id sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/system-prompt di tempat.
    - `/compact [instructions]` memadatkan konteks sesi. Lihat [Compaction](/id/concepts/compaction).
    - `/stop` membatalkan run saat ini.
    - `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa pengikatan thread.
    - `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
    - `/export-trajectory [path]` meminta persetujuan exec, lalu mengekspor [bundle trajektori](/id/tools/trajectory) JSONL untuk sesi saat ini. Gunakan ini ketika Anda membutuhkan timeline prompt, tool, dan transcript untuk satu sesi OpenClaw. Dalam chat grup, prompt persetujuan dan hasil ekspor dikirim secara privat ke owner. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Kontrol model dan run">
    - `/think <level>` menetapkan level berpikir. Opsi berasal dari profil provider model aktif; level umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan level kustom seperti `xhigh`, `adaptive`, `max`, atau biner `on` hanya jika didukung. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` mengalihkan output verbose. Alias: `/v`.
    - `/trace on|off` mengalihkan output trace plugin untuk sesi saat ini.
    - `/fast [status|on|off]` menampilkan atau menyetel mode cepat.
    - `/reasoning [on|off|stream]` mengalihkan visibilitas reasoning. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` mengalihkan mode elevated. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau menyetel default exec.
    - `/model [name|#|status]` menampilkan atau menyetel model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan provider atau model yang dikonfigurasi/tersedia auth untuk suatu provider; tambahkan `all` untuk menelusuri katalog lengkap provider tersebut.
    - `/queue <mode>` mengelola perilaku antrean (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus opsi seperti `debounce:0.5s cap:25 drop:summarize`; `/queue default` atau `/queue reset` menghapus override sesi. Lihat [Antrean perintah](/id/concepts/queue) dan [Antrean steering](/id/concepts/queue-steering).

  </Accordion>
  <Accordion title="Penemuan dan status">
    - `/help` menampilkan ringkasan bantuan singkat.
    - `/commands` menampilkan katalog perintah yang dihasilkan.
    - `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agen saat ini sekarang.
    - `/status` menampilkan status eksekusi/runtime, termasuk label `Execution`/`Runtime` dan penggunaan/kuota provider saat tersedia.
    - `/diagnostics [note]` adalah alur laporan dukungan khusus owner untuk bug Gateway dan run harness Codex. Perintah ini meminta persetujuan exec eksplisit setiap kali sebelum menjalankan `openclaw gateway diagnostics export --json`; jangan setujui diagnostik dengan aturan allow-all. Setelah disetujui, perintah ini mengirim laporan yang dapat ditempel dengan path bundle lokal, ringkasan manifest, catatan privasi, dan id sesi yang relevan. Dalam chat grup, prompt persetujuan dan laporan dikirim secara privat ke owner. Ketika sesi aktif menggunakan harness OpenAI Codex, persetujuan yang sama juga mengirim feedback Codex yang relevan ke server OpenAI dan balasan selesai mencantumkan id sesi OpenClaw, id thread Codex, dan perintah `codex resume <thread-id>`. Lihat [Ekspor Diagnostik](/id/gateway/diagnostics).
    - `/crestodian <request>` menjalankan helper penyiapan dan perbaikan Crestodian dari DM owner.
    - `/tasks` mencantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini.
    - `/context [list|detail|json]` menjelaskan bagaimana konteks disusun.
    - `/whoami` menampilkan id pengirim Anda. Alias: `/id`.
    - `/usage off|tokens|full|cost` mengontrol footer penggunaan per respons atau mencetak ringkasan biaya lokal.

  </Accordion>
  <Accordion title="Skills, allowlist, persetujuan">
    - `/skill <name> [input]` menjalankan skill berdasarkan nama.
    - `/allowlist [list|add|remove] ...` mengelola entri allowlist. Hanya teks.
    - `/approve <id> <decision>` menyelesaikan prompt persetujuan exec.
    - `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi mendatang. Lihat [BTW](/id/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` mengelola proses sub-agen untuk sesi saat ini.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
    - `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
    - `/unfocus` menghapus ikatan saat ini.
    - `/agents` mencantumkan agen yang terikat thread untuk sesi saat ini.
    - `/kill <id|#|all>` membatalkan satu atau semua sub-agen yang sedang berjalan.
    - `/steer <id|#> <message>` mengirim arahan ke sub-agen yang sedang berjalan. Alias: `/tell`.

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Hanya pemilik. Memerlukan `commands.config: true`.
    - `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Hanya pemilik. Memerlukan `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau mengubah status Plugin. `/plugin` adalah alias. Penulisan hanya untuk pemilik. Memerlukan `commands.plugins: true`.
    - `/debug show|set|unset|reset` mengelola override konfigurasi khusus runtime. Hanya pemilik. Memerlukan `commands.debug: true`.
    - `/restart` memulai ulang OpenClaw saat diaktifkan. Default: aktif; tetapkan `commands.restart: false` untuk menonaktifkannya.
    - `/send on|off|inherit` menetapkan kebijakan pengiriman. Hanya pemilik.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` mengontrol TTS. Lihat [TTS](/id/tools/tts).
    - `/activation mention|always` menetapkan mode aktivasi grup.
    - `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` ditambah allowlist `tools.elevated`.
    - `!poll [sessionId]` memeriksa job bash latar belakang.
    - `!stop [sessionId]` menghentikan job bash latar belakang.

  </Accordion>
</AccordionGroup>

### Perintah dock yang dihasilkan

Perintah dock mengalihkan rute balasan sesi saat ini ke kanal tertaut lain. Lihat [Docking kanal](/id/concepts/channel-docking) untuk penyiapan, contoh, dan pemecahan masalah.

Perintah dock dihasilkan dari Plugin kanal dengan dukungan perintah native. Set bawaan saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Gunakan perintah dock dari chat langsung untuk mengalihkan rute balasan sesi saat ini ke kanal tertaut lain. Agen mempertahankan konteks sesi yang sama, tetapi balasan berikutnya untuk sesi tersebut dikirimkan ke peer kanal yang dipilih.

Perintah dock memerlukan `session.identityLinks`. Pengirim sumber dan peer target harus berada dalam grup identitas yang sama, misalnya `["telegram:123", "discord:456"]`. Jika pengguna Telegram dengan id `123` mengirim `/dock_discord`, OpenClaw menyimpan `lastChannel: "discord"` dan `lastTo: "456"` pada sesi aktif. Jika pengirim tidak tertaut ke peer Discord, perintah akan membalas dengan petunjuk penyiapan alih-alih diteruskan ke chat normal.

Docking hanya mengubah rute sesi aktif. Ini tidak membuat akun kanal, memberikan akses, melewati allowlist kanal, atau memindahkan riwayat transkrip ke sesi lain. Gunakan `/dock-telegram`, `/dock-slack`, `/dock-mattermost`, atau perintah dock lain yang dihasilkan untuk mengalihkan rute lagi.

### Perintah Plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak perintah slash. Perintah bawaan saat ini di repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan atau menonaktifkan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pemasangan/penyiapan perangkat. Lihat [Pemasangan](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` untuk sementara mengaktifkan perintah node ponsel berisiko tinggi.
- `/voice status|list [limit]|set <voiceId|name>` mengelola konfigurasi suara Talk. Di Discord, nama perintah native adalah `/talkvoice`.
- `/card ...` mengirim preset kartu kaya LINE. Lihat [LINE](/id/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` memeriksa dan mengontrol harness server aplikasi Codex bawaan. Lihat [Harness Codex](/id/plugins/codex-harness).
- Perintah khusus QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Perintah skill dinamis

Skills yang dapat dipanggil pengguna juga diekspos sebagai perintah slash:

- `/skill <name> [input]` selalu berfungsi sebagai entrypoint generik.
- Skills juga dapat muncul sebagai perintah langsung seperti `/prose` saat skill/Plugin mendaftarkannya.
- pendaftaran perintah skill native dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.
- spesifikasi perintah dapat menyediakan `descriptionLocalizations` untuk permukaan native yang mendukung deskripsi terlokalisasi, termasuk Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - Perintah menerima `:` opsional antara perintah dan argumen (mis. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` menerima alias model, `provider/model`, atau nama penyedia (pencocokan fuzzy); jika tidak ada kecocokan, teks diperlakukan sebagai isi pesan.
    - Untuk rincian penggunaan penyedia lengkap, gunakan `openclaw status --usage`.
    - `/allowlist add|remove` memerlukan `commands.config=true` dan menghormati `configWrites` kanal.
    - Di kanal multi-akun, `/allowlist --account <id>` yang menargetkan konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga menghormati `configWrites` akun target.
    - `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
    - `/restart` diaktifkan secara default; tetapkan `commands.restart: false` untuk menonaktifkannya.
    - `/plugins install <spec>` menerima spesifikasi Plugin yang sama seperti `openclaw plugins install`: path/arsip lokal, paket npm, `git:<repo>`, atau `clawhub:<pkg>`, lalu meminta restart Gateway karena modul sumber Plugin berubah.
    - `/plugins enable|disable` memperbarui konfigurasi Plugin dan memicu pemuatan ulang Plugin Gateway untuk giliran agen baru.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - Perintah native khusus Discord: `/vc join|leave|status` mengontrol kanal suara (tidak tersedia sebagai teks). `join` memerlukan guild dan kanal suara/stage yang dipilih. Memerlukan `channels.discord.voice` dan perintah native.
    - Perintah pengikatan thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan pengikatan thread efektif untuk diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
    - Referensi perintah ACP dan perilaku runtime: [Agen ACP](/id/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - `/verbose` ditujukan untuk debugging dan visibilitas ekstra; biarkan **nonaktif** dalam penggunaan normal.
    - `/trace` lebih sempit daripada `/verbose`: ini hanya menampilkan baris trace/debug milik Plugin dan menjaga obrolan verbose tool normal tetap nonaktif.
    - `/fast on|off` mempertahankan override sesi. Gunakan opsi `inherit` di UI Sesi untuk menghapusnya dan kembali ke default konfigurasi.
    - `/fast` spesifik penyedia: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses native, sedangkan permintaan publik langsung Anthropic, termasuk trafik yang diautentikasi OAuth dan dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
    - Ringkasan kegagalan tool tetap ditampilkan saat relevan, tetapi teks kegagalan terperinci hanya disertakan saat `/verbose` bernilai `on` atau `full`.
    - `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: semuanya dapat mengungkap reasoning internal, output tool, atau diagnostik Plugin yang tidak Anda maksudkan untuk diekspos. Sebaiknya biarkan nonaktif, terutama dalam chat grup.

  </Accordion>
  <Accordion title="Model switching">
    - `/model` langsung mempertahankan model sesi baru.
    - Jika agen idle, proses berikutnya langsung menggunakannya.
    - Jika proses sudah aktif, OpenClaw menandai peralihan live sebagai tertunda dan hanya memulai ulang ke model baru pada titik retry yang bersih.
    - Jika aktivitas tool atau output balasan sudah dimulai, peralihan tertunda dapat tetap berada dalam antrean sampai peluang retry berikutnya atau giliran pengguna berikutnya.
    - Di TUI lokal, `/crestodian [request]` kembali dari TUI agen normal ke Crestodian. Ini terpisah dari mode penyelamatan kanal pesan dan tidak memberikan otoritas konfigurasi jarak jauh.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **Jalur cepat:** pesan hanya-perintah dari pengirim dalam allowlist ditangani segera (melewati antrean + model).
    - **Gate mention grup:** pesan hanya-perintah dari pengirim dalam allowlist melewati persyaratan mention.
    - **Pintasan inline (hanya pengirim dalam allowlist):** perintah tertentu juga berfungsi saat disematkan dalam pesan normal dan dihapus sebelum model melihat teks tersisa.
      - Contoh: `hey /status` memicu balasan status, dan teks tersisa berlanjut melalui alur normal.
    - Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Pesan hanya-perintah yang tidak diotorisasi diabaikan secara diam-diam, dan token `/...` inline diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **Perintah Skill:** Skills `user-invocable` diekspos sebagai perintah slash. Nama disanitasi menjadi `a-z0-9_` (maks 32 karakter); tabrakan mendapatkan sufiks numerik (mis. `_2`).
      - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna saat batas perintah native mencegah perintah per skill).
      - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
      - Skills dapat secara opsional mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke tool (deterministik, tanpa model).
      - Contoh: `/prose` (Plugin OpenProse) — lihat [OpenProse](/id/prose).
    - **Argumen perintah native:** Discord menggunakan pelengkapan otomatis untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen wajib). Telegram dan Slack menampilkan menu tombol saat sebuah perintah mendukung pilihan dan Anda menghilangkan argumen. Pilihan dinamis diselesaikan terhadap model sesi target, sehingga opsi spesifik model seperti level `/think` mengikuti override `/model` sesi tersebut.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan konfigurasi: **apa yang dapat digunakan agen ini sekarang dalam percakapan ini**.

- `/tools` default ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Permukaan perintah native yang mendukung argumen mengekspos pengalih mode yang sama sebagai `compact|verbose`.
- Hasil bersifat cakupan sesi, jadi mengubah agen, kanal, thread, otorisasi pengirim, atau model dapat mengubah output.
- `/tools` menyertakan tool yang benar-benar dapat dijangkau saat runtime, termasuk tool inti, tool Plugin terhubung, dan tool milik kanal.

Untuk pengeditan profil dan override, gunakan panel Tools UI Kontrol atau permukaan konfigurasi/katalog alih-alih memperlakukan `/tools` sebagai katalog statis.

## Permukaan penggunaan (apa yang muncul di mana)

- **Penggunaan/kuota penyedia** (contoh: "Claude 80% tersisa") muncul di `/status` untuk penyedia model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela penyedia menjadi `% tersisa`; untuk MiniMax, bidang persentase hanya-tersisa dibalik sebelum ditampilkan, dan respons `model_remains` lebih mengutamakan entri model chat plus label paket bertag model.
- **Baris token/cache** di `/status` dapat beralih ke entri penggunaan transkrip terbaru ketika snapshot sesi live kurang lengkap. Nilai live bukan nol yang sudah ada tetap menang, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total berorientasi prompt yang lebih besar ketika total tersimpan hilang atau lebih kecil.
- **Eksekusi vs runtime:** `/status` melaporkan `Execution` untuk jalur sandbox efektif dan `Runtime` untuk pihak yang benar-benar menjalankan sesi: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP.
- **Token/biaya per respons** dikendalikan oleh `/usage off|tokens|full` (ditambahkan ke balasan normal).
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

- `/model` dan `/model list` menampilkan pemilih ringkas bernomor (keluarga model + penyedia yang tersedia).
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan model plus langkah Kirim.
- `/model <#>` memilih dari pemilih tersebut (dan mengutamakan penyedia saat ini bila memungkinkan).
- `/model status` menampilkan tampilan mendetail, termasuk endpoint penyedia yang dikonfigurasi (`baseUrl`) dan mode API (`api`) bila tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override konfigurasi **khusus runtime** (memori, bukan disk). Hanya pemilik. Dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Override langsung berlaku untuk pembacaan konfigurasi baru, tetapi **tidak** menulis ke `openclaw.json`. Gunakan `/debug reset` untuk menghapus semua override dan kembali ke konfigurasi di disk.
</Note>

## Output trace Plugin

`/trace` memungkinkan Anda mengaktifkan atau menonaktifkan **baris trace/debug Plugin yang berlaku per sesi** tanpa mengaktifkan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Catatan:

- `/trace` tanpa argumen menampilkan status trace sesi saat ini.
- `/trace on` mengaktifkan baris trace Plugin untuk sesi saat ini.
- `/trace off` menonaktifkannya kembali.
- Baris trace Plugin dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override konfigurasi khusus runtime.
- `/trace` tidak menggantikan `/verbose`; output alat/status verbose normal tetap menjadi bagian dari `/verbose`.

## Pembaruan konfigurasi

`/config` menulis ke konfigurasi Anda di disk (`openclaw.json`). Hanya pemilik. Dinonaktifkan secara default; aktifkan dengan `commands.config: true`.

Contoh:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Konfigurasi divalidasi sebelum ditulis; perubahan yang tidak valid ditolak. Pembaruan `/config` tetap bertahan setelah restart.
</Note>

## Pembaruan MCP

`/mcp` menulis definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Hanya pemilik. Dinonaktifkan secara default; aktifkan dengan `commands.mcp: true`.

Contoh:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` menyimpan konfigurasi di konfigurasi OpenClaw, bukan pengaturan proyek milik Pi. Adapter runtime menentukan transport mana yang benar-benar dapat dijalankan.
</Note>

## Pembaruan Plugin

`/plugins` memungkinkan operator memeriksa Plugin yang ditemukan dan mengaktifkan atau menonaktifkannya dalam konfigurasi. Alur hanya-baca dapat menggunakan `/plugin` sebagai alias. Dinonaktifkan secara default; aktifkan dengan `commands.plugins: true`.

Contoh:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` dan `/plugins show` menggunakan penemuan Plugin nyata terhadap workspace saat ini plus konfigurasi di disk.
- `/plugins install` menginstal dari ClawHub, npm, git, direktori lokal, dan arsip.
- `/plugins enable|disable` hanya memperbarui konfigurasi Plugin; itu tidak menginstal atau menghapus instalasi Plugin.
- Perubahan aktifkan dan nonaktifkan memuat ulang secara hot-reload permukaan runtime Plugin Gateway untuk giliran agen baru; instalasi meminta restart Gateway karena modul sumber Plugin berubah.

</Note>

## Catatan permukaan

<AccordionGroup>
  <Accordion title="Sesi per permukaan">
    - **Perintah teks** berjalan dalam sesi chat normal (DM berbagi `main`, grup memiliki sesinya sendiri).
    - **Perintah native** menggunakan sesi terisolasi:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
    - **`/stop`** menargetkan sesi chat aktif agar dapat membatalkan proses saat ini.

  </Accordion>
  <Accordion title="Khusus Slack">
    `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu perintah slash Slack untuk setiap perintah bawaan (nama yang sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.

    Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.

  </Accordion>
</AccordionGroup>

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini.

Tidak seperti chat normal:

- itu menggunakan sesi saat ini sebagai konteks latar belakang,
- itu berjalan sebagai panggilan sekali jalan **tanpa alat** yang terpisah,
- itu tidak mengubah konteks sesi berikutnya,
- itu tidak ditulis ke riwayat transkrip,
- itu dikirim sebagai hasil sampingan live, bukan sebagai pesan asisten normal.

Itu membuat `/btw` berguna ketika Anda menginginkan klarifikasi sementara sementara tugas utama terus berjalan.

Contoh:

```text
/btw what are we doing right now?
```

Lihat [Pertanyaan Sampingan BTW](/id/tools/btw) untuk perilaku lengkap dan detail UX klien.

## Terkait

- [Membuat skills](/id/tools/creating-skills)
- [Skills](/id/tools/skills)
- [Konfigurasi Skills](/id/tools/skills-config)
