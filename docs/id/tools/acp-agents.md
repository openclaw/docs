---
read_when:
    - Menjalankan harness pengodean melalui ACP
    - Menyiapkan sesi ACP yang terikat pada percakapan di saluran perpesanan
    - Mengikat percakapan saluran pesan ke sesi ACP persisten
    - Pemecahan masalah backend ACP, pengkabelan plugin, atau pengiriman penyelesaian
    - Mengoperasikan perintah /acp dari obrolan
sidebarTitle: ACP agents
summary: Jalankan harness pemrograman eksternal (Claude Code, Cursor, Gemini CLI, Codex ACP eksplisit, OpenClaw ACP, OpenCode) melalui backend ACP
title: Agen ACP
x-i18n:
    generated_at: "2026-07-20T03:58:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a2b2b3754e7889f06e65740b9c08e56ec8d01637c286ec2dfa743ae2f7e507e
    source_path: tools/acp-agents.md
    workflow: 16
---

Sesi [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) memungkinkan
OpenClaw menjalankan harness pengodean eksternal (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain yang didukung)
melalui plugin backend ACP. Setiap proses yang dijalankan dilacak sebagai
[tugas latar belakang](/id/automation/tasks).

<Note>
**ACP adalah jalur harness eksternal, bukan jalur Codex default.** Plugin
server aplikasi Codex native memiliki kontrol `/codex ...` dan runtime tertanam
`openai/gpt-*` default untuk giliran agen; ACP memiliki kontrol `/acp ...`
dan sesi `sessions_spawn({ runtime: "acp" })`.

Agar Codex atau Claude Code terhubung langsung sebagai klien MCP eksternal ke
percakapan channel OpenClaw yang ada, gunakan
[`openclaw mcp serve`](/id/cli/mcp), bukan ACP.
</Note>

## Halaman mana yang harus digunakan?

| Yang ingin dilakukan...                                                                        | Gunakan ini                           | Catatan                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mengikat atau mengontrol Codex dalam percakapan saat ini                                        | `/codex bind`, `/codex threads`       | Jalur server aplikasi Codex native saat plugin `codex` diaktifkan: balasan obrolan terikat, penerusan gambar, model/cepat/izin, penghentian, dan pengarahan. ACP adalah fallback eksplisit |
| Menjalankan Claude Code, Gemini CLI, Codex ACP eksplisit, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini                           | Sesi yang terikat ke obrolan, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime |
| Mengekspos sesi Gateway OpenClaw _sebagai_ server ACP untuk editor atau klien                   | [`openclaw acp`](/id/cli/acp)            | Mode jembatan: IDE/klien berkomunikasi dengan OpenClaw menggunakan ACP melalui stdio/WebSocket                                                                               |
| Menggunakan kembali CLI AI lokal sebagai model fallback khusus teks                             | [Backend CLI](/id/gateway/cli-backends)  | Bukan ACP: tanpa alat OpenClaw, tanpa kontrol ACP, tanpa runtime harness                                                                                                     |

## Apakah ini langsung berfungsi?

Ya, setelah menginstal plugin runtime ACP resmi:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkout sumber dapat menggunakan plugin workspace `extensions/acpx` lokal setelah
`pnpm install`. Jalankan `/acp doctor` untuk memeriksa kesiapan.

OpenClaw hanya memberi tahu agen tentang peluncuran ACP saat ACP **benar-benar dapat digunakan**:
ACP harus diaktifkan, dispatch tidak boleh dinonaktifkan, sesi saat ini tidak boleh
diblokir sandbox, serta backend runtime harus dimuat dan sehat. Jika
salah satu kondisi gagal, Skills ACP dan panduan ACP `sessions_spawn` tetap disembunyikan
agar agen tidak menyarankan backend yang tidak tersedia.

