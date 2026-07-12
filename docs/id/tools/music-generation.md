---
read_when:
    - Menghasilkan musik atau audio melalui agen
    - Mengonfigurasi penyedia dan model pembuatan musik
    - Memahami parameter alat music_generate
sidebarTitle: Music generation
summary: Buat musik melalui music_generate di seluruh alur kerja ComfyUI, fal, Google Lyria, MiniMax, dan OpenRouter
title: Pembuatan musik
x-i18n:
    generated_at: "2026-07-12T14:45:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

Alat `music_generate` membuat musik atau audio melalui kapabilitas bersama
untuk pembuatan musik, yang didukung oleh ComfyUI, fal, Google, MiniMax, dan
OpenRouter.

<Note>
`music_generate` hanya muncul ketika setidaknya satu penyedia pembuatan musik
tersedia: konfigurasi `agents.defaults.musicGenerationModel` yang eksplisit,
atau penyedia yang autentikasinya telah dikonfigurasi (misalnya, kunci API yang
telah ditetapkan).
</Note>

Untuk proses agen berbasis sesi, `music_generate` dimulai sebagai tugas latar
belakang, melacak progres dalam buku besar tugas, lalu membangunkan agen ketika
trek siap agar agen dapat memberi tahu pengguna dan melampirkan audio yang telah
selesai. Agen penyelesaian mengikuti kontrak balasan terlihat milik sesi:
balasan akhir otomatis ketika dikonfigurasi, atau `message(action="send")`
ketika sesi mengharuskan penggunaan alat pesan. Jika sesi pemohon tidak aktif
atau upaya membangunkannya gagal dan audio yang dihasilkan masih belum ada dalam
balasan, OpenClaw mengirimkan fallback langsung idempoten yang hanya berisi
audio yang belum ada tersebut.

## Mulai cepat

<Tabs>
  <Tab title="Didukung penyedia bersama">
    <Steps>
      <Step title="Konfigurasikan autentikasi">
        Tetapkan kunci API untuk setidaknya satu penyedia — misalnya
        `GEMINI_API_KEY` atau `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pilih model bawaan (opsional)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Minta agen">
        _"Buat trek synthpop ceria tentang berkendara pada malam hari
        melintasi kota neon."_

        Agen memanggil `music_generate` secara otomatis. Tidak perlu
        memasukkannya ke daftar izin alat.
      </Step>
    </Steps>

    Tanpa proses agen berbasis sesi (konteks langsung/lokal), alat dijalankan
    secara inline dan mengembalikan jalur media akhir dalam hasil alat yang sama.

  </Tab>
  <Tab title="Alur kerja ComfyUI">
    <Steps>
      <Step title="Konfigurasikan alur kerja">
        Konfigurasikan `plugins.entries.comfy.config.music` dengan JSON alur
        kerja serta Node perintah dan keluaran.
      </Step>
      <Step title="Autentikasi cloud (opsional)">
        Untuk Comfy Cloud, tetapkan `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Panggil alat">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Contoh perintah:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

Gunakan `action: "list"` untuk memeriksa penyedia/model yang tersedia, dan
`action: "status"` untuk memeriksa tugas musik aktif berbasis sesi:

```text
/tool music_generate action=list
/tool music_generate action=status
```

Contoh pembuatan langsung:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Penyedia yang didukung

| Penyedia   | Model bawaan                 | Input referensi    | Kontrol yang didukung                                  | Autentikasi                            |
| ---------- | ---------------------------- | ------------------ | ------------------------------------------------------ | -------------------------------------- |
| ComfyUI    | `workflow`                   | Hingga 1 gambar    | Musik atau audio yang ditentukan alur kerja            | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Tidak ada          | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `FAL_KEY` atau `FAL_API_KEY`           |
| Google     | `lyria-3-clip-preview`       | Hingga 10 gambar   | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | Tidak ada          | `lyrics`, `instrumental`, `format` (hanya mp3)         | `MINIMAX_API_KEY` atau OAuth MiniMax   |
| OpenRouter | `google/lyria-3-pro-preview` | Hingga 1 gambar    | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `OPENROUTER_API_KEY`                   |

