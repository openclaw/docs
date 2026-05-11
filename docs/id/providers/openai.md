---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda menginginkan autentikasi langganan Codex alih-alih kunci API
    - Anda memerlukan perilaku eksekusi agen GPT-5 yang lebih ketat
summary: Gunakan OpenAI melalui kunci API atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:34:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI menyediakan API pengembang untuk model GPT, dan Codex juga tersedia sebagai agen coding paket ChatGPT melalui klien Codex milik OpenAI. OpenClaw menjaga permukaan tersebut tetap terpisah agar konfigurasi tetap dapat diprediksi.

OpenClaw menggunakan `openai/*` sebagai rute model OpenAI kanonis. Giliran agen tertanam pada model OpenAI berjalan melalui runtime server aplikasi Codex native secara default; autentikasi kunci API OpenAI langsung tetap tersedia untuk permukaan OpenAI non-agen seperti gambar, embeddings, speech, dan realtime.

- **Model agen** - model `openai/*` melalui runtime Codex; masuk dengan autentikasi Codex untuk penggunaan langganan ChatGPT/Codex, atau konfigurasikan cadangan kunci API OpenAI yang kompatibel dengan Codex saat Anda sengaja menginginkan autentikasi kunci API.
- **API OpenAI non-agen** - akses OpenAI Platform langsung dengan penagihan berbasis penggunaan melalui `OPENAI_API_KEY` atau onboarding kunci API OpenAI.
- **Konfigurasi lama** - ref model `openai-codex/*` diperbaiki oleh `openclaw doctor --fix` menjadi `openai/*` plus runtime Codex.

OpenAI secara eksplisit mendukung penggunaan OAuth langganan dalam alat dan alur kerja eksternal seperti OpenClaw.

Provider, model, runtime, dan channel adalah lapisan yang terpisah. Jika label-label tersebut tercampur, baca [Runtime agen](/id/concepts/agent-runtimes) sebelum mengubah konfigurasi.

## Pilihan cepat

| Tujuan                                               | Gunakan                                                  | Catatan                                                               |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Langganan ChatGPT/Codex dengan runtime Codex native  | `openai/gpt-5.5`                                         | Penyiapan agen OpenAI default. Masuk dengan autentikasi Codex.        |
| Penagihan kunci API langsung untuk model agen        | `openai/gpt-5.5` plus profil kunci API yang kompatibel dengan Codex | Gunakan `auth.order.openai` untuk menempatkan cadangan setelah autentikasi langganan. |
| Penagihan kunci API langsung melalui PI eksplisit    | `openai/gpt-5.5` plus runtime provider/model `pi`        | Pilih profil kunci API `openai` normal.                               |
| Alias API ChatGPT Instant terbaru                    | `openai/chat-latest`                                     | Hanya kunci API langsung. Alias bergerak untuk eksperimen, bukan default. |
| Autentikasi langganan ChatGPT/Codex melalui PI eksplisit | `openai/gpt-5.5` plus runtime provider/model `pi`    | Pilih profil autentikasi `openai-codex` untuk rute kompatibilitas.    |
| Pembuatan atau penyuntingan gambar                   | `openai/gpt-image-2`                                     | Berfungsi dengan `OPENAI_API_KEY` atau OpenAI Codex OAuth.            |
| Gambar latar belakang transparan                     | `openai/gpt-image-1.5`                                   | Gunakan `outputFormat=png` atau `webp` dan `openai.background=transparent`. |

## Peta penamaan

Nama-namanya mirip tetapi tidak dapat dipertukarkan:

| Nama yang Anda lihat                    | Lapisan                    | Makna                                                                                                                |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefiks provider           | Rute model OpenAI kanonis; giliran agen menggunakan runtime Codex.                                                   |
| `openai-codex`                          | Prefiks autentikasi/profil lama | Namespace profil langganan/OAuth OpenAI Codex lama. Profil yang ada dan `auth.order.openai-codex` tetap berfungsi. |
| Plugin `codex`                          | Plugin                     | Plugin OpenClaw bawaan yang menyediakan runtime server aplikasi Codex native dan kontrol chat `/codex`.             |
| provider/model `agentRuntime.id: codex` | Runtime agen               | Memaksa harness server aplikasi Codex native untuk giliran tertanam yang cocok.                                      |
| `/codex ...`                            | Set perintah chat          | Mengikat/mengontrol thread server aplikasi Codex dari percakapan.                                                    |
| `runtime: "acp", agentId: "codex"`      | Rute sesi ACP              | Jalur fallback eksplisit yang menjalankan Codex melalui ACP/acpx.                                                    |

