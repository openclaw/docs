---
read_when:
    - Você quer usar o harness app-server Codex incluído no pacote
    - Você precisa de refs de modelo Codex e exemplos de config
    - Você quer desativar o fallback de Pi para implantações somente Codex
summary: Execute turnos de agente embutidos do OpenClaw por meio do harness app-server Codex incluído no pacote
title: Harness Codex
x-i18n:
    generated_at: "2026-04-23T14:04:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

O Plugin `codex` incluído no pacote permite que o OpenClaw execute turnos de agente embutidos por meio do
app-server Codex em vez do harness Pi embutido.

Use isto quando quiser que o Codex seja o responsável pela sessão de agente de baixo nível: descoberta
de modelo, retomada nativa de thread, Compaction nativa e execução via app-server.
O OpenClaw continua responsável por canais de chat, arquivos de sessão, seleção de modelo, ferramentas,
aprovações, entrega de mídia e o espelho visível da transcrição.

Turnos nativos do Codex também respeitam os hooks compartilhados de Plugin, para que shims de prompt,
automação com reconhecimento de Compaction, middleware de ferramenta e observadores de ciclo de vida permaneçam
alinhados com o harness Pi:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Plugins incluídos no pacote também podem registrar uma factory de extensão do app-server Codex para adicionar
middleware assíncrono de `tool_result`.

O harness vem desativado por padrão. Ele é selecionado apenas quando o Plugin `codex` está
ativado e o modelo resolvido é um modelo `codex/*`, ou quando você força explicitamente
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.
Se você nunca configurar `codex/*`, execuções existentes de Pi, OpenAI, Anthropic, Gemini, local
e de provider personalizado mantêm seu comportamento atual.

## Escolha o prefixo de modelo correto

O OpenClaw tem rotas separadas para acesso no formato OpenAI e Codex:

| Ref de modelo         | Caminho de runtime                           | Use quando                                                              |
| --------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`      | Provider OpenAI via pipeline OpenClaw/Pi     | Você quer acesso direto à API da plataforma OpenAI com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Provider OpenAI Codex OAuth via Pi          | Você quer OAuth do ChatGPT/Codex sem o harness app-server Codex.        |
| `codex/gpt-5.4`       | Provider Codex incluído + harness Codex      | Você quer execução nativa do app-server Codex para o turno de agente embutido. |

O harness Codex assume apenas refs de modelo `codex/*`. Refs existentes `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local e de provider personalizado mantêm
seus caminhos normais.

## Requisitos

- OpenClaw com o Plugin `codex` incluído no pacote disponível.
- App-server Codex `0.118.0` ou mais recente.
- Autenticação do Codex disponível para o processo do app-server.

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. Isso mantém
o OpenClaw na superfície de protocolo com a qual ele foi testado.

Para testes smoke ativos e com Docker, a autenticação geralmente vem de `OPENAI_API_KEY`, além de
arquivos opcionais da CLI Codex, como `~/.codex/auth.json` e
`~/.codex/config.toml`. Use o mesmo material de autenticação que seu app-server Codex local
usa.

## Configuração mínima

Use `codex/gpt-5.4`, ative o Plugin incluído no pacote e force o harness `codex`:

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Se sua config usar `plugins.allow`, inclua `codex` ali também:

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

Definir `agents.defaults.model` ou o modelo de um agente como `codex/<model>` também
ativa automaticamente o Plugin `codex` incluído no pacote. A entrada explícita do Plugin ainda
é útil em configs compartilhadas porque torna a intenção da implantação óbvia.

## Adicionar Codex sem substituir outros modelos

Mantenha `runtime: "auto"` quando quiser Codex para modelos `codex/*` e Pi para
todo o restante:

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
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Com esse formato:

- `/model codex` ou `/model codex/gpt-5.4` usa o harness app-server Codex.
- `/model gpt` ou `/model openai/gpt-5.4` usa o caminho do provider OpenAI.
- `/model opus` usa o caminho do provider Anthropic.
- Se um modelo não-Codex for selecionado, Pi continua sendo o harness de compatibilidade.

## Implantações somente Codex

Desative o fallback de Pi quando precisar comprovar que todo turno de agente embutido usa
o harness Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Sobrescrita por ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Com o fallback desativado, o OpenClaw falha cedo se o Plugin Codex estiver desativado,
se o modelo solicitado não for uma ref `codex/*`, se o app-server for antigo demais ou se o
app-server não puder iniciar.

## Codex por agente

Você pode fazer com que um agente seja somente Codex enquanto o agente padrão mantém a
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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Use comandos normais de sessão para trocar agentes e modelos. `/new` cria uma nova
sessão do OpenClaw, e o harness Codex cria ou retoma sua thread sidecar do app-server
conforme necessário. `/reset` limpa o binding de sessão do OpenClaw para essa thread.

## Descoberta de modelo

Por padrão, o Plugin Codex pergunta ao app-server quais modelos estão disponíveis. Se
a descoberta falhar ou expirar, ele usa o catálogo de fallback incluído no pacote:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

Desative a descoberta quando quiser que a inicialização evite sondar o Codex e fique
com o catálogo de fallback:

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

## Conexão com app-server e política

Por padrão, o Plugin inicia o Codex localmente com:

```bash
codex app-server --listen stdio://
```

Por padrão, o OpenClaw inicia sessões locais do harness Codex no modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Esta é a postura confiável de operador local usada
para Heartbeats autônomos: o Codex pode usar ferramentas de shell e rede sem
parar em prompts nativos de aprovação quando não há ninguém por perto para responder.

Para fazer opt-in para aprovações revisadas por Guardian do Codex, defina `appServer.mode:
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

O modo Guardian se expande para:

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

Guardian é um revisor nativo de aprovações do Codex. Quando o Codex pede para sair da
sandbox, gravar fora do workspace ou adicionar permissões como acesso à rede,
o Codex encaminha essa solicitação de aprovação para um subagente revisor em vez de um
prompt humano. O revisor reúne contexto e aplica o framework de risco do Codex, então
aprova ou nega a solicitação específica. Guardian é útil quando você quer mais
proteções do que no modo YOLO, mas ainda precisa que agentes e Heartbeats não assistidos
continuem avançando.

O harness ativo do Docker inclui uma probe de Guardian quando
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Ele inicia o harness Codex em
modo Guardian, verifica se um comando de shell com elevação benigno é aprovado e
verifica se um upload de segredo falso para um destino externo não confiável é
negado, para que o agente peça aprovação explícita de volta.

Os campos individuais de política ainda têm precedência sobre `mode`, então implantações avançadas podem
misturar o preset com escolhas explícitas.

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

Campos `appServer` compatíveis:

| Campo              | Padrão                                    | Significado                                                                                               |
| ------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`        | `"stdio"`                                 | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                  |
| `command`          | `"codex"`                                 | Executável para transporte stdio.                                                                         |
| `args`             | `["app-server", "--listen", "stdio://"]`  | Argumentos para transporte stdio.                                                                         |
| `url`              | não definido                              | URL do app-server WebSocket.                                                                              |
| `authToken`        | não definido                              | Token Bearer para transporte WebSocket.                                                                   |
| `headers`          | `{}`                                      | Headers extras de WebSocket.                                                                              |
| `requestTimeoutMs` | `60000`                                   | Timeout para chamadas do plano de controle do app-server.                                                 |
| `mode`             | `"yolo"`                                  | Preset para execução YOLO ou revisada por Guardian.                                                       |
| `approvalPolicy`   | `"never"`                                 | Política nativa de aprovação do Codex enviada para início/retomada/turno da thread.                      |
| `sandbox`          | `"danger-full-access"`                    | Modo nativo de sandbox do Codex enviado para início/retomada da thread.                                  |
| `approvalsReviewer`| `"user"`                                  | Use `"guardian_subagent"` para permitir que o Guardian do Codex revise prompts.                           |
| `serviceTier`      | não definido                              | Camada de serviço opcional do app-server Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados. |

As variáveis de ambiente mais antigas ainda funcionam como fallbacks para testes locais quando
o campo de config correspondente não está definido:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removido. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` em vez disso, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. Config é
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

Aprovações do Codex revisadas por Guardian:

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

A troca de modelo continua sendo controlada pelo OpenClaw. Quando uma sessão do OpenClaw é anexada
a uma thread Codex existente, o próximo turno envia o modelo `codex/*`,
provider, política de aprovação, sandbox e camada de serviço atualmente selecionados para o
app-server novamente. Alternar de `codex/gpt-5.4` para `codex/gpt-5.2` mantém o
binding da thread, mas pede ao Codex para continuar com o modelo recém-selecionado.

## Comando Codex

O Plugin incluído no pacote registra `/codex` como um comando slash autorizado. Ele é
genérico e funciona em qualquer canal compatível com comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade ativa com o app-server, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista modelos ativos do app-server Codex.
- `/codex threads [filter]` lista threads Codex recentes.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma thread Codex existente.
- `/codex compact` pede ao app-server Codex para fazer Compaction da thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do app-server Codex.
- `/codex skills` lista as Skills do app-server Codex.

`/codex resume` grava o mesmo arquivo de binding sidecar que o harness usa para
turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread Codex, passa o
modelo `codex/*` do OpenClaw atualmente selecionado para o app-server e mantém o
histórico estendido ativado.

A superfície de comando exige app-server Codex `0.118.0` ou mais recente. Métodos
individuais de controle são informados como `unsupported by this Codex app-server` se um
app-server futuro ou personalizado não expuser esse método JSON-RPC.

## Ferramentas, mídia e Compaction

O harness Codex altera apenas o executor embutido de baixo nível do agente.

O OpenClaw ainda monta a lista de ferramentas e recebe resultados dinâmicos de ferramenta do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída da ferramenta de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

Solicitações de aprovação de ferramentas MCP do Codex são roteadas pelo fluxo de aprovação
de Plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`; outras solicitações de elicitação e entrada livre ainda falham
de forma fechada.

Quando o modelo selecionado usa o harness Codex, a Compaction nativa de thread é
delegada ao app-server Codex. O OpenClaw mantém um espelho da transcrição para histórico
de canal, busca, `/new`, `/reset` e futuras trocas de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de
raciocínio ou plano do Codex quando o app-server os emite. Hoje, o OpenClaw apenas
registra sinais de início e conclusão da Compaction nativa. Ele ainda não expõe um
resumo legível por humanos da Compaction nem uma lista auditável de quais entradas o Codex
manteve após a Compaction.

A geração de mídia não exige Pi. Imagem, vídeo, música, PDF, TTS e compreensão
de mídia continuam usando as configurações correspondentes de provider/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**Codex não aparece em `/model`:** ative `plugins.entries.codex.enabled`,
defina uma ref de modelo `codex/*` ou verifique se `plugins.allow` exclui `codex`.

**O OpenClaw usa Pi em vez de Codex:** se nenhum harness Codex assumir a execução,
o OpenClaw pode usar Pi como backend de compatibilidade. Defina
`embeddedHarness.runtime: "codex"` para forçar a seleção de Codex durante testes, ou
`embeddedHarness.fallback: "none"` para falhar quando nenhum harness de Plugin corresponder. Depois
que o app-server Codex for selecionado, as falhas dele aparecem diretamente sem config
extra de fallback.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
informe a versão `0.118.0` ou mais recente.

**A descoberta de modelo é lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desative a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão de protocolo do app-server Codex.

**Um modelo não-Codex usa Pi:** isso é esperado. O harness Codex assume apenas
refs de modelo `codex/*`.

## Relacionado

- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Providers de modelo](/pt-BR/concepts/model-providers)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testes](/pt-BR/help/testing#live-codex-app-server-harness-smoke)
