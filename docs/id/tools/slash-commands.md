---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug routing perintah atau izin
    - Memahami cara perintah Skills didaftarkan
sidebarTitle: Slash commands
summary: Semua perintah slash, direktif, dan pintasan inline yang tersedia — konfigurasi, perutean, dan perilaku per permukaan.
title: Perintah slash
x-i18n:
    generated_at: "2026-06-27T18:21:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway menangani perintah yang dikirim sebagai pesan mandiri yang diawali dengan `/`.
Perintah bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Saat percakapan terikat ke sesi ACP, teks biasa diarahkan ke harness ACP.
Perintah manajemen Gateway tetap lokal: `/acp ...` selalu mencapai
penangan perintah OpenClaw, dan `/status` serta `/unfocus` tetap lokal setiap kali
penanganan perintah diaktifkan untuk surface tersebut.

## Tiga jenis perintah

<CardGroup cols={3}>
  <Card title="Perintah" icon="terminal">
    Pesan `/...` mandiri yang ditangani oleh Gateway. Harus dikirim sebagai
    satu-satunya konten dalam pesan.
  </Card>
  <Card title="Direktif" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — dihapus dari pesan sebelum model
    melihatnya. Menyimpan pengaturan sesi saat dikirim sendiri; bertindak sebagai petunjuk inline
    saat dikirim bersama teks lain.
  </Card>
  <Card title="Pintasan inline" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — langsung dijalankan dan
    dihapus sebelum model melihat teks yang tersisa. Hanya pengirim terotorisasi.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detail perilaku direktif">
    - Direktif dihapus dari pesan sebelum model melihatnya.
    - Dalam pesan **hanya direktif** (pesan hanya berisi direktif), direktif
      disimpan ke sesi dan dibalas dengan pengakuan.
    - Dalam pesan **chat normal** dengan teks lain, direktif bertindak sebagai petunjuk inline dan
      **tidak** menyimpan pengaturan sesi.
    - Direktif hanya berlaku untuk **pengirim terotorisasi**. Jika `commands.allowFrom`
      disetel, itu menjadi satu-satunya allowlist yang digunakan; jika tidak, otorisasi berasal dari
      allowlist/pairing channel ditambah `commands.useAccessGroups`. Pengirim yang tidak terotorisasi
      melihat direktif diperlakukan sebagai teks biasa.
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
  Mengaktifkan parsing `/...` dalam pesan chat. Pada surface tanpa perintah native
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), perintah teks
  tetap berfungsi meskipun disetel ke `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah native. Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack;
  diabaikan untuk provider tanpa dukungan native. Timpa per-channel dengan
  `channels.<provider>.commands.native`. Di Discord, `false` melewati pendaftaran slash-command;
  perintah yang sebelumnya terdaftar mungkin tetap terlihat sampai dihapus.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah skill secara native saat didukung. Auto: aktif untuk
  Discord/Telegram; nonaktif untuk Slack. Timpa dengan
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (alias `/bash <cmd>`). Memerlukan
  allowlist `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Berapa lama bash menunggu sebelum beralih ke mode latar belakang (`0` langsung
  berjalan di latar belakang).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Mengaktifkan `/config` (membaca/menulis `openclaw.json`). Khusus owner.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`). Khusus owner.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Mengaktifkan `/plugins` (penemuan/status plugin ditambah install + enable/disable). Khusus owner untuk penulisan.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Mengaktifkan `/debug` (override konfigurasi hanya runtime). Khusus owner.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Mengaktifkan `/restart` dan aksi tool restart gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Allowlist owner eksplisit untuk surface perintah khusus owner. Terpisah dari
  `commands.allowFrom` dan akses pairing DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per-channel: mewajibkan identitas owner untuk perintah khusus owner. Saat `true`,
  pengirim harus cocok dengan `commands.ownerAllowFrom` atau memiliki scope internal `operator.admin`.
  Entri wildcard `allowFrom` **tidak** cukup.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Mengontrol bagaimana id owner muncul dalam prompt sistem.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Secret HMAC yang digunakan saat `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Allowlist per-provider untuk otorisasi perintah. Saat dikonfigurasi, ini adalah
  **satu-satunya** sumber otorisasi untuk perintah dan direktif. Gunakan `"*"` untuk
  default global; key khusus provider menimpanya.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Menerapkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak disetel.
