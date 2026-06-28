---
read_when:
    - Anda masih menggunakan `openclaw daemon ...` dalam skrip
    - Anda memerlukan perintah siklus hidup layanan (install/start/stop/restart/status)
summary: Referensi CLI untuk `openclaw daemon` (alias lama untuk pengelolaan layanan Gateway)
title: Layanan latar belakang
x-i18n:
    generated_at: "2026-05-11T20:25:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
    postprocess_version: locale-links-v1
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

- `status` menyelesaikan SecretRefs auth yang dikonfigurasi untuk auth pemeriksaan jika memungkinkan.
- Jika SecretRef auth yang diperlukan tidak terselesaikan dalam jalur perintah ini, `daemon status --json` melaporkan `rpc.authWarning` saat konektivitas/auth pemeriksaan gagal; berikan `--token`/`--password` secara eksplisit atau selesaikan sumber rahasia terlebih dahulu.
- Jika pemeriksaan berhasil, peringatan auth-ref yang tidak terselesaikan disembunyikan untuk menghindari positif palsu.
- `status --deep` menambahkan pemindaian layanan tingkat sistem dengan upaya terbaik. Saat menemukan layanan lain yang mirip Gateway, output untuk manusia mencetak petunjuk pembersihan dan memperingatkan bahwa satu Gateway per mesin tetap merupakan rekomendasi normal.
- `status --deep` juga menjalankan validasi konfigurasi dalam mode sadar Plugin dan menampilkan peringatan manifes Plugin yang dikonfigurasi (misalnya metadata konfigurasi channel yang hilang) sehingga pemeriksaan smoke pemasangan dan pembaruan dapat menangkapnya. `status` default mempertahankan jalur cepat baca-saja yang melewati validasi Plugin.
- Pada pemasangan systemd Linux, pemeriksaan penyimpangan token `status` mencakup sumber unit `Environment=` dan `EnvironmentFile=`.
- Pemeriksaan penyimpangan menyelesaikan SecretRefs `gateway.auth.token` menggunakan env runtime gabungan (env perintah layanan terlebih dahulu, lalu fallback ke env proses).
- Jika auth token tidak aktif secara efektif (`gateway.auth.mode` eksplisit berupa `password`/`none`/`trusted-proxy`, atau mode tidak disetel ketika password dapat menang dan tidak ada kandidat token yang dapat menang), pemeriksaan penyimpangan token melewati resolusi token konfigurasi.
- Saat auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, `install` memvalidasi bahwa SecretRef dapat diselesaikan tetapi tidak menyimpan token yang terselesaikan ke metadata lingkungan layanan.
- Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, pemasangan gagal tertutup.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak disetel, pemasangan diblokir hingga mode disetel secara eksplisit.
- Pada macOS, `install` menjaga plist LaunchAgent hanya untuk pemilik dan memuat nilai lingkungan layanan terkelola melalui file dan wrapper khusus pemilik alih-alih menserialisasi kunci API atau ref env profil auth ke dalam `EnvironmentVariables`.
- Jika Anda sengaja menjalankan beberapa Gateway pada satu host, isolasikan port, konfigurasi/status, dan workspace; lihat [/gateway#multiple-gateways-same-host](/id/gateway#multiple-gateways-same-host).
- `restart --safe` meminta Gateway yang sedang berjalan untuk melakukan preflight terhadap pekerjaan aktif dan menjadwalkan satu restart gabungan setelah pekerjaan aktif selesai. `restart` biasa mempertahankan perilaku service-manager yang ada; `--force` tetap menjadi jalur override langsung.
- `restart --safe --skip-deferral` menjalankan restart aman yang sadar OpenClaw tetapi melewati gerbang penundaan pekerjaan aktif sehingga Gateway memancarkan restart segera meskipun blocker dilaporkan. Jalan keluar operator saat task run yang macet menahan restart aman; memerlukan `--safe`.

## Disarankan

Gunakan [`openclaw gateway`](/id/cli/gateway) untuk dokumentasi dan contoh terbaru.

## Terkait

- [Referensi CLI](/id/cli)
- [Runbook Gateway](/id/gateway)
