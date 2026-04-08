---
read_when:
    - Menjalankan harness coding melalui ACP
    - Menyiapkan sesi ACP yang terikat percakapan pada saluran pesan
    - Mengikat percakapan saluran pesan ke sesi ACP persisten
    - Memecahkan masalah backend ACP dan wiring plugin
    - Mengoperasikan perintah `/acp` dari chat
summary: Gunakan sesi runtime ACP untuk Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP, dan agen harness lainnya
title: Agen ACP
x-i18n:
    generated_at: "2026-04-08T02:19:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71c7c0cdae5247aefef17a0029360950a1c2987ddcee21a1bb7d78c67da52950
    source_path: tools/acp-agents.md
    workflow: 15
---

# Agen ACP

Sesi [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) memungkinkan OpenClaw menjalankan harness coding eksternal (misalnya Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI, dan harness ACPX lain yang didukung) melalui plugin backend ACP.

Jika Anda meminta OpenClaw dalam bahasa biasa untuk "jalankan ini di Codex" atau "mulai Claude Code di thread", OpenClaw harus merutekan permintaan itu ke runtime ACP (bukan runtime sub-agent native). Setiap spawn sesi ACP dilacak sebagai [tugas latar belakang](/id/automation/tasks).

Jika Anda ingin Codex atau Claude Code terhubung sebagai klien MCP eksternal langsung
ke percakapan saluran OpenClaw yang sudah ada, gunakan [`openclaw mcp serve`](/cli/mcp)
alih-alih ACP.

## Halaman mana yang saya butuhkan?

Ada tiga permukaan terdekat yang mudah membingungkan:

| Anda ingin...                                                                     | Gunakan ini                           | Catatan                                                                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Menjalankan Codex, Claude Code, Gemini CLI, atau harness eksternal lain _melalui_ OpenClaw | Halaman ini: agen ACP                 | Sesi terikat chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tugas latar belakang, kontrol runtime |
| Mengekspos sesi OpenClaw Gateway _sebagai_ server ACP untuk editor atau klien      | [`openclaw acp`](/cli/acp)            | Mode bridge. IDE/klien berbicara ACP ke OpenClaw melalui stdio/WebSocket                                           |
| Menggunakan ulang CLI AI lokal sebagai model fallback teks saja                    | [CLI Backends](/id/gateway/cli-backends) | Bukan ACP. Tidak ada tool OpenClaw, tidak ada kontrol ACP, tidak ada runtime harness                              |

## Apakah ini bekerja langsung tanpa konfigurasi tambahan?

Biasanya, ya.

- Instalasi baru kini dikirim dengan plugin runtime `acpx` terbundel yang aktif secara default.
- Plugin `acpx` terbundel memprioritaskan biner `acpx` lokal plugin yang dipatok versinya.
- Saat startup, OpenClaw memeriksa biner itu dan memperbaikinya sendiri jika diperlukan.
- Mulailah dengan `/acp doctor` jika Anda ingin pemeriksaan kesiapan yang cepat.

Yang masih bisa terjadi pada penggunaan pertama:

- Adaptor harness target mungkin diambil sesuai kebutuhan dengan `npx` saat pertama kali Anda menggunakan harness itu.
- Auth vendor tetap harus ada di host untuk harness tersebut.
- Jika host tidak memiliki akses npm/jaringan, pengambilan adaptor pertama kali dapat gagal sampai cache dipanaskan sebelumnya atau adaptor diinstal dengan cara lain.

Contoh:

- `/acp spawn codex`: OpenClaw seharusnya siap mem-bootstrap `acpx`, tetapi adaptor ACP Codex mungkin masih memerlukan pengambilan pertama kali.
- `/acp spawn claude`: cerita yang sama untuk adaptor ACP Claude, ditambah auth sisi Claude pada host tersebut.

## Alur operator cepat

Gunakan ini jika Anda menginginkan runbook `/acp` yang praktis:

1. Spawn sebuah sesi:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Bekerja di percakapan atau thread yang terikat (atau targetkan kunci sesi itu secara eksplisit).
3. Periksa status runtime:
   - `/acp status`
