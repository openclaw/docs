---
read_when:
    - Menggunakan atau mengonfigurasi perintah obrolan
    - Men-debug perutean perintah atau izin
sidebarTitle: Slash commands
summary: 'Perintah garis miring: teks vs bawaan, konfigurasi, dan perintah yang didukung'
title: Perintah garis miring
x-i18n:
    generated_at: "2026-04-30T10:17:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`. Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ketika percakapan atau thread terikat ke sesi ACP, teks tindak lanjut normal diarahkan ke harness ACP tersebut. Perintah manajemen Gateway tetap lokal: `/acp ...` selalu mencapai handler perintah ACP OpenClaw, dan `/status` serta `/unfocus` tetap lokal kapan pun penanganan perintah diaktifkan untuk permukaan tersebut.

Ada dua sistem terkait:

<AccordionGroup>
  <Accordion title="Perintah">
    Pesan `/...` mandiri.
  </Accordion>
  <Accordion title="Direktif">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Direktif dihapus dari pesan sebelum model melihatnya.
    - Dalam pesan chat normal (bukan hanya direktif), direktif diperlakukan sebagai "petunjuk inline" dan **tidak** mempertahankan pengaturan sesi.
    - Dalam pesan hanya direktif (pesan hanya berisi direktif), direktif dipertahankan ke sesi dan membalas dengan konfirmasi.
    - Direktif hanya diterapkan untuk **pengirim terotorisasi**. Jika `commands.allowFrom` disetel, itu adalah satu-satunya allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing channel plus `commands.useAccessGroups`. Pengirim tidak terotorisasi melihat direktif diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Pintasan inline">
    Hanya pengirim yang ada di allowlist/terotorisasi: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  Mengaktifkan parsing `/...` dalam pesan chat. Pada permukaan tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi meskipun Anda menyetelnya ke `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah native. Otomatis: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan perintah slash); diabaikan untuk penyedia tanpa dukungan native. Setel `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk menimpa per penyedia (bool atau `"auto"`). `false` menghapus perintah yang sebelumnya didaftarkan pada Discord/Telegram saat startup. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah **skill** secara native ketika didukung. Otomatis: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack memerlukan pembuatan satu perintah slash per skill). Setel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk menimpa per penyedia (bool atau `"auto"`).
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
  Mengaktifkan `/debug` (penimpaan hanya runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Mengaktifkan `/restart` plus tindakan alat mulai ulang gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Menetapkan allowlist owner eksplisit untuk permukaan perintah/alat khusus owner. Ini adalah akun operator manusia yang dapat menyetujui tindakan berbahaya dan menjalankan perintah seperti `/diagnostics`, `/export-trajectory`, dan `/config`. Ini terpisah dari `commands.allowFrom` dan dari akses pairing DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per channel: membuat perintah khusus owner memerlukan **identitas owner** untuk berjalan pada permukaan tersebut. Ketika `true`, pengirim harus cocok dengan kandidat owner yang terselesaikan (misalnya entri di `commands.ownerAllowFrom` atau metadata owner native penyedia) atau memiliki cakupan internal `operator.admin` pada channel pesan internal. Entri wildcard dalam `allowFrom` channel, atau daftar kandidat owner yang kosong/tidak terselesaikan, **tidak** cukup — perintah khusus owner gagal tertutup pada channel tersebut. Biarkan ini nonaktif jika Anda ingin perintah khusus owner hanya dibatasi oleh `ownerAllowFrom` dan allowlist perintah standar.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Mengontrol bagaimana id owner muncul di prompt sistem.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Secara opsional menetapkan rahasia HMAC yang digunakan ketika `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per penyedia untuk otorisasi perintah. Ketika dikonfigurasi, ini adalah satu-satunya sumber otorisasi untuk perintah dan direktif (allowlist/pairing channel dan `commands.useAccessGroups` diabaikan). Gunakan `"*"` untuk default global; kunci khusus penyedia menimpanya.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Menerapkan allowlist/kebijakan untuk perintah ketika `commands.allowFrom` tidak disetel.
</ParamField>

## Daftar perintah

Sumber kebenaran saat ini:

- bawaan inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah plugin berasal dari panggilan `registerCommand()` plugin
- ketersediaan aktual pada gateway Anda tetap bergantung pada flag konfigurasi, permukaan channel, dan plugin yang terinstal/diaktifkan

### Perintah bawaan inti

<AccordionGroup>
  <Accordion title="Sesi dan eksekusi">
    - `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
    - `/reset soft [message]` mempertahankan transkrip saat ini, menghapus id sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/prompt sistem di tempat.
    - `/compact [instructions]` memadatkan konteks sesi. Lihat [Compaction](/id/concepts/compaction).
    - `/stop` membatalkan eksekusi saat ini.
    - `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa pengikatan thread.
    - `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
    - `/export-trajectory [path]` meminta persetujuan exec, lalu mengekspor [bundle trajektori](/id/tools/trajectory) JSONL untuk sesi saat ini. Gunakan ini ketika Anda memerlukan linimasa prompt, alat, dan transkrip untuk satu sesi OpenClaw. Dalam chat grup, prompt persetujuan dan hasil ekspor dikirim secara privat ke owner. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Kontrol model dan eksekusi">
    - `/think <level>` menetapkan tingkat berpikir. Opsi berasal dari profil penyedia model aktif; tingkat umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan tingkat khusus seperti `xhigh`, `adaptive`, `max`, atau biner `on` hanya jika didukung. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` mengaktifkan/menonaktifkan output verbose. Alias: `/v`.
    - `/trace on|off` mengaktifkan/menonaktifkan output trace plugin untuk sesi saat ini.
    - `/fast [status|on|off]` menampilkan atau menyetel mode cepat.
    - `/reasoning [on|off|stream]` mengaktifkan/menonaktifkan visibilitas reasoning. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` mengaktifkan/menonaktifkan mode elevated. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau menyetel default exec.
    - `/model [name|#|status]` menampilkan atau menyetel model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan penyedia yang dikonfigurasi/tersedia auth atau model untuk penyedia; tambahkan `all` untuk menelusuri katalog lengkap penyedia tersebut.
    - `/queue <mode>` mengelola perilaku antrean (`steer`, `queue` lama, `followup`, `collect`, `steer-backlog`, `interrupt`) plus opsi seperti `debounce:0.5s cap:25 drop:summarize`; `/queue default` atau `/queue reset` menghapus penimpaan sesi. Lihat [Antrean perintah](/id/concepts/queue) dan [Antrean steering](/id/concepts/queue-steering).

  </Accordion>
  <Accordion title="Penemuan dan status">
    - `/help` menampilkan ringkasan bantuan singkat.
    - `/commands` menampilkan katalog perintah yang dihasilkan.
    - `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agen saat ini sekarang.
    - `/status` menampilkan status eksekusi/runtime, termasuk label `Execution`/`Runtime` dan penggunaan/kuota penyedia ketika tersedia.
    - `/diagnostics [note]` adalah alur laporan dukungan khusus owner untuk bug Gateway dan eksekusi harness Codex. Ini meminta persetujuan exec eksplisit setiap kali sebelum menjalankan `openclaw gateway diagnostics export --json`; jangan setujui diagnostik dengan aturan izinkan-semua. Setelah disetujui, ini mengirim laporan yang dapat ditempel dengan path bundle lokal, ringkasan manifes, catatan privasi, dan id sesi yang relevan. Dalam chat grup, prompt persetujuan dan laporan dikirim secara privat ke owner. Ketika sesi aktif menggunakan harness OpenAI Codex, persetujuan yang sama juga mengirim umpan balik Codex yang relevan ke server OpenAI dan balasan selesai mencantumkan id sesi OpenClaw, id thread Codex, dan perintah `codex resume <thread-id>`. Lihat [Ekspor Diagnostik](/id/gateway/diagnostics).
    - `/crestodian <request>` menjalankan pembantu penyiapan dan perbaikan Crestodian dari DM owner.
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
  <Accordion title="Subagen dan ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` mengelola eksekusi subagen untuk sesi saat ini.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
    - `/focus <target>` mengikat thread Discord saat ini atau topik/percakapan Telegram ke target sesi.
    - `/unfocus` menghapus pengikatan saat ini.
    - `/agents` mencantumkan agen yang terikat thread untuk sesi saat ini.
    - `/kill <id|#|all>` membatalkan satu atau semua subagen yang berjalan.
    - `/steer <id|#> <message>` mengirim steering ke subagen yang berjalan. Alias: `/tell`.

  </Accordion>
  <Accordion title="Penulisan khusus pemilik dan admin">
    - `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Khusus pemilik. Memerlukan `commands.config: true`.
    - `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus pemilik. Memerlukan `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau mengubah status plugin. `/plugin` adalah alias. Khusus pemilik untuk penulisan. Memerlukan `commands.plugins: true`.
    - `/debug show|set|unset|reset` mengelola override konfigurasi khusus runtime. Khusus pemilik. Memerlukan `commands.debug: true`.
    - `/restart` memulai ulang OpenClaw saat diaktifkan. Default: aktif; atur `commands.restart: false` untuk menonaktifkannya.
    - `/send on|off|inherit` mengatur kebijakan pengiriman. Khusus pemilik.

  </Accordion>
  <Accordion title="Suara, TTS, kontrol channel">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` mengontrol TTS. Lihat [TTS](/id/tools/tts).
    - `/activation mention|always` mengatur mode aktivasi grup.
    - `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` plus allowlist `tools.elevated`.
    - `!poll [sessionId]` memeriksa pekerjaan bash latar belakang.
    - `!stop [sessionId]` menghentikan pekerjaan bash latar belakang.

  </Accordion>
</AccordionGroup>

### Perintah dock yang dihasilkan

Perintah dock mengalihkan rute balasan sesi saat ini ke channel tertaut lain. Lihat [Channel docking](/id/concepts/channel-docking) untuk penyiapan, contoh, dan pemecahan masalah.

Perintah dock dihasilkan dari plugin channel dengan dukungan perintah native. Set bundel saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Gunakan perintah dock dari chat langsung untuk mengalihkan rute balasan sesi saat ini ke channel tertaut lain. Agen mempertahankan konteks sesi yang sama, tetapi balasan berikutnya untuk sesi tersebut dikirimkan ke peer channel yang dipilih.

Perintah dock memerlukan `session.identityLinks`. Pengirim sumber dan peer target harus berada dalam grup identitas yang sama, misalnya `["telegram:123", "discord:456"]`. Jika pengguna Telegram dengan id `123` mengirim `/dock_discord`, OpenClaw menyimpan `lastChannel: "discord"` dan `lastTo: "456"` pada sesi aktif. Jika pengirim tidak ditautkan ke peer Discord, perintah membalas dengan petunjuk penyiapan alih-alih jatuh ke chat normal.

Docking hanya mengubah rute sesi aktif. Ini tidak membuat akun channel, memberikan akses, melewati allowlist channel, atau memindahkan riwayat transkrip ke sesi lain. Gunakan `/dock-telegram`, `/dock-slack`, `/dock-mattermost`, atau perintah dock lain yang dihasilkan untuk mengalihkan rute lagi.

### Perintah plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak perintah slash. Perintah bawaan saat ini di repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan atau menonaktifkan dreaming memori. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pemasangan/penyiapan perangkat. Lihat [Pemasangan](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` mempersenjatai sementara perintah node ponsel berisiko tinggi.
- `/voice status|list [limit]|set <voiceId|name>` mengelola konfigurasi suara Talk. Di Discord, nama perintah native adalah `/talkvoice`.
- `/card ...` mengirim preset kartu kaya LINE. Lihat [LINE](/id/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` memeriksa dan mengontrol harness app-server Codex bawaan. Lihat [Harness Codex](/id/plugins/codex-harness).
- Perintah khusus QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Perintah skill dinamis

Skill yang dapat dipanggil pengguna juga diekspos sebagai perintah slash:

- `/skill <name> [input]` selalu berfungsi sebagai entrypoint generik.
- skill juga dapat muncul sebagai perintah langsung seperti `/prose` saat skill/plugin mendaftarkannya.
- pendaftaran perintah skill native dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Catatan argumen dan parser">
    - Perintah menerima `:` opsional antara perintah dan argumen (mis. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` menerima alias model, `provider/model`, atau nama provider (pencocokan fuzzy); jika tidak ada kecocokan, teks diperlakukan sebagai isi pesan.
    - Untuk rincian lengkap penggunaan provider, gunakan `openclaw status --usage`.
    - `/allowlist add|remove` memerlukan `commands.config=true` dan menghormati `configWrites` channel.
    - Di channel multi-akun, `/allowlist --account <id>` yang ditargetkan konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga menghormati `configWrites` akun target.
    - `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
    - `/restart` diaktifkan secara default; atur `commands.restart: false` untuk menonaktifkannya.
    - `/plugins install <spec>` menerima spesifikasi plugin yang sama seperti `openclaw plugins install`: jalur/arsip lokal, paket npm, atau `clawhub:<pkg>`.
    - `/plugins enable|disable` memperbarui konfigurasi plugin dan dapat meminta restart.

  </Accordion>
  <Accordion title="Perilaku khusus channel">
    - Perintah native khusus Discord: `/vc join|leave|status` mengontrol channel suara (tidak tersedia sebagai teks). `join` memerlukan guild dan channel suara/stage yang dipilih. Memerlukan `channels.discord.voice` dan perintah native.
    - Perintah pengikatan thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan pengikatan thread efektif untuk diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
    - Referensi perintah ACP dan perilaku runtime: [Agen ACP](/id/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / keamanan reasoning">
    - `/verbose` ditujukan untuk debugging dan visibilitas ekstra; biarkan **mati** dalam penggunaan normal.
    - `/trace` lebih sempit daripada `/verbose`: hanya menampilkan baris trace/debug milik plugin dan membiarkan obrolan verbose tool normal tetap mati.
    - `/fast on|off` menyimpan override sesi. Gunakan opsi `inherit` di UI Sessions untuk menghapusnya dan kembali ke default konfigurasi.
    - `/fast` bersifat khusus provider: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses native, sementara permintaan Anthropic publik langsung, termasuk traffic berautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
    - Ringkasan kegagalan tool tetap ditampilkan saat relevan, tetapi teks kegagalan terperinci hanya disertakan saat `/verbose` bernilai `on` atau `full`.
    - `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: ini dapat mengungkap reasoning internal, output tool, atau diagnostik plugin yang tidak Anda maksudkan untuk diekspos. Sebaiknya biarkan mati, terutama di chat grup.

  </Accordion>
  <Accordion title="Pergantian model">
    - `/model` langsung menyimpan model sesi baru.
    - Jika agen idle, proses berikutnya langsung menggunakannya.
    - Jika proses sudah aktif, OpenClaw menandai pergantian live sebagai tertunda dan hanya memulai ulang ke model baru pada titik retry yang bersih.
    - Jika aktivitas tool atau output balasan sudah dimulai, pergantian tertunda dapat tetap berada dalam antrean hingga kesempatan retry berikutnya atau giliran pengguna berikutnya.
    - Di TUI lokal, `/crestodian [request]` kembali dari TUI agen normal ke Crestodian. Ini terpisah dari mode penyelamatan channel pesan dan tidak memberikan otoritas konfigurasi jarak jauh.

  </Accordion>
  <Accordion title="Jalur cepat dan pintasan inline">
    - **Jalur cepat:** pesan hanya-perintah dari pengirim yang masuk allowlist ditangani segera (melewati antrean + model).
    - **Gate mention grup:** pesan hanya-perintah dari pengirim yang masuk allowlist melewati persyaratan mention.
    - **Pintasan inline (hanya pengirim yang masuk allowlist):** perintah tertentu juga berfungsi saat disematkan dalam pesan normal dan dihapus sebelum model melihat teks yang tersisa.
      - Contoh: `hey /status` memicu balasan status, dan teks yang tersisa berlanjut melalui alur normal.
    - Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Pesan hanya-perintah yang tidak berwenang diabaikan tanpa pemberitahuan, dan token `/...` inline diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Perintah skill dan argumen native">
    - **Perintah skill:** skill `user-invocable` diekspos sebagai perintah slash. Nama disanitasi menjadi `a-z0-9_` (maks 32 karakter); tabrakan mendapat sufiks numerik (mis. `_2`).
      - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna saat batas perintah native mencegah perintah per-skill).
      - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
      - Skill dapat secara opsional mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke tool (deterministik, tanpa model).
      - Contoh: `/prose` (plugin OpenProse) — lihat [OpenProse](/id/prose).
    - **Argumen perintah native:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen wajib). Telegram dan Slack menampilkan menu tombol saat perintah mendukung pilihan dan Anda menghilangkan argumen. Pilihan dinamis diselesaikan terhadap model sesi target, sehingga opsi khusus model seperti level `/think` mengikuti override `/model` sesi tersebut.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan konfigurasi: **apa yang dapat digunakan agen ini saat ini dalam percakapan ini**.

