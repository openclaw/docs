---
read_when:
    - Menjalankan harness coding melalui ACP
    - Menyiapkan sesi ACP yang terikat percakapan pada saluran perpesanan
    - Mengikat percakapan saluran pesan ke sesi ACP persisten
    - Memecahkan masalah backend ACP, pengkabelan Plugin, atau pengiriman penyelesaian
    - Menjalankan perintah `/acp` dari chat
sidebarTitle: ACP agents
summary: Jalankan harness coding eksternal (Claude Code, Cursor, Gemini CLI, Codex ACP eksplisit, OpenClaw ACP, OpenCode) melalui backend ACP
title: agen ACP
x-i18n:
    generated_at: "2026-04-26T11:39:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

sesi [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
membiarkan OpenClaw menjalankan harness coding eksternal (misalnya Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain
yang didukung) melalui Plugin backend ACP.

Setiap spawn sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

<Note>
**ACP adalah jalur harness eksternal, bukan jalur Codex default.** Plugin
app-server Codex native memiliki kontrol `/codex ...` dan runtime
tersemat `agentRuntime.id: "codex"`; ACP memiliki
kontrol `/acp ...` dan sesi `sessions_spawn({ runtime: "acp" })`.

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal
langsung ke percakapan saluran OpenClaw yang sudah ada, gunakan
[`openclaw mcp serve`](/id/cli/mcp) alih-alih ACP.
</Note>

## Halaman mana yang saya butuhkan?

| Anda ingin…                                                                                    | Gunakan ini                           | Catatan                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mengikat atau mengontrol Codex di percakapan saat ini                                         | `/codex bind`, `/codex threads`       | Jalur app-server Codex native saat Plugin `codex` diaktifkan; mencakup balasan chat terikat, penerusan gambar, model/cepat/izin, stop, dan kontrol pengarah. ACP adalah fallback eksplisit |
| Menjalankan Claude Code, Gemini CLI, Codex ACP eksplisit, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini                           | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime                                                                                |
| Mengekspos sesi OpenClaw Gateway _sebagai_ server ACP untuk editor atau klien                 | [`openclaw acp`](/id/cli/acp)            | Mode jembatan. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                                                                                                   |
| Menggunakan ulang AI CLI lokal sebagai model fallback hanya teks                              | [Backend CLI](/id/gateway/cli-backends)  | Bukan ACP. Tidak ada alat OpenClaw, tidak ada kontrol ACP, tidak ada runtime harness                                                                                                        |

## Apakah ini berfungsi langsung tanpa konfigurasi tambahan?

Biasanya ya. Instalasi baru mengirimkan Plugin runtime `acpx` bawaan dalam keadaan aktif
secara default dengan biner `acpx` yang dipin secara lokal pada Plugin yang diprobe
dan diperbaiki sendiri oleh OpenClaw saat startup. Jalankan `/acp doctor` untuk pemeriksaan kesiapan.

OpenClaw hanya mengajarkan agen tentang spawn ACP saat ACP **benar-benar
dapat digunakan**: ACP harus diaktifkan, dispatch tidak boleh dinonaktifkan, sesi
saat ini tidak boleh diblokir sandbox, dan backend runtime harus
dimuat. Jika kondisi tersebut tidak terpenuhi, Skills Plugin ACP dan
panduan ACP `sessions_spawn` tetap disembunyikan agar agen tidak menyarankan
backend yang tidak tersedia.

<AccordionGroup>
  <Accordion title="Kendala umum saat pertama kali dijalankan">
    - Jika `plugins.allow` diatur, itu adalah inventaris Plugin yang membatasi dan **harus** menyertakan `acpx`; jika tidak, bawaan yang dibundel memang sengaja diblokir dan `/acp doctor` melaporkan entri allowlist yang hilang.
    - Adaptor harness target (Codex, Claude, dll.) dapat diambil sesuai kebutuhan dengan `npx` saat pertama kali Anda menggunakannya.
    - Autentikasi vendor tetap harus tersedia di host untuk harness tersebut.
    - Jika host tidak memiliki npm atau akses jaringan, pengambilan adaptor saat pertama kali dijalankan akan gagal sampai cache dipanaskan sebelumnya atau adaptor dipasang dengan cara lain.
  </Accordion>
  <Accordion title="Prasyarat runtime">
    ACP meluncurkan proses harness eksternal nyata. OpenClaw memiliki
    perutean, status tugas latar belakang, pengiriman, binding, dan kebijakan; harness
    memiliki login provider, katalog model, perilaku sistem berkas, dan
    alat native-nya sendiri.

    Sebelum menyalahkan OpenClaw, verifikasi:

    - `/acp doctor` melaporkan backend yang aktif dan sehat.
    - id target diizinkan oleh `acp.allowedAgents` saat allowlist tersebut diatur.
    - Perintah harness target dapat dimulai di host Gateway.
    - Autentikasi provider tersedia untuk harness tersebut (`claude`, `codex`, `gemini`, `opencode`, `droid`, dll.).
    - Model yang dipilih ada untuk harness tersebut — id model tidak portabel antar harness.
    - `cwd` yang diminta ada dan dapat diakses, atau hilangkan `cwd` dan biarkan backend menggunakan default-nya.
    - Mode izin sesuai dengan pekerjaannya. Sesi non-interaktif tidak dapat mengeklik prompt izin native, jadi proses coding yang banyak menulis/mengeksekusi biasanya memerlukan profil izin ACPX yang dapat berjalan tanpa interaksi.

  </Accordion>
</AccordionGroup>

Alat Plugin OpenClaw dan alat OpenClaw bawaan **tidak** diekspos ke
harness ACP secara default. Aktifkan jembatan MCP eksplisit di
[agen ACP — penyiapan](/id/tools/acp-agents-setup) hanya saat harness
harus memanggil alat tersebut secara langsung.

## Target harness yang didukung

Dengan backend `acpx` bawaan, gunakan id harness ini sebagai target
`/acp spawn <id>` atau `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| id harness | Backend umum                                   | Catatan                                                                            |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `claude`   | Adaptor ACP Claude Code                        | Memerlukan autentikasi Claude Code di host.                                        |
| `codex`    | Adaptor ACP Codex                              | Fallback ACP eksplisit hanya saat `/codex` native tidak tersedia atau ACP diminta. |
| `copilot`  | Adaptor ACP GitHub Copilot                     | Memerlukan autentikasi CLI/runtime Copilot.                                        |
| `cursor`   | ACP Cursor CLI (`cursor-agent acp`)            | Override perintah acpx jika instalasi lokal mengekspos entrypoint ACP yang berbeda. |
| `droid`    | CLI Factory Droid                              | Memerlukan autentikasi Factory/Droid atau `FACTORY_API_KEY` di lingkungan harness. |
| `gemini`   | Adaptor ACP Gemini CLI                         | Memerlukan autentikasi Gemini CLI atau penyiapan API key.                          |
| `iflow`    | iFlow CLI                                      | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terpasang.         |
| `kilocode` | Kilo Code CLI                                  | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terpasang.         |
| `kimi`     | CLI Kimi/Moonshot                              | Memerlukan autentikasi Kimi/Moonshot di host.                                      |
| `kiro`     | Kiro CLI                                       | Ketersediaan adaptor dan kontrol model bergantung pada CLI yang terpasang.         |
| `opencode` | Adaptor ACP OpenCode                           | Memerlukan autentikasi CLI/provider OpenCode.                                      |
| `openclaw` | Jembatan OpenClaw Gateway melalui `openclaw acp` | Memungkinkan harness yang mendukung ACP berbicara kembali ke sesi OpenClaw Gateway. |
| `pi`       | Runtime OpenClaw Pi/tersemat                   | Digunakan untuk eksperimen harness native OpenClaw.                                |
| `qwen`     | Qwen Code / Qwen CLI                           | Memerlukan autentikasi yang kompatibel dengan Qwen di host.                        |

Alias agen acpx kustom dapat dikonfigurasi di acpx itu sendiri, tetapi
kebijakan OpenClaw tetap memeriksa `acp.allowedAgents` dan pemetaan
`agents.list[].runtime.acp.agent` sebelum dispatch.

## Runbook operator

Alur cepat `/acp` dari chat:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, atau
    `/acp spawn codex --bind here` secara eksplisit.
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
  <Step title="Arahkan">
    Tanpa mengganti konteks: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Hentikan">
    `/acp cancel` (giliran saat ini) atau `/acp close` (sesi + binding).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Detail siklus hidup">
    - Spawn membuat atau melanjutkan sesi runtime ACP, merekam metadata ACP di penyimpanan sesi OpenClaw, dan dapat membuat tugas latar belakang saat eksekusi dimiliki parent.
    - Pesan tindak lanjut yang terikat langsung masuk ke sesi ACP sampai binding ditutup, dilepas fokusnya, direset, atau kedaluwarsa.
    - Perintah Gateway tetap lokal. `/acp ...`, `/status`, dan `/unfocus` tidak pernah dikirim sebagai teks prompt normal ke harness ACP yang terikat.
    - `cancel` membatalkan giliran aktif saat backend mendukung pembatalan; ini tidak menghapus metadata binding atau sesi.
    - `close` mengakhiri sesi ACP dari sudut pandang OpenClaw dan menghapus binding. Harness mungkin masih menyimpan riwayat upstream-nya sendiri jika mendukung resume.
    - Worker runtime yang idle memenuhi syarat untuk dibersihkan setelah `acp.runtime.ttlMinutes`; metadata sesi yang tersimpan tetap tersedia untuk `/acp sessions`.
  </Accordion>
  <Accordion title="Aturan perutean Codex native">
    Pemicu bahasa alami yang harus dirutekan ke **Plugin Codex
    native** saat diaktifkan:

    - "Ikat saluran Discord ini ke Codex."
    - "Lampirkan chat ini ke thread Codex `<id>`."
    - "Tampilkan thread Codex, lalu ikat yang ini."

    Binding percakapan Codex native adalah jalur kontrol chat default.
    Alat dinamis OpenClaw tetap dieksekusi melalui OpenClaw, sementara
    alat native Codex seperti shell/apply-patch dieksekusi di dalam Codex.
    Untuk peristiwa alat native Codex, OpenClaw menyuntikkan relay hook
    native per giliran sehingga hook Plugin dapat memblokir `before_tool_call`, mengamati
    `after_tool_call`, dan merutekan peristiwa Codex `PermissionRequest`
    melalui persetujuan OpenClaw. Hook Codex `Stop` diteruskan ke
    OpenClaw `before_agent_finalize`, tempat Plugin dapat meminta satu kali lagi
    model pass sebelum Codex memfinalisasi jawabannya. Relay ini tetap
    sengaja konservatif: relay ini tidak memutasi argumen alat native Codex
    atau menulis ulang catatan thread Codex. Gunakan ACP eksplisit hanya
    saat Anda menginginkan model runtime/sesi ACP. Batas dukungan Codex
    tersemat didokumentasikan dalam
    [kontrak dukungan Codex harness v1](/id/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Lembar ringkas pemilihan model / provider / runtime">
    - `openai-codex/*` — rute OAuth/langganan PI Codex.
    - `openai/*` plus `agentRuntime.id: "codex"` — runtime tersemat app-server Codex native.
    - `/codex ...` — kontrol percakapan Codex native.
    - `/acp ...` atau `runtime: "acp"` — kontrol ACP/acpx eksplisit.
  </Accordion>
  <Accordion title="Pemicu bahasa alami perutean ACP">
    Pemicu yang harus dirutekan ke runtime ACP:

    - "Jalankan ini sebagai sesi ACP Claude Code sekali jalan dan rangkum hasilnya."
    - "Gunakan Gemini CLI untuk tugas ini dalam sebuah thread, lalu simpan tindak lanjut di thread yang sama."
    - "Jalankan Codex melalui ACP di thread latar belakang."

    OpenClaw memilih `runtime: "acp"`, menyelesaikan `agentId` harness,
mengikat ke percakapan atau thread saat ini jika didukung, dan
merutekan tindak lanjut ke sesi tersebut sampai ditutup/kedaluwarsa. Codex hanya
mengikuti jalur ini saat ACP/acpx eksplisit atau Plugin Codex native
tidak tersedia untuk operasi yang diminta.

Untuk `sessions_spawn`, `runtime: "acp"` hanya diumumkan saat ACP
diaktifkan, peminta tidak disandbox, dan backend runtime ACP
dimuat. Ini menargetkan id harness ACP seperti `codex`,
`claude`, `droid`, `gemini`, atau `opencode`. Jangan berikan id agen config
OpenClaw biasa dari `agents_list` kecuali entri tersebut
secara eksplisit dikonfigurasi dengan `agents.list[].runtime.type="acp"`;
jika tidak, gunakan runtime sub-agen default. Saat agen OpenClaw
dikonfigurasi dengan `runtime.type="acp"`, OpenClaw menggunakan
`runtime.acp.agent` sebagai id harness yang mendasarinya.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agen

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan **app-server Codex
native** untuk binding/kontrol percakapan Codex saat Plugin `codex`
diaktifkan. Gunakan **sub-agen** saat Anda menginginkan
eksekusi delegasi native OpenClaw.

| Area          | Sesi ACP                             | Eksekusi sub-agen                  |
| ------------- | ------------------------------------ | ---------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)   | Runtime sub-agen native OpenClaw   |
| Kunci sesi    | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>`  |
| Perintah utama| `/acp ...`                           | `/subagents ...`                   |
| Alat spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agen](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, susunannya adalah:

1. Control plane sesi ACP OpenClaw.
2. Plugin runtime `acpx` bawaan.
3. Adaptor ACP Claude.
4. Mekanisme runtime/sesi sisi Claude.

Claude ACP adalah **sesi harness** dengan kontrol ACP, resume sesi,
pelacakan tugas latar belakang, dan binding percakapan/thread opsional.

Backend CLI adalah runtime fallback lokal hanya teks yang terpisah — lihat
[Backend CLI](/id/gateway/cli-backends).

Bagi operator, aturan praktisnya adalah:

- **Ingin `/acp spawn`, sesi yang dapat diikat, kontrol runtime, atau pekerjaan harness persisten?** Gunakan ACP.
- **Ingin fallback teks lokal sederhana melalui CLI mentah?** Gunakan backend CLI.

## Sesi terikat

### Model mental

- **Permukaan chat** — tempat orang terus berbicara (saluran Discord, topik Telegram, chat iMessage).
- **Sesi ACP** — status runtime Codex/Claude/Gemini tahan lama yang dirutekan oleh OpenClaw.
- **Thread/topik anak** — permukaan pesan tambahan opsional yang dibuat hanya oleh `--thread ...`.
- **Ruang kerja runtime** — lokasi sistem berkas (`cwd`, checkout repo, ruang kerja backend) tempat harness berjalan. Independen dari permukaan chat.

### Binding percakapan saat ini

`/acp spawn <harness> --bind here` menyematkan percakapan saat ini ke
sesi ACP yang di-spawn — tanpa thread anak, permukaan chat yang sama. OpenClaw tetap
memiliki transport, autentikasi, keamanan, dan pengiriman. Pesan tindak lanjut dalam
percakapan itu dirutekan ke sesi yang sama; `/new` dan `/reset` mereset
sesi di tempat; `/acp close` menghapus binding.

Contoh:

```text
/codex bind                                              # binding Codex native, rute pesan mendatang ke sini
/codex model gpt-5.4                                     # sesuaikan thread Codex native yang terikat
/codex stop                                              # kontrol giliran Codex native yang aktif
/acp spawn codex --bind here                             # fallback ACP eksplisit untuk Codex
/acp spawn codex --thread auto                           # dapat membuat thread/topik anak dan mengikat di sana
/acp spawn codex --bind here --cwd /workspace/repo       # binding chat yang sama, Codex berjalan di /workspace/repo
```

<AccordionGroup>
  <Accordion title="Aturan binding dan eksklusivitas">
    - `--bind here` dan `--thread ...` saling eksklusif.
    - `--bind here` hanya berfungsi pada saluran yang mengiklankan binding percakapan saat ini; jika tidak, OpenClaw mengembalikan pesan tidak didukung yang jelas. Binding tetap ada setelah restart gateway.
    - Di Discord, `spawnAcpSessions` hanya diperlukan saat OpenClaw perlu membuat thread anak untuk `--thread auto|here` — tidak untuk `--bind here`.
    - Jika Anda melakukan spawn ke agen ACP yang berbeda tanpa `--cwd`, OpenClaw mewarisi ruang kerja **agen target** secara default. Jalur turunan yang hilang (`ENOENT`/`ENOTDIR`) fallback ke default backend; kesalahan akses lain (misalnya `EACCES`) ditampilkan sebagai kesalahan spawn.
    - Perintah manajemen Gateway tetap lokal di percakapan terikat — perintah `/acp ...` ditangani oleh OpenClaw meskipun teks tindak lanjut normal dirutekan ke sesi ACP yang terikat; `/status` dan `/unfocus` juga tetap lokal kapan pun penanganan perintah diaktifkan untuk permukaan tersebut.
  </Accordion>
  <Accordion title="Sesi terikat thread">
    Saat binding thread diaktifkan untuk adaptor saluran:

    - OpenClaw mengikat thread ke sesi ACP target.
    - Pesan tindak lanjut di thread tersebut dirutekan ke sesi ACP yang terikat.
    - Keluaran ACP dikirim kembali ke thread yang sama.
    - Lepas fokus/tutup/arsip/idle-timeout atau kedaluwarsa usia maksimum menghapus binding.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, dan `/unfocus` adalah perintah Gateway, bukan prompt ke harness ACP.

    Flag fitur yang diperlukan untuk ACP terikat thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` aktif secara default (atur `false` untuk menjeda dispatch ACP).
    - Flag spawn thread ACP adaptor saluran diaktifkan (khusus adaptor):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Dukungan binding thread bersifat khusus adaptor. Jika adaptor
    saluran aktif tidak mendukung binding thread, OpenClaw mengembalikan
    pesan tidak didukung/tidak tersedia yang jelas.

  </Accordion>
  <Accordion title="Saluran yang mendukung thread">
    - Adaptor saluran apa pun yang mengekspos kemampuan binding sesi/thread.
    - Dukungan bawaan saat ini: thread/saluran **Discord**, topik **Telegram** (topik forum di grup/supergrup dan topik DM).
    - Saluran Plugin dapat menambahkan dukungan melalui antarmuka binding yang sama.
  </Accordion>
</AccordionGroup>

## Binding saluran persisten

Untuk alur kerja non-ephemeral, konfigurasikan binding ACP persisten di
entri `bindings[]` tingkat atas.

### Model binding

<ParamField path="bindings[].type" type='"acp"'>
  Menandai binding percakapan ACP persisten.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Mengidentifikasi percakapan target. Bentuk per saluran:

- **Saluran/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Topik forum Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/grup BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Utamakan `chat_id:*` atau `chat_identifier:*` untuk binding grup yang stabil.
- **DM/grup iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Utamakan `chat_id:*` untuk binding grup yang stabil.
</ParamField>
  <ParamField path="bindings[].agentId" type="string">
  id agen OpenClaw pemilik.
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Override ACP opsional.
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  Label opsional yang ditujukan untuk operator.
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
- Pesan di saluran atau topik tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan terikat, `/new` dan `/reset` mereset kunci sesi ACP yang sama di tempat.
- Binding runtime sementara (misalnya dibuat oleh alur fokus thread) tetap berlaku jika ada.
- Untuk spawn ACP lintas agen tanpa `cwd` eksplisit, OpenClaw mewarisi ruang kerja agen target dari config agen.
- Jalur ruang kerja turunan yang hilang fallback ke `cwd` default backend; kegagalan akses non-hilang ditampilkan sebagai kesalahan spawn.

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
    `runtime` default-nya `subagent`, jadi atur `runtime: "acp"` secara eksplisit
    untuk sesi ACP. Jika `agentId` dihilangkan, OpenClaw menggunakan
    `acp.defaultAgent` jika dikonfigurasi. `mode: "session"` memerlukan
    `thread: true` untuk mempertahankan percakapan terikat yang persisten.
    </Note>

  </Tab>
  <Tab title="Dari perintah /acp">
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
  id harness target ACP. Fallback ke `acp.defaultAgent` jika diatur.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Minta alur binding thread jika didukung.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` adalah sekali jalan; `"session"` bersifat persisten. Jika `thread: true` dan
  `mode` dihilangkan, OpenClaw dapat default ke perilaku persisten per
  jalur runtime. `mode: "session"` memerlukan `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime
  ). Jika dihilangkan, spawn ACP mewarisi ruang kerja agen target
  saat dikonfigurasi; jalur turunan yang hilang fallback ke default
  backend, sedangkan kesalahan akses yang nyata dikembalikan.
</ParamField>
<ParamField path="label" type="string">
  Label yang ditujukan untuk operator yang digunakan dalam teks sesi/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Lanjutkan sesi ACP yang sudah ada alih-alih membuat yang baru. Agen
  memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` mengalirkan ringkasan progres eksekusi ACP awal kembali ke
  sesi peminta sebagai peristiwa sistem. Respons yang diterima mencakup
  `streamLogPath` yang menunjuk ke log JSONL dengan cakupan sesi
  (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk seluruh riwayat relay.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Membatalkan giliran anak ACP setelah N detik. `0` menjaga giliran tetap pada
  jalur tanpa batas waktu gateway. Nilai yang sama diterapkan ke eksekusi Gateway
  dan runtime ACP sehingga harness yang macet/kehabisan kuota tidak
  menempati jalur agen induk tanpa batas.
</ParamField>
<ParamField path="model" type="string">
  Override model eksplisit untuk sesi anak ACP. Spawn Codex ACP
  menormalkan referensi Codex OpenClaw seperti `openai-codex/gpt-5.4` ke config startup Codex
  ACP sebelum `session/new`; bentuk slash seperti
  `openai-codex/gpt-5.4/high` juga mengatur upaya penalaran Codex ACP.
  Harness lain harus mengiklankan ACP `models` dan mendukung
  `session/set_model`; jika tidak, OpenClaw/acpx gagal dengan jelas alih-alih
  diam-diam fallback ke default agen target.
</ParamField>
<ParamField path="thinking" type="string">
  Upaya berpikir/penalaran eksplisit. Untuk Codex ACP, `minimal` dipetakan ke
  upaya rendah, `low`/`medium`/`high`/`xhigh` dipetakan langsung, dan `off`
  menghilangkan override startup reasoning-effort.
</ParamField>

## Mode bind dan thread spawn

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | Perilaku                                                                |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
    | `off`  | Jangan buat binding percakapan saat ini.                                |

    Catatan:

    - `--bind here` adalah jalur operator paling sederhana untuk "jadikan saluran atau chat ini didukung Codex."
    - `--bind here` tidak membuat thread anak.
    - `--bind here` hanya tersedia pada saluran yang mengekspos dukungan binding percakapan saat ini.
    - `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | Perilaku                                                                                             |
    | ------ | ----------------------------------------------------------------------------------------------------- |
    | `auto` | Di thread aktif: ikat thread tersebut. Di luar thread: buat/ikat thread anak jika didukung.         |
    | `here` | Wajib ada thread aktif saat ini; gagal jika tidak berada di dalam thread.                            |
    | `off`  | Tidak ada binding. Sesi dimulai tanpa binding.                                                        |

    Catatan:

    - Pada permukaan non-binding thread, perilaku default secara efektif adalah `off`.
    - Spawn terikat thread memerlukan dukungan kebijakan saluran:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Gunakan `--bind here` saat Anda ingin menyematkan percakapan saat ini tanpa membuat thread anak.

  </Tab>
</Tabs>

## Model pengiriman

Sesi ACP dapat berupa ruang kerja interaktif atau pekerjaan latar belakang
milik induk. Jalur pengiriman bergantung pada bentuk tersebut.

<AccordionGroup>
  <Accordion title="Sesi ACP interaktif">
    Sesi interaktif ditujukan untuk terus berbicara pada permukaan chat
    yang terlihat:

    - `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
    - `/acp spawn ... --thread ...` mengikat thread/topik saluran ke sesi ACP.
    - `bindings[].type="acp"` persisten yang dikonfigurasi merutekan percakapan yang cocok ke sesi ACP yang sama.

    Pesan tindak lanjut dalam percakapan terikat dirutekan langsung ke
    sesi ACP, dan keluaran ACP dikirim kembali ke
    saluran/thread/topik yang sama.

    Yang dikirim OpenClaw ke harness:

    - Tindak lanjut terikat normal dikirim sebagai teks prompt, ditambah lampiran hanya jika harness/backend mendukungnya.
    - Perintah manajemen `/acp` dan perintah Gateway lokal dicegat sebelum dispatch ACP.
    - Peristiwa completion yang dihasilkan runtime diwujudkan per target. Agen OpenClaw mendapatkan envelope konteks runtime internal OpenClaw; harness ACP eksternal mendapatkan prompt biasa dengan hasil anak dan instruksi. Envelope mentah `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` tidak boleh dikirim ke harness eksternal atau dipersistensikan sebagai teks transkrip pengguna ACP.
    - Entri transkrip ACP menggunakan teks pemicu yang terlihat pengguna atau prompt completion biasa. Metadata peristiwa internal tetap terstruktur di OpenClaw jika memungkinkan dan tidak diperlakukan sebagai konten chat yang ditulis pengguna.

  </Accordion>
  <Accordion title="Sesi ACP sekali jalan milik induk">
    Sesi ACP sekali jalan yang di-spawn oleh eksekusi agen lain adalah
    anak latar belakang, mirip dengan sub-agen:

    - Induk meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Anak berjalan dalam sesi harness ACP-nya sendiri.
    - Giliran anak berjalan pada jalur latar belakang yang sama dengan spawn sub-agen native, sehingga harness ACP yang lambat tidak memblokir pekerjaan sesi utama lain yang tidak terkait.
    - Completion melaporkan kembali melalui jalur pengumuman penyelesaian tugas. OpenClaw mengubah metadata completion internal menjadi prompt ACP biasa sebelum mengirimkannya ke harness eksternal, sehingga harness tidak melihat penanda konteks runtime khusus OpenClaw.
    - Induk menulis ulang hasil anak dalam suara asisten normal saat balasan yang berhadapan dengan pengguna berguna.

    **Jangan** perlakukan jalur ini sebagai chat peer-to-peer antara induk
    dan anak. Anak sudah memiliki saluran completion kembali ke
    induk.

  </Accordion>
  <Accordion title="Pengiriman sessions_send dan A2A">
    `sessions_send` dapat menargetkan sesi lain setelah spawn. Untuk sesi peer
    normal, OpenClaw menggunakan jalur tindak lanjut agent-to-agent (A2A)
    setelah menyuntikkan pesan:

    - Tunggu balasan sesi target.
    - Secara opsional biarkan peminta dan target bertukar sejumlah terbatas giliran tindak lanjut.
    - Minta target menghasilkan pesan pengumuman.
    - Kirim pengumuman tersebut ke saluran atau thread yang terlihat.

    Jalur A2A itu adalah fallback untuk pengiriman peer ketika pengirim memerlukan
    tindak lanjut yang terlihat. Jalur ini tetap diaktifkan saat sesi yang tidak terkait dapat
    melihat dan mengirim pesan ke target ACP, misalnya di bawah pengaturan
    `tools.sessions.visibility` yang luas.

    OpenClaw melewati tindak lanjut A2A hanya ketika peminta adalah
    induk dari anak ACP sekali jalan miliknya sendiri. Dalam kasus itu,
    menjalankan A2A di atas completion tugas dapat membangunkan induk dengan
    hasil anak, meneruskan balasan induk kembali ke anak, dan
    membuat loop gema induk/anak. Hasil `sessions_send` melaporkan
    `delivery.status="skipped"` untuk kasus anak milik sendiri itu karena jalur
    completion sudah bertanggung jawab atas hasil tersebut.

  </Accordion>
  <Accordion title="Melanjutkan sesi yang sudah ada">
    Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih
    memulai dari awal. Agen memutar ulang riwayat percakapannya melalui
    `session/load`, sehingga melanjutkan dengan konteks penuh dari
    yang sudah terjadi sebelumnya.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Kasus penggunaan umum:

    - Serahkan sesi Codex dari laptop Anda ke ponsel Anda — beri tahu agen Anda untuk melanjutkan dari tempat Anda berhenti.
    - Lanjutkan sesi coding yang Anda mulai secara interaktif di CLI, sekarang secara headless melalui agen Anda.
    - Lanjutkan pekerjaan yang terputus karena restart gateway atau idle timeout.

    Catatan:

    - `resumeSessionId` memerlukan `runtime: "acp"` — mengembalikan kesalahan jika digunakan dengan runtime sub-agen.
    - `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal pada sesi OpenClaw baru yang Anda buat, jadi `mode: "session"` tetap memerlukan `thread: true`.
    - Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
    - Jika id sesi tidak ditemukan, spawn gagal dengan kesalahan yang jelas — tidak ada fallback diam-diam ke sesi baru.

  </Accordion>
  <Accordion title="Pengujian smoke setelah deploy">
    Setelah deploy gateway, jalankan pemeriksaan end-to-end live alih-alih
    mempercayai unit test:

    1. Verifikasi versi dan commit gateway yang ter-deploy pada host target.
    2. Buka sesi jembatan ACPX sementara ke agen live.
    3. Minta agen tersebut memanggil `sessions_spawn` dengan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, dan tugas `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifikasi `accepted=yes`, `childSessionKey` yang nyata, dan tidak ada kesalahan validator.
    5. Bersihkan sesi jembatan sementara.

    Pertahankan gate pada `mode: "run"` dan lewati `streamTo: "parent"` —
    `mode: "session"` yang terikat thread dan jalur stream-relay adalah
    tahapan integrasi terpisah yang lebih kaya.

  </Accordion>
</AccordionGroup>

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, **bukan** di dalam
sandbox OpenClaw.

<Warning>
**Batas keamanan:**

- Harness eksternal dapat membaca/menulis sesuai izin CLI-nya sendiri dan `cwd` yang dipilih.
- Kebijakan sandbox OpenClaw **tidak** membungkus eksekusi harness ACP.
- OpenClaw tetap menegakkan gate fitur ACP, agen yang diizinkan, kepemilikan sesi, binding saluran, dan kebijakan pengiriman Gateway.
- Gunakan `runtime: "subagent"` untuk pekerjaan native OpenClaw yang ditegakkan sandbox.
</Warning>

Keterbatasan saat ini:

- Jika sesi peminta disandbox, spawn ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.

## Resolusi target sesi

Sebagian besar tindakan `/acp` menerima target sesi opsional (`session-key`,
`session-id`, atau `session-label`).

**Urutan resolusi:**

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - coba kunci
   - lalu id sesi berbentuk UUID
   - lalu label
2. Binding thread saat ini (jika percakapan/thread ini terikat ke sesi ACP).
3. Fallback sesi peminta saat ini.

Binding percakapan saat ini dan binding thread sama-sama berpartisipasi dalam
langkah 2.

Jika tidak ada target yang terpecahkan, OpenClaw mengembalikan kesalahan yang jelas
(`Unable to resolve session target: ...`).

## Kontrol ACP

| Perintah             | Fungsinya                                                | Contoh                                                        |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; binding saat ini atau binding thread opsional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan giliran yang sedang berjalan untuk sesi target. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Mengirim instruksi pengarah ke sesi yang sedang berjalan. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas binding target thread.          | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, status, opsi runtime, kapabilitas. | `/acp status`                                                 |
| `/acp set-mode`      | Mengatur mode runtime untuk sesi target.                 | `/acp set-mode plan`                                          |
| `/acp set`           | Penulisan opsi config runtime generik.                   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Mengatur override direktori kerja runtime.               | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Mengatur profil kebijakan persetujuan.                   | `/acp permissions strict`                                     |
| `/acp timeout`       | Mengatur batas waktu runtime (detik).                    | `/acp timeout 120`                                            |
| `/acp model`         | Mengatur override model runtime.                         | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus override opsi runtime sesi.                    | `/acp reset-options`                                          |
| `/acp sessions`      | Mencantumkan sesi ACP terbaru dari penyimpanan.          | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kapabilitas, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                                 |
| `/acp install`       | Mencetak langkah instalasi dan pengaktifan yang deterministik. | `/acp install`                                                |

`/acp status` menampilkan opsi runtime efektif beserta identifier sesi
tingkat runtime dan tingkat backend. Kesalahan kontrol yang tidak didukung
ditampilkan dengan jelas saat backend tidak memiliki kapabilitas tersebut. `/acp sessions` membaca
penyimpanan untuk sesi terikat atau sesi peminta saat ini; token target
(`session-key`, `session-id`, atau `session-label`) dipecahkan melalui
penemuan sesi gateway, termasuk root `session.store` kustom per agen.

### Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik. Operasi yang
setara:

| Perintah                     | Dipetakan ke                         | Catatan                                                                                                                                                                           |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | kunci config runtime `model`         | Untuk Codex ACP, OpenClaw menormalkan `openai-codex/<model>` ke id model adaptor dan memetakan sufiks penalaran slash seperti `openai-codex/gpt-5.4/high` ke `reasoning_effort`. |
| `/acp set thinking <level>`  | kunci config runtime `thinking`      | Untuk Codex ACP, OpenClaw mengirim `reasoning_effort` yang sesuai jika adaptor mendukungnya.                                                                                     |
| `/acp permissions <profile>` | kunci config runtime `approval_policy` | —                                                                                                                                                                               |
| `/acp timeout <seconds>`     | kunci config runtime `timeout`       | —                                                                                                                                                                                 |
| `/acp cwd <path>`            | override cwd runtime                 | Pembaruan langsung.                                                                                                                                                               |
| `/acp set <key> <value>`     | generik                              | `key=cwd` menggunakan jalur override cwd.                                                                                                                                         |
| `/acp reset-options`         | menghapus semua override runtime     | —                                                                                                                                                                                 |

## Harness acpx, penyiapan Plugin, dan izin

Untuk konfigurasi harness acpx (alias Claude Code / Codex / Gemini CLI
), jembatan MCP alat Plugin dan alat OpenClaw, serta mode izin ACP, lihat
[agen ACP — penyiapan](/id/tools/acp-agents-setup).

## Pemecahan masalah

| Gejala                                                                      | Kemungkinan penyebab                                                            | Perbaikan                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                      | Plugin backend tidak ada, dinonaktifkan, atau diblokir oleh `plugins.allow`.   | Instal dan aktifkan Plugin backend, sertakan `acpx` di `plugins.allow` saat allowlist tersebut diatur, lalu jalankan `/acp doctor`.                                       |
| `ACP is disabled by policy (acp.enabled=false)`                              | ACP dinonaktifkan secara global.                                                | Atur `acp.enabled=true`.                                                                                                                                                   |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`            | Dispatch dari pesan thread normal dinonaktifkan.                                | Atur `acp.dispatch.enabled=true`.                                                                                                                                          |
| `ACP agent "<id>" is not allowed by policy`                                  | Agen tidak ada di allowlist.                                                    | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                        |
| `/acp doctor` melaporkan backend belum siap tepat setelah startup            | Probe dependensi Plugin atau perbaikan otomatis masih berjalan.                 | Tunggu sebentar lalu jalankan kembali `/acp doctor`; jika tetap tidak sehat, periksa kesalahan instalasi backend dan kebijakan allow/deny Plugin.                         |
| Perintah harness tidak ditemukan                                             | CLI adaptor belum terinstal atau pengambilan `npx` saat pertama dijalankan gagal. | Instal/panaskan cache adaptor di host Gateway, atau konfigurasikan perintah agen acpx secara eksplisit.                                                                  |
| Model-not-found dari harness                                                 | id model valid untuk provider/harness lain tetapi tidak untuk target ACP ini.   | Gunakan model yang dicantumkan oleh harness tersebut, konfigurasikan model di harness, atau hilangkan override-nya.                                                       |
| Kesalahan autentikasi vendor dari harness                                    | OpenClaw sehat, tetapi CLI/provider target belum login.                         | Login atau sediakan key provider yang diperlukan di lingkungan host Gateway.                                                                                               |
| `Unable to resolve session target: ...`                                      | Token kunci/id/label tidak valid.                                               | Jalankan `/acp sessions`, salin kunci/label yang tepat, lalu coba lagi.                                                                                                   |
| `--bind here requires running /acp spawn inside an active ... conversation`  | `--bind here` digunakan tanpa percakapan aktif yang dapat diikat.               | Pindah ke chat/saluran target lalu coba lagi, atau gunakan spawn tanpa binding.                                                                                           |
| `Conversation bindings are unavailable for <channel>.`                       | Adaptor tidak memiliki kapabilitas binding ACP percakapan saat ini.             | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` tingkat atas, atau pindah ke saluran yang didukung.                                     |
| `--thread here requires running /acp spawn inside an active ... thread`      | `--thread here` digunakan di luar konteks thread.                               | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`                | Pengguna lain memiliki target binding aktif.                                    | Lakukan binding ulang sebagai pemilik atau gunakan percakapan atau thread yang berbeda.                                                                                   |
| `Thread bindings are unavailable for <channel>.`                             | Adaptor tidak memiliki kapabilitas binding thread.                              | Gunakan `--thread off` atau pindah ke adaptor/saluran yang didukung.                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                           | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.             | Gunakan `runtime="subagent"` dari sesi yang disandbox, atau jalankan spawn ACP dari sesi yang tidak disandbox.                                                            |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`      | `sandbox="require"` diminta untuk runtime ACP.                                  | Gunakan `runtime="subagent"` untuk sandboxing wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi yang tidak disandbox.                                         |
| `Cannot apply --model ... did not advertise model support`                   | Harness target tidak mengekspos pergantian model ACP generik.                   | Gunakan harness yang mengiklankan ACP `models`/`session/set_model`, gunakan referensi model Codex ACP, atau konfigurasikan model langsung di harness jika punya flag startup sendiri. |
| Metadata ACP hilang untuk sesi terikat                                       | Metadata sesi ACP basi/terhapus.                                                | Buat ulang dengan `/acp spawn`, lalu lakukan bind/fokus thread kembali.                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`     | `permissionMode` memblokir tulis/eksekusi dalam sesi ACP non-interaktif.        | Atur `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan restart gateway. Lihat [Konfigurasi izin](/id/tools/acp-agents-setup#permission-configuration).      |
| Sesi ACP gagal lebih awal dengan keluaran minim                              | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.         | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, atur `permissionMode=approve-all`; untuk degradasi yang mulus, atur `nonInteractivePermissions=deny`.     |
| Sesi ACP macet tanpa batas setelah menyelesaikan pekerjaan                   | Proses harness selesai tetapi sesi ACP tidak melaporkan completion.             | Pantau dengan `ps aux \| grep acpx`; hentikan proses basi secara manual.                                                                                                  |
| Harness melihat `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                      | Envelope peristiwa internal bocor melewati batas ACP.                           | Perbarui OpenClaw dan jalankan ulang alur completion; harness eksternal seharusnya hanya menerima prompt completion biasa.                                                |

## Terkait

- [agen ACP — penyiapan](/id/tools/acp-agents-setup)
- [Pengiriman agen](/id/tools/agent-send)
- [Backend CLI](/id/gateway/cli-backends)
- [Codex harness](/id/plugins/codex-harness)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (mode jembatan)](/id/cli/acp)
- [Sub-agen](/id/tools/subagents)
