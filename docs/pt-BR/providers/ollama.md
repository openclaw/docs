---
read_when:
    - Você quer executar o OpenClaw com modelos na nuvem ou locais via Ollama
    - Você precisa de orientações para instalar e configurar o Ollama
    - Você quer usar modelos de visão do Ollama para compreensão de imagens
summary: Execute o OpenClaw com o Ollama (modelos na nuvem e locais)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T15:40:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

O OpenClaw se comunica com a API nativa do Ollama (`/api/chat`), não com o endpoint
compatível com OpenAI `/v1`. Há suporte para três modos:

| Modo          | O que usa                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Nuvem + local | Um host Ollama acessível, fornecendo modelos locais e, se a sessão estiver iniciada, modelos `:cloud` |
| Somente nuvem | `https://ollama.com` diretamente, sem daemon local                                                    |
| Somente local | Um host Ollama acessível, somente com modelos locais                                                  |

Para configurar somente a nuvem com o id de provedor dedicado `ollama-cloud`, consulte
[Ollama Cloud](/pt-BR/providers/ollama-cloud). Use referências `ollama-cloud/<model>` quando
quiser manter o roteamento pela nuvem separado de um provedor `ollama` local.

<Warning>
Não use a URL `/v1` compatível com OpenAI (`http://host:11434/v1`). Ela interrompe as chamadas de ferramentas, e os modelos podem emitir o JSON bruto da chamada de ferramenta como texto simples. Use a URL nativa: `baseUrl: "http://host:11434"` (sem `/v1`).
</Warning>

A chave de configuração canônica é `baseUrl`. `baseURL` também é aceita em
exemplos no estilo do SDK da OpenAI, mas novas configurações devem usar `baseUrl`.

## Regras de autenticação

<AccordionGroup>
  <Accordion title="Hosts locais e da LAN">
    URLs do Ollama de loopback, rede privada, `.local` e com nome de host simples não precisam de um token bearer real. O OpenClaw usa o marcador `ollama-local` nesses casos.
  </Accordion>
  <Accordion title="Hosts remotos e do Ollama Cloud">
    Hosts remotos públicos e `https://ollama.com` exigem uma credencial real: `OLLAMA_API_KEY`, um perfil de autenticação ou o `apiKey` do provedor. Para uso hospedado direto, prefira o provedor `ollama-cloud`.
  </Accordion>
  <Accordion title="Ids de provedor personalizados">
    Um provedor personalizado com `api: "ollama"` segue as mesmas regras. Por exemplo, um provedor `ollama-remote` apontado para um host de LAN privada pode usar `apiKey: "ollama-local"`; subagentes resolvem esse marcador por meio do hook do provedor Ollama em vez de tratá-lo como uma credencial ausente. `agents.defaults.memorySearch.provider` também pode apontar para um id de provedor personalizado para que os embeddings usem esse endpoint do Ollama.
  </Accordion>
  <Accordion title="Perfis de autenticação">
    `auth-profiles.json` armazena a credencial de um id de provedor; coloque as configurações do endpoint (`baseUrl`, `api`, modelos, cabeçalhos, tempos limite) em `models.providers.<id>`. Arquivos simples antigos, como `{ "ollama-windows": { "apiKey": "ollama-local" } }`, não são um formato de execução; `openclaw doctor --fix` os reescreve como um perfil de chave de API canônico `ollama-windows:default`, com um backup. Um valor `baseUrl` nesse arquivo legado é irrelevante e deve ser movido para a configuração do provedor.
  </Accordion>
  <Accordion title="Escopo dos embeddings de memória">
    A autenticação bearer para embeddings de memória do Ollama é limitada ao host para o qual foi declarada:

    - Uma chave no nível do provedor é enviada somente ao host desse provedor.
    - `agents.*.memorySearch.remote.apiKey` é enviada somente ao host remoto de embeddings correspondente.
    - Um valor de ambiente `OLLAMA_API_KEY` isolado é tratado como a convenção do Ollama Cloud e, por padrão, não é enviado a hosts locais ou auto-hospedados.

  </Accordion>
</AccordionGroup>

## Primeiros passos

