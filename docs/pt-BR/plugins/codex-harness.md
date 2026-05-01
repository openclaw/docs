---
read_when:
    - Você quer usar o arcabouço de app-server do Codex incluído
    - Você precisa de exemplos de configuração do ambiente de execução do Codex
    - Você quer que implantações somente Codex falhem em vez de recorrer ao PI
summary: Execute interações de agente embutido do OpenClaw pela estrutura de teste de servidor de aplicativo do Codex incluída
title: Ambiente de execução do Codex
x-i18n:
    generated_at: "2026-05-01T05:58:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740e8fa9e6f4a737dfd250fe26b85865a7f7e40839b41e879e9224a45cbe8d72
    source_path: plugins/codex-harness.md
    workflow: 16
---

O Plugin `codex` incluído permite que o OpenClaw execute turnos de agente incorporados por meio do
app-server do Codex em vez do harness PI integrado.

Use isto quando você quiser que o Codex seja responsável pela sessão de agente de baixo nível: descoberta de
modelos, retomada nativa de threads, Compaction nativa e execução no app-server.
O OpenClaw ainda é responsável por canais de chat, arquivos de sessão, seleção de modelo, ferramentas,
aprovações, entrega de mídia e o espelho visível da transcrição.

Se você estiver tentando se orientar, comece por
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a referência do modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal permanece a superfície de comunicação.

## Configuração rápida

