---
read_when:
    - Anda ingin menggunakan Brave Search untuk `web_search`
    - Anda memerlukan `BRAVE_API_KEY` atau detail paket
summary: Penyiapan Brave Search API untuk `web_search`
title: Brave Search
x-i18n:
    generated_at: "2026-04-05T14:07:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc026a69addf74375a0e407805b875ff527c77eb7298b2f5bb0e165197f77c0c
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw mendukung Brave Search API sebagai penyedia `web_search`.

## Dapatkan kunci API

1. Buat akun Brave Search API di [https://brave.com/search/api/](https://brave.com/search/api/)
2. Di dashboard, pilih paket **Search** dan buat kunci API.
3. Simpan kunci di config atau setel `BRAVE_API_KEY` di environment Gateway.

## Contoh config

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // atau "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Pengaturan pencarian Brave yang spesifik untuk penyedia sekarang berada di bawah `plugins.entries.brave.config.webSearch.*`.
`tools.web.search.apiKey` lama masih dimuat melalui compatibility shim, tetapi itu bukan lagi jalur config kanonis.

`webSearch.mode` mengontrol transport Brave:

- `web` (default): pencarian web Brave normal dengan judul, URL, dan cuplikan
- `llm-context`: API Brave LLM Context dengan potongan teks dan sumber yang sudah diekstrak untuk grounding

## Parameter tool

| Parameter     | Deskripsi                                                          |
| ------------- | ------------------------------------------------------------------ |
| `query`       | Kueri pencarian (wajib)                                            |
| `count`       | Jumlah hasil yang dikembalikan (1-10, default: 5)                  |
| `country`     | Kode negara ISO 2 huruf (misalnya, "US", "DE")                     |
| `language`    | Kode bahasa ISO 639-1 untuk hasil pencarian (misalnya, "en", "de", "fr") |
| `search_lang` | Kode bahasa pencarian Brave (misalnya, `en`, `en-gb`, `zh-hans`)   |
| `ui_lang`     | Kode bahasa ISO untuk elemen UI                                    |
| `freshness`   | Filter waktu: `day` (24j), `week`, `month`, atau `year`            |
| `date_after`  | Hanya hasil yang dipublikasikan setelah tanggal ini (YYYY-MM-DD)   |
| `date_before` | Hanya hasil yang dipublikasikan sebelum tanggal ini (YYYY-MM-DD)   |

**Contoh:**

```javascript
// Pencarian spesifik negara dan bahasa
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Hasil terbaru (minggu lalu)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Pencarian rentang tanggal
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Catatan

- OpenClaw menggunakan paket Brave **Search**. Jika Anda memiliki langganan lama (misalnya paket Free asli dengan 2.000 kueri/bulan), langganan itu tetap valid tetapi tidak mencakup fitur-fitur baru seperti LLM Context atau batas laju yang lebih tinggi.
- Setiap paket Brave menyertakan **\$5/bulan dalam kredit gratis** (diperbarui). Paket Search berbiaya \$5 per 1.000 permintaan, jadi kredit itu mencakup 1.000 kueri/bulan. Setel batas penggunaan Anda di dashboard Brave untuk menghindari biaya tak terduga. Lihat [portal Brave API](https://brave.com/search/api/) untuk paket saat ini.
- Paket Search mencakup endpoint LLM Context dan hak inferensi AI. Menyimpan hasil untuk melatih atau menyetel model memerlukan paket dengan hak penyimpanan eksplisit. Lihat Brave [Ketentuan Layanan](https://api-dashboard.search.brave.com/terms-of-service).
- Mode `llm-context` mengembalikan entri sumber yang di-grounding alih-alih bentuk cuplikan pencarian web normal.
- Mode `llm-context` tidak mendukung `ui_lang`, `freshness`, `date_after`, atau `date_before`.
- `ui_lang` harus menyertakan subtanda wilayah seperti `en-US`.
- Hasil dicache selama 15 menit secara default (dapat dikonfigurasi melalui `cacheTtlMinutes`).

## Terkait

- [Ikhtisar Pencarian Web](/tools/web) -- semua penyedia dan deteksi otomatis
- [Perplexity Search](/tools/perplexity-search) -- hasil terstruktur dengan pemfilteran domain
- [Exa Search](/tools/exa-search) -- pencarian neural dengan ekstraksi konten
