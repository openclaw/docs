---
read_when:
    - Menjalankan atau men-debug proses Gateway
    - Menyelidiki penegakan instans tunggal
summary: Pengaman singleton Gateway menggunakan pengikatan pendengar WebSocket
title: Kunci Gateway
x-i18n:
    generated_at: "2026-04-30T09:48:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Mengapa

- Pastikan hanya satu instance Gateway berjalan per port dasar pada host yang sama; Gateway tambahan harus menggunakan profil terisolasi dan port unik.
- Tetap pulih dari crash/SIGKILL tanpa meninggalkan file kunci usang.
- Gagal cepat dengan kesalahan yang jelas ketika port kontrol sudah ditempati.

## Mekanisme

- Gateway pertama-tama memperoleh file kunci per konfigurasi di bawah direktori kunci status dan memeriksa port yang dikonfigurasi untuk pendengar yang sudah ada.
- Jika pemilik kunci yang tercatat sudah tidak ada, port bebas, atau kunci sudah usang, startup mengambil alih kunci dan melanjutkan.
- Gateway kemudian mengikat pendengar HTTP/WebSocket (default `ws://127.0.0.1:18789`) menggunakan pendengar TCP eksklusif.
- Jika pengikatan gagal dengan `EADDRINUSE`, startup melempar `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Saat shutdown, Gateway menutup server HTTP/WebSocket dan menghapus file kunci.

## Permukaan kesalahan

- Jika proses lain memegang port tersebut, startup melempar `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Kegagalan pengikatan lainnya muncul sebagai `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Catatan operasional

- Jika port ditempati oleh proses _lain_, kesalahannya sama; bebaskan port atau pilih port lain dengan `openclaw gateway --port <port>`.
- Di bawah supervisor layanan, proses Gateway baru yang melihat perespons `/healthz` sehat yang sudah ada akan keluar dengan sukses dan membiarkan proses tersebut memegang kendali. Jika proses yang ada tidak pernah menjadi sehat, percobaan ulang dibatasi dan startup gagal dengan kesalahan kunci yang jelas alih-alih berulang selamanya.
- Aplikasi macOS masih mempertahankan penjaga PID ringannya sendiri sebelum memunculkan Gateway; kunci saat runtime diberlakukan oleh file kunci plus pengikatan HTTP/WebSocket.

## Terkait

- [Beberapa Gateway](/id/gateway/multiple-gateways) — menjalankan beberapa instance dengan port unik
- [Pemecahan Masalah](/id/gateway/troubleshooting) — mendiagnosis `EADDRINUSE` dan konflik port
