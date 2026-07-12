---
read_when:
    - Anda menginginkan penyedia pencarian web yang tidak memerlukan kunci API
    - Anda ingin menggunakan DuckDuckGo untuk web_search
    - Anda menginginkan penyedia pencarian tanpa kunci yang dipilih secara eksplisit
summary: Pencarian web DuckDuckGo -- penyedia tanpa kunci (eksperimental, berbasis HTML)
title: Pencarian DuckDuckGo
x-i18n:
    generated_at: "2026-07-12T14:46:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw mendukung DuckDuckGo sebagai penyedia `web_search` **tanpa kunci**. Tidak diperlukan kunci API atau akun.

<Warning>
  DuckDuckGo adalah integrasi **eksperimental dan tidak resmi** yang melakukan scraping pada halaman pencarian HTML non-JavaScript DuckDuckGo—bukan API resmi. Bersiaplah menghadapi gangguan sesekali akibat halaman tantangan bot atau perubahan HTML.
</Warning>

## Penyiapan

DuckDuckGo tidak pernah dipilih secara otomatis karena deteksi otomatis hanya mempertimbangkan penyedia dengan kredensial yang dapat digunakan. Tetapkan secara eksplisit:

<Steps>
  <Step title="Konfigurasi">
    ```bash
    openclaw configure --section web
    # Pilih "duckduckgo" sebagai penyedia
    ```
  </Step>
</Steps>

## Konfigurasi

Tetapkan penyedia secara langsung dalam konfigurasi:

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

Pengaturan opsional tingkat Plugin untuk wilayah dan SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // Kode wilayah DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate", atau "off"
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
Jumlah hasil yang dikembalikan (1–10).
</ParamField>

<ParamField path="region" type="string">
Kode wilayah DuckDuckGo (misalnya `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Tingkat SafeSearch.
</ParamField>

Parameter alat `region` dan `safeSearch` menggantikan nilai konfigurasi Plugin di atas untuk setiap kueri.

## Catatan

- **Tanpa kunci API**—berfungsi setelah DuckDuckGo dipilih sebagai penyedia `web_search`.
- **Eksperimental**—melakukan scraping pada halaman pencarian HTML non-JavaScript DuckDuckGo, bukan API atau SDK resmi. Hasil bergantung pada struktur halaman, yang dapat berubah tanpa pemberitahuan.
- **Risiko tantangan bot**—DuckDuckGo dapat menyajikan CAPTCHA atau memblokir permintaan saat penggunaan berat atau otomatis.
- **Hanya pemilihan eksplisit**—deteksi otomatis OpenClaw hanya mempertimbangkan penyedia dengan kredensial yang dapat digunakan, sehingga penyedia tanpa kunci seperti DuckDuckGo tidak pernah dipilih secara otomatis; Anda harus menetapkan `provider: "duckduckgo"`.
- **SafeSearch secara default menggunakan `moderate`** jika tidak dikonfigurasi.

<Tip>
  Untuk penggunaan produksi, pertimbangkan [Brave Search](/id/tools/brave-search) (tersedia tingkat gratis) atau penyedia lain yang didukung API.
</Tip>

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web)—semua penyedia dan deteksi otomatis
- [Brave Search](/id/tools/brave-search)—hasil terstruktur dengan tingkat gratis
- [Exa Search](/id/tools/exa-search)—pencarian neural dengan ekstraksi konten
