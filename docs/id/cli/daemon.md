---
read_when:
    - Anda masih menggunakan `openclaw daemon ...` dalam skrip
    - Anda memerlukan perintah siklus hidup layanan (install/start/stop/restart/status)
summary: Referensi CLI untuk `openclaw daemon` (alias lama untuk manajemen layanan Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-05-10T19:28:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias lama untuk perintah manajemen layanan Gateway.

`openclaw daemon ...` dipetakan ke permukaan kontrol layanan yang sama dengan perintah layanan `openclaw gateway ...`.

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

- `status`: tampilkan status instalasi layanan dan uji kesehatan Gateway
- `install`: instal layanan (`launchd`/`systemd`/`schtasks`)
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

- `status` menyelesaikan SecretRefs autentikasi yang dikonfigurasi untuk autentikasi probe jika memungkinkan.
- Jika SecretRef autentikasi yang wajib tidak terselesaikan di jalur perintah ini, `daemon status --json` melaporkan `rpc.authWarning` saat konektivitas/autentikasi probe gagal; teruskan `--token`/`--password` secara eksplisit atau selesaikan sumber secret terlebih dahulu.
- Jika probe berhasil, peringatan auth-ref yang tidak terselesaikan disembunyikan untuk menghindari positif palsu.
- `status --deep` menambahkan pemindaian layanan tingkat sistem dengan upaya terbaik. Saat menemukan layanan lain yang mirip gateway, keluaran untuk manusia mencetak petunjuk pembersihan dan memperingatkan bahwa satu gateway per mesin tetap merupakan rekomendasi normal.
- Pada instalasi Linux systemd, pemeriksaan token-drift `status` mencakup sumber unit `Environment=` dan `EnvironmentFile=`.
- Pemeriksaan drift menyelesaikan SecretRefs `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback env proses).
- Jika autentikasi token tidak aktif secara efektif (`gateway.auth.mode` eksplisit bernilai `password`/`none`/`trusted-proxy`, atau mode tidak disetel ketika password dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan token-drift melewati resolusi token konfigurasi.
- Saat autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `install` memvalidasi bahwa SecretRef dapat diselesaikan tetapi tidak menyimpan token yang telah diselesaikan ke metadata environment layanan.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, instalasi gagal tertutup.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak disetel, instalasi diblokir sampai mode disetel secara eksplisit.
- Di macOS, `install` menjaga plist LaunchAgent hanya untuk owner dan memuat nilai environment layanan terkelola melalui file dan wrapper khusus owner, alih-alih menserialisasi kunci API atau referensi env auth-profile ke dalam `EnvironmentVariables`.
- Jika Anda sengaja menjalankan beberapa gateway di satu host, isolasikan port, config/state, dan workspace; lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).
- `restart --safe` meminta Gateway yang berjalan untuk melakukan preflight pekerjaan aktif dan menjadwalkan satu restart yang digabungkan setelah pekerjaan aktif selesai. `restart` biasa mempertahankan perilaku service-manager yang ada; `--force` tetap menjadi jalur override langsung.
- `restart --safe --skip-deferral` menjalankan restart aman yang sadar OpenClaw tetapi melewati gerbang penundaan pekerjaan aktif sehingga Gateway langsung memancarkan restart meskipun pemblokir dilaporkan. Jalur keluar operator saat task run yang macet menahan restart aman; memerlukan `--safe`.

## Disarankan

Gunakan [`openclaw gateway`](/id/cli/gateway) untuk dokumentasi dan contoh saat ini.

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
