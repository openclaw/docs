---
read_when:
    - Anda menginginkan satu kunci terkelola untuk beberapa penyedia model
    - Anda memerlukan penemuan model atau pelaporan kuota ClawRouter di OpenClaw
summary: Rutekan model dengan cakupan kredensial melalui ClawRouter dan tampilkan kuota terkelola
title: ClawRouter
x-i18n:
    generated_at: "2026-07-19T05:08:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 929a93e8d1d003e21f792d0fdab9542553ffab374f59d4d0505819b0f719591f
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter memberi OpenClaw satu kunci dengan cakupan kebijakan untuk beberapa penyedia model
upstream. Plugin `clawrouter` bawaan hanya menemukan model yang diizinkan
untuk kunci tersebut, merutekan setiap model melalui protokol yang dideklarasikannya, dan melaporkan
anggaran kunci serta penggunaan agregat pada antarmuka penggunaan OpenClaw.

Kredensial upstream dan penerusan khusus penyedia tetap berada di ClawRouter, sehingga
Anda tidak perlu memasang atau mengautentikasi setiap plugin penyedia upstream pada
host OpenClaw. Plugin ini disertakan bersama OpenClaw (`enabledByDefault: true`);
Anda hanya memerlukan kredensial ClawRouter yang telah diterbitkan.

| Properti      | Nilai                                    |
| ------------- | ---------------------------------------- |
| Penyedia      | `clawrouter`                             |
| Plugin        | bawaan (disertakan dalam OpenClaw)           |
| Autentikasi   | `CLAWROUTER_API_KEY`                     |
| URL default   | `https://clawrouter.openclaw.ai`         |
| Katalog model | Dicakup oleh kredensial melalui `/v1/catalog`      |
| Kuota         | Anggaran dan penggunaan bulanan melalui `/v1/usage` |

## Memulai

<Steps>
  <Step title="Dapatkan kredensial dengan cakupan">
    Minta kredensial kepada administrator ClawRouter Anda dengan kebijakan yang mencakup
    penyedia, model, dan anggaran bulanan yang harus digunakan. Kredensial hanya
    ditampilkan satu kali saat diterbitkan.
  </Step>
  <Step title="Konfigurasikan OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` merupakan bawaan dan diaktifkan secara default. Jika konfigurasi Anda menetapkan
    `plugins.allow`, tambahkan `clawrouter` ke daftar tersebut sebelum mengaktifkannya. Untuk
    deployment khusus, tetapkan `models.providers.clawrouter.baseUrl` ke
    origin ClawRouter; nilai defaultnya adalah `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Cantumkan model yang diberikan">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Gunakan referensi model yang dikembalikan persis seperti yang ditampilkan. Referensi tersebut mempertahankan namespace
    upstream, seperti `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6`, atau
    `clawrouter/google/gemini-3.5-flash`. Jika `agents.defaults.modelPolicy.allow`
    dikonfigurasi, tambahkan setiap referensi ClawRouter yang dipilih ke dalamnya.

  </Step>
  <Step title="Pilih model">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Anda juga dapat memilih model yang dikembalikan untuk satu kali eksekusi dengan
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Deployment noninteraktif terkelola

Simpan kunci proksi dalam injeksi secret beban kerja dan hanya simpan
SecretRef di `openclaw.json`. Bidang terkelola kanonisnya adalah:

| Tujuan        | Bidang konfigurasi atau lingkungan                                         |
| ------------- | -------------------------------------------------------------------------- |
| Origin router | `models.providers.clawrouter.baseUrl`                                    |
| Kredensial    | `models.providers.clawrouter.apiKey` -> SecretRef env                    |
| Nilai secret  | `CLAWROUTER_API_KEY` dalam lingkungan proses gateway                  |
| Model default | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| Tag beban kerja | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (opsional) |

Sebagai contoh, pengontrol deployment dapat mengelola patch JSON5 ini:

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

Jika deployment menetapkan `plugins.allow`, pertahankan entri yang ada dan tambahkan
`clawrouter`. Validasi dan terapkan tanpa wizard interaktif:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

Uji coba kering me-resolve SecretRef tetapi tidak pernah mencetak nilainya. Untuk merotasi
kredensial, perbarui Secret eksternal yang menyediakan `CLAWROUTER_API_KEY` dan
mulai ulang beban kerja gateway agar lingkungan proses baru dimuat. File
konfigurasi dan referensi model tidak berubah.

Untuk gateway Docker mandiri yang dibangun dari sumber, ClawRouter sudah disertakan dalam
runtime root. Pilih hanya plugin saluran yang memerlukan pengemasan terpisah,
seperti `OPENCLAW_EXTENSIONS=clickclack`, `slack`, atau `msteams`; lihat
[citra yang dibangun dari sumber dengan plugin terpilih](/id/install/docker#source-built-images-with-selected-plugins).
Deployment arsip/perangkat harus mengemas sumber yang sama yang telah digabungkan melalui
pipeline artefak mereka sendiri, bukan menggunakan citra OCI.

## Kesiapan dan pembuktian langsung

Pemeriksaan ini membuktikan batas yang berbeda; jangan menggantikan satu dengan yang lain:

```bash
# Hanya kesehatan proses ClawRouter; tidak ada kredensial atau model upstream yang diuji.
curl -fsS https://clawrouter.internal.example/v1/health

