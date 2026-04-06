---
read_when:
    - Você quer usar a geração de imagens do fal no OpenClaw
    - Você precisa do fluxo de auth `FAL_KEY`
    - Você quer padrões do fal para `image_generate` ou `video_generate`
summary: Configuração de geração de imagem e vídeo com fal no OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-06T03:10:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1922907d2c8360c5877a56495323d54bd846d47c27a801155e3d11e3f5706fbd
    source_path: providers/fal.md
    workflow: 15
---

# fal

O OpenClaw inclui um provedor `fal` integrado para geração hospedada de imagens e vídeos.

- Provedor: `fal`
- Auth: `FAL_KEY` (canônico; `FAL_API_KEY` também funciona como fallback)
- API: endpoints de model da fal

## Início rápido

1. Defina a chave de API:

```bash
openclaw onboard --auth-choice fal-api-key
```

2. Defina um model de imagem padrão:

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

O provedor integrado de geração de imagens `fal` usa por padrão
`fal/fal-ai/flux/dev`.

- Geração: até 4 imagens por solicitação
- Modo de edição: ativado, 1 imagem de referência
- Suporta `size`, `aspectRatio` e `resolution`
- Limitação atual de edição: o endpoint de edição de imagem da fal **não** oferece suporte a
  sobrescritas de `aspectRatio`

Para usar o fal como provedor de imagem padrão:

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

O provedor integrado de geração de vídeo `fal` usa por padrão
`fal/fal-ai/minimax/video-01-live`.

- Modos: fluxos de texto para vídeo e de imagem única de referência
- Runtime: fluxo de envio/status/resultado com suporte de fila para jobs de longa duração

Para usar o fal como provedor de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/minimax/video-01-live",
      },
    },
  },
}
```

## Relacionados

- [Image Generation](/pt-BR/tools/image-generation)
- [Video Generation](/tools/video-generation)
- [Configuration Reference](/pt-BR/gateway/configuration-reference#agent-defaults)
