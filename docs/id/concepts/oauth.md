---
read_when:
    - Anda ingin memahami OAuth OpenClaw dari ujung ke ujung
    - Anda mengalami masalah invalidasi token / keluar dari sesi
    - Anda ingin alur autentikasi Claude CLI atau OAuth
    - Anda ingin beberapa akun atau perutean profil
summary: 'OAuth di OpenClaw: pertukaran token, penyimpanan, dan pola multi-akun'
title: OAuth
x-i18n:
    generated_at: "2026-05-06T09:08:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 223480a24bd30f92f5d9fdc35e937e582f9e81f5bee2fb0e5c0ea445ac552a40
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw mendukung "autentikasi langganan" melalui OAuth untuk penyedia yang menawarkannya
(terutama **OpenAI Codex (ChatGPT OAuth)**). Untuk Anthropic, pembagian praktisnya
sekarang adalah:

- **Kunci API Anthropic**: penagihan API Anthropic normal
- **Anthropic Claude CLI / autentikasi langganan di dalam OpenClaw**: staf Anthropic
  memberi tahu kami bahwa penggunaan ini diizinkan lagi

OAuth OpenAI Codex secara eksplisit didukung untuk digunakan di alat eksternal seperti
OpenClaw. Halaman ini menjelaskan:

Untuk Anthropic di produksi, autentikasi kunci API adalah jalur yang lebih aman dan direkomendasikan.

- cara kerja **pertukaran token** OAuth (PKCE)
- tempat token **disimpan** (dan alasannya)
- cara menangani **beberapa akun** (profil + penggantian per sesi)

OpenClaw juga mendukung **Plugin penyedia** yang membawa alur OAuth atau kunci API
mereka sendiri. Jalankan melalui:

```bash
openclaw models auth login --provider <id>
```

## Penampung token (alasan keberadaannya)

Penyedia OAuth umumnya membuat **token refresh baru** selama alur masuk/refresh. Beberapa penyedia (atau klien OAuth) dapat membatalkan token refresh lama saat token baru diterbitkan untuk pengguna/aplikasi yang sama.

Gejala praktis:

- Anda masuk melalui OpenClaw _dan_ melalui Claude Code / Codex CLI → salah satunya nanti secara acak menjadi "keluar"

Untuk menguranginya, OpenClaw memperlakukan `auth-profiles.json` sebagai **penampung token**:

- runtime membaca kredensial dari **satu tempat**
- kami dapat menyimpan beberapa profil dan merutekannya secara deterministik
- penggunaan ulang CLI eksternal bersifat spesifik penyedia: Codex CLI dapat mem-bootstrap profil
  `openai-codex:default` kosong, tetapi setelah OpenClaw memiliki profil OAuth lokal,
  token refresh lokal menjadi kanonis; integrasi lain dapat tetap
  dikelola secara eksternal dan membaca ulang penyimpanan autentikasi CLI mereka
- jalur status dan startup yang sudah mengetahui cakupan set penyedia yang dikonfigurasi
  membatasi penemuan CLI eksternal ke set tersebut, sehingga penyimpanan login CLI yang tidak terkait
  tidak diperiksa untuk setup satu penyedia

## Penyimpanan (tempat token berada)

Rahasia disimpan di penyimpanan autentikasi agen:

- Profil autentikasi (OAuth + kunci API + ref tingkat nilai opsional): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Berkas kompatibilitas lama: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entri `api_key` statis dibersihkan saat ditemukan)

Berkas lama khusus impor (masih didukung, tetapi bukan penyimpanan utama):

