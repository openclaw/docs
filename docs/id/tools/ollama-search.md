---
read_when:
    - Anda ingin menggunakan Ollama untuk `web_search`
    - Anda menginginkan provider `web_search` tanpa kunci API
    - Anda memerlukan panduan penyiapan Pencarian Web Ollama
summary: Pencarian Web Ollama melalui host Ollama yang Anda konfigurasi
title: Pencarian web Ollama
x-i18n:
    generated_at: "2026-04-26T11:40:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw mendukung **Pencarian Web Ollama** sebagai provider `web_search` bawaan. Fitur ini
menggunakan API pencarian web Ollama dan mengembalikan hasil terstruktur dengan judul, URL,
dan cuplikan.

Berbeda dengan provider model Ollama, penyiapan ini secara default tidak memerlukan kunci API.
Namun, tetap memerlukan:

- host Ollama yang dapat dijangkau dari OpenClaw
- `ollama signin`

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
  <Step title="Pilih Pencarian Web Ollama">
    Jalankan:

    ```bash
    openclaw configure --section web
    ```

    Lalu pilih **Pencarian Web Ollama** sebagai provider.

  </Step>
</Steps>

Jika Anda sudah menggunakan Ollama untuk model, Pencarian Web Ollama menggunakan kembali
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

Jika tidak ada URL dasar Ollama eksplisit yang disetel, OpenClaw menggunakan `http://127.0.0.1:11434`.

Jika host Ollama Anda mengharapkan auth bearer, OpenClaw menggunakan kembali
`models.providers.ollama.apiKey` (atau auth provider berbasis env yang sesuai)
untuk permintaan pencarian web juga.

## Catatan

- Tidak diperlukan field kunci API khusus pencarian web untuk provider ini.
- Jika host Ollama dilindungi auth, OpenClaw menggunakan kembali kunci API provider
  Ollama normal jika tersedia.
- OpenClaw memperingatkan selama penyiapan jika Ollama tidak dapat dijangkau atau belum login, tetapi
  tidak memblokir pemilihan.
- Deteksi otomatis runtime dapat menggunakan fallback ke Pencarian Web Ollama saat tidak ada provider
  berkredensial dengan prioritas lebih tinggi yang dikonfigurasi.
- Provider ini menggunakan endpoint `/api/web_search` milik Ollama.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua provider dan deteksi otomatis
- [Ollama](/id/providers/ollama) -- penyiapan model Ollama dan mode cloud/lokal
