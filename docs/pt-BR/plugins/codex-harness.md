---
read_when:
    - Você quer usar o harness incluído do servidor de app Codex
    - Você precisa de exemplos de configuração do harness Codex
    - Você quer que implantações somente Codex falhem em vez de recorrer ao Pi
summary: Execute turnos de agente incorporado do OpenClaw por meio do harness incluído do servidor de app Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-25T13:50:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

O Plugin incluído `codex` permite que o OpenClaw execute turnos de agente incorporado por meio do
servidor de app Codex em vez do harness PI integrado.

Use isso quando quiser que o Codex controle a sessão de agente de baixo nível: descoberta
de modelo, retomada nativa de thread, Compaction nativa e execução do servidor de app.
O OpenClaw continua controlando canais de chat, arquivos de sessão, seleção de modelo, ferramentas,
aprovações, entrega de mídia e o espelhamento visível da transcrição.

Se você estiver tentando se orientar, comece por
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é o model ref, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

Turnos nativos do Codex mantêm hooks de Plugin do OpenClaw como camada pública de compatibilidade.
Esses são hooks do OpenClaw em processo, não hooks de comando `hooks.json` do Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcrição espelhados
- `agent_end`

Plugins também podem registrar middleware neutro de resultado de ferramenta para reescrever
resultados dinâmicos de ferramenta do OpenClaw depois que o OpenClaw executa a ferramenta e antes
de o resultado ser retornado ao Codex. Isso é separado do hook público de Plugin
`tool_result_persist`, que transforma gravações de resultado de ferramenta pertencentes ao OpenClaw na transcrição.

Para a semântica dos hooks de Plugin em si, consulte [Hooks de Plugin](/pt-BR/plugins/hooks)
e [Comportamento de guard de Plugin](/pt-BR/tools/plugin).

