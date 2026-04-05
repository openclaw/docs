---
read_when:
    - Anda ingin memahami OAuth OpenClaw secara menyeluruh
    - Anda mengalami masalah token tidak valid / logout
    - Anda menginginkan alur autentikasi Claude CLI atau OAuth
    - Anda menginginkan beberapa akun atau perutean profil
summary: 'OAuth di OpenClaw: pertukaran token, penyimpanan, dan pola multi-akun'
title: OAuth
x-i18n:
    generated_at: "2026-04-05T13:52:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b364be2182fcf9082834450f39aecc0913c85fb03237eec1228a589d4851dcd
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw mendukung “subscription auth” melalui OAuth untuk provider yang menawarkannya
(khususnya **OpenAI Codex (ChatGPT OAuth)**). Untuk subscription Anthropic, penyiapan baru
harus menggunakan jalur login **Claude CLI** lokal di host gateway, tetapi
Anthropic membedakan antara penggunaan Claude Code langsung dan jalur penggunaan ulang
oleh OpenClaw. Dokumentasi publik Claude Code dari Anthropic menyatakan bahwa penggunaan Claude Code secara langsung tetap
berada dalam batas subscription Claude. Secara terpisah, Anthropic memberi tahu pengguna
OpenClaw pada **4 April 2026 pukul 12:00 PM PT / 8:00 PM BST** bahwa OpenClaw dihitung sebagai
harness pihak ketiga dan kini memerlukan **Extra Usage** untuk trafik tersebut.
OpenAI Codex OAuth secara eksplisit didukung untuk digunakan dalam alat eksternal seperti
OpenClaw. Halaman ini menjelaskan:

Untuk Anthropic di produksi, autentikasi API key adalah jalur yang lebih aman dan direkomendasikan.

- bagaimana **pertukaran token** OAuth bekerja (PKCE)
- tempat token **disimpan** (dan alasannya)
- cara menangani **beberapa akun** (profil + override per sesi)

OpenClaw juga mendukung **plugin provider** yang menyertakan alur OAuth atau API‑key
mereka sendiri. Jalankan melalui:

```bash
openclaw models auth login --provider <id>
```

## Token sink (mengapa ini ada)

Provider OAuth umumnya menerbitkan **refresh token baru** selama alur login/refresh. Beberapa provider (atau klien OAuth) dapat membatalkan refresh token yang lebih lama ketika token baru diterbitkan untuk pengguna/aplikasi yang sama.

Gejala praktis:

- Anda login melalui OpenClaw _dan_ melalui Claude Code / Codex CLI → salah satunya nanti secara acak “logout”

Untuk mengurangi hal itu, OpenClaw memperlakukan `auth-profiles.json` sebagai **token sink**:

- runtime membaca kredensial dari **satu tempat**
- kita dapat menyimpan beberapa profil dan merutekannya secara deterministik
- ketika kredensial digunakan ulang dari CLI eksternal seperti Codex CLI, OpenClaw
  mencerminkannya dengan provenance dan membaca ulang sumber eksternal tersebut alih-alih
  memutar refresh tokennya sendiri

## Penyimpanan (tempat token berada)

Secret disimpan **per agen**:

- Profil auth (OAuth + API key + ref tingkat nilai opsional): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File kompatibilitas lama: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entri `api_key` statis dibersihkan saat ditemukan)

File lama khusus impor (masih didukung, tetapi bukan penyimpanan utama):

