---
read_when:
    - Menjalankan atau mengonfigurasi onboarding CLI
    - Menyiapkan mesin baru
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI: verifikasi inferensi, lalu serahkan penyiapan yang tersisa kepada OpenClaw'
title: Orientasi (CLI)
x-i18n:
    generated_at: "2026-07-19T16:45:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c02990a37465578ec8153ffff880455b437fa8cf1e8796b89944289e0543982
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

Orientasi CLI adalah jalur penyiapan terminal yang direkomendasikan di macOS, Linux, dan
Windows (native atau WSL2). Secara default, proses ini mendeteksi akses AI yang sudah tersedia di
mesin, memverifikasinya dengan penyelesaian nyata, dan memulai OpenClaw untuk
mengonfigurasi ruang kerja, Gateway, dan fitur opsional. `openclaw setup` menjalankan alur yang sama ([Penyiapan](/id/cli/setup) membahas
varian khusus konfigurasi `--baseline`). Pengguna desktop Windows juga dapat memulai
dari [Windows Hub](/id/platforms/windows).

Orientasi terpandu menyiapkan inferensi terlebih dahulu. Proses ini mendeteksi akses AI yang tersedia,
mewajibkan penyelesaian nyata, dan baru kemudian memulai [OpenClaw](/id/cli/openclaw)
untuk mengonfigurasi bagian OpenClaw lainnya. Memilih **Lewati untuk saat ini** akan keluar dari orientasi
tanpa memulai OpenClaw.

Wizard klasik tetap tersedia untuk penyedia khusus, penyiapan Gateway jarak jauh,
pemasangan kanal, kontrol daemon, Skills, dan impor. Jalankan secara eksplisit
dengan `openclaw onboard --classic`; pemilih inferensi terpandu tidak mendelegasikan
ke wizard tersebut. Setelah inferensi berhasil, OpenClaw dapat menggunakan `open channel wizard for
<channel>` untuk menyerahkan penyiapan kanal yang memerlukan rahasia kepada wizard terminal yang menyamarkannya.
Untuk mengubah penyedia model atau autentikasinya, keluar dari OpenClaw dan jalankan
`openclaw onboard`; OpenClaw tidak membuka alur penyedia terpandu maupun klasik.

<Info>
Cara tercepat untuk memulai percakapan pertama: selesaikan penyiapan terpandu, jalankan `openclaw dashboard`, lalu lakukan percakapan di
browser melalui UI Kontrol. Dokumentasi: [Dasbor](/id/web/dashboard).
</Info>

## Lokal

Wizard melokalkan teks tetap orientasi. Wizard menggunakan nilai pertama yang tidak kosong dari
`OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES`, dan `LANG`, sesuai urutan tersebut, lalu
kembali menggunakan bahasa Inggris. Lokal yang didukung: `en`, `zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # Penggantian eksplisit ke bahasa Inggris
```

Nama produk, perintah, kunci konfigurasi, URL, ID penyedia, ID model, serta
label plugin/kanal tetap dalam bahasa Inggris apa pun lokalnya.

