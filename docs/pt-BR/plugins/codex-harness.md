---
read_when:
    - Você quer usar o harness de app-server do Codex incluído
    - Você precisa de exemplos de configuração do ambiente de execução do Codex
    - Você quer que implantações apenas com Codex falhem em vez de recorrerem ao Pi
summary: Execute turnos de agente embutido do OpenClaw pela estrutura de execução app-server incluída no Codex
title: Estrutura de execução do Codex
x-i18n:
    generated_at: "2026-05-05T01:48:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

O Plugin `codex` incluído permite que o OpenClaw execute turnos de agente incorporados pelo
app-server do Codex em vez do harness PI integrado.

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

Turnos de heartbeat do Codex também recebem a ferramenta `heartbeat_respond` por padrão, para que o
agente possa registrar se o despertar deve permanecer silencioso ou notificar sem codificar
esse fluxo de controle no texto final.

A orientação de iniciativa específica de Heartbeat é enviada como uma instrução de desenvolvedor em
modo de colaboração do Codex no próprio turno de heartbeat. Turnos de chat comuns restauram
o modo padrão do Codex em vez de carregar a filosofia de heartbeat no prompt normal
de runtime.

Se você está tentando se orientar, comece com
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a referência de modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## Configuração rápida

A maioria dos usuários que quer "Codex no OpenClaw" quer esta rota: entrar com uma
assinatura ChatGPT/Codex e então executar turnos de agente incorporados pelo runtime nativo
do app-server do Codex. A referência de modelo ainda permanece canônica como
`openai/gpt-*`; a autenticação por assinatura vem da conta/perfil do Codex, não
de um prefixo de modelo `openai-codex/*`.

Primeiro entre com OAuth do Codex, se ainda não tiver feito isso:

```bash
openclaw models auth login --provider openai-codex
```

Então habilite o Plugin `codex` incluído e force o runtime do Codex:

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

Não use `openai-codex/gpt-*` quando você quer dizer runtime nativo do Codex. Esse prefixo
é a rota explícita "OAuth do Codex pelo PI". Alterações de configuração se aplicam a sessões novas ou
redefinidas; sessões existentes mantêm o runtime registrado delas.

## O que este Plugin altera

O Plugin `codex` incluído contribui com várias capacidades separadas:

| Capacidade                         | Como você a usa                                     | O que ela faz                                                                 |
| ---------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime incorporado nativo         | `agentRuntime.id: "codex"`                          | Executa turnos de agente incorporados do OpenClaw pelo app-server do Codex.   |
| Comandos nativos de controle de chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula e controla threads do app-server do Codex a partir de uma conversa de mensagens. |
| Provedor/catálogo do app-server do Codex | Internos de `codex`, expostos pelo harness      | Permite que o runtime descubra e valide modelos do app-server.                |
| Caminho de entendimento de mídia do Codex | Caminhos de compatibilidade de modelos de imagem `codex/*` | Executa turnos limitados do app-server do Codex para modelos compatíveis de entendimento de imagem. |
| Relay de hooks nativos             | Hooks de Plugin ao redor de eventos nativos do Codex | Permite que o OpenClaw observe/bloqueie eventos compatíveis de ferramenta/finalização nativos do Codex. |

Habilitar o Plugin disponibiliza essas capacidades. Ele **não**:

- começa a usar o Codex para todo modelo OpenAI
- converte referências de modelo `openai-codex/*` no runtime nativo
- torna ACP/acpx o caminho padrão do Codex
- troca em tempo real sessões existentes que já registraram um runtime PI
- substitui entrega por canal, arquivos de sessão, armazenamento de perfil de autenticação ou
  roteamento de mensagens do OpenClaw

O mesmo Plugin também é responsável pela superfície nativa de comandos de controle de chat `/codex`. Se
o Plugin está habilitado e o usuário pede para vincular, retomar, direcionar, parar ou inspecionar
threads do Codex pelo chat, agentes devem preferir `/codex ...` em vez de ACP. ACP continua sendo
o fallback explícito quando o usuário pede ACP/acpx ou está testando o adaptador Codex
do ACP.

Turnos nativos do Codex mantêm os hooks de Plugin do OpenClaw como a camada pública de compatibilidade.
Estes são hooks em processo do OpenClaw, não hooks de comando `hooks.json` do Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros espelhados de transcrição
- `before_agent_finalize` pelo relay `Stop` do Codex
- `agent_end`

Plugins também podem registrar middleware de resultado de ferramenta neutro quanto ao runtime para reescrever
resultados dinâmicos de ferramentas do OpenClaw depois que o OpenClaw executa a ferramenta e antes que o
resultado seja retornado ao Codex. Isso é separado do hook público de Plugin
`tool_result_persist`, que transforma escritas de resultado de ferramenta na transcrição pertencentes ao OpenClaw.

Para a semântica dos próprios hooks de Plugin, consulte [Hooks de Plugin](/pt-BR/plugins/hooks)
e [Comportamento de guarda de Plugin](/pt-BR/tools/plugin).

