---
read_when:
    - Você quer usar o ambiente de teste app-server do Codex incluído
    - Você precisa de exemplos de configuração do harness do Codex
    - Você quer que implantações apenas com Codex falhem em vez de recorrer ao PI
summary: Execute as interações do agente incorporado do OpenClaw por meio da estrutura de execução app-server do Codex incluída
title: Ambiente de execução do Codex
x-i18n:
    generated_at: "2026-04-30T09:58:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93abb72e9590aad265e5b6b8691dd16314178c4d255679b4e53da33b792a6e6b
    source_path: plugins/codex-harness.md
    workflow: 16
---

O Plugin `codex` incluído permite que o OpenClaw execute turnos de agente incorporados por meio do app-server do Codex em vez do harness PI integrado.

Use isto quando quiser que o Codex assuma a sessão de agente de baixo nível: descoberta de modelos, retomada nativa de threads, compaction nativa e execução no app-server. O OpenClaw ainda controla canais de chat, arquivos de sessão, seleção de modelo, ferramentas, aprovações, entrega de mídia e o espelho visível da transcrição.

Se você está tentando se orientar, comece por [Runtimes de agente](/pt-BR/concepts/agent-runtimes). A versão curta é: `openai/gpt-5.5` é a referência de modelo, `codex` é o runtime, e Telegram, Discord, Slack ou outro canal continua sendo a superfície de comunicação.

## O que este Plugin altera

O Plugin `codex` incluído contribui com várias capacidades separadas:

| Capacidade                        | Como você a usa                                      | O que ela faz                                                                  |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime incorporado nativo           | `agentRuntime.id: "codex"`                          | Executa turnos de agente incorporados do OpenClaw por meio do app-server do Codex.                  |
| Comandos nativos de controle de chat      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Vincula e controla threads do app-server do Codex a partir de uma conversa de mensagens.    |
| Provedor/catálogo do app-server do Codex | internos de `codex`, expostos por meio do harness     | Permite que o runtime descubra e valide modelos do app-server.                     |
| Caminho de compreensão de mídia do Codex    | caminhos de compatibilidade de modelos de imagem `codex/*`           | Executa turnos limitados do app-server do Codex para modelos compatíveis de compreensão de imagem. |
| Relay de hooks nativos                 | Hooks de Plugin em torno de eventos nativos do Codex             | Permite que o OpenClaw observe/bloqueie eventos compatíveis nativos do Codex de ferramentas/finalização.  |

Habilitar o Plugin disponibiliza essas capacidades. Isso **não**:

- começa a usar Codex para todo modelo OpenAI
- converte referências de modelo `openai-codex/*` para o runtime nativo
- torna ACP/acpx o caminho Codex padrão
- troca a quente sessões existentes que já registraram um runtime PI
- substitui a entrega por canais do OpenClaw, arquivos de sessão, armazenamento de perfil de autenticação ou roteamento de mensagens

O mesmo Plugin também controla a superfície nativa de comandos de controle de chat `/codex`. Se o Plugin estiver habilitado e o usuário pedir para vincular, retomar, direcionar, parar ou inspecionar threads do Codex pelo chat, agentes devem preferir `/codex ...` em vez de ACP. ACP continua sendo a alternativa explícita quando o usuário pede ACP/acpx ou está testando o adaptador Codex ACP.

Turnos nativos do Codex mantêm hooks de Plugin do OpenClaw como a camada pública de compatibilidade. Estes são hooks em processo do OpenClaw, não hooks de comando `hooks.json` do Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros espelhados de transcrição
- `before_agent_finalize` por meio do relay `Stop` do Codex
- `agent_end`

Plugins também podem registrar middleware de resultado de ferramenta neutro em relação ao runtime para reescrever resultados de ferramentas dinâmicas do OpenClaw depois que o OpenClaw executa a ferramenta e antes que o resultado seja retornado ao Codex. Isso é separado do hook público de Plugin `tool_result_persist`, que transforma gravações de resultados de ferramentas em transcrições controladas pelo OpenClaw.

Para a semântica dos próprios hooks de Plugin, consulte [Hooks de Plugin](/pt-BR/plugins/hooks) e [Comportamento de guard de Plugin](/pt-BR/tools/plugin).

O harness fica desativado por padrão. Novas configurações devem manter referências de modelo OpenAI canônicas como `openai/gpt-*` e forçar explicitamente `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` quando quiserem execução nativa no app-server. Referências legadas de modelo `codex/*` ainda selecionam automaticamente o harness por compatibilidade, mas prefixos legados de provedor com suporte por runtime não são exibidos como escolhas normais de modelo/provedor.

Se o Plugin `codex` estiver habilitado, mas o modelo primário ainda for `openai-codex/*`, `openclaw doctor` avisa em vez de alterar a rota. Isso é intencional: `openai-codex/*` continua sendo o caminho PI do OAuth/assinatura do Codex, e a execução nativa no app-server permanece uma escolha explícita de runtime.

## Mapa de rotas

