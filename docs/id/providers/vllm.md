---
read_when:
    - Anda ingin menjalankan OpenClaw terhadap server vLLM lokal
    - Anda menginginkan endpoint /v1 yang kompatibel dengan OpenAI dengan model Anda sendiri
summary: Jalankan OpenClaw dengan vLLM (server lokal yang kompatibel dengan OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-24T09:25:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

vLLM dapat menyajikan model open-source (dan beberapa model kustom) melalui API HTTP **yang kompatibel dengan OpenAI**. OpenClaw terhubung ke vLLM menggunakan API `openai-completions`.

OpenClaw juga dapat **menemukan secara otomatis** model yang tersedia dari vLLM saat Anda melakukan opt-in dengan `VLLM_API_KEY` (nilai apa pun berfungsi jika server Anda tidak mewajibkan autentikasi) dan Anda tidak mendefinisikan entri `models.providers.vllm` yang eksplisit.

OpenClaw memperlakukan `vllm` sebagai penyedia lokal yang kompatibel dengan OpenAI dan mendukung
pencatatan penggunaan streaming, sehingga jumlah token status/konteks dapat diperbarui dari
respons `stream_options.include_usage`.

| Properti         | Nilai                                    |
| ---------------- | ---------------------------------------- |
| ID penyedia      | `vllm`                                   |
| API              | `openai-completions` (kompatibel dengan OpenAI) |
| Autentikasi      | variabel environment `VLLM_API_KEY`      |
| URL dasar default | `http://127.0.0.1:8000/v1`              |

## Memulai

<Steps>
  <Step title="Mulai vLLM dengan server yang kompatibel dengan OpenAI">
    URL dasar Anda harus mengekspos endpoint `/v1` (misalnya `/v1/models`, `/v1/chat/completions`). vLLM biasanya berjalan di:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Tetapkan variabel environment kunci API">
    Nilai apa pun berfungsi jika server Anda tidak mewajibkan autentikasi:

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

Saat `VLLM_API_KEY` ditetapkan (atau profil autentikasi ada) dan Anda **tidak** mendefinisikan `models.providers.vllm`, OpenClaw mengueri:

```
GET http://127.0.0.1:8000/v1/models
```

dan mengonversi ID yang dikembalikan menjadi entri model.

<Note>
Jika Anda menetapkan `models.providers.vllm` secara eksplisit, penemuan otomatis dilewati dan Anda harus mendefinisikan model secara manual.
</Note>

## Konfigurasi eksplisit (model manual)

Gunakan config eksplisit saat:

- vLLM berjalan di host atau port yang berbeda
- Anda ingin menetapkan `contextWindow` atau `maxTokens` secara tetap
- Server Anda memerlukan kunci API asli (atau Anda ingin mengontrol header)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
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
    |----------|-------------|
    | Pembentukan permintaan OpenAI native | Tidak |
    | `service_tier` | Tidak dikirim |
    | Respons `store` | Tidak dikirim |
    | Petunjuk prompt-cache | Tidak dikirim |
    | Pembentukan payload kompatibilitas reasoning OpenAI | Tidak diterapkan |
    | Header atribusi OpenClaw tersembunyi | Tidak disisipkan pada URL dasar kustom |

  </Accordion>

  <Accordion title="URL dasar kustom">
    Jika server vLLM Anda berjalan di host atau port non-default, tetapkan `baseUrl` di config penyedia eksplisit:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
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
    Periksa bahwa server vLLM berjalan dan dapat diakses:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jika Anda melihat kesalahan koneksi, verifikasi host, port, dan bahwa vLLM dimulai dengan mode server yang kompatibel dengan OpenAI.

  </Accordion>

  <Accordion title="Kesalahan autentikasi pada permintaan">
    Jika permintaan gagal dengan kesalahan autentikasi, tetapkan `VLLM_API_KEY` asli yang sesuai dengan konfigurasi server Anda, atau konfigurasikan penyedia secara eksplisit di bawah `models.providers.vllm`.

    <Tip>
    Jika server vLLM Anda tidak mewajibkan autentikasi, nilai non-kosong apa pun untuk `VLLM_API_KEY` berfungsi sebagai sinyal opt-in untuk OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Tidak ada model yang ditemukan">
    Penemuan otomatis memerlukan `VLLM_API_KEY` ditetapkan **dan** tidak ada entri config `models.providers.vllm` yang eksplisit. Jika Anda telah mendefinisikan penyedia secara manual, OpenClaw melewati penemuan dan hanya menggunakan model yang Anda deklarasikan.
  </Accordion>
</AccordionGroup>

<Warning>
Bantuan lebih lanjut: [Pemecahan Masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="OpenAI" href="/id/providers/openai" icon="bolt">
    Penyedia OpenAI native dan perilaku rute yang kompatibel dengan OpenAI.
  </Card>
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan ulang kredensial.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan cara menyelesaikannya.
  </Card>
</CardGroup>
