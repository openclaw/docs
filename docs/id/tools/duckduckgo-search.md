---
read_when:
    - Anda menginginkan provider web search yang tidak memerlukan API key
    - Anda ingin menggunakan DuckDuckGo untuk web_search
    - Anda memerlukan fallback pencarian tanpa konfigurasi
summary: DuckDuckGo web search -- provider fallback tanpa key (eksperimental, berbasis HTML)
title: Pencarian DuckDuckGo
x-i18n:
    generated_at: "2026-04-24T09:30:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw mendukung DuckDuckGo sebagai provider `web_search` **tanpa key**. Tidak diperlukan API
key atau akun.

<Warning>
  DuckDuckGo adalah integrasi **eksperimental, tidak resmi** yang menarik hasil
  dari halaman pencarian non-JavaScript DuckDuckGo — bukan API resmi. Harapkan
  sesekali rusak karena halaman tantangan bot atau perubahan HTML.
</Warning>

## Penyiapan

Tidak perlu API key — cukup setel DuckDuckGo sebagai provider Anda:

<Steps>
  <Step title="Konfigurasikan">
    ```bash
    openclaw configure --section web
    # Pilih "duckduckgo" sebagai provider
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

Pengaturan tingkat Plugin opsional untuk region dan SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // kode region DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate", atau "off"
          },
        },
      },
    },
  },
}
```

## Parameter tool

<ParamField path="query" type="string" required>
Kueri pencarian.
</ParamField>

<ParamField path="count" type="number" default="5">
Hasil yang akan dikembalikan (1–10).
</ParamField>

<ParamField path="region" type="string">
Kode region DuckDuckGo (mis. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Tingkat SafeSearch.
</ParamField>

Region dan SafeSearch juga dapat disetel di konfigurasi Plugin (lihat di atas) — parameter
tool menimpa nilai konfigurasi per kueri.

## Catatan

- **Tanpa API key** — langsung berfungsi, tanpa konfigurasi
- **Eksperimental** — mengumpulkan hasil dari halaman pencarian HTML non-JavaScript DuckDuckGo,
  bukan API atau SDK resmi
- **Risiko tantangan bot** — DuckDuckGo dapat menyajikan CAPTCHA atau memblokir permintaan
  pada penggunaan berat atau otomatis
- **Parsing HTML** — hasil bergantung pada struktur halaman, yang dapat berubah tanpa
  pemberitahuan
- **Urutan deteksi otomatis** — DuckDuckGo adalah fallback tanpa key pertama
  (urutan 100) dalam deteksi otomatis. Provider berbasis API dengan key yang dikonfigurasi dijalankan
  terlebih dahulu, lalu Ollama Web Search (urutan 110), lalu SearXNG (urutan 200)
- **SafeSearch default ke moderate** saat tidak dikonfigurasi

<Tip>
  Untuk penggunaan produksi, pertimbangkan [Brave Search](/id/tools/brave-search) (tersedia
  tingkat gratis) atau provider berbasis API lain.
</Tip>

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua provider dan deteksi otomatis
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan tingkat gratis
- [Exa Search](/id/tools/exa-search) -- pencarian neural dengan ekstraksi konten
