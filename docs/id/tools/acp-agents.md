---
read_when:
    - Menjalankan coding harness melalui ACP
    - Menyiapkan sesi ACP yang terikat percakapan pada channel pesan
    - Mengikat percakapan channel pesan ke sesi ACP persisten
    - Memecahkan masalah backend ACP dan wiring plugin
    - Mengoperasikan perintah `/acp` dari chat
summary: Gunakan sesi runtime ACP untuk Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP, dan agen harness lainnya
title: Agen ACP
x-i18n:
    generated_at: "2026-04-05T14:08:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47063abc8170129cd22808d9a4b23160d0f340f6dc789907589d349f68c12e3e
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agen ACP

Sesi [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) memungkinkan OpenClaw menjalankan coding harness eksternal (misalnya Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain yang didukung) melalui plugin backend ACP.

Jika Anda meminta OpenClaw dalam bahasa biasa untuk "run this in Codex" atau "start Claude Code in a thread", OpenClaw harus merutekan permintaan tersebut ke runtime ACP (bukan runtime sub-agen native). Setiap spawn sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal langsung
ke percakapan channel OpenClaw yang sudah ada, gunakan
[`openclaw mcp serve`](/cli/mcp) alih-alih ACP.

## Halaman mana yang saya perlukan?

Ada tiga permukaan terkait yang mudah tertukar:

| Anda ingin...                                                                     | Gunakan ini                           | Catatan                                                                                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Menjalankan Codex, Claude Code, Gemini CLI, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini: agen ACP                 | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime |
| Mengekspos sesi Gateway OpenClaw _sebagai_ server ACP untuk editor atau klien      | [`openclaw acp`](/cli/acp)            | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                         |
| Menggunakan kembali AI CLI lokal sebagai model fallback teks saja                  | [Backend CLI](/id/gateway/cli-backends)  | Bukan ACP. Tidak ada tool OpenClaw, tidak ada kontrol ACP, tidak ada runtime harness                             |

## Apakah ini bekerja langsung tanpa penyiapan tambahan?

Biasanya, ya.

- Instalasi baru sekarang dikirim dengan plugin runtime `acpx` bawaan yang aktif secara default.
- Plugin `acpx` bawaan lebih memilih biner `acpx` yang dipatok lokal pada plugin.
- Saat startup, OpenClaw memeriksa biner tersebut dan memperbaikinya sendiri jika diperlukan.
- Mulailah dengan `/acp doctor` jika Anda ingin pemeriksaan kesiapan yang cepat.

Yang masih bisa terjadi saat penggunaan pertama:

- Adapter harness target dapat diambil sesuai kebutuhan dengan `npx` saat pertama kali Anda menggunakan harness tersebut.
- Auth vendor tetap harus ada pada host untuk harness tersebut.
- Jika host tidak memiliki akses npm/jaringan, pengambilan adapter saat pertama kali dapat gagal sampai cache dipanaskan terlebih dahulu atau adapter diinstal dengan cara lain.

Contoh:

- `/acp spawn codex`: OpenClaw seharusnya siap melakukan bootstrap `acpx`, tetapi adapter ACP Codex mungkin masih memerlukan pengambilan saat pertama kali.
- `/acp spawn claude`: cerita yang sama untuk adapter Claude ACP, ditambah auth sisi Claude pada host tersebut.

## Alur operator cepat

Gunakan ini jika Anda menginginkan runbook `/acp` yang praktis:

1. Spawn sesi:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Bekerja di percakapan atau thread yang terikat (atau targetkan session key tersebut secara eksplisit).
3. Periksa status runtime:
   - `/acp status`
4. Sesuaikan opsi runtime sesuai kebutuhan:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Dorong sesi aktif tanpa mengganti konteks:
   - `/acp steer tighten logging and continue`
6. Hentikan pekerjaan:
   - `/acp cancel` (hentikan giliran saat ini), atau
   - `/acp close` (tutup sesi + hapus binding)

## Mulai cepat untuk manusia

Contoh permintaan alami:

- "Bind this Discord channel to Codex."
- "Start a persistent Codex session in a thread here and keep it focused."
- "Run this as a one-shot Claude Code ACP session and summarize the result."
- "Bind this iMessage chat to Codex and keep follow-ups in the same workspace."
- "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."

Yang seharusnya dilakukan OpenClaw:

