---
read_when:
    - Anda ingin mengubah model default atau melihat status autentikasi penyedia
    - Anda ingin memindai model/penyedia yang tersedia dan menelusuri kesalahan pada profil autentikasi
summary: Referensi CLI untuk `openclaw models` (status/list/set/scan, alias, fallback, autentikasi)
title: Model
x-i18n:
    generated_at: "2026-05-04T18:23:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc7842f02e29aa0ac2ae88f3d42bba71f1890a58ab22d818dbee0585bc562fea
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

`openclaw models status` menampilkan default/fallback yang telah di-resolve beserta ringkasan autentikasi.
Saat snapshot penggunaan penyedia tersedia, bagian status OAuth/kunci API menyertakan
jendela penggunaan penyedia dan snapshot kuota.
Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, dan z.ai. Autentikasi penggunaan berasal dari hook khusus penyedia
jika tersedia; jika tidak, OpenClaw akan beralih ke kredensial OAuth/kunci API yang cocok
dari profil autentikasi, env, atau konfigurasi.
Dalam keluaran `--json`, `auth.providers` adalah ringkasan penyedia yang sadar
env/konfigurasi/store, sedangkan `auth.oauth` hanya kesehatan profil auth-store.
Tambahkan `--probe` untuk menjalankan probe autentikasi live terhadap setiap profil penyedia yang dikonfigurasi.
Probe adalah permintaan nyata (dapat mengonsumsi token dan memicu batas laju).
Gunakan `--agent <id>` untuk memeriksa status model/autentikasi agen yang dikonfigurasi. Jika dihilangkan,
perintah menggunakan `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` jika disetel, jika tidak agen default
yang dikonfigurasi.
Baris probe dapat berasal dari profil autentikasi, kredensial env, atau `models.json`.

Catatan:

- `models set <model-or-alias>` menerima `provider/model` atau alias.
- `models list` bersifat hanya baca: perintah ini membaca konfigurasi, profil autentikasi, status katalog yang ada,
  dan baris katalog milik penyedia, tetapi tidak menulis ulang
  `models.json`.
- Kolom `Auth` berada pada tingkat penyedia dan hanya baca. Kolom ini dihitung dari metadata profil autentikasi lokal,
  penanda env, kunci penyedia yang dikonfigurasi, penanda penyedia lokal, penanda env/profil AWS Bedrock, dan metadata autentikasi sintetis Plugin;
  kolom ini tidak memuat runtime penyedia, membaca rahasia keychain, memanggil API penyedia,
  atau membuktikan kesiapan eksekusi per model secara tepat.
- `models list --all --provider <id>` dapat menyertakan baris katalog statis milik penyedia
  dari manifes Plugin atau metadata katalog penyedia bawaan bahkan saat Anda
  belum melakukan autentikasi dengan penyedia tersebut. Baris tersebut tetap ditampilkan
  tidak tersedia sampai autentikasi yang cocok dikonfigurasi.
- `models list` menjaga control plane tetap responsif saat penemuan katalog penyedia
  lambat. Tampilan default dan yang dikonfigurasi beralih ke baris model yang dikonfigurasi atau
  sintetis setelah penantian singkat dan membiarkan penemuan selesai di
  latar belakang. Gunakan `--all` saat Anda membutuhkan katalog lengkap hasil penemuan yang tepat dan
  bersedia menunggu penemuan penyedia.
- `models list --all` yang luas menggabungkan baris katalog manifes di atas baris registri
  tanpa memuat hook suplemen runtime penyedia. Jalur cepat manifes yang difilter penyedia
  hanya menggunakan penyedia yang ditandai `static`; penyedia yang ditandai `refreshable`
  tetap berbasis registri/cache dan menambahkan baris manifes sebagai suplemen, sedangkan
  penyedia yang ditandai `runtime` tetap menggunakan penemuan registri/runtime.
- `models list` menjaga metadata model native dan batas runtime tetap terpisah. Dalam keluaran tabel,
  `Ctx` menampilkan `contextTokens/contextWindow` saat batas runtime efektif
  berbeda dari jendela konteks native; baris JSON menyertakan `contextTokens`
  saat penyedia mengekspos batas tersebut.
- `models list --provider <id>` memfilter berdasarkan id penyedia, seperti `moonshot` atau
  `openai-codex`. Perintah ini tidak menerima label tampilan dari pemilih penyedia interaktif,
  seperti `Moonshot AI`.
