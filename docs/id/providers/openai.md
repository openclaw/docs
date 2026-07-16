---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda ingin autentikasi langganan Codex alih-alih kunci API
    - Anda memerlukan perilaku eksekusi agen GPT-5 yang lebih ketat
summary: Gunakan OpenAI melalui kunci API atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T18:34:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw menggunakan satu id penyedia, `openai`, untuk autentikasi kunci API langsung dan
autentikasi langganan ChatGPT/Codex. `openai/*` adalah rute model kanonis.
Untuk giliran agen tertanam dengan kebijakan runtime yang tidak ditetapkan atau `auto`, fakta rute
OpenAI menentukan apakah OpenClaw dapat memilih runtime app-server Codex bawaan
secara implisit. Prefiks `openai/*` saja tidak memilih runtime.

- **Model agen** - `openai/*` melalui runtime yang dipilih oleh konfigurasi
  `agentRuntime` eksplisit atau kebijakan rute implisit OpenAI. Masuk dengan autentikasi Codex
  untuk menggunakan langganan ChatGPT/Codex, atau konfigurasikan profil autentikasi
  kunci API jika Anda menginginkan penagihan berbasis kunci.
- **API OpenAI non-agen** - akses langsung ke OpenAI Platform, ditagih per penggunaan,
  melalui `OPENAI_API_KEY` atau profil autentikasi kunci API `openai`.
- **Konfigurasi lama** - referensi `codex/*` dan `openai-codex/*` diperbaiki menjadi
  `openai/*` ditambah `agentRuntime.id: "codex"` yang tercakup pada model oleh
  `openclaw doctor --fix`.

OpenAI secara eksplisit mendukung penggunaan OAuth langganan dalam alat eksternal dan
alur kerja seperti OpenClaw.

## Pelacakan penggunaan dan biaya

OpenClaw memisahkan kuota langganan dan penagihan API Platform:

- OAuth ChatGPT/Codex menampilkan paket langganan, jendela kuota, dan saldo kredit.
- `OPENAI_ADMIN_KEY` menampilkan biaya organisasi dan penggunaan penyelesaian selama 30 hari yang dilaporkan penyedia dalam **Penggunaan** di Control UI, termasuk pengeluaran harian, total permintaan/token, model teratas, dan kategori biaya.
- `OPENAI_PROJECT_ID` secara opsional membatasi riwayat Admin API ke satu proyek.
- OpenClaw tidak pernah mengirim `OPENAI_API_KEY` atau profil inferensi `openai` ke API organisasi; kredensial tersebut mungkin dimiliki oleh endpoint kustom, Azure, atau endpoint lokal agen.

Kunci Admin eksplisit lebih diutamakan daripada OAuth. Riwayat yang dilaporkan penyedia tidak digabungkan dengan perkiraan biaya OpenClaw yang berasal dari sesi; riwayat tersebut dapat mencakup aktivitas API dari klien lain dan penyesuaian penagihan dari pihak penyedia.

