---
read_when:
    - Anda ingin diagnosis cepat tentang kesehatan channel + penerima sesi terbaru
    - Anda menginginkan status “all” yang bisa langsung ditempel untuk debugging
summary: Referensi CLI untuk `openclaw status` (diagnostik, probe, snapshot penggunaan)
title: status
x-i18n:
    generated_at: "2026-04-23T13:58:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 015614e329ec172a62c625581897fa64589f12dfe28edefe8a2764b5b5367b2a
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnostik untuk channel + sesi.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Catatan:

- `--deep` menjalankan probe langsung (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` mencetak jendela penggunaan provider yang dinormalisasi sebagai `X% tersisa`.
- Output status sesi kini memisahkan `Runtime:` dari `Runner:`. `Runtime` adalah jalur eksekusi dan status sandbox (`direct`, `docker/*`), sedangkan `Runner` memberi tahu apakah sesi menggunakan Pi tersemat, provider berbasis CLI, atau backend harness ACP seperti `codex (acp/acpx)`.
- Field mentah `usage_percent` / `usagePercent` milik MiniMax adalah kuota yang tersisa, jadi OpenClaw membalikkannya sebelum ditampilkan; field berbasis hitungan diprioritaskan jika tersedia. Respons `model_remains` memprioritaskan entri chat-model, menurunkan label jendela dari timestamp bila diperlukan, dan menyertakan nama model dalam label paket.
- Saat snapshot sesi saat ini minim data, `/status` dapat mengisi ulang penghitung token dan cache dari log penggunaan transkrip terbaru. Nilai live nonzero yang sudah ada tetap diprioritaskan dibanding nilai fallback transkrip.
- Fallback transkrip juga dapat memulihkan label model runtime aktif saat entri sesi live tidak memilikinya. Jika model transkrip itu berbeda dari model yang dipilih, status menyelesaikan context window terhadap model runtime yang dipulihkan, bukan model yang dipilih.
- Untuk penghitungan ukuran prompt, fallback transkrip memprioritaskan total berorientasi prompt yang lebih besar saat metadata sesi tidak ada atau lebih kecil, sehingga sesi custom-provider tidak turun menjadi tampilan token `0`.
- Output menyertakan penyimpanan sesi per-agent saat beberapa agent dikonfigurasi.
- Ringkasan mencakup status instalasi/runtime layanan host Gateway + node jika tersedia.
- Ringkasan mencakup channel pembaruan + SHA git (untuk checkout source).
- Info pembaruan ditampilkan di Ringkasan; jika pembaruan tersedia, status mencetak petunjuk untuk menjalankan `openclaw update` (lihat [Memperbarui](/id/install/updating)).
- Permukaan status read-only (`status`, `status --json`, `status --all`) menyelesaikan SecretRef yang didukung untuk path config targetnya bila memungkinkan.
- Jika SecretRef channel yang didukung dikonfigurasi tetapi tidak tersedia pada jalur perintah saat ini, status tetap read-only dan melaporkan output yang menurun alih-alih crash. Output untuk manusia menampilkan peringatan seperti “configured token unavailable in this command path”, dan output JSON menyertakan `secretDiagnostics`.
- Saat penyelesaian SecretRef lokal-perintah berhasil, status memprioritaskan snapshot yang telah diselesaikan dan menghapus penanda channel sementara “secret unavailable” dari output akhir.
- `status --all` menyertakan baris ringkasan Secrets dan bagian diagnosis yang merangkum diagnostik secret (dipotong untuk keterbacaan) tanpa menghentikan pembuatan laporan.
