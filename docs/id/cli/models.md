---
read_when:
    - Anda ingin mengubah model default atau melihat status autentikasi penyedia
    - Anda ingin memindai model/penyedia yang tersedia dan menelusuri masalah pada profil autentikasi
summary: Referensi CLI untuk `openclaw models` (status/list/set/scan, alias, fallback, auth)
title: Model
x-i18n:
    generated_at: "2026-05-01T09:22:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 538d3e4808329737fdc044dc6e14e5c7c78052e75d8a8b3b257b1ebd821c84d1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Penemuan, pemindaian, dan konfigurasi model (model default, fallback, profil autentikasi).

Terkait:

- Penyedia + model: [Model](/id/providers/models)
- Konsep pemilihan model + perintah slash `/models`: [Konsep model](/id/concepts/models)
- Penyiapan autentikasi penyedia: [Memulai](/id/start/getting-started)

## Perintah umum

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` menampilkan default/fallback yang telah di-resolve plus ikhtisar autentikasi.
Saat snapshot penggunaan penyedia tersedia, bagian status OAuth/kunci API menyertakan
jendela penggunaan penyedia dan snapshot kuota.
Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, dan z.ai. Auth penggunaan berasal dari hook khusus penyedia
jika tersedia; jika tidak, OpenClaw fallback ke kredensial OAuth/kunci API yang cocok
dari profil autentikasi, env, atau konfigurasi.
Dalam output `--json`, `auth.providers` adalah ikhtisar penyedia yang sadar env/config/store,
sementara `auth.oauth` hanya kesehatan profil auth-store.
Tambahkan `--probe` untuk menjalankan probe autentikasi live terhadap setiap profil penyedia yang dikonfigurasi.
Probe adalah permintaan nyata (dapat mengonsumsi token dan memicu batas laju).
Gunakan `--agent <id>` untuk memeriksa status model/autentikasi agen yang dikonfigurasi. Jika dihilangkan,
perintah menggunakan `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` jika disetel, jika tidak agen default
yang dikonfigurasi.
Baris probe dapat berasal dari profil autentikasi, kredensial env, atau `models.json`.

Catatan:

- `models set <model-or-alias>` menerima `provider/model` atau alias.
- `models list` bersifat hanya-baca: membaca konfigurasi, profil autentikasi, state katalog yang ada,
  dan baris katalog milik penyedia, tetapi tidak menulis ulang
  `models.json`.
- Kolom `Auth` berada pada level penyedia dan hanya-baca. Kolom ini dihitung dari metadata profil
  autentikasi lokal, penanda env, kunci penyedia yang dikonfigurasi, penanda penyedia lokal,
  penanda env/profil AWS Bedrock, dan metadata synthetic-auth Plugin;
  ini tidak memuat runtime penyedia, membaca rahasia keychain, memanggil API
  penyedia, atau membuktikan kesiapan eksekusi per-model secara persis.
- `models list --all --provider <id>` dapat menyertakan baris katalog statis milik penyedia
  dari manifes Plugin atau metadata katalog penyedia bawaan meskipun Anda
  belum melakukan autentikasi dengan penyedia tersebut. Baris tersebut tetap ditampilkan sebagai
  tidak tersedia sampai auth yang cocok dikonfigurasi.
- `models list` menjaga control plane tetap responsif saat penemuan katalog penyedia
  lambat. Tampilan default dan terkonfigurasi fallback ke baris model yang dikonfigurasi atau
  sintetis setelah jeda singkat dan membiarkan penemuan selesai di
  latar belakang. Gunakan `--all` saat Anda membutuhkan katalog lengkap hasil penemuan yang persis dan
  bersedia menunggu penemuan penyedia.
- `models list --all` yang luas menggabungkan baris katalog manifes di atas baris registry
  tanpa memuat hook pelengkap runtime penyedia. Fast path manifes yang difilter penyedia
  hanya menggunakan penyedia yang ditandai `static`; penyedia yang ditandai `refreshable`
  tetap berbasis registry/cache dan menambahkan baris manifes sebagai pelengkap, sementara
  penyedia yang ditandai `runtime` tetap memakai penemuan registry/runtime.
- `models list` menjaga metadata model native dan batas runtime tetap terpisah. Dalam output tabel,
  `Ctx` menampilkan `contextTokens/contextWindow` saat batas runtime efektif
  berbeda dari context window native; baris JSON menyertakan `contextTokens`
  saat penyedia mengekspos batas tersebut.
- `models list --provider <id>` memfilter berdasarkan id penyedia, seperti `moonshot` atau
  `openai-codex`. Perintah ini tidak menerima label tampilan dari picker penyedia interaktif,
  seperti `Moonshot AI`.
- Ref model diurai dengan memisahkan pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan prefiks penyedia (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan penyedia, OpenClaw me-resolve input sebagai alias terlebih dahulu, lalu
  sebagai kecocokan penyedia-terkonfigurasi yang unik untuk id model persis tersebut, dan baru kemudian
  fallback ke penyedia default yang dikonfigurasi dengan peringatan depresiasi.
  Jika penyedia itu tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
  fallback ke penyedia/model terkonfigurasi pertama alih-alih menampilkan default
  penyedia-terhapus yang usang.
- `models status` dapat menampilkan `marker(<value>)` dalam output autentikasi untuk placeholder non-rahasia (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) alih-alih menyamarkannya sebagai rahasia.

### Pemindaian model

`models scan` membaca katalog publik `:free` milik OpenRouter dan memberi peringkat kandidat untuk
penggunaan fallback. Katalog itu sendiri bersifat publik, sehingga pemindaian hanya-metadata tidak memerlukan
kunci OpenRouter.

Secara default OpenClaw mencoba mem-probe dukungan alat dan gambar dengan panggilan model live.
Jika tidak ada kunci OpenRouter yang dikonfigurasi, perintah fallback ke output hanya-metadata
dan menjelaskan bahwa model `:free` tetap memerlukan `OPENROUTER_API_KEY` untuk
probe dan inferensi.

Opsi:

- `--no-probe` (hanya metadata; tanpa pencarian konfigurasi/rahasia)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (permintaan katalog dan timeout per-probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` dan `--set-image` memerlukan probe live; hasil pemindaian hanya-metadata
bersifat informasional dan tidak diterapkan ke konfigurasi.