O harness fica desativado por padrão. Configurações novas devem manter model refs da OpenAI
canônicos como `openai/gpt-*` e forçar explicitamente
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` quando
quiserem execução nativa do servidor de app. Model refs legados `codex/*` ainda selecionam
automaticamente o harness por compatibilidade, mas prefixos legados de provedor com suporte a runtime
não são exibidos como escolhas normais de modelo/provedor.

## Escolha o prefixo de modelo correto

Rotas da família OpenAI dependem do prefixo. Use `openai-codex/*` quando quiser
OAuth do Codex por meio do PI; use `openai/*` quando quiser acesso direto à API da OpenAI ou
quando estiver forçando o harness nativo do servidor de app Codex:

| Model ref                                             | Caminho de runtime                            | Use quando                                                                |
| ----------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | Provedor OpenAI pela infraestrutura OpenClaw/PI | Você quer acesso atual direto à API da OpenAI Platform com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                | OAuth do OpenAI Codex por meio do OpenClaw/PI | Você quer autenticação de assinatura ChatGPT/Codex com o executor PI padrão. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness do servidor de app Codex              | Você quer execução nativa do servidor de app Codex para o turno de agente incorporado.   |

Atualmente, GPT-5.5 é compatível no OpenClaw apenas com assinatura/OAuth. Use
`openai-codex/gpt-5.5` para OAuth com PI, ou `openai/gpt-5.5` com o harness do
servidor de app Codex. O acesso direto por chave de API para `openai/gpt-5.5` será compatível
quando a OpenAI habilitar GPT-5.5 na API pública.

Refs legados `codex/gpt-*` continuam aceitos como aliases de compatibilidade. A
migração de compatibilidade do doctor reescreve refs legados primários de runtime para model refs canônicos
e registra a política de runtime separadamente, enquanto refs legados somente de fallback permanecem inalterados
porque o runtime é configurado para todo o contêiner do agente.
Novas configurações de OAuth do PI Codex devem usar `openai-codex/gpt-*`; novas configurações do
harness nativo do servidor de app devem usar `openai/gpt-*` mais
`embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` segue a mesma divisão de prefixo. Use
`openai-codex/gpt-*` quando a interpretação de imagem deve ser executada pelo caminho de provedor OAuth do OpenAI
Codex. Use `codex/gpt-*` quando a interpretação de imagem deve ser executada
por meio de um turno limitado do servidor de app Codex. O modelo do servidor de app Codex deve
anunciar suporte a entrada de imagem; modelos Codex somente texto falham antes de o turno de mídia
começar.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a
seleção for inesperada, habilite logging de depuração para o subsistema `agents/harness`
e inspecione o registro estruturado `agent harness selected` do gateway. Ele
inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e,
no modo `auto`, o resultado de suporte de cada candidato de Plugin.

A seleção de harness não é um controle ativo da sessão. Quando um turno incorporado é executado,
o OpenClaw registra o id do harness selecionado nessa sessão e continua usando-o para
turnos posteriores no mesmo id de sessão. Altere a configuração `embeddedHarness` ou
`OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro harness;
use `/new` ou `/reset` para iniciar uma sessão nova antes de alternar uma conversa existente
entre PI e Codex. Isso evita reproduzir uma transcrição por dois sistemas
nativos de sessão incompatíveis.

Sessões legadas criadas antes de pins de harness são tratadas como fixadas em PI assim que
têm histórico de transcrição. Use `/new` ou `/reset` para migrar essa conversa para
Codex após alterar a configuração.

`/status` mostra o runtime efetivo do modelo. O harness PI padrão aparece como
`Runtime: OpenClaw Pi Default`, e o harness do servidor de app Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw com o Plugin incluído `codex` disponível.
- Servidor de app Codex `0.118.0` ou mais recente.
- Autenticação do Codex disponível para o processo do servidor de app.

O Plugin bloqueia handshakes de servidor de app mais antigos ou sem versão. Isso mantém
o OpenClaw na superfície de protocolo contra a qual foi testado.

Para testes ativos e em Docker, a autenticação geralmente vem de `OPENAI_API_KEY`, mais
arquivos opcionais do Codex CLI como `~/.codex/auth.json` e
`~/.codex/config.toml`. Use o mesmo material de autenticação que seu servidor de app Codex local
usa.

## Configuração mínima

Use `openai/gpt-5.5`, habilite o Plugin incluído e force o harness `codex`:

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
      embeddedHarness: {
        runtime: "codex",
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

Configurações legadas que definem `agents.defaults.model` ou um modelo de agente como
`codex/<model>` ainda habilitam automaticamente o Plugin incluído `codex`. Configurações novas devem
preferir `openai/<model>` mais a entrada explícita `embeddedHarness` acima.

## Adicione Codex junto com outros modelos

Não defina `runtime: "codex"` globalmente se o mesmo agente precisar alternar livremente
entre modelos do Codex e de provedores não Codex. Um runtime forçado se aplica a todo
turno incorporado daquele agente ou sessão. Se você selecionar um modelo Anthropic enquanto
esse runtime estiver forçado, o OpenClaw ainda tentará o harness Codex e falhará de forma fechada
em vez de rotear silenciosamente esse turno pelo PI.

Use uma destas formas em vez disso:

- Coloque o Codex em um agente dedicado com `embeddedHarness.runtime: "codex"`.
- Mantenha o agente padrão em `runtime: "auto"` e fallback para PI para uso normal
  misto entre provedores.
- Use refs legados `codex/*` apenas por compatibilidade. Configurações novas devem preferir
  `openai/*` mais uma política explícita de runtime Codex.

Por exemplo, isso mantém o agente padrão em seleção automática normal e
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
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
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
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

Com essa forma:

- O agente padrão `main` usa o caminho normal de provedor e o fallback de compatibilidade com PI.
- O agente `codex` usa o harness do servidor de app Codex.
- Se o Codex estiver ausente ou não for compatível com o agente `codex`, o turno falha
  em vez de usar PI silenciosamente.

## Implantações somente Codex

Force o harness Codex quando precisar provar que todo turno de agente incorporado
usa Codex. Runtimes explícitos de Plugin usam por padrão nenhum fallback para PI, então
`fallback: "none"` é opcional, mas muitas vezes útil como documentação:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Substituição por ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Com o Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver desabilitado, o
servidor de app estiver muito antigo ou o servidor de app não puder iniciar. Defina
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` apenas se você quiser intencionalmente que o PI trate
a ausência de seleção do harness.

## Codex por agente

Você pode tornar um agente somente Codex enquanto o agente padrão mantém a
seleção automática normal:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
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
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Use comandos normais de sessão para alternar agentes e modelos. `/new` cria uma
nova sessão OpenClaw e o harness Codex cria ou retoma sua thread sidecar do servidor de app
conforme necessário. `/reset` limpa a vinculação da sessão OpenClaw para essa thread
e permite que o próximo turno resolva o harness a partir da configuração atual novamente.

## Descoberta de modelo

Por padrão, o Plugin Codex consulta o servidor de app em busca de modelos disponíveis. Se a
descoberta falhar ou expirar, ele usa um catálogo de fallback incluído para:

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

Desabilite a descoberta quando quiser que a inicialização evite sondar o Codex e se limite ao
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

## Conexão com o servidor de app e política

Por padrão, o Plugin inicia o Codex localmente com:

```bash
codex app-server --listen stdio://
```

Por padrão, o OpenClaw inicia sessões locais do harness Codex em modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa é a postura confiável de operador local usada
para Heartbeat autônomo: o Codex pode usar ferramentas de shell e rede sem
parar em prompts nativos de aprovação que ninguém está por perto para responder.

Para fazer opt-in a aprovações revisadas pelo Guardian do Codex, defina `appServer.mode:
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

O modo Guardian usa o caminho nativo de aprovação com revisão automática do Codex. Quando o Codex pede para
sair do sandbox, gravar fora do workspace ou adicionar permissões como acesso à rede,
o Codex encaminha essa solicitação de aprovação ao revisor nativo em vez de um
prompt humano. O revisor aplica a estrutura de risco do Codex e aprova ou nega
a solicitação específica. Use Guardian quando quiser mais proteções do que o modo YOLO,
mas ainda precisar que agentes não assistidos avancem.

O preset `guardian` se expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
Campos individuais de política ainda substituem `mode`, então implantações avançadas podem combinar
o preset com escolhas explícitas. O valor de revisor mais antigo `guardian_subagent`
ainda é aceito como alias de compatibilidade, mas configurações novas devem usar
`auto_review`.

Para um servidor de app já em execução, use transporte WebSocket:

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

Campos compatíveis de `appServer`:

| Campo               | Padrão                                   | Significado                                                                                                      |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                         |
| `command`           | `"codex"`                                | Executável para transporte stdio.                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                |
| `url`               | não definido                             | URL WebSocket do servidor de app.                                                                                |
| `authToken`         | não definido                             | Token Bearer para transporte WebSocket.                                                                          |
| `headers`           | `{}`                                     | Cabeçalhos WebSocket extras.                                                                                     |
| `requestTimeoutMs`  | `60000`                                  | Timeout para chamadas do plano de controle do servidor de app.                                                   |
| `mode`              | `"yolo"`                                 | Preset para execução YOLO ou revisada por guardian.                                                              |
| `approvalPolicy`    | `"never"`                                | Política nativa de aprovação do Codex enviada para iniciar/retomar/executar turnos na thread.                   |
| `sandbox`           | `"danger-full-access"`                   | Modo nativo de sandbox do Codex enviado ao iniciar/retomar a thread.                                             |
| `approvalsReviewer` | `"user"`                                 | Use `"auto_review"` para permitir que o Codex revise prompts nativos de aprovação. `guardian_subagent` continua como alias legado. |
| `serviceTier`       | não definido                             | Camada opcional de serviço do servidor de app Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados. |

As variáveis de ambiente mais antigas ainda funcionam como fallbacks para testes locais quando
o campo de configuração correspondente não está definido:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removida. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` em vez disso, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. Configuração é
preferível para implantações reproduzíveis porque mantém o comportamento do plugin no
mesmo arquivo revisado que o restante da configuração do harness Codex.

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
      embeddedHarness: {
        runtime: "codex",
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

Aprovações do Codex revisadas por guardian:

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

Servidor de app remoto com cabeçalhos explícitos:

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

A troca de modelo continua sendo controlada pelo OpenClaw. Quando uma sessão OpenClaw está vinculada
a uma thread Codex existente, o próximo turno envia novamente ao
servidor de app o modelo OpenAI atualmente selecionado, o provedor, a política de aprovação, o sandbox e a camada de serviço.
Mudar de `openai/gpt-5.5` para `openai/gpt-5.2` mantém a
vinculação da thread, mas pede ao Codex para continuar com o modelo recém-selecionado.

## Comando Codex

O Plugin incluído registra `/codex` como um comando slash autorizado. Ele é
genérico e funciona em qualquer canal que ofereça suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade ativa com o servidor de app, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista modelos ativos do servidor de app Codex.
- `/codex threads [filter]` lista threads recentes do Codex.
- `/codex resume <thread-id>` vincula a sessão OpenClaw atual a uma thread Codex existente.
- `/codex compact` pede ao servidor de app Codex para fazer Compaction da thread vinculada.
- `/codex review` inicia uma revisão nativa do Codex para a thread vinculada.
- `/codex account` mostra status da conta e de limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do servidor de app Codex.
- `/codex skills` lista as Skills do servidor de app Codex.

`/codex resume` grava o mesmo arquivo sidecar de vinculação que o harness usa para
turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread do Codex, passa o
modelo OpenClaw atualmente selecionado ao servidor de app e mantém o histórico
estendido habilitado.

A superfície de comando exige servidor de app Codex `0.118.0` ou mais recente. Métodos
individuais de controle são informados como `unsupported by this Codex app-server` se um
servidor de app futuro ou personalizado não expuser esse método JSON-RPC.

## Limites de hooks

O harness Codex tem três camadas de hooks:

| Camada                                | Proprietário             | Finalidade                                                          |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin do OpenClaw           | OpenClaw                 | Compatibilidade de produto/plugin entre harnesses PI e Codex.       |
| Middleware de extensão do servidor de app Codex | Plugins incluídos do OpenClaw | Comportamento adaptador por turno em torno de ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política nativa de ferramentas a partir da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para rotear
o comportamento de Plugin do OpenClaw. Para a bridge compatível de ferramenta nativa e permissões,
o OpenClaw injeta configuração por thread do Codex para `PreToolUse`, `PostToolUse` e
`PermissionRequest`. Outros hooks do Codex como `SessionStart`,
`UserPromptSubmit` e `Stop` continuam sendo controles em nível de Codex; eles não são expostos
como hooks de Plugin do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta após o Codex solicitar a
chamada, então o OpenClaw dispara o comportamento de Plugin e middleware que controla no
adaptador do harness. Para ferramentas nativas do Codex, o Codex controla o registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação por meio do servidor de app ou callbacks
de hooks nativos.

Projeções de Compaction e ciclo de vida de LLM vêm de notificações do servidor de app Codex
e do estado do adaptador do OpenClaw, não de comandos de hook nativos do Codex.
Eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações em nível de adaptador, não capturas byte a byte
da solicitação interna ou da payload de Compaction do Codex.

Notificações nativas `hook/started` e `hook/completed` do servidor de app Codex são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de Plugin do OpenClaw.

## Contrato de suporte v1

O modo Codex não é PI com uma chamada de modelo diferente por baixo. O Codex controla mais do
loop nativo do modelo, e o OpenClaw adapta suas superfícies de plugin e sessão
em torno desse limite.

Compatível no runtime Codex v1:

| Superfície                              | Suporte                                 | Por quê                                                                                                                                     |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo OpenAI por meio do Codex | Compatível                              | O servidor de app Codex controla o turno OpenAI, a retomada nativa de thread e a continuação nativa de ferramentas.                       |
| Roteamento e entrega de canal do OpenClaw | Compatível                            | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais permanecem fora do runtime do modelo.                                         |
| Ferramentas dinâmicas do OpenClaw       | Compatível                              | O Codex pede ao OpenClaw para executar essas ferramentas, então o OpenClaw permanece no caminho de execução.                              |
| Plugins de prompt e contexto            | Compatível                              | O OpenClaw constrói overlays de prompt e projeta contexto no turno do Codex antes de iniciar ou retomar a thread.                         |
| Ciclo de vida do engine de contexto     | Compatível                              | Assemble, ingest ou manutenção after-turn, e coordenação de Compaction do engine de contexto são executados para turnos Codex.            |
| Hooks de ferramenta dinâmica            | Compatível                              | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta são executados em torno de ferramentas dinâmicas do OpenClaw. |
| Hooks de ciclo de vida                  | Compatível como observações do adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos no modo Codex.           |
| Observar ou bloquear shell e patch nativos | Compatível por meio do relay de hooks nativos | `PreToolUse` e `PostToolUse` do Codex são retransmitidos para as superfícies nativas de ferramenta compatidas. O bloqueio é compatível; a reescrita de argumentos não é. |
| Política nativa de permissões           | Compatível por meio do relay de hooks nativos | `PermissionRequest` do Codex pode ser roteado pela política do OpenClaw quando o runtime expõe isso.                                      |
| Captura de trajetória do servidor de app | Compatível                             | O OpenClaw registra a solicitação enviada ao servidor de app e as notificações recebidas dele.                                            |

Não compatível no runtime Codex v1:

| Superfície                                           | Limite v1                                                                                                                                      | Caminho futuro                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Mutação nativa de argumentos de ferramenta           | Hooks nativos pre-tool do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.                      | Exige suporte de hook/schema do Codex para substituir a entrada da ferramenta.                              |
| Histórico nativo editável de transcrição do Codex    | O Codex controla o histórico canônico da thread nativa. O OpenClaw controla um espelho e pode projetar contexto futuro, mas não deve mutar internos não compatíveis. | Adicionar APIs explícitas do servidor de app Codex se for necessária cirurgia na thread nativa.            |
| `tool_result_persist` para registros de ferramenta nativa do Codex | Esse hook transforma gravações de transcrição pertencentes ao OpenClaw, não registros de ferramentas nativas do Codex.                        | Poderia espelhar registros transformados, mas a reescrita canônica exige suporte do Codex.                 |
| Metadados ricos de Compaction nativa                 | O OpenClaw observa o início e a conclusão da Compaction, mas não recebe uma lista estável de itens mantidos/removidos, delta de tokens ou payload de resumo. | Exige eventos mais ricos de Compaction do Codex.                                                            |
| Intervenção em Compaction                            | Os hooks atuais de Compaction do OpenClaw são em nível de notificação no modo Codex.                                                           | Adicionar hooks pre/post de Compaction do Codex se plugins precisarem vetar ou reescrever a Compaction nativa. |
| Bloqueio de parada ou resposta final                 | O Codex tem hooks nativos de parada, mas o OpenClaw não expõe o bloqueio de resposta final como contrato de plugin v1.                        | Futuro primitivo de opt-in com proteções de loop e timeout.                                                 |
| Paridade de hook MCP nativo como superfície v1 consolidada | O relay é genérico, mas o OpenClaw ainda não fez version-gating e testes ponta a ponta do comportamento de hooks MCP nativos.                 | Adicionar testes e documentação de relay MCP do OpenClaw quando o piso do protocolo compatível do servidor de app cobrir essas payloads. |
| Captura byte a byte da solicitação da API do modelo  | O OpenClaw pode capturar solicitações e notificações do servidor de app, mas o núcleo do Codex constrói internamente a solicitação final à API da OpenAI. | Exige um evento de tracing de solicitação de modelo do Codex ou API de depuração.                          |

## Ferramentas, mídia e Compaction

O harness Codex altera apenas o executor de baixo nível do agente incorporado.

O OpenClaw ainda constrói a lista de ferramentas e recebe resultados dinâmicos de ferramenta do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramentas de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

O relay nativo de hooks é intencionalmente genérico, mas o contrato de suporte v1 é
limitado aos caminhos nativos de ferramenta e permissão do Codex que o OpenClaw testa. Não
presuma que todo futuro evento de hook do Codex seja uma superfície de plugin do OpenClaw até que o
contrato de runtime o nomeie.

Solicitações de aprovação de ferramenta MCP do Codex são roteadas pelo fluxo de
aprovação de plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta para o
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação nativa
do servidor em vez de ser tratada como contexto extra. Outras solicitações de elicitação MCP ainda falham de forma fechada.

Quando o modelo selecionado usa o harness Codex, a Compaction nativa da thread é
delegada ao servidor de app Codex. O OpenClaw mantém um espelho da transcrição para histórico
de canal, busca, `/new`, `/reset` e futura troca de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de
raciocínio ou plano do Codex quando o servidor de app os emite. Hoje, o OpenClaw registra apenas
sinais de início e conclusão de Compaction nativa. Ele ainda não expõe um resumo legível
por humanos da Compaction nem uma lista auditável de quais entradas o Codex
manteve após a Compaction.

Como o Codex controla a thread nativa canônica, `tool_result_persist` atualmente não
reescreve registros de resultado de ferramenta nativa do Codex. Ele só se aplica quando
o OpenClaw está gravando um resultado de ferramenta em uma transcrição de sessão pertencente ao OpenClaw.

A geração de mídia não exige PI. Geração de imagem, vídeo, música, PDF, TTS e
interpretação de mídia continuam usando as configurações correspondentes de provedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**Codex não aparece como um provedor normal em `/model`:** isso é esperado para
configurações novas. Selecione um modelo `openai/gpt-*` com
`embeddedHarness.runtime: "codex"` (ou um ref legado `codex/*`), habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa PI em vez de Codex:** `runtime: "auto"` ainda pode usar PI como backend de
compatibilidade quando nenhum harness Codex assume a execução. Defina
`embeddedHarness.runtime: "codex"` para forçar a seleção do Codex durante os testes. Um
runtime Codex forçado agora falha em vez de recorrer ao PI, a menos que você
defina explicitamente `embeddedHarness.fallback: "pi"`. Depois que o servidor de app Codex é
selecionado, suas falhas aparecem diretamente, sem configuração extra de fallback.

**O servidor de app é rejeitado:** atualize o Codex para que o handshake do servidor de app
informe a versão `0.118.0` ou mais recente.

**A descoberta de modelo é lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desabilite a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o servidor de app remoto fala a mesma versão de protocolo de servidor de app Codex.

**Um modelo não Codex usa PI:** isso é esperado, a menos que você tenha forçado
`embeddedHarness.runtime: "codex"` para esse agente ou selecionado um ref legado
`codex/*`. Refs simples `openai/gpt-*` e refs de outros provedores permanecem em seu caminho normal
de provedor no modo `auto`. Se você forçar `runtime: "codex"`, todo turno incorporado
desse agente deverá ser um modelo OpenAI compatível com Codex.

## Relacionado

- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Status](/pt-BR/cli/status)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
