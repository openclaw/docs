---
read_when:
    - Usando ou configurando comandos de chat
    - Depurando o roteamento de comandos ou permissões
summary: 'Comandos slash: texto vs nativo, configuração e comandos compatíveis'
title: Comandos slash
x-i18n:
    generated_at: "2026-04-11T02:47:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cc346361c3b1a63aae9ec0f28706f4cb0b866b6c858a3999101f6927b923b4a
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos slash

Os comandos são tratados pelo Gateway. A maioria dos comandos precisa ser enviada como uma mensagem **autônoma** que começa com `/`.
O comando de chat bash apenas do host usa `! <cmd>` (com `/bash <cmd>` como alias).

Há dois sistemas relacionados:

- **Comandos**: mensagens autônomas `/...`.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - As diretivas são removidas da mensagem antes de o modelo vê-la.
  - Em mensagens normais de chat (não apenas com diretivas), elas são tratadas como “dicas inline” e **não** persistem as configurações da sessão.
  - Em mensagens apenas com diretivas (a mensagem contém apenas diretivas), elas persistem na sessão e respondem com uma confirmação.
  - As diretivas são aplicadas apenas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, ele será a única
    allowlist usada; caso contrário, a autorização vem de allowlists/pairing do canal mais `commands.useAccessGroups`.
    Remetentes não autorizados veem as diretivas tratadas como texto simples.

Também existem alguns **atalhos inline** (apenas para remetentes em allowlist/autorizados): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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

