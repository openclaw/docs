---
read_when:
    - Você quer usar o arcabouço de app-server do Codex incluído
    - Você precisa de exemplos de configuração do harness do Codex
    - Você quer que implantações somente com Codex falhem em vez de recorrer ao PI
summary: Execute turnos de agentes incorporados do OpenClaw pelo mecanismo de servidor de aplicativo do Codex incluído.
title: Ambiente de execução do Codex
x-i18n:
    generated_at: "2026-05-07T13:21:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

O Plugin `codex` incluído permite que o OpenClaw execute turnos de agente incorporados por meio do
app-server Codex em vez do harness PI integrado.

Use isto quando quiser que o Codex controle a sessão de agente de baixo nível: descoberta de
modelos, retomada nativa de threads, compaction nativa e execução no app-server.
O OpenClaw ainda controla canais de chat, arquivos de sessão, seleção de modelo, ferramentas,
aprovações, entrega de mídia e o espelho visível da transcrição.

Quando um turno de chat de origem é executado pelo harness Codex, as respostas visíveis usam por padrão
a ferramenta `message` do OpenClaw se a implantação não tiver configurado explicitamente
`messages.visibleReplies`. O agente ainda pode finalizar seu turno Codex em privado;
ele só publica no canal quando chama `message(action="send")`. Defina
`messages.visibleReplies: "automatic"` para manter as respostas finais de chat direto no
caminho legado de entrega automática.

Turnos de Heartbeat do Codex também recebem a ferramenta `heartbeat_respond` por padrão, para que o
agente possa registrar se o despertar deve permanecer silencioso ou notificar sem codificar
esse fluxo de controle no texto final.

A orientação de iniciativa específica de Heartbeat é enviada como uma instrução de desenvolvedor
em modo de colaboração do Codex no próprio turno de Heartbeat. Turnos de chat comuns restauram
o modo padrão do Codex em vez de carregar a filosofia de Heartbeat no prompt normal
de runtime.

Se você está tentando se orientar, comece com
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a referência do modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## Configuração rápida

A maioria dos usuários que quer "Codex no OpenClaw" quer este caminho: entrar com uma
assinatura ChatGPT/Codex e então executar turnos de agente incorporados pelo runtime nativo
do app-server Codex. A referência do modelo ainda permanece canônica como
`openai/gpt-*`; a autenticação por assinatura vem da conta/perfil do Codex, não
de um prefixo de modelo `openai-codex/*`.

Primeiro entre com o OAuth do Codex se ainda não tiver feito isso:

```bash
openclaw models auth login --provider openai-codex
```

Então habilite o Plugin `codex` incluído e force o runtime Codex:

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

Se sua configuração usa `plugins.allow`, inclua `codex` também:

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

Não use `openai-codex/gpt-*` na configuração. Esse prefixo é uma rota legada que
`openclaw doctor --fix` reescreve para `openai/gpt-*` em modelos primários,
fallbacks, substituições de Heartbeat/subagente/Compaction, hooks, substituições de canal
e pins obsoletos de rota de sessão persistida.

## O que este Plugin altera

O Plugin `codex` incluído contribui com vários recursos separados:

| Recurso                           | Como você o usa                                     | O que ele faz                                                                  |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime incorporado nativo        | `agentRuntime.id: "codex"`                          | Executa turnos de agente incorporados do OpenClaw pelo app-server Codex.       |
| Comandos nativos de controle de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula e controla threads do app-server Codex a partir de uma conversa de mensagens. |
| Provedor/catálogo do app-server Codex | internos de `codex`, expostos pelo harness          | Permite que o runtime descubra e valide modelos do app-server.                 |
| Caminho de compreensão de mídia do Codex | caminhos de compatibilidade de modelo de imagem `codex/*` | Executa turnos limitados do app-server Codex para modelos compatíveis de compreensão de imagem. |
| Relay nativo de hooks             | Hooks do Plugin em torno de eventos nativos do Codex | Permite que o OpenClaw observe/bloqueie eventos compatíveis de ferramenta/finalização nativos do Codex. |

Habilitar o Plugin disponibiliza esses recursos. Isso **não**:

- substitui superfícies diretas com chave de API da OpenAI, como imagens, embeddings, fala ou
  tempo real
- converte referências de modelo `openai-codex/*` sem `openclaw doctor --fix`
- torna ACP/acpx o caminho Codex padrão
- troca a quente sessões existentes que já registraram um runtime PI
- substitui entrega de canais do OpenClaw, arquivos de sessão, armazenamento de perfil de autenticação ou
  roteamento de mensagens

O mesmo Plugin também controla a superfície nativa de comando de controle de chat `/codex`. Se
o Plugin estiver habilitado e o usuário pedir para vincular, retomar, orientar, parar ou inspecionar
threads Codex pelo chat, os agentes devem preferir `/codex ...` em vez de ACP. ACP permanece
o fallback explícito quando o usuário pede ACP/acpx ou está testando o adaptador ACP
do Codex.

Turnos nativos do Codex mantêm os hooks de Plugin do OpenClaw como a camada pública de compatibilidade.
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
`tool_result_persist`, que transforma gravações de resultado de ferramenta de transcrição
controladas pelo OpenClaw.

Para a semântica dos próprios hooks de Plugin, consulte [Hooks de Plugin](/pt-BR/plugins/hooks)
e [Comportamento de guarda de Plugin](/pt-BR/tools/plugin).

