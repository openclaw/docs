---
read_when:
    - Anda ingin memahami OAuth OpenClaw dari awal hingga akhir
    - Anda mengalami masalah invalidasi token / logout
    - Anda menginginkan alur autentikasi Claude CLI atau OAuth
    - Anda menginginkan beberapa akun atau perutean profil
summary: 'OAuth di OpenClaw: pola pertukaran token, penyimpanan, dan multi-akun'
title: OAuth
x-i18n:
    generated_at: "2026-06-27T17:25:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw mendukung "auth berlangganan" melalui OAuth untuk penyedia yang menawarkannya
(terutama **OpenAI Codex (ChatGPT OAuth)**). Untuk Anthropic, pemisahan praktisnya
sekarang adalah:

- **Kunci API Anthropic**: penagihan API Anthropic normal
- **Anthropic Claude CLI / auth berlangganan di dalam OpenClaw**: staf Anthropic
  memberi tahu kami bahwa penggunaan ini diizinkan lagi

OpenAI Codex OAuth didukung secara eksplisit untuk digunakan di alat eksternal seperti
OpenClaw.

OpenClaw menyimpan auth kunci API OpenAI dan ChatGPT/Codex OAuth di bawah
id penyedia kanonis `openai`. Id profil `openai-codex:*` lama dan entri
`auth.order.openai-codex` adalah status legacy yang diperbaiki oleh
`openclaw doctor --fix`; gunakan id profil `openai:*` dan `auth.order.openai` untuk
konfigurasi baru.

Untuk Anthropic di produksi, auth kunci API adalah jalur yang lebih aman dan direkomendasikan.

Halaman ini menjelaskan:

- cara kerja **pertukaran token** OAuth (PKCE)
- tempat token **disimpan** (dan alasannya)
- cara menangani **beberapa akun** (profil + override per-sesi)

OpenClaw juga mendukung **Plugin penyedia** yang mengirimkan alur OAuth atau kunci API
miliknya sendiri. Jalankan melalui:

```bash
openclaw models auth login --provider <id>
```

## Token sink (mengapa ini ada)

Penyedia OAuth umumnya menerbitkan **refresh token baru** selama alur login/refresh. Beberapa penyedia (atau klien OAuth) dapat membatalkan refresh token lama ketika token baru diterbitkan untuk pengguna/aplikasi yang sama.

Gejala praktis:

- Anda login melalui OpenClaw _dan_ melalui Claude Code / Codex CLI → salah satunya secara acak "ter-logout" nanti

Untuk mengurangi hal itu, OpenClaw memperlakukan `auth-profiles.json` sebagai **token sink**:

- runtime membaca kredensial dari **satu tempat**
- kita dapat menyimpan beberapa profil dan merutekannya secara deterministik
- penggunaan ulang CLI eksternal bersifat spesifik penyedia: Codex CLI dapat melakukan bootstrap profil
  `openai:default` kosong, tetapi setelah OpenClaw memiliki profil OAuth lokal,
  refresh token lokal menjadi kanonis. Jika refresh token lokal itu ditolak,
  OpenClaw dapat menggunakan token Codex CLI akun yang sama dan masih dapat digunakan sebagai fallback khusus runtime;
  integrasi lain dapat tetap dikelola secara eksternal dan membaca ulang
  penyimpanan auth CLI miliknya
- jalur status dan startup yang sudah mengetahui set penyedia yang dikonfigurasi membatasi
  penemuan CLI eksternal ke set tersebut, sehingga penyimpanan login CLI yang tidak terkait tidak
  diperiksa untuk setup satu penyedia

## Penyimpanan (tempat token berada)

Secret disimpan di penyimpanan auth agen:

- Profil auth (OAuth + kunci API + ref level-nilai opsional): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File kompatibilitas legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entri `api_key` statis dibersihkan saat ditemukan)

File legacy khusus impor (masih didukung, tetapi bukan penyimpanan utama):

- `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` pada penggunaan pertama)

