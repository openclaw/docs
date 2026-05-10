---
read_when:
    - Anda menginginkan penyiapan Moonshot K2 (Moonshot Open Platform) dibandingkan Kimi Coding
    - Anda perlu memahami endpoint, kunci, dan referensi model yang terpisah
    - Anda menginginkan konfigurasi salin/tempel untuk salah satu penyedia
summary: Konfigurasikan Moonshot K2 vs Kimi Coding (penyedia + kunci terpisah)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
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

| Referensi model                   | Nama                   | Penalaran | Masukan      | Konteks | Output maks |
| --------------------------------- | ---------------------- | --------- | ------------ | ------- | ----------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Tidak     | teks, gambar | 262,144 | 262,144     |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Tidak     | teks, gambar | 262,144 | 262,144     |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ya        | teks         | 262,144 | 262,144     |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ya        | teks         | 262,144 | 262,144     |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Tidak     | teks         | 256,000 | 16,384      |

[//]: # "moonshot-kimi-k2-ids:end"

Estimasi biaya yang dibundel untuk model K2 saat ini yang dihosting Moonshot menggunakan tarif
bayar sesuai pemakaian yang diterbitkan Moonshot: Kimi K2.6 adalah $0.16/MTok cache hit,
$0.95/MTok input, dan $4.00/MTok output; Kimi K2.5 adalah $0.10/MTok cache hit,
$0.60/MTok input, dan $3.00/MTok output. Entri katalog lama lainnya mempertahankan
nilai pengganti biaya nol kecuali Anda menimpanya di konfigurasi.

## Memulai

Pilih penyedia Anda dan ikuti langkah penyiapannya.

<Tabs>
  <Tab title="Moonshot API">
    **Terbaik untuk:** model Kimi K2 melalui Moonshot Open Platform.

    <Steps>
      <Step title="Pilih wilayah endpoint Anda">
        | Pilihan autentikasi    | Endpoint                       | Wilayah       |
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
      <Step title="Jalankan uji smoke langsung">
        Gunakan direktori status terisolasi saat Anda ingin memverifikasi akses model dan pelacakan
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

        Respons JSON harus melaporkan `provider: "moonshot"` dan
        `model: "kimi-k2.6"`. Entri transkrip asisten menyimpan penggunaan
        token yang dinormalisasi plus estimasi biaya di bawah `usage.cost` saat Moonshot mengembalikan
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
    Kimi Coding menggunakan kunci API dan prefiks penyedia yang berbeda (`kimi/...`) dari Moonshot (`moonshot/...`). Referensi model API stabil adalah `kimi/kimi-for-coding`; referensi lama `kimi/kimi-code` dan `kimi/k2p5` tetap diterima dan dinormalisasi ke id model API tersebut.
    </Note>

    <Steps>
      <Step title="Jalankan onboarding">
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

OpenClaw juga menyertakan **Kimi** sebagai penyedia `web_search`, yang didukung oleh pencarian web Moonshot.

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

    | Pengaturan          | Opsi                                                                 |
    | ------------------- | -------------------------------------------------------------------- |
    | Wilayah API         | `https://api.moonshot.ai/v1` (internasional) atau `https://api.moonshot.cn/v1` (China) |
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
  <Accordion title="Mode berpikir native">
    Moonshot Kimi mendukung berpikir native biner:

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

    OpenClaw juga memetakan level `/think` saat berjalan untuk Moonshot:

    | level `/think`       | Perilaku Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Level apa pun selain off | `thinking.type=enabled`    |

    <Warning>
    Saat thinking Moonshot diaktifkan, `tool_choice` harus berupa `auto` atau `none`. OpenClaw menormalkan nilai `tool_choice` yang tidak kompatibel menjadi `auto` demi kompatibilitas.
    </Warning>

    Kimi K2.6 juga menerima bidang opsional `thinking.keep` yang mengontrol
    retensi multi-giliran untuk `reasoning_content`. Atur ke `"all"` untuk mempertahankan
    penalaran penuh di seluruh giliran; hilangkan (atau biarkan `null`) untuk menggunakan strategi
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

  <Accordion title="Sanitasi id panggilan alat">
    Moonshot Kimi menyajikan id tool_call berbentuk `functions.<name>:<index>`. OpenClaw mempertahankannya tanpa perubahan agar panggilan alat multi-giliran tetap berfungsi.

    Untuk memaksa sanitasi ketat pada penyedia khusus yang kompatibel dengan OpenAI, atur `sanitizeToolCallIds: true`:

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
    transport bersama `openai-completions`. OpenClaw menentukannya berdasarkan
    kemampuan endpoint, sehingga id penyedia khusus yang kompatibel yang menargetkan host
    Moonshot native yang sama mewarisi perilaku penggunaan streaming yang sama.

    Dengan harga K2.6 bawaan, penggunaan streaming yang mencakup token input, output,
    dan pembacaan cache juga dikonversi menjadi estimasi biaya USD lokal untuk
    `/status`, `/usage full`, `/usage cost`, dan akuntansi sesi berbasis transkrip.

  </Accordion>

  <Accordion title="Referensi endpoint dan ref model">
    | Penyedia   | Prefiks ref model | Endpoint                      | Variabel env autentikasi |
    | ---------- | ----------------- | ----------------------------- | ------------------------ |
    | Moonshot   | `moonshot/`       | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`       |
    | Moonshot CN| `moonshot/`       | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`       |
    | Kimi Coding| `kimi/`           | Endpoint Kimi Coding          | `KIMI_API_KEY`           |
    | Pencarian web | N/A           | Sama seperti wilayah API Moonshot | `KIMI_API_KEY` atau `MOONSHOT_API_KEY` |

    - Pencarian web Kimi menggunakan `KIMI_API_KEY` atau `MOONSHOT_API_KEY`, dan secara default menggunakan `https://api.moonshot.ai/v1` dengan model `kimi-k2.6`.
    - Timpa metadata harga dan konteks di `models.providers` jika diperlukan.
    - Jika Moonshot memublikasikan batas konteks yang berbeda untuk sebuah model, sesuaikan `contextWindow` sebagaimana mestinya.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Pencarian web" href="/id/tools/web" icon="magnifying-glass">
    Mengonfigurasi penyedia pencarian web termasuk Kimi.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap untuk penyedia, model, dan plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Pengelolaan kunci API Moonshot dan dokumentasi.
  </Card>
</CardGroup>
