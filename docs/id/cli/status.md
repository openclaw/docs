---
read_when:
    - Anda menginginkan diagnosis cepat tentang kesehatan saluran + penerima sesi terbaru
    - Anda menginginkan status "all" yang dapat ditempel untuk penelusuran bug
summary: Referensi CLI untuk `openclaw status` (diagnostik, probe, snapshot penggunaan)
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T09:05:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
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
- `openclaw status` biasa tetap berada di jalur read-only cepat dan menandai memori sebagai `not checked`, bukan tidak tersedia, saat melewati inspeksi memori. Audit keamanan berat, kompatibilitas Plugin, dan probe vektor memori diserahkan ke `openclaw status --all`, `openclaw status --deep`, `openclaw security audit`, dan `openclaw memory status --deep`.
- `status --json --all` melaporkan detail memori dari runtime Plugin memori aktif yang dipilih oleh `plugins.slots.memory`. Plugin memori kustom dapat membiarkan `agents.defaults.memorySearch.enabled` bawaan tetap dinonaktifkan dan tetap melaporkan status file, chunk, vektor, dan FTS miliknya sendiri.
- `--usage` mencetak jendela penggunaan provider yang dinormalisasi sebagai `X% left`.
- Output status sesi memisahkan `Execution:` dari `Runtime:`. `Execution` adalah jalur sandbox (`direct`, `docker/*`), sedangkan `Runtime` memberi tahu apakah sesi menggunakan `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP seperti `codex (acp/acpx)`. Lihat [Runtime agen](/id/concepts/agent-runtimes) untuk perbedaan provider/model/runtime.
- Field mentah MiniMax `usage_percent` / `usagePercent` adalah kuota tersisa, sehingga OpenClaw membalikkannya sebelum ditampilkan; field berbasis hitungan menang saat ada. Respons `model_remains` mengutamakan entri model chat, menurunkan label jendela dari timestamp saat diperlukan, dan menyertakan nama model dalam label paket.
- Saat snapshot sesi saat ini sparse, `/status` dapat mengisi balik penghitung token dan cache dari log penggunaan transkrip terbaru. Nilai live bukan nol yang sudah ada tetap menang atas nilai fallback transkrip.
- `/status` menyertakan uptime proses Gateway dan uptime sistem host secara ringkas.
- Fallback transkrip juga dapat memulihkan label model runtime aktif saat entri sesi live tidak memilikinya. Jika model transkrip tersebut berbeda dari model yang dipilih, status menyelesaikan jendela konteks terhadap model runtime yang dipulihkan, bukan model yang dipilih.
- Untuk penghitungan ukuran prompt, fallback transkrip mengutamakan total berorientasi prompt yang lebih besar saat metadata sesi hilang atau lebih kecil, sehingga sesi provider kustom tidak runtuh menjadi tampilan token `0`.
- Output menyertakan store sesi per agen saat beberapa agen dikonfigurasi.
- Ringkasan menyertakan status instalasi/runtime layanan host Gateway + Node saat tersedia.
- Ringkasan menyertakan channel pembaruan + SHA git (untuk checkout source).
- Info pembaruan muncul di Ringkasan; jika pembaruan tersedia, status mencetak petunjuk untuk menjalankan `openclaw update` (lihat [Memperbarui](/id/install/updating)).
- Permukaan status read-only (`status`, `status --json`, `status --all`) menyelesaikan SecretRefs yang didukung untuk jalur config targetnya jika memungkinkan.
- Jika SecretRef channel yang didukung dikonfigurasi tetapi tidak tersedia di jalur perintah saat ini, status tetap read-only dan melaporkan output terdegradasi alih-alih crash. Output manusia menampilkan peringatan seperti "token terkonfigurasi tidak tersedia di jalur perintah ini", dan output JSON menyertakan `secretDiagnostics`.
- Saat resolusi SecretRef lokal perintah berhasil, status mengutamakan snapshot yang sudah di-resolve dan menghapus marker channel sementara "secret unavailable" dari output akhir.
- `status --all` menyertakan baris ringkasan Secrets dan bagian diagnosis yang merangkum diagnostik secret (dipotong agar mudah dibaca) tanpa menghentikan pembuatan laporan.

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/gateway/doctor)
