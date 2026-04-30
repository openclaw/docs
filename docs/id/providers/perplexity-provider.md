---
read_when:
    - Anda ingin mengonfigurasi Perplexity sebagai penyedia pencarian web
    - Anda memerlukan kunci API Perplexity atau penyiapan proksi OpenRouter
summary: Penyiapan penyedia pencarian web Perplexity (kunci API, mode pencarian, pemfilteran)
title: Perplexity
x-i18n:
    generated_at: "2026-04-30T10:08:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity menyediakan kemampuan pencarian web melalui Perplexity
Search API atau Perplexity Sonar melalui OpenRouter.

<Note>
Halaman ini adalah penyiapan **penyedia** Perplexity. Untuk **alat** Perplexity (cara agen menggunakannya), lihat [alat Perplexity](/id/tools/perplexity-search).
</Note>

| Properti    | Nilai                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Jenis       | Penyedia pencarian web (bukan penyedia model)                          |
| Autentikasi | `PERPLEXITY_API_KEY` (langsung) atau `OPENROUTER_API_KEY` (melalui OpenRouter) |
| Jalur konfigurasi | `plugins.entries.perplexity.config.webSearch.apiKey`             |

## Mulai

<Steps>
  <Step title="Atur kunci API">
    Jalankan alur konfigurasi pencarian web interaktif:

    ```bash
    openclaw configure --section web
    ```

    Atau atur kunci secara langsung:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Mulai mencari">
    Agen akan otomatis menggunakan Perplexity untuk pencarian web setelah kunci
    dikonfigurasi. Tidak diperlukan langkah tambahan.
  </Step>
</Steps>

## Mode pencarian

Plugin memilih transport secara otomatis berdasarkan prefiks kunci API:

<Tabs>
  <Tab title="API Perplexity asli (pplx-)">
    Saat kunci Anda dimulai dengan `pplx-`, OpenClaw menggunakan Perplexity Search
    API asli. Transport ini mengembalikan hasil terstruktur dan mendukung filter domain,
    bahasa, dan tanggal (lihat opsi pemfilteran di bawah).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Saat kunci Anda dimulai dengan `sk-or-`, OpenClaw merutekan melalui OpenRouter menggunakan
    model Perplexity Sonar. Transport ini mengembalikan jawaban yang disintesis AI dengan
    sitasi.
  </Tab>
</Tabs>

| Prefiks kunci | Transport                    | Fitur                                            |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Perplexity Search API asli   | Hasil terstruktur, filter domain/bahasa/tanggal  |
| `sk-or-`   | OpenRouter (Sonar)           | Jawaban yang disintesis AI dengan sitasi         |

## Pemfilteran API asli

<Note>
Opsi pemfilteran hanya tersedia saat menggunakan API Perplexity asli
(kunci `pplx-`). Pencarian OpenRouter/Sonar tidak mendukung parameter ini.
</Note>

Saat menggunakan API Perplexity asli, pencarian mendukung filter berikut:

| Filter         | Deskripsi                              | Contoh                              |
| -------------- | -------------------------------------- | ----------------------------------- |
| Negara         | Kode negara 2 huruf                    | `us`, `de`, `jp`                    |
| Bahasa         | Kode bahasa ISO 639-1                  | `en`, `fr`, `zh`                    |
| Rentang tanggal | Jendela keterkinian                   | `day`, `week`, `month`, `year`      |
| Filter domain  | Daftar izinkan atau daftar tolak (maks 20 domain) | `example.com`                       |
| Anggaran konten | Batas token per respons / per halaman | `max_tokens`, `max_tokens_per_page` |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Variabel lingkungan untuk proses daemon">
    Jika OpenClaw Gateway berjalan sebagai daemon (launchd/systemd), pastikan
    `PERPLEXITY_API_KEY` tersedia untuk proses tersebut.

    <Warning>
    Kunci yang hanya diatur di `~/.profile` tidak akan terlihat oleh daemon
    launchd/systemd kecuali lingkungan tersebut diimpor secara eksplisit. Atur kunci di
    `~/.openclaw/.env` atau melalui `env.shellEnv` untuk memastikan proses Gateway dapat
    membacanya.
    </Warning>

  </Accordion>

  <Accordion title="Penyiapan proksi OpenRouter">
    Jika Anda lebih memilih merutekan pencarian Perplexity melalui OpenRouter, atur
    `OPENROUTER_API_KEY` (prefiks `sk-or-`) sebagai pengganti kunci Perplexity asli.
    OpenClaw akan mendeteksi prefiks dan beralih ke transport Sonar
    secara otomatis.

    <Tip>
    Transport OpenRouter berguna jika Anda sudah memiliki akun OpenRouter
    dan ingin penagihan terkonsolidasi di beberapa penyedia.
    </Tip>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Alat pencarian Perplexity" href="/id/tools/perplexity-search" icon="magnifying-glass">
    Cara agen menjalankan pencarian Perplexity dan menafsirkan hasil.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap termasuk entri Plugin.
  </Card>
</CardGroup>