<Tabs>
  <Tab title="Integração inicial (recomendado)">
    <Steps>
      <Step title="Execute a integração inicial">
        ```bash
        openclaw onboard
        ```

        Selecione **Ollama** e escolha um modo: **Nuvem + local**, **Somente nuvem** ou **Somente local**.
      </Step>
      <Step title="Selecione um modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` e sugere padrões hospedados na nuvem. `Cloud + Local` e `Local only` solicitam uma URL base do Ollama, detectam os modelos disponíveis e baixam automaticamente o modelo local selecionado caso ele não esteja presente. Uma tag `:latest` instalada, como `gemma4:latest`, é exibida uma única vez, em vez de duplicar `gemma4`. `Cloud + Local` também verifica se há uma sessão iniciada no host para acesso à nuvem.
      </Step>
      <Step title="Verifique">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Não interativo:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` e `--custom-model-id` são opcionais; omiti-los usa o host local padrão e o modelo sugerido `gemma4`.

  </Tab>

  <Tab title="Configuração manual">
    <Steps>
      <Step title="Instale e inicie o Ollama">
        Baixe-o em [ollama.com/download](https://ollama.com/download) e, em seguida, baixe um modelo:

        ```bash
        ollama pull gemma4
        ```

        Para acesso híbrido à nuvem, execute `ollama signin` no mesmo host.
      </Step>
      <Step title="Defina uma credencial">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # host local/LAN, qualquer valor funciona
        export OLLAMA_API_KEY="your-real-key"   # somente https://ollama.com
        ```

        Ou na configuração: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Selecione o modelo">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Ou na configuração:

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

## Modelos na nuvem por meio de um host local

`Cloud + Local` roteia tanto os modelos locais quanto os modelos `:cloud` por um único host
Ollama acessível — esse é o fluxo híbrido do Ollama e o modo a selecionar durante a configuração
quando você deseja ambos.

O OpenClaw solicita a URL base, descobre os modelos locais e verifica o status de
`ollama signin`. Quando a sessão está iniciada, ele sugere padrões hospedados
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Se
a sessão não estiver iniciada, a configuração permanecerá somente local até você executar `ollama signin`.

Para acesso somente à nuvem sem um daemon local, use `openclaw onboard --auth-choice ollama-cloud` e consulte [Ollama Cloud](/pt-BR/providers/ollama-cloud) — esse caminho não requer `ollama signin` nem um servidor em execução:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

A lista de modelos na nuvem exibida durante `openclaw onboard` é preenchida em tempo real a partir de
`https://ollama.com/api/tags`, limitada a 500 entradas, para que o seletor reflita
o catálogo hospedado atual. Se `ollama.com` estiver inacessível ou não retornar
modelos durante a configuração, o OpenClaw recorrerá à sua lista codificada de sugestões para que
o processo de integração ainda seja concluído.

## Descoberta de modelos (provedor implícito)

Quando `OLLAMA_API_KEY` (ou um perfil de autenticação) está definido e nem
`models.providers.ollama` nem outro provedor personalizado com `api: "ollama"` está
definido, o OpenClaw descobre modelos em `http://127.0.0.1:11434`:

| Comportamento              | Detalhe                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta ao catálogo       | `/api/tags`                                                                                                                                                                                                                                                                                                                                               |
| Detecção de recursos       | Leituras de melhor esforço de `/api/show` obtêm `contextWindow`, parâmetros `num_ctx` do Modelfile e recursos (visão/ferramentas/raciocínio)                                                                                                                                                                                                               |
| Modelos de visão           | Um recurso `vision` de `/api/show` marca o modelo como compatível com imagens (`input: ["text", "image"]`)                                                                                                                                                                                                                                                 |
| Detecção de raciocínio     | Usa o recurso `thinking` de `/api/show` quando disponível; recorre a uma heurística de nome (`r1`, `reason`, `reasoning`, `think`) quando o Ollama omite os recursos. `glm-5.2:cloud` e `deepseek-v4-flash\|pro:cloud` são sempre tratados como modelos de raciocínio, independentemente dos recursos informados. |
| Limites de tokens          | O padrão de `maxTokens` é o limite máximo de tokens do Ollama definido pelo OpenClaw                                                                                                                                                                                                                                                                       |
| Custos                     | Todos os custos são `0`                                                                                                                                                                                                                                                                                                                                   |

```bash
ollama list
openclaw models list
```