- `/tools` default ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Surface perintah native yang mendukung argumen mengekspos pengalih mode yang sama seperti `compact|verbose`.
- Hasil bersifat tercakup sesi, jadi mengubah agen, channel, thread, otorisasi pengirim, atau model dapat mengubah output.
- `/tools` mencakup tool yang benar-benar dapat dijangkau saat runtime, termasuk tool inti, tool plugin yang terhubung, dan tool milik channel.

Untuk mengedit profil dan override, gunakan panel Tools UI Control atau surface konfigurasi/katalog alih-alih memperlakukan `/tools` sebagai katalog statis.

## Surface penggunaan (apa yang muncul di mana)

- **Penggunaan/kuota provider** (contoh: "Claude tersisa 80%") muncul di `/status` untuk provider model saat ini saat pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela provider menjadi `% tersisa`; untuk MiniMax, field persen khusus-sisa dibalik sebelum ditampilkan, dan respons `model_remains` lebih memilih entri chat-model plus label paket bertag model.
- **Baris token/cache** di `/status` dapat fallback ke entri penggunaan transkrip terbaru saat snapshot sesi live jarang. Nilai live bukan nol yang ada tetap menang, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total berorientasi prompt yang lebih besar saat total tersimpan hilang atau lebih kecil.
- **Eksekusi vs runtime:** `/status` melaporkan `Execution` untuk jalur sandbox efektif dan `Runtime` untuk siapa yang benar-benar menjalankan sesi: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP.
- **Token/biaya per respons** dikontrol oleh `/usage off|tokens|full` (ditambahkan ke balasan normal).
- `/model status` membahas **model/auth/endpoint**, bukan penggunaan.

