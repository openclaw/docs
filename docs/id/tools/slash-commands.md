---
read_when:
    - Menggunakan atau mengonfigurasi perintah obrolan
    - Men-debug perutean perintah atau izin
sidebarTitle: Slash commands
summary: 'Perintah garis miring: teks dibandingkan bawaan, konfigurasi, dan perintah yang didukung'
title: Perintah garis miring
x-i18n:
    generated_at: "2026-05-05T06:18:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a0234bd94cafe242fc692a5b9d457047e483e2a434cc92ab26046e6ddec55ce
    source_path: tools/slash-commands.md
    workflow: 16
---

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`. Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Saat sebuah percakapan atau thread terikat ke sesi ACP, teks tindak lanjut normal diarahkan ke harness ACP tersebut. Perintah pengelolaan Gateway tetap lokal: `/acp ...` selalu mencapai handler perintah ACP OpenClaw, dan `/status` plus `/unfocus` tetap lokal setiap kali penanganan perintah diaktifkan untuk surface tersebut.

Ada dua sistem terkait:

<AccordionGroup>
  <Accordion title="Perintah">
    Pesan `/...` mandiri.
  </Accordion>
  <Accordion title="Direktif">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Direktif dihapus dari pesan sebelum model melihatnya.
    - Dalam pesan chat normal (bukan hanya direktif), direktif diperlakukan sebagai "petunjuk inline" dan **tidak** mempertahankan pengaturan sesi.
    - Dalam pesan khusus direktif (pesan hanya berisi direktif), direktif dipertahankan ke sesi dan membalas dengan pengakuan.
    - Direktif hanya diterapkan untuk **pengirim yang berwenang**. Jika `commands.allowFrom` disetel, itu menjadi satu-satunya daftar izin yang digunakan; jika tidak, otorisasi berasal dari daftar izin/pairing channel plus `commands.useAccessGroups`. Pengirim tanpa otorisasi melihat direktif diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Pintasan inline">
    Hanya pengirim yang ada dalam daftar izin/berwenang: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Perintah ini langsung dijalankan, dihapus sebelum model melihat pesan, dan teks yang tersisa berlanjut melalui alur normal.

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
  Mendaftarkan perintah native. Otomatis: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan slash command); diabaikan untuk penyedia tanpa dukungan native. Setel `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk menimpa per penyedia (bool atau `"auto"`). Di Discord, `false` melewati pendaftaran slash-command dan pembersihan saat startup; perintah yang sebelumnya terdaftar mungkin tetap terlihat sampai Anda menghapusnya dari aplikasi Discord. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
