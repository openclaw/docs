---
read_when:
    - Você quer usar o ambiente de app-server Codex incluído
    - Você precisa de exemplos de configuração do ambiente de execução do Codex
    - Você quer que implantações somente com Codex falhem em vez de recorrerem ao PI
summary: Execute turnos de agente incorporado do OpenClaw pela infraestrutura de servidor de aplicativo do Codex incluída no pacote
title: Harness do Codex
x-i18n:
    generated_at: "2026-05-12T08:46:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

O Plugin `codex` incluído permite que o OpenClaw execute turnos de agente OpenAI incorporados
por meio do app-server Codex em vez do harness PI integrado.

Use o harness Codex quando você quiser que o Codex seja responsável pela sessão de agente de baixo nível:
retomada nativa de thread, continuação nativa de ferramenta, compaction nativa e
execução no app-server. O OpenClaw ainda é responsável pelos canais de chat, arquivos de sessão, seleção de modelo,
ferramentas dinâmicas do OpenClaw, aprovações, entrega de mídia e o espelho visível
da transcrição.

A configuração normal usa refs de modelo OpenAI canônicas, como `openai/gpt-5.5`.
Não configure refs de modelo `openai-codex/gpt-*`. Coloque a ordem de autenticação de agente OpenAI
em `auth.order.openai`; perfis `openai-codex:*` mais antigos e entradas
`auth.order.openai-codex` continuam compatíveis para instalações existentes.

O OpenClaw inicia threads do app-server Codex com o modo de código nativo do Codex e
apenas modo de código habilitado. Isso mantém as ferramentas dinâmicas do OpenClaw adiadas/pesquisáveis
dentro da própria execução de código e da superfície de busca de ferramentas do Codex, em vez de adicionar um
wrapper de busca de ferramentas no estilo PI por cima do Codex.

Para a divisão mais ampla entre modelo/provedor/runtime, comece por
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a ref do modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## Requisitos

- OpenClaw com o Plugin `codex` incluído disponível.
- Se sua configuração usa `plugins.allow`, inclua `codex`.
- App-server Codex `0.125.0` ou mais novo. O Plugin incluído gerencia um binário
  compatível do app-server Codex por padrão, então comandos `codex` locais no `PATH` não
  afetam a inicialização normal do harness.
- Autenticação Codex disponível por meio de `openclaw models auth login --provider openai-codex`,
  uma conta do app-server no diretório inicial Codex do agente ou um perfil explícito de autenticação
  por chave de API do Codex.

