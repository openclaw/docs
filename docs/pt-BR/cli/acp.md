---
read_when:
    - Configurando integrações de IDE baseadas em ACP
    - Depurando o roteamento de sessão do ACP para o Gateway
summary: Execute a bridge ACP para integrações de IDE
title: ACP
x-i18n:
    generated_at: "2026-04-23T13:59:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

Execute a bridge do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que se comunica com um Gateway do OpenClaw.

Este comando fala ACP por stdio para IDEs e encaminha prompts para o Gateway
por WebSocket. Ele mantém sessões ACP mapeadas para chaves de sessão do Gateway.

`openclaw acp` é uma bridge ACP com suporte do Gateway, não um runtime de editor
totalmente nativo de ACP. Ele se concentra em roteamento de sessão, entrega de
prompts e atualizações básicas de streaming.

Se você quiser que um cliente MCP externo se comunique diretamente com conversas
de canal do OpenClaw em vez de hospedar uma sessão de harness ACP, use
[`openclaw mcp serve`](/pt-BR/cli/mcp).

## O que isto não é

Esta página é frequentemente confundida com sessões de harness ACP.

`openclaw acp` significa:

- OpenClaw atua como um servidor ACP
- uma IDE ou cliente ACP se conecta ao OpenClaw
- o OpenClaw encaminha esse trabalho para uma sessão do Gateway

Isso é diferente de [ACP Agents](/pt-BR/tools/acp-agents), em que o OpenClaw executa um
harness externo como Codex ou Claude Code por meio de `acpx`.

Regra rápida:

- editor/cliente quer falar ACP com o OpenClaw: use `openclaw acp`
- o OpenClaw deve iniciar Codex/Claude/Gemini como um harness ACP: use `/acp spawn` e [ACP Agents](/pt-BR/tools/acp-agents)

## Matriz de compatibilidade

| Área do ACP                                                           | Status      | Observações                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado | Fluxo principal da bridge por stdio para chat/send + abort do Gateway.                                                                                                                                                                         |
| `listSessions`, comandos de barra                                     | Implementado | A lista de sessões funciona com base no estado da sessão do Gateway; os comandos são anunciados via `available_commands_update`.                                                                                                               |
| `loadSession`                                                         | Parcial     | Reassocia a sessão ACP a uma chave de sessão do Gateway e reproduz o histórico armazenado de texto de usuário/assistente. O histórico de ferramentas/sistema ainda não é reconstruído.                                                         |
| Conteúdo do prompt (`text`, `resource` incorporado, imagens)          | Parcial     | Texto/recursos são achatados em entrada de chat; imagens se tornam anexos do Gateway.                                                                                                                                                          |
| Modos de sessão                                                       | Parcial     | `session/set_mode` é compatível, e a bridge expõe controles iniciais de sessão com suporte do Gateway para nível de pensamento, verbosidade de ferramentas, reasoning, detalhe de uso e ações elevadas. Superfícies mais amplas de modo/configuração nativas de ACP ainda estão fora de escopo. |
| Informações de sessão e atualizações de uso                           | Parcial     | A bridge emite notificações `session_info_update` e `usage_update`, no melhor esforço, a partir de snapshots em cache da sessão do Gateway. O uso é aproximado e só é enviado quando os totais de tokens do Gateway são marcados como atualizados. |
| Streaming de ferramentas                                              | Parcial     | Eventos `tool_call` / `tool_call_update` incluem E/S bruta, conteúdo de texto e localizações de arquivo no melhor esforço quando args/resultados de ferramentas do Gateway os expõem. Terminais incorporados e saídas mais ricas nativas de diff ainda não são expostos. |
| Servidores MCP por sessão (`mcpServers`)                              | Não compatível | O modo bridge rejeita solicitações de servidor MCP por sessão. Configure o MCP no gateway ou agente do OpenClaw.                                                                                                                              |
| Métodos de sistema de arquivos do cliente (`fs/read_text_file`, `fs/write_text_file`) | Não compatível | A bridge não chama métodos de sistema de arquivos do cliente ACP.                                                                                                                                                                              |
| Métodos de terminal do cliente (`terminal/*`)                         | Não compatível | A bridge não cria terminais do cliente ACP nem transmite IDs de terminal por chamadas de ferramenta.                                                                                                                                          |
| Planos de sessão / streaming de pensamento                            | Não compatível | A bridge atualmente emite texto de saída e status de ferramenta, não atualizações de plano ou pensamento do ACP.                                                                                                                              |

## Limitações conhecidas

