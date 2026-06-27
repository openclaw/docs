---
read_when:
    - Anda menginginkan satu kunci API untuk banyak LLM
    - Anda memerlukan panduan penyiapan Baidu Qianfan
summary: Gunakan API terpadu Qianfan untuk mengakses banyak model di OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T18:06:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan adalah platform MaaS Baidu, yang menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan kunci API. Platform ini kompatibel dengan OpenAI, sehingga sebagian besar SDK OpenAI berfungsi dengan mengganti URL dasar.

| Properti | Nilai                             |
| -------- | --------------------------------- |
| Penyedia | `qianfan`                         |
| Auth     | `QIANFAN_API_KEY`                 |
| API      | Kompatibel dengan OpenAI          |
| URL dasar | `https://qianfan.baidubce.com/v2` |

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

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
    Buat aplikasi baru atau pilih aplikasi yang sudah ada, lalu buat kunci API. Format kuncinya adalah `bce-v3/ALTAK-...`.
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

| Ref model                            | Masukan     | Konteks | Output maksimum | Penalaran | Catatan       |
| ------------------------------------ | ----------- | ------- | --------------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | teks        | 98,304  | 32,768          | Ya        | Model default |
| `qianfan/ernie-5.0-thinking-preview` | teks, gambar | 119,000 | 64,000          | Ya        | Multimodal    |

<Tip>
Ref model default adalah `qianfan/deepseek-v3.2`. Anda hanya perlu mengganti `models.providers.qianfan` saat memerlukan URL dasar khusus atau metadata model.
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
    Qianfan berjalan melalui jalur transport yang kompatibel dengan OpenAI, bukan pembentukan permintaan OpenAI native. Ini berarti fitur SDK OpenAI standar berfungsi, tetapi parameter khusus penyedia mungkin tidak diteruskan.
  </Accordion>

  <Accordion title="Katalog dan penggantian">
    Katalog statis saat ini mencakup `deepseek-v3.2` dan `ernie-5.0-thinking-preview`. Tambahkan atau ganti `models.providers.qianfan` hanya saat Anda memerlukan URL dasar khusus atau metadata model.

    <Note>
    Ref model menggunakan prefiks `qianfan/` (misalnya `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Pastikan kunci API Anda dimulai dengan `bce-v3/ALTAK-` dan akses API Qianfan telah diaktifkan di konsol Baidu Cloud.
    - Jika model tidak tercantum, konfirmasikan bahwa layanan Qianfan telah diaktifkan untuk akun Anda.
    - URL dasar default adalah `https://qianfan.baidubce.com/v2`. Ubah hanya jika Anda menggunakan endpoint atau proxy khusus.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi OpenClaw lengkap.
  </Card>
  <Card title="Penyiapan agent" href="/id/concepts/agent" icon="robot">
    Mengonfigurasi default agent dan penetapan model.
  </Card>
  <Card title="Dokumentasi API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Dokumentasi API Qianfan resmi.
  </Card>
</CardGroup>
