---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda menginginkan autentikasi langganan Codex, bukan kunci API
    - Anda memerlukan perilaku eksekusi agen GPT-5 yang lebih ketat
summary: Gunakan OpenAI melalui kunci API atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T16:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e113f2418f82a8859f208f85efb55114bda7bc17beeb28f012b19e861609dad
    source_path: providers/openai.md
    workflow: 16
---

OpenAI menyediakan API pengembang untuk model GPT, dan Codex juga tersedia sebagai
agen coding paket ChatGPT melalui klien Codex milik OpenAI. OpenClaw menjaga
permukaan tersebut tetap terpisah agar konfigurasi tetap dapat diprediksi.

OpenClaw mendukung tiga rute keluarga OpenAI. Prefiks model memilih rute
penyedia/autentikasi; pengaturan runtime terpisah memilih siapa yang menjalankan
loop agen tertanam:

- **Kunci API** — akses langsung OpenAI Platform dengan penagihan berbasis penggunaan (model `openai/*`)
- **Langganan Codex melalui PI** — masuk ChatGPT/Codex dengan akses langganan (model `openai-codex/*`)
- **Harness app-server Codex** — eksekusi app-server Codex native (model `openai/*` plus `agents.defaults.agentRuntime.id: "codex"`)

OpenAI secara eksplisit mendukung penggunaan OAuth langganan di alat dan alur kerja eksternal seperti OpenClaw.

Penyedia, model, runtime, dan saluran adalah lapisan terpisah. Jika label-label itu
mulai tercampur, baca [Runtime agen](/id/concepts/agent-runtimes) sebelum
mengubah konfigurasi.

## Pilihan cepat

| Tujuan                                        | Gunakan                                          | Catatan                                                                      |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Penagihan kunci API langsung                  | `openai/gpt-5.5`                                 | Atur `OPENAI_API_KEY` atau jalankan onboarding kunci API OpenAI.             |
| GPT-5.5 dengan autentikasi langganan ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Rute PI default untuk OAuth Codex. Pilihan awal terbaik untuk setup langganan. |
| GPT-5.5 dengan perilaku app-server Codex native | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Memaksa harness app-server Codex untuk referensi model itu.                  |
| Pembuatan atau penyuntingan gambar            | `openai/gpt-image-2`                             | Berfungsi dengan `OPENAI_API_KEY` atau OAuth OpenAI Codex.                   |
| Gambar dengan latar belakang transparan       | `openai/gpt-image-1.5`                           | Gunakan `outputFormat=png` atau `webp` dan `openai.background=transparent`.  |

## Peta penamaan

Nama-namanya mirip tetapi tidak dapat saling dipertukarkan:

| Nama yang Anda lihat                 | Lapisan           | Arti                                                                                              |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefiks penyedia  | Rute API OpenAI Platform langsung.                                                               |
| `openai-codex`                     | Prefiks penyedia  | Rute OAuth/langganan OpenAI Codex melalui runner PI OpenClaw normal.                              |
| Plugin `codex`                     | Plugin            | Plugin OpenClaw bawaan yang menyediakan runtime app-server Codex native dan kontrol chat `/codex`. |
| `agentRuntime.id: codex`           | Runtime agen      | Paksa harness app-server Codex native untuk giliran tertanam.                                     |
| `/codex ...`                       | Kumpulan perintah chat | Ikat/kontrol thread app-server Codex dari percakapan.                                            |
| `runtime: "acp", agentId: "codex"` | Rute sesi ACP     | Jalur fallback eksplisit yang menjalankan Codex melalui ACP/acpx.                                 |

Ini berarti konfigurasi dapat sengaja memuat `openai-codex/*` dan Plugin
`codex` sekaligus. Itu valid ketika Anda ingin OAuth Codex melalui PI dan juga ingin
kontrol chat `/codex` native tersedia. `openclaw doctor` memperingatkan tentang
kombinasi itu agar Anda dapat memastikan bahwa itu disengaja; perintah tersebut tidak menulis ulangnya.

