---
read_when:
    - Você quer usar o harness app-server do Codex incluído
    - Você precisa de exemplos de configuração do mecanismo do Codex
    - Você quer que implantações somente com Codex falhem em vez de recorrerem ao PI
summary: Executar turnos de agente incorporado do OpenClaw por meio do harness app-server do Codex incluído
title: Ambiente de execução do Codex
x-i18n:
    generated_at: "2026-05-11T20:33:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

O plugin `codex` incluído permite que o OpenClaw execute turnos de agente OpenAI incorporados
por meio do app-server do Codex em vez da estrutura de execução PI integrada.

Use a estrutura de execução do Codex quando você quiser que o Codex controle a sessão de agente de baixo nível:
retomada nativa de thread, continuação nativa de ferramentas, compaction nativa e
execução no app-server. O OpenClaw ainda controla canais de chat, arquivos de sessão, seleção de modelo,
ferramentas dinâmicas do OpenClaw, aprovações, entrega de mídia e o espelho visível
da transcrição.

A configuração normal usa refs de modelo canônicos da OpenAI, como `openai/gpt-5.5`.
Não configure refs de modelo `openai-codex/gpt-*`. Coloque a ordem de autenticação do agente OpenAI
em `auth.order.openai`; perfis `openai-codex:*` mais antigos e entradas
`auth.order.openai-codex` continuam compatíveis para instalações existentes.

O OpenClaw inicia threads do app-server do Codex com o modo de código nativo do Codex e
somente modo de código habilitado. Isso mantém as ferramentas dinâmicas adiadas/pesquisáveis do OpenClaw
dentro da própria execução de código e superfície de busca de ferramentas do Codex, em vez de adicionar um
wrapper de busca de ferramentas no estilo PI por cima do Codex.

