---
read_when:
    - Membuat video melalui agen
    - Mengonfigurasi penyedia dan model pembuatan video
    - Memahami parameter alat video_generate
sidebarTitle: Video generation
summary: Hasilkan video melalui video_generate dari referensi teks, gambar, atau video pada 16 backend penyedia
title: Pembuatan video
x-i18n:
    generated_at: "2026-05-05T06:19:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: a86a820cc9f27baf4b17954d7ded7c2b7ff9eb456e7e75c3b2e7a7653cd675fd
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw agents dapat menghasilkan video dari prompt teks, gambar referensi, atau
video yang sudah ada. Enam belas backend penyedia didukung, masing-masing dengan
opsi model, mode input, dan set fitur yang berbeda. Agent memilih penyedia yang
tepat secara otomatis berdasarkan konfigurasi dan API key yang tersedia.

<Note>
Tool `video_generate` hanya muncul ketika setidaknya satu penyedia pembuatan
video tersedia. Jika Anda tidak melihatnya di tool agent, tetapkan API key
penyedia atau konfigurasikan `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw memperlakukan pembuatan video sebagai tiga mode runtime:

- `generate` — permintaan teks-ke-video tanpa media referensi.
- `imageToVideo` — permintaan menyertakan satu atau lebih gambar referensi.
- `videoToVideo` — permintaan menyertakan satu atau lebih video referensi.

Penyedia dapat mendukung subset apa pun dari mode tersebut. Tool memvalidasi
mode aktif sebelum pengiriman dan melaporkan mode yang didukung di `action=list`.

## Mulai cepat

<Steps>
  <Step title="Configure auth">
    Tetapkan API key untuk penyedia apa pun yang didukung:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pick a default model (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ask the agent">
    > Buat video sinematik berdurasi 5 detik tentang lobster ramah yang berselancar saat matahari terbenam.

    Agent memanggil `video_generate` secara otomatis. Tidak diperlukan
    allowlisting tool.

  </Step>
</Steps>

## Cara kerja pembuatan asinkron

Pembuatan video bersifat asinkron. Ketika agent memanggil `video_generate` dalam
sebuah sesi:

1. OpenClaw mengirimkan permintaan ke penyedia dan segera mengembalikan id tugas.
2. Penyedia memproses job di latar belakang (biasanya 30 detik hingga beberapa menit tergantung penyedia dan resolusi; penyedia lambat berbasis antrean dapat berjalan hingga timeout yang dikonfigurasi).
3. Ketika video siap, OpenClaw membangunkan sesi yang sama dengan event penyelesaian internal.
4. Agent memberi tahu pengguna dan melampirkan video yang selesai. Dalam obrolan grup/channel
   yang menggunakan pengiriman terlihat khusus message-tool, agent meneruskan
   hasil melalui tool pesan alih-alih OpenClaw mempostingnya secara langsung.

Saat sebuah job sedang berjalan, panggilan `video_generate` duplikat dalam sesi
yang sama mengembalikan status tugas saat ini alih-alih memulai pembuatan lain.
Gunakan `openclaw tasks list` atau `openclaw tasks show <taskId>` untuk
memeriksa progres dari CLI.

Di luar eksekusi agent yang didukung sesi (misalnya, pemanggilan tool langsung),
tool kembali ke pembuatan inline dan mengembalikan path media final
dalam giliran yang sama.

File video yang dihasilkan disimpan di penyimpanan media yang dikelola OpenClaw ketika
penyedia mengembalikan byte. Batas simpan default video yang dihasilkan mengikuti
batas media video, dan `agents.defaults.mediaMaxMb` menaikkannya untuk
render yang lebih besar. Ketika penyedia juga mengembalikan URL output yang di-host, OpenClaw
dapat mengirimkan URL tersebut alih-alih menggagalkan tugas jika persistensi lokal
menolak file yang terlalu besar.

### Siklus hidup tugas

| Status      | Makna                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Tugas dibuat, menunggu penyedia menerimanya.                                                           |
| `running`   | Penyedia sedang memproses (biasanya 30 detik hingga beberapa menit tergantung penyedia dan resolusi). |
| `succeeded` | Video siap; agent bangun dan mempostingnya ke percakapan.                                             |
| `failed`    | Error penyedia atau timeout; agent bangun dengan detail error.                                         |

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Jika tugas video sudah `queued` atau `running` untuk sesi saat ini,
`video_generate` mengembalikan status tugas yang ada alih-alih memulai yang baru.
Gunakan `action: "status"` untuk memeriksa secara eksplisit tanpa memicu
pembuatan baru.

## Penyedia yang didukung

| Penyedia              | Model default                   | Teks | Ref gambar                                           | Ref video                                      | Auth                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Ya (URL jarak jauh)                                  | Ya (URL jarak jauh)                            | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Hingga 2 gambar (hanya model I2V; frame pertama + terakhir) | —                                        | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Hingga 2 gambar (frame pertama + terakhir melalui role) | —                                           | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Hingga 9 gambar referensi                            | Hingga 3 video                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 gambar                                             | —                                              | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                              | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 gambar; hingga 9 dengan Seedance reference-to-video | Hingga 3 video dengan Seedance reference-to-video | `FAL_KEY`                             |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 gambar                                             | 1 video                                        | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 gambar                                             | —                                              | `MINIMAX_API_KEY` atau MiniMax OAuth     |
| OpenAI                | `sora-2`                        |  ✓   | 1 gambar                                             | 1 video                                        | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Hingga 4 gambar (frame pertama/terakhir atau referensi) | —                                           | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Ya (URL jarak jauh)                                  | Ya (URL jarak jauh)                            | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 gambar                                             | 1 video                                        | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 gambar                                             | —                                              | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 gambar (`kling`)                                   | —                                              | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 gambar frame pertama atau hingga 7 `reference_image` | 1 video                                      | `XAI_API_KEY`                            |

Beberapa penyedia menerima variabel env API key tambahan atau alternatif. Lihat
[halaman penyedia](#related) individual untuk detail.

Jalankan `video_generate action=list` untuk memeriksa penyedia, model, dan
mode runtime yang tersedia saat runtime.

### Matriks kapabilitas

Kontrak mode eksplisit yang digunakan oleh `video_generate`, test kontrak, dan
sweep live bersama:

| Penyedia   | `generate` | `imageToVideo` | `videoToVideo` | Lane live bersama hari ini                                                                                                                |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` jarak jauh                       |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Tidak dalam sweep bersama; cakupan khusus workflow berada di test Comfy                                                                  |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; skema video DeepInfra native adalah teks-ke-video dalam kontrak bawaan                                                       |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` hanya saat menggunakan Seedance reference-to-video                                            |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` bersama dilewati karena sweep Gemini/Veo berbasis buffer saat ini tidak menerima input tersebut |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` bersama dilewati karena path org/input ini saat ini memerlukan akses inpaint/remix sisi penyedia |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` jarak jauh                       |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` berjalan hanya saat model yang dipilih adalah `runway/gen4_aleph`                            |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; `imageToVideo` bersama dilewati karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar jarak jauh          |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini saat ini memerlukan URL MP4 jarak jauh                          |

## Parameter tool

### Wajib

<ParamField path="prompt" type="string" required>
  Deskripsi teks video yang akan dibuat. Wajib untuk `action: "generate"`.
</ParamField>

### Input konten

<ParamField path="image" type="string">Gambar referensi tunggal (path atau URL).</ParamField>
<ParamField path="images" type="string[]">Beberapa gambar referensi (hingga 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Petunjuk peran opsional per posisi yang sejajar dengan daftar gambar gabungan.
Nilai kanonis: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Video referensi tunggal (path atau URL).</ParamField>
<ParamField path="videos" type="string[]">Beberapa video referensi (hingga 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Petunjuk peran opsional per posisi yang sejajar dengan daftar video gabungan.
Nilai kanonis: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Audio referensi tunggal (path atau URL). Digunakan untuk musik latar atau
referensi suara ketika penyedia mendukung input audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Beberapa audio referensi (hingga 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Petunjuk peran opsional per posisi yang sejajar dengan daftar audio gabungan.
Nilai kanonis: `reference_audio`.
</ParamField>

<Note>
Petunjuk peran diteruskan ke penyedia apa adanya. Nilai kanonis berasal dari
union `VideoGenerationAssetRole`, tetapi penyedia dapat menerima string peran
tambahan. Array `*Roles` tidak boleh memiliki lebih banyak entri daripada
daftar referensi terkait; kesalahan selisih satu gagal dengan error yang jelas.
Gunakan string kosong untuk membiarkan satu slot tidak disetel. Untuk xAI, setel setiap peran gambar ke
`reference_image` untuk menggunakan mode generasi `reference_images` miliknya; hilangkan
peran atau gunakan `first_frame` untuk image-to-video satu gambar.
</Note>

### Kontrol gaya

<ParamField path="aspectRatio" type="string">
  Petunjuk rasio aspek seperti `1:1`, `16:9`, `9:16`, `adaptive`, atau nilai khusus penyedia. OpenClaw menormalkan atau mengabaikan nilai yang tidak didukung per penyedia.
</ParamField>
<ParamField path="resolution" type="string">Petunjuk resolusi seperti `480P`, `720P`, `768P`, `1080P`, `4K`, atau nilai khusus penyedia. OpenClaw menormalkan atau mengabaikan nilai yang tidak didukung per penyedia.</ParamField>
<ParamField path="durationSeconds" type="number">
  Durasi target dalam detik (dibulatkan ke nilai terdekat yang didukung penyedia).
</ParamField>
<ParamField path="size" type="string">Petunjuk ukuran ketika penyedia mendukungnya.</ParamField>
<ParamField path="audio" type="boolean">
  Aktifkan audio yang dihasilkan dalam output ketika didukung. Berbeda dari `audioRef*` (input).
</ParamField>
<ParamField path="watermark" type="boolean">Aktifkan atau nonaktifkan watermark penyedia ketika didukung.</ParamField>

`adaptive` adalah sentinel khusus penyedia: nilai ini diteruskan apa adanya ke
penyedia yang mendeklarasikan `adaptive` dalam kapabilitasnya (misalnya BytePlus
Seedance menggunakannya untuk mendeteksi rasio secara otomatis dari dimensi
gambar input). Penyedia yang tidak mendeklarasikannya menampilkan nilai tersebut melalui
`details.ignoredOverrides` dalam hasil alat agar pengabaian tersebut terlihat.

### Lanjutan

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` mengembalikan tugas sesi saat ini; `"list"` memeriksa penyedia.
</ParamField>
<ParamField path="model" type="string">Override penyedia/model (misalnya `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Petunjuk nama file output.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout operasi penyedia opsional dalam milidetik.</ParamField>
<ParamField path="providerOptions" type="object">
  Opsi khusus penyedia sebagai objek JSON (misalnya `{"seed": 42, "draft": true}`).
  Penyedia yang mendeklarasikan skema bertipe memvalidasi kunci dan tipe; kunci
  yang tidak dikenal atau ketidakcocokan melewati kandidat selama fallback. Penyedia tanpa
  skema yang dideklarasikan menerima opsi apa adanya. Jalankan `video_generate action=list`
  untuk melihat apa yang diterima setiap penyedia.
</ParamField>

<Note>
Tidak semua penyedia mendukung semua parameter. OpenClaw menormalkan durasi ke
nilai terdekat yang didukung penyedia, dan memetakan ulang petunjuk geometri yang diterjemahkan
seperti ukuran-ke-rasio-aspek ketika penyedia fallback mengekspos permukaan
kontrol yang berbeda. Override yang benar-benar tidak didukung diabaikan berdasarkan upaya terbaik
dan dilaporkan sebagai peringatan dalam hasil alat. Batas kapabilitas keras
(seperti terlalu banyak input referensi) gagal sebelum pengiriman. Hasil alat
melaporkan pengaturan yang diterapkan; `details.normalization` menangkap setiap
terjemahan dari yang diminta ke yang diterapkan.
</Note>

Input referensi memilih mode runtime:

- Tidak ada media referensi → `generate`
- Ada referensi gambar → `imageToVideo`
- Ada referensi video → `videoToVideo`
- Input audio referensi **tidak** mengubah mode yang diselesaikan; input tersebut diterapkan di
  atas mode apa pun yang dipilih referensi gambar/video, dan hanya berfungsi
  dengan penyedia yang mendeklarasikan `maxInputAudios`.

Referensi gambar dan video campuran bukan permukaan kapabilitas bersama yang stabil.
Sebaiknya gunakan satu jenis referensi per permintaan.

#### Fallback dan opsi bertipe

Sebagian pemeriksaan kapabilitas diterapkan pada lapisan fallback, bukan pada
batas alat, sehingga permintaan yang melebihi batas penyedia utama masih dapat
berjalan pada fallback yang mampu:

- Kandidat aktif yang tidak mendeklarasikan `maxInputAudios` (atau `0`) dilewati ketika
  permintaan berisi referensi audio; kandidat berikutnya dicoba.
- `maxDurationSeconds` kandidat aktif di bawah `durationSeconds` yang diminta
  tanpa daftar `supportedDurationSeconds` yang dideklarasikan → dilewati.
- Permintaan berisi `providerOptions` dan kandidat aktif secara eksplisit
  mendeklarasikan skema `providerOptions` bertipe → dilewati jika kunci yang diberikan
  tidak ada dalam skema atau tipe nilai tidak cocok. Penyedia tanpa
  skema yang dideklarasikan menerima opsi apa adanya (pass-through yang
  kompatibel mundur). Penyedia dapat memilih keluar dari semua opsi penyedia dengan
  mendeklarasikan skema kosong (`capabilities.providerOptions: {}`), yang
  menyebabkan pelewatan yang sama seperti ketidakcocokan tipe.

Alasan pelewatan pertama dalam permintaan dicatat pada `warn` agar operator melihat ketika
penyedia utama mereka dilewati; pelewatan berikutnya dicatat pada `debug` untuk
menjaga rantai fallback panjang tetap senyap. Jika setiap kandidat dilewati, error
teragregasi menyertakan alasan pelewatan untuk masing-masing.

## Tindakan

| Tindakan   | Yang dilakukan                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Default. Membuat video dari prompt yang diberikan dan input referensi opsional.                          |
| `status`   | Memeriksa status tugas video yang sedang berjalan untuk sesi saat ini tanpa memulai generasi lain.       |
| `list`     | Menampilkan penyedia, model, dan kapabilitas yang tersedia.                                              |

## Pemilihan model

OpenClaw menyelesaikan model dalam urutan ini:

1. **Parameter alat `model`** — jika agen menentukannya dalam panggilan.
2. **`videoGenerationModel.primary`** dari konfigurasi.
3. **`videoGenerationModel.fallbacks`** secara berurutan.
4. **Deteksi otomatis** — penyedia yang memiliki autentikasi valid, dimulai dengan
   penyedia default saat ini, lalu penyedia tersisa dalam urutan alfabetis.

Jika penyedia gagal, kandidat berikutnya dicoba secara otomatis. Jika semua
kandidat gagal, error menyertakan detail dari setiap percobaan.

Setel `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk menggunakan
hanya entri `model`, `primary`, dan `fallbacks` eksplisit.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Catatan penyedia

<AccordionGroup>
  <Accordion title="Alibaba">
    Menggunakan endpoint asinkron DashScope / Model Studio. Gambar dan
    video referensi harus berupa URL `http(s)` jarak jauh.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID penyedia: `byteplus`.

    Model: `seedance-1-0-pro-250528` (default),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Model T2V (`*-t2v-*`) tidak menerima input gambar; model I2V dan
    model umum `*-pro-*` mendukung satu gambar referensi (frame pertama).
    Teruskan gambar secara posisional atau setel `role: "first_frame"`.
    ID model T2V otomatis dialihkan ke varian I2V yang sesuai
    ketika gambar disediakan.

    Kunci `providerOptions` yang didukung: `seed` (number), `draft` (boolean —
    memaksa 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Memerlukan Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID penyedia: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Menggunakan API `content[]` terpadu. Mendukung paling banyak 2 gambar input
    (`first_frame` + `last_frame`). Semua input harus berupa URL `https://`
    jarak jauh. Setel `role: "first_frame"` / `"last_frame"` pada setiap gambar, atau
    teruskan gambar secara posisional.

    `aspectRatio: "adaptive"` mendeteksi rasio secara otomatis dari gambar input.
    `audio: true` dipetakan ke `generate_audio`. `providerOptions.seed`
    (number) diteruskan.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Memerlukan Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID penyedia: `byteplus-seedance2`. Model:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Menggunakan API `content[]` terpadu. Mendukung hingga 9 gambar referensi,
    3 video referensi, dan 3 audio referensi. Semua input harus berupa URL `https://`
    jarak jauh. Setel `role` pada setiap aset — nilai yang didukung:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` mendeteksi rasio secara otomatis dari gambar input.
    `audio: true` dipetakan ke `generate_audio`. `providerOptions.seed`
    (number) diteruskan.

  </Accordion>
  <Accordion title="ComfyUI">
    Eksekusi lokal atau cloud berbasis alur kerja. Mendukung text-to-video dan
    image-to-video melalui graf yang dikonfigurasi.
  </Accordion>
  <Accordion title="fal">
    Menggunakan alur berbasis antrean untuk pekerjaan yang berjalan lama. OpenClaw menunggu hingga 20
    menit secara default sebelum memperlakukan pekerjaan antrean fal yang sedang berjalan sebagai habis
    waktu. Sebagian besar model video fal
    menerima satu referensi gambar. Model Seedance 2.0 reference-to-video
    menerima hingga 9 gambar, 3 video, dan 3 referensi audio, dengan
    maksimal 12 total file referensi.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Mendukung satu referensi gambar atau satu referensi video. Permintaan audio yang dihasilkan
    diabaikan dengan peringatan pada jalur API Gemini karena API tersebut menolak
    parameter `generateAudio` untuk pembuatan video Veo saat ini.
  </Accordion>
  <Accordion title="MiniMax">
    Hanya satu referensi gambar. MiniMax menerima resolusi `768P` dan `1080P`;
    permintaan seperti `720P` dinormalisasi ke nilai terdekat
    yang didukung sebelum dikirim.
  </Accordion>
  <Accordion title="OpenAI">
    Hanya override `size` yang diteruskan. Override gaya lainnya
    (`aspectRatio`, `resolution`, `audio`, `watermark`) diabaikan dengan
    peringatan.
  </Accordion>
  <Accordion title="OpenRouter">
    Menggunakan API `/videos` asinkron OpenRouter. OpenClaw mengirim
    pekerjaan, melakukan polling `polling_url`, dan mengunduh `unsigned_urls` atau
    endpoint konten pekerjaan yang terdokumentasi. Default bawaan `google/veo-3.1-fast`
    mengiklankan durasi 4/6/8 detik, resolusi `720P`/`1080P`, dan
    rasio aspek `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Backend DashScope yang sama seperti Alibaba. Input referensi harus berupa URL
    `http(s)` jarak jauh; file lokal ditolak sejak awal.
  </Accordion>
  <Accordion title="Runway">
    Mendukung file lokal melalui URI data. Video-to-video memerlukan
    `runway/gen4_aleph`. Proses hanya teks mengekspos rasio aspek `16:9` dan `9:16`.
  </Accordion>
  <Accordion title="Together">
    Hanya satu referensi gambar.
  </Accordion>
  <Accordion title="Vydra">
    Menggunakan `https://www.vydra.ai/api/v1` secara langsung untuk menghindari
    pengalihan yang menghilangkan autentikasi. `veo3` disertakan sebagai text-to-video saja; `kling` memerlukan
    URL gambar jarak jauh.
  </Accordion>
  <Accordion title="xAI">
    Mendukung text-to-video, single first-frame image-to-video, hingga 7
    input `reference_image` melalui `reference_images` xAI, serta alur
    edit/perpanjang video jarak jauh.
  </Accordion>
</AccordionGroup>

## Mode kemampuan penyedia

Kontrak pembuatan video bersama mendukung kemampuan spesifik mode
alih-alih hanya batas agregat datar. Implementasi penyedia baru
sebaiknya memilih blok mode eksplisit:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Bidang agregat datar seperti `maxInputImages` dan `maxInputVideos`
**tidak** cukup untuk mengiklankan dukungan mode transformasi. Penyedia sebaiknya
mendeklarasikan `generate`, `imageToVideo`, dan `videoToVideo` secara eksplisit agar
pengujian langsung, pengujian kontrak, dan alat bersama `video_generate` dapat memvalidasi
dukungan mode secara deterministik.

Ketika satu model dalam suatu penyedia memiliki dukungan input referensi yang lebih luas daripada
yang lain, gunakan `maxInputImagesByModel`, `maxInputVideosByModel`, atau
`maxInputAudiosByModel` alih-alih menaikkan batas seluruh mode.

## Pengujian langsung

Cakupan langsung opt-in untuk penyedia bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media video
```

File langsung ini memuat variabel env penyedia yang hilang dari `~/.profile`, lebih memilih
kunci API live/env daripada profil autentikasi tersimpan secara default, dan menjalankan
uji kelayakan dasar yang aman untuk rilis secara default:

- `generate` untuk setiap penyedia non-FAL dalam sapuan.
- Prompt lobster satu detik.
- Batas operasi per penyedia dari
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default).

FAL bersifat opt-in karena latensi antrean di sisi penyedia dapat mendominasi waktu
rilis:

```bash
pnpm test:live:media video --video-providers fal
```

Setel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan
mode transformasi yang dideklarasikan yang dapat dijalankan sapuan bersama secara aman dengan media lokal:

- `imageToVideo` ketika `capabilities.imageToVideo.enabled`.
- `videoToVideo` ketika `capabilities.videoToVideo.enabled` dan
  penyedia/model menerima input video lokal berbasis buffer dalam sapuan
  bersama.

Saat ini jalur langsung `videoToVideo` bersama mencakup `runway` hanya ketika Anda
memilih `runway/gen4_aleph`.

## Konfigurasi

Setel model pembuatan video default dalam konfigurasi OpenClaw Anda:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Atau melalui CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Terkait

- [Alibaba Model Studio](/id/providers/alibaba)
- [Tugas latar belakang](/id/automation/tasks) — pelacakan tugas untuk pembuatan video asinkron
- [BytePlus](/id/concepts/model-providers#byteplus-international)
- [ComfyUI](/id/providers/comfy)
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults)
- [fal](/id/providers/fal)
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [Model](/id/concepts/models)
- [OpenAI](/id/providers/openai)
- [Qwen](/id/providers/qwen)
- [Runway](/id/providers/runway)
- [Together AI](/id/providers/together)
- [Ikhtisar alat](/id/tools)
- [Vydra](/id/providers/vydra)
- [xAI](/id/providers/xai)
