---
read_when:
    - Men-debug tampilan WebChat mac atau port loopback
summary: Cara aplikasi macOS menyematkan WebChat gateway dan cara men-debug-nya
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-24T09:17:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

Aplikasi menu bar macOS menyematkan UI WebChat sebagai tampilan SwiftUI native. Aplikasi ini
terhubung ke Gateway dan secara default menggunakan **sesi utama** untuk agen yang dipilih
(dengan session switcher untuk sesi lain).

- **Mode lokal**: terhubung langsung ke WebSocket Gateway lokal.
- **Mode remote**: meneruskan port kontrol Gateway melalui SSH dan menggunakan
  tunnel tersebut sebagai data plane.

## Peluncuran & debugging

- Manual: menu Lobster → “Open Chat”.
- Auto-open untuk pengujian:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Log: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## Cara wiring-nya

- Data plane: metode Gateway WS `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` dan event `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` mengembalikan baris transkrip yang dinormalisasi untuk tampilan: tag directive inline dihapus dari teks yang terlihat, payload XML tool-call teks biasa
  (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong) serta
  token kontrol model ASCII/full-width yang bocor dihapus, baris asisten token-diam murni seperti `NO_REPLY` / `no_reply` yang persis cocok
  dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder.
- Sesi: default ke sesi utama (`main`, atau `global` ketika cakupannya
  global). UI dapat beralih antar sesi.
- Onboarding menggunakan sesi khusus agar penyiapan pertama kali tetap terpisah.

## Permukaan keamanan

- Mode remote hanya meneruskan port kontrol WebSocket Gateway melalui SSH.

## Batasan yang diketahui

- UI dioptimalkan untuk sesi obrolan (bukan sandbox browser penuh).

## Terkait

- [WebChat](/id/web/webchat)
- [Aplikasi macOS](/id/platforms/macos)
