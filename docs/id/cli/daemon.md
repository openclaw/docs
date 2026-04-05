---
read_when:
    - Anda masih menggunakan `openclaw daemon ...` dalam skrip
    - Anda memerlukan perintah siklus hidup layanan (install/start/stop/restart/status)
summary: Referensi CLI untuk `openclaw daemon` (alias legacy untuk pengelolaan layanan gateway)
title: daemon
x-i18n:
    generated_at: "2026-04-05T13:45:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fdaf3c4f3e7dd4dff86f9b74a653dcba2674573698cf51efc4890077994169
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Alias legacy untuk perintah pengelolaan layanan Gateway.

`openclaw daemon ...` dipetakan ke surface kontrol layanan yang sama seperti perintah layanan `openclaw gateway ...`.

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

- `status`: tampilkan status instalasi layanan dan probe kesehatan Gateway
- `install`: instal layanan (`launchd`/`systemd`/`schtasks`)
- `uninstall`: hapus layanan
- `start`: mulai layanan
- `stop`: hentikan layanan
- `restart`: mulai ulang layanan

## Opsi umum

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- siklus hidup (`uninstall|start|stop|restart`): `--json`

Catatan:

- `status` me-resolve SecretRef autentikasi yang dikonfigurasi untuk autentikasi probe bila memungkinkan.
- Jika SecretRef autentikasi yang diperlukan tidak dapat di-resolve dalam jalur perintah ini, `daemon status --json` melaporkan `rpc.authWarning` saat konektivitas/autentikasi probe gagal; berikan `--token`/`--password` secara eksplisit atau resolve sumber secret terlebih dahulu.
- Jika probe berhasil, peringatan auth-ref yang tidak ter-resolve ditekan untuk menghindari positif palsu.
- `status --deep` menambahkan pemindaian layanan tingkat sistem dengan upaya terbaik. Saat menemukan layanan lain yang mirip gateway, output untuk manusia akan mencetak petunjuk pembersihan dan memperingatkan bahwa satu gateway per mesin tetap merupakan rekomendasi normal.
- Pada instalasi Linux systemd, pemeriksaan token drift `status` mencakup sumber unit `Environment=` dan `EnvironmentFile=`.
- Pemeriksaan drift me-resolve SecretRef `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
- Jika autentikasi token tidak aktif secara efektif (mode `gateway.auth.mode` eksplisit `password`/`none`/`trusted-proxy`, atau mode tidak diatur sehingga password dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan token drift melewati resolusi token config.
- Saat autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `install` memvalidasi bahwa SecretRef dapat di-resolve tetapi tidak menyimpan token yang telah di-resolve ke metadata env layanan.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat di-resolve, instalasi gagal secara tertutup.
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` tidak diatur, instalasi diblokir sampai mode diatur secara eksplisit.
- Jika Anda sengaja menjalankan beberapa gateway pada satu host, isolasikan port, config/status, dan workspace; lihat [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

## Disarankan

Gunakan [`openclaw gateway`](/cli/gateway) untuk dokumentasi dan contoh terbaru.
