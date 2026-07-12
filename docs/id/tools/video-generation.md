---
read_when:
    - Membuat video melalui agen
    - Mengonfigurasi penyedia dan model pembuatan video
    - Memahami parameter alat video_generate
sidebarTitle: Video generation
summary: Buat video melalui video_generate dari referensi teks, gambar, atau video di 16 backend penyedia
title: Pembuatan video
x-i18n:
    generated_at: "2026-07-12T14:44:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

Agen OpenClaw menghasilkan video dari perintah teks, gambar referensi, atau
video yang sudah ada melalui `video_generate`. Enam belas backend penyedia
didukung; agen memilih backend yang tepat secara otomatis berdasarkan konfigurasi dan
kunci API yang tersedia.

<Note>
`video_generate` hanya muncul jika setidaknya satu penyedia pembuatan video
tersedia. Jika tidak ada di antara alat agen Anda, tetapkan kunci API penyedia atau
konfigurasikan `agents.defaults.videoGenerationModel`.
</Note>

`video_generate` memiliki tiga mode runtime yang ditentukan dari masukan referensi
dalam panggilan:

- `generate` - tanpa media referensi (teks-ke-video).
- `imageToVideo` - satu atau beberapa gambar referensi.
- `videoToVideo` - satu atau beberapa video referensi.

Penyedia dapat mendukung kombinasi apa pun dari mode tersebut. Alat ini memvalidasi
mode aktif sebelum pengiriman dan melaporkan mode yang didukung dalam `action=list`.

## Mulai cepat

<Steps>
  <Step title="Konfigurasikan autentikasi">
    Tetapkan kunci API untuk penyedia apa pun yang didukung:

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
    > Buat video sinematik berdurasi 5 detik tentang lobster ramah yang berselancar saat matahari terbenam.

    Agen memanggil `video_generate` secara otomatis. Daftar izin alat
    tidak diperlukan.

  </Step>
</Steps>

## Cara kerja pembuatan asinkron

Pembuatan video berlangsung secara asinkron:

1. OpenClaw mengirimkan permintaan ke penyedia dan segera mengembalikan id tugas.
2. Penyedia memproses pekerjaan di latar belakang (biasanya 30 detik hingga beberapa menit, bergantung pada penyedia dan resolusi; penyedia lambat berbasis antrean dapat berjalan hingga batas waktu yang dikonfigurasi).
3. Saat video siap, OpenClaw membangunkan sesi yang sama dengan peristiwa penyelesaian internal.
4. Agen melaporkannya melalui mode balasan terlihat normal milik sesi:
   balasan akhir otomatis, atau `message(action="send")` saat sesi mengharuskan
   alat pesan. Jika sesi peminta tidak aktif, atau proses membangunkannya gagal dan
   media yang dihasilkan masih tidak ada dalam balasan penyelesaian, OpenClaw mengirimkan
   fallback langsung idempoten beserta medianya.

Saat pekerjaan sedang berlangsung, panggilan `video_generate` duplikat dalam
sesi yang sama mengembalikan status tugas saat ini alih-alih memulai
pembuatan lain. Gunakan `action: "status"` untuk memeriksa tanpa memicu
pembuatan baru, atau `openclaw tasks list` / `openclaw tasks show <lookup>` dari
CLI (lihat [Tugas latar belakang](/id/automation/tasks)).

Di luar eksekusi agen berbasis sesi (misalnya, pemanggilan alat secara langsung),
alat beralih ke pembuatan inline dan mengembalikan jalur media akhir
dalam giliran yang sama.

File video yang dihasilkan disimpan di penyimpanan media yang dikelola OpenClaw saat
penyedia mengembalikan byte. Batas default adalah 16 MB (batas bersama untuk media
video); `agents.defaults.mediaMaxMb` menaikkannya untuk hasil render yang lebih besar. Saat
penyedia juga mengembalikan URL keluaran yang dihosting, OpenClaw mengirimkan URL tersebut
alih-alih menggagalkan tugas jika persistensi lokal menolak file yang terlalu besar.

### Siklus hidup tugas