1. Pilih `runtime: "acp"`.
2. Resolusikan target harness yang diminta (`agentId`, misalnya `codex`).
3. Jika binding ke percakapan saat ini diminta dan channel aktif mendukungnya, ikat sesi ACP ke percakapan itu.
4. Jika tidak, bila binding thread diminta dan channel saat ini mendukungnya, ikat sesi ACP ke thread tersebut.
5. Rutekan pesan lanjutan yang terikat ke sesi ACP yang sama sampai fokus dilepas/ditutup/kedaluwarsa.

## ACP versus sub-agen

Gunakan ACP saat Anda menginginkan runtime harness eksternal. Gunakan sub-agen saat Anda menginginkan eksekusi delegasi native OpenClaw.

| Area          | Sesi ACP                              | Eksekusi sub-agen                   |
| ------------- | ------------------------------------- | ----------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime sub-agen native OpenClaw    |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| Perintah utama | `/acp ...`                           | `/subagents ...`                    |
| Tool spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agen](/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, stack-nya adalah:

1. Control plane sesi ACP OpenClaw
2. Plugin runtime `acpx` bawaan
3. Adapter Claude ACP
4. Mesin runtime/sesi sisi Claude

Perbedaan penting:

- ACP Claude tidak sama dengan runtime fallback langsung `claude-cli/...`.
- ACP Claude adalah sesi harness dengan kontrol ACP, resume sesi, pelacakan tugas latar belakang, dan binding percakapan/thread opsional.
- `claude-cli/...` adalah backend CLI lokal teks saja. Lihat [Backend CLI](/id/gateway/cli-backends).

Bagi operator, aturan praktisnya adalah:

- ingin `/acp spawn`, sesi yang bisa di-bind, kontrol runtime, atau pekerjaan harness persisten: gunakan ACP
- ingin fallback teks lokal sederhana melalui CLI mentah: gunakan backend CLI

## Sesi terikat

### Binding percakapan saat ini

Gunakan `/acp spawn <harness> --bind here` saat Anda ingin percakapan saat ini menjadi workspace ACP yang tahan lama tanpa membuat child thread.

Perilaku:

- OpenClaw tetap memiliki transport channel, auth, keamanan, dan pengiriman.
- Percakapan saat ini dipatok ke session key ACP yang di-spawn.
- Pesan lanjutan dalam percakapan itu dirutekan ke sesi ACP yang sama.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi dan menghapus binding percakapan saat ini.

Arti praktisnya:

- `--bind here` mempertahankan permukaan chat yang sama. Di Discord, channel saat ini tetap channel yang sama.
- `--bind here` tetap dapat membuat sesi ACP baru jika Anda sedang memulai pekerjaan baru. Binding tersebut menautkan sesi itu ke percakapan saat ini.
- `--bind here` tidak dengan sendirinya membuat child thread Discord atau topik Telegram.
- Runtime ACP tetap dapat memiliki working directory (`cwd`) sendiri atau workspace yang dikelola backend di disk. Workspace runtime itu terpisah dari permukaan chat dan tidak menyiratkan thread pesan baru.
- Jika Anda spawn ke agen ACP yang berbeda dan tidak memberikan `--cwd`, OpenClaw mewarisi workspace **agen target** secara default, bukan workspace peminta.
- Jika path workspace turunan itu hilang (`ENOENT`/`ENOTDIR`), OpenClaw kembali ke cwd default backend alih-alih diam-diam memakai tree yang salah.
- Jika workspace turunan itu ada tetapi tidak dapat diakses (misalnya `EACCES`), spawn mengembalikan error akses yang sebenarnya alih-alih membuang `cwd`.

Model mental:

- permukaan chat: tempat orang tetap berbicara (`Discord channel`, `Telegram topic`, `iMessage chat`)
- sesi ACP: status runtime Codex/Claude/Gemini yang tahan lama yang menjadi tujuan routing OpenClaw
- child thread/topic: permukaan pesan tambahan opsional yang dibuat hanya oleh `--thread ...`
- workspace runtime: lokasi filesystem tempat harness berjalan (`cwd`, checkout repo, workspace backend)

Contoh:

- `/acp spawn codex --bind here`: pertahankan chat ini, spawn atau hubungkan sesi ACP Codex, dan rutekan pesan mendatang di sini ke sesi itu
- `/acp spawn codex --thread auto`: OpenClaw dapat membuat child thread/topic dan mengikat sesi ACP di sana
- `/acp spawn codex --bind here --cwd /workspace/repo`: binding chat yang sama seperti di atas, tetapi Codex berjalan di `/workspace/repo`

Dukungan binding percakapan saat ini:

- Channel chat/pesan yang mengiklankan dukungan binding percakapan saat ini dapat menggunakan `--bind here` melalui jalur binding percakapan bersama.
- Channel dengan semantik thread/topik khusus tetap dapat menyediakan kanonisasi khusus channel di balik antarmuka bersama yang sama.
- `--bind here` selalu berarti "ikat percakapan saat ini di tempat".
- Binding percakapan saat ini generik menggunakan penyimpanan binding OpenClaw bersama dan bertahan dari restart gateway normal.

Catatan:

- `--bind here` dan `--thread ...` saling eksklusif pada `/acp spawn`.
- Di Discord, `--bind here` mengikat channel atau thread saat ini di tempat. `spawnAcpSessions` hanya diperlukan saat OpenClaw perlu membuat child thread untuk `--thread auto|here`.
- Jika channel aktif tidak mengekspos binding ACP percakapan saat ini, OpenClaw mengembalikan pesan unsupported yang jelas.
- Pertanyaan `resume` dan "new session" adalah pertanyaan sesi ACP, bukan pertanyaan channel. Anda dapat menggunakan kembali atau mengganti status runtime tanpa mengubah permukaan chat saat ini.

### Sesi terikat thread

Saat binding thread diaktifkan untuk adapter channel, sesi ACP dapat diikat ke thread:

- OpenClaw mengikat thread ke sesi ACP target.
- Pesan lanjutan di thread tersebut dirutekan ke sesi ACP yang terikat.
- Output ACP dikirim kembali ke thread yang sama.
- Pelepasan fokus/penutupan/pengarsipan/timeout idle atau kedaluwarsa usia maksimum menghapus binding.

Dukungan binding thread bersifat spesifik adapter. Jika adapter channel aktif tidak mendukung binding thread, OpenClaw mengembalikan pesan unsupported/unavailable yang jelas.

Flag fitur yang diperlukan untuk ACP terikat thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` aktif secara default (set `false` untuk menjeda dispatch ACP)
- Flag spawn thread ACP adapter channel diaktifkan (spesifik adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Channel yang mendukung thread

- Setiap adapter channel yang mengekspos kemampuan binding sesi/thread.
- Dukungan bawaan saat ini:
  - Thread/channel Discord
  - Topik Telegram (forum topic di grup/supergrup dan topik DM)
- Plugin channel dapat menambahkan dukungan melalui antarmuka binding yang sama.

## Setelan khusus channel

Untuk alur kerja non-ephemeral, konfigurasi binding ACP persisten dalam entri tingkat atas `bindings[]`.

### Model binding

- `bindings[].type="acp"` menandai binding percakapan ACP persisten.
- `bindings[].match` mengidentifikasi percakapan target:
  - Channel atau thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Topik forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - Chat DM/grup BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Lebih pilih `chat_id:*` atau `chat_identifier:*` untuk binding grup yang stabil.
  - Chat DM/grup iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Lebih pilih `chat_id:*` untuk binding grup yang stabil.
- `bindings[].agentId` adalah id agen OpenClaw pemiliknya.
- Override ACP opsional berada di `bindings[].acp`:
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

Prioritas override untuk sesi terikat ACP:

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
- Pesan pada channel atau topik tersebut dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan terikat, `/new` dan `/reset` mereset session key ACP yang sama di tempat.
- Binding runtime sementara (misalnya yang dibuat oleh alur fokus thread) tetap berlaku jika ada.
- Untuk spawn ACP lintas agen tanpa `cwd` eksplisit, OpenClaw mewarisi workspace agen target dari konfigurasi agen.
- Path workspace turunan yang hilang kembali ke cwd default backend; kegagalan akses pada path yang tidak hilang akan ditampilkan sebagai error spawn.

## Memulai sesi ACP (antarmuka)

### Dari `sessions_spawn`

Gunakan `runtime: "acp"` untuk memulai sesi ACP dari giliran agen atau tool call.

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

- `runtime` default ke `subagent`, jadi setel `runtime: "acp"` secara eksplisit untuk sesi ACP.
- Jika `agentId` dihilangkan, OpenClaw menggunakan `acp.defaultAgent` bila dikonfigurasi.
- `mode: "session"` memerlukan `thread: true` untuk mempertahankan percakapan terikat yang persisten.

Detail antarmuka:

- `task` (wajib): prompt awal yang dikirim ke sesi ACP.
- `runtime` (wajib untuk ACP): harus `"acp"`.
- `agentId` (opsional): id harness ACP target. Fallback ke `acp.defaultAgent` jika disetel.
- `thread` (opsional, default `false`): minta alur binding thread jika didukung.
- `mode` (opsional): `run` (sekali jalan) atau `session` (persisten).
  - default adalah `run`
  - jika `thread: true` dan mode dihilangkan, OpenClaw dapat default ke perilaku persisten per jalur runtime
  - `mode: "session"` memerlukan `thread: true`
- `cwd` (opsional): working directory runtime yang diminta (divalidasi oleh kebijakan backend/runtime). Jika dihilangkan, spawn ACP mewarisi workspace agen target bila dikonfigurasi; path turunan yang hilang akan fallback ke default backend, sedangkan error akses yang nyata dikembalikan.
- `label` (opsional): label yang menghadap operator dan digunakan dalam teks sesi/banner.
- `resumeSessionId` (opsional): lanjutkan sesi ACP yang sudah ada alih-alih membuat yang baru. Agen memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan `runtime: "acp"`.
- `streamTo` (opsional): `"parent"` mengalirkan ringkasan progres eksekusi ACP awal kembali ke sesi peminta sebagai event sistem.
  - Saat tersedia, respons yang diterima mencakup `streamLogPath` yang menunjuk ke log JSONL berlingkup sesi (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk riwayat relay penuh.

### Melanjutkan sesi yang sudah ada

Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih memulai dari awal. Agen memutar ulang riwayat percakapannya melalui `session/load`, sehingga ia melanjutkan dengan konteks penuh dari yang sudah terjadi sebelumnya.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Kasus penggunaan umum:

- Serahkan sesi Codex dari laptop Anda ke ponsel — beri tahu agen Anda untuk melanjutkan dari titik terakhir
- Lanjutkan sesi coding yang Anda mulai secara interaktif di CLI, sekarang tanpa kepala melalui agen Anda
- Lanjutkan pekerjaan yang terputus oleh restart gateway atau timeout idle

Catatan:

- `resumeSessionId` memerlukan `runtime: "acp"` — mengembalikan error jika digunakan dengan runtime sub-agen.
- `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal pada sesi OpenClaw baru yang Anda buat, jadi `mode: "session"` tetap memerlukan `thread: true`.
- Agen target harus mendukung `session/load` (Codex dan Claude Code mendukung).
- Jika ID sesi tidak ditemukan, spawn gagal dengan error yang jelas — tidak ada fallback diam-diam ke sesi baru.

### Smoke test operator

Gunakan ini setelah deploy gateway ketika Anda menginginkan pemeriksaan live cepat bahwa spawn ACP
benar-benar berfungsi end-to-end, bukan hanya lolos unit test.

Gate yang direkomendasikan:

1. Verifikasi versi/commit gateway yang dideploy pada host target.
2. Konfirmasikan source yang dideploy mencakup penerimaan lineage ACP di
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Buka sesi bridge ACPX sementara ke agen live (misalnya
   `razor(main)` pada `jpclawhq`).
4. Minta agen tersebut memanggil `sessions_spawn` dengan:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifikasi agen melaporkan:
   - `accepted=yes`
   - `childSessionKey` yang nyata
   - tidak ada error validator
6. Bersihkan sesi bridge ACPX sementara.

Contoh prompt ke agen live:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Catatan:

- Pertahankan smoke test ini pada `mode: "run"` kecuali Anda memang sengaja menguji
  sesi ACP persisten yang terikat thread.
- Jangan mensyaratkan `streamTo: "parent"` untuk gate dasar. Jalur itu bergantung pada
  kemampuan requester/sesi dan merupakan pemeriksaan integrasi terpisah.
- Perlakukan pengujian `mode: "session"` yang terikat thread sebagai pass integrasi
  kedua yang lebih kaya dari thread Discord atau topik Telegram yang nyata.

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, bukan di dalam sandbox OpenClaw.

Batasan saat ini:

- Jika sesi peminta berada dalam sandbox, spawn ACP diblokir untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Gunakan `runtime: "subagent"` saat Anda memerlukan eksekusi yang dipaksakan sandbox.

### Dari perintah `/acp`

Gunakan `/acp spawn` untuk kontrol operator eksplisit dari chat bila diperlukan.

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

Lihat [Slash Commands](/tools/slash-commands).

## Resolusi target sesi

Sebagian besar aksi `/acp` menerima target sesi opsional (`session-key`, `session-id`, atau `session-label`).

Urutan resolusi:

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - mencoba key
   - lalu session id berbentuk UUID
   - lalu label
2. Binding thread saat ini (jika percakapan/thread ini terikat ke sesi ACP)
3. Fallback sesi peminta saat ini

Binding percakapan saat ini dan binding thread sama-sama berpartisipasi dalam langkah 2.

Jika tidak ada target yang dapat diresolusikan, OpenClaw mengembalikan error yang jelas (`Unable to resolve session target: ...`).

## Mode bind spawn

`/acp spawn` mendukung `--bind here|off`.

| Mode   | Perilaku                                                                |
| ------ | ----------------------------------------------------------------------- |
| `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
| `off`  | Jangan buat binding percakapan saat ini.                                |

Catatan:

- `--bind here` adalah jalur operator paling sederhana untuk "jadikan channel atau chat ini didukung Codex."
- `--bind here` tidak membuat child thread.
- `--bind here` hanya tersedia pada channel yang mengekspos dukungan binding percakapan saat ini.
- `--bind` dan `--thread` tidak dapat digabungkan dalam panggilan `/acp spawn` yang sama.

## Mode thread spawn

`/acp spawn` mendukung `--thread auto|here|off`.

| Mode   | Perilaku                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------- |
| `auto` | Dalam thread aktif: ikat thread tersebut. Di luar thread: buat/ikat child thread bila didukung.      |
| `here` | Wajib berada di thread aktif saat ini; gagal jika tidak berada di thread.                             |
| `off`  | Tanpa binding. Sesi dimulai tanpa terikat.                                                            |

Catatan:

- Pada permukaan tanpa binding thread, perilaku default secara efektif adalah `off`.
- Spawn terikat thread memerlukan dukungan kebijakan channel:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Gunakan `--bind here` saat Anda ingin mematok percakapan saat ini tanpa membuat child thread.

## Kontrol ACP

Keluarga perintah yang tersedia:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` menampilkan opsi runtime efektif dan, bila tersedia, pengenal sesi tingkat runtime maupun tingkat backend.

Sebagian kontrol bergantung pada kemampuan backend. Jika backend tidak mendukung suatu kontrol, OpenClaw mengembalikan error unsupported-control yang jelas.

## Buku resep perintah ACP

| Perintah             | Yang dilakukan                                                | Contoh                                                        |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; binding saat ini atau binding thread opsional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan giliran yang sedang berjalan untuk sesi target.   | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Mengirim instruksi steer ke sesi yang sedang berjalan.        | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas binding target thread.               | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, state, opsi runtime, kemampuan.    | `/acp status`                                                 |
| `/acp set-mode`      | Menyetel mode runtime untuk sesi target.                      | `/acp set-mode plan`                                          |
| `/acp set`           | Penulisan opsi config runtime generik.                        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Menyetel override working directory runtime.                  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Menyetel profil kebijakan persetujuan.                        | `/acp permissions strict`                                     |
| `/acp timeout`       | Menyetel timeout runtime (detik).                             | `/acp timeout 120`                                            |
| `/acp model`         | Menyetel override model runtime.                              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus override opsi runtime sesi.                         | `/acp reset-options`                                          |
| `/acp sessions`      | Menampilkan daftar sesi ACP terbaru dari store.               | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, kemampuan, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                            |
| `/acp install`       | Menampilkan langkah instalasi dan aktivasi yang deterministik. | `/acp install`                                               |

`/acp sessions` membaca store untuk sesi terikat saat ini atau sesi peminta. Perintah yang menerima token `session-key`, `session-id`, atau `session-label` meresolusikan target melalui penemuan sesi gateway, termasuk root `session.store` per agen kustom.

## Pemetaan opsi runtime

`/acp` memiliki perintah kemudahan dan setter generik.

Operasi yang setara:

- `/acp model <id>` dipetakan ke key config runtime `model`.
- `/acp permissions <profile>` dipetakan ke key config runtime `approval_policy`.
- `/acp timeout <seconds>` dipetakan ke key config runtime `timeout`.
- `/acp cwd <path>` memperbarui override cwd runtime secara langsung.
- `/acp set <key> <value>` adalah jalur generik.
  - Kasus khusus: `key=cwd` menggunakan jalur override cwd.
- `/acp reset-options` menghapus semua override runtime untuk sesi target.

## Dukungan harness acpx (saat ini)

Alias harness bawaan acpx saat ini:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Saat OpenClaw menggunakan backend acpx, pilih nilai ini untuk `agentId` kecuali config acpx Anda mendefinisikan alias agen kustom.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, override perintah agen `cursor` dalam config acpx Anda alih-alih mengubah default bawaannya.

Penggunaan CLI acpx langsung juga dapat menargetkan adapter arbitrer melalui `--agent <command>`, tetapi escape hatch mentah tersebut adalah fitur CLI acpx (bukan jalur `agentId` OpenClaw yang normal).

## Konfigurasi yang diperlukan

Baseline ACP inti:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Default adalah true; set false untuk menjeda dispatch ACP sambil mempertahankan kontrol /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Konfigurasi binding thread bersifat spesifik adapter channel. Contoh untuk Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Jika spawn ACP terikat thread tidak berfungsi, verifikasi terlebih dahulu flag fitur adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Binding percakapan saat ini tidak memerlukan pembuatan child thread. Binding ini memerlukan konteks percakapan aktif dan adapter channel yang mengekspos binding percakapan ACP.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference).

