---
read_when:
    - Menggunakan atau mengonfigurasi perintah obrolan
    - Men-debug perutean perintah atau izin
    - Memahami cara perintah Skills didaftarkan
sidebarTitle: Slash commands
summary: Semua perintah garis miring, direktif, dan pintasan sebaris yang tersedia — konfigurasi, perutean, dan perilaku per permukaan.
title: Perintah garis miring
x-i18n:
    generated_at: "2026-07-12T14:43:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway menangani perintah yang dikirim sebagai pesan mandiri yang diawali dengan `/`.
Perintah bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Saat percakapan terikat ke sesi ACP, teks biasa dirutekan ke harness ACP.
Perintah pengelolaan Gateway tetap lokal: `/acp ...` selalu diteruskan ke
penangan perintah OpenClaw, sedangkan `/status` dan `/unfocus` tetap lokal setiap kali
penanganan perintah diaktifkan untuk permukaan tersebut.

## Tiga jenis perintah

<CardGroup cols={3}>
  <Card title="Perintah" icon="terminal">
    Pesan mandiri `/...` yang ditangani oleh Gateway. Harus dikirim sebagai
    satu-satunya konten dalam pesan.
  </Card>
  <Card title="Direktif" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — dihapus dari pesan sebelum model
    melihatnya. Mempertahankan pengaturan sesi saat dikirim sendiri; bertindak sebagai petunjuk sebaris
    saat dikirim bersama teks lain.
  </Card>
  <Card title="Pintasan sebaris" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — dijalankan segera dan
    dihapus sebelum model melihat teks yang tersisa. Hanya pengirim yang diotorisasi.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detail perilaku direktif">
    - Direktif dihapus dari pesan sebelum model melihatnya.
    - Dalam pesan **khusus direktif** (pesan hanya berisi direktif), direktif
      dipertahankan dalam sesi dan dibalas dengan konfirmasi.
    - Dalam pesan **obrolan normal** yang berisi teks lain, direktif bertindak sebagai petunjuk sebaris dan
      **tidak** mempertahankan pengaturan sesi.
    - Direktif hanya berlaku bagi **pengirim yang diotorisasi**. Jika `commands.allowFrom`
      ditetapkan, hanya daftar izin tersebut yang digunakan; jika tidak, otorisasi berasal dari
      daftar izin kanal/pemasangan serta `commands.useAccessGroups`. Pengirim yang tidak diotorisasi
      akan melihat direktif diperlakukan sebagai teks biasa.
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
  Mengaktifkan penguraian `/...` dalam pesan obrolan. Pada permukaan tanpa perintah native
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), perintah teks
  tetap berfungsi meskipun ditetapkan ke `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah native. Otomatis: aktif untuk Discord/Telegram; nonaktif untuk Slack;
  diabaikan untuk penyedia tanpa dukungan native. Timpa per kanal dengan
  `channels.<provider>.commands.native`. Di Discord, `false` melewati pendaftaran
  perintah garis miring; perintah yang sebelumnya didaftarkan mungkin tetap terlihat hingga dihapus.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah Skills secara native jika didukung. Otomatis: aktif untuk
  Discord/Telegram; nonaktif untuk Slack. Timpa dengan
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (alias `/bash <cmd>`). Memerlukan
  daftar izin `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Durasi bash menunggu sebelum beralih ke mode latar belakang (`0` langsung berjalan
  di latar belakang).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Mengaktifkan `/config` (membaca/menulis `openclaw.json`). Khusus pemilik.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`). Khusus pemilik.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Mengaktifkan `/plugins` (penemuan/status plugin serta pemasangan + pengaktifan/penonaktifan). Penulisan hanya untuk pemilik.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Mengaktifkan `/debug` (penimpaan konfigurasi khusus waktu proses). Khusus pemilik.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Mengaktifkan `/restart` dan tindakan alat untuk memulai ulang Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Daftar izin pemilik eksplisit untuk permukaan perintah khusus pemilik. Terpisah dari
  `commands.allowFrom` dan akses pemasangan DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per kanal: mewajibkan identitas pemilik untuk perintah khusus pemilik. Saat `true`,
  pengirim harus cocok dengan `commands.ownerAllowFrom` atau memiliki cakupan internal `operator.admin`.
  Entri wildcard `allowFrom` **tidak** memadai.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Mengontrol bagaimana ID pemilik ditampilkan dalam prompt sistem.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Rahasia HMAC yang digunakan saat `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Daftar izin per penyedia untuk otorisasi perintah. Jika dikonfigurasi, ini menjadi
  **satu-satunya** sumber otorisasi untuk perintah dan direktif. Gunakan `"*"` sebagai
  default global; kunci khusus penyedia akan menimpanya.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Menerapkan daftar izin/kebijakan untuk perintah saat `commands.allowFrom` tidak ditetapkan.
