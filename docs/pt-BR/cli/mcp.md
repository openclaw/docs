---
read_when:
    - Conectando o Codex, o Claude Code ou outro cliente MCP a canais com suporte do OpenClaw
    - Executando `openclaw mcp serve`
    - Gerenciando definições de servidores MCP salvas pelo OpenClaw
sidebarTitle: MCP
summary: Exponha as conversas dos canais do OpenClaw por meio do MCP e gerencie as definições salvas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-07-12T15:01:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5753ffb716794edcdfa2c3cdd370bd33173b6d30785f135e84933dcd628bbe54
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` tem duas funções:

- executar o OpenClaw como um servidor MCP com `openclaw mcp serve`
- gerenciar definições de servidores MCP de saída administradas pelo OpenClaw com `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` e `unset`

Com `serve`, o OpenClaw atua como um servidor MCP. Com os outros subcomandos, o OpenClaw atua como um registro MCP do lado do cliente para servidores que seus próprios runtimes poderão consumir posteriormente.

<Note>
  `list`, `show`, `set` e `unset` apenas leem e gravam entradas `mcp.servers` administradas pelo OpenClaw na configuração do OpenClaw. Eles não incluem servidores do mcporter definidos em `config/mcporter.json`; use `mcporter list` para esse registro.
</Note>

Use [`openclaw acp`](/pt-BR/cli/acp) quando o próprio OpenClaw precisar hospedar uma sessão de ambiente de programação e rotear esse runtime pelo ACP.

## Escolha o caminho MCP correto

| Objetivo                                                                | Use                                                                  | Por quê                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Permitir que um cliente MCP externo leia/envie conversas de canais do OpenClaw | `openclaw mcp serve`                                                 | O OpenClaw é o servidor MCP e expõe conversas apoiadas pelo Gateway via stdio.                                 |
| Salvar servidores MCP de terceiros para execuções de agentes administradas pelo OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | O OpenClaw é o registro MCP do lado do cliente e posteriormente projeta esses servidores em runtimes qualificados.               |
| Verificar um servidor salvo sem executar um turno do agente                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` e `doctor` inspecionam a configuração; `probe` abre uma conexão MCP ativa e lista os recursos.               |
| Editar a configuração MCP em um navegador                                      | UI de controle `/settings/mcp` (alias `/mcp`)                            | A página mostra o inventário, a habilitação, resumos de OAuth/filtros, dicas de comandos e um editor de `mcp` com escopo definido.         |
| Fornecer ao app-server do Codex um servidor MCP nativo com escopo definido                    | `mcp.servers.<name>.codex`                                           | O bloco `codex` afeta apenas a projeção de threads do app-server do Codex e é removido antes do repasse da configuração nativa. |
| Executar sessões de ambiente de programação hospedadas pelo ACP                                     | [`openclaw acp`](/pt-BR/cli/acp) e [Agentes ACP](/pt-BR/tools/acp-agents-setup) | O modo de ponte ACP não aceita injeção de servidor MCP por sessão; em vez disso, configure pontes de Gateway/Plugin.     |

<Tip>
Se você não souber qual caminho precisa, comece com `openclaw mcp status --verbose`. Ele mostra o que o OpenClaw salvou sem iniciar nenhum servidor MCP.
</Tip>

## OpenClaw como servidor MCP

Este é o caminho `openclaw mcp serve`.

### Quando usar serve

Use `openclaw mcp serve` quando:

- o Codex, Claude Code ou outro cliente MCP precisar se comunicar diretamente com conversas de canais apoiadas pelo OpenClaw
- você já tiver um Gateway local ou remoto do OpenClaw com sessões roteadas
- você quiser um único servidor MCP que funcione com todos os backends de canais do OpenClaw, em vez de executar pontes separadas por canal

Use [`openclaw acp`](/pt-BR/cli/acp) quando o próprio OpenClaw precisar hospedar o runtime de programação e manter a sessão do agente dentro do OpenClaw.

### Como funciona

`openclaw mcp serve` inicia um servidor MCP stdio. O cliente MCP é responsável por esse processo. Enquanto o cliente mantiver a sessão stdio aberta, a ponte se conectará a um Gateway local ou remoto do OpenClaw por WebSocket e exporá conversas de canais roteadas via MCP.

