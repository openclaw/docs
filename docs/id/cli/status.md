---
read_when:
    - Anda menginginkan diagnosis cepat tentang kesehatan channel + penerima sesi terbaru
    - Anda menginginkan status “all” yang mudah ditempel untuk debugging
summary: Referensi CLI untuk `openclaw status` (diagnostik, probe, snapshot penggunaan)
title: Status
x-i18n:
    generated_at: "2026-04-24T09:02:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
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

- `--deep` menjalankan probe live (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` mencetak jendela penggunaan provider yang dinormalisasi sebagai `X% left`.
- Output status sesi kini memisahkan `Runtime:` dari `Runner:`. `Runtime` adalah path eksekusi dan status sandbox (`direct`, `docker/*`), sedangkan `Runner` memberi tahu Anda apakah sesi menggunakan Pi tertanam, provider berbasis CLI, atau backend harness ACP seperti `codex (acp/acpx)`.
- Field mentah `usage_percent` / `usagePercent` MiniMax adalah kuota tersisa, jadi OpenClaw membalikkannya sebelum ditampilkan; field berbasis hitungan diprioritaskan saat ada. Respons `model_remains` mengutamakan entri chat-model, menurunkan label jendela dari timestamp bila diperlukan, dan menyertakan nama model dalam label paket.
- Saat snapshot sesi saat ini jarang, `/status` dapat mengisi balik penghitung token dan cache dari log penggunaan transkrip terbaru. Nilai live nonzero yang sudah ada tetap diprioritaskan dibanding nilai fallback transkrip.
- Fallback transkrip juga dapat memulihkan label model runtime aktif saat entri sesi live tidak memilikinya. Jika model transkrip itu berbeda dari model yang dipilih, status me-resolve context window terhadap model runtime yang dipulihkan alih-alih model yang dipilih.
- Untuk akuntansi ukuran prompt, fallback transkrip mengutamakan total berorientasi prompt yang lebih besar saat metadata sesi tidak ada atau lebih kecil, agar sesi custom-provider tidak runtuh menjadi tampilan token `0`.
- Output menyertakan penyimpanan sesi per agen saat beberapa agen dikonfigurasi.
- Ikhtisar mencakup status pemasangan/runtime layanan Gateway + host node saat tersedia.
- Ikhtisar mencakup saluran pembaruan + git SHA (untuk checkout source).
- Info pembaruan muncul di Ikhtisar; jika pembaruan tersedia, status mencetak petunjuk untuk menjalankan `openclaw update` (lihat [Memperbarui](/id/install/updating)).
- Surface status read-only (`status`, `status --json`, `status --all`) me-resolve SecretRef yang didukung untuk path config targetnya bila memungkinkan.
- Jika SecretRef channel yang didukung dikonfigurasi tetapi tidak tersedia di path perintah saat ini, status tetap read-only dan melaporkan output degraded alih-alih crash. Output untuk manusia menampilkan peringatan seperti “configured token unavailable in this command path”, dan output JSON menyertakan `secretDiagnostics`.
- Saat resolusi SecretRef lokal-perintah berhasil, status mengutamakan snapshot yang sudah di-resolve dan menghapus penanda channel “secret unavailable” sementara dari output akhir.
- `status --all` menyertakan baris ikhtisar Secrets dan bagian diagnosis yang merangkum diagnostik secret (dipotong agar mudah dibaca) tanpa menghentikan pembuatan laporan.

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/gateway/doctor)
