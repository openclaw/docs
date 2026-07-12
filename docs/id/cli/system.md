---
read_when:
    - Anda ingin mengantrekan peristiwa sistem tanpa membuat tugas Cron
    - Anda perlu mengaktifkan atau menonaktifkan Heartbeat
    - Anda ingin memeriksa entri kehadiran sistem
summary: Referensi CLI untuk `openclaw system` (peristiwa sistem, Heartbeat, kehadiran)
title: Sistem
x-i18n:
    generated_at: "2026-07-12T14:03:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Pembantu tingkat sistem untuk Gateway: mengantrekan peristiwa sistem, mengontrol Heartbeat, dan melihat kehadiran.

Semua subperintah `system` menggunakan RPC Gateway dan menerima flag klien bersama:

| Flag              | Bawaan                                  | Deskripsi                                                                                                                                                                                                                              |
| ----------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | `gateway.remote.url` saat dikonfigurasi | URL WebSocket Gateway.                                                                                                                                                                                                                  |
| `--token <token>` | tidak ada                               | Token Gateway (jika diperlukan).                                                                                                                                                                                                        |
| `--timeout <ms>`  | `30000`                                 | Batas waktu RPC dalam milidetik.                                                                                                                                                                                                        |
| `--expect-final`  | nonaktif                                | Tunggu respons akhir (agen).                                                                                                                                                                                                            |
| `--json`          | nonaktif                                | Keluarkan JSON. `heartbeat last/enable/disable` dan `system presence` selalu mencetak muatan JSON RPC mentah terlepas dari flag ini; `system event` menggunakannya untuk beralih antara JSON dan satu baris `ok` biasa. |

## Perintah umum

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Secara bawaan, antrekan peristiwa sistem pada sesi **utama**. Heartbeat berikutnya menyisipkannya sebagai baris `System:` dalam prompt. Gunakan `--mode now` untuk memicu Heartbeat segera; `next-heartbeat` (bawaan) menunggu pemicuan terjadwal berikutnya.

Berikan `--session-key` untuk menargetkan sesi tertentu, misalnya untuk meneruskan penyelesaian tugas asinkron kembali ke kanal yang memulainya.

<Note>
**Pengecualian waktu dengan `--session-key`:** saat `--session-key` diberikan, `--mode next-heartbeat` berubah menjadi pembangkitan tertarget langsung alih-alih menunggu pemicuan terjadwal berikutnya. Pembangkitan tertarget menggunakan intensi Heartbeat `immediate` sehingga melewati gerbang belum-jatuh-tempo milik pelaksana yang jika tidak dilewati akan menunda (dan secara efektif mengabaikan) pembangkitan berintensi `event`. Jika menginginkan pengiriman tertunda, hilangkan `--session-key` agar peristiwa masuk ke sesi utama dan diteruskan oleh Heartbeat reguler berikutnya.
</Note>

Flag:

- `--text <text>`: teks peristiwa sistem wajib.
- `--mode <mode>`: `now` atau `next-heartbeat` (bawaan).
- `--session-key <sessionKey>`: opsional; targetkan sesi agen tertentu sebagai pengganti sesi utama agen. Kunci yang bukan milik agen yang ditentukan akan kembali ke sesi utama agen tersebut.

## `system heartbeat last|enable|disable`

- `last`: tampilkan peristiwa Heartbeat terakhir.
- `enable`: aktifkan kembali Heartbeat (gunakan ini jika sebelumnya dinonaktifkan).
- `disable`: jeda Heartbeat.

## `system presence`

Cantumkan entri kehadiran sistem saat ini yang diketahui Gateway (Node, instans, dan baris status serupa).

## Catatan

- Memerlukan Gateway yang sedang berjalan dan dapat dijangkau oleh konfigurasi Anda saat ini (lokal atau jarak jauh).
- Peristiwa sistem bersifat sementara dan tidak dipertahankan setelah dimulai ulang.

## Terkait

- [Referensi CLI](/id/cli)
