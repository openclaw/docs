---
read_when:
    - Memperbarui perilaku atau default retry penyedia
    - Men-debug kesalahan pengiriman penyedia atau rate limit
summary: Kebijakan retry untuk panggilan penyedia keluar
title: Kebijakan Retry
x-i18n:
    generated_at: "2026-04-05T13:52:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55bb261ff567f46ce447be9c0ee0c5b5e6d2776287d7662762656c14108dd607
    source_path: concepts/retry.md
    workflow: 15
---

# Kebijakan retry

## Tujuan

- Retry per permintaan HTTP, bukan per alur multi-langkah.
- Pertahankan urutan dengan me-retry hanya langkah saat ini.
- Hindari duplikasi operasi yang non-idempoten.

## Default

- Upaya: 3
- Batas maksimum penundaan: 30000 ms
- Jitter: 0.1 (10 persen)
- Default penyedia:
  - Penundaan minimum Telegram: 400 ms
  - Penundaan minimum Discord: 500 ms

## Perilaku

### Discord

- Retry hanya pada kesalahan rate limit (HTTP 429).
- Menggunakan Discord `retry_after` jika tersedia, jika tidak menggunakan exponential backoff.

### Telegram

- Retry pada kesalahan sementara (429, timeout, connect/reset/closed, temporarily unavailable).
- Menggunakan `retry_after` jika tersedia, jika tidak menggunakan exponential backoff.
- Kesalahan parse Markdown tidak di-retry; sebagai gantinya fallback ke plain text.

## Konfigurasi

Setel kebijakan retry per penyedia di `~/.openclaw/openclaw.json`:

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

- Retry berlaku per permintaan (pengiriman pesan, upload media, reaksi, poll, stiker).
- Alur komposit tidak me-retry langkah yang sudah selesai.
