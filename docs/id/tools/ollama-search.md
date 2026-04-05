---
read_when:
    - Anda ingin menggunakan Ollama untuk web_search
    - Anda menginginkan penyedia web_search tanpa kunci
    - Anda memerlukan panduan penyiapan Ollama Web Search
summary: Ollama Web Search melalui host Ollama yang Anda konfigurasi
title: Ollama Web Search
x-i18n:
    generated_at: "2026-04-05T14:08:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d0765594e0eb368c25cca21a712c054e71cf43e7bfb385d10feddd990f4fd
    source_path: tools/ollama-search.md
    workflow: 15
---

# Ollama Web Search

OpenClaw mendukung **Ollama Web Search** sebagai penyedia `web_search` bawaan.
Fitur ini menggunakan API web-search eksperimental Ollama dan mengembalikan hasil terstruktur
dengan judul, URL, dan cuplikan.

Tidak seperti penyedia model Ollama, penyiapan ini tidak memerlukan API key secara
default. Namun, ini memerlukan:

- host Ollama yang dapat dijangkau dari OpenClaw
- `ollama signin`

## Penyiapan

<Steps>
  <Step title="Mulai Ollama">
    Pastikan Ollama terinstal dan berjalan.
  </Step>
  <Step title="Masuk">
    Jalankan:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Pilih Ollama Web Search">
    Jalankan:

    ```bash
    openclaw configure --section web
    ```

    Lalu pilih **Ollama Web Search** sebagai penyedia.

  </Step>
</Steps>

Jika Anda sudah menggunakan Ollama untuk model, Ollama Web Search menggunakan kembali
host yang sama yang sudah dikonfigurasi.

## Config

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

Override host Ollama opsional:

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

Jika tidak ada URL dasar Ollama eksplisit yang diatur, OpenClaw menggunakan `http://127.0.0.1:11434`.

Jika host Ollama Anda mengharapkan auth bearer, OpenClaw menggunakan kembali
`models.providers.ollama.apiKey` (atau auth penyedia berbasis env yang cocok)
untuk permintaan web-search juga.

## Catatan

- Tidak ada field API key khusus web-search yang diperlukan untuk penyedia ini.
- Jika host Ollama dilindungi auth, OpenClaw menggunakan kembali API key penyedia
  Ollama normal bila ada.
- OpenClaw memperingatkan selama penyiapan jika Ollama tidak dapat dijangkau atau belum sign in, tetapi
  tidak memblokir pemilihan.
- Deteksi otomatis runtime dapat fallback ke Ollama Web Search saat tidak ada penyedia berkredensial
  prioritas lebih tinggi yang dikonfigurasi.
- Penyedia ini menggunakan endpoint eksperimental `/api/experimental/web_search`
  milik Ollama.

## Terkait

- [Ringkasan Web Search](/tools/web) -- semua penyedia dan deteksi otomatis
- [Ollama](/id/providers/ollama) -- penyiapan model Ollama dan mode cloud/lokal