<Steps>
  <Step title="O cliente inicia a ponte">
    O cliente MCP inicia `openclaw mcp serve`.
  </Step>
  <Step title="A ponte se conecta ao Gateway">
    A ponte se conecta ao Gateway do OpenClaw por WebSocket.
  </Step>
  <Step title="As sessões se tornam conversas MCP">
    As sessões roteadas se tornam conversas MCP e ferramentas de transcrição/histórico.
  </Step>
  <Step title="Os eventos em tempo real entram na fila">
    Os eventos em tempo real são enfileirados na memória enquanto a ponte permanece conectada.
  </Step>
  <Step title="Envio opcional do Claude">
    Se o modo de canal do Claude estiver habilitado, a mesma sessão também poderá receber notificações push específicas do Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - o estado da fila em tempo real começa quando a ponte se conecta
    - o histórico de transcrições mais antigo é lido com `messages_read`
    - as notificações push do Claude existem apenas enquanto a sessão MCP está ativa
    - quando o cliente se desconecta, a ponte é encerrada e a fila em tempo real é perdida
    - pontos de entrada de agente de execução única, como `openclaw agent` e `openclaw infer model run`, encerram todos os runtimes MCP integrados que abrirem quando a resposta é concluída, portanto execuções repetidas por script não acumulam processos filhos MCP stdio
    - os servidores MCP stdio iniciados pelo OpenClaw (integrados ou configurados pelo usuário) são encerrados como uma árvore de processos durante o desligamento, portanto os subprocessos filhos iniciados pelo servidor não permanecem em execução após o encerramento do cliente stdio pai
    - excluir ou redefinir uma sessão encerra os clientes MCP dessa sessão pelo caminho compartilhado de limpeza do runtime, portanto não permanecem conexões stdio vinculadas a uma sessão removida

  </Accordion>
</AccordionGroup>

### Escolha um modo de cliente

<Tabs>
  <Tab title="Clientes MCP genéricos">
    Apenas ferramentas MCP padrão. Use `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` e as ferramentas de aprovação.
  </Tab>
  <Tab title="Claude Code">
    Ferramentas MCP padrão mais o adaptador de canal específico do Claude. Habilite `--claude-channel-mode on` ou mantenha o padrão `auto`.
  </Tab>
</Tabs>

<Note>
Atualmente, `auto` se comporta da mesma forma que `on`. Ainda não há detecção de recursos do cliente.
</Note>

### O que serve expõe

A ponte usa os metadados existentes de rotas de sessão do Gateway para expor conversas apoiadas por canais. Uma conversa aparece quando o OpenClaw já tem um estado de sessão com uma rota conhecida, como:

- `channel`
- metadados do destinatário ou destino
- `accountId` opcional
- `threadId` opcional

Isso oferece aos clientes MCP um único lugar para:

- listar conversas roteadas recentes
- ler o histórico recente de transcrições
- aguardar novos eventos de entrada
- enviar uma resposta pela mesma rota
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
    Lista conversas recentes apoiadas por sessões que já têm metadados de rota no estado de sessão do Gateway.

    Filtros: `limit` (máximo de 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

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
    Lê eventos em tempo real enfileirados desde um cursor numérico. O máximo de `limit` é 200.
  </Accordion>
  <Accordion title="events_wait">
    Realiza uma consulta longa até que o próximo evento enfileirado correspondente chegue ou que um tempo limite expire (padrão de 30s, máximo de 300s).

    Use isso quando um cliente MCP genérico precisar de entrega quase em tempo real sem um protocolo push específico do Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envia texto pela mesma rota já registrada na sessão.

    Comportamento atual:

    - exige uma rota de conversa existente
    - usa o canal, o destinatário, o ID da conta e o ID da thread da sessão
    - envia apenas texto

  </Accordion>
  <Accordion title="permissions_list_open">
    Lista solicitações pendentes de aprovação de execução/Plugin observadas pela ponte desde que ela se conectou ao Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Resolve uma solicitação pendente de aprovação de execução/Plugin com:

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
- a fila contém apenas eventos em tempo real; ela começa quando a ponte MCP é iniciada
- `events_poll` e `events_wait` não reproduzem por conta própria o histórico anterior do Gateway
- o backlog durável deve ser lido com `messages_read`

</Warning>

### Notificações de canal do Claude

A ponte também pode expor notificações de canal específicas do Claude. Esse é o equivalente do OpenClaw a um adaptador de canal do Claude Code: as ferramentas MCP padrão continuam disponíveis, mas as mensagens de entrada em tempo real também podem chegar como notificações MCP específicas do Claude.

<Tabs>
  <Tab title="desativado">
    `--claude-channel-mode off`: apenas ferramentas MCP padrão.
  </Tab>
  <Tab title="ativado">
    `--claude-channel-mode on`: habilita as notificações de canal do Claude.
  </Tab>
  <Tab title="automático (padrão)">
    `--claude-channel-mode auto`: padrão atual; o comportamento da ponte é igual ao de `on`.
  </Tab>
</Tabs>

Quando o modo de canal do Claude está habilitado, o servidor anuncia recursos experimentais do Claude e pode emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento atual da ponte:

- mensagens `user` de entrada da transcrição são encaminhadas como `notifications/claude/channel`
- as solicitações de permissão do Claude recebidas via MCP são monitoradas na memória
- se o responsável pelo comando na conversa vinculada enviar posteriormente `yes <id>` ou `no <id>` (`<id>` é o ID da solicitação com 5 letras, excluindo `l`), a ponte converterá isso em `notifications/claude/channel/permission`
- essas notificações existem apenas durante a sessão ativa; se o cliente MCP se desconectar, não haverá destino para o push

Isso é intencionalmente específico do cliente. Clientes MCP genéricos devem usar as ferramentas de consulta padrão.

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

Para a maioria dos clientes MCP genéricos, comece com a superfície de ferramentas padrão e ignore o modo Claude. Ative o modo Claude apenas em clientes que realmente entendam os métodos de notificação específicos do Claude.

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
  Modo de notificação do Claude. Padrão: `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Logs detalhados em stderr.
</ParamField>

<Tip>
Sempre que possível, prefira `--token-file` ou `--password-file` a segredos em linha.
</Tip>

### Limite de segurança e confiança

A ponte não cria roteamento. Ela apenas expõe conversas que o Gateway já sabe como rotear.

Isso significa que:

- listas de remetentes permitidos, pareamento e confiança no nível do canal ainda pertencem à configuração subjacente do canal do OpenClaw
- `messages_send` só pode responder por meio de uma rota armazenada existente
- o estado de aprovação permanece ativo/somente na memória apenas durante a sessão atual da ponte
- a autenticação da ponte deve usar os mesmos controles de token ou senha do Gateway nos quais você confiaria para qualquer outro cliente remoto do Gateway

Se uma conversa não estiver presente em `conversations_list`, a causa habitual não é a configuração do MCP. São metadados de rota ausentes ou incompletos na sessão subjacente do Gateway.

### Testes

O OpenClaw inclui um teste de fumaça determinístico em Docker para essa ponte:

```bash
pnpm test:docker:mcp-channels
```

Esse teste de fumaça executa um único contêiner: ele inicializa o estado das conversas, inicia o Gateway, depois cria `openclaw mcp serve` como um processo filho stdio e o controla como um cliente MCP. Ele verifica a descoberta de conversas, a leitura de transcrições, a leitura de metadados de anexos, o comportamento da fila de eventos em tempo real e as notificações de canal e permissão no estilo do Claude por meio da ponte MCP stdio real. O roteamento de envios de saída (`messages_send` reutilizando a rota armazenada da conversa) é coberto separadamente por testes unitários em `src/mcp/channel-server.test.ts`.

Essa é a maneira mais rápida de comprovar que a ponte funciona sem vincular uma conta real do Telegram, Discord ou iMessage à execução do teste.

Para um contexto mais amplo sobre testes, consulte [Testes](/pt-BR/help/testing).

### Solução de problemas

<AccordionGroup>
  <Accordion title="Nenhuma conversa retornada">
    Geralmente significa que a sessão do Gateway ainda não pode ser roteada. Confirme se a sessão subjacente tem metadados armazenados de canal/provedor, destinatário e, opcionalmente, rota de conta/thread.
  </Accordion>
  <Accordion title="events_poll ou events_wait não recebe mensagens anteriores">
    Isso é esperado. A fila em tempo real começa quando a ponte se conecta. Leia o histórico anterior da transcrição com `messages_read`.
  </Accordion>
  <Accordion title="As notificações do Claude não aparecem">
    Verifique todos estes itens:

    - o cliente manteve a sessão MCP stdio aberta
    - `--claude-channel-mode` está definido como `on` ou `auto`
    - o cliente realmente entende os métodos de notificação específicos do Claude
    - a mensagem de entrada chegou depois que a ponte se conectou

  </Accordion>
  <Accordion title="As aprovações estão ausentes">
    `permissions_list_open` mostra apenas solicitações de aprovação observadas enquanto a ponte estava conectada. Ela não é uma API de histórico persistente de aprovações.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de clientes MCP

Este é o caminho de `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` e `unset`.

Esses comandos não expõem o OpenClaw pelo MCP. Eles gerenciam definições de servidores MCP administradas pelo OpenClaw em `mcp.servers` na configuração do OpenClaw. Eles não leem servidores do mcporter em `config/mcporter.json`.

Essas definições salvas são destinadas a runtimes que o OpenClaw inicia ou configura posteriormente, como o OpenClaw incorporado e outros adaptadores de runtime. O OpenClaw armazena as definições de forma centralizada para que esses runtimes não precisem manter suas próprias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - esses comandos apenas leem ou gravam a configuração do OpenClaw
    - `status`, `list`, `show`, `doctor` sem `--probe`, `set`, `configure`, `tools`, `logout`, `reload` e `unset` não se conectam ao servidor MCP de destino
    - `login` executa o fluxo de rede OAuth do MCP para o servidor HTTP configurado e salva as credenciais locais resultantes
    - `status --verbose` exibe o transporte resolvido, a autenticação, o tempo limite, o filtro e as indicações de chamadas paralelas de ferramentas sem se conectar
    - `doctor` verifica as definições salvas em busca de problemas de configuração local, como comandos stdio ausentes, diretórios de trabalho inválidos, arquivos TLS ausentes, servidores desativados, valores sensíveis literais em cabeçalhos/variáveis de ambiente e autorização OAuth incompleta
    - `doctor --probe` adiciona a mesma comprovação de conexão em tempo real que `probe` depois que as verificações estáticas são aprovadas
    - `probe` conecta-se ao servidor selecionado ou a todos os servidores configurados, lista as ferramentas e relata recursos/diagnósticos
    - `add` cria uma definição com base nas opções e a testa antes de salvar, a menos que `--no-probe` esteja definido ou que a autorização OAuth seja necessária primeiro
    - os adaptadores de runtime decidem quais formatos de transporte realmente aceitam no momento da execução
    - `enabled: false` mantém um servidor salvo, mas o exclui da descoberta do runtime incorporado
    - `timeout` e `connectTimeout` definem, em segundos, os tempos limite de solicitação e conexão por servidor
    - `supportsParallelToolCalls: true` marca servidores que os adaptadores podem chamar simultaneamente
    - servidores HTTP podem usar cabeçalhos estáticos, login OAuth, controle de verificação TLS e caminhos de certificado/chave mTLS
    - o OpenClaw incorporado expõe as ferramentas MCP configuradas nos perfis de ferramentas normais `coding` e `messaging`; `minimal` continua ocultando-as, e `tools.deny: ["bundle-mcp"]` as desativa explicitamente
    - `toolFilter.include` e `toolFilter.exclude` por servidor filtram as ferramentas MCP descobertas antes que elas se tornem ferramentas do OpenClaw
    - servidores que anunciam recursos ou prompts também expõem ferramentas utilitárias para listar/ler recursos e listar/obter prompts; esses nomes de utilitários gerados (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) usam o mesmo filtro de inclusão/exclusão
    - alterações dinâmicas na lista de ferramentas MCP invalidam o catálogo em cache dessa sessão; a próxima descoberta/utilização o atualiza a partir do servidor
    - falhas repetidas de solicitação/protocolo de ferramentas MCP pausam brevemente esse servidor para que um servidor com falha não consuma todo o turno
    - runtimes MCP incluídos com escopo de sessão são encerrados após `mcp.sessionIdleTtlMs` milissegundos de inatividade (padrão de 10 minutos; defina `0` para desativar), e execuções incorporadas únicas os encerram ao final da execução

  </Accordion>
</AccordionGroup>

Os adaptadores de runtime podem normalizar esse registro compartilhado para o formato esperado pelo cliente downstream. Por exemplo, o OpenClaw incorporado consome diretamente os valores de `transport` do OpenClaw, enquanto o Claude Code e o Gemini recebem valores de `type` nativos da CLI, como `http`, `sse` ou `stdio`.

O app-server do Codex também respeita um bloco opcional `codex` em cada servidor. Esses são
metadados de projeção do OpenClaw somente para threads do app-server do Codex; eles não
alteram sessões ACP, a configuração genérica do executor do Codex nem outros adaptadores de runtime.
Use `codex.agents` não vazio para projetar um servidor somente em IDs específicos de agentes do OpenClaw.
Listas de agentes vazias, em branco ou inválidas são rejeitadas pela validação
da configuração e omitidas pelo caminho de projeção do runtime, em vez de se tornarem
globais. Use `codex.defaultToolsApprovalMode` (`auto`, `prompt` ou `approve`)
para emitir o `default_tools_approval_mode` nativo do Codex para um servidor confiável.
O OpenClaw remove os metadados `codex` antes de entregar a configuração nativa
`mcp_servers` ao Codex.

### Definições salvas de servidores MCP

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
- `show` sem um nome exibe o objeto completo de servidores MCP configurados.
- `status` classifica os transportes configurados sem se conectar. `--verbose` inclui detalhes resolvidos de inicialização, tempo limite, OAuth, filtro e chamadas paralelas.
- `doctor` executa verificações estáticas sem se conectar. Adicione `--probe` quando o comando também precisar verificar se os servidores ativados se conectam.
- `probe` conecta-se e relata a contagem de ferramentas, o suporte a recursos/prompts, o suporte a alterações de lista e os diagnósticos.
- `add` aceita opções de stdio, como `--command`, `--arg`, `--env` e `--cwd`, ou opções HTTP, como `--url`, `--transport`, `--header`, `--auth oauth`, TLS, tempo limite e opções de seleção de ferramentas.
- `set` espera um valor de objeto JSON na linha de comando.
- `configure` atualiza a ativação, os filtros de ferramentas, os tempos limite, o OAuth, o TLS e as indicações de chamadas paralelas de ferramentas sem substituir toda a definição do servidor. Adicione `--probe` para verificar o servidor atualizado antes de salvar.
- `tools` atualiza os filtros de ferramentas por servidor. As entradas de inclusão/exclusão são nomes de ferramentas MCP e globs simples com `*`.
- `login` executa o fluxo OAuth para servidores HTTP configurados com `auth: "oauth"`. A primeira execução exibe uma URL de autorização; execute novamente com `--code` após a aprovação.
- `logout` limpa as credenciais OAuth armazenadas do servidor especificado sem remover a definição salva do servidor.
- `reload` descarta os runtimes MCP em processo armazenados em cache apenas para o processo atual da CLI. Processos do Gateway ou de agentes em outro processo ainda precisam de seu próprio caminho de recarregamento ou reinicialização.
- Use `transport: "streamable-http"` para servidores MCP de HTTP com streaming. `openclaw mcp set` também normaliza o `type: "http"` nativo da CLI para o mesmo formato canônico de configuração para fins de compatibilidade.
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

Estes exemplos salvam apenas as definições dos servidores. Execute `openclaw mcp doctor --probe` depois para comprovar que o servidor é iniciado e expõe ferramentas.

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

    `doctor` verifica se `cwd` existe e se o comando pode ser resolvido no ambiente configurado.

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

Use `--json` para scripts e painéis. Os conjuntos de campos podem aumentar com o tempo, portanto, os consumidores devem ignorar chaves desconhecidas.

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

    `doctor --json` retorna um código de saída diferente de zero quando qualquer servidor habilitado e verificado apresenta um problema de nível `error`. Problemas `warning` e `info` são relatados, mas, isoladamente, não fazem o comando falhar.

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

    `probe --json` abre uma sessão ativa do cliente MCP e imprime seu resultado diretamente; diferentemente de `status`/`doctor`, a saída não tem um campo `path` no nível superior. As chaves `resources` e `prompts` estão presentes apenas quando o servidor realmente anuncia essa capacidade (um servidor sem prompts omite a chave `prompts`, em vez de informar `false`). Use `probe` para comprovar acessibilidade e capacidades, não para auditorias de configuração estática.

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

| Campo                      | Descrição                                  |
| -------------------------- | ------------------------------------------ |
| `command`                  | Executável a iniciar (obrigatório)         |
| `args`                     | Matriz de argumentos de linha de comando   |
| `env`                      | Variáveis de ambiente adicionais           |
| `cwd` / `workingDirectory` | Diretório de trabalho do processo           |

<Warning>
**Filtro de segurança do ambiente stdio**

O OpenClaw rejeita chaves de ambiente de inicialização de interpretador, sequestro de carregador e inicialização de shell antes de iniciar um servidor MCP stdio, mesmo que elas apareçam no bloco `env` de um servidor. Isso usa a mesma política de segurança do ambiente do host aplicada a outros processos iniciados pelo OpenClaw: ela bloqueia ganchos conhecidos de inicialização de interpretadores (por exemplo, `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), prefixos de injeção de bibliotecas compartilhadas e funções (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) e variáveis semelhantes de controle do runtime. Na inicialização, essas variáveis são removidas silenciosamente e um aviso é registrado para impedir que injetem um prelúdio implícito, substituam o interpretador, habilitem um depurador ou sequestrem o vinculador dinâmico do processo stdio. Uma lista de permissões explícita mantém utilizáveis as variáveis de ambiente comuns de credenciais MCP (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), além de variáveis comuns de proxy e específicas do servidor (`HTTP_PROXY`, `*_API_KEY` personalizadas etc.). Outras chaves `AWS_*`, como `AWS_CONFIG_FILE` e `AWS_SHARED_CREDENTIALS_FILE`, permanecem bloqueadas porque apontam para arquivos de credenciais, em vez de conter diretamente um valor de credencial.