Para a divisão mais ampla de modelo/provedor/runtime, comece com
[Tempos de execução de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a ref de modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## Requisitos

- OpenClaw com o plugin `codex` incluído disponível.
- Se sua configuração usa `plugins.allow`, inclua `codex`.
- App-server do Codex `0.125.0` ou mais recente. O plugin incluído gerencia um binário
  compatível do app-server do Codex por padrão, então comandos locais `codex` em `PATH` não
  afetam a inicialização normal da estrutura de execução.
- Autenticação do Codex disponível por meio de `openclaw models auth login --provider openai-codex`,
  uma conta de app-server no diretório inicial Codex do agente ou um perfil explícito de autenticação
  por chave de API do Codex.

Para precedência de autenticação, isolamento de ambiente, comandos personalizados do app-server, descoberta
de modelos e todos os campos de configuração, consulte
[Referência da estrutura de execução do Codex](/pt-BR/plugins/codex-harness-reference).

## Início rápido

A maioria dos usuários que quer Codex no OpenClaw quer este caminho: entrar com uma
assinatura ChatGPT/Codex, habilitar o plugin `codex` incluído e usar uma
ref de modelo canônica `openai/gpt-*`.

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

Reinicie o gateway depois de alterar a configuração de plugin. Se um chat existente já
tiver uma sessão, use `/new` ou `/reset` antes de testar mudanças de runtime para que o próximo
turno resolva a estrutura de execução a partir da configuração atual.

## Configuração

A configuração de início rápido é a configuração mínima viável da estrutura de execução do Codex. Defina opções da
estrutura de execução do Codex na configuração do OpenClaw e use a CLI somente para autenticação do Codex:

| Necessidade                            | Defina                                                                           | Onde                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Habilitar a estrutura de execução      | `plugins.entries.codex.enabled: true`                                            | Configuração do OpenClaw           |
| Manter uma instalação de plugin em allowlist | Inclua `codex` em `plugins.allow`                                           | Configuração do OpenClaw           |
| Encaminhar turnos de agente OpenAI pelo Codex | `agents.defaults.model` ou `agents.list[].model` como `openai/gpt-*`       | Configuração de agente do OpenClaw |
| Entrar com OAuth do Codex              | `openclaw models auth login --provider openai-codex`                             | Perfil de autenticação da CLI      |
| Adicionar backup por chave de API para execuções do Codex | Perfil de chave de API `openai:*` listado após autenticação por assinatura em `auth.order.openai` | Perfil de autenticação da CLI + configuração do OpenClaw |
| Falhar fechado quando o Codex estiver indisponível | Provedor ou modelo `agentRuntime.id: "codex"`                              | Configuração de modelo/provedor do OpenClaw |
| Usar tráfego direto da API da OpenAI   | Provedor ou modelo `agentRuntime.id: "pi"` com autenticação OpenAI normal         | Configuração de modelo/provedor do OpenClaw |
| Ajustar comportamento do app-server    | `plugins.entries.codex.config.appServer.*`                                       | Configuração do plugin Codex       |
| Habilitar apps de plugin nativos do Codex | `plugins.entries.codex.config.codexPlugins.*`                                  | Configuração do plugin Codex       |
| Habilitar Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configuração do plugin Codex       |

Use refs de modelo `openai/gpt-*` para turnos de agente OpenAI com suporte do Codex. Prefira
`auth.order.openai` para ordenação assinatura-primeiro/backup-por-chave-de-API. Perfis de autenticação
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

Nesse formato, ambos os perfis ainda executam pelo Codex para turnos de agente
`openai/gpt-*`. A chave de API é apenas um fallback de autenticação, não uma solicitação para mudar para PI ou
OpenAI Responses simples.

O restante desta página cobre variantes comuns entre as quais os usuários precisam escolher:
formato de implantação, roteamento com falha fechada, política de aprovação do guardião, plugins nativos do Codex
e Computer Use. Para listas completas de opções, padrões, enums, descoberta,
isolamento de ambiente, timeouts e campos de transporte do app-server, consulte
[Referência da estrutura de execução do Codex](/pt-BR/plugins/codex-harness-reference).

## Verificar runtime do Codex

Use `/status` no chat em que você espera usar o Codex. Um turno de agente OpenAI com suporte do Codex
mostra:

```text
Runtime: OpenAI Codex
```

Em seguida, verifique o estado do app-server do Codex:

```text
/codex status
/codex models
```

`/codex status` relata conectividade do app-server, conta, limites de taxa, servidores MCP
e Skills. `/codex models` lista o catálogo ativo do app-server do Codex para
a estrutura de execução e a conta. Se `/status` for inesperado, consulte
[Solução de problemas](#troubleshooting).

## Roteamento e seleção de modelo

Mantenha refs de provedor e política de runtime separadas:

- Use `openai/gpt-*` para turnos de agente OpenAI pelo Codex.
- Não use `openai-codex/gpt-*` na configuração. Execute `openclaw doctor --fix` para
  reparar refs legadas e pins obsoletos de rota de sessão.
- `agentRuntime.id: "codex"` é opcional para o modo automático normal da OpenAI, mas útil
  quando uma implantação deve falhar fechada se o Codex estiver indisponível.
- `agentRuntime.id: "pi"` coloca um provedor ou modelo em comportamento PI direto quando
  isso é intencional.
- `/codex ...` controla conversas nativas do app-server do Codex a partir do chat.
- ACP/acpx é um caminho separado de estrutura de execução externa. Use-o somente quando o usuário pedir
  ACP/acpx ou um adaptador externo de estrutura de execução.

Roteamento de comandos comum:

| Intenção do usuário                 | Use                                     |
| ----------------------------------- | --------------------------------------- |
| Anexar o chat atual                 | `/codex bind [--cwd <path>]`            |
| Retomar uma thread existente do Codex | `/codex resume <thread-id>`           |
| Listar ou filtrar threads do Codex  | `/codex threads [filter]`               |
| Enviar apenas feedback do Codex     | `/codex diagnostics [note]`             |
| Iniciar uma tarefa ACP/acpx         | Comandos de sessão ACP/acpx, não `/codex` |

| Caso de uso                                          | Configure                                                        | Verifique                                | Observações                         |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------- | ----------------------------------- |
| Assinatura ChatGPT/Codex com runtime nativo do Codex | `openai/gpt-*` mais plugin `codex` habilitado                    | `/status` mostra `Runtime: OpenAI Codex` | Caminho recomendado                 |
| Falhar fechado se o Codex estiver indisponível       | Provedor ou modelo `agentRuntime.id: "codex"`                    | O turno falha em vez de fallback para PI | Use para implantações somente Codex |
| Tráfego direto por chave de API da OpenAI via PI     | Provedor ou modelo `agentRuntime.id: "pi"` e autenticação OpenAI normal | `/status` mostra runtime PI         | Use somente quando PI for intencional |
| Configuração legada                                  | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` a reescreve      | Não escreva nova configuração dessa forma |
| Adaptador Codex ACP/acpx                             | ACP `sessions_spawn({ runtime: "acp" })`                         | Status da tarefa/sessão ACP              | Separado da estrutura de execução nativa do Codex |

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use `openai/gpt-*`
para a rota normal da OpenAI e `codex/gpt-*` somente quando a compreensão de imagens
deve ser executada por meio de um turno limitado do app-server do Codex. Não use
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
agente `codex` usa o app-server do Codex.

### Implantação do Codex com falha fechada

Para turnos de agente OpenAI, `openai/gpt-*` já resolve para Codex quando o
plugin incluído está disponível. Adicione uma política explícita de runtime quando você quiser uma regra escrita
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

Com o Codex forçado, o OpenClaw falha cedo se o plugin Codex estiver desabilitado, o
app-server for antigo demais ou o app-server não puder iniciar.

## Política do app-server

Por padrão, o plugin inicia localmente o binário Codex gerenciado pelo OpenClaw com transporte
stdio. Defina `appServer.command` somente quando você quiser intencionalmente executar um
executável diferente. Use transporte WebSocket somente quando um app-server já
estiver em execução em outro lugar:

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

As sessões locais `stdio` do app-server usam por padrão a postura confiável do operador local:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se os requisitos locais do Codex não permitirem essa
postura YOLO implícita, o OpenClaw seleciona permissões de guardião permitidas.
Quando um sandbox do OpenClaw está ativo para a sessão, o OpenClaw restringe
`danger-full-access` do Codex para `workspace-write` do Codex, para que as interações
nativas em modo de código do Codex permaneçam dentro do workspace em sandbox.

Use o modo guardião quando quiser revisão automática nativa do Codex antes de escapes
do sandbox ou permissões extras:

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

Para todos os campos do app-server, ordem de autenticação, isolamento de ambiente,
descoberta e comportamento de timeout, consulte a [referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

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
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pede confirmação antes de enviar feedback do Codex para a
  thread anexada.
- `/codex account` mostra o status da conta e do limite de taxa.
- `/codex mcp` lista o status dos servidores MCP do app-server do Codex.
- `/codex skills` lista as skills do app-server do Codex.

Para a maioria dos relatórios de suporte, comece com `/diagnostics [note]` na conversa
em que o bug aconteceu. Ele cria um relatório de diagnóstico do Gateway e, para sessões
do harness do Codex, pede aprovação para enviar o pacote de feedback relevante do Codex.
Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para o modelo de privacidade
e o comportamento em chats de grupo.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o upload de
feedback do Codex para a thread atualmente anexada, sem o pacote completo de diagnósticos
do Gateway.

### Inspecionar threads do Codex localmente

A maneira mais rápida de inspecionar uma execução ruim do Codex muitas vezes é abrir a
thread nativa do Codex diretamente:

```bash
codex resume <thread-id>
```

Obtenha o id da thread pela resposta concluída de `/diagnostics`, `/codex binding` ou
`/codex threads [filter]`.

Para mecanismos de upload e limites de diagnóstico em nível de runtime, consulte
[Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime#codex-feedback-upload).

A autenticação é selecionada nesta ordem:

1. Perfis de autenticação OpenAI ordenados para o agente, preferencialmente em
   `auth.order.openai`. Ids de perfil `openai-codex:*` existentes continuam válidos.
2. A conta existente do app-server na home do Codex desse agente.
3. Somente para inicializações locais do app-server por stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta do app-server está presente e a autenticação
   OpenAI ainda é necessária.

Quando o OpenClaw detecta um perfil de autenticação do Codex no estilo de assinatura do ChatGPT,
ele remove `CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho do Codex gerado. Isso
mantém chaves de API em nível de Gateway disponíveis para embeddings ou modelos diretos
da OpenAI sem fazer com que interações nativas do app-server do Codex sejam cobradas pela
API acidentalmente. Perfis explícitos de chave de API do Codex e fallback local de chave
de ambiente por stdio usam login do app-server em vez de env herdado do processo filho.
Conexões WebSocket do app-server não recebem fallback de chave de API de env do Gateway;
use um perfil de autenticação explícito ou a própria conta do app-server remoto.

Se um perfil de assinatura atingir um limite de uso do Codex, o OpenClaw registra o tempo
de redefinição quando o Codex informa um e tenta o próximo perfil de autenticação ordenado
para a mesma execução do Codex. Quando o tempo de redefinição passa, o perfil de assinatura
se torna elegível novamente sem alterar o modelo `openai/gpt-*` selecionado ou o runtime
do Codex.

Se uma implantação precisar de isolamento de ambiente adicional, adicione essas variáveis a
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

As ferramentas dinâmicas do Codex usam por padrão carregamento `searchable`. O OpenClaw não expõe
ferramentas dinâmicas que duplicam operações nativas do Codex no workspace: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. As ferramentas restantes de integração
do OpenClaw, como mensagens, sessões, mídia, cron, navegador, nós, gateway,
`heartbeat_respond` e `web_search`, ficam disponíveis pela busca de ferramentas do Codex
no namespace `openclaw`, mantendo o contexto inicial do modelo menor.
`sessions_yield` e respostas de origem exclusivas da ferramenta de mensagens permanecem diretas porque esses
são contratos de controle de turno. As instruções de colaboração de Heartbeat orientam o Codex a
buscar `heartbeat_respond` antes de encerrar um turno de Heartbeat quando a ferramenta ainda não
está carregada.

Defina `codexDynamicToolsLoading: "direct"` somente ao conectar a um app-server personalizado do Codex
que não consegue buscar ferramentas dinâmicas adiadas ou ao depurar o payload completo de ferramentas.

Campos de Plugin Codex de nível superior compatíveis:

| Campo                      | Padrão        | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Use `"direct"` para colocar ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir das interações do app-server do Codex.              |
| `codexPlugins`             | desativado       | Suporte nativo a Plugin/app do Codex para Plugins curados migrados instalados a partir do código-fonte.           |

Campos `appServer` compatíveis:

| Campo                         | Padrão                                                | Significado                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` gera o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                                |
| `command`                     | binário gerenciado do Codex                                   | Executável para transporte stdio. Deixe indefinido para usar o binário gerenciado; defina somente para uma substituição explícita.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                          |
| `url`                         | indefinido                                                  | URL WebSocket do app-server.                                                                                                                                                                                                               |
| `authToken`                   | indefinido                                                  | Token Bearer para transporte WebSocket.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | Cabeçalhos WebSocket extras.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | Nomes extras de variáveis de ambiente removidos do processo stdio do app-server gerado depois que o OpenClaw cria seu ambiente herdado. `CODEX_HOME` e `HOME` são reservados para o isolamento do Codex por agente do OpenClaw em inicializações locais.    |
| `requestTimeoutMs`            | `60000`                                                | Timeout para chamadas de plano de controle do app-server.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Janela silenciosa após uma solicitação ao app-server do Codex com escopo de turno enquanto o OpenClaw aguarda `turn/completed`. Aumente isso para fases lentas de síntese pós-ferramenta ou somente de status.                                                                     |
| `mode`                        | `"yolo"` a menos que os requisitos locais do Codex não permitam YOLO | Predefinição para execução YOLO ou revisada por guardião. Requisitos locais de stdio que omitem `danger-full-access`, aprovação `never` ou o revisor `user` tornam o padrão implícito guardião.                                                   |
| `approvalPolicy`              | `"never"` ou uma política de aprovação de guardião permitida       | Política de aprovação nativa do Codex enviada ao iniciar/retomar thread/turno. Padrões de guardião preferem `"on-request"` quando permitido.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` ou um sandbox de guardião permitido  | Modo de sandbox nativo do Codex enviado ao iniciar/retomar thread. Padrões de guardião preferem `"workspace-write"` quando permitido; caso contrário, `"read-only"`. Quando um sandbox do OpenClaw está ativo, `danger-full-access` é restringido para `"workspace-write"`. |
| `approvalsReviewer`           | `"user"` ou um revisor de guardião permitido               | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos quando permitido; caso contrário, `guardian_subagent` ou `user`. `guardian_subagent` continua sendo um alias legado.                                                                      |
| `serviceTier`                 | indefinido                                                  | Camada de serviço opcional do app-server do Codex. `"priority"` habilita roteamento em modo rápido, `"flex"` solicita processamento flex, `null` limpa a substituição, e o legado `"fast"` é aceito como `"priority"`.                                         |

As chamadas dinâmicas de ferramentas pertencentes ao OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`: as solicitações Codex `item/tool/call` usam um watchdog
do OpenClaw de 30 segundos por padrão. Um argumento positivo `timeoutMs` por chamada estende
ou encurta o orçamento dessa ferramenta específica. A ferramenta `image_generate` também usa
`agents.defaults.imageGenerationModel.timeoutMs` quando a chamada da ferramenta não fornece
seu próprio timeout, e a ferramenta `image` de compreensão de mídia usa
`tools.media.image.timeoutSeconds` ou seu padrão de mídia de 60 segundos. Os orçamentos de
ferramentas dinâmicas são limitados a 600000 ms. Em caso de timeout, o OpenClaw aborta o sinal
da ferramenta quando houver suporte e retorna uma resposta de ferramenta dinâmica com falha ao Codex
para que o turno possa continuar, em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação app-server com escopo de turno do Codex, o harness
também espera que o Codex finalize o turno nativo com `turn/completed`. Se o
app-server ficar silencioso por `appServer.turnCompletionIdleTimeoutMs` depois dessa
resposta, o OpenClaw faz o melhor esforço para interromper o turno do Codex, registra um timeout
diagnóstico e libera a lane da sessão do OpenClaw para que mensagens de chat subsequentes não fiquem
na fila atrás de um turno nativo obsoleto. Qualquer notificação não terminal para o
mesmo turno, incluindo `rawResponseItem/completed`, desarma esse watchdog curto
porque o Codex comprovou que o turno ainda está ativo; o watchdog terminal mais longo
continua protegendo turnos realmente travados. Os diagnósticos de timeout incluem o
último método de notificação do app-server e, para itens brutos de resposta do assistente, o
tipo, a função, o id e uma prévia limitada do texto do assistente.

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
preferível para implantações repetíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness do Codex.

## Plugins nativos do Codex

O suporte a Plugins nativos do Codex usa os próprios recursos de app e Plugin
do app-server do Codex na mesma thread do Codex que o turno do harness do OpenClaw. O OpenClaw
não traduz Plugins do Codex em ferramentas dinâmicas sintéticas `codex_plugin_*` do OpenClaw.

`codexPlugins` afeta apenas sessões que selecionam o harness nativo do Codex. Ele
não tem efeito em execuções PI, execuções normais do provedor OpenAI, vínculos de conversa
ACP ou outros harnesses.

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
            allow_destructive_actions: false,
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

A configuração do app da thread é computada quando o OpenClaw estabelece uma sessão do harness
do Codex ou substitui um vínculo obsoleto de thread do Codex. Ela não é recomputada a cada turno.
Depois de alterar `codexPlugins`, use `/new`, `/reset` ou reinicie o Gateway para que
futuras sessões do harness do Codex comecem com o conjunto de apps atualizado.

Para elegibilidade de migração, inventário de apps, política de ações destrutivas,
elicitações e diagnósticos de Plugin nativo, consulte
[Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins).

## Uso do computador

O Uso do computador é abordado no seu próprio guia de configuração:
[Uso do computador do Codex](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não incorpora o app de controle de desktop nem executa
ações de desktop por conta própria. Ele prepara o app-server do Codex, verifica se o
servidor MCP `computer-use` está disponível e então deixa o Codex controlar as chamadas
nativas de ferramentas MCP durante turnos no modo Codex.

## Limites de runtime

O harness do Codex altera apenas o executor de agente embarcado de baixo nível.

- Ferramentas dinâmicas do OpenClaw são compatíveis. O Codex pede que o OpenClaw execute essas
  ferramentas, então o OpenClaw permanece no caminho de execução.
- Shell, patch, MCP e ferramentas nativas de app pertencentes ao Codex são controlados pelo Codex.
  O OpenClaw pode observar ou bloquear eventos nativos selecionados por meio do relay
  compatível, mas não reescreve argumentos de ferramentas nativas.
- O Codex controla a Compaction nativa. O OpenClaw mantém um espelho de transcrição para o histórico
  de canais, busca, `/new`, `/reset` e futuras trocas de modelo ou harness.
- Geração de mídia, compreensão de mídia, TTS, aprovações e saída de ferramentas de mensagens
  continuam passando pelas configurações correspondentes de provedor/modelo do OpenClaw.
- `tool_result_persist` aplica-se a resultados de ferramentas de transcrição pertencentes ao OpenClaw, não
  a registros de resultados de ferramentas nativas do Codex.

Para camadas de hooks, superfícies V1 compatíveis, tratamento de permissões nativas, direcionamento
de fila, mecânica de upload de feedback do Codex e detalhes de Compaction, consulte
[Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime).

## Solução de problemas

**O Codex não aparece como um provedor `/model` normal:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa PI em vez de Codex:** certifique-se de que a referência do modelo seja
`openai/gpt-*` no provedor OpenAI oficial e que o Plugin do Codex esteja
instalado e habilitado. Se você precisar de prova rigorosa durante testes, defina no provedor ou
modelo `agentRuntime.id: "codex"`. Um runtime Codex forçado falha em vez de
retornar para PI.

**A configuração legada `openai-codex/*` permanece:** execute `openclaw doctor --fix`.
O Doctor reescreve referências de modelos legadas para `openai/*`, remove pins obsoletos de runtime
de sessão e de agente inteiro, e preserva substituições existentes de perfil de autenticação.

**O app-server é rejeitado:** use o app-server do Codex `0.125.0` ou mais recente.
Pré-lançamentos da mesma versão ou versões com sufixo de build, como
`0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o OpenClaw testa o
piso do protocolo estável `0.125.0`.

**`/codex status` não consegue conectar:** verifique se o Plugin `codex` incluído está
habilitado, se `plugins.allow` o inclui quando uma lista de permissões está configurada e
se qualquer `appServer.command`, `url`, `authToken` ou cabeçalho personalizado é válido.

**A descoberta de modelos está lenta:** reduza
`plugins.entries.codex.config.discovery.timeoutMs` ou desabilite a descoberta. Consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference#model-discovery).

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`,
cabeçalhos e se o app-server remoto usa a mesma versão do protocolo app-server
do Codex.

**Um modelo que não é Codex usa PI:** isso é esperado, a menos que a política de runtime do provedor ou
modelo o encaminhe para outro harness. Referências simples de provedores que não são OpenAI permanecem no
caminho normal do provedor em modo `auto`.

**O Uso do computador está instalado, mas as ferramentas não executam:** verifique
`/codex computer-use status` em uma sessão nova. Se uma ferramenta relatar
`Native hook relay unavailable`, use `/new` ou `/reset`; se persistir, reinicie
o Gateway para limpar registros obsoletos de hooks nativos. Consulte
[Uso do computador do Codex](/pt-BR/plugins/codex-computer-use#troubleshooting).

## Relacionado

- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Uso do computador do Codex](/pt-BR/plugins/codex-computer-use)
- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Status](/pt-BR/cli/status)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