Use esta tabela antes de alterar a configuração:

| Comportamento desejado                            | Referência de modelo                  | Configuração de runtime                         | Requisito de Plugin          | Rótulo de status esperado          |
| ------------------------------------------- | -------------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| API da OpenAI por meio do executor normal do OpenClaw   | `openai/gpt-*`             | omitido ou `runtime: "pi"`             | Provedor OpenAI             | `Runtime: OpenClaw Pi Default` |
| OAuth/assinatura do Codex por meio do PI         | `openai-codex/gpt-*`       | omitido ou `runtime: "pi"`             | Provedor OAuth OpenAI Codex | `Runtime: OpenClaw Pi Default` |
| Turnos incorporados nativos do app-server do Codex      | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Plugin `codex`              | `Runtime: OpenAI Codex`        |
| Provedores mistos com modo automático conservador | referências específicas do provedor     | `agentRuntime.id: "auto"`              | Runtimes de Plugin opcionais    | Depende do runtime selecionado    |
| Sessão explícita do adaptador Codex ACP          | dependente de prompt/modelo ACP | `sessions_spawn` com `runtime: "acp"` | backend `acpx` íntegro      | Status de tarefa/sessão ACP        |

A divisão importante é provedor versus runtime:

- `openai-codex/*` responde "qual rota de provedor/autenticação o PI deve usar?"
- `agentRuntime.id: "codex"` responde "qual loop deve executar este turno incorporado?"
- `/codex ...` responde "a qual conversa nativa do Codex este chat deve se vincular ou controlar?"
- ACP responde "qual processo externo de harness o acpx deve iniciar?"

## Escolha o prefixo de modelo correto

Rotas da família OpenAI são específicas por prefixo. Use `openai-codex/*` quando quiser OAuth do Codex por meio do PI; use `openai/*` quando quiser acesso direto à API da OpenAI ou quando estiver forçando o harness nativo do app-server do Codex:

| Referência de modelo                                     | Caminho de runtime                                 | Use quando                                                                  |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Provedor OpenAI por meio do encanamento OpenClaw/PI | Você quer acesso direto atual à API da OpenAI Platform com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex por meio do OpenClaw/PI       | Você quer autenticação por assinatura ChatGPT/Codex com o executor PI padrão.      |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness do app-server do Codex                     | Você quer execução nativa do app-server do Codex para o turno de agente incorporado.   |

GPT-5.5 atualmente é somente assinatura/OAuth no OpenClaw. Use `openai-codex/gpt-5.5` para OAuth por PI, ou `openai/gpt-5.5` com o harness do app-server do Codex. Acesso direto por chave de API para `openai/gpt-5.5` será compatível assim que a OpenAI habilitar GPT-5.5 na API pública.

Referências legadas `codex/gpt-*` continuam aceitas como aliases de compatibilidade. A migração de compatibilidade do doctor reescreve referências legadas de runtime primário para referências de modelo canônicas e registra a política de runtime separadamente, enquanto referências legadas apenas de fallback ficam inalteradas porque o runtime é configurado para todo o contêiner do agente. Novas configurações OAuth PI Codex devem usar `openai-codex/gpt-*`; novas configurações do harness nativo do app-server devem usar `openai/gpt-*` mais `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` segue a mesma divisão de prefixos. Use `openai-codex/gpt-*` quando a compreensão de imagem deve passar pelo caminho do provedor OAuth OpenAI Codex. Use `codex/gpt-*` quando a compreensão de imagem deve ser executada por um turno limitado do app-server do Codex. O modelo do app-server do Codex deve anunciar suporte a entrada de imagem; modelos Codex somente texto falham antes do início do turno de mídia.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a seleção parecer surpreendente, habilite logs de depuração para o subsistema `agents/harness` e inspecione o registro estruturado `agent harness selected` do Gateway. Ele inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e, no modo `auto`, o resultado de suporte de cada candidato de Plugin.

### O que significam os avisos do doctor

`openclaw doctor` avisa quando tudo isto é verdadeiro:

- o Plugin `codex` incluído está habilitado ou permitido
- o modelo primário de um agente é `openai-codex/*`
- o runtime efetivo desse agente não é `codex`

Esse aviso existe porque usuários frequentemente esperam que "Plugin Codex habilitado" implique "runtime nativo do app-server do Codex." O OpenClaw não faz esse salto. O aviso significa:

- **Nenhuma alteração é necessária** se você pretendia usar OAuth ChatGPT/Codex por meio do PI.
- Altere o modelo para `openai/<model>` e defina `agentRuntime.id: "codex"` se você pretendia execução nativa no app-server.
- Sessões existentes ainda precisam de `/new` ou `/reset` depois de uma alteração de runtime, porque pins de runtime de sessão são persistentes.

