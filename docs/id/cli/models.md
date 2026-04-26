---
read_when:
    - Anda ingin mengubah model default atau melihat status autentikasi provider
    - Anda ingin memindai model/provider yang tersedia dan men-debug profil autentikasi
summary: Referensi CLI untuk `openclaw models` (`status`/`list`/`set`/`scan`, alias, fallback, autentikasi)
title: Model
x-i18n:
    generated_at: "2026-04-26T11:26:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Penemuan model, pemindaian, dan konfigurasi (model default, fallback, profil autentikasi).

Terkait:

- Provider + model: [Model](/id/providers/models)
- Konsep pemilihan model + slash command `/models`: [Konsep model](/id/concepts/models)
- Penyiapan autentikasi provider: [Memulai](/id/start/getting-started)

## Perintah umum

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` menampilkan default/fallback yang telah di-resolve beserta ringkasan autentikasi.
Saat snapshot penggunaan provider tersedia, bagian status OAuth/API key mencakup
jendela penggunaan provider dan snapshot kuota.
Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, dan z.ai. Autentikasi penggunaan berasal dari hook khusus provider
saat tersedia; jika tidak, OpenClaw fallback ke pencocokan kredensial OAuth/API key
dari profil autentikasi, env, atau config.
Dalam output `--json`, `auth.providers` adalah ringkasan provider
yang sadar env/config/store, sedangkan `auth.oauth` hanya kesehatan profil auth-store.
Tambahkan `--probe` untuk menjalankan probe autentikasi live terhadap setiap profil provider yang dikonfigurasi.
Probe adalah permintaan nyata (dapat menghabiskan token dan memicu rate limit).
Gunakan `--agent <id>` untuk memeriksa status model/autentikasi agent yang dikonfigurasi. Jika dihilangkan,
perintah menggunakan `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` jika disetel, jika tidak maka
menggunakan agent default yang dikonfigurasi.
Baris probe dapat berasal dari profil autentikasi, kredensial env, atau `models.json`.

Catatan:

- `models set <model-or-alias>` menerima `provider/model` atau sebuah alias.
- `models list` bersifat hanya-baca: perintah ini membaca config, profil autentikasi, status katalog
  yang ada, dan baris katalog milik provider, tetapi tidak menulis ulang
  `models.json`.
- `models list --all --provider <id>` dapat menyertakan baris katalog statis milik provider
  dari manifest Plugin atau metadata katalog provider bawaan bahkan ketika Anda
  belum mengautentikasi provider tersebut. Baris itu tetap ditampilkan sebagai
  tidak tersedia sampai autentikasi yang cocok dikonfigurasi.
- `models list` menjaga metadata model bawaan dan batas runtime tetap terpisah. Dalam
  output tabel, `Ctx` menampilkan `contextTokens/contextWindow` saat batas runtime efektif
  berbeda dari jendela konteks bawaan; baris JSON menyertakan `contextTokens`
  saat provider mengekspos batas tersebut.
- `models list --provider <id>` memfilter berdasarkan id provider, seperti `moonshot` atau
  `openai-codex`. Perintah ini tidak menerima label tampilan dari pemilih provider interaktif,
  seperti `Moonshot AI`.
- Referensi model di-parse dengan memisah pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan prefiks provider (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw me-resolve input sebagai alias terlebih dahulu, lalu
  sebagai kecocokan provider yang dikonfigurasi dan unik untuk ID model persis tersebut, dan baru kemudian
  fallback ke provider default yang dikonfigurasi dengan peringatan deprecasi.
  Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi,
  OpenClaw fallback ke provider/model pertama yang dikonfigurasi alih-alih menampilkan
  default provider yang sudah dihapus dan basi.
- `models status` dapat menampilkan `marker(<value>)` dalam output autentikasi untuk placeholder non-rahasia (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) alih-alih menyamarkannya sebagai rahasia.

### `models scan`

`models scan` membaca katalog publik `:free` OpenRouter dan memberi peringkat kandidat untuk
penggunaan fallback. Katalog itu sendiri bersifat publik, jadi pemindaian metadata saja tidak memerlukan kunci OpenRouter.

Secara default OpenClaw mencoba mem-probe dukungan tool dan gambar dengan panggilan model live.
Jika tidak ada kunci OpenRouter yang dikonfigurasi, perintah fallback ke output metadata saja
dan menjelaskan bahwa model `:free` tetap memerlukan `OPENROUTER_API_KEY` untuk
probe dan inferensi.

Opsi:

- `--no-probe` (hanya metadata; tanpa lookup config/secret)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout permintaan katalog dan per-probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` dan `--set-image` memerlukan probe live; hasil scan metadata saja
bersifat informatif dan tidak diterapkan ke config.

### `models status`

Opsi:

- `--json`
- `--plain`
- `--check` (keluar 1=kedaluwarsa/tidak ada, 2=akan kedaluwarsa)
- `--probe` (probe live untuk profil autentikasi yang dikonfigurasi)
- `--probe-provider <name>` (probe satu provider)
- `--probe-profile <id>` (dapat diulang atau daftar id profil dipisahkan koma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent yang dikonfigurasi; menimpa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Bucket status probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Kasus detail/kode alasan probe yang perlu diharapkan:

- `excluded_by_auth_order`: profil tersimpan ada, tetapi `auth.order.<provider>`
  yang eksplisit menghilangkannya, jadi probe melaporkan pengecualian itu alih-alih
  mencobanya.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil ada tetapi tidak memenuhi syarat/tidak dapat di-resolve.
- `no_model`: autentikasi provider ada, tetapi OpenClaw tidak dapat me-resolve
  kandidat model yang dapat di-probe untuk provider tersebut.

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profil autentikasi

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` adalah helper autentikasi interaktif. Perintah ini dapat meluncurkan alur autentikasi provider
(OAuth/API key) atau memandu Anda ke penempelan token manual, tergantung provider
yang Anda pilih.

`models auth login` menjalankan alur autentikasi Plugin provider (OAuth/API key). Gunakan
`openclaw plugins list` untuk melihat provider mana yang terinstal.
Gunakan `openclaw models auth --agent <id> <subcommand>` untuk menulis hasil autentikasi ke
store agent tertentu yang dikonfigurasi. Flag induk `--agent` dihormati oleh
`add`, `login`, `setup-token`, `paste-token`, dan `login-github-copilot`.

Contoh:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Catatan:

- `setup-token` dan `paste-token` tetap merupakan perintah token generik untuk provider
  yang mengekspos metode autentikasi token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode auth-token provider
  (secara default ke metode `setup-token` provider tersebut saat tersedia).
- `paste-token` menerima string token yang dihasilkan di tempat lain atau dari otomatisasi.
- `paste-token` memerlukan `--provider`, meminta nilai token, dan menuliskannya
  ke id profil default `<provider>:manual` kecuali Anda memberikan
  `--profile-id`.
- `paste-token --expires-in <duration>` menyimpan kedaluwarsa token absolut dari
  durasi relatif seperti `365d` atau `12h`.
- Catatan Anthropic: Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan lagi, jadi OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai hal yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Anthropic `setup-token` / `paste-token` tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` saat tersedia.

## Terkait

- [Referensi CLI](/id/cli)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