Se o seu servidor MCP realmente precisar de uma das variáveis bloqueadas, defina-a no processo host do Gateway, em vez de fazê-lo no `env` do servidor stdio.
</Warning>

### Transporte SSE / HTTP

Conecta-se a um servidor MCP remoto por HTTP Server-Sent Events.

| Campo                          | Descrição                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `url`                          | URL HTTP ou HTTPS do servidor remoto (obrigatório)                             |
| `headers`                      | Mapa opcional de chave-valor dos cabeçalhos HTTP (por exemplo, tokens de autenticação) |
| `connectionTimeoutMs`          | Tempo limite de conexão por servidor em ms (opcional)                          |
| `connectTimeout`               | Tempo limite de conexão por servidor em segundos (opcional)                    |
| `timeout` / `requestTimeoutMs` | Tempo limite por servidor para solicitações MCP, em segundos ou ms             |
| `auth: "oauth"`                | Usa credenciais OAuth MCP salvas por `openclaw mcp login`                      |
| `sslVerify`                    | Defina como false apenas para endpoints HTTPS privados explicitamente confiáveis |
| `clientCert` / `clientKey`     | Caminhos do certificado e da chave do cliente mTLS                             |
| `supportsParallelToolCalls`    | Indica que chamadas simultâneas são seguras para este servidor                 |

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

