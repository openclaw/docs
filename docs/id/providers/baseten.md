---
read_when:
    - Anda ingin menjalankan Inkling dari Thinking Machines Lab di OpenClaw
    - Anda menginginkan satu API yang kompatibel dengan OpenAI untuk model yang di-hosting oleh Baseten
summary: Penyiapan Baseten untuk Inkling dan API Model yang dihosting
title: Baseten
x-i18n:
    generated_at: "2026-07-19T05:07:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5b4a8358141188171cb0b67510ec6bea1bb80dcab9c0c6da9a37aeb97560089
    source_path: providers/baseten.md
    workflow: 16
---

[API Model Baseten](https://docs.baseten.co/inference/model-apis/overview) menyediakan akses terhosting yang kompatibel dengan OpenAI ke model-model terdepan. Plugin eksternal resmi menggunakan penemuan terautentikasi, sehingga OpenClaw mengikuti set model lengkap yang diaktifkan untuk akun Baseten Anda. Fallback luringnya berisi setiap API Model yang tersedia saat rilis OpenClaw ini dibuat.

| Properti        | Nilai                                                    |
| --------------- | -------------------------------------------------------- |
| Id penyedia     | `baseten`                                                |
| Plugin          | paket eksternal resmi (`@openclaw/baseten-provider`) |
| Variabel lingkungan autentikasi | `BASETEN_API_KEY`                                        |
| Flag orientasi awal | `--auth-choice baseten-api-key`                          |
| Flag CLI langsung | `--baseten-api-key <key>`                                |
| API             | kompatibel dengan OpenAI (`openai-completions`)                 |
| URL dasar        | `https://inference.baseten.co/v1`                        |
| Model default   | `baseten/thinkingmachines/inkling`                       |

## Instal Plugin

```bash
openclaw plugins install @openclaw/baseten-provider
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Buat akun Baseten dan kunci API">
    Paket Basic Baseten tidak memiliki biaya platform bulanan; panggilan API Model dikenai biaya berdasarkan penggunaan. Buat kunci di [pengaturan kunci API Baseten](https://app.baseten.co/settings/api_keys) dan periksa tarif terkini di [halaman harga](https://www.baseten.co/pricing).
  </Step>
  <Step title="Jalankan orientasi awal">
    <CodeGroup>

```bash Orientasi awal
openclaw onboard --auth-choice baseten-api-key
```

```bash Flag langsung
openclaw onboard --non-interactive \
  --auth-choice baseten-api-key \
  --baseten-api-key "$BASETEN_API_KEY"
```

```bash Hanya variabel lingkungan
export BASETEN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verifikasi katalog langsung">
    ```bash
    openclaw models list --provider baseten
    ```

    Dengan autentikasi yang dapat digunakan, Plugin meminta `GET /v1/models` dan mencantumkan setiap model yang dikembalikan untuk akun tersebut. Tanpa autentikasi, Plugin tetap luring dan menggunakan fallback bawaan.

  </Step>
</Steps>

## Inkling

[Inkling dari Thinking Machines Lab](https://thinkingmachines.ai/news/introducing-inkling/) adalah model default. Di OpenClaw, model ini mendukung masukan teks dan gambar, pemanggilan alat, skema alat terstruktur, tingkat upaya penalaran yang dapat dikonfigurasi, jendela konteks 1.048 juta token, dan hingga 32 ribu token keluaran:

```json5
{
  agents: {
    defaults: {
      model: { primary: "baseten/thinkingmachines/inkling" },
    },
  },
}
```

Gunakan `/model baseten/thinkingmachines/inkling` untuk mengganti model pada percakapan yang sudah ada.

## Katalog fallback bawaan

Katalog langsung yang terautentikasi merupakan sumber otoritatif. Baris-baris ini menjaga agar penyiapan dan pemilihan model tetap berguna sebelum penemuan berhasil:

| Referensi model                                    | Masukan     | Konteks | Keluaran maks. |
| -------------------------------------------------- | ----------- | ------: | -------------: |
| `baseten/deepseek-ai/DeepSeek-V4-Pro`              | teks        |    262k |           262k |
| `baseten/zai-org/GLM-4.7`                          | teks        |    200k |           200k |
| `baseten/zai-org/GLM-5`                            | teks        |    202k |           202k |
| `baseten/zai-org/GLM-5.1`                          | teks        |    202k |           202k |
| `baseten/zai-org/GLM-5.2`                          | teks        |    202k |           202k |
| `baseten/thinkingmachines/inkling`                 | teks, gambar |  1.048M |            32k |
| `baseten/moonshotai/Kimi-K2.5`                     | teks, gambar |    262k |           262k |
| `baseten/moonshotai/Kimi-K2.6`                     | teks, gambar |    262k |           262k |
| `baseten/moonshotai/Kimi-K2.7-Code`                | teks, gambar |    262k |           262k |
| `baseten/nvidia/Nemotron-120B-A12B`                | teks        |    202k |           202k |
| `baseten/nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B` | teks        |    202k |           202k |
| `baseten/openai/gpt-oss-120b`                      | teks        |    128k |           128k |

Semua model bawaan mendukung pemanggilan alat dan penalaran. OpenClaw memetakan tingkat pemikirannya ke model dengan `reasoning_effort` bawaan. Model GLM, Kimi, dan Nemotron Baseten yang bersifat opsional menggunakan pemikiran nonaktif secara default; sebagian besar menyediakan kontrol biner nonaktif/aktif, sedangkan GLM 5.2 menyediakan nonaktif, tinggi, dan maksimum. OpenClaw mengirimkan pilihan ini melalui kontrol `chat_template_args.enable_thinking` milik Baseten dan, untuk GLM 5.2, parameter tingkat atas `reasoning_effort` yang telah divalidasi.

<Note>
Baseten dapat menambahkan, menghapus, atau mengubah API Model secara independen dari rilis OpenClaw. Plugin menyegarkan id model, batas konteks, batas keluaran, serta harga masukan, masukan tercache, dan keluaran dari API terautentikasi sambil mempertahankan kebijakan transpor OpenClaw khusus model.
</Note>

## Konfigurasi manual

Sebagian besar penyiapan hanya memerlukan kunci API. Untuk menetapkan penyedia secara eksplisit:

```json5
{
  env: { BASETEN_API_KEY: "..." },
  agents: {
    defaults: {
      model: { primary: "baseten/thinkingmachines/inkling" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      baseten: {
        baseUrl: "https://inference.baseten.co/v1",
        apiKey: "${BASETEN_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "thinkingmachines/inkling",
            name: "Inkling",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048000,
            maxTokens: 32000,
            compat: {
              supportsStore: false,
              supportsDeveloperRole: false,
              supportsUsageInStreaming: true,
              supportsStrictMode: true,
              supportsTools: true,
              supportsReasoningEffort: true,
              supportedReasoningEfforts: ["none", "minimal", "low", "medium", "high", "xhigh"],
              reasoningEffortMap: {
                off: "none",
                none: "none",
                adaptive: "xhigh",
                max: "xhigh",
              },
              maxTokensField: "max_tokens",
            },
          },
        ],
      },
    },
  },
}
```

<Note>
Jika Gateway berjalan sebagai daemon (launchd, systemd, Docker), pastikan `BASETEN_API_KEY` tersedia untuk proses tersebut. Kunci yang hanya diekspor di shell interaktif tidak dapat dilihat oleh layanan terkelola yang sudah berjalan.
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Mode pemikiran" href="/id/tools/thinking" icon="brain">
    Pilih tingkat upaya penalaran OpenClaw.
  </Card>
  <Card title="CLI model" href="/id/cli/models" icon="terminal">
    Cantumkan, periksa, dan pilih model yang ditemukan.
  </Card>
  <Card title="Tanya jawab model" href="/id/help/faq-models" icon="circle-question">
    Pemecahan masalah profil autentikasi dan pemilihan model.
  </Card>
</CardGroup>