</ParamField>

## Daftar perintah

Perintah berasal dari tiga sumber:

- **Bawaan core:** `src/auto-reply/commands-registry.shared.ts`
- **Perintah dock yang dihasilkan:** `src/auto-reply/commands-registry.data.ts`
- **Perintah Plugin:** panggilan `registerCommand()` plugin

Ketersediaan bergantung pada flag konfigurasi, surface channel, dan plugin yang terinstal/diaktifkan.

### Perintah core

<AccordionGroup>
  <Accordion title="Sesi dan run">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/new [model]` | Arsipkan sesi saat ini dan mulai yang baru |
    | `/reset [soft [message]]` | Reset sesi saat ini di tempat. `soft` mempertahankan transkrip, menghapus id sesi backend CLI yang digunakan ulang, dan menjalankan ulang startup |
    | `/name <title>` | Beri nama atau ganti nama sesi saat ini. Hilangkan judul untuk melihat nama saat ini dan saran |
    | `/compact [instructions]` | Padatkan konteks sesi. Lihat [Compaction](/id/concepts/compaction) |
    | `/stop` | Batalkan run saat ini |
    | `/session idle <duration\|off>` | Kelola kedaluwarsa idle thread-binding |
    | `/session max-age <duration\|off>` | Kelola kedaluwarsa max-age thread-binding |
    | `/export-session [path]` | Ekspor sesi saat ini ke HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Ekspor bundle trajectory JSONL untuk sesi saat ini. Alias: `/trajectory` |

    <Note>
      Control UI mengintersepsi `/new` yang diketik untuk membuat dan beralih ke
      sesi dashboard baru, kecuali saat `session.dmScope: "main"` dikonfigurasi
      dan parent saat ini adalah sesi utama agent — dalam kasus itu `/new`
      mereset sesi utama di tempat. `/reset` yang diketik tetap menjalankan reset di tempat milik Gateway.
      Gunakan `/model default` saat Anda ingin menghapus pilihan model sesi yang dipin.
    </Note>

  </Accordion>

  <Accordion title="Kontrol model dan run">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/think <level\|default>` | Setel level berpikir atau hapus override sesi. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Alihkan output verbose. Alias: `/v` |
    | `/trace on\|off` | Alihkan output trace plugin untuk sesi saat ini |
    | `/fast [status\|auto\|on\|off\|default]` | Tampilkan, setel, atau hapus mode cepat |
    | `/reasoning [on\|off\|stream]` | Alihkan visibilitas reasoning. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Alihkan mode elevated. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Tampilkan atau setel default exec |
    | `/model [name\|#\|status]` | Tampilkan atau setel model |
    | `/models [provider] [page] [limit=<n>\|all]` | Daftar provider atau model yang dikonfigurasi/tersedia auth |
    | `/queue <mode>` | Kelola perilaku queue run aktif. Lihat [Queue](/id/concepts/queue) dan [Queue steering](/id/concepts/queue-steering) |
    | `/steer <message>` | Suntikkan panduan ke run aktif. Alias: `/tell`. Lihat [Steer](/id/tools/steer) |

    <AccordionGroup>
      <Accordion title="keamanan verbose / trace / fast / reasoning">
        - `/verbose` untuk debugging — tetap **nonaktif** dalam penggunaan normal.
        - `/trace` hanya mengungkap baris trace/debug milik plugin; celoteh verbose normal tetap nonaktif.
        - `/fast auto|on|off` menyimpan override sesi; gunakan opsi `inherit` di Sessions UI untuk menghapusnya.
        - `/fast` bersifat khusus provider: OpenAI/Codex memetakannya ke `service_tier=priority`; permintaan Anthropic langsung memetakannya ke `service_tier=auto` atau `standard_only`.
        - `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup — semuanya dapat mengungkap reasoning internal atau diagnostik plugin. Tetap nonaktifkan di chat grup.

      </Accordion>
      <Accordion title="Detail pergantian model">
        - `/model` segera menyimpan model baru ke sesi.
        - Jika agent sedang idle, run berikutnya langsung menggunakannya.
        - Jika run sedang aktif, pergantian ditandai tertunda dan diterapkan pada titik retry bersih berikutnya.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Penemuan dan status">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/help` | Tampilkan ringkasan bantuan singkat |
    | `/commands` | Tampilkan katalog perintah yang dihasilkan |
    | `/tools [compact\|verbose]` | Tampilkan apa yang dapat digunakan agent saat ini sekarang |
    | `/status` | Tampilkan status eksekusi/runtime, uptime Gateway dan sistem, kesehatan plugin, ditambah penggunaan/kuota provider |
    | `/status plugins` | Tampilkan kesehatan plugin secara detail: error pemuatan, karantina, kegagalan channel, masalah dependensi, pemberitahuan kompatibilitas |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Kelola [goal](/id/tools/goal) durable sesi saat ini |
    | `/diagnostics [note]` | Alur laporan dukungan khusus owner. Meminta persetujuan exec setiap kali |
    | `/crestodian <request>` | Jalankan pembantu setup dan perbaikan Crestodian dari DM owner |
    | `/tasks` | Daftar tugas latar belakang aktif/terbaru untuk sesi saat ini |
    | `/context [list\|detail\|map\|json]` | Jelaskan bagaimana konteks disusun |
    | `/whoami` | Tampilkan id pengirim Anda. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Kontrol footer penggunaan per respons (`reset`/`inherit`/`clear`/`default` menghapus override sesi agar kembali mewarisi default yang dikonfigurasi) atau cetak ringkasan biaya lokal |
  </Accordion>

  <Accordion title="Skills, allowlist, persetujuan">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/skill <name> [input]` | Jalankan skill berdasarkan nama |
    | `/allowlist [list\|add\|remove] ...` | Kelola entri allowlist. Hanya teks |
    | `/approve <id> <decision>` | Selesaikan prompt persetujuan exec atau plugin |
    | `/btw <question>` | Ajukan pertanyaan sampingan tanpa mengubah konteks sesi. Alias: `/side`. Lihat [BTW](/id/tools/btw) |
  </Accordion>

  <Accordion title="Subagen dan ACP">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/subagents list\|log\|info` | Periksa proses subagen untuk sesi saat ini |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Kelola sesi ACP dan opsi runtime |
    | `/focus <target>` | Ikat thread Discord saat ini atau topik Telegram ke target sesi |
    | `/unfocus` | Hapus pengikatan thread saat ini |
    | `/agents` | Cantumkan agen yang terikat thread untuk sesi saat ini |
  </Accordion>

  <Accordion title="Penulisan khusus pemilik dan admin">
    | Perintah | Memerlukan | Deskripsi |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Baca atau tulis `openclaw.json`. Khusus pemilik |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Baca atau tulis konfigurasi server MCP yang dikelola OpenClaw. Khusus pemilik |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Periksa atau ubah status plugin. Khusus pemilik untuk penulisan. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Penggantian konfigurasi khusus runtime. Khusus pemilik |
    | `/restart` | `commands.restart: true` (default) | Mulai ulang OpenClaw |
    | `/send on\|off\|inherit` | pemilik | Atur kebijakan pengiriman |
  </Accordion>

  <Accordion title="Suara, TTS, kontrol channel">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Kontrol TTS. Lihat [TTS](/id/tools/tts) |
    | `/activation mention\|always` | Atur mode aktivasi grup |
    | `/bash <command>` | Jalankan perintah shell host. Alias: `! <command>`. Memerlukan `commands.bash: true` |
    | `!poll [sessionId]` | Periksa pekerjaan bash latar belakang |
    | `!stop [sessionId]` | Hentikan pekerjaan bash latar belakang |
  </Accordion>
