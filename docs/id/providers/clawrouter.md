---
read_when:
    - Anda menginginkan satu kunci terkelola untuk beberapa penyedia model
    - Anda memerlukan penemuan model ClawRouter atau pelaporan kuota di OpenClaw
summary: Rutekan model yang dibatasi berdasarkan kredensial melalui ClawRouter dan tampilkan kuota terkelola
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T18:33:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter memberi OpenClaw satu kunci dengan cakupan kebijakan untuk beberapa penyedia
model upstream. Plugin `clawrouter` bawaan hanya menemukan model yang diizinkan
untuk kunci tersebut, merutekan setiap model melalui protokol yang dinyatakannya, dan melaporkan
anggaran kunci serta penggunaan agregat pada permukaan penggunaan OpenClaw.

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
  <Step title="Dapatkan kredensial tercakup">
    Mintalah kredensial kepada administrator ClawRouter Anda yang kebijakannya mencakup
    penyedia, model, dan anggaran bulanan yang seharusnya Anda gunakan. Kredensial hanya
    ditampilkan sekali saat diterbitkan.
  </Step>
  <Step title="Konfigurasikan OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` disertakan dan diaktifkan secara default. Jika konfigurasi Anda menetapkan
    `plugins.allow`, tambahkan `clawrouter` ke daftar tersebut sebelum mengaktifkannya. Untuk
    penerapan khusus, tetapkan `models.providers.clawrouter.baseUrl` ke
    origin ClawRouter; nilai defaultnya adalah `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Cantumkan model yang diberikan">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Gunakan referensi model yang dikembalikan persis seperti yang ditampilkan. Referensi tersebut mempertahankan namespace
    upstream, seperti `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6`, atau
    `clawrouter/google/gemini-3.5-flash`. Jika `agents.defaults.models` merupakan
    daftar izin dalam konfigurasi Anda, tambahkan setiap referensi ClawRouter yang dipilih ke dalamnya.

  </Step>
  <Step title="Pilih model">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Anda juga dapat memilih model yang dikembalikan untuk satu kali proses dengan
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Penerapan noninteraktif terkelola

Simpan kunci proksi dalam injeksi rahasia beban kerja dan hanya simpan
SecretRef di `openclaw.json`. Bidang terkelola kanonisnya adalah:

| Tujuan        | Bidang konfigurasi atau lingkungan                                           |
| ------------- | ------------------------------------------------------------------------ |
| Origin router | `models.providers.clawrouter.baseUrl`                                    |
| Kredensial    | `models.providers.clawrouter.apiKey` -> SecretRef env                    |
| Nilai rahasia | `CLAWROUTER_API_KEY` di lingkungan proses gateway                  |
| Model default | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| Tag beban kerja | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (opsional) |

Sebagai contoh, pengontrol penerapan dapat memiliki patch JSON5 ini:

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

Jika penerapan menetapkan `plugins.allow`, pertahankan entri yang sudah ada dan tambahkan
`clawrouter`. Validasi dan terapkan tanpa wizard interaktif:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

Uji coba kering menyelesaikan SecretRef tetapi tidak pernah mencetak nilainya. Untuk merotasi
kredensial, perbarui Secret eksternal yang memasok `CLAWROUTER_API_KEY` dan
mulai ulang beban kerja gateway agar lingkungan proses baru dimuat. Berkas
konfigurasi dan referensi model tidak berubah.

Untuk gateway Docker mandiri yang dibangun dari sumber, ClawRouter sudah disertakan dalam
runtime root. Pilih hanya plugin saluran yang memerlukan pengemasan terpisah,
seperti `OPENCLAW_EXTENSIONS=clickclack`, `slack`, atau `msteams`; lihat
[citra yang dibangun dari sumber dengan plugin terpilih](/id/install/docker#source-built-images-with-selected-plugins).
Penerapan arsip/perangkat harus mengemas sumber yang sama yang telah diterapkan melalui
pipeline artefaknya sendiri, bukan menggunakan citra OCI.

## Kesiapan dan pembuktian langsung

Pemeriksaan ini membuktikan batas yang berbeda; jangan mengganti satu dengan yang lain:

```bash
# Hanya kesehatan proses ClawRouter; tidak ada kredensial atau model upstream yang diuji.
curl -fsS https://clawrouter.internal.example/v1/health

