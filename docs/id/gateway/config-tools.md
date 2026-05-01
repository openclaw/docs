---
read_when:
    - Mengonfigurasi kebijakan `tools.*`, daftar izin, atau fitur eksperimental
    - Mendaftarkan penyedia kustom atau mengganti URL dasar
    - Menyiapkan endpoint yang dihosting sendiri yang kompatibel dengan OpenAI
sidebarTitle: Tools and custom providers
summary: Konfigurasi alat (kebijakan, toggle eksperimental, alat yang didukung penyedia) dan penyiapan penyedia/URL dasar kustom
title: Konfigurasi — alat dan penyedia kustom
x-i18n:
    generated_at: "2026-05-01T09:24:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 97e6bd8c762f6f7a9985b99ec016dde22c8ea8adc925778b11c2ae5103b887a8
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` kunci konfigurasi dan penyiapan penyedia kustom / base-URL. Untuk agents, channels, dan kunci konfigurasi tingkat atas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Alat

### Profil alat

`tools.profile` menetapkan daftar izin dasar sebelum `tools.allow`/`tools.deny`:

<Note>
Onboarding lokal menetapkan default konfigurasi lokal baru ke `tools.profile: "coding"` saat belum diatur (profil eksplisit yang sudah ada dipertahankan).
</Note>

| Profil      | Mencakup                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | hanya `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Tanpa pembatasan (sama seperti tidak diatur)                                                                                    |

### Grup alat

