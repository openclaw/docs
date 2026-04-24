---
read_when:
    - Anda ingin menggunakan Brave Search untuk `web_search`
    - Anda memerlukan `BRAVE_API_KEY` atau detail paket
summary: Penyiapan API Brave Search untuk `web_search`
title: Pencarian Brave (jalur lama)
x-i18n:
    generated_at: "2026-04-24T08:57:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 15
---

# API Brave Search

OpenClaw mendukung API Brave Search sebagai penyedia `web_search`.

## Mendapatkan kunci API

1. Buat akun API Brave Search di [https://brave.com/search/api/](https://brave.com/search/api/)
2. Di dasbor, pilih paket **Search** dan buat kunci API.
3. Simpan kunci tersebut di config atau setel `BRAVE_API_KEY` di environment Gateway.

## Contoh config

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
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

Pengaturan pencarian Brave yang spesifik untuk penyedia kini berada di bawah `plugins.entries.brave.config.webSearch.*`.
`tools.web.search.apiKey` lama masih dimuat melalui compatibility shim, tetapi itu bukan lagi jalur config kanonis.

`webSearch.mode` mengontrol transport Brave:

- `web` (default): pencarian web Brave normal dengan judul, URL, dan cuplikan
- `llm-context`: API Brave LLM Context dengan potongan teks dan sumber yang sudah diekstrak sebelumnya untuk grounding

## Parameter alat

| Parameter     | Deskripsi                                                           |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Kueri pencarian (wajib)                                             |
| `count`       | Jumlah hasil yang dikembalikan (1-10, default: 5)                   |
| `country`     | Kode negara ISO 2 huruf (misalnya, "US", "DE")                      |
| `language`    | Kode bahasa ISO 639-1 untuk hasil pencarian (misalnya, "en", "de", "fr") |
| `search_lang` | Kode bahasa pencarian Brave (misalnya, `en`, `en-gb`, `zh-hans`)    |
| `ui_lang`     | Kode bahasa ISO untuk elemen UI                                     |
| `freshness`   | Filter waktu: `day` (24j), `week`, `month`, atau `year`             |
| `date_after`  | Hanya hasil yang diterbitkan setelah tanggal ini (YYYY-MM-DD)       |
| `date_before` | Hanya hasil yang diterbitkan sebelum tanggal ini (YYYY-MM-DD)       |

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

- OpenClaw menggunakan paket Brave **Search**. Jika Anda memiliki langganan lama (misalnya paket Free asli dengan 2.000 kueri/bulan), langganan itu tetap valid tetapi tidak mencakup fitur yang lebih baru seperti LLM Context atau batas laju yang lebih tinggi.
- Setiap paket Brave mencakup **kredit gratis \$5/bulan** (diperbarui). Paket Search berbiaya \$5 per 1.000 permintaan, sehingga kredit tersebut mencakup 1.000 kueri/bulan. Tetapkan batas penggunaan Anda di dasbor Brave untuk menghindari biaya tak terduga. Lihat [portal API Brave](https://brave.com/search/api/) untuk paket saat ini.
- Paket Search mencakup endpoint LLM Context dan hak inferensi AI. Menyimpan hasil untuk melatih atau menyesuaikan model memerlukan paket dengan hak penyimpanan yang eksplisit. Lihat Brave [Ketentuan Layanan](https://api-dashboard.search.brave.com/terms-of-service).
- Mode `llm-context` mengembalikan entri sumber yang di-grounding alih-alih bentuk cuplikan pencarian web normal.
- Mode `llm-context` tidak mendukung `ui_lang`, `freshness`, `date_after`, atau `date_before`.
- `ui_lang` harus menyertakan subtag wilayah seperti `en-US`.
- Hasil di-cache selama 15 menit secara default (dapat dikonfigurasi melalui `cacheTtlMinutes`).

Lihat [Alat web](/id/tools/web) untuk konfigurasi lengkap `web_search`.

## Terkait

- [Pencarian Brave](/id/tools/brave-search)
