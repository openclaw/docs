---
read_when:
    - Menjalankan atau men-debug proses Gateway
    - Menyelidiki penegakan instance tunggal
summary: Pengaman singleton Gateway menggunakan bind listener WebSocket
title: Kunci Gateway
x-i18n:
    generated_at: "2026-04-05T13:53:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 726c687ab53f2dd1e46afed8fc791b55310a5c1e62f79a0e38a7dc4ca7576093
    source_path: gateway/gateway-lock.md
    workflow: 15
---

# Kunci Gateway

## Mengapa

- Memastikan hanya satu instance gateway yang berjalan per base port pada host yang sama; gateway tambahan harus menggunakan profil terisolasi dan port unik.
- Tetap aman dari crash/SIGKILL tanpa meninggalkan file lock yang usang.
- Gagal dengan cepat dengan kesalahan yang jelas saat control port sudah terpakai.

## Mekanisme

- Gateway melakukan bind listener WebSocket (default `ws://127.0.0.1:18789`) segera saat startup menggunakan listener TCP eksklusif.
- Jika bind gagal dengan `EADDRINUSE`, startup melempar `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- OS otomatis melepaskan listener saat proses keluar, termasuk crash dan SIGKILL—tidak diperlukan file lock terpisah atau langkah pembersihan.
- Saat shutdown, gateway menutup server WebSocket dan server HTTP yang mendasarinya untuk segera membebaskan port.

## Permukaan kesalahan

- Jika port dipegang oleh proses lain, startup melempar `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Kegagalan bind lainnya ditampilkan sebagai `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Catatan operasional

- Jika port ditempati oleh proses _lain_, kesalahannya tetap sama; bebaskan port tersebut atau pilih port lain dengan `openclaw gateway --port <port>`.
- Aplikasi macOS tetap mempertahankan pengaman PID ringan miliknya sendiri sebelum menjalankan gateway; kunci runtime ditegakkan oleh bind WebSocket.

## Terkait

- [Multiple Gateways](/gateway/multiple-gateways) — menjalankan beberapa instance dengan port unik
- [Troubleshooting](/gateway/troubleshooting) — mendiagnosis `EADDRINUSE` dan konflik port