Valores confidenciais em `url` (informações do usuário) e `headers` são ocultados nos logs e na saída de status. `openclaw mcp doctor` avisa quando entradas de `headers` ou `env` que parecem confidenciais contêm valores literais, para que os operadores possam remover esses valores da configuração versionada.

### Fluxo de trabalho OAuth

OAuth destina-se a servidores MCP HTTP que anunciam o fluxo OAuth do MCP. Cabeçalhos `Authorization` estáticos são ignorados para um servidor enquanto `auth: "oauth"` estiver habilitado. As credenciais salvas por `openclaw mcp login` funcionam com o MCP incorporado, executores da CLI e o servidor de aplicativo local do Codex.

Até que as credenciais estejam disponíveis, o OpenClaw omite somente esse servidor MCP do runtime do agente, em vez de causar falha no turno do agente. O operador, ou um agente com acesso ao shell, pode então executar `openclaw mcp login <name>` e usar o servidor em um turno posterior.

Quando um serviço MCP remoto já é respaldado por um perfil de autenticação separado do OpenClaw com capacidade de renovação, você pode definir opcionalmente `oauth.authProfileId`. O OpenClaw renova qualquer uma das fontes de credenciais antes da projeção no runtime e passa somente o token de acesso atual ao cliente MCP subsequente.

