---
read_when:
    - Anda ingin memahami OAuth OpenClaw secara menyeluruh dari awal hingga akhir
    - Anda mengalami masalah invalidasi token / keluar akun
    - Anda menginginkan alur autentikasi Claude CLI atau OAuth
    - Anda menginginkan beberapa akun atau perutean profil
summary: 'OAuth di OpenClaw: pertukaran token, penyimpanan, dan pola multiakun'
title: OAuth
x-i18n:
    generated_at: "2026-07-16T18:05:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw mendukung OAuth ("autentikasi langganan") untuk penyedia yang menawarkannya,
terutama **OpenAI Codex (OAuth ChatGPT)** dan **penggunaan kembali Anthropic Claude CLI**.
Untuk Anthropic, pembagian praktisnya adalah:

- **Kunci API Anthropic**: penagihan API Anthropic normal.
- **Anthropic Claude CLI / autentikasi langganan di dalam OpenClaw**: staf Anthropic
  memberi tahu kami bahwa penggunaan ini kembali diizinkan, sehingga OpenClaw menganggap penggunaan kembali Claude CLI dan
  penggunaan `claude -p` disetujui untuk integrasi ini kecuali Anthropic
  menerbitkan kebijakan baru. Untuk Anthropic dalam produksi, autentikasi kunci API tetap
  menjadi jalur rekomendasi yang lebih aman.

OpenClaw menyimpan autentikasi kunci API OpenAI dan OAuth ChatGPT/Codex di bawah
id penyedia kanonis `openai`. Id profil `openai-codex:*` lama dan
entri `auth.order.openai-codex` merupakan status lama yang diperbaiki oleh
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

Penyedia OAuth umumnya membuat token penyegaran baru pada setiap proses masuk/penyegaran.
Beberapa penyedia membatalkan token penyegaran sebelumnya ketika token baru
diterbitkan untuk pengguna/aplikasi yang sama. Gejala praktisnya: masuk melalui OpenClaw _dan_
melalui Claude Code / Codex CLI, lalu salah satunya keluar secara acak di kemudian hari.

Untuk mengurangi hal tersebut, OpenClaw memperlakukan penyimpanan profil autentikasi sebagai **penampung token**:

- runtime membaca kredensial dari satu tempat per agen
- beberapa profil dapat digunakan secara bersamaan dan dirutekan secara deterministik
- penggunaan kembali CLI eksternal bersifat khusus penyedia: setelah OpenClaw memiliki profil OAuth lokal
  untuk suatu penyedia, token penyegaran lokal menjadi kanonis. Jika token
  penyegaran lokal tersebut ditolak, OpenClaw melaporkan profil agar
  diautentikasi ulang, alih-alih kembali menggunakan materi token CLI eksternal.
  Bootstrap Codex CLI bahkan lebih terbatas: bootstrap hanya dapat mengisi profil bergaya
  `openai:default` yang kosong sebelum OpenClaw memiliki OAuth untuk
  penyedia tersebut; setelah itu, penyegaran milik OpenClaw tetap menjadi kanonis
- jalur status/mulai membatasi penemuan CLI eksternal ke kumpulan penyedia
  yang sudah dikonfigurasi, sehingga penyimpanan proses masuk CLI yang tidak terkait tidak diperiksa untuk
  penyiapan satu penyedia

## Penyimpanan (tempat token berada)

Rahasia berada di setiap agen, dengan kunci berupa nama logis `auth-profiles.json` (
penyimpanan dasarnya adalah basis data SQLite milik agen; nama JSON dipertahankan untuk
kompatibilitas dan tampilan alat):

- Profil autentikasi (OAuth + kunci API + referensi tingkat nilai opsional):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File kompatibilitas lama: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entri `api_key` statis dibersihkan saat ditemukan)

File lama khusus impor (masih didukung, tetapi bukan penyimpanan utama):

