---
read_when:
    - Chcesz używać modeli NVIDIA w OpenClaw
    - Potrzebujesz konfiguracji NVIDIA_API_KEY
summary: Używaj zgodnego z OpenAI API NVIDIA w OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-05T14:03:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a24c5e46c0cf0fbc63bf09c772b486dd7f8f4b52e687d3b835bb54a1176b28da
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA udostępnia zgodne z OpenAI API pod adresem `https://integrate.api.nvidia.com/v1` dla modeli Nemotron i NeMo. Uwierzytelnianie odbywa się przez klucz API z [NVIDIA NGC](https://catalog.ngc.nvidia.com/).

## Konfiguracja CLI

Wyeksportuj klucz raz, a następnie uruchom onboarding i ustaw model NVIDIA:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

Jeśli nadal przekazujesz `--token`, pamiętaj, że trafia on do historii powłoki i wyjścia `ps`; jeśli to możliwe, preferuj zmienną env.

## Fragment config

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

## Identyfikatory modeli

| Model ref                                            | Name                                     | Context | Max output |
| ---------------------------------------------------- | ---------------------------------------- | ------- | ---------- |
| `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`      | NVIDIA Llama 3.1 Nemotron 70B Instruct   | 131,072 | 4,096      |
| `nvidia/meta/llama-3.3-70b-instruct`                 | Meta Llama 3.3 70B Instruct              | 131,072 | 4,096      |
| `nvidia/nvidia/mistral-nemo-minitron-8b-8k-instruct` | NVIDIA Mistral NeMo Minitron 8B Instruct | 8,192   | 2,048      |

## Uwagi

- Endpoint `/v1` zgodny z OpenAI; użyj klucza API z NVIDIA NGC.
- Provider włącza się automatycznie, gdy ustawiono `NVIDIA_API_KEY`.
- Dołączony katalog jest statyczny; koszty domyślnie mają wartość `0` w źródłach.
