---
read_when:
    - Menggunakan atau mengonfigurasi perintah obrolan
    - Mendiagnosis perutean perintah atau izin
sidebarTitle: Slash commands
summary: 'Perintah garis miring: teks versus asli, konfigurasi, dan perintah yang didukung'
title: Perintah garis miring
x-i18n:
    generated_at: "2026-05-11T20:37:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a9030d88abd04c395369f8f6587632b53f3249ea95a26726fb1f165dae2d0f6
    source_path: tools/slash-commands.md
    workflow: 16
---

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`. Perintah obrolan bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ketika percakapan atau utas terikat ke sesi ACP, teks tindak lanjut normal diarahkan ke harness ACP tersebut. Perintah pengelolaan Gateway tetap lokal: `/acp ...` selalu mencapai penangan perintah ACP OpenClaw, dan `/status` serta `/unfocus` tetap lokal setiap kali penanganan perintah diaktifkan untuk permukaan tersebut.

Ada dua sistem terkait:

<AccordionGroup>
  <Accordion title="Perintah">
    Pesan `/...` mandiri.
  </Accordion>
  <Accordion title="Direktif">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Direktif dihapus dari pesan sebelum model melihatnya.
    - Dalam pesan obrolan normal (bukan hanya direktif), direktif diperlakukan sebagai "petunjuk inline" dan **tidak** mempertahankan pengaturan sesi.
    - Dalam pesan hanya direktif (pesan hanya berisi direktif), direktif dipertahankan ke sesi dan membalas dengan pengakuan.
    - Direktif hanya diterapkan untuk **pengirim yang diotorisasi**. Jika `commands.allowFrom` diatur, itu adalah satu-satunya daftar izinkan yang digunakan; jika tidak, otorisasi berasal dari daftar izinkan/pemasangan kanal ditambah `commands.useAccessGroups`. Pengirim yang tidak diotorisasi melihat direktif diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Pintasan inline">
    Hanya pengirim dalam daftar izinkan/terotorisasi: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Pintasan ini langsung berjalan, dihapus sebelum model melihat pesan, dan teks yang tersisa berlanjut melalui alur normal.

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
  Mengaktifkan penguraian `/...` dalam pesan obrolan. Pada permukaan tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi meskipun Anda mengaturnya ke `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah native. Otomatis: aktif untuk Discord/Telegram; nonaktif untuk Slack (hingga Anda menambahkan perintah garis miring); diabaikan untuk penyedia tanpa dukungan native. Atur `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk mengganti per penyedia (bool atau `"auto"`). Pada Discord, `false` melewati pendaftaran dan pembersihan perintah garis miring saat startup; perintah yang sebelumnya terdaftar mungkin tetap terlihat hingga Anda menghapusnya dari aplikasi Discord. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
</ParamField>
Pada Discord, spesifikasi perintah native dapat menyertakan `descriptionLocalizations`, yang dipublikasikan OpenClaw sebagai `description_localizations` Discord dan disertakan dalam perbandingan rekonsiliasi.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah **skill** secara native ketika didukung. Otomatis: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack mengharuskan pembuatan perintah garis miring per skill). Atur `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk mengganti per penyedia (bool atau `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan daftar izinkan `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Mengontrol berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung masuk latar belakang).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Mengaktifkan `/config` (membaca/menulis `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Mengaktifkan `/plugins` (penemuan/status Plugin serta kontrol instal + aktifkan/nonaktifkan).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Mengaktifkan `/debug` (override khusus runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Mengaktifkan `/restart` ditambah aksi alat restart gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Mengatur daftar izinkan owner eksplisit untuk permukaan perintah/alat khusus owner. Ini adalah akun operator manusia yang dapat menyetujui aksi berbahaya dan menjalankan perintah seperti `/diagnostics`, `/export-trajectory`, dan `/config`. Ini terpisah dari `commands.allowFrom` dan dari akses pemasangan DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanal: membuat perintah khusus owner memerlukan **identitas owner** untuk berjalan pada permukaan tersebut. Ketika `true`, pengirim harus cocok dengan kandidat owner yang terselesaikan (misalnya entri di `commands.ownerAllowFrom` atau metadata owner native penyedia) atau memiliki cakupan internal `operator.admin` pada kanal pesan internal. Entri wildcard di `allowFrom` kanal, atau daftar kandidat owner yang kosong/tidak terselesaikan, **tidak** cukup — perintah khusus owner gagal tertutup pada kanal tersebut. Biarkan ini nonaktif jika Anda ingin perintah khusus owner hanya dibatasi oleh `ownerAllowFrom` dan daftar izinkan perintah standar.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Mengontrol bagaimana id owner muncul dalam prompt sistem.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Secara opsional mengatur rahasia HMAC yang digunakan ketika `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Daftar izinkan per penyedia untuk otorisasi perintah. Ketika dikonfigurasi, ini adalah satu-satunya sumber otorisasi untuk perintah dan direktif (daftar izinkan/pemasangan kanal serta `commands.useAccessGroups` diabaikan). Gunakan `"*"` untuk default global; kunci khusus penyedia menggantikannya.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Menerapkan daftar izinkan/kebijakan untuk perintah ketika `commands.allowFrom` tidak diatur.
</ParamField>

## Daftar perintah

Sumber kebenaran saat ini:

- bawaan inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah Plugin berasal dari panggilan `registerCommand()` Plugin
- ketersediaan aktual pada gateway Anda tetap bergantung pada flag konfigurasi, permukaan kanal, dan Plugin yang diinstal/diaktifkan

### Perintah bawaan inti

<AccordionGroup>
  <Accordion title="Sesi dan run">
    - `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
    - UI Kontrol mencegat `/new` yang diketik untuk membuat dan beralih ke sesi dasbor baru, kecuali ketika `session.dmScope: "main"` dikonfigurasi dan induk saat ini adalah sesi utama agen; dalam kasus itu `/new` mereset sesi utama di tempat. `/reset` yang diketik tetap menjalankan reset di tempat milik Gateway.
    - `/reset soft [message]` mempertahankan transkrip saat ini, menghapus id sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/prompt sistem di tempat.
    - `/compact [instructions]` memadatkan konteks sesi. Lihat [Compaction](/id/concepts/compaction).
    - `/stop` membatalkan run saat ini.
    - `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa pengikatan utas.
    - `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
    - `/export-trajectory [path]` meminta persetujuan exec, lalu mengekspor [bundel trajectory](/id/tools/trajectory) JSONL untuk sesi saat ini. Gunakan saat Anda membutuhkan linimasa prompt, alat, dan transkrip untuk satu sesi OpenClaw. Dalam obrolan grup, prompt persetujuan dan hasil ekspor dikirim secara privat ke owner. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model dan kontrol run">
    - `/think <level|default>` mengatur tingkat berpikir atau menghapus override sesi. Opsi berasal dari profil penyedia model aktif; tingkat umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan tingkat khusus seperti `xhigh`, `adaptive`, `max`, atau biner `on` hanya jika didukung. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` mengaktifkan/menonaktifkan keluaran verbose. Alias: `/v`.
    - `/trace on|off` mengaktifkan/menonaktifkan keluaran trace Plugin untuk sesi saat ini.
    - `/fast [status|on|off|default]` menampilkan, mengatur, atau menghapus mode cepat.
    - `/reasoning [on|off|stream]` mengaktifkan/menonaktifkan visibilitas reasoning. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` mengaktifkan/menonaktifkan mode elevated. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau mengatur default exec.
    - `/model [name|#|status]` menampilkan atau mengatur model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan penyedia yang dikonfigurasi/tersedia auth atau model untuk suatu penyedia; tambahkan `all` untuk menelusuri katalog penuh penyedia tersebut. Entri `provider/*` di `agents.defaults.models` membuat `/model` dan `/models` hanya menampilkan model yang ditemukan untuk penyedia tersebut.
    - `/queue <mode>` mengelola perilaku antrean (`steer`, `queue` lama, `followup`, `collect`, `steer-backlog`, `interrupt`) ditambah opsi seperti `debounce:0.5s cap:25 drop:summarize`; `/queue default` atau `/queue reset` menghapus override sesi. Lihat [Antrean perintah](/id/concepts/queue) dan [Antrean steering](/id/concepts/queue-steering).
    - `/steer <message>` menyuntikkan panduan ke run aktif untuk sesi saat ini, terlepas dari mode `/queue`. Ini tidak memulai run baru ketika sesi sedang idle. Alias: `/tell`. Lihat [Steer](/id/tools/steer).

  </Accordion>
  <Accordion title="Penemuan dan status">
    - `/help` menampilkan ringkasan bantuan singkat.
    - `/commands` menampilkan katalog perintah yang dihasilkan.
    - `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agen saat ini sekarang.
    - `/status` menampilkan status eksekusi/runtime, uptime Gateway dan sistem, serta penggunaan/kuota penyedia jika tersedia.
    - `/diagnostics [note]` adalah alur laporan dukungan khusus owner untuk bug Gateway dan run harness Codex. Ini meminta persetujuan exec eksplisit setiap kali sebelum menjalankan `openclaw gateway diagnostics export --json`; jangan menyetujui diagnostik dengan aturan izinkan-semua. Setelah persetujuan, ini mengirim laporan yang dapat ditempel dengan path bundel lokal, ringkasan manifes, catatan privasi, dan id sesi terkait. Dalam obrolan grup, prompt persetujuan dan laporan dikirim secara privat ke owner. Ketika sesi aktif menggunakan harness OpenAI Codex, persetujuan yang sama juga mengirim umpan balik Codex terkait ke server OpenAI dan balasan selesai mencantumkan id sesi OpenClaw, id utas Codex, dan perintah `codex resume <thread-id>`. Lihat [Ekspor Diagnostik](/id/gateway/diagnostics).
    - `/crestodian <request>` menjalankan pembantu penyiapan dan perbaikan Crestodian dari DM owner.
    - `/tasks` mencantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini.
    - `/context [list|detail|map|json]` menjelaskan bagaimana konteks disusun. `map` mengirim gambar treemap konteks sesi saat ini.
    - `/whoami` menampilkan id pengirim Anda. Alias: `/id`.
    - `/usage off|tokens|full|cost` mengontrol footer penggunaan per respons atau mencetak ringkasan biaya lokal.

  </Accordion>
  <Accordion title="Skills, daftar izin, persetujuan">
    - `/skill <name> [input]` menjalankan skill berdasarkan nama.
    - `/allowlist [list|add|remove] ...` mengelola entri daftar izin. Hanya teks.
    - `/approve <id> <decision>` menyelesaikan prompt persetujuan exec.
    - `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi mendatang. Alias: `/side`. Lihat [BTW](/id/tools/btw).

  </Accordion>
  <Accordion title="Subagen dan ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` mengelola proses subagen untuk sesi saat ini.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
    - `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
    - `/unfocus` menghapus pengikatan saat ini.
    - `/agents` mencantumkan agen yang terikat ke thread untuk sesi saat ini.
    - `/kill <id|#|all>` membatalkan satu atau semua subagen yang sedang berjalan.
    - `/subagents steer <id|#> <message>` mengirim arahan ke subagen yang sedang berjalan. Lihat [Steer](/id/tools/steer).

  </Accordion>
  <Accordion title="Penulisan khusus pemilik dan admin">
    - `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Hanya pemilik. Memerlukan `commands.config: true`.
    - `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Hanya pemilik. Memerlukan `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau mengubah status Plugin. `/plugin` adalah alias. Penulisan hanya untuk pemilik. Memerlukan `commands.plugins: true`.
    - `/debug show|set|unset|reset` mengelola override konfigurasi khusus runtime. Hanya pemilik. Memerlukan `commands.debug: true`.
    - `/restart` memulai ulang OpenClaw saat diaktifkan. Default: aktif; setel `commands.restart: false` untuk menonaktifkannya.
    - `/send on|off|inherit` menetapkan kebijakan pengiriman. Hanya pemilik.

  </Accordion>
  <Accordion title="Suara, TTS, kontrol kanal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` mengontrol TTS. Lihat [TTS](/id/tools/tts).
    - `/activation mention|always` menetapkan mode aktivasi grup.
    - `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` ditambah daftar izin `tools.elevated`.
    - `!poll [sessionId]` memeriksa pekerjaan bash latar belakang.
    - `!stop [sessionId]` menghentikan pekerjaan bash latar belakang.

  </Accordion>
</AccordionGroup>

### Perintah dock yang dihasilkan

Perintah dock mengalihkan rute balasan sesi saat ini ke kanal tertaut lain. Lihat [Channel docking](/id/concepts/channel-docking) untuk penyiapan,
contoh, dan pemecahan masalah.

Perintah dock dihasilkan dari Plugin kanal dengan dukungan perintah native. Set bawaan saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Gunakan perintah dock dari chat langsung untuk mengalihkan rute balasan sesi saat ini ke kanal tertaut lain. Agen mempertahankan konteks sesi yang sama, tetapi balasan mendatang untuk sesi tersebut dikirim ke peer kanal yang dipilih.

Perintah dock memerlukan `session.identityLinks`. Pengirim sumber dan peer target harus berada dalam grup identitas yang sama, misalnya `["telegram:123", "discord:456"]`. Jika pengguna Telegram dengan id `123` mengirim `/dock_discord`, OpenClaw menyimpan `lastChannel: "discord"` dan `lastTo: "456"` pada sesi aktif. Jika pengirim tidak tertaut ke peer Discord, perintah membalas dengan petunjuk penyiapan alih-alih meneruskannya ke chat normal.

Docking hanya mengubah rute sesi aktif. Ini tidak membuat akun kanal, memberikan akses, melewati daftar izin kanal, atau memindahkan riwayat transkrip ke sesi lain. Gunakan `/dock-telegram`, `/dock-slack`, `/dock-mattermost`, atau perintah dock lain yang dihasilkan untuk mengalihkan rute lagi.

### Perintah Plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak perintah slash. Perintah bawaan saat ini di repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan atau menonaktifkan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pemasangan/penyiapan perangkat. Lihat [Pairing](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` untuk sementara mempersiapkan perintah node ponsel berisiko tinggi.
- `/voice status|list [limit]|set <voiceId|name>` mengelola konfigurasi suara Talk. Di Discord, nama perintah native adalah `/talkvoice`.
- `/card ...` mengirim preset kartu kaya LINE. Lihat [LINE](/id/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` memeriksa dan mengontrol harness app-server Codex bawaan. Lihat [Codex harness](/id/plugins/codex-harness).
- Perintah khusus QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Perintah skill dinamis

Skill yang dapat dipanggil pengguna juga diekspos sebagai perintah slash:

- `/skill <name> [input]` selalu berfungsi sebagai entrypoint generik.
- skill juga dapat muncul sebagai perintah langsung seperti `/prose` saat skill/Plugin mendaftarkannya.
- pendaftaran perintah skill native dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.
- spesifikasi perintah dapat menyediakan `descriptionLocalizations` untuk permukaan native yang mendukung deskripsi terlokalisasi, termasuk Discord.

<AccordionGroup>
  <Accordion title="Catatan argumen dan parser">
    - Perintah menerima `:` opsional antara perintah dan argumen (mis. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` menerima alias model, `provider/model`, atau nama penyedia (pencocokan fuzzy); jika tidak ada kecocokan, teks diperlakukan sebagai isi pesan.
    - Untuk rincian lengkap penggunaan penyedia, gunakan `openclaw status --usage`.
    - `/allowlist add|remove` memerlukan `commands.config=true` dan menghormati `configWrites` kanal.
    - Di kanal multi-akun, `/allowlist --account <id>` yang menargetkan konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga menghormati `configWrites` akun target.
    - `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
    - `/restart` aktif secara default; setel `commands.restart: false` untuk menonaktifkannya.
    - `/plugins install <spec>` menerima spesifikasi Plugin yang sama seperti `openclaw plugins install`: path/arsip lokal, paket npm, `git:<repo>`, atau `clawhub:<pkg>`, lalu meminta restart Gateway karena modul sumber Plugin berubah.
    - `/plugins enable|disable` memperbarui konfigurasi Plugin dan memicu muat ulang Plugin Gateway untuk giliran agen baru.

  </Accordion>
  <Accordion title="Perilaku khusus kanal">
    - Perintah native khusus Discord: `/vc join|leave|status` mengontrol kanal suara (tidak tersedia sebagai teks). `join` memerlukan guild dan kanal voice/stage yang dipilih. Memerlukan `channels.discord.voice` dan perintah native.
    - Perintah pengikatan thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan pengikatan thread efektif untuk diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
    - Referensi perintah ACP dan perilaku runtime: [ACP agents](/id/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / keamanan reasoning">
    - `/verbose` ditujukan untuk debugging dan visibilitas ekstra; biarkan **nonaktif** dalam penggunaan normal.
    - `/trace` lebih sempit daripada `/verbose`: hanya menampilkan baris trace/debug milik Plugin dan menjaga chatter alat verbose normal tetap nonaktif.
    - `/fast on|off` mempertahankan override sesi. Gunakan opsi `inherit` di UI Sessions untuk menghapusnya dan kembali ke default konfigurasi.
    - `/fast` bersifat spesifik penyedia: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses native, sementara permintaan Anthropic publik langsung, termasuk traffic terautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
    - Ringkasan kegagalan alat tetap ditampilkan jika relevan, tetapi teks kegagalan terperinci hanya disertakan saat `/verbose` bernilai `on` atau `full`.
    - `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: perintah ini dapat mengungkap reasoning internal, output alat, atau diagnostik Plugin yang tidak Anda maksudkan untuk diekspos. Sebaiknya biarkan nonaktif, terutama dalam chat grup.

  </Accordion>
  <Accordion title="Pergantian model">
    - `/model` langsung mempertahankan model sesi baru.
    - Jika agen idle, proses berikutnya langsung menggunakannya.
    - Jika proses sudah aktif, OpenClaw menandai pergantian langsung sebagai tertunda dan hanya memulai ulang ke model baru pada titik retry yang bersih.
    - Jika aktivitas alat atau output balasan sudah dimulai, pergantian tertunda dapat tetap mengantre hingga kesempatan retry berikutnya atau giliran pengguna berikutnya.
    - Di TUI lokal, `/crestodian [request]` kembali dari TUI agen normal ke Crestodian. Ini terpisah dari mode penyelamatan kanal pesan dan tidak memberikan otoritas konfigurasi jarak jauh.

  </Accordion>
  <Accordion title="Fast path dan pintasan inline">
    - **Fast path:** pesan yang hanya berisi perintah dari pengirim yang masuk daftar izin ditangani segera (melewati antrean + model).
    - **Gating mention grup:** pesan yang hanya berisi perintah dari pengirim yang masuk daftar izin melewati persyaratan mention.
    - **Pintasan inline (hanya pengirim yang masuk daftar izin):** perintah tertentu juga berfungsi saat disematkan dalam pesan normal dan dihapus sebelum model melihat teks yang tersisa.
      - Contoh: `hey /status` memicu balasan status, dan teks yang tersisa berlanjut melalui alur normal.
    - Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Pesan yang hanya berisi perintah tanpa otorisasi diabaikan secara diam-diam, dan token `/...` inline diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Perintah skill dan argumen native">
    - **Perintah skill:** skill `user-invocable` diekspos sebagai perintah slash. Nama disanitasi menjadi `a-z0-9_` (maks 32 karakter); bentrokan mendapatkan sufiks numerik (mis. `_2`).
      - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna saat batas perintah native mencegah perintah per skill).
      - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
      - Skills secara opsional dapat mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke alat (deterministik, tanpa model).
      - Contoh: `/prose` (Plugin OpenProse) — lihat [OpenProse](/id/prose).
    - **Argumen perintah native:** Discord menggunakan pelengkapan otomatis untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen yang wajib). Telegram dan Slack menampilkan menu tombol saat perintah mendukung pilihan dan Anda menghilangkan argumen. Pilihan dinamis diselesaikan terhadap model sesi target, sehingga opsi spesifik model seperti level `/think` mengikuti override `/model` sesi tersebut.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan konfigurasi: **apa yang dapat digunakan agen ini sekarang dalam percakapan ini**.

- `/tools` default ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Permukaan perintah native yang mendukung argumen mengekspos sakelar mode yang sama seperti `compact|verbose`.
- Hasil bersifat dalam cakupan sesi, sehingga perubahan agen, kanal, thread, otorisasi pengirim, atau model dapat mengubah output.
- `/tools` mencakup alat yang benar-benar dapat dijangkau saat runtime, termasuk alat inti, alat Plugin yang terhubung, dan alat milik kanal.

Untuk pengeditan profil dan override, gunakan panel Tools UI Control atau permukaan konfigurasi/katalog alih-alih memperlakukan `/tools` sebagai katalog statis.

## Permukaan penggunaan (apa yang muncul di mana)

- **Penggunaan/kuota penyedia** (contoh: "Claude 80% tersisa") muncul di `/status` untuk penyedia model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela penyedia menjadi `% tersisa`; untuk MiniMax, kolom persentase yang hanya menunjukkan sisa dibalik sebelum ditampilkan, dan respons `model_remains` memprioritaskan entri model chat plus label paket bertag model.
- **Baris token/cache** di `/status` dapat melakukan fallback ke entri penggunaan transkrip terbaru ketika snapshot sesi live minim. Nilai live bukan nol yang sudah ada tetap menang, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total yang lebih besar dan berorientasi prompt ketika total yang tersimpan hilang atau lebih kecil.
- **Eksekusi vs runtime:** `/status` melaporkan `Execution` untuk path sandbox efektif dan `Runtime` untuk siapa yang benar-benar menjalankan sesi: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP.
- **Token/biaya per respons** dikontrol oleh `/usage off|tokens|full` (ditambahkan ke balasan normal).
- `/model status` membahas **model/auth/endpoint**, bukan penggunaan.

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
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan model plus langkah Submit. Pemilih menghormati `agents.defaults.models`, termasuk entri `provider/*`, sehingga penemuan berscope penyedia dapat menjaga pemilih tetap di bawah batas komponen 25 opsi Discord.
- `/model <#>` memilih dari pemilih tersebut (dan memprioritaskan penyedia saat ini jika memungkinkan).
- `/model status` menampilkan tampilan terperinci, termasuk endpoint penyedia yang dikonfigurasi (`baseUrl`) dan mode API (`api`) jika tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override config **hanya runtime** (memori, bukan disk). Khusus owner. Dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Override langsung diterapkan pada pembacaan config baru, tetapi **tidak** menulis ke `openclaw.json`. Gunakan `/debug reset` untuk menghapus semua override dan kembali ke config di disk.
</Note>

## Output trace Plugin

`/trace` memungkinkan Anda mengaktifkan atau menonaktifkan **baris trace/debug Plugin berscope sesi** tanpa menyalakan mode verbose penuh.

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
- Baris trace Plugin dapat muncul di `/status` dan sebagai pesan diagnostik susulan setelah balasan asisten normal.
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override config hanya runtime.
- `/trace` tidak menggantikan `/verbose`; output alat/status verbose normal tetap menjadi bagian dari `/verbose`.

## Pembaruan config

`/config` menulis ke config di disk Anda (`openclaw.json`). Khusus owner. Dinonaktifkan secara default; aktifkan dengan `commands.config: true`.

Contoh:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Config divalidasi sebelum ditulis; perubahan tidak valid ditolak. Pembaruan `/config` bertahan di antara restart.
</Note>

## Pembaruan MCP

`/mcp` menulis definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus owner. Dinonaktifkan secara default; aktifkan dengan `commands.mcp: true`.

Contoh:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` menyimpan config di config OpenClaw, bukan pengaturan proyek milik Pi. Adapter runtime menentukan transport mana yang benar-benar dapat dieksekusi.
</Note>

## Pembaruan Plugin

`/plugins` memungkinkan operator memeriksa Plugin yang ditemukan dan mengaktifkan atau menonaktifkannya di config. Alur baca-saja dapat menggunakan `/plugin` sebagai alias. Dinonaktifkan secara default; aktifkan dengan `commands.plugins: true`.

Contoh:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` dan `/plugins show` menggunakan penemuan Plugin nyata terhadap workspace saat ini plus config di disk.
- `/plugins install` menginstal dari ClawHub, npm, git, direktori lokal, dan arsip.
- `/plugins enable|disable` hanya memperbarui config Plugin; ini tidak menginstal atau menghapus instalasi Plugin.
- Perubahan enable dan disable memuat ulang secara hot-reload surface runtime Plugin Gateway untuk giliran agen baru; install meminta restart Gateway karena modul sumber Plugin berubah.

</Note>

## Catatan surface

<AccordionGroup>
  <Accordion title="Sesi per surface">
    - **Perintah teks** berjalan di sesi chat normal (DM berbagi `main`, grup memiliki sesinya sendiri).
    - **Perintah native** menggunakan sesi terisolasi:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
    - **`/stop`** menargetkan sesi chat aktif agar dapat membatalkan run saat ini.

  </Accordion>
  <Accordion title="Khusus Slack">
    `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu perintah slash Slack per perintah bawaan (nama yang sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.

    Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi di pesan Slack.

  </Accordion>
</AccordionGroup>

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini. `/side` adalah alias.

Berbeda dengan chat normal:

- ini menggunakan sesi saat ini sebagai konteks latar belakang,
- dalam sesi harness Codex, ini berjalan sebagai thread sampingan Codex ephemeral dengan
  izin Codex saat ini dan surface alat native,
- dalam sesi non-Codex, ini mempertahankan perilaku side-call one-shot langsung yang lama,
- ini tidak mengubah konteks sesi berikutnya,
- ini tidak ditulis ke riwayat transkrip,
- ini dikirim sebagai hasil sampingan live, bukan pesan asisten normal.

Hal itu membuat `/btw` berguna ketika Anda menginginkan klarifikasi sementara saat tugas utama tetap berjalan.

Contoh:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Lihat [Pertanyaan Sampingan BTW](/id/tools/btw) untuk perilaku lengkap dan detail UX klien.

## Terkait

- [Membuat skills](/id/tools/creating-skills)
- [Skills](/id/tools/skills)
- [Config Skills](/id/tools/skills-config)
