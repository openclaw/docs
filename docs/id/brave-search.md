---
read_when:
    - Anda ingin menggunakan Brave Search untuk web_search
    - Anda memerlukan BRAVE_API_KEY atau detail paket
summary: Penyiapan Brave Search API untuk web_search
title: Brave Search (jalur lama)
x-i18n:
    generated_at: "2026-04-05T13:42:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7788e4cee7dc460819e55095c87df8cea29ba3a8bd3cef4c0e98ac601b45b651
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw mendukung Brave Search API sebagai penyedia `web_search`.

## Dapatkan kunci API

1. Buat akun Brave Search API di [https://brave.com/search/api/](https://brave.com/search/api/)
2. Di dasbor, pilih paket **Search** dan buat kunci API.
3. Simpan kunci tersebut di konfigurasi atau tetapkan `BRAVE_API_KEY` di environment Gateway.

## Contoh konfigurasi

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

Pengaturan pencarian Brave yang khusus penyedia kini berada di bawah `plugins.entries.brave.config.webSearch.*`.
`tools.web.search.apiKey` lama masih dimuat melalui shim kompatibilitas, tetapi itu bukan lagi jalur konfigurasi kanonis.

`webSearch.mode` mengontrol transport Brave:

- `web` (default): pencarian web Brave normal dengan judul, URL, dan cuplikan
- `llm-context`: Brave LLM Context API dengan potongan teks dan sumber yang sudah diekstrak sebelumnya untuk grounding

## Parameter alat

| Parameter     | Deskripsi                                                           |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Kueri pencarian (wajib)                                             |
| `count`       | Jumlah hasil yang dikembalikan (1-10, default: 5)                   |
| `country`     | Kode negara ISO 2 huruf (misalnya, "US", "DE")                      |
| `language`    | Kode bahasa ISO 639-1 untuk hasil pencarian (misalnya, "en", "de", "fr") |
| `search_lang` | Kode bahasa pencarian Brave (misalnya, `en`, `en-gb`, `zh-hans`)    |
| `ui_lang`     | Kode bahasa ISO untuk elemen UI                                     |
| `freshness`   | Filter waktu: `day` (24 jam), `week`, `month`, atau `year`          |
| `date_after`  | Hanya hasil yang dipublikasikan setelah tanggal ini (YYYY-MM-DD)    |
| `date_before` | Hanya hasil yang dipublikasikan sebelum tanggal ini (YYYY-MM-DD)    |

**Contoh:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Catatan

- OpenClaw menggunakan paket Brave **Search**. Jika Anda memiliki langganan lama (misalnya paket Free asli dengan 2.000 kueri/bulan), langganan itu tetap valid tetapi tidak mencakup fitur yang lebih baru seperti LLM Context atau batas laju yang lebih tinggi.
- Setiap paket Brave menyertakan **\$5/bulan dalam kredit gratis** (diperbarui). Paket Search berbiaya \$5 per 1.000 permintaan, jadi kredit tersebut mencakup 1.000 kueri/bulan. Tetapkan batas penggunaan Anda di dasbor Brave untuk menghindari biaya tak terduga. Lihat [portal Brave API](https://brave.com/search/api/) untuk paket saat ini.
- Paket Search mencakup endpoint LLM Context dan hak inferensi AI. Menyimpan hasil untuk melatih atau menyetel model memerlukan paket dengan hak penyimpanan eksplisit. Lihat Brave [Ketentuan Layanan](https://api-dashboard.search.brave.com/terms-of-service).
- Mode `llm-context` mengembalikan entri sumber yang digrounded alih-alih bentuk cuplikan pencarian web normal.
- Mode `llm-context` tidak mendukung `ui_lang`, `freshness`, `date_after`, atau `date_before`.
- `ui_lang` harus menyertakan subtag wilayah seperti `en-US`.
- Hasil di-cache selama 15 menit secara default (dapat dikonfigurasi melalui `cacheTtlMinutes`).

Lihat [Alat web](/tools/web) untuk konfigurasi lengkap `web_search`.
