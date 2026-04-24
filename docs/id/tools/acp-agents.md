---
read_when:
    - Menjalankan harness coding melalui ACP
    - Menyiapkan sesi ACP yang terikat percakapan pada channel pesan
    - Mengikat percakapan channel pesan ke sesi ACP persisten
    - Men-debug backend ACP dan wiring Plugin
    - Men-debug pengiriman completion ACP atau loop agen-ke-agen
    - Mengoperasikan perintah /acp dari chat
summary: Gunakan sesi runtime ACP untuk Claude Code, Cursor, Gemini CLI, fallback ACP Codex eksplisit, ACP OpenClaw, dan agen harness lainnya
title: Agen ACP
x-i18n:
    generated_at: "2026-04-24T09:29:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) memungkinkan sesi OpenClaw menjalankan harness coding eksternal (misalnya Pi, Claude Code, Cursor, Copilot, ACP OpenClaw, OpenCode, Gemini CLI, dan harness ACPX lain yang didukung) melalui Plugin backend ACP.

Jika Anda meminta OpenClaw dalam bahasa alami untuk mengikat atau mengontrol Codex di percakapan saat ini, OpenClaw harus menggunakan Plugin app-server Codex native (`/codex bind`, `/codex threads`, `/codex resume`). Jika Anda meminta `/acp`, ACP, acpx, atau sesi anak latar belakang Codex, OpenClaw masih dapat merutekan Codex melalui ACP. Setiap spawn sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

Jika Anda meminta OpenClaw dalam bahasa alami untuk "memulai Claude Code di thread" atau menggunakan harness eksternal lain, OpenClaw harus merutekan permintaan itu ke runtime ACP (bukan runtime subagen native).

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal langsung
ke percakapan channel OpenClaw yang sudah ada, gunakan [`openclaw mcp serve`](/id/cli/mcp)
alih-alih ACP.

## Halaman mana yang saya inginkan?

Ada tiga surface terdekat yang mudah tertukar:

| Anda ingin...                                                                                  | Gunakan ini                            | Catatan                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mengikat atau mengontrol Codex di percakapan saat ini                                          | `/codex bind`, `/codex threads`        | Jalur app-server Codex native; mencakup balasan chat yang terikat, penerusan gambar, kontrol model/fast/permissions, stop, dan steer. ACP adalah fallback eksplisit |
| Menjalankan Claude Code, Gemini CLI, ACP Codex eksplisit, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini: agen ACP                  | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime                                                 |
| Mengekspos sesi Gateway OpenClaw _sebagai_ server ACP untuk editor atau klien                  | [`openclaw acp`](/id/cli/acp)             | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                                                                      |
| Menggunakan ulang AI CLI lokal sebagai model fallback teks saja                                | [CLI Backends](/id/gateway/cli-backends)  | Bukan ACP. Tanpa tool OpenClaw, tanpa kontrol ACP, tanpa runtime harness                                                                                      |

## Apakah ini langsung berfungsi?

Biasanya, ya. Instalasi baru dikirim dengan Plugin runtime `acpx` bawaan yang aktif secara default, dengan binary `acpx` pin lokal-Plugin yang di-probe dan diperbaiki sendiri oleh OpenClaw saat startup. Jalankan `/acp doctor` untuk pemeriksaan kesiapan.

Hal yang perlu diperhatikan pada penggunaan pertama:

- Adapter harness target (Codex, Claude, dll.) mungkin diambil sesuai kebutuhan dengan `npx` saat pertama kali Anda menggunakannya.
- Auth vendor tetap harus sudah ada di host untuk harness tersebut.
- Jika host tidak memiliki akses npm atau jaringan, pengambilan adapter pada penggunaan pertama akan gagal sampai cache dipanaskan terlebih dahulu atau adapter diinstal dengan cara lain.

## Runbook operator

Alur `/acp` cepat dari chat:

