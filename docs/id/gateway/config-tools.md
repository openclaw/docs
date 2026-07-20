---
read_when:
    - Mengonfigurasi kebijakan, daftar izin, atau fitur eksperimental `tools.*`
    - Mendaftarkan penyedia kustom atau mengganti URL dasar
    - Menyiapkan endpoint yang dihosting sendiri dan kompatibel dengan OpenAI
sidebarTitle: Tools and custom providers
summary: Konfigurasi alat (kebijakan, fitur eksperimental, alat berbasis penyedia) dan penyiapan penyedia/URL dasar khusus
title: Konfigurasi — alat dan penyedia khusus
x-i18n:
    generated_at: "2026-07-20T03:51:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 690d3c0bf9a1a542c6989c74f0bc15c7e52798892436aa8bd710d22b00fcf015
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` kunci konfigurasi dan penyiapan penyedia kustom / URL dasar. Untuk agen, saluran, dan kunci konfigurasi tingkat teratas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Alat

### Profil alat

`tools.profile` menetapkan daftar izin dasar sebelum `tools.allow`/`tools.deny`:

<Note>
Onboarding lokal menetapkan konfigurasi lokal baru secara default ke `tools.profile: "coding"` jika belum ditetapkan (profil eksplisit yang sudah ada dipertahankan).
</Note>

| Profil     | Mencakup                                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Hanya `session_status`                                                                                                                                                                                                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate`                |
| `messaging` | `group:messaging`, `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `ask_user` |
| `full`      | Tanpa pembatasan (sama seperti belum ditetapkan)                                                                                                                                                                                                                          |

`coding` dan `messaging` juga secara implisit mengizinkan `bundle-mcp` (server MCP yang dikonfigurasi).

### Grup alat

| Grup              | Alat                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` diterima sebagai alias untuk `exec`)                                                                                                                                                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                                                 |
| `group:sessions`   | `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                                                  |
| `group:ui`         | `browser`, `screen`, `terminal`, `canvas`, `show_widget`                                                                                                                                                                                               |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                                                 |
| `group:messaging`  | `message`                                                                                                                                                                                                                                              |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                                                    |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`                                                                                                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                                                   |
| `group:openclaw`   | Semua alat bawaan di atas kecuali `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (tidak mencakup alat plugin)                                                                                                                                  |
| `group:plugins`    | Alat yang dimiliki plugin yang dimuat, termasuk server MCP yang dikonfigurasi dan diekspos melalui `bundle-mcp`                                                                                                                                                           |

`spawn_task` memungkinkan agen pengodean mengusulkan pekerjaan tindak lanjut yang dikonfirmasi tanpa memulainya. Control UI menampilkan judul dan ringkasannya sebagai chip yang dapat ditindaklanjuti; TUI yang didukung Gateway menampilkan perintah interaktif yang setara. Menerima salah satunya akan membuat sesi managed-worktree baru dan mengirimkan perintah lengkap ke sana sementara giliran saat ini berlanjut. `dismiss_task` menarik kembali saran yang masih tertunda berdasarkan `task_id` sementara yang dikembalikan dari `spawn_task`.

Alat tersebut hanya ditawarkan saat permukaan operator yang memulai dapat menerima dan menindaklanjuti peristiwa saran tugas Gateway. Sesi saluran dan sesi TUI lokal/tertanam tidak menerimanya; transportasi saluran memerlukan tindakan tugas bertipe yang portabel sebelum dapat mengekspos alur ini dengan aman. Saran bersifat lokal bagi proses dan menghilang saat Gateway dimulai ulang. Kedua alat tetap berada dalam profil `coding` dan `group:sessions`, sehingga kebijakan normal `tools.allow` dan `tools.deny` mengonfigurasinya secara otomatis saat permukaan mendukungnya.

### Alat MCP dan plugin di dalam kebijakan alat sandbox

Server MCP yang dikonfigurasi diekspos sebagai alat milik plugin di bawah ID plugin `bundle-mcp`. Profil alat normal dapat mengizinkannya, tetapi `tools.sandbox.tools` merupakan gerbang tambahan untuk sesi yang di-sandbox. Jika mode sandbox adalah `"all"` atau `"non-main"`, sertakan salah satu entri berikut dalam daftar izin alat sandbox ketika alat MCP/plugin harus terlihat:

- `bundle-mcp` untuk server MCP yang dikelola OpenClaw dari `mcp.servers`
- ID plugin untuk plugin native tertentu
- `group:plugins` untuk semua alat milik plugin yang dimuat
- nama alat server MCP yang persis atau glob server seperti `outlook__send_mail` atau `outlook__*` ketika Anda hanya menginginkan satu server

Glob server menggunakan prefiks server MCP yang aman bagi penyedia, belum tentu kunci mentah `mcp.servers`. Karakter selain `[A-Za-z0-9_-]` menjadi `-`, nama yang tidak diawali huruf mendapatkan prefiks `mcp-`, dan prefiks yang panjang atau duplikat dapat dipotong atau diberi sufiks; misalnya, `mcp.servers["Outlook Graph"]` menggunakan glob seperti `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Tanpa entri lapisan sandbox tersebut, server MCP masih dapat dimuat dengan berhasil sementara alatnya difilter sebelum permintaan penyedia. Gunakan `openclaw doctor` untuk mendeteksi bentuk ini bagi server yang dikelola OpenClaw di `mcp.servers`. Server MCP yang dimuat dari manifes plugin bawaan atau Claude `.mcp.json` menggunakan gerbang sandbox yang sama, tetapi diagnostik ini belum mencantumkan sumber tersebut; gunakan entri daftar izin yang sama jika alatnya menghilang dalam giliran yang di-sandbox.

