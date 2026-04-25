---
read_when:
    - Conectando o Codex, Claude Code ou outro cliente MCP a canais com OpenClaw como backend
    - Executando `openclaw mcp serve`
    - Gerenciando definições salvas de servidores MCP no OpenClaw
summary: Expor conversas de canal do OpenClaw por MCP e gerenciar definições salvas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-04-25T13:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca2a76d1dbca71b4048659c21ac7ff98a01cc6095f6baad67df5347f45cd32e6
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` tem dois trabalhos:

- executar o OpenClaw como um servidor MCP com `openclaw mcp serve`
- gerenciar definições de servidores MCP de saída pertencentes ao OpenClaw com `list`, `show`,
  `set` e `unset`

Em outras palavras:

- `serve` é o OpenClaw atuando como servidor MCP
- `list` / `show` / `set` / `unset` é o OpenClaw atuando como um registro do lado do cliente MCP
  para outros servidores MCP que seus runtimes podem consumir depois

Use [`openclaw acp`](/pt-BR/cli/acp) quando o OpenClaw deve hospedar uma sessão
do harness de programação por conta própria e rotear esse runtime por ACP.

## OpenClaw como servidor MCP

Este é o caminho `openclaw mcp serve`.

## Quando usar `serve`

Use `openclaw mcp serve` quando:

- Codex, Claude Code ou outro cliente MCP deve se comunicar diretamente com
  conversas de canal com OpenClaw como backend
- você já tem um Gateway OpenClaw local ou remoto com sessões roteadas
- você quer um único servidor MCP que funcione entre os backends de canal do OpenClaw em vez
  de executar bridges separadas por canal

Use [`openclaw acp`](/pt-BR/cli/acp) em vez disso quando o OpenClaw deve hospedar o
runtime de programação por conta própria e manter a sessão do agente dentro do OpenClaw.

## Como funciona

`openclaw mcp serve` inicia um servidor MCP por stdio. O cliente MCP controla esse
processo. Enquanto o cliente mantiver a sessão stdio aberta, a bridge se conecta a um
Gateway OpenClaw local ou remoto por WebSocket e expõe conversas de canal roteadas
por MCP.

Ciclo de vida:

1. o cliente MCP inicia `openclaw mcp serve`
2. a bridge se conecta ao Gateway
3. sessões roteadas tornam-se conversas MCP e ferramentas de transcrição/histórico
4. eventos em tempo real são colocados em fila na memória enquanto a bridge está conectada
5. se o modo de canal Claude estiver habilitado, a mesma sessão também pode receber
   notificações push específicas do Claude

Comportamento importante:

- o estado da fila em tempo real começa quando a bridge se conecta
- o histórico mais antigo da transcrição é lido com `messages_read`
- notificações push do Claude só existem enquanto a sessão MCP estiver ativa
- quando o cliente desconecta, a bridge é encerrada e a fila em tempo real se perde
- pontos de entrada de agente one-shot, como `openclaw agent` e
  `openclaw infer model run`, encerram qualquer runtime MCP empacotado que abrirem quando a
  resposta é concluída, para que execuções repetidas por script não acumulem processos
  filhos stdio MCP
- servidores stdio MCP iniciados pelo OpenClaw (empacotados ou configurados pelo usuário) são encerrados
  como uma árvore de processos no desligamento, para que subprocessos filhos iniciados pelo
  servidor não sobrevivam depois que o cliente stdio pai sair
- excluir ou redefinir uma sessão descarta os clientes MCP dessa sessão pelo
  caminho compartilhado de limpeza de runtime, para que não existam conexões stdio remanescentes
  vinculadas a uma sessão removida

## Escolha um modo de cliente

Use a mesma bridge de duas maneiras diferentes:

- Clientes MCP genéricos: apenas ferramentas MCP padrão. Use `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` e as
  ferramentas de aprovação.
- Claude Code: ferramentas MCP padrão mais o adaptador de canal específico do Claude.
  Habilite `--claude-channel-mode on` ou mantenha o padrão `auto`.

Hoje, `auto` se comporta da mesma forma que `on`. Ainda não há detecção de
capacidade do cliente.

## O que `serve` expõe

A bridge usa metadados existentes de rota de sessão do Gateway para expor
conversas com canal como backend. Uma conversa aparece quando o OpenClaw já tem estado
de sessão com uma rota conhecida, como:

- `channel`
- metadados de destinatário ou destino
- `accountId` opcional
- `threadId` opcional

Isso dá aos clientes MCP um lugar único para:

- listar conversas roteadas recentes
- ler o histórico recente da transcrição
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

# Habilitar logs detalhados da bridge
openclaw mcp serve --verbose

# Desabilitar notificações push específicas do Claude
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

Lista conversas recentes com sessão como backend que já têm metadados de rota no
estado da sessão do Gateway.

Filtros úteis:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Retorna uma conversa por `session_key`.

### `messages_read`

Lê mensagens recentes da transcrição para uma conversa com sessão como backend.

### `attachments_fetch`

Extrai blocos de conteúdo de mensagem não textual de uma mensagem da transcrição. Esta é uma
visualização de metadados sobre o conteúdo da transcrição, não um armazenamento de blobs de anexo
durável e independente.

### `events_poll`

Lê eventos em tempo real enfileirados desde um cursor numérico.

### `events_wait`

Faz long-polling até que o próximo evento enfileirado correspondente chegue ou o tempo limite expire.

Use isso quando um cliente MCP genérico precisar de entrega quase em tempo real sem um
protocolo push específico do Claude.

### `messages_send`

Envia texto de volta pela mesma rota já registrada na sessão.

Comportamento atual:

- exige uma rota de conversa existente
- usa o canal, destinatário, ID de conta e ID de thread da sessão
- envia apenas texto

### `permissions_list_open`

Lista solicitações pendentes de aprovação exec/plugin que a bridge observou desde que se
conectou ao Gateway.

### `permissions_respond`

Resolve uma solicitação pendente de aprovação exec/plugin com:

- `allow-once`
- `allow-always`
- `deny`

## Modelo de eventos

A bridge mantém uma fila de eventos em memória enquanto está conectada.

Tipos de evento atuais:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Limites importantes:

- a fila é somente em tempo real; ela começa quando a bridge MCP inicia
- `events_poll` e `events_wait` não reproduzem o histórico mais antigo do Gateway
  por conta própria
- backlog durável deve ser lido com `messages_read`

## Notificações de canal Claude

A bridge também pode expor notificações de canal específicas do Claude. Este é o
equivalente no OpenClaw de um adaptador de canal do Claude Code: ferramentas MCP padrão continuam
disponíveis, mas mensagens recebidas em tempo real também podem chegar como notificações MCP
específicas do Claude.

Flags:

- `--claude-channel-mode off`: apenas ferramentas MCP padrão
- `--claude-channel-mode on`: habilita notificações de canal do Claude
- `--claude-channel-mode auto`: padrão atual; mesmo comportamento de bridge que `on`

Quando o modo de canal Claude está habilitado, o servidor anuncia capacidades
experimentais do Claude e pode emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento atual da bridge:

- mensagens de transcrição de entrada `user` são encaminhadas como
  `notifications/claude/channel`
- solicitações de permissão Claude recebidas por MCP são rastreadas em memória
- se a conversa vinculada depois enviar `yes abcde` ou `no abcde`, a bridge
  converte isso em `notifications/claude/channel/permission`
- essas notificações são somente de sessão em tempo real; se o cliente MCP desconectar,
  não haverá alvo de push

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

Para a maioria dos clientes MCP genéricos, comece com a superfície padrão de ferramentas e ignore
o modo Claude. Ative o modo Claude apenas para clientes que realmente entendem os
métodos de notificação específicos do Claude.

## Opções

`openclaw mcp serve` oferece suporte a:

- `--url <url>`: URL WebSocket do Gateway
- `--token <token>`: token do Gateway
- `--token-file <path>`: lê o token de um arquivo
- `--password <password>`: senha do Gateway
- `--password-file <path>`: lê a senha de um arquivo
- `--claude-channel-mode <auto|on|off>`: modo de notificação do Claude
- `-v`, `--verbose`: logs detalhados no stderr

Prefira `--token-file` ou `--password-file` em vez de segredos inline sempre que possível.

## Segurança e limite de confiança

A bridge não inventa roteamento. Ela apenas expõe conversas que o Gateway
já sabe como rotear.

Isso significa:

- listas de permissão de remetentes, pareamento e confiança no nível do canal ainda pertencem à
  configuração de canal subjacente do OpenClaw
- `messages_send` só pode responder por uma rota armazenada existente
- o estado de aprovação é somente em tempo real/em memória para a sessão atual da bridge
- a autenticação da bridge deve usar os mesmos controles de token ou senha do Gateway que você
  confiaria para qualquer outro cliente remoto do Gateway

Se uma conversa estiver ausente em `conversations_list`, a causa usual não é
a configuração de MCP. É a ausência ou incompletude de metadados de rota na
sessão subjacente do Gateway.

## Testes

O OpenClaw inclui um smoke determinístico em Docker para esta bridge:

```bash
pnpm test:docker:mcp-channels
```

Esse smoke:

- inicia um contêiner Gateway semeado
- inicia um segundo contêiner que executa `openclaw mcp serve`
- verifica descoberta de conversa, leituras de transcrição, leituras de metadados de anexo,
  comportamento da fila de eventos em tempo real e roteamento de envio de saída
- valida notificações de canal e permissão no estilo Claude pela bridge stdio MCP real

Esta é a forma mais rápida de provar que a bridge funciona sem conectar uma conta real do
Telegram, Discord ou iMessage à execução de teste.

Para um contexto de testes mais amplo, consulte [Testes](/pt-BR/help/testing).

## Solução de problemas

### Nenhuma conversa retornada

Normalmente significa que a sessão do Gateway ainda não é roteável. Confirme que a
sessão subjacente tem armazenados o canal/provedor, o destinatário e os metadados opcionais
de rota de conta/thread.

### `events_poll` ou `events_wait` não captura mensagens antigas

Esperado. A fila em tempo real começa quando a bridge se conecta. Leia o histórico
mais antigo da transcrição com `messages_read`.

### Notificações Claude não aparecem

Verifique tudo isso:

- o cliente manteve a sessão stdio MCP aberta
- `--claude-channel-mode` está em `on` ou `auto`
- o cliente realmente entende os métodos de notificação específicos do Claude
- a mensagem recebida aconteceu depois que a bridge se conectou

### Aprovações ausentes

`permissions_list_open` mostra apenas solicitações de aprovação observadas enquanto a bridge
estava conectada. Não é uma API de histórico durável de aprovações.

## OpenClaw como registro de cliente MCP

Este é o caminho `openclaw mcp list`, `show`, `set` e `unset`.

Esses comandos não expõem o OpenClaw por MCP. Eles gerenciam definições de servidores MCP
pertencentes ao OpenClaw em `mcp.servers` na configuração do OpenClaw.

Essas definições salvas são para runtimes que o OpenClaw inicia ou configura
depois, como Pi embutido e outros adaptadores de runtime. O OpenClaw armazena as
definições de forma centralizada para que esses runtimes não precisem manter suas próprias listas
duplicadas de servidores MCP.

Comportamento importante:

- esses comandos apenas leem ou gravam a configuração do OpenClaw
- eles não se conectam ao servidor MCP de destino
- eles não validam se o comando, URL ou transporte remoto está
  acessível neste momento
- os adaptadores de runtime decidem quais formatos de transporte realmente oferecem suporte em
  tempo de execução
- o Pi embutido expõe ferramentas MCP configuradas nos perfis normais de ferramenta `coding` e `messaging`;
  `minimal` ainda as oculta, e `tools.deny: ["bundle-mcp"]`
  as desabilita explicitamente
- runtimes MCP empacotados com escopo de sessão são recolhidos após `mcp.sessionIdleTtlMs`
  milissegundos de inatividade (padrão de 10 minutos; defina `0` para desabilitar) e
  execuções one-shot embutidas os limpam ao fim da execução

## Definições salvas de servidor MCP

O OpenClaw também armazena um registro leve de servidores MCP na configuração para superfícies
que desejam definições MCP gerenciadas pelo OpenClaw.

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Observações:

- `list` ordena os nomes dos servidores.
- `show` sem um nome imprime o objeto completo de servidores MCP configurado.
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

| Campo                      | Descrição                            |
| -------------------------- | ------------------------------------ |
| `command`                  | Executável a ser iniciado (obrigatório) |
| `args`                     | Array de argumentos de linha de comando |
| `env`                      | Variáveis de ambiente extras         |
| `cwd` / `workingDirectory` | Diretório de trabalho do processo    |

#### Filtro de segurança de env do stdio

O OpenClaw rejeita chaves de env de inicialização de interpretador que podem alterar como um servidor stdio MCP é iniciado antes do primeiro RPC, mesmo que apareçam no bloco `env` de um servidor. As chaves bloqueadas incluem `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` e variáveis semelhantes de controle de runtime. A inicialização rejeita essas chaves com um erro de configuração para que não possam injetar um prelúdio implícito, trocar o interpretador ou habilitar um depurador contra o processo stdio. Variáveis normais de ambiente para credenciais, proxy e específicas do servidor (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizado etc.) não são afetadas.

Se o seu servidor MCP realmente precisar de uma das variáveis bloqueadas, defina-a no processo host do gateway em vez de em `env` do servidor stdio.

### Transporte SSE / HTTP

Conecta-se a um servidor MCP remoto por HTTP Server-Sent Events.

| Campo                 | Descrição                                                           |
| --------------------- | ------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS do servidor remoto (obrigatório)                  |
| `headers`             | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação) |
| `connectionTimeoutMs` | Tempo limite de conexão por servidor em ms (opcional)               |

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

Valores sensíveis em `url` (userinfo) e `headers` são redigidos em logs e na
saída de status.

### Transporte HTTP streamable

`streamable-http` é uma opção adicional de transporte ao lado de `sse` e `stdio`. Ele usa streaming HTTP para comunicação bidirecional com servidores MCP remotos.

| Campo                 | Descrição                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS do servidor remoto (obrigatório)                                        |
| `transport`           | Defina como `"streamable-http"` para selecionar este transporte; quando omitido, o OpenClaw usa `sse` |
| `headers`             | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação)     |
| `connectionTimeoutMs` | Tempo limite de conexão por servidor em ms (opcional)                                     |

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

Esses comandos gerenciam apenas a configuração salva. Eles não iniciam a bridge de canal,
não abrem uma sessão ativa de cliente MCP nem comprovam que o servidor de destino está acessível.

## Limites atuais

Esta página documenta a bridge conforme disponibilizada hoje.

Limites atuais:

- a descoberta de conversas depende de metadados existentes de rota de sessão do Gateway
- ainda não há protocolo push genérico além do adaptador específico do Claude
- ainda não há ferramentas de editar mensagem ou reagir
- o transporte HTTP/SSE/streamable-http se conecta a um único servidor remoto; ainda não há upstream multiplexado
- `permissions_list_open` inclui apenas aprovações observadas enquanto a bridge está
  conectada

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Plugins](/pt-BR/cli/plugins)
