---
read_when:
    - Membuat video melalui agen
    - Mengonfigurasi penyedia dan model pembuatan video
    - Memahami parameter alat `video_generate`
summary: Hasilkan video dari teks, gambar, atau video yang sudah ada menggunakan 14 backend penyedia
title: Pembuatan video
x-i18n:
    generated_at: "2026-04-24T09:33:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ddefd4fcde2b22be6631c160ed6e128a97b0800d32c65fb5fe36227ce4f368
    source_path: tools/video-generation.md
    workflow: 15
---

Agen OpenClaw dapat membuat video dari prompt teks, gambar referensi, atau video yang sudah ada. Empat belas backend penyedia didukung, masing-masing dengan opsi model, mode input, dan set fitur yang berbeda. Agen secara otomatis memilih penyedia yang tepat berdasarkan konfigurasi Anda dan API key yang tersedia.

<Note>
Alat `video_generate` hanya muncul ketika setidaknya satu penyedia pembuatan video tersedia. Jika Anda tidak melihatnya di alat agen Anda, setel API key penyedia atau konfigurasi `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw memperlakukan pembuatan video sebagai tiga mode runtime:

- `generate` untuk permintaan text-to-video tanpa media referensi
- `imageToVideo` saat permintaan menyertakan satu atau lebih gambar referensi
- `videoToVideo` saat permintaan menyertakan satu atau lebih video referensi

Penyedia dapat mendukung subset mana pun dari mode tersebut. Alat memvalidasi
mode aktif sebelum pengiriman dan melaporkan mode yang didukung dalam `action=list`.

## Mulai cepat

1. Setel API key untuk penyedia yang didukung:

```bash
export GEMINI_API_KEY="your-key"
```

2. Secara opsional pin model default:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Minta agen:

> Buat video sinematik 5 detik tentang lobster ramah yang berselancar saat matahari terbenam.

Agen memanggil `video_generate` secara otomatis. Tidak perlu allowlisting alat.

## Apa yang terjadi saat Anda membuat video

Pembuatan video bersifat asinkron. Saat agen memanggil `video_generate` dalam sebuah sesi:

1. OpenClaw mengirim permintaan ke penyedia dan segera mengembalikan ID task.
2. Penyedia memproses job di latar belakang (biasanya 30 detik hingga 5 menit tergantung penyedia dan resolusi).
3. Saat video siap, OpenClaw membangunkan sesi yang sama dengan event penyelesaian internal.
4. Agen memposting video yang sudah selesai kembali ke percakapan asli.

Saat sebuah job sedang berjalan, panggilan `video_generate` duplikat dalam sesi yang sama mengembalikan status task saat ini alih-alih memulai pembuatan lain. Gunakan `openclaw tasks list` atau `openclaw tasks show <taskId>` untuk memeriksa progres dari CLI.

Di luar eksekusi agen berbasis sesi (misalnya, pemanggilan alat langsung), alat akan fallback ke pembuatan inline dan mengembalikan path media akhir dalam giliran yang sama.

### Siklus hidup task

Setiap permintaan `video_generate` berpindah melalui empat status:

1. **queued** -- task dibuat, menunggu penyedia menerimanya.
2. **running** -- penyedia sedang memproses (biasanya 30 detik hingga 5 menit tergantung penyedia dan resolusi).
3. **succeeded** -- video siap; agen bangun dan mempostingnya ke percakapan.
4. **failed** -- error penyedia atau timeout; agen bangun dengan detail error.

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Pencegahan duplikasi: jika task video sudah `queued` atau `running` untuk sesi saat ini, `video_generate` mengembalikan status task yang ada alih-alih memulai task baru. Gunakan `action: "status"` untuk memeriksa secara eksplisit tanpa memicu pembuatan baru.

## Penyedia yang didukung

| Penyedia              | Model default                   | Teks | Referensi gambar                                     | Referensi video  | API key                                  |
| --------------------- | ------------------------------- | ---- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Ya   | Ya (URL remote)                                      | Ya (URL remote)  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Ya   | Hingga 2 gambar (khusus model I2V; frame pertama + terakhir) | Tidak            | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Ya   | Hingga 2 gambar (frame pertama + terakhir melalui role) | Tidak            | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Ya   | Hingga 9 gambar referensi                            | Hingga 3 video   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Ya   | 1 gambar                                             | Tidak            | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Ya   | 1 gambar                                             | Tidak            | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Ya   | 1 gambar                                             | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Ya   | 1 gambar                                             | Tidak            | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Ya   | 1 gambar                                             | 1 video          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Ya   | Ya (URL remote)                                      | Ya (URL remote)  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Ya   | 1 gambar                                             | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Ya   | 1 gambar                                             | Tidak            | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Ya   | 1 gambar (`kling`)                                   | Tidak            | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Ya   | 1 gambar                                             | 1 video          | `XAI_API_KEY`                            |

Beberapa penyedia menerima env var API key tambahan atau alternatif. Lihat [halaman penyedia](#related) masing-masing untuk detail.

Jalankan `video_generate action=list` untuk memeriksa penyedia, model, dan
mode runtime yang tersedia saat runtime.

### Matriks kapabilitas yang dideklarasikan

Ini adalah kontrak mode eksplisit yang digunakan oleh `video_generate`, test kontrak,
dan shared live sweep.

| Penyedia | `generate` | `imageToVideo` | `videoToVideo` | Shared live lanes saat ini                                                                                                               |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` remote                           |
| BytePlus | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Ya         | Ya             | Tidak          | Tidak ada dalam shared sweep; cakupan spesifik workflow ada bersama test Comfy                                                          |
| fal      | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| Google   | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; shared `videoToVideo` dilewati karena sweep Gemini/Veo berbasis buffer saat ini tidak menerima input tersebut |
| MiniMax  | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; shared `videoToVideo` dilewati karena jalur org/input ini saat ini memerlukan akses inpaint/remix sisi penyedia |
| Qwen     | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` remote                           |
| Runway   | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` hanya berjalan saat model yang dipilih adalah `runway/gen4_aleph`                            |
| Together | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Ya         | Ya             | Tidak          | `generate`; shared `imageToVideo` dilewati karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar remote             |
| xAI      | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini saat ini memerlukan URL MP4 remote                             |

