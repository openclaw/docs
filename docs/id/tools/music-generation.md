---
read_when:
    - Menghasilkan musik atau audio melalui agen
    - Mengonfigurasi penyedia dan model pembuatan musik
    - Memahami parameter tool music_generate
sidebarTitle: Music generation
summary: Hasilkan musik melalui music_generate di seluruh workflow ComfyUI, fal, Google Lyria, MiniMax, dan OpenRouter
title: Pembuatan musik
x-i18n:
    generated_at: "2026-06-27T18:19:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

Alat `music_generate` memungkinkan agen membuat musik atau audio melalui
kapabilitas pembuatan musik bersama dengan penyedia yang dikonfigurasi —
ComfyUI, fal, Google, MiniMax, dan OpenRouter saat ini.

Untuk eksekusi agen berbasis sesi, OpenClaw memulai pembuatan musik sebagai
tugas latar belakang, melacaknya di ledger tugas, lalu membangunkan agen lagi
ketika trek sudah siap sehingga agen dapat memberi tahu pengguna dan melampirkan
audio yang selesai. Agen penyelesaian mengikuti mode balasan terlihat normal
sesi: pengiriman balasan akhir otomatis saat dikonfigurasi, atau `message(action="send")`
ketika sesi memerlukan alat pesan. Jika sesi peminta tidak aktif atau wake
aktifnya gagal, dan sebagian audio yang dihasilkan masih belum ada dari balasan
penyelesaian, OpenClaw mengirim fallback langsung idempoten yang hanya berisi
audio yang hilang.

<Note>
Alat bersama bawaan hanya muncul ketika setidaknya satu penyedia pembuatan musik
tersedia. Jika Anda tidak melihat `music_generate` di alat agen Anda,
konfigurasikan `agents.defaults.musicGenerationModel` atau siapkan kunci API
penyedia.
</Note>

## Mulai cepat

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        Tetapkan kunci API untuk setidaknya satu penyedia — misalnya
        `GEMINI_API_KEY` atau `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pick a default model (optional)">
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
      <Step title="Ask the agent">
        _"Buat trek synthpop yang ceria tentang berkendara malam melewati
        kota neon."_

        Agen memanggil `music_generate` secara otomatis. Tidak perlu
        daftar izin alat.
      </Step>
    </Steps>

    Untuk konteks sinkron langsung tanpa eksekusi agen berbasis sesi,
    alat bawaan tetap fallback ke pembuatan inline dan mengembalikan
    jalur media akhir dalam hasil alat.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Konfigurasikan `plugins.entries.comfy.config.music` dengan workflow
        JSON serta node prompt/output.
      </Step>
      <Step title="Cloud auth (optional)">
        Untuk Comfy Cloud, tetapkan `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Call the tool">
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

| Penyedia   | Model default                 | Input referensi | Kontrol yang didukung                                | Autentikasi                            |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | Hingga 1 gambar  | Musik atau audio yang ditentukan workflow             | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Tidak ada        | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` atau `FAL_API_KEY`           |
| Google     | `lyria-3-clip-preview`       | Hingga 10 gambar | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | Tidak ada        | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` atau MiniMax OAuth   |
| OpenRouter | `google/lyria-3-pro-preview` | Hingga 1 gambar  | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### Matriks kapabilitas

Kontrak mode eksplisit yang digunakan oleh `music_generate`, pengujian kontrak,
dan sweep live bersama:

