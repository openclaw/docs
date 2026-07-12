---
read_when:
    - Menjalankan atau mengonfigurasi onboarding CLI
    - Menyiapkan mesin baru
sidebarTitle: 'Onboarding: CLI'
summary: 'Orientasi CLI: verifikasi inferensi, lalu serahkan penyiapan yang tersisa kepada Crestodian'
title: Orientasi awal (CLI)
x-i18n:
    generated_at: "2026-07-12T14:44:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

Onboarding CLI adalah jalur penyiapan terminal yang direkomendasikan di macOS, Linux, dan
Windows (native atau WSL2). Secara default, proses ini mendeteksi akses AI yang sudah tersedia
di mesin, memverifikasinya dengan penyelesaian nyata, lalu memulai Crestodian untuk
mengonfigurasi ruang kerja, Gateway, dan fitur opsional. `openclaw setup` menjalankan alur yang sama ([Penyiapan](/id/cli/setup) membahas
varian khusus konfigurasi `--baseline`). Pengguna desktop Windows juga dapat memulai
dari [Windows Hub](/id/platforms/windows).

Onboarding terpandu menyiapkan inferensi terlebih dahulu. Proses ini mendeteksi akses AI yang tersedia,
mewajibkan penyelesaian nyata, dan baru kemudian memulai [Crestodian](/id/cli/crestodian)
untuk mengonfigurasi bagian OpenClaw lainnya. Tidak ada jalur Crestodian sebelum inferensi atau
jalur untuk melewati AI dalam alur terpandu.

Wisaya klasik tetap tersedia untuk masuk ke penyedia, penyiapan Gateway jarak jauh,
pemasangan kanal, kontrol daemon, Skills, dan impor. Jalankan secara eksplisit
dengan `openclaw onboard --classic`; layar kandidat inferensi terpandu tidak
mendelegasikan proses ke wisaya tersebut. Setelah inferensi berhasil, Crestodian dapat menggunakan `open channel
wizard for <channel>` untuk menyerahkan penyiapan kanal yang memerlukan rahasia ke wisaya
terminal dengan input tersamarkan. Untuk mengubah penyedia model atau autentikasinya, keluar
dari Crestodian dan jalankan `openclaw onboard`; Crestodian tidak membuka alur penyedia
terpandu maupun klasik.

<Info>
Cara tercepat untuk memulai percakapan pertama: selesaikan penyiapan terpandu, jalankan `openclaw dashboard`, lalu mengobrol di
peramban melalui UI Kontrol. Dokumentasi: [Dasbor](/id/web/dashboard).
</Info>

## Lokal

Wisaya melokalkan teks tetap onboarding. Urutan resolusi: `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG`, lalu bahasa Inggris. Lokal yang didukung: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nama produk, perintah, kunci konfigurasi, URL, ID penyedia, ID model, dan
label plugin/kanal tetap dalam bahasa Inggris apa pun lokalnya.

