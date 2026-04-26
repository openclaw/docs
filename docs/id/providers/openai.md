---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda menginginkan autentikasi langganan Codex alih-alih kunci API
    - Anda memerlukan perilaku eksekusi agen GPT-5 yang lebih ketat
summary: Gunakan OpenAI melalui API key atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T11:37:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI menyediakan API developer untuk model GPT, dan Codex juga tersedia sebagai agen coding paket ChatGPT melalui klien Codex OpenAI. OpenClaw menjaga permukaan-permukaan tersebut tetap terpisah agar konfigurasi tetap dapat diprediksi.

  OpenClaw mendukung tiga rute keluarga OpenAI. Prefiks model memilih rute penyedia/autentikasi; pengaturan runtime terpisah memilih siapa yang menjalankan loop agen tersemat:

  - **API key** — akses langsung ke OpenAI Platform dengan penagihan berbasis penggunaan (model `openai/*`)
  - **Langganan Codex melalui PI** — masuk ChatGPT/Codex dengan akses langganan (model `openai-codex/*`)
  - **Harness server-aplikasi Codex** — eksekusi server-aplikasi Codex native (model `openai/*` plus `agents.defaults.agentRuntime.id: "codex"`)

  OpenAI secara eksplisit mendukung penggunaan OAuth langganan di alat dan alur kerja eksternal seperti OpenClaw.

  Penyedia, model, runtime, dan channel adalah lapisan yang terpisah. Jika label-label tersebut mulai tercampur, baca [Runtime agen](/id/concepts/agent-runtimes) sebelum mengubah konfigurasi.

  ## Pilihan cepat

  | Tujuan                                        | Gunakan                                            | Catatan                                                                     |
  | --------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
  | Penagihan langsung dengan API key             | `openai/gpt-5.5`                                   | Tetapkan `OPENAI_API_KEY` atau jalankan onboarding OpenAI API-key.          |
  | GPT-5.5 dengan autentikasi langganan ChatGPT/Codex | `openai-codex/gpt-5.5`                         | Rute PI default untuk OAuth Codex. Pilihan awal terbaik untuk penyiapan langganan. |
  | GPT-5.5 dengan perilaku server-aplikasi Codex native | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Memaksa harness server-aplikasi Codex untuk referensi model tersebut.       |
  | Pembuatan atau pengeditan gambar              | `openai/gpt-image-2`                               | Berfungsi dengan `OPENAI_API_KEY` atau OAuth OpenAI Codex.                  |
  | Gambar dengan latar belakang transparan       | `openai/gpt-image-1.5`                             | Gunakan `outputFormat=png` atau `webp` dan `openai.background=transparent`. |

  ## Peta penamaan

  Nama-namanya mirip tetapi tidak saling dapat dipertukarkan:

  | Nama yang Anda lihat               | Lapisan           | Arti                                                                                             |
  | ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
  | `openai`                           | Prefiks penyedia  | Rute API OpenAI Platform langsung.                                                               |
  | `openai-codex`                     | Prefiks penyedia  | Rute OAuth/langganan OpenAI Codex melalui runner OpenClaw PI normal.                            |
  | Plugin `codex`                     | Plugin            | Plugin OpenClaw bawaan yang menyediakan runtime server-aplikasi Codex native dan kontrol chat `/codex`. |
  | `agentRuntime.id: codex`           | Runtime agen      | Paksa harness server-aplikasi Codex native untuk giliran tersemat.                              |
  | `/codex ...`                       | Set perintah chat | Ikat/kontrol thread server-aplikasi Codex dari sebuah percakapan.                               |
  | `runtime: "acp", agentId: "codex"` | Rute sesi ACP     | Jalur fallback eksplisit yang menjalankan Codex melalui ACP/acpx.                                |

  Artinya, sebuah konfigurasi dapat dengan sengaja memuat `openai-codex/*` dan plugin
  `codex`. Itu valid ketika Anda menginginkan OAuth Codex melalui PI dan juga ingin
  kontrol chat `/codex` native tersedia. `openclaw doctor` memperingatkan tentang
  kombinasi itu agar Anda dapat mengonfirmasi bahwa hal tersebut memang disengaja; alat itu tidak menulis ulangnya.

  <Note>
  GPT-5.5 tersedia melalui akses API key OpenAI Platform langsung maupun
  rute langganan/OAuth. Gunakan `openai/gpt-5.5` untuk lalu lintas
  `OPENAI_API_KEY` langsung, `openai-codex/gpt-5.5` untuk OAuth Codex melalui PI, atau
  `openai/gpt-5.5` dengan `agentRuntime.id: "codex"` untuk harness
  server-aplikasi Codex native.
  </Note>

  <Note>
  Mengaktifkan plugin OpenAI, atau memilih model `openai-codex/*`, tidak
  mengaktifkan plugin server-aplikasi Codex bawaan. OpenClaw mengaktifkan plugin tersebut hanya
  ketika Anda secara eksplisit memilih harness Codex native dengan
  `agentRuntime.id: "codex"` atau menggunakan referensi model lama `codex/*`.
  Jika plugin `codex` bawaan diaktifkan tetapi `openai-codex/*` tetap diresolusikan
  melalui PI, `openclaw doctor` akan memperingatkan dan membiarkan rutenya tetap tidak berubah.
  </Note>

  ## Cakupan fitur OpenClaw

  | Kemampuan OpenAI         | Permukaan OpenClaw                                        | Status                                                  |
  | ------------------------ | --------------------------------------------------------- | ------------------------------------------------------- |
  | Chat / Responses         | penyedia model `openai/<model>`                           | Ya                                                      |
  | Model langganan Codex    | `openai-codex/<model>` dengan OAuth `openai-codex`        | Ya                                                      |
  | Harness server-aplikasi Codex | `openai/<model>` dengan `agentRuntime.id: codex`     | Ya                                                      |
  | Pencarian web sisi server | alat Native OpenAI Responses                             | Ya, saat pencarian web diaktifkan dan tidak ada penyedia yang dipatok |
  | Gambar                   | `image_generate`                                          | Ya                                                      |
  | Video                    | `video_generate`                                          | Ya                                                      |
  | Text-to-speech           | `messages.tts.provider: "openai"` / `tts`                 | Ya                                                      |
  | Speech-to-text batch     | `tools.media.audio` / pemahaman media                     | Ya                                                      |
  | Speech-to-text streaming | Voice Call `streaming.provider: "openai"`                 | Ya                                                      |
  | Suara realtime           | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ya                                                     |
  | Embeddings               | penyedia embedding memori                                 | Ya                                                      |

  ## Memulai

  Pilih metode autentikasi yang Anda sukai dan ikuti langkah penyiapannya.

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Terbaik untuk:** akses API langsung dan penagihan berbasis penggunaan.

    <Steps>
      <Step title="Dapatkan API key Anda">
        Buat atau salin API key dari [dashboard OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Atau berikan key secara langsung:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Ringkasan rute

    | Model ref              | Konfigurasi runtime             | Rute                        | Auth             |
    | ---------------------- | ------------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | dihilangkan / `agentRuntime.id: "pi"`    | API OpenAI Platform langsung | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | dihilangkan / `agentRuntime.id: "pi"`    | API OpenAI Platform langsung | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`      | Harness server-aplikasi Codex | server-aplikasi Codex |

    <Note>
    `openai/*` adalah rute API key OpenAI langsung kecuali Anda secara eksplisit memaksa
    harness server-aplikasi Codex. Gunakan `openai-codex/*` untuk OAuth Codex melalui
    runner PI default, atau gunakan `openai/gpt-5.5` dengan
    `agentRuntime.id: "codex"` untuk eksekusi server-aplikasi Codex native.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **tidak** mengekspos `openai/gpt-5.3-codex-spark`. Permintaan API OpenAI langsung menolak model tersebut, dan katalog Codex saat ini juga tidak mengeksposnya.
    </Warning>

  </Tab>

  <Tab title="Langganan Codex">
    **Terbaik untuk:** menggunakan langganan ChatGPT/Codex Anda alih-alih API key terpisah. Codex cloud memerlukan login ChatGPT.

    <Steps>
      <Step title="Jalankan OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Atau jalankan OAuth secara langsung:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Untuk penyiapan headless atau yang tidak ramah callback, tambahkan `--device-code` untuk masuk dengan alur device-code ChatGPT alih-alih callback browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Ringkasan rute

    | Model ref | Konfigurasi runtime | Rute | Auth |
    |-----------|---------------------|------|------|
    | `openai-codex/gpt-5.5` | dihilangkan / `runtime: "pi"` | OAuth ChatGPT/Codex melalui PI | login Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Tetap PI kecuali sebuah plugin secara eksplisit mengklaim `openai-codex` | login Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness server-aplikasi Codex | auth server-aplikasi Codex |

    <Note>
    Tetap gunakan id penyedia `openai-codex` untuk perintah auth/profile. Prefiks model
    `openai-codex/*` juga merupakan rute PI eksplisit untuk OAuth Codex.
    Itu tidak memilih atau mengaktifkan otomatis harness server-aplikasi Codex bawaan.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding tidak lagi mengimpor materi OAuth dari `~/.codex`. Masuklah dengan OAuth browser (default) atau alur device-code di atas — OpenClaw mengelola kredensial yang dihasilkan di penyimpanan auth agen miliknya sendiri.
    </Note>

    ### Indikator status

    Chat `/status` menampilkan runtime model mana yang aktif untuk sesi saat ini.
    Harness PI default muncul sebagai `Runtime: OpenClaw Pi Default`. Ketika
    harness server-aplikasi Codex bawaan dipilih, `/status` menampilkan
    `Runtime: OpenAI Codex`. Sesi yang sudah ada mempertahankan id harness yang tercatat, jadi gunakan
    `/new` atau `/reset` setelah mengubah `agentRuntime` jika Anda ingin `/status`
    mencerminkan pilihan PI/Codex yang baru.

    ### Peringatan doctor

    Jika plugin `codex` bawaan diaktifkan saat rute `openai-codex/*`
    pada tab ini dipilih, `openclaw doctor` memperingatkan bahwa model tersebut
    tetap diresolusikan melalui PI. Biarkan konfigurasi tidak berubah bila itu adalah
    rute autentikasi langganan yang dimaksud. Beralihlah ke `openai/<model>` plus
    `agentRuntime.id: "codex"` hanya ketika Anda menginginkan eksekusi
    server-aplikasi Codex native.

    ### Batas context window

    OpenClaw memperlakukan metadata model dan batas konteks runtime sebagai nilai yang terpisah.

    Untuk `openai-codex/gpt-5.5` melalui OAuth Codex:

    - Native `contextWindow`: `1000000`
    - Batas `contextTokens` runtime default: `272000`

    Batas default yang lebih kecil memiliki karakteristik latensi dan kualitas yang lebih baik dalam praktiknya. Ganti nilainya dengan `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Gunakan `contextWindow` untuk mendeklarasikan metadata model native. Gunakan `contextTokens` untuk membatasi anggaran konteks runtime.
    </Note>

    ### Pemulihan katalog

    OpenClaw menggunakan metadata katalog Codex upstream untuk `gpt-5.5` saat
    tersedia. Jika penemuan Codex live tidak menampilkan baris `openai-codex/gpt-5.5` sementara
    akun sudah diautentikasi, OpenClaw mensintesis baris model OAuth tersebut agar
    eksekusi Cron, sub-agen, dan model default yang dikonfigurasi tidak gagal dengan
    `Unknown model`.

  </Tab>
</Tabs>

## Pembuatan gambar

Plugin `openai` bawaan mendaftarkan pembuatan gambar melalui alat `image_generate`.
Plugin ini mendukung pembuatan gambar OpenAI berbasis API key dan pembuatan gambar
berbasis OAuth Codex melalui referensi model `openai/gpt-image-2` yang sama.

| Kemampuan                | API key OpenAI                     | OAuth Codex                           |
| ------------------------ | ---------------------------------- | ------------------------------------- |
| Model ref                | `openai/gpt-image-2`               | `openai/gpt-image-2`                  |
| Auth                     | `OPENAI_API_KEY`                   | login OAuth OpenAI Codex              |
| Transport                | API Images OpenAI                  | backend Codex Responses               |
| Gambar maksimum per permintaan | 4                            | 4                                     |
| Mode edit                | Diaktifkan (hingga 5 gambar referensi) | Diaktifkan (hingga 5 gambar referensi) |
| Override ukuran          | Didukung, termasuk ukuran 2K/4K    | Didukung, termasuk ukuran 2K/4K       |
| Rasio aspek / resolusi   | Tidak diteruskan ke API Images OpenAI | Dipetakan ke ukuran yang didukung bila aman |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

`gpt-image-2` adalah default untuk pembuatan teks-ke-gambar OpenAI dan pengeditan
gambar. `gpt-image-1.5`, `gpt-image-1`, dan `gpt-image-1-mini` tetap dapat digunakan sebagai
override model eksplisit. Gunakan `openai/gpt-image-1.5` untuk keluaran PNG/WebP
dengan latar belakang transparan; API `gpt-image-2` saat ini menolak
`background: "transparent"`.

Untuk permintaan latar belakang transparan, agen harus memanggil `image_generate` dengan
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` atau `"webp"`, dan
`background: "transparent"`; opsi penyedia lama `openai.background` masih
diterima. OpenClaw juga melindungi rute OpenAI publik dan
OAuth OpenAI Codex dengan menulis ulang permintaan transparan default `openai/gpt-image-2`
menjadi `gpt-image-1.5`; endpoint Azure dan endpoint kompatibel OpenAI kustom tetap
menggunakan nama deployment/model yang dikonfigurasi.

Pengaturan yang sama juga tersedia untuk eksekusi CLI headless:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Gunakan flag `--output-format` dan `--background` yang sama dengan
`openclaw infer image edit` saat memulai dari file input.
`--openai-background` tetap tersedia sebagai alias khusus OpenAI.

Untuk instalasi OAuth Codex, tetap gunakan referensi `openai/gpt-image-2` yang sama. Saat
profil OAuth `openai-codex` dikonfigurasi, OpenClaw meresolusikan token akses OAuth
tersimpan tersebut dan mengirim permintaan gambar melalui backend Codex Responses. OpenClaw
tidak terlebih dahulu mencoba `OPENAI_API_KEY` atau secara diam-diam fallback ke API key untuk
permintaan tersebut. Konfigurasikan `models.providers.openai` secara eksplisit dengan API key,
base URL kustom, atau endpoint Azure saat Anda menginginkan rute
API Images OpenAI langsung.
Jika endpoint gambar kustom itu berada di LAN/alamat privat tepercaya, tetapkan juga
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw tetap
memblokir endpoint gambar privat/internal yang kompatibel OpenAI kecuali opt-in ini
ada.

Hasilkan:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Hasilkan PNG transparan:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Edit:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Pembuatan video

Plugin `openai` bawaan mendaftarkan pembuatan video melalui alat `video_generate`.

| Kemampuan       | Nilai                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Model default    | `openai/sora-2`                                                                   |
| Mode             | Teks-ke-video, gambar-ke-video, edit video tunggal                                |
| Input referensi  | 1 gambar atau 1 video                                                             |
| Override ukuran  | Didukung                                                                          |
| Override lainnya | `aspectRatio`, `resolution`, `audio`, `watermark` diabaikan dengan peringatan alat |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

## Kontribusi prompt GPT-5

OpenClaw menambahkan kontribusi prompt GPT-5 bersama untuk eksekusi keluarga GPT-5 lintas penyedia. Kontribusi ini diterapkan berdasarkan id model, sehingga `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, dan referensi GPT-5 kompatibel lainnya menerima overlay yang sama. Model GPT-4.x yang lebih lama tidak menerimanya.

Harness Codex native bawaan menggunakan perilaku GPT-5 dan overlay Heartbeat yang sama melalui instruksi developer server-aplikasi Codex, sehingga sesi `openai/gpt-5.x` yang dipaksa melalui `agentRuntime.id: "codex"` tetap mempertahankan panduan tindak lanjut dan Heartbeat proaktif yang sama meskipun Codex memiliki bagian lain dari prompt harness.

Kontribusi GPT-5 menambahkan kontrak perilaku bertag untuk persistensi persona, keamanan eksekusi, disiplin alat, bentuk output, pemeriksaan penyelesaian, dan verifikasi. Perilaku balasan khusus channel dan pesan senyap tetap berada di prompt sistem OpenClaw bersama dan kebijakan pengiriman keluar. Panduan GPT-5 selalu diaktifkan untuk model yang cocok. Lapisan gaya interaksi ramah bersifat terpisah dan dapat dikonfigurasi.

| Nilai                  | Efek                                       |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (default) | Aktifkan lapisan gaya interaksi ramah      |
| `"on"`                 | Alias untuk `"friendly"`                   |
| `"off"`                | Nonaktifkan hanya lapisan gaya ramah       |

<Tabs>
  <Tab title="Konfigurasi">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Nilai tidak peka huruf besar-kecil saat runtime, jadi `"Off"` dan `"off"` sama-sama menonaktifkan lapisan gaya ramah.
</Tip>

<Note>
`plugins.entries.openai.config.personality` lama masih dibaca sebagai fallback kompatibilitas ketika pengaturan bersama `agents.defaults.promptOverlays.gpt5.personality` tidak ditetapkan.
</Note>

## Suara dan speech

<AccordionGroup>
  <Accordion title="Sintesis ucapan (TTS)">
    Plugin `openai` bawaan mendaftarkan sintesis ucapan untuk permukaan `messages.tts`.

    | Pengaturan | Jalur konfigurasi | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Kecepatan | `messages.tts.providers.openai.speed` | (tidak ditetapkan) |
    | Instruksi | `messages.tts.providers.openai.instructions` | (tidak ditetapkan, hanya `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` untuk catatan suara, `mp3` untuk file |
    | API key | `messages.tts.providers.openai.apiKey` | Fallback ke `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Model yang tersedia: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voice yang tersedia: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Tetapkan `OPENAI_TTS_BASE_URL` untuk menimpa base URL TTS tanpa memengaruhi endpoint API chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `openai` bawaan mendaftarkan speech-to-text batch melalui
    permukaan transkripsi pemahaman media OpenClaw.

    - Model default: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Jalur input: unggah file audio multipart
    - Didukung oleh OpenClaw di mana pun transkripsi audio masuk menggunakan
      `tools.media.audio`, termasuk segmen voice-channel Discord dan
      lampiran audio channel

    Untuk memaksa OpenAI untuk transkripsi audio masuk:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Petunjuk bahasa dan prompt diteruskan ke OpenAI saat diberikan oleh
    konfigurasi media audio bersama atau permintaan transkripsi per panggilan.

  </Accordion>

  <Accordion title="Transkripsi realtime">
    Plugin `openai` bawaan mendaftarkan transkripsi realtime untuk plugin Voice Call.

    | Pengaturan | Jalur konfigurasi | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Bahasa | `...openai.language` | (tidak ditetapkan) |
    | Prompt | `...openai.prompt` | (tidak ditetapkan) |
    | Durasi senyap | `...openai.silenceDurationMs` | `800` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Menggunakan koneksi WebSocket ke `wss://api.openai.com/v1/realtime` dengan audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Penyedia streaming ini untuk jalur transkripsi realtime Voice Call; voice Discord saat ini merekam segmen pendek dan menggunakan jalur transkripsi batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Suara realtime">
    Plugin `openai` bawaan mendaftarkan suara realtime untuk plugin Voice Call.

    | Pengaturan | Jalur konfigurasi | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Durasi senyap | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Mendukung Azure OpenAI melalui kunci konfigurasi `azureEndpoint` dan `azureDeployment`. Mendukung pemanggilan alat dua arah. Menggunakan format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Penyedia `openai` bawaan dapat menargetkan resource Azure OpenAI untuk pembuatan
gambar dengan menimpa base URL. Pada jalur pembuatan gambar, OpenClaw
mendeteksi hostname Azure pada `models.providers.openai.baseUrl` dan secara otomatis beralih ke bentuk permintaan Azure.

<Note>
Suara realtime menggunakan jalur konfigurasi terpisah
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
dan tidak dipengaruhi oleh `models.providers.openai.baseUrl`. Lihat accordion **Suara
realtime** di bawah [Suara dan speech](#voice-and-speech) untuk pengaturan
Azure-nya.
</Note>

Gunakan Azure OpenAI saat:

- Anda sudah memiliki langganan, kuota, atau perjanjian enterprise Azure OpenAI
- Anda memerlukan residensi data regional atau kontrol kepatuhan yang disediakan Azure
- Anda ingin menjaga lalu lintas tetap berada di dalam tenancy Azure yang sudah ada

### Konfigurasi

Untuk pembuatan gambar Azure melalui penyedia `openai` bawaan, arahkan
`models.providers.openai.baseUrl` ke resource Azure Anda dan tetapkan `apiKey` ke
kunci Azure OpenAI (bukan kunci OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw mengenali sufiks host Azure berikut untuk rute pembuatan gambar Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Untuk permintaan pembuatan gambar pada host Azure yang dikenali, OpenClaw:

- Mengirim header `api-key` alih-alih `Authorization: Bearer`
- Menggunakan jalur berscope deployment (`/openai/deployments/{deployment}/...`)
- Menambahkan `?api-version=...` ke setiap permintaan
- Menggunakan batas waktu permintaan default 600 detik untuk panggilan pembuatan gambar Azure.
  Nilai `timeoutMs` per panggilan tetap menimpa default ini.

Base URL lainnya (OpenAI publik, proksi yang kompatibel dengan OpenAI) tetap menggunakan
bentuk permintaan gambar OpenAI standar.

<Note>
Perutean Azure untuk jalur pembuatan gambar penyedia `openai` memerlukan
OpenClaw 2026.4.22 atau yang lebih baru. Versi sebelumnya memperlakukan setiap
`openai.baseUrl` kustom seperti endpoint OpenAI publik dan akan gagal terhadap deployment
gambar Azure.
</Note>

### Versi API

Tetapkan `AZURE_OPENAI_API_VERSION` untuk mematok versi preview atau GA Azure tertentu
untuk jalur pembuatan gambar Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Default-nya adalah `2024-12-01-preview` saat variabel tidak ditetapkan.

### Nama model adalah nama deployment

Azure OpenAI mengikat model ke deployment. Untuk permintaan pembuatan gambar Azure
yang dirutekan melalui penyedia `openai` bawaan, field `model` di OpenClaw
harus berupa **nama deployment Azure** yang Anda konfigurasi di portal Azure, bukan
id model OpenAI publik.

Jika Anda membuat deployment bernama `gpt-image-2-prod` yang melayani `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aturan nama deployment yang sama berlaku untuk panggilan pembuatan gambar yang dirutekan melalui
penyedia `openai` bawaan.

### Ketersediaan regional

Pembuatan gambar Azure saat ini hanya tersedia di sebagian wilayah
(misalnya `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Periksa daftar wilayah terbaru Microsoft sebelum membuat
deployment, dan pastikan model spesifik tersebut tersedia di wilayah Anda.

### Perbedaan parameter

Azure OpenAI dan OpenAI publik tidak selalu menerima parameter gambar yang sama.
Azure dapat menolak opsi yang diizinkan oleh OpenAI publik (misalnya nilai
`background` tertentu pada `gpt-image-2`) atau hanya mengeksposnya pada versi model
tertentu. Perbedaan ini berasal dari Azure dan model yang mendasarinya, bukan
OpenClaw. Jika permintaan Azure gagal dengan galat validasi, periksa
set parameter yang didukung oleh deployment dan versi API spesifik Anda di
portal Azure.

<Note>
Azure OpenAI menggunakan perilaku transport dan kompatibilitas native tetapi tidak menerima
header atribusi tersembunyi OpenClaw — lihat accordion **Rute native vs yang kompatibel dengan OpenAI**
di bawah [Konfigurasi lanjutan](#advanced-configuration).

Untuk lalu lintas chat atau Responses di Azure (di luar pembuatan gambar), gunakan
alur onboarding atau konfigurasi penyedia Azure khusus — `openai.baseUrl` saja
tidak mengambil bentuk API/auth Azure. Penyedia
`azure-openai-responses/*` terpisah tersedia; lihat
accordion Compaction sisi server di bawah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw menggunakan WebSocket lebih dulu dengan fallback SSE (`"auto"`) untuk `openai/*` dan `openai-codex/*`.

    Dalam mode `"auto"`, OpenClaw:
    - Mencoba ulang satu kegagalan awal WebSocket sebelum fallback ke SSE
    - Setelah kegagalan, menandai WebSocket sebagai menurun selama ~60 detik dan menggunakan SSE selama masa cool-down
    - Menyertakan header identitas sesi dan giliran yang stabil untuk percobaan ulang dan sambung ulang
    - Menormalkan penghitung penggunaan (`input_tokens` / `prompt_tokens`) lintas varian transport

    | Nilai | Perilaku |
    |-------|----------|
    | `"auto"` (default) | WebSocket lebih dulu, fallback SSE |
    | `"sse"` | Paksa hanya SSE |
    | `"websocket"` | Paksa hanya WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Dokumen OpenAI terkait:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Warm-up WebSocket">
    OpenClaw mengaktifkan warm-up WebSocket secara default untuk `openai/*` dan `openai-codex/*` guna mengurangi latensi giliran pertama.

    ```json5
    // Nonaktifkan warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mode cepat">
    OpenClaw mengekspos toggle mode cepat bersama untuk `openai/*` dan `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfigurasi:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Saat diaktifkan, OpenClaw memetakan mode cepat ke pemrosesan prioritas OpenAI (`service_tier = "priority"`). Nilai `service_tier` yang sudah ada dipertahankan, dan mode cepat tidak menulis ulang `reasoning` atau `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Override sesi mengalahkan konfigurasi. Menghapus override sesi di UI Sessions mengembalikan sesi ke default yang dikonfigurasi.
    </Note>

  </Accordion>

  <Accordion title="Pemrosesan prioritas (service_tier)">
    API OpenAI mengekspos pemrosesan prioritas melalui `service_tier`. Tetapkan per model di OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Nilai yang didukung: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` hanya diteruskan ke endpoint OpenAI native (`api.openai.com`) dan endpoint Codex native (`chatgpt.com/backend-api`). Jika Anda merutekan salah satu penyedia melalui proksi, OpenClaw membiarkan `service_tier` tetap tidak berubah.
    </Warning>

  </Accordion>

  <Accordion title="Compaction sisi server (Responses API)">
    Untuk model Responses OpenAI langsung (`openai/*` pada `api.openai.com`), wrapper stream Pi-harness plugin OpenAI secara otomatis mengaktifkan Compaction sisi server:

    - Memaksa `store: true` (kecuali kompatibilitas model menetapkan `supportsStore: false`)
    - Menyuntikkan `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` default: 70% dari `contextWindow` (atau `80000` saat tidak tersedia)

    Ini berlaku untuk jalur Pi harness bawaan dan untuk hook penyedia OpenAI yang digunakan oleh eksekusi tersemat. Harness server-aplikasi Codex native mengelola konteksnya sendiri melalui Codex dan dikonfigurasi secara terpisah dengan `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Aktifkan secara eksplisit">
        Berguna untuk endpoint yang kompatibel seperti Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Ambang kustom">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Nonaktifkan">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` hanya mengontrol injeksi `context_management`. Model Responses OpenAI langsung tetap memaksa `store: true` kecuali kompatibilitas menetapkan `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentik ketat">
    Untuk eksekusi keluarga GPT-5 pada `openai/*`, OpenClaw dapat menggunakan kontrak eksekusi tersemat yang lebih ketat:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Dengan `strict-agentic`, OpenClaw:
    - Tidak lagi memperlakukan giliran hanya-rencana sebagai progres yang berhasil saat tindakan alat tersedia
    - Mencoba ulang giliran dengan arahan bertindak-sekarang
    - Mengaktifkan `update_plan` secara otomatis untuk pekerjaan yang substansial
    - Menampilkan status terblokir yang eksplisit jika model terus merencanakan tanpa bertindak

    <Note>
    Hanya berlaku untuk eksekusi keluarga GPT-5 OpenAI dan Codex. Penyedia lain dan keluarga model yang lebih lama tetap menggunakan perilaku default.
    </Note>

  </Accordion>

  <Accordion title="Rute native vs yang kompatibel dengan OpenAI">
    OpenClaw memperlakukan endpoint OpenAI langsung, Codex, dan Azure OpenAI secara berbeda dari proksi `/v1` generik yang kompatibel dengan OpenAI:

    **Rute native** (`openai/*`, Azure OpenAI):
    - Mempertahankan `reasoning: { effort: "none" }` hanya untuk model yang mendukung `none` effort OpenAI
    - Menghilangkan reasoning yang dinonaktifkan untuk model atau proksi yang menolak `reasoning.effort: "none"`
    - Menjadikan skema alat mode ketat secara default
    - Menyertakan header atribusi tersembunyi hanya pada host native yang terverifikasi
    - Mempertahankan pembentukan permintaan khusus OpenAI (`service_tier`, `store`, kompatibilitas reasoning, petunjuk cache prompt)

    **Rute proksi/kompatibel:**
    - Menggunakan perilaku kompatibilitas yang lebih longgar
    - Menghapus `store` Completions dari payload `openai-completions` non-native
    - Menerima JSON pass-through `params.extra_body`/`params.extraBody` lanjutan untuk proksi Completions yang kompatibel dengan OpenAI
    - Menerima `params.chat_template_kwargs` untuk proksi Completions yang kompatibel dengan OpenAI seperti vLLM
    - Tidak memaksa skema alat ketat atau header khusus native

    Azure OpenAI menggunakan perilaku transport dan kompatibilitas native tetapi tidak menerima header atribusi tersembunyi.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
