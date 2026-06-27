---
read_when:
    - Você quer usar a geração de imagens da fal no OpenClaw
    - Você precisa do fluxo de autenticação FAL_KEY
    - Você quer os padrões da fal para image_generate, video_generate ou music_generate
summary: configuração de geração de imagens, vídeos e músicas da fal no OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:03:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

O OpenClaw inclui um provedor `fal` embutido para geração hospedada de imagens,
vídeos e música.

| Propriedade | Valor                                                         |
| -------- | ------------------------------------------------------------- |
| Provedor | `fal`                                                         |
| Autenticação | `FAL_KEY` (canônico; `FAL_API_KEY` também funciona como fallback) |
| API      | endpoints de modelo fal                                      |

## Primeiros passos

<Steps>
  <Step title="Definir a chave de API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Definir um modelo de imagem padrão">
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

O provedor de geração de imagens `fal` embutido usa como padrão
`fal/fal-ai/flux/dev`.

| Capacidade     | Valor                                                              |
| -------------- | ------------------------------------------------------------------ |
| Máximo de imagens | 4 por solicitação; Krea 2: 1 por solicitação                    |
| Modo de edição | Flux: 1 imagem de referência; GPT Image 2: 10; Nano Banana 2: 14  |
| Referências de estilo | Krea 2: até 10 referências de estilo via `image` / `images` |
| Substituições de tamanho | Compatíveis                                                |
| Proporção      | Compatível para geração, Krea 2 e edição do GPT Image 2/Nano Banana 2 |
| Resolução      | Compatível                                                        |
| Formato de saída | `png` ou `jpeg`                                                  |

<Warning>
Solicitações imagem para imagem do Flux **não** são compatíveis com substituições
de `aspectRatio`. Solicitações de edição do GPT Image 2 e Nano Banana 2 usam o
endpoint `/edit` da fal e aceitam dicas de proporção. O Nano Banana 2 também
aceita proporções largas/altas nativas extras, como `4:1`, `1:4`, `8:1` e
`1:8`; o Krea 2 valida seu próprio subconjunto menor de proporções.
</Warning>

Os modelos Krea 2 usam o esquema de payload nativo da Krea na fal. O OpenClaw
envia `aspect_ratio`, `creativity` e `image_style_references` em vez do payload
genérico de `image_size` / endpoint de edição usado pelo Flux. As refs de modelo
são:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Use Medium para ilustração expressiva, anime, pintura e estilos artísticos mais
rápidos. Use Large para visual fotorrealista mais lento, textura bruta, granulação
de filme e aparências detalhadas. O Krea usa como padrão `fal.creativity:
"medium"`; os valores compatíveis são `raw`, `low`, `medium` e `high`.

O Krea 2 expõe proporção, não `image_size`, no esquema de solicitação da fal.
Prefira `aspectRatio`; o OpenClaw mapeia `size` para a proporção Krea compatível
mais próxima e rejeita `resolution` para o Krea em vez de descartá-la.

Use `outputFormat: "png"` quando quiser saída PNG de modelos fal que expõem
`output_format`. A fal não declara um controle explícito de fundo transparente
no OpenClaw, então `background: "transparent"` é relatado como uma substituição
ignorada para modelos fal.
Os endpoints Krea 2 não expõem um campo de solicitação `output_format` pela fal,
então o OpenClaw rejeita substituições de `outputFormat` para solicitações Krea.

Para usar fal como provedor de imagens padrão:

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

Para usar Krea 2 Medium:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## Geração de vídeos

O provedor de geração de vídeos `fal` embutido usa como padrão
`fal/fal-ai/minimax/video-01-live`.

| Capacidade | Valor                                                              |
| ---------- | ------------------------------------------------------------------ |
| Modos      | Texto para vídeo, referência de imagem única, Seedance referência para vídeo |
| Runtime    | Fluxo de envio/status/resultado com fila para trabalhos de longa duração       |

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

## Geração de música

O Plugin `fal` incluído também registra um provedor de geração de música para a
ferramenta compartilhada `music_generate`.

| Capacidade     | Valor                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Modelo padrão  | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| Modelos        | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Runtime        | Solicitação síncrona mais download do áudio gerado                                                     |

Use fal como o provedor de música padrão:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` oferece suporte a letras explícitas e modo instrumental.
ACE-Step e Stable Audio são endpoints de prompt para áudio; escolha-os com a
substituição `model` quando quiser essas famílias de modelos.

<Tip>
Use `openclaw models list --provider fal` para ver a lista completa de modelos fal
disponíveis, incluindo quaisquer entradas adicionadas recentemente.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros da ferramenta de imagem compartilhada e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros da ferramenta de vídeo compartilhada e seleção de provedor.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros da ferramenta de música compartilhada e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões do agente, incluindo seleção de modelos de imagem, vídeo e música.
  </Card>
</CardGroup>
