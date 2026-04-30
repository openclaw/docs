---
read_when:
    - Menjalankan harness pengodean melalui ACP
    - Menyiapkan sesi ACP yang terikat pada percakapan di saluran perpesanan
    - Mengaitkan percakapan saluran pesan dengan sesi ACP persisten
    - Pemecahan masalah backend ACP, pengkabelan Plugin, atau pengiriman penyelesaian
    - Mengoperasikan perintah /acp dari obrolan
sidebarTitle: ACP agents
summary: Jalankan alat pengodean eksternal (Claude Code, Cursor, Gemini CLI, Codex ACP eksplisit, OpenClaw ACP, OpenCode) melalui backend ACP
title: agen ACP
x-i18n:
    generated_at: "2026-04-30T10:14:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) sesi
memungkinkan OpenClaw menjalankan harness pengodean eksternal (misalnya Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain yang
didukung) melalui Plugin backend ACP.

Setiap spawn sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

<Note>
**ACP adalah jalur harness eksternal, bukan jalur Codex default.** Plugin
app-server Codex native memiliki kontrol `/codex ...` dan runtime tertanam
`agentRuntime.id: "codex"`; ACP memiliki kontrol
`/acp ...` dan sesi `sessions_spawn({ runtime: "acp" })`.

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal
langsung ke percakapan kanal OpenClaw yang sudah ada, gunakan
[`openclaw mcp serve`](/id/cli/mcp), bukan ACP.
</Note>

## Halaman mana yang saya perlukan?

| Anda ingin…                                                                                     | Gunakan ini                          | Catatan                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mengikat atau mengontrol Codex dalam percakapan saat ini                                        | `/codex bind`, `/codex threads`      | Jalur app-server Codex native saat Plugin `codex` diaktifkan; mencakup balasan chat terikat, penerusan gambar, model/cepat/izin, stop, dan kontrol steer. ACP adalah fallback eksplisit       |
| Menjalankan Claude Code, Gemini CLI, Codex ACP eksplisit, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini                          | Sesi yang terikat ke chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime                                                                           |
| Mengekspos sesi OpenClaw Gateway _sebagai_ server ACP untuk editor atau klien                   | [`openclaw acp`](/id/cli/acp)           | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                                                                                                       |
| Menggunakan ulang CLI AI lokal sebagai model fallback khusus teks                               | [Backend CLI](/id/gateway/cli-backends) | Bukan ACP. Tidak ada alat OpenClaw, tidak ada kontrol ACP, tidak ada runtime harness                                                                                                           |

## Apakah ini langsung berfungsi?

Biasanya ya. Instalasi baru menyertakan Plugin runtime `acpx` bawaan yang diaktifkan
secara default dengan biner `acpx` terpin lokal Plugin yang diperiksa OpenClaw
dan diperbaiki sendiri saat startup. Jalankan `/acp doctor` untuk pemeriksaan kesiapan.

OpenClaw hanya mengajarkan agen tentang spawning ACP saat ACP **benar-benar
dapat digunakan**: ACP harus diaktifkan, dispatch tidak boleh dinonaktifkan, sesi
saat ini tidak boleh diblokir sandbox, dan backend runtime harus dimuat. Jika
kondisi tersebut tidak terpenuhi, Skills Plugin ACP dan panduan ACP
`sessions_spawn` tetap tersembunyi agar agen tidak menyarankan backend yang
tidak tersedia.

<AccordionGroup>
  <Accordion title="Hal yang perlu diperhatikan saat pertama kali berjalan">
    - Jika `plugins.allow` diatur, itu adalah inventaris Plugin yang restriktif dan **harus** menyertakan `acpx`; jika tidak, default bawaan sengaja diblokir dan `/acp doctor` melaporkan entri allowlist yang hilang.
    - Adapter Codex ACP bawaan disiapkan dengan Plugin `acpx` dan diluncurkan secara lokal jika memungkinkan.
    - Adapter harness target lain mungkin masih diambil sesuai kebutuhan dengan `npx` saat pertama kali Anda menggunakannya.
    - Auth vendor tetap harus ada di host untuk harness tersebut.
    - Jika host tidak memiliki npm atau akses jaringan, pengambilan adapter saat pertama kali berjalan gagal sampai cache dipanaskan terlebih dahulu atau adapter dipasang dengan cara lain.

  </Accordion>
  <Accordion title="Prasyarat runtime">
    ACP meluncurkan proses harness eksternal nyata. OpenClaw memiliki routing,
    status tugas latar belakang, pengiriman, binding, dan kebijakan; harness
    memiliki login providernya, katalog model, perilaku sistem file, dan
    alat native.

    Sebelum menyalahkan OpenClaw, verifikasi:

    - `/acp doctor` melaporkan backend yang aktif dan sehat.
    - ID target diizinkan oleh `acp.allowedAgents` saat allowlist tersebut diatur.
    - Perintah harness dapat dimulai di host Gateway.
    - Auth provider tersedia untuk harness tersebut (`claude`, `codex`, `gemini`, `opencode`, `droid`, dll.).
    - Model yang dipilih ada untuk harness tersebut — ID model tidak portabel antar-harness.
    - `cwd` yang diminta ada dan dapat diakses, atau hilangkan `cwd` dan biarkan backend menggunakan defaultnya.
    - Mode izin cocok dengan pekerjaannya. Sesi non-interaktif tidak dapat mengeklik prompt izin native, sehingga proses pengodean yang berat tulis/eksekusi biasanya memerlukan profil izin ACPX yang dapat berjalan tanpa interaksi.

  </Accordion>
