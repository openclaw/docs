---
read_when:
    - Anda ingin memahami OAuth OpenClaw dari ujung ke ujung
    - Anda mengalami masalah invalidasi token / logout
    - Anda menginginkan alur autentikasi Claude CLI atau OAuth
    - Anda menginginkan beberapa akun atau perutean profil
summary: 'OAuth di OpenClaw: pertukaran token, penyimpanan, dan pola multi-akun'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T09:04:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw mendukung “autentikasi langganan” melalui OAuth untuk provider yang menawarkannya
(terutama **OpenAI Codex (ChatGPT OAuth)**). Untuk Anthropic, pembagian praktisnya
sekarang adalah:

- **Kunci API Anthropic**: billing API Anthropic normal
- **Autentikasi langganan / Claude CLI Anthropic di dalam OpenClaw**: staf Anthropic
  memberi tahu kami bahwa penggunaan ini diizinkan lagi

OpenAI Codex OAuth secara eksplisit didukung untuk digunakan dalam alat eksternal seperti
OpenClaw. Halaman ini menjelaskan:

Untuk Anthropic di produksi, autentikasi kunci API adalah jalur yang lebih aman dan direkomendasikan.

- bagaimana **pertukaran token** OAuth bekerja (PKCE)
- di mana token **disimpan** (dan alasannya)
- cara menangani **beberapa akun** (profil + override per sesi)

OpenClaw juga mendukung **plugin provider** yang menyertakan alur OAuth atau API-key
mereka sendiri. Jalankan melalui:

```bash
openclaw models auth login --provider <id>
```

## Token sink (mengapa ini ada)

Provider OAuth umumnya menerbitkan **refresh token baru** selama alur login/refresh. Beberapa provider (atau klien OAuth) dapat membuat refresh token lama tidak valid saat yang baru diterbitkan untuk pengguna/aplikasi yang sama.

Gejala praktis:

- Anda login melalui OpenClaw _dan_ melalui Claude Code / Codex CLI → salah satunya nanti secara acak menjadi “logout”

Untuk mengurangi hal tersebut, OpenClaw memperlakukan `auth-profiles.json` sebagai **token sink**:

- runtime membaca kredensial dari **satu tempat**
- kita dapat menyimpan beberapa profil dan merutekannya secara deterministik
- ketika kredensial digunakan kembali dari CLI eksternal seperti Codex CLI, OpenClaw
  mencerminkannya dengan provenance dan membaca ulang sumber eksternal tersebut alih-alih
  merotasi refresh token sendiri

## Penyimpanan (tempat token berada)

Secret disimpan **per-agen**:

- Profil auth (OAuth + API key + ref tingkat nilai opsional): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File kompatibilitas lama: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entri `api_key` statis dibersihkan saat ditemukan)

File lama khusus impor (masih didukung, tetapi bukan penyimpanan utama):

- `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` pada penggunaan pertama)