Referências de modelo de agente OpenAI usam o harness por padrão. Novas configurações devem manter
referências de modelo OpenAI canônicas como `openai/gpt-*`; `agentRuntime.id: "codex"` ainda é
válido, mas não é mais obrigatório para turnos de agente OpenAI. Referências legadas de modelo `codex/*`
ainda selecionam automaticamente o harness por compatibilidade, mas
prefixos legados de provedor com respaldo de runtime não são exibidos como escolhas normais de modelo/provedor.

Se alguma rota de modelo configurada ainda for `openai-codex/*`, `openclaw doctor --fix`
a reescreve para `openai/*`. Para rotas de agente correspondentes, ele define o runtime do agente
como `codex` e preserva substituições existentes de perfil de autenticação `openai-codex`.

## Mapa de rotas

Use esta tabela antes de alterar a configuração:

| Comportamento desejado                               | Referência do modelo       | Configuração de runtime                  | Rota de autenticação/perfil    | Rótulo de status esperado    |
| ---------------------------------------------------- | -------------------------- | ---------------------------------------- | ------------------------------ | ---------------------------- |
| Assinatura ChatGPT/Codex com runtime Codex nativo    | `openai/gpt-*`             | omitida ou `agentRuntime.id: "codex"`    | OAuth do Codex ou conta Codex  | `Runtime: OpenAI Codex`      |
| Autenticação por chave de API OpenAI para modelos de agente | `openai/gpt-*`             | omitida ou `agentRuntime.id: "codex"`    | perfil de chave de API `openai-codex` | `Runtime: OpenAI Codex`      |
| Configuração legada que precisa de reparo pelo doctor | `openai-codex/gpt-*`       | reparada para `codex`                    | Autenticação configurada existente | Verifique novamente após `doctor --fix` |
| Provedores mistos com modo automático conservador     | referências específicas do provedor | `agentRuntime.id: "auto"`                | Por provedor selecionado       | Depende do runtime selecionado |
| Sessão explícita do adaptador ACP do Codex            | dependente de prompt/modelo ACP | `sessions_spawn` com `runtime: "acp"` | Autenticação do backend ACP    | Status de tarefa/sessão ACP  |

A divisão importante é provedor versus runtime:

- `openai-codex/*` é uma rota legada que o doctor reescreve.
- `agentRuntime.id: "codex"` exige o harness Codex e falha de forma fechada se ele
  estiver indisponível.
- `agentRuntime.id: "auto"` permite que harnesses registrados reivindiquem rotas de provedor
  correspondentes; referências de agente OpenAI resolvem para Codex em vez de PI.
- `/codex ...` responde "a qual conversa nativa do Codex este chat deve se vincular
  ou controlar?"
- ACP responde "qual processo de harness externo o acpx deve iniciar?"

## Escolha o prefixo de modelo correto

Rotas da família OpenAI são específicas por prefixo. Para a configuração comum com assinatura mais
runtime Codex nativo, use `openai/*`.
Trate `openai-codex/*` como configuração legada que o doctor deve reescrever:

| Referência do modelo                              | Caminho de runtime                       | Use quando                                                        |
| ------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `openai/gpt-5.4`                                  | Harness do app-server Codex para turnos de agente | Você quer modelos de agente OpenAI por meio do Codex.             |
| `openai-codex/gpt-5.5`                            | Rota legada reparada pelo doctor         | Você está em uma configuração antiga; execute `openclaw doctor --fix` para reescrevê-la. |
| `openai/gpt-5.5` + perfil de chave de API `openai-codex` | Harness do app-server Codex              | Você quer autenticação por chave de API para um modelo de agente OpenAI. |

GPT-5.5 pode aparecer tanto em rotas diretas com chave de API OpenAI quanto em rotas de assinatura Codex
quando sua conta as expõe. Use `openai/gpt-5.5` com o harness do app-server Codex
para runtime Codex nativo, ou `openai/gpt-5.5` sem uma substituição de runtime Codex
para tráfego direto por chave de API.