### `tools.codeMode`

`tools.codeMode` mengaktifkan permukaan mode kode OpenClaw generik. Saat diaktifkan
untuk proses yang menggunakan alat, alat OpenClaw normal dipindahkan ke belakang jembatan
katalog `tools.*` di dalam sandbox, dan alat MCP tersedia melalui namespace
`MCP` yang dihasilkan. Model biasanya melihat `exec` dan
`wait`; alat seperti `computer` yang hasil terstrukturnya tidak dapat
melintasi jembatan khusus JSON tetap tersedia secara langsung.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Bentuk singkatnya juga diterima:

```json5
{
  tools: { codeMode: true },
}
```

Deklarasi MCP diekspos melalui permukaan file API virtual hanya-baca dalam
mode kode. Kode tamu dapat memanggil `API.list("mcp")` dan
`API.read("mcp/<server>.d.ts")` untuk memeriksa signature bergaya TypeScript sebelum
memanggil `MCP.<server>.<tool>()`. Lihat [Mode Kode](/id/tools/code-mode) untuk
kontrak runtime, batasan, dan langkah debugging.

### `tools.allow` / `tools.deny`

Kebijakan izin/tolak alat global (penolakan diutamakan). Tidak peka huruf besar-kecil, mendukung wildcard `*`. Diterapkan bahkan saat sandbox Docker dinonaktifkan.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` dan `apply_patch` adalah ID alat yang terpisah. `allow: ["write"]` juga mengaktifkan `apply_patch` untuk model yang kompatibel, tetapi `deny: ["write"]` tidak menolak `apply_patch`. Untuk memblokir semua mutasi file, tolak `group:fs` atau cantumkan setiap alat yang melakukan mutasi secara eksplisit:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` dan `alsoAllow` tidak dapat ditetapkan bersamaan dalam cakupan yang sama (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) — validasi konfigurasi akan menolaknya. Gabungkan entri `alsoAllow` ke dalam `allow`, atau hapus `allow` dan gunakan `profile` + `alsoAllow` sebagai gantinya.
</Note>

### `tools.byProvider`

Batasi alat lebih lanjut untuk penyedia atau model tertentu. Urutan: profil dasar → profil penyedia → izin/tolak.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

