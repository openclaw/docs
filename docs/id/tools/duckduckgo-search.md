---
read_when:
    - Anda menginginkan provider pencarian web yang tidak memerlukan API key
    - Anda ingin menggunakan DuckDuckGo untuk `web_search`
    - Anda memerlukan fallback pencarian tanpa konfigurasi
summary: Pencarian web DuckDuckGo -- provider fallback tanpa key (eksperimental, berbasis HTML)
title: Pencarian DuckDuckGo
x-i18n:
    generated_at: "2026-04-05T14:07:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31f8e3883584534396c247c3d8069ea4c5b6399e0ff13a9dd0c8ee0c3da02096
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

# Pencarian DuckDuckGo

OpenClaw mendukung DuckDuckGo sebagai provider `web_search` **tanpa key**. Tidak memerlukan API
key atau akun.

<Warning>
  DuckDuckGo adalah integrasi **eksperimental dan tidak resmi** yang mengambil hasil
  dari halaman pencarian non-JavaScript milik DuckDuckGo — bukan API resmi. Harapkan
  kerusakan sesekali akibat halaman tantangan bot atau perubahan HTML.
</Warning>

## Penyiapan

Tidak perlu API key — cukup atur DuckDuckGo sebagai provider Anda:

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

Pengaturan opsional tingkat plugin untuk region dan SafeSearch:

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

## Parameter tool

| Parameter    | Deskripsi                                                  |
| ------------ | ---------------------------------------------------------- |
| `query`      | Kueri pencarian (wajib)                                    |
| `count`      | Hasil yang dikembalikan (1-10, default: 5)                 |
| `region`     | Kode region DuckDuckGo (mis. `us-en`, `uk-en`, `de-de`)    |
| `safeSearch` | Level SafeSearch: `strict`, `moderate` (default), atau `off` |

Region dan SafeSearch juga dapat diatur dalam konfigurasi plugin (lihat di atas) — parameter
tool menimpa nilai konfigurasi per kueri.

## Catatan

- **Tanpa API key** — langsung berfungsi, tanpa konfigurasi
- **Eksperimental** — mengumpulkan hasil dari halaman pencarian HTML non-JavaScript DuckDuckGo,
  bukan API atau SDK resmi
- **Risiko tantangan bot** — DuckDuckGo dapat menampilkan CAPTCHA atau memblokir permintaan
  dalam penggunaan berat atau otomatis
- **Parsing HTML** — hasil bergantung pada struktur halaman, yang dapat berubah tanpa
  pemberitahuan
- **Urutan auto-detection** — DuckDuckGo adalah fallback tanpa key pertama
  (urutan 100) dalam auto-detection. Provider berbasis API dengan key yang sudah dikonfigurasi dijalankan
  terlebih dahulu, lalu Ollama Web Search (urutan 110), lalu SearXNG (urutan 200)
- **SafeSearch default ke moderate** saat tidak dikonfigurasi

<Tip>
  Untuk penggunaan produksi, pertimbangkan [Brave Search](/tools/brave-search) (tersedia tier gratis)
  atau provider lain yang didukung API.
</Tip>

## Terkait

- [Ikhtisar Web Search](/tools/web) -- semua provider dan auto-detection
- [Brave Search](/tools/brave-search) -- hasil terstruktur dengan tier gratis
- [Exa Search](/tools/exa-search) -- pencarian neural dengan ekstraksi konten
