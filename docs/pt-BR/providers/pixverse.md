---
read_when:
    - Você quer usar a geração de vídeos do PixVerse no OpenClaw
    - Você precisa configurar a chave da API do PixVerse e a variável de ambiente correspondente
    - Você quer definir o PixVerse como o provedor de vídeo padrão
summary: Configuração da geração de vídeos do PixVerse no OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T00:18:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw fornece o `pixverse` como um plugin externo oficial para geração de vídeos hospedada do PixVerse. O plugin registra o provedor `pixverse` no contrato `videoGenerationProviders`.

| Propriedade             | Valor                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| ID do provedor          | `pixverse`                                                                    |
| Pacote do plugin        | `@openclaw/pixverse-provider`                                                 |
| Variável de ambiente de autenticação | `PIXVERSE_API_KEY`                                                |
| Sinalizador de integração inicial | `--auth-choice pixverse-api-key`                                     |
| Sinalizador direto da CLI | `--pixverse-api-key <key>`                                                  |
| API                     | PixVerse Platform API v2 (envio de `video_id` seguido de consulta do resultado) |
| Modelo padrão           | `pixverse/v6`                                                                 |
| Região padrão da API    | Internacional                                                                 |

## Primeiros passos

<Steps>
  <Step title="Instale o plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Defina a chave da API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    O assistente solicita o endpoint Internacional ou CN (consulte a região da API
    abaixo) antes de gravar `region` e `baseUrl` na configuração do provedor.
    Execuções não interativas (com a chave de `--pixverse-api-key` ou `PIXVERSE_API_KEY`)
    usam Internacional como padrão.

    A integração inicial também define `agents.defaults.videoGenerationModel.primary` como
    `pixverse/v6` quando ainda não há um modelo de vídeo padrão configurado.

  </Step>
  <Step title="Altere um provedor de vídeo padrão existente (opcional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Gere um vídeo">
    Peça ao agente para gerar um vídeo. O PixVerse será usado automaticamente.
  </Step>
</Steps>

## Modos e modelos compatíveis

O provedor disponibiliza os modelos de geração do PixVerse por meio da ferramenta de vídeo compartilhada do OpenClaw.

| Modo           | Modelos               | Entrada de referência       |
| -------------- | --------------------- | --------------------------- |
| Texto para vídeo  | `v6` (padrão), `c1` | Nenhuma                     |
| Imagem para vídeo | `v6` (padrão), `c1` | 1 imagem local ou remota    |

As referências a imagens locais são enviadas ao PixVerse antes da solicitação de imagem para vídeo. URLs de imagens remotas são encaminhadas pelo endpoint de envio de imagens do PixVerse como `image_url`.

| Opção         | Valores compatíveis                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Duração       | 1 a 15 segundos (padrão: 5)                                                                                                               |
| Resolução     | `360P`, `540P`, `720P`, `1080P` (padrão: `540P`; solicitações de `480P` são mapeadas para `540P`)                                         |
| Proporção     | `16:9` (padrão), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; somente texto para vídeo; imagem para vídeo segue a imagem de origem |
| Áudio gerado  | `audio: true`                                                                                                                              |

<Note>
A geração de modelos de imagem do PixVerse ainda não está disponível por meio de `image_generate`. Essa API é orientada por ID de modelo, enquanto o contrato compartilhado de geração de imagens do OpenClaw atualmente não possui um conjunto tipado de opções específico do PixVerse.
</Note>

## Opções do provedor

O provedor de vídeo aceita estas chaves opcionais específicas do provedor:

| Opção                                | Tipo   | Efeito                                               |
| ------------------------------------ | ------ | ---------------------------------------------------- |
| `seed`                               | número | Semente determinística, de 0 a 2147483647            |
| `negativePrompt` / `negative_prompt` | string | Prompt negativo                                      |
| `quality`                            | string | Qualidade do PixVerse, como `720p`                    |
| `motionMode` / `motion_mode`         | string | Modo de movimento de imagem para vídeo (padrão: `normal`) |
| `cameraMovement` / `camera_movement` | string | Predefinição de movimento de câmera do PixVerse      |
| `templateId` / `template_id`         | número | ID de modelo ativado do PixVerse                     |

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
    | Valor da região  | URL base da API do PixVerse                    |
    | ---------------- | ---------------------------------------------- |
    | `international`  | `https://app-api.pixverse.ai/openapi/v2`       |
    | `cn`             | `https://app-api.pixverseai.cn/openapi/v2`     |

    Defina `models.providers.pixverse.region` manualmente quando sua chave pertencer a uma
    região específica da plataforma PixVerse ou execute
    `openclaw onboard --auth-choice pixverse-api-key` para escolher uma no
    assistente de configuração:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" ou "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL base personalizada">
    Defina `models.providers.pixverse.baseUrl` somente ao rotear por um proxy compatível e confiável.
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

  <Accordion title="Consulta de tarefas">
    O PixVerse retorna um `video_id` na solicitação de geração. O OpenClaw consulta
    `/openapi/v2/video/result/{video_id}` a cada 5 segundos até que a tarefa
    seja concluída com sucesso, falhe ou atinja o tempo limite (padrão: 5 minutos; substitua-o com
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta, seleção do provedor e comportamento assíncrono.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Configurações padrão do agente, incluindo o modelo de geração de vídeos.
  </Card>
</CardGroup>
