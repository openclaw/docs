---
read_when:
    - Anda ingin mengubah model default atau melihat status auth penyedia
    - Anda ingin memindai model/penyedia yang tersedia dan men-debug profil auth
summary: Referensi CLI untuk `openclaw models` (status/list/set/scan, alias, fallback, auth)
title: models
x-i18n:
    generated_at: "2026-04-05T13:49:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ba33181d49b6bbf3b5d5fa413aa6b388c9f29fb9d4952055d68c79f7bcfea0
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Penemuan model, pemindaian, dan konfigurasi (model default, fallback, profil auth).

Terkait:

- Penyedia + model: [Models](/providers/models)
- Penyiapan auth penyedia: [Memulai](/start/getting-started)

## Perintah umum

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` menampilkan default/fallback yang terselesaikan beserta ringkasan auth.
Saat snapshot penggunaan penyedia tersedia, bagian status OAuth/API-key mencakup
jendela penggunaan penyedia dan snapshot kuota.
Penyedia jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, dan z.ai. Auth penggunaan berasal dari hook khusus penyedia
saat tersedia; jika tidak, OpenClaw menggunakan fallback dengan mencocokkan
kredensial OAuth/API-key dari profil auth, env, atau config.
Tambahkan `--probe` untuk menjalankan probe auth langsung terhadap setiap profil penyedia yang dikonfigurasi.
Probe adalah permintaan nyata (dapat mengonsumsi token dan memicu batas laju).
Gunakan `--agent <id>` untuk memeriksa status model/auth agen yang dikonfigurasi. Jika dihilangkan,
perintah menggunakan `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` jika disetel, jika tidak maka
agen default yang dikonfigurasi akan digunakan.
Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.

Catatan:

- `models set <model-or-alias>` menerima `provider/model` atau alias.
- Ref model diurai dengan memisahkan pada `/` **pertama**. Jika ID model menyertakan `/` (gaya OpenRouter), sertakan awalan penyedia (contoh: `openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan penyedia, OpenClaw terlebih dahulu menyelesaikan input sebagai alias, lalu
  sebagai kecocokan penyedia-terkonfigurasi unik untuk ID model yang persis itu, dan hanya setelah itu
  menggunakan fallback ke penyedia default yang dikonfigurasi dengan peringatan deprecation.
  Jika penyedia tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
  menggunakan fallback ke penyedia/model terkonfigurasi pertama alih-alih menampilkan
  default penyedia-terhapus lama.
- `models status` dapat menampilkan `marker(<value>)` dalam output auth untuk placeholder non-rahasia (misalnya `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) alih-alih menyamarkannya sebagai rahasia.

### `models status`

Opsi:

- `--json`
- `--plain`
- `--check` (keluar 1=kedaluwarsa/hilang, 2=akan kedaluwarsa)
- `--probe` (probe langsung dari profil auth yang dikonfigurasi)
- `--probe-provider <name>` (probe satu penyedia)
- `--probe-profile <id>` (ID profil berulang atau dipisahkan koma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID agen yang dikonfigurasi; menggantikan `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Kelompok status probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Kasus detail/kode alasan probe yang perlu diharapkan:

- `excluded_by_auth_order`: profil tersimpan ada, tetapi
  `auth.order.<provider>` yang eksplisit mengabaikannya, sehingga probe melaporkan pengecualian itu alih-alih
  mencobanya.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil ada tetapi tidak memenuhi syarat/tidak dapat diselesaikan.
- `no_model`: auth penyedia ada, tetapi OpenClaw tidak dapat menyelesaikan
  kandidat model yang dapat diprobe untuk penyedia tersebut.

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

`models auth add` adalah pembantu auth interaktif. Perintah ini dapat meluncurkan alur auth penyedia
(OAuth/API key) atau memandu Anda ke penempelan token manual, tergantung pada
penyedia yang Anda pilih.

`models auth login` menjalankan alur auth plugin penyedia (OAuth/API key). Gunakan
`openclaw plugins list` untuk melihat penyedia mana yang terpasang.

Contoh:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
openclaw models auth login --provider openai-codex --set-default
```

Catatan:

- `login --provider anthropic --method cli --set-default` menggunakan kembali login Claude
  CLI lokal dan menulis ulang jalur model default Anthropic utama ke ref
  `claude-cli/claude-*` kanonis.
- `setup-token` dan `paste-token` tetap menjadi perintah token generik untuk penyedia
  yang mengekspos metode auth token.
- `setup-token` memerlukan TTY interaktif dan menjalankan metode auth-token penyedia
  (secara default menggunakan metode `setup-token` penyedia tersebut saat tersedia).
- `paste-token` menerima string token yang dihasilkan di tempat lain atau dari otomatisasi.
- `paste-token` memerlukan `--provider`, meminta nilai token, dan menulisnya
  ke ID profil default `<provider>:manual` kecuali Anda memberikan
  `--profile-id`.
- `paste-token --expires-in <duration>` menyimpan masa kedaluwarsa token absolut dari
  durasi relatif seperti `365d` atau `12h`.
- Catatan billing Anthropic: Kami meyakini fallback Claude Code CLI kemungkinan diizinkan untuk otomatisasi lokal yang dikelola pengguna berdasarkan dokumentasi CLI publik Anthropic. Meski demikian, kebijakan harness pihak ketiga Anthropic menimbulkan ambiguitas yang cukup besar terkait penggunaan berbasis langganan dalam produk eksternal sehingga kami tidak merekomendasikannya untuk produksi. Anthropic juga memberi tahu pengguna OpenClaw pada **4 April 2026 pukul 12:00 PM PT / 8:00 PM BST** bahwa jalur login Claude milik **OpenClaw** dihitung sebagai penggunaan harness pihak ketiga dan memerlukan **Extra Usage** yang ditagihkan terpisah dari langganan.
- Anthropic `setup-token` / `paste-token` kini tersedia lagi sebagai jalur OpenClaw lama/manual. Gunakan dengan pemahaman bahwa Anthropic memberi tahu pengguna OpenClaw bahwa jalur ini memerlukan **Extra Usage**.
