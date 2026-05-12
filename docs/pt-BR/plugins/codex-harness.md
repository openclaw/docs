---
read_when:
    - Você quer usar a estrutura de servidor do app Codex incluída
    - Você precisa de exemplos de configuração do ambiente de execução do Codex
    - Você quer que implantações somente com Codex falhem em vez de recorrer ao PI
summary: Execute turnos de agente incorporado do OpenClaw por meio da estrutura app-server do Codex incluída no pacote
title: Ambiente do Codex
x-i18n:
    generated_at: "2026-05-12T00:59:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

O plugin `codex` incluído permite que o OpenClaw execute turnos de agente OpenAI incorporados
por meio do app-server Codex em vez do harness PI integrado.

Use o harness Codex quando quiser que o Codex seja responsável pela sessão de agente de baixo nível:
retomada nativa de thread, continuação nativa de ferramenta, compaction nativa e
execução no app-server. O OpenClaw ainda é responsável pelos canais de chat, arquivos de sessão, seleção de modelo,
ferramentas dinâmicas do OpenClaw, aprovações, entrega de mídia e o espelho visível
da transcrição.

A configuração normal usa referências canônicas de modelo OpenAI, como `openai/gpt-5.5`.
Não configure referências de modelo `openai-codex/gpt-*`. Coloque a ordem de autenticação do agente OpenAI
em `auth.order.openai`; perfis `openai-codex:*` mais antigos e
entradas `auth.order.openai-codex` continuam compatíveis com instalações existentes.

O OpenClaw inicia threads do app-server Codex com o modo de código nativo do Codex e
com somente modo de código habilitado. Isso mantém as ferramentas dinâmicas deferidas/pesquisáveis do OpenClaw
dentro da própria execução de código e superfície de busca de ferramentas do Codex, em vez de adicionar um
wrapper de busca de ferramentas no estilo PI sobre o Codex.

Para a divisão mais ampla entre modelo/provedor/runtime, comece por
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a referência do modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## Requisitos

- OpenClaw com o plugin `codex` incluído disponível.
- Se a sua configuração usa `plugins.allow`, inclua `codex`.
- App-server Codex `0.125.0` ou mais recente. O plugin incluído gerencia um binário
  compatível do app-server Codex por padrão, portanto comandos locais `codex` em `PATH` não
  afetam a inicialização normal do harness.
- Autenticação Codex disponível por meio de `openclaw models auth login --provider openai-codex`,
  uma conta de app-server no diretório Codex do agente ou um perfil explícito de autenticação Codex
  com chave de API.