Dokumentasi [Dasbor Penggunaan API](https://help.openai.com/en/articles/10478918) OpenAI menjelaskan persyaratan pemilik organisasi dan izin Usage Dashboard eksplisit untuk data penggunaan.

Penyedia, model, runtime, dan kanal adalah lapisan yang terpisah. Jika label-label tersebut
tercampur, baca [Runtime agen](/id/concepts/agent-runtimes) sebelum
mengubah konfigurasi.

## Pilihan cepat

| Tujuan                                            | Gunakan                                                            | Catatan                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Langganan ChatGPT/Codex, runtime Codex native     | `openai/gpt-5.6-sol`                                               | Penyiapan langganan baru; masuk dengan autentikasi Codex.            |
| Penagihan kunci API langsung untuk giliran agen   | `openai/gpt-5.6` ditambah profil autentikasi kunci API berurutan   | Penyiapan kunci API baru; id API langsung tanpa penentu mengarah ke Sol. |
| Memilih tingkat GPT-5.6 yang tepat                | `openai/gpt-5.6-sol`, `-terra`, atau `-luna`     | Periksa `models list` untuk tingkat yang tersedia bagi akun ini. |
| Akun tanpa akses GPT-5.6                          | `openai/gpt-5.5`                                                   | Pilihan pemulihan eksplisit; OpenClaw tidak menurunkan versi secara diam-diam. |
| Penagihan kunci API langsung, runtime OpenClaw eksplisit | `openai/gpt-5.6` ditambah `agentRuntime.id: "openclaw"` penyedia/model | Pilih profil kunci API `openai` biasa.                     |
| Alias model ChatGPT Instant terbaru               | `openai/chat-latest`                                               | Hanya kunci API langsung; alias bergerak, bukan default stabil.      |
| Pembuatan atau pengeditan gambar                  | `openai/gpt-image-2`                                               | Berfungsi dengan `OPENAI_API_KEY` atau OAuth Codex.                |
| Gambar dengan latar belakang transparan           | `openai/gpt-image-1.5`                                             | Tetapkan `outputFormat` ke `png` atau `webp` dan `background=transparent`. |

## Peta penamaan

| Nama yang Anda lihat                     | Lapisan           | Arti                                                                                     |
| ---------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                       | Prefiks penyedia  | Rute model OpenAI kanonis; fakta rute menentukan runtime implisit.                       |
| Plugin `codex`                | Plugin            | Plugin bawaan yang menyediakan runtime app-server Codex native dan kontrol obrolan `/codex`. |
| `agentRuntime.id: codex` penyedia/model        | Runtime agen      | Memaksa harness app-server Codex native untuk giliran tertanam yang cocok.               |
| `/codex ...`                       | Set perintah obrolan | Mengikat/mengontrol utas app-server Codex dari percakapan.                            |
| `runtime: "acp", agentId: "codex"`                       | Rute sesi ACP     | Jalur fallback eksplisit yang menjalankan Codex melalui ACP/acpx.                        |

## Runtime agen implisit

Saat kebijakan `agentRuntime` penyedia/model tidak ditetapkan atau `auto`, kebijakan rute
milik penyedia OpenAI memilih runtime implisit berdasarkan
endpoint dan adaptor efektif:

| Fakta rute efektif                                                                                                                                                       | Runtime implisit       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Endpoint HTTPS Platform resmi yang tepat dengan `openai-responses`, atau endpoint HTTPS ChatGPT resmi yang tepat dengan `openai-chatgpt-responses`; tanpa penggantian permintaan buatan pengguna | Codex dapat dipilih |
| Adaptor `openai-completions` buatan pengguna                                                                                                                             | OpenClaw               |
| Endpoint kustom                                                                                                                                                         | OpenClaw               |
| Endpoint resmi tepat yang menggunakan HTTP secara eksplisit                                                                                                            | Ditolak                |
| Rute dengan penggantian permintaan penyedia/model buatan pengguna                                                                                                      | OpenClaw               |

`agentRuntime.id` penyedia/model non-default yang eksplisit tetap menjadi acuan.
Misalnya, `agentRuntime.id: "openclaw"` mempertahankan rute yang sebenarnya memenuhi syarat Codex
pada OpenClaw, sedangkan `agentRuntime.id: "codex"` mewajibkan Codex dan gagal
secara tertutup ketika rute efektif tidak dinyatakan kompatibel dengan Codex.
Pemilihan runtime tidak mengubah jenis kredensial atau penagihan: autentikasi kunci API
Platform dan autentikasi langganan ChatGPT/Codex tetap terpisah.

`openclaw doctor --fix` memigrasikan referensi model `codex/*` dan `openai-codex/*`
lama, id profil autentikasi Codex lama, serta entri urutan autentikasi Codex lama ke
rute kanonis `openai`. Referensi model yang dimigrasikan menerima
`agentRuntime.id: "codex"` yang tercakup pada model; gunakan `auth.order.openai` untuk konfigurasi urutan autentikasi baru.

<Note>
Penyiapan OpenAI baru menerapkan model utama GPT-5.6 hanya jika tidak ada model utama yang
dikonfigurasi. Menambahkan atau memperbarui autentikasi OpenAI mempertahankan pilihan eksplisit
yang sudah ada, termasuk `openai/gpt-5.5`, kecuali Anda secara eksplisit menggunakan
`models auth login --set-default` atau `models set`. Gunakan profil autentikasi kunci API
hanya jika Anda menginginkan autentikasi kunci API untuk model agen.
</Note>

## Pratinjau terbatas GPT-5.6

OpenClaw mengenali id model `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra`, dan `openai/gpt-5.6-luna` secara tepat. Ketiganya menyediakan
penalaran `xhigh` dan `max` dalam katalog saat ini. OpenAI menjelaskan Sol sebagai
tingkat unggulan, Terra sebagai tingkat seimbang, dan Luna sebagai tingkat cepat
dengan biaya lebih rendah. Lihat
[pengumuman peluncuran GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
dan [panduan akses](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Dengan autentikasi kunci API OpenAI langsung, id `openai/gpt-5.6` tanpa penentu merupakan alias untuk
Sol dan menjadi default penyiapan baru. Katalog Codex native tidak menerapkan
alias API langsung tersebut di sisi klien; bergantung pada akses ruang kerja, katalog dapat menampilkan
id Sol, Terra, dan Luna yang tepat. Oleh karena itu, penyiapan OAuth ChatGPT/Codex baru
menggunakan `openai/gpt-5.6-sol`. Periksa akun saat ini dengan:

```bash
openclaw models list --provider openai
```

Akses organisasi API dan ruang kerja Codex dapat berbeda. Jika GPT-5.6 tidak
tersedia, pilih GPT-5.5 secara eksplisit:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw menampilkan kesalahan akses upstream dan tidak secara diam-diam mengganti
pilihan GPT-5.6 dengan GPT-5.5.

<Note>
Rute HTTPS resmi yang tepat dan memenuhi syarat dapat memilih Plugin app-server Codex
bawaan saat kebijakan runtime tidak ditetapkan atau `auto`; rute Completions buatan pengguna,
endpoint kustom, dan penggantian transportasi permintaan tetap menggunakan OpenClaw. Endpoint
HTTP teks biasa resmi ditolak. Konfigurasi runtime penyedia/model eksplisit tetap
menjadi acuan. Jalankan `openclaw doctor --fix` untuk memperbaiki referensi model Codex lama,
referensi `codex-cli/*`, atau pin sesi runtime lama yang tidak ditetapkan oleh
konfigurasi runtime eksplisit.
</Note>

## Cakupan fitur OpenClaw

| Kapabilitas OpenAI         | Permukaan OpenClaw                                                                              | Status                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Chat / Responses          | penyedia model `openai/<model>`                                                               | Ya                                                             |
| Model langganan Codex | `openai/<model>` dengan OAuth OpenAI                                                            | Ya                                                             |
| Referensi model Codex lama   | referensi model Codex lama, `codex-cli/<model>`                                                     | Diperbaiki oleh doctor menjadi `openai/<model>`                          |
| Harness app-server Codex  | Rute HTTPS yang kompatibel dengan Codex dengan runtime tidak ditetapkan/`auto`, atau `agentRuntime.id: codex` eksplisit  | Ya                                                             |
| Pencarian web sisi server    | Alat OpenAI Responses native                                                                  | Ya, ketika pencarian web diaktifkan dan tidak ada penyedia lain yang disematkan |
| Gambar                    | `image_generate`                                                                              | Ya                                                             |
| Video                    | `video_generate`                                                                              | Ya                                                             |
| Teks ke ucapan            | `messages.tts.provider: "openai"` / `tts`                                                     | Ya                                                             |
| Ucapan ke teks secara batch      | `tools.media.audio` / pemahaman media                                                     | Ya                                                             |
| Ucapan ke teks secara streaming  | Voice Call `streaming.provider: "openai"`                                                     | Ya                                                             |
| Suara waktu nyata            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Ya (kunci API OpenAI Platform)                                   |
| Embedding                | penyedia embedding memori                                                                     | Ya                                                             |

<Note>
Suara OpenAI Realtime melalui **OpenAI Platform Realtime
API** publik dan memerlukan kunci API Platform. Token OAuth Codex mengautentikasi
backend ChatGPT Codex sebagai gantinya; token tersebut tidak dapat dipertukarkan dengan kunci API
Platform untuk endpoint Realtime publik.

Jika autentikasi kunci API melaporkan bahwa penagihan tidak tersedia, tambahkan kredit Platform di
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
untuk organisasi yang mendukung kredensial waktu nyata Anda saat menggunakan autentikasi
kunci API. Suara waktu nyata menerima profil autentikasi kunci API `openai` yang dibuat oleh
`openclaw onboard --auth-choice openai-api-key`, kunci API Platform yang ditetapkan melalui
`talk.realtime.providers.openai.apiKey` untuk Control UI Talk, atau
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` untuk Voice
Call, atau variabel lingkungan `OPENAI_API_KEY`.
</Note>

## Embedding memori

OpenClaw dapat menggunakan OpenAI, atau endpoint embedding yang kompatibel dengan OpenAI, untuk
pengindeksan dan embedding kueri `memory_search`:

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

Untuk endpoint yang kompatibel dengan OpenAI yang memerlukan label embedding asimetris, tetapkan
`queryInputType` dan `documentInputType` di bawah `memorySearch`. OpenClaw
meneruskannya sebagai bidang permintaan `input_type` khusus penyedia: embedding
kueri menggunakan `queryInputType`; potongan memori terindeks dan pengindeksan batch menggunakan
`documentInputType`. Lihat
[Referensi konfigurasi memori](/id/reference/memory-config#provider-specific-config)
untuk contoh lengkap.

## Memulai

<Tabs>
  <Tab title="Kunci API (OpenAI Platform)">
    **Paling sesuai untuk:** akses API langsung dan penagihan berdasarkan penggunaan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat atau salin kunci API dari [dasbor OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Atau teruskan kunci secara langsung:

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

    | Referensi model        | Kebijakan runtime atau fakta rute                                 | Rute                     | Autentikasi                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | tidak ditetapkan/`auto`, rute native HTTPS resmi yang sama persis, tanpa penggantian permintaan | Codex dapat dipilih     | Profil autentikasi kunci API terurut      |
    | `openai/gpt-5.6` | penyedia/model `agentRuntime.id: "openclaw"`                  | Runtime tertanam OpenClaw | Profil kunci API `openai` yang dipilih |
    | `openai/gpt-5.5` | penyedia/model `agentRuntime.id` eksplisit                     | Runtime agen yang dipilih    | Profil kunci API OpenAI yang dipilih   |
    | `openai/*`       | Completions yang ditulis, kustom, atau penggantian permintaan | Runtime tertanam OpenClaw | Jenis kredensial tetap tidak berubah |
    | `openai/*`       | endpoint HTTP resmi berupa teks biasa                  | Ditolak                 | Kredensial tidak dikirim             |

    <Note>
    Saat runtime tidak ditetapkan atau `auto`, hanya rute native HTTPS resmi yang sama persis
    dan memenuhi syarat yang dapat memilih harness app-server Codex secara implisit. Untuk autentikasi kunci API
    pada model agen, buat profil autentikasi kunci API `openai` dan urutkan dengan
    `auth.order.openai`; `OPENAI_API_KEY` tetap menjadi fallback langsung untuk
    permukaan API OpenAI non-agen. Jalankan `openclaw doctor --fix` untuk memigrasikan entri
    urutan autentikasi Codex lama.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    ID `gpt-5.6` API langsung tanpa prefiks diselesaikan ke tingkatan Sol. Jika organisasi API ini
    tidak menyediakan GPT-5.6, tetapkan model utama ke
    `openai/gpt-5.5` secara eksplisit.

    Untuk mencoba model Instant ChatGPT saat ini dari API OpenAI, tetapkan model
    ke `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` adalah alias yang terus berubah. Penyiapan baru dengan kunci API OpenAI menggunakan
    `openai/gpt-5.6` sebagai gantinya, yang ID API langsung tanpa prefiksnya diselesaikan ke Sol. Model utama
    eksplisit yang sudah ada, termasuk `openai/gpt-5.5`, tetap tidak berubah. Alias
    `chat-latest` hanya menerima verbositas teks `medium`; OpenClaw memaksa
    verbositas lain yang diminta menjadi `medium` untuk model ini.

    <Warning>
    OpenClaw **tidak** mengekspos `gpt-5.3-codex-spark` pada rute kunci API
    OpenAI langsung. Model ini hanya tersedia melalui entri katalog langganan Codex
    ketika akun yang digunakan untuk masuk menyediakannya.
    </Warning>

  </Tab>

  <Tab title="Langganan Codex">
    **Paling sesuai untuk:** menggunakan langganan ChatGPT/Codex Anda dengan eksekusi
    app-server Codex native sebagai pengganti kunci API terpisah. Cloud Codex memerlukan
    proses masuk ChatGPT.

    <Steps>
      <Step title="Jalankan OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Atau jalankan OAuth secara langsung:

        ```bash
        openclaw models auth login --provider openai
        ```

        Untuk penyiapan tanpa antarmuka atau yang tidak mendukung callback, tambahkan `--device-code` untuk
        masuk dengan alur kode perangkat ChatGPT sebagai pengganti callback browser
        localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Gunakan rute model OpenAI kanonis">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        Konfigurasi runtime tidak diperlukan untuk rute native HTTPS resmi yang sama persis ini.
        Rute ini dapat memilih runtime app-server Codex secara otomatis, dan
        OpenClaw menginstal atau memperbaiki Plugin Codex bawaan ketika runtime tersebut
        dipilih.
      </Step>
      <Step title="Verifikasi autentikasi Codex tersedia">
        ```bash
        openclaw models list --provider openai
        ```

        Setelah Gateway berjalan, kirim `/codex status` atau `/codex models`
        dalam chat untuk memverifikasi runtime app-server native.
      </Step>
    </Steps>

    ### Ringkasan rute

    | Referensi model                | Kebijakan runtime atau fakta rute                                 | Rute                                                    | Autentikasi                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | tidak ditetapkan/`auto`, rute native HTTPS resmi yang sama persis, tanpa penggantian permintaan | Codex dapat dipilih                                    | Proses masuk Codex, atau profil autentikasi `openai` terurut |
    | `openai/gpt-5.6-terra`   | tidak ditetapkan/`auto`, rute native HTTPS resmi yang sama persis, tanpa penggantian permintaan | Codex dapat dipilih                                    | Proses masuk Codex ketika katalog menyediakan Terra       |
    | `openai/gpt-5.6-luna`    | tidak ditetapkan/`auto`, rute native HTTPS resmi yang sama persis, tanpa penggantian permintaan | Codex dapat dipilih                                    | Proses masuk Codex ketika katalog menyediakan Luna        |
    | `openai/gpt-5.6-sol`     | penyedia/model `agentRuntime.id: "openclaw"`                  | Runtime tertanam OpenClaw, transportasi autentikasi Codex internal | Profil OAuth `openai` yang dipilih                    |
    | `openai/gpt-5.5`         | penyedia/model `agentRuntime.id` eksplisit                     | Runtime agen yang dipilih                                   | Profil autentikasi OpenAI yang dipilih                       |
    | `openai/*`               | Completions yang ditulis, kustom, atau penggantian permintaan | Runtime tertanam OpenClaw                                | Persyaratan kredensial tetap khusus untuk rute      |
    | `openai/*`               | endpoint HTTP resmi berupa teks biasa                  | Ditolak                                                 | Kredensial tidak dikirim                              |
    | Referensi GPT-5.5 Codex lama | diperbaiki oleh doctor                                            | Ditulis ulang menjadi `openai/gpt-5.5`                            | Profil OAuth OpenAI yang dimigrasikan                      |
    | `codex-cli/gpt-5.5`      | diperbaiki oleh doctor                                            | Ditulis ulang menjadi `openai/gpt-5.5`                            | Autentikasi app-server Codex                              |

    <Warning>
    Penyiapan baru berbasis langganan menggunakan `openai/gpt-5.6-sol` secara tepat; katalog
    Codex native juga dapat menampilkan referensi Terra atau Luna secara tepat. Jika
    akun tidak menampilkan GPT-5.6, pilih `openai/gpt-5.5` secara eksplisit. Referensi
    GPT Codex lama adalah rute OpenClaw warisan, bukan jalur runtime Codex
    native; jalankan `openclaw doctor --fix` untuk memigrasikannya tanpa meningkatkan
    pilihan GPT-5.5 eksplisit yang sudah ada. `gpt-5.3-codex-spark` tetap terbatas
    pada akun yang katalog langganan Codex-nya mengiklankannya; referensi langsung
    kunci API OpenAI dan Azure untuknya tetap disembunyikan.
    </Warning>

    <Note>
    Konfigurasi baru harus menempatkan urutan autentikasi agen OpenAI di bawah `auth.order.openai`;
    doctor memigrasikan entri urutan autentikasi Codex warisan yang lebih lama.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    Dengan cadangan kunci API, pertahankan model yang dipilih di bawah `openai/*` dan tempatkan
    urutan autentikasi di bawah `openai`. OpenClaw mencoba langganan terlebih dahulu, lalu
    kunci API, sambil tetap menggunakan harness Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
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
    Onboarding tidak lagi mengimpor materi OAuth dari `~/.codex`. Masuk dengan
    OAuth browser (default) atau alur kode perangkat di atas; OpenClaw mengelola
    kredensial yang dihasilkan dalam penyimpanan autentikasi agennya sendiri.
    </Note>

    ### Memeriksa dan memulihkan perutean OAuth Codex

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

    Jika konfigurasi lama masih memiliki referensi GPT Codex warisan, atau pin sesi runtime
    OpenAI yang usang tanpa konfigurasi runtime eksplisit, perbaiki:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Jika `models auth list --provider openai` tidak menampilkan profil yang dapat digunakan, masuk
    kembali:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Gunakan `--profile-id` untuk beberapa login OAuth Codex dalam agen yang sama, lalu
    kendalikan melalui urutan autentikasi atau `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Jalankan `openclaw doctor --fix` untuk memigrasikan ID profil berprefiks OpenAI Codex
    warisan yang lebih lama dan entri urutan sebelum mengandalkan urutan profil.

    ### Indikator status

    Chat `/status` menampilkan runtime model yang aktif untuk sesi saat ini.
    Harness app-server Codex yang disertakan muncul sebagai
    `Runtime: OpenAI Codex` ketika rute implisit yang memenuhi syarat atau kebijakan
    runtime penyedia/model eksplisit memilihnya.

    ### Peringatan doctor

    Jika referensi model Codex warisan atau pin runtime OpenAI yang usang tetap ada dalam konfigurasi
    atau status sesi, `openclaw doctor --fix` menulis ulang referensi tersebut menjadi `openai/*` dengan
    runtime Codex kecuali OpenClaw dikonfigurasi secara eksplisit.

    ### Batas jendela konteks

    OpenClaw memperlakukan metadata model dan batas konteks runtime sebagai nilai
    yang terpisah. Untuk `openai/gpt-5.5` melalui katalog OAuth Codex:

    - Native `contextWindow`: `400000`
    - Batas `contextTokens` runtime default: `272000`

    Dalam praktiknya, batas default yang lebih kecil memiliki karakteristik latensi dan kualitas
    yang lebih baik. Timpa dengan `contextTokens`:

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
    Gunakan `contextWindow` untuk mendeklarasikan metadata model native. Gunakan `contextTokens`
    untuk membatasi anggaran konteks runtime. Rute langsung kunci API OpenAI
    melaporkan `contextWindow` native yang lebih besar (`1000000`) untuk `gpt-5.5`; kedua
    rute dilacak secara terpisah karena katalog upstream berbeda.
    </Note>

    ### Pemulihan katalog

    OpenClaw menggunakan metadata katalog Codex upstream untuk `gpt-5.5` jika
    tersedia. Jika penemuan Codex langsung tidak menyertakan baris `gpt-5.5` sementara akun
    telah diautentikasi, OpenClaw menyintesis baris model OAuth tersebut agar eksekusi cron,
    subagen, dan model default yang dikonfigurasi tidak gagal dengan
    `Unknown model`.

  </Tab>
</Tabs>

## Autentikasi app-server Codex native

Harness app-server Codex native menggunakan referensi model `openai/*` ketika rute
HTTPS resmi yang tepat dan memenuhi syarat memilihnya secara implisit, atau ketika
`agentRuntime.id: "codex"` penyedia/model memilihnya secara eksplisit. Autentikasinya tetap
berbasis akun. OpenClaw memilih autentikasi dalam urutan ini:

1. Profil autentikasi OpenAI yang diurutkan untuk agen, sebaiknya di bawah
   `auth.order.openai`. Jalankan `openclaw doctor --fix` untuk memigrasikan ID profil autentikasi
   Codex warisan yang lebih lama dan urutan autentikasi.
2. Akun app-server yang sudah ada, seperti login ChatGPT
   CLI Codex lokal. Untuk home agen terisolasi default, OpenClaw menjembatani akun
   CLI native tersebut ke app-server melalui RPC login-nya; OpenClaw tidak berbagi
   konfigurasi, plugin, atau penyimpanan utas CLI.
3. Hanya untuk peluncuran app-server stdio lokal, dan hanya ketika app-server
   melaporkan tidak ada akun: `CODEX_API_KEY`, lalu `OPENAI_API_KEY`.

Login langganan ChatGPT/Codex lokal tidak diganti hanya karena proses
gateway juga memiliki `OPENAI_API_KEY` untuk model OpenAI langsung atau
embedding. Fallback kunci API env hanya berlaku untuk jalur stdio lokal tanpa akun;
kunci tersebut tidak pernah dikirim melalui koneksi app-server WebSocket. Ketika profil
Codex bergaya langganan dipilih, OpenClaw juga tidak menyertakan
`CODEX_API_KEY` dan `OPENAI_API_KEY` dalam proses anak app-server stdio yang diluncurkan
dan sebagai gantinya mengirim kredensial yang dipilih melalui RPC login app-server.

Ketika profil langganan tersebut diblokir oleh batas penggunaan Codex, OpenClaw
menandai profil sebagai diblokir hingga waktu reset yang diumumkan Codex dan memungkinkan urutan
autentikasi beralih ke profil `openai:*` berikutnya, tanpa mengubah model yang dipilih
atau keluar dari harness Codex. Setelah waktu reset berlalu, profil
langganan dapat digunakan kembali.

## Pembuatan gambar

Plugin `openai` yang disertakan mendaftarkan pembuatan gambar melalui alat
`image_generate`. Plugin ini mendukung pembuatan gambar dengan kunci API OpenAI dan OAuth Codex
melalui referensi model `openai/gpt-image-2` yang sama.

| Kemampuan                 | Kunci API OpenAI                    | OAuth Codex                          |
| ------------------------- | ----------------------------------- | ------------------------------------ |
| Referensi model           | `openai/gpt-image-2`                  | `openai/gpt-image-2`                   |
| Autentikasi               | `OPENAI_API_KEY`                  | Login OAuth OpenAI Codex             |
| Transport                 | API OpenAI Images                   | Backend Codex Responses              |
| Gambar maks. per permintaan | 4                                 | 4                                    |
| Mode edit                 | Diaktifkan (hingga 5 gambar referensi) | Diaktifkan (hingga 5 gambar referensi) |
| Penimpaan ukuran          | Didukung, termasuk ukuran 2K/4K     | Didukung, termasuk ukuran 2K/4K      |
| Rasio aspek / resolusi    | Tidak diteruskan ke API OpenAI Images | Dipetakan ke ukuran yang didukung jika aman |

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
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter alat bersama,
pemilihan penyedia, dan perilaku failover.
</Note>

`gpt-image-2` adalah default untuk pembuatan teks-ke-gambar dan pengeditan gambar
OpenAI. `gpt-image-1.5`, `gpt-image-1`, dan `gpt-image-1-mini` tetap dapat digunakan
sebagai penimpaan model eksplisit. Gunakan `openai/gpt-image-1.5` untuk
keluaran PNG/WebP berlatar belakang transparan; API `gpt-image-2` saat ini menolak
`background: "transparent"`.

Untuk permintaan berlatar belakang transparan, panggil `image_generate` dengan
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` atau `"webp"`, dan
`background: "transparent"`; opsi penyedia `openai.background` yang lebih lama
masih diterima. OpenClaw juga melindungi rute publik OpenAI dan OAuth OpenAI Codex
dengan menulis ulang permintaan transparan `openai/gpt-image-2` default menjadi
`gpt-image-1.5`; Azure dan endpoint kustom yang kompatibel dengan OpenAI mempertahankan
nama deployment/model yang dikonfigurasi.

Pengaturan yang sama tersedia untuk eksekusi CLI headless:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Stiker lingkaran merah sederhana pada latar belakang transparan" \
  --json
```

Gunakan flag `--output-format` dan `--background` yang sama dengan
`openclaw infer image edit` saat memulai dari berkas input.
`--openai-background` tetap tersedia sebagai alias khusus OpenAI. Gunakan
`--quality low|medium|high|auto` untuk mengendalikan kualitas dan biaya OpenAI Images.
Gunakan `--openai-moderation low|auto` untuk meneruskan petunjuk moderasi OpenAI dari
`image generate` atau `image edit`.

Untuk instalasi OAuth ChatGPT/Codex, pertahankan referensi `openai/gpt-image-2` yang sama. Ketika
profil OAuth `openai` dikonfigurasi, OpenClaw mengambil token akses OAuth
yang tersimpan tersebut dan mengirim permintaan gambar melalui backend Codex Responses; OpenClaw
tidak terlebih dahulu mencoba `OPENAI_API_KEY` atau secara diam-diam melakukan fallback ke kunci API.
Konfigurasikan `models.providers.openai` secara eksplisit dengan kunci API, URL dasar
kustom, atau endpoint Azure jika Anda menginginkan rute API OpenAI Images langsung.
Jika endpoint gambar kustom tersebut berada di alamat LAN/pribadi tepercaya,
atur juga `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw
tetap memblokir endpoint gambar kompatibel OpenAI yang bersifat pribadi/internal kecuali opsi
keikutsertaan ini tersedia.

Buat:

```
/tool image_generate model=openai/gpt-image-2 prompt="Poster peluncuran yang rapi untuk OpenClaw di macOS" size=3840x2160 count=1
```

Buat PNG transparan:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Stiker lingkaran merah sederhana pada latar belakang transparan" outputFormat=png background=transparent
```

Edit:

```
/tool image_generate model=openai/gpt-image-2 prompt="Pertahankan bentuk objek, ubah bahannya menjadi kaca tembus cahaya" image=/path/to/reference.png size=1024x1536
```

## Pembuatan video

Plugin `openai` yang disertakan mendaftarkan pembuatan video melalui alat
`video_generate`.

| Kemampuan         | Nilai                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| Model default     | `openai/sora-2`                                                                 |
| Mode              | Teks-ke-video, gambar-ke-video, pengeditan satu video                              |
| Input referensi   | 1 gambar atau 1 video                                                              |
| Penimpaan ukuran  | Didukung untuk teks-ke-video dan gambar-ke-video                                   |
| Rasio aspek       | Dikonversi ke ukuran terdekat yang didukung, tidak diteruskan secara mentah        |
| Penimpaan lainnya | `resolution`, `audio`, `watermark` tidak didukung dan dihapus dengan peringatan alat |

Permintaan gambar-ke-video OpenAI menggunakan `POST /v1/videos` dengan sebuah gambar
`input_reference`. Pengeditan video tunggal menggunakan `POST /v1/videos/edits` dengan
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
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama,
pemilihan penyedia, dan perilaku failover.

Penyedia OpenAI mendeklarasikan `supportsSize`, tetapi tidak mendeklarasikan `supportsAspectRatio` atau
`supportsResolution`. Lapisan normalisasi bersama OpenClaw mengonversi
`aspectRatio` yang diminta menjadi `size` OpenAI terdekat yang cocok sebelum
permintaan mencapai penyedia, sehingga permintaan rasio aspek umumnya tetap berfungsi.
`resolution` tidak memiliki fallback ukuran dan dihapus, lalu ditampilkan kepada pemanggil sebagai
`Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## Kontribusi prompt GPT-5

OpenClaw menambahkan kontribusi prompt GPT-5 bersama untuk model keluarga GPT-5 pada
penyedia `openai` (termasuk referensi Codex lama sebelum perbaikan yang dinormalisasi
menjadi `openai/*`). Penyedia lain yang juga menyajikan ID model keluarga GPT-5, seperti
rute OpenRouter atau opencode, tidak menerima overlay ini; overlay dibatasi berdasarkan
ID penyedia `openai`, bukan hanya berdasarkan ID model. Model GPT-4.x yang lebih lama tidak pernah
menerimanya.

Harness app-server Codex native tidak menerima kontrak perilaku persona/disiplin-
alat atau overlay gaya interaksi ramah melalui
instruksi pengembang; Codex native mempertahankan perilaku dasar, model, dan
dokumen proyek milik Codex, dan OpenClaw menonaktifkan kepribadian bawaan Codex untuk
utas native agar berkas kepribadian ruang kerja agen tetap menjadi sumber otoritatif.
OpenClaw hanya menyumbangkan konteks runtime ke utas Codex native: pengiriman
kanal, alat dinamis OpenClaw, delegasi ACP, konteks ruang kerja, dan
Skills OpenClaw. Teks panduan Heartbeat dari kontribusi yang sama ini merupakan
satu-satunya pengecualian: giliran Heartbeat Codex native tetap menerimanya, yang disuntikkan sebagai
instruksi kolaborasi khusus, bukan melalui hook kontribusi prompt
bersama.

Kontribusi GPT-5 menambahkan kontrak perilaku bertag untuk persistensi
persona, keamanan eksekusi, disiplin alat, bentuk output, pemeriksaan
penyelesaian, dan verifikasi pada prompt rakitan OpenClaw yang cocok. Perilaku balasan khusus
kanal dan pesan senyap tetap berada dalam prompt sistem OpenClaw bersama
dan kebijakan pengiriman keluar. Lapisan gaya interaksi ramah bersifat
terpisah dan dapat dikonfigurasi.

| Nilai                  | Efek                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (default) | Mengaktifkan lapisan gaya interaksi ramah |
| `"on"`                 | Alias untuk `"friendly"`                      |
| `"off"`                | Hanya menonaktifkan lapisan gaya ramah       |

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
Nilai tidak peka huruf besar-kecil saat runtime, sehingga `"Off"` dan `"off"` sama-sama menonaktifkan
lapisan gaya ramah.
</Tip>

<Note>
`plugins.entries.openai.config.personality` lama masih dibaca sebagai
fallback kompatibilitas ketika pengaturan bersama
`agents.defaults.promptOverlays.gpt5.personality` belum ditetapkan.
</Note>

## Suara dan ucapan

<AccordionGroup>
  <Accordion title="Sintesis ucapan (TTS)">
    Plugin `openai` yang disertakan mendaftarkan sintesis ucapan untuk
    permukaan `messages.tts`.

    | Pengaturan      | Jalur konfigurasi                                            | Default                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Model        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Suara        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | Kecepatan        | `messages.tts.providers.openai.speed`                  | (belum ditetapkan)                          |
    | Instruksi | `messages.tts.providers.openai.instructions`           | (belum ditetapkan, hanya `gpt-4o-mini-tts`)  |
    | Format       | `messages.tts.providers.openai.responseFormat`         | `opus` untuk catatan suara, `mp3` untuk berkas |
    | Kunci API      | `messages.tts.providers.openai.apiKey`                 | Menggunakan fallback `OPENAI_API_KEY`   |
    | URL dasar     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Isi tambahan   | `messages.tts.providers.openai.extraBody` / `extra_body` | (belum ditetapkan)                        |

    Model yang tersedia: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Suara yang tersedia:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` digabungkan ke dalam JSON permintaan `/audio/speech` setelah bidang
    yang dihasilkan OpenClaw, jadi gunakan untuk endpoint kompatibel OpenAI yang memerlukan
    kunci tambahan seperti `lang`. Kunci prototipe diabaikan.

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
    Tetapkan `OPENAI_TTS_BASE_URL` untuk mengganti URL dasar TTS tanpa memengaruhi
    endpoint API obrolan. TTS OpenAI dan suara Realtime sama-sama dikonfigurasi
    melalui kunci API OpenAI Platform; instalasi khusus OAuth tetap dapat menggunakan
    model obrolan yang didukung Codex, tetapi tidak dapat menggunakan respons suara langsung OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Ucapan-ke-teks">
    Plugin `openai` yang disertakan mendaftarkan ucapan-ke-teks secara batch melalui
    permukaan transkripsi pemahaman media OpenClaw.

    - Model default: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Jalur input: unggahan berkas audio multipart
    - Digunakan di mana pun transkripsi audio masuk membaca `tools.media.audio`,
      termasuk segmen kanal suara Discord dan lampiran audio kanal

    Untuk memaksakan penggunaan OpenAI bagi transkripsi audio masuk:

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

    Petunjuk bahasa dan prompt diteruskan ke OpenAI jika disediakan oleh
    konfigurasi media audio bersama atau permintaan transkripsi per panggilan.

  </Accordion>

  <Accordion title="Transkripsi Realtime">
    Plugin `openai` yang disertakan mendaftarkan transkripsi Realtime untuk
    Plugin Panggilan Suara.

    | Pengaturan          | Jalur konfigurasi                                                          | Default |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Model            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Bahasa         | `...openai.language`                                                 | (belum ditetapkan) |
    | Prompt           | `...openai.prompt`                                                   | (belum ditetapkan) |
    | Durasi hening | `...openai.silenceDurationMs`                                        | `800`   |
    | Ambang batas VAD    | `...openai.vadThreshold`                                             | `0.5`   |
    | Autentikasi             | `...openai.apiKey`, `OPENAI_API_KEY`, atau profil kunci API `openai`    | Kunci API Platform diperlukan |

    <Note>
    Menggunakan koneksi WebSocket ke `wss://api.openai.com/v1/realtime` dengan
    audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Untuk profil kunci API
    `openai`, Gateway membuat rahasia klien transkripsi Realtime
    sementara sebelum membuka WebSocket. Penyedia streaming ini ditujukan untuk jalur
    transkripsi Realtime Panggilan Suara; suara Discord saat ini merekam segmen
    pendek dan sebagai gantinya menggunakan jalur transkripsi batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Suara Realtime">
    Plugin `openai` yang disertakan mendaftarkan suara Realtime untuk Plugin
    Panggilan Suara.

    | Pengaturan                               | Jalur konfigurasi                                                              | Default             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Model                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Suara                                  | `...openai.voice`                                                       | `alloy`             |
    | Suhu (jembatan deployment Azure)  | `...openai.temperature`                                                 | `0.8`               |
    | Ambang batas VAD                          | `...openai.vadThreshold`                                                | `0.5`                |
    | Durasi hening                       | `...openai.silenceDurationMs`                                           | `500`                |
    | Padding prefiks                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | Upaya penalaran                       | `...openai.reasoningEffort`                                             | (belum ditetapkan)              |
    | Autentikasi                                   | Profil kunci API `openai`, `...openai.apiKey`, atau `OPENAI_API_KEY` | Kunci API OpenAI Platform diperlukan |

    Suara Realtime bawaan yang tersedia untuk `gpt-realtime-2.1`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI merekomendasikan `marin` dan `cedar` untuk kualitas Realtime terbaik. Ini
    adalah kumpulan yang terpisah dari suara teks-ke-ucapan di atas; suara khusus TTS
    seperti `fable`, `nova`, atau `onyx` tidak valid untuk sesi Realtime.
    Tetapkan model secara eksplisit ke `gpt-realtime-2.1-mini` jika Anda lebih memilih
    varian Realtime 2.1 yang lebih kecil dan lebih murah.

    <Note>
    **GPT-Live (akan datang).** Model dupleks penuh `gpt-live-1` dan
    `gpt-live-1-mini` OpenAI menggantikan mode suara ChatGPT pada Juli 2026; API
    pengembang sedang diluncurkan untuk organisasi dengan akses awal. OpenClaw
    mengenali keluarga model tersebut, tetapi belum menjalankannya: sesi GPT-Live
    hanya menggunakan WebRTC, mengelola pergantian giliran sendiri (tanpa VAD), dan mendelegasikan pekerjaan agen
    melalui protokol peristiwa serah terima yang belum diterapkan oleh transport Realtime
    OpenClaw. Mengonfigurasi model `gpt-live-*` akan gagal secara tertutup dengan
    panduan untuk jembatan WebSocket dan sesi browser Talk, alih-alih
    secara diam-diam menghubungkan audio tanpa akses agen. Akses API juga dibatasi
    per organisasi OpenAI selama akses awal. Pertahankan `gpt-realtime-2.1` (nilai
    default) hingga dukungan GPT-Live tersedia.
    </Note>

    <Note>
    Jembatan Realtime OpenAI backend menggunakan bentuk sesi WebSocket Realtime
    GA, yang tidak menerima `session.temperature`. Deployment Azure OpenAI
    tetap tersedia melalui `azureEndpoint` dan `azureDeployment` serta
    mempertahankan bentuk sesi yang kompatibel dengan deployment (termasuk `temperature`).
    Mendukung pemanggilan alat dua arah dan audio G.711 u-law.
    </Note>

    <Note>
    Suara realtime dipilih saat sesi dibuat. OpenAI mengizinkan sebagian besar
    bidang sesi diubah kemudian, tetapi suara tidak dapat diubah setelah
    model menghasilkan audio dalam sesi tersebut. OpenClaw saat ini menampilkan
    id suara Realtime bawaan sebagai string.
    </Note>

    <Note>
    Talk di Control UI menggunakan sesi realtime browser OpenAI dengan rahasia
    klien sementara yang diterbitkan Gateway dan pertukaran SDP WebRTC langsung
    dari browser dengan OpenAI Realtime API. Gateway menerbitkan rahasia klien
    tersebut menggunakan kredensial `openai` yang dipilih. Kunci yang dikonfigurasi, profil kunci API, dan
    `OPENAI_API_KEY` didahulukan; profil OAuth `openai` atau login
    Codex eksternal digunakan sebagai fallback. Relai Gateway dan jembatan WebSocket
    realtime backend Voice Call menggunakan urutan kredensial yang sama untuk endpoint OpenAI native.
    Verifikasi langsung oleh pengelola tersedia dengan
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    bagian OpenAI memverifikasi jembatan WebSocket backend dan pertukaran
    SDP WebRTC browser tanpa mencatat rahasia.
    Teruskan `--openai-only` untuk menjalankan kedua bagian tersebut tanpa kredensial Google.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Penyedia `openai` yang dibundel dapat menargetkan sumber daya Azure OpenAI untuk pembuatan
gambar dengan mengganti URL dasar. Pada jalur pembuatan gambar, OpenClaw
mendeteksi nama host Azure pada `models.providers.openai.baseUrl` dan beralih ke
format permintaan Azure secara otomatis.

<Note>
Suara realtime menggunakan jalur konfigurasi terpisah
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
dan tidak dipengaruhi oleh `models.providers.openai.baseUrl`. Lihat akordeon **Suara
realtime** pada [Suara dan ucapan](#voice-and-speech) untuk pengaturan Azure-nya.
</Note>

Gunakan Azure OpenAI jika:

- Anda sudah memiliki langganan, kuota, atau perjanjian
  perusahaan Azure OpenAI
- Anda memerlukan residensi data regional atau kontrol kepatuhan yang disediakan Azure
- Anda ingin mempertahankan lalu lintas di dalam tenancy Azure yang sudah ada

### Konfigurasi

Untuk pembuatan gambar Azure melalui penyedia `openai` yang dibundel, arahkan
`models.providers.openai.baseUrl` ke sumber daya Azure Anda dan atur `apiKey` ke
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

OpenClaw mengenali sufiks host Azure berikut untuk rute pembuatan gambar
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Untuk permintaan pembuatan gambar pada host Azure yang dikenali, OpenClaw:

- Mengirim header `api-key` sebagai pengganti `Authorization: Bearer`
- Menggunakan jalur dengan cakupan deployment (`/openai/deployments/{deployment}/...`)
- Menambahkan `?api-version=...` ke setiap permintaan
- Menggunakan batas waktu permintaan default 600s untuk panggilan pembuatan gambar Azure.
  Nilai `timeoutMs` per panggilan tetap menggantikan nilai default ini.

URL dasar lainnya (OpenAI publik, proksi yang kompatibel dengan OpenAI) tetap menggunakan
format permintaan gambar OpenAI standar.

<Note>
Perutean Azure untuk jalur pembuatan gambar penyedia `openai` memerlukan
OpenClaw 2026.4.22 atau yang lebih baru. Versi sebelumnya memperlakukan setiap
`openai.baseUrl` khusus seperti endpoint OpenAI publik dan gagal pada deployment
gambar Azure.
</Note>

### Versi API

Atur `AZURE_OPENAI_API_VERSION` untuk menetapkan versi pratinjau atau GA Azure tertentu
bagi jalur pembuatan gambar Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Nilai default-nya adalah `2024-12-01-preview` ketika variabel tidak diatur.

### Nama model adalah nama deployment

Azure OpenAI mengikat model ke deployment. Untuk permintaan pembuatan gambar Azure
yang dirutekan melalui penyedia `openai` yang dibundel, bidang `model` di OpenClaw
harus berupa **nama deployment Azure** yang Anda konfigurasi di portal Azure, bukan
id model OpenAI publik.

Jika Anda membuat deployment bernama `gpt-image-2-prod` yang menyediakan `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Poster yang bersih" size=1024x1024 count=1
```

Aturan nama deployment yang sama berlaku untuk setiap panggilan pembuatan gambar yang dirutekan
melalui penyedia `openai` yang dibundel.

### Ketersediaan regional

Pembuatan gambar Azure saat ini hanya tersedia di sebagian wilayah
(misalnya `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Periksa daftar wilayah terkini Microsoft sebelum membuat
deployment, dan pastikan model tertentu tersebut ditawarkan di wilayah Anda.

### Perbedaan parameter

Azure OpenAI dan OpenAI publik tidak selalu menerima parameter gambar yang sama.
Azure mungkin menolak opsi yang diizinkan OpenAI publik (misalnya nilai
`background` tertentu pada `gpt-image-2`) atau hanya menyediakannya pada versi model
tertentu. Perbedaan ini berasal dari Azure dan model yang mendasarinya, bukan
OpenClaw. Jika permintaan Azure gagal dengan kesalahan validasi, periksa
kumpulan parameter yang didukung oleh deployment dan versi API spesifik Anda di
portal Azure.

<Note>
Azure OpenAI menggunakan transport native dan perilaku kompatibilitas, tetapi tidak menerima
header atribusi tersembunyi OpenClaw—lihat akordeon **Rute native vs kompatibel dengan
OpenAI** pada [Konfigurasi lanjutan](#advanced-configuration).

Untuk lalu lintas chat atau Responses di Azure (di luar pembuatan gambar), gunakan
alur orientasi awal atau konfigurasi penyedia Azure khusus; `openai.baseUrl` saja
tidak menggunakan format API/autentikasi Azure. Tersedia penyedia
`azure-openai-responses/*` terpisah; lihat akordeon Compaction sisi server
di bawah.
</Note>

## Konfigurasi lanjutan

Contoh `params` per model di bawah membentuk permintaan penyedia tertanam
OpenClaw. Mengonfigurasinya merupakan perilaku permintaan yang ditentukan, sehingga rute
`auto` yang memenuhi syarat tetap berada di OpenClaw alih-alih memilih Codex secara implisit. Harness
app-server Codex native mengelola transport dan pengaturan permintaannya sendiri; `agentRuntime.id: "codex"`
eksplisit akan gagal secara tertutup ketika rute efektif tidak dinyatakan kompatibel dengan
Codex.

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw mengutamakan WebSocket dengan fallback SSE (`"auto"`) untuk `openai/*`.

    Dalam mode `"auto"`, OpenClaw:
    - Mencoba ulang satu kegagalan awal WebSocket sebelum beralih ke SSE
    - Setelah kegagalan, menandai WebSocket sebagai terdegradasi selama 60 detik dan menggunakan SSE
      selama periode pendinginan
    - Melampirkan header identitas sesi dan giliran yang stabil untuk percobaan ulang dan
      penyambungan kembali
    - Menormalisasi penghitung penggunaan (`input_tokens` / `prompt_tokens`) di seluruh
      varian transport

    | Nilai                | Perilaku                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (default)   | WebSocket terlebih dahulu, fallback SSE     |
    | `"sse"`              | Paksa hanya SSE                    |
    | `"websocket"`        | Paksa hanya WebSocket              |

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
    - [Respons API streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Mode cepat">
    OpenClaw menyediakan sakelar mode cepat bersama untuk `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Konfigurasi:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Saat diaktifkan, OpenClaw memetakan mode cepat ke pemrosesan prioritas OpenAI
    (`service_tier = "priority"`). Nilai `service_tier` yang sudah ada
    dipertahankan, dan mode cepat tidak menulis ulang `reasoning` atau
    `text.verbosity`. `fastMode: "auto"` memulai panggilan model baru dalam mode cepat hingga
    batas otomatis, lalu memulai panggilan percobaan ulang, fallback, hasil alat, atau
    kelanjutan berikutnya tanpa mode cepat. Batas tersebut secara default adalah 60 detik;
    atur `params.fastAutoOnSeconds` pada model aktif untuk mengubahnya.

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
    Penggantian sesi didahulukan daripada konfigurasi. Menghapus penggantian sesi di
    UI Sessions mengembalikan sesi ke nilai default yang dikonfigurasi.
    </Note>

  </Accordion>

  <Accordion title="Pemrosesan prioritas (service_tier)">
    API OpenAI menyediakan pemrosesan prioritas melalui `service_tier`. Atur untuk setiap
    model di OpenClaw:

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
    `serviceTier` hanya diteruskan ke endpoint OpenAI native
    (`api.openai.com`) dan endpoint Codex native (`chatgpt.com/backend-api`).
    Jika Anda merutekan salah satu penyedia melalui proksi, OpenClaw membiarkan
    `service_tier` tetap tidak berubah.
    </Warning>

  </Accordion>

  <Accordion title="Compaction sisi server (Responses API)">
    Untuk model Responses OpenAI langsung (`openai/*` pada `api.openai.com`), wrapper
    stream OpenClaw milik Plugin OpenAI secara otomatis mengaktifkan Compaction
    sisi server:

    - Memaksakan `store: true` (kecuali kompatibilitas model menetapkan `supportsStore: false`)
    - Menyisipkan `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` default: 70% dari `contextWindow` (atau `80000` ketika
      tidak tersedia)

    Ini berlaku untuk jalur runtime OpenClaw bawaan dan hook penyedia OpenAI
    yang digunakan oleh eksekusi tertanam. Harness app-server Codex native mengelola
    konteksnya sendiri melalui Codex dan tidak dipengaruhi oleh pengaturan ini.

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
    `responsesServerCompaction` hanya mengontrol penyisipan `context_management`.
    Model Responses OpenAI langsung tetap memaksakan `store: true` kecuali kompatibilitas
    menetapkan `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentik ketat">
    Untuk model keluarga GPT-5 penyedia `openai` yang dijalankan melalui runtime
    tertanam OpenClaw, OpenClaw sudah menetapkan kontrak eksekusi yang lebih ketat secara default
    bernama `strict-agentic`. Kontrak ini aktif secara otomatis setiap kali penyedia yang ditetapkan adalah
    `openai` dan id model cocok dengan keluarga GPT-5, kecuali konfigurasi
    secara eksplisit memilih untuk menonaktifkannya:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Menetapkan `"strict-agentic"` secara eksplisit tidak menghasilkan perubahan pada jalur yang didukung (nilai tersebut
    sudah menjadi default) dan tidak berpengaruh pada pasangan penyedia/model yang tidak didukung.

    Saat `strict-agentic` aktif, OpenClaw:
    - Mengaktifkan otomatis `update_plan` untuk pekerjaan substansial
    - Mencoba kembali giliran yang secara struktural kosong atau hanya berisi penalaran dengan kelanjutan
      jawaban yang terlihat
    - Menggunakan peristiwa rencana harness eksplisit ketika harness yang dipilih
      menyediakannya

    OpenClaw tidak mengklasifikasikan prosa asisten untuk menentukan apakah suatu giliran merupakan
    rencana, pembaruan progres, atau jawaban akhir.

    <Note>
    Kontrak ini sepenuhnya berada dalam runner agen tertanam OpenClaw. Kontrak ini
    tidak berlaku pada harness app-server Codex native, yang mengelola sendiri
    perilaku giliran dan rencananya; pemilihan harness lebih menentukan daripada
    pengaturan kontrak eksekusi untuk proses Codex native.
    </Note>

  </Accordion>

  <Accordion title="Rute native vs kompatibel dengan OpenAI">
    OpenClaw memperlakukan endpoint langsung OpenAI, Codex, dan Azure OpenAI
    secara berbeda dari proksi `/v1` generik yang kompatibel dengan OpenAI:

    **Rute native** (`openai/*`, Azure OpenAI):
    - Mempertahankan `reasoning: { effort: "none" }` hanya untuk model yang mendukung
      upaya `none` OpenAI
    - Menghilangkan penalaran yang dinonaktifkan untuk model atau proksi yang menolak
      `reasoning.effort: "none"`
    - Menetapkan skema alat ke mode ketat secara default
    - Melampirkan header atribusi tersembunyi hanya pada host native yang terverifikasi (Azure
      OpenAI tidak menerima header ini, meskipun merupakan rute native)
    - Mempertahankan pembentukan permintaan khusus OpenAI (`service_tier`, `store`,
      kompatibilitas penalaran, petunjuk cache prompt)

    **Rute proksi/kompatibel:**
    - Menggunakan perilaku kompatibilitas yang lebih longgar
    - Menghapus `store` Completions dari payload `openai-completions` non-native
    - Menerima JSON penerusan `params.extra_body`/`params.extraBody` tingkat lanjut
      untuk proksi Completions yang kompatibel dengan OpenAI
    - Menerima `params.chat_template_kwargs` untuk proksi Completions yang kompatibel dengan OpenAI
      seperti vLLM
    - Tidak memaksakan skema alat ketat atau header khusus native

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
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan kembali kredensial.
  </Card>
</CardGroup>