- `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat pertama kali digunakan)

Semua yang disebutkan di atas juga menghormati `$OPENCLAW_STATE_DIR` (penggantian direktori state). Referensi lengkap: [/gateway/configuration](/id/gateway/configuration-reference#auth-storage)

Untuk ref rahasia statis dan perilaku aktivasi snapshot runtime, lihat [Manajemen Rahasia](/id/gateway/secrets).

Saat agen sekunder tidak memiliki profil autentikasi lokal, OpenClaw menggunakan pewarisan
baca-tembus dari penyimpanan agen default/utama. OpenClaw tidak mengkloning
`auth-profiles.json` milik agen utama saat membaca. Token refresh OAuth sangat
sensitif: alur penyalinan normal melewatinya secara default karena beberapa penyedia merotasi
atau membatalkan token refresh setelah digunakan. Konfigurasikan login OAuth terpisah untuk
agen ketika agen tersebut membutuhkan akun independen.

## Kompatibilitas token lama Anthropic

<Warning>
Dokumentasi publik Claude Code dari Anthropic menyatakan bahwa penggunaan langsung Claude Code tetap berada dalam
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

OpenClaw kembali mendukung penggunaan ulang Anthropic Claude CLI. Jika Anda sudah memiliki login
Claude lokal di host, onboarding/konfigurasi dapat menggunakannya ulang secara langsung.

## Pertukaran OAuth (cara kerja login)

Alur login interaktif OpenClaw diimplementasikan di `@mariozechner/pi-ai` dan dihubungkan ke wizard/perintah.

### setup-token Anthropic

Bentuk alur:

1. mulai setup-token Anthropic atau paste-token dari OpenClaw
2. OpenClaw menyimpan kredensial Anthropic yang dihasilkan dalam profil autentikasi
3. pemilihan model tetap di `anthropic/...`
4. profil autentikasi Anthropic yang sudah ada tetap tersedia untuk rollback/kontrol urutan

### OpenAI Codex (ChatGPT OAuth)

OAuth OpenAI Codex secara eksplisit didukung untuk digunakan di luar Codex CLI, termasuk alur kerja OpenClaw.

Bentuk alur (PKCE):

1. hasilkan verifier/challenge PKCE + `state` acak
2. buka `https://auth.openai.com/oauth/authorize?...`
3. coba tangkap callback di `http://127.0.0.1:1455/auth/callback`
4. jika callback tidak dapat di-bind (atau Anda berada di remote/headless), tempel URL/kode redirect
5. lakukan pertukaran di `https://auth.openai.com/oauth/token`
6. ekstrak `accountId` dari token akses dan simpan `{ access, refresh, expires, accountId }`

Jalur wizard adalah `openclaw onboard` → pilihan autentikasi `openai-codex`.

## Refresh + kedaluwarsa

Profil menyimpan timestamp `expires`.

Saat runtime:

- jika `expires` berada di masa depan → gunakan token akses yang disimpan
- jika kedaluwarsa → refresh (di bawah file lock) dan timpa kredensial yang disimpan
- jika agen sekunder membaca profil OAuth agen utama yang diwarisi, refresh
  menulis kembali ke penyimpanan agen utama, bukan menyalin token refresh ke
  penyimpanan agen sekunder
- pengecualian: beberapa kredensial CLI eksternal tetap dikelola secara eksternal; OpenClaw
  membaca ulang penyimpanan autentikasi CLI tersebut alih-alih menghabiskan token refresh yang disalin.
  Bootstrap Codex CLI sengaja lebih sempit: ia menanam profil
  `openai-codex:default` kosong, lalu refresh milik OpenClaw menjaga profil lokal
  tetap kanonis.

Alur refresh bersifat otomatis; umumnya Anda tidak perlu mengelola token secara manual.

## Beberapa akun (profil) + perutean

Dua pola:

### 1) Disarankan: agen terpisah

Jika Anda ingin "pribadi" dan "kerja" tidak pernah berinteraksi, gunakan agen terisolasi (sesi + kredensial + workspace terpisah):

```bash
openclaw agents add work
openclaw agents add personal
```

Lalu konfigurasikan autentikasi per agen (wizard) dan rutekan chat ke agen yang tepat.

### 2) Lanjutan: beberapa profil dalam satu agen

`auth-profiles.json` mendukung beberapa ID profil untuk penyedia yang sama.

Pilih profil mana yang digunakan:

- secara global melalui urutan konfigurasi (`auth.order`)
- per sesi melalui `/model ...@<profileId>`

Contoh (penggantian sesi):

- `/model Opus@anthropic:work`

Cara melihat ID profil yang tersedia:

- `openclaw channels list --json` (menampilkan `auth[]`)

Dokumentasi terkait:

- [Failover model](/id/concepts/model-failover) (aturan rotasi + cooldown)
- [Perintah slash](/id/tools/slash-commands) (permukaan perintah)

## Terkait

- [Autentikasi](/id/gateway/authentication) - ikhtisar autentikasi penyedia model
- [Rahasia](/id/gateway/secrets) - penyimpanan kredensial dan SecretRef
- [Referensi Konfigurasi](/id/gateway/configuration-reference#auth-storage) - kunci konfigurasi autentikasi
