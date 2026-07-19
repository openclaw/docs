---
read_when:
    - Anda ingin menggunakan Qwen dengan OpenClaw
    - Anda memiliki langganan Alibaba Cloud Token Plan
summary: Gunakan Qwen Cloud melalui plugin OpenClaw-nya
title: Qwen
x-i18n:
    generated_at: "2026-07-19T05:34:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74f94a35631dcdf8c9afc12e86d7a9d6b51a359411ba36f8820f8b1e7c03a27a
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud adalah plugin penyedia eksternal resmi OpenClaw dengan id kanonis `qwen`. Plugin ini ditujukan untuk endpoint Qwen Cloud / Alibaba DashScope Standard dan Coding Plan, mengekspos Token Plan sebagai `qwen-token-plan`, mempertahankan `modelstudio` sebagai alias kompatibilitas, dan secara independen memiliki id penyedia khusus `bailian-token-plan` yang didokumentasikan Alibaba.

| Properti                  | Nilai                                      |
| ------------------------- | ------------------------------------------ |
| Penyedia                  | `qwen`                                     |
| Penyedia Token Plan       | `qwen-token-plan`                          |
| Variabel lingkungan utama | `QWEN_API_KEY`                             |
| Variabel lingkungan Token Plan | `QWEN_TOKEN_PLAN_API_KEY`                  |
| Juga diterima (kompatibilitas) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Gaya API                  | Kompatibel dengan OpenAI                   |

<Tip>
`qwen3.7-plus` dan `qwen3.6-plus` berfungsi dengan endpoint Coding Plan dan Standard.
Untuk `qwen3.7-max` atau `qwen3.6-flash`, gunakan endpoint **Standard (bayar sesuai pemakaian)**.
</Tip>

## Instal plugin

`qwen` didistribusikan sebagai plugin eksternal resmi, bukan disertakan bersama core. Instal plugin tersebut dan mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Memulai

Pilih jenis paket Anda dan ikuti langkah-langkah penyiapan.