4. Sesuaikan opsi runtime sesuai kebutuhan:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Beri arahan pada sesi aktif tanpa mengganti konteks:
   - `/acp steer tighten logging and continue`
6. Hentikan pekerjaan:
   - `/acp cancel` (hentikan giliran saat ini), atau
   - `/acp close` (tutup sesi + hapus binding)

## Mulai cepat untuk manusia

Contoh permintaan alami:

- "Ikat saluran Discord ini ke Codex."
- "Mulai sesi Codex persisten di thread di sini dan tetap fokus."
- "Jalankan ini sebagai sesi ACP Claude Code one-shot dan ringkas hasilnya."
- "Ikat chat iMessage ini ke Codex dan pertahankan tindak lanjut di workspace yang sama."
- "Gunakan Gemini CLI untuk tugas ini di thread, lalu pertahankan tindak lanjut di thread yang sama."

Yang seharusnya dilakukan OpenClaw:

1. Pilih `runtime: "acp"`.
2. Selesaikan target harness yang diminta (`agentId`, misalnya `codex`).
3. Jika binding percakapan saat ini diminta dan saluran aktif mendukungnya, ikat sesi ACP ke percakapan tersebut.
4. Jika tidak, jika binding thread diminta dan saluran saat ini mendukungnya, ikat sesi ACP ke thread.
5. Rutekan pesan tindak lanjut yang terikat ke sesi ACP yang sama sampai di-unfocus/ditutup/kedaluwarsa.

## ACP versus sub-agent

Gunakan ACP ketika Anda menginginkan runtime harness eksternal. Gunakan sub-agent ketika Anda menginginkan eksekusi delegasi native OpenClaw.

| Area          | Sesi ACP                              | Eksekusi sub-agent                 |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (misalnya acpx)    | Runtime sub-agent native OpenClaw  |
| Kunci sesi    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Perintah utama | `/acp ...`                           | `/subagents ...`                   |
| Tool spawn    | `sessions_spawn` dengan `runtime:"acp"` | `sessions_spawn` (runtime default) |

Lihat juga [Sub-agents](/id/tools/subagents).

## Cara ACP menjalankan Claude Code

Untuk Claude Code melalui ACP, stack-nya adalah:

1. Control plane sesi ACP OpenClaw
2. plugin runtime `acpx` terbundel
3. adaptor ACP Claude
4. mesin runtime/sesi sisi Claude

Perbedaan penting:

- ACP Claude adalah sesi harness dengan kontrol ACP, resume sesi, pelacakan tugas latar belakang, dan binding percakapan/thread opsional.
- CLI backend adalah runtime fallback lokal terpisah yang hanya berbasis teks. Lihat [CLI Backends](/id/gateway/cli-backends).

Bagi operator, aturan praktisnya adalah:

- ingin `/acp spawn`, sesi yang bisa di-bind, kontrol runtime, atau pekerjaan harness persisten: gunakan ACP
- ingin fallback teks lokal sederhana melalui CLI mentah: gunakan CLI backends

## Sesi terikat

### Binding percakapan saat ini

Gunakan `/acp spawn <harness> --bind here` saat Anda ingin percakapan saat ini menjadi workspace ACP yang tahan lama tanpa membuat thread anak.

Perilaku:

- OpenClaw tetap memiliki transport, auth, keamanan, dan pengiriman saluran.
- Percakapan saat ini dipasang ke kunci sesi ACP yang di-spawn.
- Pesan tindak lanjut di percakapan itu dirutekan ke sesi ACP yang sama.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi dan menghapus binding percakapan saat ini.

Apa artinya dalam praktik:

- `--bind here` mempertahankan permukaan chat yang sama. Di Discord, saluran saat ini tetap menjadi saluran saat ini.
- `--bind here` tetap dapat membuat sesi ACP baru jika Anda sedang melakukan spawn pekerjaan baru. Binding menempelkan sesi itu ke percakapan saat ini.
- `--bind here` tidak membuat thread anak Discord atau topik Telegram dengan sendirinya.
- Runtime ACP tetap dapat memiliki direktori kerja (`cwd`) sendiri atau workspace yang dikelola backend di disk. Workspace runtime itu terpisah dari permukaan chat dan tidak menyiratkan thread pesan baru.
- Jika Anda spawn ke agen ACP lain dan tidak memberikan `--cwd`, OpenClaw mewarisi workspace **agen target**, bukan milik peminta.
- Jika path workspace turunan itu hilang (`ENOENT`/`ENOTDIR`), OpenClaw fallback ke `cwd` default backend alih-alih diam-diam menggunakan tree yang salah.
- Jika workspace turunan itu ada tetapi tidak dapat diakses (misalnya `EACCES`), spawn mengembalikan error akses yang sebenarnya alih-alih membuang `cwd`.

Model mental:

- permukaan chat: tempat orang terus berbicara (`saluran Discord`, `topik Telegram`, `chat iMessage`)
- sesi ACP: status runtime Codex/Claude/Gemini tahan lama yang dirutekan oleh OpenClaw
- thread/topik anak: permukaan pesan tambahan opsional yang dibuat hanya oleh `--thread ...`
- workspace runtime: lokasi filesystem tempat harness berjalan (`cwd`, checkout repo, workspace backend)

Contoh:

- `/acp spawn codex --bind here`: pertahankan chat ini, spawn atau lampirkan sesi ACP Codex, dan rutekan pesan mendatang di sini ke sesi itu
- `/acp spawn codex --thread auto`: OpenClaw dapat membuat thread/topik anak dan mengikat sesi ACP di sana
- `/acp spawn codex --bind here --cwd /workspace/repo`: binding chat yang sama seperti di atas, tetapi Codex berjalan di `/workspace/repo`

Dukungan binding percakapan saat ini:

- Saluran chat/pesan yang mengiklankan dukungan binding percakapan saat ini dapat menggunakan `--bind here` melalui jalur conversation-binding bersama.
- Saluran dengan semantik thread/topik kustom tetap dapat menyediakan kanonisasi khusus saluran di balik antarmuka bersama yang sama.
- `--bind here` selalu berarti "ikat percakapan saat ini di tempat".
- Binding percakapan saat ini generik menggunakan penyimpanan binding bersama OpenClaw dan tetap bertahan setelah restart gateway normal.

Catatan:

- `--bind here` dan `--thread ...` saling eksklusif pada `/acp spawn`.
- Di Discord, `--bind here` mengikat saluran atau thread saat ini di tempat. `spawnAcpSessions` hanya diperlukan ketika OpenClaw perlu membuat thread anak untuk `--thread auto|here`.
- Jika saluran aktif tidak mengekspos binding ACP percakapan saat ini, OpenClaw mengembalikan pesan unsupported yang jelas.
- `resume` dan pertanyaan "sesi baru" adalah pertanyaan sesi ACP, bukan pertanyaan saluran. Anda dapat menggunakan kembali atau mengganti status runtime tanpa mengubah permukaan chat saat ini.

### Sesi terikat thread

Ketika binding thread diaktifkan untuk adaptor saluran, sesi ACP dapat diikat ke thread:

- OpenClaw mengikat thread ke sesi ACP target.
- Pesan tindak lanjut di thread itu dirutekan ke sesi ACP yang terikat.
- Output ACP dikirim kembali ke thread yang sama.
- Unfocus/tutup/arsip/idle-timeout atau kedaluwarsa max-age menghapus binding.

Dukungan binding thread bersifat spesifik adaptor. Jika adaptor saluran aktif tidak mendukung binding thread, OpenClaw mengembalikan pesan unsupported/unavailable yang jelas.

Feature flag yang diperlukan untuk ACP terikat thread:

- `acp.enabled=true`
- `acp.dispatch.enabled` aktif secara default (set `false` untuk menjeda dispatch ACP)
- Feature flag spawn thread ACP adaptor saluran aktif (spesifik adaptor)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Saluran yang mendukung thread

- Adaptor saluran apa pun yang mengekspos capability binding sesi/thread.
- Dukungan bawaan saat ini:
  - thread/saluran Discord
  - topik Telegram (forum topic di grup/supergroup dan topik DM)
- Plugin saluran dapat menambahkan dukungan melalui antarmuka binding yang sama.

## Pengaturan khusus saluran

