---
read_when:
    - Mengonfigurasi kebijakan `tools.*`, daftar izin, atau fitur eksperimental
    - Mendaftarkan penyedia kustom atau mengganti URL dasar
    - Menyiapkan endpoint self-hosted yang kompatibel dengan OpenAI
sidebarTitle: Tools and custom providers
summary: Konfigurasi tools (kebijakan, toggle eksperimental, tools yang didukung penyedia) dan penyiapan penyedia/URL dasar kustom
title: Konfigurasi — alat dan penyedia kustom
x-i18n:
    generated_at: "2026-06-27T17:28:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

Kunci konfigurasi `tools.*` dan penyiapan penyedia / URL dasar kustom. Untuk agen, saluran, dan kunci konfigurasi tingkat atas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Alat

### Profil alat

`tools.profile` menetapkan allowlist dasar sebelum `tools.allow`/`tools.deny`:

<Note>
Onboarding lokal menetapkan default konfigurasi lokal baru ke `tools.profile: "coding"` saat belum diatur (profil eksplisit yang sudah ada dipertahankan).
</Note>

| Profil      | Mencakup                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | hanya `session_status`                                                                                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | Tanpa pembatasan (sama seperti tidak diatur)                                                                                                      |

### Grup alat

| Grup               | Alat                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` diterima sebagai alias untuk `exec`)                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Semua alat bawaan (tidak termasuk plugin penyedia)                                                                      |
| `group:plugins`    | Alat yang dimiliki oleh plugin yang dimuat, termasuk server MCP terkonfigurasi yang diekspos melalui `bundle-mcp`       |

### Alat MCP dan plugin di dalam kebijakan alat sandbox

Server MCP terkonfigurasi diekspos sebagai alat milik plugin di bawah id plugin `bundle-mcp`. Profil alat normal dapat mengizinkannya, tetapi `tools.sandbox.tools` adalah gerbang tambahan untuk sesi yang disandbox. Jika mode sandbox adalah `"all"` atau `"non-main"`, sertakan salah satu entri ini dalam allowlist alat sandbox saat alat MCP/plugin harus terlihat:

- `bundle-mcp` untuk server MCP yang dikelola OpenClaw dari `mcp.servers`
- id plugin untuk plugin native tertentu
- `group:plugins` untuk semua alat milik plugin yang dimuat
- nama alat server MCP persis atau glob server seperti `outlook__send_mail` atau `outlook__*` saat Anda hanya menginginkan satu server

Glob server menggunakan prefiks server MCP yang aman untuk penyedia, tidak selalu kunci mentah `mcp.servers`. Karakter non-`[A-Za-z0-9_-]` menjadi `-`, nama yang tidak diawali huruf mendapatkan prefiks `mcp-`, dan prefiks panjang atau duplikat dapat dipotong atau diberi sufiks; misalnya, `mcp.servers["Outlook Graph"]` menggunakan glob seperti `outlook-graph__*`.

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

Tanpa entri lapisan sandbox tersebut, server MCP tetap dapat dimuat dengan sukses sementara alatnya difilter sebelum permintaan penyedia. Gunakan `openclaw doctor` untuk menangkap bentuk ini bagi server yang dikelola OpenClaw di `mcp.servers`. Server MCP yang dimuat dari manifes plugin bundled atau Claude `.mcp.json` menggunakan gerbang sandbox yang sama, tetapi diagnostik ini belum menghitung sumber tersebut; gunakan entri allowlist yang sama jika alatnya menghilang dalam giliran yang disandbox.

### `tools.codeMode`

`tools.codeMode` mengaktifkan permukaan mode kode generik OpenClaw. Saat diaktifkan
untuk run dengan alat, model hanya melihat `exec` dan `wait`; alat OpenClaw
normal berpindah ke balik jembatan katalog `tools.*` di dalam sandbox, dan alat MCP
tersedia melalui namespace `MCP` yang dihasilkan.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Bentuk singkat juga diterima:

```json5
{
  tools: { codeMode: true },
}
```

Deklarasi MCP diekspos melalui permukaan file API virtual hanya-baca dalam
mode kode. Kode guest dapat memanggil `API.list("mcp")` dan
`API.read("mcp/<server>.d.ts")` untuk memeriksa signature bergaya TypeScript sebelum
memanggil `MCP.<server>.<tool>()`. Lihat [Mode kode](/id/reference/code-mode) untuk
kontrak runtime, batasan, dan langkah debugging.

### `tools.allow` / `tools.deny`

Kebijakan allow/deny alat global (deny menang). Tidak peka huruf besar-kecil, mendukung wildcard `*`. Diterapkan bahkan saat sandbox Docker nonaktif.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` dan `apply_patch` adalah id alat terpisah. `allow: ["write"]` juga mengaktifkan `apply_patch` untuk model yang kompatibel, tetapi `deny: ["write"]` tidak menolak `apply_patch`. Untuk memblokir semua mutasi file, tolak `group:fs` atau cantumkan setiap alat yang melakukan mutasi secara eksplisit:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Membatasi alat lebih lanjut untuk penyedia atau model tertentu. Urutan: profil dasar → profil penyedia → allow/deny.

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

