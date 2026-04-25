---
read_when:
    - Usando ou configurando comandos de chat
    - Depurando roteamento de comandos ou permissões
summary: 'Comandos de barra: texto vs nativos, configuração e comandos compatíveis'
title: Comandos de barra
x-i18n:
    generated_at: "2026-04-25T13:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95f33df9a05bd74855695c29b5c449af7a73714596932be5ce923a1ddab8ee7
    source_path: tools/slash-commands.md
    workflow: 15
---

Os comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **independente** que começa com `/`.
O comando de chat bash somente do host usa `! <cmd>` (com `/bash <cmd>` como alias).

Há dois sistemas relacionados:

- **Comandos**: mensagens independentes `/...`.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - As diretivas são removidas da mensagem antes que o modelo a veja.
  - Em mensagens normais de chat (não somente de diretivas), elas são tratadas como “dicas inline” e **não** persistem configurações da sessão.
  - Em mensagens somente de diretivas (a mensagem contém apenas diretivas), elas persistem na sessão e respondem com uma confirmação.
  - As diretivas são aplicadas apenas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, ele será a única
    lista de permissão usada; caso contrário, a autorização virá das listas de permissão/pareamento do canal mais `commands.useAccessGroups`.
    Remetentes não autorizados verão as diretivas tratadas como texto simples.

Também há alguns **atalhos inline** (somente para remetentes autorizados/em lista de permissão): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Eles são executados imediatamente, são removidos antes que o modelo veja a mensagem, e o texto restante continua pelo fluxo normal.

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

