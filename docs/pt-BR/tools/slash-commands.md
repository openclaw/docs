---
read_when:
    - Usando ou configurando comandos de chat
    - Depurando roteamento ou permissões de comandos
summary: 'Comandos de barra: texto vs nativos, configuração e comandos compatíveis'
title: Comandos de barra
x-i18n:
    generated_at: "2026-04-23T14:08:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13290dcdf649ae66603a92a0aca68460bb63ff476179cc2dded796aaa841d66c
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos de barra

Os comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **independente** que começa com `/`.
O comando de chat bash apenas do host usa `! <cmd>` (com `/bash <cmd>` como alias).

Há dois sistemas relacionados:

- **Comandos**: mensagens independentes `/...`.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Diretivas são removidas da mensagem antes que o modelo a veja.
  - Em mensagens normais de chat (não apenas diretivas), elas são tratadas como “dicas inline” e **não** persistem configurações de sessão.
  - Em mensagens apenas com diretivas (a mensagem contém apenas diretivas), elas persistem na sessão e respondem com uma confirmação.
  - Diretivas são aplicadas apenas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, ele será a única
    lista de permissões usada; caso contrário, a autorização vem das listas de permissões/emparelhamento do canal mais `commands.useAccessGroups`.
    Remetentes não autorizados veem diretivas tratadas como texto simples.

Também existem alguns **atalhos inline** (apenas remetentes autorizados/listados): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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