</AccordionGroup>

### Perintah dock

Perintah dock mengalihkan rute balasan sesi aktif ke channel tertaut lain.
Lihat [Channel docking](/id/concepts/channel-docking) untuk penyiapan dan pemecahan masalah.

Dihasilkan dari plugin channel dengan dukungan perintah native:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Perintah dock memerlukan `session.identityLinks`. Pengirim sumber dan peer target
harus berada dalam grup identitas yang sama.

### Perintah plugin bawaan

| Perintah                                                                                     | Deskripsi                                                                                |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Aktifkan/nonaktifkan Dreaming memori. Lihat [Dreaming](/id/concepts/dreaming)               |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Kelola pemasangan perangkat. Lihat [Pemasangan](/id/channels/pairing)                       |
| `/phone status\|arm ...\|disarm`                                                             | Aktifkan sementara perintah node ponsel berisiko tinggi                                  |
| `/voice status\|list\|set <voiceId>`                                                         | Kelola konfigurasi suara Talk. Nama native Discord: `/talkvoice`                         |
| `/card ...`                                                                                  | Kirim preset kartu kaya LINE. Lihat [LINE](/id/channels/line)                               |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Kontrol harness server aplikasi Codex. Lihat [Harness Codex](/id/plugins/codex-harness)     |

