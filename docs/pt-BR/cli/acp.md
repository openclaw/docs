---
read_when:
    - Configurar integrações de IDE baseadas em ACP
    - Depurar o roteamento de sessão do ACP para o Gateway
summary: Executar a ponte ACP para integrações de IDE
title: ACP
x-i18n:
    generated_at: "2026-04-24T05:43:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

Execute a ponte [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que se comunica com um Gateway do OpenClaw.

Este comando fala ACP por stdio para IDEs e encaminha prompts para o Gateway
por WebSocket. Ele mantém sessões ACP mapeadas para chaves de sessão do Gateway.

`openclaw acp` é uma ponte ACP com suporte do Gateway, não um runtime de editor
totalmente nativo em ACP. Ele se concentra em roteamento de sessão, entrega de
prompts e atualizações básicas de streaming.

Se você quiser que um cliente MCP externo se comunique diretamente com conversas
de canal do OpenClaw em vez de hospedar uma sessão de harness ACP, use
[`openclaw mcp serve`](/pt-BR/cli/mcp).

## O que isto não é

Esta página é frequentemente confundida com sessões de harness ACP.

`openclaw acp` significa:

- o OpenClaw atua como um servidor ACP
- uma IDE ou cliente ACP se conecta ao OpenClaw
- o OpenClaw encaminha esse trabalho para uma sessão do Gateway

Isso é diferente de [ACP Agents](/pt-BR/tools/acp-agents), em que o OpenClaw executa um
harness externo como Codex ou Claude Code por meio de `acpx`.

Regra rápida:

- editor/cliente quer falar ACP com o OpenClaw: use `openclaw acp`
- o OpenClaw deve iniciar Codex/Claude/Gemini como um harness ACP: use `/acp spawn` e [ACP Agents](/pt-BR/tools/acp-agents)

## Matriz de compatibilidade

| Área de ACP                                                           | Status        | Observações                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementado  | Fluxo principal da ponte por stdio para chat/send + abort do Gateway.                                                                                                                                                                          |
| `listSessions`, comandos slash                                        | Implementado  | A lista de sessões funciona com o estado de sessão do Gateway; os comandos são anunciados por `available_commands_update`.                                                                                                                    |
| `loadSession`                                                         | Parcial       | Reassocia a sessão ACP a uma chave de sessão do Gateway e reproduz o histórico armazenado de texto de usuário/assistente. O histórico de ferramenta/sistema ainda não é reconstruído.                                                         |
| Conteúdo do prompt (`text`, `resource` incorporado, imagens)          | Parcial       | Texto/recursos são achatados na entrada do chat; imagens se tornam anexos do Gateway.                                                                                                                                                          |
| Modos de sessão                                                       | Parcial       | `session/set_mode` é compatível e a ponte expõe controles iniciais de sessão com suporte do Gateway para nível de pensamento, verbosidade de ferramenta, raciocínio, detalhamento de uso e ações elevadas. Superfícies mais amplas de modo/config nativas em ACP ainda estão fora do escopo. |
| Informações da sessão e atualizações de uso                           | Parcial       | A ponte emite notificações `session_info_update` e `usage_update` por best-effort a partir de snapshots de sessão em cache do Gateway. O uso é aproximado e só é enviado quando os totais de tokens do Gateway são marcados como atualizados. |
| Streaming de ferramentas                                              | Parcial       | Eventos `tool_call` / `tool_call_update` incluem E/S bruta, conteúdo de texto e localizações de arquivos por best-effort quando args/resultados de ferramentas do Gateway os expõem. Terminais incorporados e saída mais rica nativa de diff ainda não são expostos. |
| Servidores MCP por sessão (`mcpServers`)                              | Não compatível | O modo ponte rejeita solicitações de servidor MCP por sessão. Configure o MCP no gateway ou agente do OpenClaw.                                                                                                                               |
| Métodos de sistema de arquivos do cliente (`fs/read_text_file`, `fs/write_text_file`) | Não compatível | A ponte não chama métodos de sistema de arquivos do cliente ACP.                                                                                                                                                                                |
| Métodos de terminal do cliente (`terminal/*`)                         | Não compatível | A ponte não cria terminais do cliente ACP nem transmite IDs de terminal por chamadas de ferramenta.                                                                                                                                            |
| Planos de sessão / streaming de pensamento                            | Não compatível | Atualmente, a ponte emite texto de saída e status de ferramenta, não atualizações de plano ou pensamento ACP.                                                                                                                                  |

## Limitações conhecidas

- `loadSession` reproduz o histórico armazenado de texto de usuário e assistente, mas não
  reconstrói chamadas históricas de ferramenta, avisos do sistema ou tipos de
  evento mais ricos nativos em ACP.
- Se vários clientes ACP compartilharem a mesma chave de sessão do Gateway, o roteamento
  de eventos e cancelamento será por best-effort, em vez de estritamente isolado
  por cliente. Prefira as sessões isoladas padrão `acp:<uuid>` quando precisar de
  turnos limpos e locais ao editor.
- Estados de parada do Gateway são traduzidos em motivos de parada ACP, mas esse mapeamento é
  menos expressivo do que um runtime totalmente nativo em ACP.
- Os controles iniciais de sessão atualmente expõem um subconjunto focado de opções do Gateway:
  nível de pensamento, verbosidade de ferramenta, raciocínio, detalhamento de uso e
  ações elevadas. A seleção de modelo e controles de host de execução ainda não são expostos como
  opções de configuração ACP.
- `session_info_update` e `usage_update` são derivados de snapshots de sessão do Gateway,
  não de contabilidade de runtime nativa em ACP ao vivo. O uso é aproximado,
  não inclui dados de custo e só é emitido quando o Gateway marca os dados totais de tokens
  como atualizados.
- Os dados de acompanhamento de ferramentas são por best-effort. A ponte pode expor caminhos de arquivo que
  aparecem em args/resultados de ferramentas conhecidos, mas ainda não emite terminais ACP nem
  diffs de arquivo estruturados.

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

Use o cliente ACP interno para verificar a ponte sem uma IDE.
Ele inicia a ponte ACP e permite digitar prompts interativamente.

```bash
openclaw acp client

# Apontar a ponte iniciada para um Gateway remoto
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Sobrescrever o comando do servidor (padrão: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permissões (modo de depuração do cliente):

- A aprovação automática é baseada em allowlist e se aplica apenas a IDs de ferramentas principais confiáveis.
- A aprovação automática de `read` é limitada ao diretório de trabalho atual (`--cwd` quando definido).
- ACP só aprova automaticamente classes estreitas somente leitura: chamadas `read` limitadas sob o cwd ativo mais ferramentas de busca somente leitura (`search`, `web_search`, `memory_search`). Ferramentas desconhecidas/não principais, leituras fora do escopo, ferramentas com capacidade de execução, ferramentas do plano de controle, ferramentas mutáveis e fluxos interativos sempre exigem aprovação explícita de prompt.
- `toolCall.kind` fornecido pelo servidor é tratado como metadado não confiável (não como fonte de autorização).
- Esta política da ponte ACP é separada das permissões do harness ACPX. Se você executar o OpenClaw por meio do backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` é o interruptor “yolo” de emergência para essa sessão de harness.

## Como usar isto

Use ACP quando uma IDE (ou outro cliente) falar Agent Client Protocol e você quiser
que ela conduza uma sessão do Gateway do OpenClaw.

1. Verifique se o Gateway está em execução (local ou remoto).
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
# preferido para segurança de processo local
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Selecionar agentes

ACP não escolhe agentes diretamente. Ele roteia pela chave de sessão do Gateway.

Use chaves de sessão com escopo de agente para direcionar a um agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sessão ACP é mapeada para uma única chave de sessão do Gateway. Um agente pode ter muitas
sessões; ACP usa por padrão uma sessão isolada `acp:<uuid>`, a menos que você sobrescreva
a chave ou o rótulo.

`mcpServers` por sessão não são compatíveis no modo ponte. Se um cliente ACP
os enviar durante `newSession` ou `loadSession`, a ponte retorna um erro claro
em vez de ignorá-los silenciosamente.

Se você quiser que sessões com suporte do ACPX vejam ferramentas de Plugin do OpenClaw ou
ferramentas internas selecionadas como `cron`, ative as pontes MCP ACPX do lado do gateway
em vez de tentar passar `mcpServers` por sessão. Consulte
[ACP Agents](/pt-BR/tools/acp-agents-setup#plugin-tools-mcp-bridge) e
[ponte MCP de ferramentas do OpenClaw](/pt-BR/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Usar a partir de `acpx` (Codex, Claude, outros clientes ACP)

Se você quiser que um agente de programação como Codex ou Claude Code fale com seu
bot OpenClaw por ACP, use `acpx` com seu alvo interno `openclaw`.

Fluxo típico:

1. Execute o Gateway e verifique se a ponte ACP consegue alcançá-lo.
2. Aponte `acpx openclaw` para `openclaw acp`.
3. Direcione para a chave de sessão do OpenClaw que você quer que o agente de programação use.

Exemplos:

```bash
# Solicitação única para sua sessão ACP padrão do OpenClaw
acpx openclaw exec "Summarize the active OpenClaw session state."

# Sessão nomeada persistente para turnos de acompanhamento
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Se você quiser que `acpx openclaw` direcione para um Gateway e chave de sessão específicos sempre,
sobrescreva o comando do agente `openclaw` em `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Para um checkout local do repositório OpenClaw, use o ponto de entrada direto da CLI em vez do
executor de desenvolvimento, para que o stream ACP permaneça limpo. Por exemplo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Esta é a maneira mais fácil de permitir que Codex, Claude Code ou outro cliente compatível com ACP
obtenha informações contextuais de um agente OpenClaw sem raspar um terminal.

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

No Zed, abra o painel Agent e selecione “OpenClaw ACP” para iniciar uma thread.

## Mapeamento de sessão

Por padrão, sessões ACP recebem uma chave de sessão isolada do Gateway com prefixo `acp:`.
Para reutilizar uma sessão conhecida, passe uma chave ou rótulo de sessão:

- `--session <key>`: usa uma chave de sessão específica do Gateway.
- `--session-label <label>`: resolve uma sessão existente por rótulo.
- `--reset-session`: gera um ID de sessão novo para essa chave (mesma chave, nova transcrição).

Se o seu cliente ACP oferecer suporte a metadados, você poderá sobrescrever por sessão:

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

- `--url <url>`: URL WebSocket do Gateway (usa `gateway.remote.url` por padrão quando configurado).
- `--token <token>`: token de autenticação do Gateway.
- `--token-file <path>`: lê o token de autenticação do Gateway de um arquivo.
- `--password <password>`: senha de autenticação do Gateway.
- `--password-file <path>`: lê a senha de autenticação do Gateway de um arquivo.
- `--session <key>`: chave de sessão padrão.
- `--session-label <label>`: rótulo de sessão padrão a ser resolvido.
- `--require-existing`: falha se a chave/rótulo de sessão não existir.
- `--reset-session`: redefine a chave de sessão antes do primeiro uso.
- `--no-prefix-cwd`: não prefixa prompts com o diretório de trabalho.
- `--provenance <off|meta|meta+receipt>`: inclui metadados de proveniência ACP ou recibos.
- `--verbose, -v`: logging detalhado em stderr.

Observação de segurança:

- `--token` e `--password` podem ficar visíveis em listagens locais de processos em alguns sistemas.
- Prefira `--token-file`/`--password-file` ou variáveis de ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- A resolução de autenticação do Gateway segue o contrato compartilhado usado por outros clientes do Gateway:
  - modo local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback para `gateway.remote.*` apenas quando `gateway.auth.*` não estiver definido (SecretRefs locais configurados, mas não resolvidos, falham em modo fail-closed)
  - modo remoto: `gateway.remote.*` com fallback de env/config conforme as regras de precedência remota
  - `--url` é seguro para sobrescrita e não reutiliza credenciais implícitas de config/env; passe `--token`/`--password` explícitos (ou variantes com arquivo)
- Processos-filho do backend de runtime ACP recebem `OPENCLAW_SHELL=acp`, que pode ser usado para regras específicas de contexto em shell/profile.
- `openclaw acp client` define `OPENCLAW_SHELL=acp-client` no processo da ponte iniciada.

### Opções de `acp client`

- `--cwd <dir>`: diretório de trabalho da sessão ACP.
- `--server <command>`: comando do servidor ACP (padrão: `openclaw`).
- `--server-args <args...>`: argumentos extras passados ao servidor ACP.
- `--server-verbose`: ativa logging detalhado no servidor ACP.
- `--verbose, -v`: logging detalhado do cliente.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [ACP Agents](/pt-BR/tools/acp-agents)
