---
read_when:
    - Anda menginginkan penyiapan Moonshot K2 (Moonshot Open Platform) vs Kimi Coding
    - Anda perlu memahami endpoint, key, dan ref model yang terpisah
    - Anda menginginkan konfigurasi salin-tempel untuk salah satu provider
summary: Konfigurasikan Moonshot K2 vs Kimi Coding (provider + key terpisah)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-24T09:24:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f9b833110aebc47f9f1f832ade48a2f13b269abd72a7ea2766ffb3af449feb9
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot menyediakan API Kimi dengan endpoint yang kompatibel dengan OpenAI. Konfigurasikan
provider dan setel model default ke `moonshot/kimi-k2.6`, atau gunakan
Kimi Coding dengan `kimi/kimi-code`.

<Warning>
Moonshot dan Kimi Coding adalah **provider yang terpisah**. Key tidak dapat saling dipertukarkan, endpoint berbeda, dan ref model berbeda (`moonshot/...` vs `kimi/...`).
</Warning>

## Katalog model bawaan

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Name                   | Reasoning | Input       | Context | Max output |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Tidak     | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Tidak     | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ya        | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ya        | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Tidak     | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

Perkiraan biaya bundled untuk model K2 yang saat ini di-host Moonshot menggunakan tarif pay-as-you-go yang dipublikasikan Moonshot: Kimi K2.6 adalah $0.16/MTok cache hit,
$0.95/MTok input, dan $4.00/MTok output; Kimi K2.5 adalah $0.10/MTok cache hit,
$0.60/MTok input, dan $3.00/MTok output. Entri katalog lama lainnya mempertahankan
placeholder biaya nol kecuali Anda menimpanya di konfigurasi.

## Memulai

Pilih provider Anda dan ikuti langkah-langkah penyiapannya.

<Tabs>
  <Tab title="Moonshot API">
    **Terbaik untuk:** model Kimi K2 melalui Moonshot Open Platform.

    <Steps>
      <Step title="Pilih region endpoint Anda">
        | Auth choice            | Endpoint                       | Region        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Internasional |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Tiongkok      |
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Atau untuk endpoint Tiongkok:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Setel model default">
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
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Jalankan smoke test live">
        Gunakan direktori status terisolasi saat Anda ingin memverifikasi akses model dan pelacakan biaya tanpa menyentuh sesi normal Anda:

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
        token yang dinormalkan plus perkiraan biaya di bawah `usage.cost` saat Moonshot mengembalikan metadata penggunaan.
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
    **Terbaik untuk:** tugas yang berfokus pada kode melalui endpoint Kimi Coding.

    <Note>
    Kimi Coding menggunakan API key dan prefiks provider yang berbeda (`kimi/...`) dibanding Moonshot (`moonshot/...`). Ref model lama `kimi/k2p5` tetap diterima sebagai id kompatibilitas.
    </Note>

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Setel model default">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
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
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi web search

OpenClaw juga menyertakan **Kimi** sebagai provider `web_search`, didukung oleh web
search Moonshot.

<Steps>
  <Step title="Jalankan penyiapan web search interaktif">
    ```bash
    openclaw configure --section web
    ```

    Pilih **Kimi** di bagian web-search untuk menyimpan
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Konfigurasikan region web search dan model">
    Penyiapan interaktif meminta:

    | Setting             | Options                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | API region          | `https://api.moonshot.ai/v1` (internasional) atau `https://api.moonshot.cn/v1` (Tiongkok) |
    | Model web search    | Default ke `kimi-k2.6`                                               |

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
            apiKey: "sk-...", // atau gunakan KIMI_API_KEY / MOONSHOT_API_KEY
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
  <Accordion title="Mode thinking native">
    Moonshot Kimi mendukung thinking native biner:

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

    OpenClaw juga memetakan level runtime `/think` untuk Moonshot:

    | Level `/think`      | Perilaku Moonshot           |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Level non-off apa pun | `thinking.type=enabled`   |

    <Warning>
    Saat Moonshot thinking diaktifkan, `tool_choice` harus `auto` atau `none`. OpenClaw menormalkan nilai `tool_choice` yang tidak kompatibel menjadi `auto` demi kompatibilitas.
    </Warning>

    Kimi K2.6 juga menerima field opsional `thinking.keep` yang mengontrol
    retensi multi-giliran untuk `reasoning_content`. Setel ke `"all"` untuk menyimpan reasoning penuh
    di seluruh giliran; hilangkan (atau biarkan `null`) untuk menggunakan strategi
    default server. OpenClaw hanya meneruskan `thinking.keep` untuk
    `moonshot/kimi-k2.6` dan menghapusnya dari model lain.

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

  <Accordion title="Sanitasi id tool call">
    Moonshot Kimi menyajikan id tool_call berbentuk `functions.<name>:<index>`. OpenClaw mempertahankannya tanpa perubahan agar tool call multi-giliran tetap berfungsi.

    Untuk memaksa sanitasi ketat pada provider OpenAI-compatible kustom, setel `sanitizeToolCallIds: true`:

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
    `https://api.moonshot.cn/v1`) mengiklankan kompatibilitas penggunaan streaming pada
    transport `openai-completions` bersama. OpenClaw mengaitkan itu dengan kapabilitas
    endpoint, sehingga provider id kustom yang kompatibel dan menargetkan host
    Moonshot native yang sama mewarisi perilaku streaming-usage yang sama.

    Dengan harga bundled K2.6, penggunaan streaming yang mencakup token input, output,
    dan cache-read juga dikonversi menjadi perkiraan biaya USD lokal untuk
    `/status`, `/usage full`, `/usage cost`, dan akuntansi sesi
    berbasis transkrip.

  </Accordion>

  <Accordion title="Referensi endpoint dan ref model">
    | Provider    | Prefix ref model | Endpoint                      | Auth env var        |
    | ----------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot    | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN | `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding | `kimi/`          | Endpoint Kimi Coding          | `KIMI_API_KEY`      |
    | Web search  | N/A              | Sama seperti region API Moonshot | `KIMI_API_KEY` atau `MOONSHOT_API_KEY` |

    - Kimi web search menggunakan `KIMI_API_KEY` atau `MOONSHOT_API_KEY`, dan default ke `https://api.moonshot.ai/v1` dengan model `kimi-k2.6`.
    - Timpa metadata harga dan konteks di `models.providers` jika diperlukan.
    - Jika Moonshot menerbitkan batas konteks yang berbeda untuk suatu model, sesuaikan `contextWindow` sebagaimana mestinya.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Web search" href="/id/tools/web" icon="magnifying-glass">
    Mengonfigurasi provider web search termasuk Kimi.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap untuk provider, model, dan Plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Pengelolaan API key dan dokumentasi Moonshot.
  </Card>
</CardGroup>
