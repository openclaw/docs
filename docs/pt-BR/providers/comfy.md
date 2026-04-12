---
read_when:
    - Você quer usar workflows locais do ComfyUI com o OpenClaw
    - Você quer usar o Comfy Cloud com workflows de imagem, vídeo ou música
    - Você precisa das chaves de configuração do plugin agrupado `comfy`
summary: Configuração de geração de imagem, vídeo e música com workflow do ComfyUI no OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-12T23:30:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85db395b171f37f80b34b22f3e7707bffc1fd9138e7d10687eef13eaaa55cf24
    source_path: providers/comfy.md
    workflow: 15
---

# ComfyUI

O OpenClaw inclui um Plugin agrupado `comfy` para execuções do ComfyUI orientadas por workflow. O Plugin é totalmente orientado por workflow, então o OpenClaw não tenta mapear controles genéricos como `size`, `aspectRatio`, `resolution`, `durationSeconds` ou controles no estilo TTS para o seu grafo.

| Propriedade      | Detalhe                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| Provedor         | `comfy`                                                                          |
| Modelos          | `comfy/workflow`                                                                 |
| Superfícies compartilhadas | `image_generate`, `video_generate`, `music_generate`                    |
| Autenticação     | Nenhuma para ComfyUI local; `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para Comfy Cloud |
| API              | ComfyUI `/prompt` / `/history` / `/view` e Comfy Cloud `/api/*`                  |

## O que ele oferece

- Geração de imagem a partir de um workflow JSON
- Edição de imagem com 1 imagem de referência enviada
- Geração de vídeo a partir de um workflow JSON
- Geração de vídeo com 1 imagem de referência enviada
- Geração de música ou áudio por meio da ferramenta compartilhada `music_generate`
- Download da saída de um nó configurado ou de todos os nós de saída correspondentes

## Primeiros passos

Escolha entre executar o ComfyUI na sua própria máquina ou usar o Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Ideal para:** executar sua própria instância do ComfyUI na sua máquina ou LAN.

    <Steps>
      <Step title="Inicie o ComfyUI localmente">
        Certifique-se de que sua instância local do ComfyUI esteja em execução (o padrão é `http://127.0.0.1:8188`).
      </Step>
      <Step title="Prepare seu workflow JSON">
        Exporte ou crie um arquivo JSON de workflow do ComfyUI. Anote os IDs dos nós do nó de entrada de prompt e do nó de saída do qual você quer que o OpenClaw leia.
      </Step>
      <Step title="Configure o provedor">
        Defina `mode: "local"` e aponte para o arquivo do seu workflow. Aqui está um exemplo mínimo de imagem:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "local",
                baseUrl: "http://127.0.0.1:8188",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Defina o modelo padrão">
        Aponte o OpenClaw para o modelo `comfy/workflow` para a capacidade que você configurou:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifique">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Ideal para:** executar workflows no Comfy Cloud sem gerenciar recursos locais de GPU.

    <Steps>
      <Step title="Obtenha uma chave de API">
        Cadastre-se em [comfy.org](https://comfy.org) e gere uma chave de API no painel da sua conta.
      </Step>
      <Step title="Defina a chave de API">
        Forneça sua chave por um destes métodos:

        ```bash
        # Variável de ambiente (preferencial)
        export COMFY_API_KEY="your-key"

        # Variável de ambiente alternativa
        export COMFY_CLOUD_API_KEY="your-key"

        # Ou diretamente na configuração
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepare seu workflow JSON">
        Exporte ou crie um arquivo JSON de workflow do ComfyUI. Anote os IDs dos nós do nó de entrada de prompt e do nó de saída.
      </Step>
      <Step title="Configure o provedor">
        Defina `mode: "cloud"` e aponte para o arquivo do seu workflow:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        No modo cloud, `baseUrl` usa por padrão `https://cloud.comfy.org`. Você só precisa definir `baseUrl` se usar um endpoint cloud personalizado.
        </Tip>
      </Step>
      <Step title="Defina o modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifique">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuração

O Comfy oferece suporte a configurações compartilhadas de conexão no nível superior, além de seções de workflow por capacidade (`image`, `video`, `music`):

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

### Chaves compartilhadas

| Chave                 | Tipo                   | Descrição                                                                             |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` ou `"cloud"` | Modo de conexão.                                                                      |
| `baseUrl`             | string                 | Usa por padrão `http://127.0.0.1:8188` para local ou `https://cloud.comfy.org` para cloud. |
| `apiKey`              | string                 | Chave inline opcional, alternativa às variáveis de ambiente `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Permite um `baseUrl` privado/LAN no modo cloud.                                       |

### Chaves por capacidade

Essas chaves se aplicam dentro das seções `image`, `video` ou `music`:

| Chave                        | Obrigatória | Padrão   | Descrição                                                                    |
| ---------------------------- | ----------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` ou `workflowPath` | Sim         | --       | Caminho para o arquivo JSON do workflow do ComfyUI.                          |
| `promptNodeId`               | Sim         | --       | ID do nó que recebe o prompt de texto.                                       |
| `promptInputName`            | Não         | `"text"` | Nome da entrada no nó de prompt.                                             |
| `outputNodeId`               | Não         | --       | ID do nó de onde ler a saída. Se omitido, todos os nós de saída correspondentes serão usados. |
| `pollIntervalMs`             | Não         | --       | Intervalo de polling em milissegundos para conclusão do job.                 |
| `timeoutMs`                  | Não         | --       | Timeout em milissegundos para a execução do workflow.                        |

As seções `image` e `video` também oferecem suporte a:

| Chave                 | Obrigatória                            | Padrão    | Descrição                                           |
| --------------------- | -------------------------------------- | --------- | --------------------------------------------------- |
| `inputImageNodeId`    | Sim (ao passar uma imagem de referência) | --      | ID do nó que recebe a imagem de referência enviada. |
| `inputImageInputName` | Não                                    | `"image"` | Nome da entrada no nó de imagem.                    |

## Detalhes do workflow

<AccordionGroup>
  <Accordion title="Workflows de imagem">
    Defina o modelo de imagem padrão como `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Exemplo de edição com imagem de referência:**

    Para ativar a edição de imagem com uma imagem de referência enviada, adicione `inputImageNodeId` à sua configuração de imagem:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            image: {
              workflowPath: "./workflows/edit-api.json",
              promptNodeId: "6",
              inputImageNodeId: "7",
              inputImageInputName: "image",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Workflows de vídeo">
    Defina o modelo de vídeo padrão como `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Os workflows de vídeo do Comfy oferecem suporte a texto para vídeo e imagem para vídeo por meio do grafo configurado.

    <Note>
    O OpenClaw não passa vídeos de entrada para workflows do Comfy. Apenas prompts de texto e imagens únicas de referência são compatíveis como entradas.
    </Note>

  </Accordion>

  <Accordion title="Workflows de música">
    O Plugin agrupado registra um provedor de geração de música para saídas de áudio ou música definidas por workflow, expostas por meio da ferramenta compartilhada `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Use a seção de configuração `music` para apontar para o JSON do seu workflow de áudio e para o nó de saída.

  </Accordion>

  <Accordion title="Compatibilidade com versões anteriores">
    A configuração de imagem existente no nível superior (sem a seção `image` aninhada) ainda funciona:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    O OpenClaw trata esse formato legado como a configuração do workflow de imagem. Você não precisa migrar imediatamente, mas as seções aninhadas `image` / `video` / `music` são recomendadas para novas configurações.

    <Tip>
    Se você usa apenas geração de imagem, a configuração plana legada e a nova seção `image` aninhada são funcionalmente equivalentes.
    </Tip>

  </Accordion>

  <Accordion title="Testes ao vivo">
    Existe cobertura opt-in de testes ao vivo para o Plugin agrupado:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    O teste ao vivo ignora casos individuais de imagem, vídeo ou música, a menos que a seção correspondente de workflow do Comfy esteja configurada.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Geração de imagem" href="/pt-BR/tools/image-generation" icon="image">
    Configuração e uso da ferramenta de geração de imagem.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Configuração e uso da ferramenta de geração de vídeo.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Configuração da ferramenta de geração de música e áudio.
  </Card>
  <Card title="Diretório de provedores" href="/pt-BR/providers/index" icon="layers">
    Visão geral de todos os provedores e refs de modelo.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference#agent-defaults" icon="gear">
    Referência completa de configuração, incluindo padrões de agente.
  </Card>
</CardGroup>
