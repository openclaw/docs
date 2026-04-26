---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug perutean atau izin perintah chat
sidebarTitle: Slash commands
summary: 'Slash command: teks vs bawaan, config, dan perintah yang didukung'
title: Slash command
x-i18n:
    generated_at: "2026-04-26T11:41:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang diawali dengan `/`. Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Saat percakapan atau thread terikat ke sesi ACP, teks tindak lanjut normal dirutekan ke harness ACP tersebut. Perintah manajemen Gateway tetap lokal: `/acp ...` selalu mencapai handler perintah ACP OpenClaw, dan `/status` plus `/unfocus` tetap lokal kapan pun penanganan perintah diaktifkan untuk surface tersebut.

Ada dua sistem terkait:

<AccordionGroup>
  <Accordion title="Perintah">
    Pesan `/...` mandiri.
  </Accordion>
  <Accordion title="Direktif">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Direktif dihapus dari pesan sebelum model melihatnya.
    - Dalam pesan chat normal (bukan hanya-direktif), direktif diperlakukan sebagai "petunjuk inline" dan **tidak** mempertahankan pengaturan sesi.
    - Dalam pesan hanya-direktif (pesan hanya berisi direktif), direktif dipertahankan ke sesi dan membalas dengan acknowledgement.
    - Direktif hanya diterapkan untuk **pengirim yang berwenang**. Jika `commands.allowFrom` disetel, itu adalah satu-satunya allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing saluran plus `commands.useAccessGroups`. Pengirim yang tidak berwenang akan melihat direktif diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Shortcut inline">
    Hanya untuk pengirim yang ada di allowlist/berwenang: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Shortcut ini berjalan segera, dihapus sebelum model melihat pesan, dan teks sisanya berlanjut melalui alur normal.

  </Accordion>
</AccordionGroup>

