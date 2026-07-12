---
read_when:
    - Anda sedang menginstal, mengonfigurasi, atau mengaudit plugin microsoft-foundry
summary: Menambahkan dukungan penyedia model Microsoft Foundry ke OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-07-12T14:27:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Menambahkan dukungan penyedia model Microsoft Foundry ke OpenClaw.

## Distribusi

- Paket: `@openclaw/microsoft-foundry`
- Jalur instalasi: disertakan dalam OpenClaw

## Permukaan

penyedia: microsoft-foundry; kontrak: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Penyedia pembuatan gambar: `microsoft-foundry`

## Persyaratan

- Sumber daya Microsoft Foundry atau Azure AI Foundry yang memiliki deployment.
- Autentikasi kunci API melalui `AZURE_OPENAI_API_KEY` atau kunci API penyedia yang telah dikonfigurasi.
- Untuk autentikasi Entra ID, instal Azure CLI dan jalankan `az login` sebelum
  orientasi awal. OpenClaw menyegarkan token runtime Microsoft Foundry melalui
  `az account get-access-token`.

## Model percakapan

Deployment percakapan Microsoft Foundry menggunakan referensi model penyedia
`microsoft-foundry/<deployment-name>`. Orientasi awal menemukan sumber daya
dan deployment Foundry dengan Azure CLI, lalu menulis nama deployment yang dipilih
ke konfigurasi model.

OpenClaw menggunakan endpoint Foundry `/openai/v1` untuk API percakapan kompatibel
OpenAI yang didukung:

- Kelompok model GPT, `o*`, `computer-use-preview`, dan DeepSeek-V4 secara default menggunakan
  `openai-responses`.
- MAI-DS-R1 dan deployment penyelesaian percakapan lainnya menggunakan `openai-completions`,
  kecuali API yang didukung telah dikonfigurasi secara eksplisit.
- MAI-DS-R1 dicatat sebagai model yang mendukung penalaran melalui konten penalaran, bukan
  melalui `reasoning_effort`. Metadata token konteks dan keluarannya adalah
  163.840 token.

Deployment Anthropic Claude di Microsoft Foundry menggunakan format API Anthropic Messages,
bukan format kompatibel OpenAI `/openai/v1`. Konfigurasikan deployment tersebut sebagai
penyedia `anthropic-messages` khusus hingga Plugin Microsoft Foundry memiliki
runtime Anthropic native. Jika nama deployment Foundry berbeda dari ID model
Claude, tetapkan `params.canonicalModelId` pada entri model agar OpenClaw
dapat menerapkan kontrak komunikasi khusus model, memetakan `/think off` dengan benar, dan
mempertahankan pemikiran bertanda tangan dengan aman.

## Pembuatan gambar MAI

Plugin mendaftarkan `microsoft-foundry` untuk `image_generate` dengan model
gambar Microsoft AI saat ini:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Gunakan nama deployment gambar MAI yang telah di-deploy sebagai referensi model. Penyedia
tidak mendeklarasikan model gambar default karena API MAI memerlukan nama deployment Anda
dalam bidang permintaan `model`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

Pembuatan hanya dengan perintah teks memanggil endpoint pembuatan MAI Microsoft Foundry:
`/mai/v1/images/generations`. Pengeditan gambar referensi memanggil
`/mai/v1/images/edits` dan terbatas pada deployment `MAI-Image-2.5-Flash` dan
`MAI-Image-2.5`.

Pembuatan hanya dengan perintah teks dapat menggunakan nama deployment khusus hanya dengan endpoint
Foundry yang dikonfigurasi. Untuk pengeditan gambar dengan nama deployment khusus, pilih
deployment melalui orientasi awal atau sertakan metadata model agar OpenClaw dapat memverifikasi
bahwa deployment didukung oleh `MAI-Image-2.5-Flash` atau `MAI-Image-2.5`.

Batasan gambar MAI:

- Keluaran: satu gambar PNG per permintaan.
- Ukuran: default `1024x1024`; lebar dan tinggi masing-masing harus setidaknya 768 px.
- Total piksel: lebar × tinggi harus paling banyak 1.048.576.
- Pengeditan: satu gambar masukan PNG atau JPEG.
- Petunjuk bersama yang tidak didukung seperti `aspectRatio`, `resolution`, `quality`,
  `background`, dan `outputFormat` non-PNG tidak dikirim ke Microsoft Foundry.

## Pemecahan masalah

- `az: command not found`: instal Azure CLI atau gunakan autentikasi kunci API.
- `Microsoft Foundry endpoint missing for MAI image generation`: pilih
  deployment Foundry melalui orientasi awal atau tambahkan `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: model gambar yang dipilih mengarah ke
  deployment non-MAI. Gunakan model gambar MAI yang telah di-deploy untuk `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
