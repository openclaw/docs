---
x-i18n:
    generated_at: "2026-04-05T14:04:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1066a1d0acebe4ae3500d18c21f7de07f43b9766daf3d13b098936734e9e7a2b
    source_path: providers/qwen_modelstudio.md
    workflow: 15
---

title: "Qwen / Model Studio"
summary: "Detail endpoint untuk provider `qwen` bawaan dan surface kompatibilitas `modelstudio` lama"
read_when:

- Anda menginginkan detail tingkat endpoint untuk Qwen Cloud / Alibaba DashScope
- Anda memerlukan penjelasan kompatibilitas env var untuk provider qwen
- Anda ingin menggunakan endpoint Standard (bayar sesuai pemakaian) atau Coding Plan

---

# Qwen / Model Studio (Alibaba Cloud)

Halaman ini mendokumentasikan pemetaan endpoint di balik provider `qwen`
bawaan OpenClaw. Provider ini menjaga agar id provider, id auth-choice, dan
ref model `modelstudio` tetap berfungsi sebagai alias kompatibilitas sementara `qwen` menjadi surface kanonis.

<Info>

Jika Anda memerlukan **`qwen3.6-plus`**, pilih **Standard (bayar sesuai pemakaian)**. Ketersediaan
Coding Plan dapat tertinggal dari katalog publik Model Studio, dan API
Coding Plan dapat menolak model sampai model tersebut muncul di daftar model
yang didukung paket Anda.

</Info>

- Provider: `qwen` (alias lama: `modelstudio`)
- Auth: `QWEN_API_KEY`
- Juga diterima: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API: kompatibel dengan OpenAI

## Mulai cepat

### Standard (bayar sesuai pemakaian)

```bash
# Endpoint China
openclaw onboard --auth-choice qwen-standard-api-key-cn

# Endpoint Global/Internasional
openclaw onboard --auth-choice qwen-standard-api-key
```

### Coding Plan (langganan)

```bash
# Endpoint China
openclaw onboard --auth-choice qwen-api-key-cn

# Endpoint Global/Internasional
openclaw onboard --auth-choice qwen-api-key
```

Id auth-choice `modelstudio-*` lama tetap berfungsi sebagai alias kompatibilitas, tetapi
id onboarding kanonis adalah pilihan `qwen-*` yang ditampilkan di atas.

Setelah onboarding, setel model default:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Jenis paket dan endpoint

| Plan                       | Region | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (bayar sesuai pemakaian)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (bayar sesuai pemakaian)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (langganan) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (langganan) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Provider secara otomatis memilih endpoint berdasarkan auth choice Anda. Pilihan
kanonis menggunakan keluarga `qwen-*`; `modelstudio-*` tetap hanya untuk kompatibilitas.
Anda dapat
mengganti ini dengan `baseUrl` kustom di config.

Endpoint native Model Studio mengiklankan kompatibilitas penggunaan streaming pada
transport bersama `openai-completions`. OpenClaw sekarang mengaitkannya dengan capability
endpoint, sehingga id provider kustom yang kompatibel dengan DashScope dan menargetkan
host native yang sama mewarisi perilaku penggunaan streaming yang sama alih-alih
mengharuskan id provider bawaan `qwen` secara khusus.

## Dapatkan API key Anda

- **Kelola key**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Dokumentasi**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Katalog bawaan

OpenClaw saat ini menyertakan katalog Qwen bawaan berikut:

| Model ref                   | Input       | Context   | Catatan                                           |
| --------------------------- | ----------- | --------- | ------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Model default                                     |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Pilih endpoint Standard saat Anda memerlukan model ini |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Lini Qwen Max                                     |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                            |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                            |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Reasoning diaktifkan                              |
| `qwen/glm-5`                | text        | 202,752   | GLM                                               |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                               |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI melalui Alibaba                       |

Ketersediaan tetap dapat bervariasi menurut endpoint dan paket penagihan meskipun model
ada dalam katalog bawaan.

Kompatibilitas penggunaan native-streaming berlaku untuk host Coding Plan maupun
host Standard yang kompatibel dengan DashScope:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Ketersediaan Qwen 3.6 Plus

`qwen3.6-plus` tersedia pada endpoint Model Studio
Standard (bayar sesuai pemakaian):

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Jika endpoint Coding Plan mengembalikan error "unsupported model" untuk
`qwen3.6-plus`, beralihlah ke Standard (bayar sesuai pemakaian), bukan pasangan
endpoint/key Coding Plan.

## Catatan environment

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan
`QWEN_API_KEY` tersedia untuk proses tersebut (misalnya, di
`~/.openclaw/.env` atau melalui `env.shellEnv`).
