---
read_when:
    - Conectando Codex, Claude Code ou outro cliente MCP a canais com suporte do OpenClaw
    - Executando `openclaw mcp serve`
    - Gerenciando definições de servidor MCP salvas pelo OpenClaw
sidebarTitle: MCP
summary: Exponha conversas de canais do OpenClaw via MCP e gerencie definições salvas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-06-27T17:19:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` tem duas funções:

- executar o OpenClaw como um servidor MCP com `openclaw mcp serve`
- gerenciar definições de servidores MCP de saída gerenciadas pelo OpenClaw com `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` e `unset`

Em outras palavras:

- `serve` é o OpenClaw atuando como um servidor MCP
- os outros subcomandos são o OpenClaw atuando como um registro do lado cliente MCP para servidores MCP que seus runtimes podem consumir depois

<Note>
  `list`, `show`, `set` e `unset` apenas leem e gravam entradas `mcp.servers` gerenciadas pelo OpenClaw na configuração do OpenClaw. Elas não incluem servidores mcporter de `config/mcporter.json`; use `mcporter list` para esse registro.
</Note>

Use [`openclaw acp`](/pt-BR/cli/acp) quando o OpenClaw deve hospedar ele mesmo uma sessão de harness de codificação e rotear esse runtime pelo ACP.

## Escolha o caminho MCP correto

O OpenClaw tem várias superfícies MCP. Escolha a que corresponde a quem é dono do runtime do agente e a quem é dono das ferramentas.

| Objetivo                                                            | Use                                                                  | Por quê                                                                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Permitir que um cliente MCP externo leia/envie conversas de canais do OpenClaw | `openclaw mcp serve`                                                 | O OpenClaw é o servidor MCP e expõe conversas com suporte do Gateway por stdio.                                 |
| Salvar servidores MCP de terceiros para execuções de agentes gerenciadas pelo OpenClaw | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | O OpenClaw é o registro do lado cliente MCP e depois projeta esses servidores em runtimes elegíveis.            |
| Verificar um servidor salvo sem executar um turno de agente         | `openclaw mcp status`, `doctor`, `probe`                             | `status` e `doctor` inspecionam a configuração; `probe` abre uma conexão MCP ao vivo e lista capacidades.       |
| Editar a configuração MCP em um navegador                           | Interface de Controle `/mcp`                                         | A página mostra inventário, habilitação, resumos de OAuth/filtros, dicas de comando e um editor `mcp` com escopo. |
| Dar ao servidor de app do Codex um servidor MCP nativo com escopo   | `mcp.servers.<name>.codex`                                           | O bloco `codex` afeta apenas a projeção de threads do servidor de app do Codex e é removido antes da entrega da configuração nativa. |
| Executar sessões de harness hospedadas por ACP                      | [`openclaw acp`](/pt-BR/cli/acp) e [Agentes ACP](/pt-BR/tools/acp-agents-setup) | O modo ponte ACP não aceita injeção de servidor MCP por sessão; configure pontes de Gateway/Plugin em vez disso. |

<Tip>
Se você não tem certeza de qual caminho precisa, comece com `openclaw mcp status --verbose`. Ele mostra o que o OpenClaw salvou sem iniciar nenhum servidor MCP.
</Tip>

## OpenClaw como servidor MCP

Este é o caminho `openclaw mcp serve`.

### Quando usar `serve`

Use `openclaw mcp serve` quando:

- Codex, Claude Code ou outro cliente MCP deve conversar diretamente com conversas de canais com suporte do OpenClaw
- você já tem um Gateway OpenClaw local ou remoto com sessões roteadas
- você quer um servidor MCP que funcione em todos os backends de canais do OpenClaw em vez de executar pontes separadas por canal

Use [`openclaw acp`](/pt-BR/cli/acp) em vez disso quando o OpenClaw deve hospedar ele mesmo o runtime de codificação e manter a sessão do agente dentro do OpenClaw.

### Como funciona

`openclaw mcp serve` inicia um servidor MCP stdio. O cliente MCP é dono desse processo. Enquanto o cliente mantém a sessão stdio aberta, a ponte se conecta a um Gateway OpenClaw local ou remoto por WebSocket e expõe conversas de canais roteadas por MCP.

<Steps>
  <Step title="Client spawns the bridge">
    O cliente MCP inicia `openclaw mcp serve`.
  </Step>
  <Step title="Bridge connects to Gateway">
    A ponte se conecta ao Gateway OpenClaw por WebSocket.
  </Step>
  <Step title="Sessions become MCP conversations">
    Sessões roteadas se tornam conversas MCP e ferramentas de transcrição/histórico.
  </Step>
  <Step title="Live events queue">
    Eventos ao vivo são enfileirados em memória enquanto a ponte está conectada.
  </Step>
  <Step title="Optional Claude push">
    Se o modo de canal Claude estiver habilitado, a mesma sessão também pode receber notificações push específicas do Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - o estado da fila ao vivo começa quando a ponte se conecta
    - o histórico de transcrições mais antigas é lido com `messages_read`
    - notificações push do Claude só existem enquanto a sessão MCP está ativa
    - quando o cliente se desconecta, a ponte encerra e a fila ao vivo desaparece
    - pontos de entrada de agente de uso único, como `openclaw agent` e `openclaw infer model run`, encerram quaisquer runtimes MCP empacotados que abrem quando a resposta é concluída, para que execuções repetidas por script não acumulem processos filhos MCP stdio
    - servidores MCP stdio iniciados pelo OpenClaw (empacotados ou configurados pelo usuário) são encerrados como uma árvore de processos no desligamento, portanto subprocessos filhos iniciados pelo servidor não sobrevivem depois que o cliente stdio pai sai
    - excluir ou redefinir uma sessão descarta os clientes MCP dessa sessão pelo caminho compartilhado de limpeza de runtime, portanto não há conexões stdio remanescentes vinculadas a uma sessão removida

  </Accordion>
</AccordionGroup>

### Escolha um modo de cliente

Use a mesma ponte de duas formas diferentes:

<Tabs>
  <Tab title="Generic MCP clients">
    Apenas ferramentas MCP padrão. Use `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` e as ferramentas de aprovação.
  </Tab>
  <Tab title="Claude Code">
    Ferramentas MCP padrão mais o adaptador de canal específico do Claude. Habilite `--claude-channel-mode on` ou mantenha o padrão `auto`.
  </Tab>
</Tabs>

<Note>
Hoje, `auto` se comporta da mesma forma que `on`. Ainda não há detecção de capacidade do cliente.
</Note>

### O que `serve` expõe

A ponte usa metadados de rota de sessão existentes do Gateway para expor conversas com suporte de canal. Uma conversa aparece quando o OpenClaw já tem estado de sessão com uma rota conhecida, como:

- `channel`
- metadados de destinatário ou destino
- `accountId` opcional
- `threadId` opcional

Isso dá aos clientes MCP um lugar para:

- listar conversas roteadas recentes
- ler o histórico de transcrição recente
- aguardar novos eventos de entrada
- enviar uma resposta pela mesma rota
- ver solicitações de aprovação que chegam enquanto a ponte está conectada

### Uso

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Ferramentas da ponte

A ponte atual expõe estas ferramentas MCP:

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
    Retorna uma conversa por `session_key` usando uma busca direta de sessão no Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Lê mensagens de transcrição recentes para uma conversa com suporte de sessão.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrai blocos de conteúdo de mensagem que não são texto de uma mensagem de transcrição. Esta é uma visualização de metadados sobre conteúdo de transcrição, não um armazenamento independente e durável de blobs de anexo.
  </Accordion>
  <Accordion title="events_poll">
    Lê eventos ao vivo enfileirados desde um cursor numérico.
  </Accordion>
  <Accordion title="events_wait">
    Faz long-polling até que o próximo evento enfileirado correspondente chegue ou um tempo limite expire.

    Use isto quando um cliente MCP genérico precisa de entrega quase em tempo real sem um protocolo push específico do Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envia texto de volta pela mesma rota já registrada na sessão.

    Comportamento atual:

    - exige uma rota de conversa existente
    - usa o canal, destinatário, ID da conta e ID da thread da sessão
    - envia apenas texto

  </Accordion>
  <Accordion title="permissions_list_open">
    Lista solicitações pendentes de aprovação de exec/Plugin que a ponte observou desde que se conectou ao Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Resolve uma solicitação pendente de aprovação de exec/Plugin com:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modelo de eventos

A ponte mantém uma fila de eventos em memória enquanto está conectada.

Tipos de evento atuais:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- a fila é apenas ao vivo; ela começa quando a ponte MCP inicia
- `events_poll` e `events_wait` não reproduzem histórico antigo do Gateway por conta própria
- o backlog durável deve ser lido com `messages_read`

</Warning>

### Notificações de canal Claude

A ponte também pode expor notificações de canal específicas do Claude. Este é o equivalente do OpenClaw a um adaptador de canal Claude Code: as ferramentas MCP padrão continuam disponíveis, mas mensagens de entrada ao vivo também podem chegar como notificações MCP específicas do Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: apenas ferramentas MCP padrão.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: habilita notificações de canal Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: padrão atual; mesmo comportamento de ponte que `on`.
  </Tab>
</Tabs>

Quando o modo de canal Claude está habilitado, o servidor anuncia capacidades experimentais do Claude e pode emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento atual da ponte:

- mensagens de transcrição `user` de entrada são encaminhadas como `notifications/claude/channel`
- solicitações de permissão do Claude recebidas por MCP são rastreadas em memória
- se a conversa vinculada depois enviar `yes abcde` ou `no abcde`, a ponte converte isso para `notifications/claude/channel/permission`
- essas notificações existem apenas na sessão ao vivo; se o cliente MCP se desconectar, não há destino de push

Isso é intencionalmente específico do cliente. Clientes MCP genéricos devem depender das ferramentas padrão de polling.

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
  Ler token do arquivo.
</ParamField>
<ParamField path="--password" type="string">
  Senha do Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Ler senha do arquivo.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Modo de notificação do Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Logs detalhados em stderr.
</ParamField>

<Tip>
Prefira `--token-file` ou `--password-file` a segredos em linha quando possível.
</Tip>

### Limite de segurança e confiança

A ponte não inventa roteamento. Ela apenas expõe conversas que o Gateway já sabe rotear.

Isso significa que:

- listas de permissão de remetentes, emparelhamento e confiança no nível do canal ainda pertencem à configuração subjacente do canal OpenClaw
- `messages_send` só pode responder por uma rota armazenada existente
- o estado de aprovação fica ativo/em memória apenas para a sessão atual da ponte
- a autenticação da ponte deve usar os mesmos controles de token ou senha do Gateway nos quais você confiaria para qualquer outro cliente remoto do Gateway

Se uma conversa estiver ausente em `conversations_list`, a causa usual não é a configuração MCP. É metadado de rota ausente ou incompleto na sessão subjacente do Gateway.

### Testes

O OpenClaw inclui um smoke determinístico em Docker para esta ponte:

```bash
pnpm test:docker:mcp-channels
```

Esse smoke:

- inicia um contêiner do Gateway com dados semeados
- inicia um segundo contêiner que executa `openclaw mcp serve`
- verifica descoberta de conversas, leituras de transcritos, leituras de metadados de anexos, comportamento da fila de eventos ao vivo e roteamento de envio de saída
- valida notificações de canal e permissão no estilo Claude pela ponte MCP stdio real

Essa é a maneira mais rápida de provar que a ponte funciona sem conectar uma conta real do Telegram, Discord ou iMessage à execução de teste.

Para um contexto mais amplo de testes, consulte [Testes](/pt-BR/help/testing).

### Solução de problemas

<AccordionGroup>
  <Accordion title="Nenhuma conversa retornada">
    Geralmente significa que a sessão do Gateway ainda não é roteável. Confirme que a sessão subjacente tem metadados armazenados de rota de canal/provedor, destinatário e conta/thread opcional.
  </Accordion>
  <Accordion title="events_poll ou events_wait perde mensagens antigas">
    Esperado. A fila ao vivo começa quando a ponte se conecta. Leia o histórico de transcritos mais antigo com `messages_read`.
  </Accordion>
  <Accordion title="As notificações do Claude não aparecem">
    Verifique tudo isto:

    - o cliente manteve a sessão MCP stdio aberta
    - `--claude-channel-mode` está `on` ou `auto`
    - o cliente realmente entende os métodos de notificação específicos do Claude
    - a mensagem de entrada aconteceu depois que a ponte se conectou

  </Accordion>
  <Accordion title="As aprovações estão ausentes">
    `permissions_list_open` mostra apenas solicitações de aprovação observadas enquanto a ponte estava conectada. Ela não é uma API durável de histórico de aprovações.
  </Accordion>
</AccordionGroup>

## OpenClaw como registro de clientes MCP

Este é o caminho de `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` e `unset`.

Esses comandos não expõem o OpenClaw por MCP. Eles gerenciam definições de servidores MCP gerenciadas pelo OpenClaw em `mcp.servers` na configuração do OpenClaw. Eles não leem servidores mcporter de `config/mcporter.json`.

Essas definições salvas são para runtimes que o OpenClaw inicia ou configura depois, como o OpenClaw incorporado e outros adaptadores de runtime. O OpenClaw armazena as definições centralmente para que esses runtimes não precisem manter suas próprias listas duplicadas de servidores MCP.

<AccordionGroup>
  <Accordion title="Comportamento importante">
    - estes comandos apenas leem ou gravam a configuração do OpenClaw
    - `status`, `list`, `show`, `doctor` sem `--probe`, `set`, `configure`, `tools`, `logout`, `reload` e `unset` não se conectam ao servidor MCP de destino
    - `login` executa o fluxo de rede OAuth do MCP para o servidor HTTP configurado e salva as credenciais locais resultantes
    - `status --verbose` imprime dicas resolvidas de transporte, autenticação, timeout, filtro e chamadas de ferramentas paralelas sem se conectar
    - `doctor` verifica definições salvas em busca de problemas de configuração local, como comandos stdio ausentes, diretórios de trabalho inválidos, arquivos TLS ausentes, servidores desativados, valores literais sensíveis de cabeçalho/env e autorização OAuth incompleta
    - `doctor --probe` adiciona a mesma prova de conexão ao vivo que `probe` depois que as verificações estáticas passam
    - `probe` conecta ao servidor selecionado ou a todos os servidores configurados, lista ferramentas e relata capacidades/diagnósticos
    - `add` cria uma definição a partir de flags e faz probe antes de salvar, a menos que `--no-probe` esteja definido ou a autorização OAuth seja necessária primeiro
    - adaptadores de runtime decidem quais formatos de transporte eles realmente aceitam no momento da execução
    - `enabled: false` mantém um servidor salvo, mas o exclui da descoberta de runtime incorporado
    - `timeout` e `connectTimeout` definem timeouts de solicitação e conexão por servidor em segundos
    - `supportsParallelToolCalls: true` marca servidores que adaptadores podem chamar simultaneamente
    - servidores HTTP podem usar cabeçalhos estáticos, login OAuth, controle de verificação TLS e caminhos de certificado/chave mTLS
    - o OpenClaw incorporado expõe ferramentas MCP configuradas nos perfis normais de ferramentas `coding` e `messaging`; `minimal` ainda as oculta, e `tools.deny: ["bundle-mcp"]` as desativa explicitamente
    - `toolFilter.include` e `toolFilter.exclude` por servidor filtram ferramentas MCP descobertas antes que elas se tornem ferramentas do OpenClaw
    - servidores que anunciam recursos ou prompts também expõem ferramentas utilitárias para listar/ler recursos e listar/buscar prompts; esses nomes utilitários gerados (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) usam o mesmo filtro include/exclude
    - alterações dinâmicas na lista de ferramentas MCP invalidam o catálogo em cache dessa sessão; a próxima descoberta/uso atualiza a partir do servidor
    - falhas repetidas de solicitação/protocolo de ferramentas MCP pausam esse servidor brevemente para que um servidor quebrado não consuma todo o turno
    - runtimes MCP empacotados com escopo de sessão são coletados após `mcp.sessionIdleTtlMs` milissegundos de inatividade (padrão de 10 minutos; defina `0` para desativar), e execuções incorporadas de uso único os limpam ao fim da execução

  </Accordion>
</AccordionGroup>

Adaptadores de runtime podem normalizar esse registro compartilhado para o formato esperado pelo cliente downstream. Por exemplo, o OpenClaw incorporado consome valores `transport` do OpenClaw diretamente, enquanto Claude Code e Gemini recebem valores `type` nativos de CLI, como `http`, `sse` ou `stdio`.

O Codex app-server também respeita um bloco opcional `codex` em cada servidor. Isso é
metadado de projeção do OpenClaw apenas para threads do Codex app-server; ele não
altera sessões ACP, configuração genérica do harness Codex ou outros adaptadores de runtime.
Use `codex.agents` não vazio para projetar um servidor apenas em ids específicos de agentes
OpenClaw. Listas de agentes vazias, em branco ou inválidas são rejeitadas pela validação de
configuração e omitidas pelo caminho de projeção de runtime em vez de se tornarem
globais. Use `codex.defaultToolsApprovalMode` (`auto`, `prompt` ou `approve`)
para emitir o `default_tools_approval_mode` nativo do Codex para um servidor confiável.
O OpenClaw remove os metadados `codex` antes de entregar a configuração nativa `mcp_servers`
ao Codex.

### Definições salvas de servidores MCP

O OpenClaw também armazena um registro leve de servidores MCP na configuração para superfícies que querem definições MCP gerenciadas pelo OpenClaw.

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

Notas:

- `list` ordena nomes de servidores.
- `show` sem um nome imprime o objeto completo de servidor MCP configurado.
- `status` classifica transportes configurados sem se conectar. `--verbose` inclui detalhes resolvidos de inicialização, timeout, OAuth, filtro e chamadas paralelas.
- `doctor` executa verificações estáticas sem se conectar. Adicione `--probe` quando o comando também deve verificar que servidores habilitados se conectam.
- `probe` conecta e relata contagens de ferramentas, suporte a recursos/prompts, suporte a alterações de lista e diagnósticos.
- `add` aceita flags stdio como `--command`, `--arg`, `--env` e `--cwd`, ou flags HTTP como `--url`, `--transport`, `--header`, `--auth oauth`, TLS, timeout e seleção de ferramentas.
- `set` espera um valor de objeto JSON na linha de comando.
- `configure` atualiza habilitação, filtros de ferramentas, timeouts, OAuth, TLS e dicas de chamadas de ferramentas paralelas sem substituir a definição inteira do servidor.
- `tools` atualiza filtros de ferramentas por servidor. Entradas include/exclude são nomes de ferramentas MCP e globs simples `*`.
- `login` executa o fluxo OAuth para servidores HTTP configurados com `auth: "oauth"`. A primeira execução imprime uma URL de autorização; execute novamente com `--code` após a aprovação.
- `logout` limpa credenciais OAuth armazenadas do servidor nomeado sem remover a definição de servidor salva.
- `reload` descarta runtimes MCP em processo em cache. Processos do Gateway ou de agente em outro processo ainda precisam do próprio caminho de recarregamento ou reinício.
- Use `transport: "streamable-http"` para servidores MCP Streamable HTTP. `openclaw mcp set` também normaliza `type: "http"` nativo de CLI para o mesmo formato de configuração canônica por compatibilidade.
- `unset` falha se o servidor nomeado não existir.

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

### Receitas comuns de servidor

Estes exemplos salvam apenas definições de servidor. Execute `openclaw mcp doctor --probe` depois para provar que o servidor inicia e expõe ferramentas.

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

    Restrinja servidores de sistema de arquivos à menor árvore de diretórios que o agente deve ler ou editar.

  </Tab>
  <Tab title="Memória">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Use um filtro de ferramentas se o servidor expuser ferramentas de escrita que não devem estar disponíveis para agentes normais.

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

    `doctor` verifica que `cwd` existe e que o comando resolve a partir do ambiente configurado.

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

    Use OAuth quando o servidor remoto for compatível. Se o servidor exigir cabeçalhos estáticos, evite fazer commit de tokens bearer literais.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Servidores diretos de controle de desktop herdam as permissões do processo que eles iniciam. Use filtros de ferramentas restritos e prompts de permissão no nível do sistema operacional.

  </Tab>
</Tabs>

### Formatos de saída JSON

Use `--json` para scripts e dashboards. Os conjuntos de campos podem crescer com o tempo, portanto os consumidores devem ignorar chaves desconhecidas.

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
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` sai com código diferente de zero quando qualquer servidor verificado e habilitado tem um erro. Avisos são relatados, mas não fazem o comando falhar por si só.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
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

    `probe` abre uma sessão ativa de cliente MCP. Use-o para comprovar alcance e capacidade, não para auditorias de configuração estática.

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

