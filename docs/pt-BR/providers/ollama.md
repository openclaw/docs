---
read_when:
    - Você quer executar o OpenClaw com modelos na nuvem ou locais via Ollama
    - Você precisa de orientações de instalação e configuração do Ollama
    - Você quer modelos de visão do Ollama para compreensão de imagens
summary: Execute o OpenClaw com Ollama (modelos em nuvem e locais)
title: Ollama
x-i18n:
    generated_at: "2026-07-03T09:28:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw se integra à API nativa do Ollama (`/api/chat`) para modelos em nuvem hospedados e servidores Ollama locais/auto-hospedados. Você pode usar o Ollama em três modos: `Cloud + Local` por meio de um host Ollama acessível, `Cloud only` contra `https://ollama.com` ou `Local only` contra um host Ollama acessível.

OpenClaw também registra `ollama-cloud` como um id de provedor hospedado de primeira classe para
uso direto do Ollama Cloud. Use refs como `ollama-cloud/kimi-k2.5:cloud` quando você
quiser roteamento somente na nuvem sem compartilhar o id do provedor local `ollama`.

Para a página dedicada de configuração somente na nuvem, consulte [Ollama Cloud](/pt-BR/providers/ollama-cloud).

<Warning>
**Usuários de Ollama remoto**: Não use a URL compatível com OpenAI `/v1` (`http://host:11434/v1`) com OpenClaw. Isso quebra a chamada de ferramentas e os modelos podem gerar JSON bruto de ferramentas como texto simples. Use a URL da API nativa do Ollama em vez disso: `baseUrl: "http://host:11434"` (sem `/v1`).
</Warning>

A configuração do provedor Ollama usa `baseUrl` como chave canônica. OpenClaw também aceita `baseURL` para compatibilidade com exemplos no estilo do SDK da OpenAI, mas novas configurações devem preferir `baseUrl`.

