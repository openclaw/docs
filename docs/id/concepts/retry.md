---
read_when:
    - Memperbarui perilaku atau nilai default percobaan ulang penyedia
    - Men-debug kesalahan pengiriman penyedia atau batas laju
summary: Kebijakan percobaan ulang untuk panggilan penyedia keluar
title: Kebijakan percobaan ulang
x-i18n:
    generated_at: "2026-07-12T14:11:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Tujuan

- Mencoba ulang per permintaan HTTP, bukan per alur multilangkah.
- Mempertahankan urutan dengan hanya mencoba ulang langkah saat ini.
- Menghindari duplikasi operasi yang tidak idempoten.

## Bawaan

| Pengaturan               | Bawaan    |
| ------------------------ | --------- |
| Jumlah percobaan         | 3         |
| Batas penundaan maksimum | 30000 ms  |
| Jitter                   | 0.1 (10%) |
| Penundaan minimum Telegram | 400 ms  |
| Penundaan minimum Discord  | 500 ms  |

## Perilaku

### Penyedia model

- OpenClaw membiarkan SDK penyedia menangani percobaan ulang singkat yang normal.
- Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, respons yang dapat dicoba ulang (`408`, `409`, `429`, dan `5xx`) dapat menyertakan `retry-after-ms` atau `retry-after`. Ketika waktu tunggu tersebut lebih dari 60 detik, OpenClaw menyisipkan `x-should-retry: false` agar SDK segera memunculkan galat dan failover model dapat beralih ke profil autentikasi lain atau model cadangan.
- Ganti batas tersebut dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`. Atur ke `0`, `false`, `off`, `none`, atau `disabled` agar SDK menangani waktu tunggu `Retry-After` yang panjang secara internal.

### Discord

- Mencoba ulang saat terjadi galat batas laju (HTTP 429), batas waktu permintaan, respons HTTP 5xx, dan kegagalan transportasi sementara seperti kegagalan pencarian DNS, pengaturan ulang koneksi, penutupan soket, dan kegagalan pengambilan.
- Menggunakan `retry_after` Discord jika tersedia; jika tidak, menggunakan backoff eksponensial.

### Telegram

- Mencoba ulang saat terjadi galat sementara (429, batas waktu, koneksi/pengaturan ulang/penutupan, tidak tersedia untuk sementara).
- Menggunakan `retry_after` jika tersedia; jika tidak, menggunakan backoff eksponensial.
- Galat penguraian HTML/Markdown tidak dicoba ulang; pada percobaan pertama, sistem beralih ke teks biasa.

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

- Percobaan ulang berlaku per permintaan (pengiriman pesan, pengunggahan media, reaksi, jajak pendapat, stiker).
- Alur gabungan tidak mencoba ulang langkah yang telah selesai.

## Terkait

- [Failover model](/id/concepts/model-failover)
- [Antrean perintah](/id/concepts/queue)
