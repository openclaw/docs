---
read_when:
    - Você quer usar geração de imagem da fal no OpenClaw
    - Você precisa do fluxo de auth `FAL_KEY`
    - Você quer padrões da fal para `image_generate` ou `video_generate`
summary: configuração de geração de imagem e vídeo da fal no OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-12T23:30:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff275233179b4808d625383efe04189ad9e92af09944ba39f1e953e77378e347
    source_path: providers/fal.md
    workflow: 15
---

# fal

O OpenClaw inclui um provedor `fal` empacotado para geração hospedada de imagem e vídeo.

| Property | Value                                                         |
| -------- | ------------------------------------------------------------- |
| Provedor | `fal`                                                         |
| Auth     | `FAL_KEY` (canônico; `FAL_API_KEY` também funciona como fallback) |
| API      | endpoints de modelo da fal                                    |

## Introdução

<Steps>
  <Step title="Defina a chave de API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Defina um modelo de imagem padrão">
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
  </Step>
</Steps>

## Geração de imagem

O provedor empacotado de geração de imagem da `fal` usa por padrão
`fal/fal-ai/flux/dev`.

| Capability     | Value                      |
| -------------- | -------------------------- |
| Máx. de imagens | 4 por requisição           |
| Modo de edição | Habilitado, 1 imagem de referência |
| Substituições de tamanho | Compatível        |
| Proporção da imagem | Compatível             |
| Resolução     | Compatível                  |

<Warning>
O endpoint de edição de imagem da fal **não** oferece suporte a substituições de `aspectRatio`.
</Warning>

Para usar a fal como provedor de imagem padrão:

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

O provedor empacotado de geração de vídeo da `fal` usa por padrão
`fal/fal-ai/minimax/video-01-live`.

| Capability | Value                                                        |
| ---------- | ------------------------------------------------------------ |
| Modos      | Texto para vídeo, referência de imagem única                 |
| Runtime    | Fluxo de envio/status/resultado com suporte de fila para jobs de longa duração |

<AccordionGroup>
  <Accordion title="Modelos de vídeo disponíveis">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Exemplo de config do Seedance 2.0">
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
  </Accordion>

  <Accordion title="Exemplo de config do HeyGen video-agent">
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
  </Accordion>
</AccordionGroup>

<Tip>
Use `openclaw models list --provider fal` para ver a lista completa de modelos fal
disponíveis, incluindo entradas adicionadas recentemente.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Geração de imagem" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference#agent-defaults" icon="gear">
    Padrões do agente, incluindo seleção de modelo de imagem e vídeo.
  </Card>
</CardGroup>