Untuk alur kerja non-ephemeral, konfigurasikan binding ACP persisten dalam entri tingkat atas `bindings[]`.

### Model binding

- `bindings[].type="acp"` menandai binding percakapan ACP persisten.
- `bindings[].match` mengidentifikasi percakapan target:
  - saluran atau thread Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - topik forum Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - chat DM/grup BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Pilih `chat_id:*` atau `chat_identifier:*` untuk binding grup yang stabil.
  - chat DM/grup iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`  
    Pilih `chat_id:*` untuk binding grup yang stabil.
- `bindings[].agentId` adalah id agen OpenClaw pemilik.
- Override ACP opsional berada di bawah `bindings[].acp`:
  - `mode` (`persistent` atau `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Default runtime per agen

Gunakan `agents.list[].runtime` untuk mendefinisikan default ACP satu kali per agen:

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
- Pesan di saluran atau topik itu dirutekan ke sesi ACP yang dikonfigurasi.
- Dalam percakapan terikat, `/new` dan `/reset` mereset kunci sesi ACP yang sama di tempat.
- Binding runtime sementara (misalnya dibuat oleh alur thread-focus) tetap berlaku jika ada.
- Untuk spawn ACP lintas agen tanpa `cwd` eksplisit, OpenClaw mewarisi workspace agen target dari config agen.
- Path workspace turunan yang hilang fallback ke `cwd` default backend; kegagalan akses pada path yang ada akan muncul sebagai error spawn.

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

- `runtime` default-nya adalah `subagent`, jadi tetapkan `runtime: "acp"` secara eksplisit untuk sesi ACP.
- Jika `agentId` dihilangkan, OpenClaw menggunakan `acp.defaultAgent` jika dikonfigurasi.
- `mode: "session"` memerlukan `thread: true` agar tetap mempertahankan percakapan persisten yang terikat.

Detail antarmuka:

- `task` (wajib): prompt awal yang dikirim ke sesi ACP.
- `runtime` (wajib untuk ACP): harus `"acp"`.
- `agentId` (opsional): id harness target ACP. Fallback ke `acp.defaultAgent` jika ditetapkan.
- `thread` (opsional, default `false`): minta alur binding thread jika didukung.
- `mode` (opsional): `run` (one-shot) atau `session` (persisten).
  - default adalah `run`
  - jika `thread: true` dan mode dihilangkan, OpenClaw dapat default ke perilaku persisten per jalur runtime
  - `mode: "session"` memerlukan `thread: true`
- `cwd` (opsional): direktori kerja runtime yang diminta (divalidasi oleh kebijakan backend/runtime). Jika dihilangkan, spawn ACP mewarisi workspace agen target jika dikonfigurasi; path turunan yang hilang fallback ke default backend, sedangkan error akses nyata dikembalikan.
- `label` (opsional): label untuk operator yang digunakan dalam teks sesi/banner.
- `resumeSessionId` (opsional): lanjutkan sesi ACP yang sudah ada alih-alih membuat yang baru. Agen memutar ulang riwayat percakapannya melalui `session/load`. Memerlukan `runtime: "acp"`.
- `streamTo` (opsional): `"parent"` mengalirkan ringkasan progres eksekusi ACP awal kembali ke sesi peminta sebagai system event.
  - Jika tersedia, respons yang diterima mencakup `streamLogPath` yang menunjuk ke log JSONL bercakupan sesi (`<sessionId>.acp-stream.jsonl`) yang dapat Anda tail untuk riwayat relay lengkap.

### Melanjutkan sesi yang sudah ada

Gunakan `resumeSessionId` untuk melanjutkan sesi ACP sebelumnya alih-alih memulai dari awal. Agen memutar ulang riwayat percakapannya melalui `session/load`, sehingga ia melanjutkan dengan konteks lengkap dari yang terjadi sebelumnya.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Kasus penggunaan umum:

- Serahkan sesi Codex dari laptop ke ponsel Anda — minta agen Anda untuk melanjutkan dari tempat terakhir
- Lanjutkan sesi coding yang Anda mulai secara interaktif di CLI, kini secara headless melalui agen Anda
- Lanjutkan pekerjaan yang terhenti karena restart gateway atau idle timeout

