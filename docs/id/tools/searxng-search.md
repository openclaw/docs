---
read_when:
    - Anda menginginkan provider web search self-hosted@endsection to=final
    - Anda ingin menggunakan SearXNG untuk `web_search`
    - Anda memerlukan opsi pencarian yang berfokus pada privasi atau air-gapped
summary: Pencarian web SearXNG -- provider meta-search self-hosted tanpa key
title: Pencarian SearXNG
x-i18n:
    generated_at: "2026-04-24T09:32:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

OpenClaw mendukung [SearXNG](https://docs.searxng.org/) sebagai provider `web_search` **self-hosted, tanpa key**. SearXNG adalah meta-search engine open-source
yang menggabungkan hasil dari Google, Bing, DuckDuckGo, dan sumber lainnya.

Keuntungan:

- **Gratis dan tanpa batas** -- tidak memerlukan API key atau langganan komersial
- **Privasi / air-gap** -- kueri tidak pernah keluar dari jaringan Anda
- **Berfungsi di mana saja** -- tidak ada pembatasan region pada API pencarian komersial

## Penyiapan

<Steps>
  <Step title="Jalankan instance SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Atau gunakan deployment SearXNG yang sudah ada dan dapat Anda akses. Lihat
    [dokumentasi SearXNG](https://docs.searxng.org/) untuk penyiapan produksi.

  </Step>
  <Step title="Konfigurasikan">
    ```bash
    openclaw configure --section web
    # Pilih "searxng" sebagai provider
    ```

    Atau setel env var dan biarkan auto-detection menemukannya:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Konfigurasi

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Pengaturan tingkat Plugin untuk instance SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // opsional
            language: "en", // opsional
          },
        },
      },
    },
  },
}
```

Field `baseUrl` juga menerima objek SecretRef.

Aturan transport:

- `https://` berfungsi untuk host SearXNG publik maupun private
- `http://` hanya diterima untuk host trusted private-network atau loopback
- host SearXNG publik harus menggunakan `https://`

## Variabel lingkungan

Setel `SEARXNG_BASE_URL` sebagai alternatif untuk konfigurasi:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Ketika `SEARXNG_BASE_URL` diatur dan tidak ada provider eksplisit yang dikonfigurasi, auto-detection
akan memilih SearXNG secara otomatis (dengan prioritas terendah -- provider berbasis API apa pun dengan
key akan menang terlebih dahulu).

## Referensi konfigurasi Plugin

| Field        | Deskripsi                                                        |
| ------------ | ---------------------------------------------------------------- |
| `baseUrl`    | Base URL instance SearXNG Anda (wajib)                           |
| `categories` | Kategori yang dipisahkan koma seperti `general`, `news`, atau `science` |
| `language`   | Kode bahasa untuk hasil seperti `en`, `de`, atau `fr`            |

## Catatan

- **API JSON** -- menggunakan endpoint `format=json` native milik SearXNG, bukan HTML scraping
- **Tanpa API key** -- berfungsi langsung dengan instance SearXNG apa pun
- **Validasi base URL** -- `baseUrl` harus berupa URL `http://` atau `https://`
  yang valid; host publik harus menggunakan `https://`
- **Urutan auto-detection** -- SearXNG diperiksa terakhir (urutan 200) dalam
  auto-detection. Provider berbasis API dengan key yang dikonfigurasi dijalankan terlebih dahulu, lalu
  DuckDuckGo (urutan 100), lalu Ollama Web Search (urutan 110)
- **Self-hosted** -- Anda mengontrol instance, kueri, dan search engine upstream
- **Categories** default ke `general` ketika tidak dikonfigurasi

<Tip>
  Agar API JSON SearXNG berfungsi, pastikan instance SearXNG Anda mengaktifkan format `json`
  di `settings.yml` pada `search.formats`.
</Tip>

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua provider dan auto-detection
- [DuckDuckGo Search](/id/tools/duckduckgo-search) -- fallback tanpa key lainnya
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan tingkat gratis
