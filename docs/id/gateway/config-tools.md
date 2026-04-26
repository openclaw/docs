---
read_when:
    - Mengonfigurasi kebijakan, allowlist, atau fitur eksperimental `tools.*`
    - Mendaftarkan provider kustom atau mengoverride base URL
    - Menyiapkan endpoint self-hosted yang kompatibel dengan OpenAI
sidebarTitle: Tools and custom providers
summary: Config tool (kebijakan, toggle eksperimental, tool berbasis provider) dan penyiapan provider/base-URL kustom
title: Konfigurasi — tool dan provider kustom
x-i18n:
    generated_at: "2026-04-26T11:28:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef030940b155224e614675a85c7a81567fd3a493e5ec1c25c5956d49cbc11b86
    source_path: gateway/config-tools.md
    workflow: 15
---

Key config `tools.*` dan penyiapan provider kustom / base URL. Untuk agen, channel, dan key config tingkat atas lainnya, lihat [Referensi konfigurasi](/id/gateway/configuration-reference).

## Tools

### Profil tool

`tools.profile` menetapkan allowlist dasar sebelum `tools.allow`/`tools.deny`:

<Note>
Onboarding lokal secara default menetapkan config lokal baru ke `tools.profile: "coding"` saat belum diatur (profil eksplisit yang sudah ada tetap dipertahankan).
</Note>

| Profil      | Mencakup                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | hanya `session_status`                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                    |
| `full`      | Tanpa pembatasan (sama seperti tidak diatur)                                                                                 |

### Grup tool

| Grup               | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` diterima sebagai alias untuk `exec`)                                       |
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
| `group:openclaw`   | Semua tool bawaan (tidak termasuk Plugin provider)                                                                      |

### `tools.allow` / `tools.deny`

Kebijakan allow/deny tool global (deny menang). Tidak peka huruf besar/kecil, mendukung wildcard `*`. Diterapkan bahkan saat sandbox Docker nonaktif.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Lebih lanjut membatasi tool untuk provider atau model tertentu. Urutan: profil dasar → profil provider → allow/deny.

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

Mengendalikan akses exec elevated di luar sandbox:

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
- `/elevated on|off|ask|full` menyimpan status per sesi; directive inline berlaku untuk satu pesan.
- `exec` elevated melewati sandboxing dan menggunakan jalur escape yang dikonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).

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

Pemeriksaan keamanan loop tool **nonaktif secara default**. Atur `enabled: true` untuk mengaktifkan deteksi. Pengaturan dapat didefinisikan secara global di `tools.loopDetection` dan dioverride per agen di `agents.list[].tools.loopDetection`.

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
  Riwayat panggilan tool maksimum yang disimpan untuk analisis loop.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Ambang pola berulang tanpa progres untuk peringatan.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Ambang berulang yang lebih tinggi untuk memblokir loop kritis.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Ambang hard stop untuk setiap run tanpa progres.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Beri peringatan pada panggilan tool/same-args yang berulang.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Beri peringatan/blokir pada tool poll yang dikenal (`process.poll`, `command_status`, dll.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Beri peringatan/blokir pada pola pasangan no-progress yang bergantian.
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
        apiKey: "brave_api_key", // atau env BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opsional; hilangkan untuk auto-detect
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
        directSend: false, // opt-in: kirim musik/video async yang selesai langsung ke channel
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
  <Accordion title="Field entri model media">
    **Entri provider** (`type: "provider"` atau dihilangkan):

    - `provider`: id provider API (`openai`, `anthropic`, `google`/`gemini`, `groq`, dll.)
    - `model`: override id model
    - `profile` / `preferredProfile`: pemilihan profil `auth-profiles.json`

    **Entri CLI** (`type: "cli"`):

    - `command`: executable yang akan dijalankan
    - `args`: arg bertemplat (mendukung `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, dll.)

    **Field umum:**

    - `capabilities`: daftar opsional (`image`, `audio`, `video`). Default: `openai`/`anthropic`/`minimax` → gambar, `google` → gambar+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override per entri.
    - Kegagalan akan fallback ke entri berikutnya.

    Auth provider mengikuti urutan standar: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

    **Field async completion:**

    - `asyncCompletion.directSend`: saat `true`, tugas async `music_generate` dan `video_generate` yang selesai mencoba pengiriman channel langsung terlebih dahulu. Default: `false` (jalur lama requester-session wake/model-delivery).

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

