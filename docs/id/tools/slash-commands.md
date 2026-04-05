---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug perutean perintah atau izin
summary: 'Perintah slash: teks vs native, konfigurasi, dan perintah yang didukung'
title: Perintah Slash
x-i18n:
    generated_at: "2026-04-05T14:09:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c91437140732d9accca1094f07b9e05f861a75ac344531aa24cc2ffe000630f
    source_path: tools/slash-commands.md
    workflow: 15
---

# Perintah slash

Perintah ditangani oleh Gateway. Sebagian besar perintah harus dikirim sebagai pesan **mandiri** yang dimulai dengan `/`.
Perintah chat bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ada dua sistem terkait:

- **Perintah**: pesan `/...` mandiri.
- **Direktif**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Direktif dihapus dari pesan sebelum model melihatnya.
  - Dalam pesan chat normal (bukan hanya direktif), direktif diperlakukan sebagai “petunjuk inline” dan **tidak** mempertahankan pengaturan sesi.
  - Dalam pesan yang hanya berisi direktif (pesan hanya berisi direktif), direktif dipertahankan ke sesi dan dibalas dengan pengakuan.
  - Direktif hanya diterapkan untuk **pengirim yang berwenang**. Jika `commands.allowFrom` disetel, itulah satu-satunya
    allowlist yang digunakan; jika tidak, otorisasi berasal dari allowlist/pairing channel ditambah `commands.useAccessGroups`.
    Pengirim yang tidak berwenang akan melihat direktif diperlakukan sebagai teks biasa.

Ada juga beberapa **shortcut inline** (hanya pengirim yang di-allowlist/berwenang): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Shortcut ini dijalankan segera, dihapus sebelum model melihat pesan, dan teks yang tersisa melanjutkan ke alur normal.

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
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (default `true`) mengaktifkan parsing `/...` dalam pesan chat.
  - Pada permukaan tanpa perintah native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), perintah teks tetap berfungsi meskipun Anda menyetel ini ke `false`.
- `commands.native` (default `"auto"`) mendaftarkan perintah native.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (sampai Anda menambahkan slash command); diabaikan untuk penyedia tanpa dukungan native.
  - Setel `channels.discord.commands.native`, `channels.telegram.commands.native`, atau `channels.slack.commands.native` untuk menimpa per penyedia (bool atau `"auto"`).
  - `false` menghapus perintah yang sebelumnya terdaftar di Discord/Telegram saat startup. Perintah Slack dikelola di aplikasi Slack dan tidak dihapus secara otomatis.
- `commands.nativeSkills` (default `"auto"`) mendaftarkan perintah **skill** secara native saat didukung.
  - Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack (Slack memerlukan pembuatan satu slash command per skill).
  - Setel `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, atau `channels.slack.commands.nativeSkills` untuk menimpa per penyedia (bool atau `"auto"`).
- `commands.bash` (default `false`) mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (`/bash <cmd>` adalah alias; memerlukan allowlist `tools.elevated`).
- `commands.bashForegroundMs` (default `2000`) mengontrol berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung ke latar belakang).
- `commands.config` (default `false`) mengaktifkan `/config` (membaca/menulis `openclaw.json`).
- `commands.mcp` (default `false`) mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`).
- `commands.plugins` (default `false`) mengaktifkan `/plugins` (penemuan/status plugin serta kontrol install + aktifkan/nonaktifkan).
- `commands.debug` (default `false`) mengaktifkan `/debug` (penimpaan hanya runtime).
- `commands.allowFrom` (opsional) menetapkan allowlist per penyedia untuk otorisasi perintah. Saat dikonfigurasi, ini adalah
  satu-satunya sumber otorisasi untuk perintah dan direktif (allowlist/pairing channel dan `commands.useAccessGroups`
  diabaikan). Gunakan `"*"` untuk default global; kunci khusus penyedia menimpanya.
- `commands.useAccessGroups` (default `true`) menerapkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak disetel.

## Daftar perintah

Teks + native (saat diaktifkan):