## Penyiapan plugin untuk backend acpx

Instalasi baru dikirim dengan plugin runtime `acpx` bawaan yang aktif secara default, jadi ACP
biasanya berfungsi tanpa langkah instalasi plugin manual.

Mulailah dengan:

```text
/acp doctor
```

Jika Anda menonaktifkan `acpx`, menolaknya melalui `plugins.allow` / `plugins.deny`, atau ingin
beralih ke checkout pengembangan lokal, gunakan jalur plugin eksplisit:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalasi workspace lokal selama pengembangan:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Lalu verifikasi kesehatan backend:

```text
/acp doctor
```

### Konfigurasi perintah dan versi acpx

Secara default, plugin backend acpx bawaan (`acpx`) menggunakan biner pinned lokal pada plugin:

1. Perintah default ke `node_modules/.bin/acpx` lokal plugin di dalam paket plugin ACPX.
2. Versi yang diharapkan default ke pin ekstensi.
3. Saat startup, backend ACP langsung didaftarkan sebagai belum siap.
4. Tugas ensure latar belakang memverifikasi `acpx --version`.
5. Jika biner lokal plugin hilang atau tidak cocok, plugin menjalankan:
   `npm install --omit=dev --no-save acpx@<pinned>` lalu memverifikasi ulang.