A seleção de harness não é um controle de sessão ao vivo. Quando um turno incorporado é executado, o OpenClaw registra o id do harness selecionado nessa sessão e continua usando-o para turnos posteriores no mesmo id de sessão. Altere a configuração `agentRuntime` ou `OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro harness; use `/new` ou `/reset` para iniciar uma sessão nova antes de alternar uma conversa existente entre PI e Codex. Isso evita reproduzir uma transcrição por meio de dois sistemas nativos de sessão incompatíveis.

Sessões legadas criadas antes dos pins de harness são tratadas como fixadas no PI assim que têm histórico de transcrição. Use `/new` ou `/reset` para optar essa conversa no Codex depois de alterar a configuração.

`/status` mostra o runtime de modelo efetivo. O harness PI padrão aparece como `Runtime: OpenClaw Pi Default`, e o harness do app-server do Codex aparece como `Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw com o Plugin `codex` incluído disponível.
- App-server do Codex `0.125.0` ou mais recente. O Plugin incluído gerencia um binário compatível do app-server do Codex por padrão, então comandos locais `codex` em `PATH` não afetam a inicialização normal do harness.
- Autenticação do Codex disponível para o processo do app-server ou para a ponte de autenticação Codex do OpenClaw.

O Plugin bloqueia handshakes de app-server antigos ou sem versão. Isso mantém o OpenClaw na superfície de protocolo contra a qual foi testado.

Para testes smoke ao vivo e em Docker, a autenticação geralmente vem da conta da CLI Codex ou de um perfil de autenticação `openai-codex` do OpenClaw. Inicializações locais do app-server por stdio também podem fazer fallback para `CODEX_API_KEY` / `OPENAI_API_KEY` quando nenhuma conta está presente.

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

Configurações legadas que definem `agents.defaults.model` ou um modelo de agente como `codex/<model>` ainda habilitam automaticamente o Plugin `codex` incluído. Novas configurações devem preferir `openai/<model>` mais a entrada explícita `agentRuntime` acima.

## Adicione Codex junto a outros modelos

Não defina `agentRuntime.id: "codex"` globalmente se o mesmo agente deve alternar livremente entre modelos de provedor Codex e não Codex. Um runtime forçado se aplica a todo turno incorporado desse agente ou sessão. Se você selecionar um modelo Anthropic enquanto esse runtime estiver forçado, o OpenClaw ainda tentará o harness Codex e falhará de modo fechado em vez de rotear silenciosamente esse turno pelo PI.

Use uma destas formas em vez disso:

- Coloque o Codex em um agente dedicado com `agentRuntime.id: "codex"`.
- Mantenha o agente padrão em `agentRuntime.id: "auto"` e fallback de PI para uso normal misto
  de provedores.
- Use refs legadas `codex/*` apenas para compatibilidade. Novas configurações devem preferir
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

Com esta forma:

- O agente `main` padrão usa o caminho normal do provedor e o fallback de compatibilidade com PI.
- O agente `codex` usa o mecanismo app-server do Codex.
- Se o Codex estiver ausente ou não for compatível com o agente `codex`, o turno falha
  em vez de usar PI silenciosamente.

## Roteamento de comandos de agente

Agentes devem rotear solicitações de usuário por intenção, não apenas pela palavra "Codex":

| Usuário pede para...                                      | Agente deve usar...                              |
| -------------------------------------------------------- | ------------------------------------------------ |
| "Vincule este chat ao Codex"                             | `/codex bind`                                    |
| "Retome a thread Codex `<id>` aqui"                      | `/codex resume <id>`                             |
| "Mostre as threads Codex"                                | `/codex threads`                                 |
| "Abra um relatório de suporte para uma execução ruim do Codex" | `/diagnostics [note]`                            |
| "Envie feedback do Codex apenas para esta thread anexada" | `/codex diagnostics [note]`                      |
| "Use Codex como runtime deste agente"                    | alteração de configuração em `agentRuntime.id`   |
| "Use minha assinatura ChatGPT/Codex com o OpenClaw normal" | refs de modelo `openai-codex/*`                  |
| "Execute Codex por ACP/acpx"                             | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Inicie Claude Code/Gemini/OpenCode/Cursor em uma thread" | ACP/acpx, não `/codex` e não subagentes nativos  |

O OpenClaw só anuncia orientação de spawn ACP para agentes quando ACP está habilitado,
pode ser despachado e é respaldado por um backend de runtime carregado. Se ACP não estiver disponível,
o prompt do sistema e as Skills do Plugin não devem ensinar o agente sobre roteamento
ACP.

## Implantações somente Codex

Force o mecanismo Codex quando precisar provar que todo turno de agente incorporado
usa Codex. Runtimes explícitos de Plugin usam, por padrão, nenhum fallback de PI, então
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