- `commands.text` (padrão `true`) habilita a análise de `/...` em mensagens de chat.
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), comandos de texto ainda funcionam mesmo se você definir isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ligado para Discord/Telegram; desligado para Slack (até você adicionar comandos de barra); ignorado para provedores sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para substituir por provedor (bool ou `"auto"`).
  - `false` limpa comandos registrados anteriormente no Discord/Telegram na inicialização. Comandos do Slack são gerenciados no app do Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos de **Skill** nativamente quando houver suporte.
  - Auto: ligado para Discord/Telegram; desligado para Slack (o Slack exige criar um comando de barra por Skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para substituir por provedor (bool ou `"auto"`).
- `commands.bash` (padrão `false`) habilita `! <cmd>` para executar comandos do shell do host (`/bash <cmd>` é um alias; exige listas de permissões de `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla quanto tempo o bash espera antes de alternar para modo em segundo plano (`0` envia imediatamente para segundo plano).
- `commands.config` (padrão `false`) habilita `/config` (lê/grava `openclaw.json`).
- `commands.mcp` (padrão `false`) habilita `/mcp` (lê/grava configuração MCP gerenciada pelo OpenClaw em `mcp.servers`).
- `commands.plugins` (padrão `false`) habilita `/plugins` (descoberta/status de plugin mais controles de instalar + habilitar/desabilitar).
- `commands.debug` (padrão `false`) habilita `/debug` (substituições somente de runtime).
- `commands.restart` (padrão `true`) habilita `/restart` mais ações de ferramenta de reinicialização do Gateway.
- `commands.ownerAllowFrom` (opcional) define a lista de permissões explícita do owner para superfícies de comando/ferramenta exclusivas do owner. Isso é separado de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` por canal (opcional, padrão `false`) faz com que comandos exclusivos do owner exijam **identidade de owner** para rodar nessa superfície. Quando `true`, o remetente deve corresponder a um candidato de owner resolvido (por exemplo, uma entrada em `commands.ownerAllowFrom` ou metadados nativos de owner do provedor) ou ter escopo interno `operator.admin` em um canal de mensagem interno. Uma entrada curinga em `allowFrom` do canal, ou uma lista de candidatos de owner vazia/não resolvida, **não** é suficiente — comandos exclusivos do owner falham de forma fechada nesse canal. Deixe isso desativado se quiser que comandos exclusivos do owner sejam controlados apenas por `ownerAllowFrom` e pelas listas de permissões padrão de comando.
- `commands.ownerDisplay` controla como ids de owner aparecem no prompt de sistema: `raw` ou `hash`.
- `commands.ownerDisplaySecret` opcionalmente define o segredo HMAC usado quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) define uma lista de permissões por provedor para autorização de comandos. Quando configurado, é a
  única fonte de autorização para comandos e diretivas (listas de permissões/emparelhamento do canal e `commands.useAccessGroups`
  são ignorados). Use `"*"` para um padrão global; chaves específicas de provedor o substituem.
- `commands.useAccessGroups` (padrão `true`) aplica listas de permissões/políticas para comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Fonte da verdade atual:

- comandos internos do core vêm de `src/auto-reply/commands-registry.shared.ts`
- comandos dock gerados vêm de `src/auto-reply/commands-registry.data.ts`
- comandos de plugin vêm de chamadas `registerCommand()` do plugin
- a disponibilidade real no seu Gateway ainda depende de flags de configuração, superfície do canal e plugins instalados/habilitados

### Comandos internos do core

Comandos internos disponíveis hoje:

- `/new [model]` inicia uma nova sessão; `/reset` é o alias de redefinição.
- `/reset soft [message]` mantém a transcrição atual, remove ids de sessão reutilizados do backend de CLI e executa novamente, no mesmo lugar, o carregamento inicial/do prompt de sistema.
- `/compact [instructions]` faz Compaction do contexto da sessão. Consulte [/concepts/compaction](/pt-BR/concepts/compaction).
- `/stop` aborta a execução atual.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gerenciam a expiração de vinculação de thread.
- `/think <level>` define o nível de thinking. As opções vêm do perfil do provedor do modelo ativo; níveis comuns são `off`, `minimal`, `low`, `medium` e `high`, com níveis personalizados como `xhigh`, `adaptive`, `max` ou o binário `on` apenas quando compatível. Aliases: `/thinking`, `/t`.
- `/verbose on|off|full` alterna a saída detalhada. Alias: `/v`.
- `/trace on|off` alterna a saída de rastreamento de plugin para a sessão atual.
- `/fast [status|on|off]` mostra ou define o modo rápido.
- `/reasoning [on|off|stream]` alterna a visibilidade do reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna o modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra ou define padrões de exec.
- `/model [name|#|status]` mostra ou define o modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` lista provedores ou modelos de um provedor.
- `/queue <mode>` gerencia o comportamento da fila (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) mais opções como `debounce:2s cap:25 drop:summarize`.
- `/help` mostra o resumo curto de ajuda.
- `/commands` mostra o catálogo gerado de comandos.
- `/tools [compact|verbose]` mostra o que o agent atual pode usar agora.
- `/status` mostra o status de runtime, incluindo rótulos `Runtime`/`Runner` e uso/cota do provedor quando disponíveis.
- `/tasks` lista tarefas em segundo plano ativas/recentes da sessão atual.
- `/context [list|detail|json]` explica como o contexto é montado.
- `/export-session [path]` exporta a sessão atual para HTML. Alias: `/export`.
- `/export-trajectory [path]` exporta um [trajectory bundle](/pt-BR/tools/trajectory) JSONL da sessão atual. Alias: `/trajectory`.
- `/whoami` mostra seu id de remetente. Alias: `/id`.
- `/skill <name> [input]` executa uma Skill pelo nome.
- `/allowlist [list|add|remove] ...` gerencia entradas da lista de permissões. Somente texto.
- `/approve <id> <decision>` resolve prompts de aprovação de exec.
- `/btw <question>` faz uma pergunta paralela sem alterar o contexto futuro da sessão. Consulte [/tools/btw](/pt-BR/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gerencia execuções de sub-agent da sessão atual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gerencia sessões ACP e opções de runtime.
- `/focus <target>` vincula a thread atual do Discord ou o tópico/conversa do Telegram a um destino de sessão.
- `/unfocus` remove a vinculação atual.
- `/agents` lista agents vinculados à thread da sessão atual.
- `/kill <id|#|all>` aborta um ou todos os sub-agents em execução.
- `/steer <id|#> <message>` envia direcionamento para um sub-agent em execução. Alias: `/tell`.
- `/config show|get|set|unset` lê ou grava `openclaw.json`. Somente owner. Exige `commands.config: true`.
- `/mcp show|get|set|unset` lê ou grava a configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`. Somente owner. Exige `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspeciona ou altera o estado de plugin. `/plugin` é um alias. Somente owner para gravações. Exige `commands.plugins: true`.
- `/debug show|set|unset|reset` gerencia substituições de configuração somente de runtime. Somente owner. Exige `commands.debug: true`.
- `/usage off|tokens|full|cost` controla o rodapé de uso por resposta ou imprime um resumo local de custo.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulte [/tools/tts](/pt-BR/tools/tts).
- `/restart` reinicia o OpenClaw quando habilitado. Padrão: habilitado; defina `commands.restart: false` para desabilitá-lo.
- `/activation mention|always` define o modo de ativação de grupo.
- `/send on|off|inherit` define a política de envio. Somente owner.
- `/bash <command>` executa um comando de shell do host. Somente texto. Alias: `! <command>`. Exige `commands.bash: true` mais listas de permissões de `tools.elevated`.
- `!poll [sessionId]` verifica um job bash em segundo plano.
- `!stop [sessionId]` interrompe um job bash em segundo plano.

### Comandos dock gerados

Os comandos dock são gerados a partir de plugins de canal com suporte a comando nativo. Conjunto integrado atual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugins integrados

Plugins integrados podem adicionar mais comandos de barra. Comandos integrados atuais neste repositório:

- `/dreaming [on|off|status|help]` alterna o Dreaming da memória. Consulte [Dreaming](/pt-BR/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gerencia o fluxo de emparelhamento/configuração de dispositivo. Consulte [Emparelhamento](/pt-BR/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporariamente comandos de Node de telefone de alto risco.
- `/voice status|list [limit]|set <voiceId|name>` gerencia a configuração de voz do Talk. No Discord, o nome do comando nativo é `/talkvoice`.
- `/card ...` envia presets de rich card do LINE. Consulte [LINE](/pt-BR/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspeciona e controla o harness integrado do app-server Codex. Consulte [Codex Harness](/pt-BR/plugins/codex-harness).
- Comandos somente de QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinâmicos de Skill

Skills invocáveis pelo usuário também são expostas como comandos de barra:

- `/skill <name> [input]` sempre funciona como ponto de entrada genérico.
- Skills também podem aparecer como comandos diretos, como `/prose`, quando a Skill/plugin os registra.
- O registro nativo de comandos de Skill é controlado por `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Observações:

- Os comandos aceitam um `:` opcional entre o comando e os argumentos (ex.: `/think: high`, `/send: on`, `/help:`).
- `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência aproximada); se não houver correspondência, o texto será tratado como corpo da mensagem.
- Para a análise completa de uso por provedor, use `openclaw status --usage`.
- `/allowlist add|remove` exige `commands.config=true` e respeita `configWrites` do canal.
- Em canais com várias contas, `/allowlist --account <id>` voltado para configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo local de custo a partir dos logs de sessão do OpenClaw.
- `/restart` é habilitado por padrão; defina `commands.restart: false` para desabilitá-lo.
- `/plugins install <spec>` aceita as mesmas specs de plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
- `/plugins enable|disable` atualiza a configuração do plugin e pode solicitar reinicialização.
- Comando nativo apenas do Discord: `/vc join|leave|status` controla canais de voz (exige `channels.discord.voice` e comandos nativos; não está disponível como texto).
- Comandos de vinculação de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que vinculações efetivas de thread estejam habilitadas (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência de comando ACP e comportamento de runtime: [Agentes ACP](/pt-BR/tools/acp-agents).
- `/verbose` é destinado a depuração e visibilidade extra; mantenha-o **desligado** no uso normal.
- `/trace` é mais restrito que `/verbose`: revela apenas linhas de rastreamento/depuração controladas por plugin e mantém desativado o chatter normal detalhado de ferramentas.
- `/fast on|off` persiste uma substituição de sessão. Use a opção `inherit` da UI de Sessões para limpá-la e voltar aos padrões de configuração.
- `/fast` é específico por provedor: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints nativos Responses, enquanto solicitações públicas diretas à Anthropic, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Consulte [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
- Resumos de falha de ferramenta ainda são mostrados quando relevantes, mas texto detalhado de falha só é incluído quando `/verbose` está `on` ou `full`.
- `/reasoning`, `/verbose` e `/trace` são arriscados em configurações de grupo: podem revelar reasoning interno, saída de ferramenta ou diagnostics de plugin que você não pretendia expor. Prefira deixá-los desativados, especialmente em chats em grupo.
- `/model` persiste imediatamente o novo modelo da sessão.
- Se o agent estiver ocioso, a próxima execução o usará imediatamente.
- Se já houver uma execução ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia com o novo modelo em um ponto limpo de retry.
- Se a atividade de ferramenta ou a saída da resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade posterior de retry ou até o próximo turno do usuário.
- **Caminho rápido:** mensagens apenas com comando de remetentes listados em allowlist são tratadas imediatamente (contornam fila + modelo).
- **Bloqueio por menção em grupo:** mensagens apenas com comando de remetentes listados em allowlist ignoram requisitos de menção.
- **Atalhos inline (apenas remetentes listados em allowlist):** certos comandos também funcionam quando embutidos em uma mensagem normal e são removidos antes que o modelo veja o texto restante.
  - Exemplo: `hey /status` aciona uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens apenas com comando de remetentes não autorizados são ignoradas silenciosamente, e tokens inline `/...` são tratados como texto simples.
- **Comandos de Skill:** Skills `user-invocable` são expostas como comandos de barra. Os nomes são saneados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (ex.: `_2`).
  - `/skill <name> [input]` executa uma Skill pelo nome (útil quando limites de comando nativo impedem comandos por Skill).
  - Por padrão, comandos de Skill são encaminhados ao modelo como uma solicitação normal.
  - Skills podem declarar opcionalmente `command-dispatch: tool` para rotear o comando diretamente a uma ferramenta (determinístico, sem modelo).
  - Exemplo: `/prose` (plugin OpenProse) — consulte [OpenProse](/pt-BR/prose).
- **Argumentos de comando nativo:** o Discord usa autocomplete para opções dinâmicas (e menus com botões quando você omite argumentos obrigatórios). Telegram e Slack mostram um menu com botões quando um comando oferece suporte a escolhas e você omite o argumento.

## `/tools`

`/tools` responde a uma pergunta de runtime, não a uma pergunta de configuração: **o que este agent pode usar agora nesta
conversa**.

- O `/tools` padrão é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies de comando nativo que oferecem suporte a argumentos expõem a mesma troca de modo `compact|verbose`.
- Os resultados têm escopo de sessão, então mudar agent, canal, thread, autorização do remetente ou modelo pode
  alterar a saída.
- `/tools` inclui ferramentas realmente alcançáveis em runtime, incluindo ferramentas do core, ferramentas de
  plugin conectadas e ferramentas controladas pelo canal.

Para editar perfis e substituições, use o painel de Ferramentas da UI de controle ou superfícies de configuração/catálogo em vez
de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/cota do provedor** (exemplo: “Claude 80% left”) aparece em `/status` para o provedor do modelo atual quando o rastreamento de uso está habilitado. O OpenClaw normaliza janelas de provedor para `% restante`; para MiniMax, campos percentuais somente de restante são invertidos antes da exibição, e respostas `model_remains` preferem a entrada do modelo de chat mais um rótulo de plano com tag de modelo.
- **Linhas de tokens/cache** em `/status` podem recorrer à entrada de uso mais recente da transcrição quando o snapshot ao vivo da sessão é escasso. Valores ao vivo não nulos existentes ainda têm prioridade, e o fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo mais um total maior orientado ao prompt quando totais armazenados estão ausentes ou são menores.
- **Runtime vs runner:** `/status` informa `Runtime` para o caminho efetivo de execução e estado de sandbox, e `Runner` para quem está realmente executando a sessão: Pi incorporado, um provedor apoiado por CLI ou um harness/backend ACP.
- **Tokens/custo por resposta** é controlado por `/usage off|tokens|full` (anexado às respostas normais).
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

- `/model` e `/model list` mostram um seletor compacto numerado (família de modelo + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com dropdowns de provedor e modelo mais uma etapa de envio.
- `/model <#>` seleciona a partir desse seletor (e prefere o provedor atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo endpoint configurado do provedor (`baseUrl`) e modo de API (`api`) quando disponíveis.

## Substituições de depuração

`/debug` permite definir substituições de configuração **somente de runtime** (memória, não disco). Somente owner. Desabilitado por padrão; habilite com `commands.debug: true`.

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
- Use `/debug reset` para limpar todas as substituições e retornar à configuração em disco.

## Saída de rastreamento de plugin

`/trace` permite alternar **linhas de rastreamento/depuração de plugin com escopo de sessão** sem ativar o modo detalhado completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Observações:

- `/trace` sem argumento mostra o estado atual de rastreamento da sessão.
- `/trace on` habilita linhas de rastreamento de plugin para a sessão atual.
- `/trace off` as desabilita novamente.
- Linhas de rastreamento de plugin podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento após a resposta normal do assistente.
- `/trace` não substitui `/debug`; `/debug` continua gerenciando substituições de configuração somente de runtime.
- `/trace` não substitui `/verbose`; a saída detalhada normal de ferramenta/status continua pertencendo a `/verbose`.

## Atualizações de configuração

`/config` grava na sua configuração em disco (`openclaw.json`). Somente owner. Desabilitado por padrão; habilite com `commands.config: true`.

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

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Somente owner. Desabilitado por padrão; habilite com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Observações:

- `/mcp` armazena configuração na configuração do OpenClaw, não nas configurações de projeto controladas pelo Pi.
- Adaptadores de runtime decidem quais transportes são realmente executáveis.

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

Observações:

- `/plugins list` e `/plugins show` usam descoberta real de plugin em relação ao espaço de trabalho atual mais a configuração em disco.
- `/plugins enable|disable` atualiza apenas a configuração do plugin; não instala nem desinstala plugins.
- Após alterações de habilitar/desabilitar, reinicie o Gateway para aplicá-las.

## Observações sobre superfícies

- **Comandos de texto** são executados na sessão normal de chat (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (direciona para a sessão do chat via `CommandTargetSessionKey`)
- **`/stop`** mira a sessão de chat ativa para poder abortar a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda é compatível para um único comando no estilo `/openclaw`. Se você habilitar `commands.native`, deverá criar um comando de barra do Slack por comando interno (mesmos nomes de `/help`). Menus de argumento de comando para Slack são entregues como botões efêmeros do Block Kit.
  - Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O `/status` em texto ainda funciona em mensagens do Slack.

## Perguntas paralelas BTW

`/btw` é uma **pergunta paralela** rápida sobre a sessão atual.

Diferentemente do chat normal:

- ele usa a sessão atual como contexto de fundo,
- é executado como uma chamada separada **sem ferramentas**,
- não altera o contexto futuro da sessão,
- não é gravado no histórico da transcrição,
- é entregue como um resultado paralelo ao vivo em vez de uma mensagem normal do assistente.

Isso torna `/btw` útil quando você quer um esclarecimento temporário enquanto a
tarefa principal continua em andamento.

Exemplo:

```text
/btw o que estamos fazendo agora?
```

Consulte [Perguntas paralelas BTW](/pt-BR/tools/btw) para o comportamento completo e
detalhes da UX do cliente.