| Campo                      | Descrição                              |
| -------------------------- | -------------------------------------- |
| `command`                  | Executável a iniciar (obrigatório)     |
| `args`                     | Array de argumentos de linha de comando |
| `env`                      | Variáveis de ambiente adicionais       |
| `cwd` / `workingDirectory` | Diretório de trabalho para o processo  |

<Warning>
**Filtro de segurança de env stdio**

O OpenClaw rejeita chaves de env de inicialização de interpretador que podem alterar como um servidor MCP stdio é iniciado antes do primeiro RPC, mesmo que elas apareçam no bloco `env` de um servidor. Chaves bloqueadas incluem `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` e variáveis semelhantes de controle de runtime. A inicialização rejeita essas chaves com um erro de configuração para que elas não possam injetar um prelúdio implícito, trocar o interpretador, habilitar um depurador ou redirecionar a saída de runtime contra o processo stdio. Variáveis de credenciais, proxy e específicas do servidor comuns (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizado etc.) não são afetadas.

Se o seu servidor MCP realmente precisar de uma das variáveis bloqueadas, defina-a no processo host do Gateway em vez de sob o `env` do servidor stdio.
</Warning>

### Transporte SSE / HTTP

Conecta-se a um servidor MCP remoto por HTTP Server-Sent Events.

