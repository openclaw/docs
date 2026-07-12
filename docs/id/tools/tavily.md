---
read_when:
    - Anda ingin pencarian web yang didukung Tavily
    - Anda memerlukan kunci API Tavily
    - Anda ingin menggunakan Tavily sebagai penyedia web_search
    - Anda ingin mengekstrak konten dari URL
summary: Alat pencarian dan ekstraksi Tavily
title: Tavily
x-i18n:
    generated_at: "2026-07-12T14:43:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) adalah API pencarian yang dirancang untuk aplikasi AI. OpenClaw menyediakannya dalam dua cara:

- sebagai penyedia `web_search` untuk alat pencarian generik
- sebagai alat Plugin eksplisit: `tavily_search` dan `tavily_extract`

Tavily mengembalikan hasil terstruktur yang dioptimalkan untuk digunakan oleh LLM, dengan kedalaman pencarian yang dapat dikonfigurasi, pemfilteran topik, filter domain, ringkasan jawaban yang dihasilkan AI, serta ekstraksi konten dari URL (termasuk halaman yang dirender dengan JavaScript).

| Properti   | Nilai                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| ID Plugin  | `tavily`                                                                                                   |
| Paket      | `@openclaw/tavily-plugin`                                                                                  |
| Autentikasi | variabel lingkungan `TAVILY_API_KEY` atau konfigurasi `apiKey`                                            |
| URL dasar  | `https://api.tavily.com` (bawaan); variabel lingkungan `TAVILY_BASE_URL` atau konfigurasi `baseUrl` untuk menggantinya |
| Batas waktu | pencarian 30 dtk., ekstraksi 60 dtk. (bawaan)                                                             |
| Alat       | `tavily_search`, `tavily_extract`                                                                          |

## Memulai

