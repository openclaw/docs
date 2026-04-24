---
read_when:
    - Menjalankan atau men-debug proses gateway
    - Menyelidiki penegakan instans tunggal
summary: Guard singleton Gateway menggunakan bind listener WebSocket
title: Lock Gateway
x-i18n:
    generated_at: "2026-04-24T09:07:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## Mengapa

- Memastikan hanya satu instans gateway berjalan per port dasar pada host yang sama; gateway tambahan harus menggunakan profil terisolasi dan port yang unik.
- Tetap aman dari crash/SIGKILL tanpa meninggalkan file lock usang.
- Gagal cepat dengan error yang jelas saat port kontrol sudah digunakan.

## Mekanisme

- Gateway melakukan bind listener WebSocket (default `ws://127.0.0.1:18789`) segera saat startup menggunakan listener TCP eksklusif.
- Jika bind gagal dengan `EADDRINUSE`, startup melempar `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- OS melepaskan listener secara otomatis saat proses keluar apa pun, termasuk crash dan SIGKILL—tidak diperlukan file lock terpisah atau langkah pembersihan.
- Saat shutdown, gateway menutup server WebSocket dan server HTTP yang mendasarinya untuk membebaskan port dengan cepat.

## Surface error

- Jika port dipegang proses lain, startup melempar `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Kegagalan bind lainnya muncul sebagai `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Catatan operasional

- Jika port digunakan oleh proses _lain_, error-nya tetap sama; bebaskan port atau pilih port lain dengan `openclaw gateway --port <port>`.
- Aplikasi macOS tetap mempertahankan guard PID ringan miliknya sendiri sebelum meluncurkan gateway; lock runtime ditegakkan oleh bind WebSocket.

## Terkait

- [Multiple Gateways](/id/gateway/multiple-gateways) — menjalankan beberapa instans dengan port unik
- [Troubleshooting](/id/gateway/troubleshooting) — mendiagnosis `EADDRINUSE` dan konflik port
