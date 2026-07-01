---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug routing perintah atau izin
    - Memahami cara perintah Skills didaftarkan
sidebarTitle: Slash commands
summary: Semua perintah slash, direktif, dan pintasan inline yang tersedia — konfigurasi, routing, dan perilaku per surface.
title: Perintah garis miring
x-i18n:
    generated_at: "2026-07-01T20:36:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway menangani perintah yang dikirim sebagai pesan mandiri yang diawali dengan `/`.
Perintah bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Ketika percakapan terikat ke sesi ACP, teks biasa diarahkan ke harness ACP.
Perintah manajemen Gateway tetap lokal: `/acp ...` selalu mencapai penangan perintah OpenClaw, dan `/status` serta `/unfocus` tetap lokal setiap kali penanganan perintah diaktifkan untuk surface tersebut.

## Tiga jenis perintah

<CardGroup cols={3}>
  <Card title="Perintah" icon="terminal">
    Pesan `/...` mandiri yang ditangani oleh Gateway. Harus dikirim sebagai
    satu-satunya konten dalam pesan.
  </Card>
  <Card title="Direktif" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — dihapus dari pesan sebelum model
    melihatnya. Mempertahankan pengaturan sesi saat dikirim sendiri; bertindak
    sebagai petunjuk inline saat dikirim bersama teks lain.
  </Card>
  <Card title="Pintasan inline" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — langsung dijalankan dan
    dihapus sebelum model melihat teks yang tersisa. Hanya pengirim berwenang.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detail perilaku direktif">
    - Direktif dihapus dari pesan sebelum model melihatnya.
    - Dalam pesan **hanya direktif** (pesan hanya berisi direktif), direktif
      dipertahankan ke sesi dan membalas dengan pengakuan.
    - Dalam pesan **obrolan normal** dengan teks lain, direktif bertindak sebagai
      petunjuk inline dan **tidak** mempertahankan pengaturan sesi.
    - Direktif hanya berlaku untuk **pengirim berwenang**. Jika `commands.allowFrom`
      ditetapkan, itu adalah satu-satunya allowlist yang digunakan; jika tidak,
      otorisasi berasal dari allowlist/pairing channel plus `commands.useAccessGroups`. Pengirim
      yang tidak berwenang melihat direktif diperlakukan sebagai teks biasa.
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
  Mengaktifkan parsing `/...` dalam pesan obrolan. Pada surface tanpa perintah native
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), perintah
  teks tetap berfungsi meski ditetapkan ke `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah native. Auto: aktif untuk Discord/Telegram; nonaktif untuk Slack;
  diabaikan untuk provider tanpa dukungan native. Timpa per channel dengan
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
  ke latar belakang).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Mengaktifkan `/config` (membaca/menulis `openclaw.json`). Hanya owner.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`). Hanya owner.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Mengaktifkan `/plugins` (penemuan/status plugin plus instal + aktifkan/nonaktifkan). Hanya owner untuk penulisan.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Mengaktifkan `/debug` (override konfigurasi khusus runtime). Hanya owner.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Mengaktifkan `/restart` dan aksi alat restart gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Allowlist owner eksplisit untuk surface perintah khusus owner. Terpisah dari
  `commands.allowFrom` dan akses pairing DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per channel: memerlukan identitas owner untuk perintah khusus owner. Saat `true`,
  pengirim harus cocok dengan `commands.ownerAllowFrom` atau memiliki cakupan internal `operator.admin`.
  Entri wildcard `allowFrom` **tidak** cukup.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Mengontrol bagaimana id owner muncul dalam prompt sistem.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Rahasia HMAC yang digunakan saat `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider untuk otorisasi perintah. Saat dikonfigurasi, ini adalah
  **satu-satunya** sumber otorisasi untuk perintah dan direktif. Gunakan `"*"` untuk
  default global; kunci khusus provider menimpanya.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Menegakkan allowlist/kebijakan untuk perintah saat `commands.allowFrom` tidak ditetapkan.
</ParamField>

## Daftar perintah

Perintah berasal dari tiga sumber:

- **Bawaan inti:** `src/auto-reply/commands-registry.shared.ts`
- **Perintah dock yang dihasilkan:** `src/auto-reply/commands-registry.data.ts`
- **Perintah Plugin:** panggilan `registerCommand()` plugin

Ketersediaan bergantung pada flag konfigurasi, surface channel, dan plugin yang terinstal/diaktifkan.

### Perintah inti

<AccordionGroup>
  <Accordion title="Sesi dan run">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/new [model]` | Arsipkan sesi saat ini dan mulai yang baru |
    | `/reset [soft [message]]` | Reset sesi saat ini di tempat. `soft` mempertahankan transkrip, membuang id sesi backend CLI yang digunakan ulang, dan menjalankan ulang startup |
    | `/name <title>` | Beri nama atau ganti nama sesi saat ini. Hilangkan judul untuk melihat nama saat ini dan saran |
    | `/compact [instructions]` | Padatkan konteks sesi. Lihat [Compaction](/id/concepts/compaction) |
    | `/stop` | Batalkan run saat ini |
    | `/session idle <duration\|off>` | Kelola kedaluwarsa idle thread-binding |
    | `/session max-age <duration\|off>` | Kelola kedaluwarsa usia maksimum thread-binding |
    | `/export-session [path]` | Ekspor sesi saat ini ke HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Ekspor bundle trajectory JSONL untuk sesi saat ini. Alias: `/trajectory` |

    <Note>
      Control UI mencegat `/new` yang diketik untuk membuat dan beralih ke sesi
      dashboard baru, kecuali ketika `session.dmScope: "main"` dikonfigurasi
      dan parent saat ini adalah sesi utama agent — dalam kasus itu `/new`
      mereset sesi utama di tempat. `/reset` yang diketik tetap menjalankan reset
      di tempat milik Gateway. Gunakan `/model default` saat Anda ingin menghapus
      pilihan model sesi yang dipasang pin.
    </Note>

  </Accordion>

  <Accordion title="Kontrol model dan run">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/think <level\|default>` | Tetapkan tingkat berpikir atau hapus override sesi. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Aktifkan/nonaktifkan output verbose. Alias: `/v` |
    | `/trace on\|off` | Aktifkan/nonaktifkan output trace plugin untuk sesi saat ini |
    | `/fast [status\|auto\|on\|off\|default]` | Tampilkan, tetapkan, atau hapus mode cepat |
    | `/reasoning [on\|off\|stream]` | Aktifkan/nonaktifkan visibilitas reasoning. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Aktifkan/nonaktifkan mode elevated. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Tampilkan atau tetapkan default exec |
    | `/login [codex\|openai\|openai-codex]` | Pair login Codex/OpenAI dari obrolan privat atau sesi Web UI. Hanya owner/admin |
    | `/model [name\|#\|status]` | Tampilkan atau tetapkan model |
    | `/models [provider] [page] [limit=<n>\|all]` | Cantumkan provider atau model yang dikonfigurasi/tersedia auth |
    | `/queue <mode>` | Kelola perilaku antrean run aktif. Lihat [Antrean](/id/concepts/queue) dan [Pengarahan antrean](/id/concepts/queue-steering) |
    | `/steer <message>` | Injeksi panduan ke dalam run aktif. Alias: `/tell`. Lihat [Steer](/id/tools/steer) |

    <AccordionGroup>
      <Accordion title="keamanan verbose / trace / fast / reasoning">
        - `/verbose` untuk debugging — biarkan **nonaktif** dalam penggunaan normal.
        - `/trace` hanya mengungkap baris trace/debug milik plugin; obrolan verbose normal tetap nonaktif.
        - `/fast auto|on|off` mempertahankan override sesi; gunakan opsi `inherit` di Sessions UI untuk menghapusnya.
        - `/fast` khusus provider: OpenAI/Codex memetakannya ke `service_tier=priority`; permintaan Anthropic langsung memetakannya ke `service_tier=auto` atau `standard_only`.
        - `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup — ini dapat mengungkap reasoning internal atau diagnostik plugin. Biarkan nonaktif di obrolan grup.

      </Accordion>
      <Accordion title="Detail penggantian model">
        - `/model` segera mempertahankan model baru ke sesi.
        - Jika agent idle, run berikutnya langsung menggunakannya.
        - Jika run aktif, penggantian ditandai tertunda dan diterapkan pada titik retry bersih berikutnya.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Penemuan dan status">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/help` | Tampilkan ringkasan bantuan singkat |
    | `/commands` | Tampilkan katalog perintah yang dihasilkan |
    | `/tools [compact\|verbose]` | Tampilkan apa yang dapat digunakan agent saat ini sekarang |
    | `/status` | Tampilkan status eksekusi/runtime, waktu aktif Gateway dan sistem, kesehatan plugin, plus penggunaan/kuota provider |
    | `/status plugins` | Tampilkan kesehatan plugin terperinci: error pemuatan, karantina, kegagalan channel, masalah dependensi, pemberitahuan kompatibilitas |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Kelola [tujuan](/id/tools/goal) tahan lama sesi saat ini |
    | `/diagnostics [note]` | Alur laporan dukungan khusus owner. Meminta persetujuan exec setiap kali |
    | `/crestodian <request>` | Jalankan pembantu penyiapan dan perbaikan Crestodian dari DM owner |
    | `/tasks` | Cantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini |
    | `/context [list\|detail\|map\|json]` | Jelaskan bagaimana konteks disusun |
    | `/whoami` | Tampilkan id pengirim Anda. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Kontrol footer penggunaan per respons (`reset`/`inherit`/`clear`/`default` menghapus override sesi untuk kembali mewarisi default yang dikonfigurasi) atau cetak ringkasan biaya lokal |
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
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Kelola sesi ACP dan opsi runtime. Kontrol runtime memerlukan pemilik eksternal atau identitas admin Gateway internal |
    | `/focus <target>` | Ikat thread Discord atau topik Telegram saat ini ke target sesi |
    | `/unfocus` | Hapus ikatan thread saat ini |
    | `/agents` | Cantumkan agen yang terikat thread untuk sesi saat ini |
  </Accordion>

  <Accordion title="Penulisan khusus pemilik dan admin">
    | Perintah | Membutuhkan | Deskripsi |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Baca atau tulis `openclaw.json`. Khusus pemilik |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Baca atau tulis konfigurasi server MCP yang dikelola OpenClaw. Khusus pemilik |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Periksa atau ubah status plugin. Khusus pemilik untuk penulisan. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Penggantian konfigurasi khusus runtime. Khusus pemilik |
    | `/restart` | `commands.restart: true` (default) | Mulai ulang OpenClaw |
    | `/send on\|off\|inherit` | pemilik | Atur kebijakan pengiriman |
  </Accordion>

  <Accordion title="Suara, TTS, kontrol saluran">
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

Perintah dock mengalihkan rute balasan sesi aktif ke saluran tertaut lain.
Lihat [Channel docking](/id/concepts/channel-docking) untuk penyiapan dan pemecahan masalah.

Dihasilkan dari plugin saluran dengan dukungan perintah native:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Perintah dock memerlukan `session.identityLinks`. Pengirim sumber dan peer target
harus berada dalam grup identitas yang sama.

### Perintah plugin bawaan

| Perintah                                                                                     | Deskripsi                                                                                  |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `/dreaming [on\|off\|status\|help]`                                                          | Aktifkan/nonaktifkan dreaming memori (pemilik atau admin Gateway). Lihat [Dreaming](/id/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Kelola pemasangan perangkat. Lihat [Pemasangan](/id/channels/pairing)                         |
| `/phone status\|arm ...\|disarm`                                                             | Aktifkan sementara perintah node ponsel berisiko tinggi                                    |
| `/voice status\|list\|set <voiceId>`                                                         | Kelola konfigurasi suara Talk. Nama native Discord: `/talkvoice`                           |
| `/card ...`                                                                                  | Kirim preset kartu kaya LINE. Lihat [LINE](/id/channels/line)                                 |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Kontrol harness server aplikasi Codex. Lihat [Harness Codex](/id/plugins/codex-harness)       |

Khusus QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Perintah Skill

Skill yang dapat dipanggil pengguna diekspos sebagai perintah slash:

- `/skill <name> [input]` selalu berfungsi sebagai titik masuk generik.
- Skills dapat mendaftar sebagai perintah langsung (misalnya `/prose` untuk OpenProse).
- Pendaftaran perintah skill native dikontrol oleh `commands.nativeSkills` dan
  `channels.<provider>.commands.nativeSkills`.
- Nama disanitasi menjadi `a-z0-9_` (maks 32 karakter); tabrakan mendapat sufiks numerik.

<AccordionGroup>
  <Accordion title="Dispatch perintah Skill">
    Secara default, perintah skill dirutekan ke model sebagai permintaan normal.

    Skills dapat mendeklarasikan `command-dispatch: tool` untuk merutekan langsung ke alat
    (deterministik, tanpa keterlibatan model). Contoh: `/prose` (plugin OpenProse)
    — lihat [OpenProse](/id/prose).

  </Accordion>
  <Accordion title="Argumen perintah native">
    Discord menggunakan pelengkapan otomatis untuk opsi dinamis dan menu tombol saat argumen
    wajib dihilangkan. Telegram dan Slack menampilkan menu tombol untuk perintah dengan
    pilihan. Pilihan dinamis diselesaikan terhadap model sesi target, sehingga opsi spesifik
    model seperti level `/think` mengikuti penggantian `/model` milik sesi.
  </Accordion>
</AccordionGroup>

## `/tools` — yang dapat digunakan agen sekarang

`/tools` menjawab pertanyaan runtime: **apa yang dapat digunakan agen ini sekarang dalam
percakapan ini** — bukan katalog konfigurasi statis.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Hasil dicakup per sesi. Mengubah agen, saluran, thread, otorisasi pengirim,
atau model dapat mengubah keluaran. Untuk pengeditan profil dan penggantian,
gunakan panel Tools di Control UI atau permukaan konfigurasi.

## `/model` — pemilihan model

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown penyedia dan
model. Pemilih mematuhi `agents.defaults.models`, termasuk entri
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
bertahan lintas mulai ulang.

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

`/mcp` menyimpan konfigurasi di konfigurasi OpenClaw, bukan di pengaturan proyek agen tersemat.

## `/debug` — penggantian khusus runtime

<Note>
  Khusus pemilik. Dinonaktifkan secara default — aktifkan dengan `commands.debug: true`.
  Penggantian langsung berlaku pada pembacaan konfigurasi baru tetapi **tidak** menulis ke disk.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — manajemen plugin

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

`/plugins enable|disable` memperbarui konfigurasi plugin dan memuat ulang secara panas runtime
plugin Gateway untuk giliran agen baru. `/plugins install` memulai ulang Gateway yang dikelola
secara otomatis karena modul sumber plugin berubah.

## `/trace` — keluaran trace plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` mengungkap baris trace/debug plugin yang dicakup per sesi tanpa mode verbose
penuh. Ini tidak menggantikan `/debug` (penggantian runtime) atau `/verbose` (keluaran alat
normal).

## `/btw` — pertanyaan sampingan

`/btw` adalah pertanyaan sampingan cepat tentang konteks sesi saat ini. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Tidak seperti pesan normal:

- Menggunakan sesi saat ini sebagai konteks latar belakang.
- Dalam sesi harness Codex, berjalan sebagai thread sampingan Codex sementara.
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
    - **`/login codex`** mengirim kode pemasangan perangkat hanya melalui chat pribadi atau jalur respons Web UI. Pemanggilan grup/topik Telegram meminta pemilik untuk mengirim DM ke bot sebagai gantinya.
    - **`/stop`** menargetkan sesi chat aktif untuk membatalkan proses saat ini.

  </Accordion>
  <Accordion title="Kekhususan Slack">
    `channels.slack.slashCommand` mendukung satu perintah bergaya `/openclaw`.
    Dengan `commands.native: true`, buat satu perintah slash Slack per perintah
    bawaan. Daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan
    `/status`. Teks `/status` tetap berfungsi di pesan Slack.
  </Accordion>
  <Accordion title="Jalur cepat dan pintasan inline">
    - Pesan yang hanya berisi perintah dari pengirim dalam allowlist ditangani segera (melewati antrean + model).
    - Pintasan inline (`/help`, `/commands`, `/status`, `/whoami`) juga berfungsi saat disematkan dalam pesan normal dan dihapus sebelum model melihat teks sisanya.
    - Pesan yang hanya berisi perintah dari pengirim tanpa otorisasi diabaikan secara diam-diam; token inline `/...` diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Catatan argumen">
    - Perintah menerima `:` opsional antara perintah dan argumen (`/think: high`, `/send: on`).
    - `/new <model>` menerima alias model, `provider/model`, atau nama penyedia (pencocokan fuzzy); jika tidak ada kecocokan, teks diperlakukan sebagai isi pesan.
    - `/allowlist add|remove` memerlukan `commands.config: true` dan mematuhi `configWrites` saluran.

  </Accordion>
</AccordionGroup>

## Penggunaan dan status penyedia

- **Penggunaan/kuota penyedia** (misalnya, "Claude 80% left") ditampilkan di `/status` untuk penyedia model saat ini ketika pelacakan penggunaan diaktifkan.
- **Baris token/cache** di `/status` dapat fallback ke entri penggunaan transkrip terbaru saat snapshot sesi live jarang.
- **Eksekusi vs runtime:** `/status` melaporkan `Execution` untuk jalur sandbox efektif dan `Runtime` untuk siapa yang menjalankan sesi: `OpenClaw Default`, `OpenAI Codex`, backend CLI, atau backend ACP.
- **Token/biaya per respons:** dikontrol oleh `/usage off|tokens|full`.
- `/model status` membahas model/auth/endpoint, bukan penggunaan.

## Terkait

<CardGroup cols={2}>
  <Card title="Skills" href="/id/tools/skills" icon="puzzle-piece">
    Cara perintah slash skill didaftarkan dan dibatasi.
  </Card>
  <Card title="Membuat skills" href="/id/tools/creating-skills" icon="hammer">
    Bangun skill yang mendaftarkan perintah slash miliknya sendiri.
  </Card>
  <Card title="BTW" href="/id/tools/btw" icon="comments">
    Pertanyaan sampingan tanpa mengubah konteks sesi.
  </Card>
  <Card title="Steer" href="/id/tools/steer" icon="compass">
    Pandu agen di tengah proses dengan `/steer`.
  </Card>
</CardGroup>
