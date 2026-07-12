---
read_when:
    - Memilih jalur orientasi
    - Menyiapkan lingkungan baru
sidebarTitle: Onboarding Overview
summary: Ikhtisar opsi dan alur orientasi OpenClaw
title: Gambaran umum orientasi awal
x-i18n:
    generated_at: "2026-07-12T14:41:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw memiliki onboarding melalui terminal dan aplikasi macOS. Keduanya menyiapkan inferensi terlebih dahulu:
keduanya mendeteksi akses AI yang sudah ada, mewajibkan penyelesaian langsung, dan baru kemudian memulai
Crestodian untuk mengonfigurasi penyiapan yang tersisa. Gateway yang dapat dijangkau dan telah dikonfigurasi,
dengan agen default yang sudah memiliki model terkonfigurasi, akan melewati onboarding dan membuka
antarmuka agen normal. Alur terminal juga menawarkan wisaya klasik lengkap untuk
penyiapan terperinci.

## Jalur mana yang sebaiknya saya gunakan?

|                 | Onboarding CLI                         | Onboarding aplikasi macOS         |
| --------------- | -------------------------------------- | --------------------------------- |
| **Platform**    | macOS, Linux, Windows (native atau WSL2) | Hanya macOS                     |
| **Antarmuka**   | Penyiapan inferensi, lalu Crestodian   | Penyiapan inferensi, lalu Crestodian |
| **Paling cocok untuk** | Server, tanpa antarmuka grafis, kontrol penuh | Mac desktop, penyiapan visual |
| **Otomatisasi** | `--non-interactive` untuk skrip        | Hanya manual                      |
| **Perintah**    | `openclaw onboard`                     | Jalankan aplikasi                 |

Sebagian besar pengguna sebaiknya memulai dengan **onboarding CLI** — ini berfungsi di
semua platform dan memberi Anda kendali paling besar.

## Yang dikonfigurasi oleh onboarding

Fase inferensi terpandu hanya menyiapkan:

1. **Penyedia model dan autentikasi** — akses yang terdeteksi atau kunci API yang telah diverifikasi
2. **Inferensi terverifikasi** — penyelesaian nyata pada model efektif
   milik agen default

Setelah penyelesaian tersebut berhasil, Crestodian dapat mengonfigurasi ruang kerja, Gateway,
layanan Gateway, saluran, agen, plugin, dan fitur opsional lainnya.

Wisaya CLI klasik juga dapat mengonfigurasi:

1. **Saluran** (opsional) — saluran obrolan bawaan dan terbundel seperti
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp, dan lainnya
2. **Kontrol Gateway lanjutan** — mode jarak jauh, pengaturan jaringan, dan pilihan daemon

## Onboarding CLI

Jalankan di terminal apa pun:

```bash
openclaw onboard
```

Alur terpandu mendeteksi akses AI yang sudah ada, menguji kandidat secara langsung sesuai urutan,
beralih ke kandidat berikutnya jika gagal, dan menawarkan entri kunci manual yang disamarkan. Alur ini hanya menyimpan
model dan kredensial setelah penyelesaian berhasil, kemudian memulai Crestodian
untuk mengonfigurasi ruang kerja, Gateway, saluran, agen, plugin, dan fitur
opsional lainnya. Tidak ada Crestodian sebelum inferensi, jalur untuk melewati AI, atau
peralihan ke alur klasik dari dalam alur. Keluar dan jalankan `openclaw onboard --classic` jika Anda
ingin menggunakan wisaya klasik.

Setelah inferensi berhasil, Crestodian dapat menyerahkan penyiapan saluran kepada wisaya terminal
dengan masukan yang disamarkan. Crestodian tidak membuka penyiapan penyedia terpandu maupun klasik; keluar dari Crestodian dan
jalankan `openclaw onboard` untuk mengubah penyedia model atau autentikasinya.

Gunakan `openclaw onboard --classic` untuk penyiapan model/autentikasi, saluran, Skills,
Gateway jarak jauh, atau impor secara terperinci. Menambahkan `--install-daemon` juga memilih
alur klasik dan memasang layanan latar belakang dalam satu langkah. Gunakan `openclaw
crestodian` untuk penyiapan dan perbaikan non-inferensi secara percakapan. `openclaw
onboard --modern` adalah alias kompatibilitas yang menggunakan gerbang inferensi langsung
yang sama.

Referensi lengkap: [Onboarding (CLI)](/id/start/wizard)
Dokumentasi perintah CLI: [`openclaw onboard`](/id/cli/onboard)

## Onboarding aplikasi macOS

Buka aplikasi OpenClaw. Jika Gateway lokal atau jarak jauh yang dikonfigurasinya dapat dijangkau
dan agen default sudah memiliki model yang dikonfigurasi, aplikasi akan melewati onboarding
dan Crestodian, lalu langsung membuka antarmuka agen normal.

Untuk Gateway baru atau belum lengkap, alur penggunaan pertama mendeteksi akses AI yang
sudah ada (Claude Code, Codex, atau kunci API), menguji opsi terbaik secara
langsung, dan menyimpannya hanya setelah menerima balasan nyata — beralih secara otomatis jika gagal dan
menawarkan langkah kunci API manual terverifikasi jika tidak ada yang ditemukan. Kredensial
sensitif menggunakan masukan yang disamarkan. Setelah inferensi berhasil, Crestodian dimulai dan
membantu mengonfigurasi sisanya.

Gemini CLI tetap tersedia bagi agen normal setelah penyiapan, tetapi tidak
ditawarkan untuk gerbang inferensi ini karena tidak dapat menerapkan pemeriksaan tanpa alat.

Referensi lengkap: [Onboarding (Aplikasi macOS)](/id/start/onboarding)

## Penyedia khusus atau yang tidak tercantum

Jika penyedia Anda tidak tercantum, jalankan `openclaw onboard --classic`, pilih
**Penyedia Khusus**, lalu masukkan:

- Kompatibilitas titik akhir: kompatibel dengan OpenAI (`/chat/completions`), kompatibel dengan OpenAI Responses (`/responses`), kompatibel dengan Anthropic (`/messages`), atau tidak diketahui (memeriksa ketiganya dan mendeteksi secara otomatis)
- URL dasar dan kunci API (kunci API bersifat opsional jika titik akhir tidak memerlukannya)
- ID model dan alias model opsional

Beberapa titik akhir khusus dapat digunakan secara bersamaan — masing-masing mendapatkan ID titik akhirnya sendiri.

## Terkait

- [Memulai](/id/start/getting-started)
- [Referensi penyiapan CLI](/id/start/wizard-cli-reference)