Ini berarti konfigurasi dapat dengan sengaja berisi ref model `openai/*` sementara profil autentikasi masih menunjuk ke kredensial yang kompatibel dengan Codex. Lebih utamakan `auth.order.openai` untuk konfigurasi baru; profil `openai-codex:*` yang ada dan `auth.order.openai-codex` tetap didukung. `openclaw doctor --fix` menulis ulang ref model lama `openai-codex/*` ke rute model OpenAI kanonis.

<Note>
GPT-5.5 tersedia melalui akses kunci API OpenAI Platform langsung dan rute langganan/OAuth. Untuk langganan ChatGPT/Codex plus eksekusi Codex native, gunakan `openai/gpt-5.5`; konfigurasi runtime yang tidak disetel kini memilih harness Codex untuk giliran agen OpenAI. Gunakan profil kunci API OpenAI hanya saat Anda menginginkan autentikasi kunci API langsung untuk model agen OpenAI.
</Note>

<Note>
Giliran model agen OpenAI memerlukan Plugin server aplikasi Codex bawaan. Konfigurasi runtime PI eksplisit tetap tersedia sebagai rute kompatibilitas opt-in. Saat PI dipilih secara eksplisit dengan profil autentikasi `openai-codex`, OpenClaw menjaga ref model publik sebagai `openai/*` dan merutekan PI secara internal melalui transport autentikasi Codex lama. Jalankan `openclaw doctor --fix` untuk memperbaiki ref model `openai-codex/*` yang kedaluwarsa atau pin sesi PI lama yang tidak berasal dari konfigurasi runtime eksplisit.
</Note>

## Cakupan fitur OpenClaw

| Kemampuan OpenAI        | Permukaan OpenClaw                                                              | Status                                                 |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses        | Provider model `openai/<model>`                                                  | Ya                                                     |
| Model langganan Codex   | `openai/<model>` dengan OAuth `openai-codex`                                     | Ya                                                     |
| Ref model Codex lama    | `openai-codex/<model>`                                                           | Diperbaiki oleh doctor ke `openai/<model>`             |
| Harness server aplikasi Codex | `openai/<model>` dengan runtime dihilangkan atau provider/model `agentRuntime.id: codex` | Ya                                             |
| Pencarian web sisi server | Alat OpenAI Responses native                                                   | Ya, saat pencarian web diaktifkan dan tidak ada provider yang dipin |
| Gambar                  | `image_generate`                                                                 | Ya                                                     |
| Video                   | `video_generate`                                                                 | Ya                                                     |
| Teks-ke-speech          | `messages.tts.provider: "openai"` / `tts`                                        | Ya                                                     |
| Speech-ke-teks batch    | `tools.media.audio` / pemahaman media                                            | Ya                                                     |
| Speech-ke-teks streaming | Voice Call `streaming.provider: "openai"`                                       | Ya                                                     |
| Suara realtime          | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Ya                                                     |
| Embeddings              | provider embedding memori                                                        | Ya                                                     |

## Embeddings memori

OpenClaw dapat menggunakan OpenAI, atau endpoint embedding yang kompatibel dengan OpenAI, untuk pengindeksan `memory_search` dan embeddings kueri:

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