- `commands.text` (padrão `true`) ativa o parsing de `/...` em mensagens de chat.
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), comandos de texto ainda funcionam mesmo se você definir isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ligado para Discord/Telegram; desligado para Slack (até você adicionar slash commands); ignorado para providers sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para substituir por provider (bool ou `"auto"`).
  - `false` limpa comandos registrados anteriormente no Discord/Telegram durante a inicialização. Os comandos do Slack são gerenciados no app do Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos de **Skill** nativamente quando houver suporte.
  - Auto: ligado para Discord/Telegram; desligado para Slack (o Slack exige a criação de um slash command por Skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para substituir por provider (bool ou `"auto"`).
- `commands.bash` (padrão `false`) ativa `! <cmd>` para executar comandos de shell do host (`/bash <cmd>` é um alias; requer listas de permissão de `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla por quanto tempo o bash espera antes de alternar para o modo em segundo plano (`0` coloca em segundo plano imediatamente).
- `commands.config` (padrão `false`) ativa `/config` (lê/grava `openclaw.json`).
- `commands.mcp` (padrão `false`) ativa `/mcp` (lê/grava a configuração de MCP gerenciada pelo OpenClaw em `mcp.servers`).
- `commands.plugins` (padrão `false`) ativa `/plugins` (descoberta/status de Plugin, além de controles de instalação + ativação/desativação).
- `commands.debug` (padrão `false`) ativa `/debug` (substituições somente de runtime).
- `commands.restart` (padrão `true`) ativa `/restart` mais ações da ferramenta de reinicialização do gateway.
- `commands.ownerAllowFrom` (opcional) define a lista de permissão explícita do proprietário para superfícies de comando/ferramenta exclusivas do proprietário. Isso é separado de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` por canal (opcional, padrão `false`) faz com que comandos exclusivos do proprietário exijam **identidade do proprietário** para serem executados nessa superfície. Quando `true`, o remetente deve corresponder a um candidato de proprietário resolvido (por exemplo, uma entrada em `commands.ownerAllowFrom` ou metadados nativos de proprietário do provider) ou ter escopo interno `operator.admin` em um canal de mensagens internas. Uma entrada curinga em `allowFrom` do canal, ou uma lista vazia/não resolvida de candidatos a proprietário, **não** é suficiente — comandos exclusivos do proprietário falham de forma fechada nesse canal. Deixe isso desativado se quiser que comandos exclusivos do proprietário sejam controlados apenas por `ownerAllowFrom` e pelas listas de permissão padrão de comandos.
- `commands.ownerDisplay` controla como ids do proprietário aparecem no prompt do sistema: `raw` ou `hash`.
- `commands.ownerDisplaySecret` opcionalmente define o segredo HMAC usado quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) define uma lista de permissão por provider para autorização de comandos. Quando configurado, ela é a
  única fonte de autorização para comandos e diretivas (`commands.useAccessGroups` e listas de permissão/pareamento do canal
  são ignorados). Use `"*"` para um padrão global; chaves específicas do provider substituem esse valor.
- `commands.useAccessGroups` (padrão `true`) impõe listas de permissão/políticas para comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Fonte da verdade atual:

- os built-ins do núcleo vêm de `src/auto-reply/commands-registry.shared.ts`
- os comandos dock gerados vêm de `src/auto-reply/commands-registry.data.ts`
- os comandos de Plugin vêm de chamadas `registerCommand()` do plugin
- a disponibilidade real no seu gateway ainda depende de flags de configuração, superfície do canal e plugins instalados/ativados

### Comandos built-in do núcleo

Comandos built-in disponíveis hoje:

- `/new [model]` inicia uma nova sessão; `/reset` é o alias de redefinição.
- `/reset soft [message]` mantém a transcrição atual, descarta ids de sessão reutilizados do backend CLI e executa novamente o carregamento de inicialização/prompt do sistema no mesmo lugar.
- `/compact [instructions]` faz Compaction do contexto da sessão. Consulte [/concepts/compaction](/pt-BR/concepts/compaction).
- `/stop` aborta a execução atual.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gerenciam a expiração de vinculação de thread.
- `/think <level>` define o nível de pensamento. As opções vêm do perfil do provider do modelo ativo; níveis comuns são `off`, `minimal`, `low`, `medium` e `high`, com níveis personalizados como `xhigh`, `adaptive`, `max` ou somente o binário `on` quando houver suporte. Aliases: `/thinking`, `/t`.
- `/verbose on|off|full` alterna a saída detalhada. Alias: `/v`.
- `/trace on|off` alterna a saída de rastreamento de Plugin para a sessão atual.
- `/fast [status|on|off]` mostra ou define o modo rápido.
- `/reasoning [on|off|stream]` alterna a visibilidade do raciocínio. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna o modo elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra ou define os padrões de execução.
- `/model [name|#|status]` mostra ou define o modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` lista providers ou modelos de um provider.
- `/queue <mode>` gerencia o comportamento da fila (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) além de opções como `debounce:2s cap:25 drop:summarize`.
- `/help` mostra o resumo curto de ajuda.
- `/commands` mostra o catálogo de comandos gerado.
- `/tools [compact|verbose]` mostra o que o agente atual pode usar agora.
- `/status` mostra o status de execução/runtime, incluindo rótulos `Execution`/`Runtime` e uso/cota do provider quando disponíveis.
- `/crestodian <request>` executa o auxiliar de configuração e reparo do Crestodian a partir de uma DM do proprietário.
- `/tasks` lista tarefas em segundo plano ativas/recentes da sessão atual.
- `/context [list|detail|json]` explica como o contexto é montado.
- `/export-session [path]` exporta a sessão atual para HTML. Alias: `/export`.
- `/export-trajectory [path]` exporta um [trajectory bundle](/pt-BR/tools/trajectory) JSONL da sessão atual. Alias: `/trajectory`.
- `/whoami` mostra seu id de remetente. Alias: `/id`.
- `/skill <name> [input]` executa um Skill pelo nome.
- `/allowlist [list|add|remove] ...` gerencia entradas de lista de permissão. Somente texto.
- `/approve <id> <decision>` resolve prompts de aprovação de execução.
- `/btw <question>` faz uma pergunta lateral sem alterar o contexto futuro da sessão. Consulte [/tools/btw](/pt-BR/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gerencia execuções de subagentes da sessão atual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gerencia sessões ACP e opções de runtime.
- `/focus <target>` vincula a thread atual do Discord ou o tópico/conversa atual do Telegram a um alvo de sessão.
- `/unfocus` remove o vínculo atual.
- `/agents` lista agentes vinculados à thread da sessão atual.
- `/kill <id|#|all>` aborta um ou todos os subagentes em execução.
- `/steer <id|#> <message>` envia direcionamento para um subagente em execução. Alias: `/tell`.
- `/config show|get|set|unset` lê ou grava `openclaw.json`. Somente proprietário. Requer `commands.config: true`.
- `/mcp show|get|set|unset` lê ou grava a configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`. Somente proprietário. Requer `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspeciona ou altera o estado do Plugin. `/plugin` é um alias. Somente proprietário para gravações. Requer `commands.plugins: true`.
- `/debug show|set|unset|reset` gerencia substituições de configuração somente de runtime. Somente proprietário. Requer `commands.debug: true`.
- `/usage off|tokens|full|cost` controla o rodapé de uso por resposta ou imprime um resumo local de custo.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulte [/tools/tts](/pt-BR/tools/tts).
- `/restart` reinicia o OpenClaw quando ativado. Padrão: ativado; defina `commands.restart: false` para desativá-lo.
- `/activation mention|always` define o modo de ativação de grupo.
- `/send on|off|inherit` define a política de envio. Somente proprietário.
- `/bash <command>` executa um comando de shell do host. Somente texto. Alias: `! <command>`. Requer `commands.bash: true` mais listas de permissão de `tools.elevated`.
- `!poll [sessionId]` verifica um job bash em segundo plano.
- `!stop [sessionId]` interrompe um job bash em segundo plano.

### Comandos dock gerados

Os comandos dock são gerados a partir de plugins de canal com suporte a comando nativo. Conjunto empacotado atual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de Plugin empacotados

Plugins empacotados podem adicionar mais slash commands. Comandos empacotados atuais neste repositório:

- `/dreaming [on|off|status|help]` alterna Dreaming de memória. Consulte [Dreaming](/pt-BR/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gerencia o fluxo de pareamento/configuração de dispositivo. Consulte [Pairing](/pt-BR/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporariamente comandos do node de telefone de alto risco.
- `/voice status|list [limit]|set <voiceId|name>` gerencia a configuração de voz do Talk. No Discord, o nome do comando nativo é `/talkvoice`.
- `/card ...` envia predefinições de rich card do LINE. Consulte [LINE](/pt-BR/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspeciona e controla o harness empacotado do app-server Codex. Consulte [Codex Harness](/pt-BR/plugins/codex-harness).
- Comandos somente do QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinâmicos de Skill

Skills invocáveis pelo usuário também são expostos como slash commands:

- `/skill <name> [input]` sempre funciona como ponto de entrada genérico.
- Skills também podem aparecer como comandos diretos como `/prose` quando o Skill/plugin os registra.
- o registro nativo de comandos de Skill é controlado por `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Observações:

- Os comandos aceitam um `:` opcional entre o comando e os argumentos (por exemplo, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provider (correspondência aproximada); se não houver correspondência, o texto será tratado como o corpo da mensagem.
- Para o detalhamento completo de uso por provider, use `openclaw status --usage`.
- `/allowlist add|remove` requer `commands.config=true` e respeita `configWrites` do canal.
- Em canais com múltiplas contas, `/allowlist --account <id>` direcionado à configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo local de custo a partir dos logs de sessão do OpenClaw.
- `/restart` vem ativado por padrão; defina `commands.restart: false` para desativá-lo.
- `/plugins install <spec>` aceita as mesmas especificações de plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
- `/plugins enable|disable` atualiza a configuração de Plugin e pode solicitar uma reinicialização.
- Comando nativo somente do Discord: `/vc join|leave|status` controla canais de voz (não disponível como texto). `join` requer uma guild e um canal de voz/stage selecionado. Requer `channels.discord.voice` e comandos nativos.
- Comandos de vinculação de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que as vinculações efetivas de thread estejam ativadas (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência de comandos ACP e comportamento de runtime: [ACP Agents](/pt-BR/tools/acp-agents).
- `/verbose` foi feito para depuração e visibilidade extra; mantenha-o **desativado** no uso normal.
- `/trace` é mais restrito do que `/verbose`: ele revela apenas linhas de rastreamento/depuração pertencentes ao Plugin e mantém desativado o chatter normal detalhado de ferramenta.
- `/fast on|off` persiste uma substituição da sessão. Use a opção `inherit` da UI de Sessões para limpá-la e voltar aos padrões da configuração.
- `/fast` é específico do provider: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints nativos de Responses, enquanto solicitações públicas diretas do Anthropic, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Consulte [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
- Resumos de falha de ferramenta ainda são mostrados quando relevantes, mas o texto detalhado da falha só é incluído quando `/verbose` está `on` ou `full`.
- `/reasoning`, `/verbose` e `/trace` são arriscados em ambientes de grupo: podem revelar raciocínio interno, saída de ferramenta ou diagnósticos de Plugin que você não pretendia expor. Prefira deixá-los desativados, especialmente em chats de grupo.
- `/model` persiste imediatamente o novo modelo da sessão.
- Se o agente estiver ocioso, a próxima execução o usará imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia com o novo modelo em um ponto limpo de retry.
- Se a atividade de ferramenta ou a saída de resposta já tiver começado, a troca pendente pode continuar na fila até uma oportunidade posterior de retry ou até o próximo turno do usuário.
- Na TUI local, `/crestodian [request]` retorna da TUI normal do agente para o
  Crestodian. Isso é separado do modo de resgate do canal de mensagens e não
  concede autoridade remota de configuração.
- **Caminho rápido:** mensagens somente de comando de remetentes em lista de permissão são tratadas imediatamente (ignoram fila + modelo).
- **Gating de menção em grupo:** mensagens somente de comando de remetentes em lista de permissão ignoram requisitos de menção.
- **Atalhos inline (somente remetentes em lista de permissão):** certos comandos também funcionam quando incorporados em uma mensagem normal e são removidos antes que o modelo veja o texto restante.
  - Exemplo: `hey /status` aciona uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens somente de comando não autorizadas são ignoradas silenciosamente, e tokens inline `/...` são tratados como texto simples.
- **Comandos de Skill:** Skills `user-invocable` são expostos como slash commands. Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (por exemplo, `_2`).
  - `/skill <name> [input]` executa um Skill pelo nome (útil quando limites de comando nativo impedem comandos por Skill).
  - Por padrão, comandos de Skill são encaminhados ao modelo como uma solicitação normal.
  - Skills podem opcionalmente declarar `command-dispatch: tool` para rotear o comando diretamente para uma ferramenta (determinístico, sem modelo).
  - Exemplo: `/prose` (plugin OpenProse) — consulte [OpenProse](/pt-BR/prose).
- **Argumentos de comando nativo:** o Discord usa autocomplete para opções dinâmicas (e menus de botão quando você omite argumentos obrigatórios). Telegram e Slack mostram um menu de botões quando um comando oferece opções e você omite o argumento. As opções dinâmicas são resolvidas em relação ao modelo da sessão de destino, então opções específicas do modelo, como níveis de `/think`, seguem a substituição de `/model` dessa sessão.

## `/tools`

`/tools` responde a uma pergunta de runtime, não a uma pergunta de configuração: **o que este agente pode usar agora nesta
conversa**.

- O `/tools` padrão é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies de comando nativo com suporte a argumentos expõem a mesma troca de modo `compact|verbose`.
- Os resultados têm escopo de sessão, então mudar agente, canal, thread, autorização do remetente ou modelo pode
  alterar a saída.
- `/tools` inclui ferramentas realmente alcançáveis em runtime, incluindo ferramentas do núcleo, ferramentas
  de Plugin conectadas e ferramentas pertencentes ao canal.

Para editar perfil e substituições, use o painel de Ferramentas da Control UI ou superfícies de configuração/catálogo em vez
de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/cota do provider** (exemplo: “Claude 80% restante”) aparece em `/status` para o provider do modelo atual quando o rastreamento de uso está ativado. O OpenClaw normaliza janelas dos providers para `% restante`; para MiniMax, campos percentuais apenas de restante são invertidos antes da exibição, e respostas `model_remains` preferem a entrada do modelo de chat mais um rótulo de plano com tag de modelo.
- **Linhas de token/cache** em `/status` podem recorrer à entrada de uso mais recente da transcrição quando o snapshot da sessão ao vivo é escasso. Valores ativos não zero já existentes ainda prevalecem, e o fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo mais um total maior orientado a prompt quando os totais armazenados estiverem ausentes ou forem menores.
- **Execution vs runtime:** `/status` informa `Execution` para o caminho efetivo do sandbox e `Runtime` para quem realmente está executando a sessão: `OpenClaw Pi Default`, `OpenAI Codex`, um backend CLI ou um backend ACP.
- **Tokens/custo por resposta** é controlado por `/usage off|tokens|full` (acrescentado às respostas normais).
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

- `/model` e `/model list` mostram um seletor compacto e numerado (família do modelo + providers disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provider e modelo e uma etapa de envio.
- `/model <#>` seleciona a partir desse seletor (e prefere o provider atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo o endpoint configurado do provider (`baseUrl`) e o modo de API (`api`) quando disponíveis.

## Substituições de depuração

`/debug` permite definir substituições de configuração **somente de runtime** (memória, não disco). Somente proprietário. Desativado por padrão; ative com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Observações:

- As substituições são aplicadas imediatamente a novas leituras de configuração, mas **não** gravam em `openclaw.json`.
- Use `/debug reset` para limpar todas as substituições e voltar à configuração em disco.

## Saída de rastreamento de Plugin

`/trace` permite alternar **linhas de rastreamento/depuração de Plugin com escopo de sessão** sem ativar o modo totalmente detalhado.

Exemplos:

```text
/trace
/trace on
/trace off
```

Observações:

- `/trace` sem argumento mostra o estado atual de rastreamento da sessão.
- `/trace on` ativa linhas de rastreamento de Plugin para a sessão atual.
- `/trace off` as desativa novamente.
- Linhas de rastreamento de Plugin podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento após a resposta normal do assistente.
- `/trace` não substitui `/debug`; `/debug` continua gerenciando substituições de configuração somente de runtime.
- `/trace` não substitui `/verbose`; a saída detalhada normal de ferramenta/status continua pertencendo a `/verbose`.

## Atualizações de configuração

`/config` grava na sua configuração em disco (`openclaw.json`). Somente proprietário. Desativado por padrão; ative com `commands.config: true`.

Exemplos:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Observações:

- A configuração é validada antes da gravação; alterações inválidas são rejeitadas.
- Atualizações de `/config` persistem após reinicializações.

## Atualizações de MCP

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Somente proprietário. Desativado por padrão; ative com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Observações:

- `/mcp` armazena a configuração na configuração do OpenClaw, não em ajustes de projeto pertencentes ao Pi.
- Adaptadores de runtime decidem quais transportes são realmente executáveis.

## Atualizações de Plugin

`/plugins` permite que operadores inspecionem Plugins descobertos e alternem a ativação na configuração. Fluxos somente leitura podem usar `/plugin` como alias. Desativado por padrão; ative com `commands.plugins: true`.

Exemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Observações:

- `/plugins list` e `/plugins show` usam descoberta real de Plugin em relação ao workspace atual mais a configuração em disco.
- `/plugins enable|disable` atualiza apenas a configuração de Plugin; não instala nem desinstala Plugins.
- Após alterações de ativação/desativação, reinicie o gateway para aplicá-las.

## Observações sobre superfícies

- **Comandos de texto** são executados na sessão normal de chat (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (direciona a sessão do chat via `CommandTargetSessionKey`)
- **`/stop`** mira a sessão ativa de chat para poder abortar a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda é compatível para um único comando no estilo `/openclaw`. Se você ativar `commands.native`, deverá criar um slash command do Slack por comando built-in (mesmos nomes de `/help`). Menus de argumentos de comando para Slack são entregues como botões efêmeros do Block Kit.
  - Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O `/status` em texto continua funcionando em mensagens do Slack.

## Perguntas laterais BTW

`/btw` é uma **pergunta lateral** rápida sobre a sessão atual.

Diferentemente do chat normal:

- usa a sessão atual como contexto de fundo,
- roda como uma chamada avulsa separada **sem ferramentas**,
- não altera o contexto futuro da sessão,
- não é gravada no histórico da transcrição,
- é entregue como um resultado lateral ao vivo em vez de uma mensagem normal do assistente.

Isso torna `/btw` útil quando você quer um esclarecimento temporário enquanto a
tarefa principal continua em andamento.

Exemplo:

```text
/btw o que estamos fazendo agora?
```

Consulte [BTW Side Questions](/pt-BR/tools/btw) para o comportamento completo e os
detalhes de UX do cliente.

## Relacionado

- [Skills](/pt-BR/tools/skills)
- [Configuração de Skills](/pt-BR/tools/skills-config)
- [Creating skills](/pt-BR/tools/creating-skills)
