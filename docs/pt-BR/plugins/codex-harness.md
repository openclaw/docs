---
read_when:
    - Você quer usar o arcabouço de servidor de aplicativo do Codex incluído
    - Você precisa de exemplos de configuração do ambiente de execução do Codex
    - Você quer que as implantações somente com Codex falhem em vez de recorrer ao PI
summary: Execute turnos de agente incorporado do OpenClaw por meio do harness de app-server Codex incluído
title: Estrutura de execução do Codex
x-i18n:
    generated_at: "2026-05-10T19:41:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

O Plugin `codex` incluído permite que o OpenClaw execute turnos de agente OpenAI
incorporados por meio do app-server do Codex em vez do harness PI integrado.

Use o harness Codex quando quiser que o Codex controle a sessão de agente de
baixo nível: retomada nativa de thread, continuação nativa de ferramentas,
compaction nativa e execução pelo app-server. O OpenClaw ainda controla canais
de chat, arquivos de sessão, seleção de modelo, ferramentas dinâmicas do
OpenClaw, aprovações, entrega de mídia e o espelho visível da transcrição.

A configuração normal usa refs canônicas de modelos OpenAI, como `openai/gpt-5.5`.
Não configure refs de modelo `openai-codex/gpt-*`. `openai-codex` é o provedor
de perfil de autenticação para perfis Codex OAuth ou de chave de API do Codex,
não o prefixo do provedor de modelo para nova configuração de agente.