## Pemilihan model (`/model`)

`/model` diimplementasikan sebagai directive.

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

- `/model` dan `/model list` menampilkan pemilih bernomor yang ringkas (keluarga model + provider yang tersedia).
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown provider dan model plus langkah Submit.
- `/model <#>` memilih dari pemilih tersebut (dan lebih memilih provider saat ini bila memungkinkan).
- `/model status` menampilkan tampilan terperinci, termasuk endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) saat tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override config **hanya runtime** (memori, bukan disk). Hanya owner. Dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.

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

`/trace` memungkinkan Anda mengaktifkan atau menonaktifkan **baris trace/debug plugin yang dicakup ke sesi** tanpa mengaktifkan mode verbose penuh.

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
- Baris trace plugin dapat muncul di `/status` dan sebagai pesan diagnostik lanjutan setelah balasan asisten normal.
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override config hanya runtime.
- `/trace` tidak menggantikan `/verbose`; output tool/status verbose normal tetap menjadi bagian dari `/verbose`.

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
Config divalidasi sebelum ditulis; perubahan yang tidak valid akan ditolak. Pembaruan `/config` tetap ada setelah restart.
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
`/mcp` menyimpan config di config OpenClaw, bukan pengaturan proyek milik Pi. Adapter runtime menentukan transport mana yang benar-benar dapat dieksekusi.
</Note>

