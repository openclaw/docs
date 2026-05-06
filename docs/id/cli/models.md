---
read_when:
    - Anda ingin mengubah model default atau melihat status autentikasi penyedia
    - Anda ingin memindai model/penyedia yang tersedia dan menelusuri masalah profil autentikasi
summary: Referensi CLI untuk `openclaw models` (status/list/set/scan, alias, cadangan, auth)
title: Model
x-i18n:
    generated_at: "2026-05-06T09:05:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7a1cce7b1b21411540238b1858580a56b2271d54d0898e261b69bd21f88c0f5
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Penemuan, pemindaian, dan konfigurasi model (model default, fallback, profil auth).

Terkait:

- Penyedia + model: [Models](/id/providers/models)
- Konsep pemilihan model + perintah slash `/models`: [Konsep models](/id/concepts/models)
- Penyiapan auth penyedia: [Memulai](/id/start/getting-started)

## Perintah umum

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` menampilkan default/fallback yang terselesaikan serta ringkasan auth.
Saat snapshot penggunaan penyedia tersedia, bagian status OAuth/API-key menyertakan
jendela penggunaan penyedia dan snapshot kuota.
Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, dan z.ai. Auth penggunaan berasal dari hook khusus penyedia
jika tersedia; jika tidak, OpenClaw kembali ke kredensial OAuth/API-key yang cocok
dari profil auth, env, atau config.
Dalam output `--json`, `auth.providers` adalah ringkasan penyedia yang sadar env/config/store,
sedangkan `auth.oauth` hanya kesehatan profil auth-store.
Tambahkan `--probe` untuk menjalankan probe auth langsung terhadap setiap profil penyedia yang dikonfigurasi.
Probe adalah permintaan nyata (dapat mengonsumsi token dan memicu batas laju).
Gunakan `--agent <id>` untuk memeriksa status model/auth agen yang dikonfigurasi. Jika dihilangkan,
perintah menggunakan `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` jika disetel, jika tidak agen default
yang dikonfigurasi.
Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.

Catatan:

- `models set <model-or-alias>` menerima `provider/model` atau alias.
- `models list` bersifat baca-saja: perintah ini membaca config, profil auth, status katalog yang ada,
  dan baris katalog milik penyedia, tetapi tidak menulis ulang
  `models.json`.
- Kolom `Auth` berada di tingkat penyedia dan bersifat baca-saja. Kolom ini dihitung dari metadata
  profil auth lokal, marker env, kunci penyedia yang dikonfigurasi, marker penyedia lokal,
  marker env/profil AWS Bedrock, dan metadata synthetic-auth Plugin;
  kolom ini tidak memuat runtime penyedia, membaca rahasia keychain, memanggil API
  penyedia, atau membuktikan kesiapan eksekusi tepat per model.
- `models list --all --provider <id>` dapat menyertakan baris katalog statis milik penyedia
  dari manifes Plugin atau metadata katalog penyedia bawaan meskipun Anda
  belum melakukan autentikasi dengan penyedia tersebut. Baris tersebut tetap tampil sebagai
  tidak tersedia hingga auth yang cocok dikonfigurasi.
- `models list` menjaga control plane tetap responsif saat penemuan katalog penyedia
  lambat. Tampilan default dan yang dikonfigurasi kembali ke baris model yang dikonfigurasi atau
  sintetis setelah menunggu sebentar dan membiarkan penemuan selesai di
  latar belakang. Gunakan `--all` saat Anda memerlukan katalog lengkap hasil penemuan yang tepat dan
  bersedia menunggu penemuan penyedia.
- `models list --all` yang luas menggabungkan baris katalog manifes di atas baris registry
  tanpa memuat hook pelengkap runtime penyedia. Jalur cepat manifes yang difilter penyedia
  hanya menggunakan penyedia yang ditandai `static`; penyedia yang ditandai `refreshable`
  tetap didukung registry/cache dan menambahkan baris manifes sebagai pelengkap, sedangkan
  penyedia yang ditandai `runtime` tetap pada penemuan registry/runtime.
- `models list` menjaga metadata model native dan batas runtime tetap terpisah. Dalam output tabel,
  `Ctx` menampilkan `contextTokens/contextWindow` saat batas runtime efektif
  berbeda dari context window native; baris JSON menyertakan `contextTokens`
  saat penyedia mengekspos batas tersebut.
- `models list --provider <id>` memfilter berdasarkan id penyedia, seperti `moonshot` atau
  `openai-codex`. Perintah ini tidak menerima label tampilan dari pemilih penyedia
  interaktif, seperti `Moonshot AI`.
- Ref model diurai dengan membagi pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan prefiks penyedia (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan penyedia, OpenClaw menyelesaikan input sebagai alias terlebih dahulu, lalu
  sebagai kecocokan unik penyedia-terkonfigurasi untuk id model persis tersebut, dan baru kemudian
  kembali ke penyedia default yang dikonfigurasi dengan peringatan deprecation.
  Jika penyedia tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
  kembali ke penyedia/model pertama yang dikonfigurasi, alih-alih menampilkan
  default penyedia lama yang sudah dihapus.
- `models status` dapat menampilkan `marker(<value>)` dalam output auth untuk placeholder non-rahasia (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) alih-alih menyamarkannya sebagai rahasia.

### Pemindaian models

`models scan` membaca katalog publik `:free` OpenRouter dan memberi peringkat kandidat untuk
penggunaan fallback. Katalog itu sendiri publik, sehingga pemindaian metadata-saja tidak memerlukan
kunci OpenRouter.

Secara default OpenClaw mencoba mem-probe dukungan tool dan gambar dengan panggilan model langsung.
Jika tidak ada kunci OpenRouter yang dikonfigurasi, perintah kembali ke output metadata-saja
dan menjelaskan bahwa model `:free` tetap memerlukan `OPENROUTER_API_KEY` untuk
probe dan inferensi.

Opsi:

- `--no-probe` (metadata saja; tanpa lookup config/rahasia)
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

`--set-default` dan `--set-image` memerlukan probe langsung; hasil pemindaian metadata-saja
bersifat informasional dan tidak diterapkan ke config.

### Status models

Opsi:

- `--json`
- `--plain`
- `--check` (exit 1=kedaluwarsa/hilang, 2=akan kedaluwarsa)
- `--probe` (probe langsung terhadap profil auth yang dikonfigurasi)
- `--probe-provider <name>` (probe satu penyedia)
- `--probe-profile <id>` (ulang atau id profil yang dipisahkan koma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agen yang dikonfigurasi; menimpa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` menjaga stdout khusus untuk payload JSON. Diagnostik profil auth, penyedia,
dan startup dialihkan ke stderr sehingga skrip dapat menyalurkan stdout langsung
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
  profil ada tetapi tidak memenuhi syarat/dapat diselesaikan.
