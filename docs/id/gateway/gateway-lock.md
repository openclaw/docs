---
read_when:
    - Menjalankan atau men-debug proses Gateway
    - Menyelidiki penerapan instans tunggal
summary: 'Pengaman singleton Gateway: penguncian file serta pengikatan WebSocket/HTTP'
title: Kunci Gateway
x-i18n:
    generated_at: "2026-07-16T18:08:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Mengapa

- Hanya satu proses Gateway yang boleh memiliki direktori status; jalankan Gateway tambahan dengan profil, direktori status, konfigurasi, dan port yang terisolasi.
- Tetap berfungsi setelah crash/SIGKILL tanpa meninggalkan file kunci usang.
- Segera gagal dengan pesan kesalahan yang jelas ketika Gateway lain sudah memiliki port tersebut.

## Tiga lapisan

Saat dimulai, kepemilikan diterapkan dalam tiga langkah berikut, secara berurutan:

1. **Kunci kepemilikan status** memperoleh kunci berdasarkan direktori status kanonis. Setiap Gateway berpartisipasi, termasuk Gateway yang dimulai dengan `OPENCLAW_ALLOW_MULTI_GATEWAY=1`, sehingga pemeliharaan SQLite yang destruktif tidak dapat berpacu dengan pemilik yang aktif.
2. **Kunci konfigurasi** memperoleh kunci per konfigurasi yang digunakan sebelumnya dan mencatat port runtime. Mode multi-Gateway melewati singleton konfigurasi ini, tetapi tetap mempertahankan kunci kepemilikan status.
3. **Pengikatan soket** mengikat listener HTTP/WebSocket (nilai default `ws://127.0.0.1:18789`) sebagai listener TCP eksklusif.

Setiap lapisan dapat gagal secara independen dan melempar `GatewayLockError` masing-masing.

### Kunci status dan konfigurasi

- Keaktifan kunci ditentukan dari PID yang tercatat, identitas waktu mulai proses platform jika tersedia, dan identitas proses Gateway. Pemilik yang terverifikasi tetap berwenang selama startup sebelum port-nya mulai menerima koneksi.
- Koordinator SQLite khusus menserialkan pemeriksaan metadata, pengambilalihan dari pemilik usang, dan penggantian kunci. Transaksi eksklusifnya dilepas secara otomatis jika proses pemilik mengalami crash.
- Jika file kunci tidak ada atau proses pemilik yang tercatat sudah berhenti, startup mengambil alih kunci dan melanjutkan.
- Jika salah satu kunci sedang ditahan secara aktif, startup mencoba kembali hingga 5 detik (nilai default) sebelum menyerah:

  ```text
  GatewayLockError("gateway sudah berjalan (pid <pid>); waktu tunggu kunci habis setelah <ms>ms")
  ```

### Pengikatan soket

- Pada `EADDRINUSE`, startup mencoba kembali pengikatan hingga 20 kali dengan interval 500ms (total sekitar 10 detik) untuk melewati jendela `TIME_WAIT` setelah sebuah proses baru saja berhenti.
- Jika port masih digunakan setelah percobaan ulang:

  ```text
  GatewayLockError("instans gateway lain sudah menerima koneksi di ws://127.0.0.1:<port>")
  ```

- Kegagalan pengikatan lainnya:

  ```text
  GatewayLockError("gagal mengikat soket gateway di ws://127.0.0.1:<port>: <cause>")
  ```

Saat dimatikan, Gateway menutup server HTTP/WebSocket dan menghapus file kunci
status serta konfigurasinya.

## Catatan operasional

- Jika port ditempati oleh proses lain yang bukan Gateway, kesalahannya tetap sama; kosongkan port tersebut atau pilih port lain dengan `openclaw gateway --port <port>`.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` mengizinkan beberapa instans konfigurasi/runtime, bukan status bersama yang dapat diubah. Setiap instans tetap memerlukan `OPENCLAW_STATE_DIR` yang unik.
- Di bawah pengawas layanan, proses Gateway baru yang mengalami salah satu kesalahan di atas terlebih dahulu memeriksa `/healthz` pada proses yang sudah ada. Jika proses tersebut sehat, proses baru membiarkannya tetap memegang kendali alih-alih gagal. Pada systemd, proses baru keluar dengan kode `78`; `RestartPreventExitStatus=78` milik unit menghentikan `Restart=always` agar tidak berulang akibat konflik kunci atau `EADDRINUSE`. Jika proses yang sudah ada tidak pernah menjadi sehat, percobaan ulang pemeriksaan kesehatan dibatasi waktu, lalu startup gagal dengan kesalahan kunci di atas alih-alih berulang selamanya.
- Aplikasi macOS mempertahankan pengaman PID ringannya sendiri sebelum menjalankan Gateway; file kunci dan pengikatan soket di atas merupakan mekanisme penerapan runtime yang sebenarnya.

## Terkait

- [Beberapa Gateway](/id/gateway/multiple-gateways) - menjalankan beberapa instans dengan port unik
- [Pemecahan masalah](/id/gateway/troubleshooting) - mendiagnosis `EADDRINUSE` dan konflik port