Membatasi alat untuk identitas peminta tertentu. Ini adalah defense-in-depth di atas kontrol akses saluran; nilai pengirim harus berasal dari adapter saluran, bukan teks pesan.

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

Kunci menggunakan prefiks eksplisit: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, atau `"*"`. Id saluran adalah id kanonis OpenClaw; alias seperti `teams` dinormalisasi menjadi `msteams`. Kunci legacy tanpa prefiks diterima sebagai `id:` saja. Urutan pencocokan adalah channel+id, id, e164, username, name, lalu wildcard.

`agents.list[].tools.toolsBySender` per agen menimpa kecocokan pengirim global saat cocok, bahkan dengan kebijakan kosong `{}`.

### `tools.elevated`

Mengontrol akses exec elevated di luar sandbox:

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

- Override per agen (`agents.list[].tools.elevated`) hanya dapat memperketat.
- `/elevated on|off|ask|full` menyimpan status per sesi; arahan inline berlaku untuk satu pesan.
- `exec` elevated melewati sandboxing dan menggunakan jalur escape terkonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Pemeriksaan keamanan loop alat **dinonaktifkan secara default**. Atur `enabled: true` untuk mengaktifkan deteksi. Pengaturan dapat didefinisikan secara global di `tools.loopDetection` dan dioverride per agen di `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Riwayat panggilan alat maksimum yang dipertahankan untuk analisis loop.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Ambang pola tanpa kemajuan berulang untuk peringatan.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Ambang berulang yang lebih tinggi untuk memblokir loop kritis.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Ambang penghentian keras untuk run tanpa kemajuan apa pun.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Peringatkan pada panggilan alat yang sama/argumen yang sama secara berulang.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Peringatkan/blokir pada alat polling yang dikenal (`process.poll`, `command_status`, dll.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Peringatkan/blokir pada pola pasangan tanpa kemajuan yang bergantian.
</ParamField>

<Warning>
Jika `warningThreshold >= criticalThreshold` atau `criticalThreshold >= globalCircuitBreakerThreshold`, validasi gagal.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
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

### `tools.media`

Mengonfigurasi pemahaman media masuk (gambar/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
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

<AccordionGroup>
  <Accordion title="Kolom entri model media">
    **Entri penyedia** (`type: "provider"` atau dihilangkan):

    - `provider`: id penyedia API (`openai`, `anthropic`, `google`/`gemini`, `groq`, dll.)
    - `model`: penggantian id model
    - `profile` / `preferredProfile`: pemilihan profil `auth-profiles.json`

    **Entri CLI** (`type: "cli"`):

    - `command`: executable yang dijalankan
    - `args`: argumen bertemplat (mendukung `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, dll.; `openclaw doctor --fix` memigrasikan placeholder `{input}` yang tidak berlaku lagi ke `{{MediaPath}}`)

    **Kolom umum:**

    - `capabilities`: daftar opsional (`image`, `audio`, `video`). Default: `openai`/`anthropic`/`minimax` → gambar, `google` → gambar+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: penggantian per entri.
    - Entri `tools.media.image.timeoutSeconds` dan entri model gambar `timeoutSeconds` yang cocok juga berlaku saat agen memanggil tool `image` eksplisit. Untuk pemahaman gambar, timeout ini berlaku pada permintaan itu sendiri dan tidak dikurangi oleh pekerjaan persiapan sebelumnya.
    - Kegagalan akan fallback ke entri berikutnya.

    Autentikasi penyedia mengikuti urutan standar: `auth-profiles.json` → variabel env → `models.providers.*.apiKey`.

    **Kolom penyelesaian async:**

    - `asyncCompletion.directSend`: flag kompatibilitas yang tidak berlaku lagi. Tugas media async yang selesai tetap dimediasi sesi peminta sehingga agen menerima hasilnya, memutuskan cara memberi tahu pengguna, dan menggunakan tool pesan saat pengiriman sumber memerlukannya.

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

