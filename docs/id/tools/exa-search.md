---
read_when:
    - Anda ingin menggunakan Exa untuk web_search
    - Anda memerlukan EXA_API_KEY
    - Anda menginginkan pencarian neural atau ekstraksi konten
summary: Pencarian Exa AI -- pencarian neural dan kata kunci dengan ekstraksi konten
title: Pencarian Exa
x-i18n:
    generated_at: "2026-05-02T09:33:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2ddf83c5130208eadc78eccb10aebf67af11b05690d75a817d6999f79be5fc3
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw mendukung [Exa AI](https://exa.ai/) sebagai penyedia `web_search`. Exa
menawarkan mode pencarian neural, kata kunci, dan hibrida dengan ekstraksi
konten bawaan (sorotan, teks, ringkasan).

## Dapatkan API key

<Steps>
  <Step title="Buat akun">
    Daftar di [exa.ai](https://exa.ai/) dan buat API key dari
    dashboard Anda.
  </Step>
  <Step title="Simpan kunci">
    Atur `EXA_API_KEY` di lingkungan Gateway, atau konfigurasikan melalui:

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternatif lingkungan:** atur `EXA_API_KEY` di lingkungan Gateway.
Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

## Penggantian URL dasar

Atur `plugins.entries.exa.config.webSearch.baseUrl` ketika permintaan pencarian Exa
harus melewati proxy yang kompatibel atau endpoint Exa alternatif. OpenClaw
menormalkan host polos dengan menambahkan `https://` di depan dan menambahkan `/search` kecuali
path sudah berakhir di sana. Endpoint yang diselesaikan disertakan dalam kunci cache
pencarian, sehingga hasil dari endpoint Exa yang berbeda tidak dibagikan.

## Parameter tool

<ParamField path="query" type="string" required>
Kueri pencarian.
</ParamField>

<ParamField path="count" type="number">
Hasil yang akan dikembalikan (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Mode pencarian.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filter waktu.
</ParamField>

<ParamField path="date_after" type="string">
Hasil setelah tanggal ini (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Hasil sebelum tanggal ini (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opsi ekstraksi konten (lihat di bawah).
</ParamField>

### Ekstraksi konten

Exa dapat mengembalikan konten yang diekstrak bersama hasil pencarian. Berikan objek `contents`
untuk mengaktifkan:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Opsi contents   | Tipe                                                                  | Deskripsi                      |
| --------------- | --------------------------------------------------------------------- | ------------------------------ |
| `text`          | `boolean \| { maxCharacters }`                                        | Ekstrak teks halaman penuh     |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Ekstrak kalimat kunci          |
| `summary`       | `boolean \| { query }`                                                | Ringkasan yang dihasilkan AI   |

### Mode pencarian

| Mode             | Deskripsi                                 |
| ---------------- | ----------------------------------------- |
| `auto`           | Exa memilih mode terbaik (default)        |
| `neural`         | Pencarian semantik/berbasis makna         |
| `fast`           | Pencarian kata kunci cepat                |
| `deep`           | Pencarian mendalam yang menyeluruh        |
| `deep-reasoning` | Pencarian mendalam dengan penalaran       |
| `instant`        | Hasil tercepat                            |

## Catatan

- Jika tidak ada opsi `contents` yang diberikan, Exa menggunakan default `{ highlights: true }`
  sehingga hasil menyertakan cuplikan kalimat kunci
- Hasil mempertahankan field `highlightScores` dan `summary` dari respons API Exa
  jika tersedia
- Deskripsi hasil diselesaikan dari sorotan terlebih dahulu, lalu ringkasan, lalu
  teks penuh — mana pun yang tersedia
- `freshness` dan `date_after`/`date_before` tidak dapat digabungkan — gunakan satu
  mode filter waktu
- Hingga 100 hasil dapat dikembalikan per kueri (tunduk pada batas tipe pencarian
  Exa)
- Hasil di-cache selama 15 menit secara default (dapat dikonfigurasi melalui
  `cacheTtlMinutes`)
- Exa adalah integrasi API resmi dengan respons JSON terstruktur

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan filter negara/bahasa
- [Perplexity Search](/id/tools/perplexity-search) -- hasil terstruktur dengan pemfilteran domain
