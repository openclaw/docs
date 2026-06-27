---
read_when:
    - Anda menginginkan penyiapan terpandu untuk gateway, ruang kerja, autentikasi, channel, dan skills
summary: Referensi CLI untuk `openclaw onboard` (onboarding interaktif)
title: Orientasi
x-i18n:
    generated_at: "2026-06-27T17:20:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Orientasi awal terpandu penuh untuk penyiapan Gateway lokal atau jarak jauh. Gunakan ini saat Anda ingin OpenClaw memandu autentikasi model, ruang kerja, gateway, kanal, Skills, dan kesehatan dalam satu alur.

## Panduan terkait

<CardGroup cols={2}>
  <Card title="Hub orientasi awal CLI" href="/id/start/wizard" icon="rocket">
    Panduan langkah demi langkah untuk alur CLI interaktif.
  </Card>
  <Card title="Ikhtisar orientasi awal" href="/id/start/onboarding-overview" icon="map">
    Cara orientasi awal OpenClaw tersusun.
  </Card>
  <Card title="Referensi penyiapan CLI" href="/id/start/wizard-cli-reference" icon="book">
    Keluaran, internal, dan perilaku per langkah.
  </Card>
  <Card title="Automasi CLI" href="/id/start/wizard-cli-automation" icon="terminal">
    Flag non-interaktif dan penyiapan berskrip.
  </Card>
  <Card title="Orientasi awal aplikasi macOS" href="/id/start/onboarding" icon="apple">
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

`--flow import` menggunakan penyedia migrasi milik plugin seperti Hermes. Ini hanya berjalan pada penyiapan OpenClaw baru; jika konfigurasi, kredensial, sesi, atau file memori/identitas ruang kerja sudah ada, reset atau pilih penyiapan baru sebelum mengimpor.

`--modern` memulai pratinjau orientasi awal percakapan Crestodian. Tanpa
`--modern`, `openclaw onboard` mempertahankan alur orientasi awal klasik.

Pada instalasi baru ketika file konfigurasi aktif tidak ada atau tidak memiliki
pengaturan yang ditulis (kosong atau hanya metadata), `openclaw` tanpa argumen juga memulai alur
orientasi awal klasik. Setelah file konfigurasi memiliki pengaturan yang ditulis, `openclaw`
tanpa argumen membuka Crestodian sebagai gantinya.

Plaintext `ws://` diterima untuk loopback, literal IP privat, `.local`, dan
URL Gateway Tailnet `*.ts.net`. Untuk nama private-DNS tepercaya lainnya, atur
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
perintah, kunci konfigurasi, URL, ID penyedia, ID model, dan label plugin/kanal
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
OpenClaw menandai ID model visi umum sebagai mendukung gambar secara otomatis. Berikan `--custom-image-input` untuk ID visi kustom yang tidak dikenal, atau `--custom-text-input` untuk memaksa metadata hanya teks.
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

`--custom-base-url` default ke `http://127.0.0.1:11434`. `--custom-model-id` bersifat opsional; jika dihilangkan, orientasi awal menggunakan default yang disarankan Ollama. ID model cloud seperti `kimi-k2.5:cloud` juga berfungsi di sini.

