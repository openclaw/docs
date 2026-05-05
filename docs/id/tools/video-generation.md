---
read_when:
    - Membuat video melalui agen
    - Mengonfigurasi penyedia dan model pembuatan video
    - Memahami parameter alat video_generate
sidebarTitle: Video generation
summary: Hasilkan video melalui video_generate dari referensi teks, gambar, atau video di 16 backend penyedia
title: Pembuatan video
x-i18n:
    generated_at: "2026-05-05T01:50:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6edce39c3006b748d512fec935b81566ae1a121c280248e9e9439edd1f052d83
    source_path: tools/video-generation.md
    workflow: 16
---

Agen OpenClaw dapat menghasilkan video dari prompt teks, gambar referensi, atau
video yang sudah ada. Enam belas backend penyedia didukung, masing-masing dengan
opsi model, mode input, dan set fitur yang berbeda. Agen memilih penyedia yang
tepat secara otomatis berdasarkan konfigurasi Anda dan kunci API yang tersedia.

<Note>
Alat `video_generate` hanya muncul ketika setidaknya satu penyedia pembuatan
video tersedia. Jika Anda tidak melihatnya di alat agen Anda, tetapkan kunci API
penyedia atau konfigurasikan `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw memperlakukan pembuatan video sebagai tiga mode runtime:

- `generate` — permintaan teks-ke-video tanpa media referensi.
- `imageToVideo` — permintaan menyertakan satu atau beberapa gambar referensi.
- `videoToVideo` — permintaan menyertakan satu atau beberapa video referensi.

Penyedia dapat mendukung subset mana pun dari mode tersebut. Alat memvalidasi
mode aktif sebelum pengiriman dan melaporkan mode yang didukung di `action=list`.

## Mulai cepat

<Steps>
  <Step title="Konfigurasikan autentikasi">
    Tetapkan kunci API untuk penyedia yang didukung:

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
    > Buat video sinematik 5 detik tentang lobster ramah yang berselancar saat matahari terbenam.

    Agen memanggil `video_generate` secara otomatis. Tidak perlu memasukkan
    alat ke daftar izin.

  </Step>
</Steps>

## Cara kerja pembuatan asinkron

Pembuatan video bersifat asinkron. Ketika agen memanggil `video_generate` dalam
sebuah sesi:

1. OpenClaw mengirimkan permintaan ke penyedia dan langsung mengembalikan id tugas.
2. Penyedia memproses pekerjaan di latar belakang (biasanya 30 detik hingga 5 menit bergantung pada penyedia dan resolusi).
3. Ketika video siap, OpenClaw membangunkan sesi yang sama dengan peristiwa penyelesaian internal.
4. Agen memberi tahu pengguna dan melampirkan video yang sudah selesai. Dalam obrolan grup/channel
   yang menggunakan pengiriman terlihat hanya melalui alat pesan, agen meneruskan
   hasil melalui alat pesan, bukan OpenClaw yang mempostingnya secara langsung.

Saat sebuah pekerjaan sedang berjalan, panggilan `video_generate` duplikat dalam
sesi yang sama mengembalikan status tugas saat ini, bukan memulai pembuatan
lain. Gunakan `openclaw tasks list` atau `openclaw tasks show <taskId>` untuk
memeriksa progres dari CLI.

Di luar eksekusi agen yang didukung sesi (misalnya, pemanggilan alat langsung),
alat kembali ke pembuatan inline dan mengembalikan path media akhir
pada giliran yang sama.

File video yang dihasilkan disimpan di bawah penyimpanan media yang dikelola
OpenClaw ketika penyedia mengembalikan byte. Batas penyimpanan video hasil
pembuatan default mengikuti batas media video, dan `agents.defaults.mediaMaxMb`
menaikkannya untuk render yang lebih besar. Ketika penyedia juga mengembalikan
URL keluaran yang dihosting, OpenClaw dapat mengirimkan URL tersebut alih-alih
menggagalkan tugas jika persistensi lokal menolak file yang terlalu besar.

### Siklus hidup tugas

| Status      | Arti                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `queued`    | Tugas dibuat, menunggu penyedia menerimanya.                                                      |
| `running`   | Penyedia sedang memproses (biasanya 30 detik hingga 5 menit bergantung pada penyedia dan resolusi). |
| `succeeded` | Video siap; agen bangun dan mempostingnya ke percakapan.                                         |
| `failed`    | Kesalahan atau timeout penyedia; agen bangun dengan detail kesalahan.                             |

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Jika tugas video sudah `queued` atau `running` untuk sesi saat ini,
`video_generate` mengembalikan status tugas yang ada, bukan memulai yang baru.
Gunakan `action: "status"` untuk memeriksa secara eksplisit tanpa memicu
pembuatan baru.

## Penyedia yang didukung

| Penyedia              | Model default                   | Teks | Referensi gambar                                    | Referensi video                                | Autentikasi                              |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Ya (URL jarak jauh)                                  | Ya (URL jarak jauh)                             | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Hingga 2 gambar (hanya model I2V; frame pertama + terakhir) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Hingga 2 gambar (frame pertama + terakhir melalui peran) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Hingga 9 gambar referensi                            | Hingga 3 video                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 gambar                                             | —                                               | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 gambar; hingga 9 dengan Seedance referensi-ke-video | Hingga 3 video dengan Seedance referensi-ke-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 gambar                                             | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 gambar                                             | —                                               | `MINIMAX_API_KEY` atau OAuth MiniMax     |
| OpenAI                | `sora-2`                        |  ✓   | 1 gambar                                             | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Hingga 4 gambar (frame pertama/terakhir atau referensi) | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Ya (URL jarak jauh)                                  | Ya (URL jarak jauh)                             | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 gambar                                             | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 gambar                                             | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 gambar (`kling`)                                   | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 gambar frame pertama atau hingga 7 `reference_image` | 1 video                                         | `XAI_API_KEY`                            |

Beberapa penyedia menerima variabel lingkungan kunci API tambahan atau alternatif. Lihat
[halaman penyedia](#related) individual untuk detail.

Jalankan `video_generate action=list` untuk memeriksa penyedia, model, dan
mode runtime yang tersedia saat runtime.

### Matriks kapabilitas

Kontrak mode eksplisit yang digunakan oleh `video_generate`, pengujian kontrak, dan
sapu live bersama:

| Penyedia   | `generate` | `imageToVideo` | `videoToVideo` | Lane live bersama hari ini                                                                                                              |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` jarak jauh                       |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | Tidak termasuk dalam sapu bersama; cakupan khusus workflow berada bersama pengujian Comfy                                                |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; skema video native DeepInfra adalah teks-ke-video dalam kontrak yang dibundel                                                |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` hanya saat menggunakan Seedance referensi-ke-video                                            |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` bersama dilewati karena sapu Gemini/Veo berbasis buffer saat ini tidak menerima input tersebut |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` bersama dilewati karena jalur organisasi/input ini saat ini memerlukan akses inpaint/remix sisi penyedia |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` jarak jauh                       |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` berjalan hanya saat model yang dipilih adalah `runway/gen4_aleph`                            |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; `imageToVideo` bersama dilewati karena `veo3` yang dibundel hanya teks dan `kling` yang dibundel memerlukan URL gambar jarak jauh |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini saat ini memerlukan URL MP4 jarak jauh                          |

## Parameter alat

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
Petunjuk peran diteruskan apa adanya ke penyedia. Nilai kanonis berasal dari
union `VideoGenerationAssetRole`, tetapi penyedia dapat menerima string peran
tambahan. Array `*Roles` tidak boleh memiliki entri lebih banyak daripada
daftar referensi yang sesuai; kesalahan selisih satu akan gagal dengan pesan
galat yang jelas. Gunakan string kosong untuk membiarkan sebuah slot tidak
diatur. Untuk xAI, atur setiap peran gambar ke `reference_image` untuk
menggunakan mode pembuatan `reference_images`; hilangkan peran atau gunakan
`first_frame` untuk gambar-ke-video dengan satu gambar.
</Note>

### Kontrol gaya

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, atau `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, atau `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Durasi target dalam detik (dibulatkan ke nilai terdekat yang didukung penyedia).
</ParamField>
<ParamField path="size" type="string">Petunjuk ukuran ketika penyedia mendukungnya.</ParamField>
<ParamField path="audio" type="boolean">
  Aktifkan audio yang dibuat dalam output ketika didukung. Berbeda dari `audioRef*` (input).
</ParamField>
<ParamField path="watermark" type="boolean">Alihkan watermark penyedia ketika didukung.</ParamField>

`adaptive` adalah sentinel khusus penyedia: nilai ini diteruskan apa adanya ke
penyedia yang mendeklarasikan `adaptive` dalam kapabilitasnya (misalnya BytePlus
Seedance menggunakannya untuk mendeteksi rasio secara otomatis dari dimensi
gambar input). Penyedia yang tidak mendeklarasikannya menampilkan nilai melalui
`details.ignoredOverrides` dalam hasil alat agar pengabaian tersebut terlihat.

### Lanjutan

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` mengembalikan tugas sesi saat ini; `"list"` memeriksa penyedia.
</ParamField>
<ParamField path="model" type="string">Override penyedia/model (misalnya `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Petunjuk nama file output.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout permintaan penyedia opsional dalam milidetik.</ParamField>
<ParamField path="providerOptions" type="object">
  Opsi khusus penyedia sebagai objek JSON (misalnya `{"seed": 42, "draft": true}`).
  Penyedia yang mendeklarasikan skema bertipe memvalidasi kunci dan tipe; kunci
  yang tidak dikenal atau ketidakcocokan akan melewati kandidat selama fallback.
  Penyedia tanpa skema yang dideklarasikan menerima opsi apa adanya. Jalankan
  `video_generate action=list` untuk melihat apa yang diterima tiap penyedia.
</ParamField>

<Note>
Tidak semua penyedia mendukung semua parameter. OpenClaw menormalkan durasi ke
nilai terdekat yang didukung penyedia, dan memetakan ulang petunjuk geometri
yang diterjemahkan seperti ukuran-ke-rasio-aspek ketika penyedia fallback
menyediakan permukaan kontrol yang berbeda. Override yang benar-benar tidak
didukung diabaikan dengan upaya terbaik dan dilaporkan sebagai peringatan dalam
hasil alat. Batas kapabilitas keras (seperti terlalu banyak input referensi)
gagal sebelum pengiriman. Hasil alat melaporkan pengaturan yang diterapkan;
`details.normalization` menangkap setiap terjemahan dari diminta-ke-diterapkan.
</Note>

Input referensi memilih mode runtime:

- Tidak ada media referensi → `generate`
- Ada referensi gambar → `imageToVideo`
- Ada referensi video → `videoToVideo`
- Input audio referensi **tidak** mengubah mode yang diselesaikan; input tersebut
  diterapkan di atas mode apa pun yang dipilih referensi gambar/video, dan hanya
  berfungsi dengan penyedia yang mendeklarasikan `maxInputAudios`.

Referensi gambar dan video campuran bukan permukaan kapabilitas bersama yang stabil.
Utamakan satu jenis referensi per permintaan.

#### Fallback dan opsi bertipe

Beberapa pemeriksaan kapabilitas diterapkan pada lapisan fallback, bukan pada
batas alat, sehingga permintaan yang melampaui batas penyedia utama masih dapat
berjalan pada fallback yang mampu:

- Kandidat aktif yang tidak mendeklarasikan `maxInputAudios` (atau `0`) dilewati
  ketika permintaan berisi referensi audio; kandidat berikutnya dicoba.
- `maxDurationSeconds` kandidat aktif di bawah `durationSeconds` yang diminta
  tanpa daftar `supportedDurationSeconds` yang dideklarasikan → dilewati.
- Permintaan berisi `providerOptions` dan kandidat aktif secara eksplisit
  mendeklarasikan skema `providerOptions` bertipe → dilewati jika kunci yang
  diberikan tidak ada dalam skema atau tipe nilai tidak cocok. Penyedia tanpa
  skema yang dideklarasikan menerima opsi apa adanya (pass-through yang kompatibel
  ke belakang). Penyedia dapat memilih keluar dari semua opsi penyedia dengan
  mendeklarasikan skema kosong (`capabilities.providerOptions: {}`), yang
  menyebabkan pelewatan yang sama seperti ketidakcocokan tipe.

Alasan pelewatan pertama dalam sebuah permintaan dicatat pada `warn` agar operator
melihat ketika penyedia utama mereka dilewati; pelewatan berikutnya dicatat pada
`debug` agar rantai fallback panjang tetap tidak bising. Jika setiap kandidat
dilewati, galat gabungan menyertakan alasan pelewatan untuk masing-masing.

## Tindakan

| Tindakan   | Yang dilakukan                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| `generate` | Default. Membuat video dari prompt yang diberikan dan input referensi opsional.                              |
| `status`   | Memeriksa status tugas video yang sedang berjalan untuk sesi saat ini tanpa memulai pembuatan lain.          |
| `list`     | Menampilkan penyedia, model, dan kapabilitasnya yang tersedia.                                               |

## Pemilihan model

OpenClaw menyelesaikan model dalam urutan ini:

1. **Parameter alat `model`** — jika agen menentukannya dalam panggilan.
2. **`videoGenerationModel.primary`** dari konfigurasi.
3. **`videoGenerationModel.fallbacks`** secara berurutan.
4. **Deteksi otomatis** — penyedia yang memiliki autentikasi valid, dimulai dari
   penyedia default saat ini, lalu penyedia yang tersisa dalam urutan alfabetis.

Jika sebuah penyedia gagal, kandidat berikutnya dicoba secara otomatis. Jika semua
kandidat gagal, galat menyertakan detail dari setiap percobaan.

Atur `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk hanya
menggunakan entri `model`, `primary`, dan `fallbacks` eksplisit.

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
    Berikan gambar secara posisional atau atur `role: "first_frame"`.
    ID model T2V secara otomatis dialihkan ke varian I2V yang sesuai
    ketika gambar diberikan.

    Kunci `providerOptions` yang didukung: `seed` (number), `draft` (boolean —
    memaksa 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Memerlukan Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID penyedia: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Menggunakan API `content[]` terpadu. Mendukung paling banyak 2 gambar input
    (`first_frame` + `last_frame`). Semua input harus berupa URL `https://`
    jarak jauh. Atur `role: "first_frame"` / `"last_frame"` pada setiap gambar,
    atau berikan gambar secara posisional.

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
    3 video referensi, dan 3 audio referensi. Semua input harus berupa URL
    `https://` jarak jauh. Atur `role` pada setiap aset — nilai yang didukung:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` mendeteksi rasio secara otomatis dari gambar input.
    `audio: true` dipetakan ke `generate_audio`. `providerOptions.seed`
    (number) diteruskan.

  </Accordion>
  <Accordion title="ComfyUI">
    Eksekusi lokal atau cloud berbasis workflow. Mendukung teks-ke-video dan
    gambar-ke-video melalui graf yang dikonfigurasi.
  </Accordion>
  <Accordion title="fal">
    Menggunakan alur berbasis antrean untuk pekerjaan berjalan lama. Sebagian besar
    model video fal menerima satu referensi gambar. Model referensi-ke-video
    Seedance 2.0 menerima hingga 9 gambar, 3 video, dan 3 referensi audio, dengan
    total paling banyak 12 file referensi.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Mendukung satu gambar atau satu referensi video.
  </Accordion>
  <Accordion title="MiniMax">
    Hanya satu referensi gambar.
  </Accordion>
  <Accordion title="OpenAI">
    Hanya override `size` yang diteruskan. Override gaya lain
    (`aspectRatio`, `resolution`, `audio`, `watermark`) diabaikan dengan
    peringatan.
  </Accordion>
  <Accordion title="OpenRouter">
    Menggunakan API `/videos` asinkron OpenRouter. OpenClaw mengirimkan
    pekerjaan, melakukan polling `polling_url`, dan mengunduh `unsigned_urls`
    atau endpoint konten pekerjaan yang terdokumentasi. Default
    `google/veo-3.1-fast` bawaan mengiklankan durasi 4/6/8 detik, resolusi
    `720P`/`1080P`, dan rasio aspek `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Backend DashScope yang sama seperti Alibaba. Input referensi harus berupa
    URL `http(s)` jarak jauh; file lokal ditolak sejak awal.
  </Accordion>
  <Accordion title="Runway">
    Mendukung file lokal melalui URI data. Video-ke-video memerlukan
    `runway/gen4_aleph`. Eksekusi hanya-teks menyediakan rasio aspek `16:9`
    dan `9:16`.
  </Accordion>
  <Accordion title="Together">
    Hanya satu referensi gambar.
  </Accordion>
  <Accordion title="Vydra">
    Menggunakan `https://www.vydra.ai/api/v1` secara langsung untuk menghindari
    redirect yang menghapus autentikasi. `veo3` dibundel hanya sebagai teks-ke-video;
    `kling` memerlukan URL gambar jarak jauh.
  </Accordion>
  <Accordion title="xAI">
    Mendukung teks-ke-video, gambar-ke-video dengan satu frame pertama, hingga 7
    input `reference_image` melalui `reference_images` xAI, serta alur edit/perpanjang
    video jarak jauh.
  </Accordion>
</AccordionGroup>

## Mode kapabilitas penyedia

Kontrak pembuatan video bersama mendukung kapabilitas khusus mode
alih-alih hanya batas agregat datar. Implementasi penyedia baru
sebaiknya mengutamakan blok mode eksplisit:

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
**tidak** cukup untuk mengiklankan dukungan mode transformasi. Penyedia
sebaiknya mendeklarasikan `generate`, `imageToVideo`, dan `videoToVideo`
secara eksplisit agar pengujian langsung, pengujian kontrak, dan alat
bersama `video_generate` dapat memvalidasi dukungan mode secara
deterministik.

Ketika satu model dalam suatu penyedia memiliki dukungan input referensi
yang lebih luas daripada yang lain, gunakan `maxInputImagesByModel`,
`maxInputVideosByModel`, atau `maxInputAudiosByModel` alih-alih menaikkan
batas di seluruh mode.

## Pengujian langsung

Cakupan langsung opsional untuk penyedia bundel bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media video
```

Berkas langsung ini memuat variabel env penyedia yang hilang dari
`~/.profile`, secara default mengutamakan kunci API live/env daripada
profil autentikasi yang tersimpan, dan secara default menjalankan smoke
test yang aman untuk rilis:

- `generate` untuk setiap penyedia non-FAL dalam sweep.
- Prompt lobster satu detik.
- Batas operasi per penyedia dari
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default).

FAL bersifat opsional karena latensi antrean di sisi penyedia dapat
mendominasi waktu rilis:

```bash
pnpm test:live:media video --video-providers fal
```

Atur `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan
mode transformasi yang dideklarasikan yang dapat dijalankan oleh sweep
bersama secara aman dengan media lokal:

- `imageToVideo` ketika `capabilities.imageToVideo.enabled`.
- `videoToVideo` ketika `capabilities.videoToVideo.enabled` dan
  penyedia/model menerima input video lokal berbasis buffer dalam sweep
  bersama.

Saat ini lane langsung bersama `videoToVideo` hanya mencakup `runway`
ketika Anda memilih `runway/gen4_aleph`.

## Konfigurasi

Atur model pembuatan video default dalam konfigurasi OpenClaw Anda:

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