# Hanya kesiapan awal gateway OpenClaw; tidak ada panggilan model yang dilakukan.
curl -fsS http://127.0.0.1:18789/readyz

# Penemuan katalog yang dicakup kredensial.
openclaw models list --all --provider clawrouter --json

# Probe inferensi nyata minimal melalui penyedia ClawRouter yang dikonfigurasi.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Canary beban kerja menggunakan referensi model yang diberikan secara persis.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Balas persis: CLAWROUTER_CANARY_OK" \
  --json
```

Gunakan model yang dikembalikan oleh katalog tercakup, alih-alih menyalin model
contoh secara membuta. Respons `/readyz` yang berhasil berarti gateway dapat melayani
permintaan; respons tersebut tidak menyatakan bahwa ClawRouter, kredensialnya, atau penyedia
upstream telah siap. Probe model dan canary agen merupakan bukti inferensi.

Untuk diagnosis langsung, jalankan canary dan periksa log standar gateway.
Diagnostik transportasi model yang hanya memuat metadata dan sudah ada menghasilkan baris berbentuk:

```text
[model-fetch] mulai penyedia=clawrouter api=openai-responses model=openai/gpt-5.5 metode=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] respons penyedia=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Plugin mengirim header `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id`, dan
`X-ClawRouter-Session-Id` yang dibatasi saat pengenal tersebut tersedia. Plugin juga
memetakan `callId` (`<run-id>:model:<n>`) diagnostik panggilan model ke
`X-Request-ID`, sehingga peristiwa panggilan model OpenClaw dapat digabungkan dengan jejak
audit ClawRouter yang hanya memuat metadata. Nilai dalam batas ID permintaan 128 karakter
bersifat identik. Nilai yang lebih panjang mempertahankan akhiran `:model:<n>` dan hash
deterministik agar panggilan yang berbeda tetap dibatasi dan dapat digabungkan. Metadata penerapan statis
seperti `X-ClawRouter-Project-Id` dapat ditetapkan dalam peta `headers` penyedia.
Header atribusi agen dan sesi mempertahankan batas 256 karakternya
secara terpisah. ID permintaan otomatis yang berisi karakter di luar set
pengenal ASCII ClawRouter menggunakan bentuk deterministik terbatas yang sama.
Header eksplisit yang dikonfigurasi, termasuk variasi kapitalisasi `X-Request-ID` apa pun, lebih
diutamakan daripada nilai otomatis. Diagnostik transportasi mencatat metadata perutean dan
respons; diagnostik tersebut tidak mencatat kredensial, ID permintaan, prompt, atau penyelesaian.
Peristiwa audit ClawRouter sendiri menyediakan penyedia upstream yang dipilih dan
status retensi konten.

## Penemuan model

`GET /v1/catalog` mengembalikan `{ providers: [...] }`, dengan setiap entri penyedia
mencantumkan `models[]` miliknya sendiri (beserta ID upstream, kemampuan, dan harga) serta
rute permintaan yang didukungnya. OpenClaw tidak menyertakan daftar tetap kedua untuk
model ClawRouter. Model katalog diiklankan sebagai model OpenClaw ketika:

- kebijakan kredensial memberikan akses ke penyedianya;
- model katalog mengiklankan kemampuan LLM yang didukung (`llm.responses`,
  `llm.chat`, `llm.messages`, atau `llm.stream` dengan rute streaming
  yang sesuai); dan
- penyedia mengekspos rute yang sesuai untuk salah satu transportasi di bawah ini.

Menambahkan model ke penyedia ClawRouter yang didukung tidak memerlukan rilis OpenClaw:
penyegaran katalog berikutnya (di-cache selama 60 detik per cakupan kredensial) akan menemukannya.
Model yang memerlukan protokol kabel baru terlebih dahulu memerlukan dukungan plugin.

## Protokol dan plugin penyedia

ClawRouter memiliki kredensial upstream; katalognya memberi tahu OpenClaw transportasi
mana yang harus digunakan, sehingga Anda tidak perlu memasang plugin autentikasi setiap perusahaan upstream.

