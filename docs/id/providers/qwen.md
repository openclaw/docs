---
read_when:
    - Anda ingin menggunakan Qwen dengan OpenClaw
    - Anda sebelumnya menggunakan OAuth Qwen
summary: Gunakan Qwen Cloud melalui Plugin OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:07:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw sekarang memperlakukan Qwen sebagai Plugin penyedia kelas utama dengan id kanonis
`qwen`. Plugin penyedia menargetkan endpoint Qwen Cloud / Alibaba DashScope dan
Coding Plan, tetap membuat id lama `modelstudio` berfungsi sebagai alias
kompatibilitas, dan juga mengekspos alur token Qwen Portal sebagai penyedia `qwen-oauth`.

- Penyedia: `qwen`
- Penyedia Portal: [`qwen-oauth`](/id/providers/qwen-oauth)
- Env var yang disarankan: `QWEN_API_KEY`
- Juga diterima untuk kompatibilitas: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Gaya API: kompatibel dengan OpenAI

<Tip>
Jika Anda menginginkan `qwen3.6-plus`, pilih endpoint **Standar (bayar sesuai pemakaian)**.
Dukungan Coding Plan dapat tertinggal dari katalog publik.
</Tip>

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Memulai

Pilih jenis paket Anda dan ikuti langkah-langkah penyiapan.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Terbaik untuk:** akses berbasis langganan melalui Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Buat atau salin kunci API dari [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Untuk endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Untuk endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Id auth-choice lama `modelstudio-*` dan ref model `modelstudio/...` masih
    berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru sebaiknya menggunakan
    id auth-choice kanonis `qwen-*` dan ref model `qwen/...`. Jika Anda mendefinisikan entri
    `models.providers.modelstudio` kustom yang persis dengan nilai `api` lain, maka
    penyedia kustom tersebut memiliki ref `modelstudio/...`, bukan alias kompatibilitas
    Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Terbaik untuk:** akses bayar sesuai pemakaian melalui endpoint Standard Model Studio, termasuk model seperti `qwen3.6-plus` yang mungkin tidak tersedia di Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Buat atau salin kunci API dari [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Untuk endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Untuk endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Id auth-choice lama `modelstudio-*` dan ref model `modelstudio/...` masih
    berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru sebaiknya menggunakan
    id auth-choice kanonis `qwen-*` dan ref model `qwen/...`. Jika Anda mendefinisikan entri
    `models.providers.modelstudio` kustom yang persis dengan nilai `api` lain, maka
    penyedia kustom tersebut memiliki ref `modelstudio/...`, bukan alias kompatibilitas
    Qwen.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Terbaik untuk:** token Qwen Portal terhadap `https://portal.qwen.ai/v1`.

    Lihat [Qwen OAuth / Portal](/id/providers/qwen-oauth) untuk halaman penyedia
    khusus dan catatan migrasi.

    <Steps>
      <Step title="Provide your portal token">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` menggunakan nama env var `QWEN_API_KEY` yang sama seperti penyedia
    DashScope, tetapi menyimpan auth di bawah id penyedia `qwen-oauth` saat dikonfigurasi
    melalui onboarding OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Jenis paket dan endpoint

| Paket                      | Wilayah | Pilihan auth              | Endpoint                                         |
| -------------------------- | ------- | ------------------------- | ------------------------------------------------ |
| Standar (bayar sesuai pemakaian) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standar (bayar sesuai pemakaian) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (langganan)    | China   | `qwen-api-key-cn`         | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (langganan)    | Global  | `qwen-api-key`            | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global  | `qwen-oauth`              | `portal.qwen.ai/v1`                              |

Penyedia memilih endpoint secara otomatis berdasarkan pilihan auth Anda. Pilihan
kanonis menggunakan keluarga `qwen-*`; `modelstudio-*` tetap hanya untuk kompatibilitas.
Anda dapat menimpanya dengan `baseUrl` kustom dalam konfigurasi.

<Tip>
**Kelola kunci:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentasi:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Katalog bawaan

OpenClaw saat ini mengirimkan katalog statis Qwen ini. Katalog yang dikonfigurasi
sadar endpoint: konfigurasi Coding Plan menghilangkan model yang hanya diketahui berfungsi pada
endpoint Standar.

| Ref model                   | Input       | Konteks   | Catatan                                            |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | teks, gambar | 1,000,000 | Model default                                      |
| `qwen/qwen3.6-plus`         | teks, gambar | 1,000,000 | Pilih endpoint Standar saat Anda memerlukan model ini |
| `qwen/qwen3-max-2026-01-23` | teks        | 262,144   | Lini Qwen Max                                      |
| `qwen/qwen3-coder-next`     | teks        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | teks        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | teks        | 1,000,000 | Penalaran diaktifkan                               |
| `qwen/glm-5`                | teks        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | teks        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | teks, gambar | 262,144   | Moonshot AI melalui Alibaba                        |
| `qwen-oauth/qwen3.5-plus`   | teks, gambar | 1,000,000 | Default Qwen Portal                                |

<Note>
Ketersediaan tetap dapat berbeda menurut endpoint dan paket penagihan meskipun sebuah model
ada dalam katalog statis.
</Note>

## Kontrol penalaran

Untuk model Qwen Cloud yang mendukung penalaran, penyedia memetakan level
penalaran OpenClaw ke flag permintaan tingkat atas DashScope `enable_thinking`. Penalaran yang
dinonaktifkan mengirim `enable_thinking: false`; level penalaran lain mengirim
`enable_thinking: true`.

## Add-on multimodal

Plugin `qwen` juga mengekspos kemampuan multimodal pada endpoint DashScope **Standar**
(bukan endpoint Coding Plan):

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
  <Accordion title="Image and video understanding">
    Plugin Qwen mendaftarkan pemahaman media untuk gambar dan video
    pada endpoint DashScope **Standar** (bukan endpoint Coding Plan).

    | Properti      | Nilai                 |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | Input yang didukung | Gambar, video   |

    Pemahaman media diselesaikan otomatis dari auth Qwen yang dikonfigurasi — tidak
    diperlukan konfigurasi tambahan. Pastikan Anda menggunakan endpoint Standar (bayar sesuai pemakaian)
    untuk dukungan pemahaman media.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` tersedia pada endpoint Model Studio Standar (bayar sesuai pemakaian):

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Jika endpoint Coding Plan mengembalikan kesalahan "model tidak didukung" untuk
    `qwen3.6-plus`, beralihlah ke Standar (bayar sesuai pemakaian), bukan pasangan
    endpoint/kunci Coding Plan.

    Katalog statis Qwen OpenClaw tidak mengiklankan `qwen3.6-plus` pada endpoint Coding
    Plan, tetapi entri `qwen/qwen3.6-plus` yang dikonfigurasi secara eksplisit di bawah
    `models.providers.qwen.models` tetap dihormati pada baseUrl Coding Plan sehingga Anda
    dapat mengaktifkan model tersebut jika Aliyun mengaktifkannya pada langganan Anda. API
    upstream tetap menentukan apakah panggilan berhasil.

  </Accordion>

  <Accordion title="Capability plan">
    Plugin `qwen` diposisikan sebagai rumah vendor untuk seluruh permukaan Qwen
    Cloud, bukan hanya model coding/teks.

    - **Model teks/chat:** tersedia melalui Plugin
    - **Pemanggilan alat, output terstruktur, penalaran:** diwarisi dari transport kompatibel OpenAI
    - **Pembuatan gambar:** direncanakan pada lapisan Plugin penyedia
    - **Pemahaman gambar/video:** tersedia melalui Plugin pada endpoint Standar
    - **Ucapan/audio:** direncanakan pada lapisan Plugin penyedia
    - **Embedding/reranking memori:** direncanakan melalui permukaan adaptor embedding
    - **Pembuatan video:** tersedia melalui Plugin melalui kemampuan pembuatan video bersama

  </Accordion>

  <Accordion title="Video generation details">
    Untuk pembuatan video, OpenClaw memetakan wilayah Qwen yang dikonfigurasi ke host
    DashScope AIGC yang sesuai sebelum mengirimkan pekerjaan:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Artinya, `models.providers.qwen.baseUrl` normal yang mengarah ke host
    Coding Plan atau Standar Qwen tetap menjaga pembuatan video pada endpoint video
    regional DashScope yang benar.

    Batas pembuatan video Qwen saat ini:

    - Hingga **1** video output per permintaan
    - Hingga **1** gambar input
    - Hingga **4** video input
    - Durasi hingga **10 detik**
    - Mendukung `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`
    - Mode gambar/video referensi saat ini memerlukan **URL http(s) jarak jauh**. Path
      file lokal ditolak sejak awal karena endpoint video DashScope tidak
      menerima buffer lokal yang diunggah untuk referensi tersebut.

  </Accordion>

  <Accordion title="Kompatibilitas penggunaan streaming">
    Endpoint Model Studio native mengiklankan kompatibilitas penggunaan streaming pada
    transport `openai-completions` bersama. OpenClaw kini menentukannya berdasarkan
    kemampuan endpoint, sehingga id penyedia kustom yang kompatibel dengan DashScope yang menargetkan
    host native yang sama mewarisi perilaku penggunaan streaming yang sama, alih-alih
    mengharuskan id penyedia bawaan `qwen` secara spesifik.

    Kompatibilitas penggunaan native-streaming berlaku untuk host Coding Plan dan
    host Standard yang kompatibel dengan DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Wilayah endpoint multimodal">
    Surface multimodal (pemahaman video dan pembuatan video Wan) menggunakan endpoint
    DashScope **Standard**, bukan endpoint Coding Plan:

    - URL dasar Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL dasar Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

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
