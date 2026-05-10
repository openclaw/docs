---
read_when:
    - Configurando integrações de IDE baseadas em ACP
    - Depuração do roteamento de sessões ACP para o Gateway
summary: Execute a ponte ACP para integrações com IDEs
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:26:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

Execute a ponte [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que conversa com um OpenClaw Gateway.

Este comando fala ACP por stdio para IDEs e encaminha prompts ao Gateway
por WebSocket. Ele mantém sessões ACP mapeadas para chaves de sessão do Gateway.

`openclaw acp` é uma ponte ACP apoiada pelo Gateway, não um runtime de editor
totalmente nativo em ACP. Ele se concentra em roteamento de sessão, entrega de prompts
e atualizações básicas de streaming.

Se você quer que um cliente MCP externo converse diretamente com conversas de canais
do OpenClaw em vez de hospedar uma sessão de harness ACP, use
[`openclaw mcp serve`](/pt-BR/cli/mcp) em vez disso.

## O que isto não é

Esta página costuma ser confundida com sessões de harness ACP.

`openclaw acp` significa:

- OpenClaw atua como um servidor ACP
- uma IDE ou cliente ACP se conecta ao OpenClaw
- OpenClaw encaminha esse trabalho para uma sessão do Gateway

Isso é diferente de [Agentes ACP](/pt-BR/tools/acp-agents), em que o OpenClaw executa um
harness externo, como Codex ou Claude Code, por meio de `acpx`.

Regra rápida:

- editor/cliente quer falar ACP com o OpenClaw: use `openclaw acp`
- OpenClaw deve iniciar Codex/Claude/Gemini como um harness ACP: use `/acp spawn` e [Agentes ACP](/pt-BR/tools/acp-agents)

## Matriz de compatibilidade

| Área ACP                                                              | Status      | Observações                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado | Fluxo principal da ponte por stdio para chat/envio + cancelamento do Gateway.                                                                                                                                                                                        |
| `listSessions`, comandos de barra                                        | Implementado | A lista de sessões funciona contra o estado de sessão do Gateway com paginação por cursor limitada e filtragem por `cwd` quando as linhas de sessão do Gateway carregam metadados de workspace; os comandos são anunciados via `available_commands_update`.                                |
| `resumeSession`, `closeSession`                                       | Implementado | A retomada religa uma sessão ACP a uma sessão existente do Gateway sem reproduzir o histórico. O fechamento cancela o trabalho ativo da ponte, resolve prompts pendentes como cancelados e libera o estado de sessão da ponte.                                              |
| `loadSession`                                                         | Parcial     | Religa a sessão ACP a uma chave de sessão do Gateway e reproduz o histórico do livro-razão de eventos ACP para sessões criadas pela ponte. Sessões antigas/sem livro-razão usam como fallback o texto armazenado de usuário/assistente.                                                             |
| Conteúdo de prompt (`text`, `resource` embutido, imagens)                  | Parcial     | Texto/recursos são achatados na entrada de chat; imagens viram anexos do Gateway.                                                                                                                                                                 |
| Modos de sessão                                                         | Parcial     | `session/set_mode` tem suporte, e a ponte expõe controles iniciais de sessão apoiados pelo Gateway para nível de pensamento, verbosidade de ferramentas, raciocínio, detalhe de uso e ações elevadas. Superfícies mais amplas de modo/configuração nativas em ACP ainda estão fora do escopo. |
| Informações de sessão e atualizações de uso                                        | Parcial     | A ponte emite notificações `session_info_update` e `usage_update` de melhor esforço a partir de snapshots de sessão do Gateway em cache. O uso é aproximado e só é enviado quando os totais de tokens do Gateway estão marcados como atualizados.                                        |
| Streaming de ferramentas                                                        | Parcial     | Eventos `tool_call` / `tool_call_update` incluem E/S bruta, conteúdo de texto e locais de arquivo de melhor esforço quando argumentos/resultados de ferramentas do Gateway os expõem. Terminais embutidos e saída mais rica nativa em diff ainda não são expostos.                        |
| Aprovações de exec                                                        | Parcial     | Prompts de aprovação de exec do Gateway durante turnos ativos de prompt ACP são retransmitidos ao cliente ACP com `session/request_permission`.                                                                                                                    |
| Servidores MCP por sessão (`mcpServers`)                                | Sem suporte | O modo de ponte rejeita solicitações de servidor MCP por sessão. Configure o MCP no Gateway ou agente do OpenClaw em vez disso.                                                                                                                                     |
| Métodos de sistema de arquivos do cliente (`fs/read_text_file`, `fs/write_text_file`) | Sem suporte | A ponte não chama métodos de sistema de arquivos do cliente ACP.                                                                                                                                                                                          |
| Métodos de terminal do cliente (`terminal/*`)                                | Sem suporte | A ponte não cria terminais de cliente ACP nem transmite ids de terminal por chamadas de ferramenta.                                                                                                                                                       |
| Planos de sessão / streaming de pensamento                                     | Sem suporte | A ponte atualmente emite texto de saída e status de ferramenta, não atualizações de plano ou pensamento ACP.                                                                                                                                                         |

## Limitações conhecidas

- `loadSession` só consegue reproduzir o histórico completo do livro-razão de eventos ACP para
  sessões criadas pela ponte. Sessões antigas/sem livro-razão ainda usam fallback de transcrição
  e não reconstroem chamadas de ferramenta históricas nem avisos do sistema.
- Se vários clientes ACP compartilharem a mesma chave de sessão do Gateway, o roteamento de eventos e cancelamentos
  será de melhor esforço, em vez de estritamente isolado por cliente. Prefira as
  sessões isoladas padrão `acp:<uuid>` quando precisar de turnos locais do editor
  limpos.
- Estados de parada do Gateway são traduzidos para motivos de parada ACP, mas esse mapeamento é
  menos expressivo do que um runtime totalmente nativo em ACP.
- Os controles iniciais de sessão atualmente expõem um subconjunto focado de ajustes do Gateway:
  nível de pensamento, verbosidade de ferramentas, raciocínio, detalhe de uso e ações
  elevadas. Seleção de modelo e controles de host de exec ainda não são expostos como opções de
  configuração ACP.
- `session_info_update` e `usage_update` são derivados de snapshots de sessão do Gateway,
  não de contabilização em runtime ao vivo nativa em ACP. O uso é aproximado,
  não carrega dados de custo e só é emitido quando o Gateway marca os dados totais de
  tokens como atualizados.
- Dados de acompanhamento de ferramentas são de melhor esforço. A ponte consegue expor caminhos de arquivo que
  aparecem em argumentos/resultados de ferramentas conhecidos, mas ainda não emite terminais ACP nem
  diffs de arquivo estruturados.
- O repasse de aprovação de exec é limitado ao turno de prompt ACP ativo; aprovações de
  outras sessões do Gateway são ignoradas.

## Uso

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## Cliente ACP (depuração)

Use o cliente ACP integrado para fazer uma verificação básica da ponte sem uma IDE.
Ele inicia a ponte ACP e permite digitar prompts interativamente.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permissão (modo de depuração do cliente):

- A aprovação automática é baseada em lista de permissões e só se aplica a IDs de ferramentas principais confiáveis.
- A aprovação automática de `read` é limitada ao diretório de trabalho atual (`--cwd` quando definido).
- ACP só aprova automaticamente classes readonly estreitas: chamadas `read` com escopo sob o cwd ativo mais ferramentas de busca readonly (`search`, `web_search`, `memory_search`). Ferramentas desconhecidas/não principais, leituras fora do escopo, ferramentas capazes de exec, ferramentas de plano de controle, ferramentas mutantes e fluxos interativos sempre exigem aprovação explícita por prompt.
- `toolCall.kind` fornecido pelo servidor é tratado como metadados não confiáveis (não como uma fonte de autorização).
- Esta política da ponte ACP é separada das permissões do harness ACPX. Se você executar o OpenClaw por meio do backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` é o interruptor de emergência "yolo" para essa sessão de harness.

## Teste de fumaça do protocolo

Para depuração no nível do protocolo, inicie um Gateway com estado isolado e controle
`openclaw acp` por stdio com um cliente ACP JSON-RPC. Cubra `initialize`,
`session/new`, `session/list` com um `cwd` absoluto, `session/resume`,
`session/close`, fechamento duplicado e retomada ausente.

A prova deve incluir as capacidades de ciclo de vida anunciadas, uma linha de sessão
apoiada pelo Gateway, notificações de atualização e o log `sessions.list` do Gateway:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Evite usar `openclaw gateway call sessions.list` como a única prova ACP. Esse
caminho da CLI pode solicitar uma elevação de escopo de operador com token novo; a correção da ponte ACP
é comprovada por frames ACP em stdio mais o log `sessions.list` do Gateway.

## Como usar isto

Use ACP quando uma IDE (ou outro cliente) fala Agent Client Protocol e você quer
que ela conduza uma sessão do OpenClaw Gateway.

1. Garanta que o Gateway esteja em execução (local ou remoto).
2. Configure o alvo do Gateway (configuração ou flags).
3. Aponte sua IDE para executar `openclaw acp` por stdio.

Configuração de exemplo (persistida):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Execução direta de exemplo (sem gravar configuração):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selecionando agentes

ACP não escolhe agentes diretamente. Ele roteia pela chave de sessão do Gateway.

Use chaves de sessão com escopo de agente para mirar em um agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sessão ACP mapeia para uma única chave de sessão do Gateway. Um agente pode ter muitas
sessões; ACP usa por padrão uma sessão isolada `acp:<uuid>`, a menos que você substitua
a chave ou o rótulo.

`mcpServers` por sessão não são compatíveis no modo bridge. Se um cliente ACP
os enviar durante `newSession` ou `loadSession`, o bridge retornará um erro
claro em vez de ignorá-los silenciosamente.

Se você quiser que sessões baseadas em ACPX vejam ferramentas de Plugin do
OpenClaw ou ferramentas integradas selecionadas, como `cron`, habilite os
bridges ACPX MCP no lado do Gateway em vez de tentar passar `mcpServers` por
sessão. Consulte
[Agentes ACP](/pt-BR/tools/acp-agents-setup#plugin-tools-mcp-bridge) e
[Bridge MCP de ferramentas do OpenClaw](/pt-BR/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Usar a partir de `acpx` (Codex, Claude, outros clientes ACP)

Se você quiser que um agente de codificação, como Codex ou Claude Code, converse
com seu bot OpenClaw via ACP, use `acpx` com seu destino `openclaw` integrado.

Fluxo típico:

1. Execute o Gateway e certifique-se de que o bridge ACP consiga alcançá-lo.
2. Aponte `acpx openclaw` para `openclaw acp`.
3. Direcione para a chave de sessão do OpenClaw que você quer que o agente de codificação use.

Exemplos:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Se você quiser que `acpx openclaw` direcione para um Gateway e uma chave de
sessão específicos todas as vezes, substitua o comando do agente `openclaw` em
`~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Para um checkout local do OpenClaw no repositório, use o ponto de entrada direto
da CLI em vez do executor de desenvolvimento para que o fluxo ACP permaneça
limpo. Por exemplo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Essa é a maneira mais fácil de permitir que Codex, Claude Code ou outro cliente
compatível com ACP obtenha informações contextuais de um agente OpenClaw sem
fazer scraping de um terminal.

## Configuração do editor Zed

Adicione um agente ACP personalizado em `~/.config/zed/settings.json` (ou use a IU de Configurações do Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Para direcionar a um Gateway ou agente específico:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

No Zed, abra o painel Agente e selecione "OpenClaw ACP" para iniciar uma conversa.

## Mapeamento de sessões

Por padrão, sessões ACP recebem uma chave de sessão isolada do Gateway com um prefixo `acp:`.
Para reutilizar uma sessão conhecida, passe uma chave ou rótulo de sessão:

- `--session <key>`: use uma chave de sessão específica do Gateway.
- `--session-label <label>`: resolva uma sessão existente por rótulo.
- `--reset-session`: crie um novo id de sessão para essa chave (mesma chave, nova transcrição).

Se o seu cliente ACP oferecer suporte a metadados, você pode substituir por sessão:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Saiba mais sobre chaves de sessão em [/concepts/session](/pt-BR/concepts/session).

## Opções

- `--url <url>`: URL WebSocket do Gateway (padrão: gateway.remote.url quando configurado).
- `--token <token>`: token de autenticação do Gateway.
- `--token-file <path>`: leia o token de autenticação do Gateway de um arquivo.
- `--password <password>`: senha de autenticação do Gateway.
- `--password-file <path>`: leia a senha de autenticação do Gateway de um arquivo.
- `--session <key>`: chave de sessão padrão.
- `--session-label <label>`: rótulo de sessão padrão a resolver.
- `--require-existing`: falha se a chave/rótulo de sessão não existir.
- `--reset-session`: redefina a chave de sessão antes do primeiro uso.
- `--no-prefix-cwd`: não prefixe prompts com o diretório de trabalho.
- `--provenance <off|meta|meta+receipt>`: inclua metadados ou recibos de proveniência ACP.
- `--verbose, -v`: registro detalhado em stderr.

Observação de segurança:

- `--token` e `--password` podem ficar visíveis em listagens de processos locais em alguns sistemas.
- Prefira `--token-file`/`--password-file` ou variáveis de ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- A resolução de autenticação do Gateway segue o contrato compartilhado usado por outros clientes do Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` somente quando `gateway.auth.*` não estiver definido (SecretRefs locais configuradas, mas não resolvidas, falham fechadas)
  - modo remoto: `gateway.remote.*` com fallback de env/config conforme as regras de precedência remota
  - `--url` é seguro para substituição e não reutiliza credenciais implícitas de config/env; passe `--token`/`--password` explícitos (ou variantes de arquivo)
- Processos filhos do backend de runtime ACP recebem `OPENCLAW_SHELL=acp`, que pode ser usado para regras de shell/perfil específicas de contexto.
- `openclaw acp client` define `OPENCLAW_SHELL=acp-client` no processo de bridge gerado.

### Opções de `acp client`

- `--cwd <dir>`: diretório de trabalho para a sessão ACP.
- `--server <command>`: comando do servidor ACP (padrão: `openclaw`).
- `--server-args <args...>`: argumentos extras passados ao servidor ACP.
- `--server-verbose`: habilite registro detalhado no servidor ACP.
- `--verbose, -v`: registro detalhado do cliente.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Agentes ACP](/pt-BR/tools/acp-agents)
