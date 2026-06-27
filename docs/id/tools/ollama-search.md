---
read_when:
    - Anda ingin menggunakan Ollama untuk web_search
    - Anda menginginkan penyedia web_search tanpa kunci
    - Anda ingin menggunakan Ollama Web Search terhosting dengan OLLAMA_API_KEY
    - Anda memerlukan panduan penyiapan Ollama Web Search
summary: Pencarian Web Ollama melalui host Ollama lokal atau API Ollama ter-host
title: Pencarian web Ollama
x-i18n:
    generated_at: "2026-06-27T18:19:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw mendukung **Ollama Web Search** sebagai penyedia `web_search` bawaan. Ini
menggunakan API pencarian web Ollama dan mengembalikan hasil terstruktur dengan judul, URL,
dan cuplikan.

Untuk Ollama lokal atau yang di-host sendiri, penyiapan ini secara default
tidak memerlukan kunci API. Ini memang memerlukan:

- host Ollama yang dapat dijangkau dari OpenClaw
- `ollama signin`

Untuk pencarian hosted langsung, atur URL dasar penyedia Ollama ke `https://ollama.com`
dan berikan `OLLAMA_API_KEY` yang valid.

## Penyiapan

<Steps>
  <Step title="Mulai Ollama">
    Pastikan Ollama sudah terinstal dan berjalan.
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
host yang sama yang telah dikonfigurasi.

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

Penggantian host Ollama opsional:

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

Jika Anda sudah mengonfigurasi Ollama sebagai penyedia model, penyedia web-search dapat
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

Penyedia model Ollama menggunakan `baseUrl` sebagai kunci kanonis. Penyedia web-search juga menghormati `baseURL` pada `models.providers.ollama` untuk kompatibilitas dengan contoh konfigurasi bergaya OpenAI SDK.

Jika tidak ada URL dasar Ollama eksplisit yang ditetapkan, OpenClaw menggunakan `http://127.0.0.1:11434`.

Jika host Ollama Anda mengharapkan autentikasi bearer, OpenClaw menggunakan kembali
`models.providers.ollama.apiKey` (atau autentikasi penyedia berbasis env yang sesuai)
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

- Tidak diperlukan kolom kunci API khusus web-search untuk penyedia ini.
- Jika host Ollama dilindungi autentikasi, OpenClaw menggunakan kembali kunci API
  penyedia Ollama normal jika ada.
- Jika `baseUrl` adalah `https://ollama.com`, OpenClaw memanggil
  `https://ollama.com/api/web_search` secara langsung dan mengirim kunci API Ollama
  yang dikonfigurasi sebagai autentikasi bearer.
- Jika host yang dikonfigurasi tidak mengekspos pencarian web dan `OLLAMA_API_KEY` ditetapkan,
  OpenClaw dapat beralih ke `https://ollama.com/api/web_search` tanpa mengirim
  kunci env tersebut ke host lokal.
- OpenClaw memperingatkan selama penyiapan jika Ollama tidak dapat dijangkau atau belum masuk, tetapi
  tidak memblokir pemilihan.
- OpenClaw tidak memilih Ollama Web Search secara otomatis ketika tidak ada penyedia
  berkredensial berprioritas lebih tinggi yang dikonfigurasi; pilih secara eksplisit dengan
  `tools.web.search.provider: "ollama"`.
- Host daemon Ollama lokal menggunakan endpoint proksi lokal
  `/api/experimental/web_search`, yang menandatangani dan meneruskan ke Ollama Cloud.
- Host `https://ollama.com` menggunakan endpoint hosted publik
  `/api/web_search` secara langsung dengan autentikasi kunci API bearer.

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Ollama](/id/providers/ollama) -- penyiapan model Ollama serta mode cloud/lokal
