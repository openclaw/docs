---
read_when:
    - Anda ingin menjalankan OpenClaw dengan server inferrs lokal
    - Anda menyajikan Gemma atau model lain melalui inferrs
    - Anda memerlukan flag kompatibilitas OpenClaw yang tepat untuk inferrs
summary: Jalankan OpenClaw melalui inferrs (server lokal yang kompatibel dengan OpenAI)
title: Menyimpulkan
x-i18n:
    generated_at: "2026-05-10T19:50:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) dapat menyajikan model lokal di belakang API `/v1` yang kompatibel dengan OpenAI. OpenClaw bekerja dengan `inferrs` melalui jalur generik `openai-completions`.

| Properti          | Nilai                                                              |
| ----------------- | ------------------------------------------------------------------ |
| id Provider       | `inferrs` (kustom; konfigurasikan di bawah `models.providers.inferrs`) |
| Plugin            | tidak ada — `inferrs` bukan Plugin provider OpenClaw bawaan        |
| Variabel env auth | Opsional. Nilai apa pun berfungsi jika server inferrs Anda tidak memiliki auth |
| API               | Kompatibel dengan OpenAI (`openai-completions`)                    |
| URL dasar yang disarankan | `http://127.0.0.1:8080/v1` (atau di mana pun server inferrs Anda berada) |

<Note>
  `inferrs` saat ini paling baik diperlakukan sebagai backend kustom yang di-host sendiri dan kompatibel dengan OpenAI, bukan Plugin provider OpenClaw khusus. Anda mengonfigurasinya melalui `models.providers.inferrs`, bukan melalui flag pilihan onboarding. Jika Anda membutuhkan Plugin bawaan sungguhan dengan penemuan otomatis, lihat [SGLang](/id/providers/sglang) atau [vLLM](/id/providers/vllm).
</Note>

## Memulai

<Steps>
  <Step title="Jalankan inferrs dengan sebuah model">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verifikasi bahwa server dapat dijangkau">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Tambahkan entri provider OpenClaw">
    Tambahkan entri provider eksplisit dan arahkan model default Anda ke entri tersebut. Lihat contoh konfigurasi lengkap di bawah.
  </Step>
</Steps>

## Contoh konfigurasi lengkap

Contoh ini menggunakan Gemma 4 pada server `inferrs` lokal.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Startup sesuai permintaan

Inferrs juga dapat dijalankan oleh OpenClaw hanya saat model `inferrs/...`
dipilih. Tambahkan `localService` ke entri provider yang sama:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` harus absolut. Gunakan `which inferrs` pada host Gateway dan masukkan
path tersebut ke konfigurasi. Untuk referensi field lengkap, lihat
[Layanan model lokal](/id/gateway/local-model-services).

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mengapa requiresStringContent penting">
    Beberapa rute Chat Completions `inferrs` hanya menerima string
    `messages[].content`, bukan array bagian konten terstruktur.

    <Warning>
    Jika proses OpenClaw gagal dengan kesalahan seperti:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    atur `compat.requiresStringContent: true` di entri model Anda.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw akan meratakan bagian konten teks murni menjadi string biasa sebelum mengirim
    permintaan.

  </Accordion>

  <Accordion title="Catatan Gemma dan skema tool">
    Beberapa kombinasi `inferrs` + Gemma saat ini menerima permintaan langsung
    `/v1/chat/completions` kecil tetapi masih gagal pada giliran agent-runtime OpenClaw
    penuh.

    Jika itu terjadi, coba ini terlebih dahulu:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Itu menonaktifkan permukaan skema tool OpenClaw untuk model dan dapat mengurangi tekanan prompt
    pada backend lokal yang lebih ketat.

    Jika permintaan langsung yang sangat kecil masih berfungsi tetapi giliran agen OpenClaw normal terus
    crash di dalam `inferrs`, masalah yang tersisa biasanya adalah perilaku model/server
    upstream, bukan lapisan transport OpenClaw.

  </Accordion>

  <Accordion title="Uji smoke manual">
    Setelah dikonfigurasi, uji kedua lapisan:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Jika perintah pertama berfungsi tetapi yang kedua gagal, periksa bagian pemecahan masalah di bawah.

  </Accordion>

  <Accordion title="Perilaku bergaya proxy">
    `inferrs` diperlakukan sebagai backend `/v1` bergaya proxy yang kompatibel dengan OpenAI, bukan
    endpoint OpenAI native.

    - Pembentukan permintaan khusus OpenAI native tidak berlaku di sini
    - Tidak ada `service_tier`, tidak ada Responses `store`, tidak ada petunjuk prompt-cache, dan tidak ada
      pembentukan payload kompatibilitas reasoning OpenAI
    - Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
      tidak disuntikkan pada URL dasar `inferrs` kustom

  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="curl /v1/models gagal">
    `inferrs` tidak berjalan, tidak dapat dijangkau, atau tidak terikat ke
    host/port yang diharapkan. Pastikan server telah dijalankan dan mendengarkan pada alamat yang Anda
    konfigurasi.
  </Accordion>

  <Accordion title="messages[].content mengharapkan string">
    Atur `compat.requiresStringContent: true` di entri model. Lihat bagian
    `requiresStringContent` di atas untuk detail.
  </Accordion>

  <Accordion title="Panggilan langsung /v1/chat/completions berhasil tetapi openclaw infer model run gagal">
    Coba atur `compat.supportsTools: false` untuk menonaktifkan permukaan skema tool.
    Lihat catatan skema tool Gemma di atas.
  </Accordion>

  <Accordion title="inferrs masih crash pada giliran agen yang lebih besar">
    Jika OpenClaw tidak lagi mendapatkan kesalahan skema tetapi `inferrs` masih crash pada giliran
    agen yang lebih besar, perlakukan itu sebagai batasan upstream `inferrs` atau model. Kurangi
    tekanan prompt atau beralih ke backend atau model lokal yang berbeda.
  </Accordion>
</AccordionGroup>

<Tip>
Untuk bantuan umum, lihat [Pemecahan masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Model lokal" href="/id/gateway/local-models" icon="server">
    Menjalankan OpenClaw terhadap server model lokal.
  </Card>
  <Card title="Layanan model lokal" href="/id/gateway/local-model-services" icon="play">
    Menjalankan server model lokal sesuai permintaan untuk provider yang dikonfigurasi.
  </Card>
  <Card title="Pemecahan masalah Gateway" href="/id/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Men-debug backend lokal yang kompatibel dengan OpenAI yang lulus probe tetapi gagal pada proses agen.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Ikhtisar semua provider, ref model, dan perilaku failover.
  </Card>
</CardGroup>
