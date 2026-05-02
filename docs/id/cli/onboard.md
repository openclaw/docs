---
read_when:
    - Anda menginginkan penyiapan terpandu untuk Gateway, ruang kerja, autentikasi, kanal, dan Skills
summary: Referensi CLI untuk `openclaw onboard` (orientasi interaktif)
title: Orientasi
x-i18n:
    generated_at: "2026-05-02T09:16:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding interaktif untuk penyiapan Gateway lokal atau jarak jauh.

## Panduan terkait

<CardGroup cols={2}>
  <Card title="Hub onboarding CLI" href="/id/start/wizard" icon="rocket">
    Panduan alur CLI interaktif.
  </Card>
  <Card title="Ikhtisar onboarding" href="/id/start/onboarding-overview" icon="map">
    Bagaimana onboarding OpenClaw tersusun.
  </Card>
  <Card title="Referensi penyiapan CLI" href="/id/start/wizard-cli-reference" icon="book">
    Output, internal, dan perilaku per langkah.
  </Card>
  <Card title="Otomasi CLI" href="/id/start/wizard-cli-automation" icon="terminal">
    Flag non-interaktif dan penyiapan berskrip.
  </Card>
  <Card title="Onboarding aplikasi macOS" href="/id/start/onboarding" icon="apple">
    Alur onboarding untuk aplikasi bilah menu macOS.
  </Card>
</CardGroup>

## Contoh

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` menggunakan penyedia migrasi milik plugin seperti Hermes. Ini hanya berjalan pada penyiapan OpenClaw yang masih baru; jika config, kredensial, sesi, atau file memori/identitas workspace sudah ada, reset atau pilih penyiapan baru sebelum mengimpor.

`--modern` memulai pratinjau onboarding percakapan Crestodian. Tanpa
`--modern`, `openclaw onboard` tetap menggunakan alur onboarding klasik.

Untuk target `ws://` jaringan privat plaintext (hanya jaringan tepercaya), atur
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` di environment proses onboarding.
Tidak ada padanan `openclaw.json` untuk break-glass transport sisi klien ini.

Penyedia kustom non-interaktif:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` bersifat opsional dalam mode non-interaktif. Jika dihilangkan, onboarding memeriksa `CUSTOM_API_KEY`.
OpenClaw secara otomatis menandai ID model visi umum sebagai mampu gambar. Berikan `--custom-image-input` untuk ID visi kustom yang tidak dikenal, atau `--custom-text-input` untuk memaksa metadata teks saja.

LM Studio juga mendukung flag kunci khusus penyedia dalam mode non-interaktif:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama non-interaktif:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` default ke `http://127.0.0.1:11434`. `--custom-model-id` bersifat opsional; jika dihilangkan, onboarding menggunakan default yang disarankan Ollama. ID model cloud seperti `kimi-k2.5:cloud` juga berfungsi di sini.