<Note>
GPT-5.5 tersedia melalui akses kunci API OpenAI Platform langsung dan
rute langganan/OAuth. Gunakan `openai/gpt-5.5` untuk traffic `OPENAI_API_KEY`
langsung, `openai-codex/gpt-5.5` untuk OAuth Codex melalui PI, atau
`openai/gpt-5.5` dengan `agentRuntime.id: "codex"` untuk harness app-server
Codex native.
</Note>

<Note>
Mengaktifkan Plugin OpenAI, atau memilih model `openai-codex/*`, tidak
mengaktifkan Plugin app-server Codex bawaan. OpenClaw mengaktifkan Plugin itu hanya
ketika Anda secara eksplisit memilih harness Codex native dengan
`agentRuntime.id: "codex"` atau menggunakan referensi model `codex/*` lama.
Jika Plugin `codex` bawaan diaktifkan tetapi `openai-codex/*` masih diselesaikan
melalui PI, `openclaw doctor` memperingatkan dan membiarkan rute tetap tidak berubah.
</Note>

## Cakupan fitur OpenClaw

| Kemampuan OpenAI        | Permukaan OpenClaw                                         | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | penyedia model `openai/<model>`                            | Ya                                                     |
| Model langganan Codex     | `openai-codex/<model>` dengan OAuth `openai-codex`          | Ya                                                     |
| Harness app-server Codex  | `openai/<model>` dengan `agentRuntime.id: codex`            | Ya                                                     |
| Pencarian web sisi server | Alat OpenAI Responses native                               | Ya, ketika pencarian web diaktifkan dan tidak ada penyedia yang dipin |
| Gambar                    | `image_generate`                                           | Ya                                                     |
| Video                     | `video_generate`                                           | Ya                                                     |
| Teks ke ucapan            | `messages.tts.provider: "openai"` / `tts`                  | Ya                                                     |
| Ucapan ke teks batch      | `tools.media.audio` / pemahaman media                      | Ya                                                     |
| Ucapan ke teks streaming  | Voice Call `streaming.provider: "openai"`                  | Ya                                                     |
| Suara realtime            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ya                                                     |
| Embedding                 | penyedia embedding memori                                  | Ya                                                     |

## Embedding memori

