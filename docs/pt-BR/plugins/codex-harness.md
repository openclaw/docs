---
read_when:
    - Você quer usar a estrutura de servidor de aplicativo do Codex incluída
    - Você precisa de exemplos de configuração do ambiente de execução do Codex
    - Você quer que implantações somente com Codex falhem em vez de recorrer ao PI
summary: Execute turnos de agente incorporado do OpenClaw pelo arcabouço app-server do Codex incluído
title: Ambiente de execução do Codex
x-i18n:
    generated_at: "2026-05-07T01:53:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 484f32d9b73632827ee0ce3963ddbead784196fb36ff089632d0f622f1cecdf7
    source_path: plugins/codex-harness.md
    workflow: 16
---

O plugin `codex` incluído permite que o OpenClaw execute turnos de agente embarcados pelo app-server do Codex em vez do harness PI integrado.

Use isto quando você quiser que o Codex gerencie a sessão de agente de baixo nível: descoberta de modelos, retomada nativa de threads, compaction nativa e execução no app-server. O OpenClaw ainda gerencia canais de chat, arquivos de sessão, seleção de modelo, ferramentas, aprovações, entrega de mídia e o espelho visível da transcrição.

Quando um turno de chat de origem roda pelo harness do Codex, as respostas visíveis usam por padrão a ferramenta `message` do OpenClaw se a implantação não tiver configurado explicitamente `messages.visibleReplies`. O agente ainda pode finalizar seu turno do Codex em privado; ele só publica no canal quando chama `message(action="send")`. Defina `messages.visibleReplies: "automatic"` para manter as respostas finais de chat direto no caminho legado de entrega automática.

Turnos de Heartbeat do Codex também recebem a ferramenta `heartbeat_respond` por padrão, para que o agente possa registrar se o despertar deve permanecer silencioso ou notificar sem codificar esse fluxo de controle no texto final.

A orientação de iniciativa específica de Heartbeat é enviada como uma instrução de desenvolvedor em modo de colaboração do Codex no próprio turno de Heartbeat. Turnos comuns de chat restauram o modo Padrão do Codex em vez de carregar a filosofia de Heartbeat no prompt normal de runtime.