### Status model

Opsi:

- `--json`
- `--plain`
- `--check` (keluar 1=kedaluwarsa/hilang, 2=akan kedaluwarsa)
- `--probe` (probe live terhadap profil autentikasi yang dikonfigurasi)
- `--probe-provider <name>` (probe satu penyedia)
- `--probe-profile <id>` (id profil berulang atau dipisahkan koma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agen yang dikonfigurasi; menimpa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` menjaga stdout khusus untuk payload JSON. Diagnostik profil autentikasi, penyedia,
dan startup dirutekan ke stderr sehingga skrip dapat menyalurkan stdout langsung
ke alat seperti `jq`.

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
- `no_model`: autentikasi penyedia ada, tetapi OpenClaw tidak dapat me-resolve kandidat
  model yang dapat di-probe untuk penyedia tersebut.

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

`models auth add` adalah helper autentikasi interaktif. Ini dapat meluncurkan alur autentikasi penyedia
(OAuth/kunci API) atau memandu Anda untuk menempel token secara manual, tergantung pada
penyedia yang Anda pilih.

`models auth login` menjalankan alur autentikasi Plugin penyedia (OAuth/kunci API). Gunakan
`openclaw plugins list` untuk melihat penyedia mana yang terinstal.
Gunakan `openclaw models auth --agent <id> <subcommand>` untuk menulis hasil autentikasi ke
store agen terkonfigurasi tertentu. Flag induk `--agent` dihormati oleh
`add`, `login`, `setup-token`, `paste-token`, dan `login-github-copilot`.

Contoh:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Catatan:

- `setup-token` dan `paste-token` tetap menjadi perintah token generik untuk penyedia
  yang mengekspos metode autentikasi token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode token-auth milik penyedia
  (default ke metode `setup-token` penyedia tersebut saat penyedia mengekspos
  metode itu).
- `paste-token` menerima string token yang dibuat di tempat lain atau dari otomasi.
- `paste-token` memerlukan `--provider`, meminta nilai token, dan menuliskannya
  ke id profil default `<provider>:manual` kecuali Anda meneruskan
  `--profile-id`.
- `paste-token --expires-in <duration>` menyimpan kedaluwarsa token absolut dari
  durasi relatif seperti `365d` atau `12h`.
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- `setup-token` / `paste-token` Anthropic tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw kini lebih memilih penggunaan ulang Claude CLI dan `claude -p` saat tersedia.

## Terkait

- [Referensi CLI](/id/cli)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