<Steps>
  <Step title="Salvar o servidor">
    Adicione ou atualize o servidor com `auth: "oauth"` e quaisquer metadados OAuth opcionais.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Para um token bearer respaldado por um perfil de autenticação, salve a vinculação do perfil:

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
    Após aprovar no navegador, passe o código retornado de volta ao OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Verificar a autorização">
    Use status ou doctor para confirmar que os tokens estão presentes.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Limpar as credenciais">
    O logout remove as credenciais OAuth armazenadas, mas mantém a definição salva do servidor.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Se o provedor rotacionar os tokens ou o estado da autorização ficar travado, execute `openclaw mcp logout <name>` e repita `login`. `logout` pode limpar as credenciais de um servidor HTTP salvo mesmo depois que `auth: "oauth"` tiver sido removido da configuração, desde que o nome e a URL do servidor ainda identifiquem a entrada do armazenamento de credenciais.

### Transporte HTTP com streaming

`streamable-http` é uma opção de transporte adicional, além de `sse` e `stdio`. Ela usa streaming HTTP para comunicação bidirecional com servidores MCP remotos.

| Campo                          | Descrição                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `url`                          | URL HTTP ou HTTPS do servidor remoto (obrigatório)                                                           |
| `transport`                    | Defina como `"streamable-http"` para selecionar este transporte; quando omitido, o OpenClaw usa `sse`        |
| `headers`                      | Mapa opcional de chave-valor dos cabeçalhos HTTP (por exemplo, tokens de autenticação)                       |
| `connectionTimeoutMs`          | Tempo limite de conexão por servidor em ms (opcional)                                                        |
| `connectTimeout`               | Tempo limite de conexão por servidor em segundos (opcional)                                                  |
| `timeout` / `requestTimeoutMs` | Tempo limite de solicitação MCP por servidor em segundos ou ms                                               |
| `auth: "oauth"`                | Use as credenciais OAuth do MCP salvas por `openclaw mcp login`                                              |
| `sslVerify`                    | Defina como falso somente para endpoints HTTPS privados explicitamente confiáveis                            |
| `clientCert` / `clientKey`     | Caminhos do certificado e da chave do cliente mTLS                                                           |
| `supportsParallelToolCalls`    | Indica que chamadas simultâneas são seguras para este servidor                                               |

