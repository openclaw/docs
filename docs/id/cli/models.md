---
read_when:
    - Anda ingin mengubah model default atau melihat status autentikasi penyedia
    - Anda ingin memindai model/penyedia yang tersedia dan men-debug profil autentikasi
summary: Referensi CLI untuk `openclaw models` (status/list/set/scan, alias, fallback, autentikasi)
title: Model
x-i18n:
    generated_at: "2026-05-12T00:58:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Penemuan, pemindaian, dan konfigurasi model (model default, fallback, profil auth).

Terkait:

- Provider + model: [Model](/id/providers/models)
- Konsep pemilihan model + perintah garis miring `/models`: [Konsep model](/id/concepts/models)
- Penyiapan auth provider: [Memulai](/id/start/getting-started)

## Perintah umum

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` menampilkan default/fallback yang telah di-resolve beserta ringkasan auth.
Saat snapshot penggunaan provider tersedia, bagian status OAuth/API-key menyertakan
jendela penggunaan provider dan snapshot kuota.
Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, dan z.ai. Auth penggunaan berasal dari hook khusus provider
jika tersedia; jika tidak, OpenClaw kembali ke kredensial OAuth/API-key yang cocok
dari profil auth, env, atau config.
Dalam output `--json`, `auth.providers` adalah ringkasan provider yang sadar env/config/store,
sedangkan `auth.oauth` hanya kesehatan profil auth-store.
Tambahkan `--probe` untuk menjalankan probe auth langsung terhadap setiap profil provider yang dikonfigurasi.
Probe adalah permintaan nyata (dapat mengonsumsi token dan memicu batas laju).
Gunakan `--agent <id>` untuk memeriksa status model/auth agen yang dikonfigurasi. Jika dihilangkan,
perintah menggunakan `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` jika disetel, jika tidak agen
default yang dikonfigurasi.
Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.
Untuk pemecahan masalah OAuth Codex, `openclaw models status`,
`openclaw models auth list --provider openai-codex`, dan
`openclaw config get agents.defaults.model --json` adalah cara tercepat untuk
mengonfirmasi apakah agen memiliki profil auth `openai-codex` yang dapat digunakan untuk
`openai/*` melalui runtime Codex native. Lihat [Penyiapan provider OpenAI](/id/providers/openai#check-and-recover-codex-oauth-routing).

Catatan:

- `models set <model-or-alias>` menerima `provider/model` atau alias.
- `models list` bersifat hanya-baca: perintah ini membaca config, profil auth, status katalog yang ada,
  dan baris katalog milik provider, tetapi tidak menulis ulang
  `models.json`.
- Kolom `Auth` berada di tingkat provider dan hanya-baca. Kolom ini dihitung dari metadata
  profil auth lokal, marker env, kunci provider yang dikonfigurasi, marker provider lokal,
  marker env/profil AWS Bedrock, dan metadata auth sintetis plugin;
  kolom ini tidak memuat runtime provider, membaca rahasia keychain, memanggil API
  provider, atau membuktikan kesiapan eksekusi tepat per model.
- `models list --all --provider <id>` dapat menyertakan baris katalog statis milik provider
  dari manifest plugin atau metadata katalog provider bawaan meskipun Anda
  belum mengautentikasi dengan provider tersebut. Baris tersebut tetap ditampilkan sebagai
  tidak tersedia sampai auth yang cocok dikonfigurasi.
- `models list` menjaga control plane tetap responsif saat penemuan katalog provider
  lambat. Tampilan default dan terkonfigurasi kembali ke baris model yang dikonfigurasi atau
  sintetis setelah penantian singkat dan membiarkan penemuan selesai di
  latar belakang. Gunakan `--all` saat Anda memerlukan katalog lengkap hasil penemuan yang persis dan
  bersedia menunggu penemuan provider.
- `models list --all` yang luas menggabungkan baris katalog manifest di atas baris registry
  tanpa memuat hook suplemen runtime provider. Jalur cepat manifest yang difilter provider
  hanya menggunakan provider yang ditandai `static`; provider yang ditandai `refreshable`
  tetap didukung registry/cache dan menambahkan baris manifest sebagai suplemen, sedangkan
  provider yang ditandai `runtime` tetap menggunakan penemuan registry/runtime.
- `models list` menjaga metadata model native dan batas runtime tetap terpisah. Dalam output tabel,
  `Ctx` menampilkan `contextTokens/contextWindow` saat batas runtime efektif
  berbeda dari jendela konteks native; baris JSON menyertakan `contextTokens`
  saat provider mengekspos batas tersebut.
- `models list --provider <id>` memfilter berdasarkan id provider, seperti `moonshot` atau
  `openai-codex`. Perintah ini tidak menerima label tampilan dari pemilih provider
  interaktif, seperti `Moonshot AI`.
- Ref model diuraikan dengan membagi pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan prefiks provider (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw me-resolve input sebagai alias terlebih dahulu, lalu
  sebagai kecocokan provider terkonfigurasi yang unik untuk id model persis tersebut, dan baru kemudian
  kembali ke provider default yang dikonfigurasi dengan peringatan deprekasi.
  Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
  kembali ke provider/model terkonfigurasi pertama alih-alih menampilkan
  default provider yang sudah dihapus dan basi.
- `models status` dapat menampilkan `marker(<value>)` dalam output auth untuk placeholder non-rahasia (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) alih-alih menyamarkannya sebagai rahasia.

### Pemindaian model

`models scan` membaca katalog publik `:free` OpenRouter dan memeringkat kandidat untuk
penggunaan fallback. Katalog itu sendiri bersifat publik, sehingga pemindaian metadata saja tidak memerlukan
kunci OpenRouter.

Secara default OpenClaw mencoba mem-probe dukungan tool dan gambar dengan panggilan model langsung.
Jika tidak ada kunci OpenRouter yang dikonfigurasi, perintah kembali ke output metadata saja
dan menjelaskan bahwa model `:free` tetap memerlukan `OPENROUTER_API_KEY` untuk
probe dan inferensi.

Opsi:

- `--no-probe` (metadata saja; tanpa pencarian config/rahasia)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (permintaan katalog dan timeout per probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` dan `--set-image` memerlukan probe langsung; hasil pemindaian
metadata saja bersifat informasional dan tidak diterapkan ke config.

### Status model

Opsi:

- `--json`
- `--plain`
- `--check` (keluar 1=kedaluwarsa/hilang, 2=akan kedaluwarsa)
- `--probe` (probe langsung profil auth yang dikonfigurasi)
- `--probe-provider <name>` (probe satu provider)
- `--probe-profile <id>` (id profil berulang atau dipisahkan koma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agen terkonfigurasi; menimpa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` menjaga stdout khusus untuk payload JSON. Diagnostik profil auth, provider,
dan startup diarahkan ke stderr sehingga skrip dapat menyalurkan stdout langsung
ke tool seperti `jq`.

Bucket status probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Kasus detail/kode alasan probe yang perlu diantisipasi:

- `excluded_by_auth_order`: profil tersimpan ada, tetapi
  `auth.order.<provider>` eksplisit menghilangkannya, sehingga probe melaporkan pengecualian tersebut alih-alih
  mencobanya.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil ada tetapi tidak memenuhi syarat/dapat di-resolve.
- `no_model`: auth provider ada, tetapi OpenClaw tidak dapat me-resolve kandidat
  model yang dapat di-probe untuk provider tersebut.

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profil auth

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` adalah helper auth interaktif. Perintah ini dapat meluncurkan alur auth provider
(OAuth/API key) atau memandu Anda untuk menempelkan token secara manual, bergantung pada
provider yang Anda pilih.

`models auth list` mencantumkan profil auth tersimpan untuk agen yang dipilih tanpa
mencetak token, API-key, atau materi rahasia OAuth. Gunakan `--provider <id>` untuk
memfilter ke satu provider, seperti `openai-codex`, dan `--json` untuk skrip.

`models auth login` menjalankan alur auth plugin provider (OAuth/API key). Gunakan
`openclaw plugins list` untuk melihat provider mana yang terinstal.
Gunakan `openclaw models auth --agent <id> <subcommand>` untuk menulis hasil auth ke store
agen terkonfigurasi tertentu. Flag induk `--agent` dipatuhi oleh
`add`, `list`, `login`, `setup-token`, `paste-token`, dan
`login-github-copilot`.

Untuk model OpenAI, `--provider openai` default ke login akun ChatGPT/Codex.
Gunakan `--method api-key` hanya saat Anda ingin menambahkan profil API-key OpenAI,
biasanya sebagai cadangan untuk batas langganan Codex. Ejaan lama
`--provider openai-codex` tetap berfungsi untuk skrip yang ada.

Contoh:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

Catatan:

- `setup-token` dan `paste-token` tetap menjadi perintah token generik untuk provider
  yang mengekspos metode auth token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode auth token provider
  (default ke metode `setup-token` provider tersebut saat provider mengekspos
  metode itu).
- `paste-token` menerima string token yang dibuat di tempat lain atau dari otomatisasi.
- `paste-token` memerlukan `--provider`, meminta nilai token, dan menulisnya
  ke id profil default `<provider>:manual` kecuali Anda meneruskan
  `--profile-id`.
- `paste-token --expires-in <duration>` menyimpan kedaluwarsa token absolut dari
  durasi relatif seperti `365d` atau `12h`.
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan kembali, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Anthropic `setup-token` / `paste-token` tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` saat tersedia.

## Terkait

- [Referensi CLI](/id/cli)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