Simpan kunci penyedia sebagai ref, bukan plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Dengan `--secret-input-mode ref`, onboarding menulis ref berbasis env, bukan nilai kunci plaintext.
Untuk penyedia berbasis auth-profile, ini menulis entri `keyRef`; untuk penyedia kustom, ini menulis `models.providers.<id>.apiKey` sebagai ref env (misalnya `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrak mode `ref` non-interaktif:

- Atur env var penyedia di environment proses onboarding (misalnya `OPENAI_API_KEY`).
- Jangan berikan flag kunci inline (misalnya `--openai-api-key`) kecuali env var tersebut juga sudah diatur.
- Jika flag kunci inline diberikan tanpa env var yang diwajibkan, onboarding gagal cepat dengan panduan.

Opsi token Gateway dalam mode non-interaktif:

- `--gateway-auth token --gateway-token <token>` menyimpan token plaintext.
- `--gateway-auth token --gateway-token-ref-env <name>` menyimpan `gateway.auth.token` sebagai SecretRef env.
- `--gateway-token` dan `--gateway-token-ref-env` saling eksklusif.
- `--gateway-token-ref-env` memerlukan env var yang tidak kosong di environment proses onboarding.
- Dengan `--install-daemon`, ketika autentikasi token memerlukan token, token gateway yang dikelola SecretRef divalidasi tetapi tidak dipersistenkan sebagai plaintext yang di-resolve dalam metadata environment layanan supervisor.
- Dengan `--install-daemon`, jika mode token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat di-resolve, onboarding gagal tertutup dengan panduan remediasi.
- Dengan `--install-daemon`, jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, onboarding memblokir instalasi sampai mode diatur secara eksplisit.
- Onboarding lokal menulis `gateway.mode="local"` ke dalam config. Jika file config berikutnya tidak memiliki `gateway.mode`, perlakukan itu sebagai kerusakan config atau edit manual yang belum lengkap, bukan sebagai pintasan mode lokal yang valid.
- Onboarding lokal menginstal plugin unduhan yang dipilih ketika jalur penyiapan yang dipilih memerlukannya.
- Onboarding jarak jauh hanya menulis info koneksi untuk Gateway jarak jauh dan tidak menginstal paket plugin lokal.
- `--allow-unconfigured` adalah escape hatch runtime gateway terpisah. Itu tidak berarti onboarding boleh menghilangkan `gateway.mode`.

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

- Kecuali Anda memberikan `--skip-health`, onboarding menunggu gateway lokal yang dapat dijangkau sebelum berhasil keluar.
- `--install-daemon` memulai jalur instalasi gateway terkelola terlebih dahulu. Tanpanya, Anda harus sudah menjalankan gateway lokal, misalnya `openclaw gateway run`.
- Jika Anda hanya menginginkan penulisan config/workspace/bootstrap dalam otomasi, gunakan `--skip-health`.
- Jika Anda mengelola file workspace sendiri, berikan `--skip-bootstrap` untuk mengatur `agents.defaults.skipBootstrap: true` dan melewati pembuatan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Pada Windows native, `--install-daemon` mencoba Scheduled Tasks terlebih dahulu dan fallback ke item login folder Startup per pengguna jika pembuatan tugas ditolak.

Perilaku onboarding interaktif dengan mode referensi:

- Pilih **Use secret reference** saat diminta.
- Lalu pilih salah satu:
  - Variabel environment
  - Penyedia rahasia yang dikonfigurasi (`file` atau `exec`)
- Onboarding melakukan validasi preflight cepat sebelum menyimpan ref.
  - Jika validasi gagal, onboarding menampilkan error dan memungkinkan Anda mencoba lagi.

### Pilihan endpoint Z.AI non-interaktif

<Note>
`--auth-choice zai-api-key` otomatis mendeteksi endpoint Z.AI terbaik untuk kunci Anda (mengutamakan API umum dengan `zai/glm-5.1`). Jika Anda secara khusus menginginkan endpoint GLM Coding Plan, pilih `zai-coding-global` atau `zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
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

## Catatan alur

<AccordionGroup>
  <Accordion title="Jenis alur">
    - `quickstart`: prompt minimal, otomatis membuat token gateway.
    - `manual`: prompt lengkap untuk port, bind, dan auth (alias dari `advanced`).
    - `import`: menjalankan penyedia migrasi yang terdeteksi, mempratinjau rencana, lalu menerapkannya setelah konfirmasi.

  </Accordion>
  <Accordion title="Prafilter penyedia">
    Ketika pilihan auth mengimplikasikan penyedia pilihan, onboarding memfilter terlebih dahulu pemilih model default dan allowlist ke penyedia tersebut. Untuk Volcengine dan BytePlus, ini juga mencocokkan varian coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Jika filter penyedia pilihan belum menghasilkan model yang dimuat, onboarding fallback ke katalog tanpa filter alih-alih membiarkan pemilih kosong.

  </Accordion>
  <Accordion title="Tindak lanjut pencarian web">
    Beberapa penyedia pencarian web memicu prompt tindak lanjut khusus penyedia:

    - **Grok** dapat menawarkan penyiapan `x_search` opsional dengan `XAI_API_KEY` yang sama dan pilihan model `x_search`.
    - **Kimi** dapat meminta region API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) dan model pencarian web Kimi default.

  </Accordion>
  <Accordion title="Perilaku lain">
    - Perilaku cakupan DM onboarding lokal: [Referensi penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals).
    - Chat pertama tercepat: `openclaw dashboard` (UI Kontrol, tanpa penyiapan channel).
    - Penyedia kustom: hubungkan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic, termasuk penyedia hosted yang tidak terdaftar. Gunakan Unknown untuk mendeteksi otomatis.
    - Jika state Hermes terdeteksi, onboarding menawarkan alur migrasi. Gunakan [Migrate](/id/cli/migrate) untuk rencana dry-run, mode overwrite, laporan, dan pemetaan persis.

  </Accordion>
</AccordionGroup>

## Perintah tindak lanjut umum

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` tidak mengimplikasikan mode non-interaktif. Gunakan `--non-interactive` untuk skrip.
</Note>
