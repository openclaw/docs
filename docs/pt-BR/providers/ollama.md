---
read_when:
    - Você quer executar o OpenClaw com modelos em nuvem ou locais via Ollama
    - Você precisa de orientação para configuração e setup do Ollama
    - Você quer modelos de visão do Ollama para compreensão de imagens
summary: Executar o OpenClaw com Ollama (modelos em nuvem e locais)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T04:26:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32623b6523f22930a5987fb22d2074f1e9bb274cc01ae1ad1837825cc04ec179
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

O OpenClaw integra com a API nativa do Ollama (`/api/chat`) para modelos em nuvem hospedados e servidores Ollama locais/self-hosted. Você pode usar o Ollama em três modos: `Cloud + Local` por um host Ollama acessível, `Cloud only` contra `https://ollama.com`, ou `Local only` contra um host Ollama acessível.

<Warning>
**Usuários de Ollama remoto**: não use a URL compatível com OpenAI `/v1` (`http://host:11434/v1`) com o OpenClaw. Isso quebra o tool calling e os modelos podem gerar JSON bruto de ferramenta como texto simples. Use a URL da API nativa do Ollama: `baseUrl: "http://host:11434"` (sem `/v1`).
</Warning>

## Primeiros passos

Escolha seu método e modo de configuração preferidos.

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Melhor para:** caminho mais rápido para uma configuração funcional do Ollama local ou em nuvem.

    <Steps>
      <Step title="Executar o onboarding">
        ```bash
        openclaw onboard
        ```

        Selecione **Ollama** na lista de providers.
      </Step>
      <Step title="Escolher seu modo">
        - **Cloud + Local** — host Ollama local mais modelos em nuvem roteados por esse host
        - **Cloud only** — modelos Ollama hospedados via `https://ollama.com`
        - **Local only** — apenas modelos locais
      </Step>
      <Step title="Selecionar um modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` e sugere padrões hospedados em nuvem. `Cloud + Local` e `Local only` pedem uma base URL do Ollama, descobrem os modelos disponíveis e fazem `pull` automático do modelo local selecionado se ele ainda não estiver disponível. `Cloud + Local` também verifica se esse host Ollama está autenticado para acesso à nuvem.
      </Step>
      <Step title="Verificar se o modelo está disponível">
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

    Opcionalmente, especifique uma base URL ou modelo personalizado:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configuração manual">
    **Melhor para:** controle total sobre configuração local ou em nuvem.

    <Steps>
      <Step title="Escolher nuvem ou local">
        - **Cloud + Local**: instale o Ollama, autentique com `ollama signin` e roteie requisições em nuvem por esse host
        - **Cloud only**: use `https://ollama.com` com um `OLLAMA_API_KEY`
        - **Local only**: instale o Ollama em [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Fazer pull de um modelo local (somente local)">
        ```bash
        ollama pull gemma4
        # ou
        ollama pull gpt-oss:20b
        # ou
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Ativar Ollama para o OpenClaw">
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
      <Step title="Inspecionar e definir seu modelo">
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

## Modelos em nuvem

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` usa um host Ollama acessível como ponto de controle tanto para modelos locais quanto em nuvem. Esse é o fluxo híbrido preferido do Ollama.

    Use **Cloud + Local** durante a configuração. O OpenClaw solicita a base URL do Ollama, descobre os modelos locais nesse host e verifica se o host está autenticado para acesso à nuvem com `ollama signin`. Quando o host está autenticado, o OpenClaw também sugere padrões hospedados em nuvem como `kimi-k2.5:cloud`, `minimax-m2.7:cloud` e `glm-5.1:cloud`.

    Se o host ainda não estiver autenticado, o OpenClaw mantém a configuração como somente local até que você execute `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` roda contra a API hospedada do Ollama em `https://ollama.com`.

    Use **Cloud only** durante a configuração. O OpenClaw solicita `OLLAMA_API_KEY`, define `baseUrl: "https://ollama.com"` e inicializa a lista de modelos hospedados em nuvem. Esse caminho **não** requer um servidor Ollama local nem `ollama signin`.

    A lista de modelos em nuvem mostrada durante `openclaw onboard` é preenchida ao vivo de `https://ollama.com/api/tags`, limitada a 500 entradas, para que o seletor reflita o catálogo hospedado atual em vez de uma lista estática. Se `ollama.com` estiver inacessível ou não retornar modelos no momento da configuração, o OpenClaw usa como fallback as sugestões hardcoded anteriores para que o onboarding ainda seja concluído.

  </Tab>

  <Tab title="Local only">
    No modo somente local, o OpenClaw descobre modelos a partir da instância Ollama configurada. Esse caminho é para servidores Ollama locais ou self-hosted.

    O OpenClaw atualmente sugere `gemma4` como padrão local.

  </Tab>
</Tabs>

## Descoberta de modelos (provider implícito)

Quando você define `OLLAMA_API_KEY` (ou um perfil de autenticação) e **não** define `models.providers.ollama`, o OpenClaw descobre modelos a partir da instância local do Ollama em `http://127.0.0.1:11434`.

| Comportamento       | Detalhe                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta ao catálogo | Consulta `/api/tags`                                                                                                                                               |
| Detecção de capacidades | Usa buscas best-effort em `/api/show` para ler `contextWindow` e detectar capacidades (incluindo visão)                                                        |
| Modelos de visão    | Modelos com capacidade `vision` informada por `/api/show` são marcados como compatíveis com imagem (`input: ["text", "image"]`), então o OpenClaw injeta imagens automaticamente no prompt |
| Detecção de reasoning | Marca `reasoning` com uma heurística por nome de modelo (`r1`, `reasoning`, `think`)                                                                            |
| Limites de token    | Define `maxTokens` para o limite máximo padrão de tokens do Ollama usado pelo OpenClaw                                                                             |
| Custos              | Define todos os custos como `0`                                                                                                                                     |

Isso evita entradas manuais de modelo e mantém o catálogo alinhado com a instância local do Ollama.

```bash
# Ver o que modelos estão disponíveis
ollama list
openclaw models list
```

Para adicionar um novo modelo, basta fazer pull com o Ollama:

```bash
ollama pull mistral
```

O novo modelo será descoberto automaticamente e ficará disponível para uso.

<Note>
Se você definir `models.providers.ollama` explicitamente, a descoberta automática será ignorada e você precisará definir os modelos manualmente. Consulte a seção de configuração explícita abaixo.
</Note>

## Visão e descrição de imagem

O Plugin empacotado do Ollama registra o Ollama como um provider de media-understanding compatível com imagem. Isso permite que o OpenClaw roteie solicitações explícitas de descrição de imagem e padrões configurados de modelo de imagem por modelos de visão do Ollama locais ou hospedados.

Para visão local, faça pull de um modelo com suporte a imagens:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Depois valide com a CLI infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` deve ser uma ref completa `<provider/model>`. Quando definido, `openclaw infer image describe` executa esse modelo diretamente em vez de ignorar a descrição porque o modelo oferece suporte nativo a visão.

Para tornar o Ollama o modelo padrão de compreensão de imagem para mídia de entrada, configure `agents.defaults.imageModel`:

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

O OpenClaw rejeita solicitações de descrição de imagem para modelos que não estejam marcados como compatíveis com imagem. Com a descoberta implícita, o OpenClaw lê isso do Ollama quando `/api/show` informa uma capacidade de visão.

## Configuração

<Tabs>
  <Tab title="Básica (descoberta implícita)">
    O caminho mais simples para ativação somente local é por variável de ambiente:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` estiver definido, você pode omitir `apiKey` na entrada do provider, e o OpenClaw o preencherá para verificações de disponibilidade.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuais)">
    Use configuração explícita quando quiser uma configuração hospedada em nuvem, quando o Ollama estiver rodando em outro host/porta, quando quiser forçar listas de modelos ou janelas de contexto específicas, ou quando quiser definições de modelo totalmente manuais.

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
    Se o Ollama estiver rodando em outro host ou porta (configuração explícita desativa descoberta automática, então defina os modelos manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Sem /v1 - use a URL da API nativa do Ollama
            api: "ollama", // Defina explicitamente para garantir comportamento nativo de tool-calling
          },
        },
      },
    }
    ```

    <Warning>
    Não adicione `/v1` à URL. O caminho `/v1` usa o modo compatível com OpenAI, em que o tool calling não é confiável. Use a URL base do Ollama sem sufixo de caminho.
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

## Busca na web do Ollama

O OpenClaw oferece suporte à **Ollama Web Search** como um provider empacotado `web_search`.

| Propriedade | Detalhe                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa o host Ollama configurado (`models.providers.ollama.baseUrl` quando definido, caso contrário `http://127.0.0.1:11434`) |
| Autenticação | Sem chave                                                                                                           |
| Requisito   | O Ollama deve estar em execução e autenticado com `ollama signin`                                                   |

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
    **O tool calling não é confiável no modo compatível com OpenAI.** Use esse modo apenas se você precisar do formato OpenAI para um proxy e não depender do comportamento nativo de tool calling.
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

    Esse modo pode não oferecer suporte a streaming e tool calling ao mesmo tempo. Talvez seja necessário desativar o streaming com `params: { streaming: false }` na configuração do modelo.

    Quando `api: "openai-completions"` é usado com Ollama, o OpenClaw injeta `options.num_ctx` por padrão para que o Ollama não faça fallback silencioso para uma janela de contexto de 4096. Se seu proxy/upstream rejeitar campos `options` desconhecidos, desative esse comportamento:

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
    Para modelos descobertos automaticamente, o OpenClaw usa a janela de contexto informada pelo Ollama quando disponível; caso contrário, usa como fallback a janela de contexto padrão do Ollama usada pelo OpenClaw.

    Você pode sobrescrever `contextWindow` e `maxTokens` na configuração explícita do provider:

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

  <Accordion title="Modelos de reasoning">
    O OpenClaw trata por padrão modelos com nomes como `deepseek-r1`, `reasoning` ou `think` como compatíveis com reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Nenhuma configuração adicional é necessária -- o OpenClaw os marca automaticamente.

  </Accordion>

  <Accordion title="Custos de modelo">
    O Ollama é gratuito e roda localmente, então todos os custos de modelo são definidos como $0. Isso se aplica tanto a modelos descobertos automaticamente quanto a modelos definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memória">
    O Plugin empacotado do Ollama registra um provider de embedding de memória para
    [busca de memória](/pt-BR/concepts/memory). Ele usa a base URL
    e a chave de API configuradas do Ollama.

    | Propriedade   | Valor              |
    | ------------- | ------------------ |
    | Modelo padrão | `nomic-embed-text` |
    | Pull automático | Sim — o modelo de embedding é baixado automaticamente se não estiver presente localmente |

    Para selecionar o Ollama como provider de embedding para busca de memória:

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
    A integração do OpenClaw com Ollama usa por padrão a **API nativa do Ollama** (`/api/chat`), que oferece suporte completo a streaming e tool calling ao mesmo tempo. Nenhuma configuração especial é necessária.

    <Tip>
    Se você precisar usar o endpoint compatível com OpenAI, consulte a seção "Modo legado compatível com OpenAI" acima. Streaming e tool calling podem não funcionar ao mesmo tempo nesse modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Ollama não detectado">
    Verifique se o Ollama está em execução, se você definiu `OLLAMA_API_KEY` (ou um perfil de autenticação) e se você **não** definiu uma entrada explícita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifique se a API está acessível:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Nenhum modelo disponível">
    Se seu modelo não estiver listado, faça pull do modelo localmente ou defina-o explicitamente em `models.providers.ollama`.

    ```bash
    ollama list  # Veja o que está instalado
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Ou outro modelo
    ```

  </Accordion>

  <Accordion title="Conexão recusada">
    Verifique se o Ollama está rodando na porta correta:

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
  <Card title="Providers de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Ollama Web Search" href="/pt-BR/tools/ollama-search" icon="magnifying-glass">
    Detalhes completos de configuração e comportamento para busca na web com Ollama.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
</CardGroup>
