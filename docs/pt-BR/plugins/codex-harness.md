---
read_when:
    - Você quer usar o arcabouço de app-server incluído no Codex
    - Você precisa de exemplos de configuração do harness do Codex
    - Você quer que implantações somente com Codex falhem em vez de recorrer ao PI
summary: Execute turnos do agente incorporado do OpenClaw por meio do mecanismo app-server do Codex incluído
title: Ambiente de execução do Codex
x-i18n:
    generated_at: "2026-04-30T20:05:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 335ec60cbdb76579db833eccb5151ffc5bcd28b370ca2e99587abdb578eeee4f
    source_path: plugins/codex-harness.md
    workflow: 16
---

O Plugin `codex` incluído permite que o OpenClaw execute turnos de agente incorporados por meio do
app-server do Codex em vez do harness Pi integrado.

Use isto quando você quiser que o Codex seja responsável pela sessão de agente de baixo nível: descoberta de modelos, retomada nativa de thread, Compaction nativa e execução no app-server.
O OpenClaw ainda é responsável por canais de chat, arquivos de sessão, seleção de modelo, ferramentas,
aprovações, entrega de mídia e o espelho visível da transcrição.

Se você está tentando se orientar, comece por
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a referência de modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal permanece como a superfície de comunicação.

## O que este Plugin muda

O Plugin `codex` incluído contribui com várias capacidades separadas:

| Capacidade                        | Como você a usa                                      | O que ela faz                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime incorporado nativo        | `agentRuntime.id: "codex"`                          | Executa turnos de agente incorporado do OpenClaw por meio do app-server do Codex. |
| Comandos nativos de controle de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula e controla threads do app-server do Codex a partir de uma conversa de mensagens. |
| Provedor/catálogo do app-server do Codex | internos de `codex`, expostos por meio do harness | Permite que o runtime descubra e valide modelos do app-server. |
| Caminho de compreensão de mídia do Codex | caminhos de compatibilidade de modelos de imagem `codex/*` | Executa turnos delimitados do app-server do Codex para modelos compatíveis de compreensão de imagem. |
| Relay de hooks nativos            | Hooks de Plugin em torno de eventos nativos do Codex | Permite que o OpenClaw observe/bloqueie eventos compatíveis de ferramenta/finalização nativos do Codex. |

Habilitar o Plugin disponibiliza essas capacidades. Ele **não**:

- começa a usar Codex para todos os modelos OpenAI
- converte referências de modelo `openai-codex/*` no runtime nativo
- torna ACP/acpx o caminho padrão do Codex
- alterna a quente sessões existentes que já registraram um runtime Pi
- substitui a entrega de canais do OpenClaw, arquivos de sessão, armazenamento de perfil de autenticação ou
  roteamento de mensagens

O mesmo Plugin também é responsável pela superfície nativa de comandos de controle de chat `/codex`. Se
o Plugin estiver habilitado e o usuário pedir para vincular, retomar, orientar, parar ou inspecionar
threads do Codex pelo chat, os agentes devem preferir `/codex ...` em vez de ACP. ACP continua sendo
o fallback explícito quando o usuário pede ACP/acpx ou está testando o adaptador ACP
do Codex.

Turnos nativos do Codex mantêm hooks de Plugin do OpenClaw como a camada pública de compatibilidade.
Estes são hooks em processo do OpenClaw, não hooks de comando `hooks.json` do Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros espelhados de transcrição
- `before_agent_finalize` por meio do relay `Stop` do Codex
- `agent_end`

Plugins também podem registrar middleware de resultados de ferramenta neutro em relação a runtime para reescrever
resultados dinâmicos de ferramentas do OpenClaw depois que o OpenClaw executa a ferramenta e antes que o
resultado seja retornado ao Codex. Isso é separado do hook público de Plugin
`tool_result_persist`, que transforma gravações de resultados de ferramenta em transcrição pertencentes ao OpenClaw.

Para a semântica dos hooks de Plugin em si, consulte [Hooks de Plugin](/pt-BR/plugins/hooks)
e [Comportamento de guarda de Plugin](/pt-BR/tools/plugin).

