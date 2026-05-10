---
read_when:
    - Menjalankan harness pengodean melalui ACP
    - Menyiapkan sesi ACP yang terikat pada percakapan di saluran perpesanan
    - Mengikat percakapan kanal pesan ke sesi ACP persisten
    - Pemecahan masalah backend ACP, wiring Plugin, atau pengiriman penyelesaian
    - Menjalankan perintah /acp dari obrolan
sidebarTitle: ACP agents
summary: Jalankan harness pengodean eksternal (Claude Code, Cursor, Gemini CLI, Codex ACP eksplisit, OpenClaw ACP, OpenCode) melalui backend ACP
title: Agen ACP
x-i18n:
    generated_at: "2026-05-10T19:54:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sesi
memungkinkan OpenClaw menjalankan harness pengodean eksternal (misalnya Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain
yang didukung) melalui Plugin backend ACP.

Setiap spawn sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

<Note>
**ACP adalah jalur harness eksternal, bukan jalur Codex default.** Plugin
app-server Codex native memiliki kontrol `/codex ...` dan runtime tertanam
`openai/gpt-*` default untuk giliran agen; ACP memiliki
kontrol `/acp ...` dan sesi `sessions_spawn({ runtime: "acp" })`.

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal
langsung ke percakapan kanal OpenClaw yang sudah ada, gunakan
[`openclaw mcp serve`](/id/cli/mcp), bukan ACP.
</Note>

## Halaman mana yang saya butuhkan?

| Anda ingin…                                                                                     | Gunakan ini                           | Catatan                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mengikat atau mengontrol Codex dalam percakapan saat ini                                        | `/codex bind`, `/codex threads`       | Jalur app-server Codex native saat Plugin `codex` diaktifkan; mencakup balasan chat terikat, penerusan gambar, model/cepat/izin, berhenti, dan kontrol pengarah. ACP adalah fallback eksplisit |
| Menjalankan Claude Code, Gemini CLI, Codex ACP eksplisit, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini                           | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime                                                                                   |
| Mengekspos sesi OpenClaw Gateway _sebagai_ server ACP untuk editor atau klien                   | [`openclaw acp`](/id/cli/acp)            | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                                                                                                            |
| Menggunakan ulang CLI AI lokal sebagai model fallback hanya teks                                | [Backend CLI](/id/gateway/cli-backends) | Bukan ACP. Tanpa alat OpenClaw, tanpa kontrol ACP, tanpa runtime harness                                                                                                                               |

## Apakah ini berfungsi langsung?

Ya, setelah memasang Plugin runtime ACP resmi:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkout sumber dapat menggunakan Plugin workspace lokal `extensions/acpx` setelah
`pnpm install`. Jalankan `/acp doctor` untuk pemeriksaan kesiapan.

OpenClaw hanya mengajarkan agen tentang spawning ACP saat ACP **benar-benar
dapat digunakan**: ACP harus diaktifkan, dispatch tidak boleh dinonaktifkan, sesi
saat ini tidak boleh diblokir sandbox, dan backend runtime harus
dimuat. Jika kondisi tersebut tidak terpenuhi, Skills Plugin ACP dan panduan
ACP `sessions_spawn` tetap disembunyikan sehingga agen tidak menyarankan
backend yang tidak tersedia.

<AccordionGroup>
  <Accordion title="Kendala saat pertama kali dijalankan">
    - Jika `plugins.allow` disetel, itu adalah inventaris Plugin yang restriktif dan **harus** menyertakan `acpx`; jika tidak, backend ACP yang dipasang sengaja diblokir dan `/acp doctor` melaporkan entri allowlist yang hilang.
    - Adapter ACP Codex disiapkan dengan Plugin `acpx` dan diluncurkan secara lokal jika memungkinkan.
    - Codex ACP berjalan dengan `CODEX_HOME` yang terisolasi; OpenClaw hanya menyalin entri proyek tepercaya dari konfigurasi Codex host dan memercayai workspace aktif, sementara auth, notifikasi, dan hook tetap berada di konfigurasi host.
    - Adapter harness target lain mungkin masih diambil sesuai kebutuhan dengan `npx` saat pertama kali Anda menggunakannya.
    - Auth vendor tetap harus tersedia di host untuk harness tersebut.
    - Jika host tidak memiliki npm atau akses jaringan, pengambilan adapter pertama kali gagal hingga cache dipanaskan terlebih dahulu atau adapter dipasang dengan cara lain.

  </Accordion>
  <Accordion title="Prasyarat runtime">
    ACP meluncurkan proses harness eksternal sungguhan. OpenClaw memiliki routing,
    status tugas latar belakang, pengiriman, binding, dan kebijakan; harness
    memiliki login providernya, katalog model, perilaku filesystem, dan
    alat native.

    Sebelum menyalahkan OpenClaw, verifikasi:

    - `/acp doctor` melaporkan backend yang aktif dan sehat.
    - ID target diizinkan oleh `acp.allowedAgents` saat allowlist tersebut disetel.
    - Perintah harness dapat dimulai pada host Gateway.
    - Auth provider tersedia untuk harness tersebut (`claude`, `codex`, `gemini`, `opencode`, `droid`, dll.).
    - Model yang dipilih tersedia untuk harness tersebut - ID model tidak portabel antar-harness.
    - `cwd` yang diminta ada dan dapat diakses, atau hilangkan `cwd` dan biarkan backend menggunakan defaultnya.
    - Mode izin sesuai dengan pekerjaan. Sesi non-interaktif tidak dapat mengklik prompt izin native, sehingga proses pengodean yang berat tulis/eksekusi biasanya memerlukan profil izin ACPX yang dapat berjalan headless.

  </Accordion>
