---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda memerlukan panduan penyiapan Baidu Qianfan
summary: Gunakan API terpadu Qianfan untuk mengakses banyak model di OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-30T10:08:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan adalah platform MaaS Baidu, yang menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan kunci API. Platform ini kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI dapat bekerja dengan mengganti URL dasar.

| Properti | Nilai                             |
| -------- | --------------------------------- |
| Penyedia | `qianfan`                         |
| Autentikasi | `QIANFAN_API_KEY`                 |
| API      | Kompatibel dengan OpenAI          |
| URL Dasar | `https://qianfan.baidubce.com/v2` |

## Memulai

<Steps>
  <Step title="Buat akun Baidu Cloud">
    Daftar atau masuk di [Konsol Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) dan pastikan Anda telah mengaktifkan akses API Qianfan.
  </Step>
  <Step title="Buat kunci API">
    Buat aplikasi baru atau pilih yang sudah ada, lalu buat kunci API. Format kuncinya adalah `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verifikasi model tersedia">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Katalog bawaan

| Ref model                            | Input       | Konteks | Output maks | Penalaran | Catatan       |
| ------------------------------------ | ----------- | ------- | ----------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | teks        | 98,304  | 32,768      | Ya        | Model default |
| `qianfan/ernie-5.0-thinking-preview` | teks, gambar | 119,000 | 64,000      | Ya        | Multimodal    |

<Tip>
Ref model bawaan default adalah `qianfan/deepseek-v3.2`. Anda hanya perlu menimpa `models.providers.qianfan` saat membutuhkan URL dasar kustom atau metadata model.
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
    Qianfan berjalan melalui jalur transport yang kompatibel dengan OpenAI, bukan pembentukan permintaan OpenAI native. Artinya fitur SDK OpenAI standar berfungsi, tetapi parameter khusus penyedia mungkin tidak diteruskan.
  </Accordion>

  <Accordion title="Katalog dan penimpaan">
    Katalog bawaan saat ini mencakup `deepseek-v3.2` dan `ernie-5.0-thinking-preview`. Tambahkan atau timpa `models.providers.qianfan` hanya saat Anda membutuhkan URL dasar kustom atau metadata model.

    <Note>
    Ref model menggunakan prefiks `qianfan/` (misalnya `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Pastikan kunci API Anda dimulai dengan `bce-v3/ALTAK-` dan akses API Qianfan telah diaktifkan di konsol Baidu Cloud.
    - Jika model tidak tercantum, pastikan akun Anda telah mengaktifkan layanan Qianfan.
    - URL dasar default adalah `https://qianfan.baidubce.com/v2`. Ubah hanya jika Anda menggunakan endpoint kustom atau proksi.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap OpenClaw.
  </Card>
  <Card title="Penyiapan agen" href="/id/concepts/agent" icon="robot">
    Mengonfigurasi default agen dan penetapan model.
  </Card>
  <Card title="Dokumentasi API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Dokumentasi API Qianfan resmi.
  </Card>
</CardGroup>