- `/help`
- `/commands`
- `/tools [compact|verbose]` (tampilkan apa yang dapat digunakan agen saat ini sekarang juga; `verbose` menambahkan deskripsi)
- `/skill <name> [input]` (jalankan skill berdasarkan nama)
- `/status` (tampilkan status saat ini; mencakup penggunaan/kuota penyedia untuk penyedia model saat ini jika tersedia)
- `/tasks` (daftar tugas latar belakang untuk sesi saat ini; menampilkan detail tugas aktif dan terbaru dengan jumlah fallback lokal agen)
- `/allowlist` (daftar/tambah/hapus entri allowlist)
- `/approve <id> <decision>` (selesaikan prompt persetujuan exec; gunakan pesan persetujuan tertunda untuk keputusan yang tersedia)
- `/context [list|detail|json]` (jelaskan “konteks”; `detail` menampilkan ukuran per-file + per-tool + per-skill + system prompt)
- `/btw <question>` (ajukan pertanyaan sampingan ephemeral tentang sesi saat ini tanpa mengubah konteks sesi di masa mendatang; lihat [/tools/btw](/tools/btw))
- `/export-session [path]` (alias: `/export`) (ekspor sesi saat ini ke HTML dengan system prompt lengkap)
- `/whoami` (tampilkan sender id Anda; alias: `/id`)
- `/session idle <duration|off>` (kelola auto-unfocus karena tidak aktif untuk binding thread yang difokuskan)
- `/session max-age <duration|off>` (kelola auto-unfocus hard max-age untuk binding thread yang difokuskan)
- `/subagents list|kill|log|info|send|steer|spawn` (periksa, kendalikan, atau spawn run sub-agent untuk sesi saat ini)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (periksa dan kendalikan sesi runtime ACP)
- `/agents` (daftar agen yang terikat ke thread untuk sesi ini)
- `/focus <target>` (Discord: ikat thread ini, atau thread baru, ke target sesi/subagent)
- `/unfocus` (Discord: hapus binding thread saat ini)
- `/kill <id|#|all>` (segera hentikan satu atau semua sub-agent yang sedang berjalan untuk sesi ini; tanpa pesan konfirmasi)
- `/steer <id|#> <message>` (arahkan sub-agent yang sedang berjalan segera: di tengah run bila memungkinkan, jika tidak hentikan pekerjaan saat ini dan mulai ulang dengan pesan pengarah)
- `/tell <id|#> <message>` (alias untuk `/steer`)
- `/config show|get|set|unset` (pertahankan konfigurasi ke disk, hanya owner; memerlukan `commands.config: true`)
- `/mcp show|get|set|unset` (kelola konfigurasi server MCP OpenClaw, hanya owner; memerlukan `commands.mcp: true`)
- `/plugins list|show|get|install|enable|disable` (periksa plugin yang ditemukan, instal plugin baru, dan ubah status aktif; hanya owner untuk penulisan; memerlukan `commands.plugins: true`)
  - `/plugin` adalah alias untuk `/plugins`.
  - `/plugin install <spec>` menerima spesifikasi plugin yang sama seperti `openclaw plugins install`: path/archive lokal, paket npm, atau `clawhub:<pkg>`.
  - Penulisan aktifkan/nonaktifkan tetap membalas dengan petunjuk restart. Pada gateway foreground yang dipantau, OpenClaw dapat melakukan restart itu secara otomatis tepat setelah penulisan.
- `/debug show|set|unset|reset` (penimpaan runtime, hanya owner; memerlukan `commands.debug: true`)
- `/usage off|tokens|full|cost` (footer penggunaan per respons atau ringkasan biaya lokal)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (kendalikan TTS; lihat [/tts](/tools/tts))
  - Discord: perintah native adalah `/voice` (Discord mencadangkan `/tts`); teks `/tts` tetap berfungsi.
