---
read_when:
    - Menghasilkan musik atau audio melalui agen
    - Mengonfigurasi penyedia dan model pembuatan musik
    - Memahami parameter alat music_generate
sidebarTitle: Music generation
summary: Hasilkan musik melalui music_generate di berbagai alur kerja Google Lyria, MiniMax, dan ComfyUI
title: Pembuatan musik
x-i18n:
    generated_at: "2026-05-02T09:34:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

Alat `music_generate` memungkinkan agen membuat musik atau audio melalui
kapabilitas pembuatan musik bersama dengan penyedia yang dikonfigurasi — Google,
MiniMax, dan ComfyUI yang dikonfigurasi alur kerja saat ini.

Untuk eksekusi agen yang didukung sesi, OpenClaw memulai pembuatan musik sebagai
tugas latar belakang, melacaknya di ledger tugas, lalu membangunkan agen lagi
ketika trek siap agar agen dapat memposting audio selesai kembali ke
kanal asli.

<Note>
Alat bersama bawaan hanya muncul saat setidaknya satu penyedia pembuatan musik
tersedia. Jika Anda tidak melihat `music_generate` di alat agen Anda,
konfigurasikan `agents.defaults.musicGenerationModel` atau siapkan
kunci API penyedia.
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
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        Agen memanggil `music_generate` secara otomatis. Tidak perlu
        daftar izin alat.
      </Step>
    </Steps>

    Untuk konteks sinkron langsung tanpa eksekusi agen yang didukung sesi,
    alat bawaan tetap kembali ke pembuatan inline dan mengembalikan
    jalur media akhir dalam hasil alat.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Konfigurasikan `plugins.entries.comfy.config.music` dengan JSON
        alur kerja dan node prompt/output.
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

| Penyedia | Model default          | Input referensi | Kontrol yang didukung                                  | Auth                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Hingga 1 gambar  | Musik atau audio yang ditentukan alur kerja               | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Hingga 10 gambar | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Tidak ada        | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` atau OAuth MiniMax   |

### Matriks kapabilitas

Kontrak mode eksplisit yang digunakan oleh `music_generate`, pengujian kontrak, dan
sweep live bersama:

| Penyedia | `generate` | `edit` | Batas edit | Lane live bersama                                                       |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 gambar   | Tidak dalam sweep bersama; dicakup oleh `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 gambar  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Tidak ada  | `generate`                                                                |

Gunakan `action: "list"` untuk memeriksa penyedia dan model bersama yang tersedia saat
runtime:

```text
/tool music_generate action=list
```

