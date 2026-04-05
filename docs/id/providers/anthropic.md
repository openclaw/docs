---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
    - Anda ingin menggunakan kembali auth langganan Claude CLI pada host gateway
summary: Gunakan Anthropic Claude melalui API key atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-05T14:03:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f2b614eba4563093522e5157848fc54a16770a2fae69f17c54f1b9bfff624f
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic membangun keluarga model **Claude** dan menyediakan akses melalui API.
Di OpenClaw, setup Anthropic baru sebaiknya menggunakan API key atau backend
Claude CLI lokal. Profil token Anthropic lama yang sudah ada tetap dihormati saat runtime
jika sudah dikonfigurasi.

<Warning>
Dokumentasi publik Claude Code milik Anthropic secara eksplisit mendokumentasikan penggunaan CLI
non-interaktif seperti `claude -p`. Berdasarkan dokumentasi tersebut, kami yakin fallback Claude Code CLI lokal
yang dikelola pengguna kemungkinan diizinkan.

Secara terpisah, Anthropic memberi tahu pengguna OpenClaw pada **4 April 2026 pukul 12:00 siang
PT / 8:00 malam BST** bahwa **OpenClaw dihitung sebagai third-party harness**. Kebijakan yang mereka
nyatakan adalah bahwa lalu lintas login Claude yang digerakkan oleh OpenClaw tidak lagi menggunakan
pool langganan Claude yang disertakan dan sebagai gantinya memerlukan **Extra Usage**
(pay-as-you-go, ditagihkan terpisah dari langganan).

Pembedaan kebijakan itu adalah tentang **penggunaan ulang Claude CLI yang digerakkan oleh OpenClaw**, bukan
tentang menjalankan `claude` langsung di terminal Anda sendiri. Meski begitu, kebijakan third-party harness Anthropic
masih menyisakan cukup ambiguitas seputar
penggunaan berbasis langganan dalam produk eksternal sehingga kami tidak merekomendasikan jalur ini untuk produksi.

Dokumentasi publik Anthropic saat ini:

- [Referensi CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Ikhtisar Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Menggunakan Claude Code dengan paket Pro atau Max Anda](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Menggunakan Claude Code dengan paket Team atau Enterprise Anda](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Jika Anda menginginkan jalur penagihan yang paling jelas, gunakan API key Anthropic sebagai gantinya.
OpenClaw juga mendukung opsi bergaya langganan lainnya, termasuk [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding Plan](/providers/qwen),
[MiniMax Coding Plan](/providers/minimax), dan [Z.AI / GLM Coding
Plan](/providers/glm).
</Warning>

## Opsi A: API key Anthropic

**Paling cocok untuk:** akses API standar dan penagihan berbasis penggunaan.
Buat API key Anda di Anthropic Console.

### Setup CLI

```bash
openclaw onboard
# pilih: Anthropic API key

# atau non-interaktif
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Cuplikan konfigurasi Claude CLI

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Default thinking (Claude 4.6)

- Model Anthropic Claude 4.6 menggunakan default thinking `adaptive` di OpenClaw ketika tidak ada level thinking eksplisit yang disetel.
- Anda dapat mengoverride per pesan (`/think:<level>`) atau di parameter model:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Dokumentasi Anthropic terkait:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Mode cepat (Anthropic API)

Toggle `/fast` bersama milik OpenClaw juga mendukung lalu lintas Anthropic publik langsung, termasuk permintaan yang diautentikasi dengan API key dan OAuth yang dikirim ke `api.anthropic.com`.

- `/fast on` dipetakan ke `service_tier: "auto"`
- `/fast off` dipetakan ke `service_tier: "standard_only"`
- Default konfigurasi:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

Batas penting:

- OpenClaw hanya menyisipkan service tier Anthropic untuk permintaan langsung ke `api.anthropic.com`. Jika Anda merutekan `anthropic/*` melalui proxy atau gateway, `/fast` membiarkan `service_tier` tetap tidak tersentuh.
- Parameter model `serviceTier` atau `service_tier` Anthropic yang eksplisit mengoverride default `/fast` ketika keduanya disetel.
- Anthropic melaporkan tier efektif pada respons di bawah `usage.service_tier`. Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` tetap dapat ter-resolve menjadi `standard`.

## Prompt caching (Anthropic API)

OpenClaw mendukung fitur prompt caching milik Anthropic. Ini **khusus API**; auth token Anthropic lama tidak menghormati pengaturan cache.

### Konfigurasi

Gunakan parameter `cacheRetention` dalam konfigurasi model Anda:

| Nilai   | Durasi Cache | Deskripsi                     |
| ------- | ------------ | ----------------------------- |
| `none`  | Tanpa cache  | Nonaktifkan prompt caching    |
| `short` | 5 menit      | Default untuk auth API Key    |
| `long`  | 1 jam        | Cache diperpanjang            |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### Default

Saat menggunakan autentikasi Anthropic API Key, OpenClaw secara otomatis menerapkan `cacheRetention: "short"` (cache 5 menit) untuk semua model Anthropic. Anda dapat mengoverride ini dengan menyetel `cacheRetention` secara eksplisit dalam konfigurasi Anda.

### Override `cacheRetention` per agen

Gunakan parameter tingkat model sebagai baseline, lalu override agen tertentu melalui `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline untuk sebagian besar agen
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override hanya untuk agen ini
    ],
  },
}
```

Urutan penggabungan konfigurasi untuk parameter terkait cache:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (id yang cocok, override per key)

Ini memungkinkan satu agen mempertahankan cache yang tahan lama sementara agen lain pada model yang sama menonaktifkan caching untuk menghindari biaya tulis pada lalu lintas bursty/berulang rendah.

### Catatan Claude di Bedrock

- Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima pass-through `cacheRetention` saat dikonfigurasi.
- Model Bedrock non-Anthropic dipaksa menjadi `cacheRetention: "none"` saat runtime.
- Default cerdas Anthropic API-key juga menginisialisasi `cacheRetention: "short"` untuk ref model Claude-on-Bedrock saat tidak ada nilai eksplisit yang disetel.

## Jendela konteks 1M (beta Anthropic)

Jendela konteks 1M milik Anthropic dijaga oleh beta. Di OpenClaw, aktifkan per model
dengan `params.context1m: true` untuk model Opus/Sonnet yang didukung.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClaw memetakannya ke `anthropic-beta: context-1m-2025-08-07` pada permintaan
Anthropic.

Ini hanya aktif ketika `params.context1m` secara eksplisit disetel ke `true` untuk
model tersebut.

Persyaratan: Anthropic harus mengizinkan penggunaan konteks panjang pada kredensial
tersebut
(biasanya penagihan API key, atau jalur login Claude / auth token lama OpenClaw
dengan Extra Usage diaktifkan). Jika tidak, Anthropic mengembalikan:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Catatan: Anthropic saat ini menolak permintaan beta `context-1m-*` saat menggunakan
auth token Anthropic lama (`sk-ant-oat-*`). Jika Anda mengonfigurasi
`context1m: true` dengan mode auth lama tersebut, OpenClaw mencatat peringatan dan
fallback ke jendela konteks standar dengan melewati header beta context1m
sambil tetap mempertahankan beta OAuth yang diwajibkan.

## Opsi B: Claude CLI sebagai penyedia pesan

**Paling cocok untuk:** host gateway pengguna tunggal yang sudah memiliki Claude CLI terinstal
dan sudah login, sebagai fallback lokal, bukan jalur produksi yang direkomendasikan.

Catatan penagihan: Kami yakin fallback Claude Code CLI kemungkinan diizinkan untuk otomasi lokal
yang dikelola pengguna berdasarkan dokumentasi CLI publik Anthropic. Meski begitu,
kebijakan third-party harness Anthropic menciptakan cukup ambiguitas seputar
penggunaan berbasis langganan dalam produk eksternal sehingga kami tidak merekomendasikannya untuk
produksi. Anthropic juga memberi tahu pengguna OpenClaw bahwa penggunaan Claude
CLI yang **digunakan oleh OpenClaw** diperlakukan sebagai lalu lintas third-party harness dan, per **4 April 2026
pukul 12:00 siang PT / 8:00 malam BST**, memerlukan **Extra Usage** alih-alih
batas langganan Claude yang disertakan.

Jalur ini menggunakan biner `claude` lokal untuk inferensi model alih-alih memanggil
Anthropic API secara langsung. OpenClaw memperlakukannya sebagai **penyedia backend CLI**
dengan ref model seperti:

- `claude-cli/claude-sonnet-4-6`
- `claude-cli/claude-opus-4-6`

Cara kerjanya:

1. OpenClaw meluncurkan `claude -p --output-format stream-json --include-partial-messages ...`
   pada **host gateway** dan mengirim prompt melalui stdin.
2. Giliran pertama mengirim `--session-id <uuid>`.
3. Giliran lanjutan menggunakan kembali sesi Claude yang tersimpan melalui `--resume <sessionId>`.
4. Pesan obrolan Anda tetap melalui pipeline pesan OpenClaw normal, tetapi
   balasan model yang sebenarnya dihasilkan oleh Claude CLI.

### Persyaratan

- Claude CLI terinstal di host gateway dan tersedia di PATH, atau dikonfigurasi
  dengan path command absolut.
- Claude CLI sudah terautentikasi pada host yang sama:

```bash
claude auth status
```

- OpenClaw memuat otomatis plugin Anthropic bawaan saat startup gateway ketika
  konfigurasi Anda secara eksplisit mereferensikan `claude-cli/...` atau konfigurasi backend `claude-cli`.

### Cuplikan konfigurasi

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "claude-cli/claude-sonnet-4-6",
      },
      models: {
        "claude-cli/claude-sonnet-4-6": {},
      },
      sandbox: { mode: "off" },
    },
  },
}
```

Jika biner `claude` tidak ada di PATH host gateway:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

### Yang Anda dapatkan

- Auth langganan Claude digunakan kembali dari CLI lokal (dibaca saat runtime, tidak dipersistenkan)
- Routing pesan/sesi OpenClaw normal
- Kontinuitas sesi Claude CLI antar giliran (dibatalkan saat auth berubah)
- Tool gateway diekspos ke Claude CLI melalui bridge MCP loopback
- Streaming JSONL dengan progres partial-message langsung

### Migrasi dari auth Anthropic ke Claude CLI

Jika saat ini Anda menggunakan `anthropic/...` dengan profil token lama atau API key dan ingin
mengalihkan host gateway yang sama ke Claude CLI, OpenClaw mendukungnya sebagai jalur
migrasi auth penyedia normal.

Prasyarat:

- Claude CLI terinstal pada **host gateway yang sama** yang menjalankan OpenClaw
- Claude CLI sudah login di sana: `claude auth login`

Lalu jalankan:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Atau saat onboarding:

```bash
openclaw onboard --auth-choice anthropic-cli
```

`openclaw onboard` dan `openclaw configure` interaktif sekarang memprioritaskan **Anthropic
Claude CLI** terlebih dahulu dan **Anthropic API key** kedua.

Yang dilakukan ini:

- memverifikasi bahwa Claude CLI sudah login di host gateway
- mengganti model default ke `claude-cli/...`
- menulis ulang fallback model default Anthropic seperti `anthropic/claude-opus-4-6`
  menjadi `claude-cli/claude-opus-4-6`
- menambahkan entri `claude-cli/...` yang sesuai ke `agents.defaults.models`

Verifikasi cepat:

```bash
openclaw models status
```

Anda seharusnya melihat model primary yang telah di-resolve di bawah `claude-cli/...`.

Yang **tidak** dilakukan:

- menghapus profil auth Anthropic yang sudah ada
- menghapus setiap ref konfigurasi `anthropic/...` lama di luar jalur model default/allowlist utama

Itu membuat rollback sederhana: ubah model default kembali ke `anthropic/...` jika
Anda membutuhkannya.

### Batas penting

- Ini **bukan** penyedia Anthropic API. Ini adalah runtime CLI lokal.
- OpenClaw tidak menyisipkan tool call secara langsung. Claude CLI menerima tool gateway
  melalui bridge MCP loopback (`bundleMcp: true`, default).
- Claude CLI men-stream balasan melalui JSONL (`stream-json` dengan
  `--include-partial-messages`). Prompt dikirim melalui stdin, bukan argv.
- Auth dibaca saat runtime dari kredensial Claude CLI aktif dan tidak dipersistenkan
  ke profil OpenClaw. Prompt Keychain ditekan dalam konteks non-interaktif.
- Penggunaan ulang sesi dilacak melalui metadata `cliSessionBinding`. Saat status
  login Claude CLI berubah (login ulang, rotasi token), sesi yang tersimpan
  dibatalkan dan sesi baru dimulai.
- Paling cocok untuk host gateway pribadi, bukan setup penagihan multi-pengguna bersama.

Lebih detail: [/gateway/cli-backends](/id/gateway/cli-backends)

## Catatan

- Dokumentasi publik Claude Code milik Anthropic masih mendokumentasikan penggunaan CLI langsung seperti
  `claude -p`. Kami yakin fallback lokal yang dikelola pengguna kemungkinan diizinkan, tetapi
  pemberitahuan terpisah Anthropic kepada pengguna OpenClaw menyatakan jalur login Claude milik **OpenClaw**
  adalah penggunaan third-party harness dan memerlukan **Extra Usage**
  (pay-as-you-go yang ditagihkan terpisah dari langganan). Untuk produksi, kami
  merekomendasikan API key Anthropic sebagai gantinya.
- Setup-token Anthropic tersedia lagi di OpenClaw sebagai jalur lama/manual. Pemberitahuan penagihan Anthropic khusus OpenClaw tetap berlaku, jadi gunakan dengan ekspektasi bahwa Anthropic memerlukan **Extra Usage** untuk jalur ini.
- Detail auth + aturan penggunaan ulang ada di [/concepts/oauth](/id/concepts/oauth).

## Pemecahan masalah

**Error 401 / token tiba-tiba tidak valid**

- Auth token Anthropic lama dapat kedaluwarsa atau dicabut.
- Untuk setup baru, migrasikan ke API key Anthropic atau jalur Claude CLI lokal pada host gateway.

**Tidak ada API key ditemukan untuk provider "anthropic"**

- Auth bersifat **per agen**. Agen baru tidak mewarisi key agen utama.
- Jalankan ulang onboarding untuk agen tersebut, atau konfigurasikan API key pada host gateway,
  lalu verifikasi dengan `openclaw models status`.

**Tidak ada kredensial ditemukan untuk profil `anthropic:default`**

- Jalankan `openclaw models status` untuk melihat profil auth mana yang aktif.
- Jalankan ulang onboarding, atau konfigurasikan API key atau Claude CLI untuk jalur profil tersebut.

**Tidak ada profil auth yang tersedia (semua dalam cooldown/tidak tersedia)**

- Periksa `openclaw models status --json` untuk `auth.unusableProfiles`.
- Cooldown rate-limit Anthropic dapat dicakup per model, sehingga model Anthropic
  sibling mungkin masih dapat digunakan meskipun model saat ini sedang cooldown.
- Tambahkan profil Anthropic lain atau tunggu cooldown selesai.

Lebih lanjut: [/gateway/troubleshooting](/gateway/troubleshooting) dan [/help/faq](/help/faq).
