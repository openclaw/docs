---
read_when:
    - Anda ingin menggunakan Together AI dengan OpenClaw
    - Anda memerlukan var env kunci API atau pilihan autentikasi CLI
summary: Penyiapan Together AI (autentikasi + pemilihan model)
title: Together AI
x-i18n:
    generated_at: "2026-04-24T09:24:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a11f212fbef79e399d4a50cec88150bf0b7abf80ad765f0a617786bb051c8e
    source_path: providers/together.md
    workflow: 15
---

[Together AI](https://together.ai) menyediakan akses ke model open-source terdepan
termasuk Llama, DeepSeek, Kimi, dan lainnya melalui API terpadu.

| Properti | Nilai                         |
| -------- | ----------------------------- |
| Penyedia | `together`                    |
| Autentikasi     | `TOGETHER_API_KEY`            |
| API      | kompatibel dengan OpenAI             |
| URL Dasar | `https://api.together.xyz/v1` |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API">
    Buat kunci API di
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Tetapkan model default">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Contoh non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
Preset onboarding menetapkan `together/moonshotai/Kimi-K2.5` sebagai model
default.
</Note>

## Katalog bawaan

OpenClaw menyertakan katalog Together bawaan berikut:

| Ref model                                                    | Nama                                   | Input       | Konteks    | Catatan                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | text, image | 262,144    | Model default; penalaran diaktifkan |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | text        | 202,752    | Model teks tujuan umum          |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | Model instruksi cepat           |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | Multimodal                      |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | Multimodal                      |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | text        | 131,072    | Model teks umum                 |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | text        | 131,072    | Model penalaran                 |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | text        | 262,144    | Model teks Kimi sekunder        |

## Pembuatan video

Plugin `together` bawaan juga mendaftarkan pembuatan video melalui
alat bersama `video_generate`.

| Properti             | Nilai                                |
| -------------------- | ------------------------------------ |
| Model video default  | `together/Wan-AI/Wan2.2-T2V-A14B`    |
| Mode                 | text-to-video, referensi satu gambar |
| Parameter yang didukung | `aspectRatio`, `resolution`       |

Untuk menggunakan Together sebagai penyedia video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama,
pemilihan penyedia, dan perilaku failover.
</Tip>

<AccordionGroup>
  <Accordion title="Catatan environment">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan
    `TOGETHER_API_KEY` tersedia untuk proses tersebut (misalnya, di
    `~/.openclaw/.env` atau melalui `env.shellEnv`).

    <Warning>
    Kunci yang hanya ditetapkan di shell interaktif Anda tidak terlihat oleh
    proses gateway yang dikelola daemon. Gunakan `~/.openclaw/.env` atau config `env.shellEnv` untuk
    ketersediaan yang persisten.
    </Warning>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Verifikasi bahwa kunci Anda berfungsi: `openclaw models list --provider together`
    - Jika model tidak muncul, pastikan kunci API ditetapkan di
      environment yang benar untuk proses Gateway Anda.
    - Ref model menggunakan format `together/<model-id>`.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Aturan penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat pembuatan video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema config lengkap termasuk pengaturan penyedia.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Dasbor Together AI, dokumentasi API, dan harga.
  </Card>
</CardGroup>