Membatasi alat untuk identitas peminta tertentu. Ini merupakan pertahanan berlapis di atas kontrol akses saluran; nilai pengirim harus berasal dari adaptor saluran, bukan teks pesan.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Kunci menggunakan prefiks eksplisit: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, atau `"*"`. ID saluran adalah ID OpenClaw kanonis; alias seperti `teams` dinormalisasi menjadi `msteams`. Kunci lama tanpa prefiks hanya diterima sebagai `id:`. Urutan pencocokan adalah saluran+ID, ID, e164, nama pengguna, nama, lalu karakter pengganti.

`agents.list[].tools.toolsBySender` per agen menggantikan kecocokan pengirim global ketika cocok, bahkan dengan kebijakan `{}` kosong.

### `tools.elevated`

Mengontrol akses eksekusi dengan hak istimewa di luar sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Penggantian per agen (`agents.list[].tools.elevated`) hanya dapat membatasi lebih lanjut.
- `/elevated on|off|ask|full` menyimpan status per sesi; direktif sebaris berlaku untuk satu pesan.
- `exec` dengan hak istimewa melewati sandbox dan menggunakan jalur keluar yang dikonfigurasi (`gateway` secara default, atau `node` ketika target eksekusi adalah `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

Nilai yang ditampilkan adalah nilai default, kecuali `applyPatch.allowModels` (kosong/tidak ditetapkan secara default, yang berarti model kompatibel apa pun dapat menggunakan `apply_patch`). `approvalRunningNoticeMs` memunculkan pemberitahuan bahwa proses masih berjalan ketika eksekusi berbasis persetujuan berlangsung lama; `0` menonaktifkannya.

### `tools.loopDetection`

Pemeriksaan keamanan perulangan alat **dinonaktifkan secara default**. Tetapkan `enabled: true` untuk mengaktifkan deteksi. Pengaturan dapat ditentukan secara global di `tools.loopDetection` dan diganti per agen di `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
    },
  },
}
```

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // atau variabel lingkungan BRAVE_API_KEY (penyedia Brave)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opsional; hilangkan untuk deteksi otomatis
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

Nilai yang ditampilkan adalah nilai default, kecuali `provider` dan `userAgent`. `maxResponseBytes` dibatasi ke 32000–10000000; `maxChars` dibatasi ke `maxCharsCap` (naikkan `maxCharsCap` untuk mengizinkan respons yang lebih besar).

### `tools.media`

Mengonfigurasi pemahaman media masuk (gambar/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`concurrency` (default `2`), `audio.maxBytes` (default 20 MB), dan `video.maxBytes` (default 50 MB) ditampilkan dengan nilai defaultnya; `image.maxBytes` secara default adalah 10 MB. Batas waktu permintaan per kemampuan secara default: gambar/audio `60` dtk, video `120` dtk.

<AccordionGroup>
  <Accordion title="Kolom entri model media">
    **Entri penyedia** (`type: "provider"` atau dihilangkan):

    - `provider`: ID penyedia API (`openai`, `anthropic`, `google`/`gemini`, `groq`, dll.)
    - `model`: penggantian ID model
    - `profile` / `preferredProfile`: pemilihan profil `auth-profiles.json`

    **Entri CLI** (`type: "cli"`):

    - `command`: berkas yang dapat dieksekusi untuk dijalankan
    - `args`: argumen bertemplat (mendukung `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, dll.; `openclaw doctor --fix` memigrasikan placeholder `{input}` yang tidak digunakan lagi ke `{{MediaPath}}`)

    **Kolom umum:**

    - `capabilities`: daftar opsional (`image`, `audio`, `video`). Setiap Plugin penyedia mendeklarasikan kumpulan kemampuan defaultnya sendiri; misalnya, penyedia `openai` yang dibundel secara default mendukung gambar+audio, `anthropic`/`minimax` mendukung gambar, `google` mendukung gambar+audio+video, dan `groq` mendukung audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: penggantian per entri.
    - `tools.media.image.timeoutSeconds` dan entri `timeoutSeconds` model gambar yang cocok juga berlaku ketika agen memanggil alat `image` secara eksplisit. Untuk pemahaman gambar, batas waktu ini berlaku bagi permintaan itu sendiri dan tidak dikurangi oleh pekerjaan persiapan sebelumnya.
    - Kegagalan beralih ke entri berikutnya.

    Autentikasi penyedia mengikuti urutan standar: `auth-profiles.json` → variabel lingkungan → `models.providers.*.apiKey`.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Mengontrol sesi mana yang dapat ditargetkan oleh alat sesi (`sessions_list`, `sessions_history`, `sessions_send`).