Untuk endpoint yang kompatibel dengan OpenAI yang memerlukan label embedding asimetris, setel `queryInputType` dan `documentInputType` di bawah `memorySearch`. OpenClaw meneruskannya sebagai field permintaan `input_type` khusus provider: embeddings kueri menggunakan `queryInputType`; potongan memori terindeks dan pengindeksan batch menggunakan `documentInputType`. Lihat [Referensi konfigurasi memori](/id/reference/memory-config#provider-specific-config) untuk contoh lengkapnya.

## Memulai

Pilih metode autentikasi pilihan Anda dan ikuti langkah penyiapannya.

<Tabs>
  <Tab title="Kunci API (OpenAI Platform)">
    **Paling cocok untuk:** akses API langsung dan penagihan berbasis penggunaan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat atau salin kunci API dari [dasbor OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Atau teruskan kuncinya secara langsung:

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

    | Ref model             | Konfigurasi runtime       | Rute                        | Autentikasi      |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | dihilangkan / provider/model `agentRuntime.id: "codex"` | Harness server aplikasi Codex | Profil OpenAI yang kompatibel dengan Codex |
    | `openai/gpt-5.4-mini` | dihilangkan / provider/model `agentRuntime.id: "codex"` | Harness server aplikasi Codex | Profil OpenAI yang kompatibel dengan Codex |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "pi"`              | Runtime tertanam PI      | Profil `openai` atau profil `openai-codex` yang dipilih |

    <Note>
    Model agen `openai/*` menggunakan harness server aplikasi Codex. Untuk menggunakan autentikasi kunci API bagi model agen, buat profil kunci API yang kompatibel dengan Codex dan urutkan dengan `auth.order.openai`; `OPENAI_API_KEY` tetap menjadi fallback langsung untuk permukaan API OpenAI non-agen. Entri `auth.order.openai-codex` yang lebih lama tetap berfungsi.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Untuk mencoba model Instant ChatGPT saat ini dari OpenAI API, setel model ke `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` adalah alias bergerak. OpenAI mendokumentasikannya sebagai model Instant terbaru yang digunakan di ChatGPT dan merekomendasikan `gpt-5.5` untuk penggunaan API produksi, jadi pertahankan `openai/gpt-5.5` sebagai default stabil kecuali Anda secara eksplisit menginginkan perilaku alias tersebut. Alias saat ini hanya menerima verbositas teks `medium`, sehingga OpenClaw menormalisasi override verbositas teks OpenAI yang tidak kompatibel untuk model ini.

    <Warning>
    OpenClaw **tidak** mengekspos `openai/gpt-5.3-codex-spark`. Permintaan OpenAI API langsung menolak model tersebut, dan katalog Codex saat ini juga tidak mengeksposnya.
    </Warning>

  </Tab>

  <Tab title="Langganan Codex">
    **Paling cocok untuk:** menggunakan langganan ChatGPT/Codex Anda dengan eksekusi app-server Codex native alih-alih kunci API terpisah. Cloud Codex memerlukan masuk ChatGPT.

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
        memilih runtime app-server Codex native secara otomatis, dan OpenClaw
        memasang atau memperbaiki plugin Codex bawaan saat rute ini dipilih.
      </Step>
      <Step title="Verifikasi auth Codex tersedia">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Setelah gateway berjalan, kirim `/codex status` atau `/codex models`
        di chat untuk memverifikasi runtime app-server native.
      </Step>
    </Steps>

    ### Ringkasan rute

    | Ref model | Konfig runtime | Rute | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | dihilangkan / provider/model `agentRuntime.id: "codex"` | Harness app-server Codex native | Masuk Codex atau profil auth `openai` berurutan |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | Runtime tertanam PI dengan transport auth Codex internal | Profil `openai-codex` terpilih |
    | `openai-codex/gpt-5.5` | diperbaiki oleh doctor | Rute lama ditulis ulang ke `openai/gpt-5.5` | Profil `openai-codex` yang sudah ada |

    <Warning>
    Jangan konfigurasikan ref model `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*`, atau
    `openai-codex/gpt-5.3*` yang lebih lama. Akun OAuth ChatGPT/Codex sekarang menolak
    model tersebut. Gunakan `openai/gpt-5.5`; giliran agen OpenAI sekarang memilih runtime
    Codex secara default.
    </Warning>

    <Note>
    Prefiks model `openai-codex/*` adalah konfigurasi lama yang diperbaiki oleh doctor. Untuk
    penyiapan umum langganan plus runtime native, masuk dengan auth Codex
    tetapi pertahankan ref model sebagai `openai/gpt-5.5`. Konfigurasi baru harus menempatkan urutan
    auth agen OpenAI di bawah `auth.order.openai`; entri `auth.order.openai-codex`
    yang lebih lama tetap valid.
    </Note>

    ### Contoh konfigurasi

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

    Dengan cadangan kunci API, pertahankan model di `openai/gpt-5.5` dan tempatkan
    urutan auth di bawah `openai`. OpenClaw akan mencoba langganan terlebih dahulu, lalu
    kunci API, sambil tetap berada pada harness Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding tidak lagi mengimpor materi OAuth dari `~/.codex`. Masuk dengan OAuth browser (default) atau alur kode perangkat di atas — OpenClaw mengelola kredensial yang dihasilkan di penyimpanan auth agennya sendiri.
    </Note>

    ### Periksa dan pulihkan routing OAuth Codex

    Gunakan perintah ini untuk melihat model, runtime, dan rute auth mana yang digunakan agen
    default Anda:

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

    Jika konfigurasi yang lebih lama masih memiliki `openai-codex/gpt-*` atau pin sesi OpenAI PI
    usang tanpa konfigurasi runtime eksplisit, perbaiki:

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

    `openai/*` adalah rute model untuk giliran agen OpenAI melalui Codex. Id provider
    auth/profil `openai-codex` tetap diterima untuk profil yang sudah ada
    dan daftar CLI.

    ### Indikator status

    Chat `/status` menampilkan runtime model mana yang aktif untuk sesi saat ini.
    Harness app-server Codex bawaan muncul sebagai `Runtime: OpenAI Codex` untuk
    giliran model agen OpenAI. Pin sesi PI yang usang diperbaiki ke Codex kecuali
    konfigurasi secara eksplisit mem-pin PI.

    ### Peringatan doctor

    Jika rute `openai-codex/*` atau pin OpenAI PI usang tetap ada dalam konfigurasi atau
    status sesi, `openclaw doctor --fix` menulis ulang semuanya ke `openai/*` dengan
    runtime Codex kecuali PI dikonfigurasi secara eksplisit.

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

    OpenClaw menggunakan metadata katalog Codex upstream untuk `gpt-5.5` saat metadata itu
    ada. Jika penemuan Codex live menghilangkan baris `gpt-5.5` sementara
    akun sudah diautentikasi, OpenClaw mensintesis baris model OAuth tersebut agar
    cron, sub-agen, dan eksekusi model default yang dikonfigurasi tidak gagal dengan
    `Unknown model`.

  </Tab>
</Tabs>

## Auth app-server Codex native

Harness app-server Codex native menggunakan ref model `openai/*` plus konfigurasi
runtime yang dihilangkan atau provider/model `agentRuntime.id: "codex"`, tetapi auth-nya
tetap berbasis akun. OpenClaw memilih auth dalam urutan ini:

1. Profil auth OpenAI berurutan untuk agen, sebaiknya di bawah
   `auth.order.openai`. Profil `openai-codex:*` yang sudah ada dan
   `auth.order.openai-codex` tetap valid untuk instalasi yang lebih lama.
2. Akun app-server yang sudah ada, seperti masuk ChatGPT CLI Codex lokal.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat app-server melaporkan tidak ada akun dan masih memerlukan
   auth OpenAI.

Artinya, masuk langganan ChatGPT/Codex lokal tidak diganti hanya
karena proses gateway juga memiliki `OPENAI_API_KEY` untuk model OpenAI langsung
atau embedding. Fallback kunci API env hanya jalur lokal stdio tanpa akun; fallback itu
tidak dikirim ke koneksi app-server WebSocket. Saat profil Codex bergaya langganan
dipilih, OpenClaw juga menjauhkan `CODEX_API_KEY` dan `OPENAI_API_KEY`
dari child app-server stdio yang di-spawn dan mengirim kredensial terpilih
melalui RPC login app-server. Saat profil langganan tersebut diblokir oleh
batas penggunaan Codex, OpenClaw dapat berotasi ke profil kunci API `openai:*`
berurutan berikutnya tanpa mengubah model terpilih atau keluar dari harness
Codex. Setelah waktu reset langganan berlalu, profil langganan
memenuhi syarat lagi.

## Pembuatan gambar

Plugin `openai` bawaan mendaftarkan pembuatan gambar melalui alat `image_generate`.
Plugin ini mendukung pembuatan gambar dengan kunci API OpenAI dan pembuatan gambar
OAuth Codex melalui ref model `openai/gpt-image-2` yang sama.

| Kemampuan                 | Kunci API OpenAI                  | OAuth Codex                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref model                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | Masuk OAuth OpenAI Codex             |
| Transport                 | API Gambar OpenAI                  | Backend Respons Codex                |
| Maks gambar per permintaan | 4                                  | 4                                    |
| Mode edit                 | Diaktifkan (hingga 5 gambar referensi) | Diaktifkan (hingga 5 gambar referensi) |
| Penimpaan ukuran          | Didukung, termasuk ukuran 2K/4K    | Didukung, termasuk ukuran 2K/4K      |
| Rasio aspek / resolusi    | Tidak diteruskan ke API Gambar OpenAI | Dipetakan ke ukuran yang didukung saat aman |

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

`gpt-image-2` adalah default untuk pembuatan gambar dari teks OpenAI dan pengeditan gambar.
`gpt-image-1.5`, `gpt-image-1`, dan `gpt-image-1-mini` tetap dapat digunakan sebagai
penimpaan model eksplisit. Gunakan `openai/gpt-image-1.5` untuk keluaran PNG/WebP
dengan latar belakang transparan; API `gpt-image-2` saat ini menolak
`background: "transparent"`.

Untuk permintaan latar belakang transparan, agen harus memanggil `image_generate` dengan
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` atau `"webp"`, dan
`background: "transparent"`; opsi provider `openai.background` yang lebih lama
tetap diterima. OpenClaw juga melindungi rute publik OpenAI dan
OAuth OpenAI Codex dengan menulis ulang permintaan transparan default `openai/gpt-image-2`
ke `gpt-image-1.5`; endpoint Azure dan OpenAI-compatible kustom mempertahankan
nama deployment/model yang dikonfigurasi.

Pengaturan yang sama diekspos untuk eksekusi CLI headless:

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
`openai-codex` dikonfigurasi, OpenClaw menyelesaikan token akses OAuth tersimpan tersebut
dan mengirim permintaan gambar melalui backend Respons Codex. OpenClaw
tidak mencoba `OPENAI_API_KEY` terlebih dahulu atau diam-diam fallback ke kunci API untuk
permintaan tersebut. Konfigurasikan `models.providers.openai` secara eksplisit dengan kunci API,
URL dasar kustom, atau endpoint Azure saat Anda menginginkan rute API Gambar OpenAI
langsung sebagai gantinya.
Jika endpoint gambar kustom tersebut berada di alamat LAN/privat tepercaya, atur juga
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw tetap
memblokir endpoint gambar OpenAI-compatible privat/internal kecuali opt-in ini
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
| Mode             | Teks-ke-video, gambar-ke-video, pengeditan video tunggal                          |
| Input referensi  | 1 gambar atau 1 video                                                             |
| Override ukuran  | Didukung                                                                          |
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
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter tool bersama, pemilihan penyedia, dan perilaku failover.
</Note>

## Kontribusi prompt GPT-5

OpenClaw menambahkan kontribusi prompt GPT-5 bersama untuk eksekusi keluarga GPT-5 lintas penyedia. Ini diterapkan berdasarkan id model, sehingga `openai/gpt-5.5`, referensi lama sebelum perbaikan seperti `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, dan referensi GPT-5 kompatibel lainnya menerima overlay yang sama. Model GPT-4.x yang lebih lama tidak.

Harness Codex native bawaan menggunakan perilaku GPT-5 yang sama dan overlay Heartbeat melalui instruksi developer server aplikasi Codex, sehingga sesi `openai/gpt-5.x` yang dirutekan melalui Codex mempertahankan panduan tindak lanjut dan Heartbeat proaktif yang sama meskipun Codex memiliki sisa prompt harness.

Kontribusi GPT-5 menambahkan kontrak perilaku bertag untuk persistensi persona, keselamatan eksekusi, disiplin tool, bentuk output, pemeriksaan penyelesaian, dan verifikasi. Perilaku balasan khusus channel dan pesan senyap tetap berada di prompt sistem OpenClaw bersama dan kebijakan pengiriman keluar. Panduan GPT-5 selalu diaktifkan untuk model yang cocok. Lapisan gaya interaksi ramah terpisah dan dapat dikonfigurasi.

| Nilai                  | Efek                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (default) | Mengaktifkan lapisan gaya interaksi ramah |
| `"on"`                 | Alias untuk `"friendly"`                  |
| `"off"`                | Menonaktifkan hanya lapisan gaya ramah    |

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
Nilai tidak peka huruf besar-kecil saat runtime, sehingga `"Off"` dan `"off"` sama-sama menonaktifkan lapisan gaya ramah.
</Tip>

<Note>
`plugins.entries.openai.config.personality` lama masih dibaca sebagai fallback kompatibilitas saat pengaturan bersama `agents.defaults.promptOverlays.gpt5.personality` belum disetel.
</Note>

## Suara dan ucapan

<AccordionGroup>
  <Accordion title="Sintesis ucapan (TTS)">
    Plugin `openai` bawaan mendaftarkan sintesis ucapan untuk surface `messages.tts`.

    | Pengaturan | Jalur konfigurasi | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Suara | `messages.tts.providers.openai.voice` | `coral` |
    | Kecepatan | `messages.tts.providers.openai.speed` | (belum disetel) |
    | Instruksi | `messages.tts.providers.openai.instructions` | (belum disetel, hanya `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` untuk catatan suara, `mp3` untuk file |
    | Kunci API | `messages.tts.providers.openai.apiKey` | Beralih kembali ke `OPENAI_API_KEY` |
    | URL dasar | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Isi tambahan | `messages.tts.providers.openai.extraBody` / `extra_body` | (belum disetel) |

    Model yang tersedia: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Suara yang tersedia: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` digabungkan ke JSON permintaan `/audio/speech` setelah field yang dihasilkan OpenClaw, jadi gunakan untuk endpoint yang kompatibel dengan OpenAI yang memerlukan kunci tambahan seperti `lang`. Kunci prototype diabaikan.

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
    Setel `OPENAI_TTS_BASE_URL` untuk meng-override URL dasar TTS tanpa memengaruhi endpoint API chat. TTS OpenAI masih dikonfigurasi melalui kunci API; untuk balasan bicara langsung khusus OAuth, gunakan jalur suara Realtime, bukan ucapan STT -> TTS mode agen.
    </Note>

  </Accordion>

  <Accordion title="Ucapan-ke-teks">
    Plugin `openai` bawaan mendaftarkan ucapan-ke-teks batch melalui
    surface transkripsi pemahaman-media OpenClaw.

    - Model default: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Jalur input: unggahan file audio multipart
    - Didukung oleh OpenClaw di mana pun transkripsi audio masuk menggunakan
      `tools.media.audio`, termasuk segmen channel suara Discord dan lampiran
      audio channel

    Untuk memaksa OpenAI bagi transkripsi audio masuk:

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

  <Accordion title="Transkripsi waktu nyata">
    Plugin `openai` bawaan mendaftarkan transkripsi waktu nyata untuk Plugin Voice Call.

    | Pengaturan | Jalur config | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Bahasa | `...openai.language` | (belum disetel) |
    | Prompt | `...openai.prompt` | (belum disetel) |
    | Durasi hening | `...openai.silenceDurationMs` | `800` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY`, atau OAuth `openai-codex` | Kunci API terhubung langsung; OAuth membuat client secret transkripsi Realtime |

    <Note>
    Menggunakan koneksi WebSocket ke `wss://api.openai.com/v1/realtime` dengan audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ketika hanya OAuth `openai-codex` yang dikonfigurasi, Gateway membuat client secret transkripsi Realtime sementara sebelum membuka WebSocket. Penyedia streaming ini ditujukan untuk jalur transkripsi waktu nyata Voice Call; voice Discord saat ini merekam segmen pendek dan menggunakan jalur transkripsi batch `tools.media.audio` sebagai gantinya.
    </Note>

  </Accordion>

  <Accordion title="Suara waktu nyata">
    Plugin `openai` bawaan mendaftarkan suara waktu nyata untuk Plugin Voice Call.

    | Pengaturan | Jalur config | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Suara | `...openai.voice` | `alloy` |
    | Temperature (jembatan deployment Azure) | `...openai.temperature` | `0.8` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Durasi hening | `...openai.silenceDurationMs` | `500` |
    | Padding prefiks | `...openai.prefixPaddingMs` | `300` |
    | Upaya reasoning | `...openai.reasoningEffort` | (belum disetel) |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY`, atau OAuth `openai-codex` | Browser Talk dan jembatan backend non-Azure dapat menggunakan OAuth Codex |

    Suara Realtime bawaan yang tersedia untuk `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI merekomendasikan `marin` dan `cedar` untuk kualitas Realtime terbaik. Ini
    adalah rangkaian terpisah dari suara Text-to-speech di atas; jangan menganggap suara TTS
    seperti `fable`, `nova`, atau `onyx` valid untuk sesi Realtime.

    <Note>
    Jembatan realtime OpenAI backend menggunakan bentuk sesi WebSocket Realtime GA, yang tidak menerima `session.temperature`. Deployment Azure OpenAI tetap tersedia melalui `azureEndpoint` dan `azureDeployment` serta mempertahankan bentuk sesi yang kompatibel dengan deployment. Mendukung pemanggilan tool dua arah dan audio G.711 u-law.
    </Note>

    <Note>
    Suara Realtime dipilih ketika sesi dibuat. OpenAI mengizinkan sebagian besar
    field sesi diubah nanti, tetapi suara tidak dapat diubah setelah
    model menghasilkan audio dalam sesi tersebut. OpenClaw saat ini mengekspos
    id suara Realtime bawaan sebagai string.
    </Note>

    <Note>
    Control UI Talk menggunakan sesi realtime browser OpenAI dengan client secret
    sementara yang dibuat oleh Gateway dan pertukaran SDP WebRTC browser langsung terhadap
    OpenAI Realtime API. Ketika tidak ada kunci API OpenAI langsung yang dikonfigurasi,
    Gateway dapat membuat client secret tersebut dengan profil OAuth `openai-codex`
    yang dipilih. Relay Gateway dan jembatan WebSocket realtime backend Voice Call menggunakan
    fallback OAuth yang sama untuk endpoint OpenAI native. Verifikasi live maintainer
    tersedia dengan
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    leg OpenAI memverifikasi jembatan WebSocket backend dan pertukaran SDP WebRTC
    browser tanpa mencatat secret.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Penyedia `openai` bawaan dapat menargetkan resource Azure OpenAI untuk pembuatan
gambar dengan menimpa URL dasar. Pada jalur pembuatan gambar, OpenClaw
mendeteksi hostname Azure pada `models.providers.openai.baseUrl` dan beralih ke
bentuk request Azure secara otomatis.

<Note>
Suara waktu nyata menggunakan jalur konfigurasi terpisah
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
dan tidak terpengaruh oleh `models.providers.openai.baseUrl`. Lihat accordion **Suara
waktu nyata** di bawah [Suara dan speech](#voice-and-speech) untuk pengaturan
Azure-nya.
</Note>

Gunakan Azure OpenAI ketika:

- Anda sudah memiliki langganan, kuota, atau perjanjian enterprise Azure OpenAI
- Anda memerlukan residensi data regional atau kontrol kepatuhan yang disediakan Azure
- Anda ingin mempertahankan traffic di dalam tenancy Azure yang sudah ada

### Konfigurasi

Untuk pembuatan gambar Azure melalui penyedia `openai` bawaan, arahkan
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

Untuk request pembuatan gambar pada host Azure yang dikenali, OpenClaw:

- Mengirim header `api-key`, bukan `Authorization: Bearer`
- Menggunakan jalur dengan cakupan deployment (`/openai/deployments/{deployment}/...`)
- Menambahkan `?api-version=...` ke setiap request
- Menggunakan timeout request default 600 dtk untuk panggilan pembuatan gambar Azure.
  Nilai `timeoutMs` per panggilan tetap menimpa default ini.

URL dasar lain (OpenAI publik, proxy yang kompatibel dengan OpenAI) mempertahankan
bentuk request gambar OpenAI standar.

<Note>
Routing Azure untuk jalur pembuatan gambar penyedia `openai` memerlukan
OpenClaw 2026.4.22 atau yang lebih baru. Versi sebelumnya memperlakukan
`openai.baseUrl` kustom seperti endpoint OpenAI publik dan akan gagal terhadap deployment
gambar Azure.
</Note>

### Versi API

Tetapkan `AZURE_OPENAI_API_VERSION` untuk menyematkan versi pratinjau atau GA Azure tertentu
untuk jalur pembuatan gambar Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Default-nya adalah `2024-12-01-preview` ketika variabel tidak ditetapkan.

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
deployment, dan konfirmasikan bahwa model tertentu ditawarkan di region Anda.

### Perbedaan parameter

Azure OpenAI dan OpenAI publik tidak selalu menerima parameter gambar yang sama.
Azure mungkin menolak opsi yang diizinkan oleh OpenAI publik (misalnya nilai
`background` tertentu pada `gpt-image-2`) atau mengeksposnya hanya pada versi model
tertentu. Perbedaan ini berasal dari Azure dan model yang mendasarinya, bukan
OpenClaw. Jika permintaan Azure gagal dengan kesalahan validasi, periksa
kumpulan parameter yang didukung oleh deployment dan versi API spesifik Anda di
portal Azure.

<Note>
Azure OpenAI menggunakan transport native dan perilaku compat, tetapi tidak menerima
header atribusi tersembunyi OpenClaw — lihat accordion **Rute native vs kompatibel OpenAI**
di bawah [Konfigurasi lanjutan](#advanced-configuration).

Untuk traffic chat atau Responses di Azure (di luar pembuatan gambar), gunakan
alur onboarding atau konfigurasi penyedia Azure khusus — `openai.baseUrl` saja
tidak mengambil bentuk API/auth Azure. Penyedia terpisah
`azure-openai-responses/*` tersedia; lihat accordion Compaction sisi server di bawah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw menggunakan WebSocket terlebih dahulu dengan fallback SSE (`"auto"`) untuk `openai/*`.

    Dalam mode `"auto"`, OpenClaw:
    - Mencoba ulang satu kegagalan WebSocket awal sebelum beralih ke SSE
    - Setelah kegagalan, menandai WebSocket sebagai terdegradasi selama ~60 detik dan menggunakan SSE selama masa pendinginan
    - Melampirkan header identitas sesi dan turn yang stabil untuk percobaan ulang dan koneksi ulang
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

    Ketika diaktifkan, OpenClaw memetakan mode cepat ke pemrosesan prioritas OpenAI (`service_tier = "priority"`). Nilai `service_tier` yang ada dipertahankan, dan mode cepat tidak menulis ulang `reasoning` atau `text.verbosity`.

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
    `serviceTier` hanya diteruskan ke endpoint OpenAI native (`api.openai.com`) dan endpoint Codex native (`chatgpt.com/backend-api`). Jika Anda merutekan salah satu penyedia melalui proxy, OpenClaw membiarkan `service_tier` tidak berubah.
    </Warning>

  </Accordion>

  <Accordion title="Compaction sisi server (Responses API)">
    Untuk model OpenAI Responses langsung (`openai/*` di `api.openai.com`), wrapper stream Pi-harness Plugin OpenAI mengaktifkan otomatis Compaction sisi server:

    - Memaksa `store: true` (kecuali compat model menetapkan `supportsStore: false`)
    - Menyuntikkan `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Default `compact_threshold`: 70% dari `contextWindow` (atau `80000` ketika tidak tersedia)

    Ini berlaku untuk jalur harness Pi bawaan dan untuk hook penyedia OpenAI yang digunakan oleh run tersemat. Harness app-server Codex native mengelola konteksnya sendiri melalui Codex dan dikonfigurasi oleh rute agen default OpenAI atau kebijakan runtime penyedia/model.

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
      <Tab title="Ambang khusus">
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
    `responsesServerCompaction` hanya mengontrol penyuntikan `context_management`. Model OpenAI Responses langsung tetap memaksa `store: true` kecuali compat menetapkan `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT strict-agentic">
    Untuk run keluarga GPT-5 pada `openai/*`, OpenClaw dapat menggunakan kontrak eksekusi tersemat yang lebih ketat:

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
    - Tidak lagi memperlakukan turn yang hanya berisi rencana sebagai progres berhasil ketika aksi tool tersedia
    - Mencoba ulang turn dengan arahan untuk bertindak sekarang
    - Mengaktifkan otomatis `update_plan` untuk pekerjaan substansial
    - Menampilkan status diblokir eksplisit jika model terus merencanakan tanpa bertindak

    <Note>
    Dicakup hanya untuk run keluarga GPT-5 OpenAI dan Codex. Penyedia lain dan keluarga model lama mempertahankan perilaku default.
    </Note>

  </Accordion>

  <Accordion title="Rute native vs kompatibel OpenAI">
    OpenClaw memperlakukan endpoint OpenAI langsung, Codex, dan Azure OpenAI secara berbeda dari proxy `/v1` generik yang kompatibel dengan OpenAI:

    **Rute native** (`openai/*`, Azure OpenAI):
    - Mempertahankan `reasoning: { effort: "none" }` hanya untuk model yang mendukung effort `none` OpenAI
    - Menghilangkan reasoning yang dinonaktifkan untuk model atau proxy yang menolak `reasoning.effort: "none"`
    - Menjadikan skema tool default ke mode ketat
    - Melampirkan header atribusi tersembunyi hanya pada host native terverifikasi
    - Mempertahankan pembentukan permintaan khusus OpenAI (`service_tier`, `store`, reasoning-compat, petunjuk prompt-cache)

    **Rute proxy/kompatibel:**
    - Menggunakan perilaku compat yang lebih longgar
    - Menghapus `store` Completions dari payload `openai-completions` non-native
    - Menerima JSON pass-through `params.extra_body`/`params.extraBody` lanjutan untuk proxy Completions yang kompatibel dengan OpenAI
    - Menerima `params.chat_template_kwargs` untuk proxy Completions yang kompatibel dengan OpenAI seperti vLLM
    - Tidak memaksa skema tool ketat atau header khusus native

    Azure OpenAI menggunakan transport native dan perilaku compat tetapi tidak menerima header atribusi tersembunyi.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter tool gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan penyedia.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
