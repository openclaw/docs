---
read_when:
    - Anda ingin menggunakan Ollama untuk `web_search`
    - Anda menginginkan provider `web_search` tanpa kunci API
    - Anda memerlukan panduan penyiapan Ollama Web Search
summary: Ollama Web Search melalui host Ollama yang Anda konfigurasi
title: Pencarian web Ollama
x-i18n:
    generated_at: "2026-04-24T09:32:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw mendukung **Ollama Web Search** sebagai provider `web_search` bawaan.
Provider ini menggunakan API pencarian web eksperimental Ollama dan mengembalikan hasil terstruktur
dengan judul, URL, dan cuplikan.

Tidak seperti provider model Ollama, penyiapan ini tidak memerlukan kunci API
secara default. Namun, penyiapan ini memerlukan:

- host Ollama yang dapat dijangkau dari OpenClaw
- `ollama signin`

## Penyiapan

<Steps>
  <Step title="Mulai Ollama">
    Pastikan Ollama terinstal dan sedang berjalan.
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

    Lalu pilih **Ollama Web Search** sebagai provider.

  </Step>
</Steps>

Jika Anda sudah menggunakan Ollama untuk model, Ollama Web Search menggunakan ulang
host yang sama yang telah dikonfigurasi.

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

Jika tidak ada base URL Ollama eksplisit yang disetel, OpenClaw menggunakan `http://127.0.0.1:11434`.

Jika host Ollama Anda mengharapkan auth bearer, OpenClaw menggunakan kembali
`models.providers.ollama.apiKey` (atau auth provider berbasis env yang cocok)
untuk permintaan web-search juga.

## Catatan

- Tidak ada field kunci API khusus web-search yang diperlukan untuk provider ini.
- Jika host Ollama dilindungi auth, OpenClaw menggunakan kembali kunci API provider
  Ollama normal saat tersedia.
- OpenClaw memperingatkan selama setup jika Ollama tidak dapat dijangkau atau belum sign in, tetapi
  tidak memblokir pemilihan.
- Auto-detect runtime dapat fallback ke Ollama Web Search ketika tidak ada provider
  berkredensial dengan prioritas lebih tinggi yang dikonfigurasi.
- Provider ini menggunakan endpoint eksperimental `/api/experimental/web_search`
  milik Ollama.

## Terkait

- [Web Search overview](/id/tools/web) -- semua provider dan auto-detection
- [Ollama](/id/providers/ollama) -- penyiapan model Ollama dan mode cloud/lokal
