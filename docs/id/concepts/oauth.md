---
read_when:
    - Anda ingin memahami OAuth OpenClaw dari awal hingga akhir
    - Anda mengalami masalah pembatalan validitas token / keluar
    - Anda menginginkan alur autentikasi Claude CLI atau OAuth
    - Anda menginginkan beberapa akun atau perutean profil
summary: 'OAuth di OpenClaw: pertukaran token, penyimpanan, dan pola multi-akun'
title: OAuth
x-i18n:
    generated_at: "2026-04-30T09:44:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw mendukung “autentikasi langganan” melalui OAuth untuk penyedia yang menawarkannya
(terutama **OpenAI Codex (ChatGPT OAuth)**). Untuk Anthropic, pembagian praktisnya
sekarang adalah:

- **Kunci API Anthropic**: penagihan API Anthropic normal
- **Anthropic Claude CLI / autentikasi langganan di dalam OpenClaw**: staf Anthropic
  memberi tahu kami bahwa penggunaan ini diizinkan lagi

OAuth OpenAI Codex secara eksplisit didukung untuk digunakan di alat eksternal seperti
OpenClaw. Halaman ini menjelaskan:

Untuk Anthropic di produksi, autentikasi kunci API adalah jalur yang lebih aman dan direkomendasikan.

- cara kerja **pertukaran token** OAuth (PKCE)
- tempat **penyimpanan** token (dan alasannya)
- cara menangani **beberapa akun** (profil + penggantian per sesi)

OpenClaw juga mendukung **Plugin penyedia** yang membawa alur OAuth atau kunci API
mereka sendiri. Jalankan melalui:

```bash
openclaw models auth login --provider <id>
```

## Penampung token (mengapa ini ada)

Penyedia OAuth umumnya membuat **refresh token baru** selama alur masuk/refresh. Beberapa penyedia (atau klien OAuth) dapat membatalkan refresh token lama saat token baru diterbitkan untuk pengguna/aplikasi yang sama.

Gejala praktis:

- Anda masuk melalui OpenClaw _dan_ melalui Claude Code / Codex CLI → salah satunya tiba-tiba “keluar” nanti

Untuk mengurangi hal itu, OpenClaw memperlakukan `auth-profiles.json` sebagai **penampung token**:

- runtime membaca kredensial dari **satu tempat**
- kami dapat menyimpan beberapa profil dan merutekannya secara deterministik
- penggunaan ulang CLI eksternal bersifat spesifik penyedia: Codex CLI dapat mem-bootstrap profil
  `openai-codex:default` yang kosong, tetapi setelah OpenClaw memiliki profil OAuth lokal,
  refresh token lokal menjadi kanonis; integrasi lain dapat tetap
  dikelola secara eksternal dan membaca ulang penyimpanan auth CLI mereka
- jalur status dan startup yang sudah mengetahui cakupan set penyedia yang dikonfigurasi
  membatasi penemuan CLI eksternal ke set tersebut, sehingga penyimpanan login CLI yang tidak terkait
  tidak diperiksa untuk setup satu penyedia

## Penyimpanan (tempat token berada)

Rahasia disimpan di penyimpanan auth agen:

- Profil auth (OAuth + kunci API + ref tingkat nilai opsional): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Berkas kompatibilitas lama: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entri `api_key` statis dibersihkan saat ditemukan)

Berkas lama khusus impor (masih didukung, tetapi bukan penyimpanan utama):

- `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` pada penggunaan pertama)

