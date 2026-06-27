---
read_when:
    - Anda ingin mengubah model default atau melihat status autentikasi penyedia
    - Anda ingin memindai model/penyedia yang tersedia dan men-debug profil autentikasi
summary: Referensi CLI untuk `openclaw models` (status/list/set/scan, alias, fallback, auth)
title: Model
x-i18n:
    generated_at: "2026-06-27T17:19:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
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

`openclaw models status` menampilkan default/fallback yang terselesaikan plus ringkasan autentikasi.
Saat snapshot penggunaan penyedia tersedia, bagian status OAuth/API-key menyertakan
jendela penggunaan penyedia dan snapshot kuota.
Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI,
MiniMax, Xiaomi, dan z.ai. Autentikasi penggunaan berasal dari hook khusus penyedia
saat tersedia; jika tidak, OpenClaw melakukan fallback ke kredensial OAuth/API-key
yang cocok dari profil autentikasi, env, atau konfigurasi.
Dalam keluaran `--json`, `auth.providers` adalah ringkasan penyedia yang sadar
env/config/store, sedangkan `auth.oauth` hanya kesehatan profil auth-store.
Tambahkan `--probe` untuk menjalankan probe autentikasi langsung terhadap setiap profil penyedia yang dikonfigurasi.
Probe adalah permintaan nyata (dapat mengonsumsi token dan memicu rate limit).
Gunakan `--agent <id>` untuk memeriksa status model/autentikasi agen yang dikonfigurasi. Jika dihilangkan,
perintah menggunakan `OPENCLAW_AGENT_DIR` jika disetel, jika tidak agen default
yang dikonfigurasi.
Baris probe dapat berasal dari profil autentikasi, kredensial env, atau `models.json`.
Untuk pemecahan masalah OAuth OpenAI ChatGPT/Codex, `openclaw models status`,
`openclaw models auth list --provider openai`, dan
`openclaw config get agents.defaults.model --json` adalah cara tercepat untuk
mengonfirmasi apakah agen memiliki profil OAuth `openai` yang dapat digunakan untuk
`openai/*` melalui runtime Codex native. Lihat [penyiapan penyedia OpenAI](/id/providers/openai#check-and-recover-codex-oauth-routing).

Catatan:

- `models set <model-or-alias>` menerima `provider/model` atau alias.
- `models list` bersifat baca-saja: perintah ini membaca konfigurasi, profil autentikasi, status katalog
  yang ada, dan baris katalog milik penyedia, tetapi tidak menulis ulang
  `models.json`.
- Kolom `Auth` berada di level penyedia dan bersifat baca-saja. Kolom ini dihitung dari metadata
  profil autentikasi lokal, marker env, kunci penyedia yang dikonfigurasi, marker penyedia lokal,
  marker env/profil AWS Bedrock, dan metadata autentikasi sintetis Plugin;
  kolom ini tidak memuat runtime penyedia, membaca rahasia keychain, memanggil API
  penyedia, atau membuktikan kesiapan eksekusi per model secara persis.
- `models list --all --provider <id>` dapat menyertakan baris katalog statis milik penyedia
  dari manifes Plugin atau metadata katalog penyedia bawaan bahkan saat Anda
  belum melakukan autentikasi dengan penyedia tersebut. Baris tersebut tetap ditampilkan
  tidak tersedia sampai autentikasi yang cocok dikonfigurasi.
- `models list` menjaga control plane tetap responsif saat penemuan katalog penyedia
  lambat. Tampilan default dan terkonfigurasi melakukan fallback ke baris model yang dikonfigurasi atau
  sintetis setelah waktu tunggu singkat dan membiarkan penemuan selesai di
  latar belakang. Gunakan `--all` saat Anda membutuhkan katalog lengkap hasil penemuan yang persis dan
  bersedia menunggu penemuan penyedia.
- `models list --all` yang luas menggabungkan baris katalog manifes di atas baris registry
  tanpa memuat hook suplemen runtime penyedia. Jalur cepat manifes yang difilter penyedia
  hanya menggunakan penyedia yang ditandai `static`; penyedia yang ditandai `refreshable`
  tetap didukung registry/cache dan menambahkan baris manifes sebagai suplemen, sedangkan
  penyedia yang ditandai `runtime` tetap menggunakan penemuan registry/runtime.
- `models list` menjaga metadata model native dan batas runtime tetap terpisah. Dalam keluaran tabel,
  `Ctx` menampilkan `contextTokens/contextWindow` saat batas runtime efektif
  berbeda dari jendela konteks native; baris JSON menyertakan `contextTokens`
  saat penyedia mengekspos batas tersebut.
- `models list --provider <id>` memfilter berdasarkan id penyedia, seperti `moonshot` atau
  `openai`. Perintah ini tidak menerima label tampilan dari pemilih penyedia interaktif,
  seperti `Moonshot AI`.
- Referensi model diurai dengan membagi pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan prefiks penyedia (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan penyedia, OpenClaw menyelesaikan input sebagai alias terlebih dahulu, lalu
  sebagai kecocokan penyedia terkonfigurasi yang unik untuk id model persis tersebut, dan baru kemudian
  melakukan fallback ke penyedia default yang dikonfigurasi dengan peringatan deprecation.
  Jika penyedia tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
  melakukan fallback ke penyedia/model terkonfigurasi pertama alih-alih menampilkan
  default penyedia yang dihapus dan usang.
- `models status` dapat menampilkan `marker(<value>)` dalam keluaran autentikasi untuk placeholder non-rahasia (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) alih-alih menyamarkannya sebagai rahasia.

### Pemindaian model

`models scan` membaca katalog publik `:free` OpenRouter dan memberi peringkat kandidat untuk
penggunaan fallback. Katalog itu sendiri bersifat publik, jadi pemindaian metadata saja tidak memerlukan
kunci OpenRouter.

Secara default OpenClaw mencoba mem-probe dukungan tool dan gambar dengan panggilan model langsung.
Jika tidak ada kunci OpenRouter yang dikonfigurasi, perintah melakukan fallback ke keluaran
metadata saja dan menjelaskan bahwa model `:free` tetap memerlukan `OPENROUTER_API_KEY` untuk
probe dan inferensi.

Opsi:

- `--no-probe` (metadata saja; tanpa pencarian konfigurasi/rahasia)
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
metadata saja bersifat informasional dan tidak diterapkan ke konfigurasi.

### Status model

Opsi:

- `--json`
- `--plain`
- `--check` (keluar 1=kedaluwarsa/hilang, 2=akan kedaluwarsa)
- `--probe` (probe langsung profil autentikasi yang dikonfigurasi)
- `--probe-provider <name>` (probe satu penyedia)
- `--probe-profile <id>` (id profil berulang atau dipisahkan koma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agen terkonfigurasi; menimpa `OPENCLAW_AGENT_DIR`)

`--json` menjaga stdout khusus untuk payload JSON. Diagnostik profil autentikasi, penyedia,
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

Kasus detail/kode alasan probe yang dapat diharapkan:

- `excluded_by_auth_order`: profil tersimpan ada, tetapi `auth.order.<provider>` eksplisit
  menghilangkannya, sehingga probe melaporkan pengecualian tersebut alih-alih
  mencobanya.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil ada tetapi tidak memenuhi syarat/tidak dapat diselesaikan.
- `no_model`: autentikasi penyedia ada, tetapi OpenClaw tidak dapat menyelesaikan
  kandidat model yang dapat di-probe untuk penyedia tersebut.

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
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` adalah helper autentikasi interaktif. Perintah ini dapat meluncurkan alur autentikasi
penyedia (OAuth/API key) atau memandu Anda ke penempelan token manual, tergantung pada
penyedia yang Anda pilih.

`models auth list` mencantumkan profil autentikasi tersimpan untuk agen yang dipilih tanpa
mencetak token, API-key, atau material rahasia OAuth. Gunakan `--provider <id>` untuk
memfilter ke satu penyedia, seperti `openai`, dan `--json` untuk skrip.

`models auth login` menjalankan alur autentikasi Plugin penyedia (OAuth/API key). Gunakan
`openclaw plugins list` untuk melihat penyedia yang terinstal.
Gunakan `openclaw models auth --agent <id> <subcommand>` untuk menulis hasil autentikasi ke
store agen terkonfigurasi tertentu. Flag induk `--agent` dihormati oleh
`add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, dan
`login-github-copilot`.

Untuk model OpenAI, `--provider openai` secara default menggunakan login akun ChatGPT/Codex.
Gunakan `--method api-key` hanya saat Anda ingin menambahkan profil API-key OpenAI,
biasanya sebagai cadangan untuk batas langganan Codex. Jalankan `openclaw doctor --fix`
untuk memigrasikan status autentikasi/profil prefiks OpenAI Codex legacy lama ke `openai`.

Contoh:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Catatan:

- `login` menerima `--profile-id <id>` untuk penyedia yang mendukung profil
  bernama selama login. Gunakan ini untuk memisahkan beberapa login untuk
  penyedia yang sama.
- `paste-api-key` menerima API key yang dibuat di tempat lain, meminta nilai
  kunci, dan menuliskannya ke id profil default `<provider>:manual` kecuali Anda
  meneruskan `--profile-id`. Dalam otomasi, salurkan kunci melalui stdin, misalnya
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` dan `paste-token` tetap menjadi perintah token generik untuk penyedia
  yang mengekspos metode autentikasi token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode autentikasi token
  penyedia (secara default menggunakan metode `setup-token` penyedia tersebut saat metode itu diekspos).
- `paste-token` menerima string token yang dibuat di tempat lain atau dari otomasi.
- `paste-token` memerlukan `--provider`, meminta nilai token secara default,
  dan menuliskannya ke id profil default `<provider>:manual` kecuali Anda meneruskan
  `--profile-id`.
- Dalam otomasi, salurkan token melalui stdin alih-alih meneruskannya sebagai argumen agar
  kredensial penyedia tidak muncul di riwayat shell atau daftar proses.
- `paste-token --expires-in <duration>` menyimpan kedaluwarsa token absolut dari
  durasi relatif seperti `365d` atau `12h`.
- Untuk `openai`, API key OpenAI dan material token ChatGPT/OAuth adalah
  bentuk autentikasi yang berbeda. Gunakan `paste-api-key` untuk API key OpenAI `sk-...` dan
  `paste-token` hanya untuk material autentikasi token.
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Anthropic `setup-token` / `paste-token` tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw kini lebih memilih penggunaan ulang Claude CLI dan `claude -p` saat tersedia.

## Terkait

- [Referensi CLI](/id/cli)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
