---
read_when:
    - Você precisa de todos os campos de configuração do ambiente de execução do Codex
    - Você está alterando o comportamento de transporte, autenticação, descoberta ou tempo limite do app-server
    - Você está depurando a inicialização do ambiente de execução do Codex, a descoberta de modelos ou o isolamento de ambiente
summary: Referência de configuração, autenticação, descoberta e servidor de aplicativos para o ambiente de execução do Codex
title: Referência do ambiente de execução do Codex
x-i18n:
    generated_at: "2026-05-10T19:40:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Esta referência cobre a configuração detalhada do Plugin `codex`
incluído. Para decisões de configuração e roteamento, comece com
[Harness Codex](/pt-BR/plugins/codex-harness).

## Superfície de configuração do Plugin

Todas as configurações do harness Codex ficam em `plugins.entries.codex.config`.

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Campos de nível superior compatíveis:

| Campo                      | Padrão                  | Significado                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | habilitado                  | Configurações de descoberta de modelos para `model/list` do app-server Codex.                                                                               |
| `appServer`                | app-server stdio gerenciado | Configurações de transporte, comando, autenticação, aprovação, sandbox e tempo limite.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Use `"direct"` para colocar ferramentas dinâmicas do OpenClaw diretamente no contexto inicial de ferramentas do Codex.                                                  |
| `codexDynamicToolsExclude` | `[]`                     | Nomes adicionais de ferramentas dinâmicas do OpenClaw a omitir dos turnos do app-server Codex.                                                               |
| `codexPlugins`             | desabilitado                 | Suporte nativo a plugins/apps Codex para plugins selecionados instalados a partir do código-fonte e migrados. Consulte [Plugins Codex nativos](/pt-BR/plugins/codex-native-plugins). |
| `computerUse`              | desabilitado                 | Configuração do Codex Computer Use. Consulte [Codex Computer Use](/pt-BR/plugins/codex-computer-use).                                                          |

## Transporte do app-server

Por padrão, o OpenClaw inicia o binário Codex gerenciado enviado com o Plugin
incluído:

```bash
codex app-server --listen stdio://
```

Isso mantém a versão do app-server vinculada ao Plugin `codex` incluído, em vez de
qualquer CLI Codex separada que por acaso esteja instalada localmente. Defina
`appServer.command` apenas quando você quiser intencionalmente executar um
executável diferente.

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
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Campos `appServer` compatíveis:

| Campo                         | Padrão                                                | Significado                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` gera o Codex; `"websocket"` se conecta a `url`.                                                                                                                                        |
| `command`                     | binário Codex gerenciado                                   | Executável para transporte stdio. Deixe sem definir para usar o binário gerenciado.                                                                                                                          |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para transporte stdio.                                                                                                                                                                  |
| `url`                         | não definido                                                  | URL do app-server WebSocket.                                                                                                                                                                       |
| `authToken`                   | não definido                                                  | Token Bearer para transporte WebSocket.                                                                                                                                                           |
| `headers`                     | `{}`                                                   | Cabeçalhos WebSocket extras.                                                                                                                                                                        |
| `clearEnv`                    | `[]`                                                   | Nomes de variáveis de ambiente extras removidos do processo app-server stdio gerado depois que o OpenClaw constrói seu ambiente herdado.                                                             |
| `requestTimeoutMs`            | `60000`                                                | Tempo limite para chamadas de plano de controle do app-server.                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Janela silenciosa após uma solicitação do app-server com escopo de turno enquanto o OpenClaw aguarda `turn/completed`.                                                                                                  |
| `mode`                        | `"yolo"` a menos que os requisitos locais do Codex não permitam YOLO | Predefinição para execução YOLO ou revisada por guardian.                                                                                                                                                 |
| `approvalPolicy`              | `"never"` ou uma política de aprovação guardian permitida       | Política de aprovação nativa do Codex enviada ao início, retomada e turno da thread.                                                                                                                            |
| `sandbox`                     | `"danger-full-access"` ou um sandbox guardian permitido  | Modo sandbox nativo do Codex enviado ao início e retomada da thread.                                                                                                                                      |
| `approvalsReviewer`           | `"user"` ou um revisor guardian permitido               | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos quando permitido.                                                                                                                   |
| `defaultWorkspaceDir`         | diretório do processo atual                              | Workspace usado por `/codex bind` quando `--cwd` é omitido.                                                                                                                                        |
| `serviceTier`                 | não definido                                                  | Camada de serviço opcional do app-server Codex. `"priority"` habilita roteamento em modo rápido, `"flex"` solicita processamento flex, e `null` limpa a substituição. O legado `"fast"` é aceito como `"priority"`. |

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. O app-server
Codex deve relatar a versão estável `0.125.0` ou mais recente.

## Modos de aprovação e sandbox

Sessões locais de app-server stdio usam modo YOLO por padrão:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa postura confiável de operador local permite que
turnos e heartbeats do OpenClaw sem supervisão avancem sem prompts de aprovação
nativos que ninguém esteja disponível para responder.

Se o arquivo local de requisitos de sistema do Codex não permitir valores implícitos
de aprovação YOLO, revisor ou sandbox, o OpenClaw trata o padrão implícito como guardian
e seleciona permissões guardian permitidas. Entradas
`[[remote_sandbox_config]]` com correspondência de hostname no mesmo arquivo de requisitos
são respeitadas para a decisão padrão de sandbox.

Defina `appServer.mode: "guardian"` para aprovações do Codex revisadas por guardian:

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

A predefinição `guardian` se expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"` quando esses
valores são permitidos. Campos individuais de política substituem `mode`. O valor de
revisor mais antigo `guardian_subagent` ainda é aceito como alias de compatibilidade,
mas novas configurações devem usar `auto_review`.

