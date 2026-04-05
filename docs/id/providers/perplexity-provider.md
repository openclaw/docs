---
read_when:
    - Anda ingin mengonfigurasi Perplexity sebagai provider pencarian web
    - Anda memerlukan penyiapan API key Perplexity atau proxy OpenRouter
summary: Penyiapan provider pencarian web Perplexity (API key, mode pencarian, pemfilteran)
title: Perplexity (Provider)
x-i18n:
    generated_at: "2026-04-05T14:03:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9082d15d6a36a096e21efe8cee78e4b8643252225520f5b96a0b99cf5a7a4b
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Provider Pencarian Web)

Plugin Perplexity menyediakan kemampuan pencarian web melalui Perplexity
Search API atau Perplexity Sonar melalui OpenRouter.

<Note>
Halaman ini mencakup penyiapan **provider** Perplexity. Untuk **tool**
Perplexity (bagaimana agen menggunakannya), lihat [tool Perplexity](/tools/perplexity-search).
</Note>

- Tipe: provider pencarian web (bukan provider model)
- Auth: `PERPLEXITY_API_KEY` (langsung) atau `OPENROUTER_API_KEY` (melalui OpenRouter)
- Jalur config: `plugins.entries.perplexity.config.webSearch.apiKey`

## Mulai cepat

1. Setel API key:

```bash
openclaw configure --section web
```

Atau setel langsung:

```bash
openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
```

2. Agen akan otomatis menggunakan Perplexity untuk pencarian web saat sudah dikonfigurasi.

## Mode pencarian

Plugin otomatis memilih transport berdasarkan prefiks API key:

| Key prefix | Transport                    | Features                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Perplexity Search API native | Hasil terstruktur, filter domain/bahasa/tanggal  |
| `sk-or-`   | OpenRouter (Sonar)           | Jawaban yang disintesis AI dengan sitasi         |

## Pemfilteran API native

Saat menggunakan API Perplexity native (key `pplx-`), pencarian mendukung:

- **Country**: kode negara 2 huruf
- **Language**: kode bahasa ISO 639-1
- **Date range**: hari, minggu, bulan, tahun
- **Domain filters**: allowlist/denylist (maksimum 20 domain)
- **Content budget**: `max_tokens`, `max_tokens_per_page`

## Catatan environment

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan
`PERPLEXITY_API_KEY` tersedia untuk proses tersebut (misalnya, di
`~/.openclaw/.env` atau melalui `env.shellEnv`).