| Campo                          | Descrição                                                                 |
| ------------------------------ | ------------------------------------------------------------------------- |
| `url`                          | URL HTTP ou HTTPS do servidor remoto (obrigatório)                        |
| `headers`                      | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens auth) |
| `connectionTimeoutMs`          | Tempo limite de conexão por servidor em ms (opcional)                     |
| `connectTimeout`               | Tempo limite de conexão por servidor em segundos (opcional)               |
| `timeout` / `requestTimeoutMs` | Tempo limite de solicitação MCP por servidor em segundos ou ms            |
| `auth: "oauth"`                | Use armazenamento de token OAuth do MCP e `openclaw mcp login`            |
| `sslVerify`                    | Defina como false apenas para endpoints HTTPS privados explicitamente confiáveis |
| `clientCert` / `clientKey`     | Caminhos do certificado de cliente mTLS e da chave                        |
| `supportsParallelToolCalls`    | Indica que chamadas concorrentes são seguras para este servidor           |

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

Valores sensíveis em `url` (userinfo) e `headers` são redigidos em logs e na saída de status. `openclaw mcp doctor` avisa quando entradas de `headers` ou `env` com aparência sensível contêm valores literais, para que operadores possam mover esses valores para fora da configuração com commit.

### Fluxo de trabalho OAuth