- `no_model`: auth penyedia ada, tetapi OpenClaw tidak dapat menyelesaikan kandidat
  model yang dapat di-probe untuk penyedia tersebut.

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

`models auth add` adalah pembantu auth interaktif. Perintah ini dapat meluncurkan alur auth
penyedia (OAuth/API key) atau memandu Anda ke penempelan token manual, tergantung pada
penyedia yang Anda pilih.

`models auth list` mencantumkan profil auth tersimpan untuk agen yang dipilih tanpa
mencetak token, API-key, atau materi rahasia OAuth. Gunakan `--provider <id>` untuk
memfilter ke satu penyedia, seperti `openai-codex`, dan `--json` untuk scripting.

`models auth login` menjalankan alur auth Plugin penyedia (OAuth/API key). Gunakan
`openclaw plugins list` untuk melihat penyedia mana yang terinstal.
Gunakan `openclaw models auth --agent <id> <subcommand>` untuk menulis hasil auth ke store
agen tertentu yang dikonfigurasi. Flag induk `--agent` dipatuhi oleh
`add`, `list`, `login`, `setup-token`, `paste-token`, dan
`login-github-copilot`.

Contoh:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Catatan:

- `setup-token` dan `paste-token` tetap menjadi perintah token generik untuk penyedia
  yang mengekspos metode auth token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode token-auth penyedia
  (secara default ke metode `setup-token` penyedia tersebut saat penyedia mengeksposnya).
- `paste-token` menerima string token yang dibuat di tempat lain atau dari automasi.
- `paste-token` memerlukan `--provider`, meminta nilai token, dan menuliskannya
  ke id profil default `<provider>:manual` kecuali Anda meneruskan
  `--profile-id`.
- `paste-token --expires-in <duration>` menyimpan kedaluwarsa token absolut dari
  durasi relatif seperti `365d` atau `12h`.
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan reuse Claude CLI dan penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Anthropic `setup-token` / `paste-token` tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw kini lebih memilih reuse Claude CLI dan `claude -p` saat tersedia.

## Terkait

- [Referensi CLI](/id/cli)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