Catatan:

- `resumeSessionId` memerlukan `runtime: "acp"` — akan mengembalikan error jika digunakan dengan runtime sub-agent.
- `resumeSessionId` memulihkan riwayat percakapan ACP upstream; `thread` dan `mode` tetap berlaku normal untuk sesi OpenClaw baru yang sedang Anda buat, sehingga `mode: "session"` tetap memerlukan `thread: true`.
- Agen target harus mendukung `session/load` (Codex dan Claude Code mendukungnya).
- Jika id sesi tidak ditemukan, spawn gagal dengan error yang jelas — tidak ada fallback diam-diam ke sesi baru.

### Smoke test operator

Gunakan ini setelah deploy gateway ketika Anda menginginkan pemeriksaan live cepat bahwa spawn ACP
benar-benar bekerja secara end-to-end, bukan hanya lulus unit test.

Gate yang direkomendasikan:

1. Verifikasi versi/commit gateway yang dideploy pada host target.
2. Konfirmasikan source yang dideploy mencakup penerimaan lineage ACP di
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`).
3. Buka sesi bridge ACPX sementara ke agen live (misalnya
   `razor(main)` di `jpclawhq`).
4. Minta agen itu memanggil `sessions_spawn` dengan:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Verifikasi agen melaporkan:
   - `accepted=yes`
   - `childSessionKey` yang nyata
   - tidak ada validator error
6. Bersihkan sesi bridge ACPX sementara.

Contoh prompt ke agen live:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Catatan:

- Pertahankan smoke test ini pada `mode: "run"` kecuali Anda memang sedang menguji
  sesi ACP persisten yang terikat thread.
- Jangan mensyaratkan `streamTo: "parent"` untuk gate dasar. Jalur itu bergantung pada
  capability peminta/sesi dan merupakan pemeriksaan integrasi yang terpisah.
- Perlakukan pengujian `mode: "session"` terikat thread sebagai lintasan integrasi kedua yang lebih kaya
  dari thread Discord atau topik Telegram yang nyata.

## Kompatibilitas sandbox

Sesi ACP saat ini berjalan pada runtime host, bukan di dalam sandbox OpenClaw.

Batasan saat ini:

- Jika sesi peminta menggunakan sandbox, spawn ACP diblokir baik untuk `sessions_spawn({ runtime: "acp" })` maupun `/acp spawn`.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` dengan `runtime: "acp"` tidak mendukung `sandbox: "require"`.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Gunakan `runtime: "subagent"` ketika Anda memerlukan eksekusi yang ditegakkan sandbox.

### Dari perintah `/acp`

Gunakan `/acp spawn` untuk kontrol operator eksplisit dari chat ketika diperlukan.

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

Sebagian besar tindakan `/acp` menerima target sesi opsional (`session-key`, `session-id`, atau `session-label`).

Urutan resolusi:

1. Argumen target eksplisit (atau `--session` untuk `/acp steer`)
   - mencoba key
   - lalu session id berbentuk UUID
   - lalu label
2. Binding thread saat ini (jika percakapan/thread ini terikat ke sesi ACP)
3. Fallback sesi peminta saat ini

Binding percakapan saat ini dan binding thread sama-sama berpartisipasi dalam langkah 2.

Jika tidak ada target yang terselesaikan, OpenClaw mengembalikan error yang jelas (`Unable to resolve session target: ...`).

## Mode bind spawn

`/acp spawn` mendukung `--bind here|off`.

| Mode   | Perilaku                                                              |
| ------ | --------------------------------------------------------------------- |
| `here` | Ikat percakapan aktif saat ini di tempat; gagal jika tidak ada yang aktif. |
| `off`  | Jangan membuat binding percakapan saat ini.                           |

Catatan:

- `--bind here` adalah jalur operator paling sederhana untuk "jadikan saluran atau chat ini didukung Codex."
- `--bind here` tidak membuat thread anak.
- `--bind here` hanya tersedia pada saluran yang mengekspos dukungan binding percakapan saat ini.
- `--bind` dan `--thread` tidak dapat digabungkan dalam pemanggilan `/acp spawn` yang sama.

