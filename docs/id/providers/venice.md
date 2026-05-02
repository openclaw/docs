---
read_when:
    - Anda menginginkan inferensi yang berfokus pada privasi di OpenClaw
    - Anda menginginkan panduan penyiapan Venice AI
summary: Gunakan model Venice AI yang berfokus pada privasi di OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-05-02T09:30:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9b3486dd319661ba27f952e1353fed4364064c2cfb1e5744c018ddbac9dae82
    source_path: providers/venice.md
    workflow: 16
---

Venice AI menyediakan **inferensi AI yang berfokus pada privasi** dengan dukungan untuk model tanpa sensor dan akses ke model proprietary utama melalui proxy anonim mereka. Semua inferensi bersifat privat secara bawaan — tidak ada pelatihan pada data Anda, tidak ada pencatatan log.

## Mengapa Venice di OpenClaw

- **Inferensi privat** untuk model sumber terbuka (tanpa pencatatan log).
- **Model tanpa sensor** saat Anda membutuhkannya.
- **Akses anonim** ke model proprietary (Opus/GPT/Gemini) saat kualitas penting.
- Endpoint `/v1` yang kompatibel dengan OpenAI.

## Mode privasi

Venice menawarkan dua tingkat privasi — memahami ini adalah kunci untuk memilih model Anda:

| Mode           | Deskripsi                                                                                                                   | Model                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | Sepenuhnya privat. Prompt/respons **tidak pernah disimpan atau dicatat dalam log**. Sementara.                              | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, dll. |
| **Anonymized** | Diproksikan melalui Venice dengan metadata dihapus. Penyedia dasar (OpenAI, Anthropic, Google, xAI) melihat permintaan anonim. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Model anonim **tidak** sepenuhnya privat. Venice menghapus metadata sebelum meneruskan, tetapi penyedia dasar (OpenAI, Anthropic, Google, xAI) tetap memproses permintaan tersebut. Pilih model **Private** saat privasi penuh diperlukan.
</Warning>

## Fitur

- **Berfokus pada privasi**: Pilih antara mode "private" (sepenuhnya privat) dan "anonymized" (diproksikan)
- **Model tanpa sensor**: Akses ke model tanpa pembatasan konten
- **Akses model utama**: Gunakan Claude, GPT, Gemini, dan Grok melalui proxy anonim Venice
- **API kompatibel OpenAI**: Endpoint `/v1` standar untuk integrasi mudah
- **Streaming**: Didukung pada semua model
- **Pemanggilan fungsi**: Didukung pada model tertentu (periksa kapabilitas model)
- **Visi**: Didukung pada model dengan kapabilitas visi
- **Tanpa batas laju keras**: Pembatasan penggunaan wajar dapat berlaku untuk penggunaan ekstrem

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
      <Tab title="Interaktif (direkomendasikan)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Ini akan:
        1. Meminta kunci API Anda (atau menggunakan `VENICE_API_KEY` yang sudah ada)
        2. Menampilkan semua model Venice yang tersedia
        3. Memungkinkan Anda memilih model bawaan
        4. Mengonfigurasi penyedia secara otomatis
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
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Pemilihan model

Setelah penyiapan, OpenClaw menampilkan semua model Venice yang tersedia. Pilih berdasarkan kebutuhan Anda:

- **Model bawaan**: `venice/kimi-k2-5` untuk penalaran privat yang kuat plus visi.
- **Opsi berkapabilitas tinggi**: `venice/claude-opus-4-6` untuk jalur Venice anonim terkuat.
- **Privasi**: Pilih model "private" untuk inferensi yang sepenuhnya privat.
- **Kapabilitas**: Pilih model "anonymized" untuk mengakses Claude, GPT, Gemini melalui proxy Venice.

Ubah model bawaan Anda kapan saja:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Cantumkan semua model yang tersedia:

```bash
openclaw models list --all --provider venice
```

Anda juga dapat menjalankan `openclaw configure`, memilih **Model/auth**, dan memilih **Venice AI**.

<Tip>
Gunakan tabel di bawah untuk memilih model yang tepat untuk kasus penggunaan Anda.

| Kasus Penggunaan          | Model yang Direkomendasikan       | Alasan                                       |
| ------------------------- | --------------------------------- | ------------------------------------------- |
| **Obrolan umum (bawaan)** | `kimi-k2-5`                       | Penalaran privat yang kuat plus visi        |
| **Kualitas terbaik keseluruhan** | `claude-opus-4-6`         | Opsi Venice anonim terkuat                  |
| **Privasi + pengodean**   | `qwen3-coder-480b-a35b-instruct`  | Model pengodean privat dengan konteks besar |
| **Visi privat**           | `kimi-k2-5`                       | Dukungan visi tanpa keluar dari mode privat |
| **Cepat + murah**         | `qwen3-4b`                        | Model penalaran ringan                      |
| **Tugas privat kompleks** | `deepseek-v3.2`                   | Penalaran kuat, tetapi tanpa dukungan alat Venice |
| **Tanpa sensor**          | `venice-uncensored`               | Tanpa pembatasan konten                     |

