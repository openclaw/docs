---
read_when:
    - Anda menginginkan diagnosis cepat tentang kesehatan saluran + penerima sesi terbaru
    - Anda menginginkan status "all" yang dapat ditempel untuk debugging
summary: Referensi CLI untuk `openclaw status` (diagnostik, probe, snapshot penggunaan)
title: openclaw status
x-i18n:
    generated_at: "2026-07-19T05:02:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: abf35fe5e60e7fce94aacf86c009d77ac1cc993e0099d294d248e7b884a3f9dc
    source_path: cli/status.md
    workflow: 16
---

Diagnostik untuk channel + sesi.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| Flag                    | Deskripsi                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--all`                 | Diagnosis lengkap (hanya baca, dapat ditempelkan). Mencakup audit keamanan, kompatibilitas plugin, dan pemeriksaan vektor memori. |
| `--deep`                | Menjalankan pemeriksaan langsung (WhatsApp Web + Telegram + Discord + Slack + Signal). Juga mengaktifkan audit keamanan.         |
| `--usage`               | Mencetak jendela penggunaan penyedia yang dinormalisasi sebagai `X% left`.                                                          |
| `--json`                | Keluaran yang dapat dibaca mesin.                                                                                        |
| `--verbose` / `--debug` | Juga mencetak resolusi target Gateway mentah sebelum laporan.                                                 |

`openclaw status` biasa tetap berada pada jalur cepat hanya baca dan menandai memori sebagai
`not checked`, bukan tidak tersedia, saat melewati pemeriksaan memori. Audit
keamanan berat, kompatibilitas plugin, dan pemeriksaan vektor memori diserahkan kepada
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`,
dan `openclaw memory status --deep`.

## Resolusi sesi dan model

- Keluaran status sesi memisahkan `Execution:` dari `Runtime:`. `Execution`
  adalah jalur sandbox (`direct`, `docker/*`), sedangkan `Runtime` memberi tahu Anda
  apakah sesi menggunakan `OpenClaw Default`, `OpenAI Codex`, backend CLI,
  atau backend ACP seperti `codex (acp/acpx)`. Lihat
  [Runtime agen](/id/concepts/agent-runtimes) untuk perbedaan penyedia/model/runtime.
- Saat snapshot sesi saat ini tidak lengkap, `/status` dapat mengisi kembali penghitung token
  dan cache dari log penggunaan transkrip terbaru. Nilai langsung bukan nol
  yang sudah ada tetap lebih diutamakan daripada nilai fallback transkrip.
- Fallback transkrip juga dapat memulihkan label model runtime aktif saat
  entri sesi langsung tidak memilikinya. Jika model transkrip tersebut berbeda
  dari model yang dipilih, status menentukan jendela konteks berdasarkan
  model runtime yang dipulihkan, bukan model yang dipilih.
- Untuk penghitungan ukuran prompt, fallback transkrip memilih total berorientasi
  prompt yang lebih besar ketika metadata sesi tidak ada atau lebih kecil, sehingga
  sesi penyedia khusus tidak menyusut menjadi tampilan token `0`.
- Saat sesi disematkan ke model yang berbeda dari model utama yang dikonfigurasi,
  status mencetak kedua nilai, alasannya (`session override`), dan
  petunjuk `/model default`. Model utama yang dikonfigurasi berlaku untuk sesi baru atau
  yang tidak disematkan; sesi tersemat yang sudah ada mempertahankan pilihan sesinya
  hingga dihapus.
- Keluaran mencakup penyimpanan sesi per agen saat beberapa agen
  dikonfigurasi.

## Penggunaan dan kuota

- `--usage` mencetak jendela penggunaan penyedia yang dinormalisasi sebagai `X% left`.
- Kolom mentah `usage_percent` / `usagePercent` milik MiniMax adalah kuota tersisa,
  sehingga OpenClaw membalikkannya sebelum ditampilkan; kolom berbasis jumlah lebih
  diutamakan jika tersedia. Respons `model_remains` mengutamakan entri model percakapan, memperoleh
  label jendela dari stempel waktu bila diperlukan, dan menyertakan nama model dalam
  label paket.
- Kegagalan penyegaran harga model ditampilkan sebagai peringatan harga opsional.
  Hal tersebut tidak berarti Gateway atau channel tidak sehat.

## Ringkasan dan status pembaruan

- Ringkasan mencakup status instalasi/runtime layanan host Gateway + node jika
  tersedia, beserta waktu aktif proses Gateway dan waktu aktif sistem host yang ringkas.
- Ringkasan mencakup channel pembaruan + SHA git (untuk checkout sumber).
- Informasi pembaruan muncul dalam Ringkasan; jika pembaruan tersedia, status
  mencetak petunjuk untuk menjalankan `openclaw update` (lihat [Memperbarui](/id/install/updating)).

## Rahasia

- Saat Gateway yang berjalan memiliki pemilik SecretRef terisolasi dari proses mulai, pemuatan ulang, atau penulisan konfigurasi, status menyertakan `degradedSecretOwners` dalam JSON dan baris ringkasan **Rahasia terdegradasi** dalam keluaran manusia. Setiap entri menyebutkan pemilik, status degradasi (`cold` atau `stale`), jalur konfigurasi, dan alasan yang telah disamarkan. Pemilik dingin tidak tersedia; pemilik usang melanjutkan dengan nilai baik terakhir yang diketahui.
- Permukaan status hanya baca (`status`, `status --json`, `status --all`)
  menyelesaikan SecretRef yang didukung untuk jalur konfigurasi yang ditargetkan jika
  memungkinkan.
- Jika SecretRef channel yang didukung dikonfigurasi tetapi tidak tersedia pada
  jalur perintah saat ini, status tetap hanya baca dan melaporkan keluaran terdegradasi
  alih-alih mengalami crash. Keluaran manusia menampilkan peringatan seperti "token yang
  dikonfigurasi tidak tersedia pada jalur perintah ini", dan keluaran JSON menyertakan
  `secretDiagnostics`.
- Saat resolusi SecretRef lokal perintah berhasil, status mengutamakan
  snapshot yang telah diselesaikan dan menghapus penanda channel sementara "rahasia tidak tersedia"
  dari keluaran akhir.
- `status --all` menyertakan baris ringkasan Rahasia dan bagian diagnosis
  yang merangkum diagnostik rahasia (dipotong agar mudah dibaca) tanpa
  menghentikan pembuatan laporan.

## Memori

`status --json --all` melaporkan detail memori dari runtime plugin memori aktif
yang dipilih oleh `plugins.slots.memory`. Plugin memori khusus dapat membiarkan
`agents.defaults.memorySearch.enabled` bawaan dinonaktifkan dan tetap melaporkan
status file, potongan, vektor, dan FTS miliknya sendiri.

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/gateway/doctor)
