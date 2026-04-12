---
read_when:
    - Você quer executar o OpenClaw com modelos em nuvem ou locais via Ollama
    - Você precisa de orientação para configuração e setup do Ollama
summary: Execute o OpenClaw com Ollama (modelos em nuvem e locais)
title: Ollama
x-i18n:
    generated_at: "2026-04-12T23:31:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec796241b884ca16ec7077df4f3f1910e2850487bb3ea94f8fdb37c77e02b219
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama é um runtime local de LLM que facilita a execução de modelos open-source na sua máquina. O OpenClaw se integra com a API nativa do Ollama (`/api/chat`), oferece suporte a streaming e chamada de ferramentas, e pode descobrir automaticamente modelos locais do Ollama quando você opta por isso com `OLLAMA_API_KEY` (ou um perfil de auth) e não define uma entrada explícita `models.providers.ollama`.

<Warning>
**Usuários de Ollama remoto**: não use a URL `/v1` compatível com OpenAI (`http://host:11434/v1`) com o OpenClaw. Isso quebra a chamada de ferramentas, e os modelos podem gerar JSON bruto de ferramentas como texto simples. Use a URL da API nativa do Ollama: `baseUrl: "http://host:11434"` (sem `/v1`).
</Warning>

## Primeiros passos

Escolha seu método e modo de configuração preferidos.

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Melhor para:** caminho mais rápido para uma configuração funcional do Ollama com descoberta automática de modelos.

    <Steps>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard
        ```

        Selecione **Ollama** na lista de provedores.
      </Step>
      <Step title="Escolha seu modo">
        - **Nuvem + Local** — modelos hospedados na nuvem e modelos locais juntos
        - **Local** — apenas modelos locais

        Se você escolher **Nuvem + Local** e não estiver conectado ao ollama.com, o onboarding abrirá um fluxo de login no navegador.
      </Step>
      <Step title="Selecione um modelo">
        O onboarding descobre os modelos disponíveis e sugere padrões. Ele faz `pull` automaticamente do modelo selecionado se ele não estiver disponível localmente.
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

    Opcionalmente, especifique uma URL base ou modelo personalizados:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configuração manual">
    **Melhor para:** controle total sobre instalação, `pull` de modelos e configuração.

    <Steps>
      <Step title="Instale o Ollama">
        Baixe em [ollama.com/download](https://ollama.com/download).
      </Step>
      <Step title="Faça pull de um modelo local">
        ```bash
        ollama pull gemma4
        # ou
        ollama pull gpt-oss:20b
        # ou
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Faça login para modelos em nuvem (opcional)">
        Se você quiser modelos em nuvem também:

        ```bash
        ollama signin
        ```
      </Step>
      <Step title="Habilite o Ollama para o OpenClaw">
        Defina qualquer valor para a chave de API (o Ollama não exige uma chave real):

        ```bash
        # Definir variável de ambiente
        export OLLAMA_API_KEY="ollama-local"

        # Ou configurar no arquivo de configuração
        openclaw config set models.providers.ollama.apiKey "ollama-local"
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

## Modelos em nuvem

<Tabs>
  <Tab title="Nuvem + Local">
    Modelos em nuvem permitem executar modelos hospedados na nuvem junto com seus modelos locais. Exemplos incluem `kimi-k2.5:cloud`, `minimax-m2.7:cloud` e `glm-5.1:cloud` -- esses **não** exigem `ollama pull` local.

    Selecione o modo **Nuvem + Local** durante a configuração. O assistente verifica se você está conectado e abre um fluxo de login no navegador quando necessário. Se a autenticação não puder ser verificada, o assistente volta para os padrões de modelos locais.

    Você também pode fazer login diretamente em [ollama.com/signin](https://ollama.com/signin).

    O OpenClaw atualmente sugere estes padrões em nuvem: `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`.

  </Tab>

  <Tab title="Apenas local">
    No modo somente local, o OpenClaw descobre modelos da instância local do Ollama. Nenhum login em nuvem é necessário.

    O OpenClaw atualmente sugere `gemma4` como padrão local.

  </Tab>
</Tabs>

## Descoberta de modelos (provedor implícito)

Quando você define `OLLAMA_API_KEY` (ou um perfil de auth) e **não** define `models.providers.ollama`, o OpenClaw descobre modelos da instância local do Ollama em `http://127.0.0.1:11434`.

| Comportamento         | Detalhe                                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta ao catálogo  | Consulta `/api/tags`                                                                                                                                                 |
| Detecção de capacidade | Usa consultas de melhor esforço a `/api/show` para ler `contextWindow` e detectar capacidades (incluindo visão)                                                   |
| Modelos com visão     | Modelos com capacidade `vision` informada por `/api/show` são marcados como compatíveis com imagem (`input: ["text", "image"]`), então o OpenClaw injeta imagens automaticamente no prompt |
| Detecção de reasoning | Marca `reasoning` com uma heurística baseada no nome do modelo (`r1`, `reasoning`, `think`)                                                                         |
| Limites de token      | Define `maxTokens` com o limite padrão máximo de tokens do Ollama usado pelo OpenClaw                                                                               |
| Custos                | Define todos os custos como `0`                                                                                                                                      |

Isso evita entradas manuais de modelo e mantém o catálogo alinhado com a instância local do Ollama.

```bash
# Veja quais modelos estão disponíveis
ollama list
openclaw models list
```

Para adicionar um novo modelo, basta fazer `pull` dele com o Ollama:

```bash
ollama pull mistral
```

