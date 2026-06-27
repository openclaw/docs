---
read_when:
    - Anda menginginkan penyedia pencarian web yang tidak memerlukan kunci API
    - Anda ingin menggunakan DuckDuckGo untuk web_search
    - Anda menginginkan penyedia pencarian tanpa kunci yang dipilih secara eksplisit
summary: Pencarian web DuckDuckGo -- penyedia tanpa kunci (eksperimental, berbasis HTML)
title: Pencarian DuckDuckGo
x-i18n:
    generated_at: "2026-06-27T18:17:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw mendukung DuckDuckGo sebagai penyedia `web_search` **tanpa kunci**. Tidak diperlukan kunci API atau akun.

<Warning>
  DuckDuckGo adalah integrasi **eksperimental dan tidak resmi** yang mengambil hasil
  dari halaman pencarian non-JavaScript DuckDuckGo - bukan API resmi. Antisipasi
  gangguan sesekali akibat halaman tantangan bot atau perubahan HTML.
</Warning>

## Penyiapan

Tidak perlu kunci API - cukup tetapkan DuckDuckGo sebagai penyedia Anda:

<Steps>
  <Step title="Konfigurasi">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Konfigurasi

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Pengaturan tingkat Plugin opsional untuk wilayah dan SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Parameter alat

<ParamField path="query" type="string" required>
Kueri pencarian.
</ParamField>

<ParamField path="count" type="number" default="5">
Hasil yang dikembalikan (1-10).
</ParamField>

<ParamField path="region" type="string">
Kode wilayah DuckDuckGo (misalnya `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Tingkat SafeSearch.
</ParamField>

Wilayah dan SafeSearch juga dapat ditetapkan dalam konfigurasi Plugin (lihat di atas) -
parameter alat menggantikan nilai konfigurasi per kueri.

## Catatan

- **Tanpa kunci API** - berfungsi setelah Anda memilih DuckDuckGo sebagai penyedia
  `web_search` Anda
- **Eksperimental** - mengumpulkan hasil dari halaman pencarian HTML non-JavaScript
  DuckDuckGo, bukan API atau SDK resmi
- **Risiko tantangan bot** - DuckDuckGo dapat menyajikan CAPTCHA atau memblokir permintaan
  dalam penggunaan berat atau otomatis
- **Penguraian HTML** - hasil bergantung pada struktur halaman, yang dapat berubah tanpa
  pemberitahuan
- **Pemilihan eksplisit** - OpenClaw tidak memilih DuckDuckGo secara otomatis
  ketika tidak ada penyedia berbasis API yang dikonfigurasi
- **SafeSearch default ke moderate** saat tidak dikonfigurasi

<Tip>
  Untuk penggunaan produksi, pertimbangkan [Brave Search](/id/tools/brave-search) (tingkat gratis
  tersedia) atau penyedia lain yang berbasis API.
</Tip>

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan tingkat gratis
- [Exa Search](/id/tools/exa-search) -- pencarian neural dengan ekstraksi konten
