---
read_when:
    - Anda ingin memahami OAuth OpenClaw secara menyeluruh
    - Anda mengalami masalah invalidasi token / keluar
    - Anda menginginkan alur autentikasi Claude CLI atau OAuth
    - Anda menginginkan beberapa akun atau perutean profil
summary: 'OAuth di OpenClaw: pertukaran token, penyimpanan, dan pola multi-akun'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:50:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw mendukung "auth langganan" melalui OAuth untuk penyedia yang menawarkannya
(terutama **OpenAI Codex (ChatGPT OAuth)**). Untuk Anthropic, pembagian praktis
sekarang adalah:

- **Kunci API Anthropic**: penagihan API Anthropic normal
- **Anthropic Claude CLI / auth langganan di dalam OpenClaw**: staf Anthropic
  memberi tahu kami bahwa penggunaan ini diizinkan lagi

OAuth OpenAI Codex secara eksplisit didukung untuk digunakan di alat eksternal seperti
OpenClaw.

OpenClaw menyimpan auth kunci API OpenAI dan OAuth ChatGPT/Codex di bawah
id penyedia kanonis `openai`. Id profil `openai-codex:*` yang lebih lama dan
entri `auth.order.openai-codex` adalah state lama yang diperbaiki oleh
`openclaw doctor --fix`; gunakan id profil `openai:*` dan `auth.order.openai` untuk
konfigurasi baru.

Untuk Anthropic di produksi, auth kunci API adalah jalur rekomendasi yang lebih aman.

Halaman ini menjelaskan:

- cara kerja **pertukaran token** OAuth (PKCE)
- tempat token **disimpan** (dan alasannya)
- cara menangani **beberapa akun** (profil + override per sesi)

OpenClaw juga mendukung **Plugin penyedia** yang mengirimkan alur OAuth atau kunci API
mereka sendiri. Jalankan melalui:

```bash
openclaw models auth login --provider <id>
```

## Penampung token (mengapa ini ada)

Penyedia OAuth biasanya membuat **token refresh baru** selama alur login/refresh. Beberapa penyedia (atau klien OAuth) dapat membatalkan token refresh yang lebih lama saat token baru diterbitkan untuk pengguna/aplikasi yang sama.

Gejala praktis:

- Anda login melalui OpenClaw _dan_ melalui Claude Code / Codex CLI → salah satunya nanti secara acak menjadi "logout"

Untuk mengurangi hal itu, OpenClaw memperlakukan `auth-profiles.json` sebagai **penampung token**:

- runtime membaca kredensial dari **satu tempat**
- kami dapat menyimpan beberapa profil dan merutekannya secara deterministik
- penggunaan ulang CLI eksternal bersifat spesifik penyedia: Codex CLI dapat mem-bootstrap profil
  `openai:default` yang kosong, tetapi setelah OpenClaw memiliki profil OAuth lokal,
  token refresh lokal menjadi kanonis. Jika token refresh lokal itu ditolak,
  OpenClaw melaporkan profil terkelola untuk auth ulang alih-alih menggunakan
  material token Codex CLI sebagai fallback runtime sejajar. Integrasi lain dapat
  tetap dikelola secara eksternal dan membaca ulang penyimpanan auth CLI mereka
- jalur status dan startup yang sudah mengetahui cakupan set penyedia yang dikonfigurasi
  membatasi penemuan CLI eksternal ke set tersebut, sehingga penyimpanan login CLI
  yang tidak terkait tidak diprobing untuk setup penyedia tunggal

## Penyimpanan (tempat token berada)

Rahasia disimpan di penyimpanan auth agen:

- Profil auth (OAuth + kunci API + ref tingkat nilai opsional): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File kompatibilitas lama: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entri `api_key` statis dihapus saat ditemukan)

File hanya impor lama (masih didukung, tetapi bukan penyimpanan utama):

- `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat pertama kali digunakan)

Semua yang di atas juga menghormati `$OPENCLAW_STATE_DIR` (override direktori state). Referensi lengkap: [/gateway/configuration](/id/gateway/configuration-reference#auth-storage)

Untuk ref rahasia statis dan perilaku aktivasi snapshot runtime, lihat [Manajemen Rahasia](/id/gateway/secrets).

Saat agen sekunder tidak memiliki profil auth lokal, OpenClaw menggunakan pewarisan
read-through dari penyimpanan agen default/utama. OpenClaw tidak mengkloning
`auth-profiles.json` milik agen utama saat membaca. Token refresh OAuth sangat
sensitif: alur penyalinan normal melewatinya secara default karena beberapa penyedia merotasi
atau membatalkan token refresh setelah digunakan. Konfigurasikan login OAuth terpisah untuk
agen saat agen tersebut membutuhkan akun independen.

## Kompatibilitas token lama Anthropic

<Warning>
Dokumentasi publik Claude Code milik Anthropic mengatakan penggunaan Claude Code langsung tetap berada dalam
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

OpenClaw juga mengekspos setup-token Anthropic sebagai jalur token-auth yang didukung, tetapi sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` saat tersedia.

