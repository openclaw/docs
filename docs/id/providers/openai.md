---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda menginginkan autentikasi langganan Codex alih-alih kunci API
    - Anda memerlukan perilaku eksekusi agen GPT-5 yang lebih ketat
summary: Gunakan OpenAI melalui kunci API atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-10T19:50:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5022874c9517e670b70ba90fb400f99f850746c341cb6e967c2abc96d8255548
    source_path: providers/openai.md
    workflow: 16
---

OpenAI menyediakan API pengembang untuk model GPT, dan Codex juga tersedia sebagai agen coding
berbasis paket ChatGPT melalui klien Codex milik OpenAI. OpenClaw menjaga
permukaan tersebut tetap terpisah agar konfigurasi tetap dapat diprediksi.

OpenClaw menggunakan `openai/*` sebagai rute model OpenAI kanonis. Giliran agen
tersemat pada model OpenAI berjalan melalui runtime app-server Codex native secara
default; autentikasi kunci API OpenAI langsung tetap tersedia untuk permukaan
OpenAI non-agen seperti gambar, embedding, ucapan, dan realtime.

- **Model agen** - model `openai/*` melalui runtime Codex; masuk dengan
  autentikasi `openai-codex` untuk penggunaan langganan ChatGPT/Codex, atau konfigurasikan
  profil kunci API `openai-codex` saat Anda memang menginginkan autentikasi kunci API.
- **API OpenAI non-agen** - akses OpenAI Platform langsung dengan penagihan
  berbasis penggunaan melalui `OPENAI_API_KEY` atau onboarding kunci API OpenAI.
- **Konfigurasi lama** - referensi model `openai-codex/*` diperbaiki oleh
  `openclaw doctor --fix` menjadi `openai/*` plus runtime Codex.

OpenAI secara eksplisit mendukung penggunaan OAuth langganan dalam alat eksternal dan alur kerja seperti OpenClaw.

Provider, model, runtime, dan channel adalah lapisan yang terpisah. Jika label-label itu
mulai tercampur, baca [Runtime agen](/id/concepts/agent-runtimes) sebelum
mengubah konfigurasi.

## Pilihan cepat

| Tujuan                                                 | Gunakan                                                     | Catatan                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Langganan ChatGPT/Codex dengan runtime Codex native    | `openai/gpt-5.5`                                            | Penyiapan agen OpenAI default. Masuk dengan autentikasi `openai-codex`. |
| Penagihan kunci API langsung untuk model agen          | `openai/gpt-5.5` plus profil kunci API `openai-codex`       | Gunakan `auth.order.openai-codex` untuk memprioritaskan profil itu.     |
| Penagihan kunci API langsung melalui PI eksplisit      | `openai/gpt-5.5` plus runtime provider/model `pi`           | Pilih profil kunci API `openai` normal.                                 |
| Alias API ChatGPT Instant terbaru                      | `openai/chat-latest`                                        | Hanya kunci API langsung. Alias bergerak untuk eksperimen, bukan default. |
| Autentikasi langganan ChatGPT/Codex melalui PI eksplisit | `openai/gpt-5.5` plus runtime provider/model `pi`         | Pilih profil autentikasi `openai-codex` untuk rute kompatibilitas.      |
| Pembuatan atau pengeditan gambar                       | `openai/gpt-image-2`                                        | Berfungsi dengan `OPENAI_API_KEY` atau OAuth OpenAI Codex.              |
| Gambar berlatar belakang transparan                    | `openai/gpt-image-1.5`                                      | Gunakan `outputFormat=png` atau `webp` dan `openai.background=transparent`. |

## Peta penamaan

Nama-namanya mirip tetapi tidak dapat dipertukarkan:

| Nama yang Anda lihat                    | Lapisan             | Makna                                                                                             |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefiks provider    | Rute model OpenAI kanonis; giliran agen menggunakan runtime Codex.                                |
| `openai-codex`                          | Prefiks autentikasi/profil | Provider profil autentikasi OAuth/langganan OpenAI Codex.                                 |
| Plugin `codex`                          | Plugin              | Plugin bawaan OpenClaw yang menyediakan runtime app-server Codex native dan kontrol chat `/codex`. |
| provider/model `agentRuntime.id: codex` | Runtime agen        | Memaksa harness app-server Codex native untuk giliran tersemat yang cocok.                        |
| `/codex ...`                            | Kumpulan perintah chat | Mengikat/mengontrol thread app-server Codex dari sebuah percakapan.                            |
| `runtime: "acp", agentId: "codex"`      | Rute sesi ACP       | Jalur fallback eksplisit yang menjalankan Codex melalui ACP/acpx.                                 |

