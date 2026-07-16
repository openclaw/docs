---
read_when:
    - Anda masih menggunakan `openclaw daemon ...` dalam skrip
    - Anda memerlukan perintah siklus hidup layanan (instal/mulai/hentikan/mulai ulang/status)
summary: Referensi CLI untuk `openclaw daemon` (alias lama untuk pengelolaan layanan Gateway)
title: Demon
x-i18n:
    generated_at: "2026-07-16T18:00:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias lama untuk pengelolaan layanan Gateway. `openclaw daemon ...` dipetakan ke perintah kontrol layanan yang sama seperti `openclaw gateway ...`. Utamakan [`openclaw gateway`](/id/cli/gateway) untuk dokumentasi dan contoh terkini.

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

| Subperintah  | Opsi                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (khusus launchd: secara persisten menonaktifkan KeepAlive/RunAtLoad hingga proses mulai berikutnya) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: menampilkan status pemasangan layanan (launchd/systemd/schtasks) dan memeriksa kesehatan Gateway.
- `install`: memasang layanan; `--force` memasang ulang/menimpa pemasangan yang sudah ada.
- `restart --safe`: meminta Gateway yang sedang berjalan untuk melakukan pemeriksaan awal terhadap pekerjaan aktif dan menjadwalkan satu pemulaian ulang gabungan setelah pekerjaan selesai, dengan batas `gateway.reload.deferralTimeoutMs` (default 300000ms/5 menit; atur ke `0` untuk menunggu tanpa batas waktu). Saat batas tersebut berakhir, pemulaian ulang tetap dipaksakan. `restart` biasa menggunakan pengelola layanan secara langsung; `--force` adalah penimpaan langsung.
- `restart --safe --skip-deferral`: melewati gerbang penundaan pekerjaan aktif sehingga Gateway langsung dimulai ulang meskipun ada penghambat yang dilaporkan. Memerlukan `--safe`.

## Catatan

- `status` menyelesaikan SecretRef autentikasi yang dikonfigurasi untuk autentikasi pemeriksaan jika memungkinkan. Jika SecretRef yang diperlukan tidak dapat diselesaikan, `status --json` melaporkan `rpc.authWarning`; teruskan `--token`/`--password` secara eksplisit atau selesaikan sumber rahasia terlebih dahulu. Peringatan autentikasi yang tidak terselesaikan disembunyikan setelah pemeriksaan berhasil dalam aspek lainnya.
- `status --deep` menambahkan pemindaian tingkat sistem dengan upaya terbaik untuk layanan lain yang menyerupai Gateway (mencetak petunjuk pembersihan; satu Gateway per mesin tetap menjadi rekomendasi) dan menjalankan validasi konfigurasi dalam mode sadar Plugin, sehingga menampilkan peringatan manifes Plugin yang dilewati oleh jalur default cepat.
- Pada pemasangan systemd Linux, pemeriksaan perbedaan token memeriksa sumber unit `Environment=` dan `EnvironmentFile=`.
- Pemeriksaan perbedaan token menyelesaikan SecretRef `gateway.auth.token` menggunakan lingkungan runtime gabungan (lingkungan perintah layanan terlebih dahulu, lalu lingkungan proses). Jika autentikasi token tidak aktif secara efektif (`gateway.auth.mode` dari `password`/`none`/`trusted-proxy`, atau tidak ditetapkan sementara kata sandi dapat diutamakan), penyelesaian token konfigurasi dilewati.
- `install` memvalidasi bahwa `gateway.auth.token` yang dikelola SecretRef dapat diselesaikan, tetapi tidak pernah menyimpan nilai yang telah diselesaikan ke metadata lingkungan layanan; jika tidak dapat diselesaikan, pemasangan gagal secara tertutup.
- Jika `gateway.auth.token` dan `gateway.auth.password` dikonfigurasi serta `gateway.auth.mode` tidak ditetapkan, `install` memblokir hingga Anda menetapkan mode secara eksplisit.
- Di macOS, `install` menjaga plist LaunchAgent serta berkas lingkungan/wrapper yang dihasilkan agar hanya dapat diakses pemilik (mode `0600`/`0700`), alih-alih menyematkan rahasia dalam `EnvironmentVariables`.
- Menjalankan beberapa Gateway pada satu host: pisahkan port, konfigurasi/status, dan ruang kerja. Lihat [Beberapa Gateway](/id/gateway#multiple-gateways-same-host).

## Terkait

- [Referensi CLI](/id/cli)
- [Panduan operasional Gateway](/id/gateway)
