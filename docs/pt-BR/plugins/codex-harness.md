---
read_when:
    - Você quer usar o harness de servidor de app do Codex incluído
    - Você precisa de exemplos de configuração do harness do Codex
    - Você quer que implantações somente com Codex falhem em vez de recorrerem ao OpenClaw
summary: Execute turnos de agente incorporado do OpenClaw pelo harness app-server Codex incluído
title: Harness do Codex
x-i18n:
    generated_at: "2026-07-04T10:31:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

O Plugin `codex` incluído permite que o OpenClaw execute turnos de agente OpenAI incorporados
por meio do Codex app-server em vez do harness integrado do OpenClaw.

Use o harness Codex quando quiser que o Codex controle a sessão de agente de baixo nível:
retomada nativa de thread, continuação nativa de ferramentas, Compaction nativa e
execução pelo app-server. O OpenClaw ainda controla canais de chat, arquivos de sessão, seleção de modelo,
ferramentas dinâmicas do OpenClaw, aprovações, entrega de mídia e o espelho visível
da transcrição.

A configuração normal usa referências canônicas de modelos OpenAI, como `openai/gpt-5.5`.
Não configure referências GPT Codex legadas. Coloque a ordem de autenticação do agente OpenAI
em `auth.order.openai`; ids de perfis de autenticação Codex legados mais antigos e
entradas legadas de ordem de autenticação Codex são estado legado reparado por
`openclaw doctor --fix`.

Quando nenhum sandbox OpenClaw está ativo, o OpenClaw inicia threads do Codex app-server
com o modo de código nativo do Codex habilitado, mantendo o modo somente código desativado por padrão.
Isso mantém o workspace nativo e os recursos de código do Codex disponíveis enquanto
as ferramentas dinâmicas do OpenClaw continuam pela ponte `item/tool/call` do app-server.
Sandboxing ativo do OpenClaw e políticas restritas de ferramentas desabilitam totalmente o modo de código nativo,
a menos que você opte pelo caminho experimental do sandbox exec-server.

Este recurso nativo do Codex é separado do
[modo de código do OpenClaw](/pt-BR/reference/code-mode), que é um runtime QuickJS-WASI opcional
para execuções genéricas do OpenClaw com um formato de entrada `exec` diferente.

Para a divisão mais ampla entre modelo/provedor/runtime, comece por
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a referência do modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## Requisitos

- OpenClaw com o Plugin `codex` incluído disponível.
- Se sua configuração usa `plugins.allow`, inclua `codex`.
- Codex app-server `0.125.0` ou mais recente. O Plugin incluído gerencia um binário
  Codex app-server compatível por padrão, então comandos locais `codex` em `PATH` não
  afetam a inicialização normal do harness.
- Autenticação Codex disponível por meio de `openclaw models auth login --provider openai`,
  uma conta app-server no diretório inicial Codex do agente ou um perfil explícito de autenticação Codex
  por chave de API.

