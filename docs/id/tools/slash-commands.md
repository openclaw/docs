---
read_when:
    - Menggunakan atau mengonfigurasi perintah obrolan
    - Pemecahan masalah perutean perintah atau izin
sidebarTitle: Slash commands
summary: 'Perintah garis miring: teks vs asli, konfigurasi, dan perintah yang didukung'
title: Perintah slash
x-i18n:
    generated_at: "2026-05-10T19:56:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: e97154facfa481b0c0d4b595f595d3698ee3e92c0a197794d12d75030a12ecb7
    source_path: tools/slash-commands.md
    workflow: 16
---

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`. Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Saat percakapan atau thread terikat ke sesi ACP, teks tindak lanjut normal diarahkan ke harness ACP tersebut. Perintah manajemen Gateway tetap lokal: `/acp ...` selalu mencapai penangan perintah ACP OpenClaw, dan `/status` serta `/unfocus` tetap lokal setiap kali penanganan perintah diaktifkan untuk permukaan tersebut.

Ada dua sistem terkait:

<AccordionGroup>
  <Accordion title="Commands">
    Pesan `/...` mandiri.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Direktif dihapus dari pesan sebelum model melihatnya.
    - Dalam pesan chat normal (bukan hanya direktif), direktif diperlakukan sebagai "petunjuk sebaris" dan **tidak** mempertahankan pengaturan sesi.
    - Dalam pesan hanya direktif (pesan hanya berisi direktif), direktif dipertahankan ke sesi dan membalas dengan konfirmasi.
    - Direktif hanya diterapkan untuk **pengirim terotorisasi**. Jika `commands.allowFrom` diatur, itu adalah satu-satunya daftar izin yang digunakan; jika tidak, otorisasi berasal dari daftar izin/pemasangan kanal plus `commands.useAccessGroups`. Pengirim tidak terotorisasi melihat direktif diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Hanya pengirim yang ada dalam daftar izin/terotorisasi: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Pintasan ini berjalan segera, dihapus sebelum model melihat pesan, dan teks yang tersisa berlanjut melalui alur normal.

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
  Mengaktifkan parsing `/...` dalam pesan chat. Pada permukaan tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi meskipun Anda mengaturnya ke `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah native. Otomatis: aktif untuk Discord/Telegram; nonaktif untuk Slack (hingga Anda menambahkan perintah garis miring); diabaikan untuk penyedia tanpa dukungan native. Atur `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk menimpa per penyedia (bool atau `"auto"`). Pada Discord, `false` melewati pendaftaran perintah garis miring dan pembersihan selama startup; perintah yang sebelumnya terdaftar mungkin tetap terlihat hingga Anda menghapusnya dari aplikasi Discord. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
</ParamField>
Pada Discord, spesifikasi perintah native dapat menyertakan `descriptionLocalizations`, yang diterbitkan OpenClaw sebagai `description_localizations` Discord dan disertakan dalam perbandingan rekonsiliasi.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah **skill** secara native saat didukung. Otomatis: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack memerlukan pembuatan perintah garis miring per skill). Atur `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk menimpa per penyedia (bool atau `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan daftar izin `tools.elevated`).
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
  Mengaktifkan `/plugins` (penemuan/status plugin plus kontrol instal + aktifkan/nonaktifkan).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Mengaktifkan `/debug` (penimpaan khusus runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Mengaktifkan `/restart` plus tindakan alat restart gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Mengatur daftar izin owner eksplisit untuk permukaan perintah/alat khusus owner. Ini adalah akun operator manusia yang dapat menyetujui tindakan berbahaya dan menjalankan perintah seperti `/diagnostics`, `/export-trajectory`, dan `/config`. Ini terpisah dari `commands.allowFrom` dan dari akses pemasangan DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanal: membuat perintah khusus owner memerlukan **identitas owner** untuk berjalan pada permukaan tersebut. Saat `true`, pengirim harus cocok dengan kandidat owner yang terselesaikan (misalnya entri dalam `commands.ownerAllowFrom` atau metadata owner native penyedia) atau memiliki cakupan internal `operator.admin` pada kanal pesan internal. Entri wildcard dalam `allowFrom` kanal, atau daftar kandidat owner yang kosong/tidak terselesaikan, **tidak** cukup — perintah khusus owner gagal tertutup pada kanal tersebut. Biarkan ini nonaktif jika Anda ingin perintah khusus owner dibatasi hanya oleh `ownerAllowFrom` dan daftar izin perintah standar.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Mengontrol bagaimana id owner muncul dalam prompt sistem.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Secara opsional mengatur rahasia HMAC yang digunakan saat `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Daftar izin per penyedia untuk otorisasi perintah. Saat dikonfigurasi, ini adalah satu-satunya sumber otorisasi untuk perintah dan direktif (daftar izin/pemasangan kanal dan `commands.useAccessGroups` diabaikan). Gunakan `"*"` untuk default global; kunci khusus penyedia menimpanya.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Menegakkan daftar izin/kebijakan untuk perintah saat `commands.allowFrom` tidak diatur.
</ParamField>

## Daftar perintah

Sumber kebenaran saat ini:

- bawaan inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah plugin berasal dari pemanggilan `registerCommand()` plugin
- ketersediaan aktual pada gateway Anda tetap bergantung pada flag konfigurasi, permukaan kanal, dan plugin yang terinstal/diaktifkan

### Perintah bawaan inti

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
    - Control UI mencegat `/new` yang diketik untuk membuat dan beralih ke sesi dasbor baru, kecuali saat `session.dmScope: "main"` dikonfigurasi dan induk saat ini adalah sesi utama agen; dalam kasus itu `/new` mereset sesi utama di tempat. `/reset` yang diketik tetap menjalankan reset di tempat milik Gateway.
    - `/reset soft [message]` mempertahankan transkrip saat ini, membuang id sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/prompt sistem di tempat.
    - `/compact [instructions]` memadatkan konteks sesi. Lihat [Compaction](/id/concepts/compaction).
    - `/stop` membatalkan run saat ini.
    - `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa pengikatan thread.
    - `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
    - `/export-trajectory [path]` meminta persetujuan exec, lalu mengekspor [paket trajectory](/id/tools/trajectory) JSONL untuk sesi saat ini. Gunakan saat Anda membutuhkan linimasa prompt, alat, dan transkrip untuk satu sesi OpenClaw. Dalam chat grup, prompt persetujuan dan hasil ekspor dikirim secara pribadi ke owner. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level|default>` mengatur tingkat berpikir atau menghapus penimpaan sesi. Opsi berasal dari profil penyedia model aktif; tingkat umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan tingkat kustom seperti `xhigh`, `adaptive`, `max`, atau biner `on` hanya jika didukung. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` mengalihkan keluaran verbose. Alias: `/v`.
    - `/trace on|off` mengalihkan keluaran trace plugin untuk sesi saat ini.
    - `/fast [status|on|off|default]` menampilkan, mengatur, atau menghapus mode cepat.
    - `/reasoning [on|off|stream]` mengalihkan visibilitas reasoning. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` mengalihkan mode elevated. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau mengatur default exec.
    - `/model [name|#|status]` menampilkan atau mengatur model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan penyedia yang dikonfigurasi/tersedia auth atau model untuk penyedia; tambahkan `all` untuk menjelajahi katalog lengkap penyedia tersebut. Entri `provider/*` dalam `agents.defaults.models` membuat `/model` dan `/models` hanya menampilkan model yang ditemukan untuk penyedia tersebut.
    - `/queue <mode>` mengelola perilaku antrean (`steer`, `queue` lama, `followup`, `collect`, `steer-backlog`, `interrupt`) plus opsi seperti `debounce:0.5s cap:25 drop:summarize`; `/queue default` atau `/queue reset` menghapus penimpaan sesi. Lihat [Antrean perintah](/id/concepts/queue) dan [Antrean steering](/id/concepts/queue-steering).
    - `/steer <message>` menyuntikkan panduan ke run aktif untuk sesi saat ini, independen dari mode `/queue`. Ini tidak memulai run baru saat sesi idle. Alias: `/tell`. Lihat [Steer](/id/tools/steer).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` menampilkan ringkasan bantuan singkat.
    - `/commands` menampilkan katalog perintah yang dihasilkan.
    - `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agen saat ini sekarang.
    - `/status` menampilkan status eksekusi/runtime, waktu aktif Gateway dan sistem, plus penggunaan/kuota penyedia saat tersedia.
    - `/diagnostics [note]` adalah alur laporan dukungan khusus owner untuk bug Gateway dan run harness Codex. Ini meminta persetujuan exec eksplisit setiap kali sebelum menjalankan `openclaw gateway diagnostics export --json`; jangan setujui diagnostik dengan aturan izinkan-semua. Setelah disetujui, ini mengirim laporan yang dapat ditempel dengan jalur paket lokal, ringkasan manifes, catatan privasi, dan id sesi relevan. Dalam chat grup, prompt persetujuan dan laporan dikirim secara pribadi ke owner. Saat sesi aktif menggunakan harness OpenAI Codex, persetujuan yang sama juga mengirim umpan balik Codex yang relevan ke server OpenAI dan balasan selesai mencantumkan id sesi OpenClaw, id thread Codex, dan perintah `codex resume <thread-id>`. Lihat [Ekspor Diagnostik](/id/gateway/diagnostics).
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
    - `/subagents list|kill|log|info|send|steer|spawn` mengelola jalannya subagen untuk sesi saat ini.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
    - `/focus <target>` mengikat thread Discord saat ini atau topik/percakapan Telegram ke target sesi.
    - `/unfocus` menghapus ikatan saat ini.
    - `/agents` mencantumkan agen yang terikat ke thread untuk sesi saat ini.
    - `/kill <id|#|all>` membatalkan satu atau semua subagen yang sedang berjalan.
    - `/subagents steer <id|#> <message>` mengirim arahan ke subagen yang sedang berjalan. Lihat [Steer](/id/tools/steer).

  </Accordion>
  <Accordion title="Penulisan khusus pemilik dan admin">
    - `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Khusus pemilik. Memerlukan `commands.config: true`.
    - `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus pemilik. Memerlukan `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau mengubah status plugin. `/plugin` adalah alias. Khusus pemilik untuk penulisan. Memerlukan `commands.plugins: true`.
    - `/debug show|set|unset|reset` mengelola override konfigurasi yang hanya berlaku saat runtime. Khusus pemilik. Memerlukan `commands.debug: true`.
    - `/restart` memulai ulang OpenClaw saat diaktifkan. Default: diaktifkan; atur `commands.restart: false` untuk menonaktifkannya.
    - `/send on|off|inherit` mengatur kebijakan pengiriman. Khusus pemilik.

  </Accordion>
  <Accordion title="Suara, TTS, kontrol channel">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` mengontrol TTS. Lihat [TTS](/id/tools/tts).
    - `/activation mention|always` mengatur mode aktivasi grup.
    - `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` ditambah daftar izin `tools.elevated`.
    - `!poll [sessionId]` memeriksa tugas bash latar belakang.
    - `!stop [sessionId]` menghentikan tugas bash latar belakang.

  </Accordion>
</AccordionGroup>

### Perintah dock yang dihasilkan

Perintah dock mengalihkan rute balasan sesi saat ini ke channel tertaut lain. Lihat [Channel docking](/id/concepts/channel-docking) untuk penyiapan, contoh, dan pemecahan masalah.

Perintah dock dihasilkan dari plugin channel dengan dukungan perintah native. Set bundel saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Gunakan perintah dock dari chat langsung untuk mengalihkan rute balasan sesi saat ini ke channel tertaut lain. Agen mempertahankan konteks sesi yang sama, tetapi balasan mendatang untuk sesi tersebut dikirimkan ke peer channel yang dipilih.

Perintah dock memerlukan `session.identityLinks`. Pengirim sumber dan peer target harus berada dalam grup identitas yang sama, misalnya `["telegram:123", "discord:456"]`. Jika pengguna Telegram dengan id `123` mengirim `/dock_discord`, OpenClaw menyimpan `lastChannel: "discord"` dan `lastTo: "456"` pada sesi aktif. Jika pengirim tidak tertaut ke peer Discord, perintah membalas dengan petunjuk penyiapan, bukan diteruskan ke chat normal.

Docking hanya mengubah rute sesi aktif. Ini tidak membuat akun channel, memberikan akses, melewati daftar izin channel, atau memindahkan riwayat transkrip ke sesi lain. Gunakan `/dock-telegram`, `/dock-slack`, `/dock-mattermost`, atau perintah dock lain yang dihasilkan untuk mengalihkan rute lagi.

### Perintah plugin bundel

Plugin bundel dapat menambahkan lebih banyak perintah slash. Perintah bundel saat ini di repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan atau menonaktifkan memory dreaming. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pairing/penyiapan perangkat. Lihat [Pairing](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` mengaktifkan sementara perintah node ponsel berisiko tinggi.
- `/voice status|list [limit]|set <voiceId|name>` mengelola konfigurasi suara Talk. Di Discord, nama perintah native adalah `/talkvoice`.
- `/card ...` mengirim preset rich card LINE. Lihat [LINE](/id/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` memeriksa dan mengontrol harness app-server Codex bundel. Lihat [Codex harness](/id/plugins/codex-harness).
- Perintah khusus QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Perintah skill dinamis

Skill yang dapat dipanggil pengguna juga diekspos sebagai perintah slash:

- `/skill <name> [input]` selalu berfungsi sebagai titik masuk generik.
- skill juga dapat muncul sebagai perintah langsung seperti `/prose` saat skill/plugin mendaftarkannya.
- pendaftaran perintah skill native dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.
- spesifikasi perintah dapat menyediakan `descriptionLocalizations` untuk surface native yang mendukung deskripsi terlokalisasi, termasuk Discord.

<AccordionGroup>
  <Accordion title="Catatan argumen dan parser">
    - Perintah menerima `:` opsional antara perintah dan argumen (mis. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` menerima alias model, `provider/model`, atau nama provider (pencocokan fuzzy); jika tidak ada kecocokan, teks diperlakukan sebagai isi pesan.
    - Untuk rincian lengkap penggunaan provider, gunakan `openclaw status --usage`.
    - `/allowlist add|remove` memerlukan `commands.config=true` dan menghormati `configWrites` channel.
    - Pada channel multi-akun, `/allowlist --account <id>` yang ditargetkan ke konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga menghormati `configWrites` akun target.
    - `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
    - `/restart` diaktifkan secara default; atur `commands.restart: false` untuk menonaktifkannya.
    - `/plugins install <spec>` menerima spesifikasi plugin yang sama dengan `openclaw plugins install`: path/arsip lokal, paket npm, `git:<repo>`, atau `clawhub:<pkg>`, lalu meminta restart Gateway karena modul sumber plugin berubah.
    - `/plugins enable|disable` memperbarui konfigurasi plugin dan memicu pemuatan ulang plugin Gateway untuk giliran agen baru.

  </Accordion>
  <Accordion title="Perilaku khusus channel">
    - Perintah native khusus Discord: `/vc join|leave|status` mengontrol voice channel (tidak tersedia sebagai teks). `join` memerlukan guild dan voice/stage channel yang dipilih. Memerlukan `channels.discord.voice` dan perintah native.
    - Perintah pengikatan thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan pengikatan thread efektif untuk diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
    - Referensi perintah ACP dan perilaku runtime: [agen ACP](/id/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / keamanan reasoning">
    - `/verbose` ditujukan untuk debugging dan visibilitas tambahan; tetap **nonaktifkan** dalam penggunaan normal.
    - `/trace` lebih sempit daripada `/verbose`: hanya menampilkan baris trace/debug milik plugin dan menjaga obrolan tool verbose normal tetap nonaktif.
    - `/fast on|off` mempertahankan override sesi. Gunakan opsi `inherit` UI Sessions untuk menghapusnya dan kembali ke default konfigurasi.
    - `/fast` bersifat khusus provider: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses native, sedangkan permintaan Anthropic publik langsung, termasuk traffic terautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
    - Ringkasan kegagalan tool tetap ditampilkan saat relevan, tetapi teks kegagalan terperinci hanya disertakan saat `/verbose` bernilai `on` atau `full`.
    - `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: perintah ini dapat mengungkap reasoning internal, output tool, atau diagnostik plugin yang tidak Anda maksudkan untuk diekspos. Sebaiknya biarkan nonaktif, terutama dalam chat grup.

  </Accordion>
  <Accordion title="Pengalihan model">
    - `/model` langsung mempertahankan model sesi baru.
    - Jika agen idle, run berikutnya langsung menggunakannya.
    - Jika run sudah aktif, OpenClaw menandai pengalihan live sebagai pending dan hanya memulai ulang ke model baru pada titik retry yang bersih.
    - Jika aktivitas tool atau output balasan sudah dimulai, pengalihan pending dapat tetap mengantre hingga kesempatan retry berikutnya atau giliran pengguna berikutnya.
    - Di TUI lokal, `/crestodian [request]` kembali dari TUI agen normal ke Crestodian. Ini terpisah dari mode penyelamatan channel pesan dan tidak memberikan otoritas konfigurasi jarak jauh.

  </Accordion>
  <Accordion title="Fast path dan shortcut inline">
    - **Fast path:** pesan hanya perintah dari pengirim yang masuk daftar izin ditangani langsung (melewati antrean + model).
    - **Gating mention grup:** pesan hanya perintah dari pengirim yang masuk daftar izin melewati persyaratan mention.
    - **Shortcut inline (hanya pengirim yang masuk daftar izin):** perintah tertentu juga berfungsi saat disematkan dalam pesan normal dan dihapus sebelum model melihat teks yang tersisa.
      - Contoh: `hey /status` memicu balasan status, dan teks yang tersisa berlanjut melalui alur normal.
    - Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Pesan hanya perintah yang tidak berwenang diabaikan secara diam-diam, dan token `/...` inline diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Perintah skill dan argumen native">
    - **Perintah skill:** skill `user-invocable` diekspos sebagai perintah slash. Nama disanitasi menjadi `a-z0-9_` (maks 32 karakter); tabrakan mendapat sufiks numerik (mis. `_2`).
      - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna saat batas perintah native mencegah perintah per-skill).
      - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
      - Skills secara opsional dapat mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke tool (deterministik, tanpa model).
      - Contoh: `/prose` (plugin OpenProse) — lihat [OpenProse](/id/prose).
    - **Argumen perintah native:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen wajib). Telegram dan Slack menampilkan menu tombol saat perintah mendukung pilihan dan Anda menghilangkan argumen. Pilihan dinamis diselesaikan terhadap model sesi target, sehingga opsi khusus model seperti level `/think` mengikuti override `/model` sesi tersebut.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan konfigurasi: **apa yang dapat digunakan agen ini saat ini dalam percakapan ini**.

- `/tools` default ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Surface perintah native yang mendukung argumen mengekspos pengalih mode yang sama seperti `compact|verbose`.
- Hasil bersifat terbatas pada sesi, sehingga mengubah agen, channel, thread, otorisasi pengirim, atau model dapat mengubah output.
- `/tools` menyertakan tool yang benar-benar dapat dijangkau saat runtime, termasuk tool inti, tool plugin yang terhubung, dan tool milik channel.

Untuk pengeditan profil dan override, gunakan panel Tools UI Control atau surface konfigurasi/katalog alih-alih memperlakukan `/tools` sebagai katalog statis.

## Surface penggunaan (yang tampil di mana)

- **Penggunaan/kuota penyedia** (contoh: "Claude 80% left") muncul di `/status` untuk penyedia model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela penyedia menjadi `% left`; untuk MiniMax, kolom persentase hanya-tersisa dibalik sebelum ditampilkan, dan respons `model_remains` mengutamakan entri model chat plus label paket bertag model.
- **Baris token/cache** di `/status` dapat fallback ke entri penggunaan transkrip terbaru ketika snapshot sesi live minim. Nilai live bukan nol yang sudah ada tetap menang, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total berorientasi prompt yang lebih besar ketika total tersimpan hilang atau lebih kecil.
- **Eksekusi vs runtime:** `/status` melaporkan `Execution` untuk path sandbox efektif dan `Runtime` untuk siapa yang sebenarnya menjalankan sesi: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP.
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
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan model plus langkah Submit. Pemilih mematuhi `agents.defaults.models`, termasuk entri `provider/*`, sehingga discovery berscope penyedia dapat menjaga pemilih tetap di bawah batas komponen 25 opsi milik Discord.
- `/model <#>` memilih dari pemilih tersebut (dan mengutamakan penyedia saat ini jika memungkinkan).
- `/model status` menampilkan tampilan detail, termasuk endpoint penyedia yang dikonfigurasi (`baseUrl`) dan mode API (`api`) jika tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override config **hanya-runtime** (memori, bukan disk). Hanya owner. Dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Override langsung diterapkan ke pembacaan config baru, tetapi **tidak** menulis ke `openclaw.json`. Gunakan `/debug reset` untuk menghapus semua override dan kembali ke config di disk.
</Note>

## Output trace Plugin

`/trace` memungkinkan Anda mengaktifkan/menonaktifkan **baris trace/debug Plugin berscope sesi** tanpa menyalakan mode verbose penuh.

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
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override config hanya-runtime.
- `/trace` tidak menggantikan `/verbose`; output alat/status verbose normal tetap menjadi bagian dari `/verbose`.

## Pembaruan config

`/config` menulis ke config di disk Anda (`openclaw.json`). Hanya owner. Dinonaktifkan secara default; aktifkan dengan `commands.config: true`.

Contoh:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Config divalidasi sebelum ditulis; perubahan yang tidak valid ditolak. Pembaruan `/config` bertahan setelah restart.
</Note>

## Pembaruan MCP

`/mcp` menulis definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Hanya owner. Dinonaktifkan secara default; aktifkan dengan `commands.mcp: true`.

Contoh:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` menyimpan config di config OpenClaw, bukan pengaturan proyek milik Pi. Adapter runtime memutuskan transport mana yang benar-benar dapat dieksekusi.
</Note>

## Pembaruan Plugin

`/plugins` memungkinkan operator memeriksa Plugin yang ditemukan dan mengaktifkan/menonaktifkan enablement di config. Alur baca-saja dapat menggunakan `/plugin` sebagai alias. Dinonaktifkan secara default; aktifkan dengan `commands.plugins: true`.

Contoh:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` dan `/plugins show` menggunakan discovery Plugin nyata terhadap workspace saat ini plus config di disk.
- `/plugins install` menginstal dari ClawHub, npm, git, direktori lokal, dan arsip.
- `/plugins enable|disable` hanya memperbarui config Plugin; ini tidak menginstal atau menghapus instalasi Plugin.
- Perubahan enable dan disable melakukan hot-reload surface runtime Plugin Gateway untuk giliran agen baru; install meminta restart Gateway karena modul sumber Plugin berubah.

</Note>

## Catatan surface

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **Perintah teks** berjalan dalam sesi chat normal (DM berbagi `main`, grup memiliki sesi sendiri).
    - **Perintah native** menggunakan sesi terisolasi:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
    - **`/stop`** menargetkan sesi chat aktif agar dapat membatalkan run saat ini.

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu perintah slash Slack per perintah bawaan (nama yang sama seperti `/help`). Menu argumen perintah untuk Slack dikirimkan sebagai tombol Block Kit ephemeral.

    Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi di pesan Slack.

  </Accordion>
</AccordionGroup>

## Pertanyaan samping BTW

`/btw` adalah **pertanyaan samping** cepat tentang sesi saat ini. `/side` adalah alias.

Berbeda dari chat normal:

- ini menggunakan sesi saat ini sebagai konteks latar belakang,
- ini berjalan sebagai panggilan sekali jalan terpisah **tanpa alat**,
- ini tidak mengubah konteks sesi mendatang,
- ini tidak ditulis ke riwayat transkrip,
- ini dikirim sebagai hasil samping live, bukan pesan asisten normal.

Hal itu membuat `/btw` berguna ketika Anda menginginkan klarifikasi sementara saat tugas utama terus berjalan.

Contoh:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Lihat [Pertanyaan Samping BTW](/id/tools/btw) untuk perilaku lengkap dan detail UX klien.

## Terkait

- [Membuat Skills](/id/tools/creating-skills)
- [Skills](/id/tools/skills)
- [Config Skills](/id/tools/skills-config)
