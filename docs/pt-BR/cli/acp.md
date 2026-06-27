---
read_when:
    - Configurando integrações de IDE baseadas em ACP
    - Depuração do roteamento de sessão ACP para o Gateway
summary: Execute a ponte ACP para integrações com IDEs
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:17:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

Execute a ponte [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que conversa com um Gateway do OpenClaw.

Este comando fala ACP via stdio para IDEs e encaminha prompts para o Gateway
via WebSocket. Ele mantém sessões ACP mapeadas para chaves de sessão do Gateway.

`openclaw acp` é uma ponte ACP apoiada por Gateway, não um runtime de editor
ACP-nativo completo. Ele se concentra em roteamento de sessões, entrega de
prompts e atualizações básicas de streaming.

Se você quiser que um cliente MCP externo converse diretamente com conversas de
canal do OpenClaw em vez de hospedar uma sessão de harness ACP, use
[`openclaw mcp serve`](/pt-BR/cli/mcp).

## O que isto não é

Esta página é frequentemente confundida com sessões de harness ACP.

`openclaw acp` significa:

- OpenClaw atua como um servidor ACP
- uma IDE ou cliente ACP se conecta ao OpenClaw
- OpenClaw encaminha esse trabalho para uma sessão do Gateway

Isso é diferente de [ACP Agents](/pt-BR/tools/acp-agents), em que o OpenClaw executa um
harness externo, como Codex ou Claude Code, por meio de `acpx`.

Regra rápida:

- editor/cliente quer falar ACP com o OpenClaw: use `openclaw acp`
- OpenClaw deve iniciar Codex/Claude/Gemini como um harness ACP: use `/acp spawn` e [ACP Agents](/pt-BR/tools/acp-agents)

## Matriz de compatibilidade

| Área ACP                                                              | Status        | Observações                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado  | Fluxo central da ponte via stdio para chat/envio + abort do Gateway.                                                                                                                                                                                    |
| `listSessions`, comandos de barra                                     | Implementado  | A lista de sessões funciona contra o estado de sessão do Gateway com paginação por cursor limitada e filtragem por `cwd` quando as linhas de sessão do Gateway carregam metadados de workspace; comandos são anunciados via `available_commands_update`. |
| Metadados de linhagem de sessão                                       | Implementado  | Listagens de sessões e snapshots de informações de sessão incluem linhagem pai e filha do OpenClaw em `_meta`, para que clientes ACP possam renderizar grafos de subagentes sem canais laterais privados do Gateway.                                    |
| `resumeSession`, `closeSession`                                       | Implementado  | Resume revincula uma sessão ACP a uma sessão existente do Gateway sem reproduzir o histórico. Close cancela trabalho ativo da ponte, resolve prompts pendentes como cancelados e libera o estado de sessão da ponte.                                    |
| `loadSession`                                                         | Parcial       | Revincula a sessão ACP a uma chave de sessão do Gateway e reproduz o histórico do ledger de eventos ACP para sessões criadas pela ponte. Sessões mais antigas/sem ledger recorrem ao texto armazenado de usuário/assistente.                           |
| Conteúdo de prompt (`text`, `resource` incorporado, imagens)          | Parcial       | Textos/recursos são achatados na entrada de chat; imagens viram anexos do Gateway.                                                                                                                                                                      |
| Modos de sessão                                                       | Parcial       | `session/set_mode` é compatível, e a ponte expõe controles iniciais de sessão apoiados por Gateway para nível de pensamento, verbosidade de ferramentas, raciocínio, detalhe de uso e ações elevadas. Superfícies mais amplas de modo/configuração ACP-nativas ainda estão fora do escopo. |
| Informações de sessão e atualizações de uso                           | Parcial       | A ponte emite notificações `session_info_update` e `usage_update` de melhor esforço a partir de snapshots de sessão do Gateway em cache. O uso é aproximado e só é enviado quando os totais de tokens do Gateway são marcados como recentes.             |
| Streaming de ferramentas                                              | Parcial       | Eventos `tool_call` / `tool_call_update` incluem E/S bruta, conteúdo de texto e locais de arquivo de melhor esforço quando args/resultados de ferramentas do Gateway os expõem. Terminais incorporados e saída mais rica nativa de diff ainda não são expostos. |
| Aprovações de exec                                                    | Parcial       | Prompts de aprovação de exec do Gateway durante turnos ativos de prompt ACP são retransmitidos ao cliente ACP com `session/request_permission`.                                                                                                          |
| Servidores MCP por sessão (`mcpServers`)                              | Sem suporte   | O modo ponte rejeita solicitações de servidor MCP por sessão. Configure MCP no Gateway ou agente do OpenClaw.                                                                                                                                           |
| Métodos de sistema de arquivos do cliente (`fs/read_text_file`, `fs/write_text_file`) | Sem suporte   | A ponte não chama métodos de sistema de arquivos do cliente ACP.                                                                                                                                                                                        |
| Métodos de terminal do cliente (`terminal/*`)                         | Sem suporte   | A ponte não cria terminais de cliente ACP nem transmite ids de terminal por chamadas de ferramenta.                                                                                                                                                     |
| Planos de sessão / streaming de pensamento                            | Sem suporte   | No momento, a ponte emite texto de saída e status de ferramentas, não atualizações de plano ou pensamento ACP.                                                                                                                                          |

## Limitações conhecidas

- `loadSession` só consegue reproduzir o histórico completo do ledger de eventos ACP para
  sessões criadas pela ponte. Sessões mais antigas/sem ledger ainda usam fallback de
  transcrição e não reconstroem chamadas de ferramenta históricas ou avisos do sistema.
- Se vários clientes ACP compartilharem a mesma chave de sessão do Gateway, o roteamento
  de eventos e cancelamento será de melhor esforço, em vez de estritamente isolado por cliente. Prefira as
  sessões isoladas padrão `acp-bridge:<uuid>` quando precisar de turnos locais de editor
  limpos.
- Estados de parada do Gateway são traduzidos para motivos de parada ACP, mas esse mapeamento é
  menos expressivo que um runtime totalmente ACP-nativo.
- Os controles iniciais de sessão atualmente expõem um subconjunto focado de ajustes do Gateway:
  nível de pensamento, verbosidade de ferramentas, raciocínio, detalhe de uso e ações
  elevadas. Seleção de modelo e controles de host de exec ainda não são expostos como opções de
  configuração ACP.
- `session_info_update` e `usage_update` são derivados de snapshots de sessão do Gateway,
  não de contabilização de runtime ACP-nativa ao vivo. O uso é aproximado,
  não carrega dados de custo e só é emitido quando o Gateway marca os dados totais de tokens
  como recentes.
- Dados de acompanhamento de ferramentas são de melhor esforço. A ponte pode expor caminhos de arquivo que
  aparecem em args/resultados de ferramentas conhecidos, mas ainda não emite terminais ACP nem
  diffs de arquivo estruturados.
- A retransmissão de aprovação de exec é limitada ao turno de prompt ACP ativo; aprovações de
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

## Cliente ACP (debug)

Use o cliente ACP integrado para verificar a sanidade da ponte sem uma IDE.
Ele inicia a ponte ACP e permite que você digite prompts interativamente.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permissões (modo debug do cliente):

- A aprovação automática é baseada em lista de permissões e se aplica apenas a IDs de ferramentas centrais confiáveis.
- A aprovação automática de `read` é limitada ao diretório de trabalho atual (`--cwd` quando definido).
- O ACP só aprova automaticamente classes restritas somente leitura: chamadas `read` com escopo sob o cwd ativo mais ferramentas de busca somente leitura (`search`, `web_search`, `memory_search`). Ferramentas desconhecidas/não centrais, leituras fora do escopo, ferramentas capazes de exec, ferramentas de plano de controle, ferramentas mutantes e fluxos interativos sempre exigem aprovação explícita do prompt.
- `toolCall.kind` fornecido pelo servidor é tratado como metadados não confiáveis (não como fonte de autorização).
- Esta política da ponte ACP é separada das permissões de harness ACPX. Se você executar o OpenClaw por meio do backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` é a chave de emergência "yolo" para essa sessão de harness.

## Teste smoke de protocolo

Para depuração em nível de protocolo, inicie um Gateway com estado isolado e conduza
`openclaw acp` via stdio com um cliente JSON-RPC ACP. Cubra `initialize`,
`session/new`, `session/list` com um `cwd` absoluto, `session/resume`,
`session/close`, fechamento duplicado e resume ausente.

A prova deve incluir as capacidades de ciclo de vida anunciadas, uma linha de sessão
apoiada por Gateway, notificações de atualização e o log `sessions.list` do Gateway:

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
caminho da CLI pode solicitar uma elevação de escopo de operador com token recente; a
correção da ponte ACP é comprovada por frames ACP stdio mais o log `sessions.list` do Gateway.

## Como usar isto

Use ACP quando uma IDE (ou outro cliente) fala Agent Client Protocol e você quer
que ela conduza uma sessão do Gateway do OpenClaw.

1. Garanta que o Gateway esteja em execução (local ou remoto).
2. Configure o destino do Gateway (configuração ou flags).
3. Aponte sua IDE para executar `openclaw acp` via stdio.

Exemplo de configuração (persistida):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Exemplo de execução direta (sem gravação de configuração):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selecionando agentes

ACP não escolhe agentes diretamente. Ele roteia pela chave de sessão do Gateway.

Use chaves de sessão com escopo de agente para direcionar um agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sessão ACP é mapeada para uma única chave de sessão do Gateway. Um agente pode ter muitas
sessões; por padrão, o ACP usa uma sessão `acp-bridge:<uuid>` isolada, a menos que você substitua
a chave ou o rótulo.

`mcpServers` por sessão não são compatíveis no modo ponte. Se um cliente ACP
os enviar durante `newSession` ou `loadSession`, a ponte retornará um erro claro
em vez de ignorá-los silenciosamente.

Se você quiser que sessões baseadas em ACPX vejam ferramentas de Plugin do OpenClaw ou ferramentas
integradas selecionadas, como `cron`, habilite as pontes ACPX MCP no lado do Gateway em vez
de tentar passar `mcpServers` por sessão. Consulte
[Agentes ACP](/pt-BR/tools/acp-agents-setup#plugin-tools-mcp-bridge) e
[ponte MCP de ferramentas do OpenClaw](/pt-BR/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Usar a partir de `acpx` (Codex, Claude, outros clientes ACP)

Se você quiser que um agente de codificação, como Codex ou Claude Code, converse com seu
bot OpenClaw por ACP, use `acpx` com o destino `openclaw` integrado.

Fluxo típico:

1. Execute o Gateway e confirme que a ponte ACP consegue alcançá-lo.
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

Se você quiser que `acpx openclaw` direcione para um Gateway e uma chave de sessão específicos sempre,
substitua o comando do agente `openclaw` em `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Para um checkout local do OpenClaw no repositório, use o ponto de entrada direto da CLI em vez do
executor de desenvolvimento, para que o fluxo ACP permaneça limpo. Por exemplo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta é a maneira mais fácil de permitir que Codex, Claude Code ou outro cliente compatível com ACP
extraia informações contextuais de um agente OpenClaw sem fazer scraping de um terminal.

## Configuração do editor Zed

Adicione um agente ACP personalizado em `~/.config/zed/settings.json` (ou use a interface de Configurações do Zed):

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

No Zed, abra o painel Agent e selecione "OpenClaw ACP" para iniciar uma conversa.

## Mapeamento de sessão

Por padrão, as sessões da ponte ACP recebem uma chave de sessão isolada do Gateway com um
prefixo `acp-bridge:`. Essas sessões de ponte de modelo normal são sintéticas e
sujeitas à remoção de entradas obsoletas e a limites de contagem de entradas. Para reutilizar uma sessão conhecida,
passe uma chave ou rótulo de sessão:

- `--session <key>`: usa uma chave de sessão específica do Gateway.
- `--session-label <label>`: resolve uma sessão existente por rótulo.
- `--reset-session`: emite um novo ID de sessão para essa chave (mesma chave, nova transcrição).

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

- `--url <url>`: URL WebSocket do Gateway (usa `gateway.remote.url` por padrão quando configurada).
- `--token <token>`: token de autenticação do Gateway.
- `--token-file <path>`: lê o token de autenticação do Gateway a partir de um arquivo.
- `--password <password>`: senha de autenticação do Gateway.
- `--password-file <path>`: lê a senha de autenticação do Gateway a partir de um arquivo.
- `--session <key>`: chave de sessão padrão.
- `--session-label <label>`: rótulo de sessão padrão a resolver.
- `--require-existing`: falha se a chave/rótulo de sessão não existir.
- `--reset-session`: redefine a chave de sessão antes do primeiro uso.
- `--no-prefix-cwd`: não prefixa prompts com o diretório de trabalho.
- `--provenance <off|meta|meta+receipt>`: inclui metadados ou recibos de proveniência ACP.
- `--verbose, -v`: registro detalhado em stderr.

Observação de segurança:

- `--token` e `--password` podem ficar visíveis em listagens de processos locais em alguns sistemas.
- Prefira `--token-file`/`--password-file` ou variáveis de ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- A resolução de autenticação do Gateway segue o contrato compartilhado usado por outros clientes do Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback de `gateway.remote.*` somente quando `gateway.auth.*` não está definido (SecretRefs locais configurados, mas não resolvidos, falham de forma fechada)
  - modo remoto: `gateway.remote.*` com fallback de env/config conforme as regras de precedência remota
  - `--url` é seguro para substituição e não reutiliza credenciais implícitas de config/env; passe `--token`/`--password` explícitos (ou variantes de arquivo)
- Processos filhos do backend de runtime ACP recebem `OPENCLAW_SHELL=acp`, que pode ser usado para regras de shell/perfil específicas de contexto.
- `openclaw acp client` define `OPENCLAW_SHELL=acp-client` no processo de ponte gerado.

### Opções de `acp client`

- `--cwd <dir>`: diretório de trabalho para a sessão ACP.
- `--server <command>`: comando do servidor ACP (padrão: `openclaw`).
- `--server-args <args...>`: argumentos extras passados ao servidor ACP.
- `--server-verbose`: ativa registro detalhado no servidor ACP.
- `--verbose, -v`: registro detalhado do cliente.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Agentes ACP](/pt-BR/tools/acp-agents)