## Pembaruan plugin

`/plugins` memungkinkan operator memeriksa plugin yang ditemukan dan mengaktifkan atau menonaktifkannya di config. Alur hanya baca dapat menggunakan `/plugin` sebagai alias. Dinonaktifkan secara default; aktifkan dengan `commands.plugins: true`.

Contoh:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` dan `/plugins show` menggunakan penemuan plugin nyata terhadap workspace saat ini beserta config di disk.
- `/plugins enable|disable` hanya memperbarui config plugin; ini tidak menginstal atau menghapus plugin.
- Setelah perubahan aktifkan/nonaktifkan, restart gateway untuk menerapkannya.

</Note>

## Catatan surface

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **Perintah teks** berjalan di sesi chat normal (DM berbagi `main`, grup memiliki sesi sendiri).
    - **Perintah native** menggunakan sesi terisolasi:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
    - **`/stop`** menargetkan sesi chat aktif agar dapat membatalkan run saat ini.

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu perintah slash Slack untuk setiap perintah bawaan (nama yang sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.

    Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.

  </Accordion>
</AccordionGroup>

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** singkat tentang sesi saat ini.

Berbeda dari chat normal:

- ini menggunakan sesi saat ini sebagai konteks latar belakang,
- ini berjalan sebagai panggilan one-shot terpisah **tanpa tool**,
- ini tidak mengubah konteks sesi di masa depan,
- ini tidak ditulis ke riwayat transkrip,
- ini dikirim sebagai hasil sampingan live, bukan pesan asisten normal.

Itu membuat `/btw` berguna saat Anda menginginkan klarifikasi sementara sementara tugas utama terus berjalan.

Contoh:

```text
/btw what are we doing right now?
```

Lihat [Pertanyaan Sampingan BTW](/id/tools/btw) untuk perilaku lengkap dan detail UX client.

## Terkait

- [Membuat skills](/id/tools/creating-skills)
- [Skills](/id/tools/skills)
- [Config Skills](/id/tools/skills-config)
