---
read_when:
    - Memperbarui perilaku percobaan ulang penyedia atau nilai bawaan
    - Men-debug kesalahan pengiriman penyedia atau batas laju
summary: Kebijakan percobaan ulang untuk panggilan keluar ke penyedia
title: Kebijakan percobaan ulang
x-i18n:
    generated_at: "2026-05-02T09:19:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
---

## Tujuan

- Coba ulang per permintaan HTTP, bukan per alur multi-langkah.
- Pertahankan urutan dengan hanya mencoba ulang langkah saat ini.
- Hindari menggandakan operasi yang tidak idempoten.

## Default

- Percobaan: 3
- Batas jeda maksimum: 30000 ms
- Jitter: 0.1 (10 persen)
- Default penyedia:
  - Jeda minimum Telegram: 400 ms
  - Jeda minimum Discord: 500 ms

## Perilaku

### Penyedia model

- OpenClaw membiarkan SDK penyedia menangani percobaan ulang singkat yang normal.
- Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, respons yang dapat dicoba ulang
  (`408`, `409`, `429`, dan `5xx`) dapat menyertakan `retry-after-ms` atau
  `retry-after`. Ketika waktu tunggu itu lebih dari 60 detik, OpenClaw menyisipkan
  `x-should-retry: false` agar SDK segera memunculkan kesalahan dan failover model
  dapat beralih ke profil autentikasi lain atau model fallback.
- Timpa batas dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Atur ke `0`, `false`, `off`, `none`, atau `disabled` agar SDK mematuhi jeda
  `Retry-After` yang panjang secara internal.

### Discord

- Mencoba ulang pada kesalahan batas laju (HTTP 429), timeout permintaan, respons HTTP 5xx,
  dan kegagalan transport sementara seperti kegagalan pencarian DNS, reset koneksi,
  penutupan socket, dan kegagalan fetch.
- Menggunakan `retry_after` Discord jika tersedia, jika tidak menggunakan backoff eksponensial.

### Telegram

- Mencoba ulang pada kesalahan sementara (429, timeout, connect/reset/closed, sementara tidak tersedia).
- Menggunakan `retry_after` jika tersedia, jika tidak menggunakan backoff eksponensial.
- Kesalahan parsing Markdown tidak dicoba ulang; kesalahan tersebut fallback ke teks biasa.

## Konfigurasi

Tetapkan kebijakan percobaan ulang per penyedia di `~/.openclaw/openclaw.json`:

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

- Percobaan ulang berlaku per permintaan (pengiriman pesan, unggahan media, reaksi, jajak pendapat, stiker).
- Alur komposit tidak mencoba ulang langkah yang telah selesai.

## Terkait

- [Failover model](/id/concepts/model-failover)
- [Antrean perintah](/id/concepts/queue)
