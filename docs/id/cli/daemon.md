---
read_when:
    - Anda masih menggunakan `openclaw daemon ...` dalam skrip
    - Anda memerlukan perintah siklus hidup layanan (instal/mulai/hentikan/mulai ulang/status)
summary: Referensi CLI untuk `openclaw daemon` (alias lama untuk pengelolaan layanan Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-07-12T14:05:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias lama untuk pengelolaan layanan Gateway. `openclaw daemon ...` dipetakan ke perintah kontrol layanan yang sama dengan `openclaw gateway ...`. Utamakan [`openclaw gateway`](/id/cli/gateway) untuk dokumentasi dan contoh terkini.

## Penggunaan

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Subperintah dan opsi

| Subperintah | Opsi                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`                                        |
| `install`   | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`                                                   |
| `uninstall` | `--json`                                                                                                                                |
| `start`     | `--json`                                                                                                                                |
| `stop`      | `--json`, `--disable` (khusus launchd: menonaktifkan KeepAlive/RunAtLoad secara persisten hingga layanan dimulai kembali)               |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                                                                   |

- `status`: menampilkan status pemasangan layanan (launchd/systemd/schtasks) dan memeriksa kesehatan Gateway.
- `install`: memasang layanan; `--force` memasang ulang/menimpa pemasangan yang sudah ada.
- `restart --safe`: meminta Gateway yang sedang berjalan untuk melakukan pemeriksaan awal terhadap pekerjaan aktif dan menjadwalkan satu pemulaian ulang gabungan setelah pekerjaan selesai, dibatasi oleh `gateway.reload.deferralTimeoutMs` (bawaan 300000 md/5 menit; atur ke `0` untuk menunggu tanpa batas). Ketika batas waktu tersebut habis, pemulaian ulang tetap dipaksakan. `restart` biasa menggunakan pengelola layanan secara langsung; `--force` adalah penggantian segera.
- `restart --safe --skip-deferral`: melewati gerbang penundaan pekerjaan aktif agar Gateway segera dimulai ulang meskipun ada penghambat yang dilaporkan. Memerlukan `--safe`.

## Catatan

- `status` menyelesaikan SecretRef autentikasi yang dikonfigurasi untuk autentikasi pemeriksaan jika memungkinkan. Jika SecretRef yang diwajibkan tidak dapat diselesaikan, `status --json` melaporkan `rpc.authWarning`; teruskan `--token`/`--password` secara eksplisit atau selesaikan sumber rahasia terlebih dahulu. Peringatan autentikasi yang belum terselesaikan disembunyikan setelah pemeriksaan berhasil.
- `status --deep` menambahkan pemindaian tingkat sistem dengan upaya terbaik untuk mencari layanan lain yang menyerupai Gateway (mencetak petunjuk pembersihan; satu Gateway per mesin tetap direkomendasikan) dan menjalankan validasi konfigurasi dalam mode yang memahami Plugin, sehingga menampilkan peringatan manifes Plugin yang dilewati oleh jalur bawaan cepat.
- Pada pemasangan systemd Linux, pemeriksaan penyimpangan token memeriksa sumber unit `Environment=` dan `EnvironmentFile=`.
- Pemeriksaan penyimpangan token menyelesaikan SecretRef `gateway.auth.token` menggunakan lingkungan runtime gabungan (lingkungan perintah layanan terlebih dahulu, lalu lingkungan proses). Jika autentikasi token tidak aktif secara efektif (`gateway.auth.mode` bernilai `password`/`none`/`trusted-proxy`, atau tidak ditetapkan dengan kata sandi yang dapat diprioritaskan), penyelesaian token konfigurasi dilewati.
- `install` memvalidasi bahwa `gateway.auth.token` yang dikelola SecretRef dapat diselesaikan, tetapi tidak pernah menyimpan nilai yang telah diselesaikan ke dalam metadata lingkungan layanan; jika tidak dapat diselesaikan, pemasangan gagal secara tertutup.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak ditetapkan, `install` diblokir hingga Anda menetapkan mode secara eksplisit.
- Di macOS, `install` mempertahankan plist LaunchAgent dan berkas lingkungan/pembungkus yang dihasilkan agar hanya dapat diakses pemilik (mode `0600`/`0700`), alih-alih menyematkan rahasia dalam `EnvironmentVariables`.
- Menjalankan beberapa Gateway pada satu hos: pisahkan porta, konfigurasi/status, dan ruang kerja. Lihat [Beberapa Gateway](/id/gateway#multiple-gateways-same-host).

## Terkait

- [Referensi CLI](/id/cli)
- [Panduan operasional Gateway](/id/gateway)