A configuração do OpenClaw usa `transport: "streamable-http"` como a grafia canônica. Valores `type: "http"` do MCP nativo da CLI são aceitos quando salvos por meio de `openclaw mcp set` e corrigidos por `openclaw doctor --fix` na configuração existente, mas `transport` é o que o OpenClaw incorporado consome diretamente.

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
Os comandos de registro não iniciam a ponte do canal. Somente `probe` e `doctor --probe` abrem uma sessão ativa do cliente MCP para comprovar que o servidor de destino está acessível.
</Note>

## Interface de controle

A Interface de controle no navegador inclui uma página dedicada de configurações do MCP em `/settings/mcp`; o caminho anterior `/mcp` permanece como um alias. A página mostra contagens de servidores configurados, resumos de servidores habilitados/OAuth/filtros, linhas de transporte por servidor, controles para habilitar/desabilitar, comandos comuns da CLI e um editor com escopo definido para a seção de configuração `mcp`.

Use a página para edições do operador e um inventário rápido. Use `openclaw mcp doctor --probe` ou `openclaw mcp probe` quando precisar de uma comprovação ativa do servidor.

Fluxo de trabalho do operador:

1. Abra a Interface de controle e escolha **MCP**.
2. Confira os cartões de resumo para o total de servidores, habilitados, com OAuth e filtrados.
3. Use cada linha de servidor para ver indicações de transporte, autenticação, filtro, tempo limite e comandos.
4. Alterne a habilitação quando quiser manter uma definição, mas excluí-la da descoberta em tempo de execução.
5. Edite a seção de configuração `mcp` com escopo definido para alterações estruturais, como novos servidores, cabeçalhos, TLS, metadados OAuth ou filtros de ferramentas.
6. Escolha **Save** para apenas persistir a configuração ou **Save & Publish** para aplicá-la por meio do caminho de configuração do Gateway.
7. Execute `openclaw mcp doctor --probe` quando precisar de uma comprovação ativa de que o servidor editado inicia e lista as ferramentas.

