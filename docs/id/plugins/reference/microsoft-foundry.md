---
read_when:
    - Anda sedang memasang, mengonfigurasi, atau mengaudit Plugin microsoft-foundry
summary: Menambahkan dukungan penyedia model Microsoft Foundry ke OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-06-27T17:55:18Z"
    model: gpt-5.5
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
- Rute instalasi: disertakan dalam OpenClaw

## Permukaan

penyedia: microsoft-foundry; kontrak: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Penyedia pembuatan gambar: `microsoft-foundry`

## Persyaratan

- Sumber daya Microsoft Foundry atau Azure AI Foundry dengan deployment.
- Autentikasi kunci API melalui `AZURE_OPENAI_API_KEY` atau kunci API penyedia yang dikonfigurasi.
- Untuk autentikasi Entra ID, instal Azure CLI dan jalankan `az login` sebelum
  penyiapan awal. OpenClaw menyegarkan token runtime Microsoft Foundry melalui
  `az account get-access-token`.

## Model chat

Deployment chat Microsoft Foundry menggunakan referensi model penyedia
`microsoft-foundry/<deployment-name>`. Penyiapan awal menemukan sumber daya
dan deployment Foundry dengan Azure CLI, lalu menulis nama deployment yang dipilih ke
konfigurasi model.

OpenClaw menggunakan endpoint `/openai/v1` Foundry untuk API chat kompatibel OpenAI
yang didukung:

- Keluarga model GPT, `o*`, `computer-use-preview`, dan DeepSeek-V4 secara default menggunakan
  `openai-responses`.
- Deployment MAI-DS-R1 dan chat-completion lainnya menggunakan `openai-completions`
  kecuali API yang didukung dikonfigurasi secara eksplisit.
- MAI-DS-R1 dicatat sebagai mampu melakukan penalaran melalui konten penalaran, bukan
  melalui `reasoning_effort`. Metadata token konteks dan outputnya adalah
  163.840 token.

Deployment Anthropic Claude di Microsoft Foundry menggunakan bentuk API Anthropic Messages,
bukan bentuk `/openai/v1` yang kompatibel OpenAI. Konfigurasikan ini sebagai
penyedia `anthropic-messages` kustom hingga Plugin Microsoft Foundry menambahkan
runtime Anthropic native. Ketika nama deployment Foundry berbeda dari ID model
Claude, atur `params.canonicalModelId` pada entri model agar OpenClaw
dapat menerapkan kontrak protokol khusus model, memetakan `/think off` dengan benar, dan
mempertahankan pemikiran bertanda tangan dengan aman.

## Pembuatan gambar MAI

Plugin mendaftarkan `microsoft-foundry` untuk `image_generate` dengan model gambar
Microsoft AI saat ini:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Gunakan nama deployment gambar MAI yang sudah di-deploy sebagai referensi model. Penyedia tidak
mendeklarasikan model gambar default karena API MAI memerlukan nama deployment Anda
di bidang `model` permintaan:

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

Panggilan pembuatan hanya dengan prompt menggunakan endpoint pembuatan MAI Microsoft Foundry:
`/mai/v1/images/generations`. Edit gambar referensi memanggil
`/mai/v1/images/edits` dan dibatasi untuk deployment `MAI-Image-2.5-Flash` dan
`MAI-Image-2.5`.

Pembuatan hanya dengan prompt dapat menggunakan nama deployment kustom hanya dengan endpoint Foundry
yang dikonfigurasi. Untuk edit gambar dengan nama deployment kustom, pilih
deployment melalui penyiapan awal atau sertakan metadata model agar OpenClaw dapat memverifikasi
bahwa deployment didukung oleh `MAI-Image-2.5-Flash` atau `MAI-Image-2.5`.

Batasan gambar MAI:

- Output: satu gambar PNG per permintaan.
- Ukuran: default `1024x1024`; lebar dan tinggi masing-masing harus minimal 768 px.
- Total piksel: lebar × tinggi maksimal 1.048.576.
- Edit: satu gambar input PNG atau JPEG.
- Petunjuk bersama yang tidak didukung seperti `aspectRatio`, `resolution`, `quality`,
  `background`, dan `outputFormat` non-PNG tidak dikirim ke Microsoft Foundry.

## Pemecahan masalah

- `az: command not found`: instal Azure CLI atau gunakan autentikasi kunci API.
- `Microsoft Foundry endpoint missing for MAI image generation`: pilih
  deployment Foundry melalui penyiapan awal atau tambahkan `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: model gambar yang dipilih mengarah ke
  deployment non-MAI. Gunakan model gambar MAI yang sudah di-deploy untuk `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
