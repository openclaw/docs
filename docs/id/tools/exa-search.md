---
read_when:
    - Anda ingin menggunakan Exa untuk web_search
    - Anda memerlukan `EXA_API_KEY`
    - Anda menginginkan pencarian neural atau ekstraksi konten
summary: Pencarian AI Exa -- pencarian neural dan kata kunci dengan ekstraksi konten
title: Pencarian Exa
x-i18n:
    generated_at: "2026-04-24T09:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw mendukung [Exa AI](https://exa.ai/) sebagai provider `web_search`. Exa
menawarkan mode pencarian neural, kata kunci, dan hibrida dengan ekstraksi
konten bawaan (highlight, teks, ringkasan).

## Dapatkan API key

<Steps>
  <Step title="Buat akun">
    Daftar di [exa.ai](https://exa.ai/) dan buat API key dari
    dasbor Anda.
  </Step>
  <Step title="Simpan key">
    Tetapkan `EXA_API_KEY` di lingkungan Gateway, atau konfigurasi melalui:

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
            apiKey: "exa-...", // opsional jika EXA_API_KEY ditetapkan
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

**Alternatif variabel lingkungan:** tetapkan `EXA_API_KEY` di lingkungan Gateway.
Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

## Parameter alat

<ParamField path="query" type="string" required>
Kueri pencarian.
</ParamField>

<ParamField path="count" type="number">
Jumlah hasil yang dikembalikan (1–100).
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
untuk mengaktifkannya:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // teks halaman penuh
    highlights: { numSentences: 3 }, // kalimat kunci
    summary: true, // ringkasan AI
  },
});
```

| Opsi contents | Tipe                                                                  | Deskripsi                |
| ------------- | --------------------------------------------------------------------- | ------------------------ |
| `text`        | `boolean \| { maxCharacters }`                                        | Ekstrak teks halaman penuh |
| `highlights`  | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Ekstrak kalimat kunci    |
| `summary`     | `boolean \| { query }`                                                | Ringkasan yang dihasilkan AI |

### Mode pencarian

| Mode             | Deskripsi                            |
| ---------------- | ------------------------------------ |
| `auto`           | Exa memilih mode terbaik (default)   |
| `neural`         | Pencarian semantik/berbasis makna    |
| `fast`           | Pencarian kata kunci cepat           |
| `deep`           | Pencarian mendalam menyeluruh        |
| `deep-reasoning` | Pencarian mendalam dengan reasoning  |
| `instant`        | Hasil tercepat                       |

## Catatan

- Jika tidak ada opsi `contents` yang diberikan, Exa default ke `{ highlights: true }`
  sehingga hasil menyertakan kutipan kalimat kunci
- Hasil mempertahankan field `highlightScores` dan `summary` dari respons API Exa
  saat tersedia
- Deskripsi hasil di-resolve dari highlight terlebih dahulu, lalu ringkasan, lalu
  teks penuh — mana pun yang tersedia
- `freshness` dan `date_after`/`date_before` tidak dapat digabungkan — gunakan salah
  satu mode filter waktu
- Hingga 100 hasil dapat dikembalikan per kueri (tergantung batas
  tipe pencarian Exa)
- Hasil di-cache selama 15 menit secara default (dapat dikonfigurasi melalui
  `cacheTtlMinutes`)
- Exa adalah integrasi API resmi dengan respons JSON terstruktur

## Terkait

- [Gambaran umum Web Search](/id/tools/web) -- semua provider dan deteksi otomatis
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan filter negara/bahasa
- [Perplexity Search](/id/tools/perplexity-search) -- hasil terstruktur dengan pemfilteran domain