Referências legadas `codex/gpt-*` continuam aceitas como aliases de compatibilidade. A migração
de compatibilidade do doctor reescreve referências legadas de runtime para referências canônicas de modelo
e registra a política de runtime separadamente. Novas configurações de harness nativo do app-server
devem usar `openai/gpt-*` mais `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use
`openai/gpt-*` para a rota OpenAI normal e `codex/gpt-*` quando a compreensão de imagem
deve ser executada por meio de um turno limitado do app-server Codex. Não use
`openai-codex/gpt-*`; o doctor reescreve esse prefixo legado para `openai/gpt-*`. O
modelo do app-server Codex deve anunciar suporte a entrada de imagem; modelos Codex somente texto
falham antes do início do turno de mídia.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a
seleção for surpreendente, habilite logs de depuração para o subsistema `agents/harness`
e inspecione o registro estruturado `agent harness selected` do gateway. Ele
inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e,
no modo `auto`, o resultado de suporte de cada candidato de Plugin.

### O que significam os avisos do doctor

`openclaw doctor` avisa quando referências de modelo configuradas ou estado persistido de rota de sessão
ainda usam `openai-codex/*`. `openclaw doctor --fix` reescreve essas rotas
para:

- `openai/<model>`
- `agentRuntime.id: "codex"`

A rota `codex` força o harness Codex nativo. Configuração de runtime PI não é
permitida para turnos de modelo de agente OpenAI.
O doctor também repara pins obsoletos de sessão persistida nos armazenamentos de sessão de agente descobertos
para que conversas antigas não permaneçam presas na rota removida.

A seleção de harness não é um controle de sessão ao vivo. Quando um turno incorporado é executado,
o OpenClaw registra o id do harness selecionado nessa sessão e continua usando-o em
turnos posteriores no mesmo id de sessão. Altere a configuração `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro harness;
use `/new` ou `/reset` para iniciar uma sessão nova antes de alternar uma conversa existente
entre PI e Codex. Isso evita reproduzir uma transcrição por dois sistemas nativos de sessão
incompatíveis.

Sessões legadas criadas antes dos pins de harness são tratadas como fixadas em PI depois que
têm histórico de transcrição. Use `/new` ou `/reset` para optar essa conversa pelo
Codex após alterar a configuração.

`/status` mostra o runtime efetivo do modelo. O harness PI padrão aparece como
`Runtime: OpenClaw Pi Default`, e o harness do app-server Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw com o Plugin `codex` incluído disponível.
- Codex app-server `0.125.0` ou mais recente. O Plugin incluído gerencia um binário
  Codex app-server compatível por padrão, portanto comandos locais `codex` no `PATH`
  não afetam a inicialização normal do harness.
- Autenticação do Codex disponível para o processo app-server ou para a ponte de
  autenticação do Codex do OpenClaw. Inicializações locais do app-server usam um home
  do Codex gerenciado pelo OpenClaw para cada agente e um `HOME` filho isolado, portanto
  não leem sua conta, Skills, plugins, configuração, estado de threads ou
  `$HOME/.agents/skills` nativo pessoal em `~/.codex` por padrão.

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. Isso mantém
o OpenClaw na superfície de protocolo contra a qual ele foi testado.

Para testes smoke ao vivo e em Docker, a autenticação geralmente vem da conta da Codex CLI
ou de um perfil de autenticação `openai-codex` do OpenClaw. Inicializações locais de app-server
stdio também podem recorrer a `CODEX_API_KEY` / `OPENAI_API_KEY` quando nenhuma conta está presente.

## Arquivos de bootstrap do workspace

O Codex lida com `AGENTS.md` por conta própria por meio da descoberta nativa de documentos do projeto. O OpenClaw
não grava arquivos sintéticos de documentos de projeto do Codex nem depende de nomes de arquivo fallback do Codex
para arquivos de persona, porque os fallbacks do Codex só se aplicam quando
`AGENTS.md` está ausente.

Para paridade de workspace do OpenClaw, o harness do Codex resolve os outros arquivos de bootstrap
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` e `MEMORY.md`, quando presentes) e os encaminha por meio das instruções de desenvolvedor do Codex em `thread/start` e `thread/resume`. Isso mantém
`SOUL.md` e o contexto relacionado de persona/perfil do workspace visíveis na via nativa de modelagem de comportamento do Codex sem duplicar `AGENTS.md`.

## Adicionar Codex junto com outros modelos

Não defina `agentRuntime.id: "codex"` globalmente se o mesmo agente deve alternar livremente
entre Codex e modelos de provedores que não sejam Codex. Um runtime forçado se aplica a cada
turno incorporado desse agente ou sessão. Se você selecionar um modelo Anthropic enquanto
esse runtime estiver forçado, o OpenClaw ainda tentará o harness do Codex e falhará de forma fechada
em vez de rotear silenciosamente esse turno pelo PI.

Use uma destas formas em vez disso:

- Coloque o Codex em um agente dedicado com `agentRuntime.id: "codex"`.
- Mantenha o agente padrão em `agentRuntime.id: "auto"` e fallback do PI para uso normal misto
  de provedores.
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

Com esta forma:

- O agente padrão `main` usa o caminho normal do provedor e o fallback de compatibilidade do PI.
- O agente `codex` usa o harness do Codex app-server.
- Se o Codex estiver ausente ou não for compatível para o agente `codex`, o turno falha
  em vez de usar silenciosamente o PI.

## Roteamento de comandos de agente

Agentes devem rotear solicitações do usuário por intenção, não apenas pela palavra "Codex":

| O usuário pede para...                                  | O agente deve usar...                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincule este chat ao Codex"                           | `/codex bind`                                    |
| "Retome a thread do Codex `<id>` aqui"                 | `/codex resume <id>`                             |
| "Mostrar threads do Codex"                             | `/codex threads`                                 |
| "Registrar um relatório de suporte para uma execução ruim do Codex" | `/diagnostics [note]`                            |
| "Enviar feedback do Codex apenas para esta thread anexada" | `/codex diagnostics [note]`                      |
| "Usar minha assinatura ChatGPT/Codex com runtime Codex" | `openai/*`                                       |
| "Reparar pins antigos de configuração/sessão `openai-codex/*`" | `openclaw doctor --fix`                          |
| "Executar Codex por ACP/acpx"                          | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Iniciar Claude Code/Gemini/OpenCode/Cursor em uma thread" | ACP/acpx, não `/codex` e não subagentes nativos |

O OpenClaw só anuncia orientação de spawn ACP para agentes quando ACP está habilitado,
despachável e respaldado por um backend de runtime carregado. Se ACP não estiver disponível,
o prompt do sistema e as Skills do Plugin não devem ensinar o agente sobre roteamento ACP.

## Implantações somente Codex

Force o harness do Codex quando precisar provar que cada turno de agente incorporado
usa Codex. Runtimes explícitos de Plugin falham de forma fechada e nunca são retentados silenciosamente
pelo PI:

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
}
```

Sobrescrita de ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Com Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver desabilitado, se o
app-server for antigo demais ou se o app-server não puder iniciar.

## Codex por agente

Você pode tornar um agente somente Codex enquanto o agente padrão mantém a
seleção automática normal:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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

Use comandos normais de sessão para alternar agentes e modelos. `/new` cria uma nova sessão
OpenClaw e o harness do Codex cria ou retoma sua thread app-server sidecar
conforme necessário. `/reset` limpa a vinculação de sessão do OpenClaw para essa thread
e permite que o próximo turno resolva o harness a partir da configuração atual novamente.

## Descoberta de modelos

Por padrão, o Plugin Codex solicita ao app-server os modelos disponíveis. Se
a descoberta falhar ou expirar, ele usa um catálogo fallback incluído para:

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

Desabilite a descoberta quando quiser que a inicialização evite sondar o Codex e use apenas o
catálogo fallback:

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

O binário gerenciado é enviado com o pacote do Plugin `codex`. Isso mantém a
versão do app-server vinculada ao Plugin incluído, em vez de qualquer Codex CLI separado
que por acaso esteja instalado localmente. Defina `appServer.command` somente quando
você intencionalmente quiser executar um executável diferente.

Por padrão, o OpenClaw inicia sessões locais do harness do Codex em modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Esta é a postura de operador local confiável usada
para heartbeats autônomos: o Codex pode usar ferramentas de shell e rede sem
parar em prompts nativos de aprovação que ninguém está presente para responder.

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

O modo Guardian usa o caminho nativo de aprovação por revisão automática do Codex. Quando o Codex pede para
sair do sandbox, gravar fora do workspace ou adicionar permissões como acesso à rede,
o Codex roteia essa solicitação de aprovação para o revisor nativo em vez de um
prompt humano. O revisor aplica o framework de risco do Codex e aprova ou nega
a solicitação específica. Use Guardian quando quiser mais barreiras de proteção que o modo YOLO,
mas ainda precisar que agentes não supervisionados avancem.

O preset `guardian` expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
Campos de política individuais ainda sobrescrevem `mode`, portanto implantações avançadas podem combinar
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

Inicializações stdio do app-server herdam o ambiente de processo do OpenClaw por padrão,
mas o OpenClaw possui a ponte de conta do Codex app-server e define tanto
`CODEX_HOME` quanto `HOME` para diretórios por agente sob o estado OpenClaw desse agente.
O próprio carregador de Skills do Codex lê `$CODEX_HOME/skills` e
`$HOME/.agents/skills`, portanto ambos os valores são isolados para inicializações locais do app-server.
Isso mantém Skills, plugins, configuração, contas e estado de thread nativos do Codex
escopados ao agente OpenClaw, em vez de vazarem do home pessoal do Codex CLI
do operador.

Plugins do OpenClaw e snapshots de Skills do OpenClaw ainda fluem pelo próprio
registro de plugins e carregador de Skills do OpenClaw. Ativos pessoais do Codex CLI não. Se você tiver
Skills ou plugins úteis do Codex CLI que devem se tornar parte de um agente OpenClaw,
faça o inventário deles explicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

O provedor de migração do Codex copia Skills para o workspace atual do agente OpenClaw.
Plugins nativos do Codex, hooks e arquivos de configuração são relatados ou arquivados
para revisão manual em vez de serem ativados automaticamente, porque podem
executar comandos, expor servidores MCP ou carregar credenciais.

A autenticação é selecionada nesta ordem:

1. Um perfil explícito de autenticação Codex do OpenClaw para o agente.
2. A conta existente do app-server no home Codex desse agente.
3. Apenas para inicializações locais stdio do app-server, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta do app-server está presente e a autenticação OpenAI
   ainda é necessária.

Quando o OpenClaw vê um perfil de autenticação Codex no estilo assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho Codex gerado. Isso
mantém chaves de API no nível do Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer turnos nativos do Codex app-server serem cobrados pela API por acidente.
Perfis explícitos de chave de API do Codex e fallback de chave de ambiente stdio local usam login do app-server
em vez de env herdado do processo filho. Conexões WebSocket do app-server
não recebem fallback de chave de API do env do Gateway; use um perfil de autenticação explícito ou a
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

`appServer.clearEnv` afeta apenas o processo filho Codex app-server gerado.

As ferramentas dinâmicas do Codex usam por padrão o perfil `native-first`. Nesse modo,
o OpenClaw não expõe ferramentas dinâmicas que duplicam operações de workspace
nativas do Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` e
`update_plan`. Ferramentas de integração do OpenClaw, como mensagens, sessões, mídia,
cron, navegador, nós, gateway, `heartbeat_respond` e `web_search` permanecem
disponíveis.

Campos de Plugin do Codex de nível superior compatíveis:

| Campo                      | Padrão          | Significado                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Use `"openclaw-compat"` para expor o conjunto completo de ferramentas dinâmicas do OpenClaw ao app-server do Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir de turnos do app-server do Codex.               |

Campos `appServer` compatíveis:

| Campo                         | Padrão                                  | Significado                                                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                             |
| `command`                     | binário gerenciado do Codex                     | Executável para transporte stdio. Deixe indefinido para usar o binário gerenciado; defina apenas para uma substituição explícita.                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                                                                                                                                       |
| `url`                         | indefinido                                    | URL WebSocket do app-server.                                                                                                                                                                                                            |
| `authToken`                   | indefinido                                    | Token bearer para transporte WebSocket.                                                                                                                                                                                                |
| `headers`                     | `{}`                                     | Cabeçalhos WebSocket extras.                                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                     | Nomes extras de variáveis de ambiente removidos do processo app-server stdio iniciado depois que o OpenClaw cria seu ambiente herdado. `CODEX_HOME` e `HOME` são reservados para o isolamento Codex por agente do OpenClaw em inicializações locais. |
| `requestTimeoutMs`            | `60000`                                  | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | Janela silenciosa após uma solicitação ao app-server do Codex com escopo de turno enquanto o OpenClaw aguarda `turn/completed`. Aumente isso para fases lentas pós-ferramenta ou de síntese apenas de status.                                                                  |
| `mode`                        | `"yolo"`                                 | Predefinição para execução YOLO ou revisada por guardião.                                                                                                                                                                                      |
| `approvalPolicy`              | `"never"`                                | Política de aprovação nativa do Codex enviada ao iniciar/retomar thread/turno.                                                                                                                                                                       |
| `sandbox`                     | `"danger-full-access"`                   | Modo sandbox nativo do Codex enviado ao iniciar/retomar thread.                                                                                                                                                                               |
| `approvalsReviewer`           | `"user"`                                 | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos. `guardian_subagent` permanece como alias legado.                                                                                                                         |
| `serviceTier`                 | indefinido                                    | Camada de serviço opcional do app-server do Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados.                                                                                                                            |

Chamadas de ferramentas dinâmicas pertencentes ao OpenClaw são limitadas
independentemente de `appServer.requestTimeoutMs`: cada solicitação Codex
`item/tool/call` deve receber uma resposta do OpenClaw em até 30 segundos. Em caso
de tempo limite, o OpenClaw aborta o sinal da ferramenta quando compatível e
retorna uma resposta de ferramenta dinâmica com falha ao Codex para que o turno
possa continuar em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação ao app-server do Codex com escopo
de turno, o harness também espera que o Codex finalize o turno nativo com
`turn/completed`. Se o app-server ficar silencioso por
`appServer.turnCompletionIdleTimeoutMs` após essa resposta, o OpenClaw tenta
interromper o turno do Codex, registra um tempo limite de diagnóstico e libera a
via da sessão do OpenClaw para que mensagens de chat seguintes não fiquem na fila
atrás de um turno nativo obsoleto. Qualquer notificação não terminal para o mesmo
turno, incluindo `rawResponseItem/completed`, desarma esse watchdog curto porque
o Codex comprovou que o turno ainda está ativo; o watchdog terminal mais longo
continua protegendo turnos realmente travados. Os diagnósticos de tempo limite
incluem o último método de notificação do app-server e, para itens brutos de
resposta do assistente, o tipo do item, a função, o id e uma prévia limitada do
texto do assistente.

Substituições de ambiente permanecem disponíveis para testes locais:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora o binário gerenciado quando
`appServer.command` está indefinido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removido. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` em vez disso, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A
configuração é preferível para implantações repetíveis porque mantém o
comportamento do Plugin no mesmo arquivo revisado que o restante da configuração
do harness do Codex.

## Uso do computador

O Uso do computador é abordado em seu próprio guia de configuração:
[Uso do computador do Codex](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não inclui por conta própria o app de controle de
desktop nem executa ações de desktop. Ele prepara o app-server do Codex, verifica
se o servidor MCP `computer-use` está disponível e então deixa o Codex lidar com
as chamadas de ferramenta MCP nativas durante turnos no modo Codex.

Para acesso direto ao driver TryCua fora do fluxo do marketplace do Codex,
registre `cua-driver mcp` com `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulte [Uso do computador do Codex](/pt-BR/plugins/codex-computer-use) para a distinção
entre Uso do computador pertencente ao Codex e registro MCP direto.

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
antes que o servidor MCP do Codex consiga controlar apps. Se
`computerUse.enabled` for true e o servidor MCP estiver indisponível, turnos no
modo Codex falharão antes que a thread comece, em vez de serem executados
silenciosamente sem as ferramentas nativas de Uso do computador. Consulte
[Uso do computador do Codex](/pt-BR/plugins/codex-computer-use) para opções de
marketplace, limites de catálogo remoto, motivos de status e solução de problemas.

Quando `computerUse.autoInstall` é true, o OpenClaw pode registrar o marketplace
padrão empacotado do Codex Desktop a partir de
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se o Codex
ainda não tiver descoberto um marketplace local. Use `/new` ou `/reset` depois
de alterar a configuração de runtime ou de Uso do computador para que sessões
existentes não mantenham uma associação antiga de PI ou thread do Codex.

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

Validação de harness apenas do Codex:

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

A troca de modelo permanece controlada pelo OpenClaw. Quando uma sessão do
OpenClaw é anexada a uma thread existente do Codex, o próximo turno envia
novamente ao app-server o modelo OpenAI, provedor, política de aprovação,
sandbox e camada de serviço atualmente selecionados. Trocar de `openai/gpt-5.5`
para `openai/gpt-5.2` mantém a associação da thread, mas pede ao Codex que
continue com o modelo recém-selecionado.

## Comando Codex

O Plugin empacotado registra `/codex` como um comando de barra autorizado. Ele é
genérico e funciona em qualquer canal compatível com comandos de texto do
OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade ativa com o servidor de apps, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista os modelos ativos do servidor de apps do Codex.
- `/codex threads [filter]` lista threads recentes do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma thread existente do Codex.
- `/codex compact` solicita que o servidor de apps do Codex compacte a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pergunta antes de enviar feedback de diagnóstico do Codex para a thread anexada.
- `/codex computer-use status` verifica o Plugin de Computer Use configurado e o servidor MCP.
- `/codex computer-use install` instala o Plugin de Computer Use configurado e recarrega os servidores MCP.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do servidor de apps do Codex.
- `/codex skills` lista as Skills do servidor de apps do Codex.

Quando o Codex relata uma falha de limite de uso, o OpenClaw inclui o próximo
horário de redefinição do servidor de apps quando o Codex fornece um. Use `/codex account` na mesma
conversa para inspecionar a conta atual e as janelas de limite de taxa.

### Fluxo de trabalho comum de depuração

Quando um agente baseado no Codex faz algo inesperado no Telegram, Discord, Slack
ou outro canal, comece pela conversa onde o problema aconteceu:

1. Execute `/diagnostics bad tool choice after image upload` ou outra nota curta
   que descreva o que você viu.
2. Aprove a solicitação de diagnóstico uma vez. A aprovação cria o zip local de
   diagnóstico do Gateway e, como a sessão está usando o harness do Codex, também
   envia o pacote de feedback relevante do Codex para os servidores da OpenAI.
3. Copie a resposta de diagnóstico concluída para o relatório de bug ou thread de suporte.
   Ela inclui o caminho do pacote local, o resumo de privacidade, ids de sessão do OpenClaw,
   ids de thread do Codex e uma linha `Inspect locally` para cada thread do Codex.
4. Se quiser depurar a execução por conta própria, execute o comando `Inspect locally`
   impresso em um terminal. Ele se parece com `codex resume <thread-id>` e abre a
   thread nativa do Codex para que você possa inspecionar a conversa, continuá-la localmente
   ou perguntar ao Codex por que ele escolheu uma ferramenta ou plano específico.

Use `/codex diagnostics [note]` apenas quando você quiser especificamente o upload de
feedback do Codex para a thread anexada no momento, sem o pacote completo de diagnóstico do
Gateway do OpenClaw. Para a maioria dos relatórios de suporte, `/diagnostics [note]` é
o melhor ponto de partida porque vincula o estado local do Gateway e os ids de thread do Codex
em uma única resposta. Consulte [Exportação de diagnóstico](/pt-BR/gateway/diagnostics)
para ver o modelo de privacidade completo e o comportamento em chats de grupo.

O núcleo do OpenClaw também expõe `/diagnostics [note]`, somente para proprietários, como o comando geral
de diagnóstico do Gateway. O prompt de aprovação mostra o preâmbulo de dados sensíveis,
vincula para [Exportação de diagnóstico](/pt-BR/gateway/diagnostics) e solicita
`openclaw gateway diagnostics export --json` por meio de aprovação explícita de execução
todas as vezes. Não aprove diagnósticos com uma regra de permitir tudo. Após a aprovação,
o OpenClaw envia um relatório colável com o caminho do pacote local e o resumo do manifesto.
Quando a sessão ativa do OpenClaw está usando o harness do Codex, essa
mesma aprovação também autoriza o envio dos pacotes de feedback relevantes do Codex para
os servidores da OpenAI. O prompt de aprovação diz que o feedback do Codex será enviado, mas
não lista ids de sessão ou thread do Codex antes da aprovação.

Se `/diagnostics` for invocado por um proprietário em um chat de grupo, o OpenClaw mantém o
canal compartilhado limpo: o grupo recebe apenas um aviso curto, enquanto o
preâmbulo de diagnóstico, os prompts de aprovação e os ids de sessão/thread do Codex são enviados ao
proprietário pela rota privada de aprovação. Se não houver uma rota privada para o proprietário,
o OpenClaw recusa a solicitação do grupo e pede que o proprietário a execute em uma DM.

O upload aprovado do Codex chama `feedback/upload` no servidor de apps do Codex e pede
que o servidor de apps inclua logs para cada thread listada e subthreads geradas do Codex
quando disponíveis. O upload passa pelo caminho normal de feedback do Codex para os servidores da OpenAI;
se o feedback do Codex estiver desativado nesse servidor de apps, o comando retorna
o erro do servidor de apps. A resposta de diagnóstico concluída lista os canais,
ids de sessão do OpenClaw, ids de thread do Codex e comandos locais `codex resume <thread-id>`
para as threads que foram enviadas. Se você negar ou ignorar a aprovação,
o OpenClaw não imprime esses ids do Codex. Esse upload não substitui a exportação local de
diagnóstico do Gateway.

`/codex resume` grava o mesmo arquivo de associação sidecar que o harness usa para
turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread do Codex, passa o
modelo do OpenClaw selecionado no momento para o servidor de apps e mantém o histórico estendido
ativado.

### Inspecionar uma thread do Codex pela CLI

A maneira mais rápida de entender uma execução ruim do Codex geralmente é abrir a thread nativa do Codex
diretamente:

```sh
codex resume <thread-id>
```

Use isso quando notar um bug em uma conversa de canal e quiser inspecionar a
sessão problemática do Codex, continuá-la localmente ou perguntar ao Codex por que ele fez uma
escolha específica de ferramenta ou raciocínio. O caminho mais fácil geralmente é executar
`/diagnostics [note]` primeiro: depois que você aprovar, o relatório concluído lista
cada thread do Codex e imprime um comando `Inspect locally`, por exemplo
`codex resume <thread-id>`. Você pode copiar esse comando diretamente em um terminal.

Você também pode obter um id de thread em `/codex binding` para o chat atual ou
`/codex threads [filter]` para threads recentes do servidor de apps do Codex e então executar o mesmo
comando `codex resume` no seu shell.

A superfície de comandos exige o servidor de apps do Codex `0.125.0` ou mais recente. Métodos de
controle individuais são relatados como `unsupported by this Codex app-server` se um
servidor de apps futuro ou personalizado não expuser esse método JSON-RPC.

## Limites dos hooks

O harness do Codex tem três camadas de hook:

| Camada                                | Proprietário             | Finalidade                                                          |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin do OpenClaw           | OpenClaw                 | Compatibilidade de produto/Plugin entre harnesses do PI e do Codex. |
| Middleware de extensão do servidor de apps do Codex | Plugins incluídos do OpenClaw | Comportamento de adaptador por turno em torno das ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política de ferramentas nativas da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para rotear
o comportamento de Plugin do OpenClaw. Para a ponte compatível de ferramenta nativa e permissões,
o OpenClaw injeta configuração do Codex por thread para `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Quando as aprovações do servidor de apps do Codex estão ativadas
(`approvalPolicy` não é `"never"`), a configuração de hook nativo injetada por padrão
omite `PermissionRequest` para que o revisor do servidor de apps do Codex e a ponte de aprovação do OpenClaw
lidam com escalonamentos reais após a revisão. Operadores ainda podem adicionar explicitamente
`permission_request` a `nativeHookRelay.events` quando precisam do relay de compatibilidade.
Outros hooks do Codex, como `SessionStart` e `UserPromptSubmit`, continuam sendo
controles no nível do Codex; eles não são expostos como hooks de Plugin do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita a
chamada, então o OpenClaw dispara o comportamento de Plugin e middleware que ele controla no
adaptador do harness. Para ferramentas nativas do Codex, o Codex controla o registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação por meio do servidor de apps ou de callbacks de hook nativo.

As projeções de Compaction e ciclo de vida de LLM vêm de notificações do servidor de apps do Codex
e do estado do adaptador do OpenClaw, não de comandos de hook nativo do Codex.
Os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte
da solicitação interna do Codex ou dos payloads de Compaction.

As notificações `hook/started` e `hook/completed` do servidor de apps de hook nativo do Codex são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de Plugin do OpenClaw.

## Contrato de suporte V1

O modo Codex não é o PI com uma chamada de modelo diferente por baixo. O Codex controla mais do
loop nativo do modelo, e o OpenClaw adapta suas superfícies de Plugin e sessão
em torno desse limite.

Compatível com o runtime v1 do Codex:

| Superfície                                     | Suporte                                                                              | Por quê                                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo OpenAI por meio do Codex        | Com suporte                                                                          | O app-server do Codex controla o turno da OpenAI, a retomada nativa de thread e a continuação nativa de ferramentas.                                                                                       |
| Roteamento e entrega de canais do OpenClaw     | Com suporte                                                                          | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais permanecem fora do runtime do modelo.                                                                                                         |
| Ferramentas dinâmicas do OpenClaw              | Com suporte                                                                          | O Codex pede que o OpenClaw execute essas ferramentas, então o OpenClaw permanece no caminho de execução.                                                                                                  |
| Plugins de prompt e contexto                   | Com suporte                                                                          | O OpenClaw cria sobreposições de prompt e projeta contexto no turno do Codex antes de iniciar ou retomar a thread.                                                                                         |
| Ciclo de vida do mecanismo de contexto         | Com suporte                                                                          | A montagem, a ingestão ou a manutenção após o turno e a coordenação de compactação do mecanismo de contexto são executadas para turnos do Codex.                                                           |
| Hooks de ferramentas dinâmicas                 | Com suporte                                                                          | `before_tool_call`, `after_tool_call` e o middleware de resultado de ferramenta são executados ao redor de ferramentas dinâmicas pertencentes ao OpenClaw.                                                 |
| Hooks de ciclo de vida                         | Com suporte como observações do adaptador                                            | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex.                                                                             |
| Gate de revisão da resposta final              | Com suporte por meio do relay de hook nativo                                         | O `Stop` do Codex é retransmitido para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem do modelo antes da finalização.                                                                   |
| Bloqueio ou observação de shell, patch e MCP nativos | Com suporte por meio do relay de hook nativo                                    | `PreToolUse` e `PostToolUse` do Codex são retransmitidos para superfícies de ferramentas nativas confirmadas, incluindo payloads MCP no app-server do Codex `0.125.0` ou mais recente. Há suporte a bloqueio; reescrita de argumentos não há. |
| Política de permissão nativa                   | Com suporte por aprovações do app-server do Codex e pelo relay de hook nativo de compatibilidade | Solicitações de aprovação do app-server do Codex passam pelo OpenClaw após a revisão do Codex. O relay de hook nativo `PermissionRequest` é opcional para modos de aprovação nativa porque o Codex o emite antes da revisão do guardião. |
| Captura de trajetória do app-server            | Com suporte                                                                          | O OpenClaw registra a solicitação que enviou ao app-server e as notificações do app-server que recebe.                                                                                                     |

Sem suporte no runtime Codex v1:

| Superfície                                          | Limite da V1                                                                                                                                     | Caminho futuro                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutação de argumentos de ferramentas nativas        | Hooks nativos de pré-ferramenta do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.              | Requer suporte de hook/esquema do Codex para substituição de entrada de ferramenta.       |
| Histórico editável de transcrição nativa do Codex   | O Codex controla o histórico canônico da thread nativa. O OpenClaw controla um espelho e pode projetar contexto futuro, mas não deve mutar internos sem suporte. | Adicionar APIs explícitas do app-server do Codex se a cirurgia de thread nativa for necessária. |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma escritas de transcrição pertencentes ao OpenClaw, não registros de ferramentas nativas do Codex.                          | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex. |
| Metadados ricos de compactação nativa               | O OpenClaw observa o início e a conclusão da compactação, mas não recebe uma lista estável de mantidos/descartados, delta de tokens ou payload de resumo. | Precisa de eventos de compactação mais ricos do Codex.                                    |
| Intervenção de Compaction                           | Os hooks atuais de Compaction do OpenClaw são em nível de notificação no modo Codex.                                                            | Adicionar hooks de pré/pós-compaction do Codex se os plugins precisarem vetar ou reescrever a compactação nativa. |
| Captura byte a byte da solicitação de API do modelo | O OpenClaw pode capturar solicitações e notificações do app-server, mas o núcleo do Codex cria a solicitação final da API da OpenAI internamente. | Precisa de um evento de rastreamento de solicitação de modelo do Codex ou de uma API de depuração. |

## Ferramentas, mídia e Compaction

O harness do Codex altera apenas o executor de agente incorporado de baixo nível.

O OpenClaw ainda cria a lista de ferramentas e recebe resultados de ferramentas dinâmicas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramenta de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

O relay de hook nativo é intencionalmente genérico, mas o contrato de suporte da v1 é
limitado aos caminhos de ferramenta e permissão nativas do Codex que o OpenClaw testa. No
runtime Codex, isso inclui payloads de shell, patch e MCP `PreToolUse`,
`PostToolUse` e `PermissionRequest`. Não presuma que todo evento futuro de hook do
Codex seja uma superfície de Plugin do OpenClaw até que o contrato do runtime o nomeie.

Para `PermissionRequest`, o OpenClaw retorna apenas decisões explícitas de permitir ou negar
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como ausência de
decisão de hook e segue para seu próprio caminho de guardião ou aprovação do usuário.
Modos de aprovação do app-server do Codex omitem esse hook nativo por padrão; este parágrafo
se aplica quando `permission_request` é incluído explicitamente em
`nativeHookRelay.events` ou quando um runtime de compatibilidade o instala.
Quando um operador escolhe `allow-always` para uma solicitação de permissão nativa do Codex,
o OpenClaw lembra a impressão digital exata de provedor/sessão/ferramenta/entrada/cwd por uma
janela de sessão limitada. A decisão lembrada é intencionalmente apenas de correspondência exata:
um comando, argumentos, payload de ferramenta ou cwd alterado cria uma nova
aprovação.

Elicitações de aprovação de ferramenta MCP do Codex são roteadas pelo fluxo de aprovação de Plugin
do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação do
servidor nativo em vez de ser direcionada como contexto extra. Outras solicitações de elicitação
MCP ainda falham fechadas.

O direcionamento da fila de execução ativa é mapeado para `turn/steer` do app-server do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa mensagens de chat enfileiradas
pela janela de silêncio configurada e as envia como uma solicitação `turn/steer` única em
ordem de chegada. O modo legado `queue` envia solicitações `turn/steer` separadas. Turnos de
revisão do Codex e Compaction manual podem rejeitar direcionamento no mesmo turno; nesse caso
o OpenClaw usa a fila de acompanhamento quando o modo selecionado permite fallback. Consulte
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

Quando o modelo selecionado usa o harness do Codex, a Compaction de thread nativa é
delegada ao app-server do Codex. O OpenClaw mantém um espelho da transcrição para histórico de canais,
busca, `/new`, `/reset` e alternância futura de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de raciocínio
ou plano do Codex quando o app-server os emite. Hoje, o OpenClaw só
registra sinais de início e conclusão de Compaction nativa. Ele ainda não expõe um
resumo de Compaction legível por humanos nem uma lista auditável de quais entradas o Codex
manteve após a Compaction.

Como o Codex controla a thread nativa canônica, `tool_result_persist` não
reescreve atualmente registros de resultado de ferramenta nativa do Codex. Ele só se aplica quando
o OpenClaw está escrevendo um resultado de ferramenta de transcrição de sessão pertencente ao OpenClaw.

Geração de mídia não exige PI. Imagem, vídeo, música, PDF, TTS e compreensão de mídia
continuam usando as configurações correspondentes de provedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**O Codex não aparece como um provedor `/model` normal:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*` com
`agentRuntime.id: "codex"` (ou uma ref legada `codex/*`), habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa PI em vez do Codex:** `agentRuntime.id: "auto"` ainda pode usar PI como
backend de compatibilidade quando nenhum harness do Codex assume a execução. Defina
`agentRuntime.id: "codex"` para forçar a seleção do Codex durante testes. Um
runtime Codex forçado falha em vez de voltar para PI. Depois que o app-server do Codex
é selecionado, suas falhas aparecem diretamente.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
relate a versão `0.125.0` ou mais recente. Pré-lançamentos da mesma versão ou versões com sufixo de build,
como `0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o
piso de protocolo estável `0.125.0` é o que o OpenClaw testa.

**A descoberta de modelos está lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desabilite a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão do protocolo do app-server do Codex.

**Um modelo não Codex usa PI:** isso é esperado, a menos que você tenha forçado
`agentRuntime.id: "codex"` para esse agente ou selecionado uma ref legada
`codex/*`. Refs simples `openai/gpt-*` e de outros provedores permanecem em seu caminho de
provedor normal no modo `auto`. Se você forçar `agentRuntime.id: "codex"`, todo turno incorporado
desse agente deve ser um modelo OpenAI com suporte pelo Codex.

**Computer Use está instalado, mas as ferramentas não são executadas:** verifique
`/codex computer-use status` a partir de uma nova sessão. Se uma ferramenta informar
`Native hook relay unavailable`, use `/new` ou `/reset`; se o problema persistir, reinicie
o Gateway para limpar registros obsoletos de hooks nativos. Se `computer-use.list_apps`
atingir o tempo limite, reinicie o Codex Computer Use ou o Codex Desktop e tente novamente.

## Relacionado

- [plugins de harness de agentes](/pt-BR/plugins/sdk-agent-harness)
- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Status](/pt-BR/cli/status)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