# Hanya kesiapan startup gateway OpenClaw; tidak ada panggilan model yang dilakukan.
curl -fsS http://127.0.0.1:18789/readyz

# Penemuan katalog dengan cakupan kredensial.
openclaw models list --all --provider clawrouter --json

# Probe inferensi nyata minimal melalui penyedia ClawRouter yang dikonfigurasi.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Canary beban kerja menggunakan referensi model yang diberikan secara persis.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Balas persis: CLAWROUTER_CANARY_OK" \
  --json
```

Gunakan model yang dikembalikan oleh katalog tercakup, bukan menyalin model contoh
secara membuta. Respons `/readyz` yang berhasil berarti gateway dapat melayani
permintaan; hal itu tidak menyatakan bahwa ClawRouter, kredensialnya, atau penyedia
upstream sudah siap. Probe model dan canary agen merupakan bukti inferensi.

Untuk diagnosis langsung, jalankan canary dan periksa log standar gateway.
Diagnostik transportasi model yang hanya berisi metadata menghasilkan baris dengan bentuk seperti:

```text
[model-fetch] mulai provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] respons provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Plugin mengirim header `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id`, dan
`X-ClawRouter-Session-Id` yang dibatasi ketika pengidentifikasi tersebut tersedia. Plugin juga
memetakan `callId` diagnostik panggilan model (`<run-id>:model:<n>`) ke
`X-Request-ID`, sehingga peristiwa panggilan model OpenClaw dapat digabungkan dengan jejak
audit ClawRouter yang hanya berisi metadata. Nilai dalam batas request-id 128 karakter
bersifat identik. Nilai yang lebih panjang mempertahankan sufiks `:model:<n>` dan hash
deterministik agar panggilan yang berbeda tetap terbatas dan dapat digabungkan. Metadata deployment
statis seperti `X-ClawRouter-Project-Id` dapat ditetapkan dalam peta `headers`
penyedia. Header atribusi agen dan sesi mempertahankan batas 256 karakter
yang terpisah. ID permintaan otomatis yang memuat karakter di luar kumpulan
pengidentifikasi ASCII ClawRouter menggunakan bentuk deterministik terbatas yang sama.
Header eksplisit yang dikonfigurasi, termasuk variasi kapitalisasi apa pun dari `X-Request-ID`, lebih
diutamakan daripada nilai otomatis. Diagnostik transportasi mencatat metadata perutean dan respons;
diagnostik tersebut tidak mencatat kredensial, ID permintaan, prompt, atau hasil penyelesaian.
Peristiwa audit ClawRouter sendiri menyediakan penyedia upstream yang dipilih dan
status retensi konten.

## Penemuan model

`GET /v1/catalog` mengembalikan `{ providers: [...] }`, dengan setiap entri penyedia
mencantumkan `models[]` miliknya sendiri (dengan ID upstream, kemampuan, dan harga) serta
rute permintaan yang didukungnya. OpenClaw tidak menyertakan daftar tetap kedua untuk
model ClawRouter. Model katalog ditampilkan sebagai model OpenClaw ketika:

- kebijakan kredensial memberikan akses ke penyedianya;
- model katalog mengiklankan kemampuan LLM yang didukung (`llm.responses`,
  `llm.chat`, `llm.messages`, atau `llm.stream` dengan rute streaming
  yang cocok); dan
- penyedia mengekspos rute yang cocok untuk salah satu transportasi di bawah ini.

Menambahkan model ke penyedia ClawRouter yang didukung tidak memerlukan rilis OpenClaw:
penyegaran katalog berikutnya (di-cache selama 60 detik per cakupan kredensial) akan menemukannya.
Model yang memerlukan protokol wire baru terlebih dahulu memerlukan dukungan plugin.

## Protokol dan plugin penyedia

ClawRouter mengelola kredensial upstream; katalognya memberi tahu OpenClaw transportasi mana
yang harus digunakan, sehingga Anda tidak perlu memasang plugin autentikasi setiap perusahaan upstream.