## Mode thread spawn

`/acp spawn` mendukung `--thread auto|here|off`.

| Mode   | Perilaku                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------- |
| `auto` | Dalam thread aktif: ikat thread itu. Di luar thread: buat/ikat thread anak jika didukung.            |
| `here` | Memerlukan thread aktif saat ini; gagal jika tidak berada di dalam thread.                            |
| `off`  | Tanpa binding. Sesi dimulai tidak terikat.                                                            |

Catatan:

- Pada permukaan non-thread binding, perilaku default secara efektif adalah `off`.
- Spawn terikat thread memerlukan dukungan kebijakan saluran:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Gunakan `--bind here` ketika Anda ingin menempelkan percakapan saat ini tanpa membuat thread anak.

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

`/acp status` menampilkan opsi runtime efektif dan, jika tersedia, identifier sesi tingkat runtime maupun tingkat backend.

Beberapa kontrol bergantung pada capability backend. Jika backend tidak mendukung kontrol tertentu, OpenClaw mengembalikan error unsupported-control yang jelas.

## Buku resep perintah ACP

| Command              | Fungsinya                                                 | Contoh                                                        |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Membuat sesi ACP; binding saat ini atau binding thread opsional. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Membatalkan giliran yang sedang berjalan untuk sesi target. | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Mengirim instruksi steer ke sesi yang sedang berjalan.    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Menutup sesi dan melepas binding target thread.           | `/acp close`                                                  |
| `/acp status`        | Menampilkan backend, mode, state, opsi runtime, capability. | `/acp status`                                                 |
| `/acp set-mode`      | Menetapkan mode runtime untuk sesi target.                | `/acp set-mode plan`                                          |
| `/acp set`           | Penulisan opsi config runtime generik.                    | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Menetapkan override direktori kerja runtime.              | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Menetapkan profil kebijakan persetujuan.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Menetapkan timeout runtime (detik).                       | `/acp timeout 120`                                            |
| `/acp model`         | Menetapkan override model runtime.                        | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Menghapus override opsi runtime sesi.                     | `/acp reset-options`                                          |
| `/acp sessions`      | Mendaftarkan sesi ACP terbaru dari store.                 | `/acp sessions`                                               |
| `/acp doctor`        | Kesehatan backend, capability, perbaikan yang dapat ditindaklanjuti. | `/acp doctor`                                                 |
| `/acp install`       | Mencetak langkah instalasi dan pengaktifan yang deterministik. | `/acp install`                                                |

`/acp sessions` membaca store untuk sesi terikat atau sesi peminta saat ini. Perintah yang menerima token `session-key`, `session-id`, atau `session-label` menyelesaikan target melalui penemuan sesi gateway, termasuk root `session.store` khusus per agen.

## Pemetaan opsi runtime

`/acp` memiliki perintah praktis dan setter generik.

Operasi yang setara:

- `/acp model <id>` dipetakan ke key config runtime `model`.
- `/acp permissions <profile>` dipetakan ke key config runtime `approval_policy`.
- `/acp timeout <seconds>` dipetakan ke key config runtime `timeout`.
- `/acp cwd <path>` memperbarui override cwd runtime secara langsung.
- `/acp set <key> <value>` adalah jalur generik.
  - Kasus khusus: `key=cwd` menggunakan jalur override cwd.
- `/acp reset-options` membersihkan semua override runtime untuk sesi target.

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

Saat OpenClaw menggunakan backend acpx, pilih nilai-nilai ini untuk `agentId` kecuali config acpx Anda mendefinisikan alias agen kustom.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, override perintah agen `cursor` di config acpx Anda alih-alih mengubah default bawaan.

Penggunaan CLI acpx langsung juga dapat menargetkan adaptor arbitrer melalui `--agent <command>`, tetapi escape hatch mentah tersebut adalah fitur CLI acpx (bukan jalur `agentId` OpenClaw yang normal).

## Config yang diperlukan

Baseline ACP inti:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Default adalah true; set false untuk menjeda dispatch ACP sambil tetap mempertahankan kontrol /acp.
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

