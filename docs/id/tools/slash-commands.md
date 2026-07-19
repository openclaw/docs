---
read_when:
    - Menggunakan atau mengonfigurasi perintah chat
    - Men-debug perutean perintah atau izin
    - Memahami cara perintah Skills didaftarkan
sidebarTitle: Slash commands
summary: Semua perintah garis miring, direktif, dan pintasan sebaris yang tersedia — konfigurasi, perutean, dan perilaku per antarmuka.
title: Perintah garis miring
x-i18n:
    generated_at: "2026-07-19T05:15:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b30bc91f438175018be882f5eb93780f99a3f99335a7200092049bfd68e2ff8
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway menangani perintah yang dikirim sebagai pesan mandiri yang diawali dengan `/`.
Perintah bash khusus host menggunakan `! <cmd>` (dengan `/bash <cmd>` sebagai alias).

Saat percakapan terikat ke sesi ACP, teks biasa diarahkan ke harness ACP.
Perintah pengelolaan Gateway tetap lokal: `/acp ...` selalu diteruskan ke
penangan perintah OpenClaw, dan `/status` serta `/unfocus` tetap lokal setiap kali
penanganan perintah diaktifkan untuk permukaan tersebut.

## Tiga jenis perintah

<CardGroup cols={3}>
  <Card title="Perintah" icon="terminal">
    Pesan `/...` mandiri yang ditangani oleh Gateway. Harus dikirim sebagai
    satu-satunya konten dalam pesan.
  </Card>
  <Card title="Direktif" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — dihapus dari pesan sebelum dilihat
    oleh model. Mempertahankan pengaturan sesi saat dikirim sendiri; bertindak sebagai
    petunjuk sebaris saat dikirim bersama teks lain.
  </Card>
  <Card title="Pintasan sebaris" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — langsung dijalankan dan
    dihapus sebelum model melihat teks yang tersisa. Hanya pengirim yang berwenang.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Detail perilaku direktif">
    - Direktif dihapus dari pesan sebelum dilihat oleh model.
    - Dalam pesan **khusus direktif** (pesan hanya berisi direktif), direktif
      dipertahankan dalam sesi dan dibalas dengan konfirmasi.
    - Dalam pesan **percakapan biasa** yang berisi teks lain, direktif bertindak sebagai petunjuk sebaris dan
      **tidak** mempertahankan pengaturan sesi.
    - Direktif hanya berlaku untuk **pengirim yang berwenang**. Jika `commands.allowFrom`
      ditetapkan, itulah satu-satunya daftar izin yang digunakan; jika tidak, otorisasi berasal dari
      daftar izin/penyandingan saluran serta `commands.useAccessGroups`. Pengirim yang tidak berwenang
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
  Mengaktifkan penguraian `/...` dalam pesan percakapan. Pada permukaan tanpa perintah native
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), perintah teks
  tetap berfungsi meskipun ditetapkan ke `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah native. Otomatis: aktif untuk Discord/Telegram; nonaktif untuk Slack;
  diabaikan untuk penyedia tanpa dukungan native. Timpa per saluran dengan
  `channels.<provider>.commands.native`. Di Discord, `false` melewati pendaftaran
  perintah garis miring; perintah yang sebelumnya didaftarkan mungkin tetap terlihat hingga dihapus.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Mendaftarkan perintah skill secara native jika didukung. Otomatis: aktif untuk
  Discord/Telegram; nonaktif untuk Slack. Timpa dengan
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Mengaktifkan `! <cmd>` untuk menjalankan perintah shell host (alias `/bash <cmd>`). Memerlukan
  daftar izin `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Durasi tunggu bash sebelum beralih ke mode latar belakang (`0` langsung
  menjalankannya di latar belakang).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Mengaktifkan `/config` (membaca/menulis `openclaw.json`). Khusus pemilik.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Mengaktifkan `/mcp` (membaca/menulis konfigurasi MCP yang dikelola OpenClaw di bawah `mcp.servers`). Khusus pemilik.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Mengaktifkan `/plugins` (penemuan/status plugin serta pemasangan + pengaktifan/penonaktifan). Penulisan khusus pemilik.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Mengaktifkan `/debug` (penimpaan konfigurasi khusus runtime). Khusus pemilik.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Mengaktifkan `/restart` dan permintaan mulai ulang eksternal `SIGUSR1`.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Daftar izin pemilik eksplisit untuk permukaan perintah khusus pemilik. Terpisah dari
  `commands.allowFrom` dan akses penyandingan DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per saluran: mewajibkan identitas pemilik untuk perintah khusus pemilik. Saat `true`,
  pengirim harus cocok dengan `commands.ownerAllowFrom` atau memiliki cakupan internal `operator.admin`.
  Entri karakter pengganti `allowFrom` **tidak** memadai.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Mengontrol cara id pemilik ditampilkan dalam prompt sistem.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Rahasia HMAC yang digunakan saat `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Daftar izin per penyedia untuk otorisasi perintah. Saat dikonfigurasi, daftar ini menjadi
  **satu-satunya** sumber otorisasi untuk perintah dan direktif. Gunakan `"*"` sebagai
  default global; kunci khusus penyedia menimpanya.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Menerapkan daftar izin/kebijakan untuk perintah saat `commands.allowFrom` tidak ditetapkan.
</ParamField>

## Daftar perintah

Perintah berasal dari tiga sumber:

- **Bawaan inti:** `src/auto-reply/commands-registry.shared.ts`
- **Perintah dock yang dihasilkan:** `src/auto-reply/commands-registry.data.ts`
- **Perintah plugin:** pemanggilan `registerCommand()` oleh plugin

Ketersediaan bergantung pada flag konfigurasi, permukaan saluran, serta plugin yang
terpasang/diaktifkan.

### Perintah inti

<AccordionGroup>
  <Accordion title="Sesi dan proses">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/new [model]` | Arsipkan sesi saat ini dan mulai sesi baru |
    | `/reset [soft [message]]` | Atur ulang sesi saat ini di tempat. `soft` mempertahankan transkrip, menghapus id sesi backend CLI yang digunakan kembali, dan menjalankan ulang proses awal |
    | `/name <title>` | Beri nama atau ganti nama sesi saat ini. Hilangkan judul untuk melihat nama saat ini dan saran |
    | `/compact [instructions]` | Padatkan konteks sesi. Lihat [Compaction](/id/concepts/compaction) |
    | `/stop` | Batalkan proses saat ini |
    | `/session idle <duration\|off>` | Kelola kedaluwarsa karena tidak aktif pada pengikatan utas |
    | `/session max-age <duration\|off>` | Kelola kedaluwarsa usia maksimum pengikatan utas |
    | `/export-session [path]` | Khusus pemilik. Ekspor sesi saat ini ke HTML di dalam ruang kerja. Alias: `/export` |
    | `/export-trajectory [path]` | Ekspor bundel lintasan JSONL untuk sesi saat ini. Alias: `/trajectory` |

    Jalur `/export-session` yang eksplisit mengganti file yang sudah ada di dalam
    ruang kerja. Hilangkan jalur untuk menghasilkan nama file yang aman dari benturan.

    <Note>
      Control UI mencegat `/new` yang diketik untuk membuat dan beralih ke sesi
      dasbor baru, kecuali jika `session.dmScope: "main"` dikonfigurasi
      dan induk saat ini adalah sesi utama agen — dalam hal tersebut `/new`
      mengatur ulang sesi utama di tempat. `/reset` yang diketik tetap menjalankan
      pengaturan ulang di tempat milik Gateway. Gunakan `/model default` jika Anda ingin menghapus
      pilihan model sesi yang disematkan.
    </Note>

  </Accordion>

  <Accordion title="Kontrol model dan proses">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/think <level\|default>` | Tetapkan tingkat pemikiran atau hapus penimpaan sesi. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Alihkan keluaran verbose. Alias: `/v` |
    | `/trace on\|off` | Alihkan keluaran pelacakan plugin untuk sesi saat ini |
    | `/fast [status\|auto\|on\|off\|default]` | Tampilkan, tetapkan, atau hapus mode cepat |
    | `/reasoning [on\|off\|stream]` | Alihkan visibilitas penalaran. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Alihkan mode dengan hak istimewa lebih tinggi. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Tampilkan atau tetapkan default eksekusi |
    | `/login [codex\|openai\|openai-codex]` | Sandingkan login Codex/OpenAI dari percakapan privat atau sesi Web UI. Hanya pemilik/admin |
    | `/model [name\|#\|status]` | Tampilkan atau tetapkan model |
    | `/models [provider] [page] [limit=<n>\|all]` | Cantumkan penyedia atau model yang dikonfigurasi/tersedia melalui autentikasi |
    | `/queue <mode>` | Kelola perilaku antrean proses aktif. Lihat [Antrean](/id/concepts/queue) dan [Pengarahan antrean](/id/concepts/queue-steering) |
    | `/steer <message>` | Suntikkan panduan ke proses aktif. Alias: `/tell`. Lihat [Pengarahan](/id/tools/steer) |

    <AccordionGroup>
      <Accordion title="Keamanan verbose / pelacakan / cepat / penalaran">
        - `/verbose` ditujukan untuk debugging — biarkan **nonaktif** dalam penggunaan normal.
        - `/trace` hanya menampilkan baris pelacakan/debug milik plugin; percakapan verbose biasa tetap nonaktif.
        - `/fast auto|on|off` mempertahankan penimpaan sesi; gunakan opsi `inherit` di UI Sesi untuk menghapusnya.
        - `/fast` bersifat khusus penyedia: OpenAI/Codex memetakannya ke `service_tier=priority`; permintaan langsung Anthropic memetakannya ke `service_tier=auto` atau `standard_only`.
        - `/reasoning`, `/verbose`, dan `/trace` berisiko dalam pengaturan grup — fitur tersebut dapat mengungkap penalaran internal atau diagnostik plugin. Biarkan nonaktif dalam percakapan grup.

      </Accordion>
      <Accordion title="Detail pergantian model">
        - `/model` langsung mempertahankan model baru dalam sesi.
        - Jika agen sedang tidak aktif, proses berikutnya langsung menggunakannya.
        - Jika proses sedang aktif, pergantian ditandai sebagai tertunda dan diterapkan pada titik percobaan ulang bersih berikutnya.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Penemuan dan status">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/help` | Tampilkan ringkasan bantuan singkat |
    | `/commands` | Tampilkan katalog perintah yang dihasilkan |
    | `/tools [compact\|verbose]` | Tampilkan apa yang dapat digunakan agen saat ini |
    | `/status` | Tampilkan status eksekusi/runtime, waktu aktif Gateway dan sistem, kesehatan plugin, serta penggunaan/kuota penyedia |
    | `/status plugins` | Tampilkan kesehatan plugin secara mendetail: kesalahan pemuatan, karantina, kegagalan plugin saluran, masalah dependensi, pemberitahuan kompatibilitas. Memerlukan `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Kelola [sasaran](/id/tools/goal) persisten sesi saat ini |
    | `/diagnostics [note]` | Alur laporan dukungan khusus pemilik. Selalu meminta persetujuan eksekusi |
    | `/openclaw <request>` | Jalankan pembantu penyiapan dan perbaikan OpenClaw dari DM pemilik |
    | `/tasks` | Cantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini |
    | `/context [list\|detail\|map\|json]` | Jelaskan cara konteks disusun |
    | `/whoami` | Tampilkan id pengirim Anda. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Kontrol catatan kaki penggunaan per respons (`reset`/`inherit`/`clear`/`default` menghapus penimpaan sesi agar kembali mewarisi default yang dikonfigurasi) atau cetak ringkasan biaya lokal |
  </Accordion>

  <Accordion title="Skills, daftar izin, persetujuan">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/skill <name> [input]` | Jalankan skill berdasarkan nama |
    | `/learn [request]` | Buat draf satu skill yang dapat ditinjau dari percakapan saat ini atau sumber bernama melalui [Lokakarya Skill](/id/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Kelola entri daftar izin. Hanya teks |
    | `/approve <id> <decision>` | Selesaikan permintaan persetujuan eksekusi atau plugin |
    | `/btw <question>` | Ajukan pertanyaan sampingan tanpa mengubah konteks sesi. Alias: `/side`. Lihat [BTW](/id/tools/btw) |
  </Accordion>

  <Accordion title="Subagen dan ACP">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/subagents list\|log\|info` | Periksa proses subagen untuk sesi saat ini |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Kelola sesi ACP dan opsi runtime. Kontrol runtime memerlukan identitas pemilik eksternal atau admin Gateway internal |
    | `/focus <target>` | Kaitkan utas Discord atau topik Telegram saat ini ke target sesi |
    | `/unfocus` | Hapus pengaitan utas saat ini |
    | `/agents` | Cantumkan agen yang terikat ke utas untuk sesi saat ini |
  </Accordion>

  <Accordion title="Penulisan dan administrasi khusus pemilik">
    | Perintah | Memerlukan | Deskripsi |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Baca atau tulis `openclaw.json`. Khusus pemilik |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Baca atau tulis konfigurasi server MCP yang dikelola OpenClaw. Khusus pemilik |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Periksa atau ubah status plugin. Penulisan hanya untuk pemilik. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Penggantian konfigurasi khusus runtime. Khusus pemilik |
    | `/restart` | `commands.restart: true` (bawaan) | Mulai ulang OpenClaw |
    | `/send on\|off\|inherit` | pemilik | Tetapkan kebijakan pengiriman |
  </Accordion>

  <Accordion title="Suara, TTS, kontrol kanal">
    | Perintah | Deskripsi |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Kontrol TTS. Lihat [TTS](/id/tools/tts) |
    | `/activation mention\|always` | Tetapkan mode aktivasi grup |
    | `/bash <command>` | Jalankan perintah shell host. Alias: `! <command>`. Memerlukan `commands.bash: true` |
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

Perintah docking memerlukan `session.identityLinks`. Pengirim sumber dan peer target
harus berada dalam grup identitas yang sama.

### Perintah plugin bawaan

| Perintah                                                 | Deskripsi                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Aktifkan atau nonaktifkan dreaming memori (pemilik atau admin Gateway). Lihat [Dreaming](/id/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Kelola pemasangan perangkat. Lihat [Pemasangan](/id/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Aktifkan sementara perintah node berisiko tinggi (kamera/layar/komputer/penulisan). Lihat [Penggunaan komputer](/id/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Kelola konfigurasi suara Talk. Nama native Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | Kirim preset kartu kaya LINE. Lihat [LINE](/id/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | Kaitkan, arahkan, dan periksa harness app-server Codex (status, utas, lanjutkan, model, cepat, izin, pemadatan, tinjauan, mcp, skill, dan lainnya). Lihat [Harness Codex](/id/plugins/codex-harness) |

Khusus QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Perintah skill

Skill yang dapat dijalankan pengguna diekspos sebagai perintah garis miring:

- `/skill <name> [input]` selalu berfungsi sebagai titik masuk generik.
- Skills dapat didaftarkan sebagai perintah langsung (misalnya `/prose` untuk OpenProse).
- Pendaftaran perintah skill native dikontrol oleh `commands.nativeSkills` dan
  `channels.<provider>.commands.nativeSkills`.
- Nama dibersihkan menjadi `a-z0-9_` (maks. 32 karakter); konflik mendapatkan akhiran numerik.

<AccordionGroup>
  <Accordion title="Pengiriman perintah skill">
    Secara bawaan, perintah skill dirutekan ke model sebagai permintaan normal.

    Skills dapat mendeklarasikan `command-dispatch: tool` untuk merutekan langsung ke alat
    (deterministik, tanpa keterlibatan model). Contoh: `/prose` (plugin OpenProse)
    — lihat [OpenProse](/id/prose).

  </Accordion>
  <Accordion title="Argumen perintah native">
    Discord menggunakan pelengkapan otomatis untuk opsi dinamis dan menu tombol ketika argumen
    yang diperlukan tidak diberikan. Telegram dan Slack menampilkan menu tombol untuk perintah dengan
    pilihan. Pilihan dinamis ditentukan berdasarkan model sesi target, sehingga opsi khusus
    model seperti tingkat `/think` mengikuti penggantian `/model` sesi.
  </Accordion>
</AccordionGroup>

## `/tools`: yang dapat digunakan agen sekarang

`/tools` menjawab pertanyaan runtime: **apa yang dapat digunakan agen ini saat ini dalam
percakapan ini** — bukan katalog konfigurasi statis.

```text
/tools         # tampilan ringkas
/tools verbose # dengan deskripsi singkat
```

Hasil memiliki cakupan sesi. Mengubah agen, kanal, utas, otorisasi
pengirim, atau model dapat mengubah keluarannya. Untuk mengedit profil dan penggantian,
gunakan panel Alat UI Kontrol atau permukaan konfigurasi.

## `/model`: pemilihan model

```text
/model             # tampilkan pemilih model
/model list        # sama
/model 3           # pilih berdasarkan nomor dari pemilih
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # hapus pemilihan model sesi
/model status      # tampilan terperinci dengan endpoint dan mode API
```

Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan menu tarik-turun penyedia dan
model. Pemilih mematuhi `agents.defaults.modelPolicy.allow`,
termasuk entri `provider/*`. Tanpa daftar izin eksplisit, entri model dan
alias tidak membatasi pemilihan.

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
tetap ada setelah dimulai ulang.

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
`/mcp show` menyamarkan bidang yang memuat kredensial, nilai flag kredensial
yang dikenali, dan argumen yang diketahui menyerupai rahasia. Ketika dijalankan dari grup,
konfigurasi dikirim secara pribadi kepada pemilik; jika tidak tersedia rute pribadi ke
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
  Penulisan hanya untuk pemilik. Dinonaktifkan secara bawaan — aktifkan dengan `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` memperbarui konfigurasi plugin dan memuat ulang secara langsung runtime
plugin Gateway untuk giliran agen baru. `/plugins install` memulai ulang Gateway yang
dikelola secara otomatis karena modul sumber plugin berubah. Instalasi ClawHub tepercaya
dan katalog resmi tidak memerlukan pengakuan tambahan. Sumber npm, git, arsip,
`npm-pack:`, dan jalur lokal arbitrer menampilkan peringatan asal-usul dan
memerlukan `--force` di bagian akhir setelah Anda meninjau sumbernya. Flag ini mengakui
sumber dan mengizinkan penggantian instalasi yang sudah ada; flag ini tidak melewati
`security.installPolicy` atau pemeriksaan keamanan penginstal. Rilis ClawHub dengan
peringatan risiko tetap memerlukan flag khusus shell yang terpisah,
`--acknowledge-clawhub-risk`. Instalasi marketplace, tertaut, dan disematkan juga
tetap hanya tersedia melalui shell.

## `/trace`: keluaran pelacakan plugin

```text
/trace          # tampilkan status pelacakan saat ini
/trace on
/trace off
```

`/trace` menampilkan baris pelacakan/debug plugin dengan cakupan sesi tanpa mode verbose
penuh. Ini tidak menggantikan `/debug` (penggantian runtime) atau `/verbose` (keluaran
alat normal).

## `/btw`: pertanyaan sampingan

`/btw` adalah pertanyaan sampingan cepat tentang konteks sesi saat ini. Alias: `/side`.

```text
/btw apa yang sedang kita lakukan saat ini?
/side apa yang berubah sementara proses utama berlanjut?
```

Tidak seperti pesan normal:

- Menggunakan sesi saat ini sebagai konteks latar belakang.
- Dalam sesi harness Codex, berjalan sebagai utas sampingan Codex sementara.
- **Tidak** mengubah konteks sesi mendatang.
- Tidak ditulis ke riwayat transkrip.

Lihat [Pertanyaan sampingan BTW](/id/tools/btw) untuk perilaku lengkapnya.

## Catatan permukaan

<AccordionGroup>
  <Accordion title="Cakupan sesi per permukaan">
    - **Perintah teks:** berjalan dalam sesi percakapan normal (DM berbagi `main`, grup memiliki sesinya sendiri).
    - **Perintah native Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Perintah native Slack:** `agent:<agentId>:slack:slash:<userId>` (awalan dapat dikonfigurasi melalui `channels.slack.slashCommand.sessionPrefix`)
    - **Perintah native Telegram:** `telegram:slash:<userId>` (menargetkan sesi percakapan melalui `CommandTargetSessionKey`)
    - **`/login codex`** mengirim kode pemasangan perangkat hanya melalui percakapan pribadi atau jalur respons UI Web. Pemanggilan dari grup/topik Telegram meminta pemilik mengirim DM ke bot sebagai gantinya.
    - **`/stop`** menargetkan sesi percakapan aktif untuk membatalkan proses saat ini.

  </Accordion>
  <Accordion title="Khusus Slack">
    `channels.slack.slashCommand` mendukung satu perintah bergaya `/openclaw`.
    Dengan `commands.native: true`, buat satu perintah garis miring Slack untuk setiap
    perintah bawaan. Daftarkan `/agentstatus` (bukan `/status`) karena Slack mencadangkan
    `/status`. Teks `/status` tetap berfungsi dalam pesan Slack.
  </Accordion>
  <Accordion title="Jalur cepat dan pintasan sebaris">
    - Pesan yang hanya berisi perintah dari pengirim dalam daftar yang diizinkan ditangani segera (melewati antrean + model).
    - Pintasan sebaris (`/help`, `/commands`, `/status`, `/whoami`) juga berfungsi saat disematkan dalam pesan biasa dan dihapus sebelum model melihat teks yang tersisa.
    - Pesan tidak sah yang hanya berisi perintah diabaikan tanpa pemberitahuan; token `/...` sebaris diperlakukan sebagai teks biasa.

  </Accordion>
  <Accordion title="Catatan argumen">
    - Perintah menerima `:` opsional di antara perintah dan argumen (`/think: high`, `/send: on`).
    - `/new <model>` menerima alias model, `provider/model`, atau nama penyedia (pencocokan fuzzy); jika tidak ada kecocokan, teks tersebut diperlakukan sebagai isi pesan.
    - `/allowlist add|remove` memerlukan `commands.config: true` dan mematuhi `configWrites` kanal.

  </Accordion>
</AccordionGroup>

## Penggunaan dan status penyedia

- **Penggunaan/kuota penyedia** (misalnya, "Claude tersisa 80%") ditampilkan di `/status` untuk penyedia model saat ini ketika pelacakan penggunaan diaktifkan.
- **Baris token/cache** di `/status` dapat menggunakan entri penggunaan transkrip terbaru sebagai cadangan ketika snapshot sesi langsung minim.
- **Eksekusi vs runtime:** `/status` melaporkan `Execution` untuk jalur sandbox yang efektif dan `Runtime` untuk pihak yang menjalankan sesi: `OpenClaw Default`, `OpenAI Codex`, backend CLI, atau backend ACP.
- **Token/biaya per respons:** dikontrol oleh `/usage off|tokens|full`.
- `/model status` berkaitan dengan model/autentikasi/endpoint, bukan penggunaan.

## Terkait

<CardGroup cols={2}>
  <Card title="Skills" href="/id/tools/skills" icon="puzzle-piece">
    Cara perintah garis miring Skills didaftarkan dan dibatasi.
  </Card>
  <Card title="Membuat Skills" href="/id/tools/creating-skills" icon="hammer">
    Buat skill yang mendaftarkan perintah garis miringnya sendiri.
  </Card>
  <Card title="BTW" href="/id/tools/btw" icon="comments">
    Pertanyaan sampingan tanpa mengubah konteks sesi.
  </Card>
  <Card title="Arahkan" href="/id/tools/steer" icon="compass">
    Arahkan agen di tengah proses dengan `/steer`.
  </Card>
</CardGroup>