Default: `tree` (sesi saat ini + sesi yang dibuat olehnya, seperti subagen, ditambah sesi grup terpantau secara ambien untuk agen yang sama).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Cakupan visibilitas">
    - `self`: hanya kunci sesi saat ini.
    - `tree`: sesi saat ini + sesi yang dibuat oleh sesi saat ini (subagen). Untuk operasi baca, ini juga mencakup sesi grup agen yang sama yang dipantau oleh sesi saat ini melalui kesadaran grup ambien.
    - `agent`: sesi apa pun yang dimiliki ID agen saat ini (dapat mencakup pengguna lain jika Anda menjalankan sesi per pengirim di bawah ID agen yang sama).
    - `all`: sesi apa pun. Penargetan lintas agen tetap memerlukan `tools.agentToAgent`.
    - Pembatasan sandbox: ketika sesi saat ini berada dalam sandbox dan `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (nilai default), visibilitas dipaksa menjadi `tree` meskipun `tools.sessions.visibility="all"`.
    - Ketika bukan `all`, `sessions_list` menyertakan kolom ringkas `visibility`
      yang menjelaskan mode efektif dan peringatan bahwa beberapa sesi mungkin
      tidak disertakan di luar cakupan saat ini.

  </Accordion>
</AccordionGroup>

Dengan `session.dmScope: "main"` default, aktivitas manusia dalam grup membuat sesi grup agen yang sama tersebut terlihat secara ambien oleh sesi utama agen. Dalam penyiapan multipengguna, `"main"` juga membagikan satu sesi DM kepada seluruh pengguna, sehingga setiap pengguna yang diarahkan ke sana dapat membaca dari grup yang dipantau secara ambien, termasuk melalui `memory_search` memori sesi. Gunakan `dmScope` per rekan untuk isolasi DM, atau tetapkan `tools.sessions.visibility: "self"` agar tidak menggunakan pembacaan sesi terpantau secara ambien.

### `tools.sessions_spawn`

Mengontrol dukungan lampiran sebaris untuk `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // keikutsertaan opsional: tetapkan true untuk mengizinkan lampiran berkas sebaris
        maxTotalBytes: 5242880, // total 5 MB untuk semua berkas
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per berkas
        retainOnSessionKeep: false, // pertahankan lampiran ketika cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Catatan lampiran">
    - Lampiran memerlukan `enabled: true`.
    - Lampiran subagen diwujudkan ke dalam ruang kerja turunan di `.openclaw/attachments/<uuid>/` dengan `.manifest.json`.
    - Lampiran ACP hanya mendukung gambar dan diteruskan secara sebaris ke runtime ACP setelah memenuhi batas jumlah berkas, byte per berkas, dan total byte yang sama.
    - Konten lampiran secara otomatis disunting dari penyimpanan transkrip.
    - Masukan Base64 divalidasi dengan pemeriksaan alfabet/padding yang ketat dan pembatasan ukuran sebelum pendekodean.
    - Izin berkas lampiran subagen adalah `0700` untuk direktori dan `0600` untuk berkas.
    - Pembersihan subagen mengikuti kebijakan `cleanup`: `delete` selalu menghapus lampiran; `keep` mempertahankannya hanya ketika `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Flag alat bawaan eksperimental. Dinonaktifkan secara default, kecuali aturan pengaktifan otomatis GPT-5 agen-ketat berlaku.

```json5
{
  tools: {
    experimental: {
      planTool: true, // aktifkan update_plan eksperimental
    },
  },
}
```

- `planTool`: mengaktifkan alat `update_plan` terstruktur untuk pelacakan pekerjaan multitahap yang tidak sederhana.
- Default: `false`, kecuali `agents.defaults.embeddedAgent.executionContract` (atau penggantian per agen) ditetapkan menjadi `"strict-agentic"` untuk proses penyedia `openai` terhadap ID model keluarga GPT-5 (ini juga mencakup proses OpenAI Codex CLI, karena perutean autentikasi/model Codex berada di bawah penyedia `openai`). Tetapkan `true` untuk memaksa alat aktif di luar cakupan tersebut, atau `false` agar tetap nonaktif bahkan untuk proses GPT-5 agen-ketat.
- Ketika diaktifkan, prompt sistem juga menambahkan panduan penggunaan agar model hanya menggunakannya untuk pekerjaan substansial dan mempertahankan paling banyak satu langkah `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: model default untuk subagen yang dibuat. Jika dihilangkan, subagen mewarisi model pemanggil.
- `allowAgents`: daftar izin default berisi id agen target yang dikonfigurasi untuk `sessions_spawn` ketika agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri (`["*"]` = semua target yang dikonfigurasi; default: hanya agen yang sama). Entri usang yang konfigurasi agennya telah dihapus akan ditolak oleh `sessions_spawn` dan dihilangkan dari `agents_list`; jalankan `openclaw doctor --fix` untuk membersihkannya.
- `maxConcurrent`: jumlah maksimum proses subagen yang berjalan secara bersamaan. Default: `8`.
- `runTimeoutSeconds`: batas waktu (detik) untuk `sessions_spawn` ketika pemanggil tidak meneruskan penggantian miliknya sendiri. Default: `0` (tanpa batas waktu); `900` yang ditampilkan di atas adalah nilai keikutsertaan yang umum, bukan default bawaan.
- `announceTimeoutMs`: batas waktu per panggilan (milidetik) untuk upaya pengiriman pengumuman `agent` Gateway. Default: `120000`. Percobaan ulang sementara dapat membuat total waktu tunggu pengumuman lebih lama daripada satu batas waktu yang dikonfigurasi.
- `archiveAfterMinutes`: jumlah menit setelah sesi subagen selesai sebelum diarsipkan secara otomatis. Default: `60`; `0` menonaktifkan pengarsipan otomatis.
- Kebijakan alat per subagen: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Penyedia khusus dan URL dasar

