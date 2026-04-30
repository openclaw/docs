---
read_when:
    - Você quer executar o OpenClaw com modelos na nuvem ou locais via Ollama
    - Você precisa de orientações de instalação e configuração do Ollama
    - Você quer modelos de visão do Ollama para compreensão de imagens
summary: Execute o OpenClaw com o Ollama (modelos em nuvem e locais)
title: Ollama
x-i18n:
    generated_at: "2026-04-30T10:05:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw integra-se à API nativa do Ollama (`/api/chat`) para modelos em nuvem hospedados e servidores Ollama locais/auto-hospedados. Você pode usar o Ollama em três modos: `Cloud + Local` por meio de um host Ollama acessível, `Cloud only` contra `https://ollama.com`, ou `Local only` contra um host Ollama acessível.

<Warning>
**Usuários remotos do Ollama**: Não use a URL compatível com OpenAI `/v1` (`http://host:11434/v1`) com OpenClaw. Isso quebra chamadas de ferramentas, e os modelos podem gerar JSON bruto de ferramentas como texto simples. Use a URL da API nativa do Ollama: `baseUrl: "http://host:11434"` (sem `/v1`).
</Warning>

A configuração do provedor Ollama usa `baseUrl` como chave canônica. O OpenClaw também aceita `baseURL` para compatibilidade com exemplos no estilo do SDK da OpenAI, mas novas configurações devem preferir `baseUrl`.

## Regras de autenticação

<AccordionGroup>
  <Accordion title="Hosts locais e de LAN">
    Hosts Ollama locais e de LAN não precisam de um token bearer real. O OpenClaw usa o marcador local `ollama-local` somente para URLs base do Ollama em loopback, redes privadas, `.local` e nomes de host simples.
  </Accordion>
  <Accordion title="Hosts remotos e do Ollama Cloud">
    Hosts públicos remotos e o Ollama Cloud (`https://ollama.com`) exigem uma credencial real por meio de `OLLAMA_API_KEY`, um perfil de autenticação ou o `apiKey` do provedor.
  </Accordion>
  <Accordion title="IDs de provedor personalizados">
    IDs de provedor personalizados que definem `api: "ollama"` seguem as mesmas regras. Por exemplo, um provedor `ollama-remote` que aponta para um host Ollama em uma LAN privada pode usar `apiKey: "ollama-local"`, e subagentes resolverão esse marcador por meio do gancho do provedor Ollama em vez de tratá-lo como uma credencial ausente. A busca de memória também pode definir `agents.defaults.memorySearch.provider` para esse ID de provedor personalizado para que os embeddings usem o endpoint Ollama correspondente.
  </Accordion>
  <Accordion title="Perfis de autenticação">
    `auth-profiles.json` armazena a credencial para um ID de provedor. Coloque configurações de endpoint (`baseUrl`, `api`, IDs de modelo, cabeçalhos, tempos limite) em `models.providers.<id>`. Arquivos de perfil de autenticação planos mais antigos, como `{ "ollama-windows": { "apiKey": "ollama-local" } }`, não são um formato de runtime; execute `openclaw doctor --fix` para reescrevê-los para o perfil de chave de API canônico `ollama-windows:default` com um backup. `baseUrl` nesse arquivo é ruído de compatibilidade e deve ser movido para a configuração do provedor.
  </Accordion>
  <Accordion title="Escopo de embeddings de memória">
    Quando o Ollama é usado para embeddings de memória, a autenticação bearer fica restrita ao host em que foi declarada:

    - Uma chave em nível de provedor é enviada somente para o host Ollama desse provedor.
    - `agents.*.memorySearch.remote.apiKey` é enviada somente para seu host remoto de embeddings.
    - Um valor de env puro `OLLAMA_API_KEY` é tratado como a convenção do Ollama Cloud, não enviado por padrão para hosts locais ou auto-hospedados.

  </Accordion>
</AccordionGroup>

## Primeiros passos