## Config

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
  Mengaktifkan parsing `/...` dalam pesan chat. Pada surface tanpa perintah bawaan (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi bahkan jika Anda menyetelnya ke `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah bawaan. Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan slash command); diabaikan untuk provider tanpa dukungan bawaan. Setel `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk menimpa per provider (bool atau `"auto"`). `false` menghapus perintah yang sebelumnya terdaftar di Discord/Telegram saat startup. Perintah Slack dikelola dalam aplikasi Slack dan tidak dihapus secara otomatis.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah **skill** secara bawaan saat didukung. Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack memerlukan pembuatan satu slash command per skill). Setel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk menimpa per provider (bool atau `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan allowlist `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Mengontrol berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung ke latar belakang).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Mengaktifkan `/config` (membaca/menulis `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Mengaktifkan `/mcp` (membaca/menulis config MCP yang dikelola OpenClaw di bawah `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Mengaktifkan `/plugins` (penemuan/status Plugin plus kontrol instalasi + aktif/nonaktif).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Mengaktifkan `/debug` (override hanya-runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Mengaktifkan `/restart` plus aksi tool restart gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Menetapkan allowlist pemilik eksplisit untuk surface perintah/tool khusus pemilik. Terpisah dari `commands.allowFrom`.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per saluran: membuat perintah khusus pemilik memerlukan **identitas pemilik** untuk berjalan pada surface tersebut. Saat `true`, pengirim harus cocok dengan kandidat pemilik yang telah di-resolve (misalnya entri di `commands.ownerAllowFrom` atau metadata pemilik bawaan provider) atau memiliki scope internal `operator.admin` pada saluran pesan internal. Entri wildcard dalam `allowFrom` saluran, atau daftar kandidat pemilik yang kosong/tidak ter-resolve, **tidak** cukup — perintah khusus pemilik gagal tertutup pada saluran tersebut. Biarkan ini nonaktif jika Anda ingin perintah khusus pemilik hanya di-gate oleh `ownerAllowFrom` dan allowlist perintah standar.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Mengontrol bagaimana id pemilik muncul dalam prompt sistem.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Secara opsional menetapkan secret HMAC yang digunakan saat `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per-provider untuk otorisasi perintah. Saat dikonfigurasi, ini menjadi satu-satunya sumber otorisasi untuk perintah dan direktif (allowlist/pairing saluran dan `commands.useAccessGroups` diabaikan). Gunakan `"*"` untuk default global; kunci khusus provider menimpanya.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Menegakkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak disetel.
</ParamField>

## Daftar perintah

Sumber kebenaran saat ini:

- built-in core berasal dari `src/auto-reply/commands-registry.shared.ts`
- perintah dock yang dihasilkan berasal dari `src/auto-reply/commands-registry.data.ts`
- perintah Plugin berasal dari panggilan Plugin `registerCommand()`
- ketersediaan aktual di gateway Anda tetap bergantung pada flag config, surface saluran, dan Plugin yang terinstal/diaktifkan

### Perintah built-in core

<AccordionGroup>
  <Accordion title="Sesi dan run">
    - `/new [model]` memulai sesi baru; `/reset` adalah alias reset.
    - `/reset soft [message]` mempertahankan transkrip saat ini, menghapus id sesi backend CLI yang digunakan ulang, dan menjalankan ulang pemuatan startup/prompt sistem di tempat.
    - `/compact [instructions]` melakukan Compaction pada konteks sesi. Lihat [Compaction](/id/concepts/compaction).
    - `/stop` membatalkan run saat ini.
    - `/session idle <duration|off>` dan `/session max-age <duration|off>` mengelola kedaluwarsa thread-binding.
    - `/export-session [path]` mengekspor sesi saat ini ke HTML. Alias: `/export`.
    - `/export-trajectory [path]` mengekspor [bundle trajectory](/id/tools/trajectory) JSONL untuk sesi saat ini. Alias: `/trajectory`.
  </Accordion>
  <Accordion title="Kontrol model dan run">
    - `/think <level>` menetapkan level thinking. Opsi berasal dari profil provider model aktif; level umum adalah `off`, `minimal`, `low`, `medium`, dan `high`, dengan level kustom seperti `xhigh`, `adaptive`, `max`, atau `on` biner hanya jika didukung. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` mengaktifkan/menonaktifkan output verbose. Alias: `/v`.
    - `/trace on|off` mengaktifkan/menonaktifkan output trace Plugin untuk sesi saat ini.
    - `/fast [status|on|off]` menampilkan atau menetapkan mode cepat.
    - `/reasoning [on|off|stream]` mengaktifkan/menonaktifkan visibilitas reasoning. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` mengaktifkan/menonaktifkan mode elevated. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` menampilkan atau menetapkan default exec.
    - `/model [name|#|status]` menampilkan atau menetapkan model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` mencantumkan provider atau model untuk sebuah provider.
    - `/queue <mode>` mengelola perilaku antrean (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus opsi seperti `debounce:2s cap:25 drop:summarize`.
  </Accordion>
  <Accordion title="Penemuan dan status">
    - `/help` menampilkan ringkasan bantuan singkat.
    - `/commands` menampilkan katalog perintah yang dihasilkan.
    - `/tools [compact|verbose]` menampilkan apa yang dapat digunakan agent saat ini.
    - `/status` menampilkan status eksekusi/runtime, termasuk label `Execution`/`Runtime` dan penggunaan/kuota provider saat tersedia.
    - `/crestodian <request>` menjalankan helper penyiapan dan perbaikan Crestodian dari DM pemilik.
    - `/tasks` mencantumkan task latar belakang aktif/terbaru untuk sesi saat ini.
    - `/context [list|detail|json]` menjelaskan bagaimana konteks dirakit.
    - `/whoami` menampilkan id pengirim Anda. Alias: `/id`.
    - `/usage off|tokens|full|cost` mengontrol footer penggunaan per-respons atau mencetak ringkasan biaya lokal.
  </Accordion>
  <Accordion title="Skills, allowlist, persetujuan">
    - `/skill <name> [input]` menjalankan skill berdasarkan nama.
    - `/allowlist [list|add|remove] ...` mengelola entri allowlist. Hanya teks.
    - `/approve <id> <decision>` menyelesaikan prompt persetujuan exec.
    - `/btw <question>` mengajukan pertanyaan sampingan tanpa mengubah konteks sesi di masa depan. Lihat [BTW](/id/tools/btw).
  </Accordion>
  <Accordion title="Subagent dan ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` mengelola run sub-agent untuk sesi saat ini.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` mengelola sesi ACP dan opsi runtime.
    - `/focus <target>` mengikat thread Discord atau topik/percakapan Telegram saat ini ke target sesi.
    - `/unfocus` menghapus binding saat ini.
    - `/agents` mencantumkan agent yang terikat thread untuk sesi saat ini.
    - `/kill <id|#|all>` membatalkan satu atau semua sub-agent yang sedang berjalan.
    - `/steer <id|#> <message>` mengirim steering ke sub-agent yang sedang berjalan. Alias: `/tell`.
  </Accordion>
  <Accordion title="Penulisan khusus pemilik dan admin">
    - `/config show|get|set|unset` membaca atau menulis `openclaw.json`. Khusus pemilik. Memerlukan `commands.config: true`.
    - `/mcp show|get|set|unset` membaca atau menulis config server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus pemilik. Memerlukan `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` memeriksa atau memutasi state Plugin. `/plugin` adalah alias. Khusus pemilik untuk penulisan. Memerlukan `commands.plugins: true`.
    - `/debug show|set|unset|reset` mengelola override config hanya-runtime. Khusus pemilik. Memerlukan `commands.debug: true`.
    - `/restart` memulai ulang OpenClaw saat diaktifkan. Default: aktif; setel `commands.restart: false` untuk menonaktifkannya.
    - `/send on|off|inherit` menetapkan kebijakan kirim. Khusus pemilik.
  </Accordion>
  <Accordion title="Voice, TTS, kontrol saluran">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` mengontrol TTS. Lihat [TTS](/id/tools/tts).
    - `/activation mention|always` menetapkan mode aktivasi grup.
    - `/bash <command>` menjalankan perintah shell host. Hanya teks. Alias: `! <command>`. Memerlukan `commands.bash: true` plus allowlist `tools.elevated`.
    - `!poll [sessionId]` memeriksa pekerjaan bash latar belakang.
    - `!stop [sessionId]` menghentikan pekerjaan bash latar belakang.
  </Accordion>
</AccordionGroup>

### Perintah dock yang dihasilkan

Perintah dock dihasilkan dari Plugin saluran dengan dukungan native-command. Set bawaan saat ini:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Perintah Plugin bawaan

Plugin bawaan dapat menambahkan lebih banyak slash command. Perintah bawaan saat ini di repo ini:

- `/dreaming [on|off|status|help]` mengaktifkan/menonaktifkan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` mengelola alur pairing/penyiapan perangkat. Lihat [Pairing](/id/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` mengaktifkan sementara perintah node ponsel berisiko tinggi.
- `/voice status|list [limit]|set <voiceId|name>` mengelola config voice Talk. Di Discord, nama perintah bawaan adalah `/talkvoice`.
- `/card ...` mengirim preset rich card LINE. Lihat [LINE](/id/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` memeriksa dan mengontrol harness app-server Codex bawaan. Lihat [Harness Codex](/id/plugins/codex-harness).
- Perintah khusus QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Perintah Skill dinamis

Skills yang dapat dipanggil pengguna juga diekspos sebagai slash command:

- `/skill <name> [input]` selalu berfungsi sebagai entrypoint generik.
- skill juga dapat muncul sebagai perintah langsung seperti `/prose` saat skill/Plugin mendaftarkannya.
- pendaftaran perintah skill bawaan dikontrol oleh `commands.nativeSkills` dan `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Catatan argumen dan parser">
    - Perintah menerima `:` opsional antara perintah dan argumen (misalnya `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` menerima alias model, `provider/model`, atau nama provider (fuzzy match); jika tidak ada kecocokan, teks diperlakukan sebagai body pesan.
    - Untuk rincian lengkap penggunaan provider, gunakan `openclaw status --usage`.
    - `/allowlist add|remove` memerlukan `commands.config=true` dan menghormati `configWrites` saluran.
    - Pada saluran multi-akun, `/allowlist --account <id>` yang ditargetkan ke config dan `/config set channels.<provider>.accounts.<id>...` juga menghormati `configWrites` akun target.
    - `/usage` mengontrol footer penggunaan per-respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
    - `/restart` aktif secara default; setel `commands.restart: false` untuk menonaktifkannya.
    - `/plugins install <spec>` menerima spec Plugin yang sama seperti `openclaw plugins install`: path/arsip lokal, package npm, atau `clawhub:<pkg>`.
    - `/plugins enable|disable` memperbarui config Plugin dan mungkin meminta restart.
  </Accordion>
  <Accordion title="Perilaku khusus saluran">
    - Perintah bawaan khusus Discord: `/vc join|leave|status` mengontrol saluran voice (tidak tersedia sebagai teks). `join` memerlukan guild dan saluran voice/stage yang dipilih. Memerlukan `channels.discord.voice` dan perintah bawaan.
    - Perintah Discord thread-binding (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan thread binding efektif untuk diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
    - Referensi perintah ACP dan perilaku runtime: [Agent ACP](/id/tools/acp-agents).
  </Accordion>
  <Accordion title="Keamanan verbose / trace / fast / reasoning">
    - `/verbose` ditujukan untuk debugging dan visibilitas tambahan; biarkan **off** dalam penggunaan normal.
    - `/trace` lebih sempit daripada `/verbose`: hanya mengungkap baris trace/debug milik Plugin dan menjaga chatter tool verbose normal tetap nonaktif.
    - `/fast on|off` mempertahankan override sesi. Gunakan opsi `inherit` di UI Sessions untuk menghapusnya dan fallback ke default config.
    - `/fast` bersifat khusus provider: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses bawaan, sementara permintaan Anthropic publik langsung, termasuk traffic yang diautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
    - Ringkasan kegagalan tool tetap ditampilkan saat relevan, tetapi teks kegagalan terperinci hanya disertakan saat `/verbose` bernilai `on` atau `full`.
    - `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup: mereka dapat mengungkap reasoning internal, output tool, atau diagnostik Plugin yang tidak ingin Anda tampilkan. Sebaiknya biarkan tetap nonaktif, terutama di obrolan grup.
  </Accordion>
  <Accordion title="Pergantian model">
    - `/model` mempertahankan model sesi baru secara langsung.
    - Jika agent sedang idle, run berikutnya langsung menggunakannya.
    - Jika run sudah aktif, OpenClaw menandai pergantian live sebagai tertunda dan hanya memulai ulang ke model baru pada titik coba-ulang yang bersih.
    - Jika aktivitas tool atau output balasan sudah dimulai, pergantian tertunda dapat tetap mengantre sampai ada kesempatan coba-ulang berikutnya atau giliran pengguna berikutnya.
    - Di TUI lokal, `/crestodian [request]` mengembalikan dari TUI agent normal ke Crestodian. Ini terpisah dari mode rescue message-channel dan tidak memberikan otoritas config jarak jauh.
  </Accordion>
  <Accordion title="Fast path dan shortcut inline">
    - **Fast path:** pesan hanya-perintah dari pengirim yang ada di allowlist ditangani segera (melewati antrean + model).
    - **Gating mention grup:** pesan hanya-perintah dari pengirim yang ada di allowlist melewati persyaratan mention.
    - **Shortcut inline (hanya pengirim yang ada di allowlist):** beberapa perintah juga berfungsi saat disisipkan dalam pesan normal dan dihapus sebelum model melihat teks sisanya.
      - Contoh: `hey /status` memicu balasan status, dan teks sisanya berlanjut melalui alur normal.
    - Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Pesan hanya-perintah yang tidak berwenang diabaikan secara diam-diam, dan token inline `/...` diperlakukan sebagai teks biasa.
  </Accordion>
  <Accordion title="Perintah skill dan argumen bawaan">
    - **Perintah skill:** Skills `user-invocable` diekspos sebagai slash command. Nama disanitasi menjadi `a-z0-9_` (maks 32 karakter); bentrokan mendapat sufiks numerik (misalnya `_2`).
      - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna saat batas perintah bawaan mencegah perintah per-skill).
      - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
      - Skill dapat secara opsional mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke tool (deterministik, tanpa model).
      - Contoh: `/prose` (Plugin OpenProse) — lihat [OpenProse](/id/prose).
    - **Argumen perintah bawaan:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen wajib). Telegram dan Slack menampilkan menu tombol saat suatu perintah mendukung pilihan dan Anda menghilangkan argumennya. Pilihan dinamis di-resolve terhadap model sesi target, sehingga opsi khusus model seperti level `/think` mengikuti override `/model` sesi tersebut.
  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan config: **apa yang dapat digunakan agent ini saat ini dalam percakapan ini**.

- `/tools` default ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Surface native-command yang mendukung argumen mengekspos sakelar mode yang sama sebagai `compact|verbose`.
- Hasilnya bercakupan sesi, jadi mengubah agent, saluran, thread, otorisasi pengirim, atau model dapat mengubah output.
- `/tools` mencakup tool yang benar-benar dapat dijangkau saat runtime, termasuk tool core, tool Plugin yang terhubung, dan tool milik saluran.

Untuk pengeditan profil dan override, gunakan panel Tools di Control UI atau surface config/katalog alih-alih memperlakukan `/tools` sebagai katalog statis.

## Surface penggunaan (apa yang ditampilkan di mana)

- **Penggunaan/kuota provider** (contoh: "Claude 80% left") muncul di `/status` untuk provider model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalisasi jendela provider ke `% left`; untuk MiniMax, field persen hanya-sisa dibalik sebelum ditampilkan, dan respons `model_remains` memilih entri model chat plus label plan bertag model.
- **Baris token/cache** di `/status` dapat fallback ke entri penggunaan transkrip terbaru ketika snapshot sesi live jarang. Nilai live nonzero yang sudah ada tetap menang, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total berorientasi prompt yang lebih besar ketika total tersimpan hilang atau lebih kecil.
- **Eksekusi vs runtime:** `/status` melaporkan `Execution` untuk jalur sandbox efektif dan `Runtime` untuk siapa yang benar-benar menjalankan sesi: `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP.
- **Token/biaya per-respons** dikontrol oleh `/usage off|tokens|full` (ditambahkan ke balasan normal).
- `/model status` adalah tentang **model/auth/endpoint**, bukan penggunaan.

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
- `/model <#>` memilih dari pemilih tersebut (dan memilih provider saat ini bila memungkinkan).
- `/model status` menampilkan tampilan terperinci, termasuk endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) saat tersedia.