Ini berarti konfigurasi dapat secara sengaja berisi referensi model `openai/*` dan
profil autentikasi `openai-codex` sekaligus. `openclaw doctor --fix` menulis ulang
referensi model lama `openai-codex/*` ke rute model OpenAI kanonis.

<Note>
GPT-5.5 tersedia melalui akses kunci API OpenAI Platform langsung maupun
rute langganan/OAuth. Untuk langganan ChatGPT/Codex plus eksekusi Codex
native, gunakan `openai/gpt-5.5`; konfigurasi runtime yang tidak disetel sekarang memilih harness Codex
untuk giliran agen OpenAI. Gunakan profil kunci API OpenAI hanya saat Anda menginginkan
autentikasi kunci API langsung untuk model agen OpenAI.
</Note>

<Note>
Giliran model agen OpenAI memerlukan Plugin app-server Codex bawaan. Konfigurasi
runtime PI eksplisit tetap tersedia sebagai rute kompatibilitas opt-in. Saat PI
dipilih secara eksplisit dengan profil autentikasi `openai-codex`, OpenClaw menjaga
referensi model publik sebagai `openai/*` dan merutekan PI secara internal melalui transport
autentikasi Codex lama. Jalankan `openclaw doctor --fix` untuk memperbaiki referensi model
`openai-codex/*` yang usang atau pin sesi PI lama yang tidak berasal dari
konfigurasi runtime eksplisit.
</Note>

## Cakupan fitur OpenClaw

| Kemampuan OpenAI        | Permukaan OpenClaw                                                               | Status                                                 |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses        | Provider model `openai/<model>`                                                  | Ya                                                     |
| Model langganan Codex   | `openai/<model>` dengan OAuth `openai-codex`                                     | Ya                                                     |
| Referensi model Codex lama | `openai-codex/<model>`                                                        | Diperbaiki oleh doctor menjadi `openai/<model>`        |
| Harness app-server Codex | `openai/<model>` dengan runtime dihilangkan atau provider/model `agentRuntime.id: codex` | Ya                                            |
| Pencarian web sisi server | Alat OpenAI Responses native                                                   | Ya, saat pencarian web diaktifkan dan tidak ada provider yang dipin |
| Gambar                  | `image_generate`                                                                 | Ya                                                     |
| Video                   | `video_generate`                                                                 | Ya                                                     |
| Teks-ke-ucapan          | `messages.tts.provider: "openai"` / `tts`                                        | Ya                                                     |
| Ucapan-ke-teks batch    | `tools.media.audio` / pemahaman media                                            | Ya                                                     |
| Ucapan-ke-teks streaming | Voice Call `streaming.provider: "openai"`                                      | Ya                                                     |
| Suara realtime          | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Ya                                                     |
| Embedding               | provider embedding memori                                                        | Ya                                                     |

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