Mengontrol sesi mana yang dapat ditargetkan oleh tool sesi (`sessions_list`, `sessions_history`, `sessions_send`).

Default: `tree` (sesi saat ini + sesi yang dibuat olehnya, seperti subagen).

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
    - `tree`: sesi saat ini + sesi yang dibuat oleh sesi saat ini (subagen).
    - `agent`: sesi apa pun yang dimiliki oleh id agen saat ini (dapat mencakup pengguna lain jika Anda menjalankan sesi per pengirim di bawah id agen yang sama).
    - `all`: sesi apa pun. Penargetan lintas agen tetap memerlukan `tools.agentToAgent`.
    - Pembatasan sandbox: saat sesi saat ini berada dalam sandbox dan `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, visibilitas dipaksa menjadi `tree` meskipun `tools.sessions.visibility="all"`.
    - Saat bukan `all`, `sessions_list` menyertakan kolom `visibility` yang ringkas
      yang menjelaskan mode efektif dan peringatan bahwa beberapa sesi mungkin
      dihilangkan di luar cakupan saat ini.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Mengontrol dukungan lampiran inline untuk `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Catatan lampiran">
    - Lampiran memerlukan `enabled: true`.
    - Lampiran subagen dimaterialisasikan ke workspace anak di `.openclaw/attachments/<uuid>/` dengan `.manifest.json`.
    - Lampiran ACP hanya gambar dan diteruskan secara inline ke runtime ACP setelah batas jumlah file, byte per file, dan total byte yang sama lolos.
    - Konten lampiran otomatis disunting dari persistensi transkrip.
    - Input Base64 divalidasi dengan pemeriksaan alfabet/padding yang ketat dan guard ukuran pra-dekode.
    - Izin file lampiran subagen adalah `0700` untuk direktori dan `0600` untuk file.
    - Pembersihan subagen mengikuti kebijakan `cleanup`: `delete` selalu menghapus lampiran; `keep` mempertahankannya hanya saat `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Flag tool bawaan eksperimental. Default nonaktif kecuali aturan aktif otomatis GPT-5 strict-agentic berlaku.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: mengaktifkan tool `update_plan` terstruktur untuk pelacakan pekerjaan multi-langkah yang tidak trivial.
- Default: `false` kecuali `agents.defaults.embeddedAgent.executionContract` (atau penggantian per agen) diatur ke `"strict-agentic"` untuk proses OpenAI atau OpenAI Codex keluarga GPT-5. Atur `true` untuk memaksa tool aktif di luar cakupan tersebut, atau `false` untuk tetap menonaktifkannya bahkan untuk proses GPT-5 strict-agentic.
- Saat diaktifkan, prompt sistem juga menambahkan panduan penggunaan agar model hanya menggunakannya untuk pekerjaan substansial dan menjaga paling banyak satu langkah `in_progress`.

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

- `model`: model default untuk sub-agen yang dibuat. Jika dihilangkan, sub-agen mewarisi model pemanggil.
- `allowAgents`: allowlist default id agen target yang dikonfigurasi untuk `sessions_spawn` saat agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri (`["*"]` = target terkonfigurasi apa pun; default: hanya agen yang sama). Entri usang yang konfigurasi agennya telah dihapus ditolak oleh `sessions_spawn` dan dihilangkan dari `agents_list`; jalankan `openclaw doctor --fix` untuk membersihkannya.
- `runTimeoutSeconds`: timeout default (detik) untuk `sessions_spawn`. `0` berarti tanpa timeout.
- `announceTimeoutMs`: timeout per panggilan (milidetik) untuk upaya pengiriman announce `agent` Gateway. Default: `120000`. Percobaan ulang sementara dapat membuat total waktu tunggu announce lebih lama dari satu timeout yang dikonfigurasi.
- Kebijakan tool per subagen: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Penyedia kustom dan URL dasar

Plugin penyedia menerbitkan baris katalog modelnya sendiri. Tambahkan penyedia kustom melalui `models.providers` di konfigurasi atau `~/.openclaw/agents/<agentId>/agent/models.json`.

Mengonfigurasi `baseUrl` penyedia kustom/lokal juga merupakan keputusan kepercayaan jaringan yang sempit untuk permintaan HTTP model: OpenClaw mengizinkan origin `scheme://host:port` persis itu melalui jalur fetch yang dijaga, tanpa menambahkan opsi konfigurasi terpisah atau memercayai origin privat lain.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
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
    - Gunakan `authHeader: true` + `headers` untuk kebutuhan autentikasi kustom.
    - Ganti root konfigurasi agen dengan `OPENCLAW_AGENT_DIR`.
    - Prioritas penggabungan untuk ID penyedia yang cocok:
      - Nilai `baseUrl` `models.json` agen yang tidak kosong menang.
      - Nilai `apiKey` agen yang tidak kosong menang hanya saat penyedia tersebut tidak dikelola SecretRef dalam konteks konfigurasi/profil autentikasi saat ini.
      - Nilai `apiKey` penyedia yang dikelola SecretRef disegarkan dari marker sumber (`ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec) alih-alih mempertahankan secret yang telah di-resolve.
      - Nilai header penyedia yang dikelola SecretRef disegarkan dari marker sumber (`secretref-env:ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec).
      - `apiKey`/`baseUrl` agen yang kosong atau hilang fallback ke `models.providers` dalam konfigurasi.
      - `contextWindow`/`maxTokens` model yang cocok menggunakan nilai yang lebih tinggi antara konfigurasi eksplisit dan nilai katalog implisit.
      - `contextTokens` model yang cocok mempertahankan batas runtime eksplisit saat ada; gunakan ini untuk membatasi konteks efektif tanpa mengubah metadata model native.
      - Katalog Plugin penyedia disimpan sebagai shard katalog yang dihasilkan dan dimiliki Plugin di bawah state Plugin agen.
      - Gunakan `models.mode: "replace"` saat Anda ingin konfigurasi menulis ulang sepenuhnya `models.json` dan shard katalog Plugin aktif.
      - Persistensi marker bersifat otoritatif terhadap sumber: marker ditulis dari snapshot konfigurasi sumber aktif (pra-resolusi), bukan dari nilai secret runtime yang telah di-resolve.

  </Accordion>
