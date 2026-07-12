---
read_when:
    - Anda ingin menggunakan Qwen dengan OpenClaw
    - Anda memiliki langganan Alibaba Cloud Token Plan
    - Anda sebelumnya menggunakan OAuth Qwen
summary: Gunakan Qwen Cloud melalui plugin OpenClaw-nya
title: Qwen
x-i18n:
    generated_at: "2026-07-12T14:36:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud adalah plugin penyedia eksternal resmi OpenClaw dengan id kanonis `qwen`. Plugin ini ditujukan untuk endpoint Qwen Cloud / Alibaba DashScope Standard dan Coding Plan, menyediakan Token Plan sebagai `qwen-token-plan`, mempertahankan `modelstudio` sebagai alias kompatibilitas, secara mandiri memiliki id penyedia khusus `bailian-token-plan` yang didokumentasikan Alibaba, dan menyediakan alur token Qwen Portal sebagai [`qwen-oauth`](/id/providers/qwen-oauth).

| Properti                         | Nilai                                      |
| -------------------------------- | ------------------------------------------ |
| Penyedia                         | `qwen`                                     |
| Penyedia Token Plan              | `qwen-token-plan`                          |
| Penyedia portal                  | [`qwen-oauth`](/id/providers/qwen-oauth)      |
| Variabel lingkungan yang disukai | `QWEN_API_KEY`                             |
| Variabel lingkungan Token Plan   | `QWEN_TOKEN_PLAN_API_KEY`                  |
| Juga diterima (kompatibilitas)   | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Gaya API                         | Kompatibel dengan OpenAI                   |

<Tip>
`qwen3.7-plus` dan `qwen3.6-plus` berfungsi dengan endpoint Coding Plan dan Standard.
Untuk `qwen3.7-max` atau `qwen3.6-flash`, gunakan endpoint **Standard (bayar sesuai pemakaian)**.
</Tip>

## Instal plugin

`qwen` disediakan sebagai plugin eksternal resmi dan tidak dibundel dengan inti. Instal plugin tersebut dan mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Memulai

Pilih jenis paket Anda dan ikuti langkah-langkah penyiapannya.

