---
read_when:
    - Menghasilkan musik atau audio melalui agen
    - Mengonfigurasi provider dan model generasi musik
    - Memahami parameter alat `music_generate`
summary: Hasilkan musik dengan provider bersama, termasuk Plugin berbasis alur kerja
title: Generasi musik
x-i18n:
    generated_at: "2026-04-24T09:32:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5fe640c6b83f6f2cf5ad8e57294da147f241706c30eee0d0eb6f7d82cbbe0d3
    source_path: tools/music-generation.md
    workflow: 15
---

Alat `music_generate` memungkinkan agen membuat musik atau audio melalui
kapabilitas generasi musik bersama dengan provider yang dikonfigurasi seperti Google,
MiniMax, dan ComfyUI yang dikonfigurasi lewat alur kerja.

Untuk sesi agen berbasis provider bersama, OpenClaw memulai generasi musik sebagai
tugas latar belakang, melacaknya di task ledger, lalu membangunkan agen lagi saat
trek siap sehingga agen dapat memposting audio yang sudah selesai kembali ke
channel asal.

<Note>
Alat bersama bawaan hanya muncul saat setidaknya satu provider generasi musik tersedia. Jika Anda tidak melihat `music_generate` di alat agen Anda, konfigurasi `agents.defaults.musicGenerationModel` atau siapkan API key provider.
</Note>

## Mulai cepat

### Generasi berbasis provider bersama

1. Tetapkan API key untuk setidaknya satu provider, misalnya `GEMINI_API_KEY` atau
   `MINIMAX_API_KEY`.
2. Secara opsional tetapkan model pilihan Anda:

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

3. Minta agen: _"Generate an upbeat synthpop track about a night drive
   through a neon city."_

Agen memanggil `music_generate` secara otomatis. Tidak perlu allow-list alat.

Untuk konteks sinkron langsung tanpa run agen berbasis sesi, alat bawaan
tetap fallback ke generasi inline dan mengembalikan path media final di
hasil alat.

Contoh prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Generasi Comfy berbasis alur kerja

Plugin `comfy` bawaan terhubung ke alat bersama `music_generate` melalui
registry provider generasi musik.

1. Konfigurasikan `models.providers.comfy.music` dengan JSON alur kerja dan
   node prompt/output.
2. Jika Anda menggunakan Comfy Cloud, tetapkan `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY`.
3. Minta agen membuat musik atau panggil alatnya secara langsung.

Contoh:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Dukungan provider bawaan bersama

| Provider | Model default         | Input referensi   | Kontrol yang didukung                                      | API key                                |
| -------- | --------------------- | ----------------- | ---------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`            | Hingga 1 gambar   | Musik atau audio yang didefinisikan alur kerja            | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Hingga 10 gambar | `lyrics`, `instrumental`, `format`                         | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.5+`          | Tidak ada         | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                      |

### Matriks kapabilitas yang dideklarasikan

Ini adalah kontrak mode eksplisit yang digunakan oleh `music_generate`, uji kontrak,
dan sweep live bersama.

| Provider | `generate` | `edit` | Batas edit | Lane live bersama                                                        |
| -------- | ---------- | ------ | ---------- | ------------------------------------------------------------------------ |
| ComfyUI  | Ya         | Ya     | 1 gambar   | Tidak ada di sweep bersama; dicakup oleh `extensions/comfy/comfy.live.test.ts` |
| Google   | Ya         | Ya     | 10 gambar  | `generate`, `edit`                                                       |
| MiniMax  | Ya         | Tidak  | Tidak ada  | `generate`                                                               |

Gunakan `action: "list"` untuk memeriksa provider dan model bersama yang tersedia
saat runtime:

```text
/tool music_generate action=list
```

Gunakan `action: "status"` untuk memeriksa tugas musik aktif berbasis sesi:

```text
/tool music_generate action=status
```

Contoh generasi langsung:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parameter alat bawaan

