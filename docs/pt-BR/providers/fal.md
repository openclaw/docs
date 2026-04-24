---
read_when:
    - Você quer usar a geração de imagem do fal no OpenClaw
    - Você precisa do fluxo de autenticação `FAL_KEY`
    - Você quer padrões do fal para `image_generate` ou `video_generate`
summary: Configuração de geração de imagem e vídeo do fal no OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-24T06:07:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

O OpenClaw inclui um provider `fal` para geração hospedada de imagem e vídeo.

| Propriedade | Valor                                                         |
| ----------- | ------------------------------------------------------------- |
| Provider    | `fal`                                                         |
| Autenticação| `FAL_KEY` (canônico; `FAL_API_KEY` também funciona como fallback) |
| API         | endpoints de modelo do fal                                    |

## Primeiros passos

<Steps>
  <Step title="Definir a chave de API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Definir um modelo padrão de imagem">
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

O provider incluído de geração de imagem `fal` usa por padrão
`fal/fal-ai/flux/dev`.

| Capacidade      | Valor                        |
| ----------------| ---------------------------- |
| Máx. de imagens | 4 por solicitação            |
| Modo de edição  | Habilitado, 1 imagem de referência |
| Substituições de tamanho | Compatível          |
| Proporção       | Compatível                   |
| Resolução       | Compatível                   |

<Warning>
O endpoint de edição de imagem do fal **não** oferece suporte a substituições de `aspectRatio`.
</Warning>

Para usar fal como provider padrão de imagem:

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

O provider incluído de geração de vídeo `fal` usa por padrão
`fal/fal-ai/minimax/video-01-live`.

| Capacidade | Valor                                                        |
| ---------- | ------------------------------------------------------------ |
| Modos      | Texto para vídeo, referência de imagem única                 |
| Runtime    | Fluxo de fila com submit/status/result para trabalhos longos |

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

  <Accordion title="Exemplo de configuração do Seedance 2.0">
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

  <Accordion title="Exemplo de configuração do HeyGen video-agent">
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
    Parâmetros compartilhados da ferramenta de imagem e seleção de provider.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provider.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões de agente, incluindo seleção de modelo de imagem e vídeo.
  </Card>
</CardGroup>
