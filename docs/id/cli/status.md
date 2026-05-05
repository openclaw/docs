---
read_when:
    - Anda ingin diagnosis cepat tentang kesehatan saluran + penerima sesi terbaru
    - Anda menginginkan status “all” yang dapat ditempel untuk pemecahan masalah
summary: Referensi CLI untuk `openclaw status` (diagnostik, probe, snapshot penggunaan)
title: Status
x-i18n:
    generated_at: "2026-05-05T06:16:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

Diagnostik untuk saluran + sesi.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Catatan:

- `--deep` menjalankan probe live (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` biasa tetap berada pada jalur cepat hanya-baca dan menandai memori sebagai `not checked`, bukan tidak tersedia, saat melewati inspeksi memori. Audit keamanan berat, kompatibilitas Plugin, dan probe vektor memori diserahkan ke `openclaw status --all`, `openclaw status --deep`, `openclaw security audit`, dan `openclaw memory status --deep`.
- `status --json --all` melaporkan detail memori dari runtime Plugin Active Memory yang dipilih oleh `plugins.slots.memory`. Plugin memori kustom dapat membiarkan `agents.defaults.memorySearch.enabled` bawaan tetap dinonaktifkan dan tetap melaporkan status file, chunk, vektor, dan FTS mereka sendiri.
- `--usage` mencetak jendela penggunaan penyedia yang dinormalisasi sebagai `X% left`.
- Output status sesi memisahkan `Execution:` dari `Runtime:`. `Execution` adalah jalur sandbox (`direct`, `docker/*`), sedangkan `Runtime` memberi tahu apakah sesi menggunakan `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP seperti `codex (acp/acpx)`. Lihat [Runtime agen](/id/concepts/agent-runtimes) untuk perbedaan penyedia/model/runtime.
- Kolom mentah `usage_percent` / `usagePercent` dari MiniMax adalah kuota tersisa, jadi OpenClaw membalikkannya sebelum ditampilkan; kolom berbasis hitungan menang jika ada. Respons `model_remains` mengutamakan entri model chat, menurunkan label jendela dari timestamp bila diperlukan, dan menyertakan nama model dalam label paket.
- Saat snapshot sesi saat ini jarang, `/status` dapat mengisi balik penghitung token dan cache dari log penggunaan transkrip terbaru. Nilai live bukan nol yang sudah ada tetap menang atas nilai fallback transkrip.
- `/status` menyertakan uptime proses Gateway dan uptime sistem host secara ringkas.
- Fallback transkrip juga dapat memulihkan label model runtime aktif saat entri sesi live tidak memilikinya. Jika model transkrip itu berbeda dari model yang dipilih, status menyelesaikan jendela konteks terhadap model runtime yang dipulihkan, bukan model yang dipilih.
- Untuk akuntansi ukuran prompt, fallback transkrip mengutamakan total berorientasi prompt yang lebih besar saat metadata sesi hilang atau lebih kecil, sehingga sesi penyedia kustom tidak turun menjadi tampilan token `0`.
- Output menyertakan store sesi per agen saat beberapa agen dikonfigurasi.
- Ikhtisar menyertakan status instal/runtime layanan host Gateway + node jika tersedia.
- Ikhtisar menyertakan channel pembaruan + SHA git (untuk checkout sumber).
- Info pembaruan muncul di Ikhtisar; jika pembaruan tersedia, status mencetak petunjuk untuk menjalankan `openclaw update` (lihat [Memperbarui](/id/install/updating)).
- Permukaan status hanya-baca (`status`, `status --json`, `status --all`) menyelesaikan SecretRef yang didukung untuk jalur konfigurasi tertargetnya jika memungkinkan.
- Jika SecretRef saluran yang didukung dikonfigurasi tetapi tidak tersedia di jalur perintah saat ini, status tetap hanya-baca dan melaporkan output terdegradasi alih-alih crash. Output manusia menampilkan peringatan seperti “token terkonfigurasi tidak tersedia di jalur perintah ini”, dan output JSON menyertakan `secretDiagnostics`.
- Saat resolusi SecretRef lokal-perintah berhasil, status mengutamakan snapshot yang terselesaikan dan menghapus penanda saluran “secret tidak tersedia” sementara dari output final.
- `status --all` menyertakan baris ikhtisar Secrets dan bagian diagnosis yang merangkum diagnostik secret (dipotong agar mudah dibaca) tanpa menghentikan pembuatan laporan.

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/gateway/doctor)