- `/stop`
- `/restart`
- `/dock-telegram` (alias: `/dock_telegram`) (alihkan balasan ke Telegram)
- `/dock-discord` (alias: `/dock_discord`) (alihkan balasan ke Discord)
- `/dock-slack` (alias: `/dock_slack`) (alihkan balasan ke Slack)
- `/activation mention|always` (khusus grup)
- `/send on|off|inherit` (hanya owner)
- `/reset` atau `/new [model]` (petunjuk model opsional; sisanya diteruskan)
- `/think <off|minimal|low|medium|high|xhigh>` (pilihan dinamis menurut model/penyedia; alias: `/thinking`, `/t`)
- `/fast status|on|off` (tanpa argumen menampilkan status mode cepat efektif saat ini)
- `/verbose on|full|off` (alias: `/v`)
- `/reasoning on|off|stream` (alias: `/reason`; saat aktif, mengirim pesan terpisah berawalan `Reasoning:`; `stream` = draft Telegram saja)
- `/elevated on|off|ask|full` (alias: `/elev`; `full` melewati persetujuan exec)
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (kirim `/exec` untuk menampilkan status saat ini)
- `/model <name>` (alias: `/models`; atau `/<alias>` dari `agents.defaults.models.*.alias`)
- `/queue <mode>` (ditambah opsi seperti `debounce:2s cap:25 drop:summarize`; kirim `/queue` untuk melihat pengaturan saat ini)
- `/bash <command>` (khusus host; alias untuk `! <command>`; memerlukan `commands.bash: true` + allowlist `tools.elevated`)
- `/dreaming [off|core|rem|deep|status|help]` (ubah mode dreaming atau tampilkan status; lihat [Dreaming](/id/concepts/memory-dreaming))

Hanya teks:

- `/compact [instructions]` (lihat [/concepts/compaction](/id/concepts/compaction))
- `! <command>` (khusus host; satu per satu; gunakan `!poll` + `!stop` untuk pekerjaan yang berjalan lama)
- `!poll` (periksa output / status; menerima `sessionId` opsional; `/bash poll` juga berfungsi)
- `!stop` (hentikan pekerjaan bash yang sedang berjalan; menerima `sessionId` opsional; `/bash stop` juga berfungsi)

Catatan:

- Perintah menerima `:` opsional antara perintah dan argumen (misalnya `/think: high`, `/send: on`, `/help:`).
- `/new <model>` menerima alias model, `provider/model`, atau nama penyedia (pencocokan fuzzy); jika tidak ada yang cocok, teks diperlakukan sebagai isi pesan.
- Untuk rincian lengkap penggunaan per penyedia, gunakan `openclaw status --usage`.
- `/allowlist add|remove` memerlukan `commands.config=true` dan menghormati `configWrites` channel.
- Di channel multi-akun, `/allowlist --account <id>` yang menargetkan konfigurasi dan `/config set channels.<provider>.accounts.<id>...` juga menghormati `configWrites` akun target.
- `/usage` mengontrol footer penggunaan per respons; `/usage cost` mencetak ringkasan biaya lokal dari log sesi OpenClaw.
- `/restart` aktif secara default; setel `commands.restart: false` untuk menonaktifkannya.
- Perintah native khusus Discord: `/vc join|leave|status` mengontrol channel suara (memerlukan `channels.discord.voice` dan perintah native; tidak tersedia sebagai teks).
- Perintah binding thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) memerlukan binding thread efektif diaktifkan (`session.threadBindings.enabled` dan/atau `channels.discord.threadBindings.enabled`).
- Referensi perintah ACP dan perilaku runtime: [ACP Agents](/tools/acp-agents).
- `/verbose` dimaksudkan untuk debugging dan visibilitas tambahan; biarkan **nonaktif** dalam penggunaan normal.
- `/fast on|off` mempertahankan penimpaan sesi. Gunakan opsi `inherit` di UI Sessions untuk menghapusnya dan kembali ke default konfigurasi.
- `/fast` bersifat khusus penyedia: OpenAI/OpenAI Codex memetakannya ke `service_tier=priority` pada endpoint Responses native, sedangkan permintaan Anthropic publik langsung, termasuk traffic terautentikasi OAuth yang dikirim ke `api.anthropic.com`, memetakannya ke `service_tier=auto` atau `standard_only`. Lihat [OpenAI](/id/providers/openai) dan [Anthropic](/id/providers/anthropic).
- Ringkasan kegagalan tool tetap ditampilkan saat relevan, tetapi teks kegagalan terperinci hanya disertakan ketika `/verbose` bernilai `on` atau `full`.
- `/reasoning` (dan `/verbose`) berisiko dalam pengaturan grup: keduanya dapat mengungkap reasoning internal atau output tool yang tidak ingin Anda tampilkan. Sebaiknya biarkan nonaktif, terutama di chat grup.
- `/model` langsung mempertahankan model sesi baru.
- Jika agen sedang idle, run berikutnya langsung menggunakannya.
- Jika run sudah aktif, OpenClaw menandai live switch sebagai tertunda dan hanya restart ke model baru pada titik retry yang bersih.
- Jika aktivitas tool atau output balasan sudah dimulai, perpindahan tertunda dapat tetap antre hingga peluang retry berikutnya atau giliran pengguna berikutnya.
- **Jalur cepat:** pesan yang hanya berisi perintah dari pengirim yang di-allowlist ditangani segera (melewati antrean + model).
- **Penyaringan mention grup:** pesan yang hanya berisi perintah dari pengirim yang di-allowlist melewati persyaratan mention.
- **Shortcut inline (hanya pengirim yang di-allowlist):** perintah tertentu juga berfungsi saat disematkan dalam pesan normal dan dihapus sebelum model melihat teks yang tersisa.
  - Contoh: `hey /status` memicu balasan status, dan teks yang tersisa melanjutkan ke alur normal.
