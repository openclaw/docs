---
read_when:
    - Menjalankan kerangka pengodean melalui ACP
    - Menyiapkan sesi ACP terikat percakapan di saluran perpesanan
    - Mengaitkan percakapan saluran pesan ke sesi ACP persisten
    - Memecahkan masalah backend ACP, penghubungan Plugin, atau pengiriman penyelesaian
    - Mengoperasikan perintah /acp dari obrolan
sidebarTitle: ACP agents
summary: Jalankan harness pengodean eksternal (Claude Code, Cursor, Gemini CLI, Codex ACP eksplisit, OpenClaw ACP, OpenCode) melalui backend ACP
title: Agen ACP
x-i18n:
    generated_at: "2026-05-02T09:33:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sesi
memungkinkan OpenClaw menjalankan harness pengodean eksternal (misalnya Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX
lain yang didukung) melalui plugin backend ACP.

Setiap spawn sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

<Note>
**ACP adalah jalur harness eksternal, bukan jalur Codex default.** Plugin
app-server Codex native memiliki kontrol `/codex ...` dan runtime tertanam
`agentRuntime.id: "codex"`; ACP memiliki kontrol
`/acp ...` dan sesi `sessions_spawn({ runtime: "acp" })`.

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal
langsung ke percakapan channel OpenClaw yang sudah ada, gunakan
[`openclaw mcp serve`](/id/cli/mcp), bukan ACP.
</Note>

## Halaman mana yang saya perlukan?

| Anda ingin…                                                                                    | Gunakan ini                           | Catatan                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mengikat atau mengontrol Codex dalam percakapan saat ini                                       | `/codex bind`, `/codex threads`       | Jalur app-server Codex native saat plugin `codex` diaktifkan; mencakup balasan chat terikat, penerusan gambar, model/cepat/izin, stop, dan kontrol steer. ACP adalah fallback eksplisit |
| Menjalankan Claude Code, Gemini CLI, Codex ACP eksplisit, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini                           | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime                                                                                |
| Mengekspos sesi Gateway OpenClaw _sebagai_ server ACP untuk editor atau klien                  | [`openclaw acp`](/id/cli/acp)            | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                                                                                                    |
| Menggunakan ulang CLI AI lokal sebagai model fallback hanya teks                               | [Backend CLI](/id/gateway/cli-backends) | Bukan ACP. Tidak ada alat OpenClaw, tidak ada kontrol ACP, tidak ada runtime harness                                                                                                        |

## Apakah ini langsung berfungsi?

Ya, setelah menginstal plugin runtime ACP resmi:

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
`sessions_spawn` tetap disembunyikan agar agen tidak menyarankan backend yang
tidak tersedia.

<AccordionGroup>
  <Accordion title="Kendala saat menjalankan pertama kali">
    - Jika `plugins.allow` disetel, itu adalah inventaris plugin yang membatasi dan **harus** menyertakan `acpx`; jika tidak, backend ACP yang terinstal sengaja diblokir dan `/acp doctor` melaporkan entri allowlist yang hilang.
    - Adapter ACP Codex dipentaskan dengan plugin `acpx` dan diluncurkan secara lokal jika memungkinkan.
    - Adapter harness target lain mungkin masih diambil sesuai permintaan dengan `npx` saat pertama kali Anda menggunakannya.
    - Autentikasi vendor tetap harus ada di host untuk harness tersebut.
    - Jika host tidak memiliki npm atau akses jaringan, pengambilan adapter pertama kali gagal sampai cache dipanaskan lebih dulu atau adapter diinstal dengan cara lain.

  </Accordion>
  <Accordion title="Prasyarat runtime">
    ACP meluncurkan proses harness eksternal nyata. OpenClaw memiliki routing,
    status tugas latar belakang, pengiriman, binding, dan kebijakan; harness
    memiliki login providernya, katalog model, perilaku sistem berkas, dan
    alat native.

    Sebelum menyalahkan OpenClaw, verifikasi:

    - `/acp doctor` melaporkan backend yang aktif dan sehat.
    - ID target diizinkan oleh `acp.allowedAgents` saat allowlist tersebut disetel.
    - Perintah harness dapat dimulai di host Gateway.
    - Autentikasi provider tersedia untuk harness tersebut (`claude`, `codex`, `gemini`, `opencode`, `droid`, dll.).
    - Model yang dipilih ada untuk harness tersebut — ID model tidak portabel antar-harness.
    - `cwd` yang diminta ada dan dapat diakses, atau hilangkan `cwd` dan biarkan backend menggunakan default-nya.
    - Mode izin sesuai dengan pekerjaannya. Sesi noninteraktif tidak dapat mengeklik prompt izin native, jadi run pengodean yang berat tulis/eksekusi biasanya memerlukan profil izin ACPX yang dapat berjalan tanpa pengawasan.

  </Accordion>
