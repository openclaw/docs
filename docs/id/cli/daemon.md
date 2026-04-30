---
read_when:
    - Anda masih menggunakan `openclaw daemon ...` dalam skrip
    - Anda memerlukan perintah siklus hidup layanan (install/start/stop/restart/status)
summary: Referensi CLI untuk `openclaw daemon` (alias lama untuk manajemen layanan Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-04-30T09:39:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias lama untuk perintah pengelolaan layanan Gateway.

`openclaw daemon ...` dipetakan ke antarmuka kontrol layanan yang sama seperti perintah layanan `openclaw gateway ...`.

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

- `status`: menampilkan status pemasangan layanan dan memeriksa kesehatan Gateway
- `install`: memasang layanan (`launchd`/`systemd`/`schtasks`)
- `uninstall`: menghapus layanan
- `start`: memulai layanan
- `stop`: menghentikan layanan
- `restart`: memulai ulang layanan

## Opsi umum

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- siklus hidup (`uninstall|start|stop|restart`): `--json`

Catatan:

- `status` menyelesaikan SecretRefs auth yang dikonfigurasi untuk auth pemeriksaan jika memungkinkan.
- Jika SecretRef auth yang diperlukan belum terselesaikan di jalur perintah ini, `daemon status --json` melaporkan `rpc.authWarning` saat konektivitas/auth pemeriksaan gagal; teruskan `--token`/`--password` secara eksplisit atau selesaikan sumber rahasia terlebih dahulu.
- Jika pemeriksaan berhasil, peringatan auth-ref yang belum terselesaikan ditekan untuk menghindari positif palsu.
- `status --deep` menambahkan pemindaian layanan tingkat sistem dengan upaya terbaik. Saat menemukan layanan lain yang mirip gateway, keluaran manusia mencetak petunjuk pembersihan dan memperingatkan bahwa satu gateway per mesin tetap menjadi rekomendasi normal.
- Pada pemasangan Linux systemd, pemeriksaan penyimpangan token `status` mencakup sumber unit `Environment=` dan `EnvironmentFile=`.
- Pemeriksaan penyimpangan menyelesaikan SecretRefs `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
- Jika auth token tidak aktif secara efektif (`gateway.auth.mode` eksplisit berupa `password`/`none`/`trusted-proxy`, atau mode tidak disetel ketika password dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan penyimpangan token melewati resolusi token config.
- Saat auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `install` memvalidasi bahwa SecretRef dapat diselesaikan tetapi tidak menyimpan token yang telah diselesaikan ke dalam metadata environment layanan.
- Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, pemasangan gagal tertutup.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak disetel, pemasangan diblokir hingga mode disetel secara eksplisit.
- Pada macOS, `install` menjaga plist LaunchAgent hanya untuk pemilik dan memuat nilai environment layanan terkelola melalui file dan wrapper khusus pemilik alih-alih menserialisasikan API key atau referensi env auth-profile ke dalam `EnvironmentVariables`.
- Jika Anda sengaja menjalankan beberapa gateway pada satu host, isolasikan port, config/status, dan workspace; lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).

## Lebih disarankan

Gunakan [`openclaw gateway`](/id/cli/gateway) untuk dokumentasi dan contoh saat ini.

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
