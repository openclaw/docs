---
read_when:
    - NVIDIA modellerini OpenClaw'da kullanmak istiyorsunuz
    - NVIDIA_API_KEY kurulumuna ihtiyacınız var
summary: NVIDIA'nın OpenAI uyumlu API'sini OpenClaw'da kullanın
title: NVIDIA
x-i18n:
    generated_at: "2026-04-05T14:04:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: a24c5e46c0cf0fbc63bf09c772b486dd7f8f4b52e687d3b835bb54a1176b28da
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA, Nemotron ve NeMo modelleri için `https://integrate.api.nvidia.com/v1`
adresinde OpenAI uyumlu bir API sunar. [NVIDIA NGC](https://catalog.ngc.nvidia.com/) üzerinden alınan bir API anahtarıyla kimlik doğrulaması yapın.

## CLI kurulumu

Anahtarı bir kez dışa aktarın, ardından onboarding'i çalıştırın ve bir NVIDIA modeli ayarlayın:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

Hâlâ `--token` geçiriyorsanız, bunun kabuk geçmişine ve `ps` çıktısına yazılacağını unutmayın; mümkün olduğunda env var'ı tercih edin.

## Yapılandırma parçası

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

## Model kimlikleri

| Model ref                                            | Ad                                      | Bağlam  | Maksimum çıktı |
| ---------------------------------------------------- | --------------------------------------- | ------- | -------------- |
| `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`      | NVIDIA Llama 3.1 Nemotron 70B Instruct  | 131,072 | 4,096          |
| `nvidia/meta/llama-3.3-70b-instruct`                 | Meta Llama 3.3 70B Instruct             | 131,072 | 4,096          |
| `nvidia/nvidia/mistral-nemo-minitron-8b-8k-instruct` | NVIDIA Mistral NeMo Minitron 8B Instruct | 8,192   | 2,048          |

## Notlar

- OpenAI uyumlu `/v1` uç noktası; NVIDIA NGC'den bir API anahtarı kullanın.
- `NVIDIA_API_KEY` ayarlandığında sağlayıcı otomatik olarak etkinleşir.
- Paketlenmiş katalog statiktir; maliyetler kaynakta varsayılan olarak `0` olur.