MiniMax mendaftarkan dua ID penyedia yang menggunakan model yang sama:
`minimax` untuk autentikasi kunci API dan `minimax-portal` untuk OAuth.
Referensi model mengikuti jalur autentikasi (`minimax/music-2.6` dibandingkan
dengan `minimax-portal/music-2.6`); lihat
[MiniMax](/id/providers/minimax#music-generation).

fal juga menyediakan `fal-ai/ace-step/prompt-to-audio` (wav, tanpa lirik,
tanpa pengalih instrumental) dan `fal-ai/stable-audio-25/text-to-audio` (wav,
hanya perintah) bersama model bawaan yang didukung MiniMax. Model bawaan Google
`lyria-3-clip-preview` hanya menghasilkan mp3; `lyria-3-pro-preview` juga
mendukung wav. MiniMax juga menyediakan `music-2.6-free`, `music-cover`, dan
`music-cover-free`. OpenRouter juga menyediakan
`google/lyria-3-clip-preview`.

### Matriks kapabilitas

Kontrak mode eksplisit yang digunakan oleh `music_generate`, pengujian kontrak,
dan pemeriksaan langsung bersama:

| Penyedia   | `generate` | `edit` | Batas pengeditan | Jalur langsung bersama                                                         |
| ---------- | :--------: | :----: | ---------------- | -------------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 gambar         | Tidak termasuk dalam pemeriksaan bersama; dicakup oleh `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Tidak ada        | `generate`                                                                       |
| Google     |     ✓      |   ✓    | 10 gambar        | `generate`, `edit`                                                               |
| MiniMax    |     ✓      |   —    | Tidak ada        | `generate`                                                                       |
| OpenRouter |     ✓      |   ✓    | 1 gambar         | `generate`, `edit`                                                               |

## Parameter alat

<ParamField path="prompt" type="string" required>
  Perintah pembuatan musik. Wajib untuk `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` mengembalikan tugas sesi saat ini; `"list"` memeriksa penyedia.
</ParamField>
<ParamField path="model" type="string">
  Penggantian penyedia/model (misalnya `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Lirik opsional ketika penyedia mendukung input lirik eksplisit.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Meminta keluaran khusus instrumental ketika penyedia mendukungnya.
</ParamField>
<ParamField path="image" type="string">
  Jalur atau URL satu gambar referensi.
</ParamField>
<ParamField path="images" type="string[]">
  Beberapa gambar referensi (hingga 10 pada penyedia yang mendukungnya).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durasi target dalam detik ketika penyedia mendukung petunjuk durasi.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Petunjuk format keluaran ketika penyedia mendukungnya.
</ParamField>
<ParamField path="filename" type="string">Petunjuk nama berkas keluaran.</ParamField>

<Note>
Tidak semua penyedia mendukung semua parameter. OpenClaw tetap memvalidasi batas
tegas seperti jumlah input sebelum pengiriman. Ketika penyedia mendukung durasi
tetapi menggunakan batas maksimum yang lebih singkat daripada nilai yang
diminta, OpenClaw membatasi nilainya ke durasi terdekat yang didukung. Petunjuk
opsional yang benar-benar tidak didukung akan diabaikan dengan peringatan ketika
penyedia atau model yang dipilih tidak dapat memenuhinya. Hasil alat melaporkan
pengaturan yang diterapkan; `details.normalization` mencatat setiap pemetaan dari
nilai yang diminta ke nilai yang diterapkan.
</Note>

Batas waktu permintaan penyedia hanya merupakan konfigurasi operator. OpenClaw
menggunakan `agents.defaults.musicGenerationModel.timeoutMs` ketika
dikonfigurasi, menaikkan nilai di bawah 120000ms menjadi 120000ms, dan jika tidak
ditetapkan menggunakan batas waktu bawaan 300000ms untuk permintaan penyedia.

## Perilaku asinkron

Pembuatan musik berbasis sesi berjalan sebagai tugas latar belakang:

- **Tugas latar belakang:** `music_generate` membuat tugas latar belakang,
  langsung mengembalikan respons dimulai/tugas, dan mengirimkan trek yang telah
  selesai nanti dalam pesan agen tindak lanjut.
- **Pencegahan duplikasi:** selama tugas berstatus `queued` atau `running`,
  pemanggilan `music_generate` berikutnya dalam sesi yang sama mengembalikan
  status tugas alih-alih memulai pembuatan lain. Gunakan `action: "status"`
  untuk memeriksanya secara eksplisit. Permintaan cocok yang baru saja selesai
  juga dideduplikasi selama 2 menit.
- **Pencarian status:** `openclaw tasks list` atau
  `openclaw tasks show <taskId>` memeriksa status dalam antrean, berjalan, dan
  terminal.
- **Aktivasi penyelesaian:** OpenClaw menyuntikkan kembali peristiwa penyelesaian
  internal ke sesi yang sama agar model dapat menulis sendiri tindak lanjut yang
  ditampilkan kepada pengguna.
- **Petunjuk perintah:** giliran pengguna/manual berikutnya dalam sesi yang sama
  mendapatkan petunjuk runtime singkat ketika tugas musik sedang berlangsung,
  agar model tidak memanggil `music_generate` lagi tanpa pertimbangan.
- **Fallback tanpa sesi:** konteks langsung/lokal tanpa sesi agen nyata berjalan
  secara inline dan mengembalikan hasil audio akhir pada giliran yang sama.

### Siklus hidup tugas

Tugas musik menampilkan status yang sama seperti registri tugas umum (lihat
[Tugas latar belakang](/id/automation/tasks#task-lifecycle) untuk mesin status
lengkap, termasuk `timed_out`, `cancelled`, dan `lost`). Sebagian besar proses
musik melewati:

| Status      | Arti                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `queued`    | Tugas dibuat dan menunggu penyedia menerimanya.                                                           |
| `running`   | Penyedia sedang memproses (biasanya 30 detik hingga 3 menit, tergantung pada penyedia dan durasi).       |
| `succeeded` | Trek siap; agen dibangunkan dan mengirimkannya ke percakapan.                                            |
| `failed`    | Kesalahan atau batas waktu penyedia; agen dibangunkan dengan detail kesalahan.                            |

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Konfigurasi

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### Urutan pemilihan penyedia

OpenClaw mencoba penyedia dalam urutan berikut:

1. Parameter `model` dari pemanggilan alat (jika agen menentukannya).
2. `musicGenerationModel.primary` dari konfigurasi.
3. `musicGenerationModel.fallbacks` secara berurutan.
4. Deteksi otomatis hanya menggunakan bawaan penyedia berbasis autentikasi:
   - penyedia model teks bawaan saat ini terlebih dahulu, jika juga menawarkan
     pembuatan musik;
   - penyedia pembuatan musik terdaftar lainnya, diurutkan menurut abjad
     berdasarkan ID penyedia.

Jika penyedia gagal, kandidat berikutnya akan dicoba secara otomatis. Jika semua
gagal, kesalahan menyertakan detail dari setiap percobaan.

Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` agar hanya
menggunakan entri `model`, `primary`, dan `fallbacks` yang eksplisit.

## Catatan penyedia

<AccordionGroup>
  <Accordion title="ComfyUI">
    Berbasis alur kerja dan bergantung pada graf yang dikonfigurasi serta pemetaan node
    untuk bidang perintah/output. Plugin `comfy` bawaan terhubung ke alat
    `music_generate` bersama melalui registri penyedia pembuatan musik.
  </Accordion>
  <Accordion title="fal">
    Menggunakan endpoint model fal melalui jalur autentikasi penyedia bersama. Penyedia
    bawaan menggunakan `fal-ai/minimax-music/v2.6` secara default dan juga menyediakan
    `fal-ai/ace-step/prompt-to-audio` serta
    `fal-ai/stable-audio-25/text-to-audio` untuk permintaan perintah-ke-audio.
    Lirik dan mode instrumental hanya tersedia untuk model MiniMax; dua model
    lainnya hanya mendukung perintah.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Menggunakan pembuatan batch Lyria 3. Alur bawaan saat ini mendukung
    perintah, teks lirik opsional, dan gambar referensi opsional. Model
    `lyria-3-clip-preview` bawaan hanya menghasilkan mp3; model
    `lyria-3-pro-preview` juga mendukung wav.
  </Accordion>
  <Accordion title="MiniMax">
    Menggunakan endpoint batch `music_generation`. Mendukung perintah, lirik
    opsional, mode instrumental, dan output mp3 melalui autentikasi kunci API
    `minimax` atau OAuth `minimax-portal`. Juga menyediakan model
    `music-2.6-free`, `music-cover`, dan `music-cover-free`.
  </Accordion>
  <Accordion title="OpenRouter">
    Menggunakan output audio penyelesaian percakapan OpenRouter dengan streaming
    diaktifkan. Penyedia bawaan menggunakan `google/lyria-3-pro-preview` secara default
    dan juga menyediakan `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Memilih jalur yang tepat

- **Didukung penyedia bersama** ketika Anda menginginkan pemilihan model, pengalihan
  penyedia saat gagal, dan alur tugas/status asinkron bawaan.
- **Jalur Plugin (ComfyUI)** ketika Anda memerlukan graf alur kerja khusus atau
  penyedia yang bukan bagian dari kemampuan musik bersama bawaan.

Jika Anda men-debug perilaku khusus ComfyUI, lihat
[ComfyUI](/id/providers/comfy). Jika Anda men-debug perilaku penyedia
bersama, mulai dengan [fal](/id/providers/fal), [Google (Gemini)](/id/providers/google),
[MiniMax](/id/providers/minimax), atau [OpenRouter](/id/providers/openrouter).

## Mode kemampuan penyedia

Kontrak pembuatan musik bersama mendukung deklarasi mode eksplisit:

- `generate` untuk pembuatan hanya dari perintah.
- `edit` ketika permintaan menyertakan satu atau beberapa gambar referensi.

Implementasi penyedia baru sebaiknya mengutamakan blok mode eksplisit:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Bidang datar lama seperti `maxInputImages`, `supportsLyrics`, dan
`supportsFormat` **tidak** cukup untuk menyatakan dukungan penyuntingan. Penyedia
sebaiknya mendeklarasikan `generate` dan `edit` secara eksplisit agar pengujian
langsung, pengujian kontrak, dan alat `music_generate` bersama dapat memvalidasi
dukungan mode secara deterministik.

## Pengujian langsung

Cakupan langsung opsional untuk penyedia bersama bawaan (fal, Google, MiniMax,
OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Pembungkus repositori yang setara, yang menjalankan berkas pengujian yang sama:

```bash
pnpm test:live:media:music
```

Berkas pengujian langsung ini secara default menggunakan variabel lingkungan
penyedia yang telah diekspor sebelum profil autentikasi tersimpan, serta
menjalankan cakupan `generate` dan `edit` yang dideklarasikan ketika penyedia
mengaktifkan mode penyuntingan. Cakupan saat ini:

- `google`: `generate` serta `edit`
- `fal`: hanya `generate`
- `minimax`: hanya `generate`
- `openrouter`: `generate` serta `edit`
- `comfy`: cakupan langsung Comfy yang terpisah, bukan bagian dari rangkaian penyedia bersama

Cakupan langsung opsional untuk jalur musik ComfyUI bawaan:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Berkas pengujian langsung Comfy juga mencakup alur kerja gambar dan video comfy
ketika bagian tersebut dikonfigurasi.

## Terkait

- [Tugas latar belakang](/id/automation/tasks) — pelacakan tugas untuk proses `music_generate` yang berjalan terpisah
- [ComfyUI](/id/providers/comfy)
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — konfigurasi `musicGenerationModel`
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [Model](/id/concepts/models) — konfigurasi model dan pengalihan saat gagal
- [Ikhtisar alat](/id/tools)
