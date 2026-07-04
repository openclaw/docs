---
read_when:
    - Anda menginginkan penyiapan terpandu untuk Gateway, ruang kerja, autentikasi, saluran, dan Skills
summary: Referensi CLI untuk `openclaw onboard` (orientasi interaktif)
title: Orientasi
x-i18n:
    generated_at: "2026-07-04T20:44:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Orientasi awal terpandu lengkap untuk penyiapan Gateway lokal atau jarak jauh. Gunakan ini saat Anda ingin OpenClaw memandu autentikasi model, ruang kerja, gateway, channel, skills, dan kesehatan dalam satu alur.

## Panduan terkait

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/id/start/wizard" icon="rocket">
    Panduan langkah demi langkah untuk alur CLI interaktif.
  </Card>
  <Card title="Onboarding overview" href="/id/start/onboarding-overview" icon="map">
    Cara orientasi awal OpenClaw saling terhubung.
  </Card>
  <Card title="CLI setup reference" href="/id/start/wizard-cli-reference" icon="book">
    Keluaran, internal, dan perilaku per langkah.
  </Card>
  <Card title="CLI automation" href="/id/start/wizard-cli-automation" icon="terminal">
    Flag non-interaktif dan penyiapan terskrip.
  </Card>
  <Card title="macOS app onboarding" href="/id/start/onboarding" icon="apple">
    Alur orientasi awal untuk aplikasi bilah menu macOS.
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

`--flow import` menggunakan penyedia migrasi milik plugin seperti Hermes. Ini hanya berjalan pada penyiapan OpenClaw yang baru; jika konfigurasi, kredensial, sesi, atau file memori/identitas ruang kerja yang sudah ada ditemukan, reset atau pilih penyiapan baru sebelum mengimpor.

`--modern` memulai pratinjau orientasi awal percakapan Crestodian. Tanpa
`--modern`, `openclaw onboard` tetap menggunakan alur orientasi awal klasik.

Di terminal interaktif, `openclaw` polos (tanpa subperintah) dirutekan berdasarkan status
konfigurasi:

- Jika file konfigurasi aktif hilang atau tidak memiliki pengaturan yang ditulis (kosong atau
  hanya metadata), ini memulai alur orientasi awal klasik ini.
- Jika file konfigurasi ada tetapi gagal validasi, ini memulai
  [Crestodian](/id/cli/crestodian) untuk perbaikan.
- Jika file konfigurasi valid, ini membuka TUI agen normal, baik secara lokal
  maupun terhubung ke Gateway terkonfigurasi yang dapat dijangkau. Pada instalasi yang sudah dikonfigurasi,
  akses Crestodian dengan `/crestodian` di dalam TUI atau `openclaw crestodian`.

Plaintext `ws://` diterima untuk loopback, literal IP privat, `.local`, dan
URL gateway Tailnet `*.ts.net`. Untuk nama DNS privat tepercaya lainnya, atur
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` di lingkungan proses orientasi awal.

## Lokal

Orientasi awal interaktif menggunakan lokal wizard CLI untuk salinan penyiapan tetap. Urutan
resolusinya adalah:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Fallback bahasa Inggris

Lokal wizard yang didukung adalah `en`, `zh-CN`, dan `zh-TW`. Nilai lokal dapat menggunakan
garis bawah atau bentuk sufiks POSIX seperti `zh_CN.UTF-8`. Nama produk, nama
perintah, kunci konfigurasi, URL, ID penyedia, ID model, dan label plugin/channel
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

`--custom-api-key` bersifat opsional dalam mode non-interaktif. Jika dihilangkan, orientasi awal memeriksa `CUSTOM_API_KEY`.
OpenClaw secara otomatis menandai ID model visi umum sebagai mendukung gambar. Berikan `--custom-image-input` untuk ID visi kustom yang tidak dikenal, atau `--custom-text-input` untuk memaksa metadata hanya teks.
Gunakan `--custom-compatibility openai-responses` untuk endpoint kompatibel OpenAI yang mendukung `/v1/responses` tetapi tidak mendukung `/v1/chat/completions`.

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

`--custom-base-url` default ke `http://127.0.0.1:11434`. `--custom-model-id` bersifat opsional; jika dihilangkan, orientasi awal menggunakan default yang disarankan Ollama. ID model cloud seperti `kimi-k2.5:cloud` juga berfungsi di sini.

