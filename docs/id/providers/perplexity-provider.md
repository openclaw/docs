---
read_when:
    - Anda ingin mengonfigurasi Perplexity sebagai penyedia pencarian web
    - Anda memerlukan kunci API Perplexity atau penyiapan proksi OpenRouter
summary: Penyiapan penyedia pencarian web Perplexity (kunci API, mode pencarian, pemfilteran)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:06:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity menyediakan kemampuan pencarian web melalui Perplexity
Search API atau Perplexity Sonar melalui OpenRouter.

<Note>
Halaman ini adalah penyiapan **provider** Perplexity. Untuk **alat** Perplexity (cara agen menggunakannya), lihat [alat Perplexity](/id/tools/perplexity-search).
</Note>

| Properti    | Nilai                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Tipe        | Provider pencarian web (bukan provider model)                          |
| Auth        | `PERPLEXITY_API_KEY` (langsung) atau `OPENROUTER_API_KEY` (melalui OpenRouter) |
| Jalur config | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Memulai

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

Plugin otomatis memilih transport berdasarkan prefiks kunci API:

<Tabs>
  <Tab title="API Perplexity native (pplx-)">
    Ketika kunci Anda dimulai dengan `pplx-`, OpenClaw menggunakan Perplexity Search
    API native. Transport ini mengembalikan hasil terstruktur dan mendukung filter domain,
    bahasa, dan tanggal (lihat opsi pemfilteran di bawah).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Ketika kunci Anda dimulai dengan `sk-or-`, OpenClaw merutekan melalui OpenRouter menggunakan
    model Perplexity Sonar. Transport ini mengembalikan jawaban yang disintesis AI dengan
    sitasi.
  </Tab>
</Tabs>

| Prefiks kunci | Transport                    | Fitur                                            |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Perplexity Search API native | Hasil terstruktur, filter domain/bahasa/tanggal  |
| `sk-or-`   | OpenRouter (Sonar)           | Jawaban yang disintesis AI dengan sitasi         |

## Pemfilteran API native

<Note>
Opsi pemfilteran hanya tersedia saat menggunakan API Perplexity native
(kunci `pplx-`). Pencarian OpenRouter/Sonar tidak mendukung parameter ini.
</Note>

Saat menggunakan API Perplexity native, pencarian mendukung filter berikut:

| Filter         | Deskripsi                              | Contoh                              |
| -------------- | -------------------------------------- | ----------------------------------- |
| Negara         | Kode negara 2 huruf                    | `us`, `de`, `jp`                    |
| Bahasa         | Kode bahasa ISO 639-1                  | `en`, `fr`, `zh`                    |
| Rentang tanggal | Jendela keterkinian                   | `day`, `week`, `month`, `year`      |
| Filter domain  | Allowlist atau denylist (maks 20 domain) | `example.com`                       |
| Anggaran konten | Batas token per respons / per halaman | `max_tokens`, `max_tokens_per_page` |

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Variabel lingkungan untuk proses daemon">
    Jika OpenClaw Gateway berjalan sebagai daemon (launchd/systemd), pastikan
    `PERPLEXITY_API_KEY` tersedia untuk proses tersebut.

    <Warning>
    Kunci yang diekspor hanya di shell interaktif tidak akan terlihat oleh
    daemon launchd/systemd kecuali lingkungan tersebut diimpor secara eksplisit. Atur
    kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` untuk memastikan proses gateway
    dapat membacanya.
    </Warning>

  </Accordion>

  <Accordion title="Penyiapan proxy OpenRouter">
    Jika Anda lebih suka merutekan pencarian Perplexity melalui OpenRouter, atur
    `OPENROUTER_API_KEY` (prefiks `sk-or-`) alih-alih kunci Perplexity native.
    OpenClaw akan mendeteksi prefiks tersebut dan beralih ke transport Sonar
    secara otomatis.

    <Tip>
    Transport OpenRouter berguna jika Anda sudah memiliki akun OpenRouter
    dan menginginkan penagihan terkonsolidasi di beberapa provider.
    </Tip>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Alat pencarian Perplexity" href="/id/tools/perplexity-search" icon="magnifying-glass">
    Cara agen memanggil pencarian Perplexity dan menafsirkan hasil.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap termasuk entri Plugin.
  </Card>
</CardGroup>