| Status      | Arti                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Tugas dibuat dan menunggu penyedia menerimanya.                                                        |
| `running`   | Penyedia sedang memproses (biasanya 30 detik hingga beberapa menit, bergantung pada penyedia dan resolusi). |
| `succeeded` | Video siap; agen dibangunkan dan mengirimkannya ke percakapan.                                         |
| `failed`    | Kesalahan penyedia atau batas waktu habis; agen dibangunkan dengan detail kesalahan.                    |

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## Penyedia yang didukung

| Penyedia              | Model default                   | Teks | Ref. gambar                                          | Ref. video                                      | Autentikasi                              |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Ya (URL jarak jauh)                                  | Ya (URL jarak jauh)                             | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Hingga 2 gambar (khusus model I2V; bingkai pertama + terakhir) | -                                        | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Hingga 2 gambar (bingkai pertama + terakhir melalui peran) | -                                          | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Hingga 9 gambar referensi                            | Hingga 3 video                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 gambar                                             | -                                               | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 gambar; hingga 9 dengan referensi-ke-video Seedance | Hingga 3 video dengan referensi-ke-video Seedance | `FAL_KEY`                              |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 gambar                                             | 1 video                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 gambar                                             | -                                               | `MINIMAX_API_KEY` atau OAuth MiniMax     |
| OpenAI                | `sora-2`                        |  ✓   | 1 gambar                                             | 1 video                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Hingga 4 gambar (bingkai pertama/terakhir atau referensi) | -                                          | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Ya (URL jarak jauh)                                  | Ya (URL jarak jauh)                             | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 gambar                                             | 1 video                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | Khusus `Wan-AI/Wan2.2-I2V-A14B`                     | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 gambar (`kling`)                                   | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | Klasik: 1 bingkai pertama atau 7 referensi; 1.5: 1 bingkai | Klasik: 1 video                           | `XAI_API_KEY`                            |

