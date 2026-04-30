---
read_when:
    - Anda ingin menggunakan model terbuka di OpenClaw secara gratis
    - Anda perlu menyiapkan NVIDIA_API_KEY
summary: Gunakan API NVIDIA yang kompatibel dengan OpenAI di OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T10:07:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA menyediakan API yang kompatibel dengan OpenAI di `https://integrate.api.nvidia.com/v1` untuk
model terbuka secara gratis. Autentikasikan dengan kunci API dari
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

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
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Jika Anda meneruskan `--nvidia-api-key` alih-alih variabel env, nilainya masuk ke riwayat
shell dan output `ps`. Sebaiknya gunakan variabel lingkungan `NVIDIA_API_KEY` jika
memungkinkan.
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
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Katalog bawaan

| Ref model                                  | Nama                         | Konteks | Output maks. |
| ------------------------------------------ | ---------------------------- | ------- | ------------ |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192        |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192        |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192        |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192        |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    Provider diaktifkan otomatis ketika variabel lingkungan `NVIDIA_API_KEY` ditetapkan.
    Tidak diperlukan konfigurasi provider eksplisit selain kunci tersebut.
  </Accordion>

  <Accordion title="Catalog and pricing">
    Katalog yang dibundel bersifat statis. Biaya default ke `0` di sumber karena NVIDIA
    saat ini menawarkan akses API gratis untuk model yang tercantum.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA menggunakan endpoint completions standar `/v1`. Tooling apa pun yang kompatibel
    dengan OpenAI seharusnya langsung berfungsi dengan URL dasar NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Model NVIDIA saat ini gratis untuk digunakan. Periksa
[build.nvidia.com](https://build.nvidia.com/) untuk ketersediaan terbaru dan
detail batas laju.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan provider.
  </Card>
</CardGroup>