## Autenticação e isolamento de ambiente

A autenticação é selecionada nesta ordem:

1. Um perfil explícito de autenticação Codex do OpenClaw para o agente.
2. A conta existente do app-server no Codex home desse agente.
3. Apenas para inicializações locais de app-server stdio, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta do app-server está presente e a autenticação OpenAI
   ainda é necessária.

Quando o OpenClaw encontra um perfil de autenticação Codex no estilo assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho Codex gerado. Isso
mantém as chaves de API em nível de Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer com que turnos nativos do app-server Codex sejam cobrados pela API por acidente.

Perfis explícitos de chave de API Codex e fallback de chave de ambiente stdio local usam login do app-server
em vez de ambiente herdado do processo filho. Conexões de app-server WebSocket
não recebem fallback de chave de API de ambiente do Gateway; use um perfil de autenticação explícito ou a
própria conta do app-server remoto.

Inicializações de app-server stdio herdam o ambiente do processo do OpenClaw por padrão, mas
o OpenClaw possui a ponte de conta do app-server Codex e define tanto `CODEX_HOME` quanto
`HOME` para diretórios por agente no estado do OpenClaw desse agente. O próprio
carregador de Skills do Codex lê `$CODEX_HOME/skills` e `$HOME/.agents/skills`, então ambos
os valores são isolados para inicializações locais de app-server. Isso mantém Skills,
plugins, configuração, contas e estado de thread nativos do Codex com escopo no agente OpenClaw
em vez de vazar do Codex CLI home pessoal do operador.

Plugins OpenClaw e snapshots de Skills do OpenClaw ainda fluem pelo próprio
registro de Plugin e carregador de Skills do OpenClaw. Ativos pessoais do Codex CLI não. Se você tiver
Skills ou plugins úteis do Codex CLI que devam se tornar parte de um agente OpenClaw,
faça o inventário deles explicitamente:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` afeta apenas o processo filho do app-server Codex gerado.
`CODEX_HOME` e `HOME` permanecem reservados para o isolamento Codex por agente do OpenClaw
em inicializações locais.

## Ferramentas dinâmicas

Ferramentas dinâmicas Codex usam carregamento `searchable` por padrão. O OpenClaw não expõe
ferramentas dinâmicas que duplicam operações de workspace nativas do Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

As demais ferramentas de integração do OpenClaw, como mensagens, sessões, mídia, cron,
navegador, nós, gateway, `heartbeat_respond` e `web_search`, estão disponíveis
pela busca de ferramentas do Codex no namespace `openclaw`. Isso mantém o contexto
inicial do modelo menor. `sessions_yield` e respostas de origem apenas por ferramenta de mensagem
permanecem diretas porque esses são contratos de controle de turno.

Defina `codexDynamicToolsLoading: "direct"` somente ao se conectar a um app-server
Codex personalizado que não consegue buscar ferramentas dinâmicas adiadas ou ao depurar a carga
completa de ferramentas.

## Timeouts

As chamadas de ferramentas dinâmicas pertencentes ao OpenClaw são limitadas de forma independente de
`appServer.requestTimeoutMs`. Cada solicitação Codex `item/tool/call` usa o primeiro
timeout disponível nesta ordem:

- Um argumento `timeoutMs` positivo por chamada.
- Para `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Para a ferramenta `image` de compreensão de mídia, `tools.media.image.timeoutSeconds`
  convertido para milissegundos, ou o padrão de mídia de 60 segundos.