Para a divisão mais ampla entre modelo/provedor/runtime, comece com
[Runtime de agentes](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a ref do modelo, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## Requisitos

- OpenClaw com o Plugin `codex` incluído disponível.
- Se sua configuração usa `plugins.allow`, inclua `codex`.
- App-server do Codex `0.125.0` ou mais recente. O Plugin incluído gerencia por
  padrão um binário compatível do app-server do Codex, portanto comandos locais
  `codex` no `PATH` não afetam a inicialização normal do harness.
- Autenticação do Codex disponível por meio de `openclaw models auth login --provider openai-codex`,
  uma conta de app-server no home do Codex do agente ou um perfil explícito de
  autenticação por chave de API do Codex.

Para precedência de autenticação, isolamento de ambiente, comandos
personalizados do app-server, descoberta de modelos e todos os campos de
configuração, consulte
[Referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Início rápido

A maioria dos usuários que quer o Codex no OpenClaw quer este caminho: entrar
com uma assinatura ChatGPT/Codex, habilitar o Plugin `codex` incluído e usar
uma ref de modelo canônica `openai/gpt-*`.

Entre com Codex OAuth:

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

Reinicie o Gateway depois de alterar a configuração do Plugin. Se um chat
existente já tiver uma sessão, use `/new` ou `/reset` antes de testar mudanças
de runtime para que o próximo turno resolva o harness a partir da configuração
atual.

## Configuração

A configuração do início rápido é a configuração mínima viável do harness
Codex. Defina as opções do harness Codex na configuração do OpenClaw e use a
CLI apenas para autenticação do Codex:

| Necessidade                            | Definir                                                            | Onde                           |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| Habilitar o harness                    | `plugins.entries.codex.enabled: true`                              | Configuração do OpenClaw       |
| Manter uma instalação de Plugin permitida | Incluir `codex` em `plugins.allow`                              | Configuração do OpenClaw       |
| Rotear turnos de agente OpenAI pelo Codex | `agents.defaults.model` ou `agents.list[].model` como `openai/gpt-*` | Configuração de agente do OpenClaw |
| Entrar com Codex OAuth                 | `openclaw models auth login --provider openai-codex`               | Perfil de autenticação da CLI  |
| Falhar fechado quando o Codex estiver indisponível | `agentRuntime.id: "codex"` de provedor ou modelo          | Configuração de modelo/provedor do OpenClaw |
| Usar tráfego direto da API OpenAI      | `agentRuntime.id: "pi"` de provedor ou modelo com autenticação normal da OpenAI | Configuração de modelo/provedor do OpenClaw |
| Ajustar o comportamento do app-server  | `plugins.entries.codex.config.appServer.*`                         | Configuração do Plugin Codex   |
| Habilitar apps nativos de Plugin Codex | `plugins.entries.codex.config.codexPlugins.*`                      | Configuração do Plugin Codex   |
| Habilitar Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                       | Configuração do Plugin Codex   |

Use refs de modelo `openai/gpt-*` para turnos de agente OpenAI com suporte do
Codex. `openai-codex` é apenas o nome do provedor de perfil de autenticação
para perfis Codex OAuth e de chave de API do Codex. Não escreva novas refs de
modelo `openai-codex/gpt-*`.

O restante desta página cobre variantes comuns entre as quais os usuários
precisam escolher: formato de implantação, roteamento fail-closed, política de
aprovação do guardian, Plugins nativos do Codex e Computer Use. Para listas
completas de opções, padrões, enums, descoberta, isolamento de ambiente,
timeouts e campos de transporte do app-server, consulte
[Referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Verificar runtime Codex

Use `/status` no chat em que você espera o Codex. Um turno de agente OpenAI com
suporte do Codex mostra:

```text
Runtime: OpenAI Codex
```

Depois verifique o estado do app-server do Codex:

```text
/codex status
/codex models
```

`/codex status` informa conectividade do app-server, conta, limites de taxa,
servidores MCP e Skills. `/codex models` lista o catálogo ao vivo do app-server
do Codex para o harness e a conta. Se `/status` for inesperado, consulte
[Solução de problemas](#troubleshooting).

## Roteamento e seleção de modelo

Mantenha refs de provedor e política de runtime separadas:

- Use `openai/gpt-*` para turnos de agente OpenAI por meio do Codex.
- Não use `openai-codex/gpt-*` na configuração. Execute `openclaw doctor --fix`
  para reparar refs legadas e pins obsoletos de rota de sessão.
- `agentRuntime.id: "codex"` é opcional para o modo automático normal da OpenAI,
  mas útil quando uma implantação deve falhar fechada se o Codex estiver
  indisponível.
- `agentRuntime.id: "pi"` opta um provedor ou modelo para comportamento PI
  direto quando isso for intencional.
- `/codex ...` controla conversas nativas do app-server do Codex a partir do chat.
- ACP/acpx é um caminho separado de harness externo. Use-o apenas quando o usuário
  pedir ACP/acpx ou um adaptador de harness externo.

Roteamento de comandos comum:

| Intenção do usuário             | Use                                     |
| ------------------------------- | --------------------------------------- |
| Anexar o chat atual             | `/codex bind [--cwd <path>]`            |
| Retomar uma thread Codex existente | `/codex resume <thread-id>`          |
| Listar ou filtrar threads Codex | `/codex threads [filter]`               |
| Enviar apenas feedback do Codex | `/codex diagnostics [note]`             |
| Iniciar uma tarefa ACP/acpx     | Comandos de sessão ACP/acpx, não `/codex` |

| Caso de uso                                          | Configurar                                                       | Verificar                               | Observações                        |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| Assinatura ChatGPT/Codex com runtime Codex nativo    | `openai/gpt-*` mais o Plugin `codex` habilitado                  | `/status` mostra `Runtime: OpenAI Codex` | Caminho recomendado                |
| Falhar fechado se o Codex estiver indisponível       | `agentRuntime.id: "codex"` de provedor ou modelo                 | O turno falha em vez de fallback para PI | Use para implantações somente Codex |
| Tráfego direto por chave de API OpenAI via PI        | `agentRuntime.id: "pi"` de provedor ou modelo e autenticação normal da OpenAI | `/status` mostra runtime PI             | Use apenas quando PI for intencional |
| Configuração legada                                  | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` a reescreve     | Não escreva nova configuração assim |
| Adaptador Codex ACP/acpx                             | ACP `sessions_spawn({ runtime: "acp" })`                         | Status de tarefa/sessão ACP             | Separado do harness Codex nativo   |

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use
`openai/gpt-*` para a rota OpenAI normal e `codex/gpt-*` apenas quando o
entendimento de imagem deve rodar por meio de um turno delimitado do app-server
do Codex. Não use `openai-codex/gpt-*`; doctor reescreve esse prefixo legado
para `openai/gpt-*`.

## Padrões de implantação

### Implantação Codex básica

Use a configuração do início rápido quando todos os turnos de agente OpenAI
devem usar o Codex por padrão.

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

Com esta configuração, o agente `main` usa seu caminho normal de provedor e o
agente `codex` usa o app-server do Codex.

### Implantação Codex fail-closed

Para turnos de agente OpenAI, `openai/gpt-*` já resolve para Codex quando o
Plugin incluído está disponível. Adicione uma política de runtime explícita
quando quiser uma regra fail-closed por escrito:

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

Com o Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver
desabilitado, o app-server for antigo demais ou o app-server não conseguir
iniciar.

## Política do app-server

Por padrão, o Plugin inicia localmente o binário Codex gerenciado pelo OpenClaw
com transporte stdio. Defina `appServer.command` apenas quando você
intencionalmente quiser executar um executável diferente. Use transporte
WebSocket apenas quando um app-server já estiver rodando em outro lugar:

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

Sessões locais do app-server via stdio usam por padrão a postura confiável de
operador local: `approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se os requisitos locais do Codex não permitirem
essa postura YOLO implícita, o OpenClaw seleciona permissões guardian permitidas
em vez disso.

Use o modo guardian quando quiser revisão automática nativa do Codex antes de
escapes do sandbox ou permissões extras:

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

O modo guardian se expande para aprovações do app-server do Codex, geralmente
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando os requisitos locais permitem esses valores.

Para todos os campos do app-server, ordem de autenticação, isolamento de
ambiente, descoberta e comportamento de timeout, consulte
[Referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Comandos e diagnósticos

O Plugin incluído registra `/codex` como comando de barra em qualquer canal que
dê suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` verifica a conectividade do servidor de aplicativo, modelos, conta, limites de taxa,
  servidores MCP e Skills.
- `/codex models` lista modelos ativos do servidor de aplicativo Codex.
- `/codex threads [filter]` lista threads recentes do servidor de aplicativo Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma
  thread existente do Codex.
- `/codex compact` pede ao servidor de aplicativo Codex para compactar a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pede confirmação antes de enviar feedback do Codex para a
  thread anexada.
- `/codex account` mostra o status da conta e do limite de taxa.
- `/codex mcp` lista o status dos servidores MCP do servidor de aplicativo Codex.
- `/codex skills` lista as Skills do servidor de aplicativo Codex.

Para a maioria dos relatórios de suporte, comece com `/diagnostics [note]` na conversa
em que o bug aconteceu. Ele cria um relatório de diagnóstico do Gateway e, para sessões
do harness Codex, pede aprovação para enviar o pacote de feedback relevante do Codex.
Veja [Exportação de diagnóstico](/pt-BR/gateway/diagnostics) para o modelo de privacidade e o comportamento em
chats em grupo.

Use `/codex diagnostics [note]` apenas quando você quiser especificamente o upload de
feedback do Codex para a thread atualmente anexada sem o pacote completo de
diagnóstico do Gateway.

### Inspecionar threads do Codex localmente

A forma mais rápida de inspecionar uma execução problemática do Codex geralmente é abrir a thread
nativa do Codex diretamente:

```bash
codex resume <thread-id>
```

Obtenha o id da thread pela resposta concluída de `/diagnostics`, `/codex binding` ou
`/codex threads [filter]`.

Para a mecânica de upload e os limites de diagnóstico em nível de runtime, veja
[Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime#codex-feedback-upload).

A autenticação é selecionada nesta ordem:

1. Um perfil de autenticação explícito do OpenClaw Codex para o agente.
2. A conta existente do servidor de aplicativo no diretório home do Codex desse agente.
3. Somente para inicializações locais do servidor de aplicativo stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta de servidor de aplicativo estiver presente e a autenticação da OpenAI
   ainda for necessária.

Quando o OpenClaw vê um perfil de autenticação do Codex no estilo de assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho Codex gerado. Isso
mantém chaves de API em nível de Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer com que turnos nativos do servidor de aplicativo Codex sejam cobrados pela API por acidente.
Perfis explícitos de chave de API do Codex e fallback de chave de ambiente stdio local usam login no servidor de aplicativo
em vez do ambiente herdado do processo filho. Conexões WebSocket do servidor de aplicativo
não recebem fallback de chave de API do ambiente do Gateway; use um perfil de autenticação explícito ou a
própria conta do servidor de aplicativo remoto.

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

`appServer.clearEnv` afeta apenas o processo filho do servidor de aplicativo Codex gerado.

As ferramentas dinâmicas do Codex usam carregamento `searchable` por padrão. O OpenClaw não expõe
ferramentas dinâmicas que duplicam operações de workspace nativas do Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. As demais ferramentas de
integração do OpenClaw, como mensagens, sessões, mídia, Cron, navegador, nodes,
Gateway, `heartbeat_respond` e `web_search`, ficam disponíveis por meio da busca de ferramentas do Codex
no namespace `openclaw`, mantendo menor o contexto inicial do modelo.
`sessions_yield` e respostas de origem exclusivas de ferramenta de mensagem permanecem diretas porque esses
são contratos de controle de turno. As instruções de colaboração por Heartbeat dizem ao Codex para
buscar `heartbeat_respond` antes de encerrar um turno de heartbeat quando a ferramenta
ainda não estiver carregada.

Defina `codexDynamicToolsLoading: "direct"` apenas ao se conectar a um servidor de aplicativo Codex
personalizado que não consegue buscar ferramentas dinâmicas adiadas ou ao depurar o payload completo
de ferramentas.

Campos de Plugin Codex de nível superior compatíveis:

| Campo                      | Padrão        | Significado                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Use `"direct"` para colocar ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir de turnos do servidor de aplicativo Codex.              |
| `codexPlugins`             | desativado       | Suporte nativo a Plugin/app Codex para Plugins curados migrados e instalados a partir do código-fonte.           |

Campos `appServer` compatíveis:

| Campo                         | Padrão                                                | Significado                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                              | `"stdio"` gera o Codex; `"websocket"` conecta a `url`.                                                                                                                                                                             |
| `command`                     | binário Codex gerenciado                                   | Executável para transporte stdio. Deixe não definido para usar o binário gerenciado; defina apenas para uma substituição explícita.                                                                                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                                                       |
| `url`                         | não definido                                                  | URL WebSocket do servidor de aplicativo.                                                                                                                                                                                                            |
| `authToken`                   | não definido                                                  | Token bearer para transporte WebSocket.                                                                                                                                                                                                |
| `headers`                     | `{}`                                                   | Cabeçalhos WebSocket extras.                                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                                   | Nomes de variáveis de ambiente extras removidas do processo de servidor de aplicativo stdio gerado depois que o OpenClaw constrói seu ambiente herdado. `CODEX_HOME` e `HOME` são reservados para o isolamento Codex por agente do OpenClaw em inicializações locais. |
| `requestTimeoutMs`            | `60000`                                                | Timeout para chamadas de plano de controle do servidor de aplicativo.                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Janela silenciosa após uma solicitação do servidor de aplicativo Codex com escopo de turno enquanto o OpenClaw aguarda `turn/completed`. Aumente isso para fases lentas de síntese pós-ferramenta ou apenas de status.                                                                  |
| `mode`                        | `"yolo"` a menos que requisitos locais do Codex não permitam YOLO | Predefinição para execução YOLO ou revisada por guardian. Requisitos stdio locais que omitem `danger-full-access`, aprovação `never` ou o revisor `user` tornam o padrão implícito guardian.                                                |
| `approvalPolicy`              | `"never"` ou uma política de aprovação guardian permitida       | Política de aprovação nativa do Codex enviada para início/retomada/turno de thread. Padrões guardian preferem `"on-request"` quando permitido.                                                                                                                 |
| `sandbox`                     | `"danger-full-access"` ou um sandbox guardian permitido  | Modo sandbox nativo do Codex enviado para início/retomada de thread. Padrões guardian preferem `"workspace-write"` quando permitido; caso contrário, `"read-only"`.                                                                                           |
| `approvalsReviewer`           | `"user"` ou um revisor guardian permitido               | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos quando permitido; caso contrário, `guardian_subagent` ou `user`. `guardian_subagent` permanece um alias legado.                                                                   |
| `serviceTier`                 | não definido                                                  | Camada de serviço opcional do servidor de aplicativo Codex. `"priority"` habilita roteamento de modo rápido, `"flex"` solicita processamento flex, `null` limpa a substituição, e o legado `"fast"` é aceito como `"priority"`.                                      |

Chamadas de ferramentas dinâmicas pertencentes ao OpenClaw são limitadas independentemente de
`appServer.requestTimeoutMs`: solicitações Codex `item/tool/call` usam um watchdog de 30 segundos
do OpenClaw por padrão. Um argumento positivo `timeoutMs` por chamada estende
ou encurta esse orçamento específico da ferramenta. A ferramenta `image_generate` também usa
`agents.defaults.imageGenerationModel.timeoutMs` quando a chamada de ferramenta não
fornece seu próprio timeout, e a ferramenta `image` de compreensão de mídia usa
`tools.media.image.timeoutSeconds` ou seu padrão de mídia de 60 segundos. Orçamentos de ferramentas dinâmicas
são limitados a 600000 ms. Em timeout, o OpenClaw aborta o sinal da ferramenta
quando compatível e retorna uma resposta de ferramenta dinâmica com falha ao Codex para que o turno
possa continuar em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação do servidor de aplicativo Codex com escopo de turno, o harness
também espera que o Codex conclua o turno nativo com `turn/completed`. Se o
servidor de aplicativo ficar silencioso por `appServer.turnCompletionIdleTimeoutMs` após essa
resposta, o OpenClaw tenta interromper o turno do Codex, registra um timeout de diagnóstico
e libera a lane da sessão OpenClaw para que mensagens de chat de acompanhamento não
fiquem enfileiradas atrás de um turno nativo obsoleto. Qualquer notificação não terminal para o
mesmo turno, incluindo `rawResponseItem/completed`, desarma esse watchdog curto
porque o Codex comprovou que o turno ainda está ativo; o watchdog terminal mais longo
continua protegendo turnos realmente travados. Diagnósticos de timeout incluem o
último método de notificação do servidor de aplicativo e, para itens brutos de resposta do assistente, o
tipo, função, id e uma prévia limitada do texto do assistente.

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
preferida para implantações repetíveis porque mantém o comportamento do plugin no
mesmo arquivo revisado que o restante da configuração do harness Codex.

## Plugins Codex nativos

O suporte a plugins Codex nativos usa os próprios recursos de app e plugin do app-server do Codex
no mesmo thread do Codex que a vez do harness OpenClaw. O OpenClaw
não traduz plugins Codex em ferramentas dinâmicas OpenClaw `codex_plugin_*`
sintéticas.

`codexPlugins` afeta apenas sessões que selecionam o harness Codex nativo. Ele
não tem efeito em execuções PI, execuções normais do provedor OpenAI, vinculações de conversa
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

A configuração do app do thread é calculada quando o OpenClaw estabelece uma sessão do harness Codex
ou substitui uma vinculação obsoleta de thread Codex. Ela não é recalculada a cada turno.
Depois de alterar `codexPlugins`, use `/new`, `/reset` ou reinicie o gateway para que
sessões futuras do harness Codex comecem com o conjunto de apps atualizado.

Para elegibilidade de migração, inventário de apps, política de ações destrutivas,
elicitações e diagnósticos de plugin nativo, consulte
[Plugins Codex nativos](/pt-BR/plugins/codex-native-plugins).

## Computer Use

Computer Use é abordado em seu próprio guia de configuração:
[Codex Computer Use](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não incorpora o app de controle de desktop nem executa
ações de desktop por conta própria. Ele prepara o app-server do Codex, verifica se o servidor MCP
`computer-use` está disponível e então deixa o Codex assumir as chamadas de ferramentas MCP
nativas durante turnos no modo Codex.

## Limites de runtime

O harness Codex altera apenas o executor de agente incorporado de baixo nível.

- Ferramentas dinâmicas do OpenClaw são compatíveis. O Codex pede ao OpenClaw para executar essas
  ferramentas, então o OpenClaw permanece no caminho de execução.
- Ferramentas shell, patch, MCP e de app nativo do Codex são de responsabilidade do Codex.
  O OpenClaw pode observar ou bloquear eventos nativos selecionados por meio do relay
  compatível, mas não reescreve argumentos de ferramentas nativas.
- O Codex é responsável pela Compaction nativa. O OpenClaw mantém um espelho da transcrição para histórico
  do canal, pesquisa, `/new`, `/reset` e futura troca de modelo ou harness.
- Geração de mídia, compreensão de mídia, TTS, aprovações e saída de ferramentas de mensagens
  continuam pelas configurações correspondentes de provedor/modelo do OpenClaw.
- `tool_result_persist` se aplica a resultados de ferramentas da transcrição de propriedade do OpenClaw, não
  a registros de resultados de ferramentas nativas do Codex.

Para camadas de hook, superfícies V1 compatíveis, manipulação de permissões nativas, direcionamento de fila,
mecânica de upload de feedback do Codex e detalhes de Compaction, consulte
[Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime).

## Solução de problemas

**O Codex não aparece como um provedor `/model` normal:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa PI em vez do Codex:** certifique-se de que a ref do modelo seja
`openai/gpt-*` no provedor OpenAI oficial e que o plugin Codex esteja
instalado e habilitado. Se você precisar de prova estrita durante os testes, defina `agentRuntime.id: "codex"` no provedor ou
modelo. Um runtime Codex forçado falha em vez de
recair para PI.

**A configuração legada `openai-codex/*` permanece:** execute `openclaw doctor --fix`.
O Doctor reescreve refs de modelo legadas para `openai/*`, remove pins de runtime de sessão e
de agente inteiro obsoletos e preserva substituições existentes de perfil de autenticação.

**O app-server é rejeitado:** use o app-server do Codex `0.125.0` ou mais recente.
Pré-lançamentos da mesma versão ou versões com sufixos de build, como
`0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o OpenClaw testa o
piso do protocolo estável `0.125.0`.

**`/codex status` não consegue conectar:** verifique se o plugin `codex` empacotado está
habilitado, se `plugins.allow` o inclui quando uma lista de permissões está configurada e
se qualquer `appServer.command`, `url`, `authToken` ou cabeçalhos personalizados são válidos.

**A descoberta de modelos está lenta:** reduza
`plugins.entries.codex.config.discovery.timeoutMs` ou desabilite a descoberta. Consulte
[Referência do harness Codex](/pt-BR/plugins/codex-harness-reference#model-discovery).

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`,
cabeçalhos e se o app-server remoto fala a mesma versão do protocolo app-server
do Codex.

**Um modelo que não é Codex usa PI:** isso é esperado, a menos que a política de runtime do provedor ou modelo
o direcione para outro harness. Refs simples de provedores que não são OpenAI permanecem no
caminho normal do provedor no modo `auto`.

**Computer Use está instalado, mas as ferramentas não executam:** verifique
`/codex computer-use status` a partir de uma sessão nova. Se uma ferramenta informar
`Native hook relay unavailable`, use `/new` ou `/reset`; se persistir, reinicie
o gateway para limpar registros obsoletos de hooks nativos. Consulte
[Codex Computer Use](/pt-BR/plugins/codex-computer-use#troubleshooting).

## Relacionados

- [Referência do harness Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Plugins Codex nativos](/pt-BR/plugins/codex-native-plugins)
- [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Hooks de plugin](/pt-BR/plugins/hooks)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Status](/pt-BR/cli/status)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