<AccordionGroup>
  <Accordion title="Hal yang perlu diperhatikan saat pertama kali dijalankan">
    - Jika `plugins.allow` ditetapkan, nilai tersebut merupakan inventaris plugin yang restriktif dan **harus** menyertakan `acpx`, atau backend ACP yang terinstal sengaja diblokir (`/acp doctor` melaporkan entri daftar izin yang tidak ada).
    - Adaptor Codex ACP disertakan bersama plugin `acpx` dan dijalankan secara lokal jika memungkinkan.
    - Codex ACP berjalan dengan `CODEX_HOME` yang terisolasi. OpenClaw menyalin entri kepercayaan proyek tepercaya beserta konfigurasi perutean model/penyedia yang aman (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode`, dan bidang `model_providers.<name>` yang aman) dari konfigurasi Codex host; autentikasi, notifikasi, dan hook hanya tetap berada dalam konfigurasi host.
    - Adaptor harness target lainnya dapat diambil sesuai permintaan dengan `npx` saat pertama kali digunakan.
    - Autentikasi vendor harus sudah tersedia pada host untuk harness tersebut.
    - Jika host tidak memiliki npm atau akses jaringan, pengambilan adaptor saat pertama kali dijalankan akan gagal hingga cache dipanaskan terlebih dahulu atau adaptor diinstal dengan cara lain.

  </Accordion>
  <Accordion title="Prasyarat runtime">
    ACP menjalankan proses harness eksternal yang sebenarnya. OpenClaw memiliki perutean,
    status tugas latar belakang, pengiriman, pengikatan, dan kebijakan; harness memiliki
    login penyedia, katalog model, perilaku sistem berkas, dan alat native-nya sendiri.

    Sebelum menyalahkan OpenClaw, verifikasi:

    - `/acp doctor` melaporkan backend yang aktif dan sehat.
    - ID target diizinkan oleh `acp.allowedAgents` saat daftar izin tersebut ditetapkan.
    - Perintah harness dapat dimulai pada host Gateway.
    - Autentikasi penyedia tersedia untuk harness tersebut (`claude`, `codex`, `gemini`, `opencode`, `droid`, dan sebagainya).
    - Model yang dipilih tersedia untuk harness tersebut—ID model tidak portabel antar-harness.
    - `cwd` yang diminta tersedia dan dapat diakses, atau hilangkan `cwd` dan biarkan backend menggunakan nilai default-nya.
    - Mode izin sesuai dengan pekerjaan. Sesi noninteraktif tidak dapat mengeklik prompt izin native, sehingga proses pengodean yang banyak melakukan penulisan/eksekusi biasanya memerlukan profil izin ACPX yang dapat berjalan tanpa interaksi.

  </Accordion>
</AccordionGroup>

Alat plugin OpenClaw dan alat bawaan OpenClaw **tidak** diekspos ke
harness ACP secara default. Aktifkan jembatan MCP eksplisit di
[Agen ACP—penyiapan](/id/tools/acp-agents-setup) hanya jika harness perlu
memanggil alat tersebut secara langsung.

## Target harness yang didukung

Dengan backend `acpx`, gunakan ID berikut sebagai target `/acp spawn <id>`
atau `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID harness   | Backend umum                                    | Catatan                                                                             |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`     | Adaptor Claude Code ACP                        | Memerlukan autentikasi Claude Code pada host.                                       |
| `codex`      | Adaptor Codex ACP                              | Hanya sebagai fallback ACP eksplisit saat `/codex` native tidak tersedia atau ACP diminta. |
| `copilot`    | Adaptor GitHub Copilot ACP                     | Memerlukan autentikasi CLI/runtime Copilot.                                         |
| `cursor`     | Cursor CLI ACP (`cursor-agent acp`)            | Ganti perintah acpx jika instalasi lokal menyediakan titik masuk ACP yang berbeda.  |
| `droid`      | Factory Droid CLI                              | Memerlukan autentikasi Factory/Droid atau `FACTORY_API_KEY` dalam lingkungan harness. |
| `fast-agent` | Adaptor fast-agent-mcp ACP                     | Diambil sesuai permintaan dengan `uvx`.                                |
| `gemini`     | Adaptor Gemini CLI ACP                         | Memerlukan autentikasi Gemini CLI atau penyiapan kunci API.                         |
| `iflow`      | iFlow CLI                                      | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terinstal.           |
| `kilocode`   | Kilo Code CLI                                  | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terinstal.           |
| `kimi`       | Kimi/Moonshot CLI                              | Memerlukan autentikasi Kimi/Moonshot pada host.                                     |
| `kiro`       | Kiro CLI                                       | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terinstal.           |
| `mux`        | Adaptor Mux CLI ACP                            | Diambil sesuai permintaan dengan `npx`.                                |
| `opencode`   | Adaptor OpenCode ACP                           | Memerlukan autentikasi CLI/penyedia OpenCode.                                       |
| `openclaw`   | Jembatan Gateway OpenClaw melalui `openclaw acp` | Memungkinkan harness yang mendukung ACP berkomunikasi kembali dengan sesi Gateway OpenClaw. |
| `qoder`      | Qoder CLI                                      | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terinstal.           |
| `qwen`       | Qwen Code / Qwen CLI                           | Memerlukan autentikasi yang kompatibel dengan Qwen pada host.                       |
| `trae`       | Adaptor Trae CLI ACP                           | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terinstal.           |

`pi` (pi-acp) juga terdaftar dalam backend acpx, tetapi bukan merupakan
harness pengodean dalam pengertian yang sama seperti target lain di atas.

Alias agen acpx khusus dapat dikonfigurasi dalam acpx itu sendiri, tetapi kebijakan
OpenClaw tetap memeriksa `acp.allowedAgents` dan setiap pemetaan
`agents.list[].runtime.acp.agent` sebelum dispatch.

## Panduan operasional

Alur cepat `/acp` dari obrolan:

<Steps>
  <Step title="Jalankan">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, atau
    `/acp spawn codex --bind here` secara eksplisit.
  </Step>
  <Step title="Kerjakan">
    Lanjutkan dalam percakapan atau thread yang terikat (atau targetkan kunci sesi
    secara eksplisit).
  </Step>
  <Step title="Periksa status">
    `/acp status`
  </Step>
  <Step title="Sesuaikan">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Arahkan">
    Tanpa mengganti konteks: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Hentikan">
    `/acp cancel` (giliran saat ini) atau `/acp close` (sesi + pengikatan).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detail siklus hidup">
    - Spawn membuat atau melanjutkan sesi runtime ACP, mencatat metadata ACP di penyimpanan sesi OpenClaw, dan dapat membuat tugas latar belakang ketika proses dijalankan dengan kepemilikan induk.
    - Sesi ACP dengan kepemilikan induk diperlakukan sebagai pekerjaan latar belakang meskipun sesi runtime bersifat persisten; penyelesaian dan pengiriman lintas permukaan dilakukan melalui pemberi tahu tugas induk, bukan bertindak seperti sesi percakapan normal yang ditampilkan kepada pengguna.
    - Pemeliharaan tugas menutup sesi ACP sekali jalan dengan kepemilikan induk yang telah berakhir atau menjadi yatim. Sesi ACP persisten dipertahankan selama pengikatan percakapan aktif masih ada; sesi persisten usang tanpa pengikatan aktif ditutup agar tidak dapat dilanjutkan secara diam-diam setelah tugas pemilik selesai atau catatan tugasnya hilang.
    - Pesan lanjutan yang terikat dikirim langsung ke sesi ACP hingga pengikatan ditutup, kehilangan fokus, diatur ulang, atau kedaluwarsa.
    - Perintah Gateway tetap ditangani secara lokal. `/acp ...`, `/status`, dan `/unfocus` tidak pernah dikirim sebagai teks prompt biasa ke harness ACP yang terikat.
    - `cancel` membatalkan giliran aktif ketika backend mendukung pembatalan; tindakan ini tidak menghapus pengikatan atau metadata sesi.
    - `close` mengakhiri sesi ACP dari sudut pandang OpenClaw dan menghapus pengikatan. Harness mungkin tetap menyimpan riwayat upstream-nya sendiri jika mendukung pelanjutan.
    - Plugin acpx membersihkan pohon proses pembungkus dan adaptor milik OpenClaw setelah `close`, serta membersihkan proses yatim ACPX milik OpenClaw yang usang saat Gateway dimulai.
    - Worker runtime yang menganggur dapat dibersihkan setelah periode menganggur bawaan; metadata sesi yang tersimpan tetap tersedia untuk `/acp sessions`.

  </Accordion>
  <Accordion title="Aturan perutean Codex native">
    Pemicu bahasa alami yang harus dirutekan ke **Plugin Codex native**
    ketika diaktifkan:

    - "Ikat channel Discord ini ke Codex."
    - "Lampirkan percakapan ini ke thread Codex `<id>`."
    - "Tampilkan thread Codex, lalu ikat yang ini."

    Pengikatan percakapan Codex native adalah jalur kontrol percakapan default.
    Alat dinamis OpenClaw tetap dijalankan melalui OpenClaw, sedangkan alat
    native Codex seperti shell/apply-patch dijalankan di dalam Codex. Untuk
    peristiwa alat native Codex, OpenClaw menyuntikkan relai hook native per
    giliran agar hook Plugin dapat memblokir `before_tool_call`, mengamati
    `after_tool_call`, dan merutekan peristiwa `PermissionRequest` Codex melalui
    persetujuan OpenClaw. Hook `Stop` Codex direlai ke
    `before_agent_finalize` OpenClaw, tempat Plugin dapat meminta satu kali lagi
    proses model sebelum Codex menyelesaikan jawabannya. Relai tersebut sengaja
    dibuat konservatif: relai tidak mengubah argumen alat native Codex atau
    menulis ulang catatan thread Codex. Gunakan ACP eksplisit hanya ketika Anda
    menginginkan model runtime/sesi ACP. Batas dukungan Codex tertanam
    didokumentasikan dalam
    [kontrak dukungan harness Codex v1](/id/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Ringkasan pemilihan model / penyedia / runtime">
    - referensi model Codex lama - rute model OAuth/langganan Codex lama yang diperbaiki oleh doctor.
    - `openai/*` - runtime tertanam app-server Codex native untuk giliran agen OpenAI.
    - `/codex ...` - kontrol percakapan Codex native.
    - `/acp ...` atau `runtime: "acp"` - kontrol ACP/acpx eksplisit.

  </Accordion>
  <Accordion title="Pemicu bahasa alami untuk perutean ACP">
    Pemicu yang harus dirutekan ke runtime ACP:

    - "Jalankan ini sebagai sesi ACP Claude Code sekali jalan dan rangkum hasilnya."
    - "Gunakan Gemini CLI untuk tugas ini dalam sebuah thread, lalu pertahankan pesan lanjutan di thread yang sama."
    - "Jalankan Codex melalui ACP dalam thread latar belakang."

    OpenClaw memilih `runtime: "acp"`, menentukan harness `agentId`,
    mengikatnya ke percakapan atau thread saat ini jika didukung, dan merutekan
    pesan lanjutan ke sesi tersebut hingga ditutup/kedaluwarsa. Codex hanya
    mengikuti jalur ini ketika ACP/acpx dinyatakan secara eksplisit atau Plugin
    Codex native tidak tersedia untuk operasi yang diminta.

    Untuk `sessions_spawn`, `runtime: "acp"` hanya ditawarkan ketika ACP
    diaktifkan, peminta tidak berada dalam sandbox, dan backend runtime ACP
    telah dimuat. `acp.dispatch.enabled=false` menjeda pengiriman thread ACP otomatis,
    tetapi tidak menyembunyikan atau memblokir panggilan `sessions_spawn({ runtime: "acp" })`
    eksplisit. Nilai ini menargetkan ID harness ACP seperti `codex`,
    `claude`, `droid`, `gemini`, atau
    `opencode`. Jangan berikan ID agen konfigurasi OpenClaw biasa dari
    `agents_list` kecuali entri tersebut dikonfigurasi secara eksplisit
    dengan `agents.list[].runtime.type="acp"`; jika tidak, gunakan runtime subagen default.
    Ketika agen OpenClaw dikonfigurasi dengan `runtime.type="acp"`, OpenClaw
    menggunakan `runtime.acp.agent` sebagai ID harness yang mendasarinya.

  </Accordion>
</AccordionGroup>

## ACP dibandingkan dengan subagen

Gunakan ACP ketika Anda menginginkan runtime harness eksternal. Gunakan
**app-server Codex native** untuk pengikatan/kontrol percakapan Codex ketika
Plugin `codex` diaktifkan. Gunakan **subagen** ketika Anda
menginginkan proses terdelegasi native OpenClaw.

| Area          | Sesi ACP                              | Proses subagen                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime subagen native OpenClaw    |
| Kunci sesi    | `agent:<agentId>:acp:<uuid>`                    | `agent:<agentId>:subagent:<uuid>`                 |
| Perintah utama | `/acp ...`                   | `/subagents ...`                 |
| Alat spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Subagen](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, susunannya adalah:

1. Bidang kontrol sesi ACP OpenClaw.
2. Plugin runtime resmi `@openclaw/acpx`.
3. Adaptor ACP Claude.
4. Mekanisme runtime/sesi di sisi Claude.

ACP Claude adalah **sesi harness** dengan kontrol ACP, pelanjutan sesi,
pelacakan tugas latar belakang, dan pengikatan percakapan/thread opsional.

Backend CLI adalah runtime fallback lokal khusus teks yang terpisah - lihat
[Backend CLI](/id/gateway/cli-backends).

Bagi operator, aturan praktisnya adalah:

- **Menginginkan `/acp spawn`, sesi yang dapat diikat, kontrol runtime, atau pekerjaan harness persisten?** Gunakan ACP.
- **Menginginkan fallback teks lokal sederhana melalui CLI mentah?** Gunakan backend CLI.

## Sesi terikat

### Model mental

- **Permukaan percakapan** - tempat orang terus berkomunikasi (channel Discord, topik Telegram, percakapan iMessage).
- **Sesi ACP** - status runtime Codex/Claude/Gemini tahan lama yang menjadi tujuan perutean OpenClaw.
- **Thread/topik turunan** - permukaan perpesanan tambahan opsional yang hanya dibuat oleh `--thread ...`.
- **Ruang kerja runtime** - lokasi sistem berkas (`cwd`, checkout repositori, ruang kerja backend) tempat harness dijalankan. Tidak bergantung pada permukaan percakapan.

### Pengikatan percakapan saat ini

`/acp spawn <harness> --bind here` menyematkan percakapan saat ini ke sesi ACP yang dibuat -
tanpa thread turunan, pada permukaan percakapan yang sama. OpenClaw tetap
mengelola transportasi, autentikasi, keamanan, dan pengiriman. Pesan lanjutan
dalam percakapan tersebut dirutekan ke sesi yang sama; `/new` dan
`/reset` mengatur ulang sesi di tempat; `/acp close` menghapus
pengikatan.

Contoh:

```text
/codex bind                                              # pengikatan Codex native, rutekan pesan berikutnya ke sini
/codex model gpt-5.4                                     # sesuaikan thread Codex native yang terikat
/codex stop                                              # kendalikan giliran Codex native yang aktif
/acp spawn codex --bind here                             # fallback ACP eksplisit untuk Codex
/acp spawn codex --thread auto                           # dapat membuat thread/topik turunan dan mengikatnya di sana
/acp spawn codex --bind here --cwd /workspace/repo       # pengikatan percakapan yang sama, Codex berjalan di /workspace/repo
```

<AccordionGroup>
  <Accordion title="Aturan dan eksklusivitas pengikatan">
    - `--bind here` dan `--thread ...` bersifat saling eksklusif.
    - `--bind here` hanya berfungsi pada channel yang menawarkan pengikatan percakapan saat ini; jika tidak, OpenClaw mengembalikan pesan yang jelas bahwa fitur tidak didukung. Pengikatan tetap bertahan setelah Gateway dimulai ulang.
    - Di Discord, `spawnSessions` mengendalikan pembuatan thread turunan untuk `--thread auto|here` - bukan `--bind here`.
    - Jika Anda melakukan spawn ke agen ACP lain tanpa `--cwd`, secara default OpenClaw mewarisi ruang kerja **agen target**. Jalur warisan yang tidak ada (`ENOENT`/`ENOTDIR`) menggunakan default backend sebagai fallback; kesalahan akses lain (misalnya `EACCES`) ditampilkan sebagai kesalahan spawn.
    - Perintah pengelolaan Gateway tetap ditangani secara lokal dalam percakapan terikat - perintah `/acp ...` ditangani oleh OpenClaw meskipun teks lanjutan biasa dirutekan ke sesi ACP yang terikat; `/status` dan `/unfocus` juga tetap ditangani secara lokal setiap kali penanganan perintah diaktifkan untuk permukaan tersebut.

  </Accordion>
  <Accordion title="Sesi yang terikat ke thread">
    Ketika pengikatan thread diaktifkan untuk adaptor channel:

    - OpenClaw mengikat thread ke sesi ACP target.
    - Pesan lanjutan dalam thread tersebut dirutekan ke sesi ACP yang terikat.
    - Keluaran ACP dikirim kembali ke thread yang sama.
    - Kehilangan fokus/penutupan/pengarsipan/batas waktu menganggur atau kedaluwarsa karena usia maksimum akan menghapus pengikatan.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, dan `/unfocus` adalah perintah Gateway, bukan prompt untuk harness ACP.

    Flag fitur yang diperlukan untuk ACP yang terikat ke thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` aktif secara default (tetapkan `false` untuk menjeda pengiriman thread ACP otomatis; panggilan `sessions_spawn({ runtime: "acp" })` eksplisit tetap berfungsi).
    - Spawn sesi thread adaptor channel diaktifkan (default: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Dukungan pengikatan thread bergantung pada adaptor. Jika adaptor channel
    aktif tidak mendukung pengikatan thread, OpenClaw mengembalikan pesan yang
    jelas bahwa fitur tidak didukung/tidak tersedia.

  </Accordion>
  <Accordion title="Channel yang mendukung thread">
    - Adaptor channel apa pun yang mengekspos kemampuan pengikatan sesi/thread.
    - Dukungan bawaan saat ini: thread/channel **Discord**, topik **Telegram** (topik forum dalam grup/supergrup dan topik DM).
    - Channel Plugin dapat menambahkan dukungan melalui antarmuka pengikatan yang sama.

  </Accordion>
</AccordionGroup>

## Pengikatan channel persisten

Untuk alur kerja non-efemeral, konfigurasikan pengikatan ACP persisten dalam
entri tingkat atas `bindings[]`.

### Model pengikatan

<ParamField path="bindings[].type" type='"acp"'>
  Menandai pengikatan percakapan ACP persisten.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Mengidentifikasi percakapan target. Bentuk per channel:

- **Kanal/utas Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Kanal/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Utamakan id Slack yang stabil; pengikatan kanal juga mencocokkan balasan di dalam utas kanal tersebut.
- **Topik forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grup WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Gunakan nomor E.164 seperti `+15555550123` untuk obrolan langsung dan JID grup WhatsApp seperti `120363424282127706@g.us` untuk grup.
- **DM/grup iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Utamakan `chat_id:*` untuk pengikatan grup yang stabil.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Id agen OpenClaw pemilik.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Penggantian ACP opsional.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Label opsional yang ditampilkan kepada operator.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Direktori kerja runtime opsional.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Penggantian backend opsional.
</ParamField>

### Default runtime per agen

Gunakan `agents.list[].runtime` untuk menetapkan default ACP sekali per agen:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, misalnya `codex` atau `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Prioritas penggantian untuk sesi terikat ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Default ACP global (misalnya `acp.backend`)

### Contoh

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Perilaku

- OpenClaw memastikan sesi ACP yang dikonfigurasi tersedia setelah penerimaan khusus kanal dan sebelum digunakan.
- Pesan dalam kanal, topik, atau obrolan tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Pengikatan ACP yang dikonfigurasi memiliki rute sesinya sendiri. Penyebaran siaran kanal tidak menggantikan sesi ACP yang dikonfigurasi untuk pengikatan yang cocok.
- Dalam percakapan terikat, `/new` dan `/reset` mengatur ulang kunci sesi ACP yang sama di tempat.
- Pengikatan runtime sementara (misalnya yang dibuat oleh alur fokus utas) tetap berlaku jika tersedia.
- Untuk pemunculan ACP lintas agen tanpa `cwd` eksplisit, OpenClaw mewarisi ruang kerja agen target dari konfigurasi agen.
- Jalur ruang kerja warisan yang tidak ada kembali ke cwd default backend; kegagalan akses pada jalur yang tersedia ditampilkan sebagai kesalahan pemunculan.

## Memulai sesi ACP

Dua cara untuk memulai sesi ACP:

<Tabs>
  <Tab title="Dari sessions_spawn">
    Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agen atau
    panggilan alat.

    ```json
    {
      "task": "Buka repositori dan rangkum pengujian yang gagal",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` secara default adalah `subagent`, jadi tetapkan `runtime: "acp"` secara eksplisit untuk
    sesi ACP. Jika `agentId` dihilangkan, OpenClaw menggunakan `acp.defaultAgent`
    jika dikonfigurasi. `mode: "session"` memerlukan `thread: true` untuk mempertahankan
    percakapan terikat yang persisten.
    </Note>

  </Tab>
  <Tab title="Dari perintah /acp">
    Gunakan `/acp spawn` untuk kontrol operator eksplisit dari obrolan.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Flag utama:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Lihat [Perintah garis miring](/id/tools/slash-commands).

  </Tab>
</Tabs>

### Parameter `sessions_spawn`

<ParamField path="task" type="string" required>
  Prompt awal yang dikirim ke sesi ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Harus berupa `"acp"` untuk sesi ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Id harness target ACP. Kembali ke `acp.defaultAgent` jika ditetapkan.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Meminta alur pengikatan utas jika didukung.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` hanya berjalan sekali; `"session"` bersifat persisten. Jika `thread: true` dan
  `mode` dihilangkan, OpenClaw dapat menggunakan perilaku persisten secara default sesuai
  jalur runtime. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime).
  Jika dihilangkan, pemunculan ACP mewarisi ruang kerja agen target jika dikonfigurasi;
  jalur warisan yang tidak ada kembali ke default backend, sedangkan kesalahan akses
  yang nyata akan dikembalikan.
</ParamField>
<ParamField path="label" type="string">
  Label yang ditampilkan kepada operator dan digunakan dalam teks sesi/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Melanjutkan sesi ACP yang ada alih-alih membuat sesi baru. Agen
  memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` mengalirkan ringkasan kemajuan proses awal ACP kembali ke sesi
  peminta sebagai peristiwa sistem. OpenClaw mencatat riwayat relai lengkap dalam
  status SQLite agen anak dan menghapusnya bersama sesi anak. Aliran
  kemajuan induk menampilkan komentar asisten dan kemajuan status ACP secara default kecuali
  `streaming.progress.commentary=false`. Discord juga secara default menampilkan pratinjau induk
  dalam mode kemajuan jika tidak ada mode aliran yang dikonfigurasi. Kemajuan
  status tetap mematuhi `acp.stream.tagVisibility`, sehingga tag seperti `plan`
  tetap tersembunyi kecuali diaktifkan secara eksplisit.
</ParamField>

Proses ACP `sessions_spawn` menggunakan `agents.defaults.subagents.runTimeoutSeconds`
untuk batas giliran anak defaultnya. Alat ini tidak menerima penggantian
batas waktu per panggilan (`runTimeoutSeconds`/`timeoutSeconds` ditolak dengan
kesalahan yang mengharuskan konfigurasi default).

<ParamField path="model" type="string">
  Penggantian model eksplisit untuk sesi anak ACP. Pemunculan ACP Codex
  menormalisasi referensi OpenAI seperti `openai/gpt-5.4` menjadi konfigurasi awal ACP Codex
  sebelum `session/new`; bentuk garis miring seperti `openai/gpt-5.4/high` juga menetapkan
  tingkat upaya penalaran ACP Codex. Jika dihilangkan, `sessions_spawn({ runtime: "acp" })`
  menggunakan default model subagen yang ada (`agents.defaults.subagents.model` atau
  `agents.list[].subagents.model`) jika dikonfigurasi; jika tidak, harness ACP
  dibiarkan menggunakan model defaultnya sendiri. Harness lain harus mengiklankan
  `models` ACP dan mendukung `session/set_model`; jika tidak, OpenClaw/acpx akan gagal
  secara jelas alih-alih diam-diam kembali ke default agen target.
</ParamField>
<ParamField path="thinking" type="string">
  Tingkat upaya berpikir/penalaran eksplisit. Untuk ACP Codex, `minimal` dipetakan ke
  upaya rendah, `low`/`medium`/`high`/`xhigh` dipetakan secara langsung, dan `off` menghilangkan
  penggantian tingkat upaya penalaran saat awal. Jika dihilangkan, pemunculan ACP menggunakan
  default pemikiran subagen yang ada dan
  `agents.defaults.models["provider/model"].params.thinking` per model untuk model yang
  dipilih.
</ParamField>

## Mode pengikatan dan utas pemunculan

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Perilaku                                                               |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
    | `off`  | Jangan membuat pengikatan percakapan saat ini.                          |

    Catatan:

    - `--bind here` adalah jalur operator paling sederhana untuk "menjadikan kanal atau obrolan ini didukung Codex."
    - `--bind here` tidak membuat utas anak.
    - `--bind here` hanya tersedia pada kanal yang menyediakan dukungan pengikatan percakapan saat ini.
    - `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Perilaku                                                                                            |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | Dalam utas aktif: ikat utas tersebut. Di luar utas: buat/ikat utas anak jika didukung. |
    | `here` | Wajibkan utas aktif saat ini; gagal jika tidak berada di dalam utas.                                                  |
    | `off`  | Tanpa pengikatan. Sesi dimulai tanpa terikat.                                                                 |

    Catatan:

    - Pada permukaan pengikatan non-utas, perilaku default secara efektif adalah `off`.
    - Pemunculan terikat utas memerlukan dukungan kebijakan kanal:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gunakan `--bind here` ketika ingin menyematkan percakapan saat ini tanpa membuat utas anak.

  </Tab>
</Tabs>

## Model pengiriman

Sesi ACP dapat berupa ruang kerja interaktif atau pekerjaan latar belakang yang dimiliki
induk. Jalur pengiriman bergantung pada bentuk tersebut.

<AccordionGroup>
  <Accordion title="Sesi ACP interaktif">
    Sesi interaktif dimaksudkan untuk terus berkomunikasi pada permukaan obrolan yang terlihat:

    - `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
    - `/acp spawn ... --thread ...` mengikat utas/topik kanal ke sesi ACP.
    - `bindings[].type="acp"` persisten yang dikonfigurasi merutekan percakapan yang cocok ke sesi ACP yang sama.

    Pesan lanjutan dalam percakapan terikat dirutekan langsung ke sesi ACP,
    dan keluaran ACP dikirimkan kembali ke
    kanal/utas/topik yang sama.

    Yang dikirim OpenClaw ke harness:

    - Tindak lanjut terikat normal dikirim sebagai teks prompt, beserta lampiran hanya jika harness/backend mendukungnya.
    - Perintah pengelolaan `/acp` dan perintah Gateway lokal dicegat sebelum pengiriman ACP.
    - Peristiwa penyelesaian yang dihasilkan runtime diwujudkan untuk setiap target. Agen OpenClaw menerima envelope konteks runtime internal OpenClaw; harness ACP eksternal menerima prompt biasa berisi hasil turunan dan instruksi. Envelope mentah `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` tidak boleh dikirim ke harness eksternal atau disimpan sebagai teks transkrip pengguna ACP.
    - Entri transkrip ACP menggunakan teks pemicu yang terlihat oleh pengguna atau prompt penyelesaian biasa. Metadata peristiwa internal tetap terstruktur di OpenClaw jika memungkinkan dan tidak diperlakukan sebagai konten percakapan yang ditulis oleh pengguna.

  </Accordion>
  <Accordion title="Sesi ACP sekali jalan milik induk">
    Sesi ACP sekali jalan yang dibuat oleh eksekusi agen lain merupakan turunan
    latar belakang, serupa dengan subagen:

    - Induk meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Turunan berjalan dalam sesi harness ACP-nya sendiri.
    - Giliran turunan berjalan pada jalur latar belakang yang sama dengan yang digunakan oleh pembuatan subagen native, sehingga harness ACP yang lambat tidak memblokir pekerjaan sesi utama yang tidak terkait.
    - Penyelesaian dilaporkan kembali melalui jalur pengumuman penyelesaian tugas. OpenClaw mengubah metadata penyelesaian internal menjadi prompt ACP biasa sebelum mengirimkannya ke harness eksternal, sehingga harness tidak melihat penanda konteks runtime yang hanya digunakan OpenClaw.
    - Induk menulis ulang hasil turunan dengan gaya asisten normal ketika balasan yang ditujukan kepada pengguna berguna.

    **Jangan** perlakukan jalur ini sebagai percakapan antarrekan antara induk dan
    turunan. Turunan sudah memiliki saluran penyelesaian kembali ke induk.

  </Accordion>
  <Accordion title="sessions_send dan pengiriman A2A">
    `sessions_send` dapat menargetkan sesi lain setelah pembuatan. Untuk sesi
    rekan normal, OpenClaw menggunakan jalur tindak lanjut agen-ke-agen (A2A)
    setelah menyuntikkan pesan:

    - Tunggu balasan sesi target.
    - Secara opsional, izinkan peminta dan target bertukar sejumlah giliran tindak lanjut yang dibatasi.
    - Minta target untuk menghasilkan pesan pengumuman.
    - Kirim pengumuman tersebut ke saluran atau utas yang terlihat.

    Jalur A2A tersebut merupakan fallback untuk pengiriman ke rekan ketika
    pengirim memerlukan tindak lanjut yang terlihat. Jalur ini tetap aktif
    ketika sesi yang tidak terkait dapat melihat dan mengirim pesan ke target
    ACP, misalnya dalam pengaturan `tools.sessions.visibility` yang luas.

    OpenClaw hanya melewati tindak lanjut A2A ketika peminta merupakan induk
    dari turunan ACP sekali jalan miliknya sendiri. Dalam kasus tersebut,
    menjalankan A2A di atas penyelesaian tugas dapat membangunkan induk dengan
    hasil turunan, meneruskan balasan induk kembali ke turunan, dan membuat
    loop gema induk/turunan. Hasil `sessions_send` melaporkan
    `delivery.status="skipped"` untuk kasus turunan milik induk tersebut karena jalur
    penyelesaian sudah bertanggung jawab atas hasilnya.

  </Accordion>
  <Accordion title="Melanjutkan sesi yang sudah ada">
    Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih
    memulai dari awal. Agen memutar ulang riwayat percakapannya melalui
    `session/load`, sehingga agen melanjutkan dengan konteks lengkap dari
    percakapan sebelumnya.

    ```json
    {
      "task": "Lanjutkan dari bagian terakhir - perbaiki kegagalan pengujian yang tersisa",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Kasus penggunaan umum:

    - Alihkan sesi Codex dari laptop ke ponsel Anda—minta agen melanjutkan dari bagian terakhir.
    - Lanjutkan sesi pemrograman yang Anda mulai secara interaktif di CLI, kini tanpa antarmuka melalui agen Anda.
    - Lanjutkan pekerjaan yang terputus akibat Gateway dimulai ulang atau batas waktu tidak aktif.

    Catatan:

    - `resumeSessionId` hanya berlaku ketika `runtime: "acp"`; runtime subagen default mengabaikan bidang khusus ACP ini.
    - `streamTo` hanya berlaku ketika `runtime: "acp"`; runtime subagen default mengabaikan bidang khusus ACP ini.
    - `resumeSessionId` adalah ID pelanjutan ACP/harness lokal host, bukan kunci sesi saluran OpenClaw; OpenClaw tetap memeriksa kebijakan pembuatan ACP dan kebijakan agen target sebelum pengiriman, sedangkan backend atau harness ACP memiliki otorisasi untuk memuat ID upstream tersebut.
    - `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku secara normal pada sesi OpenClaw baru yang Anda buat, sehingga `mode: "session"` tetap memerlukan `thread: true`.
    - Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
    - Jika ID sesi tidak ditemukan, pembuatan gagal dengan galat yang jelas—tidak ada fallback diam-diam ke sesi baru.

  </Accordion>
  <Accordion title="Uji asap pascadeployment">
    Setelah deployment Gateway, jalankan pemeriksaan langsung menyeluruh,
    bukan hanya memercayai pengujian unit:

    1. Verifikasi versi dan commit Gateway yang diterapkan pada host target.
    2. Buka sesi jembatan ACPX sementara ke agen aktif.
    3. Minta agen tersebut memanggil `sessions_spawn` dengan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, dan tugas `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifikasi `accepted=yes`, `childSessionKey` yang nyata, dan tidak adanya galat validator.
    5. Bersihkan sesi jembatan sementara.

    Pertahankan gate pada `mode: "run"` dan lewati `streamTo: "parent"`—
    `mode: "session"` yang terikat utas dan jalur relay stream merupakan
    tahap integrasi lebih lengkap yang terpisah.

  </Accordion>
</AccordionGroup>

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, **bukan** di dalam sandbox
OpenClaw.

<Warning>
**Batas keamanan:**

- Harness eksternal dapat membaca/menulis sesuai dengan izin CLI-nya sendiri dan `cwd` yang dipilih.
- Kebijakan sandbox OpenClaw **tidak** membungkus eksekusi harness ACP.
- OpenClaw tetap memberlakukan gate fitur ACP, agen yang diizinkan, kepemilikan sesi, pengikatan saluran, dan kebijakan pengiriman Gateway.
- Gunakan `runtime: "subagent"` untuk pekerjaan native OpenClaw yang diberlakukan sandbox.

</Warning>

Batasan saat ini:

- Jika sesi peminta berada dalam sandbox, pembuatan ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.

## Resolusi target sesi

Sebagian besar tindakan `/acp` menerima target sesi opsional (`session-key`,
`session-id`, atau `session-label`).

**Urutan resolusi:**

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - mencoba kunci
   - kemudian ID sesi berbentuk UUID
   - kemudian label
2. Pengikatan utas saat ini (jika percakapan/utas ini terikat ke sesi ACP).
3. Fallback sesi peminta saat ini.

Pengikatan percakapan saat ini dan pengikatan utas sama-sama berpartisipasi dalam langkah 2.

Jika tidak ada target yang dapat diresolusi, OpenClaw mengembalikan galat yang jelas
(`Unable to resolve session target: ...`).

## Kontrol ACP

| Perintah             | Fungsinya                                                  | Contoh                                                        |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; pengikatan saat ini atau pengikatan utas bersifat opsional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan giliran yang sedang berlangsung untuk sesi target. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Mengirim instruksi pengarahan ke sesi yang sedang berjalan. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas pengikatan target utas.          | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, status, opsi runtime, dan kemampuan. | `/acp status`                                                 |
| `/acp set-mode`      | Menetapkan mode runtime untuk sesi target.                 | `/acp set-mode plan`                                          |
| `/acp set`           | Menulis opsi konfigurasi runtime generik.                 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Menetapkan penimpaan direktori kerja runtime.             | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Menetapkan profil kebijakan persetujuan.                   | `/acp permissions strict`                                     |
| `/acp timeout`       | Menetapkan batas waktu runtime (detik).                    | `/acp timeout 120`                                            |
| `/acp model`         | Menetapkan penimpaan model runtime.                        | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus penimpaan opsi runtime sesi.                     | `/acp reset-options`                                          |
| `/acp sessions`      | Mencantumkan sesi ACP terbaru dari penyimpanan.            | `/acp sessions`                                               |
| `/acp doctor`        | Menampilkan kesehatan backend, kemampuan, dan perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                                 |
| `/acp install`       | Mencetak langkah penginstalan dan pengaktifan deterministik. | `/acp install`                                                |

Kontrol runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model`, dan `reset-options`) memerlukan
identitas pemilik dari saluran eksternal dan `operator.admin` dari klien
Gateway internal. Pengirim bukan pemilik yang berwenang tetap dapat menggunakan `sessions`,
`doctor`, `install`, dan `help`. Untuk pengirim bukan pemilik, `/acp sessions`
hanya mencantumkan sesi yang terikat saat ini atau sesi peminta; identitas
pemilik dan klien `operator.admin` melihat semua sesi terbaru.

`/acp status` menampilkan opsi runtime efektif serta pengidentifikasi sesi
tingkat runtime dan tingkat backend. Galat kontrol yang tidak didukung
ditampilkan dengan jelas ketika backend tidak memiliki suatu kemampuan. Perintah yang menerima token target
(`session-key`, `session-id`, atau `session-label`) meresolusinya melalui penemuan sesi
Gateway, termasuk root `session.store` khusus per agen. `/acp sessions`
tidak menerima token target.

### Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan penyetel generik. Operasi yang setara:

| Perintah                      | Dipetakan ke                              | Catatan                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | kunci konfigurasi runtime `model`           | Untuk Codex ACP, OpenClaw menormalisasi `openai/<model>` menjadi id model adaptor dan memetakan sufiks penalaran dengan garis miring seperti `openai/gpt-5.4/high` menjadi `reasoning_effort`.                                         |
| `/acp set thinking <level>`  | opsi kanonis `thinking`          | OpenClaw mengirim padanan yang diiklankan backend jika tersedia, dengan mengutamakan `thinking`, lalu `effort`, `reasoning_effort`, atau `thought_level`. Untuk Codex ACP, adaptor memetakan nilai ke `reasoning_effort`. |
| `/acp permissions <profile>` | opsi kanonis `permissionProfile` | OpenClaw mengirim padanan yang diiklankan backend jika tersedia, seperti `approval_policy`, `permission_profile`, `permissions`, atau `permission_mode`.                                                       |
| `/acp timeout <seconds>`     | opsi kanonis `timeoutSeconds`    | OpenClaw mengirim padanan yang diiklankan backend jika tersedia, seperti `timeout` atau `timeout_seconds`.                                                                                                     |
| `/acp cwd <path>`            | penggantian cwd runtime                 | Pembaruan langsung.                                                                                                                                                                                             |
| `/acp set <key> <value>`     | generik                              | `key=cwd` menggunakan jalur penggantian cwd.                                                                                                                                                                      |
| `/acp reset-options`         | menghapus semua penggantian runtime         | -                                                                                                                                                                                                          |

## Harness acpx, penyiapan plugin, dan izin

Untuk konfigurasi harness acpx (alias Claude Code / Codex / Gemini CLI),
jembatan MCP plugin-tools dan OpenClaw-tools, serta mode izin ACP,
lihat [Agen ACP - penyiapan](/id/tools/acp-agents-setup).

## Pemecahan masalah

| Gejala                                                                                   | Kemungkinan penyebab                                                                                                           | Perbaikan                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | Plugin backend tidak ada, dinonaktifkan, atau diblokir oleh `plugins.allow`.                                                       | Instal dan aktifkan plugin backend, sertakan `acpx` dalam `plugins.allow` jika daftar izin tersebut ditetapkan, lalu jalankan `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP dinonaktifkan secara global.                                                                                                 | Tetapkan `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | Pengiriman otomatis dari pesan utas biasa dinonaktifkan.                                                               | Tetapkan `acp.dispatch.enabled=true` untuk melanjutkan perutean utas otomatis; pemanggilan `sessions_spawn({ runtime: "acp" })` secara eksplisit tetap berfungsi.                                      |
| `ACP agent "<id>" is not allowed by policy`                                               | Agen tidak ada dalam daftar izin.                                                                                                | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` melaporkan backend belum siap tepat setelah dimulai                               | Plugin backend tidak ada, dinonaktifkan, diblokir oleh kebijakan izin/tolak, atau executable yang dikonfigurasi tidak tersedia.        | Instal/aktifkan plugin backend, jalankan kembali `/acp doctor`, dan periksa kesalahan instalasi atau kebijakan backend jika kondisinya tetap tidak sehat.                                           |
| Perintah harness tidak ditemukan                                                                 | CLI adaptor belum diinstal, plugin eksternal tidak ada, atau pengambilan `npx` saat pertama kali dijalankan gagal untuk adaptor non-Codex. | Jalankan `/acp doctor`, instal/lakukan pemanasan awal adaptor pada host Gateway, atau konfigurasikan perintah agen acpx secara eksplisit.                                                      |
| Model tidak ditemukan oleh harness                                                          | Id model valid untuk penyedia/harness lain, tetapi tidak untuk target ACP ini.                                                | Gunakan model yang dicantumkan oleh harness tersebut, konfigurasikan model dalam harness, atau hilangkan penggantian.                                                                            |
| Kesalahan autentikasi vendor dari harness                                                        | OpenClaw berfungsi dengan baik, tetapi CLI/penyedia target belum masuk.                                                     | Masuk atau berikan kunci penyedia yang diperlukan di lingkungan host Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                                   | Token kunci/id/label salah.                                                                                                | Jalankan `/acp sessions`, salin kunci/label yang persis, lalu coba lagi.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` digunakan tanpa percakapan aktif yang dapat diikat.                                                            | Beralih ke obrolan/saluran target dan coba lagi, atau gunakan pemunculan tanpa ikatan.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                                    | Adaptor tidak memiliki kemampuan pengikatan ACP ke percakapan saat ini.                                                             | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` tingkat atas, atau beralih ke saluran yang didukung.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` digunakan di luar konteks utas.                                                                         | Beralih ke utas target atau gunakan `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Pengguna lain memiliki target pengikatan aktif.                                                                           | Ikat ulang sebagai pemilik atau gunakan percakapan maupun utas lain.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                                          | Adaptor tidak memiliki kemampuan pengikatan utas.                                                                               | Gunakan `--thread off` atau beralih ke adaptor/saluran yang didukung.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | Runtime ACP berada di sisi host; sesi pemohon berada dalam sandbox.                                                              | Gunakan `runtime="subagent"` dari sesi dalam sandbox, atau jalankan pemunculan ACP dari sesi yang tidak berada dalam sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | `sandbox="require"` diminta untuk runtime ACP.                                                                         | Gunakan `runtime="subagent"` jika sandbox diwajibkan, atau gunakan ACP dengan `sandbox="inherit"` dari sesi yang tidak berada dalam sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                                | Harness target tidak menyediakan peralihan model ACP generik.                                                        | Gunakan harness yang mengiklankan `models`/`session/set_model` ACP, gunakan referensi model Codex ACP, atau konfigurasikan model secara langsung dalam harness jika memiliki flag pemulaannya sendiri. |
| Metadata ACP tidak ada untuk sesi terikat                                                    | Metadata sesi ACP sudah kedaluwarsa/dihapus.                                                                                    | Buat ulang dengan `/acp spawn`, lalu ikat ulang/fokuskan utas.                                                                                                                    |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` memblokir penulisan/eksekusi dalam sesi ACP noninteraktif.                                                    | Tetapkan `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan mulai ulang Gateway. Lihat [Konfigurasi izin](/id/tools/acp-agents-setup#permission-configuration). |
| Sesi ACP gagal lebih awal dengan sedikit keluaran                                                | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.                                        | Periksa log Gateway untuk `AcpRuntimeError`. Untuk izin penuh, tetapkan `permissionMode=approve-all`; untuk degradasi secara bertahap, tetapkan `nonInteractivePermissions=deny`.        |
| Sesi ACP macet tanpa batas setelah pekerjaan selesai                                     | Proses harness telah selesai, tetapi sesi ACP tidak melaporkan penyelesaian.                                                    | Perbarui OpenClaw; pembersihan acpx saat ini menghentikan proses wrapper dan adaptor usang milik OpenClaw saat ditutup dan ketika Gateway dimulai.                                             |
| Harness melihat `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | Amplop peristiwa internal bocor melintasi batas ACP.                                                                | Perbarui OpenClaw dan jalankan kembali alur penyelesaian; harness eksternal seharusnya hanya menerima prompt penyelesaian biasa.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` merupakan bagian dari
relai hook Codex native, bukan ACP/acpx. Dalam obrolan Codex yang terikat, mulai
sesi baru dengan `/new` atau `/reset`; jika berfungsi sekali lalu muncul kembali pada
pemanggilan alat native berikutnya, mulai ulang app-server Codex atau Gateway OpenClaw,
alih-alih mengulangi `/new`. Lihat
[Pemecahan masalah harness Codex](/id/plugins/codex-harness#troubleshooting).
</Note>

## Terkait

- [Agen ACP - penyiapan](/id/tools/acp-agents-setup)
- [Pengiriman agen](/id/tools/agent-send)
- [Backend CLI](/id/gateway/cli-backends)
- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Alat sandbox multiagen](/id/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode bridge)](/id/cli/acp)
- [Subagen](/id/tools/subagents)
