---
read_when:
    - Anda menginginkan satu kunci terkelola untuk beberapa penyedia model
    - Anda memerlukan penemuan model atau pelaporan kuota ClawRouter di OpenClaw
summary: Rutekan model dengan cakupan kredensial melalui ClawRouter dan tampilkan kuota terkelola
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T14:34:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter memberi OpenClaw satu kunci dengan cakupan kebijakan untuk beberapa
penyedia model hulu. Plugin `clawrouter` bawaan hanya menemukan model yang
diizinkan untuk kunci tersebut, merutekan setiap model melalui protokol yang
dideklarasikannya, serta melaporkan anggaran kunci dan penggunaan agregat pada
permukaan penggunaan OpenClaw.

Kredensial hulu dan penerusan khusus penyedia tetap berada di ClawRouter,
sehingga Anda tidak perlu menginstal atau mengautentikasi setiap Plugin penyedia
hulu pada host OpenClaw. Plugin ini disertakan bersama OpenClaw
(`enabledByDefault: true`); Anda hanya memerlukan kredensial ClawRouter yang
telah diterbitkan.

| Properti      | Nilai                                            |
| ------------- | ------------------------------------------------ |
| Penyedia      | `clawrouter`                                     |
| Plugin        | bawaan (disertakan dalam OpenClaw)               |
| Autentikasi   | `CLAWROUTER_API_KEY`                             |
| URL bawaan    | `https://clawrouter.openclaw.ai`                 |
| Katalog model | Dicakup kredensial melalui `/v1/catalog`         |
| Kuota         | Anggaran dan penggunaan bulanan melalui `/v1/usage` |

## Memulai

<Steps>
  <Step title="Dapatkan kredensial dengan cakupan tertentu">
    Mintalah kredensial kepada administrator ClawRouter Anda dengan kebijakan
    yang mencakup penyedia, model, dan anggaran bulanan yang harus Anda gunakan.
    Kredensial hanya ditampilkan satu kali saat diterbitkan.
  </Step>
  <Step title="Konfigurasikan OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` disertakan dan diaktifkan secara bawaan. Jika konfigurasi Anda
    menetapkan `plugins.allow`, tambahkan `clawrouter` ke daftar tersebut sebelum
    mengaktifkannya. Untuk penerapan khusus, tetapkan
    `models.providers.clawrouter.baseUrl` ke origin ClawRouter; nilai bawaannya
    adalah `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Cantumkan model yang diberikan">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Gunakan referensi model yang dikembalikan tepat seperti yang ditampilkan.
    Referensi tersebut mempertahankan namespace hulu, seperti
    `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6`, atau
    `clawrouter/google/gemini-3.5-flash`. Jika `agents.defaults.models` merupakan
    daftar izin dalam konfigurasi Anda, tambahkan setiap referensi ClawRouter
    yang dipilih ke daftar tersebut.

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

Simpan kunci proksi dalam injeksi rahasia beban kerja dan simpan hanya SecretRef
di `openclaw.json`. Bidang terkelola kanonis adalah:

| Tujuan          | Bidang konfigurasi atau lingkungan                                         |
| --------------- | -------------------------------------------------------------------------- |
| Origin perute    | `models.providers.clawrouter.baseUrl`                                      |
| Kredensial       | `models.providers.clawrouter.apiKey` -> SecretRef env                      |
| Nilai rahasia    | `CLAWROUTER_API_KEY` di lingkungan proses Gateway                          |
| Model bawaan     | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`         |
| Tag beban kerja  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (opsional)   |

Sebagai contoh, pengontrol penerapan dapat mengelola tambalan JSON5 berikut:

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

Jika penerapan menetapkan `plugins.allow`, pertahankan entri yang sudah ada dan
tambahkan `clawrouter`. Validasi dan terapkan tanpa wisaya interaktif:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

Uji coba menyelesaikan SecretRef tetapi tidak pernah mencetak nilainya. Untuk
merotasi kredensial, perbarui Secret eksternal yang menyediakan
`CLAWROUTER_API_KEY` dan mulai ulang beban kerja Gateway agar lingkungan proses
baru dimuat. Berkas konfigurasi dan referensi model tidak berubah.