- Referensi model diurai dengan membagi pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan prefiks penyedia (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan penyedia, OpenClaw me-resolve input sebagai alias terlebih dahulu, lalu
  sebagai kecocokan penyedia terkonfigurasi yang unik untuk id model persis tersebut, dan baru kemudian
  beralih ke penyedia default yang dikonfigurasi dengan peringatan deprekasi.
  Jika penyedia tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
  beralih ke penyedia/model terkonfigurasi pertama alih-alih menampilkan
  default penyedia yang sudah dihapus dan usang.
- `models status` dapat menampilkan `marker(<value>)` dalam keluaran autentikasi untuk placeholder nonrahasia (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) alih-alih menyamarkannya sebagai rahasia.

### Pemindaian model

`models scan` membaca katalog publik `:free` milik OpenRouter dan memeringkat kandidat untuk
penggunaan fallback. Katalog itu sendiri publik, sehingga pemindaian metadata saja tidak membutuhkan
kunci OpenRouter.

Secara default OpenClaw mencoba mem-probe dukungan tool dan gambar dengan panggilan model live.
Jika tidak ada kunci OpenRouter yang dikonfigurasi, perintah beralih ke keluaran metadata saja
dan menjelaskan bahwa model `:free` tetap membutuhkan `OPENROUTER_API_KEY` untuk
probe dan inferensi.

Opsi:

- `--no-probe` (hanya metadata; tanpa pencarian konfigurasi/rahasia)
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

`--set-default` dan `--set-image` membutuhkan probe live; hasil pemindaian metadata saja
bersifat informatif dan tidak diterapkan ke konfigurasi.

### Status model

Opsi:

- `--json`
- `--plain`
- `--check` (keluar 1=kedaluwarsa/hilang, 2=akan kedaluwarsa)
- `--probe` (probe live atas profil autentikasi yang dikonfigurasi)
- `--probe-provider <name>` (probe satu penyedia)
- `--probe-profile <id>` (ulang atau id profil dipisahkan koma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agen yang dikonfigurasi; mengesampingkan `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` menjaga stdout khusus untuk payload JSON. Diagnostik profil autentikasi, penyedia,
dan startup diarahkan ke stderr sehingga skrip dapat menyalurkan stdout langsung
ke tool seperti `jq`.

Kelompok status probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Kasus detail/kode alasan probe yang perlu diperkirakan:

- `excluded_by_auth_order`: profil tersimpan ada, tetapi
  `auth.order.<provider>` eksplisit menghilangkannya, sehingga probe melaporkan pengecualian alih-alih
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
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` adalah helper autentikasi interaktif. Perintah ini dapat meluncurkan alur autentikasi penyedia
(OAuth/kunci API) atau memandu Anda ke penempelan token manual, bergantung pada
penyedia yang Anda pilih.

`models auth list` mencantumkan profil autentikasi tersimpan untuk agen yang dipilih tanpa
mencetak token, kunci API, atau materi rahasia OAuth. Gunakan `--provider <id>` untuk
memfilter ke satu penyedia, seperti `openai-codex`, dan `--json` untuk scripting.

`models auth login` menjalankan alur autentikasi Plugin penyedia (OAuth/kunci API). Gunakan
`openclaw plugins list` untuk melihat penyedia mana yang terpasang.
Gunakan `openclaw models auth --agent <id> <subcommand>` untuk menulis hasil autentikasi ke
store agen terkonfigurasi tertentu. Flag induk `--agent` dipatuhi oleh
`add`, `list`, `login`, `setup-token`, `paste-token`, dan
`login-github-copilot`.

Contoh:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Catatan:

- `setup-token` dan `paste-token` tetap merupakan perintah token generik untuk penyedia
  yang mengekspos metode autentikasi token.
- `setup-token` membutuhkan TTY interaktif dan menjalankan metode autentikasi token milik penyedia
  (secara default menggunakan metode `setup-token` penyedia tersebut saat penyedia mengeksposnya).
- `paste-token` menerima string token yang dibuat di tempat lain atau dari otomasi.
- `paste-token` membutuhkan `--provider`, meminta nilai token, dan menuliskannya
  ke id profil default `<provider>:manual` kecuali Anda meneruskan
  `--profile-id`.
- `paste-token --expires-in <duration>` menyimpan kedaluwarsa token absolut dari
  durasi relatif seperti `365d` atau `12h`.
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai sah untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Anthropic `setup-token` / `paste-token` tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` saat tersedia.

## Terkait

- [Referensi CLI](/id/cli)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
