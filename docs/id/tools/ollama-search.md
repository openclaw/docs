---
read_when:
    - Anda ingin menggunakan Ollama untuk web_search
    - Anda menginginkan penyedia web_search tanpa kunci
    - Anda ingin menggunakan Ollama Web Search yang dihosting dengan OLLAMA_API_KEY
    - Anda memerlukan panduan penyiapan Ollama Web Search
summary: Pencarian Web Ollama melalui host Ollama lokal atau API Ollama yang dihosting
title: Pencarian web Ollama
x-i18n:
    generated_at: "2026-04-30T10:16:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw mendukung **Ollama Web Search** sebagai penyedia `web_search` bawaan. Ini
menggunakan API pencarian web Ollama dan mengembalikan hasil terstruktur dengan judul, URL,
dan cuplikan.

Untuk Ollama lokal atau yang di-host sendiri, penyiapan ini tidak memerlukan kunci API secara
default. Ini memang memerlukan:

- host Ollama yang dapat dijangkau dari OpenClaw
- `ollama signin`

Untuk pencarian hosted langsung, atur URL dasar penyedia Ollama ke `https://ollama.com`
dan sediakan `OLLAMA_API_KEY` yang valid.

## Penyiapan

<Steps>
  <Step title="Start Ollama">
    Pastikan Ollama sudah terpasang dan berjalan.
  </Step>
  <Step title="Sign in">
    Jalankan:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Choose Ollama Web Search">
    Jalankan:

    ```bash
    openclaw configure --section web
    ```

    Lalu pilih **Ollama Web Search** sebagai penyedia.

  </Step>
</Steps>

Jika Anda sudah menggunakan Ollama untuk model, Ollama Web Search menggunakan kembali host
yang sama yang telah dikonfigurasi.

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

Override host Ollama opsional:

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

Jika Anda sudah mengonfigurasi Ollama sebagai penyedia model, penyedia pencarian web dapat
menggunakan kembali host tersebut:

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

Penyedia model Ollama menggunakan `baseUrl` sebagai kunci kanonis. Penyedia pencarian web juga menghormati `baseURL` pada `models.providers.ollama` untuk kompatibilitas dengan contoh konfigurasi bergaya OpenAI SDK.

Jika tidak ada URL dasar Ollama yang ditetapkan secara eksplisit, OpenClaw menggunakan `http://127.0.0.1:11434`.

Jika host Ollama Anda mengharapkan autentikasi bearer, OpenClaw menggunakan kembali
`models.providers.ollama.apiKey` (atau autentikasi penyedia berbasis env yang cocok)
untuk permintaan ke host yang dikonfigurasi tersebut.

Ollama Web Search hosted langsung:

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

## Catatan

- Tidak diperlukan kolom kunci API khusus pencarian web untuk penyedia ini.
- Jika host Ollama dilindungi autentikasi, OpenClaw menggunakan kembali kunci API penyedia
  Ollama normal saat tersedia.
- Jika `baseUrl` adalah `https://ollama.com`, OpenClaw memanggil
  `https://ollama.com/api/web_search` secara langsung dan mengirimkan kunci API Ollama
  yang dikonfigurasi sebagai autentikasi bearer.
- Jika host yang dikonfigurasi tidak mengekspos pencarian web dan `OLLAMA_API_KEY` ditetapkan,
  OpenClaw dapat fallback ke `https://ollama.com/api/web_search` tanpa mengirimkan
  kunci env tersebut ke host lokal.
- OpenClaw memperingatkan saat penyiapan jika Ollama tidak dapat dijangkau atau belum masuk, tetapi
  tidak memblokir pemilihan.
- Deteksi otomatis runtime dapat fallback ke Ollama Web Search saat tidak ada penyedia berkredensial
  dengan prioritas lebih tinggi yang dikonfigurasi.
- Host daemon Ollama lokal menggunakan endpoint proxy lokal
  `/api/experimental/web_search`, yang menandatangani dan meneruskan ke Ollama Cloud.
- Host `https://ollama.com` menggunakan endpoint hosted publik
  `/api/web_search` secara langsung dengan autentikasi kunci API bearer.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Ollama](/id/providers/ollama) -- penyiapan model Ollama dan mode cloud/lokal