- `loadSession` reproduz o histórico armazenado de texto de usuário e assistente, mas não
  reconstrói chamadas históricas de ferramentas, avisos do sistema ou tipos de
  eventos mais ricos nativos de ACP.
- Se vários clientes ACP compartilharem a mesma chave de sessão do Gateway, o roteamento
  de eventos e cancelamento será no melhor esforço, em vez de ficar estritamente isolado
  por cliente. Prefira as sessões isoladas padrão `acp:<uuid>` quando precisar de
  turnos locais do editor limpos.
- Estados de parada do Gateway são traduzidos para motivos de parada do ACP, mas esse mapeamento é
  menos expressivo do que um runtime totalmente nativo de ACP.
- Os controles iniciais de sessão atualmente expõem um subconjunto focado de opções do Gateway:
  nível de pensamento, verbosidade de ferramentas, reasoning, detalhe de uso e
  ações elevadas. Seleção de modelo e controles de host de execução ainda não são expostos como
  opções de configuração do ACP.
- `session_info_update` e `usage_update` são derivados de snapshots da sessão do Gateway,
  não de contabilização ao vivo nativa de ACP. O uso é aproximado,
  não inclui dados de custo e só é emitido quando o Gateway marca os dados totais
  de tokens como atualizados.
- Os dados de acompanhamento de ferramentas são no melhor esforço. A bridge pode expor caminhos de arquivo que
  aparecem em args/resultados de ferramentas conhecidos, mas ainda não emite terminais ACP nem
  diffs estruturados de arquivos.

## Uso

```bash
openclaw acp

# Gateway remoto
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway remoto (token de arquivo)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Anexar a uma chave de sessão existente
openclaw acp --session agent:main:main

# Anexar por rótulo (deve já existir)
openclaw acp --session-label "support inbox"

# Redefinir a chave de sessão antes do primeiro prompt
openclaw acp --session agent:main:main --reset-session
```

## Cliente ACP (depuração)

Use o cliente ACP integrado para verificar a bridge sem uma IDE.
Ele inicia a bridge ACP e permite que você digite prompts interativamente.

```bash
openclaw acp client

# Apontar a bridge iniciada para um Gateway remoto
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Substituir o comando do servidor (padrão: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permissão (modo de depuração do cliente):

- A aprovação automática é baseada em allowlist e se aplica apenas a IDs de ferramentas principais confiáveis.
- A aprovação automática de `read` tem escopo limitado ao diretório de trabalho atual (`--cwd` quando definido).
- O ACP só aprova automaticamente classes estreitas somente leitura: chamadas `read` com escopo sob o cwd ativo, além de ferramentas de busca somente leitura (`search`, `web_search`, `memory_search`). Ferramentas desconhecidas/não principais, leituras fora de escopo, ferramentas com capacidade de execução, ferramentas do plano de controle, ferramentas mutáveis e fluxos interativos sempre exigem aprovação explícita por prompt.
- `toolCall.kind` fornecido pelo servidor é tratado como metadado não confiável (não como fonte de autorização).
- Esta política da bridge ACP é separada das permissões do harness ACPX. Se você executar o OpenClaw por meio do backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` será o interruptor “yolo” de último recurso para essa sessão de harness.

## Como usar isto

Use ACP quando uma IDE (ou outro cliente) falar Agent Client Protocol e você quiser
que ela conduza uma sessão de Gateway do OpenClaw.

1. Certifique-se de que o Gateway está em execução (local ou remoto).
2. Configure o destino do Gateway (configuração ou flags).
3. Aponte sua IDE para executar `openclaw acp` por stdio.

Exemplo de configuração (persistida):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Exemplo de execução direta (sem gravar configuração):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferível para segurança de processo local
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selecionando agentes

O ACP não escolhe agentes diretamente. Ele faz o roteamento pela chave de sessão do Gateway.

Use chaves de sessão com escopo de agente para direcionar a um agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sessão ACP é mapeada para uma única chave de sessão do Gateway. Um agente pode ter muitas
sessões; o ACP usa por padrão uma sessão isolada `acp:<uuid>`, a menos que você substitua
a chave ou o rótulo.

`mcpServers` por sessão não são compatíveis no modo bridge. Se um cliente ACP
os enviar durante `newSession` ou `loadSession`, a bridge retornará um erro
claro em vez de ignorá-los silenciosamente.

