---
read_when:
    - Anda menginginkan penyedia pencarian web yang dihosting sendiri
    - Anda ingin menggunakan SearXNG untuk web_search
    - Anda memerlukan opsi pencarian yang berfokus pada privasi atau terisolasi dari jaringan.
summary: Pencarian web SearXNG -- penyedia pencarian meta yang dihosting sendiri dan tanpa kunci
title: Pencarian SearXNG
x-i18n:
    generated_at: "2026-07-12T14:47:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw mendukung [SearXNG](https://docs.searxng.org/) sebagai penyedia `web_search` yang **dihosting sendiri,
tanpa kunci**. SearXNG adalah mesin metapencarian sumber terbuka
yang mengagregasikan hasil dari Google, Bing, DuckDuckGo, dan sumber lainnya.

Keunggulan:

- **Gratis dan tanpa batas** -- tidak memerlukan kunci API atau langganan komersial
- **Privasi / isolasi jaringan** -- kueri tidak pernah meninggalkan jaringan Anda
- **Berfungsi di mana saja** -- tidak ada pembatasan wilayah pada API pencarian komersial

## Penyiapan

<Steps>
  <Step title="Instal plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Jalankan instans SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Atau gunakan penerapan SearXNG yang sudah ada dan dapat Anda akses. Lihat
    [dokumentasi SearXNG](https://docs.searxng.org/) untuk penyiapan produksi.

  </Step>
  <Step title="Konfigurasikan">
    ```bash
    openclaw configure --section web
    # Pilih "searxng" sebagai penyedia
    ```

    Atau tetapkan variabel lingkungan dan biarkan deteksi otomatis menemukannya:

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

Pengaturan tingkat plugin untuk instans SearXNG:

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

`baseUrl` juga menerima objek SecretRef (misalnya `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## Variabel lingkungan

Tetapkan `SEARXNG_BASE_URL` sebagai alternatif konfigurasi:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Urutan resolusi: string `baseUrl` yang dikonfigurasi, lalu SecretRef lingkungan sebaris pada
`baseUrl`, kemudian `SEARXNG_BASE_URL`. Ketika tidak ada jalur konfigurasi yang ditetapkan dan
`SEARXNG_BASE_URL` tersedia tanpa penyedia yang dipilih secara eksplisit, deteksi otomatis
memilih SearXNG.

## Referensi konfigurasi plugin

| Bidang       | Deskripsi                                                          |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL dasar instans SearXNG Anda (wajib)                              |
| `categories` | Kategori yang dipisahkan koma seperti `general`, `news`, atau `science` |
| `language`   | Kode bahasa untuk hasil seperti `en`, `de`, atau `fr`               |

Pemanggilan alat `web_search` juga menerima `count` (1-10 hasil), `categories`,
dan `language` sebagai penggantian untuk setiap pemanggilan.

## Catatan

- **API JSON** -- menggunakan endpoint asli `format=json` milik SearXNG, bukan pengambilan data dari HTML
- **URL hasil gambar** -- hasil kategori gambar menyertakan `img_src` ketika SearXNG
  mengembalikan URL gambar langsung
- **Tanpa kunci API** -- langsung berfungsi dengan instans SearXNG apa pun
- **Validasi URL dasar** -- `baseUrl` harus berupa URL `http://` atau `https://`
  yang valid
- **Pengaman jaringan** -- URL dasar `http://` harus menargetkan host privat tepercaya atau
  local loopback (host publik harus menggunakan `https://`); URL dasar `https://` yang
  ditetapkan ke alamat privat/internal mendapat izin hosting mandiri yang sama,
  sedangkan URL dasar `https://` yang ditetapkan secara publik tetap menggunakan perlindungan SSRF yang ketat
- **Urutan deteksi otomatis** -- SearXNG memerlukan `baseUrl` yang dikonfigurasi (urutan
  200 di antara penyedia yang sudah memiliki kredensial wajib). Penyedia tanpa kunci
  seperti DuckDuckGo atau Ollama Web Search tidak pernah dipilih secara implisit oleh deteksi otomatis;
  penyedia tersebut hanya aktif jika `provider` dipilih secara eksplisit
- **Dihosting sendiri** -- Anda mengendalikan instans, kueri, dan mesin pencari hulu
- **Kategori** secara bawaan menggunakan `general` jika tidak dikonfigurasi
- **Fallback kategori** -- jika permintaan kategori selain `general` berhasil tetapi
  tidak menghasilkan apa pun, OpenClaw mencoba ulang kueri yang sama satu kali dengan `general`
  sebelum mengembalikan kumpulan hasil kosong
- **Penyimpanan cache hasil** -- kueri identik (kueri, jumlah, kategori,
  bahasa, dan URL dasar yang sama) disimpan dalam cache proses untuk TTL singkat
- **Persyaratan versi** -- plugin mendeklarasikan `minHostVersion: >=2026.6.9`

<Tip>
  Agar API JSON SearXNG berfungsi, pastikan instans SearXNG Anda telah mengaktifkan format `json`
  dalam `settings.yml` di bagian `search.formats`.
</Tip>

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Pencarian DuckDuckGo](/id/tools/duckduckgo-search) -- penyedia tanpa kunci lainnya
- [Pencarian Brave](/id/tools/brave-search) -- hasil terstruktur dengan tingkat gratis