</AccordionGroup>

Alat Plugin OpenClaw dan alat bawaan OpenClaw **tidak** diekspos ke
harness ACP secara default. Aktifkan bridge MCP eksplisit di
[agen ACP — penyiapan](/id/tools/acp-agents-setup) hanya saat harness
harus memanggil alat tersebut secara langsung.

## Target harness yang didukung

Dengan backend `acpx` bawaan, gunakan ID harness ini sebagai target `/acp spawn <id>`
atau `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID harness | Backend umum                                   | Catatan                                                                             |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | Memerlukan auth Claude Code di host.                                                |
| `codex`    | Adapter Codex ACP                              | Fallback ACP eksplisit hanya saat `/codex` native tidak tersedia atau ACP diminta.  |
| `copilot`  | Adapter GitHub Copilot ACP                     | Memerlukan auth CLI/runtime Copilot.                                                |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Timpa perintah acpx jika instalasi lokal mengekspos entrypoint ACP yang berbeda.    |
| `droid`    | Factory Droid CLI                              | Memerlukan auth Factory/Droid atau `FACTORY_API_KEY` di lingkungan harness.         |
| `gemini`   | Adapter Gemini CLI ACP                         | Memerlukan auth Gemini CLI atau penyiapan kunci API.                                |
| `iflow`    | iFlow CLI                                      | Ketersediaan adapter dan kontrol model bergantung pada CLI yang dipasang.           |
| `kilocode` | Kilo Code CLI                                  | Ketersediaan adapter dan kontrol model bergantung pada CLI yang dipasang.           |
| `kimi`     | Kimi/Moonshot CLI                              | Memerlukan auth Kimi/Moonshot di host.                                              |
| `kiro`     | Kiro CLI                                       | Ketersediaan adapter dan kontrol model bergantung pada CLI yang dipasang.           |
| `opencode` | Adapter OpenCode ACP                           | Memerlukan auth CLI/provider OpenCode.                                              |
| `openclaw` | Bridge OpenClaw Gateway melalui `openclaw acp` | Memungkinkan harness sadar-ACP berbicara kembali ke sesi OpenClaw Gateway.          |
| `pi`       | Runtime Pi/OpenClaw tertanam                   | Digunakan untuk eksperimen harness native OpenClaw.                                 |
| `qwen`     | Qwen Code / Qwen CLI                           | Memerlukan auth kompatibel Qwen di host.                                            |

Alias agen acpx khusus dapat dikonfigurasi di acpx itu sendiri, tetapi kebijakan
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
  <Step title="Stop">
    `/acp cancel` (giliran saat ini) atau `/acp close` (sesi + binding).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detail siklus hidup">
    - Spawn membuat atau melanjutkan sesi runtime ACP, mencatat metadata ACP di penyimpanan sesi OpenClaw, dan dapat membuat tugas latar belakang saat run dimiliki induk.
    - Sesi ACP yang dimiliki induk diperlakukan sebagai pekerjaan latar belakang bahkan saat sesi runtime bersifat persisten; penyelesaian dan pengiriman lintas permukaan berjalan melalui notifier tugas induk, bukan bertindak seperti sesi chat normal yang menghadap pengguna.
    - Pemeliharaan tugas menutup sesi ACP one-shot yang terminal atau yatim dan dimiliki induk. Sesi ACP persisten dipertahankan selama binding percakapan aktif tetap ada; sesi persisten usang tanpa binding aktif ditutup agar tidak dapat dilanjutkan secara diam-diam setelah tugas pemilik selesai atau catatan tugasnya hilang.
    - Pesan lanjutan yang terikat langsung masuk ke sesi ACP sampai binding ditutup, tidak difokuskan, direset, atau kedaluwarsa.
    - Perintah Gateway tetap lokal. `/acp ...`, `/status`, dan `/unfocus` tidak pernah dikirim sebagai teks prompt normal ke harness ACP terikat.
    - `cancel` membatalkan giliran aktif saat backend mendukung pembatalan; ini tidak menghapus metadata binding atau sesi.
    - `close` mengakhiri sesi ACP dari sudut pandang OpenClaw dan menghapus binding. Harness mungkin masih menyimpan riwayat upstream-nya sendiri jika mendukung resume.
    - Worker runtime idle memenuhi syarat untuk dibersihkan setelah `acp.runtime.ttlMinutes`; metadata sesi tersimpan tetap tersedia untuk `/acp sessions`.

  </Accordion>
  <Accordion title="Aturan routing Codex native">
    Pemicu bahasa alami yang harus diarahkan ke **Plugin Codex native**
    saat diaktifkan:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Binding percakapan Codex native adalah jalur kontrol chat default.
    Alat dinamis OpenClaw tetap dieksekusi melalui OpenClaw, sementara
    alat native Codex seperti shell/apply-patch dieksekusi di dalam Codex.
    Untuk event alat native Codex, OpenClaw menyuntikkan relay hook native
    per giliran agar hook Plugin dapat memblokir `before_tool_call`, mengamati
    `after_tool_call`, dan merutekan event Codex `PermissionRequest`
    melalui persetujuan OpenClaw. Hook Codex `Stop` direlay ke
    OpenClaw `before_agent_finalize`, tempat Plugin dapat meminta satu lagi
    pass model sebelum Codex memfinalisasi jawabannya. Relay tetap
    sengaja konservatif: relay tidak mengubah argumen alat native Codex
    atau menulis ulang catatan thread Codex. Gunakan ACP eksplisit hanya
    saat Anda menginginkan model runtime/sesi ACP. Batas dukungan Codex
    tertanam didokumentasikan dalam
    [kontrak dukungan harness Codex v1](/id/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Lembar contekan pemilihan model / penyedia / runtime">
    - `openai-codex/*` — Rute OAuth/langganan PI Codex.
    - `openai/*` plus `agentRuntime.id: "codex"` — runtime tertanam server aplikasi Codex native.
    - `/codex ...` — kontrol percakapan Codex native.
    - `/acp ...` atau `runtime: "acp"` — kontrol ACP/acpx eksplisit.

  </Accordion>
  <Accordion title="Pemicu bahasa alami perutean ACP">
    Pemicu yang harus dirutekan ke runtime ACP:

    - "Jalankan ini sebagai sesi sekali jalan Claude Code ACP dan rangkum hasilnya."
    - "Gunakan Gemini CLI untuk tugas ini dalam sebuah utas, lalu pertahankan tindak lanjut di utas yang sama."
    - "Jalankan Codex melalui ACP di utas latar belakang."

    OpenClaw memilih `runtime: "acp"`, menyelesaikan harness `agentId`,
    mengikat ke percakapan atau utas saat ini jika didukung, dan
    merutekan tindak lanjut ke sesi tersebut sampai ditutup/kedaluwarsa. Codex hanya
    mengikuti jalur ini saat ACP/acpx eksplisit atau plugin Codex native
    tidak tersedia untuk operasi yang diminta.

    Untuk `sessions_spawn`, `runtime: "acp"` diiklankan hanya saat ACP
    diaktifkan, peminta tidak berada dalam sandbox, dan backend runtime ACP
    dimuat. `acp.dispatch.enabled=false` menjeda dispatch otomatis
    utas ACP tetapi tidak menyembunyikan atau memblokir panggilan eksplisit
    `sessions_spawn({ runtime: "acp" })`. Ini menargetkan id harness ACP seperti `codex`,
    `claude`, `droid`, `gemini`, atau `opencode`. Jangan berikan id agen
    konfigurasi OpenClaw normal dari `agents_list` kecuali entri tersebut
    dikonfigurasi secara eksplisit dengan `agents.list[].runtime.type="acp"`;
    jika tidak, gunakan runtime sub-agen default. Saat sebuah agen OpenClaw
    dikonfigurasi dengan `runtime.type="acp"`, OpenClaw menggunakan
    `runtime.acp.agent` sebagai id harness dasarnya.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agen

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan **server aplikasi Codex
native** untuk pengikatan/kontrol percakapan Codex saat plugin `codex`
diaktifkan. Gunakan **sub-agen** saat Anda menginginkan proses delegasi
native OpenClaw.

| Area          | Sesi ACP                              | Proses sub-agen                    |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime sub-agen native OpenClaw   |
| Kunci sesi    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Perintah utama | `/acp ...`                           | `/subagents ...`                   |
| Alat spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agen](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, stack-nya adalah:

1. Bidang kontrol sesi ACP OpenClaw.
2. Plugin runtime `acpx` bawaan.
3. Adapter ACP Claude.
4. Mesin runtime/sesi sisi Claude.

ACP Claude adalah **sesi harness** dengan kontrol ACP, pelanjutan sesi,
pelacakan tugas latar belakang, dan pengikatan percakapan/utas opsional.

Backend CLI adalah runtime fallback lokal teks-saja yang terpisah — lihat
[Backend CLI](/id/gateway/cli-backends).

Untuk operator, aturan praktisnya adalah:

- **Ingin `/acp spawn`, sesi yang dapat diikat, kontrol runtime, atau pekerjaan harness persisten?** Gunakan ACP.
- **Ingin fallback teks lokal sederhana melalui CLI mentah?** Gunakan backend CLI.

## Sesi terikat

### Model mental

- **Permukaan chat** — tempat orang terus berbicara (channel Discord, topik Telegram, chat iMessage).
- **Sesi ACP** — status runtime Codex/Claude/Gemini tahan lama yang dirutekan OpenClaw.
- **Utas/topik anak** — permukaan pesan tambahan opsional yang dibuat hanya oleh `--thread ...`.
- **Ruang kerja runtime** — lokasi filesystem (`cwd`, checkout repo, ruang kerja backend) tempat harness berjalan. Independen dari permukaan chat.

### Pengikatan percakapan saat ini

`/acp spawn <harness> --bind here` menyematkan percakapan saat ini ke
sesi ACP yang dibuat — tanpa utas anak, permukaan chat yang sama. OpenClaw tetap
memiliki transport, auth, keselamatan, dan pengiriman. Pesan tindak lanjut dalam
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
  <Accordion title="Aturan pengikatan dan eksklusivitas">
    - `--bind here` dan `--thread ...` saling eksklusif.
    - `--bind here` hanya berfungsi pada channel yang mengiklankan pengikatan percakapan saat ini; OpenClaw mengembalikan pesan tidak didukung yang jelas jika tidak. Pengikatan bertahan melewati restart Gateway.
    - Di Discord, `spawnAcpSessions` hanya diperlukan saat OpenClaw perlu membuat utas anak untuk `--thread auto|here` — bukan untuk `--bind here`.
    - Jika Anda spawn ke agen ACP berbeda tanpa `--cwd`, OpenClaw mewarisi ruang kerja **agen target** secara default. Jalur turunan yang hilang (`ENOENT`/`ENOTDIR`) fallback ke default backend; kesalahan akses lain (mis. `EACCES`) muncul sebagai kesalahan spawn.
    - Perintah manajemen Gateway tetap lokal dalam percakapan terikat — perintah `/acp ...` ditangani oleh OpenClaw bahkan saat teks tindak lanjut normal dirutekan ke sesi ACP terikat; `/status` dan `/unfocus` juga tetap lokal kapan pun penanganan perintah diaktifkan untuk permukaan tersebut.

  </Accordion>
  <Accordion title="Sesi terikat utas">
    Saat pengikatan utas diaktifkan untuk adapter channel:

    - OpenClaw mengikat utas ke sesi ACP target.
    - Pesan tindak lanjut dalam utas tersebut dirutekan ke sesi ACP terikat.
    - Output ACP dikirim kembali ke utas yang sama.
    - Unfocus/tutup/arsipkan/timeout idle atau kedaluwarsa usia maksimum menghapus pengikatan.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, dan `/unfocus` adalah perintah Gateway, bukan prompt ke harness ACP.

    Feature flag yang diperlukan untuk ACP terikat utas:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` aktif secara default (atur `false` untuk menjeda dispatch utas ACP otomatis; panggilan eksplisit `sessions_spawn({ runtime: "acp" })` tetap berfungsi).
    - Flag spawn utas ACP adapter channel diaktifkan (spesifik adapter):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Dukungan pengikatan utas bersifat spesifik adapter. Jika adapter channel
    aktif tidak mendukung pengikatan utas, OpenClaw mengembalikan pesan
    tidak didukung/tidak tersedia yang jelas.

  </Accordion>
  <Accordion title="Channel yang mendukung utas">
    - Adapter channel apa pun yang mengekspos kapabilitas pengikatan sesi/utas.
    - Dukungan bawaan saat ini: utas/channel **Discord**, topik **Telegram** (topik forum dalam grup/supergrup dan topik DM).
    - Channel Plugin dapat menambahkan dukungan melalui antarmuka pengikatan yang sama.

  </Accordion>
</AccordionGroup>

## Pengikatan channel persisten

Untuk workflow non-ephemeral, konfigurasikan pengikatan ACP persisten dalam
entri tingkat atas `bindings[]`.

### Model pengikatan

<ParamField path="bindings[].type" type='"acp"'>
  Menandai pengikatan percakapan ACP persisten.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Mengidentifikasi percakapan target. Bentuk per channel:

- **Channel/utas Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Topik forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grup BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Lebih disarankan `chat_id:*` atau `chat_identifier:*` untuk pengikatan grup yang stabil.
- **DM/grup iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Lebih disarankan `chat_id:*` untuk pengikatan grup yang stabil.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Id agen OpenClaw pemilik.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Override ACP opsional.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Label opsional yang ditampilkan ke operator.
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
- Pesan di channel atau topik tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan terikat, `/new` dan `/reset` mereset kunci sesi ACP yang sama di tempat.
- Pengikatan runtime sementara (misalnya dibuat oleh alur fokus utas) tetap berlaku jika ada.
- Untuk spawn ACP lintas-agen tanpa `cwd` eksplisit, OpenClaw mewarisi ruang kerja agen target dari konfigurasi agen.
- Jalur ruang kerja turunan yang hilang fallback ke cwd default backend; kegagalan akses yang tidak hilang muncul sebagai kesalahan spawn.

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
    `runtime` default ke `subagent`, jadi tetapkan `runtime: "acp"` secara eksplisit
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
  Minta alur pengikatan utas jika didukung.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` adalah sekali jalan; `"session"` bersifat persisten. Jika `thread: true` dan
  `mode` dihilangkan, OpenClaw dapat default ke perilaku persisten per
  jalur runtime. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime).
  Jika dihilangkan, spawn ACP mewarisi ruang kerja agen target
  saat dikonfigurasi; jalur warisan yang hilang kembali ke default
  backend, sedangkan kesalahan akses nyata dikembalikan.
</ParamField>
<ParamField path="label" type="string">
  Label yang menghadap operator yang digunakan dalam teks sesi/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Lanjutkan sesi ACP yang sudah ada alih-alih membuat yang baru. Agen
  memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` mengalirkan ringkasan progres proses ACP awal kembali ke
  sesi peminta sebagai peristiwa sistem. Respons yang diterima mencakup
  `streamLogPath` yang menunjuk ke log JSONL bercakupan sesi
  (`<sessionId>.acp-stream.jsonl`) yang dapat Anda ikuti untuk riwayat relai lengkap.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Membatalkan giliran anak ACP setelah N detik. `0` mempertahankan giliran pada
  jalur tanpa batas waktu Gateway. Nilai yang sama diterapkan ke proses Gateway
  dan runtime ACP sehingga harness yang macet/kehabisan kuota tidak
  menempati jalur agen induk tanpa batas.
</ParamField>
<ParamField path="model" type="string">
  Penggantian model eksplisit untuk sesi anak ACP. Spawn Codex ACP
  menormalkan referensi OpenClaw Codex seperti `openai-codex/gpt-5.4` ke konfigurasi
  awal Codex ACP sebelum `session/new`; bentuk garis miring seperti
  `openai-codex/gpt-5.4/high` juga menetapkan upaya penalaran Codex ACP.
  Harness lain harus mengiklankan ACP `models` dan mendukung
  `session/set_model`; jika tidak, OpenClaw/acpx gagal dengan jelas alih-alih
  diam-diam kembali ke default agen target.
</ParamField>
<ParamField path="thinking" type="string">
  Upaya berpikir/penalaran eksplisit. Untuk Codex ACP, `minimal` dipetakan ke
  upaya rendah, `low`/`medium`/`high`/`xhigh` dipetakan langsung, dan `off`
  menghilangkan penggantian awal upaya penalaran.
</ParamField>

## Mode pengikatan dan utas spawn

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Perilaku                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
    | `off`  | Jangan buat pengikatan percakapan saat ini.                          |

    Catatan:

    - `--bind here` adalah jalur operator paling sederhana untuk "jadikan kanal atau obrolan ini didukung Codex."
    - `--bind here` tidak membuat utas anak.
    - `--bind here` hanya tersedia di kanal yang mengekspos dukungan pengikatan percakapan saat ini.
    - `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Perilaku                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Dalam utas aktif: ikat utas tersebut. Di luar utas: buat/ikat utas anak saat didukung. |
    | `here` | Wajibkan utas aktif saat ini; gagal jika tidak berada di dalamnya.                                                  |
    | `off`  | Tidak ada pengikatan. Sesi dimulai tanpa ikatan.                                                                 |

    Catatan:

    - Pada permukaan pengikatan non-utas, perilaku default secara efektif adalah `off`.
    - Spawn yang terikat utas memerlukan dukungan kebijakan kanal:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Gunakan `--bind here` saat Anda ingin menyematkan percakapan saat ini tanpa membuat utas anak.

  </Tab>
</Tabs>

## Model pengiriman

Sesi ACP dapat berupa ruang kerja interaktif atau pekerjaan latar belakang
milik induk. Jalur pengiriman bergantung pada bentuk tersebut.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Sesi interaktif dimaksudkan untuk terus berbicara di permukaan obrolan
    yang terlihat:

    - `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
    - `/acp spawn ... --thread ...` mengikat utas/topik kanal ke sesi ACP.
    - `bindings[].type="acp"` persisten yang dikonfigurasi merutekan percakapan yang cocok ke sesi ACP yang sama.

    Pesan lanjutan dalam percakapan terikat dirutekan langsung ke
    sesi ACP, dan keluaran ACP dikirim kembali ke kanal/utas/topik
    yang sama.

    Yang dikirim OpenClaw ke harness:

    - Tindak lanjut terikat normal dikirim sebagai teks prompt, ditambah lampiran hanya saat harness/backend mendukungnya.
    - Perintah manajemen `/acp` dan perintah Gateway lokal dicegat sebelum pengiriman ACP.
    - Peristiwa penyelesaian yang dihasilkan runtime diwujudkan per target. Agen OpenClaw menerima amplop konteks-runtime internal OpenClaw; harness ACP eksternal menerima prompt biasa dengan hasil anak dan instruksi. Amplop mentah `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` tidak boleh pernah dikirim ke harness eksternal atau dipersistenkan sebagai teks transkrip pengguna ACP.
    - Entri transkrip ACP menggunakan teks pemicu yang terlihat pengguna atau prompt penyelesaian biasa. Metadata peristiwa internal tetap terstruktur di OpenClaw jika memungkinkan dan tidak diperlakukan sebagai konten obrolan yang ditulis pengguna.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Sesi ACP sekali jalan yang dimunculkan oleh proses agen lain adalah anak
    latar belakang, mirip dengan sub-agen:

    - Induk meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Anak berjalan dalam sesi harness ACP-nya sendiri.
    - Giliran anak berjalan pada jalur latar belakang yang sama yang digunakan oleh spawn sub-agen native, sehingga harness ACP yang lambat tidak memblokir pekerjaan sesi utama yang tidak terkait.
    - Laporan penyelesaian kembali melalui jalur pengumuman penyelesaian tugas. OpenClaw mengonversi metadata penyelesaian internal menjadi prompt ACP biasa sebelum mengirimkannya ke harness eksternal, sehingga harness tidak melihat penanda konteks runtime khusus OpenClaw.
    - Induk menulis ulang hasil anak dengan suara asisten normal saat balasan yang menghadap pengguna berguna.

    Jangan **perlakukan** jalur ini sebagai obrolan peer-to-peer antara induk
    dan anak. Anak sudah memiliki kanal penyelesaian kembali ke
    induk.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` dapat menargetkan sesi lain setelah spawn. Untuk sesi
    peer normal, OpenClaw menggunakan jalur tindak lanjut agen-ke-agen (A2A)
    setelah menyuntikkan pesan:

    - Tunggu balasan sesi target.
    - Secara opsional izinkan peminta dan target bertukar sejumlah giliran tindak lanjut yang dibatasi.
    - Minta target membuat pesan pengumuman.
    - Kirim pengumuman tersebut ke kanal atau utas yang terlihat.

    Jalur A2A tersebut adalah fallback untuk pengiriman peer saat pengirim memerlukan
    tindak lanjut yang terlihat. Jalur ini tetap aktif saat sesi yang tidak terkait dapat
    melihat dan mengirim pesan ke target ACP, misalnya di bawah pengaturan
    `tools.sessions.visibility` yang luas.

    OpenClaw melewati tindak lanjut A2A hanya saat peminta adalah
    induk dari anak ACP sekali jalan milik induknya sendiri. Dalam kasus itu,
    menjalankan A2A di atas penyelesaian tugas dapat membangunkan induk dengan
    hasil anak, meneruskan balasan induk kembali ke anak, dan
    membuat loop gema induk/anak. Hasil `sessions_send` melaporkan
    `delivery.status="skipped"` untuk kasus anak-milik tersebut karena
    jalur penyelesaian sudah bertanggung jawab atas hasilnya.

  </Accordion>
  <Accordion title="Resume an existing session">
    Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih
    memulai baru. Agen memutar ulang riwayat percakapannya melalui
    `session/load`, sehingga sesi melanjutkan dengan konteks penuh dari yang terjadi sebelumnya.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Kasus penggunaan umum:

    - Alihkan sesi Codex dari laptop ke ponsel Anda — beri tahu agen untuk melanjutkan dari titik terakhir.
    - Lanjutkan sesi pengodean yang Anda mulai secara interaktif di CLI, kini secara headless melalui agen Anda.
    - Lanjutkan pekerjaan yang terputus oleh restart gateway atau batas waktu menganggur.

    Catatan:

    - `resumeSessionId` hanya berlaku saat `runtime: "acp"`; runtime sub-agen default mengabaikan field khusus ACP ini.
    - `streamTo` hanya berlaku saat `runtime: "acp"`; runtime sub-agen default mengabaikan field khusus ACP ini.
    - `resumeSessionId` adalah id lanjut ACP/harness lokal-host, bukan kunci sesi kanal OpenClaw; OpenClaw tetap memeriksa kebijakan spawn ACP dan kebijakan agen target sebelum pengiriman, sedangkan backend atau harness ACP memiliki otorisasi untuk memuat id upstream tersebut.
    - `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal untuk sesi OpenClaw baru yang Anda buat, jadi `mode: "session"` tetap memerlukan `thread: true`.
    - Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
    - Jika id sesi tidak ditemukan, spawn gagal dengan kesalahan yang jelas — tidak ada fallback diam-diam ke sesi baru.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Setelah deploy gateway, jalankan pemeriksaan end-to-end langsung alih-alih
    memercayai pengujian unit:

    1. Verifikasi versi gateway dan commit yang di-deploy pada host target.
    2. Buka sesi jembatan ACPX sementara ke agen langsung.
    3. Minta agen tersebut memanggil `sessions_spawn` dengan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, dan tugas `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifikasi `accepted=yes`, `childSessionKey` nyata, dan tidak ada kesalahan validator.
    5. Bersihkan sesi jembatan sementara.

    Pertahankan gate pada `mode: "run"` dan lewati `streamTo: "parent"` —
    `mode: "session"` yang terikat utas dan jalur relai aliran adalah pemeriksaan
    integrasi lebih kaya yang terpisah.

  </Accordion>
</AccordionGroup>

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, **bukan** di dalam
sandbox OpenClaw.

<Warning>
**Batas keamanan:**

- Harness eksternal dapat membaca/menulis sesuai izin CLI-nya sendiri dan `cwd` yang dipilih.
- Kebijakan sandbox OpenClaw **tidak** membungkus eksekusi harness ACP.
- OpenClaw tetap memberlakukan gerbang fitur ACP, agen yang diizinkan, kepemilikan sesi, pengikatan saluran, dan kebijakan pengiriman Gateway.
- Gunakan `runtime: "subagent"` untuk pekerjaan native OpenClaw yang diberlakukan oleh sandbox.

</Warning>

Batasan saat ini:

- Jika sesi peminta berada dalam sandbox, pemunculan ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.

## Resolusi target sesi

Sebagian besar tindakan `/acp` menerima target sesi opsional (`session-key`,
`session-id`, atau `session-label`).

**Urutan resolusi:**

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - mencoba kunci
   - lalu id sesi berbentuk UUID
   - lalu label
2. Pengikatan utas saat ini (jika percakapan/utas ini terikat ke sesi ACP).
3. Fallback sesi peminta saat ini.

Pengikatan percakapan saat ini dan pengikatan utas sama-sama berpartisipasi dalam
langkah 2.

Jika tidak ada target yang terselesaikan, OpenClaw mengembalikan error yang jelas
(`Unable to resolve session target: ...`).

## Kontrol ACP

| Perintah             | Fungsinya                                                 | Contoh                                                        |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; opsional ikatan saat ini atau ikatan utas. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan turn yang sedang berjalan untuk sesi target.  | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Mengirim instruksi steer ke sesi yang berjalan.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas ikatan target utas.              | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, status, opsi runtime, kapabilitas. | `/acp status`                                                 |
| `/acp set-mode`      | Mengatur mode runtime untuk sesi target.                  | `/acp set-mode plan`                                          |
| `/acp set`           | Penulisan opsi konfigurasi runtime generik.               | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Mengatur override direktori kerja runtime.                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Mengatur profil kebijakan persetujuan.                    | `/acp permissions strict`                                     |
| `/acp timeout`       | Mengatur timeout runtime (detik).                         | `/acp timeout 120`                                            |
| `/acp model`         | Mengatur override model runtime.                          | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus override opsi runtime sesi.                     | `/acp reset-options`                                          |
| `/acp sessions`      | Mencantumkan sesi ACP terbaru dari store.                 | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kapabilitas, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                                 |
| `/acp install`       | Mencetak langkah instalasi dan pengaktifan yang deterministik. | `/acp install`                                                |

`/acp status` menampilkan opsi runtime efektif beserta pengidentifikasi sesi tingkat runtime dan
tingkat backend. Error kontrol yang tidak didukung muncul
dengan jelas saat backend tidak memiliki kapabilitas. `/acp sessions` membaca
store untuk sesi terikat saat ini atau sesi peminta; token target
(`session-key`, `session-id`, atau `session-label`) diselesaikan melalui
penemuan sesi Gateway, termasuk root `session.store`
khusus per agen.

### Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik. Operasi yang
setara:

| Perintah                     | Dipetakan ke                         | Catatan                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | kunci konfigurasi runtime `model`    | Untuk Codex ACP, OpenClaw menormalkan `openai-codex/<model>` ke id model adapter dan memetakan sufiks reasoning garis miring seperti `openai-codex/gpt-5.4/high` ke `reasoning_effort`. |
| `/acp set thinking <level>`  | kunci konfigurasi runtime `thinking` | Untuk Codex ACP, OpenClaw mengirim `reasoning_effort` yang sesuai saat adapter mendukungnya.                                                                                   |
| `/acp permissions <profile>` | kunci konfigurasi runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | kunci konfigurasi runtime `timeout`  | —                                                                                                                                                                              |
| `/acp cwd <path>`            | override cwd runtime                 | Pembaruan langsung.                                                                                                                                                            |
| `/acp set <key> <value>`     | generik                              | `key=cwd` menggunakan jalur override cwd.                                                                                                                                      |
| `/acp reset-options`         | menghapus semua override runtime     | —                                                                                                                                                                              |

## harness acpx, penyiapan Plugin, dan izin

Untuk konfigurasi harness acpx (alias Claude Code / Codex / Gemini CLI),
bridge MCP plugin-tools dan OpenClaw-tools, serta mode
izin ACP, lihat
[Agen ACP — penyiapan](/id/tools/acp-agents-setup).

## Pemecahan masalah

| Gejala                                                                     | Kemungkinan penyebab                                                                                                           | Perbaikan                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang, dinonaktifkan, atau diblokir oleh `plugins.allow`.                                                       | Instal dan aktifkan Plugin backend, sertakan `acpx` dalam `plugins.allow` ketika daftar izin itu ditetapkan, lalu jalankan `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                                                                 | Tetapkan `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch otomatis dari pesan thread normal dinonaktifkan.                                                               | Tetapkan `acp.dispatch.enabled=true` untuk melanjutkan perutean thread otomatis; panggilan eksplisit `sessions_spawn({ runtime: "acp" })` tetap berfungsi.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agen tidak ada dalam daftar izin.                                                                                                | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Probe dependensi Plugin atau perbaikan mandiri masih berjalan.                                                               | Tunggu sebentar dan jalankan ulang `/acp doctor`; jika tetap tidak sehat, periksa galat instalasi backend dan kebijakan izin/tolak Plugin.                                             |
| Harness command not found                                                   | CLI adapter tidak terinstal, dependensi Plugin bertahap hilang, atau pengambilan `npx` pertama kali gagal untuk adapter non-Codex. | Jalankan `/acp doctor`, perbaiki dependensi Plugin, instal/prapanaskan adapter di host Gateway, atau konfigurasikan perintah agen acpx secara eksplisit.                          |
| Model-not-found from the harness                                            | ID model valid untuk penyedia/harness lain, tetapi bukan target ACP ini.                                                | Gunakan model yang dicantumkan oleh harness tersebut, konfigurasikan model di harness, atau hilangkan override.                                                                            |
| Vendor auth error from the harness                                          | OpenClaw sehat, tetapi CLI/penyedia target belum masuk.                                                     | Masuk atau sediakan kunci penyedia yang diperlukan di lingkungan host Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token kunci/id/label salah.                                                                                                | Jalankan `/acp sessions`, salin kunci/label persisnya, coba lagi.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang dapat diikat.                                                            | Pindah ke chat/channel target dan coba lagi, atau gunakan spawn tanpa ikatan.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter tidak memiliki kapabilitas pengikatan ACP percakapan saat ini.                                                             | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` tingkat atas, atau pindah ke channel yang didukung.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks thread.                                                                         | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target pengikatan aktif.                                                                           | Ikat ulang sebagai pemilik atau gunakan percakapan atau thread lain.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adapter tidak memiliki kapabilitas pengikatan thread.                                                                               | Gunakan `--thread off` atau pindah ke adapter/channel yang didukung.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.                                                              | Gunakan `runtime="subagent"` dari sesi bersandbox, atau jalankan spawn ACP dari sesi non-sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                                                         | Gunakan `runtime="subagent"` untuk sandboxing wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi non-sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Harness target tidak mengekspos peralihan model ACP generik.                                                        | Gunakan harness yang mengiklankan ACP `models`/`session/set_model`, gunakan referensi model ACP Codex, atau konfigurasikan model langsung di harness jika memiliki flag startup sendiri. |
| Metadata ACP hilang untuk sesi terikat                                      | Metadata sesi ACP usang/dihapus.                                                                                    | Buat ulang dengan `/acp spawn`, lalu ikat ulang/fokuskan thread.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir penulisan/exec dalam sesi ACP non-interaktif.                                                    | Tetapkan `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan mulai ulang gateway. Lihat [Konfigurasi izin](/id/tools/acp-agents-setup#permission-configuration). |
| Sesi ACP gagal lebih awal dengan sedikit output                                  | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.                                        | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, tetapkan `permissionMode=approve-all`; untuk degradasi yang mulus, tetapkan `nonInteractivePermissions=deny`.        |
| Sesi ACP macet tanpa batas setelah menyelesaikan pekerjaan                       | Proses harness selesai tetapi sesi ACP tidak melaporkan penyelesaian.                                                    | Pantau dengan `ps aux \| grep acpx`; hentikan proses usang secara manual.                                                                                                       |
| Harness melihat `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Amplop peristiwa internal bocor melewati batas ACP.                                                                | Perbarui OpenClaw dan jalankan ulang alur penyelesaian; harness eksternal seharusnya hanya menerima prompt penyelesaian polos.                                                          |

## Terkait

- [Agen ACP — penyiapan](/id/tools/acp-agents-setup)
- [Kirim agen](/id/tools/agent-send)
- [Backend CLI](/id/gateway/cli-backends)
- [Harness Codex](/id/plugins/codex-harness)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode jembatan)](/id/cli/acp)
- [Sub-agen](/id/tools/subagents)
