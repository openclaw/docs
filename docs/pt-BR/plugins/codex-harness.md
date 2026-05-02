---
read_when:
    - Você quer usar o ambiente de servidor de aplicativo do Codex incluído
    - Você precisa de exemplos de configuração do ambiente de execução do Codex
    - Você quer que implantações somente com Codex falhem em vez de recorrerem ao PI
summary: Execute turnos do agente embutido do OpenClaw por meio do harness app-server do Codex incluído
title: Ambiente de execução do Codex
x-i18n:
    generated_at: "2026-05-02T05:51:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 107f9fc0a3e8ad6a4790fc9eb68276c81d299236f11293014d2ab9bf6e235133
    source_path: plugins/codex-harness.md
    workflow: 16
---

O Plugin `codex` incluído permite que o OpenClaw execute turnos de agente incorporados pelo
servidor de app do Codex em vez do harness PI integrado.

Use isto quando você quiser que o Codex seja responsável pela sessão de agente de baixo nível:
descoberta de modelos, retomada nativa de threads, Compaction nativa e execução no servidor de app.
O OpenClaw ainda é responsável pelos canais de chat, arquivos de sessão, seleção de modelo, ferramentas,
aprovações, entrega de mídia e o espelho visível da transcrição.

Quando um turno de chat de origem é executado pelo harness do Codex, as respostas visíveis usam por padrão
a ferramenta `message` do OpenClaw se a implantação não tiver configurado explicitamente
`messages.visibleReplies`. O agente ainda pode finalizar seu turno do Codex em privado;
ele só publica no canal quando chama `message(action="send")`. Defina
`messages.visibleReplies: "automatic"` para manter as respostas finais de chat direto no
caminho legado de entrega automática.

Turnos de Heartbeat do Codex também recebem a ferramenta `heartbeat_respond` por padrão, para que o
agente possa registrar se o despertar deve permanecer silencioso ou notificar sem codificar
esse fluxo de controle no texto final.

Se você está tentando se orientar, comece com
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a referência de modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal permanece a superfície de comunicação.

## Configuração rápida

A maioria dos usuários que quer "Codex no OpenClaw" quer esta rota: entrar com uma
assinatura ChatGPT/Codex e então executar turnos de agente incorporados pelo runtime nativo
do servidor de app do Codex. A referência de modelo ainda permanece canônica como
`openai/gpt-*`; a autenticação por assinatura vem da conta/perfil do Codex, não
de um prefixo de modelo `openai-codex/*`.

Primeiro entre com OAuth do Codex se ainda não tiver feito isso:

```bash
openclaw models auth login --provider openai-codex
```

Depois habilite o plugin `codex` incluído e force o runtime do Codex:

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

Não use `openai-codex/gpt-*` quando você quer dizer runtime nativo do Codex. Esse prefixo
é a rota explícita "OAuth do Codex por PI". Alterações de configuração se aplicam a sessões novas ou
redefinidas; sessões existentes mantêm o runtime registrado.

## O que este plugin muda

O plugin `codex` incluído contribui várias capacidades separadas:

| Capacidade                         | Como você usa                                      | O que faz                                                                      |
| ---------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime incorporado nativo         | `agentRuntime.id: "codex"`                        | Executa turnos de agente incorporados do OpenClaw pelo servidor de app do Codex. |
| Comandos nativos de controle de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula e controla threads do servidor de app do Codex a partir de uma conversa de mensagens. |
| Provedor/catálogo do servidor de app do Codex | internos de `codex`, expostos pelo harness        | Permite que o runtime descubra e valide modelos do servidor de app.            |
| Caminho de compreensão de mídia do Codex | caminhos de compatibilidade de modelo de imagem `codex/*` | Executa turnos limitados do servidor de app do Codex para modelos compatíveis de compreensão de imagem. |
| Relay de hooks nativos             | Hooks de plugin em torno de eventos nativos do Codex | Permite que o OpenClaw observe/bloqueie eventos compatíveis nativos do Codex de ferramentas/finalização. |

Habilitar o plugin torna essas capacidades disponíveis. Ele **não**:

- começa a usar Codex para todos os modelos OpenAI
- converte referências de modelo `openai-codex/*` para o runtime nativo
- torna ACP/acpx o caminho padrão do Codex
- troca em tempo real sessões existentes que já registraram um runtime PI
- substitui a entrega de canais do OpenClaw, arquivos de sessão, armazenamento de perfil de autenticação ou
  roteamento de mensagens

O mesmo plugin também é responsável pela superfície nativa de comando de controle de chat `/codex`. Se
o plugin estiver habilitado e o usuário pedir para vincular, retomar, orientar, parar ou inspecionar
threads do Codex pelo chat, agentes devem preferir `/codex ...` em vez de ACP. ACP permanece
o fallback explícito quando o usuário pede ACP/acpx ou está testando o adaptador ACP
do Codex.

Turnos nativos do Codex mantêm hooks de plugin do OpenClaw como a camada pública de compatibilidade.
Estes são hooks em processo do OpenClaw, não hooks de comando `hooks.json` do Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros espelhados da transcrição
- `before_agent_finalize` por meio do relay `Stop` do Codex
- `agent_end`

Plugins também podem registrar middleware de resultado de ferramenta neutro em relação ao runtime para reescrever
resultados de ferramentas dinâmicas do OpenClaw depois que o OpenClaw executa a ferramenta e antes que o
resultado seja retornado ao Codex. Isso é separado do hook público de plugin
`tool_result_persist`, que transforma gravações de resultado de ferramenta da transcrição pertencentes ao OpenClaw.