OAuth é para servidores MCP HTTP que anunciam o fluxo OAuth do MCP. Cabeçalhos `Authorization` estáticos são ignorados para um servidor enquanto `auth: "oauth"` está habilitado.

<Steps>
  <Step title="Salvar o servidor">
    Adicione ou atualize o servidor com `auth: "oauth"` e quaisquer metadados OAuth opcionais.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Iniciar login">
    Execute login para criar a solicitação de autorização.

    ```bash
    openclaw mcp login docs
    ```

    O OpenClaw imprime a URL de autorização e armazena o estado temporário do verificador OAuth no diretório de estado do OpenClaw.

  </Step>
  <Step title="Concluir com o código">
    Depois de aprovar no navegador, passe o código retornado de volta para o OpenClaw.

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
    Logout remove as credenciais OAuth armazenadas, mas mantém a definição de servidor salva.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Se o provedor rotacionar tokens ou o estado de autorização travar, execute `openclaw mcp logout <name>` e repita `login`. `logout` pode limpar credenciais de um servidor HTTP salvo mesmo depois que `auth: "oauth"` for removido da configuração, desde que o nome e a URL do servidor ainda identifiquem a entrada do armazenamento de credenciais.

### Transporte HTTP streamable

`streamable-http` é uma opção de transporte adicional junto com `sse` e `stdio`. Ele usa streaming HTTP para comunicação bidirecional com servidores MCP remotos.

