---
read_when:
    - Anda menginginkan penyedia pencarian web yang dihosting sendiri
    - Anda ingin menggunakan SearXNG untuk web_search
    - Anda membutuhkan opsi pencarian yang berfokus pada privasi atau terisolasi sepenuhnya dari jaringan
summary: Pencarian web SearXNG -- penyedia meta-pencarian yang dihosting sendiri dan tanpa kunci
title: Pencarian SearXNG
x-i18n:
    generated_at: "2026-05-02T09:35:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9be62f7398379e1672ea7e934a571a529cac07dc5d880ac74e51f8445594034
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw mendukung [SearXNG](https://docs.searxng.org/) sebagai penyedia `web_search` **dihosting sendiri,
tanpa kunci**. SearXNG adalah mesin metapencari sumber terbuka
yang mengagregasi hasil dari Google, Bing, DuckDuckGo, dan sumber lain.

Keunggulan:

- **Gratis dan tanpa batas** -- tidak memerlukan kunci API atau langganan komersial
- **Privasi / isolasi jaringan** -- kueri tidak pernah keluar dari jaringan Anda
- **Berfungsi di mana saja** -- tidak ada batasan wilayah pada API pencarian komersial

## Penyiapan

<Steps>
  <Step title="Run a SearXNG instance">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Atau gunakan deployment SearXNG yang sudah ada dan dapat Anda akses. Lihat
    [dokumentasi SearXNG](https://docs.searxng.org/) untuk penyiapan produksi.

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Atau atur env var dan biarkan deteksi otomatis menemukannya:

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

Pengaturan tingkat Plugin untuk instans SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

Kolom `baseUrl` juga menerima objek SecretRef.

Aturan transport:

- `https://` berfungsi untuk host SearXNG publik atau privat
- `http://` hanya diterima untuk host jaringan privat tepercaya atau loopback
- host SearXNG publik harus menggunakan `https://`
- host privat/internal menggunakan pelindung jaringan yang dihosting sendiri; host
  `https://` publik tetap berada pada pelindung pencarian web yang ketat dan tidak dapat
  mengalihkan ke alamat privat

## Variabel lingkungan

Atur `SEARXNG_BASE_URL` sebagai alternatif konfigurasi:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Saat `SEARXNG_BASE_URL` diatur dan tidak ada penyedia eksplisit yang dikonfigurasi, deteksi otomatis
memilih SearXNG secara otomatis (dengan prioritas terendah -- penyedia berbasis API apa pun dengan
kunci akan dipilih lebih dulu).

## Referensi konfigurasi Plugin

| Kolom        | Deskripsi                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL dasar instans SearXNG Anda (wajib)                       |
| `categories` | Kategori yang dipisahkan koma seperti `general`, `news`, atau `science` |
| `language`   | Kode bahasa untuk hasil seperti `en`, `de`, atau `fr`              |

## Catatan

- **API JSON** -- menggunakan endpoint asli SearXNG `format=json`, bukan scraping HTML
- **URL hasil gambar** -- hasil kategori gambar menyertakan `img_src` saat SearXNG
  mengembalikan URL gambar langsung
- **Tanpa kunci API** -- berfungsi dengan instans SearXNG apa pun langsung dari awal
- **Validasi URL dasar** -- `baseUrl` harus berupa URL `http://` atau `https://`
  yang valid; host publik harus menggunakan `https://`
- **Pelindung jaringan** -- endpoint SearXNG privat/internal memilih untuk mengaktifkan
  akses jaringan privat; endpoint SearXNG `https://` publik mempertahankan perlindungan
  SSRF yang ketat
- **Urutan deteksi otomatis** -- SearXNG diperiksa terakhir (urutan 200) dalam
  deteksi otomatis. Penyedia berbasis API dengan kunci yang dikonfigurasi berjalan lebih dulu, lalu
  DuckDuckGo (urutan 100), lalu Ollama Web Search (urutan 110)
- **Dihosting sendiri** -- Anda mengendalikan instans, kueri, dan mesin pencari upstream
- **Kategori** default ke `general` saat tidak dikonfigurasi
- **Fallback kategori** -- jika permintaan kategori non-`general` berhasil tetapi
  mengembalikan nol hasil, OpenClaw mencoba ulang kueri yang sama sekali lagi dengan `general`
  sebelum mengembalikan kumpulan hasil kosong

<Tip>
  Agar API JSON SearXNG berfungsi, pastikan instans SearXNG Anda telah mengaktifkan format `json`
  di `settings.yml` di bawah `search.formats`.
</Tip>

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [DuckDuckGo Search](/id/tools/duckduckgo-search) -- fallback tanpa kunci lainnya
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan tingkat gratis