## Parameter alat

### Wajib

| Parameter | Tipe   | Deskripsi                                                                  |
| --------- | ------ | -------------------------------------------------------------------------- |
| `prompt`  | string | Deskripsi teks video yang akan dibuat (wajib untuk `action: "generate"`) |

### Input konten

| Parameter    | Tipe     | Deskripsi                                                                                                                               |
| ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | Satu gambar referensi (path atau URL)                                                                                                   |
| `images`     | string[] | Banyak gambar referensi (hingga 9)                                                                                                      |
| `imageRoles` | string[] | Hint role opsional per posisi yang paralel dengan daftar gambar gabungan. Nilai kanonis: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | Satu video referensi (path atau URL)                                                                                                    |
| `videos`     | string[] | Banyak video referensi (hingga 4)                                                                                                       |
| `videoRoles` | string[] | Hint role opsional per posisi yang paralel dengan daftar video gabungan. Nilai kanonis: `reference_video`                              |
| `audioRef`   | string   | Satu audio referensi (path atau URL). Digunakan misalnya untuk musik latar atau referensi suara saat penyedia mendukung input audio     |
| `audioRefs`  | string[] | Banyak audio referensi (hingga 3)                                                                                                       |
| `audioRoles` | string[] | Hint role opsional per posisi yang paralel dengan daftar audio gabungan. Nilai kanonis: `reference_audio`                              |

Hint role diteruskan ke penyedia apa adanya. Nilai kanonis berasal dari
union `VideoGenerationAssetRole`, tetapi penyedia mungkin menerima string
role tambahan. Array `*Roles` tidak boleh memiliki entri lebih banyak daripada
daftar referensi yang sesuai; kesalahan off-by-one akan gagal dengan error yang jelas.
Gunakan string kosong untuk membiarkan slot tidak disetel.

### Kontrol gaya

