---
read_when:
    - Você quer usar a geração de imagens da fal no OpenClaw
    - Você precisa do fluxo de autenticação FAL_KEY
    - Você quer os padrões do fal para image_generate, video_generate ou music_generate
summary: configuração de geração de imagens, vídeos e músicas com fal no OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-12T00:17:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw inclui um provedor `fal` integrado para geração hospedada de imagens,
vídeos e músicas.

| Propriedade | Valor                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------ |
| Provedor    | `fal`                                                                                      |
| Autenticação | `FAL_KEY` (canônica; `FAL_API_KEY` também funciona como alternativa)                      |
| API         | Endpoints de modelos fal (`https://fal.run`; tarefas de vídeo usam `https://queue.fal.run`) |
| URL base    | Substitua com `models.providers.fal.baseUrl`                                                |

## Introdução

<Steps>
  <Step title="Definir a chave de API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    Configurações não interativas podem fornecer `--fal-api-key <key>` ou
    exportar `FAL_KEY`. A integração inicial também define
    `fal/fal-ai/flux/dev` como o modelo de imagem padrão quando nenhum está
    configurado.

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

O provedor integrado `fal` de geração de imagens usa
`fal/fal-ai/flux/dev` por padrão.

| Recurso                 | Valor                                                               |
| ----------------------- | ------------------------------------------------------------------- |
| Máximo de imagens       | 4 por solicitação; Krea 2: 1 por solicitação                        |
| Substituições de tamanho | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`   |
| Proporção               | Compatível em todos os casos, exceto imagem para imagem do Flux     |
| Resolução               | `1K`, `2K`, `4K` (limites por modelo abaixo)                        |
| Formato de saída        | `png` (padrão) ou `jpeg`; Krea 2 rejeita substituições de `outputFormat` |

As solicitações de edição (imagens de referência pelos parâmetros
compartilhados `image` / `images`) são encaminhadas para um endpoint de edição
específico do modelo, com limites de referência por modelo:

| Família de modelos       | Referência do modelo após `fal/`       | Endpoint de edição | Máximo de imagens de referência |
| ------------------------ | -------------------------------------- | ------------------ | ------------------------------- |
| Flux e outros modelos fal | `fal-ai/flux/dev` (padrão)            | `/image-to-image`  | 1                               |
| GPT Image                | `openai/gpt-image-*`                   | `/edit`            | 10                              |
| Grok Imagine             | `xai/grok-imagine-image`               | `/edit`            | 3                               |
| Nano Banana (legado)     | `fal-ai/nano-banana`                   | `/edit`            | 3                               |
| Nano Banana 2            | `fal-ai/nano-banana-*`                 | `/edit`            | 14                              |
| Nano Banana 2 Lite       | `google/nano-banana-2-lite`            | `/edit`            | 14                              |
| Krea 2                   | `krea/v2/{medium,large}/text-to-image` | nenhum (referências de estilo) | 10 referências de estilo |

<Warning>
As solicitações de imagem para imagem do Flux **não** aceitam substituições de
`aspectRatio`. As solicitações de edição do GPT Image e do Nano Banana 2 usam o
endpoint `/edit` do fal e aceitam indicações de proporção. O Nano Banana 2
também aceita proporções largas/altas nativas adicionais, como `4:1`, `1:4`,
`8:1` e `1:8`; o Krea 2 valida seu próprio subconjunto menor de proporções. O
Grok Imagine tem sua própria lista de proporções (incluindo `2:1`, `20:9`,
`19.5:9` e suas inversas) e aceita apenas as resoluções `1K`/`2K`; o Nano
Banana legado e o Nano Banana 2 Lite rejeitam substituições de `resolution`.
</Warning>

Os modelos Krea 2 usam o esquema de payload nativo do Krea no fal. O OpenClaw
envia `aspect_ratio`, `creativity` e `image_style_references` em vez do payload
genérico `image_size` / endpoint de edição usado pelo Flux. As referências dos
modelos são:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Use o Medium para ilustrações expressivas, anime, pintura e estilos artísticos
mais rápidos. Use o Large para resultados mais lentos com fotorrealismo,
textura bruta, granulação de filme e visual detalhado. O padrão do Krea é
`fal.creativity: "medium"`; os valores compatíveis são `raw`, `low`, `medium`
e `high`.

O Krea 2 expõe proporção, não `image_size`, no esquema de solicitação do fal.
Prefira `aspectRatio`; o OpenClaw mapeia `size` para a proporção compatível mais
próxima do Krea e rejeita `resolution` para o Krea em vez de descartá-la.

Use `outputFormat: "png"` quando quiser uma saída PNG de modelos fal que expõem
`output_format`. O fal não declara um controle explícito de fundo transparente
no OpenClaw, portanto `background: "transparent"` é informado como uma
substituição ignorada para modelos fal.
Os endpoints do Krea 2 não expõem um campo de solicitação `output_format` pelo
fal, portanto o OpenClaw rejeita substituições de `outputFormat` para
solicitações do Krea.

Para usar o Krea 2 Medium:

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

O provedor integrado `fal` de geração de vídeos usa
`fal/fal-ai/minimax/video-01-live` por padrão.

| Recurso          | Valor                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| Modos            | Texto para vídeo, referência de uma imagem, referência para vídeo do Seedance |
| Execução         | Fluxo de envio/status/resultado baseado em fila para tarefas de longa duração |
| Tempo limite     | 20 minutos por tarefa por padrão; status consultado a cada 5 segundos       |

<AccordionGroup>
  <Accordion title="Modelos de vídeo disponíveis">
    **MiniMax (padrão):**

    - `fal/fal-ai/minimax/video-01-live`

    **Agente de vídeo HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling e Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    As solicitações do MiniMax Live e do HeyGen enviam apenas o prompt e uma
    única imagem de referência opcional; outras substituições não são
    encaminhadas. Os modelos Seedance aceitam `aspectRatio`, `size`,
    `resolution`, durações de 4 a 15 segundos e uma opção de áudio.

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

    A referência para vídeo aceita até 9 imagens, 3 vídeos e 3 referências de
    áudio pelos parâmetros compartilhados `images`, `videos` e `audioRefs` da
    ferramenta `video_generate`, com no máximo 12 arquivos de referência no
    total. As referências de áudio exigem pelo menos uma referência de imagem
    ou vídeo na mesma solicitação.

  </Accordion>

  <Accordion title="Exemplo de configuração do agente de vídeo HeyGen">
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

## Geração de músicas

O Plugin integrado `fal` também registra um provedor de geração de músicas para
a ferramenta compartilhada `music_generate`.

| Recurso        | Valor                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Modelo padrão  | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| Modelos        | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| Duração máxima | 240 segundos                                                                                                             |
| Execução       | Solicitação síncrona seguida do download do áudio gerado                                                                 |

Use o fal como provedor de música padrão:

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

`fal-ai/minimax-music/v2.6` aceita letras explícitas e modo instrumental, mas
não ambos na mesma solicitação. ACE-Step e Stable Audio são endpoints de prompt
para áudio; escolha-os com a substituição `model` quando quiser essas famílias
de modelos. O ACE-Step rejeita letras explícitas; o Stable Audio rejeita tanto
letras quanto o modo instrumental.

<Tip>
As tabelas e seções expansíveis acima abrangem as famílias de modelos que o
provedor fal integrado trata de forma especial. Outros IDs de endpoint de
imagem do fal ainda podem ser selecionados como modelo de imagem; eles são
tratados como o Flux (payload genérico `image_size`, uma imagem de referência
por `/image-to-image`).
</Tip>

## Relacionados

<CardGroup cols={2}>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Geração de músicas" href="/pt-BR/tools/music-generation" icon="music">
    Parâmetros compartilhados da ferramenta de música e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões do agente, incluindo a seleção de modelos de imagem, vídeo e música.
  </Card>
</CardGroup>
