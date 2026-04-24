---
read_when:
    - Anda ingin menggunakan Qwen dengan OpenClaw
    - Anda sebelumnya menggunakan OAuth Qwen
summary: Gunakan Qwen Cloud melalui provider qwen bawaan OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-24T09:24:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**OAuth Qwen telah dihapus.** Integrasi OAuth tier gratis
(`qwen-portal`) yang menggunakan endpoint `portal.qwen.ai` tidak lagi tersedia.
Lihat [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) untuk
latar belakang.

</Warning>

OpenClaw sekarang memperlakukan Qwen sebagai provider bawaan kelas satu dengan id
kanonis `qwen`. Provider bawaan ini menargetkan endpoint Qwen Cloud / Alibaba DashScope dan
Coding Plan serta tetap menjaga id `modelstudio` lama tetap berfungsi sebagai
alias kompatibilitas.

- Provider: `qwen`
- Env var yang diutamakan: `QWEN_API_KEY`
- Juga diterima untuk kompatibilitas: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Gaya API: kompatibel dengan OpenAI

<Tip>
Jika Anda menginginkan `qwen3.6-plus`, lebih baik gunakan endpoint **Standard (pay-as-you-go)**.
Dukungan Coding Plan dapat tertinggal dari katalog publik.
</Tip>

## Memulai

Pilih jenis paket Anda lalu ikuti langkah penyiapannya.