- Saat ini: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Pesan yang hanya berisi perintah dari pihak tak berwenang diabaikan diam-diam, dan token inline `/...` diperlakukan sebagai teks biasa.
- **Perintah skill:** skill `user-invocable` diekspos sebagai perintah slash. Nama dibersihkan menjadi `a-z0-9_` (maks. 32 karakter); benturan diberi sufiks numerik (misalnya `_2`).
  - `/skill <name> [input]` menjalankan skill berdasarkan nama (berguna ketika batas perintah native mencegah perintah per-skill).
  - Secara default, perintah skill diteruskan ke model sebagai permintaan normal.
  - Skill secara opsional dapat mendeklarasikan `command-dispatch: tool` untuk merutekan perintah langsung ke tool (deterministik, tanpa model).
  - Contoh: `/prose` (plugin OpenProse) — lihat [OpenProse](/id/prose).
- **Argumen perintah native:** Discord menggunakan autocomplete untuk opsi dinamis (dan menu tombol saat Anda menghilangkan argumen wajib). Telegram dan Slack menampilkan menu tombol saat suatu perintah mendukung pilihan dan Anda menghilangkan argumennya.

## `/tools`

`/tools` menjawab pertanyaan runtime, bukan pertanyaan konfigurasi: **apa yang dapat digunakan agen ini sekarang juga dalam
percakapan ini**.

- Default `/tools` bersifat ringkas dan dioptimalkan untuk pemindaian cepat.
- `/tools verbose` menambahkan deskripsi singkat.
- Permukaan perintah native yang mendukung argumen mengekspos pengalih mode yang sama seperti `compact|verbose`.
- Hasil bersifat per sesi, jadi mengubah agen, channel, thread, otorisasi pengirim, atau model dapat
  mengubah output.
- `/tools` mencakup tool yang benar-benar dapat dijangkau saat runtime, termasuk tool inti, tool plugin yang terhubung, dan tool milik channel.

Untuk mengedit profil dan penimpaan, gunakan panel Tools di UI Kontrol atau permukaan config/katalog alih-alih
memperlakukan `/tools` sebagai katalog statis.

## Permukaan penggunaan (apa yang muncul di mana)

- **Penggunaan/kuota penyedia** (contoh: “Claude tersisa 80%”) muncul di `/status` untuk penyedia model saat ini ketika pelacakan penggunaan diaktifkan. OpenClaw menormalkan jendela penyedia menjadi `% tersisa`; untuk MiniMax, bidang persentase khusus sisa dibalik sebelum ditampilkan, dan respons `model_remains` mengutamakan entri model chat plus label paket bertag model.
- **Baris token/cache** di `/status` dapat fallback ke entri penggunaan transkrip terbaru ketika snapshot sesi live jarang. Nilai live nonzero yang sudah ada tetap menang, dan fallback transkrip juga dapat memulihkan label model runtime aktif plus total berorientasi prompt yang lebih besar saat total yang tersimpan tidak ada atau lebih kecil.
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

