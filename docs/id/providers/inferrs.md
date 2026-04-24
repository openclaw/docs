---
read_when:
    - Anda ingin menjalankan OpenClaw terhadap server inferrs lokal
    - Anda sedang menyajikan Gemma atau model lain melalui inferrs
    - Anda memerlukan flag kompatibilitas OpenClaw yang tepat untuk inferrs
summary: Jalankan OpenClaw melalui inferrs (server lokal yang kompatibel dengan OpenAI)
title: Inferrs
x-i18n:
    generated_at: "2026-04-24T09:23:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) dapat menyajikan model lokal di balik API `/v1` yang kompatibel dengan OpenAI. OpenClaw bekerja dengan `inferrs` melalui jalur generik
`openai-completions`.

`inferrs` saat ini paling baik diperlakukan sebagai backend OpenAI-compatible self-hosted kustom, bukan sebagai Plugin provider OpenClaw khusus.

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
    Tambahkan entri provider eksplisit dan arahkan model default Anda ke sana. Lihat contoh konfigurasi lengkap di bawah.
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

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mengapa requiresStringContent penting">
    Beberapa rute Chat Completions `inferrs` hanya menerima string
    `messages[].content`, bukan array bagian konten terstruktur.

    <Warning>
    Jika eksekusi OpenClaw gagal dengan error seperti:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    setel `compat.requiresStringContent: true` di entri model Anda.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw akan meratakan bagian konten teks murni menjadi string biasa sebelum mengirim
    permintaan.

  </Accordion>

  <Accordion title="Peringatan Gemma dan skema tool">
    Beberapa kombinasi `inferrs` + Gemma saat ini menerima permintaan langsung kecil
    `/v1/chat/completions` tetapi tetap gagal pada giliran runtime agen OpenClaw penuh.

    Jika itu terjadi, coba ini terlebih dahulu:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Itu menonaktifkan permukaan skema tool OpenClaw untuk model tersebut dan dapat mengurangi tekanan prompt pada backend lokal yang lebih ketat.

    Jika permintaan langsung kecil tetap berfungsi tetapi giliran agen OpenClaw normal terus
    crash di dalam `inferrs`, masalah sisanya biasanya adalah perilaku model/server upstream
    alih-alih lapisan transport OpenClaw.

  </Accordion>

  <Accordion title="Smoke test manual">
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
    `inferrs` diperlakukan sebagai backend `/v1` bergaya proxy yang kompatibel dengan OpenAI, bukan endpoint OpenAI native.

    - Pembentukan permintaan khusus OpenAI native tidak berlaku di sini
    - Tidak ada `service_tier`, tidak ada Responses `store`, tidak ada petunjuk cache prompt, dan tidak ada pembentukan payload reasoning-compat OpenAI
    - Header attribution OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) tidak disuntikkan pada base URL `inferrs` kustom

  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="curl /v1/models gagal">
    `inferrs` tidak berjalan, tidak dapat dijangkau, atau tidak bind ke
    host/port yang diharapkan. Pastikan server dimulai dan mendengarkan di alamat yang
    Anda konfigurasi.
  </Accordion>

  <Accordion title="messages[].content mengharapkan string">
    Setel `compat.requiresStringContent: true` di entri model. Lihat bagian
    `requiresStringContent` di atas untuk detail.
  </Accordion>

  <Accordion title="Panggilan langsung /v1/chat/completions lolos tetapi openclaw infer model run gagal">
    Coba setel `compat.supportsTools: false` untuk menonaktifkan permukaan skema tool.
    Lihat peringatan skema tool Gemma di atas.
  </Accordion>

  <Accordion title="inferrs masih crash pada giliran agen yang lebih besar">
    Jika OpenClaw tidak lagi mendapatkan error skema tetapi `inferrs` masih crash pada giliran
    agen yang lebih besar, perlakukan itu sebagai keterbatasan `inferrs` atau model upstream. Kurangi
    tekanan prompt atau beralih ke backend atau model lokal yang berbeda.
  </Accordion>
</AccordionGroup>

<Tip>
Untuk bantuan umum, lihat [Pemecahan Masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Model lokal" href="/id/gateway/local-models" icon="server">
    Menjalankan OpenClaw terhadap server model lokal.
  </Card>
  <Card title="Pemecahan masalah Gateway" href="/id/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Men-debug backend lokal yang kompatibel dengan OpenAI yang lolos probe tetapi gagal pada eksekusi agen.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Ikhtisar semua provider, ref model, dan perilaku failover.
  </Card>
</CardGroup>
