---
read_when:
    - Anda ingin menggunakan Qwen dengan OpenClaw
    - Anda sebelumnya menggunakan Qwen OAuth
summary: Gunakan Qwen Cloud melalui penyedia qwen bawaan OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-30T10:08:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898a7ef1f071c838f3bd877632dd06cf0e6112adfa2833895280f99642df56e6
    source_path: providers/qwen.md
    workflow: 16
---

<Warning>

**Qwen OAuth telah dihapus.** Integrasi OAuth tingkat gratis
(`qwen-portal`) yang menggunakan endpoint `portal.qwen.ai` tidak lagi tersedia.
Lihat [Isu #49557](https://github.com/openclaw/openclaw/issues/49557) untuk
latar belakang.

</Warning>

OpenClaw sekarang memperlakukan Qwen sebagai penyedia bawaan kelas utama dengan id kanonis
`qwen`. Penyedia bawaan menargetkan endpoint Qwen Cloud / Alibaba DashScope dan
Coding Plan serta menjaga id lama `modelstudio` tetap berfungsi sebagai alias
kompatibilitas.

- Penyedia: `qwen`
- Variabel env pilihan: `QWEN_API_KEY`
- Juga diterima untuk kompatibilitas: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Gaya API: kompatibel dengan OpenAI

<Tip>
Jika Anda menginginkan `qwen3.6-plus`, pilih endpoint **Standar (bayar sesuai pemakaian)**.
Dukungan Coding Plan dapat tertinggal dari katalog publik.
</Tip>

## Memulai

Pilih jenis paket Anda dan ikuti langkah penyiapan.

<Tabs>
  <Tab title="Coding Plan (langganan)">
    **Paling cocok untuk:** akses berbasis langganan melalui Qwen Coding Plan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat atau salin kunci API dari [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Jalankan onboarding">
        Untuk endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Untuk endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Id auth-choice lama `modelstudio-*` dan ref model `modelstudio/...` masih
    berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru sebaiknya menggunakan id auth-choice kanonis
    `qwen-*` dan ref model `qwen/...`. Jika Anda mendefinisikan entri kustom persis
    `models.providers.modelstudio` dengan nilai `api` lain, penyedia kustom tersebut
    memiliki ref `modelstudio/...`, bukan alias kompatibilitas Qwen.
    </Note>

  </Tab>

  <Tab title="Standar (bayar sesuai pemakaian)">
    **Paling cocok untuk:** akses bayar sesuai pemakaian melalui endpoint Standard Model Studio, termasuk model seperti `qwen3.6-plus` yang mungkin tidak tersedia di Coding Plan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat atau salin kunci API dari [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Jalankan onboarding">
        Untuk endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Untuk endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Id auth-choice lama `modelstudio-*` dan ref model `modelstudio/...` masih
    berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru sebaiknya menggunakan id auth-choice kanonis
    `qwen-*` dan ref model `qwen/...`. Jika Anda mendefinisikan entri kustom persis
    `models.providers.modelstudio` dengan nilai `api` lain, penyedia kustom tersebut
    memiliki ref `modelstudio/...`, bukan alias kompatibilitas Qwen.
    </Note>

  </Tab>
</Tabs>

## Jenis paket dan endpoint

| Paket                      | Wilayah | Pilihan auth              | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standar (bayar sesuai pemakaian) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standar (bayar sesuai pemakaian) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (langganan) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (langganan) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Penyedia otomatis memilih endpoint berdasarkan pilihan auth Anda. Pilihan kanonis
menggunakan keluarga `qwen-*`; `modelstudio-*` tetap hanya untuk kompatibilitas.
Anda dapat menimpanya dengan `baseUrl` kustom dalam konfigurasi.

<Tip>
**Kelola kunci:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentasi:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Katalog bawaan

OpenClaw saat ini mengirimkan katalog Qwen bawaan ini. Katalog yang dikonfigurasi
sadar-endpoint: konfigurasi Coding Plan menghilangkan model yang hanya diketahui berfungsi pada
endpoint Standar.

| Ref model                   | Masukan     | Konteks   | Catatan                                            |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | teks, gambar | 1,000,000 | Model default                                      |
| `qwen/qwen3.6-plus`         | teks, gambar | 1,000,000 | Pilih endpoint Standar saat Anda membutuhkan model ini |
| `qwen/qwen3-max-2026-01-23` | teks        | 262,144   | Lini Qwen Max                                      |
| `qwen/qwen3-coder-next`     | teks        | 262,144   | Pengodean                                          |
| `qwen/qwen3-coder-plus`     | teks        | 1,000,000 | Pengodean                                          |
| `qwen/MiniMax-M2.5`         | teks        | 1,000,000 | Penalaran diaktifkan                              |
| `qwen/glm-5`                | teks        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | teks        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | teks, gambar | 262,144   | Moonshot AI melalui Alibaba                        |

<Note>
Ketersediaan tetap dapat bervariasi menurut endpoint dan paket penagihan meskipun sebuah model
ada dalam katalog bawaan.
</Note>

## Kontrol Berpikir

Untuk model Qwen Cloud yang mendukung penalaran, penyedia bawaan memetakan
level berpikir OpenClaw ke flag permintaan tingkat atas `enable_thinking` milik DashScope. Berpikir yang dinonaktifkan
mengirim `enable_thinking: false`; level berpikir lain mengirim
`enable_thinking: true`.

## Add-on multimodal

Plugin `qwen` juga mengekspos kapabilitas multimodal pada endpoint DashScope
**Standar** (bukan endpoint Coding Plan):

- **Pemahaman video** melalui `qwen-vl-max-latest`
- **Pembuatan video Wan** melalui `wan2.6-t2v` (default), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Untuk menggunakan Qwen sebagai penyedia video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Pemahaman gambar dan video">
    Plugin Qwen bawaan mendaftarkan pemahaman media untuk gambar dan video
    pada endpoint DashScope **Standar** (bukan endpoint Coding Plan).

    | Properti      | Nilai                 |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | Masukan yang didukung | Gambar, video       |

    Pemahaman media diselesaikan otomatis dari auth Qwen yang dikonfigurasi — tidak ada
    konfigurasi tambahan yang diperlukan. Pastikan Anda menggunakan endpoint Standar (bayar sesuai pemakaian)
    untuk dukungan pemahaman media.

  </Accordion>

  <Accordion title="Ketersediaan Qwen 3.6 Plus">
    `qwen3.6-plus` tersedia pada endpoint Model Studio Standar (bayar sesuai pemakaian):

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Jika endpoint Coding Plan mengembalikan kesalahan "model tidak didukung" untuk
    `qwen3.6-plus`, beralihlah ke Standar (bayar sesuai pemakaian), bukan pasangan
    endpoint/kunci Coding Plan.

    Katalog Qwen bawaan OpenClaw tidak mengiklankan `qwen3.6-plus` pada endpoint Coding
    Plan, tetapi entri `qwen/qwen3.6-plus` yang dikonfigurasi secara eksplisit di bawah
    `models.providers.qwen.models` dihormati pada baseUrl Coding Plan sehingga Anda
    dapat memilih model tersebut jika Aliyun mengaktifkannya pada langganan Anda. API
    upstream tetap memutuskan apakah panggilan berhasil.

  </Accordion>

  <Accordion title="Rencana kapabilitas">
    Plugin `qwen` sedang diposisikan sebagai rumah vendor untuk seluruh permukaan Qwen
    Cloud, bukan hanya model pengodean/teks.

    - **Model teks/chat:** sudah dibundel sekarang
    - **Pemanggilan alat, keluaran terstruktur, berpikir:** diwarisi dari transport yang kompatibel dengan OpenAI
    - **Pembuatan gambar:** direncanakan di lapisan Plugin penyedia
    - **Pemahaman gambar/video:** sudah dibundel sekarang pada endpoint Standar
    - **Ucapan/audio:** direncanakan di lapisan Plugin penyedia
    - **Embedding/reranking memori:** direncanakan melalui permukaan adaptor embedding
    - **Pembuatan video:** sudah dibundel sekarang melalui kapabilitas pembuatan video bersama

  </Accordion>

  <Accordion title="Detail pembuatan video">
    Untuk pembuatan video, OpenClaw memetakan wilayah Qwen yang dikonfigurasi ke host AIGC
    DashScope yang sesuai sebelum mengirimkan pekerjaan:

    - Global/Internasional: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Itu berarti `models.providers.qwen.baseUrl` normal yang menunjuk ke host Qwen
    Coding Plan atau Standar tetap menjaga pembuatan video pada endpoint video DashScope
    regional yang benar.

    Batas pembuatan video Qwen bawaan saat ini:

    - Hingga **1** video keluaran per permintaan
    - Hingga **1** gambar masukan
    - Hingga **4** video masukan
    - Durasi hingga **10 detik**
    - Mendukung `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`
    - Mode gambar/video referensi saat ini memerlukan **URL http(s) jarak jauh**. Jalur
      file lokal ditolak di awal karena endpoint video DashScope tidak
      menerima buffer lokal yang diunggah untuk referensi tersebut.

  </Accordion>

  <Accordion title="Kompatibilitas penggunaan streaming">
    Endpoint Model Studio native mengiklankan kompatibilitas penggunaan streaming pada
    transport bersama `openai-completions`. OpenClaw sekarang menentukannya berdasarkan
    kapabilitas endpoint, sehingga id penyedia kustom yang kompatibel dengan DashScope dan menargetkan
    host native yang sama mewarisi perilaku penggunaan streaming yang sama, alih-alih
    secara khusus memerlukan id penyedia bawaan `qwen`.

    Kompatibilitas penggunaan streaming native berlaku untuk host Coding Plan maupun
    host Standar yang kompatibel dengan DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Wilayah endpoint multimodal">
    Permukaan multimodal (pemahaman video dan pembuatan video Wan) menggunakan endpoint DashScope
    **Standar**, bukan endpoint Coding Plan:

    - URL dasar Standar Global/Internasional: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL dasar Standar China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Penyiapan lingkungan dan daemon">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `QWEN_API_KEY`
    tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan penyedia.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/id/providers/alibaba" icon="cloud">
    Penyedia ModelStudio lama dan catatan migrasi.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