Observações:

- os trechos de comandos colocam os nomes dos servidores entre aspas para que nomes incomuns continuem podendo ser copiados e usados em um shell
- valores exibidos semelhantes a URLs são ocultados antes da renderização quando contêm credenciais incorporadas
- a página não inicia transportes MCP por conta própria
- tempos de execução ativos podem exigir `openclaw mcp reload`, publicação da configuração do Gateway ou reinicialização do processo, dependendo de qual processo controla os clientes MCP

## Aplicativos MCP

O OpenClaw pode renderizar ferramentas que implementam a extensão estável [MCP Apps](https://modelcontextprotocol.io/extensions/apps). Os aplicativos são opcionais porque seu HTML vem do servidor MCP configurado e pode solicitar ferramentas ou recursos visíveis ao aplicativo nesse mesmo servidor.

Habilite a ponte do host:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Reinicie o Gateway após alterar essa configuração. Quando habilitado, o OpenClaw inicia um listener HTTP(S) exclusivo do sandbox na porta do Gateway mais um (para o Gateway padrão, `18790`). A Interface de controle carrega os aplicativos dessa origem separada; o listener nunca disponibiliza a Interface de controle, rotas autenticadas do Gateway ou dados do usuário.

As conexões diretas com o Gateway precisam de acesso a ambas as portas. Se um proxy reverso ou terminador TLS expuser a Interface de controle, forneça aos aplicativos uma origem pública dedicada e encaminhe somente essa origem ao listener do sandbox:

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

A origem do sandbox deve ser diferente da origem da Interface de controle. Não hospede nela outro conteúdo autenticado ou confidencial.

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

Limites de comportamento e segurança:

- O OpenClaw anuncia a extensão `io.modelcontextprotocol/ui` somente quando os aplicativos estão habilitados.
- Somente recursos `ui://` com o tipo MIME exato `text/html;profile=mcp-app` são renderizados.
- Os recursos da interface são limitados a 2 MiB, colocados atrás de um proxy de iframe duplo em uma origem externa dedicada, carregados em uma origem interna opaca do aplicativo e restringidos por uma CSP derivada dos metadados do recurso.
- Ferramentas exclusivas de aplicativos (`_meta.ui.visibility: ["app"]`) não aparecem nas listas de ferramentas do modelo. Os aplicativos podem chamar somente ferramentas visíveis a aplicativos em seu servidor de origem.
- Permissões do aplicativo vinculadas à origem, como câmera, microfone e geolocalização, não são concedidas enquanto os documentos internos do aplicativo usam origens opacas para isolamento entre aplicativos.
- O HTML do aplicativo, os argumentos completos das ferramentas e os resultados brutos permanecem em uma concessão de visualização em memória, limitada a dez minutos. Eles não são gravados em disco nem copiados para os metadados de pré-visualização da transcrição, e uma visualização expirada não reinicia seu tempo de execução MCP.
- `openclaw security audit` emite um aviso enquanto a ponte está habilitada. Desabilite-a com `openclaw config set mcp.apps.enabled false --strict-json` quando ela não for necessária.

## Limites atuais

Esta página documenta a ponte conforme disponibilizada atualmente.

Limites atuais:

- a descoberta de conversas depende dos metadados existentes das rotas de sessão do Gateway
- não há protocolo genérico de push além do adaptador específico do Claude
- ainda não há ferramentas para editar mensagens ou adicionar reações
- o transporte HTTP/SSE/streamable-http conecta-se a um único servidor remoto; ainda não há upstream multiplexado
- `permissions_list_open` inclui somente aprovações observadas enquanto a ponte está conectada

## Conteúdo relacionado

- [Referência da CLI](/pt-BR/cli)
- [Plugins](/pt-BR/cli/plugins)