<Tabs>
  <Tab title="Coding Plan (langganan)">
    **Paling sesuai untuk:** akses berbasis langganan melalui Qwen Coding Plan.

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
      <Step title="Tetapkan model bawaan">
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
      <Step title="Pastikan model tersedia">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Id pilihan autentikasi `modelstudio-*` dan referensi model `modelstudio/...`
    lama masih berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru
    sebaiknya menggunakan id pilihan autentikasi `qwen-*` dan referensi model
    `qwen/...` yang kanonis. Jika Anda menentukan entri khusus
    `models.providers.modelstudio` yang persis dengan nilai `api` lain, penyedia
    khusus tersebut memiliki referensi `modelstudio/...`, bukan alias
    kompatibilitas Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (bayar sesuai pemakaian)">
    **Paling sesuai untuk:** akses bayar sesuai pemakaian melalui endpoint Standard Model Studio, termasuk `qwen3.7-max` dan `qwen3.6-flash`, yang tidak tersedia pada Coding Plan.

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
      <Step title="Tetapkan model bawaan">
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
      <Step title="Pastikan model tersedia">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Id pilihan autentikasi `modelstudio-*` dan referensi model `modelstudio/...`
    lama masih berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru
    sebaiknya menggunakan id pilihan autentikasi `qwen-*` dan referensi model
    `qwen/...` yang kanonis. Jika Anda menentukan entri khusus
    `models.providers.modelstudio` yang persis dengan nilai `api` lain, penyedia
    khusus tersebut memiliki referensi `modelstudio/...`, bukan alias
    kompatibilitas Qwen.
    </Note>

  </Tab>

  <Tab title="Token Plan (Edisi Tim)">
    **Paling sesuai untuk:** akses langganan tim berbasis kredit ke Qwen dan model pihak ketiga yang didukung melalui Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Dapatkan kunci khusus Anda">
        Tetapkan satu jatah Token Plan dan buat kunci khusus `sk-sp-...` untuknya. Kunci Token Plan, Coding Plan, dan bayar sesuai pemakaian tidak dapat saling dipertukarkan. Lihat [ikhtisar Token Plan Global](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) atau [ikhtisar Token Plan China](https://help.aliyun.com/zh/model-studio/token-plan-overview).
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
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    Panduan OpenClaw Alibaba menggunakan `bailian-token-plan` untuk penyedia
    khusus manual. Plugin mendaftarkan id tersebut sebagai pemilik kompatibilitas,
    tetapi konfigurasi baru sebaiknya menggunakan `qwen-token-plan`. Entri khusus
    `models.providers.bailian-token-plan` yang persis tetap memiliki transpor dan
    katalog yang dikonfigurasikan; entri tersebut tidak pernah digabungkan ke
    dalam katalog OpenAI kanonis.
    </Note>

    <Warning>
    Gunakan Token Plan hanya untuk sesi OpenClaw interaktif. Jangan memilihnya
    untuk pekerjaan cron, skrip tanpa pengawasan, atau backend aplikasi. Alibaba
    menyatakan bahwa penggunaan noninteraktif dapat menangguhkan langganan atau
    mencabut kunci API-nya.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Paling sesuai untuk:** token Qwen Portal yang digunakan terhadap `https://portal.qwen.ai/v1`.

    Lihat [Qwen OAuth / Portal](/id/providers/qwen-oauth) untuk halaman penyedia
    khusus dan catatan migrasi.

    <Steps>
      <Step title="Berikan token portal Anda">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Tetapkan model bawaan">
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
      <Step title="Pastikan model tersedia">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` menggunakan nama variabel lingkungan `QWEN_API_KEY` yang sama
    dengan penyedia Qwen Cloud, tetapi menyimpan autentikasi di bawah id penyedia
    `qwen-oauth` saat dikonfigurasikan melalui orientasi awal OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Jenis paket dan endpoint

| Paket                            | Wilayah | Pilihan autentikasi         | Endpoint                                                         |
| -------------------------------- | ------- | --------------------------- | ---------------------------------------------------------------- |
| Coding Plan (langganan)          | China   | `qwen-api-key-cn`           | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (langganan)          | Global  | `qwen-api-key`              | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                      | Global  | `qwen-oauth`                | `portal.qwen.ai/v1`                                              |
| Standard (bayar sesuai pemakaian)| China   | `qwen-standard-api-key-cn`  | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (bayar sesuai pemakaian)| Global  | `qwen-standard-api-key`     | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (Edisi Tim)           | China   | `qwen-token-plan-cn`        | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (Edisi Tim)           | Global  | `qwen-token-plan`           | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

Penyedia secara otomatis memilih endpoint berdasarkan pilihan autentikasi Anda.
Pilihan kanonis menggunakan kelompok `qwen-*`; `modelstudio-*` tetap hanya untuk
kompatibilitas. Timpa dengan `baseUrl` khusus dalam konfigurasi.

<Tip>
**Kelola kunci:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentasi:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Katalog bawaan

OpenClaw menyediakan katalog statis Qwen ini. Katalog tersebut memperhitungkan
endpoint: konfigurasi Coding Plan menghilangkan model yang hanya berfungsi pada
endpoint Standard.

| Referensi model              | Masukan     | Konteks   | Catatan                          |
| ---------------------------- | ----------- | --------- | -------------------------------- |
| `qwen/qwen3.5-plus`          | teks, gambar| 1,000,000 | Model bawaan                     |
| `qwen/qwen3.6-flash`         | teks, gambar| 1,000,000 | Hanya endpoint Standard          |
| `qwen/qwen3.6-plus`          | teks, gambar| 1,000,000 | Coding Plan + Standard           |
| `qwen/qwen3.7-max`           | teks        | 1,000,000 | Hanya endpoint Standard          |
| `qwen/qwen3.7-plus`          | teks, gambar| 1,000,000 | Coding Plan + Standard           |
| `qwen/qwen3-max-2026-01-23`  | teks        | 262,144   | Seri Qwen Max                    |
| `qwen/qwen3-coder-next`      | teks        | 262,144   | Pemrograman                      |
| `qwen/qwen3-coder-plus`      | teks        | 1,000,000 | Pemrograman                      |
| `qwen/MiniMax-M2.5`          | teks        | 1,000,000 | Penalaran diaktifkan             |
| `qwen/glm-5`                 | teks        | 202,752   | GLM                              |
| `qwen/glm-4.7`               | teks        | 202,752   | GLM                              |
| `qwen/kimi-k2.5`             | teks, gambar| 262,144   | Moonshot AI melalui Alibaba      |
| `qwen-oauth/qwen3.5-plus`    | teks, gambar| 1,000,000 | Bawaan Qwen Portal               |

<Note>
Ketersediaan tetap dapat berbeda menurut endpoint dan paket penagihan meskipun
suatu model tercantum dalam katalog statis.
</Note>

### Katalog Token Plan

Token Plan menggunakan daftar izin pencocokan string persis yang terpisah. Model
paket yang hanya untuk pembuatan gambar tidak disertakan di sini karena
menggunakan API yang berbeda.

| Referensi model                      | Masukan      | Konteks   |
| ------------------------------------ | ------------ | --------- |
| `qwen-token-plan/qwen3.7-max`        | teks         | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`       | teks, gambar | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`       | teks, gambar | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`      | teks, gambar | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`    | teks         | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash`  | teks         | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`      | teks         | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`     | teks, gambar | 262,144   |
| `qwen-token-plan/kimi-k2.6`          | teks, gambar | 262,144   |
| `qwen-token-plan/kimi-k2.5`          | teks, gambar | 262,144   |
| `qwen-token-plan/glm-5.2`            | teks         | 1,000,000 |
| `qwen-token-plan/glm-5.1`            | teks         | 202,752   |
| `qwen-token-plan/glm-5`              | teks         | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`       | teks         | 196,608   |

## Kontrol penalaran

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash`, dan `qwen3.6-plus`
mendukung penalaran dalam katalog bawaan. Untuk model penalaran dalam keluarga
`qwen`, penyedia memetakan tingkat pemikiran OpenClaw ke flag permintaan tingkat
atas `enable_thinking` milik DashScope: pemikiran yang dinonaktifkan mengirim
`enable_thinking: false`, sedangkan tingkat lainnya mengirim `enable_thinking: true`.
Model khusus dapat memilih payload pemikiran templat obrolan alternatif dengan
menetapkan `compat.thinkingFormat: "qwen-chat-template"` pada entri model.

Model Token Plan juga ditandai mendukung penalaran. `kimi-k2.7-code` dan
`MiniMax-M2.5` hanya mendukung pemikiran, sehingga OpenClaw mempertahankan
pemikiran tetap aktif meskipun sesi meminta `/think off`. DeepSeek V4 memetakan
`minimal` hingga `high` ke upaya `high` milik layanan dan memetakan `xhigh` atau
`max` ke `max`. GLM 5.2 menerima seluruh rentang `minimal` hingga `max`; GLM 5.1
dan GLM 5 menerima hingga `xhigh`, dan ketiganya menggunakan `high` secara
default. Model hibrida lainnya mengikuti status aktif/nonaktif yang diminta.

## Fitur tambahan multimodal

Plugin `qwen` menyediakan kemampuan multimodal hanya pada endpoint DashScope
**Standard**, bukan endpoint Coding Plan:

- **Pemahaman gambar dan video** melalui `qwen-vl-max-latest`
- **Pembuatan video Wan** melalui `wan2.6-t2v` (default), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Pemahaman media ditentukan secara otomatis dari autentikasi Qwen yang
dikonfigurasi; tidak diperlukan konfigurasi tambahan. Pastikan Anda menggunakan
endpoint Standard (bayar sesuai pemakaian) agar pemahaman media berfungsi.

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
(gambar-ke-video), hingga 4 video masukan (video-ke-video), dan durasi maksimum
10 detik. Mendukung `size`, `aspectRatio`, `resolution`, `audio`, dan
`watermark`. Masukan gambar/video referensi memerlukan URL http(s) jarak jauh;
jalur berkas lokal langsung ditolak karena endpoint video DashScope tidak
menerima buffer lokal yang diunggah untuk referensi tersebut.

<Note>
Lihat [Pembuatan video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan penyedia, dan perilaku failover.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Ketersediaan Qwen 3.6 dan 3.7">
    `qwen3.7-plus` dan `qwen3.6-plus` tersedia pada endpoint Coding Plan dan Standard. `qwen3.7-max` dan `qwen3.6-flash` hanya tersedia pada Standard. Endpoint Standard (bayar sesuai pemakaian) adalah:

    - Tiongkok: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw menghilangkan `qwen3.7-max` dan `qwen3.6-flash` dari katalog Coding Plan.
    Jika endpoint Coding Plan mengembalikan galat "unsupported model" untuk salah
    satunya, beralihlah ke endpoint Standard dan kunci yang sesuai.

  </Accordion>

  <Accordion title="Perutean wilayah pembuatan video">
    OpenClaw memetakan wilayah Qwen yang dikonfigurasi ke host AIGC DashScope
    yang sesuai sebelum mengirimkan tugas video:

    - Global/Internasional: `https://dashscope-intl.aliyuncs.com`
    - Tiongkok: `https://dashscope.aliyuncs.com`

    `models.providers.qwen.baseUrl` biasa yang mengarah ke host Qwen Coding Plan
    atau Standard tetap merutekan pembuatan video ke endpoint video DashScope
    regional yang sesuai.

  </Accordion>

  <Accordion title="Kompatibilitas penggunaan streaming">
    Endpoint Qwen native menyatakan kompatibilitas penggunaan streaming pada
    transportasi bersama `openai-completions`, sehingga ID penyedia khusus yang
    kompatibel dengan DashScope dan menargetkan host native yang sama mewarisi
    perilaku yang sama tanpa secara khusus memerlukan ID penyedia bawaan `qwen`.
    Hal ini berlaku untuk endpoint Coding Plan, Standard, dan Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Rencana kemampuan">
    Plugin `qwen` diposisikan sebagai pusat penyedia untuk seluruh cakupan Qwen
    Cloud, bukan hanya model pemrograman/teks.

    - **Model teks/obrolan:** tersedia melalui Plugin
    - **Pemanggilan alat, keluaran terstruktur, pemikiran:** diwarisi dari transportasi yang kompatibel dengan OpenAI
    - **Pembuatan gambar:** direncanakan pada lapisan Plugin penyedia
    - **Pemahaman gambar/video:** tersedia melalui Plugin pada endpoint Standard
    - **Ucapan/audio:** direncanakan pada lapisan Plugin penyedia
    - **Embedding/pemeringkatan ulang memori:** direncanakan melalui lapisan adaptor embedding
    - **Pembuatan video:** tersedia melalui Plugin melalui kemampuan pembuatan video bersama

  </Accordion>

  <Accordion title="Penyiapan lingkungan dan daemon">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan
    `QWEN_API_KEY` atau `QWEN_TOKEN_PLAN_API_KEY` tersedia bagi proses tersebut
    (misalnya, dalam `~/.openclaw/.env` atau melalui `env.shellEnv`).
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
    Penyedia pembuatan video Wan yang disertakan pada platform DashScope yang sama.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan pertanyaan umum.
  </Card>
</CardGroup>
