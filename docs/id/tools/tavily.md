---
read_when:
    - Anda menginginkan pencarian web yang didukung Tavily
    - Anda memerlukan kunci API Tavily
    - Anda ingin Tavily sebagai penyedia web_search
    - Anda menginginkan ekstraksi konten dari URL
summary: Alat pencarian dan ekstraksi Tavily
title: Tavily
x-i18n:
    generated_at: "2026-05-10T19:56:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) adalah API pencarian yang dirancang untuk aplikasi AI. OpenClaw mengeksposnya dalam dua cara:

- sebagai penyedia `web_search` untuk alat pencarian generik
- sebagai alat Plugin eksplisit: `tavily_search` dan `tavily_extract`

Tavily mengembalikan hasil terstruktur yang dioptimalkan untuk konsumsi LLM dengan kedalaman pencarian yang dapat dikonfigurasi, pemfilteran topik, filter domain, ringkasan jawaban yang dihasilkan AI, dan ekstraksi konten dari URL (termasuk halaman yang dirender JavaScript).

| Properti      | Nilai                               |
| ------------- | ----------------------------------- |
| Id Plugin     | `tavily`                            |
| Autentikasi   | `TAVILY_API_KEY` atau config `apiKey` |
| URL dasar     | `https://api.tavily.com` (default)  |
| Alat bawaan   | `tavily_search`, `tavily_extract`   |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API">
    Buat akun Tavily di [tavily.com](https://tavily.com), lalu buat kunci API di dasbor.
  </Step>
  <Step title="Konfigurasikan plugin dan penyedia">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifikasi pencarian berjalan">
    Picu `web_search` dari agent mana pun, atau panggil `tavily_search` secara langsung.
  </Step>
</Steps>

<Tip>
Memilih Tavily saat onboarding atau `openclaw configure --section web` mengaktifkan Plugin Tavily bawaan secara otomatis.
</Tip>

## Referensi alat

### `tavily_search`

Gunakan ini ketika Anda menginginkan kontrol pencarian khusus Tavily, bukan `web_search` generik.

| Parameter         | Jenis        | Batasan / default                     | Deskripsi                                       |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | wajib                                  | String kueri pencarian. Jaga agar di bawah 400 karakter. |
| `search_depth`    | enum         | `basic` (default), `advanced`          | `advanced` lebih lambat tetapi relevansinya lebih tinggi. |
| `topic`           | enum         | `general` (default), `news`, `finance` | Filter berdasarkan keluarga topik.              |
| `max_results`     | integer      | 1-20                                   | Jumlah hasil.                                   |
| `include_answer`  | boolean      | default `false`                        | Sertakan ringkasan jawaban yang dihasilkan AI Tavily. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Filter hasil berdasarkan kebaruan.              |
| `include_domains` | array string | (tidak ada)                            | Hanya sertakan hasil dari domain-domain ini.    |
| `exclude_domains` | array string | (tidak ada)                            | Kecualikan hasil dari domain-domain ini.        |

Tradeoff kedalaman pencarian:

| Kedalaman  | Kecepatan   | Relevansi | Paling cocok untuk                    |
| ---------- | ----------- | --------- | ------------------------------------ |
| `basic`    | Lebih cepat | Tinggi    | Kueri serbaguna (default).            |
| `advanced` | Lebih lambat | Tertinggi | Riset presisi dan pencarian fakta. |

### `tavily_extract`

Gunakan ini untuk mengekstrak konten bersih dari satu atau beberapa URL. Menangani halaman yang dirender JavaScript dan mendukung pemotongan berfokus kueri untuk ekstraksi yang ditargetkan.

| Parameter           | Jenis        | Batasan / default            | Deskripsi                                                   |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | array string | wajib, 1-20                   | URL untuk mengekstrak konten.                               |
| `query`             | string       | (opsional)                    | Urutkan ulang potongan yang diekstrak berdasarkan relevansi terhadap kueri ini. |
| `extract_depth`     | enum         | `basic` (default), `advanced` | Gunakan `advanced` untuk halaman yang berat JS, SPA, atau tabel dinamis. |
| `chunks_per_source` | integer      | 1-5; **membutuhkan `query`**  | Potongan yang dikembalikan per URL. Error jika disetel tanpa `query`. |
| `include_images`    | boolean      | default `false`               | Sertakan URL gambar dalam hasil.                            |

Tradeoff kedalaman ekstraksi:

| Kedalaman  | Kapan digunakan                              |
| ---------- | ------------------------------------------ |
| `basic`    | Halaman sederhana. Coba ini terlebih dahulu. |
| `advanced` | SPA yang dirender JS, konten dinamis, tabel. |

<Tip>
Bagi daftar URL yang lebih besar menjadi beberapa panggilan `tavily_extract` (maks 20 per permintaan). Gunakan `query` plus `chunks_per_source` untuk mendapatkan hanya konten yang relevan, bukan halaman penuh.
</Tip>

## Memilih alat yang tepat

| Kebutuhan                            | Alat             |
| ------------------------------------ | ---------------- |
| Pencarian web cepat, tanpa opsi khusus | `web_search`   |
| Pencarian dengan kedalaman, topik, jawaban AI | `tavily_search` |
| Ekstrak konten dari URL tertentu     | `tavily_extract` |

<Note>
Alat `web_search` generik dengan Tavily sebagai penyedia mendukung `query` dan `count` (hingga 20 hasil). Untuk kontrol khusus Tavily (`search_depth`, `topic`, `include_answer`, filter domain, rentang waktu), gunakan `tavily_search` sebagai gantinya.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Urutan resolusi kunci API">
    Klien Tavily mencari kunci API-nya dalam urutan ini:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (diresolusikan melalui SecretRefs).
    2. `TAVILY_API_KEY` dari lingkungan Gateway.

    `tavily_extract` memunculkan error penyiapan jika keduanya tidak ada.

  </Accordion>

  <Accordion title="URL dasar khusus">
    Timpa `plugins.entries.tavily.config.webSearch.baseUrl` jika Anda menyalurkan Tavily melalui proksi. Default-nya adalah `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` membutuhkan `query`">
    `tavily_extract` menolak panggilan yang meneruskan `chunks_per_source` tanpa `query`. Tavily memeringkat potongan berdasarkan relevansi kueri, sehingga parameter tersebut tidak bermakna tanpa kueri.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Ringkasan Web Search" href="/id/tools/web" icon="magnifying-glass">
    Semua penyedia dan aturan deteksi otomatis.
  </Card>
  <Card title="Firecrawl" href="/id/tools/firecrawl" icon="fire">
    Pencarian plus scraping dengan ekstraksi konten.
  </Card>
  <Card title="Exa Search" href="/id/tools/exa-search" icon="binoculars">
    Pencarian neural dengan ekstraksi konten.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Skema config lengkap untuk entri Plugin dan perutean alat.
  </Card>
</CardGroup>
