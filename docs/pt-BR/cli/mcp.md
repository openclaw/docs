---
read_when:
    - Conectando o Codex, Claude Code ou outro cliente MCP a canais com suporte do OpenClaw
    - Executando `openclaw mcp serve`
    - Gerenciando definições de servidores MCP salvas no OpenClaw
summary: Expor conversas de canais do OpenClaw via MCP e gerenciar definições salvas de servidores MCP
title: mcp
x-i18n:
    generated_at: "2026-04-23T14:01:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9783d6270d5ab5526e0f52c72939a6a895d4a92da6193703337ef394655d27c
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` tem duas funções:

- executar o OpenClaw como um servidor MCP com `openclaw mcp serve`
- gerenciar definições de servidores MCP de saída de propriedade do OpenClaw com `list`, `show`,
  `set` e `unset`

Em outras palavras:

- `serve` é o OpenClaw atuando como um servidor MCP
- `list` / `show` / `set` / `unset` é o OpenClaw atuando como um registro no lado do cliente MCP
  para outros servidores MCP que seus runtimes poderão consumir depois

Use [`openclaw acp`](/pt-BR/cli/acp) quando o OpenClaw deve hospedar
uma sessão de harness de codificação por conta própria e rotear esse runtime por ACP.

## OpenClaw como um servidor MCP

Este é o caminho `openclaw mcp serve`.

## Quando usar `serve`

Use `openclaw mcp serve` quando:

- Codex, Claude Code ou outro cliente MCP deve falar diretamente com
  conversas de canais com suporte do OpenClaw
- você já tem um Gateway local ou remoto do OpenClaw com sessões roteadas
- você quer um único servidor MCP que funcione nos backends de canal do OpenClaw
  em vez de executar bridges separadas por canal

Use [`openclaw acp`](/pt-BR/cli/acp) em vez disso quando o OpenClaw deve hospedar o
runtime de codificação por conta própria e manter a sessão do agente dentro do OpenClaw.

## Como funciona

`openclaw mcp serve` inicia um servidor MCP via stdio. O cliente MCP é dono desse
processo. Enquanto o cliente mantiver a sessão stdio aberta, a bridge se conecta a um
Gateway local ou remoto do OpenClaw por WebSocket e expõe conversas de canais roteados
via MCP.

Ciclo de vida:

1. o cliente MCP inicia `openclaw mcp serve`
2. a bridge se conecta ao Gateway
3. sessões roteadas se tornam conversas MCP e ferramentas de transcrição/histórico
4. eventos ao vivo são enfileirados na memória enquanto a bridge está conectada
5. se o modo de canal do Claude estiver ativado, a mesma sessão também pode receber
   notificações push específicas do Claude

Comportamento importante:

- o estado da fila ao vivo começa quando a bridge se conecta
- o histórico de transcrição mais antigo é lido com `messages_read`
- notificações push do Claude só existem enquanto a sessão MCP estiver ativa
- quando o cliente se desconecta, a bridge é encerrada e a fila ao vivo desaparece
- servidores MCP via stdio iniciados pelo OpenClaw (integrados ou configurados pelo usuário) são
  encerrados como uma árvore de processos no desligamento, então subprocessos filhos iniciados pelo
  servidor não sobrevivem após a saída do cliente stdio pai
- excluir ou redefinir uma sessão descarta os clientes MCP dessa sessão por meio
  do caminho compartilhado de limpeza do runtime, então não há conexões stdio remanescentes
  vinculadas a uma sessão removida

## Escolha um modo de cliente

Use a mesma bridge de duas maneiras diferentes:

- Clientes MCP genéricos: apenas ferramentas MCP padrão. Use `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` e as
  ferramentas de aprovação.
- Claude Code: ferramentas MCP padrão mais o adaptador de canal específico do Claude.
  Ative `--claude-channel-mode on` ou deixe o padrão `auto`.

Hoje, `auto` se comporta da mesma forma que `on`. Ainda não há detecção de
capacidade do cliente.

## O que `serve` expõe

A bridge usa metadados de rota de sessão existentes do Gateway para expor
conversas com suporte de canal. Uma conversa aparece quando o OpenClaw já tem estado
de sessão com uma rota conhecida, como:

- `channel`
- metadados de destinatário ou destino
- `accountId` opcional
- `threadId` opcional

Isso dá aos clientes MCP um único lugar para:

- listar conversas roteadas recentes
- ler histórico recente da transcrição
- aguardar novos eventos de entrada
- enviar uma resposta de volta pela mesma rota
- ver solicitações de aprovação que chegam enquanto a bridge está conectada

## Uso

```bash
# Gateway local
openclaw mcp serve

