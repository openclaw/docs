---
read_when:
    - Você quer executar o OpenClaw com modelos na nuvem ou locais via Ollama
    - Você precisa de orientação de configuração inicial e configuração do Ollama
    - Você quer modelos de visão do Ollama para entendimento de imagem
summary: Executar o OpenClaw com Ollama (modelos na nuvem e locais)
title: Ollama
x-i18n:
    generated_at: "2026-04-24T06:08:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9595459cc32ff81332b09a81388f84059f48e86039170078fd7f30ccd9b4e1f5
    source_path: providers/ollama.md
    workflow: 15
---

O OpenClaw se integra à API nativa do Ollama (`/api/chat`) para modelos hospedados na nuvem e servidores Ollama locais/auto-hospedados. Você pode usar o Ollama em três modos: `Cloud + Local` por meio de um host Ollama acessível, `Cloud only` contra `https://ollama.com` ou `Local only` contra um host Ollama acessível.

<Warning>
**Usuários de Ollama remoto**: não use a URL compatível com OpenAI `/v1` (`http://host:11434/v1`) com o OpenClaw. Isso quebra chamadas de ferramenta e os modelos podem emitir JSON bruto de ferramenta como texto simples. Use a URL da API nativa do Ollama: `baseUrl: "http://host:11434"` (sem `/v1`).
</Warning>

## Primeiros passos

