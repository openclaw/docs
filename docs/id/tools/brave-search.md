---
read_when:
    - Anda ingin menggunakan Brave Search untuk web_search
    - Anda memerlukan BRAVE_API_KEY atau rincian paket
summary: Penyiapan Brave Search API untuk web_search
title: Pencarian Brave
x-i18n:
    generated_at: "2026-05-02T09:33:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ecb9e3e5475bb26f4058311429b558f49cdd1df907a622f93f297ac6569d65
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw mendukung Brave Search API sebagai penyedia `web_search`.

## Mendapatkan kunci API

1. Buat akun Brave Search API di [https://brave.com/search/api/](https://brave.com/search/api/)
2. Di dasbor, pilih paket **Search** dan buat kunci API.
3. Simpan kunci di konfigurasi atau tetapkan `BRAVE_API_KEY` di lingkungan Gateway.

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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

Pengaturan pencarian Brave khusus penyedia sekarang berada di bawah `plugins.entries.brave.config.webSearch.*`.
`tools.web.search.apiKey` lama masih dimuat melalui shim kompatibilitas, tetapi itu bukan lagi jalur konfigurasi kanonis.

`webSearch.mode` mengontrol transport Brave:

- `web` (default): pencarian web Brave normal dengan judul, URL, dan cuplikan
- `llm-context`: Brave LLM Context API dengan potongan teks dan sumber yang telah diekstrak sebelumnya untuk grounding

`webSearch.baseUrl` dapat mengarahkan permintaan Brave ke proksi kompatibel Brave tepercaya
atau gateway. OpenClaw menambahkan `/res/v1/web/search` atau `/res/v1/llm/context` ke
URL dasar yang dikonfigurasi dan mempertahankan URL dasar dalam kunci cache. Endpoint
publik harus menggunakan `https://`; `http://` hanya diterima untuk host proksi loopback
atau jaringan privat tepercaya.

## Parameter alat

<ParamField path="query" type="string" required>
Kueri pencarian.
</ParamField>

<ParamField path="count" type="number" default="5">
Jumlah hasil yang akan dikembalikan (1–10).
</ParamField>

<ParamField path="country" type="string">
Kode negara ISO 2 huruf (mis. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Kode bahasa ISO 639-1 untuk hasil pencarian (mis. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Kode bahasa pencarian Brave (mis. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Kode bahasa ISO untuk elemen UI.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filter waktu — `day` adalah 24 jam.
</ParamField>

<ParamField path="date_after" type="string">
Hanya hasil yang diterbitkan setelah tanggal ini (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Hanya hasil yang diterbitkan sebelum tanggal ini (`YYYY-MM-DD`).
</ParamField>

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

- OpenClaw menggunakan paket Brave **Search**. Jika Anda memiliki langganan lama (mis. paket Free asli dengan 2.000 kueri/bulan), langganan tersebut tetap valid tetapi tidak menyertakan fitur baru seperti LLM Context atau batas laju yang lebih tinggi.
- Setiap paket Brave menyertakan **kredit gratis \$5/bulan** (diperbarui). Paket Search berbiaya \$5 per 1.000 permintaan, sehingga kredit tersebut mencakup 1.000 kueri/bulan. Tetapkan batas penggunaan Anda di dasbor Brave untuk menghindari biaya tak terduga. Lihat [portal Brave API](https://brave.com/search/api/) untuk paket saat ini.
- Paket Search menyertakan endpoint LLM Context dan hak inferensi AI. Menyimpan hasil untuk melatih atau menyesuaikan model memerlukan paket dengan hak penyimpanan eksplisit. Lihat [Ketentuan Layanan](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Mode `llm-context` mengembalikan entri sumber yang di-grounding, bukan bentuk cuplikan pencarian web normal.
- Mode `llm-context` mendukung `freshness` dan rentang `date_after` + `date_before` yang dibatasi. Mode ini tidak mendukung `ui_lang`; `date_before` tanpa `date_after` ditolak karena Brave mengharuskan rentang freshness khusus menyertakan tanggal mulai dan tanggal akhir.
- `ui_lang` harus menyertakan subtag wilayah seperti `en-US`.
- Hasil di-cache selama 15 menit secara default (dapat dikonfigurasi melalui `cacheTtlMinutes`).
- Nilai `webSearch.baseUrl` kustom disertakan dalam identitas cache Brave, sehingga
  respons khusus proksi tidak bertabrakan.
- Aktifkan flag diagnostik `brave.http` untuk mencatat URL/parameter kueri permintaan Brave, status/waktu respons, dan peristiwa hit/miss/write cache pencarian saat memecahkan masalah. Flag ini tidak pernah mencatat kunci API atau isi respons, tetapi kueri pencarian dapat bersifat sensitif.

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Perplexity Search](/id/tools/perplexity-search) -- hasil terstruktur dengan pemfilteran domain
- [Exa Search](/id/tools/exa-search) -- pencarian neural dengan ekstraksi konten
