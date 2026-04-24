---
read_when:
    - Anda ingin mengonfigurasi Perplexity sebagai provider web search
    - Anda memerlukan penyiapan API key Perplexity atau proxy OpenRouter
summary: Penyiapan provider web search Perplexity (API key, mode pencarian, pemfilteran)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T09:24:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Provider Web Search)

Plugin Perplexity menyediakan kapabilitas web search melalui API Perplexity
Search atau Perplexity Sonar melalui OpenRouter.

<Note>
Halaman ini membahas penyiapan **provider** Perplexity. Untuk **alat**
Perplexity (bagaimana agen menggunakannya), lihat [alat Perplexity](/id/tools/perplexity-search).
</Note>

| Properti    | Nilai                                                                 |
| ----------- | --------------------------------------------------------------------- |
| Jenis       | Provider web search (bukan provider model)                            |
| Auth        | `PERPLEXITY_API_KEY` (langsung) atau `OPENROUTER_API_KEY` (via OpenRouter) |
| Path config | `plugins.entries.perplexity.config.webSearch.apiKey`                  |

## Memulai

<Steps>
  <Step title="Tetapkan API key">
    Jalankan alur konfigurasi web-search interaktif:

    ```bash
    openclaw configure --section web
    ```

    Atau tetapkan key secara langsung:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Mulai mencari">
    Agen akan otomatis menggunakan Perplexity untuk web search setelah key
    dikonfigurasi. Tidak diperlukan langkah tambahan.
  </Step>
</Steps>

## Mode pencarian

Plugin memilih transport secara otomatis berdasarkan prefix API key:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    Ketika key Anda dimulai dengan `pplx-`, OpenClaw menggunakan API Search Perplexity
    native. Transport ini mengembalikan hasil terstruktur dan mendukung filter domain, bahasa,
    dan tanggal (lihat opsi pemfilteran di bawah).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Ketika key Anda dimulai dengan `sk-or-`, OpenClaw merutekan melalui OpenRouter menggunakan
    model Perplexity Sonar. Transport ini mengembalikan jawaban hasil sintesis AI dengan
    sitasi.
  </Tab>
</Tabs>

| Prefix key | Transport                      | Fitur                                            |
| ---------- | ------------------------------ | ------------------------------------------------ |
| `pplx-`    | API Search Perplexity native   | Hasil terstruktur, filter domain/bahasa/tanggal  |
| `sk-or-`   | OpenRouter (Sonar)             | Jawaban hasil sintesis AI dengan sitasi          |

## Pemfilteran API native

<Note>
Opsi pemfilteran hanya tersedia saat menggunakan API Perplexity native
(key `pplx-`). Pencarian OpenRouter/Sonar tidak mendukung parameter ini.
</Note>

Saat menggunakan API Perplexity native, pencarian mendukung filter berikut:

| Filter         | Deskripsi                              | Contoh                               |
| -------------- | -------------------------------------- | ------------------------------------ |
| Negara         | Kode negara 2 huruf                    | `us`, `de`, `jp`                     |
| Bahasa         | Kode bahasa ISO 639-1                  | `en`, `fr`, `zh`                     |
| Rentang tanggal | Jendela recency                       | `day`, `week`, `month`, `year`       |
| Filter domain  | Allowlist atau denylist (maks 20 domain) | `example.com`                      |
| Anggaran konten | Batas token per respons / per halaman | `max_tokens`, `max_tokens_per_page`  |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Environment variable untuk proses daemon">
    Jika Gateway OpenClaw berjalan sebagai daemon (launchd/systemd), pastikan
    `PERPLEXITY_API_KEY` tersedia untuk proses itu.

    <Warning>
    Key yang hanya diatur di `~/.profile` tidak akan terlihat oleh daemon
    launchd/systemd kecuali environment itu diimpor secara eksplisit. Atur key di
    `~/.openclaw/.env` atau melalui `env.shellEnv` untuk memastikan proses gateway dapat
    membacanya.
    </Warning>

  </Accordion>

  <Accordion title="Penyiapan proxy OpenRouter">
    Jika Anda lebih suka merutekan pencarian Perplexity melalui OpenRouter, atur
    `OPENROUTER_API_KEY` (prefix `sk-or-`) alih-alih key Perplexity native.
    OpenClaw akan mendeteksi prefix tersebut dan beralih ke transport Sonar
    secara otomatis.

    <Tip>
    Transport OpenRouter berguna jika Anda sudah memiliki akun OpenRouter
    dan ingin penagihan yang terkonsolidasi lintas beberapa provider.
    </Tip>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Perplexity search tool" href="/id/tools/perplexity-search" icon="magnifying-glass">
    Bagaimana agen memanggil pencarian Perplexity dan menafsirkan hasilnya.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap termasuk entri Plugin.
  </Card>
</CardGroup>
