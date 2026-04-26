---
read_when:
    - Anda ingin menjalankan OpenClaw menggunakan server vLLM lokal
    - Anda menginginkan endpoint `/v1` yang kompatibel dengan OpenAI dengan model Anda sendiri
summary: Jalankan OpenClaw dengan vLLM (server lokal yang kompatibel dengan OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-26T11:37:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

vLLM dapat menyajikan model open-source (dan beberapa model kustom) melalui API HTTP **yang kompatibel dengan OpenAI**. OpenClaw terhubung ke vLLM menggunakan API `openai-completions`.

OpenClaw juga dapat **menemukan secara otomatis** model yang tersedia dari vLLM saat Anda memilih ikut serta dengan `VLLM_API_KEY` (nilai apa pun dapat digunakan jika server Anda tidak menerapkan autentikasi) dan Anda tidak mendefinisikan entri `models.providers.vllm` yang eksplisit.

OpenClaw memperlakukan `vllm` sebagai provider lokal yang kompatibel dengan OpenAI dan mendukung
perhitungan penggunaan yang di-streaming, sehingga jumlah token status/konteks dapat diperbarui dari
respons `stream_options.include_usage`.

| Property         | Value                                    |
| ---------------- | ---------------------------------------- |
| ID provider      | `vllm`                                   |
| API              | `openai-completions` (kompatibel dengan OpenAI) |
| Autentikasi      | variabel lingkungan `VLLM_API_KEY`       |
| URL dasar default | `http://127.0.0.1:8000/v1`              |

## Memulai

<Steps>
  <Step title="Mulai vLLM dengan server yang kompatibel dengan OpenAI">
    URL dasar Anda harus mengekspos endpoint `/v1` (misalnya `/v1/models`, `/v1/chat/completions`). vLLM biasanya berjalan di:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Setel variabel lingkungan kunci API">
    Nilai apa pun dapat digunakan jika server Anda tidak menerapkan autentikasi:

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

## Penemuan model (provider implisit)

Saat `VLLM_API_KEY` disetel (atau profil autentikasi ada) dan Anda **tidak** mendefinisikan `models.providers.vllm`, OpenClaw akan mengkueri:

```
GET http://127.0.0.1:8000/v1/models
```

dan mengonversi ID yang dikembalikan menjadi entri model.

<Note>
Jika Anda menyetel `models.providers.vllm` secara eksplisit, penemuan otomatis dilewati dan Anda harus mendefinisikan model secara manual.
</Note>

## Konfigurasi eksplisit (model manual)

Gunakan konfigurasi eksplisit saat:

- vLLM berjalan pada host atau port yang berbeda
- Anda ingin menetapkan nilai `contextWindow` atau `maxTokens`
- Server Anda memerlukan kunci API sungguhan (atau Anda ingin mengontrol header)
- Anda terhubung ke endpoint vLLM loopback tepercaya, LAN, atau Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [
          {
            id: "your-model-id",
            name: "Model vLLM Lokal",
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
  <Accordion title="Perilaku bergaya proxy">
    vLLM diperlakukan sebagai backend `/v1` yang kompatibel dengan OpenAI bergaya proxy, bukan endpoint
    OpenAI native. Ini berarti:

    | Perilaku | Diterapkan? |
    |----------|----------|
    | Pembentukan permintaan OpenAI native | Tidak |
    | `service_tier` | Tidak dikirim |
    | Respons `store` | Tidak dikirim |
    | Hint cache prompt | Tidak dikirim |
    | Pembentukan payload kompatibilitas reasoning OpenAI | Tidak diterapkan |
    | Header atribusi OpenClaw tersembunyi | Tidak disuntikkan pada URL dasar kustom |

  </Accordion>

  <Accordion title="Kontrol thinking Nemotron 3">
    vLLM/Nemotron 3 dapat menggunakan kwargs template chat untuk mengontrol apakah reasoning
    dikembalikan sebagai reasoning tersembunyi atau teks jawaban yang terlihat. Saat sesi OpenClaw
    menggunakan `vllm/nemotron-3-*` dengan thinking nonaktif, OpenClaw mengirim:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Untuk menyesuaikan nilai-nilai ini, setel `chat_template_kwargs` di bawah parameter model.
    Jika Anda juga menyetel `params.extra_body.chat_template_kwargs`, nilai tersebut memiliki
    prioritas akhir karena `extra_body` adalah override badan permintaan terakhir.

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

  <Accordion title="URL dasar kustom">
    Jika server vLLM Anda berjalan pada host atau port non-default, setel `baseUrl` dalam konfigurasi provider eksplisit:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            models: [
              {
                id: "my-custom-model",
                name: "Model vLLM Jarak Jauh",
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
  <Accordion title="Server tidak dapat dijangkau">
    Periksa bahwa server vLLM sedang berjalan dan dapat diakses:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jika Anda melihat kesalahan koneksi, verifikasi host, port, dan bahwa vLLM dimulai dengan mode server yang kompatibel dengan OpenAI.
    Untuk endpoint loopback, LAN, atau Tailscale yang eksplisit, setel juga
    `models.providers.vllm.request.allowPrivateNetwork: true`; permintaan provider
    memblokir URL jaringan privat secara default kecuali provider tersebut
    secara eksplisit dipercaya.

  </Accordion>

  <Accordion title="Kesalahan autentikasi pada permintaan">
    Jika permintaan gagal dengan kesalahan autentikasi, setel `VLLM_API_KEY` sungguhan yang cocok dengan konfigurasi server Anda, atau konfigurasikan provider secara eksplisit di bawah `models.providers.vllm`.

    <Tip>
    Jika server vLLM Anda tidak menerapkan autentikasi, nilai non-kosong apa pun untuk `VLLM_API_KEY` berfungsi sebagai sinyal opt-in untuk OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Tidak ada model yang ditemukan">
    Penemuan otomatis memerlukan `VLLM_API_KEY` untuk disetel **dan** tidak ada entri konfigurasi `models.providers.vllm` yang eksplisit. Jika Anda telah mendefinisikan provider secara manual, OpenClaw melewati penemuan dan hanya menggunakan model yang Anda deklarasikan.
  </Accordion>
</AccordionGroup>

<Warning>
Bantuan lebih lanjut: [Pemecahan masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="OpenAI" href="/id/providers/openai" icon="bolt">
    Provider OpenAI native dan perilaku rute yang kompatibel dengan OpenAI.
  </Card>
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan ulang kredensial.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan cara mengatasinya.
  </Card>
</CardGroup>