Semua yang di atas juga menghormati `$OPENCLAW_STATE_DIR` (override direktori state). Referensi lengkap: [/gateway/configuration](/id/gateway/configuration-reference#auth-storage)

Untuk ref secret statis dan perilaku aktivasi snapshot runtime, lihat [Manajemen Secret](/id/gateway/secrets).

Ketika agen sekunder tidak memiliki profil auth lokal, OpenClaw menggunakan pewarisan read-through
dari penyimpanan agen default/utama. Ini tidak mengkloning `auth-profiles.json` milik agen utama
saat dibaca. Refresh token OAuth sangat sensitif: alur penyalinan normal melewatinya secara default
karena beberapa penyedia merotasi atau membatalkan refresh token setelah digunakan.
Konfigurasikan login OAuth terpisah untuk agen ketika agen tersebut memerlukan akun independen.

## Kompatibilitas token legacy Anthropic

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
dan [Z.AI / GLM Coding Plan](/id/providers/zai).
</Warning>

OpenClaw juga mengekspos setup-token Anthropic sebagai jalur auth token yang didukung, tetapi sekarang lebih memprioritaskan penggunaan ulang Claude CLI dan `claude -p` jika tersedia.

## Migrasi Anthropic Claude CLI

OpenClaw kembali mendukung penggunaan ulang Anthropic Claude CLI. Jika Anda sudah memiliki login
Claude lokal di host, onboarding/configure dapat menggunakannya ulang secara langsung.

## Pertukaran OAuth (cara login bekerja)

Alur login interaktif OpenClaw diimplementasikan di `openclaw/plugin-sdk/llm` dan dihubungkan ke wizard/perintah.

### setup-token Anthropic

Bentuk alur:

1. mulai setup-token Anthropic atau paste-token dari OpenClaw
2. OpenClaw menyimpan kredensial Anthropic yang dihasilkan di profil auth
3. pemilihan model tetap di `anthropic/...`
4. profil auth Anthropic yang ada tetap tersedia untuk rollback/kontrol urutan

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth didukung secara eksplisit untuk digunakan di luar Codex CLI, termasuk alur kerja OpenClaw.

Perintah login tetap menggunakan id penyedia OpenAI kanonis:

```bash
openclaw models auth login --provider openai
```

Gunakan `--profile-id openai:<name>` untuk beberapa akun ChatGPT/Codex OAuth dalam
satu agen. Jangan gunakan `openai-codex:<name>` untuk profil baru. Doctor memigrasikan
prefiks lama itu ke id profil `openai:*` yang bebas bentrokan; jalankan
`openclaw models auth list --provider openai` setelah perbaikan sebelum menyalin
id profil ke `auth.order` atau `/model ...@<profileId>`.

Bentuk alur (PKCE):

1. buat verifier/challenge PKCE + `state` acak
2. buka `https://auth.openai.com/oauth/authorize?...`
3. coba tangkap callback di `http://127.0.0.1:1455/auth/callback`
4. jika callback tidak dapat bind (atau Anda remote/headless), tempel URL/kode redirect
5. lakukan pertukaran di `https://auth.openai.com/oauth/token`
6. ekstrak `accountId` dari access token dan simpan `{ access, refresh, expires, accountId }`

Jalur wizard adalah `openclaw onboard` → pilihan auth `openai`.

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
  `openai:default` kosong, lalu refresh milik OpenClaw menjaga profil lokal
  tetap kanonis. Jika refresh Codex lokal gagal dan Codex CLI memiliki
  token yang dapat digunakan untuk akun yang sama, OpenClaw dapat menggunakan token itu untuk permintaan
  runtime saat ini tanpa menulisnya kembali ke `auth-profiles.json`.

Alur refresh bersifat otomatis; secara umum Anda tidak perlu mengelola token secara manual.

## Beberapa akun (profil) + perutean

Dua pola:

### 1) Disarankan: agen terpisah

Jika Anda ingin "personal" dan "work" tidak pernah berinteraksi, gunakan agen terisolasi (sesi + kredensial + workspace terpisah):

```bash
openclaw agents add work
openclaw agents add personal
```

Lalu konfigurasikan auth per-agen (wizard) dan rutekan chat ke agen yang tepat.

### 2) Lanjutan: beberapa profil dalam satu agen

`auth-profiles.json` mendukung beberapa ID profil untuk penyedia yang sama.

Pilih profil yang digunakan:

- secara global melalui pengurutan konfigurasi (`auth.order`)
- per-sesi melalui `/model ...@<profileId>`

Contoh (override sesi):

- `/model Opus@anthropic:work`

Cara melihat ID profil yang ada:

- `openclaw channels list --json` (menampilkan `auth[]`)

Dokumentasi terkait:

- [Failover model](/id/concepts/model-failover) (aturan rotasi + cooldown)
- [Perintah slash](/id/tools/slash-commands) (permukaan perintah)

## Terkait

- [Autentikasi](/id/gateway/authentication) - ringkasan auth penyedia model
- [Secret](/id/gateway/secrets) - penyimpanan kredensial dan SecretRef
- [Referensi Konfigurasi](/id/gateway/configuration-reference#auth-storage) - kunci konfigurasi auth
