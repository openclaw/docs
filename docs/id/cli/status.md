---
read_when:
    - Anda ingin diagnosis cepat tentang kesehatan saluran + penerima sesi terbaru
    - Anda menginginkan status “all” yang bisa ditempel untuk debugging
summary: Referensi CLI untuk `openclaw status` (diagnostik, probe, snapshot penggunaan)
title: status
x-i18n:
    generated_at: "2026-04-05T13:49:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbe9d94fbe9938cd946ee6f293b5bd3b464b75e1ade2eacdd851788c3bffe94e
    source_path: cli/status.md
    workflow: 15
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

- `--deep` menjalankan probe langsung (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` mencetak jendela penggunaan provider yang dinormalisasi sebagai `X% left`.
- Field mentah `usage_percent` / `usagePercent` milik MiniMax adalah kuota tersisa, jadi OpenClaw membalikkannya sebelum ditampilkan; field berbasis hitungan diprioritaskan saat tersedia. Respons `model_remains` memprioritaskan entri model chat, menurunkan label jendela dari timestamp saat diperlukan, dan menyertakan nama model dalam label paket.
- Saat snapshot sesi saat ini jarang terisi, `/status` dapat mengisi balik penghitung token dan cache dari log penggunaan transkrip terbaru. Nilai langsung nonzero yang sudah ada tetap diprioritaskan dibanding nilai fallback transkrip.
- Fallback transkrip juga dapat memulihkan label model runtime aktif saat entri sesi langsung tidak memilikinya. Jika model transkrip tersebut berbeda dari model yang dipilih, status menyelesaikan context window terhadap model runtime yang dipulihkan, bukan model yang dipilih.
- Untuk perhitungan ukuran prompt, fallback transkrip memprioritaskan total berorientasi prompt yang lebih besar saat metadata sesi tidak ada atau lebih kecil, sehingga sesi custom-provider tidak turun menjadi tampilan token `0`.
- Output mencakup penyimpanan sesi per agen saat beberapa agen dikonfigurasi.
- Ringkasan mencakup status instalasi/runtime layanan host Gateway + node saat tersedia.
- Ringkasan mencakup saluran pembaruan + git SHA (untuk checkout source).
- Info pembaruan muncul di Ringkasan; jika pembaruan tersedia, status mencetak petunjuk untuk menjalankan `openclaw update` (lihat [Memperbarui](/install/updating)).
- Permukaan status read-only (`status`, `status --json`, `status --all`) menyelesaikan SecretRef yang didukung untuk jalur config targetnya bila memungkinkan.
- Jika SecretRef saluran yang didukung dikonfigurasi tetapi tidak tersedia dalam jalur perintah saat ini, status tetap read-only dan melaporkan output terdegradasi alih-alih crash. Output untuk manusia menampilkan peringatan seperti “configured token unavailable in this command path”, dan output JSON mencakup `secretDiagnostics`.
- Saat penyelesaian SecretRef lokal-perintah berhasil, status memprioritaskan snapshot yang telah diselesaikan dan menghapus penanda saluran “secret unavailable” sementara dari output akhir.
- `status --all` mencakup baris ringkasan Secrets dan bagian diagnosis yang merangkum diagnostik secret (dipotong agar mudah dibaca) tanpa menghentikan pembuatan laporan.
