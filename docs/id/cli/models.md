---
read_when:
    - Anda ingin mengubah model default atau melihat status auth provider
    - Anda ingin memindai model/provider yang tersedia dan men-debug profil auth
summary: Referensi CLI untuk `openclaw models` (status/list/set/scan, alias, fallback, auth)
title: Model
x-i18n:
    generated_at: "2026-04-24T09:02:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Penemuan, pemindaian, dan konfigurasi model (model default, fallback, profil auth).

Terkait:

- Provider + model: [Model](/id/providers/models)
- Konsep pemilihan model + slash command `/models`: [Konsep model](/id/concepts/models)
- Penyiapan auth provider: [Memulai](/id/start/getting-started)

## Perintah umum

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` menampilkan default/fallback yang di-resolve beserta ringkasan auth.
Saat snapshot penggunaan provider tersedia, bagian status OAuth/API key mencakup
jendela penggunaan provider dan snapshot kuota.
Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, dan z.ai. Auth penggunaan berasal dari hook khusus provider
jika tersedia; jika tidak, OpenClaw akan fallback ke pencocokan kredensial
OAuth/API key dari profil auth, env, atau config.
Dalam output `--json`, `auth.providers` adalah ringkasan provider yang sadar env/config/store,
sedangkan `auth.oauth` hanya kesehatan profil auth-store.
Tambahkan `--probe` untuk menjalankan probe auth live terhadap setiap profil provider yang dikonfigurasi.
Probe adalah permintaan nyata (dapat menghabiskan token dan memicu rate limit).
Gunakan `--agent <id>` untuk memeriksa state model/auth agen yang dikonfigurasi. Jika dihilangkan,
perintah ini menggunakan `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` jika diatur, jika tidak maka
agen default yang dikonfigurasi.
Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.

Catatan:

- `models set <model-or-alias>` menerima `provider/model` atau alias.
- `models list` bersifat read-only: perintah ini membaca config, profil auth, state katalog
  yang ada, dan baris katalog milik provider, tetapi tidak menulis ulang
  `models.json`.
- `models list --all` menyertakan baris katalog statis milik provider bawaan bahkan
  saat Anda belum melakukan auth dengan provider tersebut. Baris itu tetap akan tampil
  sebagai tidak tersedia sampai auth yang cocok dikonfigurasi.
- `models list --provider <id>` memfilter berdasarkan id provider, seperti `moonshot` atau
  `openai-codex`. Perintah ini tidak menerima label tampilan dari pemilih provider interaktif,
  seperti `Moonshot AI`.
- Referensi model diurai dengan memisahkan pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan prefiks provider (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw akan me-resolve input sebagai alias terlebih dahulu, lalu
  sebagai kecocokan provider terkonfigurasi yang unik untuk id model yang persis sama, dan baru kemudian
  fallback ke provider default yang dikonfigurasi dengan peringatan deprecation.
  Jika provider itu tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
  akan fallback ke provider/model terkonfigurasi pertama alih-alih menampilkan
  default provider yang usang dan sudah dihapus.
- `models status` dapat menampilkan `marker(<value>)` dalam output auth untuk placeholder non-secret (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) alih-alih menyamarkannya sebagai secret.

### `models status`

Opsi:

- `--json`
- `--plain`
- `--check` (exit 1=kedaluwarsa/tidak ada, 2=akan kedaluwarsa)
- `--probe` (probe live terhadap profil auth yang dikonfigurasi)
- `--probe-provider <name>` (probe satu provider)
- `--probe-profile <id>` (ulangi atau id profil dipisahkan koma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agen yang dikonfigurasi; menimpa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Bucket status probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Kasus detail/alasan kode probe yang perlu diantisipasi:

- `excluded_by_auth_order`: profil yang tersimpan ada, tetapi `auth.order.<provider>`
  eksplisit menghilangkannya, sehingga probe melaporkan pengecualian itu alih-alih
  mencobanya.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil ada tetapi tidak memenuhi syarat/tidak dapat di-resolve.
- `no_model`: auth provider ada, tetapi OpenClaw tidak dapat me-resolve kandidat model
  yang bisa di-probe untuk provider tersebut.

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profil auth

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` adalah helper auth interaktif. Perintah ini dapat meluncurkan alur auth provider
(OAuth/API key) atau memandu Anda ke penempelan token manual, bergantung pada
provider yang Anda pilih.

`models auth login` menjalankan alur auth Plugin provider (OAuth/API key). Gunakan
`openclaw plugins list` untuk melihat provider mana yang terinstal.

Contoh:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Catatan:

- `setup-token` dan `paste-token` tetap menjadi perintah token generik untuk provider
  yang mengekspos metode auth token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode auth-token provider
  (secara default menggunakan metode `setup-token` provider tersebut saat tersedia).
- `paste-token` menerima string token yang dibuat di tempat lain atau dari otomatisasi.
- `paste-token` memerlukan `--provider`, meminta nilai token, dan menulisnya
  ke id profil default `<provider>:manual` kecuali Anda memberikan
  `--profile-id`.
- `paste-token --expires-in <duration>` menyimpan waktu kedaluwarsa token absolut dari
  durasi relatif seperti `365d` atau `12h`.
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan lagi, jadi OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai hal yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Anthropic `setup-token` / `paste-token` tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` jika tersedia.

## Terkait

- [Referensi CLI](/id/cli)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
