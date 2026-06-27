---
read_when:
    - Anda ingin menggunakan Together AI dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan Together AI (autentikasi + pemilihan model)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:07:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) menyediakan akses ke model open-source terkemuka
termasuk Llama, DeepSeek, Kimi, dan lainnya melalui API terpadu.

| Properti  | Nilai                         |
| --------- | ----------------------------- |
| Penyedia  | `together`                    |
| Autentikasi | `TOGETHER_API_KEY`          |
| API       | Kompatibel dengan OpenAI      |
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
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
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
Preset onboarding menetapkan
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` sebagai model default.
</Note>

## Katalog bawaan

OpenClaw menyertakan katalog Together bawaan ini:

| Ref model                                          | Nama                         | Input       | Konteks | Catatan              |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | teks        | 131,072 | Model default        |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | teks, gambar | 262,144 | Model penalaran Kimi |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | teks        | 512,000 | Model teks penalaran |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | teks        | 32,768  | Model teks cepat     |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | teks        | 202,752 | Model teks penalaran |

## Pembuatan video

Plugin `together` bawaan juga mendaftarkan pembuatan video melalui
alat bersama `video_generate`.

| Properti              | Nilai                                                                    |
| --------------------- | ------------------------------------------------------------------------ |
| Model video default   | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| Mode                  | teks-ke-video; referensi satu gambar hanya dengan `Wan-AI/Wan2.2-I2V-A14B` |
| Parameter yang didukung | `aspectRatio`, `resolution`                                            |

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
  <Accordion title="Catatan lingkungan">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan
    `TOGETHER_API_KEY` tersedia untuk proses tersebut (misalnya, di
    `~/.openclaw/.env` atau melalui `env.shellEnv`).

    <Warning>
    Kunci yang hanya ditetapkan di shell interaktif Anda tidak terlihat oleh
    proses gateway yang dikelola daemon. Gunakan konfigurasi `~/.openclaw/.env`
    atau `env.shellEnv` untuk ketersediaan persisten.
    </Warning>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Verifikasi kunci Anda berfungsi: `openclaw models list --provider together`
    - Jika model tidak muncul, pastikan kunci API ditetapkan di lingkungan yang
      benar untuk proses Gateway Anda.
    - Ref model menggunakan bentuk `together/<model-id>`.

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
    Skema konfigurasi lengkap termasuk pengaturan penyedia.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Dasbor Together AI, dokumen API, dan harga.
  </Card>
</CardGroup>