- `commands.text` (padrão `true`) ativa o parsing de `/...` em mensagens de chat.
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), os comandos de texto ainda funcionam mesmo se você definir isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ativado para Discord/Telegram; desativado para Slack (até você adicionar slash commands); ignorado para provedores sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para substituir por provedor (bool ou `"auto"`).
  - `false` limpa comandos previamente registrados no Discord/Telegram na inicialização. Os comandos do Slack são gerenciados no app do Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos de **Skills** nativamente quando houver suporte.
  - Auto: ativado para Discord/Telegram; desativado para Slack (o Slack exige criar um slash command para cada Skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para substituir por provedor (bool ou `"auto"`).
- `commands.bash` (padrão `false`) ativa `! <cmd>` para executar comandos do shell do host (`/bash <cmd>` é um alias; exige allowlists de `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla quanto tempo o bash espera antes de mudar para o modo em segundo plano (`0` coloca em segundo plano imediatamente).
- `commands.config` (padrão `false`) ativa `/config` (lê/escreve `openclaw.json`).
- `commands.mcp` (padrão `false`) ativa `/mcp` (lê/escreve a configuração de MCP gerenciada pelo OpenClaw em `mcp.servers`).
- `commands.plugins` (padrão `false`) ativa `/plugins` (descoberta/status de plugins mais controles de instalação e ativação/desativação).
- `commands.debug` (padrão `false`) ativa `/debug` (substituições apenas de runtime).
- `commands.restart` (padrão `true`) ativa `/restart` mais ações de ferramenta de reinício do gateway.
- `commands.ownerAllowFrom` (opcional) define a allowlist explícita do owner para superfícies de comando/ferramenta exclusivas do owner. Isso é separado de `commands.allowFrom`.
- `commands.ownerDisplay` controla como ids do owner aparecem no prompt do sistema: `raw` ou `hash`.
- `commands.ownerDisplaySecret` opcionalmente define o segredo HMAC usado quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) define uma allowlist por provedor para autorização de comandos. Quando configurado, ela é a
  única fonte de autorização para comandos e diretivas (`commands.useAccessGroups` e allowlists/pairing de canal
  são ignorados). Use `"*"` para um padrão global; chaves específicas por provedor o substituem.
- `commands.useAccessGroups` (padrão `true`) aplica allowlists/políticas a comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Fonte da verdade atual:

- built-ins do core vêm de `src/auto-reply/commands-registry.shared.ts`
- comandos dock gerados vêm de `src/auto-reply/commands-registry.data.ts`
- comandos de plugin vêm de chamadas `registerCommand()` do plugin
- a disponibilidade real no seu gateway ainda depende de flags de configuração, superfície do canal e plugins instalados/ativados

### Comandos built-in do core

Comandos built-in disponíveis hoje:

- `/new [model]` inicia uma nova sessão; `/reset` é o alias de reset.
- `/compact [instructions]` compacta o contexto da sessão. Consulte [/concepts/compaction](/pt-BR/concepts/compaction).
- `/stop` aborta a execução atual.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gerenciam a expiração do binding de thread.
- `/think <off|minimal|low|medium|high|xhigh>` define o nível de thinking. Aliases: `/thinking`, `/t`.
- `/verbose on|off|full` alterna a saída detalhada. Alias: `/v`.
- `/fast [status|on|off]` mostra ou define o modo fast.
- `/reasoning [on|off|stream]` alterna a visibilidade de reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna o modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra ou define os padrões de execução.
- `/model [name|#|status]` mostra ou define o modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` lista provedores ou modelos de um provedor.
- `/queue <mode>` gerencia o comportamento da fila (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) mais opções como `debounce:2s cap:25 drop:summarize`.
- `/help` mostra o resumo curto de ajuda.
- `/commands` mostra o catálogo de comandos gerado.
- `/tools [compact|verbose]` mostra o que o agente atual pode usar agora.
- `/status` mostra o status do runtime, incluindo uso/quota do provedor quando disponível.
- `/tasks` lista tarefas em segundo plano ativas/recentes da sessão atual.
- `/context [list|detail|json]` explica como o contexto é montado.
- `/export-session [path]` exporta a sessão atual para HTML. Alias: `/export`.
- `/whoami` mostra seu id de remetente. Alias: `/id`.
- `/skill <name> [input]` executa uma Skill pelo nome.
- `/allowlist [list|add|remove] ...` gerencia entradas da allowlist. Somente texto.
- `/approve <id> <decision>` resolve prompts de aprovação de execução.
- `/btw <question>` faz uma pergunta paralela sem alterar o contexto futuro da sessão. Consulte [/tools/btw](/pt-BR/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gerencia execuções de subagente para a sessão atual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gerencia sessões ACP e opções de runtime.
- `/focus <target>` vincula a thread atual do Discord ou o tópico/conversa do Telegram a um alvo de sessão.
- `/unfocus` remove o binding atual.
- `/agents` lista os agentes vinculados à thread para a sessão atual.
- `/kill <id|#|all>` aborta um ou todos os subagentes em execução.
- `/steer <id|#> <message>` envia direcionamento para um subagente em execução. Alias: `/tell`.
- `/config show|get|set|unset` lê ou grava `openclaw.json`. Apenas owner. Exige `commands.config: true`.
- `/mcp show|get|set|unset` lê ou grava a configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`. Apenas owner. Exige `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspeciona ou altera o estado do plugin. `/plugin` é um alias. Escritas são apenas para owner. Exige `commands.plugins: true`.
- `/debug show|set|unset|reset` gerencia substituições apenas de runtime. Apenas owner. Exige `commands.debug: true`.
- `/usage off|tokens|full|cost` controla o rodapé de uso por resposta ou imprime um resumo local de custo.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Consulte [/tools/tts](/pt-BR/tools/tts).
- `/restart` reinicia o OpenClaw quando ativado. Padrão: ativado; defina `commands.restart: false` para desativá-lo.
- `/activation mention|always` define o modo de ativação em grupo.
- `/send on|off|inherit` define a política de envio. Apenas owner.
- `/bash <command>` executa um comando do shell do host. Somente texto. Alias: `! <command>`. Exige `commands.bash: true` mais allowlists de `tools.elevated`.
- `!poll [sessionId]` verifica um job bash em segundo plano.
- `!stop [sessionId]` interrompe um job bash em segundo plano.

### Comandos dock gerados

Os comandos dock são gerados a partir de plugins de canal com suporte a comando nativo. Conjunto empacotado atual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugins empacotados

Plugins empacotados podem adicionar mais slash commands. Comandos empacotados atuais neste repositório:

- `/dreaming [on|off|status|help]` alterna o dreaming de memória. Consulte [Dreaming](/pt-BR/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gerencia o fluxo de pairing/setup do dispositivo. Consulte [Pairing](/pt-BR/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporariamente comandos de node de telefone de alto risco.
- `/voice status|list [limit]|set <voiceId|name>` gerencia a configuração de voz do Talk. No Discord, o nome do comando nativo é `/talkvoice`.
- `/card ...` envia predefinições de rich card do LINE. Consulte [LINE](/pt-BR/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspeciona e controla o harness app-server do Codex empacotado. Consulte [Harness do Codex](/pt-BR/plugins/codex-harness).
- Comandos apenas do QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinâmicos de Skills

Skills invocáveis pelo usuário também são expostas como slash commands:

- `/skill <name> [input]` sempre funciona como ponto de entrada genérico.
- as Skills também podem aparecer como comandos diretos, como `/prose`, quando a Skill/o plugin os registra.
- o registro nativo de comandos de Skill é controlado por `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Observações:

- Os comandos aceitam um `:` opcional entre o comando e os argumentos (por exemplo, `/think: high`, `/send: on`, `/help:`).
- `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência aproximada); se não houver correspondência, o texto será tratado como corpo da mensagem.
- Para o detalhamento completo de uso por provedor, use `openclaw status --usage`.
- `/allowlist add|remove` exige `commands.config=true` e respeita `configWrites` do canal.
- Em canais com várias contas, `/allowlist --account <id>` direcionado à configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo local de custo a partir dos logs de sessão do OpenClaw.
- `/restart` vem ativado por padrão; defina `commands.restart: false` para desativá-lo.
- `/plugins install <spec>` aceita as mesmas especificações de plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
- `/plugins enable|disable` atualiza a configuração do plugin e pode solicitar um reinício.
- Comando nativo apenas do Discord: `/vc join|leave|status` controla canais de voz (exige `channels.discord.voice` e comandos nativos; não está disponível como texto).
- Os comandos de binding de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que bindings de thread efetivos estejam ativados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência de comando ACP e comportamento de runtime: [ACP Agents](/pt-BR/tools/acp-agents).
- `/verbose` foi feito para depuração e visibilidade extra; mantenha-o **desativado** no uso normal.
- `/fast on|off` persiste uma substituição de sessão. Use a opção `inherit` na UI de Sessões para limpá-la e voltar aos padrões da configuração.
- `/fast` é específico do provedor: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints nativos de Responses, enquanto requisições públicas diretas da Anthropic, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Consulte [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
- Resumos de falha de ferramenta ainda são mostrados quando relevante, mas o texto detalhado da falha só é incluído quando `/verbose` está `on` ou `full`.
- `/reasoning` (e `/verbose`) são arriscados em contextos de grupo: eles podem revelar raciocínio interno ou saída de ferramenta que você não pretendia expor. Prefira deixá-los desativados, especialmente em chats de grupo.
- `/model` persiste imediatamente o novo modelo da sessão.
- Se o agente estiver ocioso, a próxima execução o usa imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca em tempo real como pendente e só reinicia no novo modelo em um ponto limpo de retry.
- Se a atividade de ferramenta ou a saída de resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade posterior de retry ou o próximo turno do usuário.
- **Caminho rápido:** mensagens apenas com comandos de remetentes em allowlist são tratadas imediatamente (ignoram fila + modelo).
- **Controle de menção em grupo:** mensagens apenas com comandos de remetentes em allowlist ignoram exigências de menção.
- **Atalhos inline (apenas para remetentes em allowlist):** certos comandos também funcionam quando embutidos em uma mensagem normal e são removidos antes de o modelo ver o restante da mensagem.
  - Exemplo: `hey /status` dispara uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens apenas com comando de remetentes não autorizados são ignoradas silenciosamente, e tokens inline `/...` são tratados como texto simples.
- **Comandos de Skill:** Skills `user-invocable` são expostas como slash commands. Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (por exemplo, `_2`).
  - `/skill <name> [input]` executa uma Skill pelo nome (útil quando limites de comando nativo impedem comandos por Skill).
  - Por padrão, comandos de Skill são encaminhados ao modelo como uma solicitação normal.
  - As Skills podem opcionalmente declarar `command-dispatch: tool` para rotear o comando diretamente para uma ferramenta (determinístico, sem modelo).
  - Exemplo: `/prose` (plugin OpenProse) — consulte [OpenProse](/pt-BR/prose).
- **Argumentos de comando nativo:** o Discord usa autocomplete para opções dinâmicas (e menus com botões quando você omite argumentos obrigatórios). Telegram e Slack mostram um menu com botões quando um comando oferece suporte a escolhas e você omite o argumento.

## `/tools`

`/tools` responde a uma pergunta de runtime, não a uma pergunta de configuração: **o que este agente pode usar agora
nesta conversa**.

- O `/tools` padrão é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies de comando nativo com suporte a argumentos expõem a mesma troca de modo `compact|verbose`.
- Os resultados têm escopo de sessão, então mudar agente, canal, thread, autorização do remetente ou modelo pode
  alterar a saída.
- `/tools` inclui ferramentas realmente alcançáveis em runtime, incluindo ferramentas do core, ferramentas
  de plugins conectados e ferramentas pertencentes ao canal.

Para edição de perfil e substituições, use o painel de Tools da Control UI ou superfícies de configuração/catálogo em vez
de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/quota do provedor** (exemplo: “Claude 80% left”) aparece em `/status` para o provedor do modelo atual quando o rastreamento de uso está ativado. O OpenClaw normaliza janelas do provedor para `% restante`; para MiniMax, campos de porcentagem somente restante são invertidos antes da exibição, e respostas `model_remains` preferem a entrada do modelo de chat mais um rótulo de plano marcado com o modelo.
- **Linhas de tokens/cache** em `/status` podem recorrer à entrada de uso mais recente da transcrição quando o snapshot da sessão ativa está esparso. Valores ativos não zero existentes ainda prevalecem, e o fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo mais um total maior orientado a prompt quando totais armazenados estiverem ausentes ou forem menores.
- **Tokens/custo por resposta** é controlado por `/usage off|tokens|full` (anexado às respostas normais).
- `/model status` trata de **modelos/auth/endpoints**, não de uso.

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
- No Discord, `/model` e `/models` abrem um seletor interativo com dropdowns de provedor e modelo mais uma etapa de envio.
- `/model <#>` seleciona a partir desse seletor (e prefere o provedor atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo o endpoint configurado do provedor (`baseUrl`) e o modo de API (`api`) quando disponível.

## Substituições de depuração

`/debug` permite definir substituições de configuração **apenas de runtime** (em memória, não em disco). Apenas owner. Desativado por padrão; ative com `commands.debug: true`.

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

## Atualizações de configuração

`/config` grava na sua configuração em disco (`openclaw.json`). Apenas owner. Desativado por padrão; ative com `commands.config: true`.

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

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Apenas owner. Desativado por padrão; ative com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Observações:

- `/mcp` armazena a configuração na configuração do OpenClaw, não em settings de projeto pertencentes ao Pi.
- Adapters de runtime decidem quais transportes são realmente executáveis.

## Atualizações de plugins

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

- `/plugins list` e `/plugins show` usam descoberta real de plugin no workspace atual mais a configuração em disco.
- `/plugins enable|disable` atualiza apenas a configuração do plugin; não instala nem desinstala plugins.
- Após alterações de ativação/desativação, reinicie o gateway para aplicá-las.

## Observações sobre superfícies

- **Comandos de texto** são executados na sessão normal de chat (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (direciona à sessão do chat por `CommandTargetSessionKey`)
- **`/stop`** tem como alvo a sessão ativa de chat para poder abortar a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda é compatível para um único comando no estilo `/openclaw`. Se você ativar `commands.native`, precisará criar um slash command do Slack para cada comando built-in (mesmos nomes de `/help`). Menus de argumentos de comando para Slack são entregues como botões efêmeros em Block Kit.
  - Exceção de comando nativo no Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O `/status` de texto ainda funciona em mensagens do Slack.

## Perguntas paralelas BTW

`/btw` é uma **pergunta paralela** rápida sobre a sessão atual.

Diferentemente do chat normal:

- ele usa a sessão atual como contexto de fundo,
- é executado como uma chamada one-shot **sem ferramentas** separada,
- não altera o contexto futuro da sessão,
- não é gravado no histórico da transcrição,
- é entregue como um resultado paralelo ao vivo em vez de uma mensagem normal do assistente.

Isso torna `/btw` útil quando você quer um esclarecimento temporário enquanto a
tarefa principal continua em andamento.

Exemplo:

```text
/btw o que estamos fazendo agora?
```

Consulte [Perguntas paralelas BTW](/pt-BR/tools/btw) para o comportamento completo e os
detalhes de UX do cliente.
