---
read_when:
    - Usando ou configurando comandos de chat
    - Depurando roteamento de comandos ou permissões
summary: 'Comandos de barra: texto vs nativo, configuração e comandos compatíveis'
title: Comandos de barra
x-i18n:
    generated_at: "2026-04-22T04:27:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43cc050149de60ca39083009fd6ce566af3bfa79d455e2e0f44e2d878bf4d2d9
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos de barra

Os comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **independente** que começa com `/`.
O comando de chat bash apenas do host usa `! <cmd>` (com `/bash <cmd>` como alias).

Há dois sistemas relacionados:

- **Comandos**: mensagens independentes `/...`.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - As diretivas são removidas da mensagem antes que o modelo a veja.
  - Em mensagens normais de chat (não apenas com diretivas), elas são tratadas como “dicas inline” e **não** persistem configurações da sessão.
  - Em mensagens apenas com diretivas (a mensagem contém apenas diretivas), elas persistem na sessão e respondem com uma confirmação.
  - Diretivas só são aplicadas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, ele será a única
    allowlist usada; caso contrário, a autorização vem das allowlists/pareamento do canal mais `commands.useAccessGroups`.
    Remetentes não autorizados veem diretivas tratadas como texto simples.

Também há alguns **atalhos inline** (apenas para remetentes em allowlist/autorizados): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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

