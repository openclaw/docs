---
read_when:
    - Menggunakan atau mengonfigurasi perintah obrolan
    - Men-debug perutean perintah atau izin
sidebarTitle: Slash commands
summary: 'Perintah garis miring: teks vs bawaan, konfigurasi, dan perintah yang didukung'
title: Perintah garis miring
x-i18n:
    generated_at: "2026-05-02T09:35:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a00619cc0eff25b81b475eab5b0b3d808bf067e6e004a491a90ec3982149b7
    source_path: tools/slash-commands.md
    workflow: 16
---

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang diawali dengan `/`. Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Saat percakapan atau thread terikat ke sesi ACP, teks tindak lanjut normal dirutekan ke harness ACP tersebut. Perintah manajemen Gateway tetap lokal: `/acp ...` selalu mencapai penangan perintah ACP OpenClaw, dan `/status` serta `/unfocus` tetap lokal setiap kali penanganan perintah diaktifkan untuk surface tersebut.

Ada dua sistem terkait:

<AccordionGroup>
  <Accordion title="Commands">
    Pesan `/...` mandiri.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Direktif dihapus dari pesan sebelum model melihatnya.
    - Dalam pesan chat normal (bukan hanya direktif), direktif diperlakukan sebagai "petunjuk inline" dan **tidak** mempertahankan pengaturan sesi.
    - Dalam pesan hanya direktif (pesan hanya berisi direktif), direktif dipertahankan ke sesi dan membalas dengan pengakuan.
    - Direktif hanya diterapkan untuk **pengirim yang berwenang**. Jika `commands.allowFrom` ditetapkan, itu adalah satu-satunya allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing channel plus `commands.useAccessGroups`. Pengirim yang tidak berwenang melihat direktif diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Hanya pengirim yang ada dalam allowlist/berwenang: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Perintah ini langsung berjalan, dihapus sebelum model melihat pesan, dan teks yang tersisa berlanjut melalui alur normal.

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
  Mengaktifkan parsing `/...` dalam pesan chat. Pada surface tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi meskipun Anda menetapkan ini ke `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah native. Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (hingga Anda menambahkan slash command); diabaikan untuk penyedia tanpa dukungan native. Tetapkan `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk mengganti per penyedia (bool atau `"auto"`). `false` menghapus perintah yang sebelumnya terdaftar di Discord/Telegram saat startup. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
</ParamField>
Di Discord, spesifikasi perintah native dapat menyertakan `descriptionLocalizations`, yang dipublikasikan OpenClaw sebagai `description_localizations` Discord dan disertakan dalam perbandingan rekonsiliasi.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah **skill** secara native saat didukung. Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack memerlukan pembuatan slash command per skill). Tetapkan `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk mengganti per penyedia (bool atau `"auto"`).
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
  Mengaktifkan `/plugins` (penemuan/status Plugin plus kontrol instal + aktifkan/nonaktifkan).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Mengaktifkan `/debug` (override hanya runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Mengaktifkan `/restart` plus tindakan alat restart gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Menetapkan allowlist owner eksplisit untuk surface perintah/alat khusus owner. Ini adalah akun operator manusia yang dapat menyetujui tindakan berbahaya dan menjalankan perintah seperti `/diagnostics`, `/export-trajectory`, dan `/config`. Ini terpisah dari `commands.allowFrom` dan dari akses pairing DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per channel: membuat perintah khusus owner mensyaratkan **identitas owner** agar dapat berjalan pada surface tersebut. Saat `true`, pengirim harus cocok dengan kandidat owner yang berhasil di-resolve (misalnya entri dalam `commands.ownerAllowFrom` atau metadata owner native penyedia) atau memiliki scope internal `operator.admin` pada channel pesan internal. Entri wildcard dalam `allowFrom` channel, atau daftar kandidat owner yang kosong/tidak ter-resolve, **tidak** cukup — perintah khusus owner gagal tertutup pada channel tersebut. Biarkan ini nonaktif jika Anda ingin perintah khusus owner hanya dibatasi oleh `ownerAllowFrom` dan allowlist perintah standar.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Mengontrol bagaimana id owner muncul dalam prompt sistem.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Secara opsional menetapkan secret HMAC yang digunakan saat `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per penyedia untuk otorisasi perintah. Saat dikonfigurasi, ini adalah satu-satunya sumber otorisasi untuk perintah dan direktif (allowlist/pairing channel dan `commands.useAccessGroups` diabaikan). Gunakan `"*"` untuk default global; key khusus penyedia menggantikannya.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Menerapkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak ditetapkan.