Escolha seu método de configuração e modo preferidos.

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Ideal para:** o caminho mais rápido para uma configuração Ollama em nuvem ou local funcionando.

    <Steps>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard
        ```

        Selecione **Ollama** na lista de provedores.
      </Step>
      <Step title="Escolha seu modo">
        - **Nuvem + Local** — host Ollama local mais modelos em nuvem roteados por esse host
        - **Somente nuvem** — modelos Ollama hospedados via `https://ollama.com`
        - **Somente local** — somente modelos locais

      </Step>
      <Step title="Selecione um modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` e sugere padrões de nuvem hospedada. `Cloud + Local` e `Local only` pedem uma URL base do Ollama, descobrem modelos disponíveis e fazem o pull automático do modelo local selecionado se ele ainda não estiver disponível. Quando o Ollama informa uma tag `:latest` instalada, como `gemma4:latest`, a configuração mostra esse modelo instalado uma vez, em vez de mostrar `gemma4` e `gemma4:latest` ou fazer pull do alias simples novamente. `Cloud + Local` também verifica se esse host Ollama está conectado para acesso à nuvem.
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

    Opcionalmente, especifique uma URL base ou modelo personalizado:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configuração manual">
    **Ideal para:** controle total sobre a configuração em nuvem ou local.

    <Steps>
      <Step title="Escolha nuvem ou local">
        - **Nuvem + Local**: instale o Ollama, entre com `ollama signin` e roteie solicitações em nuvem por esse host
        - **Somente nuvem**: use `https://ollama.com` com uma `OLLAMA_API_KEY`
        - **Somente local**: instale o Ollama de [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Faça pull de um modelo local (somente local)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Habilite o Ollama para o OpenClaw">
        Para `Cloud only`, use sua `OLLAMA_API_KEY` real. Para configurações apoiadas por host, qualquer valor de placeholder funciona:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
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

## Modelos em nuvem

<Tabs>
  <Tab title="Nuvem + Local">
    `Cloud + Local` usa um host Ollama acessível como ponto de controle para modelos locais e em nuvem. Este é o fluxo híbrido preferido do Ollama.

    Use **Nuvem + Local** durante a configuração. O OpenClaw solicita a URL base do Ollama, descobre modelos locais desse host e verifica se o host está conectado para acesso à nuvem com `ollama signin`. Quando o host está conectado, o OpenClaw também sugere padrões de nuvem hospedada, como `kimi-k2.5:cloud`, `minimax-m2.7:cloud` e `glm-5.1:cloud`.

    Se o host ainda não estiver conectado, o OpenClaw mantém a configuração somente local até você executar `ollama signin`.

  </Tab>

  <Tab title="Somente nuvem">
    `Cloud only` roda contra a API hospedada do Ollama em `https://ollama.com`.

    Use **Somente nuvem** durante a configuração. O OpenClaw solicita `OLLAMA_API_KEY`, define `baseUrl: "https://ollama.com"` e inicializa a lista de modelos de nuvem hospedada. Esse caminho **não** exige um servidor Ollama local nem `ollama signin`.

    A lista de modelos em nuvem mostrada durante `openclaw onboard` é preenchida ao vivo a partir de `https://ollama.com/api/tags`, limitada a 500 entradas, então o seletor reflete o catálogo hospedado atual em vez de uma semente estática. Se `ollama.com` estiver inacessível ou não retornar modelos no momento da configuração, o OpenClaw recorre às sugestões hardcoded anteriores para que o onboarding ainda seja concluído.

  </Tab>

  <Tab title="Somente local">
    No modo somente local, o OpenClaw descobre modelos da instância Ollama configurada. Esse caminho é para servidores Ollama locais ou auto-hospedados.

    Atualmente, o OpenClaw sugere `gemma4` como padrão local.

  </Tab>
</Tabs>

## Descoberta de modelos (provedor implícito)

Quando você define `OLLAMA_API_KEY` (ou um perfil de autenticação) e **não** define `models.providers.ollama` nem outro provedor remoto personalizado com `api: "ollama"`, o OpenClaw descobre modelos da instância local do Ollama em `http://127.0.0.1:11434`.

| Comportamento        | Detalhe                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta ao catálogo | Consulta `/api/tags`                                                                                                                                                |
| Detecção de capacidade | Usa consultas best-effort a `/api/show` para ler `contextWindow`, parâmetros `num_ctx` expandidos do Modelfile e capacidades incluindo visão/ferramentas           |
| Modelos de visão     | Modelos com uma capacidade `vision` relatada por `/api/show` são marcados como compatíveis com imagem (`input: ["text", "image"]`), então o OpenClaw injeta imagens automaticamente no prompt |
| Detecção de raciocínio | Usa capacidades de `/api/show` quando disponíveis, incluindo `thinking`; recorre a uma heurística pelo nome do modelo (`r1`, `reasoning`, `think`) quando o Ollama omite capacidades |
| Limites de tokens    | Define `maxTokens` para o limite padrão máximo de tokens do Ollama usado pelo OpenClaw                                                                               |
| Custos               | Define todos os custos como `0`                                                                                                                                     |

Isso evita entradas manuais de modelo enquanto mantém o catálogo alinhado com a instância local do Ollama. Você pode usar uma referência completa, como `ollama/<pulled-model>:latest`, no `infer model run` local; o OpenClaw resolve esse modelo instalado a partir do catálogo ao vivo do Ollama sem exigir uma entrada `models.json` escrita manualmente.

Para hosts Ollama conectados, alguns modelos `:cloud` podem ser utilizáveis por meio de `/api/chat`
e `/api/show` antes de aparecerem em `/api/tags`. Quando você seleciona explicitamente uma
referência completa `ollama/<model>:cloud`, o OpenClaw valida esse modelo ausente exato com
`/api/show` e o adiciona ao catálogo de runtime somente se o Ollama confirmar os
metadados do modelo. Erros de digitação ainda falham como modelos desconhecidos em vez de serem criados automaticamente.

```bash
# See what models are available
ollama list
openclaw models list
```

Para um teste smoke restrito de geração de texto que evita toda a superfície de ferramentas do agente,
use `infer model run` local com uma referência completa de modelo Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Esse caminho ainda usa o provedor configurado, a autenticação e o transporte nativo do Ollama
do OpenClaw, mas não inicia um turno de agente de chat nem carrega contexto MCP/de ferramentas. Se
isso tiver sucesso enquanto respostas normais do agente falham, investigue em seguida a capacidade de
prompt/ferramentas de agente do modelo.

Para um teste smoke restrito de modelo de visão no mesmo caminho enxuto, adicione um ou mais
arquivos de imagem ao `infer model run`. Isso envia o prompt e a imagem diretamente para
o modelo de visão Ollama selecionado sem carregar ferramentas de chat, memória ou contexto
de sessão anterior:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` aceita arquivos detectados como `image/*`, incluindo entradas comuns PNG,
JPEG e WebP. Arquivos que não são imagem são rejeitados antes que o Ollama seja chamado.
Para reconhecimento de fala, use `openclaw infer audio transcribe`.

Quando você troca uma conversa com `/model ollama/<model>`, o OpenClaw trata
isso como uma seleção exata do usuário. Se o `baseUrl` configurado do Ollama estiver
inacessível, a próxima resposta falha com o erro do provedor em vez de responder silenciosamente
a partir de outro modelo de fallback configurado.

Trabalhos Cron isolados fazem uma verificação de segurança local extra antes de iniciarem o
turno do agente. Se o modelo selecionado resolver para um provedor Ollama local, de rede privada ou `.local`
e `/api/tags` estiver inacessível, o OpenClaw registra essa execução Cron
como `skipped` com o `ollama/<model>` selecionado no texto do erro. O preflight
do endpoint fica em cache por 5 minutos, então vários trabalhos Cron apontados para o mesmo
daemon Ollama parado não disparam todos solicitações de modelo com falha.

Verifique ao vivo o caminho de texto local, o caminho de stream nativo e os embeddings contra
o Ollama local com:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para adicionar um novo modelo, basta puxá-lo com o Ollama:

```bash
ollama pull mistral
```

O novo modelo será descoberto automaticamente e ficará disponível para uso.

<Note>
Se você definir `models.providers.ollama` explicitamente, ou configurar um provedor remoto personalizado como `models.providers.ollama-cloud` com `api: "ollama"`, a descoberta automática será ignorada e você precisará definir os modelos manualmente. Provedores personalizados de loopback, como `http://127.0.0.2:11434`, ainda são tratados como locais. Veja a seção de configuração explícita abaixo.
</Note>

## Visão e descrição de imagem

O Plugin Ollama incluído registra o Ollama como um provedor de compreensão de mídia com suporte a imagens. Isso permite que o OpenClaw encaminhe solicitações explícitas de descrição de imagem e padrões configurados de modelos de imagem por meio de modelos de visão Ollama locais ou hospedados.

Para visão local, puxe um modelo compatível com imagens:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Em seguida, verifique com a CLI de inferência:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` deve ser uma referência completa `<provider/model>`. Quando definido, `openclaw infer image describe` executa esse modelo diretamente em vez de ignorar a descrição porque o modelo oferece suporte nativo a visão.

Use `infer image describe` quando quiser o fluxo de provedor de compreensão de imagens do OpenClaw, o `agents.defaults.imageModel` configurado e o formato de saída de descrição de imagem. Use `infer model run --file` quando quiser uma sondagem multimodal bruta do modelo com um prompt personalizado e uma ou mais imagens.

Para tornar o Ollama o modelo padrão de compreensão de imagens para mídia recebida, configure `agents.defaults.imageModel`:

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

Prefira a referência completa `ollama/<model>`. Se o mesmo modelo estiver listado em `models.providers.ollama.models` com `input: ["text", "image"]` e nenhum outro provedor de imagens configurado expuser esse ID de modelo simples, o OpenClaw também normaliza uma referência `imageModel` simples, como `qwen2.5vl:7b`, para `ollama/qwen2.5vl:7b`. Se mais de um provedor de imagens configurado tiver o mesmo ID simples, use explicitamente o prefixo do provedor.

Modelos de visão locais lentos podem precisar de um timeout de compreensão de imagem maior do que modelos em nuvem. Eles também podem travar ou parar quando o Ollama tenta alocar todo o contexto de visão anunciado em hardware limitado. Defina um timeout de capacidade e limite `num_ctx` na entrada do modelo quando você só precisar de um turno normal de descrição de imagem:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

Esse timeout se aplica à compreensão de imagens recebidas e à ferramenta explícita `image` que o agente pode chamar durante um turno. `models.providers.ollama.timeoutSeconds` no nível do provedor ainda controla a proteção da solicitação HTTP subjacente ao Ollama para chamadas normais de modelo.

Verifique ao vivo a ferramenta explícita de imagem contra o Ollama local com:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Se você definir `models.providers.ollama.models` manualmente, marque os modelos de visão com suporte a entrada de imagem:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

O OpenClaw rejeita solicitações de descrição de imagem para modelos que não estejam marcados como compatíveis com imagens. Com a descoberta implícita, o OpenClaw lê isso do Ollama quando `/api/show` relata uma capacidade de visão.

## Configuração

<Tabs>
  <Tab title="Basic (implicit discovery)">
    O caminho mais simples de ativação somente local é por variável de ambiente:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` estiver definido, você pode omitir `apiKey` na entrada do provedor e o OpenClaw o preencherá para verificações de disponibilidade.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Use configuração explícita quando quiser uma configuração em nuvem hospedada, quando o Ollama rodar em outro host/porta, quando quiser forçar janelas de contexto ou listas de modelos específicas, ou quando quiser definições de modelos totalmente manuais.

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

  <Tab title="Custom base URL">
    Se o Ollama estiver rodando em um host ou porta diferente (a configuração explícita desativa a descoberta automática, então defina os modelos manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Não adicione `/v1` à URL. O caminho `/v1` usa o modo compatível com OpenAI, no qual chamadas de ferramentas não são confiáveis. Use a URL base do Ollama sem sufixo de caminho.
    </Warning>

  </Tab>
</Tabs>

## Receitas comuns

Use estas como pontos de partida e substitua os IDs de modelo pelos nomes exatos de `ollama list` ou `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Use isto quando o Ollama roda na mesma máquina que o Gateway e você quer que o OpenClaw descubra automaticamente os modelos instalados.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Esse caminho mantém a configuração mínima. Não adicione um bloco `models.providers.ollama` a menos que queira definir modelos manualmente.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    Use URLs nativas do Ollama para hosts de LAN. Não adicione `/v1`.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` é o orçamento de contexto no lado do OpenClaw. `params.num_ctx` é enviado ao Ollama para a solicitação. Mantenha-os alinhados quando seu hardware não conseguir rodar o contexto completo anunciado do modelo.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Use isto quando você não roda um daemon local e quer usar modelos Ollama hospedados diretamente.

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

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
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
    Use isto quando um daemon Ollama local ou em LAN estiver conectado com `ollama signin` e deve servir tanto modelos locais quanto modelos `:cloud`.

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Multiple Ollama hosts">
    Use IDs de provedores personalizados quando tiver mais de um servidor Ollama. Cada provedor recebe seu próprio host, modelos, autenticação, timeout e referências de modelo.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    Quando o OpenClaw envia a solicitação, o prefixo do provedor ativo é removido para que `ollama-large/qwen3.5:27b` chegue ao Ollama como `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    Alguns modelos locais conseguem responder a prompts simples, mas têm dificuldade com toda a superfície de ferramentas do agente. Comece limitando ferramentas e contexto antes de alterar configurações globais de runtime.

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    Use `compat.supportsTools: false` only when the model or server reliably fails on tool schemas. It trades agent capability for stability.
    `localModelLean` removes the browser, cron, and message tools from the agent surface, but it does not change Ollama's runtime context or thinking mode. Pair it with explicit `params.num_ctx` and `params.thinking: false` for small Qwen-style thinking models that loop or spend their response budget on hidden reasoning.

  </Accordion>
</AccordionGroup>

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

IDs personalizados de provedores Ollama também são compatíveis. Quando uma referência de modelo usa o prefixo do provedor ativo, como `ollama-spark/qwen3:32b`, o OpenClaw remove apenas esse prefixo antes de chamar o Ollama, para que o servidor receba `qwen3:32b`.

Para modelos locais lentos, prefira o ajuste de requisições no escopo do provedor antes de aumentar o tempo limite de runtime do agente inteiro:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` se aplica à requisição HTTP do modelo, incluindo a configuração da conexão, cabeçalhos, streaming do corpo e o aborto total do fetch protegido. `params.keep_alive` é encaminhado ao Ollama como `keep_alive` de nível superior em requisições nativas de `/api/chat`; defina-o por modelo quando o tempo de carregamento no primeiro turno for o gargalo.

### Verificação rápida

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Para hosts remotos, substitua `127.0.0.1` pelo host usado em `baseUrl`. Se `curl` funcionar, mas o OpenClaw não, verifique se o Gateway é executado em outra máquina, contêiner ou conta de serviço.

## Pesquisa na Web do Ollama

O OpenClaw oferece suporte a **Pesquisa na Web do Ollama** como um provedor `web_search` incluído.

| Propriedade | Detalhe                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa o host Ollama configurado (`models.providers.ollama.baseUrl` quando definido; caso contrário, `http://127.0.0.1:11434`); `https://ollama.com` usa diretamente a API hospedada |
| Auth        | Sem chave para hosts Ollama locais autenticados; `OLLAMA_API_KEY` ou autenticação de provedor configurada para pesquisa direta em `https://ollama.com` ou hosts protegidos por autenticação |
| Requisito   | Hosts locais/auto-hospedados devem estar em execução e autenticados com `ollama signin`; a pesquisa hospedada direta exige `baseUrl: "https://ollama.com"` mais uma chave de API Ollama real |

Escolha **Pesquisa na Web do Ollama** durante `openclaw onboard` ou `openclaw configure --section web`, ou defina:

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

Para pesquisa hospedada direta pelo Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

Para um daemon local autenticado, o OpenClaw usa o proxy `/api/experimental/web_search` do daemon. Para `https://ollama.com`, ele chama diretamente o endpoint hospedado `/api/web_search`.

<Note>
Para a configuração completa e os detalhes de comportamento, consulte [Pesquisa na Web do Ollama](/pt-BR/tools/ollama-search).
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **A chamada de ferramentas não é confiável no modo compatível com OpenAI.** Use este modo apenas se você precisar do formato OpenAI para um proxy e não depender do comportamento nativo de chamada de ferramentas.
    </Warning>

    Se você precisar usar o endpoint compatível com OpenAI em vez disso (por exemplo, por trás de um proxy que só aceita o formato OpenAI), defina `api: "openai-completions"` explicitamente:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Este modo pode não oferecer suporte a streaming e chamada de ferramentas simultaneamente. Talvez você precise desativar o streaming com `params: { streaming: false }` na configuração do modelo.

    Quando `api: "openai-completions"` é usado com Ollama, o OpenClaw injeta `options.num_ctx` por padrão para que o Ollama não recue silenciosamente para uma janela de contexto de 4096. Se o seu proxy/upstream rejeitar campos `options` desconhecidos, desative este comportamento:

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

  <Accordion title="Context windows">
    Para modelos descobertos automaticamente, o OpenClaw usa a janela de contexto informada pelo Ollama quando disponível, incluindo valores maiores de `PARAMETER num_ctx` de Modelfiles personalizados. Caso contrário, ele recorre à janela de contexto padrão do Ollama usada pelo OpenClaw.

    Você pode definir padrões `contextWindow`, `contextTokens` e `maxTokens` no nível do provedor para todos os modelos sob esse provedor Ollama e, em seguida, substituí-los por modelo quando necessário. `contextWindow` é o orçamento de prompt e Compaction do OpenClaw. Requisições nativas do Ollama deixam `options.num_ctx` indefinido, a menos que você configure explicitamente `params.num_ctx`, para que o Ollama possa aplicar seu próprio padrão baseado no modelo, em `OLLAMA_CONTEXT_LENGTH` ou em VRAM. Para limitar ou forçar o contexto de runtime por requisição do Ollama sem reconstruir um Modelfile, defina `params.num_ctx`; valores inválidos, zero, negativos e não finitos são ignorados. O adaptador Ollama compatível com OpenAI ainda injeta `options.num_ctx` por padrão a partir do `params.num_ctx` ou `contextWindow` configurado; desative isso com `injectNumCtxForOpenAICompat: false` se o seu upstream rejeitar `options`.

    Entradas de modelos Ollama nativas também aceitam as opções comuns de runtime do Ollama em `params`, incluindo `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` e `use_mmap`. O OpenClaw encaminha apenas chaves de requisição do Ollama, portanto parâmetros de runtime do OpenClaw, como `streaming`, não vazam para o Ollama. Use `params.think` ou `params.thinking` para enviar `think` de nível superior do Ollama; `false` desativa o thinking no nível da API para modelos de thinking no estilo Qwen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    `agents.defaults.models["ollama/<model>"].params.num_ctx` por modelo também funciona. Se ambos estiverem configurados, a entrada explícita de modelo do provedor vence o padrão do agente.

  </Accordion>

  <Accordion title="Thinking control">
    Para modelos Ollama nativos, o OpenClaw encaminha o controle de thinking como o Ollama espera: `think` de nível superior, não `options.think`. Modelos descobertos automaticamente cuja resposta de `/api/show` inclui o recurso `thinking` expõem `/think low`, `/think medium`, `/think high` e `/think max`; modelos sem thinking expõem apenas `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Você também pode definir um padrão de modelo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    `params.think` ou `params.thinking` por modelo pode desativar ou forçar o thinking da API Ollama para um modelo configurado específico. O OpenClaw preserva esses parâmetros explícitos do modelo quando a execução ativa tem apenas o padrão implícito `off`; comandos de runtime diferentes de off, como `/think medium`, ainda substituem a execução ativa.

  </Accordion>

  <Accordion title="Reasoning models">
    O OpenClaw trata modelos com nomes como `deepseek-r1`, `reasoning` ou `think` como capazes de raciocínio por padrão.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Nenhuma configuração adicional é necessária. O OpenClaw os marca automaticamente.

  </Accordion>

  <Accordion title="Model costs">
    O Ollama é gratuito e roda localmente, portanto todos os custos dos modelos são definidos como US$ 0. Isso se aplica tanto a modelos descobertos automaticamente quanto a modelos definidos manualmente.
  </Accordion>

  <Accordion title="Memory embeddings">
    O Plugin Ollama incluído registra um provedor de embeddings de memória para
    [pesquisa de memória](/pt-BR/concepts/memory). Ele usa a URL base do Ollama
    e a chave de API configuradas, chama o endpoint atual `/api/embed` do Ollama e agrupa
    vários blocos de memória em uma requisição `input` quando possível.

    | Propriedade    | Valor               |
    | --------------- | ------------------- |
    | Modelo padrão   | `nomic-embed-text`  |
    | Pull automático | Sim — o modelo de embedding é baixado automaticamente se não estiver presente localmente |

    Embeddings em tempo de consulta usam prefixos de recuperação para modelos que os exigem ou recomendam, incluindo `nomic-embed-text`, `qwen3-embedding` e `mxbai-embed-large`. Lotes de documentos de memória permanecem brutos para que índices existentes não precisem de uma migração de formato.

    Para selecionar o Ollama como o provedor de embedding de pesquisa de memória:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Para um host de embedding remoto, mantenha a autenticação no escopo desse host:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuração de streaming">
    A integração do OpenClaw com o Ollama usa a **API nativa do Ollama** (`/api/chat`) por padrão, que oferece suporte completo a streaming e chamada de ferramentas simultaneamente. Nenhuma configuração especial é necessária.

    Para solicitações nativas de `/api/chat`, o OpenClaw também encaminha o controle de raciocínio diretamente ao Ollama: `/think off` e `openclaw agent --thinking off` enviam `think: false` no nível superior, a menos que um valor explícito de modelo `params.think`/`params.thinking` esteja configurado, enquanto `/think low|medium|high` enviam a string de esforço `think` correspondente no nível superior. `/think max` é mapeado para o maior esforço nativo do Ollama, `think: "high"`.

    <Tip>
    Se você precisar usar o endpoint compatível com OpenAI, consulte a seção "Modo legado compatível com OpenAI" acima. Streaming e chamada de ferramentas podem não funcionar simultaneamente nesse modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Loop de falha no WSL2 (reinicializações repetidas)">
    No WSL2 com NVIDIA/CUDA, o instalador oficial do Ollama para Linux cria uma unidade systemd `ollama.service` com `Restart=always`. Se esse serviço iniciar automaticamente e carregar um modelo com GPU durante a inicialização do WSL2, o Ollama pode manter memória do host fixada enquanto o modelo carrega. A recuperação de memória do Hyper-V nem sempre consegue recuperar essas páginas fixadas, então o Windows pode encerrar a VM WSL2, o systemd inicia o Ollama novamente, e o loop se repete.

    Evidências comuns:

    - reinicializações ou encerramentos repetidos do WSL2 pelo lado do Windows
    - CPU alta em `app.slice` ou `ollama.service` pouco depois da inicialização do WSL2
    - SIGTERM do systemd em vez de um evento do OOM-killer do Linux

    O OpenClaw registra um aviso de inicialização quando detecta WSL2, `ollama.service` habilitado com `Restart=always` e marcadores CUDA visíveis.

    Mitigação:

    ```bash
    sudo systemctl disable ollama
    ```

    Adicione isto a `%USERPROFILE%\.wslconfig` no lado do Windows, depois execute `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Defina um keep-alive mais curto no ambiente do serviço do Ollama ou inicie o Ollama manualmente apenas quando precisar dele:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulte [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama não detectado">
    Certifique-se de que o Ollama esteja em execução, que você tenha definido `OLLAMA_API_KEY` (ou um perfil de autenticação) e que você **não** tenha definido uma entrada explícita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifique se a API está acessível:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Nenhum modelo disponível">
    Se o seu modelo não estiver listado, baixe o modelo localmente ou defina-o explicitamente em `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Conexão recusada">
    Verifique se o Ollama está em execução na porta correta:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Host remoto funciona com curl, mas não com OpenClaw">
    Verifique a partir da mesma máquina e do mesmo runtime que executam o Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causas comuns:

    - `baseUrl` aponta para `localhost`, mas o Gateway é executado no Docker ou em outro host.
    - A URL usa `/v1`, o que seleciona o comportamento compatível com OpenAI em vez do Ollama nativo.
    - O host remoto precisa de alterações de firewall ou vinculação à LAN no lado do Ollama.
    - O modelo está presente no daemon do seu laptop, mas não no daemon remoto.

  </Accordion>

  <Accordion title="Modelo gera JSON de ferramenta como texto">
    Isso geralmente significa que o provedor está usando o modo compatível com OpenAI ou que o modelo não consegue lidar com esquemas de ferramentas.

    Prefira o modo nativo do Ollama:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    Se um modelo local pequeno ainda falhar em esquemas de ferramentas, defina `compat.supportsTools: false` nessa entrada de modelo e teste novamente.

  </Accordion>

  <Accordion title="Kimi ou GLM retorna símbolos ilegíveis">
    Respostas hospedadas do Kimi/GLM que são longas sequências de símbolos não linguísticos são tratadas como saída de provedor com falha, em vez de uma resposta bem-sucedida do assistente. Isso permite que a repetição normal, fallback ou tratamento de erro assuma sem persistir o texto corrompido na sessão.

    Se isso acontecer repetidamente, capture o nome bruto do modelo, o arquivo da sessão atual e se a execução usou `Cloud + Local` ou `Cloud only`; depois, tente uma sessão nova e um modelo de fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Modelo local frio atinge o tempo limite">
    Modelos locais grandes podem precisar de um primeiro carregamento longo antes que o streaming comece. Mantenha o tempo limite restrito ao provedor Ollama e, opcionalmente, peça ao Ollama para manter o modelo carregado entre turnos:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Se o próprio host demora para aceitar conexões, `timeoutSeconds` também estende o tempo limite protegido de conexão do Undici para este provedor.

  </Accordion>

  <Accordion title="Modelo de contexto grande é lento demais ou fica sem memória">
    Muitos modelos do Ollama anunciam contextos maiores do que seu hardware consegue executar confortavelmente. O Ollama nativo usa o padrão de contexto do próprio runtime do Ollama, a menos que você defina `params.num_ctx`. Limite tanto o orçamento do OpenClaw quanto o contexto de solicitação do Ollama quando quiser latência previsível até o primeiro token:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    Reduza `contextWindow` primeiro se o OpenClaw estiver enviando prompt demais. Reduza `params.num_ctx` se o Ollama estiver carregando um contexto de runtime grande demais para a máquina. Reduza `maxTokens` se a geração estiver demorando demais.

  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Ollama Web Search" href="/pt-BR/tools/ollama-search" icon="magnifying-glass">
    Configuração completa e detalhes de comportamento para busca na web baseada no Ollama.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
</CardGroup>
