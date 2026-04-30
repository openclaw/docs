---
read_when:
    - Anda ingin menjalankan OpenClaw dengan server vLLM lokal
    - Anda menginginkan endpoint /v1 yang kompatibel dengan OpenAI dengan model Anda sendiri
summary: Jalankan OpenClaw dengan vLLM (server lokal yang kompatibel dengan OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-30T10:09:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM dapat menyajikan model sumber terbuka (dan beberapa model kustom) melalui API HTTP yang **kompatibel dengan OpenAI**. OpenClaw terhubung ke vLLM menggunakan API `openai-completions`.

OpenClaw juga dapat **menemukan otomatis** model yang tersedia dari vLLM ketika Anda ikut serta dengan `VLLM_API_KEY` (nilai apa pun berfungsi jika server Anda tidak menerapkan autentikasi) dan Anda tidak mendefinisikan entri `models.providers.vllm` secara eksplisit.

OpenClaw memperlakukan `vllm` sebagai penyedia lokal yang kompatibel dengan OpenAI yang mendukung
penghitungan penggunaan streaming, sehingga jumlah token status/konteks dapat diperbarui dari
respons `stream_options.include_usage`.

| Properti        | Nilai                                    |
| ---------------- | ---------------------------------------- |
| ID Penyedia      | `vllm`                                   |
| API              | `openai-completions` (kompatibel dengan OpenAI) |
| Autentikasi      | variabel lingkungan `VLLM_API_KEY`       |
| URL dasar bawaan | `http://127.0.0.1:8000/v1`               |

## Memulai

<Steps>
  <Step title="Mulai vLLM dengan server yang kompatibel dengan OpenAI">
    URL dasar Anda harus mengekspos endpoint `/v1` (mis. `/v1/models`, `/v1/chat/completions`). vLLM umumnya berjalan di:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Tetapkan variabel lingkungan kunci API">
    Nilai apa pun berfungsi jika server Anda tidak menerapkan autentikasi:

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

## Penemuan model (penyedia implisit)

Ketika `VLLM_API_KEY` ditetapkan (atau profil autentikasi ada) dan Anda **tidak** mendefinisikan `models.providers.vllm`, OpenClaw melakukan kueri:

```
GET http://127.0.0.1:8000/v1/models
```

dan mengonversi ID yang dikembalikan menjadi entri model.

<Note>
Jika Anda menetapkan `models.providers.vllm` secara eksplisit, penemuan otomatis dilewati dan Anda harus mendefinisikan model secara manual.
</Note>

## Konfigurasi eksplisit (model manual)

Gunakan konfigurasi eksplisit ketika:

- vLLM berjalan di host atau port berbeda
- Anda ingin menyematkan nilai `contextWindow` atau `maxTokens`
- Server Anda memerlukan kunci API nyata (atau Anda ingin mengontrol header)
- Anda terhubung ke endpoint vLLM local loopback, LAN, atau Tailscale yang tepercaya

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
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

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Perilaku bergaya proksi">
    vLLM diperlakukan sebagai backend `/v1` bergaya proksi yang kompatibel dengan OpenAI, bukan endpoint
    OpenAI native. Artinya:

    | Perilaku | Diterapkan? |
    |----------|----------|
    | Pembentukan permintaan OpenAI native | Tidak |
    | `service_tier` | Tidak dikirim |
    | `store` Responses | Tidak dikirim |
    | Petunjuk cache prompt | Tidak dikirim |
    | Pembentukan payload kompatibilitas reasoning OpenAI | Tidak diterapkan |
    | Header atribusi OpenClaw tersembunyi | Tidak disuntikkan pada URL dasar kustom |

  </Accordion>

  <Accordion title="Kontrol thinking Qwen">
    Untuk model Qwen yang disajikan melalui vLLM, tetapkan
    `params.qwenThinkingFormat: "chat-template"` pada entri model ketika
    server mengharapkan kwargs chat-template Qwen. OpenClaw memetakan `/think off` ke:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Level thinking selain `off` mengirim `enable_thinking: true`. Jika endpoint Anda
    mengharapkan flag tingkat atas bergaya DashScope sebagai gantinya, gunakan
    `params.qwenThinkingFormat: "top-level"` untuk mengirim `enable_thinking` di
    root permintaan. Snake-case `params.qwen_thinking_format` juga diterima.

  </Accordion>

  <Accordion title="Kontrol thinking Nemotron 3">
    vLLM/Nemotron 3 dapat menggunakan kwargs chat-template untuk mengontrol apakah reasoning
    dikembalikan sebagai reasoning tersembunyi atau teks jawaban yang terlihat. Ketika sesi OpenClaw
    menggunakan `vllm/nemotron-3-*` dengan thinking nonaktif, Plugin vLLM bawaan mengirim:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Untuk menyesuaikan nilai-nilai ini, tetapkan `chat_template_kwargs` di bawah params model.
    Jika Anda juga menetapkan `params.extra_body.chat_template_kwargs`, nilai tersebut memiliki
    presedensi akhir karena `extra_body` adalah override body permintaan terakhir.

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

  <Accordion title="Panggilan tool Qwen muncul sebagai teks">
    Pertama, pastikan vLLM dimulai dengan parser tool-call dan template chat
    yang tepat untuk model tersebut. Misalnya, vLLM mendokumentasikan `hermes` untuk model Qwen2.5
    dan `qwen3_xml` untuk model Qwen3-Coder.

    Gejala:

    - skills atau tool tidak pernah berjalan
    - asisten mencetak JSON/XML mentah seperti `{"name":"read","arguments":...}`
    - vLLM mengembalikan array `tool_calls` kosong ketika OpenClaw mengirim
      `tool_choice: "auto"`

    Beberapa kombinasi Qwen/vLLM hanya mengembalikan panggilan tool terstruktur ketika
    permintaan menggunakan `tool_choice: "required"`. Untuk entri model tersebut, paksa
    field permintaan yang kompatibel dengan OpenAI menggunakan `params.extra_body`:

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

    Ganti `Qwen-Qwen2.5-Coder-32B-Instruct` dengan id persis yang dikembalikan oleh:

    ```bash
    openclaw models list --provider vllm
    ```

    Anda dapat menerapkan override yang sama dari CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Ini adalah solusi kompatibilitas opt-in. Ini membuat setiap giliran model dengan
    tool memerlukan panggilan tool, jadi gunakan hanya untuk entri model lokal khusus
    tempat perilaku tersebut dapat diterima. Jangan gunakan sebagai default global untuk semua
    model vLLM, dan jangan gunakan proksi yang secara membabi buta mengonversi teks
    asisten sembarang menjadi panggilan tool yang dapat dieksekusi.

  </Accordion>

  <Accordion title="URL dasar kustom">
    Jika server vLLM Anda berjalan di host atau port non-default, tetapkan `baseUrl` di konfigurasi penyedia eksplisit:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
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
  <Accordion title="Respons pertama lambat atau server jarak jauh timeout">
    Untuk model lokal besar, host LAN jarak jauh, atau tautan tailnet, tetapkan
    timeout permintaan dalam cakupan penyedia:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` hanya berlaku untuk permintaan HTTP model vLLM, termasuk
    penyiapan koneksi, header respons, streaming body, dan total
    abort guarded-fetch. Utamakan ini sebelum menaikkan
    `agents.defaults.timeoutSeconds`, yang mengontrol seluruh eksekusi agen.

  </Accordion>

  <Accordion title="Server tidak dapat dijangkau">
    Periksa bahwa server vLLM berjalan dan dapat diakses:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jika Anda melihat kesalahan koneksi, verifikasi host, port, dan bahwa vLLM dimulai dengan mode server yang kompatibel dengan OpenAI.
    Untuk endpoint local loopback, LAN, atau Tailscale eksplisit, tetapkan juga
    `models.providers.vllm.request.allowPrivateNetwork: true`; permintaan penyedia
    memblokir URL jaringan privat secara default kecuali penyedia tersebut
    dipercaya secara eksplisit.

  </Accordion>

  <Accordion title="Kesalahan autentikasi pada permintaan">
    Jika permintaan gagal dengan kesalahan autentikasi, tetapkan `VLLM_API_KEY` nyata yang cocok dengan konfigurasi server Anda, atau konfigurasikan penyedia secara eksplisit di bawah `models.providers.vllm`.

    <Tip>
    Jika server vLLM Anda tidak menerapkan autentikasi, nilai tidak kosong apa pun untuk `VLLM_API_KEY` berfungsi sebagai sinyal opt-in untuk OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Tidak ada model yang ditemukan">
    Penemuan otomatis memerlukan `VLLM_API_KEY` ditetapkan **dan** tidak ada entri konfigurasi `models.providers.vllm` eksplisit. Jika Anda telah mendefinisikan penyedia secara manual, OpenClaw melewati penemuan dan hanya menggunakan model yang Anda deklarasikan.
  </Accordion>

  <Accordion title="Tool dirender sebagai teks mentah">
    Jika model Qwen mencetak sintaks tool JSON/XML alih-alih menjalankan skill,
    periksa panduan Qwen di Konfigurasi lanjutan di atas. Perbaikan biasanya adalah:

    - mulai vLLM dengan parser/template yang benar untuk model tersebut
    - konfirmasi id model persis dengan `openclaw models list --provider vllm`
    - tambahkan override `params.extra_body.tool_choice: "required"` khusus per model
      hanya jika `tool_choice: "auto"` masih mengembalikan panggilan tool kosong
      atau hanya teks

  </Accordion>
</AccordionGroup>

<Warning>
Bantuan lebih lanjut: [Pemecahan Masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="OpenAI" href="/id/providers/openai" icon="bolt">
    Penyedia OpenAI native dan perilaku rute yang kompatibel dengan OpenAI.
  </Card>
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan ulang kredensial.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan cara mengatasinya.
  </Card>
</CardGroup>
