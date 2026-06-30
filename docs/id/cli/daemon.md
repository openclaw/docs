---
read_when:
    - Anda masih menggunakan `openclaw daemon ...` dalam skrip
    - Anda memerlukan perintah siklus hidup layanan (install/start/stop/restart/status)
summary: Referensi CLI untuk `openclaw daemon` (alias lama untuk manajemen layanan gateway)
title: Daemon
x-i18n:
    generated_at: "2026-06-30T14:27:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias lama untuk perintah pengelolaan layanan Gateway.

`openclaw daemon ...` dipetakan ke permukaan kontrol layanan yang sama seperti perintah layanan `openclaw gateway ...`.

## Penggunaan

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Subperintah

- `status`: tampilkan status pemasangan layanan dan periksa kesehatan Gateway
- `install`: pasang layanan (`launchd`/`systemd`/`schtasks`)
- `uninstall`: hapus layanan
- `start`: mulai layanan
- `stop`: hentikan layanan
- `restart`: mulai ulang layanan

## Opsi umum

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- siklus hidup (`uninstall|start|stop`): `--json`

Catatan:

- `status` menyelesaikan SecretRefs autentikasi yang dikonfigurasi untuk autentikasi pemeriksaan jika memungkinkan.
- Jika SecretRef autentikasi yang diperlukan tidak terselesaikan di jalur perintah ini, `daemon status --json` melaporkan `rpc.authWarning` ketika konektivitas/autentikasi pemeriksaan gagal; berikan `--token`/`--password` secara eksplisit atau selesaikan sumber rahasia terlebih dahulu.
- Jika pemeriksaan berhasil, peringatan auth-ref yang belum terselesaikan disembunyikan untuk menghindari positif palsu.
- `status --deep` menambahkan pemindaian layanan tingkat sistem dengan upaya terbaik. Ketika menemukan layanan lain yang mirip gateway, keluaran manusia menampilkan petunjuk pembersihan dan memperingatkan bahwa satu gateway per mesin masih merupakan rekomendasi normal.
- `status --deep` juga menjalankan validasi konfigurasi dalam mode sadar plugin dan menampilkan peringatan manifes plugin yang dikonfigurasi (misalnya metadata konfigurasi saluran yang hilang) agar pemeriksaan smoke pemasangan dan pembaruan dapat menangkapnya. `status` default mempertahankan jalur cepat baca-saja yang melewati validasi plugin.
- Pada pemasangan systemd Linux, pemeriksaan token-drift `status` mencakup sumber unit `Environment=` dan `EnvironmentFile=`.
- Pemeriksaan drift menyelesaikan SecretRefs `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
- Jika autentikasi token tidak aktif secara efektif (`gateway.auth.mode` eksplisit berupa `password`/`none`/`trusted-proxy`, atau mode tidak diatur saat kata sandi dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan token-drift melewati resolusi token konfigurasi.
- Ketika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `install` memvalidasi bahwa SecretRef dapat diselesaikan tetapi tidak menyimpan token yang telah diselesaikan ke dalam metadata lingkungan layanan.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, pemasangan gagal secara tertutup.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak diatur, pemasangan diblokir hingga mode diatur secara eksplisit.
- Pada macOS, `install` menjaga plist LaunchAgent hanya untuk pemilik dan memuat nilai lingkungan layanan terkelola melalui file dan wrapper khusus pemilik, alih-alih menserialkan kunci API atau ref env profil autentikasi ke dalam `EnvironmentVariables`.
- Jika Anda sengaja menjalankan beberapa gateway pada satu host, isolasi port, konfigurasi/status, dan workspace; lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).
- `restart --safe` meminta Gateway yang sedang berjalan untuk melakukan preflight pekerjaan aktif dan menjadwalkan satu restart tergabung setelah pekerjaan aktif selesai. Restart aman default menunggu pekerjaan aktif hingga `gateway.reload.deferralTimeoutMs` yang dikonfigurasi (default 5 menit); ketika anggaran itu habis, restart dipaksa. Atur `gateway.reload.deferralTimeoutMs` ke `0` untuk tunggu aman tanpa batas waktu yang tidak pernah memaksa. `restart` biasa mempertahankan perilaku pengelola layanan yang ada; `--force` tetap menjadi jalur override langsung.
- `restart --safe --skip-deferral` menjalankan restart aman sadar OpenClaw tetapi melewati gerbang penangguhan pekerjaan aktif sehingga Gateway memancarkan restart segera meskipun blocker dilaporkan. Pintu keluar operator ketika task run yang macet menahan restart aman; memerlukan `--safe`.

## Lebih disarankan

Gunakan [`openclaw gateway`](/id/cli/gateway) untuk dokumentasi dan contoh saat ini.

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
