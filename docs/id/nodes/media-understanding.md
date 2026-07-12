---
read_when:
    - Merancang atau memfaktorkan ulang pemahaman media
    - Menyesuaikan prapemrosesan audio/video/gambar masuk
sidebarTitle: Media understanding
summary: Pemahaman gambar/audio/video masuk (opsional) dengan fallback penyedia + CLI
title: Pemahaman media
x-i18n:
    generated_at: "2026-07-12T14:21:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw dapat merangkum media masuk (gambar/audio/video) sebelum alur pemrosesan balasan berjalan, sehingga penguraian perintah dan perutean menggunakan teks pendek, bukan byte mentah. Pemahaman secara otomatis mendeteksi alat lokal atau kunci penyedia, atau Anda dapat mengonfigurasi model secara eksplisit. Media asli selalu dikirimkan ke model seperti biasa; ketika pemahaman gagal atau dinonaktifkan, alur balasan tetap berlanjut tanpa perubahan.

Plugin vendor mendaftarkan metadata kapabilitas (penyedia mana yang mendukung jenis media tertentu, model bawaan, prioritas). Inti OpenClaw memiliki konfigurasi bersama `tools.media`, urutan fallback, dan integrasi alur pemrosesan balasan.

## Cara kerjanya

<Steps>
  <Step title="Kumpulkan lampiran">
    Kumpulkan lampiran masuk (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Pilih per kapabilitas">
    Untuk setiap kapabilitas yang diaktifkan (gambar/audio/video), pilih lampiran berdasarkan kebijakan `attachments` (bawaan: hanya lampiran pertama).
  </Step>
  <Step title="Pilih model">
    Pilih entri model pertama yang memenuhi syarat (ukuran + kapabilitas + autentikasi tersedia).
  </Step>
  <Step title="Gunakan fallback saat gagal">
    Jika model mengalami kesalahan, kehabisan waktu, atau media melebihi `maxBytes`, coba entri berikutnya.
  </Step>
  <Step title="Terapkan saat berhasil">
    `Body` menjadi blok `[Image]`, `[Audio]`, atau `[Video]`. Audio juga menetapkan `{{Transcript}}`; penguraian perintah menggunakan teks keterangan jika tersedia, atau transkrip jika tidak. Keterangan dipertahankan sebagai `User text:` di dalam blok.
  </Step>
</Steps>

## Konfigurasi

`tools.media` berisi daftar model bersama beserta penggantian per kapabilitas:

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

Kunci per kapabilitas (`image`/`audio`/`video`):

| Kunci                                           | Jenis     | Bawaan                                               | Catatan                                                                                  |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | otomatis (`false` menonaktifkan)                     | Tetapkan `false` untuk menonaktifkan deteksi otomatis bagi kapabilitas ini               |
| `models`                                        | array     | tidak ada                                            | Diutamakan sebelum daftar bersama `tools.media.models`                                   |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ panduan maxChars)       | Secara bawaan hanya untuk gambar/video                                                   |
| `maxChars`                                      | `number`  | `500` (gambar/video), tidak ditetapkan (audio)       | Keluaran dipangkas jika model mengembalikan lebih banyak                                 |
| `maxBytes`                                      | `number`  | gambar `10485760`, audio `20971520`, video `52428800` | Media yang terlalu besar dilewati dan beralih ke model berikutnya                       |
| `timeoutSeconds`                                | `number`  | `60` (gambar/audio), `120` (video)                   |                                                                                          |
| `language`                                      | `string`  | tidak ditetapkan                                     | Petunjuk transkripsi audio                                                               |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | Penggantian permintaan penyedia; lihat [Alat dan penyedia khusus](/id/gateway/config-tools) |
| `attachments`                                   | object    | `{ mode: "first", maxAttachments: 1 }`               | Lihat [Kebijakan lampiran](#attachment-policy)                                           |
| `scope`                                         | object    | tidak ditetapkan                                     | Batasi berdasarkan channel/chatType/keyPrefix                                            |
| `echoTranscript`                                | `boolean` | `false`                                              | Khusus audio: kirim kembali transkrip ke obrolan sebelum pemrosesan agen                 |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | Khusus audio: placeholder `{transcript}`                                                  |

Opsi khusus Deepgram ditempatkan di bawah `providerOptions.deepgram` (kolom tingkat atas `deepgram: { detectLanguage, punctuate, smartFormat }` telah usang, tetapi masih dibaca).

### Entri model

Setiap entri `models[]` merupakan entri **penyedia** (bawaan) atau entri **CLI**:

<Tabs>
  <Tab title="Entri penyedia">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, for multi-modal shared entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Entri CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    Templat CLI juga dapat menggunakan `{{MediaDir}}` (direktori yang berisi berkas media), `{{OutputDir}}` (direktori sementara yang dibuat untuk proses ini), dan `{{OutputBase}}` (jalur dasar berkas sementara, tanpa ekstensi).

  </Tab>
</Tabs>

### Kredensial penyedia

Pemahaman media oleh penyedia menggunakan resolusi autentikasi yang sama seperti panggilan model biasa: profil autentikasi, variabel lingkungan, kemudian `models.providers.<providerId>.apiKey`. Entri `tools.media.*.models[]` tidak menerima kolom `apiKey` sebaris.

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Lihat [Alat dan penyedia khusus](/id/gateway/config-tools) untuk profil, variabel lingkungan, dan URL dasar khusus.

## Aturan dan perilaku

- Media yang melebihi `maxBytes` melewati model tersebut dan mencoba model berikutnya.
- Berkas audio di bawah 1024 byte dianggap kosong/rusak dan dilewati sebelum transkripsi; agen menerima transkrip placeholder deterministik sebagai gantinya.
- Jika model gambar utama yang aktif sudah mendukung penglihatan secara native, OpenClaw melewati blok ringkasan `[Image]` dan meneruskan gambar asli langsung ke model. MiniMax merupakan pengecualian: `minimax`, `minimax-cn`, `minimax-portal`, dan `minimax-portal-cn` selalu merutekan pemahaman gambar melalui penyedia media `MiniMax-VL-01` milik plugin, meskipun metadata obrolan MiniMax M2.x lama mengklaim dukungan masukan gambar (hanya `MiniMax-M3` dan versi lebih baru yang dianggap mampu menangani penglihatan secara native).
- Jika model utama Gateway/WebChat hanya mendukung teks, lampiran gambar dipertahankan sebagai referensi `media://inbound/*` yang dialihkan penyimpanannya agar alat gambar/PDF atau model gambar yang dikonfigurasi tetap dapat memeriksanya, alih-alih kehilangan lampiran tersebut.
- Perintah eksplisit `openclaw infer image describe --file <path> --model <provider/model>` (alias: `openclaw capability image describe`) menjalankan penyedia/model berkemampuan gambar tersebut secara langsung, termasuk referensi Ollama seperti `ollama/qwen2.5vl:7b` ketika model berkemampuan gambar yang cocok dikonfigurasi di bawah `models.providers.ollama.models[]`.
- Jika `<capability>.enabled` bukan `false`, tetapi tidak ada model yang dikonfigurasi, OpenClaw mencoba model balasan aktif ketika penyedianya mendukung kapabilitas tersebut.

### Deteksi otomatis (bawaan)

Ketika `tools.media.<capability>.enabled` bukan `false` dan tidak ada model yang dikonfigurasi, OpenClaw mencoba opsi berikut secara berurutan dan berhenti pada opsi pertama yang berfungsi:

<Steps>
  <Step title="Model gambar yang dikonfigurasi (khusus gambar)">
    Referensi utama/fallback `agents.defaults.imageModel`, kecuali model balasan aktif sudah mendukung penglihatan secara native. Utamakan referensi `provider/model`; referensi tanpa penyedia hanya dilengkapi dari entri model penyedia berkemampuan gambar yang dikonfigurasi ketika kecocokannya unik.
  </Step>
  <Step title="Model balasan aktif">
    Model balasan aktif, ketika penyedianya mendukung kapabilitas tersebut.
  </Step>
  <Step title="Autentikasi penyedia (khusus audio, sebelum CLI lokal)">
    Entri `models.providers.*` yang dikonfigurasi dan mendukung audio dicoba sebelum CLI lokal. Urutan prioritas penyedia bawaan (jika sama, diurutkan menurut abjad berdasarkan ID penyedia): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="CLI lokal (khusus audio)">
    Biner lokal yang siap digunakan menjadi daftar fallback berurutan:
    - `whisper-cli` ditempatkan pertama hanya setelah pemanggilan model sebelumnya dalam proses saat ini mendeteksi Metal atau CUDA
    - `sherpa-onnx-offline` dengan CPU sebagai bawaan (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli` ketika akselerasi hanya didukung oleh hasil build atau belum terdeteksi
    - `parakeet-mlx` pada Apple Silicon (mendukung MLX, penggunaan perangkat belum terdeteksi)
    - `whisper` (CLI Python; secara bawaan menggunakan model `turbo`, diunduh secara otomatis)

    Pemeriksaan kapabilitas backend disimpan dalam cache dan tidak memuat model. Kapabilitas hasil build, flag backend yang diminta, dan backend yang terdeteksi dari pemanggilan nyata tetap dipisahkan. whisper.cpp yang terdeteksi otomatis membiarkan log eksekusi model tetap aktif agar baris backend terpilih dari upstream dapat direkam. Entri CLI eksplisit mempertahankan urutan, flag backend, dan flag keluaran yang dikonfigurasi.

  </Step>
  <Step title="Autentikasi penyedia (gambar/video)">
    Entri `models.providers.*` yang dikonfigurasi dan mendukung kapabilitas tersebut dicoba sebelum urutan fallback bawaan. Penyedia konfigurasi khusus gambar dengan model berkemampuan gambar didaftarkan secara otomatis untuk pemahaman media meskipun bukan Plugin vendor bawaan.

    Urutan prioritas penyedia bawaan (jika sama, diurutkan menurut abjad berdasarkan ID penyedia):
    - Gambar: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Video: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="CLI Antigravity (khusus gambar/video)">
    Biner `agy` atau `antigravity` pertama yang terpasang (ganti dengan `OPENCLAW_ANTIGRAVITY_CLI`), dijalankan dalam sandbox yang dibatasi pada direktori media.
  </Step>
</Steps>

Untuk menonaktifkan deteksi otomatis bagi suatu kapabilitas:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
Deteksi biner bersifat upaya terbaik di macOS/Linux/Windows; pastikan CLI tersedia di `PATH` (`~` diperluas), atau tetapkan entri model CLI eksplisit dengan jalur perintah lengkap.
</Note>

### Dukungan proksi (panggilan penyedia audio/video)

Pemahaman **audio** dan **video** berbasis penyedia mematuhi variabel lingkungan proksi keluar standar, termasuk aturan pengecualian `NO_PROXY`/`no_proxy`: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Variabel huruf kecil lebih diprioritaskan daripada huruf besar. Jika tidak ada yang ditetapkan, pemahaman media menggunakan akses keluar langsung; jika nilai proksi tidak valid, OpenClaw mencatat peringatan dan beralih ke pengambilan langsung. Pemahaman gambar tidak melalui jalur proksi ini.

## Kapabilitas

Tetapkan `capabilities` pada entri `models[]` untuk membatasinya ke jenis media tertentu. Untuk daftar bersama, OpenClaw menyimpulkan nilai bawaan per penyedia bawaan:

| Penyedia                                                                 | Kemampuan             |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | gambar                |
| `minimax-portal`                                                         | gambar                |
| `moonshot`                                                               | gambar + video        |
| `openrouter`                                                             | gambar + audio        |
| `google` (API Gemini)                                                    | gambar + audio + video |
| `qwen`                                                                   | gambar + video        |
| `deepinfra`                                                              | gambar + audio        |
| `mistral`                                                                | audio                 |
| `zai`                                                                    | gambar                |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | audio                 |
| Setiap katalog `models.providers.<id>.models[]` dengan model berkemampuan gambar | gambar                |

Untuk entri CLI, tetapkan `capabilities` secara eksplisit guna menghindari pencocokan yang tidak terduga; jika dihilangkan, entri tersebut memenuhi syarat untuk setiap daftar kemampuan tempat entri itu muncul.

## Matriks dukungan penyedia

| Kemampuan | Penyedia                                                                                                                                               | Catatan                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gambar     | Anthropic, server aplikasi Codex, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, penyedia konfigurasi | Plugin vendor mendaftarkan dukungan gambar; `openai/*` dapat menggunakan perutean kunci API atau Codex OAuth; `codex/*` menggunakan satu giliran server aplikasi Codex yang dibatasi; penyedia konfigurasi berkemampuan gambar didaftarkan secara otomatis. |
| Audio      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Transkripsi penyedia (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                         |
| Video      | Google, Moonshot, Qwen                                                                                                                                  | Pemahaman video penyedia melalui Plugin vendor; pemahaman video Qwen menggunakan titik akhir DashScope standar.                                                                           |

<Note>
**Catatan MiniMax**: pemahaman gambar `minimax`, `minimax-cn`, `minimax-portal`, dan `minimax-portal-cn` selalu berasal dari penyedia media `MiniMax-VL-01` yang dimiliki Plugin, meskipun metadata obrolan MiniMax M2.x lama menyatakan dukungan masukan gambar.
</Note>

## Panduan pemilihan model

- Utamakan model generasi terkini yang paling andal untuk setiap kemampuan media jika kualitas dan keamanan penting.
- Untuk agen yang mendukung alat dan menangani masukan tidak tepercaya, hindari model media yang lebih lama atau lebih lemah.
- Pertahankan setidaknya satu cadangan untuk setiap kemampuan demi ketersediaan (model berkualitas + model yang lebih cepat/murah).
- Cadangan CLI (`whisper-cli`, `whisper`, `gemini`) membantu ketika API penyedia tidak tersedia.
- Mode keluaran berkas yang diketahui bersifat otoritatif: berkas transkrip hasil inferensi yang kosong atau tidak ada tidak menghasilkan transkrip, alih-alih beralih ke keluaran kemajuan CLI.
- `parakeet-mlx`: gunakan `--output-format txt` (atau `all`) bersama `--output-dir` dan templat keluaran bawaan `{filename}`. Variabel lingkungan hulu `PARAKEET_OUTPUT_FORMAT` dan `PARAKEET_OUTPUT_TEMPLATE` juga dipatuhi. OpenClaw membaca `<output-dir>/<media-basename>.txt`; format bawaan `srt`, format lainnya, dan templat keluaran khusus tetap menggunakan stdout.

## Kebijakan lampiran

`attachments` per kemampuan mengontrol lampiran mana yang diproses:

<ParamField path="mode" type='"first" | "all"' default="first">
  Proses hanya lampiran pertama yang dipilih, atau semuanya.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Batasi jumlah yang diproses.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferensi pemilihan di antara lampiran kandidat.
</ParamField>

Ketika `mode: "all"`, keluaran diberi label `[Gambar 1/2]`, `[Audio 2/2]`, dan seterusnya.

### Ekstraksi lampiran berkas

- Teks berkas yang diekstrak dibungkus sebagai konten eksternal tidak tepercaya sebelum ditambahkan ke prompt media, menggunakan penanda batas seperti `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` beserta baris metadata `Source: External`.
- Jalur ini sengaja menghilangkan banner panjang `SECURITY NOTICE:` agar prompt media tetap ringkas; penanda batas dan metadata tetap diterapkan.
- Berkas tanpa teks yang dapat diekstrak mendapatkan `[Tidak ada teks yang dapat diekstrak]`.
- Jika PDF beralih ke gambar halaman yang dirender, OpenClaw meneruskan gambar tersebut ke model balasan berkemampuan penglihatan dan mempertahankan placeholder `[Konten PDF dirender menjadi gambar]` dalam blok berkas.

## Contoh konfigurasi

<Tabs>
  <Tab title="Model bersama + penggantian">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Hanya audio + video">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Hanya gambar">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Satu entri multimodal">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Keluaran status

Ketika pemahaman media berjalan, `/status` menyertakan baris ringkasan per kemampuan:

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

Untuk inventaris prapemeriksaan, jalankan `openclaw capability audio providers`. Baris lokal menampilkan pilihan cadangan lokal secara terpisah dari pemilihan penyedia global, kesiapan, serta bidang backend mampu/diminta/teramati yang terpisah. Pemilihan lokal yang sama tersedia sebagai temuan informatif doctor:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Catatan

- Pemahaman dilakukan dengan upaya terbaik. Kesalahan tidak menghalangi balasan.
- Lampiran tetap diteruskan ke model meskipun pemahaman dinonaktifkan.
- Gunakan `scope` untuk membatasi tempat pemahaman berjalan (misalnya, hanya DM).

## Terkait

- [Konfigurasi](/id/gateway/configuration)
- [Dukungan gambar & media](/id/nodes/images)
