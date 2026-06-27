---
read_when:
    - Anda menginginkan penyiapan Moonshot K2 (Moonshot Open Platform) vs Kimi Coding
    - Anda perlu memahami endpoint, kunci, dan referensi model yang terpisah
    - Anda menginginkan konfigurasi salin/tempel untuk salah satu provider
summary: Konfigurasikan Moonshot K2 vs Kimi Coding (penyedia + kunci terpisah)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:05:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot menyediakan Kimi API dengan endpoint yang kompatibel dengan OpenAI. Konfigurasikan
penyedia dan tetapkan model default ke `moonshot/kimi-k2.6`, atau gunakan
Kimi Coding dengan `kimi/kimi-for-coding`.

<Warning>
Moonshot dan Kimi Coding adalah **penyedia terpisah**. Kunci tidak dapat dipertukarkan, endpoint berbeda, dan referensi model berbeda (`moonshot/...` vs `kimi/...`).
</Warning>

## Katalog model bawaan

[//]: # "moonshot-kimi-k2-ids:start"

| Referensi model                   | Nama                   | Penalaran    | Input        | Konteks | Output maks |
| --------------------------------- | ---------------------- | ------------ | ------------ | ------- | ----------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Tidak        | teks, gambar | 262,144 | 262,144     |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Selalu aktif | teks, gambar | 262,144 | 262,144     |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Tidak        | teks, gambar | 262,144 | 262,144     |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ya           | teks         | 262,144 | 262,144     |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ya           | teks         | 262,144 | 262,144     |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Tidak        | teks         | 256,000 | 16,384      |

[//]: # "moonshot-kimi-k2-ids:end"

Estimasi biaya katalog untuk model K2 saat ini yang di-host Moonshot menggunakan tarif
bayar sesuai pemakaian yang diterbitkan Moonshot: Kimi K2.7 Code adalah $0.19/MTok cache hit,
$0.95/MTok input, dan $4.00/MTok output; Kimi K2.6 adalah $0.16/MTok cache hit,
$0.95/MTok input, dan $4.00/MTok output; Kimi K2.5 adalah $0.10/MTok cache hit,
$0.60/MTok input, dan $3.00/MTok output. Entri katalog lama lainnya mempertahankan
placeholder tanpa biaya kecuali Anda menimpanya di konfigurasi.

Kimi K2.7 Code selalu menggunakan thinking native. OpenClaw hanya mengekspos status thinking `on`
untuk model ini dan menghilangkan kontrol keluar `thinking` dan
`reasoning_effort`, seperti yang diwajibkan Moonshot. OpenClaw juga menghilangkan
override sampling yang dikunci K2.7 ke default penyedia. Kimi K2.6 tetap menjadi
default onboarding.

## Memulai

Pilih penyedia Anda dan ikuti langkah penyiapan.

<Tabs>
  <Tab title="Moonshot API">
    **Terbaik untuk:** model Kimi K2 melalui Moonshot Open Platform.

    <Steps>
      <Step title="Choose your endpoint region">
        | Pilihan auth          | Endpoint                       | Wilayah       |
        | --------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`    | `https://api.moonshot.ai/v1`   | Internasional |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1`   | Tiongkok      |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Atau untuk endpoint Tiongkok:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        Gunakan direktori state terisolasi saat Anda ingin memverifikasi akses model dan pelacakan
        biaya tanpa menyentuh sesi normal Anda:

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
        token yang dinormalisasi ditambah estimasi biaya di bawah `usage.cost` saat Moonshot mengembalikan
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
    Instal plugin resmi, lalu mulai ulang Gateway:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **Terbaik untuk:** tugas yang berfokus pada kode melalui endpoint Kimi Coding.

    <Note>
    Kimi Coding menggunakan kunci API dan prefiks penyedia yang berbeda (`kimi/...`) dari Moonshot (`moonshot/...`). Referensi model API stabil adalah `kimi/kimi-for-coding`; referensi lama `kimi/kimi-code` dan `kimi/k2p5` tetap diterima dan dinormalisasi ke ID model API tersebut.
    </Note>

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
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
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    Pilih **Kimi** di bagian pencarian web untuk menyimpan
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configure the web search region and model">
    Penyiapan interaktif meminta:

    | Pengaturan          | Opsi                                                                 |
    | ------------------- | -------------------------------------------------------------------- |
    | Wilayah API         | `https://api.moonshot.ai/v1` (internasional) atau `https://api.moonshot.cn/v1` (Tiongkok) |
    | Model pencarian web | Default ke `kimi-k2.6`                                               |

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
  <Accordion title="Native thinking mode">
    Kimi K2.7 Code selalu menggunakan mode thinking native. Moonshot mewajibkan klien untuk
    menghilangkan field `thinking` untuk model ini, sehingga OpenClaw hanya mengekspos `on` dan
    mengabaikan pengaturan `off` yang usang. K2.7 juga mengunci `temperature`, `top_p`, `n`,
    `presence_penalty`, dan `frequency_penalty`; OpenClaw menghilangkan override yang dikonfigurasi
    untuk field tersebut.

    Model Moonshot Kimi lainnya mendukung thinking native biner:

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

    OpenClaw memetakan level `/think` runtime untuk model tersebut:

    | Level `/think`      | Perilaku Moonshot        |
    | ------------------- | ------------------------ |
    | `/think off`        | `thinking.type=disabled` |
    | Level non-off apa pun | `thinking.type=enabled`  |

    <Warning>
    Saat thinking Moonshot diaktifkan, `tool_choice` harus berupa `auto` atau `none`. OpenClaw menormalisasi nilai yang tidak kompatibel menjadi `auto`. Ini termasuk Kimi K2.7 Code, yang mode thinking-nya tidak dapat dinonaktifkan untuk mempertahankan pilihan alat yang dipasangi pin.
    </Warning>

    Kimi K2.6 juga menerima field opsional `thinking.keep` yang mengontrol
    retensi multi-giliran untuk `reasoning_content`. Atur ke `"all"` untuk mempertahankan
    reasoning lengkap di seluruh giliran; hilangkan (atau biarkan `null`) untuk menggunakan strategi
    default server. OpenClaw hanya meneruskan `thinking.keep` untuk
    `moonshot/kimi-k2.6` dan menghapusnya dari model lain. Kimi K2.7 Code
    mempertahankan riwayat reasoning lengkap secara default sementara OpenClaw menghilangkan seluruh
    field `thinking`.

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

  <Accordion title="Sanitisasi id panggilan tool">
    Moonshot Kimi menyajikan id `tool_call` native berbentuk `functions.<name>:<index>`. Untuk transport OpenAI-completions, OpenClaw mempertahankan kemunculan pertama dari setiap id Kimi native dan menulis ulang duplikat berikutnya menjadi id `call_*` bergaya OpenAI yang deterministik. Hasil tool yang cocok dipetakan ulang dengan id yang sama sehingga replay tetap unik tanpa menghapus id native pertama Kimi.

    Untuk memaksakan sanitisasi ketat pada penyedia kustom yang kompatibel dengan OpenAI, atur `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Kompatibilitas penggunaan streaming">
    Endpoint Moonshot native (`https://api.moonshot.ai/v1` dan
    `https://api.moonshot.cn/v1`) menyatakan kompatibilitas penggunaan streaming pada
    transport `openai-completions` bersama. OpenClaw menentukannya berdasarkan
    kapabilitas endpoint, sehingga id penyedia kustom yang kompatibel dan menargetkan host
    Moonshot native yang sama mewarisi perilaku penggunaan streaming yang sama.

    Dengan harga K2.6 katalog, penggunaan streaming yang menyertakan token input, output,
    dan cache-read juga dikonversi menjadi estimasi biaya USD lokal untuk
    `/status`, `/usage full`, `/usage cost`, dan akuntansi sesi berbasis transkrip.

  </Accordion>

  <Accordion title="Referensi endpoint dan model ref">
    | Penyedia   | Prefiks model ref | Endpoint                      | Variabel env auth        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Endpoint Kimi Coding          | `KIMI_API_KEY`      |
    | Pencarian web | N/A              | Sama dengan wilayah Moonshot API   | `KIMI_API_KEY` atau `MOONSHOT_API_KEY` |

    - Pencarian web Kimi menggunakan `KIMI_API_KEY` atau `MOONSHOT_API_KEY`, dan default ke `https://api.moonshot.ai/v1` dengan model `kimi-k2.6`.
    - Timpa harga dan metadata konteks di `models.providers` jika diperlukan.
    - Jika Moonshot menerbitkan batas konteks berbeda untuk suatu model, sesuaikan `contextWindow`.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, model ref, dan perilaku failover.
  </Card>
  <Card title="Pencarian web" href="/id/tools/web" icon="magnifying-glass">
    Mengonfigurasi penyedia pencarian web termasuk Kimi.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap untuk penyedia, model, dan plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Manajemen kunci Moonshot API dan dokumentasi.
  </Card>
</CardGroup>
