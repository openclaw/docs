---
read_when:
    - Anda ingin menggunakan Brave Search untuk web_search
    - Anda memerlukan BRAVE_API_KEY atau detail paket
summary: Penyiapan Brave Search API untuk web_search
title: Pencarian Brave
x-i18n:
    generated_at: "2026-07-20T03:55:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 52168db93abb564eda5868584261e0530ce3cff57c3463a2fc1eded351df30f2
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw mendukung Brave Search API sebagai penyedia `web_search`.

## Mendapatkan kunci API

1. Buat akun Brave Search API di [https://brave.com/search/api/](https://brave.com/search/api/)
2. Di dasbor, pilih paket **Search** dan buat kunci API.
3. Simpan kunci dalam konfigurasi atau atur `BRAVE_API_KEY` di lingkungan Gateway.

## Contoh konfigurasi

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // atau "llm-context"
            baseUrl: "https://api.search.brave.com", // penggantian URL proksi/dasar opsional
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

Pengaturan pencarian khusus penyedia Brave berada di bawah `plugins.entries.brave.config.webSearch.*`; ini adalah jalur konfigurasi kanonis.

`webSearch.mode` mengontrol transportasi Brave:

- `web` (default): pencarian web Brave normal dengan judul, URL, dan cuplikan
- `llm-context`: Brave LLM Context API dengan potongan teks dan sumber yang telah diekstrak untuk grounding

`webSearch.baseUrl` dapat mengarahkan permintaan Brave ke proksi
atau gateway kompatibel Brave yang tepercaya. OpenClaw menambahkan `/res/v1/web/search` atau `/res/v1/llm/context` ke
URL dasar yang dikonfigurasi dan menyertakan URL dasar dalam kunci cache. Endpoint
publik harus menggunakan `https://`; `http://` hanya diterima untuk host proksi loopback tepercaya
atau jaringan privat.

## Parameter alat

<ParamField path="query" type="string" required>
Kueri pencarian.
</ParamField>

<ParamField path="count" type="number" default="5">
Jumlah hasil yang akan dikembalikan (1–10).
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
// Pencarian khusus negara dan bahasa
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Hasil terbaru (seminggu terakhir)
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

- OpenClaw menggunakan paket **Search** Brave. Jika Anda memiliki langganan lama (misalnya paket Free asli dengan 2.000 kueri/bulan), langganan tersebut tetap berlaku tetapi tidak mencakup fitur yang lebih baru seperti LLM Context atau batas laju yang lebih tinggi.
- Setiap paket Brave mencakup **kredit gratis sebesar \$5/bulan** (diperbarui). Paket Search berbiaya \$5 per 1.000 permintaan, sehingga kredit tersebut mencakup 1.000 kueri/bulan. Atur batas penggunaan Anda di dasbor Brave untuk menghindari biaya tak terduga. Lihat [portal Brave API](https://brave.com/search/api/) untuk paket terkini.
- Paket Search mencakup endpoint LLM Context dan hak inferensi AI. Menyimpan hasil untuk melatih atau menyetel model memerlukan paket dengan hak penyimpanan eksplisit. Lihat [Ketentuan Layanan](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Mode `llm-context` mengembalikan entri sumber yang di-grounding, bukan bentuk cuplikan pencarian web normal.
- Mode `llm-context` mendukung `freshness` dan rentang terbatas `date_after` + `date_before`. Mode ini tidak mendukung `ui_lang`; `date_before` tanpa `date_after` ditolak karena Brave mengharuskan rentang kesegaran khusus mencakup tanggal mulai dan tanggal akhir.
- `ui_lang` harus menyertakan subtag wilayah seperti `en-US`.
- Hasil disimpan dalam cache selama 15 menit secara default (dapat dikonfigurasi melalui `cacheTtlMinutes`).
- Nilai `webSearch.baseUrl` khusus disertakan dalam identitas cache Brave, sehingga
  respons khusus proksi tidak bertabrakan.
- Aktifkan tanda diagnostik `brave.http` untuk mencatat URL/parameter kueri permintaan Brave, status/waktu respons, serta peristiwa hit/miss/penulisan cache pencarian selama pemecahan masalah. Tanda ini tidak pernah mencatat kunci API atau isi respons, tetapi kueri pencarian dapat bersifat sensitif.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Pencarian Perplexity](/id/tools/perplexity-search) -- hasil terstruktur dengan pemfilteran domain
- [Pencarian Exa](/id/tools/exa-search) -- pencarian neural dengan ekstraksi konten
