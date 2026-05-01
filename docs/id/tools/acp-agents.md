---
read_when:
    - Menjalankan perangkat pengodean melalui ACP
    - Menyiapkan sesi ACP yang terikat percakapan di saluran perpesanan
    - Mengaitkan percakapan saluran pesan dengan sesi ACP persisten
    - Memecahkan masalah backend ACP, pengaitan Plugin, atau pengiriman penyelesaian
    - Menjalankan perintah /acp dari obrolan
sidebarTitle: ACP agents
summary: Jalankan harness pengodean eksternal (Claude Code, Cursor, Gemini CLI, Codex ACP eksplisit, OpenClaw ACP, OpenCode) melalui backend ACP
title: Agen ACP
x-i18n:
    generated_at: "2026-05-01T09:29:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb4164208571799f2d78d324f86c9b2fb72c60489ac2c367256f222495c74dbf
    source_path: tools/acp-agents.md
    workflow: 16
---

Sesi [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
memungkinkan OpenClaw menjalankan harness coding eksternal (misalnya Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain
yang didukung) melalui Plugin backend ACP.

Setiap peluncuran sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

<Note>
**ACP adalah jalur harness eksternal, bukan jalur Codex default.** Plugin
app-server Codex native menangani kontrol `/codex ...` dan runtime tersemat
`agentRuntime.id: "codex"`; ACP menangani kontrol `/acp ...` dan sesi
`sessions_spawn({ runtime: "acp" })`.

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal
langsung ke percakapan kanal OpenClaw yang sudah ada, gunakan
[`openclaw mcp serve`](/id/cli/mcp), bukan ACP.
</Note>

## Halaman mana yang saya butuhkan?

| Anda ingin…                                                                                     | Gunakan ini                           | Catatan                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mengikat atau mengontrol Codex dalam percakapan saat ini                                        | `/codex bind`, `/codex threads`       | Jalur app-server Codex native saat Plugin `codex` diaktifkan; mencakup balasan chat terikat, penerusan gambar, kontrol model/cepat/izin, berhenti, dan pengarahan. ACP adalah fallback eksplisit |
| Menjalankan Claude Code, Gemini CLI, Codex ACP eksplisit, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini                           | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime                                                                                  |
| Mengekspos sesi Gateway OpenClaw _sebagai_ server ACP untuk editor atau klien                   | [`openclaw acp`](/id/cli/acp)            | Mode jembatan. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                                                                                                    |
| Menggunakan kembali CLI AI lokal sebagai model fallback khusus teks                             | [Backend CLI](/id/gateway/cli-backends) | Bukan ACP. Tidak ada alat OpenClaw, tidak ada kontrol ACP, tidak ada runtime harness                                                                                                          |

## Apakah ini langsung berfungsi tanpa konfigurasi?

Biasanya ya. Instalasi baru menyertakan Plugin runtime `acpx` bawaan yang
diaktifkan secara default dengan biner `acpx` terpin di dalam Plugin yang
diperiksa dan diperbaiki sendiri oleh OpenClaw segera setelah listener HTTP
Gateway aktif. Jalankan `/acp doctor` untuk pemeriksaan kesiapan.

OpenClaw hanya memberi tahu agen tentang peluncuran ACP ketika ACP
**benar-benar dapat digunakan**: ACP harus diaktifkan, dispatch tidak boleh
dinonaktifkan, sesi saat ini tidak boleh diblokir sandbox, dan backend runtime
harus dimuat. Jika kondisi tersebut tidak terpenuhi, Skills Plugin ACP dan
panduan ACP `sessions_spawn` tetap tersembunyi agar agen tidak menyarankan
backend yang tidak tersedia.

<AccordionGroup>
  <Accordion title="Hal-hal yang perlu diperhatikan saat pertama kali dijalankan">
    - Jika `plugins.allow` disetel, itu adalah inventaris Plugin yang restriktif dan **harus** menyertakan `acpx`; jika tidak, default bawaan sengaja diblokir dan `/acp doctor` melaporkan entri allowlist yang hilang.
    - Adapter Codex ACP bawaan dipersiapkan bersama Plugin `acpx` dan diluncurkan secara lokal jika memungkinkan.
    - Adapter harness target lain mungkin tetap diambil sesuai permintaan dengan `npx` saat pertama kali Anda menggunakannya.
    - Autentikasi vendor tetap harus ada di host untuk harness tersebut.
    - Jika host tidak memiliki npm atau akses jaringan, pengambilan adapter saat pertama kali dijalankan akan gagal hingga cache disiapkan lebih dulu atau adapter dipasang dengan cara lain.

  </Accordion>
  <Accordion title="Prasyarat runtime">
    ACP meluncurkan proses harness eksternal sungguhan. OpenClaw menangani routing,
    status tugas latar belakang, pengiriman, pengikatan, dan kebijakan; harness
    menangani login penyedia, katalog model, perilaku sistem file, dan alat
    native-nya.

    Sebelum menganggap masalah berasal dari OpenClaw, verifikasi:

    - `/acp doctor` melaporkan backend yang aktif dan sehat.
    - id target diizinkan oleh `acp.allowedAgents` ketika allowlist tersebut disetel.
    - Perintah harness dapat dimulai di host Gateway.
    - Autentikasi penyedia tersedia untuk harness tersebut (`claude`, `codex`, `gemini`, `opencode`, `droid`, dll.).
    - Model yang dipilih ada untuk harness tersebut — id model tidak portabel antar-harness.
    - `cwd` yang diminta ada dan dapat diakses, atau hilangkan `cwd` dan biarkan backend memakai default-nya.
    - Mode izin cocok dengan pekerjaan. Sesi noninteraktif tidak dapat mengeklik prompt izin native, jadi run coding yang banyak operasi tulis/eksekusi biasanya memerlukan profil izin ACPX yang dapat berjalan tanpa interaksi UI.

  </Accordion>
</AccordionGroup>

Alat Plugin OpenClaw dan alat bawaan OpenClaw **tidak** diekspos ke
harness ACP secara default. Aktifkan jembatan MCP eksplisit di
[Agen ACP — penyiapan](/id/tools/acp-agents-setup) hanya ketika harness
harus memanggil alat tersebut secara langsung.

## Target harness yang didukung

Dengan backend `acpx` bawaan, gunakan id harness ini sebagai target `/acp spawn <id>`
atau `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Backend umum                                   | Catatan                                                                             |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | Memerlukan autentikasi Claude Code di host.                                         |
| `codex`    | Adapter Codex ACP                              | Fallback ACP eksplisit hanya ketika `/codex` native tidak tersedia atau ACP diminta. |
| `copilot`  | Adapter GitHub Copilot ACP                     | Memerlukan autentikasi CLI/runtime Copilot.                                         |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Timpa perintah acpx jika instalasi lokal mengekspos entrypoint ACP yang berbeda.    |
| `droid`    | Factory Droid CLI                              | Memerlukan autentikasi Factory/Droid atau `FACTORY_API_KEY` di lingkungan harness.  |
| `gemini`   | Adapter Gemini CLI ACP                         | Memerlukan autentikasi Gemini CLI atau penyiapan kunci API.                         |
| `iflow`    | iFlow CLI                                      | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terpasang.          |
| `kilocode` | Kilo Code CLI                                  | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terpasang.          |
| `kimi`     | Kimi/Moonshot CLI                              | Memerlukan autentikasi Kimi/Moonshot di host.                                       |
| `kiro`     | Kiro CLI                                       | Ketersediaan adapter dan kontrol model bergantung pada CLI yang terpasang.          |
| `opencode` | Adapter OpenCode ACP                           | Memerlukan autentikasi CLI/penyedia OpenCode.                                       |
| `openclaw` | Jembatan Gateway OpenClaw melalui `openclaw acp` | Memungkinkan harness yang memahami ACP berbicara kembali ke sesi Gateway OpenClaw. |
| `pi`       | Runtime Pi/OpenClaw tersemat                   | Digunakan untuk eksperimen harness native OpenClaw.                                 |
| `qwen`     | Qwen Code / Qwen CLI                           | Memerlukan autentikasi yang kompatibel dengan Qwen di host.                         |

Alias agen acpx kustom dapat dikonfigurasi di acpx sendiri, tetapi kebijakan OpenClaw
tetap memeriksa `acp.allowedAgents` dan pemetaan
`agents.list[].runtime.acp.agent` apa pun sebelum dispatch.

## Runbook operator

Alur cepat `/acp` dari chat:

<Steps>
  <Step title="Jalankan">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, atau secara eksplisit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Kerjakan">
    Lanjutkan di percakapan atau thread terikat (atau targetkan kunci sesi
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
    `/acp cancel` (giliran saat ini) atau `/acp close` (sesi + pengikatan).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detail siklus hidup">
    - Peluncuran membuat atau melanjutkan sesi runtime ACP, mencatat metadata ACP di penyimpanan sesi OpenClaw, dan dapat membuat tugas latar belakang ketika eksekusi dimiliki induk.
    - Sesi ACP yang dimiliki induk diperlakukan sebagai pekerjaan latar belakang bahkan ketika sesi runtime bersifat persisten; penyelesaian dan pengiriman lintas permukaan melewati notifier tugas induk alih-alih bertindak seperti sesi chat normal yang menghadap pengguna.
    - Pemeliharaan tugas menutup sesi ACP sekali jalan milik induk yang sudah terminal atau yatim. Sesi ACP persisten dipertahankan selama pengikatan percakapan aktif masih ada; sesi persisten usang tanpa pengikatan aktif ditutup agar tidak dapat dilanjutkan diam-diam setelah tugas pemilik selesai atau catatan tugasnya hilang.
    - Pesan tindak lanjut terikat langsung menuju sesi ACP hingga pengikatan ditutup, tidak difokuskan, direset, atau kedaluwarsa.
    - Perintah Gateway tetap lokal. `/acp ...`, `/status`, dan `/unfocus` tidak pernah dikirim sebagai teks prompt normal ke harness ACP terikat.
    - `cancel` membatalkan giliran aktif ketika backend mendukung pembatalan; ini tidak menghapus metadata pengikatan atau sesi.
    - `close` mengakhiri sesi ACP dari sudut pandang OpenClaw dan menghapus pengikatan. Harness mungkin tetap menyimpan riwayat upstream-nya sendiri jika mendukung resume.
    - Worker runtime idle memenuhi syarat untuk dibersihkan setelah `acp.runtime.ttlMinutes`; metadata sesi tersimpan tetap tersedia untuk `/acp sessions`.

  </Accordion>
  <Accordion title="Aturan routing Codex native">
    Pemicu bahasa alami yang harus diarahkan ke **Plugin Codex native**
    saat diaktifkan:

    - "Ikat kanal Discord ini ke Codex."
    - "Lampirkan chat ini ke thread Codex `<id>`."
    - "Tampilkan thread Codex, lalu ikat yang ini."

    Pengikatan percakapan Codex native adalah jalur kontrol chat default.
    Alat dinamis OpenClaw tetap dieksekusi melalui OpenClaw, sementara
    alat native Codex seperti shell/apply-patch dieksekusi di dalam Codex.
    Untuk event alat native Codex, OpenClaw menyuntikkan relay hook native
    per-giliran agar hook Plugin dapat memblokir `before_tool_call`, mengamati
    `after_tool_call`, dan merutekan event Codex `PermissionRequest`
    melalui persetujuan OpenClaw. Hook `Stop` Codex diteruskan ke
    `before_agent_finalize` OpenClaw, tempat Plugin dapat meminta satu pass
    model lagi sebelum Codex memfinalisasi jawabannya. Relay tetap
    sengaja konservatif: relay tidak memutasi argumen alat native Codex
    atau menulis ulang catatan thread Codex. Gunakan ACP eksplisit hanya
    ketika Anda menginginkan model runtime/sesi ACP. Batas dukungan Codex
    tersemat didokumentasikan dalam
    [kontrak dukungan harness Codex v1](/id/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Lembar contekan pemilihan model / penyedia / runtime">
    - `openai-codex/*` — rute langganan/OAuth PI Codex.
    - `openai/*` plus `agentRuntime.id: "codex"` — runtime tersemat server aplikasi Codex native.
    - `/codex ...` — kontrol percakapan Codex native.
    - `/acp ...` atau `runtime: "acp"` — kontrol ACP/acpx eksplisit.

  </Accordion>
  <Accordion title="Pemicu bahasa alami untuk perutean ACP">
    Pemicu yang harus diarahkan ke runtime ACP:

    - "Jalankan ini sebagai sesi Claude Code ACP sekali jalan dan rangkum hasilnya."
    - "Gunakan Gemini CLI untuk tugas ini dalam sebuah thread, lalu pertahankan tindak lanjut di thread yang sama."
    - "Jalankan Codex melalui ACP di thread latar belakang."

    OpenClaw memilih `runtime: "acp"`, menyelesaikan harness `agentId`,
    mengikat ke percakapan atau thread saat ini bila didukung, dan
    merutekan tindak lanjut ke sesi tersebut hingga ditutup/kedaluwarsa. Codex hanya
    mengikuti jalur ini ketika ACP/acpx eksplisit atau Plugin Codex native
    tidak tersedia untuk operasi yang diminta.

    Untuk `sessions_spawn`, `runtime: "acp"` diiklankan hanya ketika ACP
    diaktifkan, peminta tidak berada dalam sandbox, dan backend runtime ACP
    dimuat. `acp.dispatch.enabled=false` menjeda dispatch thread ACP
    otomatis tetapi tidak menyembunyikan atau memblokir pemanggilan
    `sessions_spawn({ runtime: "acp" })` eksplisit. Ini menargetkan id harness ACP seperti `codex`,
    `claude`, `droid`, `gemini`, atau `opencode`. Jangan teruskan id agen
    konfigurasi OpenClaw normal dari `agents_list` kecuali entri tersebut
    dikonfigurasi secara eksplisit dengan `agents.list[].runtime.type="acp"`;
    jika tidak, gunakan runtime sub-agen default. Ketika agen OpenClaw
    dikonfigurasi dengan `runtime.type="acp"`, OpenClaw menggunakan
    `runtime.acp.agent` sebagai id harness dasar.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agen

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan **server aplikasi
Codex native** untuk pengikatan/kontrol percakapan Codex ketika Plugin `codex`
diaktifkan. Gunakan **sub-agen** saat Anda menginginkan
run delegasi native OpenClaw.

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
2. Plugin runtime `acpx` bawaan.
3. Adapter ACP Claude.
4. Mesin runtime/sesi sisi Claude.

ACP Claude adalah **sesi harness** dengan kontrol ACP, resume sesi,
pelacakan tugas latar belakang, dan pengikatan percakapan/thread opsional.

Backend CLI adalah runtime fallback lokal khusus teks yang terpisah — lihat
[Backend CLI](/id/gateway/cli-backends).

Untuk operator, aturan praktisnya adalah:

- **Ingin `/acp spawn`, sesi yang dapat diikat, kontrol runtime, atau pekerjaan harness persisten?** Gunakan ACP.
- **Ingin fallback teks lokal sederhana melalui CLI mentah?** Gunakan backend CLI.

## Sesi terikat

### Model mental

- **Permukaan chat** — tempat orang terus berbicara (channel Discord, topik Telegram, chat iMessage).
- **Sesi ACP** — status runtime Codex/Claude/Gemini tahan lama yang dirutekan OpenClaw.
- **Thread/topik anak** — permukaan pesan tambahan opsional yang dibuat hanya oleh `--thread ...`.
- **Workspace runtime** — lokasi filesystem (`cwd`, checkout repo, workspace backend) tempat harness berjalan. Independen dari permukaan chat.

### Pengikatan percakapan saat ini

`/acp spawn <harness> --bind here` menyematkan percakapan saat ini ke
sesi ACP yang di-spawn — tanpa thread anak, permukaan chat yang sama. OpenClaw tetap
menguasai transport, auth, keamanan, dan pengiriman. Pesan tindak lanjut dalam
percakapan itu dirutekan ke sesi yang sama; `/new` dan `/reset` mereset
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
    - `--bind here` hanya berfungsi pada channel yang mengiklankan pengikatan percakapan saat ini; OpenClaw mengembalikan pesan tidak didukung yang jelas jika tidak. Pengikatan bertahan lintas restart gateway.
    - Di Discord, `spawnAcpSessions` hanya diperlukan ketika OpenClaw perlu membuat thread anak untuk `--thread auto|here` — bukan untuk `--bind here`.
    - Jika Anda men-spawn ke agen ACP berbeda tanpa `--cwd`, OpenClaw mewarisi workspace **agen target** secara default. Path warisan yang hilang (`ENOENT`/`ENOTDIR`) fallback ke default backend; error akses lain (misalnya `EACCES`) muncul sebagai error spawn.
    - Perintah manajemen Gateway tetap lokal dalam percakapan terikat — perintah `/acp ...` ditangani oleh OpenClaw bahkan ketika teks tindak lanjut normal dirutekan ke sesi ACP terikat; `/status` dan `/unfocus` juga tetap lokal setiap kali penanganan perintah diaktifkan untuk permukaan tersebut.

  </Accordion>
  <Accordion title="Sesi terikat thread">
    Ketika pengikatan thread diaktifkan untuk adapter channel:

    - OpenClaw mengikat thread ke sesi ACP target.
    - Pesan tindak lanjut dalam thread tersebut dirutekan ke sesi ACP terikat.
    - Output ACP dikirim kembali ke thread yang sama.
    - Unfocus/tutup/arsip/idle-timeout atau kedaluwarsa max-age menghapus pengikatan.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, dan `/unfocus` adalah perintah Gateway, bukan prompt ke harness ACP.

    Feature flag yang diperlukan untuk ACP terikat thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` aktif secara default (atur `false` untuk menjeda dispatch thread ACP otomatis; pemanggilan `sessions_spawn({ runtime: "acp" })` eksplisit tetap berfungsi).
    - Flag spawn thread ACP adapter channel diaktifkan (spesifik adapter):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Dukungan pengikatan thread bersifat spesifik adapter. Jika adapter channel
    aktif tidak mendukung pengikatan thread, OpenClaw mengembalikan pesan
    tidak didukung/tidak tersedia yang jelas.

  </Accordion>
  <Accordion title="Channel yang mendukung thread">
    - Adapter channel apa pun yang mengekspos kapabilitas pengikatan sesi/thread.
    - Dukungan bawaan saat ini: thread/channel **Discord**, topik **Telegram** (topik forum dalam grup/supergrup dan topik DM).
    - Channel Plugin dapat menambahkan dukungan melalui antarmuka pengikatan yang sama.

  </Accordion>
</AccordionGroup>

## Pengikatan channel persisten

Untuk alur kerja non-ephemeral, konfigurasikan pengikatan ACP persisten dalam
entri tingkat atas `bindings[]`.

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
  Label opsional untuk operator.
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

**Prioritas override untuk sesi terikat ACP:**

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
- Pesan dalam channel atau topik tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan terikat, `/new` dan `/reset` mereset kunci sesi ACP yang sama di tempat.
- Pengikatan runtime sementara (misalnya dibuat oleh alur thread-focus) tetap berlaku bila ada.
- Untuk spawn ACP lintas agen tanpa `cwd` eksplisit, OpenClaw mewarisi workspace agen target dari konfigurasi agen.
- Path workspace warisan yang hilang fallback ke cwd default backend; kegagalan akses yang tidak hilang muncul sebagai error spawn.

## Memulai sesi ACP

Dua cara untuk memulai sesi ACP:

<Tabs>
  <Tab title="Dari sessions_spawn">
    Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agen atau
    pemanggilan alat.

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
    `runtime` default-nya adalah `subagent`, jadi tetapkan `runtime: "acp"` secara eksplisit
    untuk sesi ACP. Jika `agentId` dihilangkan, OpenClaw menggunakan
    `acp.defaultAgent` saat dikonfigurasi. `mode: "session"` memerlukan
    `thread: true` untuk menjaga percakapan terikat yang persisten.
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
  ID harness target ACP. Beralih ke `acp.defaultAgent` jika ditetapkan.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Meminta alur pengikatan thread jika didukung.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` bersifat sekali jalan; `"session"` bersifat persisten. Jika `thread: true` dan
  `mode` dihilangkan, OpenClaw dapat default ke perilaku persisten sesuai
  jalur runtime. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja runtime yang diminta (divalidasi oleh kebijakan
  backend/runtime). Jika dihilangkan, spawn ACP mewarisi ruang kerja agen target
  saat dikonfigurasi; jalur warisan yang hilang beralih ke default
  backend, sementara kesalahan akses nyata dikembalikan.
</ParamField>
<ParamField path="label" type="string">
  Label yang terlihat operator yang digunakan dalam teks sesi/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Lanjutkan sesi ACP yang sudah ada alih-alih membuat yang baru. Agen
  memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` mengalirkan ringkasan progres run ACP awal kembali ke
  sesi peminta sebagai peristiwa sistem. Respons yang diterima mencakup
  `streamLogPath` yang menunjuk ke log JSONL berskop sesi
  (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk riwayat relay lengkap.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Membatalkan giliran child ACP setelah N detik. `0` menjaga giliran tetap pada
  jalur tanpa batas waktu milik gateway. Nilai yang sama diterapkan ke run Gateway
  dan runtime ACP sehingga harness yang macet/kehabisan kuota tidak
  menempati jalur agen induk tanpa batas.
</ParamField>
<ParamField path="model" type="string">
  Override model eksplisit untuk sesi child ACP. Spawn Codex ACP
  menormalisasi ref OpenClaw Codex seperti `openai-codex/gpt-5.4` ke konfigurasi
  startup Codex ACP sebelum `session/new`; bentuk slash seperti
  `openai-codex/gpt-5.4/high` juga menetapkan effort penalaran Codex ACP.
  Harness lain harus mengiklankan ACP `models` dan mendukung
  `session/set_model`; jika tidak, OpenClaw/acpx gagal dengan jelas alih-alih
  diam-diam beralih ke default agen target.
</ParamField>
<ParamField path="thinking" type="string">
  Effort berpikir/penalaran eksplisit. Untuk Codex ACP, `minimal` dipetakan ke
  effort rendah, `low`/`medium`/`high`/`xhigh` dipetakan langsung, dan `off`
  menghilangkan override startup reasoning-effort.
</ParamField>

## Mode pengikatan dan thread spawn

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
    | `here` | Wajibkan thread aktif saat ini; gagal jika tidak berada di dalamnya.                                                  |
    | `off`  | Tanpa pengikatan. Sesi dimulai tanpa ikatan.                                                                 |

    Catatan:

    - Pada permukaan pengikatan non-thread, perilaku default secara efektif adalah `off`.
    - Spawn yang terikat thread memerlukan dukungan kebijakan channel:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Gunakan `--bind here` saat Anda ingin menambatkan percakapan saat ini tanpa membuat thread child.

  </Tab>
</Tabs>

## Model pengiriman

Sesi ACP dapat berupa ruang kerja interaktif atau pekerjaan latar belakang
milik induk. Jalur pengiriman bergantung pada bentuk tersebut.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Sesi interaktif dimaksudkan untuk terus berbicara pada permukaan chat
    yang terlihat:

    - `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
    - `/acp spawn ... --thread ...` mengikat thread/topik channel ke sesi ACP.
    - `bindings[].type="acp"` terkonfigurasi persisten merutekan percakapan yang cocok ke sesi ACP yang sama.

    Pesan lanjutan dalam percakapan terikat dirutekan langsung ke
    sesi ACP, dan output ACP dikirim kembali ke
    channel/thread/topik yang sama.

    Yang dikirim OpenClaw ke harness:

    - Lanjutan terikat normal dikirim sebagai teks prompt, plus lampiran hanya saat harness/backend mendukungnya.
    - Perintah manajemen `/acp` dan perintah Gateway lokal dicegat sebelum pengiriman ACP.
    - Peristiwa penyelesaian yang dihasilkan runtime diwujudkan per target. Agen OpenClaw mendapatkan amplop runtime-context internal OpenClaw; harness ACP eksternal mendapatkan prompt biasa dengan hasil child dan instruksi. Amplop mentah `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` tidak boleh pernah dikirim ke harness eksternal atau dipersistenkan sebagai teks transkrip pengguna ACP.
    - Entri transkrip ACP menggunakan teks pemicu yang terlihat pengguna atau prompt penyelesaian biasa. Metadata peristiwa internal tetap terstruktur di OpenClaw jika memungkinkan dan tidak diperlakukan sebagai konten chat yang ditulis pengguna.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Sesi ACP sekali jalan yang di-spawn oleh run agen lain adalah child
    latar belakang, mirip sub-agen:

    - Induk meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Child berjalan dalam sesi harness ACP-nya sendiri.
    - Giliran child berjalan pada jalur latar belakang yang sama yang digunakan oleh spawn sub-agen native, sehingga harness ACP yang lambat tidak memblokir pekerjaan sesi utama yang tidak terkait.
    - Laporan penyelesaian kembali melalui jalur pengumuman penyelesaian tugas. OpenClaw mengonversi metadata penyelesaian internal menjadi prompt ACP biasa sebelum mengirimkannya ke harness eksternal, sehingga harness tidak melihat penanda konteks runtime khusus OpenClaw.
    - Induk menulis ulang hasil child dengan suara asisten normal saat balasan yang terlihat pengguna berguna.

    **Jangan** perlakukan jalur ini sebagai chat peer-to-peer antara induk
    dan child. Child sudah memiliki channel penyelesaian kembali ke
    induk.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` dapat menargetkan sesi lain setelah spawn. Untuk sesi
    peer normal, OpenClaw menggunakan jalur lanjutan agent-to-agent (A2A)
    setelah menyuntikkan pesan:

    - Tunggu balasan sesi target.
    - Secara opsional, biarkan peminta dan target bertukar sejumlah giliran lanjutan yang dibatasi.
    - Minta target menghasilkan pesan pengumuman.
    - Kirim pengumuman tersebut ke channel atau thread yang terlihat.

    Jalur A2A tersebut adalah fallback untuk pengiriman peer ketika pengirim memerlukan
    lanjutan yang terlihat. Jalur ini tetap aktif saat sesi yang tidak terkait dapat
    melihat dan mengirim pesan ke target ACP, misalnya di bawah pengaturan
    `tools.sessions.visibility` yang luas.

    OpenClaw melewati lanjutan A2A hanya saat peminta adalah
    induk dari child ACP sekali jalan milik induknya sendiri. Dalam kasus itu,
    menjalankan A2A di atas penyelesaian tugas dapat membangunkan induk dengan
    hasil child, meneruskan balasan induk kembali ke child, dan
    membuat loop echo induk/child. Hasil `sessions_send` melaporkan
    `delivery.status="skipped"` untuk kasus child yang dimiliki tersebut karena
    jalur penyelesaian sudah bertanggung jawab atas hasilnya.

  </Accordion>
  <Accordion title="Resume an existing session">
    Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih
    memulai baru. Agen memutar ulang riwayat percakapannya melalui
    `session/load`, sehingga ia melanjutkan dengan konteks penuh tentang apa yang terjadi sebelumnya.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Kasus penggunaan umum:

    - Serahkan sesi Codex dari laptop Anda ke ponsel Anda — beri tahu agen Anda untuk melanjutkan dari titik terakhir.
    - Lanjutkan sesi coding yang Anda mulai secara interaktif di CLI, kini secara headless melalui agen Anda.
    - Lanjutkan pekerjaan yang terputus oleh restart gateway atau batas waktu idle.

    Catatan:

    - `resumeSessionId` hanya berlaku saat `runtime: "acp"`; runtime sub-agen default mengabaikan field khusus ACP ini.
    - `streamTo` hanya berlaku saat `runtime: "acp"`; runtime sub-agen default mengabaikan field khusus ACP ini.
    - `resumeSessionId` adalah ID lanjutkan ACP/harness lokal host, bukan kunci sesi channel OpenClaw; OpenClaw tetap memeriksa kebijakan spawn ACP dan kebijakan agen target sebelum pengiriman, sementara backend atau harness ACP memiliki otorisasi untuk memuat ID upstream tersebut.
    - `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal untuk sesi OpenClaw baru yang Anda buat, jadi `mode: "session"` tetap memerlukan `thread: true`.
    - Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
    - Jika ID sesi tidak ditemukan, spawn gagal dengan kesalahan yang jelas — tanpa fallback diam-diam ke sesi baru.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Setelah deploy gateway, jalankan pemeriksaan live end-to-end alih-alih
    hanya mempercayai unit test:

    1. Verifikasi versi gateway dan commit yang di-deploy pada host target.
    2. Buka sesi bridge ACPX sementara ke agen live.
    3. Minta agen tersebut memanggil `sessions_spawn` dengan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, dan tugas `Reply with exactly LIVE-ACP-SPAWN-OK`.
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
- Kebijakan isolasi OpenClaw **tidak** membungkus eksekusi harness ACP.
- OpenClaw tetap memberlakukan gerbang fitur ACP, agen yang diizinkan, kepemilikan sesi, pengikatan kanal, dan kebijakan pengiriman Gateway.
- Gunakan `runtime: "subagent"` untuk pekerjaan native OpenClaw yang diberlakukan isolasinya.

</Warning>

Batasan saat ini:

- Jika sesi pemohon berada dalam isolasi, spawn ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
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
3. Fallback sesi pemohon saat ini.

Pengikatan percakapan saat ini dan pengikatan utas sama-sama berpartisipasi dalam
langkah 2.

Jika tidak ada target yang teresolusi, OpenClaw mengembalikan error yang jelas
(`Unable to resolve session target: ...`).

## Kontrol ACP

| Perintah             | Yang dilakukan                                           | Contoh                                                        |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Buat sesi ACP; pengikatan saat ini atau utas opsional.   | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Batalkan giliran yang sedang berjalan untuk sesi target. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Kirim instruksi pengarah ke sesi yang berjalan.          | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Tutup sesi dan lepas pengikatan target utas.             | `/acp close`                                                  |
| `/acp status`        | Tampilkan backend, mode, status, opsi runtime, kemampuan. | `/acp status`                                                 |
| `/acp set-mode`      | Atur mode runtime untuk sesi target.                     | `/acp set-mode plan`                                          |
| `/acp set`           | Tulis opsi konfigurasi runtime generik.                  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Atur override direktori kerja runtime.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Atur profil kebijakan persetujuan.                       | `/acp permissions strict`                                     |
| `/acp timeout`       | Atur batas waktu runtime (detik).                        | `/acp timeout 120`                                            |
| `/acp model`         | Atur override model runtime.                             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Hapus override opsi runtime sesi.                        | `/acp reset-options`                                          |
| `/acp sessions`      | Cantumkan sesi ACP terbaru dari penyimpanan.             | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kemampuan, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                                 |
| `/acp install`       | Cetak langkah instalasi dan pengaktifan deterministik.   | `/acp install`                                                |

`/acp status` menampilkan opsi runtime efektif beserta pengenal sesi tingkat runtime dan
tingkat backend. Error kontrol yang tidak didukung ditampilkan
dengan jelas saat backend tidak memiliki suatu kemampuan. `/acp sessions` membaca
penyimpanan untuk sesi terikat saat ini atau sesi pemohon; token target
(`session-key`, `session-id`, atau `session-label`) diresolusikan melalui
penemuan sesi gateway, termasuk root `session.store` per agen kustom.

### Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik. Operasi
ekuivalen:

| Perintah                     | Dipetakan ke                         | Catatan                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | kunci konfigurasi runtime `model`    | Untuk Codex ACP, OpenClaw menormalisasi `openai-codex/<model>` ke id model adaptor dan memetakan sufiks reasoning slash seperti `openai-codex/gpt-5.4/high` ke `reasoning_effort`. |
| `/acp set thinking <level>`  | kunci konfigurasi runtime `thinking` | Untuk Codex ACP, OpenClaw mengirim `reasoning_effort` yang sesuai ketika adaptor mendukungnya.                                                                                 |
| `/acp permissions <profile>` | kunci konfigurasi runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | kunci konfigurasi runtime `timeout`  | —                                                                                                                                                                              |
| `/acp cwd <path>`            | override cwd runtime                 | Pembaruan langsung.                                                                                                                                                           |
| `/acp set <key> <value>`     | generik                              | `key=cwd` menggunakan jalur override cwd.                                                                                                                                      |
| `/acp reset-options`         | menghapus semua override runtime     | —                                                                                                                                                                              |

## Harness acpx, penyiapan Plugin, dan izin

Untuk konfigurasi harness acpx (alias Claude Code / Codex / Gemini CLI
), jembatan MCP plugin-tools dan OpenClaw-tools, serta mode
izin ACP, lihat
[Agen ACP — penyiapan](/id/tools/acp-agents-setup).

## Pemecahan masalah

| Gejala                                                                     | Kemungkinan penyebab                                                                                                           | Perbaikan                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang, dinonaktifkan, atau diblokir oleh `plugins.allow`.                                                       | Instal dan aktifkan Plugin backend, sertakan `acpx` dalam `plugins.allow` saat daftar izin tersebut disetel, lalu jalankan `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                                                                 | Setel `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch otomatis dari pesan thread normal dinonaktifkan.                                                               | Setel `acp.dispatch.enabled=true` untuk melanjutkan perutean thread otomatis; panggilan eksplisit `sessions_spawn({ runtime: "acp" })` tetap berfungsi.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agen tidak ada dalam daftar izin.                                                                                                | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` melaporkan backend belum siap tepat setelah startup                 | Probe dependensi Plugin atau perbaikan mandiri masih berjalan.                                                               | Tunggu sebentar dan jalankan ulang `/acp doctor`; jika tetap tidak sehat, periksa kesalahan instalasi backend dan kebijakan izinkan/tolak Plugin.                                             |
| Perintah harness tidak ditemukan                                                   | CLI adapter belum terinstal, dependensi Plugin yang di-stage hilang, atau pengambilan `npx` pertama kali gagal untuk adapter non-Codex. | Jalankan `/acp doctor`, perbaiki dependensi Plugin, instal/prahangatkan adapter pada host Gateway, atau konfigurasikan perintah agen acpx secara eksplisit.                          |
| Model-not-found dari harness                                            | ID model valid untuk provider/harness lain tetapi bukan target ACP ini.                                                | Gunakan model yang tercantum oleh harness tersebut, konfigurasikan model di harness, atau hilangkan override.                                                                            |
| Kesalahan autentikasi vendor dari harness                                          | OpenClaw sehat, tetapi CLI/provider target belum login.                                                     | Login atau sediakan kunci provider yang diperlukan pada lingkungan host Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token key/id/label salah.                                                                                                | Jalankan `/acp sessions`, salin key/label yang tepat, lalu coba lagi.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang dapat di-bind.                                                            | Pindah ke chat/channel target dan coba lagi, atau gunakan spawn tanpa bind.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter tidak memiliki kapabilitas binding ACP percakapan saat ini.                                                             | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` tingkat atas, atau pindah ke channel yang didukung.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks thread.                                                                         | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target binding aktif.                                                                           | Rebind sebagai pemilik atau gunakan percakapan atau thread lain.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adapter tidak memiliki kapabilitas binding thread.                                                                               | Gunakan `--thread off` atau pindah ke adapter/channel yang didukung.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi pemohon berada dalam sandbox.                                                              | Gunakan `runtime="subagent"` dari sesi sandbox, atau jalankan spawn ACP dari sesi non-sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                                                         | Gunakan `runtime="subagent"` untuk sandboxing wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi non-sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Harness target tidak mengekspos perpindahan model ACP generik.                                                        | Gunakan harness yang mengiklankan ACP `models`/`session/set_model`, gunakan referensi model ACP Codex, atau konfigurasikan model langsung di harness jika memiliki flag startup sendiri. |
| Metadata ACP hilang untuk sesi yang di-bind                                      | Metadata sesi ACP kedaluwarsa/dihapus.                                                                                    | Buat ulang dengan `/acp spawn`, lalu rebind/fokuskan thread.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir penulisan/exec dalam sesi ACP non-interaktif.                                                    | Setel `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan mulai ulang gateway. Lihat [Konfigurasi izin](/id/tools/acp-agents-setup#permission-configuration). |
| Sesi ACP gagal sejak awal dengan sedikit output                                  | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.                                        | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, setel `permissionMode=approve-all`; untuk degradasi yang mulus, setel `nonInteractivePermissions=deny`.        |
| Sesi ACP macet tanpa batas setelah menyelesaikan pekerjaan                       | Proses harness selesai tetapi sesi ACP tidak melaporkan penyelesaian.                                                    | Pantau dengan `ps aux \| grep acpx`; hentikan proses kedaluwarsa secara manual.                                                                                                       |
| Harness melihat `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Envelope peristiwa internal bocor melewati batas ACP.                                                                | Perbarui OpenClaw dan jalankan ulang alur penyelesaian; harness eksternal seharusnya hanya menerima prompt penyelesaian polos.                                                          |

## Terkait

- [Agen ACP — penyiapan](/id/tools/acp-agents-setup)
- [Kirim agen](/id/tools/agent-send)
- [Backend CLI](/id/gateway/cli-backends)
- [Harness Codex](/id/plugins/codex-harness)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode bridge)](/id/cli/acp)
- [Sub-agen](/id/tools/subagents)
