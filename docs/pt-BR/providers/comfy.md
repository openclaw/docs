---
read_when:
    - Você quer usar fluxos de trabalho locais do ComfyUI com o OpenClaw
    - Você quer usar o Comfy Cloud com fluxos de trabalho de imagem, vídeo ou música
    - Você precisa das chaves de configuração do plugin comfy incluído no pacote
summary: Configuração do fluxo de trabalho do ComfyUI para geração de imagens, vídeos e músicas no OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T15:38:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw inclui um plugin `comfy` integrado para execuções do ComfyUI orientadas por fluxos de trabalho. O
plugin é totalmente orientado por fluxos de trabalho: o OpenClaw não mapeia controles genéricos como `size`,
`aspectRatio`, `resolution`, `durationSeconds` ou controles no estilo TTS para
o seu grafo.

| Propriedade         | Detalhe                                                                          |
| ------------------- | -------------------------------------------------------------------------------- |
| Provedor            | `comfy`                                                                          |
| Modelo              | `comfy/workflow`                                                                 |
| Ferramentas comuns  | `image_generate`, `video_generate`, `music_generate`                             |
| Autenticação        | Nenhuma para o ComfyUI local; `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para o Comfy Cloud |
| API                 | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                   |

## O que é compatível

- Geração e edição de imagens a partir de um fluxo de trabalho JSON (a edição aceita 1 imagem de referência enviada)
- Geração de vídeos a partir de um fluxo de trabalho JSON, de texto para vídeo ou de imagem para vídeo (1 imagem de referência)
- Geração de música/áudio por meio da ferramenta compartilhada `music_generate`, com 1 imagem de referência opcional
- Download da saída de um Node configurado ou de todos os Nodes de saída correspondentes quando nenhum estiver configurado

## Primeiros passos

Escolha entre executar o ComfyUI em sua própria máquina ou usar o Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Ideal para:** executar sua própria instância do ComfyUI em sua máquina ou LAN.

    <Steps>
      <Step title="Inicie o ComfyUI localmente">
        Verifique se sua instância local do ComfyUI está em execução (o padrão é `http://127.0.0.1:8188`).
      </Step>
      <Step title="Prepare o JSON do fluxo de trabalho">
        Exporte ou crie um arquivo JSON de fluxo de trabalho do ComfyUI. Anote os IDs dos Nodes referentes ao Node de entrada do prompt e ao Node de saída que você deseja que o OpenClaw leia.
      </Step>
      <Step title="Configure o provedor">
        Defina `mode: "local"` e indique o arquivo do seu fluxo de trabalho. Exemplo mínimo de imagem:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
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
          },
        }
        ```
      </Step>
      <Step title="Defina o modelo padrão">
        Aponte o OpenClaw para o modelo `comfy/workflow` referente ao recurso configurado:

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
    **Ideal para:** executar fluxos de trabalho no Comfy Cloud sem gerenciar recursos locais de GPU.

    <Steps>
      <Step title="Obtenha uma chave de API">
        Cadastre-se em [comfy.org](https://comfy.org) e gere uma chave de API no painel da sua conta.
      </Step>
      <Step title="Defina a chave de API">
        Forneça sua chave por meio de qualquer um destes métodos:

        ```bash
        # Opção de integração inicial
        openclaw onboard --comfy-api-key "your-key"

        # Variável de ambiente (preferível para daemons)
        export COMFY_API_KEY="your-key"

        # Variável de ambiente alternativa
        export COMFY_CLOUD_API_KEY="your-key"

        # Ou diretamente na configuração
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepare o JSON do fluxo de trabalho">
        Exporte ou crie um arquivo JSON de fluxo de trabalho do ComfyUI. Anote os IDs dos Nodes referentes ao Node de entrada do prompt e ao Node de saída.
      </Step>
      <Step title="Configure o provedor">
        Defina `mode: "cloud"` e indique o arquivo do seu fluxo de trabalho:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        No modo de nuvem, o valor padrão de `baseUrl` é `https://cloud.comfy.org`. Defina `baseUrl` apenas para um endpoint de nuvem personalizado.
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

O Comfy permite configurações de conexão compartilhadas no nível superior, além de seções de fluxo de trabalho específicas por recurso (`image`, `video`, `music`):

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
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
  },
}
```

### Chaves compartilhadas

| Chave                 | Tipo                       | Descrição                                                                             |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` ou `"cloud"`     | Modo de conexão. O padrão é `"local"`.                                                |
| `baseUrl`             | string                     | O padrão é `http://127.0.0.1:8188` para local ou `https://cloud.comfy.org` para nuvem. |
| `apiKey`              | string                     | Chave opcional diretamente na configuração, alternativa às variáveis de ambiente `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                    | Permite uma `baseUrl` privada/LAN no modo de nuvem ou um FQDN de DNS privado local.   |

<Note>
No modo `local`, literais de IP de loopback/privado e nomes de serviço de rótulo único, como `http://comfyui:8188`, funcionam sem `allowPrivateNetwork`. FQDNs de DNS privado com aparência pública, como `https://comfy.local.example.com`, exigem `allowPrivateNetwork: true`. A confiança na origem privada permanece restrita ao esquema, nome do host e porta configurados; os redirecionamentos locais não podem sair do nome do host configurado, enquanto os redirecionamentos de nuvem para CDNs públicas são verificados com a política SSRF padrão.
</Note>

