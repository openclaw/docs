---
read_when:
    - Anda ingin mengonfigurasi Perplexity sebagai penyedia pencarian web
    - Anda memerlukan kunci API Perplexity atau konfigurasi proksi OpenRouter
summary: Penyiapan penyedia pencarian web Perplexity (kunci API, mode pencarian, pemfilteran)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T14:38:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity mendaftarkan penyedia `web_search` dengan dua transport: Perplexity Search API
native (hasil terstruktur dengan filter) dan penyelesaian percakapan Perplexity
Sonar, secara langsung atau melalui OpenRouter (jawaban hasil sintesis AI dengan
kutipan).

<Note>
Halaman ini membahas penyiapan **penyedia** Perplexity. Untuk **alat** Perplexity (cara agen menggunakannya), lihat [Pencarian Perplexity](/id/tools/perplexity-search).
</Note>

| Properti    | Nilai                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Jenis       | Penyedia pencarian web (bukan penyedia model)                          |
| Autentikasi | `PERPLEXITY_API_KEY` (native) atau `OPENROUTER_API_KEY` (melalui OpenRouter) |
| Jalur konfigurasi | `plugins.entries.perplexity.config.webSearch.apiKey`             |
| Penimpaan   | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| Dapatkan kunci | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) |

## Instal Plugin

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Tetapkan kunci API">
    ```bash
    openclaw configure --section web
    ```

    Atau tetapkan kunci secara langsung:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Kunci yang diekspor sebagai `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY` di lingkungan Gateway
    juga dapat digunakan.

  </Step>
  <Step title="Mulai mencari">
    `web_search` mendeteksi Perplexity secara otomatis setelah kuncinya menjadi kredensial pencarian
    yang tersedia; tidak diperlukan penyiapan lebih lanjut. Untuk menetapkan penyedia secara eksplisit:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## Mode pencarian

Plugin menentukan transport dalam urutan berikut:

1. `webSearch.baseUrl` atau `webSearch.model` ditetapkan: selalu merutekan melalui penyelesaian percakapan Sonar ke titik akhir tersebut, apa pun jenis kuncinya.
2. Jika tidak, sumber kunci menentukan titik akhir: prefiks kunci yang dikonfigurasi memilih transport (konfigurasi mengalahkan variabel lingkungan); kunci lingkungan langsung menggunakan titik akhir yang sesuai.

| Prefiks kunci | Transport                                                  | Fitur                                            |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `pplx-`    | Perplexity Search API native (`https://api.perplexity.ai`) | Hasil terstruktur, filter domain/bahasa/tanggal  |
| `sk-or-`   | OpenRouter (`https://openrouter.ai/api/v1`), model Sonar   | Jawaban hasil sintesis AI dengan kutipan         |

Kunci yang dikonfigurasi dengan prefiks lain juga menggunakan Search API native. Jalur
penyelesaian percakapan secara default menggunakan model `perplexity/sonar-pro`; timpa
dengan `plugins.entries.perplexity.config.webSearch.model`.

## Pemfilteran API native

| Filter                               | Deskripsi                                                       | Transport       |
| ------------------------------------ | --------------------------------------------------------------- | --------------- |
| `count`                              | Hasil per pencarian, 1–10 (default 5)                           | Hanya native    |
| `freshness`                          | Rentang kebaruan: `day`, `week`, `month`, `year`                | Keduanya        |
| `country`                            | Kode negara 2 huruf (`us`, `de`, `jp`)                          | Hanya native    |
| `language`                           | Kode bahasa ISO 639-1 (`en`, `fr`, `zh`)                        | Hanya native    |
| `date_after` / `date_before`         | Rentang tanggal publikasi dalam `YYYY-MM-DD`                    | Hanya native    |
| `domain_filter`                      | Maks. 20 domain; daftar izin atau daftar tolak berprefiks `-`, tidak boleh dicampur | Hanya native |
| `max_tokens` / `max_tokens_per_page` | Anggaran konten untuk semua hasil / per halaman                 | Hanya native    |

Filter khusus native mengembalikan galat deskriptif pada jalur penyelesaian percakapan.
`freshness` tidak dapat digabungkan dengan `date_after`/`date_before`.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Variabel lingkungan untuk proses daemon">
    <Warning>
    Kunci yang hanya diekspor di shell interaktif tidak terlihat oleh daemon Gateway
    launchd/systemd kecuali lingkungan tersebut diimpor secara eksplisit. Tetapkan kunci di
    `~/.openclaw/.env` atau melalui `env.shellEnv` agar proses Gateway dapat membacanya.
    Lihat [Variabel lingkungan](/id/help/environment) untuk urutan prioritas lengkap.
    </Warning>
  </Accordion>

  <Accordion title="Penyiapan proksi OpenRouter">
    Untuk merutekan pencarian Perplexity melalui OpenRouter, tetapkan `OPENROUTER_API_KEY`
    (prefiks `sk-or-`) sebagai pengganti kunci native Perplexity. OpenClaw mendeteksi
    kunci tersebut dan secara otomatis beralih ke transport Sonar. Ini berguna jika Anda sudah
    menyiapkan penagihan OpenRouter dan ingin menggabungkan penyedia di sana.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Alat pencarian Perplexity" href="/id/tools/perplexity-search" icon="magnifying-glass">
    Cara agen menjalankan pencarian Perplexity dan menafsirkan hasilnya.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap, termasuk entri Plugin.
  </Card>
</CardGroup>
