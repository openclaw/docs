---
read_when:
    - Menghasilkan musik atau audio melalui agen
    - Mengonfigurasi penyedia dan model generasi musik
    - Memahami parameter tool `music_generate`
sidebarTitle: Music generation
summary: Hasilkan musik melalui `music_generate` di Google Lyria, MiniMax, dan workflow ComfyUI
title: Generasi musik
x-i18n:
    generated_at: "2026-04-26T11:40:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

Tool `music_generate` memungkinkan agen membuat musik atau audio melalui
kapabilitas generasi musik bersama dengan penyedia yang dikonfigurasi — saat ini Google,
MiniMax, dan ComfyUI yang dikonfigurasi lewat workflow.

Untuk eksekusi agen berbasis sesi, OpenClaw memulai generasi musik sebagai
tugas latar belakang, melacaknya di task ledger, lalu membangunkan agen lagi
saat trek sudah siap agar agen dapat memposting audio final kembali ke
kanal asal.

<Note>
Tool bersama bawaan hanya muncul jika setidaknya satu penyedia
generasi musik tersedia. Jika Anda tidak melihat `music_generate` di
tool agen Anda, konfigurasi `agents.defaults.musicGenerationModel` atau siapkan
kunci API penyedia.
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
      <Step title="Minta ke agen">
        _"Buat trek synthpop upbeat tentang perjalanan malam melewati kota
        neon."_

        Agen memanggil `music_generate` secara otomatis. Tidak perlu
        allow-list tool.
      </Step>
    </Steps>

    Untuk konteks sinkron langsung tanpa eksekusi agen berbasis sesi,
    tool bawaan tetap menggunakan fallback ke generasi inline dan mengembalikan
    path media final di hasil tool.

  </Tab>
  <Tab title="Workflow ComfyUI">
    <Steps>
      <Step title="Konfigurasikan workflow">
        Konfigurasikan `plugins.entries.comfy.config.music` dengan workflow
        JSON serta node prompt/output.
      </Step>
      <Step title="Autentikasi cloud (opsional)">
        Untuk Comfy Cloud, tetapkan `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Panggil tool">
        ```text
        /tool music_generate prompt="Loop synth ambient hangat dengan tekstur tape lembut"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Contoh prompt:

```text
Buat trek piano sinematik dengan string lembut dan tanpa vokal.
```

```text
Buat loop chiptune enerjik tentang peluncuran roket saat matahari terbit.
```

## Penyedia yang didukung

| Penyedia | Model default          | Input referensi | Kontrol yang didukung                                    | Auth                                   |
| -------- | ---------------------- | --------------- | -------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Hingga 1 gambar | Musik atau audio yang ditentukan workflow                | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Hingga 10 gambar| `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Tidak ada       | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` atau OAuth MiniMax   |

### Matriks kapabilitas

Kontrak mode eksplisit yang digunakan oleh `music_generate`, uji kontrak, dan
shared live sweep:

| Penyedia | `generate` | `edit` | Batas edit | Lane live bersama                                                           |
| -------- | :--------: | :----: | ---------- | ---------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 gambar   | Tidak ada di shared sweep; dicakup oleh `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 gambar  | `generate`, `edit`                                                           |
| MiniMax  |     ✓      |   —    | Tidak ada  | `generate`                                                                   |

Gunakan `action: "list"` untuk memeriksa penyedia dan model bersama yang tersedia saat
runtime:

```text
/tool music_generate action=list
```

Gunakan `action: "status"` untuk memeriksa tugas musik aktif berbasis sesi:

```text
/tool music_generate action=status
```

Contoh generasi langsung:

```text
/tool music_generate prompt="Lo-fi hip hop dreamy dengan tekstur vinil dan hujan lembut" instrumental=true
```

## Parameter tool

<ParamField path="prompt" type="string" required>
  Prompt generasi musik. Wajib untuk `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` mengembalikan tugas sesi saat ini; `"list"` memeriksa penyedia.
</ParamField>
<ParamField path="model" type="string">
  Penimpaan penyedia/model (mis. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Lirik opsional saat penyedia mendukung input lirik eksplisit.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Minta output instrumental saja saat penyedia mendukungnya.
</ParamField>
<ParamField path="image" type="string">
  Path atau URL gambar referensi tunggal.
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
<ParamField path="timeoutMs" type="number">Timeout permintaan penyedia opsional dalam milidetik.</ParamField>

<Note>
Tidak semua penyedia mendukung semua parameter. OpenClaw tetap memvalidasi
batas keras seperti jumlah input sebelum pengiriman. Saat penyedia mendukung
durasi tetapi menggunakan maksimum yang lebih pendek daripada nilai yang diminta, OpenClaw
membatasi ke durasi terdekat yang didukung. Petunjuk opsional yang benar-benar tidak didukung
diabaikan dengan peringatan saat penyedia atau model yang dipilih tidak dapat mematuhinya.
Hasil tool melaporkan pengaturan yang diterapkan; `details.normalization`
menangkap pemetaan dari yang diminta ke yang diterapkan.
</Note>

## Perilaku asinkron

Generasi musik berbasis sesi berjalan sebagai tugas latar belakang:

- **Tugas latar belakang:** `music_generate` membuat tugas latar belakang, segera mengembalikan
  respons started/task, dan memposting trek final nanti dalam
  pesan agen tindak lanjut.
- **Pencegahan duplikasi:** saat sebuah tugas berstatus `queued` atau `running`, pemanggilan
  `music_generate` berikutnya dalam sesi yang sama mengembalikan status tugas alih-alih
  memulai generasi lain. Gunakan `action: "status"` untuk memeriksa secara eksplisit.
- **Pencarian status:** `openclaw tasks list` atau `openclaw tasks show <taskId>`
  memeriksa status queued, running, dan terminal.
- **Wake saat selesai:** OpenClaw menyuntikkan event penyelesaian internal kembali
  ke sesi yang sama agar model dapat menulis tindak lanjut yang ditujukan ke pengguna
  sendiri.
- **Petunjuk prompt:** giliran pengguna/manual berikutnya dalam sesi yang sama mendapat
  petunjuk runtime kecil saat tugas musik sudah berjalan, sehingga model tidak
  membabi buta memanggil `music_generate` lagi.
- **Fallback tanpa sesi:** konteks langsung/lokal tanpa sesi agen yang nyata
  berjalan inline dan mengembalikan hasil audio final pada giliran yang sama.

### Siklus hidup tugas

| Status      | Arti                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Tugas dibuat, menunggu penyedia menerimanya.                                                   |
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

1. Parameter `model` dari pemanggilan tool (jika agen menentukannya).
2. `musicGenerationModel.primary` dari konfigurasi.
3. `musicGenerationModel.fallbacks` secara berurutan.
4. Deteksi otomatis menggunakan hanya default penyedia yang didukung auth:
   - default penyedia saat ini terlebih dahulu;
   - penyedia generasi musik terdaftar yang tersisa dalam urutan provider-id.

Jika sebuah penyedia gagal, kandidat berikutnya dicoba secara otomatis. Jika semua
gagal, error menyertakan detail dari setiap percobaan.

Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` untuk hanya menggunakan
entri `model`, `primary`, dan `fallbacks` yang eksplisit.