Semua yang di atas juga menghormati `$OPENCLAW_STATE_DIR` (override direktori status). Referensi lengkap: [/gateway/configuration](/id/gateway/configuration-reference#auth-storage)

Untuk ref secret statis dan perilaku aktivasi snapshot runtime, lihat [Manajemen Secret](/id/gateway/secrets).

## Kompatibilitas token lama Anthropic

<Warning>
Dokumen publik Claude Code Anthropic mengatakan penggunaan Claude Code langsung tetap berada dalam
batas langganan Claude, dan staf Anthropic memberi tahu kami bahwa penggunaan Claude
CLI bergaya OpenClaw diizinkan lagi. Karena itu, OpenClaw memperlakukan penggunaan ulang Claude CLI dan
penggunaan `claude -p` sebagai hal yang disetujui untuk integrasi ini kecuali Anthropic
menerbitkan kebijakan baru.

Untuk dokumen paket Claude Code langsung Anthropic saat ini, lihat [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
dan [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jika Anda menginginkan opsi bergaya langganan lain di OpenClaw, lihat [OpenAI
Codex](/id/providers/openai), [Qwen Cloud Coding
Plan](/id/providers/qwen), [MiniMax Coding Plan](/id/providers/minimax),
dan [Z.AI / GLM Coding Plan](/id/providers/glm).
</Warning>

OpenClaw juga mengekspos setup-token Anthropic sebagai jalur autentikasi token yang didukung, tetapi sekarang lebih mengutamakan penggunaan ulang Claude CLI dan `claude -p` saat tersedia.

## Migrasi Anthropic Claude CLI

OpenClaw kembali mendukung penggunaan ulang Anthropic Claude CLI. Jika Anda sudah memiliki
login Claude lokal di host, onboarding/configure dapat langsung menggunakannya kembali.

## Pertukaran OAuth (cara kerja login)

Alur login interaktif OpenClaw diimplementasikan di `@mariozechner/pi-ai` dan dihubungkan ke wizard/perintah.

### Setup-token Anthropic

Bentuk alur:

1. mulai setup-token Anthropic atau paste-token dari OpenClaw
2. OpenClaw menyimpan kredensial Anthropic yang dihasilkan dalam profil auth
3. pemilihan model tetap pada `anthropic/...`
4. profil auth Anthropic yang ada tetap tersedia untuk rollback/kontrol urutan

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth secara eksplisit didukung untuk penggunaan di luar Codex CLI, termasuk alur kerja OpenClaw.

Bentuk alur (PKCE):

1. hasilkan verifier/challenge PKCE + `state` acak
2. buka `https://auth.openai.com/oauth/authorize?...`
3. coba tangkap callback di `http://127.0.0.1:1455/auth/callback`
4. jika callback tidak bisa bind (atau Anda remote/headless), tempel URL/kode redirect
5. tukar di `https://auth.openai.com/oauth/token`
6. ekstrak `accountId` dari access token dan simpan `{ access, refresh, expires, accountId }`

Jalur wizard adalah `openclaw onboard` → pilihan auth `openai-codex`.

## Refresh + kedaluwarsa

Profil menyimpan stempel waktu `expires`.

Saat runtime:

- jika `expires` berada di masa depan → gunakan access token yang tersimpan
- jika kedaluwarsa → refresh (di bawah file lock) dan timpa kredensial yang tersimpan
- pengecualian: kredensial CLI eksternal yang digunakan ulang tetap dikelola secara eksternal; OpenClaw
  membaca ulang penyimpanan auth CLI dan tidak pernah menggunakan refresh token salinan itu sendiri

Alur refresh bersifat otomatis; Anda umumnya tidak perlu mengelola token secara manual.

## Beberapa akun (profil) + perutean

Dua pola:

### 1) Disarankan: agen terpisah

Jika Anda ingin “pribadi” dan “kerja” tidak pernah berinteraksi, gunakan agen terisolasi (sesi + kredensial + workspace terpisah):

```bash
openclaw agents add work
openclaw agents add personal
```

Lalu konfigurasikan auth per-agen (wizard) dan rutekan chat ke agen yang tepat.

### 2) Lanjutan: beberapa profil dalam satu agen

`auth-profiles.json` mendukung beberapa ID profil untuk provider yang sama.

Pilih profil yang digunakan:

- secara global melalui urutan config (`auth.order`)
- per sesi melalui `/model ...@<profileId>`

Contoh (override sesi):

- `/model Opus@anthropic:work`

Cara melihat ID profil yang ada:

- `openclaw channels list --json` (menampilkan `auth[]`)

Dokumen terkait:

- [/concepts/model-failover](/id/concepts/model-failover) (aturan rotasi + cooldown)
- [/tools/slash-commands](/id/tools/slash-commands) (permukaan perintah)

## Terkait

- [Autentikasi](/id/gateway/authentication) — ikhtisar autentikasi provider model
- [Secrets](/id/gateway/secrets) — penyimpanan kredensial dan SecretRef
- [Referensi Konfigurasi](/id/gateway/configuration-reference#auth-storage) — kunci config auth
