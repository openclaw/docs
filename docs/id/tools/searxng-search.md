---
read_when:
    - Anda menginginkan penyedia pencarian web yang di-host sendiri
    - Anda ingin menggunakan SearXNG untuk web_search
    - Anda memerlukan opsi pencarian yang berfokus pada privasi atau terisolasi secara fisik
summary: Pencarian web SearXNG -- penyedia meta-pencarian yang dihosting sendiri dan bebas kunci
title: Pencarian SearXNG
x-i18n:
    generated_at: "2026-06-27T18:20:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw mendukung [SearXNG](https://docs.searxng.org/) sebagai penyedia `web_search` **yang dihosting sendiri,
tanpa kunci**. SearXNG adalah mesin meta-pencarian open-source
yang menggabungkan hasil dari Google, Bing, DuckDuckGo, dan sumber lain.

Keunggulan:

- **Gratis dan tidak terbatas** -- tidak memerlukan kunci API atau langganan komersial
- **Privasi / isolasi jaringan** -- kueri tidak pernah meninggalkan jaringan Anda
- **Berfungsi di mana saja** -- tidak ada pembatasan wilayah pada API pencarian komersial

## Penyiapan

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
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

Pengaturan tingkat Plugin untuk instance SearXNG:

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
- host privat/internal menggunakan pelindung jaringan yang dihosting sendiri; host publik `https://`
  tetap berada pada pelindung pencarian web yang ketat dan tidak dapat mengalihkan ke alamat
  privat

## Variabel lingkungan

Tetapkan `SEARXNG_BASE_URL` sebagai alternatif untuk konfigurasi:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Ketika `SEARXNG_BASE_URL` ditetapkan dan tidak ada penyedia eksplisit yang dikonfigurasi, deteksi otomatis
memilih SearXNG secara otomatis (dengan prioritas terendah -- penyedia berbasis API apa pun dengan
kunci akan menang terlebih dahulu).

## Referensi konfigurasi Plugin

| Kolom        | Deskripsi                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL dasar instance SearXNG Anda (wajib)                       |
| `categories` | Kategori yang dipisahkan koma seperti `general`, `news`, atau `science` |
| `language`   | Kode bahasa untuk hasil seperti `en`, `de`, atau `fr`              |

## Catatan

- **API JSON** -- menggunakan endpoint native `format=json` milik SearXNG, bukan scraping HTML
- **URL hasil gambar** -- hasil kategori gambar menyertakan `img_src` ketika SearXNG
  mengembalikan URL gambar langsung
- **Tidak ada kunci API** -- berfungsi dengan instance SearXNG apa pun secara langsung
- **Validasi URL dasar** -- `baseUrl` harus berupa URL `http://` atau `https://`
  yang valid; host publik harus menggunakan `https://`
- **Pelindung jaringan** -- endpoint SearXNG privat/internal ikut serta dalam
  akses jaringan privat; endpoint SearXNG publik `https://` tetap mempertahankan perlindungan SSRF
  yang ketat
- **Urutan deteksi otomatis** -- SearXNG diperiksa setelah penyedia berbasis API
  dengan kunci yang dikonfigurasi (urutan 200). Penyedia tanpa kunci seperti DuckDuckGo atau
  Ollama Web Search tidak dipilih otomatis tanpa pilihan penyedia eksplisit
- **Dihosting sendiri** -- Anda mengontrol instance, kueri, dan mesin pencari upstream
- **Kategori** default ke `general` jika tidak dikonfigurasi
- **Fallback kategori** -- jika permintaan kategori non-`general` berhasil tetapi
  mengembalikan nol hasil, OpenClaw mencoba ulang kueri yang sama satu kali dengan `general`
  sebelum mengembalikan kumpulan hasil kosong

<Tip>
  Agar API JSON SearXNG berfungsi, pastikan instance SearXNG Anda telah mengaktifkan format `json`
  di `settings.yml` pada bagian `search.formats`.
</Tip>

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Pencarian DuckDuckGo](/id/tools/duckduckgo-search) -- penyedia lain tanpa kunci
- [Pencarian Brave](/id/tools/brave-search) -- hasil terstruktur dengan tingkat gratis
