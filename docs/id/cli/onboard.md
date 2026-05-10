---
read_when:
    - Anda ingin penyiapan terpandu untuk Gateway, ruang kerja, autentikasi, saluran, dan Skills
summary: Referensi CLI untuk `openclaw onboard` (orientasi awal interaktif)
title: Orientasi
x-i18n:
    generated_at: "2026-05-10T19:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 510b2bbb688605ce1bf30918e4982e783963e7d43be65f9c23cffac11248ffd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Orientasi awal terpandu penuh untuk penyiapan Gateway lokal atau jarak jauh. Gunakan ini saat Anda ingin OpenClaw memandu autentikasi model, ruang kerja, gateway, channel, skills, dan kesehatan dalam satu alur.

## Panduan terkait

<CardGroup cols={2}>
  <Card title="Hub orientasi awal CLI" href="/id/start/wizard" icon="rocket">
    Panduan langkah demi langkah untuk alur CLI interaktif.
  </Card>
  <Card title="Ikhtisar orientasi awal" href="/id/start/onboarding-overview" icon="map">
    Cara bagian-bagian orientasi awal OpenClaw saling terhubung.
  </Card>
  <Card title="Referensi penyiapan CLI" href="/id/start/wizard-cli-reference" icon="book">
    Output, internal, dan perilaku per langkah.
  </Card>
  <Card title="Otomasi CLI" href="/id/start/wizard-cli-automation" icon="terminal">
    Flag non-interaktif dan penyiapan berbasis skrip.
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

`--flow import` menggunakan penyedia migrasi milik plugin seperti Hermes. Ini hanya berjalan pada penyiapan OpenClaw yang baru; jika konfigurasi, kredensial, sesi, atau file memori/identitas ruang kerja sudah ada, reset atau pilih penyiapan baru sebelum mengimpor.

`--modern` memulai pratinjau orientasi awal percakapan Crestodian. Tanpa
`--modern`, `openclaw onboard` mempertahankan alur orientasi awal klasik.

Untuk target `ws://` jaringan privat plaintext (hanya jaringan tepercaya), setel
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` di lingkungan proses orientasi awal.
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

`--custom-api-key` bersifat opsional dalam mode non-interaktif. Jika dihilangkan, orientasi awal memeriksa `CUSTOM_API_KEY`.
OpenClaw secara otomatis menandai ID model vision umum sebagai mampu menerima gambar. Berikan `--custom-image-input` untuk ID vision kustom yang tidak dikenal, atau `--custom-text-input` untuk memaksa metadata hanya teks.

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
Untuk penyedia berbasis profil autentikasi, ini menulis entri `keyRef`; untuk penyedia kustom, ini menulis `models.providers.<id>.apiKey` sebagai ref env (misalnya `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrak mode `ref` non-interaktif:

- Setel variabel env penyedia di lingkungan proses orientasi awal (misalnya `OPENAI_API_KEY`).
- Jangan berikan flag kunci inline (misalnya `--openai-api-key`) kecuali variabel env tersebut juga disetel.
- Jika flag kunci inline diberikan tanpa variabel env yang diwajibkan, orientasi awal gagal cepat dengan panduan.

Opsi token Gateway dalam mode non-interaktif:

- `--gateway-auth token --gateway-token <token>` menyimpan token plaintext.
- `--gateway-auth token --gateway-token-ref-env <name>` menyimpan `gateway.auth.token` sebagai SecretRef env.
- `--gateway-token` dan `--gateway-token-ref-env` saling eksklusif.
- `--gateway-token-ref-env` memerlukan variabel env yang tidak kosong di lingkungan proses orientasi awal.
- Dengan `--install-daemon`, saat autentikasi token memerlukan token, token gateway yang dikelola SecretRef divalidasi tetapi tidak dipersistensikan sebagai plaintext yang sudah di-resolve dalam metadata lingkungan layanan supervisor.
- Dengan `--install-daemon`, jika mode token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat di-resolve, orientasi awal gagal tertutup dengan panduan remediasi.
- Dengan `--install-daemon`, jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, orientasi awal memblokir instalasi sampai mode disetel secara eksplisit.
- Orientasi awal lokal menulis `gateway.mode="local"` ke dalam konfigurasi. Jika file konfigurasi berikutnya tidak memiliki `gateway.mode`, perlakukan itu sebagai kerusakan konfigurasi atau edit manual yang belum lengkap, bukan sebagai pintasan mode lokal yang valid.
- Orientasi awal lokal menginstal plugin unduhan yang dipilih saat jalur penyiapan yang dipilih memerlukannya.
- Orientasi awal jarak jauh hanya menulis info koneksi untuk Gateway jarak jauh dan tidak menginstal paket plugin lokal.
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

