---
read_when:
    - Você quer usar a geração de vídeo do PixVerse no OpenClaw
    - Você precisa da configuração da chave de API/ambiente do PixVerse
    - Você quer tornar o PixVerse o provedor de vídeo padrão
summary: Configuração da geração de vídeo do PixVerse no OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T18:05:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

O OpenClaw fornece `pixverse` como um Plugin externo oficial para geração de vídeo hospedada do PixVerse. O Plugin registra o provedor `pixverse` no contrato `videoGenerationProviders`.

| Propriedade       | Valor                                                                |
| ----------------- | -------------------------------------------------------------------- |
| ID do provedor    | `pixverse`                                                           |
| Pacote do Plugin  | `@openclaw/pixverse-provider`                                        |
| Var. env. de auth | `PIXVERSE_API_KEY`                                                   |
| Flag de onboarding | `--auth-choice pixverse-api-key`                                    |
| Flag direta da CLI | `--pixverse-api-key <key>`                                          |
| API               | API PixVerse Platform v2 (envio de `video_id` mais polling de resultado) |
| Modelo padrão     | `pixverse/v6`                                                        |
| Região padrão da API | Internacional                                                    |

## Primeiros passos

<Steps>
  <Step title="Instale o Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Defina a chave de API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    O assistente pergunta se deve usar o endpoint Internacional
    (`https://app-api.pixverse.ai/openapi/v2`) ou o endpoint CN
    (`https://app-api.pixverseai.cn/openapi/v2`) antes de gravar `region` e
    `baseUrl` na configuração do provedor.

  </Step>
  <Step title="Defina o PixVerse como o provedor de vídeo padrão">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Gere um vídeo">
    Peça ao agente para gerar um vídeo. O PixVerse será usado automaticamente.
  </Step>
</Steps>

## Modos e modelos compatíveis

O provedor expõe modelos de geração do PixVerse por meio da ferramenta de vídeo compartilhada do OpenClaw.

| Modo           | Modelos              | Entrada de referência   |
| -------------- | -------------------- | ----------------------- |
| Texto para vídeo | `v6` (padrão), `c1` | Nenhuma                 |
| Imagem para vídeo | `v6` (padrão), `c1` | 1 imagem local ou remota |

Referências de imagem locais são enviadas para o PixVerse antes da solicitação de imagem para vídeo. URLs de imagem remotas são repassadas pelo endpoint de upload de imagem do PixVerse como `image_url`.

| Opção           | Valores compatíveis                                                          |
| --------------- | --------------------------------------------------------------------------- |
| Duração         | 1-15 segundos                                                               |
| Resolução       | `360P`, `540P`, `720P`, `1080P`                                             |
| Proporção       | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` para texto para vídeo |
| Áudio gerado    | `audio: true`                                                               |

<Note>
A geração de template de imagem do PixVerse ainda não é exposta por meio de `image_generate`. Essa API é orientada por ID de template, enquanto o contrato compartilhado de geração de imagem do OpenClaw ainda não tem um conjunto de opções tipadas específico do PixVerse.
</Note>

## Opções do provedor

O provedor de vídeo aceita estas chaves opcionais específicas do provedor:

| Opção                                | Tipo   | Efeito                            |
| ------------------------------------ | ------ | --------------------------------- |
| `seed`                               | number | Seed determinística quando compatível |
| `negativePrompt` / `negative_prompt` | string | Prompt negativo                   |
| `quality`                            | string | Qualidade do PixVerse, como `720p` |
| `motionMode` / `motion_mode`         | string | Modo de movimento de imagem para vídeo |
| `cameraMovement` / `camera_movement` | string | Predefinição de movimento de câmera do PixVerse |
| `templateId` / `template_id`         | number | ID de template PixVerse ativado   |

## Configuração

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## Configuração avançada

<AccordionGroup>
  <Accordion title="Região da API">
    O OpenClaw usa por padrão a API internacional do PixVerse. Defina `models.providers.pixverse.region`
    manualmente quando sua chave pertencer a uma região específica da plataforma PixVerse, ou use
    `openclaw onboard --auth-choice pixverse-api-key` para escolher uma no assistente de configuração:

    | Valor da região | URL base da API PixVerse                    |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL base personalizada">
    Defina `models.providers.pixverse.baseUrl` somente ao rotear por um proxy compatível confiável.
    `baseUrl` tem precedência sobre `region`.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Polling de tarefa">
    O PixVerse retorna um `video_id` da solicitação de geração. O OpenClaw faz polling de
    `/openapi/v2/video/result/{video_id}` até que a tarefa seja concluída com sucesso, falhe
    ou atinja o tempo limite.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros da ferramenta compartilhada, seleção de provedor e comportamento assíncrono.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Configurações padrão do agente, incluindo o modelo de geração de vídeo.
  </Card>
</CardGroup>