Para as semânticas dos hooks de plugin em si, veja [Hooks de plugin](/pt-BR/plugins/hooks)
e [Comportamento de guarda de plugin](/pt-BR/tools/plugin).

O harness fica desativado por padrão. Novas configurações devem manter referências de modelo OpenAI
canônicas como `openai/gpt-*` e forçar explicitamente
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` quando quiserem
execução nativa no servidor de app. Referências de modelo legadas `codex/*` ainda selecionam automaticamente
o harness por compatibilidade, mas prefixos legados de provedor apoiados por runtime
não são mostrados como escolhas normais de modelo/provedor.

Se o plugin `codex` estiver habilitado, mas o modelo principal ainda for
`openai-codex/*`, `openclaw doctor` avisa em vez de mudar a rota. Isso é
intencional: `openai-codex/*` permanece o caminho PI de OAuth/assinatura do Codex, e
a execução nativa no servidor de app continua sendo uma escolha explícita de runtime.

## Mapa de rotas

Use esta tabela antes de alterar a configuração:

| Comportamento desejado                              | Referência de modelo       | Configuração de runtime                  | Rota de autenticação/perfil      | Rótulo de status esperado       |
| --------------------------------------------------- | -------------------------- | ---------------------------------------- | -------------------------------- | ------------------------------- |
| Assinatura ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`               | OAuth do Codex ou conta Codex    | `Runtime: OpenAI Codex`         |
| API OpenAI pelo executor normal do OpenClaw         | `openai/gpt-*`             | omitido ou `runtime: "pi"`               | Chave de API OpenAI              | `Runtime: OpenClaw Pi Default`  |
| Assinatura ChatGPT/Codex por PI                     | `openai-codex/gpt-*`       | omitido ou `runtime: "pi"`               | Provedor OAuth OpenAI Codex      | `Runtime: OpenClaw Pi Default`  |
| Provedores mistos com modo automático conservador   | refs específicas do provedor | `agentRuntime.id: "auto"`              | Por provedor selecionado         | Depende do runtime selecionado  |
| Sessão explícita do adaptador ACP do Codex          | dependente de prompt/modelo ACP | `sessions_spawn` com `runtime: "acp"` | Autenticação do backend ACP      | Status de tarefa/sessão ACP     |

A divisão importante é provedor versus runtime:

- `openai-codex/*` responde "qual rota de provedor/autenticação o PI deve usar?"
- `agentRuntime.id: "codex"` responde "qual loop deve executar este
  turno incorporado?"
- `/codex ...` responde "a qual conversa nativa do Codex este chat deve se vincular
  ou controlar?"
- ACP responde "qual processo externo de harness o acpx deve iniciar?"

## Escolha o prefixo de modelo correto

Rotas da família OpenAI são específicas por prefixo. Para a configuração comum de assinatura mais
runtime nativo do Codex, use `openai/*` com `agentRuntime.id: "codex"`.
Use `openai-codex/*` apenas quando você intencionalmente quiser OAuth do Codex por PI:

| Referência de modelo                         | Caminho de runtime                          | Use quando                                                                 |
| -------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | Provedor OpenAI pelo encanamento OpenClaw/PI | Você quer acesso atual direto à API da OpenAI Platform com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | OAuth OpenAI Codex pelo OpenClaw/PI         | Você quer autenticação por assinatura ChatGPT/Codex com o executor PI padrão. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness do servidor de app do Codex         | Você quer autenticação por assinatura ChatGPT/Codex com execução nativa do Codex. |

GPT-5.5 pode aparecer tanto nas rotas diretas por chave de API OpenAI quanto nas rotas de assinatura Codex
quando sua conta as expõe. Use `openai/gpt-5.5` com o harness do servidor de app do Codex
para runtime nativo do Codex, `openai-codex/gpt-5.5` para OAuth por PI, ou
`openai/gpt-5.5` sem uma substituição de runtime do Codex para tráfego direto por chave de API.

Refs legadas `codex/gpt-*` continuam aceitas como aliases de compatibilidade. A migração de compatibilidade
do Doctor reescreve refs legadas de runtime principal para refs de modelo canônicas
e registra a política de runtime separadamente, enquanto refs legadas apenas de fallback
são deixadas inalteradas porque o runtime é configurado para todo o contêiner do agente.
Novas configurações PI de OAuth do Codex devem usar `openai-codex/gpt-*`; novas configurações
de harness nativo do servidor de app devem usar `openai/gpt-*` mais
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use
`openai-codex/gpt-*` quando a compreensão de imagem deve ser executada pelo caminho do provedor
OAuth OpenAI Codex. Use `codex/gpt-*` quando a compreensão de imagem deve ser executada
por um turno limitado do servidor de app do Codex. O modelo do servidor de app do Codex deve
anunciar compatibilidade com entrada de imagem; modelos Codex somente de texto falham antes de o turno de mídia
começar.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a
seleção for surpreendente, habilite logs de depuração para o subsistema `agents/harness`
e inspecione o registro estruturado `agent harness selected` do Gateway. Ele
inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e,
no modo `auto`, o resultado de compatibilidade de cada candidato de plugin.

### O que significam os avisos do Doctor

`openclaw doctor` avisa quando todos estes itens são verdadeiros:

- o plugin `codex` incluído está habilitado ou permitido
- o modelo principal de um agente é `openai-codex/*`
- o runtime efetivo desse agente não é `codex`

Esse aviso existe porque usuários frequentemente esperam que "plugin Codex habilitado" implique
"runtime nativo do servidor de app do Codex." O OpenClaw não faz esse salto. O aviso
significa:

- **Nenhuma alteração é necessária** se você pretendia OAuth ChatGPT/Codex por PI.
- Altere o modelo para `openai/<model>` e defina
  `agentRuntime.id: "codex"` se você pretendia execução nativa no servidor de app.
- Sessões existentes ainda precisam de `/new` ou `/reset` após uma alteração de runtime,
  porque pins de runtime de sessão são persistentes.

A seleção de harness não é um controle de sessão ao vivo. Quando um turno incorporado é executado,
o OpenClaw registra o id do harness selecionado nessa sessão e continua usando-o para
turnos posteriores no mesmo id de sessão. Altere a configuração `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro harness;
use `/new` ou `/reset` para iniciar uma sessão nova antes de alternar uma conversa existente
entre PI e Codex. Isso evita reproduzir uma transcrição por
dois sistemas de sessão nativos incompatíveis.

Sessões legadas criadas antes de pins de harness são tratadas como fixadas em PI assim que
têm histórico de transcrição. Use `/new` ou `/reset` para optar por Codex nessa conversa
após alterar a configuração.

`/status` mostra o runtime efetivo do modelo. O harness padrão de PI aparece como
`Runtime: OpenClaw Pi Default`, e o harness do app-server do Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw com o plugin `codex` incluído disponível.
- App-server do Codex `0.125.0` ou mais recente. O plugin incluído gerencia um
  binário compatível do app-server do Codex por padrão, portanto comandos locais
  `codex` no `PATH` não afetam a inicialização normal do harness.
- Autenticação do Codex disponível para o processo app-server ou para a ponte de
  autenticação Codex do OpenClaw. Inicializações locais do app-server usam um
  diretório inicial do Codex gerenciado pelo OpenClaw para cada agente e um
  `HOME` filho isolado, portanto, por padrão, elas não leem sua conta pessoal
  `~/.codex`, Skills, plugins, configuração, estado de threads ou
  `$HOME/.agents/skills` nativo.

O plugin bloqueia handshakes de app-server mais antigos ou sem versão. Isso
mantém o OpenClaw na superfície de protocolo contra a qual ele foi testado.

Para testes smoke live e em Docker, a autenticação geralmente vem da conta da
CLI do Codex ou de um perfil de autenticação `openai-codex` do OpenClaw.
Inicializações locais do app-server por stdio também podem recorrer a
`CODEX_API_KEY` / `OPENAI_API_KEY` quando nenhuma conta estiver presente.

## Adicionar Codex junto de outros modelos

Não defina `agentRuntime.id: "codex"` globalmente se o mesmo agente deve alternar
livremente entre Codex e modelos de provedores que não sejam Codex. Um runtime
forçado se aplica a todos os turnos incorporados desse agente ou sessão. Se você
selecionar um modelo Anthropic enquanto esse runtime estiver forçado, o OpenClaw
ainda tentará o harness do Codex e falhará fechado, em vez de rotear
silenciosamente esse turno pelo PI.

Use um destes formatos:

- Coloque o Codex em um agente dedicado com `agentRuntime.id: "codex"`.
- Mantenha o agente padrão em `agentRuntime.id: "auto"` e fallback para PI para
  uso normal misto de provedores.
- Use referências legadas `codex/*` apenas para compatibilidade. Novas
  configurações devem preferir `openai/*` mais uma política explícita de runtime
  do Codex.

Por exemplo, isto mantém o agente padrão na seleção automática normal e adiciona
um agente Codex separado:

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

Com esse formato:

- O agente padrão `main` usa o caminho normal de provedor e o fallback de
  compatibilidade do PI.
- O agente `codex` usa o harness do app-server do Codex.
- Se o Codex estiver ausente ou não for compatível para o agente `codex`, o turno
  falha em vez de usar o PI silenciosamente.

## Roteamento de comandos de agente

Agentes devem rotear solicitações do usuário por intenção, não apenas pela
palavra "Codex":

| O usuário pede...                                      | O agente deve usar...                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincular este chat ao Codex"                          | `/codex bind`                                    |
| "Retomar thread do Codex `<id>` aqui"                  | `/codex resume <id>`                             |
| "Mostrar threads do Codex"                             | `/codex threads`                                 |
| "Registrar um relatório de suporte para uma execução ruim do Codex" | `/diagnostics [note]`                 |
| "Enviar feedback do Codex apenas para esta thread anexada" | `/codex diagnostics [note]`                  |
| "Usar minha assinatura ChatGPT/Codex com o runtime do Codex" | `openai/*` mais `agentRuntime.id: "codex"`  |
| "Usar minha assinatura ChatGPT/Codex por meio do PI"   | referências de modelo `openai-codex/*`           |
| "Executar Codex por meio de ACP/acpx"                  | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Iniciar Claude Code/Gemini/OpenCode/Cursor em uma thread" | ACP/acpx, não `/codex` e não subagentes nativos |

O OpenClaw só anuncia orientações de spawn do ACP para agentes quando o ACP está
habilitado, despachável e apoiado por um backend de runtime carregado. Se o ACP
não estiver disponível, o prompt do sistema e as Skills do plugin não devem
ensinar o agente sobre roteamento ACP.

## Implantações somente com Codex

Force o harness do Codex quando você precisar provar que todos os turnos de
agente incorporados usam Codex. Runtimes explícitos de plugin têm, por padrão,
nenhum fallback para PI, portanto `fallback: "none"` é opcional, mas muitas vezes
útil como documentação:

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

Com Codex forçado, o OpenClaw falha cedo se o plugin Codex estiver desabilitado,
se o app-server for antigo demais ou se o app-server não conseguir iniciar.
Defina `OPENCLAW_AGENT_HARNESS_FALLBACK=pi` apenas se você quiser
intencionalmente que o PI lide com uma seleção de harness ausente.

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

Use comandos normais de sessão para alternar agentes e modelos. `/new` cria uma
nova sessão OpenClaw, e o harness do Codex cria ou retoma sua thread sidecar do
app-server conforme necessário. `/reset` limpa a vinculação de sessão do
OpenClaw para essa thread e permite que o próximo turno resolva o harness a
partir da configuração atual novamente.

## Descoberta de modelos

Por padrão, o plugin Codex pergunta ao app-server quais modelos estão
disponíveis. Se a descoberta falhar ou expirar, ele usa um catálogo de fallback
incluído para:

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

Desabilite a descoberta quando quiser que a inicialização evite sondar o Codex e
fique no catálogo de fallback:

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

Por padrão, o plugin inicia localmente o binário gerenciado do Codex do OpenClaw
com:

```bash
codex app-server --listen stdio://
```

O binário gerenciado é distribuído com o pacote do plugin `codex`. Isso mantém a
versão do app-server vinculada ao plugin incluído, em vez de qualquer CLI do
Codex separada que por acaso esteja instalada localmente. Defina
`appServer.command` apenas quando você quiser intencionalmente executar um
executável diferente.

Por padrão, o OpenClaw inicia sessões locais do harness do Codex em modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa é a postura confiável de operador local
usada para heartbeats autônomos: o Codex pode usar ferramentas de shell e rede
sem parar em prompts de aprovação nativos que ninguém está por perto para
responder.

Para optar por aprovações revisadas pelo guardian do Codex, defina
`appServer.mode: "guardian"`:

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

O modo Guardian usa o caminho de aprovação por revisão automática nativo do
Codex. Quando o Codex pede para sair do sandbox, escrever fora do workspace ou
adicionar permissões como acesso à rede, o Codex roteia essa solicitação de
aprovação para o revisor nativo em vez de um prompt humano. O revisor aplica a
estrutura de risco do Codex e aprova ou nega a solicitação específica. Use
Guardian quando quiser mais salvaguardas do que o modo YOLO, mas ainda precisar
que agentes desacompanhados avancem.

O preset `guardian` se expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`. Campos de
política individuais ainda sobrescrevem `mode`, portanto implantações avançadas
podem combinar o preset com escolhas explícitas. O valor de revisor mais antigo
`guardian_subagent` ainda é aceito como alias de compatibilidade, mas novas
configurações devem usar `auto_review`.

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

Inicializações do app-server por stdio herdam o ambiente de processo do OpenClaw
por padrão, mas o OpenClaw é dono da ponte de conta do app-server do Codex e
define tanto `CODEX_HOME` quanto `HOME` para diretórios por agente sob o estado
OpenClaw desse agente. O carregador de Skills próprio do Codex lê
`$CODEX_HOME/skills` e `$HOME/.agents/skills`, portanto ambos os valores são
isolados para inicializações locais do app-server. Isso mantém Skills nativas do
Codex, plugins, configuração, contas e estado de threads escopados ao agente
OpenClaw, em vez de vazarem do diretório inicial pessoal da CLI do Codex do
operador.

Plugins OpenClaw e snapshots de Skills do OpenClaw ainda fluem pelo próprio
registro de plugins e carregador de Skills do OpenClaw. Ativos pessoais da CLI
do Codex não fluem. Se você tiver Skills ou plugins úteis da CLI do Codex que
devem se tornar parte de um agente OpenClaw, inventarie-os explicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

O provedor de migração do Codex copia Skills para o workspace atual do agente
OpenClaw. Plugins nativos do Codex, hooks e arquivos de configuração são
relatados ou arquivados para revisão manual em vez de serem ativados
automaticamente, porque podem executar comandos, expor servidores MCP ou carregar
credenciais.

A autenticação é selecionada nesta ordem:

1. Um perfil explícito de autenticação Codex do OpenClaw para o agente.
2. A conta existente do app-server no diretório inicial Codex desse agente.
3. Apenas para inicializações locais do app-server por stdio, `CODEX_API_KEY`,
   depois `OPENAI_API_KEY`, quando nenhuma conta do app-server está presente e a
   autenticação OpenAI ainda é necessária.

Quando o OpenClaw encontra um perfil de autenticação Codex no estilo assinatura
ChatGPT, ele remove `CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho Codex
gerado. Isso mantém chaves de API no nível do Gateway disponíveis para
embeddings ou modelos OpenAI diretos sem fazer com que turnos nativos do
app-server do Codex sejam cobrados pela API por acidente. Perfis explícitos de
chave de API do Codex e fallback local por chave de ambiente stdio usam login no
app-server em vez de ambiente herdado do processo filho. Conexões WebSocket ao
app-server não recebem fallback de chave de API do ambiente do Gateway; use um
perfil de autenticação explícito ou a própria conta do app-server remoto.

Se uma implantação precisar de isolamento adicional de ambiente, adicione essas
variáveis a `appServer.clearEnv`:

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

`appServer.clearEnv` afeta apenas o processo filho do app-server do Codex gerado.

As ferramentas dinâmicas do Codex usam, por padrão, o perfil `native-first`.
Nesse modo, o OpenClaw não expõe ferramentas dinâmicas que duplicam operações de
workspace nativas do Codex: `read`, `write`, `edit`, `apply_patch`, `exec`,
`process` e `update_plan`. Ferramentas de integração do OpenClaw, como
mensagens, sessões, mídia, cron, navegador, nós, gateway, `heartbeat_respond` e
`web_search` permanecem disponíveis.

Campos de Plugin Codex de nível superior compatíveis:

| Campo                      | Padrão          | Significado                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Use `"openclaw-compat"` para expor o conjunto completo de ferramentas dinâmicas do OpenClaw ao app-server do Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir dos turnos do app-server do Codex.               |

Campos `appServer` compatíveis:

| Campo               | Padrão                                  | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                             |
| `command`           | binário gerenciado do Codex                     | Executável para transporte stdio. Deixe não definido para usar o binário gerenciado; defina-o apenas para uma substituição explícita.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                                                                                                                                       |
| `url`               | não definido                                    | URL do app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | não definido                                    | Token bearer para transporte WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Cabeçalhos WebSocket extras.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nomes extras de variáveis de ambiente removidos do processo app-server stdio iniciado depois que o OpenClaw monta seu ambiente herdado. `CODEX_HOME` e `HOME` são reservados para o isolamento Codex por agente do OpenClaw em inicializações locais. |
| `requestTimeoutMs`  | `60000`                                  | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Predefinição para execução YOLO ou revisada pelo guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Política nativa de aprovação do Codex enviada para início/retomada/turno de thread.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Modo nativo de sandbox do Codex enviado para início/retomada de thread.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Use `"auto_review"` para permitir que o Codex revise prompts nativos de aprovação. `guardian_subagent` continua sendo um alias legado.                                                                                                                         |
| `serviceTier`       | não definido                                    | Camada de serviço opcional do app-server do Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados.                                                                                                                            |

Chamadas de ferramentas dinâmicas pertencentes ao OpenClaw são limitadas de forma independente de
`appServer.requestTimeoutMs`: cada solicitação Codex `item/tool/call` deve receber
uma resposta do OpenClaw em até 30 segundos. Em caso de tempo limite, o OpenClaw aborta o sinal da ferramenta
quando compatível e retorna uma resposta de ferramenta dinâmica com falha ao Codex para que
o turno possa continuar em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação app-server com escopo de turno do Codex, o harness
também espera que o Codex finalize o turno nativo com `turn/completed`. Se o
app-server ficar silencioso por 60 segundos após essa resposta, o OpenClaw faz o possível para
interromper o turno do Codex, registra um diagnóstico de tempo limite e libera a
faixa de sessão do OpenClaw para que mensagens de chat subsequentes não fiquem enfileiradas atrás de um
turno nativo obsoleto.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais avulsos. A configuração é
preferida para implantações repetíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness do Codex.

## Uso do computador

Uso do computador é abordado em seu próprio guia de configuração:
[Uso do computador do Codex](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não incorpora o app de controle de desktop nem executa
ações de desktop por conta própria. Ele prepara o app-server do Codex, verifica se o
servidor MCP `computer-use` está disponível e então deixa o Codex lidar com as chamadas
nativas de ferramenta MCP durante turnos no modo Codex.

Para acesso direto ao driver TryCua fora do fluxo do marketplace do Codex, registre
`cua-driver mcp` com `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulte [Uso do computador do Codex](/pt-BR/plugins/codex-computer-use) para ver a distinção
entre Uso do computador pertencente ao Codex e registro direto de MCP.

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

Uso do computador é específico do macOS e pode exigir permissões locais do SO antes que o
servidor MCP do Codex consiga controlar apps. Se `computerUse.enabled` for true e o servidor MCP
não estiver disponível, turnos no modo Codex falham antes que a thread comece, em vez de
serem executados silenciosamente sem as ferramentas nativas de Uso do computador. Consulte
[Uso do computador do Codex](/pt-BR/plugins/codex-computer-use) para opções de marketplace,
limites de catálogo remoto, motivos de status e solução de problemas.

Quando `computerUse.autoInstall` é true, o OpenClaw pode registrar o marketplace padrão
incluído do Codex Desktop a partir de
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se o Codex
ainda não tiver descoberto um marketplace local. Use `/new` ou `/reset` após
alterar a configuração de runtime ou de Uso do computador para que sessões existentes não mantenham uma vinculação
antiga de Pi ou de thread do Codex.

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

Aprovações do Codex revisadas pelo guardian:

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

A troca de modelo continua controlada pelo OpenClaw. Quando uma sessão do OpenClaw está anexada
a uma thread existente do Codex, o próximo turno envia novamente ao app-server
o modelo OpenAI, provedor, política de aprovação, sandbox e camada de serviço
atualmente selecionados. Trocar de `openai/gpt-5.5` para `openai/gpt-5.2` mantém a
vinculação da thread, mas solicita que o Codex continue com o modelo recém-selecionado.

## Comando Codex

O Plugin incluído registra `/codex` como um comando de barra autorizado. Ele é
genérico e funciona em qualquer canal compatível com comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade ao vivo do app-server, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista modelos ao vivo do app-server do Codex.
- `/codex threads [filter]` lista threads recentes do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma thread existente do Codex.
- `/codex compact` solicita que o app-server do Codex compacte a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pergunta antes de enviar feedback de diagnóstico do Codex para a thread anexada.
- `/codex computer-use status` verifica o Plugin de Uso do computador configurado e o servidor MCP.
- `/codex computer-use install` instala o Plugin de Uso do computador configurado e recarrega os servidores MCP.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do app-server do Codex.
- `/codex skills` lista as Skills do app-server do Codex.

### Fluxo de depuração comum

Quando um agente respaldado pelo Codex faz algo surpreendente no Telegram, Discord, Slack
ou outro canal, comece pela conversa onde o problema aconteceu:

1. Execute `/diagnostics bad tool choice after image upload` ou outra nota curta
   que descreva o que você viu.
2. Aprove a solicitação de diagnóstico uma vez. A aprovação cria o zip local de
   diagnósticos do Gateway e, como a sessão está usando o ambiente de execução do
   Codex, também envia o pacote de feedback relevante do Codex para os servidores
   da OpenAI.
3. Copie a resposta de diagnóstico concluída para o relatório de bug ou thread de
   suporte. Ela inclui o caminho do pacote local, o resumo de privacidade, os ids
   de sessão do OpenClaw, os ids de thread do Codex e uma linha `Inspect locally`
   para cada thread do Codex.
4. Se quiser depurar a execução por conta própria, execute o comando impresso
   `Inspect locally` em um terminal. Ele se parece com `codex resume <thread-id>`
   e abre a thread nativa do Codex para que você possa inspecionar a conversa,
   continuá-la localmente ou perguntar ao Codex por que ele escolheu uma
   ferramenta ou plano específico.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o
upload de feedback do Codex para a thread atualmente anexada, sem o pacote
completo de diagnósticos do Gateway do OpenClaw. Para a maioria dos relatórios de
suporte, `/diagnostics [note]` é o melhor ponto de partida, porque vincula o
estado local do Gateway e os ids de thread do Codex em uma única resposta. Consulte
[Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para ver o modelo completo de
privacidade e o comportamento em conversas em grupo.

O núcleo do OpenClaw também expõe `/diagnostics [note]`, somente para owners,
como o comando geral de diagnósticos do Gateway. Seu prompt de aprovação mostra o
preâmbulo sobre dados sensíveis, vincula a [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
e solicita `openclaw gateway diagnostics export --json` por meio de aprovação
explícita de execução todas as vezes. Não aprove diagnósticos com uma regra
allow-all. Após a aprovação, o OpenClaw envia um relatório colável com o caminho
do pacote local e o resumo do manifesto. Quando a sessão ativa do OpenClaw está
usando o ambiente de execução do Codex, essa mesma aprovação também autoriza o
envio dos pacotes de feedback relevantes do Codex para os servidores da OpenAI. O
prompt de aprovação diz que o feedback do Codex será enviado, mas não lista ids
de sessão ou thread do Codex antes da aprovação.

Se `/diagnostics` for invocado por um owner em uma conversa em grupo, o OpenClaw
mantém o canal compartilhado limpo: o grupo recebe apenas um aviso curto,
enquanto o preâmbulo de diagnósticos, os prompts de aprovação e os ids de
sessão/thread do Codex são enviados ao owner pela rota privada de aprovação. Se
não houver uma rota privada para o owner, o OpenClaw recusa a solicitação do grupo
e pede que o owner a execute a partir de uma DM.

O upload aprovado do Codex chama `feedback/upload` do app-server do Codex e pede
ao app-server que inclua logs para cada thread listada e subthreads do Codex
geradas quando disponíveis. O upload passa pelo caminho normal de feedback do
Codex para os servidores da OpenAI; se o feedback do Codex estiver desativado
nesse app-server, o comando retorna o erro do app-server. A resposta de
diagnóstico concluída lista os canais, os ids de sessão do OpenClaw, os ids de
thread do Codex e os comandos locais `codex resume <thread-id>` para as threads
que foram enviadas. Se você negar ou ignorar a aprovação, o OpenClaw não imprime
esses ids do Codex. Esse upload não substitui a exportação local de diagnósticos
do Gateway.

`/codex resume` grava o mesmo arquivo de vinculação sidecar que o ambiente de
execução usa para turnos normais. Na próxima mensagem, o OpenClaw retoma essa
thread do Codex, passa o modelo do OpenClaw atualmente selecionado para o
app-server e mantém o histórico estendido ativado.

### Inspecionar uma thread do Codex pela CLI

A maneira mais rápida de entender uma execução ruim do Codex costuma ser abrir a
thread nativa do Codex diretamente:

```sh
codex resume <thread-id>
```

Use isso quando notar um bug em uma conversa de canal e quiser inspecionar a
sessão problemática do Codex, continuá-la localmente ou perguntar ao Codex por
que ele fez uma escolha específica de ferramenta ou raciocínio. O caminho mais
fácil geralmente é executar `/diagnostics [note]` primeiro: depois que você o
aprova, o relatório concluído lista cada thread do Codex e imprime um comando
`Inspect locally`, por exemplo `codex resume <thread-id>`. Você pode copiar esse
comando diretamente para um terminal.

Você também pode obter um id de thread em `/codex binding` para a conversa atual
ou em `/codex threads [filter]` para threads recentes do app-server do Codex e,
depois, executar o mesmo comando `codex resume` no seu shell.

A superfície de comando exige o app-server do Codex `0.125.0` ou mais recente.
Métodos de controle individuais são relatados como `unsupported by this Codex app-server`
se um app-server futuro ou personalizado não expuser esse método JSON-RPC.

## Limites de hooks

O ambiente de execução do Codex tem três camadas de hook:

| Camada                                | Owner                    | Finalidade                                                          |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugins do OpenClaw          | OpenClaw                 | Compatibilidade de produto/plugin entre ambientes PI e Codex.       |
| Middleware de extensão do app-server do Codex | Plugins empacotados do OpenClaw | Comportamento de adaptador por turno em torno de ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política de ferramentas nativas da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para
rotear o comportamento de plugins do OpenClaw. Para a ponte compatível de
ferramentas nativas e permissões, o OpenClaw injeta configuração do Codex por
thread para `PreToolUse`, `PostToolUse`, `PermissionRequest` e `Stop`. Outros
hooks do Codex, como `SessionStart` e `UserPromptSubmit`, continuam sendo
controles no nível do Codex; eles não são expostos como hooks de plugins do
OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois
que o Codex solicita a chamada, então o OpenClaw dispara o comportamento de
plugin e middleware que ele possui no adaptador do ambiente de execução. Para
ferramentas nativas do Codex, o Codex possui o registro canônico da ferramenta. O
OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread
nativa do Codex a menos que o Codex exponha essa operação por meio do app-server
ou de callbacks de hooks nativos.

As projeções de ciclo de vida de Compaction e LLM vêm de notificações do
app-server do Codex e do estado do adaptador do OpenClaw, não de comandos de
hooks nativos do Codex. Os eventos `before_compaction`, `after_compaction`,
`llm_input` e `llm_output` do OpenClaw são observações no nível do adaptador, não
capturas byte a byte da solicitação interna ou dos payloads de Compaction do
Codex.

As notificações `hook/started` e `hook/completed` nativas do Codex no app-server
são projetadas como eventos de agente `codex_app_server.hook` para trajetória e
depuração. Elas não invocam hooks de plugins do OpenClaw.

## Contrato de suporte v1

O modo Codex não é PI com uma chamada de modelo diferente por baixo. O Codex
possui uma parte maior do loop de modelo nativo, e o OpenClaw adapta suas
superfícies de plugin e sessão em torno desse limite.

Compatível no runtime v1 do Codex:

| Superfície                                    | Suporte                                 | Por quê                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo OpenAI por meio do Codex       | Compatível                              | O app-server do Codex possui o turno OpenAI, a retomada de thread nativa e a continuação de ferramentas nativas.                                                                                     |
| Roteamento e entrega de canais do OpenClaw    | Compatível                              | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais permanecem fora do runtime do modelo.                                                                                                    |
| Ferramentas dinâmicas do OpenClaw             | Compatível                              | O Codex pede que o OpenClaw execute essas ferramentas, então o OpenClaw permanece no caminho de execução.                                                                                             |
| Plugins de prompt e contexto                  | Compatível                              | O OpenClaw constrói sobreposições de prompt e projeta contexto no turno do Codex antes de iniciar ou retomar a thread.                                                                                |
| Ciclo de vida do mecanismo de contexto        | Compatível                              | A montagem, a ingestão ou manutenção pós-turno e a coordenação de Compaction do mecanismo de contexto são executadas para turnos do Codex.                                                            |
| Hooks de ferramentas dinâmicas                | Compatível                              | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta são executados em torno de ferramentas dinâmicas pertencentes ao OpenClaw.                                               |
| Hooks de ciclo de vida                        | Compatível como observações do adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex.                                                                        |
| Gate de revisão de resposta final             | Compatível por meio do relay de hook nativo | `Stop` do Codex é encaminhado para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem de modelo antes da finalização.                                                                  |
| Bloqueio ou observação de shell, patch e MCP nativos | Compatível por meio do relay de hook nativo | `PreToolUse` e `PostToolUse` do Codex são encaminhados para superfícies de ferramentas nativas confirmadas, incluindo payloads MCP no app-server do Codex `0.125.0` ou mais recente. O bloqueio é compatível; a reescrita de argumentos não é. |
| Política de permissões nativa                 | Compatível por meio do relay de hook nativo | `PermissionRequest` do Codex pode ser roteado pela política do OpenClaw onde o runtime a expõe. Se o OpenClaw não retornar decisão, o Codex continua por seu caminho normal de guardian ou aprovação do usuário. |
| Captura de trajetória do app-server           | Compatível                              | O OpenClaw registra a solicitação que enviou ao app-server e as notificações do app-server que recebe.                                                                                                |

Não compatível no runtime v1 do Codex:

| Superfície                                          | Limite da V1                                                                                                                                     | Caminho futuro                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Mutação de argumentos de ferramentas nativas        | Hooks pré-ferramenta nativos do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.                  | Requer suporte de hook/schema do Codex para substituição da entrada da ferramenta.              |
| Histórico editável de transcrições nativas do Codex | O Codex é dono do histórico canônico da thread nativa. O OpenClaw possui um espelho e pode projetar contexto futuro, mas não deve mutar internals sem suporte. | Adicionar APIs explícitas do app-server do Codex se for necessária cirurgia na thread nativa.   |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma escritas de transcrição de propriedade do OpenClaw, não registros de ferramentas nativas do Codex.                          | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex. |
| Metadados ricos de compaction nativa                | O OpenClaw observa o início e a conclusão da compaction, mas não recebe uma lista estável de mantidos/descartados, delta de tokens ou payload de resumo. | Precisa de eventos de compaction mais ricos do Codex.                                          |
| Intervenção na compaction                           | Os hooks atuais de compaction do OpenClaw são de nível de notificação no modo Codex.                                                             | Adicionar hooks de pré/pós-compaction do Codex se plugins precisarem vetar ou reescrever a compaction nativa. |
| Captura byte a byte de solicitação da API do modelo | O OpenClaw pode capturar solicitações e notificações do app-server, mas o core do Codex constrói internamente a solicitação final da API da OpenAI. | Precisa de um evento de rastreamento de solicitação de modelo do Codex ou de uma API de depuração. |

## Ferramentas, mídia e compaction

O harness do Codex altera apenas o executor de agente incorporado de baixo nível.

O OpenClaw ainda constrói a lista de ferramentas e recebe resultados dinâmicos de ferramentas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramenta de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

O relay de hook nativo é intencionalmente genérico, mas o contrato de suporte da v1 é
limitado aos caminhos de ferramentas e permissões nativos do Codex que o OpenClaw testa. No
runtime do Codex, isso inclui payloads de shell, patch e MCP `PreToolUse`,
`PostToolUse` e `PermissionRequest`. Não presuma que todo evento de hook futuro do
Codex seja uma superfície de Plugin do OpenClaw até que o contrato de runtime o nomeie.

Para `PermissionRequest`, o OpenClaw só retorna decisões explícitas de permissão ou negação
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como
nenhuma decisão de hook e segue para o próprio caminho de guardian ou aprovação do usuário.

Elicitações de aprovação de ferramentas MCP do Codex são roteadas pelo fluxo de aprovação de Plugin
do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação nativa
do servidor em vez de ser direcionada como contexto extra. Outras solicitações de elicitação MCP
ainda falham fechadas.

O direcionamento de fila em execução ativa mapeia para `turn/steer` do app-server do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa mensagens de chat enfileiradas
pela janela silenciosa configurada e as envia como uma solicitação `turn/steer` em
ordem de chegada. O modo legado `queue` envia solicitações `turn/steer` separadas. Turnos de
revisão e compaction manual do Codex podem rejeitar direcionamento no mesmo turno; nesse caso,
o OpenClaw usa a fila de acompanhamento quando o modo selecionado permite fallback. Consulte
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

Quando o modelo selecionado usa o harness do Codex, a compaction de thread nativa é
delegada ao app-server do Codex. O OpenClaw mantém um espelho da transcrição para histórico de
canal, busca, `/new`, `/reset` e futuras trocas de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de
raciocínio ou plano do Codex quando o app-server os emite. Hoje, o OpenClaw só
registra sinais de início e conclusão de compaction nativa. Ele ainda não expõe um
resumo de compaction legível por humanos ou uma lista auditável de quais entradas o Codex
manteve após a compaction.

Como o Codex é dono da thread nativa canônica, `tool_result_persist` não
reescreve atualmente registros de resultado de ferramenta nativa do Codex. Ele só se aplica quando
o OpenClaw está escrevendo um resultado de ferramenta de transcrição de sessão de propriedade do OpenClaw.

A geração de mídia não exige PI. Imagem, vídeo, música, PDF, TTS e entendimento de mídia
continuam usando as configurações correspondentes de provedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**O Codex não aparece como um provedor `/model` normal:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*` com
`agentRuntime.id: "codex"` (ou uma ref legada `codex/*`), habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa PI em vez do Codex:** `agentRuntime.id: "auto"` ainda pode usar PI como o
backend de compatibilidade quando nenhum harness do Codex reivindica a execução. Defina
`agentRuntime.id: "codex"` para forçar a seleção do Codex durante testes. Um
runtime Codex forçado agora falha em vez de fazer fallback para PI, a menos que você
defina explicitamente `agentRuntime.fallback: "pi"`. Depois que o app-server do Codex é
selecionado, suas falhas aparecem diretamente sem configuração extra de fallback.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
informe a versão `0.125.0` ou mais recente. Pré-lançamentos da mesma versão ou
versões com sufixo de build, como `0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o
piso de protocolo estável `0.125.0` é o que o OpenClaw testa.

**A descoberta de modelos está lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desabilite a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão do protocolo app-server do Codex.

**Um modelo não Codex usa PI:** isso é esperado, a menos que você tenha forçado
`agentRuntime.id: "codex"` para esse agente ou selecionado uma ref legada
`codex/*`. Refs simples `openai/gpt-*` e de outros provedores permanecem no caminho normal
do provedor no modo `auto`. Se você forçar `agentRuntime.id: "codex"`, todo turno incorporado
para esse agente deve ser um modelo OpenAI compatível com o Codex.

**O Computer Use está instalado, mas as ferramentas não executam:** verifique
`/codex computer-use status` a partir de uma nova sessão. Se uma ferramenta informar
`Native hook relay unavailable`, use `/new` ou `/reset`; se persistir, reinicie
o Gateway para limpar registros obsoletos de hook nativo. Se `computer-use.list_apps`
atingir timeout, reinicie o Codex Computer Use ou o Codex Desktop e tente novamente.

## Relacionados

- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Status](/pt-BR/cli/status)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