Untuk mengonfigurasi ulang pengaturan non-inferensi nanti:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` tidak menyiratkan mode noninteraktif. Untuk skrip, gunakan `--non-interactive` (lihat [Otomatisasi CLI](/id/start/wizard-cli-automation)).
</Note>

<Tip>
Wizard klasik menyertakan langkah pencarian web tempat Anda dapat memilih penyedia: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG, atau Tavily. Beberapa memerlukan kunci API; lainnya
tidak memerlukan kunci. Konfigurasikan ini nanti dengan `openclaw configure --section web`. Dokumentasi:
[Alat web](/id/tools/web).
</Tip>

## Default terpandu

`openclaw onboard` biasa mengikuti jalur ini:

1. Terima pemberitahuan keamanan.
2. Deteksi model yang dikonfigurasi, variabel lingkungan kunci API, CLI AI lokal yang didukung,
   dan model berkemampuan alat yang sudah terinstal dari server Ollama atau LM
   Studio yang dapat dijangkau pada host Gateway. Proses hanya-baca ini tidak pernah mengunduh
   model. Instalasi Gemini CLI, Antigravity, Pi, dan OpenCode juga dilaporkan
   ketika tidak dapat berfungsi sebagai rute inferensi yang dapat digunakan ulang untuk penyiapan terpandu.
   Gemini dan Antigravity tidak dapat memberlakukan pemeriksaan tanpa alat; Pi dan OpenCode
   merupakan kerangka kerja agen lengkap, bukan rute inferensi penyiapan.
3. Uji kandidat pertama yang terdeteksi dengan penyelesaian nyata. Jika gagal, tampilkan
   alasannya dan lanjutkan ke kandidat berikutnya yang dapat digunakan.
4. Jika deteksi kehabisan kandidat, pilih OpenAI, Anthropic, xAI (Grok), Google, atau
   OpenRouter, atau pilih **Lainnya…** untuk penyedia lainnya. Wilayah,
   paket, serta metode browser, perangkat, kunci API, atau token yang didukung oleh setiap penyedia
   muncul di menu kedua dan diuji dengan penyelesaian nyata yang sama.
   Pilih **Lewati untuk saat ini** untuk keluar tanpa memulai OpenClaw.
5. Simpan hanya rute model yang telah diverifikasi dan status kredensial/plugin apa pun yang
   diperlukan. Pengaturan ruang kerja dan Gateway tetap tidak berubah.
6. Mulai OpenClaw dengan model yang telah diverifikasi agar dapat mengonfigurasi ruang kerja,
   Gateway, kanal, agen, plugin, dan penyiapan opsional lainnya.

Menjalankan ulang perintah pada instalasi yang telah dikonfigurasi akan menguji model default saat ini
terlebih dahulu, sehingga alur terpandu berfungsi sebagai proses verifikasi dan perbaikan. Pemeriksaan yang gagal
tidak pernah mengganti model yang dikonfigurasi secara otomatis; orientasi berhenti dan
menanyakan cara melanjutkan. Jalankan `openclaw channels add` atau `openclaw configure` untuk
penambahan non-inferensi selanjutnya; gunakan `openclaw onboard` untuk perubahan rute
penyedia atau autentikasi.

## Wizard klasik: QuickStart vs Advanced

Jalankan `openclaw onboard --classic` untuk membuka wizard lengkap. Wizard dimulai dengan
pilihan antara **QuickStart** (default) dan **Advanced** (kontrol penuh). Berikan
`--flow quickstart` atau `--flow advanced` (alias `manual`) untuk memilih alur klasik
dan melewati perintah tersebut.

<Tabs>
  <Tab title="QuickStart (default)">
    - Gateway lokal, pengikatan loopback
    - Ruang kerja default (atau ruang kerja yang ada)
    - Port Gateway **18789**
    - Autentikasi Gateway **Token** (dibuat otomatis, bahkan pada loopback)
    - Kebijakan alat: `tools.profile: "coding"` untuk penyiapan baru (profil eksplisit yang ada dipertahankan)
    - Sesi DM: orientasi mempertahankan `session.dmScope` yang eksplisit dan jika tidak ada akan membiarkannya tidak ditetapkan, sehingga default `"main"` menyimpan semua pesan langsung lintas kanal dalam sesi utama bergulir milik agen—default agen pribadi. Untuk kotak masuk bersama atau multipengguna, gunakan `"per-channel-peer"`; `openclaw security audit` merekomendasikan isolasi saat mendeteksi lalu lintas DM multipengguna. Detail: [Referensi penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals)
    - Eksposur Tailscale **Nonaktif**
    - DM Telegram dan WhatsApp menggunakan **daftar izin** secara default: Telegram meminta ID pengguna Telegram numerik, WhatsApp meminta nomor telepon

  </Tab>
  <Tab title="Advanced (kontrol penuh)">
    - Menampilkan setiap langkah: mode, ruang kerja, gateway, kanal, daemon, Skills

  </Tab>
</Tabs>

Mode jarak jauh (`--mode remote`) selalu menggunakan alur lanjutan; mode ini hanya
mengonfigurasi mesin ini agar terhubung ke Gateway di tempat lain dan tidak pernah menginstal
atau mengubah apa pun pada host jarak jauh.

## Yang dikonfigurasi oleh orientasi klasik

Mode lokal (default) memandu melalui langkah-langkah berikut:

1. **Model/Autentikasi** - pilih alur autentikasi penyedia (kunci API, OAuth, atau
   autentikasi manual khusus penyedia), termasuk Penyedia Khusus
   (kompatibel dengan OpenAI, kompatibel dengan OpenAI Responses, kompatibel dengan Anthropic, atau
   deteksi otomatis Tidak Dikenal). Pilih model default.
   Penyiapan kunci API OpenAI baru menggunakan `openai/gpt-5.6` secara default (ID direct-API
   biasa diselesaikan menjadi Sol); penyiapan ChatGPT/Codex baru menggunakan
   `openai/gpt-5.6-sol` secara default. Menjalankan ulang penyiapan mempertahankan model eksplisit yang ada,
   termasuk `openai/gpt-5.5`. Pilih `openai/gpt-5.5` secara eksplisit jika
   akun tidak menyediakan GPT-5.6.
   Catatan keamanan: jika agen ini akan menjalankan alat atau memproses konten
   webhook/hook, pilih model generasi terbaru terkuat yang tersedia dan pertahankan
   kebijakan alat yang ketat - tingkat yang lebih lemah atau lama lebih mudah terkena injeksi prompt.
   Untuk proses noninteraktif, `--secret-input-mode ref` menyimpan referensi berbasis lingkungan
   sebagai pengganti nilai kunci API teks biasa; variabel lingkungan yang dirujuk harus sudah
   ditetapkan, atau orientasi langsung gagal. Mode referensi rahasia interaktif dapat
   menunjuk ke variabel lingkungan atau referensi penyedia yang dikonfigurasi (`file` atau
   `exec`), dengan pemeriksaan awal cepat sebelum penyimpanan. Setelah penyiapan model/autentikasi,
   wizard menawarkan pengujian penyelesaian langsung opsional; kegagalan dapat kembali ke
   penyiapan model/autentikasi satu kali atau diabaikan tanpa menghalangi bagian lain dari
   wizard klasik. Mengabaikannya tidak membuka akses OpenClaw; penyiapan percakapan
   tetap memerlukan pemeriksaan inferensi yang berhasil.
2. **Ruang kerja** - direktori untuk file agen (default `~/.openclaw/workspace`). Menyemai file bootstrap.
3. **Gateway** - port, alamat pengikatan, mode autentikasi, eksposur Tailscale. Dalam
   mode token interaktif, pilih penyimpanan token teks biasa (default) atau pilih
   SecretRef. Jalur SecretRef noninteraktif: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanal** - kanal percakapan bawaan dan plugin resmi, termasuk
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp, dan lainnya.
5. **Daemon** - menginstal LaunchAgent (macOS), unit pengguna systemd
   (Linux/WSL2), atau Windows Scheduled Task native dengan fallback folder
   Startup per pengguna.
   Jika autentikasi token diperlukan dan `gateway.auth.token` dikelola oleh SecretRef,
   penginstalan daemon memvalidasinya tetapi tidak menyimpan token yang telah diuraikan ke dalam
   metadata lingkungan layanan supervisor; SecretRef yang tidak dapat diuraikan akan menghalangi
   penginstalan disertai panduan. Jika `gateway.auth.token` dan
   `gateway.auth.password` keduanya ditetapkan sementara `gateway.auth.mode` tidak ditetapkan, penginstalan
   akan dihalangi hingga Anda menetapkan mode secara eksplisit.
6. **Pemeriksaan kesehatan** - memulai Gateway dan memverifikasi bahwa Gateway dapat dijangkau.
7. **Skills** - menginstal skill yang direkomendasikan beserta dependensi opsionalnya.

<Note>
Menjalankan ulang orientasi **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih
**Reset** (atau memberikan `--reset`). CLI `--reset` secara default menghapus konfigurasi, kredensial,
dan sesi; gunakan `--reset-scope full` untuk turut menghapus ruang kerja. Jika
konfigurasi tidak valid atau berisi kunci lama, orientasi meminta Anda menjalankan
`openclaw doctor` terlebih dahulu.
</Note>

`--flow import` menjalankan alur migrasi yang terdeteksi (misalnya Hermes) di
wizard klasik sebagai pengganti penyiapan baru; lihat [Migrasi](/id/cli/migrate) dan panduan migrasi di bawah
[Instalasi](/id/install/migrating-hermes). `openclaw onboard --modern` adalah
alias kompatibilitas untuk [OpenClaw](/id/cli/openclaw). Perintah ini menggunakan
gerbang inferensi yang sama dengan `openclaw setup`: inferensi terverifikasi memulai
asisten, sedangkan kegagalan interaktif kembali ke penyiapan inferensi terpandu.

## Menambahkan agen lain

Gunakan `openclaw agents add <name>` untuk membuat agen terpisah dengan
ruang kerja, sesi, dan profil autentikasinya sendiri. Menjalankan tanpa `--workspace` memulai
alur interaktif untuk nama, ruang kerja, autentikasi, kanal, dan pengikatan - ini
bukan wizard `openclaw onboard` lengkap.

Yang ditetapkan:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Catatan:

- Ruang kerja default: `~/.openclaw/workspace-<agentId>` (atau di bawah
  `agents.defaults.workspace` jika nilai tersebut ditetapkan).
- Tambahkan `bindings` untuk merutekan pesan masuk ke agen ini (orientasi dapat melakukannya untuk Anda).
- Flag noninteraktif: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referensi lengkap

Untuk perilaku langkah demi langkah dan keluaran konfigurasi secara mendetail, lihat
[Referensi penyiapan CLI](/id/start/wizard-cli-reference).
Untuk contoh noninteraktif, lihat [Otomatisasi CLI](/id/start/wizard-cli-automation).
Untuk referensi flag lengkap, lihat [`openclaw onboard`](/id/cli/onboard).

## Dokumentasi terkait

- Referensi perintah CLI: [`openclaw onboard`](/id/cli/onboard)
- Ikhtisar orientasi: [Ikhtisar orientasi](/id/start/onboarding-overview)
- Orientasi aplikasi macOS: [Orientasi](/id/start/onboarding)
- Ritual pengoperasian pertama agen: [Bootstrap Agen](/id/start/bootstrapping)