</ParamField>
Di Discord, spesifikasi perintah native dapat menyertakan `descriptionLocalizations`, yang diterbitkan OpenClaw sebagai `description_localizations` Discord dan disertakan dalam perbandingan rekonsiliasi.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah **skill** secara native saat didukung. Otomatis: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack memerlukan pembuatan slash command per skill). Setel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk menimpa per penyedia (bool atau `"auto"`).
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
  Mengaktifkan `/debug` (override khusus runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Mengaktifkan `/restart` plus aksi alat restart gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Menetapkan daftar izin owner eksplisit untuk surface perintah/alat khusus owner. Ini adalah akun operator manusia yang dapat menyetujui aksi berbahaya dan menjalankan perintah seperti `/diagnostics`, `/export-trajectory`, dan `/config`. Ini terpisah dari `commands.allowFrom` dan dari akses pairing DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per channel: membuat perintah khusus owner memerlukan **identitas owner** untuk berjalan pada surface tersebut. Saat `true`, pengirim harus cocok dengan kandidat owner yang terselesaikan (misalnya entri dalam `commands.ownerAllowFrom` atau metadata owner native penyedia) atau memiliki scope internal `operator.admin` pada channel pesan internal. Entri wildcard dalam channel `allowFrom`, atau daftar kandidat owner yang kosong/tidak terselesaikan, **tidak** cukup — perintah khusus owner gagal secara tertutup pada channel tersebut. Biarkan ini nonaktif jika Anda ingin perintah khusus owner hanya dijaga oleh `ownerAllowFrom` dan daftar izin perintah standar.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Mengontrol bagaimana id owner muncul dalam prompt sistem.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Secara opsional menetapkan secret HMAC yang digunakan saat `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Daftar izin per penyedia untuk otorisasi perintah. Saat dikonfigurasi, ini menjadi satu-satunya sumber otorisasi untuk perintah dan direktif (daftar izin/pairing channel dan `commands.useAccessGroups` diabaikan). Gunakan `"*"` untuk default global; kunci khusus penyedia menimpanya.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Menerapkan daftar izin/kebijakan untuk perintah saat `commands.allowFrom` tidak disetel.
</ParamField>

## Daftar perintah

Sumber kebenaran saat ini:

- bawaan inti berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah plugin berasal dari panggilan `registerCommand()` plugin
- ketersediaan aktual pada gateway Anda tetap bergantung pada flag konfigurasi, surface channel, dan plugin yang terinstal/diaktifkan

### Perintah bawaan inti

<AccordionGroup>
  <Accordion title="Sesi dan run">
    - `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
    - Control UI mencegat `/new` yang diketik untuk membuat dan beralih ke sesi dasbor baru; `/reset` yang diketik tetap menjalankan reset in-place milik Gateway.
    - `/reset soft [message]` mempertahankan transkrip saat ini, membuang id sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/system-prompt secara in-place.
    - `/compact [instructions]` memadatkan konteks sesi. Lihat [Compaction](/id/concepts/compaction).
    - `/stop` membatalkan run saat ini.
    - `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa pengikatan thread.
    - `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
    - `/export-trajectory [path]` meminta persetujuan exec, lalu mengekspor [bundel trajektori](/id/tools/trajectory) JSONL untuk sesi saat ini. Gunakan saat Anda memerlukan timeline prompt, alat, dan transkrip untuk satu sesi OpenClaw. Dalam chat grup, prompt persetujuan dan hasil ekspor dikirim secara privat ke owner. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Kontrol model dan run">
    - `/think <level>` menetapkan level berpikir. Opsi berasal dari profil penyedia model aktif; level umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan level kustom seperti `xhigh`, `adaptive`, `max`, atau biner `on` hanya jika didukung. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` mengaktifkan/menonaktifkan output verbose. Alias: `/v`.
    - `/trace on|off` mengaktifkan/menonaktifkan output trace plugin untuk sesi saat ini.
    - `/fast [status|on|off]` menampilkan atau menyetel mode cepat.
    - `/reasoning [on|off|stream]` mengaktifkan/menonaktifkan visibilitas reasoning. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` mengaktifkan/menonaktifkan mode elevated. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau menyetel default exec.
    - `/model [name|#|status]` menampilkan atau menyetel model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan penyedia yang dikonfigurasi/tersedia-auth atau model untuk suatu penyedia; tambahkan `all` untuk menelusuri katalog lengkap penyedia tersebut.
    - `/queue <mode>` mengelola perilaku antrean (`steer`, `queue` legacy, `followup`, `collect`, `steer-backlog`, `interrupt`) plus opsi seperti `debounce:0.5s cap:25 drop:summarize`; `/queue default` atau `/queue reset` menghapus override sesi. Lihat [Antrean perintah](/id/concepts/queue) dan [Antrean steering](/id/concepts/queue-steering).
    - `/steer <message>` menyuntikkan panduan ke run aktif untuk sesi saat ini, terlepas dari mode `/queue`. Ini tidak memulai run baru saat sesi idle. Alias: `/tell`. Lihat [Steer](/id/tools/steer).

  </Accordion>
  <Accordion title="Penemuan dan status">
    - `/help` menampilkan ringkasan bantuan singkat.
    - `/commands` menampilkan katalog perintah yang dihasilkan.
    - `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agen saat ini sekarang.
    - `/status` menampilkan status eksekusi/runtime, uptime Gateway dan sistem, plus penggunaan/kuota penyedia saat tersedia.
    - `/diagnostics [note]` adalah alur laporan dukungan khusus owner untuk bug Gateway dan run harness Codex. Ini meminta persetujuan exec eksplisit setiap kali sebelum menjalankan `openclaw gateway diagnostics export --json`; jangan setujui diagnostik dengan aturan izinkan-semua. Setelah persetujuan, ini mengirim laporan yang dapat ditempel dengan path bundel lokal, ringkasan manifest, catatan privasi, dan id sesi yang relevan. Dalam chat grup, prompt persetujuan dan laporan dikirim secara privat ke owner. Saat sesi aktif menggunakan harness OpenAI Codex, persetujuan yang sama juga mengirim feedback Codex yang relevan ke server OpenAI dan balasan selesai mencantumkan id sesi OpenClaw, id thread Codex, dan perintah `codex resume <thread-id>`. Lihat [Ekspor Diagnostik](/id/gateway/diagnostics).
    - `/crestodian <request>` menjalankan pembantu penyiapan dan perbaikan Crestodian dari DM owner.
    - `/tasks` mencantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini.
    - `/context [list|detail|json]` menjelaskan bagaimana konteks dirakit.
    - `/whoami` menampilkan id pengirim Anda. Alias: `/id`.
    - `/usage off|tokens|full|cost` mengontrol footer penggunaan per respons atau mencetak ringkasan biaya lokal.

  </Accordion>
  <Accordion title="Skills, daftar izin, persetujuan">
    - `/skill <name> [input]` menjalankan skill berdasarkan nama.
    - `/allowlist [list|add|remove] ...` mengelola entri daftar izin. Khusus teks.
    - `/approve <id> <decision>` menyelesaikan prompt persetujuan exec.
    - `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi mendatang. Alias: `/side`. Lihat [BTW](/id/tools/btw).

  </Accordion>
  <Accordion title="Subagen dan ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` mengelola proses sub-agen untuk sesi saat ini.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
    - `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
    - `/unfocus` menghapus ikatan saat ini.
    - `/agents` mencantumkan agen yang terikat thread untuk sesi saat ini.
    - `/kill <id|#|all>` membatalkan satu atau semua sub-agen yang sedang berjalan.
    - `/subagents steer <id|#> <message>` mengirim arahan ke sub-agen yang sedang berjalan. Lihat [Steer](/id/tools/steer).

  </Accordion>
  <Accordion title="Penulisan khusus pemilik dan admin">
    - `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Khusus pemilik. Memerlukan `commands.config: true`.
    - `/mcp show|get|set|unset` membaca atau menulis konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus pemilik. Memerlukan `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau mengubah status plugin. `/plugin` adalah alias. Khusus pemilik untuk penulisan. Memerlukan `commands.plugins: true`.
    - `/debug show|set|unset|reset` mengelola penggantian konfigurasi khusus runtime. Khusus pemilik. Memerlukan `commands.debug: true`.
    - `/restart` memulai ulang OpenClaw saat diaktifkan. Default: aktif; atur `commands.restart: false` untuk menonaktifkannya.
    - `/send on|off|inherit` menetapkan kebijakan pengiriman. Khusus pemilik.

  </Accordion>
  <Accordion title="Suara, TTS, kontrol kanal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` mengontrol TTS. Lihat [TTS](/id/tools/tts).
    - `/activation mention|always` menetapkan mode aktivasi grup.
    - `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` plus daftar izin `tools.elevated`.
    - `!poll [sessionId]` memeriksa pekerjaan bash latar belakang.
    - `!stop [sessionId]` menghentikan pekerjaan bash latar belakang.

  </Accordion>
</AccordionGroup>

### Perintah dock yang dihasilkan

Perintah dock mengalihkan rute balasan sesi saat ini ke kanal tertaut lain. Lihat [Docking kanal](/id/concepts/channel-docking) untuk penyiapan, contoh, dan pemecahan masalah.

Perintah dock dihasilkan dari plugin kanal dengan dukungan perintah native. Set bundel saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Gunakan perintah dock dari chat langsung untuk mengalihkan rute balasan sesi saat ini ke kanal tertaut lain. Agen mempertahankan konteks sesi yang sama, tetapi balasan mendatang untuk sesi tersebut dikirim ke rekan kanal yang dipilih.

Perintah dock memerlukan `session.identityLinks`. Pengirim sumber dan rekan target harus berada dalam grup identitas yang sama, misalnya `["telegram:123", "discord:456"]`. Jika pengguna Telegram dengan id `123` mengirim `/dock_discord`, OpenClaw menyimpan `lastChannel: "discord"` dan `lastTo: "456"` pada sesi aktif. Jika pengirim tidak tertaut ke rekan Discord, perintah membalas dengan petunjuk penyiapan alih-alih masuk ke chat normal.

Docking hanya mengubah rute sesi aktif. Ini tidak membuat akun kanal, memberikan akses, melewati daftar izin kanal, atau memindahkan riwayat transkrip ke sesi lain. Gunakan `/dock-telegram`, `/dock-slack`, `/dock-mattermost`, atau perintah dock lain yang dihasilkan untuk mengalihkan rute lagi.

### Perintah plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak perintah slash. Perintah bawaan saat ini dalam repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan/menonaktifkan dreaming memori. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pemasangan/penyiapan perangkat. Lihat [Pemasangan](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` mempersenjatai sementara perintah node ponsel berisiko tinggi.
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

Skill yang dapat dipanggil pengguna juga diekspos sebagai perintah slash:

- `/skill <name> [input]` selalu berfungsi sebagai entrypoint generik.
- skill juga dapat muncul sebagai perintah langsung seperti `/prose` saat skill/plugin mendaftarkannya.
- pendaftaran perintah skill native dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.
- spesifikasi perintah dapat menyediakan `descriptionLocalizations` untuk permukaan native yang mendukung deskripsi terlokalisasi, termasuk Discord.

<AccordionGroup>
  <Accordion title="Catatan argumen dan parser">
    - Perintah menerima `:` opsional antara perintah dan argumen (mis. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` menerima alias model, `provider/model`, atau nama penyedia (pencocokan fuzzy); jika tidak ada kecocokan, teks diperlakukan sebagai isi pesan.
    - Untuk rincian penggunaan penyedia lengkap, gunakan `openclaw status --usage`.
    - `/allowlist add|remove` memerlukan `commands.config=true` dan menghormati `configWrites` kanal.
    - Di kanal multi-akun, `/allowlist --account <id>` yang menargetkan konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga menghormati `configWrites` akun target.
    - `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
    - `/restart` diaktifkan secara default; atur `commands.restart: false` untuk menonaktifkannya.
    - `/plugins install <spec>` menerima spesifikasi plugin yang sama seperti `openclaw plugins install`: path/arsip lokal, paket npm, `git:<repo>`, atau `clawhub:<pkg>`, lalu meminta mulai ulang Gateway karena modul sumber plugin berubah.
    - `/plugins enable|disable` memperbarui konfigurasi plugin dan memicu pemuatan ulang plugin Gateway untuk giliran agen baru.

  </Accordion>
  <Accordion title="Perilaku khusus kanal">
    - Perintah native khusus Discord: `/vc join|leave|status` mengontrol kanal suara (tidak tersedia sebagai teks). `join` memerlukan guild dan kanal suara/stage yang dipilih. Memerlukan `channels.discord.voice` dan perintah native.
    - Perintah pengikatan thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan ikatan thread efektif untuk diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
    - Referensi perintah ACP dan perilaku runtime: [Agen ACP](/id/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / keamanan reasoning">
    - `/verbose` ditujukan untuk debugging dan visibilitas tambahan; tetap **nonaktifkan** dalam penggunaan normal.
    - `/trace` lebih sempit daripada `/verbose`: hanya mengungkap baris trace/debug milik plugin dan menjaga chatter alat verbose normal tetap nonaktif.
    - `/fast on|off` mempertahankan penggantian sesi. Gunakan opsi `inherit` di UI Sessions untuk menghapusnya dan kembali ke default konfigurasi.
    - `/fast` bersifat khusus penyedia: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses native, sementara permintaan Anthropic publik langsung, termasuk lalu lintas terautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
    - Ringkasan kegagalan alat masih ditampilkan saat relevan, tetapi teks kegagalan detail hanya disertakan saat `/verbose` adalah `on` atau `full`.
    - `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: semuanya dapat mengungkap reasoning internal, output alat, atau diagnostik plugin yang tidak Anda maksudkan untuk diekspos. Sebaiknya biarkan nonaktif, terutama di chat grup.

  </Accordion>
  <Accordion title="Pengalihan model">
    - `/model` segera mempertahankan model sesi baru.
    - Jika agen idle, proses berikutnya langsung menggunakannya.
    - Jika proses sudah aktif, OpenClaw menandai pengalihan live sebagai tertunda dan hanya memulai ulang ke model baru pada titik coba ulang yang bersih.
    - Jika aktivitas alat atau output balasan sudah dimulai, pengalihan tertunda dapat tetap dalam antrean hingga peluang coba ulang berikutnya atau giliran pengguna berikutnya.
    - Dalam TUI lokal, `/crestodian [request]` kembali dari TUI agen normal ke Crestodian. Ini terpisah dari mode penyelamatan kanal pesan dan tidak memberikan otoritas konfigurasi jarak jauh.

  </Accordion>
  <Accordion title="Jalur cepat dan pintasan inline">
    - **Jalur cepat:** pesan khusus perintah dari pengirim yang ada di daftar izin ditangani segera (melewati antrean + model).
    - **Gating mention grup:** pesan khusus perintah dari pengirim yang ada di daftar izin melewati persyaratan mention.
    - **Pintasan inline (hanya pengirim yang ada di daftar izin):** perintah tertentu juga berfungsi saat disematkan dalam pesan normal dan dihapus sebelum model melihat teks yang tersisa.
      - Contoh: `hey /status` memicu balasan status, dan teks yang tersisa berlanjut melalui alur normal.
    - Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Pesan khusus perintah tanpa otorisasi diabaikan secara diam-diam, dan token `/...` inline diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Perintah skill dan argumen native">
    - **Perintah skill:** skill `user-invocable` diekspos sebagai perintah slash. Nama dibersihkan menjadi `a-z0-9_` (maks 32 karakter); tabrakan mendapat sufiks numerik (mis. `_2`).
      - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna saat batas perintah native mencegah perintah per skill).
      - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
      - Skills dapat secara opsional mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke alat (deterministik, tanpa model).
      - Contoh: `/prose` (plugin OpenProse) — lihat [OpenProse](/id/prose).
    - **Argumen perintah native:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen wajib). Telegram dan Slack menampilkan menu tombol saat perintah mendukung pilihan dan Anda menghilangkan argumennya. Pilihan dinamis diselesaikan terhadap model sesi target, sehingga opsi khusus model seperti level `/think` mengikuti penggantian `/model` sesi tersebut.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan konfigurasi: **apa yang dapat digunakan agen ini saat ini dalam percakapan ini**.

- `/tools` default ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Permukaan perintah native yang mendukung argumen mengekspos pengalihan mode yang sama sebagai `compact|verbose`.
- Hasil bersifat tercakup sesi, sehingga mengubah agen, kanal, thread, otorisasi pengirim, atau model dapat mengubah output.
- `/tools` menyertakan alat yang benar-benar dapat dijangkau saat runtime, termasuk alat inti, alat plugin yang terhubung, dan alat milik kanal.

Untuk pengeditan profil dan penggantian, gunakan panel Tools UI Kontrol atau permukaan config/catalog alih-alih memperlakukan `/tools` sebagai katalog statis.

## Permukaan penggunaan (yang ditampilkan di mana)

- **Penggunaan/kuota penyedia** (contoh: "Claude tersisa 80%") muncul di `/status` untuk penyedia model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela penyedia menjadi `% tersisa`; untuk MiniMax, kolom persentase hanya-sisa dibalik sebelum ditampilkan, dan respons `model_remains` memprioritaskan entri model chat plus label paket bertag model.
- **Baris token/cache** di `/status` dapat kembali ke entri penggunaan transkrip terbaru ketika snapshot sesi live minim. Nilai live bukan nol yang ada tetap menang, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total berorientasi prompt yang lebih besar ketika total tersimpan hilang atau lebih kecil.
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

- `/model` dan `/model list` menampilkan pemilih ringkas bernomor (keluarga model + penyedia yang tersedia).
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan model plus langkah Submit.
- `/model <#>` memilih dari pemilih tersebut (dan memprioritaskan penyedia saat ini bila memungkinkan).
- `/model status` menampilkan tampilan detail, termasuk endpoint penyedia yang dikonfigurasi (`baseUrl`) dan mode API (`api`) bila tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override konfigurasi **khusus runtime** (memori, bukan disk). Khusus owner. Dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Override langsung berlaku pada pembacaan konfigurasi baru, tetapi **tidak** ditulis ke `openclaw.json`. Gunakan `/debug reset` untuk menghapus semua override dan kembali ke konfigurasi di disk.
</Note>

## Output trace Plugin

`/trace` memungkinkan Anda mengaktifkan atau menonaktifkan **baris trace/debug Plugin bercakupan sesi** tanpa mengaktifkan mode verbose penuh.

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

`/config` menulis ke konfigurasi di disk Anda (`openclaw.json`). Khusus owner. Dinonaktifkan secara default; aktifkan dengan `commands.config: true`.

Contoh:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Konfigurasi divalidasi sebelum ditulis; perubahan yang tidak valid ditolak. Pembaruan `/config` bertahan setelah restart.
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
`/mcp` menyimpan konfigurasi dalam konfigurasi OpenClaw, bukan pengaturan proyek milik Pi. Adapter runtime menentukan transport mana yang benar-benar dapat dieksekusi.
</Note>

## Pembaruan Plugin

`/plugins` memungkinkan operator memeriksa Plugin yang ditemukan dan mengaktifkan atau menonaktifkannya dalam konfigurasi. Alur baca-saja dapat menggunakan `/plugin` sebagai alias. Dinonaktifkan secara default; aktifkan dengan `commands.plugins: true`.

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
- `/plugins enable|disable` hanya memperbarui konfigurasi Plugin; perintah ini tidak menginstal atau menghapus instalasi Plugin.
- Perubahan aktifkan dan nonaktifkan memuat ulang secara hot-reload permukaan runtime Plugin Gateway untuk giliran agen baru; instalasi meminta restart Gateway karena modul sumber Plugin berubah.

</Note>

## Catatan permukaan

<AccordionGroup>
  <Accordion title="Sesi per permukaan">
    - **Perintah teks** berjalan dalam sesi chat normal (DM berbagi `main`, grup memiliki sesi masing-masing).
    - **Perintah native** menggunakan sesi terisolasi:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
    - **`/stop`** menargetkan sesi chat aktif agar dapat membatalkan proses yang sedang berjalan.

  </Accordion>
  <Accordion title="Khusus Slack">
    `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu perintah slash Slack untuk setiap perintah bawaan (nama sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.

    Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.

  </Accordion>
</AccordionGroup>

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini. `/side` adalah alias.

Tidak seperti chat normal:

- perintah ini menggunakan sesi saat ini sebagai konteks latar belakang,
- perintah ini berjalan sebagai panggilan sekali jalan **tanpa alat** yang terpisah,
- perintah ini tidak mengubah konteks sesi mendatang,
- perintah ini tidak ditulis ke riwayat transkrip,
- perintah ini dikirim sebagai hasil sampingan live, bukan pesan asisten normal.

Itu membuat `/btw` berguna ketika Anda ingin klarifikasi sementara selagi tugas utama tetap berjalan.

Contoh:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Lihat [Pertanyaan Sampingan BTW](/id/tools/btw) untuk perilaku lengkap dan detail UX klien.

## Terkait

- [Membuat Skills](/id/tools/creating-skills)
- [Skills](/id/tools/skills)
- [Konfigurasi Skills](/id/tools/skills-config)