| Parameter         | Tipe    | Deskripsi                                                                             |
| ----------------- | ------- | ------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, atau `adaptive` |
| `resolution`      | string  | `480P`, `720P`, `768P`, atau `1080P`                                                  |
| `durationSeconds` | number  | Durasi target dalam detik (dibulatkan ke nilai terdekat yang didukung penyedia)       |
| `size`            | string  | Hint ukuran saat penyedia mendukungnya                                                |
| `audio`           | boolean | Aktifkan audio yang dihasilkan pada output jika didukung. Berbeda dari `audioRef*` (input) |
| `watermark`       | boolean | Toggle watermark penyedia jika didukung                                               |

`adaptive` adalah sentinel khusus penyedia: nilainya diteruskan apa adanya ke
penyedia yang mendeklarasikan `adaptive` dalam kapabilitas mereka (misalnya BytePlus
Seedance menggunakannya untuk mendeteksi rasio secara otomatis dari dimensi
gambar input). Penyedia yang tidak mendeklarasikannya akan menampilkan nilai itu melalui
`details.ignoredOverrides` dalam hasil alat agar pengabaian tersebut terlihat.

### Lanjutan

| Parameter         | Tipe   | Deskripsi                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `action`          | string | `"generate"` (default), `"status"`, atau `"list"`                                                                                                                                                                                                                                                                                                |
| `model`           | string | Override penyedia/model (misalnya `runway/gen4.5`)                                                                                                                                                                                                                                                                                               |
| `filename`        | string | Hint nama file output                                                                                                                                                                                                                                                                                                                            |
| `timeoutMs`       | number | Timeout permintaan penyedia opsional dalam milidetik                                                                                                                                                                                                                                                                                             |
| `providerOptions` | object | Opsi khusus penyedia sebagai objek JSON (misalnya `{"seed": 42, "draft": true}`). Penyedia yang mendeklarasikan skema bertipe akan memvalidasi key dan tipenya; key yang tidak dikenal atau ketidakcocokan akan melewati kandidat selama fallback. Penyedia tanpa skema yang dideklarasikan menerima opsi apa adanya. Jalankan `video_generate action=list` untuk melihat apa yang diterima tiap penyedia |

Tidak semua penyedia mendukung semua parameter. OpenClaw sudah menormalisasi durasi ke nilai terdekat yang didukung penyedia, dan juga memetakan ulang hint geometri yang diterjemahkan seperti size-to-aspect-ratio saat penyedia fallback mengekspos permukaan kontrol yang berbeda. Override yang benar-benar tidak didukung diabaikan dengan upaya terbaik dan dilaporkan sebagai peringatan dalam hasil alat. Batas kapabilitas keras (seperti terlalu banyak input referensi) gagal sebelum pengiriman.

Hasil alat melaporkan pengaturan yang diterapkan. Saat OpenClaw memetakan ulang durasi atau geometri selama fallback penyedia, nilai `durationSeconds`, `size`, `aspectRatio`, dan `resolution` yang dikembalikan mencerminkan apa yang dikirimkan, dan `details.normalization` menangkap terjemahan dari permintaan ke yang diterapkan.

Input referensi juga memilih mode runtime:

- Tanpa media referensi: `generate`
- Referensi gambar apa pun: `imageToVideo`
- Referensi video apa pun: `videoToVideo`
- Input audio referensi tidak mengubah mode yang di-resolve; input tersebut diterapkan di atas mode apa pun yang dipilih oleh referensi gambar/video, dan hanya berfungsi dengan penyedia yang mendeklarasikan `maxInputAudios`

Campuran referensi gambar dan video bukanlah permukaan kapabilitas bersama yang stabil.
Sebaiknya gunakan satu jenis referensi per permintaan.

#### Fallback dan opsi bertipe

Beberapa pemeriksaan kapabilitas diterapkan pada lapisan fallback, bukan pada
batas alat, agar permintaan yang melebihi batas penyedia utama
tetap dapat berjalan pada fallback yang mampu:

- Jika kandidat aktif tidak mendeklarasikan `maxInputAudios` (atau mendeklarasikannya sebagai
  `0`), kandidat itu dilewati saat permintaan berisi referensi audio, dan
  kandidat berikutnya dicoba.
- Jika `maxDurationSeconds` kandidat aktif lebih rendah daripada
  `durationSeconds` yang diminta dan kandidat tidak mendeklarasikan daftar
  `supportedDurationSeconds`, kandidat itu dilewati.
