---
read_when:
    - Anda ingin menjalankan OpenClaw dengan server inferrs lokal
    - Anda menyajikan Gemma atau model lain melalui inferrs
    - Anda memerlukan flag kompatibilitas OpenClaw yang tepat untuk inferrs
summary: Jalankan OpenClaw melalui inferrs (server lokal yang kompatibel dengan OpenAI)
title: Menyimpulkan
x-i18n:
    generated_at: "2026-07-12T14:33:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) menyajikan model lokal melalui API `/v1` yang kompatibel dengan OpenAI. OpenClaw berkomunikasi dengannya melalui adaptor generik `openai-completions`.

| Properti           | Nilai                                                                |
| ------------------ | -------------------------------------------------------------------- |
| ID penyedia        | `inferrs` (khusus; konfigurasikan di `models.providers.inferrs`)     |
| Plugin             | tidak ada — bukan plugin penyedia bawaan OpenClaw                    |
| Variabel lingkungan autentikasi | tidak diperlukan; nilai apa pun dapat digunakan jika server inferrs Anda tidak memiliki autentikasi |
| API                | Kompatibel dengan OpenAI (`openai-completions`)                      |
| URL dasar yang disarankan | `http://127.0.0.1:8080/v1` (atau lokasi server inferrs Anda mendengarkan) |

<Note>
  `inferrs` adalah backend khusus yang dihosting sendiri dan kompatibel dengan OpenAI, bukan plugin penyedia khusus OpenClaw: Anda mengonfigurasikannya di `models.providers.inferrs`, bukan memilih opsi autentikasi orientasi awal. Untuk plugin bawaan dengan penemuan otomatis, lihat [SGLang](/id/providers/sglang) atau [vLLM](/id/providers/vllm).
</Note>

## Memulai

<Steps>
  <Step title="Mulai inferrs dengan sebuah model">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Pastikan server dapat dijangkau">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Tambahkan entri penyedia OpenClaw">
    Tambahkan entri penyedia secara eksplisit dan arahkan model default Anda ke entri tersebut. Lihat contoh konfigurasi di bawah.
  </Step>
</Steps>

## Contoh konfigurasi lengkap

Gemma 4 pada server `inferrs` lokal:

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

## Penyalaan sesuai permintaan

OpenClaw dapat memulai `inferrs` sendiri hanya ketika model `inferrs/...` dipilih. Tambahkan `localService` ke entri penyedia yang sama:

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

`command` harus berupa jalur absolut. Jalankan `which inferrs` pada host Gateway dan gunakan jalur tersebut. Referensi lengkap kolom: [Layanan model lokal](/id/gateway/local-model-services).

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mengapa requiresStringContent penting">
    Beberapa rute Penyelesaian Percakapan `inferrs` hanya menerima `messages[].content` berupa string, bukan larik bagian konten terstruktur.

    <Warning>
    Jika proses OpenClaw gagal dengan:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    tetapkan `compat.requiresStringContent: true` dalam entri model. OpenClaw kemudian meratakan bagian konten yang hanya berisi teks menjadi string biasa sebelum mengirim permintaan.
    </Warning>

  </Accordion>

  <Accordion title="Catatan khusus Gemma dan skema alat">
    Beberapa kombinasi `inferrs` + Gemma menerima permintaan langsung berukuran kecil ke `/v1/chat/completions`, tetapi gagal pada putaran penuh runtime agen OpenClaw. Coba nonaktifkan permukaan skema alat terlebih dahulu:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Hal tersebut mengurangi tekanan prompt pada backend lokal yang lebih ketat. Jika permintaan langsung berukuran kecil masih berfungsi, tetapi putaran agen OpenClaw normal terus mengalami kegagalan di dalam `inferrs`, anggap hal itu sebagai keterbatasan model/server hulu, bukan masalah transportasi OpenClaw.

  </Accordion>

  <Accordion title="Uji cepat manual">
    Uji kedua lapisan setelah dikonfigurasi:

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

    Jika perintah pertama berfungsi tetapi perintah kedua gagal, lihat Pemecahan masalah di bawah.

  </Accordion>

  <Accordion title="Perilaku bergaya proksi">
    Karena `inferrs` menggunakan adaptor generik `openai-completions` (bukan `openai-responses`), pembentukan permintaan yang hanya berlaku untuk OpenAI asli tidak pernah diterapkan: tidak ada `service_tier`, tidak ada `store` Responses, tidak ada petunjuk cache prompt, dan tidak ada pembentukan muatan kompatibilitas penalaran OpenAI yang dikirim.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="curl /v1/models gagal">
    `inferrs` tidak berjalan, tidak dapat dijangkau, atau tidak terikat ke host/port yang Anda konfigurasi. Pastikan server telah dimulai dan mendengarkan pada alamat tersebut.
  </Accordion>

  <Accordion title="messages[].content mengharapkan string">
    Tetapkan `compat.requiresStringContent: true` dalam entri model (lihat di atas).
  </Accordion>

  <Accordion title="Panggilan langsung /v1/chat/completions berhasil, tetapi openclaw infer model run gagal">
    Tetapkan `compat.supportsTools: false` untuk menonaktifkan permukaan skema alat (lihat catatan khusus Gemma di atas).
  </Accordion>

  <Accordion title="inferrs masih mengalami kegagalan pada putaran agen yang lebih besar">
    Jika kesalahan skema telah hilang, tetapi `inferrs` masih mengalami kegagalan pada putaran agen yang lebih besar, anggap hal itu sebagai keterbatasan `inferrs` hulu atau model. Kurangi tekanan prompt atau ganti backend/model.
  </Accordion>
</AccordionGroup>

<Tip>
Untuk bantuan umum, lihat [Pemecahan masalah](/id/help/troubleshooting) dan [Pertanyaan umum](/id/help/faq).
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Model lokal" href="/id/gateway/local-models" icon="server">
    Menjalankan OpenClaw dengan server model lokal.
  </Card>
  <Card title="Layanan model lokal" href="/id/gateway/local-model-services" icon="play">
    Memulai server model lokal sesuai permintaan untuk penyedia yang dikonfigurasi.
  </Card>
  <Card title="Pemecahan masalah Gateway" href="/id/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Men-debug backend lokal yang kompatibel dengan OpenAI, yang lolos pemeriksaan tetapi gagal menjalankan agen.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Ikhtisar semua penyedia, referensi model, dan perilaku pengalihan kegagalan.
  </Card>
</CardGroup>