</AccordionGroup>

### Detail kolom penyedia

<AccordionGroup>
  <Accordion title="Katalog tingkat atas">
    - `models.mode`: perilaku katalog penyedia (`merge` atau `replace`).
    - `models.providers`: peta penyedia kustom yang dikunci oleh id penyedia.
      - Edit aman: gunakan `openclaw config set models.providers.<id> '<json>' --strict-json --merge` atau `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` untuk pembaruan aditif. `config set` menolak penggantian destruktif kecuali Anda meneruskan `--replace`.

  </Accordion>
  <Accordion title="Koneksi penyedia dan autentikasi">
    - `models.providers.*.api`: adaptor permintaan (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, dll). Untuk backend `/v1/chat/completions` yang di-host sendiri seperti MLX, vLLM, SGLang, dan sebagian besar server lokal yang kompatibel dengan OpenAI, gunakan `openai-completions`. Penyedia kustom dengan `baseUrl` tetapi tanpa `api` menggunakan default `openai-completions`; atur `openai-responses` hanya ketika backend mendukung `/v1/responses`.
    - `models.providers.*.apiKey`: kredensial penyedia (utamakan substitusi SecretRef/env).
    - `models.providers.*.auth`: strategi autentikasi (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: jendela konteks native default untuk model di bawah penyedia ini ketika entri model tidak menetapkan `contextWindow`.
    - `models.providers.*.contextTokens`: batas konteks runtime efektif default untuk model di bawah penyedia ini ketika entri model tidak menetapkan `contextTokens`.
    - `models.providers.*.maxTokens`: batas token output default untuk model di bawah penyedia ini ketika entri model tidak menetapkan `maxTokens`.
    - `models.providers.*.timeoutSeconds`: timeout permintaan HTTP model opsional per penyedia dalam detik, termasuk koneksi, header, body, dan penanganan pembatalan total permintaan.
    - `models.providers.*.injectNumCtxForOpenAICompat`: untuk Ollama + `openai-completions`, sisipkan `options.num_ctx` ke dalam permintaan (default: `true`).
    - `models.providers.*.authHeader`: paksa transport kredensial di header `Authorization` saat diperlukan.
    - `models.providers.*.baseUrl`: URL dasar API upstream.
    - `models.providers.*.headers`: header statis tambahan untuk perutean proxy/tenant.

  </Accordion>
  <Accordion title="Override transport permintaan">
    `models.providers.*.request`: override transport untuk permintaan HTTP penyedia model.

    - `request.headers`: header tambahan (digabungkan dengan default penyedia). Nilai menerima SecretRef.
    - `request.auth`: override strategi autentikasi. Mode: `"provider-default"` (gunakan autentikasi bawaan penyedia), `"authorization-bearer"` (dengan `token`), `"header"` (dengan `headerName`, `value`, `prefix` opsional).
    - `request.proxy`: override proxy HTTP. Mode: `"env-proxy"` (gunakan variabel env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (dengan `url`). Kedua mode menerima sub-objek `tls` opsional.
    - `request.tls`: override TLS untuk koneksi langsung. Kolom: `ca`, `cert`, `key`, `passphrase` (semuanya menerima SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: saat `true`, izinkan permintaan HTTP penyedia model ke rentang privat, CGNAT, atau serupa melalui guard fetch HTTP penyedia. URL dasar penyedia kustom/lokal sudah memercayai origin tepat yang dikonfigurasi, kecuali origin metadata/link-local, yang tetap diblokir tanpa opt-in eksplisit. Atur ini ke `false` untuk keluar dari kepercayaan origin tepat. WebSocket menggunakan `request` yang sama untuk header/TLS tetapi bukan gate SSRF fetch tersebut. Default `false`.

  </Accordion>
  <Accordion title="Entri katalog model">
    - `models.providers.*.models`: entri katalog model penyedia eksplisit.
    - `models.providers.*.models.*.input`: modalitas input model. Gunakan `["text"]` untuk model khusus teks dan `["text", "image"]` untuk model gambar/vision native. Lampiran gambar hanya disisipkan ke giliran agen ketika model yang dipilih ditandai mampu menangani gambar.
    - `models.providers.*.models.*.contextWindow`: metadata jendela konteks model native. Ini mengesampingkan `contextWindow` tingkat penyedia untuk model tersebut.
    - `models.providers.*.models.*.contextTokens`: batas konteks runtime opsional. Ini mengesampingkan `contextTokens` tingkat penyedia; gunakan ketika Anda menginginkan anggaran konteks efektif yang lebih kecil daripada `contextWindow` native model; `openclaw models list` menampilkan kedua nilai saat berbeda.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: petunjuk kompatibilitas opsional. Untuk `api: "openai-completions"` dengan `baseUrl` non-native yang tidak kosong (host bukan `api.openai.com`), OpenClaw memaksa ini menjadi `false` saat runtime. `baseUrl` kosong/dihilangkan mempertahankan perilaku default OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: petunjuk kompatibilitas opsional untuk endpoint chat khusus string yang kompatibel dengan OpenAI. Saat `true`, OpenClaw meratakan array `messages[].content` teks murni menjadi string biasa sebelum mengirim permintaan.
    - `models.providers.*.models.*.compat.strictMessageKeys`: petunjuk kompatibilitas opsional untuk endpoint chat ketat yang kompatibel dengan OpenAI. Saat `true`, OpenClaw memangkas objek pesan Chat Completions keluar menjadi `role` dan `content` sebelum mengirim permintaan.
    - `models.providers.*.models.*.compat.thinkingFormat`: petunjuk payload thinking opsional. Gunakan `"together"` untuk `reasoning.enabled` bergaya Together, `"qwen"` untuk `enable_thinking` tingkat atas, atau `"qwen-chat-template"` untuk `chat_template_kwargs.enable_thinking` pada server keluarga Qwen yang kompatibel dengan OpenAI yang mendukung kwargs chat-template tingkat permintaan, seperti vLLM. Model Qwen vLLM yang dikonfigurasi mengekspos pilihan biner `/think` (`off`, `on`) untuk format ini.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: petunjuk kompatibilitas opsional untuk backend Chat Completions bergaya DeepSeek yang mengharuskan pesan asisten sebelumnya mempertahankan `reasoning_content` saat replay. Saat `true`, OpenClaw mempertahankan kolom tersebut pada pesan asisten keluar. Gunakan ini saat menghubungkan proxy kustom yang kompatibel dengan DeepSeek yang menolak permintaan setelah reasoning dipangkas. Default `false`.

  </Accordion>
  <Accordion title="Penemuan Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: root pengaturan penemuan otomatis Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: aktifkan/nonaktifkan penemuan implisit.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS untuk penemuan.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filter provider-id opsional untuk penemuan tertarget.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interval polling untuk penyegaran penemuan.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: jendela konteks fallback untuk model yang ditemukan.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token output maksimum fallback untuk model yang ditemukan.

  </Accordion>
</AccordionGroup>

Onboarding penyedia kustom interaktif menyimpulkan input gambar untuk ID model vision umum seperti GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V, dan GLM-4V, serta melewati pertanyaan tambahan untuk keluarga khusus teks yang dikenal. ID model yang tidak dikenal tetap meminta dukungan gambar. Onboarding non-interaktif menggunakan inferensi yang sama; berikan `--custom-image-input` untuk memaksa metadata mampu gambar atau `--custom-text-input` untuk memaksa metadata khusus teks.

### Contoh penyedia

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin penyedia eksternal resmi `cerebras` dapat mengonfigurasi ini melalui `openclaw onboard --auth-choice cerebras-api-key`. Gunakan konfigurasi penyedia eksplisit hanya saat mengesampingkan default.

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

    Gunakan `cerebras/zai-glm-4.7` untuk Cerebras; `zai/glm-4.7` untuk Z.AI langsung.

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
    Lihat [Model Lokal](/id/gateway/local-models). Ringkasnya: jalankan model lokal besar melalui LM Studio Responses API pada perangkat keras serius; pertahankan model hosted yang digabungkan untuk fallback.
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

    Atur `MINIMAX_API_KEY`. Pintasan: `openclaw onboard --auth-choice minimax-global-api` atau `openclaw onboard --auth-choice minimax-cn-api`. Katalog model menggunakan default M3 dan juga menyertakan varian M2.7. Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking MiniMax M2.x secara default kecuali Anda menetapkan `thinking` sendiri secara eksplisit; MiniMax-M3 (dan M3.x) tetap berada pada jalur thinking adaptif/dihilangkan milik penyedia secara default. `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.

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

    Endpoint native Moonshot mengiklankan kompatibilitas penggunaan streaming pada transport bersama `openai-completions`, dan OpenClaw mendasarkannya pada kapabilitas endpoint, bukan hanya id penyedia bawaan.

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

    Atur `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`). Gunakan ref `opencode/...` untuk katalog Zen atau ref `opencode-go/...` untuk katalog Go. Pintasan: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
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
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
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

    Atur `ZAI_API_KEY`. Referensi model menggunakan ID penyedia kanonis `zai/*`. Pintasan: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint umum: `https://api.z.ai/api/paas/v4`
    - Endpoint coding (default): `https://api.z.ai/api/coding/paas/v4`
    - Untuk endpoint umum, definisikan penyedia khusus dengan penggantian URL dasar.

  </Accordion>
</AccordionGroup>

---

## Terkait

- [Konfigurasi — agen](/id/gateway/config-agents)
- [Konfigurasi — channel](/id/gateway/config-channels)
- [Referensi konfigurasi](/id/gateway/configuration-reference) — kunci tingkat atas lainnya
- [Alat dan plugin](/id/tools)
