---
read_when:
    - Usando ou configurando comandos de chat
    - Depuração do roteamento de comandos ou permissões
sidebarTitle: Slash commands
summary: 'Comandos de barra: texto versus nativos, configuração e comandos compatíveis'
title: Comandos de barra
x-i18n:
    generated_at: "2026-04-30T10:12:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

Comandos são tratados pelo Gateway. A maioria dos comandos deve ser enviada como uma mensagem **independente** que começa com `/`. O comando de chat bash somente no host usa `! <cmd>` (com `/bash <cmd>` como alias).

Quando uma conversa ou thread está vinculada a uma sessão ACP, o texto normal de acompanhamento é roteado para esse harness ACP. Os comandos de gerenciamento do Gateway ainda permanecem locais: `/acp ...` sempre chega ao manipulador de comandos ACP do OpenClaw, e `/status` mais `/unfocus` permanecem locais sempre que o tratamento de comandos está habilitado para a superfície.

Há dois sistemas relacionados:

<AccordionGroup>
  <Accordion title="Comandos">
    Mensagens `/...` independentes.
  </Accordion>
  <Accordion title="Diretivas">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - As diretivas são removidas da mensagem antes que o modelo a veja.
    - Em mensagens normais de chat (não apenas diretivas), elas são tratadas como "dicas inline" e **não** persistem configurações da sessão.
    - Em mensagens contendo apenas diretivas (a mensagem contém somente diretivas), elas persistem na sessão e respondem com uma confirmação.
    - As diretivas são aplicadas apenas para **remetentes autorizados**. Se `commands.allowFrom` estiver definido, ele será a única lista de permissões usada; caso contrário, a autorização vem das listas de permissões/pareamento do canal mais `commands.useAccessGroups`. Remetentes não autorizados veem as diretivas tratadas como texto simples.

  </Accordion>
  <Accordion title="Atalhos inline">
    Apenas remetentes em lista de permissões/autorizados: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  Registra comandos nativos. Auto: ativado para Discord/Telegram; desativado para Slack (até você adicionar comandos slash); ignorado para provedores sem suporte nativo. Defina `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` para sobrescrever por provedor (bool ou `"auto"`). `false` limpa comandos registrados anteriormente no Discord/Telegram durante a inicialização. Comandos do Slack são gerenciados no app Slack e não são removidos automaticamente.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra comandos de **skill** nativamente quando compatível. Auto: ativado para Discord/Telegram; desativado para Slack (Slack exige criar um comando slash por skill). Defina `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` para sobrescrever por provedor (bool ou `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Habilita `! <cmd>` para executar comandos de shell no host (`/bash <cmd>` é um alias; exige listas de permissões de `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controla por quanto tempo o bash espera antes de alternar para o modo em segundo plano (`0` coloca em segundo plano imediatamente).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Habilita `/config` (lê/grava `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Habilita `/mcp` (lê/grava a configuração MCP gerenciada pelo OpenClaw em `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Habilita `/plugins` (descoberta/status de plugins mais controles de instalação e ativação/desativação).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Habilita `/debug` (sobrescritas somente em runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Habilita `/restart` mais ações de ferramenta para reiniciar o Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Define a lista de permissões explícita do proprietário para superfícies de comando/ferramenta exclusivas do proprietário. Esta é a conta do operador humano que pode aprovar ações perigosas e executar comandos como `/diagnostics`, `/export-trajectory` e `/config`. Ela é separada de `commands.allowFrom` e do acesso por pareamento de DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Por canal: faz com que comandos exclusivos do proprietário exijam **identidade de proprietário** para serem executados nessa superfície. Quando `true`, o remetente deve corresponder a um candidato a proprietário resolvido (por exemplo, uma entrada em `commands.ownerAllowFrom` ou metadados de proprietário nativos do provedor) ou ter o escopo interno `operator.admin` em um canal de mensagens interno. Uma entrada curinga em `allowFrom` do canal, ou uma lista vazia/não resolvida de candidatos a proprietário, **não** é suficiente — comandos exclusivos do proprietário falham de modo fechado nesse canal. Deixe isso desativado se quiser que comandos exclusivos do proprietário sejam controlados apenas por `ownerAllowFrom` e pelas listas de permissões padrão de comandos.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controla como ids de proprietário aparecem no prompt do sistema.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Opcionalmente define o segredo HMAC usado quando `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Lista de permissões por provedor para autorização de comandos. Quando configurada, ela é a única fonte de autorização para comandos e diretivas (listas de permissões/pareamento de canal e `commands.useAccessGroups` são ignorados). Use `"*"` para um padrão global; chaves específicas de provedor o sobrescrevem.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Impõe listas de permissões/políticas para comandos quando `commands.allowFrom` não está definido.
</ParamField>

## Lista de comandos

Fonte da verdade atual:

- built-ins centrais vêm de `src/auto-reply/commands-registry.shared.ts`
- comandos de dock gerados vêm de `src/auto-reply/commands-registry.data.ts`
- comandos de Plugin vêm de chamadas `registerCommand()` de Plugin
- a disponibilidade real no seu gateway ainda depende de flags de configuração, superfície do canal e plugins instalados/habilitados

### Comandos built-in centrais

<AccordionGroup>
  <Accordion title="Sessões e execuções">
    - `/new [model]` inicia uma nova sessão; `/reset` é o alias de redefinição.
    - `/reset soft [message]` mantém a transcrição atual, descarta ids de sessão de backend CLI reutilizados e executa novamente o carregamento de inicialização/prompt do sistema no lugar.
    - `/compact [instructions]` compacta o contexto da sessão. Consulte [Compaction](/pt-BR/concepts/compaction).
    - `/stop` aborta a execução atual.
    - `/session idle <duration|off>` e `/session max-age <duration|off>` gerenciam a expiração do vínculo de thread.
    - `/export-session [path]` exporta a sessão atual para HTML. Alias: `/export`.
    - `/export-trajectory [path]` solicita aprovação de exec e então exporta um [pacote de trajetória](/pt-BR/tools/trajectory) JSONL para a sessão atual. Use quando precisar da linha do tempo de prompt, ferramenta e transcrição para uma sessão OpenClaw. Em chats de grupo, o prompt de aprovação e o resultado da exportação vão para o proprietário em privado. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Modelo e controles de execução">
    - `/think <level>` define o nível de pensamento. As opções vêm do perfil de provedor do modelo ativo; níveis comuns são `off`, `minimal`, `low`, `medium` e `high`, com níveis personalizados como `xhigh`, `adaptive`, `max` ou binário `on` apenas onde compatível. Aliases: `/thinking`, `/t`.
    - `/verbose on|off|full` alterna saída detalhada. Alias: `/v`.
    - `/trace on|off` alterna a saída de rastreamento de Plugin para a sessão atual.
    - `/fast [status|on|off]` mostra ou define o modo rápido.
    - `/reasoning [on|off|stream]` alterna a visibilidade do raciocínio. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` alterna o modo elevado. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra ou define padrões de exec.
    - `/model [name|#|status]` mostra ou define o modelo.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` lista provedores configurados/com autenticação disponível ou modelos de um provedor; adicione `all` para navegar pelo catálogo completo desse provedor.
    - `/queue <mode>` gerencia o comportamento da fila (`steer`, legado `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) mais opções como `debounce:0.5s cap:25 drop:summarize`; `/queue default` ou `/queue reset` limpa a sobrescrita da sessão. Consulte [Fila de comandos](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering).

  </Accordion>
  <Accordion title="Descoberta e status">
    - `/help` mostra o resumo curto de ajuda.
    - `/commands` mostra o catálogo de comandos gerado.
    - `/tools [compact|verbose]` mostra o que o agente atual pode usar agora.
    - `/status` mostra o status de execução/runtime, incluindo rótulos `Execution`/`Runtime` e uso/cota do provedor quando disponível.
    - `/diagnostics [note]` é o fluxo de relatório de suporte exclusivo do proprietário para bugs do Gateway e execuções do harness Codex. Ele solicita aprovação explícita de exec todas as vezes antes de executar `openclaw gateway diagnostics export --json`; não aprove diagnósticos com uma regra de permitir tudo. Após a aprovação, ele envia um relatório colável com o caminho do pacote local, resumo do manifesto, notas de privacidade e ids de sessão relevantes. Em chats de grupo, o prompt de aprovação e o relatório vão para o proprietário em privado. Quando a sessão ativa usa o harness OpenAI Codex, a mesma aprovação também envia feedback relevante do Codex para servidores OpenAI e a resposta concluída lista os ids de sessão OpenClaw, ids de thread Codex e comandos `codex resume <thread-id>`. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics).
    - `/crestodian <request>` executa o auxiliar de configuração e reparo Crestodian a partir de uma DM do proprietário.
    - `/tasks` lista tarefas em segundo plano ativas/recentes da sessão atual.
    - `/context [list|detail|json]` explica como o contexto é montado.
    - `/whoami` mostra seu id de remetente. Alias: `/id`.
    - `/usage off|tokens|full|cost` controla o rodapé de uso por resposta ou imprime um resumo local de custo.

  </Accordion>
  <Accordion title="Skills, listas de permissões, aprovações">
    - `/skill <name> [input]` executa uma skill pelo nome.
    - `/allowlist [list|add|remove] ...` gerencia entradas da lista de permissões. Somente texto.
    - `/approve <id> <decision>` resolve prompts de aprovação de exec.
    - `/btw <question>` faz uma pergunta paralela sem alterar o contexto futuro da sessão. Consulte [BTW](/pt-BR/tools/btw).

  </Accordion>
  <Accordion title="Subagentes e ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gerencia execuções de subagentes para a sessão atual.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gerencia sessões ACP e opções de runtime.
    - `/focus <target>` vincula a thread atual do Discord ou tópico/conversa do Telegram a um alvo de sessão.
    - `/unfocus` remove o vínculo atual.
    - `/agents` lista agentes vinculados a threads para a sessão atual.
    - `/kill <id|#|all>` aborta um ou todos os subagentes em execução.
    - `/steer <id|#> <message>` envia direcionamento para um subagente em execução. Alias: `/tell`.

  </Accordion>
  <Accordion title="Gravações somente pelo proprietário e administração">
    - `/config show|get|set|unset` lê ou grava `openclaw.json`. Somente proprietário. Requer `commands.config: true`.
    - `/mcp show|get|set|unset` lê ou grava a configuração de servidor MCP gerenciado pelo OpenClaw em `mcp.servers`. Somente proprietário. Requer `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspeciona ou altera o estado de plugins. `/plugin` é um alias. Somente proprietário para gravações. Requer `commands.plugins: true`.
    - `/debug show|set|unset|reset` gerencia substituições de configuração somente em tempo de execução. Somente proprietário. Requer `commands.debug: true`.
    - `/restart` reinicia o OpenClaw quando habilitado. Padrão: habilitado; defina `commands.restart: false` para desabilitá-lo.
    - `/send on|off|inherit` define a política de envio. Somente proprietário.

  </Accordion>
  <Accordion title="Voz, TTS, controle de canal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controla TTS. Consulte [TTS](/pt-BR/tools/tts).
    - `/activation mention|always` define o modo de ativação em grupo.
    - `/bash <command>` executa um comando de shell no host. Somente texto. Alias: `! <command>`. Requer `commands.bash: true` mais listas de permissões de `tools.elevated`.
    - `!poll [sessionId]` verifica uma tarefa bash em segundo plano.
    - `!stop [sessionId]` interrompe uma tarefa bash em segundo plano.

  </Accordion>
</AccordionGroup>

### Comandos de dock gerados

Os comandos de dock alternam a rota de resposta da sessão atual para outro
canal vinculado. Consulte [Docking de canal](/pt-BR/concepts/channel-docking) para configuração,
exemplos e solução de problemas.

Comandos de dock são gerados a partir de plugins de canal com suporte a comandos nativos. Conjunto integrado atual:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Use comandos de dock em uma conversa direta para alternar a rota de resposta da sessão atual para outro canal vinculado. O agente mantém o mesmo contexto de sessão, mas respostas futuras dessa sessão são entregues ao par de canal selecionado.

Comandos de dock exigem `session.identityLinks`. O remetente de origem e o par de destino devem estar no mesmo grupo de identidade, por exemplo `["telegram:123", "discord:456"]`. Se um usuário do Telegram com id `123` enviar `/dock_discord`, o OpenClaw armazena `lastChannel: "discord"` e `lastTo: "456"` na sessão ativa. Se o remetente não estiver vinculado a um par do Discord, o comando responde com uma dica de configuração em vez de continuar para o chat normal.

Docking altera somente a rota da sessão ativa. Ele não cria contas de canal, concede acesso, ignora listas de permissões de canal nem move o histórico da transcrição para outra sessão. Use `/dock-telegram`, `/dock-slack`, `/dock-mattermost` ou outro comando de dock gerado para alternar a rota novamente.

### Comandos de plugins integrados

Plugins integrados podem adicionar mais comandos de barra. Comandos integrados atuais neste repositório:

- `/dreaming [on|off|status|help]` alterna o Dreaming de memória. Consulte [Dreaming](/pt-BR/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gerencia o fluxo de emparelhamento/configuração de dispositivo. Consulte [Emparelhamento](/pt-BR/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporariamente comandos de nó de telefone de alto risco.
- `/voice status|list [limit]|set <voiceId|name>` gerencia a configuração de voz Talk. No Discord, o nome do comando nativo é `/talkvoice`.
- `/card ...` envia predefinições de cartão avançado do LINE. Consulte [LINE](/pt-BR/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspeciona e controla o harness do servidor de app Codex integrado. Consulte [Harness do Codex](/pt-BR/plugins/codex-harness).
- Comandos somente para QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandos dinâmicos de Skills

Skills invocáveis pelo usuário também são expostos como comandos de barra:

- `/skill <name> [input]` sempre funciona como o ponto de entrada genérico.
- Skills também podem aparecer como comandos diretos, como `/prose`, quando o Skill/plugin os registra.
- o registro de comandos nativos de Skills é controlado por `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Notas sobre argumentos e parser">
    - Comandos aceitam um `:` opcional entre o comando e os argumentos (por exemplo, `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` aceita um alias de modelo, `provider/model` ou um nome de provedor (correspondência aproximada); se não houver correspondência, o texto é tratado como o corpo da mensagem.
    - Para a análise completa de uso por provedor, use `openclaw status --usage`.
    - `/allowlist add|remove` exige `commands.config=true` e respeita `configWrites` do canal.
    - Em canais com várias contas, `/allowlist --account <id>` direcionado à configuração e `/config set channels.<provider>.accounts.<id>...` também respeitam `configWrites` da conta de destino.
    - `/usage` controla o rodapé de uso por resposta; `/usage cost` imprime um resumo de custo local a partir dos logs de sessão do OpenClaw.
    - `/restart` é habilitado por padrão; defina `commands.restart: false` para desabilitá-lo.
    - `/plugins install <spec>` aceita as mesmas especificações de plugin que `openclaw plugins install`: caminho/arquivo local, pacote npm ou `clawhub:<pkg>`.
    - `/plugins enable|disable` atualiza a configuração de plugin e pode solicitar uma reinicialização.

  </Accordion>
  <Accordion title="Comportamento específico de canal">
    - Comando nativo somente do Discord: `/vc join|leave|status` controla canais de voz (não disponível como texto). `join` exige um servidor e um canal de voz/palco selecionado. Requer `channels.discord.voice` e comandos nativos.
    - Comandos de vinculação de threads do Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigem que vinculações efetivas de threads estejam habilitadas (`session.threadBindings.enabled` e/ou `channels.discord.threadBindings.enabled`).
    - Referência de comandos ACP e comportamento em tempo de execução: [Agentes ACP](/pt-BR/tools/acp-agents).

  </Accordion>
  <Accordion title="Segurança de verboso / rastreamento / rápido / raciocínio">
    - `/verbose` é destinado à depuração e visibilidade extra; mantenha-o **desligado** no uso normal.
    - `/trace` é mais restrito que `/verbose`: ele revela apenas linhas de rastreamento/depuração pertencentes a plugins e mantém desativado o ruído verboso normal de ferramentas.
    - `/fast on|off` persiste uma substituição de sessão. Use a opção `inherit` da UI de Sessões para limpá-la e voltar aos padrões de configuração.
    - `/fast` é específico do provedor: OpenAI/OpenAI Codex o mapeiam para `service_tier=priority` em endpoints Responses nativos, enquanto solicitações públicas diretas da Anthropic, incluindo tráfego autenticado por OAuth enviado para `api.anthropic.com`, o mapeiam para `service_tier=auto` ou `standard_only`. Consulte [OpenAI](/pt-BR/providers/openai) e [Anthropic](/pt-BR/providers/anthropic).
    - Resumos de falhas de ferramentas ainda são mostrados quando relevantes, mas o texto detalhado da falha só é incluído quando `/verbose` está `on` ou `full`.
    - `/reasoning`, `/verbose` e `/trace` são arriscados em ambientes de grupo: eles podem revelar raciocínio interno, saída de ferramentas ou diagnósticos de plugins que você não pretendia expor. Prefira mantê-los desligados, especialmente em chats em grupo.

  </Accordion>
  <Accordion title="Troca de modelo">
    - `/model` persiste o novo modelo da sessão imediatamente.
    - Se o agente estiver ocioso, a próxima execução o usa imediatamente.
    - Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo modelo em um ponto de nova tentativa limpo.
    - Se a atividade de ferramentas ou a saída de resposta já tiver começado, a troca pendente pode permanecer enfileirada até uma oportunidade posterior de nova tentativa ou o próximo turno do usuário.
    - Na TUI local, `/crestodian [request]` retorna da TUI normal do agente para o Crestodian. Isso é separado do modo de resgate de canal de mensagens e não concede autoridade remota de configuração.

  </Accordion>
  <Accordion title="Caminho rápido e atalhos inline">
    - **Caminho rápido:** mensagens somente com comandos de remetentes na lista de permissões são tratadas imediatamente (ignorando fila + modelo).
    - **Filtro de menção em grupo:** mensagens somente com comandos de remetentes na lista de permissões ignoram requisitos de menção.
    - **Atalhos inline (somente remetentes na lista de permissões):** certos comandos também funcionam quando incorporados a uma mensagem normal e são removidos antes que o modelo veja o texto restante.
      - Exemplo: `hey /status` aciona uma resposta de status, e o texto restante continua pelo fluxo normal.
    - Atualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Mensagens não autorizadas somente com comandos são ignoradas silenciosamente, e tokens `/...` inline são tratados como texto simples.

  </Accordion>
  <Accordion title="Comandos de Skills e argumentos nativos">
    - **Comandos de Skills:** Skills `user-invocable` são expostos como comandos de barra. Os nomes são sanitizados para `a-z0-9_` (máx. 32 caracteres); colisões recebem sufixos numéricos (por exemplo, `_2`).
      - `/skill <name> [input]` executa um Skill pelo nome (útil quando limites de comandos nativos impedem comandos por Skill).
      - Por padrão, comandos de Skills são encaminhados ao modelo como uma solicitação normal.
      - Skills podem opcionalmente declarar `command-dispatch: tool` para rotear o comando diretamente para uma ferramenta (determinístico, sem modelo).
      - Exemplo: `/prose` (plugin OpenProse) — consulte [OpenProse](/pt-BR/prose).
    - **Argumentos de comandos nativos:** Discord usa preenchimento automático para opções dinâmicas (e menus de botão quando você omite argumentos obrigatórios). Telegram e Slack mostram um menu de botões quando um comando oferece escolhas e você omite o argumento. Escolhas dinâmicas são resolvidas contra o modelo da sessão de destino, então opções específicas de modelo, como níveis de `/think`, seguem a substituição de `/model` dessa sessão.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` responde a uma pergunta de tempo de execução, não a uma pergunta de configuração: **o que este agente pode usar agora nesta conversa**.

- O `/tools` padrão é compacto e otimizado para leitura rápida.
- `/tools verbose` adiciona descrições curtas.
- Superfícies de comandos nativos que oferecem suporte a argumentos expõem a mesma troca de modo como `compact|verbose`.
- Os resultados são escopados à sessão, então alterar agente, canal, thread, autorização do remetente ou modelo pode alterar a saída.
- `/tools` inclui ferramentas que são realmente alcançáveis em tempo de execução, incluindo ferramentas principais, ferramentas de plugins conectados e ferramentas pertencentes ao canal.

Para edição de perfis e substituições, use o painel Ferramentas da UI de Controle ou superfícies de configuração/catálogo em vez de tratar `/tools` como um catálogo estático.

## Superfícies de uso (o que aparece onde)

- **Uso/cota do provedor** (exemplo: "Claude 80% left") aparece em `/status` para o provedor do modelo atual quando o rastreamento de uso está habilitado. O OpenClaw normaliza janelas de provedor para `% left`; para MiniMax, campos de porcentagem somente de restante são invertidos antes da exibição, e respostas `model_remains` preferem a entrada do modelo de chat mais um rótulo de plano com tag de modelo.
- **Linhas de tokens/cache** em `/status` podem recorrer à entrada de uso de transcrição mais recente quando o snapshot da sessão ao vivo está esparso. Valores ao vivo existentes e não zero ainda vencem, e o fallback de transcrição também pode recuperar o rótulo do modelo de runtime ativo mais um total maior orientado a prompt quando os totais armazenados estiverem ausentes ou menores.
- **Execução vs runtime:** `/status` informa `Execution` para o caminho efetivo de sandbox e `Runtime` para quem está realmente executando a sessão: `OpenClaw Pi Default`, `OpenAI Codex`, um backend de CLI ou um backend ACP.
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

Notas:

- `/model` e `/model list` mostram um seletor compacto e numerado (família de modelos + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo, além de uma etapa Enviar.
- `/model <#>` seleciona a partir desse seletor (e prefere o provedor atual quando possível).
- `/model status` mostra a visualização detalhada, incluindo o endpoint configurado do provedor (`baseUrl`) e o modo de API (`api`) quando disponíveis.

## Substituições de depuração

`/debug` permite definir substituições de configuração **apenas em tempo de execução** (memória, não disco). Apenas proprietário. Desativado por padrão; habilite com `commands.debug: true`.

Exemplos:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
As substituições se aplicam imediatamente a novas leituras de configuração, mas **não** são gravadas em `openclaw.json`. Use `/debug reset` para limpar todas as substituições e voltar à configuração no disco.
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
- Linhas de rastreamento de Plugin podem aparecer em `/status` e como uma mensagem diagnóstica de acompanhamento após a resposta normal do assistente.
- `/trace` não substitui `/debug`; `/debug` ainda gerencia substituições de configuração apenas em tempo de execução.
- `/trace` não substitui `/verbose`; a saída detalhada normal de ferramentas/status ainda pertence a `/verbose`.

## Atualizações de configuração

`/config` grava na sua configuração no disco (`openclaw.json`). Apenas proprietário. Desativado por padrão; habilite com `commands.config: true`.

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

`/mcp` grava definições de servidores MCP gerenciadas pelo OpenClaw em `mcp.servers`. Apenas proprietário. Desativado por padrão; habilite com `commands.mcp: true`.

Exemplos:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` armazena a configuração na configuração do OpenClaw, não nas configurações de projeto pertencentes ao Pi. Adaptadores de tempo de execução decidem quais transportes são realmente executáveis.
</Note>

## Atualizações de Plugin

`/plugins` permite que operadores inspecionem plugins descobertos e alternem a ativação na configuração. Fluxos somente leitura podem usar `/plugin` como alias. Desativado por padrão; habilite com `commands.plugins: true`.

Exemplos:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` e `/plugins show` usam a descoberta real de plugins no workspace atual mais a configuração no disco.
- `/plugins enable|disable` atualiza apenas a configuração de Plugin; ele não instala nem desinstala plugins.
- Após alterações de habilitação/desabilitação, reinicie o gateway para aplicá-las.

</Note>

## Observações de superfície

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **Comandos de texto** são executados na sessão de chat normal (DMs compartilham `main`, grupos têm sua própria sessão).
    - **Comandos nativos** usam sessões isoladas:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefixo configurável via `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (direciona para a sessão de chat via `CommandTargetSessionKey`)
    - **`/stop`** mira a sessão de chat ativa para que possa abortar a execução atual.

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` ainda é compatível com um único comando no estilo `/openclaw`. Se você habilitar `commands.native`, deve criar um comando de barra do Slack para cada comando integrado (os mesmos nomes de `/help`). Menus de argumentos de comando para Slack são entregues como botões efêmeros do Block Kit.

    Exceção nativa do Slack: registre `/agentstatus` (não `/status`) porque o Slack reserva `/status`. O texto `/status` ainda funciona em mensagens do Slack.

  </Accordion>
</AccordionGroup>

## Perguntas paralelas BTW

`/btw` é uma **pergunta paralela** rápida sobre a sessão atual.

Diferente do chat normal:

- usa a sessão atual como contexto de fundo,
- é executado como uma chamada única separada **sem ferramentas**,
- não altera o contexto futuro da sessão,
- não é gravado no histórico de transcrição,
- é entregue como um resultado paralelo ao vivo em vez de uma mensagem normal do assistente.

Isso torna `/btw` útil quando você quer uma clarificação temporária enquanto a tarefa principal continua em andamento.

Exemplo:

```text
/btw what are we doing right now?
```

Consulte [Perguntas paralelas BTW](/pt-BR/tools/btw) para o comportamento completo e os detalhes de UX do cliente.

## Relacionados

- [Criando Skills](/pt-BR/tools/creating-skills)
- [Skills](/pt-BR/tools/skills)
- [Configuração de Skills](/pt-BR/tools/skills-config)
