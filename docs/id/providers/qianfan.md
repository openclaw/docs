---
read_when:
    - Anda menginginkan satu API key untuk banyak LLM
    - Anda memerlukan panduan penyiapan Baidu Qianfan
summary: Gunakan API terpadu Qianfan untuk mengakses banyak model di OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-24T09:24:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan adalah platform MaaS Baidu, yang menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan API key. Ini kompatibel dengan OpenAI, jadi sebagian besar SDK OpenAI berfungsi cukup dengan mengganti base URL.

| Properti | Nilai                            |
| -------- | -------------------------------- |
| Provider | `qianfan`                        |
| Auth     | `QIANFAN_API_KEY`                |
| API      | Kompatibel dengan OpenAI         |
| Base URL | `https://qianfan.baidubce.com/v2` |

## Memulai

<Steps>
  <Step title="Buat akun Baidu Cloud">
    Daftar atau masuk di [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) dan pastikan Anda telah mengaktifkan akses API Qianfan.
  </Step>
  <Step title="Buat API key">
    Buat aplikasi baru atau pilih yang sudah ada, lalu buat API key. Format key adalah `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Katalog bawaan

| Referensi model                     | Input       | Konteks | Output maks | Reasoning | Catatan       |
| ----------------------------------- | ----------- | ------- | ----------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`             | teks        | 98,304  | 32,768      | Ya        | Model default |
| `qianfan/ernie-5.0-thinking-preview` | teks, gambar | 119,000 | 64,000     | Ya        | Multimodal    |

<Tip>
Referensi model bawaan default adalah `qianfan/deepseek-v3.2`. Anda hanya perlu mengganti `models.providers.qianfan` jika memerlukan base URL kustom atau metadata model.
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

<AccordionGroup>
  <Accordion title="Transport dan kompatibilitas">
    Qianfan berjalan melalui jalur transport yang kompatibel dengan OpenAI, bukan pembentukan permintaan OpenAI native. Ini berarti fitur standar SDK OpenAI berfungsi, tetapi parameter khusus provider mungkin tidak diteruskan.
  </Accordion>

  <Accordion title="Katalog dan penggantian">
    Katalog bawaan saat ini mencakup `deepseek-v3.2` dan `ernie-5.0-thinking-preview`. Tambahkan atau ganti `models.providers.qianfan` hanya jika Anda memerlukan base URL kustom atau metadata model.

    <Note>
    Referensi model menggunakan prefiks `qianfan/` (misalnya `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Pastikan API key Anda dimulai dengan `bce-v3/ALTAK-` dan akses API Qianfan telah diaktifkan di konsol Baidu Cloud.
    - Jika model tidak terdaftar, pastikan akun Anda telah mengaktifkan layanan Qianfan.
    - Base URL default adalah `https://qianfan.baidubce.com/v2`. Ubah hanya jika Anda menggunakan endpoint atau proxy kustom.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi OpenClaw lengkap.
  </Card>
  <Card title="Penyiapan agen" href="/id/concepts/agent" icon="robot">
    Mengonfigurasi default agen dan penetapan model.
  </Card>
  <Card title="Dokumentasi API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Dokumentasi resmi API Qianfan.
  </Card>
</CardGroup>
