---
read_when:
    - Anda perlu memantau log Gateway dari jarak jauh (tanpa SSH)
    - Anda menginginkan baris log JSON untuk alat bantu
summary: Referensi CLI untuk `openclaw logs` (pantau log Gateway melalui RPC)
title: Log
x-i18n:
    generated_at: "2026-07-12T14:02:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Pantau log berkas Gateway melalui RPC. Berfungsi dalam mode jarak jauh.

## Opsi

- `--limit <n>`: jumlah maksimum baris log yang dikembalikan (nilai bawaan `200`)
- `--max-bytes <n>`: jumlah maksimum byte yang dibaca dari berkas log (nilai bawaan `250000`)
- `--follow`: ikuti aliran log
- `--interval <ms>`: interval polling saat mengikuti (nilai bawaan `1000`)
- `--json`: keluarkan peristiwa JSON yang dipisahkan per baris
- `--plain`: keluaran teks biasa tanpa pemformatan bergaya
- `--no-color`: nonaktifkan warna ANSI
- `--local-time`: tampilkan stempel waktu dalam zona waktu lokal Anda (nilai bawaan)
- `--utc`: tampilkan stempel waktu dalam UTC

## Opsi RPC Gateway bersama

- `--url <url>`: URL WebSocket Gateway
- `--token <token>`: token Gateway
- `--timeout <ms>`: batas waktu dalam milidetik (nilai bawaan `30000`)
- `--expect-final`: tunggu respons akhir saat panggilan Gateway didukung oleh agen

Meneruskan `--url` akan melewati kredensial konfigurasi yang diterapkan secara otomatis; sertakan `--token` secara eksplisit jika Gateway tujuan memerlukan autentikasi.

## Contoh

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Perilaku fallback dan pemulihan

- Jika Gateway local loopback implisit meminta pemasangan, menutup koneksi saat proses penyambungan, atau kehabisan waktu sebelum `logs.tail` merespons, `openclaw logs` secara otomatis menggunakan log berkas Gateway yang dikonfigurasi sebagai fallback. Target `--url` eksplisit tidak pernah menggunakan fallback ini.
- `--follow` tidak beralih ke berkas yang dikonfigurasi tersebut setelah kegagalan RPC Gateway lokal implisit—berkas berdampingan yang usang dapat menyesatkan pemantauan langsung. Di Linux, perintah ini sebagai gantinya menggunakan jurnal Gateway user-systemd aktif berdasarkan PID jika tersedia (dan mencetak sumber yang dipilih); jika tidak, perintah ini terus mencoba kembali Gateway aktif.
- Selama `--follow`, pemutusan sementara (penutupan WebSocket, kehabisan waktu, koneksi terputus) memicu penyambungan ulang otomatis dengan jeda eksponensial: hingga 8 kali percobaan ulang, dengan batas maksimum 30 detik antarpercobaan. Peringatan dicetak ke stderr pada setiap percobaan ulang, dan pemberitahuan `[logs] gateway reconnected` dicetak setelah polling berhasil. Dalam mode `--json`, keduanya dikeluarkan sebagai rekaman `{"type":"notice"}` di stderr. Kesalahan yang tidak dapat dipulihkan (kegagalan autentikasi, konfigurasi yang salah) tetap langsung menghentikan proses.
- Dalam mode `--follow --json`, transisi sumber log dikeluarkan sebagai rekaman `{"type":"meta"}`. Lacak kursor per `sourceKind`: aliran dapat berpindah dari keluaran berkas Gateway (`sourceKind: "file"`) ke fallback jurnal lokal (`sourceKind: "journal"`, `localFallback: true`, dengan `service.pid`/`service.unit`), lalu kembali ke keluaran berkas Gateway setelah pemulihan. Jangan mengasumsikan satu sumber atau kursor yang stabil untuk seluruh sesi, dan toleransi baris yang tumpang tindih saat pemulihan memutar ulang kursor berkas Gateway.

## Terkait

- [Ikhtisar pencatatan log](/id/logging)
- [CLI Gateway](/id/cli/gateway)
- [Referensi CLI](/id/cli)
- [Pencatatan log Gateway](/id/gateway/logging)
