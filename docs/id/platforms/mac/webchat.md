---
read_when:
    - Men-debug tampilan WebChat mac atau port loopback
summary: Cara aplikasi Mac menyematkan Gateway WebChat dan cara men-debugnya
title: Obrolan Web (macOS)
x-i18n:
    generated_at: "2026-05-06T09:20:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Aplikasi bilah menu macOS menyematkan UI WebChat sebagai tampilan SwiftUI native. Aplikasi ini
terhubung ke Gateway dan secara default menggunakan **sesi utama** untuk agen yang dipilih
(dengan pengalih sesi untuk sesi lain).

- **Mode lokal**: terhubung langsung ke WebSocket Gateway lokal.
- **Mode jarak jauh**: meneruskan port kontrol Gateway melalui SSH dan menggunakan
  tunnel tersebut sebagai bidang data.

## Peluncuran dan debugging

- Manual: menu Lobster → "Buka Obrolan".
- Buka otomatis untuk pengujian:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Log: `./scripts/clawlog.sh` (subsistem `ai.openclaw`, kategori `WebChatSwiftUI`).

## Cara perangkaiannya

- Bidang data: metode WS Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` dan event `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` mengembalikan baris transkrip yang dinormalisasi untuk tampilan: tag direktif
  inline dihapus dari teks yang terlihat, payload XML pemanggilan alat teks biasa
  (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong) serta
  token kontrol model ASCII/lebar-penuh yang bocor dihapus, baris asisten yang hanya berisi
  token senyap seperti persis `NO_REPLY` / `no_reply`
  dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.
- Sesi: secara default menggunakan sesi utama (`main`, atau `global` saat cakupan bersifat
  global). UI dapat beralih antar sesi.
- Onboarding menggunakan sesi khusus untuk menjaga penyiapan pertama kali tetap terpisah.

## Permukaan keamanan

- Mode jarak jauh hanya meneruskan port kontrol WebSocket Gateway melalui SSH.

## Batasan yang diketahui

- UI dioptimalkan untuk sesi obrolan (bukan sandbox browser penuh).

## Terkait

- [WebChat](/id/web/webchat)
- [aplikasi macOS](/id/platforms/macos)
