---
read_when:
    - Anda menginginkan inferensi yang berfokus pada privasi di OpenClaw
    - Anda menginginkan panduan setup Venice AI
summary: Gunakan model Venice AI yang berfokus pada privasi di OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-26T11:37:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8396d17485b96262e352449d1524c2b8a8457edcdb92b0d0d6520d1032f8287
    source_path: providers/venice.md
    workflow: 15
---

Venice AI menyediakan **inferensi AI yang berfokus pada privasi** dengan dukungan untuk model tanpa sensor dan akses ke model proprietary utama melalui proxy anonim mereka. Semua inferensi bersifat privat secara default — tidak ada pelatihan pada data Anda, tidak ada logging.

## Mengapa Venice di OpenClaw

- **Inferensi privat** untuk model open-source (tanpa logging).
- **Model tanpa sensor** saat Anda membutuhkannya.
- **Akses anonim** ke model proprietary (Opus/GPT/Gemini) saat kualitas menjadi prioritas.
- Endpoint `/v1` yang kompatibel dengan OpenAI.

## Mode privasi

Venice menawarkan dua tingkat privasi — memahami hal ini penting untuk memilih model Anda:

| Mode           | Deskripsi                                                                                                                         | Model                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privat**     | Sepenuhnya privat. Prompt/respons **tidak pernah disimpan atau dicatat**. Bersifat sementara.                                    | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, dll. |
| **Anonim**     | Diproksikan melalui Venice dengan metadata dihapus. Penyedia yang mendasari (OpenAI, Anthropic, Google, xAI) melihat permintaan yang dianonimkan. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Model anonim **bukan** sepenuhnya privat. Venice menghapus metadata sebelum meneruskan, tetapi penyedia yang mendasari (OpenAI, Anthropic, Google, xAI) tetap memproses permintaan tersebut. Pilih model **Privat** saat privasi penuh diperlukan.
</Warning>

## Fitur

- **Berfokus pada privasi**: Pilih antara mode "private" (sepenuhnya privat) dan "anonymized" (diproksikan)
- **Model tanpa sensor**: Akses ke model tanpa pembatasan konten
- **Akses ke model utama**: Gunakan Claude, GPT, Gemini, dan Grok melalui proxy anonim Venice
- **API yang kompatibel dengan OpenAI**: Endpoint `/v1` standar untuk integrasi mudah
- **Streaming**: Didukung pada semua model
- **Pemanggilan fungsi**: Didukung pada model tertentu (periksa kemampuan model)
- **Vision**: Didukung pada model yang memiliki kemampuan vision
- **Tanpa batas laju keras**: Pembatasan fair-use dapat berlaku untuk penggunaan ekstrem

## Memulai