## Migrasi Anthropic Claude CLI

OpenClaw mendukung kembali penggunaan ulang Anthropic Claude CLI. Jika Anda sudah memiliki login
Claude lokal di host, onboarding/konfigurasi dapat menggunakannya ulang secara langsung.

## Pertukaran OAuth (cara kerja login)

Alur login interaktif OpenClaw diimplementasikan di `openclaw/plugin-sdk/llm` dan dihubungkan ke wizard/perintah.

### setup-token Anthropic

Bentuk alur:

1. mulai setup-token Anthropic atau paste-token dari OpenClaw
2. OpenClaw menyimpan kredensial Anthropic yang dihasilkan dalam profil auth
3. pemilihan model tetap pada `anthropic/...`
4. profil auth Anthropic yang ada tetap tersedia untuk kontrol rollback/urutan

### OpenAI Codex (ChatGPT OAuth)

OAuth OpenAI Codex secara eksplisit didukung untuk digunakan di luar Codex CLI, termasuk alur kerja OpenClaw.

Perintah login tetap menggunakan id penyedia OpenAI kanonis:

```bash
openclaw models auth login --provider openai
```

Gunakan `--profile-id openai:<name>` untuk beberapa akun OAuth ChatGPT/Codex dalam
satu agen. Jangan gunakan `openai-codex:<name>` untuk profil baru. Doctor memigrasikan
prefiks lama itu ke id profil `openai:*` yang bebas bentrok; jalankan
`openclaw models auth list --provider openai` setelah perbaikan sebelum menyalin
id profil ke `auth.order` atau `/model ...@<profileId>`.

Bentuk alur (PKCE):

1. buat verifier/challenge PKCE + `state` acak
2. buka `https://auth.openai.com/oauth/authorize?...`
3. coba tangkap callback di `http://127.0.0.1:1455/auth/callback`
4. jika callback tidak dapat bind (atau Anda remote/headless), tempel URL/kode redirect
5. lakukan pertukaran di `https://auth.openai.com/oauth/token`
6. ekstrak `accountId` dari token akses dan simpan `{ access, refresh, expires, accountId }`

Jalur wizard adalah `openclaw onboard` → pilihan auth `openai`.

## Refresh + kedaluwarsa

Profil menyimpan timestamp `expires`.

Saat runtime:

- jika `expires` berada di masa depan → gunakan token akses yang disimpan
- jika kedaluwarsa → refresh (di bawah file lock) dan timpa kredensial yang disimpan
- jika agen sekunder membaca profil OAuth agen utama yang diwarisi, refresh
  menulis kembali ke penyimpanan agen utama alih-alih menyalin token refresh ke
  penyimpanan agen sekunder
- pengecualian: beberapa kredensial CLI eksternal tetap dikelola secara eksternal; OpenClaw
  membaca ulang penyimpanan auth CLI tersebut alih-alih menghabiskan token refresh yang disalin.
  Bootstrap Codex CLI sengaja lebih sempit: ia hanya dapat mengisi `openai:default` yang kosong
  atau profil OpenAI yang diminta secara eksplisit sebelum OpenClaw
  memiliki OAuth untuk penyedia tersebut. Setelah itu, refresh milik OpenClaw menjaga profil
  lokal tetap kanonis dan penemuan tidak menambahkan auth Codex CLI di slot sejajar mana pun.
  Jika refresh terkelola gagal, OpenClaw melaporkan profil yang terdampak untuk
  auth ulang alih-alih mengembalikan material token CLI eksternal.

Alur refresh otomatis; biasanya Anda tidak perlu mengelola token secara manual.

## Beberapa akun (profil) + perutean

Dua pola:

### 1) Direkomendasikan: agen terpisah

Jika Anda ingin "pribadi" dan "kerja" tidak pernah berinteraksi, gunakan agen terisolasi (sesi + kredensial + workspace terpisah):

```bash
openclaw agents add work
openclaw agents add personal
```

Lalu konfigurasikan auth per agen (wizard) dan rutekan chat ke agen yang tepat.

### 2) Lanjutan: beberapa profil dalam satu agen

`auth-profiles.json` mendukung beberapa ID profil untuk penyedia yang sama.

Pilih profil mana yang digunakan:

- secara global melalui pengurutan konfigurasi (`auth.order`)
- per sesi melalui `/model ...@<profileId>`

Contoh (override sesi):

- `/model Opus@anthropic:work`

Cara melihat ID profil yang ada:

- `openclaw channels list --json` (menampilkan `auth[]`)

Dokumentasi terkait:

- [Failover model](/id/concepts/model-failover) (aturan rotasi + cooldown)
- [Perintah slash](/id/tools/slash-commands) (permukaan perintah)

## Terkait

- [Autentikasi](/id/gateway/authentication) - ringkasan auth penyedia model
- [Rahasia](/id/gateway/secrets) - penyimpanan kredensial dan SecretRef
- [Referensi Konfigurasi](/id/gateway/configuration-reference#auth-storage) - kunci konfigurasi auth
