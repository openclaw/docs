---
read_when:
    - Você quer usar o harness app-server do Codex empacotado
    - Você precisa de exemplos de refs de modelo e configuração do Codex
    - Você quer desativar o fallback de PI em implantações somente com Codex
summary: Executar turnos de agente incorporado do OpenClaw por meio do harness app-server do Codex empacotado
title: Harness do Codex
x-i18n:
    generated_at: "2026-04-11T02:45:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e1dcf4f1a00c63c3ef31d72feac44bce255421c032c58fa4fd67295b3daf23
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness do Codex

O plugin `codex` empacotado permite que o OpenClaw execute turnos de agente incorporado por meio do
app-server do Codex em vez do harness PI integrado.

Use isso quando você quiser que o Codex seja responsável pela sessão de agente de baixo nível: descoberta
de modelos, retomada nativa de thread, compactação nativa e execução no app-server.
O OpenClaw continua sendo responsável pelos canais de chat, arquivos de sessão, seleção de modelos, ferramentas,
aprovações, entrega de mídia e pelo espelho visível da transcrição.

O harness vem desativado por padrão. Ele é selecionado apenas quando o plugin `codex`
está ativado e o modelo resolvido é um modelo `codex/*`, ou quando você força explicitamente
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.
Se você nunca configurar `codex/*`, as execuções existentes de PI, OpenAI, Anthropic, Gemini, local
e de provedor personalizado manterão o comportamento atual.

## Escolha o prefixo de modelo certo

O OpenClaw tem rotas separadas para acesso no formato OpenAI e no formato Codex:

| Ref do modelo         | Caminho de runtime                            | Use quando                                                              |
| --------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`      | Provedor OpenAI via plumbing OpenClaw/PI      | Você quer acesso direto à API da plataforma OpenAI com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Provedor OpenAI Codex OAuth via PI           | Você quer OAuth do ChatGPT/Codex sem o harness app-server do Codex.     |
| `codex/gpt-5.4`       | Provedor Codex empacotado mais harness Codex  | Você quer execução nativa no app-server do Codex para o turno de agente incorporado. |

O harness do Codex só assume refs de modelo `codex/*`. Refs existentes de `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local e provedor personalizado mantêm
seus caminhos normais.

## Requisitos

- OpenClaw com o plugin `codex` empacotado disponível.
- Codex app-server `0.118.0` ou mais recente.
- Autenticação do Codex disponível para o processo do app-server.

O plugin bloqueia handshakes do app-server mais antigos ou sem versão. Isso mantém
o OpenClaw na superfície de protocolo contra a qual ele foi testado.

Para testes smoke ao vivo e com Docker, a autenticação normalmente vem de `OPENAI_API_KEY`, além de
arquivos opcionais da CLI do Codex, como `~/.codex/auth.json` e
`~/.codex/config.toml`. Use o mesmo material de autenticação que seu app-server local do Codex
usa.

## Configuração mínima

Use `codex/gpt-5.4`, ative o plugin empacotado e force o harness `codex`:

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

Se sua configuração usar `plugins.allow`, inclua `codex` lá também:

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
ativa automaticamente o plugin `codex` empacotado. A entrada explícita do plugin ainda
é útil em configurações compartilhadas porque deixa clara a intenção da implantação.

## Adicione Codex sem substituir outros modelos

Mantenha `runtime: "auto"` quando você quiser Codex para modelos `codex/*` e PI para
todo o resto:

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

- `/model codex` ou `/model codex/gpt-5.4` usa o harness app-server do Codex.
- `/model gpt` ou `/model openai/gpt-5.4` usa o caminho do provedor OpenAI.
- `/model opus` usa o caminho do provedor Anthropic.
- Se um modelo não Codex for selecionado, o PI continua sendo o harness de compatibilidade.

## Implantações somente com Codex

Desative o fallback de PI quando precisar comprovar que todo turno de agente incorporado usa
o harness do Codex:

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

Substituição por variável de ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Com o fallback desativado, o OpenClaw falha cedo se o plugin Codex estiver desativado,
se o modelo solicitado não for um ref `codex/*`, se o app-server for antigo demais ou se o
app-server não puder iniciar.

## Codex por agente

Você pode fazer um agente usar somente Codex enquanto o agente padrão mantém a
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

Use os comandos normais de sessão para alternar agentes e modelos. `/new` cria uma nova
sessão do OpenClaw, e o harness do Codex cria ou retoma sua thread sidecar do app-server
conforme necessário. `/reset` limpa o vínculo da sessão do OpenClaw para essa thread.

## Descoberta de modelos

Por padrão, o plugin Codex consulta o app-server pelos modelos disponíveis. Se a
descoberta falhar ou expirar, ele usa o catálogo de fallback empacotado:

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

Desative a descoberta quando quiser que a inicialização evite sondar o Codex e permaneça no
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

Por padrão, o plugin inicia o Codex localmente com:

```bash
codex app-server --listen stdio://
```

Você pode manter esse padrão e ajustar apenas a política nativa do Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| Campo               | Padrão                                   | Significado                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` se conecta a `url`.              |
| `command`           | `"codex"`                                | Executável para transporte stdio.                                        |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                        |
| `url`               | não definido                             | URL WebSocket do app-server.                                             |
| `authToken`         | não definido                             | Token Bearer para transporte WebSocket.                                  |
| `headers`           | `{}`                                     | Cabeçalhos WebSocket extras.                                             |
| `requestTimeoutMs`  | `60000`                                  | Timeout para chamadas do plano de controle do app-server.                |
| `approvalPolicy`    | `"never"`                                | Política nativa de aprovação do Codex enviada para iniciar/retomar/executar thread. |
| `sandbox`           | `"workspace-write"`                      | Modo sandbox nativo do Codex enviado ao iniciar/retomar thread.          |
| `approvalsReviewer` | `"user"`                                 | Use `"guardian_subagent"` para deixar o guardian do Codex revisar aprovações nativas. |
| `serviceTier`       | não definido                             | Camada de serviço opcional do Codex, por exemplo `"priority"`.           |

As variáveis de ambiente mais antigas ainda funcionam como fallbacks para testes locais quando
o campo de configuração correspondente não estiver definido:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

A configuração é preferível para implantações reproduzíveis.

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

Validação de harness somente com Codex, com fallback de PI desativado:

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

Aprovações do Codex revisadas pelo guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
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

A troca de modelo continua sendo controlada pelo OpenClaw. Quando uma sessão do OpenClaw está vinculada
a uma thread Codex existente, o próximo turno envia novamente o modelo `codex/*`,
o provedor, a política de aprovação, o sandbox e a camada de serviço selecionados no momento para o
app-server. Mudar de `codex/gpt-5.4` para `codex/gpt-5.2` mantém o vínculo da
thread, mas solicita ao Codex que continue com o modelo recém-selecionado.

## Comando Codex

O plugin empacotado registra `/codex` como um comando slash autorizado. Ele é
genérico e funciona em qualquer canal que ofereça suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade ativa com o app-server, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista os modelos ativos do app-server do Codex.
- `/codex threads [filter]` lista as threads recentes do Codex.
- `/codex resume <thread-id>` vincula a sessão atual do OpenClaw a uma thread Codex existente.
- `/codex compact` pede ao app-server do Codex para compactar a thread vinculada.
- `/codex review` inicia a revisão nativa do Codex para a thread vinculada.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do app-server do Codex.
- `/codex skills` lista as Skills do app-server do Codex.

`/codex resume` grava o mesmo arquivo de vínculo sidecar que o harness usa para
turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread do Codex, passa o
modelo `codex/*` do OpenClaw atualmente selecionado para o app-server e mantém o
histórico estendido ativado.

A superfície de comandos exige Codex app-server `0.118.0` ou mais recente. Métodos individuais
de controle são informados como `unsupported by this Codex app-server` se um
app-server futuro ou personalizado não expuser esse método JSON-RPC.

## Ferramentas, mídia e compactação

O harness do Codex altera apenas o executor de baixo nível do agente incorporado.

O OpenClaw ainda monta a lista de ferramentas e recebe resultados dinâmicos de ferramentas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramentas de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

Quando o modelo selecionado usa o harness do Codex, a compactação nativa de thread é
delegada ao app-server do Codex. O OpenClaw mantém um espelho da transcrição para histórico do canal,
pesquisa, `/new`, `/reset` e futuras trocas de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de raciocínio ou
plano do Codex quando o app-server os emite.

A geração de mídia não exige PI. Geração de imagem, vídeo, música, PDF, TTS e
interpretação de mídia continuam usando as configurações correspondentes de provedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**Codex não aparece em `/model`:** ative `plugins.entries.codex.enabled`,
defina um ref de modelo `codex/*` ou verifique se `plugins.allow` exclui `codex`.

**O OpenClaw usa fallback para PI:** defina `embeddedHarness.fallback: "none"` ou
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` durante os testes.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
informe a versão `0.118.0` ou mais recente.

**A descoberta de modelos está lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desative a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão do protocolo app-server do Codex.

**Um modelo não Codex usa PI:** isso é esperado. O harness do Codex só assume
refs de modelo `codex/*`.

## Relacionado

- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testing](/pt-BR/help/testing#live-codex-app-server-harness-smoke)