Config binding thread bersifat spesifik adaptor saluran. Contoh untuk Discord:

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

Jika spawn ACP terikat thread tidak berfungsi, verifikasi terlebih dahulu feature flag adaptor:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Binding percakapan saat ini tidak memerlukan pembuatan thread anak. Ini memerlukan konteks percakapan aktif dan adaptor saluran yang mengekspos binding percakapan ACP.

Lihat [Configuration Reference](/id/gateway/configuration-reference).

## Penyiapan plugin untuk backend acpx

Instalasi baru dikirim dengan plugin runtime `acpx` terbundel yang aktif secara default, sehingga ACP
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

Secara default, plugin backend acpx terbundel (`acpx`) menggunakan biner lokal plugin yang versinya dipatok:

1. Perintah default ke `node_modules/.bin/acpx` lokal plugin di dalam paket plugin ACPX.
2. Versi yang diharapkan default ke pin ekstensi.
3. Startup langsung mendaftarkan backend ACP sebagai not-ready.
4. Pekerjaan ensure di latar belakang memverifikasi `acpx --version`.
5. Jika biner lokal plugin hilang atau tidak cocok, ia menjalankan:
   `npm install --omit=dev --no-save acpx@<pinned>` lalu memverifikasi ulang.

Anda dapat mengoverride perintah/versi di config plugin:

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
- Path relatif diselesaikan dari direktori workspace OpenClaw.
- `expectedVersion: "any"` menonaktifkan pencocokan versi ketat.
- Ketika `command` menunjuk ke biner/path kustom, auto-install lokal plugin dinonaktifkan.
- Startup OpenClaw tetap non-blocking saat pemeriksaan kesehatan backend berjalan.

Lihat [Plugins](/id/tools/plugin).

### Instalasi dependensi otomatis

Ketika Anda menginstal OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime acpx
(biner spesifik platform) diinstal secara otomatis
melalui hook postinstall. Jika instalasi otomatis gagal, gateway tetap mulai secara normal
dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Bridge MCP tool plugin

Secara default, sesi ACPX **tidak** mengekspos tool yang didaftarkan plugin OpenClaw ke
harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code memanggil
tool plugin OpenClaw yang terinstal seperti memory recall/store, aktifkan bridge khusus ini:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap sesi ACPX.
- Mengekspos tool plugin yang sudah didaftarkan oleh plugin OpenClaw yang terinstal dan aktif.
- Menjaga fitur ini tetap eksplisit dan default-nya nonaktif.

Catatan keamanan dan kepercayaan:

- Ini memperluas permukaan tool harness ACP.
- Agen ACP mendapatkan akses hanya ke tool plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas kepercayaan yang sama seperti membiarkan plugin tersebut mengeksekusi di
  OpenClaw itu sendiri.
- Tinjau plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` kustom tetap berfungsi seperti sebelumnya. Bridge plugin-tools bawaan adalah
kenyamanan tambahan opt-in, bukan pengganti config server MCP generik.

### Konfigurasi timeout runtime

Plugin `acpx` terbundel secara default menetapkan timeout 120 detik untuk giliran runtime tersemat. Ini memberi harness yang lebih lambat seperti Gemini CLI cukup waktu untuk menyelesaikan
startup dan inisialisasi ACP. Override jika host Anda memerlukan
batas runtime yang berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Restart gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan secara non-interaktif — tidak ada TTY untuk menyetujui atau menolak prompt izin penulisan file dan eksekusi shell. Plugin acpx menyediakan dua key config yang mengontrol bagaimana izin ditangani:

Izin harness ACPX ini terpisah dari persetujuan exec OpenClaw dan terpisah dari flag bypass vendor CLI-backend seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah sakelar break-glass tingkat harness untuk sesi ACP.

### `permissionMode`

Mengontrol operasi mana yang dapat dilakukan agen harness tanpa prompt.

| Value           | Perilaku                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Menyetujui otomatis semua penulisan file dan perintah shell. |
| `approve-reads` | Menyetujui otomatis hanya pembacaan; penulisan dan exec memerlukan prompt. |
| `deny-all`      | Menolak semua prompt izin.                                |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi ketika prompt izin seharusnya ditampilkan tetapi tidak ada TTY interaktif yang tersedia (yang memang selalu terjadi untuk sesi ACP).

| Value  | Perilaku                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Menghentikan sesi dengan `AcpRuntimeError`. **(default)**         |
| `deny` | Menolak izin secara diam-diam dan melanjutkan (degradasi yang halus). |

### Konfigurasi

Tetapkan melalui config plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Restart gateway setelah mengubah nilai-nilai ini.

> **Penting:** OpenClaw saat ini default ke `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, setiap penulisan atau exec yang memicu prompt izin dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jika Anda perlu membatasi izin, tetapkan `nonInteractivePermissions` ke `deny` agar sesi mengalami degradasi dengan baik alih-alih crash.

