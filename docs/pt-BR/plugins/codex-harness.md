---
read_when:
    - Você quer usar o harness oficial do app-server do Codex
    - Você precisa de exemplos de configuração do harness do Codex
    - Você quer que as implantações exclusivas do Codex falhem em vez de recorrerem ao OpenClaw
summary: Execute turnos do agente integrado do OpenClaw por meio do harness oficial do app-server do Codex
title: Harness do Codex
x-i18n:
    generated_at: "2026-07-12T15:29:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5f6705dad9fa3bbe45c2f4eaf079ecb861b7911142bda1301c4d64a1f21a8ec5
    source_path: plugins/codex-harness.md
    workflow: 16
---

O plugin oficial `codex` executa turnos incorporados do agente OpenAI por meio do
app-server do Codex, em vez do harness integrado do OpenClaw. O Codex controla a
sessão de agente de baixo nível: retomada nativa de threads, continuação nativa
de ferramentas, Compaction nativa e execução pelo app-server. O OpenClaw ainda
controla os canais de chat, arquivos de sessão, seleção de modelo, ferramentas
dinâmicas do OpenClaw, aprovações, entrega de mídia e o espelho visível da
transcrição.

Use referências de modelo canônicas da OpenAI, como `openai/gpt-5.6-sol`. Não
configure referências GPT legadas do Codex; defina a ordem de autenticação do
agente OpenAI em `auth.order.openai`. IDs legados de perfis de autenticação do
Codex e entradas legadas da ordem de autenticação do Codex são corrigidos por
`openclaw doctor --fix`.

