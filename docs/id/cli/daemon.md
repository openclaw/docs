---
read_when:
    - Anda masih menggunakan `openclaw daemon ...` dalam skrip
    - Anda memerlukan perintah siklus hidup layanan (install/start/stop/restart/status)
summary: Referensi CLI untuk `openclaw daemon` (alias lama untuk pengelolaan layanan Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-05-02T22:17:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
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
- `restart`: `--force`, `--wait <duration>`, `--json`
- siklus hidup (`uninstall|start|stop`): `--json`

Catatan:

- `status` menyelesaikan SecretRefs autentikasi yang dikonfigurasi untuk autentikasi pemeriksaan jika memungkinkan.
- Jika SecretRef autentikasi yang diperlukan tidak terselesaikan di jalur perintah ini, `daemon status --json` melaporkan `rpc.authWarning` saat konektivitas/autentikasi pemeriksaan gagal; berikan `--token`/`--password` secara eksplisit atau selesaikan sumber rahasia terlebih dahulu.
- Jika pemeriksaan berhasil, peringatan auth-ref yang belum terselesaikan disembunyikan untuk menghindari positif palsu.
- `status --deep` menambahkan pemindaian layanan tingkat sistem dengan upaya terbaik. Saat menemukan layanan lain yang mirip Gateway, keluaran untuk manusia mencetak petunjuk pembersihan dan memperingatkan bahwa satu Gateway per mesin masih menjadi rekomendasi normal.
- Pada pemasangan systemd Linux, pemeriksaan token-drift `status` mencakup sumber unit `Environment=` dan `EnvironmentFile=`.
- Pemeriksaan drift menyelesaikan SecretRefs `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
- Jika autentikasi token tidak aktif secara efektif (`gateway.auth.mode` eksplisit berupa `password`/`none`/`trusted-proxy`, atau mode tidak disetel ketika kata sandi dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan token-drift melewati penyelesaian token konfigurasi.
- Saat autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `install` memvalidasi bahwa SecretRef dapat diselesaikan tetapi tidak mempertahankan token yang terselesaikan ke metadata lingkungan layanan.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, pemasangan gagal tertutup.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak disetel, pemasangan diblokir hingga mode disetel secara eksplisit.
- Pada macOS, `install` menjaga plist LaunchAgent hanya untuk pemilik dan memuat nilai lingkungan layanan terkelola melalui file dan pembungkus khusus pemilik, alih-alih menserialisasi kunci API atau ref env profil autentikasi ke dalam `EnvironmentVariables`.
- Jika Anda sengaja menjalankan beberapa Gateway pada satu host, isolasikan port, konfigurasi/status, dan workspace; lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).

## Lebih disarankan

Gunakan [`openclaw gateway`](/id/cli/gateway) untuk dokumentasi dan contoh saat ini.

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
