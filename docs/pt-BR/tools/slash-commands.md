---
read_when:
    - Usando ou configurando comandos de chat
    - Depurando roteamento de comandos ou permissões
sidebarTitle: Slash commands
summary: 'Comandos de barra: texto vs nativos, configuração e comandos compatíveis'
title: Comandos de barra
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:39:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

Os comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **autônoma** que começa com `/`. O comando de chat bash somente no host usa `! <cmd>` (com `/bash <cmd>` como alias).

Quando uma conversa ou thread está vinculada a uma sessão ACP, o texto de acompanhamento normal é roteado para esse harness ACP. Os comandos de gerenciamento do Gateway continuam locais: `/acp ...` sempre chega ao manipulador de comandos ACP do OpenClaw, e `/status` mais `/unfocus` permanecem locais sempre que o tratamento de comandos estiver habilitado para a superfície.

Há dois sistemas relacionados:

<AccordionGroup>
  <Accordion title="Comandos">
    Mensagens autônomas `/...`.
  </Accordion>
  <Accordion title="Diretivas">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - As diretivas são removidas da mensagem antes que o modelo a veja.
    - Em mensagens normais de chat (não apenas com diretivas), elas são tratadas como "dicas inline" e **não** persistem as configurações da sessão.
    - Em mensagens somente com diretivas (a mensagem contém apenas diretivas), elas persistem na sessão e respondem com uma confirmação.
    - As diretivas são aplicadas apenas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, ele será a única allowlist usada; caso contrário, a autorização vem das allowlists/emparelhamento do canal mais `commands.useAccessGroups`. Remetentes não autorizados veem as diretivas tratadas como texto simples.

  </Accordion>
  <Accordion title="Atalhos inline">
    Apenas remetentes em allowlist/autorizados: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Eles são executados imediatamente, são removidos antes que o modelo veja a mensagem, e o texto restante continua pelo fluxo normal.

  </Accordion>
</AccordionGroup>