Anda dapat meng-override perintah/versi di config plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Catatan:

- `command` menerima path absolut, path relatif, atau nama perintah (`acpx`).
- Path relatif diresolusikan dari direktori workspace OpenClaw.
- `expectedVersion: "any"` menonaktifkan pencocokan versi ketat.
- Saat `command` menunjuk ke biner/path kustom, instalasi otomatis lokal plugin dinonaktifkan.
- Startup OpenClaw tetap non-blocking saat pemeriksaan kesehatan backend berjalan.

Lihat [Plugins](/tools/plugin).

### Instalasi dependensi otomatis

Saat Anda menginstal OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime acpx
(biner spesifik platform) diinstal secara otomatis melalui hook postinstall. Jika instalasi otomatis gagal, gateway tetap mulai
secara normal dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Bridge MCP tool plugin

Secara default, sesi ACPX **tidak** mengekspos tool yang didaftarkan plugin OpenClaw ke
harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code memanggil
tool plugin OpenClaw yang terinstal seperti memory recall/store, aktifkan bridge khusus ini:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Yang dilakukan ini:

- Menyisipkan server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap sesi ACPX.
- Mengekspos tool plugin yang sudah didaftarkan oleh plugin OpenClaw yang terinstal dan aktif.
- Menjaga fitur ini tetap eksplisit dan nonaktif secara default.