Semua hal di atas juga menghormati `$OPENCLAW_STATE_DIR` (penggantian direktori status). Referensi lengkap: [/gateway/configuration](/id/gateway/configuration-reference#auth-storage)

Untuk ref rahasia statis dan perilaku aktivasi snapshot runtime, lihat [Manajemen Rahasia](/id/gateway/secrets).

Saat agen sekunder tidak memiliki profil auth lokal, OpenClaw menggunakan pewarisan
read-through dari penyimpanan agen default/utama. Ini tidak mengkloning
`auth-profiles.json` agen utama saat membaca. OAuth refresh token sangat
sensitif: alur penyalinan normal melewatinya secara default karena beberapa penyedia memutar
atau membatalkan refresh token setelah digunakan. Konfigurasikan login OAuth terpisah untuk sebuah
agen saat memerlukan akun independen.

## Kompatibilitas token lama Anthropic

<Warning>
Dokumentasi Claude Code publik Anthropic mengatakan penggunaan Claude Code langsung tetap berada dalam
batas langganan Claude, dan staf Anthropic memberi tahu kami bahwa penggunaan Claude
CLI bergaya OpenClaw diizinkan lagi. Karena itu, OpenClaw memperlakukan penggunaan ulang Claude CLI dan
penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic
menerbitkan kebijakan baru.

Untuk dokumentasi paket direct-Claude-Code Anthropic saat ini, lihat [Menggunakan Claude Code
dengan paket Pro atau Max Anda](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
dan [Menggunakan Claude Code dengan paket Team atau Enterprise
Anda](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jika Anda menginginkan opsi bergaya langganan lain di OpenClaw, lihat [OpenAI
Codex](/id/providers/openai), [Qwen Cloud Coding
Plan](/id/providers/qwen), [MiniMax Coding Plan](/id/providers/minimax),
dan [Z.AI / GLM Coding Plan](/id/providers/glm).
</Warning>

OpenClaw juga mengekspos setup-token Anthropic sebagai jalur autentikasi token yang didukung, tetapi sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` saat tersedia.

## Migrasi Anthropic Claude CLI

OpenClaw mendukung penggunaan ulang Anthropic Claude CLI lagi. Jika Anda sudah memiliki login
Claude lokal di host, onboarding/configure dapat menggunakannya kembali secara langsung.

## Pertukaran OAuth (cara kerja login)

Alur login interaktif OpenClaw diimplementasikan di `@mariozechner/pi-ai` dan dihubungkan ke wizard/perintah.

### setup-token Anthropic

Bentuk alur:

1. mulai setup-token Anthropic atau paste-token dari OpenClaw
2. OpenClaw menyimpan kredensial Anthropic yang dihasilkan dalam profil auth
3. pemilihan model tetap pada `anthropic/...`
4. profil auth Anthropic yang ada tetap tersedia untuk rollback/kontrol urutan

### OpenAI Codex (ChatGPT OAuth)

OAuth OpenAI Codex secara eksplisit didukung untuk digunakan di luar Codex CLI, termasuk alur kerja OpenClaw.

Bentuk alur (PKCE):

1. buat verifier/challenge PKCE + `state` acak
2. buka `https://auth.openai.com/oauth/authorize?...`
3. coba tangkap callback di `http://127.0.0.1:1455/auth/callback`
4. jika callback tidak dapat bind (atau Anda remote/headless), tempelkan URL/kode redirect
5. tukarkan di `https://auth.openai.com/oauth/token`
6. ekstrak `accountId` dari access token dan simpan `{ access, refresh, expires, accountId }`

Jalur wizard adalah `openclaw onboard` → pilihan auth `openai-codex`.

## Refresh + kedaluwarsa

Profil menyimpan timestamp `expires`.

Saat runtime:

- jika `expires` berada di masa depan → gunakan access token yang tersimpan
- jika kedaluwarsa → refresh (di bawah file lock) dan timpa kredensial yang tersimpan
- jika agen sekunder membaca profil OAuth agen utama yang diwarisi, refresh
  menulis kembali ke penyimpanan agen utama alih-alih menyalin refresh token ke
  penyimpanan agen sekunder
- pengecualian: beberapa kredensial CLI eksternal tetap dikelola secara eksternal; OpenClaw
  membaca ulang penyimpanan auth CLI tersebut alih-alih menggunakan refresh token yang disalin.
  Bootstrap Codex CLI sengaja lebih sempit: ini menanam profil
  `openai-codex:default` yang kosong, lalu refresh milik OpenClaw menjaga profil
  lokal tetap kanonis.

Alur refresh bersifat otomatis; umumnya Anda tidak perlu mengelola token secara manual.

## Beberapa akun (profil) + perutean

Dua pola:

### 1) Disarankan: agen terpisah

Jika Anda ingin “personal” dan “work” tidak pernah berinteraksi, gunakan agen terisolasi (sesi + kredensial + workspace terpisah):

```bash
openclaw agents add work
openclaw agents add personal
```

Lalu konfigurasikan auth per agen (wizard) dan rutekan chat ke agen yang tepat.

### 2) Lanjutan: beberapa profil dalam satu agen

`auth-profiles.json` mendukung beberapa ID profil untuk penyedia yang sama.

Pilih profil yang digunakan:

- secara global melalui urutan config (`auth.order`)
- per sesi melalui `/model ...@<profileId>`

Contoh (penggantian sesi):

- `/model Opus@anthropic:work`

Cara melihat ID profil yang ada:

- `openclaw channels list --json` (menampilkan `auth[]`)

Dokumentasi terkait:

- [Failover model](/id/concepts/model-failover) (aturan rotasi + cooldown)
- [Perintah slash](/id/tools/slash-commands) (permukaan perintah)

## Terkait

- [Autentikasi](/id/gateway/authentication) — ikhtisar auth penyedia model
- [Rahasia](/id/gateway/secrets) — penyimpanan kredensial dan SecretRef
- [Referensi Konfigurasi](/id/gateway/configuration-reference#auth-storage) — kunci config auth