1. **Spawn** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto`, atau `/acp spawn codex --bind here` yang eksplisit
2. **Bekerja** di percakapan atau thread yang terikat (atau targetkan kunci sesi secara eksplisit).
3. **Periksa state** — `/acp status`
4. **Setel** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Steer** tanpa mengganti konteks — `/acp steer tighten logging and continue`
6. **Hentikan** — `/acp cancel` (giliran saat ini) atau `/acp close` (sesi + binding)

Pemicu bahasa alami yang harus dirutekan ke Plugin Codex native:

- "Bind this Discord channel to Codex."
- "Attach this chat to Codex thread `<id>`."
- "Show Codex threads, then bind this one."

Binding percakapan Codex native adalah jalur kontrol chat default, tetapi sengaja konservatif untuk alur persetujuan/tool Codex yang interaktif: tool dinamis OpenClaw dan prompt persetujuan belum diekspos melalui jalur chat-terikat ini, sehingga permintaan tersebut akan ditolak dengan penjelasan yang jelas. Gunakan jalur harness Codex atau fallback ACP eksplisit saat alur kerja bergantung pada tool dinamis OpenClaw atau persetujuan interaktif yang berjalan lama.

Pemicu bahasa alami yang harus dirutekan ke runtime ACP:

- "Run this as a one-shot Claude Code ACP session and summarize the result."
- "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
- "Run Codex through ACP in a background thread."

OpenClaw memilih `runtime: "acp"`, me-resolve `agentId` harness, mengikat ke percakapan atau thread saat ini jika didukung, dan merutekan tindak lanjut ke sesi tersebut sampai ditutup/kedaluwarsa. Codex hanya mengikuti jalur ini jika ACP diminta secara eksplisit atau runtime latar belakang yang diminta masih memerlukan ACP.

## ACP versus subagen

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan app-server Codex native untuk binding/kontrol percakapan Codex. Gunakan subagen saat Anda menginginkan run delegasi native OpenClaw.

| Area          | Sesi ACP                              | Run subagen                         |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime subagen native OpenClaw     |
| Kunci sesi    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Perintah utama | `/acp ...`                           | `/subagents ...`                    |
| Tool spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agents](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, stack-nya adalah:

1. Control plane sesi ACP OpenClaw
2. Plugin runtime `acpx` bawaan
3. Adapter ACP Claude
4. Runtime/mesin sesi sisi Claude

Perbedaan penting:

- Claude ACP adalah sesi harness dengan kontrol ACP, resume sesi, pelacakan tugas latar belakang, dan binding percakapan/thread opsional.
- CLI backend adalah runtime fallback lokal terpisah yang hanya berbasis teks. Lihat [CLI Backends](/id/gateway/cli-backends).

Bagi operator, aturan praktisnya adalah:

- ingin `/acp spawn`, sesi yang bisa di-bind, kontrol runtime, atau pekerjaan harness yang persisten: gunakan ACP
- ingin fallback teks lokal sederhana melalui CLI mentah: gunakan CLI backend

## Sesi terikat

### Binding percakapan saat ini

`/acp spawn <harness> --bind here` menempelkan percakapan saat ini ke sesi ACP yang di-spawn — tanpa child thread, tetap pada surface chat yang sama. OpenClaw tetap memiliki transport, auth, keamanan, dan pengiriman; pesan tindak lanjut di percakapan tersebut dirutekan ke sesi yang sama; `/new` dan `/reset` me-reset sesi di tempat; `/acp close` menghapus binding.

Model mental:

- **surface chat** — tempat orang terus berbicara (channel Discord, topik Telegram, chat iMessage).
- **sesi ACP** — state runtime Codex/Claude/Gemini yang tahan lama dan dirutekan OpenClaw.
- **child thread/topic** — surface pesan tambahan opsional yang hanya dibuat oleh `--thread ...`.
- **workspace runtime** — lokasi filesystem (`cwd`, checkout repo, workspace backend) tempat harness berjalan. Ini independen dari surface chat.

Contoh:

- `/codex bind` — pertahankan chat ini, spawn atau attach app-server Codex native, rutekan pesan selanjutnya ke sini.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — setel thread Codex native yang terikat dari chat.
- `/codex stop` atau `/codex steer focus on the failing tests first` — kontrol giliran Codex native yang aktif.
- `/acp spawn codex --bind here` — fallback ACP eksplisit untuk Codex.
- `/acp spawn codex --thread auto` — OpenClaw dapat membuat child thread/topic dan mengikat di sana.
- `/acp spawn codex --bind here --cwd /workspace/repo` — binding chat yang sama, Codex berjalan di `/workspace/repo`.

Catatan:

- `--bind here` dan `--thread ...` saling eksklusif.
- `--bind here` hanya berfungsi pada channel yang mengiklankan binding percakapan saat ini; OpenClaw akan mengembalikan pesan tidak didukung yang jelas jika tidak demikian. Binding bertahan setelah restart gateway.
- Di Discord, `spawnAcpSessions` hanya diperlukan saat OpenClaw perlu membuat child thread untuk `--thread auto|here` — tidak untuk `--bind here`.
- Jika Anda melakukan spawn ke agen ACP lain tanpa `--cwd`, OpenClaw mewarisi workspace **agen target** secara default. Path turunan yang hilang (`ENOENT`/`ENOTDIR`) fallback ke default backend; error akses lain (misalnya `EACCES`) muncul sebagai error spawn.

### Sesi terikat thread

Ketika binding thread diaktifkan untuk adapter channel, sesi ACP dapat diikat ke thread:

- OpenClaw mengikat thread ke sesi ACP target.
- Pesan tindak lanjut dalam thread itu dirutekan ke sesi ACP yang terikat.
- Output ACP dikirim kembali ke thread yang sama.
- Unfocus/close/archive/idle-timeout atau kedaluwarsa usia maksimum menghapus binding.

Dukungan binding thread bersifat khusus adapter. Jika adapter channel aktif tidak mendukung binding thread, OpenClaw akan mengembalikan pesan unsupported/unavailable yang jelas.

Flag fitur yang diperlukan untuk ACP terikat thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` aktif secara default (atur `false` untuk menjeda dispatch ACP)
- Flag spawn-thread ACP adapter-channel diaktifkan (khusus adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Channel yang mendukung thread

- Adapter channel apa pun yang mengekspos kapabilitas binding sesi/thread.
- Dukungan bawaan saat ini:
  - Thread/channel Discord
  - Topik Telegram (topik forum di grup/supergrup dan topik DM)
- Channel Plugin dapat menambahkan dukungan melalui antarmuka binding yang sama.

## Pengaturan khusus channel

Untuk alur kerja non-ephemeral, konfigurasikan binding ACP persisten di entri `bindings[]` level atas.

### Model binding

- `bindings[].type="acp"` menandai binding percakapan ACP persisten.
- `bindings[].match` mengidentifikasi percakapan target:
  - Channel atau thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Topik forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/grup BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Lebih baik gunakan `chat_id:*` atau `chat_identifier:*` untuk binding grup yang stabil.
  - Chat DM/grup iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Lebih baik gunakan `chat_id:*` untuk binding grup yang stabil.
- `bindings[].agentId` adalah id agen OpenClaw pemilik.
- Override ACP opsional berada di bawah `bindings[].acp`:
  - `mode` (`persistent` atau `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Default runtime per agen

Gunakan `agents.list[].runtime` untuk mendefinisikan default ACP sekali per agen:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, misalnya `codex` atau `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

Urutan prioritas override untuk sesi ACP terikat:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. default ACP global (misalnya `acp.backend`)

Contoh:

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

Perilaku:

- OpenClaw memastikan sesi ACP yang dikonfigurasi ada sebelum digunakan.
- Pesan di channel atau topik tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan yang terikat, `/new` dan `/reset` me-reset kunci sesi ACP yang sama di tempat.
- Binding runtime sementara (misalnya yang dibuat oleh alur fokus thread) tetap berlaku jika ada.
- Untuk spawn ACP lintas agen tanpa `--cwd` eksplisit, OpenClaw mewarisi workspace agen target dari config agen.
- Path workspace turunan yang hilang akan fallback ke cwd default backend; kegagalan akses yang bukan karena hilang akan muncul sebagai error spawn.

## Memulai sesi ACP (antarmuka)

### Dari `sessions_spawn`

Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agen atau pemanggilan tool.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Catatan:

- `runtime` default-nya `subagent`, jadi atur `runtime: "acp"` secara eksplisit untuk sesi ACP.
- Jika `agentId` dihilangkan, OpenClaw menggunakan `acp.defaultAgent` bila dikonfigurasi.
- `mode: "session"` memerlukan `thread: true` agar percakapan tetap terikat secara persisten.

Detail antarmuka:

- `task` (wajib): prompt awal yang dikirim ke sesi ACP.
- `runtime` (wajib untuk ACP): harus `"acp"`.
- `agentId` (opsional): id harness ACP target. Fallback ke `acp.defaultAgent` jika diatur.
- `thread` (opsional, default `false`): meminta alur binding thread jika didukung.
- `mode` (opsional): `run` (sekali jalan) atau `session` (persisten).
  - default-nya adalah `run`
  - jika `thread: true` dan mode dihilangkan, OpenClaw dapat default ke perilaku persisten tergantung jalur runtime
  - `mode: "session"` memerlukan `thread: true`
- `cwd` (opsional): direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime). Jika dihilangkan, spawn ACP mewarisi workspace agen target bila dikonfigurasi; path turunan yang hilang fallback ke default backend, sedangkan error akses nyata akan dikembalikan.
- `label` (opsional): label yang ditujukan ke operator dan digunakan dalam teks sesi/banner.
- `resumeSessionId` (opsional): melanjutkan sesi ACP yang sudah ada alih-alih membuat yang baru. Agen memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan `runtime: "acp"`.
- `streamTo` (opsional): `"parent"` mengalirkan ringkasan progres run ACP awal kembali ke sesi peminta sebagai peristiwa sistem.
  - Bila tersedia, respons yang diterima dapat mencakup `streamLogPath` yang menunjuk ke log JSONL yang dicakup sesi (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk riwayat relay penuh.
- `model` (opsional): override model eksplisit untuk sesi anak ACP. Dihormati untuk `runtime: "acp"` sehingga child menggunakan model yang diminta alih-alih diam-diam fallback ke default agen target.

## Model pengiriman

Sesi ACP dapat berupa workspace interaktif atau pekerjaan latar belakang milik induk. Jalur pengiriman bergantung pada bentuk tersebut.

### Sesi ACP interaktif

Sesi interaktif dimaksudkan agar tetap berbicara pada surface chat yang terlihat:

- `/acp spawn ... --bind here` mengikat percakapan saat ini ke sesi ACP.
- `/acp spawn ... --thread ...` mengikat thread/topik channel ke sesi ACP.
- `bindings[].type="acp"` persisten merutekan percakapan yang cocok ke sesi ACP yang sama.

Pesan tindak lanjut di percakapan yang terikat dirutekan langsung ke sesi ACP, dan output ACP dikirim kembali ke channel/thread/topik yang sama.

### Sesi ACP sekali jalan milik induk

Sesi ACP sekali jalan yang di-spawn oleh run agen lain adalah child latar belakang, mirip subagen:

- Induk meminta pekerjaan dengan `sessions_spawn({ runtime: "acp", mode: "run" })`.
- Child berjalan dalam sesi harness ACP-nya sendiri.
- Completion dilaporkan kembali melalui jalur announce penyelesaian tugas internal.
- Induk menulis ulang hasil child dengan suara asisten normal ketika balasan yang ditujukan ke pengguna berguna.

Jangan perlakukan jalur ini sebagai chat peer-to-peer antara induk dan child. Child sudah memiliki kanal completion kembali ke induk.

### `sessions_send` dan pengiriman A2A

`sessions_send` dapat menargetkan sesi lain setelah spawn. Untuk sesi peer normal, OpenClaw menggunakan jalur tindak lanjut agent-to-agent (A2A) setelah menyuntikkan pesan:

- tunggu balasan sesi target
- secara opsional biarkan peminta dan target bertukar sejumlah terbatas giliran tindak lanjut
- minta target menghasilkan pesan announce
- kirim announce itu ke channel atau thread yang terlihat

Jalur A2A itu adalah fallback untuk pengiriman antar-peer ketika pengirim memerlukan tindak lanjut yang terlihat. Jalur ini tetap aktif ketika sesi yang tidak terkait dapat melihat dan mengirim pesan ke target ACP, misalnya di bawah pengaturan `tools.sessions.visibility` yang luas.

OpenClaw melewati tindak lanjut A2A hanya ketika peminta adalah induk dari child ACP sekali jalan miliknya sendiri. Dalam kasus itu, menjalankan A2A di atas penyelesaian tugas dapat membangunkan induk dengan hasil child, meneruskan balasan induk kembali ke child, dan membuat loop gema induk/child. Hasil `sessions_send` melaporkan `delivery.status="skipped"` untuk kasus child-milik-induk itu karena jalur completion sudah bertanggung jawab atas hasilnya.

### Melanjutkan sesi yang sudah ada

Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih memulai dari awal. Agen memutar ulang riwayat percakapannya melalui `session/load`, sehingga agen melanjutkan dengan konteks penuh dari apa yang sudah terjadi sebelumnya.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Kasus penggunaan umum:

- Menyerahkan sesi Codex dari laptop ke ponsel Anda — minta agen Anda melanjutkan dari titik terakhir
- Melanjutkan sesi coding yang Anda mulai secara interaktif di CLI, kini secara headless melalui agen Anda
- Melanjutkan pekerjaan yang terganggu karena restart gateway atau idle timeout

Catatan:

- `resumeSessionId` memerlukan `runtime: "acp"` — mengembalikan error jika digunakan dengan runtime subagen.
- `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal untuk sesi OpenClaw baru yang Anda buat, jadi `mode: "session"` tetap memerlukan `thread: true`.
- Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
- Jika id sesi tidak ditemukan, spawn gagal dengan error yang jelas — tidak ada fallback diam-diam ke sesi baru.

<Accordion title="Smoke test pascadeploy">

Setelah deploy gateway, jalankan pemeriksaan live end-to-end alih-alih hanya memercayai unit test:

1. Verifikasi versi dan commit gateway yang ter-deploy pada host target.
2. Buka sesi bridge ACPX sementara ke agen live.
3. Minta agen tersebut memanggil `sessions_spawn` dengan `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, dan tugas `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. Verifikasi `accepted=yes`, `childSessionKey` yang nyata, dan tidak ada error validator.
5. Bersihkan sesi bridge sementara.

Pertahankan gate pada `mode: "run"` dan lewati `streamTo: "parent"` — jalur `mode: "session"` yang terikat thread dan jalur stream-relay adalah integrasi terpisah yang lebih kaya.

</Accordion>

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, bukan di dalam sandbox OpenClaw.

Keterbatasan saat ini:

- Jika sesi peminta di-sandbox, spawn ACP diblokir baik untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Gunakan `runtime: "subagent"` saat Anda memerlukan eksekusi yang ditegakkan sandbox.

### Dari perintah `/acp`

Gunakan `/acp spawn` untuk kontrol operator eksplisit dari chat saat diperlukan.

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

Lihat [Slash Commands](/id/tools/slash-commands).

## Resolusi target sesi

Sebagian besar aksi `/acp` menerima target sesi opsional (`session-key`, `session-id`, atau `session-label`).

Urutan resolusi:

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - coba key
   - lalu session id berbentuk UUID
   - lalu label
2. Binding thread saat ini (jika percakapan/thread ini terikat ke sesi ACP)
3. Fallback sesi peminta saat ini

Binding percakapan saat ini dan binding thread sama-sama ikut serta pada langkah 2.

Jika tidak ada target yang berhasil di-resolve, OpenClaw mengembalikan error yang jelas (`Unable to resolve session target: ...`).

## Mode bind spawn

`/acp spawn` mendukung `--bind here|off`.

| Mode   | Perilaku                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
| `off`  | Jangan membuat binding percakapan saat ini.                            |

Catatan:

- `--bind here` adalah jalur operator termudah untuk "jadikan channel atau chat ini didukung Codex."
- `--bind here` tidak membuat child thread.
- `--bind here` hanya tersedia pada channel yang mengekspos dukungan binding percakapan saat ini.
- `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

## Mode thread spawn

`/acp spawn` mendukung `--thread auto|here|off`.

| Mode   | Perilaku                                                                                           |
| ------ | -------------------------------------------------------------------------------------------------- |
| `auto` | Dalam thread aktif: ikat thread tersebut. Di luar thread: buat/ikat child thread saat didukung.   |
| `here` | Wajib berada di thread aktif saat ini; gagal jika tidak berada di thread.                          |
| `off`  | Tidak ada binding. Sesi dimulai tanpa terikat.                                                     |

Catatan:

- Pada surface binding non-thread, perilaku default secara efektif adalah `off`.
- Spawn terikat thread memerlukan dukungan kebijakan channel:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Gunakan `--bind here` saat Anda ingin menempelkan percakapan saat ini tanpa membuat child thread.

## Kontrol ACP

| Perintah             | Fungsinya                                                | Contoh                                                        |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; binding saat ini atau thread opsional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan giliran yang sedang berjalan untuk sesi target. | `/acp cancel agent:codex:acp:<uuid>`                        |
| `/acp steer`         | Mengirim instruksi steer ke sesi yang sedang berjalan.   | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas binding target thread.          | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, state, opsi runtime, kapabilitas. | `/acp status`                                              |
| `/acp set-mode`      | Mengatur mode runtime untuk sesi target.                 | `/acp set-mode plan`                                          |
| `/acp set`           | Penulisan opsi config runtime generik.                   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Mengatur override direktori kerja runtime.               | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Mengatur profil kebijakan persetujuan.                   | `/acp permissions strict`                                     |
| `/acp timeout`       | Mengatur timeout runtime (detik).                        | `/acp timeout 120`                                            |
| `/acp model`         | Mengatur override model runtime.                         | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus override opsi runtime sesi.                    | `/acp reset-options`                                          |
| `/acp sessions`      | Mencantumkan sesi ACP terbaru dari store.                | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kapabilitas, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                     |
| `/acp install`       | Mencetak langkah instalasi dan aktivasi yang deterministik. | `/acp install`                                            |

`/acp status` menampilkan opsi runtime efektif ditambah identifier sesi tingkat runtime dan backend. Error kontrol yang tidak didukung akan ditampilkan dengan jelas ketika backend tidak memiliki kapabilitas tersebut. `/acp sessions` membaca store untuk sesi saat ini yang terikat atau sesi peminta; token target (`session-key`, `session-id`, atau `session-label`) di-resolve melalui discovery sesi gateway, termasuk root `session.store` kustom per agen.

## Pemetaan opsi runtime

`/acp` memiliki perintah kenyamanan dan setter generik.

Operasi yang ekuivalen:

- `/acp model <id>` dipetakan ke kunci config runtime `model`.
- `/acp permissions <profile>` dipetakan ke kunci config runtime `approval_policy`.
- `/acp timeout <seconds>` dipetakan ke kunci config runtime `timeout`.
- `/acp cwd <path>` memperbarui override cwd runtime secara langsung.
- `/acp set <key> <value>` adalah jalur generik.
  - Kasus khusus: `key=cwd` menggunakan jalur override cwd.
- `/acp reset-options` menghapus semua override runtime untuk sesi target.

## Harness acpx, penyiapan Plugin, dan izin

Untuk konfigurasi harness acpx (alias Claude Code / Codex / Gemini CLI), bridge MCP plugin-tools dan OpenClaw-tools, serta mode izin ACP, lihat
[ACP agents — setup](/id/tools/acp-agents-setup).

## Pemecahan masalah

| Gejala                                                                      | Penyebab yang mungkin                                                             | Perbaikan                                                                                                                                                                   |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang atau dinonaktifkan.                                         | Instal dan aktifkan Plugin backend, lalu jalankan `/acp doctor`.                                                                                                           |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                  | Atur `acp.enabled=true`.                                                                                                                                                    |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch dari pesan thread normal dinonaktifkan.                                  | Atur `acp.dispatch.enabled=true`.                                                                                                                                           |
| `ACP agent "<id>" is not allowed by policy`                                 | Agen tidak ada di allowlist.                                                      | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                        |
| `Unable to resolve session target: ...`                                     | Token key/id/label salah.                                                         | Jalankan `/acp sessions`, salin key/label yang tepat, lalu coba lagi.                                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang dapat di-bind.                | Pindah ke chat/channel target lalu coba lagi, atau gunakan spawn tanpa binding.                                                                                            |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter tidak memiliki kapabilitas binding ACP percakapan saat ini.               | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` level atas, atau pindah ke channel yang didukung.                                       |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks thread.                                 | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                                |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target binding aktif.                                      | Bind ulang sebagai pemilik atau gunakan percakapan atau thread lain.                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | Adapter tidak memiliki kapabilitas binding thread.                                | Gunakan `--thread off` atau pindah ke adapter/channel yang didukung.                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi peminta di-sandbox.                         | Gunakan `runtime="subagent"` dari sesi yang di-sandbox, atau jalankan spawn ACP dari sesi yang tidak di-sandbox.                                                          |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                    | Gunakan `runtime="subagent"` untuk sandboxing yang diwajibkan, atau gunakan ACP dengan `sandbox="inherit"` dari sesi yang tidak di-sandbox.                              |
| Metadata ACP untuk sesi terikat hilang                                      | Metadata sesi ACP stale/terhapus.                                                 | Buat ulang dengan `/acp spawn`, lalu bind/fokus ulang thread.                                                                                                              |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir tulis/exec pada sesi ACP non-interaktif.               | Atur `plugins.entries.acpx.config.permissionMode` ke `approve-all` lalu mulai ulang gateway. Lihat [Konfigurasi izin](/id/tools/acp-agents-setup#permission-configuration). |
| Sesi ACP gagal lebih awal dengan output yang minim                          | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.           | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, atur `permissionMode=approve-all`; untuk degradasi yang anggun, atur `nonInteractivePermissions=deny`.     |
| Sesi ACP macet tanpa batas setelah menyelesaikan pekerjaan                  | Proses harness selesai tetapi sesi ACP tidak melaporkan completion.               | Pantau dengan `ps aux \| grep acpx`; bunuh proses stale secara manual.                                                                                                     |

## Terkait

- [Sub-agents](/id/tools/subagents)
- [Tool sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [Agent send](/id/tools/agent-send)
