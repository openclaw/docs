---
read_when:
    - Anda menginginkan diagnosis cepat tentang kesehatan saluran + penerima sesi terbaru
    - Anda menginginkan status "all" yang siap ditempel untuk debugging
summary: Referensi CLI untuk `openclaw status` (diagnostik, probe, snapshot penggunaan)
title: openclaw status
x-i18n:
    generated_at: "2026-05-11T20:26:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c887878a62c88ebdd81947a23ae4d3ea1f78b1654175b65469ccc4cba2ecdff
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

- `--deep` menjalankan probe langsung (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` biasa tetap berada di jalur baca-saja yang cepat dan menandai memori sebagai `not checked`, bukan tidak tersedia, ketika melewati inspeksi memori. Audit keamanan berat, kompatibilitas plugin, dan probe vektor memori diserahkan ke `openclaw status --all`, `openclaw status --deep`, `openclaw security audit`, dan `openclaw memory status --deep`.
- `status --json --all` melaporkan detail memori dari runtime plugin memori aktif yang dipilih oleh `plugins.slots.memory`. Plugin memori kustom dapat membiarkan `agents.defaults.memorySearch.enabled` bawaan tetap dinonaktifkan dan tetap melaporkan file, chunk, vektor, dan status FTS miliknya sendiri.
- `--usage` mencetak jendela penggunaan provider yang dinormalisasi sebagai `X% left`.
- Output status sesi memisahkan `Execution:` dari `Runtime:`. `Execution` adalah jalur sandbox (`direct`, `docker/*`), sementara `Runtime` memberi tahu apakah sesi menggunakan `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP seperti `codex (acp/acpx)`. Lihat [Runtime agen](/id/concepts/agent-runtimes) untuk perbedaan provider/model/runtime.
- Kolom mentah `usage_percent` / `usagePercent` MiniMax adalah kuota tersisa, jadi OpenClaw membaliknya sebelum ditampilkan; kolom berbasis hitungan menang jika tersedia. Respons `model_remains` mengutamakan entri model chat, menurunkan label jendela dari timestamp jika diperlukan, dan menyertakan nama model dalam label paket.
- Ketika snapshot sesi saat ini minim, `/status` dapat mengisi balik penghitung token dan cache dari log penggunaan transkrip terbaru. Nilai langsung bukan nol yang sudah ada tetap menang atas nilai fallback transkrip.
- `/status` menyertakan uptime proses Gateway ringkas dan uptime sistem host.
- Fallback transkrip juga dapat memulihkan label model runtime aktif ketika entri sesi langsung tidak memilikinya. Jika model transkrip tersebut berbeda dari model yang dipilih, status menyelesaikan jendela konteks terhadap model runtime yang dipulihkan, bukan model yang dipilih.
- Untuk akuntansi ukuran prompt, fallback transkrip mengutamakan total berorientasi prompt yang lebih besar ketika metadata sesi tidak ada atau lebih kecil, sehingga sesi provider kustom tidak runtuh menjadi tampilan token `0`.
- Output menyertakan penyimpanan sesi per agen ketika beberapa agen dikonfigurasi.
- Ringkasan menyertakan status instalasi/runtime layanan host Gateway + node jika tersedia.
- Ringkasan menyertakan channel pembaruan + SHA git (untuk checkout sumber).
- Info pembaruan muncul di Ringkasan; jika pembaruan tersedia, status mencetak petunjuk untuk menjalankan `openclaw update` (lihat [Memperbarui](/id/install/updating)).
- Kegagalan penyegaran harga model ditampilkan sebagai peringatan harga opsional. Itu tidak berarti Gateway atau channel tidak sehat.
- Permukaan status baca-saja (`status`, `status --json`, `status --all`) menyelesaikan SecretRefs yang didukung untuk jalur konfigurasi targetnya jika memungkinkan.
- Jika SecretRef channel yang didukung dikonfigurasi tetapi tidak tersedia dalam jalur perintah saat ini, status tetap baca-saja dan melaporkan output terdegradasi alih-alih crash. Output manusia menampilkan peringatan seperti "token yang dikonfigurasi tidak tersedia dalam jalur perintah ini", dan output JSON menyertakan `secretDiagnostics`.
- Ketika penyelesaian SecretRef lokal perintah berhasil, status mengutamakan snapshot yang diselesaikan dan menghapus penanda channel sementara "secret tidak tersedia" dari output akhir.
- `status --all` menyertakan baris ringkasan Secrets dan bagian diagnosis yang merangkum diagnostik secret (dipotong agar mudah dibaca) tanpa menghentikan pembuatan laporan.

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/gateway/doctor)
