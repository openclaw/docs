---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda menginginkan autentikasi langganan Codex, bukan kunci API
    - Anda memerlukan perilaku eksekusi agen GPT-5 yang lebih ketat
summary: Gunakan OpenAI melalui kunci API atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T08:35:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI menyediakan API pengembang untuk model GPT, dan Codex juga tersedia sebagai
agen coding paket ChatGPT melalui klien Codex OpenAI. OpenClaw menggunakan satu
id penyedia, `openai`, untuk kedua bentuk autentikasi.

OpenClaw menggunakan `openai/*` sebagai rute model OpenAI kanonis. Giliran agen
tertanam pada model OpenAI berjalan melalui runtime server aplikasi Codex native secara
default; autentikasi kunci API OpenAI langsung tetap tersedia untuk permukaan OpenAI
non-agen seperti gambar, embedding, ucapan, dan realtime.

- **Model agen** - model `openai/*` melalui runtime Codex; masuk dengan
  autentikasi Codex untuk penggunaan langganan ChatGPT/Codex, atau konfigurasikan cadangan
  kunci API OpenAI yang kompatibel dengan Codex saat Anda sengaja menginginkan autentikasi kunci API.
- **API OpenAI non-agen** - akses OpenAI Platform langsung dengan penagihan berbasis
  penggunaan melalui `OPENAI_API_KEY` atau onboarding kunci API OpenAI.
- **Konfigurasi lama** - referensi model Codex lama diperbaiki oleh
  `openclaw doctor --fix` menjadi `openai/*` plus runtime Codex.

OpenAI secara eksplisit mendukung penggunaan OAuth langganan di alat dan alur kerja eksternal seperti OpenClaw.

Penyedia, model, runtime, dan kanal adalah lapisan terpisah. Jika label tersebut
mulai tercampur, baca [Runtime agen](/id/concepts/agent-runtimes) sebelum
mengubah konfigurasi.

## Pilihan cepat

| Tujuan                                               | Gunakan                                                  | Catatan                                                               |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Langganan ChatGPT/Codex dengan runtime Codex native  | `openai/gpt-5.5`                                         | Penyiapan agen OpenAI default. Masuk dengan autentikasi Codex.        |
| Pratinjau terbatas GPT-5.6                           | `openai/gpt-5.6-sol`, `-terra`, atau `-luna`             | Memerlukan organisasi API yang disetujui OpenAI atau workspace Codex. |
| Penagihan kunci API langsung untuk model agen        | `openai/gpt-5.5` plus profil kunci API kompatibel Codex  | Gunakan `auth.order.openai` untuk menempatkan cadangan setelah autentikasi langganan. |
| Penagihan kunci API langsung melalui OpenClaw eksplisit | `openai/gpt-5.5` plus runtime penyedia/model `openclaw` | Pilih profil kunci API `openai` normal.                               |
| Alias API ChatGPT Instant terbaru                    | `openai/chat-latest`                                     | Hanya kunci API langsung. Alias bergerak untuk eksperimen, bukan default. |
| Autentikasi langganan ChatGPT/Codex melalui OpenClaw | `openai/gpt-5.5` plus runtime penyedia/model `openclaw`  | Pilih profil OAuth `openai` untuk rute kompatibilitas.                |
| Pembuatan atau pengeditan gambar                     | `openai/gpt-image-2`                                     | Berfungsi dengan `OPENAI_API_KEY` atau OAuth OpenAI Codex.            |
| Gambar berlatar transparan                           | `openai/gpt-image-1.5`                                   | Gunakan `outputFormat=png` atau `webp` dan `openai.background=transparent`. |

## Peta penamaan

Nama-namanya mirip tetapi tidak dapat saling dipertukarkan:

| Nama yang Anda lihat                    | Lapisan           | Makna                                                                                             |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefiks penyedia  | Rute model OpenAI kanonis; giliran agen menggunakan runtime Codex.                                |
| prefiks OpenAI Codex lama               | Prefiks lama      | Namespace model/profil lama. `openclaw doctor --fix` memigrasikannya ke `openai`.                 |
| Plugin `codex`                          | Plugin            | Plugin OpenClaw bawaan yang menyediakan runtime server aplikasi Codex native dan kontrol chat `/codex`. |
| penyedia/model `agentRuntime.id: codex` | Runtime agen      | Memaksa harness server aplikasi Codex native untuk giliran tertanam yang cocok.                   |
| `/codex ...`                            | Set perintah chat | Mengikat/mengontrol thread server aplikasi Codex dari percakapan.                                 |
| `runtime: "acp", agentId: "codex"`      | Rute sesi ACP     | Jalur fallback eksplisit yang menjalankan Codex melalui ACP/acpx.                                 |

Ini berarti konfigurasi dapat dengan sengaja berisi referensi model `openai/*` sementara profil
autentikasi menunjuk ke kredensial kunci API atau OAuth ChatGPT/Codex. Gunakan
`auth.order.openai` untuk konfigurasi; `openclaw doctor --fix` menulis ulang referensi model
Codex lama, id profil autentikasi Codex lama, dan urutan autentikasi Codex lama
ke rute OpenAI kanonis.

