---
read_when:
    - Conectando o Codex, o Claude Code ou outro cliente MCP a canais com suporte do OpenClaw
    - Executando `openclaw mcp serve`
    - Gerenciamento das definições de servidores MCP salvas pelo OpenClaw
sidebarTitle: MCP
summary: Exponha conversas dos canais do OpenClaw via MCP e gerencie definições salvas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-07-16T12:21:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` tem duas funções:

- executar o OpenClaw como um servidor MCP com `openclaw mcp serve`
- gerenciar definições de servidores MCP de saída administradas pelo OpenClaw com `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` e `unset`

`serve` é o OpenClaw atuando como um servidor MCP. Os outros subcomandos correspondem ao OpenClaw atuando como um registro de servidores no lado do cliente MCP, que seus próprios runtimes poderão consumir posteriormente.

<Note>
  `list`, `show`, `set` e `unset` apenas leem e gravam entradas `mcp.servers` gerenciadas pelo OpenClaw na configuração do OpenClaw. Eles não incluem servidores do mcporter provenientes de `config/mcporter.json`; use `mcporter list` para esse registro.
</Note>

Use [`openclaw acp`](/pt-BR/cli/acp) quando o OpenClaw precisar hospedar uma sessão de harness de programação e encaminhar esse runtime por meio do ACP.

## Escolha o caminho MCP correto

| Objetivo                                                                | Use                                                                  | Motivo                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Permitir que um cliente MCP externo leia/envie conversas dos canais do OpenClaw | `openclaw mcp serve`                                                 | O OpenClaw é o servidor MCP e expõe conversas apoiadas pelo Gateway via stdio.                                 |
| Salvar servidores MCP de terceiros para execuções de agentes gerenciadas pelo OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | O OpenClaw é o registro no lado do cliente MCP e posteriormente projeta esses servidores em runtimes qualificados.               |
| Verificar um servidor salvo sem executar um turno do agente                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` e `doctor` inspecionam a configuração; `probe` abre uma conexão MCP ativa e lista os recursos.               |
| Editar a configuração do MCP em um navegador                                      | `/settings/mcp` da interface de controle (alias `/mcp`)                            | A página mostra o inventário, a ativação, resumos de OAuth/filtros, dicas de comandos e um editor de `mcp` com escopo definido.         |
| Fornecer ao servidor de aplicativo do Codex um servidor MCP nativo com escopo definido                    | `mcp.servers.<name>.codex`                                           | O bloco `codex` afeta apenas a projeção de threads do servidor de aplicativo do Codex e é removido antes da transferência da configuração nativa. |
| Executar sessões de harness hospedadas pelo ACP                                     | [`openclaw acp`](/pt-BR/cli/acp) e [Agentes ACP](/pt-BR/tools/acp-agents-setup) | O modo de ponte ACP não aceita a injeção de servidores MCP por sessão; em vez disso, configure pontes de Gateway/plugins.     |

<Tip>
Se não tiver certeza de qual caminho precisa, comece com `openclaw mcp status --verbose`. Ele mostra o que o OpenClaw salvou sem iniciar nenhum servidor MCP.
</Tip>

## OpenClaw como um servidor MCP

Este é o caminho de `openclaw mcp serve`.

### Quando usar serve

Use `openclaw mcp serve` quando:

- Codex, Claude Code ou outro cliente MCP precisar se comunicar diretamente com conversas de canais apoiadas pelo OpenClaw
- já houver um Gateway local ou remoto do OpenClaw com sessões encaminhadas
- for necessário um único servidor MCP que funcione nos backends de canais do OpenClaw, em vez de executar pontes separadas para cada canal

Use [`openclaw acp`](/pt-BR/cli/acp) quando o OpenClaw precisar hospedar o próprio runtime de programação e manter a sessão do agente dentro do OpenClaw.

### Como funciona

`openclaw mcp serve` inicia um servidor MCP stdio. O cliente MCP é o proprietário desse processo. Enquanto o cliente mantiver a sessão stdio aberta, a ponte se conectará a um Gateway local ou remoto do OpenClaw via WebSocket e exporá conversas de canais encaminhadas por meio do MCP.