| Kemampuan/rute katalog                               | Transportasi OpenClaw     |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses` (penyedia yang kompatibel dengan OpenAI)             | `openai-responses`     |
| `llm.chat` (penyedia yang kompatibel dengan OpenAI)                  | `openai-completions`   |
| `llm.messages` + rute `anthropic.messages`              | `anthropic-messages`   |
| `llm.stream` + rute streaming `google.generate_content` | `google-generative-ai` |

Plugin juga menerapkan kebijakan pemutaran ulang dan skema alat yang sesuai untuk
keluarga tersebut (kompatibilitas skema alat OpenAI/DeepSeek/Gemini/Perplexity; kebijakan
pemutaran ulang Anthropic dan Google Gemini native). Model Perplexity mendapatkan penulisan ulang
skema yang ketat: `patternProperties` dan `additionalProperties` dihapus dan
setiap skema objek mendeklarasikan `properties`, karena Perplexity menolak skema
alat tanpanya. Penyedia katalog yang hanya mengekspos format permintaan yang
tidak didukung sengaja tidak diiklankan sebagai model teks OpenClaw.
Normalisasikan penyedia tersebut ke salah satu kontrak yang didukung di
ClawRouter, alih-alih mengirim muatan yang tidak kompatibel.

## Kuota dan penggunaan

Respons `/v1/usage` ClawRouter mengisi permukaan penggunaan penyedia OpenClaw
normal: total permintaan, token, dan pengeluaran, ditambah jendela anggaran bulanan ketika
kunci memiliki batas. Kunci tanpa pengukuran tetap menampilkan penggunaan agregat tanpa
jendela persentase.

Pencarian kuota menggunakan kunci tercakup yang sama dengan penemuan model. Kegagalan
pencarian kuota tidak menghalangi eksekusi model.

Periksa snapshot langsung dengan:

```bash
openclaw status --usage
openclaw models status
```

Snapshot penyedia yang sama tersedia untuk `/status` dalam obrolan dan UI
penggunaan OpenClaw. Anggaran berlaku di seluruh kebijakan, sehingga permintaan yang dibuat oleh klien lain menggunakan
kebijakan ClawRouter yang sama dapat mengubah persentase yang tersisa.

## Pemecahan masalah

| Gejala                                   | Pemeriksaan                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Tidak ada model ClawRouter               | Pastikan plugin diaktifkan dan diizinkan oleh `plugins.allow`, lalu periksa bahwa kredensial aktif dan memberikan akses ke setidaknya satu penyedia yang siap. |
| Model ClawRouter yang dikonfigurasi tidak ada | Periksa kemampuan `/v1/catalog` dan dukungan rutenya. Kontrak transportasi yang tidak didukung sengaja difilter.                            |
| `Unknown model: clawrouter/...`          | Tambahkan referensi katalog yang persis ke `agents.defaults.models` ketika peta konfigurasi tersebut digunakan sebagai daftar izin.                               |
| `401` atau `403` dari katalog atau penggunaan     | Terbitkan ulang atau ubah cakupan kredensial ClawRouter; OpenClaw tidak beralih kembali ke kunci penyedia upstream.                                          |
| Panggilan model gagal setelah penemuan   | Periksa koneksi penyedia dan kesehatan upstream di ClawRouter, lalu coba lagi setelah status kesiapannya pulih.                                |
| Penggunaan memiliki total tetapi tanpa persentase | Kebijakan tidak diukur; tambahkan anggaran bulanan di ClawRouter untuk menampilkan jendela persentase.                                                     |

## Perilaku keamanan

- Penemuan katalog dibatasi pada kunci proksi yang dikonfigurasi dan disimpan dalam cache per cakupan kredensial (direktori agen, direktori ruang kerja, id profil autentikasi, dan URL dasar).
- Kunci proksi hanya disertakan saat pengiriman permintaan; kunci tersebut tidak disimpan dalam metadata model.
- Nilai atribusi otomatis dan korelasi permintaan dipangkas serta ditolak jika mengandung karakter kontrol sebelum pengiriman. Nilai atribusi dibatasi hingga 256 karakter; id permintaan dibatasi hingga 128.
- Diagnostik transportasi model hanya berisi metadata dan tidak pernah menyertakan kunci proksi atau konten model.
- Id model asli Anthropic dan Gemini ditulis ulang menjadi id upstream-nya hanya saat pengiriman.
- Baris katalog yang tidak didukung atau tidak diberi izin ditolak secara tertutup dan tidak dapat dipilih.

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Konfigurasi penyedia dan pemilihan model.
  </Card>
  <Card title="Pelacakan penggunaan" href="/id/concepts/usage-tracking" icon="chart-line">
    Tampilan penggunaan dan status OpenClaw.
  </Card>
</CardGroup>