Para precedência de autenticação, isolamento de ambiente, comandos personalizados do app-server, descoberta de modelo
e todos os campos de configuração, consulte
[Referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Início rápido

A maioria dos usuários que quer Codex no OpenClaw quer este caminho: entrar com uma
assinatura ChatGPT/Codex, habilitar o plugin `codex` incluído e usar uma
referência canônica de modelo `openai/gpt-*`.

Entre com OAuth do Codex:

```bash
openclaw models auth login --provider openai-codex
```

Habilite o plugin `codex` incluído e selecione um modelo de agente OpenAI:

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

Se a sua configuração usa `plugins.allow`, adicione `codex` lá também:

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

Reinicie o Gateway depois de alterar a configuração de plugin. Se um chat existente já
tem uma sessão, use `/new` ou `/reset` antes de testar alterações de runtime para que o próximo
turno resolva o harness a partir da configuração atual.

## Configuração

A configuração de início rápido é a configuração mínima viável do harness Codex. Defina opções do
harness Codex na configuração do OpenClaw e use a CLI somente para autenticação do Codex:

| Necessidade                            | Defina                                                                           | Onde                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar o harness                    | `plugins.entries.codex.enabled: true`                                            | Configuração do OpenClaw           |
| Manter uma instalação de plugin permitida | Inclua `codex` em `plugins.allow`                                             | Configuração do OpenClaw           |
| Rotear turnos de agente OpenAI pelo Codex | `agents.defaults.model` ou `agents.list[].model` como `openai/gpt-*`          | Configuração de agente do OpenClaw |
| Entrar com OAuth do Codex              | `openclaw models auth login --provider openai-codex`                             | Perfil de autenticação da CLI      |
| Adicionar backup de chave de API para execuções Codex | Perfil de chave de API `openai:*` listado após autenticação por assinatura em `auth.order.openai` | Perfil de autenticação da CLI + configuração do OpenClaw |
| Falhar de forma fechada quando o Codex estiver indisponível | `agentRuntime.id: "codex"` de provedor ou modelo                    | Configuração de modelo/provedor do OpenClaw |
| Usar tráfego direto da API OpenAI      | `agentRuntime.id: "pi"` de provedor ou modelo com autenticação OpenAI normal     | Configuração de modelo/provedor do OpenClaw |
| Ajustar comportamento do app-server    | `plugins.entries.codex.config.appServer.*`                                       | Configuração do plugin Codex       |
| Habilitar aplicativos de plugin nativos do Codex | `plugins.entries.codex.config.codexPlugins.*`                            | Configuração do plugin Codex       |
| Habilitar Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configuração do plugin Codex       |

Use referências de modelo `openai/gpt-*` para turnos de agente OpenAI com backend Codex. Prefira
`auth.order.openai` para ordenação assinatura-primeiro/chave-de-API-como-backup. Perfis de autenticação
`openai-codex:*` existentes e `auth.order.openai-codex` continuam válidos, mas
não escreva novas referências de modelo `openai-codex/gpt-*`.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Nesse formato, ambos os perfis ainda rodam por meio do Codex para turnos de agente
`openai/gpt-*`. A chave de API é apenas uma alternativa de autenticação, não uma solicitação para trocar para PI ou
OpenAI Responses simples.

O restante desta página cobre variantes comuns entre as quais os usuários precisam escolher:
forma de implantação, roteamento com falha fechada, política de aprovação de guardião, plugins nativos do Codex
e Computer Use. Para listas completas de opções, padrões, enums, descoberta,
isolamento de ambiente, timeouts e campos de transporte do app-server, consulte
[Referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Verificar runtime Codex

Use `/status` no chat em que você espera Codex. Um turno de agente OpenAI com backend Codex
mostra:

```text
Runtime: OpenAI Codex
```

Depois verifique o estado do app-server Codex:

```text
/codex status
/codex models
```

`/codex status` informa conectividade do app-server, conta, limites de taxa, servidores MCP
e skills. `/codex models` lista o catálogo ativo do app-server Codex para
o harness e a conta. Se `/status` for inesperado, consulte
[Solução de problemas](#troubleshooting).

## Roteamento e seleção de modelo

Mantenha referências de provedor e política de runtime separadas:

- Use `openai/gpt-*` para turnos de agente OpenAI por meio do Codex.
- Não use `openai-codex/gpt-*` na configuração. Execute `openclaw doctor --fix` para
  reparar referências legadas e pins obsoletos de rota de sessão.
- `agentRuntime.id: "codex"` é opcional no modo automático OpenAI normal, mas útil
  quando uma implantação deve falhar de forma fechada se o Codex estiver indisponível.
- `agentRuntime.id: "pi"` coloca um provedor ou modelo no comportamento PI direto quando
  isso é intencional.
- `/codex ...` controla conversas nativas do app-server Codex a partir do chat.
- ACP/acpx é um caminho separado de harness externo. Use-o somente quando o usuário pedir
  ACP/acpx ou um adaptador de harness externo.

Roteamento de comandos comuns:

| Intenção do usuário             | Use                                     |
| ------------------------------- | --------------------------------------- |
| Anexar o chat atual             | `/codex bind [--cwd <path>]`            |
| Retomar uma thread Codex existente | `/codex resume <thread-id>`          |
| Listar ou filtrar threads Codex | `/codex threads [filter]`               |
| Enviar somente feedback do Codex | `/codex diagnostics [note]`            |
| Iniciar uma tarefa ACP/acpx     | Comandos de sessão ACP/acpx, não `/codex` |

| Caso de uso                                           | Configure                                                        | Verifique                               | Observações                        |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Assinatura ChatGPT/Codex com runtime Codex nativo    | `openai/gpt-*` mais plugin `codex` habilitado                    | `/status` mostra `Runtime: OpenAI Codex` | Caminho recomendado                |
| Falhar de forma fechada se o Codex estiver indisponível | `agentRuntime.id: "codex"` de provedor ou modelo              | O turno falha em vez de fallback para PI | Use para implantações somente Codex |
| Tráfego direto com chave de API OpenAI por meio de PI | `agentRuntime.id: "pi"` de provedor ou modelo e autenticação OpenAI normal | `/status` mostra runtime PI             | Use somente quando PI for intencional |
| Configuração legada                                  | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` a reescreve     | Não escreva nova configuração assim |
| Adaptador Codex ACP/acpx                             | ACP `sessions_spawn({ runtime: "acp" })`                         | Status de tarefa/sessão ACP             | Separado do harness Codex nativo   |

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use `openai/gpt-*`
para a rota OpenAI normal e `codex/gpt-*` somente quando o entendimento de imagem
deve rodar por meio de um turno limitado do app-server Codex. Não use
`openai-codex/gpt-*`; doctor reescreve esse prefixo legado para `openai/gpt-*`.

## Padrões de implantação

### Implantação básica do Codex

Use a configuração de início rápido quando todos os turnos de agente OpenAI devem usar Codex por
padrão.

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

Este formato mantém Claude como o agente padrão e adiciona um agente Codex nomeado:

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

Com esta configuração, o agente `main` usa seu caminho de provedor normal e o
agente `codex` usa o app-server Codex.

### Implantação Codex com falha fechada

Para turnos de agente OpenAI, `openai/gpt-*` já resolve para Codex quando o
plugin incluído está disponível. Adicione política explícita de runtime quando quiser uma regra escrita
de falha fechada:

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

Com Codex forçado, o OpenClaw falha cedo se o plugin Codex estiver desabilitado, se o
app-server for antigo demais ou se o app-server não puder iniciar.

## Política do app-server

Por padrão, o plugin inicia o binário Codex gerenciado pelo OpenClaw localmente com transporte
stdio. Defina `appServer.command` somente quando quiser intencionalmente executar um
executável diferente. Use transporte WebSocket somente quando um app-server já estiver
em execução em outro lugar:

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

Sessões locais de app-server via stdio usam por padrão a postura de operador local confiável:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se os requisitos locais do Codex não permitirem essa
postura YOLO implícita, o OpenClaw seleciona permissões de guardião permitidas em vez disso.
Quando um sandbox do OpenClaw está ativo para a sessão, o OpenClaw restringe
`danger-full-access` do Codex para `workspace-write` do Codex, para que as rodadas nativas
do modo de código do Codex permaneçam dentro do workspace em sandbox.

Use o modo guardião quando quiser autoavaliação nativa do Codex antes de escapes do sandbox
ou permissões extras:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

O modo guardião se expande para aprovações de app-server do Codex, geralmente
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando os requisitos locais permitem esses valores.

Para todos os campos de app-server, ordem de autenticação, isolamento de ambiente, descoberta e
comportamento de timeout, consulte a [referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Comandos e diagnósticos

O Plugin incluído registra `/codex` como um comando de barra em qualquer canal que
ofereça suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` verifica conectividade do app-server, modelos, conta, limites de taxa,
  servidores MCP e Skills.
- `/codex models` lista modelos ativos do app-server do Codex.
- `/codex threads [filter]` lista threads recentes do app-server do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma
  thread existente do Codex.
- `/codex compact` pede ao app-server do Codex para compactar a thread anexada.
- `/codex review` inicia a avaliação nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pergunta antes de enviar feedback do Codex para a
  thread anexada.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do app-server do Codex.
- `/codex skills` lista as Skills do app-server do Codex.

Para a maioria dos relatórios de suporte, comece com `/diagnostics [note]` na conversa
em que o bug ocorreu. Ele cria um relatório de diagnóstico do Gateway e, para sessões do
harness do Codex, pede aprovação para enviar o pacote de feedback relevante do Codex.
Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para ver o modelo de privacidade e o comportamento em
chats em grupo.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o upload de
feedback do Codex para a thread atualmente anexada, sem o pacote completo de diagnósticos do
Gateway.

### Inspecionar threads do Codex localmente

A maneira mais rápida de inspecionar uma execução ruim do Codex geralmente é abrir a thread nativa do Codex
diretamente:

```bash
codex resume <thread-id>
```

Obtenha o id da thread na resposta concluída de `/diagnostics`, em `/codex binding` ou em
`/codex threads [filter]`.

Para mecanismos de upload e limites de diagnóstico no nível de runtime, consulte
[runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime#codex-feedback-upload).

A autenticação é selecionada nesta ordem:

1. Perfis de autenticação OpenAI ordenados para o agente, preferencialmente em
   `auth.order.openai`. Ids de perfis `openai-codex:*` existentes continuam válidos.
2. A conta existente do app-server no Codex home desse agente.
3. Somente para inicializações locais de app-server via stdio, `CODEX_API_KEY` e depois
   `OPENAI_API_KEY`, quando nenhuma conta de app-server estiver presente e a autenticação da OpenAI
   ainda for necessária.

Quando o OpenClaw detecta um perfil de autenticação do Codex no estilo assinatura do ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho do Codex iniciado. Isso
mantém chaves de API no nível do Gateway disponíveis para embeddings ou modelos diretos da OpenAI
sem fazer com que rodadas nativas do app-server do Codex sejam cobradas pela API por acidente.
Perfis explícitos de chave de API do Codex e fallback de chave de ambiente via stdio local usam login do app-server
em vez de ambiente herdado do processo filho. Conexões de app-server via WebSocket
não recebem fallback de chave de API de ambiente do Gateway; use um perfil de autenticação explícito ou a
conta própria do app-server remoto.

Se um perfil de assinatura atingir um limite de uso do Codex, o OpenClaw registra o horário de redefinição
quando o Codex informa um e tenta o próximo perfil de autenticação ordenado para a mesma
execução do Codex. Quando o horário de redefinição passa, o perfil de assinatura volta a ser elegível
sem alterar o modelo `openai/gpt-*` selecionado nem o runtime do Codex.

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

`appServer.clearEnv` afeta apenas o processo filho do app-server do Codex iniciado.

Ferramentas dinâmicas do Codex usam por padrão o carregamento `searchable`. O OpenClaw não expõe
ferramentas dinâmicas que duplicam operações nativas de workspace do Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. As demais ferramentas de
integração do OpenClaw, como mensagens, sessões, mídia, cron, navegador, nós,
gateway, `heartbeat_respond` e `web_search`, ficam disponíveis por meio da busca de ferramentas do Codex
no namespace `openclaw`, mantendo menor o contexto inicial do modelo.
`sessions_yield` e respostas de origem somente por ferramenta de mensagem permanecem diretas porque esses
são contratos de controle de rodada. As instruções de colaboração de Heartbeat dizem ao Codex para
procurar `heartbeat_respond` antes de encerrar uma rodada de heartbeat quando a ferramenta
ainda não estiver carregada.

Defina `codexDynamicToolsLoading: "direct"` somente ao conectar a um app-server personalizado do Codex
que não consegue buscar ferramentas dinâmicas adiadas ou ao depurar o payload completo de
ferramentas.

Campos de nível superior compatíveis do Plugin do Codex:

| Campo                      | Padrão        | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Use `"direct"` para colocar ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir das rodadas do app-server do Codex.              |
| `codexPlugins`             | desabilitado       | Suporte nativo a Plugin/app do Codex para Plugins selecionados migrados instalados a partir do código-fonte.           |

Campos `appServer` compatíveis:

| Campo                         | Padrão                                                | Significado                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                                |
| `command`                     | binário gerenciado do Codex                                   | Executável para transporte stdio. Deixe sem definir para usar o binário gerenciado; defina somente para uma substituição explícita.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                          |
| `url`                         | não definido                                                  | URL do app-server WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | não definido                                                  | Token Bearer para transporte WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Cabeçalhos WebSocket extras.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Nomes de variáveis de ambiente extras removidos do processo app-server stdio iniciado depois que o OpenClaw cria seu ambiente herdado. `CODEX_HOME` e `HOME` são reservados para o isolamento por agente do Codex do OpenClaw em inicializações locais.    |
| `requestTimeoutMs`            | `60000`                                                | Timeout para chamadas de plano de controle do app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Janela silenciosa depois de uma solicitação ao app-server do Codex com escopo de rodada enquanto o OpenClaw aguarda `turn/completed`. Aumente isso para fases lentas de síntese pós-ferramenta ou somente de status.                                                                     |
| `mode`                        | `"yolo"` a menos que os requisitos locais do Codex não permitam YOLO | Predefinição para execução YOLO ou revisada por guardião. Requisitos locais de stdio que omitem `danger-full-access`, aprovação `never` ou o revisor `user` tornam o padrão implícito guardião.                                                   |
| `approvalPolicy`              | `"never"` ou uma política de aprovação de guardião permitida       | Política de aprovação nativa do Codex enviada para início/retomada/rodada da thread. Padrões de guardião preferem `"on-request"` quando permitido.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` ou um sandbox de guardião permitido  | Modo de sandbox nativo do Codex enviado para início/retomada da thread. Padrões de guardião preferem `"workspace-write"` quando permitido, caso contrário `"read-only"`. Quando um sandbox do OpenClaw está ativo, `danger-full-access` é restringido para `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` ou um revisor de guardião permitido               | Use `"auto_review"` para permitir que o Codex avalie prompts de aprovação nativos quando permitido; caso contrário, `guardian_subagent` ou `user`. `guardian_subagent` permanece um alias legado.                                                                      |
| `serviceTier`                 | não definido                                                  | Camada de serviço opcional do app-server do Codex. `"priority"` habilita roteamento em modo rápido, `"flex"` solicita processamento flex, `null` limpa a substituição, e o legado `"fast"` é aceito como `"priority"`.                                         |

OpenClaw-owned dynamic tool calls are bounded independently from
`appServer.requestTimeoutMs`: Codex `item/tool/call` requests use a 30 second
OpenClaw watchdog by default. A positive per-call `timeoutMs` argument extends
or shortens that specific tool budget. The `image_generate` tool also uses
`agents.defaults.imageGenerationModel.timeoutMs` when the tool call does not
provide its own timeout, and the media-understanding `image` tool uses
`tools.media.image.timeoutSeconds` or its 60 second media default. Dynamic tool
budgets are capped at 600000 ms. On timeout, OpenClaw aborts the tool signal
where supported and returns a failed dynamic-tool response to Codex so the turn
can continue instead of leaving the session in `processing`.

After OpenClaw responds to a Codex turn-scoped app-server request, the harness
also expects Codex to finish the native turn with `turn/completed`. If the
app-server goes quiet for `appServer.turnCompletionIdleTimeoutMs` after that
response, OpenClaw best-effort interrupts the Codex turn, records a diagnostic
timeout, and releases the OpenClaw session lane so follow-up chat messages are
not queued behind a stale native turn. Any non-terminal notification for the
same turn, including `rawResponseItem/completed`, disarms that short watchdog
because Codex has proven the turn is still alive; the longer terminal watchdog
continues to protect genuinely stuck turns. Timeout diagnostics include the
last app-server notification method and, for raw assistant response items, the
item type, role, id, and a bounded assistant text preview.

Environment overrides remain available for local testing:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bypasses the managed binary when
`appServer.command` is unset.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` was removed. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` instead, or
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` for one-off local testing. Config is
preferred for repeatable deployments because it keeps the plugin behavior in the
same reviewed file as the rest of the Codex harness setup.

## Native Codex plugins

Native Codex plugin support uses Codex app-server's own app and plugin
capabilities in the same Codex thread as the OpenClaw harness turn. OpenClaw
does not translate Codex plugins into synthetic `codex_plugin_*` OpenClaw
dynamic tools.

`codexPlugins` affects only sessions that select the native Codex harness. It
has no effect on PI runs, normal OpenAI provider runs, ACP conversation
bindings, or other harnesses.

Minimal migrated config:

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

Thread app config is computed when OpenClaw establishes a Codex harness session
or replaces a stale Codex thread binding. It is not recomputed on every turn.
After changing `codexPlugins`, use `/new`, `/reset`, or restart the gateway so
future Codex harness sessions start with the updated app set.

For migration eligibility, app inventory, destructive action policy,
elicitations, and native plugin diagnostics, see
[Native Codex plugins](/pt-BR/plugins/codex-native-plugins).

## Computer Use

Computer Use is covered in its own setup guide:
[Codex Computer Use](/pt-BR/plugins/codex-computer-use).

The short version: OpenClaw does not vendor the desktop-control app or execute
desktop actions itself. It prepares Codex app-server, verifies that the
`computer-use` MCP server is available, and then lets Codex own the native MCP
tool calls during Codex-mode turns.

## Runtime boundaries

The Codex harness changes the low-level embedded agent executor only.

- OpenClaw dynamic tools are supported. Codex asks OpenClaw to execute those
  tools, so OpenClaw remains in the execution path.
- Codex-native shell, patch, MCP, and native app tools are owned by Codex.
  OpenClaw can observe or block selected native events through the supported
  relay, but it does not rewrite native tool arguments.
- Codex owns native compaction. OpenClaw keeps a transcript mirror for channel
  history, search, `/new`, `/reset`, and future model or harness switching.
- Media generation, media understanding, TTS, approvals, and messaging-tool
  output continue through the matching OpenClaw provider/model settings.
- `tool_result_persist` applies to OpenClaw-owned transcript tool results, not
  Codex-native tool result records.

For hook layers, supported V1 surfaces, native permission handling, queue
steering, Codex feedback upload mechanics, and compaction details, see
[Codex harness runtime](/pt-BR/plugins/codex-harness-runtime).

## Troubleshooting

**Codex does not appear as a normal `/model` provider:** that is expected for
new configs. Select an `openai/gpt-*` model, enable
`plugins.entries.codex.enabled`, and check whether `plugins.allow` excludes
`codex`.

**OpenClaw uses PI instead of Codex:** make sure the model ref is
`openai/gpt-*` on the official OpenAI provider and that the Codex plugin is
installed and enabled. If you need strict proof while testing, set provider or
model `agentRuntime.id: "codex"`. A forced Codex runtime fails instead of
falling back to PI.

**Legacy `openai-codex/*` config remains:** run `openclaw doctor --fix`.
Doctor rewrites legacy model refs to `openai/*`, removes stale session and
whole-agent runtime pins, and preserves existing auth-profile overrides.

**The app-server is rejected:** use Codex app-server `0.125.0` or newer.
Same-version prereleases or build-suffixed versions such as
`0.125.0-alpha.2` or `0.125.0+custom` are rejected because OpenClaw tests the
stable `0.125.0` protocol floor.

**`/codex status` cannot connect:** check that the bundled `codex` plugin is
enabled, that `plugins.allow` includes it when an allowlist is configured, and
that any custom `appServer.command`, `url`, `authToken`, or headers are valid.

**Model discovery is slow:** lower
`plugins.entries.codex.config.discovery.timeoutMs` or disable discovery. See
[Codex harness reference](/pt-BR/plugins/codex-harness-reference#model-discovery).

**WebSocket transport fails immediately:** check `appServer.url`, `authToken`,
headers, and that the remote app-server speaks the same Codex app-server
protocol version.

**A non-Codex model uses PI:** that is expected unless provider or model runtime
policy routes it to another harness. Plain non-OpenAI provider refs stay on
their normal provider path in `auto` mode.

**Computer Use is installed but tools do not run:** check
`/codex computer-use status` from a fresh session. If a tool reports
`Native hook relay unavailable`, use `/new` or `/reset`; if it persists, restart
the gateway to clear stale native hook registrations. See
[Codex Computer Use](/pt-BR/plugins/codex-computer-use#troubleshooting).

## Related

- [Codex harness reference](/pt-BR/plugins/codex-harness-reference)
- [Codex harness runtime](/pt-BR/plugins/codex-harness-runtime)
- [Native Codex plugins](/pt-BR/plugins/codex-native-plugins)
- [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
- [Agent runtimes](/pt-BR/concepts/agent-runtimes)
- [Model providers](/pt-BR/concepts/model-providers)
- [OpenAI provider](/pt-BR/providers/openai)
- [Agent harness plugins](/pt-BR/plugins/sdk-agent-harness)
- [Plugin hooks](/pt-BR/plugins/hooks)
- [Diagnostics export](/pt-BR/gateway/diagnostics)
- [Status](/pt-BR/cli/status)
- [Testing](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