- `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat pertama kali digunakan)

Semua hal di atas juga menghormati `$OPENCLAW_STATE_DIR` (override state dir). Referensi lengkap: [/gateway/configuration](/gateway/configuration-reference#auth-storage)

Untuk ref secret statis dan perilaku aktivasi snapshot runtime, lihat [Manajemen Secret](/gateway/secrets).

## Kompatibilitas token lama Anthropic

<Warning>
Dokumentasi publik Claude Code dari Anthropic menyatakan bahwa penggunaan Claude Code secara langsung tetap berada dalam
batas subscription Claude. Secara terpisah, Anthropic memberi tahu pengguna OpenClaw pada
**4 April 2026 pukul 12:00 PM PT / 8:00 PM BST** bahwa **OpenClaw dihitung sebagai
harness pihak ketiga**. Profil token Anthropic yang sudah ada tetap secara teknis
dapat digunakan di OpenClaw, tetapi Anthropic menyatakan bahwa jalur OpenClaw kini memerlukan **Extra
Usage** (bayar sesuai pemakaian yang ditagih terpisah dari subscription) untuk trafik tersebut.

Untuk dokumentasi paket direct-Claude-Code Anthropic saat ini, lihat [Menggunakan Claude Code
dengan paket Pro atau Max Anda](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
dan [Menggunakan Claude Code dengan paket Team atau Enterprise
Anda](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jika Anda menginginkan opsi bergaya subscription lain di OpenClaw, lihat [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding
Plan](/providers/qwen), [MiniMax Coding Plan](/providers/minimax),
dan [Z.AI / GLM Coding Plan](/providers/glm).
</Warning>

OpenClaw kini kembali mengekspos setup-token Anthropic sebagai jalur lama/manual.
Pemberitahuan penagihan khusus OpenClaw dari Anthropic tetap berlaku untuk jalur itu, jadi
gunakan dengan pemahaman bahwa Anthropic memerlukan **Extra Usage** untuk
trafik login Claude yang digerakkan oleh OpenClaw.

## Migrasi Anthropic Claude CLI

Jika Claude CLI sudah terinstal dan sudah login di host gateway, Anda dapat
mengalihkan pemilihan model Anthropic ke backend CLI lokal. Ini adalah
jalur OpenClaw yang didukung saat Anda ingin menggunakan ulang login Claude CLI lokal di host yang
sama.

Prasyarat:

- biner `claude` terinstal di host gateway
- Claude CLI sudah diautentikasi di sana melalui `claude auth login`

Perintah migrasi:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Shortcut onboarding:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Ini mempertahankan profil auth Anthropic yang ada untuk rollback, tetapi menulis ulang jalur
model default utama dari `anthropic/...` menjadi `claude-cli/...`, menulis ulang fallback Anthropic Claude yang cocok, dan menambahkan entri allowlist `claude-cli/...`
yang sesuai di bawah `agents.defaults.models`.

Verifikasi:

```bash
openclaw models status
```

## Pertukaran OAuth (cara login bekerja)

Alur login interaktif OpenClaw diimplementasikan dalam `@mariozechner/pi-ai` dan dihubungkan ke wizard/perintah.

### Anthropic Claude CLI

Bentuk alur:

Jalur Claude CLI:

1. login dengan `claude auth login` di host gateway
2. jalankan `openclaw models auth login --provider anthropic --method cli --set-default`
3. jangan simpan profil auth baru; alihkan pemilihan model ke `claude-cli/...`
4. pertahankan profil auth Anthropic yang ada untuk rollback

Dokumentasi publik Claude Code dari Anthropic menjelaskan alur login subscription Claude langsung
ini untuk `claude` itu sendiri. OpenClaw dapat menggunakan ulang login lokal itu, tetapi
Anthropic secara terpisah mengklasifikasikan jalur yang dikendalikan OpenClaw sebagai penggunaan harness pihak ketiga untuk tujuan penagihan.

Jalur asisten interaktif:

- `openclaw onboard` / `openclaw configure` → pilihan auth `anthropic-cli`

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth secara eksplisit didukung untuk penggunaan di luar Codex CLI, termasuk alur kerja OpenClaw.

Bentuk alur (PKCE):

1. hasilkan verifier/challenge PKCE + `state` acak
2. buka `https://auth.openai.com/oauth/authorize?...`
3. coba tangkap callback di `http://127.0.0.1:1455/auth/callback`
4. jika callback tidak bisa bind (atau Anda remote/headless), tempel URL/kode redirect
5. tukarkan di `https://auth.openai.com/oauth/token`
6. ekstrak `accountId` dari access token dan simpan `{ access, refresh, expires, accountId }`

Jalur wizard adalah `openclaw onboard` → pilihan auth `openai-codex`.

## Refresh + kedaluwarsa

Profil menyimpan stempel waktu `expires`.

Pada runtime:

- jika `expires` ada di masa depan → gunakan access token yang tersimpan
- jika kedaluwarsa → refresh (di bawah file lock) dan timpa kredensial yang tersimpan
- pengecualian: kredensial CLI eksternal yang digunakan ulang tetap dikelola secara eksternal; OpenClaw
  membaca ulang penyimpanan auth CLI dan tidak pernah memakai refresh token hasil salinan itu sendiri

Alur refresh berlangsung otomatis; secara umum Anda tidak perlu mengelola token secara manual.

## Beberapa akun (profil) + perutean

Dua pola:

### 1) Disarankan: agen terpisah

Jika Anda ingin “pribadi” dan “kantor” tidak pernah berinteraksi, gunakan agen yang terisolasi (sesi + kredensial + workspace terpisah):

```bash
openclaw agents add work
openclaw agents add personal
```

Lalu konfigurasikan auth per agen (wizard) dan rutekan chat ke agen yang tepat.

### 2) Lanjutan: beberapa profil dalam satu agen

`auth-profiles.json` mendukung beberapa ID profil untuk provider yang sama.

Pilih profil yang digunakan:

- secara global melalui urutan konfigurasi (`auth.order`)
- per sesi melalui `/model ...@<profileId>`

Contoh (override sesi):

- `/model Opus@anthropic:work`

Cara melihat ID profil yang ada:

- `openclaw channels list --json` (menampilkan `auth[]`)

Dokumentasi terkait:

- [/concepts/model-failover](/concepts/model-failover) (aturan rotasi + cooldown)
- [/tools/slash-commands](/tools/slash-commands) (permukaan perintah)

## Terkait

- [Autentikasi](/gateway/authentication) — ringkasan auth provider model
- [Secrets](/gateway/secrets) — penyimpanan kredensial dan SecretRef
- [Referensi Konfigurasi](/gateway/configuration-reference#auth-storage) — kunci konfigurasi auth