### Chaves por recurso

Estas chaves se aplicam dentro das seções `image`, `video` ou `music`:

| Chave                        | Obrigatório | Padrão   | Descrição                                                                    |
| ---------------------------- | ----------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` ou `workflowPath` | Sim         | --       | JSON do fluxo de trabalho diretamente na configuração ou caminho para o arquivo JSON do fluxo de trabalho do ComfyUI. |
| `promptNodeId`               | Sim         | --       | ID do Node que recebe o prompt de texto.                                     |
| `promptInputName`            | Não         | `"text"` | Nome da entrada no Node do prompt.                                           |
| `outputNodeId`               | Não         | --       | ID do Node do qual a saída será lida. Se omitido, todos os Nodes de saída correspondentes serão usados. |
| `pollIntervalMs`             | Não         | `1500`   | Intervalo de consulta em milissegundos para a conclusão do trabalho.         |
| `timeoutMs`                  | Não         | `300000` | Tempo limite em milissegundos para a execução do fluxo de trabalho.          |

As seções `image` e `video` também permitem um Node de entrada para imagem de referência:

| Chave                 | Obrigatório                                 | Padrão    | Descrição                                           |
| --------------------- | ------------------------------------------- | --------- | --------------------------------------------------- |
| `inputImageNodeId`    | Sim (ao fornecer uma imagem de referência)  | --        | ID do Node que recebe a imagem de referência enviada. |
| `inputImageInputName` | Não                                         | `"image"` | Nome da entrada no Node de imagem.                  |

`apiKey` aceita uma string literal ou um objeto de [referência de segredo](/pt-BR/gateway/configuration-reference#secrets).

## Detalhes do fluxo de trabalho

<AccordionGroup>
  <Accordion title="Fluxos de trabalho de imagem">
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

    Para habilitar a edição de imagens com uma imagem de referência enviada, adicione `inputImageNodeId` à configuração de imagem:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
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
      },
    }
    ```

  </Accordion>

  <Accordion title="Fluxos de trabalho de vídeo">
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

    Os fluxos de trabalho de vídeo do Comfy permitem a geração de texto para vídeo e de imagem para vídeo por meio do grafo configurado.

    <Note>
    O OpenClaw não fornece vídeos de entrada aos fluxos de trabalho do Comfy. Apenas prompts de texto e imagens de referência individuais são aceitos como entradas.
    </Note>

  </Accordion>

  <Accordion title="Fluxos de trabalho de música">
    O plugin integrado registra um provedor de geração de música para saídas de áudio ou música definidas pelo fluxo de trabalho, disponibilizado por meio da ferramenta compartilhada `music_generate`. Ele aceita uma imagem de referência opcional (até 1):

    ```text
    /tool music_generate prompt="Loop de sintetizador ambiente acolhedor com textura suave de fita"
    ```

    Use a seção de configuração `music` para indicar o JSON do seu fluxo de trabalho de áudio e o Node de saída.

  </Accordion>

  <Accordion title="Compatibilidade com versões anteriores">
    A configuração de imagem existente no nível superior (sem a seção `image` aninhada) continua funcionando:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    O OpenClaw trata esse formato legado como a configuração do fluxo de trabalho de imagem. Não é necessário migrar imediatamente, mas as seções aninhadas `image` / `video` / `music` são recomendadas para novas configurações. Se você usa apenas a geração de imagens, a configuração plana legada e a nova seção `image` aninhada são funcionalmente equivalentes.

  </Accordion>

  <Accordion title="Testes em tempo real">
    Há cobertura opcional de testes em tempo real para o plugin integrado:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    O teste em ambiente real ignora casos individuais de imagem, vídeo ou música, a menos que a seção correspondente do fluxo de trabalho do Comfy esteja configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Configuração e uso da ferramenta de geração de imagens.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Configuração e uso da ferramenta de geração de vídeos.
  </Card>
  <Card title="Geração de música" href="/pt-BR/tools/music-generation" icon="music">
    Configuração da ferramenta de geração de música e áudio.
  </Card>
  <Card title="Diretório de provedores" href="/pt-BR/providers/index" icon="layers">
    Visão geral de todos os provedores e referências de modelos.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Referência completa de configuração, incluindo os padrões dos agentes.
  </Card>
</CardGroup>
