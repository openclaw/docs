---
read_when:
    - Anda menginginkan penyedia pencarian web yang tidak memerlukan kunci API
    - Anda ingin menggunakan DuckDuckGo untuk web_search
    - Anda memerlukan mekanisme pencarian cadangan tanpa konfigurasi
summary: Pencarian web DuckDuckGo -- penyedia cadangan tanpa kunci (eksperimental, berbasis HTML)
title: Pencarian DuckDuckGo
x-i18n:
    generated_at: "2026-05-06T09:30:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw mendukung DuckDuckGo sebagai penyedia `web_search` **tanpa kunci**. Tidak diperlukan kunci API atau akun.

<Warning>
  DuckDuckGo adalah integrasi **eksperimental, tidak resmi** yang mengambil hasil
  dari halaman pencarian non-JavaScript DuckDuckGo - bukan API resmi. Bersiaplah
  menghadapi gangguan sesekali dari halaman tantangan bot atau perubahan HTML.
</Warning>

## Penyiapan

Tidak perlu kunci API - cukup atur DuckDuckGo sebagai penyedia Anda:

<Steps>
  <Step title="Konfigurasikan">
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
Hasil yang akan dikembalikan (1-10).
</ParamField>

<ParamField path="region" type="string">
Kode wilayah DuckDuckGo (mis. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Tingkat SafeSearch.
</ParamField>

Wilayah dan SafeSearch juga dapat diatur dalam konfigurasi Plugin (lihat di atas) - parameter
alat menggantikan nilai konfigurasi per kueri.

## Catatan

- **Tidak ada kunci API** - langsung berfungsi, tanpa konfigurasi
- **Eksperimental** - mengumpulkan hasil dari halaman pencarian HTML non-JavaScript
  DuckDuckGo, bukan API atau SDK resmi
- **Risiko tantangan bot** - DuckDuckGo dapat menyajikan CAPTCHA atau memblokir permintaan
  saat penggunaan berat atau otomatis
- **Penguraian HTML** - hasil bergantung pada struktur halaman, yang dapat berubah tanpa
  pemberitahuan
- **Urutan deteksi otomatis** - DuckDuckGo adalah fallback tanpa kunci pertama
  (urutan 100) dalam deteksi otomatis. Penyedia berbasis API dengan kunci yang dikonfigurasi berjalan
  terlebih dahulu, lalu Ollama Web Search (urutan 110), lalu SearXNG (urutan 200)
- **SafeSearch default ke moderate** saat tidak dikonfigurasi

<Tip>
  Untuk penggunaan produksi, pertimbangkan [Brave Search](/id/tools/brave-search) (tingkat gratis
  tersedia) atau penyedia berbasis API lainnya.
</Tip>

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan tingkat gratis
- [Exa Search](/id/tools/exa-search) -- pencarian neural dengan ekstraksi konten