- Jika permintaan berisi `providerOptions` dan kandidat aktif
  secara eksplisit mendeklarasikan skema `providerOptions` bertipe, kandidat akan
  dilewati ketika key yang diberikan tidak ada dalam skema atau tipe nilainya
  tidak cocok. Penyedia yang belum mendeklarasikan skema menerima
  opsi apa adanya (pass-through yang kompatibel ke belakang). Penyedia dapat
  secara eksplisit memilih keluar dari semua opsi penyedia dengan mendeklarasikan skema kosong
  (`capabilities.providerOptions: {}`), yang menyebabkan perilaku lewati yang sama seperti
  ketidakcocokan tipe.

Alasan lewati pertama dalam sebuah permintaan dicatat pada level `warn` agar operator melihat
saat penyedia utama mereka dilewati; alasan lewati berikutnya dicatat pada
`debug` agar rantai fallback yang panjang tetap senyap. Jika setiap kandidat dilewati,
error agregat menyertakan alasan lewati untuk masing-masing kandidat.

## Aksi

- **generate** (default) -- buat video dari prompt yang diberikan dan input referensi opsional.
- **status** -- periksa status task video yang sedang berjalan untuk sesi saat ini tanpa memulai pembuatan lain.
- **list** -- tampilkan penyedia, model, dan kapabilitas yang tersedia.

## Pemilihan model

Saat membuat video, OpenClaw me-resolve model dalam urutan ini:

1. **Parameter alat `model`** -- jika agen menentukannya dalam panggilan.
2. **`videoGenerationModel.primary`** -- dari konfigurasi.
3. **`videoGenerationModel.fallbacks`** -- dicoba berurutan.
4. **Deteksi otomatis** -- menggunakan penyedia yang memiliki autentikasi valid, dimulai dari penyedia default saat ini, lalu penyedia lain dalam urutan alfabet.

Jika sebuah penyedia gagal, kandidat berikutnya dicoba secara otomatis. Jika semua kandidat gagal, error akan menyertakan detail dari tiap percobaan.

Setel `agents.defaults.mediaGenerationAutoProviderFallback: false` jika Anda ingin
pembuatan video hanya menggunakan entri `model`, `primary`, dan `fallbacks`
yang eksplisit.

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
    Menggunakan endpoint async DashScope / Model Studio. Gambar dan video referensi harus berupa URL `http(s)` remote.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    ID penyedia: `byteplus`.

    Model: `seedance-1-0-pro-250528` (default), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Model T2V (`*-t2v-*`) tidak menerima input gambar; model I2V dan model umum `*-pro-*` mendukung satu gambar referensi (frame pertama). Berikan gambar secara posisional atau setel `role: "first_frame"`. ID model T2V secara otomatis dialihkan ke varian I2V yang sesuai saat gambar diberikan.

    Key `providerOptions` yang didukung: `seed` (number), `draft` (boolean — memaksa 480p), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    Memerlukan plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID penyedia: `byteplus-seedance15`. Model: `seedance-1-5-pro-251215`.

    Menggunakan API `content[]` terpadu. Mendukung maksimal 2 gambar input (`first_frame` + `last_frame`). Semua input harus berupa URL `https://` remote. Setel `role: "first_frame"` / `"last_frame"` pada tiap gambar, atau berikan gambar secara posisional.

    `aspectRatio: "adaptive"` mendeteksi rasio secara otomatis dari gambar input. `audio: true` dipetakan ke `generate_audio`. `providerOptions.seed` (number) diteruskan.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    Memerlukan plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID penyedia: `byteplus-seedance2`. Model: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Menggunakan API `content[]` terpadu. Mendukung hingga 9 gambar referensi, 3 video referensi, dan 3 audio referensi. Semua input harus berupa URL `https://` remote. Setel `role` pada tiap aset — nilai yang didukung: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` mendeteksi rasio secara otomatis dari gambar input. `audio: true` dipetakan ke `generate_audio`. `providerOptions.seed` (number) diteruskan.

  </Accordion>

  <Accordion title="ComfyUI">
    Eksekusi lokal atau cloud yang digerakkan workflow. Mendukung text-to-video dan image-to-video melalui graph yang dikonfigurasi.
  </Accordion>

  <Accordion title="fal">
    Menggunakan alur berbasis antrean untuk job berdurasi panjang. Hanya satu gambar referensi.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Mendukung satu gambar atau satu video referensi.
  </Accordion>

  <Accordion title="MiniMax">
    Hanya satu gambar referensi.
  </Accordion>

  <Accordion title="OpenAI">
    Hanya override `size` yang diteruskan. Override gaya lainnya (`aspectRatio`, `resolution`, `audio`, `watermark`) diabaikan dengan peringatan.
  </Accordion>

  <Accordion title="Qwen">
    Backend DashScope yang sama dengan Alibaba. Input referensi harus berupa URL `http(s)` remote; file lokal langsung ditolak.
  </Accordion>

  <Accordion title="Runway">
    Mendukung file lokal melalui URI data. Video-to-video memerlukan `runway/gen4_aleph`. Eksekusi teks saja mengekspos rasio aspek `16:9` dan `9:16`.
  </Accordion>

  <Accordion title="Together">
    Hanya satu gambar referensi.
  </Accordion>

  <Accordion title="Vydra">
    Menggunakan `https://www.vydra.ai/api/v1` secara langsung untuk menghindari redirect yang menghilangkan autentikasi. `veo3` dibundel hanya sebagai text-to-video; `kling` memerlukan URL gambar remote.
  </Accordion>

  <Accordion title="xAI">
    Mendukung alur text-to-video, image-to-video, dan edit/perpanjang video remote.
  </Accordion>
