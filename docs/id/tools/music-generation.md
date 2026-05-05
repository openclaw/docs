---
read_when:
    - Menghasilkan musik atau audio melalui agen
    - Mengonfigurasi penyedia dan model pembuatan musik
    - Memahami parameter alat music_generate
sidebarTitle: Music generation
summary: Hasilkan musik melalui music_generate di seluruh alur kerja Google Lyria, MiniMax, dan ComfyUI
title: Pembuatan musik
x-i18n:
    generated_at: "2026-05-05T06:18:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

Alat `music_generate` memungkinkan agen membuat musik atau audio melalui
kapabilitas pembuatan musik bersama dengan penyedia yang dikonfigurasi — Google,
MiniMax, dan ComfyUI yang dikonfigurasi alur kerja saat ini.

Untuk eksekusi agen berbasis sesi, OpenClaw memulai pembuatan musik sebagai
tugas latar belakang, melacaknya di catatan tugas, lalu membangunkan agen lagi
ketika trek sudah siap agar agen dapat memberi tahu pengguna dan melampirkan
audio yang sudah selesai. Dalam obrolan grup/saluran yang menggunakan pengiriman
terlihat hanya melalui alat pesan, agen meneruskan hasil melalui alat pesan. Jika
agen penyelesaian hanya menulis balasan akhir privat, OpenClaw melakukan fallback
ke pengiriman saluran langsung dengan media yang dihasilkan. Pemicu bangun
penyelesaian secara eksplisit memperingatkan agen bahwa balasan akhir normal
bersifat privat dalam rute tersebut.

<Note>
Alat bersama bawaan hanya muncul ketika setidaknya satu penyedia pembuatan musik
tersedia. Jika Anda tidak melihat `music_generate` di alat agen Anda,
konfigurasikan `agents.defaults.musicGenerationModel` atau siapkan kunci API
penyedia.
</Note>

## Mulai cepat

<Tabs>
  <Tab title="Didukung penyedia bersama">
    <Steps>
      <Step title="Konfigurasikan autentikasi">
        Tetapkan kunci API untuk setidaknya satu penyedia — misalnya
        `GEMINI_API_KEY` atau `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pilih model default (opsional)">
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
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        Agen memanggil `music_generate` secara otomatis. Tidak perlu
        allow-list alat.
      </Step>
    </Steps>

    Untuk konteks sinkron langsung tanpa eksekusi agen berbasis sesi,
    alat bawaan tetap melakukan fallback ke pembuatan inline dan mengembalikan
    jalur media akhir dalam hasil alat.

  </Tab>
  <Tab title="Alur kerja ComfyUI">
    <Steps>
      <Step title="Konfigurasikan alur kerja">
        Konfigurasikan `plugins.entries.comfy.config.music` dengan JSON
        alur kerja dan node prompt/output.
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

Contoh prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Penyedia yang didukung

| Penyedia | Model default          | Input referensi | Kontrol yang didukung                                  | Autentikasi                            |
| -------- | ---------------------- | ---------------- | ------------------------------------------------------ | -------------------------------------- |
| ComfyUI  | `workflow`             | Hingga 1 gambar  | Musik atau audio yang ditentukan alur kerja            | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Hingga 10 gambar | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Tidak ada        | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` atau OAuth MiniMax |

### Matriks kapabilitas

Kontrak mode eksplisit yang digunakan oleh `music_generate`, pengujian kontrak,
dan sweep live bersama:

| Penyedia | `generate` | `edit` | Batas edit | Lane live bersama                                                        |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------ |
| ComfyUI  |     ✓      |   ✓    | 1 gambar   | Tidak dalam sweep bersama; dicakup oleh `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 gambar  | `generate`, `edit`                                                       |
| MiniMax  |     ✓      |   —    | Tidak ada  | `generate`                                                               |

Gunakan `action: "list"` untuk memeriksa penyedia dan model bersama yang
tersedia saat runtime:

```text
/tool music_generate action=list
```

Gunakan `action: "status"` untuk memeriksa tugas musik berbasis sesi yang aktif:

```text
/tool music_generate action=status
```

Contoh pembuatan langsung:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parameter alat

<ParamField path="prompt" type="string" required>
  Prompt pembuatan musik. Wajib untuk `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` mengembalikan tugas sesi saat ini; `"list"` memeriksa penyedia.
</ParamField>
<ParamField path="model" type="string">
  Override penyedia/model (misalnya `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Lirik opsional ketika penyedia mendukung input lirik eksplisit.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Minta output khusus instrumental ketika penyedia mendukungnya.
</ParamField>
<ParamField path="image" type="string">
  Jalur atau URL gambar referensi tunggal.
</ParamField>
<ParamField path="images" type="string[]">
  Beberapa gambar referensi (hingga 10 pada penyedia yang mendukung).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durasi target dalam detik ketika penyedia mendukung petunjuk durasi.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Petunjuk format output ketika penyedia mendukungnya.
</ParamField>
<ParamField path="filename" type="string">Petunjuk nama file output.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout permintaan penyedia opsional dalam milidetik. Nilai di bawah 10000ms dinaikkan menjadi 10000ms dan dilaporkan dalam hasil alat.</ParamField>

<Note>
Tidak semua penyedia mendukung semua parameter. OpenClaw tetap memvalidasi batas
keras seperti jumlah input sebelum pengiriman. Ketika penyedia mendukung durasi
tetapi menggunakan maksimum yang lebih pendek daripada nilai yang diminta,
OpenClaw membatasi ke durasi terdekat yang didukung. Petunjuk opsional yang
benar-benar tidak didukung diabaikan dengan peringatan ketika penyedia atau model
yang dipilih tidak dapat memenuhinya. Hasil alat melaporkan pengaturan yang
diterapkan; `details.normalization` menangkap pemetaan dari yang diminta ke yang
diterapkan.
</Note>

## Perilaku asinkron

Pembuatan musik berbasis sesi berjalan sebagai tugas latar belakang:

- **Tugas latar belakang:** `music_generate` membuat tugas latar belakang,
  segera mengembalikan respons dimulai/tugas, dan memposting trek yang selesai
  nanti dalam pesan agen lanjutan.
- **Pencegahan duplikasi:** saat tugas berstatus `queued` atau `running`,
  panggilan `music_generate` berikutnya dalam sesi yang sama mengembalikan
  status tugas alih-alih memulai pembuatan lain. Gunakan `action: "status"`
  untuk memeriksa secara eksplisit.
- **Pencarian status:** `openclaw tasks list` atau `openclaw tasks show <taskId>`
  memeriksa status antrean, berjalan, dan terminal.
- **Pemicu bangun penyelesaian:** OpenClaw menyuntikkan event penyelesaian
  internal kembali ke sesi yang sama agar model dapat menulis tindak lanjut
  yang terlihat pengguna sendiri.
- **Petunjuk prompt:** giliran pengguna/manual berikutnya dalam sesi yang sama
  mendapatkan petunjuk runtime kecil ketika tugas musik sudah berjalan, sehingga
  model tidak memanggil `music_generate` lagi secara membabi buta.
- **Fallback tanpa sesi:** konteks langsung/lokal tanpa sesi agen nyata berjalan
  inline dan mengembalikan hasil audio akhir dalam giliran yang sama.

### Siklus hidup tugas

| Status      | Makna                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Tugas dibuat, menunggu penyedia menerimanya.                                                    |
| `running`   | Penyedia sedang memproses (biasanya 30 detik hingga 3 menit tergantung penyedia dan durasi).   |
| `succeeded` | Trek siap; agen bangun dan mempostingnya ke percakapan.                                        |
| `failed`    | Error penyedia atau timeout; agen bangun dengan detail error.                                  |

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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Urutan pemilihan penyedia

