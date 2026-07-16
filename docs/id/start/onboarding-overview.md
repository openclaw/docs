---
read_when:
    - Memilih jalur orientasi awal
    - Menyiapkan lingkungan baru
sidebarTitle: Onboarding Overview
summary: Ikhtisar opsi dan alur orientasi OpenClaw
title: Ikhtisar orientasi
x-i18n:
    generated_at: "2026-07-16T18:36:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4bcda1dcfb91f388ca6bef59f9bdf5177571d93c0d89c45025ef837628fa7ba0
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw memiliki orientasi awal melalui terminal dan aplikasi macOS. Keduanya menyiapkan inferensi terlebih dahulu:
keduanya mendeteksi akses AI yang ada, mewajibkan completion langsung, dan baru setelah itu memulai
OpenClaw untuk mengonfigurasi penyiapan lainnya. Gateway yang dapat dijangkau dan telah dikonfigurasi,
dengan agen default yang sudah memiliki model terkonfigurasi, akan melewati orientasi awal dan membuka
UI agen normal. Alur terminal juga menawarkan wizard klasik lengkap untuk
penyiapan terperinci.

## Jalur mana yang sebaiknya digunakan?

|                | Orientasi awal CLI                         | Orientasi awal aplikasi macOS           |
| -------------- | -------------------------------------- | ------------------------------ |
| **Platform**  | macOS, Linux, Windows (native atau WSL2) | Khusus macOS                     |
| **Antarmuka**  | Penyiapan inferensi, lalu OpenClaw         | Penyiapan inferensi, lalu OpenClaw |
| **Paling cocok untuk**   | Server, tanpa antarmuka grafis, kontrol penuh        | Mac desktop, penyiapan visual      |
| **Otomatisasi** | `--non-interactive` untuk skrip        | Hanya manual                    |
| **Perintah**    | `openclaw onboard`                     | Jalankan aplikasi                 |

Sebagian besar pengguna sebaiknya memulai dengan **orientasi awal CLI** — alur ini berfungsi di mana saja dan memberi
Anda kontrol paling besar.

## Yang dikonfigurasi oleh orientasi awal

Fase inferensi terpandu hanya menyiapkan:

1. **Penyedia model dan autentikasi** — akses yang terdeteksi atau proses masuk penyedia yang telah diverifikasi,
   kunci API, atau token
2. **Inferensi terverifikasi** — completion nyata pada model efektif
   agen default

Setelah completion tersebut berhasil, OpenClaw dapat mengonfigurasi ruang kerja, Gateway,
layanan Gateway, saluran, agen, plugin, dan fitur opsional lainnya.

Wizard CLI klasik juga dapat mengonfigurasi:

1. **Saluran** (opsional) — saluran obrolan bawaan dan yang dibundel seperti
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp, dan lainnya
2. **Kontrol Gateway lanjutan** — mode jarak jauh, pengaturan jaringan, dan pilihan daemon

## Orientasi awal CLI

Jalankan di terminal mana pun:

```bash
openclaw onboard
```

Alur terpandu mendeteksi akses AI yang ada, menguji kandidat secara langsung secara berurutan,
dan beralih ke kandidat berikutnya jika gagal. Jika semua upaya deteksi telah dilakukan, alur ini menampilkan OpenAI,
Anthropic, xAI (Grok), Google, dan OpenRouter terlebih dahulu. **Lainnya…** berisi
penyedia lainnya dalam kelompok penyedia, dengan wilayah, paket, serta metode
browser, perangkat, kunci API, atau token yang didukung dalam menu kedua. Alur ini hanya menyimpan model
dan kredensial setelah completion berhasil, lalu memulai OpenClaw untuk
mengonfigurasi ruang kerja, Gateway, saluran, agen, plugin, dan fitur opsional
lainnya. **Lewati untuk saat ini** akan keluar tanpa memulai OpenClaw. Tidak ada
peralihan ke alur klasik di dalam alur ini; keluar dan jalankan `openclaw onboard --classic` jika Anda menginginkan
wizard klasik sebagai gantinya.

Setelah inferensi berhasil, OpenClaw dapat menyerahkan penyiapan saluran ke wizard terminal
dengan input tersamarkan. Alur ini tidak membuka penyiapan penyedia terpandu maupun klasik; keluar dari OpenClaw dan
jalankan `openclaw onboard` untuk mengubah penyedia model atau autentikasinya.

Gunakan `openclaw onboard --classic` untuk penyiapan terperinci terkait model/autentikasi, saluran, skill,
Gateway jarak jauh, atau impor. Menambahkan `--install-daemon` juga akan memilih
alur klasik dan memasang layanan latar belakang dalam satu langkah. Gunakan `openclaw
openclaw` untuk penyiapan dan perbaikan non-inferensi secara percakapan. `openclaw
onboard --modern` adalah alias kompatibilitas yang menggunakan gerbang inferensi langsung
yang sama.

Referensi lengkap: [Orientasi awal (CLI)](/id/start/wizard)
Dokumentasi perintah CLI: [`openclaw onboard`](/id/cli/onboard)

## Orientasi awal aplikasi macOS

Buka aplikasi OpenClaw. Jika Gateway lokal atau jarak jauh yang dikonfigurasi dapat dijangkau
dan agen default sudah memiliki model terkonfigurasi, aplikasi akan melewati orientasi awal
dan OpenClaw, lalu segera membuka UI agen normal.

Untuk Gateway baru atau yang belum lengkap, alur penggunaan pertama mendeteksi akses AI
yang ada (Claude Code, Codex, atau kunci API), menguji langsung opsi
terbaik, dan hanya menyimpannya setelah menerima respons nyata — secara otomatis beralih ke opsi lain dan
menawarkan langkah kunci API manual yang terverifikasi jika tidak ada yang ditemukan. Kredensial
sensitif menggunakan input tersamarkan. Setelah inferensi berhasil, OpenClaw dimulai dan
membantu mengonfigurasi bagian lainnya.

Gemini CLI tetap tersedia untuk agen normal setelah penyiapan, tetapi tidak
ditawarkan untuk gerbang inferensi ini karena tidak dapat memberlakukan pemeriksaan tanpa alat.

Referensi lengkap: [Orientasi awal (Aplikasi macOS)](/id/start/onboarding)

## Penyedia khusus atau yang tidak tercantum

Jika penyedia Anda tidak tercantum, jalankan `openclaw onboard --classic`, pilih
**Penyedia Khusus**, lalu masukkan:

- Kompatibilitas endpoint: kompatibel dengan OpenAI (`/chat/completions`), kompatibel dengan OpenAI Responses (`/responses`), kompatibel dengan Anthropic (`/messages`), atau tidak diketahui (memeriksa ketiganya dan mendeteksinya secara otomatis)
- URL dasar dan kunci API (kunci API bersifat opsional jika endpoint tidak memerlukannya)
- ID model dan alias model opsional

Beberapa endpoint khusus dapat digunakan bersamaan — masing-masing mendapatkan ID endpoint tersendiri.

## Terkait

- [Memulai](/id/start/getting-started)
- [Referensi penyiapan CLI](/id/start/wizard-cli-reference)
