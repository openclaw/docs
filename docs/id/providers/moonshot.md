---
read_when:
    - Anda ingin menyiapkan Moonshot K2 (Moonshot Open Platform) dibandingkan dengan Kimi Coding
    - Anda perlu memahami endpoint, kunci, dan referensi model yang terpisah
    - Anda menginginkan konfigurasi yang dapat disalin dan ditempel untuk salah satu penyedia
summary: Konfigurasikan Moonshot K2 vs Kimi Coding (penyedia + kunci terpisah)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T14:37:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot menyediakan API Kimi dengan endpoint yang kompatibel dengan OpenAI. Tetapkan
model default ke `moonshot/kimi-k2.6` untuk Moonshot Open Platform, atau
`kimi/kimi-for-coding` untuk Kimi Coding.

<Warning>
Moonshot dan Kimi Coding adalah **penyedia terpisah**, masing-masing didistribusikan sebagai plugin eksternal tersendiri. Kunci tidak dapat dipertukarkan, endpoint berbeda, dan referensi model berbeda (`moonshot/...` dibandingkan dengan `kimi/...`).
</Warning>

## Katalog model bawaan

[//]: # "moonshot-kimi-k2-ids:start"

| Referensi model                    | Nama                   | Penalaran     | Masukan      | Konteks | Keluaran maks. |
| ---------------------------------- | ---------------------- | ------------- | ------------ | ------- | -------------- |
| `moonshot/kimi-k2.6`               | Kimi K2.6              | Tidak         | teks, gambar | 262,144 | 262,144        |
| `moonshot/kimi-k2.7-code`          | Kimi K2.7 Code         | Selalu aktif | teks, gambar | 262,144 | 262,144        |
| `moonshot/kimi-k2.5`               | Kimi K2.5              | Tidak         | teks, gambar | 262,144 | 262,144        |
| `moonshot/kimi-k2-thinking`        | Kimi K2 Thinking       | Ya            | teks         | 262,144 | 262,144        |
| `moonshot/kimi-k2-thinking-turbo`  | Kimi K2 Thinking Turbo | Ya            | teks         | 262,144 | 262,144        |
| `moonshot/kimi-k2-turbo`           | Kimi K2 Turbo          | Tidak         | teks         | 256,000 | 16,384         |

[//]: # "moonshot-kimi-k2-ids:end"

Estimasi biaya katalog menggunakan tarif bayar sesuai pemakaian yang dipublikasikan Moonshot: Kimi
K2.7 Code adalah $0.19/MTok untuk cache hit, $0.95/MTok untuk masukan, $4.00/MTok untuk keluaran; Kimi
K2.6 adalah $0.16/MTok untuk cache hit, $0.95/MTok untuk masukan, $4.00/MTok untuk keluaran; Kimi K2.5
adalah $0.10/MTok untuk cache hit, $0.60/MTok untuk masukan, $3.00/MTok untuk keluaran. Entri katalog
lainnya tetap menggunakan nilai sementara biaya nol, kecuali Anda menimpanya dalam konfigurasi.

Kimi K2.7 Code selalu menggunakan mode berpikir native. OpenClaw hanya menyediakan status berpikir `on`
untuk model ini dan menghilangkan bidang `thinking` serta
`reasoning_effort` dari permintaan keluar, sebagaimana diwajibkan oleh Moonshot. OpenClaw juga menghilangkan
penimpaan pengambilan sampel (`temperature`, `top_p`, `n`, `presence_penalty`,
`frequency_penalty`), yang ditetapkan K2.7 ke nilai default penyedia. Kimi K2.6 tetap menjadi
model default untuk orientasi awal.

## Memulai

Moonshot dan Kimi Coding sama-sama merupakan plugin eksternal—instal salah satunya sebelum
melakukan orientasi awal.

<Tabs>
  <Tab title="Moonshot API">
    **Paling cocok untuk:** model Kimi K2 melalui Moonshot Open Platform.

    <Steps>
      <Step title="Instal plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Pilih wilayah endpoint Anda">
        | Pilihan autentikasi     | Endpoint                       | Wilayah       |
        | ----------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1`   | Internasional |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1`   | Tiongkok      |
      </Step>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Atau untuk endpoint Tiongkok:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Pastikan model tersedia">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Jalankan uji cepat langsung">
        Gunakan direktori status yang terisolasi jika Anda ingin memverifikasi akses model dan
        pelacakan biaya tanpa memengaruhi sesi normal Anda:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Respons JSON seharusnya melaporkan `provider: "moonshot"` dan
        `model: "kimi-k2.6"`. Entri transkrip asisten menyimpan penggunaan
        token yang telah dinormalisasi beserta estimasi biaya di bawah `usage.cost` ketika Moonshot mengembalikan
        metadata penggunaan.
      </Step>
    </Steps>

    ### Contoh konfigurasi

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
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
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Paling cocok untuk:** tugas yang berfokus pada kode melalui endpoint Kimi Coding.

    <Note>
    Kimi Coding menggunakan kunci API dan prefiks penyedia (`kimi/...`) yang berbeda dari Moonshot (`moonshot/...`). Referensi model stabilnya adalah `kimi/kimi-for-coding`; referensi lama `kimi/kimi-code` dan `kimi/k2p5` tetap diterima dan dinormalisasi ke ID model tersebut.
    </Note>

    <Steps>
      <Step title="Instal plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Pastikan model tersedia">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Contoh konfigurasi

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Pencarian web Kimi

Plugin Moonshot juga mendaftarkan **Kimi** sebagai penyedia `web_search`, yang didukung oleh pencarian web Moonshot.

<Steps>
  <Step title="Jalankan penyiapan pencarian web interaktif">
    ```bash
    openclaw configure --section web
    ```

    Pilih **Kimi** di bagian pencarian web untuk menyimpan
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Konfigurasikan wilayah dan model pencarian web">
    Penyiapan interaktif meminta:

    | Pengaturan          | Opsi                                                                  |
    | ------------------- | --------------------------------------------------------------------- |
    | Wilayah API         | `https://api.moonshot.ai/v1` (internasional) atau `https://api.moonshot.cn/v1` (Tiongkok) |
    | Model pencarian web | Defaultnya adalah `kimi-k2.6`                                         |

  </Step>
</Steps>

Konfigurasi berada di bawah `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode berpikir native">
    Kimi K2.7 Code selalu menggunakan mode berpikir native. Moonshot mewajibkan klien untuk
    menghilangkan bidang `thinking` bagi model ini, sehingga OpenClaw hanya menyediakan `on` dan
    mengabaikan pengaturan `off` yang kedaluwarsa. K2.7 juga menetapkan `temperature`, `top_p`, `n`,
    `presence_penalty`, dan `frequency_penalty`; OpenClaw menghilangkan penimpaan yang dikonfigurasi
    untuk bidang-bidang tersebut.

    Model Moonshot Kimi lainnya mendukung mode berpikir native biner:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Konfigurasikan per model melalui `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw memetakan tingkat `/think` saat runtime untuk model-model tersebut:

    | Tingkat `/think`          | Perilaku Moonshot          |
    | ------------------------ | -------------------------- |
    | `/think off`             | `thinking.type=disabled`   |
    | Tingkat selain `off`     | `thinking.type=enabled`    |

    <Warning>
    Saat mode berpikir Moonshot diaktifkan, `tool_choice` harus berupa `auto` atau `none`. Pilihan alat yang ditetapkan (`type: "tool"` atau `type: "function"`) akan memaksa mode berpikir kembali menjadi `disabled`, sehingga alat yang diminta tetap dijalankan; sebagai gantinya, `tool_choice: "required"` dinormalisasi menjadi `auto`. Hal ini berlaku untuk setiap model Moonshot kecuali Kimi K2.7 Code, yang mode berpikirnya tidak dapat dinonaktifkan—`tool_choice` miliknya dinormalisasi menjadi `auto` jika tidak kompatibel.
    </Warning>

    Kimi K2.6 juga menerima bidang opsional `thinking.keep` yang mengontrol
    retensi `reasoning_content` dalam beberapa giliran. Atur ke `"all"` untuk mempertahankan
    penalaran lengkap di seluruh giliran; hilangkan bidang ini (atau biarkan bernilai `null`) untuk menggunakan
    strategi bawaan server. OpenClaw hanya meneruskan `thinking.keep` untuk
    `moonshot/kimi-k2.6` dan menghapusnya dari model lain. Kimi K2.7 Code
    mempertahankan riwayat penalaran lengkap secara bawaan, sementara OpenClaw menghilangkan seluruh
    bidang `thinking`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Tool call id sanitization">
    Moonshot Kimi menyediakan id tool_call native dengan format `functions.<name>:<index>`. OpenClaw mempertahankan kemunculan pertama setiap id Kimi native dan menulis ulang duplikat berikutnya menjadi id `call_*` bergaya OpenAI yang deterministik. Hasil alat yang cocok dipetakan ulang dengan id yang sama agar pemutaran ulang tetap unik tanpa menghapus id native pertama Kimi. Perilaku ini terintegrasi ke dalam penyedia Moonshot bawaan dan bukan merupakan pengaturan yang dapat dikonfigurasi pengguna.
  </Accordion>

  <Accordion title="Streaming usage compatibility">
    Endpoint native Moonshot (`https://api.moonshot.ai/v1` dan
    `https://api.moonshot.cn/v1`) menyatakan kompatibilitas penggunaan streaming.
    OpenClaw menentukannya berdasarkan host endpoint, bukan id penyedia, sehingga id
    penyedia khusus yang diarahkan ke host native Moonshot yang sama mewarisi
    perilaku penggunaan streaming yang sama.

    Dengan harga K2.6 dalam katalog, penggunaan streaming yang mencakup token masukan,
    keluaran, dan pembacaan cache juga dikonversi menjadi perkiraan biaya USD lokal untuk
    `/status`, `/usage full`, `/usage cost`, dan penghitungan sesi
    berbasis transkrip.

  </Accordion>

  <Accordion title="Endpoint and model ref reference">
    | Penyedia   | Awalan referensi model | Endpoint                      | Variabel lingkungan autentikasi |
    | ---------- | ----------------------- | ----------------------------- | ------------------------------- |
    | Moonshot   | `moonshot/`             | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`              |
    | Moonshot CN| `moonshot/`             | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`              |
    | Kimi Coding| `kimi/`                 | Endpoint Kimi Coding          | `KIMI_API_KEY`                  |
    | Pencarian web | Tidak berlaku        | Sama dengan wilayah API Moonshot | `KIMI_API_KEY` atau `MOONSHOT_API_KEY` |

    - Pencarian web Kimi menggunakan `KIMI_API_KEY` atau `MOONSHOT_API_KEY`, dan secara bawaan menggunakan `https://api.moonshot.ai/v1` dengan model `kimi-k2.6`.
    - Timpa metadata harga dan konteks di `models.providers` jika diperlukan.
    - Jika Moonshot memublikasikan batas konteks yang berbeda untuk suatu model, sesuaikan `contextWindow` sebagaimana mestinya.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku pengalihan saat gagal.
  </Card>
  <Card title="Web search" href="/id/tools/web" icon="magnifying-glass">
    Mengonfigurasi penyedia pencarian web, termasuk Kimi.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap untuk penyedia, model, dan plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Pengelolaan kunci API Moonshot dan dokumentasi.
  </Card>
</CardGroup>