Para precedência de autenticação, isolamento de ambiente, comandos personalizados de app-server, descoberta de modelos
e todos os campos de configuração, consulte
[Referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Início rápido

A maioria dos usuários que quer Codex no OpenClaw quer este caminho: entrar com uma
assinatura ChatGPT/Codex, habilitar o Plugin `codex` incluído e usar uma
referência canônica de modelo `openai/gpt-*`.

Entre com OAuth do Codex:

```bash
openclaw models auth login --provider openai
```

Habilite o Plugin `codex` incluído e selecione um modelo de agente OpenAI:

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
    },
  },
}
```

Se sua configuração usa `plugins.allow`, adicione `codex` ali também:

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

Reinicie o Gateway após alterar a configuração de Plugins. Se um chat existente já
tem uma sessão, use `/new` ou `/reset` antes de testar mudanças de runtime para que o próximo
turno resolva o harness a partir da configuração atual.

## Compartilhar threads com Codex Desktop e CLI

O padrão `appServer.homeScope: "agent"` mantém cada agente OpenClaw isolado
do estado nativo do Codex do operador. Para permitir que um proprietário peça ao OpenClaw para inspecionar
e gerenciar as mesmas threads nativas mostradas pelo Codex Desktop e pela CLI Codex,
opte pelo diretório inicial Codex do usuário:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

O modo de diretório inicial do usuário está disponível somente com transporte stdio local. Ele usa
`$CODEX_HOME` quando definido e `~/.codex` caso contrário, incluindo autenticação Codex nativa,
configuração, Plugins e armazenamento de threads desse diretório inicial. O OpenClaw não injeta um
perfil de autenticação OpenClaw nesse app-server.

Turnos do proprietário ganham a ferramenta `codex_threads`. Ela pode listar, pesquisar, ler, bifurcar,
renomear, arquivar e restaurar threads nativas. Peça ao agente para bifurcar uma thread quando
quiser continuá-la no OpenClaw; a bifurcação é anexada à sessão atual do
OpenClaw e permanece visível para outros clientes Codex nativos. Arquivar
exige confirmação explícita de que a thread está fechada em outro lugar.

Não retome nem grave a mesma thread simultaneamente a partir do OpenClaw e de outro
cliente Codex. O Codex coordena autores ativos dentro de um processo app-server, não
entre processos independentes do Desktop, da CLI e do OpenClaw. Bifurcar cria uma
continuação separada e é o caminho seguro de coexistência.

## Configuração

A configuração de início rápido é a configuração mínima viável do harness Codex. Defina as opções do
harness Codex na configuração do OpenClaw e use a CLI somente para autenticação Codex:

| Necessidade                            | Definir                                                                          | Onde                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar o harness                    | `plugins.entries.codex.enabled: true`                                            | Configuração do OpenClaw           |
| Manter uma instalação de Plugin permitida | Inclua `codex` em `plugins.allow`                                                | Configuração do OpenClaw           |
| Rotear turnos de agente OpenAI pelo Codex | `agents.defaults.model` ou `agents.list[].model` como `openai/gpt-*`             | Configuração de agente OpenClaw    |
| Entrar com OAuth ChatGPT/Codex         | `openclaw models auth login --provider openai`                                   | Perfil de autenticação da CLI      |
| Adicionar backup por chave de API para execuções Codex | Perfil de chave de API `openai:*` listado após autenticação por assinatura em `auth.order.openai` | Perfil de autenticação da CLI + configuração do OpenClaw |
| Falhar fechado quando o Codex estiver indisponível | Provedor ou modelo `agentRuntime.id: "codex"`                                    | Configuração de modelo/provedor do OpenClaw |
| Usar tráfego direto da API OpenAI      | Provedor ou modelo `agentRuntime.id: "openclaw"` com autenticação OpenAI normal  | Configuração de modelo/provedor do OpenClaw |
| Ajustar comportamento do app-server    | `plugins.entries.codex.config.appServer.*`                                       | Configuração do Plugin Codex       |
| Habilitar apps de Plugin nativos do Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Configuração do Plugin Codex       |
| Habilitar Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configuração do Plugin Codex       |

Use referências de modelo `openai/gpt-*` para turnos de agente OpenAI com suporte do Codex. Prefira
`auth.order.openai` para ordenação assinatura primeiro/backup por chave de API. Ids existentes
de perfis de autenticação Codex legados e ordem de autenticação Codex legada são estado legado
somente para doctor; não grave novas referências GPT Codex legadas.

Não defina `compaction.model` ou `compaction.provider` em agentes com suporte do Codex.
O Codex compacta por meio do estado nativo de thread do app-server, então o OpenClaw ignora
essas substituições locais do resumidor em runtime e `openclaw doctor --fix` as remove
quando o agente usa Codex.

Lossless continua compatível como motor de contexto para montagem, ingestão e
manutenção em torno de turnos Codex. Configure-o por meio de
`plugins.slots.contextEngine: "lossless-claw"` e
`plugins.entries.lossless-claw.config.summaryModel`, não por meio de
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra o formato antigo
`compaction.provider: "lossless-claw"` para o slot de motor de contexto Lossless
quando Codex é o runtime ativo, mas o Codex nativo ainda controla Compaction.

O harness nativo do Codex app-server é compatível com motores de contexto que exigem
montagem pré-prompt. Backends genéricos de CLI, incluindo `codex-cli`, não fornecem
essa capacidade de host.

Para agentes com suporte do Codex, `/compact` inicia a Compaction nativa do Codex app-server na
thread vinculada. O OpenClaw não espera a conclusão, não impõe um timeout do OpenClaw,
não reinicia o app-server compartilhado nem recorre a um motor de contexto ou
resumidor público OpenAI. Se a vinculação da thread nativa do Codex estiver ausente ou
obsoleta, o comando falha fechado para que o operador veja o limite real do runtime
em vez de alternar silenciosamente backends de Compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Nesse formato, ambos os perfis ainda passam pelo Codex para turnos de agente
`openai/gpt-*`. A chave de API é apenas um fallback de autenticação, não uma solicitação para mudar para OpenClaw ou
OpenAI Responses simples.

O restante desta página cobre variantes comuns que os usuários precisam escolher:
formato de implantação, roteamento fail-closed, política de aprovação guardian, Plugins Codex
nativos e Computer Use. Para listas completas de opções, padrões, enums, descoberta,
isolamento de ambiente, timeouts e campos de transporte do app-server, consulte
[Referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Verificar runtime Codex

Use `/status` no chat em que você espera Codex. Um turno de agente OpenAI com suporte do Codex
mostra:

```text
Runtime: OpenAI Codex
```

Em seguida, verifique o estado do Codex app-server:

```text
/codex status
/codex models
```

`/codex status` informa conectividade do app-server, conta, limites de taxa, servidores MCP
e Skills. `/codex models` lista o catálogo ativo do Codex app-server para
o harness e a conta. Se `/status` for surpreendente, consulte
[Solução de problemas](#troubleshooting).

## Roteamento e seleção de modelo

Mantenha referências de provedor e política de runtime separadas:

- Use `openai/gpt-*` para turnos de agente OpenAI pelo Codex.
- Não use referências GPT Codex legadas na configuração. Execute `openclaw doctor --fix` para
  reparar referências legadas e pins obsoletos de rota de sessão.
- `agentRuntime.id: "codex"` é opcional no modo automático normal da OpenAI, mas útil
  quando uma implantação deve falhar fechado se o Codex estiver indisponível.
- `agentRuntime.id: "openclaw"` opta um provedor ou modelo pelo runtime incorporado do OpenClaw
  quando isso é intencional.
- `/codex ...` controla conversas nativas do Codex app-server a partir do chat.
- ACP/acpx é um caminho separado de harness externo. Use-o somente quando o usuário pedir
  ACP/acpx ou um adaptador de harness externo.

Roteamento comum de comandos:

| Intenção do usuário                                  | Uso                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Anexar o chat atual                                  | `/codex bind [--cwd <path>]`                                                                          |
| Retomar uma thread existente do Codex                | `/codex resume <thread-id>`                                                                           |
| Listar ou filtrar threads do Codex                   | `/codex threads [filter]`                                                                             |
| Listar plugins nativos do Codex                      | `/codex plugins list`                                                                                 |
| Habilitar ou desabilitar um plugin nativo configurado do Codex | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Anexar uma sessão existente da CLI do Codex em um nó pareado | `/codex sessions --host <node> [filter]`, depois `/codex resume <session-id> --host <node> --bind here` |
| Enviar apenas feedback do Codex                      | `/codex diagnostics [note]`                                                                           |
| Iniciar uma tarefa ACP/acpx                          | Comandos de sessão ACP/acpx, não `/codex`                                                             |

| Caso de uso                                          | Configurar                                                             | Verificar                               | Observações                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Assinatura ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-*` mais plugin `codex` habilitado                          | `/status` mostra `Runtime: OpenAI Codex` | Caminho recomendado                   |
| Falhar de forma fechada se o Codex estiver indisponível | Provedor ou modelo `agentRuntime.id: "codex"`                          | A rodada falha em vez de usar fallback incorporado | Use para implantações somente com Codex |
| Tráfego direto de chave de API da OpenAI pelo OpenClaw | Provedor ou modelo `agentRuntime.id: "openclaw"` e autenticação normal da OpenAI | `/status` mostra runtime do OpenClaw    | Use apenas quando o OpenClaw for intencional |
| Configuração legada                                  | refs GPT legadas do Codex                                              | `openclaw doctor --fix` a reescreve     | Não escreva nova configuração assim   |
| Adaptador ACP/acpx do Codex                          | ACP `sessions_spawn({ runtime: "acp" })`                               | Status de tarefa/sessão ACP             | Separado do harness nativo do Codex   |

