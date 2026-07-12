---
read_when:
    - Anda ingin memahami OAuth OpenClaw secara menyeluruh dari awal hingga akhir
    - Anda mengalami masalah invalidasi token / keluar akun
    - Anda menginginkan alur autentikasi Claude CLI atau OAuth
    - Anda menginginkan beberapa akun atau perutean profil
summary: 'OAuth di OpenClaw: pertukaran token, penyimpanan, dan pola multiakun'
title: OAuth
x-i18n:
    generated_at: "2026-07-12T14:10:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw mendukung OAuth ("autentikasi langganan") untuk penyedia yang menawarkannya,
terutama **OpenAI Codex (OAuth ChatGPT)** dan **penggunaan kembali Anthropic Claude CLI**.
Untuk Anthropic, pembagian praktisnya adalah:

- **Kunci API Anthropic**: penagihan API Anthropic biasa.
- **Anthropic Claude CLI / autentikasi langganan di dalam OpenClaw**: staf Anthropic
  memberi tahu kami bahwa penggunaan ini diizinkan kembali, sehingga OpenClaw menganggap
  penggunaan kembali Claude CLI dan penggunaan `claude -p` diizinkan untuk integrasi ini,
  kecuali Anthropic menerbitkan kebijakan baru. Untuk Anthropic dalam produksi, autentikasi
  dengan kunci API tetap merupakan jalur rekomendasi yang lebih aman.

OpenClaw menyimpan autentikasi kunci API OpenAI dan OAuth ChatGPT/Codex di bawah
id penyedia kanonis `openai`. Id profil `openai-codex:*` lama dan entri
`auth.order.openai-codex` merupakan status lama yang diperbaiki oleh
`openclaw doctor --fix`; gunakan id profil `openai:*` dan `auth.order.openai` untuk
konfigurasi baru.

Halaman ini membahas:

- cara kerja **pertukaran token** OAuth (PKCE)
- tempat token **disimpan** (dan alasannya)
- cara menangani **beberapa akun** (profil + penggantian per sesi)

Plugin penyedia yang menyediakan alur OAuth atau kunci API sendiri dijalankan melalui
titik masuk yang sama:

```bash
openclaw models auth login --provider <id>
```

## Penampung token (alasan keberadaannya)

Penyedia OAuth umumnya menerbitkan token penyegaran baru pada setiap proses masuk/penyegaran.
Beberapa penyedia membatalkan token penyegaran sebelumnya ketika token baru diterbitkan
untuk pengguna/aplikasi yang sama. Gejala praktisnya: masuk melalui OpenClaw _dan_
melalui Claude Code / Codex CLI, lalu salah satunya tiba-tiba keluar dari akun.

Untuk mengurangi hal tersebut, OpenClaw memperlakukan penyimpanan profil autentikasi sebagai
**penampung token**:

- runtime membaca kredensial dari satu tempat untuk setiap agen
- beberapa profil dapat digunakan secara bersamaan dan dirutekan secara deterministik
- penggunaan kembali CLI eksternal bersifat khusus penyedia: setelah OpenClaw memiliki profil
  OAuth lokal untuk suatu penyedia, token penyegaran lokal menjadi kanonis. Jika token
  penyegaran lokal tersebut ditolak, OpenClaw melaporkan profil itu untuk
  autentikasi ulang, alih-alih kembali menggunakan materi token CLI eksternal.
  Bootstrap Codex CLI bahkan lebih terbatas: bootstrap hanya dapat mengisi profil kosong
  bergaya `openai:default` sebelum OpenClaw memiliki OAuth untuk penyedia tersebut;
  setelah itu, penyegaran yang dimiliki OpenClaw tetap menjadi kanonis
- jalur status/mulai membatasi penemuan CLI eksternal ke kumpulan penyedia
  yang sudah dikonfigurasi, sehingga penyimpanan proses masuk CLI yang tidak terkait
  tidak diperiksa untuk penyiapan dengan satu penyedia

## Penyimpanan (tempat token berada)

