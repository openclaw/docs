---
read_when:
    - Anda ingin menggunakan Together AI dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
summary: Penyiapan Together AI (autentikasi + pemilihan model)
title: Together AI
x-i18n:
    generated_at: "2026-07-19T05:09:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9b08cae93c1ea7df46e1d2fbe78692f73bb3e56809122f70a56eec8b3dc5d8a4
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) menyediakan akses ke model sumber terbuka terkemuka
termasuk Llama, DeepSeek, Kimi, dan lainnya melalui API terpadu.
OpenClaw menyertakannya sebagai penyedia `together`.

| Properti | Nilai                         |
| -------- | ----------------------------- |
| Penyedia | `together`                    |
| Autentikasi | `TOGETHER_API_KEY`            |
| API      | Kompatibel dengan OpenAI             |
| URL dasar | `https://api.together.xyz/v1` |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API">
    Buat kunci API di
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Jalankan orientasi awal">
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

### Contoh noninteraktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
Orientasi awal menetapkan `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` sebagai
model default.
</Note>

## Katalog bawaan

Biaya dalam USD per satu juta token.

| Referensi model                                     | Nama                         | Masukan     | Konteks | Keluaran maks. | Biaya (masuk/keluar) | Catatan                    |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | ---------- | ------------- | ------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | teks        | 131,072 | 8,192      | 0.88 / 0.88   | Model default              |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | teks, gambar | 262,144 | 32,768     | 1.20 / 4.50   | Model penalaran            |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | teks        | 512,000 | 8,192      | 2.10 / 4.40   | Model penalaran            |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | teks        | 32,768  | 8,192      | 0.30 / 0.30   | Cepat, tanpa penalaran     |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | teks        | 202,752 | 8,192      | 1.40 / 4.40   | Model penalaran            |

## Pembuatan video

Plugin `together` bawaan juga mendaftarkan pembuatan video melalui
alat `video_generate` bersama.

| Properti             | Nilai                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Model video default  | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| Model lainnya        | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/hailuo-02`, `kwaivgI/kling-2.1-master`                 |
| Mode                 | teks-ke-video; gambar-ke-video hanya dengan `Wan-AI/Wan2.2-I2V-A14B` (satu gambar referensi) |
| Durasi               | 1-10 detik                                                                              |
| Parameter yang didukung | `size` (diuraikan sebagai `<width>x<height>`); `aspectRatio`/`resolution` tidak dibaca            |

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
Lihat [Pembuatan video](/id/tools/video-generation) untuk parameter alat bersama,
pemilihan penyedia, dan perilaku failover.
</Tip>

<AccordionGroup>
  <Accordion title="Catatan lingkungan">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan
    `TOGETHER_API_KEY` tersedia bagi proses tersebut (misalnya, di
    `~/.openclaw/.env` atau melalui `env.shellEnv`).

    <Warning>
    Kunci yang hanya ditetapkan di shell interaktif Anda tidak terlihat oleh proses
    Gateway yang dikelola daemon. Gunakan konfigurasi `~/.openclaw/.env` atau `env.shellEnv`
    agar selalu tersedia.
    </Warning>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Verifikasi bahwa kunci Anda berfungsi: `openclaw models list --provider together`
    - Jika model tidak muncul, pastikan kunci API ditetapkan di lingkungan yang tepat
      untuk proses Gateway Anda.
    - Referensi model menggunakan format `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Aturan penyedia, referensi model, dan perilaku failover.
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