Se você está tentando se orientar, comece por [Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é: `openai/gpt-5.5` é a referência de modelo, `codex` é o runtime, e Telegram, Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## Configuração rápida

A maioria dos usuários que quer "Codex no OpenClaw" quer esta rota: entrar com uma assinatura ChatGPT/Codex e então executar turnos de agente embarcados pelo runtime nativo do app-server do Codex. A referência de modelo ainda permanece canônica como `openai/gpt-*`; a autenticação por assinatura vem da conta/perfil do Codex, não de um prefixo de modelo `openai-codex/*`.

Primeiro entre com o OAuth do Codex, caso ainda não tenha feito isso:

```bash
openclaw models auth login --provider openai-codex
```

Então habilite o plugin `codex` incluído e force o runtime do Codex:

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

Não use `openai-codex/gpt-*` na configuração. Esse prefixo é uma rota legada que `openclaw doctor --fix` reescreve para `openai/gpt-*` em modelos primários, fallbacks, substituições de Heartbeat/subagente/Compaction, hooks, substituições de canal e pins obsoletos de rota de sessão persistida.

## O que este plugin altera

O plugin `codex` incluído contribui com várias capacidades separadas:

| Capacidade                        | Como você usa                                      | O que ela faz                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime embarcado nativo           | `agentRuntime.id: "codex"`                          | Executa turnos de agente embarcados do OpenClaw pelo app-server do Codex.                  |
| Comandos nativos de controle de chat      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula e controla threads do app-server do Codex a partir de uma conversa de mensagens.    |
| Provedor/catálogo do app-server do Codex | Internos de `codex`, expostos pelo harness     | Permite que o runtime descubra e valide modelos do app-server.                     |
| Caminho de compreensão de mídia do Codex    | Caminhos de compatibilidade de modelo de imagem `codex/*`           | Executa turnos delimitados do app-server do Codex para modelos compatíveis de compreensão de imagem. |
| Relay nativo de hooks                 | Hooks de plugin em torno de eventos nativos do Codex             | Permite que o OpenClaw observe/bloqueie eventos compatíveis de ferramenta/finalização nativos do Codex.  |

Habilitar o plugin disponibiliza essas capacidades. Ele **não**:

- começa a usar o Codex para todos os modelos OpenAI
- converte referências de modelo `openai-codex/*` no runtime nativo sem o doctor verificar que o Codex está instalado, habilitado, contribui com o harness `codex` e está pronto para OAuth
- torna ACP/acpx o caminho padrão do Codex
- troca a quente sessões existentes que já registraram um runtime PI
- substitui a entrega por canais do OpenClaw, arquivos de sessão, armazenamento de perfis de autenticação ou roteamento de mensagens

O mesmo plugin também gerencia a superfície nativa de comandos de controle de chat `/codex`. Se o plugin estiver habilitado e o usuário pedir para vincular, retomar, direcionar, parar ou inspecionar threads do Codex pelo chat, os agentes devem preferir `/codex ...` em vez de ACP. ACP permanece como fallback explícito quando o usuário pede ACP/acpx ou está testando o adaptador ACP do Codex.

Turnos nativos do Codex mantêm os hooks de plugin do OpenClaw como a camada pública de compatibilidade. Estes são hooks em processo do OpenClaw, não hooks de comando `hooks.json` do Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros espelhados de transcrição
- `before_agent_finalize` pelo relay `Stop` do Codex
- `agent_end`

Plugins também podem registrar middleware de resultado de ferramenta neutro em relação a runtime para reescrever resultados de ferramentas dinâmicas do OpenClaw depois que o OpenClaw executa a ferramenta e antes que o resultado seja retornado ao Codex. Isso é separado do hook público de plugin `tool_result_persist`, que transforma escritas de resultados de ferramenta na transcrição gerenciada pelo OpenClaw.

Para a semântica dos próprios hooks de plugin, veja [Hooks de Plugin](/pt-BR/plugins/hooks) e [Comportamento de guarda de Plugin](/pt-BR/tools/plugin).

O harness fica desativado por padrão. Novas configurações devem manter as referências de modelos OpenAI canônicas como `openai/gpt-*` e forçar explicitamente `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` quando quiserem execução nativa no app-server. Referências legadas de modelo `codex/*` ainda selecionam automaticamente o harness por compatibilidade, mas prefixos legados de provedor apoiados por runtime não são exibidos como escolhas normais de modelo/provedor.

Se alguma rota de modelo configurada ainda for `openai-codex/*`, `openclaw doctor --fix` a reescreve para `openai/*`. Para rotas de agente correspondentes, ele define o runtime do agente como `codex` somente quando o plugin Codex está instalado, habilitado, contribui com o harness `codex` e tem OAuth utilizável; caso contrário, define o runtime como `pi`.

## Mapa de rotas

Use esta tabela antes de alterar a configuração:

| Comportamento desejado                                     | Referência de modelo                  | Configuração de runtime                         | Rota de autenticação/perfil           | Rótulo de status esperado          |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Assinatura ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | OAuth do Codex ou conta do Codex | `Runtime: OpenAI Codex`        |
| API da OpenAI pelo runner normal do OpenClaw            | `openai/gpt-*`             | omitido ou `runtime: "pi"`             | Chave de API da OpenAI               | `Runtime: OpenClaw Pi Default` |
| Configuração legada que precisa de reparo pelo doctor               | `openai-codex/gpt-*`       | reparada para `codex` ou `pi`            | Autenticação existente configurada     | Verifique novamente após `doctor --fix`   |
| Provedores mistos com modo automático conservador          | refs específicas do provedor     | `agentRuntime.id: "auto"`              | Por provedor selecionado        | Depende do runtime selecionado    |
| Sessão explícita do adaptador ACP do Codex                   | dependente de prompt/modelo ACP | `sessions_spawn` com `runtime: "acp"` | Autenticação do backend ACP             | Status de tarefa/sessão ACP        |

A divisão importante é provedor versus runtime:

- `openai-codex/*` é uma rota legada que o doctor reescreve.
- `agentRuntime.id: "codex"` exige o harness do Codex e falha de forma fechada se ele estiver indisponível.
- `agentRuntime.id: "auto"` permite que harnesses registrados reivindiquem rotas de provedor correspondentes, mas referências canônicas da OpenAI ainda pertencem ao PI, a menos que um harness seja compatível com esse par provedor/modelo.
- `/codex ...` responde "a qual conversa nativa do Codex este chat deve se vincular ou controlar?"
- ACP responde "qual processo de harness externo o acpx deve iniciar?"

## Escolha o prefixo de modelo correto

Rotas da família OpenAI são específicas por prefixo. Para a configuração comum de assinatura mais runtime nativo do Codex, use `openai/*` com `agentRuntime.id: "codex"`. Trate `openai-codex/*` como configuração legada que o doctor deve reescrever:

| Referência de modelo                                     | Caminho de runtime                                 | Use quando                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provedor OpenAI pela infraestrutura OpenClaw/PI | Você quer acesso atual direto à API da OpenAI Platform com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | Rota legada reparada pelo doctor              | Você está em uma configuração antiga; execute `openclaw doctor --fix` para reescrevê-la.         |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness do app-server do Codex                     | Você quer autenticação por assinatura ChatGPT/Codex com execução nativa do Codex.     |

GPT-5.5 pode aparecer tanto em rotas diretas com chave de API da OpenAI quanto em rotas de assinatura do Codex quando sua conta as expõe. Use `openai/gpt-5.5` com o harness do app-server do Codex para runtime nativo do Codex, ou `openai/gpt-5.5` sem uma substituição de runtime do Codex para tráfego direto com chave de API.

Refs legadas `codex/gpt-*` continuam aceitas como aliases de compatibilidade. A migração de compatibilidade do doctor reescreve refs legadas de runtime para refs canônicas de modelo e registra a política de runtime separadamente. Novas configurações do harness nativo do app-server devem usar `openai/gpt-*` mais `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use `openai/gpt-*` para a rota normal da OpenAI e `codex/gpt-*` quando a compreensão de imagem deve rodar por um turno delimitado do app-server do Codex. Não use `openai-codex/gpt-*`; o doctor reescreve esse prefixo legado para `openai/gpt-*`. O modelo do app-server do Codex deve anunciar suporte a entrada de imagem; modelos Codex somente texto falham antes do início do turno de mídia.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a seleção surpreender, habilite logs de depuração para o subsistema `agents/harness` e inspecione o registro estruturado `agent harness selected` do Gateway. Ele inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e, no modo `auto`, o resultado de suporte de cada candidato de plugin.

### O que os avisos do doctor significam

`openclaw doctor` avisa quando refs de modelo configuradas ou estado de rota de sessão persistida ainda usam `openai-codex/*`. `openclaw doctor --fix` reescreve essas rotas para:

- `openai/<model>`
- `agentRuntime.id: "codex"` quando o Codex está instalado, habilitado, contribui com o harness `codex` e tem OAuth utilizável
- `agentRuntime.id: "pi"` caso contrário

A rota `codex` força o harness nativo do Codex. A rota `pi` mantém o agente no runner padrão do OpenClaw em vez de habilitar ou instalar o Codex como efeito colateral da limpeza da rota legada.
O doctor também repara pins obsoletos de sessão persistida em stores descobertos de sessão de agente para que conversas antigas não continuem presas na rota removida.

A seleção do mecanismo não é um controle de sessão ao vivo. Quando um turno incorporado é executado,
o OpenClaw registra o id do mecanismo selecionado nessa sessão e continua usando-o para
turnos posteriores no mesmo id de sessão. Altere a configuração `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro mecanismo;
use `/new` ou `/reset` para iniciar uma nova sessão antes de alternar uma conversa
existente entre PI e Codex. Isso evita reproduzir uma transcrição por dois
sistemas de sessão nativos incompatíveis.

Sessões legadas criadas antes das fixações de mecanismo são tratadas como fixadas no PI depois que
têm histórico de transcrição. Use `/new` ou `/reset` para optar essa conversa pelo
Codex após alterar a configuração.

`/status` mostra o runtime de modelo efetivo. O mecanismo PI padrão aparece como
`Runtime: OpenClaw Pi Default`, e o mecanismo app-server do Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw com o Plugin `codex` incluído disponível.
- App-server do Codex `0.125.0` ou mais recente. O Plugin incluído gerencia um binário
  app-server do Codex compatível por padrão, então comandos `codex` locais no `PATH` não
  afetam a inicialização normal do mecanismo.
- Autenticação do Codex disponível para o processo app-server ou para a ponte de autenticação Codex
  do OpenClaw. Inicializações locais do app-server usam um diretório inicial do Codex gerenciado pelo OpenClaw para cada
  agente e um `HOME` filho isolado, portanto não leem sua conta pessoal
  `~/.codex`, Skills, Plugins, configuração, estado de threads ou
  `$HOME/.agents/skills` nativo por padrão.

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. Isso mantém
o OpenClaw na superfície de protocolo contra a qual ele foi testado.

Para testes smoke ao vivo e em Docker, a autenticação geralmente vem da conta da CLI do Codex
ou de um perfil de autenticação `openai-codex` do OpenClaw. Inicializações locais do app-server por stdio também podem
recorrer a `CODEX_API_KEY` / `OPENAI_API_KEY` quando nenhuma conta estiver presente.

## Arquivos de bootstrap do workspace

O Codex lida com `AGENTS.md` por conta própria por meio da descoberta nativa de documentos de projeto. O OpenClaw
não grava arquivos sintéticos de documentos de projeto do Codex nem depende de nomes de arquivo de fallback do Codex
para arquivos de persona, porque os fallbacks do Codex só se aplicam quando
`AGENTS.md` está ausente.

Para paridade do workspace do OpenClaw, o mecanismo do Codex resolve os outros arquivos de bootstrap
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` e `MEMORY.md` quando presente) e os encaminha por meio de instruções de desenvolvedor do Codex
em `thread/start` e `thread/resume`. Isso mantém
`SOUL.md` e o contexto relacionado de persona/perfil do workspace visíveis na via nativa de
moldagem de comportamento do Codex sem duplicar `AGENTS.md`.

## Adicionar o Codex junto com outros modelos

Não defina `agentRuntime.id: "codex"` globalmente se o mesmo agente deve alternar livremente
entre Codex e modelos de provedores não Codex. Um runtime forçado se aplica a todo
turno incorporado desse agente ou sessão. Se você selecionar um modelo Anthropic enquanto
esse runtime estiver forçado, o OpenClaw ainda tenta o mecanismo do Codex e falha de forma fechada
em vez de rotear silenciosamente esse turno pelo PI.

Use uma destas formas em vez disso:

- Coloque o Codex em um agente dedicado com `agentRuntime.id: "codex"`.
- Mantenha o agente padrão em `agentRuntime.id: "auto"` e fallback do PI para uso normal misto
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

- O agente `main` padrão usa o caminho normal de provedor e fallback de compatibilidade do PI.
- O agente `codex` usa o mecanismo app-server do Codex.
- Se o Codex estiver ausente ou sem suporte para o agente `codex`, o turno falha
  em vez de usar silenciosamente o PI.

## Roteamento de comandos de agente

Agentes devem rotear solicitações do usuário por intenção, não apenas pela palavra "Codex":

| O usuário pede para...                                 | O agente deve usar...                             |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincular este chat ao Codex"                          | `/codex bind`                                    |
| "Retomar a thread do Codex `<id>` aqui"                | `/codex resume <id>`                             |
| "Mostrar threads do Codex"                             | `/codex threads`                                 |
| "Registrar um relatório de suporte para uma execução ruim do Codex" | `/diagnostics [note]`                            |
| "Enviar feedback do Codex apenas para esta thread anexada" | `/codex diagnostics [note]`                      |
| "Usar minha assinatura ChatGPT/Codex com o runtime Codex" | `openai/*` mais `agentRuntime.id: "codex"`       |
| "Reparar fixações antigas de configuração/sessão `openai-codex/*`" | `openclaw doctor --fix`                          |
| "Executar o Codex por ACP/acpx"                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Iniciar Claude Code/Gemini/OpenCode/Cursor em uma thread" | ACP/acpx, não `/codex` e não subagentes nativos |

O OpenClaw só anuncia orientação de spawn do ACP para agentes quando o ACP está habilitado,
despachável e respaldado por um backend de runtime carregado. Se o ACP não estiver disponível,
o prompt do sistema e as Skills de Plugin não devem ensinar o agente sobre roteamento
ACP.

## Implantações somente Codex

Force o mecanismo do Codex quando precisar provar que todo turno de agente incorporado
usa o Codex. Runtimes explícitos de Plugin falham de forma fechada e nunca são retentados silenciosamente
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

Substituição por ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Com o Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver desabilitado, se o
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

Use comandos normais de sessão para alternar agentes e modelos. `/new` cria uma nova
sessão OpenClaw, e o mecanismo do Codex cria ou retoma sua thread app-server auxiliar
conforme necessário. `/reset` limpa a vinculação de sessão do OpenClaw para essa thread
e permite que o próximo turno resolva o mecanismo novamente a partir da configuração atual.

## Descoberta de modelos

Por padrão, o Plugin Codex pergunta ao app-server quais modelos estão disponíveis. Se
a descoberta falhar ou expirar, ele usa um catálogo de fallback incluído para:

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

Desabilite a descoberta quando quiser que a inicialização evite sondar o Codex e fique no
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

O binário gerenciado é enviado com o pacote do Plugin `codex`. Isso mantém a
versão do app-server vinculada ao Plugin incluído em vez de qualquer CLI separada do
Codex que esteja instalada localmente. Defina `appServer.command` somente quando
você quiser intencionalmente executar outro executável.

Por padrão, o OpenClaw inicia sessões locais do mecanismo Codex no modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Esta é a postura confiável do operador local usada
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

O modo guardião usa o caminho nativo de aprovação por revisão automática do Codex. Quando o Codex pede para
sair do sandbox, gravar fora do workspace ou adicionar permissões como acesso à rede,
o Codex roteia essa solicitação de aprovação para o revisor nativo em vez de um
prompt humano. O revisor aplica a estrutura de risco do Codex e aprova ou nega
a solicitação específica. Use Guardião quando quiser mais proteções do que o modo YOLO
mas ainda precisar que agentes sem supervisão avancem.

O preset `guardian` se expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
Campos individuais de política ainda substituem `mode`, então implantações avançadas podem misturar
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
mas o OpenClaw é dono da ponte de conta do app-server do Codex e define tanto
`CODEX_HOME` quanto `HOME` para diretórios por agente sob o estado OpenClaw
desse agente. O carregador de Skills do próprio Codex lê `$CODEX_HOME/skills` e
`$HOME/.agents/skills`, então ambos os valores são isolados para inicializações locais do app-server.
Isso mantém Skills, Plugins, configuração, contas e estado de threads nativos do Codex
no escopo do agente OpenClaw em vez de vazarem do diretório inicial pessoal da CLI do Codex
do operador.

Plugins OpenClaw e snapshots de Skills OpenClaw ainda fluem pelo próprio
registro de Plugins e carregador de Skills do OpenClaw. Ativos pessoais da CLI do Codex não. Se você tiver
Skills ou Plugins úteis da CLI do Codex que devam se tornar parte de um agente OpenClaw,
inventarie-os explicitamente:

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
2. A conta existente do app-server no diretório inicial Codex desse agente.
3. Apenas para inicializações locais do app-server por stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta app-server estiver presente e a autenticação OpenAI
   ainda for necessária.

Quando o OpenClaw detecta um perfil de autenticação do Codex no estilo de assinatura do ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho do Codex iniciado. Isso
mantém as chaves de API no nível do Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer turnos nativos do servidor de aplicativo do Codex serem cobrados pela API por acidente.
Perfis explícitos de chave de API do Codex e o fallback local de chave de ambiente stdio usam login
do servidor de aplicativo em vez de ambiente herdado do processo filho. Conexões WebSocket do servidor de aplicativo
não recebem fallback de chave de API de ambiente do Gateway; use um perfil de autenticação explícito ou a
própria conta do servidor de aplicativo remoto.

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

`appServer.clearEnv` afeta apenas o processo filho do servidor de aplicativo do Codex iniciado.

As ferramentas dinâmicas do Codex usam por padrão o perfil `native-first`. Nesse modo,
o OpenClaw não expõe ferramentas dinâmicas que duplicam operações nativas do Codex no workspace:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` e
`update_plan`. Ferramentas de integração do OpenClaw, como mensagens, sessões, mídia,
cron, navegador, nós, gateway, `heartbeat_respond` e `web_search`, continuam
disponíveis.

Campos de Plugin Codex de nível superior compatíveis:

| Campo                      | Padrão          | Significado                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Use `"openclaw-compat"` para expor o conjunto completo de ferramentas dinâmicas do OpenClaw ao servidor de aplicativo do Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir dos turnos do servidor de aplicativo do Codex.               |

Campos `appServer` compatíveis:

| Campo               | Padrão                                  | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                             |
| `command`           | binário gerenciado do Codex                     | Executável para transporte stdio. Deixe indefinido para usar o binário gerenciado; defina apenas para uma substituição explícita.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                                                                                                                                       |
| `url`               | indefinido                                    | URL WebSocket do servidor de aplicativo.                                                                                                                                                                                                            |
| `authToken`         | indefinido                                    | Token bearer para transporte WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Cabeçalhos WebSocket extras.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nomes extras de variáveis de ambiente removidos do processo stdio do servidor de aplicativo iniciado depois que o OpenClaw cria o ambiente herdado. `CODEX_HOME` e `HOME` são reservados para o isolamento Codex por agente do OpenClaw em inicializações locais. |
| `requestTimeoutMs`  | `60000`                                  | Tempo limite para chamadas do plano de controle do servidor de aplicativo.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Predefinição para execução YOLO ou revisada pelo guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Política nativa de aprovação do Codex enviada ao iniciar/retomar thread/turno.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo do Codex enviado ao iniciar/retomar thread.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Use `"auto_review"` para permitir que o Codex revise prompts nativos de aprovação. `guardian_subagent` continua sendo um alias legado.                                                                                                                         |
| `serviceTier`       | indefinido                                    | Camada de serviço opcional do servidor de aplicativo do Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados.                                                                                                                            |

Chamadas de ferramentas dinâmicas pertencentes ao OpenClaw são limitadas de forma independente de
`appServer.requestTimeoutMs`: cada solicitação Codex `item/tool/call` deve receber
uma resposta do OpenClaw em até 30 segundos. No tempo limite, o OpenClaw aborta o sinal da ferramenta
quando houver suporte e retorna uma resposta de ferramenta dinâmica com falha ao Codex para que
o turno possa continuar em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação do servidor de aplicativo com escopo de turno do Codex, o harness
também espera que o Codex finalize o turno nativo com `turn/completed`. Se o
servidor de aplicativo ficar silencioso por 60 segundos após essa resposta, o OpenClaw, em melhor esforço,
interrompe o turno do Codex, registra um tempo limite diagnóstico e libera a
raia de sessão do OpenClaw para que mensagens de chat subsequentes não fiquem enfileiradas atrás de um
turno nativo obsoleto.

Substituições de ambiente continuam disponíveis para testes locais:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora o binário gerenciado quando
`appServer.command` está indefinido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removido. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` em vez disso, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. Configuração é
preferível para implantações repetíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness do Codex.

## Uso do computador

O Uso do Computador é abordado em seu próprio guia de configuração:
[Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não inclui como vendor o aplicativo de controle de desktop nem executa
ações de desktop por conta própria. Ele prepara o servidor de aplicativo do Codex, verifica se o
servidor MCP `computer-use` está disponível e então deixa o Codex lidar com as chamadas nativas de ferramenta
MCP durante turnos no modo Codex.

Para acesso direto ao driver TryCua fora do fluxo do marketplace do Codex, registre
`cua-driver mcp` com `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulte [Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use) para ver a distinção
entre Uso do Computador pertencente ao Codex e registro MCP direto.

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

A configuração pode ser verificada ou instalada pela superfície de comando:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

O Uso do Computador é específico do macOS e pode exigir permissões locais do sistema operacional antes que o
servidor MCP do Codex consiga controlar aplicativos. Se `computerUse.enabled` for true e o servidor MCP
estiver indisponível, turnos no modo Codex falham antes de a thread iniciar em vez de
rodar silenciosamente sem as ferramentas nativas de Uso do Computador. Consulte
[Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use) para opções de marketplace,
limites do catálogo remoto, motivos de status e solução de problemas.

Quando `computerUse.autoInstall` é true, o OpenClaw pode registrar o marketplace padrão
Codex Desktop incluído em
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se o Codex
ainda não tiver descoberto um marketplace local. Use `/new` ou `/reset` depois de
alterar a configuração de runtime ou Uso do Computador para que sessões existentes não mantenham uma vinculação antiga
de PI ou thread do Codex.

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

Servidor de aplicativo remoto com cabeçalhos explícitos:

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
a uma thread existente do Codex, o próximo turno envia novamente o modelo
OpenAI, o provedor, a política de aprovação, o sandbox e a camada de serviço atualmente selecionados ao
servidor de aplicativo. Trocar de `openai/gpt-5.5` para `openai/gpt-5.2` mantém a
vinculação da thread, mas solicita que o Codex continue com o modelo recém-selecionado.

## Comando Codex

O Plugin incluído registra `/codex` como um comando de barra autorizado. Ele é
genérico e funciona em qualquer canal que ofereça suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra a conectividade ativa com o servidor de aplicativo, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista os modelos ativos do servidor de aplicativo do Codex.
- `/codex threads [filter]` lista threads recentes do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma thread existente do Codex.
- `/codex compact` pede ao servidor de aplicativo do Codex para compactar a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pede confirmação antes de enviar feedback de diagnóstico do Codex para a thread anexada.
- `/codex computer-use status` verifica o Plugin Computer Use configurado e o servidor MCP.
- `/codex computer-use install` instala o Plugin Computer Use configurado e recarrega os servidores MCP.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do servidor de aplicativo do Codex.
- `/codex skills` lista as Skills do servidor de aplicativo do Codex.

Quando o Codex relata uma falha de limite de uso, o OpenClaw inclui o próximo
horário de redefinição do servidor de aplicativo quando o Codex fornece um. Use
`/codex account` na mesma conversa para inspecionar a conta atual e as janelas
de limite de taxa.

### Fluxo comum de depuração

Quando um agente baseado no Codex faz algo inesperado no Telegram, Discord, Slack,
ou em outro canal, comece pela conversa onde o problema aconteceu:

1. Execute `/diagnostics bad tool choice after image upload` ou outra nota curta
   que descreva o que você viu.
2. Aprove a solicitação de diagnóstico uma vez. A aprovação cria o zip local de
   diagnósticos do Gateway e, como a sessão está usando o ambiente do Codex, também
   envia o pacote de feedback relevante do Codex para os servidores da OpenAI.
3. Copie a resposta concluída de diagnóstico para o relatório de bug ou thread de suporte.
   Ela inclui o caminho do pacote local, o resumo de privacidade, os IDs de sessão do OpenClaw,
   os IDs de thread do Codex e uma linha `Inspect locally` para cada thread do Codex.
4. Se quiser depurar a execução por conta própria, execute o comando `Inspect locally`
   impresso em um terminal. Ele se parece com `codex resume <thread-id>` e abre a
   thread nativa do Codex para que você possa inspecionar a conversa, continuá-la localmente
   ou perguntar ao Codex por que ele escolheu uma ferramenta ou plano específico.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o envio de
feedback do Codex para a thread anexada no momento sem o pacote completo de diagnósticos do
Gateway do OpenClaw. Para a maioria dos relatórios de suporte, `/diagnostics [note]` é
o melhor ponto de partida porque vincula o estado local do Gateway e os IDs de thread do Codex
em uma única resposta. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
para ver o modelo completo de privacidade e o comportamento em chats de grupo.

O núcleo do OpenClaw também expõe `/diagnostics [note]`, somente para proprietários, como o comando geral
de diagnósticos do Gateway. O prompt de aprovação mostra o preâmbulo sobre dados confidenciais,
aponta para [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) e solicita
`openclaw gateway diagnostics export --json` por meio de aprovação explícita de execução
todas as vezes. Não aprove diagnósticos com uma regra de permissão total. Após a aprovação,
o OpenClaw envia um relatório copiável com o caminho do pacote local e o resumo do manifesto.
Quando a sessão ativa do OpenClaw está usando o ambiente do Codex, essa mesma aprovação
também autoriza o envio dos pacotes relevantes de feedback do Codex para os servidores da OpenAI.
O prompt de aprovação diz que o feedback do Codex será enviado, mas não lista IDs de sessão
ou de thread do Codex antes da aprovação.

Se `/diagnostics` for invocado por um proprietário em um chat de grupo, o OpenClaw mantém o
canal compartilhado limpo: o grupo recebe apenas um aviso curto, enquanto o preâmbulo de
diagnósticos, os prompts de aprovação e os IDs de sessão/thread do Codex são enviados ao
proprietário pela rota privada de aprovação. Se não houver uma rota privada para o proprietário,
o OpenClaw recusa a solicitação do grupo e pede que o proprietário a execute por uma DM.

O envio aprovado do Codex chama `feedback/upload` do servidor de aplicativo do Codex e pede
ao servidor de aplicativo que inclua logs de cada thread listada e de subthreads do Codex geradas
quando disponíveis. O envio passa pelo caminho normal de feedback do Codex para os servidores da OpenAI;
se o feedback do Codex estiver desativado nesse servidor de aplicativo, o comando retorna
o erro do servidor de aplicativo. A resposta concluída de diagnóstico lista os canais,
os IDs de sessão do OpenClaw, os IDs de thread do Codex e comandos locais `codex resume <thread-id>`
para as threads que foram enviadas. Se você negar ou ignorar a aprovação,
o OpenClaw não imprime esses IDs do Codex. Esse envio não substitui a exportação local
de diagnósticos do Gateway.

`/codex resume` grava o mesmo arquivo auxiliar de vinculação que o ambiente usa para
turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread do Codex, passa o
modelo do OpenClaw selecionado no momento para o servidor de aplicativo e mantém o histórico
estendido ativado.

### Inspecionar uma thread do Codex pela CLI

A forma mais rápida de entender uma execução ruim do Codex muitas vezes é abrir diretamente a
thread nativa do Codex:

```sh
codex resume <thread-id>
```

Use isto quando notar um bug em uma conversa de canal e quiser inspecionar a
sessão problemática do Codex, continuá-la localmente ou perguntar ao Codex por que ele fez uma
escolha específica de ferramenta ou raciocínio. O caminho mais fácil geralmente é executar
`/diagnostics [note]` primeiro: depois que você aprova, o relatório concluído lista
cada thread do Codex e imprime um comando `Inspect locally`, por exemplo
`codex resume <thread-id>`. Você pode copiar esse comando diretamente para um terminal.

Você também pode obter um ID de thread com `/codex binding` para o chat atual ou
`/codex threads [filter]` para threads recentes do servidor de aplicativo do Codex e, então, executar o mesmo
comando `codex resume` no seu shell.

A superfície de comando exige o servidor de aplicativo do Codex `0.125.0` ou mais recente. Métodos
individuais de controle são relatados como `unsupported by this Codex app-server` se um
servidor de aplicativo futuro ou personalizado não expuser esse método JSON-RPC.

## Limites de hooks

O ambiente do Codex tem três camadas de hooks:

| Camada                                | Proprietário              | Finalidade                                                          |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de Plugin do OpenClaw           | OpenClaw                  | Compatibilidade de produto/Plugin entre ambientes do PI e do Codex. |
| Middleware de extensão do servidor de aplicativo do Codex | Plugins empacotados do OpenClaw | Comportamento do adaptador por turno em torno de ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                     | Ciclo de vida de baixo nível do Codex e política de ferramentas nativas da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para rotear
comportamento de Plugins do OpenClaw. Para a ponte compatível de ferramentas nativas e permissões,
o OpenClaw injeta configuração do Codex por thread para `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Quando aprovações do servidor de aplicativo do Codex estão habilitadas
(`approvalPolicy` não é `"never"`), a configuração nativa de hooks injetada por padrão
omite `PermissionRequest` para que o revisor do servidor de aplicativo do Codex e a ponte de aprovação
do OpenClaw tratem escalonamentos reais após a revisão. Operadores ainda podem adicionar explicitamente
`permission_request` a `nativeHookRelay.events` quando precisarem do relay de compatibilidade.
Outros hooks do Codex, como `SessionStart` e `UserPromptSubmit`, continuam sendo
controles no nível do Codex; eles não são expostos como hooks de Plugin do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita a
chamada, portanto o OpenClaw dispara o comportamento de Plugin e middleware que ele possui no
adaptador do ambiente. Para ferramentas nativas do Codex, o Codex possui o registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação pelo servidor de aplicativo ou por callbacks de hooks nativos.

Projeções de Compaction e ciclo de vida de LLM vêm de notificações do servidor de aplicativo do Codex
e do estado do adaptador do OpenClaw, não de comandos de hooks nativos do Codex.
Os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte
da solicitação interna ou dos payloads de Compaction do Codex.

As notificações `hook/started` e `hook/completed` do servidor de aplicativo dos hooks nativos do Codex são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de Plugin do OpenClaw.

## Contrato de suporte V1

O modo Codex não é PI com uma chamada de modelo diferente por baixo. O Codex possui mais
do loop nativo do modelo, e o OpenClaw adapta suas superfícies de Plugin e sessão
em torno desse limite.

Com suporte no runtime Codex v1:

| Superfície                                       | Suporte                                                                              | Por quê                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo OpenAI por meio do Codex               | Suportado                                                                            | O app-server do Codex controla o turno da OpenAI, a retomada nativa da thread e a continuação nativa de ferramentas.                                                                                                                 |
| Roteamento e entrega de canais do OpenClaw         | Suportado                                                                            | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais permanecem fora do runtime do modelo.                                                                                                           |
| Ferramentas dinâmicas do OpenClaw                        | Suportado                                                                            | O Codex pede ao OpenClaw para executar essas ferramentas, então o OpenClaw permanece no caminho de execução.                                                                                                                       |
| Plugins de prompt e contexto                    | Suportado                                                                            | O OpenClaw constrói sobreposições de prompt e projeta contexto no turno do Codex antes de iniciar ou retomar a thread.                                                                                           |
| Ciclo de vida do mecanismo de contexto                      | Suportado                                                                            | Montagem, ingestão ou manutenção pós-turno, e coordenação de Compaction do mecanismo de contexto são executadas para turnos do Codex.                                                                                                |
| Hooks de ferramentas dinâmicas                            | Suportado                                                                            | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta são executados em torno de ferramentas dinâmicas pertencentes ao OpenClaw.                                                                                                 |
| Hooks de ciclo de vida                               | Suportado como observações do adaptador                                                    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex.                                                                                  |
| Gate de revisão da resposta final                    | Suportado por meio do relay de hook nativo                                              | O `Stop` do Codex é encaminhado para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem de modelo antes da finalização.                                                                                       |
| Bloqueio ou observação de shell, patch e MCP nativos | Suportado por meio do relay de hook nativo                                              | `PreToolUse` e `PostToolUse` do Codex são encaminhados para superfícies de ferramentas nativas confirmadas, incluindo payloads MCP no app-server do Codex `0.125.0` ou mais recente. O bloqueio é suportado; a reescrita de argumentos não é.      |
| Política de permissões nativa                      | Suportado por meio das aprovações do app-server do Codex e do relay de hook nativo de compatibilidade | As solicitações de aprovação do app-server do Codex são roteadas pelo OpenClaw após a revisão do Codex. O relay de hook nativo `PermissionRequest` é opcional para modos de aprovação nativa porque o Codex o emite antes da revisão do guardian. |
| Captura de trajetória do app-server                 | Suportado                                                                            | O OpenClaw registra a solicitação que enviou ao app-server e as notificações do app-server que recebe.                                                                                                           |

Não suportado no runtime Codex v1:

| Superfície                                             | Limite da V1                                                                                                                                     | Caminho futuro                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutação de argumentos de ferramentas nativas                       | Hooks nativos pré-ferramenta do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.                                               | Requer suporte de hook/esquema do Codex para substituir a entrada da ferramenta.                            |
| Histórico editável de transcript nativo do Codex            | O Codex controla o histórico nativo canônico da thread. O OpenClaw controla um espelho e pode projetar contexto futuro, mas não deve mutar internos sem suporte. | Adicionar APIs explícitas do app-server do Codex se cirurgia de thread nativa for necessária.                    |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma gravações de transcript pertencentes ao OpenClaw, não registros de ferramentas nativas do Codex.                                                           | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex.              |
| Metadados ricos de Compaction nativa                     | O OpenClaw observa o início e a conclusão da Compaction, mas não recebe uma lista estável de itens mantidos/removidos, delta de tokens ou payload de resumo.            | Precisa de eventos de Compaction mais ricos do Codex.                                                     |
| Intervenção de Compaction                             | Os hooks atuais de Compaction do OpenClaw estão no nível de notificação no modo Codex.                                                                         | Adicionar hooks pré/pós-Compaction do Codex se plugins precisarem vetar ou reescrever a Compaction nativa. |
| Captura byte a byte de solicitação da API de modelo             | O OpenClaw pode capturar solicitações e notificações do app-server, mas o núcleo do Codex constrói internamente a solicitação final da API da OpenAI.                      | Precisa de um evento de rastreamento de solicitação de modelo do Codex ou de uma API de depuração.                                   |

## Ferramentas, mídia e Compaction

O harness do Codex altera apenas o executor de agente incorporado de baixo nível.

O OpenClaw ainda constrói a lista de ferramentas e recebe resultados de ferramentas dinâmicas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramenta de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

O relay de hook nativo é intencionalmente genérico, mas o contrato de suporte da v1 é
limitado aos caminhos de ferramentas e permissões nativas do Codex que o OpenClaw testa. No
runtime Codex, isso inclui payloads `PreToolUse`,
`PostToolUse` e `PermissionRequest` de shell, patch e MCP. Não presuma que todo evento futuro de hook
do Codex seja uma superfície de plugin do OpenClaw até que o contrato de runtime o nomeie.

Para `PermissionRequest`, o OpenClaw só retorna decisões explícitas de permitir ou negar
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como sem
decisão de hook e prossegue para seu próprio caminho de guardian ou aprovação do usuário.
Os modos de aprovação do app-server do Codex omitem esse hook nativo por padrão; este parágrafo
se aplica quando `permission_request` é incluído explicitamente em
`nativeHookRelay.events` ou quando um runtime de compatibilidade o instala.
Quando um operador escolhe `allow-always` para uma solicitação de permissão nativa do Codex,
o OpenClaw lembra a impressão digital exata de provedor/sessão/entrada de ferramenta/cwd por uma
janela de sessão limitada. A decisão lembrada é intencionalmente apenas de correspondência exata:
um comando, argumentos, payload de ferramenta ou cwd alterado cria uma nova
aprovação.

Solicitações de aprovação de ferramenta MCP do Codex são roteadas pelo fluxo de aprovação de plugin
do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação do servidor
nativo em vez de ser direcionada como contexto extra. Outras solicitações de elicitação MCP
ainda falham fechadas.

O direcionamento da fila de execução ativa é mapeado para `turn/steer` do app-server do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa mensagens de chat enfileiradas
pela janela de silêncio configurada e as envia como uma solicitação `turn/steer` em
ordem de chegada. O modo legado `queue` envia solicitações `turn/steer` separadas. Turnos de
revisão do Codex e Compaction manual podem rejeitar o direcionamento no mesmo turno; nesse caso,
o OpenClaw usa a fila de acompanhamento quando o modo selecionado permite fallback. Consulte
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

Quando o modelo selecionado usa o harness do Codex, a Compaction nativa da thread é
delegada ao app-server do Codex. O OpenClaw mantém um espelho do transcript para histórico de canais,
busca, `/new`, `/reset` e troca futura de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de
raciocínio ou plano do Codex quando o app-server os emite. Hoje, o OpenClaw só
registra sinais de início e conclusão de Compaction nativa. Ele ainda não expõe um
resumo de Compaction legível por humanos nem uma lista auditável de quais entradas o Codex
manteve após a Compaction.

Como o Codex controla a thread nativa canônica, `tool_result_persist` não
reescreve atualmente registros de resultado de ferramentas nativas do Codex. Ele só se aplica quando
o OpenClaw está gravando um resultado de ferramenta em transcript de sessão pertencente ao OpenClaw.

A geração de mídia não requer PI. Imagem, vídeo, música, PDF, TTS e compreensão de mídia
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
backend de compatibilidade quando nenhum harness do Codex reivindica a execução. Defina
`agentRuntime.id: "codex"` para forçar a seleção do Codex durante os testes. Um
runtime Codex forçado falha em vez de recorrer a PI. Depois que o app-server do Codex
é selecionado, suas falhas aparecem diretamente.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
informe a versão `0.125.0` ou mais recente. Pré-lançamentos da mesma versão ou
versões com sufixo de build, como `0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o
piso de protocolo estável `0.125.0` é o que o OpenClaw testa.

**A descoberta de modelos está lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desabilite a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão do protocolo do app-server do Codex.

**Um modelo não Codex usa PI:** isso é esperado, a menos que você tenha forçado
`agentRuntime.id: "codex"` para esse agente ou selecionado uma referência legada
`codex/*`. Referências simples `openai/gpt-*` e de outros provedores permanecem em seu caminho normal
de provedor no modo `auto`. Se você forçar `agentRuntime.id: "codex"`, todo turno incorporado
desse agente deve ser um modelo OpenAI suportado pelo Codex.

**Computer Use está instalado, mas as ferramentas não são executadas:** verifique
`/codex computer-use status` a partir de uma sessão nova. Se uma ferramenta relatar
`Native hook relay unavailable`, use `/new` ou `/reset`; se persistir, reinicie
o Gateway para limpar registros obsoletos de hooks nativos. Se `computer-use.list_apps`
atingir o tempo limite, reinicie o Codex Computer Use ou o Codex Desktop e tente novamente.

## Relacionados

- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Status](/pt-BR/cli/status)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