<Tabs>
  <Tab title="Coding Plan (langganan)">
    **Terbaik untuk:** akses berbasis langganan melalui Qwen Coding Plan.

    <Steps>
      <Step title="Dapatkan API key Anda">
        Buat atau salin API key dari [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
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
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Id auth-choice `modelstudio-*` lama dan ref model `modelstudio/...` masih
    berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru sebaiknya menggunakan
    id auth-choice `qwen-*` kanonis dan ref model `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Terbaik untuk:** akses pay-as-you-go melalui endpoint Standard Model Studio, termasuk model seperti `qwen3.6-plus` yang mungkin tidak tersedia di Coding Plan.

    <Steps>
      <Step title="Dapatkan API key Anda">
        Buat atau salin API key dari [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
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
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Id auth-choice `modelstudio-*` lama dan ref model `modelstudio/...` masih
    berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru sebaiknya menggunakan
    id auth-choice `qwen-*` kanonis dan ref model `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Jenis paket dan endpoint

| Paket                      | Wilayah | Auth choice                 | Endpoint                                         |
| -------------------------- | ------- | --------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China   | `qwen-standard-api-key-cn`  | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global  | `qwen-standard-api-key`     | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (langganan)    | China   | `qwen-api-key-cn`           | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (langganan)    | Global  | `qwen-api-key`              | `coding-intl.dashscope.aliyuncs.com/v1`          |

Provider memilih endpoint secara otomatis berdasarkan auth choice Anda. Pilihan
kanonis menggunakan keluarga `qwen-*`; `modelstudio-*` tetap hanya untuk kompatibilitas.
Anda dapat menimpanya dengan `baseUrl` kustom di config.

<Tip>
**Kelola key:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentasi:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Katalog bawaan

OpenClaw saat ini mengirim katalog Qwen bawaan ini. Katalog yang dikonfigurasi
sadar-endpoint: config Coding Plan menghilangkan model yang hanya diketahui berfungsi pada
endpoint Standard.

| Ref model                   | Input       | Konteks   | Catatan                                               |
| --------------------------- | ----------- | --------- | ----------------------------------------------------- |
| `qwen/qwen3.5-plus`         | teks, gambar | 1,000,000 | Model default                                         |
| `qwen/qwen3.6-plus`         | teks, gambar | 1,000,000 | Lebih baik gunakan endpoint Standard bila Anda memerlukan model ini |
| `qwen/qwen3-max-2026-01-23` | teks        | 262,144   | Lini Qwen Max                                         |
| `qwen/qwen3-coder-next`     | teks        | 262,144   | Coding                                                |
| `qwen/qwen3-coder-plus`     | teks        | 1,000,000 | Coding                                                |
| `qwen/MiniMax-M2.5`         | teks        | 1,000,000 | Penalaran diaktifkan                                  |
| `qwen/glm-5`                | teks        | 202,752   | GLM                                                   |
| `qwen/glm-4.7`              | teks        | 202,752   | GLM                                                   |
| `qwen/kimi-k2.5`            | teks, gambar | 262,144   | Moonshot AI via Alibaba                               |

<Note>
Ketersediaan masih dapat bervariasi menurut endpoint dan paket penagihan bahkan ketika suatu model
ada di katalog bawaan.
</Note>

## Add-on multimodal

Plugin `qwen` juga mengekspos kapabilitas multimodal pada endpoint DashScope **Standard**
(bukan endpoint Coding Plan):

- **Pemahaman video** melalui `qwen-vl-max-latest`
- **Pembuatan video Wan** melalui `wan2.6-t2v` (default), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Untuk menggunakan Qwen sebagai provider video default:

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
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Pemahaman gambar dan video">
    Plugin Qwen bawaan mendaftarkan pemahaman media untuk gambar dan video
    pada endpoint DashScope **Standard** (bukan endpoint Coding Plan).

    | Properti        | Nilai                 |
    | --------------- | --------------------- |
    | Model           | `qwen-vl-max-latest`  |
    | Input yang didukung | Gambar, video      |

    Pemahaman media di-resolve otomatis dari auth Qwen yang dikonfigurasi — tidak
    diperlukan config tambahan. Pastikan Anda menggunakan endpoint Standard (pay-as-you-go)
    untuk dukungan pemahaman media.

  </Accordion>

  <Accordion title="Ketersediaan Qwen 3.6 Plus">
    `qwen3.6-plus` tersedia pada endpoint Model Studio Standard (pay-as-you-go):

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Jika endpoint Coding Plan mengembalikan error "unsupported model" untuk
    `qwen3.6-plus`, beralihlah ke endpoint/key Standard (pay-as-you-go) alih-alih
    pasangan endpoint/key Coding Plan.

  </Accordion>

  <Accordion title="Rencana kapabilitas">
    Plugin `qwen` sedang diposisikan sebagai rumah vendor untuk seluruh surface Qwen
    Cloud, bukan hanya model coding/teks.

    - **Model teks/chat:** sudah dibundel sekarang
    - **Pemanggilan tool, output terstruktur, thinking:** diwarisi dari transport kompatibel OpenAI
    - **Pembuatan gambar:** direncanakan di layer provider-Plugin
    - **Pemahaman gambar/video:** sudah dibundel sekarang pada endpoint Standard
    - **Speech/audio:** direncanakan di layer provider-Plugin
    - **Embedding/reranking memory:** direncanakan melalui surface adapter embedding
    - **Pembuatan video:** sudah dibundel sekarang melalui kapabilitas pembuatan video bersama

  </Accordion>

  <Accordion title="Detail pembuatan video">
    Untuk pembuatan video, OpenClaw memetakan wilayah Qwen yang dikonfigurasi ke host
    DashScope AIGC yang cocok sebelum mengirim job:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Artinya `models.providers.qwen.baseUrl` normal yang menunjuk ke salah satu host
    Coding Plan atau Standard Qwen tetap menjaga pembuatan video pada endpoint video
    DashScope regional yang benar.

    Batas pembuatan video Qwen bawaan saat ini:

    - Hingga **1** video output per permintaan
    - Hingga **1** gambar input
    - Hingga **4** video input
    - Durasi hingga **10 detik**
    - Mendukung `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`
    - Mode gambar/video referensi saat ini memerlukan **URL http(s) remote**. Path
      file lokal ditolak di awal karena endpoint video DashScope tidak
      menerima buffer lokal yang diunggah untuk referensi tersebut.

  </Accordion>

  <Accordion title="Kompatibilitas penggunaan streaming">
    Endpoint Model Studio native mengiklankan kompatibilitas penggunaan streaming pada
    transport bersama `openai-completions`. OpenClaw kini mengaitkannya dengan kapabilitas endpoint,
    sehingga id provider kustom yang kompatibel DashScope dan menargetkan host native yang sama
    mewarisi perilaku penggunaan streaming yang sama alih-alih
    memerlukan id provider `qwen` bawaan secara khusus.

    Kompatibilitas penggunaan native-streaming berlaku untuk host Coding Plan dan
    host Standard DashScope-compatible:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Wilayah endpoint multimodal">
    Surface multimodal (pemahaman video dan pembuatan video Wan) menggunakan endpoint DashScope **Standard**, bukan endpoint Coding Plan:

    - URL dasar Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL dasar Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Environment dan penyiapan daemon">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `QWEN_API_KEY`
    tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan provider.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/id/providers/alibaba" icon="cloud">
    Provider ModelStudio lama dan catatan migrasi.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