| Parameter         | Tipe     | Deskripsi                                                                                      |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt generasi musik (wajib untuk `action: "generate"`)                                       |
| `action`          | string   | `"generate"` (default), `"status"` untuk tugas sesi saat ini, atau `"list"` untuk memeriksa provider |
| `model`           | string   | Penggantian provider/model, misalnya `google/lyria-3-pro-preview` atau `comfy/workflow`        |
| `lyrics`          | string   | Lirik opsional saat provider mendukung input lirik eksplisit                                   |
| `instrumental`    | boolean  | Meminta output instrumental saja saat provider mendukungnya                                    |
| `image`           | string   | Path atau URL gambar referensi tunggal                                                         |
| `images`          | string[] | Beberapa gambar referensi (hingga 10)                                                          |
| `durationSeconds` | number   | Durasi target dalam detik saat provider mendukung petunjuk durasi                              |
| `timeoutMs`       | number   | Timeout permintaan provider opsional dalam milidetik                                           |
| `format`          | string   | Petunjuk format output (`mp3` atau `wav`) saat provider mendukungnya                           |
| `filename`        | string   | Petunjuk nama file output                                                                       |

Tidak semua provider mendukung semua parameter. OpenClaw tetap memvalidasi batas keras
seperti jumlah input sebelum pengiriman. Saat provider mendukung durasi tetapi
menggunakan maksimum yang lebih pendek daripada nilai yang diminta, OpenClaw otomatis membatasi
ke durasi terdekat yang didukung. Petunjuk opsional yang benar-benar tidak didukung akan diabaikan
dengan peringatan saat provider atau model yang dipilih tidak dapat memenuhinya.

Hasil alat melaporkan pengaturan yang diterapkan. Saat OpenClaw membatasi durasi selama fallback provider, `durationSeconds` yang dikembalikan mencerminkan nilai yang dikirimkan dan `details.normalization.durationSeconds` menunjukkan pemetaan dari nilai yang diminta ke nilai yang diterapkan.

## Perilaku async untuk jalur berbasis provider bersama

- Run agen berbasis sesi: `music_generate` membuat tugas latar belakang, segera mengembalikan respons started/task, dan memposting trek yang sudah selesai nanti dalam pesan agen lanjutan.
- Pencegahan duplikat: selama tugas latar belakang itu masih `queued` atau `running`, pemanggilan `music_generate` berikutnya dalam sesi yang sama mengembalikan status tugas alih-alih memulai generasi lain.
- Pencarian status: gunakan `action: "status"` untuk memeriksa tugas musik aktif berbasis sesi tanpa memulai yang baru.
- Pelacakan tugas: gunakan `openclaw tasks list` atau `openclaw tasks show <taskId>` untuk memeriksa status queued, running, dan terminal untuk generasi tersebut.
- Wake saat selesai: OpenClaw menyuntikkan peristiwa penyelesaian internal kembali ke sesi yang sama agar model dapat menulis sendiri tindak lanjut yang terlihat pengguna.
- Petunjuk prompt: giliran pengguna/manual berikutnya dalam sesi yang sama mendapatkan petunjuk runtime kecil saat tugas musik sudah berjalan agar model tidak secara membabi buta memanggil `music_generate` lagi.
- Fallback tanpa sesi: konteks langsung/lokal tanpa sesi agen nyata tetap berjalan inline dan mengembalikan hasil audio final pada giliran yang sama.

### Siklus hidup tugas

Setiap permintaan `music_generate` bergerak melalui empat status:

1. **queued** -- tugas dibuat, menunggu provider menerimanya.
2. **running** -- provider sedang memproses (biasanya 30 detik hingga 3 menit tergantung provider dan durasi).
3. **succeeded** -- trek siap; agen bangun dan mempostingnya ke percakapan.
4. **failed** -- kesalahan provider atau timeout; agen bangun dengan detail kesalahan.

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Pencegahan duplikat: jika tugas musik sudah `queued` atau `running` untuk sesi saat ini, `music_generate` mengembalikan status tugas yang ada alih-alih memulai yang baru. Gunakan `action: "status"` untuk memeriksa secara eksplisit tanpa memicu generasi baru.