<Steps>
  <Step title="O cliente inicia a ponte">
    O cliente MCP inicia `openclaw mcp serve`.
  </Step>
  <Step title="A ponte se conecta ao Gateway">
    A ponte se conecta ao Gateway do OpenClaw via WebSocket.
  </Step>
  <Step title="As sessões se tornam conversas MCP">
    As sessões encaminhadas se tornam conversas MCP e ferramentas de transcrição/histórico.
  </Step>
  <Step title="Os eventos ativos entram na fila">
    Os eventos ativos são enfileirados na memória enquanto a ponte está conectada.
  </Step>
  <Step title="Envio opcional do Claude">
    Se o modo de canal do Claude estiver ativado, a mesma sessão também poderá receber notificações push específicas do Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - o estado da fila ativa começa quando a ponte se conecta
    - o histórico de transcrições mais antigo é lido com `messages_read`
    - as notificações push do Claude existem apenas enquanto a sessão MCP está ativa
    - quando o cliente se desconecta, a ponte é encerrada e a fila ativa desaparece
    - os pontos de entrada de agentes de execução única, como `openclaw agent` e `openclaw infer model run`, encerram todos os runtimes MCP integrados que abrirem quando a resposta for concluída, para que execuções repetidas por script não acumulem processos filhos MCP stdio
    - os servidores MCP stdio iniciados pelo OpenClaw (integrados ou configurados pelo usuário) são encerrados como uma árvore de processos durante o desligamento, para que os subprocessos filhos iniciados pelo servidor não permaneçam ativos depois que o cliente stdio pai for encerrado
    - excluir ou redefinir uma sessão descarta os clientes MCP dessa sessão pelo caminho compartilhado de limpeza do runtime, evitando conexões stdio remanescentes vinculadas a uma sessão removida

  </Accordion>
</AccordionGroup>

### Escolha um modo de cliente

<Tabs>
  <Tab title="Clientes MCP genéricos">
    Somente ferramentas MCP padrão. Use `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` e as ferramentas de aprovação.
  </Tab>
  <Tab title="Claude Code">
    Ferramentas MCP padrão mais o adaptador de canal específico do Claude. Ative `--claude-channel-mode on` ou mantenha o padrão `auto`.
  </Tab>
</Tabs>

<Note>
Atualmente, `auto` se comporta da mesma forma que `on`. Ainda não há detecção dos recursos do cliente.
</Note>

### O que serve expõe

A ponte usa os metadados existentes de rota de sessão do Gateway para expor conversas apoiadas por canais. Uma conversa aparece quando o OpenClaw já tem um estado de sessão com uma rota conhecida, como:

- `channel`
- metadados do destinatário ou destino
- `accountId` opcional
- `threadId` opcional

Isso oferece aos clientes MCP um único lugar para:

- listar conversas encaminhadas recentes
- ler o histórico recente de transcrições
- aguardar novos eventos de entrada
- enviar uma resposta de volta pela mesma rota
- ver solicitações de aprovação recebidas enquanto a ponte está conectada

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

### Ferramentas da ponte

