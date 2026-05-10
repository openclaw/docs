---
read_when:
    - Mengonfigurasi kebijakan `tools.*`, daftar izin, atau fitur eksperimental
    - Mendaftarkan penyedia kustom atau mengganti URL dasar
    - Menyiapkan endpoint yang di-host sendiri dan kompatibel dengan OpenAI
sidebarTitle: Tools and custom providers
summary: Konfigurasi alat (kebijakan, sakelar eksperimental, alat berbasis penyedia) dan penyiapan penyedia/base-URL kustom
title: Konfigurasi — alat dan penyedia kustom
x-i18n:
    generated_at: "2026-05-10T19:34:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c02dad1d895afe90baf99487b37d29968ebd944890075511e1cb057776b29ec6
    source_path: gateway/config-tools.md
    workflow: 16
---

Kunci konfigurasi `tools.*` dan pengaturan penyedia kustom / URL dasar. Untuk agen, channel, dan kunci konfigurasi tingkat atas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Tools

### Profil tool

`tools.profile` menetapkan allowlist dasar sebelum `tools.allow`/`tools.deny`:

<Note>
Onboarding lokal menetapkan default konfigurasi lokal baru ke `tools.profile: "coding"` saat belum diatur (profil eksplisit yang sudah ada tetap dipertahankan).
</Note>

| Profil      | Mencakup                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | hanya `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Tanpa pembatasan (sama seperti belum diatur)                                                                                    |

### Grup tool

| Grup               | Tool                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` diterima sebagai alias untuk `exec`)                                         |
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
| `group:openclaw`   | Semua tool bawaan (tidak termasuk Plugin penyedia)                                                                      |

### `tools.allow` / `tools.deny`

Kebijakan allow/deny tool global (deny menang). Tidak peka huruf besar-kecil, mendukung wildcard `*`. Diterapkan bahkan saat sandbox Docker nonaktif.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` dan `apply_patch` adalah id tool terpisah. `allow: ["write"]` juga mengaktifkan `apply_patch` untuk model yang kompatibel, tetapi `deny: ["write"]` tidak menolak `apply_patch`. Untuk memblokir semua mutasi file, tolak `group:fs` atau cantumkan setiap tool yang dapat melakukan mutasi secara eksplisit:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Batasi tool lebih lanjut untuk penyedia atau model tertentu. Urutan: profil dasar → profil penyedia → allow/deny.

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

### `tools.elevated`

Mengontrol akses exec yang ditinggikan di luar sandbox:

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

- Override per agen (`agents.list[].tools.elevated`) hanya dapat membatasi lebih lanjut.
- `/elevated on|off|ask|full` menyimpan status per sesi; direktif inline berlaku untuk satu pesan.
- `exec` yang ditinggikan melewati sandboxing dan menggunakan jalur keluar yang dikonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).

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
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Pemeriksaan keamanan loop tool **dinonaktifkan secara default**. Atur `enabled: true` untuk mengaktifkan deteksi. Pengaturan dapat didefinisikan secara global di `tools.loopDetection` dan di-override per agen di `agents.list[].tools.loopDetection`.

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
  Riwayat maksimum panggilan tool yang dipertahankan untuk analisis loop.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Ambang pola berulang tanpa progres untuk peringatan.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Ambang berulang yang lebih tinggi untuk memblokir loop kritis.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Ambang penghentian paksa untuk proses tanpa progres apa pun.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Peringatkan pada panggilan tool yang sama dengan argumen yang sama secara berulang.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Peringatkan/blokir pada tool polling yang dikenal (`process.poll`, `command_status`, dll.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Peringatkan/blokir pada pola pasangan tanpa progres yang bergantian.
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
  <Accordion title="Media model entry fields">
    **Entri penyedia** (`type: "provider"` atau dihilangkan):

    - `provider`: id penyedia API (`openai`, `anthropic`, `google`/`gemini`, `groq`, dll.)
    - `model`: penggantian id model
    - `profile` / `preferredProfile`: pemilihan profil `auth-profiles.json`

    **Entri CLI** (`type: "cli"`):

    - `command`: berkas executable yang akan dijalankan
    - `args`: argumen bertemplat (mendukung `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, dll.; `openclaw doctor --fix` memigrasikan placeholder `{input}` yang tidak digunakan lagi ke `{{MediaPath}}`)

    **Bidang umum:**

    - `capabilities`: daftar opsional (`image`, `audio`, `video`). Default: `openai`/`anthropic`/`minimax` → gambar, `google` → gambar+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: penggantian per entri.
    - `tools.media.image.timeoutSeconds` dan entri `timeoutSeconds` model gambar yang cocok juga berlaku saat agen memanggil alat `image` eksplisit.
    - Kegagalan akan beralih ke entri berikutnya.

    Autentikasi penyedia mengikuti urutan standar: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

    **Bidang penyelesaian asinkron:**

    - `asyncCompletion.directSend`: flag kompatibilitas yang tidak digunakan lagi. Tugas media asinkron yang selesai tetap dimediasi oleh sesi peminta sehingga agen menerima hasilnya, memutuskan cara memberi tahu pengguna, dan menggunakan alat pesan saat pengiriman sumber memerlukannya.

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
  <Accordion title="Visibility scopes">
    - `self`: hanya kunci sesi saat ini.
    - `tree`: sesi saat ini + sesi yang dibuat oleh sesi saat ini (subagen).
    - `agent`: sesi apa pun yang dimiliki id agen saat ini (dapat mencakup pengguna lain jika Anda menjalankan sesi per pengirim di bawah id agen yang sama).
    - `all`: sesi apa pun. Penargetan lintas agen tetap memerlukan `tools.agentToAgent`.
    - Pembatasan sandbox: saat sesi saat ini berada dalam sandbox dan `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, visibilitas dipaksa menjadi `tree` meskipun `tools.sessions.visibility="all"`.

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
  <Accordion title="Attachment notes">
    - Lampiran hanya didukung untuk `runtime: "subagent"`. Runtime ACP menolaknya.
    - File diwujudkan ke dalam workspace anak di `.openclaw/attachments/<uuid>/` dengan `.manifest.json`.
    - Konten lampiran otomatis disensor dari persistensi transkrip.
    - Input Base64 divalidasi dengan pemeriksaan alfabet/padding yang ketat dan pelindung ukuran sebelum dekode.
    - Izin file adalah `0700` untuk direktori dan `0600` untuk file.
    - Pembersihan mengikuti kebijakan `cleanup`: `delete` selalu menghapus lampiran; `keep` mempertahankannya hanya ketika `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Flag alat bawaan eksperimental. Default nonaktif kecuali aturan pengaktifan otomatis GPT-5 strict-agentic berlaku.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: mengaktifkan alat `update_plan` terstruktur untuk pelacakan pekerjaan multi-langkah yang tidak sepele.
