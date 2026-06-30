---
read_when:
    - Anda menginginkan penyiapan terpandu untuk gateway, ruang kerja, autentikasi, saluran, dan skills
summary: Referensi CLI untuk `openclaw onboard` (onboarding interaktif)
title: Orientasi
x-i18n:
    generated_at: "2026-06-30T22:34:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding terpandu lengkap untuk penyiapan Gateway lokal atau jarak jauh. Gunakan ini saat Anda ingin OpenClaw memandu autentikasi model, ruang kerja, gateway, saluran, Skills, dan kesehatan dalam satu alur.

## Panduan terkait

<CardGroup cols={2}>
  <Card title="Hub onboarding CLI" href="/id/start/wizard" icon="rocket">
    Panduan langkah demi langkah untuk alur CLI interaktif.
  </Card>
  <Card title="Ikhtisar onboarding" href="/id/start/onboarding-overview" icon="map">
    Cara onboarding OpenClaw saling terhubung.
  </Card>
  <Card title="Referensi penyiapan CLI" href="/id/start/wizard-cli-reference" icon="book">
    Keluaran, internal, dan perilaku per langkah.
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

`--flow import` menggunakan penyedia migrasi milik Plugin seperti Hermes. Ini hanya berjalan terhadap penyiapan OpenClaw yang baru; jika konfigurasi, kredensial, sesi, atau file memori/identitas ruang kerja yang ada sudah hadir, reset atau pilih penyiapan baru sebelum mengimpor.

`--modern` memulai pratinjau onboarding percakapan Crestodian. Tanpa
`--modern`, `openclaw onboard` mempertahankan alur onboarding klasik.

Pada instalasi baru ketika file konfigurasi aktif hilang atau tidak memiliki pengaturan yang ditulis
(kosong atau hanya metadata), `openclaw` polos juga memulai alur
onboarding klasik. Setelah file konfigurasi memiliki pengaturan yang ditulis, `openclaw` polos
membuka Crestodian sebagai gantinya.

Plaintext `ws://` diterima untuk local loopback, literal IP privat, `.local`, dan
URL gateway Tailnet `*.ts.net`. Untuk nama DNS privat tepercaya lainnya, atur
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` di lingkungan proses onboarding.

## Lokal

Onboarding interaktif menggunakan lokal wizard CLI untuk salinan penyiapan tetap. Urutan
resolusinya adalah:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Fallback bahasa Inggris

Lokal wizard yang didukung adalah `en`, `zh-CN`, dan `zh-TW`. Nilai lokal dapat menggunakan
bentuk garis bawah atau akhiran POSIX seperti `zh_CN.UTF-8`. Nama produk, nama
perintah, kunci konfigurasi, URL, ID penyedia, ID model, dan label Plugin/saluran
tetap literal.

Contoh:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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
OpenClaw menandai ID model visi umum sebagai berkemampuan gambar secara otomatis. Berikan `--custom-image-input` untuk ID visi kustom yang tidak dikenal, atau `--custom-text-input` untuk memaksa metadata hanya teks.
Gunakan `--custom-compatibility openai-responses` untuk endpoint yang kompatibel dengan OpenAI yang mendukung `/v1/responses` tetapi tidak mendukung `/v1/chat/completions`.

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

Simpan kunci penyedia sebagai ref alih-alih plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Dengan `--secret-input-mode ref`, onboarding menulis ref berbasis env alih-alih nilai kunci plaintext.
Untuk penyedia berbasis profil autentikasi, ini menulis entri `keyRef`; untuk penyedia kustom, ini menulis `models.providers.<id>.apiKey` sebagai ref env (misalnya `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrak mode `ref` non-interaktif:

- Atur variabel env penyedia di lingkungan proses onboarding (misalnya `OPENAI_API_KEY`).
- Jangan berikan flag kunci inline (misalnya `--openai-api-key`) kecuali variabel env tersebut juga disetel.
- Jika flag kunci inline diberikan tanpa variabel env yang diperlukan, onboarding gagal cepat dengan panduan.

Opsi token Gateway dalam mode non-interaktif:

- `--gateway-auth token --gateway-token <token>` menyimpan token plaintext.
- `--gateway-auth token --gateway-token-ref-env <name>` menyimpan `gateway.auth.token` sebagai SecretRef env.
- `--gateway-token` dan `--gateway-token-ref-env` saling eksklusif.
- `--gateway-token-ref-env` memerlukan variabel env yang tidak kosong di lingkungan proses onboarding.
- Dengan `--install-daemon`, ketika autentikasi token memerlukan token, token gateway yang dikelola SecretRef divalidasi tetapi tidak dipersistenkan sebagai plaintext yang sudah di-resolve dalam metadata lingkungan layanan supervisor.
- Dengan `--install-daemon`, jika mode token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, onboarding gagal tertutup dengan panduan remediasi.
- Dengan `--install-daemon`, jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, onboarding memblokir instalasi sampai mode disetel secara eksplisit.
- Onboarding lokal menulis `gateway.mode="local"` ke konfigurasi. Jika file konfigurasi berikutnya kehilangan `gateway.mode`, perlakukan itu sebagai kerusakan konfigurasi atau pengeditan manual yang tidak lengkap, bukan sebagai pintasan mode lokal yang valid.
- Onboarding lokal memasang Plugin unduhan yang dipilih ketika jalur penyiapan yang dipilih membutuhkannya.
- Onboarding jarak jauh hanya menulis info koneksi untuk Gateway jarak jauh dan tidak memasang paket Plugin lokal.
- `--allow-unconfigured` adalah pintasan darurat runtime gateway yang terpisah. Itu tidak berarti onboarding boleh menghilangkan `gateway.mode`.

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
- `--install-daemon` memulai jalur instalasi gateway terkelola terlebih dahulu. Tanpanya, Anda harus sudah memiliki gateway lokal yang berjalan, misalnya `openclaw gateway run`.
- Jika Anda hanya menginginkan penulisan konfigurasi/ruang kerja/bootstrap dalam otomasi, gunakan `--skip-health`.
- Jika Anda mengelola file ruang kerja sendiri, berikan `--skip-bootstrap` untuk menyetel `agents.defaults.skipBootstrap: true` dan melewati pembuatan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Pada Windows native, `--install-daemon` mencoba Scheduled Tasks terlebih dahulu dan fallback ke item login folder Startup per pengguna jika pembuatan task ditolak.

Perilaku onboarding interaktif dengan mode referensi:

- Pilih **Gunakan referensi rahasia** saat diminta.
- Lalu pilih salah satu:
  - Variabel lingkungan
  - Penyedia rahasia terkonfigurasi (`file` atau `exec`)
- Onboarding melakukan validasi preflight cepat sebelum menyimpan ref.
  - Jika validasi gagal, onboarding menampilkan kesalahan dan memungkinkan Anda mencoba lagi.

### Pilihan endpoint Z.AI non-interaktif

<Note>
`--auth-choice zai-api-key` otomatis mendeteksi endpoint dan model Z.AI terbaik untuk
kunci Anda. Endpoint Coding Plan lebih memilih `zai/glm-5.2`; endpoint API umum menggunakan
`zai/glm-5.1`. Untuk memaksa endpoint Coding Plan, pilih `zai-coding-global` atau
`zai-coding-cn`.
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
    - `quickstart`: prompt minimal, menghasilkan token gateway secara otomatis.
    - `manual`: prompt lengkap untuk port, bind, dan autentikasi (alias dari `advanced`).
    - `import`: menjalankan penyedia migrasi yang terdeteksi, menampilkan pratinjau rencana, lalu menerapkan setelah konfirmasi.

  </Accordion>
  <Accordion title="Prefilter penyedia">
    Ketika pilihan autentikasi menyiratkan penyedia pilihan, onboarding memfilter sebelumnya pemilih model default dan allowlist ke penyedia tersebut. Untuk Volcengine dan BytePlus, ini juga mencocokkan varian coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Jika filter penyedia pilihan belum menghasilkan model yang dimuat, onboarding fallback ke katalog tanpa filter alih-alih membiarkan pemilih kosong.

  </Accordion>
  <Accordion title="Tindak lanjut pencarian web">
    Beberapa penyedia pencarian web memicu prompt tindak lanjut khusus penyedia:

    - **Grok** dapat menawarkan penyiapan `x_search` opsional dengan profil OAuth xAI atau kunci API yang sama dan pilihan model `x_search`.
    - **Kimi** dapat meminta region API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) dan model pencarian web Kimi default.

  </Accordion>
  <Accordion title="Perilaku lain">
    - Perilaku cakupan DM onboarding lokal: [Referensi penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals).
    - Chat pertama tercepat: `openclaw dashboard` (Control UI, tanpa penyiapan saluran).
    - Penyedia kustom: hubungkan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic, termasuk penyedia hosted yang tidak tercantum. Gunakan Unknown untuk mendeteksi otomatis.
    - Jika state Hermes terdeteksi, onboarding menawarkan alur migrasi. Gunakan [Migrate](/id/cli/migrate) untuk rencana dry-run, mode overwrite, laporan, dan pemetaan persis.

  </Accordion>
</AccordionGroup>

## Perintah tindak lanjut umum

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Gunakan `openclaw setup` sebagai titik masuk onboarding terpandu yang sama. Gunakan `openclaw setup --baseline` saat Anda hanya membutuhkan konfigurasi/ruang kerja baseline, `openclaw configure` nanti untuk perubahan tertarget, dan `openclaw channels add` untuk penyiapan khusus saluran.

<Note>
`--json` tidak menyiratkan mode non-interaktif. Gunakan `--non-interactive` untuk skrip.
</Note>