Untuk endpoint yang kompatibel dengan OpenAI yang memerlukan label embedding asimetris, setel
`queryInputType` dan `documentInputType` di bawah `memorySearch`. OpenClaw meneruskan
itu sebagai field permintaan `input_type` khusus provider: embedding kueri menggunakan
`queryInputType`; potongan memori terindeks dan pengindeksan batch menggunakan
`documentInputType`. Lihat [Referensi konfigurasi memori](/id/reference/memory-config#provider-specific-config) untuk contoh lengkap.

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah penyiapannya.

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

        Atau berikan kunci secara langsung:

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

    | Referensi model       | Konfigurasi runtime        | Rute                        | Autentikasi      |
    | --------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | dihilangkan / provider/model `agentRuntime.id: "codex"` | Harness app-server Codex | profil `openai-codex` |
    | `openai/gpt-5.4-mini` | dihilangkan / provider/model `agentRuntime.id: "codex"` | Harness app-server Codex | profil `openai-codex` |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "pi"`              | Runtime tersemat PI      | profil `openai` atau profil `openai-codex` yang dipilih |

    <Note>
    Model agen `openai/*` menggunakan harness app-server Codex. Untuk menggunakan autentikasi
    kunci API untuk model agen, buat profil kunci API `openai-codex` dan urutkan
    dengan `auth.order.openai-codex`; `OPENAI_API_KEY` tetap menjadi fallback langsung
    untuk permukaan API OpenAI non-agen.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Untuk mencoba model Instant ChatGPT saat ini dari API OpenAI, setel model
    ke `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` adalah alias bergerak. OpenAI mendokumentasikannya sebagai model Instant terbaru
    yang digunakan di ChatGPT dan merekomendasikan `gpt-5.5` untuk penggunaan API produksi, jadi
    pertahankan `openai/gpt-5.5` sebagai default stabil kecuali Anda secara eksplisit menginginkan
    perilaku alias tersebut. Alias ini saat ini hanya menerima verbositas teks `medium`, jadi
    OpenClaw menormalkan override verbositas teks OpenAI yang tidak kompatibel untuk model ini.

    <Warning>
    OpenClaw **tidak** mengekspos `openai/gpt-5.3-codex-spark`. Permintaan API OpenAI live menolak model itu, dan katalog Codex saat ini juga tidak mengeksposnya.
    </Warning>

  </Tab>

  <Tab title="Langganan Codex">
    **Terbaik untuk:** menggunakan langganan ChatGPT/Codex Anda dengan eksekusi app-server Codex native alih-alih kunci API terpisah. Cloud Codex memerlukan masuk ChatGPT.

    <Steps>
      <Step title="Jalankan OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Atau jalankan OAuth secara langsung:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Untuk penyiapan headless atau yang bermasalah dengan callback, tambahkan `--device-code` untuk masuk dengan alur kode perangkat ChatGPT alih-alih callback browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Gunakan rute model OpenAI kanonis">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Tidak diperlukan konfigurasi runtime untuk jalur default. Giliran agen OpenAI
        memilih runtime server aplikasi Codex native secara otomatis, dan OpenClaw
        memasang atau memperbaiki Plugin Codex bawaan saat rute ini dipilih.
      </Step>
      <Step title="Verifikasi autentikasi Codex tersedia">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Setelah gateway berjalan, kirim `/codex status` atau `/codex models`
        dalam chat untuk memverifikasi runtime server aplikasi native.
      </Step>
    </Steps>

    ### Ringkasan rute

    | Ref model | Konfig runtime | Rute | Autentikasi |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | dihilangkan / provider/model `agentRuntime.id: "codex"` | Harness server aplikasi Codex native | Masuk Codex atau profil `openai-codex` yang dipilih |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | Runtime tertanam Pi dengan transport autentikasi Codex internal | Profil `openai-codex` yang dipilih |
    | `openai-codex/gpt-5.5` | diperbaiki oleh doctor | Rute lama ditulis ulang menjadi `openai/gpt-5.5` | Profil `openai-codex` yang ada |

    <Warning>
    Jangan konfigurasikan ref model `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*`, atau
    `openai-codex/gpt-5.3*` yang lebih lama. Akun OAuth ChatGPT/Codex sekarang menolak
    model tersebut. Gunakan `openai/gpt-5.5`; giliran agen OpenAI sekarang memilih runtime
    Codex secara default.
    </Warning>

    <Note>
    Tetap gunakan id provider `openai-codex` untuk perintah autentikasi/profil. Prefiks model
    `openai-codex/*` adalah konfig lama yang diperbaiki oleh doctor. Untuk penyiapan umum
    berbasis langganan plus runtime native, masuk dengan `openai-codex`
    tetapi pertahankan ref model sebagai `openai/gpt-5.5`.
    </Note>

    ### Contoh konfig

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    <Note>
    Onboarding tidak lagi mengimpor materi OAuth dari `~/.codex`. Masuk dengan OAuth browser (default) atau alur kode perangkat di atas — OpenClaw mengelola kredensial yang dihasilkan di penyimpanan autentikasi agennya sendiri.
    </Note>

    ### Periksa dan pulihkan routing OAuth Codex

    Gunakan perintah ini untuk melihat model, runtime, dan rute autentikasi yang digunakan
    agen default Anda:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Untuk agen tertentu, tambahkan `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Jika konfig yang lebih lama masih memiliki `openai-codex/gpt-*` atau pin sesi OpenAI Pi
    usang tanpa konfig runtime eksplisit, perbaiki:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Jika `models auth list --provider openai-codex` tidak menampilkan profil yang dapat digunakan, masuk
    lagi:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` tetap menjadi id provider autentikasi/profil. `openai/*` adalah
    rute model untuk giliran agen OpenAI melalui Codex.

    ### Indikator status

    Chat `/status` menampilkan runtime model mana yang aktif untuk sesi saat ini.
    Harness server aplikasi Codex bawaan muncul sebagai `Runtime: OpenAI Codex` untuk
    giliran model agen OpenAI. Pin sesi Pi usang diperbaiki ke Codex kecuali
    konfig secara eksplisit menyematkan Pi.

    ### Peringatan doctor

    Jika rute `openai-codex/*` atau pin OpenAI Pi usang tetap ada dalam konfig atau
    status sesi, `openclaw doctor --fix` menulis ulang semuanya menjadi `openai/*` dengan
    runtime Codex kecuali Pi dikonfigurasi secara eksplisit.

    ### Batas jendela konteks

    OpenClaw memperlakukan metadata model dan batas konteks runtime sebagai nilai terpisah.

    Untuk `openai/gpt-5.5` melalui katalog OAuth Codex:

    - `contextWindow` native: `1000000`
    - Batas `contextTokens` runtime default: `272000`

    Batas default yang lebih kecil memiliki karakteristik latensi dan kualitas yang lebih baik dalam praktik. Timpa dengan `contextTokens`:

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
    tersedia. Jika penemuan Codex langsung menghilangkan baris `gpt-5.5` sementara
    akun sudah diautentikasi, OpenClaw menyintesis baris model OAuth tersebut agar
    cron, sub-agent, dan eksekusi default-model terkonfigurasi tidak gagal dengan
    `Unknown model`.

  </Tab>
</Tabs>

## Autentikasi app-server Codex native

Harness app-server Codex native menggunakan ref model `openai/*` plus konfigurasi
runtime yang dihilangkan atau provider/model `agentRuntime.id: "codex"`, tetapi autentikasinya tetap
berbasis akun. OpenClaw
memilih autentikasi dalam urutan ini:

1. Profil autentikasi OpenClaw `openai-codex` eksplisit yang terikat ke agen.
2. Akun app-server yang sudah ada, seperti masuk ChatGPT CLI Codex lokal.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat app-server melaporkan tidak ada akun dan masih memerlukan
   autentikasi OpenAI.

Itu berarti masuk langganan ChatGPT/Codex lokal tidak diganti hanya karena proses
gateway juga memiliki `OPENAI_API_KEY` untuk model OpenAI langsung
atau embeddings. Fallback kunci API env hanya jalur stdio lokal tanpa akun; itu
tidak dikirim ke koneksi app-server WebSocket. Saat profil Codex bergaya langganan
dipilih, OpenClaw juga menjaga `CODEX_API_KEY` dan `OPENAI_API_KEY`
agar tidak masuk ke child app-server stdio yang dibuat dan mengirim kredensial yang dipilih
melalui RPC login app-server.

## Pembuatan gambar

Plugin `openai` bawaan mendaftarkan pembuatan gambar melalui alat `image_generate`.
Ini mendukung pembuatan gambar kunci API OpenAI dan pembuatan gambar OAuth Codex
melalui ref model `openai/gpt-image-2` yang sama.

| Kapabilitas              | Kunci API OpenAI                    | OAuth Codex                          |
| ------------------------ | ----------------------------------- | ------------------------------------ |
| Ref model                | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| Autentikasi              | `OPENAI_API_KEY`                    | Masuk OAuth OpenAI Codex             |
| Transport                | API OpenAI Images                   | Backend Codex Responses              |
| Gambar maks per request  | 4                                   | 4                                    |
| Mode edit                | Diaktifkan (hingga 5 gambar referensi) | Diaktifkan (hingga 5 gambar referensi) |
| Override ukuran          | Didukung, termasuk ukuran 2K/4K     | Didukung, termasuk ukuran 2K/4K      |
| Rasio aspek / resolusi   | Tidak diteruskan ke API OpenAI Images | Dipetakan ke ukuran yang didukung saat aman |

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
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter alat bersama, pemilihan provider, dan perilaku failover.
</Note>

`gpt-image-2` adalah default untuk pembuatan teks-ke-gambar OpenAI dan pengeditan
gambar. `gpt-image-1.5`, `gpt-image-1`, dan `gpt-image-1-mini` tetap dapat digunakan sebagai
override model eksplisit. Gunakan `openai/gpt-image-1.5` untuk keluaran PNG/WebP
latar belakang transparan; API `gpt-image-2` saat ini menolak
`background: "transparent"`.

Untuk request latar belakang transparan, agen harus memanggil `image_generate` dengan
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` atau `"webp"`, dan
`background: "transparent"`; opsi provider `openai.background` yang lebih lama
masih diterima. OpenClaw juga melindungi rute publik OpenAI dan
OAuth OpenAI Codex dengan menulis ulang request transparan default `openai/gpt-image-2`
ke `gpt-image-1.5`; endpoint Azure dan endpoint kustom yang kompatibel dengan OpenAI mempertahankan
nama deployment/model yang dikonfigurasi.

Pengaturan yang sama tersedia untuk eksekusi CLI headless:

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

Untuk instalasi OAuth Codex, pertahankan ref `openai/gpt-image-2` yang sama. Saat profil OAuth
`openai-codex` dikonfigurasi, OpenClaw menyelesaikan token akses OAuth yang tersimpan tersebut
dan mengirim request gambar melalui backend Codex Responses. Ia
tidak mencoba `OPENAI_API_KEY` terlebih dahulu atau diam-diam fallback ke kunci API untuk request
tersebut. Konfigurasikan `models.providers.openai` secara eksplisit dengan kunci API,
URL dasar kustom, atau endpoint Azure saat Anda menginginkan rute API OpenAI Images
langsung sebagai gantinya.
Jika endpoint gambar kustom tersebut berada di alamat LAN/pribadi tepercaya, setel juga
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw tetap
memblokir endpoint gambar privat/internal yang kompatibel dengan OpenAI kecuali opt-in ini
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

Plugin `openai` bawaan mendaftarkan pembuatan video melalui alat `video_generate`.

| Kapabilitas       | Nilai                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| Model default     | `openai/sora-2`                                                                   |
| Mode              | Teks-ke-video, gambar-ke-video, edit satu video                                   |
| Input referensi   | 1 gambar atau 1 video                                                             |
| Override ukuran   | Didukung                                                                         |
| Override lainnya  | `aspectRatio`, `resolution`, `audio`, `watermark` diabaikan dengan peringatan alat |

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
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan provider, dan perilaku failover.
</Note>

## Kontribusi prompt GPT-5

OpenClaw menambahkan kontribusi prompt GPT-5 bersama untuk eksekusi keluarga GPT-5 di seluruh provider. Ini diterapkan berdasarkan id model, jadi `openai/gpt-5.5`, ref pra-perbaikan legacy seperti `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, dan ref GPT-5 kompatibel lainnya menerima overlay yang sama. Model GPT-4.x yang lebih lama tidak.

Harness Codex native bawaan menggunakan perilaku GPT-5 dan overlay Heartbeat yang sama melalui instruksi developer app-server Codex, sehingga sesi `openai/gpt-5.x` yang dirutekan melalui Codex mempertahankan panduan tindak lanjut dan Heartbeat proaktif yang sama meskipun Codex memiliki sisa prompt harness.

Kontribusi GPT-5 menambahkan kontrak perilaku bertag untuk persistensi persona, keamanan eksekusi, disiplin tool, bentuk keluaran, pemeriksaan penyelesaian, dan verifikasi. Perilaku balasan khusus kanal dan pesan senyap tetap berada di prompt sistem OpenClaw bersama dan kebijakan pengiriman keluar. Panduan GPT-5 selalu diaktifkan untuk model yang cocok. Lapisan gaya interaksi ramah terpisah dan dapat dikonfigurasi.

| Nilai                  | Efek                                        |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (default) | Aktifkan lapisan gaya interaksi ramah       |
| `"on"`                 | Alias untuk `"friendly"`                    |
| `"off"`                | Nonaktifkan hanya lapisan gaya ramah        |

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
`plugins.entries.openai.config.personality` lama masih dibaca sebagai fallback kompatibilitas ketika pengaturan bersama `agents.defaults.promptOverlays.gpt5.personality` tidak disetel.
</Note>

## Suara dan ucapan

<AccordionGroup>
  <Accordion title="Sintesis ucapan (TTS)">
    Plugin `openai` yang dibundel mendaftarkan sintesis ucapan untuk permukaan `messages.tts`.

    | Pengaturan | Path konfigurasi | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Suara | `messages.tts.providers.openai.voice` | `coral` |
    | Kecepatan | `messages.tts.providers.openai.speed` | (tidak disetel) |
    | Instruksi | `messages.tts.providers.openai.instructions` | (tidak disetel, hanya `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` untuk catatan suara, `mp3` untuk file |
    | Kunci API | `messages.tts.providers.openai.apiKey` | Beralih ke `OPENAI_API_KEY` |
    | URL dasar | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Body ekstra | `messages.tts.providers.openai.extraBody` / `extra_body` | (tidak disetel) |

    Model yang tersedia: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Suara yang tersedia: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` digabungkan ke JSON permintaan `/audio/speech` setelah field yang dihasilkan OpenClaw, jadi gunakan ini untuk endpoint yang kompatibel dengan OpenAI yang memerlukan kunci tambahan seperti `lang`. Kunci prototipe diabaikan.

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
    Setel `OPENAI_TTS_BASE_URL` untuk menimpa URL dasar TTS tanpa memengaruhi endpoint API chat. OpenAI TTS tetap dikonfigurasi melalui kunci API; untuk talk-back langsung yang hanya OAuth, gunakan path suara Realtime alih-alih ucapan STT -> TTS mode agen.
    </Note>

  </Accordion>

  <Accordion title="Ucapan ke teks">
    Plugin `openai` yang dibundel mendaftarkan ucapan-ke-teks batch melalui
    permukaan transkripsi pemahaman media OpenClaw.

    - Model default: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Path input: unggahan file audio multipart
    - Didukung oleh OpenClaw di mana pun transkripsi audio masuk menggunakan
      `tools.media.audio`, termasuk segmen kanal suara Discord dan lampiran
      audio kanal

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

    Petunjuk bahasa dan prompt diteruskan ke OpenAI ketika disediakan oleh
    konfigurasi media audio bersama atau permintaan transkripsi per panggilan.

  </Accordion>

  <Accordion title="Transkripsi Realtime">
    Plugin `openai` yang dibundel mendaftarkan transkripsi Realtime untuk plugin Voice Call.

    | Pengaturan | Path konfigurasi | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Bahasa | `...openai.language` | (tidak disetel) |
    | Prompt | `...openai.prompt` | (tidak disetel) |
    | Durasi senyap | `...openai.silenceDurationMs` | `800` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY`, atau OAuth `openai-codex` | Kunci API terhubung langsung; OAuth mencetak rahasia klien transkripsi Realtime |

    <Note>
    Menggunakan koneksi WebSocket ke `wss://api.openai.com/v1/realtime` dengan audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ketika hanya OAuth `openai-codex` yang dikonfigurasi, Gateway mencetak rahasia klien transkripsi Realtime ephemeral sebelum membuka WebSocket. Provider streaming ini untuk path transkripsi realtime Voice Call; suara Discord saat ini merekam segmen pendek dan menggunakan path transkripsi batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Suara Realtime">
    Plugin `openai` yang dibundel mendaftarkan suara realtime untuk plugin Voice Call.

    | Pengaturan | Path konfigurasi | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Suara | `...openai.voice` | `alloy` |
    | Temperatur (jembatan deployment Azure) | `...openai.temperature` | `0.8` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Durasi senyap | `...openai.silenceDurationMs` | `500` |
    | Padding prefiks | `...openai.prefixPaddingMs` | `300` |
    | Upaya penalaran | `...openai.reasoningEffort` | (tidak disetel) |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY`, atau OAuth `openai-codex` | Browser Talk dan jembatan backend non-Azure dapat menggunakan OAuth Codex |

    Suara Realtime bawaan yang tersedia untuk `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI merekomendasikan `marin` dan `cedar` untuk kualitas Realtime terbaik. Ini
    adalah set terpisah dari suara Text-to-speech di atas; jangan menganggap suara TTS
    seperti `fable`, `nova`, atau `onyx` valid untuk sesi Realtime.

    <Note>
    Jembatan realtime backend OpenAI menggunakan bentuk sesi GA Realtime WebSocket, yang tidak menerima `session.temperature`. Deployment Azure OpenAI tetap tersedia melalui `azureEndpoint` dan `azureDeployment` serta mempertahankan bentuk sesi yang kompatibel dengan deployment. Mendukung pemanggilan tool dua arah dan audio G.711 u-law.
    </Note>

    <Note>
    Suara Realtime dipilih saat sesi dibuat. OpenAI mengizinkan sebagian besar
    field sesi berubah kemudian, tetapi suara tidak dapat diubah setelah
    model memancarkan audio dalam sesi tersebut. OpenClaw saat ini mengekspos
    id suara Realtime bawaan sebagai string.
    </Note>

    <Note>
    Control UI Talk menggunakan sesi realtime browser OpenAI dengan rahasia klien
    ephemeral yang dicetak Gateway dan pertukaran SDP WebRTC browser langsung terhadap
    OpenAI Realtime API. Ketika tidak ada kunci API OpenAI langsung yang dikonfigurasi,
    Gateway dapat mencetak rahasia klien tersebut dengan profil OAuth `openai-codex`
    yang dipilih. Relay Gateway dan jembatan WebSocket realtime backend Voice Call menggunakan
    fallback OAuth yang sama untuk endpoint OpenAI native. Verifikasi live maintainer
    tersedia dengan
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    kaki OpenAI memverifikasi jembatan WebSocket backend dan pertukaran SDP WebRTC
    browser tanpa mencatat rahasia.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Provider `openai` yang dibundel dapat menargetkan resource Azure OpenAI untuk pembuatan gambar
dengan menimpa URL dasar. Pada path pembuatan gambar, OpenClaw
mendeteksi hostname Azure pada `models.providers.openai.baseUrl` dan beralih ke
bentuk permintaan Azure secara otomatis.

<Note>
Suara Realtime menggunakan path konfigurasi terpisah
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
dan tidak dipengaruhi oleh `models.providers.openai.baseUrl`. Lihat akordeon **Suara Realtime**
di bawah [Suara dan ucapan](#voice-and-speech) untuk pengaturan Azure-nya.
</Note>

Gunakan Azure OpenAI ketika:

- Anda sudah memiliki langganan, kuota, atau perjanjian enterprise Azure OpenAI
- Anda memerlukan residensi data regional atau kontrol kepatuhan yang disediakan Azure
- Anda ingin menjaga traffic tetap di dalam tenancy Azure yang sudah ada

### Konfigurasi

Untuk pembuatan gambar Azure melalui provider `openai` yang dibundel, arahkan
`models.providers.openai.baseUrl` ke resource Azure Anda dan setel `apiKey` ke
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

OpenClaw mengenali sufiks host Azure ini untuk rute pembuatan gambar Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Untuk permintaan pembuatan gambar pada host Azure yang dikenali, OpenClaw:

- Mengirim header `api-key` alih-alih `Authorization: Bearer`
- Menggunakan path yang dicakup deployment (`/openai/deployments/{deployment}/...`)
- Menambahkan `?api-version=...` ke setiap permintaan
- Menggunakan timeout permintaan default 600 dtk untuk panggilan pembuatan gambar Azure.
  Nilai `timeoutMs` per panggilan tetap menimpa default ini.

URL dasar lain (OpenAI publik, proksi yang kompatibel dengan OpenAI) mempertahankan
bentuk permintaan gambar OpenAI standar.

<Note>
Perutean Azure untuk path pembuatan gambar provider `openai` memerlukan
OpenClaw 2026.4.22 atau lebih baru. Versi sebelumnya memperlakukan setiap
`openai.baseUrl` kustom seperti endpoint OpenAI publik dan akan gagal terhadap deployment
gambar Azure.
</Note>

### Versi API

Setel `AZURE_OPENAI_API_VERSION` untuk mengunci versi preview atau GA Azure tertentu
untuk path pembuatan gambar Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Default-nya adalah `2024-12-01-preview` ketika variabel tidak disetel.

### Nama model adalah nama deployment

Azure OpenAI mengikat model ke deployment. Untuk permintaan pembuatan gambar Azure
yang dirutekan melalui provider `openai` yang dibundel, field `model` di OpenClaw
harus berupa **nama deployment Azure** yang Anda konfigurasi di portal Azure, bukan
id model OpenAI publik.

Jika Anda membuat deployment bernama `gpt-image-2-prod` yang melayani `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aturan nama deployment yang sama berlaku untuk panggilan pembuatan gambar yang dirutekan melalui
provider `openai` yang dibundel.

### Ketersediaan regional

Pembuatan gambar Azure saat ini hanya tersedia di sebagian region
(misalnya `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Periksa daftar region Microsoft saat ini sebelum membuat
deployment, dan pastikan model tertentu ditawarkan di region Anda.

### Perbedaan parameter

Azure OpenAI dan OpenAI publik tidak selalu menerima parameter gambar yang sama.
Azure dapat menolak opsi yang diizinkan OpenAI publik (misalnya nilai
`background` tertentu pada `gpt-image-2`) atau mengeksposnya hanya pada versi model
tertentu. Perbedaan ini berasal dari Azure dan model yang mendasarinya, bukan
OpenClaw. Jika permintaan Azure gagal dengan error validasi, periksa
set parameter yang didukung oleh deployment dan versi API spesifik Anda di
portal Azure.

<Note>
Azure OpenAI menggunakan transport native dan perilaku kompatibel, tetapi tidak menerima
header atribusi tersembunyi OpenClaw — lihat akordeon **Rute native vs kompatibel OpenAI**
di bawah [Konfigurasi lanjutan](#advanced-configuration).

Untuk lalu lintas chat atau Responses di Azure (di luar pembuatan gambar), gunakan
alur onboarding atau konfigurasi provider Azure khusus — `openai.baseUrl` saja
tidak mengambil bentuk API/auth Azure. Provider
`azure-openai-responses/*` terpisah tersedia; lihat
akordeon Compaction sisi server di bawah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw menggunakan WebSocket terlebih dahulu dengan fallback SSE (`"auto"`) untuk `openai/*`.

    Dalam mode `"auto"`, OpenClaw:
    - Mencoba ulang satu kegagalan WebSocket awal sebelum fallback ke SSE
    - Setelah kegagalan, menandai WebSocket sebagai terdegradasi selama ~60 detik dan menggunakan SSE selama masa pendinginan
    - Melampirkan header identitas sesi dan giliran yang stabil untuk percobaan ulang dan koneksi ulang
    - Menormalkan penghitung penggunaan (`input_tokens` / `prompt_tokens`) di seluruh varian transport

    | Nilai | Perilaku |
    |-------|----------|
    | `"auto"` (default) | WebSocket terlebih dahulu, fallback SSE |
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
          },
        },
      },
    }
    ```

    Dokumentasi OpenAI terkait:
    - [Realtime API dengan WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respons Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Mode cepat">
    OpenClaw mengekspos toggle mode cepat bersama untuk `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfigurasi:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Saat diaktifkan, OpenClaw memetakan mode cepat ke pemrosesan prioritas OpenAI (`service_tier = "priority"`). Nilai `service_tier` yang ada dipertahankan, dan mode cepat tidak menulis ulang `reasoning` atau `text.verbosity`.

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
    Override sesi menang atas konfigurasi. Menghapus override sesi di UI Sesi mengembalikan sesi ke default yang dikonfigurasi.
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
    `serviceTier` hanya diteruskan ke endpoint native OpenAI (`api.openai.com`) dan endpoint native Codex (`chatgpt.com/backend-api`). Jika Anda merutekan salah satu provider melalui proxy, OpenClaw membiarkan `service_tier` tidak diubah.
    </Warning>

  </Accordion>

  <Accordion title="Compaction sisi server (Responses API)">
    Untuk model OpenAI Responses langsung (`openai/*` di `api.openai.com`), wrapper stream Pi-harness Plugin OpenAI mengaktifkan otomatis Compaction sisi server:

    - Memaksa `store: true` (kecuali kompatibilitas model menetapkan `supportsStore: false`)
    - Menyuntikkan `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` default: 70% dari `contextWindow` (atau `80000` saat tidak tersedia)

    Ini berlaku untuk jalur Pi harness bawaan dan untuk hook provider OpenAI yang digunakan oleh run tertanam. Harness app-server Codex native mengelola konteksnya sendiri melalui Codex dan dikonfigurasi oleh rute agen default OpenAI atau kebijakan runtime provider/model.

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
    `responsesServerCompaction` hanya mengontrol penyuntikan `context_management`. Model OpenAI Responses langsung tetap memaksa `store: true` kecuali kompatibilitas menetapkan `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentic ketat">
    Untuk run keluarga GPT-5 di `openai/*`, OpenClaw dapat menggunakan kontrak eksekusi tertanam yang lebih ketat:

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
    - Tidak lagi memperlakukan giliran yang hanya berisi rencana sebagai progres berhasil saat tindakan tool tersedia
    - Mencoba ulang giliran dengan arahan untuk bertindak sekarang
    - Mengaktifkan otomatis `update_plan` untuk pekerjaan substansial
    - Menampilkan status diblokir yang eksplisit jika model terus merencanakan tanpa bertindak

    <Note>
    Dicakup hanya untuk run keluarga OpenAI dan Codex GPT-5. Provider lain dan keluarga model yang lebih lama mempertahankan perilaku default.
    </Note>

  </Accordion>

  <Accordion title="Rute native vs kompatibel OpenAI">
    OpenClaw memperlakukan endpoint OpenAI langsung, Codex, dan Azure OpenAI secara berbeda dari proxy `/v1` generik yang kompatibel OpenAI:

    **Rute native** (`openai/*`, Azure OpenAI):
    - Mempertahankan `reasoning: { effort: "none" }` hanya untuk model yang mendukung effort `none` OpenAI
    - Menghilangkan reasoning yang dinonaktifkan untuk model atau proxy yang menolak `reasoning.effort: "none"`
    - Menjadikan skema tool default ke mode ketat
    - Melampirkan header atribusi tersembunyi hanya pada host native yang terverifikasi
    - Mempertahankan pembentukan permintaan khusus OpenAI (`service_tier`, `store`, kompatibilitas reasoning, petunjuk cache prompt)

    **Rute proxy/kompatibel:**
    - Menggunakan perilaku kompatibilitas yang lebih longgar
    - Menghapus Completions `store` dari payload `openai-completions` non-native
    - Menerima JSON pass-through lanjutan `params.extra_body`/`params.extraBody` untuk proxy Completions yang kompatibel OpenAI
    - Menerima `params.chat_template_kwargs` untuk proxy Completions yang kompatibel OpenAI seperti vLLM
    - Tidak memaksa skema tool ketat atau header khusus native

    Azure OpenAI menggunakan transport native dan perilaku kompatibel, tetapi tidak menerima header atribusi tersembunyi.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter tool gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan provider.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