</AccordionGroup>

## Mode kapabilitas penyedia

Kontrak pembuatan video bersama sekarang memungkinkan penyedia mendeklarasikan
kapabilitas spesifik mode, bukan hanya batas agregat datar. Implementasi
penyedia baru sebaiknya memilih blok mode eksplisit:

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

Bidang agregat datar seperti `maxInputImages` dan `maxInputVideos` tidak
cukup untuk mengiklankan dukungan mode transformasi. Penyedia harus mendeklarasikan
`generate`, `imageToVideo`, dan `videoToVideo` secara eksplisit agar test live,
test kontrak, dan alat `video_generate` bersama dapat memvalidasi dukungan mode
secara deterministik.

## Test live

Cakupan live opt-in untuk penyedia bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media video
```

File live ini memuat env var penyedia yang belum ada dari `~/.profile`, memprioritaskan
API key live/env di atas profil autentikasi yang tersimpan secara default, dan menjalankan
smoke yang aman untuk rilis secara default:

- `generate` untuk setiap penyedia non-FAL dalam sweep
- prompt lobster satu detik
- batas operasi per penyedia dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` secara default)

FAL bersifat opt-in karena latensi antrean di sisi penyedia dapat mendominasi waktu rilis:

```bash
pnpm test:live:media video --video-providers fal
```

Setel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transformasi
yang dideklarasikan yang dapat dijalankan shared sweep dengan aman menggunakan media lokal:

- `imageToVideo` saat `capabilities.imageToVideo.enabled`
- `videoToVideo` saat `capabilities.videoToVideo.enabled` dan penyedia/model
  menerima input video lokal berbasis buffer dalam shared sweep

Saat ini lane live `videoToVideo` bersama mencakup:

- `runway` hanya saat Anda memilih `runway/gen4_aleph`

## Konfigurasi

Setel model pembuatan video default di konfigurasi OpenClaw Anda:

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

- [Tools Overview](/id/tools)
- [Background Tasks](/id/automation/tasks) -- pelacakan task untuk pembuatan video asinkron
- [Alibaba Model Studio](/id/providers/alibaba)
- [BytePlus](/id/concepts/model-providers#byteplus-international)
- [ComfyUI](/id/providers/comfy)
- [fal](/id/providers/fal)
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [OpenAI](/id/providers/openai)
- [Qwen](/id/providers/qwen)
- [Runway](/id/providers/runway)
- [Together AI](/id/providers/together)
- [Vydra](/id/providers/vydra)
- [xAI](/id/providers/xai)
- [Configuration Reference](/id/gateway/config-agents#agent-defaults)
- [Models](/id/concepts/models)