| Penyedia   | `generate` | `edit` | Batas edit  | Jalur live bersama                                                       |
| ---------- | :--------: | :----: | ----------- | ------------------------------------------------------------------------ |
| ComfyUI    |     ✓      |   ✓    | 1 gambar    | Tidak ada dalam sweep bersama; dicakup oleh `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Tidak ada   | `generate`                                                               |
| Google     |     ✓      |   ✓    | 10 gambar   | `generate`, `edit`                                                       |
| MiniMax    |     ✓      |   —    | Tidak ada   | `generate`                                                               |
| OpenRouter |     ✓      |   ✓    | 1 gambar    | `generate`, `edit`                                                       |

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
  Minta output instrumental saja ketika penyedia mendukungnya.
</ParamField>
<ParamField path="image" type="string">
  Satu jalur atau URL gambar referensi.
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

<Note>
Tidak semua penyedia mendukung semua parameter. OpenClaw tetap memvalidasi
batas keras seperti jumlah input sebelum pengiriman. Ketika penyedia mendukung
durasi tetapi menggunakan maksimum yang lebih pendek daripada nilai yang
diminta, OpenClaw membatasi ke durasi terdekat yang didukung. Petunjuk opsional
yang benar-benar tidak didukung diabaikan dengan peringatan ketika penyedia
atau model yang dipilih tidak dapat memenuhinya. Hasil alat melaporkan
pengaturan yang diterapkan; `details.normalization` menangkap pemetaan dari
yang diminta ke yang diterapkan.
</Note>

Timeout permintaan penyedia hanya merupakan konfigurasi operator. OpenClaw
menggunakan `agents.defaults.musicGenerationModel.timeoutMs` ketika
dikonfigurasi, menaikkan nilai di bawah 120000ms menjadi 120000ms, dan selain
itu menetapkan default permintaan penyedia ke 300000ms.

## Perilaku asinkron

Pembuatan musik berbasis sesi berjalan sebagai tugas latar belakang:

- **Tugas latar belakang:** `music_generate` membuat tugas latar belakang,
  segera mengembalikan respons mulai/tugas, dan memposting trek yang selesai
  nanti dalam pesan agen lanjutan.
- **Pencegahan duplikat:** saat tugas berstatus `queued` atau `running`,
  panggilan `music_generate` berikutnya dalam sesi yang sama mengembalikan
  status tugas alih-alih memulai pembuatan lain. Gunakan `action: "status"`
  untuk memeriksa secara eksplisit.
- **Pencarian status:** `openclaw tasks list` atau `openclaw tasks show <taskId>`
  memeriksa status antrean, berjalan, dan terminal.
- **Wake penyelesaian:** OpenClaw menyuntikkan event penyelesaian internal
  kembali ke sesi yang sama sehingga model dapat menulis tindak lanjut yang
  terlihat oleh pengguna sendiri.
- **Petunjuk prompt:** giliran pengguna/manual berikutnya dalam sesi yang sama
  mendapat petunjuk runtime kecil ketika tugas musik sudah sedang berjalan,
  sehingga model tidak memanggil `music_generate` lagi secara membabi buta.
- **Fallback tanpa sesi:** konteks langsung/lokal tanpa sesi agen nyata
  berjalan inline dan mengembalikan hasil audio akhir dalam giliran yang sama.

### Siklus hidup tugas

| Status      | Makna                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Tugas dibuat, menunggu penyedia menerimanya.                                                    |
| `running`   | Penyedia sedang memproses (biasanya 30 detik hingga 3 menit tergantung penyedia dan durasi).   |
| `succeeded` | Trek siap; agen bangun dan mempostingnya ke percakapan.                                        |
| `failed`    | Error atau timeout penyedia; agen bangun dengan detail error.                                  |

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

OpenClaw mencoba penyedia dalam urutan ini:

1. Parameter `model` dari panggilan alat (jika agen menentukannya).
2. `musicGenerationModel.primary` dari konfigurasi.
3. `musicGenerationModel.fallbacks` sesuai urutan.
4. Deteksi otomatis hanya menggunakan default penyedia berbasis autentikasi:
   - penyedia default saat ini terlebih dahulu;
   - penyedia pembuatan musik terdaftar lainnya dalam urutan provider-id.

Jika penyedia gagal, kandidat berikutnya dicoba secara otomatis. Jika semua
gagal, error menyertakan detail dari setiap percobaan.

Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk
hanya menggunakan entri `model`, `primary`, dan `fallbacks` eksplisit.

## Catatan penyedia

<AccordionGroup>
  <Accordion title="ComfyUI">
    Berbasis workflow dan bergantung pada graph yang dikonfigurasi serta
    pemetaan node untuk field prompt/output. Plugin `comfy` bawaan terhubung
    ke alat `music_generate` bersama melalui registry penyedia pembuatan musik.
  </Accordion>
  <Accordion title="fal">
    Menggunakan endpoint model fal melalui jalur autentikasi penyedia bersama.
    Penyedia bawaan menetapkan default ke `fal-ai/minimax-music/v2.6` dan juga
    mengekspos `fal-ai/ace-step/prompt-to-audio` serta
    `fal-ai/stable-audio-25/text-to-audio` untuk permintaan prompt-to-audio.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Menggunakan pembuatan batch Lyria 3. Alur bawaan saat ini mendukung
    prompt, teks lirik opsional, dan gambar referensi opsional.
  </Accordion>
  <Accordion title="MiniMax">
    Menggunakan endpoint batch `music_generation`. Mendukung prompt, lirik
    opsional, mode instrumental, dan output mp3 melalui autentikasi kunci API
    `minimax` atau OAuth `minimax-portal`.
  </Accordion>
  <Accordion title="OpenRouter">
    Menggunakan output audio chat completions OpenRouter dengan streaming
    diaktifkan. Penyedia bawaan menetapkan default ke
    `google/lyria-3-pro-preview` dan juga mengekspos
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Memilih jalur yang tepat

- **Berbasis penyedia bersama** ketika Anda menginginkan pemilihan model,
  failover penyedia, dan alur tugas/status asinkron bawaan.
- **Jalur Plugin (ComfyUI)** ketika Anda membutuhkan graph workflow khusus
  atau penyedia yang bukan bagian dari kapabilitas musik bersama bawaan.

Jika Anda men-debug perilaku khusus ComfyUI, lihat
[ComfyUI](/id/providers/comfy). Jika Anda men-debug perilaku provider bersama,
mulailah dengan [fal](/id/providers/fal), [Google (Gemini)](/id/providers/google),
[MiniMax](/id/providers/minimax), atau [OpenRouter](/id/providers/openrouter).

## Mode kapabilitas provider

Kontrak pembuatan musik bersama mendukung deklarasi mode eksplisit:

- `generate` untuk pembuatan hanya dari prompt.
- `edit` saat permintaan menyertakan satu atau beberapa gambar referensi.

Implementasi provider baru sebaiknya mengutamakan blok mode eksplisit:

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

Field datar lama seperti `maxInputImages`, `supportsLyrics`, dan
`supportsFormat` **tidak** cukup untuk mengiklankan dukungan edit. Provider
sebaiknya mendeklarasikan `generate` dan `edit` secara eksplisit agar pengujian
live, pengujian kontrak, dan alat bersama `music_generate` dapat memvalidasi
dukungan mode secara deterministik.

## Pengujian live

Cakupan live opt-in untuk provider bundel bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media music
```

File live ini menggunakan env var provider yang sudah diekspor sebelum profil
auth tersimpan secara default, dan menjalankan cakupan `generate` serta `edit`
yang dideklarasikan saat provider mengaktifkan mode edit. Cakupan saat ini:

- `google`: `generate` plus `edit`
- `fal`: hanya `generate`
- `minimax`: hanya `generate`
- `openrouter`: `generate` plus `edit`
- `comfy`: cakupan live Comfy terpisah, bukan sweep provider bersama

Cakupan live opt-in untuk jalur musik ComfyUI yang dibundel:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

File live Comfy juga mencakup alur kerja gambar dan video comfy saat bagian
tersebut dikonfigurasi.

## Terkait

- [Tugas latar belakang](/id/automation/tasks) — pelacakan tugas untuk run `music_generate` yang dilepas
- [ComfyUI](/id/providers/comfy)
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — konfigurasi `musicGenerationModel`
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [Model](/id/concepts/models) — konfigurasi model dan failover
- [Ikhtisar alat](/id/tools)
