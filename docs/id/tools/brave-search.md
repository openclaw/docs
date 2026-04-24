---
read_when:
    - Anda ingin menggunakan Pencarian Brave untuk `web_search`
    - Anda memerlukan `BRAVE_API_KEY` atau detail paket
summary: Penyiapan Brave Search API untuk `web_search`
title: Pencarian Brave
x-i18n:
    generated_at: "2026-04-24T09:29:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw mendukung Brave Search API sebagai penyedia `web_search`.

## Dapatkan kunci API

1. Buat akun Brave Search API di [https://brave.com/search/api/](https://brave.com/search/api/)
2. Di dashboard, pilih paket **Search** dan buat kunci API.
3. Simpan kunci tersebut di config atau tetapkan `BRAVE_API_KEY` di environment Gateway.

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

Pengaturan pencarian Brave yang spesifik penyedia sekarang berada di `plugins.entries.brave.config.webSearch.*`.
`tools.web.search.apiKey` lama masih dimuat melalui shim kompatibilitas, tetapi itu bukan lagi jalur config kanonis.

`webSearch.mode` mengontrol transport Brave:

- `web` (default): pencarian web Brave normal dengan judul, URL, dan snippet
- `llm-context`: Brave LLM Context API dengan potongan teks dan sumber yang telah diekstrak sebelumnya untuk grounding

## Parameter alat

<ParamField path="query" type="string" required>
Kueri pencarian.
</ParamField>

<ParamField path="count" type="number" default="5">
Jumlah hasil yang dikembalikan (1–10).
</ParamField>

<ParamField path="country" type="string">
Kode negara ISO 2 huruf (misalnya `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Kode bahasa ISO 639-1 untuk hasil pencarian (misalnya `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Kode bahasa pencarian Brave (misalnya `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Kode bahasa ISO untuk elemen UI.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filter waktu — `day` berarti 24 jam.
</ParamField>

<ParamField path="date_after" type="string">
Hanya hasil yang dipublikasikan setelah tanggal ini (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Hanya hasil yang dipublikasikan sebelum tanggal ini (`YYYY-MM-DD`).
</ParamField>

**Contoh:**

```javascript
// Pencarian khusus negara dan bahasa
await web_search({
  query: "energi terbarukan",
  country: "DE",
  language: "de",
});

// Hasil terbaru (minggu lalu)
await web_search({
  query: "berita AI",
  freshness: "week",
});

// Pencarian rentang tanggal
await web_search({
  query: "perkembangan AI",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Catatan

- OpenClaw menggunakan paket Brave **Search**. Jika Anda memiliki langganan lama (misalnya paket Free asli dengan 2.000 kueri/bulan), paket itu tetap valid tetapi tidak mencakup fitur yang lebih baru seperti LLM Context atau batas laju yang lebih tinggi.
- Setiap paket Brave mencakup **kredit gratis \$5/bulan** (diperpanjang). Paket Search berbiaya \$5 per 1.000 permintaan, jadi kredit tersebut mencakup 1.000 kueri/bulan. Tetapkan batas penggunaan Anda di dashboard Brave untuk menghindari biaya tak terduga. Lihat [portal API Brave](https://brave.com/search/api/) untuk paket saat ini.
- Paket Search mencakup endpoint LLM Context dan hak inferensi AI. Menyimpan hasil untuk melatih atau menyesuaikan model memerlukan paket dengan hak penyimpanan yang eksplisit. Lihat [Ketentuan Layanan](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Mode `llm-context` mengembalikan entri sumber yang grounded alih-alih bentuk snippet web-search normal.
- Mode `llm-context` tidak mendukung `ui_lang`, `freshness`, `date_after`, atau `date_before`.
- `ui_lang` harus mencakup subtag region seperti `en-US`.
- Hasil di-cache selama 15 menit secara default (dapat dikonfigurasi melalui `cacheTtlMinutes`).

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Pencarian Perplexity](/id/tools/perplexity-search) -- hasil terstruktur dengan pemfilteran domain
- [Pencarian Exa](/id/tools/exa-search) -- pencarian neural dengan ekstraksi konten
