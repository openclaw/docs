---
read_when:
    - Você quer usar geração de imagem do fal no OpenClaw
    - Você precisa do fluxo de autenticação `FAL_KEY`
    - Você quer os padrões do fal para `image_generate` ou `video_generate`
summary: Configuração de geração de imagem e vídeo do fal no OpenClaw
title: Fal
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:36:42Z"
  model: gpt-5.4
  provider: openai
  source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
  source_path: providers/fal.md
  workflow: 15
---

O OpenClaw inclui um provedor `fal` integrado para geração hospedada de imagens e vídeos.

| Propriedade | Valor                                                          |
| ----------- | -------------------------------------------------------------- |
| Provedor    | `fal`                                                          |
| Autenticação | `FAL_KEY` (canônico; `FAL_API_KEY` também funciona como fallback) |
| API         | endpoints de modelo fal                                        |

## Primeiros passos

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

## Geração de imagens

O provedor integrado de geração de imagens `fal` usa por padrão
`fal/fal-ai/flux/dev`.

| Capacidade        | Valor                      |
| ----------------- | -------------------------- |
| Máximo de imagens | 4 por solicitação          |
| Modo de edição    | Ativado, 1 imagem de referência |
| Substituições de tamanho | Compatível           |
| Proporção         | Compatível                 |
| Resolução         | Compatível                 |
| Formato de saída  | `png` ou `jpeg`            |

<Warning>
O endpoint de edição de imagens do fal **não** oferece suporte a substituições de `aspectRatio`.
</Warning>

Use `outputFormat: "png"` quando quiser saída em PNG. O fal não declara um
controle explícito de fundo transparente no OpenClaw, então `background:
"transparent"` é informado como uma substituição ignorada para modelos fal.

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

| Capacidade | Valor                                                                |
| ---------- | -------------------------------------------------------------------- |
| Modos      | Texto para vídeo, referência de imagem única, Seedance reference-to-video |
| Runtime    | Fluxo de submit/status/result com fila para jobs de longa duração    |

<AccordionGroup>
  <Accordion title="Modelos de vídeo disponíveis">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

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

  <Accordion title="Exemplo de configuração do Seedance 2.0 reference-to-video">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    O reference-to-video aceita até 9 imagens, 3 vídeos e 3 referências de áudio
    por meio dos parâmetros compartilhados `video_generate` `images`, `videos` e `audioRefs`,
    com no máximo 12 arquivos de referência no total.

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
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões do agente, incluindo seleção de modelo de imagem e vídeo.
  </Card>
</CardGroup>