O novo modelo será descoberto automaticamente e estará disponível para uso.

<Note>
Se você definir `models.providers.ollama` explicitamente, a descoberta automática será ignorada e você precisará definir os modelos manualmente. Consulte a seção de configuração explícita abaixo.
</Note>

## Configuração

<Tabs>
  <Tab title="Básica (descoberta implícita)">
    A forma mais simples de habilitar o Ollama é via variável de ambiente:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` estiver definida, você pode omitir `apiKey` na entrada do provedor, e o OpenClaw a preencherá para verificações de disponibilidade.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuais)">
    Use configuração explícita quando o Ollama estiver em outro host/porta, quando você quiser forçar janelas de contexto ou listas de modelos específicas, ou quando quiser definições totalmente manuais de modelos.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            apiKey: "ollama-local",
            api: "ollama",
            models: [
              {
                id: "gpt-oss:20b",
                name: "GPT-OSS 20B",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 8192,
                maxTokens: 8192 * 10
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="URL base personalizada">
    Se o Ollama estiver em execução em outro host ou porta (a configuração explícita desabilita a descoberta automática, então defina os modelos manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Sem /v1 - use a URL nativa da API do Ollama
            api: "ollama", // Defina explicitamente para garantir o comportamento nativo de chamada de ferramentas
          },
        },
      },
    }
    ```

    <Warning>
    Não adicione `/v1` à URL. O caminho `/v1` usa o modo compatível com OpenAI, no qual a chamada de ferramentas não é confiável. Use a URL base do Ollama sem sufixo de caminho.
    </Warning>

  </Tab>
</Tabs>

### Seleção de modelo

Depois de configurado, todos os seus modelos Ollama estarão disponíveis:

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

O OpenClaw oferece suporte ao **Ollama Web Search** como um provedor `web_search` empacotado.

| Propriedade | Detalhe                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Host        | Usa o host Ollama configurado (`models.providers.ollama.baseUrl` quando definido, caso contrário `http://127.0.0.1:11434`) |
| Auth        | Sem chave                                                                                                          |
| Requisito   | O Ollama deve estar em execução e conectado com `ollama signin`                                                   |

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
Para a configuração completa e detalhes de comportamento, consulte [Ollama Web Search](/pt-BR/tools/ollama-search).
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modo legado compatível com OpenAI">
    <Warning>
    **A chamada de ferramentas não é confiável no modo compatível com OpenAI.** Use este modo apenas se precisar do formato OpenAI para um proxy e não depender do comportamento nativo de chamada de ferramentas.
    </Warning>

    Se você precisar usar o endpoint compatível com OpenAI em vez disso (por exemplo, por trás de um proxy que só oferece suporte ao formato OpenAI), defina `api: "openai-completions"` explicitamente:

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

    Esse modo pode não oferecer suporte a streaming e chamada de ferramentas simultaneamente. Talvez seja necessário desabilitar o streaming com `params: { streaming: false }` na configuração do modelo.

    Quando `api: "openai-completions"` é usado com Ollama, o OpenClaw injeta `options.num_ctx` por padrão para que o Ollama não volte silenciosamente para uma janela de contexto de 4096. Se seu proxy/upstream rejeitar campos `options` desconhecidos, desabilite esse comportamento:

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
    Para modelos descobertos automaticamente, o OpenClaw usa a janela de contexto informada pelo Ollama quando disponível; caso contrário, usa a janela de contexto padrão do Ollama usada pelo OpenClaw.

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

  <Accordion title="Modelos com reasoning">
    O OpenClaw trata modelos com nomes como `deepseek-r1`, `reasoning` ou `think` como compatíveis com reasoning por padrão.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Nenhuma configuração adicional é necessária -- o OpenClaw os marca automaticamente.

  </Accordion>

  <Accordion title="Custos de modelo">
    Ollama é gratuito e roda localmente, então todos os custos de modelo são definidos como $0. Isso se aplica tanto a modelos descobertos automaticamente quanto a modelos definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memória">
    O Plugin empacotado do Ollama registra um provedor de embeddings de memória para
    [memory search](/pt-BR/concepts/memory). Ele usa a URL base do Ollama configurada
    e a chave de API.

    | Propriedade   | Valor              |
    | ------------- | ------------------ |
    | Modelo padrão | `nomic-embed-text` |
    | Pull automático | Sim — o modelo de embedding é obtido automaticamente se não estiver presente localmente |

    Para selecionar o Ollama como provedor de embeddings para memory search:

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
    A integração do OpenClaw com Ollama usa a **API nativa do Ollama** (`/api/chat`) por padrão, que oferece suporte completo a streaming e chamada de ferramentas simultaneamente. Nenhuma configuração especial é necessária.

    <Tip>
    Se você precisar usar o endpoint compatível com OpenAI, consulte a seção "Modo legado compatível com OpenAI" acima. Streaming e chamada de ferramentas podem não funcionar simultaneamente nesse modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Ollama não detectado">
    Verifique se o Ollama está em execução, se você definiu `OLLAMA_API_KEY` (ou um perfil de auth) e se você **não** definiu uma entrada explícita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifique se a API está acessível:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Nenhum modelo disponível">
    Se seu modelo não estiver listado, faça `pull` do modelo localmente ou defina-o explicitamente em `models.providers.ollama`.

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
  <Card title="Provedores de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Ollama Web Search" href="/pt-BR/tools/ollama-search" icon="magnifying-glass">
    Configuração completa e detalhes de comportamento da busca na web com Ollama.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
</CardGroup>
