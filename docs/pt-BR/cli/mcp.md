---
read_when:
    - Conectando Codex, Claude Code ou outro cliente MCP a canais com suporte do OpenClaw
    - Executando `openclaw mcp serve`
    - Gerenciando definições salvas de servidores MCP do OpenClaw
sidebarTitle: MCP
summary: Expor conversas de canais do OpenClaw por MCP e gerenciar definições salvas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-04-26T11:26:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` tem duas funções:

- executar o OpenClaw como um servidor MCP com `openclaw mcp serve`
- gerenciar definições de servidores MCP de saída pertencentes ao OpenClaw com `list`, `show`, `set` e `unset`

Em outras palavras:

- `serve` é o OpenClaw atuando como servidor MCP
- `list` / `show` / `set` / `unset` é o OpenClaw atuando como um registro do lado do cliente MCP para outros servidores MCP que seus runtimes podem consumir mais tarde

Use [`openclaw acp`](/pt-BR/cli/acp) quando o OpenClaw deve hospedar ele mesmo uma sessão de harness de codificação e rotear esse runtime por ACP.

## OpenClaw como servidor MCP

Este é o caminho `openclaw mcp serve`.

### Quando usar `serve`

Use `openclaw mcp serve` quando:

- Codex, Claude Code ou outro cliente MCP deve falar diretamente com conversas de canais com suporte do OpenClaw
- você já tem um Gateway OpenClaw local ou remoto com sessões roteadas
- você quer um único servidor MCP que funcione em todos os backends de canal do OpenClaw em vez de executar bridges separados por canal

Use [`openclaw acp`](/pt-BR/cli/acp) em vez disso quando o OpenClaw deve hospedar o próprio runtime de codificação e manter a sessão do agente dentro do OpenClaw.

### Como funciona

`openclaw mcp serve` inicia um servidor MCP stdio. O cliente MCP é dono desse processo. Enquanto o cliente mantiver a sessão stdio aberta, a bridge se conecta a um Gateway OpenClaw local ou remoto por WebSocket e expõe conversas de canais roteadas por MCP.

<Steps>
  <Step title="O cliente inicia a bridge">
    O cliente MCP inicia `openclaw mcp serve`.
  </Step>
  <Step title="A bridge se conecta ao Gateway">
    A bridge se conecta ao Gateway OpenClaw por WebSocket.
  </Step>
  <Step title="Sessões se tornam conversas MCP">
    Sessões roteadas se tornam conversas MCP e ferramentas de histórico/transcrição.
  </Step>
  <Step title="Fila de eventos ao vivo">
    Eventos ao vivo são enfileirados na memória enquanto a bridge está conectada.
  </Step>
  <Step title="Push opcional para Claude">
    Se o modo de canal Claude estiver ativado, a mesma sessão também poderá receber notificações push específicas do Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - o estado da fila ao vivo começa quando a bridge se conecta
    - o histórico de transcrição mais antigo é lido com `messages_read`
    - notificações push do Claude só existem enquanto a sessão MCP estiver ativa
    - quando o cliente se desconecta, a bridge é encerrada e a fila ao vivo desaparece
    - pontos de entrada de agente de execução única, como `openclaw agent` e `openclaw infer model run`, aposentam todos os runtimes MCP incluídos que abrirem quando a resposta for concluída, para que execuções repetidas em scripts não acumulem processos filho stdio MCP
    - servidores MCP stdio iniciados pelo OpenClaw (incluídos ou configurados pelo usuário) são encerrados como uma árvore de processos no desligamento, para que subprocessos filhos iniciados pelo servidor não sobrevivam após a saída do cliente stdio pai
    - excluir ou redefinir uma sessão descarta os clientes MCP dessa sessão pelo caminho compartilhado de limpeza de runtime, portanto não há conexões stdio remanescentes vinculadas a uma sessão removida
  </Accordion>
</AccordionGroup>

### Escolha um modo de cliente

Use a mesma bridge de duas formas diferentes:

<Tabs>
  <Tab title="Clientes MCP genéricos">
    Somente ferramentas MCP padrão. Use `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` e as ferramentas de aprovação.
  </Tab>
  <Tab title="Claude Code">
    Ferramentas MCP padrão mais o adaptador de canal específico do Claude. Ative `--claude-channel-mode on` ou mantenha o padrão `auto`.
  </Tab>
</Tabs>

<Note>
Hoje, `auto` se comporta da mesma forma que `on`. Ainda não há detecção de capacidade do cliente.
</Note>

### O que `serve` expõe

A bridge usa metadados de rota de sessão existentes do Gateway para expor conversas com suporte de canal. Uma conversa aparece quando o OpenClaw já tem estado de sessão com uma rota conhecida, como:

- `channel`
- metadados de destinatário ou destino
- `accountId` opcional
- `threadId` opcional

Isso dá aos clientes MCP um único lugar para:

- listar conversas roteadas recentes
- ler histórico recente de transcrição
- aguardar novos eventos de entrada
- enviar uma resposta de volta pela mesma rota
- ver solicitações de aprovação que chegam enquanto a bridge está conectada

### Uso

<Tabs>
  <Tab title="Gateway local">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway remoto (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway remoto (senha)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude desligado">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Ferramentas da bridge

A bridge atual expõe estas ferramentas MCP:

<AccordionGroup>
  <Accordion title="conversations_list">
    Lista conversas recentes com suporte de sessão que já têm metadados de rota no estado de sessão do Gateway.

    Filtros úteis:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Retorna uma conversa por `session_key`.
  </Accordion>
  <Accordion title="messages_read">
    Lê mensagens recentes da transcrição para uma conversa com suporte de sessão.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrai blocos de conteúdo de mensagem não textual de uma mensagem da transcrição. Esta é uma visualização de metadados sobre o conteúdo da transcrição, não um armazenamento durável independente de blobs de anexo.
  </Accordion>
  <Accordion title="events_poll">
    Lê eventos ao vivo enfileirados desde um cursor numérico.
  </Accordion>
  <Accordion title="events_wait">
    Faz long-polling até o próximo evento enfileirado correspondente chegar ou até um timeout expirar.

    Use isso quando um cliente MCP genérico precisar de entrega quase em tempo real sem um protocolo push específico do Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envia texto de volta pela mesma rota já registrada na sessão.

    Comportamento atual:

    - exige uma rota de conversa existente
    - usa o canal, destinatário, ID da conta e ID da thread da sessão
    - envia somente texto

  </Accordion>
  <Accordion title="permissions_list_open">
    Lista solicitações pendentes de aprovação de exec/plugin que a bridge observou desde que se conectou ao Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Resolve uma solicitação pendente de aprovação de exec/plugin com:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modelo de evento

A bridge mantém uma fila de eventos em memória enquanto está conectada.

Tipos de evento atuais:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- a fila é somente ao vivo; ela começa quando a bridge MCP inicia
- `events_poll` e `events_wait` não reproduzem automaticamente histórico mais antigo do Gateway
- backlog durável deve ser lido com `messages_read`
</Warning>

### Notificações de canal do Claude

A bridge também pode expor notificações de canal específicas do Claude. Este é o equivalente no OpenClaw a um adaptador de canal do Claude Code: ferramentas MCP padrão continuam disponíveis, mas mensagens de entrada ao vivo também podem chegar como notificações MCP específicas do Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: somente ferramentas MCP padrão.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: ativa notificações de canal do Claude.
  </Tab>
  <Tab title="auto (padrão)">
    `--claude-channel-mode auto`: padrão atual; mesmo comportamento de bridge que `on`.
  </Tab>
</Tabs>

Quando o modo de canal Claude está ativado, o servidor anuncia capacidades experimentais do Claude e pode emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento atual da bridge:

- mensagens de transcrição `user` de entrada são encaminhadas como `notifications/claude/channel`
- solicitações de permissão do Claude recebidas por MCP são rastreadas em memória
- se a conversa vinculada depois enviar `yes abcde` ou `no abcde`, a bridge converte isso em `notifications/claude/channel/permission`
- essas notificações existem somente na sessão ao vivo; se o cliente MCP se desconectar, não haverá destino para push

Isso é intencionalmente específico do cliente. Clientes MCP genéricos devem depender das ferramentas padrão de polling.

### Configuração do cliente MCP

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

Para a maioria dos clientes MCP genéricos, comece com a superfície padrão de ferramentas e ignore o modo Claude. Ative o modo Claude apenas para clientes que realmente entendem os métodos de notificação específicos do Claude.

### Opções

`openclaw mcp serve` oferece suporte a:

<ParamField path="--url" type="string">
  URL WebSocket do Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Token do Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Ler o token de um arquivo.
</ParamField>
<ParamField path="--password" type="string">
  Senha do Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Ler a senha de um arquivo.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Modo de notificação do Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Logs detalhados em stderr.
</ParamField>

<Tip>
Prefira `--token-file` ou `--password-file` em vez de segredos inline sempre que possível.
</Tip>

### Segurança e limite de confiança

A bridge não inventa roteamento. Ela apenas expõe conversas que o Gateway já sabe como rotear.

Isso significa:

- listas de permissões de remetente, pareamento e confiança em nível de canal ainda pertencem à configuração subjacente de canal do OpenClaw
- `messages_send` só pode responder por uma rota armazenada existente
- o estado de aprovação é somente ao vivo/em memória para a sessão atual da bridge
- a autenticação da bridge deve usar os mesmos controles de token ou senha do Gateway em que você confiaria para qualquer outro cliente remoto do Gateway

Se uma conversa estiver ausente de `conversations_list`, a causa usual não é a configuração do MCP. É ausência ou incompletude dos metadados de rota na sessão subjacente do Gateway.

### Testes

O OpenClaw inclui um smoke determinístico em Docker para esta bridge:

```bash
pnpm test:docker:mcp-channels
```

Esse smoke:

- inicia um contêiner Gateway semeado
- inicia um segundo contêiner que executa `openclaw mcp serve`
- verifica descoberta de conversas, leituras de transcrição, leituras de metadados de anexos, comportamento da fila de eventos ao vivo e roteamento de envio de saída
- valida notificações de canal e permissão no estilo Claude pela bridge MCP stdio real

Esta é a forma mais rápida de provar que a bridge funciona sem conectar uma conta real de Telegram, Discord ou iMessage à execução de teste.

Para um contexto de testes mais amplo, consulte [Testing](/pt-BR/help/testing).

### Solução de problemas

<AccordionGroup>
  <Accordion title="Nenhuma conversa retornada">
    Geralmente significa que a sessão do Gateway ainda não é roteável. Confirme que a sessão subjacente armazenou metadados de rota de canal/provedor, destinatário e conta/thread opcionais.
  </Accordion>
  <Accordion title="events_poll ou events_wait perde mensagens mais antigas">
    Esperado. A fila ao vivo começa quando a bridge se conecta. Leia o histórico mais antigo da transcrição com `messages_read`.
  </Accordion>
  <Accordion title="Notificações do Claude não aparecem">
    Verifique tudo isto:

    - o cliente manteve a sessão MCP stdio aberta
    - `--claude-channel-mode` está como `on` ou `auto`
    - o cliente realmente entende os métodos de notificação específicos do Claude
    - a mensagem de entrada aconteceu depois que a bridge se conectou

  </Accordion>
  <Accordion title="Aprovações estão ausentes">
    `permissions_list_open` mostra apenas solicitações de aprovação observadas enquanto a bridge estava conectada. Não é uma API de histórico durável de aprovações.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de cliente MCP

Este é o caminho `openclaw mcp list`, `show`, `set` e `unset`.

Esses comandos não expõem o OpenClaw por MCP. Eles gerenciam definições de servidores MCP pertencentes ao OpenClaw em `mcp.servers` na configuração do OpenClaw.

Essas definições salvas são para runtimes que o OpenClaw inicia ou configura mais tarde, como Pi incorporado e outros adaptadores de runtime. O OpenClaw armazena as definições centralmente para que esses runtimes não precisem manter suas próprias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - esses comandos apenas leem ou gravam a configuração do OpenClaw
    - eles não se conectam ao servidor MCP de destino
    - eles não validam se o comando, a URL ou o transporte remoto estão acessíveis neste momento
    - adaptadores de runtime decidem quais formatos de transporte realmente suportam no momento da execução
    - Pi incorporado expõe ferramentas MCP configuradas nos perfis normais de ferramenta `coding` e `messaging`; `minimal` ainda as oculta, e `tools.deny: ["bundle-mcp"]` as desativa explicitamente
    - runtimes MCP incluídos com escopo de sessão são coletados após `mcp.sessionIdleTtlMs` milissegundos de inatividade (padrão 10 minutos; defina `0` para desativar) e execuções incorporadas de disparo único os limpam ao fim da execução
  </Accordion>
</AccordionGroup>

Adaptadores de runtime podem normalizar este registro compartilhado para o formato esperado por seu cliente downstream. Por exemplo, Pi incorporado consome valores `transport` do OpenClaw diretamente, enquanto Claude Code e Gemini recebem valores `type` nativos da CLI, como `http`, `sse` ou `stdio`.

### Definições salvas de servidores MCP

O OpenClaw também armazena no config um registro leve de servidores MCP para superfícies que desejam definições MCP gerenciadas pelo OpenClaw.

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Observações:

- `list` ordena os nomes dos servidores.
- `show` sem nome imprime o objeto completo de servidores MCP configurados.
- `set` espera um único valor de objeto JSON na linha de comando.
- `unset` falha se o servidor nomeado não existir.

Exemplos:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Exemplo de formato da configuração:

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

| Campo                    | Descrição                            |
| ------------------------ | ------------------------------------ |
| `command`                | Executável a iniciar (obrigatório)   |
| `args`                   | Array de argumentos de linha de comando |
| `env`                    | Variáveis de ambiente extras         |
| `cwd` / `workingDirectory` | Diretório de trabalho do processo  |

<Warning>
**Filtro de segurança de env do stdio**

O OpenClaw rejeita chaves de env de inicialização do interpretador que podem alterar como um servidor MCP stdio inicia antes do primeiro RPC, mesmo que apareçam no bloco `env` de um servidor. As chaves bloqueadas incluem `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` e variáveis semelhantes de controle de runtime. A inicialização rejeita essas chaves com um erro de configuração para que elas não possam injetar um preâmbulo implícito, trocar o interpretador ou ativar um depurador no processo stdio. Variáveis de ambiente comuns de credencial, proxy e específicas do servidor (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizado etc.) não são afetadas.

Se o seu servidor MCP realmente precisar de uma das variáveis bloqueadas, defina-a no processo host do gateway em vez de em `env` do servidor stdio.
</Warning>

### Transporte SSE / HTTP

Conecta-se a um servidor MCP remoto por HTTP Server-Sent Events.

| Campo                | Descrição                                                            |
| -------------------- | -------------------------------------------------------------------- |
| `url`                | URL HTTP ou HTTPS do servidor remoto (obrigatório)                   |
| `headers`            | Mapa opcional chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação) |
| `connectionTimeoutMs` | Timeout de conexão por servidor em ms (opcional)                    |

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

Valores sensíveis em `url` (userinfo) e `headers` são redigidos em logs e saída de status.

### Transporte streamable HTTP

`streamable-http` é uma opção adicional de transporte ao lado de `sse` e `stdio`. Ele usa streaming HTTP para comunicação bidirecional com servidores MCP remotos.

| Campo                | Descrição                                                                            |
| -------------------- | ------------------------------------------------------------------------------------ |
| `url`                | URL HTTP ou HTTPS do servidor remoto (obrigatório)                                   |
| `transport`          | Defina como `"streamable-http"` para selecionar este transporte; quando omitido, o OpenClaw usa `sse` |
| `headers`            | Mapa opcional chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação)   |
| `connectionTimeoutMs` | Timeout de conexão por servidor em ms (opcional)                                    |

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

<Note>
Esses comandos gerenciam apenas a configuração salva. Eles não iniciam a bridge de canal, não abrem uma sessão ativa de cliente MCP nem comprovam que o servidor de destino está acessível.
</Note>

## Limites atuais

Esta página documenta a bridge como enviada atualmente.

Limites atuais:

- a descoberta de conversas depende dos metadados de rota de sessão existentes no Gateway
- não há protocolo push genérico além do adaptador específico do Claude
- ainda não há ferramentas para editar ou reagir a mensagens
- o transporte HTTP/SSE/streamable-http se conecta a um único servidor remoto; ainda não há upstream multiplexado
- `permissions_list_open` inclui apenas aprovações observadas enquanto a bridge está conectada

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Plugins](/pt-BR/cli/plugins)
