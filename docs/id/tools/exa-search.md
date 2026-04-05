---
read_when:
    - Anda ingin menggunakan Exa untuk `web_search`
    - Anda memerlukan `EXA_API_KEY`
    - Anda ingin pencarian neural atau ekstraksi konten
summary: Pencarian Exa AI -- pencarian neural dan kata kunci dengan ekstraksi konten
title: Pencarian Exa
x-i18n:
    generated_at: "2026-04-05T14:07:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 307b727b4fb88756cac51c17ffd73468ca695c4481692e03d0b4a9969982a2a8
    source_path: tools/exa-search.md
    workflow: 15
---

# Pencarian Exa

OpenClaw mendukung [Exa AI](https://exa.ai/) sebagai provider `web_search`. Exa
menawarkan mode pencarian neural, kata kunci, dan hibrida dengan ekstraksi
konten bawaan (sorotan, teks, ringkasan).

## Dapatkan API key

<Steps>
  <Step title="Buat akun">
    Daftar di [exa.ai](https://exa.ai/) dan buat API key dari
    dashboard Anda.
  </Step>
  <Step title="Simpan key">
    Setel `EXA_API_KEY` di lingkungan Gateway, atau konfigurasi melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Config

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // opsional jika EXA_API_KEY telah disetel
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

**Alternatif lingkungan:** setel `EXA_API_KEY` di lingkungan Gateway.
Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

## Parameter tool

| Parameter     | Deskripsi                                                                    |
| ------------- | ---------------------------------------------------------------------------- |
| `query`       | Kueri pencarian (wajib)                                                      |
| `count`       | Hasil yang akan dikembalikan (1-100)                                         |
| `type`        | Mode pencarian: `auto`, `neural`, `fast`, `deep`, `deep-reasoning`, atau `instant` |
| `freshness`   | Filter waktu: `day`, `week`, `month`, atau `year`                            |
| `date_after`  | Hasil setelah tanggal ini (YYYY-MM-DD)                                       |
| `date_before` | Hasil sebelum tanggal ini (YYYY-MM-DD)                                       |
| `contents`    | Opsi ekstraksi konten (lihat di bawah)                                       |

### Ekstraksi konten

Exa dapat mengembalikan konten yang diekstrak bersama hasil pencarian. Berikan objek
`contents` untuk mengaktifkannya:

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

| Opsi contents | Tipe                                                                  | Deskripsi               |
| ------------- | --------------------------------------------------------------------- | ----------------------- |
| `text`        | `boolean \| { maxCharacters }`                                        | Ekstrak teks halaman penuh |
| `highlights`  | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Ekstrak kalimat kunci   |
| `summary`     | `boolean \| { query }`                                                | Ringkasan yang dihasilkan AI |

### Mode pencarian

| Mode             | Deskripsi                           |
| ---------------- | ----------------------------------- |
| `auto`           | Exa memilih mode terbaik (default)  |
| `neural`         | Pencarian berbasis semantik/makna   |
| `fast`           | Pencarian kata kunci cepat          |
| `deep`           | Pencarian mendalam yang menyeluruh  |
| `deep-reasoning` | Pencarian mendalam dengan penalaran |
| `instant`        | Hasil tercepat                      |

## Catatan

- Jika tidak ada opsi `contents` yang diberikan, Exa default ke `{ highlights: true }`
  sehingga hasil menyertakan kutipan kalimat kunci
- Hasil mempertahankan field `highlightScores` dan `summary` dari respons API Exa
  jika tersedia
- Deskripsi hasil diambil dari sorotan terlebih dahulu, lalu ringkasan, lalu
  teks penuh — mana pun yang tersedia
- `freshness` dan `date_after`/`date_before` tidak dapat digabungkan — gunakan satu
  mode filter waktu
- Hingga 100 hasil dapat dikembalikan per kueri (tergantung pada batas tipe pencarian Exa)
- Hasil di-cache selama 15 menit secara default (dapat dikonfigurasi melalui
  `cacheTtlMinutes`)
- Exa adalah integrasi API resmi dengan respons JSON terstruktur

## Terkait

- [Ikhtisar Pencarian Web](/tools/web) -- semua provider dan deteksi otomatis
- [Pencarian Brave](/tools/brave-search) -- hasil terstruktur dengan filter negara/bahasa
- [Pencarian Perplexity](/tools/perplexity-search) -- hasil terstruktur dengan pemfilteran domain