Simpan kunci penyedia sebagai ref alih-alih plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Dengan `--secret-input-mode ref`, orientasi awal menulis ref berbasis env alih-alih nilai kunci plaintext.
Untuk penyedia berbasis profil autentikasi, ini menulis entri `keyRef`; untuk penyedia kustom, ini menulis `models.providers.<id>.apiKey` sebagai ref env (misalnya `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrak mode `ref` non-interaktif:

- Atur variabel env penyedia di lingkungan proses orientasi awal (misalnya `OPENAI_API_KEY`).
- Jangan berikan flag kunci inline (misalnya `--openai-api-key`) kecuali variabel env tersebut juga diatur.
- Jika flag kunci inline diberikan tanpa variabel env yang diwajibkan, orientasi awal gagal cepat dengan panduan.

Opsi token Gateway dalam mode non-interaktif:

- `--gateway-auth token --gateway-token <token>` menyimpan token plaintext.
- `--gateway-auth token --gateway-token-ref-env <name>` menyimpan `gateway.auth.token` sebagai SecretRef env.
- `--gateway-token` dan `--gateway-token-ref-env` saling eksklusif.
- `--gateway-token-ref-env` mewajibkan variabel env tidak kosong di lingkungan proses orientasi awal.
- Dengan `--install-daemon`, saat autentikasi token mewajibkan token, token gateway yang dikelola SecretRef divalidasi tetapi tidak dipersistenkan sebagai plaintext yang diselesaikan dalam metadata lingkungan layanan supervisor.
- Dengan `--install-daemon`, jika mode token mewajibkan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, orientasi awal gagal tertutup dengan panduan remediasi.
- Dengan `--install-daemon`, jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, orientasi awal memblokir instalasi hingga mode diatur secara eksplisit.
- Orientasi awal lokal menulis `gateway.mode="local"` ke konfigurasi. Jika file konfigurasi berikutnya tidak memiliki `gateway.mode`, perlakukan itu sebagai kerusakan konfigurasi atau edit manual yang tidak lengkap, bukan sebagai pintasan mode lokal yang valid.
- Orientasi awal lokal memasang plugin terunduh yang dipilih saat jalur penyiapan yang dipilih membutuhkannya.
- Orientasi awal jarak jauh hanya menulis info koneksi untuk Gateway jarak jauh dan tidak memasang paket plugin lokal.
- `--allow-unconfigured` adalah escape hatch runtime gateway yang terpisah. Itu tidak berarti orientasi awal boleh menghilangkan `gateway.mode`.

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

- Kecuali Anda memberikan `--skip-health`, orientasi awal menunggu gateway lokal yang dapat dijangkau sebelum keluar dengan sukses.
- `--install-daemon` memulai jalur instalasi gateway terkelola terlebih dahulu. Tanpa itu, Anda harus sudah menjalankan gateway lokal, misalnya `openclaw gateway run`.
- Jika Anda hanya menginginkan penulisan konfigurasi/ruang kerja/bootstrap dalam otomatisasi, gunakan `--skip-health`.
- Jika Anda mengelola file ruang kerja sendiri, berikan `--skip-bootstrap` untuk mengatur `agents.defaults.skipBootstrap: true` dan melewati pembuatan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Di Windows native, `--install-daemon` mencoba Scheduled Tasks terlebih dahulu dan fallback ke item login folder Startup per pengguna jika pembuatan tugas ditolak.

Perilaku orientasi awal interaktif dengan mode referensi:

- Pilih **Use secret reference** saat diminta.
- Lalu pilih salah satu:
  - Variabel lingkungan
  - Penyedia rahasia terkonfigurasi (`file` atau `exec`)
- Orientasi awal menjalankan validasi preflight cepat sebelum menyimpan ref.
  - Jika validasi gagal, orientasi awal menampilkan kesalahan dan memungkinkan Anda mencoba lagi.

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

## Flag non-interaktif tambahan

Autentikasi model berbasis token (non-interaktif; digunakan dengan `--auth-choice token`):

- `--token-provider <id>` — ID penyedia token. Mengidentifikasi penyedia mana yang menerbitkan token.
- `--token <token>` — Nilai token untuk autentikasi model.
- `--token-profile-id <id>` — ID profil autentikasi. Penyimpanan token generik default ke `<provider>:manual`; alur penyiapan milik penyedia dapat menggunakan default mereka sendiri, seperti `anthropic:default`.
- `--token-expires-in <duration>` — Durasi kedaluwarsa token opsional (misalnya `365d`, `12h`).

Cloudflare AI Gateway (non-interaktif):

- `--cloudflare-ai-gateway-account-id <id>` — ID Akun Cloudflare untuk perutean melalui Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — ID Cloudflare AI Gateway.

Kontrol instalasi daemon:

- `--no-install-daemon` — Lewati instalasi layanan gateway secara eksplisit.
- `--skip-daemon` — Alias untuk `--no-install-daemon`.

Kontrol penyiapan UI dan hook:

- `--skip-ui` — Lewati prompt Control UI / TUI selama orientasi awal.
- `--skip-hooks` — Lewati prompt penyiapan webhook / hook selama orientasi awal.

Penekanan keluaran:

- `--suppress-gateway-token-output` — Menekan keluaran Gateway/UI yang memuat token (petunjuk token, URL login otomatis dengan token tertanam, dan peluncuran Control UI otomatis). Berguna di lingkungan terminal bersama dan CI.

## Catatan alur

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: prompt minimal, menghasilkan token gateway secara otomatis.
    - `manual`: prompt lengkap untuk port, bind, dan autentikasi (alias dari `advanced`).
    - `import`: menjalankan penyedia migrasi yang terdeteksi, mempratinjau rencana, lalu menerapkan setelah konfirmasi.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Saat pilihan autentikasi menyiratkan penyedia pilihan, orientasi awal memfilter awal pemilih model default dan daftar izinkan ke penyedia tersebut. Untuk Volcengine dan BytePlus, ini juga mencocokkan varian coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Jika filter penyedia pilihan belum menghasilkan model yang dimuat, orientasi awal fallback ke katalog tanpa filter alih-alih membiarkan pemilih kosong.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Beberapa penyedia pencarian web memicu prompt tindak lanjut khusus penyedia:

    - **Grok** dapat menawarkan penyiapan `x_search` opsional dengan profil OAuth xAI atau kunci API yang sama dan pilihan model `x_search`.
    - **Kimi** dapat meminta region API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) dan model pencarian web Kimi default.

  </Accordion>
  <Accordion title="Other behaviors">
    - Perilaku cakupan DM orientasi awal lokal: [referensi penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals).
    - Chat pertama tercepat: `openclaw dashboard` (Control UI, tanpa penyiapan channel).
    - Penyedia kustom: hubungkan endpoint kompatibel OpenAI atau Anthropic apa pun, termasuk penyedia hosted yang tidak tercantum. Gunakan Unknown untuk deteksi otomatis.
    - Jika status Hermes terdeteksi, orientasi awal menawarkan alur migrasi. Gunakan [Migrate](/id/cli/migrate) untuk rencana dry-run, mode overwrite, laporan, dan pemetaan persis.

  </Accordion>
</AccordionGroup>

## Perintah tindak lanjut umum

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Gunakan `openclaw setup` sebagai titik masuk onboarding terpandu yang sama. Gunakan `openclaw setup --baseline` saat Anda hanya memerlukan konfigurasi/ruang kerja dasar, `openclaw configure` nanti untuk perubahan terarah, dan `openclaw channels add` untuk penyiapan khusus channel.

<Note>
`--json` tidak menyiratkan mode non-interaktif. Gunakan `--non-interactive` untuk skrip.
</Note>
