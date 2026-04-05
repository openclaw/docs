---
read_when:
    - Anda ingin penyedia pencarian web self-hosted
    - Anda ingin menggunakan SearXNG untuk `web_search`
    - Anda memerlukan opsi pencarian yang berfokus pada privasi atau air-gapped
summary: Pencarian web SearXNG -- penyedia meta-search self-hosted tanpa key
title: Pencarian SearXNG
x-i18n:
    generated_at: "2026-04-05T14:09:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a8fc7f890b7595d17c5ef8aede9b84bb2459f30a53d5d87c4e7423e1ac83ca5
    source_path: tools/searxng-search.md
    workflow: 15
---

# Pencarian SearXNG

OpenClaw mendukung [SearXNG](https://docs.searxng.org/) sebagai penyedia `web_search` **self-hosted,
tanpa key**. SearXNG adalah mesin meta-search open-source
yang menggabungkan hasil dari Google, Bing, DuckDuckGo, dan sumber lainnya.

Keuntungan:

- **Gratis dan tanpa batas** -- tidak memerlukan API key atau langganan komersial
- **Privasi / air-gap** -- kueri tidak pernah keluar dari jaringan Anda
- **Berfungsi di mana saja** -- tidak ada pembatasan wilayah pada API pencarian komersial

## Penyiapan

<Steps>
  <Step title="Jalankan instance SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Atau gunakan deployment SearXNG yang sudah ada dan dapat Anda akses. Lihat
    [dokumentasi SearXNG](https://docs.searxng.org/) untuk penyiapan produksi.

  </Step>
  <Step title="Konfigurasi">
    ```bash
    openclaw configure --section web
    # Pilih "searxng" sebagai penyedia
    ```

    Atau tetapkan env var dan biarkan deteksi otomatis menemukannya:

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

Pengaturan tingkat plugin untuk instance SearXNG:

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

- `https://` berfungsi untuk host SearXNG publik atau privat
- `http://` hanya diterima untuk host jaringan privat atau loopback yang tepercaya
- host SearXNG publik harus menggunakan `https://`

## Variabel lingkungan

Tetapkan `SEARXNG_BASE_URL` sebagai alternatif untuk konfigurasi:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Saat `SEARXNG_BASE_URL` ditetapkan dan tidak ada penyedia eksplisit yang dikonfigurasi, deteksi otomatis
akan memilih SearXNG secara otomatis (pada prioritas terendah -- penyedia berbasis API apa pun dengan
key akan menang terlebih dahulu).

## Referensi konfigurasi plugin

| Field        | Deskripsi                                                         |
| ------------ | ----------------------------------------------------------------- |
| `baseUrl`    | URL dasar instance SearXNG Anda (wajib)                           |
| `categories` | Kategori yang dipisahkan koma seperti `general`, `news`, atau `science` |
| `language`   | Kode bahasa untuk hasil seperti `en`, `de`, atau `fr`             |

## Catatan

- **API JSON** -- menggunakan endpoint `format=json` native milik SearXNG, bukan scraping HTML
- **Tanpa API key** -- langsung berfungsi dengan instance SearXNG apa pun
- **Validasi URL dasar** -- `baseUrl` harus berupa URL `http://` atau `https://`
  yang valid; host publik harus menggunakan `https://`
- **Urutan deteksi otomatis** -- SearXNG diperiksa terakhir (urutan 200) dalam
  deteksi otomatis. Penyedia berbasis API dengan key yang dikonfigurasi dijalankan terlebih dahulu, lalu
  DuckDuckGo (urutan 100), lalu Ollama Web Search (urutan 110)
- **Self-hosted** -- Anda mengendalikan instance, kueri, dan mesin pencarian upstream
- **Categories** default ke `general` saat tidak dikonfigurasi

<Tip>
  Agar API JSON SearXNG berfungsi, pastikan instance SearXNG Anda mengaktifkan format `json`
  di `settings.yml` pada `search.formats`.
</Tip>

## Terkait

- [Gambaran umum Web Search](/tools/web) -- semua penyedia dan deteksi otomatis
- [Pencarian DuckDuckGo](/tools/duckduckgo-search) -- fallback tanpa key lainnya
- [Pencarian Brave](/tools/brave-search) -- hasil terstruktur dengan tier gratis