Khusus QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Perintah Skills

Skills yang dapat dipanggil pengguna diekspos sebagai perintah slash:

- `/skill <name> [input]` selalu berfungsi sebagai titik masuk generik.
- Skills dapat mendaftar sebagai perintah langsung (mis. `/prose` untuk OpenProse).
- Pendaftaran perintah skill native dikontrol oleh `commands.nativeSkills` dan
  `channels.<provider>.commands.nativeSkills`.
- Nama disanitasi menjadi `a-z0-9_` (maks 32 karakter); tabrakan mendapat sufiks numerik.

<AccordionGroup>
  <Accordion title="Dispatch perintah Skill">
    Secara default, perintah skill dirutekan ke model sebagai permintaan normal.

    Skills dapat mendeklarasikan `command-dispatch: tool` untuk merutekan langsung ke tool
    (deterministik, tanpa keterlibatan model). Contoh: `/prose` (plugin OpenProse)
    — lihat [OpenProse](/id/prose).

  </Accordion>
  <Accordion title="Argumen perintah native">
    Discord menggunakan pelengkapan otomatis untuk opsi dinamis dan menu tombol saat
    argumen wajib dihilangkan. Telegram dan Slack menampilkan menu tombol untuk perintah dengan
    pilihan. Pilihan dinamis diselesaikan terhadap model sesi target, sehingga opsi
    spesifik model seperti level `/think` mengikuti penggantian `/model` sesi.
  </Accordion>
</AccordionGroup>

## `/tools` — apa yang dapat digunakan agen sekarang

`/tools` menjawab pertanyaan runtime: **apa yang dapat digunakan agen ini sekarang dalam
percakapan ini** — bukan katalog konfigurasi statis.

```text
/tools         # tampilan ringkas
/tools verbose # dengan deskripsi singkat
```

Hasil memiliki cakupan sesi. Mengubah agen, channel, thread, otorisasi
pengirim, atau model dapat mengubah keluaran. Untuk pengeditan profil dan penggantian,
gunakan panel Control UI Tools atau permukaan konfigurasi.

## `/model` — pemilihan model

```text
/model             # tampilkan pemilih model
/model list        # sama
/model 3           # pilih berdasarkan nomor dari pemilih
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # hapus pemilihan model sesi
/model status      # tampilan terperinci dengan endpoint dan mode API
```

Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown provider dan
model. Pemilih mengikuti `agents.defaults.models`, termasuk entri
`provider/*`.

## `/config` — penulisan konfigurasi di disk