</Tip>

## Perilaku replay DeepSeek V4

Jika Venice mengekspos model DeepSeek V4 seperti `venice/deepseek-v4-pro` atau
`venice/deepseek-v4-flash`, OpenClaw mengisi placeholder replay
`reasoning_content` DeepSeek V4 yang diperlukan pada pesan asisten saat proxy
menghilangkannya. Venice menolak kontrol `thinking` tingkat atas native DeepSeek, jadi
OpenClaw menjaga perbaikan replay khusus penyedia tersebut tetap terpisah dari kontrol thinking
penyedia DeepSeek native.

## Katalog bawaan (total 41)

<AccordionGroup>
  <Accordion title="Model privat (26) — sepenuhnya privat, tanpa pencatatan log">
    | ID Model                               | Nama                                | Konteks | Fitur                      |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Bawaan, penalaran, visi    |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Penalaran                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Umum                       |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Umum                       |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | Umum, alat dinonaktifkan   |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Penalaran                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | Umum                       |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | Pengodean                  |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | Pengodean                  |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Penalaran, visi            |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | Umum                       |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k    | Visi                       |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | Cepat, penalaran           |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Penalaran, alat dinonaktifkan |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Tanpa sensor, alat dinonaktifkan |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Visi                       |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Visi                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k    | Umum                       |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | Umum                       |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Penalaran                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | Umum                       |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Penalaran                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Penalaran                  |
    | `zai-org-glm-5`                        | GLM 5                               | 198k    | Penalaran                  |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k    | Penalaran                  |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k    | Penalaran                  |
  </Accordion>

  <Accordion title="Model anonim (15) — melalui proxy Venice">
    | ID Model                        | Nama                           | Konteks | Fitur                     |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | Penalaran, visi           |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | Penalaran, visi           |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | Penalaran, visi           |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | Penalaran, visi           |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | Penalaran, visi           |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | Penalaran, visi, pengodean |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | Penalaran                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | Penalaran, visi, pengodean |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | Visi                      |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | Visi                      |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | Penalaran, visi           |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | Penalaran, visi           |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | Penalaran, visi           |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | Penalaran, visi           |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | Penalaran, pengodean      |
  </Accordion>
</AccordionGroup>

## Penemuan model

OpenClaw menyertakan katalog seed Venice berbasis manifes untuk daftar model baca-saja. Penyegaran runtime masih dapat menemukan model dari API Venice, dan kembali ke katalog manifes jika API tidak dapat dijangkau.

Endpoint `/models` bersifat publik (tidak perlu autentikasi untuk pencantuman), tetapi inferensi memerlukan kunci API yang valid.

## Dukungan streaming dan alat

| Fitur                | Dukungan                                             |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | Semua model                                          |
| **Pemanggilan fungsi** | Sebagian besar model (periksa `supportsFunctionCalling` di API) |
| **Visi/Gambar**      | Model yang ditandai dengan fitur "Visi"              |
| **mode JSON**        | Didukung melalui `response_format`                   |

## Harga

Venice menggunakan sistem berbasis kredit. Periksa [venice.ai/pricing](https://venice.ai/pricing) untuk tarif saat ini:

- **Model privat**: Umumnya berbiaya lebih rendah
- **Model dianonimkan**: Mirip dengan harga API langsung + biaya kecil Venice

### Venice (dianonimkan) vs API langsung

| Aspek        | Venice (Dianonimkan)          | API langsung        |
| ------------ | ----------------------------- | ------------------- |
| **Privasi**  | Metadata dihapus, dianonimkan | Akun Anda tertaut   |
| **Latensi**  | +10-50md (proxy)              | Langsung            |
| **Fitur**    | Sebagian besar fitur didukung | Fitur lengkap       |
| **Penagihan** | Kredit Venice                | Penagihan penyedia  |

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
  <Accordion title="API key not recognized">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Pastikan kunci dimulai dengan `vapi_`.

  </Accordion>

  <Accordion title="Model not available">
    Katalog model Venice diperbarui secara dinamis. Jalankan `openclaw models list` untuk melihat model yang saat ini tersedia. Beberapa model mungkin sedang offline sementara.
  </Accordion>

  <Accordion title="Connection issues">
    API Venice berada di `https://api.venice.ai/api/v1`. Pastikan jaringan Anda mengizinkan koneksi HTTPS.
  </Accordion>
</AccordionGroup>

<Note>
Bantuan lainnya: [Pemecahan masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Config file example">
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
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Beranda Venice AI dan pendaftaran akun.
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    Referensi API Venice dan dokumentasi pengembang.
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    Tarif dan paket kredit Venice saat ini.
  </Card>
</CardGroup>
