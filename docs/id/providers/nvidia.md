---
read_when:
    - Anda ingin menggunakan model terbuka di OpenClaw secara gratis
    - Anda perlu menyiapkan NVIDIA_API_KEY
    - Anda ingin menggunakan Nemotron 3 Ultra melalui NVIDIA
summary: Gunakan API NVIDIA yang kompatibel dengan OpenAI di OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T18:05:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA menyediakan API yang kompatibel dengan OpenAI di `https://integrate.api.nvidia.com/v1` untuk
model terbuka secara gratis. Autentikasi dengan kunci API dari
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
menetapkan default penyedia NVIDIA ke Nemotron 3 Ultra, model reasoning aktif
550B total / 55B milik NVIDIA untuk pekerjaan agentic berkonteks panjang.

## Memulai

<Steps>
  <Step title="Get your API key">
    Buat kunci API di [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
Jika Anda meneruskan `--nvidia-api-key` alih-alih env var, nilainya masuk ke
riwayat shell dan output `ps`. Utamakan variabel lingkungan `NVIDIA_API_KEY`
jika memungkinkan.
</Warning>

Untuk penyiapan non-interaktif, Anda juga dapat meneruskan kunci secara langsung:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Contoh konfigurasi

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Katalog unggulan

Ketika kunci API NVIDIA dikonfigurasi, jalur penyiapan dan pemilihan model
OpenClaw mencoba katalog model unggulan publik NVIDIA dari
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` dan
menyimpan hasil berperingkat dalam cache selama 24 jam. Karena itu, model
unggulan baru dari build.nvidia.com muncul di permukaan penyiapan dan pemilihan
model tanpa menunggu rilis OpenClaw. Ketika feed langsung tersedia, model
pertama yang dikembalikan menjadi opsi default yang ditampilkan selama
penyiapan NVIDIA.

Pengambilan menggunakan kebijakan host HTTPS tetap untuk `assets.ngc.nvidia.com`.
Jika tidak ada kunci API NVIDIA yang dikonfigurasi, atau jika katalog publik
tersebut tidak tersedia atau malformed, OpenClaw kembali ke katalog bawaan dan
default bawaan di bawah ini.

## Nemotron 3 Ultra

Nemotron 3 Ultra adalah model NVIDIA default di OpenClaw. Halaman build NVIDIA untuk
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
mencantumkannya sebagai endpoint gratis yang tersedia dengan spesifikasi konteks
1 juta token. Katalog bawaan mencatat output maksimum 16.384 token agar sesuai
dengan permintaan contoh kompatibel OpenAI NVIDIA saat ini untuk endpoint yang
dihosting.

Gunakan Ultra untuk default NVIDIA dengan kapabilitas tertinggi. Tetap pilih
Super jika Anda menginginkan opsi Nemotron 3 yang lebih kecil, atau pilih salah
satu model pihak ketiga yang dihosting di katalog NVIDIA jika konteks, latensi,
atau perilakunya lebih sesuai. Baris Ultra bawaan mengirim
`chat_template_kwargs.enable_thinking: false` dan
`force_nonempty_content: true` secara default agar output chat normal tetap
berada dalam jawaban yang terlihat alih-alih mengekspos teks reasoning.

## Katalog fallback bawaan

| Ref model                                  | Nama                         | Konteks   | Output maks | Catatan                          |
| ------------------------------------------ | ---------------------------- | --------- | ----------- | -------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384      | Default                          |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192       | Fallback unggulan                |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192       | Fallback unggulan                |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192       | Fallback unggulan                |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192       | Fallback unggulan                |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192       | Usang, kompatibilitas upgrade    |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192       | Usang, kompatibilitas upgrade    |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    Penyedia diaktifkan otomatis ketika variabel lingkungan `NVIDIA_API_KEY` disetel.
    Tidak diperlukan konfigurasi penyedia eksplisit selain kunci.
  </Accordion>

  <Accordion title="Catalog and pricing">
    OpenClaw mengutamakan katalog model unggulan publik NVIDIA ketika auth NVIDIA
    dikonfigurasi dan menyimpannya dalam cache selama 24 jam. Katalog fallback
    bawaan bersifat statis dan mempertahankan ref rilis yang usang untuk
    kompatibilitas upgrade. Biaya default ke `0` di sumber karena NVIDIA saat ini
    menawarkan akses API gratis untuk model yang tercantum.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA menggunakan endpoint completions standar `/v1`. Tooling apa pun yang
    kompatibel dengan OpenAI seharusnya langsung berfungsi dengan URL dasar NVIDIA.
  </Accordion>

  <Accordion title="Nemotron 3 Ultra reasoning params">
    Permintaan contoh Ultra NVIDIA menggunakan `chat_template_kwargs.enable_thinking`
    dan `reasoning_budget` untuk output reasoning. Baris Ultra bawaan OpenClaw
    menonaktifkan template thinking secara default untuk penggunaan chat normal.
    Jika Anda perlu ikut memakai output reasoning NVIDIA atau memaksa field
    permintaan khusus NVIDIA lainnya, setel params per model dan batasi override
    khusus penyedia pada model NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` adalah override body permintaan akhir yang kompatibel
    dengan OpenAI, jadi gunakan hanya untuk field yang didokumentasikan NVIDIA
    untuk endpoint yang dipilih.

  </Accordion>

  <Accordion title="Slow custom provider responses">
    Beberapa model kustom yang dihosting NVIDIA dapat memerlukan waktu lebih lama
    daripada watchdog idle model default sebelum mengirim chunk respons pertama.
    Untuk entri penyedia NVIDIA kustom, naikkan timeout penyedia alih-alih
    menaikkan timeout seluruh runtime agen:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
Model NVIDIA saat ini gratis digunakan. Periksa
[build.nvidia.com](https://build.nvidia.com/) untuk detail ketersediaan dan
batas laju terbaru.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan penyedia.
  </Card>
</CardGroup>
