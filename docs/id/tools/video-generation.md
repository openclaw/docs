---
read_when:
    - Menghasilkan video melalui agen
    - Mengonfigurasi penyedia dan model pembuatan video
    - Memahami parameter alat `video_generate`
sidebarTitle: Video generation
summary: Hasilkan video melalui `video_generate` dari referensi teks, gambar, atau video di 14 backend penyedia
title: Pembuatan video
x-i18n:
    generated_at: "2026-04-26T11:41:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
    source_path: tools/video-generation.md
    workflow: 15
---

Agen OpenClaw dapat menghasilkan video dari prompt teks, gambar referensi, atau
video yang sudah ada. Empat belas backend penyedia didukung, masing-masing dengan
opsi model, mode input, dan set fitur yang berbeda. Agen memilih
penyedia yang tepat secara otomatis berdasarkan konfigurasi Anda dan API key
yang tersedia.

<Note>
Alat `video_generate` hanya muncul ketika setidaknya satu penyedia pembuatan video
tersedia. Jika Anda tidak melihatnya di alat agen Anda, tetapkan
API key penyedia atau konfigurasikan `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw memperlakukan pembuatan video sebagai tiga mode runtime:

- `generate` — permintaan teks-ke-video tanpa media referensi.
- `imageToVideo` — permintaan menyertakan satu atau lebih gambar referensi.
- `videoToVideo` — permintaan menyertakan satu atau lebih video referensi.

Penyedia dapat mendukung subset mana pun dari mode-mode tersebut. Alat ini memvalidasi
mode aktif sebelum pengiriman dan melaporkan mode yang didukung dalam `action=list`.

## Mulai cepat

<Steps>
  <Step title="Konfigurasikan auth">
    Tetapkan API key untuk penyedia apa pun yang didukung:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pilih model default (opsional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Minta agen">
    > Hasilkan video sinematik 5 detik tentang lobster ramah yang berselancar saat matahari terbenam.

    Agen memanggil `video_generate` secara otomatis. Allowlist alat
    tidak diperlukan.

  </Step>
</Steps>

## Cara kerja pembuatan asinkron

Pembuatan video bersifat asinkron. Saat agen memanggil `video_generate` dalam sebuah
sesi:

1. OpenClaw mengirim permintaan ke penyedia dan segera mengembalikan id task.
2. Penyedia memproses pekerjaan di latar belakang (biasanya 30 detik hingga 5 menit tergantung penyedia dan resolusi).
3. Saat video siap, OpenClaw membangunkan sesi yang sama dengan event penyelesaian internal.
4. Agen memposting video yang telah selesai kembali ke percakapan asli.

Saat pekerjaan sedang berjalan, panggilan `video_generate` duplikat dalam sesi yang sama
mengembalikan status task saat ini alih-alih memulai pembuatan
baru. Gunakan `openclaw tasks list` atau `openclaw tasks show <taskId>` untuk
memeriksa progres dari CLI.

Di luar eksekusi agen berbasis sesi (misalnya, pemanggilan alat langsung),
alat ini fallback ke pembuatan inline dan mengembalikan path media akhir
dalam giliran yang sama.

File video yang dihasilkan disimpan di bawah penyimpanan media yang dikelola OpenClaw saat
penyedia mengembalikan byte. Batas simpan video hasil default mengikuti
batas media video, dan `agents.defaults.mediaMaxMb` menaikkannya untuk
render yang lebih besar. Saat penyedia juga mengembalikan URL output terhosting, OpenClaw
dapat mengirim URL itu alih-alih gagal pada task jika persistensi lokal
menolak file yang terlalu besar.

### Siklus hidup task

| State       | Arti                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Task dibuat, menunggu penyedia menerimanya.                                                      |
| `running`   | Penyedia sedang memproses (biasanya 30 detik hingga 5 menit tergantung penyedia dan resolusi).  |
| `succeeded` | Video siap; agen bangun dan mempostingnya ke percakapan.                                         |
| `failed`    | Galat penyedia atau timeout; agen bangun dengan detail galat.                                    |

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Jika task video sudah `queued` atau `running` untuk sesi saat ini,
`video_generate` mengembalikan status task yang ada alih-alih memulai task
baru. Gunakan `action: "status"` untuk memeriksa secara eksplisit tanpa memicu
pembuatan baru.

## Penyedia yang didukung

| Penyedia              | Model default                   | Teks | Referensi gambar                                      | Referensi video                                 | Auth                                     |
| --------------------- | ------------------------------- | :--: | ----------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Ya (URL jarak jauh)                                   | Ya (URL jarak jauh)                             | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Hingga 2 gambar (hanya model I2V; frame pertama + terakhir) | —                                         | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Hingga 2 gambar (frame pertama + terakhir via role)   | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Hingga 9 gambar referensi                             | Hingga 3 video                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 gambar                                              | —                                               | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 gambar; hingga 9 dengan Seedance reference-to-video | Hingga 3 video dengan Seedance reference-to-video | `FAL_KEY`                              |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 gambar                                              | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 gambar                                              | —                                               | `MINIMAX_API_KEY` atau OAuth MiniMax     |
| OpenAI                | `sora-2`                        |  ✓   | 1 gambar                                              | 1 video                                         | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Ya (URL jarak jauh)                                   | Ya (URL jarak jauh)                             | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 gambar                                              | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 gambar                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 gambar (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 gambar frame pertama atau hingga 7 `reference_image` | 1 video                                       | `XAI_API_KEY`                            |

Beberapa penyedia menerima variabel env API key tambahan atau alternatif. Lihat
[halaman penyedia](#related) masing-masing untuk detail.

Jalankan `video_generate action=list` untuk memeriksa penyedia, model, dan
mode runtime yang tersedia saat runtime.

### Matriks kemampuan

Kontrak mode eksplisit yang digunakan oleh `video_generate`, pengujian kontrak, dan
shared live sweep:

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Shared live lanes saat ini                                                                                                                |
| -------- | :--------: | :------------: | :------------: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` jarak jauh                        |
| BytePlus |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| ComfyUI  |     ✓      |       ✓        |       —        | Tidak ada dalam shared sweep; cakupan khusus workflow ada bersama pengujian Comfy                                                        |
| fal      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` hanya saat menggunakan Seedance reference-to-video                                            |
| Google   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` bersama dilewati karena sweep Gemini/Veo berbasis buffer saat ini tidak menerima input itu    |
| MiniMax  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| OpenAI   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` bersama dilewati karena jalur org/input ini saat ini memerlukan akses inpaint/remix sisi penyedia |
| Qwen     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` jarak jauh                        |
| Runway   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` hanya berjalan saat model yang dipilih adalah `runway/gen4_aleph`                            |
| Together |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                                |
| Vydra    |     ✓      |       ✓        |       —        | `generate`; `imageToVideo` bersama dilewati karena `veo3` bawaan hanya-teks dan `kling` bawaan memerlukan URL gambar jarak jauh          |
| xAI      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini saat ini memerlukan URL MP4 jarak jauh                           |

## Parameter alat

### Wajib

<ParamField path="prompt" type="string" required>
  Deskripsi teks video yang akan dihasilkan. Wajib untuk `action: "generate"`.
</ParamField>

### Input konten

<ParamField path="image" type="string">Satu gambar referensi (path atau URL).</ParamField>
<ParamField path="images" type="string[]">Beberapa gambar referensi (hingga 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Petunjuk role per posisi opsional yang paralel dengan daftar gambar gabungan.
Nilai kanonis: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Satu video referensi (path atau URL).</ParamField>
<ParamField path="videos" type="string[]">Beberapa video referensi (hingga 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Petunjuk role per posisi opsional yang paralel dengan daftar video gabungan.
Nilai kanonis: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Satu audio referensi (path atau URL). Digunakan untuk musik latar atau
referensi suara ketika penyedia mendukung input audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Beberapa audio referensi (hingga 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Petunjuk role per posisi opsional yang paralel dengan daftar audio gabungan.
Nilai kanonis: `reference_audio`.
</ParamField>

<Note>
Petunjuk role diteruskan ke penyedia apa adanya. Nilai kanonis berasal dari
union `VideoGenerationAssetRole` tetapi penyedia dapat menerima string
role tambahan. Array `*Roles` tidak boleh memiliki entri lebih banyak daripada
daftar referensi yang sesuai; kesalahan off-by-one gagal dengan galat yang jelas.
Gunakan string kosong untuk membiarkan slot tidak ditetapkan. Untuk xAI, tetapkan setiap role gambar ke
`reference_image` untuk menggunakan mode pembuatan `reference_images`; hilangkan
role tersebut atau gunakan `first_frame` untuk image-to-video satu gambar.
</Note>

### Kontrol gaya

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, atau `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, atau `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Durasi target dalam detik (dibulatkan ke nilai terdekat yang didukung penyedia).
</ParamField>
<ParamField path="size" type="string">Petunjuk ukuran saat penyedia mendukungnya.</ParamField>
<ParamField path="audio" type="boolean">
  Aktifkan audio yang dihasilkan dalam output bila didukung. Berbeda dari `audioRef*` (input).
</ParamField>
<ParamField path="watermark" type="boolean">Aktifkan/nonaktifkan watermark penyedia bila didukung.</ParamField>

`adaptive` adalah sentinel khusus penyedia: nilai ini diteruskan apa adanya ke
penyedia yang mendeklarasikan `adaptive` dalam kapabilitasnya (misalnya BytePlus
Seedance menggunakannya untuk mendeteksi rasio secara otomatis dari dimensi
gambar input). Penyedia yang tidak mendeklarasikannya akan menampilkan nilainya melalui
`details.ignoredOverrides` dalam hasil alat agar pengabaian tersebut terlihat.

### Lanjutan

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` mengembalikan task sesi saat ini; `"list"` memeriksa penyedia.
</ParamField>
<ParamField path="model" type="string">Override penyedia/model (misalnya `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Petunjuk nama file output.</ParamField>
<ParamField path="timeoutMs" type="number">Batas waktu permintaan penyedia opsional dalam milidetik.</ParamField>
<ParamField path="providerOptions" type="object">
  Opsi khusus penyedia sebagai objek JSON (misalnya `{"seed": 42, "draft": true}`).
  Penyedia yang mendeklarasikan skema bertipe memvalidasi key dan tipe; key yang tidak dikenal
  atau ketidakcocokan akan melewati kandidat itu saat fallback. Penyedia tanpa
  skema yang dideklarasikan menerima opsi apa adanya. Jalankan `video_generate action=list`
  untuk melihat apa yang diterima tiap penyedia.
</ParamField>

<Note>
Tidak semua penyedia mendukung semua parameter. OpenClaw menormalkan durasi ke
nilai terdekat yang didukung penyedia, dan memetakan ulang petunjuk geometri yang diterjemahkan
seperti ukuran-ke-rasio-aspek saat penyedia fallback mengekspos permukaan kontrol
yang berbeda. Override yang benar-benar tidak didukung diabaikan secara best-effort
dan dilaporkan sebagai peringatan dalam hasil alat. Batas kapabilitas keras
(seperti terlalu banyak input referensi) gagal sebelum pengiriman. Hasil alat
melaporkan pengaturan yang diterapkan; `details.normalization` menangkap
terjemahan dari yang diminta ke yang diterapkan.
</Note>

Input referensi memilih mode runtime:

- Tidak ada media referensi → `generate`
- Ada referensi gambar → `imageToVideo`
- Ada referensi video → `videoToVideo`
- Input audio referensi **tidak** mengubah mode yang diresolusikan; input ini diterapkan
  di atas mode apa pun yang dipilih oleh referensi gambar/video, dan hanya berfungsi
  dengan penyedia yang mendeklarasikan `maxInputAudios`.

Referensi gambar dan video campuran bukanlah permukaan kapabilitas bersama yang stabil.
Pilih satu jenis referensi per permintaan.

#### Fallback dan opsi bertipe

Beberapa pemeriksaan kapabilitas diterapkan pada lapisan fallback, bukan pada
batas alat, sehingga permintaan yang melebihi batas penyedia utama masih dapat
berjalan pada fallback yang mampu:

- Kandidat aktif yang tidak mendeklarasikan `maxInputAudios` (atau `0`) akan dilewati saat
  permintaan berisi referensi audio; kandidat berikutnya dicoba.
- `maxDurationSeconds` kandidat aktif di bawah `durationSeconds` yang diminta
  tanpa daftar `supportedDurationSeconds` yang dideklarasikan → dilewati.
- Permintaan berisi `providerOptions` dan kandidat aktif secara eksplisit
  mendeklarasikan skema `providerOptions` bertipe → dilewati jika key yang diberikan
  tidak ada dalam skema atau tipe nilainya tidak cocok. Penyedia tanpa
  skema yang dideklarasikan menerima opsi apa adanya (pass-through
  yang kompatibel ke belakang). Penyedia dapat memilih keluar dari semua provider option dengan
  mendeklarasikan skema kosong (`capabilities.providerOptions: {}`), yang
  menyebabkan pengabaian yang sama seperti ketidakcocokan tipe.

Alasan pengabaian pertama dalam sebuah permintaan dicatat pada `warn` agar operator melihat kapan
penyedia utama mereka dilewati; pengabaian berikutnya dicatat pada `debug` agar
rantai fallback panjang tetap senyap. Jika setiap kandidat dilewati, galat
teragregasi menyertakan alasan pengabaian untuk masing-masing.

## Tindakan

| Tindakan   | Fungsinya                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| `generate` | Default. Membuat video dari prompt yang diberikan dan input referensi opsional.                         |
| `status`   | Memeriksa status task video yang sedang berjalan untuk sesi saat ini tanpa memulai pembuatan lain.     |
| `list`     | Menampilkan penyedia, model, dan kapabilitas yang tersedia.                                             |

## Pemilihan model

OpenClaw meresolusikan model dalam urutan ini:

1. **Parameter alat `model`** — jika agen menentukannya dalam panggilan.
2. **`videoGenerationModel.primary`** dari konfigurasi.
3. **`videoGenerationModel.fallbacks`** secara berurutan.
4. **Deteksi otomatis** — penyedia yang memiliki auth valid, dimulai dengan
   penyedia default saat ini, lalu penyedia lainnya dalam urutan alfabet.

Jika satu penyedia gagal, kandidat berikutnya dicoba secara otomatis. Jika semua
kandidat gagal, galat akan menyertakan detail dari setiap percobaan.

Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk menggunakan
hanya entri `model`, `primary`, dan `fallbacks` yang eksplisit.

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
    Menggunakan endpoint async DashScope / Model Studio. Gambar dan
    video referensi harus berupa URL `http(s)` jarak jauh.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Id penyedia: `byteplus`.

    Model: `seedance-1-0-pro-250528` (default),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Model T2V (`*-t2v-*`) tidak menerima input gambar; model I2V dan
    model umum `*-pro-*` mendukung satu gambar referensi (frame
    pertama). Berikan gambar secara posisional atau tetapkan `role: "first_frame"`.
    Id model T2V otomatis dialihkan ke varian I2V yang sesuai
    saat gambar diberikan.

    Key `providerOptions` yang didukung: `seed` (number), `draft` (boolean —
    memaksa 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Memerlukan Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    . Id penyedia: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Menggunakan API `content[]` terpadu. Mendukung maksimal 2 gambar input
    (`first_frame` + `last_frame`). Semua input harus berupa URL `https://`
    jarak jauh. Tetapkan `role: "first_frame"` / `"last_frame"` pada setiap gambar, atau
    berikan gambar secara posisional.

    `aspectRatio: "adaptive"` mendeteksi rasio secara otomatis dari gambar input.
    `audio: true` dipetakan ke `generate_audio`. `providerOptions.seed`
    (number) diteruskan.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Memerlukan Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    . Id penyedia: `byteplus-seedance2`. Model:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Menggunakan API `content[]` terpadu. Mendukung hingga 9 gambar referensi,
    3 video referensi, dan 3 audio referensi. Semua input harus berupa URL
    `https://` jarak jauh. Tetapkan `role` pada setiap aset — nilai yang didukung:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` mendeteksi rasio secara otomatis dari gambar input.
    `audio: true` dipetakan ke `generate_audio`. `providerOptions.seed`
    (number) diteruskan.

  </Accordion>
  <Accordion title="ComfyUI">
    Eksekusi lokal atau cloud yang digerakkan Workflow. Mendukung text-to-video dan
    image-to-video melalui graph yang dikonfigurasi.
  </Accordion>
  <Accordion title="fal">
    Menggunakan alur berbasis antrean untuk pekerjaan yang berjalan lama. Sebagian besar model video fal
    menerima satu gambar referensi. Model
    Seedance 2.0 reference-to-video menerima hingga 9 gambar, 3 video, dan 3 referensi audio, dengan
    total paling banyak 12 file referensi.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Mendukung satu referensi gambar atau satu referensi video.
  </Accordion>
  <Accordion title="MiniMax">
    Hanya satu gambar referensi.
  </Accordion>
  <Accordion title="OpenAI">
    Hanya override `size` yang diteruskan. Override gaya lainnya
    (`aspectRatio`, `resolution`, `audio`, `watermark`) diabaikan dengan
    peringatan.
  </Accordion>
  <Accordion title="Qwen">
    Backend DashScope yang sama dengan Alibaba. Input referensi harus berupa URL
    `http(s)` jarak jauh; file lokal ditolak di awal.
  </Accordion>
  <Accordion title="Runway">
    Mendukung file lokal melalui data URI. Video-to-video memerlukan
    `runway/gen4_aleph`. Eksekusi hanya-teks mengekspos rasio aspek `16:9` dan `9:16`.
  </Accordion>
  <Accordion title="Together">
    Hanya satu gambar referensi.
  </Accordion>
  <Accordion title="Vydra">
    Menggunakan `https://www.vydra.ai/api/v1` secara langsung untuk menghindari redirect
    yang membuang auth. `veo3` dibundel sebagai text-to-video saja; `kling` memerlukan
    URL gambar jarak jauh.
  </Accordion>
  <Accordion title="xAI">
    Mendukung text-to-video, image-to-video satu gambar frame pertama, hingga 7
    input `reference_image` melalui xAI `reference_images`, dan alur edit/perpanjang
    video jarak jauh.
  </Accordion>
</AccordionGroup>

## Mode kapabilitas penyedia

Kontrak pembuatan video bersama mendukung kapabilitas spesifik mode
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

Field agregat datar seperti `maxInputImages` dan `maxInputVideos`
**tidak** cukup untuk mengiklankan dukungan mode transformasi. Penyedia harus
mendeklarasikan `generate`, `imageToVideo`, dan `videoToVideo` secara eksplisit agar pengujian live,
pengujian kontrak, dan alat bersama `video_generate` dapat memvalidasi
dukungan mode secara deterministik.

Saat satu model dalam penyedia memiliki dukungan input referensi yang lebih luas daripada
yang lain, gunakan `maxInputImagesByModel`, `maxInputVideosByModel`, atau
`maxInputAudiosByModel` alih-alih menaikkan batas seluruh mode.

## Pengujian live

Cakupan live opt-in untuk penyedia bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media video
```

File live ini memuat variabel env penyedia yang hilang dari `~/.profile`, mengutamakan
API key live/env di atas profil auth tersimpan secara default, dan menjalankan
smoke yang aman untuk rilis secara default:

- `generate` untuk setiap penyedia non-FAL dalam sweep.
- Prompt lobster satu detik.
- Batas operasi per penyedia dari
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default).

FAL bersifat opt-in karena latensi antrean sisi penyedia dapat mendominasi waktu
rilis:

```bash
pnpm test:live:media video --video-providers fal
```

Tetapkan `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan
mode transformasi yang dideklarasikan dan dapat dijalankan dengan aman oleh shared sweep menggunakan media lokal:

- `imageToVideo` saat `capabilities.imageToVideo.enabled`.
- `videoToVideo` saat `capabilities.videoToVideo.enabled` dan
  penyedia/model menerima input video lokal berbasis buffer dalam
  shared sweep.

Saat ini shared live lane `videoToVideo` hanya mencakup `runway` ketika Anda
memilih `runway/gen4_aleph`.

## Konfigurasi

Tetapkan model pembuatan video default di konfigurasi OpenClaw Anda:

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
- [Task latar belakang](/id/automation/tasks) — pelacakan task untuk pembuatan video asinkron
- [BytePlus](/id/concepts/model-providers#byteplus-international)
- [ComfyUI](/id/providers/comfy)
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults)
- [fal](/id/providers/fal)
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [Models](/id/concepts/models)
- [OpenAI](/id/providers/openai)
- [Qwen](/id/providers/qwen)
- [Runway](/id/providers/runway)
- [Together AI](/id/providers/together)
- [Ikhtisar Tools](/id/tools)
- [Vydra](/id/providers/vydra)
- [xAI](/id/providers/xai)