Com Codex forçado, o OpenClaw falha cedo se o Plugin Codex estiver desabilitado, se o
app-server for antigo demais ou se o app-server não conseguir iniciar. Defina
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` apenas se você quiser intencionalmente que PI trate
a seleção de mecanismo ausente.

## Codex por agente

Você pode tornar um agente somente Codex enquanto o agente padrão mantém a
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

Use comandos normais de sessão para alternar agentes e modelos. `/new` cria uma nova
sessão OpenClaw, e o mecanismo Codex cria ou retoma sua thread app-server
auxiliar conforme necessário. `/reset` limpa a vinculação da sessão OpenClaw para essa thread
e permite que o próximo turno resolva o mecanismo novamente a partir da configuração atual.

## Descoberta de modelos

Por padrão, o Plugin Codex pede ao app-server os modelos disponíveis. Se a
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

Desabilite a descoberta quando quiser que a inicialização evite sondar o Codex e fique com o
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

O binário gerenciado é declarado como uma dependência de runtime de Plugin incluída e preparado
com o restante das dependências do Plugin `codex`. Isso mantém a versão do app-server
vinculada ao Plugin incluído, em vez de qualquer CLI Codex separada que por acaso
esteja instalada localmente. Defina `appServer.command` apenas quando você
intencionalmente quiser executar um executável diferente.

Por padrão, o OpenClaw inicia sessões locais do mecanismo Codex em modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Esta é a postura confiável de operador local usada
para Heartbeat autônomos: o Codex pode usar ferramentas de shell e rede sem
parar em prompts de aprovação nativos que ninguém está por perto para responder.

Para optar por aprovações do Codex revisadas por guardião, defina `appServer.mode:
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
sair do sandbox, gravar fora do workspace ou adicionar permissões como acesso à rede,
o Codex roteia essa solicitação de aprovação para o revisor nativo em vez de um
prompt humano. O revisor aplica a estrutura de risco do Codex e aprova ou nega
a solicitação específica. Use Guardião quando quiser mais salvaguardas do que o modo YOLO,
mas ainda precisar que agentes não supervisionados avancem.

O preset `guardian` expande para `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` e `sandbox: "workspace-write"`.
Campos de política individuais ainda substituem `mode`, então implantações avançadas podem misturar
o preset com escolhas explícitas. O valor de revisor mais antigo `guardian_subagent` ainda é
aceito como alias de compatibilidade, mas novas configurações devem usar
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

Inicializações stdio do app-server herdam o ambiente de processo do OpenClaw por padrão,
mas o OpenClaw é dono da ponte de conta do app-server Codex. A autenticação é selecionada nesta
ordem:

1. Um perfil de autenticação Codex explícito do OpenClaw para o agente.
2. A conta existente do app-server, como uma autenticação ChatGPT local na CLI Codex.
3. Somente para inicializações locais stdio do app-server, `CODEX_API_KEY`, depois
   `OPENAI_API_KEY`, quando nenhuma conta do app-server estiver presente e a autenticação OpenAI
   ainda for necessária.

Quando o OpenClaw vê um perfil de autenticação Codex no estilo assinatura ChatGPT, ele remove
`CODEX_API_KEY` e `OPENAI_API_KEY` do processo filho Codex gerado. Isso
mantém chaves de API em nível de Gateway disponíveis para embeddings ou modelos OpenAI diretos
sem fazer com que turnos nativos do app-server Codex sejam cobrados pela API acidentalmente.
Perfis Codex explícitos com chave de API e fallback local de chave de ambiente stdio usam login do app-server
em vez de ambiente herdado do processo filho. Conexões WebSocket com app-server
não recebem fallback de chave de API de ambiente do Gateway; use um perfil de autenticação explícito ou a
própria conta do app-server remoto.

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

`appServer.clearEnv` afeta apenas o processo filho app-server Codex gerado.

Campos `appServer` compatíveis:

| Campo               | Padrão                                  | Significado                                                                                                                         |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                                            |
| `command`           | binário gerenciado do Codex              | Executável para transporte stdio. Deixe sem definir para usar o binário gerenciado; defina apenas para uma substituição explícita.  |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                                   |
| `url`               | não definido                             | URL WebSocket do app-server.                                                                                                        |
| `authToken`         | não definido                             | Token Bearer para transporte WebSocket.                                                                                             |
| `headers`           | `{}`                                     | Cabeçalhos WebSocket extras.                                                                                                        |
| `clearEnv`          | `[]`                                     | Nomes de variáveis de ambiente extras removidos do processo app-server stdio iniciado depois que o OpenClaw cria seu ambiente herdado. |
| `requestTimeoutMs`  | `60000`                                  | Tempo limite para chamadas de plano de controle do app-server.                                                                      |
| `mode`              | `"yolo"`                                 | Predefinição para execução YOLO ou revisada pelo guardian.                                                                          |
| `approvalPolicy`    | `"never"`                                | Política de aprovação nativa do Codex enviada para início/retomada/turno de thread.                                                 |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo do Codex enviado para início/retomada de thread.                                                                |
| `approvalsReviewer` | `"user"`                                 | Use `"auto_review"` para permitir que o Codex revise prompts de aprovação nativos. `guardian_subagent` permanece um alias legado.   |
| `serviceTier`       | não definido                             | Camada de serviço opcional do app-server do Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados.           |

