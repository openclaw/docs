---
read_when:
    - Configurando integrações de IDE baseadas em ACP
    - Depuração do roteamento de sessões ACP para o Gateway
summary: Execute a ponte ACP para integrações com IDEs
title: ACP
x-i18n:
    generated_at: "2026-07-11T23:47:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Execute a ponte do [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) que se comunica com um Gateway do OpenClaw.

`openclaw acp` usa ACP por stdio para IDEs e encaminha prompts ao Gateway por WebSocket, mantendo as sessões ACP mapeadas para chaves de sessão do Gateway. É uma ponte ACP apoiada pelo Gateway, não um ambiente de execução de editor totalmente nativo de ACP: ela se concentra no roteamento de sessões, na entrega de prompts e nas atualizações por streaming.

Se você quiser que um cliente MCP externo se comunique diretamente com conversas de canais do OpenClaw em vez de hospedar uma sessão de ambiente ACP, use [`openclaw mcp serve`](/pt-BR/cli/mcp).

## O que isto não é

`openclaw acp` significa que o OpenClaw atua como um servidor ACP: uma IDE ou um cliente ACP se conecta ao OpenClaw, e o OpenClaw encaminha esse trabalho para uma sessão do Gateway.

Isso é diferente de [Agentes ACP](/pt-BR/tools/acp-agents), em que o OpenClaw executa um ambiente externo, como Codex ou Claude Code, por meio do `acpx`.

Regra rápida:

- o editor/cliente quer se comunicar via ACP com o OpenClaw: use `openclaw acp`
- o OpenClaw deve iniciar Codex/Claude/Gemini como um ambiente ACP: use `/acp spawn` e [Agentes ACP](/pt-BR/tools/acp-agents)

## Matriz de compatibilidade

| Área do ACP                                                            | Status          | Observações                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                         | Implementado    | Fluxo principal da ponte via stdio para chat/envio + cancelamento no Gateway.                                                                                                                                                                                      |
| `listSessions`, comandos com barra                                     | Implementado    | A lista de sessões funciona com o estado de sessões do Gateway, usando paginação limitada por cursor e filtragem por `cwd` quando as linhas de sessão do Gateway contêm metadados do espaço de trabalho; os comandos são anunciados via `available_commands_update`. |
| Metadados de linhagem da sessão                                        | Implementado    | As listagens e os instantâneos de informações das sessões incluem a linhagem pai e filha do OpenClaw em `_meta`, para que clientes ACP possam renderizar grafos de subagentes sem canais laterais privados do Gateway.                                               |
| `resumeSession`, `closeSession`                                        | Implementado    | A retomada vincula novamente uma sessão ACP a uma sessão existente do Gateway sem reproduzir o histórico. O fechamento cancela o trabalho ativo da ponte, resolve prompts pendentes como cancelados e libera o estado da sessão da ponte.                           |
| `loadSession`                                                          | Parcial         | Vincula novamente a sessão ACP a uma chave de sessão do Gateway e reproduz o histórico do registro de eventos ACP para sessões criadas pela ponte. Sessões antigas ou sem registro recorrem ao texto armazenado do usuário/assistente.                              |
| Conteúdo do prompt (`text`, `resource` incorporado, imagens)           | Parcial         | Texto/recursos são convertidos em entrada de chat; imagens tornam-se anexos do Gateway.                                                                                                                                                                            |
| Modos de sessão                                                        | Parcial         | Há suporte a `session/set_mode`; a ponte expõe controles de sessão apoiados pelo Gateway para nível de pensamento, detalhamento das ferramentas, raciocínio, detalhes de uso e ações elevadas. Superfícies mais amplas de modo/configuração nativas de ACP continuam fora do escopo. |
| Streaming de pensamento                                                | Implementado    | O conteúdo de pensamento do modelo é transmitido como atualizações de sessão `agent_thought_chunk`. Planos de sessão nativos de ACP não são emitidos.                                                                                                              |
| Informações da sessão e atualizações de uso                            | Parcial         | A ponte emite notificações `session_info_update` e `usage_update` com melhor esforço a partir de instantâneos armazenados em cache das sessões do Gateway. O uso é aproximado e só é enviado quando os totais de tokens do Gateway estão marcados como atuais.       |
| Streaming de ferramentas                                               | Parcial         | Os eventos `tool_call`/`tool_call_update` incluem E/S bruta, conteúdo textual e localizações de arquivos com melhor esforço quando os argumentos/resultados das ferramentas do Gateway as expõem. Terminais incorporados e saídas mais completas nativas de diff não são expostos. |
| Aprovações de execução                                                 | Parcial         | Solicitações de aprovação de execução do Gateway durante turnos ativos de prompt ACP são retransmitidas ao cliente ACP com `session/request_permission`.                                                                                                           |
| Servidores MCP por sessão (`mcpServers`)                               | Não compatível  | O modo de ponte rejeita solicitações de servidores MCP por sessão. Configure o MCP no Gateway ou no agente do OpenClaw.                                                                                                                                            |
| Métodos de sistema de arquivos do cliente (`fs/read_text_file`, `fs/write_text_file`) | Não compatível | A ponte não chama métodos de sistema de arquivos do cliente ACP.                                                                                                                                                                                                   |
| Métodos de terminal do cliente (`terminal/*`)                          | Não compatível  | A ponte não cria terminais no cliente ACP nem transmite IDs de terminal por meio de chamadas de ferramentas.                                                                                                                                                       |

