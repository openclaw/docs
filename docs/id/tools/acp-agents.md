---
read_when:
    - Menjalankan harness pengodean melalui ACP
    - Menyiapkan sesi ACP yang terikat percakapan di saluran pesan
    - Mengikat percakapan kanal pesan ke sesi ACP persisten
    - Memecahkan masalah backend ACP, pengkabelan plugin, atau pengiriman penyelesaian
    - Mengoperasikan perintah /acp dari chat
sidebarTitle: ACP agents
summary: Jalankan harness pengodean eksternal (Claude Code, Cursor, Gemini CLI, Codex ACP eksplisit, OpenClaw ACP, OpenCode) melalui backend ACP
title: Agen ACP
x-i18n:
    generated_at: "2026-06-30T14:29:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessions
memungkinkan OpenClaw menjalankan harness pengodean eksternal (misalnya Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain
yang didukung) melalui plugin backend ACP.

Setiap spawn sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

<Note>
**ACP adalah jalur harness eksternal, bukan jalur Codex default.** Plugin
server aplikasi Codex native memiliki kontrol `/codex ...` dan runtime tertanam
`openai/gpt-*` default untuk giliran agen; ACP memiliki kontrol
`/acp ...` dan sesi `sessions_spawn({ runtime: "acp" })`.

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal
langsung ke percakapan channel OpenClaw yang sudah ada, gunakan
[`openclaw mcp serve`](/id/cli/mcp), bukan ACP.
</Note>

## Halaman mana yang saya butuhkan?

| Anda ingin…                                                                                    | Gunakan ini                           | Catatan                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mengikat atau mengontrol Codex dalam percakapan saat ini                                       | `/codex bind`, `/codex threads`       | Jalur server aplikasi Codex native saat plugin `codex` diaktifkan; mencakup balasan chat terikat, penerusan gambar, model/cepat/izin, stop, dan kontrol pengarahan. ACP adalah fallback eksplisit |
| Menjalankan Claude Code, Gemini CLI, Codex ACP eksplisit, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini                           | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime                                                                                   |
| Mengekspos sesi Gateway OpenClaw _sebagai_ server ACP untuk editor atau klien                  | [`openclaw acp`](/id/cli/acp)            | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                                                                                                       |
| Menggunakan ulang CLI AI lokal sebagai model fallback hanya teks                               | [Backend CLI](/id/gateway/cli-backends)  | Bukan ACP. Tidak ada alat OpenClaw, tidak ada kontrol ACP, tidak ada runtime harness                                                                                                           |

## Apakah ini berfungsi langsung?

Ya, setelah memasang plugin runtime ACP resmi:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkout sumber dapat menggunakan plugin workspace lokal `extensions/acpx` setelah
`pnpm install`. Jalankan `/acp doctor` untuk pemeriksaan kesiapan.

OpenClaw hanya mengajarkan agen tentang spawning ACP saat ACP **benar-benar
dapat digunakan**: ACP harus diaktifkan, dispatch tidak boleh dinonaktifkan, sesi
saat ini tidak boleh diblokir sandbox, dan backend runtime harus dimuat. Jika
kondisi tersebut tidak terpenuhi, Skills plugin ACP dan panduan ACP
`sessions_spawn` tetap tersembunyi agar agen tidak menyarankan backend yang
tidak tersedia.

<AccordionGroup>
  <Accordion title="Kendala saat pertama kali dijalankan">
    - Jika `plugins.allow` diatur, itu adalah inventaris plugin yang restriktif dan **harus** menyertakan `acpx`; jika tidak, backend ACP yang terpasang sengaja diblokir dan `/acp doctor` melaporkan entri allowlist yang hilang.
    - Adapter Codex ACP disiapkan bersama plugin `acpx` dan diluncurkan secara lokal jika memungkinkan.
    - Codex ACP berjalan dengan `CODEX_HOME` yang terisolasi; OpenClaw menyalin entri proyek tepercaya plus konfigurasi routing model/penyedia yang aman dari konfigurasi Codex host, sementara autentikasi, notifikasi, dan hook tetap berada pada konfigurasi host.
    - Adapter harness target lain mungkin masih diambil sesuai permintaan dengan `npx` saat pertama kali Anda menggunakannya.
    - Autentikasi vendor tetap harus ada pada host untuk harness tersebut.
    - Jika host tidak memiliki npm atau akses jaringan, pengambilan adapter pertama kali gagal hingga cache dipanaskan lebih dulu atau adapter dipasang dengan cara lain.

  </Accordion>
  <Accordion title="Prasyarat runtime">
    ACP meluncurkan proses harness eksternal nyata. OpenClaw memiliki routing,
    status tugas latar belakang, pengiriman, binding, dan kebijakan; harness
    memiliki login penyedia, katalog model, perilaku sistem berkas, dan
    alat native-nya sendiri.

    Sebelum menyalahkan OpenClaw, verifikasi:

    - `/acp doctor` melaporkan backend yang aktif dan sehat.
    - ID target diizinkan oleh `acp.allowedAgents` saat allowlist tersebut diatur.
    - Perintah harness dapat dimulai pada host Gateway.
    - Autentikasi penyedia tersedia untuk harness tersebut (`claude`, `codex`, `gemini`, `opencode`, `droid`, dll.).
    - Model yang dipilih ada untuk harness tersebut - ID model tidak portabel antar-harness.
    - `cwd` yang diminta ada dan dapat diakses, atau hilangkan `cwd` dan biarkan backend menggunakan default-nya.
    - Mode izin cocok dengan pekerjaannya. Sesi non-interaktif tidak dapat mengeklik prompt izin native, jadi run pengodean yang banyak menulis/mengeksekusi biasanya memerlukan profil izin ACPX yang dapat berjalan headless.

  </Accordion>