Untuk Gateway Docker mandiri yang dibangun dari sumber, ClawRouter sudah
disertakan dalam runtime akar. Pilih hanya Plugin kanal yang memerlukan
pemaketan terpisah, seperti `OPENCLAW_EXTENSIONS=clickclack`, `slack`, atau
`msteams`; lihat
[citra yang dibangun dari sumber dengan Plugin terpilih](/id/install/docker#source-built-images-with-selected-plugins).
Penerapan arsip/perangkat harus memaketkan sumber yang sama yang telah
digabungkan melalui alur artefak mereka sendiri, bukan menggunakan citra OCI.

## Kesiapan dan bukti langsung

Pemeriksaan ini membuktikan batas yang berbeda; jangan mengganti satu dengan
yang lain:

```bash
# Hanya kesehatan proses ClawRouter; tidak ada kredensial atau model hulu yang diuji.
curl -fsS https://clawrouter.internal.example/v1/health

# Hanya kesiapan mulai Gateway OpenClaw; tidak ada panggilan model yang dilakukan.
curl -fsS http://127.0.0.1:18789/readyz

# Penemuan katalog dengan cakupan kredensial.
openclaw models list --all --provider clawrouter --json

# Probe inferensi nyata minimal melalui penyedia ClawRouter yang dikonfigurasi.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Canary beban kerja menggunakan referensi model yang diberikan secara tepat.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Reply exactly: CLAWROUTER_CANARY_OK" \
  --json
```

Gunakan model yang dikembalikan oleh katalog dengan cakupan tersebut, alih-alih
menyalin model contoh tanpa pemeriksaan. Respons `/readyz` yang berhasil berarti
Gateway dapat melayani permintaan; respons tersebut tidak menyatakan bahwa
ClawRouter, kredensialnya, atau penyedia hulu telah siap. Probe model dan canary
agen merupakan bukti inferensi.

Untuk diagnosis langsung, jalankan canary dan periksa log standar Gateway.
Diagnostik transpor model yang hanya memuat metadata menghasilkan baris dengan
bentuk seperti:

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Plugin mengirim header `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id`, dan
`X-ClawRouter-Session-Id` dengan panjang terbatas saat pengenal tersebut
tersedia. Plugin juga memetakan `callId` diagnostik panggilan model
(`<run-id>:model:<n>`) ke `X-Request-ID`, sehingga peristiwa panggilan model
OpenClaw dapat dihubungkan dengan jejak audit ClawRouter yang hanya memuat
metadata. Nilai yang berada dalam batas 128 karakter untuk ID permintaan
bersifat identik. Nilai yang lebih panjang mempertahankan akhiran `:model:<n>`
dan hash deterministik agar setiap panggilan tetap memiliki panjang terbatas
dan dapat dihubungkan. Metadata penerapan statis seperti
`X-ClawRouter-Project-Id` dapat ditetapkan dalam peta `headers` penyedia.
Header atribusi agen dan sesi mempertahankan batas terpisah sebesar 256 karakter.
ID permintaan otomatis yang memuat karakter di luar kumpulan pengenal ASCII
ClawRouter menggunakan bentuk deterministik dengan panjang terbatas yang sama.
Header eksplisit yang dikonfigurasi, termasuk variasi kapitalisasi apa pun dari
`X-Request-ID`, diutamakan daripada nilai otomatis. Diagnostik transpor mencatat
metadata perutean dan respons; diagnostik tersebut tidak mencatat kredensial,
ID permintaan, prompt, atau penyelesaian. Peristiwa audit milik ClawRouter
menyediakan penyedia hulu yang dipilih dan status retensi konten.

## Penemuan model

`GET /v1/catalog` mengembalikan `{ providers: [...] }`, dengan setiap entri
penyedia mencantumkan `models[]` miliknya sendiri (beserta ID hulu, kemampuan,
dan harga) serta rute permintaan yang didukungnya. OpenClaw tidak menyertakan
daftar tetap kedua untuk model ClawRouter. Model katalog diumumkan sebagai model
OpenClaw ketika:

- kebijakan kredensial memberikan akses ke penyedianya;
- model katalog mengumumkan kemampuan LLM yang didukung (`llm.responses`,
  `llm.chat`, `llm.messages`, atau `llm.stream` dengan rute streaming yang
  cocok); dan
- penyedia mengekspos rute yang cocok untuk salah satu transpor di bawah ini.

Menambahkan model ke penyedia ClawRouter yang didukung tidak memerlukan rilis
OpenClaw: penyegaran katalog berikutnya (di-cache selama 60 detik untuk setiap
cakupan kredensial) akan menemukannya. Model yang memerlukan protokol jaringan
baru harus mendapatkan dukungan Plugin terlebih dahulu.

## Protokol dan Plugin penyedia

ClawRouter mengelola kredensial hulu; katalognya memberi tahu OpenClaw transpor
mana yang harus digunakan, sehingga Anda tidak perlu menginstal Plugin
autentikasi dari setiap perusahaan penyedia hulu.

| Kemampuan/rute katalog                                    | Transpor OpenClaw       |
| --------------------------------------------------------- | ----------------------- |
| `llm.responses` (penyedia kompatibel OpenAI)              | `openai-responses`      |
| `llm.chat` (penyedia kompatibel OpenAI)                   | `openai-completions`    |
| `llm.messages` + rute `anthropic.messages`                | `anthropic-messages`    |
| `llm.stream` + rute streaming `google.generate_content`   | `google-generative-ai`  |

Plugin juga menerapkan kebijakan pemutaran ulang dan skema alat yang cocok untuk
keluarga tersebut (kompatibilitas skema alat OpenAI/DeepSeek/Gemini; kebijakan
pemutaran ulang Anthropic dan Google Gemini yang asli). Penyedia katalog yang
hanya mengekspos format permintaan yang tidak didukung sengaja tidak diumumkan
sebagai model teks OpenClaw. Normalkan penyedia tersebut ke salah satu kontrak
yang didukung di ClawRouter, alih-alih mengirim payload yang tidak kompatibel.

## Kuota dan penggunaan

Respons `/v1/usage` ClawRouter mengisi permukaan penggunaan penyedia OpenClaw
yang normal: total permintaan, token, dan pengeluaran, ditambah jendela anggaran
bulanan ketika kunci memiliki batas. Kunci tanpa pengukuran tetap menampilkan
penggunaan agregat tanpa jendela persentase.

Pencarian kuota menggunakan kunci dengan cakupan yang sama seperti penemuan
model. Kegagalan pencarian kuota tidak memblokir eksekusi model.

Periksa snapshot langsung dengan:

```bash
openclaw status --usage
openclaw models status
```

Snapshot penyedia yang sama tersedia untuk `/status` dalam obrolan dan UI
penggunaan OpenClaw. Anggaran berlaku di seluruh kebijakan, sehingga permintaan
yang dibuat oleh klien lain menggunakan kebijakan ClawRouter yang sama dapat
mengubah persentase yang tersisa.

## Pemecahan masalah

| Gejala                                      | Pemeriksaan                                                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tidak ada model ClawRouter                  | Pastikan Plugin diaktifkan dan diizinkan oleh `plugins.allow`, lalu periksa bahwa kredensial aktif dan memberikan akses ke setidaknya satu penyedia yang siap. |
| Model ClawRouter yang dikonfigurasi hilang  | Periksa dukungan kemampuan dan rute `/v1/catalog` miliknya. Kontrak transpor yang tidak didukung sengaja difilter.                                             |
| `Unknown model: clawrouter/...`             | Tambahkan referensi katalog yang tepat ke `agents.defaults.models` ketika peta konfigurasi tersebut digunakan sebagai daftar izin.                            |
| `401` atau `403` dari katalog atau penggunaan | Terbitkan ulang atau ubah cakupan kredensial ClawRouter; OpenClaw tidak beralih ke kunci penyedia hulu sebagai cadangan.                                     |
| Panggilan model gagal setelah penemuan      | Periksa koneksi penyedia dan kesehatan hulu di ClawRouter, lalu coba lagi setelah status kesiapannya pulih.                                                    |
| Penggunaan memiliki total tanpa persentase  | Kebijakan tidak diukur; tambahkan anggaran bulanan di ClawRouter untuk menampilkan jendela persentase.                                                        |

## Perilaku keamanan

- Penemuan katalog dibatasi pada kunci proksi yang dikonfigurasi dan di-cache per cakupan kredensial (direktori agen, direktori ruang kerja, id profil autentikasi, dan URL dasar).
- Kunci proksi hanya disertakan saat pengiriman permintaan; kunci tersebut tidak disimpan dalam metadata model.
- Nilai atribusi otomatis dan korelasi permintaan dipangkas, dan nilai yang mengandung karakter kontrol ditolak sebelum pengiriman. Nilai atribusi dibatasi hingga 256 karakter; id permintaan dibatasi hingga 128 karakter.
- Diagnostik transportasi model hanya berisi metadata dan tidak pernah menyertakan kunci proksi atau konten model.
- Id model asli Anthropic dan Gemini ditulis ulang menjadi id upstream masing-masing hanya saat pengiriman.
- Baris katalog yang tidak didukung atau tidak diberi izin ditolak secara tertutup dan tidak dapat dipilih.

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Konfigurasi penyedia dan pemilihan model.
  </Card>
  <Card title="Pelacakan penggunaan" href="/id/concepts/usage-tracking" icon="chart-line">
    Antarmuka penggunaan dan status OpenClaw.
  </Card>
</CardGroup>
