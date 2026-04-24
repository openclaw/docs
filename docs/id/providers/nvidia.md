---
read_when:
    - Anda ingin menggunakan model terbuka di OpenClaw secara gratis
    - Anda memerlukan penyiapan NVIDIA_API_KEY
summary: Gunakan API kompatibel OpenAI milik NVIDIA di OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-24T09:23:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

NVIDIA menyediakan API yang kompatibel dengan OpenAI di `https://integrate.api.nvidia.com/v1` untuk
model terbuka secara gratis. Lakukan autentikasi dengan kunci API dari
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Memulai

<Steps>
  <Step title="Dapatkan kunci API Anda">
    Buat kunci API di [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Ekspor kunci dan jalankan onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="Tetapkan model NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Jika Anda meneruskan `--token` alih-alih variabel env, nilainya akan masuk ke riwayat shell dan
output `ps`. Jika memungkinkan, utamakan variabel lingkungan `NVIDIA_API_KEY`.
</Warning>

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

| Referensi model                                  | Nama                         | Konteks | Output maks |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Perilaku aktif otomatis">
    Provider akan aktif otomatis saat variabel lingkungan `NVIDIA_API_KEY` ditetapkan.
    Tidak diperlukan konfigurasi provider eksplisit selain kunci tersebut.
  </Accordion>

  <Accordion title="Katalog dan harga">
    Katalog bawaan bersifat statis. Biaya secara default bernilai `0` di source karena NVIDIA
    saat ini menawarkan akses API gratis untuk model yang tercantum.
  </Accordion>

  <Accordion title="Endpoint yang kompatibel dengan OpenAI">
    NVIDIA menggunakan endpoint completions standar `/v1`. Alat apa pun yang kompatibel dengan OpenAI
    seharusnya langsung berfungsi dengan base URL NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Model NVIDIA saat ini gratis untuk digunakan. Periksa
[build.nvidia.com](https://build.nvidia.com/) untuk ketersediaan terbaru dan
detail rate limit.
</Tip>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan provider.
  </Card>
</CardGroup>