## Override debug

`/debug` memungkinkan Anda menetapkan override config **hanya-runtime** (memori, bukan disk). Khusus pemilik. Dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Override berlaku segera untuk pembacaan config baru, tetapi **tidak** menulis ke `openclaw.json`. Gunakan `/debug reset` untuk menghapus semua override dan kembali ke config di disk.
</Note>

## Output trace Plugin

`/trace` memungkinkan Anda mengaktifkan/menonaktifkan **baris trace/debug Plugin bercakupan sesi** tanpa menyalakan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Catatan:

- `/trace` tanpa argumen menampilkan state trace sesi saat ini.
- `/trace on` mengaktifkan baris trace Plugin untuk sesi saat ini.
- `/trace off` menonaktifkannya kembali.
- Baris trace Plugin dapat muncul di `/status` dan sebagai pesan diagnostik tindak lanjut setelah balasan assistant normal.
- `/trace` tidak menggantikan `/debug`; `/debug` tetap mengelola override config hanya-runtime.
- `/trace` tidak menggantikan `/verbose`; output tool/status verbose normal tetap milik `/verbose`.

## Pembaruan config

`/config` menulis ke config di disk Anda (`openclaw.json`). Khusus pemilik. Dinonaktifkan secara default; aktifkan dengan `commands.config: true`.

