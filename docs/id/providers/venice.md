---
read_when:
    - Anda menginginkan inferensi yang berfokus pada privasi di OpenClaw
    - Anda menginginkan panduan penyiapan Venice AI
summary: Gunakan model Venice AI yang berfokus pada privasi di OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-19T05:17:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 13c32b783394eb3092ff94a532b69e34c00624127b0e76e4e2812751d39073a1
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) menyediakan inferensi yang berfokus pada privasi: model terbuka dijalankan
tanpa pencatatan, serta akses proksi anonim ke Claude, GPT, Gemini, dan Grok.
Semua endpoint kompatibel dengan OpenAI (`/v1`).

## Mode privasi

| Mode           | Perilaku                                                         | Model                                                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privat**    | Prompt/respons tidak pernah disimpan atau dicatat. Bersifat sementara.         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, dll. |
| **Dianonimkan** | Diproksikan melalui Venice dengan metadata dihapus sebelum diteruskan. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Model yang dianonimkan tidak sepenuhnya privat. Venice menghapus metadata sebelum meneruskan permintaan, tetapi penyedia yang mendasarinya (OpenAI, Anthropic, Google, xAI) tetap memproses permintaan tersebut. Gunakan model Privat ketika privasi penuh diperlukan.
</Warning>

## Memulai

