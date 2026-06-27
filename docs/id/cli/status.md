---
read_when:
    - Anda menginginkan diagnosis cepat atas kesehatan channel + penerima sesi terbaru
    - Anda menginginkan status "semua" yang dapat ditempel untuk pemecahan masalah
summary: Referensi CLI untuk `openclaw status` (diagnostik, probe, snapshot penggunaan)
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T17:21:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
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

Catatan:

- `--deep` menjalankan probe live (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` biasa tetap berada di jalur cepat hanya-baca dan menandai memori sebagai `not checked`, bukan tidak tersedia, ketika melewati inspeksi memori. Audit keamanan berat, kompatibilitas plugin, dan probe vektor memori diserahkan ke `openclaw status --all`, `openclaw status --deep`, `openclaw security audit`, dan `openclaw memory status --deep`.
- `status --json --all` melaporkan detail memori dari runtime plugin memori aktif yang dipilih oleh `plugins.slots.memory`. Plugin memori kustom dapat membiarkan `agents.defaults.memorySearch.enabled` bawaan dinonaktifkan dan tetap melaporkan file, chunk, vektor, dan status FTS miliknya sendiri.
- `--usage` mencetak jendela penggunaan penyedia yang dinormalisasi sebagai `X% left`.
- Output status sesi memisahkan `Execution:` dari `Runtime:`. `Execution` adalah path sandbox (`direct`, `docker/*`), sedangkan `Runtime` memberi tahu apakah sesi menggunakan `OpenClaw Default`, `OpenAI Codex`, backend CLI, atau backend ACP seperti `codex (acp/acpx)`. Lihat [Runtime agen](/id/concepts/agent-runtimes) untuk perbedaan penyedia/model/runtime.
- Field mentah MiniMax `usage_percent` / `usagePercent` adalah kuota tersisa, jadi OpenClaw membaliknya sebelum ditampilkan; field berbasis jumlah menang saat ada. Respons `model_remains` memprioritaskan entri model chat, menurunkan label jendela dari timestamp bila diperlukan, dan menyertakan nama model dalam label paket.
- Ketika snapshot sesi saat ini jarang, `/status` dapat mengisi balik penghitung token dan cache dari log penggunaan transkrip terbaru. Nilai live bukan nol yang sudah ada tetap menang atas nilai fallback transkrip.
- `/status` menyertakan uptime proses Gateway dan uptime sistem host secara ringkas.
- Fallback transkrip juga dapat memulihkan label model runtime aktif ketika entri sesi live tidak memilikinya. Jika model transkrip itu berbeda dari model yang dipilih, status menyelesaikan jendela konteks terhadap model runtime yang dipulihkan, bukan model yang dipilih.
- Ketika sebuah sesi dipinkan ke model yang berbeda dari primer yang dikonfigurasi, status mencetak kedua nilai, alasannya (`session override`), dan petunjuk yang jelas (`/model default`). Primer yang dikonfigurasi berlaku untuk sesi baru atau yang tidak dipinkan; sesi terpin yang sudah ada mempertahankan pilihan sesinya sampai dihapus.
- Untuk akuntansi ukuran prompt, fallback transkrip memprioritaskan total berorientasi prompt yang lebih besar ketika metadata sesi hilang atau lebih kecil, sehingga sesi penyedia kustom tidak runtuh menjadi tampilan token `0`.
- Output menyertakan penyimpanan sesi per agen ketika beberapa agen dikonfigurasi.
- Ikhtisar menyertakan status instalasi/runtime layanan host Gateway + node bila tersedia.
- Ikhtisar menyertakan channel pembaruan + SHA git (untuk checkout sumber).
- Info pembaruan muncul di Ikhtisar; jika pembaruan tersedia, status mencetak petunjuk untuk menjalankan `openclaw update` (lihat [Memperbarui](/id/install/updating)).
- Kegagalan refresh harga model ditampilkan sebagai peringatan harga opsional. Itu
  tidak berarti Gateway atau channel tidak sehat.
- Permukaan status hanya-baca (`status`, `status --json`, `status --all`) menyelesaikan SecretRef yang didukung untuk path konfigurasi yang ditargetkan bila memungkinkan.
- Jika SecretRef channel yang didukung dikonfigurasi tetapi tidak tersedia di path perintah saat ini, status tetap hanya-baca dan melaporkan output terdegradasi alih-alih crash. Output manusia menampilkan peringatan seperti "configured token unavailable in this command path", dan output JSON menyertakan `secretDiagnostics`.
- Ketika resolusi SecretRef lokal-perintah berhasil, status memprioritaskan snapshot yang diselesaikan dan menghapus penanda channel "secret unavailable" sementara dari output akhir.
- `status --all` menyertakan baris ikhtisar Secrets dan bagian diagnosis yang merangkum diagnostik secret (dipotong agar mudah dibaca) tanpa menghentikan pembuatan laporan.

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/gateway/doctor)