Contoh:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
Config divalidasi sebelum ditulis; perubahan yang tidak valid akan ditolak. Pembaruan `/config` dipertahankan lintas restart.
</Note>

## Pembaruan MCP

`/mcp` menulis definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Khusus pemilik. Dinonaktifkan secara default; aktifkan dengan `commands.mcp: true`.

Contoh:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` menyimpan config dalam config OpenClaw, bukan pengaturan proyek milik Pi. Adapter runtime menentukan transport mana yang benar-benar dapat dieksekusi.
</Note>

## Pembaruan Plugin

`/plugins` memungkinkan operator memeriksa Plugin yang ditemukan dan mengaktifkan/menonaktifkannya di config. Alur hanya-baca dapat menggunakan `/plugin` sebagai alias. Dinonaktifkan secara default; aktifkan dengan `commands.plugins: true`.

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
- `/plugins enable|disable` hanya memperbarui config Plugin; ini tidak menginstal atau menghapus instalasi Plugin.
- Setelah perubahan enable/disable, mulai ulang gateway untuk menerapkannya.
</Note>

## Catatan surface

<AccordionGroup>
  <Accordion title="Sesi per surface">
    - **Perintah teks** berjalan dalam sesi chat normal (DM berbagi `main`, grup memiliki sesi sendiri).
    - **Perintah bawaan** menggunakan sesi terisolasi:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
    - **`/stop`** menargetkan sesi chat aktif sehingga dapat membatalkan run saat ini.
  </Accordion>
  <Accordion title="Khusus Slack">
    `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu slash command Slack per built-in command (nama yang sama seperti `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.

    Pengecualian bawaan Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi di pesan Slack.

  </Accordion>
</AccordionGroup>

## BTW side question

`/btw` adalah **side question** cepat tentang sesi saat ini.

Berbeda dari chat normal:

- perintah ini menggunakan sesi saat ini sebagai konteks latar belakang,
- perintah ini berjalan sebagai panggilan sekali pakai **tanpa tool** yang terpisah,
- perintah ini tidak mengubah konteks sesi di masa depan,
- perintah ini tidak ditulis ke riwayat transkrip,
- perintah ini dikirim sebagai hasil sampingan live alih-alih pesan assistant normal.

Itu membuat `/btw` berguna saat Anda menginginkan klarifikasi sementara sementara tugas utama tetap berjalan.

Contoh:

```text
/btw what are we doing right now?
```

Lihat [BTW Side Questions](/id/tools/btw) untuk perilaku lengkap dan detail UX klien.

## Terkait

- [Membuat skill](/id/tools/creating-skills)
- [Skills](/id/tools/skills)
- [Config Skills](/id/tools/skills-config)