Escolha seu método e modo preferido de configuração inicial.

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Melhor para:** caminho mais rápido para uma configuração funcional do Ollama na nuvem ou local.

    <Steps>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard
        ```

        Selecione **Ollama** na lista de provedores.
      </Step>
      <Step title="Escolha seu modo">
        - **Cloud + Local** — host Ollama local mais modelos em nuvem roteados por esse host
        - **Cloud only** — modelos hospedados do Ollama via `https://ollama.com`
        - **Local only** — apenas modelos locais

      </Step>
      <Step title="Selecione um modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` e sugere padrões hospedados na nuvem. `Cloud + Local` e `Local only` pedem uma base URL do Ollama, descobrem os modelos disponíveis e fazem auto-pull do modelo local selecionado se ele ainda não estiver disponível. `Cloud + Local` também verifica se esse host Ollama está autenticado para acesso à nuvem.
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Modo não interativo

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Opcionalmente, especifique uma base URL ou modelo personalizados:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configuração manual">
    **Melhor para:** controle total sobre configuração na nuvem ou local.

    <Steps>
      <Step title="Escolha nuvem ou local">
        - **Cloud + Local**: instale o Ollama, faça login com `ollama signin` e roteie solicitações de nuvem por esse host
        - **Cloud only**: use `https://ollama.com` com um `OLLAMA_API_KEY`
        - **Local only**: instale o Ollama a partir de [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Baixe um modelo local (somente local)">
        ```bash
        ollama pull gemma4
        # ou
        ollama pull gpt-oss:20b
        # ou
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Ative o Ollama para o OpenClaw">
        Para `Cloud only`, use seu `OLLAMA_API_KEY` real. Para configurações baseadas em host, qualquer valor placeholder funciona:

        ```bash
        # Nuvem
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Somente local
        export OLLAMA_API_KEY="ollama-local"

        # Ou configure no seu arquivo de configuração
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspecione e defina seu modelo">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Ou defina o padrão na configuração:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Modelos na nuvem

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` usa um host Ollama acessível como ponto de controle para modelos locais e em nuvem. Esse é o fluxo híbrido preferido do Ollama.

    Use **Cloud + Local** durante a configuração. O OpenClaw solicita a base URL do Ollama, descobre modelos locais desse host e verifica se o host está autenticado para acesso à nuvem com `ollama signin`. Quando o host está autenticado, o OpenClaw também sugere padrões hospedados na nuvem, como `kimi-k2.5:cloud`, `minimax-m2.7:cloud` e `glm-5.1:cloud`.

    Se o host ainda não estiver autenticado, o OpenClaw mantém a configuração apenas local até que você execute `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` é executado contra a API hospedada do Ollama em `https://ollama.com`.

    Use **Cloud only** durante a configuração. O OpenClaw solicita `OLLAMA_API_KEY`, define `baseUrl: "https://ollama.com"` e inicializa a lista de modelos hospedados na nuvem. Esse caminho **não** exige um servidor Ollama local nem `ollama signin`.

    A lista de modelos na nuvem mostrada durante `openclaw onboard` é preenchida ao vivo a partir de `https://ollama.com/api/tags`, limitada a 500 entradas, para que o seletor reflita o catálogo hospedado atual em vez de uma semente estática. Se `ollama.com` estiver inacessível ou não retornar modelos no momento da configuração, o OpenClaw recorre às sugestões codificadas anteriormente para que o onboarding ainda seja concluído.

  </Tab>

  <Tab title="Local only">
    No modo somente local, o OpenClaw descobre modelos da instância Ollama configurada. Esse caminho é para servidores Ollama locais ou auto-hospedados.

    Atualmente, o OpenClaw sugere `gemma4` como padrão local.

  </Tab>
</Tabs>

## Descoberta de modelo (provedor implícito)

Quando você define `OLLAMA_API_KEY` (ou um perfil de autenticação) e **não** define `models.providers.ollama`, o OpenClaw descobre modelos da instância local do Ollama em `http://127.0.0.1:11434`.

| Behavior             | Detail                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta ao catálogo | Consulta `/api/tags`                                                                                                                                                  |
| Detecção de capacidade | Usa buscas de melhor esforço em `/api/show` para ler `contextWindow` e detectar capacidades (incluindo visão)                                                      |
| Modelos de visão     | Modelos com capacidade `vision` relatada por `/api/show` são marcados como compatíveis com imagem (`input: ["text", "image"]`), então o OpenClaw injeta imagens automaticamente no prompt |
| Detecção de raciocínio | Marca `reasoning` com uma heurística baseada no nome do modelo (`r1`, `reasoning`, `think`)                                                                        |
| Limites de tokens    | Define `maxTokens` para o limite máximo padrão de tokens do Ollama usado pelo OpenClaw                                                                              |
| Custos               | Define todos os custos como `0`                                                                                                                                        |

Isso evita entradas manuais de modelo e mantém o catálogo alinhado com a instância local do Ollama.

```bash
# Veja quais modelos estão disponíveis
ollama list
openclaw models list
```

Para adicionar um novo modelo, basta baixá-lo com o Ollama:

```bash
ollama pull mistral
```

O novo modelo será descoberto automaticamente e ficará disponível para uso.

<Note>
Se você definir `models.providers.ollama` explicitamente, a descoberta automática será ignorada e você precisará definir os modelos manualmente. Consulte a seção de configuração explícita abaixo.
</Note>

## Visão e descrição de imagem

O Plugin Ollama incluído registra o Ollama como um provedor de entendimento de mídia compatível com imagem. Isso permite que o OpenClaw roteie solicitações explícitas de descrição de imagem e padrões configurados de modelo de imagem por meio de modelos de visão do Ollama locais ou hospedados.

Para visão local, baixe um modelo que ofereça suporte a imagens:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Depois verifique com a CLI infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` deve ser uma ref completa `<provider/model>`. Quando definido, `openclaw infer image describe` executa esse modelo diretamente em vez de pular a descrição porque o modelo oferece suporte nativo a visão.

Para tornar o Ollama o modelo padrão de entendimento de imagem para mídia de entrada, configure `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Se você definir `models.providers.ollama.models` manualmente, marque modelos de visão com suporte a entrada de imagem:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

O OpenClaw rejeita solicitações de descrição de imagem para modelos que não estejam marcados como compatíveis com imagem. Com descoberta implícita, o OpenClaw lê isso do Ollama quando `/api/show` informa uma capacidade de visão.

## Configuração

<Tabs>
  <Tab title="Básica (descoberta implícita)">
    O caminho mais simples para ativação apenas local é via variável de ambiente:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` estiver definido, você pode omitir `apiKey` na entrada do provedor e o OpenClaw o preencherá para verificações de disponibilidade.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuais)">
    Use configuração explícita quando quiser uma configuração hospedada na nuvem, quando o Ollama estiver sendo executado em outro host/porta, quando quiser forçar janelas de contexto ou listas de modelos específicas, ou quando quiser definições totalmente manuais de modelos.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Base URL personalizada">
    Se o Ollama estiver em execução em outro host ou porta (configuração explícita desativa a descoberta automática, então defina os modelos manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Sem /v1 - use a URL da API nativa do Ollama
            api: "ollama", // Defina explicitamente para garantir comportamento nativo de chamada de ferramenta
          },
        },
      },
    }
    ```

    <Warning>
    Não adicione `/v1` à URL. O caminho `/v1` usa o modo compatível com OpenAI, em que chamadas de ferramenta não são confiáveis. Use a URL base do Ollama sem sufixo de caminho.
    </Warning>

  </Tab>
</Tabs>

### Seleção de modelo

Depois de configurados, todos os seus modelos Ollama ficam disponíveis:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

O OpenClaw oferece suporte a **Ollama Web Search** como provedor `web_search` incluído.

| Property    | Detail                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Host        | Usa seu host Ollama configurado (`models.providers.ollama.baseUrl` quando definido, caso contrário `http://127.0.0.1:11434`) |
| Auth        | Sem chave                                                                                                          |
| Requirement | O Ollama deve estar em execução e autenticado com `ollama signin`                                                 |

Escolha **Ollama Web Search** durante `openclaw onboard` ou `openclaw configure --section web`, ou defina:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
Para detalhes completos de configuração e comportamento, consulte [Ollama Web Search](/pt-BR/tools/ollama-search).
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modo legado compatível com OpenAI">
    <Warning>
    **Chamadas de ferramenta não são confiáveis no modo compatível com OpenAI.** Use este modo apenas se você precisar do formato OpenAI para um proxy e não depender do comportamento nativo de chamada de ferramenta.
    </Warning>

    Se você precisar usar o endpoint compatível com OpenAI em vez disso (por exemplo, atrás de um proxy que só oferece suporte ao formato OpenAI), defina `api: "openai-completions"` explicitamente:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // padrão: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Esse modo pode não oferecer suporte simultâneo a streaming e chamadas de ferramenta. Talvez você precise desativar o streaming com `params: { streaming: false }` na configuração do modelo.

    Quando `api: "openai-completions"` é usado com Ollama, o OpenClaw injeta `options.num_ctx` por padrão para que o Ollama não recorra silenciosamente a uma janela de contexto de 4096. Se seu proxy/upstream rejeitar campos `options` desconhecidos, desative esse comportamento:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Janelas de contexto">
    Para modelos descobertos automaticamente, o OpenClaw usa a janela de contexto informada pelo Ollama quando disponível; caso contrário, ele recorre à janela de contexto padrão do Ollama usada pelo OpenClaw.

    Você pode substituir `contextWindow` e `maxTokens` na configuração explícita do provedor:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Modelos de raciocínio">
    O OpenClaw trata modelos com nomes como `deepseek-r1`, `reasoning` ou `think` como compatíveis com raciocínio por padrão.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Nenhuma configuração adicional é necessária -- o OpenClaw os marca automaticamente.

  </Accordion>

  <Accordion title="Custos de modelo">
    O Ollama é gratuito e é executado localmente, então todos os custos de modelo são definidos como $0. Isso se aplica a modelos descobertos automaticamente e definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memória">
    O Plugin Ollama incluído registra um provedor de embedding de memória para
    [a busca em memória](/pt-BR/concepts/memory). Ele usa a base URL e a chave de API configuradas do Ollama.

    | Property      | Value                |
    | ------------- | -------------------- |
    | Modelo padrão | `nomic-embed-text`   |
    | Auto-pull     | Sim — o modelo de embedding é baixado automaticamente se não estiver presente localmente |

    Para selecionar o Ollama como provedor de embedding para busca em memória:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuração de streaming">
    A integração do OpenClaw com Ollama usa a **API nativa do Ollama** (`/api/chat`) por padrão, que oferece suporte completo a streaming e chamadas de ferramenta simultaneamente. Nenhuma configuração especial é necessária.

    Para solicitações nativas `/api/chat`, o OpenClaw também encaminha o controle de thinking diretamente ao Ollama: `/think off` e `openclaw agent --thinking off` enviam `think: false` de nível superior, enquanto níveis de thinking diferentes de `off` enviam `think: true`.

    <Tip>
    Se você precisar usar o endpoint compatível com OpenAI, consulte a seção "Modo legado compatível com OpenAI" acima. Streaming e chamadas de ferramenta podem não funcionar simultaneamente nesse modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Ollama não detectado">
    Certifique-se de que o Ollama está em execução e de que você definiu `OLLAMA_API_KEY` (ou um perfil de autenticação), e que você **não** definiu uma entrada explícita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifique se a API está acessível:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Nenhum modelo disponível">
    Se o seu modelo não estiver listado, faça o pull do modelo localmente ou defina-o explicitamente em `models.providers.ollama`.

    ```bash
    ollama list  # Veja o que está instalado
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Ou outro modelo
    ```

  </Accordion>

  <Accordion title="Conexão recusada">
    Verifique se o Ollama está em execução na porta correta:

    ```bash
    # Verifique se o Ollama está em execução
    ps aux | grep ollama

    # Ou reinicie o Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Ollama Web Search" href="/pt-BR/tools/ollama-search" icon="magnifying-glass">
    Detalhes completos de configuração e comportamento para pesquisa na web com Ollama.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
</CardGroup>
