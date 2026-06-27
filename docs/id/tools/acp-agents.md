---
read_when:
    - Menjalankan harness coding melalui ACP
    - Menyiapkan sesi ACP yang terikat percakapan di kanal perpesanan
    - Mengikat percakapan saluran pesan ke sesi ACP persisten
    - Memecahkan masalah backend ACP, pengawatan plugin, atau pengiriman completion
    - Mengoperasikan perintah /acp dari chat
sidebarTitle: ACP agents
summary: Jalankan harness pengodean eksternal (Claude Code, Cursor, Gemini CLI, Codex ACP eksplisit, OpenClaw ACP, OpenCode) melalui backend ACP
title: Agen ACP
x-i18n:
    generated_at: "2026-06-27T18:15:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sessions
memungkinkan OpenClaw menjalankan harness pengodean eksternal (misalnya Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX
lain yang didukung) melalui Plugin backend ACP.

Setiap spawn sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

<Note>
**ACP adalah jalur harness eksternal, bukan jalur Codex default.** Plugin
app-server Codex native memiliki kontrol `/codex ...` dan runtime tertanam
`openai/gpt-*` default untuk giliran agen; ACP memiliki kontrol
`/acp ...` dan sesi `sessions_spawn({ runtime: "acp" })`.

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal
langsung ke percakapan channel OpenClaw yang sudah ada, gunakan
[`openclaw mcp serve`](/id/cli/mcp) alih-alih ACP.
</Note>

## Halaman mana yang saya butuhkan?

| Anda ingin…                                                                                    | Gunakan ini                              | Catatan                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mengikat atau mengontrol Codex dalam percakapan saat ini                                               | `/codex bind`, `/codex threads`       | Jalur app-server Codex native ketika Plugin `codex` diaktifkan; mencakup balasan chat terikat, penerusan gambar, model/cepat/izin, berhenti, dan kontrol arahan. ACP adalah fallback eksplisit |
| Menjalankan Claude Code, Gemini CLI, Codex ACP eksplisit, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini                             | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime                                                                                   |
| Mengekspos sesi OpenClaw Gateway _sebagai_ server ACP untuk editor atau klien                   | [`openclaw acp`](/id/cli/acp)            | Mode jembatan. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                                                                                                            |
| Menggunakan ulang CLI AI lokal sebagai model fallback hanya-teks                                              | [Backend CLI](/id/gateway/cli-backends) | Bukan ACP. Tanpa alat OpenClaw, tanpa kontrol ACP, tanpa runtime harness                                                                                                                               |

## Apakah ini langsung berfungsi?

Ya, setelah memasang Plugin runtime ACP resmi:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkout sumber dapat menggunakan Plugin workspace lokal `extensions/acpx` setelah
`pnpm install`. Jalankan `/acp doctor` untuk pemeriksaan kesiapan.

OpenClaw hanya mengajarkan agen tentang spawning ACP ketika ACP **benar-benar
dapat digunakan**: ACP harus diaktifkan, dispatch tidak boleh dinonaktifkan, sesi
saat ini tidak boleh diblokir sandbox, dan backend runtime harus dimuat. Jika
kondisi tersebut tidak terpenuhi, Skills Plugin ACP dan panduan ACP
`sessions_spawn` tetap disembunyikan sehingga agen tidak menyarankan backend
yang tidak tersedia.

<AccordionGroup>
  <Accordion title="Hal yang perlu diperhatikan saat pertama kali menjalankan">
    - Jika `plugins.allow` ditetapkan, itu adalah inventaris Plugin yang restriktif dan **harus** menyertakan `acpx`; jika tidak, backend ACP yang terpasang sengaja diblokir dan `/acp doctor` melaporkan entri allowlist yang hilang.
    - Adapter ACP Codex disiapkan dengan Plugin `acpx` dan diluncurkan secara lokal bila memungkinkan.
    - Codex ACP berjalan dengan `CODEX_HOME` terisolasi; OpenClaw menyalin entri proyek tepercaya plus konfigurasi routing model/provider yang aman dari konfigurasi Codex host, sementara autentikasi, notifikasi, dan hooks tetap berada di konfigurasi host.
    - Adapter harness target lain mungkin masih diambil sesuai kebutuhan dengan `npx` saat pertama kali Anda menggunakannya.
    - Autentikasi vendor tetap harus ada di host untuk harness tersebut.
    - Jika host tidak memiliki akses npm atau jaringan, pengambilan adapter pertama kali gagal hingga cache dipanaskan terlebih dahulu atau adapter dipasang dengan cara lain.

  </Accordion>
  <Accordion title="Prasyarat runtime">
    ACP meluncurkan proses harness eksternal sungguhan. OpenClaw memiliki routing,
    status tugas latar belakang, pengiriman, binding, dan kebijakan; harness
    memiliki login provider, katalog model, perilaku filesystem, dan
    alat native miliknya.

    Sebelum menyalahkan OpenClaw, verifikasi:

    - `/acp doctor` melaporkan backend yang aktif dan sehat.
    - Id target diizinkan oleh `acp.allowedAgents` ketika allowlist tersebut ditetapkan.
    - Perintah harness dapat dimulai di host Gateway.
    - Autentikasi provider tersedia untuk harness tersebut (`claude`, `codex`, `gemini`, `opencode`, `droid`, dll.).
    - Model yang dipilih tersedia untuk harness tersebut - id model tidak portabel lintas harness.
    - `cwd` yang diminta ada dan dapat diakses, atau hilangkan `cwd` dan biarkan backend menggunakan default-nya.
    - Mode izin cocok dengan pekerjaannya. Sesi non-interaktif tidak dapat mengklik prompt izin native, sehingga run pengodean yang banyak menulis/mengeksekusi biasanya membutuhkan profil izin ACPX yang dapat berjalan headless.

  </Accordion>