<Note>
GPT-5.5 tersedia melalui akses kunci API OpenAI Platform langsung maupun
rute langganan/OAuth. Untuk langganan ChatGPT/Codex plus eksekusi Codex
native, gunakan `openai/gpt-5.5`; konfigurasi runtime yang tidak disetel sekarang memilih harness Codex
untuk giliran agen OpenAI. Gunakan profil kunci API OpenAI hanya saat Anda menginginkan
autentikasi kunci API langsung untuk model agen OpenAI.
</Note>

## Pratinjau terbatas GPT-5.6

OpenClaw mengenali tiga id model GPT-5.6 publik:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

Ketiganya mengekspos penalaran `max` dalam katalog server aplikasi Codex saat ini. Pengumuman
peluncuran OpenAI menggambarkan Sol sebagai tingkat unggulan, Terra sebagai tingkat
seimbang, dan Luna sebagai tingkat cepat dengan biaya lebih rendah. Lihat
[pengumuman peluncuran GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
dan [panduan akses pratinjau](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Akses masuk daftar izin selama pratinjau dan dapat diberikan secara terpisah untuk
API dan Codex. Paket ChatGPT berbayar saja tidak memberikan akses. OpenClaw mempertahankan
`openai/gpt-5.5` sebagai default; memilih referensi GPT-5.6 tanpa akses mengembalikan
galat akses upstream alih-alih fallback secara diam-diam.

<Note>
Giliran model agen OpenAI memerlukan Plugin server aplikasi Codex bawaan. Konfigurasi runtime
OpenClaw eksplisit tetap tersedia sebagai rute kompatibilitas opt-in. Saat OpenClaw
dipilih secara eksplisit dengan profil OAuth `openai`, OpenClaw mempertahankan
referensi model publik sebagai `openai/*` dan merutekan secara internal melalui transport
autentikasi Codex. Jalankan `openclaw doctor --fix` untuk memperbaiki
referensi model Codex lama, `codex-cli/*`, atau pin sesi runtime lama yang tidak berasal dari
konfigurasi runtime eksplisit.
</Note>

## Cakupan fitur OpenClaw

| Kapabilitas OpenAI       | Permukaan OpenClaw                                                                            | Status                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses         | penyedia model `openai/<model>`                                                               | Ya                                                                     |
| Model langganan Codex    | `openai/<model>` dengan OAuth OpenAI                                                          | Ya                                                                     |
| Referensi model Codex lama | referensi model Codex lama atau `codex-cli/<model>`                                         | Diperbaiki oleh doctor menjadi `openai/<model>`                        |
| Harness server aplikasi Codex | `openai/<model>` dengan runtime dihilangkan atau penyedia/model `agentRuntime.id: codex` | Ya                                                                     |
| Pencarian web sisi server | Alat OpenAI Responses native                                                                  | Ya, saat pencarian web diaktifkan dan tidak ada penyedia yang dipin    |
| Gambar                   | `image_generate`                                                                              | Ya                                                                     |
| Video                    | `video_generate`                                                                              | Ya                                                                     |
| Teks-ke-ucapan           | `messages.tts.provider: "openai"` / `tts`                                                     | Ya                                                                     |
| Ucapan-ke-teks batch     | `tools.media.audio` / pemahaman media                                                         | Ya                                                                     |
| Ucapan-ke-teks streaming | Voice Call `streaming.provider: "openai"`                                                     | Ya                                                                     |
| Suara realtime           | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Ya (memerlukan kredit OpenAI Platform, bukan langganan Codex/ChatGPT)  |
| Embedding                | penyedia embedding memori                                                                     | Ya                                                                     |

<Note>
  Suara OpenAI Realtime (digunakan oleh `realtime.provider: "openai"` milik Voice Call dan
  Control UI Talk dengan `talk.realtime.provider: "openai"`) melalui
  **OpenAI Platform Realtime API** publik, yang ditagihkan ke kredit OpenAI
  Platform, bukan kuota langganan Codex/ChatGPT. Akun dengan OAuth OpenAI
  yang sehat yang menjalankan model chat berbasis Codex tanpa masalah
  tetap memerlukan profil autentikasi kunci API OpenAI atau kunci API Platform dengan
  penagihan Platform terdanai untuk suara Realtime.

Perbaikan: isi ulang kredit Platform di
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
untuk organisasi yang mendukung kredensial realtime Anda. Suara Realtime menerima
profil autentikasi kunci API `openai` yang dibuat oleh `openclaw onboard --auth-choice openai-api-key`,
`OPENAI_API_KEY` Platform yang dikonfigurasi melalui `talk.realtime.providers.openai.apiKey`
untuk Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
untuk Voice Call, atau variabel lingkungan `OPENAI_API_KEY`. Profil OAuth OpenAI
tetap dapat menjalankan model chat `openai/*` berbasis Codex dalam instalasi
OpenClaw yang sama, tetapi profil tersebut tidak mengonfigurasi suara Realtime.
</Note>

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

Untuk endpoint kompatibel OpenAI yang memerlukan label embedding asimetris, setel
`queryInputType` dan `documentInputType` di bawah `memorySearch`. OpenClaw meneruskan
keduanya sebagai field permintaan `input_type` khusus penyedia: embedding kueri menggunakan
`queryInputType`; potongan memori terindeks dan pengindeksan batch menggunakan
`documentInputType`. Lihat [referensi konfigurasi memori](/id/reference/memory-config#provider-specific-config) untuk contoh lengkap.

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah penyiapan.

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

        Atau berikan kunci secara langsung:

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

    | Ref model              | Konfigurasi runtime             | Rute                       | Auth             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | dihilangkan / provider/model `agentRuntime.id: "codex"` | harness server aplikasi Codex | profil OpenAI yang kompatibel dengan Codex |
    | `openai/gpt-5.4-mini` | dihilangkan / provider/model `agentRuntime.id: "codex"` | harness server aplikasi Codex | profil OpenAI yang kompatibel dengan Codex |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | runtime tertanam OpenClaw      | Profil `openai` yang dipilih |

    <Note>
    Model agen `openai/*` menggunakan harness server aplikasi Codex. Untuk menggunakan
    auth kunci API untuk model agen, buat profil kunci API yang kompatibel dengan Codex dan urutkan
    dengan `auth.order.openai`; `OPENAI_API_KEY` tetap menjadi fallback langsung untuk
    permukaan API OpenAI non-agen. Jalankan `openclaw doctor --fix` untuk memigrasikan entri
    urutan auth Codex lama yang lebih lawas.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Untuk mencoba model Instant ChatGPT saat ini dari API OpenAI, atur model
    ke `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` adalah alias yang berubah. OpenAI mendokumentasikannya sebagai model Instant
    terbaru yang digunakan di ChatGPT dan merekomendasikan `gpt-5.5` untuk penggunaan API produksi, jadi
    pertahankan `openai/gpt-5.5` sebagai default stabil kecuali Anda secara eksplisit menginginkan
    perilaku alias tersebut. Alias ini saat ini hanya menerima verbositas teks `medium`, jadi
    OpenClaw menormalkan penimpaan verbositas teks OpenAI yang tidak kompatibel untuk model ini.

    <Warning>
    OpenClaw **tidak** mengekspos `gpt-5.3-codex-spark` pada rute kunci API OpenAI langsung. Model ini hanya tersedia melalui entri katalog langganan Codex ketika akun yang Anda masuki mengeksposnya.
    </Warning>

  </Tab>

  <Tab title="Langganan Codex">
    **Paling cocok untuk:** menggunakan langganan ChatGPT/Codex Anda dengan eksekusi server aplikasi Codex native alih-alih kunci API terpisah. Cloud Codex memerlukan masuk ChatGPT.

    <Steps>
      <Step title="Jalankan OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Atau jalankan OAuth secara langsung:

        ```bash
        openclaw models auth login --provider openai
        ```

        Untuk penyiapan tanpa headless atau yang bermasalah dengan callback, tambahkan `--device-code` untuk masuk dengan alur kode perangkat ChatGPT alih-alih callback browser localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Gunakan rute model OpenAI kanonis">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Tidak diperlukan konfigurasi runtime untuk jalur default. Giliran agen OpenAI
        memilih runtime server aplikasi Codex native secara otomatis, dan OpenClaw
        menginstal atau memperbaiki Plugin Codex bawaan ketika rute ini dipilih.
      </Step>
      <Step title="Verifikasi auth Codex tersedia">
        ```bash
        openclaw models list --provider openai
        ```

        Setelah Gateway berjalan, kirim `/codex status` atau `/codex models`
        di chat untuk memverifikasi runtime server aplikasi native.
      </Step>
    </Steps>

    ### Ringkasan rute

    | Ref model | Konfigurasi runtime | Rute | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | dihilangkan / provider/model `agentRuntime.id: "codex"` | Harness server aplikasi Codex native | Masuk Codex atau profil auth `openai` yang diurutkan |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | runtime tertanam OpenClaw dengan transport auth Codex internal | Profil OAuth `openai` yang dipilih |
    | ref Codex GPT-5.5 lama | diperbaiki oleh doctor | Rute lama ditulis ulang ke `openai/gpt-5.5` | Profil OAuth OpenAI yang dimigrasikan |
    | `codex-cli/gpt-5.5` | diperbaiki oleh doctor | Rute CLI lama ditulis ulang ke `openai/gpt-5.5` | auth server aplikasi Codex |

    <Warning>
    Pilih `openai/gpt-5.5` untuk konfigurasi agen baru yang didukung langganan. Ref
    GPT Codex lama yang lebih lawas adalah rute OpenClaw lama, bukan jalur runtime Codex native;
    jalankan `openclaw doctor --fix` ketika Anda ingin memigrasikannya ke ref `openai/*`
    kanonis. `gpt-5.3-codex-spark` tetap terbatas pada akun yang katalog langganan
    Codex-nya mengiklankan model tersebut; ref kunci API OpenAI langsung dan
    Azure untuk model ini tetap disembunyikan.
    </Warning>

    <Note>
    Prefiks model Codex lama adalah konfigurasi lama yang diperbaiki oleh doctor. Untuk
    penyiapan umum langganan plus runtime native, masuk dengan auth Codex
    tetapi pertahankan ref model sebagai `openai/gpt-5.5`. Konfigurasi baru harus menaruh urutan
    auth agen OpenAI di bawah `auth.order.openai`; doctor memigrasikan entri
    urutan auth Codex lama yang lebih lawas.
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

    Dengan cadangan kunci API, pertahankan model pada `openai/gpt-5.5` dan taruh
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
            "openai:user@example.com",
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

    Gunakan perintah berikut untuk melihat model, runtime, dan rute auth mana yang digunakan agen default
    Anda:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Untuk agen tertentu, tambahkan `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Jika konfigurasi lama masih memiliki ref GPT Codex lama atau pin sesi runtime
    OpenAI usang tanpa konfigurasi runtime eksplisit, perbaiki:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Jika `models auth list --provider openai` tidak menampilkan profil yang dapat digunakan, masuk
    lagi:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Gunakan `--profile-id` ketika Anda menginginkan beberapa login OAuth Codex dalam agen
    yang sama dan nantinya ingin mengontrolnya melalui urutan auth atau `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` adalah rute model untuk giliran agen OpenAI melalui Codex. Jalankan
    `openclaw doctor --fix` untuk memigrasikan id profil prefiks OpenAI Codex lama yang usang dan
    entri urutan sebelum mengandalkan urutan profil.

    ### Indikator status

    Chat `/status` menampilkan runtime model mana yang aktif untuk sesi saat ini.
    Harness app-server Codex bawaan muncul sebagai `Runtime: OpenAI Codex` untuk
    giliran model agen OpenAI. Pin sesi runtime OpenAI usang diperbaiki ke Codex kecuali
    konfigurasi secara eksplisit mem-pin OpenClaw.

    ### Peringatan doctor

    Jika ref model Codex lama atau pin runtime OpenAI usang masih ada di konfigurasi atau
    status sesi, `openclaw doctor --fix` menulis ulang semuanya ke `openai/*` dengan
    runtime Codex kecuali OpenClaw dikonfigurasi secara eksplisit.

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
          openai: {
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
    tersedia. Jika penemuan Codex langsung menghilangkan baris `gpt-5.5` sementara
    akun sudah diautentikasi, OpenClaw menyintesis baris model OAuth tersebut sehingga
    Cron, sub-agen, dan eksekusi model default terkonfigurasi tidak gagal dengan
    `Unknown model`.

  </Tab>
</Tabs>

## Autentikasi app-server Codex native

Harness app-server Codex native menggunakan ref model `openai/*` ditambah konfigurasi
runtime yang dihilangkan atau `agentRuntime.id: "codex"` provider/model, tetapi auth-nya
tetap berbasis akun. OpenClaw memilih auth dalam urutan ini:

1. Profil auth OpenAI berurutan untuk agen, sebaiknya di bawah
   `auth.order.openai`. Jalankan `openclaw doctor --fix` untuk memigrasikan
   id profil auth Codex lama yang usang dan urutan auth Codex lama.
2. Akun app-server yang sudah ada, seperti login ChatGPT CLI Codex lokal.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika app-server melaporkan tidak ada akun dan masih memerlukan
   auth OpenAI.

Itu berarti login langganan ChatGPT/Codex lokal tidak diganti hanya
karena proses Gateway juga memiliki `OPENAI_API_KEY` untuk model OpenAI langsung
atau embedding. Fallback kunci API env hanya jalur stdio lokal tanpa akun; itu
tidak dikirim ke koneksi app-server WebSocket. Ketika profil Codex bergaya langganan
dipilih, OpenClaw juga menjauhkan `CODEX_API_KEY` dan `OPENAI_API_KEY`
dari child app-server stdio yang dijalankan dan mengirim kredensial terpilih
melalui RPC login app-server. Ketika profil langganan tersebut diblokir oleh
batas penggunaan Codex, OpenClaw dapat berotasi ke profil kunci API `openai:*`
berurutan berikutnya tanpa mengubah model yang dipilih atau keluar dari harness
Codex. Setelah waktu reset langganan lewat, profil langganan tersebut
memenuhi syarat lagi.

## Pembuatan gambar

Plugin `openai` bawaan mendaftarkan pembuatan gambar melalui tool `image_generate`.
Plugin ini mendukung pembuatan gambar kunci API OpenAI dan pembuatan gambar OAuth Codex
melalui ref model `openai/gpt-image-2` yang sama.

| Kemampuan                | Kunci API OpenAI                  | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref model                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | Masuk OpenAI Codex OAuth             |
| Transport                 | API OpenAI Images                  | Backend Codex Responses              |
| Maks. gambar per permintaan | 4                                | 4                                    |
| Mode edit                 | Diaktifkan (hingga 5 gambar referensi) | Diaktifkan (hingga 5 gambar referensi) |
| Penggantian ukuran        | Didukung, termasuk ukuran 2K/4K    | Didukung, termasuk ukuran 2K/4K      |
| Rasio aspek / resolusi    | Tidak diteruskan ke API OpenAI Images | Dipetakan ke ukuran yang didukung saat aman |

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

`gpt-image-2` adalah default untuk pembuatan gambar dari teks OpenAI dan
pengeditan gambar. `gpt-image-1.5`, `gpt-image-1`, dan `gpt-image-1-mini` tetap dapat digunakan sebagai
penggantian model eksplisit. Gunakan `openai/gpt-image-1.5` untuk keluaran PNG/WebP
berlatar belakang transparan; API `gpt-image-2` saat ini menolak
`background: "transparent"`.

Untuk permintaan berlatar belakang transparan, agen harus memanggil `image_generate` dengan
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` atau `"webp"`, dan
`background: "transparent"`; opsi penyedia `openai.background` yang lebih lama
masih diterima. OpenClaw juga melindungi rute publik OpenAI dan
OpenAI Codex OAuth dengan menulis ulang permintaan transparan default
`openai/gpt-image-2` menjadi `gpt-image-1.5`; Azure dan endpoint kustom yang kompatibel dengan OpenAI tetap
menggunakan nama deployment/model yang dikonfigurasi.

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
Gunakan `--quality low|medium|high|auto` saat Anda perlu mengontrol kualitas dan biaya
OpenAI Images. Gunakan `--openai-moderation low|auto` untuk meneruskan petunjuk
moderasi khusus penyedia OpenAI dari `image generate` atau `image edit`.

Untuk instalasi ChatGPT/Codex OAuth, pertahankan ref `openai/gpt-image-2` yang sama. Saat profil OAuth
`openai` dikonfigurasi, OpenClaw menyelesaikan token akses OAuth tersimpan tersebut
dan mengirim permintaan gambar melalui backend Codex Responses. OpenClaw
tidak lebih dulu mencoba `OPENAI_API_KEY` atau diam-diam kembali ke kunci API untuk
permintaan tersebut. Konfigurasikan `models.providers.openai` secara eksplisit dengan kunci API,
URL dasar kustom, atau endpoint Azure saat Anda menginginkan rute API OpenAI Images
langsung.
Jika endpoint gambar kustom tersebut berada di alamat LAN/pribadi tepercaya, tetapkan juga
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw tetap memblokir
endpoint gambar privat/internal yang kompatibel dengan OpenAI kecuali opt-in ini
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

Plugin bawaan `openai` mendaftarkan pembuatan video melalui alat `video_generate`.

| Kemampuan       | Nilai                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Model default    | `openai/sora-2`                                                                   |
| Mode             | Teks-ke-video, gambar-ke-video, edit satu video                                   |
| Input referensi | 1 gambar atau 1 video                                                             |
| Penggantian ukuran | Didukung untuk teks-ke-video dan gambar-ke-video                                |
| Penggantian lain | `aspectRatio`, `resolution`, `audio`, `watermark` diabaikan dengan peringatan alat |

Permintaan gambar-ke-video OpenAI menggunakan `POST /v1/videos` dengan
`input_reference` gambar. Edit satu video menggunakan `POST /v1/videos/edits` dengan
video yang diunggah di bidang `video`.

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

OpenClaw menambahkan kontribusi prompt GPT-5 bersama untuk eksekusi keluarga GPT-5 pada permukaan prompt yang dirakit OpenClaw. Ini berlaku berdasarkan id model, sehingga rute OpenClaw/penyedia seperti ref lama pra-perbaikan (ref GPT-5.5 Codex lama), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, dan ref GPT-5 kompatibel lainnya menerima overlay yang sama. Model GPT-4.x yang lebih lama tidak.

Harness Codex native bawaan tidak menerima overlay GPT-5 OpenClaw ini melalui instruksi developer app-server Codex. Codex native tetap mempertahankan perilaku dasar, model, dan dokumen proyek milik Codex, sementara OpenClaw menonaktifkan kepribadian bawaan Codex untuk thread native agar file kepribadian workspace agen tetap otoritatif. OpenClaw hanya menyumbangkan konteks runtime seperti pengiriman channel, alat dinamis OpenClaw, delegasi ACP, konteks workspace, dan Skills OpenClaw.

Kontribusi GPT-5 menambahkan kontrak perilaku bertag untuk persistensi persona, keamanan eksekusi, disiplin alat, bentuk keluaran, pemeriksaan penyelesaian, dan verifikasi pada prompt rakitan OpenClaw yang cocok. Perilaku balasan khusus channel dan pesan senyap tetap berada di prompt sistem OpenClaw bersama dan kebijakan pengiriman keluar. Lapisan gaya interaksi ramah terpisah dan dapat dikonfigurasi.

| Nilai                  | Efek                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (default) | Mengaktifkan lapisan gaya interaksi ramah |
| `"on"`                 | Alias untuk `"friendly"`                      |
| `"off"`                | Menonaktifkan hanya lapisan gaya ramah       |

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
Nilai tidak peka huruf besar-kecil saat runtime, jadi `"Off"` dan `"off"` sama-sama menonaktifkan lapisan gaya ramah.
</Tip>

<Note>
`plugins.entries.openai.config.personality` lama masih dibaca sebagai fallback kompatibilitas saat pengaturan bersama `agents.defaults.promptOverlays.gpt5.personality` tidak ditetapkan.
</Note>

## Suara dan ucapan

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Plugin bawaan `openai` mendaftarkan sintesis ucapan untuk permukaan `messages.tts`.

    | Pengaturan | Jalur konfigurasi | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Suara | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Kecepatan | `messages.tts.providers.openai.speed` | (belum ditetapkan) |
    | Instruksi | `messages.tts.providers.openai.instructions` | (belum ditetapkan, hanya `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` untuk catatan suara, `mp3` untuk file |
    | Kunci API | `messages.tts.providers.openai.apiKey` | Fallback ke `OPENAI_API_KEY` |
    | URL dasar | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Body ekstra | `messages.tts.providers.openai.extraBody` / `extra_body` | (belum ditetapkan) |

    Model yang tersedia: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Suara yang tersedia: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` digabungkan ke JSON permintaan `/audio/speech` setelah bidang yang dibuat OpenClaw, jadi gunakan ini untuk endpoint yang kompatibel dengan OpenAI yang memerlukan kunci tambahan seperti `lang`. Kunci prototipe diabaikan.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Tetapkan `OPENAI_TTS_BASE_URL` untuk mengganti URL dasar TTS tanpa memengaruhi endpoint API chat. OpenAI TTS dan suara Realtime sama-sama dikonfigurasi melalui kunci API OpenAI Platform; instalasi khusus OAuth masih dapat menggunakan model chat berbasis Codex, tetapi tidak dapat menggunakan talk-back langsung OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin bawaan `openai` mendaftarkan speech-to-text batch melalui
    permukaan transkripsi pemahaman media OpenClaw.

    - Model default: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
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

  <Accordion title="Realtime transcription">
    Plugin bawaan `openai` mendaftarkan transkripsi realtime untuk Plugin Voice Call.

    | Pengaturan | Jalur konfigurasi | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Bahasa | `...openai.language` | (belum ditetapkan) |
    | Prompt | `...openai.prompt` | (belum ditetapkan) |
    | Durasi hening | `...openai.silenceDurationMs` | `800` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY`, atau OAuth `openai` | Kunci API terhubung langsung; OAuth membuat rahasia klien transkripsi Realtime |

    <Note>
    Menggunakan koneksi WebSocket ke `wss://api.openai.com/v1/realtime` dengan audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Saat hanya OAuth `openai` yang dikonfigurasi, Gateway membuat rahasia klien transkripsi Realtime sementara sebelum membuka WebSocket. Penyedia streaming ini untuk jalur transkripsi realtime Voice Call; suara Discord saat ini merekam segmen pendek dan menggunakan jalur transkripsi batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Plugin bawaan `openai` mendaftarkan suara realtime untuk Plugin Voice Call.

    | Pengaturan | Jalur konfigurasi | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Suara | `...openai.voice` | `alloy` |
    | Temperature (jembatan deployment Azure) | `...openai.temperature` | `0.8` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Durasi hening | `...openai.silenceDurationMs` | `500` |
    | Padding prefiks | `...openai.prefixPaddingMs` | `300` |
    | Upaya penalaran | `...openai.reasoningEffort` | (belum diatur) |
    | Autentikasi | profil autentikasi kunci API `openai`, `...openai.apiKey`, atau `OPENAI_API_KEY` | Kunci API OpenAI Platform diperlukan; OAuth OpenAI tidak mengonfigurasi suara Realtime |

    Suara Realtime bawaan yang tersedia untuk `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI merekomendasikan `marin` dan `cedar` untuk kualitas Realtime terbaik. Ini
    adalah set terpisah dari suara Text-to-speech di atas; jangan berasumsi suara TTS
    seperti `fable`, `nova`, atau `onyx` valid untuk sesi Realtime.

    <Note>
    Jembatan realtime backend OpenAI menggunakan bentuk sesi WebSocket Realtime GA, yang tidak menerima `session.temperature`. Deployment Azure OpenAI tetap tersedia melalui `azureEndpoint` dan `azureDeployment` serta mempertahankan bentuk sesi yang kompatibel dengan deployment. Mendukung pemanggilan alat dua arah dan audio G.711 u-law.
    </Note>

    <Note>
    Suara Realtime dipilih saat sesi dibuat. OpenAI mengizinkan sebagian besar
    field sesi diubah kemudian, tetapi suara tidak dapat diubah setelah
    model mengeluarkan audio dalam sesi tersebut. OpenClaw saat ini mengekspos
    id suara Realtime bawaan sebagai string.
    </Note>

    <Note>
    Control UI Talk menggunakan sesi realtime browser OpenAI dengan rahasia klien
    sementara yang dicetak Gateway dan pertukaran SDP WebRTC browser langsung terhadap
    OpenAI Realtime API. Gateway mencetak rahasia klien tersebut dengan profil
    autentikasi kunci API `openai` yang dipilih atau kunci API OpenAI Platform yang dikonfigurasi. Relay Gateway
    dan jembatan WebSocket realtime backend Voice Call menggunakan jalur autentikasi
    khusus kunci API yang sama untuk endpoint OpenAI native. Verifikasi live maintainer
    tersedia dengan
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    kaki OpenAI memverifikasi jembatan WebSocket backend dan pertukaran
    SDP WebRTC browser tanpa mencatat rahasia.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Provider `openai` bawaan dapat menargetkan resource Azure OpenAI untuk pembuatan
gambar dengan menimpa URL dasar. Pada jalur pembuatan gambar, OpenClaw
mendeteksi hostname Azure pada `models.providers.openai.baseUrl` dan beralih ke
bentuk permintaan Azure secara otomatis.

<Note>
Suara Realtime menggunakan jalur konfigurasi terpisah
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
dan tidak dipengaruhi oleh `models.providers.openai.baseUrl`. Lihat akordeon
**Suara Realtime** di bawah [Suara dan ucapan](#voice-and-speech) untuk
pengaturan Azure-nya.
</Note>

Gunakan Azure OpenAI ketika:

- Anda sudah memiliki langganan, kuota, atau perjanjian enterprise Azure OpenAI
- Anda memerlukan residensi data regional atau kontrol kepatuhan yang disediakan Azure
- Anda ingin mempertahankan traffic di dalam tenancy Azure yang sudah ada

### Konfigurasi

Untuk pembuatan gambar Azure melalui provider `openai` bawaan, arahkan
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

OpenClaw mengenali sufiks host Azure ini untuk rute pembuatan gambar Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Untuk permintaan pembuatan gambar pada host Azure yang dikenali, OpenClaw:

- Mengirim header `api-key` alih-alih `Authorization: Bearer`
- Menggunakan path yang dicakup deployment (`/openai/deployments/{deployment}/...`)
- Menambahkan `?api-version=...` ke setiap permintaan
- Menggunakan timeout permintaan default 600 detik untuk panggilan pembuatan gambar Azure.
  Nilai `timeoutMs` per panggilan tetap menimpa default ini.

URL dasar lain (OpenAI publik, proxy yang kompatibel dengan OpenAI) mempertahankan
bentuk permintaan gambar OpenAI standar.

<Note>
Routing Azure untuk jalur pembuatan gambar provider `openai` memerlukan
OpenClaw 2026.4.22 atau yang lebih baru. Versi sebelumnya memperlakukan
`openai.baseUrl` kustom apa pun seperti endpoint OpenAI publik dan akan gagal
terhadap deployment gambar Azure.
</Note>

### Versi API

Atur `AZURE_OPENAI_API_VERSION` untuk menyematkan versi preview atau GA Azure tertentu
untuk jalur pembuatan gambar Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Default-nya adalah `2024-12-01-preview` ketika variabel tidak diatur.

### Nama model adalah nama deployment

Azure OpenAI mengikat model ke deployment. Untuk permintaan pembuatan gambar Azure
yang dirutekan melalui provider `openai` bawaan, field `model` di OpenClaw
harus berupa **nama deployment Azure** yang Anda konfigurasikan di portal Azure, bukan
id model OpenAI publik.

Jika Anda membuat deployment bernama `gpt-image-2-prod` yang menyajikan `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Aturan nama deployment yang sama berlaku untuk panggilan pembuatan gambar yang dirutekan melalui
provider `openai` bawaan.

### Ketersediaan regional

Pembuatan gambar Azure saat ini hanya tersedia di sebagian wilayah
(misalnya `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Periksa daftar wilayah Microsoft saat ini sebelum membuat
deployment, dan konfirmasi model tertentu ditawarkan di wilayah Anda.

### Perbedaan parameter

Azure OpenAI dan OpenAI publik tidak selalu menerima parameter gambar yang sama.
Azure dapat menolak opsi yang diizinkan OpenAI publik (misalnya nilai
`background` tertentu pada `gpt-image-2`) atau mengeksposnya hanya pada versi
model tertentu. Perbedaan ini berasal dari Azure dan model yang mendasarinya,
bukan OpenClaw. Jika permintaan Azure gagal dengan error validasi, periksa
set parameter yang didukung oleh deployment dan versi API spesifik Anda di
portal Azure.

<Note>
Azure OpenAI menggunakan transport native dan perilaku kompatibilitas tetapi tidak menerima
header atribusi tersembunyi OpenClaw — lihat akordeon **Rute native vs kompatibel OpenAI**
di bawah [Konfigurasi lanjutan](#advanced-configuration).

Untuk traffic chat atau Responses di Azure (di luar pembuatan gambar), gunakan
alur onboarding atau konfigurasi provider Azure khusus — `openai.baseUrl` saja
tidak mengambil bentuk API/autentikasi Azure. Provider
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

    Dokumen OpenAI terkait:
    - [Realtime API dengan WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respons Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Fast mode">
    OpenClaw mengekspos toggle mode cepat bersama untuk `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Konfigurasi:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Saat diaktifkan, OpenClaw memetakan mode cepat ke pemrosesan prioritas OpenAI (`service_tier = "priority"`). Nilai `service_tier` yang sudah ada dipertahankan, dan mode cepat tidak menulis ulang `reasoning` atau `text.verbosity`. `fastMode: "auto"` memulai panggilan model baru secara cepat hingga batas otomatis, lalu memulai panggilan percobaan ulang, fallback, hasil alat, atau lanjutan berikutnya tanpa mode cepat. Batas default adalah 60 detik; atur `params.fastAutoOnSeconds` pada model aktif untuk mengubahnya.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Override sesi mengalahkan konfigurasi. Menghapus override sesi di Sessions UI mengembalikan sesi ke default yang dikonfigurasi.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
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
    `serviceTier` hanya diteruskan ke endpoint OpenAI native (`api.openai.com`) dan endpoint Codex native (`chatgpt.com/backend-api`). Jika Anda merutekan salah satu provider melalui proxy, OpenClaw membiarkan `service_tier` tidak tersentuh.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Untuk model OpenAI Responses langsung (`openai/*` pada `api.openai.com`), wrapper stream OpenClaw milik Plugin OpenAI mengaktifkan Compaction sisi server secara otomatis:

    - Memaksa `store: true` (kecuali kompatibilitas model mengatur `supportsStore: false`)
    - Menyuntikkan `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Default `compact_threshold`: 70% dari `contextWindow` (atau `80000` jika tidak tersedia)

    Ini berlaku untuk jalur runtime OpenClaw bawaan dan hook provider OpenAI yang digunakan oleh run tertanam. Harness app-server Codex native mengelola konteksnya sendiri melalui Codex dan dikonfigurasi oleh rute agen default OpenAI atau kebijakan runtime provider/model.

    <Tabs>
      <Tab title="Enable explicitly">
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
      <Tab title="Custom threshold">
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
      <Tab title="Disable">
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
    `responsesServerCompaction` hanya mengontrol injeksi `context_management`. Model OpenAI Responses langsung tetap memaksa `store: true` kecuali kompatibilitas mengatur `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentik ketat">
    Untuk eksekusi keluarga GPT-5 pada `openai/*`, OpenClaw dapat menggunakan kontrak eksekusi tertanam yang lebih ketat:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Dengan `strict-agentic`, OpenClaw:
    - Mengaktifkan otomatis `update_plan` untuk pekerjaan substansial
    - Mencoba ulang giliran yang kosong secara struktural atau hanya berisi penalaran dengan kelanjutan jawaban yang terlihat
    - Menggunakan peristiwa rencana harness eksplisit saat harness yang dipilih menyediakannya

    OpenClaw tidak mengklasifikasikan prosa asisten untuk memutuskan apakah suatu giliran adalah rencana, pembaruan progres, atau jawaban akhir.

    <Note>
    Dicakup hanya untuk eksekusi keluarga OpenAI dan Codex GPT-5. Penyedia lain dan keluarga model lama mempertahankan perilaku default.
    </Note>

  </Accordion>

  <Accordion title="Rute native vs kompatibel OpenAI">
    OpenClaw memperlakukan endpoint OpenAI langsung, Codex, dan Azure OpenAI secara berbeda dari proxy `/v1` generik yang kompatibel dengan OpenAI:

    **Rute native** (`openai/*`, Azure OpenAI):
    - Mempertahankan `reasoning: { effort: "none" }` hanya untuk model yang mendukung upaya OpenAI `none`
    - Menghilangkan penalaran yang dinonaktifkan untuk model atau proxy yang menolak `reasoning.effort: "none"`
    - Menetapkan skema alat default ke mode ketat
    - Melampirkan header atribusi tersembunyi hanya pada host native yang terverifikasi
    - Mempertahankan pembentukan permintaan khusus OpenAI (`service_tier`, `store`, kompatibilitas penalaran, petunjuk cache prompt)

    **Rute proxy/kompatibel:**
    - Menggunakan perilaku kompatibilitas yang lebih longgar
    - Menghapus Completions `store` dari payload `openai-completions` non-native
    - Menerima JSON penerusan `params.extra_body`/`params.extraBody` lanjutan untuk proxy Completions yang kompatibel dengan OpenAI
    - Menerima `params.chat_template_kwargs` untuk proxy Completions yang kompatibel dengan OpenAI seperti vLLM
    - Tidak memaksakan skema alat ketat atau header khusus native

    Azure OpenAI menggunakan transport native dan perilaku kompatibilitas tetapi tidak menerima header atribusi tersembunyi.

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