</AccordionGroup>

Alat plugin OpenClaw dan alat bawaan OpenClaw **tidak** diekspos ke
harness ACP secara default. Aktifkan bridge MCP eksplisit di
[Agen ACP — penyiapan](/id/tools/acp-agents-setup) hanya saat harness
harus memanggil alat tersebut secara langsung.

## Target harness yang didukung

Dengan backend `acpx`, gunakan ID harness ini sebagai target `/acp spawn <id>`
atau `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID harness | Backend tipikal                                | Catatan                                                                             |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter ACP Claude Code                        | Memerlukan autentikasi Claude Code di host.                                         |
| `codex`    | Adapter ACP Codex                              | Fallback ACP eksplisit hanya saat `/codex` native tidak tersedia atau ACP diminta. |
| `copilot`  | Adapter ACP GitHub Copilot                     | Memerlukan autentikasi CLI/runtime Copilot.                                         |
| `cursor`   | ACP Cursor CLI (`cursor-agent acp`)            | Timpa perintah acpx jika instalasi lokal mengekspos entrypoint ACP yang berbeda.   |
| `droid`    | Factory Droid CLI                              | Memerlukan autentikasi Factory/Droid atau `FACTORY_API_KEY` di lingkungan harness. |
| `gemini`   | Adapter ACP Gemini CLI                         | Memerlukan autentikasi Gemini CLI atau penyiapan kunci API.                         |
| `iflow`    | iFlow CLI                                      | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terinstal.          |
| `kilocode` | Kilo Code CLI                                  | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terinstal.          |
| `kimi`     | Kimi/Moonshot CLI                              | Memerlukan autentikasi Kimi/Moonshot di host.                                       |
| `kiro`     | Kiro CLI                                       | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terinstal.          |
| `opencode` | Adapter ACP OpenCode                           | Memerlukan autentikasi CLI/provider OpenCode.                                       |
| `openclaw` | Bridge Gateway OpenClaw melalui `openclaw acp` | Memungkinkan harness sadar-ACP berbicara kembali ke sesi Gateway OpenClaw.          |
| `pi`       | Runtime Pi/OpenClaw tertanam                   | Digunakan untuk eksperimen harness native OpenClaw.                                 |
| `qwen`     | Qwen Code / Qwen CLI                           | Memerlukan autentikasi kompatibel Qwen di host.                                     |

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
    Lanjutkan di percakapan atau thread yang terikat (atau targetkan kunci
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
  <Step title="Steer">
    Tanpa mengganti konteks: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Hentikan">
    `/acp cancel` (giliran saat ini) atau `/acp close` (sesi + binding).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detail siklus hidup">
    - Spawn membuat atau melanjutkan sesi runtime ACP, mencatat metadata ACP di penyimpanan sesi OpenClaw, dan dapat membuat tugas latar belakang saat run dimiliki induk.
    - Sesi ACP yang dimiliki induk diperlakukan sebagai pekerjaan latar belakang bahkan saat sesi runtime bersifat persisten; penyelesaian dan pengiriman lintas permukaan melewati notifier tugas induk, bukan bertindak seperti sesi chat normal yang menghadap pengguna.
    - Pemeliharaan tugas menutup sesi ACP one-shot yang terminal atau yatim dan dimiliki induk. Sesi ACP persisten dipertahankan selama binding percakapan aktif tetap ada; sesi persisten basi tanpa binding aktif ditutup agar tidak dapat dilanjutkan secara diam-diam setelah tugas pemilik selesai atau catatan tugasnya hilang.
    - Pesan tindak lanjut terikat langsung menuju sesi ACP sampai binding ditutup, tidak difokuskan, direset, atau kedaluwarsa.
    - Perintah Gateway tetap lokal. `/acp ...`, `/status`, dan `/unfocus` tidak pernah dikirim sebagai teks prompt normal ke harness ACP terikat.
    - `cancel` membatalkan giliran aktif saat backend mendukung pembatalan; ini tidak menghapus binding atau metadata sesi.
    - `close` mengakhiri sesi ACP dari sudut pandang OpenClaw dan menghapus binding. Harness masih dapat mempertahankan histori upstream-nya sendiri jika mendukung resume.
    - Worker runtime idle memenuhi syarat untuk dibersihkan setelah `acp.runtime.ttlMinutes`; metadata sesi tersimpan tetap tersedia untuk `/acp sessions`.

  </Accordion>
  <Accordion title="Aturan routing Codex native">
    Pemicu bahasa alami yang harus diarahkan ke **plugin Codex native**
    saat diaktifkan:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Binding percakapan Codex native adalah jalur kontrol chat default.
    Alat dinamis OpenClaw tetap dieksekusi melalui OpenClaw, sedangkan
    alat native Codex seperti shell/apply-patch dieksekusi di dalam Codex.
    Untuk event alat native Codex, OpenClaw menyuntikkan relay hook native
    per giliran agar hook plugin dapat memblokir `before_tool_call`, mengamati
    `after_tool_call`, dan merutekan event `PermissionRequest` Codex
    melalui persetujuan OpenClaw. Hook `Stop` Codex direlay ke
    `before_agent_finalize` OpenClaw, tempat plugin dapat meminta satu lagi
    lintasan model sebelum Codex memfinalisasi jawabannya. Relay ini tetap
    sengaja konservatif: relay tidak mengubah argumen alat native Codex
    atau menulis ulang catatan thread Codex. Gunakan ACP eksplisit hanya
    saat Anda menginginkan model runtime/sesi ACP. Batas dukungan Codex
    tertanam didokumentasikan dalam
    [kontrak dukungan harness Codex v1](/id/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Contekan pemilihan model / penyedia / runtime">
    - `openai-codex/*` — rute OAuth/langganan PI Codex.
    - `openai/*` ditambah `agentRuntime.id: "codex"` — runtime tertanam server aplikasi Codex native.
    - `/codex ...` — kontrol percakapan Codex native.
    - `/acp ...` atau `runtime: "acp"` — kontrol ACP/acpx eksplisit.

  </Accordion>
  <Accordion title="Pemicu bahasa alami perutean ACP">
    Pemicu yang seharusnya dirutekan ke runtime ACP:

    - "Jalankan ini sebagai sesi Claude Code ACP sekali jalan dan ringkas hasilnya."
    - "Gunakan Gemini CLI untuk tugas ini dalam sebuah thread, lalu pertahankan tindak lanjut di thread yang sama."
    - "Jalankan Codex melalui ACP di thread latar belakang."

    OpenClaw memilih `runtime: "acp"`, menyelesaikan harness `agentId`,
    mengikat ke percakapan atau thread saat ini bila didukung, dan
    merutekan tindak lanjut ke sesi tersebut hingga ditutup/kedaluwarsa. Codex hanya
    mengikuti jalur ini saat ACP/acpx eksplisit atau plugin Codex native
    tidak tersedia untuk operasi yang diminta.

    Untuk `sessions_spawn`, `runtime: "acp"` diiklankan hanya saat ACP
    diaktifkan, peminta tidak berada dalam sandbox, dan backend runtime
    ACP dimuat. `acp.dispatch.enabled=false` menjeda dispatch thread
    ACP otomatis tetapi tidak menyembunyikan atau memblokir panggilan
    `sessions_spawn({ runtime: "acp" })` eksplisit. Ini menargetkan id harness ACP seperti `codex`,
    `claude`, `droid`, `gemini`, atau `opencode`. Jangan meneruskan id agen
    konfigurasi OpenClaw normal dari `agents_list` kecuali entri tersebut
    dikonfigurasi secara eksplisit dengan `agents.list[].runtime.type="acp"`;
    jika tidak, gunakan runtime sub-agen default. Saat agen OpenClaw
    dikonfigurasi dengan `runtime.type="acp"`, OpenClaw menggunakan
    `runtime.acp.agent` sebagai id harness yang mendasarinya.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agen

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan **server aplikasi Codex
native** untuk pengikatan/kontrol percakapan Codex saat plugin `codex`
diaktifkan. Gunakan **sub-agen** saat Anda menginginkan eksekusi delegasi
native OpenClaw.

| Area          | Sesi ACP                              | Eksekusi sub-agen                  |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime sub-agen native OpenClaw   |
| Kunci sesi    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Perintah utama | `/acp ...`                           | `/subagents ...`                   |
| Alat spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agen](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, stack-nya adalah:

1. Bidang kontrol sesi ACP OpenClaw.
2. Plugin runtime resmi `@openclaw/acpx`.
3. Adapter ACP Claude.
4. Mekanisme runtime/sesi sisi Claude.

ACP Claude adalah **sesi harness** dengan kontrol ACP, pelanjutan sesi,
pelacakan tugas latar belakang, dan pengikatan percakapan/thread opsional.

Backend CLI adalah runtime fallback lokal teks-saja yang terpisah — lihat
[Backend CLI](/id/gateway/cli-backends).

Untuk operator, aturan praktisnya adalah:

- **Ingin `/acp spawn`, sesi yang dapat diikat, kontrol runtime, atau pekerjaan harness persisten?** Gunakan ACP.
- **Ingin fallback teks lokal sederhana melalui CLI mentah?** Gunakan backend CLI.

## Sesi terikat

### Model mental

- **Permukaan chat** — tempat orang terus berbicara (channel Discord, topik Telegram, chat iMessage).
- **Sesi ACP** — status runtime Codex/Claude/Gemini tahan lama yang dirutekan OpenClaw.
- **Thread/topik turunan** — permukaan pesan tambahan opsional yang dibuat hanya oleh `--thread ...`.
- **Workspace runtime** — lokasi sistem berkas (`cwd`, checkout repo, workspace backend) tempat harness berjalan. Independen dari permukaan chat.

### Ikatan percakapan saat ini

`/acp spawn <harness> --bind here` menyematkan percakapan saat ini ke
sesi ACP yang di-spawn — tanpa thread turunan, permukaan chat yang sama. OpenClaw tetap
mengendalikan transport, autentikasi, keamanan, dan pengiriman. Pesan tindak lanjut dalam
percakapan tersebut dirutekan ke sesi yang sama; `/new` dan `/reset` mereset
sesi di tempat; `/acp close` menghapus pengikatan.

Contoh:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Aturan dan eksklusivitas pengikatan">
    - `--bind here` dan `--thread ...` saling eksklusif.
    - `--bind here` hanya berfungsi pada channel yang mengiklankan pengikatan percakapan saat ini; OpenClaw mengembalikan pesan tidak didukung yang jelas jika tidak. Pengikatan bertahan melewati restart gateway.
    - Di Discord, `spawnSessions` mengatur pembuatan thread turunan untuk `--thread auto|here` — bukan `--bind here`.
    - Jika Anda spawn ke agen ACP lain tanpa `--cwd`, OpenClaw mewarisi workspace **agen target** secara default. Jalur warisan yang hilang (`ENOENT`/`ENOTDIR`) fallback ke default backend; kesalahan akses lain (mis. `EACCES`) muncul sebagai kesalahan spawn.
    - Perintah manajemen Gateway tetap lokal dalam percakapan terikat — perintah `/acp ...` ditangani oleh OpenClaw bahkan saat teks tindak lanjut normal dirutekan ke sesi ACP terikat; `/status` dan `/unfocus` juga tetap lokal setiap kali penanganan perintah diaktifkan untuk permukaan tersebut.

  </Accordion>
  <Accordion title="Sesi terikat thread">
    Saat pengikatan thread diaktifkan untuk adapter channel:

    - OpenClaw mengikat thread ke sesi ACP target.
    - Pesan tindak lanjut dalam thread tersebut dirutekan ke sesi ACP terikat.
    - Keluaran ACP dikirim kembali ke thread yang sama.
    - Unfocus/tutup/arsip/batas waktu idle atau kedaluwarsa usia maksimum menghapus pengikatan.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, dan `/unfocus` adalah perintah Gateway, bukan prompt ke harness ACP.

    Feature flag yang diperlukan untuk ACP terikat thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` aktif secara default (atur `false` untuk menjeda dispatch thread ACP otomatis; panggilan `sessions_spawn({ runtime: "acp" })` eksplisit tetap berfungsi).
    - Spawn sesi thread adapter channel diaktifkan (default: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Dukungan pengikatan thread bersifat khusus adapter. Jika adapter channel
    aktif tidak mendukung pengikatan thread, OpenClaw mengembalikan pesan
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
entri `bindings[]` level teratas.

### Model pengikatan

<ParamField path="bindings[].type" type='"acp"'>
  Menandai pengikatan percakapan ACP persisten.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Mengidentifikasi percakapan target. Bentuk per channel:

- **Channel/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Topik forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grup BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Lebih pilih `chat_id:*` atau `chat_identifier:*` untuk pengikatan grup yang stabil.
- **DM/grup iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Lebih pilih `chat_id:*` untuk pengikatan grup yang stabil.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Id agen OpenClaw pemilik.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Override ACP opsional.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Label opsional yang menghadap operator.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Direktori kerja runtime opsional.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Override backend opsional.
</ParamField>

### Default runtime per agen

Gunakan `agents.list[].runtime` untuk menetapkan default ACP sekali per agen:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, mis. `codex` atau `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Prioritas override untuk sesi terikat ACP:**

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

- OpenClaw memastikan sesi ACP yang dikonfigurasi ada sebelum digunakan.
- Pesan dalam channel atau topik tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan terikat, `/new` dan `/reset` mereset kunci sesi ACP yang sama di tempat.
- Pengikatan runtime sementara (misalnya dibuat oleh alur fokus thread) tetap berlaku saat ada.
- Untuk spawn ACP lintas agen tanpa `cwd` eksplisit, OpenClaw mewarisi workspace agen target dari konfigurasi agen.
- Jalur workspace warisan yang hilang fallback ke cwd default backend; kegagalan akses yang tidak hilang muncul sebagai kesalahan spawn.

## Memulai sesi ACP

Dua cara untuk memulai sesi ACP:

<Tabs>
  <Tab title="Dari sessions_spawn">
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
    `runtime` default ke `subagent`, jadi atur `runtime: "acp"` secara eksplisit
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
  Harus `"acp"` untuk sesi ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Id harness target ACP. Beralih ke `acp.defaultAgent` jika diatur.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Meminta alur pengikatan thread jika didukung.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` adalah sekali jalan; `"session"` bersifat persisten. Jika `thread: true` dan
  `mode` dihilangkan, OpenClaw dapat default ke perilaku persisten sesuai
  jalur runtime. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja runtime yang diminta (divalidasi oleh kebijakan
  backend/runtime). Jika dihilangkan, spawn ACP mewarisi workspace agen target
  saat dikonfigurasi; path warisan yang hilang beralih ke default
  backend, sedangkan kesalahan akses nyata dikembalikan.
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
  Membatalkan turn child ACP setelah N detik. `0` mempertahankan turn pada
  jalur tanpa timeout milik gateway. Nilai yang sama diterapkan ke run Gateway
  dan runtime ACP agar harness yang macet/kehabisan kuota tidak
  menempati lane agen parent tanpa batas.
</ParamField>
<ParamField path="model" type="string">
  Override model eksplisit untuk sesi child ACP. Spawn Codex ACP
  menormalisasi ref OpenClaw Codex seperti `openai-codex/gpt-5.4` ke konfigurasi
  startup Codex ACP sebelum `session/new`; bentuk slash seperti
  `openai-codex/gpt-5.4/high` juga mengatur upaya reasoning Codex ACP.
  Harness lain harus mengiklankan ACP `models` dan mendukung
  `session/set_model`; jika tidak, OpenClaw/acpx gagal secara jelas alih-alih
  diam-diam beralih ke default agen target.
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
    | `off`  | Jangan buat pengikatan percakapan saat ini.                          |

    Catatan:

    - `--bind here` adalah jalur operator paling sederhana untuk "jadikan channel atau chat ini didukung Codex."
    - `--bind here` tidak membuat thread child.
    - `--bind here` hanya tersedia pada channel yang mengekspos dukungan pengikatan percakapan saat ini.
    - `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Perilaku                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Dalam thread aktif: ikat thread tersebut. Di luar thread: buat/ikat thread child jika didukung. |
    | `here` | Wajib berada di thread aktif saat ini; gagal jika tidak berada di dalamnya.                                                  |
    | `off`  | Tanpa pengikatan. Sesi dimulai tanpa ikatan.                                                                 |

    Catatan:

    - Pada surface pengikatan non-thread, perilaku default secara efektif adalah `off`.
    - Spawn yang terikat thread memerlukan dukungan kebijakan channel:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gunakan `--bind here` saat Anda ingin menyematkan percakapan saat ini tanpa membuat thread child.

  </Tab>
</Tabs>

## Model pengiriman

Sesi ACP dapat berupa workspace interaktif atau pekerjaan latar belakang
milik parent. Jalur pengiriman bergantung pada bentuk tersebut.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Sesi interaktif dimaksudkan untuk terus berbicara pada surface chat
    yang terlihat:

    - `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
    - `/acp spawn ... --thread ...` mengikat thread/topik channel ke sesi ACP.
    - `bindings[].type="acp"` yang dikonfigurasi secara persisten merutekan percakapan yang cocok ke sesi ACP yang sama.

    Pesan lanjutan dalam percakapan terikat dirutekan langsung ke
    sesi ACP, dan output ACP dikirim kembali ke
    channel/thread/topik yang sama.

    Yang dikirim OpenClaw ke harness:

    - Follow-up terikat normal dikirim sebagai teks prompt, ditambah lampiran hanya saat harness/backend mendukungnya.
    - Perintah manajemen `/acp` dan perintah Gateway lokal dicegat sebelum dispatch ACP.
    - Event penyelesaian yang dihasilkan runtime dimaterialisasikan per target. Agen OpenClaw mendapatkan envelope runtime-context internal OpenClaw; harness ACP eksternal mendapatkan prompt biasa dengan hasil child dan instruksi. Envelope mentah `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` tidak boleh pernah dikirim ke harness eksternal atau dipersistenkan sebagai teks transkrip pengguna ACP.
    - Entri transkrip ACP menggunakan teks trigger yang terlihat oleh pengguna atau prompt penyelesaian biasa. Metadata event internal tetap terstruktur di OpenClaw jika memungkinkan dan tidak diperlakukan sebagai konten chat yang ditulis pengguna.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Sesi ACP sekali jalan yang di-spawn oleh run agen lain adalah child
    latar belakang, mirip dengan sub-agent:

    - Parent meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Child berjalan dalam sesi harness ACP-nya sendiri.
    - Turn child berjalan pada lane latar belakang yang sama dengan spawn sub-agent native, sehingga harness ACP yang lambat tidak memblokir pekerjaan sesi utama yang tidak terkait.
    - Laporan penyelesaian kembali melalui jalur pengumuman task-completion. OpenClaw mengonversi metadata penyelesaian internal menjadi prompt ACP biasa sebelum mengirimkannya ke harness eksternal, sehingga harness tidak melihat marker konteks runtime khusus OpenClaw.
    - Parent menulis ulang hasil child dalam suara asisten normal saat balasan yang terlihat pengguna berguna.

    Jangan perlakukan jalur ini sebagai chat peer-to-peer antara parent
    dan child. Child sudah memiliki channel penyelesaian kembali ke
    parent.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` dapat menargetkan sesi lain setelah spawn. Untuk sesi
    peer normal, OpenClaw menggunakan jalur follow-up agent-to-agent (A2A)
    setelah menyuntikkan pesan:

    - Tunggu balasan sesi target.
    - Secara opsional izinkan peminta dan target bertukar sejumlah turn follow-up yang dibatasi.
    - Minta target menghasilkan pesan pengumuman.
    - Kirim pengumuman tersebut ke channel atau thread yang terlihat.

    Jalur A2A tersebut adalah fallback untuk pengiriman peer saat pengirim membutuhkan
    follow-up yang terlihat. Jalur ini tetap aktif saat sesi yang tidak terkait dapat
    melihat dan mengirim pesan ke target ACP, misalnya di bawah pengaturan
    `tools.sessions.visibility` yang luas.

    OpenClaw melewati follow-up A2A hanya saat peminta adalah
    parent dari child ACP sekali jalan milik parent-nya sendiri. Dalam kasus itu,
    menjalankan A2A di atas penyelesaian task dapat membangunkan parent dengan
    hasil child, meneruskan balasan parent kembali ke child, dan
    membuat loop echo parent/child. Hasil `sessions_send` melaporkan
    `delivery.status="skipped"` untuk kasus owned-child tersebut karena
    jalur penyelesaian sudah bertanggung jawab atas hasilnya.

  </Accordion>
  <Accordion title="Resume an existing session">
    Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih
    memulai dari awal. Agen memutar ulang riwayat percakapannya melalui
    `session/load`, sehingga melanjutkan dengan konteks lengkap dari yang terjadi sebelumnya.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Kasus penggunaan umum:

    - Serahkan sesi Codex dari laptop Anda ke ponsel Anda — beri tahu agen Anda untuk melanjutkan dari posisi terakhir.
    - Lanjutkan sesi coding yang Anda mulai secara interaktif di CLI, sekarang secara headless melalui agen Anda.
    - Lanjutkan pekerjaan yang terputus oleh restart gateway atau timeout idle.

    Catatan:

    - `resumeSessionId` hanya berlaku saat `runtime: "acp"`; runtime sub-agent default mengabaikan field khusus ACP ini.
    - `streamTo` hanya berlaku saat `runtime: "acp"`; runtime sub-agent default mengabaikan field khusus ACP ini.
    - `resumeSessionId` adalah id resume ACP/harness lokal host, bukan kunci sesi channel OpenClaw; OpenClaw tetap memeriksa kebijakan spawn ACP dan kebijakan agen target sebelum dispatch, sedangkan backend atau harness ACP memiliki otorisasi untuk memuat id upstream tersebut.
    - `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal pada sesi OpenClaw baru yang Anda buat, jadi `mode: "session"` tetap memerlukan `thread: true`.
    - Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
    - Jika id sesi tidak ditemukan, spawn gagal dengan kesalahan yang jelas — tanpa fallback diam-diam ke sesi baru.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Setelah deploy gateway, jalankan pemeriksaan end-to-end live alih-alih
    mempercayai unit test:

    1. Verifikasi versi gateway yang di-deploy dan commit pada host target.
    2. Buka sesi bridge ACPX sementara ke agen live.
    3. Minta agen tersebut memanggil `sessions_spawn` dengan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, dan task `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifikasi `accepted=yes`, `childSessionKey` nyata, dan tidak ada kesalahan validator.
    5. Bersihkan sesi bridge sementara.

    Pertahankan gate pada `mode: "run"` dan lewati `streamTo: "parent"` —
    `mode: "session"` yang terikat thread dan jalur stream-relay adalah
    pass integrasi yang lebih kaya dan terpisah.

  </Accordion>
</AccordionGroup>

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, **bukan** di dalam
sandbox OpenClaw.

<Warning>
**Batas keamanan:**

- Harness eksternal dapat membaca/menulis sesuai izin CLI miliknya sendiri dan `cwd` yang dipilih.
- Kebijakan sandbox OpenClaw **tidak** membungkus eksekusi harness ACP.
- OpenClaw tetap memberlakukan gerbang fitur ACP, agen yang diizinkan, kepemilikan sesi, pengikatan saluran, dan kebijakan pengiriman Gateway.
- Gunakan `runtime: "subagent"` untuk pekerjaan native OpenClaw yang diberlakukan sandbox.

</Warning>

Batasan saat ini:

- Jika sesi peminta berada dalam sandbox, spawn ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` dan `/acp spawn`.
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
3. Fallback sesi peminta saat ini.

Pengikatan percakapan saat ini dan pengikatan thread keduanya berpartisipasi dalam
langkah 2.

Jika tidak ada target yang terselesaikan, OpenClaw mengembalikan kesalahan yang jelas
(`Unable to resolve session target: ...`).

## Kontrol ACP

| Perintah             | Fungsinya                                                  | Contoh                                                        |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; opsional bind saat ini atau bind thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan turn yang sedang berjalan untuk sesi target.   | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Mengirim instruksi steer ke sesi yang berjalan.            | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas bind target thread.               | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, status, opsi runtime, kapabilitas. | `/acp status`                                              |
| `/acp set-mode`      | Mengatur mode runtime untuk sesi target.                   | `/acp set-mode plan`                                          |
| `/acp set`           | Penulisan opsi konfigurasi runtime generik.                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Mengatur override direktori kerja runtime.                 | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Mengatur profil kebijakan persetujuan.                     | `/acp permissions strict`                                     |
| `/acp timeout`       | Mengatur timeout runtime (detik).                          | `/acp timeout 120`                                            |
| `/acp model`         | Mengatur override model runtime.                           | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus override opsi runtime sesi.                      | `/acp reset-options`                                          |
| `/acp sessions`      | Mencantumkan sesi ACP terbaru dari store.                  | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kapabilitas, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                      |
| `/acp install`       | Mencetak langkah instalasi dan pengaktifan deterministik.  | `/acp install`                                                |

`/acp status` menampilkan opsi runtime efektif beserta pengidentifikasi sesi tingkat runtime dan
tingkat backend. Kesalahan kontrol yang tidak didukung ditampilkan
dengan jelas saat backend tidak memiliki suatu kapabilitas. `/acp sessions` membaca
store untuk sesi yang terikat saat ini atau sesi peminta; token target
(`session-key`, `session-id`, atau `session-label`) diselesaikan melalui
penemuan sesi gateway, termasuk root `session.store` kustom per agen.

### Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik. Operasi yang setara:

| Perintah                     | Dipetakan ke                         | Catatan                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | kunci konfigurasi runtime `model`    | Untuk Codex ACP, OpenClaw menormalisasi `openai-codex/<model>` ke id model adaptor dan memetakan sufiks reasoning slash seperti `openai-codex/gpt-5.4/high` ke `reasoning_effort`. |
| `/acp set thinking <level>`  | kunci konfigurasi runtime `thinking` | Untuk Codex ACP, OpenClaw mengirim `reasoning_effort` yang sesuai saat adaptor mendukungnya.                                                                                   |
| `/acp permissions <profile>` | kunci konfigurasi runtime `approval_policy` | —                                                                                                                                                                       |
| `/acp timeout <seconds>`     | kunci konfigurasi runtime `timeout`  | —                                                                                                                                                                              |
| `/acp cwd <path>`            | override cwd runtime                 | Pembaruan langsung.                                                                                                                                                            |
| `/acp set <key> <value>`     | generik                              | `key=cwd` menggunakan path override cwd.                                                                                                                                       |
| `/acp reset-options`         | menghapus semua override runtime     | —                                                                                                                                                                              |

## Harness acpx, penyiapan Plugin, dan izin

Untuk konfigurasi harness acpx (alias Claude Code / Codex / Gemini CLI),
bridge MCP plugin-tools dan OpenClaw-tools, serta mode izin ACP, lihat
[Agen ACP — penyiapan](/id/tools/acp-agents-setup).

## Pemecahan masalah

| Gejala                                                                     | Kemungkinan penyebab                                                                                                  | Perbaikan                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang, dinonaktifkan, atau diblokir oleh `plugins.allow`.                                                       | Instal dan aktifkan Plugin backend, sertakan `acpx` di `plugins.allow` saat daftar izin itu ditetapkan, lalu jalankan `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                                                                 | Tetapkan `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Pengiriman otomatis dari pesan utas normal dinonaktifkan.                                                               | Tetapkan `acp.dispatch.enabled=true` untuk melanjutkan perutean utas otomatis; panggilan eksplisit `sessions_spawn({ runtime: "acp" })` tetap berfungsi.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agen tidak ada dalam daftar izin.                                                                                                | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` melaporkan backend belum siap tepat setelah startup                 | Plugin backend hilang, dinonaktifkan, diblokir oleh kebijakan izinkan/tolak, atau executable yang dikonfigurasi tidak tersedia.        | Instal/aktifkan Plugin backend, jalankan ulang `/acp doctor`, dan periksa kesalahan instalasi backend atau kebijakan jika tetap tidak sehat.                                           |
| Perintah harness tidak ditemukan                                                   | CLI adapter tidak terinstal, Plugin eksternal hilang, atau pengambilan `npx` saat pertama kali berjalan gagal untuk adapter non-Codex. | Jalankan `/acp doctor`, instal/prapanaskan adapter di host Gateway, atau konfigurasikan perintah agen acpx secara eksplisit.                                                      |
| Model tidak ditemukan dari harness                                            | ID model valid untuk penyedia/harness lain, tetapi bukan untuk target ACP ini.                                                | Gunakan model yang dicantumkan oleh harness itu, konfigurasikan model di harness, atau hilangkan override.                                                                            |
| Kesalahan autentikasi vendor dari harness                                          | OpenClaw sehat, tetapi CLI/penyedia target belum login.                                                     | Login atau sediakan kunci penyedia yang diperlukan di lingkungan host Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token kunci/id/label buruk.                                                                                                | Jalankan `/acp sessions`, salin kunci/label persis, coba lagi.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang dapat diikat.                                                            | Pindah ke obrolan/saluran target dan coba lagi, atau gunakan spawn tanpa ikatan.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter tidak memiliki kemampuan pengikatan ACP percakapan saat ini.                                                             | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` tingkat atas, atau pindah ke saluran yang didukung.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks utas.                                                                         | Pindah ke utas target atau gunakan `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target pengikatan aktif.                                                                           | Ikat ulang sebagai pemilik atau gunakan percakapan atau utas lain.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adapter tidak memiliki kemampuan pengikatan utas.                                                                               | Gunakan `--thread off` atau pindah ke adapter/saluran yang didukung.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.                                                              | Gunakan `runtime="subagent"` dari sesi sandbox, atau jalankan spawn ACP dari sesi non-sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                                                         | Gunakan `runtime="subagent"` untuk sandbox wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi non-sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Harness target tidak mengekspos penggantian model ACP generik.                                                        | Gunakan harness yang mengiklankan ACP `models`/`session/set_model`, gunakan referensi model Codex ACP, atau konfigurasikan model langsung di harness jika memiliki flag startup sendiri. |
| Metadata ACP hilang untuk sesi terikat                                      | Metadata sesi ACP usang/dihapus.                                                                                    | Buat ulang dengan `/acp spawn`, lalu ikat ulang/fokuskan utas.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir penulisan/eksekusi dalam sesi ACP non-interaktif.                                                    | Tetapkan `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan mulai ulang gateway. Lihat [Konfigurasi izin](/id/tools/acp-agents-setup#permission-configuration). |
| Sesi ACP gagal lebih awal dengan sedikit output                                  | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.                                        | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, tetapkan `permissionMode=approve-all`; untuk degradasi yang mulus, tetapkan `nonInteractivePermissions=deny`.        |
| Sesi ACP macet tanpa batas setelah menyelesaikan pekerjaan                       | Proses harness selesai, tetapi sesi ACP tidak melaporkan penyelesaian.                                                    | Pantau dengan `ps aux \| grep acpx`; hentikan proses usang secara manual.                                                                                                       |
| Harness melihat `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Envelope peristiwa internal bocor melintasi batas ACP.                                                                | Perbarui OpenClaw dan jalankan ulang alur penyelesaian; harness eksternal seharusnya hanya menerima prompt penyelesaian biasa.                                                          |

## Terkait

- [Agen ACP — penyiapan](/id/tools/acp-agents-setup)
- [Kirim agen](/id/tools/agent-send)
- [Backend CLI](/id/gateway/cli-backends)
- [Harness Codex](/id/plugins/codex-harness)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode bridge)](/id/cli/acp)
- [Sub-agen](/id/tools/subagents)