| Grup               | Alat                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` diterima sebagai alias untuk `exec`)                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Semua alat bawaan (tidak termasuk Plugin penyedia)                                                                      |

### `tools.allow` / `tools.deny`

Kebijakan izin/tolak alat global (tolak lebih diutamakan). Tidak peka huruf besar/kecil, mendukung wildcard `*`. Diterapkan bahkan saat sandbox Docker tidak aktif.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

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

- Penggantian per agen (`agents.list[].tools.elevated`) hanya dapat memperketat pembatasan.
- `/elevated on|off|ask|full` menyimpan status per sesi; direktif inline berlaku untuk satu pesan.
- `exec` yang ditinggikan melewati sandboxing dan menggunakan jalur escape yang dikonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).

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

Pemeriksaan keamanan loop alat **dinonaktifkan secara default**. Atur `enabled: true` untuk mengaktifkan deteksi. Pengaturan dapat didefinisikan secara global di `tools.loopDetection` dan diganti per agen di `agents.list[].tools.loopDetection`.

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
  Riwayat panggilan alat maksimum yang disimpan untuk analisis loop.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Ambang pola tanpa progres yang berulang untuk peringatan.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Ambang pengulangan yang lebih tinggi untuk memblokir loop kritis.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Ambang penghentian paksa untuk setiap proses tanpa progres.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Peringatkan pada panggilan alat yang sama/argumen yang sama secara berulang.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Peringatkan/blokir pada alat polling yang dikenal (`process.poll`, `command_status`, dll.).
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
        directSend: false, // opt-in: send finished async video directly to the channel
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
    - `model`: penimpaan id model
    - `profile` / `preferredProfile`: pemilihan profil `auth-profiles.json`

    **Entri CLI** (`type: "cli"`):

    - `command`: executable yang akan dijalankan
    - `args`: argumen bertemplat (mendukung `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, dll.; `openclaw doctor --fix` memigrasikan placeholder `{input}` yang sudah usang ke `{{MediaPath}}`)

    **Kolom umum:**

    - `capabilities`: daftar opsional (`image`, `audio`, `video`). Default: `openai`/`anthropic`/`minimax` → gambar, `google` → gambar+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: penimpaan per entri.
    - `tools.media.image.timeoutSeconds` dan entri `timeoutSeconds` model gambar yang cocok juga berlaku saat agen memanggil alat `image` eksplisit.
    - Kegagalan akan fallback ke entri berikutnya.

    Autentikasi penyedia mengikuti urutan standar: `auth-profiles.json` → variabel env → `models.providers.*.apiKey`.

    **Kolom penyelesaian asinkron:**

    - `asyncCompletion.directSend`: saat `true`, tugas media asinkron yang selesai dan mendukung pengiriman penyelesaian langsung mencoba pengiriman channel langsung terlebih dahulu. Default: `false` (jalur pembangkitan sesi peminta/pengiriman model). Saat ini ini berlaku untuk `video_generate` asinkron; penyelesaian `music_generate` asinkron tetap dimediasi sesi peminta meskipun ini diaktifkan.

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
    - `agent`: sesi apa pun yang termasuk dalam id agen saat ini (dapat mencakup pengguna lain jika Anda menjalankan sesi per pengirim di bawah id agen yang sama).
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
    - File diwujudkan ke ruang kerja turunan di `.openclaw/attachments/<uuid>/` dengan `.manifest.json`.
    - Konten lampiran otomatis disunting dari persistensi transkrip.
    - Input Base64 divalidasi dengan pemeriksaan alfabet/padding ketat dan pelindung ukuran pra-dekode.
    - Izin file adalah `0700` untuk direktori dan `0600` untuk file.
    - Pembersihan mengikuti kebijakan `cleanup`: `delete` selalu menghapus lampiran; `keep` mempertahankannya hanya saat `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Flag alat bawaan eksperimental. Default nonaktif kecuali aturan aktif otomatis GPT-5 agen-ketat berlaku.

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
- Nilai bawaan: `false` kecuali `agents.defaults.embeddedPi.executionContract` (atau penimpaan per-agen) diatur ke `"strict-agentic"` untuk proses OpenAI atau OpenAI Codex keluarga GPT-5. Atur `true` untuk memaksa alat aktif di luar cakupan tersebut, atau `false` agar tetap nonaktif bahkan untuk proses GPT-5 strict-agentic.
- Saat diaktifkan, prompt sistem juga menambahkan panduan penggunaan agar model hanya menggunakannya untuk pekerjaan yang substansial dan mempertahankan paling banyak satu langkah `in_progress`.

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

- `model`: model bawaan untuk sub-agen yang di-spawn. Jika dihilangkan, sub-agen mewarisi model pemanggil.
- `allowAgents`: allowlist bawaan id agen target untuk `sessions_spawn` saat agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri (`["*"]` = apa pun; bawaan: hanya agen yang sama).
- `runTimeoutSeconds`: timeout bawaan (detik) untuk `sessions_spawn` saat pemanggilan alat menghilangkan `runTimeoutSeconds`. `0` berarti tanpa timeout.
- Kebijakan alat per-subagen: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Penyedia kustom dan URL dasar

OpenClaw menggunakan katalog model bawaan. Tambahkan penyedia kustom melalui `models.providers` di konfigurasi atau `~/.openclaw/agents/<agentId>/agent/models.json`.

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
    - Gunakan `authHeader: true` + `headers` untuk kebutuhan autentikasi kustom.
    - Timpa root konfigurasi agen dengan `OPENCLAW_AGENT_DIR` (atau `PI_CODING_AGENT_DIR`, alias variabel lingkungan lama).
    - Prioritas penggabungan untuk ID penyedia yang cocok:
      - Nilai `baseUrl` `models.json` agen yang tidak kosong menang.
      - Nilai `apiKey` agen yang tidak kosong menang hanya saat penyedia tersebut tidak dikelola SecretRef dalam konteks konfigurasi/auth-profile saat ini.
      - Nilai `apiKey` penyedia yang dikelola SecretRef diperbarui dari penanda sumber (`ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec) alih-alih mempertahankan secret yang sudah di-resolve.
      - Nilai header penyedia yang dikelola SecretRef diperbarui dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk referensi env, `secretref-managed` untuk referensi file/exec).
      - `apiKey`/`baseUrl` agen yang kosong atau tidak ada kembali menggunakan `models.providers` di konfigurasi.
      - `contextWindow`/`maxTokens` model yang cocok menggunakan nilai yang lebih tinggi antara konfigurasi eksplisit dan nilai katalog implisit.
      - `contextTokens` model yang cocok mempertahankan batas runtime eksplisit saat ada; gunakan ini untuk membatasi konteks efektif tanpa mengubah metadata model native.
      - Gunakan `models.mode: "replace"` saat Anda ingin konfigurasi menulis ulang `models.json` sepenuhnya.
      - Persistensi penanda bersifat otoritatif-sumber: penanda ditulis dari snapshot konfigurasi sumber aktif (pra-resolusi), bukan dari nilai secret runtime yang sudah di-resolve.

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
    - `models.providers.*.api`: adapter permintaan (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, dll). Untuk backend `/v1/chat/completions` self-hosted seperti MLX, vLLM, SGLang, dan sebagian besar server lokal yang kompatibel dengan OpenAI, gunakan `openai-completions`. Penyedia kustom dengan `baseUrl` tetapi tanpa `api` menggunakan `openai-completions` secara bawaan; atur `openai-responses` hanya saat backend mendukung `/v1/responses`.
    - `models.providers.*.apiKey`: kredensial penyedia (utamakan substitusi SecretRef/env).
    - `models.providers.*.auth`: strategi autentikasi (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: jendela konteks native bawaan untuk model di bawah penyedia ini saat entri model tidak menetapkan `contextWindow`.
    - `models.providers.*.contextTokens`: batas konteks runtime efektif bawaan untuk model di bawah penyedia ini saat entri model tidak menetapkan `contextTokens`.
    - `models.providers.*.maxTokens`: batas token output bawaan untuk model di bawah penyedia ini saat entri model tidak menetapkan `maxTokens`.
    - `models.providers.*.timeoutSeconds`: timeout permintaan HTTP model opsional per-penyedia dalam detik, termasuk penanganan connect, header, body, dan pembatalan total permintaan.
    - `models.providers.*.injectNumCtxForOpenAICompat`: untuk Ollama + `openai-completions`, sisipkan `options.num_ctx` ke dalam permintaan (bawaan: `true`).
    - `models.providers.*.authHeader`: paksa pengangkutan kredensial di header `Authorization` saat diperlukan.
    - `models.providers.*.baseUrl`: URL dasar API upstream.
    - `models.providers.*.headers`: header statis tambahan untuk routing proxy/tenant.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: penimpaan transport untuk permintaan HTTP penyedia model.

    - `request.headers`: header tambahan (digabungkan dengan bawaan penyedia). Nilai menerima SecretRef.
    - `request.auth`: penimpaan strategi autentikasi. Mode: `"provider-default"` (gunakan autentikasi bawaan penyedia), `"authorization-bearer"` (dengan `token`), `"header"` (dengan `headerName`, `value`, `prefix` opsional).
    - `request.proxy`: penimpaan proxy HTTP. Mode: `"env-proxy"` (gunakan variabel env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (dengan `url`). Kedua mode menerima sub-objek `tls` opsional.
    - `request.tls`: penimpaan TLS untuk koneksi langsung. Field: `ca`, `cert`, `key`, `passphrase` (semuanya menerima SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: saat `true`, izinkan HTTPS ke `baseUrl` saat DNS me-resolve ke rentang privat, CGNAT, atau serupa, melalui guard fetch HTTP penyedia (opt-in operator untuk endpoint self-hosted tepercaya yang kompatibel dengan OpenAI). URL stream penyedia model loopback seperti `localhost`, `127.0.0.1`, dan `[::1]` diizinkan otomatis kecuali ini secara eksplisit diatur ke `false`; host LAN, tailnet, dan DNS privat tetap memerlukan opt-in. WebSocket menggunakan `request` yang sama untuk header/TLS tetapi tidak menggunakan gate SSRF fetch tersebut. Bawaan `false`.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: entri katalog model penyedia eksplisit.
    - `models.providers.*.models.*.input`: modalitas input model. Gunakan `["text"]` untuk model khusus teks dan `["text", "image"]` untuk model native image/vision. Lampiran gambar hanya disisipkan ke giliran agen saat model yang dipilih ditandai mendukung gambar.
    - `models.providers.*.models.*.contextWindow`: metadata jendela konteks native model. Ini menimpa `contextWindow` tingkat penyedia untuk model tersebut.
    - `models.providers.*.models.*.contextTokens`: batas konteks runtime opsional. Ini menimpa `contextTokens` tingkat penyedia; gunakan saat Anda menginginkan anggaran konteks efektif yang lebih kecil daripada `contextWindow` native model; `openclaw models list` menampilkan kedua nilai saat keduanya berbeda.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: petunjuk kompatibilitas opsional. Untuk `api: "openai-completions"` dengan `baseUrl` non-native yang tidak kosong (host bukan `api.openai.com`), OpenClaw memaksanya menjadi `false` saat runtime. `baseUrl` yang kosong/dihilangkan mempertahankan perilaku OpenAI bawaan.
    - `models.providers.*.models.*.compat.requiresStringContent`: petunjuk kompatibilitas opsional untuk endpoint chat kompatibel OpenAI yang hanya menerima string. Saat `true`, OpenClaw meratakan array `messages[].content` teks murni menjadi string biasa sebelum mengirim permintaan.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: root pengaturan penemuan otomatis Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: aktifkan/nonaktifkan penemuan implisit.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS untuk penemuan.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filter id penyedia opsional untuk penemuan tertarget.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interval polling untuk penyegaran penemuan.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: jendela konteks fallback untuk model yang ditemukan.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token output maksimum fallback untuk model yang ditemukan.

  </Accordion>
</AccordionGroup>

Onboarding penyedia kustom interaktif menyimpulkan input gambar untuk ID model vision umum seperti GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V, dan GLM-4V, serta melewati pertanyaan tambahan untuk keluarga khusus teks yang dikenal. ID model yang tidak dikenal tetap memunculkan prompt untuk dukungan gambar. Onboarding non-interaktif menggunakan inferensi yang sama; teruskan `--custom-image-input` untuk memaksa metadata yang mendukung gambar atau `--custom-text-input` untuk memaksa metadata khusus teks.

### Contoh penyedia

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin penyedia `cerebras` yang dibundel dapat mengonfigurasi ini melalui `openclaw onboard --auth-choice cerebras-api-key`. Gunakan konfigurasi penyedia eksplisit hanya saat menimpa nilai bawaan.

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
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Kompatibel dengan Anthropic, penyedia bawaan. Pintasan: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    Lihat [Model Lokal](/id/gateway/local-models). TL;DR: jalankan model lokal besar melalui LM Studio Responses API pada perangkat keras serius; tetap gabungkan model hosted sebagai fallback.
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

    Tetapkan `MINIMAX_API_KEY`. Pintasan: `openclaw onboard --auth-choice minimax-global-api` atau `openclaw onboard --auth-choice minimax-cn-api`. Katalog model secara default hanya menggunakan M2.7. Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan pemikiran MiniMax secara default kecuali Anda secara eksplisit menetapkan `thinking` sendiri. `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.

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

    Endpoint native Moonshot mengiklankan kompatibilitas penggunaan streaming pada transport `openai-completions` bersama, dan OpenClaw menentukannya dari kemampuan endpoint, bukan hanya dari id penyedia bawaan.

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
    - Untuk endpoint umum, definisikan penyedia kustom dengan penggantian URL dasar.

  </Accordion>
</AccordionGroup>

---

## Terkait

- [Konfigurasi — agen](/id/gateway/config-agents)
- [Konfigurasi — channel](/id/gateway/config-channels)
- [Referensi konfigurasi](/id/gateway/configuration-reference) — kunci tingkat atas lainnya
- [Alat dan plugin](/id/tools)
