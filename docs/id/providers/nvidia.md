---
read_when:
    - Anda ingin menggunakan model terbuka di OpenClaw secara gratis
    - Anda perlu menyiapkan NVIDIA_API_KEY
summary: Gunakan API NVIDIA yang kompatibel dengan OpenAI di OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:24:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA menyediakan API yang kompatibel dengan OpenAI di `https://integrate.api.nvidia.com/v1` untuk
model terbuka secara gratis. Autentikasikan dengan kunci API dari
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Memulai

<Steps>
  <Step title="Dapatkan kunci API Anda">
    Buat kunci API di [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Ekspor kunci dan jalankan onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Atur model NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Jika Anda meneruskan `--nvidia-api-key` alih-alih variabel env, nilainya akan tersimpan di
riwayat shell dan keluaran `ps`. Sebaiknya gunakan variabel lingkungan `NVIDIA_API_KEY` jika
memungkinkan.
</Warning>

Untuk penyiapan noninteraktif, Anda juga dapat meneruskan kunci secara langsung:

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
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Katalog bawaan

| Ref model                                  | Nama                         | Konteks | Output maks |
| ------------------------------------------ | ---------------------------- | ------- | ----------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192       |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192       |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192       |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192       |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Perilaku aktif otomatis">
    Provider aktif otomatis ketika variabel lingkungan `NVIDIA_API_KEY` ditetapkan.
    Tidak diperlukan konfigurasi provider eksplisit selain kunci tersebut.
  </Accordion>

  <Accordion title="Katalog dan harga">
    Katalog yang dibundel bersifat statis. Biaya secara default bernilai `0` dalam sumber karena NVIDIA
    saat ini menawarkan akses API gratis untuk model yang tercantum.
  </Accordion>

  <Accordion title="Endpoint yang kompatibel dengan OpenAI">
    NVIDIA menggunakan endpoint completions `/v1` standar. Tooling apa pun yang kompatibel dengan OpenAI
    seharusnya langsung berfungsi dengan URL dasar NVIDIA.
  </Accordion>

  <Accordion title="Respons provider kustom yang lambat">
    Beberapa model kustom yang di-hosting NVIDIA dapat memerlukan waktu lebih lama daripada watchdog idle
    model default sebelum memancarkan potongan respons pertama. Untuk entri provider NVIDIA kustom,
    naikkan timeout provider alih-alih menaikkan timeout runtime seluruh agent:

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
Model NVIDIA saat ini gratis untuk digunakan. Periksa
[build.nvidia.com](https://build.nvidia.com/) untuk ketersediaan terbaru dan
detail batas laju.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agent, model, dan provider.
  </Card>
</CardGroup>
