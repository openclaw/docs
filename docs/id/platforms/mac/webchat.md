---
read_when:
    - Men-debug tampilan WebChat Mac atau port loopback
summary: Bagaimana aplikasi Mac menyematkan WebChat Gateway dan cara men-debug-nya
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-05T14:00:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2c45fa5512cc9c5d3b3aa188d94e2e5a90e4bcce607d959d40bea8b17c90c5
    source_path: platforms/mac/webchat.md
    workflow: 15
---

# WebChat (aplikasi macOS)

Aplikasi bilah menu macOS menyematkan UI WebChat sebagai tampilan SwiftUI native. UI ini
terhubung ke Gateway dan secara default menggunakan **sesi main** untuk
agen yang dipilih (dengan pengalih sesi untuk sesi lainnya).

- **Mode lokal**: terhubung langsung ke WebSocket Gateway lokal.
- **Mode remote**: meneruskan port kontrol Gateway melalui SSH dan menggunakan
  tunnel tersebut sebagai data plane.

## Peluncuran & debugging

- Manual: menu Lobster → “Open Chat”.
- Buka otomatis untuk pengujian:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Log: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, kategori `WebChatSwiftUI`).

## Cara kerjanya

- Data plane: metode WS Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` dan event `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` mengembalikan baris transkrip yang dinormalisasi untuk tampilan: tag
  directive inline dihapus dari teks yang terlihat, payload XML pemanggilan tool teks biasa
  (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok pemanggilan tool yang terpotong) serta
  token kontrol model ASCII/full-width yang bocor dihapus, baris asisten yang hanya berisi
  token senyap murni seperti `NO_REPLY` / `no_reply` yang persis sama akan
  dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.
- Sesi: default ke sesi utama (`main`, atau `global` saat scope bersifat
  global). UI dapat berpindah antar sesi.
- Onboarding menggunakan sesi khusus untuk memisahkan penyiapan awal.

## Surface keamanan

- Mode remote hanya meneruskan port kontrol WebSocket Gateway melalui SSH.

## Keterbatasan yang diketahui

- UI ini dioptimalkan untuk sesi chat (bukan sandbox browser penuh).
