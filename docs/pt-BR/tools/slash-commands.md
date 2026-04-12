---
read_when:
    - Uso ou configuração de comandos de chat
    - Depurando roteamento de comandos ou permissões
summary: 'Comandos slash: texto vs nativo, configuração e comandos compatíveis'
title: Comandos slash
x-i18n:
    generated_at: "2026-04-12T23:33:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ef6f54500fa2ce3b873a8398d6179a0882b8bf6fba38f61146c64671055505e
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandos slash

Os comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **independente** que comece com `/`.
O comando de chat bash somente no host usa `! <cmd>` (com `/bash <cmd>` como alias).

Há dois sistemas relacionados:

- **Comandos**: mensagens independentes `/...`.
- **Diretivas**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - As diretivas são removidas da mensagem antes que o modelo a veja.
  - Em mensagens normais de chat (não apenas diretivas), elas são tratadas como “dicas inline” e **não** persistem as configurações da sessão.
  - Em mensagens compostas apenas por diretivas (a mensagem contém somente diretivas), elas persistem na sessão e respondem com uma confirmação.
  - As diretivas são aplicadas apenas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, ele será a única
    allowlist usada; caso contrário, a autorização vem de allowlists/emparelhamento do canal mais `commands.useAccessGroups`.
    Remetentes não autorizados veem diretivas tratadas como texto simples.

Também existem alguns **atalhos inline** (somente para remetentes autorizados/em allowlist): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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
  - Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), comandos de texto continuam funcionando mesmo se você definir isso como `false`.
- `commands.native` (padrão `"auto"`) registra comandos nativos.
  - Auto: ativado para Discord/Telegram; desativado para Slack (até você adicionar comandos slash); ignorado para provedores sem suporte nativo.
  - Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para substituir por provedor (bool ou `"auto"`).
  - `false` limpa comandos registrados anteriormente no Discord/Telegram na inicialização. Comandos do Slack são gerenciados no app do Slack e não são removidos automaticamente.
- `commands.nativeSkills` (padrão `"auto"`) registra comandos de **Skills** nativamente quando houver suporte.
  - Auto: ativado para Discord/Telegram; desativado para Slack (o Slack exige criar um comando slash por skill).
  - Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para substituir por provedor (bool ou `"auto"`).
- `commands.bash` (padrão `false`) habilita `! <cmd>` para executar comandos de shell do host (`/bash <cmd>` é um alias; exige allowlists de `tools.elevated`).
- `commands.bashForegroundMs` (padrão `2000`) controla quanto tempo o bash espera antes de mudar para modo em segundo plano (`0` envia imediatamente para segundo plano).
- `commands.config` (padrão `false`) habilita `/config` (lê/grava `openclaw.json`).
- `commands.mcp` (padrão `false`) habilita `/mcp` (lê/grava a configuração de MCP gerenciada pelo OpenClaw em `mcp.servers`).
- `commands.plugins` (padrão `false`) habilita `/plugins` (descoberta/status de plugins mais controles de instalar + habilitar/desabilitar).
- `commands.debug` (padrão `false`) habilita `/debug` (substituições apenas de runtime).
- `commands.restart` (padrão `true`) habilita `/restart` mais ações da ferramenta de reinicialização do Gateway.
- `commands.ownerAllowFrom` (opcional) define a allowlist explícita do proprietário para superfícies de comando/ferramenta exclusivas do proprietário. Isso é separado de `commands.allowFrom`.
- `commands.ownerDisplay` controla como IDs do proprietário aparecem no prompt de sistema: `raw` ou `hash`.
- `commands.ownerDisplaySecret` define opcionalmente o segredo HMAC usado quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opcional) define uma allowlist por provedor para autorização de comandos. Quando configurado, ele é a
  única fonte de autorização para comandos e diretivas (allowlists/emparelhamento do canal e `commands.useAccessGroups`
  são ignorados). Use `"*"` para um padrão global; chaves específicas do provedor têm prioridade.
- `commands.useAccessGroups` (padrão `true`) aplica allowlists/políticas para comandos quando `commands.allowFrom` não está definido.

## Lista de comandos

Fonte da verdade atual:

- comandos integrados do core vêm de `src/auto-reply/commands-registry.shared.ts`
- comandos dock gerados vêm de `src/auto-reply/commands-registry.data.ts`
- comandos de plugins vêm de chamadas `registerCommand()` do plugin
- a disponibilidade real no seu Gateway ainda depende de flags de configuração, superfície do canal e plugins instalados/habilitados

### Comandos integrados do core

Comandos integrados disponíveis hoje:

- `/new [model]` inicia uma nova sessão; `/reset` é o alias de reset.
- `/compact [instructions]` compacta o contexto da sessão. Veja [/concepts/compaction](/pt-BR/concepts/compaction).
- `/stop` interrompe a execução atual.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gerenciam a expiração do vínculo da thread.
- `/think <off|minimal|low|medium|high|xhigh>` define o nível de thinking. Aliases: `/thinking`, `/t`.
- `/verbose on|off|full` alterna a saída detalhada. Alias: `/v`.
- `/trace on|off` alterna a saída de trace de plugin para a sessão atual.
- `/fast [status|on|off]` mostra ou define o modo rápido.
- `/reasoning [on|off|stream]` alterna a visibilidade do raciocínio. Alias: `/reason`.
- `/elevated [on|off|ask|full]` alterna o modo elevado. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra ou define os padrões de exec.
- `/model [name|#|status]` mostra ou define o modelo.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` lista provedores ou modelos de um provedor.
- `/queue <mode>` gerencia o comportamento da fila (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) mais opções como `debounce:2s cap:25 drop:summarize`.
- `/help` mostra o resumo curto de ajuda.
- `/commands` mostra o catálogo gerado de comandos.
- `/tools [compact|verbose]` mostra o que o agente atual pode usar agora.
- `/status` mostra o status do runtime, incluindo uso/quota do provedor quando disponível.
- `/tasks` lista tarefas em segundo plano ativas/recentes da sessão atual.
- `/context [list|detail|json]` explica como o contexto é montado.
- `/export-session [path]` exporta a sessão atual para HTML. Alias: `/export`.
- `/whoami` mostra seu ID de remetente. Alias: `/id`.
- `/skill <name> [input]` executa uma skill pelo nome.
- `/allowlist [list|add|remove] ...` gerencia entradas de allowlist. Somente texto.
- `/approve <id> <decision>` resolve prompts de aprovação de exec.
- `/btw <question>` faz uma pergunta paralela sem alterar o contexto futuro da sessão. Veja [/tools/btw](/pt-BR/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gerencia execuções de subagentes da sessão atual.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gerencia sessões ACP e opções de runtime.
- `/focus <target>` vincula a thread atual do Discord ou tópico/conversa do Telegram a um alvo de sessão.
- `/unfocus` remove o vínculo atual.
- `/agents` lista agentes vinculados à thread da sessão atual.
- `/kill <id|#|all>` interrompe um ou todos os subagentes em execução.
- `/steer <id|#> <message>` envia steering para um subagente em execução. Alias: `/tell`.
- `/config show|get|set|unset` lê ou grava `openclaw.json`. Somente proprietário. Exige `commands.config: true`.
- `/mcp show|get|set|unset` lê ou grava a configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`. Somente proprietário. Exige `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspeciona ou altera o estado de plugins. `/plugin` é um alias. Somente proprietário para gravações. Exige `commands.plugins: true`.
- `/debug show|set|unset|reset` gerencia substituições de configuração apenas de runtime. Somente proprietário. Exige `commands.debug: true`.
- `/usage off|tokens|full|cost` controla o rodapé de uso por resposta ou imprime um resumo local de custo.
- `/tts on|off|status|provider|limit|summary|audio|help` controla TTS. Veja [/tools/tts](/pt-BR/tools/tts).
- `/restart` reinicia o OpenClaw quando habilitado. Padrão: habilitado; defina `commands.restart: false` para desabilitar.
- `/activation mention|always` define o modo de ativação de grupo.
- `/send on|off|inherit` define a política de envio. Somente proprietário.
- `/bash <command>` executa um comando de shell no host. Somente texto. Alias: `! <command>`. Exige `commands.bash: true` mais allowlists de `tools.elevated`.
- `!poll [sessionId]` verifica um job bash em segundo plano.
- `!stop [sessionId]` interrompe um job bash em segundo plano.

### Comandos dock gerados

Comandos dock são gerados a partir de plugins de canal com suporte a comandos nativos. Conjunto integrado atual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandos de plugins integrados

Plugins integrados podem adicionar mais comandos slash. Comandos integrados atuais neste repositório:

- `/dreaming [on|off|status|help]` alterna Dreaming de memória. Veja [Dreaming](/pt-BR/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gerencia o fluxo de emparelhamento/configuração de dispositivo. Veja [Emparelhamento](/pt-BR/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporariamente comandos de Node do telefone de alto risco.
- `/voice status|list [limit]|set <voiceId|name>` gerencia a configuração de voz do Talk. No Discord, o nome do comando nativo é `/talkvoice`.
- `/card ...` envia presets de rich card do LINE. Veja [LINE](/pt-BR/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspeciona e controla o harness do app-server Codex integrado. Veja [Codex Harness](/pt-BR/plugins/codex-harness).
- Comandos exclusivos do QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinâmicos de Skills

Skills invocáveis pelo usuário também são expostas como comandos slash:

- `/skill <name> [input]` sempre funciona como ponto de entrada genérico.
- as skills também podem aparecer como comandos diretos, como `/prose`, quando a skill/plugin os registra.
- o registro nativo de comandos de skill é controlado por `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Observações:

- Comandos aceitam um `:` opcional entre o comando e os argumentos (por exemplo `/think: high`, `/send: on`, `/help:`).
- `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência aproximada); se não houver correspondência, o texto é tratado como corpo da mensagem.
- Para o detalhamento completo de uso por provedor, use `openclaw status --usage`.
- `/allowlist add|remove` exige `commands.config=true` e respeita `configWrites` do canal.
- Em canais com várias contas, `/allowlist --account <id>` direcionado à configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
- `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo local de custo a partir dos logs de sessão do OpenClaw.
- `/restart` vem habilitado por padrão; defina `commands.restart: false` para desabilitar.
- `/plugins install <spec>` aceita as mesmas especificações de plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
- `/plugins enable|disable` atualiza a configuração do plugin e pode solicitar uma reinicialização.
- Comando nativo exclusivo do Discord: `/vc join|leave|status` controla canais de voz (exige `channels.discord.voice` e comandos nativos; não está disponível como texto).
- Comandos de vínculo de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que os vínculos efetivos de thread estejam habilitados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
- Referência do comando ACP e comportamento em runtime: [Agentes ACP](/pt-BR/tools/acp-agents).
- `/verbose` é destinado a depuração e visibilidade extra; mantenha-o **desativado** no uso normal.
- `/trace` é mais restrito que `/verbose`: ele revela apenas linhas de trace/debug pertencentes ao plugin e mantém desligado o chatter normal detalhado de ferramentas.
- `/fast on|off` persiste uma substituição da sessão. Use a opção `inherit` na UI de Sessões para limpá-la e voltar ao padrão da configuração.
- `/fast` é específico por provedor: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints nativos de Responses, enquanto solicitações diretas públicas ao Anthropic, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Veja [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
- Resumos de falha de ferramenta ainda são mostrados quando relevantes, mas o texto detalhado da falha só é incluído quando `/verbose` está `on` ou `full`.
- `/reasoning`, `/verbose` e `/trace` são arriscados em configurações de grupo: eles podem revelar raciocínio interno, saída de ferramentas ou diagnósticos de plugin que você não pretendia expor. Prefira deixá-los desativados, especialmente em chats de grupo.
- `/model` persiste o novo modelo da sessão imediatamente.
- Se o agente estiver ocioso, a próxima execução o usará imediatamente.
- Se já houver uma execução ativa, o OpenClaw marca uma troca ativa como pendente e só reinicia no novo modelo em um ponto limpo de retry.
- Se a atividade de ferramenta ou a saída de resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade posterior de retry ou o próximo turno do usuário.
- **Caminho rápido:** mensagens compostas apenas por comandos de remetentes em allowlist são tratadas imediatamente (ignoram fila + modelo).
- **Gate de menção em grupo:** mensagens compostas apenas por comandos de remetentes em allowlist ignoram requisitos de menção.
- **Atalhos inline (somente remetentes em allowlist):** certos comandos também funcionam quando embutidos em uma mensagem normal e são removidos antes que o modelo veja o restante do texto.
  - Exemplo: `hey /status` dispara uma resposta de status, e o texto restante continua pelo fluxo normal.
- Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Mensagens compostas apenas por comandos de remetentes não autorizados são ignoradas silenciosamente, e tokens inline `/...` são tratados como texto simples.
- **Comandos de Skills:** Skills `user-invocable` são expostas como comandos slash. Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (por exemplo `_2`).
  - `/skill <name> [input]` executa uma skill pelo nome (útil quando limites de comando nativo impedem comandos por skill).
  - Por padrão, comandos de skill são encaminhados ao modelo como uma solicitação normal.
  - Skills podem opcionalmente declarar `command-dispatch: tool` para rotear o comando diretamente para uma ferramenta (determinístico, sem modelo).
  - Exemplo: `/prose` (plugin OpenProse) — veja [OpenProse](/pt-BR/prose).
- **Argumentos de comandos nativos:** o Discord usa autocomplete para opções dinâmicas (e menus com botões quando você omite argumentos obrigatórios). Telegram e Slack mostram um menu com botões quando um comando oferece escolhas e você omite o argumento.

## `/tools`

`/tools` responde a uma pergunta de runtime, não a uma pergunta de configuração: **o que este agente pode usar agora
nesta conversa**.

- O `/tools` padrão é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies de comando nativo com suporte a argumentos expõem a mesma troca de modo `compact|verbose`.
- Os resultados têm escopo de sessão, então mudar agente, canal, thread, autorização do remetente ou modelo pode
  alterar a saída.
- `/tools` inclui ferramentas realmente acessíveis em runtime, incluindo ferramentas do core, ferramentas
  conectadas de plugins e ferramentas pertencentes ao canal.

Para editar perfis e substituições, use o painel de Ferramentas da Control UI ou superfícies de configuração/catálogo em vez
de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/quota do provedor** (exemplo: “Claude 80% restante”) aparece em `/status` para o provedor do modelo atual quando o rastreamento de uso está habilitado. O OpenClaw normaliza janelas de provedor para `% restante`; para MiniMax, campos de porcentagem com apenas o restante são invertidos antes da exibição, e respostas `model_remains` preferem a entrada do modelo de chat mais um rótulo de plano com tag de modelo.
- **Linhas de token/cache** em `/status` podem recorrer à entrada de uso mais recente da transcrição quando o snapshot da sessão ao vivo está escasso. Valores ao vivo não nulos existentes ainda têm prioridade, e o fallback da transcrição também pode recuperar o rótulo ativo do modelo de runtime mais um total maior orientado a prompt quando totais armazenados estiverem ausentes ou forem menores.
- **Tokens/custo por resposta** são controlados por `/usage off|tokens|full` (anexados às respostas normais).
- `/model status` é sobre **modelos/autenticação/endpoints**, não sobre uso.

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

- `/model` e `/model list` mostram um seletor compacto numerado (família do modelo + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo mais uma etapa de Submit.
- `/model <#>` seleciona a partir desse seletor (e prefere o provedor atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo o endpoint configurado do provedor (`baseUrl`) e o modo de API (`api`) quando disponíveis.

## Substituições de debug

`/debug` permite definir substituições de configuração **somente de runtime** (memória, não disco). Somente proprietário. Desabilitado por padrão; habilite com `commands.debug: true`.

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

## Saída de trace de plugins

`/trace` permite alternar **linhas de trace/debug de plugins com escopo de sessão** sem ativar o modo verbose completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Observações:

- `/trace` sem argumento mostra o estado atual de trace da sessão.
- `/trace on` habilita linhas de trace de plugin para a sessão atual.
- `/trace off` as desabilita novamente.
- Linhas de trace de plugin podem aparecer em `/status` e como uma mensagem de diagnóstico de acompanhamento após a resposta normal do assistente.
- `/trace` não substitui `/debug`; `/debug` continua gerenciando substituições de configuração apenas de runtime.
- `/trace` não substitui `/verbose`; a saída verbose normal de ferramentas/status continua pertencendo a `/verbose`.

## Atualizações de configuração

`/config` grava na sua configuração em disco (`openclaw.json`). Somente proprietário. Desabilitado por padrão; habilite com `commands.config: true`.

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
- Atualizações por `/config` persistem após reinicializações.

## Atualizações de MCP

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Somente proprietário. Desabilitado por padrão; habilite com `commands.mcp: true`.

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

## Atualizações de plugins

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

- `/plugins list` e `/plugins show` usam descoberta real de plugins no workspace atual mais a configuração em disco.
- `/plugins enable|disable` atualiza apenas a configuração do plugin; não instala nem desinstala plugins.
- Após alterações de habilitar/desabilitar, reinicie o Gateway para aplicá-las.

## Observações por superfície

- **Comandos de texto** são executados na sessão normal de chat (DMs compartilham `main`, grupos têm sua própria sessão).
- **Comandos nativos** usam sessões isoladas:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (aponta para a sessão do chat via `CommandTargetSessionKey`)
- **`/stop`** mira a sessão de chat ativa para que possa interromper a execução atual.
- **Slack:** `channels.slack.slashCommand` ainda é compatível para um único comando no estilo `/openclaw`. Se você habilitar `commands.native`, precisará criar um comando slash no Slack para cada comando integrado (com os mesmos nomes de `/help`). Menus de argumentos de comando para Slack são entregues como botões Block Kit efêmeros.
  - Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O `/status` em texto continua funcionando em mensagens do Slack.

## Perguntas paralelas com BTW

`/btw` é uma **pergunta paralela** rápida sobre a sessão atual.

Diferentemente do chat normal:

- ele usa a sessão atual como contexto de fundo,
- ele é executado como uma chamada isolada **sem ferramentas**,
- ele não altera o contexto futuro da sessão,
- ele não é gravado no histórico da transcrição,
- ele é entregue como um resultado lateral ao vivo, e não como uma mensagem normal do assistente.

Isso faz de `/btw` algo útil quando você quer um esclarecimento temporário enquanto a
tarefa principal continua.

Exemplo:

```text
/btw o que estamos fazendo agora?
```

Veja [Perguntas paralelas BTW](/pt-BR/tools/btw) para o comportamento completo e os
detalhes de UX do cliente.