Plugin penyedia menerbitkan baris katalog modelnya sendiri. Tambahkan penyedia khusus melalui `models.providers` dalam konfigurasi atau `~/.openclaw/agents/<agentId>/agent/models.json`.

Mengonfigurasi `baseUrl` penyedia khusus/lokal juga merupakan keputusan kepercayaan jaringan yang terbatas untuk permintaan HTTP model: OpenClaw mengizinkan origin `scheme://host:port` tersebut secara tepat melalui jalur pengambilan yang dilindungi, tanpa menambahkan opsi konfigurasi terpisah atau memercayai origin privat lainnya.

```json5
{
  models: {
    mode: "merge", // gabungkan (default) | ganti
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | dll.
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Autentikasi dan prioritas penggabungan">
    - Gunakan `authHeader: true` + `headers` untuk kebutuhan autentikasi khusus.
    - Ganti root konfigurasi agen dengan `OPENCLAW_AGENT_DIR`.
    - Prioritas penggabungan untuk ID penyedia yang cocok:
      - Nilai `baseUrl` `models.json` agen yang tidak kosong diprioritaskan.
      - Nilai `apiKey` agen yang tidak kosong hanya diprioritaskan ketika penyedia tersebut tidak dikelola SecretRef dalam konteks konfigurasi/profil autentikasi saat ini.
      - Nilai `apiKey` penyedia yang dikelola SecretRef disegarkan dari penanda sumber (`ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec), alih-alih menyimpan rahasia yang telah di-resolve.
      - Nilai header penyedia yang dikelola SecretRef disegarkan dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec).
      - `apiKey`/`baseUrl` agen yang kosong atau tidak ada kembali menggunakan `models.providers` dalam konfigurasi.
      - `contextWindow`/`maxTokens` model yang cocok: nilai konfigurasi eksplisit diprioritaskan jika tersedia dan valid (angka positif terbatas); jika tidak, nilai katalog implisit/yang dihasilkan akan digunakan.
      - `contextTokens` model yang cocok mengikuti aturan eksplisit-diprioritaskan-jika-tidak-implisit yang sama; gunakan untuk membatasi konteks efektif tanpa mengubah metadata model native.
      - Katalog Plugin penyedia disimpan sebagai shard katalog yang dihasilkan dan dimiliki Plugin di bawah status Plugin agen.
      - Gunakan `models.mode: "replace"` ketika Anda ingin konfigurasi menulis ulang `models.json` sepenuhnya dan melewati penggabungan shard katalog yang dimiliki Plugin.
      - Penyimpanan penanda bersifat otoritatif terhadap sumber: penanda ditulis dari snapshot konfigurasi sumber aktif (sebelum resolusi), bukan dari nilai rahasia runtime yang telah di-resolve.

  </Accordion>