</AccordionGroup>

Alat Plugin OpenClaw dan alat bawaan OpenClaw **tidak** diekspos ke
harness ACP secara default. Aktifkan bridge MCP eksplisit di
[agen ACP - penyiapan](/id/tools/acp-agents-setup) hanya saat harness
harus memanggil alat tersebut secara langsung.

## Target harness yang didukung

Dengan backend `acpx`, gunakan ID harness ini sebagai target `/acp spawn <id>`
atau `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID harness | Backend umum                                  | Catatan                                                                             |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter ACP Claude Code                        | Memerlukan auth Claude Code pada host.                                              |
| `codex`    | Adapter ACP Codex                              | Fallback ACP eksplisit hanya saat `/codex` native tidak tersedia atau ACP diminta. |
| `copilot`  | Adapter ACP GitHub Copilot                     | Memerlukan auth CLI/runtime Copilot.                                                |
| `cursor`   | ACP Cursor CLI (`cursor-agent acp`)            | Timpa perintah acpx jika pemasangan lokal mengekspos entrypoint ACP yang berbeda.  |
| `droid`    | Factory Droid CLI                              | Memerlukan auth Factory/Droid atau `FACTORY_API_KEY` di lingkungan harness.         |
| `gemini`   | Adapter ACP Gemini CLI                         | Memerlukan auth Gemini CLI atau penyiapan kunci API.                                |
| `iflow`    | iFlow CLI                                      | Ketersediaan adapter dan kontrol model bergantung pada CLI yang dipasang.           |
| `kilocode` | Kilo Code CLI                                  | Ketersediaan adapter dan kontrol model bergantung pada CLI yang dipasang.           |
| `kimi`     | Kimi/Moonshot CLI                              | Memerlukan auth Kimi/Moonshot pada host.                                            |
| `kiro`     | Kiro CLI                                       | Ketersediaan adapter dan kontrol model bergantung pada CLI yang dipasang.           |
| `opencode` | Adapter ACP OpenCode                           | Memerlukan auth CLI/provider OpenCode.                                              |
| `openclaw` | Bridge OpenClaw Gateway melalui `openclaw acp` | Memungkinkan harness sadar-ACP berbicara kembali ke sesi OpenClaw Gateway.          |
| `pi`       | Runtime Pi/OpenClaw tertanam                   | Digunakan untuk eksperimen harness native OpenClaw.                                 |
| `qwen`     | Qwen Code / Qwen CLI                           | Memerlukan auth yang kompatibel dengan Qwen pada host.                              |

Alias agen acpx kustom dapat dikonfigurasi di acpx itu sendiri, tetapi kebijakan
OpenClaw tetap memeriksa `acp.allowedAgents` dan setiap pemetaan
`agents.list[].runtime.acp.agent` sebelum dispatch.

## Runbook operator

Alur cepat `/acp` dari chat:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, atau
    `/acp spawn codex --bind here` eksplisit.
  </Step>
  <Step title="Bekerja">
    Lanjutkan di percakapan atau thread yang terikat (atau targetkan kunci sesi
    secara eksplisit).
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
    - Spawn membuat atau melanjutkan sesi runtime ACP, mencatat metadata ACP di penyimpanan sesi OpenClaw, dan dapat membuat tugas latar belakang saat proses dimiliki induk.
    - Sesi ACP yang dimiliki induk diperlakukan sebagai pekerjaan latar belakang bahkan saat sesi runtime bersifat persisten; penyelesaian dan pengiriman lintas permukaan melalui notifier tugas induk alih-alih bertindak seperti sesi chat biasa yang terlihat pengguna.
    - Pemeliharaan tugas menutup sesi ACP one-shot yang terminal atau yatim dan dimiliki induk. Sesi ACP persisten dipertahankan selama binding percakapan aktif masih ada; sesi persisten yang basi tanpa binding aktif ditutup sehingga tidak dapat dilanjutkan diam-diam setelah tugas pemilik selesai atau catatan tugasnya hilang.
    - Pesan lanjutan yang terikat langsung menuju sesi ACP hingga binding ditutup, tidak difokuskan, direset, atau kedaluwarsa.
    - Perintah Gateway tetap lokal. `/acp ...`, `/status`, dan `/unfocus` tidak pernah dikirim sebagai teks prompt biasa ke harness ACP yang terikat.
    - `cancel` membatalkan giliran aktif saat backend mendukung pembatalan; itu tidak menghapus metadata binding atau sesi.
    - `close` mengakhiri sesi ACP dari sudut pandang OpenClaw dan menghapus binding. Harness mungkin tetap menyimpan riwayat upstream miliknya sendiri jika mendukung resume.
    - Plugin acpx membersihkan pohon proses wrapper dan adapter milik OpenClaw setelah `close`, dan menuai yatim ACPX milik OpenClaw yang basi saat startup Gateway.
    - Worker runtime idle memenuhi syarat untuk dibersihkan setelah `acp.runtime.ttlMinutes`; metadata sesi yang tersimpan tetap tersedia untuk `/acp sessions`.

  </Accordion>
  <Accordion title="Aturan routing Codex native">
    Pemicu bahasa alami yang harus diarahkan ke **Plugin Codex native**
    saat diaktifkan:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Ikatan percakapan Codex native adalah jalur kontrol chat default.
    Alat dinamis OpenClaw tetap dijalankan melalui OpenClaw, sementara
    alat Codex-native seperti shell/apply-patch dijalankan di dalam Codex.
    Untuk event alat Codex-native, OpenClaw menyuntikkan relay hook native
    per giliran agar hook Plugin dapat memblokir `before_tool_call`, mengamati
    `after_tool_call`, dan merutekan event Codex `PermissionRequest`
    melalui persetujuan OpenClaw. Hook Codex `Stop` direlay ke
    OpenClaw `before_agent_finalize`, tempat Plugin dapat meminta satu
    pass model tambahan sebelum Codex memfinalisasi jawabannya. Relay ini tetap
    sengaja konservatif: ia tidak mengubah argumen alat Codex-native
    atau menulis ulang rekaman thread Codex. Gunakan ACP eksplisit hanya
    ketika Anda menginginkan model runtime/sesi ACP. Batas dukungan Codex
    tertanam didokumentasikan dalam
    [kontrak dukungan harness Codex v1](/id/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Ringkasan pemilihan model / provider / runtime">
    - `openai-codex/*` - rute model OAuth/langganan Codex lama yang diperbaiki oleh doctor.
    - `openai/*` - runtime tertanam app-server Codex native untuk giliran agen OpenAI.
    - `/codex ...` - kontrol percakapan Codex native.
    - `/acp ...` atau `runtime: "acp"` - kontrol ACP/acpx eksplisit.

  </Accordion>
  <Accordion title="Pemicu bahasa alami perutean ACP">
    Pemicu yang harus dirutekan ke runtime ACP:

    - "Jalankan ini sebagai sesi ACP Claude Code sekali jalan dan ringkas hasilnya."
    - "Gunakan Gemini CLI untuk tugas ini dalam sebuah thread, lalu pertahankan tindak lanjut di thread yang sama."
    - "Jalankan Codex melalui ACP dalam thread latar belakang."

    OpenClaw memilih `runtime: "acp"`, menyelesaikan `agentId` harness,
    mengikat ke percakapan atau thread saat ini jika didukung, dan
    merutekan tindak lanjut ke sesi tersebut sampai ditutup/kedaluwarsa. Codex hanya
    mengikuti jalur ini ketika ACP/acpx eksplisit atau Plugin Codex native
    tidak tersedia untuk operasi yang diminta.

    Untuk `sessions_spawn`, `runtime: "acp"` diiklankan hanya ketika ACP
    diaktifkan, peminta tidak di-sandbox, dan backend runtime ACP
    dimuat. `acp.dispatch.enabled=false` menjeda dispatch thread ACP
    otomatis tetapi tidak menyembunyikan atau memblokir pemanggilan eksplisit
    `sessions_spawn({ runtime: "acp" })`. Ini menargetkan id harness ACP seperti `codex`,
    `claude`, `droid`, `gemini`, atau `opencode`. Jangan meneruskan id agen
    konfigurasi OpenClaw normal dari `agents_list` kecuali entri tersebut
    dikonfigurasi secara eksplisit dengan `agents.list[].runtime.type="acp"`;
    jika tidak, gunakan runtime sub-agen default. Ketika agen OpenClaw
    dikonfigurasi dengan `runtime.type="acp"`, OpenClaw menggunakan
    `runtime.acp.agent` sebagai id harness yang mendasarinya.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agen

Gunakan ACP ketika Anda menginginkan runtime harness eksternal. Gunakan **app-server Codex
native** untuk ikatan/kontrol percakapan Codex ketika Plugin `codex`
diaktifkan. Gunakan **sub-agen** ketika Anda menginginkan run delegasi
native OpenClaw.

| Area          | Sesi ACP                              | Run sub-agen                       |
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

ACP Claude adalah **sesi harness** dengan kontrol ACP, pelanjutan sesi,
pelacakan tugas latar belakang, dan ikatan percakapan/thread opsional.

Backend CLI adalah runtime fallback lokal hanya teks yang terpisah - lihat
[Backend CLI](/id/gateway/cli-backends).

Untuk operator, aturan praktisnya adalah:

- **Ingin `/acp spawn`, sesi yang dapat diikat, kontrol runtime, atau pekerjaan harness persisten?** Gunakan ACP.
- **Ingin fallback teks lokal sederhana melalui CLI mentah?** Gunakan backend CLI.

## Sesi terikat

### Model mental

- **Permukaan chat** - tempat orang terus berbicara (channel Discord, topik Telegram, chat iMessage).
- **Sesi ACP** - state runtime Codex/Claude/Gemini tahan lama yang dirutekan OpenClaw.
- **Thread/topik anak** - permukaan pesan tambahan opsional yang dibuat hanya oleh `--thread ...`.
- **Workspace runtime** - lokasi sistem file (`cwd`, checkout repo, workspace backend) tempat harness berjalan. Independen dari permukaan chat.

### Ikatan percakapan saat ini

`/acp spawn <harness> --bind here` menyematkan percakapan saat ini ke
sesi ACP yang di-spawn - tanpa thread anak, permukaan chat yang sama. OpenClaw tetap
memiliki transport, auth, keselamatan, dan pengiriman. Pesan tindak lanjut di
percakapan tersebut dirutekan ke sesi yang sama; `/new` dan `/reset` mereset
sesi di tempat; `/acp close` menghapus ikatan.

Contoh:

```text
/codex bind                                              # ikatan Codex native, rutekan pesan mendatang ke sini
/codex model gpt-5.4                                     # sesuaikan thread Codex native yang terikat
/codex stop                                              # kontrol giliran Codex native aktif
/acp spawn codex --bind here                             # fallback ACP eksplisit untuk Codex
/acp spawn codex --thread auto                           # dapat membuat thread/topik anak dan mengikat di sana
/acp spawn codex --bind here --cwd /workspace/repo       # ikatan chat yang sama, Codex berjalan di /workspace/repo
```

<AccordionGroup>
  <Accordion title="Aturan ikatan dan eksklusivitas">
    - `--bind here` dan `--thread ...` saling eksklusif.
    - `--bind here` hanya berfungsi pada channel yang mengiklankan ikatan percakapan saat ini; OpenClaw mengembalikan pesan tidak didukung yang jelas jika tidak. Ikatan tetap bertahan melewati restart gateway.
    - Di Discord, `spawnSessions` mengatur pembuatan thread anak untuk `--thread auto|here` - bukan `--bind here`.
    - Jika Anda melakukan spawn ke agen ACP berbeda tanpa `--cwd`, OpenClaw mewarisi workspace **agen target** secara default. Path warisan yang hilang (`ENOENT`/`ENOTDIR`) fallback ke default backend; error akses lain (misalnya `EACCES`) muncul sebagai error spawn.
    - Perintah manajemen Gateway tetap lokal di percakapan terikat - perintah `/acp ...` ditangani oleh OpenClaw bahkan ketika teks tindak lanjut normal dirutekan ke sesi ACP terikat; `/status` dan `/unfocus` juga tetap lokal setiap kali penanganan perintah diaktifkan untuk permukaan tersebut.

  </Accordion>
  <Accordion title="Sesi terikat thread">
    Ketika ikatan thread diaktifkan untuk adapter channel:

    - OpenClaw mengikat thread ke sesi ACP target.
    - Pesan tindak lanjut di thread tersebut dirutekan ke sesi ACP yang terikat.
    - Output ACP dikirim kembali ke thread yang sama.
    - Unfocus/tutup/arsip/idle-timeout atau kedaluwarsa usia maksimum menghapus ikatan.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, dan `/unfocus` adalah perintah Gateway, bukan prompt ke harness ACP.

    Feature flag yang diperlukan untuk ACP terikat thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` aktif secara default (atur `false` untuk menjeda dispatch thread ACP otomatis; pemanggilan eksplisit `sessions_spawn({ runtime: "acp" })` tetap berfungsi).
    - Spawn sesi thread adapter channel diaktifkan (default: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Dukungan ikatan thread bersifat spesifik adapter. Jika adapter channel
    aktif tidak mendukung ikatan thread, OpenClaw mengembalikan pesan
    tidak didukung/tidak tersedia yang jelas.

  </Accordion>
  <Accordion title="Channel yang mendukung thread">
    - Adapter channel apa pun yang mengekspos kapabilitas ikatan sesi/thread.
    - Dukungan bawaan saat ini: thread/channel **Discord**, topik **Telegram** (topik forum di grup/supergrup dan topik DM).
    - Channel Plugin dapat menambahkan dukungan melalui antarmuka ikatan yang sama.

  </Accordion>
</AccordionGroup>

## Ikatan channel persisten

Untuk workflow non-ephemeral, konfigurasikan ikatan ACP persisten dalam
entri `bindings[]` tingkat atas.

### Model ikatan

<ParamField path="bindings[].type" type='"acp"'>
  Menandai ikatan percakapan ACP persisten.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Mengidentifikasi percakapan target. Bentuk per channel:

- **Channel/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Channel/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Utamakan id Slack yang stabil; ikatan channel juga mencocokkan balasan di dalam thread channel tersebut.
- **Topik forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grup iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Utamakan `chat_id:*` untuk ikatan grup yang stabil.

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
- `agents.list[].runtime.acp.agent` (id harness, misalnya `codex` atau `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Presedensi override untuk sesi terikat ACP:**

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

- OpenClaw memastikan sesi ACP yang dikonfigurasi ada sebelum digunakan.
- Pesan di channel atau topik tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan terikat, `/new` dan `/reset` mereset kunci sesi ACP yang sama di tempat.
- Pengikatan runtime sementara (misalnya yang dibuat oleh alur fokus-thread) tetap berlaku jika ada.
- Untuk pemunculan ACP lintas-agen tanpa `cwd` eksplisit, OpenClaw mewarisi ruang kerja agen target dari konfigurasi agen.
- Jalur ruang kerja warisan yang hilang kembali ke cwd default backend; kegagalan akses yang tidak hilang dimunculkan sebagai error spawn.

## Mulai sesi ACP

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
    `acp.defaultAgent` jika dikonfigurasi. `mode: "session"` memerlukan
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
  Harus `"acp"` untuk sesi ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Id harness target ACP. Kembali ke `acp.defaultAgent` jika ditetapkan.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Meminta alur pengikatan thread jika didukung.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` bersifat sekali jalan; `"session"` bersifat persisten. Jika `thread: true` dan
  `mode` dihilangkan, OpenClaw dapat menggunakan perilaku persisten secara default sesuai
  jalur runtime. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime).
  Jika dihilangkan, spawn ACP mewarisi ruang kerja agen target
  saat dikonfigurasi; jalur warisan yang hilang kembali ke default
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
  `streamLogPath` yang menunjuk ke log JSONL dengan cakupan sesi
  (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk riwayat relay lengkap.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Membatalkan giliran child ACP setelah N detik. `0` mempertahankan giliran pada
  jalur tanpa-timeout milik Gateway. Nilai yang sama diterapkan ke run Gateway
  dan runtime ACP sehingga harness yang macet/kehabisan kuota tidak
  menempati lane agen parent tanpa batas.
</ParamField>
<ParamField path="model" type="string">
  Override model eksplisit untuk sesi child ACP. Spawn Codex ACP
  menormalkan ref OpenClaw Codex seperti `openai-codex/gpt-5.4` ke konfigurasi
  startup Codex ACP sebelum `session/new`; bentuk slash seperti
  `openai-codex/gpt-5.4/high` juga menetapkan upaya reasoning Codex ACP.
  Harness lain harus mengiklankan ACP `models` dan mendukung
  `session/set_model`; jika tidak, OpenClaw/acpx gagal secara jelas alih-alih
  diam-diam kembali ke default agen target.
</ParamField>
<ParamField path="thinking" type="string">
  Upaya thinking/reasoning eksplisit. Untuk Codex ACP, `minimal` dipetakan ke
  upaya rendah, `low`/`medium`/`high`/`xhigh` dipetakan langsung, dan `off`
  menghilangkan override startup reasoning-effort.
</ParamField>

## Mode pengikatan spawn dan thread

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Perilaku                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
    | `off`  | Jangan buat pengikatan percakapan-saat-ini.                          |

    Catatan:

    - `--bind here` adalah jalur operator paling sederhana untuk "jadikan channel atau chat ini didukung Codex."
    - `--bind here` tidak membuat thread child.
    - `--bind here` hanya tersedia pada channel yang mengekspos dukungan pengikatan percakapan-saat-ini.
    - `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Perilaku                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Dalam thread aktif: ikat thread tersebut. Di luar thread: buat/ikat thread child jika didukung. |
    | `here` | Wajib ada thread aktif saat ini; gagal jika tidak berada di dalamnya.                                                  |
    | `off`  | Tidak ada pengikatan. Sesi dimulai tanpa ikatan.                                                                 |

    Catatan:

    - Pada permukaan pengikatan non-thread, perilaku default secara efektif adalah `off`.
    - Spawn terikat-thread memerlukan dukungan kebijakan channel:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gunakan `--bind here` saat Anda ingin menyematkan percakapan saat ini tanpa membuat thread child.

  </Tab>
</Tabs>

## Model pengiriman

Sesi ACP dapat berupa ruang kerja interaktif atau pekerjaan latar belakang
milik parent. Jalur pengiriman bergantung pada bentuk tersebut.

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

    - Follow-up terikat normal dikirim sebagai teks prompt, plus lampiran hanya ketika harness/backend mendukungnya.
    - Perintah manajemen `/acp` dan perintah Gateway lokal diintersepsi sebelum dispatch ACP.
    - Event penyelesaian yang dihasilkan runtime diwujudkan per target. Agen OpenClaw mendapatkan envelope runtime-context internal OpenClaw; harness ACP eksternal mendapatkan prompt biasa dengan hasil child dan instruksi. Envelope mentah `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` tidak boleh pernah dikirim ke harness eksternal atau dipersistenkan sebagai teks transkrip pengguna ACP.
    - Entri transkrip ACP menggunakan teks pemicu yang terlihat oleh pengguna atau prompt penyelesaian biasa. Metadata event internal tetap terstruktur di OpenClaw jika memungkinkan dan tidak diperlakukan sebagai konten chat yang ditulis pengguna.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Sesi ACP sekali jalan yang dimunculkan oleh run agen lain adalah child
    latar belakang, mirip dengan sub-agen:

    - Parent meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Child berjalan dalam sesi harness ACP-nya sendiri.
    - Giliran child berjalan pada lane latar belakang yang sama yang digunakan oleh spawn sub-agen native, sehingga harness ACP yang lambat tidak memblokir pekerjaan main-session yang tidak terkait.
    - Laporan penyelesaian kembali melalui jalur pengumuman penyelesaian tugas. OpenClaw mengonversi metadata penyelesaian internal menjadi prompt ACP biasa sebelum mengirimnya ke harness eksternal, sehingga harness tidak melihat marker konteks runtime khusus OpenClaw.
    - Parent menulis ulang hasil child dengan suara asisten normal saat balasan yang terlihat pengguna berguna.

    Jangan perlakukan jalur ini sebagai chat peer-to-peer antara parent
    dan child. Child sudah memiliki channel penyelesaian kembali ke
    parent.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` dapat menargetkan sesi lain setelah spawn. Untuk sesi
    peer normal, OpenClaw menggunakan jalur follow-up agent-to-agent (A2A)
    setelah menyuntikkan pesan:

    - Tunggu balasan sesi target.
    - Opsional, biarkan peminta dan target bertukar sejumlah giliran follow-up yang dibatasi.
    - Minta target menghasilkan pesan pengumuman.
    - Kirim pengumuman tersebut ke channel atau thread yang terlihat.

    Jalur A2A tersebut adalah fallback untuk pengiriman peer saat pengirim membutuhkan
    follow-up yang terlihat. Jalur ini tetap aktif ketika sesi yang tidak terkait dapat
    melihat dan mengirim pesan ke target ACP, misalnya di bawah pengaturan
    `tools.sessions.visibility` yang luas.

    OpenClaw melewati follow-up A2A hanya ketika peminta adalah
    parent dari child ACP sekali jalan milik parent itu sendiri. Dalam kasus tersebut,
    menjalankan A2A di atas penyelesaian tugas dapat membangunkan parent dengan
    hasil child, meneruskan balasan parent kembali ke child, dan
    membuat loop gema parent/child. Hasil `sessions_send` melaporkan
    `delivery.status="skipped"` untuk kasus owned-child tersebut karena
    jalur penyelesaian sudah bertanggung jawab atas hasilnya.

  </Accordion>
  <Accordion title="Resume an existing session">
    Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih
    memulai dari awal. Agen memutar ulang riwayat percakapannya melalui
    `session/load`, sehingga ia melanjutkan dengan konteks penuh dari yang terjadi sebelumnya.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Kasus penggunaan umum:

    - Alihkan sesi Codex dari laptop Anda ke ponsel Anda - beri tahu agen Anda untuk melanjutkan dari tempat Anda berhenti.
    - Lanjutkan sesi coding yang Anda mulai secara interaktif di CLI, kini secara headless melalui agen Anda.
    - Lanjutkan pekerjaan yang terputus oleh restart gateway atau timeout idle.

    Catatan:

    - `resumeSessionId` hanya berlaku ketika `runtime: "acp"`; runtime sub-agen default mengabaikan field khusus ACP ini.
    - `streamTo` hanya berlaku ketika `runtime: "acp"`; runtime sub-agen default mengabaikan field khusus ACP ini.
    - `resumeSessionId` adalah id resume ACP/harness host-local, bukan kunci sesi channel OpenClaw; OpenClaw tetap memeriksa kebijakan spawn ACP dan kebijakan agen target sebelum dispatch, sedangkan backend atau harness ACP memiliki otorisasi untuk memuat id upstream tersebut.
    - `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal untuk sesi OpenClaw baru yang Anda buat, sehingga `mode: "session"` tetap memerlukan `thread: true`.
    - Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
    - Jika id sesi tidak ditemukan, spawn gagal dengan error yang jelas - tanpa fallback diam-diam ke sesi baru.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Setelah deploy gateway, jalankan pemeriksaan end-to-end live alih-alih
    memercayai unit test:

    1. Verifikasi versi Gateway yang diterapkan dan commit pada host target.
    2. Buka sesi jembatan ACPX sementara ke agen aktif.
    3. Minta agen tersebut memanggil `sessions_spawn` dengan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, dan tugas `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifikasi `accepted=yes`, `childSessionKey` yang nyata, dan tidak ada galat validator.
    5. Bersihkan sesi jembatan sementara.

    Pertahankan gate pada `mode: "run"` dan lewati `streamTo: "parent"` -
    jalur `mode: "session"` yang terikat thread dan relai-stream adalah
    lintasan integrasi terpisah yang lebih kaya.

  </Accordion>
</AccordionGroup>

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, **bukan** di dalam
sandbox OpenClaw.

<Warning>
**Batas keamanan:**

- Harness eksternal dapat membaca/menulis sesuai izin CLI miliknya sendiri dan `cwd` yang dipilih.
- Kebijakan sandbox OpenClaw **tidak** membungkus eksekusi harness ACP.
- OpenClaw tetap memberlakukan gate fitur ACP, agen yang diizinkan, kepemilikan sesi, pengikatan kanal, dan kebijakan pengiriman Gateway.
- Gunakan `runtime: "subagent"` untuk pekerjaan native OpenClaw yang diberlakukan sandbox.

</Warning>

Batasan saat ini:

- Jika sesi pemohon berada dalam sandbox, spawn ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.

## Resolusi target sesi

Sebagian besar tindakan `/acp` menerima target sesi opsional (`session-key`,
`session-id`, atau `session-label`).

**Urutan resolusi:**

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - mencoba kunci
   - lalu id sesi berbentuk UUID
   - lalu label
2. Pengikatan thread saat ini (jika percakapan/thread ini terikat ke sesi ACP).
3. Fallback sesi pemohon saat ini.

Pengikatan percakapan saat ini dan pengikatan thread sama-sama berpartisipasi dalam
langkah 2.

Jika tidak ada target yang berhasil diresolusikan, OpenClaw mengembalikan galat yang jelas
(`Unable to resolve session target: ...`).

## Kontrol ACP

| Perintah             | Yang dilakukannya                                       | Contoh                                                        |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Buat sesi ACP; opsional ikatan saat ini atau ikatan thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Batalkan giliran yang sedang berjalan untuk sesi target. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Kirim instruksi steer ke sesi yang sedang berjalan.     | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Tutup sesi dan lepaskan ikatan target thread.           | `/acp close`                                                  |
| `/acp status`        | Tampilkan backend, mode, status, opsi runtime, kapabilitas. | `/acp status`                                                 |
| `/acp set-mode`      | Atur mode runtime untuk sesi target.                    | `/acp set-mode plan`                                          |
| `/acp set`           | Tulis opsi konfigurasi runtime generik.                 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Atur override direktori kerja runtime.                  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Atur profil kebijakan persetujuan.                      | `/acp permissions strict`                                     |
| `/acp timeout`       | Atur batas waktu runtime (detik).                       | `/acp timeout 120`                                            |
| `/acp model`         | Atur override model runtime.                            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Hapus override opsi runtime sesi.                       | `/acp reset-options`                                          |
| `/acp sessions`      | Cantumkan sesi ACP terbaru dari penyimpanan.            | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kapabilitas, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                                 |
| `/acp install`       | Cetak langkah instalasi dan pengaktifan deterministik.  | `/acp install`                                                |

`/acp status` menampilkan opsi runtime efektif beserta pengidentifikasi sesi tingkat runtime dan
tingkat backend. Galat kontrol yang tidak didukung muncul
dengan jelas ketika backend tidak memiliki suatu kapabilitas. `/acp sessions` membaca
penyimpanan untuk sesi terikat saat ini atau sesi pemohon; token target
(`session-key`, `session-id`, atau `session-label`) diresolusikan melalui
penemuan sesi Gateway, termasuk root `session.store` kustom per agen.

### Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik. Operasi yang
setara:

| Perintah                     | Dipetakan ke                         | Catatan                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | kunci konfigurasi runtime `model`    | Untuk Codex ACP, OpenClaw menormalkan `openai-codex/<model>` menjadi id model adapter dan memetakan sufiks penalaran slash seperti `openai-codex/gpt-5.4/high` ke `reasoning_effort`.                    |
| `/acp set thinking <level>`  | opsi kanonis `thinking`              | OpenClaw mengirim padanan yang diiklankan backend ketika ada, dengan preferensi `thinking`, lalu `effort`, `reasoning_effort`, atau `thought_level`. Untuk Codex ACP, adapter memetakan nilai ke `reasoning_effort`. |
| `/acp permissions <profile>` | opsi kanonis `permissionProfile`     | OpenClaw mengirim padanan yang diiklankan backend ketika ada, seperti `approval_policy`, `permission_profile`, `permissions`, atau `permission_mode`.                                                     |
| `/acp timeout <seconds>`     | opsi kanonis `timeoutSeconds`        | OpenClaw mengirim padanan yang diiklankan backend ketika ada, seperti `timeout` atau `timeout_seconds`.                                                                                                    |
| `/acp cwd <path>`            | override cwd runtime                 | Pembaruan langsung.                                                                                                                                                                                        |
| `/acp set <key> <value>`     | generik                              | `key=cwd` menggunakan jalur override cwd.                                                                                                                                                                  |
| `/acp reset-options`         | menghapus semua override runtime     | -                                                                                                                                                                                                          |

## Harness acpx, penyiapan Plugin, dan izin

Untuk konfigurasi harness acpx (alias Claude Code / Codex / Gemini CLI),
jembatan MCP plugin-tools dan OpenClaw-tools, serta mode izin ACP, lihat
[Agen ACP - penyiapan](/id/tools/acp-agents-setup).

## Pemecahan masalah

| Gejala                                                                     | Kemungkinan penyebab                                                                                                           | Perbaikan                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang, dinonaktifkan, atau diblokir oleh `plugins.allow`.                                                       | Instal dan aktifkan Plugin backend, sertakan `acpx` dalam `plugins.allow` saat allowlist tersebut diatur, lalu jalankan `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                                                                 | Atur `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch otomatis dari pesan thread normal dinonaktifkan.                                                               | Atur `acp.dispatch.enabled=true` untuk melanjutkan routing thread otomatis; panggilan eksplisit `sessions_spawn({ runtime: "acp" })` tetap berfungsi.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agen tidak ada dalam allowlist.                                                                                                | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` melaporkan backend belum siap tepat setelah startup                 | Plugin backend hilang, dinonaktifkan, diblokir oleh kebijakan allow/deny, atau executable yang dikonfigurasi tidak tersedia.        | Instal/aktifkan Plugin backend, jalankan ulang `/acp doctor`, dan periksa error instalasi backend atau kebijakan jika tetap tidak sehat.                                           |
| Perintah harness tidak ditemukan                                                   | CLI adapter tidak terinstal, Plugin eksternal hilang, atau pengambilan `npx` saat pertama kali dijalankan gagal untuk adapter non-Codex. | Jalankan `/acp doctor`, instal/prahangatkan adapter di host Gateway, atau konfigurasikan perintah agen acpx secara eksplisit.                                                      |
| Model-tidak-ditemukan dari harness                                            | Id model valid untuk provider/harness lain tetapi bukan target ACP ini.                                                | Gunakan model yang dicantumkan oleh harness tersebut, konfigurasikan model dalam harness, atau hilangkan override.                                                                            |
| Error auth vendor dari harness                                          | OpenClaw sehat, tetapi CLI/provider target belum login.                                                     | Login atau sediakan kunci provider yang diperlukan pada environment host Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token kunci/id/label buruk.                                                                                                | Jalankan `/acp sessions`, salin kunci/label persis, coba lagi.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang dapat di-bind.                                                            | Pindah ke chat/channel target dan coba lagi, atau gunakan spawn tanpa bind.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter tidak memiliki kapabilitas binding ACP percakapan saat ini.                                                             | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` tingkat atas, atau pindah ke channel yang didukung.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks thread.                                                                         | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target binding aktif.                                                                           | Bind ulang sebagai pemilik atau gunakan percakapan atau thread lain.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adapter tidak memiliki kapabilitas binding thread.                                                                               | Gunakan `--thread off` atau pindah ke adapter/channel yang didukung.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.                                                              | Gunakan `runtime="subagent"` dari sesi dalam sandbox, atau jalankan spawn ACP dari sesi non-sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                                                         | Gunakan `runtime="subagent"` untuk sandboxing wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi non-sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Harness target tidak mengekspos pengalihan model ACP generik.                                                        | Gunakan harness yang mengiklankan ACP `models`/`session/set_model`, gunakan ref model ACP Codex, atau konfigurasikan model langsung dalam harness jika memiliki flag startup sendiri. |
| Metadata ACP hilang untuk sesi yang ter-bind                                      | Metadata sesi ACP basi/terhapus.                                                                                    | Buat ulang dengan `/acp spawn`, lalu bind ulang/fokuskan thread.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir penulisan/exec dalam sesi ACP non-interaktif.                                                    | Atur `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan mulai ulang gateway. Lihat [Konfigurasi izin](/id/tools/acp-agents-setup#permission-configuration). |
| Sesi ACP gagal lebih awal dengan output sedikit                                  | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.                                        | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, atur `permissionMode=approve-all`; untuk degradasi yang halus, atur `nonInteractivePermissions=deny`.        |
| Sesi ACP berhenti tanpa batas setelah menyelesaikan pekerjaan                       | Proses harness selesai tetapi sesi ACP tidak melaporkan penyelesaian.                                                    | Perbarui OpenClaw; pembersihan acpx saat ini membersihkan proses wrapper dan adapter basi milik OpenClaw saat ditutup dan saat startup Gateway.                                             |
| Harness melihat `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Envelope event internal bocor melewati batas ACP.                                                                | Perbarui OpenClaw dan jalankan ulang alur penyelesaian; harness eksternal seharusnya hanya menerima prompt penyelesaian polos.                                                          |

## Terkait

- [Agen ACP - penyiapan](/id/tools/acp-agents-setup)
- [Kirim agen](/id/tools/agent-send)
- [Backend CLI](/id/gateway/cli-backends)
- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode bridge)](/id/cli/acp)
- [Sub-agen](/id/tools/subagents)