- `commands.text` (padrão `true`) ativa o parse de `/...` em mensagens de chat.
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), comandos de texto ainda funcionam mesmo se você definir isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ativado para Discord/Telegram; desativado para Slack (até você adicionar comandos de barra); ignorado para provedores sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para sobrescrever por provedor (bool ou `"auto"`).
  - `false` limpa comandos registrados anteriormente no Discord/Telegram na inicialização. Comandos do Slack são gerenciados no app do Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos de **Skill** nativamente quando compatível.
  - Auto: ativado para Discord/Telegram; desativado para Slack (o Slack exige a criação de um comando de barra por Skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para sobrescrever por provedor (bool ou `"auto"`).
- `commands.bash` (padrão `false`) ativa `! <cmd>` para executar comandos de shell do host (`/bash <cmd>` é um alias; exige allowlists de `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla quanto tempo o bash espera antes de mudar para o modo em segundo plano (`0` envia imediatamente para o segundo plano).
- `commands.config` (padrão `false`) ativa `/config` (lê/grava `openclaw.json`).
- `commands.mcp` (padrão `false`) ativa `/mcp` (lê/grava a configuração MCP gerenciada pelo OpenClaw em `mcp.servers`).
- `commands.plugins` (padrão `false`) ativa `/plugins` (descoberta/status de plugin mais controles de instalar + ativar/desativar).
- `commands.debug` (padrão `false`) ativa `/debug` (sobrescritas apenas de runtime).
- `commands.restart` (padrão `true`) ativa `/restart` mais ações de ferramenta de reinício do gateway.
- `commands.ownerAllowFrom` (opcional) define a allowlist explícita de proprietário para superfícies de comando/ferramenta exclusivas do proprietário. Isso é separado de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` por canal (opcional, padrão `false`) faz com que comandos exclusivos do proprietário exijam **identidade de proprietário** para execução nessa superfície. Quando `true`, o remetente deve corresponder a um candidato de proprietário resolvido (por exemplo, uma entrada em `commands.ownerAllowFrom` ou metadados nativos de proprietário do provedor) ou ter escopo interno `operator.admin` em um canal de mensagem interno. Uma entrada curinga em `allowFrom` do canal, ou uma lista vazia/não resolvida de candidatos a proprietário, **não** é suficiente — comandos exclusivos do proprietário falham de forma segura nesse canal. Deixe isso desativado se quiser que comandos exclusivos do proprietário sejam controlados apenas por `ownerAllowFrom` e pelas allowlists padrão de comando.
- `commands.ownerDisplay` controla como IDs de proprietário aparecem no prompt do sistema: `raw` ou `hash`.
- `commands.ownerDisplaySecret` opcionalmente define o segredo HMAC usado quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) define uma allowlist por provedor para autorização de comandos. Quando configurado, ela é a
  única fonte de autorização para comandos e diretivas (allowlists/pareamento do canal e `commands.useAccessGroups`
  são ignorados). Use `"*"` para um padrão global; chaves específicas de provedor sobrescrevem esse valor.
- `commands.useAccessGroups` (padrão `true`) aplica allowlists/políticas para comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Fonte da verdade atual:

- comandos nativos do core vêm de `src/auto-reply/commands-registry.shared.ts`
- comandos dock gerados vêm de `src/auto-reply/commands-registry.data.ts`
- comandos de plugin vêm de chamadas `registerCommand()` do plugin
- a disponibilidade real no seu gateway ainda depende de flags de configuração, superfície de canal e plugins instalados/ativados

### Comandos nativos do core

Comandos nativos disponíveis hoje:

- `/new [model]` inicia uma nova sessão; `/reset` é o alias de redefinição.
- `/reset soft [message]` mantém a transcrição atual, remove IDs de sessão reutilizados do backend de CLI e executa novamente no local o carregamento de inicialização/prompt do sistema.
- `/compact [instructions]` faz Compaction do contexto da sessão. Consulte [/concepts/compaction](/pt-BR/concepts/compaction).
- `/stop` aborta a execução atual.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gerenciam a expiração de binding de thread.
- `/think <level>` define o nível de thinking. As opções vêm do perfil de provedor do modelo ativo; níveis comuns são `off`, `minimal`, `low`, `medium` e `high`, com níveis personalizados como `xhigh`, `adaptive`, `max` ou binário `on` apenas quando compatíveis. Aliases: `/thinking`, `/t`.
- `/verbose on|off|full` alterna a saída detalhada. Alias: `/v`.
- `/trace on|off` alterna a saída de trace de plugin para a sessão atual.
- `/fast [status|on|off]` mostra ou define o modo rápido.
- `/reasoning [on|off|stream]` alterna a visibilidade de reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna o modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra ou define padrões de exec.
- `/model [name|#|status]` mostra ou define o modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` lista provedores ou modelos de um provedor.
- `/queue <mode>` gerencia o comportamento da fila (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) mais opções como `debounce:2s cap:25 drop:summarize`.
- `/help` mostra o resumo curto de ajuda.
- `/commands` mostra o catálogo gerado de comandos.
- `/tools [compact|verbose]` mostra o que o agente atual pode usar agora.
- `/status` mostra o status de runtime, incluindo uso/quota de provedor quando disponível.
- `/tasks` lista tarefas em segundo plano ativas/recentes para a sessão atual.
- `/context [list|detail|json]` explica como o contexto é montado.
- `/export-session [path]` exporta a sessão atual para HTML. Alias: `/export`.
- `/whoami` mostra seu ID de remetente. Alias: `/id`.
- `/skill <name> [input]` executa uma Skill pelo nome.
- `/allowlist [list|add|remove] ...` gerencia entradas de allowlist. Somente texto.
- `/approve <id> <decision>` resolve prompts de aprovação exec.
- `/btw <question>` faz uma pergunta paralela sem alterar o contexto futuro da sessão. Consulte [/tools/btw](/pt-BR/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gerencia execuções de subagente para a sessão atual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gerencia sessões ACP e opções de runtime.
- `/focus <target>` vincula a thread atual do Discord ou tópico/conversa do Telegram a um destino de sessão.
- `/unfocus` remove o binding atual.
- `/agents` lista agentes vinculados à thread para a sessão atual.
- `/kill <id|#|all>` aborta um ou todos os subagentes em execução.
- `/steer <id|#> <message>` envia steering para um subagente em execução. Alias: `/tell`.
- `/config show|get|set|unset` lê ou grava `openclaw.json`. Exclusivo do proprietário. Exige `commands.config: true`.
- `/mcp show|get|set|unset` lê ou grava a configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`. Exclusivo do proprietário. Exige `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspeciona ou altera o estado de plugin. `/plugin` é um alias. Exclusivo do proprietário para gravações. Exige `commands.plugins: true`.
- `/debug show|set|unset|reset` gerencia sobrescritas de configuração apenas de runtime. Exclusivo do proprietário. Exige `commands.debug: true`.
- `/usage off|tokens|full|cost` controla o rodapé de uso por resposta ou imprime um resumo local de custo.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulte [/tools/tts](/pt-BR/tools/tts).
- `/restart` reinicia o OpenClaw quando ativado. Padrão: ativado; defina `commands.restart: false` para desativá-lo.
- `/activation mention|always` define o modo de ativação de grupo.
- `/send on|off|inherit` define a política de envio. Exclusivo do proprietário.
- `/bash <command>` executa um comando de shell do host. Somente texto. Alias: `! <command>`. Exige `commands.bash: true` mais allowlists de `tools.elevated`.
- `!poll [sessionId]` verifica um job bash em segundo plano.
- `!stop [sessionId]` interrompe um job bash em segundo plano.

### Comandos dock gerados

Comandos dock são gerados a partir de plugins de canal com suporte a comando nativo. Conjunto empacotado atual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugin empacotado

Plugins empacotados podem adicionar mais comandos de barra. Comandos empacotados atuais neste repositório:

- `/dreaming [on|off|status|help]` alterna Dreaming da memória. Consulte [Dreaming](/pt-BR/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gerencia o fluxo de pareamento/setup de dispositivo. Consulte [Pareamento](/pt-BR/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` ativa temporariamente comandos de node de telefone de alto risco.
- `/voice status|list [limit]|set <voiceId|name>` gerencia a configuração de voz do Talk. No Discord, o nome do comando nativo é `/talkvoice`.
- `/card ...` envia presets de cartão rich do LINE. Consulte [LINE](/pt-BR/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspeciona e controla o harness do app-server Codex empacotado. Consulte [Harness Codex](/pt-BR/plugins/codex-harness).
- Comandos apenas do QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinâmicos de Skill

Skills invocáveis pelo usuário também são expostas como comandos de barra:

- `/skill <name> [input]` sempre funciona como ponto de entrada genérico.
- Skills também podem aparecer como comandos diretos, como `/prose`, quando a Skill/plugin os registra.
- O registro nativo de comando de Skill é controlado por `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Observações:

- Os comandos aceitam um `:` opcional entre o comando e os argumentos (por exemplo `/think: high`, `/send: on`, `/help:`).
- `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência aproximada); se não houver correspondência, o texto é tratado como corpo da mensagem.
- Para o detalhamento completo de uso do provedor, use `openclaw status --usage`.
- `/allowlist add|remove` exige `commands.config=true` e respeita `configWrites` do canal.
- Em canais com múltiplas contas, `/allowlist --account <id>` direcionado à config e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo local de custo a partir dos logs de sessão do OpenClaw.
- `/restart` é ativado por padrão; defina `commands.restart: false` para desativá-lo.
- `/plugins install <spec>` aceita as mesmas especificações de plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
- `/plugins enable|disable` atualiza a configuração do plugin e pode solicitar um reinício.
- Comando nativo apenas do Discord: `/vc join|leave|status` controla canais de voz (exige `channels.discord.voice` e comandos nativos; não está disponível como texto).
- Comandos de binding de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que os bindings de thread efetivos estejam ativados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência de comando ACP e comportamento de runtime: [Agentes ACP](/pt-BR/tools/acp-agents).
- `/verbose` foi feito para depuração e visibilidade extra; mantenha-o **desativado** no uso normal.
- `/trace` é mais restrito que `/verbose`: ele revela apenas linhas de trace/debug pertencentes ao plugin e mantém desativado o chatter normal e detalhado de ferramenta.
- `/fast on|off` persiste uma sobrescrita de sessão. Use a opção `inherit` da UI de Sessões para limpá-la e voltar aos padrões da configuração.
- `/fast` é específico do provedor: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints nativos de Responses, enquanto solicitações públicas diretas ao Anthropic, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Consulte [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
- Resumos de falha de ferramenta ainda são mostrados quando relevantes, mas texto detalhado de falha só é incluído quando `/verbose` está `on` ou `full`.
- `/reasoning`, `/verbose` e `/trace` são arriscados em configurações de grupo: eles podem revelar reasoning interno, saída de ferramenta ou diagnósticos de plugin que você não pretendia expor. Prefira deixá-los desativados, especialmente em chats de grupo.
- `/model` persiste imediatamente o novo modelo da sessão.
- Se o agente estiver ocioso, a próxima execução o usará imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto limpo de retry.
- Se atividade de ferramenta ou saída de resposta já tiver começado, a troca pendente pode ficar em fila até uma oportunidade posterior de retry ou o próximo turno do usuário.
- **Caminho rápido:** mensagens apenas de comando de remetentes em allowlist são tratadas imediatamente (ignoram fila + modelo).
- **Gate de menção em grupo:** mensagens apenas de comando de remetentes em allowlist ignoram exigências de menção.
- **Atalhos inline (apenas remetentes em allowlist):** certos comandos também funcionam quando incorporados em uma mensagem normal e são removidos antes que o modelo veja o texto restante.
  - Exemplo: `hey /status` dispara uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens apenas de comando não autorizadas são ignoradas silenciosamente, e tokens inline `/...` são tratados como texto simples.
- **Comandos de Skill:** Skills `user-invocable` são expostas como comandos de barra. Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (por exemplo `_2`).
  - `/skill <name> [input]` executa uma Skill pelo nome (útil quando limites de comando nativo impedem comandos por Skill).
  - Por padrão, comandos de Skill são encaminhados ao modelo como uma solicitação normal.
  - Skills podem declarar opcionalmente `command-dispatch: tool` para rotear o comando diretamente para uma ferramenta (determinístico, sem modelo).
  - Exemplo: `/prose` (plugin OpenProse) — consulte [OpenProse](/pt-BR/prose).
- **Argumentos de comando nativo:** o Discord usa autocomplete para opções dinâmicas (e menus de botão quando você omite args obrigatórios). Telegram e Slack mostram um menu de botões quando um comando oferece suporte a escolhas e você omite o arg.

## `/tools`

`/tools` responde a uma pergunta de runtime, não de configuração: **o que este agente pode usar agora
nesta conversa**.

- O padrão de `/tools` é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies de comando nativo que oferecem suporte a argumentos expõem a mesma alternância de modo `compact|verbose`.
- Os resultados têm escopo de sessão, então mudar agente, canal, thread, autorização do remetente ou modelo pode
  alterar a saída.
- `/tools` inclui ferramentas realmente alcançáveis em runtime, incluindo ferramentas do core, ferramentas de
  plugin conectadas e ferramentas pertencentes ao canal.

Para editar perfis e sobrescritas, use o painel Tools da UI de controle ou superfícies de config/catálogo em vez
de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/quota de provedor** (exemplo: “Claude 80% restante”) aparece em `/status` para o provedor do modelo atual quando o rastreamento de uso está ativado. O OpenClaw normaliza janelas de provedor para `% restante`; para MiniMax, campos percentuais apenas de restante são invertidos antes da exibição, e respostas `model_remains` preferem a entrada do modelo de chat mais um rótulo de plano com tag de modelo.
- **Linhas de token/cache** em `/status` podem usar fallback para a entrada mais recente de uso da transcrição quando o snapshot ativo da sessão é escasso. Valores ativos existentes e não zero ainda têm prioridade, e o fallback de transcrição também pode recuperar o rótulo do modelo ativo em runtime mais um total maior orientado a prompt quando totais armazenados estiverem ausentes ou menores.
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

- `/model` e `/model list` mostram um seletor compacto e numerado (família do modelo + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo, além de uma etapa de envio.
- `/model <#>` seleciona a partir desse seletor (e prefere o provedor atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo endpoint configurado do provedor (`baseUrl`) e modo de API (`api`) quando disponíveis.

## Sobrescritas de depuração

`/debug` permite definir sobrescritas de configuração **apenas de runtime** (memória, não disco). Exclusivo do proprietário. Desativado por padrão; ative com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Observações:

- As sobrescritas são aplicadas imediatamente a novas leituras de configuração, mas **não** gravam em `openclaw.json`.
- Use `/debug reset` para limpar todas as sobrescritas e voltar à configuração em disco.

## Saída de trace de plugin

`/trace` permite alternar **linhas de trace/debug de plugin com escopo de sessão** sem ativar o modo verbose completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Observações:

- `/trace` sem argumento mostra o estado atual de trace da sessão.
- `/trace on` ativa linhas de trace de plugin para a sessão atual.
- `/trace off` as desativa novamente.
- Linhas de trace de plugin podem aparecer em `/status` e como uma mensagem de diagnóstico de acompanhamento após a resposta normal do assistente.
- `/trace` não substitui `/debug`; `/debug` continua gerenciando sobrescritas de configuração apenas de runtime.
- `/trace` não substitui `/verbose`; a saída normal detalhada de ferramenta/status continua pertencendo a `/verbose`.

## Atualizações de configuração

`/config` grava na sua configuração em disco (`openclaw.json`). Exclusivo do proprietário. Desativado por padrão; ative com `commands.config: true`.

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
- Atualizações de `/config` persistem após reinícios.

## Atualizações de MCP

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Exclusivo do proprietário. Desativado por padrão; ative com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Observações:

- `/mcp` armazena a configuração na configuração do OpenClaw, não nas configurações de projeto pertencentes ao Pi.
- Adaptadores de runtime decidem quais transportes são realmente executáveis.

## Atualizações de plugin

`/plugins` permite que operadores inspecionem plugins descobertos e alternem a ativação na configuração. Fluxos somente leitura podem usar `/plugin` como alias. Desativado por padrão; ative com `commands.plugins: true`.

Exemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Observações:

- `/plugins list` e `/plugins show` usam descoberta real de plugin em relação ao workspace atual mais a configuração em disco.
- `/plugins enable|disable` atualiza apenas a configuração do plugin; não instala nem desinstala plugins.
- Após alterações de ativação/desativação, reinicie o gateway para aplicá-las.

## Observações sobre superfícies

- **Comandos de texto** são executados na sessão normal de chat (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (aponta para a sessão de chat via `CommandTargetSessionKey`)
- **`/stop`** aponta para a sessão ativa de chat para que possa abortar a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda é compatível para um único comando no estilo `/openclaw`. Se você ativar `commands.native`, deverá criar um comando de barra do Slack por comando nativo (com os mesmos nomes de `/help`). Menus de argumento de comando para o Slack são entregues como botões efêmeros do Block Kit.
  - Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. Texto `/status` ainda funciona em mensagens do Slack.

## Perguntas paralelas BTW

`/btw` é uma **pergunta paralela** rápida sobre a sessão atual.

Diferentemente do chat normal:

- ele usa a sessão atual como contexto de fundo,
- ele é executado como uma chamada separada e **sem ferramentas**,
- ele não altera o contexto futuro da sessão,
- ele não é gravado no histórico da transcrição,
- ele é entregue como um resultado lateral ao vivo em vez de uma mensagem normal do assistente.

Isso torna `/btw` útil quando você quer um esclarecimento temporário enquanto a
tarefa principal continua.

Exemplo:

```text
/btw o que estamos fazendo agora?
```

Consulte [Perguntas paralelas BTW](/pt-BR/tools/btw) para ver o comportamento completo e
detalhes de UX do cliente.