## Configuração

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  Habilita a análise de `/...` em mensagens de chat. Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), os comandos de texto ainda funcionam mesmo se você definir isso como `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Auto: ativado para Discord/Telegram; desativado para Slack (até você adicionar slash commands); ignorado para provedores sem suporte nativo. Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para substituir por provedor (bool ou `"auto"`). `false` limpa os comandos registrados anteriormente no Discord/Telegram na inicialização. Os comandos do Slack são gerenciados no app do Slack e não são removidos automaticamente.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de **skill** de forma nativa quando houver suporte. Auto: ativado para Discord/Telegram; desativado para Slack (o Slack exige a criação de um slash command por skill). Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para substituir por provedor (bool ou `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para executar comandos do shell do host (`/bash <cmd>` é um alias; requer allowlists de `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controla quanto tempo o bash espera antes de alternar para o modo em segundo plano (`0` envia imediatamente para segundo plano).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lê/grava `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lê/grava a configuração MCP gerenciada pelo OpenClaw em `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descoberta/status de plugins mais controles de instalação e habilitação/desabilitação).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (substituições somente em tempo de execução).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` mais ações da ferramenta de reinicialização do gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Define a allowlist explícita do proprietário para superfícies de comando/ferramenta exclusivas do proprietário. Separada de `commands.allowFrom`.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: faz com que comandos exclusivos do proprietário exijam **identidade do proprietário** para serem executados nessa superfície. Quando `true`, o remetente deve corresponder a um candidato de proprietário resolvido (por exemplo, uma entrada em `commands.ownerAllowFrom` ou metadados de proprietário nativos do provedor) ou ter o escopo interno `operator.admin` em um canal de mensagens internas. Uma entrada curinga na `allowFrom` do canal, ou uma lista de candidatos de proprietário vazia/não resolvida, **não** é suficiente — comandos exclusivos do proprietário falham com bloqueio nesse canal. Deixe isso desativado se quiser que os comandos exclusivos do proprietário sejam controlados apenas por `ownerAllowFrom` e pelas allowlists padrão de comandos.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla como os IDs do proprietário aparecem no prompt do sistema.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcionalmente define o segredo HMAC usado quando `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist por provedor para autorização de comandos. Quando configurada, ela é a única fonte de autorização para comandos e diretivas (allowlists/emparelhamento do canal e `commands.useAccessGroups` são ignorados). Use `"*"` para um padrão global; chaves específicas do provedor têm prioridade.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Impõe allowlists/políticas para comandos quando `commands.allowFrom` não está definido.
</ParamField>

## Lista de comandos

Fonte da verdade atual:

- os built-ins do core vêm de `src/auto-reply/commands-registry.shared.ts`
- os comandos dock gerados vêm de `src/auto-reply/commands-registry.data.ts`
- os comandos de plugin vêm de chamadas `registerCommand()` do plugin
- a disponibilidade real no seu gateway ainda depende de flags de configuração, da superfície do canal e dos plugins instalados/habilitados

### Comandos built-in do core

<AccordionGroup>
  <Accordion title="Sessões e execuções">
    - `/new [model]` inicia uma nova sessão; `/reset` é o alias de redefinição.
    - `/reset soft [message]` mantém a transcrição atual, remove os IDs de sessão do backend CLI reutilizados e executa novamente o carregamento de inicialização/prompt do sistema no mesmo lugar.
    - `/compact [instructions]` faz a Compaction do contexto da sessão. Consulte [Compaction](/pt-BR/concepts/compaction).
    - `/stop` aborta a execução atual.
    - `/session idle <duration|off>` e `/session max-age <duration|off>` gerenciam a expiração do vínculo da thread.
    - `/export-session [path]` exporta a sessão atual para HTML. Alias: `/export`.
    - `/export-trajectory [path]` exporta um [bundle de trajetória](/pt-BR/tools/trajectory) JSONL para a sessão atual. Alias: `/trajectory`.
  </Accordion>
  <Accordion title="Modelo e controles de execução">
    - `/think <level>` define o nível de pensamento. As opções vêm do perfil do provedor do modelo ativo; níveis comuns são `off`, `minimal`, `low`, `medium` e `high`, com níveis personalizados como `xhigh`, `adaptive`, `max` ou binário `on` apenas quando houver suporte. Aliases: `/thinking`, `/t`.
    - `/verbose on|off|full` alterna a saída detalhada. Alias: `/v`.
    - `/trace on|off` alterna a saída de rastreamento de plugin para a sessão atual.
    - `/fast [status|on|off]` mostra ou define o modo rápido.
    - `/reasoning [on|off|stream]` alterna a visibilidade do raciocínio. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` alterna o modo elevado. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra ou define padrões de execução.
    - `/model [name|#|status]` mostra ou define o modelo.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` lista provedores ou modelos de um provedor.
    - `/queue <mode>` gerencia o comportamento da fila (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) mais opções como `debounce:2s cap:25 drop:summarize`.
  </Accordion>
  <Accordion title="Descoberta e status">
    - `/help` mostra o resumo curto de ajuda.
    - `/commands` mostra o catálogo gerado de comandos.
    - `/tools [compact|verbose]` mostra o que o agente atual pode usar neste momento.
    - `/status` mostra o status de execução/runtime, incluindo rótulos `Execution`/`Runtime` e uso/cota do provedor quando disponível.
    - `/crestodian <request>` executa o assistente de configuração e reparo Crestodian a partir de uma DM do proprietário.
    - `/tasks` lista tarefas ativas/recentes em segundo plano para a sessão atual.
    - `/context [list|detail|json]` explica como o contexto é montado.
    - `/whoami` mostra seu ID de remetente. Alias: `/id`.
    - `/usage off|tokens|full|cost` controla o rodapé de uso por resposta ou imprime um resumo local de custo.
  </Accordion>
  <Accordion title="Skills, allowlists, aprovações">
    - `/skill <name> [input]` executa uma skill pelo nome.
    - `/allowlist [list|add|remove] ...` gerencia entradas da allowlist. Somente texto.
    - `/approve <id> <decision>` resolve prompts de aprovação de execução.
    - `/btw <question>` faz uma pergunta paralela sem alterar o contexto futuro da sessão. Consulte [BTW](/pt-BR/tools/btw).
  </Accordion>
  <Accordion title="Subagentes e ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gerencia execuções de subagentes para a sessão atual.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gerencia sessões ACP e opções de runtime.
    - `/focus <target>` vincula a thread atual do Discord ou o tópico/conversa do Telegram a um alvo de sessão.
    - `/unfocus` remove o vínculo atual.
    - `/agents` lista agentes vinculados à thread para a sessão atual.
    - `/kill <id|#|all>` aborta um ou todos os subagentes em execução.
    - `/steer <id|#> <message>` envia orientação a um subagente em execução. Alias: `/tell`.
  </Accordion>
  <Accordion title="Gravações exclusivas do proprietário e administração">
    - `/config show|get|set|unset` lê ou grava `openclaw.json`. Exclusivo do proprietário. Requer `commands.config: true`.
    - `/mcp show|get|set|unset` lê ou grava a configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`. Exclusivo do proprietário. Requer `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspeciona ou altera o estado do plugin. `/plugin` é um alias. Exclusivo do proprietário para gravações. Requer `commands.plugins: true`.
    - `/debug show|set|unset|reset` gerencia substituições de configuração somente em tempo de execução. Exclusivo do proprietário. Requer `commands.debug: true`.
    - `/restart` reinicia o OpenClaw quando habilitado. Padrão: habilitado; defina `commands.restart: false` para desabilitá-lo.
    - `/send on|off|inherit` define a política de envio. Exclusivo do proprietário.
  </Accordion>
  <Accordion title="Voz, TTS, controle de canal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controla TTS. Consulte [TTS](/pt-BR/tools/tts).
    - `/activation mention|always` define o modo de ativação em grupo.
    - `/bash <command>` executa um comando do shell do host. Somente texto. Alias: `! <command>`. Requer `commands.bash: true` mais allowlists de `tools.elevated`.
    - `!poll [sessionId]` verifica um trabalho bash em segundo plano.
    - `!stop [sessionId]` interrompe um trabalho bash em segundo plano.
  </Accordion>
</AccordionGroup>

### Comandos dock gerados

Os comandos dock são gerados a partir de plugins de canal com suporte a comandos nativos. Conjunto incluído atual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugin incluídos

Plugins incluídos podem adicionar mais slash commands. Comandos incluídos atualmente neste repositório:

- `/dreaming [on|off|status|help]` alterna o Dreaming da memória. Consulte [Dreaming](/pt-BR/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gerencia o fluxo de emparelhamento/configuração de dispositivo. Consulte [Emparelhamento](/pt-BR/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporariamente comandos de Node de telefone de alto risco.
- `/voice status|list [limit]|set <voiceId|name>` gerencia a configuração de voz do Talk. No Discord, o nome do comando nativo é `/talkvoice`.
- `/card ...` envia predefinições de rich card do LINE. Consulte [LINE](/pt-BR/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspeciona e controla o harness app-server Codex incluído. Consulte [Harness Codex](/pt-BR/plugins/codex-harness).
- Comandos somente do QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinâmicos de skill

Skills invocáveis pelo usuário também são expostas como slash commands:

- `/skill <name> [input]` sempre funciona como ponto de entrada genérico.
- as skills também podem aparecer como comandos diretos como `/prose` quando a skill/plugin as registra.
- o registro de comando nativo de skill é controlado por `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Observações sobre argumentos e parser">
    - Os comandos aceitam um `:` opcional entre o comando e os argumentos (por exemplo, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência difusa); se não houver correspondência, o texto será tratado como corpo da mensagem.
    - Para um detalhamento completo do uso por provedor, use `openclaw status --usage`.
    - `/allowlist add|remove` requer `commands.config=true` e respeita `configWrites` do canal.
    - Em canais com várias contas, `/allowlist --account <id>` direcionado à configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
    - `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo local de custo dos logs de sessão do OpenClaw.
    - `/restart` é habilitado por padrão; defina `commands.restart: false` para desabilitá-lo.
    - `/plugins install <spec>` aceita as mesmas especificações de plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
    - `/plugins enable|disable` atualiza a configuração do plugin e pode solicitar uma reinicialização.
  </Accordion>
  <Accordion title="Comportamento específico por canal">
    - Comando nativo somente do Discord: `/vc join|leave|status` controla canais de voz (não disponível como texto). `join` requer uma guild e um canal de voz/stage selecionado. Requer `channels.discord.voice` e comandos nativos.
    - Comandos de vínculo de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que os vínculos efetivos de thread estejam habilitados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
    - Referência de comando ACP e comportamento em runtime: [Agentes ACP](/pt-BR/tools/acp-agents).
  </Accordion>
  <Accordion title="Segurança de verbose / trace / fast / reasoning">
    - `/verbose` é destinado a depuração e visibilidade extra; mantenha-o **desativado** no uso normal.
    - `/trace` é mais restrito que `/verbose`: ele revela apenas linhas de rastreamento/depuração pertencentes ao plugin e mantém desativado o ruído normal detalhado de ferramentas.
    - `/fast on|off` persiste uma substituição da sessão. Use a opção `inherit` na interface de Sessões para limpá-la e voltar aos padrões da configuração.
    - `/fast` é específico por provedor: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints nativos de Responses, enquanto solicitações públicas diretas ao Anthropic, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Consulte [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
    - Resumos de falha de ferramenta ainda são mostrados quando relevantes, mas texto detalhado da falha só é incluído quando `/verbose` está `on` ou `full`.
    - `/reasoning`, `/verbose` e `/trace` são arriscados em configurações de grupo: eles podem revelar raciocínio interno, saída de ferramentas ou diagnósticos de plugin que você não pretendia expor. Prefira deixá-los desativados, especialmente em chats de grupo.
  </Accordion>
  <Accordion title="Troca de modelo">
    - `/model` persiste imediatamente o novo modelo da sessão.
    - Se o agente estiver ocioso, a próxima execução o usará imediatamente.
    - Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto limpo de nova tentativa.
    - Se a atividade da ferramenta ou a saída da resposta já tiver começado, a troca pendente pode ficar na fila até uma oportunidade posterior de nova tentativa ou o próximo turno do usuário.
    - No TUI local, `/crestodian [request]` retorna do TUI normal do agente para o Crestodian. Isso é separado do modo de resgate do canal de mensagens e não concede autoridade remota de configuração.
  </Accordion>
  <Accordion title="Caminho rápido e atalhos inline">
    - **Caminho rápido:** mensagens somente de comando de remetentes em allowlist são tratadas imediatamente (ignoram fila + modelo).
    - **Bloqueio por menção em grupo:** mensagens somente de comando de remetentes em allowlist ignoram requisitos de menção.
    - **Atalhos inline (somente remetentes em allowlist):** certos comandos também funcionam quando incorporados em uma mensagem normal e são removidos antes que o modelo veja o restante da mensagem.
      - Exemplo: `hey /status` aciona uma resposta de status, e o texto restante continua pelo fluxo normal.
    - Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Mensagens somente de comando não autorizadas são ignoradas silenciosamente, e tokens inline `/...` são tratados como texto simples.
  </Accordion>
  <Accordion title="Comandos de skill e argumentos nativos">
    - **Comandos de skill:** skills `user-invocable` são expostas como slash commands. Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (por exemplo, `_2`).
      - `/skill <name> [input]` executa uma skill pelo nome (útil quando limites de comando nativo impedem comandos por skill).
      - Por padrão, comandos de skill são encaminhados ao modelo como uma solicitação normal.
      - Skills podem opcionalmente declarar `command-dispatch: tool` para rotear o comando diretamente para uma ferramenta (determinístico, sem modelo).
      - Exemplo: `/prose` (plugin OpenProse) — consulte [OpenProse](/pt-BR/prose).
    - **Argumentos de comando nativo:** o Discord usa autocomplete para opções dinâmicas (e menus de botão quando você omite argumentos obrigatórios). Telegram e Slack mostram um menu de botão quando um comando suporta escolhas e você omite o argumento. Escolhas dinâmicas são resolvidas em relação ao modelo da sessão de destino, então opções específicas do modelo, como níveis de `/think`, seguem a substituição de `/model` dessa sessão.
  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` responde a uma pergunta de runtime, não a uma pergunta de configuração: **o que este agente pode usar agora nesta conversa**.

- O padrão de `/tools` é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies com comando nativo que oferecem suporte a argumentos expõem a mesma troca de modo como `compact|verbose`.
- Os resultados têm escopo de sessão, portanto mudar agente, canal, thread, autorização do remetente ou modelo pode alterar a saída.
- `/tools` inclui ferramentas realmente acessíveis em runtime, incluindo ferramentas do core, ferramentas de plugin conectadas e ferramentas pertencentes ao canal.

Para editar perfis e substituições, use o painel Tools da interface de Controle ou superfícies de configuração/catálogo, em vez de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/cota do provedor** (exemplo: "Claude 80% left") aparece em `/status` para o provedor do modelo atual quando o rastreamento de uso está habilitado. O OpenClaw normaliza janelas de provedor para `% left`; para MiniMax, campos de percentual apenas restante são invertidos antes da exibição, e respostas `model_remains` priorizam a entrada do modelo de chat mais um rótulo de plano com tag do modelo.
- **Linhas de tokens/cache** em `/status` podem recorrer à entrada de uso mais recente da transcrição quando o snapshot da sessão ao vivo for esparso. Valores ao vivo não zero existentes ainda têm prioridade, e o fallback da transcrição também pode recuperar o rótulo ativo do modelo de runtime mais um total maior orientado a prompt quando os totais armazenados estiverem ausentes ou forem menores.
- **Execution vs runtime:** `/status` informa `Execution` para o caminho efetivo do sandbox e `Runtime` para quem está realmente executando a sessão: `OpenClaw Pi Default`, `OpenAI Codex`, um backend CLI ou um backend ACP.
- **Tokens/custo por resposta** é controlado por `/usage off|tokens|full` (anexado às respostas normais).
- `/model status` é sobre **modelos/auth/endpoints**, não sobre uso.

## Seleção de modelo (`/model`)

`/model` é implementado como uma diretiva.

Exemplos:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Observações:

- `/model` e `/model list` mostram um seletor compacto e numerado (família de modelo + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo mais uma etapa de envio.
- `/model <#>` seleciona a partir desse seletor (e prefere o provedor atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo o endpoint configurado do provedor (`baseUrl`) e o modo de API (`api`) quando disponíveis.

## Substituições de depuração

`/debug` permite definir substituições de configuração **somente em runtime** (memória, não disco). Exclusivo do proprietário. Desabilitado por padrão; habilite com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
As substituições são aplicadas imediatamente a novas leituras de configuração, mas **não** gravam em `openclaw.json`. Use `/debug reset` para limpar todas as substituições e retornar à configuração em disco.
</Note>

## Saída de trace de plugin

`/trace` permite alternar **linhas de rastreamento/depuração de plugin com escopo de sessão** sem ativar o modo verbose completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Observações:

- `/trace` sem argumento mostra o estado atual do trace da sessão.
- `/trace on` habilita linhas de trace de plugin para a sessão atual.
- `/trace off` as desabilita novamente.
- Linhas de trace de plugin podem aparecer em `/status` e como uma mensagem de diagnóstico de acompanhamento após a resposta normal do assistente.
- `/trace` não substitui `/debug`; `/debug` ainda gerencia substituições de configuração somente em runtime.
- `/trace` não substitui `/verbose`; a saída verbose normal de ferramenta/status continua pertencendo a `/verbose`.

## Atualizações de configuração

`/config` grava na sua configuração em disco (`openclaw.json`). Exclusivo do proprietário. Desabilitado por padrão; habilite com `commands.config: true`.

Exemplos:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
A configuração é validada antes da gravação; alterações inválidas são rejeitadas. Atualizações de `/config` persistem após reinicializações.
</Note>

## Atualizações de MCP

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Exclusivo do proprietário. Desabilitado por padrão; habilite com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` armazena configuração na configuração do OpenClaw, não em configurações de projeto pertencentes ao Pi. Adaptadores de runtime decidem quais transportes são realmente executáveis.
</Note>

## Atualizações de plugin

`/plugins` permite que operadores inspecionem plugins descobertos e alternem a habilitação na configuração. Fluxos somente leitura podem usar `/plugin` como alias. Desabilitado por padrão; habilite com `commands.plugins: true`.

Exemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` e `/plugins show` usam descoberta real de plugins no workspace atual mais a configuração em disco.
- `/plugins enable|disable` atualiza apenas a configuração do plugin; não instala nem desinstala plugins.
- Após alterações de habilitação/desabilitação, reinicie o gateway para aplicá-las.
</Note>

## Observações sobre superfícies

<AccordionGroup>
  <Accordion title="Sessões por superfície">
    - **Comandos de texto** são executados na sessão normal de chat (DMs compartilham `main`, grupos têm sua própria sessão).
    - **Comandos nativos** usam sessões isoladas:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável por `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (direciona para a sessão de chat via `CommandTargetSessionKey`)
    - **`/stop`** tem como alvo a sessão de chat ativa para que possa abortar a execução atual.
  </Accordion>
  <Accordion title="Detalhes do Slack">
    `channels.slack.slashCommand` ainda é compatível com um único comando no estilo `/openclaw`. Se você habilitar `commands.native`, deverá criar um slash command do Slack por comando built-in (mesmos nomes de `/help`). Menus de argumentos de comando para Slack são entregues como botões efêmeros do Block Kit.

    Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O `/status` em texto ainda funciona em mensagens do Slack.

  </Accordion>
</AccordionGroup>

## Perguntas paralelas BTW

`/btw` é uma **pergunta paralela** rápida sobre a sessão atual.

Diferente do chat normal:

- ele usa a sessão atual como contexto de fundo,
- ele é executado como uma chamada única separada **sem ferramentas**,
- ele não altera o contexto futuro da sessão,
- ele não é gravado no histórico da transcrição,
- ele é entregue como um resultado paralelo ao vivo em vez de uma mensagem normal do assistente.

Isso torna `/btw` útil quando você quer um esclarecimento temporário enquanto a tarefa principal continua.

Exemplo:

```text
/btw o que estamos fazendo agora?
```

Consulte [Perguntas paralelas BTW](/pt-BR/tools/btw) para o comportamento completo e detalhes da UX do cliente.

## Relacionado

- [Criando skills](/pt-BR/tools/creating-skills)
- [Skills](/pt-BR/tools/skills)
- [Configuração de Skills](/pt-BR/tools/skills-config)
