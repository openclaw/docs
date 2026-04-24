---
read_when:
    - Você quer usar o harness incluído do app-server Codex
    - Você precisa de refs de modelo Codex e exemplos de configuração
    - Você quer desativar o fallback de Pi para implantações somente Codex
summary: Executar turnos de agente incorporados do OpenClaw pelo harness incluído do app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-24T06:02:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 095933d2c32df302c312c67fdc266d2f01b552dddb1607d6e4ecc4f3c3326acf
    source_path: plugins/codex-harness.md
    workflow: 15
---

O Plugin incluído `codex` permite que o OpenClaw execute turnos de agente incorporados por meio do
app-server Codex em vez do harness PI embutido.

Use isso quando quiser que o Codex controle a sessão de agente de baixo nível: descoberta
de modelo, retomada nativa de thread, Compaction nativa e execução do app-server.
O OpenClaw continua controlando canais de chat, arquivos de sessão, seleção de modelo, ferramentas,
aprovações, entrega de mídia e o espelhamento visível da transcrição.

Turnos nativos do Codex mantêm hooks de Plugin do OpenClaw como camada pública de compatibilidade.
Estes são hooks do OpenClaw em processo, não hooks de comando `hooks.json` do Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` para registros espelhados de transcrição
- `agent_end`

Plugins incluídos também podem registrar uma factory de extensão do app-server Codex para adicionar
middleware assíncrono de `tool_result`. Esse middleware é executado para ferramentas dinâmicas do OpenClaw
depois que o OpenClaw executa a ferramenta e antes que o resultado seja retornado ao Codex. Ele
é separado do hook público de Plugin `tool_result_persist`, que transforma gravações de resultado de ferramenta de transcrição pertencentes ao OpenClaw.

O harness vem desativado por padrão. Novas configurações devem manter refs de modelo OpenAI
canônicas como `openai/gpt-*` e forçar explicitamente
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` quando
quiserem execução nativa do app-server. Refs legadas de modelo `codex/*` ainda selecionam
automaticamente o harness por compatibilidade.

## Escolha o prefixo de modelo correto

Rotas da família OpenAI dependem do prefixo. Use `openai-codex/*` quando quiser
OAuth do Codex por meio de Pi; use `openai/*` quando quiser acesso direto à API OpenAI ou
quando estiver forçando o harness nativo do app-server Codex:

| Model ref                                             | Caminho de runtime                            | Use quando                                                                |
| ----------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | Provedor OpenAI pelo fluxo OpenClaw/Pi        | Você quer acesso direto atual à API OpenAI Platform com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                | OAuth OpenAI Codex por meio de OpenClaw/Pi    | Você quer autenticação por assinatura ChatGPT/Codex com o runner Pi padrão. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness do app-server Codex                   | Você quer execução nativa do app-server Codex para o turno de agente incorporado.   |

GPT-5.5 atualmente é apenas por assinatura/OAuth no OpenClaw. Use
`openai-codex/gpt-5.5` para OAuth via Pi ou `openai/gpt-5.5` com o harness do
app-server Codex. O acesso direto por chave de API para `openai/gpt-5.5` será compatível
quando a OpenAI ativar GPT-5.5 na API pública.

Refs legadas `codex/gpt-*` continuam aceitas como aliases de compatibilidade. Novas
configurações de OAuth do Codex por Pi devem usar `openai-codex/gpt-*`; novas configurações
de harness nativo do app-server devem usar `openai/gpt-*` mais `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` segue a mesma divisão por prefixo. Use
`openai-codex/gpt-*` quando o entendimento de imagem deve passar pelo caminho do provedor
OAuth OpenAI Codex. Use `codex/gpt-*` quando o entendimento de imagem deve ser executado
por um turno limitado do app-server Codex. O modelo do app-server Codex precisa
anunciar suporte a entrada de imagem; modelos Codex somente de texto falham antes do início
do turno de mídia.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a
seleção parecer surpreendente, ative logs de depuração para o subsistema `agents/harness`
e inspecione o registro estruturado `agent harness selected` do gateway. Ele
inclui o ID do harness selecionado, o motivo da seleção, a política de runtime/fallback e,
em modo `auto`, o resultado de suporte de cada candidato de Plugin.