Mengendalikan sesi mana yang dapat ditargetkan oleh tool sesi (`sessions_list`, `sessions_history`, `sessions_send`).

Default: `tree` (sesi saat ini + sesi yang di-spawn olehnya, seperti subagen).

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
    - `self`: hanya key sesi saat ini.
    - `tree`: sesi saat ini + sesi yang di-spawn oleh sesi saat ini (subagen).
    - `agent`: sesi apa pun yang dimiliki oleh id agen saat ini (dapat mencakup pengguna lain jika Anda menjalankan sesi per-pengirim di bawah id agen yang sama).
    - `all`: sesi apa pun. Penargetan lintas agen tetap memerlukan `tools.agentToAgent`.
    - Clamp sandbox: saat sesi saat ini di-sandbox dan `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, visibilitas dipaksa ke `tree` meskipun `tools.sessions.visibility="all"`.
  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Mengendalikan dukungan lampiran inline untuk `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: setel true untuk mengizinkan lampiran file inline
        maxTotalBytes: 5242880, // total 5 MB untuk semua file
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // pertahankan lampiran saat cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Catatan lampiran">
    - Lampiran hanya didukung untuk `runtime: "subagent"`. Runtime ACP menolaknya.
    - File dimaterialisasikan ke workspace anak di `.openclaw/attachments/<uuid>/` dengan `.manifest.json`.
    - Konten lampiran otomatis disunting dari persistensi transkrip.
    - Input Base64 divalidasi dengan pemeriksaan alfabet/padding yang ketat dan guard ukuran sebelum decode.
    - Izin file adalah `0700` untuk direktori dan `0600` untuk file.
    - Cleanup mengikuti kebijakan `cleanup`: `delete` selalu menghapus lampiran; `keep` mempertahankannya hanya saat `retainOnSessionKeep: true`.
  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Flag tool bawaan eksperimental. Default nonaktif kecuali aturan auto-enable GPT-5 strict-agentic berlaku.

```json5
{
  tools: {
    experimental: {
      planTool: true, // aktifkan update_plan eksperimental
    },
  },
}
```

- `planTool`: mengaktifkan tool `update_plan` terstruktur untuk pelacakan pekerjaan multi-langkah yang tidak sepele.
- Default: `false` kecuali `agents.defaults.embeddedPi.executionContract` (atau override per-agen) diatur ke `"strict-agentic"` untuk run keluarga GPT-5 OpenAI atau OpenAI Codex. Atur `true` untuk memaksa tool aktif di luar cakupan itu, atau `false` untuk tetap menonaktifkannya bahkan untuk run GPT-5 strict-agentic.
- Saat diaktifkan, system prompt juga menambahkan panduan penggunaan agar model hanya memakainya untuk pekerjaan yang substansial dan menjaga maksimal satu langkah `in_progress`.

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

- `model`: model default untuk subagen yang di-spawn. Jika dihilangkan, subagen mewarisi model pemanggil.
- `allowAgents`: allowlist default ID agen target untuk `sessions_spawn` saat agen peminta tidak menetapkan `subagents.allowAgents` miliknya sendiri (`["*"]` = agen apa pun; default: hanya agen yang sama).
- `runTimeoutSeconds`: timeout default (detik) untuk `sessions_spawn` saat pemanggilan tool tidak menyertakan `runTimeoutSeconds`. `0` berarti tanpa timeout.
- Kebijakan tool per-subagen: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provider kustom dan base URL