OpenClaw dapat menggunakan OpenAI, atau endpoint embedding yang kompatibel dengan OpenAI, untuk
pengindeksan `memory_search` dan embedding kueri:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Untuk endpoint yang kompatibel dengan OpenAI yang memerlukan label embedding asimetris, atur
`queryInputType` dan `documentInputType` di bawah `memorySearch`. OpenClaw meneruskan
keduanya sebagai field permintaan `input_type` khusus penyedia: embedding kueri menggunakan
`queryInputType`; potongan memori yang diindeks dan pengindeksan batch menggunakan
`documentInputType`. Lihat [Referensi konfigurasi memori](/id/reference/memory-config#provider-specific-config) untuk contoh lengkap.

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah-langkah setup.

<Tabs>
  <Tab title="Kunci API (OpenAI Platform)">
    **Terbaik untuk:** akses API langsung dan penagihan berbasis penggunaan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat atau salin kunci API dari [dasbor OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Atau berikan kuncinya secara langsung:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Ringkasan rute

    | Referensi model        | Konfigurasi runtime        | Rute                        | Autentikasi      |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | dihilangkan / `agentRuntime.id: "pi"`    | API OpenAI Platform langsung | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | dihilangkan / `agentRuntime.id: "pi"`    | API OpenAI Platform langsung | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Harness app-server Codex    | App-server Codex |

    <Note>
    `openai/*` adalah rute kunci API OpenAI langsung kecuali Anda secara eksplisit memaksa
    harness app-server Codex. Gunakan `openai-codex/*` untuk OAuth Codex melalui
    runner PI default, atau gunakan `openai/gpt-5.5` dengan
    `agentRuntime.id: "codex"` untuk eksekusi app-server Codex native.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **tidak** mengekspos `openai/gpt-5.3-codex-spark`. Permintaan API OpenAI live menolak model itu, dan katalog Codex saat ini juga tidak mengeksposnya.
    </Warning>

  </Tab>

  <Tab title="Langganan Codex">
    **Terbaik untuk:** menggunakan langganan ChatGPT/Codex Anda alih-alih kunci API terpisah. Cloud Codex memerlukan masuk ChatGPT.

    <Steps>
      <Step title="Jalankan OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Atau jalankan OAuth secara langsung:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Untuk setup headless atau yang tidak cocok dengan callback, tambahkan `--device-code` untuk masuk dengan alur kode perangkat ChatGPT alih-alih callback browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Atur model default">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Ringkasan rute

    | Referensi model | Konfigurasi runtime | Rute | Autentikasi |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | dihilangkan / `runtime: "pi"` | OAuth ChatGPT/Codex melalui PI | Masuk Codex |
    | `openai-codex/gpt-5.4-mini` | dihilangkan / `runtime: "pi"` | OAuth ChatGPT/Codex melalui PI | Masuk Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Tetap PI kecuali sebuah Plugin secara eksplisit mengklaim `openai-codex` | Masuk Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness app-server Codex | Autentikasi app-server Codex |

    <Note>
    Tetap gunakan id penyedia `openai-codex` untuk perintah autentikasi/profil. Prefiks model
    `openai-codex/*` juga merupakan rute PI eksplisit untuk OAuth Codex.
    Itu tidak memilih atau mengaktifkan otomatis harness app-server Codex bawaan.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding tidak lagi mengimpor material OAuth dari `~/.codex`. Masuk dengan OAuth browser (default) atau alur kode perangkat di atas — OpenClaw mengelola kredensial yang dihasilkan di penyimpanan autentikasi agennya sendiri.
    </Note>

    ### Indikator status

    Chat `/status` menunjukkan runtime model mana yang aktif untuk sesi saat ini.
    Harness PI default muncul sebagai `Runtime: OpenClaw Pi Default`. Saat harness app-server Codex bawaan dipilih, `/status` menampilkan
    `Runtime: OpenAI Codex`. Sesi yang ada mempertahankan id harness yang terekam, jadi gunakan
    `/new` atau `/reset` setelah mengubah `agentRuntime` jika Anda ingin `/status`
    mencerminkan pilihan PI/Codex yang baru.

    ### Peringatan doctor

    Jika Plugin `codex` bawaan diaktifkan sementara rute
    `openai-codex/*` tab ini dipilih, `openclaw doctor` memperingatkan bahwa model
    masih diselesaikan melalui PI. Biarkan config tidak berubah jika itu adalah rute
    autentikasi langganan yang dimaksud. Beralihlah ke `openai/<model>` ditambah
    `agentRuntime.id: "codex"` hanya ketika Anda menginginkan eksekusi app-server
    Codex native.

    ### Batas jendela konteks

    OpenClaw memperlakukan metadata model dan batas konteks runtime sebagai nilai yang terpisah.

    Untuk `openai-codex/gpt-5.5` melalui Codex OAuth:

    - `contextWindow` native: `1000000`
    - Batas `contextTokens` runtime default: `272000`

    Batas default yang lebih kecil memiliki karakteristik latensi dan kualitas yang lebih baik dalam praktiknya. Override dengan `contextTokens`:

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

    OpenClaw menggunakan metadata katalog Codex upstream untuk `gpt-5.5` saat metadata itu
    ada. Jika penemuan Codex live menghilangkan baris `openai-codex/gpt-5.5` sementara
    akun sudah diautentikasi, OpenClaw menyintesis baris model OAuth tersebut agar
    cron, sub-agent, dan run model default yang dikonfigurasi tidak gagal dengan
    `Unknown model`.

  </Tab>
</Tabs>

## Autentikasi app-server Codex native

Harness app-server Codex native menggunakan ref model `openai/*` ditambah
`agentRuntime.id: "codex"`, tetapi autentikasinya tetap berbasis akun. OpenClaw
memilih autentikasi dalam urutan ini:

1. Profil autentikasi OpenClaw `openai-codex` eksplisit yang terikat ke agent.
2. Akun app-server yang sudah ada, seperti sign-in ChatGPT CLI Codex lokal.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat app-server melaporkan tidak ada akun dan masih memerlukan
   autentikasi OpenAI.

Artinya, sign-in langganan ChatGPT/Codex lokal tidak diganti hanya
karena proses Gateway juga memiliki `OPENAI_API_KEY` untuk model OpenAI langsung
atau embeddings. Fallback kunci API env hanya jalur stdio lokal tanpa akun; itu
tidak dikirim ke koneksi app-server WebSocket. Saat profil Codex bergaya langganan
dipilih, OpenClaw juga mencegah `CODEX_API_KEY` dan `OPENAI_API_KEY`
masuk ke child app-server stdio yang dibuat dan mengirim kredensial terpilih
melalui RPC login app-server.

## Pembuatan gambar

Plugin `openai` bawaan mendaftarkan pembuatan gambar melalui tool `image_generate`.
Ini mendukung pembuatan gambar kunci API OpenAI dan pembuatan gambar Codex OAuth
melalui ref model `openai/gpt-image-2` yang sama.

| Kapabilitas              | Kunci API OpenAI                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref model                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | Sign-in OpenAI Codex OAuth           |
| Transport                 | OpenAI Images API                  | Backend Codex Responses              |
| Maks gambar per permintaan | 4                                  | 4                                    |
| Mode edit                 | Diaktifkan (hingga 5 gambar referensi) | Diaktifkan (hingga 5 gambar referensi) |
| Override ukuran           | Didukung, termasuk ukuran 2K/4K    | Didukung, termasuk ukuran 2K/4K      |
| Rasio aspek / resolusi    | Tidak diteruskan ke OpenAI Images API | Dipetakan ke ukuran yang didukung saat aman |

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
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

`gpt-image-2` adalah default untuk pembuatan teks-ke-gambar OpenAI dan pengeditan gambar.
`gpt-image-1.5`, `gpt-image-1`, dan `gpt-image-1-mini` tetap dapat digunakan sebagai
override model eksplisit. Gunakan `openai/gpt-image-1.5` untuk output PNG/WebP
berlatar belakang transparan; API `gpt-image-2` saat ini menolak
`background: "transparent"`.

Untuk permintaan berlatar belakang transparan, agent harus memanggil `image_generate` dengan
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` atau `"webp"`, dan
`background: "transparent"`; opsi provider `openai.background` yang lebih lama
tetap diterima. OpenClaw juga melindungi rute OpenAI publik dan
OpenAI Codex OAuth dengan menulis ulang permintaan transparan default `openai/gpt-image-2`
ke `gpt-image-1.5`; endpoint Azure dan endpoint kompatibel OpenAI kustom mempertahankan
nama deployment/model yang dikonfigurasi.

Pengaturan yang sama diekspos untuk run CLI headless:

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

Untuk instalasi Codex OAuth, pertahankan ref `openai/gpt-image-2` yang sama. Saat profil OAuth
`openai-codex` dikonfigurasi, OpenClaw menyelesaikan token akses OAuth tersimpan tersebut
dan mengirim permintaan gambar melalui backend Codex Responses. OpenClaw
tidak terlebih dahulu mencoba `OPENAI_API_KEY` atau diam-diam fallback ke kunci API untuk
permintaan itu. Konfigurasikan `models.providers.openai` secara eksplisit dengan kunci API,
URL dasar kustom, atau endpoint Azure saat Anda menginginkan rute OpenAI Images API
langsung sebagai gantinya.
Jika endpoint gambar kustom itu berada pada alamat LAN/pribadi tepercaya, tetapkan juga
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw tetap
memblokir endpoint gambar kompatibel OpenAI privat/internal kecuali opt-in ini
ada.

Buat:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Buat PNG transparan:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Edit:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Pembuatan video

Plugin `openai` bawaan mendaftarkan pembuatan video melalui tool `video_generate`.

| Kapabilitas      | Nilai                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Model default    | `openai/sora-2`                                                                   |
| Mode             | Teks-ke-video, gambar-ke-video, edit video tunggal                                |
| Input referensi  | 1 gambar atau 1 video                                                             |
| Override ukuran  | Didukung                                                                         |
| Override lain    | `aspectRatio`, `resolution`, `audio`, `watermark` diabaikan dengan peringatan tool |

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
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

## Kontribusi prompt GPT-5

OpenClaw menambahkan kontribusi prompt GPT-5 bersama untuk run keluarga GPT-5 di seluruh provider. Ini berlaku berdasarkan id model, sehingga `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, dan ref GPT-5 kompatibel lainnya menerima overlay yang sama. Model GPT-4.x yang lebih lama tidak.

Harness Codex native bawaan menggunakan perilaku GPT-5 dan overlay Heartbeat yang sama melalui instruksi developer app-server Codex, sehingga sesi `openai/gpt-5.x` yang dipaksa melalui `agentRuntime.id: "codex"` mempertahankan panduan tindak lanjut dan Heartbeat proaktif yang sama meskipun Codex memiliki sisa prompt harness.

Kontribusi GPT-5 menambahkan kontrak perilaku bertag untuk persistensi persona, keselamatan eksekusi, disiplin tool, bentuk output, pemeriksaan penyelesaian, dan verifikasi. Perilaku balasan khusus channel dan pesan senyap tetap berada dalam prompt sistem OpenClaw bersama dan kebijakan pengiriman keluar. Panduan GPT-5 selalu diaktifkan untuk model yang cocok. Lapisan gaya interaksi ramah terpisah dan dapat dikonfigurasi.

| Nilai                  | Efek                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (default) | Aktifkan lapisan gaya interaksi ramah |
| `"on"`                 | Alias untuk `"friendly"`                      |
| `"off"`                | Nonaktifkan hanya lapisan gaya ramah       |

<Tabs>
  <Tab title="Config">
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
Nilai tidak peka huruf besar-kecil pada runtime, jadi `"Off"` dan `"off"` sama-sama menonaktifkan lapisan gaya ramah.
</Tip>

<Note>
`plugins.entries.openai.config.personality` legacy masih dibaca sebagai fallback kompatibilitas saat pengaturan `agents.defaults.promptOverlays.gpt5.personality` bersama belum ditetapkan.
</Note>

## Suara dan ucapan

<AccordionGroup>
  <Accordion title="Sintesis ucapan (TTS)">
    Plugin `openai` bawaan mendaftarkan sintesis ucapan untuk surface `messages.tts`.

    | Pengaturan | Jalur config | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Suara | `messages.tts.providers.openai.voice` | `coral` |
    | Kecepatan | `messages.tts.providers.openai.speed` | (belum diatur) |
    | Instruksi | `messages.tts.providers.openai.instructions` | (belum diatur, hanya `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` untuk catatan suara, `mp3` untuk file |
    | Kunci API | `messages.tts.providers.openai.apiKey` | Fallback ke `OPENAI_API_KEY` |
    | URL dasar | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Model yang tersedia: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Suara yang tersedia: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

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
    Tetapkan `OPENAI_TTS_BASE_URL` untuk meng-override URL dasar TTS tanpa memengaruhi endpoint API chat.
    </Note>

  </Accordion>

  <Accordion title="Ucapan-ke-teks">
    Plugin `openai` bawaan mendaftarkan ucapan-ke-teks batch melalui
    surface transkripsi pemahaman media OpenClaw.

    - Model default: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Jalur input: upload file audio multipart
    - Didukung oleh OpenClaw di mana pun transkripsi audio masuk menggunakan
      `tools.media.audio`, termasuk segmen channel suara Discord dan lampiran
      audio channel

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

    Petunjuk bahasa dan prompt diteruskan ke OpenAI saat disediakan oleh
    konfigurasi media audio bersama atau permintaan transkripsi per panggilan.

  </Accordion>

  <Accordion title="Transkripsi realtime">
    Plugin `openai` bawaan mendaftarkan transkripsi realtime untuk Plugin Voice Call.

    | Pengaturan | Jalur konfigurasi | Bawaan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Bahasa | `...openai.language` | (belum diatur) |
    | Prompt | `...openai.prompt` | (belum diatur) |
    | Durasi hening | `...openai.silenceDurationMs` | `800` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Kunci API | `...openai.apiKey` | Menggunakan fallback ke `OPENAI_API_KEY` |

    <Note>
    Menggunakan koneksi WebSocket ke `wss://api.openai.com/v1/realtime` dengan audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Penyedia streaming ini digunakan untuk jalur transkripsi realtime Voice Call; suara Discord saat ini merekam segmen pendek dan menggunakan jalur transkripsi batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Suara realtime">
    Plugin `openai` bawaan mendaftarkan suara realtime untuk Plugin Voice Call.

    | Pengaturan | Jalur konfigurasi | Bawaan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Suara | `...openai.voice` | `alloy` |
    | Suhu | `...openai.temperature` | `0.8` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Durasi hening | `...openai.silenceDurationMs` | `500` |
    | Kunci API | `...openai.apiKey` | Menggunakan fallback ke `OPENAI_API_KEY` |

    <Note>
    Mendukung Azure OpenAI melalui kunci konfigurasi `azureEndpoint` dan `azureDeployment` untuk bridge realtime backend. Mendukung pemanggilan alat dua arah. Menggunakan format audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk menggunakan sesi realtime browser OpenAI dengan rahasia klien sementara
    yang dibuat oleh Gateway dan pertukaran SDP WebRTC browser langsung terhadap
    OpenAI Realtime API. Verifikasi live oleh maintainer tersedia dengan
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    leg OpenAI membuat rahasia klien di Node, menghasilkan tawaran SDP browser
    dengan media mikrofon palsu, mempostingnya ke OpenAI, dan menerapkan jawaban SDP
    tanpa mencatat rahasia.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Penyedia `openai` bawaan dapat menargetkan resource Azure OpenAI untuk pembuatan
gambar dengan mengganti URL dasar. Pada jalur pembuatan gambar, OpenClaw
mendeteksi hostname Azure pada `models.providers.openai.baseUrl` dan beralih ke
bentuk permintaan Azure secara otomatis.

<Note>
Suara realtime menggunakan jalur konfigurasi terpisah
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
dan tidak terpengaruh oleh `models.providers.openai.baseUrl`. Lihat accordion
**Suara realtime** di bawah [Suara dan ucapan](#voice-and-speech) untuk pengaturan
Azure-nya.
</Note>

Gunakan Azure OpenAI saat:

- Anda sudah memiliki langganan Azure OpenAI, kuota, atau perjanjian enterprise
- Anda memerlukan residensi data regional atau kontrol kepatuhan yang disediakan Azure
- Anda ingin menjaga lalu lintas tetap di dalam tenancy Azure yang sudah ada

### Konfigurasi

Untuk pembuatan gambar Azure melalui penyedia `openai` bawaan, arahkan
`models.providers.openai.baseUrl` ke resource Azure Anda dan atur `apiKey` ke
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

- Mengirim header `api-key`, bukan `Authorization: Bearer`
- Menggunakan path berbasis deployment (`/openai/deployments/{deployment}/...`)
- Menambahkan `?api-version=...` ke setiap permintaan
- Menggunakan batas waktu permintaan bawaan 600 detik untuk panggilan pembuatan gambar Azure.
  Nilai `timeoutMs` per panggilan tetap mengganti bawaan ini.

URL dasar lainnya (OpenAI publik, proxy kompatibel OpenAI) tetap menggunakan bentuk
permintaan gambar OpenAI standar.

<Note>
Routing Azure untuk jalur pembuatan gambar penyedia `openai` memerlukan
OpenClaw 2026.4.22 atau yang lebih baru. Versi lebih lama memperlakukan
`openai.baseUrl` kustom apa pun seperti endpoint OpenAI publik dan akan gagal pada
deployment gambar Azure.
</Note>

### Versi API

Atur `AZURE_OPENAI_API_VERSION` untuk menyematkan versi pratinjau atau GA Azure tertentu
untuk jalur pembuatan gambar Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Bawaannya adalah `2024-12-01-preview` saat variabel tidak diatur.

### Nama model adalah nama deployment

Azure OpenAI mengikat model ke deployment. Untuk permintaan pembuatan gambar Azure
yang dirutekan melalui penyedia `openai` bawaan, kolom `model` di OpenClaw
harus berupa **nama deployment Azure** yang Anda konfigurasi di portal Azure, bukan
id model OpenAI publik.

Jika Anda membuat deployment bernama `gpt-image-2-prod` yang melayani `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aturan nama deployment yang sama berlaku untuk panggilan pembuatan gambar yang dirutekan melalui
penyedia `openai` bawaan.

### Ketersediaan regional

Pembuatan gambar Azure saat ini hanya tersedia di sebagian region
(misalnya `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Periksa daftar region Microsoft terbaru sebelum membuat
deployment, dan pastikan model tertentu ditawarkan di region Anda.

### Perbedaan parameter

Azure OpenAI dan OpenAI publik tidak selalu menerima parameter gambar yang sama.
Azure dapat menolak opsi yang diizinkan OpenAI publik (misalnya nilai
`background` tertentu pada `gpt-image-2`) atau mengeksposnya hanya pada versi model
tertentu. Perbedaan ini berasal dari Azure dan model yang mendasarinya, bukan
OpenClaw. Jika permintaan Azure gagal dengan kesalahan validasi, periksa
set parameter yang didukung oleh deployment dan versi API spesifik Anda di
portal Azure.

<Note>
Azure OpenAI menggunakan transport native dan perilaku kompatibilitas tetapi tidak menerima
header atribusi tersembunyi OpenClaw — lihat accordion **Rute native vs kompatibel OpenAI**
di bawah [Konfigurasi lanjutan](#advanced-configuration).

Untuk lalu lintas chat atau Responses di Azure (di luar pembuatan gambar), gunakan
alur onboarding atau konfigurasi penyedia Azure khusus — `openai.baseUrl` saja
tidak memakai bentuk API/auth Azure. Penyedia
`azure-openai-responses/*` terpisah tersedia; lihat
accordion Compaction sisi server di bawah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw menggunakan WebSocket terlebih dahulu dengan fallback SSE (`"auto"`) untuk `openai/*` dan `openai-codex/*`.

    Dalam mode `"auto"`, OpenClaw:
    - Mencoba ulang satu kegagalan WebSocket awal sebelum fallback ke SSE
    - Setelah kegagalan, menandai WebSocket sebagai terdegradasi selama ~60 detik dan menggunakan SSE selama masa jeda
    - Melampirkan header identitas sesi dan turn yang stabil untuk percobaan ulang dan koneksi ulang
    - Menormalkan penghitung penggunaan (`input_tokens` / `prompt_tokens`) di seluruh varian transport

    | Nilai | Perilaku |
    |-------|----------|
    | `"auto"` (bawaan) | WebSocket terlebih dahulu, fallback SSE |
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

    Dokumentasi OpenAI terkait:
    - [Realtime API dengan WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respons Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Pemanasan WebSocket">
    OpenClaw mengaktifkan pemanasan WebSocket secara bawaan untuk `openai/*` dan `openai-codex/*` guna mengurangi latensi turn pertama.

    ```json5
    // Disable warm-up
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
    Override sesi mengalahkan konfigurasi. Menghapus override sesi di UI Sessions mengembalikan sesi ke bawaan yang dikonfigurasi.
    </Note>

  </Accordion>

  <Accordion title="Pemrosesan prioritas (service_tier)">
    API OpenAI mengekspos pemrosesan prioritas melalui `service_tier`. Atur per model di OpenClaw:

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
    `serviceTier` hanya diteruskan ke endpoint OpenAI native (`api.openai.com`) dan endpoint Codex native (`chatgpt.com/backend-api`). Jika Anda merutekan salah satu penyedia melalui proxy, OpenClaw membiarkan `service_tier` tidak berubah.
    </Warning>

  </Accordion>

  <Accordion title="Compaction sisi server (Responses API)">
    Untuk model OpenAI Responses langsung (`openai/*` pada `api.openai.com`), wrapper stream Pi-harness Plugin OpenAI mengaktifkan otomatis Compaction sisi server:

    - Memaksa `store: true` (kecuali compat model menetapkan `supportsStore: false`)
    - Menyisipkan `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` bawaan: 70% dari `contextWindow` (atau `80000` saat tidak tersedia)

    Ini berlaku untuk jalur Pi harness bawaan dan hook penyedia OpenAI yang digunakan oleh run tertanam. Harness app-server Codex native mengelola konteksnya sendiri melalui Codex dan dikonfigurasi secara terpisah dengan `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Aktifkan secara eksplisit">
        Berguna untuk endpoint kompatibel seperti Azure OpenAI Responses:

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
      <Tab title="Ambang batas kustom">
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
    `responsesServerCompaction` hanya mengontrol injeksi `context_management`. Model OpenAI Responses langsung tetap memaksa `store: true` kecuali compat menetapkan `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT strict-agentic">
    Untuk proses keluarga GPT-5 pada `openai/*`, OpenClaw dapat menggunakan kontrak eksekusi tertanam yang lebih ketat:

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
    - Tidak lagi memperlakukan giliran yang hanya berupa rencana sebagai progres berhasil ketika tindakan alat tersedia
    - Mencoba ulang giliran dengan arahan untuk bertindak sekarang
    - Mengaktifkan otomatis `update_plan` untuk pekerjaan yang substansial
    - Menampilkan status terblokir eksplisit jika model terus merencanakan tanpa bertindak

    <Note>
    Hanya berlaku untuk proses keluarga OpenAI dan Codex GPT-5. Penyedia lain dan keluarga model yang lebih lama tetap memakai perilaku default.
    </Note>

  </Accordion>

  <Accordion title="Rute native vs kompatibel OpenAI">
    OpenClaw memperlakukan endpoint OpenAI langsung, Codex, dan Azure OpenAI secara berbeda dari proxy `/v1` kompatibel OpenAI generik:

    **Rute native** (`openai/*`, Azure OpenAI):
    - Mempertahankan `reasoning: { effort: "none" }` hanya untuk model yang mendukung upaya `none` OpenAI
    - Menghilangkan penalaran yang dinonaktifkan untuk model atau proxy yang menolak `reasoning.effort: "none"`
    - Menetapkan skema alat secara default ke mode ketat
    - Melampirkan header atribusi tersembunyi hanya pada host native yang terverifikasi
    - Mempertahankan pembentukan permintaan khusus OpenAI (`service_tier`, `store`, reasoning-compat, petunjuk prompt-cache)

    **Rute proxy/kompatibel:**
    - Menggunakan perilaku compat yang lebih longgar
    - Menghapus `store` Completions dari payload `openai-completions` non-native
    - Menerima JSON pass-through `params.extra_body`/`params.extraBody` lanjutan untuk proxy Completions kompatibel OpenAI
    - Menerima `params.chat_template_kwargs` untuk proxy Completions kompatibel OpenAI seperti vLLM
    - Tidak memaksa skema alat ketat atau header khusus native

    Azure OpenAI menggunakan transport native dan perilaku compat tetapi tidak menerima header atribusi tersembunyi.

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