</AccordionGroup>

Alat Plugin OpenClaw dan alat bawaan OpenClaw **tidak** diekspos ke
harness ACP secara default. Aktifkan jembatan MCP eksplisit di
[Penyiapan agen ACP](/id/tools/acp-agents-setup) hanya ketika harness
harus memanggil alat tersebut secara langsung.

## Target harness yang didukung

Dengan backend `acpx`, gunakan id harness ini sebagai target `/acp spawn <id>`
atau `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Backend umum                                | Catatan                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter ACP Claude Code                        | Memerlukan autentikasi Claude Code di host.                                              |
| `codex`    | Adapter ACP Codex                              | Fallback ACP eksplisit hanya ketika `/codex` native tidak tersedia atau ACP diminta. |
| `copilot`  | Adapter ACP GitHub Copilot                     | Memerlukan autentikasi CLI/runtime Copilot.                                                  |
| `cursor`   | ACP CLI Cursor (`cursor-agent acp`)            | Override perintah acpx jika pemasangan lokal mengekspos entrypoint ACP yang berbeda.    |
| `droid`    | CLI Factory Droid                              | Memerlukan autentikasi Factory/Droid atau `FACTORY_API_KEY` di lingkungan harness.        |
| `gemini`   | Adapter ACP Gemini CLI                         | Memerlukan autentikasi Gemini CLI atau penyiapan kunci API.                                          |
| `iflow`    | CLI iFlow                                      | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terpasang.                 |
| `kilocode` | CLI Kilo Code                                  | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terpasang.                 |
| `kimi`     | CLI Kimi/Moonshot                              | Memerlukan autentikasi Kimi/Moonshot di host.                                            |
| `kiro`     | CLI Kiro                                       | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terpasang.                 |
| `opencode` | Adapter ACP OpenCode                           | Memerlukan autentikasi CLI/provider OpenCode.                                                |
| `openclaw` | Jembatan OpenClaw Gateway melalui `openclaw acp` | Memungkinkan harness sadar-ACP berbicara kembali ke sesi OpenClaw Gateway.                 |
| `qwen`     | Qwen Code / Qwen CLI                           | Memerlukan autentikasi kompatibel Qwen di host.                                          |

Alias agen acpx kustom dapat dikonfigurasi di acpx itu sendiri, tetapi kebijakan
OpenClaw tetap memeriksa `acp.allowedAgents` dan pemetaan
`agents.list[].runtime.acp.agent` apa pun sebelum dispatch.

## Runbook operator

Alur cepat `/acp` dari chat:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, atau
    `/acp spawn codex --bind here` eksplisit.
  </Step>
  <Step title="Bekerja">
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
    - Spawn membuat atau melanjutkan sesi runtime ACP, mencatat metadata ACP di penyimpanan sesi OpenClaw, dan dapat membuat tugas latar belakang ketika run dimiliki parent.
    - Sesi ACP yang dimiliki parent diperlakukan sebagai pekerjaan latar belakang bahkan ketika sesi runtime bersifat persisten; penyelesaian dan pengiriman lintas permukaan melalui notifier tugas parent, bukan bertindak seperti sesi chat normal yang terlihat pengguna.
    - Pemeliharaan tugas menutup sesi ACP sekali-jalan yang terminal atau yatim dan dimiliki parent. Sesi ACP persisten dipertahankan selama binding percakapan aktif tetap ada; sesi persisten usang tanpa binding aktif ditutup agar tidak dapat dilanjutkan diam-diam setelah tugas pemilik selesai atau catatan tugasnya hilang.
    - Pesan tindak lanjut terikat langsung menuju sesi ACP hingga binding ditutup, tidak difokuskan, direset, atau kedaluwarsa.
    - Perintah Gateway tetap lokal. `/acp ...`, `/status`, dan `/unfocus` tidak pernah dikirim sebagai teks prompt normal ke harness ACP terikat.
    - `cancel` membatalkan giliran aktif ketika backend mendukung pembatalan; ini tidak menghapus metadata binding atau sesi.
    - `close` mengakhiri sesi ACP dari sudut pandang OpenClaw dan menghapus binding. Harness mungkin tetap menyimpan riwayat upstream-nya sendiri jika mendukung resume.
    - Plugin acpx membersihkan pohon proses wrapper dan adapter milik OpenClaw setelah `close`, dan membersihkan orphan ACPX milik OpenClaw yang usang saat startup Gateway.
    - Worker runtime idle memenuhi syarat untuk dibersihkan setelah `acp.runtime.ttlMinutes`; metadata sesi tersimpan tetap tersedia untuk `/acp sessions`.

  </Accordion>
  <Accordion title="Aturan routing Codex native">
    Pemicu bahasa alami yang harus diarahkan ke **Plugin Codex
    native** ketika diaktifkan:

    - "Ikat channel Discord ini ke Codex."
    - "Lampirkan chat ini ke thread Codex `<id>`."
    - "Tampilkan thread Codex, lalu ikat yang ini."

    Pengikatan percakapan Codex native adalah jalur kontrol chat default.
    OpenClaw dynamic tools tetap dijalankan melalui OpenClaw, sedangkan
    Codex-native tools seperti shell/apply-patch dijalankan di dalam Codex.
    Untuk peristiwa tool Codex-native, OpenClaw menyuntikkan relay hook native
    per giliran sehingga hook plugin dapat memblokir `before_tool_call`, mengamati
    `after_tool_call`, dan merutekan peristiwa Codex `PermissionRequest`
    melalui persetujuan OpenClaw. Hook Codex `Stop` direlay ke
    OpenClaw `before_agent_finalize`, tempat plugin dapat meminta satu
    lintasan model lagi sebelum Codex memfinalisasi jawabannya. Relay tetap
    sengaja konservatif: relay tidak mengubah argumen tool Codex-native
    atau menulis ulang catatan thread Codex. Gunakan ACP eksplisit hanya
    saat Anda menginginkan model runtime/sesi ACP. Batas dukungan Codex
    tertanam didokumentasikan dalam
    [kontrak dukungan Codex harness v1](/id/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Lembar contekan pemilihan model / provider / runtime">
    - ref model Codex lama - rute model OAuth/langganan Codex lama yang diperbaiki oleh doctor.
    - `openai/*` - runtime tertanam app-server Codex native untuk giliran agen OpenAI.
    - `/codex ...` - kontrol percakapan Codex native.
    - `/acp ...` atau `runtime: "acp"` - kontrol ACP/acpx eksplisit.

  </Accordion>
  <Accordion title="Pemicu bahasa alami perutean ACP">
    Pemicu yang harus dirutekan ke runtime ACP:

    - "Jalankan ini sebagai sesi ACP Claude Code sekali jalan dan rangkum hasilnya."
    - "Gunakan Gemini CLI untuk tugas ini dalam sebuah thread, lalu simpan tindak lanjut di thread yang sama."
    - "Jalankan Codex melalui ACP di thread latar belakang."

    OpenClaw memilih `runtime: "acp"`, me-resolve `agentId` harness,
    mengikat ke percakapan atau thread saat ini bila didukung, dan
    merutekan tindak lanjut ke sesi tersebut hingga ditutup/kedaluwarsa. Codex hanya
    mengikuti jalur ini saat ACP/acpx bersifat eksplisit atau plugin Codex native
    tidak tersedia untuk operasi yang diminta.

    Untuk `sessions_spawn`, `runtime: "acp"` diiklankan hanya saat ACP
    diaktifkan, peminta tidak berada dalam sandbox, dan backend runtime ACP
    dimuat. `acp.dispatch.enabled=false` menjeda dispatch thread ACP
    otomatis tetapi tidak menyembunyikan atau memblokir panggilan eksplisit
    `sessions_spawn({ runtime: "acp" })`. Ini menargetkan id harness ACP seperti `codex`,
    `claude`, `droid`, `gemini`, atau `opencode`. Jangan berikan id agen
    konfigurasi OpenClaw normal dari `agents_list` kecuali entri tersebut
    dikonfigurasi secara eksplisit dengan `agents.list[].runtime.type="acp"`;
    jika tidak, gunakan runtime sub-agen default. Saat agen OpenClaw
    dikonfigurasi dengan `runtime.type="acp"`, OpenClaw menggunakan
    `runtime.acp.agent` sebagai id harness yang mendasarinya.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agen

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan **app-server Codex
native** untuk pengikatan/kontrol percakapan Codex saat plugin `codex`
diaktifkan. Gunakan **sub-agen** saat Anda menginginkan
run terdelegasi native OpenClaw.

| Area          | Sesi ACP                              | Run sub-agen                       |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime sub-agen native OpenClaw   |
| Kunci sesi    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Perintah utama | `/acp ...`                           | `/subagents ...`                   |
| Tool spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agen](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, stack-nya adalah:

1. Control plane sesi ACP OpenClaw.
2. Plugin runtime resmi `@openclaw/acpx`.
3. Adapter ACP Claude.
4. Mesin runtime/sesi sisi Claude.

ACP Claude adalah **sesi harness** dengan kontrol ACP, resume sesi,
pelacakan tugas latar belakang, dan pengikatan percakapan/thread opsional.

Backend CLI adalah runtime fallback lokal teks-saja yang terpisah - lihat
[Backend CLI](/id/gateway/cli-backends).

Untuk operator, aturan praktisnya adalah:

- **Ingin `/acp spawn`, sesi yang dapat diikat, kontrol runtime, atau pekerjaan harness persisten?** Gunakan ACP.
- **Ingin fallback teks lokal sederhana melalui CLI mentah?** Gunakan backend CLI.

## Sesi terikat

### Model mental

- **Permukaan chat** - tempat orang terus berbicara (channel Discord, topik Telegram, chat iMessage).
- **Sesi ACP** - state runtime Codex/Claude/Gemini tahan lama yang dirutekan OpenClaw.
- **Thread/topik anak** - permukaan perpesanan tambahan opsional yang dibuat hanya oleh `--thread ...`.
- **Workspace runtime** - lokasi filesystem (`cwd`, checkout repo, workspace backend) tempat harness berjalan. Independen dari permukaan chat.

### Ikatan percakapan saat ini

`/acp spawn <harness> --bind here` menyematkan percakapan saat ini ke
sesi ACP yang di-spawn - tanpa thread anak, permukaan chat yang sama. OpenClaw tetap
memiliki transport, auth, safety, dan pengiriman. Pesan tindak lanjut dalam
percakapan tersebut dirutekan ke sesi yang sama; `/new` dan `/reset` mereset
sesi di tempat; `/acp close` menghapus pengikatan.

Contoh:

```text
/codex bind                                              # ikatan Codex native, rutekan pesan mendatang ke sini
/codex model gpt-5.4                                     # sesuaikan thread Codex native yang terikat
/codex stop                                              # kontrol giliran Codex native aktif
/acp spawn codex --bind here                             # fallback ACP eksplisit untuk Codex
/acp spawn codex --thread auto                           # dapat membuat thread/topik anak dan mengikat di sana
/acp spawn codex --bind here --cwd /workspace/repo       # pengikatan chat yang sama, Codex berjalan di /workspace/repo
```

<AccordionGroup>
  <Accordion title="Aturan pengikatan dan eksklusivitas">
    - `--bind here` dan `--thread ...` saling eksklusif.
    - `--bind here` hanya berfungsi pada channel yang mengiklankan pengikatan percakapan saat ini; OpenClaw mengembalikan pesan tidak didukung yang jelas jika tidak. Pengikatan tetap ada lintas restart gateway.
    - Di Discord, `spawnSessions` membatasi pembuatan thread anak untuk `--thread auto|here` - bukan `--bind here`.
    - Jika Anda men-spawn ke agen ACP lain tanpa `--cwd`, OpenClaw mewarisi workspace **agen target** secara default. Jalur warisan yang hilang (`ENOENT`/`ENOTDIR`) jatuh kembali ke default backend; error akses lain (mis. `EACCES`) muncul sebagai error spawn.
    - Perintah manajemen Gateway tetap lokal dalam percakapan terikat - perintah `/acp ...` ditangani oleh OpenClaw bahkan saat teks tindak lanjut normal dirutekan ke sesi ACP terikat; `/status` dan `/unfocus` juga tetap lokal kapan pun penanganan perintah diaktifkan untuk permukaan tersebut.

  </Accordion>
  <Accordion title="Sesi terikat thread">
    Saat pengikatan thread diaktifkan untuk adapter channel:

    - OpenClaw mengikat thread ke sesi ACP target.
    - Pesan tindak lanjut dalam thread tersebut dirutekan ke sesi ACP terikat.
    - Output ACP dikirim kembali ke thread yang sama.
    - Unfocus/close/archive/idle-timeout atau kedaluwarsa max-age menghapus pengikatan.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, dan `/unfocus` adalah perintah Gateway, bukan prompt ke harness ACP.

    Feature flag yang diperlukan untuk ACP terikat thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` aktif secara default (atur `false` untuk menjeda dispatch thread ACP otomatis; panggilan eksplisit `sessions_spawn({ runtime: "acp" })` tetap berfungsi).
    - Spawn sesi thread adapter channel diaktifkan (default: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Dukungan pengikatan thread bersifat spesifik adapter. Jika adapter channel aktif
    tidak mendukung pengikatan thread, OpenClaw mengembalikan pesan
    tidak didukung/tidak tersedia yang jelas.

  </Accordion>
  <Accordion title="Channel yang mendukung thread">
    - Adapter channel apa pun yang mengekspos kapabilitas pengikatan sesi/thread.
    - Dukungan bawaan saat ini: thread/channel **Discord**, topik **Telegram** (topik forum dalam grup/supergrup dan topik DM).
    - Channel plugin dapat menambahkan dukungan melalui antarmuka pengikatan yang sama.

  </Accordion>
</AccordionGroup>

## Pengikatan channel persisten

Untuk alur kerja non-ephemeral, konfigurasikan pengikatan ACP persisten dalam
entri `bindings[]` tingkat atas.

### Model pengikatan

<ParamField path="bindings[].type" type='"acp"'>
  Menandai pengikatan percakapan ACP persisten.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Mengidentifikasi percakapan target. Bentuk per-channel:

- **Channel/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Channel/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Utamakan id Slack stabil; pengikatan channel juga cocok dengan balasan di dalam thread channel tersebut.
- **Topik forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grup WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Gunakan nomor E.164 seperti `+15555550123` untuk chat langsung dan JID grup WhatsApp seperti `120363424282127706@g.us` untuk grup.
- **DM/grup iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Utamakan `chat_id:*` untuk pengikatan grup yang stabil.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Id agen OpenClaw pemilik.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Override ACP opsional.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Label opsional yang dihadapkan ke operator.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Direktori kerja runtime opsional.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Override backend opsional.
</ParamField>

### Default runtime per agen

Gunakan `agents.list[].runtime` untuk menentukan default ACP sekali per agen:

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

- OpenClaw memastikan sesi ACP yang dikonfigurasi ada setelah penerimaan khusus channel dan sebelum digunakan.
- Pesan dalam channel, topik, atau chat tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Binding ACP yang dikonfigurasi memiliki rute sesinya sendiri. Fan-out siaran channel tidak menggantikan sesi ACP yang dikonfigurasi untuk binding yang cocok.
- Dalam percakapan yang terikat, `/new` dan `/reset` mereset kunci sesi ACP yang sama di tempat.
- Binding runtime sementara (misalnya yang dibuat oleh alur fokus thread) tetap berlaku jika ada.
- Untuk spawn ACP lintas agen tanpa `cwd` eksplisit, OpenClaw mewarisi workspace agen target dari konfigurasi agen.
- Jalur workspace turunan yang hilang kembali ke cwd default backend; kegagalan akses yang tidak hilang muncul sebagai error spawn.

## Memulai sesi ACP

Dua cara untuk memulai sesi ACP:

<Tabs>
  <Tab title="From sessions_spawn">
    Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agen atau
    panggilan tool.

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
    `runtime` default ke `subagent`, jadi tetapkan `runtime: "acp"` secara eksplisit
    untuk sesi ACP. Jika `agentId` dihilangkan, OpenClaw menggunakan
    `acp.defaultAgent` saat dikonfigurasi. `mode: "session"` memerlukan
    `thread: true` untuk mempertahankan percakapan terikat yang persisten.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Gunakan `/acp spawn` untuk kontrol operator eksplisit dari chat.

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
  Id harness target ACP. Kembali ke `acp.defaultAgent` jika ditetapkan.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Meminta alur binding thread jika didukung.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` bersifat sekali jalan; `"session"` bersifat persisten. Jika `thread: true` dan
  `mode` dihilangkan, OpenClaw dapat default ke perilaku persisten per
  jalur runtime. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime).
  Jika dihilangkan, spawn ACP mewarisi workspace agen target
  saat dikonfigurasi; jalur turunan yang hilang kembali ke default
  backend, sedangkan error akses nyata dikembalikan.
</ParamField>
<ParamField path="label" type="string">
  Label yang terlihat oleh operator yang digunakan dalam teks sesi/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Melanjutkan sesi ACP yang sudah ada alih-alih membuat yang baru. Agen
  memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` mengalirkan ringkasan progres run ACP awal kembali ke
  sesi peminta sebagai event sistem. Respons yang diterima mencakup
  `streamLogPath` yang menunjuk ke log JSONL bercakupan sesi
  (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk riwayat relay lengkap.
  Stream progres induk menampilkan komentar asisten dan progres status ACP secara
  default kecuali `streaming.progress.commentary=false`. Discord juga secara default
  mengatur pratinjau induk ke mode progres saat tidak ada mode stream yang dikonfigurasi. Progres
  status tetap mematuhi `acp.stream.tagVisibility`, sehingga tag seperti `plan`
  tetap tersembunyi kecuali diaktifkan secara eksplisit.
</ParamField>

Run ACP `sessions_spawn` menggunakan `agents.defaults.subagents.runTimeoutSeconds` sebagai
batas giliran anak defaultnya. Tool tidak menerima override timeout per panggilan.

<ParamField path="model" type="string">
  Override model eksplisit untuk sesi anak ACP. Spawn ACP Codex
  menormalkan ref OpenAI seperti `openai/gpt-5.4` ke konfigurasi startup
  ACP Codex sebelum `session/new`; bentuk slash seperti `openai/gpt-5.4/high`
  juga menetapkan upaya penalaran ACP Codex.
  Jika dihilangkan, `sessions_spawn({ runtime: "acp" })` menggunakan default
  model subagen yang ada (`agents.defaults.subagents.model` atau
  `agents.list[].subagents.model`) saat dikonfigurasi; jika tidak, ini membiarkan
  harness ACP menggunakan model defaultnya sendiri.
  Harness lain harus mengiklankan `models` ACP dan mendukung
  `session/set_model`; jika tidak, OpenClaw/acpx gagal dengan jelas alih-alih
  diam-diam kembali ke default agen target.
</ParamField>
<ParamField path="thinking" type="string">
  Upaya berpikir/penalaran eksplisit. Untuk ACP Codex, `minimal` dipetakan ke
  upaya rendah, `low`/`medium`/`high`/`xhigh` dipetakan langsung, dan `off`
  menghilangkan override startup reasoning-effort.
  Jika dihilangkan, spawn ACP menggunakan default berpikir subagen yang ada dan
  `agents.defaults.models["provider/model"].params.thinking` per model
  untuk model yang dipilih.
</ParamField>

## Mode binding dan thread spawn

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Perilaku                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
    | `off`  | Jangan buat binding percakapan saat ini.                               |

    Catatan:

    - `--bind here` adalah jalur operator paling sederhana untuk "buat channel atau chat ini didukung Codex."
    - `--bind here` tidak membuat thread anak.
    - `--bind here` hanya tersedia pada channel yang mengekspos dukungan binding percakapan saat ini.
    - `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Perilaku                                                                                           |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | Dalam thread aktif: ikat thread itu. Di luar thread: buat/ikat thread anak jika didukung. |
    | `here` | Wajib ada thread aktif saat ini; gagal jika tidak berada di dalamnya.                              |
    | `off`  | Tidak ada binding. Sesi dimulai tanpa terikat.                                                     |

    Catatan:

    - Pada permukaan binding non-thread, perilaku default secara efektif adalah `off`.
    - Spawn terikat thread memerlukan dukungan kebijakan channel:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gunakan `--bind here` saat Anda ingin menyematkan percakapan saat ini tanpa membuat thread anak.

  </Tab>
</Tabs>

## Model pengiriman

Sesi ACP dapat berupa workspace interaktif atau pekerjaan latar belakang yang dimiliki
induk. Jalur pengiriman bergantung pada bentuk tersebut.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Sesi interaktif dimaksudkan untuk terus berbicara pada permukaan chat
    yang terlihat:

    - `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
    - `/acp spawn ... --thread ...` mengikat thread/topik channel ke sesi ACP.
    - `bindings[].type="acp"` persisten yang dikonfigurasi merutekan percakapan yang cocok ke sesi ACP yang sama.

    Pesan lanjutan dalam percakapan terikat dirutekan langsung ke
    sesi ACP, dan output ACP dikirim kembali ke
    channel/thread/topik yang sama.

    Yang dikirim OpenClaw ke harness:

    - Tindak lanjut terikat normal dikirim sebagai teks prompt, ditambah lampiran hanya saat harness/backend mendukungnya.
    - Perintah manajemen `/acp` dan perintah Gateway lokal diintersepsi sebelum pengiriman ACP.
    - Event penyelesaian yang dihasilkan runtime diwujudkan per target. Agen OpenClaw mendapat envelope runtime-context internal OpenClaw; harness ACP eksternal mendapat prompt biasa dengan hasil dan instruksi anak. Envelope mentah `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` tidak boleh pernah dikirim ke harness eksternal atau dipersistenkan sebagai teks transkrip pengguna ACP.
    - Entri transkrip ACP menggunakan teks pemicu yang terlihat oleh pengguna atau prompt penyelesaian biasa. Metadata event internal tetap terstruktur di OpenClaw jika memungkinkan dan tidak diperlakukan sebagai konten chat yang ditulis pengguna.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Sesi ACP sekali jalan yang di-spawn oleh run agen lain adalah anak
    latar belakang, mirip dengan sub-agen:

    - Induk meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Anak berjalan dalam sesi harness ACP-nya sendiri.
    - Giliran anak berjalan di lane latar belakang yang sama yang digunakan oleh spawn sub-agen native, sehingga harness ACP yang lambat tidak memblokir pekerjaan sesi utama yang tidak terkait.
    - Laporan penyelesaian kembali melalui jalur pengumuman penyelesaian tugas. OpenClaw mengonversi metadata penyelesaian internal menjadi prompt ACP biasa sebelum mengirimkannya ke harness eksternal, sehingga harness tidak melihat marker konteks runtime khusus OpenClaw.
    - Induk menulis ulang hasil anak dengan suara asisten normal saat balasan yang terlihat pengguna berguna.

    **Jangan** perlakukan jalur ini sebagai chat peer-to-peer antara induk
    dan anak. Anak sudah memiliki channel penyelesaian kembali ke
    induk.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` dapat menargetkan sesi lain setelah spawn. Untuk sesi peer
    normal, OpenClaw menggunakan jalur tindak lanjut agen-ke-agen (A2A)
    setelah menyuntikkan pesan:

    - Tunggu balasan sesi target.
    - Secara opsional, izinkan peminta dan target bertukar sejumlah giliran tindak lanjut yang dibatasi.
    - Minta target menghasilkan pesan pengumuman.
    - Kirim pengumuman itu ke channel atau thread yang terlihat.

    Jalur A2A tersebut adalah fallback untuk pengiriman peer saat pengirim memerlukan
    tindak lanjut yang terlihat. Jalur ini tetap aktif saat sesi yang tidak terkait dapat
    melihat dan mengirim pesan ke target ACP, misalnya di bawah pengaturan
    `tools.sessions.visibility` yang luas.

    OpenClaw melewati tindak lanjut A2A hanya ketika peminta adalah
    induk dari anak ACP sekali-jalan milik induknya sendiri. Dalam kasus itu,
    menjalankan A2A di atas penyelesaian tugas dapat membangunkan induk dengan
    hasil anak, meneruskan balasan induk kembali ke anak, dan
    membuat loop gema induk/anak. Hasil `sessions_send` melaporkan
    `delivery.status="skipped"` untuk kasus anak yang dimiliki itu karena
    jalur penyelesaian sudah bertanggung jawab atas hasilnya.

  </Accordion>
  <Accordion title="Lanjutkan sesi yang ada">
    Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih
    memulai dari awal. Agen memutar ulang riwayat percakapannya melalui
    `session/load`, sehingga ia melanjutkan dengan konteks penuh dari hal yang terjadi sebelumnya.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Kasus penggunaan umum:

    - Serahkan sesi Codex dari laptop ke ponsel Anda - beri tahu agen Anda untuk melanjutkan dari tempat Anda berhenti.
    - Lanjutkan sesi pengodean yang Anda mulai secara interaktif di CLI, sekarang secara headless melalui agen Anda.
    - Lanjutkan pekerjaan yang terputus oleh restart Gateway atau timeout idle.

    Catatan:

    - `resumeSessionId` hanya berlaku ketika `runtime: "acp"`; runtime sub-agen default mengabaikan bidang khusus ACP ini.
    - `streamTo` hanya berlaku ketika `runtime: "acp"`; runtime sub-agen default mengabaikan bidang khusus ACP ini.
    - `resumeSessionId` adalah id resume ACP/harness lokal-host, bukan kunci sesi channel OpenClaw; OpenClaw tetap memeriksa kebijakan spawn ACP dan kebijakan agen target sebelum pengiriman, sementara backend ACP atau harness memiliki otorisasi untuk memuat id upstream itu.
    - `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku secara normal pada sesi OpenClaw baru yang Anda buat, sehingga `mode: "session"` tetap memerlukan `thread: true`.
    - Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
    - Jika id sesi tidak ditemukan, spawn gagal dengan error yang jelas - tanpa fallback diam-diam ke sesi baru.

  </Accordion>
  <Accordion title="Uji smoke pasca-deploy">
    Setelah deploy Gateway, jalankan pemeriksaan end-to-end langsung alih-alih
    memercayai unit test:

    1. Verifikasi versi dan commit Gateway yang di-deploy pada host target.
    2. Buka sesi bridge ACPX sementara ke agen langsung.
    3. Minta agen itu memanggil `sessions_spawn` dengan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, dan tugas `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifikasi `accepted=yes`, `childSessionKey` nyata, dan tidak ada error validator.
    5. Bersihkan sesi bridge sementara.

    Pertahankan gate pada `mode: "run"` dan lewati `streamTo: "parent"` -
    `mode: "session"` yang terikat thread dan jalur stream-relay adalah pass
    integrasi lebih kaya yang terpisah.

  </Accordion>
</AccordionGroup>

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, **bukan** di dalam
sandbox OpenClaw.

<Warning>
**Batas keamanan:**

- Harness eksternal dapat membaca/menulis sesuai izin CLI miliknya sendiri dan `cwd` yang dipilih.
- Kebijakan sandbox OpenClaw **tidak** membungkus eksekusi harness ACP.
- OpenClaw tetap menegakkan gate fitur ACP, agen yang diizinkan, kepemilikan sesi, binding channel, dan kebijakan pengiriman Gateway.
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

Jika tidak ada target yang terselesaikan, OpenClaw mengembalikan error yang jelas
(`Unable to resolve session target: ...`).

## Kontrol ACP

| Perintah             | Fungsinya                                                 | Contoh                                                        |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; binding saat ini atau binding thread opsional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan giliran yang sedang berjalan untuk sesi target. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Mengirim instruksi steer ke sesi yang berjalan.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas binding target thread.           | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, state, opsi runtime, kemampuan. | `/acp status`                                                 |
| `/acp set-mode`      | Mengatur mode runtime untuk sesi target.                  | `/acp set-mode plan`                                          |
| `/acp set`           | Menulis opsi konfigurasi runtime generik.                 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Mengatur override direktori kerja runtime.                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Mengatur profil kebijakan approval.                       | `/acp permissions strict`                                     |
| `/acp timeout`       | Mengatur timeout runtime (detik).                         | `/acp timeout 120`                                            |
| `/acp model`         | Mengatur override model runtime.                          | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus override opsi runtime sesi.                     | `/acp reset-options`                                          |
| `/acp sessions`      | Mencantumkan sesi ACP terbaru dari store.                 | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kemampuan, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                                 |
| `/acp install`       | Mencetak langkah instalasi dan pengaktifan deterministik. | `/acp install`                                                |

`/acp status` menampilkan opsi runtime efektif serta pengidentifikasi sesi tingkat runtime dan
tingkat backend. Error kontrol yang tidak didukung muncul
dengan jelas ketika backend tidak memiliki kemampuan. `/acp sessions` membaca
store untuk sesi yang sedang terikat atau sesi peminta saat ini; token target
(`session-key`, `session-id`, atau `session-label`) diselesaikan melalui
penemuan sesi Gateway, termasuk root `session.store` per-agen kustom.

### Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik. Operasi yang setara:

| Perintah                     | Dipetakan ke                         | Catatan                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | kunci konfigurasi runtime `model`    | Untuk Codex ACP, OpenClaw menormalisasi `openai/<model>` ke id model adapter dan memetakan sufiks reasoning garis miring seperti `openai/gpt-5.4/high` ke `reasoning_effort`.                              |
| `/acp set thinking <level>`  | opsi kanonis `thinking`              | OpenClaw mengirim padanan yang diiklankan backend ketika ada, dengan preferensi `thinking`, lalu `effort`, `reasoning_effort`, atau `thought_level`. Untuk Codex ACP, adapter memetakan nilai ke `reasoning_effort`. |
| `/acp permissions <profile>` | opsi kanonis `permissionProfile`     | OpenClaw mengirim padanan yang diiklankan backend ketika ada, seperti `approval_policy`, `permission_profile`, `permissions`, atau `permission_mode`.                                                       |
| `/acp timeout <seconds>`     | opsi kanonis `timeoutSeconds`        | OpenClaw mengirim padanan yang diiklankan backend ketika ada, seperti `timeout` atau `timeout_seconds`.                                                                                                     |
| `/acp cwd <path>`            | override cwd runtime                 | Pembaruan langsung.                                                                                                                                                                                        |
| `/acp set <key> <value>`     | generik                              | `key=cwd` menggunakan jalur override cwd.                                                                                                                                                                  |
| `/acp reset-options`         | menghapus semua override runtime     | -                                                                                                                                                                                                          |

## Harness acpx, penyiapan Plugin, dan izin

Untuk konfigurasi harness acpx (alias Claude Code / Codex / Gemini CLI),
bridge MCP plugin-tools dan OpenClaw-tools, serta mode izin ACP, lihat
[Agen ACP - penyiapan](/id/tools/acp-agents-setup).

## Pemecahan masalah

| Gejala                                                                      | Kemungkinan penyebab                                                                                                   | Perbaikan                                                                                                                                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang, dinonaktifkan, atau diblokir oleh `plugins.allow`.                                              | Instal dan aktifkan Plugin backend, sertakan `acpx` dalam `plugins.allow` saat allowlist tersebut disetel, lalu jalankan `/acp doctor`.                                  |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                                                       | Setel `acp.enabled=true`.                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch otomatis dari pesan thread normal dinonaktifkan.                                                              | Setel `acp.dispatch.enabled=true` untuk melanjutkan routing thread otomatis; panggilan eksplisit `sessions_spawn({ runtime: "acp" })` tetap berfungsi.                   |
| `ACP agent "<id>" is not allowed by policy`                                 | Agen tidak ada dalam allowlist.                                                                                        | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                      |
| `/acp doctor` melaporkan backend belum siap tepat setelah startup           | Plugin backend hilang, dinonaktifkan, diblokir oleh kebijakan allow/deny, atau executable yang dikonfigurasi tidak tersedia. | Instal/aktifkan Plugin backend, jalankan ulang `/acp doctor`, dan periksa error instalasi backend atau kebijakan jika statusnya tetap tidak sehat.                       |
| Perintah harness tidak ditemukan                                            | CLI adapter tidak terinstal, Plugin eksternal hilang, atau pengambilan `npx` saat pertama kali dijalankan gagal untuk adapter non-Codex. | Jalankan `/acp doctor`, instal/prapanaskan adapter pada host Gateway, atau konfigurasikan perintah agen acpx secara eksplisit.                                           |
| Model-not-found dari harness                                                | Id model valid untuk penyedia/harness lain tetapi bukan untuk target ACP ini.                                          | Gunakan model yang tercantum oleh harness tersebut, konfigurasikan model dalam harness, atau hilangkan override.                                                        |
| Error autentikasi vendor dari harness                                       | OpenClaw sehat, tetapi CLI/penyedia target belum login.                                                                | Login atau sediakan kunci penyedia yang diperlukan pada lingkungan host Gateway.                                                                                         |
| `Unable to resolve session target: ...`                                     | Token key/id/label buruk.                                                                                              | Jalankan `/acp sessions`, salin key/label yang persis, coba lagi.                                                                                                       |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang dapat di-bind.                                                     | Pindah ke chat/channel target dan coba lagi, atau gunakan spawn tanpa bind.                                                                                             |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter tidak memiliki kapabilitas binding ACP percakapan saat ini.                                                    | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` tingkat atas, atau pindah ke channel yang didukung.                                    |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks thread.                                                                      | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                             |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target binding aktif.                                                                           | Rebind sebagai pemilik atau gunakan percakapan atau thread lain.                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | Adapter tidak memiliki kapabilitas binding thread.                                                                     | Gunakan `--thread off` atau pindah ke adapter/channel yang didukung.                                                                                                    |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.                                                    | Gunakan `runtime="subagent"` dari sesi yang berada dalam sandbox, atau jalankan spawn ACP dari sesi non-sandbox.                                                        |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                                                         | Gunakan `runtime="subagent"` untuk sandboxing wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi non-sandbox.                                                 |
| `Cannot apply --model ... did not advertise model support`                  | Harness target tidak mengekspos penggantian model ACP generik.                                                        | Gunakan harness yang mengiklankan ACP `models`/`session/set_model`, gunakan ref model ACP Codex, atau konfigurasikan model langsung dalam harness jika memiliki flag startup sendiri. |
| Metadata ACP hilang untuk sesi terikat                                      | Metadata sesi ACP usang/dihapus.                                                                                       | Buat ulang dengan `/acp spawn`, lalu rebind/fokuskan thread.                                                                                                            |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir penulisan/exec dalam sesi ACP non-interaktif.                                               | Setel `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan mulai ulang gateway. Lihat [Konfigurasi izin](/id/tools/acp-agents-setup#permission-configuration). |
| Sesi ACP gagal lebih awal dengan output sedikit                             | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.                                                | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, setel `permissionMode=approve-all`; untuk degradasi yang halus, setel `nonInteractivePermissions=deny`.  |
| Sesi ACP macet tanpa batas setelah menyelesaikan pekerjaan                  | Proses harness selesai tetapi sesi ACP tidak melaporkan penyelesaian.                                                  | Perbarui OpenClaw; pembersihan acpx saat ini menuai proses wrapper dan adapter usang milik OpenClaw saat ditutup dan saat startup Gateway.                              |
| Harness melihat `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                    | Envelope peristiwa internal bocor melewati batas ACP.                                                                  | Perbarui OpenClaw dan jalankan ulang alur penyelesaian; harness eksternal seharusnya hanya menerima prompt penyelesaian polos.                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` milik relay hook Codex native,
bukan ACP/acpx. Dalam chat Codex yang terikat, mulai sesi baru dengan `/new` atau `/reset`;
jika berhasil sekali lalu kembali pada panggilan tool native berikutnya, mulai ulang app-server
Codex atau OpenClaw Gateway alih-alih mengulang `/new`. Lihat [Pemecahan masalah harness Codex](/id/plugins/codex-harness#troubleshooting).
</Note>

## Terkait

- [Agen ACP - penyiapan](/id/tools/acp-agents-setup)
- [Pengiriman agen](/id/tools/agent-send)
- [Backend CLI](/id/gateway/cli-backends)
- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Tool sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode bridge)](/id/cli/acp)
- [Sub-agen](/id/tools/subagents)
