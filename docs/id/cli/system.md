---
read_when:
    - Anda ingin mengantrekan peristiwa sistem tanpa membuat tugas Cron
    - Anda perlu mengaktifkan atau menonaktifkan Heartbeat
    - Anda ingin memeriksa entri kehadiran sistem
summary: Referensi CLI untuk `openclaw system` (peristiwa sistem, Heartbeat, kehadiran)
title: Sistem
x-i18n:
    generated_at: "2026-05-11T20:26:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Pembantu tingkat sistem untuk Gateway: mengantrekan peristiwa sistem, mengontrol Heartbeat,
dan melihat kehadiran.

Semua subperintah `system` menggunakan RPC Gateway dan menerima flag klien bersama:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Perintah umum

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Secara default, mengantrekan peristiwa sistem pada sesi **utama**. Heartbeat berikutnya
akan menyisipkannya sebagai baris `System:` dalam prompt. Gunakan `--mode now` untuk memicu
Heartbeat segera; `next-heartbeat` menunggu tick terjadwal berikutnya.

Berikan `--session-key` untuk menargetkan sesi tertentu (misalnya untuk meneruskan
penyelesaian tugas asinkron kembali ke channel yang memulainya).

> **Pengecualian waktu dengan `--session-key`:** saat `--session-key` diberikan,
> `--mode next-heartbeat` berubah menjadi wake tertarget langsung, bukan
> menunggu tick terjadwal berikutnya. Wake tertarget menggunakan intent Heartbeat
> `immediate` sehingga melewati gate not-due runner yang jika tidak
> akan menunda (dan secara efektif membuang) wake berintent `event`. Jika Anda menginginkan
> pengiriman tertunda, hilangkan `--session-key` agar peristiwa masuk ke sesi utama dan
> ikut dalam Heartbeat reguler berikutnya.

Flag:

- `--text <text>`: teks peristiwa sistem wajib.
- `--mode <mode>`: `now` atau `next-heartbeat` (default).
- `--session-key <sessionKey>`: opsional; targetkan sesi agen tertentu
  alih-alih sesi utama agen. Kunci yang bukan milik agen yang
  di-resolve akan kembali ke sesi utama agen.
- `--json`: output yang dapat dibaca mesin.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag RPC Gateway bersama.

## `system heartbeat last|enable|disable`

Kontrol Heartbeat:

- `last`: tampilkan peristiwa Heartbeat terakhir.
- `enable`: aktifkan kembali Heartbeat (gunakan ini jika sebelumnya dinonaktifkan).
- `disable`: jeda Heartbeat.

Flag:

- `--json`: output yang dapat dibaca mesin.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag RPC Gateway bersama.

## `system presence`

Cantumkan entri kehadiran sistem saat ini yang diketahui Gateway (node,
instans, dan baris status serupa).

Flag:

- `--json`: output yang dapat dibaca mesin.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag RPC Gateway bersama.

## Catatan

- Memerlukan Gateway yang berjalan dan dapat dijangkau oleh konfigurasi Anda saat ini (lokal atau remote).
- Peristiwa sistem bersifat sementara dan tidak dipertahankan setelah restart.

## Terkait

- [Referensi CLI](/id/cli)