Se você quiser que sessões com suporte de ACPX vejam ferramentas de plugin do OpenClaw ou ferramentas
integradas selecionadas, como `cron`, ative as bridges MCP ACPX no lado do gateway
em vez de tentar passar `mcpServers` por sessão. Consulte
[ACP Agents](/pt-BR/tools/acp-agents#plugin-tools-mcp-bridge) e
[bridge MCP das ferramentas do OpenClaw](/pt-BR/tools/acp-agents#openclaw-tools-mcp-bridge).

## Uso a partir do `acpx` (Codex, Claude, outros clientes ACP)

Se você quiser que um agente de programação como Codex ou Claude Code fale com seu
bot OpenClaw por ACP, use `acpx` com seu destino `openclaw` integrado.

Fluxo típico:

1. Execute o Gateway e verifique se a bridge ACP consegue alcançá-lo.
2. Aponte `acpx openclaw` para `openclaw acp`.
3. Direcione para a chave de sessão do OpenClaw que deseja que o agente de programação use.

Exemplos:

```bash
# Solicitação única para sua sessão ACP padrão do OpenClaw
acpx openclaw exec "Summarize the active OpenClaw session state."

# Sessão nomeada persistente para turnos de acompanhamento
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Se você quiser que `acpx openclaw` direcione para um Gateway específico e uma chave de sessão específica
sempre, substitua o comando do agente `openclaw` em `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Para um checkout local do OpenClaw, use o ponto de entrada direto da CLI em vez do
runner de desenvolvimento para que o stream ACP permaneça limpo. Por exemplo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta é a maneira mais fácil de permitir que Codex, Claude Code ou outro cliente compatível com ACP
extraia informações contextuais de um agente OpenClaw sem fazer scraping de um terminal.

## Configuração do editor Zed

Adicione um agente ACP personalizado em `~/.config/zed/settings.json` (ou use a interface de configurações do Zed):

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

No Zed, abra o painel Agent e selecione “OpenClaw ACP” para iniciar uma thread.

## Mapeamento de sessão

Por padrão, sessões ACP recebem uma chave de sessão do Gateway isolada com prefixo `acp:`.
Para reutilizar uma sessão conhecida, passe uma chave de sessão ou rótulo:

- `--session <key>`: usa uma chave de sessão específica do Gateway.
- `--session-label <label>`: resolve uma sessão existente por rótulo.
- `--reset-session`: gera um novo ID de sessão para essa chave (mesma chave, nova transcrição).

Se seu cliente ACP oferecer suporte a metadados, você pode substituir por sessão:

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

- `--url <url>`: URL WebSocket do Gateway (usa como padrão `gateway.remote.url` quando configurado).
- `--token <token>`: token de autenticação do Gateway.
- `--token-file <path>`: lê o token de autenticação do Gateway de um arquivo.
- `--password <password>`: senha de autenticação do Gateway.
- `--password-file <path>`: lê a senha de autenticação do Gateway de um arquivo.
- `--session <key>`: chave de sessão padrão.
- `--session-label <label>`: rótulo de sessão padrão a ser resolvido.
- `--require-existing`: falha se a chave/rótulo de sessão não existir.
- `--reset-session`: redefine a chave de sessão antes do primeiro uso.
- `--no-prefix-cwd`: não prefixa os prompts com o diretório de trabalho.
- `--provenance <off|meta|meta+receipt>`: inclui metadados ou recibos de proveniência do ACP.
- `--verbose, -v`: logs detalhados em stderr.

Observação de segurança:

- `--token` e `--password` podem ficar visíveis em listagens de processos locais em alguns sistemas.
- Prefira `--token-file`/`--password-file` ou variáveis de ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- A resolução de autenticação do Gateway segue o contrato compartilhado usado por outros clientes do Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback para `gateway.remote.*` apenas quando `gateway.auth.*` não estiver definido (SecretRefs locais configurados, mas não resolvidos, falham de forma restritiva)
  - modo remoto: `gateway.remote.*` com fallback de env/config conforme as regras de precedência remota
  - `--url` é seguro para substituição e não reutiliza credenciais implícitas de config/env; passe `--token`/`--password` explícitos (ou variantes de arquivo)
- Processos filhos do backend de runtime ACP recebem `OPENCLAW_SHELL=acp`, que pode ser usado para regras de shell/profile específicas de contexto.
- `openclaw acp client` define `OPENCLAW_SHELL=acp-client` no processo da bridge iniciada.

### Opções de `acp client`

- `--cwd <dir>`: diretório de trabalho da sessão ACP.
- `--server <command>`: comando do servidor ACP (padrão: `openclaw`).
- `--server-args <args...>`: argumentos extras passados para o servidor ACP.
- `--server-verbose`: ativa logs detalhados no servidor ACP.
- `--verbose, -v`: logs detalhados do cliente.
