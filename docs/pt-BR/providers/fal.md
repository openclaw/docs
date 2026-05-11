---
read_when:
    - Você quer usar a geração de imagens da fal no OpenClaw
    - Você precisa do fluxo de autenticação do FAL_KEY
    - Você quer os padrões do fal para image_generate ou video_generate
summary: Configuração de geração de imagens e vídeos com fal no OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:34:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw inclui um provedor `fal` integrado para geração hospedada de imagens e vídeos.

| Propriedade | Valor                                                         |
| -------- | ------------------------------------------------------------- |
| Provedor | `fal`                                                         |
| Autenticação     | `FAL_KEY` (canônico; `FAL_API_KEY` também funciona como alternativa) |
| API      | endpoints de modelo fal                                           |

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

O provedor de geração de imagens `fal` integrado usa como padrão
`fal/fal-ai/flux/dev`.

| Capacidade     | Valor                                                       |
| -------------- | ----------------------------------------------------------- |
| Máximo de imagens     | 4 por solicitação                                               |
| Modo de edição      | Flux: 1 imagem de referência; GPT Image 2: 10; Nano Banana 2: 14 |
| Substituições de tamanho | Compatível                                                   |
| Proporção   | Compatível para geração e edição com GPT Image 2/Nano Banana 2   |
| Resolução     | Compatível                                                   |
| Formato de saída  | `png` ou `jpeg`                                             |

<Warning>
Solicitações de imagem para imagem no Flux **não** são compatíveis com substituições de `aspectRatio`. Solicitações de edição do GPT
Image 2 e Nano Banana 2 usam o endpoint `/edit` da fal e aceitam
dicas de proporção.
</Warning>

Use `outputFormat: "png"` quando quiser saída em PNG. A fal não declara um
controle explícito de fundo transparente no OpenClaw, portanto `background:
"transparent"` é relatado como uma substituição ignorada para modelos fal.

Para usar a fal como provedora de imagens padrão:

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

## Geração de vídeos

O provedor de geração de vídeos `fal` integrado usa como padrão
`fal/fal-ai/minimax/video-01-live`.

| Capacidade | Valor                                                              |
| ---------- | ------------------------------------------------------------------ |
| Modos      | Texto para vídeo, referência de imagem única, referência para vídeo Seedance |
| Runtime    | Fluxo de envio/status/resultado baseado em fila para trabalhos de longa duração       |

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

  <Accordion title="Exemplo de configuração de referência para vídeo do Seedance 2.0">
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

    Referência para vídeo aceita até 9 imagens, 3 vídeos e 3 referências de áudio
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

## Relacionados

<CardGroup cols={2}>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões do agente, incluindo seleção de modelos de imagem e vídeo.
  </Card>
</CardGroup>
