---
read_when:
    - Anda ingin menggunakan Exa untuk web_search
    - Anda memerlukan EXA_API_KEY
    - Anda menginginkan pencarian neural atau ekstraksi konten
summary: Pencarian Exa AI -- pencarian neural dan kata kunci dengan ekstraksi konten
title: Pencarian Exa
x-i18n:
    generated_at: "2026-07-12T14:41:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) adalah penyedia `web_search` dengan mode pencarian neural, kata kunci, dan
hibrida serta ekstraksi konten bawaan (sorotan, teks,
ringkasan).

## Instal Plugin

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Dapatkan kunci API

<Steps>
  <Step title="Buat akun">
    Daftar di [exa.ai](https://exa.ai/) dan buat kunci API dari
    dasbor Anda.
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

**Alternatif lingkungan:** atur `EXA_API_KEY` di lingkungan Gateway. Untuk
instalasi Gateway, letakkan di `~/.openclaw/.env`. Lihat
[Variabel lingkungan](/id/help/faq#env-vars-and-env-loading).

## Penggantian URL dasar

Atur `plugins.entries.exa.config.webSearch.baseUrl` untuk merutekan permintaan
pencarian Exa melalui proksi yang kompatibel atau endpoint alternatif. OpenClaw
menormalkan host polos dengan menambahkan `https://` di awal dan menambahkan `/search`, kecuali
jalurnya sudah diakhiri dengan itu. Endpoint yang telah ditentukan menjadi bagian dari kunci
cache pencarian, sehingga hasil dari endpoint yang berbeda tidak pernah dibagikan.

## Parameter alat

<ParamField path="query" type="string" required>
Kueri pencarian.
</ParamField>

<ParamField path="count" type="number" default="5">
Jumlah hasil yang dikembalikan (1–100, mengikuti batas jenis pencarian Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Mode pencarian.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filter waktu. Tidak dapat digabungkan dengan `date_after`/`date_before`.
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

Berikan objek `contents` untuk mengatur konten yang diekstrak dalam hasil:

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

| Opsi konten     | Jenis                                                                 | Deskripsi                  |
| --------------- | --------------------------------------------------------------------- | -------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | Ekstrak teks halaman penuh |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Ekstrak kalimat utama      |
| `summary`       | `boolean \| { query }`                                                | Ringkasan buatan AI        |

Jika `contents` dihilangkan, Exa menetapkan `{ highlights: true }` secara default sehingga hasil
menyertakan cuplikan kalimat utama. Deskripsi hasil diambil terlebih dahulu dari sorotan,
lalu ringkasan, kemudian teks lengkap—mana pun yang tersedia lebih dahulu. Hasil
juga mempertahankan kolom mentah `highlightScores` dan `summary` dari respons API Exa
jika tersedia.

### Mode pencarian

| Mode             | Deskripsi                                    |
| ---------------- | -------------------------------------------- |
| `auto`           | Exa memilih mode terbaik (default)           |
| `neural`         | Pencarian semantik/berdasarkan makna         |
| `fast`           | Pencarian kata kunci cepat                   |
| `deep`           | Pencarian mendalam yang menyeluruh           |
| `deep-reasoning` | Pencarian mendalam dengan penalaran          |
| `instant`        | Hasil tercepat                               |

## Catatan

- `count` menerima hingga 100, mengikuti batas jenis pencarian Exa.
- Hasil disimpan dalam cache selama 15 menit secara default. Konfigurasikan
  `tools.web.search.cacheTtlMinutes` bersama (dalam menit) dan
  `tools.web.search.timeoutSeconds` (default 30 detik) untuk mengubah cache dan
  batas waktu permintaan bagi semua penyedia `web_search`, termasuk Exa.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan filter negara/bahasa
- [Perplexity Search](/id/tools/perplexity-search) -- hasil terstruktur dengan pemfilteran domain