- Kecuali Anda memberikan `--skip-health`, orientasi awal menunggu gateway lokal yang dapat dijangkau sebelum berhasil keluar.
- `--install-daemon` memulai jalur instalasi gateway terkelola terlebih dahulu. Tanpanya, Anda harus sudah menjalankan gateway lokal, misalnya `openclaw gateway run`.
- Jika Anda hanya menginginkan penulisan konfigurasi/ruang kerja/bootstrap dalam otomasi, gunakan `--skip-health`.
- Jika Anda mengelola file ruang kerja sendiri, berikan `--skip-bootstrap` untuk menyetel `agents.defaults.skipBootstrap: true` dan melewati pembuatan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Di Windows native, `--install-daemon` mencoba Scheduled Tasks terlebih dahulu dan fallback ke item login folder Startup per pengguna jika pembuatan tugas ditolak.

Perilaku orientasi awal interaktif dengan mode referensi:

- Pilih **Gunakan referensi rahasia** saat diminta.
- Lalu pilih salah satu:
  - Variabel lingkungan
  - Penyedia rahasia yang dikonfigurasi (`file` atau `exec`)
- Orientasi awal melakukan validasi preflight cepat sebelum menyimpan ref.
  - Jika validasi gagal, orientasi awal menampilkan error dan memungkinkan Anda mencoba lagi.

### Pilihan endpoint Z.AI non-interaktif

<Note>
`--auth-choice zai-api-key` otomatis mendeteksi endpoint Z.AI terbaik untuk kunci Anda (mengutamakan API umum dengan `zai/glm-5.1`). Jika Anda secara khusus menginginkan endpoint GLM Coding Plan, pilih `zai-coding-global` atau `zai-coding-cn`.
</Note>

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

## Catatan alur

<AccordionGroup>
  <Accordion title="Jenis alur">
    - `quickstart`: prompt minimal, otomatis membuat token gateway.
    - `manual`: prompt lengkap untuk port, bind, dan auth (alias dari `advanced`).
    - `import`: menjalankan penyedia migrasi yang terdeteksi, menampilkan pratinjau rencana, lalu menerapkannya setelah konfirmasi.

  </Accordion>
  <Accordion title="Prafilter penyedia">
    Saat pilihan auth mengimplikasikan penyedia pilihan, orientasi awal memfilter lebih dulu pemilih model default dan allowlist ke penyedia tersebut. Untuk Volcengine dan BytePlus, ini juga mencocokkan varian coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Jika filter penyedia pilihan belum menghasilkan model yang dimuat, orientasi awal fallback ke katalog tanpa filter, bukan membiarkan pemilih kosong.

  </Accordion>
  <Accordion title="Tindak lanjut pencarian web">
    Beberapa penyedia pencarian web memicu prompt tindak lanjut khusus penyedia:

    - **Grok** dapat menawarkan penyiapan `x_search` opsional dengan `XAI_API_KEY` yang sama dan pilihan model `x_search`.
    - **Kimi** dapat meminta region API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) dan model pencarian web Kimi default.

  </Accordion>
  <Accordion title="Perilaku lain">
    - Perilaku cakupan DM orientasi awal lokal: [Referensi penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals).
    - Chat pertama tercepat: `openclaw dashboard` (UI Kontrol, tanpa penyiapan channel).
    - Penyedia kustom: hubungkan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic, termasuk penyedia terhosting yang tidak tercantum. Gunakan Unknown untuk deteksi otomatis.
    - Jika status Hermes terdeteksi, orientasi awal menawarkan alur migrasi. Gunakan [Migrasi](/id/cli/migrate) untuk rencana dry-run, mode timpa, laporan, dan pemetaan persis.

  </Accordion>
</AccordionGroup>

## Perintah tindak lanjut umum

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Gunakan `openclaw setup` sebagai gantinya saat Anda hanya memerlukan konfigurasi/ruang kerja baseline. Gunakan `openclaw configure` nanti untuk perubahan tertarget dan `openclaw channels add` untuk penyiapan khusus channel.

<Note>
`--json` tidak mengimplikasikan mode non-interaktif. Gunakan `--non-interactive` untuk skrip.
</Note>