| Campo                          | Descrição                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `url`                          | URL HTTP ou HTTPS do servidor remoto (obrigatório)                                         |
| `transport`                    | Defina como `"streamable-http"` para selecionar este transporte; quando omitido, o OpenClaw usa `sse` |
| `headers`                      | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens auth)                 |
| `connectionTimeoutMs`          | Tempo limite de conexão por servidor em ms (opcional)                                      |
| `connectTimeout`               | Tempo limite de conexão por servidor em segundos (opcional)                                |
| `timeout` / `requestTimeoutMs` | Tempo limite de solicitação MCP por servidor em segundos ou ms                             |
| `auth: "oauth"`                | Use armazenamento de token OAuth do MCP e `openclaw mcp login`                             |
| `sslVerify`                    | Defina como false apenas para endpoints HTTPS privados explicitamente confiáveis            |
| `clientCert` / `clientKey`     | Caminhos do certificado de cliente mTLS e da chave                                         |
| `supportsParallelToolCalls`    | Indica que chamadas concorrentes são seguras para este servidor                            |

A configuração do OpenClaw usa `transport: "streamable-http"` como grafia canônica. Valores MCP nativos da CLI `type: "http"` são aceitos quando salvos por `openclaw mcp set` e reparados por `openclaw doctor --fix` na configuração existente, mas `transport` é o que o OpenClaw incorporado consome diretamente.

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
Comandos de registro não iniciam a ponte do canal. Somente `probe` e `doctor --probe` abrem uma sessão ativa de cliente MCP para comprovar que o servidor de destino está acessível.
</Note>

