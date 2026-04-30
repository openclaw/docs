---
read_when:
    - Anda ingin diagnosis cepat tentang kesehatan saluran + penerima sesi terbaru
    - Anda menginginkan status “all” yang dapat ditempelkan untuk pemecahan masalah
summary: Referensi CLI untuk `openclaw status` (diagnostik, probe, snapshot penggunaan)
title: Status
x-i18n:
    generated_at: "2026-04-30T09:41:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
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

- `--deep` menjalankan probe langsung (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` biasa tetap berada pada jalur baca-saja yang cepat dan menandai memori sebagai `not checked`, bukan tidak tersedia, saat melewati inspeksi memori. Audit keamanan berat, kompatibilitas Plugin, dan probe vektor memori diserahkan ke `openclaw status --all`, `openclaw status --deep`, `openclaw security audit`, dan `openclaw memory status --deep`.
- `status --json --all` melaporkan detail memori dari runtime Plugin memori aktif yang dipilih oleh `plugins.slots.memory`. Plugin memori kustom dapat membiarkan `agents.defaults.memorySearch.enabled` bawaan tetap nonaktif dan tetap melaporkan file, potongan, vektor, dan status FTS miliknya sendiri.
- `--usage` mencetak jendela penggunaan penyedia yang dinormalisasi sebagai `X% left`.
- Keluaran status sesi memisahkan `Execution:` dari `Runtime:`. `Execution` adalah jalur sandbox (`direct`, `docker/*`), sedangkan `Runtime` memberi tahu apakah sesi menggunakan `OpenClaw Pi Default`, `OpenAI Codex`, backend CLI, atau backend ACP seperti `codex (acp/acpx)`. Lihat [Runtime agen](/id/concepts/agent-runtimes) untuk perbedaan penyedia/model/runtime.
- Kolom mentah `usage_percent` / `usagePercent` dari MiniMax adalah kuota yang tersisa, jadi OpenClaw membalikkannya sebelum ditampilkan; kolom berbasis jumlah menang saat tersedia. Respons `model_remains` memprioritaskan entri model chat, menurunkan label jendela dari stempel waktu bila diperlukan, dan menyertakan nama model dalam label paket.
- Saat snapshot sesi saat ini jarang, `/status` dapat mengisi balik penghitung token dan cache dari log penggunaan transkrip terbaru. Nilai langsung bukan nol yang sudah ada tetap menang atas nilai fallback transkrip.
- Fallback transkrip juga dapat memulihkan label model runtime aktif saat entri sesi langsung tidak memilikinya. Jika model transkrip tersebut berbeda dari model yang dipilih, status menyelesaikan jendela konteks terhadap model runtime yang dipulihkan, bukan model yang dipilih.
- Untuk perhitungan ukuran prompt, fallback transkrip memprioritaskan total berorientasi prompt yang lebih besar saat metadata sesi hilang atau lebih kecil, sehingga sesi penyedia kustom tidak runtuh menjadi tampilan token `0`.
- Keluaran menyertakan penyimpanan sesi per agen saat beberapa agen dikonfigurasi.
- Ikhtisar menyertakan status instalasi/runtime Gateway + layanan host Node saat tersedia.
- Ikhtisar menyertakan kanal pembaruan + SHA git (untuk checkout sumber).
- Info pembaruan muncul di Ikhtisar; jika pembaruan tersedia, status mencetak petunjuk untuk menjalankan `openclaw update` (lihat [Memperbarui](/id/install/updating)).
- Permukaan status baca-saja (`status`, `status --json`, `status --all`) menyelesaikan SecretRefs yang didukung untuk jalur konfigurasi yang ditargetkan jika memungkinkan.
- Jika SecretRef saluran yang didukung dikonfigurasi tetapi tidak tersedia di jalur perintah saat ini, status tetap baca-saja dan melaporkan keluaran yang terdegradasi alih-alih crash. Keluaran manusia menampilkan peringatan seperti “token yang dikonfigurasi tidak tersedia di jalur perintah ini”, dan keluaran JSON menyertakan `secretDiagnostics`.
- Saat penyelesaian SecretRef lokal perintah berhasil, status memprioritaskan snapshot yang terselesaikan dan menghapus penanda saluran sementara “rahasia tidak tersedia” dari keluaran akhir.
- `status --all` menyertakan baris ikhtisar Rahasia dan bagian diagnosis yang merangkum diagnostik rahasia (dipotong agar mudah dibaca) tanpa menghentikan pembuatan laporan.

## Terkait

- [Referensi CLI](/id/cli)
- [Doctor](/id/gateway/doctor)