## Limitações conhecidas

- `loadSession` reproduz o histórico completo do registro de eventos ACP apenas para sessões criadas pela ponte. Sessões antigas ou sem registro usam o histórico da conversa como alternativa e não reconstroem chamadas históricas de ferramentas nem avisos do sistema.
- Se vários clientes ACP compartilharem a mesma chave de sessão do Gateway, o roteamento de eventos e cancelamentos funciona com melhor esforço, em vez de ser estritamente isolado por cliente. Prefira as sessões isoladas padrão `acp-bridge:<uuid>` quando precisar de turnos locais do editor claramente separados.
- Os estados de parada do Gateway são convertidos em motivos de parada do ACP, mas esse mapeamento é menos expressivo do que o de um ambiente de execução totalmente nativo de ACP.
- Os controles de sessão apresentam um subconjunto específico das opções do Gateway: nível de pensamento, detalhamento das ferramentas, raciocínio, detalhes de uso e ações elevadas. A seleção de modelo e os controles do host de execução não são expostos como opções de configuração do ACP.
- `session_info_update` e `usage_update` são derivados de instantâneos das sessões do Gateway, não da contabilização em tempo real de um ambiente de execução nativo de ACP. O uso é aproximado, não inclui dados de custo e só é emitido quando o Gateway marca os dados totais de tokens como atuais.
- Os dados de acompanhamento das ferramentas funcionam com melhor esforço: a ponte apresenta caminhos de arquivos que aparecem em argumentos/resultados conhecidos das ferramentas, mas não emite terminais ACP nem diffs estruturados de arquivos.
- O retransmissão de aprovações de execução é limitada ao turno ativo do prompt ACP; aprovações de outras sessões do Gateway são ignoradas.

## Uso

```bash
openclaw acp

# Gateway remoto
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway remoto (token de arquivo)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Anexar a uma chave de sessão existente
openclaw acp --session agent:main:main

# Anexar por rótulo (deve existir previamente)
openclaw acp --session-label "support inbox"

# Redefinir a chave de sessão antes do primeiro prompt
openclaw acp --session agent:main:main --reset-session
```

## Cliente ACP (depuração)

Use o cliente ACP integrado para fazer uma verificação básica da ponte sem uma IDE. Ele inicia a ponte ACP e permite que você digite prompts interativamente.