Para precedência de autenticação, isolamento de ambiente, comandos personalizados de app-server, descoberta de modelos
e todos os campos de configuração, consulte
[Referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Início rápido

A maioria dos usuários que quer Codex no OpenClaw quer este caminho: entrar com uma
assinatura ChatGPT/Codex, habilitar o Plugin `codex` incluído e usar uma
ref de modelo `openai/gpt-*` canônica.

Entre com OAuth do Codex:

```bash
openclaw models auth login --provider openai-codex
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

Se sua configuração usa `plugins.allow`, adicione `codex` lá também:

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

Reinicie o Gateway depois de alterar a configuração do Plugin. Se um chat existente já
tem uma sessão, use `/new` ou `/reset` antes de testar alterações de runtime para que o próximo
turno resolva o harness a partir da configuração atual.

## Configuração

A configuração de início rápido é a configuração mínima viável do harness Codex. Defina as opções do
harness Codex na configuração do OpenClaw e use a CLI apenas para autenticação Codex:

| Necessidade                            | Definir                                                                          | Onde                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar o harness                    | `plugins.entries.codex.enabled: true`                                            | Configuração do OpenClaw           |
| Manter uma instalação de Plugin permitida | Incluir `codex` em `plugins.allow`                                               | Configuração do OpenClaw           |
| Rotear turnos de agente OpenAI pelo Codex | `agents.defaults.model` ou `agents.list[].model` como `openai/gpt-*`             | Configuração de agente OpenClaw    |
| Entrar com OAuth do Codex              | `openclaw models auth login --provider openai-codex`                             | Perfil de autenticação da CLI      |
| Adicionar backup de chave de API para execuções Codex | Perfil de chave de API `openai:*` listado após autenticação por assinatura em `auth.order.openai` | Perfil de autenticação da CLI + configuração do OpenClaw |
| Falhar de forma fechada quando o Codex estiver indisponível | `agentRuntime.id: "codex"` no provedor ou modelo                                 | Configuração de modelo/provedor do OpenClaw |
| Usar tráfego direto da API OpenAI      | `agentRuntime.id: "pi"` no provedor ou modelo com autenticação OpenAI normal     | Configuração de modelo/provedor do OpenClaw |
| Ajustar comportamento do app-server    | `plugins.entries.codex.config.appServer.*`                                       | Configuração do Plugin Codex       |
| Habilitar apps de Plugin nativos do Codex | `plugins.entries.codex.config.codexPlugins.*`                                    | Configuração do Plugin Codex       |
| Habilitar Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configuração do Plugin Codex       |

Use refs de modelo `openai/gpt-*` para turnos de agente OpenAI com suporte do Codex. Prefira
`auth.order.openai` para ordenação com assinatura primeiro e chave de API como backup. Perfis de autenticação
`openai-codex:*` existentes e `auth.order.openai-codex` continuam válidos, mas
não escreva novas refs de modelo `openai-codex/gpt-*`.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Nesse formato, os dois perfis ainda executam pelo Codex para turnos de agente
`openai/gpt-*`. A chave de API é apenas um fallback de autenticação, não uma solicitação para mudar para PI ou
OpenAI Responses simples.

O restante desta página cobre variantes comuns entre as quais os usuários precisam escolher:
formato de implantação, roteamento fail-closed, política de aprovação do guardião, Plugins nativos do Codex
e Computer Use. Para listas completas de opções, padrões, enums, descoberta,
isolamento de ambiente, tempos limite e campos de transporte do app-server, consulte
[Referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Verificar o runtime Codex

Use `/status` no chat onde você espera Codex. Um turno de agente OpenAI com suporte do Codex
mostra:

```text
Runtime: OpenAI Codex
```

Depois verifique o estado do app-server Codex:

```text
/codex status
/codex models
```

`/codex status` relata conectividade do app-server, conta, limites de taxa, servidores MCP
e Skills. `/codex models` lista o catálogo ativo do app-server Codex para
o harness e a conta. Se `/status` for inesperado, consulte
[Solução de problemas](#troubleshooting).

## Roteamento e seleção de modelo

Mantenha refs de provedor e política de runtime separadas:

- Use `openai/gpt-*` para turnos de agente OpenAI pelo Codex.
- Não use `openai-codex/gpt-*` na configuração. Execute `openclaw doctor --fix` para
  reparar refs legadas e pins de rota de sessão obsoletos.
- `agentRuntime.id: "codex"` é opcional para o modo automático OpenAI normal, mas útil
  quando uma implantação deve falhar de forma fechada se o Codex estiver indisponível.
- `agentRuntime.id: "pi"` faz um provedor ou modelo optar pelo comportamento direto do PI quando
  isso é intencional.
- `/codex ...` controla conversas nativas do app-server Codex a partir do chat.
- ACP/acpx é um caminho separado de harness externo. Use-o apenas quando o usuário pedir
  ACP/acpx ou um adaptador de harness externo.

Roteamento comum de comandos:

| Intenção do usuário                 | Usar                                    |
| ----------------------------------- | --------------------------------------- |
| Anexar o chat atual                 | `/codex bind [--cwd <path>]`            |
| Retomar uma thread Codex existente  | `/codex resume <thread-id>`             |
| Listar ou filtrar threads Codex     | `/codex threads [filter]`               |
| Enviar apenas feedback Codex        | `/codex diagnostics [note]`             |
| Iniciar uma tarefa ACP/acpx         | Comandos de sessão ACP/acpx, não `/codex` |

| Caso de uso                                          | Configurar                                                       | Verificar                               | Observações                        |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Assinatura ChatGPT/Codex com runtime Codex nativo    | `openai/gpt-*` mais o Plugin `codex` habilitado                  | `/status` mostra `Runtime: OpenAI Codex` | Caminho recomendado                |
| Falhar de forma fechada se o Codex estiver indisponível | `agentRuntime.id: "codex"` no provedor ou modelo                 | O turno falha em vez de usar fallback PI | Use para implantações somente Codex |
| Tráfego direto por chave de API OpenAI via PI        | `agentRuntime.id: "pi"` no provedor ou modelo e autenticação OpenAI normal | `/status` mostra runtime PI             | Use apenas quando PI for intencional |
| Configuração legada                                  | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` reescreve       | Não escreva nova configuração assim |
| Adaptador Codex ACP/acpx                             | ACP `sessions_spawn({ runtime: "acp" })`                         | Status de tarefa/sessão ACP             | Separado do harness Codex nativo   |

`agents.defaults.imageModel` segue a mesma divisão de prefixo. Use `openai/gpt-*`
para a rota OpenAI normal e `codex/gpt-*` apenas quando a compreensão de imagem
deve ser executada por meio de um turno limitado do app-server Codex. Não use
`openai-codex/gpt-*`; o doctor reescreve esse prefixo legado para `openai/gpt-*`.

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

### Implantação com provedor misto

Esse formato mantém Claude como agente padrão e adiciona um agente Codex nomeado:

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
agente `codex` usa o app-server Codex.

### Implantação Codex fail-closed

Para turnos de agente OpenAI, `openai/gpt-*` já resolve para Codex quando o
Plugin incluído está disponível. Adicione política explícita de runtime quando você quiser uma regra
fail-closed por escrito:

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

Com Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver desabilitado, o
app-server for antigo demais ou o app-server não puder iniciar.

## Política do app-server

Por padrão, o Plugin inicia localmente o binário Codex gerenciado pelo OpenClaw com transporte
stdio. Defina `appServer.command` apenas quando você intencionalmente quiser executar um
executável diferente. Use transporte WebSocket apenas quando um app-server já estiver
rodando em outro lugar:

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

Sessões locais stdio do app-server usam por padrão a postura confiável de operador local:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se os requisitos locais do Codex não permitirem essa
postura YOLO implícita, o OpenClaw seleciona permissões de guardião permitidas em vez disso.
Quando um sandbox do OpenClaw está ativo para a sessão, o OpenClaw restringe o
`danger-full-access` do Codex para `workspace-write` do Codex, para que as rodadas
nativas de modo de código do Codex permaneçam dentro do workspace em sandbox.

Use o modo guardião quando quiser revisão automática nativa do Codex antes de escapes do sandbox
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

O modo guardião se expande para aprovações do app-server do Codex, geralmente
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando os requisitos locais permitem esses valores.

Para todos os campos de app-server, ordem de autenticação, isolamento de ambiente, descoberta e
comportamento de timeout, consulte a [referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Comandos e diagnósticos

O Plugin incluído registra `/codex` como um comando de barra em qualquer canal que
ofereça suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` verifica a conectividade do app-server, modelos, conta, limites de taxa,
  servidores MCP e Skills.
- `/codex models` lista modelos ativos do app-server do Codex.
- `/codex threads [filter]` lista threads recentes do app-server do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma
  thread existente do Codex.
- `/codex compact` pede ao app-server do Codex para compactar a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pergunta antes de enviar feedback do Codex para a
  thread anexada.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do app-server do Codex.
- `/codex skills` lista as Skills do app-server do Codex.

Para a maioria dos relatórios de suporte, comece com `/diagnostics [note]` na conversa
em que o bug aconteceu. Ele cria um relatório de diagnóstico do Gateway e, para sessões de
harness do Codex, pede aprovação para enviar o pacote de feedback relevante do Codex.
Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para o modelo de privacidade e o comportamento de
chat em grupo.

Use `/codex diagnostics [note]` apenas quando quiser especificamente o upload de feedback do Codex
para a thread atualmente anexada sem o pacote completo de diagnósticos do Gateway.

### Inspecionar threads do Codex localmente

A maneira mais rápida de inspecionar uma execução ruim do Codex costuma ser abrir a thread nativa do Codex
diretamente:

```bash
codex resume <thread-id>
```

Obtenha o id da thread na resposta concluída de `/diagnostics`, `/codex binding` ou
`/codex threads [filter]`.

Para mecânicas de upload e limites de diagnósticos em nível de runtime, consulte
[runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime#codex-feedback-upload).

A autenticação é selecionada nesta ordem:

1. Perfis de autenticação OpenAI ordenados para o agente, preferencialmente em
   `auth.order.openai`. IDs de perfil `openai-codex:*` existentes continuam válidos.
2. A conta existente do app-server no Codex home desse agente.
3. Apenas para inicializações locais stdio do app-server, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta de app-server está presente e a autenticação OpenAI
   ainda é necessária.

Quando o OpenClaw vê um perfil de autenticação do Codex no estilo de assinatura do ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho do Codex gerado. Isso
mantém as chaves de API em nível de Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer rodadas nativas do app-server do Codex serem cobradas pela API por acidente.
Perfis explícitos de chave de API do Codex e fallback de chave de env local stdio usam login do app-server
em vez de env herdado do processo filho. Conexões WebSocket do app-server
não recebem fallback de chave de API de env do Gateway; use um perfil de autenticação explícito ou a
própria conta do app-server remoto.

Se um perfil de assinatura atingir um limite de uso do Codex, o OpenClaw registra o horário de redefinição
quando o Codex informa um e tenta o próximo perfil de autenticação ordenado para a mesma
execução do Codex. Quando o horário de redefinição passa, o perfil de assinatura volta a ficar elegível
sem alterar o modelo `openai/gpt-*` selecionado ou o runtime do Codex.

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

Ferramentas dinâmicas do Codex usam por padrão carregamento `searchable`. O OpenClaw não expõe
ferramentas dinâmicas que duplicam operações nativas de workspace do Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. As ferramentas de integração restantes do OpenClaw,
como mensagens, sessões, mídia, Cron, navegador, nós,
Gateway, `heartbeat_respond` e `web_search`, ficam disponíveis por meio da busca de ferramentas do Codex
no namespace `openclaw`, mantendo menor o contexto inicial do modelo.
`sessions_yield` e respostas de origem somente de ferramenta de mensagem permanecem diretas porque esses
são contratos de controle de rodada. As instruções de colaboração de Heartbeat dizem ao Codex para
procurar `heartbeat_respond` antes de encerrar uma rodada de Heartbeat quando a ferramenta
ainda não está carregada.

Defina `codexDynamicToolsLoading: "direct"` apenas ao conectar a um app-server personalizado do Codex
que não consegue pesquisar ferramentas dinâmicas adiadas ou ao depurar o payload completo de ferramentas.

Campos de Plugin Codex de nível superior compatíveis:

| Campo                      | Padrão        | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Use `"direct"` para colocar ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir de rodadas do app-server do Codex.              |
| `codexPlugins`             | desabilitado       | Suporte nativo do Codex a Plugin/app para Plugins selecionados instalados a partir do código-fonte e migrados.           |

Campos `appServer` compatíveis:

| Campo                         | Padrão                                                | Significado                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` gera o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                                |
| `command`                     | binário gerenciado do Codex                                   | Executável para transporte stdio. Deixe não definido para usar o binário gerenciado; defina apenas para uma substituição explícita.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                          |
| `url`                         | não definido                                                  | URL do app-server WebSocket.                                                                                                                                                                                                               |
| `authToken`                   | não definido                                                  | Token Bearer para transporte WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Cabeçalhos WebSocket extras.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Nomes extras de variáveis de ambiente removidos do processo stdio do app-server gerado depois que o OpenClaw constrói o ambiente herdado. `CODEX_HOME` e `HOME` são reservados para o isolamento por agente do Codex do OpenClaw em inicializações locais.    |
| `requestTimeoutMs`            | `60000`                                                | Timeout para chamadas do plano de controle do app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Janela de silêncio após uma solicitação ao app-server do Codex com escopo de rodada enquanto o OpenClaw aguarda `turn/completed`. Aumente isso para fases lentas de síntese pós-ferramenta ou somente de status.                                                                     |
| `mode`                        | `"yolo"` a menos que os requisitos locais do Codex não permitam YOLO | Predefinição para execução YOLO ou revisada por guardião. Requisitos locais stdio que omitem `danger-full-access`, aprovação `never` ou o revisor `user` tornam o padrão implícito guardião.                                                   |
| `approvalPolicy`              | `"never"` ou uma política de aprovação de guardião permitida       | Política de aprovação nativa do Codex enviada para início/retomada/rodada de thread. Os padrões de guardião preferem `"on-request"` quando permitido.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` ou um sandbox de guardião permitido  | Modo de sandbox nativo do Codex enviado para início/retomada de thread. Os padrões de guardião preferem `"workspace-write"` quando permitido, caso contrário `"read-only"`. Quando um sandbox do OpenClaw está ativo, `danger-full-access` é restringido para `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` ou um revisor de guardião permitido               | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos quando permitido, caso contrário `guardian_subagent` ou `user`. `guardian_subagent` permanece um alias legado.                                                                      |
| `serviceTier`                 | não definido                                                  | Camada de serviço opcional do app-server do Codex. `"priority"` habilita roteamento em modo rápido, `"flex"` solicita processamento flex, `null` limpa a substituição e o legado `"fast"` é aceito como `"priority"`.                                         |

As chamadas dinâmicas de ferramenta pertencentes ao OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`: as solicitações `item/tool/call` do Codex usam um watchdog do
OpenClaw de 30 segundos por padrão. Um argumento positivo `timeoutMs` por chamada estende
ou encurta o orçamento dessa ferramenta específica. A ferramenta `image_generate` também usa
`agents.defaults.imageGenerationModel.timeoutMs` quando a chamada de ferramenta não fornece
seu próprio tempo limite, e a ferramenta `image` de entendimento de mídia usa
`tools.media.image.timeoutSeconds` ou seu padrão de mídia de 60 segundos. Os orçamentos de
ferramentas dinâmicas são limitados a 600000 ms. Em caso de tempo limite, o OpenClaw aborta o
sinal da ferramenta quando houver suporte e retorna uma resposta de ferramenta dinâmica com falha
ao Codex para que o turno possa continuar, em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação ao app-server com escopo de turno do Codex, o harness
também espera que o Codex finalize o turno nativo com `turn/completed`. Se o
app-server ficar silencioso por `appServer.turnCompletionIdleTimeoutMs` após essa
resposta, o OpenClaw tenta, da melhor forma possível, interromper o turno do Codex, registra um
tempo limite de diagnóstico e libera a faixa de sessão do OpenClaw para que mensagens de chat
subsequentes não fiquem enfileiradas atrás de um turno nativo obsoleto. Qualquer notificação não terminal para o
mesmo turno, incluindo `rawResponseItem/completed`, desarma esse watchdog curto
porque o Codex provou que o turno ainda está vivo; o watchdog terminal mais longo
continua protegendo turnos genuinamente travados. Notificações globais do app-server,
como atualizações de limite de taxa, não redefinem o progresso de inatividade do turno. Quando o Codex emite um
item `agentMessage` concluído e depois fica silencioso sem `turn/completed`,
o OpenClaw trata a saída do assistente como efetivamente completa, tenta da melhor forma possível
interromper o turno nativo do Codex e libera a faixa da sessão. Os diagnósticos de tempo limite
incluem o último método de notificação do app-server e, para itens brutos de resposta do
assistente, o tipo, a função, o id e uma prévia limitada do texto do assistente.

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
preferível para implantações repetíveis porque mantém o comportamento do plugin no
mesmo arquivo revisado que o restante da configuração do harness do Codex.

## Plugins nativos do Codex

O suporte a plugins nativos do Codex usa os próprios recursos de app e plugin do app-server do Codex
na mesma thread do Codex que o turno do harness do OpenClaw. O OpenClaw
não traduz plugins do Codex em ferramentas dinâmicas sintéticas `codex_plugin_*` do OpenClaw.

`codexPlugins` afeta apenas sessões que selecionam o harness nativo do Codex. Ele
não tem efeito em execuções de PI, execuções normais do provedor OpenAI, vínculos de conversa
ACP ou outros harnesses.

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

A configuração de app da thread é calculada quando o OpenClaw estabelece uma sessão de harness do Codex
ou substitui um vínculo obsoleto de thread do Codex. Ela não é recalculada a cada turno.
Após alterar `codexPlugins`, use `/new`, `/reset` ou reinicie o gateway para que
sessões futuras do harness do Codex comecem com o conjunto de apps atualizado.

Para elegibilidade de migração, inventário de apps, política de ações destrutivas,
elicitações e diagnósticos de plugins nativos, consulte
[Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins).

## Uso do computador

O Uso do Computador é abordado em seu próprio guia de configuração:
[Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não inclui o app de controle de desktop nem executa
ações de desktop diretamente. Ele prepara o app-server do Codex, verifica se o
servidor MCP `computer-use` está disponível e então deixa o Codex controlar as chamadas
nativas de ferramenta MCP durante turnos em modo Codex.

## Limites de runtime

O harness do Codex altera apenas o executor de agente incorporado de baixo nível.

- Ferramentas dinâmicas do OpenClaw têm suporte. O Codex pede ao OpenClaw para executar essas
  ferramentas, então o OpenClaw permanece no caminho de execução.
- Shell, patch, MCP e ferramentas nativas de app nativos do Codex pertencem ao Codex.
  O OpenClaw pode observar ou bloquear eventos nativos selecionados por meio do relay
  compatível, mas não reescreve argumentos de ferramentas nativas.
- O Codex é responsável pela compaction nativa. O OpenClaw mantém um espelho de transcrição para histórico de
  canais, pesquisa, `/new`, `/reset` e futuras trocas de modelo ou harness.
- Geração de mídia, entendimento de mídia, TTS, aprovações e saída de ferramentas de mensagens
  continuam pelas configurações correspondentes de provedor/modelo do OpenClaw.
- `tool_result_persist` se aplica a resultados de ferramenta de transcrição pertencentes ao OpenClaw, não a
  registros de resultados de ferramentas nativas do Codex.

Para camadas de hooks, superfícies V1 compatíveis, tratamento de permissões nativas, direcionamento de fila,
mecânica de upload de feedback do Codex e detalhes de compaction, consulte
[Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime).

## Solução de problemas

**O Codex não aparece como um provedor `/model` normal:** isso é esperado em
novas configurações. Selecione um modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa PI em vez de Codex:** certifique-se de que a referência de modelo seja
`openai/gpt-*` no provedor oficial OpenAI e que o plugin do Codex esteja
instalado e habilitado. Se precisar de prova rigorosa durante testes, defina o `agentRuntime.id` do provedor ou
modelo como `"codex"`. Um runtime Codex forçado falha em vez de
recair para PI.

**A configuração legada `openai-codex/*` permanece:** execute `openclaw doctor --fix`.
O Doctor reescreve referências de modelo legadas para `openai/*`, remove pins obsoletos de runtime de sessão e
de agente inteiro e preserva substituições existentes de perfil de autenticação.

**O app-server é rejeitado:** use o app-server do Codex `0.125.0` ou mais recente.
Pré-lançamentos da mesma versão ou versões com sufixo de build, como
`0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o OpenClaw testa o
piso do protocolo estável `0.125.0`.

**`/codex status` não consegue conectar:** verifique se o plugin `codex` incluído está
habilitado, se `plugins.allow` o inclui quando uma lista de permissões está configurada e
se quaisquer `appServer.command`, `url`, `authToken` ou cabeçalhos personalizados são válidos.

**A descoberta de modelos está lenta:** reduza
`plugins.entries.codex.config.discovery.timeoutMs` ou desabilite a descoberta. Consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference#model-discovery).

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`,
cabeçalhos e se o app-server remoto fala a mesma versão de protocolo do app-server do Codex.

**Um modelo que não é Codex usa PI:** isso é esperado, a menos que a política de runtime do provedor ou
modelo o direcione para outro harness. Referências simples de provedores que não sejam OpenAI permanecem em
seu caminho normal de provedor no modo `auto`.

**O Uso do Computador está instalado, mas as ferramentas não executam:** verifique
`/codex computer-use status` em uma sessão nova. Se uma ferramenta relatar
`Native hook relay unavailable`, use `/new` ou `/reset`; se persistir, reinicie
o gateway para limpar registros obsoletos de hooks nativos. Consulte
[Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use#troubleshooting).

## Relacionados

- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Hooks de plugin](/pt-BR/plugins/hooks)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Status](/pt-BR/cli/status)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