`agents.defaults.imageModel` segue a mesma divisão por prefixo. Use `openai/gpt-*`
para a rota normal da OpenAI e `codex/gpt-*` somente quando o entendimento de
imagem deve passar por uma rodada limitada do app-server do Codex. Não use
refs GPT legadas do Codex; o doctor reescreve esse prefixo legado para
`openai/gpt-*`.

## Padrões de implantação

### Implantação básica do Codex

Use a configuração do início rápido quando todas as rodadas de agente da OpenAI
devem usar Codex por padrão.

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
    },
  },
}
```

### Implantação com provedores mistos

Este formato mantém Claude como agente padrão e adiciona um agente Codex nomeado:

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

Com essa configuração, o agente `main` usa seu caminho normal de provedor e o
agente `codex` usa o app-server do Codex.

### Implantação do Codex com falha fechada

Para rodadas de agente da OpenAI, `openai/gpt-*` já resolve para Codex quando o
plugin incluído está disponível. Adicione uma política explícita de runtime
quando quiser uma regra escrita de falha fechada:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Com o Codex forçado, o OpenClaw falha cedo se o plugin Codex estiver desabilitado,
se o app-server for antigo demais ou se o app-server não puder iniciar.

## Política do app-server

Por padrão, o plugin inicia localmente o binário Codex gerenciado pelo OpenClaw
com transporte stdio. Defina `appServer.command` somente quando você
intencionalmente quiser executar um executável diferente. Use transporte
WebSocket somente quando um app-server já estiver em execução em outro lugar:

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Sessões locais do app-server stdio usam por padrão a postura confiável de
operador local: `approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se os requisitos locais do Codex não permitirem
essa postura YOLO implícita, o OpenClaw seleciona permissões guardian permitidas
em vez disso. Quando um sandbox do OpenClaw está ativo para a sessão, o OpenClaw
desabilita o Code Mode nativo do Codex, servidores MCP do usuário e execução de
plugins apoiada por apps para essa rodada, em vez de depender do sandboxing no
host do Codex. O acesso ao shell é exposto por ferramentas dinâmicas apoiadas
pelo sandbox do OpenClaw, como `sandbox_exec` e `sandbox_process`, quando as
ferramentas normais de exec/process estão disponíveis.

Use o modo exec normalizado do OpenClaw quando quiser revisão automática nativa
do Codex antes de escapes de sandbox ou permissões extras:

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

Para sessões do app-server do Codex, o OpenClaw mapeia `tools.exec.mode: "auto"`
para aprovações revisadas pelo Codex Guardian, geralmente
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando os requisitos locais permitem esses valores.
Em `tools.exec.mode: "auto"`, o OpenClaw não preserva substituições legadas
inseguras do Codex para `approvalPolicy: "never"` ou
`sandbox: "danger-full-access"`; use `tools.exec.mode: "full"` para uma postura
Codex intencional sem aprovação. O preset legado
`plugins.entries.codex.config.appServer.mode: "guardian"` ainda funciona, mas
`tools.exec.mode: "auto"` é a superfície normalizada do OpenClaw.

