---
read_when:
    - Você quer usar a estrutura de app-server do Codex incluída
    - Você precisa de exemplos de configuração do ambiente de execução do Codex
    - Você quer que implantações apenas com Codex falhem em vez de recorrer ao PI
summary: Execute os turnos de agente incorporado do OpenClaw por meio da estrutura de execução app-server do Codex incluída
title: Ambiente de execução do Codex
x-i18n:
    generated_at: "2026-05-03T21:35:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

O Plugin `codex` incluído permite que o OpenClaw execute turnos de agente incorporados por meio do
app-server do Codex em vez do harness de PI integrado.

Use isso quando quiser que o Codex seja responsável pela sessão de agente de baixo nível: descoberta de
modelos, retomada nativa de thread, compaction nativa e execução no app-server.
O OpenClaw ainda é responsável por canais de chat, arquivos de sessão, seleção de modelo, ferramentas,
aprovações, entrega de mídia e o espelho visível da transcrição.

Quando um turno de chat de origem é executado pelo harness do Codex, as respostas visíveis usam por padrão
a ferramenta `message` do OpenClaw se a implantação não tiver configurado explicitamente
`messages.visibleReplies`. O agente ainda pode concluir seu turno do Codex de forma privada;
ele só publica no canal quando chama `message(action="send")`. Defina
`messages.visibleReplies: "automatic"` para manter as respostas finais de chat direto no
caminho legado de entrega automática.

Turnos de Heartbeat do Codex também recebem a ferramenta `heartbeat_respond` por padrão, para que o
agente possa registrar se o despertar deve permanecer silencioso ou notificar sem codificar
esse fluxo de controle no texto final.

A orientação de iniciativa específica de Heartbeat é enviada como uma instrução de desenvolvedor
do modo de colaboração do Codex no próprio turno de heartbeat. Turnos comuns de chat restauram
o modo Default do Codex em vez de carregar a filosofia de heartbeat no prompt normal
de runtime.

Se você está tentando se orientar, comece com
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a referência do modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## Configuração rápida

A maioria dos usuários que quer "Codex no OpenClaw" quer esta rota: entrar com uma
assinatura ChatGPT/Codex e, em seguida, executar turnos de agente incorporados pelo runtime nativo
do app-server do Codex. A referência do modelo ainda permanece canônica como
`openai/gpt-*`; a autenticação por assinatura vem da conta/perfil Codex, não
de um prefixo de modelo `openai-codex/*`.

Primeiro, entre com o OAuth do Codex se ainda não tiver feito isso:

```bash
openclaw models auth login --provider openai-codex
```

Depois habilite o Plugin `codex` incluído e force o runtime do Codex:

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

Não use `openai-codex/gpt-*` quando quiser dizer runtime nativo do Codex. Esse prefixo
é a rota explícita "OAuth do Codex por PI". Alterações de configuração se aplicam a sessões novas ou
reiniciadas; sessões existentes mantêm o runtime registrado.

## O que este Plugin altera

O Plugin `codex` incluído contribui com várias capacidades separadas:

| Capacidade                        | Como usar                                      | O que faz                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime nativo incorporado           | `agentRuntime.id: "codex"`                          | Executa turnos de agente incorporados do OpenClaw pelo app-server do Codex.                  |
| Comandos nativos de controle de chat      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula e controla threads do app-server do Codex a partir de uma conversa de mensagens.    |
| Provedor/catálogo do app-server do Codex | Internos de `codex`, expostos pelo harness     | Permite que o runtime descubra e valide modelos do app-server.                     |
| Caminho de compreensão de mídia do Codex    | Caminhos de compatibilidade de modelo de imagem `codex/*`           | Executa turnos limitados do app-server do Codex para modelos compatíveis de compreensão de imagem. |
| Relay de hook nativo                 | Hooks de Plugin em torno de eventos nativos do Codex             | Permite que o OpenClaw observe/bloqueie eventos nativos compatíveis de ferramenta/finalização do Codex.  |

Habilitar o Plugin disponibiliza essas capacidades. Ele **não**:

- começa a usar Codex para todos os modelos OpenAI
- converte referências de modelo `openai-codex/*` no runtime nativo
- torna ACP/acpx o caminho Codex padrão
- troca a quente sessões existentes que já registraram um runtime de PI
- substitui a entrega de canais do OpenClaw, arquivos de sessão, armazenamento de perfil de autenticação ou
  roteamento de mensagens

O mesmo Plugin também é responsável pela superfície nativa de comandos de controle de chat `/codex`. Se
o Plugin estiver habilitado e o usuário pedir para vincular, retomar, orientar, parar ou inspecionar
threads do Codex pelo chat, os agentes devem preferir `/codex ...` em vez de ACP. ACP continua
sendo o fallback explícito quando o usuário pede ACP/acpx ou está testando o adaptador
ACP do Codex.

Turnos nativos do Codex mantêm os hooks de Plugin do OpenClaw como a camada pública de compatibilidade.
Estes são hooks em processo do OpenClaw, não hooks de comando `hooks.json` do Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros espelhados de transcrição
- `before_agent_finalize` por meio do relay `Stop` do Codex
- `agent_end`