- O padrão de ferramenta dinâmica de 30 segundos.

Os orçamentos de ferramentas dinâmicas são limitados a 600000 ms. Em caso de timeout, o OpenClaw aborta o
sinal da ferramenta quando há suporte e retorna uma resposta de ferramenta dinâmica com falha ao Codex
para que o turno possa continuar, em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação app-server com escopo de turno do Codex, o harness
também espera que o Codex finalize o turno nativo com `turn/completed`. Se o
app-server ficar silencioso por `appServer.turnCompletionIdleTimeoutMs` após essa
resposta, o OpenClaw interrompe o turno do Codex em melhor esforço, registra um timeout
diagnóstico e libera a faixa de sessão do OpenClaw para que mensagens de chat subsequentes
não fiquem enfileiradas atrás de um turno nativo obsoleto.

Qualquer notificação não terminal para o mesmo turno, incluindo
`rawResponseItem/completed`, desarma esse watchdog curto porque o Codex
provou que o turno ainda está ativo. O watchdog terminal mais longo continua a
proteger turnos genuinamente travados. Os diagnósticos de timeout incluem o último método de
notificação do app-server e, para itens brutos de resposta do assistente, o tipo do item, função,
id e uma prévia limitada do texto do assistente.

## Descoberta de modelos

Por padrão, o Plugin Codex pede ao app-server os modelos disponíveis. A
disponibilidade de modelos pertence ao app-server do Codex, então a lista pode mudar quando o OpenClaw
atualiza a versão integrada de `@openai/codex` ou quando uma implantação aponta
`appServer.command` para um binário Codex diferente. A disponibilidade também pode ter
escopo por conta. Use `/codex models` em um Gateway em execução para ver o catálogo ativo
desse harness e dessa conta.

Se a descoberta falhar ou exceder o timeout, o OpenClaw usa um catálogo fallback integrado para:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

O harness integrado atual é `@openai/codex` `0.130.0`. Uma sondagem `model/list`
contra esse app-server integrado retornou:

| ID do modelo          | Padrão | Oculto | Modalidades de entrada | Esforços de raciocínio   |
| --------------------- | ------ | ------ | ---------------------- | ------------------------ |
| `gpt-5.5`             | Sim    | Não    | text, image            | low, medium, high, xhigh |
| `gpt-5.4`             | Não    | Não    | text, image            | low, medium, high, xhigh |
| `gpt-5.4-mini`        | Não    | Não    | text, image            | low, medium, high, xhigh |
| `gpt-5.3-codex`       | Não    | Não    | text, image            | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | Não    | Não    | text                   | low, medium, high, xhigh |
| `gpt-5.2`             | Não    | Não    | text, image            | low, medium, high, xhigh |

Modelos ocultos podem ser retornados pelo catálogo do app-server para fluxos internos ou
especializados, mas não são escolhas normais do seletor de modelos.

Ajuste a descoberta em `plugins.entries.codex.config.discovery`:

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

Desative a descoberta quando quiser que a inicialização evite sondar o Codex e use apenas o
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

## Arquivos de bootstrap do workspace

O Codex lida com `AGENTS.md` por conta própria por meio da descoberta nativa de documentos de projeto. O OpenClaw
não grava arquivos sintéticos de documentos de projeto do Codex nem depende de nomes de arquivo
fallback do Codex para arquivos de persona, porque fallbacks do Codex só se aplicam quando
`AGENTS.md` está ausente.

Para paridade de workspace do OpenClaw, o harness Codex resolve os outros arquivos de bootstrap,
incluindo `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`,
`HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md` quando presentes, e os encaminha
por meio das instruções de desenvolvedor do Codex em `thread/start` e `thread/resume`.
Isso mantém o contexto de persona e perfil do workspace visível na faixa nativa de
modelagem de comportamento do Codex sem duplicar `AGENTS.md`.

## Substituições de ambiente

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
mesmo arquivo revisado que o restante da configuração do harness Codex.

## Relacionado

- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Plugins Codex nativos](/pt-BR/plugins/codex-native-plugins)
- [Codex Computer Use](/pt-BR/plugins/codex-computer-use)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