Definir `models.providers.ollama` com um array `models` explícito ou um
provedor personalizado com `api: "ollama"` e uma `baseUrl` que não seja de loopback desativa
a descoberta automática; nesse caso, os modelos devem ser definidos manualmente (consulte
[Configuração](#configuration)). Uma entrada `models.providers.ollama` apontando para
o `https://ollama.com` hospedado também ignora a descoberta, pois os modelos do Ollama Cloud
são gerenciados pelo provedor. Provedores personalizados de loopback, como
`http://127.0.0.2:11434`, ainda são considerados locais e mantêm a descoberta automática.

Você pode usar uma referência completa, como `ollama/<pulled-model>:latest`, sem uma
entrada escrita manualmente em `models.json`; o OpenClaw a resolve em tempo real. Para hosts
com sessão iniciada, selecionar uma referência `ollama/<model>:cloud` não listada valida esse
modelo exato com `/api/show` e o adiciona ao catálogo de runtime somente se o Ollama
confirmar os metadados — erros de digitação ainda resultam em modelos desconhecidos.

### Testes de fumaça

Para uma verificação de texto restrita que ignora toda a superfície de ferramentas do agente:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Responda exatamente com: pong" \
    --json
```

Adicione `--file` com uma imagem para uma verificação enxuta de modelo de visão (aceita PNG/JPEG/WebP;
arquivos que não sejam imagens são rejeitados antes que o Ollama seja chamado — use
`openclaw infer audio transcribe` para áudio):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Descreva esta imagem em uma frase." \
    --file ./photo.jpg \
    --json
```

Nenhum dos caminhos carrega ferramentas de chat, memória ou contexto de sessão. Se funcionar
enquanto as respostas normais do agente falharem, o problema provavelmente será a capacidade
do modelo para ferramentas/agentes, não o endpoint.

Selecionar um modelo com `/model ollama/<model>` é uma escolha exata do usuário: se a
`baseUrl` configurada estiver inacessível, a próxima resposta falhará com o erro do provedor,
em vez de recorrer silenciosamente a outro modelo configurado.

Tarefas Cron isoladas adicionam uma verificação de segurança local antes de iniciar o turno do agente:
se o modelo selecionado for resolvido para um provedor Ollama de rede local/privada/`.local`
e `/api/tags` estiver inacessível, o OpenClaw registrará essa execução como
`skipped`, com o modelo no texto do erro. Essa verificação de endpoint permanece em cache por
5 minutos por host, para que tarefas Cron repetidas direcionadas a um daemon interrompido não
iniciem todas solicitações que resultarão em falha.

Verificação em ambiente real:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para o Ollama Cloud, direcione o mesmo teste em ambiente real ao endpoint hospedado (ignora
embeddings por padrão; force com `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, pois uma
chave da nuvem pode não autorizar `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Para adicionar um modelo, baixe-o, e ele será descoberto automaticamente:

```bash
ollama pull mistral
```

## Inferência local no Node

Os agentes podem delegar uma tarefa curta a um modelo Ollama em um desktop
pareado ou Node de servidor. O prompt e a resposta passam pela conexão
autenticada existente entre Gateway e Node; a solicitação é executada no
endpoint Ollama de loopback do próprio Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Inicie o Ollama no Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Conecte o host do Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Aprove o dispositivo e seus comandos de Node no host do Gateway e, em seguida, verifique:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Uma primeira conexão, ou uma atualização que adicione comandos do Ollama, pode acionar
    a aprovação de comandos do Node. Se o Node se conectar sem anunciar
    `ollama.models` e `ollama.chat`, verifique `openclaw nodes pending` novamente.

  </Step>
  <Step title="Use-o por meio de um agente">
    O plugin Ollama incluído expõe a ferramenta `node_inference`. Os agentes chamam
    primeiro `action: "discover"` e depois `action: "run"` com um Node e um modelo
    desse resultado (`run` pode omitir o Node quando exatamente um Node compatível
    está conectado). Por exemplo: "Descubra os modelos Ollama nos meus Nodes e depois use
    o modelo carregado mais rápido para resumir este texto."
  </Step>
</Steps>

A descoberta lê `/api/tags`, verifica os recursos de `/api/show` e usa
`/api/ps`, quando disponível, para priorizar modelos já carregados. Ela retorna apenas
modelos locais que o Ollama informa serem compatíveis com chat (recurso `completion`) —
linhas do Ollama Cloud e modelos exclusivos para embeddings são excluídos. Cada execução desativa
o raciocínio do modelo e limita a saída, por padrão, a 512 tokens (limite rígido de 8192), a menos que
a chamada da ferramenta solicite um `maxTokens` diferente; alguns modelos (por exemplo, GPT-OSS)
não permitem desativar o raciocínio e ainda podem emitir tokens de raciocínio.

Para manter o Ollama em execução em um Node sem expô-lo aos agentes:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Reinicie o Node (`openclaw node restart` ou pare e execute novamente `openclaw node run`
para uma sessão em primeiro plano). O Node deixa de anunciar `ollama.models` e
`ollama.chat`; o próprio Ollama e o provedor Ollama do Gateway não são afetados.
Defina o valor novamente como `true` e reinicie para reativar; uma alteração na superfície
de comandos pode exigir novamente a aprovação em `openclaw nodes pending` após a reconexão.

Verifique os comandos do Node diretamente, sem uma interação do agente:

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

`--invoke-timeout` limita por quanto tempo o Node pode executar o comando;
`--timeout` limita a chamada geral ao Gateway e deve ser maior.

A inferência local no Node sempre usa o endpoint de loopback do próprio Node — ela
não reutiliza um `models.providers.ollama.baseUrl` remoto/na nuvem configurado. Os
comandos do Node estão disponíveis por padrão em hosts de Node macOS, Linux e Windows
e continuam sujeitos à política normal de pareamento/comandos do Node.

## Visão e descrição de imagens

O plugin Ollama incluído registra o Ollama como um provedor de
compreensão de mídia compatível com imagens, permitindo que o OpenClaw encaminhe solicitações
explícitas de descrição de imagens e padrões configurados de modelos de imagem por meio de
modelos de visão Ollama locais ou hospedados.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` deve ser uma referência `<provider/model>` completa; quando definida, `infer image
describe` tenta esse modelo primeiro, em vez de ignorar a descrição para modelos
que já são compatíveis nativamente com visão. Se a chamada falhar, o OpenClaw pode continuar
por meio de `agents.defaults.imageModel.fallbacks`; erros de preparação de arquivo/URL
falham antes que o fallback seja tentado. Use `infer image describe` para o fluxo
de compreensão de imagens e o `imageModel` configurado do OpenClaw; use `infer model run
--file` para uma sondagem multimodal bruta com um prompt personalizado.

Para tornar o Ollama o provedor padrão de compreensão de imagens para mídia recebida:

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

Prefira a referência `ollama/<model>` completa. Uma referência simples de `imageModel`, como
`qwen2.5vl:7b`, é normalizada para `ollama/qwen2.5vl:7b` somente quando esse modelo exato
está listado em `models.providers.ollama.models` com
`input: ["text", "image"]` e nenhum outro provedor de imagem configurado expõe o
mesmo ID simples; caso contrário, use explicitamente o prefixo do provedor.

Modelos locais de visão lentos podem precisar de um timeout de compreensão de imagens maior
que os modelos de nuvem e podem falhar em hardware com recursos limitados se o Ollama tentar
alocar todo o contexto de visão anunciado pelo modelo. Defina um
timeout de recurso e limite `num_ctx`:

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

Esse timeout se aplica à compreensão de imagens recebidas e à ferramenta
`image` explícita. `models.providers.ollama.timeoutSeconds` ainda controla a
proteção de solicitações HTTP subjacente do Ollama para chamadas normais de modelos.

Verificação em ambiente real:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Se você definir `models.providers.ollama.models` manualmente, marque explicitamente
os modelos de visão:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

O OpenClaw rejeita solicitações de descrição de imagens para modelos não marcados
como compatíveis com imagens. Com a descoberta implícita, isso vem do recurso
de visão de `/api/show`.

## Configuração

<Tabs>
  <Tab title="Básica (descoberta implícita)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` estiver definida, você poderá omitir `apiKey` na entrada do provedor; o OpenClaw a preenche para as verificações de disponibilidade.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuais)">
    Use uma configuração explícita para uma instalação hospedada na nuvem, um host/porta
    fora do padrão, janelas de contexto forçadas ou listas de modelos totalmente manuais:

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

  <Tab title="URL base personalizada">
    A configuração explícita desativa a descoberta automática, portanto os modelos devem ser listados:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Sem /v1 - URL da API nativa do Ollama
            api: "ollama", // Explícito: garante o comportamento nativo de chamada de ferramentas
            timeoutSeconds: 300, // Opcional: orçamento maior de conexão/stream para modelos locais não carregados
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Opcional: mantém o modelo carregado entre interações
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Não adicione `/v1`. Esse caminho seleciona o modo compatível com OpenAI, no qual a chamada de ferramentas não é confiável.
    </Warning>

  </Tab>
</Tabs>

## Receitas comuns

Substitua os IDs dos modelos pelos nomes exatos de `ollama list` ou
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Modelo local com descoberta automática">
    Ollama na mesma máquina que o Gateway, descoberto automaticamente:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Não adicione um bloco `models.providers.ollama`, a menos que precise de modelos manuais.

  </Accordion>

  <Accordion title="Host Ollama na LAN com modelos manuais">
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

    `contextWindow` é o orçamento de contexto do OpenClaw; `params.num_ctx` é enviado ao
    Ollama. Mantenha-os alinhados quando o hardware não puder executar todo o contexto
    anunciado pelo modelo.

  </Accordion>

  <Accordion title="Somente Ollama Cloud">
    Sem daemon local, com modelos hospedados diretamente:

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

    Para usar o ID de provedor dedicado `ollama-cloud` em vez desse formato, consulte
    [Ollama Cloud](/pt-BR/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Nuvem e local por meio de um daemon autenticado">
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
    IDs de provedor personalizados ao executar mais de um servidor Ollama; cada um tem seu
    próprio host, modelos, autenticação e tempo limite.

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

    O OpenClaw remove o prefixo do provedor ativo (usando como alternativa um prefixo
    `ollama/` simples) antes de chamar o Ollama; portanto, `ollama-large/qwen3.5:27b`
    chega ao Ollama como `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Perfil enxuto de modelo local">
    Alguns modelos locais lidam com prompts simples, mas têm dificuldades com a superfície
    completa de ferramentas do agente. Limite as ferramentas e o contexto antes de alterar as
    configurações globais do runtime:

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

    Use `compat.supportsTools: false` somente quando o modelo ou servidor falhar de forma
    consistente com esquemas de ferramentas — isso troca capacidade do agente por estabilidade.
    `localModelLean` remove ferramentas pesadas de navegador, cron, mensagens, geração de mídia,
    voz e PDF da superfície direta do agente, a menos que sejam exigidas explicitamente,
    e coloca catálogos maiores atrás da Pesquisa de Ferramentas. Isso não altera o
    contexto de runtime nem o modo de raciocínio do Ollama. Combine-o com `params.num_ctx` e
    `params.thinking: false` para modelos pequenos de raciocínio no estilo Qwen que entram em loop ou
    gastam seu orçamento com raciocínio oculto.

  </Accordion>
</AccordionGroup>

### Seleção de modelo

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

IDs de provedor personalizados funcionam da mesma forma: para uma referência que usa o prefixo do
provedor ativo, como `ollama-spark/qwen3:32b`, o OpenClaw remove esse prefixo antes de
chamar o Ollama, enviando `qwen3:32b`.

Para modelos locais lentos, prefira ajustes no escopo do provedor antes de aumentar o tempo
limite de todo o runtime do agente:

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

`timeoutSeconds` abrange a solicitação HTTP do modelo: configuração da conexão, cabeçalhos,
streaming do corpo e a interrupção total da busca protegida. `params.keep_alive` é
encaminhado como `keep_alive` de nível superior em solicitações nativas a `/api/chat`; defina-o por
modelo quando o tempo de carregamento do primeiro turno for o gargalo.

### Verificação rápida

```bash
# Daemon do Ollama visível para esta máquina
curl http://127.0.0.1:11434/api/tags

# Catálogo do OpenClaw e modelo selecionado
openclaw models list --provider ollama
openclaw models status

# Teste rápido direto do modelo
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Responda exatamente com: ok"
```

Para hosts remotos, substitua `127.0.0.1` pelo host de `baseUrl`. Se o `curl`
funcionar, mas o OpenClaw não, verifique se o Gateway é executado em outra
máquina, contêiner ou conta de serviço.

## Pesquisa na Web do Ollama

O OpenClaw inclui a **Pesquisa na Web do Ollama** como provedor de `web_search`.

| Propriedade | Detalhe                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | `models.providers.ollama.baseUrl` quando definido; caso contrário, `http://127.0.0.1:11434`; `https://ollama.com` usa diretamente a API hospedada           |
| Autenticação | Sem chave para um host local autenticado; `OLLAMA_API_KEY` ou autenticação configurada do provedor para pesquisa direta em `https://ollama.com` ou hosts protegidos por autenticação |
| Requisito   | Hosts locais/auto-hospedados devem estar em execução e autenticados com `ollama signin`; a pesquisa hospedada direta precisa de `baseUrl: "https://ollama.com"` e uma chave de API real |

Escolha-o durante `openclaw onboard` ou `openclaw configure --section web`, ou defina:

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

Para um host auto-hospedado, o OpenClaw primeiro tenta o proxy local `/api/experimental/web_search`
e depois usa como alternativa o caminho hospedado `/api/web_search` no mesmo host; um
daemon local autenticado normalmente responde pelo proxy local. Chamadas diretas a
`https://ollama.com` sempre usam o endpoint hospedado `/api/web_search`.

<Note>
Para ver a configuração e o comportamento completos, consulte [Pesquisa na Web do Ollama](/pt-BR/tools/ollama-search).
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modo legado compatível com OpenAI">
    <Warning>
    **A chamada de ferramentas não é confiável neste modo.** Use-o somente quando um proxy exigir o formato OpenAI e você não depender da chamada nativa de ferramentas.
    </Warning>

    Defina `api: "openai-completions"` explicitamente para um proxy por trás de
    `/v1/chat/completions`:

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

    Este modo pode não oferecer suporte simultâneo a streaming e chamada de ferramentas; talvez
    seja necessário usar `params: { streaming: false }` no modelo.

    O OpenClaw injeta `options.num_ctx` por padrão neste modo para que o Ollama não
    retorne silenciosamente a um contexto de 4096 tokens. Se seu proxy rejeitar
    campos `options` desconhecidos, desative-o:

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
    Para modelos descobertos automaticamente, o OpenClaw usa a janela de contexto informada por
    `/api/show`, incluindo valores maiores de `PARAMETER num_ctx` provenientes de
    Modelfiles personalizados; caso contrário, usa como alternativa a janela de contexto padrão do
    Ollama no OpenClaw.

    `contextWindow`, `contextTokens` e `maxTokens` no nível do provedor definem
    padrões para todos os modelos desse provedor e podem ser substituídos por
    modelo. `contextWindow` é o orçamento de prompt/Compaction do próprio OpenClaw. Solicitações
    nativas a `/api/chat` deixam `options.num_ctx` sem definição, a menos que você defina
    `params.num_ctx` explicitamente; assim, o Ollama aplica seu próprio padrão do modelo,
    de `OLLAMA_CONTEXT_LENGTH` ou baseado em VRAM; valores inválidos, zero, negativos
    ou não finitos de `params.num_ctx` são ignorados. Se uma configuração antiga usava
    apenas `contextWindow`/`maxTokens` para forçar o contexto da solicitação nativa, execute
    `openclaw doctor --fix` para copiá-los para `params.num_ctx`. O
    adaptador compatível com OpenAI ainda injeta `options.num_ctx` por padrão com base no
    `params.num_ctx` ou `contextWindow` configurado; desative com
    `injectNumCtxForOpenAICompat: false` se o upstream rejeitar `options`.

    Entradas de modelo nativas também aceitam opções comuns de runtime do Ollama em
    `params`, encaminhadas como `options` nativas de `/api/chat`: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` e `num_thread`.
    Algumas chaves (`format`, `keep_alive`, `truncate`, `shift`) são encaminhadas como
    campos de solicitação de nível superior, em vez de `options` aninhadas. O OpenClaw
    encaminha somente essas chaves de solicitação do Ollama; portanto, parâmetros exclusivos do runtime,
    como `streaming`, nunca são enviados ao Ollama. Use `params.think` (ou
    `params.thinking`) para definir `think` no nível superior; `false` desativa o
    raciocínio no nível da API para modelos de raciocínio no estilo Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` por modelo também
    funciona; a entrada explícita de modelo do provedor prevalece se ambos estiverem definidos.

  </Accordion>

  <Accordion title="Controle de raciocínio">
    O OpenClaw encaminha o raciocínio como o Ollama espera: `think` no nível superior, não
    `options.think`. Modelos descobertos automaticamente cujo `/api/show` informa a
    capacidade `thinking` disponibilizam `/think low`, `/think medium`, `/think high`
    e `/think max`; modelos sem raciocínio disponibilizam somente `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Ou defina um padrão para o modelo:

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

    A configuração por modelo `params.think`/`params.thinking` pode desabilitar ou forçar o pensamento da API
    para um modelo específico. O OpenClaw preserva essa configuração explícita
    quando a execução ativa tem apenas o padrão implícito `off`; um comando
    de runtime diferente de off, como `/think medium`, ainda a substitui. Uma solicitação
    de pensamento com valor verdadeiro nunca é enviada a um modelo explicitamente marcado como
    `reasoning: false`; uma solicitação `think: false` é sempre enviada.

  </Accordion>

  <Accordion title="Modelos de raciocínio">
    Modelos chamados `deepseek-r1`, `reasoning`, `reason` ou `think` são tratados
    como compatíveis com raciocínio por padrão — nenhuma configuração adicional é necessária:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Custos dos modelos">
    O Ollama é executado localmente e é gratuito, portanto todos os custos dos modelos são `0`, tanto para
    modelos descobertos automaticamente quanto para os definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memória">
    O plugin Ollama incluído registra um provedor de embeddings de memória para a
    [busca na memória](/pt-BR/concepts/memory). Ele usa a URL base e a chave de API
    configuradas do Ollama, chama `/api/embed` e agrupa vários trechos de memória em
    uma solicitação `input` quando possível.

    Quando `proxy.enabled=true`, as solicitações de embedding para a origem de
    loopback local exata, derivada da `baseUrl` configurada, usam o caminho direto
    protegido do OpenClaw em vez do proxy de encaminhamento gerenciado. O nome de host
    configurado deve ser `localhost` ou um literal de IP de loopback — nomes DNS
    que apenas resolvem para loopback ainda usam o caminho do proxy gerenciado. Hosts
    Ollama em LAN, tailnet, rede privada e rede pública sempre permanecem no caminho
    do proxy gerenciado, e redirecionamentos para outro host/porta não herdam
    confiança. `proxy.loopbackMode: "proxy"` encaminha o tráfego de loopback pelo
    proxy mesmo assim; `proxy.loopbackMode: "block"` o bloqueia antes da conexão —
    consulte [Proxy gerenciado](/pt-BR/security/network-proxy#gateway-loopback-mode).

    | Propriedade | Valor |
    | --- | --- |
    | Modelo padrão | `nomic-embed-text` |
    | Download automático | Sim, se não estiver presente localmente |
    | Concorrência inline padrão | 1 (outros provedores usam um padrão maior; aumente com `nonBatchConcurrency` se o host suportar) |

    Os embeddings durante a consulta usam prefixos de recuperação para modelos que
    os exigem ou recomendam: `nomic-embed-text`, `qwen3-embedding` e
    `mxbai-embed-large`. Os lotes de documentos permanecem inalterados, portanto os índices existentes
    não precisam de migração de formato.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Padrão para o Ollama. Aumente em hosts maiores se a reindexação for muito lenta.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Para um host remoto de embeddings, mantenha a autenticação restrita a esse host:

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
    O Ollama usa a **API nativa** (`/api/chat`) por padrão, que oferece suporte
    simultâneo a streaming e chamadas de ferramentas — nenhuma configuração especial é necessária.

    Para solicitações nativas, o controle de raciocínio é encaminhado diretamente: `/think off`
    e `openclaw agent --thinking off` enviam `think: false` no nível superior, a menos que
    um `params.think`/`params.thinking` explícito esteja configurado; `/think
    low|medium|high` envia a string de esforço correspondente; `/think max` é mapeado para
    o maior esforço do Ollama, `think: "high"`.

    <Tip>
    Para usar o endpoint compatível com OpenAI, consulte "Modo legado compatível com OpenAI" acima — o streaming e a chamada de ferramentas podem não funcionar juntos nesse modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Loop de falhas do WSL2 (reinicializações repetidas)">
    No WSL2 com NVIDIA/CUDA, o instalador oficial do Ollama para Linux cria uma
    unidade systemd `ollama.service` com `Restart=always`. Se esse serviço
    iniciar automaticamente e carregar um modelo acelerado por GPU durante a inicialização do WSL2, o Ollama poderá fixar
    a memória do host durante o carregamento; a recuperação de memória do Hyper-V nem sempre consegue recuperar
    essas páginas, portanto o Windows pode encerrar a VM do WSL2, o systemd reinicia
    o Ollama e o ciclo se repete.

    Evidências: reinicializações/encerramentos repetidos do WSL2, uso elevado de CPU em `app.slice` ou
    `ollama.service` logo após a inicialização do WSL2 e SIGTERM enviado pelo systemd em vez
    do mecanismo de encerramento por OOM do Linux.

    O OpenClaw registra um aviso de inicialização quando detecta o WSL2, o `ollama.service`
    habilitado com `Restart=always` e marcadores CUDA visíveis.

    Mitigação:

    ```bash
    sudo systemctl disable ollama
    ```

    No lado do Windows, adicione o seguinte a `%USERPROFILE%\.wslconfig` e execute
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ou reduza o tempo de keep-alive/inicie o Ollama manualmente apenas quando necessário:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Consulte [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama não detectado">
    Confirme se o Ollama está em execução, se `OLLAMA_API_KEY` (ou um perfil de autenticação) está definido
    e se `models.providers.ollama` **não** está definido explicitamente:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Nenhum modelo disponível">
    Baixe o modelo localmente ou defina-o explicitamente em
    `models.providers.ollama`:

    ```bash
    ollama list  # Veja o que está instalado
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Ou outro modelo
    ```

  </Accordion>

  <Accordion title="Conexão recusada">
    ```bash
    # Verifique se o Ollama está em execução
    ps aux | grep ollama

    # Ou reinicie o Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="O host remoto funciona com curl, mas não com o OpenClaw">
    Verifique na mesma máquina e no mesmo runtime que executa o Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Causas comuns:

    - `baseUrl` aponta para `localhost`, mas o Gateway é executado no Docker ou em outro host.
    - A URL usa `/v1`, selecionando o comportamento compatível com a OpenAI em vez do Ollama nativo.
    - O host remoto precisa de alterações no firewall ou na vinculação à LAN.
    - O modelo está no daemon do seu laptop, mas não no remoto.

  </Accordion>

  <Accordion title="O modelo gera o JSON da ferramenta como texto">
    Geralmente, o provedor está no modo compatível com a OpenAI, ou o modelo não consegue
    processar esquemas de ferramentas. Prefira o modo nativo:

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

    Se um modelo local pequeno ainda falhar com esquemas de ferramentas, defina
    `compat.supportsTools: false` nessa entrada de modelo e teste novamente.

  </Accordion>

  <Accordion title="Kimi ou GLM retorna símbolos ilegíveis">
    Respostas hospedadas do Kimi/GLM que sejam sequências longas de símbolos não linguísticos são
    tratadas como uma chamada de provedor com falha, em vez de uma resposta bem-sucedida, para que
    o tratamento normal de repetição/fallback/erro assuma o controle, em vez de persistir
    texto corrompido na sessão.

    Se isso voltar a ocorrer, registre o nome do modelo, o arquivo da sessão atual e
    se a execução usou `Cloud + Local` ou `Cloud only`; depois, tente uma nova
    sessão e um modelo de fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Responda exatamente: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="O modelo local não carregado excede o tempo limite">
    Modelos locais grandes podem precisar de muito tempo no primeiro carregamento. Aplique o tempo limite apenas ao
    provedor Ollama e, opcionalmente, mantenha o modelo carregado entre os turnos:

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

    Se o próprio host demorar para aceitar conexões, `timeoutSeconds` também
    estenderá o tempo limite protegido de conexão desse provedor.

  </Accordion>

  <Accordion title="O modelo de contexto amplo é muito lento ou fica sem memória">
    Muitos modelos anunciam contextos maiores do que seu hardware consegue executar
    de forma adequada. O Ollama nativo usa o padrão do próprio runtime, a menos que
    `params.num_ctx` seja definido. Limite tanto o orçamento do OpenClaw quanto o contexto
    da solicitação do Ollama para obter uma latência previsível até o primeiro token:

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

    Reduza `contextWindow` se o OpenClaw enviar conteúdo demais no prompt. Reduza
    `params.num_ctx` se o contexto de runtime do Ollama for grande demais para a máquina.
    Reduza `maxTokens` se a geração demorar demais.

  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [Perguntas frequentes](/pt-BR/help/faq).
</Note>

## Relacionados

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/pt-BR/providers/ollama-cloud" icon="cloud">
    Configuração exclusiva para nuvem com o provedor dedicado `ollama-cloud`.
  </Card>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/models" icon="brain">
    Como escolher e configurar modelos.
  </Card>
  <Card title="Pesquisa na web do Ollama" href="/pt-BR/tools/ollama-search" icon="magnifying-glass">
    Detalhes completos de configuração e comportamento da pesquisa na web fornecida pelo Ollama.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa da configuração.
  </Card>
</CardGroup>