## Konfigurasi

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Urutan pemilihan provider

Saat menghasilkan musik, OpenClaw mencoba provider dalam urutan ini:

1. Parameter `model` dari pemanggilan alat, jika agen menentukannya
2. `musicGenerationModel.primary` dari konfigurasi
3. `musicGenerationModel.fallbacks` sesuai urutan
4. Deteksi otomatis menggunakan default provider berbasis auth saja:
   - provider default saat ini terlebih dahulu
   - provider generasi musik terdaftar yang tersisa dalam urutan id provider

Jika provider gagal, kandidat berikutnya dicoba secara otomatis. Jika semuanya gagal,
kesalahan akan menyertakan detail dari setiap percobaan.

Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` jika Anda ingin
generasi musik hanya menggunakan entri `model`, `primary`, dan `fallbacks`
yang eksplisit.

## Catatan provider

- Google menggunakan generasi batch Lyria 3. Alur bawaan saat ini mendukung
  prompt, teks lirik opsional, dan gambar referensi opsional.
- MiniMax menggunakan endpoint batch `music_generation`. Alur bawaan saat ini
  mendukung prompt, lirik opsional, mode instrumental, pengaturan durasi, dan
  output mp3.
- Dukungan ComfyUI berbasis alur kerja dan bergantung pada graph yang dikonfigurasi serta
  pemetaan node untuk field prompt/output.

## Mode kapabilitas provider

Kontrak generasi musik bersama sekarang mendukung deklarasi mode eksplisit:

- `generate` untuk generasi hanya dengan prompt
- `edit` saat permintaan mencakup satu atau lebih gambar referensi

Implementasi provider baru sebaiknya menggunakan blok mode eksplisit:

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

Field datar legacy seperti `maxInputImages`, `supportsLyrics`, dan
`supportsFormat` tidak cukup untuk mengiklankan dukungan edit. Provider harus
mendeklarasikan `generate` dan `edit` secara eksplisit agar uji live, uji kontrak, dan
alat bersama `music_generate` dapat memvalidasi dukungan mode secara deterministik.

## Memilih jalur yang tepat

- Gunakan jalur berbasis provider bersama saat Anda menginginkan pemilihan model, fallback provider, dan alur async tugas/status bawaan.
- Gunakan jalur Plugin seperti ComfyUI saat Anda memerlukan graph alur kerja kustom atau provider yang bukan bagian dari kapabilitas musik bawaan bersama.
- Jika Anda sedang men-debug perilaku khusus ComfyUI, lihat [ComfyUI](/id/providers/comfy). Jika Anda sedang men-debug perilaku provider bersama, mulai dari [Google (Gemini)](/id/providers/google) atau [MiniMax](/id/providers/minimax).

## Uji live

Cakupan live opt-in untuk provider bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media music
```

File live ini memuat variabel env provider yang hilang dari `~/.profile`, memprioritaskan
API key live/env dibanding auth profile yang tersimpan secara default, dan menjalankan cakupan
`generate` dan `edit` yang dideklarasikan saat provider mengaktifkan mode edit.

Saat ini itu berarti:

- `google`: `generate` plus `edit`
- `minimax`: `generate` saja
- `comfy`: cakupan live Comfy terpisah, bukan sweep provider bersama

Cakupan live opt-in untuk jalur musik ComfyUI bawaan:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

File live Comfy juga mencakup alur kerja gambar dan video Comfy saat bagian tersebut
dikonfigurasi.

## Terkait

- [Tugas Latar Belakang](/id/automation/tasks) - pelacakan tugas untuk run `music_generate` yang terlepas
- [Referensi Konfigurasi](/id/gateway/config-agents#agent-defaults) - konfigurasi `musicGenerationModel`
- [ComfyUI](/id/providers/comfy)
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [Model](/id/concepts/models) - konfigurasi model dan failover
- [Gambaran Umum Alat](/id/tools)
