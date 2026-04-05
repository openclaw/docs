---
read_when:
    - Anda ingin penyiapan terpandu untuk gateway, workspace, auth, channel, dan Skills
summary: Referensi CLI untuk `openclaw onboard` (onboarding interaktif)
title: onboard
x-i18n:
    generated_at: "2026-04-05T13:49:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6db61c8002c9e82e48ff44f72e176b58ad85fad5cb8434687455ed40add8cc2a
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Onboarding interaktif untuk penyiapan Gateway lokal atau jarak jauh.

## Panduan terkait

- Pusat onboarding CLI: [Onboarding (CLI)](/start/wizard)
- Gambaran umum onboarding: [Onboarding Overview](/start/onboarding-overview)
- Referensi onboarding CLI: [CLI Setup Reference](/start/wizard-cli-reference)
- Otomatisasi CLI: [CLI Automation](/start/wizard-cli-automation)
- Onboarding macOS: [Onboarding (macOS App)](/start/onboarding)

## Contoh

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Untuk target `ws://` jaringan privat plaintext (hanya jaringan tepercaya), setel
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dalam environment proses onboarding.

Penyedia kustom non-interaktif:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` bersifat opsional dalam mode non-interaktif. Jika dihilangkan, onboarding memeriksa `CUSTOM_API_KEY`.

Ollama non-interaktif:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` default ke `http://127.0.0.1:11434`. `--custom-model-id` bersifat opsional; jika dihilangkan, onboarding menggunakan default yang disarankan Ollama. ID model cloud seperti `kimi-k2.5:cloud` juga berfungsi di sini.

Simpan key penyedia sebagai ref alih-alih plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Dengan `--secret-input-mode ref`, onboarding menulis ref berbasis env alih-alih nilai key plaintext.
Untuk penyedia berbasis auth-profile, ini menulis entri `keyRef`; untuk penyedia kustom, ini menulis `models.providers.<id>.apiKey` sebagai env ref (misalnya `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrak mode `ref` non-interaktif:

- Setel env var penyedia dalam environment proses onboarding (misalnya `OPENAI_API_KEY`).
- Jangan berikan flag key inline (misalnya `--openai-api-key`) kecuali env var tersebut juga disetel.
- Jika flag key inline diberikan tanpa env var yang diwajibkan, onboarding gagal cepat dengan panduan.

Opsi token gateway dalam mode non-interaktif:

- `--gateway-auth token --gateway-token <token>` menyimpan token plaintext.
- `--gateway-auth token --gateway-token-ref-env <name>` menyimpan `gateway.auth.token` sebagai env SecretRef.
- `--gateway-token` dan `--gateway-token-ref-env` saling eksklusif.
- `--gateway-token-ref-env` memerlukan env var yang tidak kosong dalam environment proses onboarding.
- Dengan `--install-daemon`, saat auth token memerlukan token, token gateway yang dikelola SecretRef divalidasi tetapi tidak dipersistenkan sebagai plaintext yang telah diselesaikan dalam metadata environment layanan supervisor.
- Dengan `--install-daemon`, jika mode token memerlukan token dan token SecretRef yang dikonfigurasi tidak terselesaikan, onboarding gagal tertutup dengan panduan remediasi.
- Dengan `--install-daemon`, jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` tidak disetel, onboarding memblokir instalasi sampai mode disetel secara eksplisit.
- Onboarding lokal menulis `gateway.mode="local"` ke dalam config. Jika file config berikutnya tidak memiliki `gateway.mode`, anggap itu sebagai kerusakan config atau edit manual yang tidak lengkap, bukan sebagai pintasan mode lokal yang valid.
- `--allow-unconfigured` adalah escape hatch runtime gateway yang terpisah. Ini tidak berarti onboarding boleh menghilangkan `gateway.mode`.

Contoh:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Kesehatan gateway lokal non-interaktif:

- Kecuali Anda memberikan `--skip-health`, onboarding menunggu gateway lokal yang dapat dijangkau sebelum keluar dengan sukses.
- `--install-daemon` memulai jalur instalasi gateway terkelola terlebih dahulu. Tanpanya, Anda harus sudah memiliki gateway lokal yang berjalan, misalnya `openclaw gateway run`.
- Jika Anda hanya ingin penulisan config/workspace/bootstrap dalam otomatisasi, gunakan `--skip-health`.
- Di Windows native, `--install-daemon` mencoba Scheduled Tasks terlebih dahulu dan menggunakan fallback item login folder Startup per pengguna jika pembuatan task ditolak.

Perilaku onboarding interaktif dengan mode referensi:

- Pilih **Use secret reference** saat diminta.
- Lalu pilih salah satu:
  - Environment variable
  - Penyedia secret yang dikonfigurasi (`file` atau `exec`)
- Onboarding melakukan validasi preflight cepat sebelum menyimpan ref.
  - Jika validasi gagal, onboarding menampilkan error dan memungkinkan Anda mencoba lagi.

Pilihan endpoint Z.AI non-interaktif:

Catatan: `--auth-choice zai-api-key` sekarang mendeteksi otomatis endpoint Z.AI terbaik untuk key Anda (lebih memilih API umum dengan `zai/glm-5`).
Jika Anda secara khusus menginginkan endpoint GLM Coding Plan, pilih `zai-coding-global` atau `zai-coding-cn`.

```bash
# Pemilihan endpoint tanpa prompt
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Pilihan endpoint Z.AI lainnya:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Contoh Mistral non-interaktif:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Catatan alur:

- `quickstart`: prompt minimal, otomatis membuat token gateway.
- `manual`: prompt lengkap untuk port/bind/auth (alias dari `advanced`).
- Saat pilihan auth menyiratkan penyedia yang diprioritaskan, onboarding memprefilter
  pemilih model default dan allowlist ke penyedia tersebut. Untuk Volcengine dan
  BytePlus, ini juga cocok dengan varian coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Jika filter penyedia yang diprioritaskan belum menghasilkan model yang dimuat, onboarding
  menggunakan fallback ke katalog tanpa filter alih-alih membiarkan pemilih kosong.
- Dalam langkah pencarian web, beberapa penyedia dapat memicu
  prompt lanjutan khusus penyedia:
  - **Grok** dapat menawarkan penyiapan `x_search` opsional dengan `XAI_API_KEY`
    yang sama dan pilihan model `x_search`.
  - **Kimi** dapat menanyakan region API Moonshot (`api.moonshot.ai` vs
    `api.moonshot.cn`) dan model pencarian web Kimi default.
- Perilaku cakupan DM onboarding lokal: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals).
- Chat pertama tercepat: `openclaw dashboard` (UI Kontrol, tanpa penyiapan channel).
- Penyedia Kustom: sambungkan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic,
  termasuk penyedia yang di-host yang tidak tercantum. Gunakan Unknown untuk deteksi otomatis.

## Perintah tindak lanjut umum

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` tidak menyiratkan mode non-interaktif. Gunakan `--non-interactive` untuk skrip.
</Note>