Catatan keamanan dan trust:

- Ini memperluas permukaan tool harness ACP.
- Agen ACP hanya mendapatkan akses ke tool plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas kepercayaan yang sama seperti saat mengizinkan plugin tersebut berjalan di
  OpenClaw itu sendiri.
- Tinjau plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` kustom tetap berfungsi seperti sebelumnya. Bridge plugin-tools bawaan adalah
kemudahan tambahan opt-in, bukan pengganti konfigurasi server MCP generik.

## Konfigurasi izin

Sesi ACP berjalan secara non-interaktif — tidak ada TTY untuk menyetujui atau menolak prompt izin penulisan file dan eksekusi shell. Plugin acpx menyediakan dua key config yang mengontrol cara izin ditangani:

Izin harness ACPX ini terpisah dari persetujuan exec OpenClaw dan terpisah dari flag bypass vendor backend CLI seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah sakelar break-glass tingkat harness untuk sesi ACP.

### `permissionMode`

Mengontrol operasi mana yang dapat dilakukan agen harness tanpa prompt.

| Nilai           | Perilaku                                                   |
| --------------- | ---------------------------------------------------------- |
| `approve-all`   | Setujui otomatis semua penulisan file dan perintah shell.  |
| `approve-reads` | Setujui otomatis hanya pembacaan; penulisan dan exec memerlukan prompt. |
| `deny-all`      | Tolak semua prompt izin.                                   |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi ketika prompt izin seharusnya ditampilkan tetapi tidak ada TTY interaktif yang tersedia (yang selalu terjadi untuk sesi ACP).

| Nilai | Perilaku                                                         |
| ----- | ---------------------------------------------------------------- |
| `fail` | Batalkan sesi dengan `AcpRuntimeError`. **(default)**           |
| `deny` | Tolak izin secara diam-diam dan lanjutkan (degradasi anggun).   |

### Konfigurasi

Setel melalui config plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Restart gateway setelah mengubah nilai-nilai ini.

> **Penting:** OpenClaw saat ini default ke `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, penulisan atau exec apa pun yang memicu prompt izin dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jika Anda perlu membatasi izin, setel `nonInteractivePermissions` ke `deny` agar sesi mengalami degradasi secara anggun alih-alih crash.

