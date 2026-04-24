---
read_when:
    - Usando ou configurando comandos de chat
    - Depurando roteamento ou permissões de comandos
summary: 'Comandos de barra: texto vs nativo, configuração e comandos compatíveis'
title: Comandos de barra
x-i18n:
    generated_at: "2026-04-24T06:18:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f708cb3c4c22dc7a97b62ce5e2283b4ecfa5c44f72eb501934e80f80181953b7
    source_path: tools/slash-commands.md
    workflow: 15
---

Os comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **isolada** que começa com `/`.
O comando de chat bash somente do host usa `! <cmd>` (com `/bash <cmd>` como alias).

Há dois sistemas relacionados:

- **Comandos**: mensagens isoladas `/...`.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Diretivas são removidas da mensagem antes de o modelo vê-la.
  - Em mensagens normais de chat (não somente diretivas), elas são tratadas como “dicas inline” e **não** persistem configurações de sessão.
  - Em mensagens somente de diretiva (a mensagem contém apenas diretivas), elas persistem na sessão e respondem com uma confirmação.
  - Diretivas só são aplicadas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, essa será a única
    lista de permissão usada; caso contrário, a autorização vem de listas de permissão/pairing do canal mais `commands.useAccessGroups`.
    Remetentes não autorizados veem diretivas tratadas como texto simples.

Também existem alguns **atalhos inline** (somente remetentes autorizados/em lista de permissão): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Eles são executados imediatamente, são removidos antes de o modelo ver a mensagem, e o texto restante continua pelo fluxo normal.

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

