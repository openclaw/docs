---
read_when:
    - Anda ingin menggunakan Hugging Face Inference dengan OpenClaw
    - Anda memerlukan env var token HF atau pilihan auth CLI
summary: Penyiapan Hugging Face Inference (auth + pemilihan model)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-05T14:03:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692d2caffbaf991670260da393c67ae7e6349b9e1e3ed5cb9a514f8a77192e86
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) menawarkan chat completions yang kompatibel dengan OpenAI melalui satu API router. Anda mendapatkan akses ke banyak model (DeepSeek, Llama, dan lainnya) dengan satu token. OpenClaw menggunakan **endpoint yang kompatibel dengan OpenAI** (hanya chat completions); untuk text-to-image, embeddings, atau speech gunakan [klien inference HF](https://huggingface.co/docs/api-inference/quicktour) secara langsung.

- Provider: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` atau `HF_TOKEN` (token fine-grained dengan izin **Make calls to Inference Providers**)
- API: kompatibel dengan OpenAI (`https://router.huggingface.co/v1`)
- Penagihan: Satu token HF; [harga](https://huggingface.co/docs/inference-providers/pricing) mengikuti tarif provider dengan tier gratis.

## Mulai cepat

1. Buat token fine-grained di [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) dengan izin **Make calls to Inference Providers**.
2. Jalankan onboarding dan pilih **Hugging Face** di dropdown provider, lalu masukkan kunci API Anda saat diminta:

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. Di dropdown **Default Hugging Face model**, pilih model yang Anda inginkan (daftar dimuat dari Inference API saat Anda memiliki token yang valid; jika tidak, daftar bawaan akan ditampilkan). Pilihan Anda disimpan sebagai model default.
4. Anda juga dapat menetapkan atau mengubah model default nanti di konfigurasi:

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## Contoh non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Ini akan menetapkan `huggingface/deepseek-ai/DeepSeek-R1` sebagai model default.

## Catatan lingkungan

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `HUGGINGFACE_HUB_TOKEN` atau `HF_TOKEN`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).

## Penemuan model dan dropdown onboarding

OpenClaw menemukan model dengan memanggil **endpoint Inference secara langsung**:

```bash
GET https://router.huggingface.co/v1/models
```

(Opsional: kirim `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` atau `$HF_TOKEN` untuk daftar lengkap; beberapa endpoint mengembalikan subset tanpa auth.) Responsnya bergaya OpenAI `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

Saat Anda mengonfigurasi kunci API Hugging Face (melalui onboarding, `HUGGINGFACE_HUB_TOKEN`, atau `HF_TOKEN`), OpenClaw menggunakan GET ini untuk menemukan model chat-completion yang tersedia. Selama **penyiapan interaktif**, setelah Anda memasukkan token, Anda akan melihat dropdown **Default Hugging Face model** yang diisi dari daftar tersebut (atau katalog bawaan jika permintaan gagal). Saat runtime (misalnya startup Gateway), ketika kunci tersedia, OpenClaw kembali memanggil **GET** `https://router.huggingface.co/v1/models` untuk menyegarkan katalog. Daftar ini digabungkan dengan katalog bawaan (untuk metadata seperti jendela konteks dan biaya). Jika permintaan gagal atau tidak ada kunci yang disetel, hanya katalog bawaan yang digunakan.

## Nama model dan opsi yang dapat diedit

- **Nama dari API:** Nama tampilan model **di-hydrate dari GET /v1/models** saat API mengembalikan `name`, `title`, atau `display_name`; jika tidak, nama diturunkan dari ID model (misalnya `deepseek-ai/DeepSeek-R1` → “DeepSeek R1”).
- **Override nama tampilan:** Anda dapat menetapkan label kustom per model agar tampil sesuai keinginan Anda di CLI dan UI:

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (cepat)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (murah)" },
      },
    },
  },
}
```

- **Sufiks kebijakan:** Dokumen dan helper Hugging Face bawaan OpenClaw saat ini memperlakukan dua sufiks ini sebagai varian kebijakan bawaan:
  - **`:fastest`** — throughput tertinggi.
  - **`:cheapest`** — biaya per token output terendah.

  Anda dapat menambahkan ini sebagai entri terpisah di `models.providers.huggingface.models` atau menetapkan `model.primary` dengan sufiks tersebut. Anda juga dapat menetapkan urutan provider default Anda di [pengaturan Inference Provider](https://hf.co/settings/inference-providers) (tanpa sufiks = gunakan urutan tersebut).

- **Penggabungan konfigurasi:** Entri yang sudah ada di `models.providers.huggingface.models` (misalnya di `models.json`) dipertahankan saat konfigurasi digabungkan. Jadi `name`, `alias`, atau opsi model kustom apa pun yang Anda setel di sana akan tetap dipertahankan.

## ID model dan contoh konfigurasi

Referensi model menggunakan bentuk `huggingface/<org>/<model>` (ID bergaya Hub). Daftar di bawah ini berasal dari **GET** `https://router.huggingface.co/v1/models`; katalog Anda mungkin mencakup lebih banyak.

**Contoh ID (dari endpoint inference):**

| Model                  | Ref (awali dengan `huggingface/`)   |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

Anda dapat menambahkan `:fastest` atau `:cheapest` ke ID model. Tetapkan urutan default Anda di [pengaturan Inference Provider](https://hf.co/settings/inference-providers); lihat [Inference Providers](https://huggingface.co/docs/inference-providers) dan **GET** `https://router.huggingface.co/v1/models` untuk daftar lengkap.

### Contoh konfigurasi lengkap

**DeepSeek R1 utama dengan fallback Qwen:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-R1",
        fallbacks: ["huggingface/Qwen/Qwen3-8B"],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
      },
    },
  },
}
```

**Qwen sebagai default, dengan varian :cheapest dan :fastest:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen3-8B" },
      models: {
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (termurah)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (tercepat)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS dengan alias:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
        fallbacks: [
          "huggingface/meta-llama/Llama-3.3-70B-Instruct",
          "huggingface/openai/gpt-oss-120b",
        ],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
        "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
        "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
      },
    },
  },
}
```

**Beberapa model Qwen dan DeepSeek dengan sufiks kebijakan:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (murah)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (cepat)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```
