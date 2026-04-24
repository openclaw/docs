---
read_when:
    - Memperbarui perilaku atau default retry provider
    - Men-debug error pengiriman provider atau rate limit
summary: Kebijakan retry untuk panggilan provider keluar
title: Kebijakan retry
x-i18n:
    generated_at: "2026-04-24T09:05:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 15
---

## Tujuan

- Retry per permintaan HTTP, bukan per alur multi-langkah.
- Pertahankan urutan dengan hanya me-retry langkah saat ini.
- Hindari menduplikasi operasi yang tidak idempoten.

## Default

- Percobaan: 3
- Batas maksimum delay: 30000 md
- Jitter: 0.1 (10 persen)
- Default provider:
  - Delay minimum Telegram: 400 md
  - Delay minimum Discord: 500 md

## Perilaku

### Provider model

- OpenClaw membiarkan SDK provider menangani retry singkat normal.
- Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, respons yang dapat di-retry
  (`408`, `409`, `429`, dan `5xx`) dapat menyertakan `retry-after-ms` atau
  `retry-after`. Saat waktu tunggu tersebut lebih lama dari 60 detik, OpenClaw menyuntikkan
  `x-should-retry: false` agar SDK segera memunculkan error dan model
  failover dapat berotasi ke auth profile lain atau model fallback.
- Override batas itu dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Setel ke `0`, `false`, `off`, `none`, atau `disabled` agar SDK menghormati
  sleep `Retry-After` yang panjang secara internal.

### Discord

- Retry hanya pada error rate-limit (HTTP 429).
- Menggunakan `retry_after` Discord jika tersedia, jika tidak menggunakan exponential backoff.

### Telegram

- Retry pada error sementara (429, timeout, connect/reset/closed, temporarily unavailable).
- Menggunakan `retry_after` jika tersedia, jika tidak menggunakan exponential backoff.
- Error parse Markdown tidak di-retry; error tersebut melakukan fallback ke teks biasa.

## Konfigurasi

Setel kebijakan retry per provider di `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Catatan

- Retry berlaku per permintaan (pengiriman pesan, upload media, reaksi, polling, stiker).
- Alur komposit tidak me-retry langkah yang sudah selesai.

## Terkait

- [Model failover](/id/concepts/model-failover)
- [Antrean perintah](/id/concepts/queue)