```bash
openclaw acp client

# Direcionar a ponte iniciada para um Gateway remoto
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Substituir o comando do servidor (padrão: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modelo de permissões (modo de depuração do cliente):

- A aprovação automática é baseada em uma lista de permissões e se aplica somente a IDs confiáveis de ferramentas principais.
- A aprovação automática de `read` é limitada ao diretório de trabalho atual (`--cwd`, quando definido).
- O ACP aprova automaticamente apenas classes restritas somente leitura: chamadas `read` limitadas ao `cwd` ativo, além de ferramentas de pesquisa somente leitura (`search`, `web_search`, `memory_search`). Ferramentas desconhecidas ou não pertencentes ao núcleo, leituras fora do escopo, ferramentas capazes de executar comandos, ferramentas do plano de controle, ferramentas que realizam alterações e fluxos interativos sempre exigem aprovação explícita no prompt.
- O `toolCall.kind` fornecido pelo servidor é tratado como metadado não confiável, não como fonte de autorização.
- Esta política da ponte ACP é separada das permissões do ambiente ACPX. Se você executar o OpenClaw por meio do backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` será o interruptor emergencial "yolo" para essa sessão do ambiente.

## Teste de fumaça do protocolo

Para depuração no nível do protocolo, inicie um Gateway com estado isolado e controle `openclaw acp` via stdio com um cliente JSON-RPC ACP. Abranja `initialize`, `session/new`, `session/list` com um `cwd` absoluto, `session/resume`, `session/close`, fechamento duplicado e retomada inexistente.

A comprovação deve incluir os recursos de ciclo de vida anunciados, uma linha de sessão apoiada pelo Gateway, notificações de atualização e o log `sessions.list` do Gateway:

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

Evite usar `openclaw gateway call sessions.list` como a única comprovação do ACP. Esse caminho da CLI pode solicitar uma elevação de escopo do operador com token novo; a correção da ponte ACP é comprovada pelos quadros ACP via stdio junto com o log `sessions.list` do Gateway.

## Como usar

Use o ACP quando uma IDE (ou outro cliente) usar o Agent Client Protocol e você quiser que ela controle uma sessão do Gateway do OpenClaw.

1. Certifique-se de que o Gateway esteja em execução (local ou remoto).
2. Configure o destino do Gateway (configuração ou flags).
3. Configure sua IDE para executar `openclaw acp` via stdio.

Exemplo de configuração (persistente):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Exemplo de execução direta (sem gravar configuração):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferencial para a segurança do processo local
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Seleção de agentes

O ACP não seleciona agentes diretamente. Ele roteia pela chave de sessão do Gateway. Use chaves de sessão com escopo de agente para direcionar a um agente específico:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Cada sessão ACP é mapeada para uma única chave de sessão do Gateway. Um agente pode ter muitas sessões; por padrão, o ACP usa uma sessão isolada `acp-bridge:<uuid>`, a menos que você substitua a chave ou o rótulo.

`mcpServers` por sessão não são compatíveis com o modo de ponte. Se um cliente ACP os enviar durante `newSession` ou `loadSession`, a ponte retornará um erro claro em vez de ignorá-los silenciosamente.