<Steps>
  <Step title="Instal plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Dapatkan kunci API Anda">
    1. Daftar di [venice.ai](https://venice.ai)
    2. Buka **Settings > API Keys > Create new key**
    3. Salin kunci API Anda (format: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Konfigurasikan OpenClaw">
    <Tabs>
      <Tab title="Interaktif (disarankan)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Meminta kunci API (atau menggunakan kembali `VENICE_API_KEY` yang sudah ada), mencantumkan model Venice yang tersedia, dan menetapkan model default Anda.
      </Tab>
      <Tab title="Variabel lingkungan">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Noninteraktif">
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
    openclaw agent --model venice/kimi-k2-5 --message "Halo, apakah Anda berfungsi?"
    ```
  </Step>
</Steps>

## Pemilihan model

- **Default**: `venice/kimi-k2-5` (privat, penalaran, visi).
- **Opsi anonim terkuat**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

Anda juga dapat menjalankan `openclaw configure` dan memilih **Model/auth provider > Venice AI**.

<Tip>
| Kasus penggunaan              | Model                                        | Alasan                                    |
| --------------------- | -------------------------------------------- | -------------------------------------- |
| Percakapan umum (default) | `kimi-k2-5`                                  | Penalaran privat yang kuat serta visi   |
| Kualitas keseluruhan terbaik   | `claude-opus-4-6`                            | Opsi Venice anonim terkuat     |
| Privasi + pengodean       | `qwen3-coder-480b-a35b-instruct-turbo`       | Model pengodean privat dengan konteks besar |
| Cepat + murah           | `llama-3.2-3b`                               | Model privat yang ringkas                  |
| Tugas privat kompleks  | `deepseek-v3.2`                              | Penalaran kuat; pemanggilan alat dinonaktifkan |
| Tanpa sensor             | `venice-uncensored-1-2`                      | Model Venice tanpa sensor saat ini        |
</Tip>

## Katalog bawaan (30 model)

<AccordionGroup>
  <Accordion title="Model privat (20) — sepenuhnya privat, tanpa pencatatan">
    | ID model                               | Nama                                 | Konteks | Catatan                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | Default, penalaran, visi  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | Umum                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | Umum                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | Umum, alat dinonaktifkan     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | Penalaran                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | Umum                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | Pengodean                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | Penalaran, visi           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | Umum                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)                | 256k    | Visi                      |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | Penalaran, alat dinonaktifkan    |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | Visi                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | Umum                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | Umum                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | Penalaran                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | Umum                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | Penalaran                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | Penalaran                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | Penalaran                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | Penalaran                    |
  </Accordion>

  <Accordion title="Model anonim (10) — melalui proksi Venice">
    | ID model                        | Nama                           | Konteks | Catatan                      |
    | -------------------------------- | -------------------------------- | ------- | ---------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (melalui Venice)    | 1M      | Penalaran, visi            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (melalui Venice)  | 1M      | Penalaran, visi            |
    | `openai-gpt-54`                 | GPT-5.4 (melalui Venice)            | 1M      | Penalaran, visi            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (melalui Venice)      | 400k    | Penalaran, visi, pengodean     |
    | `openai-gpt-52`                 | GPT-5.2 (melalui Venice)            | 256k    | Penalaran                    |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (melalui Venice)      | 256k    | Penalaran, visi, pengodean     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (melalui Venice)             | 128k    | Visi                        |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (melalui Venice)        | 128k    | Visi                        |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (melalui Venice)     | 1M      | Penalaran, visi             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (melalui Venice)     | 256k    | Penalaran, visi             |
  </Accordion>
</AccordionGroup>

Model Venice yang didukung Grok (`grok-4-3` dan yang serupa) mendapatkan patch kompatibilitas
skema alat yang sama dengan penyedia xAI native karena keduanya menggunakan format pemanggilan
alat upstream yang sama.

## Penemuan model

Katalog bawaan di atas adalah daftar awal yang didukung manifes. Saat runtime, OpenClaw
menyegarkannya dari API Venice `/models` dan kembali ke daftar awal jika
API tidak dapat dijangkau. Endpoint `/models` bersifat publik (tidak memerlukan autentikasi untuk
pencantuman), tetapi inferensi memerlukan kunci API yang valid.

Venice dapat terus menerima ID model yang telah dihentikan sebagai alias milik penyedia. Katalog
OpenClaw hanya menampilkan ID model kanonis yang dikembalikan oleh `/models`.

## Perilaku pemutaran ulang DeepSeek V4

Jika Venice menyediakan model DeepSeek V4 seperti `deepseek-v4-pro` atau
`deepseek-v4-flash`, OpenClaw mengisi kolom pemutaran ulang `reasoning_content` yang diwajibkan
pada pesan asisten ketika Venice tidak menyediakannya, serta menghapus `thinking`/
`reasoning`/`reasoning_effort` dari payload permintaan (Venice menolak
kontrol native DeepSeek `thinking` pada model tersebut). Perbaikan pemutaran ulang ini
terpisah dari kontrol pemikiran milik penyedia native DeepSeek.

## Dukungan streaming dan alat

| Fitur          | Dukungan                                           |
| ---------------- | ------------------------------------------------- |
| Streaming        | Semua model                                        |
| Pemanggilan fungsi | Sebagian besar model; dinonaktifkan per model jika disebutkan di atas |
| Visi/Gambar    | Model yang ditandai "Vision" di atas                      |
| Mode JSON        | Melalui `response_format`                             |

## Harga

Venice menggunakan sistem berbasis kredit. Biaya model anonim kurang lebih sama dengan
harga API langsung ditambah biaya Venice yang kecil. Lihat
[venice.ai/pricing](https://venice.ai/pricing) untuk tarif saat ini.

## Contoh penggunaan

```bash
# Model privat default
openclaw agent --model venice/kimi-k2-5 --message "Pemeriksaan kondisi singkat"

# Claude Opus melalui Venice (dianonimkan)
openclaw agent --model venice/claude-opus-4-6 --message "Ringkas tugas ini"

# Model tanpa sensor
openclaw agent --model venice/venice-uncensored-1-2 --message "Susun beberapa opsi"

# Model visi dengan gambar
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Tinjau gambar terlampir"

# Model pengodean
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct-turbo --message "Refaktor fungsi ini"
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Kunci API tidak dikenali">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Pastikan kunci diawali dengan `vapi_`.

  </Accordion>

  <Accordion title="Model tidak tersedia">
    Jalankan `openclaw models list --all --provider venice` untuk melihat model yang
    tersedia saat ini; katalog berubah seiring Venice menambahkan atau menghentikan model.
  </Accordion>

  <Accordion title="Masalah koneksi">
    API Venice berada di `https://api.venice.ai/api/v1`. Pastikan jaringan Anda mengizinkan HTTPS ke host tersebut.
  </Accordion>
</AccordionGroup>

<Note>
Bantuan selengkapnya: [Pemecahan masalah](/id/help/troubleshooting) dan [Pertanyaan umum](/id/help/faq).
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Contoh berkas konfigurasi">
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
    Referensi API Venice dan dokumentasi pengembang.
  </Card>
  <Card title="Harga" href="https://venice.ai/pricing" icon="credit-card">
    Tarif kredit dan paket Venice saat ini.
  </Card>
</CardGroup>
