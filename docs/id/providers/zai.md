---
read_when:
    - Anda ingin menggunakan model Z.AI / GLM di OpenClaw
    - Anda memerlukan penyiapan ZAI_API_KEY yang sederhana
summary: Gunakan Z.AI (model GLM) dengan OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-19T05:18:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0ca3e7ef743e908550f4d96ba6f78167e38cabd15b14044683b02493ebbf3025
    source_path: providers/zai.md
    workflow: 16
---

Z.AI adalah platform API untuk model **GLM**. Platform ini menyediakan REST API untuk GLM dan
menggunakan kunci API untuk autentikasi. Buat kunci API Anda di konsol Z.AI.
OpenClaw menggunakan penyedia `zai` dengan kunci API Z.AI.

| Properti | Nilai                                        |
| -------- | -------------------------------------------- |
| Penyedia | `zai`                                        |
| Paket  | `@openclaw/zai-provider`                     |
| Autentikasi     | `ZAI_API_KEY` (alias lama: `Z_AI_API_KEY`) |
| API      | Penyelesaian Percakapan Z.AI (autentikasi Bearer)          |

## Model GLM

GLM adalah keluarga model, bukan penyedia terpisah. Di OpenClaw, model GLM menggunakan
referensi seperti `zai/glm-5.2`: penyedia `zai`, id model `glm-5.2`.

## Memulai

Instal Plugin penyedia terlebih dahulu:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Deteksi endpoint otomatis">
    **Paling cocok untuk:** sebagian besar pengguna. OpenClaw memeriksa endpoint Z.AI yang didukung dengan kunci API Anda dan menerapkan URL dasar yang benar secara otomatis.

    <Steps>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verifikasi bahwa model tercantum">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional eksplisit">
    **Paling cocok untuk:** pengguna yang ingin memaksakan Coding Plan tertentu atau permukaan API umum.

    <Steps>
      <Step title="Pilih opsi orientasi awal yang tepat">
        ```bash
        # Coding Plan Global (direkomendasikan untuk pengguna Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (wilayah Tiongkok)
        openclaw onboard --auth-choice zai-coding-cn

        # API umum
        openclaw onboard --auth-choice zai-global

        # API umum CN (wilayah Tiongkok)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Verifikasi bahwa model tercantum">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### Endpoint

| Opsi orientasi awal   | URL dasar                                      | Model default |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

Z.AI juga memublikasikan URL dasar Coding Plan yang kompatibel dengan Anthropic
`https://api.z.ai/api/anthropic`. Opsi Z.AI OpenClaw menggunakan endpoint
Penyelesaian Percakapan OpenAI yang didokumentasikan di atas; URL Anthropic ditujukan bagi klien yang
berkomunikasi langsung menggunakan Pesan Anthropic.

`zai-api-key` mendeteksi secara otomatis salah satu dari empat endpoint ini dengan menguji kunci Anda terhadap
API penyelesaian percakapan setiap endpoint, memeriksa endpoint umum (`zai-global`,
lalu `zai-cn`) sebelum endpoint Coding Plan (`zai-coding-global`, lalu
`zai-coding-cn`), dan berhenti pada endpoint pertama yang menerima permintaan.
Gunakan `--auth-choice` eksplisit untuk memaksakan endpoint Coding Plan jika kunci Anda
berfungsi pada keduanya.

## Batas laju dan kelebihan beban

Z.AI mendokumentasikan Coding Plan dan alat agen serbaguna sebagai layanan dengan
kapasitas terkelola. Dalam dokumentasi Z.AI sendiri:

- [Alat agen serbaguna](https://docs.z.ai/devpack/tool/others),
  termasuk OpenClaw, dilayani atas dasar upaya terbaik. Selama beban inferensi
  tinggi, biasanya sekitar pukul 14.00–18.00 waktu Singapura, beberapa permintaan mungkin mengalami
  batas laju sementara.
- [Batas laju dan konkurensi Coding Plan](https://docs.z.ai/devpack/usage-policy)
  terkait dengan tingkatan paket dan dapat disesuaikan secara dinamis berdasarkan ketersediaan
  sumber daya. Jam sepi mungkin memiliki konkurensi yang lebih tinggi.
- [Kode kesalahan API `1302`](https://docs.z.ai/api-reference/api-code) berarti "Batas
  laju untuk permintaan telah tercapai". Kode kesalahan API `1305` berarti "Layanan mungkin
  mengalami kelebihan beban sementara, silakan coba lagi nanti".

Jika Anda melihat respons sementara `429` atau `1305` selama periode sibuk, tunggu dan
coba ulang permintaan. Jika kegagalan terus berulang di luar periode puncak, atau hanya
terjadi pada satu endpoint, model, atau bentuk permintaan, periksa terlebih dahulu endpoint
dan model yang dikonfigurasi:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

Kunci Coding Plan harus menggunakan endpoint Coding Plan seperti
`https://api.z.ai/api/coding/paas/v4`; kunci API umum harus menggunakan endpoint API
umum seperti `https://api.z.ai/api/paas/v4`. Kegagalan terus-menerus dengan
kunci dan endpoint yang sama dapat menunjukkan penolakan dari sisi penyedia atau pembatasan paket,
bukan pembatasan laju biasa akibat beban puncak.

## Contoh konfigurasi

<Tip>
`zai-api-key` memungkinkan OpenClaw mendeteksi endpoint Z.AI yang cocok dari kunci dan
menerapkan URL dasar yang benar secara otomatis. Gunakan opsi regional eksplisit ketika
Anda ingin memaksakan Coding Plan tertentu atau permukaan API umum.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 menggunakan endpoint Coding Plan.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Katalog bawaan

Plugin penyedia `zai` menyertakan katalognya dalam manifes Plugin, sehingga daftar hanya-baca
dapat menampilkan baris GLM yang diketahui tanpa memuat runtime penyedia:

```bash
openclaw models list --all --provider zai
```

Katalog berbasis manifes saat ini mencakup:

| Referensi model            | Catatan                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Default Coding Plan; konteks 1M |
| `zai/glm-5.1`        | Default API umum             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

Metadata biaya token katalog mengikuti
[harga bayar sesuai pemakaian](https://docs.z.ai/guides/overview/pricing) Z.AI saat ini. Langganan Coding Plan
menggunakan kuota paket alih-alih penagihan per token; lihat
[halaman langganan](https://z.ai/subscribe) langsung untuk harga dan ketersediaan paket.

<Tip>
Model GLM tersedia sebagai `zai/<model>` (contoh: `zai/glm-5`).
</Tip>

<Note>
Penyiapan Coding Plan menggunakan `zai/glm-5.2` sebagai default; penyiapan API umum mempertahankan
`zai/glm-5.1`. Pada endpoint Coding Plan, deteksi otomatis beralih ke
`glm-5.1` lalu `glm-4.7` ketika kunci/paket tidak menyediakan GLM-5.2. Versi dan
ketersediaan GLM dapat berubah; jalankan `openclaw models list --all --provider zai`
untuk melihat katalog yang diketahui oleh versi terinstal Anda.
</Note>

## Tingkat pemikiran

<Tabs>
  <Tab title="GLM-5.2">
    Rentang lengkap: `off`, `low`, `high`, `max` (default `off`). OpenClaw memetakan
    `low` dan `high` ke upaya penalaran `high` Z.AI, serta `max` ke
    upaya `max` Z.AI, melalui `reasoning_effort` pada muatan permintaan.
  </Tab>
  <Tab title="Model GLM lainnya">
    Hanya pengalih biner: `off` dan `low` (ditampilkan sebagai `on` dalam pemilih), default
    `off`. Mengatur pemikiran ke `off` akan mengirim `thinking: { type: "disabled" }`;
    tingkat lainnya membiarkan muatan permintaan tidak berubah (perilaku
    penalaran default Z.AI sendiri berlaku).
  </Tab>
</Tabs>

Mengatur pemikiran ke `off` menghindari respons yang menghabiskan anggaran keluaran untuk
`reasoning_content` sebelum teks yang terlihat.

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Resolusi maju model GLM-5 yang tidak dikenal">
    Id `glm-5*` yang tidak dikenal tetap diresolusikan secara maju pada jalur penyedia dengan
    menyintesis metadata milik penyedia dari templat `glm-4.7` ketika id
    cocok dengan bentuk keluarga GLM-5 saat ini.
  </Accordion>

  <Accordion title="Streaming pemanggilan alat">
    `tool_stream` diaktifkan secara default untuk streaming pemanggilan alat Z.AI. Untuk menonaktifkannya:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Pemikiran yang dipertahankan">
    Pemikiran yang dipertahankan bersifat pilihan karena Z.AI mengharuskan seluruh
    `reasoning_content` historis diputar ulang, yang meningkatkan token prompt. Aktifkan
    per model:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Saat diaktifkan dan pemikiran menyala, OpenClaw mengirim
    `thinking: { type: "enabled", clear_thinking: false }` dan memutar ulang
    `reasoning_content` sebelumnya untuk transkrip kompatibel OpenAI yang sama. Kunci parameter snake_case
    `preserve_thinking` berfungsi sebagai alias.

    Pengguna tingkat lanjut tetap dapat mengganti muatan penyedia secara persis dengan
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Pemahaman gambar">
    Plugin Z.AI mendaftarkan pemahaman gambar.

    | Properti      | Nilai       |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Pemahaman gambar diresolusikan secara otomatis dari autentikasi Z.AI yang dikonfigurasi — tidak
    diperlukan konfigurasi tambahan.

  </Accordion>

  <Accordion title="Detail autentikasi">
    - Z.AI menggunakan autentikasi Bearer dengan kunci API Anda.
    - Opsi orientasi awal `zai-api-key` mendeteksi secara otomatis endpoint Z.AI yang cocok dengan menguji endpoint yang didukung menggunakan kunci Anda.
    - Gunakan opsi regional eksplisit (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) ketika Anda ingin memaksakan permukaan API tertentu.
    - Variabel lingkungan lama `Z_AI_API_KEY` masih diterima; OpenClaw menyalinnya ke `ZAI_API_KEY` saat mulai berjalan jika `ZAI_API_KEY` belum ditetapkan.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap OpenClaw, termasuk pengaturan penyedia dan model.
  </Card>
</CardGroup>
