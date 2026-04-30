---
read_when:
    - Anda ingin menggunakan Together AI dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan Together AI (autentikasi + pemilihan model)
title: Together AI
x-i18n:
    generated_at: "2026-04-30T10:09:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) menyediakan akses ke model open-source terkemuka
termasuk Llama, DeepSeek, Kimi, dan lainnya melalui API terpadu.

| Properti      | Nilai                         |
| ------------- | ----------------------------- |
| Penyedia      | `together`                    |
| Autentikasi   | `TOGETHER_API_KEY`            |
| API           | Kompatibel dengan OpenAI      |
| URL dasar     | `https://api.together.xyz/v1` |

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

### Contoh noninteraktif

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

OpenClaw menyertakan katalog Together bawaan ini:

| Ref model                                                   | Nama                                   | Input       | Konteks    | Catatan                                   |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | ----------------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | teks, gambar | 262,144    | Model default; penalaran diaktifkan       |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | teks        | 202,752    | Model teks serbaguna                      |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | teks        | 131,072    | Model instruksi cepat                     |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | teks, gambar | 10,000,000 | Multimodal                                |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | teks, gambar | 20,000,000 | Multimodal                                |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | teks        | 131,072    | Model teks umum                           |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | teks        | 131,072    | Model penalaran                           |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | teks        | 262,144    | Model teks Kimi sekunder                  |

## Pembuatan video

Plugin `together` bawaan juga mendaftarkan pembuatan video melalui alat
bersama `video_generate`.

| Properti             | Nilai                                 |
| -------------------- | ------------------------------------- |
| Model video default  | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| Mode                 | teks-ke-video, referensi gambar tunggal |
| Parameter yang didukung | `aspectRatio`, `resolution`           |

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
    Kunci yang hanya diatur di shell interaktif Anda tidak terlihat oleh proses
    gateway yang dikelola daemon. Gunakan konfigurasi `~/.openclaw/.env` atau
    `env.shellEnv` agar tersedia secara persisten.
    </Warning>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Verifikasi kunci Anda berfungsi: `openclaw models list --provider together`
    - Jika model tidak muncul, pastikan kunci API diatur di lingkungan yang benar
      untuk proses Gateway Anda.
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
    Dasbor Together AI, dokumentasi API, dan harga.
  </Card>
</CardGroup>