| Kemampuan/rute katalog                                | Transportasi OpenClaw     |
| ----------------------------------------------------- | ------------------------- |
| `llm.responses` (penyedia yang kompatibel dengan OpenAI)             | `openai-responses`     |
| `llm.chat` (penyedia yang kompatibel dengan OpenAI)                  | `openai-completions`   |
| `llm.messages` + rute `anthropic.messages`              | `anthropic-messages`   |
| `llm.stream` + rute streaming `google.generate_content` | `google-generative-ai` |

Plugin juga menerapkan kebijakan replay dan skema alat yang cocok untuk
keluarga tersebut (kompatibilitas skema alat OpenAI/DeepSeek/Gemini/Perplexity; kebijakan
replay native Anthropic dan Google Gemini). Model Perplexity mendapatkan penulisan ulang
skema yang ketat: `patternProperties` dan `additionalProperties` dihapus dan
setiap skema objek mendeklarasikan `properties`, karena Perplexity menolak skema alat
tanpanya. Penyedia katalog yang hanya mengekspos format permintaan
yang tidak didukung sengaja tidak ditampilkan sebagai model teks OpenClaw.
Normalisasikan penyedia tersebut ke salah satu kontrak yang didukung di
ClawRouter, alih-alih mengirim payload yang tidak kompatibel.

## Kuota dan penggunaan

Respons `/v1/usage` ClawRouter memasok antarmuka penggunaan penyedia
OpenClaw standar: total permintaan, token, dan pengeluaran, serta periode anggaran bulanan ketika
kunci memiliki batas. Kunci tanpa pengukuran tetap menampilkan penggunaan agregat tanpa
periode persentase.

Pencarian kuota menggunakan kunci tercakup yang sama dengan penemuan model. Kegagalan
pencarian kuota tidak memblokir eksekusi model.

Periksa snapshot langsung dengan:

```bash
openclaw status --usage
openclaw models status
```

Snapshot penyedia yang sama tersedia bagi `/status` dalam obrolan dan UI
penggunaan OpenClaw. Anggaran berlaku untuk seluruh kebijakan, sehingga permintaan yang dibuat oleh klien lain menggunakan
kebijakan ClawRouter yang sama dapat mengubah persentase yang tersisa.

## Pemecahan masalah

| Gejala                                   | Pemeriksaan                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tidak ada model ClawRouter               | Pastikan plugin diaktifkan dan diizinkan oleh `plugins.allow`, lalu periksa bahwa kredensial aktif dan memberikan akses ke setidaknya satu penyedia yang siap. |
| Model ClawRouter yang dikonfigurasi tidak ada | Periksa kemampuan `/v1/catalog` dan dukungan rutenya. Kontrak transportasi yang tidak didukung sengaja difilter.                            |
| Penggantian model ditolak oleh kebijakan | Tambahkan referensi katalog persis atau `clawrouter/*` ke `agents.defaults.modelPolicy.allow`.                                                            |
| `401` atau `403` dari katalog atau penggunaan     | Terbitkan ulang atau ubah cakupan kredensial ClawRouter; OpenClaw tidak beralih kembali ke kunci penyedia upstream.                                          |
| Panggilan model gagal setelah penemuan   | Periksa koneksi penyedia dan kesehatan upstream di ClawRouter, lalu coba lagi setelah status kesiapannya pulih.                                |
| Penggunaan memiliki total tetapi tanpa persentase | Kebijakannya tidak diukur; tambahkan anggaran bulanan di ClawRouter untuk menampilkan periode persentase.                                                     |

## Perilaku keamanan

- Penemuan katalog dibatasi pada kunci proksi yang dikonfigurasi dan disimpan dalam cache per cakupan kredensial (direktori agen, direktori ruang kerja, id profil autentikasi, dan URL dasar).
- Kunci proksi hanya disertakan saat pengiriman permintaan; kunci tersebut tidak disimpan dalam metadata model.
- Nilai atribusi otomatis dan korelasi permintaan dipangkas serta ditolak jika mengandung karakter kontrol sebelum pengiriman. Nilai atribusi dibatasi hingga 256 karakter; id permintaan dibatasi hingga 128.
- Diagnostik transportasi model hanya berisi metadata dan tidak pernah menyertakan kunci proksi atau konten model.
- Id model asli Anthropic dan Gemini ditulis ulang menjadi id upstream-nya hanya saat pengiriman.
- Baris katalog yang tidak didukung atau belum diberi izin akan gagal secara tertutup dan tidak dapat dipilih.

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Konfigurasi penyedia dan pemilihan model.
  </Card>
  <Card title="Pelacakan penggunaan" href="/id/concepts/usage-tracking" icon="chart-line">
    Antarmuka penggunaan dan status OpenClaw.
  </Card>
</CardGroup>