O harness fica desativado por padrão. Novas configurações devem manter referências de modelo OpenAI
canônicas como `openai/gpt-*` e forçar explicitamente
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` quando quiserem
execução nativa no app-server. Referências de modelo legadas `codex/*` ainda selecionam automaticamente
o harness por compatibilidade, mas prefixos de provedor legados com suporte de runtime
não são exibidos como escolhas normais de modelo/provedor.

Se o Plugin `codex` estiver habilitado, mas o modelo primário ainda for
`openai-codex/*`, `openclaw doctor` avisa em vez de alterar a rota. Isso é
intencional: `openai-codex/*` continua sendo o caminho PI de OAuth/assinatura do Codex, e
a execução nativa no app-server continua sendo uma escolha explícita de runtime.

## Mapa de rotas

Use esta tabela antes de alterar a configuração:

| Comportamento desejado                              | Referência de modelo       | Configuração de runtime                | Rota de autenticação/perfil  | Rótulo de status esperado      |
| --------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Assinatura ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | OAuth do Codex ou conta do Codex | `Runtime: OpenAI Codex`        |
| API da OpenAI pelo executor normal do OpenClaw       | `openai/gpt-*`             | omitido ou `runtime: "pi"`             | Chave de API da OpenAI       | `Runtime: OpenClaw Pi Default` |
| Assinatura ChatGPT/Codex pelo PI                    | `openai-codex/gpt-*`       | omitido ou `runtime: "pi"`             | Provedor OAuth OpenAI Codex  | `Runtime: OpenClaw Pi Default` |
| Provedores mistos com modo automático conservador    | referências específicas do provedor | `agentRuntime.id: "auto"`              | Por provedor selecionado     | Depende do runtime selecionado |
| Sessão explícita do adaptador Codex ACP              | depende de prompt/modelo ACP | `sessions_spawn` com `runtime: "acp"` | Autenticação do backend ACP  | Status de tarefa/sessão ACP    |

A divisão importante é provedor versus runtime:

- `openai-codex/*` responde "qual rota de provedor/autenticação o PI deve usar?"
- `agentRuntime.id: "codex"` responde "qual loop deve executar este
  turno incorporado?"
- `/codex ...` responde "a qual conversa nativa do Codex este chat deve se vincular
  ou controlar?"
- ACP responde "qual processo de harness externo o acpx deve iniciar?"

## Escolha o prefixo de modelo correto

Rotas da família OpenAI são específicas por prefixo. Para a configuração comum de assinatura mais
runtime nativo do Codex, use `openai/*` com `agentRuntime.id: "codex"`.
Use `openai-codex/*` apenas quando você quiser intencionalmente OAuth do Codex pelo PI:

| Referência de modelo                         | Caminho de runtime                         | Use quando                                                                 |
| -------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | Provedor OpenAI pelo encanamento OpenClaw/PI | Você quer acesso atual direto à API da OpenAI Platform com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | OAuth OpenAI Codex pelo OpenClaw/PI        | Você quer autenticação por assinatura ChatGPT/Codex com o executor PI padrão. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness do app-server do Codex             | Você quer autenticação por assinatura ChatGPT/Codex com execução nativa do Codex. |

GPT-5.5 pode aparecer em rotas de chave de API direta da OpenAI e de assinatura do Codex
quando sua conta as expõe. Use `openai/gpt-5.5` com o harness do app-server
do Codex para runtime nativo do Codex, `openai-codex/gpt-5.5` para OAuth pelo PI, ou
`openai/gpt-5.5` sem uma substituição de runtime do Codex para tráfego direto por chave de API.

Referências legadas `codex/gpt-*` continuam aceitas como aliases de compatibilidade. A migração de
compatibilidade do doctor reescreve referências legadas de runtime primário para referências de modelo
canônicas e registra a política de runtime separadamente, enquanto referências legadas apenas de fallback
ficam inalteradas porque o runtime é configurado para todo o contêiner do agente.
Novas configurações de OAuth PI do Codex devem usar `openai-codex/gpt-*`; novas configurações nativas
do harness do app-server devem usar `openai/gpt-*` mais
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use
`openai-codex/gpt-*` quando o entendimento de imagem deve ser executado pelo caminho de provedor OAuth
OpenAI Codex. Use `codex/gpt-*` quando o entendimento de imagem deve ser executado
por um turno limitado do app-server do Codex. O modelo do app-server do Codex deve
anunciar suporte a entrada de imagem; modelos Codex somente texto falham antes que o turno de mídia
comece.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a seleção
for surpreendente, habilite logs de depuração para o subsistema `agents/harness`
e inspecione o registro estruturado `agent harness selected` do Gateway. Ele
inclui o id do harness selecionado, motivo da seleção, política de runtime/fallback e,
no modo `auto`, o resultado de suporte de cada candidato de Plugin.

### O que os avisos do doctor significam

`openclaw doctor` avisa quando todos estes itens são verdadeiros:

- o Plugin `codex` incluído está habilitado ou permitido
- o modelo primário de um agente é `openai-codex/*`
- o runtime efetivo desse agente não é `codex`

Esse aviso existe porque usuários costumam esperar que "Plugin do Codex habilitado" implique
"runtime nativo do app-server do Codex." O OpenClaw não faz esse salto. O aviso
significa:

- **Nenhuma alteração é necessária** se você pretendia usar OAuth ChatGPT/Codex pelo PI.
- Altere o modelo para `openai/<model>` e defina
  `agentRuntime.id: "codex"` se você pretendia execução nativa no app-server.
- Sessões existentes ainda precisam de `/new` ou `/reset` depois de uma alteração de runtime,
  porque pins de runtime de sessão são persistentes.

A seleção de harness não é um controle de sessão ao vivo. Quando um turno incorporado é executado,
o OpenClaw registra o id do harness selecionado nessa sessão e continua a usá-lo para
turnos posteriores no mesmo id de sessão. Altere a configuração `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro harness;
use `/new` ou `/reset` para iniciar uma sessão nova antes de alternar uma conversa existente
entre PI e Codex. Isso evita reproduzir uma transcrição por dois sistemas de sessão nativa
incompatíveis.

As sessões legadas criadas antes das fixações do ambiente de execução são tratadas como fixadas ao Pi assim que
tiverem histórico de transcrição. Use `/new` ou `/reset` para optar por incluir essa conversa no
Codex após alterar a configuração.

`/status` mostra o runtime efetivo do modelo. O ambiente de execução padrão do Pi aparece como
`Runtime: OpenClaw Pi Default`, e o ambiente de execução do servidor de aplicativo do Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw com o Plugin `codex` incluído disponível.
- Servidor de aplicativo do Codex `0.125.0` ou mais recente. O Plugin incluído gerencia um binário
  compatível do servidor de aplicativo do Codex por padrão, portanto comandos `codex` locais no `PATH` não
  afetam a inicialização normal do ambiente de execução.
- Autenticação do Codex disponível para o processo do servidor de aplicativo ou para a ponte de autenticação Codex
  do OpenClaw. Inicializações locais do servidor de aplicativo usam uma home do Codex gerenciada pelo OpenClaw para cada
  agente e um `HOME` filho isolado, portanto, por padrão, elas não leem sua conta pessoal
  `~/.codex`, Skills, plugins, configuração, estado de threads ou
  `$HOME/.agents/skills` nativo.

O Plugin bloqueia handshakes de servidor de aplicativo mais antigos ou sem versão. Isso mantém o
OpenClaw na superfície de protocolo contra a qual ele foi testado.

Para testes smoke ao vivo e Docker, a autenticação geralmente vem da conta da CLI do Codex
ou de um perfil de autenticação `openai-codex` do OpenClaw. Inicializações locais do servidor de aplicativo via stdio
também podem recorrer a `CODEX_API_KEY` / `OPENAI_API_KEY` quando nenhuma conta estiver presente.

## Arquivos de bootstrap do workspace

O Codex lida com `AGENTS.md` por conta própria por meio da descoberta nativa de documentação de projeto. O OpenClaw
não grava arquivos sintéticos de documentação de projeto do Codex nem depende de nomes de arquivo de fallback do Codex
para arquivos de persona, porque os fallbacks do Codex só se aplicam quando
`AGENTS.md` está ausente.

Para paridade de workspace do OpenClaw, o ambiente de execução do Codex resolve os outros arquivos de bootstrap
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` e `MEMORY.md`, quando presentes) e os encaminha pelas instruções de configuração do Codex
em `thread/start` e `thread/resume`. Isso mantém
`SOUL.md` e o contexto relacionado de persona/perfil do workspace visíveis sem
duplicar `AGENTS.md`.

## Adicionar Codex ao lado de outros modelos

Não defina `agentRuntime.id: "codex"` globalmente se o mesmo agente deve alternar livremente
entre o Codex e modelos de provedores não Codex. Um runtime forçado se aplica a cada
turno incorporado desse agente ou sessão. Se você selecionar um modelo Anthropic enquanto
esse runtime estiver forçado, o OpenClaw ainda tentará usar o ambiente de execução do Codex e falhará de modo fechado
em vez de encaminhar silenciosamente esse turno pelo Pi.

Use um destes formatos em vez disso:

- Coloque o Codex em um agente dedicado com `agentRuntime.id: "codex"`.
- Mantenha o agente padrão em `agentRuntime.id: "auto"` e o fallback do Pi para uso normal misto
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

Com este formato:

- O agente padrão `main` usa o caminho normal do provedor e o fallback de compatibilidade do Pi.
- O agente `codex` usa o ambiente de execução do servidor de aplicativo do Codex.
- Se o Codex estiver ausente ou não for compatível para o agente `codex`, o turno falha
  em vez de usar o Pi silenciosamente.

## Roteamento de comandos de agente

Os agentes devem rotear solicitações de usuário por intenção, não apenas pela palavra "Codex":

| Usuário pede para...                                    | Agente deve usar...                              |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Vincular este chat ao Codex"                           | `/codex bind`                                    |
| "Retomar thread do Codex `<id>` aqui"                   | `/codex resume <id>`                             |
| "Mostrar threads do Codex"                              | `/codex threads`                                 |
| "Registrar um relatório de suporte para uma execução ruim do Codex" | `/diagnostics [note]`                            |
| "Enviar feedback do Codex apenas para esta thread anexada" | `/codex diagnostics [note]`                      |
| "Usar minha assinatura do ChatGPT/Codex com runtime do Codex" | `openai/*` mais `agentRuntime.id: "codex"`       |
| "Usar minha assinatura do ChatGPT/Codex pelo Pi"        | referências de modelo `openai-codex/*`           |
| "Executar Codex por ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Iniciar Claude Code/Gemini/OpenCode/Cursor em uma thread" | ACP/acpx, não `/codex` e não subagentes nativos |

O OpenClaw só anuncia orientação de spawn do ACP para agentes quando o ACP está habilitado,
pode ser despachado e é apoiado por um backend de runtime carregado. Se o ACP não estiver disponível,
o prompt do sistema e as Skills de Plugin não devem ensinar o agente sobre roteamento
do ACP.

## Implantações somente com Codex

Force o ambiente de execução do Codex quando precisar provar que cada turno de agente incorporado
usa Codex. Runtimes explícitos de Plugin falham de modo fechado e nunca são repetidos silenciosamente
pelo Pi:

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

Com Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver desativado, o
servidor de aplicativo for antigo demais ou o servidor de aplicativo não conseguir iniciar.

## Codex por agente

Você pode tornar um agente exclusivo para Codex enquanto o agente padrão mantém a
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
sessão do OpenClaw, e o ambiente de execução do Codex cria ou retoma sua thread
auxiliar de servidor de aplicativo conforme necessário. `/reset` limpa a vinculação da sessão do OpenClaw para essa thread
e permite que o próximo turno resolva o ambiente de execução a partir da configuração atual novamente.

## Descoberta de modelos

Por padrão, o Plugin Codex pede ao servidor de aplicativo os modelos disponíveis. Se a
descoberta falhar ou atingir o tempo limite, ele usa um catálogo de fallback incluído para:

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

Desative a descoberta quando quiser que a inicialização evite sondar o Codex e fique no
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

## Conexão e política do servidor de aplicativo

Por padrão, o Plugin inicia localmente o binário gerenciado do Codex do OpenClaw com:

```bash
codex app-server --listen stdio://
```

O binário gerenciado é enviado com o pacote do Plugin `codex`. Isso mantém a
versão do servidor de aplicativo vinculada ao Plugin incluído em vez de qualquer CLI
Codex separada que por acaso esteja instalada localmente. Defina `appServer.command` apenas quando
você quiser intencionalmente executar um executável diferente.

Por padrão, o OpenClaw inicia sessões locais do ambiente de execução do Codex no modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Esta é a postura confiável de operador local usada
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

O modo guardião usa o caminho de aprovação com revisão automática nativo do Codex. Quando o Codex pede para
sair da sandbox, gravar fora do workspace ou adicionar permissões como acesso à rede,
o Codex encaminha essa solicitação de aprovação ao revisor nativo em vez de a um
prompt humano. O revisor aplica o framework de risco do Codex e aprova ou nega
a solicitação específica. Use Guardião quando quiser mais proteções que o modo YOLO,
mas ainda precisar que agentes não supervisionados avancem.

A predefinição `guardian` se expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
Campos de política individuais ainda sobrescrevem `mode`, portanto implantações avançadas podem combinar
a predefinição com escolhas explícitas. O valor de revisor mais antigo `guardian_subagent`
ainda é aceito como alias de compatibilidade, mas novas configurações devem usar
`auto_review`.

Para um servidor de aplicativo já em execução, use transporte WebSocket:

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

Inicializações do servidor de aplicativo via stdio herdam o ambiente de processo do OpenClaw por padrão,
mas o OpenClaw possui a ponte de conta do servidor de aplicativo do Codex e define tanto
`CODEX_HOME` quanto `HOME` para diretórios por agente sob o estado do OpenClaw
desse agente. O carregador de Skills próprio do Codex lê `$CODEX_HOME/skills` e
`$HOME/.agents/skills`, portanto ambos os valores são isolados para inicializações locais do servidor de aplicativo.
Isso mantém Skills, plugins, configuração, contas e estado de threads nativos do Codex
escopados ao agente OpenClaw em vez de vazarem da home pessoal da CLI do Codex
do operador.

Plugins do OpenClaw e snapshots de Skills do OpenClaw ainda fluem pelo próprio
registro de Plugins e carregador de Skills do OpenClaw. Ativos pessoais da CLI do Codex não. Se você tiver
Skills ou plugins úteis da CLI do Codex que devam se tornar parte de um agente OpenClaw,
faça um inventário deles explicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

O provedor de migração do Codex copia Skills para o workspace atual do agente OpenClaw.
Plugins, hooks e arquivos de configuração nativos do Codex são relatados ou arquivados
para revisão manual em vez de serem ativados automaticamente, porque podem
executar comandos, expor servidores MCP ou carregar credenciais.

A autenticação é selecionada nesta ordem:

1. Um perfil explícito de autenticação Codex do OpenClaw para o agente.
2. A conta existente do servidor de aplicativo na home do Codex desse agente.
3. Apenas para inicializações locais do servidor de aplicativo via stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta de servidor de aplicativo estiver presente e a autenticação da OpenAI
   ainda for necessária.

Quando o OpenClaw vê um perfil de autenticação Codex no estilo de assinatura do ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho do Codex gerado. Isso
mantém chaves de API no nível do Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer com que turnos nativos do servidor de aplicativo do Codex sejam cobrados pela API por acidente.
Perfis explícitos de chave de API do Codex e fallback de chave de ambiente via stdio local usam login do servidor de aplicativo
em vez de ambiente herdado do processo filho. Conexões WebSocket ao servidor de aplicativo
não recebem fallback de chave de API de ambiente do Gateway; use um perfil de autenticação explícito ou a
conta própria do servidor de aplicativo remoto.

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

`appServer.clearEnv` afeta apenas o processo filho do app-server do Codex gerado.

As ferramentas dinâmicas do Codex usam por padrão o perfil `native-first`. Nesse modo,
o OpenClaw não expõe ferramentas dinâmicas que duplicam operações nativas de workspace
do Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` e
`update_plan`. Ferramentas de integração do OpenClaw, como mensagens, sessões, mídia,
cron, navegador, nós, gateway, `heartbeat_respond` e `web_search`, continuam
disponíveis.

Campos de nível superior do Plugin Codex com suporte:

| Campo                      | Padrão          | Significado                                                                                   |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Use `"openclaw-compat"` para expor o conjunto completo de ferramentas dinâmicas do OpenClaw ao app-server do Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir dos turnos do app-server do Codex.               |

Campos de `appServer` com suporte:

| Campo               | Padrão                                  | Significado                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` se conecta a `url`.                                                                                                                                                                             |
| `command`           | binário gerenciado do Codex              | Executável para transporte stdio. Deixe indefinido para usar o binário gerenciado; defina apenas para uma substituição explícita.                                                                                                      |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                                                                                                                                       |
| `url`               | indefinido                               | URL WebSocket do app-server.                                                                                                                                                                                                            |
| `authToken`         | indefinido                               | Token Bearer para transporte WebSocket.                                                                                                                                                                                                 |
| `headers`           | `{}`                                     | Cabeçalhos WebSocket extras.                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                     | Nomes extras de variáveis de ambiente removidos do processo app-server stdio gerado depois que o OpenClaw cria seu ambiente herdado. `CODEX_HOME` e `HOME` são reservados para o isolamento Codex por agente do OpenClaw em inicializações locais. |
| `requestTimeoutMs`  | `60000`                                  | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                         |
| `mode`              | `"yolo"`                                 | Predefinição para execução YOLO ou revisada pelo guardian.                                                                                                                                                                             |
| `approvalPolicy`    | `"never"`                                | Política de aprovação nativa do Codex enviada para início/retomada/turno de thread.                                                                                                                                                    |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo do Codex enviado para início/retomada de thread.                                                                                                                                                                  |
| `approvalsReviewer` | `"user"`                                 | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos. `guardian_subagent` continua sendo um alias legado.                                                                                                  |
| `serviceTier`       | indefinido                               | Camada de serviço opcional do app-server do Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados.                                                                                                             |

Chamadas de ferramentas dinâmicas de propriedade do OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`: cada solicitação `item/tool/call` do Codex deve receber
uma resposta do OpenClaw em até 30 segundos. Em caso de tempo limite, o OpenClaw aborta o sinal da ferramenta
quando houver suporte e retorna uma resposta de ferramenta dinâmica com falha ao Codex para que
o turno possa continuar em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação do app-server com escopo de turno do Codex, o harness
também espera que o Codex finalize o turno nativo com `turn/completed`. Se o
app-server ficar sem responder por 60 segundos após essa resposta, o OpenClaw tenta, em melhor esforço,
interromper o turno do Codex, registra um tempo limite de diagnóstico e libera a raia da sessão do
OpenClaw para que mensagens de chat seguintes não fiquem enfileiradas atrás de um turno nativo obsoleto.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A configuração é
preferível para implantações repetíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness do Codex.

## Uso do computador

O Uso do computador é abordado em seu próprio guia de configuração:
[Uso do computador do Codex](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não inclui como vendored o aplicativo de controle de desktop nem executa
ações de desktop por conta própria. Ele prepara o app-server do Codex, verifica se o
servidor MCP `computer-use` está disponível e então permite que o Codex lide com as chamadas nativas de ferramentas
MCP durante turnos em modo Codex.

Para acesso direto ao driver TryCua fora do fluxo do marketplace do Codex, registre
`cua-driver mcp` com `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Veja [Uso do computador do Codex](/pt-BR/plugins/codex-computer-use) para a distinção
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

A configuração pode ser verificada ou instalada pela superfície de comando:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

O Uso do computador é específico do macOS e pode exigir permissões locais do sistema operacional antes que o
servidor MCP do Codex possa controlar aplicativos. Se `computerUse.enabled` for true e o servidor MCP
estiver indisponível, turnos em modo Codex falham antes que a thread seja iniciada, em vez de
executar silenciosamente sem as ferramentas nativas de Uso do computador. Veja
[Uso do computador do Codex](/pt-BR/plugins/codex-computer-use) para opções de marketplace,
limites do catálogo remoto, motivos de status e solução de problemas.

Quando `computerUse.autoInstall` é true, o OpenClaw pode registrar o marketplace padrão
incluído do Codex Desktop a partir de
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se o Codex
ainda não tiver descoberto um marketplace local. Use `/new` ou `/reset` depois de
alterar a configuração de runtime ou de Uso do computador para que sessões existentes não mantenham uma vinculação antiga
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

A troca de modelo permanece controlada pelo OpenClaw. Quando uma sessão do OpenClaw está anexada
a uma thread existente do Codex, o próximo turno envia novamente ao
app-server o modelo OpenAI, provedor, política de aprovação, sandbox e camada de serviço
atualmente selecionados. Trocar de `openai/gpt-5.5` para `openai/gpt-5.2` mantém a
vinculação da thread, mas pede ao Codex para continuar com o modelo recém-selecionado.

## Comando Codex

O Plugin incluído registra `/codex` como um comando de barra autorizado. Ele é
genérico e funciona em qualquer canal que dê suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade ativa com o servidor de aplicativo, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista os modelos ativos do servidor de aplicativo do Codex.
- `/codex threads [filter]` lista threads recentes do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma thread existente do Codex.
- `/codex compact` pede ao servidor de aplicativo do Codex para compactar a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` solicita confirmação antes de enviar feedback de diagnóstico do Codex para a thread anexada.
- `/codex computer-use status` verifica o plugin Computer Use configurado e o servidor MCP.
- `/codex computer-use install` instala o plugin Computer Use configurado e recarrega os servidores MCP.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do servidor de aplicativo do Codex.
- `/codex skills` lista as Skills do servidor de aplicativo do Codex.

Quando o Codex relata uma falha de limite de uso, o OpenClaw inclui o próximo
horário de redefinição do servidor de aplicativo quando o Codex fornece um. Use `/codex account` na mesma
conversa para inspecionar a conta atual e as janelas de limite de taxa.

### Fluxo comum de depuração

Quando um agente baseado no Codex faz algo inesperado no Telegram, Discord, Slack,
ou outro canal, comece pela conversa onde o problema aconteceu:

1. Execute `/diagnostics bad tool choice after image upload` ou outra nota curta
   que descreva o que você viu.
2. Aprove a solicitação de diagnóstico uma vez. A aprovação cria o zip local de
   diagnóstico do Gateway e, como a sessão está usando o harness do Codex, também
   envia o pacote de feedback relevante do Codex para os servidores da OpenAI.
3. Copie a resposta de diagnóstico concluída para o relatório de bug ou thread de suporte.
   Ela inclui o caminho do pacote local, o resumo de privacidade, ids de sessão do OpenClaw,
   ids de thread do Codex e uma linha `Inspect locally` para cada thread do Codex.
4. Se você quiser depurar a execução por conta própria, execute o comando `Inspect locally`
   impresso em um terminal. Ele se parece com `codex resume <thread-id>` e abre a
   thread nativa do Codex para que você possa inspecionar a conversa, continuá-la localmente
   ou perguntar ao Codex por que ele escolheu uma ferramenta ou plano específico.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o upload de
feedback do Codex para a thread atualmente anexada sem o pacote completo de diagnósticos do
Gateway do OpenClaw. Para a maioria dos relatórios de suporte, `/diagnostics [note]` é
o melhor ponto de partida, porque vincula o estado local do Gateway e os ids de thread do Codex
em uma única resposta. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
para o modelo completo de privacidade e o comportamento em chats de grupo.

O núcleo do OpenClaw também expõe `/diagnostics [note]`, somente para proprietários, como o comando geral
de diagnósticos do Gateway. O prompt de aprovação mostra o preâmbulo de dados sensíveis,
links para [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) e solicita
`openclaw gateway diagnostics export --json` por meio de aprovação explícita de exec
todas as vezes. Não aprove diagnósticos com uma regra permitir-tudo. Após a aprovação,
o OpenClaw envia um relatório colável com o caminho do pacote local e o resumo do
manifesto. Quando a sessão ativa do OpenClaw está usando o harness do Codex, essa
mesma aprovação também autoriza o envio dos pacotes de feedback relevantes do Codex para
os servidores da OpenAI. O prompt de aprovação diz que o feedback do Codex será enviado, mas
não lista ids de sessão ou thread do Codex antes da aprovação.

Se `/diagnostics` for invocado por um proprietário em um chat de grupo, o OpenClaw mantém o
canal compartilhado limpo: o grupo recebe apenas um aviso curto, enquanto o
preâmbulo de diagnóstico, os prompts de aprovação e os ids de sessão/thread do Codex são enviados ao
proprietário pela rota privada de aprovação. Se não houver rota privada para o proprietário,
o OpenClaw recusa a solicitação do grupo e pede que o proprietário a execute por DM.

O upload aprovado do Codex chama `feedback/upload` no servidor de aplicativo do Codex e pede
ao servidor de aplicativo para incluir logs para cada thread listada e subthreads do Codex geradas,
quando disponíveis. O upload passa pelo caminho normal de feedback do Codex para os servidores da OpenAI;
se o feedback do Codex estiver desativado nesse servidor de aplicativo, o comando retorna
o erro do servidor de aplicativo. A resposta de diagnóstico concluída lista os canais,
ids de sessão do OpenClaw, ids de thread do Codex e comandos locais `codex resume <thread-id>`
para as threads que foram enviadas. Se você negar ou ignorar a aprovação,
o OpenClaw não imprime esses ids do Codex. Esse upload não substitui a exportação local
de diagnósticos do Gateway.

`/codex resume` grava o mesmo arquivo de associação auxiliar que o harness usa para
turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread do Codex, passa o
modelo OpenClaw selecionado no momento para o servidor de aplicativo e mantém o histórico estendido
ativado.

### Inspecionar uma thread do Codex pela CLI

A maneira mais rápida de entender uma execução ruim do Codex costuma ser abrir a thread nativa do Codex
diretamente:

```sh
codex resume <thread-id>
```

Use isso quando notar um bug em uma conversa de canal e quiser inspecionar a
sessão problemática do Codex, continuá-la localmente ou perguntar ao Codex por que ele fez uma
escolha específica de ferramenta ou raciocínio. O caminho mais fácil geralmente é executar
`/diagnostics [note]` primeiro: depois que você o aprova, o relatório concluído lista
cada thread do Codex e imprime um comando `Inspect locally`, por exemplo
`codex resume <thread-id>`. Você pode copiar esse comando diretamente para um terminal.

Você também pode obter um id de thread em `/codex binding` para o chat atual ou
`/codex threads [filter]` para threads recentes do servidor de aplicativo do Codex e, em seguida, executar o mesmo
comando `codex resume` no seu shell.

A superfície de comandos exige o servidor de aplicativo do Codex `0.125.0` ou mais recente. Métodos
individuais de controle são relatados como `unsupported by this Codex app-server` se um
servidor de aplicativo futuro ou personalizado não expuser esse método JSON-RPC.

## Limites de hooks

O harness do Codex tem três camadas de hook:

| Camada                                | Proprietário              | Finalidade                                                          |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de plugins do OpenClaw          | OpenClaw                  | Compatibilidade de produto/plugin entre harnesses de PI e Codex.    |
| Middleware de extensão do servidor de aplicativo do Codex | Plugins incluídos do OpenClaw | Comportamento de adaptador por turno em torno das ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                     | Ciclo de vida de baixo nível do Codex e política de ferramentas nativas pela configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` globais ou de projeto do Codex para rotear
comportamento de plugins do OpenClaw. Para a ponte compatível de ferramentas nativas e permissões,
o OpenClaw injeta configuração do Codex por thread para `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Outros hooks do Codex, como `SessionStart` e
`UserPromptSubmit`, continuam sendo controles em nível do Codex; eles não são expostos como
hooks de plugins do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita a
chamada, então o OpenClaw aciona o comportamento de plugin e middleware que ele possui no
adaptador de harness. Para ferramentas nativas do Codex, o Codex possui o registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação pelo servidor de aplicativo ou por callbacks de hook nativo.

Projeções de Compaction e ciclo de vida de LLM vêm de notificações do servidor de aplicativo do Codex
e do estado do adaptador do OpenClaw, não de comandos de hook nativos do Codex.
Os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações em nível de adaptador, não capturas byte a byte
da solicitação interna ou dos payloads de Compaction do Codex.

As notificações `hook/started` e `hook/completed` nativas do Codex no servidor de aplicativo são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de plugins do OpenClaw.

## Contrato de suporte V1

O modo Codex não é PI com uma chamada de modelo diferente por baixo. O Codex possui mais do
loop de modelo nativo, e o OpenClaw adapta suas superfícies de plugin e sessão
em torno desse limite.

Compatível no runtime Codex v1:

| Superfície                                    | Suporte                                 | Por quê                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo da OpenAI pelo Codex           | Compatível                              | O servidor de aplicativo do Codex possui o turno da OpenAI, a retomada de thread nativa e a continuação de ferramentas nativas.                                                                       |
| Roteamento e entrega de canais do OpenClaw    | Compatível                              | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais ficam fora do runtime do modelo.                                                                                                        |
| Ferramentas dinâmicas do OpenClaw             | Compatível                              | O Codex pede ao OpenClaw para executar essas ferramentas, então o OpenClaw permanece no caminho de execução.                                                                                         |
| Plugins de prompt e contexto                  | Compatível                              | O OpenClaw constrói sobreposições de prompt e projeta contexto no turno do Codex antes de iniciar ou retomar a thread.                                                                               |
| Ciclo de vida do motor de contexto            | Compatível                              | Montagem, ingestão ou manutenção pós-turno e coordenação de Compaction do motor de contexto são executadas para turnos do Codex.                                                                     |
| Hooks de ferramentas dinâmicas                | Compatível                              | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta são executados em torno de ferramentas dinâmicas pertencentes ao OpenClaw.                                             |
| Hooks de ciclo de vida                        | Compatíveis como observações do adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex.                                                                       |
| Gate de revisão de resposta final             | Compatível por meio do relay de hook nativo | `Stop` do Codex é repassado para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem de modelo antes da finalização.                                                                   |
| Bloqueio ou observação de shell, patch e MCP nativos | Compatível por meio do relay de hook nativo | `PreToolUse` e `PostToolUse` do Codex são repassados para superfícies de ferramentas nativas confirmadas, incluindo payloads MCP no servidor de aplicativo do Codex `0.125.0` ou mais recente. Bloqueio é compatível; reescrita de argumentos não é. |
| Política de permissões nativa                 | Compatível por meio do relay de hook nativo | `PermissionRequest` do Codex pode ser roteado pela política do OpenClaw onde o runtime a expõe. Se o OpenClaw não retornar decisão, o Codex continua pelo caminho normal de guardião ou aprovação do usuário. |
| Captura de trajetória do servidor de aplicativo | Compatível                            | O OpenClaw registra a solicitação que enviou ao servidor de aplicativo e as notificações do servidor de aplicativo que recebe.                                                                        |

Não compatível no runtime Codex v1:

| Superfície                                          | Limite da V1                                                                                                                                    | Caminho futuro                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutação de argumentos de ferramenta nativa          | Hooks nativos pré-ferramenta do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.                 | Requer suporte de hook/esquema do Codex para substituir a entrada da ferramenta.          |
| Histórico editável de transcrição nativa do Codex   | O Codex é dono do histórico canônico da thread nativa. O OpenClaw possui um espelho e pode projetar contexto futuro, mas não deve mutar internos sem suporte. | Adicionar APIs explícitas do app-server do Codex se for necessária cirurgia na thread nativa. |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma gravações de transcrição pertencentes ao OpenClaw, não registros de ferramentas nativas do Codex.                          | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex. |
| Metadados ricos de Compaction nativa                | O OpenClaw observa o início e a conclusão da Compaction, mas não recebe uma lista estável de itens mantidos/removidos, delta de tokens ou payload de resumo. | Precisa de eventos de Compaction mais ricos do Codex.                                     |
| Intervenção de Compaction                           | Os hooks atuais de Compaction do OpenClaw ficam no nível de notificação no modo Codex.                                                           | Adicionar hooks pré/pós-Compaction do Codex se os plugins precisarem vetar ou reescrever a Compaction nativa. |
| Captura byte a byte de solicitação à API do modelo  | O OpenClaw pode capturar solicitações e notificações do app-server, mas o núcleo do Codex constrói internamente a solicitação final à API da OpenAI. | Precisa de um evento de rastreamento de solicitação de modelo do Codex ou de uma API de depuração. |

## Ferramentas, mídia e Compaction

O harness do Codex altera apenas o executor de agente incorporado de baixo nível.

O OpenClaw ainda monta a lista de ferramentas e recebe resultados de ferramentas dinâmicas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramentas de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

O relay de hooks nativos é intencionalmente genérico, mas o contrato de suporte da v1 é
limitado aos caminhos de ferramentas e permissões nativos do Codex que o OpenClaw testa. No
runtime do Codex, isso inclui payloads de shell, patch e MCP `PreToolUse`,
`PostToolUse` e `PermissionRequest`. Não presuma que todo evento de hook futuro do
Codex seja uma superfície de Plugin do OpenClaw até que o contrato do runtime o nomeie.

Para `PermissionRequest`, o OpenClaw retorna apenas decisões explícitas de permitir ou negar
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como
ausência de decisão de hook e segue para seu próprio caminho de guardião ou aprovação do usuário.

Solicitações de aprovação de ferramentas MCP do Codex são roteadas pelo fluxo de aprovação de
Plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao chat
de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação do
servidor nativo em vez de ser direcionada como contexto extra. Outras solicitações de elicitação
MCP ainda falham de forma fechada.

O direcionamento da fila de execução ativa é mapeado para `turn/steer` do app-server do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa mensagens de chat enfileiradas
pela janela de silêncio configurada e as envia como uma solicitação `turn/steer` em
ordem de chegada. O modo legado `queue` envia solicitações `turn/steer` separadas. Turnos de
revisão e Compaction manual do Codex podem rejeitar direcionamento no mesmo turno, caso em que
o OpenClaw usa a fila de acompanhamento quando o modo selecionado permite fallback. Veja
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

Quando o modelo selecionado usa o harness do Codex, a Compaction da thread nativa é
delegada ao app-server do Codex. O OpenClaw mantém um espelho de transcrição para histórico
do canal, busca, `/new`, `/reset` e futura troca de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de raciocínio
ou plano do Codex quando o app-server os emite. Hoje, o OpenClaw registra apenas
sinais de início e conclusão da Compaction nativa. Ele ainda não expõe um resumo de
Compaction legível por humanos nem uma lista auditável de quais entradas o Codex
manteve após a Compaction.

Como o Codex é dono da thread nativa canônica, `tool_result_persist` atualmente não
reescreve registros de resultados de ferramentas nativas do Codex. Ele só se aplica quando
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

**O OpenClaw usa PI em vez de Codex:** `agentRuntime.id: "auto"` ainda pode usar PI como o
backend de compatibilidade quando nenhum harness do Codex reivindica a execução. Defina
`agentRuntime.id: "codex"` para forçar a seleção do Codex durante testes. Um
runtime Codex forçado falha em vez de fazer fallback para PI. Depois que o app-server do Codex
é selecionado, suas falhas aparecem diretamente.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
reporte a versão `0.125.0` ou mais recente. Pré-lançamentos da mesma versão ou versões
com sufixo de build, como `0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o
piso estável de protocolo `0.125.0` é o que o OpenClaw testa.

**A descoberta de modelos está lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desabilite a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão do protocolo de app-server do Codex.

**Um modelo que não é Codex usa PI:** isso é esperado, a menos que você tenha forçado
`agentRuntime.id: "codex"` para esse agente ou selecionado uma referência legada
`codex/*`. Referências simples `openai/gpt-*` e de outros provedores permanecem no caminho
normal do provedor no modo `auto`. Se você forçar `agentRuntime.id: "codex"`, todo turno incorporado
desse agente deve ser um modelo OpenAI compatível com Codex.

**O Computer Use está instalado, mas as ferramentas não executam:** verifique
`/codex computer-use status` em uma sessão nova. Se uma ferramenta reportar
`Native hook relay unavailable`, use `/new` ou `/reset`; se persistir, reinicie
o gateway para limpar registros obsoletos de hooks nativos. Se `computer-use.list_apps`
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
