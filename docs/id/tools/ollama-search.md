---
read_when:
    - Anda ingin menggunakan Ollama untuk web_search
    - Anda menginginkan penyedia web_search tanpa kunci
    - Anda ingin menggunakan Ollama Web Search yang dihosting dengan OLLAMA_API_KEY
    - Anda memerlukan panduan penyiapan Ollama Web Search
summary: Pencarian Web Ollama melalui host Ollama lokal atau API Ollama yang dihosting
title: Pencarian web Ollama
x-i18n:
    generated_at: "2026-07-12T14:42:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw mendukung **Ollama Web Search** sebagai penyedia `web_search` bawaan,
yang mengembalikan judul, URL, dan cuplikan dari API pencarian web Ollama.

Ollama lokal/yang dihos sendiri secara default tidak memerlukan kunci API; diperlukan
host Ollama yang dapat dijangkau serta `ollama signin`. Pencarian yang dihos langsung (tanpa Ollama lokal) memerlukan
`baseUrl: "https://ollama.com"` dan `OLLAMA_API_KEY` yang valid.

## Penyiapan

<Steps>
  <Step title="Mulai Ollama">
    Pastikan Ollama telah terinstal dan berjalan.
  </Step>
  <Step title="Masuk">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Pilih Ollama Web Search">
    ```bash
    openclaw configure --section web
    ```

    Pilih **Ollama Web Search** sebagai penyedia.

  </Step>
</Steps>

Jika Anda sudah menggunakan Ollama untuk model, Ollama Web Search menggunakan kembali
host terkonfigurasi yang sama.

<Note>
  OpenClaw tidak pernah memilih Ollama Web Search secara otomatis alih-alih penyedia
  berkredensial dengan prioritas lebih tinggi; Anda harus memilihnya secara eksplisit dengan
  `tools.web.search.provider: "ollama"`.
</Note>

## Konfigurasi

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Penggantian host opsional, yang hanya berlaku untuk pencarian web:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

Atau gunakan kembali host yang sudah dikonfigurasi untuk penyedia model Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

`models.providers.ollama.baseUrl` adalah kunci kanonis; penyedia pencarian web
juga menerima `baseURL` di sana untuk kompatibilitas dengan contoh konfigurasi
bergaya OpenAI SDK. Jika tidak ada yang ditetapkan, OpenClaw secara default menggunakan
`http://127.0.0.1:11434`.

Ollama Web Search yang dihos langsung (tanpa Ollama lokal):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Autentikasi dan perutean permintaan

- Tidak ada bidang kunci API khusus pencarian web; penyedia menggunakan kembali
  `models.providers.ollama.apiKey` (atau autentikasi penyedia berbasis variabel lingkungan yang cocok)
  saat host terkonfigurasi dilindungi autentikasi.
- Urutan resolusi host: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (atau `baseURL`) → `http://127.0.0.1:11434`.
- Jika host yang dihasilkan adalah `https://ollama.com`, OpenClaw memanggil
  `https://ollama.com/api/web_search` secara langsung dengan kunci API sebagai
  autentikasi bearer.
- Jika tidak, OpenClaw terlebih dahulu memanggil titik akhir proksi lokal
  `/api/experimental/web_search` (yang menandatangani dan meneruskan permintaan ke Ollama
  Cloud), lalu beralih ke `/api/web_search` pada host yang sama jika gagal. Jika keduanya gagal
  dan `OLLAMA_API_KEY` ditetapkan, OpenClaw mencoba kembali satu kali ke
  `https://ollama.com/api/web_search` dengan kunci tersebut — tanpa mengirimkannya ke
  host lokal.
- OpenClaw menampilkan peringatan selama penyiapan jika Ollama tidak dapat dijangkau atau belum digunakan untuk masuk, tetapi
  tidak mencegah pemilihan penyedia.

## Terkait

- [Ringkasan Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Ollama](/id/providers/ollama) -- penyiapan model Ollama serta mode cloud/lokal