</AccordionGroup>

### Detail bidang penyedia

<AccordionGroup>
  <Accordion title="Katalog tingkat atas">
    - `models.mode`: perilaku katalog penyedia (`merge` atau `replace`).
    - `models.providers`: peta penyedia khusus dengan id penyedia sebagai kunci.
      - Pengeditan aman: gunakan `openclaw config set models.providers.<id> '<json>' --strict-json --merge` atau `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` untuk pembaruan aditif. `config set` menolak penggantian destruktif kecuali Anda meneruskan `--replace`.

  </Accordion>
  <Accordion title="Koneksi dan autentikasi penyedia">
    - `models.providers.*.api`: adaptor permintaan (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Untuk backend `/v1/chat/completions` yang dihosting sendiri seperti MLX, vLLM, SGLang, dan sebagian besar server lokal yang kompatibel dengan OpenAI, gunakan `openai-completions`. Penyedia khusus dengan `baseUrl` tetapi tanpa `api` menggunakan `openai-completions` secara default; tetapkan `openai-responses` hanya ketika backend mendukung `/v1/responses`.
    - `models.providers.*.apiKey`: kredensial penyedia (utamakan substitusi SecretRef/env).
    - `models.providers.*.auth`: strategi autentikasi (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: jendela konteks native default untuk model di bawah penyedia ini ketika entri model tidak menetapkan `contextWindow`.
    - `models.providers.*.contextTokens`: batas konteks runtime efektif default untuk model di bawah penyedia ini ketika entri model tidak menetapkan `contextTokens`.
    - `models.providers.*.maxTokens`: batas token keluaran default untuk model di bawah penyedia ini ketika entri model tidak menetapkan `maxTokens`.
    - `models.providers.*.timeoutSeconds`: batas waktu opsional per penyedia untuk permintaan HTTP model dalam detik, termasuk koneksi, header, isi, dan penanganan pembatalan total permintaan.
    - `models.providers.*.injectNumCtxForOpenAICompat`: untuk Ollama + `openai-completions`, sisipkan `options.num_ctx` ke dalam permintaan (default: `true`).
    - `models.providers.*.authHeader`: paksa pengiriman kredensial dalam header `Authorization` jika diperlukan.
    - `models.providers.*.baseUrl`: URL dasar API hulu.
    - `models.providers.*.headers`: header statis tambahan untuk perutean proksi/tenant.

  </Accordion>
  <Accordion title="Penggantian transportasi permintaan">
    `models.providers.*.request`: penggantian transportasi untuk permintaan HTTP penyedia model.

    - `request.headers`: header tambahan (digabungkan dengan default penyedia). Nilai menerima SecretRef.
    - `request.auth`: penggantian strategi autentikasi. Mode: `"provider-default"` (gunakan autentikasi bawaan penyedia), `"authorization-bearer"` (dengan `token`), `"header"` (dengan `headerName`, `value`, `prefix` opsional).
    - `request.proxy`: penggantian proksi HTTP. Mode: `"env-proxy"` (gunakan variabel env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (dengan `url`). Kedua mode menerima subobjek `tls` opsional.
    - `request.tls`: penggantian TLS untuk koneksi langsung. Bidang: `ca`, `cert`, `key`, `passphrase` (semuanya menerima SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: ketika `true`, izinkan permintaan HTTP penyedia model ke rentang privat, CGNAT, atau rentang serupa melalui pelindung pengambilan HTTP penyedia. URL dasar penyedia khusus/lokal sudah memercayai origin yang dikonfigurasi secara tepat, kecuali origin metadata/link-local, yang tetap diblokir tanpa keikutsertaan eksplisit. Tetapkan ini ke `false` untuk menolak kepercayaan origin yang tepat. WebSocket menggunakan `request` yang sama untuk header/TLS, tetapi tidak menggunakan gerbang SSRF pengambilan tersebut. Default `false`.

  </Accordion>
  <Accordion title="Entri katalog model">
    - `models.providers.*.models`: entri katalog model penyedia eksplisit.
    - `models.providers.*.models.*.input`: modalitas masukan model. Gunakan `["text"]` untuk model khusus teks dan `["text", "image"]` untuk model gambar/visi native. Lampiran gambar hanya disisipkan ke giliran agen ketika model yang dipilih ditandai mampu menangani gambar.
    - `models.providers.*.models.*.contextWindow`: metadata jendela konteks native model. Ini menggantikan `contextWindow` tingkat penyedia untuk model tersebut.
    - `models.providers.*.models.*.contextTokens`: batas konteks runtime opsional. Ini menggantikan `contextTokens` tingkat penyedia; gunakan ketika Anda menginginkan anggaran konteks efektif yang lebih kecil daripada `contextWindow` native model; `openclaw models list` menampilkan kedua nilai ketika berbeda.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: petunjuk kompatibilitas opsional. Untuk `api: "openai-completions"` dengan `baseUrl` non-native yang tidak kosong (host bukan `api.openai.com`), OpenClaw memaksanya menjadi `false` saat runtime. `baseUrl` yang kosong/dihilangkan mempertahankan perilaku default OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: petunjuk kompatibilitas opsional untuk endpoint percakapan kompatibel OpenAI yang hanya menerima string. Ketika `true`, OpenClaw meratakan array `messages[].content` teks murni menjadi string biasa sebelum mengirim permintaan.
    - `models.providers.*.models.*.compat.strictMessageKeys`: petunjuk kompatibilitas opsional untuk endpoint percakapan kompatibel OpenAI yang ketat. Ketika `true`, OpenClaw menyederhanakan objek pesan Chat Completions keluar menjadi `role` dan `content` sebelum mengirim permintaan.
    - `models.providers.*.models.*.compat.thinkingFormat`: petunjuk payload pemikiran opsional. Gunakan `"together"` untuk `reasoning.enabled` bergaya Together, `"qwen"` untuk `enable_thinking` tingkat atas, atau `"qwen-chat-template"` untuk `chat_template_kwargs.enable_thinking` pada server kompatibel OpenAI keluarga Qwen yang mendukung argumen kata kunci templat percakapan tingkat permintaan, seperti vLLM. Model Qwen vLLM yang dikonfigurasi menyediakan pilihan biner `/think` (`off`, `on`) untuk format tersebut.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: petunjuk kompatibilitas opsional untuk backend Chat Completions bergaya DeepSeek yang mengharuskan pesan asisten sebelumnya mempertahankan `reasoning_content` saat diputar ulang. Ketika `true`, OpenClaw mempertahankan bidang tersebut pada pesan asisten keluar. Gunakan ini saat menghubungkan proksi khusus yang kompatibel dengan DeepSeek dan menolak permintaan setelah penalaran dihapus. Default `false`.

  </Accordion>
  <Accordion title="Penemuan Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: root pengaturan penemuan otomatis Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: aktifkan/nonaktifkan penemuan implisit.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: wilayah AWS untuk penemuan.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filter id penyedia opsional untuk penemuan tertarget.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interval polling untuk penyegaran penemuan.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: jendela konteks cadangan untuk model yang ditemukan.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token keluaran maksimum cadangan untuk model yang ditemukan.

  </Accordion>
</AccordionGroup>

Onboarding penyedia kustom interaktif menyimpulkan input gambar untuk pola id model visi yang dikenal, termasuk GPT-4o/GPT-4.1/GPT-5+, keluarga penalaran `o1`/`o3`/`o4`, Claude, Gemini, setiap id dengan akhiran `-vl` (Qwen-VL dan yang serupa), serta keluarga bernama seperti LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V, dan GLM-4V; proses ini melewati pertanyaan tambahan untuk keluarga yang diketahui hanya mendukung teks (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama, dan id Qwen polos tanpa akhiran vl/vision). ID model yang tidak dikenal tetap memunculkan permintaan konfirmasi dukungan gambar. Onboarding noninteraktif menggunakan penyimpulan yang sama; teruskan `--custom-image-input` untuk memaksakan metadata berkemampuan gambar atau `--custom-text-input` untuk memaksakan metadata khusus teks.

### Contoh penyedia

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin penyedia eksternal resmi `cerebras` dapat mengonfigurasi ini melalui `openclaw onboard --auth-choice cerebras-api-key`. Gunakan konfigurasi penyedia eksplisit hanya saat menimpa nilai default.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Gunakan `cerebras/zai-glm-4.7` untuk Cerebras; `zai/glm-4.7` untuk akses langsung Z.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Kompatibel dengan Anthropic, penyedia bawaan. Pintasan: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Model lokal (LM Studio)">
    Lihat [Model Lokal](/id/gateway/local-models). Ringkasnya: jalankan model lokal besar melalui LM Studio Responses API pada perangkat keras berkemampuan tinggi; pertahankan model yang dihosting agar tetap digabungkan sebagai fallback.
  </Accordion>
  <Accordion title="MiniMax M3 (langsung)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Tetapkan `MINIMAX_API_KEY`. Pintasan: `openclaw onboard --auth-choice minimax-global-api` atau `openclaw onboard --auth-choice minimax-cn-api`. Katalog model secara default menggunakan M3 dan juga mencakup varian M2.7. Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan proses berpikir MiniMax M2.x secara default kecuali Anda secara eksplisit menetapkan sendiri `thinking`; MiniMax-M3 (dan M3.x) secara default tetap menggunakan jalur proses berpikir adaptif/tanpa parameter milik penyedia. `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Untuk endpoint Tiongkok: `baseUrl: "https://api.moonshot.cn/v1"` atau `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Endpoint asli Moonshot mengiklankan kompatibilitas penggunaan streaming pada transportasi bersama `openai-completions`, dan OpenClaw menentukannya berdasarkan kemampuan endpoint, bukan hanya berdasarkan id penyedia bawaan.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Tetapkan `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`). Gunakan referensi `opencode/...` untuk katalog Zen atau referensi `opencode-go/...` untuk katalog Go. Pintasan: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (kompatibel dengan Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    URL dasar harus menghilangkan `/v1` (klien Anthropic menambahkannya). Pintasan: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Tetapkan `ZAI_API_KEY`. Referensi model menggunakan ID penyedia kanonis `zai/*`. Pintasan: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint umum: `https://api.z.ai/api/paas/v4`
    - Endpoint pengodean: `https://api.z.ai/api/coding/paas/v4`
    - Pilihan autentikasi default `zai-api-key` menguji kunci Anda dan secara otomatis mendeteksi endpoint yang sesuai dengannya (beralih ke permintaan konfirmasi dengan default Global jika deteksi tidak meyakinkan). Pilihan autentikasi khusus CN dan Coding-Plan juga tersedia untuk pemilihan eksplisit.
    - Untuk endpoint umum, tentukan penyedia kustom dengan penimpaan URL dasar.

  </Accordion>
</AccordionGroup>

---

## Terkait

- [Konfigurasi — agen](/id/gateway/config-agents)
- [Konfigurasi — kanal](/id/gateway/config-channels)
- [Referensi konfigurasi](/id/gateway/configuration-reference) — kunci tingkat teratas lainnya
- [Alat dan plugin](/id/tools)