<Tabs>
  <Tab title="Coding Plan (langganan)">
    **Paling cocok untuk:** akses berbasis langganan melalui Qwen Coding Plan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat atau salin kunci API dari [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Jalankan orientasi awal">
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
    Id pilihan autentikasi lama `modelstudio-*` dan referensi model `modelstudio/...` masih
    berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru sebaiknya mengutamakan id
    pilihan autentikasi kanonis `qwen-*` dan referensi model `qwen/...`. Jika Anda menentukan entri
    khusus `models.providers.modelstudio` yang persis dengan nilai `api` lain, penyedia
    khusus tersebut memiliki referensi `modelstudio/...`, bukan alias kompatibilitas
    Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (bayar sesuai pemakaian)">
    **Paling cocok untuk:** akses bayar sesuai pemakaian melalui endpoint Standard Model Studio, termasuk `qwen3.7-max` dan `qwen3.6-flash`, yang tidak tersedia di Coding Plan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat atau salin kunci API dari [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Jalankan orientasi awal">
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
    Id pilihan autentikasi lama `modelstudio-*` dan referensi model `modelstudio/...` masih
    berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru sebaiknya mengutamakan id
    pilihan autentikasi kanonis `qwen-*` dan referensi model `qwen/...`. Jika Anda menentukan entri
    khusus `models.providers.modelstudio` yang persis dengan nilai `api` lain, penyedia
    khusus tersebut memiliki referensi `modelstudio/...`, bukan alias kompatibilitas
    Qwen.
    </Note>

  </Tab>

  <Tab title="Token Plan (Edisi Tim)">
    **Paling cocok untuk:** akses langganan tim berbasis kredit ke Qwen dan model pihak ketiga yang didukung melalui Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Dapatkan kunci khusus Anda">
        Tetapkan satu tempat Token Plan dan buat kunci khusus `sk-sp-...` untuknya. Kunci Token Plan, Coding Plan, dan bayar sesuai pemakaian tidak dapat dipertukarkan. Lihat [ikhtisar Token Plan Global](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) atau [ikhtisar Token Plan China](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Jalankan orientasi awal">
        Untuk endpoint **Global / Internasional** di Singapura:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Untuk endpoint **China** di Beijing:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Verifikasi penyedia">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Balas dengan: token plan siap"
        ```
      </Step>
    </Steps>

    <Note>
    Panduan OpenClaw Alibaba menggunakan `bailian-token-plan` untuk penyedia khusus
    manual. Plugin mendaftarkan id tersebut sebagai pemilik kompatibilitas, tetapi konfigurasi
    baru sebaiknya menggunakan `qwen-token-plan`. Entri khusus
    `models.providers.bailian-token-plan` yang persis tetap memiliki transportasi dan katalog yang
    dikonfigurasikan; entri tersebut tidak pernah digabungkan ke dalam katalog OpenAI kanonis.
    </Note>

    <Warning>
    Gunakan Token Plan hanya untuk sesi OpenClaw interaktif. Jangan memilihnya untuk
    tugas cron, skrip tanpa pengawasan, atau backend aplikasi. Alibaba menyatakan bahwa
    penggunaan noninteraktif dapat menangguhkan langganan atau mencabut kunci API-nya.
    </Warning>

  </Tab>

</Tabs>

## Jenis paket dan endpoint

| Paket                      | Wilayah | Pilihan autentikasi        | Endpoint                                                         |
| -------------------------- | ------- | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (langganan)    | China   | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (langganan)    | Global  | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Standard (bayar sesuai pemakaian) | China   | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (bayar sesuai pemakaian) | Global  | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (Edisi Tim)     | China   | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (Edisi Tim)     | Global  | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

Penyedia secara otomatis memilih endpoint berdasarkan pilihan autentikasi Anda. Pilihan
kanonis menggunakan keluarga `qwen-*`; `modelstudio-*` tetap hanya untuk kompatibilitas.
Timpa dengan `baseUrl` khusus dalam konfigurasi.

<Tip>
**Kelola kunci:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentasi:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Katalog bawaan

OpenClaw mendistribusikan katalog statis Qwen ini. Katalog ini memperhatikan endpoint: konfigurasi Coding
Plan menghilangkan model yang hanya berfungsi pada endpoint Standard.

| Referensi model             | Masukan     | Konteks   | Catatan                 |
| --------------------------- | ----------- | --------- | ----------------------- |
| `qwen/qwen3.5-plus`         | teks, gambar | 1,000,000 | Model default           |
| `qwen/qwen3.6-flash`        | teks, gambar | 1,000,000 | Hanya endpoint Standard |
| `qwen/qwen3.6-plus`         | teks, gambar | 1,000,000 | Coding Plan + Standard  |
| `qwen/qwen3.7-max`          | teks        | 1,000,000 | Hanya endpoint Standard |
| `qwen/qwen3.7-plus`         | teks, gambar | 1,000,000 | Coding Plan + Standard  |
| `qwen/qwen3-max-2026-01-23` | teks        | 262,144   | Lini Qwen Max           |
| `qwen/qwen3-coder-next`     | teks        | 262,144   | Pengodean               |
| `qwen/qwen3-coder-plus`     | teks        | 1,000,000 | Pengodean               |
| `qwen/MiniMax-M2.5`         | teks        | 1,000,000 | Penalaran diaktifkan    |
| `qwen/glm-5`                | teks        | 202,752   | GLM                     |
| `qwen/glm-4.7`              | teks        | 202,752   | GLM                     |
| `qwen/kimi-k2.5`            | teks, gambar | 262,144   | Moonshot AI melalui Alibaba |

<Note>
Ketersediaan masih dapat berbeda menurut endpoint dan paket penagihan meskipun suatu model
tercantum dalam katalog statis.
</Note>

### Katalog Token Plan

Token Plan menggunakan daftar yang diizinkan berdasarkan pencocokan string persis yang terpisah. Model paket
yang hanya menghasilkan gambar tidak disertakan di sini karena menggunakan API yang berbeda.

| Referensi model                     | Masukan     | Konteks   |
| ----------------------------------- | ----------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | teks        | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | teks, gambar | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | teks, gambar | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | teks, gambar | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | teks        | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | teks        | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | teks        | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | teks, gambar | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | teks, gambar | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | teks, gambar | 262,144   |
| `qwen-token-plan/glm-5.2`           | teks        | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | teks        | 202,752   |
| `qwen-token-plan/glm-5`             | teks        | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | teks        | 196,608   |

## Kontrol pemikiran

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash`, dan `qwen3.6-plus`
mendukung penalaran dalam katalog bawaan. Untuk model penalaran pada keluarga `qwen`,
penyedia memetakan tingkat pemikiran OpenClaw ke flag permintaan tingkat atas
`enable_thinking` milik DashScope: pemikiran yang dinonaktifkan mengirim `enable_thinking: false`,
sedangkan tingkat lainnya mengirim `enable_thinking: true`. Model khusus dapat memilih untuk menggunakan
payload pemikiran templat obrolan alternatif dengan menetapkan
`compat.thinkingFormat: "qwen-chat-template"` pada entri model.

Model Token Plan juga ditandai mampu melakukan penalaran. `kimi-k2.7-code` dan
`MiniMax-M2.5` hanya mendukung pemikiran, sehingga OpenClaw mempertahankan pemikiran tetap aktif bahkan ketika
sesi meminta `/think off`. DeepSeek V4 memetakan `minimal` hingga `high` ke
upaya `high` milik layanan dan memetakan `xhigh` atau `max` ke `max`. GLM 5.2 menerima
rentang penuh `minimal` hingga `max`; GLM 5.1 dan GLM 5 menerima hingga
`xhigh`, dan ketiganya menggunakan `high` secara default. Model hibrida lainnya mengikuti
status aktif/nonaktif yang diminta.

## Pengaya multimodal

Plugin `qwen` mengekspos kemampuan multimodal hanya pada endpoint DashScope **Standard**,
bukan endpoint Coding Plan:

- **Pemahaman gambar dan video** melalui `qwen3.6-plus`
- **Pembuatan video Wan** melalui `wan2.6-t2v` (default), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Pemahaman media diselesaikan secara otomatis dari autentikasi Qwen yang dikonfigurasikan; tidak diperlukan
konfigurasi tambahan. Pastikan Anda menggunakan endpoint Standard (bayar sesuai pemakaian) agar
pemahaman media berfungsi.

Untuk menjadikan Qwen sebagai penyedia video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Batas pembuatan video: 1 video keluaran per permintaan, hingga 1 gambar masukan
(gambar-ke-video), hingga 4 video masukan (video-ke-video), durasi maksimum 10 detik.
Mendukung `size`, `aspectRatio`, `resolution`, `audio`, dan
`watermark`. Masukan gambar/video referensi memerlukan URL http(s) jarak jauh; jalur
file lokal ditolak sejak awal karena endpoint video DashScope tidak
menerima buffer lokal yang diunggah untuk referensi tersebut.

<Note>
Lihat [Pembuatan video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Ketersediaan Qwen 3.6 dan 3.7">
    `qwen3.7-plus` dan `qwen3.6-plus` tersedia di endpoint Coding Plan dan Standard. `qwen3.7-max` dan `qwen3.6-flash` hanya tersedia di Standard. Endpoint Standard (bayar sesuai pemakaian) adalah:

    - Tiongkok: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw menghilangkan `qwen3.7-max` dan `qwen3.6-flash` dari katalog Coding Plan.
    Jika endpoint Coding Plan mengembalikan galat "unsupported model" untuk salah satunya,
    beralihlah ke endpoint dan kunci Standard yang sesuai.

  </Accordion>

  <Accordion title="Perutean wilayah pembuatan video">
    OpenClaw memetakan wilayah Qwen yang dikonfigurasi ke host AIGC DashScope yang sesuai
    sebelum mengirimkan tugas video:

    - Global/Internasional: `https://dashscope-intl.aliyuncs.com`
    - Tiongkok: `https://dashscope.aliyuncs.com`

    `models.providers.qwen.baseUrl` biasa yang mengarah ke host Qwen Coding Plan
    atau Standard tetap merutekan pembuatan video ke endpoint video DashScope
    regional yang sesuai.

  </Accordion>

  <Accordion title="Kompatibilitas penggunaan streaming">
    Endpoint Qwen native mengumumkan kompatibilitas penggunaan streaming pada transportasi
    `openai-completions` bersama, sehingga ID penyedia khusus yang kompatibel dengan DashScope
    dan menargetkan host native yang sama mewarisi perilaku yang sama tanpa secara khusus
    memerlukan ID penyedia bawaan `qwen`. Hal ini berlaku untuk endpoint Coding Plan,
    Standard, dan Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Rencana kapabilitas">
    Plugin `qwen` diposisikan sebagai pusat penyedia untuk seluruh permukaan Qwen
    Cloud, bukan hanya model pengodean/teks.

    - **Model teks/obrolan:** tersedia melalui plugin
    - **Pemanggilan alat, keluaran terstruktur, penalaran:** diwarisi dari transportasi yang kompatibel dengan OpenAI
    - **Pembuatan gambar:** direncanakan pada lapisan plugin penyedia
    - **Pemahaman gambar/video:** tersedia melalui plugin pada endpoint Standard
    - **Ucapan/audio:** direncanakan pada lapisan plugin penyedia
    - **Embedding/perangkingan ulang memori:** direncanakan melalui permukaan adaptor embedding
    - **Pembuatan video:** tersedia melalui plugin lewat kapabilitas pembuatan video bersama

  </Accordion>

  <Accordion title="Penyiapan lingkungan dan daemon">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `QWEN_API_KEY`
    atau `QWEN_TOKEN_PLAN_API_KEY` tersedia bagi proses tersebut (misalnya, di
    `~/.openclaw/.env` atau melalui `env.shellEnv`).
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
  <Card title="Alibaba Model Studio" href="/id/providers/alibaba" icon="cloud">
    Penyedia pembuatan video Wan terpaket pada platform DashScope yang sama.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