OpenClaw mencoba penyedia dalam urutan ini:

1. Parameter `model` dari panggilan alat (jika agen menentukannya).
2. `musicGenerationModel.primary` dari konfigurasi.
3. `musicGenerationModel.fallbacks` secara berurutan.
4. Deteksi otomatis hanya menggunakan default penyedia yang didukung autentikasi:
   - penyedia default saat ini terlebih dahulu;
   - penyedia pembuatan musik terdaftar yang tersisa dalam urutan id penyedia.

Jika penyedia gagal, kandidat berikutnya dicoba secara otomatis. Jika semuanya
gagal, error menyertakan detail dari setiap percobaan.

Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk hanya
menggunakan entri `model`, `primary`, dan `fallbacks` eksplisit.

## Catatan penyedia

<AccordionGroup>
  <Accordion title="ComfyUI">
    Didorong alur kerja dan bergantung pada graph yang dikonfigurasi beserta
    pemetaan node untuk bidang prompt/output. Plugin `comfy` bawaan terhubung ke
    alat `music_generate` bersama melalui registri penyedia pembuatan musik.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Menggunakan pembuatan batch Lyria 3. Alur bawaan saat ini mendukung prompt,
    teks lirik opsional, dan gambar referensi opsional.
  </Accordion>
  <Accordion title="MiniMax">
    Menggunakan endpoint batch `music_generation`. Mendukung prompt, lirik
    opsional, mode instrumental, pengaturan durasi, dan output mp3 melalui
    autentikasi kunci API `minimax` atau OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Memilih jalur yang tepat

- **Didukung penyedia bersama** ketika Anda menginginkan pemilihan model,
  failover penyedia, dan alur tugas/status asinkron bawaan.
- **Jalur Plugin (ComfyUI)** ketika Anda memerlukan graph alur kerja khusus atau
  penyedia yang bukan bagian dari kapabilitas musik bawaan bersama.

Jika Anda sedang men-debug perilaku khusus ComfyUI, lihat
[ComfyUI](/id/providers/comfy). Jika Anda sedang men-debug perilaku penyedia
bersama, mulai dengan [Google (Gemini)](/id/providers/google) atau
[MiniMax](/id/providers/minimax).

## Mode kapabilitas penyedia

Kontrak pembuatan musik bersama mendukung deklarasi mode eksplisit:

- `generate` untuk pembuatan hanya dengan prompt.
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

Bidang flat lama seperti `maxInputImages`, `supportsLyrics`, dan
`supportsFormat` **tidak** cukup untuk mengiklankan dukungan edit. Penyedia
harus mendeklarasikan `generate` dan `edit` secara eksplisit agar pengujian live,
pengujian kontrak, dan alat `music_generate` bersama dapat memvalidasi dukungan
mode secara deterministik.

## Pengujian live

Cakupan live opt-in untuk penyedia bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media music
```

File live ini memuat env var penyedia yang hilang dari `~/.profile`,
mengutamakan kunci API live/env daripada profil autentikasi tersimpan secara
default, dan menjalankan cakupan `generate` serta `edit` yang dideklarasikan
ketika penyedia mengaktifkan mode edit. Cakupan saat ini:

- `google`: `generate` dan `edit`
- `minimax`: hanya `generate`
- `comfy`: cakupan live Comfy terpisah, bukan sweep penyedia bersama

Cakupan live opt-in untuk jalur musik ComfyUI bawaan:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

File live Comfy juga mencakup alur kerja gambar dan video comfy ketika
bagian-bagian tersebut dikonfigurasi.

## Terkait

- [Tugas latar belakang](/id/automation/tasks) — pelacakan tugas untuk proses `music_generate` yang dilepas
- [ComfyUI](/id/providers/comfy)
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — konfigurasi `musicGenerationModel`
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [Model](/id/concepts/models) — konfigurasi model dan failover
- [Ikhtisar alat](/id/tools)