- `/model` dan `/model list` menampilkan pemilih ringkas bernomor (keluarga model + penyedia yang tersedia).
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan model plus langkah Submit.
- `/model <#>` memilih dari pemilih tersebut (dan mengutamakan penyedia saat ini bila memungkinkan).
- `/model status` menampilkan tampilan terperinci, termasuk endpoint penyedia yang dikonfigurasi (`baseUrl`) dan mode API (`api`) jika tersedia.

## Penimpaan debug

`/debug` memungkinkan Anda menyetel penimpaan konfigurasi **hanya runtime** (memori, bukan disk). Hanya owner. Nonaktif secara default; aktifkan dengan `commands.debug: true`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Catatan:

- Penimpaan langsung berlaku untuk pembacaan konfigurasi baru, tetapi **tidak** menulis ke `openclaw.json`.
- Gunakan `/debug reset` untuk menghapus semua penimpaan dan kembali ke konfigurasi di disk.

## Pembaruan konfigurasi

`/config` menulis ke konfigurasi di disk Anda (`openclaw.json`). Hanya owner. Nonaktif secara default; aktifkan dengan `commands.config: true`.

Contoh:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Catatan:

- Konfigurasi divalidasi sebelum penulisan; perubahan yang tidak valid ditolak.
- Pembaruan `/config` dipertahankan saat restart.

## Pembaruan MCP

`/mcp` menulis definisi server MCP yang dikelola OpenClaw di bawah `mcp.servers`. Hanya owner. Nonaktif secara default; aktifkan dengan `commands.mcp: true`.

Contoh:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Catatan:

- `/mcp` menyimpan konfigurasi di konfigurasi OpenClaw, bukan pengaturan proyek milik Pi.
- Adaptor runtime menentukan transport mana yang benar-benar dapat dijalankan.

## Pembaruan plugin

`/plugins` memungkinkan operator memeriksa plugin yang ditemukan dan mengubah status aktif di konfigurasi. Alur baca-saja dapat menggunakan `/plugin` sebagai alias. Nonaktif secara default; aktifkan dengan `commands.plugins: true`.

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
- `/plugins enable|disable` hanya memperbarui konfigurasi plugin; tidak menginstal atau menghapus instalasi plugin.
- Setelah perubahan aktifkan/nonaktifkan, restart gateway untuk menerapkannya.

## Catatan permukaan

- **Perintah teks** berjalan di sesi chat normal (DM berbagi `main`, grup memiliki sesinya sendiri).
- **Perintah native** menggunakan sesi terisolasi:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
- **`/stop`** menargetkan sesi chat aktif sehingga dapat membatalkan run saat ini.
- **Slack:** `channels.slack.slashCommand` masih didukung untuk satu perintah bergaya `/openclaw`. Jika Anda mengaktifkan `commands.native`, Anda harus membuat satu Slack slash command per perintah bawaan (nama yang sama dengan `/help`). Menu argumen perintah untuk Slack dikirim sebagai tombol Block Kit ephemeral.
  - Pengecualian native Slack: daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.

## Pertanyaan sampingan BTW

`/btw` adalah **pertanyaan sampingan** cepat tentang sesi saat ini.

Berbeda dari chat normal:

- ini menggunakan sesi saat ini sebagai konteks latar belakang,
- ini berjalan sebagai panggilan satu kali **tanpa tool** yang terpisah,
- ini tidak mengubah konteks sesi di masa mendatang,
- ini tidak ditulis ke riwayat transkrip,
- ini dikirim sebagai hasil sampingan live alih-alih pesan asisten normal.

Itu membuat `/btw` berguna saat Anda menginginkan klarifikasi sementara sementara tugas
utama tetap berjalan.

Contoh:

```text
/btw apa yang sedang kita lakukan sekarang?
```

Lihat [BTW Side Questions](/tools/btw) untuk perilaku lengkap dan detail
UX klien.