Untuk mengonfigurasi ulang pengaturan noninferensi nanti:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` tidak menyiratkan mode noninteraktif. Untuk skrip, gunakan `--non-interactive` (lihat [Otomatisasi CLI](/id/start/wizard-cli-automation)).
</Note>

<Tip>
Wisaya klasik mencakup langkah pencarian web tempat Anda dapat memilih penyedia: Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG, atau Tavily. Beberapa memerlukan kunci API; yang lainnya
tidak memerlukan kunci. Konfigurasikan nanti dengan `openclaw configure --section web`. Dokumentasi:
[Alat web](/id/tools/web).
</Tip>

## Alur terpandu default

`openclaw onboard` tanpa opsi mengikuti jalur ini:

1. Terima pemberitahuan keamanan.
2. Deteksi model yang telah dikonfigurasi, variabel lingkungan kunci API, dan CLI AI lokal
   yang didukung.
3. Uji kandidat pertama yang terdeteksi dengan penyelesaian nyata. Jika gagal, tampilkan
   alasannya dan lanjutkan ke kandidat berikutnya yang dapat digunakan.
4. Jika semua hasil deteksi telah dicoba, coba ulang kandidat yang terdeteksi atau masukkan kunci
   API penyedia melalui prompt tersamarkan. Onboarding terpandu
   tidak menawarkan Crestodian atau opsi keluar dengan melewati AI sebelum inferensi berfungsi.
5. Simpan hanya rute model yang telah diverifikasi dan setiap status kredensial/plugin yang
   diperlukannya. Pengaturan ruang kerja dan Gateway tetap tidak berubah.
6. Mulai Crestodian dengan model yang telah diverifikasi agar dapat mengonfigurasi ruang kerja,
   Gateway, kanal, agen, plugin, dan penyiapan opsional lainnya.

Menjalankan kembali perintah pada instalasi yang telah dikonfigurasi akan menguji model default saat ini
terlebih dahulu, sehingga alur terpandu berfungsi sebagai proses verifikasi dan perbaikan. Pemeriksaan yang gagal
tidak pernah mengganti model yang telah dikonfigurasi secara otomatis; onboarding berhenti dan
menanyakan cara melanjutkan. Jalankan `openclaw channels add` atau `openclaw configure` untuk
penambahan noninferensi berikutnya; gunakan `openclaw onboard` untuk perubahan rute penyedia atau
autentikasi.

## Wisaya klasik: QuickStart vs Advanced

Jalankan `openclaw onboard --classic` untuk membuka wisaya lengkap. Wisaya dimulai dengan
pilihan antara **QuickStart** (nilai default) dan **Advanced** (kontrol penuh). Berikan
`--flow quickstart` atau `--flow advanced` (alias `manual`) untuk memilih alur klasik
dan melewati prompt tersebut.

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway lokal, pengikatan local loopback
    - Ruang kerja default (atau ruang kerja yang sudah ada)
    - Porta Gateway **18789**
    - Autentikasi Gateway **Token** (dibuat otomatis, bahkan pada local loopback)
    - Kebijakan alat: `tools.profile: "coding"` untuk penyiapan baru (profil eksplisit yang sudah ada dipertahankan)
    - Isolasi pesan langsung: `session.dmScope: "per-channel-peer"` untuk penyiapan baru. Detail: [Referensi penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals)
    - Eksposur Tailscale **Off**
    - Pesan langsung Telegram dan WhatsApp secara default menggunakan **daftar izin**: Telegram meminta ID pengguna Telegram numerik, WhatsApp meminta nomor telepon

  </Tab>
  <Tab title="Advanced (full control)">
    - Menampilkan setiap langkah: mode, ruang kerja, Gateway, kanal, daemon, Skills

  </Tab>
</Tabs>

Mode jarak jauh (`--mode remote`) selalu menggunakan alur lanjutan; mode ini hanya
mengonfigurasi mesin ini agar terhubung ke Gateway di tempat lain dan tidak pernah menginstal
atau mengubah apa pun pada host jarak jauh.

## Yang dikonfigurasi oleh onboarding klasik

Mode lokal (default) memandu Anda melalui langkah-langkah berikut:

1. **Model/Autentikasi** - pilih alur autentikasi penyedia (kunci API, OAuth, atau
   autentikasi manual khusus penyedia), termasuk Custom Provider
   (kompatibel dengan OpenAI, kompatibel dengan OpenAI Responses, kompatibel dengan Anthropic, atau
   deteksi otomatis Unknown). Pilih model default.
   Penyiapan baru dengan kunci API OpenAI secara default menggunakan `openai/gpt-5.6` (ID API langsung
   tanpa awalan diresolusikan ke Sol); penyiapan baru ChatGPT/Codex secara default menggunakan
   `openai/gpt-5.6-sol`. Menjalankan ulang penyiapan akan mempertahankan model eksplisit yang sudah ada,
   termasuk `openai/gpt-5.5`. Pilih `openai/gpt-5.5` secara eksplisit jika
   akun tidak menyediakan GPT-5.6.
   Catatan keamanan: jika agen ini akan menjalankan alat atau memproses konten
   Webhook/hook, utamakan model generasi terbaru terkuat yang tersedia dan pertahankan
   kebijakan alat yang ketat—tingkatan yang lebih lemah atau lebih lama lebih mudah terkena injeksi prompt.
   Untuk eksekusi noninteraktif, `--secret-input-mode ref` menyimpan referensi berbasis variabel lingkungan
   alih-alih nilai kunci API berupa teks biasa; variabel lingkungan yang dirujuk harus sudah
   ditetapkan, atau onboarding langsung gagal. Mode referensi rahasia interaktif dapat
   menunjuk ke variabel lingkungan atau referensi penyedia yang telah dikonfigurasi (`file` atau
   `exec`), dengan pemeriksaan awal cepat sebelum disimpan. Setelah penyiapan model/autentikasi,
   wisaya menawarkan pengujian penyelesaian langsung opsional; jika gagal, Anda dapat kembali satu kali ke
   penyiapan model/autentikasi atau mengabaikannya tanpa menghalangi bagian lain dari
   wisaya klasik. Mengabaikannya tidak membuka akses ke Crestodian; penyiapan melalui percakapan
   tetap memerlukan pemeriksaan inferensi yang berhasil.
2. **Ruang kerja** - direktori untuk berkas agen (default `~/.openclaw/workspace`). Membuat berkas bootstrap awal.
3. **Gateway** - porta, alamat pengikatan, mode autentikasi, eksposur Tailscale. Dalam
   mode token interaktif, pilih penyimpanan token berupa teks biasa (default) atau pilih
   penggunaan SecretRef. Jalur SecretRef noninteraktif: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanal** - kanal obrolan bawaan dan plugin resmi, termasuk
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp, dan lainnya.
5. **Daemon** - menginstal LaunchAgent (macOS), unit pengguna systemd
   (Linux/WSL2), atau Windows Scheduled Task native dengan opsi cadangan folder
   Startup per pengguna.
   Jika autentikasi token diwajibkan dan `gateway.auth.token` dikelola oleh SecretRef,
   instalasi daemon memvalidasinya tetapi tidak menyimpan token yang telah diresolusikan ke dalam
   metadata lingkungan layanan supervisor; SecretRef yang tidak dapat diresolusikan akan menghalangi
   instalasi dan menampilkan panduan. Jika `gateway.auth.token` dan
   `gateway.auth.password` keduanya ditetapkan sementara `gateway.auth.mode` belum ditetapkan, instalasi
   akan dihalangi hingga Anda menetapkan mode secara eksplisit.
6. **Pemeriksaan kesehatan** - memulai Gateway dan memverifikasi bahwa Gateway dapat dijangkau.
7. **Skills** - menginstal Skills yang direkomendasikan beserta dependensi opsionalnya.

<Note>
Menjalankan ulang onboarding **tidak** menghapus apa pun kecuali Anda secara eksplisit memilih
**Reset** (atau memberikan `--reset`). Opsi CLI `--reset` secara default menghapus konfigurasi, kredensial,
dan sesi; gunakan `--reset-scope full` untuk turut menghapus ruang kerja. Jika
konfigurasi tidak valid atau berisi kunci lama, onboarding akan meminta Anda menjalankan
`openclaw doctor` terlebih dahulu.
</Note>

`--flow import` menjalankan alur migrasi yang terdeteksi (misalnya Hermes) di dalam
wisaya klasik sebagai pengganti penyiapan baru; lihat [Migrasi](/id/cli/migrate) dan panduan migrasi di bawah
[Instalasi](/id/install/migrating-hermes). `openclaw onboard --modern` adalah
alias kompatibilitas untuk [Crestodian](/id/cli/crestodian). Alias ini menggunakan
gerbang inferensi yang sama dengan `openclaw crestodian`: inferensi yang telah diverifikasi akan memulai
asisten, sedangkan kegagalan interaktif akan kembali ke penyiapan inferensi terpandu.

## Menambahkan agen lain

Gunakan `openclaw agents add <name>` untuk membuat agen terpisah dengan
ruang kerja, sesi, dan profil autentikasinya sendiri. Menjalankannya tanpa `--workspace` akan memulai
alur interaktif untuk nama, ruang kerja, autentikasi, kanal, dan pengikatan—alur ini
bukan wisaya lengkap `openclaw onboard`.

Yang ditetapkan:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Catatan:

- Ruang kerja default: `~/.openclaw/workspace-<agentId>` (atau di bawah
  `agents.defaults.workspace` jika nilai tersebut ditetapkan).
- Tambahkan `bindings` untuk merutekan pesan masuk ke agen ini (onboarding dapat melakukannya untuk Anda).
- Opsi noninteraktif: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referensi lengkap

Untuk perilaku terperinci langkah demi langkah dan keluaran konfigurasi, lihat
[Referensi penyiapan CLI](/id/start/wizard-cli-reference).
Untuk contoh noninteraktif, lihat [Otomatisasi CLI](/id/start/wizard-cli-automation).
Untuk referensi opsi lengkap, lihat [`openclaw onboard`](/id/cli/onboard).

## Dokumentasi terkait

- Referensi perintah CLI: [`openclaw onboard`](/id/cli/onboard)
- Ringkasan onboarding: [Ringkasan onboarding](/id/start/onboarding-overview)
- Onboarding aplikasi macOS: [Onboarding](/id/start/onboarding)
- Ritual eksekusi pertama agen: [Bootstrap Agen](/id/start/bootstrapping)