- Default: `false` kecuali `agents.defaults.embeddedPi.executionContract` (atau override per agen) diatur ke `"strict-agentic"` untuk run keluarga GPT-5 OpenAI atau OpenAI Codex. Atur `true` untuk memaksa alat aktif di luar cakupan tersebut, atau `false` untuk tetap menonaktifkannya bahkan untuk run GPT-5 strict-agentic.
- Ketika diaktifkan, prompt sistem juga menambahkan panduan penggunaan sehingga model hanya menggunakannya untuk pekerjaan substansial dan mempertahankan paling banyak satu langkah `in_progress`.

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: model default untuk sub-agen yang di-spawn. Jika dihilangkan, sub-agen mewarisi model pemanggil.
- `allowAgents`: allowlist default id agen target untuk `sessions_spawn` ketika agen peminta tidak mengatur `subagents.allowAgents` miliknya sendiri (`["*"]` = apa pun; default: agen yang sama saja).
- `runTimeoutSeconds`: timeout default (detik) untuk `sessions_spawn` ketika panggilan alat menghilangkan `runTimeoutSeconds`. `0` berarti tanpa timeout.
- Kebijakan alat per sub-agen: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Penyedia kustom dan URL dasar

OpenClaw menggunakan katalog model bawaan. Tambahkan penyedia kustom melalui `models.providers` dalam config atau `~/.openclaw/agents/<agentId>/agent/models.json`.

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
  <Accordion title="Auth and merge precedence">
    - Gunakan `authHeader: true` + `headers` untuk kebutuhan auth kustom.
    - Override root config agen dengan `OPENCLAW_AGENT_DIR` (atau `PI_CODING_AGENT_DIR`, alias variabel lingkungan lama).
    - Presedensi penggabungan untuk ID penyedia yang cocok:
      - Nilai `baseUrl` `models.json` agen yang tidak kosong menang.
      - Nilai `apiKey` agen yang tidak kosong menang hanya ketika penyedia tersebut tidak dikelola SecretRef dalam konteks config/auth-profile saat ini.
      - Nilai `apiKey` penyedia yang dikelola SecretRef disegarkan dari penanda sumber (`ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec), bukan mempertahankan rahasia yang sudah di-resolve.
      - Nilai header penyedia yang dikelola SecretRef disegarkan dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec).
      - `apiKey`/`baseUrl` agen yang kosong atau hilang fallback ke `models.providers` dalam config.
      - `contextWindow`/`maxTokens` model yang cocok menggunakan nilai yang lebih tinggi antara config eksplisit dan nilai katalog implisit.
      - `contextTokens` model yang cocok mempertahankan batas runtime eksplisit ketika ada; gunakan untuk membatasi konteks efektif tanpa mengubah metadata model native.
      - Gunakan `models.mode: "replace"` ketika Anda ingin config menulis ulang `models.json` sepenuhnya.
      - Persistensi penanda bersifat otoritatif terhadap sumber: penanda ditulis dari snapshot config sumber aktif (sebelum resolusi), bukan dari nilai rahasia runtime yang sudah di-resolve.

  </Accordion>
</AccordionGroup>

### Detail field penyedia

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: perilaku katalog penyedia (`merge` atau `replace`).
    - `models.providers`: peta penyedia kustom yang dikunci berdasarkan id penyedia.
      - Edit aman: gunakan `openclaw config set models.providers.<id> '<json>' --strict-json --merge` atau `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` untuk pembaruan aditif. `config set` menolak penggantian destruktif kecuali Anda meneruskan `--replace`.

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: adaptor permintaan (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, dll). Untuk backend `/v1/chat/completions` self-hosted seperti MLX, vLLM, SGLang, dan sebagian besar server lokal yang kompatibel dengan OpenAI, gunakan `openai-completions`. Penyedia kustom dengan `baseUrl` tetapi tanpa `api` default ke `openai-completions`; atur `openai-responses` hanya ketika backend mendukung `/v1/responses`.
    - `models.providers.*.apiKey`: kredensial penyedia (utamakan substitusi SecretRef/env).
    - `models.providers.*.auth`: strategi auth (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: jendela konteks native default untuk model di bawah penyedia ini ketika entri model tidak mengatur `contextWindow`.
    - `models.providers.*.contextTokens`: batas konteks runtime efektif default untuk model di bawah penyedia ini ketika entri model tidak mengatur `contextTokens`.
    - `models.providers.*.maxTokens`: batas token output default untuk model di bawah penyedia ini ketika entri model tidak mengatur `maxTokens`.
    - `models.providers.*.timeoutSeconds`: timeout permintaan HTTP model per penyedia opsional dalam detik, termasuk penanganan connect, header, body, dan pembatalan total permintaan.
    - `models.providers.*.injectNumCtxForOpenAICompat`: untuk Ollama + `openai-completions`, injeksikan `options.num_ctx` ke dalam permintaan (default: `true`).
    - `models.providers.*.authHeader`: paksa transport kredensial dalam header `Authorization` ketika diperlukan.
    - `models.providers.*.baseUrl`: URL dasar API upstream.
    - `models.providers.*.headers`: header statis ekstra untuk routing proxy/tenant.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: override transport untuk permintaan HTTP penyedia model.

    - `request.headers`: header ekstra (digabung dengan default penyedia). Nilai menerima SecretRef.
    - `request.auth`: override strategi auth. Mode: `"provider-default"` (gunakan auth bawaan penyedia), `"authorization-bearer"` (dengan `token`), `"header"` (dengan `headerName`, `value`, `prefix` opsional).
    - `request.proxy`: override proxy HTTP. Mode: `"env-proxy"` (gunakan variabel env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (dengan `url`). Kedua mode menerima sub-objek `tls` opsional.
    - `request.tls`: override TLS untuk koneksi langsung. Field: `ca`, `cert`, `key`, `passphrase` (semuanya menerima SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: ketika `true`, izinkan HTTPS ke `baseUrl` ketika DNS me-resolve ke rentang privat, CGNAT, atau rentang serupa, melalui pelindung fetch HTTP penyedia (opt-in operator untuk endpoint yang kompatibel dengan OpenAI self-hosted tepercaya). URL stream penyedia model loopback seperti `localhost`, `127.0.0.1`, dan `[::1]` diizinkan otomatis kecuali ini diatur secara eksplisit ke `false`; host LAN, tailnet, dan DNS privat tetap memerlukan opt-in. WebSocket menggunakan `request` yang sama untuk header/TLS tetapi tidak menggunakan gerbang SSRF fetch tersebut. Default `false`.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: entri katalog model penyedia eksplisit.
    - `models.providers.*.models.*.input`: modalitas input model. Gunakan `["text"]` untuk model teks saja dan `["text", "image"]` untuk model gambar/vision native. Lampiran gambar hanya diinjeksi ke giliran agen ketika model yang dipilih ditandai mampu gambar.
    - `models.providers.*.models.*.contextWindow`: metadata jendela konteks model native. Ini meng-override `contextWindow` tingkat penyedia untuk model tersebut.
    - `models.providers.*.models.*.contextTokens`: batas konteks runtime opsional. Ini meng-override `contextTokens` tingkat penyedia; gunakan ketika Anda menginginkan anggaran konteks efektif yang lebih kecil daripada `contextWindow` native model; `openclaw models list` menampilkan kedua nilai ketika berbeda.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: petunjuk kompatibilitas opsional. Untuk `api: "openai-completions"` dengan `baseUrl` non-native yang tidak kosong (host bukan `api.openai.com`), OpenClaw memaksanya menjadi `false` saat runtime. `baseUrl` yang kosong/dihilangkan mempertahankan perilaku default OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: petunjuk kompatibilitas opsional untuk endpoint chat yang kompatibel dengan OpenAI dan hanya string. Ketika `true`, OpenClaw meratakan array `messages[].content` teks murni menjadi string biasa sebelum mengirim permintaan.
    - `models.providers.*.models.*.compat.strictMessageKeys`: petunjuk kompatibilitas opsional untuk endpoint chat yang kompatibel dengan OpenAI dan ketat. Ketika `true`, OpenClaw memangkas objek pesan Chat Completions keluar menjadi `role` dan `content` sebelum mengirim permintaan.
    - `models.providers.*.models.*.compat.thinkingFormat`: petunjuk payload thinking opsional. Gunakan `"qwen"` untuk `enable_thinking` tingkat atas, atau `"qwen-chat-template"` untuk `chat_template_kwargs.enable_thinking` pada server yang kompatibel dengan OpenAI keluarga Qwen yang mendukung kwargs chat-template tingkat permintaan, seperti vLLM.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: root pengaturan auto-discovery Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: aktifkan/nonaktifkan penemuan implisit.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: wilayah AWS untuk penemuan.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filter id penyedia opsional untuk penemuan tertarget.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interval polling untuk penyegaran penemuan.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: jendela konteks fallback untuk model yang ditemukan.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token output maks fallback untuk model yang ditemukan.

  </Accordion>
</AccordionGroup>

Onboarding penyedia kustom interaktif menyimpulkan input gambar untuk ID model vision umum seperti GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V, dan GLM-4V, serta melewati pertanyaan ekstra untuk keluarga yang diketahui hanya teks. ID model yang tidak dikenal tetap meminta dukungan gambar. Onboarding non-interaktif menggunakan inferensi yang sama; teruskan `--custom-image-input` untuk memaksa metadata mampu gambar atau `--custom-text-input` untuk memaksa metadata teks saja.

### Contoh penyedia

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin penyedia `cerebras` yang dibundel dapat mengonfigurasi ini melalui `openclaw onboard --auth-choice cerebras-api-key`. Gunakan config penyedia eksplisit hanya ketika meng-override default.

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
  <Accordion title="Local models (LM Studio)">
    Lihat [Model Lokal](/id/gateway/local-models). Ringkasnya: jalankan model lokal besar melalui LM Studio Responses API pada perangkat keras serius; pertahankan model yang di-host agar tetap digabungkan sebagai fallback.
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
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
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Tetapkan `MINIMAX_API_KEY`. Pintasan: `openclaw onboard --auth-choice minimax-global-api` atau `openclaw onboard --auth-choice minimax-cn-api`. Katalog model secara default hanya menggunakan M2.7. Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan pemikiran MiniMax secara default kecuali Anda menetapkan `thinking` sendiri secara eksplisit. `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.

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

    Endpoint Moonshot native mengiklankan kompatibilitas penggunaan streaming pada transport `openai-completions` bersama, dan OpenClaw menentukannya berdasarkan kapabilitas endpoint, bukan hanya id penyedia bawaan.

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

    Tetapkan `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`). Gunakan ref `opencode/...` untuk katalog Zen atau ref `opencode-go/...` untuk katalog Go. Pintasan: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`.

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

    Tetapkan `ZAI_API_KEY`. `z.ai/*` dan `z-ai/*` diterima sebagai alias. Pintasan: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint umum: `https://api.z.ai/api/paas/v4`
    - Endpoint coding (default): `https://api.z.ai/api/coding/paas/v4`
    - Untuk endpoint umum, tentukan penyedia kustom dengan override URL dasar.

  </Accordion>
</AccordionGroup>

---

## Terkait

- [Konfigurasi — agen](/id/gateway/config-agents)
- [Konfigurasi — channel](/id/gateway/config-channels)
- [Referensi konfigurasi](/id/gateway/configuration-reference) — kunci tingkat atas lainnya
- [Alat dan plugin](/id/tools)
