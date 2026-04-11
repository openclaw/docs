---
read_when:
    - Você quer usar a geração de imagens do fal no OpenClaw
    - Você precisa do fluxo de auth com `FAL_KEY`
    - Você quer padrões do fal para `image_generate` ou `video_generate`
summary: Configuração do fal para geração de imagem e vídeo no OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-11T02:47:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9bfe4f69124e922a79a516a1bd78f0c00f7a45f3c6f68b6d39e0d196fa01beb3
    source_path: providers/fal.md
    workflow: 15
---

# fal

O OpenClaw inclui um provedor `fal` para geração hospedada de imagens e vídeos.

- Provedor: `fal`
- Auth: `FAL_KEY` (canônico; `FAL_API_KEY` também funciona como fallback)
- API: endpoints de modelo do fal

## Início rápido

1. Defina a chave de API:

```bash
openclaw onboard --auth-choice fal-api-key
```

2. Defina um modelo de imagem padrão:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Geração de imagens

O provedor de geração de imagens `fal` incluído usa por padrão
`fal/fal-ai/flux/dev`.

- Geração: até 4 imagens por requisição
- Modo de edição: ativado, 1 imagem de referência
- Compatível com `size`, `aspectRatio` e `resolution`
- Limitação atual de edição: o endpoint de edição de imagem do fal **não** oferece suporte a substituições de `aspectRatio`

Para usar o fal como provedor padrão de imagem:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Geração de vídeo

O provedor de geração de vídeo `fal` incluído usa por padrão
`fal/fal-ai/minimax/video-01-live`.

- Modos: fluxos de texto para vídeo e de imagem única de referência
- Runtime: fluxo de submit/status/result com fila para jobs de longa duração
- Ref de modelo do agente de vídeo HeyGen:
  - `fal/fal-ai/heygen/v2/video-agent`
- Refs de modelo do Seedance 2.0:
  - `fal/bytedance/seedance-2.0/fast/text-to-video`
  - `fal/bytedance/seedance-2.0/fast/image-to-video`
  - `fal/bytedance/seedance-2.0/text-to-video`
  - `fal/bytedance/seedance-2.0/image-to-video`

Para usar o Seedance 2.0 como modelo de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
      },
    },
  },
}
```

Para usar o agente de vídeo HeyGen como modelo de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/heygen/v2/video-agent",
      },
    },
  },
}
```

## Relacionado

- [Geração de imagens](/pt-BR/tools/image-generation)
- [Geração de vídeo](/pt-BR/tools/video-generation)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults)
