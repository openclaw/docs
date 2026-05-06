---
read_when:
    - Configuração de integrações de IDE baseadas em ACP
    - Depuração do roteamento de sessões ACP para o Gateway
summary: Execute a ponte ACP para integrações com IDE
title: ACP
x-i18n:
    generated_at: "2026-05-06T05:48:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

Execute a ponte [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que se comunica com um OpenClaw Gateway.

Este comando fala ACP por stdio para IDEs e encaminha prompts para o Gateway
por WebSocket. Ele mantém sessões ACP mapeadas para chaves de sessão do Gateway.

`openclaw acp` é uma ponte ACP apoiada pelo Gateway, não um runtime completo de
editor nativo de ACP. Ele se concentra em roteamento de sessão, entrega de
prompts e atualizações básicas de streaming.

Se você quiser que um cliente MCP externo converse diretamente com conversas de
canais do OpenClaw em vez de hospedar uma sessão de harness ACP, use
[`openclaw mcp serve`](/pt-BR/cli/mcp).

## O que isto não é

Esta página costuma ser confundida com sessões de harness ACP.

`openclaw acp` significa:

- O OpenClaw atua como um servidor ACP
- uma IDE ou um cliente ACP se conecta ao OpenClaw
- o OpenClaw encaminha esse trabalho para uma sessão do Gateway

Isso é diferente de [agentes ACP](/pt-BR/tools/acp-agents), em que o OpenClaw executa
um harness externo, como Codex ou Claude Code, por meio de `acpx`.

Regra rápida:

- editor/cliente quer falar ACP com o OpenClaw: use `openclaw acp`
- o OpenClaw deve iniciar Codex/Claude/Gemini como harness ACP: use `/acp spawn` e [agentes ACP](/pt-BR/tools/acp-agents)

## Matriz de compatibilidade

| Área do ACP                                                           | Status        | Observações                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado  | Fluxo principal da ponte por stdio para chat/envio do Gateway + cancelamento.                                                                                                                                                                    |
| `listSessions`, comandos de barra                                     | Implementado  | A lista de sessões funciona com o estado de sessão do Gateway; os comandos são anunciados por `available_commands_update`.                                                                                                                       |
| `loadSession`                                                         | Parcial       | Revincula a sessão ACP a uma chave de sessão do Gateway e reproduz o histórico armazenado de texto do usuário/assistente. O histórico de ferramentas/sistema ainda não é reconstruído.                                                          |
| Conteúdo do prompt (`text`, `resource` incorporado, imagens)          | Parcial       | Textos/recursos são achatados na entrada de chat; imagens viram anexos do Gateway.                                                                                                                                                               |
| Modos de sessão                                                       | Parcial       | `session/set_mode` é compatível, e a ponte expõe controles iniciais de sessão apoiados pelo Gateway para nível de pensamento, verbosidade de ferramentas, raciocínio, detalhe de uso e ações elevadas. Superfícies mais amplas de modo/configuração nativas de ACP ainda estão fora do escopo. |
| Informações da sessão e atualizações de uso                           | Parcial       | A ponte emite notificações `session_info_update` e `usage_update` de melhor esforço a partir de snapshots em cache da sessão do Gateway. O uso é aproximado e só é enviado quando os totais de tokens do Gateway são marcados como atualizados. |
| Streaming de ferramentas                                              | Parcial       | Eventos `tool_call` / `tool_call_update` incluem E/S bruta, conteúdo de texto e localizações de arquivo de melhor esforço quando argumentos/resultados de ferramentas do Gateway os expõem. Terminais incorporados e saída mais rica nativa de diffs ainda não são expostos. |
| Servidores MCP por sessão (`mcpServers`)                              | Não compatível | O modo de ponte rejeita solicitações de servidor MCP por sessão. Configure o MCP no gateway ou agente do OpenClaw.                                                                                                                               |
| Métodos de sistema de arquivos do cliente (`fs/read_text_file`, `fs/write_text_file`) | Não compatível | A ponte não chama métodos de sistema de arquivos do cliente ACP.                                                                                                                                                                                 |
| Métodos de terminal do cliente (`terminal/*`)                         | Não compatível | A ponte não cria terminais do cliente ACP nem transmite IDs de terminal por chamadas de ferramenta.                                                                                                                                              |
| Planos de sessão / streaming de pensamento                            | Não compatível | Atualmente, a ponte emite texto de saída e status de ferramentas, não atualizações de plano ou pensamento do ACP.                                                                                                                               |

## Limitações conhecidas

- `loadSession` reproduz o histórico armazenado de textos do usuário e do
  assistente, mas não reconstrói chamadas históricas de ferramentas, avisos do
  sistema ou tipos de evento nativos de ACP mais ricos.
- Se vários clientes ACP compartilharem a mesma chave de sessão do Gateway, o
  roteamento de eventos e cancelamentos será de melhor esforço, em vez de
  estritamente isolado por cliente. Prefira as sessões isoladas padrão
  `acp:<uuid>` quando precisar de turnos locais do editor limpos.
- Estados de parada do Gateway são traduzidos em motivos de parada ACP, mas esse
  mapeamento é menos expressivo do que um runtime totalmente nativo de ACP.
- Os controles iniciais de sessão atualmente expõem um subconjunto focado de
  controles do Gateway: nível de pensamento, verbosidade de ferramentas,
  raciocínio, detalhe de uso e ações elevadas. Seleção de modelo e controles de
  host de execução ainda não são expostos como opções de configuração ACP.
- `session_info_update` e `usage_update` são derivados de snapshots de sessão do
  Gateway, não de contabilidade de runtime nativa de ACP em tempo real. O uso é
  aproximado, não inclui dados de custo e só é emitido quando o Gateway marca os
  dados totais de tokens como atualizados.
- Os dados de acompanhamento de ferramentas são de melhor esforço. A ponte pode
  expor caminhos de arquivos que aparecem em argumentos/resultados conhecidos de
  ferramentas, mas ainda não emite terminais ACP ou diffs estruturados de
  arquivos.

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

Use o cliente ACP integrado para verificar a sanidade da ponte sem uma IDE.
Ele inicia a ponte ACP e permite que você digite prompts interativamente.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permissões (modo de depuração do cliente):

- A aprovação automática é baseada em lista de permissões e se aplica apenas a IDs de ferramentas principais confiáveis.
- A aprovação automática de `read` é limitada ao diretório de trabalho atual (`--cwd` quando definido).
- O ACP só aprova automaticamente classes estreitas somente leitura: chamadas `read` com escopo sob o cwd ativo, além de ferramentas de pesquisa somente leitura (`search`, `web_search`, `memory_search`). Ferramentas desconhecidas/não principais, leituras fora do escopo, ferramentas capazes de executar comandos, ferramentas do plano de controle, ferramentas mutantes e fluxos interativos sempre exigem aprovação explícita do prompt.
- `toolCall.kind` fornecido pelo servidor é tratado como metadado não confiável (não como fonte de autorização).
- Esta política da ponte ACP é separada das permissões do harness ACPX. Se você executar o OpenClaw por meio do backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` será o botão de emergência "yolo" para essa sessão de harness.

## Como usar isto

Use ACP quando uma IDE (ou outro cliente) falar Agent Client Protocol e você
quiser que ela conduza uma sessão do OpenClaw Gateway.

1. Garanta que o Gateway esteja em execução (local ou remoto).
2. Configure o destino do Gateway (configuração ou flags).
3. Aponte sua IDE para executar `openclaw acp` por stdio.

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

O ACP não escolhe agentes diretamente. Ele roteia pela chave de sessão do
Gateway.

Use chaves de sessão com escopo de agente para direcionar a um agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sessão ACP mapeia para uma única chave de sessão do Gateway. Um agente pode
ter muitas sessões; por padrão, o ACP usa uma sessão isolada `acp:<uuid>`, a
menos que você substitua a chave ou o rótulo.

`mcpServers` por sessão não são compatíveis no modo de ponte. Se um cliente ACP
os enviar durante `newSession` ou `loadSession`, a ponte retorna um erro claro
em vez de ignorá-los silenciosamente.

Se você quiser que sessões apoiadas por ACPX vejam ferramentas de Plugin do
OpenClaw ou ferramentas integradas selecionadas, como `cron`, habilite as pontes
ACPX MCP no lado do gateway em vez de tentar passar `mcpServers` por sessão. Veja
[agentes ACP](/pt-BR/tools/acp-agents-setup#plugin-tools-mcp-bridge) e
[ponte MCP de ferramentas do OpenClaw](/pt-BR/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Usar a partir de `acpx` (Codex, Claude, outros clientes ACP)

Se você quiser que um agente de codificação, como Codex ou Claude Code, converse
com seu bot OpenClaw por ACP, use `acpx` com seu destino `openclaw` integrado.

Fluxo típico:

1. Execute o Gateway e garanta que a ponte ACP consiga alcançá-lo.
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

Se você quiser que `acpx openclaw` direcione sempre para uma chave de Gateway e
sessão específica, substitua o comando do agente `openclaw` em
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

Para um checkout local do repositório OpenClaw, use o ponto de entrada direto da
CLI em vez do executor de desenvolvimento para que o stream ACP permaneça limpo.
Por exemplo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta é a forma mais fácil de permitir que Codex, Claude Code ou outro cliente
compatível com ACP extraia informações contextuais de um agente OpenClaw sem
raspar um terminal.

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

No Zed, abra o painel de Agente e selecione "OpenClaw ACP" para iniciar uma conversa.

## Mapeamento de sessões

Por padrão, sessões ACP recebem uma chave de sessão isolada do Gateway com um prefixo `acp:`.
Para reutilizar uma sessão conhecida, passe uma chave ou rótulo de sessão:

- `--session <key>`: use uma chave de sessão específica do Gateway.
- `--session-label <label>`: resolva uma sessão existente por rótulo.
- `--reset-session`: gere um novo ID de sessão para essa chave (mesma chave, nova transcrição).

Se seu cliente ACP oferece suporte a metadados, você pode substituir por sessão:

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
- `--token-file <path>`: leia o token de autenticação do Gateway a partir de um arquivo.
- `--password <password>`: senha de autenticação do Gateway.
- `--password-file <path>`: leia a senha de autenticação do Gateway a partir de um arquivo.
- `--session <key>`: chave de sessão padrão.
- `--session-label <label>`: rótulo de sessão padrão a resolver.
- `--require-existing`: falha se a chave/rótulo de sessão não existir.
- `--reset-session`: redefine a chave de sessão antes do primeiro uso.
- `--no-prefix-cwd`: não prefixe prompts com o diretório de trabalho.
- `--provenance <off|meta|meta+receipt>`: inclua metadados ou recibos de proveniência ACP.
- `--verbose, -v`: registro detalhado em stderr.

Observação de segurança:

- `--token` e `--password` podem ficar visíveis em listagens de processos locais em alguns sistemas.
- Prefira `--token-file`/`--password-file` ou variáveis de ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- A resolução de autenticação do Gateway segue o contrato compartilhado usado por outros clientes do Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback `gateway.remote.*` somente quando `gateway.auth.*` não está definido (SecretRefs locais configuradas, mas não resolvidas, falham de forma segura)
  - modo remoto: `gateway.remote.*` com fallback de env/config conforme as regras de precedência remota
  - `--url` é seguro para substituição e não reutiliza credenciais implícitas de config/env; passe `--token`/`--password` explícitos (ou variantes de arquivo)
- Processos filhos de backend de runtime ACP recebem `OPENCLAW_SHELL=acp`, que pode ser usado para regras de shell/perfil específicas de contexto.
- `openclaw acp client` define `OPENCLAW_SHELL=acp-client` no processo de ponte gerado.

### Opções de `acp client`

- `--cwd <dir>`: diretório de trabalho para a sessão ACP.
- `--server <command>`: comando do servidor ACP (padrão: `openclaw`).
- `--server-args <args...>`: argumentos extras passados para o servidor ACP.
- `--server-verbose`: habilite registro detalhado no servidor ACP.
- `--verbose, -v`: registro detalhado do cliente.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Agentes ACP](/pt-BR/tools/acp-agents)