## Catatan penyedia

<AccordionGroup>
  <Accordion title="ComfyUI">
    Digerakkan workflow dan bergantung pada graph yang dikonfigurasi plus pemetaan node
    untuk field prompt/output. Plugin `comfy` bawaan terhubung ke
    tool `music_generate` bersama melalui registri penyedia
    generasi musik.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Menggunakan generasi batch Lyria 3. Alur bawaan saat ini mendukung
    prompt, teks lirik opsional, dan gambar referensi opsional.
  </Accordion>
  <Accordion title="MiniMax">
    Menggunakan endpoint batch `music_generation`. Mendukung prompt, lirik opsional,
    mode instrumental, pengaturan durasi, dan output mp3 melalui
    auth API key `minimax` atau OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Memilih jalur yang tepat

- **Didukung penyedia bersama** saat Anda menginginkan pemilihan model, failover
  penyedia, dan alur tugas/status asinkron bawaan.
- **Jalur plugin (ComfyUI)** saat Anda memerlukan graph workflow kustom atau
  penyedia yang bukan bagian dari kapabilitas musik bawaan bersama.

Jika Anda men-debug perilaku khusus ComfyUI, lihat
[ComfyUI](/id/providers/comfy). Jika Anda men-debug perilaku penyedia bersama,
mulailah dari [Google (Gemini)](/id/providers/google) atau
[MiniMax](/id/providers/minimax).

## Mode kapabilitas penyedia

Kontrak generasi musik bersama mendukung deklarasi mode eksplisit:

- `generate` untuk generasi hanya dari prompt.
- `edit` saat permintaan menyertakan satu atau lebih gambar referensi.

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

Field datar lama seperti `maxInputImages`, `supportsLyrics`, dan
`supportsFormat` **tidak** cukup untuk mengiklankan dukungan edit. Penyedia
sebaiknya mendeklarasikan `generate` dan `edit` secara eksplisit agar uji live,
uji kontrak, dan tool `music_generate` bersama dapat memvalidasi dukungan mode
secara deterministik.

## Uji live

Cakupan live opt-in untuk penyedia bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media music
```

File live ini memuat env var penyedia yang belum ada dari `~/.profile`, memprioritaskan
kunci API live/env dibanding profil auth yang disimpan secara default, dan menjalankan
cakupan `generate` serta `edit` yang dideklarasikan saat penyedia mengaktifkan mode edit.
Cakupan saat ini:

- `google`: `generate` ditambah `edit`
- `minimax`: hanya `generate`
- `comfy`: cakupan live Comfy terpisah, bukan shared provider sweep

Cakupan live opt-in untuk jalur musik ComfyUI bawaan:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

File live Comfy juga mencakup workflow gambar dan video comfy saat bagian tersebut
dikonfigurasi.

## Terkait

- [Tugas latar belakang](/id/automation/tasks) — pelacakan tugas untuk eksekusi `music_generate` yang terlepas
- [ComfyUI](/id/providers/comfy)
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — konfigurasi `musicGenerationModel`
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [Model](/id/concepts/models) — konfigurasi model dan failover
- [Ikhtisar tool](/id/tools)