Beberapa penyedia menerima variabel lingkungan kunci API tambahan atau alternatif. Lihat
[halaman penyedia](#related) masing-masing untuk detailnya.

Jalankan `video_generate action=list` untuk memeriksa penyedia, model, dan
mode runtime yang tersedia saat runtime.

### Matriks kemampuan

Kontrak mode eksplisit yang digunakan oleh `video_generate`, pengujian kontrak, dan
sweep langsung bersama:

| Penyedia   | `generate` | `imageToVideo` | `videoToVideo` | Jalur langsung bersama saat ini                                                                                                        |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` jarak jauh                        |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | Tidak termasuk dalam sweep bersama; cakupan khusus alur kerja berada dalam pengujian Comfy                                              |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; skema video asli DeepInfra adalah teks-ke-video dalam kontrak plugin                                                        |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` hanya saat menggunakan referensi-ke-video Seedance                                           |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` bersama dilewati karena sweep Gemini/Veo berbasis buffer saat ini tidak menerima masukan tersebut |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` bersama dilewati karena jalur organisasi/masukan ini saat ini memerlukan akses pengeditan video dari penyedia |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` jarak jauh                        |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` hanya berjalan saat model yang dipilih adalah `runway/gen4_aleph`                            |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; `imageToVideo` bersama dilewati karena `veo3` bawaan hanya mendukung teks dan `kling` bawaan memerlukan URL gambar jarak jauh |
| xAI        |     ✓      |       ✓        |       ✓        | Klasik mendukung semua mode; Video 1.5 hanya mendukung gambar-ke-video; masukan MP4 jarak jauh membuat `videoToVideo` tidak disertakan dalam sweep bersama |

## Parameter alat

### Wajib

<ParamField path="prompt" type="string" required>
  Deskripsi teks untuk video yang akan dihasilkan. Wajib untuk `action: "generate"`.
</ParamField>

### Masukan konten

<ParamField path="image" type="string">Satu gambar referensi (jalur atau URL).</ParamField>
<ParamField path="images" type="string[]">Beberapa gambar referensi (hingga 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Petunjuk peran opsional per posisi yang sejajar dengan daftar gabungan gambar.
Nilai kanonis: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Satu video referensi (jalur atau URL).</ParamField>
<ParamField path="videos" type="string[]">Beberapa video referensi (hingga 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Petunjuk peran opsional per posisi yang sejajar dengan daftar gabungan video.
Nilai kanonis: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Satu audio referensi (jalur atau URL). Digunakan untuk musik latar atau
referensi suara ketika penyedia mendukung masukan audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Beberapa audio referensi (hingga 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Petunjuk peran opsional per posisi yang sejajar dengan daftar gabungan audio.
Nilai kanonis: `reference_audio`.
</ParamField>

<Note>
Petunjuk peran diteruskan ke penyedia apa adanya. Nilai kanonis berasal dari
union `VideoGenerationAssetRole`, tetapi penyedia dapat menerima string
peran tambahan. Larik `*Roles` tidak boleh memiliki lebih banyak entri daripada
daftar referensi yang terkait; kesalahan selisih satu akan gagal dengan pesan kesalahan yang jelas.
Gunakan string kosong untuk membiarkan slot tidak ditetapkan. Untuk xAI, tetapkan setiap peran gambar ke
`reference_image` agar menggunakan mode pembuatan `reference_images`; hilangkan
peran atau gunakan `first_frame` untuk gambar-ke-video dengan satu gambar.
</Note>

### Kontrol gaya

<ParamField path="aspectRatio" type="string">
  Petunjuk rasio aspek seperti `1:1`, `16:9`, `9:16`, `adaptive`, atau nilai khusus penyedia. OpenClaw menormalkan atau mengabaikan nilai yang tidak didukung untuk setiap penyedia.
</ParamField>
<ParamField path="resolution" type="string">Petunjuk resolusi seperti `360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K`, atau nilai khusus penyedia. OpenClaw menormalkan atau mengabaikan nilai yang tidak didukung untuk setiap penyedia.</ParamField>
<ParamField path="durationSeconds" type="number">
  Durasi target dalam detik (dibulatkan ke nilai terdekat yang didukung penyedia).
</ParamField>
<ParamField path="size" type="string">Petunjuk ukuran ketika penyedia mendukungnya.</ParamField>
<ParamField path="audio" type="boolean">
  Aktifkan audio yang dihasilkan dalam keluaran jika didukung. Berbeda dari `audioRef*` (masukan).
</ParamField>
<ParamField path="watermark" type="boolean">Aktifkan atau nonaktifkan tanda air penyedia jika didukung.</ParamField>

`adaptive` adalah sentinel khusus penyedia: nilai ini diteruskan apa adanya kepada
penyedia yang mendeklarasikan `adaptive` dalam kapabilitasnya (misalnya, BytePlus
Seedance menggunakannya untuk mendeteksi rasio secara otomatis dari dimensi
gambar masukan). Penyedia yang tidak mendeklarasikannya menampilkan nilai tersebut melalui
`details.ignoredOverrides` dalam hasil alat agar pengabaiannya terlihat.

### Lanjutan

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` mengembalikan tugas sesi saat ini; `"list"` memeriksa penyedia.
</ParamField>
<ParamField path="model" type="string">Penggantian penyedia/model (misalnya, `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Petunjuk nama berkas keluaran.</ParamField>
<ParamField path="timeoutMs" type="number">Batas waktu operasi penyedia opsional dalam milidetik. Jika dihilangkan, OpenClaw menggunakan `agents.defaults.videoGenerationModel.timeoutMs` jika dikonfigurasi, atau nilai bawaan penyedia yang ditentukan oleh pembuat plugin jika tersedia.</ParamField>
<ParamField path="providerOptions" type="object">
  Opsi khusus penyedia sebagai objek JSON (misalnya, `{"seed": 42, "draft": true}`).
  Penyedia yang mendeklarasikan skema bertipe akan memvalidasi kunci dan tipe; kunci
  yang tidak dikenal atau ketidakcocokan akan melewati kandidat selama fallback. Penyedia tanpa
  skema yang dideklarasikan menerima opsi apa adanya. Jalankan `video_generate action=list`
  untuk melihat apa yang diterima setiap penyedia.
</ParamField>

<Note>
Tidak semua penyedia mendukung semua parameter. OpenClaw menormalkan durasi ke
nilai terdekat yang didukung penyedia, serta memetakan ulang petunjuk geometri yang diterjemahkan
seperti ukuran-ke-rasio-aspek ketika penyedia fallback menyediakan
permukaan kontrol yang berbeda. Penggantian yang benar-benar tidak didukung akan diabaikan sebisa mungkin
dan dilaporkan sebagai peringatan dalam hasil alat. Batas kapabilitas mutlak
(seperti terlalu banyak masukan referensi) akan gagal sebelum pengiriman. Hasil alat
melaporkan pengaturan yang diterapkan; `details.normalization` mencatat setiap
penerjemahan dari nilai yang diminta ke nilai yang diterapkan.
</Note>

Masukan referensi memilih mode waktu proses:

- Tanpa media referensi -> `generate`
- Referensi gambar apa pun -> `imageToVideo`
- Referensi video apa pun -> `videoToVideo`
- Masukan audio referensi **tidak** mengubah mode yang ditetapkan; masukan tersebut diterapkan
  di atas mode apa pun yang dipilih oleh referensi gambar/video, dan hanya berfungsi
  dengan penyedia yang mendeklarasikan `maxInputAudios`.

Campuran referensi gambar dan video bukanlah permukaan kapabilitas bersama yang stabil.
Utamakan satu jenis referensi per permintaan.

#### Fallback dan opsi bertipe

Beberapa pemeriksaan kapabilitas berlaku pada lapisan fallback, bukan pada batas
alat, sehingga permintaan yang melampaui batas penyedia utama masih dapat
dijalankan pada fallback yang kapabel:

- Kandidat aktif yang tidak mendeklarasikan `maxInputAudios` (atau `0`) akan dilewati ketika
  permintaan berisi referensi audio; kandidat berikutnya akan dicoba. Pemeriksaan yang sama
  berlaku untuk jumlah referensi gambar dan video terhadap
  `maxInputImages`/`maxInputVideos`.
- `maxDurationSeconds` kandidat aktif yang lebih rendah daripada `durationSeconds` yang diminta
  tanpa daftar `supportedDurationSeconds` yang dideklarasikan -> dilewati.
- Permintaan berisi `providerOptions` dan kandidat aktif secara eksplisit
  mendeklarasikan skema `providerOptions` bertipe -> dilewati jika kunci yang diberikan
  tidak ada dalam skema atau tipe nilainya tidak cocok. Penyedia tanpa
  skema yang dideklarasikan menerima opsi apa adanya (penerusan
  yang kompatibel ke belakang). Penyedia dapat menolak semua opsi penyedia dengan
  mendeklarasikan skema kosong (`capabilities.providerOptions: {}`), yang
  menyebabkan kandidat dilewati seperti pada ketidakcocokan tipe.

Alasan pelewatan pertama dalam suatu permintaan dicatat pada tingkat `warn` agar operator mengetahui kapan
penyedia utama mereka dilewati; pelewatan berikutnya dicatat pada tingkat `debug` untuk
menjaga agar rantai fallback yang panjang tidak bising. Jika setiap kandidat dilewati,
kesalahan gabungan menyertakan alasan pelewatan untuk masing-masing kandidat.

## Tindakan

| Tindakan   | Fungsinya                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Bawaan. Membuat video dari perintah yang diberikan dan masukan referensi opsional.                       |
| `status`   | Memeriksa status tugas video yang sedang berjalan untuk sesi saat ini tanpa memulai pembuatan lainnya.   |
| `list`     | Menampilkan penyedia, model, dan kapabilitas yang tersedia.                                              |

## Pemilihan model

OpenClaw menetapkan model dengan urutan berikut:

1. **Parameter alat `model`** - jika agen menentukannya dalam panggilan.
2. **`videoGenerationModel.primary`** dari konfigurasi.
3. **`videoGenerationModel.fallbacks`** sesuai urutan.
4. **Deteksi otomatis** - penyedia yang memiliki autentikasi valid, dimulai dari
   penyedia bawaan saat ini, lalu penyedia lainnya dalam urutan alfabet.

Jika penyedia gagal, kandidat berikutnya akan dicoba secara otomatis. Jika semua
kandidat gagal, pesan kesalahan menyertakan detail dari setiap percobaan.

Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk hanya menggunakan
entri `model`, `primary`, dan `fallbacks` yang eksplisit.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // penggantian batas waktu permintaan penyedia per alat yang opsional
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

    Model: `seedance-1-0-pro-250528` (bawaan),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Model T2V (`*-t2v-*`) tidak menerima masukan gambar; model I2V dan
    model umum `*-pro-*` mendukung satu gambar referensi (bingkai
    pertama). Berikan gambar berdasarkan posisi atau tetapkan `role: "first_frame"`.
    ID model T2V secara otomatis dialihkan ke varian I2V yang sesuai
    ketika gambar diberikan.

    Kunci `providerOptions` yang didukung: `seed` (angka), `draft` (boolean -
    memaksa 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Memerlukan plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (eksternal, tidak disertakan). ID penyedia: `byteplus-seedance15`. Model:
    `seedance-1-5-pro-251215`.

    Menggunakan API `content[]` terpadu. Mendukung paling banyak 2 gambar masukan
    (`first_frame` + `last_frame`). Semua masukan harus berupa URL `https://`
    jarak jauh. Tetapkan `role: "first_frame"` / `"last_frame"` pada setiap gambar, atau
    berikan gambar berdasarkan posisi.

    `aspectRatio: "adaptive"` mendeteksi rasio secara otomatis dari gambar masukan.
    `audio: true` dipetakan ke `generate_audio`. `providerOptions.seed`
    (angka) diteruskan.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Memerlukan plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (eksternal, tidak disertakan). ID penyedia: `byteplus-seedance2`. Model:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Menggunakan API `content[]` terpadu. Mendukung hingga 9 gambar referensi,
    3 video referensi, dan 3 audio referensi. Semua masukan harus berupa URL
    `https://` jarak jauh. Tetapkan `role` pada setiap aset - nilai yang didukung:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` mendeteksi rasio secara otomatis dari gambar masukan.
    `audio: true` dipetakan ke `generate_audio`. `providerOptions.seed`
    (angka) diteruskan.

  </Accordion>
  <Accordion title="ComfyUI">
    Eksekusi lokal atau cloud berbasis alur kerja. Mendukung teks-ke-video dan
    gambar-ke-video melalui graf yang dikonfigurasi.
  </Accordion>
  <Accordion title="fal">
    Menggunakan alur berbasis antrean untuk pekerjaan yang berjalan lama. Secara default, OpenClaw menunggu hingga 20
    menit sebelum menganggap pekerjaan antrean fal yang masih berlangsung telah
    kehabisan waktu. Sebagian besar model video fal
    menerima satu referensi gambar. Model referensi-ke-video Seedance 2.0
    menerima hingga 9 gambar, 3 video, dan 3 referensi audio, dengan
    maksimum 12 berkas referensi secara keseluruhan.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Mendukung satu referensi gambar atau satu referensi video. Permintaan audio yang dihasilkan
    diabaikan dengan peringatan pada jalur API Gemini karena API tersebut menolak
    parameter `generateAudio` untuk pembuatan video Veo saat ini.
  </Accordion>
  <Accordion title="MiniMax">
    Hanya satu referensi gambar. MiniMax menerima resolusi `768P` dan `1080P`;
    permintaan seperti `720P` dinormalisasi ke nilai terdekat yang
    didukung sebelum dikirim.
  </Accordion>
  <Accordion title="OpenAI">
    Hanya penimpaan `size` yang diteruskan. Penimpaan gaya lainnya
    (`aspectRatio`, `resolution`, `audio`, `watermark`) diabaikan dengan
    peringatan.
  </Accordion>
  <Accordion title="OpenRouter">
    Menggunakan API `/videos` asinkron milik OpenRouter. OpenClaw mengirimkan
    pekerjaan, melakukan polling pada `polling_url`, dan mengunduh `unsigned_urls` atau
    endpoint konten pekerjaan yang didokumentasikan. Default bawaan `google/veo-3.1-fast`
    menawarkan durasi 4/6/8 detik, resolusi `720P`/`1080P`, dan
    rasio aspek `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Menggunakan backend DashScope yang sama dengan Alibaba. Input referensi harus berupa
    URL `http(s)` jarak jauh; berkas lokal langsung ditolak.
  </Accordion>
  <Accordion title="Runway">
    Mendukung berkas lokal melalui URI data. Video-ke-video memerlukan
    `runway/gen4_aleph`. Eksekusi khusus teks menyediakan rasio aspek `16:9` dan
    `9:16`.
  </Accordion>
  <Accordion title="Together">
    Hanya satu referensi gambar.
  </Accordion>
  <Accordion title="Vydra">
    Menggunakan `https://www.vydra.ai/api/v1` secara langsung untuk menghindari pengalihan
    yang menghilangkan autentikasi. `veo3` disertakan hanya sebagai teks-ke-video; `kling` memerlukan
    URL gambar jarak jauh.
  </Accordion>
  <Accordion title="xAI">
    Model default `grok-imagine-video` mendukung teks-ke-video, gambar-ke-video
    dengan satu gambar bingkai pertama, hingga 7 input `reference_image` melalui
    `reference_images` xAI, serta alur pengeditan/perpanjangan video jarak jauh. Pembuatan secara default
    menggunakan `480P`; gambar-ke-video dengan satu gambar mewarisi rasio sumber ketika
    `aspectRatio` tidak ditentukan. Pengeditan/perpanjangan video mewarisi geometri input dan
    tidak menerima penimpaan rasio aspek atau resolusi. Perpanjangan menerima durasi 2–10
    detik.

    `grok-imagine-video-1.5` hanya mendukung gambar-ke-video: berikan tepat satu gambar.
    Model ini mendukung durasi 1–15 detik serta `480P`, `720P`, atau `1080P`, dengan default
    `480P`; jangan tentukan `aspectRatio` agar rasio gambar sumber diwarisi. Pengidentifikasi
    pratinjau dan 1.5 bertanggal menerima validasi yang sama dan diteruskan
    tanpa perubahan.

  </Accordion>
</AccordionGroup>

## Mode kapabilitas penyedia

Kontrak bersama pembuatan video mendukung kapabilitas khusus mode,
bukan hanya batas agregat datar. Implementasi penyedia baru
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

Kolom agregat datar seperti `maxInputImages` dan `maxInputVideos`
**tidak** cukup untuk menyatakan dukungan mode transformasi. Penyedia sebaiknya
mendeklarasikan `generate`, `imageToVideo`, dan `videoToVideo` secara eksplisit agar pengujian
langsung, pengujian kontrak, dan alat bersama `video_generate` dapat memvalidasi
dukungan mode secara deterministik.

Ketika satu model dalam suatu penyedia memiliki dukungan input referensi yang lebih luas daripada
model lainnya, gunakan `maxInputImagesByModel`, `maxInputVideosByModel`, atau
`maxInputAudiosByModel` alih-alih menaikkan batas untuk seluruh mode.

## Pengujian langsung

Cakupan langsung opsional untuk penyedia bersama bawaan:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Pembungkus repo:

```bash
pnpm test:live:media video
```

Secara default, berkas pengujian langsung ini menggunakan variabel lingkungan penyedia yang sudah diekspor
sebelum profil autentikasi tersimpan, dan menjalankan pengujian singkat yang aman untuk rilis:

- `generate` untuk setiap penyedia non-FAL dalam rangkaian.
- Prompt lobster berdurasi satu detik.
- Batas operasi per penyedia dari
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (default `180000`).

FAL bersifat opsional karena latensi antrean di sisi penyedia dapat mendominasi waktu
rilis:

```bash
pnpm test:live:media video --video-providers fal
```

Tetapkan `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk turut menjalankan mode
transformasi yang dideklarasikan dan dapat dijalankan dengan aman oleh rangkaian bersama menggunakan media lokal:

- `imageToVideo` ketika `capabilities.imageToVideo.enabled`.
- `videoToVideo` ketika `capabilities.videoToVideo.enabled` dan
  penyedia/model menerima input video lokal berbasis buffer dalam rangkaian
  bersama.

Saat ini jalur langsung bersama `videoToVideo` hanya mencakup `runway` ketika Anda
memilih `runway/gen4_aleph`.

## Konfigurasi

Tetapkan model pembuatan video default dalam konfigurasi OpenClaw Anda:

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
- [Tugas latar belakang](/id/automation/tasks) - pelacakan tugas untuk pembuatan video asinkron
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