<Steps>
  <Step title="Dapatkan kunci API Anda">
    1. Daftar di [venice.ai](https://venice.ai)
    2. Buka **Settings > API Keys > Create new key**
    3. Salin kunci API Anda (format: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Konfigurasikan OpenClaw">
    Pilih metode penyiapan yang Anda inginkan:

    <Tabs>
      <Tab title="Interaktif (disarankan)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Ini akan:
        1. Meminta kunci API Anda (atau menggunakan `VENICE_API_KEY` yang sudah ada)
        2. Menampilkan semua model Venice yang tersedia
        3. Memungkinkan Anda memilih model default
        4. Mengonfigurasi penyedia secara otomatis
      </Tab>
      <Tab title="Variabel lingkungan">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non-interaktif">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Verifikasi penyiapan">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Pemilihan model

Setelah penyiapan, OpenClaw menampilkan semua model Venice yang tersedia. Pilih berdasarkan kebutuhan Anda:

- **Model default**: `venice/kimi-k2-5` untuk penalaran privat yang kuat plus vision.
- **Opsi berkemampuan tinggi**: `venice/claude-opus-4-6` untuk jalur Venice anonim terkuat.
- **Privasi**: Pilih model "private" untuk inferensi yang sepenuhnya privat.
- **Kapabilitas**: Pilih model "anonymized" untuk mengakses Claude, GPT, Gemini melalui proxy Venice.

Ubah model default Anda kapan saja:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Tampilkan semua model yang tersedia:

```bash
openclaw models list | grep venice
```

Anda juga dapat menjalankan `openclaw configure`, pilih **Model/auth**, lalu pilih **Venice AI**.

<Tip>
Gunakan tabel di bawah ini untuk memilih model yang tepat untuk kasus penggunaan Anda.

| Kasus Penggunaan          | Model yang Direkomendasikan      | Alasan                                       |
| ------------------------- | -------------------------------- | -------------------------------------------- |
| **Obrolan umum (default)**| `kimi-k2-5`                      | Penalaran privat yang kuat plus vision       |
| **Kualitas keseluruhan terbaik** | `claude-opus-4-6`         | Opsi Venice anonim terkuat                   |
| **Privasi + coding**      | `qwen3-coder-480b-a35b-instruct` | Model coding privat dengan konteks besar     |
| **Vision privat**         | `kimi-k2-5`                      | Dukungan vision tanpa keluar dari mode privat |
| **Cepat + murah**         | `qwen3-4b`                       | Model penalaran ringan                       |
| **Tugas privat kompleks** | `deepseek-v3.2`                  | Penalaran kuat, tetapi tanpa dukungan tool Venice |
| **Tanpa sensor**          | `venice-uncensored`              | Tanpa pembatasan konten                      |

</Tip>

## Perilaku replay DeepSeek V4

Jika Venice mengekspos model DeepSeek V4 seperti `venice/deepseek-v4-pro` atau
`venice/deepseek-v4-flash`, OpenClaw mengisi placeholder replay
`reasoning_content` DeepSeek V4 yang diperlukan pada giliran assistant tool-call saat
proxy menghilangkannya. Venice menolak kontrol `thinking` tingkat atas native milik DeepSeek,
jadi OpenClaw menjaga perbaikan replay khusus penyedia itu tetap terpisah dari kontrol thinking milik penyedia
DeepSeek native.

## Katalog bawaan (total 41)

<AccordionGroup>
  <Accordion title="Model privat (26) — sepenuhnya privat, tanpa logging">
    | ID Model                               | Nama                                | Konteks | Fitur                      |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Default, reasoning, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Reasoning                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Umum                       |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Umum                       |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | Umum, tools dinonaktifkan  |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | Reasoning                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | Umum                       |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | Coding                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | Coding                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | Reasoning, vision          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | Umum                       |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | Cepat, reasoning           |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | Reasoning, tools dinonaktifkan |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Tanpa sensor, tools dinonaktifkan |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | Umum                       |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | Umum                       |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | Reasoning                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | Umum                       |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | Reasoning                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | Reasoning                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | Reasoning                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | Reasoning                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | Reasoning                  |
  </Accordion>

  <Accordion title="Model anonim (15) — melalui proxy Venice">
    | ID Model                        | Nama                           | Konteks | Fitur                     |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | Reasoning, vision         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | Reasoning, vision         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | Reasoning, vision         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | Reasoning, vision         |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | Reasoning, vision         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | Reasoning, vision, coding |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | Reasoning                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | Reasoning, vision, coding |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | Reasoning, vision         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | Reasoning, vision         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | Reasoning, vision         |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | Reasoning, vision         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | Reasoning, coding         |
  </Accordion>
</AccordionGroup>

## Penemuan model

OpenClaw secara otomatis menemukan model dari API Venice saat `VENICE_API_KEY` disetel. Jika API tidak dapat dijangkau, OpenClaw akan kembali ke katalog statis.

Endpoint `/models` bersifat publik (tidak memerlukan auth untuk menampilkan daftar), tetapi inferensi memerlukan kunci API yang valid.

## Dukungan streaming dan tool

| Fitur                | Dukungan                                             |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | Semua model                                          |
| **Function calling** | Sebagian besar model (periksa `supportsFunctionCalling` di API) |
| **Vision/Images**    | Model yang ditandai dengan fitur "Vision"            |
| **JSON mode**        | Didukung melalui `response_format`                   |

## Harga

Venice menggunakan sistem berbasis kredit. Lihat [venice.ai/pricing](https://venice.ai/pricing) untuk tarif terkini:

- **Model privat**: Umumnya berbiaya lebih rendah
- **Model anonim**: Mirip dengan harga API langsung + biaya kecil dari Venice

### Venice (anonim) vs API langsung

| Aspek         | Venice (Anonim)                | API Langsung         |
| ------------- | ------------------------------ | -------------------- |
| **Privasi**   | Metadata dihapus, dianonimkan  | Akun Anda terhubung  |
| **Latensi**   | +10-50ms (proxy)               | Langsung             |
| **Fitur**     | Sebagian besar fitur didukung  | Fitur lengkap        |
| **Penagihan** | Kredit Venice                  | Penagihan penyedia   |

## Contoh penggunaan

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Kunci API tidak dikenali">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Pastikan kunci dimulai dengan `vapi_`.

  </Accordion>

  <Accordion title="Model tidak tersedia">
    Katalog model Venice diperbarui secara dinamis. Jalankan `openclaw models list` untuk melihat model yang saat ini tersedia. Beberapa model mungkin sementara offline.
  </Accordion>

  <Accordion title="Masalah koneksi">
    API Venice berada di `https://api.venice.ai/api/v1`. Pastikan jaringan Anda mengizinkan koneksi HTTPS.
  </Accordion>
</AccordionGroup>

<Note>
Bantuan lebih lanjut: [Troubleshooting](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Contoh file konfigurasi">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Beranda Venice AI dan pendaftaran akun.
  </Card>
  <Card title="Dokumentasi API" href="https://docs.venice.ai" icon="book">
    Referensi API Venice dan dokumentasi developer.
  </Card>
  <Card title="Harga" href="https://venice.ai/pricing" icon="credit-card">
    Tarif kredit dan paket Venice saat ini.
  </Card>
</CardGroup>