Se você quiser que sessões baseadas em ACPX vejam ferramentas de plugins do OpenClaw ou ferramentas integradas selecionadas, como `cron`, habilite as pontes MCP do ACPX no lado do Gateway em vez de tentar passar `mcpServers` por sessão. Consulte [Agentes ACP](/pt-BR/tools/acp-agents-setup#plugin-tools-mcp-bridge) e [Ponte MCP de ferramentas do OpenClaw](/pt-BR/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Uso pelo `acpx` (Codex, Claude e outros clientes ACP)

Se você quiser que um agente de programação, como Codex ou Claude Code, se comunique com seu bot OpenClaw via ACP, use o `acpx` com seu destino `openclaw` integrado.

Fluxo típico:

1. Execute o Gateway e verifique se a ponte ACP consegue acessá-lo.
2. Direcione `acpx openclaw` para `openclaw acp`.
3. Defina como destino a chave de sessão do OpenClaw que você quer que o agente de programação use.

Exemplos:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Se você quiser que `acpx openclaw` sempre tenha como destino um Gateway e uma chave de sessão específicos, substitua o comando do agente `openclaw` em `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Para um checkout local do repositório do OpenClaw, use o ponto de entrada direto da CLI em vez do executor de desenvolvimento, para manter o fluxo ACP limpo:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Essa é a maneira mais fácil de permitir que Codex, Claude Code ou outro cliente compatível com ACP obtenha informações contextuais de um agente OpenClaw sem extrair dados de um terminal.

## Configuração do editor Zed

Adicione um agente ACP personalizado em `~/.config/zed/settings.json` (ou use a interface Settings do Zed):

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

Para definir como destino um Gateway ou agente específico:

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

## Mapeamento de sessões

Por padrão, as sessões da ponte ACP recebem uma chave de sessão isolada do Gateway com o prefixo `acp-bridge:`. Essas sessões de ponte de modelo normal são sintéticas e descartáveis: estão sujeitas à remoção de entradas obsoletas e não são tratadas como superfícies protegidas de conversas humanas. Para reutilizar uma sessão conhecida, passe uma chave ou um rótulo de sessão:

- `--session <key>`: usa uma chave de sessão específica do Gateway.
- `--session-label <label>`: resolve uma sessão existente pelo rótulo.
- `--reset-session`: gera um novo ID de sessão para essa chave (mesma chave, nova transcrição).

Se o seu cliente ACP for compatível com metadados, você poderá substituir essas configurações por sessão:

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

- `--url <url>`: URL WebSocket do Gateway (o padrão é `gateway.remote.url` quando configurado).
- `--token <token>`: token de autenticação do Gateway.
- `--token-file <path>`: lê o token de autenticação do Gateway de um arquivo.
- `--password <password>`: senha de autenticação do Gateway.
- `--password-file <path>`: lê a senha de autenticação do Gateway de um arquivo.
- `--session <key>`: chave de sessão padrão.
- `--session-label <label>`: rótulo de sessão padrão a ser resolvido.
- `--require-existing`: falha se a chave ou o rótulo da sessão não existir.
- `--reset-session`: redefine a chave da sessão antes do primeiro uso.
- `--no-prefix-cwd`: não adiciona o diretório de trabalho como prefixo aos prompts.
- `--provenance <off|meta|meta+receipt>`: inclui metadados ou recibos de proveniência do ACP.
- `--verbose, -v`: registro detalhado em stderr.

Observação de segurança:

- `--token` e `--password` podem ficar visíveis nas listas de processos locais em alguns sistemas. Prefira `--token-file`/`--password-file` ou variáveis de ambiente (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- A resolução da autenticação do Gateway segue o contrato compartilhado usado por outros clientes do Gateway:
  - modo local: variáveis de ambiente (`OPENCLAW_GATEWAY_*`) e depois `gateway.auth.*`, recorrendo a `gateway.remote.*` somente quando `gateway.auth.*` não estiver definido (uma SecretRef local configurada, mas não resolvida, falha de forma segura em vez de recorrer silenciosamente a outra opção)
  - modo remoto: `gateway.remote.*`, com fallback para variáveis de ambiente/configuração de acordo com as regras de precedência remota
  - `--url` é seguro para substituição e não reutiliza credenciais implícitas da configuração ou das variáveis de ambiente; passe `--token`/`--password` explicitamente (ou as variantes de arquivo)

### Opções de `acp client`

- `--cwd <dir>`: diretório de trabalho da sessão ACP.
- `--server <command>`: comando do servidor ACP (padrão: `openclaw`).
- `--server-args <args...>`: argumentos adicionais passados ao servidor ACP.
- `--server-verbose`: habilita o registro detalhado no servidor ACP.
- `--verbose, -v`: registro detalhado do cliente.
- `openclaw acp client` define `OPENCLAW_SHELL=acp-client` no processo da ponte iniciado, o que pode ser usado para regras de shell/perfil específicas do contexto.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Agentes ACP](/pt-BR/tools/acp-agents)