<Steps>
  <Step title="Instal Plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Dapatkan kunci API">
    Buat akun Tavily di [tavily.com](https://tavily.com), lalu buat kunci API di dasbor.
  </Step>
  <Step title="Konfigurasikan Plugin dan penyedia">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // opsional jika TAVILY_API_KEY ditetapkan
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
    Picu `web_search` dari agen mana pun, atau panggil `tavily_search` secara langsung.
  </Step>
</Steps>

<Tip>
Memilih Tavily saat orientasi awal atau melalui `openclaw configure --section web` akan menginstal dan mengaktifkan Plugin Tavily resmi bila diperlukan.
</Tip>

## Referensi alat

### `tavily_search`

Gunakan ini ketika Anda menginginkan kontrol pencarian khusus Tavily, bukan `web_search` generik.

| Parameter         | Tipe         | Batasan / bawaan                       | Deskripsi                                             |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------------- |
| `query`           | string       | wajib                                  | String kueri pencarian.                               |
| `search_depth`    | enum         | `basic` (bawaan), `advanced`           | `advanced` lebih lambat, tetapi relevansinya lebih tinggi. |
| `topic`           | enum         | `general` (bawaan), `news`, `finance`  | Filter berdasarkan kelompok topik.                    |
| `max_results`     | integer      | 1-20, bawaan `5`                       | Jumlah hasil.                                         |
| `include_answer`  | boolean      | bawaan `false`                         | Sertakan ringkasan jawaban yang dihasilkan AI Tavily. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Filter hasil berdasarkan kebaruan.                    |
| `include_domains` | array string | (tidak ada)                            | Hanya sertakan hasil dari domain-domain ini.           |
| `exclude_domains` | array string | (tidak ada)                            | Kecualikan hasil dari domain-domain ini.               |

Kompromi kedalaman pencarian:

| Kedalaman  | Kecepatan    | Relevansi | Paling sesuai untuk                         |
| ---------- | ------------ | --------- | ------------------------------------------- |
| `basic`    | Lebih cepat  | Tinggi    | Kueri serbaguna (bawaan).                   |
| `advanced` | Lebih lambat | Tertinggi | Riset presisi dan pencarian fakta.          |

### `tavily_extract`

Gunakan ini untuk mengekstrak konten bersih dari satu atau beberapa URL. Mendukung halaman yang dirender dengan JavaScript serta pembagian potongan yang berfokus pada kueri untuk ekstraksi tertarget.

| Parameter           | Tipe         | Batasan / bawaan              | Deskripsi                                                        |
| ------------------- | ------------ | ----------------------------- | ---------------------------------------------------------------- |
| `urls`              | array string | wajib, 1-20                   | URL sumber konten yang akan diekstrak.                            |
| `query`             | string       | (opsional)                    | Urutkan ulang potongan hasil ekstraksi berdasarkan relevansinya dengan kueri ini. |
| `extract_depth`     | enum         | `basic` (bawaan), `advanced`  | Gunakan `advanced` untuk halaman sarat JS, SPA, atau tabel dinamis. |
| `chunks_per_source` | integer      | 1-5; **memerlukan `query`**   | Jumlah potongan yang dikembalikan per URL. Menghasilkan galat jika ditetapkan tanpa `query`. |
| `include_images`    | boolean      | bawaan `false`                | Sertakan URL gambar dalam hasil.                                 |

Kompromi kedalaman ekstraksi:

| Kedalaman  | Waktu penggunaan                                  |
| ---------- | ------------------------------------------------- |
| `basic`    | Halaman sederhana. Coba ini terlebih dahulu.      |
| `advanced` | SPA yang dirender JS, konten dinamis, dan tabel.  |

<Tip>
Bagi daftar URL yang lebih besar menjadi beberapa panggilan `tavily_extract` (maks. 20 per permintaan). Gunakan `query` bersama `chunks_per_source` untuk hanya mendapatkan konten yang relevan, bukan halaman lengkap.
</Tip>

## Memilih alat yang tepat

| Kebutuhan                                      | Alat               |
| ---------------------------------------------- | ------------------ |
| Pencarian web cepat tanpa opsi khusus           | `web_search`       |
| Pencarian dengan kedalaman, topik, jawaban AI   | `tavily_search`    |
| Mengekstrak konten dari URL tertentu            | `tavily_extract`   |

<Note>
Alat `web_search` generik dengan Tavily sebagai penyedia mendukung `query` dan `count` (hingga 20 hasil). Untuk kontrol khusus Tavily (`search_depth`, `topic`, `include_answer`, filter domain, rentang waktu), gunakan `tavily_search`.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Urutan resolusi kunci API">
    Klien Tavily mencari kunci API dalam urutan berikut:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (diresolusikan melalui SecretRefs).
    2. `TAVILY_API_KEY` dari lingkungan Gateway.

    `tavily_search` dan `tavily_extract` sama-sama memunculkan galat penyiapan jika keduanya tidak tersedia.

  </Accordion>

  <Accordion title="URL dasar khusus">
    Ganti `plugins.entries.tavily.config.webSearch.baseUrl`, atau tetapkan `TAVILY_BASE_URL`, jika Anda mengakses Tavily melalui proksi. Konfigurasi diprioritaskan daripada variabel lingkungan. Nilai bawaannya adalah `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` memerlukan `query`">
    `tavily_extract` menolak panggilan yang meneruskan `chunks_per_source` tanpa `query`. Tavily mengurutkan potongan berdasarkan relevansinya dengan kueri, sehingga parameter tersebut tidak bermakna tanpa kueri.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Ikhtisar Pencarian Web" href="/id/tools/web" icon="magnifying-glass">
    Semua penyedia dan aturan deteksi otomatis.
  </Card>
  <Card title="Firecrawl" href="/id/tools/firecrawl" icon="fire">
    Pencarian beserta pengambilan data dengan ekstraksi konten.
  </Card>
  <Card title="Pencarian Exa" href="/id/tools/exa-search" icon="binoculars">
    Pencarian neural dengan ekstraksi konten.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Skema konfigurasi lengkap untuk entri Plugin dan perutean alat.
  </Card>
</CardGroup>
