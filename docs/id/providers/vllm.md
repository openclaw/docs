---
read_when:
    - Anda ingin menjalankan OpenClaw terhadap server vLLM lokal
    - Anda menginginkan endpoint /v1 yang kompatibel dengan OpenAI dengan model Anda sendiri
summary: Jalankan OpenClaw dengan vLLM (server lokal yang kompatibel dengan OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:08:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM dapat menyajikan model sumber terbuka (dan beberapa model kustom) melalui API HTTP yang **kompatibel dengan OpenAI**. OpenClaw terhubung ke vLLM menggunakan API `openai-completions`.

OpenClaw juga dapat **menemukan otomatis** model yang tersedia dari vLLM saat Anda ikut serta dengan `VLLM_API_KEY` (nilai apa pun berfungsi jika server Anda tidak memberlakukan autentikasi). Gunakan `vllm/*` di `agents.defaults.models` agar penemuan tetap dinamis saat Anda juga mengonfigurasi URL dasar vLLM kustom.

OpenClaw memperlakukan `vllm` sebagai penyedia lokal yang kompatibel dengan OpenAI dan mendukung
akuntansi penggunaan streaming, sehingga jumlah token status/konteks dapat diperbarui dari
respons `stream_options.include_usage`.

| Properti         | Nilai                                    |
| ---------------- | ---------------------------------------- |
| ID Penyedia      | `vllm`                                   |
| API              | `openai-completions` (kompatibel dengan OpenAI) |
| Autentikasi      | variabel lingkungan `VLLM_API_KEY`      |
| URL dasar default | `http://127.0.0.1:8000/v1`               |

## Memulai

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    URL dasar Anda harus mengekspos endpoint `/v1` (misalnya `/v1/models`, `/v1/chat/completions`). vLLM umumnya berjalan di:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Nilai apa pun berfungsi jika server Anda tidak memberlakukan autentikasi:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Penemuan model (penyedia implisit)

Saat `VLLM_API_KEY` ditetapkan (atau profil autentikasi ada) dan Anda **tidak** mendefinisikan `models.providers.vllm`, OpenClaw mengkueri:

```
GET http://127.0.0.1:8000/v1/models
```

dan mengonversi ID yang dikembalikan menjadi entri model.

<Note>
Jika Anda menetapkan `models.providers.vllm` secara eksplisit, OpenClaw menggunakan model yang Anda deklarasikan secara default. Tambahkan `"vllm/*": {}` ke `agents.defaults.models` saat Anda ingin OpenClaw mengkueri endpoint `/models` penyedia yang dikonfigurasi tersebut dan menyertakan semua model vLLM yang diiklankan.
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

Agar penyedia ini tetap dinamis tanpa mencantumkan setiap model secara manual, tambahkan wildcard
penyedia ke katalog model yang terlihat:

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
  <Accordion title="Proxy-style behavior">
    vLLM diperlakukan sebagai backend `/v1` bergaya proxy yang kompatibel dengan OpenAI, bukan endpoint
    OpenAI native. Artinya:

    | Perilaku | Diterapkan? |
    |----------|----------|
    | Pembentukan permintaan OpenAI native | Tidak |
    | `service_tier` | Tidak dikirim |
    | Responses `store` | Tidak dikirim |
    | Petunjuk cache prompt | Tidak dikirim |
    | Pembentukan payload kompatibilitas penalaran OpenAI | Tidak diterapkan |
    | Header atribusi OpenClaw tersembunyi | Tidak disuntikkan pada URL dasar kustom |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Untuk model Qwen yang disajikan melalui vLLM, tetapkan
    `compat.thinkingFormat: "qwen-chat-template"` pada baris model penyedia
    yang dikonfigurasi saat server mengharapkan kwargs templat chat Qwen. Model
    yang dikonfigurasi dengan cara ini mengekspos profil `/think` biner (`off`, `on`) karena
    pemikiran templat Qwen adalah flag permintaan aktif/nonaktif, bukan tangga upaya
    bergaya OpenAI.

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

    OpenClaw memetakan `/think off` ke:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Tingkat pemikiran selain `off` mengirim `enable_thinking: true`. Jika endpoint Anda
    mengharapkan flag tingkat atas bergaya DashScope, gunakan
    `compat.thinkingFormat: "qwen"` untuk mengirim `enable_thinking` di root
    permintaan.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3 dapat menggunakan kwargs templat chat untuk mengontrol apakah penalaran
    dikembalikan sebagai penalaran tersembunyi atau teks jawaban yang terlihat. Saat sesi OpenClaw
    menggunakan `vllm/nemotron-3-*` dengan pemikiran nonaktif, Plugin vLLM bawaan mengirim:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Untuk menyesuaikan nilai-nilai ini, tetapkan `chat_template_kwargs` di bawah parameter model.
    Jika Anda juga menetapkan `params.extra_body.chat_template_kwargs`, nilai tersebut memiliki
    prioritas akhir karena `extra_body` adalah override isi permintaan terakhir.

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
    Pertama, pastikan vLLM dimulai dengan parser panggilan alat dan template chat
    yang tepat untuk model. Misalnya, vLLM mendokumentasikan `hermes` untuk model
    Qwen2.5 dan `qwen3_xml` untuk model Qwen3-Coder.

    Gejala:

    - Skills atau alat tidak pernah berjalan
    - asisten mencetak JSON/XML mentah seperti `{"name":"read","arguments":...}`
    - vLLM mengembalikan array `tool_calls` kosong saat OpenClaw mengirim
      `tool_choice: "auto"`

    Beberapa kombinasi Qwen/vLLM mengembalikan panggilan alat terstruktur hanya saat
    permintaan menggunakan `tool_choice: "required"`. Untuk entri model tersebut, paksa
    kolom permintaan yang kompatibel dengan OpenAI menggunakan `params.extra_body`:

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

    Ini adalah solusi kompatibilitas yang bersifat opt-in. Solusi ini membuat setiap giliran model dengan
    alat mewajibkan panggilan alat, jadi gunakan hanya untuk entri model lokal khusus
    ketika perilaku tersebut dapat diterima. Jangan gunakan sebagai default global untuk semua
    model vLLM, dan jangan gunakan proxy yang secara membabi buta mengonversi
    teks asisten sembarang menjadi panggilan alat yang dapat dieksekusi.

  </Accordion>

  <Accordion title="URL dasar kustom">
    Jika server vLLM Anda berjalan pada host atau port non-default, tetapkan `baseUrl` dalam konfigurasi penyedia eksplisit:

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

## Pemecahan Masalah

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
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` hanya berlaku untuk permintaan HTTP model vLLM, termasuk
    penyiapan koneksi, header respons, streaming isi, dan total
    pembatalan guarded-fetch. Utamakan ini sebelum meningkatkan
    `agents.defaults.timeoutSeconds`, yang mengontrol seluruh proses agen.

  </Accordion>

  <Accordion title="Server tidak dapat dijangkau">
    Periksa bahwa server vLLM berjalan dan dapat diakses:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jika Anda melihat kesalahan koneksi, verifikasi host, port, dan bahwa vLLM dimulai dengan mode server yang kompatibel dengan OpenAI.
    Untuk endpoint loopback eksplisit, LAN, atau Tailscale, OpenClaw memercayai
    origin `models.providers.vllm.baseUrl` yang dikonfigurasi persis untuk permintaan model
    yang dijaga. Origin metadata/link-local tetap diblokir tanpa
    opt-in eksplisit. Tetapkan `models.providers.vllm.request.allowPrivateNetwork: true` hanya
    saat permintaan vLLM harus menjangkau origin privat lain, dan tetapkan ke `false`
    untuk keluar dari kepercayaan origin persis.

  </Accordion>

  <Accordion title="Kesalahan autentikasi pada permintaan">
    Jika permintaan gagal dengan kesalahan autentikasi, tetapkan `VLLM_API_KEY` nyata yang cocok dengan konfigurasi server Anda, atau konfigurasikan penyedia secara eksplisit di bawah `models.providers.vllm`.

    <Tip>
    Jika server vLLM Anda tidak memberlakukan autentikasi, nilai non-kosong apa pun untuk `VLLM_API_KEY` berfungsi sebagai sinyal opt-in untuk OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Tidak ada model yang ditemukan">
    Penemuan otomatis mengharuskan `VLLM_API_KEY` ditetapkan. Jika Anda telah mendefinisikan `models.providers.vllm`, OpenClaw hanya menggunakan model yang Anda deklarasikan kecuali `agents.defaults.models` menyertakan `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Alat dirender sebagai teks mentah">
    Jika model Qwen mencetak sintaks alat JSON/XML alih-alih menjalankan skill,
    periksa panduan Qwen dalam Konfigurasi lanjutan di atas. Perbaikan biasanya adalah:

    - mulai vLLM dengan parser/template yang benar untuk model tersebut
    - konfirmasi id model persis dengan `openclaw models list --provider vllm`
    - tambahkan override khusus per model `params.extra_body.tool_choice: "required"`
      hanya jika `tool_choice: "auto"` masih mengembalikan panggilan alat kosong atau hanya teks

  </Accordion>
</AccordionGroup>

<Warning>
Bantuan lainnya: [Pemecahan Masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku alih gagal.
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