Para a comparação no nível de modo com aprovações de exec do host e permissões
ACPX, consulte [Modos de permissão](/pt-BR/tools/permission-modes).

Para todos os campos do app-server, ordem de autenticação, isolamento de
ambiente, descoberta e comportamento de timeout, consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Comandos e diagnósticos

O plugin incluído registra `/codex` como comando de barra em qualquer canal que
ofereça suporte a comandos de texto do OpenClaw.

Execução e controle nativos exigem um proprietário ou um cliente Gateway
`operator.admin`. Isso inclui vincular ou retomar threads, enviar ou interromper
rodadas, alterar modelo, modo rápido ou estado de permissão, compactar ou
revisar, e desvincular uma associação. Outros remetentes autorizados mantêm
comandos somente leitura de status, ajuda, conta, modelo, thread, servidor MCP,
Skill e inspeção de associação.

Formas comuns:

- `/codex status` verifica conectividade com o app-server, modelos, conta,
  limites de taxa, servidores MCP e skills.
- `/codex models` lista modelos ativos do app-server do Codex.
- `/codex threads [filter]` lista threads recentes do app-server do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma thread
  existente do Codex.
- `/codex compact` pede ao app-server do Codex para compactar a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pergunta antes de enviar feedback do Codex para a
  thread anexada.
- `/codex account` mostra status de conta e de limite de taxa.
- `/codex mcp` lista o status de servidores MCP do app-server do Codex.
- `/codex skills` lista skills do app-server do Codex.

Para a maioria dos relatórios de suporte, comece com `/diagnostics [note]` na
conversa em que o bug ocorreu. Ele cria um relatório de diagnósticos do Gateway
e, para sessões do harness do Codex, pede aprovação para enviar o pacote de
feedback relevante do Codex. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
para o modelo de privacidade e o comportamento em chats em grupo.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o
upload de feedback do Codex para a thread atualmente anexada sem o pacote
completo de diagnósticos do Gateway.

### Inspecionar threads do Codex localmente

A forma mais rápida de inspecionar uma execução problemática do Codex muitas
vezes é abrir a thread nativa do Codex diretamente:

```bash
codex resume <thread-id>
```

Obtenha o id da thread pela resposta concluída de `/diagnostics`, por
`/codex binding` ou por `/codex threads [filter]`.