Gunakan `action: "status"` untuk memeriksa tugas musik aktif yang didukung sesi:

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
  Override penyedia/model (mis. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Lirik opsional saat penyedia mendukung input lirik eksplisit.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Minta output instrumental saja saat penyedia mendukungnya.
</ParamField>
<ParamField path="image" type="string">
  Jalur atau URL gambar referensi tunggal.
</ParamField>
<ParamField path="images" type="string[]">
  Beberapa gambar referensi (hingga 10 pada penyedia yang mendukung).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durasi target dalam detik saat penyedia mendukung petunjuk durasi.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Petunjuk format output saat penyedia mendukungnya.
</ParamField>
<ParamField path="filename" type="string">Petunjuk nama file output.</ParamField>
<ParamField path="timeoutMs" type="number">Timeout permintaan penyedia opsional dalam milidetik. Nilai di bawah 10000ms dinaikkan ke 10000ms dan dilaporkan dalam hasil alat.</ParamField>

<Note>
Tidak semua penyedia mendukung semua parameter. OpenClaw tetap memvalidasi batas
keras seperti jumlah input sebelum pengiriman. Saat penyedia mendukung
durasi tetapi menggunakan maksimum yang lebih pendek daripada nilai yang diminta, OpenClaw
membatasi ke durasi terdekat yang didukung. Petunjuk opsional yang benar-benar tidak didukung
diabaikan dengan peringatan saat penyedia atau model terpilih tidak dapat mematuhinya.
Hasil alat melaporkan pengaturan yang diterapkan; `details.normalization`
mencatat pemetaan apa pun dari yang diminta ke yang diterapkan.
</Note>

## Perilaku asinkron

Pembuatan musik yang didukung sesi berjalan sebagai tugas latar belakang:

- **Tugas latar belakang:** `music_generate` membuat tugas latar belakang, segera mengembalikan
  respons mulai/tugas, dan memposting trek yang selesai nanti dalam
  pesan agen lanjutan.
- **Pencegahan duplikat:** saat tugas berstatus `queued` atau `running`, panggilan
  `music_generate` berikutnya dalam sesi yang sama mengembalikan status tugas, bukan
  memulai pembuatan lain. Gunakan `action: "status"` untuk memeriksa secara eksplisit.
- **Pencarian status:** `openclaw tasks list` atau `openclaw tasks show <taskId>`
  memeriksa status antre, berjalan, dan terminal.
- **Bangun saat selesai:** OpenClaw menyuntikkan peristiwa penyelesaian internal kembali
  ke sesi yang sama agar model dapat menulis tindak lanjut yang terlihat pengguna
  sendiri.
- **Petunjuk prompt:** giliran pengguna/manual berikutnya dalam sesi yang sama mendapatkan petunjuk
  runtime kecil saat tugas musik sudah berjalan, sehingga model tidak
  memanggil `music_generate` lagi secara membuta.
- **Fallback tanpa sesi:** konteks langsung/lokal tanpa sesi agen nyata
  berjalan inline dan mengembalikan hasil audio akhir dalam giliran yang sama.

### Siklus hidup tugas

| Status      | Makna                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Tugas dibuat, menunggu penyedia menerimanya.                                                    |
| `running`   | Penyedia sedang memproses (biasanya 30 detik hingga 3 menit tergantung penyedia dan durasi). |
| `succeeded` | Trek siap; agen bangun dan mempostingnya ke percakapan.                                       |
| `failed`    | Kesalahan penyedia atau timeout; agen bangun dengan detail kesalahan.                         |

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
3. `musicGenerationModel.fallbacks` sesuai urutan.
4. Deteksi otomatis hanya menggunakan default penyedia yang didukung auth:
   - penyedia default saat ini terlebih dahulu;
   - penyedia pembuatan musik terdaftar yang tersisa dalam urutan id penyedia.

Jika penyedia gagal, kandidat berikutnya dicoba secara otomatis. Jika semua
gagal, kesalahan menyertakan detail dari setiap percobaan.

Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk hanya menggunakan
entri `model`, `primary`, dan `fallbacks` eksplisit.

## Catatan penyedia

<AccordionGroup>
  <Accordion title="ComfyUI">
    Digerakkan alur kerja dan bergantung pada grafik yang dikonfigurasi plus pemetaan node
    untuk bidang prompt/output. Plugin `comfy` bawaan terhubung ke
    alat `music_generate` bersama melalui registry penyedia pembuatan musik.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Menggunakan pembuatan batch Lyria 3. Alur bawaan saat ini mendukung
    prompt, teks lirik opsional, dan gambar referensi opsional.
  </Accordion>
  <Accordion title="MiniMax">
    Menggunakan endpoint batch `music_generation`. Mendukung prompt, lirik opsional,
    mode instrumental, pengarah durasi, dan output mp3 melalui
    auth kunci API `minimax` atau OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Memilih jalur yang tepat

- **Didukung penyedia bersama** saat Anda menginginkan pemilihan model, failover
  penyedia, dan alur tugas/status asinkron bawaan.
- **Jalur Plugin (ComfyUI)** saat Anda membutuhkan grafik alur kerja kustom atau
  penyedia yang bukan bagian dari kapabilitas musik bawaan bersama.

Jika Anda men-debug perilaku khusus ComfyUI, lihat
[ComfyUI](/id/providers/comfy). Jika Anda men-debug perilaku penyedia bersama,
mulailah dengan [Google (Gemini)](/id/providers/google) atau
[MiniMax](/id/providers/minimax).

## Mode kapabilitas penyedia

Kontrak pembuatan musik bersama mendukung deklarasi mode eksplisit:

- `generate` untuk pembuatan berbasis prompt saja.
- `edit` saat permintaan menyertakan satu atau beberapa gambar referensi.

Implementasi penyedia baru sebaiknya memilih blok mode eksplisit:

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
`supportsFormat` **tidak** cukup untuk mengiklankan dukungan edit. Penyedia
harus mendeklarasikan `generate` dan `edit` secara eksplisit agar pengujian live, pengujian kontrak,
dan alat `music_generate` bersama dapat memvalidasi dukungan mode
secara deterministik.

## Pengujian live

Cakupan live opt-in untuk penyedia bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media music
```

File live ini memuat variabel env penyedia yang hilang dari `~/.profile`, lebih memilih
kunci API live/env di atas profil auth tersimpan secara default, dan menjalankan cakupan
`generate` serta `edit` yang dideklarasikan saat penyedia mengaktifkan mode edit.
Cakupan saat ini:

- `google`: `generate` plus `edit`
- `minimax`: hanya `generate`
- `comfy`: cakupan live Comfy terpisah, bukan sweep penyedia bersama

Cakupan live opt-in untuk jalur musik ComfyUI bawaan:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

File live Comfy juga mencakup alur kerja gambar dan video comfy ketika bagian-bagian tersebut dikonfigurasi.

## Terkait

- [Tugas latar belakang](/id/automation/tasks) — pelacakan tugas untuk proses `music_generate` terpisah
- [ComfyUI](/id/providers/comfy)
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — konfigurasi `musicGenerationModel`
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [Model](/id/concepts/models) — konfigurasi model dan failover
- [Ikhtisar alat](/id/tools)