Simpan kunci penyedia sebagai ref, bukan plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Dengan `--secret-input-mode ref`, orientasi awal menulis ref berbasis env, bukan nilai kunci plaintext.
Untuk penyedia berbasis auth-profile, ini menulis entri `keyRef`; untuk penyedia kustom, ini menulis `models.providers.<id>.apiKey` sebagai ref env (misalnya `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrak mode `ref` non-interaktif:

- Atur variabel env penyedia di lingkungan proses orientasi awal (misalnya `OPENAI_API_KEY`).
- Jangan berikan flag kunci inline (misalnya `--openai-api-key`) kecuali variabel env tersebut juga sudah diatur.
- Jika flag kunci inline diberikan tanpa variabel env yang diperlukan, orientasi awal gagal cepat dengan panduan.

Opsi token Gateway dalam mode non-interaktif:

- `--gateway-auth token --gateway-token <token>` menyimpan token plaintext.
- `--gateway-auth token --gateway-token-ref-env <name>` menyimpan `gateway.auth.token` sebagai SecretRef env.
- `--gateway-token` dan `--gateway-token-ref-env` saling eksklusif.
- `--gateway-token-ref-env` memerlukan variabel env yang tidak kosong di lingkungan proses orientasi awal.
- Dengan `--install-daemon`, ketika auth token memerlukan token, token gateway yang dikelola SecretRef divalidasi tetapi tidak dipertahankan sebagai plaintext yang di-resolve dalam metadata lingkungan layanan supervisor.
- Dengan `--install-daemon`, jika mode token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat di-resolve, orientasi awal gagal tertutup dengan panduan remediasi.
- Dengan `--install-daemon`, jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` belum diatur, orientasi awal memblokir instalasi sampai mode diatur secara eksplisit.
- Orientasi awal lokal menulis `gateway.mode="local"` ke konfigurasi. Jika file konfigurasi berikutnya tidak memiliki `gateway.mode`, perlakukan itu sebagai kerusakan konfigurasi atau edit manual yang tidak lengkap, bukan sebagai pintasan mode lokal yang valid.
- Orientasi awal lokal menginstal plugin unduhan yang dipilih ketika jalur penyiapan yang dipilih memerlukannya.
- Orientasi awal jarak jauh hanya menulis info koneksi untuk Gateway jarak jauh dan tidak menginstal paket plugin lokal.
- `--allow-unconfigured` adalah escape hatch runtime gateway terpisah. Ini tidak berarti orientasi awal boleh menghilangkan `gateway.mode`.

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

- Kecuali Anda memberikan `--skip-health`, orientasi awal menunggu gateway lokal yang dapat dijangkau sebelum berhasil keluar.
- `--install-daemon` memulai jalur instalasi gateway terkelola terlebih dahulu. Tanpanya, Anda harus sudah menjalankan gateway lokal, misalnya `openclaw gateway run`.
- Jika Anda hanya menginginkan penulisan konfigurasi/ruang kerja/bootstrap dalam automasi, gunakan `--skip-health`.
- Jika Anda mengelola file ruang kerja sendiri, berikan `--skip-bootstrap` untuk mengatur `agents.defaults.skipBootstrap: true` dan melewati pembuatan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Pada Windows native, `--install-daemon` mencoba Scheduled Tasks terlebih dahulu dan fallback ke item login folder Startup per pengguna jika pembuatan tugas ditolak.

Perilaku orientasi awal interaktif dengan mode referensi:

- Pilih **Gunakan referensi rahasia** saat diminta.
- Lalu pilih salah satu:
  - Variabel lingkungan
  - Penyedia rahasia yang dikonfigurasi (`file` atau `exec`)
- Orientasi awal melakukan validasi preflight cepat sebelum menyimpan ref.
  - Jika validasi gagal, orientasi awal menampilkan kesalahan dan memungkinkan Anda mencoba lagi.

### Pilihan endpoint Z.AI non-interaktif

<Note>
`--auth-choice zai-api-key` mendeteksi otomatis endpoint dan model Z.AI terbaik untuk
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
    - `manual`: prompt lengkap untuk port, bind, dan auth (alias dari `advanced`).
    - `import`: menjalankan penyedia migrasi yang terdeteksi, mempratinjau rencana, lalu menerapkan setelah konfirmasi.

  </Accordion>
  <Accordion title="Prafilter penyedia">
    Ketika pilihan auth menyiratkan penyedia pilihan, orientasi awal memfilter sebelumnya pemilih model default dan allowlist ke penyedia tersebut. Untuk Volcengine dan BytePlus, ini juga mencocokkan varian coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Jika filter penyedia pilihan belum menghasilkan model yang dimuat, orientasi awal fallback ke katalog tanpa filter alih-alih membiarkan pemilih kosong.

  </Accordion>
  <Accordion title="Tindak lanjut penelusuran web">
    Beberapa penyedia penelusuran web memicu prompt tindak lanjut khusus penyedia:

    - **Grok** dapat menawarkan penyiapan `x_search` opsional dengan profil OAuth xAI atau kunci API yang sama dan pilihan model `x_search`.
    - **Kimi** dapat meminta region API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) dan model penelusuran web Kimi default.

  </Accordion>
  <Accordion title="Perilaku lain">
    - Perilaku cakupan DM orientasi awal lokal: [Referensi penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals).
    - Obrolan pertama tercepat: `openclaw dashboard` (Control UI, tanpa penyiapan kanal).
    - Penyedia kustom: hubungkan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic, termasuk penyedia hosted yang tidak tercantum. Gunakan Unknown untuk mendeteksi otomatis.
    - Jika status Hermes terdeteksi, orientasi awal menawarkan alur migrasi. Gunakan [Migrasi](/id/cli/migrate) untuk rencana dry-run, mode timpa, laporan, dan pemetaan persis.

  </Accordion>
</AccordionGroup>

## Perintah tindak lanjut umum

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Gunakan `openclaw setup` sebagai gantinya ketika Anda hanya memerlukan konfigurasi/ruang kerja dasar. Gunakan `openclaw configure` nanti untuk perubahan tertarget dan `openclaw channels add` untuk penyiapan khusus kanal.

<Note>
`--json` tidak menyiratkan mode non-interaktif. Gunakan `--non-interactive` untuk skrip.
</Note>