<AccordionGroup>
  <Accordion title="conversations_list">
    Lista conversas recentes apoiadas por sessões que já possuem metadados de rota no estado de sessão do Gateway.

    Filtros: `limit` (máx. 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Retorna uma conversa por `session_key` usando uma consulta direta à sessão do Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Lê mensagens recentes da transcrição de uma conversa apoiada por sessão. O padrão de `limit` é 20, com máximo de 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrai blocos de conteúdo não textual de uma mensagem da transcrição. Esta é uma visualização de metadados do conteúdo da transcrição, não um armazenamento independente e durável de blobs de anexos.
  </Accordion>
  <Accordion title="events_poll">
    Lê eventos ativos enfileirados desde um cursor numérico. Máximo de 200 para `limit`.
  </Accordion>
  <Accordion title="events_wait">
    Faz uma sondagem longa até que o próximo evento enfileirado correspondente chegue ou o tempo limite expire (padrão de 30s, máximo de 300s).

    Use esta opção quando um cliente MCP genérico precisar de entrega quase em tempo real sem um protocolo push específico do Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envia texto de volta pela mesma rota já registrada na sessão.

    Comportamento atual:

    - requer uma rota de conversa existente
    - usa o canal, o destinatário, o ID da conta e o ID da thread da sessão
    - envia somente texto

  </Accordion>
  <Accordion title="permissions_list_open">
    Lista solicitações pendentes de aprovação de execução/plugin que a ponte observou desde que se conectou ao Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Resolve uma solicitação pendente de aprovação de execução/plugin com:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modelo de eventos

A ponte mantém uma fila de eventos na memória enquanto está conectada.

Tipos de eventos atuais:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- a fila contém apenas eventos ativos; ela começa quando a ponte MCP é iniciada
- `events_poll` e `events_wait` não reproduzem por conta própria o histórico mais antigo do Gateway
- o backlog durável deve ser lido com `messages_read`

</Warning>

### Notificações do canal do Claude

A ponte também pode expor notificações específicas do canal do Claude. Esse é o equivalente, no OpenClaw, a um adaptador de canal do Claude Code: as ferramentas MCP padrão continuam disponíveis, mas as mensagens de entrada ativas também podem chegar como notificações MCP específicas do Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: somente ferramentas MCP padrão.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: ativa as notificações do canal do Claude.
  </Tab>
  <Tab title="auto (padrão)">
    `--claude-channel-mode auto`: padrão atual; mesmo comportamento da ponte que `on`.
  </Tab>
</Tabs>

Quando o modo de canal do Claude está ativado, o servidor anuncia recursos experimentais do Claude e pode emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento atual da ponte:

- as mensagens de entrada `user` da transcrição são encaminhadas como `notifications/claude/channel`
- as solicitações de permissão do Claude recebidas por MCP são acompanhadas na memória
- se o proprietário do comando na conversa vinculada enviar posteriormente `yes <id>` ou `no <id>` (`<id>` é o ID da solicitação de 5 letras, excluindo `l`), a ponte converterá isso em `notifications/claude/channel/permission`
- essas notificações existem apenas durante a sessão ativa; se o cliente MCP se desconectar, não haverá um destino para o envio

Isso é intencionalmente específico do cliente. Clientes MCP genéricos devem usar as ferramentas de sondagem padrão.

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

Para a maioria dos clientes MCP genéricos, comece com a superfície de ferramentas padrão e ignore o modo Claude. Ative o modo Claude somente para clientes que realmente compreendam os métodos de notificação específicos do Claude.

### Opções

`openclaw mcp serve` oferece suporte a:

<ParamField path="--url" type="string">
  URL WebSocket do Gateway. O padrão é `gateway.remote.url` quando configurado.
</ParamField>
<ParamField path="--token" type="string">
  Token do Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Lê o token de um arquivo.
</ParamField>
<ParamField path="--password" type="string">
  Senha do Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Lê a senha de um arquivo.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Modo de notificação do Claude. O padrão é `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Logs detalhados em stderr.
</ParamField>

<Tip>
Quando possível, prefira `--token-file` ou `--password-file` em vez de segredos embutidos.
</Tip>

### Limite de segurança e confiança

A ponte não cria roteamento. Ela apenas expõe conversas que o Gateway já sabe como rotear.

Isso significa que:

- as listas de remetentes permitidos, o pareamento e a confiança no nível do canal ainda pertencem à configuração subjacente do canal do OpenClaw
- `messages_send` só pode responder por meio de uma rota armazenada existente
- o estado de aprovação existe apenas ao vivo/em memória durante a sessão atual da ponte
- a autenticação da ponte deve usar os mesmos controles de token ou senha do Gateway nos quais você confiaria para qualquer outro cliente remoto do Gateway

Se uma conversa não aparecer em `conversations_list`, normalmente a causa não é a configuração do MCP. São metadados de rota ausentes ou incompletos na sessão subjacente do Gateway.

### Testes

O OpenClaw inclui um teste rápido determinístico em Docker para essa ponte:

```bash
pnpm test:docker:mcp-channels
```

Esse teste rápido executa um único contêiner: ele inicializa o estado das conversas, inicia o Gateway e, em seguida, gera `openclaw mcp serve` como um processo filho stdio e o controla como um cliente MCP. Ele verifica a descoberta de conversas, a leitura de transcrições, a leitura de metadados de anexos, o comportamento da fila de eventos ao vivo e as notificações de canal e permissão no estilo Claude pela ponte MCP stdio real. O roteamento de envios de saída (`messages_send` reutilizando a rota armazenada da conversa) é coberto separadamente por testes unitários em `src/mcp/channel-server.test.ts`.

Essa é a maneira mais rápida de comprovar que a ponte funciona sem conectar uma conta real do Telegram, Discord ou iMessage à execução do teste.

Para obter um contexto mais amplo sobre testes, consulte [Testes](/pt-BR/help/testing).

### Solução de problemas

<AccordionGroup>
  <Accordion title="Nenhuma conversa retornada">
    Normalmente, isso significa que a sessão do Gateway ainda não pode ser roteada. Confirme se a sessão subjacente tem armazenados o canal/provedor, o destinatário e os metadados opcionais de rota da conta/thread.
  </Accordion>
  <Accordion title="events_poll ou events_wait não inclui mensagens mais antigas">
    Isso é esperado. A fila ao vivo começa quando a ponte se conecta. Leia o histórico mais antigo da transcrição com `messages_read`.
  </Accordion>
  <Accordion title="As notificações do Claude não aparecem">
    Verifique todos estes itens:

    - o cliente manteve a sessão MCP stdio aberta
    - `--claude-channel-mode` é `on` ou `auto`
    - o cliente realmente compreende os métodos de notificação específicos do Claude
    - a mensagem de entrada ocorreu depois que a ponte se conectou

  </Accordion>
  <Accordion title="As aprovações estão ausentes">
    `permissions_list_open` mostra apenas as solicitações de aprovação observadas enquanto a ponte estava conectada. Ela não é uma API de histórico persistente de aprovações.
  </Accordion>
</AccordionGroup>

## OpenClaw como um registro de clientes MCP

Este é o caminho de `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` e `unset`.

Esses comandos não expõem o OpenClaw por MCP. Eles gerenciam as definições de servidores MCP administradas pelo OpenClaw em `mcp.servers` na configuração do OpenClaw. Eles não leem servidores do mcporter em `config/mcporter.json`.

Essas definições salvas destinam-se a runtimes que o OpenClaw inicia ou configura posteriormente, como o OpenClaw incorporado e outros adaptadores de runtime. O OpenClaw armazena as definições de forma centralizada para que esses runtimes não precisem manter suas próprias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - esses comandos apenas leem ou gravam a configuração do OpenClaw
    - `status`, `list`, `show`, `doctor` sem `--probe`, `set`, `configure`, `tools`, `logout`, `reload` e `unset` não se conectam ao servidor MCP de destino
    - `login` executa o fluxo de rede OAuth do MCP para o servidor HTTP configurado e salva as credenciais locais resultantes
    - `status --verbose` exibe as dicas resolvidas de transporte, autenticação, tempo limite, filtro e chamadas paralelas de ferramentas sem se conectar
    - `doctor` verifica as definições salvas em busca de problemas de configuração local, como comandos stdio ausentes, diretórios de trabalho inválidos, arquivos TLS ausentes, servidores desativados, valores confidenciais literais em cabeçalhos/variáveis de ambiente e autorização OAuth incompleta
    - `doctor --probe` adiciona a mesma comprovação de conexão ao vivo que `probe` depois que as verificações estáticas são aprovadas
    - `probe` conecta-se ao servidor selecionado ou a todos os servidores configurados, lista as ferramentas e relata recursos/diagnósticos
    - `add` cria uma definição com base nas flags e realiza uma sondagem antes de salvar, a menos que `--no-probe` esteja definido ou que seja necessária primeiro uma autorização OAuth
    - os adaptadores de runtime decidem quais formatos de transporte eles realmente aceitam durante a execução
    - `enabled: false` mantém um servidor salvo, mas o exclui da descoberta do runtime incorporado
    - `timeout` e `connectTimeout` definem os tempos limite de solicitação e conexão por servidor, em segundos
    - `supportsParallelToolCalls: true` marca os servidores que os adaptadores podem chamar simultaneamente
    - os servidores HTTP podem usar cabeçalhos estáticos, login OAuth, controle da verificação TLS e caminhos de certificado/chave mTLS
    - o OpenClaw incorporado expõe as ferramentas MCP configuradas nos perfis de ferramentas normais `coding` e `messaging`; `minimal` ainda as oculta, e `tools.deny: ["bundle-mcp"]` as desativa explicitamente
    - `toolFilter.include` e `toolFilter.exclude` por servidor filtram as ferramentas MCP descobertas antes que elas se tornem ferramentas do OpenClaw
    - os servidores que anunciam recursos ou prompts também expõem ferramentas utilitárias para listar/ler recursos e listar/buscar prompts; esses nomes de utilitários gerados (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) usam o mesmo filtro de inclusão/exclusão
    - alterações dinâmicas na lista de ferramentas MCP invalidam o catálogo armazenado em cache para essa sessão; a próxima descoberta/utilização o atualiza a partir do servidor
    - falhas repetidas de protocolo/solicitação de ferramentas MCP pausam esse servidor brevemente para que um servidor com defeito não consuma todo o turno
    - os runtimes MCP incluídos e com escopo de sessão são encerrados após `mcp.sessionIdleTtlMs` milissegundos de inatividade (padrão de 10 minutos; defina `0` para desativar), e as execuções incorporadas de uso único os removem ao término da execução

  </Accordion>
</AccordionGroup>

Os adaptadores de runtime podem normalizar esse registro compartilhado para o formato esperado pelo cliente downstream. Por exemplo, o OpenClaw incorporado consome diretamente os valores `transport` do OpenClaw, enquanto Claude Code e Gemini recebem valores `type` nativos da CLI, como `http`, `sse` ou `stdio`.

O app-server do Codex também respeita um bloco opcional `codex` em cada servidor. Esses são
metadados de projeção do OpenClaw somente para threads do app-server do Codex; eles não
alteram sessões ACP, a configuração genérica do harness do Codex nem outros adaptadores de runtime.
Use `codex.agents` não vazio para projetar um servidor apenas em IDs de agentes específicos do OpenClaw.
Listas de agentes vazias, em branco ou inválidas são rejeitadas pela validação da configuração
e omitidas pelo caminho de projeção do runtime, em vez de se tornarem
globais. Use `codex.defaultToolsApprovalMode` (`auto`, `prompt` ou `approve`)
para emitir o `default_tools_approval_mode` nativo do Codex para um servidor confiável.
O OpenClaw remove os metadados `codex` antes de entregar a configuração
`mcp_servers` nativa ao Codex.

### Definições de servidores MCP salvas

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Observações:

- `list` ordena os nomes dos servidores.
- `show` sem um nome exibe o objeto completo do servidor MCP configurado.
- `status` classifica os transportes configurados sem se conectar. `--verbose` inclui detalhes resolvidos de inicialização, tempo limite, OAuth, filtro e chamadas paralelas.
- `doctor` executa verificações estáticas sem se conectar. Adicione `--probe` quando o comando também precisar verificar se os servidores ativados conseguem se conectar.
- `probe` conecta-se e relata as contagens de ferramentas, o suporte a recursos/prompts, o suporte a alterações na lista e os diagnósticos.
- `add` aceita flags de stdio, como `--command`, `--arg`, `--env` e `--cwd`, ou flags de HTTP, como `--url`, `--transport`, `--header`, `--auth oauth`, TLS, tempo limite e flags de seleção de ferramentas.
- `set` espera um valor de objeto JSON na linha de comando.
- `configure` atualiza a ativação, os filtros de ferramentas, os tempos limite, o OAuth, o TLS e as dicas de chamadas paralelas de ferramentas sem substituir toda a definição do servidor. Adicione `--probe` para verificar o servidor atualizado antes de salvar.
- `tools` atualiza os filtros de ferramentas por servidor. As entradas de inclusão/exclusão são nomes de ferramentas MCP e globs simples `*`.
- `login` executa o fluxo OAuth para servidores HTTP configurados com `auth: "oauth"`. A primeira execução exibe uma URL de autorização; execute novamente com `--code` após a aprovação.
- `logout` limpa as credenciais OAuth armazenadas do servidor especificado sem remover a definição salva do servidor.
- `reload` descarta os runtimes MCP em processo armazenados em cache apenas para o processo atual da CLI. Os processos do Gateway ou de agentes em outro processo ainda precisam de seu próprio caminho de recarga ou reinicialização.
- Use `transport: "streamable-http"` para servidores MCP HTTP Streamable. `openclaw mcp set` também normaliza o `type: "http"` nativo da CLI para o mesmo formato de configuração canônico por compatibilidade.
- `unset` falha se o servidor especificado não existir.

Exemplos:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Receitas comuns de servidores

Estes exemplos salvam apenas as definições dos servidores. Execute `openclaw mcp doctor --probe` depois para comprovar que o servidor inicia e expõe ferramentas.

<Tabs>
  <Tab title="Sistema de arquivos">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Restrinja os servidores de sistema de arquivos à menor árvore de diretórios que o agente deve ler ou editar.

  </Tab>
  <Tab title="Memória">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Use um filtro de ferramentas se o servidor expuser ferramentas de gravação que não devam estar disponíveis para agentes comuns.

  </Tab>
  <Tab title="Script local">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` verifica se `cwd` existe e se o comando é resolvido no ambiente configurado.

  </Tab>
  <Tab title="HTTP remoto">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Use OAuth quando o servidor remoto oferecer suporte. Se o servidor exigir cabeçalhos estáticos, evite fazer commit de tokens bearer literais.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Servidores de controle direto do desktop herdam as permissões do processo que iniciam. Use filtros de ferramentas restritos e solicitações de permissão no nível do sistema operacional.

  </Tab>
</Tabs>

### Formatos de saída JSON

Use `--json` para scripts e painéis. Os conjuntos de campos podem aumentar ao longo do tempo, portanto os consumidores devem ignorar chaves desconhecidas.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "As credenciais OAuth não estão autorizadas; execute openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` encerra com um código diferente de zero quando qualquer servidor habilitado e verificado apresenta um problema de nível `error`. Os problemas `warning` e `info` são relatados, mas, isoladamente, não fazem o comando falhar.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe --json` abre uma sessão ativa do cliente MCP e imprime o resultado diretamente; ao contrário de `status`/`doctor`, a saída não tem um campo `path` no nível superior. As chaves `resources` e `prompts` estão presentes somente quando o servidor realmente anuncia esse recurso (um servidor sem prompts omite a chave `prompts` em vez de informar `false`). Use `probe` para comprovar acessibilidade e recursos, não para auditorias de configuração estática.

  </Accordion>
</AccordionGroup>

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
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Transporte stdio

Inicia um processo filho local e se comunica por stdin/stdout.

| Campo                      | Descrição                       |
| -------------------------- | --------------------------------- |
| `command`                  | Executável a iniciar (obrigatório)    |
| `args`                     | Matriz de argumentos de linha de comando   |
| `env`                      | Variáveis de ambiente adicionais       |
| `cwd` / `workingDirectory` | Diretório de trabalho do processo |

<Warning>
**Filtro de segurança do ambiente stdio**

O OpenClaw rejeita chaves de ambiente de inicialização de interpretadores, sequestro de carregadores e inicialização de shell antes de iniciar um servidor MCP stdio, mesmo que apareçam no bloco `env` de um servidor. Isso usa a mesma política de segurança do ambiente do host aplicada a outros processos iniciados pelo OpenClaw: ela bloqueia hooks conhecidos de inicialização de interpretadores (por exemplo, `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), prefixos de injeção de bibliotecas compartilhadas e funções (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) e variáveis semelhantes de controle do runtime. A inicialização descarta essas variáveis silenciosamente e registra um aviso para impedir que elas injetem um prelúdio implícito, substituam o interpretador, habilitem um depurador ou sequestrem o vinculador dinâmico contra o processo stdio. Uma lista explícita de permissões mantém utilizáveis as variáveis de ambiente comuns de credenciais MCP (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), além de variáveis de ambiente comuns de proxy e específicas do servidor (`HTTP_PROXY`, `*_API_KEY` personalizadas etc.). Outras chaves `AWS_*`, como `AWS_CONFIG_FILE` e `AWS_SHARED_CREDENTIALS_FILE`, continuam bloqueadas porque apontam para arquivos de credenciais em vez de conter diretamente um valor de credencial.

Se o servidor MCP realmente precisar de uma das variáveis bloqueadas, defina-a no processo host do Gateway, em vez de fazê-lo no `env` do servidor stdio.
</Warning>

### Transporte SSE/HTTP

Conecta-se a um servidor MCP remoto por meio de HTTP Server-Sent Events.

| Campo                          | Descrição                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | URL HTTP ou HTTPS do servidor remoto (obrigatória)                |
| `headers`                      | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação) |
| `connectionTimeoutMs`          | Tempo limite de conexão por servidor em ms (opcional)                   |
| `connectTimeout`               | Tempo limite de conexão por servidor em segundos (opcional)              |
| `timeout` / `requestTimeoutMs` | Tempo limite de solicitação MCP por servidor em segundos ou ms                  |
| `auth: "oauth"`                | Usar credenciais OAuth MCP salvas por `openclaw mcp login`          |
| `sslVerify`                    | Defina como false somente para endpoints HTTPS privados explicitamente confiáveis    |
| `clientCert` / `clientKey`     | Caminhos do certificado e da chave do cliente mTLS                            |
| `supportsParallelToolCalls`    | Indica que chamadas simultâneas são seguras para este servidor              |

Exemplo:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Valores confidenciais em `url` (informações do usuário) e `headers` são ocultados nos logs e na saída de status. `openclaw mcp doctor` avisa quando entradas `headers` ou `env` que aparentam ser confidenciais contêm valores literais, para que os operadores possam remover esses valores da configuração versionada.

### Fluxo de trabalho OAuth

OAuth destina-se a servidores MCP HTTP que anunciam o fluxo OAuth do MCP. Cabeçalhos `Authorization` estáticos são ignorados para um servidor enquanto `auth: "oauth"` estiver habilitado. As credenciais salvas por `openclaw mcp login` funcionam com o MCP incorporado, executores da CLI e o app-server local do Codex.

Até que as credenciais estejam disponíveis, o OpenClaw omite apenas esse servidor MCP do runtime do agente, em vez de fazer a interação do agente falhar. O operador, ou um agente com acesso ao shell, pode então executar `openclaw mcp login <name>` e usar o servidor em uma interação posterior.

Quando um serviço MCP remoto já utiliza um perfil de autenticação separado do OpenClaw com capacidade de renovação, é possível definir opcionalmente `oauth.authProfileId`. O OpenClaw renova qualquer uma das fontes de credenciais antes da projeção no runtime e transmite apenas o token de acesso atual ao cliente MCP subsequente.

<Steps>
  <Step title="Salvar o servidor">
    Adicione ou atualize o servidor com `auth: "oauth"` e quaisquer metadados OAuth opcionais.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Para um bearer vinculado a um perfil de autenticação, salve a associação do perfil:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Iniciar o login">
    Execute o login para criar a solicitação de autorização.

    ```bash
    openclaw mcp login docs
    ```

    O OpenClaw imprime a URL de autorização e armazena o estado temporário do verificador OAuth no diretório de estado do OpenClaw.

  </Step>
  <Step title="Concluir com o código">
    Após aprovar no navegador, envie o código retornado de volta ao OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Verificar autorização">
    Use status ou doctor para confirmar que os tokens estão presentes.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Limpar credenciais">
    O logout remove as credenciais OAuth armazenadas, mas mantém a definição de servidor salva.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Se o provedor rotacionar os tokens ou o estado de autorização ficar travado, execute `openclaw mcp logout <name>` e repita `login`. `logout` pode limpar as credenciais de um servidor HTTP salvo mesmo depois que `auth: "oauth"` tiver sido removido da configuração, desde que o nome e a URL do servidor ainda identifiquem a entrada no armazenamento de credenciais.

### Transporte HTTP com streaming

`streamable-http` é uma opção de transporte adicional junto com `sse` e `stdio`. Ele usa streaming HTTP para comunicação bidirecional com servidores MCP remotos.

| Campo                          | Descrição                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP ou HTTPS do servidor remoto (obrigatória)                                      |
| `transport`                    | Defina como `"streamable-http"` para selecionar este transporte; quando omitido, o OpenClaw usa `sse` |
| `headers`                      | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação)                       |
| `connectionTimeoutMs`          | Tempo limite de conexão por servidor em ms (opcional)                                         |
| `connectTimeout`               | Tempo limite de conexão por servidor em segundos (opcional)                                    |
| `timeout` / `requestTimeoutMs` | Tempo limite de solicitação MCP por servidor em segundos ou ms                                        |
| `auth: "oauth"`                | Usa as credenciais OAuth do MCP salvas por `openclaw mcp login`                                |
| `sslVerify`                    | Defina como falso somente para endpoints HTTPS privados explicitamente confiáveis                          |
| `clientCert` / `clientKey`     | Caminhos do certificado e da chave do cliente mTLS                                                  |
| `supportsParallelToolCalls`    | Indica que chamadas simultâneas são seguras para este servidor                                    |

A configuração do OpenClaw usa `transport: "streamable-http"` como grafia canônica. Os valores `type: "http"` nativos da CLI do MCP são aceitos quando salvos por meio de `openclaw mcp set` e corrigidos por `openclaw doctor --fix` em configurações existentes, mas `transport` é o que o OpenClaw incorporado consome diretamente.

Exemplo:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Os comandos de registro não iniciam a ponte de canal. Somente `probe` e `doctor --probe` abrem uma sessão ativa do cliente MCP para comprovar que o servidor de destino está acessível.
</Note>

## Interface de controle

A interface de controle no navegador inclui uma página dedicada de configurações do MCP em `/settings/mcp`; o caminho anterior `/mcp` permanece como um alias. A página mostra as contagens de servidores configurados, resumos de servidores habilitados, OAuth e filtros, linhas de transporte por servidor, controles para habilitar/desabilitar, comandos comuns da CLI e um editor com escopo definido para a seção de configuração `mcp`.

Use a página para edições do operador e inventário rápido. Use `openclaw mcp doctor --probe` ou `openclaw mcp probe` quando precisar de comprovação ativa do servidor.

Fluxo de trabalho do operador:

1. Abra a interface de controle e escolha **MCP**.
2. Revise os cartões de resumo do total de servidores, servidores habilitados, OAuth e servidores filtrados.
3. Use cada linha de servidor para obter informações sobre transporte, autenticação, filtro, tempo limite e comandos.
4. Alterne a habilitação quando quiser manter uma definição, mas excluí-la da descoberta em tempo de execução.
5. Edite a seção de configuração com escopo definido `mcp` para realizar alterações estruturais, como novos servidores, cabeçalhos, TLS, metadados OAuth ou filtros de ferramentas.
6. Escolha **Salvar** para apenas persistir a configuração ou **Salvar e publicar** para aplicá-la por meio do caminho de configuração do Gateway.
7. Execute `openclaw mcp doctor --probe` quando precisar de comprovação ativa de que o servidor editado inicia e lista ferramentas.

Observações:

- os trechos de comandos colocam os nomes dos servidores entre aspas para que nomes incomuns ainda possam ser copiados para um shell
- os valores exibidos semelhantes a URLs são ocultados antes da renderização quando contêm credenciais incorporadas
- a página não inicia transportes MCP por conta própria
- os ambientes de execução ativos podem precisar de `openclaw mcp reload`, publicação da configuração do Gateway ou reinicialização do processo, dependendo de qual processo controla os clientes MCP

## Aplicativos MCP

O OpenClaw pode renderizar ferramentas que implementam a [extensão MCP Apps](https://modelcontextprotocol.io/extensions/apps) estável. Os aplicativos exigem ativação porque seu HTML vem do servidor MCP configurado e pode solicitar ferramentas ou recursos visíveis ao aplicativo nesse mesmo servidor.

Habilite a ponte do host:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Reinicie o Gateway após alterar esta configuração. Quando habilitado, o OpenClaw inicia um listener HTTP(S) exclusivo do sandbox na porta do Gateway mais um (para o Gateway padrão, `18790`). A interface de controle carrega os aplicativos dessa origem separada; o listener nunca disponibiliza a interface de controle, rotas autenticadas do Gateway nem dados do usuário.

As conexões diretas com o Gateway precisam de acesso a ambas as portas. Se um proxy reverso ou terminador TLS expuser a interface de controle, forneça aos aplicativos uma origem pública dedicada e encaminhe somente essa origem para o listener do sandbox:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

A origem do sandbox deve ser diferente da origem da interface de controle. Não hospede nela outros conteúdos autenticados ou confidenciais.

Por exemplo, a demonstração básica oficial em React pode ser configurada assim:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

Comportamento e limites de segurança:

- O OpenClaw anuncia a extensão `io.modelcontextprotocol/ui` somente quando os aplicativos estão habilitados.
- Somente recursos `ui://` com o tipo MIME exato `text/html;profile=mcp-app` são renderizados.
- Os recursos da interface têm limite de 2 MiB, são colocados atrás de um proxy com iframe duplo em uma origem externa dedicada, carregados em uma origem interna opaca do aplicativo e restringidos por uma CSP derivada dos metadados do recurso.
- As ferramentas exclusivas de aplicativos (`_meta.ui.visibility: ["app"]`) permanecem fora das listas de ferramentas do modelo. Os aplicativos só podem chamar ferramentas visíveis a aplicativos em seu servidor proprietário que também atendam à política efetiva de ferramentas do OpenClaw para a execução que criou a visualização.
- As permissões de aplicativos vinculadas à origem, como câmera, microfone e geolocalização, não são concedidas enquanto os documentos internos dos aplicativos usam origens opacas para isolamento entre aplicativos.
- O HTML do aplicativo, os argumentos completos das ferramentas e os resultados brutos permanecem em uma concessão de visualização na memória, limitada a dez minutos, e não são gravados em disco nem copiados para os metadados de pré-visualização da transcrição. A transcrição armazena somente um descritor limitado de servidor, ferramenta e recurso vinculado ao ID original da chamada de ferramenta. Após uma reinicialização do Gateway, a interface de controle pode verificar esse descritor em relação à transcrição da sessão autenticada e buscar novamente o recurso `ui://`; as visualizações reconstruídas permanecem somente leitura até que uma nova execução estabeleça as permissões atuais das ferramentas.
- `openclaw security audit` exibe um aviso enquanto a ponte está habilitada. Desabilite-a com `openclaw config set mcp.apps.enabled false --strict-json` quando ela não for necessária.

## Limites atuais

Esta página documenta a ponte conforme disponibilizada atualmente.

Limites atuais:

- a descoberta de conversas depende dos metadados existentes das rotas de sessão do Gateway
- não há protocolo push genérico além do adaptador específico do Claude
- ainda não há ferramentas para editar mensagens ou adicionar reações
- o transporte HTTP/SSE/streamable-http se conecta a um único servidor remoto; ainda não há upstream multiplexado
- `permissions_list_open` inclui somente aprovações observadas enquanto a ponte está conectada

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Plugins](/pt-BR/cli/plugins)