## UI de controle

A UI de controle no navegador inclui uma página dedicada de configurações MCP em `/mcp`. Ela mostra contagens de servidores configurados, resumos de habilitado/OAuth/filtro, linhas de transporte por servidor, controles de habilitar/desabilitar, comandos CLI comuns e um editor com escopo para a seção de configuração `mcp`.

Use a página para edições de operador e inventário rápido. Use `openclaw mcp doctor --probe` ou `openclaw mcp probe` quando precisar de comprovação ativa do servidor.

Fluxo de trabalho do operador:

1. Abra a UI de Controle e escolha **MCP**.
2. Revise os cartões de resumo para servidores totais, habilitados, OAuth e filtrados.
3. Use cada linha de servidor para dicas de transporte, autenticação, filtro, tempo limite e comando.
4. Alterne a habilitação quando quiser manter uma definição, mas excluí-la da descoberta em runtime.
5. Edite a seção de configuração `mcp` com escopo para alterações estruturais, como novos servidores, cabeçalhos, TLS, metadados OAuth ou filtros de ferramentas.
6. Escolha **Salvar** para persistir apenas a configuração, ou **Salvar e Publicar** para aplicar pelo caminho de configuração do Gateway.
7. Execute `openclaw mcp doctor --probe` quando precisar de prova ao vivo de que o servidor editado inicia e lista ferramentas.

Notas:

- trechos de comando colocam nomes de servidores entre aspas para que nomes incomuns continuem copiáveis em um shell
- valores exibidos semelhantes a URLs são redigidos antes da renderização quando contêm credenciais embutidas
- a página não inicia transportes MCP por si só
- runtimes ativos podem precisar de `openclaw mcp reload`, publicação da configuração do Gateway ou reinício do processo, dependendo de qual processo é proprietário dos clientes MCP

## Limites atuais

Esta página documenta a ponte como enviada hoje.

Limites atuais:

- a descoberta de conversas depende dos metadados existentes de rota de sessão do Gateway
- ainda não há protocolo de push genérico além do adaptador específico do Claude
- ainda não há ferramentas de edição de mensagem ou reação
- o transporte HTTP/SSE/streamable-http se conecta a um único servidor remoto; ainda não há upstream multiplexado
- `permissions_list_open` inclui apenas aprovações observadas enquanto a ponte está conectada

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Plugins](/pt-BR/cli/plugins)
