---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda memerlukan panduan penyiapan Baidu Qianfan
summary: Gunakan API terpadu Qianfan untuk mengakses berbagai model di OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-12T14:34:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan adalah platform MaaS Baidu: API terpadu yang kompatibel dengan OpenAI, yang merutekan permintaan ke banyak model melalui satu titik akhir dan kunci API. OpenClaw menyediakannya sebagai plugin eksternal resmi `@openclaw/qianfan-provider`.

| Properti      | Nilai                                    |
| ------------- | ---------------------------------------- |
| Penyedia      | `qianfan`                                |
| Autentikasi   | `QIANFAN_API_KEY`                        |
| API           | Kompatibel dengan OpenAI (`openai-completions`) |
| URL dasar     | `https://qianfan.baidubce.com/v2`        |
| Model bawaan  | `qianfan/deepseek-v3.2`                  |

## Instal plugin

Instal plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Buat akun Baidu Cloud">
    Daftar atau masuk di [Konsol Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) dan pastikan akses API Qianfan telah diaktifkan.
  </Step>
  <Step title="Buat kunci API">
    Buat aplikasi baru atau pilih aplikasi yang sudah ada, lalu buat kunci API. Kunci Baidu Cloud menggunakan format `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Jalankan orientasi awal">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    Proses noninteraktif membaca kunci dari `--qianfan-api-key <key>` atau
    `QIANFAN_API_KEY`. Orientasi awal menulis konfigurasi penyedia, menambahkan
    alias `QIANFAN` untuk model bawaan, dan menetapkan `qianfan/deepseek-v3.2`
    sebagai model bawaan jika belum ada model yang dikonfigurasi.

  </Step>
  <Step title="Pastikan model tersedia">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Katalog bawaan

| Referensi model                      | Masukan     | Konteks | Keluaran maks. | Penalaran | Catatan        |
| ------------------------------------ | ----------- | ------- | -------------- | --------- | -------------- |
| `qianfan/deepseek-v3.2`              | teks        | 98,304  | 32,768         | Ya        | Model bawaan   |
| `qianfan/ernie-5.0-thinking-preview` | teks, gambar | 119,000 | 64,000        | Ya        | Multimodal     |

Katalog ini bersifat statis; tidak ada penemuan model secara langsung.

<Tip>
Anda hanya perlu mengganti `models.providers.qianfan` jika memerlukan URL dasar khusus atau metadata model khusus.
</Tip>

## Contoh konfigurasi

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<Note>
Referensi model menggunakan prefiks `qianfan/` (misalnya `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Transpor dan kompatibilitas">
    Qianfan berjalan melalui jalur transpor yang kompatibel dengan OpenAI, bukan pembentukan permintaan OpenAI native. Fitur standar SDK OpenAI berfungsi, tetapi parameter khusus penyedia mungkin tidak diteruskan.
  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Pastikan kunci API Anda diawali dengan `bce-v3/ALTAK-` dan akses API Qianfan telah diaktifkan di konsol Baidu Cloud.
    - Jika model tidak tercantum, pastikan layanan Qianfan telah diaktifkan untuk akun Anda.
    - Ubah URL dasar hanya jika Anda menggunakan titik akhir atau proksi khusus.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku pengalihan otomatis.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi OpenClaw lengkap.
  </Card>
  <Card title="Penyiapan agen" href="/id/concepts/agent" icon="robot">
    Mengonfigurasi nilai bawaan agen dan penetapan model.
  </Card>
  <Card title="Dokumentasi API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Dokumentasi resmi API Qianfan.
  </Card>
</CardGroup>