Rahasia disimpan per agen, dengan nama logis `auth-profiles.json` sebagai kunci
(penyimpanan yang mendasarinya adalah basis data SQLite milik agen; nama JSON
dipertahankan untuk kompatibilitas dan tampilan alat):

- Profil autentikasi (OAuth + kunci API + referensi tingkat nilai opsional):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Berkas kompatibilitas lama: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entri `api_key` statis dibersihkan saat ditemukan)

Berkas lama khusus impor (masih didukung, tetapi bukan penyimpanan utama):

- `~/.openclaw/credentials/oauth.json` (diimpor ke penyimpanan profil autentikasi saat pertama kali digunakan)

Semua hal di atas juga mematuhi `$OPENCLAW_STATE_DIR` (penggantian direktori status). Referensi lengkap: [/gateway/configuration-reference#auth-storage](/id/gateway/configuration-reference#auth-storage)

Untuk referensi rahasia statis dan perilaku aktivasi snapshot runtime, lihat [Pengelolaan Rahasia](/id/gateway/secrets).

Ketika agen sekunder tidak memiliki profil autentikasi lokal, OpenClaw menggunakan
pewarisan baca-langsung dari penyimpanan agen default/utama; OpenClaw tidak mengkloning
penyimpanan agen utama saat membaca. Token penyegaran OAuth sangat sensitif: alur
penyalinan normal melewatinya secara default karena beberapa penyedia merotasi atau
membatalkan token penyegaran setelah digunakan. Konfigurasikan proses masuk OAuth
terpisah untuk agen yang memerlukan akun independen.

## Penggunaan kembali Anthropic Claude CLI

OpenClaw mendukung penggunaan kembali Anthropic Claude CLI dan `claude -p` sebagai
jalur autentikasi yang diizinkan. Jika Anda sudah memiliki proses masuk Claude lokal
di host, orientasi awal/konfigurasi dapat langsung menggunakannya kembali. Token penyiapan
Anthropic tetap tersedia sebagai jalur autentikasi token yang didukung, tetapi OpenClaw
lebih memilih penggunaan kembali Claude CLI jika tersedia.

<Warning>
Dokumentasi publik Claude Code dari Anthropic menyatakan bahwa penggunaan langsung
Claude Code tetap berada dalam batas langganan Claude, dan staf Anthropic memberi tahu
kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan kembali. Karena itu,
OpenClaw menganggap penggunaan kembali Claude CLI dan penggunaan `claude -p` diizinkan
untuk integrasi ini, kecuali Anthropic menerbitkan kebijakan baru.

Untuk dokumentasi paket penggunaan langsung Claude Code dari Anthropic saat ini, lihat
[Menggunakan Claude Code dengan paket Pro atau Max
Anda](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
dan [Menggunakan Claude Code dengan paket Team atau Enterprise
Anda](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jika Anda menginginkan opsi bergaya langganan lainnya di OpenClaw, lihat [OpenAI
Codex](/id/providers/openai), [Paket Pengodean Qwen Cloud
](/id/providers/qwen), [Paket Pengodean MiniMax](/id/providers/minimax),
dan [Paket Pengodean Z.AI / GLM](/id/providers/zai).
</Warning>

## Pertukaran OAuth (cara kerja proses masuk)

Alur proses masuk interaktif OpenClaw diimplementasikan di `openclaw/plugin-sdk/llm.ts` dan dihubungkan ke wisaya/perintah.

### Token penyiapan Anthropic

Bentuk alur:

1. mulai token penyiapan atau penempelan token Anthropic dari OpenClaw
2. OpenClaw menyimpan kredensial Anthropic yang dihasilkan dalam profil autentikasi
3. pemilihan model tetap menggunakan `anthropic/...`
4. profil autentikasi Anthropic yang ada tetap tersedia untuk kontrol pengembalian/pengurutan

### OpenAI Codex (OAuth ChatGPT)

OAuth OpenAI Codex secara eksplisit didukung untuk penggunaan di luar Codex CLI, termasuk alur kerja OpenClaw.

Perintah proses masuk menggunakan id penyedia OpenAI kanonis:

```bash
openclaw models auth login --provider openai
```

Gunakan `--profile-id openai:<name>` untuk beberapa akun OAuth ChatGPT/Codex dalam
satu agen. Jangan gunakan `openai-codex:<name>` untuk profil baru. Doctor memigrasikan
prefiks lama tersebut ke id profil `openai:*` yang bebas benturan; jalankan
`openclaw models auth list --provider openai` setelah perbaikan sebelum menyalin
id profil ke `auth.order` atau `/model ...@<profileId>`.

Bentuk alur (PKCE):

1. buat pemverifikasi/tantangan PKCE dan `state` acak
2. buka `https://auth.openai.com/oauth/authorize?...` (cakupan
   `openid profile email offline_access`)
3. coba tangkap panggilan balik di `http://localhost:1455/auth/callback` (host
   panggilan balik secara default adalah `localhost` dan hanya menerima host local loopback;
   ganti dengan `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. jika Anda dapat menempelkan kode sebelum panggilan balik tiba (atau Anda berada
   dalam lingkungan jarak jauh/tanpa antarmuka dan panggilan balik tidak dapat mengikat),
   tempelkan URL/kode pengalihan sebagai gantinya - penempelan manual berlomba dengan
   panggilan balik peramban dan proses yang selesai lebih dahulu akan digunakan
5. tukarkan kode di `https://auth.openai.com/oauth/token`
6. ekstrak `accountId` dari token akses dan simpan `{ access, refresh, expires, accountId }`

Jalur wisaya adalah `openclaw onboard` → pilihan autentikasi `openai`.

## Penyegaran + kedaluwarsa

Profil menyimpan stempel waktu `expires`. Pada saat runtime:

- jika `expires` berada di masa mendatang, gunakan token akses yang tersimpan
- jika kedaluwarsa, segarkan (di bawah kunci berkas) dan timpa kredensial yang tersimpan
- jika agen sekunder membaca profil OAuth agen utama yang diwarisi, penyegaran
  ditulis kembali ke penyimpanan agen utama, alih-alih menyalin token penyegaran
  ke penyimpanan agen sekunder
- kredensial CLI yang dikelola secara eksternal (Claude CLI, bootstrap Codex CLI terbatas;
  lihat [Penampung token](#the-token-sink-why-it-exists)) dibaca ulang, alih-alih
  menggunakan token penyegaran yang disalin. Jika penyegaran terkelola gagal,
  OpenClaw melaporkan profil yang terdampak untuk autentikasi ulang, alih-alih
  mengembalikan materi token CLI eksternal.

Alur penyegaran bersifat otomatis; umumnya Anda tidak perlu mengelola token secara manual.

## Beberapa akun (profil) + perutean

Dua pola:

### 1) Disarankan: agen terpisah

Jika Anda ingin akun "pribadi" dan "kerja" tidak pernah berinteraksi, gunakan agen
terisolasi (sesi + kredensial + ruang kerja terpisah):

```bash
openclaw agents add work
openclaw agents add personal
```

Kemudian konfigurasikan autentikasi per agen (wisaya) dan rutekan percakapan ke agen yang tepat.

### 2) Tingkat lanjut: beberapa profil dalam satu agen

Penyimpanan profil autentikasi mendukung beberapa ID profil untuk penyedia yang sama.
Pilih profil yang digunakan:

- secara global melalui pengurutan konfigurasi (`auth.order`)
- per sesi melalui `/model ...@<profileId>`

Contoh (penggantian sesi):

- `/model Opus@anthropic:work`

Cantumkan ID profil yang ada dengan:

```bash
openclaw models auth list --provider <id>
```

Dokumentasi terkait:

- [Failover model](/id/concepts/model-failover) (aturan rotasi + masa jeda)
- [Perintah garis miring](/id/tools/slash-commands) (permukaan perintah)

## Terkait

- [Autentikasi](/id/gateway/authentication) - ikhtisar autentikasi penyedia model
- [Rahasia](/id/gateway/secrets) - penyimpanan kredensial dan SecretRef
- [Referensi Konfigurasi](/id/gateway/configuration-reference#auth-storage) - kunci konfigurasi autentikasi
