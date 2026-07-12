---
read_when:
    - Anda ingin diagnosis cepat tentang kesehatan saluran + penerima sesi terbaru
    - Anda menginginkan status "semua" yang dapat ditempel untuk penelusuran kesalahan
summary: Referensi CLI untuk `openclaw status` (diagnostik, pemeriksaan, cuplikan penggunaan)
title: openclaw status
x-i18n:
    generated_at: "2026-07-12T14:06:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

Diagnostik untuk saluran + sesi.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| Flag                    | Deskripsi                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--all`                 | Diagnosis lengkap (hanya-baca, dapat ditempel). Mencakup audit keamanan, kompatibilitas plugin, dan pemeriksaan vektor memori. |
| `--deep`                | Menjalankan pemeriksaan langsung (WhatsApp Web + Telegram + Discord + Slack + Signal). Juga mengaktifkan audit keamanan.     |
| `--usage`               | Menampilkan jendela penggunaan penyedia yang dinormalisasi sebagai `X% tersisa`.                                             |
| `--json`                | Keluaran yang dapat dibaca mesin.                                                                                            |
| `--verbose` / `--debug` | Juga menampilkan resolusi target Gateway mentah sebelum laporan.                                                             |

`openclaw status` biasa tetap menggunakan jalur hanya-baca yang cepat dan menandai memori sebagai
`tidak diperiksa`, bukan tidak tersedia, ketika melewati pemeriksaan memori. Pemeriksaan berat
untuk audit keamanan, kompatibilitas plugin, dan vektor memori diserahkan kepada
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`,
dan `openclaw memory status --deep`.

## Resolusi sesi dan model

- Keluaran status sesi memisahkan `Eksekusi:` dari `Runtime:`. `Eksekusi`
  adalah jalur sandbox (`direct`, `docker/*`), sedangkan `Runtime` memberi tahu Anda
  apakah sesi menggunakan `OpenClaw Default`, `OpenAI Codex`, backend CLI,
  atau backend ACP seperti `codex (acp/acpx)`. Lihat
  [Runtime agen](/id/concepts/agent-runtimes) untuk perbedaan penyedia/model/runtime.
- Ketika snapshot sesi saat ini minim, `/status` dapat mengisi kembali penghitung token
  dan cache dari log penggunaan transkrip terbaru. Nilai langsung bukan nol yang ada
  tetap diutamakan daripada nilai fallback transkrip.
- Fallback transkrip juga dapat memulihkan label model runtime aktif ketika
  entri sesi langsung tidak memilikinya. Jika model transkrip tersebut berbeda
  dari model yang dipilih, status menentukan jendela konteks berdasarkan
  model runtime yang dipulihkan, bukan model yang dipilih.
- Untuk penghitungan ukuran prompt, fallback transkrip mengutamakan total
  berorientasi prompt yang lebih besar ketika metadata sesi tidak ada atau lebih kecil, sehingga
  sesi penyedia khusus tidak menyusut menjadi tampilan `0` token.
- Ketika sesi disematkan ke model yang berbeda dari model utama yang dikonfigurasi,
  status menampilkan kedua nilai, alasannya (`penggantian sesi`), dan
  petunjuk `/model default`. Model utama yang dikonfigurasi berlaku untuk sesi baru atau
  sesi yang tidak disematkan; sesi yang sudah disematkan mempertahankan pilihan sesinya
  hingga dihapus.
- Keluaran mencakup penyimpanan sesi per agen ketika beberapa agen
  dikonfigurasi.

## Penggunaan dan kuota

- `--usage` menampilkan jendela penggunaan penyedia yang dinormalisasi sebagai `X% tersisa`.
- Kolom mentah `usage_percent` / `usagePercent` milik MiniMax menunjukkan sisa kuota,
  sehingga OpenClaw membalikkannya sebelum ditampilkan; kolom berbasis jumlah diutamakan jika
  tersedia. Respons `model_remains` mengutamakan entri model obrolan, memperoleh
  label jendela dari stempel waktu bila diperlukan, dan menyertakan nama model dalam
  label paket.
- Kegagalan penyegaran harga model ditampilkan sebagai peringatan harga opsional.
  Hal tersebut tidak berarti Gateway atau saluran tidak sehat.

## Ikhtisar dan status pembaruan

- Ikhtisar mencakup status pemasangan/runtime layanan host Gateway + Node jika
  tersedia, ditambah waktu aktif proses Gateway yang ringkas dan waktu aktif sistem host.
- Ikhtisar mencakup saluran pembaruan + SHA git (untuk checkout sumber).
- Informasi pembaruan ditampilkan di Ikhtisar; jika pembaruan tersedia, status
  menampilkan petunjuk untuk menjalankan `openclaw update` (lihat [Memperbarui](/id/install/updating)).

## Rahasia

- Permukaan status hanya-baca (`status`, `status --json`, `status --all`)
  menyelesaikan SecretRef yang didukung untuk jalur konfigurasi targetnya jika
  memungkinkan.
- Jika SecretRef saluran yang didukung dikonfigurasi tetapi tidak tersedia di
  jalur perintah saat ini, status tetap hanya-baca dan melaporkan keluaran
  terdegradasi alih-alih mengalami crash. Keluaran untuk manusia menampilkan peringatan seperti "token yang dikonfigurasi
  tidak tersedia di jalur perintah ini", dan keluaran JSON mencakup
  `secretDiagnostics`.
- Ketika resolusi SecretRef lokal perintah berhasil, status mengutamakan
  snapshot yang telah diselesaikan dan menghapus penanda saluran sementara "rahasia tidak tersedia"
  dari keluaran akhir.
- `status --all` mencakup baris ikhtisar Rahasia dan bagian diagnosis
  yang merangkum diagnostik rahasia (dipotong agar mudah dibaca) tanpa
  menghentikan pembuatan laporan.

## Memori

`status --json --all` melaporkan detail memori dari runtime plugin memori aktif
yang dipilih oleh `plugins.slots.memory`. Plugin memori khusus dapat membiarkan
`agents.defaults.memorySearch.enabled` bawaan dinonaktifkan dan tetap melaporkan
status berkas, potongan, vektor, dan FTS mereka sendiri.

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/gateway/doctor)