</ParamField>

## Daftar perintah

Perintah berasal dari tiga sumber:

- **Bawaan inti:** `src/auto-reply/commands-registry.shared.ts`
- **Perintah dock yang dihasilkan:** `src/auto-reply/commands-registry.data.ts`
- **Perintah Plugin:** pemanggilan `registerCommand()` oleh plugin

Ketersediaan bergantung pada flag konfigurasi, permukaan kanal, serta plugin yang
terpasang/diaktifkan.

### Perintah inti

  <AccordionGroup>
  <Accordion title="Sesi dan proses">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/new [model]` | Arsipkan sesi saat ini dan mulai sesi baru |
    | `/reset [soft [message]]` | Atur ulang sesi saat ini tanpa menggantinya. `soft` mempertahankan transkrip, menghapus id sesi backend CLI yang digunakan kembali, dan menjalankan ulang proses awal |
    | `/name <title>` | Beri nama atau ubah nama sesi saat ini. Hilangkan judul untuk melihat nama saat ini dan saran |
    | `/compact [instructions]` | Padatkan konteks sesi. Lihat [Compaction](/id/concepts/compaction) |
    | `/stop` | Batalkan proses saat ini |
    | `/session idle <duration\|off>` | Kelola kedaluwarsa akibat tidak aktif untuk pengikatan utas |
    | `/session max-age <duration\|off>` | Kelola kedaluwarsa usia maksimum untuk pengikatan utas |
    | `/export-session [path]` | Ekspor sesi saat ini ke HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Ekspor bundel lintasan JSONL untuk sesi saat ini. Alias: `/trajectory` |

    <Note>
      Control UI mencegat `/new` yang diketik untuk membuat dan beralih ke sesi
      dasbor baru, kecuali jika `session.dmScope: "main"` dikonfigurasi
      dan induk saat ini adalah sesi utama agen — dalam hal tersebut, `/new`
      mengatur ulang sesi utama tanpa menggantinya. `/reset` yang diketik tetap menjalankan
      pengaturan ulang Gateway tanpa mengganti sesi. Gunakan `/model default` saat Anda ingin menghapus pilihan
      model sesi yang disematkan.
    </Note>

  </Accordion>

  <Accordion title="Kontrol model dan proses">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/think <level\|default>` | Tetapkan tingkat pemikiran atau hapus penggantian sesi. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Aktifkan atau nonaktifkan keluaran terperinci. Alias: `/v` |
    | `/trace on\|off` | Aktifkan atau nonaktifkan keluaran pelacakan plugin untuk sesi saat ini |
    | `/fast [status\|auto\|on\|off\|default]` | Tampilkan, tetapkan, atau hapus mode cepat |
    | `/reasoning [on\|off\|stream]` | Aktifkan atau nonaktifkan visibilitas penalaran. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Aktifkan atau nonaktifkan mode dengan hak akses tinggi. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Tampilkan atau tetapkan nilai bawaan eksekusi |
    | `/login [codex\|openai\|openai-codex]` | Pasangkan proses masuk Codex/OpenAI dari obrolan privat atau sesi Web UI. Hanya pemilik/admin |
    | `/model [name\|#\|status]` | Tampilkan atau tetapkan model |
    | `/models [provider] [page] [limit=<n>\|all]` | Cantumkan penyedia atau model yang dikonfigurasi/tersedia melalui autentikasi |
    | `/queue <mode>` | Kelola perilaku antrean proses aktif. Lihat [Antrean](/id/concepts/queue) dan [Pengarahan antrean](/id/concepts/queue-steering) |
    | `/steer <message>` | Masukkan panduan ke dalam proses aktif. Alias: `/tell`. Lihat [Pengarahan](/id/tools/steer) |

    <AccordionGroup>
      <Accordion title="keamanan verbose / trace / fast / reasoning">
        - `/verbose` digunakan untuk proses debug — biarkan **nonaktif** dalam penggunaan normal.
        - `/trace` hanya menampilkan baris pelacakan/debug milik plugin; keluaran terperinci biasa tetap nonaktif.
        - `/fast auto|on|off` mempertahankan penggantian sesi; gunakan opsi `inherit` di UI Sesi untuk menghapusnya.
        - `/fast` bergantung pada penyedia: OpenAI/Codex memetakannya ke `service_tier=priority`; permintaan langsung Anthropic memetakannya ke `service_tier=auto` atau `standard_only`.
        - `/reasoning`, `/verbose`, dan `/trace` berisiko dalam lingkungan grup — semuanya dapat mengungkapkan penalaran internal atau diagnostik plugin. Biarkan semuanya nonaktif dalam obrolan grup.

      </Accordion>
      <Accordion title="Detail pergantian model">
        - `/model` segera menyimpan model baru ke sesi.
        - Jika agen sedang menganggur, eksekusi berikutnya langsung menggunakannya.
        - Jika eksekusi sedang aktif, pergantian ditandai sebagai tertunda dan diterapkan pada titik percobaan ulang bersih berikutnya.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Penemuan dan status">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/help` | Tampilkan ringkasan bantuan singkat |
    | `/commands` | Tampilkan katalog perintah yang dihasilkan |
    | `/tools [compact\|verbose]` | Tampilkan hal yang dapat digunakan agen saat ini |
    | `/status` | Tampilkan status eksekusi/runtime, waktu aktif Gateway dan sistem, kesehatan plugin, serta penggunaan/kuota penyedia |
    | `/status plugins` | Tampilkan detail kesehatan plugin: kesalahan pemuatan, karantina, kegagalan plugin kanal, masalah dependensi, pemberitahuan kompatibilitas. Memerlukan `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Kelola [sasaran](/id/tools/goal) persisten sesi saat ini |
    | `/diagnostics [note]` | Alur laporan dukungan khusus pemilik. Selalu meminta persetujuan eksekusi |
    | `/crestodian <request>` | Jalankan pembantu penyiapan dan perbaikan Crestodian dari DM pemilik |
    | `/tasks` | Cantumkan tugas latar belakang yang aktif/terbaru untuk sesi saat ini |
    | `/context [list\|detail\|map\|json]` | Jelaskan cara konteks disusun |
    | `/whoami` | Tampilkan ID pengirim Anda. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Kendalikan catatan kaki penggunaan per respons (`reset`/`inherit`/`clear`/`default` menghapus penggantian sesi agar kembali mewarisi nilai bawaan yang dikonfigurasi) atau tampilkan ringkasan biaya lokal |
  </Accordion>

  <Accordion title="Skills, daftar izin, persetujuan">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/skill <name> [input]` | Jalankan skill berdasarkan nama |
    | `/learn [request]` | Susun draf satu skill yang dapat ditinjau dari percakapan saat ini atau sumber yang disebutkan melalui [Lokakarya Skill](/id/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Kelola entri daftar izin. Hanya teks |
    | `/approve <id> <decision>` | Selesaikan permintaan persetujuan eksekusi atau plugin |
    | `/btw <question>` | Ajukan pertanyaan sampingan tanpa mengubah konteks sesi. Alias: `/side`. Lihat [BTW](/id/tools/btw) |
  </Accordion>

  <Accordion title="Subagen dan ACP">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/subagents list\|log\|info` | Periksa eksekusi subagen untuk sesi saat ini |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Kelola sesi ACP dan opsi runtime. Kontrol runtime memerlukan identitas pemilik eksternal atau admin Gateway internal |
    | `/focus <target>` | Kaitkan utas Discord atau topik Telegram saat ini ke target sesi |
    | `/unfocus` | Hapus pengaitan utas saat ini |
    | `/agents` | Cantumkan agen yang terikat ke utas untuk sesi saat ini |
  </Accordion>

  <Accordion title="Penulisan khusus pemilik dan administrasi">
    | Perintah | Memerlukan | Deskripsi |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Baca atau tulis `openclaw.json`. Khusus pemilik |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Baca atau tulis konfigurasi server MCP yang dikelola OpenClaw. Khusus pemilik |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Periksa atau ubah status plugin. Penulisan khusus pemilik. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Penggantian konfigurasi khusus runtime. Khusus pemilik |
    | `/restart` | `commands.restart: true` (bawaan) | Mulai ulang OpenClaw |
    | `/send on\|off\|inherit` | pemilik | Atur kebijakan pengiriman |
  </Accordion>

  <Accordion title="Suara, TTS, kontrol kanal">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Kontrol TTS. Lihat [TTS](/id/tools/tts) |
    | `/activation mention\|always` | Atur mode aktivasi grup |
    | `/bash <command>` | Jalankan perintah shell hos. Alias: `! <command>`. Memerlukan `commands.bash: true` |
    | `!poll [sessionId]` | Periksa tugas bash latar belakang |
    | `!stop [sessionId]` | Hentikan tugas bash latar belakang |
  </Accordion>
</AccordionGroup>

### Perintah docking

Perintah docking mengalihkan rute balasan sesi aktif ke kanal tertaut lainnya.
Lihat [Docking kanal](/id/concepts/channel-docking) untuk penyiapan dan pemecahan masalah.

Dihasilkan dari plugin kanal dengan dukungan perintah native:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Perintah docking memerlukan `session.identityLinks`. Pengirim sumber dan rekan target
harus berada dalam grup identitas yang sama.

### Perintah plugin bawaan

| Perintah                                                | Deskripsi                                                                                                                                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Aktifkan atau nonaktifkan dreaming memori (pemilik atau admin Gateway). Lihat [Dreaming](/id/concepts/dreaming)                                                                                             |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Kelola pemasangan perangkat. Lihat [Pemasangan](/id/channels/pairing)                                                                                                                                       |
| `/phone status\|arm ...\|disarm`                        | Aktifkan sementara perintah Node berisiko tinggi (kamera/layar/komputer/penulisan). Lihat [Penggunaan komputer](/id/nodes/computer-use)                                                                     |
| `/voice status\|list\|set <voiceId>`                    | Kelola konfigurasi suara Talk. Nama native Discord: `/talkvoice`                                                                                                                                         |
| `/card ...`                                             | Kirim preset kartu kaya LINE. Lihat [LINE](/id/channels/line)                                                                                                                                               |
| `/codex <action> ...`                                   | Kaitkan, arahkan, dan periksa harness server aplikasi Codex (status, utas, lanjutkan, model, cepat, izin, pemadatan, peninjauan, mcp, skills, dan lainnya). Lihat [Harness Codex](/id/plugins/codex-harness) |

Khusus QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Perintah Skills

Skills yang dapat dipanggil pengguna diekspos sebagai perintah garis miring:

- `/skill <name> [input]` selalu berfungsi sebagai titik masuk umum.
- Skills dapat didaftarkan sebagai perintah langsung (misalnya `/prose` untuk OpenProse).
- Pendaftaran perintah Skills native dikontrol oleh `commands.nativeSkills` dan
  `channels.<provider>.commands.nativeSkills`.
- Nama disanitasi menjadi `a-z0-9_` (maks. 32 karakter); tabrakan mendapatkan sufiks numerik.

<AccordionGroup>
  <Accordion title="Pengiriman perintah Skills">
    Secara bawaan, perintah Skills dirutekan ke model sebagai permintaan biasa.

    Skills dapat mendeklarasikan `command-dispatch: tool` untuk merutekan langsung ke alat
    (deterministik, tanpa keterlibatan model). Contoh: `/prose` (plugin OpenProse)
    — lihat [OpenProse](/id/prose).

  </Accordion>
  <Accordion title="Argumen perintah native">
    Discord menggunakan pelengkapan otomatis untuk opsi dinamis dan menu tombol ketika
    argumen wajib tidak diberikan. Telegram dan Slack menampilkan menu tombol untuk perintah dengan
    pilihan. Pilihan dinamis ditentukan berdasarkan model sesi target, sehingga opsi
    khusus model seperti tingkat `/think` mengikuti penggantian `/model` sesi.
  </Accordion>
</AccordionGroup>

## `/tools`: yang dapat digunakan agen saat ini

`/tools` menjawab pertanyaan runtime: **apa yang dapat digunakan agen ini sekarang dalam
percakapan ini** — bukan katalog konfigurasi statis.

```text
/tools         # tampilan ringkas
/tools verbose # dengan deskripsi singkat
```

Hasil dibatasi per sesi. Mengubah agen, kanal, utas, otorisasi
pengirim, atau model dapat mengubah keluaran. Untuk mengedit profil dan penggantian,
gunakan panel Alat UI Kontrol atau permukaan konfigurasi.

## `/model`: pemilihan model

```text
/model             # tampilkan pemilih model
/model list        # sama
/model 3           # pilih berdasarkan nomor dari pemilih
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # hapus pilihan model sesi
/model status      # tampilan terperinci dengan endpoint dan mode API
```

Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan menu tarik-turun
penyedia dan model. Pemilih mematuhi `agents.defaults.models`, termasuk
entri `provider/*`.

## `/config`: penulisan konfigurasi pada disk

<Note>
  Khusus pemilik. Dinonaktifkan secara bawaan — aktifkan dengan `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Konfigurasi divalidasi sebelum ditulis. Perubahan yang tidak valid ditolak. Pembaruan `/config`
tetap tersimpan setelah mulai ulang.

## `/mcp`: konfigurasi server MCP

<Note>
  Khusus pemilik. Dinonaktifkan secara bawaan — aktifkan dengan `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` menyimpan konfigurasi dalam konfigurasi OpenClaw, bukan dalam pengaturan proyek agen tertanam.
`/mcp show` menyamarkan bidang yang memuat kredensial, nilai flag kredensial yang
dikenali, dan argumen yang diketahui menyerupai rahasia. Ketika dijalankan dari grup,
konfigurasi dikirim secara privat kepada pemilik; jika tidak tersedia rute privat ke
pemilik, perintah gagal secara tertutup dan meminta pemilik mencoba lagi dari percakapan
langsung.

## `/debug`: penggantian khusus runtime

<Note>
  Khusus pemilik. Dinonaktifkan secara bawaan — aktifkan dengan `commands.debug: true`.
  Penggantian langsung diterapkan pada pembacaan konfigurasi baru, tetapi **tidak** ditulis ke disk.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: pengelolaan plugin

<Note>
  Penulisan khusus pemilik. Dinonaktifkan secara bawaan — aktifkan dengan `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` memperbarui konfigurasi plugin dan memuat ulang secara langsung runtime
plugin Gateway untuk giliran agen baru. `/plugins install` memulai ulang Gateway
terkelola secara otomatis karena modul sumber plugin berubah.

## `/trace`: keluaran pelacakan plugin

```text
/trace          # tampilkan status pelacakan saat ini
/trace on
/trace off
```

`/trace` menampilkan baris pelacakan/debug plugin yang dibatasi per sesi tanpa mode
verbose penuh. Ini tidak menggantikan `/debug` (penggantian runtime) atau `/verbose` (keluaran
alat normal).

## `/btw`: pertanyaan sampingan

`/btw` adalah pertanyaan sampingan singkat tentang konteks sesi saat ini. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Tidak seperti pesan biasa:

- Menggunakan sesi saat ini sebagai konteks latar belakang.
- Dalam sesi harness Codex, berjalan sebagai utas sampingan Codex sementara.
- **Tidak** mengubah konteks sesi berikutnya.
- Tidak ditulis ke riwayat transkrip.

Lihat [Pertanyaan sampingan BTW](/id/tools/btw) untuk perilaku lengkap.

## Catatan permukaan

<AccordionGroup>
  <Accordion title="Cakupan sesi per permukaan">
    - **Perintah teks:** berjalan dalam sesi percakapan normal (DM berbagi `main`, grup memiliki sesi masing-masing).
    - **Perintah native Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Perintah native Slack:** `agent:<agentId>:slack:slash:<userId>` (prefiks dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
    - **Perintah native Telegram:** `telegram:slash:<userId>` (menargetkan sesi percakapan melalui `CommandTargetSessionKey`)
    - **`/login codex`** mengirim kode pemasangan perangkat hanya melalui percakapan privat atau jalur respons UI Web. Pemanggilan dari grup/topik Telegram meminta pemilik mengirim DM ke bot sebagai gantinya.
    - **`/stop`** menargetkan sesi percakapan aktif untuk membatalkan eksekusi saat ini.

  </Accordion>
  <Accordion title="Kekhususan Slack">
    `channels.slack.slashCommand` mendukung satu perintah bergaya `/openclaw`.
    Dengan `commands.native: true`, buat satu perintah garis miring Slack untuk setiap perintah
    bawaan. Daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan
    `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.
  </Accordion>
  <Accordion title="Jalur cepat dan pintasan sebaris">
    - Pesan yang hanya berisi perintah dari pengirim dalam daftar izin ditangani segera (melewati antrean + model).
    - Pintasan sebaris (`/help`, `/commands`, `/status`, `/whoami`) juga berfungsi ketika disematkan dalam pesan biasa dan dihapus sebelum model melihat teks yang tersisa.
    - Pesan yang hanya berisi perintah dari pengirim tanpa otorisasi diabaikan tanpa pemberitahuan; token `/...` sebaris diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Catatan argumen">
    - Perintah menerima `:` opsional antara perintah dan argumen (`/think: high`, `/send: on`).
    - `/new <model>` menerima alias model, `provider/model`, atau nama penyedia (pencocokan samar); jika tidak ada kecocokan, teks diperlakukan sebagai isi pesan.
    - `/allowlist add|remove` memerlukan `commands.config: true` dan mematuhi `configWrites` kanal.

  </Accordion>
</AccordionGroup>

## Penggunaan dan status penyedia

- **Penggunaan/kuota penyedia** (misalnya, "Claude tersisa 80%") ditampilkan di `/status` untuk penyedia model saat ini ketika pelacakan penggunaan diaktifkan.
- **Baris token/cache** di `/status` dapat menggunakan entri penggunaan transkrip terbaru sebagai alternatif ketika snapshot sesi langsung minim data.
- **Eksekusi vs runtime:** `/status` melaporkan `Execution` untuk jalur sandbox efektif dan `Runtime` untuk pihak yang menjalankan sesi: `OpenClaw Default`, `OpenAI Codex`, backend CLI, atau backend ACP.
- **Token/biaya per respons:** dikendalikan oleh `/usage off|tokens|full`.
- `/model status` membahas model/autentikasi/endpoint, bukan penggunaan.

## Terkait

<CardGroup cols={2}>
  <Card title="Skills" href="/id/tools/skills" icon="puzzle-piece">
    Cara perintah garis miring Skills didaftarkan dan dibatasi.
  </Card>
  <Card title="Membuat Skills" href="/id/tools/creating-skills" icon="hammer">
    Buat Skills yang mendaftarkan perintah garis miringnya sendiri.
  </Card>
  <Card title="BTW" href="/id/tools/btw" icon="comments">
    Ajukan pertanyaan sampingan tanpa mengubah konteks sesi.
  </Card>
  <Card title="Pengarahan" href="/id/tools/steer" icon="compass">
    Arahkan agen saat sedang berjalan dengan `/steer`.
  </Card>
</CardGroup>