## Pemecahan masalah

| Gejala                                                                      | Penyebab yang mungkin                                                              | Perbaikan                                                                                                                                                         |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend tidak ada atau dinonaktifkan.                                       | Instal dan aktifkan plugin backend, lalu jalankan `/acp doctor`.                                                                                                  |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                   | Setel `acp.enabled=true`.                                                                                                                                         |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch dari pesan thread normal dinonaktifkan.                                   | Setel `acp.dispatch.enabled=true`.                                                                                                                                |
| `ACP agent "<id>" is not allowed by policy`                                 | Agen tidak ada dalam allowlist.                                                    | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                               |
| `Unable to resolve session target: ...`                                     | Token key/id/label salah.                                                          | Jalankan `/acp sessions`, salin key/label yang tepat, lalu coba lagi.                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang bisa di-bind.                  | Pindah ke chat/channel target lalu coba lagi, atau gunakan spawn tanpa binding.                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter tidak memiliki kemampuan binding ACP percakapan saat ini.                  | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasi `bindings[]` tingkat atas, atau pindah ke channel yang didukung.                               |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks thread.                                  | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                       |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target binding aktif.                                       | Rebind sebagai pemilik atau gunakan percakapan atau thread yang berbeda.                                                                                          |
| `Thread bindings are unavailable for <channel>.`                            | Adapter tidak memiliki kemampuan binding thread.                                   | Gunakan `--thread off` atau pindah ke adapter/channel yang didukung.                                                                                              |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berjalan di sisi host; sesi peminta berada dalam sandbox.              | Gunakan `runtime="subagent"` dari sesi yang disandbox, atau jalankan spawn ACP dari sesi yang tidak disandbox.                                                   |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                     | Gunakan `runtime="subagent"` untuk sandboxing wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi yang tidak disandbox.                                 |
| Metadata ACP hilang untuk sesi terikat                                      | Metadata sesi ACP basi/terhapus.                                                   | Buat ulang dengan `/acp spawn`, lalu lakukan rebind/fokus thread.                                                                                                 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir penulisan/exec dalam sesi ACP non-interaktif.           | Setel `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan restart gateway. Lihat [Konfigurasi izin](#konfigurasi-izin).                           |
| Sesi ACP gagal lebih awal dengan output yang minim                          | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.            | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, setel `permissionMode=approve-all`; untuk degradasi anggun, setel `nonInteractivePermissions=deny`. |
| Sesi ACP macet tanpa batas setelah menyelesaikan pekerjaan                  | Proses harness selesai tetapi sesi ACP tidak melaporkan penyelesaian.              | Pantau dengan `ps aux \| grep acpx`; bunuh proses basi secara manual.                                                                                             |
