---
x-i18n:
    generated_at: "2026-04-05T14:04:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 895b701d3a3950ea7482e5e870663ed93e0355e679199ed4622718d588ef18fa
    source_path: providers/qwen.md
    workflow: 15
---

summary: "Gunakan Qwen Cloud melalui provider qwen bawaan OpenClaw"
read_when:

- Anda ingin menggunakan Qwen dengan OpenClaw
- Anda sebelumnya menggunakan Qwen OAuth
  title: "Qwen"

---

# Qwen

<Warning>

**Qwen OAuth telah dihapus.** Integrasi OAuth tier gratis
(`qwen-portal`) yang menggunakan endpoint `portal.qwen.ai` sudah tidak tersedia lagi.
Lihat [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) untuk
latar belakang.

</Warning>

## Direkomendasikan: Qwen Cloud

OpenClaw sekarang memperlakukan Qwen sebagai provider bawaan kelas satu dengan id kanonis
`qwen`. Provider bawaan ini menargetkan endpoint Qwen Cloud / Alibaba DashScope dan
Coding Plan serta menjaga agar id `modelstudio` lama tetap berfungsi sebagai
alias kompatibilitas.

- Provider: `qwen`
- Env var yang diutamakan: `QWEN_API_KEY`
- Juga diterima untuk kompatibilitas: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Gaya API: kompatibel dengan OpenAI

Jika Anda menginginkan `qwen3.6-plus`, utamakan endpoint **Standard (pay-as-you-go)**.
Dukungan Coding Plan dapat tertinggal dari katalog publik.

```bash
# Endpoint Global Coding Plan
openclaw onboard --auth-choice qwen-api-key

# Endpoint China Coding Plan
openclaw onboard --auth-choice qwen-api-key-cn

# Endpoint Global Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key

# Endpoint China Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Id `auth-choice` `modelstudio-*` lama dan ref model `modelstudio/...` masih
berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru sebaiknya mengutamakan
id `auth-choice` `qwen-*` kanonis dan ref model `qwen/...`.

Setelah onboarding, tetapkan model default:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Rencana kapabilitas

Ekstensi `qwen` sedang diposisikan sebagai rumah vendor untuk seluruh permukaan Qwen
Cloud, bukan hanya model coding/teks.

- Model teks/chat: sudah dibundel sekarang
- Tool calling, structured output, thinking: diwarisi dari transport yang kompatibel dengan OpenAI
- Pembuatan gambar: direncanakan di lapisan provider-plugin
- Pemahaman gambar/video: sudah dibundel sekarang pada endpoint Standard
- Speech/audio: direncanakan di lapisan provider-plugin
- Embeddings/reranking memori: direncanakan melalui permukaan adapter embedding
- Pembuatan video: sudah dibundel sekarang melalui kapabilitas pembuatan video bersama

## Add-on multimodal

Ekstensi `qwen` kini juga mengekspos:

- Pemahaman video melalui `qwen-vl-max-latest`
- Pembuatan video Wan melalui:
  - `wan2.6-t2v` (default)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Permukaan multimodal ini menggunakan endpoint DashScope **Standard**, bukan
endpoint Coding Plan.

- Base URL Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Base URL Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Untuk pembuatan video, OpenClaw memetakan region Qwen yang dikonfigurasi ke host
DashScope AIGC yang sesuai sebelum mengirimkan job:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Artinya, `models.providers.qwen.baseUrl` Qwen normal yang menunjuk ke salah satu host
Coding Plan atau Standard tetap menjaga pembuatan video pada endpoint video DashScope regional yang benar.

Untuk pembuatan video, setel model default secara eksplisit:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Batas pembuatan video Qwen bawaan saat ini:

- Hingga **1** video output per permintaan
- Hingga **1** gambar input
- Hingga **4** video input
- Durasi hingga **10 detik**
- Mendukung `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`

Lihat [Qwen / Model Studio](/providers/qwen_modelstudio) untuk detail tingkat endpoint
dan catatan kompatibilitas.