- `~/.openclaw/credentials/oauth.json` (diimpor ke penyimpanan profil autentikasi saat pertama kali digunakan)

Semua hal di atas juga mematuhi `$OPENCLAW_STATE_DIR` (penggantian direktori status). Referensi lengkap: [/gateway/configuration-reference#auth-storage](/id/gateway/configuration-reference#auth-storage)

Untuk referensi rahasia statis dan perilaku aktivasi snapshot runtime, lihat [Pengelolaan Rahasia](/id/gateway/secrets).

Ketika agen sekunder tidak memiliki profil autentikasi lokal, OpenClaw menggunakan pewarisan
baca-langsung dari penyimpanan agen default/utama; OpenClaw tidak mengkloning penyimpanan agen
utama saat dibaca. Token penyegaran OAuth sangat sensitif: alur penyalinan normal
melewatkannya secara default karena beberapa penyedia merotasi atau membatalkan
token penyegaran setelah digunakan. Konfigurasikan proses masuk OAuth terpisah untuk agen ketika
agen tersebut memerlukan akun independen.

## Penggunaan kembali Anthropic Claude CLI

OpenClaw mendukung penggunaan kembali Anthropic Claude CLI dan `claude -p` sebagai jalur
autentikasi yang disetujui. Jika sudah memiliki proses masuk Claude lokal pada host,
orientasi awal/konfigurasi dapat langsung menggunakannya kembali. Token penyiapan Anthropic tetap
tersedia sebagai jalur autentikasi token yang didukung, tetapi OpenClaw mengutamakan penggunaan kembali Claude CLI
jika tersedia.

<Warning>
Dokumentasi publik Claude Code dari Anthropic menyatakan bahwa penggunaan langsung Claude Code tetap berada dalam
batas langganan Claude, dan staf Anthropic memberi tahu kami bahwa penggunaan Claude
CLI bergaya OpenClaw kembali diizinkan. Karena itu, OpenClaw menganggap penggunaan kembali Claude CLI dan
penggunaan `claude -p` disetujui untuk integrasi ini kecuali Anthropic
menerbitkan kebijakan baru.

Untuk dokumentasi paket penggunaan langsung Claude Code dari Anthropic saat ini, lihat [Menggunakan Claude Code
dengan paket Pro atau Max
Anda](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
dan [Menggunakan Claude Code dengan paket Team atau Enterprise
Anda](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jika menginginkan opsi bergaya langganan lainnya di OpenClaw, lihat [OpenAI
Codex](/id/providers/openai), [Paket Pengodean Qwen Cloud
](/id/providers/qwen), [Paket Pengodean MiniMax](/id/providers/minimax),
dan [Paket Pengodean Z.AI / GLM](/id/providers/zai).
</Warning>

## Pertukaran OAuth (cara proses masuk bekerja)

Alur proses masuk interaktif OpenClaw diterapkan di `openclaw/plugin-sdk/llm.ts` dan dihubungkan ke panduan/ perintah.

### Token penyiapan Anthropic

Bentuk alur:

1. buat token dengan menjalankan `claude setup-token` pada mesin mana pun yang memiliki Claude Code, lalu mulai token penyiapan Anthropic atau tempel token dari OpenClaw
2. OpenClaw menyimpan kredensial Anthropic yang dihasilkan dalam profil autentikasi
3. pemilihan model tetap menggunakan `anthropic/...`
4. profil autentikasi Anthropic yang ada tetap tersedia untuk kontrol pengembalian/urutan

### OpenAI Codex (OAuth ChatGPT)

OAuth OpenAI Codex secara eksplisit didukung untuk penggunaan di luar Codex CLI, termasuk alur kerja OpenClaw.

Perintah proses masuk menggunakan id penyedia OpenAI kanonis:

```bash
openclaw models auth login --provider openai
```

Gunakan `--profile-id openai:<name>` untuk beberapa akun OAuth ChatGPT/Codex dalam
satu agen. Jangan gunakan `openai-codex:<name>` untuk profil baru. Doctor memigrasikan
awalan lama tersebut ke id profil `openai:*` yang bebas benturan; jalankan
`openclaw models auth list --provider openai` setelah perbaikan sebelum menyalin
id profil ke `auth.order` atau `/model ...@<profileId>`.

Bentuk alur (PKCE):

1. buat verifier/challenge PKCE dan `state` acak
2. buka `https://auth.openai.com/oauth/authorize?...` (cakupan
   `openid profile email offline_access`)
3. coba menangkap callback di `http://localhost:1455/auth/callback` (
   host callback secara default adalah `localhost` dan hanya menerima host loopback;
   ganti dengan `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. jika Anda dapat menempelkan kode sebelum callback tiba (atau Anda berada
   pada sistem jarak jauh/headless dan callback tidak dapat melakukan bind), tempel URL/kode pengalihan
   sebagai gantinya - penempelan manual berlomba dengan callback peramban dan yang selesai
   lebih dahulu akan digunakan
5. tukarkan kode di `https://auth.openai.com/oauth/token`
6. ekstrak `accountId` dari token akses dan simpan `{ access, refresh, expires, accountId }`

Jalur panduan adalah `openclaw onboard` → pilihan autentikasi `openai`.

## Penyegaran + kedaluwarsa

Profil menyimpan stempel waktu `expires`. Saat runtime:

- jika `expires` berada di masa mendatang, gunakan token akses yang tersimpan
- jika kedaluwarsa, segarkan (dengan penguncian file) dan timpa kredensial yang tersimpan
- jika agen sekunder membaca profil OAuth agen utama yang diwarisi,
  penyegaran menulis kembali ke penyimpanan agen utama alih-alih menyalin token
  penyegaran ke penyimpanan agen sekunder
- kredensial CLI yang dikelola secara eksternal (Claude CLI, bootstrap Codex CLI terbatas;
  lihat [Penampung token](#the-token-sink-why-it-exists)) dibaca ulang alih-alih
  menggunakan token penyegaran yang disalin. Jika penyegaran terkelola gagal, OpenClaw
  melaporkan profil yang terpengaruh agar diautentikasi ulang alih-alih mengembalikan
  materi token CLI eksternal.

Alur penyegaran berjalan otomatis; umumnya Anda tidak perlu mengelola token secara manual.

## Beberapa akun (profil) + perutean

Dua pola:

### 1) Diutamakan: agen terpisah

Jika ingin "pribadi" dan "kerja" tidak pernah berinteraksi, gunakan agen yang terisolasi (sesi + kredensial + ruang kerja terpisah):

```bash
openclaw agents add work
openclaw agents add personal
```

Kemudian konfigurasikan autentikasi per agen (panduan) dan rutekan percakapan ke agen yang tepat.

### 2) Tingkat lanjut: beberapa profil dalam satu agen

Penyimpanan profil autentikasi mendukung beberapa id profil untuk penyedia yang sama.
Pilih profil yang digunakan:

- secara global melalui pengurutan konfigurasi (`auth.order`)
- per sesi melalui `/model ...@<profileId>`

Contoh (penggantian sesi):

- `/model Opus@anthropic:work`

Cantumkan id profil yang ada dengan:

```bash
openclaw models auth list --provider <id>
```

Dokumentasi terkait:

- [Failover model](/id/concepts/model-failover) (aturan rotasi + masa tunggu)
- [Perintah garis miring](/id/tools/slash-commands) (permukaan perintah)

## Terkait

- [Autentikasi](/id/gateway/authentication) - ikhtisar autentikasi penyedia model
- [Rahasia](/id/gateway/secrets) - penyimpanan kredensial dan SecretRef
- [Referensi Konfigurasi](/id/gateway/configuration-reference#auth-storage) - kunci konfigurasi autentikasi