Plugins também podem registrar middleware de resultado de ferramenta neutro em relação ao runtime para reescrever
resultados de ferramentas dinâmicas do OpenClaw depois que o OpenClaw executa a ferramenta e antes que o
resultado seja retornado ao Codex. Isso é separado do hook de Plugin público
`tool_result_persist`, que transforma gravações de resultado de ferramenta em transcrições pertencentes ao OpenClaw.

Para a semântica dos próprios hooks de Plugin, consulte [Hooks de Plugin](/pt-BR/plugins/hooks)
e [Comportamento de guarda de Plugin](/pt-BR/tools/plugin).

O harness fica desativado por padrão. Novas configurações devem manter referências de modelo OpenAI
canônicas como `openai/gpt-*` e forçar explicitamente
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` quando quiserem
execução nativa no app-server. Referências legadas de modelo `codex/*` ainda selecionam automaticamente
o harness por compatibilidade, mas prefixos legados de provedor apoiados por runtime
não são exibidos como escolhas normais de modelo/provedor.

Se o Plugin `codex` estiver habilitado, mas o modelo primário ainda for
`openai-codex/*`, `openclaw doctor` avisa em vez de alterar a rota. Isso é
intencional: `openai-codex/*` continua sendo o caminho OAuth/assinatura do Codex por PI, e
a execução nativa no app-server permanece uma escolha explícita de runtime.

## Mapa de rotas

Use esta tabela antes de alterar a configuração:

| Comportamento desejado                                     | Referência do modelo                  | Configuração de runtime                         | Rota de autenticação/perfil           | Rótulo de status esperado          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Assinatura ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | OAuth do Codex ou conta Codex | `Runtime: OpenAI Codex`        |
| API OpenAI pelo runner normal do OpenClaw            | `openai/gpt-*`             | omitido ou `runtime: "pi"`             | Chave de API OpenAI               | `Runtime: OpenClaw Pi Default` |
| Assinatura ChatGPT/Codex por PI                | `openai-codex/gpt-*`       | omitido ou `runtime: "pi"`             | Provedor OAuth OpenAI Codex  | `Runtime: OpenClaw Pi Default` |
| Provedores mistos com modo automático conservador          | referências específicas de provedor     | `agentRuntime.id: "auto"`              | Por provedor selecionado        | Depende do runtime selecionado    |
| Sessão explícita do adaptador ACP do Codex                   | Depende do prompt/modelo ACP | `sessions_spawn` com `runtime: "acp"` | Autenticação do backend ACP             | Status de tarefa/sessão ACP        |

A divisão importante é provedor versus runtime:

- `openai-codex/*` responde "qual rota de provedor/autenticação o PI deve usar?"
- `agentRuntime.id: "codex"` responde "qual loop deve executar este
  turno incorporado?"
- `/codex ...` responde "qual conversa nativa do Codex este chat deve vincular
  ou controlar?"
- ACP responde "qual processo externo de harness o acpx deve iniciar?"

## Escolha o prefixo de modelo correto

Rotas da família OpenAI são específicas por prefixo. Para a configuração comum de assinatura mais
runtime nativo do Codex, use `openai/*` com `agentRuntime.id: "codex"`.
Use `openai-codex/*` somente quando você quiser intencionalmente OAuth do Codex por PI:

| Referência do modelo                                     | Caminho de runtime                                 | Use quando                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provedor OpenAI pela infraestrutura OpenClaw/PI | Você quer acesso atual direto à API OpenAI Platform com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex pelo OpenClaw/PI       | Você quer autenticação por assinatura ChatGPT/Codex com o runner padrão de PI.      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness do app-server do Codex                     | Você quer autenticação por assinatura ChatGPT/Codex com execução nativa do Codex.     |

GPT-5.5 pode aparecer tanto em rotas diretas com chave de API OpenAI quanto em rotas de assinatura Codex
quando sua conta as expõe. Use `openai/gpt-5.5` com o harness do app-server do Codex
para runtime nativo do Codex, `openai-codex/gpt-5.5` para OAuth por PI, ou
`openai/gpt-5.5` sem uma substituição de runtime do Codex para tráfego direto por chave de API.

Referências legadas `codex/gpt-*` continuam sendo aceitas como aliases de compatibilidade. A migração de
compatibilidade do doctor reescreve referências legadas de runtime primário para referências canônicas de modelo
e registra a política de runtime separadamente, enquanto referências legadas usadas apenas como fallback
são deixadas inalteradas porque o runtime é configurado para todo o contêiner do agente.
Novas configurações OAuth do Codex por PI devem usar `openai-codex/gpt-*`; novas configurações do harness
nativo do app-server devem usar `openai/gpt-*` mais
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use
`openai-codex/gpt-*` quando a compreensão de imagem deve ser executada pelo caminho do provedor OAuth
OpenAI Codex. Use `codex/gpt-*` quando a compreensão de imagem deve ser executada
por um turno limitado do app-server do Codex. O modelo do app-server do Codex deve
anunciar suporte a entrada de imagem; modelos Codex somente texto falham antes do turno de mídia
começar.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a
seleção surpreender, habilite logs de depuração para o subsistema `agents/harness`
e inspecione o registro estruturado `agent harness selected` do Gateway. Ele
inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e,
no modo `auto`, o resultado de suporte de cada candidato de Plugin.

### O que os avisos do doctor significam

`openclaw doctor` avisa quando tudo isso é verdadeiro:

- o Plugin `codex` incluído está habilitado ou permitido
- o modelo primário de um agente é `openai-codex/*`
- o runtime efetivo desse agente não é `codex`

Esse aviso existe porque os usuários muitas vezes esperam que "Plugin Codex habilitado" implique
"runtime nativo do app-server do Codex." O OpenClaw não faz esse salto. O aviso
significa:

- **Nenhuma alteração é necessária** se você pretendia usar OAuth ChatGPT/Codex por PI.
- Altere o modelo para `openai/<model>` e defina
  `agentRuntime.id: "codex"` se você pretendia execução nativa no app-server.
- Sessões existentes ainda precisam de `/new` ou `/reset` após uma alteração de runtime,
  porque os pins de runtime da sessão são persistentes.

A seleção de harness não é um controle de sessão ao vivo. Quando um turno incorporado é executado,
o OpenClaw registra o id do harness selecionado nessa sessão e continua usando-o para
turnos posteriores no mesmo id de sessão. Altere a configuração `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro harness;
use `/new` ou `/reset` para iniciar uma nova sessão antes de alternar uma conversa existente
entre PI e Codex. Isso evita reproduzir uma mesma transcrição por
dois sistemas incompatíveis de sessão nativa.

Sessões legadas criadas antes das fixações de harness são tratadas como fixadas em PI assim que
têm histórico de transcrição. Use `/new` ou `/reset` para fazer essa conversa optar pelo
Codex depois de alterar a configuração.

`/status` mostra o runtime efetivo do modelo. O harness PI padrão aparece como
`Runtime: OpenClaw Pi Default`, e o harness do app-server Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw com o Plugin `codex` incluído disponível.
- App-server Codex `0.125.0` ou mais recente. O Plugin incluído gerencia um binário
  app-server Codex compatível por padrão, então comandos `codex` locais no `PATH` não
  afetam a inicialização normal do harness.
- Autenticação Codex disponível para o processo app-server ou para a ponte de autenticação
  Codex do OpenClaw. Inicializações locais do app-server usam uma home Codex gerenciada
  pelo OpenClaw para cada agente e uma `HOME` filha isolada, então elas não leem sua conta
  pessoal `~/.codex`, Skills, plugins, configuração, estado de threads ou
  `$HOME/.agents/skills` nativos por padrão.

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. Isso mantém o
OpenClaw na superfície de protocolo contra a qual ele foi testado.

Para testes smoke ao vivo e em Docker, a autenticação geralmente vem da conta da CLI Codex
ou de um perfil de autenticação `openai-codex` do OpenClaw. Inicializações locais do
app-server por stdio também podem recorrer a `CODEX_API_KEY` / `OPENAI_API_KEY` quando
nenhuma conta está presente.

## Arquivos de bootstrap do workspace

O Codex lida com `AGENTS.md` por conta própria por meio da descoberta nativa de docs de projeto. O OpenClaw
não escreve arquivos sintéticos de docs de projeto Codex nem depende de nomes de arquivo fallback do Codex
para arquivos de persona, porque os fallbacks do Codex só se aplicam quando
`AGENTS.md` está ausente.

Para paridade do workspace OpenClaw, o harness Codex resolve os outros arquivos de bootstrap
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` e `MEMORY.md` quando presentes) e os encaminha por meio das instruções de configuração do Codex
em `thread/start` e `thread/resume`. Isso mantém
`SOUL.md` e o contexto relacionado de persona/perfil do workspace visíveis sem
duplicar `AGENTS.md`.

## Adicionar Codex junto de outros modelos

Não defina `agentRuntime.id: "codex"` globalmente se o mesmo agente deve alternar livremente
entre Codex e modelos de provedores não Codex. Um runtime forçado se aplica a cada
turno incorporado para esse agente ou sessão. Se você selecionar um modelo Anthropic enquanto
esse runtime estiver forçado, o OpenClaw ainda tenta o harness Codex e falha fechado
em vez de rotear silenciosamente esse turno pelo PI.

Use uma destas formas:

- Coloque o Codex em um agente dedicado com `agentRuntime.id: "codex"`.
- Mantenha o agente padrão em `agentRuntime.id: "auto"` e fallback PI para uso misto normal
  de provedores.
- Use refs legadas `codex/*` apenas para compatibilidade. Novas configurações devem preferir
  `openai/*` mais uma política explícita de runtime Codex.

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

- O agente `main` padrão usa o caminho normal de provedor e o fallback de compatibilidade PI.
- O agente `codex` usa o harness do app-server Codex.
- Se o Codex estiver ausente ou não for compatível para o agente `codex`, o turno falha
  em vez de usar PI silenciosamente.

## Roteamento de comandos de agente

Agentes devem rotear solicitações do usuário por intenção, não apenas pela palavra "Codex":

| O usuário pede...                                      | O agente deve usar...                            |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincule este chat ao Codex"                           | `/codex bind`                                    |
| "Retome a thread Codex `<id>` aqui"                    | `/codex resume <id>`                             |
| "Mostre as threads Codex"                              | `/codex threads`                                 |
| "Abra um relatório de suporte para uma execução ruim do Codex" | `/diagnostics [note]`                            |
| "Envie feedback do Codex apenas para esta thread anexada" | `/codex diagnostics [note]`                      |
| "Use minha assinatura ChatGPT/Codex com runtime Codex" | `openai/*` mais `agentRuntime.id: "codex"`       |
| "Use minha assinatura ChatGPT/Codex por meio do PI"    | refs de modelo `openai-codex/*`                  |
| "Execute Codex por ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicie Claude Code/Gemini/OpenCode/Cursor em uma thread" | ACP/acpx, não `/codex` e não subagentes nativos |

O OpenClaw só anuncia orientação de spawn ACP para agentes quando ACP está habilitado,
despachável e respaldado por um backend de runtime carregado. Se ACP não estiver disponível,
o prompt do sistema e as Skills do Plugin não devem ensinar o agente sobre roteamento ACP.

## Implantações somente Codex

Force o harness Codex quando precisar provar que todo turno de agente incorporado
usa Codex. Runtimes explícitos de Plugin falham fechados e nunca são tentados de novo
silenciosamente por meio do PI:

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

Com Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver desabilitado, o
app-server for antigo demais ou o app-server não puder iniciar.

## Codex por agente

Você pode tornar um agente somente Codex enquanto o agente padrão mantém
a seleção automática normal:

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

Use comandos normais de sessão para alternar agentes e modelos. `/new` cria uma sessão
OpenClaw nova, e o harness Codex cria ou retoma sua thread sidecar do app-server
conforme necessário. `/reset` limpa a vinculação da sessão OpenClaw para essa thread
e permite que o próximo turno resolva o harness a partir da configuração atual novamente.

## Descoberta de modelos

Por padrão, o Plugin Codex pergunta ao app-server pelos modelos disponíveis. Se
a descoberta falhar ou atingir timeout, ele usa um catálogo fallback incluído para:

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

Desabilite a descoberta quando quiser que a inicialização evite sondar o Codex e fique com o
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
versão do app-server vinculada ao Plugin incluído em vez de qualquer CLI Codex separada
que por acaso esteja instalada localmente. Defina `appServer.command` apenas quando
você quiser intencionalmente executar um executável diferente.

Por padrão, o OpenClaw inicia sessões locais do harness Codex no modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Esta é a postura confiável de operador local usada
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

O modo Guardian usa o caminho de aprovação com revisão automática nativa do Codex. Quando o Codex pede para
sair do sandbox, escrever fora do workspace ou adicionar permissões como acesso à rede,
o Codex roteia essa solicitação de aprovação para o revisor nativo em vez de um
prompt humano. O revisor aplica a estrutura de risco do Codex e aprova ou nega
a solicitação específica. Use Guardian quando quiser mais proteções do que no modo YOLO
mas ainda precisar que agentes desacompanhados avancem.

O preset `guardian` se expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
Campos de política individuais ainda sobrescrevem `mode`, então implantações avançadas podem misturar
o preset com escolhas explícitas. O valor antigo de revisor `guardian_subagent` ainda é
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
mas o OpenClaw é dono da ponte de conta do app-server Codex e define tanto
`CODEX_HOME` quanto `HOME` para diretórios por agente sob o estado OpenClaw
desse agente. O carregador de Skills próprio do Codex lê `$CODEX_HOME/skills` e
`$HOME/.agents/skills`, então ambos os valores são isolados para inicializações locais do app-server.
Isso mantém Skills nativas do Codex, plugins, configuração, contas e estado de thread
escopados ao agente OpenClaw em vez de vazarem da home pessoal da CLI Codex
do operador.

Plugins OpenClaw e snapshots de Skills OpenClaw ainda fluem pelo próprio
registro de plugins e carregador de Skills do OpenClaw. Ativos pessoais da CLI Codex não. Se você tiver
Skills ou plugins úteis da CLI Codex que devem se tornar parte de um agente OpenClaw,
inventarie-os explicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

O provedor de migração Codex copia Skills para o workspace atual do agente OpenClaw.
Plugins, hooks e arquivos de configuração nativos do Codex são relatados ou arquivados
para revisão manual em vez de serem ativados automaticamente, porque eles podem
executar comandos, expor servidores MCP ou carregar credenciais.

A autenticação é selecionada nesta ordem:

1. Um perfil explícito de autenticação Codex do OpenClaw para o agente.
2. A conta existente do app-server na home Codex desse agente.
3. Apenas para inicializações locais do app-server por stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta do app-server está presente e a autenticação OpenAI
   ainda é necessária.

Quando o OpenClaw vê um perfil de autenticação Codex em estilo de assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho Codex gerado. Isso
mantém chaves de API em nível de Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer turnos nativos do app-server Codex cobrarem pela API por acidente.
Perfis explícitos de chave de API Codex e fallback local de chave de env por stdio usam login do app-server
em vez de env herdado do processo filho. Conexões WebSocket do app-server
não recebem fallback de chave de API env do Gateway; use um perfil explícito de autenticação ou a
conta própria do app-server remoto.

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

`appServer.clearEnv` afeta apenas o processo filho app-server do Codex gerado.

As ferramentas dinâmicas do Codex usam por padrão o perfil `native-first`. Nesse modo,
o OpenClaw não expõe ferramentas dinâmicas que duplicam operações nativas do Codex no workspace:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` e
`update_plan`. Ferramentas de integração do OpenClaw, como mensagens, sessões, mídia,
cron, navegador, nós, gateway, `heartbeat_respond` e `web_search` permanecem
disponíveis.

Campos de nível superior compatíveis do Plugin Codex:

| Campo                      | Padrão          | Significado                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Use `"openclaw-compat"` para expor ao app-server do Codex o conjunto completo de ferramentas dinâmicas do OpenClaw. |
| `codexDynamicToolsExclude` | `[]`             | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir dos turnos do app-server do Codex.               |

Campos `appServer` compatíveis:

| Campo               | Padrão                                  | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                             |
| `command`           | binário Codex gerenciado                     | Executável para transporte stdio. Deixe sem definir para usar o binário gerenciado; defina apenas para uma substituição explícita.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                                                                                                                                       |
| `url`               | não definido                                    | URL WebSocket do app-server.                                                                                                                                                                                                            |
| `authToken`         | não definido                                    | Token Bearer para transporte WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Cabeçalhos WebSocket extras.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nomes extras de variáveis de ambiente removidos do processo app-server stdio gerado depois que o OpenClaw cria seu ambiente herdado. `CODEX_HOME` e `HOME` são reservados para o isolamento Codex por agente do OpenClaw em inicializações locais. |
| `requestTimeoutMs`  | `60000`                                  | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Predefinição para execução YOLO ou revisada por guardião.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Política nativa de aprovação do Codex enviada para início/retomada/turno de thread.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Modo nativo de sandbox do Codex enviado para início/retomada de thread.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Use `"auto_review"` para permitir que o Codex revise prompts nativos de aprovação. `guardian_subagent` permanece como alias legado.                                                                                                                         |
| `serviceTier`       | não definido                                    | Camada de serviço opcional do app-server do Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados.                                                                                                                            |

As chamadas de ferramentas dinâmicas pertencentes ao OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`: cada solicitação Codex `item/tool/call` deve receber
uma resposta do OpenClaw em até 30 segundos. Em caso de tempo limite, o OpenClaw aborta o sinal da ferramenta
quando compatível e retorna ao Codex uma resposta de ferramenta dinâmica com falha para que
o turno possa continuar, em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação app-server com escopo de turno do Codex, o harness
também espera que o Codex finalize o turno nativo com `turn/completed`. Se o
app-server ficar em silêncio por 60 segundos após essa resposta, o OpenClaw tenta
interromper o turno do Codex, registra um tempo limite de diagnóstico e libera a
faixa de sessão do OpenClaw para que mensagens de chat posteriores não fiquem enfileiradas atrás de um
turno nativo obsoleto.

Substituições de ambiente permanecem disponíveis para testes locais:

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
preferível para implantações repetíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness Codex.

## Uso do computador

O Computer Use é abordado em seu próprio guia de configuração:
[Codex Computer Use](/pt-BR/plugins/codex-computer-use).

A versão resumida: o OpenClaw não inclui o aplicativo de controle de desktop nem executa
ações de desktop por conta própria. Ele prepara o app-server do Codex, verifica se o
servidor MCP `computer-use` está disponível e então deixa o Codex lidar com as chamadas
nativas de ferramenta MCP durante turnos em modo Codex.

Para acesso direto ao driver TryCua fora do fluxo de marketplace do Codex, registre
`cua-driver mcp` com `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulte [Codex Computer Use](/pt-BR/plugins/codex-computer-use) para ver a distinção
entre o Computer Use pertencente ao Codex e o registro MCP direto.

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

Computer Use é específico do macOS e pode exigir permissões locais do sistema operacional antes que o
servidor MCP do Codex consiga controlar aplicativos. Se `computerUse.enabled` for true e o servidor MCP
não estiver disponível, turnos em modo Codex falham antes de a thread iniciar, em vez de
executarem silenciosamente sem as ferramentas nativas de Computer Use. Consulte
[Codex Computer Use](/pt-BR/plugins/codex-computer-use) para opções de marketplace,
limites de catálogo remoto, motivos de status e solução de problemas.

Quando `computerUse.autoInstall` é true, o OpenClaw pode registrar o marketplace
padrão incluído do Codex Desktop a partir de
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se o Codex
ainda não tiver descoberto um marketplace local. Use `/new` ou `/reset` depois de
alterar a configuração de runtime ou Computer Use para que sessões existentes não mantenham uma associação antiga de
PI ou thread do Codex.

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

Validação do harness somente Codex:

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

Aprovações Codex revisadas por guardião:

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

A troca de modelos permanece controlada pelo OpenClaw. Quando uma sessão do OpenClaw está anexada
a uma thread existente do Codex, o próximo turno envia novamente ao
app-server o modelo OpenAI, o provedor, a política de aprovação, o sandbox e a camada de serviço
selecionados no momento. Trocar de `openai/gpt-5.5` para `openai/gpt-5.2` mantém a
associação da thread, mas solicita que o Codex continue com o modelo recém-selecionado.

## Comando Codex

O Plugin incluído registra `/codex` como um comando de barra autorizado. Ele é
genérico e funciona em qualquer canal que ofereça suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade ativa do servidor de aplicativo, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista os modelos ativos do servidor de aplicativo Codex.
- `/codex threads [filter]` lista threads recentes do Codex.
- `/codex resume <thread-id>` anexa a sessão OpenClaw atual a uma thread existente do Codex.
- `/codex compact` pede ao servidor de aplicativo Codex para compactar a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pede confirmação antes de enviar feedback de diagnóstico do Codex para a thread anexada.
- `/codex computer-use status` verifica o Plugin Computer Use configurado e o servidor MCP.
- `/codex computer-use install` instala o Plugin Computer Use configurado e recarrega os servidores MCP.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do servidor de aplicativo Codex.
- `/codex skills` lista as Skills do servidor de aplicativo Codex.

### Fluxo de depuração comum

Quando um agente baseado em Codex faz algo inesperado no Telegram, Discord, Slack,
ou em outro canal, comece pela conversa em que o problema aconteceu:

1. Execute `/diagnostics bad tool choice after image upload` ou outra observação curta
   que descreva o que você viu.
2. Aprove a solicitação de diagnóstico uma vez. A aprovação cria o zip local de
   diagnósticos do Gateway e, como a sessão está usando o ambiente de execução do Codex,
   também envia o pacote relevante de feedback do Codex para os servidores da OpenAI.
3. Copie a resposta de diagnóstico concluída para o relatório de bug ou thread de suporte.
   Ela inclui o caminho do pacote local, o resumo de privacidade, ids de sessão do OpenClaw,
   ids de thread do Codex e uma linha `Inspect locally` para cada thread do Codex.
4. Se quiser depurar a execução por conta própria, execute o comando `Inspect locally`
   impresso em um terminal. Ele se parece com `codex resume <thread-id>` e abre a
   thread nativa do Codex para que você possa inspecionar a conversa, continuá-la localmente,
   ou perguntar ao Codex por que ele escolheu uma ferramenta ou plano específico.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o envio
de feedback do Codex para a thread anexada no momento sem o pacote completo de
diagnósticos do Gateway OpenClaw. Para a maioria dos relatórios de suporte, `/diagnostics [note]` é
o melhor ponto de partida porque vincula o estado local do Gateway e os ids de
thread do Codex em uma única resposta. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
para o modelo completo de privacidade e o comportamento em chats de grupo.

O núcleo do OpenClaw também expõe `/diagnostics [note]`, somente para proprietários, como o comando geral de
diagnósticos do Gateway. O prompt de aprovação mostra o preâmbulo de dados sensíveis,
links para [Exportação de Diagnósticos](/pt-BR/gateway/diagnostics), e solicita
`openclaw gateway diagnostics export --json` por meio de aprovação explícita de execução
todas as vezes. Não aprove diagnósticos com uma regra de permitir tudo. Após a aprovação,
o OpenClaw envia um relatório colável com o caminho do pacote local e o resumo
do manifesto. Quando a sessão OpenClaw ativa está usando o ambiente de execução do Codex, essa
mesma aprovação também autoriza o envio dos pacotes relevantes de feedback do Codex para
os servidores da OpenAI. O prompt de aprovação diz que o feedback do Codex será enviado, mas
não lista ids de sessão ou thread do Codex antes da aprovação.

Se `/diagnostics` for invocado por um proprietário em um chat de grupo, o OpenClaw mantém o
canal compartilhado limpo: o grupo recebe apenas um aviso curto, enquanto o
preâmbulo de diagnósticos, os prompts de aprovação e os ids de sessão/thread do Codex são enviados ao
proprietário pela rota privada de aprovação. Se não houver rota privada para o proprietário,
o OpenClaw recusa a solicitação do grupo e pede que o proprietário a execute em uma DM.

O envio aprovado do Codex chama `feedback/upload` do servidor de aplicativo Codex e pede
ao servidor de aplicativo que inclua logs para cada thread listada e subthreads Codex geradas
quando disponíveis. O envio passa pelo caminho normal de feedback do Codex para os servidores da OpenAI;
se o feedback do Codex estiver desativado nesse servidor de aplicativo, o comando retorna
o erro do servidor de aplicativo. A resposta de diagnóstico concluída lista os canais,
ids de sessão do OpenClaw, ids de thread do Codex e comandos locais `codex resume <thread-id>`
para as threads que foram enviadas. Se você negar ou ignorar a aprovação,
o OpenClaw não imprime esses ids do Codex. Esse envio não substitui a exportação local
de diagnósticos do Gateway.

`/codex resume` grava o mesmo arquivo auxiliar de vínculo que o ambiente de execução usa para
turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread do Codex, passa o
modelo OpenClaw selecionado no momento para o servidor de aplicativo, e mantém o histórico estendido
ativado.

### Inspecionar uma thread do Codex pela CLI

A maneira mais rápida de entender uma execução ruim do Codex costuma ser abrir a thread nativa do Codex
diretamente:

```sh
codex resume <thread-id>
```

Use isso quando notar um bug em uma conversa de canal e quiser inspecionar a
sessão problemática do Codex, continuá-la localmente, ou perguntar ao Codex por que ele fez uma
escolha específica de ferramenta ou raciocínio. O caminho mais fácil geralmente é executar
`/diagnostics [note]` primeiro: depois que você aprovar, o relatório concluído lista
cada thread do Codex e imprime um comando `Inspect locally`, por exemplo
`codex resume <thread-id>`. Você pode copiar esse comando diretamente para um terminal.

Você também pode obter um id de thread em `/codex binding` para o chat atual ou
`/codex threads [filter]` para threads recentes do servidor de aplicativo Codex, e então executar o mesmo
comando `codex resume` no seu shell.

A superfície de comandos exige o servidor de aplicativo Codex `0.125.0` ou mais recente. Métodos
individuais de controle são relatados como `unsupported by this Codex app-server` se um
servidor de aplicativo futuro ou personalizado não expuser esse método JSON-RPC.

## Limites de hooks

O ambiente de execução do Codex tem três camadas de hook:

| Camada                                | Proprietário             | Finalidade                                                          |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin do OpenClaw           | OpenClaw                 | Compatibilidade de produto/Plugin entre ambientes de execução PI e Codex. |
| Middleware de extensão do servidor de aplicativo Codex | Plugins incluídos no OpenClaw | Comportamento do adaptador por turno em torno de ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida Codex de baixo nível e política nativa de ferramentas da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` globais ou de projeto do Codex para rotear
comportamento de Plugins do OpenClaw. Para a ponte compatível de ferramenta nativa e permissões,
o OpenClaw injeta configuração Codex por thread para `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Outros hooks do Codex, como `SessionStart` e
`UserPromptSubmit`, continuam sendo controles no nível do Codex; eles não são expostos como
hooks de Plugin do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex pede a
chamada, então o OpenClaw dispara o comportamento de Plugin e middleware que ele possui no
adaptador do ambiente de execução. Para ferramentas nativas do Codex, o Codex possui o registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação por meio do servidor de aplicativo ou callbacks de hook nativo.

Projeções de Compaction e ciclo de vida de LLM vêm de notificações do servidor de aplicativo Codex
e do estado do adaptador OpenClaw, não de comandos de hook nativo do Codex.
Os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte
da solicitação interna ou dos payloads de Compaction do Codex.

As notificações `hook/started` e `hook/completed` nativas do Codex pelo servidor de aplicativo são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de Plugin do OpenClaw.

## Contrato de suporte v1

O modo Codex não é PI com uma chamada de modelo diferente por baixo. O Codex controla mais do
loop nativo do modelo, e o OpenClaw adapta suas superfícies de Plugin e sessão
em torno desse limite.

Compatível no tempo de execução Codex v1:

| Superfície                                    | Suporte                                 | Por quê                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loop de modelo OpenAI por meio do Codex       | Compatível                              | O servidor de aplicativo Codex controla o turno OpenAI, retomada de thread nativa e continuação de ferramentas nativas.                                                                                |
| Roteamento e entrega de canais do OpenClaw    | Compatível                              | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais ficam fora do tempo de execução do modelo.                                                                                                |
| Ferramentas dinâmicas do OpenClaw             | Compatível                              | O Codex pede ao OpenClaw para executar essas ferramentas, então o OpenClaw permanece no caminho de execução.                                                                                           |
| Plugins de prompt e contexto                  | Compatível                              | O OpenClaw cria sobreposições de prompt e projeta contexto no turno do Codex antes de iniciar ou retomar a thread.                                                                                     |
| Ciclo de vida do mecanismo de contexto        | Compatível                              | Montagem, ingestão ou manutenção pós-turno, e coordenação de Compaction do mecanismo de contexto rodam para turnos Codex.                                                                              |
| Hooks de ferramentas dinâmicas                | Compatível                              | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta rodam em torno de ferramentas dinâmicas pertencentes ao OpenClaw.                                                        |
| Hooks de ciclo de vida                        | Compatíveis como observações do adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex.                                                                         |
| Gate de revisão de resposta final             | Compatível por meio do relé de hook nativo | `Stop` do Codex é retransmitido para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem de modelo antes da finalização.                                                                |
| Bloqueio ou observação de shell nativo, patch e MCP | Compatível por meio do relé de hook nativo | `PreToolUse` e `PostToolUse` do Codex são retransmitidos para superfícies confirmadas de ferramentas nativas, incluindo payloads MCP no servidor de aplicativo Codex `0.125.0` ou mais recente. Bloqueio é compatível; reescrita de argumentos não. |
| Política de permissão nativa                  | Compatível por meio do relé de hook nativo | `PermissionRequest` do Codex pode ser roteado pela política do OpenClaw onde o tempo de execução a expõe. Se o OpenClaw não retornar decisão, o Codex continua por seu caminho normal de guardião ou aprovação do usuário. |
| Captura de trajetória do servidor de aplicativo | Compatível                            | O OpenClaw registra a solicitação que enviou ao servidor de aplicativo e as notificações do servidor de aplicativo que recebe.                                                                         |

Não compatível no tempo de execução Codex v1:

| Superfície                                          | Limite V1                                                                                                                                      | Caminho futuro                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutação de argumentos de ferramenta nativa          | Hooks pré-ferramenta nativos do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.                | Requer suporte de hook/esquema do Codex para substituir a entrada da ferramenta.          |
| Histórico editável de transcrição nativa do Codex   | O Codex possui o histórico canônico do thread nativo. O OpenClaw possui um espelho e pode projetar contexto futuro, mas não deve mutar internos sem suporte. | Adicionar APIs explícitas do app-server do Codex se for necessária cirurgia no thread nativo. |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma gravações de transcrição pertencentes ao OpenClaw, não registros de ferramentas nativas do Codex.                         | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex. |
| Metadados ricos de Compaction nativa                | O OpenClaw observa o início e a conclusão da Compaction, mas não recebe uma lista estável de itens mantidos/removidos, delta de tokens ou payload de resumo. | Precisa de eventos de Compaction do Codex mais ricos.                                     |
| Intervenção de Compaction                           | Os hooks atuais de Compaction do OpenClaw são em nível de notificação no modo Codex.                                                           | Adicionar hooks pré/pós-Compaction do Codex se plugins precisarem vetar ou reescrever a Compaction nativa. |
| Captura byte a byte de solicitação da API do modelo | O OpenClaw pode capturar solicitações e notificações do app-server, mas o núcleo do Codex constrói internamente a solicitação final da API da OpenAI. | Precisa de um evento de rastreamento de solicitação de modelo do Codex ou API de depuração. |

## Ferramentas, mídia e Compaction

O harness do Codex altera apenas o executor de agente embarcado de baixo nível.

O OpenClaw ainda constrói a lista de ferramentas e recebe resultados dinâmicos de ferramentas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramenta de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

O relay de hook nativo é intencionalmente genérico, mas o contrato de suporte v1 é
limitado aos caminhos de ferramenta nativa do Codex e de permissão que o OpenClaw testa. No
runtime do Codex, isso inclui payloads de shell, patch e MCP `PreToolUse`,
`PostToolUse` e `PermissionRequest`. Não presuma que todo evento futuro de hook do
Codex seja uma superfície de Plugin do OpenClaw até que o contrato de runtime o nomeie.

Para `PermissionRequest`, o OpenClaw só retorna decisões explícitas de permitir ou negar
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como sem
decisão de hook e continua para seu próprio guardião ou caminho de aprovação do usuário.

Solicitações de aprovação de ferramenta MCP do Codex são roteadas pelo fluxo de
aprovação de Plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação
nativa do servidor em vez de ser direcionada como contexto extra. Outras solicitações de elicitação
MCP ainda falham fechadas.

O direcionamento da fila de execução ativa mapeia para `turn/steer` do app-server do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa mensagens de chat enfileiradas
pela janela de silêncio configurada e as envia como uma solicitação `turn/steer` em
ordem de chegada. O modo legado `queue` envia solicitações `turn/steer` separadas. Turnos de
revisão e Compaction manual do Codex podem rejeitar direcionamento no mesmo turno; nesse caso,
o OpenClaw usa a fila de acompanhamento quando o modo selecionado permite fallback. Consulte
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

Quando o modelo selecionado usa o harness do Codex, a Compaction do thread nativo é
delegada ao app-server do Codex. O OpenClaw mantém um espelho de transcrição para histórico
do canal, busca, `/new`, `/reset` e troca futura de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de raciocínio
ou plano do Codex quando o app-server os emite. Hoje, o OpenClaw registra apenas
sinais de início e conclusão de Compaction nativa. Ele ainda não expõe um resumo de
Compaction legível por humanos nem uma lista auditável de quais entradas o Codex
manteve após a Compaction.

Como o Codex possui o thread nativo canônico, `tool_result_persist` atualmente não
reescreve registros de resultado de ferramenta nativa do Codex. Ele só se aplica quando
o OpenClaw está gravando um resultado de ferramenta de transcrição de sessão pertencente ao OpenClaw.

A geração de mídia não requer PI. Imagem, vídeo, música, PDF, TTS e entendimento
de mídia continuam usando as configurações correspondentes de provedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**O Codex não aparece como um provedor `/model` normal:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*` com
`agentRuntime.id: "codex"` (ou uma referência legada `codex/*`), habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa PI em vez do Codex:** `agentRuntime.id: "auto"` ainda pode usar PI como
backend de compatibilidade quando nenhum harness do Codex assume a execução. Defina
`agentRuntime.id: "codex"` para forçar a seleção do Codex durante os testes. Um
runtime Codex forçado falha em vez de recorrer a PI. Depois que o app-server do Codex
é selecionado, suas falhas aparecem diretamente.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
reporte a versão `0.125.0` ou mais recente. Pré-lançamentos da mesma versão ou versões
com sufixo de build, como `0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o
piso estável de protocolo `0.125.0` é o que o OpenClaw testa.

**A descoberta de modelos está lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desabilite a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão do protocolo app-server do Codex.

**Um modelo que não é Codex usa PI:** isso é esperado, a menos que você tenha forçado
`agentRuntime.id: "codex"` para esse agente ou selecionado uma referência legada
`codex/*`. Referências simples `openai/gpt-*` e de outros provedores permanecem em seu caminho
normal de provedor no modo `auto`. Se você forçar `agentRuntime.id: "codex"`, todo turno
embarcado desse agente deve ser um modelo OpenAI compatível com Codex.

**Computer Use está instalado, mas as ferramentas não executam:** verifique
`/codex computer-use status` a partir de uma sessão nova. Se uma ferramenta reportar
`Native hook relay unavailable`, use `/new` ou `/reset`; se persistir, reinicie
o Gateway para limpar registros de hook nativo obsoletos. Se `computer-use.list_apps`
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