<Note>
  Khusus pemilik. Dinonaktifkan secara default — aktifkan dengan `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Konfigurasi divalidasi sebelum ditulis. Perubahan tidak valid ditolak. Pembaruan `/config`
bertahan setelah mulai ulang.

## `/mcp` — konfigurasi server MCP

<Note>
  Khusus pemilik. Dinonaktifkan secara default — aktifkan dengan `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` menyimpan konfigurasi dalam konfigurasi OpenClaw, bukan pengaturan proyek agen tertanam.

## `/debug` — penggantian khusus runtime

<Note>
  Khusus pemilik. Dinonaktifkan secara default — aktifkan dengan `commands.debug: true`.
  Penggantian diterapkan segera pada pembacaan konfigurasi baru tetapi **tidak** menulis ke disk.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — pengelolaan plugin

<Note>
  Khusus pemilik untuk penulisan. Dinonaktifkan secara default — aktifkan dengan `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` memperbarui konfigurasi plugin dan memuat ulang panas runtime plugin Gateway
untuk giliran agen baru. `/plugins install` memulai ulang Gateway terkelola
secara otomatis karena modul sumber plugin berubah.

## `/trace` — keluaran trace plugin

```text
/trace          # tampilkan status trace saat ini
/trace on
/trace off
```

`/trace` menampilkan baris trace/debug plugin bercakupan sesi tanpa mode verbose penuh.
Ini tidak menggantikan `/debug` (penggantian runtime) atau `/verbose` (keluaran tool
normal).

## `/btw` — pertanyaan sampingan

`/btw` adalah pertanyaan sampingan cepat tentang konteks sesi saat ini. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Tidak seperti pesan normal:

- Menggunakan sesi saat ini sebagai konteks latar belakang.
- Dalam sesi harness Codex, berjalan sebagai thread sampingan Codex efemeral.
- **Tidak** mengubah konteks sesi mendatang.
- Tidak ditulis ke riwayat transkrip.

Lihat [Pertanyaan sampingan BTW](/id/tools/btw) untuk perilaku lengkap.

## Catatan permukaan

<AccordionGroup>
  <Accordion title="Cakupan sesi per permukaan">
    - **Perintah teks:** berjalan dalam sesi chat normal (DM berbagi `main`, grup memiliki sesi sendiri).
    - **Perintah native Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Perintah native Slack:** `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
    - **Perintah native Telegram:** `telegram:slash:<userId>` (menargetkan sesi chat melalui `CommandTargetSessionKey`)
    - **`/stop`** menargetkan sesi chat aktif untuk membatalkan proses saat ini.

  </Accordion>
  <Accordion title="Khusus Slack">
    `channels.slack.slashCommand` mendukung satu perintah bergaya `/openclaw`.
    Dengan `commands.native: true`, buat satu perintah slash Slack per perintah bawaan.
    Daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan
    `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.
  </Accordion>
  <Accordion title="Jalur cepat dan pintasan inline">
    - Pesan hanya perintah dari pengirim dalam allowlist ditangani segera (melewati antrean + model).
    - Pintasan inline (`/help`, `/commands`, `/status`, `/whoami`) juga berfungsi saat disematkan dalam pesan normal dan dihapus sebelum model melihat teks yang tersisa.
    - Pesan hanya perintah yang tidak berwenang diabaikan diam-diam; token inline `/...` diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Catatan argumen">
    - Perintah menerima `:` opsional antara perintah dan argumen (`/think: high`, `/send: on`).
    - `/new <model>` menerima alias model, `provider/model`, atau nama provider (pencocokan fuzzy); jika tidak ada kecocokan, teks diperlakukan sebagai isi pesan.
    - `/allowlist add|remove` memerlukan `commands.config: true` dan menghormati `configWrites` channel.

  </Accordion>
</AccordionGroup>

## Penggunaan dan status provider

- **Penggunaan/kuota provider** (mis. "Claude 80% left") ditampilkan di `/status` untuk provider model saat ini ketika pelacakan penggunaan diaktifkan.
- **Baris token/cache** di `/status` dapat menggunakan entri penggunaan transkrip terbaru sebagai fallback ketika snapshot sesi live jarang.
- **Eksekusi vs runtime:** `/status` melaporkan `Execution` untuk jalur sandbox efektif dan `Runtime` untuk siapa yang menjalankan sesi: `OpenClaw Default`, `OpenAI Codex`, backend CLI, atau backend ACP.
- **Token/biaya per respons:** dikontrol oleh `/usage off|tokens|full`.
- `/model status` membahas model/auth/endpoint, bukan penggunaan.

## Terkait

<CardGroup cols={2}>
  <Card title="Skills" href="/id/tools/skills" icon="puzzle-piece">
    Bagaimana perintah slash skill didaftarkan dan dibatasi.
  </Card>
  <Card title="Membuat skills" href="/id/tools/creating-skills" icon="hammer">
    Buat skill yang mendaftarkan perintah slash-nya sendiri.
  </Card>
  <Card title="BTW" href="/id/tools/btw" icon="comments">
    Pertanyaan sampingan tanpa mengubah konteks sesi.
  </Card>
  <Card title="Steer" href="/id/tools/steer" icon="compass">
    Pandu agen di tengah proses dengan `/steer`.
  </Card>
</CardGroup>