Para mecânica de upload e limites de diagnósticos no nível do runtime, consulte
[Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime#codex-feedback-upload).

Na home padrão por agente, a autenticação é selecionada nesta ordem:

1. Perfis de autenticação OpenAI ordenados para o agente, preferencialmente em
   `auth.order.openai`. Execute `openclaw doctor --fix` para migrar ids de
   perfis de autenticação legados do Codex e a ordem legada de autenticação do
   Codex.
2. A conta existente do app-server na home do Codex desse agente.
3. Somente para inicializações locais do app-server stdio, `CODEX_API_KEY`,
   depois `OPENAI_API_KEY`, quando nenhuma conta de app-server está presente e a
   autenticação OpenAI ainda é necessária.

Quando o OpenClaw encontra um perfil de autenticação do Codex no estilo de
assinatura do ChatGPT, ele remove `CODEX_API_KEY` e `OPENAI_API_KEY` do processo
filho do Codex gerado. Isso mantém as chaves de API no nível do Gateway
disponíveis para embeddings ou modelos diretos da OpenAI sem fazer rodadas
nativas do app-server do Codex serem cobradas pela API por acidente. Perfis
explícitos de chave de API do Codex e fallback de chave de env em stdio local
usam login do app-server em vez de env herdado do processo filho. Conexões
WebSocket com app-server não recebem fallback de chave de API em env do Gateway;
use um perfil de autenticação explícito ou a própria conta do app-server remoto.
Quando plugins nativos do Codex estão configurados, o OpenClaw instala ou
atualiza esses plugins pelo app-server conectado antes de expor apps de
propriedade do plugin à thread do Codex. `app/list` continua sendo a fonte da
verdade para ids de apps, acessibilidade e metadados, mas o OpenClaw possui a
decisão de habilitação por thread: se a política permitir um app acessível
listado, o OpenClaw envia `thread/start.config.apps[appId].enabled = true` mesmo
quando `app/list` atualmente informa esse app como desabilitado. Esse caminho
não inventa instalação de apps para ids desconhecidos; o OpenClaw só ativa
plugins do marketplace com `plugin/install` e depois atualiza o inventário.

Se um perfil de assinatura atingir um limite de uso do Codex, o OpenClaw registra
o horário de redefinição quando o Codex informa um e tenta o próximo perfil de
autenticação ordenado para a mesma execução do Codex. Quando o horário de
redefinição passa, o perfil de assinatura volta a ser elegível sem alterar o
modelo `openai/gpt-*` selecionado nem o runtime do Codex.

Para inicializações locais de servidor de app via stdio, o OpenClaw define `CODEX_HOME` como um diretório por agente para que a configuração do Codex, arquivos de autenticação/conta, cache/dados de Plugin e estado nativo de threads não leiam nem gravem no `~/.codex` pessoal do operador por padrão. O OpenClaw preserva o `HOME` normal do processo; subprocessos executados pelo Codex ainda conseguem encontrar configuração e tokens no diretório inicial do usuário, e o Codex pode descobrir entradas compartilhadas em `$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`. Com `appServer.homeScope: "user"`, o OpenClaw usa, em vez disso, o diretório inicial nativo do Codex do usuário e sua conta existente sem injetar um perfil de autenticação do OpenClaw.

Se uma implantação precisar de isolamento adicional de ambiente, adicione essas variáveis a `appServer.clearEnv`:

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

`appServer.clearEnv` afeta apenas o processo filho do servidor de app do Codex gerado. O OpenClaw remove `CODEX_HOME` e `HOME` dessa lista durante a normalização da inicialização local: `CODEX_HOME` permanece apontando para o escopo de agente ou usuário selecionado, e `HOME` permanece herdado para que subprocessos possam usar o estado normal do diretório inicial do usuário.

As ferramentas dinâmicas do Codex usam carregamento `searchable` por padrão. O OpenClaw não expõe ferramentas dinâmicas que duplicam operações nativas de workspace do Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` e `update_plan`. A maioria das ferramentas restantes de integração do OpenClaw, como mensagens, mídia, Cron, navegador, nós, Gateway e `heartbeat_respond`, fica disponível por meio da busca de ferramentas do Codex no namespace `openclaw`, mantendo menor o contexto inicial do modelo. A busca na Web usa a ferramenta hospedada `web_search` do Codex por padrão quando a busca está habilitada e nenhum provedor gerenciado foi selecionado. A busca hospedada nativa e a ferramenta dinâmica gerenciada `web_search` do OpenClaw são mutuamente exclusivas, para que a busca gerenciada não possa contornar restrições nativas de domínio. O OpenClaw usa a ferramenta gerenciada quando a busca hospedada está indisponível, explicitamente desabilitada ou substituída por um provedor gerenciado selecionado. O OpenClaw mantém a extensão autônoma `web.run` do Codex desabilitada porque o tráfego de servidor de app em produção rejeita seu namespace `web` definido pelo usuário. `tools.web.search.enabled: false` desabilita ambos os caminhos, assim como execuções somente LLM com ferramentas desabilitadas. O Codex trata `"cached"` como uma preferência e a resolve para acesso externo ao vivo em turnos irrestritos de servidor de app. O fallback gerenciado automático falha fechado quando `allowedDomains` nativos estão definidos, para que a allowlist não possa ser contornada. Alterações persistentes na política efetiva de busca rotacionam a thread do Codex vinculada antes do próximo turno. Restrições transitórias por turno usam uma thread restrita temporária e preservam o vínculo existente para retomada posterior. `sessions_yield` e respostas de origem somente por ferramenta de mensagem permanecem diretas porque esses são contratos de controle de turno. `sessions_spawn` permanece pesquisável para que o `spawn_agent` nativo do Codex continue sendo a superfície principal de subagente do Codex, enquanto a delegação explícita por OpenClaw ou ACP ainda fica disponível pelo namespace de ferramentas dinâmicas `openclaw`. As instruções de colaboração de Heartbeat dizem ao Codex para buscar `heartbeat_respond` antes de encerrar um turno de Heartbeat quando a ferramenta ainda não estiver carregada.

Defina `codexDynamicToolsLoading: "direct"` somente ao se conectar a um servidor de app Codex personalizado que não consegue buscar ferramentas dinâmicas adiadas ou ao depurar o payload completo de ferramentas.

Campos de Plugin Codex de nível superior compatíveis:

| Campo                      | Padrão        | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Use `"direct"` para colocar ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir de turnos do servidor de app do Codex.              |
| `codexPlugins`             | desabilitado       | Suporte nativo do Codex a plugins/apps para plugins curados migrados instalados a partir do código-fonte.           |

Campos `appServer` compatíveis:

| Campo                                         | Padrão                                                | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isola o estado do Codex por agente OpenClaw. `"user"` compartilha o `$CODEX_HOME` nativo ou `~/.codex`, usa autenticação nativa e habilita gerenciamento de threads apenas pelo proprietário. O escopo de usuário exige stdio.                                                                                                                                                                                               |
| `command`                                     | binário gerenciado do Codex                                   | Executável para transporte stdio. Deixe indefinido para usar o binário gerenciado; defina apenas para uma substituição explícita.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | indefinido                                                  | URL do app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | indefinido                                                  | Token Bearer para transporte WebSocket. Aceita uma string literal ou SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Cabeçalhos WebSocket extras. Os valores de cabeçalho aceitam strings literais ou valores SecretInput, por exemplo `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nomes de variáveis de ambiente extras removidos do processo app-server stdio iniciado depois que o OpenClaw cria seu ambiente herdado. O OpenClaw mantém o `CODEX_HOME` selecionado e o `HOME` herdado para inicializações locais.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Ative a superfície de ferramentas somente em modo de código do Codex. As ferramentas dinâmicas do OpenClaw permanecem registradas no Codex para que chamadas `tools.*` aninhadas retornem pela ponte `item/tool/call` do app-server.                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | indefinido                                                  | Raiz remota do workspace do app-server do Codex. Quando definida, o OpenClaw infere a raiz local do workspace a partir do workspace OpenClaw resolvido, preserva o sufixo do cwd atual sob essa raiz remota e envia ao Codex apenas o cwd final do app-server. Se o cwd estiver fora da raiz do workspace OpenClaw resolvida, o OpenClaw falha de modo fechado em vez de enviar um caminho local do Gateway ao app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Janela de silêncio depois que o Codex aceita um turno ou após uma solicitação do app-server com escopo de turno enquanto o OpenClaw aguarda `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guarda de inatividade de conclusão e progresso usada após uma transferência de ferramenta, conclusão de ferramenta nativa, progresso bruto do assistente pós-ferramenta, conclusão de raciocínio bruto ou progresso de raciocínio enquanto o OpenClaw aguarda `turn/completed`. Use isto para cargas de trabalho confiáveis ou pesadas em que a síntese pós-ferramenta pode legitimamente permanecer em silêncio por mais tempo que o orçamento final de liberação do assistente.                                |
| `mode`                                        | `"yolo"` salvo quando requisitos locais do Codex impedem YOLO | Predefinição para execução YOLO ou revisada por guardião. Requisitos locais de stdio que omitem `danger-full-access`, aprovação `never` ou o revisor `user` tornam o padrão implícito guardião.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` ou uma política de aprovação de guardião permitida       | Política de aprovação nativa do Codex enviada ao iniciar/retomar thread/turno. Os padrões do guardião preferem `"on-request"` quando permitido.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` ou um sandbox de guardião permitido  | Modo de sandbox nativo do Codex enviado ao iniciar/retomar thread. Os padrões do guardião preferem `"workspace-write"` quando permitido; caso contrário, `"read-only"`. Quando um sandbox OpenClaw está ativo, turnos `danger-full-access` usam `workspace-write` do Codex com acesso de rede derivado da configuração de saída do sandbox OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` ou um revisor de guardião permitido               | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos quando permitido; caso contrário, `guardian_subagent` ou `user`. `guardian_subagent` permanece um alias legado.                                                                                                                                                                                                                              |
| `serviceTier`                                 | indefinido                                                  | Camada de serviço opcional do app-server do Codex. `"priority"` habilita roteamento em modo rápido, `"flex"` solicita processamento flex, `null` limpa a substituição e o legado `"fast"` é aceito como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | desabilitado                                               | Ative a rede de perfil de permissões do Codex para comandos do app-server. O OpenClaw define a configuração `permissions.<profile>.network` selecionada e a escolhe com `default_permissions` em vez de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Ativação prévia que registra um ambiente Codex respaldado pelo sandbox OpenClaw com o app-server Codex 0.132.0 ou mais recente, para que a execução nativa do Codex possa rodar dentro do sandbox OpenClaw ativo.                                                                                                                                                                                                         |

`appServer.networkProxy` é explícito porque altera o contrato de sandbox do Codex.
Quando habilitado, o OpenClaw também define `features.network_proxy.enabled` e
`default_permissions` na configuração da thread do Codex para que o perfil de
permissão gerado possa iniciar a rede gerenciada pelo Codex. Por padrão, o OpenClaw
gera um nome de perfil `openclaw-network-<fingerprint>` resistente a colisões a
partir do corpo do perfil; use `profileName` apenas quando um nome local estável
for necessário.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Se o runtime normal do servidor de app seria `danger-full-access`, habilitar
`networkProxy` usa acesso ao sistema de arquivos no estilo workspace para o
perfil de permissões gerado. A aplicação de rede gerenciada pelo Codex é rede em sandbox,
portanto um perfil de acesso total não protegeria o tráfego de saída.
Entradas de domínio usam `allow` ou `deny`; entradas de socket Unix usam os
valores `allow` ou `none` do Codex.

Chamadas de ferramentas dinâmicas de propriedade do OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`: requisições Codex `item/tool/call` usam um watchdog
do OpenClaw de 90 segundos por padrão. Um argumento `timeoutMs` positivo por chamada estende
ou encurta esse orçamento específico da ferramenta. A ferramenta `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` quando a chamada de ferramenta não
fornece seu próprio timeout, ou um padrão de 120 segundos para geração de imagens caso contrário.
A ferramenta de compreensão de mídia `image` usa
`tools.media.image.timeoutSeconds` ou seu padrão de mídia de 60 segundos. Para compreensão
de imagem, esse timeout se aplica à própria requisição e não é
reduzido por trabalho de preparação anterior. Orçamentos de ferramentas dinâmicas são
limitados a 600000 ms. No timeout, o OpenClaw aborta o sinal da ferramenta
quando compatível e retorna uma resposta de ferramenta dinâmica com falha ao Codex para que o turno
possa continuar em vez de deixar a sessão em `processing`.
Esse watchdog é o orçamento externo dinâmico de `item/tool/call`; timeouts de
requisição específicos do provedor rodam dentro dessa chamada e mantêm sua própria semântica de timeout.

Depois que o Codex aceita um turno, e depois que o OpenClaw responde a uma requisição
do servidor de app com escopo de turno, o harness espera que o Codex faça progresso no turno atual e
eventualmente finalize o turno nativo com `turn/completed`. Se o servidor de app ficar
silencioso por `appServer.turnCompletionIdleTimeoutMs`, o OpenClaw tenta, em melhor esforço,
interromper o turno do Codex, registra um timeout de diagnóstico e libera a faixa de sessão
do OpenClaw para que mensagens de chat posteriores não fiquem enfileiradas atrás de um turno
nativo obsoleto. A maioria das notificações não terminais do mesmo turno desarma esse watchdog curto
porque o Codex provou que o turno ainda está ativo. Transferências para ferramentas usam um
orçamento de inatividade pós-ferramenta mais longo: depois que o OpenClaw retorna uma resposta
`item/tool/call`, depois que itens de ferramenta nativos como `commandExecution` concluem, depois de conclusões
brutas de `custom_tool_call_output`, e depois de progresso bruto pós-ferramenta do assistente,
conclusões brutas de raciocínio ou progresso de raciocínio. A proteção usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurado e
por padrão usa cinco minutos caso contrário. Esse mesmo orçamento pós-ferramenta também estende o
watchdog de progresso para a janela silenciosa de síntese antes que o Codex emita o próximo
evento do turno atual. Notificações globais do servidor de app, como atualizações de limite de taxa,
não redefinem o progresso de inatividade do turno. Conclusões de raciocínio, conclusões
`agentMessage` de comentário e progresso bruto pré-ferramenta de raciocínio ou assistente podem
ser seguidos por uma resposta final automática, portanto usam a proteção de resposta pós-progresso
em vez de liberar a faixa de sessão imediatamente. Somente itens `agentMessage`
concluídos finais/não comentário e conclusões brutas pré-ferramenta do
assistente armam a liberação por saída do assistente: se então o Codex ficar silencioso
sem `turn/completed`, o OpenClaw tenta, em melhor esforço, interromper o turno nativo e
libera a faixa de sessão. Se outro monitor de turno vencer essa corrida de liberação,
o OpenClaw ainda aceita o item final concluído do assistente quando nenhuma
requisição nativa, item ou conclusão de ferramenta dinâmica permanece ativa e a
liberação por saída do assistente ainda pertence ao item concluído mais recente, sem
conclusão de item posterior. Isso pode preservar a resposta final depois de trabalho de ferramenta
concluído sem reproduzir o turno. Deltas parciais do assistente, respostas anteriores obsoletas
e conclusões posteriores vazias não se qualificam. Falhas replay-safe de stdio
do servidor de app,
incluindo timeouts de inatividade de conclusão de turno sem evidência de assistente, ferramenta, item ativo
ou efeito colateral, são repetidas uma vez em uma nova tentativa do servidor de app. Timeouts inseguros
ainda aposentam o cliente de servidor de app travado e liberam a faixa de sessão do OpenClaw.
Eles também limpam a associação de thread nativa obsoleta em vez de serem
reproduzidos automaticamente. Timeouts de monitoramento de conclusão exibem texto de timeout
específico do Codex: casos replay-safe dizem que a resposta pode estar incompleta, enquanto casos inseguros
orientam o usuário a verificar o estado atual antes de tentar novamente. Diagnósticos públicos de timeout
incluem campos estruturais, como o último método de notificação do servidor de app,
id/tipo/papel do item bruto de resposta do assistente, contagens de requisições/itens ativos e estado
de monitoramento armado. Quando a última notificação é um item bruto de resposta do assistente, eles
também incluem uma prévia limitada do texto do assistente. Eles não incluem prompt bruto nem
conteúdo de ferramenta.

Sobrescritas de ambiente continuam disponíveis para testes locais:

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
preferida para implantações repetíveis porque mantém o comportamento do plugin no
mesmo arquivo revisado que o restante da configuração do harness do Codex.

## Plugins nativos do Codex

O suporte a plugins nativos do Codex usa os próprios recursos de app e plugin do servidor de app
do Codex na mesma thread do Codex que o turno do harness do OpenClaw. O OpenClaw
não traduz plugins do Codex em ferramentas dinâmicas sintéticas `codex_plugin_*` do OpenClaw.

`codexPlugins` afeta apenas sessões que selecionam o harness nativo do Codex. Ele
não tem efeito em execuções do harness integrado, execuções normais do provedor OpenAI, associações de conversa ACP
ou outros harnesses.

Configuração migrada mínima:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

A configuração do app da thread é calculada quando o OpenClaw estabelece uma sessão de harness do Codex
ou substitui uma associação de thread obsoleta do Codex. Ela não é recalculada a cada turno.
Depois de alterar `codexPlugins`, use `/new`, `/reset` ou reinicie o gateway para que
futuras sessões do harness do Codex comecem com o conjunto de apps atualizado.

Para elegibilidade de migração, inventário de apps, política de ações destrutivas,
elicitações e diagnósticos de plugin nativo, consulte
[Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins).

O acesso a apps e plugins no lado da OpenAI é controlado pela conta Codex conectada
e, para workspaces Business e Enterprise/Edu, pelos controles de app do workspace. Consulte
[Usando o Codex com seu plano ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para a visão geral da OpenAI sobre conta e controles de workspace.

## Uso do Computador

Uso do Computador é coberto em seu próprio guia de configuração:
[Uso do Computador no Codex](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não incorpora o app de controle de desktop nem executa
ações de desktop por conta própria. Ele prepara o servidor de app do Codex, verifica que o
servidor MCP `computer-use` está disponível e então permite que o Codex seja dono das chamadas
de ferramenta MCP nativas durante turnos no modo Codex.

## Limites de runtime

O harness do Codex altera apenas o executor de agente embarcado de baixo nível.

- Ferramentas dinâmicas do OpenClaw são compatíveis. O Codex pede que o OpenClaw execute essas
  ferramentas, portanto o OpenClaw permanece no caminho de execução.
- Ferramentas nativas de shell, patch, MCP e app do Codex pertencem ao Codex.
  O OpenClaw pode observar ou bloquear eventos nativos selecionados por meio do relay
  compatível, mas não reescreve argumentos de ferramentas nativas.
- O Codex é dono da Compaction nativa. O OpenClaw mantém um espelho de transcrição para histórico
  de canal, busca, `/new`, `/reset` e futura troca de modelo ou harness, mas
  não substitui a Compaction do Codex por um sumarizador do OpenClaw ou do mecanismo de contexto.
- Geração de mídia, compreensão de mídia, TTS, aprovações e saída de ferramenta de mensagens
  continuam pelas configurações correspondentes de provedor/modelo do OpenClaw.
- `tool_result_persist` se aplica a resultados de ferramentas de transcrição pertencentes ao OpenClaw, não
  a registros de resultado de ferramenta nativos do Codex.

Para camadas de hook, superfícies V1 compatíveis, tratamento nativo de permissões, direcionamento
de fila, mecânica de upload de feedback do Codex e detalhes de Compaction, consulte
[Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime).

## Solução de problemas

**O Codex não aparece como um provedor `/model` normal:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa o harness integrado em vez do Codex:** confirme que a referência do modelo é
`openai/gpt-*` no provedor oficial OpenAI e que o plugin Codex está
instalado e habilitado. Se precisar de prova estrita durante testes, defina `agentRuntime.id: "codex"` no provedor ou
modelo. Um runtime Codex forçado falha em vez de
voltar para o OpenClaw.

**O runtime OpenAI Codex volta para o caminho de chave de API:** colete um trecho redigido
do gateway que mostre o modelo, runtime, provedor selecionado e falha.
Peça aos colaboradores afetados que executem este comando somente leitura no host OpenClaw deles:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Trechos úteis geralmente incluem `openai/gpt-5.5` ou `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` ou `harnessRuntime`,
`candidateProvider: "openai"` e um resultado `401`, `Incorrect API key` ou
`No API key`. Uma execução corrigida deve mostrar o caminho OAuth da OpenAI
em vez de uma falha simples de chave de API da OpenAI.

**A configuração de referências de modelo Codex legadas permanece:** execute `openclaw doctor --fix`.
O Doctor reescreve referências de modelo legadas para `openai/*`, remove pins obsoletos de sessão e
runtime de agente inteiro, e preserva sobrescritas existentes de perfil de autenticação.

**O servidor de app é rejeitado:** use o servidor de app do Codex `0.125.0` ou mais recente.
Pré-lançamentos da mesma versão ou versões com sufixo de build, como
`0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o OpenClaw testa o
piso estável de protocolo `0.125.0`.

**`/codex status` não consegue conectar:** verifique se o plugin `codex` empacotado está
habilitado, se `plugins.allow` o inclui quando uma lista de permissões está configurada e
se qualquer `appServer.command`, `url`, `authToken` ou cabeçalhos personalizados são válidos.

**A descoberta de modelos está lenta:** reduza
`plugins.entries.codex.config.discovery.timeoutMs` ou desabilite a descoberta. Consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference#model-discovery).

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`,
cabeçalhos e se o servidor de app remoto fala a mesma versão de protocolo do servidor de app
do Codex.

**Ferramentas nativas de shell ou patch estão bloqueadas com `Native hook relay unavailable`:**
a conversa do Codex ainda está tentando usar um id de relé de hook nativo que o OpenClaw não
tem mais registrado. Este é um problema de transporte de hook nativo do Codex, não uma falha de
backend ACP, provedor, GitHub ou comando de shell. Inicie uma nova sessão no
chat afetado com `/new` ou `/reset` e tente novamente um comando inofensivo. Se isso
funcionar uma vez, mas a próxima chamada de ferramenta nativa falhar novamente, trate `/new` apenas
como uma solução temporária: copie o prompt para uma nova sessão depois de reiniciar o app-server
do Codex ou o OpenClaw Gateway para que conversas antigas sejam descartadas e os registros de
hooks nativos sejam recriados.

**Um modelo que não é Codex usa o harness integrado:** isso é esperado, a menos que
a política de runtime do provedor ou do modelo o encaminhe para outro harness. Referências simples
a provedores que não são OpenAI permanecem no caminho normal do provedor no modo `auto`.

**Computer Use está instalado, mas as ferramentas não são executadas:** verifique
`/codex computer-use status` em uma nova sessão. Se uma ferramenta relatar
`Native hook relay unavailable`, use a recuperação de relé de hook nativo acima. Consulte
[Codex Computer Use](/pt-BR/plugins/codex-computer-use#troubleshooting).

## Relacionados

- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Ajuda do OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Status](/pt-BR/cli/status)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