OpenClaw menggunakan katalog model bawaan. Tambahkan provider kustom melalui `models.providers` di config atau `~/.openclaw/agents/<agentId>/agent/models.json`.

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
  <Accordion title="Auth dan prioritas merge">
    - Gunakan `authHeader: true` + `headers` untuk kebutuhan auth kustom.
    - Override root config agen dengan `OPENCLAW_AGENT_DIR` (atau `PI_CODING_AGENT_DIR`, alias environment variable lama).
    - Prioritas merge untuk ID provider yang cocok:
      - Nilai `baseUrl` `models.json` agen yang tidak kosong menang.
      - Nilai `apiKey` agen yang tidak kosong menang hanya ketika provider tersebut tidak dikelola SecretRef dalam konteks config/auth-profile saat ini.
      - Nilai `apiKey` provider yang dikelola SecretRef diperbarui dari penanda sumber (`ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec) alih-alih menyimpan secret yang sudah di-resolve.
      - Nilai header provider yang dikelola SecretRef diperbarui dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec).
      - `apiKey`/`baseUrl` agen yang kosong atau hilang akan fallback ke `models.providers` di config.
      - `contextWindow`/`maxTokens` model yang cocok menggunakan nilai yang lebih tinggi antara config eksplisit dan nilai katalog implisit.
      - `contextTokens` model yang cocok mempertahankan batas runtime eksplisit bila ada; gunakan ini untuk membatasi konteks efektif tanpa mengubah metadata model native.
      - Gunakan `models.mode: "replace"` saat Anda ingin config menulis ulang `models.json` sepenuhnya.
      - Persistensi marker bersifat source-authoritative: marker ditulis dari snapshot config sumber aktif (sebelum resolusi), bukan dari nilai secret runtime yang sudah di-resolve.
  </Accordion>
</AccordionGroup>

### Detail field provider

<AccordionGroup>
  <Accordion title="Katalog tingkat atas">
    - `models.mode`: perilaku katalog provider (`merge` atau `replace`).
    - `models.providers`: peta provider kustom yang diberi key berdasarkan ID provider.
      - Pengeditan aman: gunakan `openclaw config set models.providers.<id> '<json>' --strict-json --merge` atau `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` untuk pembaruan aditif. `config set` menolak penggantian destruktif kecuali Anda memberikan `--replace`.
  </Accordion>
  <Accordion title="Koneksi dan auth provider">
    - `models.providers.*.api`: adapter permintaan (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, dll).
    - `models.providers.*.apiKey`: kredensial provider (lebih baik gunakan substitusi SecretRef/env).
    - `models.providers.*.auth`: strategi auth (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.injectNumCtxForOpenAICompat`: untuk Ollama + `openai-completions`, suntikkan `options.num_ctx` ke dalam permintaan (default: `true`).
    - `models.providers.*.authHeader`: paksa transport kredensial di header `Authorization` saat diperlukan.
    - `models.providers.*.baseUrl`: base URL API upstream.
    - `models.providers.*.headers`: header statis tambahan untuk routing proxy/tenant.
  </Accordion>
  <Accordion title="Override transport permintaan">
    `models.providers.*.request`: override transport untuk permintaan HTTP model-provider.

    - `request.headers`: header tambahan (digabung dengan default provider). Nilai menerima SecretRef.
    - `request.auth`: override strategi auth. Mode: `"provider-default"` (gunakan auth bawaan provider), `"authorization-bearer"` (dengan `token`), `"header"` (dengan `headerName`, `value`, opsional `prefix`).
    - `request.proxy`: override proxy HTTP. Mode: `"env-proxy"` (gunakan env var `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (dengan `url`). Kedua mode menerima sub-objek `tls` opsional.
    - `request.tls`: override TLS untuk koneksi langsung. Field: `ca`, `cert`, `key`, `passphrase` (semuanya menerima SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: saat `true`, izinkan HTTPS ke `baseUrl` ketika DNS me-resolve ke rentang privat, CGNAT, atau serupa, melalui guard fetch HTTP provider (opt-in operator untuk endpoint self-hosted tepercaya yang kompatibel dengan OpenAI). WebSocket menggunakan `request` yang sama untuk header/TLS tetapi tidak untuk gerbang SSRF fetch tersebut. Default `false`.

  </Accordion>
  <Accordion title="Entri katalog model">
    - `models.providers.*.models`: entri katalog model provider eksplisit.
    - `models.providers.*.models.*.contextWindow`: metadata context window model native.
    - `models.providers.*.models.*.contextTokens`: batas konteks runtime opsional. Gunakan ini saat Anda menginginkan anggaran konteks efektif yang lebih kecil daripada `contextWindow` native model; `openclaw models list` menampilkan kedua nilai saat berbeda.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: petunjuk kompatibilitas opsional. Untuk `api: "openai-completions"` dengan `baseUrl` non-native yang tidak kosong (host bukan `api.openai.com`), OpenClaw memaksa ini menjadi `false` saat runtime. `baseUrl` yang kosong/tidak ada mempertahankan perilaku default OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: petunjuk kompatibilitas opsional untuk endpoint chat kompatibel OpenAI yang hanya menerima string. Saat `true`, OpenClaw meratakan array `messages[].content` teks murni menjadi string biasa sebelum mengirim permintaan.
  </Accordion>
  <Accordion title="Discovery Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: root pengaturan auto-discovery Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: aktifkan/nonaktifkan discovery implisit.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS untuk discovery.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filter provider-id opsional untuk discovery yang terarah.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interval polling untuk refresh discovery.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: context window fallback untuk model yang ditemukan.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token output maksimum fallback untuk model yang ditemukan.
  </Accordion>
</AccordionGroup>

### Contoh provider

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.6 / 4.7)">
    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/zai-glm-4.6"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
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
              { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
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

    Kompatibel dengan Anthropic, provider bawaan. Pintasan: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Model lokal (LM Studio)">
    Lihat [Model Lokal](/id/gateway/local-models). Singkatnya: jalankan model lokal besar melalui LM Studio Responses API pada perangkat keras yang memadai; pertahankan model hosted tetap di-merge untuk fallback.
  </Accordion>
  <Accordion title="MiniMax M2.7 (langsung)">
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

    Atur `MINIMAX_API_KEY`. Pintasan: `openclaw onboard --auth-choice minimax-global-api` atau `openclaw onboard --auth-choice minimax-cn-api`. Katalog model default hanya ke M2.7. Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking MiniMax secara default kecuali Anda secara eksplisit mengatur `thinking` sendiri. `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.

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

    Untuk endpoint China: `baseUrl: "https://api.moonshot.cn/v1"` atau `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Endpoint Moonshot native mengiklankan kompatibilitas penggunaan streaming pada transport bersama `openai-completions`, dan OpenClaw mengaitkannya berdasarkan kapabilitas endpoint, bukan hanya ID provider bawaan.

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

    Atur `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`). Gunakan referensi `opencode/...` untuk katalog Zen atau referensi `opencode-go/...` untuk katalog Go. Pintasan: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (kompatibel dengan Anthropic)">
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

    Base URL sebaiknya tidak menyertakan `/v1` (klien Anthropic menambahkannya). Pintasan: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Atur `ZAI_API_KEY`. `z.ai/*` dan `z-ai/*` adalah alias yang diterima. Pintasan: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint umum: `https://api.z.ai/api/paas/v4`
    - Endpoint coding (default): `https://api.z.ai/api/coding/paas/v4`
    - Untuk endpoint umum, definisikan provider kustom dengan override base URL.

  </Accordion>
</AccordionGroup>

---

## Terkait

- [Konfigurasi — agen](/id/gateway/config-agents)
- [Konfigurasi — channels](/id/gateway/config-channels)
- [Referensi konfigurasi](/id/gateway/configuration-reference) — key tingkat atas lainnya
- [Tools dan Plugin](/id/tools)