A seleção do harness não é um controle de sessão ativa. Quando um turno incorporado é executado,
o OpenClaw registra o ID do harness selecionado nessa sessão e continua usando-o
em turnos posteriores no mesmo ID de sessão. Altere a configuração `embeddedHarness` ou
`OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro harness;
use `/new` ou `/reset` para iniciar uma sessão nova antes de alternar uma conversa
existente entre Pi e Codex. Isso evita reproduzir uma mesma transcrição em
dois sistemas nativos de sessão incompatíveis.

Sessões legadas criadas antes da fixação do harness são tratadas como fixadas em Pi quando
já têm histórico de transcrição. Use `/new` ou `/reset` para migrar essa conversa para
Codex após alterar a configuração.

`/status` mostra o harness efetivo não Pi ao lado de `Fast`, por exemplo
`Fast · codex`. O harness Pi padrão continua como `Runner: pi (embedded)` e não
adiciona um badge separado de harness.

## Requisitos

- OpenClaw com o Plugin incluído `codex` disponível.
- App-server Codex `0.118.0` ou mais recente.
- Autenticação Codex disponível para o processo do app-server.

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. Isso mantém
o OpenClaw na superfície de protocolo em que foi testado.

Para smoke tests em live e Docker, a autenticação normalmente vem de `OPENAI_API_KEY`, mais
arquivos opcionais da CLI Codex como `~/.codex/auth.json` e
`~/.codex/config.toml`. Use o mesmo material de autenticação que seu app-server Codex local
usa.

## Configuração mínima

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
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Se sua configuração usar `plugins.allow`, inclua `codex` aí também:

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

Configurações legadas que definem `agents.defaults.model` ou um modelo de agente para
`codex/<model>` ainda ativam automaticamente o Plugin incluído `codex`. Novas configurações devem
preferir `openai/<model>` mais a entrada explícita `embeddedHarness` acima.

## Adicione Codex sem substituir outros modelos

Mantenha `runtime: "auto"` quando quiser que refs legadas `codex/*` selecionem Codex e
Pi para todo o resto. Para novas configurações, prefira `runtime: "codex"` explícito nos
agentes que devem usar o harness.

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
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

Com esse formato:

- `/model gpt` ou `/model openai/gpt-5.5` usa o harness do app-server Codex nesta configuração.
- `/model opus` usa o caminho do provedor Anthropic.
- Se um modelo não Codex for selecionado, Pi continua sendo o harness de compatibilidade.

## Implantações somente Codex

Desative o fallback de Pi quando precisar provar que todo turno de agente incorporado usa
o harness Codex:

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
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Com o fallback desativado, o OpenClaw falha cedo se o Plugin Codex estiver desativado,
se o app-server for antigo demais ou se o app-server não puder iniciar.

## Codex por agente

Você pode fazer um agente ser somente Codex enquanto o agente padrão mantém
a seleção automática normal:

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
nova sessão OpenClaw, e o harness Codex cria ou retoma sua thread sidecar do app-server
conforme necessário. `/reset` limpa o binding da sessão OpenClaw para essa thread
e permite que o próximo turno resolva novamente o harness a partir da configuração atual.

## Descoberta de modelo

Por padrão, o Plugin Codex pergunta ao app-server pelos modelos disponíveis. Se a
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

Desative a descoberta quando quiser evitar que a inicialização faça sondagens no Codex e manter apenas o
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

Por padrão, o Plugin inicia o Codex localmente com:

```bash
codex app-server --listen stdio://
```

Por padrão, o OpenClaw inicia sessões locais do harness Codex em modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa é a postura confiável de operador local usada
para Heartbeats autônomos: o Codex pode usar ferramentas de shell e rede sem
parar em prompts nativos de aprovação que ninguém está por perto para responder.

Para optar por aprovações revisadas pelo guardian do Codex, defina `appServer.mode:
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

Guardian é um revisor nativo de aprovações do Codex. Quando o Codex pede para sair do sandbox, gravar fora do workspace ou adicionar permissões como acesso à rede, o Codex envia essa solicitação de aprovação a um subagente revisor em vez de um prompt humano. O revisor aplica o framework de risco do Codex e aprova ou nega a solicitação específica. Use Guardian quando quiser mais guardrails do que o modo YOLO, mas ainda precisar que agentes autônomos avancem sem supervisão.

O preset `guardian` se expande para `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` e `sandbox: "workspace-write"`. Campos individuais de política ainda substituem `mode`, então implantações avançadas podem misturar o preset com escolhas explícitas.

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

| Field               | Padrão                                   | Significado                                                                                               |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                 |
| `command`           | `"codex"`                                | Executável para transporte stdio.                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                         |
| `url`               | não definido                             | URL do app-server WebSocket.                                                                              |
| `authToken`         | não definido                             | Token bearer para transporte WebSocket.                                                                   |
| `headers`           | `{}`                                     | Cabeçalhos WebSocket extras.                                                                              |
| `requestTimeoutMs`  | `60000`                                  | Timeout para chamadas do plano de controle do app-server.                                                 |
| `mode`              | `"yolo"`                                 | Preset para execução YOLO ou com revisão por guardian.                                                    |
| `approvalPolicy`    | `"never"`                                | Política nativa de aprovação do Codex enviada para início/retomada/turno da thread.                      |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo do Codex enviado para início/retomada da thread.                                     |
| `approvalsReviewer` | `"user"`                                 | Use `"guardian_subagent"` para deixar o Codex Guardian revisar prompts.                                   |
| `serviceTier`       | não definido                             | Camada opcional de serviço do app-server Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados. |

As variáveis de ambiente antigas ainda funcionam como fallback para testes locais quando
o campo de configuração correspondente não está definido:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removida. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` em vez disso, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. A configuração é
preferível para implantações reproduzíveis porque mantém o comportamento do Plugin no
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

Validação de harness somente Codex, com fallback de Pi desativado:

```json5
{
  embeddedHarness: {
    fallback: "none",
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
            approvalsReviewer: "guardian_subagent",
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

A troca de modelo continua sendo controlada pelo OpenClaw. Quando uma sessão OpenClaw está conectada
a uma thread Codex existente, o próximo turno envia o modelo
OpenAI atualmente selecionado, provedor, política de aprovação, sandbox e camada de serviço ao
app-server novamente. Alternar de `openai/gpt-5.5` para `openai/gpt-5.2` mantém o
binding da thread, mas pede ao Codex para continuar com o modelo recém-selecionado.

## Comando Codex

O Plugin incluído registra `/codex` como um comando com barra autorizado. Ele é
genérico e funciona em qualquer canal compatível com comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade ativa com o app-server, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista modelos ativos do app-server Codex.
- `/codex threads [filter]` lista threads recentes do Codex.
- `/codex resume <thread-id>` conecta a sessão OpenClaw atual a uma thread Codex existente.
- `/codex compact` pede ao app-server Codex para compactar a thread conectada.
- `/codex review` inicia a revisão nativa do Codex para a thread conectada.
- `/codex account` mostra status da conta e de limite de taxa.
- `/codex mcp` lista o status do servidor MCP do app-server Codex.
- `/codex skills` lista Skills do app-server Codex.

`/codex resume` grava o mesmo arquivo de binding sidecar que o harness usa para
turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread Codex, passa o
modelo OpenClaw atualmente selecionado ao app-server e mantém o histórico estendido
ativado.

A superfície de comandos exige app-server Codex `0.118.0` ou mais recente. Métodos
individuais de controle são relatados como `unsupported by this Codex app-server` se um
app-server futuro ou personalizado não expuser esse método JSON-RPC.

## Limites dos hooks

O harness Codex tem três camadas de hooks:

| Layer                                 | Proprietário             | Finalidade                                                           |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hooks de Plugin do OpenClaw           | OpenClaw                 | Compatibilidade de produto/Plugin entre harnesses Pi e Codex.        |
| Middleware de extensão do app-server Codex | Plugins incluídos do OpenClaw | Comportamento adaptador por turno em torno de ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política nativa de ferramentas a partir da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para rotear
o comportamento de Plugin do OpenClaw. Hooks nativos do Codex são úteis para operações
pertencentes ao Codex, como política de shell, revisão nativa de resultado de ferramenta, tratamento de parada e
ciclo de vida nativo de Compaction/modelo, mas não são a API de Plugin do OpenClaw.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita
a chamada, então o OpenClaw dispara o comportamento de Plugin e middleware que controla no
adaptador do harness. Para ferramentas nativas do Codex, o Codex controla o registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não consegue reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação por meio do app-server ou callbacks nativos de hook.

Quando versões mais novas do app-server Codex expuserem eventos nativos de hook de Compaction e ciclo de vida de modelo,
o OpenClaw deverá proteger por versão esse suporte de protocolo e mapear os
eventos para o contrato existente de hooks do OpenClaw onde a semântica for honesta.
Até lá, os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte
da solicitação interna do Codex ou do payload de Compaction.

## Ferramentas, mídia e Compaction

O harness Codex altera apenas o executor incorporado de agente de baixo nível.

O OpenClaw ainda constrói a lista de ferramentas e recebe resultados de ferramentas dinâmicas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída da ferramenta de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

Solicitações de aprovação de ferramentas MCP do Codex são roteadas pelo fluxo de
aprovação de Plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento na fila responde a essa solicitação nativa do
servidor em vez de ser redirecionada como contexto extra. Outras solicitações de elicitação MCP ainda falham de forma fechada.

Quando o modelo selecionado usa o harness Codex, a Compaction nativa da thread é delegada
ao app-server Codex. O OpenClaw mantém um espelho da transcrição para histórico de canal,
busca, `/new`, `/reset` e futuras trocas de modelo ou harness. O espelho inclui o
prompt do usuário, o texto final do assistente e registros leves de raciocínio ou plano do Codex
quando o app-server os emite. Hoje, o OpenClaw só registra sinais de início e conclusão
da Compaction nativa. Ele ainda não expõe um resumo legível por humanos da
Compaction nem uma lista auditável de quais entradas o Codex manteve após a Compaction.

Como o Codex controla a thread nativa canônica, `tool_result_persist` atualmente não
reescreve registros de resultado de ferramenta nativos do Codex. Ele só se aplica quando
o OpenClaw está gravando um resultado de ferramenta em transcrição de sessão pertencente ao OpenClaw.

Geração de mídia não exige Pi. Imagem, vídeo, música, PDF, TTS e entendimento de mídia
continuam usando as configurações correspondentes de provedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**Codex não aparece em `/model`:** ative `plugins.entries.codex.enabled`,
selecione um modelo `openai/gpt-*` com `embeddedHarness.runtime: "codex"` (ou uma
ref legada `codex/*`) e verifique se `plugins.allow` exclui `codex`.

**O OpenClaw usa Pi em vez de Codex:** se nenhum harness Codex reivindicar a execução,
o OpenClaw pode usar Pi como backend de compatibilidade. Defina
`embeddedHarness.runtime: "codex"` para forçar a seleção do Codex durante testes, ou
`embeddedHarness.fallback: "none"` para falhar quando nenhum harness de Plugin corresponder. Depois
que o app-server Codex é selecionado, as falhas dele aparecem diretamente sem
configuração adicional de fallback.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
informe a versão `0.118.0` ou mais recente.

**A descoberta de modelo é lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desative a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão do protocolo do app-server Codex.

**Um modelo não Codex usa Pi:** isso é esperado, a menos que você tenha forçado
`embeddedHarness.runtime: "codex"` (ou selecionado uma ref legada `codex/*`). Refs simples
`openai/gpt-*` e de outros provedores permanecem em seu caminho normal de provedor.

## Relacionado

- [Plugins de Harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