# Gateway remoto
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway remoto com autenticação por senha
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Ativar logs detalhados da bridge
openclaw mcp serve --verbose

# Desativar notificações push específicas do Claude
openclaw mcp serve --claude-channel-mode off
```

## Ferramentas da bridge

A bridge atual expõe estas ferramentas MCP:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Lista conversas recentes com suporte de sessão que já têm metadados de rota no
estado de sessão do Gateway.

Filtros úteis:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Retorna uma conversa por `session_key`.

### `messages_read`

Lê mensagens recentes da transcrição para uma conversa com suporte de sessão.

### `attachments_fetch`

Extrai blocos de conteúdo de mensagem que não são texto de uma mensagem da transcrição. Esta é uma
visão de metadados sobre o conteúdo da transcrição, não um armazenamento independente e durável
de blobs de anexos.

### `events_poll`

Lê eventos ao vivo enfileirados desde um cursor numérico.

### `events_wait`

Faz long-poll até que o próximo evento enfileirado correspondente chegue ou um tempo limite expire.

Use isto quando um cliente MCP genérico precisar de entrega quase em tempo real sem um
protocolo push específico do Claude.

### `messages_send`

Envia texto de volta pela mesma rota já registrada na sessão.

Comportamento atual:

- exige uma rota de conversa existente
- usa o canal, destinatário, id da conta e id da thread da sessão
- envia apenas texto

### `permissions_list_open`

Lista solicitações pendentes de aprovação de exec/Plugin que a bridge observou desde que
se conectou ao Gateway.

### `permissions_respond`

Resolve uma solicitação pendente de aprovação de exec/Plugin com:

- `allow-once`
- `allow-always`
- `deny`

## Modelo de evento

A bridge mantém uma fila de eventos em memória enquanto está conectada.

Tipos de evento atuais:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Limites importantes:

- a fila é apenas ao vivo; ela começa quando a bridge MCP é iniciada
- `events_poll` e `events_wait` não reproduzem sozinhos histórico mais antigo do Gateway
- backlog durável deve ser lido com `messages_read`

## Notificações de canal do Claude

A bridge também pode expor notificações de canal específicas do Claude. Este é o
equivalente do OpenClaw a um adaptador de canal do Claude Code: as ferramentas MCP padrão continuam
disponíveis, mas mensagens de entrada ao vivo também podem chegar como notificações MCP específicas do Claude.

Flags:

- `--claude-channel-mode off`: apenas ferramentas MCP padrão
- `--claude-channel-mode on`: ativa notificações de canal do Claude
- `--claude-channel-mode auto`: padrão atual; mesmo comportamento de bridge que `on`

Quando o modo de canal do Claude está ativado, o servidor anuncia capacidades
experimentais do Claude e pode emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento atual da bridge:

- mensagens de transcrição `user` de entrada são encaminhadas como
  `notifications/claude/channel`
- solicitações de permissão do Claude recebidas por MCP são rastreadas na memória
- se a conversa vinculada depois enviar `yes abcde` ou `no abcde`, a bridge
  converte isso em `notifications/claude/channel/permission`
- essas notificações existem apenas na sessão ao vivo; se o cliente MCP se desconectar,
  não há destino push

Isso é intencionalmente específico do cliente. Clientes MCP genéricos devem contar com as
ferramentas padrão de polling.

## Configuração do cliente MCP

Exemplo de configuração de cliente stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Para a maioria dos clientes MCP genéricos, comece com a superfície de ferramentas padrão e ignore
o modo Claude. Ative o modo Claude apenas para clientes que realmente entendam os
métodos de notificação específicos do Claude.

## Opções

`openclaw mcp serve` aceita:

- `--url <url>`: URL WebSocket do Gateway
- `--token <token>`: token do Gateway
- `--token-file <path>`: lê o token de um arquivo
- `--password <password>`: senha do Gateway
- `--password-file <path>`: lê a senha de um arquivo
- `--claude-channel-mode <auto|on|off>`: modo de notificação do Claude
- `-v`, `--verbose`: logs detalhados em stderr

Prefira `--token-file` ou `--password-file` em vez de segredos inline quando possível.

## Segurança e limite de confiança

A bridge não inventa roteamento. Ela apenas expõe conversas que o Gateway
já sabe como rotear.

Isso significa que:

- allowlists de remetente, pareamento e confiança no nível do canal ainda pertencem
  à configuração subjacente do canal no OpenClaw
- `messages_send` só pode responder por uma rota armazenada existente
- o estado de aprovação é apenas ao vivo/em memória para a sessão atual da bridge
- a autenticação da bridge deve usar os mesmos controles de token ou senha do Gateway em que você
  confiaria para qualquer outro cliente remoto do Gateway

Se uma conversa estiver ausente em `conversations_list`, a causa usual não é
a configuração do MCP. É a ausência ou incompletude dos metadados de rota na
sessão subjacente do Gateway.

## Testes

O OpenClaw inclui um smoke determinístico em Docker para esta bridge:

```bash
pnpm test:docker:mcp-channels
```

Esse smoke:

- inicia um contêiner do Gateway com seed
- inicia um segundo contêiner que executa `openclaw mcp serve`
- verifica descoberta de conversa, leituras de transcrição, leituras de metadados de anexos,
  comportamento da fila de eventos ao vivo e roteamento de envio de saída
- valida notificações de canal e permissão no estilo Claude sobre a bridge MCP real via stdio

Esta é a forma mais rápida de provar que a bridge funciona sem conectar uma conta real de
Telegram, Discord ou iMessage à execução de teste.

Para contexto mais amplo de testes, veja [Testing](/pt-BR/help/testing).

## Solução de problemas

### Nenhuma conversa retornada

Geralmente significa que a sessão do Gateway ainda não é roteável. Confirme que a
sessão subjacente tem canal/provedor armazenado, destinatário e metadados opcionais
de rota de conta/thread.

### `events_poll` ou `events_wait` não encontram mensagens mais antigas

Esperado. A fila ao vivo começa quando a bridge se conecta. Leia o histórico
mais antigo da transcrição com `messages_read`.

### Notificações do Claude não aparecem

Verifique tudo isto:

- o cliente manteve a sessão stdio MCP aberta
- `--claude-channel-mode` está em `on` ou `auto`
- o cliente realmente entende os métodos de notificação específicos do Claude
- a mensagem de entrada aconteceu depois que a bridge se conectou

### Aprovações ausentes

`permissions_list_open` mostra apenas solicitações de aprovação observadas enquanto a bridge
estava conectada. Não é uma API durável de histórico de aprovações.

## OpenClaw como registro de cliente MCP

Este é o caminho `openclaw mcp list`, `show`, `set` e `unset`.

Esses comandos não expõem o OpenClaw via MCP. Eles gerenciam definições de servidores MCP
de propriedade do OpenClaw em `mcp.servers` na configuração do OpenClaw.

Essas definições salvas são para runtimes que o OpenClaw inicia ou configura
depois, como o Pi integrado e outros adaptadores de runtime. O OpenClaw armazena as
definições de forma centralizada para que esses runtimes não precisem manter suas próprias listas
duplicadas de servidores MCP.

Comportamento importante:

- esses comandos apenas leem ou gravam a configuração do OpenClaw
- eles não se conectam ao servidor MCP de destino
- eles não validam se o comando, a URL ou o transporte remoto estão
  acessíveis agora
- adaptadores de runtime decidem quais formatos de transporte eles realmente oferecem suporte no
  momento da execução
- o Pi integrado expõe ferramentas MCP configuradas nos perfis normais de ferramentas `coding` e `messaging`;
  `minimal` ainda as oculta, e `tools.deny: ["bundle-mcp"]` as desativa explicitamente

## Definições salvas de servidores MCP

O OpenClaw também armazena um registro leve de servidores MCP na configuração para superfícies
que querem definições MCP gerenciadas pelo OpenClaw.

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Observações:

- `list` ordena os nomes dos servidores.
- `show` sem um nome imprime o objeto completo configurado de servidores MCP.
- `set` espera um valor de objeto JSON na linha de comando.
- `unset` falha se o servidor nomeado não existir.

Exemplos:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Exemplo de formato de configuração:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Transporte stdio

Inicia um processo filho local e se comunica por stdin/stdout.

| Field                      | Description                              |
| -------------------------- | ---------------------------------------- |
| `command`                  | Executável a ser iniciado (obrigatório)  |
| `args`                     | Array de argumentos de linha de comando  |
| `env`                      | Variáveis de ambiente extras             |
| `cwd` / `workingDirectory` | Diretório de trabalho do processo        |

#### Filtro de segurança de env do stdio

O OpenClaw rejeita chaves de env de inicialização do interpretador que podem alterar como um servidor MCP via stdio é iniciado antes do primeiro RPC, mesmo que apareçam no bloco `env` de um servidor. As chaves bloqueadas incluem `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` e variáveis semelhantes de controle de runtime. A inicialização rejeita essas chaves com um erro de configuração para que elas não possam injetar um prelúdio implícito, trocar o interpretador ou ativar um depurador contra o processo stdio. Variáveis comuns de credencial, proxy e específicas do servidor (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizados etc.) não são afetadas.

Se o seu servidor MCP realmente precisar de uma dessas variáveis bloqueadas, defina-a no processo do host do Gateway em vez de no `env` do servidor stdio.

### Transporte SSE / HTTP

Conecta-se a um servidor MCP remoto por HTTP Server-Sent Events.

| Field                 | Description                                                           |
| --------------------- | --------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS do servidor remoto (obrigatório)                    |
| `headers`             | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação) |
| `connectionTimeoutMs` | Tempo limite de conexão por servidor em ms (opcional)                 |

Exemplo:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Valores sensíveis em `url` (userinfo) e `headers` são ocultados em logs e
na saída de status.

### Transporte HTTP streamable

`streamable-http` é uma opção adicional de transporte junto com `sse` e `stdio`. Ele usa streaming HTTP para comunicação bidirecional com servidores MCP remotos.

| Field                 | Description                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `url`                 | URL HTTP ou HTTPS do servidor remoto (obrigatório)                                         |
| `transport`           | Defina como `"streamable-http"` para selecionar esse transporte; quando omitido, o OpenClaw usa `sse` |
| `headers`             | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação)      |
| `connectionTimeoutMs` | Tempo limite de conexão por servidor em ms (opcional)                                      |

Exemplo:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Esses comandos gerenciam apenas a configuração salva. Eles não iniciam a bridge do canal,
não abrem uma sessão ativa de cliente MCP nem comprovam que o servidor de destino está acessível.

## Limites atuais

Esta página documenta a bridge como ela é distribuída hoje.

Limites atuais:

- a descoberta de conversas depende de metadados de rota de sessão já existentes no Gateway
- não há protocolo push genérico além do adaptador específico do Claude
- ainda não há ferramentas para editar mensagens ou reagir
- o transporte HTTP/SSE/streamable-http se conecta a um único servidor remoto; ainda não há upstream multiplexado
- `permissions_list_open` inclui apenas aprovações observadas enquanto a bridge está
  conectada
