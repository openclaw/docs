---
read_when:
    - Menjalankan atau men-debug proses Gateway
    - Menyelidiki pemberlakuan instans tunggal
summary: 'Pengaman singleton Gateway: penguncian berkas serta pengikatan WebSocket/HTTP'
title: Kunci Gateway
x-i18n:
    generated_at: "2026-07-12T14:13:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Mengapa

- Hanya satu proses Gateway yang boleh memiliki konfigurasi + port tertentu pada sebuah host; jalankan Gateway tambahan dengan profil terisolasi dan port unik.
- Tetap berfungsi setelah crash/SIGKILL tanpa meninggalkan berkas kunci usang.
- Segera gagal dengan galat yang jelas ketika Gateway lain sudah memiliki port tersebut.

## Dua lapisan

Saat dimulai, kepemilikan instans tunggal diberlakukan melalui dua langkah independen, secara berurutan:

1. **Kunci berkas** memperoleh berkas kunci per konfigurasi di dalam direktori kunci status. Sebagai bagian dari proses memperolehnya, saat dimulai sistem memeriksa port yang dikonfigurasi untuk menemukan listener aktif guna mendeteksi pemilik kunci usang (yang mengalami crash).
2. **Pengikatan soket** mengikat listener HTTP/WebSocket (bawaan `ws://127.0.0.1:18789`) sebagai listener TCP eksklusif.

Setiap lapisan dapat gagal secara independen dan melempar `GatewayLockError` masing-masing.

### Kunci berkas

- Jika berkas kunci tidak ada, proses pemilik yang tercatat sudah berhenti, atau pemeriksaan port pemilik menunjukkan tidak ada listener aktif, saat dimulai sistem mengambil alih kunci dan melanjutkan.
- Jika kunci sedang dipegang secara aktif dan tidak satu pun kondisi di atas berlaku, saat dimulai sistem mencoba ulang hingga 5 detik (bawaan) sebelum menyerah:

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### Pengikatan soket

- Saat terjadi `EADDRINUSE`, saat dimulai sistem mencoba ulang pengikatan hingga 20 kali dengan interval 500 md (total sekitar 10 detik) agar dapat melewati jendela `TIME_WAIT` setelah proses baru saja berhenti.
- Jika port masih digunakan setelah percobaan ulang:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- Kegagalan pengikatan lainnya:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

Saat dimatikan, Gateway menutup server HTTP/WebSocket dan menghapus berkas kunci.

## Catatan operasional

- Jika port ditempati oleh proses lain yang bukan Gateway, galatnya sama; kosongkan port tersebut atau pilih port lain dengan `openclaw gateway --port <port>`.
- Di bawah pengawas layanan, proses Gateway baru yang mengalami salah satu galat di atas terlebih dahulu memeriksa `/healthz` pada proses yang sudah ada. Jika proses tersebut sehat, proses baru membiarkannya tetap memegang kendali alih-alih gagal. Pada systemd, proses keluar dengan kode `78`; `RestartPreventExitStatus=78` pada unit mencegah `Restart=always` terus berulang akibat konflik kunci atau `EADDRINUSE`. Jika proses yang sudah ada tidak pernah menjadi sehat, percobaan ulang pemeriksaan kesehatan dibatasi waktu, lalu proses awal gagal dengan galat kunci di atas alih-alih berulang tanpa batas.
- Aplikasi macOS mempertahankan pengaman PID ringannya sendiri sebelum menjalankan Gateway; kunci berkas dan pengikatan soket di atas merupakan mekanisme penegakan runtime yang sebenarnya.

## Terkait

- [Beberapa Gateway](/id/gateway/multiple-gateways) - menjalankan beberapa instans dengan port unik
- [Pemecahan masalah](/id/gateway/troubleshooting) - mendiagnosis `EADDRINUSE` dan konflik port
