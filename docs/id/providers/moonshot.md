---
read_when:
    - Anda ingin menyiapkan Moonshot Kimi K3/K2 (Moonshot Open Platform) dibandingkan dengan Kimi Coding
    - Anda perlu memahami endpoint, kunci, dan referensi model yang terpisah
    - Anda menginginkan konfigurasi siap salin-tempel untuk salah satu penyedia
summary: Konfigurasikan model Moonshot Kimi vs Kimi Coding (penyedia + kunci terpisah)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-19T05:08:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a9c60d2ec13c1de48e037b6cfe7b35b2133328ba852143134521e9d56edbba8e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot menyediakan API Kimi dengan endpoint yang kompatibel dengan OpenAI. Pilih
`moonshot/kimi-k3` untuk Kimi K3, pertahankan nilai default orientasi
`moonshot/kimi-k2.6`, atau gunakan `kimi/kimi-for-coding` untuk Kimi Coding.

<Warning>
Moonshot dan Kimi Coding adalah **penyedia terpisah**, masing-masing didistribusikan sebagai plugin eksternal yang terpisah. Kunci tidak dapat dipertukarkan, endpoint berbeda, dan referensi model berbeda (`moonshot/...` vs `kimi/...`).
</Warning>

## Katalog model bawaan

[//]: # "moonshot-kimi-k2-ids:start"

| Referensi model                     | Nama                     | Penalaran       | Input       | Konteks   | Output maks. |
| ----------------------------------- | ------------------------ | --------------- | ----------- | --------- | ------------ |
| `moonshot/kimi-k2.6`                | Kimi K2.6                | Tidak           | teks, gambar | 262,144   | 262,144      |
| `moonshot/kimi-k3`                  | Kimi K3                  | Selalu maksimum | teks, gambar | 1,048,576 | 1,048,576    |
| `moonshot/kimi-k2.7-code`           | Kimi K2.7 Code           | Selalu aktif    | teks, gambar | 262,144   | 262,144      |
| `moonshot/kimi-k2.7-code-highspeed` | Kimi K2.7 Code HighSpeed | Selalu aktif    | teks, gambar | 262,144   | 262,144      |
| `moonshot/kimi-k2.5`                | Kimi K2.5                | Tidak           | teks, gambar | 262,144   | 262,144      |

[//]: # "moonshot-kimi-k2-ids:end"

Perkiraan biaya katalog menggunakan tarif bayar sesuai penggunaan yang dipublikasikan Moonshot. Periksa
halaman penyedia terkini untuk [Kimi K3](https://platform.kimi.ai/docs/pricing/chat-k3),
[Kimi K2.7 Code](https://platform.kimi.ai/docs/pricing/chat-k27-code),
[Kimi K2.6](https://platform.kimi.ai/docs/pricing/chat-k26), dan
[Kimi K2.5](https://platform.kimi.ai/docs/pricing/chat-k25) sebelum mengambil keputusan
biaya.

Kimi K3 selalu melakukan penalaran pada `reasoning_effort: "max"`. OpenClaw hanya mengekspos
`/think max`, menghilangkan bidang khusus K2 `thinking`, dan menghapus penggantian
sampling (`temperature`, `top_p`, `n`, `presence_penalty`, dan
`frequency_penalty`) yang ditetapkan K3 ke nilai default penyedia. Kimi K2.7 Code juga
selalu menggunakan pemikiran native, tetapi mengharuskan `thinking` dan
`reasoning_effort` dihilangkan; varian HighSpeed menggunakan kontrak yang sama.
Kimi K2.6 tetap menjadi nilai default orientasi.
Lihat [panduan memulai cepat Kimi K3](https://platform.kimi.ai/docs/guide/kimi-k3-quickstart) dari Moonshot.

## Memulai

Moonshot dan Kimi Coding merupakan plugin eksternal - instal salah satunya sebelum
orientasi.

<Tabs>
  <Tab title="API Moonshot">
    **Paling sesuai untuk:** model Kimi K3 dan K2 melalui Moonshot Open Platform.

    <Steps>
      <Step title="Instal plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Pilih wilayah endpoint Anda">
        | Pilihan autentikasi   | Endpoint                       | Wilayah       |
        | --------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Internasional |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Tiongkok      |
      </Step>
      <Step title="Jalankan orientasi">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Atau untuk endpoint Tiongkok:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Tetapkan Kimi K3 sebagai model default">
        Orientasi mempertahankan Kimi K2.6 sebagai nilai default awal. Beralihlah secara eksplisit
        saat Anda ingin menggunakan Kimi K3:

        ```bash
        openclaw models set moonshot/kimi-k3
        ```
      </Step>
      <Step title="Pastikan model tersedia">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Jalankan uji cepat langsung">
        Gunakan direktori status yang terisolasi saat Anda ingin memverifikasi akses model dan pelacakan
        biaya tanpa menyentuh sesi normal Anda:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Balas persis: KIMI_LIVE_OK' \
          --thinking max \
          --json
        ```

        Respons JSON seharusnya melaporkan `provider: "moonshot"` dan
        `model: "kimi-k3"`. Entri transkrip asisten menyimpan penggunaan
        token yang dinormalisasi beserta perkiraan biaya dalam `usage.cost` ketika Moonshot mengembalikan
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
            "moonshot/kimi-k3": { alias: "Kimi K3" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.7-code-highspeed": { alias: "Kimi K2.7 Code HighSpeed" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
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
                id: "kimi-k3",
                name: "Kimi K3",
                reasoning: true,
                thinkingLevelMap: {
                  off: null,
                  minimal: null,
                  low: null,
                  medium: null,
                  high: null,
                  xhigh: "max",
                  max: "max",
                },
                input: ["text", "image"],
                cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 },
                contextWindow: 1048576,
                maxTokens: 1048576,
                compat: {
                  supportsReasoningEffort: true,
                  supportedReasoningEfforts: ["max"],
                },
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
                id: "kimi-k2.7-code-highspeed",
                name: "Kimi K2.7 Code HighSpeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 1.9, output: 8, cacheRead: 0.38, cacheWrite: 0 },
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
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Paling sesuai untuk:** tugas yang berfokus pada kode melalui endpoint Kimi Coding.

    <Note>
    Kimi Coding menggunakan kunci API dan prefiks penyedia yang berbeda (`kimi/...`) dari Moonshot (`moonshot/...`). Referensi saat ini adalah `kimi/k3` untuk konteks 256K, `kimi/k3[1m]` untuk tingkat 1M, `kimi/kimi-for-coding`, dan `kimi/kimi-for-coding-highspeed`. Referensi lama `kimi/kimi-code` dan `kimi/k2p5` tetap diterima dan dinormalisasi menjadi `kimi/kimi-for-coding`.
    </Note>

    Layanan pengodean menerima klien yang kompatibel dengan OpenAI
    `https://api.kimi.com/coding/v1` maupun yang kompatibel dengan Anthropic
    `https://api.kimi.com/coding/`. Plugin ini menggunakan Anthropic Messages.
    Buat kunci keanggotaan di
    [Kimi Code Console](https://www.kimi.com/code/console); harga keanggotaan saat ini
    tersedia di [halaman harga Kimi](https://www.kimi.com/membership/pricing).

    <Steps>
      <Step title="Instal plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Jalankan orientasi">
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

    Kimi Code K3 menggunakan pemikiran mendalam pada `max` secara default. `/think off` mengirim
    `thinking.type: "disabled"`; `/think max` mengirim permintaan
    pemikiran adaptif K3 dengan upaya maksimum. Tingkat pemikiran lama yang lebih rendah ditetapkan ke
    tingkat `max` yang didukung. Model 1M memerlukan keanggotaan Kimi
    Allegretto atau yang lebih tinggi; gunakan `kimi/k3` pada Moderato.

    Lihat [tabel model Kimi Code](https://www.kimi.com/code/docs/en/kimi-code/models.html) resmi untuk ketersediaan paket saat ini.

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

    | Pengaturan          | Opsi                                                                 |
    | ------------------- | -------------------------------------------------------------------- |
    | Wilayah API         | `https://api.moonshot.ai/v1` (internasional) atau `https://api.moonshot.cn/v1` (Tiongkok) |
    | Model pencarian web | Nilai defaultnya `kimi-k2.6`                                  |

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
  <Accordion title="Mode pemikiran native">
    API Moonshot Kimi K3 selalu melakukan penalaran dengan upaya maksimum. OpenClaw hanya mengekspos
    `/think max`, mengirim `reasoning_effort: "max"`, dan mengabaikan pengaturan lama yang lebih rendah atau
    `off`.

    Kimi Code K3 menyediakan `/think off|max`. Endpoint yang kompatibel dengan Anthropic
    menerima `thinking.type: "disabled"` untuk menonaktifkannya, atau pemikiran adaptif dengan
    `output_config.effort: "max"` untuk tingkat maksimum. Ini berlaku untuk `kimi/k3` dan
    `kimi/k3[1m]`.
    Moonshot API K3 mendukung `auto`, `none`, `required`, dan pilihan alat yang ditetapkan,
    sehingga OpenClaw mempertahankan `tool_choice` yang diminta. Untuk penggunaan alat multi-giliran,
    OpenClaw mempertahankan konten penalaran asisten yang diwajibkan oleh kontrak
    pemutaran ulang Moonshot.

    Kimi K2.7 Code selalu menggunakan pemikiran native. Moonshot mengharuskan klien untuk
    menghilangkan bidang `thinking` untuk model ini, sehingga OpenClaw hanya menyediakan `on` dan
    mengabaikan pengaturan `off` yang usang. K2.7 juga menetapkan `temperature`, `top_p`, `n`,
    `presence_penalty`, dan `frequency_penalty`; OpenClaw menghilangkan
    penggantian yang dikonfigurasi untuk bidang-bidang tersebut.

    Model Kimi Moonshot lainnya mendukung pemikiran native biner:

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

    OpenClaw memetakan tingkat `/think` runtime untuk model-model tersebut:

    | Tingkat `/think`       | Perilaku Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Tingkat apa pun selain nonaktif    | `thinking.type=enabled`    |

    <Warning>
    Saat pemikiran Moonshot K2 diaktifkan, `tool_choice` harus berupa `auto` atau `none`. Pilihan alat yang ditetapkan (`type: "tool"` atau `type: "function"`) akan memaksa pemikiran kembali ke `disabled`, sehingga alat yang diminta tetap dijalankan; sebagai gantinya, `tool_choice: "required"` dinormalisasi menjadi `auto`. Kimi K2.7 Code tidak dapat menonaktifkan pemikiran, sehingga `tool_choice` yang tidak kompatibel dinormalisasi menjadi `auto`. Kimi K3 menggunakan kontrak upaya penalarannya sendiri dan mempertahankan pilihan alat yang didukung.
    </Warning>

    Kimi K2.6 juga menerima bidang opsional `thinking.keep` yang mengontrol
    retensi `reasoning_content` dalam beberapa giliran. Tetapkan ke `"all"` untuk mempertahankan
    penalaran lengkap antar-giliran; hilangkan bidang tersebut (atau biarkan sebagai `null`) untuk menggunakan strategi
    default server. OpenClaw hanya meneruskan `thinking.keep` untuk
    `moonshot/kimi-k2.6` dan menghapusnya dari model lain. Secara default, Kimi K2.7 Code
    mempertahankan riwayat penalaran lengkap, sedangkan OpenClaw menghilangkan seluruh
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

  <Accordion title="Sanitasi id panggilan alat">
    Moonshot Kimi menyediakan id tool_call native dengan format seperti `functions.<name>:<index>`. OpenClaw mempertahankan kemunculan pertama setiap id Kimi native dan menulis ulang duplikat berikutnya menjadi id `call_*` bergaya OpenAI yang deterministik. Hasil alat yang cocok dipetakan ulang dengan id yang sama agar pemutaran ulang tetap unik tanpa menghapus id native pertama Kimi. Perilaku ini terintegrasi ke penyedia Moonshot bawaan dan bukan merupakan pengaturan yang dapat dikonfigurasi pengguna.
  </Accordion>

  <Accordion title="Kompatibilitas penggunaan streaming">
    Endpoint native Moonshot (`https://api.moonshot.ai/v1` dan
    `https://api.moonshot.cn/v1`) menyatakan kompatibilitas penggunaan streaming.
    OpenClaw menentukan hal ini berdasarkan host endpoint, bukan id penyedia, sehingga id
    penyedia khusus yang diarahkan ke host native Moonshot yang sama mewarisi
    perilaku penggunaan streaming yang sama.

    Dengan harga K2.6 dalam katalog, penggunaan streaming yang mencakup token input, output,
    dan pembacaan cache juga dikonversi menjadi estimasi biaya USD lokal untuk
    `/status`, `/usage full`, `/usage cost`, dan penghitungan sesi
    berbasis transkrip.

  </Accordion>

  <Accordion title="Referensi endpoint dan referensi model">
    | Penyedia   | Prefiks referensi model | Endpoint                      | Variabel lingkungan autentikasi        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Endpoint Kimi Coding           | `KIMI_API_KEY`      |
    | Pencarian web | Tidak tersedia              | Sama dengan wilayah Moonshot API    | `KIMI_API_KEY` atau `MOONSHOT_API_KEY` |

    - Pencarian web Kimi menggunakan `KIMI_API_KEY` atau `MOONSHOT_API_KEY`, dan secara default menggunakan `https://api.moonshot.ai/v1` dengan model `kimi-k2.6`.
    - Ganti metadata harga dan konteks di `models.providers` jika diperlukan.
    - Jika Moonshot memublikasikan batas konteks yang berbeda untuk suatu model, sesuaikan `contextWindow` sebagaimana mestinya.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pencarian web" href="/id/tools/web" icon="magnifying-glass">
    Mengonfigurasi penyedia pencarian web termasuk Kimi.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap untuk penyedia, model, dan plugin.
  </Card>
  <Card title="Platform Terbuka Moonshot" href="https://platform.moonshot.ai" icon="globe">
    Pengelolaan kunci Moonshot API dan dokumentasi.
  </Card>
</CardGroup>