Para usar o harness Codex para turnos de agente GPT, mantenha a referência do modelo canônica como
`openai/gpt-*`, habilite o Plugin `codex` incluído e defina
`agentRuntime.id: "codex"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Se sua configuração usar `plugins.allow`, inclua `codex` lá também:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Não use `openai-codex/gpt-*` para este caminho. Isso seleciona OAuth do Codex por meio
do executor PI normal, a menos que você force um runtime separadamente. Alterações de configuração se aplicam
a sessões novas ou redefinidas; sessões existentes mantêm o runtime registrado.

## O que este Plugin muda

O Plugin `codex` incluído contribui várias capacidades separadas:

| Capacidade                        | Como você a usa                                      | O que ela faz                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime incorporado nativo           | `agentRuntime.id: "codex"`                          | Executa turnos de agente incorporados do OpenClaw por meio do app-server do Codex.                  |
| Comandos nativos de controle de chat      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula e controla threads do app-server do Codex a partir de uma conversa de mensagens.    |
| Provedor/catálogo do app-server do Codex | internos de `codex`, expostos por meio do harness     | Permite que o runtime descubra e valide modelos do app-server.                     |
| Caminho de compreensão de mídia do Codex    | caminhos de compatibilidade de modelo de imagem `codex/*`           | Executa turnos delimitados do app-server do Codex para modelos compatíveis de compreensão de imagens. |
| Relay de hooks nativos                 | Hooks de Plugin em torno de eventos nativos do Codex             | Permite que o OpenClaw observe/bloqueie eventos compatíveis de ferramenta/finalização nativos do Codex.  |

Habilitar o Plugin disponibiliza essas capacidades. Ele **não**:

- começa a usar o Codex para todos os modelos OpenAI
- converte referências de modelo `openai-codex/*` para o runtime nativo
- torna ACP/acpx o caminho Codex padrão
- troca a quente sessões existentes que já registraram um runtime PI
- substitui a entrega de canais, arquivos de sessão, armazenamento de perfis de autenticação ou
  roteamento de mensagens do OpenClaw

O mesmo Plugin também é responsável pela superfície nativa de comando de controle de chat `/codex`. Se
o Plugin estiver habilitado e o usuário pedir para vincular, retomar, direcionar, parar ou inspecionar
threads do Codex a partir do chat, os agentes devem preferir `/codex ...` em vez de ACP. ACP permanece
o fallback explícito quando o usuário pede ACP/acpx ou está testando o adaptador ACP
do Codex.

Turnos nativos do Codex mantêm hooks de Plugin do OpenClaw como a camada pública de compatibilidade.
Estes são hooks em processo do OpenClaw, não hooks de comando `hooks.json` do Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcrição espelhados
- `before_agent_finalize` por meio do relay `Stop` do Codex
- `agent_end`

Plugins também podem registrar middleware de resultado de ferramenta neutro em relação ao runtime para reescrever
resultados de ferramentas dinâmicas do OpenClaw depois que o OpenClaw executa a ferramenta e antes que o
resultado seja retornado ao Codex. Isso é separado do hook público de Plugin
`tool_result_persist`, que transforma gravações de resultado de ferramenta de transcrição pertencentes ao OpenClaw.

Para a semântica dos hooks de Plugin em si, consulte [Hooks de Plugin](/pt-BR/plugins/hooks)
e [Comportamento de guarda de Plugin](/pt-BR/tools/plugin).

O harness fica desativado por padrão. Novas configurações devem manter referências de modelo OpenAI
canônicas como `openai/gpt-*` e forçar explicitamente
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` quando
quiserem execução nativa no app-server. Referências de modelo legadas `codex/*` ainda selecionam automaticamente
o harness para compatibilidade, mas prefixos legados de provedor com runtime não são
mostrados como escolhas normais de modelo/provedor.

Se o Plugin `codex` estiver habilitado, mas o modelo primário ainda for
`openai-codex/*`, `openclaw doctor` avisa em vez de alterar a rota. Isso é
intencional: `openai-codex/*` permanece o caminho PI de OAuth/assinatura do Codex, e
a execução nativa no app-server continua sendo uma escolha explícita de runtime.

## Mapa de rotas

Use esta tabela antes de alterar a configuração:

| Comportamento desejado                            | Referência do modelo                  | Configuração de runtime                         | Requisito de Plugin          | Rótulo de status esperado          |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| API OpenAI por meio do executor normal do OpenClaw   | `openai/gpt-*`             | omitido ou `runtime: "pi"`             | Provedor OpenAI             | `Runtime: OpenClaw Pi Default` |
| OAuth/assinatura do Codex por meio de PI         | `openai-codex/gpt-*`       | omitido ou `runtime: "pi"`             | Provedor OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Turnos incorporados nativos do app-server do Codex      | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| Provedores mistos com modo automático conservador | referências específicas do provedor     | `agentRuntime.id: "auto"`              | Runtimes de Plugin opcionais    | Depende do runtime selecionado    |
| Sessão explícita do adaptador Codex ACP          | dependente de prompt/modelo ACP | `sessions_spawn` com `runtime: "acp"` | backend `acpx` saudável      | Status de tarefa/sessão ACP        |

A divisão importante é provedor versus runtime:

- `openai-codex/*` responde "qual rota de provedor/autenticação o PI deve usar?"
- `agentRuntime.id: "codex"` responde "qual loop deve executar este
  turno incorporado?"
- `/codex ...` responde "a qual conversa nativa do Codex este chat deve se vincular
  ou controlar?"
- ACP responde "qual processo de harness externo o acpx deve iniciar?"

## Escolha o prefixo de modelo correto

Rotas da família OpenAI são específicas por prefixo. Use `openai-codex/*` quando quiser
OAuth do Codex por meio de PI; use `openai/*` quando quiser acesso direto à API OpenAI ou
quando estiver forçando o harness nativo do app-server do Codex:

| Referência do modelo                                     | Caminho de runtime                                 | Use quando                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provedor OpenAI por meio da infraestrutura OpenClaw/PI | Você quer acesso direto atual à API OpenAI Platform com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex por meio do OpenClaw/PI       | Você quer autenticação de assinatura ChatGPT/Codex com o executor PI padrão.      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness do app-server do Codex                     | Você quer execução nativa no app-server do Codex para o turno de agente incorporado.   |

GPT-5.5 atualmente é apenas por assinatura/OAuth no OpenClaw. Use
`openai-codex/gpt-5.5` para OAuth via PI, ou `openai/gpt-5.5` com o harness
do app-server do Codex. Acesso direto por chave de API para `openai/gpt-5.5` é compatível
quando a OpenAI habilitar o GPT-5.5 na API pública.

Referências legadas `codex/gpt-*` continuam aceitas como aliases de compatibilidade. A migração de
compatibilidade do doctor reescreve referências legadas de runtime primário para referências canônicas de modelo
e registra a política de runtime separadamente, enquanto referências legadas apenas de fallback
ficam inalteradas porque o runtime é configurado para todo o contêiner do agente.
Novas configurações PI de OAuth do Codex devem usar `openai-codex/gpt-*`; novas configurações do harness
nativo do app-server devem usar `openai/gpt-*` mais
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use
`openai-codex/gpt-*` quando a compreensão de imagens deve executar por meio do caminho do provedor OAuth OpenAI
Codex. Use `codex/gpt-*` quando a compreensão de imagens deve executar
por meio de um turno delimitado do app-server do Codex. O modelo do app-server do Codex deve
anunciar suporte a entrada de imagem; modelos Codex somente texto falham antes do turno de mídia
começar.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a
seleção for surpreendente, habilite logs de depuração para o subsistema `agents/harness`
e inspecione o registro estruturado `agent harness selected` do Gateway. Ele
inclui o id do harness selecionado, motivo da seleção, política de runtime/fallback e,
no modo `auto`, o resultado de suporte de cada candidato de Plugin.

### O que significam os avisos do doctor

`openclaw doctor` avisa quando tudo isto é verdadeiro:

- o Plugin `codex` incluído está habilitado ou permitido
- o modelo primário de um agente é `openai-codex/*`
- o runtime efetivo desse agente não é `codex`

Esse aviso existe porque usuários frequentemente esperam que "Plugin Codex habilitado" implique
"runtime nativo do app-server do Codex." O OpenClaw não faz esse salto. O aviso
significa:

- **Nenhuma alteração é necessária** se você pretendia usar OAuth ChatGPT/Codex por meio de PI.
- Altere o modelo para `openai/<model>` e defina
  `agentRuntime.id: "codex"` se você pretendia execução nativa no app-server.
- Sessões existentes ainda precisam de `/new` ou `/reset` após uma alteração de runtime,
  porque pins de runtime de sessão são persistentes.

A seleção de harness não é um controle de sessão ao vivo. Quando um turno incorporado é executado,
o OpenClaw registra o id do harness selecionado nessa sessão e continua usando-o para
turnos posteriores no mesmo id de sessão. Altere a configuração `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro harness;
use `/new` ou `/reset` para iniciar uma sessão nova antes de alternar uma conversa existente
entre PI e Codex. Isso evita reproduzir uma transcrição por meio
de dois sistemas de sessão nativos incompatíveis.

Sessões legadas criadas antes dos pins de harness são tratadas como fixadas em PI assim que
têm histórico de transcrição. Use `/new` ou `/reset` para optar essa conversa pelo
Codex após alterar a configuração.

`/status` mostra o runtime efetivo do modelo. O harness PI padrão aparece como
`Runtime: OpenClaw Pi Default`, e o harness do app-server do Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw com o Plugin `codex` incluído disponível.
- app-server do Codex `0.125.0` ou mais recente. O Plugin incluído gerencia um binário
  compatível do app-server do Codex por padrão, portanto comandos locais `codex` em `PATH` não
  afetam a inicialização normal do harness.
- Autenticação do Codex disponível para o processo do app-server ou para a ponte de autenticação Codex
  do OpenClaw. Inicializações locais do app-server por stdio usam uma home Codex gerenciada pelo OpenClaw para cada
  agente e um `HOME` filho isolado, portanto não leem sua conta pessoal
  `~/.codex`, Skills, plugins, configuração, estado de thread ou
  `$HOME/.agents/skills` nativo por padrão.

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. Isso mantém
o OpenClaw na superfície de protocolo contra a qual foi testado.

Para testes smoke ao vivo e em Docker, a autenticação geralmente vem da conta da CLI Codex
ou de um perfil de autenticação `openai-codex` do OpenClaw. Inicializações locais do app-server por stdio também podem
recorrer a `CODEX_API_KEY` / `OPENAI_API_KEY` quando nenhuma conta está presente.

## Adicionar Codex junto a outros modelos

Não defina `agentRuntime.id: "codex"` globalmente se o mesmo agente deve alternar livremente
entre modelos de provedores Codex e não Codex. Um runtime forçado se aplica a todo
turno embutido desse agente ou dessa sessão. Se você selecionar um modelo da Anthropic enquanto
esse runtime estiver forçado, o OpenClaw ainda tenta usar o harness do Codex e falha em modo fechado
em vez de rotear silenciosamente esse turno pelo PI.

Use um destes formatos em vez disso:

- Coloque o Codex em um agente dedicado com `agentRuntime.id: "codex"`.
- Mantenha o agente padrão em `agentRuntime.id: "auto"` e fallback PI para uso normal com provedores mistos.
- Use referências legadas `codex/*` apenas para compatibilidade. Novas configurações devem preferir
  `openai/*` mais uma política explícita de runtime do Codex.

Por exemplo, isto mantém o agente padrão na seleção automática normal e
adiciona um agente Codex separado:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Com este formato:

- O agente `main` padrão usa o caminho normal do provedor e o fallback de compatibilidade PI.
- O agente `codex` usa o harness de app-server do Codex.
- Se o Codex estiver ausente ou não for compatível para o agente `codex`, o turno falha
  em vez de usar PI silenciosamente.

## Roteamento de comandos do agente

Os agentes devem rotear solicitações de usuários por intenção, não apenas pela palavra "Codex":

| O usuário pede para...                                  | O agente deve usar...                            |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Vincule este chat ao Codex"                             | `/codex bind`                                    |
| "Retome o thread Codex `<id>` aqui"                      | `/codex resume <id>`                             |
| "Mostre os threads Codex"                                | `/codex threads`                                 |
| "Registre um relatório de suporte para uma execução ruim do Codex" | `/diagnostics [note]`                            |
| "Envie apenas feedback do Codex para este thread anexado" | `/codex diagnostics [note]`                      |
| "Use Codex como runtime para este agente"                | alteração de configuração para `agentRuntime.id` |
| "Use minha assinatura ChatGPT/Codex com OpenClaw normal" | referências de modelo `openai-codex/*`           |
| "Execute Codex por ACP/acpx"                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicie Claude Code/Gemini/OpenCode/Cursor em um thread" | ACP/acpx, não `/codex` e não subagentes nativos  |

O OpenClaw só anuncia orientação de spawn ACP aos agentes quando ACP está habilitado,
despachável e respaldado por um backend de runtime carregado. Se ACP não estiver disponível,
o prompt do sistema e as Skills de Plugin não devem ensinar o agente sobre roteamento
ACP.

## Implantações somente Codex

Force o harness do Codex quando você precisar provar que todo turno de agente embutido
usa Codex. Runtimes explícitos de Plugin têm como padrão não usar fallback PI, então
`fallback: "none"` é opcional, mas muitas vezes útil como documentação:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Sobrescrita de ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Com Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver desabilitado, se o
app-server for antigo demais ou se o app-server não puder iniciar. Defina
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` somente se você quiser intencionalmente que PI lide com
seleção de harness ausente.

## Codex por agente

Você pode tornar um agente exclusivo para Codex enquanto o agente padrão mantém a
seleção automática normal:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Use comandos normais de sessão para alternar entre agentes e modelos. `/new` cria uma nova
sessão OpenClaw e o harness do Codex cria ou retoma seu thread app-server auxiliar
conforme necessário. `/reset` limpa a vinculação da sessão OpenClaw para esse thread
e permite que o próximo turno resolva o harness a partir da configuração atual novamente.

## Descoberta de modelos

Por padrão, o Plugin Codex solicita ao app-server os modelos disponíveis. Se a
descoberta falhar ou atingir timeout, ele usa um catálogo de fallback integrado para:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Você pode ajustar a descoberta em `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Desabilite a descoberta quando quiser que a inicialização evite sondar o Codex e use
o catálogo de fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Conexão e política do app-server

Por padrão, o Plugin inicia localmente o binário Codex gerenciado pelo OpenClaw com:

```bash
codex app-server --listen stdio://
```

O binário gerenciado é declarado como uma dependência de runtime de Plugin integrada e preparado
com o restante das dependências do Plugin `codex`. Isso mantém a versão do app-server
vinculada ao Plugin integrado em vez de qualquer CLI Codex separada que
por acaso esteja instalada localmente. Defina `appServer.command` somente quando você
quiser intencionalmente executar um executável diferente.

Por padrão, o OpenClaw inicia sessões locais do harness Codex em modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa é a postura de operador local confiável usada
para Heartbeats autônomos: o Codex pode usar ferramentas de shell e rede sem
parar em prompts de aprovação nativos que ninguém está presente para responder.

Para optar por aprovações revisadas pelo guardião do Codex, defina `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

O modo Guardian usa o caminho de aprovação com revisão automática nativo do Codex. Quando o Codex pede para
sair do sandbox, escrever fora do workspace ou adicionar permissões como acesso à rede,
o Codex roteia essa solicitação de aprovação ao revisor nativo em vez de a um
prompt humano. O revisor aplica o framework de risco do Codex e aprova ou nega
a solicitação específica. Use Guardian quando quiser mais proteções do que o modo YOLO,
mas ainda precisar que agentes sem supervisão progridam.

O preset `guardian` expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
Campos de política individuais ainda sobrescrevem `mode`, então implantações avançadas podem combinar
o preset com escolhas explícitas. O valor de revisor mais antigo `guardian_subagent` ainda é
aceito como alias de compatibilidade, mas novas configurações devem usar
`auto_review`.

Para um app-server já em execução, use transporte WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Inicializações de app-server por stdio herdam o ambiente de processo do OpenClaw por padrão,
mas o OpenClaw possui a ponte de conta do app-server Codex e define tanto
`CODEX_HOME` quanto `HOME` para diretórios por agente sob o estado OpenClaw
desse agente. O próprio carregador de Skills do Codex lê `$CODEX_HOME/skills` e
`$HOME/.agents/skills`, então ambos os valores são isolados para inicializações locais de app-server.
Isso mantém Skills, plugins, configuração, contas e estado de thread nativos do Codex
escopados ao agente OpenClaw em vez de vazarem da home pessoal da CLI Codex
do operador.

Plugins OpenClaw e snapshots de Skills OpenClaw ainda passam pelo próprio
registro de Plugin e carregador de Skills do OpenClaw. Ativos pessoais da CLI Codex não. Se você tiver
Skills ou plugins úteis da CLI Codex que devam se tornar parte de um agente OpenClaw,
inventarie-os explicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

O provedor de migração Codex copia Skills para o workspace atual do agente OpenClaw.
Plugins nativos do Codex, hooks e arquivos de configuração são relatados ou arquivados
para revisão manual em vez de serem ativados automaticamente, porque podem
executar comandos, expor servidores MCP ou carregar credenciais.

A autenticação é selecionada nesta ordem:

1. Um perfil explícito de autenticação Codex do OpenClaw para o agente.
2. A conta existente do app-server na home Codex desse agente.
3. Apenas para inicializações locais de app-server por stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta de app-server estiver presente e a autenticação OpenAI
   ainda for necessária.

Quando o OpenClaw vê um perfil de autenticação Codex no estilo de assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho Codex iniciado. Isso
mantém chaves de API em nível de Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer turnos nativos do app-server Codex serem cobrados pela API por acidente.
Perfis explícitos de chave de API Codex e fallback local por chave de ambiente stdio usam login no app-server
em vez de ambiente herdado do processo filho. Conexões WebSocket com app-server
não recebem fallback de chave de API de ambiente do Gateway; use um perfil explícito de autenticação ou a
própria conta do app-server remoto.

Se uma implantação precisar de isolamento adicional de ambiente, adicione essas variáveis a
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` afeta apenas o processo filho do app-server Codex iniciado.

Campos `appServer` compatíveis:

| Campo               | Padrão                                   | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                             |
| `command`           | binário Codex gerenciado                 | Executável para transporte stdio. Deixe sem definir para usar o binário gerenciado; defina apenas para uma substituição explícita.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                                                                                                                                       |
| `url`               | não definido                             | URL do app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | não definido                             | Token Bearer para transporte WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Cabeçalhos WebSocket extras.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nomes de variáveis de ambiente extras removidos do processo app-server stdio iniciado depois que o OpenClaw monta seu ambiente herdado. `CODEX_HOME` e `HOME` são reservados para o isolamento Codex por agente do OpenClaw em inicializações locais. |
| `requestTimeoutMs`  | `60000`                                  | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Predefinição para execução YOLO ou revisada por guardião.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Política de aprovação nativa do Codex enviada para início/retomada/turno de thread.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo do Codex enviado para início/retomada de thread.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos. `guardian_subagent` permanece como um alias legado.                                                                                                                         |
| `serviceTier`       | não definido                             | Camada de serviço opcional do app-server Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados.                                                                                                                            |

Chamadas de ferramentas dinâmicas de propriedade do OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`: cada solicitação Codex `item/tool/call` deve receber
uma resposta do OpenClaw em até 30 segundos. Em caso de tempo limite, o OpenClaw aborta o sinal da ferramenta
quando houver suporte e retorna uma resposta de ferramenta dinâmica com falha ao Codex para que
o turno possa continuar em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação de app-server com escopo de turno do Codex, o harness
também espera que o Codex finalize o turno nativo com `turn/completed`. Se o
app-server ficar silencioso por 60 segundos após essa resposta, o OpenClaw, em melhor esforço,
interrompe o turno do Codex, registra um tempo limite de diagnóstico e libera a
faixa de sessão do OpenClaw para que mensagens de chat subsequentes não fiquem enfileiradas atrás de um turno
nativo obsoleto.

Substituições de ambiente continuam disponíveis para testes locais:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora o binário gerenciado quando
`appServer.command` não está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removido. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` em vez disso, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A configuração é
preferida para implantações repetíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness Codex.

## Uso do computador

O Uso do Computador é abordado em seu próprio guia de configuração:
[Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não inclui como vendor o app de controle de desktop nem executa
ações de desktop por conta própria. Ele prepara o app-server Codex, verifica se o servidor MCP
`computer-use` está disponível e, então, permite que o Codex lide com as chamadas nativas de ferramenta
MCP durante turnos em modo Codex.

Para acesso direto ao driver TryCua fora do fluxo do marketplace Codex, registre
`cua-driver mcp` com `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulte [Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use) para a distinção
entre o Uso do Computador de propriedade do Codex e o registro MCP direto.

Configuração mínima:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

A configuração pode ser verificada ou instalada pela superfície de comando:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

O Uso do Computador é específico do macOS e pode exigir permissões locais do sistema operacional antes que o
servidor MCP do Codex possa controlar apps. Se `computerUse.enabled` for true e o servidor MCP
estiver indisponível, turnos em modo Codex falham antes de a thread iniciar em vez de
executar silenciosamente sem as ferramentas nativas de Uso do Computador. Consulte
[Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use) para opções de marketplace,
limites de catálogo remoto, motivos de status e solução de problemas.

Quando `computerUse.autoInstall` for true, o OpenClaw pode registrar o marketplace padrão
Codex Desktop empacotado de
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se o Codex
ainda não tiver descoberto um marketplace local. Use `/new` ou `/reset` depois de
alterar a configuração de runtime ou Uso do Computador para que sessões existentes não mantenham uma vinculação antiga
de PI ou thread Codex.

## Receitas comuns

Codex local com transporte stdio padrão:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validação de harness somente Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Aprovações do Codex revisadas por guardião:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remoto com cabeçalhos explícitos:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

A troca de modelo permanece controlada pelo OpenClaw. Quando uma sessão do OpenClaw está anexada
a uma thread Codex existente, o próximo turno envia o modelo
OpenAI selecionado no momento, provedor, política de aprovação, sandbox e camada de serviço para o
app-server novamente. Trocar de `openai/gpt-5.5` para `openai/gpt-5.2` mantém a
vinculação da thread, mas pede ao Codex para continuar com o novo modelo selecionado.

## Comando Codex

O Plugin empacotado registra `/codex` como um comando de barra autorizado. Ele é
genérico e funciona em qualquer canal que ofereça suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade ativa do app-server, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista modelos ativos do app-server Codex.
- `/codex threads [filter]` lista threads Codex recentes.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma thread Codex existente.
- `/codex compact` solicita que o app-server Codex compacte a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pergunta antes de enviar feedback de diagnóstico do Codex para a thread anexada.
- `/codex computer-use status` verifica o Plugin de Uso do Computador configurado e o servidor MCP.
- `/codex computer-use install` instala o Plugin de Uso do Computador configurado e recarrega servidores MCP.
- `/codex account` mostra a conta e o status de limite de taxa.
- `/codex mcp` lista o status dos servidores MCP do app-server Codex.
- `/codex skills` lista as Skills do app-server Codex.

### Fluxo de trabalho comum de depuração

Quando um agente baseado em Codex faz algo surpreendente no Telegram, Discord, Slack
ou outro canal, comece pela conversa em que o problema aconteceu:

1. Execute `/diagnostics bad tool choice after image upload` ou outra nota curta
   que descreva o que você viu.
2. Aprove a solicitação de diagnóstico uma vez. A aprovação cria o zip de diagnóstico local do Gateway
   e, como a sessão está usando o harness Codex, também
   envia o pacote de feedback Codex relevante para servidores OpenAI.
3. Copie a resposta de diagnóstico concluída para o relatório de bug ou thread de suporte.
   Ela inclui o caminho do pacote local, resumo de privacidade, ids de sessão do OpenClaw,
   ids de thread Codex e uma linha `Inspect locally` para cada thread Codex.
4. Se quiser depurar a execução por conta própria, execute o comando `Inspect locally`
   impresso em um terminal. Ele se parece com `codex resume <thread-id>` e abre a
   thread nativa do Codex para que você possa inspecionar a conversa, continuá-la localmente
   ou perguntar ao Codex por que ele escolheu uma ferramenta ou plano específico.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o upload de feedback do Codex para a thread anexada no momento sem o pacote completo de diagnósticos do Gateway do OpenClaw. Para a maioria dos relatórios de suporte, `/diagnostics [note]` é o melhor ponto de partida, porque ele vincula o estado do Gateway local e os ids de thread do Codex em uma única resposta. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para o modelo completo de privacidade e o comportamento em chats em grupo.

O núcleo do OpenClaw também expõe `/diagnostics [note]`, exclusivo para proprietários, como o comando geral de diagnósticos do Gateway. O prompt de aprovação exibe o preâmbulo sobre dados sensíveis, vincula a [Exportação de Diagnósticos](/pt-BR/gateway/diagnostics) e solicita `openclaw gateway diagnostics export --json` por meio de aprovação explícita de execução todas as vezes. Não aprove diagnósticos com uma regra permitir tudo. Após a aprovação, o OpenClaw envia um relatório colável com o caminho do pacote local e o resumo do manifesto. Quando a sessão ativa do OpenClaw está usando o ambiente de execução do Codex, essa mesma aprovação também autoriza o envio dos pacotes de feedback relevantes do Codex para os servidores da OpenAI. O prompt de aprovação informa que o feedback do Codex será enviado, mas não lista ids de sessão ou thread do Codex antes da aprovação.

Se `/diagnostics` for invocado por um proprietário em um chat em grupo, o OpenClaw mantém o canal compartilhado limpo: o grupo recebe apenas um aviso curto, enquanto o preâmbulo de diagnósticos, os prompts de aprovação e os ids de sessão/thread do Codex são enviados ao proprietário pela rota privada de aprovação. Se não houver uma rota privada para o proprietário, o OpenClaw recusa a solicitação do grupo e pede que o proprietário a execute por uma DM.

O upload aprovado do Codex chama `feedback/upload` do app-server do Codex e solicita que o app-server inclua logs para cada thread listada e subthreads do Codex geradas quando disponíveis. O upload passa pelo caminho normal de feedback do Codex para os servidores da OpenAI; se o feedback do Codex estiver desativado nesse app-server, o comando retorna o erro do app-server. A resposta de diagnósticos concluída lista os canais, ids de sessão do OpenClaw, ids de thread do Codex e comandos locais `codex resume <thread-id>` para as threads que foram enviadas. Se você negar ou ignorar a aprovação, o OpenClaw não imprime esses ids do Codex. Esse upload não substitui a exportação local de diagnósticos do Gateway.

`/codex resume` grava o mesmo arquivo de vinculação sidecar que o ambiente de execução usa para turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread do Codex, passa o modelo do OpenClaw selecionado no momento para o app-server e mantém o histórico estendido ativado.

### Inspecionar uma thread do Codex pela CLI

A maneira mais rápida de entender uma execução problemática do Codex muitas vezes é abrir a thread nativa do Codex diretamente:

```sh
codex resume <thread-id>
```

Use isso quando você perceber um bug em uma conversa de canal e quiser inspecionar a sessão problemática do Codex, continuá-la localmente ou perguntar ao Codex por que ele fez uma escolha específica de ferramenta ou raciocínio. O caminho mais fácil geralmente é executar `/diagnostics [note]` primeiro: depois que você o aprova, o relatório concluído lista cada thread do Codex e imprime um comando `Inspecionar localmente`, por exemplo `codex resume <thread-id>`. Você pode copiar esse comando diretamente para um terminal.

Você também pode obter um id de thread em `/codex binding` para o chat atual ou `/codex threads [filter]` para threads recentes do app-server do Codex e, em seguida, executar o mesmo comando `codex resume` no seu shell.

A superfície de comandos exige app-server do Codex `0.125.0` ou mais recente. Métodos de controle individuais são relatados como `unsupported by this Codex app-server` se um app-server futuro ou personalizado não expuser esse método JSON-RPC.

## Limites de hooks

O ambiente de execução do Codex tem três camadas de hooks:

| Camada                                | Proprietário             | Finalidade                                                          |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin do OpenClaw           | OpenClaw                 | Compatibilidade de produto/Plugin entre ambientes de execução PI e Codex. |
| Middleware de extensão do app-server do Codex | Plugins incluídos no OpenClaw | Comportamento do adaptador por turno em torno das ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política de ferramentas nativas a partir da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para rotear o comportamento de Plugin do OpenClaw. Para a ponte compatível de ferramentas nativas e permissões, o OpenClaw injeta configuração do Codex por thread para `PreToolUse`, `PostToolUse`, `PermissionRequest` e `Stop`. Outros hooks do Codex, como `SessionStart` e `UserPromptSubmit`, continuam sendo controles no nível do Codex; eles não são expostos como hooks de Plugin do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita a chamada, então o OpenClaw dispara o comportamento de Plugin e middleware que ele controla no adaptador do ambiente de execução. Para ferramentas nativas do Codex, o Codex controla o registro canônico da ferramenta. O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex, a menos que o Codex exponha essa operação por meio do app-server ou de callbacks de hooks nativos.

Projeções de Compaction e ciclo de vida do LLM vêm de notificações do app-server do Codex e do estado do adaptador do OpenClaw, não de comandos de hooks nativos do Codex. Os eventos `before_compaction`, `after_compaction`, `llm_input` e `llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte da solicitação interna ou dos payloads de Compaction do Codex.

As notificações `hook/started` e `hook/completed` nativas do Codex no app-server são projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração. Elas não invocam hooks de Plugin do OpenClaw.

## Contrato de suporte V1

O modo Codex não é PI com uma chamada de modelo diferente por baixo. O Codex controla uma parte maior do loop nativo do modelo, e o OpenClaw adapta suas superfícies de Plugin e sessão em torno desse limite.

Compatível no runtime Codex v1:

| Superfície                                    | Suporte                                 | Por quê                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo OpenAI por meio do Codex       | Compatível                              | O app-server do Codex controla o turno da OpenAI, a retomada de thread nativa e a continuação de ferramenta nativa.                                                                                  |
| Roteamento e entrega de canais do OpenClaw    | Compatível                              | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais permanecem fora do runtime do modelo.                                                                                                    |
| Ferramentas dinâmicas do OpenClaw             | Compatível                              | O Codex pede que o OpenClaw execute essas ferramentas, então o OpenClaw permanece no caminho de execução.                                                                                              |
| Plugins de prompt e contexto                  | Compatível                              | O OpenClaw cria sobreposições de prompt e projeta contexto no turno do Codex antes de iniciar ou retomar a thread.                                                                                    |
| Ciclo de vida do mecanismo de contexto        | Compatível                              | Montagem, ingestão ou manutenção pós-turno e coordenação de Compaction do mecanismo de contexto são executadas para turnos do Codex.                                                                  |
| Hooks de ferramentas dinâmicas                | Compatível                              | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta são executados em torno de ferramentas dinâmicas controladas pelo OpenClaw.                                               |
| Hooks de ciclo de vida                        | Compatível como observações do adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex.                                                                        |
| Gate de revisão da resposta final             | Compatível por meio do relay de hook nativo | `Stop` do Codex é retransmitido para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem de modelo antes da finalização.                                                               |
| Shell, patch e bloqueio ou observação de MCP nativos | Compatível por meio do relay de hook nativo | `PreToolUse` e `PostToolUse` do Codex são retransmitidos para superfícies de ferramentas nativas confirmadas, incluindo payloads MCP no app-server do Codex `0.125.0` ou mais recente. O bloqueio é compatível; a reescrita de argumentos não é. |
| Política de permissão nativa                  | Compatível por meio do relay de hook nativo | `PermissionRequest` do Codex pode ser roteado pela política do OpenClaw onde o runtime a expõe. Se o OpenClaw não retornar nenhuma decisão, o Codex continua pelo seu caminho normal de guardião ou aprovação do usuário. |
| Captura de trajetória do app-server           | Compatível                              | O OpenClaw registra a solicitação que enviou ao app-server e as notificações do app-server que recebe.                                                                                                |

Não compatível no runtime Codex v1:

| Superfície                                         | Limite da V1                                                                                                                                     | Caminho futuro                                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Mutação de argumentos de ferramenta nativa         | Hooks pré-ferramenta nativos do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.                  | Requer suporte de hook/schema do Codex para substituir a entrada da ferramenta.                  |
| Histórico editável de transcrição nativa do Codex  | O Codex possui o histórico canônico de threads nativas. O OpenClaw possui um espelho e pode projetar contexto futuro, mas não deve mutar partes internas sem suporte. | Adicionar APIs explícitas do app-server do Codex se for necessária cirurgia em threads nativas. |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma gravações de transcrição pertencentes ao OpenClaw, não registros de ferramentas nativas do Codex.                            | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex. |
| Metadados ricos de compaction nativa               | O OpenClaw observa o início e a conclusão da compaction, mas não recebe uma lista estável de mantidos/removidos, delta de tokens ou payload de resumo. | Precisa de eventos de compaction mais ricos do Codex.                                           |
| Intervenção de compaction                          | Os hooks atuais de compaction do OpenClaw são de nível de notificação no modo Codex.                                                              | Adicionar hooks pré/pós-compaction do Codex se plugins precisarem vetar ou reescrever a compaction nativa. |
| Captura byte a byte da solicitação da API de modelo | O OpenClaw pode capturar solicitações e notificações do app-server, mas o núcleo do Codex constrói internamente a solicitação final da API da OpenAI. | Precisa de um evento de rastreamento de solicitação de modelo do Codex ou de uma API de depuração. |

## Ferramentas, mídia e compaction

O harness do Codex altera apenas o executor de agente incorporado de baixo nível.

O OpenClaw ainda cria a lista de ferramentas e recebe resultados de ferramentas dinâmicas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramentas de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

O retransmissor de hooks nativos é intencionalmente genérico, mas o contrato de suporte da v1 é
limitado aos caminhos de ferramenta nativa e permissão do Codex que o OpenClaw testa. No
runtime do Codex, isso inclui payloads de shell, patch e MCP `PreToolUse`,
`PostToolUse` e `PermissionRequest`. Não presuma que todo evento futuro de hook do
Codex seja uma superfície de plugin do OpenClaw até que o contrato de runtime o nomeie.

Para `PermissionRequest`, o OpenClaw retorna apenas decisões explícitas de permitir ou negar
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como ausência de
decisão de hook e segue para seu próprio guardião ou caminho de aprovação do usuário.

As solicitações de aprovação de ferramentas MCP do Codex são roteadas pelo fluxo de aprovação de plugin
do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação de servidor
nativa em vez de ser direcionada como contexto extra. Outras solicitações de elicitação MCP
ainda falham fechadas.

O direcionamento de fila de execução ativa mapeia para `turn/steer` do app-server do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa mensagens de chat enfileiradas
pela janela de silêncio configurada e as envia como uma solicitação `turn/steer` em
ordem de chegada. O modo legado `queue` envia solicitações `turn/steer` separadas. Turnos de
revisão e compaction manual do Codex podem rejeitar direcionamento no mesmo turno; nesse caso
o OpenClaw usa a fila de acompanhamento quando o modo selecionado permite fallback. Consulte
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

Quando o modelo selecionado usa o harness do Codex, a compaction de thread nativa é
delegada ao app-server do Codex. O OpenClaw mantém um espelho da transcrição para histórico
do canal, busca, `/new`, `/reset` e futura troca de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de
raciocínio ou plano do Codex quando o app-server os emite. Hoje, o OpenClaw apenas
registra sinais de início e conclusão de compaction nativa. Ele ainda não expõe um
resumo de compaction legível por humanos nem uma lista auditável de quais entradas o Codex
manteve após a compaction.

Como o Codex possui a thread nativa canônica, `tool_result_persist` não
reescreve atualmente registros de resultado de ferramentas nativas do Codex. Ele só se aplica quando
o OpenClaw está gravando um resultado de ferramenta de transcrição de sessão pertencente ao OpenClaw.

A geração de mídia não requer PI. Imagem, vídeo, música, PDF, TTS e compreensão de mídia
continuam usando as configurações de provedor/modelo correspondentes, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**O Codex não aparece como um provedor `/model` normal:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*` com
`agentRuntime.id: "codex"` (ou uma referência legada `codex/*`), habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa PI em vez do Codex:** `agentRuntime.id: "auto"` ainda pode usar PI como o
backend de compatibilidade quando nenhum harness do Codex reivindica a execução. Defina
`agentRuntime.id: "codex"` para forçar a seleção do Codex durante os testes. Um
runtime Codex forçado agora falha em vez de voltar para PI, a menos que você
defina explicitamente `agentRuntime.fallback: "pi"`. Depois que o app-server do Codex é
selecionado, suas falhas aparecem diretamente sem configuração extra de fallback.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
informe a versão `0.125.0` ou mais recente. Pré-lançamentos da mesma versão ou versões com sufixo
de build, como `0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o
piso de protocolo estável `0.125.0` é o que o OpenClaw testa.

**A descoberta de modelos está lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desabilite a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão do protocolo de app-server do Codex.

**Um modelo que não é Codex usa PI:** isso é esperado, a menos que você tenha forçado
`agentRuntime.id: "codex"` para esse agente ou selecionado uma referência legada
`codex/*`. Referências simples `openai/gpt-*` e de outros provedores permanecem em seu caminho normal
de provedor no modo `auto`. Se você forçar `agentRuntime.id: "codex"`, todo turno incorporado
desse agente deve ser um modelo OpenAI compatível com o Codex.

**Computer Use está instalado, mas as ferramentas não são executadas:** verifique
`/codex computer-use status` em uma sessão nova. Se uma ferramenta informar
`Native hook relay unavailable`, use `/new` ou `/reset`; se persistir, reinicie
o gateway para limpar registros obsoletos de hooks nativos. Se `computer-use.list_apps`
atingir tempo limite, reinicie o Codex Computer Use ou o Codex Desktop e tente novamente.

## Relacionados

- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Status](/pt-BR/cli/status)
- [Hooks de plugin](/pt-BR/plugins/hooks)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
