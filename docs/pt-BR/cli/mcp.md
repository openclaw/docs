---
read_when:
    - Conectando o Codex, o Claude Code ou outro cliente MCP a canais baseados no OpenClaw
    - Executando `openclaw mcp serve`
    - Gerenciando definições de servidores MCP salvas pelo OpenClaw
sidebarTitle: MCP
summary: Expor conversas de canais do OpenClaw via MCP e gerenciar definições salvas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-04-30T09:41:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` tem duas funções:

- executar o OpenClaw como um servidor MCP com `openclaw mcp serve`
- gerenciar definições de servidores MCP de saída pertencentes ao OpenClaw com `list`, `show`, `set` e `unset`

Em outras palavras:

- `serve` é o OpenClaw atuando como um servidor MCP
- `list` / `show` / `set` / `unset` é o OpenClaw atuando como um registro MCP do lado do cliente para outros servidores MCP que seus runtimes podem consumir depois

Use [`openclaw acp`](/pt-BR/cli/acp) quando o OpenClaw deve hospedar por conta própria uma sessão de harness de codificação e rotear esse runtime por meio do ACP.

## OpenClaw como servidor MCP

Este é o caminho `openclaw mcp serve`.

### Quando usar `serve`

Use `openclaw mcp serve` quando:

- Codex, Claude Code ou outro cliente MCP deve conversar diretamente com conversas de canal apoiadas pelo OpenClaw
- você já tem um OpenClaw Gateway local ou remoto com sessões roteadas
- você quer um servidor MCP que funcione entre os backends de canal do OpenClaw em vez de executar bridges separadas por canal

Use [`openclaw acp`](/pt-BR/cli/acp) quando o OpenClaw deve hospedar o runtime de codificação por conta própria e manter a sessão do agente dentro do OpenClaw.

### Como funciona

`openclaw mcp serve` inicia um servidor MCP stdio. O cliente MCP é dono desse processo. Enquanto o cliente mantém a sessão stdio aberta, a bridge se conecta a um OpenClaw Gateway local ou remoto por WebSocket e expõe conversas de canal roteadas por MCP.

<Steps>
  <Step title="Cliente inicia a bridge">
    O cliente MCP inicia `openclaw mcp serve`.
  </Step>
  <Step title="Bridge se conecta ao Gateway">
    A bridge se conecta ao OpenClaw Gateway por WebSocket.
  </Step>
  <Step title="Sessões viram conversas MCP">
    Sessões roteadas viram conversas MCP e ferramentas de transcrição/histórico.
  </Step>
  <Step title="Eventos ao vivo entram na fila">
    Eventos ao vivo são enfileirados na memória enquanto a bridge está conectada.
  </Step>
  <Step title="Push opcional do Claude">
    Se o modo de canal Claude estiver habilitado, a mesma sessão também pode receber notificações push específicas do Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - o estado da fila ao vivo começa quando a bridge se conecta
    - o histórico de transcrição mais antigo é lido com `messages_read`
    - notificações push do Claude só existem enquanto a sessão MCP está ativa
    - quando o cliente se desconecta, a bridge encerra e a fila ao vivo desaparece
    - pontos de entrada de agente de execução única, como `openclaw agent` e `openclaw infer model run`, encerram quaisquer runtimes MCP empacotados que abrirem quando a resposta é concluída, então execuções com script repetidas não acumulam processos filhos MCP stdio
    - servidores MCP stdio iniciados pelo OpenClaw (empacotados ou configurados pelo usuário) são encerrados como uma árvore de processos no desligamento, então subprocessos filhos iniciados pelo servidor não sobrevivem depois que o cliente stdio pai sai
    - excluir ou redefinir uma sessão descarta os clientes MCP dessa sessão pelo caminho compartilhado de limpeza de runtime, então não há conexões stdio remanescentes vinculadas a uma sessão removida

  </Accordion>
</AccordionGroup>

### Escolha um modo de cliente

Use a mesma bridge de duas formas diferentes:

<Tabs>
  <Tab title="Clientes MCP genéricos">
    Apenas ferramentas MCP padrão. Use `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` e as ferramentas de aprovação.
  </Tab>
  <Tab title="Claude Code">
    Ferramentas MCP padrão mais o adaptador de canal específico do Claude. Habilite `--claude-channel-mode on` ou deixe o padrão `auto`.
  </Tab>
</Tabs>

<Note>
Hoje, `auto` se comporta da mesma forma que `on`. Ainda não há detecção de capacidades do cliente.
</Note>

### O que `serve` expõe

A bridge usa metadados de rota de sessão existentes do Gateway para expor conversas apoiadas por canal. Uma conversa aparece quando o OpenClaw já tem estado de sessão com uma rota conhecida, como:

- `channel`
- metadados de destinatário ou destino
- `accountId` opcional
- `threadId` opcional

Isso dá aos clientes MCP um lugar para:

- listar conversas roteadas recentes
- ler histórico de transcrição recente
- aguardar novos eventos recebidos
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
  <Tab title="Detalhado / Claude desativado">
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
    Lista conversas recentes apoiadas por sessão que já têm metadados de rota no estado de sessão do Gateway.

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
    Lê mensagens de transcrição recentes de uma conversa apoiada por sessão.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrai blocos de conteúdo de mensagem que não são texto de uma mensagem de transcrição. Esta é uma visualização de metadados sobre o conteúdo da transcrição, não um armazenamento independente e durável de blobs de anexo.
  </Accordion>
  <Accordion title="events_poll">
    Lê eventos ao vivo enfileirados desde um cursor numérico.
  </Accordion>
  <Accordion title="events_wait">
    Faz long-polling até o próximo evento enfileirado correspondente chegar ou um timeout expirar.

    Use isto quando um cliente MCP genérico precisar de entrega quase em tempo real sem um protocolo push específico do Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envia texto de volta pela mesma rota já registrada na sessão.

    Comportamento atual:

    - exige uma rota de conversa existente
    - usa o canal, destinatário, id da conta e id da thread da sessão
    - envia apenas texto

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

### Modelo de eventos

A bridge mantém uma fila de eventos em memória enquanto está conectada.

Tipos de evento atuais:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- a fila é apenas ao vivo; ela começa quando a bridge MCP inicia
- `events_poll` e `events_wait` não reproduzem histórico mais antigo do Gateway por conta própria
- backlog durável deve ser lido com `messages_read`

</Warning>

### Notificações de canal Claude

A bridge também pode expor notificações de canal específicas do Claude. Este é o equivalente no OpenClaw a um adaptador de canal do Claude Code: ferramentas MCP padrão continuam disponíveis, mas mensagens recebidas ao vivo também podem chegar como notificações MCP específicas do Claude.

<Tabs>
  <Tab title="desativado">
    `--claude-channel-mode off`: apenas ferramentas MCP padrão.
  </Tab>
  <Tab title="ativado">
    `--claude-channel-mode on`: habilita notificações de canal Claude.
  </Tab>
  <Tab title="auto (padrão)">
    `--claude-channel-mode auto`: padrão atual; mesmo comportamento de bridge que `on`.
  </Tab>
</Tabs>

Quando o modo de canal Claude está habilitado, o servidor anuncia capacidades experimentais do Claude e pode emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento atual da bridge:

- mensagens de transcrição `user` recebidas são encaminhadas como `notifications/claude/channel`
- solicitações de permissão do Claude recebidas por MCP são rastreadas em memória
- se a conversa vinculada enviar depois `yes abcde` ou `no abcde`, a bridge converte isso em `notifications/claude/channel/permission`
- essas notificações são apenas da sessão ao vivo; se o cliente MCP se desconectar, não há alvo de push

Isso é intencionalmente específico do cliente. Clientes MCP genéricos devem depender das ferramentas de polling padrão.

### Configuração de cliente MCP

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

Para a maioria dos clientes MCP genéricos, comece com a superfície de ferramentas padrão e ignore o modo Claude. Ative o modo Claude apenas para clientes que realmente entendem os métodos de notificação específicos do Claude.

### Opções

`openclaw mcp serve` oferece suporte a:

<ParamField path="--url" type="string">
  URL WebSocket do Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Token do Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Lê o token do arquivo.
</ParamField>
<ParamField path="--password" type="string">
  Senha do Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Lê a senha do arquivo.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Modo de notificação do Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Logs detalhados em stderr.
</ParamField>

<Tip>
Prefira `--token-file` ou `--password-file` em vez de segredos inline quando possível.
</Tip>

### Segurança e limite de confiança

A bridge não inventa roteamento. Ela apenas expõe conversas que o Gateway já sabe rotear.

Isso significa:

- allowlists de remetentes, pareamento e confiança no nível do canal ainda pertencem à configuração do canal OpenClaw subjacente
- `messages_send` só pode responder por uma rota armazenada existente
- o estado de aprovação é ao vivo/em memória apenas para a sessão de bridge atual
- a autenticação da bridge deve usar os mesmos controles de token ou senha do Gateway que você confiaria para qualquer outro cliente remoto do Gateway

Se uma conversa estiver ausente de `conversations_list`, a causa habitual não é a configuração MCP. É a falta ou incompletude dos metadados de rota na sessão subjacente do Gateway.

### Testes

O OpenClaw inclui um smoke Docker determinístico para esta bridge:

```bash
pnpm test:docker:mcp-channels
```

Esse smoke:

- inicia um contêiner Gateway semeado
- inicia um segundo contêiner que executa `openclaw mcp serve`
- verifica descoberta de conversas, leituras de transcrição, leituras de metadados de anexos, comportamento da fila de eventos ao vivo e roteamento de envio de saída
- valida notificações de canal e permissão no estilo Claude pela bridge MCP stdio real

Esta é a forma mais rápida de provar que a bridge funciona sem conectar uma conta real de Telegram, Discord ou iMessage à execução de teste.

Para contexto de testes mais amplo, consulte [Testes](/pt-BR/help/testing).

### Solução de problemas

<AccordionGroup>
  <Accordion title="Nenhuma conversa retornada">
    Geralmente significa que a sessão do Gateway ainda não é roteável. Confirme que a sessão subjacente tem metadados de rota armazenados de canal/provedor, destinatário e conta/thread opcionais.
  </Accordion>
  <Accordion title="events_poll ou events_wait perde mensagens mais antigas">
    Esperado. A fila ao vivo começa quando a bridge se conecta. Leia o histórico de transcrição mais antigo com `messages_read`.
  </Accordion>
  <Accordion title="Notificações do Claude não aparecem">
    Verifique todos estes itens:

    - o cliente manteve a sessão MCP stdio aberta
    - `--claude-channel-mode` está como `on` ou `auto`
    - o cliente realmente entende os métodos de notificação específicos do Claude
    - a mensagem recebida ocorreu depois que a bridge se conectou

  </Accordion>
  <Accordion title="Aprovações estão ausentes">
    `permissions_list_open` mostra apenas solicitações de aprovação observadas enquanto a bridge estava conectada. Não é uma API de histórico de aprovações durável.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de cliente MCP

Este é o caminho de `openclaw mcp list`, `show`, `set` e `unset`.

Esses comandos não expõem o OpenClaw via MCP. Eles gerenciam definições de servidores MCP pertencentes ao OpenClaw em `mcp.servers` na configuração do OpenClaw.

Essas definições salvas são para runtimes que o OpenClaw inicia ou configura depois, como Pi incorporado e outros adaptadores de runtime. O OpenClaw armazena as definições centralmente para que esses runtimes não precisem manter suas próprias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Important behavior">
    - esses comandos apenas leem ou gravam a configuração do OpenClaw
    - eles não se conectam ao servidor MCP de destino
    - eles não validam se o comando, a URL ou o transporte remoto está acessível neste momento
    - adaptadores de runtime decidem quais formatos de transporte eles de fato oferecem suporte no momento da execução
    - Pi incorporado expõe ferramentas MCP configuradas nos perfis de ferramentas normais `coding` e `messaging`; `minimal` ainda as oculta, e `tools.deny: ["bundle-mcp"]` as desativa explicitamente
    - runtimes MCP empacotados com escopo de sessão são encerrados após `mcp.sessionIdleTtlMs` milissegundos de tempo ocioso (padrão de 10 minutos; defina como `0` para desativar), e execuções incorporadas de uso único os limpam ao fim da execução

  </Accordion>
</AccordionGroup>

Adaptadores de runtime podem normalizar esse registro compartilhado para o formato esperado pelo cliente downstream. Por exemplo, Pi incorporado consome valores `transport` do OpenClaw diretamente, enquanto Claude Code e Gemini recebem valores `type` nativos da CLI, como `http`, `sse` ou `stdio`.

### Definições salvas de servidores MCP

O OpenClaw também armazena um registro leve de servidores MCP na configuração para superfícies que querem definições MCP gerenciadas pelo OpenClaw.

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Observações:

- `list` ordena os nomes dos servidores.
- `show` sem um nome imprime o objeto completo de servidores MCP configurados.
- `set` espera um valor de objeto JSON na linha de comando.
- Use `transport: "streamable-http"` para servidores MCP Streamable HTTP. `openclaw mcp set` também normaliza `type: "http"` nativo da CLI para o mesmo formato canônico de configuração por compatibilidade.
- `unset` falha se o servidor nomeado não existir.

Exemplos:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
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
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### Transporte stdio

Inicia um processo filho local e se comunica por stdin/stdout.

| Campo                      | Descrição                                      |
| -------------------------- | ---------------------------------------------- |
| `command`                  | Executável a iniciar (obrigatório)             |
| `args`                     | Array de argumentos de linha de comando        |
| `env`                      | Variáveis de ambiente extras                   |
| `cwd` / `workingDirectory` | Diretório de trabalho para o processo          |

<Warning>
**Filtro de segurança de env de stdio**

O OpenClaw rejeita chaves de env de inicialização de interpretador que podem alterar como um servidor MCP stdio inicia antes do primeiro RPC, mesmo que apareçam no bloco `env` de um servidor. Chaves bloqueadas incluem `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` e variáveis semelhantes de controle de runtime. A inicialização as rejeita com um erro de configuração para que não possam injetar um prelúdio implícito, trocar o interpretador ou habilitar um depurador contra o processo stdio. Variáveis de ambiente comuns de credenciais, proxy e específicas de servidor (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizadas etc.) não são afetadas.

Se seu servidor MCP realmente precisar de uma das variáveis bloqueadas, defina-a no processo host do Gateway em vez de dentro do `env` do servidor stdio.
</Warning>

### Transporte SSE / HTTP

Conecta-se a um servidor MCP remoto por HTTP Server-Sent Events.

| Campo                 | Descrição                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS do servidor remoto (obrigatório)               |
| `headers`             | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação) |
| `connectionTimeoutMs` | Tempo limite de conexão por servidor em ms (opcional)            |

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

Valores sensíveis em `url` (userinfo) e `headers` são redigidos em logs e na saída de status.

### Transporte Streamable HTTP

`streamable-http` é uma opção adicional de transporte ao lado de `sse` e `stdio`. Ele usa streaming HTTP para comunicação bidirecional com servidores MCP remotos.

| Campo                 | Descrição                                                                            |
| --------------------- | ------------------------------------------------------------------------------------ |
| `url`                 | URL HTTP ou HTTPS do servidor remoto (obrigatório)                                   |
| `transport`           | Defina como `"streamable-http"` para selecionar este transporte; quando omitido, o OpenClaw usa `sse` |
| `headers`             | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação) |
| `connectionTimeoutMs` | Tempo limite de conexão por servidor em ms (opcional)                                |

A configuração do OpenClaw usa `transport: "streamable-http"` como a grafia canônica. Valores MCP `type: "http"` nativos da CLI são aceitos quando salvos por meio de `openclaw mcp set` e reparados por `openclaw doctor --fix` na configuração existente, mas `transport` é o que Pi incorporado consome diretamente.

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
Esses comandos gerenciam apenas a configuração salva. Eles não iniciam a ponte de canal, não abrem uma sessão ativa de cliente MCP nem comprovam que o servidor de destino está acessível.
</Note>

## Limites atuais

Esta página documenta a ponte como distribuída hoje.

Limites atuais:

- a descoberta de conversas depende dos metadados de rota de sessão existentes do Gateway
- nenhum protocolo genérico de push além do adaptador específico do Claude
- ainda não há ferramentas para editar mensagens ou reagir
- o transporte HTTP/SSE/streamable-http se conecta a um único servidor remoto; ainda não há upstream multiplexado
- `permissions_list_open` inclui apenas aprovações observadas enquanto a ponte está conectada

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Plugins](/pt-BR/cli/plugins)
