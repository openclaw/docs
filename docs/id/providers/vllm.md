---
read_when:
    - Anda ingin menjalankan OpenClaw dengan server vLLM lokal
    - Anda menginginkan endpoint /v1 yang kompatibel dengan OpenAI untuk model Anda sendiri
summary: Jalankan OpenClaw dengan vLLM (server lokal yang kompatibel dengan OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T14:35:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM menyajikan model sumber terbuka (dan beberapa model khusus) melalui API HTTP yang **kompatibel dengan OpenAI**. OpenClaw terhubung menggunakan API `openai-completions` dan dapat **menemukan otomatis** model saat Anda mengaktifkannya dengan `VLLM_API_KEY`.

| Properti         | Nilai                                      |
| ---------------- | ------------------------------------------ |
| ID penyedia      | `vllm`                                     |
| API              | `openai-completions` (kompatibel dengan OpenAI) |
| Autentikasi      | variabel lingkungan `VLLM_API_KEY`         |
| URL dasar bawaan | `http://127.0.0.1:8000/v1`                 |
| Penggunaan streaming | Didukung (`stream_options.include_usage`) |

## Memulai

<Steps>
  <Step title="Mulai vLLM dengan server yang kompatibel dengan OpenAI">
    URL dasar Anda harus menyediakan endpoint `/v1` (`/v1/models`, `/v1/chat/completions`). vLLM umumnya berjalan di:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Tetapkan variabel lingkungan kunci API">
    Nilai apa pun yang tidak kosong dapat digunakan jika server Anda tidak mewajibkan autentikasi:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Pilih model">
    Ganti dengan salah satu ID model vLLM Anda:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

<Tip>
Untuk penyiapan noninteraktif (CI, skrip), berikan URL dasar, kunci, dan model secara langsung:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Penemuan model (penyedia implisit)

Saat `VLLM_API_KEY` ditetapkan (atau terdapat profil autentikasi) dan `models.providers.vllm` **tidak** ditentukan, OpenClaw mengirim kueri ke `GET http://127.0.0.1:8000/v1/models` dan mengubah ID yang dikembalikan menjadi entri model.

<Note>
Jika Anda menetapkan `models.providers.vllm` secara eksplisit, OpenClaw hanya menggunakan model yang Anda nyatakan. Tambahkan `"vllm/*": {}` ke `agents.defaults.models` agar OpenClaw juga mengirim kueri ke endpoint `/models` milik penyedia yang dikonfigurasi tersebut dan menyertakan semua model vLLM yang diumumkan.
</Note>

## Konfigurasi eksplisit

Konfigurasikan secara eksplisit saat vLLM berjalan pada host atau porta yang berbeda, Anda ingin menetapkan `contextWindow`/`maxTokens`, server Anda memerlukan kunci API yang sebenarnya, atau Anda terhubung ke endpoint local loopback, LAN, atau Tailscale tepercaya:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Agar penyedia tetap dinamis tanpa mencantumkan setiap model, tambahkan wildcard ke katalog model yang terlihat:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Perilaku bergaya proksi">
    vLLM diperlakukan sebagai backend `/v1` bergaya proksi yang kompatibel dengan OpenAI, bukan endpoint OpenAI native:

    | Perilaku                               | Diterapkan?                      |
    | -------------------------------------- | -------------------------------- |
    | Pembentukan permintaan OpenAI native   | Tidak                            |
    | `service_tier`                         | Tidak dikirim                    |
    | `store` Responses                      | Tidak dikirim                    |
    | Petunjuk cache prompt                  | Tidak dikirim                    |
    | Pembentukan payload kompatibilitas penalaran OpenAI | Tidak diterapkan       |
    | Header atribusi OpenClaw tersembunyi   | Tidak disisipkan pada URL dasar khusus |

  </Accordion>

  <Accordion title="Kontrol pemikiran Qwen">
    Untuk model Qwen, tetapkan `compat.thinkingFormat: "qwen-chat-template"` pada baris model saat server mengharapkan argumen kata kunci templat percakapan Qwen. Model ini menyediakan profil biner `/think` (`off`, `on`) karena pemikiran templat percakapan Qwen merupakan penanda aktif/nonaktif, bukan jenjang tingkat upaya bergaya OpenAI.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw memetakan `/think off` menjadi:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Tingkat pemikiran selain `off` mengirim `enable_thinking: true`. Jika endpoint Anda mengharapkan penanda tingkat teratas bergaya DashScope, gunakan `compat.thinkingFormat: "qwen"` untuk mengirim `enable_thinking` pada akar permintaan.

  </Accordion>

  <Accordion title="Kontrol pemikiran Nemotron 3">
    Untuk model `vllm/nemotron-3-*` dengan pemikiran dinonaktifkan, plugin bawaan mengirim:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Untuk menyesuaikan nilai ini, tetapkan `chat_template_kwargs` di bawah parameter model. Jika Anda juga menetapkan `params.extra_body.chat_template_kwargs`, nilai tersebut diprioritaskan karena `extra_body` merupakan penimpaan isi permintaan terakhir.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Panggilan alat Qwen muncul sebagai teks">
    Pertama, pastikan vLLM dimulai dengan parser panggilan alat dan templat percakapan yang tepat untuk model tersebut. Dokumentasi vLLM menetapkan `hermes` untuk model Qwen2.5 dan `qwen3_xml` untuk model Qwen3-Coder.

    Gejala: Skills/alat tidak pernah dijalankan, asisten mencetak JSON/XML mentah seperti `{"name":"read","arguments":...}`, atau vLLM mengembalikan larik `tool_calls` kosong saat OpenClaw mengirim `tool_choice: "auto"`.

    Beberapa kombinasi Qwen/vLLM hanya mengembalikan panggilan alat terstruktur saat permintaan menggunakan `tool_choice: "required"`. Paksa pengaturan ini per model dengan `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    Ganti ID model dengan ID persis dari `openclaw models list --provider vllm`, atau terapkan penimpaan yang sama melalui CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Ini merupakan solusi sementara yang harus diaktifkan secara eksplisit: pengaturan ini memaksa setiap giliran yang memiliki alat untuk melakukan panggilan alat, jadi gunakan hanya untuk entri model khusus saat perilaku tersebut dapat diterima. Jangan menetapkannya sebagai bawaan global untuk semua model vLLM, dan jangan memasangkannya dengan proksi yang mengubah sembarang teks asisten menjadi panggilan alat yang dapat dieksekusi.

  </Accordion>

  <Accordion title="URL dasar khusus">
    Jika server vLLM Anda berjalan pada host atau porta nonbawaan, tetapkan `baseUrl` dalam konfigurasi penyedia eksplisit:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Respons pertama lambat atau waktu tunggu server jarak jauh habis">
    Untuk model lokal berukuran besar, host LAN jarak jauh, atau sambungan tailnet, tetapkan batas waktu permintaan dengan cakupan penyedia:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` hanya berlaku untuk permintaan HTTP model vLLM: penyiapan koneksi, header respons, streaming isi, dan pembatalan pengambilan terlindungi secara keseluruhan. Pengaturan ini juga menaikkan batas pengawas keadaan diam/streaming LLM di atas nilai bawaan implisit sekitar 120 detik untuk penyedia ini. Pilih pengaturan ini daripada menaikkan `agents.defaults.timeoutSeconds`, yang mengendalikan seluruh proses agen.

  </Accordion>

  <Accordion title="Server tidak dapat dijangkau">
    Periksa apakah server vLLM berjalan dan dapat diakses:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jika Anda melihat galat koneksi, verifikasi host, porta, dan bahwa vLLM dimulai dalam mode server yang kompatibel dengan OpenAI. OpenClaw memercayai origin `models.providers.vllm.baseUrl` yang dikonfigurasi secara persis untuk permintaan model terlindungi pada endpoint local loopback, LAN, dan Tailscale. Origin metadata/link-local tetap diblokir tanpa pengaktifan eksplisit. Tetapkan `models.providers.vllm.request.allowPrivateNetwork: true` hanya saat permintaan vLLM harus menjangkau origin privat lain, atau `false` untuk menonaktifkan kepercayaan terhadap origin persis tersebut.

  </Accordion>

  <Accordion title="Galat autentikasi pada permintaan">
    Jika permintaan gagal dengan galat autentikasi, tetapkan `VLLM_API_KEY` sebenarnya yang sesuai dengan konfigurasi server Anda, atau konfigurasikan penyedia secara eksplisit di bawah `models.providers.vllm`.

    <Tip>
    Jika server vLLM Anda tidak mewajibkan autentikasi, nilai apa pun yang tidak kosong untuk `VLLM_API_KEY` dapat digunakan sebagai sinyal pengaktifan eksplisit bagi OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Tidak ada model yang ditemukan">
    Penemuan otomatis mengharuskan `VLLM_API_KEY` ditetapkan. Jika Anda telah menentukan `models.providers.vllm`, OpenClaw hanya menggunakan model yang Anda nyatakan kecuali `agents.defaults.models` menyertakan `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Alat dirender sebagai teks mentah">
    Jika model Qwen mencetak sintaks alat JSON/XML alih-alih menjalankan Skills:

    - Mulai vLLM dengan parser/templat yang benar untuk model tersebut.
    - Konfirmasikan ID model persis dengan `openclaw models list --provider vllm`.
    - Tambahkan penimpaan khusus per model `params.extra_body.tool_choice: "required"` hanya jika `tool_choice: "auto"` masih mengembalikan panggilan alat yang kosong atau hanya berupa teks.

  </Accordion>
</AccordionGroup>

<Warning>
Bantuan lainnya: [Pemecahan masalah](/id/help/troubleshooting) dan [Tanya Jawab Umum](/id/help/faq).
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku pengalihan saat gagal.
  </Card>
  <Card title="OpenAI" href="/id/providers/openai" icon="bolt">
    Penyedia OpenAI native dan perilaku rute yang kompatibel dengan OpenAI.
  </Card>
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan kembali kredensial.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan cara mengatasinya.
  </Card>
</CardGroup>
