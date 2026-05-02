---
read_when:
    - Anda ingin menggunakan Grok untuk web_search
    - Anda memerlukan XAI_API_KEY untuk pencarian web
summary: Pencarian web Grok melalui respons xAI yang berlandaskan web
title: Pencarian Grok
x-i18n:
    generated_at: "2026-05-02T09:33:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw mendukung Grok sebagai penyedia `web_search`, menggunakan respons xAI yang berbasis web untuk menghasilkan jawaban tersintesis AI yang didukung hasil pencarian langsung beserta sitasi.

`XAI_API_KEY` yang sama juga dapat menjalankan alat bawaan `x_search` untuk pencarian posting X (sebelumnya Twitter). Jika Anda menyimpan kunci di bawah `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw kini menggunakannya kembali sebagai fallback untuk penyedia model xAI bawaan juga.

Untuk metrik X tingkat posting seperti repost, balasan, bookmark, atau tampilan, sebaiknya gunakan `x_search` dengan URL posting atau ID status yang tepat, bukan kueri pencarian yang luas.

## Onboarding dan konfigurasi

Jika Anda memilih **Grok** selama:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw dapat menampilkan langkah lanjutan terpisah untuk mengaktifkan `x_search` dengan `XAI_API_KEY` yang sama. Langkah lanjutan itu:

- hanya muncul setelah Anda memilih Grok untuk `web_search`
- bukan pilihan penyedia pencarian web tingkat atas yang terpisah
- secara opsional dapat mengatur model `x_search` dalam alur yang sama

Jika Anda melewatinya, Anda dapat mengaktifkan atau mengubah `x_search` nanti di konfigurasi.

## Mendapatkan kunci API

<Steps>
  <Step title="Buat kunci">
    Dapatkan kunci API dari [xAI](https://console.x.ai/).
  </Step>
  <Step title="Simpan kunci">
    Atur `XAI_API_KEY` di lingkungan Gateway, atau konfigurasikan melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Alternatif lingkungan:** atur `XAI_API_KEY` di lingkungan Gateway.
Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

## Cara kerjanya

Grok menggunakan respons xAI yang berbasis web untuk menyintesis jawaban dengan sitasi inline, mirip dengan pendekatan grounding Google Search dari Gemini.

## Parameter yang didukung

Pencarian Grok mendukung `query`.

`count` diterima untuk kompatibilitas bersama `web_search`, tetapi Grok tetap mengembalikan satu jawaban tersintesis dengan sitasi, bukan daftar N hasil.

Filter khusus penyedia saat ini belum didukung.

Grok menggunakan timeout default khusus penyedia selama 60 detik karena pencarian berbasis web xAI Responses dapat berjalan lebih lama daripada default bersama `web_search`. Atur `tools.web.search.timeoutSeconds` untuk menimpanya.

## Override URL dasar

Atur `plugins.entries.xai.config.webSearch.baseUrl` saat pencarian web Grok harus dirutekan melalui proxy operator atau endpoint Responses yang kompatibel dengan xAI. OpenClaw memposting ke `<baseUrl>/responses` setelah memangkas garis miring di akhir. `x_search` menggunakan fallback `webSearch.baseUrl` yang sama kecuali `plugins.entries.xai.config.xSearch.baseUrl` diatur.

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [`x_search` di Web Search](/id/tools/web#x_search) -- pencarian X kelas utama melalui xAI
- [Gemini Search](/id/tools/gemini-search) -- jawaban tersintesis AI melalui grounding Google