Chamadas dinâmicas de ferramentas pertencentes ao OpenClaw são limitadas
independentemente de `appServer.requestTimeoutMs`: cada solicitação Codex
`item/tool/call` deve receber uma resposta do OpenClaw em até 30 segundos. Em
caso de tempo limite, o OpenClaw interrompe o sinal da ferramenta quando há
suporte e retorna uma resposta de ferramenta dinâmica com falha ao Codex para
que o turno possa continuar em vez de deixar a sessão em `processing`.

Depois que o OpenClaw responde a uma solicitação app-server com escopo de turno
do Codex, o harness também espera que o Codex finalize o turno nativo com
`turn/completed`. Se o app-server ficar sem resposta por 60 segundos depois
dessa resposta, o OpenClaw faz uma tentativa de melhor esforço para interromper
o turno do Codex, registra um tempo limite de diagnóstico e libera a lane da
sessão do OpenClaw para que mensagens de chat de acompanhamento não fiquem
enfileiradas atrás de um turno nativo obsoleto.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A
configuração é preferível para implantações repetíveis porque mantém o
comportamento do Plugin no mesmo arquivo revisado que o restante da
configuração do harness do Codex.

## Uso do computador

O Uso do Computador é abordado em seu próprio guia de configuração:
[Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use).

A versão curta: o OpenClaw não embute o app de controle de desktop nem executa
ações de desktop por conta própria. Ele prepara o app-server do Codex, verifica
se o servidor MCP `computer-use` está disponível e então permite que o Codex
trate as chamadas nativas da ferramenta MCP durante turnos no modo Codex.

Para acesso direto ao driver TryCua fora do fluxo do marketplace do Codex,
registre `cua-driver mcp` com `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Consulte [Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use) para ver a
distinção entre Uso do Computador pertencente ao Codex e registro MCP direto.

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
        fallback: "none",
      },
    },
  },
}
```

A configuração pode ser verificada ou instalada pela superfície de comandos:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

O Uso do Computador é específico do macOS e pode exigir permissões locais do SO
antes que o servidor MCP do Codex consiga controlar apps. Se
`computerUse.enabled` for verdadeiro e o servidor MCP não estiver disponível,
turnos no modo Codex falham antes do início da thread em vez de rodarem
silenciosamente sem as ferramentas nativas de Uso do Computador. Consulte
[Uso do Computador do Codex](/pt-BR/plugins/codex-computer-use) para opções de
marketplace, limites de catálogo remoto, motivos de status e solução de
problemas.

Quando `computerUse.autoInstall` é verdadeiro, o OpenClaw pode registrar o
marketplace padrão empacotado do Codex Desktop a partir de
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` se o Codex
ainda não tiver descoberto um marketplace local. Use `/new` ou `/reset` depois
de alterar a configuração de runtime ou Uso do Computador para que sessões
existentes não mantenham uma vinculação antiga de PI ou thread do Codex.

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

A troca de modelo permanece controlada pelo OpenClaw. Quando uma sessão do
OpenClaw está anexada a uma thread existente do Codex, o próximo turno envia
novamente ao app-server o modelo OpenAI, provedor, política de aprovação,
sandbox e camada de serviço selecionados no momento. Trocar de
`openai/gpt-5.5` para `openai/gpt-5.2` mantém a vinculação da thread, mas pede
ao Codex que continue com o modelo recém-selecionado.

## Comando Codex

O Plugin empacotado registra `/codex` como um comando de barra autorizado. Ele é
genérico e funciona em qualquer canal que dê suporte a comandos de texto do
OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade em tempo real do app-server, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista modelos em tempo real do app-server do Codex.
- `/codex threads [filter]` lista threads recentes do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma thread existente do Codex.
- `/codex compact` pede ao app-server do Codex para compactar a thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex diagnostics [note]` pede confirmação antes de enviar feedback de diagnóstico do Codex para a thread anexada.
- `/codex computer-use status` verifica o Plugin de Uso do Computador configurado e o servidor MCP.
- `/codex computer-use install` instala o Plugin de Uso do Computador configurado e recarrega os servidores MCP.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status de servidores MCP do app-server do Codex.
- `/codex skills` lista Skills do app-server do Codex.

### Fluxo de depuração comum

Quando um agente baseado no Codex faz algo surpreendente no Telegram, Discord,
Slack ou outro canal, comece pela conversa em que o problema aconteceu:

1. Execute `/diagnostics bad tool choice after image upload` ou outra nota curta
   que descreva o que você viu.
2. Aprove a solicitação de diagnóstico uma vez. A aprovação cria o zip de
   diagnóstico local do Gateway e, como a sessão está usando o harness do Codex,
   também envia o pacote de feedback relevante do Codex para os servidores da
   OpenAI.
3. Copie a resposta de diagnóstico concluída para o relatório de bug ou thread
   de suporte. Ela inclui o caminho do pacote local, o resumo de privacidade,
   ids de sessão do OpenClaw, ids de thread do Codex e uma linha
   `Inspect locally` para cada thread do Codex.