## Regras de autenticação

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    Hosts Ollama locais e em LAN não precisam de um token bearer real. OpenClaw usa o marcador local `ollama-local` apenas para URLs base do Ollama de loopback, rede privada, `.local` e nomes de host simples.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    Hosts públicos remotos e Ollama Cloud (`https://ollama.com`) exigem uma credencial real por meio de `OLLAMA_API_KEY`, um perfil de autenticação ou o `apiKey` do provedor. Para uso hospedado direto, prefira o provedor `ollama-cloud`.
  </Accordion>
  <Accordion title="Custom provider ids">
    Ids de provedor personalizados que definem `api: "ollama"` seguem as mesmas regras. Por exemplo, um provedor `ollama-remote` que aponta para um host Ollama em uma LAN privada pode usar `apiKey: "ollama-local"` e subagentes resolverão esse marcador por meio do hook do provedor Ollama em vez de tratá-lo como uma credencial ausente. A busca de memória também pode definir `agents.defaults.memorySearch.provider` para esse id de provedor personalizado, para que os embeddings usem o endpoint Ollama correspondente.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` armazena a credencial para um id de provedor. Coloque configurações de endpoint (`baseUrl`, `api`, ids de modelo, cabeçalhos, tempos limite) em `models.providers.<id>`. Arquivos antigos de perfil de autenticação planos, como `{ "ollama-windows": { "apiKey": "ollama-local" } }`, não são um formato de runtime; execute `openclaw doctor --fix` para reescrevê-los para o perfil de chave de API canônico `ollama-windows:default` com um backup. `baseUrl` nesse arquivo é ruído de compatibilidade e deve ser movido para a configuração do provedor.
  </Accordion>
  <Accordion title="Memory embedding scope">
    Quando o Ollama é usado para embeddings de memória, a autenticação bearer é escopada ao host onde foi declarada:

    - Uma chave no nível do provedor é enviada somente para o host Ollama desse provedor.
    - `agents.*.memorySearch.remote.apiKey` é enviado somente para seu host remoto de embeddings.
    - Um valor de env puro `OLLAMA_API_KEY` é tratado como a convenção do Ollama Cloud, não enviado por padrão a hosts locais ou auto-hospedados.

  </Accordion>
</AccordionGroup>

## Primeiros passos

Escolha seu método e modo de configuração preferidos.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Ideal para:** caminho mais rápido para uma configuração Ollama em nuvem ou local funcional.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        Selecione **Ollama** na lista de provedores.
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — host Ollama local mais modelos em nuvem roteados por esse host
        - **Cloud only** — modelos Ollama hospedados via `https://ollama.com`
        - **Local only** — somente modelos locais

      </Step>
      <Step title="Select a model">
        `Cloud only` solicita `OLLAMA_API_KEY` e sugere padrões hospedados em nuvem. `Cloud + Local` e `Local only` pedem uma URL base do Ollama, descobrem modelos disponíveis e fazem pull automático do modelo local selecionado se ele ainda não estiver disponível. Quando o Ollama relata uma tag `:latest` instalada, como `gemma4:latest`, a configuração mostra esse modelo instalado uma vez em vez de mostrar tanto `gemma4` quanto `gemma4:latest` ou fazer pull do alias simples novamente. `Cloud + Local` também verifica se esse host Ollama está conectado para acesso à nuvem.
      </Step>
      <Step title="Verify the model is available">
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

  <Tab title="Manual setup">
    **Ideal para:** controle total sobre configuração em nuvem ou local.

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local**: instale o Ollama, entre com `ollama signin` e roteie solicitações em nuvem por esse host
        - **Cloud only**: use `https://ollama.com` com uma `OLLAMA_API_KEY`
        - **Local only**: instale o Ollama de [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        Para `Cloud only`, use sua `OLLAMA_API_KEY` real. Para configurações baseadas em host, qualquer valor de placeholder funciona:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
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
    `Cloud + Local` usa um host Ollama acessível como ponto de controle para modelos locais e em nuvem. Este é o fluxo híbrido preferido do Ollama.

    Use **Cloud + Local** durante a configuração. OpenClaw solicita a URL base do Ollama, descobre modelos locais desse host e verifica se o host está conectado para acesso à nuvem com `ollama signin`. Quando o host está conectado, OpenClaw também sugere padrões hospedados em nuvem, como `kimi-k2.5:cloud`, `minimax-m2.7:cloud` e `glm-5.1:cloud`.

    Se o host ainda não estiver conectado, OpenClaw mantém a configuração somente local até você executar `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` executa contra a API hospedada do Ollama em `https://ollama.com`.

    Use **Cloud only** durante a configuração. OpenClaw solicita `OLLAMA_API_KEY`, define `baseUrl: "https://ollama.com"` e inicializa a lista de modelos hospedados em nuvem. Esse caminho **não** exige um servidor Ollama local nem `ollama signin`.

    A lista de modelos em nuvem mostrada durante `openclaw onboard` é preenchida ao vivo a partir de `https://ollama.com/api/tags`, limitada a 500 entradas, de modo que o seletor reflita o catálogo hospedado atual em vez de uma semente estática. Se `ollama.com` estiver inacessível ou não retornar modelos no momento da configuração, OpenClaw volta para as sugestões fixas anteriores para que o onboarding ainda seja concluído.

    Você também pode configurar diretamente o provedor de nuvem de primeira classe:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    No modo somente local, OpenClaw descobre modelos da instância Ollama configurada. Esse caminho é para servidores Ollama locais ou auto-hospedados.

    OpenClaw atualmente sugere `gemma4` como o padrão local.

  </Tab>
</Tabs>

## Descoberta de modelos (provedor implícito)

Quando você define `OLLAMA_API_KEY` (ou um perfil de autenticação) e **não** define `models.providers.ollama` ou outro provedor remoto personalizado com `api: "ollama"`, OpenClaw descobre modelos da instância Ollama local em `http://127.0.0.1:11434`.

| Comportamento        | Detalhe                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta de catálogo | Consulta `/api/tags`                                                                                                                                                |
| Detecção de capacidades | Usa consultas best-effort a `/api/show` para ler `contextWindow`, parâmetros `num_ctx` expandidos do Modelfile e capacidades, incluindo visão/ferramentas          |
| Modelos de visão     | Modelos com uma capacidade `vision` relatada por `/api/show` são marcados como compatíveis com imagem (`input: ["text", "image"]`), então OpenClaw injeta imagens automaticamente no prompt |
| Detecção de raciocínio | Usa capacidades de `/api/show` quando disponíveis, incluindo `thinking`; recorre a uma heurística de nome de modelo (`r1`, `reasoning`, `think`) quando o Ollama omite capacidades |
| Limites de tokens    | Define `maxTokens` para o limite padrão de tokens máximos do Ollama usado pelo OpenClaw                                                                              |
| Custos               | Define todos os custos como `0`                                                                                                                                      |

Isso evita entradas manuais de modelos enquanto mantém o catálogo alinhado com a instância Ollama local. Você pode usar uma ref completa, como `ollama/<pulled-model>:latest`, em `infer model run` local; OpenClaw resolve esse modelo instalado a partir do catálogo ativo do Ollama sem exigir uma entrada `models.json` escrita manualmente.

Para hosts Ollama conectados, alguns modelos `:cloud` podem ser utilizáveis por meio de `/api/chat`
e `/api/show` antes de aparecerem em `/api/tags`. Quando você seleciona explicitamente uma
ref completa `ollama/<model>:cloud`, OpenClaw valida esse modelo ausente exato com
`/api/show` e o adiciona ao catálogo de runtime somente se o Ollama confirmar metadados
do modelo. Erros de digitação ainda falham como modelos desconhecidos em vez de serem criados automaticamente.

```bash
# See what models are available
ollama list
openclaw models list
```

Para um smoke test estreito de geração de texto que evita toda a superfície de ferramentas do agente,
use `infer model run` local com uma ref completa de modelo Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Esse caminho ainda usa o provedor configurado, a autenticação e o transporte nativo do Ollama
do OpenClaw, mas não inicia uma rodada de agente de chat nem carrega contexto de MCP/ferramentas. Se
isso for bem-sucedido enquanto respostas normais do agente falham, investigue em seguida a capacidade de prompt/ferramentas
do agente do modelo.

Para um smoke test estreito de modelo de visão no mesmo caminho enxuto, adicione um ou mais
arquivos de imagem a `infer model run`. Isso envia o prompt e a imagem diretamente para
o modelo de visão Ollama selecionado sem carregar ferramentas de chat, memória ou contexto de
sessão anterior:

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
JPEG e WebP. Arquivos que não são imagens são rejeitados antes que Ollama seja chamado.
Para reconhecimento de fala, use `openclaw infer audio transcribe`.

Quando você troca uma conversa com `/model ollama/<model>`, o OpenClaw trata
isso como uma seleção exata do usuário. Se o `baseUrl` configurado do Ollama
estiver inacessível, a próxima resposta falhará com o erro do provedor em vez de
responder silenciosamente a partir de outro modelo fallback configurado.

Tarefas cron isoladas fazem uma verificação de segurança local extra antes de
iniciar o turno do agente. Se o modelo selecionado resolver para um provedor
Ollama local, de rede privada ou `.local` e `/api/tags` estiver inacessível, o
OpenClaw registra essa execução cron como `skipped` com o `ollama/<model>`
selecionado no texto do erro. O preflight do endpoint fica em cache por 5 minutos,
portanto várias tarefas cron apontadas para o mesmo daemon Ollama parado não
disparam todas solicitações de modelo que falhariam.

Verifique ao vivo o caminho de texto local, o caminho de stream nativo e os
embeddings contra o Ollama local com:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para testes smoke com chave de API do Ollama Cloud, aponte o teste ao vivo para
`https://ollama.com` e escolha um modelo hospedado no catálogo atual:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

O smoke da nuvem executa texto, stream nativo e busca na Web. Ele ignora
embeddings por padrão para `https://ollama.com` porque as chaves de API do
Ollama Cloud podem não autorizar `/api/embed`. Defina
`OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` quando você quiser explicitamente que o
teste ao vivo falhe se a chave de nuvem configurada não puder usar o endpoint de
embed.

Para adicionar um novo modelo, basta baixá-lo com o Ollama:

```bash
ollama pull mistral
```

O novo modelo será descoberto automaticamente e ficará disponível para uso.

<Note>
Se você definir `models.providers.ollama` explicitamente, ou configurar um provedor remoto personalizado como `models.providers.ollama-cloud` com `api: "ollama"`, a descoberta automática será ignorada e você precisará definir os modelos manualmente. Provedores personalizados de loopback como `http://127.0.0.2:11434` ainda são tratados como locais. Consulte a seção de configuração explícita abaixo.
</Note>

## Inferência local no Node

Agentes podem delegar uma tarefa curta a um modelo Ollama instalado em um node
de desktop ou servidor pareado. O prompt e a resposta atravessam a conexão
Gateway/node autenticada existente; a solicitação do modelo é executada no node
selecionado contra seu endpoint Ollama de loopback padrão
(`http://127.0.0.1:11434`).

<Steps>
  <Step title="Start Ollama on the node">
    Baixe pelo menos um modelo de chat e mantenha o Ollama em execução:

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="Connect the node host">
    Na mesma máquina que o Ollama, conecte um host de node ao Gateway:

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Aprove o novo dispositivo e os comandos de node declarados dele no host do Gateway,
    depois verifique o node:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Uma primeira conexão e uma atualização que adiciona os comandos do Ollama podem
    acionar a aprovação de comandos de node. Se o node se conectar sem anunciar
    `ollama.models` e `ollama.chat`, verifique `openclaw nodes pending` novamente.

  </Step>
  <Step title="Ask an agent to use local inference">
    O Plugin Ollama incluído expõe a ferramenta `node_inference`. Os agentes primeiro
    usam `action: "discover"`, depois `action: "run"` com um node e modelo retornados.
    Se exatamente um node capaz estiver conectado, `run` pode omitir o node.

    Por exemplo: “Descubra os modelos Ollama nos meus nodes e depois use o modelo
    carregado mais rápido para resumir este texto.”

  </Step>
</Steps>

A descoberta lê `/api/tags`, verifica capacidades de `/api/show` e usa `/api/ps`
quando disponível para classificar primeiro os modelos já carregados. Ela retorna
apenas modelos locais capazes de chat: linhas do Ollama Cloud e modelos somente
de embedding são excluídos. Cada execução pede ao Ollama para desativar o
pensamento do modelo e limita a saída a 512 tokens, a menos que a chamada de
ferramenta solicite um valor `maxTokens` diferente. Alguns modelos, como
GPT-OSS, não oferecem suporte à desativação de pensamento e ainda podem usar
tokens de raciocínio.

Para manter o Ollama em execução em um node sem disponibilizá-lo para agentes,
defina o seguinte na configuração usada por esse host de node:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Se o node usa o comando em primeiro plano `openclaw node run` da configuração
acima, pare esse processo e execute o comando novamente. Se ele usa um serviço de
node instalado, execute `openclaw node restart`.

O node deixa de anunciar `ollama.models` e `ollama.chat`; o próprio Ollama e o
provedor Ollama do Gateway permanecem inalterados. Defina o valor como `true` e
reinicie o node para anunciar a inferência local novamente. Uma superfície de
comandos alterada pode exigir aprovação por meio de `openclaw nodes pending`
após a reconexão.

Você pode verificar os mesmos comandos de node sem um turno de agente:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

A inferência local no Node intencionalmente não reutiliza um
`models.providers.ollama.baseUrl` remoto ou de nuvem. Inicie o Ollama no endpoint
de loopback padrão do node. Os comandos de node ficam disponíveis por padrão em
hosts de node macOS, Linux e Windows e continuam sujeitos à política normal de
pareamento de node e comandos.

## Visão e descrição de imagem

O Plugin Ollama incluído registra o Ollama como um provedor de compreensão de mídia com capacidade de imagem. Isso permite que o OpenClaw encaminhe solicitações explícitas de descrição de imagem e padrões configurados de modelo de imagem por meio de modelos de visão Ollama locais ou hospedados.

Para visão local, baixe um modelo com suporte a imagens:

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

`--model` deve ser uma referência completa `<provider/model>`. Quando ela é
definida, `openclaw infer image describe` tenta esse modelo primeiro em vez de
ignorar a descrição porque o modelo oferece suporte a visão nativa. Se a chamada
do modelo falhar, o OpenClaw pode continuar pelos
`agents.defaults.imageModel.fallbacks` configurados; erros de preparação de
arquivo ou URL ainda falham antes das tentativas de fallback.

Use `infer image describe` quando quiser o fluxo de provedor de compreensão de
imagem do OpenClaw, `agents.defaults.imageModel` configurado e o formato de saída
de descrição de imagem. Use `infer model run --file` quando quiser uma sondagem
bruta de modelo multimodal com um prompt personalizado e uma ou mais imagens.

Para tornar o Ollama o modelo padrão de compreensão de imagem para mídia de
entrada, configure `agents.defaults.imageModel`:

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

Prefira a referência completa `ollama/<model>`. Se o mesmo modelo estiver listado
em `models.providers.ollama.models` com `input: ["text", "image"]` e nenhum outro
provedor de imagem configurado expuser esse ID de modelo simples, o OpenClaw
também normaliza uma referência `imageModel` simples como `qwen2.5vl:7b` para
`ollama/qwen2.5vl:7b`. Se mais de um provedor de imagem configurado tiver o
mesmo ID simples, use explicitamente o prefixo do provedor.

Modelos locais de visão lentos podem precisar de um tempo limite de compreensão
de imagem maior que modelos de nuvem. Eles também podem travar ou parar quando o
Ollama tenta alocar todo o contexto de visão anunciado em hardware limitado.
Defina um tempo limite de capacidade e limite `num_ctx` na entrada do modelo
quando você só precisa de um turno normal de descrição de imagem:

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

Esse tempo limite se aplica à compreensão de imagem de entrada e à ferramenta
`image` explícita que o agente pode chamar durante um turno. O
`models.providers.ollama.timeoutSeconds` no nível do provedor ainda controla a
proteção da solicitação HTTP subjacente do Ollama para chamadas normais de
modelo.

Verifique ao vivo a ferramenta de imagem explícita contra o Ollama local com:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Se você definir `models.providers.ollama.models` manualmente, marque modelos de
visão com suporte a entrada de imagem:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

O OpenClaw rejeita solicitações de descrição de imagem para modelos que não são
marcados como capazes de imagem. Com descoberta implícita, o OpenClaw lê isso do
Ollama quando `/api/show` relata uma capacidade de visão.

## Configuração

<Tabs>
  <Tab title="Basic (implicit discovery)">
    O caminho mais simples de habilitação somente local é por variável de ambiente:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` estiver definido, você pode omitir `apiKey` na entrada do provedor e o OpenClaw o preencherá para verificações de disponibilidade.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Use configuração explícita quando quiser uma configuração de nuvem hospedada, quando o Ollama for executado em outro host/porta, quando quiser forçar janelas de contexto ou listas de modelos específicas, ou quando quiser definições de modelo totalmente manuais.

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
    Se o Ollama estiver em execução em um host ou porta diferente (a configuração explícita desativa a descoberta automática, então defina os modelos manualmente):

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
    Não adicione `/v1` à URL. O caminho `/v1` usa o modo compatível com OpenAI, no qual a chamada de ferramentas não é confiável. Use a URL base do Ollama sem sufixo de caminho.
    </Warning>

  </Tab>
</Tabs>

## Receitas comuns

Use estes como pontos de partida e substitua os IDs de modelo pelos nomes exatos de `ollama list` ou `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Modelo local com descoberta automática">
    Use isto quando o Ollama estiver em execução na mesma máquina que o Gateway e você quiser que o OpenClaw descubra os modelos instalados automaticamente.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Este caminho mantém a configuração mínima. Não adicione um bloco `models.providers.ollama` a menos que você queira definir modelos manualmente.

  </Accordion>

  <Accordion title="Host Ollama na LAN com modelos manuais">
    Use URLs nativas do Ollama para hosts na LAN. Não adicione `/v1`.

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

    `contextWindow` é o orçamento de contexto do lado do OpenClaw. `params.num_ctx` é enviado ao Ollama para a solicitação. Mantenha-os alinhados quando seu hardware não conseguir executar todo o contexto anunciado do modelo.

  </Accordion>

  <Accordion title="Somente Ollama Cloud">
    Use isto quando você não executa um daemon local e quer modelos hospedados do Ollama diretamente.

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

  <Accordion title="Nuvem mais local por meio de um daemon autenticado">
    Use isto quando um daemon Ollama local ou na LAN estiver autenticado com `ollama signin` e deve servir tanto modelos locais quanto modelos `:cloud`.

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

  <Accordion title="Vários hosts Ollama">
    Use IDs de provedor personalizados quando você tiver mais de um servidor Ollama. Cada provedor recebe seu próprio host, modelos, autenticação, tempo limite e referências de modelo.

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

  <Accordion title="Perfil enxuto de modelo local">
    Alguns modelos locais conseguem responder a prompts simples, mas têm dificuldade com toda a superfície de ferramentas do agente. Comece limitando ferramentas e contexto antes de alterar configurações globais de runtime.

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
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

    Use `compat.supportsTools: false` somente quando o modelo ou servidor falhar de forma confiável em esquemas de ferramentas. Isso troca capacidade do agente por estabilidade.
    `localModelLean` remove as ferramentas de navegador, cron e mensagens da superfície direta do agente e coloca catálogos maiores por padrão atrás de controles estruturados de Busca de Ferramentas, exceto quando uma execução precisa manter semântica de entrega direta de mensagens, mas não altera o contexto de runtime nem o modo de pensamento do Ollama. Combine com `params.num_ctx` explícito e `params.thinking: false` para pequenos modelos de pensamento no estilo Qwen que entram em loop ou gastam o orçamento de resposta em raciocínio oculto.

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

IDs personalizados de provedor Ollama também são compatíveis. Quando uma referência de modelo usa o prefixo do provedor ativo, como `ollama-spark/qwen3:32b`, o OpenClaw remove apenas esse prefixo antes de chamar o Ollama, para que o servidor receba `qwen3:32b`.

Para modelos locais lentos, prefira ajuste de solicitação com escopo de provedor antes de aumentar o tempo limite de runtime do agente inteiro:

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

`timeoutSeconds` se aplica à solicitação HTTP do modelo, incluindo configuração de conexão, cabeçalhos, streaming do corpo e a anulação total de fetch protegida. `params.keep_alive` é encaminhado ao Ollama como `keep_alive` de nível superior em solicitações nativas `/api/chat`; defina por modelo quando o tempo de carregamento da primeira interação for o gargalo.

### Verificação rápida

```bash
# Daemon Ollama visível para esta máquina
curl http://127.0.0.1:11434/api/tags

# Catálogo OpenClaw e modelo selecionado
openclaw models list --provider ollama
openclaw models status

# Smoke direto de modelo
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Para hosts remotos, substitua `127.0.0.1` pelo host usado em `baseUrl`. Se `curl` funcionar, mas o OpenClaw não, verifique se o Gateway está em execução em outra máquina, contêiner ou conta de serviço.

## Ollama Web Search

O OpenClaw é compatível com **Ollama Web Search** como um provedor `web_search` incluído.

| Propriedade | Detalhe                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa seu host Ollama configurado (`models.providers.ollama.baseUrl` quando definido; caso contrário, `http://127.0.0.1:11434`); `https://ollama.com` usa a API hospedada diretamente |
| Autenticação | Sem chave para hosts Ollama locais autenticados; `OLLAMA_API_KEY` ou autenticação de provedor configurada para busca direta em `https://ollama.com` ou hosts protegidos por autenticação |
| Requisito   | Hosts locais/auto-hospedados devem estar em execução e autenticados com `ollama signin`; busca hospedada direta exige `baseUrl: "https://ollama.com"` mais uma chave de API Ollama real |

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

Para busca hospedada direta por meio do Ollama Cloud:

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
Para ver todos os detalhes de configuração e comportamento, consulte [Ollama Web Search](/pt-BR/tools/ollama-search).
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modo legado compatível com OpenAI">
    <Warning>
    **Chamadas de ferramenta não são confiáveis no modo compatível com OpenAI.** Use este modo somente se você precisar do formato OpenAI para um proxy e não depender do comportamento nativo de chamadas de ferramenta.
    </Warning>

    Se você precisar usar o endpoint compatível com OpenAI (por exemplo, atrás de um proxy que só aceita o formato OpenAI), defina `api: "openai-completions"` explicitamente:

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

    Este modo pode não ser compatível com streaming e chamadas de ferramenta simultaneamente. Talvez seja necessário desativar o streaming com `params: { streaming: false }` na configuração do modelo.

    Quando `api: "openai-completions"` é usado com Ollama, o OpenClaw injeta `options.num_ctx` por padrão para que o Ollama não reverta silenciosamente para uma janela de contexto de 4096. Se seu proxy/upstream rejeitar campos `options` desconhecidos, desative este comportamento:

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
    Para modelos descobertos automaticamente, o OpenClaw usa a janela de contexto relatada pelo Ollama quando disponível, incluindo valores maiores de `PARAMETER num_ctx` de Modelfiles personalizados. Caso contrário, ele recorre à janela de contexto padrão do Ollama usada pelo OpenClaw.

    Você pode definir padrões `contextWindow`, `contextTokens` e `maxTokens` em nível de provedor para todos os modelos sob esse provedor Ollama e, em seguida, substituí-los por modelo quando necessário. `contextWindow` é o orçamento de prompt e Compaction do OpenClaw. Solicitações nativas do Ollama deixam `options.num_ctx` indefinido, a menos que você configure explicitamente `params.num_ctx`, para que o Ollama possa aplicar seu próprio padrão baseado no modelo, em `OLLAMA_CONTEXT_LENGTH` ou na VRAM. Para limitar ou forçar o contexto de runtime por solicitação do Ollama sem reconstruir um Modelfile, defina `params.num_ctx`; valores inválidos, zero, negativos e não finitos são ignorados. Se você atualizou uma configuração antiga que usava apenas `contextWindow` ou `maxTokens` para forçar um contexto de solicitação nativa do Ollama, execute `openclaw doctor --fix` para copiar esses orçamentos explícitos de provedor ou modelo para `params.num_ctx`. O adaptador compatível com OpenAI do Ollama ainda injeta `options.num_ctx` por padrão a partir de `params.num_ctx` ou `contextWindow` configurado; desabilite isso com `injectNumCtxForOpenAICompat: false` se seu upstream rejeitar `options`.

    Entradas de modelos nativos do Ollama também aceitam as opções comuns de runtime do Ollama em `params`, incluindo `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` e `use_mmap`. O OpenClaw encaminha apenas chaves de solicitação do Ollama, portanto parâmetros de runtime do OpenClaw, como `streaming`, não vazam para o Ollama. Use `params.think` ou `params.thinking` para enviar `think` de nível superior do Ollama; `false` desabilita o pensamento em nível de API para modelos de pensamento no estilo Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` por modelo também funciona. Se ambos estiverem configurados, a entrada explícita de modelo do provedor vence sobre o padrão do agente.

  </Accordion>

  <Accordion title="Controle de pensamento">
    Para modelos nativos do Ollama, o OpenClaw encaminha o controle de pensamento como o Ollama espera: `think` de nível superior, não `options.think`. Modelos descobertos automaticamente cuja resposta de `/api/show` inclui a capacidade `thinking` expõem `/think low`, `/think medium`, `/think high` e `/think max`; modelos sem pensamento expõem apenas `/think off`.

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

    `params.think` ou `params.thinking` por modelo pode desabilitar ou forçar o pensamento da API do Ollama para um modelo configurado específico. O OpenClaw preserva esses parâmetros explícitos de modelo quando a execução ativa tem apenas o padrão implícito `off`; comandos de runtime diferentes de off, como `/think medium`, ainda substituem a execução ativa.

  </Accordion>

  <Accordion title="Modelos de raciocínio">
    O OpenClaw trata modelos com nomes como `deepseek-r1`, `reasoning` ou `think` como capazes de raciocínio por padrão.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Nenhuma configuração adicional é necessária. O OpenClaw os marca automaticamente.

  </Accordion>

  <Accordion title="Custos de modelo">
    O Ollama é gratuito e executa localmente, portanto todos os custos de modelo são definidos como US$ 0. Isso se aplica tanto a modelos descobertos automaticamente quanto a modelos definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memória">
    O Plugin Ollama incluído registra um provedor de embedding de memória para
    [busca de memória](/pt-BR/concepts/memory). Ele usa a URL base e a chave de API
    configuradas do Ollama, chama o endpoint atual `/api/embed` do Ollama e agrupa
    vários blocos de memória em uma solicitação `input` quando possível.

    Quando `proxy.enabled=true`, solicitações de embedding de memória do Ollama para a origem
    host-local loopback exata derivada do `baseUrl` configurado usam
    o caminho direto protegido do OpenClaw em vez do proxy encaminhado gerenciado. O
    nome de host configurado deve ser ele próprio `localhost` ou um literal de IP loopback;
    nomes DNS que apenas resolvem para loopback ainda usam o caminho de proxy gerenciado.
    Hosts Ollama em LAN, tailnet, rede privada e públicos também permanecem no
    caminho de proxy gerenciado. Redirecionamentos para outro host ou porta não herdam confiança.
    Operadores ainda podem definir a configuração global `proxy.loopbackMode: "proxy"` para
    enviar tráfego loopback pelo proxy, ou `proxy.loopbackMode: "block"`
    para negar conexões loopback antes de abrir uma conexão; consulte
    [Proxy gerenciado](/pt-BR/security/network-proxy#gateway-loopback-mode) para o
    efeito dessa configuração em todo o processo.

    | Propriedade   | Valor               |
    | ------------- | ------------------- |
    | Modelo padrão | `nomic-embed-text`  |
    | Auto-pull     | Sim — o modelo de embedding é baixado automaticamente se não estiver presente localmente |

    Embeddings em tempo de consulta usam prefixos de recuperação para modelos que os exigem ou recomendam, incluindo `nomic-embed-text`, `qwen3-embedding` e `mxbai-embed-large`. Lotes de documentos de memória permanecem brutos para que índices existentes não precisem de uma migração de formato.

    Para selecionar o Ollama como provedor de embedding de busca de memória:

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

    Para um host remoto de embedding, mantenha a autenticação limitada a esse host:

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
    A integração do Ollama no OpenClaw usa a **API nativa do Ollama** (`/api/chat`) por padrão, que oferece suporte completo a streaming e chamadas de ferramentas simultaneamente. Nenhuma configuração especial é necessária.

    Para solicitações nativas de `/api/chat`, o OpenClaw também encaminha o controle de pensamento diretamente ao Ollama: `/think off` e `openclaw agent --thinking off` enviam `think: false` de nível superior, a menos que um valor explícito de modelo `params.think`/`params.thinking` esteja configurado, enquanto `/think low|medium|high` envia a string de esforço `think` de nível superior correspondente. `/think max` mapeia para o maior esforço nativo do Ollama, `think: "high"`.

    <Tip>
    Se você precisar usar o endpoint compatível com OpenAI, consulte a seção "Modo legado compatível com OpenAI" acima. Streaming e chamadas de ferramentas podem não funcionar simultaneamente nesse modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Loop de falha do WSL2 (reinicializações repetidas)">
    No WSL2 com NVIDIA/CUDA, o instalador oficial do Ollama para Linux cria uma unidade systemd `ollama.service` com `Restart=always`. Se esse serviço iniciar automaticamente e carregar um modelo apoiado por GPU durante a inicialização do WSL2, o Ollama pode fixar a memória do host enquanto o modelo carrega. A recuperação de memória do Hyper-V nem sempre consegue recuperar essas páginas fixadas, então o Windows pode encerrar a VM WSL2, o systemd inicia o Ollama novamente, e o loop se repete.

    Evidências comuns:

    - reinicializações ou encerramentos repetidos do WSL2 pelo lado do Windows
    - CPU alta em `app.slice` ou `ollama.service` pouco após a inicialização do WSL2
    - SIGTERM do systemd em vez de um evento do OOM-killer do Linux

    O OpenClaw registra um aviso de inicialização quando detecta WSL2, `ollama.service` habilitado com `Restart=always` e marcadores CUDA visíveis.

    Mitigação:

    ```bash
    sudo systemctl disable ollama
    ```

    Adicione isto a `%USERPROFILE%\.wslconfig` no lado do Windows e execute `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Defina um keep-alive mais curto no ambiente de serviço do Ollama ou inicie o Ollama manualmente apenas quando precisar dele:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulte [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

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
    Se seu modelo não estiver listado, baixe o modelo localmente ou defina-o explicitamente em `models.providers.ollama`.

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
    Verifique a partir da mesma máquina e runtime que executa o Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causas comuns:

    - `baseUrl` aponta para `localhost`, mas o Gateway está em execução no Docker ou em outro host.
    - A URL usa `/v1`, que seleciona o comportamento compatível com OpenAI em vez do Ollama nativo.
    - O host remoto precisa de alterações de firewall ou vínculo de LAN no lado do Ollama.
    - O modelo está presente no daemon do seu notebook, mas não no daemon remoto.

  </Accordion>

  <Accordion title="Modelo retorna JSON de ferramenta como texto">
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

  <Accordion title="Kimi ou GLM retorna símbolos corrompidos">
    Respostas hospedadas do Kimi/GLM que são longas sequências de símbolos não linguísticos são tratadas como saída de provedor com falha em vez de uma resposta bem-sucedida do assistente. Isso permite que nova tentativa, fallback ou tratamento de erro normal assuma sem persistir o texto corrompido na sessão.

    Se isso acontecer repetidamente, capture o nome bruto do modelo, o arquivo de sessão atual e se a execução usou `Cloud + Local` ou `Cloud only`; então tente uma nova sessão e um modelo de fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Modelo local frio atinge timeout">
    Modelos locais grandes podem precisar de um primeiro carregamento longo antes que o streaming comece. Mantenha o timeout limitado ao provedor Ollama e, opcionalmente, peça ao Ollama para manter o modelo carregado entre turnos:

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

    Se o próprio host estiver lento para aceitar conexões, `timeoutSeconds` também estende o tempo limite protegido de conexão do Undici para este provedor.

  </Accordion>

  <Accordion title="O modelo de contexto amplo é lento demais ou fica sem memória">
    Muitos modelos Ollama anunciam contextos maiores do que seu hardware consegue executar confortavelmente. O Ollama nativo usa o padrão de contexto de runtime próprio do Ollama, a menos que você defina `params.num_ctx`. Limite tanto o orçamento do OpenClaw quanto o contexto da solicitação do Ollama quando quiser uma latência previsível do primeiro token:

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

    Reduza `contextWindow` primeiro se o OpenClaw estiver enviando prompt demais. Reduza `params.num_ctx` se o Ollama estiver carregando um contexto de runtime grande demais para a máquina. Reduza `maxTokens` se a geração demorar demais.

  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Pesquisa na web do Ollama" href="/pt-BR/tools/ollama-search" icon="magnifying-glass">
    Configuração completa e detalhes de comportamento para pesquisa na web com tecnologia Ollama.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração.
  </Card>
</CardGroup>