</ParamField>

## Daftar perintah

Sumber kebenaran saat ini:

- bawaan inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah Plugin berasal dari panggilan `registerCommand()` Plugin
- ketersediaan aktual pada gateway Anda tetap bergantung pada flag konfigurasi, surface channel, dan Plugin yang terinstal/diaktifkan

### Perintah bawaan inti

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
    - `/reset soft [message]` mempertahankan transkrip saat ini, membuang id sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/system-prompt di tempat.
    - `/compact [instructions]` memadatkan konteks sesi. Lihat [Compaction](/id/concepts/compaction).
    - `/stop` membatalkan run saat ini.
    - `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa pengikatan thread.
    - `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
    - `/export-trajectory [path]` meminta persetujuan exec, lalu mengekspor [trajectory bundle](/id/tools/trajectory) JSONL untuk sesi saat ini. Gunakan saat Anda membutuhkan timeline prompt, alat, dan transkrip untuk satu sesi OpenClaw. Dalam chat grup, prompt persetujuan dan hasil ekspor dikirim ke owner secara privat. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` menetapkan level berpikir. Opsi berasal dari profil penyedia model aktif; level umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan level kustom seperti `xhigh`, `adaptive`, `max`, atau biner `on` hanya jika didukung. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` mengaktifkan/menonaktifkan output verbose. Alias: `/v`.
    - `/trace on|off` mengaktifkan/menonaktifkan output trace Plugin untuk sesi saat ini.
    - `/fast [status|on|off]` menampilkan atau menetapkan mode cepat.
    - `/reasoning [on|off|stream]` mengaktifkan/menonaktifkan visibilitas penalaran. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` mengaktifkan/menonaktifkan mode elevated. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau menetapkan default exec.
    - `/model [name|#|status]` menampilkan atau menetapkan model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan penyedia yang dikonfigurasi/tersedia autentikasinya atau model untuk suatu penyedia; tambahkan `all` untuk menjelajahi katalog lengkap penyedia tersebut.
    - `/queue <mode>` mengelola perilaku queue (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus opsi seperti `debounce:0.5s cap:25 drop:summarize`; `/queue default` atau `/queue reset` menghapus override sesi. Lihat [Command queue](/id/concepts/queue) dan [Steering queue](/id/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` menampilkan ringkasan bantuan singkat.
    - `/commands` menampilkan katalog perintah yang dihasilkan.
    - `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agen saat ini sekarang.
    - `/status` menampilkan status eksekusi/runtime, termasuk label `Execution`/`Runtime` dan penggunaan/kuota penyedia jika tersedia.
    - `/diagnostics [note]` adalah alur laporan dukungan khusus owner untuk bug Gateway dan run harness Codex. Ini meminta persetujuan exec eksplisit setiap kali sebelum menjalankan `openclaw gateway diagnostics export --json`; jangan setujui diagnostik dengan aturan allow-all. Setelah disetujui, ini mengirim laporan yang dapat ditempel dengan path bundle lokal, ringkasan manifes, catatan privasi, dan id sesi yang relevan. Dalam chat grup, prompt persetujuan dan laporan dikirim ke owner secara privat. Saat sesi aktif menggunakan harness OpenAI Codex, persetujuan yang sama juga mengirim feedback Codex yang relevan ke server OpenAI dan balasan selesai mencantumkan id sesi OpenClaw, id thread Codex, dan perintah `codex resume <thread-id>`. Lihat [Diagnostics Export](/id/gateway/diagnostics).
    - `/crestodian <request>` menjalankan pembantu penyiapan dan perbaikan Crestodian dari DM owner.
    - `/tasks` mencantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini.
    - `/context [list|detail|json]` menjelaskan bagaimana konteks disusun.
    - `/whoami` menampilkan id pengirim Anda. Alias: `/id`.
    - `/usage off|tokens|full|cost` mengontrol footer penggunaan per respons atau mencetak ringkasan biaya lokal.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` menjalankan skill berdasarkan nama.
    - `/allowlist [list|add|remove] ...` mengelola entri allowlist. Hanya teks.
    - `/approve <id> <decision>` menyelesaikan prompt persetujuan exec.
    - `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi mendatang. Lihat [BTW](/id/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` mengelola run sub-agen untuk sesi saat ini.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
    - `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
    - `/unfocus` menghapus binding saat ini.
    - `/agents` mencantumkan agen yang terikat thread untuk sesi saat ini.
    - `/kill <id|#|all>` membatalkan satu atau semua sub-agen yang sedang berjalan.
    - `/steer <id|#> <message>` mengirim arahan ke sub-agen yang sedang berjalan. Alias: `/tell`.

  </Accordion>
  <Accordion title="Penulisan khusus pemilik dan admin">
    - `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Khusus pemilik. Memerlukan `commands.config: true`.
    - `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus pemilik. Memerlukan `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau mengubah status Plugin. `/plugin` adalah alias. Khusus pemilik untuk penulisan. Memerlukan `commands.plugins: true`.
    - `/debug show|set|unset|reset` mengelola override konfigurasi khusus waktu jalan. Khusus pemilik. Memerlukan `commands.debug: true`.
    - `/restart` memulai ulang OpenClaw saat diaktifkan. Bawaan: diaktifkan; atur `commands.restart: false` untuk menonaktifkannya.
    - `/send on|off|inherit` mengatur kebijakan pengiriman. Khusus pemilik.

  </Accordion>
  <Accordion title="Suara, TTS, kontrol kanal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` mengontrol TTS. Lihat [TTS](/id/tools/tts).
    - `/activation mention|always` mengatur mode aktivasi grup.
    - `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` ditambah daftar izin `tools.elevated`.
    - `!poll [sessionId]` memeriksa tugas bash latar belakang.
    - `!stop [sessionId]` menghentikan tugas bash latar belakang.

  </Accordion>
</AccordionGroup>

### Perintah dock yang dihasilkan

Perintah dock mengalihkan rute balasan sesi saat ini ke kanal tertaut lain.
Lihat [Docking kanal](/id/concepts/channel-docking) untuk penyiapan,
contoh, dan pemecahan masalah.

Perintah dock dihasilkan dari Plugin kanal dengan dukungan perintah asli. Set bawaan saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Gunakan perintah dock dari chat langsung untuk mengalihkan rute balasan sesi saat ini ke kanal tertaut lain. Agen mempertahankan konteks sesi yang sama, tetapi balasan berikutnya untuk sesi tersebut dikirimkan ke peer kanal yang dipilih.

Perintah dock memerlukan `session.identityLinks`. Pengirim sumber dan peer target harus berada dalam grup identitas yang sama, misalnya `["telegram:123", "discord:456"]`. Jika pengguna Telegram dengan id `123` mengirim `/dock_discord`, OpenClaw menyimpan `lastChannel: "discord"` dan `lastTo: "456"` pada sesi aktif. Jika pengirim tidak tertaut ke peer Discord, perintah membalas dengan petunjuk penyiapan alih-alih diteruskan ke chat normal.

Docking hanya mengubah rute sesi aktif. Ini tidak membuat akun kanal, memberikan akses, melewati daftar izin kanal, atau memindahkan riwayat transkrip ke sesi lain. Gunakan `/dock-telegram`, `/dock-slack`, `/dock-mattermost`, atau perintah dock lain yang dihasilkan untuk mengalihkan rute lagi.

### Perintah Plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak perintah slash. Perintah bawaan saat ini di repositori ini:

- `/dreaming [on|off|status|help]` menyalakan/mematikan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur penyandingan/penyiapan perangkat. Lihat [Penyandingan](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` mengaktifkan sementara perintah Node ponsel berisiko tinggi.
- `/voice status|list [limit]|set <voiceId|name>` mengelola konfigurasi suara Talk. Di Discord, nama perintah asli adalah `/talkvoice`.
- `/card ...` mengirim preset rich card LINE. Lihat [LINE](/id/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` memeriksa dan mengontrol harness server aplikasi Codex bawaan. Lihat [harness Codex](/id/plugins/codex-harness).
- Perintah khusus QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Perintah skill dinamis

Skills yang dapat dipanggil pengguna juga diekspos sebagai perintah slash:

- `/skill <name> [input]` selalu berfungsi sebagai titik masuk generik.
- Skills juga dapat muncul sebagai perintah langsung seperti `/prose` ketika skill/Plugin mendaftarkannya.
- pendaftaran perintah skill asli dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.
- spesifikasi perintah dapat menyediakan `descriptionLocalizations` untuk antarmuka asli yang mendukung deskripsi terlokalisasi, termasuk Discord.

<AccordionGroup>
  <Accordion title="Catatan argumen dan parser">
    - Perintah menerima `:` opsional antara perintah dan argumen (mis. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` menerima alias model, `provider/model`, atau nama penyedia (pencocokan fuzzy); jika tidak ada kecocokan, teks diperlakukan sebagai isi pesan.
    - Untuk rincian penggunaan penyedia lengkap, gunakan `openclaw status --usage`.
    - `/allowlist add|remove` memerlukan `commands.config=true` dan mematuhi `configWrites` kanal.
    - Pada kanal multi-akun, `/allowlist --account <id>` yang menargetkan konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga mematuhi `configWrites` akun target.
    - `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
    - `/restart` diaktifkan secara bawaan; atur `commands.restart: false` untuk menonaktifkannya.
    - `/plugins install <spec>` menerima spesifikasi Plugin yang sama dengan `openclaw plugins install`: path/arsip lokal, paket npm, `git:<repo>`, atau `clawhub:<pkg>`.
    - `/plugins enable|disable` memperbarui konfigurasi Plugin dan dapat meminta mulai ulang.

  </Accordion>
  <Accordion title="Perilaku khusus kanal">
    - Perintah asli khusus Discord: `/vc join|leave|status` mengontrol kanal suara (tidak tersedia sebagai teks). `join` memerlukan guild dan kanal suara/stage yang dipilih. Memerlukan `channels.discord.voice` dan perintah asli.
    - Perintah pengikatan thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) mengharuskan pengikatan thread efektif diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
    - Referensi perintah ACP dan perilaku waktu jalan: [agen ACP](/id/tools/acp-agents).

  </Accordion>
  <Accordion title="Keamanan verbose / trace / fast / reasoning">
    - `/verbose` ditujukan untuk pemecahan masalah dan visibilitas ekstra; biarkan tetap **off** dalam penggunaan normal.
    - `/trace` lebih sempit daripada `/verbose`: ini hanya mengungkap baris trace/debug milik Plugin dan membuat keluaran alat verbose normal tetap nonaktif.
    - `/fast on|off` menyimpan override sesi. Gunakan opsi `inherit` di UI Sesi untuk menghapusnya dan kembali ke bawaan konfigurasi.
    - `/fast` bersifat khusus penyedia: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses asli, sementara permintaan Anthropic publik langsung, termasuk lalu lintas yang diautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
    - Ringkasan kegagalan alat tetap ditampilkan jika relevan, tetapi teks kegagalan terperinci hanya disertakan ketika `/verbose` bernilai `on` atau `full`.
    - `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: perintah tersebut dapat mengungkap penalaran internal, output alat, atau diagnostik Plugin yang tidak Anda maksudkan untuk diekspos. Sebaiknya biarkan nonaktif, terutama di chat grup.

  </Accordion>
  <Accordion title="Peralihan model">
    - `/model` langsung menyimpan model sesi baru.
    - Jika agen tidak aktif, run berikutnya langsung menggunakannya.
    - Jika run sudah aktif, OpenClaw menandai peralihan langsung sebagai tertunda dan hanya memulai ulang ke model baru pada titik percobaan ulang yang bersih.
    - Jika aktivitas alat atau output balasan sudah dimulai, peralihan yang tertunda dapat tetap antre hingga kesempatan percobaan ulang berikutnya atau giliran pengguna berikutnya.
    - Di TUI lokal, `/crestodian [request]` kembali dari TUI agen normal ke Crestodian. Ini terpisah dari mode penyelamatan kanal pesan dan tidak memberikan otoritas konfigurasi jarak jauh.

  </Accordion>
  <Accordion title="Jalur cepat dan pintasan sebaris">
    - **Jalur cepat:** pesan yang hanya berisi perintah dari pengirim dalam daftar izin ditangani langsung (melewati antrean + model).
    - **Pembatasan mention grup:** pesan yang hanya berisi perintah dari pengirim dalam daftar izin melewati persyaratan mention.
    - **Pintasan sebaris (hanya pengirim dalam daftar izin):** perintah tertentu juga berfungsi ketika disematkan dalam pesan normal dan dihapus sebelum model melihat teks yang tersisa.
      - Contoh: `hey /status` memicu balasan status, dan teks yang tersisa berlanjut melalui alur normal.
    - Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Pesan yang hanya berisi perintah dari pihak tidak berwenang diabaikan secara senyap, dan token `/...` sebaris diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Perintah Skill dan argumen asli">
    - **Perintah Skill:** Skills `user-invocable` diekspos sebagai perintah slash. Nama disanitasi menjadi `a-z0-9_` (maks 32 karakter); bentrokan mendapatkan sufiks numerik (mis. `_2`).
      - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna ketika batas perintah asli mencegah perintah per-skill).
      - Secara bawaan, perintah skill diteruskan ke model sebagai permintaan normal.
      - Skills dapat secara opsional mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke alat (deterministik, tanpa model).
      - Contoh: `/prose` (Plugin OpenProse) — lihat [OpenProse](/id/prose).
    - **Argumen perintah asli:** Discord menggunakan pelengkapan otomatis untuk opsi dinamis (dan menu tombol ketika Anda menghilangkan argumen wajib). Telegram dan Slack menampilkan menu tombol ketika perintah mendukung pilihan dan Anda menghilangkan argumen. Pilihan dinamis diselesaikan terhadap model sesi target, sehingga opsi khusus model seperti level `/think` mengikuti override `/model` sesi tersebut.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` menjawab pertanyaan waktu jalan, bukan pertanyaan konfigurasi: **apa yang dapat digunakan agen ini saat ini dalam percakapan ini**.

- `/tools` bawaan bersifat ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Antarmuka perintah asli yang mendukung argumen mengekspos pengalih mode yang sama sebagai `compact|verbose`.
- Hasil dicakup per sesi, sehingga mengubah agen, kanal, thread, otorisasi pengirim, atau model dapat mengubah output.
- `/tools` mencakup alat yang benar-benar dapat dijangkau saat waktu jalan, termasuk alat inti, alat Plugin yang terhubung, dan alat milik kanal.

Untuk pengeditan profil dan override, gunakan panel Alat di UI Kontrol atau antarmuka konfigurasi/katalog alih-alih memperlakukan `/tools` sebagai katalog statis.

## Permukaan penggunaan (apa yang muncul di mana)

- **Penggunaan/kuota penyedia** (contoh: "Claude 80% tersisa") muncul di `/status` untuk penyedia model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela penyedia menjadi `% left`; untuk MiniMax, field persentase yang hanya menunjukkan sisa dibalik sebelum ditampilkan, dan respons `model_remains` memprioritaskan entri model chat plus label paket yang diberi tag model.
- **Baris token/cache** di `/status` dapat kembali menggunakan entri penggunaan transkrip terbaru ketika snapshot sesi live kurang lengkap. Nilai live bukan nol yang sudah ada tetap didahulukan, dan cadangan transkrip juga dapat memulihkan label model waktu jalan aktif plus total berorientasi prompt yang lebih besar ketika total tersimpan hilang atau lebih kecil.
- **Eksekusi vs waktu jalan:** `/status` melaporkan `Execution` untuk path sandbox efektif dan `Runtime` untuk siapa yang sebenarnya menjalankan sesi: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP.
- **Token/biaya per respons** dikontrol oleh `/usage off|tokens|full` (ditambahkan ke balasan normal).
- `/model status` membahas **model/autentikasi/endpoint**, bukan penggunaan.

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
- `/model <#>` memilih dari pemilih tersebut (dan mengutamakan penyedia saat ini jika memungkinkan).
- `/model status` menampilkan tampilan terperinci, termasuk endpoint penyedia yang dikonfigurasi (`baseUrl`) dan mode API (`api`) jika tersedia.

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

`/trace` memungkinkan Anda mengaktifkan atau menonaktifkan **baris trace/debug plugin bercakupan sesi** tanpa mengaktifkan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Catatan:

- `/trace` tanpa argumen menampilkan status trace sesi saat ini.
- `/trace on` mengaktifkan baris trace plugin untuk sesi saat ini.
- `/trace off` menonaktifkannya lagi.
- Baris trace Plugin dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override konfigurasi khusus runtime.
- `/trace` tidak menggantikan `/verbose`; output alat/status verbose normal tetap berada di `/verbose`.

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
Konfigurasi divalidasi sebelum ditulis; perubahan tidak valid ditolak. Pembaruan `/config` bertahan setelah restart.
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
`/mcp` menyimpan konfigurasi di konfigurasi OpenClaw, bukan pengaturan proyek milik Pi. Adapter runtime menentukan transport mana yang benar-benar dapat dieksekusi.
</Note>

## Pembaruan Plugin

`/plugins` memungkinkan operator memeriksa plugin yang ditemukan dan mengaktifkan atau menonaktifkan enablement dalam konfigurasi. Alur baca-saja dapat menggunakan `/plugin` sebagai alias. Dinonaktifkan secara default; aktifkan dengan `commands.plugins: true`.

Contoh:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` dan `/plugins show` menggunakan discovery plugin nyata terhadap workspace saat ini plus konfigurasi di disk.
- `/plugins enable|disable` hanya memperbarui konfigurasi plugin; ini tidak menginstal atau menghapus instalasi plugin.
- Setelah perubahan enable/disable, restart gateway untuk menerapkannya.

</Note>

## Catatan permukaan

<AccordionGroup>
  <Accordion title="Sesi per permukaan">
    - **Perintah teks** berjalan dalam sesi chat normal (DM berbagi `main`, grup memiliki sesi sendiri).
    - **Perintah native** menggunakan sesi terisolasi:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
    - **`/stop`** menargetkan sesi chat aktif sehingga dapat membatalkan run saat ini.

  </Accordion>
  <Accordion title="Detail khusus Slack">
    `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu perintah slash Slack per perintah bawaan (nama yang sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.

    Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi di pesan Slack.

  </Accordion>
</AccordionGroup>

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini.

Tidak seperti chat normal:

- ini menggunakan sesi saat ini sebagai konteks latar belakang,
- ini berjalan sebagai panggilan sekali jalan **tanpa alat** yang terpisah,
- ini tidak mengubah konteks sesi mendatang,
- ini tidak ditulis ke riwayat transkrip,
- ini dikirim sebagai hasil sampingan langsung alih-alih pesan asisten normal.

Hal itu membuat `/btw` berguna saat Anda menginginkan klarifikasi sementara sementara tugas utama terus berjalan.

Contoh:

```text
/btw what are we doing right now?
```

Lihat [Pertanyaan Sampingan BTW](/id/tools/btw) untuk perilaku lengkap dan detail UX klien.

## Terkait

- [Membuat Skills](/id/tools/creating-skills)
- [Skills](/id/tools/skills)
- [Konfigurasi Skills](/id/tools/skills-config)
