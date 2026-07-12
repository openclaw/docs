---
read_when:
    - Anda ingin menjalankan OpenClaw dengan antirez/ds4
    - Anda menginginkan backend DeepSeek V4 Flash lokal dengan pemanggilan alat
    - Anda memerlukan konfigurasi OpenClaw untuk ds4-server
summary: Jalankan OpenClaw melalui ds4, server lokal yang kompatibel dengan OpenAI untuk DeepSeek V4 Flash
title: ds4
x-i18n:
    generated_at: "2026-07-12T14:32:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) menyajikan DeepSeek V4 Flash dari backend
Metal lokal dengan API `/v1` yang kompatibel dengan OpenAI. OpenClaw terhubung ke ds4
melalui keluarga penyedia generik `openai-completions`.

ds4 bukan Plugin penyedia OpenClaw bawaan. Konfigurasikan di bawah
`models.providers.ds4`, lalu pilih `ds4/deepseek-v4-flash`.

| Properti       | Nilai                                                     |
| -------------- | --------------------------------------------------------- |
| ID penyedia    | `ds4`                                                     |
| Plugin         | tidak ada (hanya konfigurasi)                             |
| API            | Chat Completions yang kompatibel dengan OpenAI (`openai-completions`) |
| URL dasar      | `http://127.0.0.1:18000/v1` (disarankan)                  |
| ID model       | `deepseek-v4-flash`                                       |
| Panggilan alat | `tools` / `tool_calls` bergaya OpenAI                     |
| Penalaran      | `thinking` dan `reasoning_effort` bergaya DeepSeek        |

## Persyaratan

- macOS dengan dukungan Metal.
- Checkout ds4 yang berfungsi dengan `ds4-server` dan berkas GGUF DeepSeek V4 Flash.
- Memori yang cukup untuk konteks yang Anda pilih; nilai `--ctx` yang lebih besar mengalokasikan lebih banyak
  memori KV saat server dimulai.

<Warning>
Giliran agen OpenClaw menyertakan skema alat dan konteks ruang kerja. Konteks kecil
seperti `--ctx 4096` dapat lolos pengujian curl langsung, tetapi gagal saat menjalankan agen penuh dengan
`500 prompt exceeds context`. Gunakan setidaknya `--ctx 32768` untuk pengujian asap agen dan alat.
Gunakan `--ctx 393216` hanya jika tersedia cukup memori dan untuk mengaktifkan ds4
Think Max.
</Warning>

## Mulai cepat

<Steps>
  <Step title="Start ds4-server">
    Ganti `<DS4_DIR>` dengan jalur checkout ds4 Anda.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verify the OpenAI-compatible endpoint">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    Respons harus menyertakan `deepseek-v4-flash`.

  </Step>
  <Step title="Add the OpenClaw provider config">
    Tambahkan konfigurasi dari [Konfigurasi lengkap](#full-config), lalu jalankan pemeriksaan model
    sekali jalan:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## Konfigurasi lengkap

Gunakan konfigurasi ini ketika ds4 sudah berjalan di `127.0.0.1:18000`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

Pertahankan `contextWindow` agar selaras dengan `ds4-server --ctx`. Pertahankan `maxTokens` agar selaras
dengan `--tokens`, kecuali Anda memang ingin OpenClaw meminta keluaran lebih sedikit
daripada nilai bawaan server.

## Memulai sesuai permintaan

OpenClaw dapat memulai ds4 hanya ketika model `ds4/...` dipilih. Tambahkan
`localService` ke entri penyedia yang sama:

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` harus berupa jalur absolut ke berkas yang dapat dieksekusi. Pencarian shell dan ekspansi `~`
tidak digunakan. Lihat [Layanan model lokal](/id/gateway/local-model-services) untuk
setiap bidang `localService`.

## Think Max

ds4 menerapkan Think Max hanya ketika kedua kondisi berikut terpenuhi:

- `ds4-server` dimulai dengan `--ctx 393216` atau lebih tinggi.
- Permintaan menggunakan `reasoning_effort: "max"` (atau bidang tingkat upaya ds4 yang setara).

Jika Anda menjalankan konteks sebesar itu, perbarui flag server dan metadata model
OpenClaw:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## Pengujian

Pemeriksaan HTTP langsung, tanpa melalui OpenClaw:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Perutean model OpenClaw (sama seperti pemeriksaan Mulai cepat):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Pengujian asap agen penuh dan panggilan alat, dengan konteks setidaknya 32768:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

Hasil yang diharapkan:

- `executionTrace.winnerProvider` adalah `ds4`
- `executionTrace.winnerModel` adalah `deepseek-v4-flash`
- `toolSummary.calls` setidaknya `1`
- `finalAssistantVisibleText` diawali dengan `tool-ok`

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="curl /v1/models cannot connect">
    ds4 tidak berjalan atau tidak terikat ke host/port dalam `baseUrl`. Mulai
    `ds4-server`, lalu coba lagi:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    `--ctx` yang dikonfigurasi terlalu kecil untuk giliran OpenClaw. Tingkatkan
    `ds4-server --ctx`, lalu perbarui `models.providers.ds4.models[].contextWindow`
    agar sesuai. Giliran agen penuh dengan alat memerlukan konteks yang jauh lebih besar daripada
    permintaan curl langsung dengan satu pesan.
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 hanya menggunakan Think Max ketika `--ctx` setidaknya `393216` dan permintaan
    meminta `reasoning_effort: "max"`. Konteks yang lebih kecil akan kembali menggunakan
    penalaran tingkat tinggi.
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 memiliki fase awal penempatan Metal dan pemanasan model. Atur
    `localService.readyTimeoutMs: 300000` ketika OpenClaw memulai server sesuai
    permintaan.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Local model services" href="/id/gateway/local-model-services" icon="play">
    Mulai server model lokal sesuai permintaan sebelum permintaan model.
  </Card>
  <Card title="Local models" href="/id/gateway/local-models" icon="server">
    Pilih dan operasikan backend model lokal.
  </Card>
  <Card title="Model providers" href="/id/concepts/model-providers" icon="layers">
    Konfigurasikan referensi penyedia, autentikasi, dan failover.
  </Card>
  <Card title="DeepSeek" href="/id/providers/deepseek" icon="brain">
    Perilaku penyedia DeepSeek native dan kontrol pemikiran.
  </Card>
</CardGroup>