Quando a política de runtime do provedor/modelo não está definida ou é `auto`,
o prefixo `openai/*`, por si só, nunca seleciona esse harness. A OpenAI pode
selecionar o Codex implicitamente somente para uma rota oficial HTTPS exata de
Platform Responses ou ChatGPT Responses sem substituição de solicitação
definida pelo usuário. Consulte
[runtime de agente implícito da OpenAI](/pt-BR/providers/openai#implicit-agent-runtime).
Se o Codex controlar a autenticação antes de ser conhecido o roteamento entre
Platform e ChatGPT, o OpenClaw ainda exigirá que cada rota candidata declare
compatibilidade com o Codex. O controle nativo da autenticação, por si só, nunca
ignora essa verificação de rota.

Quando nenhum sandbox do OpenClaw está ativo, o OpenClaw inicia threads do
app-server do Codex com o modo de código nativo do Codex habilitado (o modo
somente código permanece desativado por padrão), para que os recursos nativos
de espaço de trabalho/código permaneçam disponíveis junto às ferramentas
dinâmicas do OpenClaw roteadas pela ponte `item/tool/call` do app-server. Um
sandbox ativo do OpenClaw ou uma política restrita de ferramentas desabilita
completamente o modo de código nativo, a menos que você habilite o caminho
experimental do exec-server do sandbox.

Com o padrão `tools.exec.host: "auto"` e sem um sandbox ativo do OpenClaw, o
Codex também recebe as ferramentas `node_exec` e `node_process` para comandos
em Nodes pareados. O shell nativo permanece no host e no espaço de trabalho do
app-server do Codex (local ao Gateway na implantação stdio padrão); `node_exec`
seleciona um Node pelo nome ou ID e mantém em vigor a política de aprovação de
Nodes do OpenClaw.

Esse recurso nativo do Codex é separado do
[modo de código do OpenClaw](/pt-BR/reference/code-mode), um runtime QuickJS-WASI
opcional para execuções genéricas do OpenClaw com um formato de entrada `exec`
diferente. Para entender a divisão mais ampla entre modelo, provedor e runtime,
comece por [Runtimes de agente](/pt-BR/concepts/agent-runtimes):
`openai/gpt-5.6-sol` é a referência do modelo, `codex` é o runtime e Telegram,
Discord, Slack ou outro canal é a superfície de comunicação.

## Requisitos

- O plugin oficial `@openclaw/codex` instalado. Inclua `codex` em
  `plugins.allow` se sua configuração usar uma lista de permissões.
- App-server do Codex `0.143.0` ou mais recente. O plugin gerencia um binário
  compatível por padrão, portanto um comando `codex` no `PATH` não afeta a
  inicialização normal.
- Autenticação do Codex por meio de
  `openclaw models auth login --provider openai`, uma conta do app-server já
  presente no diretório inicial do Codex do agente ou um perfil explícito de
  autenticação do Codex por chave de API.

Para precedência de autenticação, isolamento de ambiente, comandos
personalizados do app-server, descoberta de modelos e a lista completa de
campos de configuração, consulte a
[referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Início rápido

Instale o plugin oficial e, em seguida, entre com o OAuth do Codex:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Habilite o plugin `codex` e selecione um modelo de agente OpenAI:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Se sua configuração usar `plugins.allow`, adicione `codex` lá também:

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

Reinicie o Gateway após alterar a configuração do plugin. Se um chat já tiver
uma sessão, execute `/new` ou `/reset` primeiro, para que o próximo turno
resolva o harness com base na configuração atual.

## Compartilhe threads com o Codex Desktop e a CLI

O padrão `appServer.homeScope: "agent"` isola cada agente do OpenClaw do estado
nativo do Codex do operador. Para permitir que um proprietário inspecione e
gerencie as mesmas threads nativas exibidas pelo Codex Desktop e pela CLI do
Codex, habilite o diretório inicial do Codex do usuário:

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

O modo de diretório inicial do usuário aceita um processo stdio gerenciado
local ou o transporte compartilhado por soquete Unix. Ele usa `$CODEX_HOME`
quando definido e `~/.codex` caso contrário, incluindo a autenticação, a
configuração, os plugins e o armazenamento de threads nativos do Codex desse
diretório inicial. O OpenClaw não injeta um perfil de autenticação do OpenClaw
nesse app-server.

Os turnos do proprietário recebem a ferramenta `codex_threads`: listar,
pesquisar, ler, criar fork, renomear, arquivar e restaurar threads nativas. Crie
um fork de uma thread para continuá-la no OpenClaw; o fork é anexado à sessão
atual do OpenClaw e permanece visível para outros clientes nativos do Codex. O
arquivamento exige confirmação explícita de que a thread está fechada em outro
lugar. Quando a supervisão também está habilitada, campos da transcrição e
mutações exigem a habilitação correspondente de
`supervision.allowRawTranscripts` ou `supervision.allowWriteControls`.

Não retome nem grave simultaneamente na mesma thread por meio de App Servers
stdio gerenciados independentes. O Codex coordena gravadores ativos dentro de
um App Server, não entre processos separados. A criação de fork é o caminho
seguro de coexistência para sessões stdio comuns no diretório inicial do
usuário.

`appServer.homeScope: "user"` por si só não habilita o catálogo da frota. Use
`supervision.enabled: true` quando quiser que as sessões nativas apareçam na
barra lateral do OpenClaw. A supervisão usa uma conexão de supervisão separada;
sem configurações explícitas de conexão em `appServer`, essa conexão usa por
padrão o stdio gerenciado no diretório inicial do usuário, enquanto o harness
comum permanece restrito ao agente. As configurações explícitas de `appServer`
são respeitadas pelos dois caminhos. Defina `homeScope: "user"` explicitamente,
como mostrado acima, quando o harness comum também precisar compartilhar o
estado nativo.

## Supervisione sessões do Codex

O mesmo plugin `codex` pode listar sessões não arquivadas do Codex no computador
do Gateway e em Nodes pareados que tenham aderido. Uma sessão armazenada ou
ociosa local ao Gateway pode criar um Chat com modelo bloqueado que espelha seu
histórico persistido e limitado de mensagens do usuário e do assistente. Sua
vinculação privada usa a conexão de supervisão para o snapshot nativo, a
ramificação canônica e os turnos posteriores, enquanto as sessões comuns do
Codex permanecem restritas ao agente. O primeiro início canônico usa exatamente
o modelo e o provedor retornados pelo Codex para o fork do snapshot. Retomadas
posteriores deixam a seleção por conta da configuração nativa do Codex; o
modelo externo do OpenClaw e a cadeia de fallback nunca o substituem. Linhas
armazenadas e ociosas podem ser arquivadas após a confirmação explícita de que
não há outro executor. Fontes ativas não podem criar uma ramificação nem ser
arquivadas; um Chat supervisionado existente ainda pode ser aberto. Sessões de
Nodes pareados permanecem somente como metadados.

Consulte [Supervisione sessões do Codex](/plugins/codex-supervision) para
configuração, regras de ramificação, limites de Nodes pareados, exposição de
metadados e solução de problemas.

## Configuração

| Necessidade                                                   | Defina                                                                                                      | Onde                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Habilitar o harness                                           | `plugins.entries.codex.enabled: true`                                                                        | Configuração do OpenClaw                   |
| Exibir sessões não arquivadas do Codex                        | `plugins.entries.codex.config.supervision.enabled: true`                                                     | Configuração do plugin Codex               |
| Manter a instalação de um plugin em uma lista de permissões   | Inclua `codex` em `plugins.allow`                                                                            | Configuração do OpenClaw                   |
| Permitir que turnos OpenAI elegíveis usem Codex implicitamente | Rota oficial HTTPS exata de Responses/ChatGPT, sem substituição de solicitação definida, runtime ausente/`auto` | Configuração de provedor/modelo da OpenAI |
| Entrar com OAuth do ChatGPT/Codex                             | `openclaw models auth login --provider openai`                                                               | Perfil de autenticação da CLI              |
| Adicionar backup por chave de API para execuções do Codex     | Perfil de chave de API `openai:*` listado após a autenticação de assinatura em `auth.order.openai`          | Perfil de autenticação da CLI + configuração do OpenClaw |
| Falhar de forma fechada quando o Codex estiver indisponível   | `agentRuntime.id: "codex"` do provedor ou modelo                                                             | Configuração de modelo/provedor do OpenClaw |
| Usar tráfego direto da API da OpenAI                          | `agentRuntime.id: "openclaw"` do provedor ou modelo com autenticação normal da OpenAI                       | Configuração de modelo/provedor do OpenClaw |
| Ajustar o comportamento do app-server                         | `plugins.entries.codex.config.appServer.*`                                                                   | Configuração do plugin Codex               |
| Habilitar aplicativos de plugin nativos do Codex              | `plugins.entries.codex.config.codexPlugins.*`                                                                | Configuração do plugin Codex               |
| Habilitar o Computer Use do Codex                             | `plugins.entries.codex.config.computerUse.*`                                                                 | Configuração do plugin Codex               |

Prefira `auth.order.openai` para a ordem assinatura primeiro/chave de API como
backup. IDs de perfis de autenticação legados do Codex e a ordem de autenticação
legada do Codex existente são estados legados exclusivos do doctor; não grave
novas referências GPT legadas do Codex.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Para uma rota efetiva compatível com o Codex, os dois perfis acima permanecem
candidatos à mesma execução do Codex. A ordem dos perfis escolhe as credenciais,
não o runtime. Alterar a ordem de autenticação não torna uma rota personalizada,
de Completions, HTTP ou com substituição na solicitação compatível com o Codex.

### Compaction

Não defina `compaction.model` nem `compaction.provider` em agentes apoiados pelo
Codex. O Codex executa a Compaction por meio do estado nativo da thread no
app-server, portanto o OpenClaw ignora essas substituições locais do resumidor
durante a execução, e `openclaw doctor --fix` as remove quando o agente usa
Codex.

O Lossless continua compatível como mecanismo de contexto para montagem,
ingestão e manutenção em torno dos turnos do Codex, configurado por meio de
`plugins.slots.contextEngine: "lossless-claw"` e
`plugins.entries.lossless-claw.config.summaryModel`, não por meio de
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra o formato
antigo `compaction.provider: "lossless-claw"` para o slot do mecanismo de
contexto Lossless quando o Codex é o runtime ativo, mas o Codex nativo ainda
controla a Compaction. O harness nativo do app-server aceita mecanismos de
contexto que precisam de montagem anterior ao prompt; backends genéricos de
CLI, incluindo `codex-cli`, não oferecem esse recurso de host.

Para agentes apoiados pelo Codex, `/compact` inicia a Compaction nativa do
app-server do Codex na thread vinculada. O OpenClaw não aguarda a conclusão,
impõe um tempo limite do OpenClaw, reinicia o app-server compartilhado nem
recorre a um mecanismo de contexto ou resumidor público da OpenAI. Se a
vinculação da thread nativa do Codex estiver ausente ou obsoleta, o comando
falhará de forma fechada, em vez de alternar silenciosamente os backends de
Compaction.

O restante desta página aborda o formato de implantação, roteamento com falha
fechada, política de aprovação do guardião, plugins nativos do Codex e Computer
Use. Para listas completas de opções, padrões, enumerações, descoberta,
isolamento de ambiente, tempos limite e campos de transporte do app-server,
consulte a
[referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Verifique o runtime do Codex

Use `/status` no chat em que você espera usar o Codex. Um turno de agente OpenAI
apoiado pelo Codex exibe:

```text
Runtime: OpenAI Codex
```

Em seguida, verifique o estado do app-server do Codex:

```text
/codex status
/codex models
```

`/codex status` informa a conectividade com o app-server, a conta, os limites de uso, os servidores
MCP e as Skills. `/codex models` lista o catálogo ativo do app-server do Codex
para o harness e a conta. Se o resultado de `/status` for inesperado, consulte
[Solução de problemas](#troubleshooting).

## Roteamento e seleção de modelo

Mantenha as referências de provedor separadas da política de runtime:

- Use `openai/gpt-*` para a seleção canônica de modelos da OpenAI. O prefixo, por si só,
  nunca seleciona o Codex.
- Com o runtime não definido ou definido como `auto`, somente uma rota oficial exata de HTTPS Platform Responses
  ou ChatGPT Responses, sem substituição de solicitação definida pelo autor, pode selecionar o Codex
  implicitamente.
- Não use referências legadas de GPT do Codex na configuração; execute `openclaw doctor --fix` para
  corrigir referências legadas e fixações obsoletas de rota de sessão.
- `agentRuntime.id: "codex"` torna o Codex um requisito com falha fechada para uma
  rota compatível. Isso não torna compatível uma rota efetiva incompatível.
- `agentRuntime.id: "openclaw"` direciona um provedor ou modelo para o runtime
  incorporado do OpenClaw quando isso é intencional.
- `/codex ...` controla conversas nativas do app-server do Codex pelo chat.
- ACP/acpx é um caminho separado de harness externo. Use-o somente quando o usuário
  solicitar ACP/acpx ou um adaptador de harness externo.

| Intenção do usuário                                         | Use                                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Anexar o chat atual                                         | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Retomar uma thread existente do Codex                       | `/codex resume <thread-id>`                                                                           |
| Listar ou filtrar threads do Codex                          | `/codex threads [filter]`                                                                             |
| Listar plugins nativos do Codex                             | `/codex plugins list`                                                                                 |
| Habilitar ou desabilitar um plugin nativo configurado do Codex | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                    |
| Retomar uma sessão armazenada da CLI do Codex como um turno de nó emparelhado | `/codex sessions --host <node> [filter]`, depois `/codex resume <session-id> --host <node> --bind here` |
| Ver sessões não arquivadas do Codex entre computadores      | Habilite a supervisão do Codex e abra **Sessões do Codex**                                            |
| Alterar o modelo, o modo rápido ou as permissões da thread vinculada | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Parar ou orientar o turno ativo                             | `/codex stop`, `/codex steer <text>`                                                                  |
| Desvincular a associação atual                              | `/codex detach` (alias `/codex unbind`)                                                               |
| Enviar somente feedback do Codex                            | `/codex diagnostics [note]`                                                                           |
| Iniciar uma tarefa ACP/acpx                                 | Comandos de sessão ACP/acpx, não `/codex`                                                             |

| Caso de uso                                      | Configure                                                                                                   | Verifique                                | Observações                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| Rota elegível da OpenAI com runtime nativo do Codex | Rota oficial exata de HTTPS Responses/ChatGPT sem substituição de solicitação definida pelo autor, além do plugin `codex` habilitado | `/status` mostra `Runtime: OpenAI Codex` | Caminho implícito quando o runtime não está definido/é `auto` |
| Falhar de forma fechada se o Codex estiver indisponível | `agentRuntime.id: "codex"` do provedor ou modelo                                                        | O turno falha em vez de usar o fallback incorporado | Use em implantações exclusivas do Codex         |
| Tráfego direto com chave da API da OpenAI pelo OpenClaw | `agentRuntime.id: "openclaw"` do provedor ou modelo e autenticação normal da OpenAI                     | `/status` mostra o runtime do OpenClaw   | Use somente quando o OpenClaw for intencional         |
| Configuração legada                              | referências legadas de GPT do Codex                                                                           | `openclaw doctor --fix` as reescreve     | Não crie novas configurações dessa maneira            |
| Adaptador ACP/acpx do Codex                      | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | Status da tarefa/sessão ACP              | Separado do harness nativo do Codex                    |

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use `openai/gpt-*`
para a rota normal da OpenAI e `codex/gpt-*` somente quando a compreensão de imagens
dever ser executada por um turno limitado do app-server do Codex. O Doctor reescreve referências legadas
de GPT do Codex como `openai/gpt-*`.

## Padrões de implantação

### Implantação básica do Codex

Use a configuração de início rápido para um modelo da OpenAI cuja rota HTTPS oficial
efetiva seja elegível para selecionar implicitamente o Codex:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### Implantação com vários provedores

Mantenha o Claude como agente padrão e adicione um agente Codex nomeado:

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
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

O agente `main` usa seu caminho normal de provedor. O agente `codex` usa o
app-server do Codex quando sua rota efetiva da OpenAI permanece compatível; adicione
`agentRuntime.id: "codex"` explicitamente no escopo do modelo quando isso precisar ser um
requisito com falha fechada.

### Implantação do Codex com falha fechada

Uma rota elegível e exata da OpenAI via HTTPS oficial pode ser resolvida para o Codex quando o
plugin incluído está disponível. Adicione uma política de runtime explícita para uma regra
de falha fechada definida:

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
      model: "openai/gpt-5.6-sol",
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

Com o Codex forçado, o OpenClaw falha antecipadamente se a rota efetiva não for declarada
compatível com o Codex, se o plugin estiver desabilitado, se o app-server for antigo demais ou se o
app-server não puder iniciar.

## Política do app-server

Por padrão, o plugin inicia localmente o binário gerenciado do Codex do OpenClaw com
transporte stdio. Defina `appServer.command` somente para executar intencionalmente um
executável diferente. Use o transporte WebSocket somente quando um app-server já estiver
em execução em outro local:

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

As sessões locais do app-server via stdio usam por padrão a postura de operador local
confiável: `approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se os requisitos locais do Codex não permitirem essa
postura YOLO implícita, o OpenClaw selecionará permissões permitidas do guardião.
Quando um sandbox do OpenClaw está ativo para a sessão, o OpenClaw
desabilita o Code Mode nativo do Codex, os servidores MCP do usuário e a execução de plugins
baseados em aplicativos nesse turno, em vez de depender do sandbox do lado do host do Codex.
O acesso ao shell passa pelos tools dinâmicos baseados no sandbox do OpenClaw, como
`sandbox_exec` e `sandbox_process`, quando os tools normais de exec/process
estão disponíveis.

Use o modo de execução normalizado do OpenClaw para a revisão automática nativa do Codex antes de
escapes do sandbox ou permissões adicionais:

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

Para sessões do app-server do Codex, `tools.exec.mode: "auto"` corresponde a aprovações
revisadas pelo Guardian do Codex: geralmente `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"` quando
os requisitos locais permitem esses valores. Em `tools.exec.mode: "auto"`,
o OpenClaw não preserva substituições legadas e inseguras do Codex, como `approvalPolicy: "never"` ou
`sandbox: "danger-full-access"`; use `tools.exec.mode: "full"` para
uma postura intencional do Codex sem aprovações. A predefinição legada
`plugins.entries.codex.config.appServer.mode: "guardian"` ainda
funciona, mas `tools.exec.mode: "auto"` é a superfície normalizada do OpenClaw.

Para a comparação entre modos com aprovações de execução do host e permissões
ACPX, consulte [Modos de permissão](/pt-BR/tools/permission-modes). Para todos os
campos do app-server, a ordem de autenticação, o isolamento de ambiente e o comportamento de timeout,
consulte a [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Comandos e diagnósticos

O plugin `codex` registra `/codex` como um comando de barra em qualquer canal que
ofereça suporte a comandos de texto do OpenClaw.

A execução e o controle nativos exigem um proprietário ou um cliente do Gateway com
`operator.admin`: vincular ou retomar threads, enviar ou parar turnos,
alterar o modelo, o modo rápido ou o estado das permissões, executar Compaction ou revisão e
desvincular uma associação. Outros remetentes autorizados mantêm comandos somente leitura de status, ajuda,
conta, modelo, thread, servidor MCP, Skill e inspeção de associações.

Formas comuns:

- `/codex status` verifica a conectividade com o app-server, os modelos, a conta, os limites
  de uso, os servidores MCP e as Skills.
- `/codex models` lista os modelos ativos do app-server do Codex.
- `/codex threads [filter]` lista as threads recentes do app-server do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma
  thread existente do Codex.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  anexa o chat atual.
- `/codex detach` (ou `/codex unbind`) desvincula a associação atual.
- `/codex binding` descreve a associação atual.
- `/codex stop` interrompe o turno ativo; `/codex steer <text>` o orienta.
- `/codex model <model>`, `/codex fast [on|off|status]` e
  `/codex permissions [default|yolo|status]` alteram o estado por conversa.
- `/codex compact` solicita ao app-server do Codex que execute Compaction na thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` solicita confirmação antes de enviar feedback do Codex sobre a
  thread anexada.
- `/codex account` mostra o status da conta e dos limites de uso.
- `/codex mcp` lista o status dos servidores MCP do app-server do Codex.
- `/codex skills` lista as Skills do app-server do Codex.
- `/codex plugins list`, `/codex plugins enable <name>` e
  `/codex plugins disable <name>` gerenciam plugins nativos configurados do Codex.
- `/codex computer-use [status|install]` gerencia o uso do computador pelo Codex.
- `/codex help` lista toda a árvore de comandos.

Para a maioria dos relatos de suporte, comece com `/diagnostics [note]` na
conversa em que o bug ocorreu. Isso cria um relatório de diagnóstico do
Gateway e, para sessões do harness do Codex, solicita aprovação para enviar o
pacote de feedback relevante do Codex. Consulte
[Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para conhecer o modelo de
privacidade e o comportamento em chats em grupo. Use
`/codex diagnostics [note]` somente quando você quiser especificamente enviar
o feedback do Codex referente à thread atualmente anexada, sem o pacote
completo de diagnósticos do Gateway.

### Inspecionar threads do Codex localmente

A maneira mais rápida de inspecionar uma execução problemática do Codex
geralmente é abrir diretamente a thread nativa do Codex:

```bash
codex resume <thread-id>
```

Obtenha o ID da thread na resposta concluída de `/diagnostics`, em
`/codex binding` ou em `/codex threads [filter]`.

Para saber mais sobre o mecanismo de envio e os limites dos diagnósticos no
nível do runtime, consulte
[Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime#codex-feedback-upload).

### Ordem de autenticação

No diretório inicial padrão por agente, a autenticação é selecionada nesta
ordem:

1. Perfis de autenticação da OpenAI ordenados para o agente, preferencialmente
   em `auth.order.openai`. Execute `openclaw doctor --fix` para migrar IDs
   legados de perfis de autenticação do Codex e a ordem legada de autenticação
   do Codex.
2. A conta existente do app-server no diretório inicial do Codex desse agente.
3. Somente para inicializações locais do app-server via stdio, `CODEX_API_KEY`
   e depois `OPENAI_API_KEY`, quando não houver uma conta do app-server e a
   autenticação da OpenAI ainda for necessária.

Quando o OpenClaw detecta um perfil de autenticação do Codex baseado em uma
assinatura do ChatGPT, ele remove `CODEX_API_KEY` e `OPENAI_API_KEY` do
processo filho do Codex iniciado. Isso mantém as chaves de API no nível do
Gateway disponíveis para embeddings ou modelos diretos da OpenAI sem fazer
com que as interações nativas do app-server do Codex sejam cobradas
acidentalmente pela API. Perfis explícitos de chave de API do Codex e o
fallback local para chaves de ambiente via stdio usam o login do app-server,
em vez do ambiente herdado pelo processo filho. Conexões do app-server via
WebSocket não recebem o fallback de chave de API do ambiente do Gateway; use
um perfil de autenticação explícito ou a própria conta do app-server remoto.

Se um perfil de assinatura atingir um limite de uso do Codex, o OpenClaw
registra o horário de redefinição quando o Codex o informa e tenta o próximo
perfil de autenticação ordenado para a mesma execução do Codex. Quando o
horário de redefinição passa, o perfil de assinatura volta a ser elegível sem
alterar o modelo `openai/gpt-*` selecionado nem o runtime do Codex.

Quando Plugins nativos do Codex estão configurados, o OpenClaw instala ou
atualiza esses Plugins por meio do app-server conectado antes de expor à
thread do Codex os aplicativos pertencentes aos Plugins. `app/list` continua
sendo a fonte da verdade para IDs, acessibilidade e metadados dos aplicativos,
mas o OpenClaw controla a decisão de habilitação por thread: se a política
permitir um aplicativo acessível listado, o OpenClaw enviará
`thread/start.config.apps[appId].enabled = true` mesmo quando `app/list`
informar atualmente que esse aplicativo está desabilitado. Esse caminho não
cria instalações de aplicativos para IDs desconhecidos; o OpenClaw ativa
somente Plugins do marketplace com `plugin/install` e depois atualiza o
inventário.

### Isolamento de ambiente

Para inicializações locais do app-server via stdio, o OpenClaw define
`CODEX_HOME` como um diretório por agente para que a configuração, os arquivos
de autenticação/conta, o cache/os dados de Plugins e o estado nativo das
threads do Codex não leiam nem gravem, por padrão, no `~/.codex` pessoal do
operador. O OpenClaw preserva o `HOME` normal do processo; subprocessos
executados pelo Codex ainda podem encontrar configurações e tokens do
diretório inicial do usuário, e o Codex pode descobrir entradas compartilhadas
em `$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`. Com
`appServer.homeScope: "user"`, o OpenClaw usa, em vez disso, o diretório
inicial nativo do Codex do usuário e a conta existente nele, sem injetar um
perfil de autenticação do OpenClaw.

Se uma implantação precisar de isolamento adicional do ambiente, adicione
essas variáveis a `appServer.clearEnv`:

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

`appServer.clearEnv` afeta somente o processo filho do app-server do Codex
iniciado. O OpenClaw remove `CODEX_HOME` e `HOME` dessa lista durante a
normalização da inicialização local: `CODEX_HOME` continua apontando para o
escopo selecionado do agente ou do usuário, e `HOME` continua sendo herdado
para que os subprocessos possam usar o estado normal do diretório inicial do
usuário.

### Ferramentas dinâmicas e pesquisa na web

Por padrão, as ferramentas dinâmicas do Codex usam o carregamento
`searchable`. O OpenClaw não expõe ferramentas dinâmicas que duplicam
operações nativas do Codex no workspace: `read`, `write`, `edit`,
`apply_patch`, `exec`, `process`, `update_plan`, `tool_call`, `tool_describe`,
`tool_search` e `tool_search_code`. A maioria das demais ferramentas de
integração do OpenClaw, como mensagens, mídia, cron, navegador, Nodes,
Gateway e `heartbeat_respond`, fica disponível por meio da pesquisa de
ferramentas do Codex no namespace `openclaw`, mantendo menor o contexto
inicial do modelo.

As ferramentas marcadas com `catalogMode: "direct-only"`, incluindo a
ferramenta `computer` do OpenClaw, usam o namespace `openclaw_direct`. O Codex
trata esse namespace como `DirectModelOnly`, portanto essas ferramentas
permanecem diretamente visíveis ao modelo em threads normais e exclusivas do
modo de código, em vez de atravessarem chamadas aninhadas `tools.*` do Modo de
Código.

Por padrão, a pesquisa na web usa a ferramenta hospedada `web_search` do
Codex quando a pesquisa está habilitada e nenhum provedor gerenciado está
selecionado. A pesquisa hospedada nativa e a ferramenta dinâmica gerenciada
`web_search` do OpenClaw são mutuamente exclusivas, para que a pesquisa
gerenciada não possa contornar as restrições nativas de domínio. O OpenClaw
usa a ferramenta gerenciada quando a pesquisa hospedada não está disponível,
está explicitamente desabilitada ou foi substituída por um provedor
gerenciado selecionado. O OpenClaw mantém desabilitada a extensão independente
`web.run` do Codex porque o tráfego de produção do app-server rejeita o
namespace `web` definido pelo usuário. `tools.web.search.enabled: false`
desabilita os dois caminhos, assim como execuções somente com LLM que tenham
as ferramentas desabilitadas. O Codex trata `"cached"` como uma preferência e
a resolve como acesso externo em tempo real para interações irrestritas do
app-server. O fallback gerenciado automático falha de forma fechada quando
`allowedDomains` nativos estão definidos, para que a lista de permissões não
possa ser contornada. Alterações persistentes na política de pesquisa efetiva
rotacionam a thread vinculada do Codex antes da próxima interação; restrições
transitórias por interação usam uma thread temporária restrita e preservam o
vínculo existente para retomada posterior.

As respostas de origem de `sessions_yield` e exclusivas da ferramenta de
mensagens permanecem diretas porque são contratos de controle da interação.
`sessions_spawn` permanece pesquisável para que o `spawn_agent` nativo do
Codex continue sendo a principal interface de subagentes do Codex, enquanto a
delegação explícita pelo OpenClaw ou ACP continua disponível pelo namespace de
ferramentas dinâmicas `openclaw`. As instruções de colaboração do Heartbeat
orientam o Codex a pesquisar `heartbeat_respond` antes de encerrar uma
interação de Heartbeat quando a ferramenta ainda não estiver carregada.

Defina `codexDynamicToolsLoading: "direct"` somente ao se conectar a um
app-server personalizado do Codex que não consiga pesquisar ferramentas
dinâmicas adiadas ou ao depurar o payload completo de ferramentas.

### Campos de configuração

Campos de nível superior compatíveis com o Plugin do Codex:

| Campo                      | Padrão         | Significado                                                                                             |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Use `"direct"` para colocar as ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir das interações do app-server do Codex. |
| `codexPlugins`             | desabilitado   | Suporte nativo do Codex a Plugins/aplicativos para Plugins selecionados migrados e instalados a partir do código-fonte. |
| `supervision`              | desabilitado   | Catálogo de sessões nativas não arquivadas, continuação da ramificação local e política de ferramentas do agente. |

Campos compatíveis com `appServer`:

| Campo                                         | Padrão                                                 | Significado                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia o Codex; `"unix"` explícito conecta-se ao socket de controle local; `"websocket"` conecta-se a `url`.                                                                                                                                                                                                                                                                           |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isola o estado comum do harness por agente do OpenClaw. `"user"` é uma opção explícita que compartilha o `$CODEX_HOME` nativo ou `~/.codex`, usa autenticação nativa e habilita o gerenciamento de threads exclusivo do proprietário. O escopo de usuário aceita transporte stdio local ou Unix. Para a conexão de supervisão separada, um valor não definido é resolvido como `"user"` para stdio ou Unix e `"agent"` para WebSocket. |
| `command`                                     | binário gerenciado do Codex                            | Executável para transporte stdio. Deixe sem definir para usar o binário gerenciado; defina-o somente para uma substituição explícita.                                                                                                                                                                                                                                                            |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | não definido                                           | URL do App Server WebSocket ou URL `unix://`. Um caminho Unix explícito vazio seleciona o socket de controle canônico no diretório inicial do usuário.                                                                                                                                                                                                                                           |
| `authToken`                                   | não definido                                           | Token Bearer para transporte WebSocket. Aceita uma string literal ou SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Cabeçalhos WebSocket adicionais. Os valores dos cabeçalhos aceitam strings literais ou valores SecretInput, por exemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                         |
| `clearEnv`                                    | `[]`                                                   | Nomes adicionais de variáveis de ambiente removidos do processo app-server stdio iniciado depois que o OpenClaw cria seu ambiente herdado. O OpenClaw mantém o `CODEX_HOME` selecionado e o `HOME` herdado para execuções locais.                                                                                                                                                                  |
| `codeModeOnly`                                | `false`                                                | Ativa somente a superfície de ferramentas do modo de código do Codex. As ferramentas dinâmicas comuns do OpenClaw permanecem disponíveis por meio de chamadas `tools.*` aninhadas; as ferramentas `openclaw_direct` continuam diretamente visíveis para o modelo.                                                                                                                                   |
| `remoteWorkspaceRoot`                         | não definido                                           | Raiz remota do workspace do app-server do Codex. Quando definida, o OpenClaw infere a raiz do workspace local a partir do workspace resolvido do OpenClaw, preserva o sufixo do cwd atual sob essa raiz remota e envia ao Codex somente o cwd final do app-server. Se o cwd estiver fora da raiz resolvida do workspace do OpenClaw, o OpenClaw falhará de forma segura em vez de enviar um caminho local do Gateway ao app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tempo limite para chamadas do plano de controle do app-server.                                                                                                                                                                                                                                                                                                                                  |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Janela de inatividade depois que o Codex aceita um turno ou após uma solicitação do app-server com escopo de turno, enquanto o OpenClaw aguarda `turn/completed`.                                                                                                                                                                                                                                 |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Proteção de inatividade de conclusão e de progresso usada após uma transferência para ferramenta, conclusão de ferramenta nativa, progresso bruto do assistente após a ferramenta, conclusão de raciocínio bruto ou progresso de raciocínio enquanto o OpenClaw aguarda `turn/completed`. Use isso para cargas de trabalho confiáveis ou pesadas nas quais a síntese após a ferramenta pode legitimamente permanecer inativa por mais tempo que o orçamento da resposta final do assistente. |
| `mode`                                        | `"yolo"`, a menos que os requisitos locais do Codex não permitam YOLO | Predefinição para execução YOLO ou revisada pelo guardian. Requisitos locais de stdio que omitam `danger-full-access`, aprovação `never` ou o revisor `user` fazem do guardian o padrão implícito.                                                                                                                                                                                                   |
| `approvalPolicy`                              | `"never"` ou uma política de aprovação permitida do guardian | Política de aprovação nativa do Codex enviada ao início/retomada da thread/turno. Os padrões do guardian preferem `"on-request"` quando permitido.                                                                                                                                                                                                                                                |
| `sandbox`                                     | `"danger-full-access"` ou um sandbox permitido do guardian | Modo de sandbox nativo do Codex enviado ao início/retomada da thread. Os padrões do guardian preferem `"workspace-write"` quando permitido; caso contrário, `"read-only"`. Quando um sandbox do OpenClaw está ativo, turnos com `danger-full-access` usam `workspace-write` do Codex, com acesso à rede derivado da configuração de saída do sandbox do OpenClaw. |
| `approvalsReviewer`                           | `"user"` ou um revisor permitido do guardian           | Use `"auto_review"` para permitir que o Codex revise solicitações de aprovação nativas quando permitido; caso contrário, use `guardian_subagent` ou `user`. `guardian_subagent` continua sendo um alias legado.                                                                                                                                                                                    |
| `serviceTier`                                 | não definido                                           | Nível de serviço opcional do app-server do Codex. `"priority"` habilita o roteamento em modo rápido, `"flex"` solicita processamento flexível, `null` remove a substituição e o valor legado `"fast"` é aceito como `"priority"`.                                                                                                                                                                  |
| `networkProxy`                                | desabilitado                                           | Ativa a rede do perfil de permissões do Codex para comandos do app-server. O OpenClaw define a configuração `permissions.<profile>.network` selecionada e a seleciona com `default_permissions`, em vez de enviar `sandbox`.                                                                                                                                                                        |
| `experimental.sandboxExecServer`              | `false`                                                | Opção de prévia que registra um ambiente do Codex baseado no sandbox do OpenClaw no app-server compatível do Codex, para que a execução nativa do Codex possa ocorrer dentro do sandbox ativo do OpenClaw.                                                                                                                                                                                         |

`appServer.networkProxy` é explícito porque altera o contrato de sandbox do
Codex. Quando habilitado, o OpenClaw também define `features.network_proxy.enabled`
e `default_permissions` na configuração da thread do Codex para que o perfil de
permissões gerado possa iniciar a rede gerenciada pelo Codex. Por padrão, o OpenClaw
gera um nome de perfil `openclaw-network-<fingerprint>` resistente a colisões
a partir do corpo do perfil; use `profileName` somente quando um nome local estável
for necessário.

```json5
{
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
}
```

Se o runtime normal do app-server fosse `danger-full-access`, habilitar
`networkProxy` usa acesso ao sistema de arquivos no estilo de workspace para o
perfil de permissões gerado: a imposição de rede gerenciada pelo Codex usa rede
em sandbox, portanto um perfil de acesso total não protegeria o tráfego de saída.
Entradas de domínio usam `allow` ou `deny`; entradas de soquete Unix usam os
valores `allow` ou `none` do Codex.

### Tempos limite de chamadas dinâmicas de ferramentas

As chamadas dinâmicas de ferramentas pertencentes ao OpenClaw têm limites
independentes de `appServer.requestTimeoutMs`: as solicitações
`item/tool/call` do Codex usam, por padrão, um watchdog do OpenClaw de 90
segundos. Um argumento positivo `timeoutMs` por chamada aumenta ou reduz o
limite específico dessa ferramenta, limitado a 600000 ms. A ferramenta
`image_generate` usa `agents.defaults.imageGenerationModel.timeoutMs`
quando a chamada da ferramenta não fornece seu próprio tempo limite ou, caso
contrário, um padrão de geração de imagens de 120 segundos. A ferramenta
`image` de compreensão de mídia usa `tools.media.image.timeoutSeconds` ou seu
padrão de mídia de 60 segundos; para compreensão de imagens, esse tempo limite
se aplica à própria solicitação e não é reduzido pelo trabalho de preparação
anterior. Quando o tempo limite se esgota, o OpenClaw aborta o sinal da ferramenta
quando houver suporte e retorna ao Codex uma resposta de ferramenta dinâmica com
falha, para que o turno possa continuar em vez de deixar a sessão em `processing`.
Esse watchdog é o limite externo da chamada dinâmica `item/tool/call`; tempos
limite de solicitação específicos do provedor são executados dentro dessa chamada
e mantêm sua própria semântica de tempo limite.

Depois que o Codex aceita um turno e depois que o OpenClaw responde a uma
solicitação do app-server com escopo de turno, o harness espera que o Codex
progrida no turno atual e, por fim, conclua o turno nativo com `turn/completed`.
Se o app-server ficar inativo por `appServer.turnCompletionIdleTimeoutMs`, o
OpenClaw tenta interromper o turno do Codex, registra um tempo limite de
diagnóstico e libera a faixa de sessão do OpenClaw para que mensagens de chat
subsequentes não fiquem enfileiradas atrás de um turno nativo obsoleto. A maioria
das notificações não terminais do mesmo turno desarma esse watchdog curto porque
o Codex comprovou que o turno ainda está ativo.

Transferências de controle de ferramentas usam um limite de inatividade
pós-ferramenta mais longo: depois que o OpenClaw retorna uma resposta
`item/tool/call`, depois que itens de ferramenta nativos como
`commandExecution` são concluídos, depois de conclusões brutas
`custom_tool_call_output` e depois de progresso bruto do assistente
pós-ferramenta, conclusões brutas de raciocínio ou progresso de raciocínio. A
proteção usa `appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando
configurado e, caso contrário, adota cinco minutos como padrão; esse mesmo limite
também estende o watchdog de progresso durante a janela silenciosa de síntese
antes que o Codex emita o próximo evento do turno atual. Notificações globais do
app-server, como atualizações de limite de taxa, não redefinem o progresso de
inatividade do turno. Conclusões de raciocínio, conclusões de `agentMessage` de
comentário e progresso bruto do raciocínio ou do assistente anterior à ferramenta
podem ser seguidos por uma resposta final automática, portanto usam a proteção de
resposta pós-progresso em vez de liberar imediatamente a faixa de sessão.

Somente itens `agentMessage` concluídos finais/não relacionados a comentários e
conclusões brutas do assistente anteriores à ferramenta armam a liberação por
saída do assistente: se o Codex ficar inativo em seguida sem `turn/completed`, o
OpenClaw tenta interromper o turno nativo e libera a faixa de sessão. Se outro
monitoramento de turno vencer a disputa por essa liberação, o OpenClaw ainda
aceitará o item final concluído do assistente quando nenhuma solicitação, item ou
conclusão de ferramenta dinâmica nativa permanecer ativa e a liberação por saída
do assistente ainda pertencer ao item concluído mais recente, sem conclusão de
item posterior. Isso pode preservar a resposta final depois da conclusão do
trabalho de ferramenta sem reproduzir o turno. Deltas parciais do assistente,
respostas anteriores obsoletas e conclusões posteriores vazias não se qualificam.

Falhas do app-server stdio que permitem repetição segura, incluindo tempos limite
de conclusão de turno sem evidência de assistente, ferramenta, item ativo ou
efeito colateral, são repetidas uma vez em uma nova tentativa do app-server.
Tempos limite inseguros ainda desativam o cliente do app-server travado e liberam
a faixa de sessão do OpenClaw; eles também removem a vinculação obsoleta da thread
nativa em vez de serem repetidos automaticamente. Tempos limite do monitoramento
de conclusão exibem texto de tempo limite específico do Codex: casos que permitem
repetição segura informam que a resposta pode estar incompleta, enquanto casos
inseguros orientam o usuário a verificar o estado atual antes de tentar novamente.
Os diagnósticos públicos de tempo limite incluem campos estruturais, como o
método da última notificação do app-server, o ID/tipo/papel do item bruto de
resposta do assistente, as contagens de solicitações/itens ativos e o estado do
monitoramento armado; quando a última notificação é um item bruto de resposta do
assistente, eles também incluem uma prévia limitada do texto do assistente. Eles
não incluem o conteúdo bruto do prompt nem da ferramenta.

### Substituições de ambiente para testes locais

- `OPENCLAW_CODEX_APP_SERVER_BIN` ignora o binário gerenciado quando
  `appServer.command` não está definido.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removido. Em vez disso, use
`plugins.entries.codex.config.appServer.mode: "guardian"` ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A
configuração é preferível para implantações reproduzíveis porque mantém o
comportamento do plugin no mesmo arquivo revisado que o restante da configuração
do harness do Codex.

## Plugins nativos do Codex

O suporte a plugins nativos do Codex usa os próprios recursos de apps e plugins
do app-server do Codex na mesma thread do Codex que o turno do harness do
OpenClaw. O OpenClaw não converte plugins do Codex em ferramentas dinâmicas
sintéticas `codex_plugin_*` do OpenClaw.

`codexPlugins` afeta somente sessões que selecionam o harness nativo do Codex.
Ele não tem efeito sobre execuções do harness integrado, execuções normais do
provedor OpenAI, vinculações de conversas ACP nem outros harnesses.

Configuração mínima migrada:

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

A configuração de apps da thread é calculada quando o OpenClaw estabelece uma
sessão do harness do Codex ou substitui uma vinculação obsoleta de thread do
Codex; ela não é recalculada a cada turno. Depois de alterar `codexPlugins`, use
`/new`, `/reset` ou reinicie o Gateway para que sessões futuras do harness do
Codex sejam iniciadas com o conjunto de apps atualizado.

Para elegibilidade de migração, inventário de apps, política de ações
destrutivas, elicitações e diagnósticos de plugins nativos, consulte
[Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins).

O acesso a apps e plugins do lado da OpenAI é controlado pela conta conectada do
Codex e, para workspaces Business e Enterprise/Edu, pelos controles de apps do
workspace. Consulte
[Como usar o Codex com seu plano do ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para obter a visão geral da OpenAI sobre controles de conta e workspace.

## Uso do computador

O Uso do Computador tem seu próprio guia de configuração:
[Uso do Computador com Codex](/pt-BR/plugins/codex-computer-use).

Versão resumida: o OpenClaw não incorpora o app de controle de desktop nem
executa ações de desktop por conta própria. Ele prepara o app-server do Codex,
verifica se o servidor MCP `computer-use` está disponível e então permite que o
Codex controle as chamadas de ferramenta MCP nativas durante turnos no modo
Codex.

## Limites do runtime

O harness do Codex altera apenas o executor de agente incorporado de baixo nível.

- Há suporte a ferramentas dinâmicas do OpenClaw. O Codex solicita que o OpenClaw
  execute essas ferramentas, portanto o OpenClaw permanece no caminho de execução.
- Shell, patch, MCP e ferramentas nativas de apps do Codex pertencem ao Codex. O
  OpenClaw pode observar ou bloquear eventos nativos selecionados por meio do
  relay compatível, mas não reescreve argumentos de ferramentas nativas.
- O Codex controla a Compaction nativa. O OpenClaw mantém um espelho da transcrição
  para o histórico do canal, pesquisa, `/new`, `/reset` e futuras trocas de modelo
  ou harness, mas não substitui a Compaction do Codex por um sumarizador do
  OpenClaw ou do mecanismo de contexto.
- Geração de mídia, compreensão de mídia, TTS, aprovações e saída de ferramentas
  de mensagens continuam passando pelas configurações correspondentes de
  provedor/modelo do OpenClaw.
- `tool_result_persist` se aplica aos resultados de ferramentas da transcrição
  pertencentes ao OpenClaw, não aos registros de resultados de ferramentas
  nativas do Codex.

Para camadas de hooks, superfícies V1 compatíveis, tratamento de permissões
nativas, direcionamento de filas, mecânica de upload de feedback do Codex e
detalhes da Compaction, consulte
[Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime).

## Solução de problemas

**O Codex não aparece como um provedor normal em `/model`:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui `codex`.

**O OpenClaw usa o harness integrado em vez do Codex:** confirme que a rota
efetiva é uma rota oficial HTTPS exata de Platform Responses ou ChatGPT
Responses, que não tem substituição de solicitação definida pelo autor e que o
plugin Codex está instalado e habilitado. O prefixo `openai/gpt-*` por si só não
é suficiente. Para comprovação rigorosa durante os testes, defina
`agentRuntime.id: "codex"` no provedor ou modelo; o Codex forçado falha em vez
de recorrer a fallback quando a rota ou o harness são incompatíveis.

**O runtime OpenAI Codex recorre ao caminho de chave de API:** colete um trecho
com dados sensíveis removidos do Gateway que mostre o modelo, o runtime, o
provedor selecionado e a falha. Peça aos colaboradores afetados que executem
este comando somente leitura no host do OpenClaw:

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

Trechos úteis geralmente incluem `openai/gpt-5.6-sol` ou
`openai/gpt-5.6-luna`, `Runtime: OpenAI Codex`, `agentRuntime.id` ou
`harnessRuntime`, `candidateProvider: "openai"` e um resultado `401`,
`Incorrect API key` ou `No API key`. Uma execução corrigida deve mostrar o
caminho OAuth da OpenAI em vez de uma falha simples de chave de API da OpenAI.

**A configuração de referências de modelos legados do Codex permanece:** execute
`openclaw doctor --fix`. O Doctor reescreve referências de modelos legados para
`openai/*`, remove fixações obsoletas de runtime de sessão e de agente inteiro e
preserva substituições existentes de perfis de autenticação.

**O app-server é rejeitado:** use o app-server do Codex `0.143.0` ou mais recente.
Pré-lançamentos da mesma versão ou versões com sufixo de compilação, como
`0.143.0-alpha.2` ou `0.143.0+custom`, são rejeitados porque o OpenClaw testa o
limite mínimo do protocolo estável `0.143.0`.

**`/codex status` não consegue se conectar:** verifique se o plugin `codex`
está habilitado, se `plugins.allow` o inclui quando uma lista de permissões está
configurada e se qualquer `appServer.command`, `url`, `authToken` ou cabeçalhos
personalizados são válidos.

**A descoberta de modelos está lenta:** reduza
`plugins.entries.codex.config.discovery.timeoutMs` ou desabilite a descoberta.
Consulte [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference#model-discovery).

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`,
`authToken`, os cabeçalhos e se o app-server remoto usa a mesma versão do
protocolo do app-server do Codex.

**As ferramentas nativas de shell ou patch estão bloqueadas com `Native hook relay
unavailable`:** a thread do Codex ainda está tentando usar um id de retransmissão de hook nativo
que o OpenClaw não tem mais registrado. Esse é um problema de transporte de hook
nativo do Codex, não uma falha do backend ACP, do provedor, do GitHub ou de comandos
do shell. Inicie uma nova sessão no chat afetado com `/new` ou `/reset`
e tente novamente um comando inofensivo. Se isso funcionar uma vez, mas a próxima chamada de ferramenta
nativa falhar novamente, trate `/new` apenas como uma solução temporária: copie o
prompt para uma nova sessão após reiniciar o app-server do Codex ou o
Gateway do OpenClaw, para que as threads antigas sejam descartadas e os registros de hooks nativos
sejam recriados.

**Um modelo que não é do Codex usa o harness integrado:** isso é esperado, a menos que a política de
runtime do provedor ou do modelo o direcione para outro harness. Referências simples de provedores
que não são da OpenAI permanecem no caminho normal do provedor no modo `auto`.

**O Computer Use está instalado, mas as ferramentas não são executadas:** verifique
`/codex computer-use status` em uma nova sessão. Se uma ferramenta informar
`Native hook relay unavailable`, use a recuperação da retransmissão de hook nativo descrita acima.
Consulte [Computer Use do Codex](/pt-BR/plugins/codex-computer-use#troubleshooting).

## Relacionados

- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Supervisão do Codex](/plugins/codex-supervision)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Computer Use do Codex](/pt-BR/plugins/codex-computer-use)
- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Ajuda do OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de harness de agentes](/pt-BR/plugins/sdk-agent-harness)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Status](/pt-BR/cli/status)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