O harness fica desativado por padrão. Novas configurações devem manter as referências de modelo OpenAI
canônicas como `openai/gpt-*` e forçar explicitamente
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` quando quiserem
execução nativa no app-server. Referências de modelo legadas `codex/*` ainda selecionam automaticamente
o harness por compatibilidade, mas prefixos de provedores legados com suporte de runtime
não são mostrados como escolhas normais de modelo/provedor.

Se o Plugin `codex` estiver habilitado, mas o modelo primário ainda for
`openai-codex/*`, `openclaw doctor` avisa em vez de alterar a rota. Isso é
intencional: `openai-codex/*` continua sendo o caminho de OAuth/assinatura Pi do Codex, e
a execução nativa no app-server permanece uma escolha explícita de runtime.

## Mapa de rotas

Use esta tabela antes de alterar a configuração:

| Comportamento desejado                   | Referência de modelo      | Configuração de runtime                | Requisito de Plugin         | Rótulo de status esperado       |
| ---------------------------------------- | ------------------------- | -------------------------------------- | --------------------------- | ------------------------------- |
| API da OpenAI pelo runner normal do OpenClaw | `openai/gpt-*`             | omitido ou `runtime: "pi"`             | Provedor OpenAI             | `Runtime: OpenClaw Pi Default`  |
| OAuth/assinatura do Codex por meio do Pi | `openai-codex/gpt-*`       | omitido ou `runtime: "pi"`             | Provedor OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default`  |
| Turnos incorporados nativos do app-server do Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`         |
| Provedores mistos com modo automático conservador | referências específicas do provedor | `agentRuntime.id: "auto"`              | Runtimes de Plugin opcionais | Depende do runtime selecionado  |
| Sessão explícita do adaptador ACP do Codex | dependente de prompt/modelo ACP | `sessions_spawn` com `runtime: "acp"` | backend `acpx` saudável     | Status de tarefa/sessão ACP     |

A divisão importante é provedor versus runtime:

- `openai-codex/*` responde "qual rota de provedor/autenticação o Pi deve usar?"
- `agentRuntime.id: "codex"` responde "qual loop deve executar este
  turno incorporado?"
- `/codex ...` responde "qual conversa nativa do Codex este chat deve vincular
  ou controlar?"
- ACP responde "qual processo de harness externo o acpx deve iniciar?"

## Escolha o prefixo de modelo correto

Rotas da família OpenAI são específicas por prefixo. Use `openai-codex/*` quando quiser
OAuth do Codex por meio do Pi; use `openai/*` quando quiser acesso direto à API da OpenAI ou
quando estiver forçando o harness nativo do app-server do Codex:

| Referência de modelo                       | Caminho de runtime                          | Use quando                                                                 |
| ------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                           | Provedor OpenAI pelo encanamento OpenClaw/Pi | Você quer acesso direto atual à API da OpenAI Platform com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                     | OAuth OpenAI Codex por meio do OpenClaw/Pi  | Você quer autenticação de assinatura ChatGPT/Codex com o runner Pi padrão. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness do app-server do Codex              | Você quer execução nativa do app-server do Codex para o turno de agente incorporado. |

GPT-5.5 atualmente só está disponível por assinatura/OAuth no OpenClaw. Use
`openai-codex/gpt-5.5` para OAuth Pi, ou `openai/gpt-5.5` com o harness
do app-server do Codex. O acesso direto por chave de API para `openai/gpt-5.5` é compatível
quando a OpenAI habilitar o GPT-5.5 na API pública.

Referências legadas `codex/gpt-*` continuam aceitas como aliases de compatibilidade. A migração de compatibilidade
do Doctor reescreve referências legadas de runtime primário para referências de modelo canônicas
e registra a política de runtime separadamente, enquanto referências legadas apenas de fallback
são deixadas inalteradas porque o runtime é configurado para todo o contêiner do agente.
Novas configurações OAuth Pi do Codex devem usar `openai-codex/gpt-*`; novas configurações nativas
de harness do app-server devem usar `openai/gpt-*` mais
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use
`openai-codex/gpt-*` quando a compreensão de imagem deve rodar pelo caminho do provedor OAuth OpenAI
Codex. Use `codex/gpt-*` quando a compreensão de imagem deve rodar
por meio de um turno delimitado do app-server do Codex. O modelo do app-server do Codex deve
anunciar suporte a entrada de imagem; modelos Codex somente de texto falham antes que o turno de mídia
comece.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a
seleção for surpreendente, habilite logs de depuração para o subsistema `agents/harness`
e inspecione o registro estruturado `agent harness selected` do gateway. Ele
inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e,
no modo `auto`, o resultado de suporte de cada candidato de Plugin.

### O que os avisos do doctor significam

`openclaw doctor` avisa quando tudo isto é verdadeiro:

- o Plugin `codex` incluído está habilitado ou permitido
- o modelo primário de um agente é `openai-codex/*`
- o runtime efetivo desse agente não é `codex`

Esse aviso existe porque usuários frequentemente esperam que "Plugin Codex habilitado" implique
"runtime nativo do app-server do Codex." O OpenClaw não faz esse salto. O aviso
significa:

- **Nenhuma alteração é necessária** se você pretendia usar OAuth ChatGPT/Codex por meio do Pi.
- Altere o modelo para `openai/<model>` e defina
  `agentRuntime.id: "codex"` se você pretendia execução nativa no app-server.
- Sessões existentes ainda precisam de `/new` ou `/reset` após uma alteração de runtime,
  porque pins de runtime de sessão são persistentes.

A seleção de harness não é um controle de sessão ao vivo. Quando um turno incorporado roda,
o OpenClaw registra o id do harness selecionado nessa sessão e continua usando-o para
turnos posteriores no mesmo id de sessão. Altere a configuração `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro harness;
use `/new` ou `/reset` para iniciar uma nova sessão antes de alternar uma conversa existente
entre Pi e Codex. Isso evita reproduzir uma transcrição por meio de
dois sistemas de sessão nativa incompatíveis.

Sessões legadas criadas antes dos pins de harness são tratadas como fixadas em Pi quando
têm histórico de transcrição. Use `/new` ou `/reset` para optar essa conversa pelo
Codex após alterar a configuração.

`/status` mostra o runtime de modelo efetivo. O harness Pi padrão aparece como
`Runtime: OpenClaw Pi Default`, e o harness do app-server do Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw com o Plugin `codex` incluído disponível.
- App-server do Codex `0.125.0` ou mais recente. O Plugin incluído gerencia um binário compatível
  do app-server do Codex por padrão, portanto comandos locais `codex` em `PATH` não
  afetam a inicialização normal do harness.
- Autenticação do Codex disponível para o processo do app-server ou para a ponte de autenticação Codex
  do OpenClaw. Inicializações locais do app-server stdio usam uma home do Codex gerenciada pelo OpenClaw para cada
  agente e um `HOME` filho isolado, portanto não leem sua conta pessoal
  `~/.codex`, Skills, Plugins, configuração, estado de thread ou
  `$HOME/.agents/skills` nativo por padrão.

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. Isso mantém
o OpenClaw na superfície de protocolo contra a qual ele foi testado.

Para testes de fumaça ao vivo e Docker, a autenticação geralmente vem da conta da CLI do Codex
ou de um perfil de autenticação `openai-codex` do OpenClaw. Inicializações locais do app-server stdio também podem
recorrer a `CODEX_API_KEY` / `OPENAI_API_KEY` quando nenhuma conta está presente.

## Configuração mínima

Use `openai/gpt-5.5`, habilite o Plugin incluído e force o harness `codex`:

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
      },
    },
  },
}
```

Se sua configuração usa `plugins.allow`, inclua `codex` ali também:

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

Configurações legadas que definem `agents.defaults.model` ou um modelo de agente como
`codex/<model>` ainda habilitam automaticamente o Plugin `codex` incluído. Novas configurações devem
preferir `openai/<model>` mais a entrada explícita `agentRuntime` acima.

## Adicionar Codex junto de outros modelos

Não defina `agentRuntime.id: "codex"` globalmente se o mesmo agente deve alternar livremente
entre Codex e modelos de provedores que não são Codex. Um runtime forçado se aplica a cada
turno incorporado desse agente ou sessão. Se você selecionar um modelo Anthropic enquanto
esse runtime estiver forçado, o OpenClaw ainda tentará o harness do Codex e falhará fechado
em vez de rotear silenciosamente esse turno pelo PI.

Use um destes formatos em vez disso:

- Coloque o Codex em um agente dedicado com `agentRuntime.id: "codex"`.
- Mantenha o agente padrão em `agentRuntime.id: "auto"` e fallback para PI para uso normal misto
  de provedores.
- Use refs legadas `codex/*` apenas para compatibilidade. Novas configurações devem preferir
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

- O agente padrão `main` usa o caminho normal do provedor e o fallback de compatibilidade do PI.
- O agente `codex` usa o harness app-server do Codex.
- Se o Codex estiver ausente ou sem suporte para o agente `codex`, o turno falhará
  em vez de usar o PI silenciosamente.

## Roteamento de comandos de agente

Agentes devem rotear solicitações de usuários por intenção, não apenas pela palavra "Codex":

| Usuário pede para...                                    | Agente deve usar...                              |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Vincule este chat ao Codex"                             | `/codex bind`                                    |
| "Retome a thread Codex `<id>` aqui"                      | `/codex resume <id>`                             |
| "Mostre as threads do Codex"                             | `/codex threads`                                 |
| "Registre um relatório de suporte para uma execução ruim do Codex" | `/diagnostics [note]`                            |
| "Envie feedback do Codex apenas para esta thread anexada" | `/codex diagnostics [note]`                      |
| "Use Codex como runtime para este agente"                | alteração de config para `agentRuntime.id`       |
| "Use minha assinatura ChatGPT/Codex com OpenClaw normal" | refs de modelo `openai-codex/*`                  |
| "Execute Codex por meio de ACP/acpx"                     | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicie Claude Code/Gemini/OpenCode/Cursor em uma thread" | ACP/acpx, não `/codex` e não subagentes nativos |

O OpenClaw só anuncia orientação de spawn ACP para agentes quando ACP está habilitado,
despachável e respaldado por um backend de runtime carregado. Se ACP não estiver disponível,
o prompt do sistema e as Skills do Plugin não devem ensinar o agente sobre roteamento
ACP.

## Implantações somente Codex

Force o harness do Codex quando precisar comprovar que cada turno de agente incorporado
usa Codex. Runtimes explícitos de Plugin usam por padrão nenhum fallback para PI, então
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

Substituição por ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Com Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver desabilitado, o
app-server for antigo demais ou o app-server não conseguir iniciar. Defina
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` somente se você intencionalmente quiser que o PI trate
seleção de harness ausente.

## Codex por agente

Você pode tornar um agente somente Codex enquanto o agente padrão mantém
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

Use comandos normais de sessão para alternar agentes e modelos. `/new` cria uma nova
sessão OpenClaw e o harness do Codex cria ou retoma sua thread app-server auxiliar
conforme necessário. `/reset` limpa a vinculação da sessão OpenClaw para essa thread
e permite que o próximo turno resolva o harness a partir da configuração atual novamente.

## Descoberta de modelos

Por padrão, o Plugin Codex pede ao app-server os modelos disponíveis. Se a
descoberta falhar ou atingir timeout, ele usa um catálogo de fallback empacotado para:

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

Desabilite a descoberta quando quiser que a inicialização evite consultar o Codex e se mantenha no
catálogo de fallback:

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

O binário gerenciado é declarado como uma dependência de runtime de Plugin empacotada e preparado
com o restante das dependências do Plugin `codex`. Isso mantém a versão do app-server
vinculada ao Plugin empacotado em vez de qualquer CLI Codex separada
que esteja instalada localmente. Defina `appServer.command` somente quando você
intencionalmente quiser executar um executável diferente.

Por padrão, o OpenClaw inicia sessões locais do harness Codex no modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Esta é a postura de operador local confiável usada
para Heartbeats autônomos: o Codex pode usar ferramentas de shell e rede sem
parar em prompts de aprovação nativos que ninguém está por perto para responder.

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

O modo guardião usa o caminho de aprovação de auto-revisão nativo do Codex. Quando o Codex pede para
sair do sandbox, escrever fora do workspace ou adicionar permissões como acesso
à rede, o Codex roteia essa solicitação de aprovação para o revisor nativo em vez de um
prompt humano. O revisor aplica o framework de risco do Codex e aprova ou nega
a solicitação específica. Use Guardião quando quiser mais proteções do que o modo YOLO,
mas ainda precisar que agentes autônomos façam progresso.

O preset `guardian` expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
Campos de política individuais ainda substituem `mode`, então implantações avançadas podem combinar
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

Inicializações do app-server por stdio herdam o ambiente de processo do OpenClaw por padrão,
mas o OpenClaw possui a ponte de conta do app-server Codex e define tanto
`CODEX_HOME` quanto `HOME` para diretórios por agente no estado OpenClaw
desse agente. O carregador de Skills próprio do Codex lê `$CODEX_HOME/skills` e
`$HOME/.agents/skills`, então ambos os valores são isolados para inicializações locais do app-server.
Isso mantém Skills nativas do Codex, plugins, configuração, contas e estado de thread
escopados ao agente OpenClaw em vez de vazarem da home pessoal da CLI Codex
do operador.

Plugins OpenClaw e snapshots de Skills do OpenClaw ainda fluem pelo próprio
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
executar comandos, expor servidores MCP ou conter credenciais.

A autenticação é selecionada nesta ordem:

1. Um perfil de autenticação Codex explícito do OpenClaw para o agente.
2. A conta existente do app-server na home Codex desse agente.
3. Apenas para inicializações locais do app-server por stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta do app-server está presente e a autenticação OpenAI
   ainda é exigida.

Quando o OpenClaw vê um perfil de autenticação Codex no estilo de assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho Codex iniciado. Isso
mantém chaves de API em nível de Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer turnos nativos do app-server Codex serem cobrados pela API por acidente.
Perfis Codex explícitos por chave de API e fallback por chave de ambiente stdio local usam login
do app-server em vez de ambiente herdado do processo filho. Conexões WebSocket do app-server
não recebem fallback de chave de API por env do Gateway; use um perfil de autenticação explícito ou a
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

| Campo               | Padrão                                  | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                             |
| `command`           | binário Codex gerenciado                     | Executável para o transporte stdio. Deixe sem definir para usar o binário gerenciado; defina apenas para uma substituição explícita.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para o transporte stdio.                                                                                                                                                                                                       |
| `url`               | não definido                                    | URL do app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | não definido                                    | Token bearer para o transporte WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Cabeçalhos WebSocket extras.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nomes de variáveis de ambiente extras removidos do processo app-server stdio iniciado depois que o OpenClaw cria seu ambiente herdado. `CODEX_HOME` e `HOME` são reservados para o isolamento Codex por agente do OpenClaw em inicializações locais. |
| `requestTimeoutMs`  | `60000`                                  | Tempo limite para chamadas de plano de controle do app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Predefinição para execução YOLO ou revisada pelo guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Política de aprovação nativa do Codex enviada para início/retomada/turno da thread.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo do Codex enviado para início/retomada da thread.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos. `guardian_subagent` permanece como um alias legado.                                                                                                                         |
| `serviceTier`       | não definido                                    | Camada de serviço opcional do app-server Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados.                                                                                                                            |

As chamadas dinâmicas de ferramentas de propriedade do OpenClaw são limitadas
independentemente de `appServer.requestTimeoutMs`: cada solicitação Codex
`item/tool/call` deve receber uma resposta do OpenClaw em até 30 segundos. Ao
atingir o tempo limite, o OpenClaw aborta o sinal da ferramenta quando houver
suporte e retorna uma resposta de ferramenta dinâmica com falha para o Codex para
que o turno possa continuar em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação app-server com escopo de turno
do Codex, o harness também espera que o Codex conclua o turno nativo com
`turn/completed`. Se o app-server ficar silencioso por 60 segundos depois dessa
resposta, o OpenClaw faz uma tentativa de interromper o turno do Codex, registra
um tempo limite diagnóstico e libera a faixa da sessão do OpenClaw para que
mensagens de chat de acompanhamento não fiquem enfileiradas atrás de um turno
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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A
configuração é preferível para implantações repetíveis porque mantém o
comportamento do Plugin no mesmo arquivo revisado que o restante da configuração
do harness do Codex.

## Uso do computador

O Uso do computador é abordado em seu próprio guia de configuração:
[Uso do computador do Codex](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não incorpora o app de controle da área de trabalho
nem executa ações na área de trabalho por conta própria. Ele prepara o app-server
do Codex, verifica se o servidor MCP `computer-use` está disponível e então
deixa o Codex lidar com as chamadas nativas de ferramentas MCP durante turnos em
modo Codex.

Para acesso direto ao driver TryCua fora do fluxo do marketplace do Codex,
registre `cua-driver mcp` com `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulte [Uso do computador do Codex](/pt-BR/plugins/codex-computer-use) para ver a
distinção entre Uso do computador de propriedade do Codex e registro MCP direto.

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

A configuração pode ser verificada ou instalada pela superfície de comandos:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

O Uso do computador é específico do macOS e pode exigir permissões locais do SO
antes que o servidor MCP do Codex possa controlar apps. Se `computerUse.enabled`
for true e o servidor MCP estiver indisponível, os turnos em modo Codex falham
antes que a thread seja iniciada, em vez de serem executados silenciosamente sem
as ferramentas nativas de Uso do computador. Consulte
[Uso do computador do Codex](/pt-BR/plugins/codex-computer-use) para opções de
marketplace, limites do catálogo remoto, motivos de status e solução de
problemas.

Quando `computerUse.autoInstall` é true, o OpenClaw pode registrar o marketplace
padrão incluído do Codex Desktop a partir de
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se o Codex
ainda não tiver descoberto um marketplace local. Use `/new` ou `/reset` depois
de alterar a configuração de runtime ou de Uso do computador para que sessões
existentes não mantenham uma associação antiga de PI ou de thread Codex.

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

Validação do harness somente com Codex:

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

Aprovações Codex revisadas pelo guardian:

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

A troca de modelo continua controlada pelo OpenClaw. Quando uma sessão OpenClaw
é anexada a uma thread Codex existente, o próximo turno envia novamente ao
app-server o modelo OpenAI, provedor, política de aprovação, sandbox e camada de
serviço selecionados no momento. Mudar de `openai/gpt-5.5` para
`openai/gpt-5.2` mantém a associação da thread, mas pede ao Codex para continuar
com o modelo recém-selecionado.

## Comando Codex

O Plugin incluído registra `/codex` como um comando de barra autorizado. Ele é
genérico e funciona em qualquer canal compatível com comandos de texto do
OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade ativa do app-server, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista modelos ativos do app-server Codex.
- `/codex threads [filter]` lista threads Codex recentes.
- `/codex resume <thread-id>` anexa a sessão OpenClaw atual a uma thread Codex existente.
- `/codex compact` pede ao app-server Codex para compactar a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pergunta antes de enviar feedback de diagnóstico do Codex para a thread anexada.
- `/codex computer-use status` verifica o Plugin de Uso do computador configurado e o servidor MCP.
- `/codex computer-use install` instala o Plugin de Uso do computador configurado e recarrega servidores MCP.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do app-server Codex.
- `/codex skills` lista Skills do app-server Codex.

### Fluxo de depuração comum

Quando um agente respaldado pelo Codex faz algo inesperado no Telegram, Discord,
Slack ou outro canal, comece pela conversa em que o problema aconteceu:

1. Execute `/diagnostics bad tool choice after image upload` ou outra nota curta
   que descreva o que você viu.
2. Aprove a solicitação de diagnóstico uma vez. A aprovação cria o zip local de
   diagnósticos do Gateway e, como a sessão está usando o harness do Codex,
   também envia o pacote de feedback Codex relevante para os servidores da
   OpenAI.
3. Copie a resposta de diagnóstico concluída para o relatório de bug ou thread
   de suporte. Ela inclui o caminho do pacote local, o resumo de privacidade, ids
   de sessão OpenClaw, ids de thread Codex e uma linha `Inspect locally` para
   cada thread Codex.
4. Se quiser depurar a execução por conta própria, execute o comando impresso
   `Inspect locally` em um terminal. Ele se parece com `codex resume <thread-id>`
   e abre a thread nativa do Codex para que você possa inspecionar a conversa,
   continuá-la localmente ou perguntar ao Codex por que ele escolheu uma
   ferramenta ou plano específico.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o envio de feedback do Codex para a thread anexada no momento, sem o pacote completo de diagnósticos do Gateway do OpenClaw. Para a maioria dos relatórios de suporte, `/diagnostics [note]` é o melhor ponto de partida porque vincula o estado local do Gateway e os ids de thread do Codex em uma única resposta. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para ver o modelo completo de privacidade e o comportamento em chats em grupo.

O núcleo do OpenClaw também expõe `/diagnostics [note]`, restrito a proprietários, como o comando geral de diagnósticos do Gateway. Seu prompt de aprovação mostra o preâmbulo sobre dados sensíveis, inclui links para [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) e solicita `openclaw gateway diagnostics export --json` por meio de aprovação explícita de execução todas as vezes. Não aprove diagnósticos com uma regra de permitir tudo. Após a aprovação, o OpenClaw envia um relatório colável com o caminho do pacote local e o resumo do manifesto. Quando a sessão ativa do OpenClaw está usando o harness do Codex, essa mesma aprovação também autoriza o envio dos pacotes de feedback relevantes do Codex para os servidores da OpenAI. O prompt de aprovação informa que o feedback do Codex será enviado, mas não lista os ids de sessão ou de thread do Codex antes da aprovação.

Se `/diagnostics` for invocado por um proprietário em um chat em grupo, o OpenClaw mantém o canal compartilhado limpo: o grupo recebe apenas um aviso curto, enquanto o preâmbulo de diagnósticos, os prompts de aprovação e os ids de sessão/thread do Codex são enviados ao proprietário pela rota privada de aprovação. Se não houver uma rota privada para o proprietário, o OpenClaw recusa a solicitação do grupo e pede que o proprietário a execute por DM.

O upload aprovado do Codex chama o `feedback/upload` do app-server do Codex e pede que o app-server inclua logs para cada thread listada e subthreads geradas do Codex, quando disponíveis. O upload passa pelo caminho normal de feedback do Codex para os servidores da OpenAI; se o feedback do Codex estiver desativado nesse app-server, o comando retorna o erro do app-server. A resposta de diagnósticos concluída lista os canais, ids de sessão do OpenClaw, ids de thread do Codex e comandos locais `codex resume <thread-id>` para as threads que foram enviadas. Se você negar ou ignorar a aprovação, o OpenClaw não imprime esses ids do Codex. Esse upload não substitui a exportação local de diagnósticos do Gateway.

`/codex resume` grava o mesmo arquivo de associação sidecar que o harness usa para turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread do Codex, passa o modelo do OpenClaw selecionado no momento para o app-server e mantém o histórico estendido ativado.

### Inspecionar uma thread do Codex pela CLI

A forma mais rápida de entender uma execução ruim do Codex muitas vezes é abrir a thread nativa do Codex diretamente:

```sh
codex resume <thread-id>
```

Use isso quando perceber um bug em uma conversa de canal e quiser inspecionar a sessão problemática do Codex, continuá-la localmente ou perguntar ao Codex por que ele fez uma determinada escolha de ferramenta ou raciocínio. O caminho mais fácil geralmente é executar `/diagnostics [note]` primeiro: depois que você aprova, o relatório concluído lista cada thread do Codex e imprime um comando `Inspecionar localmente`, por exemplo `codex resume <thread-id>`. Você pode copiar esse comando diretamente para um terminal.

Você também pode obter um id de thread com `/codex binding` para o chat atual ou `/codex threads [filter]` para threads recentes do app-server do Codex, e então executar o mesmo comando `codex resume` no seu shell.

A superfície de comando requer o app-server do Codex `0.125.0` ou mais recente. Métodos de controle individuais são relatados como `unsupported by this Codex app-server` se um app-server futuro ou personalizado não expuser esse método JSON-RPC.

## Limites dos hooks

O harness do Codex tem três camadas de hooks:

| Camada                                | Proprietário             | Finalidade                                                          |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin do OpenClaw           | OpenClaw                 | Compatibilidade de produto/Plugin entre harnesses do PI e do Codex. |
| Middleware de extensão do app-server do Codex | Plugins empacotados do OpenClaw | Comportamento do adaptador por turno em torno das ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política de ferramentas nativas da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para rotear o comportamento de Plugins do OpenClaw. Para a ponte compatível de ferramenta nativa e permissão, o OpenClaw injeta configuração do Codex por thread para `PreToolUse`, `PostToolUse`, `PermissionRequest` e `Stop`. Outros hooks do Codex, como `SessionStart` e `UserPromptSubmit`, permanecem controles de nível do Codex; eles não são expostos como hooks de Plugin do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita a chamada, então o OpenClaw dispara o comportamento de Plugin e middleware que ele possui no adaptador do harness. Para ferramentas nativas do Codex, o Codex possui o registro canônico da ferramenta. O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex a menos que o Codex exponha essa operação por meio do app-server ou de callbacks de hooks nativos.

As projeções de Compaction e do ciclo de vida do LLM vêm de notificações do app-server do Codex e do estado do adaptador do OpenClaw, não de comandos de hooks nativos do Codex. Os eventos `before_compaction`, `after_compaction`, `llm_input` e `llm_output` do OpenClaw são observações de nível de adaptador, não capturas byte a byte da solicitação interna ou dos payloads de compactação do Codex.

As notificações `hook/started` e `hook/completed` nativas do Codex no app-server são projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração. Elas não invocam hooks de Plugin do OpenClaw.

## Contrato de suporte V1

O modo Codex não é o PI com uma chamada de modelo diferente por baixo. O Codex possui uma parte maior do loop de modelo nativo, e o OpenClaw adapta suas superfícies de Plugin e sessão em torno desse limite.

Compatível no runtime v1 do Codex:

| Superfície                                    | Suporte                                 | Motivo                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo da OpenAI por meio do Codex    | Compatível                              | O app-server do Codex possui o turno da OpenAI, a retomada de thread nativa e a continuação de ferramentas nativas.                                                                                  |
| Roteamento e entrega de canais do OpenClaw    | Compatível                              | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais ficam fora do runtime do modelo.                                                                                                        |
| Ferramentas dinâmicas do OpenClaw             | Compatível                              | O Codex pede que o OpenClaw execute essas ferramentas, então o OpenClaw permanece no caminho de execução.                                                                                             |
| Plugins de prompt e contexto                  | Compatível                              | O OpenClaw constrói sobreposições de prompt e projeta contexto no turno do Codex antes de iniciar ou retomar a thread.                                                                                |
| Ciclo de vida do mecanismo de contexto        | Compatível                              | Montagem, ingestão ou manutenção após o turno e coordenação de Compaction do mecanismo de contexto são executadas para turnos do Codex.                                                               |
| Hooks de ferramentas dinâmicas                | Compatível                              | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta são executados em torno das ferramentas dinâmicas pertencentes ao OpenClaw.                                             |
| Hooks de ciclo de vida                        | Compatível como observações do adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex.                                                                        |
| Gate de revisão da resposta final             | Compatível por meio do relay de hook nativo | O `Stop` do Codex é retransmitido para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem de modelo antes da finalização.                                                             |
| Bloqueio ou observação de shell, patch e MCP nativos | Compatível por meio do relay de hook nativo | `PreToolUse` e `PostToolUse` do Codex são retransmitidos para superfícies de ferramentas nativas confirmadas, incluindo payloads MCP no app-server do Codex `0.125.0` ou mais recente. O bloqueio é compatível; a reescrita de argumentos não é. |
| Política de permissões nativa                 | Compatível por meio do relay de hook nativo | `PermissionRequest` do Codex pode ser roteado pela política do OpenClaw onde o runtime a expõe. Se o OpenClaw não retornar decisão, o Codex continua pelo caminho normal de guardian ou aprovação do usuário. |
| Captura de trajetória do app-server           | Compatível                              | O OpenClaw registra a solicitação que enviou ao app-server e as notificações do app-server que recebe.                                                                                               |

Sem suporte no runtime v1 do Codex:

| Superfície                                         | Limite V1                                                                                                                                      | Caminho futuro                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutação de argumentos de ferramentas nativas        | Hooks nativos pré-ferramenta do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.                | Requer suporte a hook/schema do Codex para entrada de ferramenta substituta.              |
| Histórico editável de transcrição nativa do Codex   | O Codex possui o histórico canônico de threads nativas. O OpenClaw possui um espelho e pode projetar contexto futuro, mas não deve mutar internos sem suporte. | Adicionar APIs explícitas do servidor de aplicativo do Codex se for necessária cirurgia de thread nativa. |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma escritas de transcrição pertencentes ao OpenClaw, não registros de ferramentas nativas do Codex.                          | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex. |
| Metadados ricos de Compaction nativa                | O OpenClaw observa o início e a conclusão da Compaction, mas não recebe uma lista estável de mantidos/descartados, delta de tokens ou payload de resumo. | Precisa de eventos de Compaction mais ricos do Codex.                                     |
| Intervenção de Compaction                           | Os hooks atuais de Compaction do OpenClaw estão em nível de notificação no modo Codex.                                                         | Adicionar hooks de Compaction pré/pós do Codex se Plugins precisarem vetar ou reescrever Compaction nativa. |
| Captura byte a byte da requisição da API do modelo  | O OpenClaw pode capturar requisições e notificações do servidor de aplicativo, mas o núcleo do Codex constrói internamente a requisição final da API OpenAI. | Precisa de um evento de rastreamento de requisição de modelo do Codex ou API de depuração. |

## Ferramentas, mídia e Compaction

O harness do Codex altera apenas o executor de agente embutido de baixo nível.

O OpenClaw ainda cria a lista de ferramentas e recebe resultados dinâmicos de ferramentas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramentas de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

O relay de hooks nativos é intencionalmente genérico, mas o contrato de suporte v1 é
limitado aos caminhos de ferramentas e permissões nativas do Codex que o OpenClaw testa. No
runtime do Codex, isso inclui payloads de shell, patch e MCP `PreToolUse`,
`PostToolUse` e `PermissionRequest`. Não presuma que todo evento futuro de hook do
Codex é uma superfície de Plugin do OpenClaw até que o contrato de runtime o nomeie.

Para `PermissionRequest`, o OpenClaw retorna apenas decisões explícitas de permitir ou negar
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como
ausência de decisão de hook e segue para seu próprio guardião ou caminho de aprovação do usuário.

Solicitações de aprovação de ferramenta MCP do Codex são roteadas pelo fluxo de aprovação de
Plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento na fila responde a essa requisição
nativa do servidor em vez de ser direcionada como contexto extra. Outras requisições de
solicitação MCP ainda falham de forma fechada.

O direcionamento da fila de execução ativa é mapeado para `turn/steer` do servidor de aplicativo do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa mensagens de chat na fila
pela janela de silêncio configurada e as envia como uma única requisição `turn/steer` na
ordem de chegada. O modo legado `queue` envia requisições `turn/steer` separadas. Turnos de
revisão do Codex e de Compaction manual podem rejeitar direcionamento no mesmo turno, caso em que
o OpenClaw usa a fila de acompanhamento quando o modo selecionado permite fallback. Consulte
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

Quando o modelo selecionado usa o harness do Codex, a Compaction de thread nativa é
delegada ao servidor de aplicativo do Codex. O OpenClaw mantém um espelho de transcrição para histórico
do canal, busca, `/new`, `/reset` e futura troca de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de
raciocínio ou plano do Codex quando o servidor de aplicativo os emite. Hoje, o OpenClaw apenas
registra sinais de início e conclusão de Compaction nativa. Ele ainda não expõe um
resumo de Compaction legível por humanos nem uma lista auditável de quais entradas o Codex
manteve após a Compaction.

Como o Codex possui a thread nativa canônica, `tool_result_persist` atualmente não
reescreve registros de resultado de ferramenta nativa do Codex. Ele só se aplica quando
o OpenClaw está escrevendo um resultado de ferramenta em transcrição de sessão pertencente ao OpenClaw.

A geração de mídia não requer PI. Imagem, vídeo, música, PDF, TTS e entendimento de mídia
continuam usando as configurações correspondentes de provedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**O Codex não aparece como um provedor `/model` normal:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*` com
`agentRuntime.id: "codex"` (ou uma referência legada `codex/*`), habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa PI em vez do Codex:** `agentRuntime.id: "auto"` ainda pode usar PI como o
backend de compatibilidade quando nenhum harness do Codex assume a execução. Defina
`agentRuntime.id: "codex"` para forçar a seleção do Codex durante testes. Um
runtime Codex forçado agora falha em vez de voltar para PI, a menos que você
defina explicitamente `agentRuntime.fallback: "pi"`. Depois que o servidor de aplicativo do Codex é
selecionado, suas falhas aparecem diretamente sem configuração extra de fallback.

**O servidor de aplicativo é rejeitado:** atualize o Codex para que o handshake do servidor de aplicativo
relate a versão `0.125.0` ou mais recente. Pré-lançamentos da mesma versão ou versões com sufixo
de build, como `0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o
piso de protocolo estável `0.125.0` é o que o OpenClaw testa.

**A descoberta de modelos está lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desabilite a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o servidor de aplicativo remoto fala a mesma versão de protocolo do servidor de aplicativo do Codex.

**Um modelo que não é Codex usa PI:** isso é esperado, a menos que você tenha forçado
`agentRuntime.id: "codex"` para esse agente ou selecionado uma referência legada
`codex/*`. Referências simples `openai/gpt-*` e de outros provedores permanecem no caminho normal
do provedor em modo `auto`. Se você forçar `agentRuntime.id: "codex"`, todo turno embutido
desse agente deve ser um modelo OpenAI com suporte do Codex.

**Computer Use está instalado, mas as ferramentas não executam:** verifique
`/codex computer-use status` em uma sessão nova. Se uma ferramenta relatar
`Native hook relay unavailable`, use `/new` ou `/reset`; se persistir, reinicie
o Gateway para limpar registros obsoletos de hooks nativos. Se `computer-use.list_apps`
expirar, reinicie o Codex Computer Use ou o Codex Desktop e tente novamente.

## Relacionados

- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Status](/pt-BR/cli/status)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