4. Se quiser depurar a execução por conta própria, execute o comando
   `Inspect locally` impresso em um terminal. Ele se parece com
   `codex resume <thread-id>` e abre a thread nativa do Codex para que você
   possa inspecionar a conversa, continuá-la localmente ou perguntar ao Codex
   por que ele escolheu uma ferramenta ou plano específico.

Use `/codex diagnostics [note]` apenas quando você quiser especificamente o
upload de feedback do Codex para a thread atualmente anexada sem o pacote
completo de diagnóstico do Gateway do OpenClaw. Para a maioria dos relatórios de
suporte, `/diagnostics [note]` é o melhor ponto de partida porque vincula o
estado local do Gateway e os ids de thread do Codex em uma única resposta.
Consulte [Exportação de diagnóstico](/pt-BR/gateway/diagnostics) para ver o modelo de
privacidade completo e o comportamento em chats de grupo.

O núcleo do OpenClaw também expõe `/diagnostics [note]`, somente para
proprietários, como o comando geral de diagnóstico do Gateway. Seu prompt de
aprovação mostra o preâmbulo de dados sensíveis, links para
[Exportação de Diagnóstico](/pt-BR/gateway/diagnostics) e solicita
`openclaw gateway diagnostics export --json` por aprovação explícita de execução
a cada vez. Não aprove diagnósticos com uma regra permitir tudo. Depois da
aprovação, o OpenClaw envia um relatório colável com o caminho do pacote local e
o resumo do manifesto. Quando a sessão ativa do OpenClaw está usando o harness
do Codex, essa mesma aprovação também autoriza o envio dos pacotes de feedback
relevantes do Codex para os servidores da OpenAI. O prompt de aprovação diz que
o feedback do Codex será enviado, mas não lista ids de sessão ou thread do Codex
antes da aprovação.

Se `/diagnostics` for invocado por um proprietário em um chat de grupo, o
OpenClaw mantém o canal compartilhado limpo: o grupo recebe apenas um aviso
curto, enquanto o preâmbulo de diagnóstico, os prompts de aprovação e os ids de
sessão/thread do Codex são enviados ao proprietário pela rota privada de
aprovação. Se não houver rota privada para o proprietário, o OpenClaw recusa a
solicitação do grupo e pede que o proprietário a execute a partir de uma DM.

O upload aprovado do Codex chama o `feedback/upload` do app-server do Codex e pede
ao app-server para incluir logs de cada thread listada e das subthreads Codex geradas
quando disponíveis. O upload passa pelo caminho normal de feedback do Codex até os
servidores da OpenAI; se o feedback do Codex estiver desativado nesse app-server, o comando retorna
o erro do app-server. A resposta de diagnóstico concluída lista os canais,
ids de sessão do OpenClaw, ids de thread do Codex e comandos locais `codex resume <thread-id>`
para as threads que foram enviadas. Se você negar ou ignorar a aprovação,
o OpenClaw não imprime esses ids do Codex. Esse upload não substitui a exportação local
de diagnósticos do Gateway.

`/codex resume` grava o mesmo arquivo sidecar de vinculação que o harness usa para
turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread do Codex, passa o
modelo do OpenClaw atualmente selecionado para o app-server e mantém o histórico estendido
ativado.

### Inspecionar uma thread do Codex pela CLI

A maneira mais rápida de entender uma execução problemática do Codex muitas vezes é abrir diretamente
a thread nativa do Codex:

```sh
codex resume <thread-id>
```

Use isso quando notar um bug em uma conversa de canal e quiser inspecionar a
sessão problemática do Codex, continuá-la localmente ou perguntar ao Codex por que ele fez uma
escolha específica de ferramenta ou raciocínio. O caminho mais fácil geralmente é executar
`/diagnostics [note]` primeiro: depois que você aprovar, o relatório concluído lista
cada thread do Codex e imprime um comando `Inspect locally`, por exemplo
`codex resume <thread-id>`. Você pode copiar esse comando diretamente para um terminal.

Você também pode obter um id de thread com `/codex binding` para o chat atual ou
`/codex threads [filter]` para threads recentes do app-server do Codex e então executar o mesmo
comando `codex resume` no seu shell.

A superfície de comando exige o app-server do Codex `0.125.0` ou mais recente. Métodos de
controle individuais são relatados como `unsupported by this Codex app-server` se um
app-server futuro ou personalizado não expuser esse método JSON-RPC.

## Limites de hooks

O harness do Codex tem três camadas de hook:

| Camada                                | Proprietário             | Finalidade                                                          |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugins do OpenClaw          | OpenClaw                 | Compatibilidade de produto/plugin entre os harnesses PI e Codex.    |
| Middleware de extensão do app-server do Codex | Plugins incluídos do OpenClaw | Comportamento de adaptador por turno em torno das ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política de ferramentas nativas da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` do Codex globais ou do projeto para rotear
comportamento de plugins do OpenClaw. Para a ponte compatível de ferramenta nativa e permissões,
o OpenClaw injeta configuração do Codex por thread para `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`. Outros hooks do Codex, como `SessionStart` e
`UserPromptSubmit`, continuam sendo controles no nível do Codex; eles não são expostos como
hooks de plugins do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita a
chamada, então o OpenClaw dispara o comportamento de plugin e middleware que possui no
adaptador do harness. Para ferramentas nativas do Codex, o Codex possui o registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação pelo app-server ou por callbacks de hooks nativos.

As projeções de Compaction e ciclo de vida do LLM vêm de notificações do app-server do Codex
e do estado do adaptador do OpenClaw, não de comandos de hooks nativos do Codex.
Os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte
da requisição interna ou dos payloads de Compaction do Codex.

As notificações `hook/started` e `hook/completed` nativas do Codex pelo app-server são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de plugins do OpenClaw.

## Contrato de suporte v1

O modo Codex não é PI com uma chamada de modelo diferente por baixo. O Codex possui uma parte maior
do loop de modelo nativo, e o OpenClaw adapta suas superfícies de plugin e sessão
em torno desse limite.

Compatível no runtime Codex v1:

| Superfície                                    | Suporte                                 | Motivo                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo OpenAI pelo Codex              | Compatível                              | O app-server do Codex possui o turno da OpenAI, a retomada de thread nativa e a continuação de ferramenta nativa.                                                                                    |
| Roteamento e entrega de canais do OpenClaw    | Compatível                              | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais ficam fora do runtime do modelo.                                                                                                        |
| Ferramentas dinâmicas do OpenClaw             | Compatível                              | O Codex pede ao OpenClaw para executar essas ferramentas, então o OpenClaw permanece no caminho de execução.                                                                                         |
| Plugins de prompt e contexto                  | Compatível                              | O OpenClaw constrói sobreposições de prompt e projeta contexto para o turno do Codex antes de iniciar ou retomar a thread.                                                                           |
| Ciclo de vida do mecanismo de contexto        | Compatível                              | Montagem, ingestão ou manutenção pós-turno e coordenação de Compaction do mecanismo de contexto são executadas para turnos do Codex.                                                                  |
| Hooks de ferramentas dinâmicas                | Compatível                              | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta rodam em torno das ferramentas dinâmicas pertencentes ao OpenClaw.                                                       |
| Hooks de ciclo de vida                        | Compatível como observações do adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex.                                                                       |
| Gate de revisão de resposta final             | Compatível por meio do relay de hook nativo | O `Stop` do Codex é encaminhado para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem de modelo antes da finalização.                                                               |
| Bloqueio ou observação de shell, patch e MCP nativos | Compatível por meio do relay de hook nativo | `PreToolUse` e `PostToolUse` do Codex são encaminhados para superfícies de ferramentas nativas confirmadas, incluindo payloads MCP no app-server do Codex `0.125.0` ou mais recente. Bloqueio é compatível; reescrita de argumentos não é. |
| Política de permissão nativa                  | Compatível por meio do relay de hook nativo | `PermissionRequest` do Codex pode ser roteado pela política do OpenClaw onde o runtime a expõe. Se o OpenClaw não retornar decisão, o Codex continua pelo caminho normal de guardião ou aprovação do usuário. |
| Captura de trajetória do app-server           | Compatível                              | O OpenClaw registra a requisição enviada ao app-server e as notificações do app-server que recebe.                                                                                                   |

Não compatível no runtime Codex v1:

| Superfície                                           | Limite v1                                                                                                                                       | Caminho futuro                                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Mutação de argumentos de ferramenta nativa           | Hooks nativos de pré-ferramenta do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.               | Exige suporte de hook/schema do Codex para entrada de ferramenta substituta.                |
| Histórico editável de transcrição nativa do Codex    | O Codex possui o histórico canônico da thread nativa. O OpenClaw possui um espelho e pode projetar contexto futuro, mas não deve mutar internos sem suporte. | Adicionar APIs explícitas do app-server do Codex se cirurgia de thread nativa for necessária. |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma gravações de transcrição pertencentes ao OpenClaw, não registros de ferramentas nativas do Codex.                           | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex. |
| Metadados ricos de Compaction nativa                 | O OpenClaw observa início e conclusão de Compaction, mas não recebe uma lista estável de mantidos/removidos, delta de tokens ou payload de resumo. | Precisa de eventos de Compaction mais ricos do Codex.                                      |
| Intervenção em Compaction                            | Os hooks atuais de Compaction do OpenClaw são de nível de notificação no modo Codex.                                                             | Adicionar hooks de pré/pós-Compaction do Codex se os plugins precisarem vetar ou reescrever a Compaction nativa. |
| Captura byte a byte da requisição da API de modelo   | O OpenClaw pode capturar requisições e notificações do app-server, mas o núcleo do Codex constrói internamente a requisição final da API da OpenAI. | Precisa de um evento de rastreamento de requisição de modelo do Codex ou API de depuração.  |

## Ferramentas, mídia e Compaction

O harness do Codex altera apenas o executor de agente embarcado de baixo nível.

O OpenClaw ainda constrói a lista de ferramentas e recebe resultados de ferramentas dinâmicas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramentas de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

O relay de hook nativo é intencionalmente genérico, mas o contrato de suporte v1 é
limitado aos caminhos de ferramentas nativas e permissões do Codex que o OpenClaw testa. No
runtime Codex, isso inclui payloads de shell, patch e MCP `PreToolUse`,
`PostToolUse` e `PermissionRequest`. Não presuma que todo evento futuro de hook do
Codex seja uma superfície de plugin do OpenClaw até que o contrato de runtime o nomeie.

Para `PermissionRequest`, o OpenClaw só retorna decisões explícitas de permitir ou negar
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como
ausência de decisão de hook e recorre ao próprio caminho de guardião ou aprovação do usuário.

Solicitações de aprovação de ferramentas MCP do Codex são roteadas pelo fluxo de aprovação de plugins
do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa requisição do servidor
nativo em vez de ser direcionada como contexto extra. Outras requisições de solicitação MCP
ainda falham fechadas.

O direcionamento da fila de execuções ativas mapeia para `turn/steer` do app-server do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa mensagens de chat enfileiradas
durante a janela de silêncio configurada e as envia como uma única solicitação `turn/steer` em
ordem de chegada. O modo legado `queue` envia solicitações `turn/steer` separadas. Turnos de
revisão e Compaction manual do Codex podem rejeitar direcionamento no mesmo turno; nesse caso,
o OpenClaw usa a fila de acompanhamento quando o modo selecionado permite fallback. Consulte
[Fila de direcionamento](/pt-BR/concepts/queue-steering).

Quando o modelo selecionado usa o harness do Codex, a Compaction nativa da thread é
delegada ao app-server do Codex. O OpenClaw mantém um espelho da transcrição para histórico
do canal, busca, `/new`, `/reset` e futura troca de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de
raciocínio ou plano do Codex quando o app-server os emite. Atualmente, o OpenClaw registra apenas
sinais de início e conclusão de Compaction nativa. Ele ainda não expõe um
resumo de Compaction legível por humanos nem uma lista auditável de quais entradas o Codex
manteve após a Compaction.

Como o Codex é dono da thread nativa canônica, `tool_result_persist` não
reescreve atualmente registros de resultado de ferramenta nativos do Codex. Ele só se aplica quando
o OpenClaw está gravando um resultado de ferramenta em transcrição de sessão pertencente ao OpenClaw.

A geração de mídia não exige PI. Imagem, vídeo, música, PDF, TTS e
compreensão de mídia continuam usando as configurações correspondentes de provedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**Codex não aparece como um provedor `/model` normal:** isso é esperado para
novas configurações. Selecione um modelo `openai/gpt-*` com
`agentRuntime.id: "codex"` (ou uma referência legada `codex/*`), habilite
`plugins.entries.codex.enabled` e verifique se `plugins.allow` exclui
`codex`.

**O OpenClaw usa PI em vez de Codex:** `agentRuntime.id: "auto"` ainda pode usar PI como
backend de compatibilidade quando nenhum harness do Codex assume a execução. Defina
`agentRuntime.id: "codex"` para forçar a seleção do Codex durante os testes. Um
runtime Codex forçado agora falha em vez de voltar para PI, a menos que você
defina explicitamente `agentRuntime.fallback: "pi"`. Depois que o app-server do Codex é
selecionado, suas falhas aparecem diretamente sem configuração extra de fallback.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
informe a versão `0.125.0` ou mais recente. Pré-lançamentos da mesma versão ou versões com
sufixos de build, como `0.125.0-alpha.2` ou `0.125.0+custom`, são rejeitados porque o
piso de protocolo estável `0.125.0` é o que o OpenClaw testa.

**A descoberta de modelos está lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desabilite a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão do protocolo app-server do Codex.

**Um modelo não Codex usa PI:** isso é esperado, a menos que você tenha forçado
`agentRuntime.id: "codex"` para esse agente ou selecionado uma referência legada
`codex/*`. Referências simples `openai/gpt-*` e de outros provedores permanecem em seu caminho de
provedor normal no modo `auto`. Se você forçar `agentRuntime.id: "codex"`, todo
turno incorporado desse agente deve ser um modelo OpenAI compatível com o Codex.

**Computer Use está instalado, mas as ferramentas não executam:** verifique
`/codex computer-use status` em uma nova sessão. Se uma ferramenta informar
`Native hook relay unavailable`, use `/new` ou `/reset`; se persistir, reinicie
o Gateway para limpar registros obsoletos de hook nativo. Se `computer-use.list_apps`
atingir o tempo limite, reinicie o Codex Computer Use ou o Codex Desktop e tente novamente.

## Relacionados

- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Runtimes de agente](/pt-BR/concepts/agent-runtimes)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Provedor OpenAI](/pt-BR/providers/openai)
- [Status](/pt-BR/cli/status)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