</AccordionGroup>

Alat plugin OpenClaw dan alat bawaan OpenClaw **tidak** diekspos ke
harness ACP secara default. Aktifkan bridge MCP eksplisit di
[agen ACP - penyiapan](/id/tools/acp-agents-setup) hanya saat harness
harus memanggil alat tersebut secara langsung.

## Target harness yang didukung

Dengan backend `acpx`, gunakan ID harness ini sebagai target `/acp spawn <id>`
atau `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID harness | Backend umum                                  | Catatan                                                                             |
| ---------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                       | Memerlukan autentikasi Claude Code pada host.                                       |
| `codex`    | Adapter Codex ACP                             | Fallback ACP eksplisit hanya saat `/codex` native tidak tersedia atau ACP diminta.  |
| `copilot`  | Adapter GitHub Copilot ACP                    | Memerlukan autentikasi CLI/runtime Copilot.                                         |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)           | Timpa perintah acpx jika instalasi lokal mengekspos entrypoint ACP yang berbeda.    |
| `droid`    | Factory Droid CLI                             | Memerlukan autentikasi Factory/Droid atau `FACTORY_API_KEY` di lingkungan harness.  |
| `gemini`   | Adapter Gemini CLI ACP                        | Memerlukan autentikasi Gemini CLI atau penyiapan kunci API.                         |
| `iflow`    | iFlow CLI                                     | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terpasang.          |
| `kilocode` | Kilo Code CLI                                 | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terpasang.          |
| `kimi`     | Kimi/Moonshot CLI                             | Memerlukan autentikasi Kimi/Moonshot pada host.                                     |
| `kiro`     | Kiro CLI                                      | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terpasang.          |
| `opencode` | Adapter OpenCode ACP                          | Memerlukan autentikasi CLI/penyedia OpenCode.                                       |
| `openclaw` | Bridge Gateway OpenClaw melalui `openclaw acp` | Memungkinkan harness yang sadar ACP berbicara kembali ke sesi Gateway OpenClaw.     |
| `qwen`     | Qwen Code / Qwen CLI                          | Memerlukan autentikasi yang kompatibel dengan Qwen pada host.                       |

Alias agen acpx kustom dapat dikonfigurasi di acpx itu sendiri, tetapi kebijakan
OpenClaw tetap memeriksa `acp.allowedAgents` dan mapping
`agents.list[].runtime.acp.agent` apa pun sebelum dispatch.

## Runbook operator

Alur cepat `/acp` dari chat:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, atau
    `/acp spawn codex --bind here` eksplisit.
  </Step>
  <Step title="Kerja">
    Lanjutkan dalam percakapan atau thread yang terikat (atau targetkan kunci
    sesi secara eksplisit).
  </Step>
  <Step title="Periksa status">
    `/acp status`
  </Step>
  <Step title="Sesuaikan">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Arahkan">
    Tanpa mengganti konteks: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Hentikan">
    `/acp cancel` (giliran saat ini) atau `/acp close` (sesi + binding).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detail siklus hidup">
    - Spawn membuat atau melanjutkan sesi runtime ACP, mencatat metadata ACP di penyimpanan sesi OpenClaw, dan dapat membuat tugas latar belakang saat run dimiliki induk.
    - Sesi ACP yang dimiliki induk diperlakukan sebagai pekerjaan latar belakang bahkan saat sesi runtime bersifat persisten; penyelesaian dan pengiriman lintas permukaan melalui notifier tugas induk, bukan bertindak seperti sesi chat normal yang terlihat pengguna.
    - Pemeliharaan tugas menutup sesi ACP one-shot yang terminal atau yatim dan dimiliki induk. Sesi ACP persisten dipertahankan selama binding percakapan aktif masih ada; sesi persisten lama tanpa binding aktif ditutup agar tidak dapat dilanjutkan diam-diam setelah tugas pemilik selesai atau catatan tugasnya hilang.
    - Pesan tindak lanjut terikat langsung masuk ke sesi ACP hingga binding ditutup, tidak difokuskan, direset, atau kedaluwarsa.
    - Perintah Gateway tetap lokal. `/acp ...`, `/status`, dan `/unfocus` tidak pernah dikirim sebagai teks prompt normal ke harness ACP terikat.
    - `cancel` membatalkan giliran aktif saat backend mendukung pembatalan; ini tidak menghapus binding atau metadata sesi.
    - `close` mengakhiri sesi ACP dari sudut pandang OpenClaw dan menghapus binding. Harness mungkin tetap menyimpan riwayat upstream-nya sendiri jika mendukung resume.
    - Plugin acpx membersihkan pohon proses wrapper dan adapter milik OpenClaw setelah `close`, dan menuai yatim ACPX milik OpenClaw yang lama saat startup Gateway.
    - Worker runtime idle memenuhi syarat untuk dibersihkan setelah `acp.runtime.ttlMinutes`; metadata sesi yang disimpan tetap tersedia untuk `/acp sessions`.

  </Accordion>
  <Accordion title="Aturan routing Codex native">
    Pemicu bahasa alami yang harus dirouting ke **plugin Codex
    native** saat diaktifkan:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Pengikatan percakapan Codex native adalah jalur kontrol obrolan default.
    Alat dinamis OpenClaw tetap dieksekusi melalui OpenClaw, sedangkan
    alat Codex-native seperti shell/apply-patch dieksekusi di dalam Codex.
    Untuk peristiwa alat Codex-native, OpenClaw menyuntikkan relay hook native
    per giliran sehingga hook plugin dapat memblokir `before_tool_call`, mengamati
    `after_tool_call`, dan merutekan peristiwa Codex `PermissionRequest`
    melalui persetujuan OpenClaw. Hook Codex `Stop` direlay ke
    OpenClaw `before_agent_finalize`, tempat plugin dapat meminta satu
    pass model lagi sebelum Codex memfinalisasi jawabannya. Relay tetap
    sengaja konservatif: relay ini tidak memutasi argumen alat Codex-native
    atau menulis ulang rekaman thread Codex. Gunakan ACP eksplisit hanya
    saat Anda menginginkan model runtime/sesi ACP. Batas dukungan Codex
    tertanam didokumentasikan dalam
    [Kontrak dukungan Codex harness v1](/id/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Ringkasan pemilihan model / penyedia / runtime">
    - referensi model Codex legacy - rute model OAuth/langganan Codex legacy yang diperbaiki oleh doctor.
    - `openai/*` - runtime tertanam server aplikasi Codex native untuk giliran agen OpenAI.
    - `/codex ...` - kontrol percakapan Codex native.
    - `/acp ...` atau `runtime: "acp"` - kontrol ACP/acpx eksplisit.

  </Accordion>
  <Accordion title="Pemicu bahasa alami perutean ACP">
    Pemicu yang seharusnya dirutekan ke runtime ACP:

    - "Jalankan ini sebagai sesi Claude Code ACP sekali jalan dan ringkas hasilnya."
    - "Gunakan Gemini CLI untuk tugas ini dalam sebuah thread, lalu pertahankan tindak lanjut dalam thread yang sama."
    - "Jalankan Codex melalui ACP dalam thread latar belakang."

    OpenClaw memilih `runtime: "acp"`, menyelesaikan harness `agentId`,
    mengikat ke percakapan atau thread saat ini bila didukung, dan
    merutekan tindak lanjut ke sesi tersebut hingga ditutup/kedaluwarsa. Codex hanya
    mengikuti jalur ini saat ACP/acpx eksplisit atau Plugin Codex native
    tidak tersedia untuk operasi yang diminta.

    Untuk `sessions_spawn`, `runtime: "acp"` diiklankan hanya saat ACP
    diaktifkan, peminta tidak berada dalam sandbox, dan backend runtime ACP
    dimuat. `acp.dispatch.enabled=false` menjeda dispatch thread ACP
    otomatis tetapi tidak menyembunyikan atau memblokir panggilan
    `sessions_spawn({ runtime: "acp" })` eksplisit. Ini menargetkan id harness ACP seperti `codex`,
    `claude`, `droid`, `gemini`, atau `opencode`. Jangan meneruskan id agen
    konfigurasi OpenClaw biasa dari `agents_list` kecuali entri itu
    dikonfigurasi secara eksplisit dengan `agents.list[].runtime.type="acp"`;
    jika tidak, gunakan runtime sub-agen default. Saat agen OpenClaw
    dikonfigurasi dengan `runtime.type="acp"`, OpenClaw menggunakan
    `runtime.acp.agent` sebagai id harness yang mendasarinya.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agen

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan **server aplikasi Codex
native** untuk pengikatan/kontrol percakapan Codex saat Plugin `codex`
diaktifkan. Gunakan **sub-agen** saat Anda menginginkan eksekusi
terdelegasi native OpenClaw.

| Area          | Sesi ACP                              | Eksekusi sub-agen                  |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime sub-agen native OpenClaw   |
| Kunci sesi    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Perintah utama | `/acp ...`                           | `/subagents ...`                   |
| Alat spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agen](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, stack-nya adalah:

1. Control plane sesi ACP OpenClaw.
2. Plugin runtime resmi `@openclaw/acpx`.
3. Adapter ACP Claude.
4. Mesin runtime/sesi sisi Claude.

ACP Claude adalah **sesi harness** dengan kontrol ACP, resume sesi,
pelacakan tugas latar belakang, dan pengikatan percakapan/thread opsional.

Backend CLI adalah runtime fallback lokal khusus teks yang terpisah - lihat
[Backend CLI](/id/gateway/cli-backends).

Untuk operator, aturan praktisnya adalah:

- **Ingin `/acp spawn`, sesi yang dapat diikat, kontrol runtime, atau pekerjaan harness persisten?** Gunakan ACP.
- **Ingin fallback teks lokal sederhana melalui CLI mentah?** Gunakan backend CLI.

## Sesi terikat

### Model mental

- **Permukaan obrolan** - tempat orang terus berbicara (kanal Discord, topik Telegram, obrolan iMessage).
- **Sesi ACP** - state runtime Codex/Claude/Gemini tahan lama yang dirutekan OpenClaw.
- **Thread/topik anak** - permukaan perpesanan tambahan opsional yang dibuat hanya oleh `--thread ...`.
- **Workspace runtime** - lokasi sistem berkas (`cwd`, checkout repo, workspace backend) tempat harness berjalan. Independen dari permukaan obrolan.

### Pengikatan percakapan saat ini

`/acp spawn <harness> --bind here` menyematkan percakapan saat ini ke
sesi ACP yang di-spawn - tanpa thread anak, permukaan obrolan yang sama. OpenClaw tetap
memiliki transport, autentikasi, keselamatan, dan pengiriman. Pesan tindak lanjut dalam
percakapan tersebut dirutekan ke sesi yang sama; `/new` dan `/reset` mereset
sesi di tempat; `/acp close` menghapus pengikatan.

Contoh:

```text
/codex bind                                              # pengikatan Codex native, rutekan pesan mendatang ke sini
/codex model gpt-5.4                                     # sesuaikan thread Codex native yang terikat
/codex stop                                              # kendalikan giliran Codex native yang aktif
/acp spawn codex --bind here                             # fallback ACP eksplisit untuk Codex
/acp spawn codex --thread auto                           # dapat membuat thread/topik anak dan mengikat di sana
/acp spawn codex --bind here --cwd /workspace/repo       # pengikatan obrolan yang sama, Codex berjalan di /workspace/repo
```

<AccordionGroup>
  <Accordion title="Aturan pengikatan dan eksklusivitas">
    - `--bind here` dan `--thread ...` saling eksklusif.
    - `--bind here` hanya berfungsi pada kanal yang mengiklankan pengikatan percakapan saat ini; OpenClaw mengembalikan pesan tidak didukung yang jelas jika tidak. Pengikatan bertahan lintas restart gateway.
    - Di Discord, `spawnSessions` membatasi pembuatan thread anak untuk `--thread auto|here` - bukan `--bind here`.
    - Jika Anda spawn ke agen ACP berbeda tanpa `--cwd`, OpenClaw mewarisi workspace **agen target** secara default. Path warisan yang hilang (`ENOENT`/`ENOTDIR`) fallback ke default backend; kesalahan akses lain (mis. `EACCES`) muncul sebagai kesalahan spawn.
    - Perintah manajemen Gateway tetap lokal dalam percakapan terikat - perintah `/acp ...` ditangani oleh OpenClaw bahkan ketika teks tindak lanjut normal dirutekan ke sesi ACP terikat; `/status` dan `/unfocus` juga tetap lokal kapan pun penanganan perintah diaktifkan untuk permukaan tersebut.

  </Accordion>
  <Accordion title="Sesi terikat thread">
    Saat pengikatan thread diaktifkan untuk adapter kanal:

    - OpenClaw mengikat thread ke sesi ACP target.
    - Pesan tindak lanjut dalam thread tersebut dirutekan ke sesi ACP terikat.
    - Output ACP dikirim kembali ke thread yang sama.
    - Unfocus/tutup/arsip/timeout idle atau kedaluwarsa usia maksimum menghapus pengikatan.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, dan `/unfocus` adalah perintah Gateway, bukan prompt ke harness ACP.

    Flag fitur yang diperlukan untuk ACP terikat thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` aktif secara default (atur `false` untuk menjeda dispatch thread ACP otomatis; panggilan `sessions_spawn({ runtime: "acp" })` eksplisit tetap berfungsi).
    - Spawn sesi thread adapter kanal diaktifkan (default: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Dukungan pengikatan thread bersifat spesifik adapter. Jika adapter kanal
    aktif tidak mendukung pengikatan thread, OpenClaw mengembalikan pesan
    tidak didukung/tidak tersedia yang jelas.

  </Accordion>
  <Accordion title="Kanal yang mendukung thread">
    - Adapter kanal apa pun yang mengekspos kapabilitas pengikatan sesi/thread.
    - Dukungan bawaan saat ini: thread/kanal **Discord**, topik **Telegram** (topik forum dalam grup/supergrup dan topik DM).
    - Kanal Plugin dapat menambahkan dukungan melalui antarmuka pengikatan yang sama.

  </Accordion>
</AccordionGroup>

## Pengikatan kanal persisten

Untuk alur kerja non-ephemeral, konfigurasikan pengikatan ACP persisten dalam
entri `bindings[]` tingkat atas.

### Model pengikatan

<ParamField path="bindings[].type" type='"acp"'>
  Menandai pengikatan percakapan ACP persisten.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Mengidentifikasi percakapan target. Bentuk per kanal:

- **Kanal/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Kanal/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Utamakan id Slack yang stabil; pengikatan kanal juga cocok dengan balasan di dalam thread kanal tersebut.
- **Topik forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grup WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Gunakan nomor E.164 seperti `+15555550123` untuk obrolan langsung dan JID grup WhatsApp seperti `120363424282127706@g.us` untuk grup.
- **DM/grup iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Utamakan `chat_id:*` untuk pengikatan grup yang stabil.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Id agen OpenClaw pemilik.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Override ACP opsional.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Label opsional yang terlihat oleh operator.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Direktori kerja runtime opsional.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Override backend opsional.
</ParamField>

### Default runtime per agen

Gunakan `agents.list[].runtime` untuk mendefinisikan default ACP sekali per agen:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, mis. `codex` atau `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Presedensi override untuk sesi terikat ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Default ACP global (mis. `acp.backend`)

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

- OpenClaw memastikan sesi ACP yang dikonfigurasi ada setelah penerimaan khusus kanal dan sebelum digunakan.
- Pesan di kanal, topik, atau obrolan tersebut diarahkan ke sesi ACP yang dikonfigurasi.
- Pengikatan ACP yang dikonfigurasi memiliki rute sesinya sendiri. Penyebaran siaran kanal tidak menggantikan sesi ACP yang dikonfigurasi untuk pengikatan yang cocok.
- Dalam percakapan terikat, `/new` dan `/reset` mereset kunci sesi ACP yang sama di tempat.
- Pengikatan runtime sementara (misalnya yang dibuat oleh alur fokus thread) tetap berlaku jika ada.
- Untuk spawn ACP lintas agen tanpa `cwd` eksplisit, OpenClaw mewarisi ruang kerja agen target dari konfigurasi agen.
- Jalur ruang kerja warisan yang hilang kembali ke cwd bawaan backend; kegagalan akses yang tidak hilang muncul sebagai galat spawn.

## Memulai sesi ACP

Dua cara untuk memulai sesi ACP:

<Tabs>
  <Tab title="From sessions_spawn">
    Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agen atau
    panggilan alat.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` secara bawaan adalah `subagent`, jadi tetapkan `runtime: "acp"` secara eksplisit
    untuk sesi ACP. Jika `agentId` dihilangkan, OpenClaw menggunakan
    `acp.defaultAgent` saat dikonfigurasi. `mode: "session"` memerlukan
    `thread: true` untuk mempertahankan percakapan terikat yang persisten.
    </Note>

  </Tab>
  <Tab title="From /acp command">
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

    Lihat [Perintah slash](/id/tools/slash-commands).

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
  ID harness target ACP. Kembali ke `acp.defaultAgent` jika ditetapkan.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Meminta alur pengikatan thread jika didukung.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` adalah sekali jalan; `"session"` bersifat persisten. Jika `thread: true` dan
  `mode` dihilangkan, OpenClaw dapat secara bawaan memakai perilaku persisten per
  jalur runtime. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime).
  Jika dihilangkan, spawn ACP mewarisi ruang kerja agen target saat dikonfigurasi;
  jalur warisan yang hilang kembali ke bawaan backend, sementara galat akses
  nyata dikembalikan.
</ParamField>
<ParamField path="label" type="string">
  Label yang terlihat oleh operator dan digunakan dalam teks sesi/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Melanjutkan sesi ACP yang sudah ada alih-alih membuat yang baru. Agen
  memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` mengalirkan ringkasan progres run ACP awal kembali ke sesi
  peminta sebagai peristiwa sistem. Respons yang diterima mencakup
  `streamLogPath` yang menunjuk ke log JSONL bercakupan sesi
  (`<sessionId>.acp-stream.jsonl`) yang dapat Anda ikuti untuk riwayat relay lengkap.
  Aliran progres induk menampilkan komentar asisten dan progres status ACP secara
  bawaan kecuali `streaming.progress.commentary=false`. Discord juga secara bawaan
  memakai mode progres untuk pratinjau induk saat tidak ada mode aliran yang
  dikonfigurasi. Progres status tetap mematuhi `acp.stream.tagVisibility`, sehingga
  tag seperti `plan` tetap tersembunyi kecuali diaktifkan secara eksplisit.
</ParamField>

Run ACP `sessions_spawn` menggunakan `agents.defaults.subagents.runTimeoutSeconds` untuk
batas giliran anak bawaannya. Alat ini tidak menerima penimpaan timeout per panggilan.

<ParamField path="model" type="string">
  Penimpaan model eksplisit untuk sesi anak ACP. Spawn ACP Codex
  menormalkan ref OpenAI seperti `openai/gpt-5.4` ke konfigurasi
  startup ACP Codex sebelum `session/new`; bentuk slash seperti
  `openai/gpt-5.4/high` juga menetapkan upaya penalaran ACP Codex.
  Saat dihilangkan, `sessions_spawn({ runtime: "acp" })` menggunakan
  bawaan model subagen yang sudah ada (`agents.defaults.subagents.model` atau
  `agents.list[].subagents.model`) saat dikonfigurasi; jika tidak, ini membiarkan
  harness ACP menggunakan model bawaannya sendiri.
  Harness lain harus mengiklankan `models` ACP dan mendukung
  `session/set_model`; jika tidak, OpenClaw/acpx gagal dengan jelas alih-alih
  diam-diam kembali ke bawaan agen target.
</ParamField>
<ParamField path="thinking" type="string">
  Upaya berpikir/penalaran eksplisit. Untuk ACP Codex, `minimal` dipetakan ke
  upaya rendah, `low`/`medium`/`high`/`xhigh` dipetakan langsung, dan `off`
  menghilangkan penimpaan startup upaya penalaran.
  Saat dihilangkan, spawn ACP menggunakan bawaan berpikir subagen yang sudah ada dan
  `agents.defaults.models["provider/model"].params.thinking` per model
  untuk model yang dipilih.
</ParamField>

## Mode spawn bind dan thread

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Perilaku                                                              |
    | ------ | --------------------------------------------------------------------- |
    | `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
    | `off`  | Jangan buat pengikatan percakapan saat ini.                           |

    Catatan:

    - `--bind here` adalah jalur operator paling sederhana untuk "jadikan kanal atau obrolan ini didukung Codex."
    - `--bind here` tidak membuat thread anak.
    - `--bind here` hanya tersedia pada kanal yang mengekspos dukungan pengikatan percakapan saat ini.
    - `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Perilaku                                                                                           |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | Dalam thread aktif: ikat thread tersebut. Di luar thread: buat/ikat thread anak saat didukung. |
    | `here` | Memerlukan thread aktif saat ini; gagal jika tidak berada di dalamnya.                            |
    | `off`  | Tanpa pengikatan. Sesi dimulai tanpa ikatan.                                                       |

    Catatan:

    - Pada permukaan pengikatan non-thread, perilaku bawaan secara efektif adalah `off`.
    - Spawn terikat thread memerlukan dukungan kebijakan kanal:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gunakan `--bind here` saat Anda ingin menyematkan percakapan saat ini tanpa membuat thread anak.

  </Tab>
</Tabs>

## Model pengiriman

Sesi ACP dapat berupa ruang kerja interaktif atau pekerjaan latar belakang
yang dimiliki induk. Jalur pengiriman bergantung pada bentuk tersebut.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Sesi interaktif dimaksudkan untuk terus berbicara pada permukaan obrolan
    yang terlihat:

    - `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
    - `/acp spawn ... --thread ...` mengikat thread/topik kanal ke sesi ACP.
    - `bindings[].type="acp"` persisten mengarahkan percakapan yang cocok ke sesi ACP yang sama.

    Pesan lanjutan dalam percakapan terikat diarahkan langsung ke
    sesi ACP, dan output ACP dikirim kembali ke kanal/thread/topik
    yang sama.

    Yang dikirim OpenClaw ke harness:

    - Lanjutan terikat normal dikirim sebagai teks prompt, ditambah lampiran hanya saat harness/backend mendukungnya.
    - Perintah manajemen `/acp` dan perintah Gateway lokal dicegat sebelum pengiriman ACP.
    - Peristiwa penyelesaian yang dibuat runtime dimaterialisasi per target. Agen OpenClaw mendapatkan amplop konteks runtime internal OpenClaw; harness ACP eksternal mendapatkan prompt biasa dengan hasil anak dan instruksi. Amplop mentah `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` tidak boleh pernah dikirim ke harness eksternal atau dipersistenkan sebagai teks transkrip pengguna ACP.
    - Entri transkrip ACP menggunakan teks pemicu yang terlihat oleh pengguna atau prompt penyelesaian biasa. Metadata peristiwa internal tetap terstruktur di OpenClaw jika memungkinkan dan tidak diperlakukan sebagai konten obrolan yang ditulis pengguna.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Sesi ACP sekali jalan yang di-spawn oleh run agen lain adalah anak
    latar belakang, mirip dengan subagen:

    - Induk meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Anak berjalan di sesi harness ACP-nya sendiri.
    - Giliran anak berjalan pada lane latar belakang yang sama dengan yang digunakan oleh spawn subagen native, sehingga harness ACP yang lambat tidak memblokir pekerjaan sesi utama yang tidak terkait.
    - Laporan penyelesaian kembali melalui jalur pengumuman penyelesaian tugas. OpenClaw mengonversi metadata penyelesaian internal menjadi prompt ACP biasa sebelum mengirimkannya ke harness eksternal, sehingga harness tidak melihat penanda konteks runtime khusus OpenClaw.
    - Induk menulis ulang hasil anak dengan suara asisten normal saat balasan yang terlihat oleh pengguna berguna.

    Jangan perlakukan jalur ini sebagai obrolan peer-to-peer antara induk
    dan anak. Anak sudah memiliki kanal penyelesaian kembali ke
    induk.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` dapat menargetkan sesi lain setelah spawn. Untuk sesi
    peer normal, OpenClaw menggunakan jalur lanjutan agen-ke-agen (A2A)
    setelah menyuntikkan pesan:

    - Tunggu balasan sesi target.
    - Secara opsional izinkan peminta dan target bertukar sejumlah giliran lanjutan yang dibatasi.
    - Minta target menghasilkan pesan pengumuman.
    - Kirim pengumuman tersebut ke kanal atau thread yang terlihat.

    Jalur A2A tersebut adalah fallback untuk pengiriman peer ketika pengirim memerlukan
    lanjutan yang terlihat. Jalur ini tetap aktif ketika sesi yang tidak terkait dapat
    melihat dan mengirim pesan ke target ACP, misalnya di bawah pengaturan
    `tools.sessions.visibility` yang luas.

    OpenClaw melewati tindak lanjut A2A hanya ketika peminta adalah
    induk dari anak ACP sekali-jalan milik induknya sendiri. Dalam kasus itu,
    menjalankan A2A di atas penyelesaian tugas dapat membangunkan induk dengan
    hasil anak, meneruskan balasan induk kembali ke anak, dan
    membuat loop gema induk/anak. Hasil `sessions_send` melaporkan
    `delivery.status="skipped"` untuk kasus anak-dimiliki tersebut karena jalur
    penyelesaian sudah bertanggung jawab atas hasilnya.

  </Accordion>
  <Accordion title="Lanjutkan sesi yang sudah ada">
    Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih
    memulai dari awal. Agen memutar ulang riwayat percakapannya melalui
    `session/load`, sehingga melanjutkan dengan konteks penuh dari yang terjadi sebelumnya.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Kasus penggunaan umum:

    - Serahkan sesi Codex dari laptop Anda ke ponsel Anda - beri tahu agen Anda untuk melanjutkan dari tempat terakhir Anda berhenti.
    - Lanjutkan sesi pengodean yang Anda mulai secara interaktif di CLI, sekarang tanpa antarmuka melalui agen Anda.
    - Lanjutkan pekerjaan yang terputus oleh mulai ulang gateway atau batas waktu idle.

    Catatan:

    - `resumeSessionId` hanya berlaku ketika `runtime: "acp"`; runtime sub-agen default mengabaikan bidang khusus ACP ini.
    - `streamTo` hanya berlaku ketika `runtime: "acp"`; runtime sub-agen default mengabaikan bidang khusus ACP ini.
    - `resumeSessionId` adalah id lanjutan ACP/harness lokal-host, bukan kunci sesi kanal OpenClaw; OpenClaw tetap memeriksa kebijakan spawn ACP dan kebijakan agen target sebelum dispatch, sementara backend ACP atau harness memiliki otorisasi untuk memuat id upstream tersebut.
    - `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal untuk sesi OpenClaw baru yang Anda buat, sehingga `mode: "session"` tetap memerlukan `thread: true`.
    - Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
    - Jika id sesi tidak ditemukan, spawn gagal dengan galat yang jelas - tanpa fallback diam-diam ke sesi baru.

  </Accordion>
  <Accordion title="Uji smoke pasca-deploy">
    Setelah deploy gateway, jalankan pemeriksaan end-to-end langsung alih-alih
    memercayai uji unit:

    1. Verifikasi versi gateway dan commit yang dideploy pada host target.
    2. Buka sesi bridge ACPX sementara ke agen langsung.
    3. Minta agen tersebut memanggil `sessions_spawn` dengan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, dan tugas `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifikasi `accepted=yes`, `childSessionKey` nyata, dan tidak ada galat validator.
    5. Bersihkan sesi bridge sementara.

    Pertahankan gate pada `mode: "run"` dan lewati `streamTo: "parent"` -
    `mode: "session"` yang terikat thread dan jalur stream-relay adalah
    lintasan integrasi lebih kaya yang terpisah.

  </Accordion>
</AccordionGroup>

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, **bukan** di dalam
sandbox OpenClaw.

<Warning>
**Batas keamanan:**

- Harness eksternal dapat membaca/menulis sesuai izin CLI-nya sendiri dan `cwd` yang dipilih.
- Kebijakan sandbox OpenClaw **tidak** membungkus eksekusi harness ACP.
- OpenClaw tetap menegakkan gate fitur ACP, agen yang diizinkan, kepemilikan sesi, binding kanal, dan kebijakan pengiriman Gateway.
- Gunakan `runtime: "subagent"` untuk pekerjaan native OpenClaw yang ditegakkan sandbox.

</Warning>

Batasan saat ini:

- Jika sesi peminta berada dalam sandbox, spawn ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.

## Resolusi target sesi

Sebagian besar tindakan `/acp` menerima target sesi opsional (`session-key`,
`session-id`, atau `session-label`).

**Urutan resolusi:**

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - mencoba kunci
   - lalu id sesi berbentuk UUID
   - lalu label
2. Binding thread saat ini (jika percakapan/thread ini terikat ke sesi ACP).
3. Fallback sesi peminta saat ini.

Binding percakapan saat ini dan binding thread keduanya berpartisipasi dalam
langkah 2.

Jika tidak ada target yang terurai, OpenClaw mengembalikan galat yang jelas
(`Unable to resolve session target: ...`).

## Kontrol ACP

| Perintah             | Fungsinya                                                 | Contoh                                                        |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Buat sesi ACP; bind saat ini atau bind thread opsional.   | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Batalkan giliran yang sedang berjalan untuk sesi target.  | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Kirim instruksi steer ke sesi yang sedang berjalan.       | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Tutup sesi dan lepas binding target thread.               | `/acp close`                                                  |
| `/acp status`        | Tampilkan backend, mode, status, opsi runtime, kapabilitas. | `/acp status`                                               |
| `/acp set-mode`      | Tetapkan mode runtime untuk sesi target.                  | `/acp set-mode plan`                                          |
| `/acp set`           | Tulis opsi konfigurasi runtime generik.                   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Tetapkan override direktori kerja runtime.                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Tetapkan profil kebijakan persetujuan.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Tetapkan batas waktu runtime (detik).                     | `/acp timeout 120`                                            |
| `/acp model`         | Tetapkan override model runtime.                          | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Hapus override opsi runtime sesi.                         | `/acp reset-options`                                          |
| `/acp sessions`      | Cantumkan sesi ACP terbaru dari store.                    | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kapabilitas, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                      |
| `/acp install`       | Cetak langkah instalasi dan pengaktifan deterministik.    | `/acp install`                                                |

Kontrol runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model`, dan `reset-options`) memerlukan
identitas pemilik dari kanal eksternal dan `operator.admin` dari klien Gateway
internal. Pengirim non-pemilik yang berwenang tetap dapat menggunakan `sessions`, `doctor`,
`install`, dan `help`.

`/acp status` menampilkan opsi runtime efektif plus pengidentifikasi sesi tingkat-runtime dan
tingkat-backend. Galat kontrol yang tidak didukung muncul
dengan jelas ketika backend tidak memiliki kapabilitas. `/acp sessions` membaca
store untuk sesi terikat saat ini atau sesi peminta; token target
(`session-key`, `session-id`, atau `session-label`) terurai melalui
penemuan sesi gateway, termasuk root `session.store` kustom per agen.

### Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik. Operasi yang
setara:

| Perintah                     | Dipetakan ke                         | Catatan                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | kunci konfigurasi runtime `model`    | Untuk Codex ACP, OpenClaw menormalisasi `openai/<model>` ke id model adapter dan memetakan sufiks reasoning garis miring seperti `openai/gpt-5.4/high` ke `reasoning_effort`.                              |
| `/acp set thinking <level>`  | opsi kanonis `thinking`              | OpenClaw mengirim padanan yang diiklankan backend ketika ada, dengan preferensi `thinking`, lalu `effort`, `reasoning_effort`, atau `thought_level`. Untuk Codex ACP, adapter memetakan nilai ke `reasoning_effort`. |
| `/acp permissions <profile>` | opsi kanonis `permissionProfile`     | OpenClaw mengirim padanan yang diiklankan backend ketika ada, seperti `approval_policy`, `permission_profile`, `permissions`, atau `permission_mode`.                                                       |
| `/acp timeout <seconds>`     | opsi kanonis `timeoutSeconds`        | OpenClaw mengirim padanan yang diiklankan backend ketika ada, seperti `timeout` atau `timeout_seconds`.                                                                                                     |
| `/acp cwd <path>`            | override cwd runtime                 | Pembaruan langsung.                                                                                                                                                                                        |
| `/acp set <key> <value>`     | generik                              | `key=cwd` menggunakan jalur override cwd.                                                                                                                                                                  |
| `/acp reset-options`         | menghapus semua override runtime     | -                                                                                                                                                                                                          |

## harness acpx, penyiapan Plugin, dan izin

Untuk konfigurasi harness acpx (alias Claude Code / Codex / Gemini CLI),
bridge MCP plugin-tools dan OpenClaw-tools, serta mode izin ACP, lihat
[Agen ACP - penyiapan](/id/tools/acp-agents-setup).

## Pemecahan masalah

| Gejala                                                                      | Kemungkinan penyebab                                                                                                      | Perbaikan                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang, dinonaktifkan, atau diblokir oleh `plugins.allow`.                                                 | Instal dan aktifkan Plugin backend, sertakan `acpx` di `plugins.allow` ketika daftar izin itu disetel, lalu jalankan `/acp doctor`.                                             |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                                                          | Setel `acp.enabled=true`.                                                                                                                                                      |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Pengiriman otomatis dari pesan utas normal dinonaktifkan.                                                                 | Setel `acp.dispatch.enabled=true` untuk melanjutkan perutean utas otomatis; pemanggilan eksplisit `sessions_spawn({ runtime: "acp" })` tetap berfungsi.                        |
| `ACP agent "<id>" is not allowed by policy`                                 | Agen tidak ada dalam daftar izin.                                                                                         | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                             |
| `/acp doctor` reports backend not ready right after startup                 | Plugin backend hilang, dinonaktifkan, diblokir oleh kebijakan izin/tolak, atau executable yang dikonfigurasi tidak ada.   | Instal/aktifkan Plugin backend, jalankan ulang `/acp doctor`, dan periksa galat instalasi backend atau kebijakan jika kondisinya tetap tidak sehat.                             |
| Perintah harness tidak ditemukan                                            | CLI adaptor tidak terinstal, Plugin eksternal hilang, atau pengambilan `npx` pertama kali gagal untuk adaptor non-Codex.  | Jalankan `/acp doctor`, instal/prapanaskan adaptor pada host Gateway, atau konfigurasikan perintah agen acpx secara eksplisit.                                                  |
| Model tidak ditemukan dari harness                                          | ID model valid untuk penyedia/harness lain tetapi tidak untuk target ACP ini.                                              | Gunakan model yang tercantum oleh harness tersebut, konfigurasikan model di harness, atau hilangkan override.                                                                   |
| Galat autentikasi vendor dari harness                                       | OpenClaw sehat, tetapi CLI/penyedia target belum login.                                                                   | Login atau sediakan kunci penyedia yang diperlukan pada lingkungan host Gateway.                                                                                                |
| `Unable to resolve session target: ...`                                     | Token kunci/id/label salah.                                                                                               | Jalankan `/acp sessions`, salin kunci/label persis, lalu coba lagi.                                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang dapat diikat.                                                         | Pindah ke chat/saluran target dan coba lagi, atau gunakan spawn tanpa ikatan.                                                                                                   |
| `Conversation bindings are unavailable for <channel>.`                      | Adaptor tidak memiliki kemampuan pengikatan ACP percakapan saat ini.                                                      | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` tingkat atas, atau pindah ke saluran yang didukung.                                            |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks utas.                                                                           | Pindah ke utas target atau gunakan `--thread auto`/`off`.                                                                                                                       |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target pengikatan aktif.                                                                           | Ikat ulang sebagai pemilik atau gunakan percakapan atau utas lain.                                                                                                              |
| `Thread bindings are unavailable for <channel>.`                            | Adaptor tidak memiliki kemampuan pengikatan utas.                                                                         | Gunakan `--thread off` atau pindah ke adaptor/saluran yang didukung.                                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.                                                       | Gunakan `runtime="subagent"` dari sesi dalam sandbox, atau jalankan spawn ACP dari sesi yang tidak berada dalam sandbox.                                                        |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                                                            | Gunakan `runtime="subagent"` untuk sandbox wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi yang tidak berada dalam sandbox.                                         |
| `Cannot apply --model ... did not advertise model support`                  | Harness target tidak mengekspos pengalihan model ACP generik.                                                             | Gunakan harness yang mengiklankan ACP `models`/`session/set_model`, gunakan referensi model ACP Codex, atau konfigurasikan model langsung di harness jika memiliki flag startup sendiri. |
| Metadata ACP hilang untuk sesi terikat                                      | Metadata sesi ACP sudah usang/terhapus.                                                                                   | Buat ulang dengan `/acp spawn`, lalu ikat ulang/fokuskan utas.                                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir penulisan/eksekusi dalam sesi ACP non-interaktif.                                              | Setel `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan mulai ulang gateway. Lihat [Konfigurasi izin](/id/tools/acp-agents-setup#permission-configuration).        |
| Sesi ACP gagal lebih awal dengan sedikit keluaran                           | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.                                                   | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, setel `permissionMode=approve-all`; untuk degradasi yang tertangani baik, setel `nonInteractivePermissions=deny`. |
| Sesi ACP macet tanpa batas setelah menyelesaikan pekerjaan                  | Proses harness selesai tetapi sesi ACP tidak melaporkan penyelesaian.                                                     | Perbarui OpenClaw; pembersihan acpx saat ini memanen proses wrapper usang milik OpenClaw dan proses adaptor saat penutupan dan startup Gateway.                                |
| Harness melihat `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                     | Amplop peristiwa internal bocor melintasi batas ACP.                                                                      | Perbarui OpenClaw dan jalankan ulang alur penyelesaian; harness eksternal seharusnya hanya menerima prompt penyelesaian biasa.                                                 |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` adalah milik
relay hook Codex native, bukan ACP/acpx. Dalam chat Codex terikat, mulai sesi baru
dengan `/new` atau `/reset`; jika berhasil sekali lalu muncul kembali pada
pemanggilan alat native berikutnya, mulai ulang app-server Codex atau OpenClaw Gateway alih-alih
mengulangi `/new`. Lihat [Pemecahan masalah harness Codex](/id/plugins/codex-harness#troubleshooting).
</Note>

## Terkait

- [Agen ACP - penyiapan](/id/tools/acp-agents-setup)
- [Kirim agen](/id/tools/agent-send)
- [Backend CLI](/id/gateway/cli-backends)
- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode bridge)](/id/cli/acp)
- [Sub-agen](/id/tools/subagents)
