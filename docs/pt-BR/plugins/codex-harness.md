---
read_when:
    - Você quer usar o harness app-server Codex incluído
    - Você precisa de exemplos de configuração do harness Codex
    - Você quer que implantações apenas com Codex falhem em vez de recorrer ao PI
summary: Executar turnos do agente incorporado do OpenClaw por meio do harness app-server Codex incluído
title: Harness Codex
x-i18n:
    generated_at: "2026-04-26T11:33:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

O Plugin incluído `codex` permite que o OpenClaw execute turnos do agente incorporado por meio do
app-server Codex em vez do harness interno PI.

Use isso quando quiser que o Codex controle a sessão do agente em baixo nível: descoberta
de model, retomada nativa de thread, Compaction nativa e execução no app-server.
O OpenClaw ainda controla canais de chat, arquivos de sessão, seleção de model, tools,
aprovações, entrega de mídia e o espelho visível da transcrição.

Se você está tentando se orientar, comece por
[Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é:
`openai/gpt-5.5` é a ref do model, `codex` é o runtime, e Telegram,
Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## O que este Plugin altera

O Plugin incluído `codex` adiciona várias capacidades separadas:

| Capacidade                        | Como você usa                                      | O que faz                                                                  |
| --------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| Runtime incorporado nativo        | `agentRuntime.id: "codex"`                         | Executa turnos do agente incorporado do OpenClaw por meio do app-server Codex. |
| Comandos nativos de controle por chat | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula e controla threads do app-server Codex a partir de uma conversa de mensagens. |
| Provider/catálogo do app-server Codex | internos de `codex`, expostos pelo harness         | Permite que o runtime descubra e valide models do app-server.              |
| Caminho de compreensão de mídia do Codex | caminhos de compatibilidade de image-model `codex/*` | Executa turnos limitados do app-server Codex para models compatíveis com compreensão de imagem. |
| Relay nativo de hooks             | Hooks do Plugin em torno de eventos nativos do Codex | Permite que o OpenClaw observe/bloqueie eventos compatíveis de ferramenta/finalização nativos do Codex. |

Ativar o Plugin disponibiliza essas capacidades. Isso **não**:

- começa a usar Codex para todo model da OpenAI
- converte refs de model `openai-codex/*` para o runtime nativo
- torna ACP/acpx o caminho padrão do Codex
- troca a quente sessões existentes que já registraram um runtime PI
- substitui a entrega de canais do OpenClaw, arquivos de sessão, armazenamento de perfis de auth ou
  roteamento de mensagens

O mesmo Plugin também controla a superfície nativa de comando de controle por chat `/codex`. Se
o Plugin estiver ativado e o usuário pedir para vincular, retomar, direcionar, parar ou inspecionar
threads do Codex via chat, os agentes devem preferir `/codex ...` em vez de ACP. ACP continua sendo
o fallback explícito quando o usuário pede ACP/acpx ou está testando o
adaptador Codex do ACP.

Turnos nativos do Codex mantêm hooks de Plugin do OpenClaw como a camada pública de compatibilidade.
Estes são hooks em processo do OpenClaw, não hooks de comando `hooks.json` do Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros de transcrição espelhados
- `before_agent_finalize` por meio do relay `Stop` do Codex
- `agent_end`

Plugins também podem registrar middleware neutro em relação ao runtime para resultado de ferramenta a fim de reescrever resultados dinâmicos de tool do OpenClaw depois que o OpenClaw executa a ferramenta e antes que o resultado seja retornado ao Codex. Isso é separado do hook público de Plugin
`tool_result_persist`, que transforma gravações de resultado de ferramenta em transcrição controladas pelo OpenClaw.

Para a semântica dos hooks de Plugin em si, veja [Hooks de Plugin](/pt-BR/plugins/hooks)
e [Comportamento de proteção de Plugin](/pt-BR/tools/plugin).

O harness vem desativado por padrão. Novas configs devem manter refs de model da OpenAI
canônicas como `openai/gpt-*` e forçar explicitamente
`agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` quando
quiserem execução nativa no app-server. Refs legadas `codex/*` ainda selecionam automaticamente
o harness por compatibilidade, mas prefixos legados de provider com suporte de runtime
não são mostrados como escolhas normais de model/provider.

Se o Plugin `codex` estiver ativado, mas o model primário ainda for
`openai-codex/*`, `openclaw doctor` emite um aviso em vez de mudar a rota. Isso é
intencional: `openai-codex/*` continua sendo o caminho de OAuth/assinatura do Codex no PI, e
a execução nativa no app-server continua sendo uma escolha explícita de runtime.

## Mapa de rotas

Use esta tabela antes de alterar a config:

| Comportamento desejado                     | Ref do model               | Configuração de runtime                 | Requisito de Plugin         | Rótulo de status esperado      |
| ------------------------------------------ | -------------------------- | --------------------------------------- | --------------------------- | ------------------------------ |
| OpenAI API pelo executor normal do OpenClaw | `openai/gpt-*`             | omitido ou `runtime: "pi"`              | Provider OpenAI             | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/assinatura via PI              | `openai-codex/gpt-*`       | omitido ou `runtime: "pi"`              | Provider OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Turnos incorporados nativos do app-server Codex | `openai/gpt-*`         | `agentRuntime.id: "codex"`              | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| Providers mistos com modo automático conservador | refs específicas de provider | `agentRuntime.id: "auto"`            | Runtimes de Plugin opcionais | Depende do runtime selecionado |
| Sessão explícita do adaptador ACP Codex    | depende do prompt/model ACP | `sessions_spawn` com `runtime: "acp"` | backend `acpx` íntegro      | Status de tarefa/sessão ACP    |

A divisão importante é provider versus runtime:

- `openai-codex/*` responde "qual rota de provider/auth o PI deve usar?"
- `agentRuntime.id: "codex"` responde "qual loop deve executar este
  turno incorporado?"
- `/codex ...` responde "qual conversa nativa do Codex este chat deve vincular
  ou controlar?"
- ACP responde "qual processo de harness externo o acpx deve iniciar?"

## Escolha o prefixo de model correto

Rotas da família OpenAI são específicas por prefixo. Use `openai-codex/*` quando quiser
Codex OAuth via PI; use `openai/*` quando quiser acesso direto à OpenAI API ou
quando estiver forçando o harness nativo do app-server Codex:

| Ref do model                                  | Caminho de runtime                            | Use quando                                                                |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provider OpenAI pelo encanamento OpenClaw/PI  | Você quer acesso atual direto à OpenAI Platform API com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth pelo OpenClaw/PI           | Você quer auth por assinatura do ChatGPT/Codex com o executor PI padrão.  |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness do app-server Codex                   | Você quer execução nativa do app-server Codex para o turno do agente incorporado. |

O GPT-5.5 atualmente é apenas assinatura/OAuth no OpenClaw. Use
`openai-codex/gpt-5.5` para OAuth no PI, ou `openai/gpt-5.5` com o harness do
app-server Codex. O acesso direto por API key para `openai/gpt-5.5` será compatível
assim que a OpenAI habilitar GPT-5.5 na API pública.

Refs legadas `codex/gpt-*` continuam aceitas como aliases de compatibilidade. A
migração de compatibilidade do doctor reescreve refs primárias legadas de runtime para refs
canônicas de model e registra a política de runtime separadamente, enquanto refs legadas apenas de fallback
são deixadas inalteradas porque o runtime é configurado para todo o contêiner do agente.
Novas configs de OAuth Codex no PI devem usar `openai-codex/gpt-*`; novas configs do
harness nativo do app-server devem usar `openai/gpt-*` mais
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue a mesma divisão por prefixo. Use
`openai-codex/gpt-*` quando a compreensão de imagem deve ser executada pelo caminho de provider OpenAI
Codex OAuth. Use `codex/gpt-*` quando a compreensão de imagem deve ser executada
por um turno limitado do app-server Codex. O model do app-server Codex precisa
anunciar suporte a entrada de imagem; models Codex apenas de texto falham antes que o turno de mídia
comece.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a
seleção parecer inesperada, ative logs de depuração para o subsistema `agents/harness`
e inspecione o registro estruturado `agent harness selected` do gateway. Ele
inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e,
no modo `auto`, o resultado de suporte de cada candidato de Plugin.

### O que significam os avisos do doctor

`openclaw doctor` emite um aviso quando tudo isso é verdadeiro:

- o Plugin incluído `codex` está ativado ou permitido
- o model primário de um agente é `openai-codex/*`
- o runtime efetivo desse agente não é `codex`

Esse aviso existe porque os usuários frequentemente esperam que "Plugin Codex ativado" implique
"runtime nativo do app-server Codex". O OpenClaw não dá esse salto. O aviso
significa:

- **Nenhuma mudança é necessária** se você pretendia usar OAuth do ChatGPT/Codex por PI.
- Mude o model para `openai/<model>` e defina
  `agentRuntime.id: "codex"` se você pretendia usar execução nativa
  no app-server.
- Sessões existentes ainda precisam de `/new` ou `/reset` após uma mudança de runtime,
  porque os pins de runtime da sessão são persistentes.

A seleção do harness não é um controle de sessão ativo. Quando um turno incorporado é executado,
o OpenClaw registra o id do harness selecionado naquela sessão e continua usando-o em
turnos posteriores no mesmo id de sessão. Mude a config `agentRuntime` ou
`OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro harness;
use `/new` ou `/reset` para iniciar uma nova sessão antes de alternar uma conversa
existente entre PI e Codex. Isso evita reproduzir a mesma transcrição em
dois sistemas de sessão nativa incompatíveis.

Sessões legadas criadas antes dos pins de harness são tratadas como fixadas em PI assim que
passam a ter histórico de transcrição. Use `/new` ou `/reset` para fazer essa conversa
aderir ao Codex após alterar a config.

`/status` mostra o runtime efetivo do model. O harness PI padrão aparece como
`Runtime: OpenClaw Pi Default`, e o harness do app-server Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw com o Plugin incluído `codex` disponível.
- App-server Codex `0.125.0` ou mais recente. O Plugin incluído gerencia, por padrão, um
  binário compatível do app-server Codex, então comandos locais `codex` no `PATH`
  não afetam a inicialização normal do harness.
- Auth do Codex disponível para o processo do app-server.

O Plugin bloqueia handshakes mais antigos ou sem versão do app-server. Isso mantém
o OpenClaw na superfície de protocolo com a qual ele foi testado.

Para testes smoke em tempo real e Docker, o auth normalmente vem de `OPENAI_API_KEY`, mais
arquivos opcionais da CLI Codex, como `~/.codex/auth.json` e
`~/.codex/config.toml`. Use o mesmo material de auth que seu app-server Codex local
usa.

## Config mínima

Use `openai/gpt-5.5`, ative o Plugin incluído e force o harness `codex`:

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

Se sua config usa `plugins.allow`, inclua `codex` também:

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

Configs legadas que definem `agents.defaults.model` ou um model de agente como
`codex/<model>` ainda ativam automaticamente o Plugin incluído `codex`. Novas configs devem
preferir `openai/<model>` mais a entrada explícita `agentRuntime` acima.

## Adicionar Codex junto com outros models

Não defina `agentRuntime.id: "codex"` globalmente se o mesmo agente deve alternar livremente
entre Codex e models de outros providers. Um runtime forçado se aplica a todo
turno incorporado daquele agente ou sessão. Se você selecionar um model da Anthropic enquanto
esse runtime estiver forçado, o OpenClaw ainda tentará o harness Codex e falhará de forma fechada
em vez de rotear silenciosamente esse turno pelo PI.

Use um destes formatos em vez disso:

- Coloque o Codex em um agente dedicado com `agentRuntime.id: "codex"`.
- Mantenha o agente padrão em `agentRuntime.id: "auto"` com fallback PI para uso normal e misto
  de providers.
- Use refs legadas `codex/*` apenas por compatibilidade. Novas configs devem preferir
  `openai/*` mais uma política explícita de runtime Codex.

Por exemplo, isso mantém o agente padrão na seleção automática normal e
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Com esse formato:

- O agente padrão `main` usa o caminho normal do provider e o fallback de compatibilidade do PI.
- O agente `codex` usa o harness do app-server Codex.
- Se o Codex estiver ausente ou não for compatível para o agente `codex`, o turno falha
  em vez de usar silenciosamente o PI.

## Roteamento de comandos do agente

Os agentes devem rotear solicitações do usuário por intenção, não apenas pela palavra "Codex":

| O usuário pede...                                      | O agente deve usar...                           |
| ------------------------------------------------------ | ----------------------------------------------- |
| "Vincule este chat ao Codex"                           | `/codex bind`                                   |
| "Retome a thread Codex `<id>` aqui"                    | `/codex resume <id>`                            |
| "Mostre threads Codex"                                 | `/codex threads`                                |
| "Use Codex como runtime deste agente"                  | mudança de config em `agentRuntime.id`          |
| "Use minha assinatura ChatGPT/Codex com OpenClaw normal" | refs de model `openai-codex/*`               |
| "Execute Codex por ACP/acpx"                           | ACP `sessions_spawn({ runtime: "acp", ... })`   |
| "Inicie Claude Code/Gemini/OpenCode/Cursor em uma thread" | ACP/acpx, não `/codex` e não subagentes nativos |

O OpenClaw só anuncia orientação de inicialização ACP aos agentes quando o ACP está ativado,
despachável e respaldado por um backend de runtime carregado. Se ACP não estiver disponível,
o prompt do sistema e as Skills de Plugin não devem ensinar o agente sobre roteamento
ACP.

## Implantações apenas com Codex

Force o harness Codex quando precisar provar que todo turno do agente incorporado
usa Codex. Runtimes explícitos de Plugin usam, por padrão, nenhum fallback para PI, então
`fallback: "none"` é opcional, mas frequentemente útil como documentação:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
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

Com o Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver desativado, se o
app-server for muito antigo ou se o app-server não conseguir iniciar. Defina
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` apenas se você intencionalmente quiser que o PI lide com
a seleção ausente de harness.

## Codex por agente

Você pode tornar um agente exclusivo do Codex enquanto o agente padrão mantém a
seleção automática normal:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Use comandos normais de sessão para alternar agentes e models. `/new` cria uma
nova sessão do OpenClaw e o harness Codex cria ou retoma sua thread sidecar do app-server
conforme necessário. `/reset` limpa o binding da sessão OpenClaw para essa thread
e permite que o próximo turno resolva o harness novamente a partir da config atual.

## Descoberta de model

Por padrão, o Plugin Codex pergunta ao app-server quais models estão disponíveis. Se
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

Desative a descoberta quando quiser que a inicialização evite fazer probe do Codex e use apenas o
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

O binário gerenciado é declarado como uma dependência de runtime do Plugin incluído e preparado
com o restante das dependências do Plugin `codex`. Isso mantém a versão do app-server
vinculada ao Plugin incluído em vez de depender de qualquer CLI Codex separada que
esteja instalada localmente. Defina `appServer.command` apenas quando você
intencionalmente quiser executar um executável diferente.

Por padrão, o OpenClaw inicia sessões locais do harness Codex no modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa é a postura confiável do operador local usada
para Heartbeats autônomos: o Codex pode usar shell e ferramentas de rede sem
parar em prompts nativos de aprovação que ninguém está por perto para responder.

Para ativar aprovações revisadas pelo guardian do Codex, defina `appServer.mode:
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
o Codex encaminha essa solicitação de aprovação ao revisor nativo em vez de a um
prompt humano. O revisor aplica o framework de risco do Codex e aprova ou nega
a solicitação específica. Use Guardian quando quiser mais proteções do que o modo YOLO,
mas ainda precisar que agentes desacompanhados avancem.

A predefinição `guardian` se expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
Campos individuais da política ainda substituem `mode`, então implantações avançadas podem combinar
a predefinição com escolhas explícitas. O valor mais antigo de revisor `guardian_subagent` ainda é
aceito como alias de compatibilidade, mas novas configs devem usar
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

Campos compatíveis de `appServer`:

| Campo               | Padrão                                   | Significado                                                                                                   |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                      |
| `command`           | binário Codex gerenciado                 | Executável para transporte stdio. Deixe sem definir para usar o binário gerenciado; defina apenas para uma substituição explícita. |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                              |
| `url`               | não definido                             | URL WebSocket do app-server.                                                                                   |
| `authToken`         | não definido                             | Token Bearer para transporte WebSocket.                                                                        |
| `headers`           | `{}`                                     | Headers extras de WebSocket.                                                                                   |
| `requestTimeoutMs`  | `60000`                                  | Timeout para chamadas do plano de controle do app-server.                                                      |
| `mode`              | `"yolo"`                                 | Predefinição para execução YOLO ou com revisão do guardian.                                                    |
| `approvalPolicy`    | `"never"`                                | Política nativa de aprovação do Codex enviada para início/retomada/turno da thread.                          |
| `sandbox`           | `"danger-full-access"`                   | Modo nativo de sandbox do Codex enviado para início/retomada da thread.                                       |
| `approvalsReviewer` | `"user"`                                 | Use `"auto_review"` para deixar o Codex revisar prompts nativos de aprovação. `guardian_subagent` continua sendo um alias legado. |
| `serviceTier`       | não definido                             | Nível de serviço opcional do app-server Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados. |

Substituições por ambiente continuam disponíveis para testes locais:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora o binário gerenciado quando
`appServer.command` não está definido.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removido. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` em vez disso, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A config é
preferível para implantações reproduzíveis porque mantém o comportamento do Plugin
no mesmo arquivo revisado do restante da configuração do harness Codex.

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

Validação de harness apenas com Codex:

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

Aprovações Codex com revisão do Guardian:

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

App-server remoto com headers explícitos:

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

A troca de model continua sob controle do OpenClaw. Quando uma sessão do OpenClaw está anexada
a uma thread Codex existente, o próximo turno envia novamente para o
app-server o model OpenAI selecionado no momento, provider, política de aprovação, sandbox e nível de serviço.
Trocar de `openai/gpt-5.5` para `openai/gpt-5.2` mantém o
binding da thread, mas pede ao Codex que continue com o model recém-selecionado.

## Comando Codex

O Plugin incluído registra `/codex` como um comando de barra autorizado. Ele é
genérico e funciona em qualquer canal que ofereça suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade em tempo real do app-server, models, conta, rate limits, servidores MCP e Skills.
- `/codex models` lista models em tempo real do app-server Codex.
- `/codex threads [filter]` lista threads recentes do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma thread Codex existente.
- `/codex compact` pede ao app-server Codex para fazer Compaction da thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex account` mostra status da conta e de rate limit.
- `/codex mcp` lista o status dos servidores MCP do app-server Codex.
- `/codex skills` lista as Skills do app-server Codex.

`/codex resume` grava o mesmo arquivo sidecar de binding que o harness usa para
turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread Codex, passa o
model OpenClaw atualmente selecionado para o app-server e mantém o histórico estendido
ativado.

A superfície de comandos exige app-server Codex `0.125.0` ou mais recente. Métodos individuais
de controle são relatados como `unsupported by this Codex app-server` se um
app-server futuro ou personalizado não expuser esse método JSON-RPC.

## Limites de hooks

O harness Codex tem três camadas de hook:

| Camada                                | Proprietário             | Finalidade                                                          |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de Plugin do OpenClaw           | OpenClaw                 | Compatibilidade de produto/Plugin entre os harnesses PI e Codex.    |
| Middleware de extensão do app-server Codex | Plugins incluídos do OpenClaw | Comportamento por turno do adaptador em torno de tools dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política nativa de tools a partir da config do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para rotear
o comportamento de Plugin do OpenClaw. Para a ponte compatível de tools e permissões nativas,
o OpenClaw injeta config do Codex por thread para `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Outros hooks do Codex, como `SessionStart` e
`UserPromptSubmit`, permanecem controles no nível do Codex; eles não são expostos como
hooks de Plugin do OpenClaw no contrato v1.

Para tools dinâmicas do OpenClaw, o OpenClaw executa a tool depois que o Codex pede a
chamada, então o OpenClaw dispara o comportamento de Plugin e middleware que ele controla no
adaptador do harness. Para tools nativas do Codex, o Codex controla o registro canônico da tool.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação por meio do app-server ou de callbacks de hooks
nativos.

Projeções de Compaction e ciclo de vida do LLM vêm de notificações do app-server Codex
e do estado do adaptador do OpenClaw, não de comandos nativos de hook do Codex.
Os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte
da requisição interna do Codex ou da carga de Compaction.

Notificações nativas do app-server `hook/started` e `hook/completed` do Codex são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de Plugin do OpenClaw.

## Contrato de suporte v1

O modo Codex não é PI com uma chamada de model diferente por baixo. O Codex controla mais do
loop nativo do model, e o OpenClaw adapta suas superfícies de Plugin e sessão
em torno desse limite.

Compatível no runtime Codex v1:

| Superfície                                    | Suporte                                  | Motivo                                                                                                                                                                                                    |
| --------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de model OpenAI via Codex                | Compatível                               | O app-server Codex controla o turno OpenAI, retomada nativa de thread e continuação nativa de tools.                                                                                                     |
| Roteamento e entrega de canais do OpenClaw    | Compatível                               | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais permanecem fora do runtime do model.                                                                                                        |
| Tools dinâmicas do OpenClaw                   | Compatível                               | O Codex pede ao OpenClaw para executar essas tools, então o OpenClaw permanece no caminho de execução.                                                                                                   |
| Plugins de prompt e contexto                  | Compatível                               | O OpenClaw constrói sobreposições de prompt e projeta o contexto no turno do Codex antes de iniciar ou retomar a thread.                                                                                 |
| Ciclo de vida do mecanismo de contexto        | Compatível                               | Assemble, manutenção ingest ou after-turn e coordenação de Compaction do mecanismo de contexto são executados para turnos Codex.                                                                          |
| Hooks de tools dinâmicas                      | Compatível                               | `before_tool_call`, `after_tool_call` e middleware de resultado de tool são executados em torno de tools dinâmicas controladas pelo OpenClaw.                                                            |
| Hooks de ciclo de vida                        | Compatível como observações do adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` são disparados com cargas honestas do modo Codex.                                                                        |
| Gate de revisão de resposta final             | Compatível via relay de hook nativo      | `Stop` do Codex é retransmitido para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem de model antes da finalização.                                                                     |
| Bloqueio ou observação de shell, patch e MCP nativos | Compatível via relay de hook nativo | `PreToolUse` e `PostToolUse` do Codex são retransmitidos para superfícies nativas confirmadas de tool, incluindo cargas MCP no app-server Codex `0.125.0` ou mais recente. O bloqueio é compatível; a reescrita de argumentos não é. |
| Política de permissões nativas                | Compatível via relay de hook nativo      | `PermissionRequest` do Codex pode ser roteado pela política do OpenClaw quando o runtime o expõe. Se o OpenClaw não retornar uma decisão, o Codex continua por seu caminho normal de aprovação guardian ou do usuário. |
| Captura de trajetória do app-server           | Compatível                               | O OpenClaw registra a requisição que enviou ao app-server e as notificações que recebe do app-server.                                                                                                     |

Não compatível no runtime Codex v1:

| Superfície                                          | Limite v1                                                                                                                                      | Caminho futuro                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Mutação de argumentos de tool nativa                | Hooks nativos pré-tool do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de tools nativas do Codex.                            | Requer suporte do esquema/hook do Codex para substituir a entrada da tool.                |
| Histórico editável de transcrição nativa do Codex   | O Codex controla o histórico canônico da thread nativa. O OpenClaw controla um espelho e pode projetar contexto futuro, mas não deve alterar internals não compatíveis. | Adicionar APIs explícitas do app-server Codex se for necessário fazer cirurgia na thread nativa. |
| `tool_result_persist` para registros de tools nativas do Codex | Esse hook transforma gravações de transcrição controladas pelo OpenClaw, não registros de tools nativas do Codex.                              | Poderia espelhar registros transformados, mas a reescrita canônica exige suporte do Codex. |
| Metadados ricos de Compaction nativa                | O OpenClaw observa início e conclusão da Compaction, mas não recebe uma lista estável de itens mantidos/removidos, delta de tokens nem carga de resumo. | Exige eventos mais ricos de Compaction do Codex.                                          |
| Intervenção na Compaction                           | Hooks atuais de Compaction do OpenClaw são apenas no nível de notificação no modo Codex.                                                      | Adicionar hooks pré/pós-Compaction do Codex se Plugins precisarem vetar ou reescrever a Compaction nativa. |
| Captura byte a byte da requisição da API de model   | O OpenClaw pode capturar requisições e notificações do app-server, mas o núcleo do Codex constrói internamente a requisição final da OpenAI API. | Exige um evento de rastreamento de requisição de model do Codex ou uma API de depuração.  |

## Tools, mídia e Compaction

O harness Codex altera apenas o executor incorporado de agente em baixo nível.

O OpenClaw ainda constrói a lista de tools e recebe resultados dinâmicos de tool a partir do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de tools de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

O relay de hook nativo é intencionalmente genérico, mas o contrato de suporte v1 é
limitado aos caminhos nativos de tool e permissão do Codex que o OpenClaw testa. No
runtime Codex, isso inclui cargas `PreToolUse`,
`PostToolUse` e `PermissionRequest` de shell, patch e MCP. Não assuma que todo
evento futuro de hook do Codex é uma superfície de Plugin do OpenClaw até que o contrato do runtime
o nomeie.

Para `PermissionRequest`, o OpenClaw só retorna decisões explícitas de permitir ou negar
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex trata isso como ausência de
decisão do hook e continua por seu próprio caminho de aprovação guardian ou do usuário.

Solicitações de aprovação de tool MCP do Codex são roteadas pelo fluxo de
aprovação de Plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação
nativa do servidor em vez de ser direcionada como contexto extra. Outras solicitações de MCP
continuam falhando de forma fechada.

Quando o model selecionado usa o harness Codex, a Compaction nativa da thread é
delegada ao app-server Codex. O OpenClaw mantém um espelho da transcrição para histórico
de canal, busca, `/new`, `/reset` e futuras trocas de model ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves
de reasoning ou plano do Codex quando o app-server os emite. Hoje, o OpenClaw só
registra sinais nativos de início e conclusão da Compaction. Ele ainda não expõe um
resumo legível por humanos da Compaction nem uma lista auditável de quais entradas o Codex
manteve após a Compaction.

Como o Codex controla a thread nativa canônica, `tool_result_persist` não
reescreve atualmente registros de resultado de tool nativos do Codex. Ele só se aplica quando
o OpenClaw está gravando um resultado de tool em uma transcrição de sessão controlada pelo OpenClaw.

A geração de mídia não exige PI. Geração de imagem, vídeo, música, PDF, TTS e compreensão de
mídia continuam usando as configurações correspondentes de provider/model, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**O Codex não aparece como um provider normal em `/model`:** isso é esperado para
novas configs. Selecione um model `openai/gpt-*` com
`agentRuntime.id: "codex"` (ou uma ref legada `codex/*`), ative
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa PI em vez de Codex:** `agentRuntime.id: "auto"` ainda pode usar PI como
backend de compatibilidade quando nenhum harness Codex assume a execução. Defina
`agentRuntime.id: "codex"` para forçar a seleção do Codex durante os testes. Um
runtime Codex forçado agora falha em vez de recorrer ao PI, a menos que você
defina explicitamente `agentRuntime.fallback: "pi"`. Depois que o app-server Codex é
selecionado, suas falhas aparecem diretamente sem configuração extra de fallback.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
informe a versão `0.125.0` ou mais recente. Prereleases da mesma versão ou versões
com sufixo de build, como `0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitadas porque o
piso estável do protocolo `0.125.0` é o que o OpenClaw testa.

**A descoberta de model é lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desative a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão do protocolo do app-server Codex.

**Um model que não é Codex usa PI:** isso é esperado, a menos que você tenha forçado
`agentRuntime.id: "codex"` para esse agente ou selecionado uma ref legada
`codex/*`. Refs simples `openai/gpt-*` e refs de outros providers permanecem em seu caminho
normal de provider no modo `auto`. Se você forçar `agentRuntime.id: "codex"`, todo turno incorporado
desse agente precisa ser um model OpenAI compatível com Codex.

## Relacionado

- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Providers de model](/pt-BR/concepts/model-providers)
- [Provider OpenAI](/pt-BR/providers/openai)
- [Status](/pt-BR/cli/status)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