- `commands.text` (padrão `true`) habilita a análise de `/...` em mensagens de chat.
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), comandos de texto ainda funcionam mesmo se você definir isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ligado para Discord/Telegram; desligado para Slack (até você adicionar slash commands); ignorado para providers sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para substituir por provider (bool ou `"auto"`).
  - `false` limpa comandos registrados anteriormente no Discord/Telegram na inicialização. Comandos do Slack são gerenciados no app do Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos **de skill** nativamente quando compatível.
  - Auto: ligado para Discord/Telegram; desligado para Slack (o Slack exige criar um slash command por skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para substituir por provider (bool ou `"auto"`).
- `commands.bash` (padrão `false`) habilita `! <cmd>` para executar comandos shell do host (`/bash <cmd>` é um alias; exige listas de permissão de `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla quanto tempo o bash espera antes de mudar para modo em segundo plano (`0` envia para segundo plano imediatamente).
- `commands.config` (padrão `false`) habilita `/config` (lê/grava `openclaw.json`).
- `commands.mcp` (padrão `false`) habilita `/mcp` (lê/grava a configuração MCP gerenciada pelo OpenClaw em `mcp.servers`).
- `commands.plugins` (padrão `false`) habilita `/plugins` (descoberta/status de Plugin mais controles de instalação + habilitar/desabilitar).
- `commands.debug` (padrão `false`) habilita `/debug` (substituições somente de runtime).
- `commands.restart` (padrão `true`) habilita `/restart` mais ações da ferramenta de reinicialização do gateway.
- `commands.ownerAllowFrom` (opcional) define a lista explícita de permissão de proprietário para superfícies de comando/ferramenta somente do proprietário. Isso é separado de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` por canal (opcional, padrão `false`) faz com que comandos somente do proprietário exijam **identidade de proprietário** para serem executados nessa superfície. Quando `true`, o remetente deve corresponder a um candidato de proprietário resolvido (por exemplo uma entrada em `commands.ownerAllowFrom` ou metadados nativos de proprietário do provider) ou ter escopo interno `operator.admin` em um canal interno de mensagem. Uma entrada curinga em `allowFrom` do canal, ou uma lista vazia/não resolvida de candidatos a proprietário, **não** é suficiente — comandos somente do proprietário falham de forma fechada nesse canal. Deixe isso desligado se quiser que comandos somente do proprietário sejam controlados apenas por `ownerAllowFrom` e pelas listas de permissão padrão de comando.
- `commands.ownerDisplay` controla como IDs de proprietário aparecem no prompt do sistema: `raw` ou `hash`.
- `commands.ownerDisplaySecret` opcionalmente define o segredo HMAC usado quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) define uma lista de permissão por provider para autorização de comandos. Quando configurado, ela é a
  única fonte de autorização para comandos e diretivas (listas de permissão/pairing do canal e `commands.useAccessGroups`
  são ignorados). Use `"*"` para um padrão global; chaves específicas do provider o substituem.
- `commands.useAccessGroups` (padrão `true`) aplica listas de permissão/políticas para comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Fonte da verdade atual:

- comandos integrados do core vêm de `src/auto-reply/commands-registry.shared.ts`
- comandos dock gerados vêm de `src/auto-reply/commands-registry.data.ts`
- comandos de Plugin vêm de chamadas de Plugin `registerCommand()`
- a disponibilidade real no seu gateway ainda depende de sinalizadores de configuração, superfície do canal e Plugins instalados/habilitados

### Comandos integrados do core

Comandos integrados disponíveis hoje:

- `/new [model]` inicia uma nova sessão; `/reset` é o alias de redefinição.
- `/reset soft [message]` mantém a transcrição atual, descarta IDs de sessão reutilizados de backend CLI e executa novamente o carregamento de inicialização/prompt do sistema no local.
- `/compact [instructions]` compacta o contexto da sessão. Consulte [/concepts/compaction](/pt-BR/concepts/compaction).
- `/stop` aborta a execução atual.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gerenciam a expiração do vínculo com thread.
- `/think <level>` define o nível de thinking. As opções vêm do perfil de provider do modelo ativo; níveis comuns são `off`, `minimal`, `low`, `medium` e `high`, com níveis personalizados como `xhigh`, `adaptive`, `max` ou `on` binário apenas onde compatível. Aliases: `/thinking`, `/t`.
- `/verbose on|off|full` alterna a saída detalhada. Alias: `/v`.
- `/trace on|off` alterna a saída de rastreamento de Plugin para a sessão atual.
- `/fast [status|on|off]` mostra ou define fast mode.
- `/reasoning [on|off|stream]` alterna a visibilidade do raciocínio. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna o modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra ou define os padrões de exec.
- `/model [name|#|status]` mostra ou define o modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` lista providers ou modelos de um provider.
- `/queue <mode>` gerencia o comportamento da fila (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) mais opções como `debounce:2s cap:25 drop:summarize`.
- `/help` mostra o breve resumo de ajuda.
- `/commands` mostra o catálogo gerado de comandos.
- `/tools [compact|verbose]` mostra o que o agente atual pode usar neste momento.
- `/status` mostra o status do runtime, incluindo rótulos `Runtime`/`Runner` e uso/cota do provider quando disponível.
- `/tasks` lista tarefas em segundo plano ativas/recentes da sessão atual.
- `/context [list|detail|json]` explica como o contexto é montado.
- `/export-session [path]` exporta a sessão atual para HTML. Alias: `/export`.
- `/export-trajectory [path]` exporta um [pacote de trajectory](/pt-BR/tools/trajectory) JSONL da sessão atual. Alias: `/trajectory`.
- `/whoami` mostra seu ID de remetente. Alias: `/id`.
- `/skill <name> [input]` executa uma skill pelo nome.
- `/allowlist [list|add|remove] ...` gerencia entradas de lista de permissão. Somente texto.
- `/approve <id> <decision>` resolve prompts de aprovação de exec.
- `/btw <question>` faz uma pergunta paralela sem alterar o contexto futuro da sessão. Consulte [/tools/btw](/pt-BR/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gerencia execuções de subagentes para a sessão atual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gerencia sessões ACP e opções de runtime.
- `/focus <target>` vincula a thread atual do Discord ou tópico/conversa do Telegram a um destino de sessão.
- `/unfocus` remove o vínculo atual.
- `/agents` lista agentes vinculados à thread da sessão atual.
- `/kill <id|#|all>` aborta um ou todos os subagentes em execução.
- `/steer <id|#> <message>` envia steer para um subagente em execução. Alias: `/tell`.
- `/config show|get|set|unset` lê ou grava `openclaw.json`. Somente proprietário. Exige `commands.config: true`.
- `/mcp show|get|set|unset` lê ou grava a configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`. Somente proprietário. Exige `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspeciona ou altera o estado de Plugin. `/plugin` é um alias. Somente proprietário para gravações. Exige `commands.plugins: true`.
- `/debug show|set|unset|reset` gerencia substituições de configuração somente em runtime. Somente proprietário. Exige `commands.debug: true`.
- `/usage off|tokens|full|cost` controla o rodapé de uso por resposta ou imprime um resumo local de custo.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulte [/tools/tts](/pt-BR/tools/tts).
- `/restart` reinicia o OpenClaw quando habilitado. Padrão: habilitado; defina `commands.restart: false` para desabilitá-lo.
- `/activation mention|always` define o modo de ativação em grupo.
- `/send on|off|inherit` define a política de envio. Somente proprietário.
- `/bash <command>` executa um comando shell do host. Somente texto. Alias: `! <command>`. Exige `commands.bash: true` mais listas de permissão de `tools.elevated`.
- `!poll [sessionId]` verifica um trabalho bash em segundo plano.
- `!stop [sessionId]` interrompe um trabalho bash em segundo plano.

### Comandos dock gerados

Comandos dock são gerados a partir de Plugins de canal com suporte a comandos nativos. Conjunto incluído atual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de Plugin incluído

Plugins incluídos podem adicionar mais slash commands. Comandos incluídos atuais neste repositório:

- `/dreaming [on|off|status|help]` alterna dreaming de memória. Consulte [Dreaming](/pt-BR/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gerencia fluxo de pairing/configuração de dispositivo. Consulte [Pairing](/pt-BR/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporariamente comandos de node de telefone de alto risco.
- `/voice status|list [limit]|set <voiceId|name>` gerencia a configuração de voz do Talk. No Discord, o nome do comando nativo é `/talkvoice`.
- `/card ...` envia predefinições de cartões avançados do LINE. Consulte [LINE](/pt-BR/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspeciona e controla o harness incluído de app-server do Codex. Consulte [Harness Codex](/pt-BR/plugins/codex-harness).
- Comandos somente do QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinâmicos de skill

Skills invocáveis pelo usuário também são expostas como slash commands:

- `/skill <name> [input]` sempre funciona como ponto de entrada genérico.
- skills também podem aparecer como comandos diretos como `/prose` quando a skill/Plugin os registra.
- o registro nativo de comandos de skill é controlado por `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Observações:

- Os comandos aceitam opcionalmente `:` entre o comando e os argumentos (por exemplo `/think: high`, `/send: on`, `/help:`).
- `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provider (correspondência aproximada); se não houver correspondência, o texto é tratado como corpo da mensagem.
- Para o detalhamento completo de uso por provider, use `openclaw status --usage`.
- `/allowlist add|remove` exige `commands.config=true` e respeita `configWrites` do canal.
- Em canais com múltiplas contas, `/allowlist --account <id>` direcionado à configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo local de custo a partir dos logs de sessão do OpenClaw.
- `/restart` vem habilitado por padrão; defina `commands.restart: false` para desabilitá-lo.
- `/plugins install <spec>` aceita as mesmas especificações de Plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
- `/plugins enable|disable` atualiza a configuração do Plugin e pode solicitar reinicialização.
- Comando nativo exclusivo do Discord: `/vc join|leave|status` controla canais de voz (exige `channels.discord.voice` e comandos nativos; não está disponível como texto).
- Comandos de vínculo com thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que vínculos de thread efetivos estejam habilitados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência de comandos ACP e comportamento em runtime: [Agentes ACP](/pt-BR/tools/acp-agents).
- `/verbose` é destinado a depuração e visibilidade extra; mantenha-o **desligado** em uso normal.
- `/trace` é mais estreito que `/verbose`: ele revela apenas linhas de rastreamento/depuração pertencentes ao Plugin e mantém desligado o chatter normal de ferramentas em modo verbose.
- `/fast on|off` persiste uma substituição de sessão. Use a opção `inherit` da UI de Sessões para limpá-la e voltar aos padrões da configuração.
- `/fast` é específico de provider: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints nativos Responses, enquanto solicitações diretas à Anthropic pública, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Consulte [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
- Resumos de falha de ferramenta ainda são mostrados quando relevantes, mas o texto detalhado de falha só é incluído quando `/verbose` está `on` ou `full`.
- `/reasoning`, `/verbose` e `/trace` são arriscados em ambientes de grupo: eles podem revelar raciocínio interno, saída de ferramenta ou diagnósticos de Plugin que você não pretendia expor. Prefira deixá-los desligados, especialmente em chats em grupo.
- `/model` persiste o novo modelo de sessão imediatamente.
- Se o agente estiver ocioso, a próxima execução o usará imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto limpo de retry.
- Se a atividade de ferramenta ou a saída da resposta já tiver começado, a troca pendente pode continuar enfileirada até uma oportunidade posterior de retry ou até o próximo turno do usuário.
- **Caminho rápido:** mensagens somente de comando de remetentes em lista de permissão são tratadas imediatamente (ignoram fila + modelo).
- **Controle por menção em grupo:** mensagens somente de comando de remetentes em lista de permissão ignoram requisitos de menção.
- **Atalhos inline (somente remetentes em lista de permissão):** certos comandos também funcionam quando embutidos em uma mensagem normal e são removidos antes de o modelo ver o texto restante.
  - Exemplo: `hey /status` aciona uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens somente de comando não autorizadas são ignoradas silenciosamente, e tokens inline `/...` são tratados como texto simples.
- **Comandos de skill:** Skills `user-invocable` são expostas como slash commands. Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (por exemplo `_2`).
  - `/skill <name> [input]` executa uma skill pelo nome (útil quando limites de comandos nativos impedem comandos por skill).
  - Por padrão, comandos de skill são encaminhados ao modelo como uma solicitação normal.
  - Skills podem opcionalmente declarar `command-dispatch: tool` para rotear o comando diretamente a uma ferramenta (determinístico, sem modelo).
  - Exemplo: `/prose` (Plugin OpenProse) — consulte [OpenProse](/pt-BR/prose).
- **Argumentos de comandos nativos:** o Discord usa autocomplete para opções dinâmicas (e menus de botões quando você omite argumentos obrigatórios). Telegram e Slack mostram um menu de botões quando um comando aceita escolhas e você omite o argumento.

## `/tools`

`/tools` responde a uma pergunta de runtime, não de configuração: **o que este agente pode usar agora
nesta conversa**.

- O `/tools` padrão é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies de comando nativo que oferecem suporte a argumentos expõem a mesma alternância de modo `compact|verbose`.
- Os resultados têm escopo de sessão, então mudar agente, canal, thread, autorização do remetente ou modelo pode
  alterar a saída.
- `/tools` inclui ferramentas realmente alcançáveis em runtime, incluindo ferramentas do core, ferramentas conectadas
  de Plugin e ferramentas pertencentes ao canal.

Para editar perfis e substituições, use o painel de Ferramentas da Control UI ou superfícies de configuração/catálogo em vez
de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/cota do provider** (exemplo: “Claude 80% left”) aparece em `/status` para o provider do modelo atual quando o rastreamento de uso está habilitado. O OpenClaw normaliza janelas de provider em `% left`; para MiniMax, campos de percentual apenas restante são invertidos antes da exibição, e respostas `model_remains` preferem a entrada do modelo de chat mais um rótulo de plano marcado com o modelo.
- **Linhas de token/cache** em `/status` podem recorrer à entrada mais recente de uso da transcrição quando o snapshot da sessão ao vivo é esparso. Valores ao vivo existentes e não zero ainda prevalecem, e o fallback da transcrição também pode recuperar o rótulo do modelo ativo em runtime mais um total maior orientado a prompt quando totais armazenados estão ausentes ou são menores.
- **Runtime vs runner:** `/status` informa `Runtime` para o caminho efetivo de execução e estado do sandbox, e `Runner` para quem realmente está executando a sessão: Pi embutido, um provider sustentado por CLI ou um harness/backend ACP.
- **Tokens/custo por resposta** é controlado por `/usage off|tokens|full` (acrescentado às respostas normais).
- `/model status` trata de **modelos/autenticação/endpoints**, não de uso.

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

- `/model` e `/model list` mostram um seletor compacto e numerado (família de modelo + providers disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com dropdowns de provider e modelo mais uma etapa de Submit.
- `/model <#>` seleciona a partir desse seletor (e prefere o provider atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo o endpoint configurado do provider (`baseUrl`) e o modo de API (`api`) quando disponíveis.

## Substituições de depuração

`/debug` permite definir substituições de configuração **somente em runtime** (memória, não disco). Somente proprietário. Vem desabilitado por padrão; habilite com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Observações:

- As substituições se aplicam imediatamente a novas leituras de configuração, mas **não** gravam em `openclaw.json`.
- Use `/debug reset` para limpar todas as substituições e voltar à configuração em disco.

## Saída de rastreamento de Plugin

`/trace` permite alternar **linhas de rastreamento/depuração de Plugin com escopo de sessão** sem ativar o modo verbose completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Observações:

- `/trace` sem argumento mostra o estado atual de rastreamento da sessão.
- `/trace on` habilita linhas de rastreamento de Plugin para a sessão atual.
- `/trace off` desabilita novamente.
- Linhas de rastreamento de Plugin podem aparecer em `/status` e como uma mensagem de diagnóstico de acompanhamento após a resposta normal do assistente.
- `/trace` não substitui `/debug`; `/debug` continua gerenciando substituições de configuração somente em runtime.
- `/trace` não substitui `/verbose`; a saída normal detalhada de ferramentas/status continua pertencendo a `/verbose`.

## Atualizações de configuração

`/config` grava em sua configuração em disco (`openclaw.json`). Somente proprietário. Vem desabilitado por padrão; habilite com `commands.config: true`.

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
- Atualizações de `/config` persistem entre reinicializações.

## Atualizações MCP

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Somente proprietário. Vem desabilitado por padrão; habilite com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Observações:

- `/mcp` armazena a configuração na configuração do OpenClaw, não em configurações de projeto pertencentes ao Pi.
- Adaptadores de runtime decidem quais transportes são realmente executáveis.

## Atualizações de Plugin

`/plugins` permite que operadores inspecionem Plugins descobertos e alternem a habilitação na configuração. Fluxos somente leitura podem usar `/plugin` como alias. Vem desabilitado por padrão; habilite com `commands.plugins: true`.

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
- `/plugins enable|disable` atualiza apenas a configuração do Plugin; não instala nem desinstala Plugins.
- Após alterações de enable/disable, reinicie o gateway para aplicá-las.

## Observações por superfície

- **Comandos de texto** são executados na sessão normal de chat (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável por `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (direciona à sessão de chat por `CommandTargetSessionKey`)
- **`/stop`** mira a sessão ativa de chat para poder abortar a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda é compatível para um único comando no estilo `/openclaw`. Se você habilitar `commands.native`, deverá criar um slash command no Slack para cada comando integrado (mesmos nomes de `/help`). Menus de argumentos de comando no Slack são entregues como botões efêmeros de Block Kit.
  - Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O texto `/status` ainda funciona em mensagens do Slack.

## Perguntas paralelas BTW

`/btw` é uma **pergunta paralela** rápida sobre a sessão atual.

Diferente do chat normal:

- usa a sessão atual como contexto de fundo,
- roda como uma chamada one-shot **sem ferramentas**,
- não altera o contexto futuro da sessão,
- não é gravada no histórico da transcrição,
- é entregue como resultado paralelo ao vivo em vez de uma mensagem normal do assistente.

Isso torna `/btw` útil quando você quer um esclarecimento temporário enquanto a
tarefa principal continua.

Exemplo:

```text
/btw what are we doing right now?
```

Consulte [Perguntas paralelas BTW](/pt-BR/tools/btw) para o comportamento completo e os
detalhes de UX do cliente.

## Relacionado

- [Skills](/pt-BR/tools/skills)
- [Configuração de Skills](/pt-BR/tools/skills-config)
- [Criando Skills](/pt-BR/tools/creating-skills)