## Pemecahan masalah

| Gejala                                                                      | Penyebab yang mungkin                                                             | Perbaikan                                                                                                                                                          |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend hilang atau dinonaktifkan.                                         | Instal dan aktifkan plugin backend, lalu jalankan `/acp doctor`.                                                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP dinonaktifkan secara global.                                                  | Tetapkan `acp.enabled=true`.                                                                                                                                        |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Dispatch dari pesan thread normal dinonaktifkan.                                  | Tetapkan `acp.dispatch.enabled=true`.                                                                                                                               |
| `ACP agent "<id>" is not allowed by policy`                                 | Agen tidak ada dalam allowlist.                                                   | Gunakan `agentId` yang diizinkan atau perbarui `acp.allowedAgents`.                                                                                                |
| `Unable to resolve session target: ...`                                     | Token key/id/label salah.                                                         | Jalankan `/acp sessions`, salin key/label yang tepat, lalu coba lagi.                                                                                              |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` digunakan tanpa percakapan aktif yang dapat di-bind.                | Pindah ke chat/saluran target lalu coba lagi, atau gunakan spawn yang tidak terikat.                                                                               |
| `Conversation bindings are unavailable for <channel>.`                      | Adaptor tidak memiliki capability binding ACP percakapan saat ini.                | Gunakan `/acp spawn ... --thread ...` jika didukung, konfigurasikan `bindings[]` tingkat atas, atau pindah ke saluran yang didukung.                             |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` digunakan di luar konteks thread.                                 | Pindah ke thread target atau gunakan `--thread auto`/`off`.                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Pengguna lain memiliki target binding aktif.                                      | Rebind sebagai pemilik atau gunakan percakapan atau thread lain.                                                                                                    |
| `Thread bindings are unavailable for <channel>.`                            | Adaptor tidak memiliki capability binding thread.                                 | Gunakan `--thread off` atau pindah ke adaptor/saluran yang didukung.                                                                                               |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP berada di sisi host; sesi peminta berada dalam sandbox.               | Gunakan `runtime="subagent"` dari sesi yang menggunakan sandbox, atau jalankan spawn ACP dari sesi non-sandbox.                                                   |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` diminta untuk runtime ACP.                                    | Gunakan `runtime="subagent"` untuk sandboxing wajib, atau gunakan ACP dengan `sandbox="inherit"` dari sesi non-sandbox.                                           |
| Missing ACP metadata for bound session                                      | Metadata sesi ACP basi/terhapus.                                                  | Buat ulang dengan `/acp spawn`, lalu lakukan rebind/fokus thread.                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` memblokir penulisan/exec dalam sesi ACP non-interaktif.          | Tetapkan `plugins.entries.acpx.config.permissionMode` ke `approve-all` dan restart gateway. Lihat [Konfigurasi izin](#permission-configuration).                 |
| ACP session fails early with little output                                  | Prompt izin diblokir oleh `permissionMode`/`nonInteractivePermissions`.           | Periksa log gateway untuk `AcpRuntimeError`. Untuk izin penuh, tetapkan `permissionMode=approve-all`; untuk degradasi halus, tetapkan `nonInteractivePermissions=deny`. |
| ACP session stalls indefinitely after completing work                       | Proses harness selesai tetapi sesi ACP tidak melaporkan penyelesaian.             | Pantau dengan `ps aux \| grep acpx`; hentikan proses basi secara manual.                                                                                           |
