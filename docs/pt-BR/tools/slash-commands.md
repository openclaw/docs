---
read_when:
    - Usar ou configurar comandos de chat
    - Depuração do roteamento de comandos ou permissões
sidebarTitle: Slash commands
summary: 'Comandos de barra: texto versus nativo, configuração e comandos compatíveis'
title: Comandos de barra
x-i18n:
    generated_at: "2026-05-11T20:37:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a9030d88abd04c395369f8f6587632b53f3249ea95a26726fb1f165dae2d0f6
    source_path: tools/slash-commands.md
    workflow: 16
---

Os comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **independente** que começa com `/`. O comando de chat bash somente no host usa `! <cmd>` (com `/bash <cmd>` como alias).

Quando uma conversa ou thread está vinculada a uma sessão ACP, o texto normal de acompanhamento é roteado para esse harness ACP. Os comandos de gerenciamento do Gateway continuam locais: `/acp ...` sempre chega ao manipulador de comandos ACP do OpenClaw, e `/status` mais `/unfocus` continuam locais sempre que o tratamento de comandos está habilitado para a superfície.

Há dois sistemas relacionados:

<AccordionGroup>
  <Accordion title="Comandos">
    Mensagens `/...` independentes.
  </Accordion>
  <Accordion title="Diretivas">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - As diretivas são removidas da mensagem antes que o modelo a veja.
    - Em mensagens normais de chat (não apenas diretivas), elas são tratadas como "dicas embutidas" e **não** persistem as configurações da sessão.
    - Em mensagens apenas com diretivas (a mensagem contém somente diretivas), elas persistem na sessão e respondem com uma confirmação.
    - As diretivas são aplicadas somente a **remetentes autorizados**. Se `commands.allowFrom` estiver definido, ele será a única allowlist usada; caso contrário, a autorização virá das allowlists/pareamento do canal mais `commands.useAccessGroups`. Remetentes não autorizados veem as diretivas tratadas como texto simples.

  </Accordion>
  <Accordion title="Atalhos embutidos">
    Somente remetentes em allowlist/autorizados: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  Habilita a análise de `/...` em mensagens de chat. Em superfícies sem comandos nativos (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), comandos de texto ainda funcionam mesmo se você definir isto como `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra comandos nativos. Auto: ativado para Discord/Telegram; desativado para Slack (até você adicionar comandos de barra); ignorado para provedores sem suporte nativo. Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para substituir por provedor (bool ou `"auto"`). No Discord, `false` pula o registro de comandos de barra e a limpeza durante a inicialização; comandos registrados anteriormente podem continuar visíveis até você removê-los do app do Discord. Comandos do Slack são gerenciados no app do Slack e não são removidos automaticamente.
</ParamField>
No Discord, especificações de comandos nativos podem incluir `descriptionLocalizations`, que o OpenClaw publica como `description_localizations` do Discord e inclui nas comparações de reconciliação.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de **skill** nativamente quando houver suporte. Auto: ativado para Discord/Telegram; desativado para Slack (o Slack exige criar um comando de barra por skill). Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para substituir por provedor (bool ou `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para executar comandos de shell do host (`/bash <cmd>` é um alias; requer allowlists de `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controla quanto tempo o bash espera antes de mudar para o modo em segundo plano (`0` coloca em segundo plano imediatamente).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lê/escreve `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lê/escreve a configuração MCP gerenciada pelo OpenClaw em `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descoberta/status de plugins mais controles de instalação + habilitar/desabilitar).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (substituições somente em runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` mais ações de ferramenta para reiniciar o Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Define a allowlist explícita de proprietário para superfícies de comandos/ferramentas somente de proprietário. Esta é a conta do operador humano que pode aprovar ações perigosas e executar comandos como `/diagnostics`, `/export-trajectory` e `/config`. Ela é separada de `commands.allowFrom` e do acesso por pareamento de DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: faz com que comandos somente de proprietário exijam **identidade de proprietário** para serem executados nessa superfície. Quando `true`, o remetente deve corresponder a um candidato a proprietário resolvido (por exemplo, uma entrada em `commands.ownerAllowFrom` ou metadados de proprietário nativos do provedor) ou ter o escopo interno `operator.admin` em um canal de mensagens interno. Uma entrada curinga em `allowFrom` do canal, ou uma lista vazia/não resolvida de candidatos a proprietário, **não** é suficiente — comandos somente de proprietário falham de forma fechada nesse canal. Deixe isso desativado se você quiser que comandos somente de proprietário sejam protegidos apenas por `ownerAllowFrom` e pelas allowlists padrão de comandos.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla como ids de proprietário aparecem no prompt do sistema.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcionalmente define o segredo HMAC usado quando `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist por provedor para autorização de comandos. Quando configurada, é a única fonte de autorização para comandos e diretivas (allowlists/pareamento de canal e `commands.useAccessGroups` são ignorados). Use `"*"` como padrão global; chaves específicas de provedor o substituem.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Impõe allowlists/políticas para comandos quando `commands.allowFrom` não está definido.
</ParamField>

## Lista de comandos

Fonte da verdade atual:

- comandos integrados do core vêm de `src/auto-reply/commands-registry.shared.ts`
- comandos dock gerados vêm de `src/auto-reply/commands-registry.data.ts`
- comandos de plugins vêm de chamadas `registerCommand()` de plugins
- a disponibilidade real no seu Gateway ainda depende de flags de configuração, superfície do canal e plugins instalados/habilitados

### Comandos integrados do core

<AccordionGroup>
  <Accordion title="Sessões e execuções">
    - `/new [model]` inicia uma nova sessão; `/reset` é o alias de redefinição.
    - A UI de controle intercepta `/new` digitado para criar e alternar para uma nova sessão de painel, exceto quando `session.dmScope: "main"` está configurado e o pai atual é a sessão principal do agente; nesse caso, `/new` redefine a sessão principal no lugar. `/reset` digitado ainda executa a redefinição no lugar do Gateway.
    - `/reset soft [message]` mantém a transcrição atual, descarta ids de sessão de backend CLI reutilizados e executa novamente o carregamento de inicialização/prompt do sistema no lugar.
    - `/compact [instructions]` compacta o contexto da sessão. Consulte [Compaction](/pt-BR/concepts/compaction).
    - `/stop` aborta a execução atual.
    - `/session idle <duration|off>` e `/session max-age <duration|off>` gerenciam a expiração do vínculo de thread.
    - `/export-session [path]` exporta a sessão atual para HTML. Alias: `/export`.
    - `/export-trajectory [path]` solicita aprovação de exec e depois exporta um [pacote de trajetória](/pt-BR/tools/trajectory) JSONL para a sessão atual. Use-o quando precisar da linha do tempo de prompt, ferramenta e transcrição para uma sessão do OpenClaw. Em chats de grupo, o prompt de aprovação e o resultado da exportação vão para o proprietário em privado. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Controles de modelo e execução">
    - `/think <level|default>` define o nível de pensamento ou limpa a substituição da sessão. As opções vêm do perfil do provedor do modelo ativo; níveis comuns são `off`, `minimal`, `low`, `medium` e `high`, com níveis personalizados como `xhigh`, `adaptive`, `max` ou o binário `on` somente onde houver suporte. Aliases: `/thinking`, `/t`.
    - `/verbose on|off|full` alterna a saída detalhada. Alias: `/v`.
    - `/trace on|off` alterna a saída de rastreamento de plugins para a sessão atual.
    - `/fast [status|on|off|default]` mostra, define ou limpa o modo rápido.
    - `/reasoning [on|off|stream]` alterna a visibilidade do reasoning. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` alterna o modo elevado. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra ou define os padrões de exec.
    - `/model [name|#|status]` mostra ou define o modelo.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` lista provedores configurados/com autenticação disponível ou modelos de um provedor; adicione `all` para navegar pelo catálogo completo desse provedor. Entradas `provider/*` em `agents.defaults.models` fazem `/model` e `/models` mostrar modelos descobertos apenas para esses provedores.
    - `/queue <mode>` gerencia o comportamento da fila (`steer`, legado `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) mais opções como `debounce:0.5s cap:25 drop:summarize`; `/queue default` ou `/queue reset` limpa a substituição da sessão. Consulte [Fila de comandos](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering).
    - `/steer <message>` injeta orientação na execução ativa para a sessão atual, independentemente do modo de `/queue`. Ele não inicia uma nova execução quando a sessão está ociosa. Alias: `/tell`. Consulte [Steer](/pt-BR/tools/steer).

  </Accordion>
  <Accordion title="Descoberta e status">
    - `/help` mostra o resumo curto de ajuda.
    - `/commands` mostra o catálogo de comandos gerado.
    - `/tools [compact|verbose]` mostra o que o agente atual pode usar agora.
    - `/status` mostra o status de execução/runtime, tempo de atividade do Gateway e do sistema, além de uso/cota do provedor quando disponível.
    - `/diagnostics [note]` é o fluxo de relatório de suporte somente de proprietário para bugs do Gateway e execuções do harness Codex. Ele solicita aprovação explícita de exec toda vez antes de executar `openclaw gateway diagnostics export --json`; não aprove diagnósticos com uma regra de permitir tudo. Após a aprovação, ele envia um relatório colável com o caminho local do pacote, resumo do manifesto, notas de privacidade e ids de sessão relevantes. Em chats de grupo, o prompt de aprovação e o relatório vão para o proprietário em privado. Quando a sessão ativa usa o harness OpenAI Codex, a mesma aprovação também envia feedback relevante do Codex para os servidores da OpenAI, e a resposta concluída lista os ids de sessão do OpenClaw, ids de thread do Codex e comandos `codex resume <thread-id>`. Consulte [Exportação de Diagnósticos](/pt-BR/gateway/diagnostics).
    - `/crestodian <request>` executa o auxiliar de configuração e reparo Crestodian a partir de uma DM do proprietário.
    - `/tasks` lista tarefas em segundo plano ativas/recentes para a sessão atual.
    - `/context [list|detail|map|json]` explica como o contexto é montado. `map` envia uma imagem de treemap do contexto da sessão atual.
    - `/whoami` mostra seu id de remetente. Alias: `/id`.
    - `/usage off|tokens|full|cost` controla o rodapé de uso por resposta ou imprime um resumo de custo local.

  </Accordion>
  <Accordion title="Skills, listas de permissões, aprovações">
    - `/skill <name> [input]` executa uma skill pelo nome.
    - `/allowlist [list|add|remove] ...` gerencia entradas da lista de permissões. Somente texto.
    - `/approve <id> <decision>` resolve prompts de aprovação de execução.
    - `/btw <question>` faz uma pergunta lateral sem alterar o contexto futuro da sessão. Alias: `/side`. Veja [BTW](/pt-BR/tools/btw).

  </Accordion>
  <Accordion title="Subagentes e ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gerencia execuções de subagentes para a sessão atual.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gerencia sessões ACP e opções de runtime.
    - `/focus <target>` vincula a thread atual do Discord ou tópico/conversa do Telegram a um destino de sessão.
    - `/unfocus` remove o vínculo atual.
    - `/agents` lista agentes vinculados à thread para a sessão atual.
    - `/kill <id|#|all>` aborta um ou todos os subagentes em execução.
    - `/subagents steer <id|#> <message>` envia direcionamento a um subagente em execução. Veja [Direcionar](/pt-BR/tools/steer).

  </Accordion>
  <Accordion title="Escritas exclusivas do proprietário e administração">
    - `/config show|get|set|unset` lê ou grava `openclaw.json`. Exclusivo do proprietário. Requer `commands.config: true`.
    - `/mcp show|get|set|unset` lê ou grava a configuração de servidor MCP gerenciada pelo OpenClaw em `mcp.servers`. Exclusivo do proprietário. Requer `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspeciona ou altera o estado de plugins. `/plugin` é um alias. Exclusivo do proprietário para escritas. Requer `commands.plugins: true`.
    - `/debug show|set|unset|reset` gerencia substituições de configuração somente de runtime. Exclusivo do proprietário. Requer `commands.debug: true`.
    - `/restart` reinicia o OpenClaw quando ativado. Padrão: ativado; defina `commands.restart: false` para desativá-lo.
    - `/send on|off|inherit` define a política de envio. Exclusivo do proprietário.

  </Accordion>
  <Accordion title="Voz, TTS, controle de canal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controla o TTS. Veja [TTS](/pt-BR/tools/tts).
    - `/activation mention|always` define o modo de ativação em grupo.
    - `/bash <command>` executa um comando de shell no host. Somente texto. Alias: `! <command>`. Requer `commands.bash: true` mais listas de permissões `tools.elevated`.
    - `!poll [sessionId]` verifica um job bash em segundo plano.
    - `!stop [sessionId]` interrompe um job bash em segundo plano.

  </Accordion>
</AccordionGroup>

### Comandos de dock gerados

Comandos de dock trocam a rota de resposta da sessão atual para outro
canal vinculado. Veja [Docking de canal](/pt-BR/concepts/channel-docking) para configuração,
exemplos e solução de problemas.

Comandos de dock são gerados a partir de plugins de canal com suporte a comando nativo. Conjunto atual incluído:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Use comandos de dock em uma conversa direta para trocar a rota de resposta da sessão atual para outro canal vinculado. O agente mantém o mesmo contexto de sessão, mas as respostas futuras dessa sessão são entregues ao par do canal selecionado.

Comandos de dock requerem `session.identityLinks`. O remetente de origem e o par de destino devem estar no mesmo grupo de identidade, por exemplo `["telegram:123", "discord:456"]`. Se um usuário do Telegram com id `123` enviar `/dock_discord`, o OpenClaw armazena `lastChannel: "discord"` e `lastTo: "456"` na sessão ativa. Se o remetente não estiver vinculado a um par do Discord, o comando responde com uma dica de configuração em vez de cair no chat normal.

Docking altera somente a rota da sessão ativa. Ele não cria contas de canal, concede acesso, contorna listas de permissões de canal nem move o histórico de transcrição para outra sessão. Use `/dock-telegram`, `/dock-slack`, `/dock-mattermost` ou outro comando de dock gerado para trocar a rota novamente.

### Comandos de plugins incluídos

Plugins incluídos podem adicionar mais comandos slash. Comandos incluídos atuais neste repo:

- `/dreaming [on|off|status|help]` alterna o dreaming de memória. Veja [Dreaming](/pt-BR/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gerencia o fluxo de pareamento/configuração de dispositivo. Veja [Pareamento](/pt-BR/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporariamente comandos de nó de telefone de alto risco.
- `/voice status|list [limit]|set <voiceId|name>` gerencia a configuração de voz do Talk. No Discord, o nome do comando nativo é `/talkvoice`.
- `/card ...` envia predefinições de rich card do LINE. Veja [LINE](/pt-BR/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspeciona e controla o harness de app-server Codex incluído. Veja [Harness do Codex](/pt-BR/plugins/codex-harness).
- Comandos exclusivos do QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinâmicos de skills

Skills invocáveis pelo usuário também são expostas como comandos slash:

- `/skill <name> [input]` sempre funciona como o ponto de entrada genérico.
- skills também podem aparecer como comandos diretos, como `/prose`, quando a skill/plugin os registra.
- o registro de comandos nativos de skills é controlado por `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.
- especificações de comando podem fornecer `descriptionLocalizations` para superfícies nativas que oferecem suporte a descrições localizadas, incluindo o Discord.

<AccordionGroup>
  <Accordion title="Notas sobre argumentos e parser">
    - Comandos aceitam um `:` opcional entre o comando e os argumentos (por exemplo, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência fuzzy); se não houver correspondência, o texto é tratado como o corpo da mensagem.
    - Para o detalhamento completo de uso por provedor, use `openclaw status --usage`.
    - `/allowlist add|remove` requer `commands.config=true` e respeita `configWrites` do canal.
    - Em canais com várias contas, `/allowlist --account <id>` direcionado à configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
    - `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo de custo local a partir dos logs de sessão do OpenClaw.
    - `/restart` é ativado por padrão; defina `commands.restart: false` para desativá-lo.
    - `/plugins install <spec>` aceita as mesmas especificações de plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm, `git:<repo>` ou `clawhub:<pkg>`, depois solicita uma reinicialização do Gateway porque os módulos de origem do plugin mudaram.
    - `/plugins enable|disable` atualiza a configuração de plugins e aciona o recarregamento de plugins do Gateway para novos turnos do agente.

  </Accordion>
  <Accordion title="Comportamento específico por canal">
    - Comando nativo exclusivo do Discord: `/vc join|leave|status` controla canais de voz (não disponível como texto). `join` requer um guild e um canal de voz/stage selecionado. Requer `channels.discord.voice` e comandos nativos.
    - Comandos de vinculação de thread do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requerem que vínculos efetivos de thread estejam ativados (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
    - Referência de comandos ACP e comportamento de runtime: [Agentes ACP](/pt-BR/tools/acp-agents).

  </Accordion>
  <Accordion title="Segurança de verbose / trace / fast / reasoning">
    - `/verbose` é destinado à depuração e visibilidade extra; mantenha-o **desativado** no uso normal.
    - `/trace` é mais estreito que `/verbose`: ele revela somente linhas de trace/depuração pertencentes a plugins e mantém o chatter normal de ferramentas em verbose desativado.
    - `/fast on|off` persiste uma substituição de sessão. Use a opção `inherit` da UI de Sessões para limpá-la e voltar aos padrões de configuração.
    - `/fast` é específico do provedor: OpenAI/OpenAI Codex mapeiam para `service_tier=priority` em endpoints Responses nativos, enquanto solicitações públicas diretas à Anthropic, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, mapeiam para `service_tier=auto` ou `standard_only`. Veja [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
    - Resumos de falha de ferramenta ainda são mostrados quando relevantes, mas o texto detalhado da falha só é incluído quando `/verbose` está `on` ou `full`.
    - `/reasoning`, `/verbose` e `/trace` são arriscados em ambientes de grupo: eles podem revelar raciocínio interno, saída de ferramentas ou diagnósticos de plugins que você não pretendia expor. Prefira deixá-los desativados, especialmente em chats em grupo.

  </Accordion>
  <Accordion title="Troca de modelo">
    - `/model` persiste o novo modelo da sessão imediatamente.
    - Se o agente estiver ocioso, a próxima execução o usa imediatamente.
    - Se uma execução já estiver ativa, o OpenClaw marca uma troca em tempo real como pendente e só reinicia no novo modelo em um ponto limpo de nova tentativa.
    - Se atividade de ferramenta ou saída de resposta já tiver começado, a troca pendente pode ficar enfileirada até uma oportunidade posterior de nova tentativa ou até o próximo turno do usuário.
    - Na TUI local, `/crestodian [request]` retorna da TUI normal do agente para o Crestodian. Isso é separado do modo de resgate de canal de mensagens e não concede autoridade remota de configuração.

  </Accordion>
  <Accordion title="Caminho rápido e atalhos inline">
    - **Caminho rápido:** mensagens somente de comando de remetentes na lista de permissões são tratadas imediatamente (contornam fila + modelo).
    - **Gating de menção em grupo:** mensagens somente de comando de remetentes na lista de permissões contornam requisitos de menção.
    - **Atalhos inline (somente remetentes na lista de permissões):** determinados comandos também funcionam quando incorporados em uma mensagem normal e são removidos antes que o modelo veja o texto restante.
      - Exemplo: `hey /status` aciona uma resposta de status, e o texto restante continua pelo fluxo normal.
    - Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Mensagens somente de comando não autorizadas são ignoradas silenciosamente, e tokens `/...` inline são tratados como texto simples.

  </Accordion>
  <Accordion title="Comandos de skills e argumentos nativos">
    - **Comandos de skills:** skills `user-invocable` são expostas como comandos slash. Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (por exemplo, `_2`).
      - `/skill <name> [input]` executa uma skill pelo nome (útil quando limites de comandos nativos impedem comandos por skill).
      - Por padrão, comandos de skills são encaminhados ao modelo como uma solicitação normal.
      - Skills podem opcionalmente declarar `command-dispatch: tool` para rotear o comando diretamente para uma ferramenta (determinístico, sem modelo).
      - Exemplo: `/prose` (plugin OpenProse) — veja [OpenProse](/pt-BR/prose).
    - **Argumentos de comando nativo:** o Discord usa autocomplete para opções dinâmicas (e menus de botão quando você omite argumentos obrigatórios). Telegram e Slack mostram um menu de botão quando um comando oferece suporte a escolhas e você omite o argumento. Escolhas dinâmicas são resolvidas contra o modelo da sessão de destino, portanto opções específicas de modelo, como níveis de `/think`, seguem a substituição de `/model` dessa sessão.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` responde a uma pergunta de runtime, não a uma pergunta de configuração: **o que este agente pode usar agora nesta conversa**.

- O `/tools` padrão é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies de comando nativo que oferecem suporte a argumentos expõem a mesma troca de modo que `compact|verbose`.
- Os resultados são escopados à sessão, portanto alterar agente, canal, thread, autorização do remetente ou modelo pode alterar a saída.
- `/tools` inclui ferramentas que são realmente alcançáveis em runtime, incluindo ferramentas principais, ferramentas de plugins conectados e ferramentas pertencentes a canais.

Para edição de perfil e substituição, use o painel Ferramentas da UI de Controle ou superfícies de configuração/catálogo em vez de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/cota do provedor** (exemplo: "Claude 80% left") aparece em `/status` para o provedor de modelo atual quando o rastreamento de uso está habilitado. O OpenClaw normaliza as janelas do provedor para `% left`; para o MiniMax, campos percentuais somente de restante são invertidos antes da exibição, e respostas `model_remains` preferem a entrada do modelo de chat mais um rótulo de plano marcado com o modelo.
- **Linhas de tokens/cache** em `/status` podem recorrer à entrada de uso mais recente da transcrição quando o snapshot da sessão ativa está escasso. Valores ativos existentes diferentes de zero ainda prevalecem, e o fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo mais um total maior orientado a prompt quando os totais armazenados estão ausentes ou são menores.
- **Execução vs runtime:** `/status` relata `Execution` para o caminho efetivo do sandbox e `Runtime` para quem está realmente executando a sessão: `OpenClaw Pi Default`, `OpenAI Codex`, um backend CLI ou um backend ACP.
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
- No Discord, `/model` e `/models` abrem um seletor interativo com dropdowns de provedor e modelo mais uma etapa de envio. O seletor respeita `agents.defaults.models`, incluindo entradas `provider/*`, para que a descoberta com escopo de provedor possa manter o seletor abaixo do limite de 25 opções de componentes do Discord.
- `/model <#>` seleciona a partir desse seletor (e prefere o provedor atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo o endpoint configurado do provedor (`baseUrl`) e o modo da API (`api`) quando disponíveis.

## Substituições de depuração

`/debug` permite definir substituições de configuração **somente de runtime** (memória, não disco). Somente proprietário. Desabilitado por padrão; habilite com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
As substituições se aplicam imediatamente a novas leituras de configuração, mas **não** gravam em `openclaw.json`. Use `/debug reset` para limpar todas as substituições e retornar à configuração em disco.
</Note>

## Saída de rastreamento de Plugin

`/trace` permite alternar **linhas de rastreamento/depuração de Plugin com escopo de sessão** sem ativar o modo detalhado completo.

Exemplos:

```text
/trace
/trace on
/trace off
```

Observações:

- `/trace` sem argumento mostra o estado atual de rastreamento da sessão.
- `/trace on` habilita linhas de rastreamento de Plugin para a sessão atual.
- `/trace off` as desabilita novamente.
- Linhas de rastreamento de Plugin podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento depois da resposta normal do assistente.
- `/trace` não substitui `/debug`; `/debug` ainda gerencia substituições de configuração somente de runtime.
- `/trace` não substitui `/verbose`; a saída detalhada normal de ferramentas/status ainda pertence a `/verbose`.

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

<Note>
A configuração é validada antes da gravação; alterações inválidas são rejeitadas. Atualizações de `/config` persistem entre reinicializações.
</Note>

## Atualizações de MCP

`/mcp` grava definições de servidor MCP gerenciadas pelo OpenClaw em `mcp.servers`. Somente proprietário. Desabilitado por padrão; habilite com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` armazena a configuração na configuração do OpenClaw, não nas configurações de projeto pertencentes ao Pi. Adaptadores de runtime decidem quais transportes são realmente executáveis.
</Note>

## Atualizações de Plugin

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
- `/plugins list` e `/plugins show` usam descoberta real de Plugin no workspace atual mais a configuração em disco.
- `/plugins install` instala a partir de ClawHub, npm, git, diretórios locais e arquivos compactados.
- `/plugins enable|disable` atualiza somente a configuração de Plugin; ele não instala nem desinstala plugins.
- Alterações de habilitar e desabilitar recarregam a quente as superfícies de runtime de Plugin do Gateway para novos turnos do agente; a instalação solicita uma reinicialização do Gateway porque os módulos-fonte do Plugin foram alterados.

</Note>

## Observações de superfície

<AccordionGroup>
  <Accordion title="Sessões por superfície">
    - **Comandos de texto** são executados na sessão de chat normal (DMs compartilham `main`, grupos têm sua própria sessão).
    - **Comandos nativos** usam sessões isoladas:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (direciona para a sessão de chat via `CommandTargetSessionKey`)
    - **`/stop`** direciona para a sessão de chat ativa para que possa abortar a execução atual.

  </Accordion>
  <Accordion title="Especificidades do Slack">
    `channels.slack.slashCommand` ainda é compatível para um único comando no estilo `/openclaw`. Se você habilitar `commands.native`, deverá criar um comando de barra do Slack por comando integrado (mesmos nomes que `/help`). Menus de argumentos de comando para Slack são entregues como botões efêmeros do Block Kit.

    Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O texto `/status` ainda funciona em mensagens do Slack.

  </Accordion>
</AccordionGroup>

## Perguntas laterais BTW

`/btw` é uma **pergunta lateral** rápida sobre a sessão atual. `/side` é um alias.

Ao contrário do chat normal:

- usa a sessão atual como contexto de fundo,
- em sessões do harness Codex, é executado como uma thread lateral efêmera do Codex com as
  permissões atuais do Codex e a superfície de ferramentas nativa,
- em sessões que não são Codex, mantém o comportamento mais antigo de chamada lateral direta e única,
- não altera o contexto futuro da sessão,
- não é gravado no histórico da transcrição,
- é entregue como um resultado lateral ao vivo em vez de uma mensagem normal do assistente.

Isso torna `/btw` útil quando você quer uma clarificação temporária enquanto a tarefa principal continua.

Exemplo:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Consulte [Perguntas Laterais BTW](/pt-BR/tools/btw) para ver o comportamento completo e os detalhes de UX do cliente.

## Relacionado

- [Criação de Skills](/pt-BR/tools/creating-skills)
- [Skills](/pt-BR/tools/skills)
- [Configuração de Skills](/pt-BR/tools/skills-config)
